# 对账异常处理流程

本文档详细说明VIP会员支付系统中对账异常的识别、处理和恢复流程。

## 目录

1. [概述](#概述)
2. [异常类型分类](#异常类型分类)
3. [异常检测机制](#异常检测机制)
4. [异常处理流程](#异常处理流程)
5. [告警机制](#告警机制)
6. [人工干预指南](#人工干预指南)
7. [数据修复操作](#数据修复操作)
8. [预防措施](#预防措施)
9. [常见问题排查](#常见问题排查)

---

## 概述

对账服务是VIP支付系统的核心组件，负责确保本地订单状态与支付平台状态的一致性。当出现异常时，需要及时识别、处理和恢复，以保障用户权益和系统稳定性。

### 对账服务架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        对账服务 (ReconciliationService)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  定时触发器   │───▶│  订单查询    │───▶│  状态同步    │       │
│  │  (每5分钟)   │    │  (待对账)    │    │  (支付平台)  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                 │                │
│                                                 ▼                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  告警通知    │◀───│  异常检测    │◀───│  结果处理    │       │
│  │  (管理员)    │    │  (错误分类)  │    │  (状态更新)  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 核心文件位置

| 文件 | 说明 |
|------|------|
| `backend/src/services/reconciliation/reconciliationService.ts` | 对账服务主逻辑 |
| `backend/src/tasks/reconciliation.ts` | 对账定时任务 |
| `backend/src/services/order/vipOrderService.ts` | 订单服务 |
| `backend/src/services/payment/paymentGateway.ts` | 支付网关 |

---

## 异常类型分类

### 1. 网络异常

| 异常代码 | 描述 | 严重程度 | 自动恢复 |
|---------|------|---------|---------|
| `NETWORK_TIMEOUT` | 支付平台接口超时 | 中 | ✅ 重试 |
| `NETWORK_ERROR` | 网络连接失败 | 中 | ✅ 重试 |
| `SSL_ERROR` | SSL证书验证失败 | 高 | ❌ 需人工 |

### 2. 支付平台异常

| 异常代码 | 描述 | 严重程度 | 自动恢复 |
|---------|------|---------|---------|
| `PLATFORM_MAINTENANCE` | 支付平台维护中 | 中 | ✅ 延迟重试 |
| `INVALID_SIGNATURE` | 签名验证失败 | 高 | ❌ 需人工 |
| `ORDER_NOT_FOUND` | 支付平台订单不存在 | 高 | ⚠️ 需确认 |
| `RATE_LIMIT` | 接口调用频率限制 | 低 | ✅ 延迟重试 |

### 3. 数据异常

| 异常代码 | 描述 | 严重程度 | 自动恢复 |
|---------|------|---------|---------|
| `STATUS_MISMATCH` | 本地与平台状态不一致 | 高 | ⚠️ 需确认 |
| `AMOUNT_MISMATCH` | 金额不一致 | 严重 | ❌ 需人工 |
| `DUPLICATE_CALLBACK` | 重复回调处理 | 低 | ✅ 幂等处理 |
| `MISSING_VIP_ORDER` | VIP订单信息缺失 | 高 | ❌ 需人工 |

### 4. 业务异常

| 异常代码 | 描述 | 严重程度 | 自动恢复 |
|---------|------|---------|---------|
| `VIP_ACTIVATION_FAILED` | VIP开通失败 | 严重 | ❌ 需人工 |
| `USER_NOT_FOUND` | 用户不存在 | 高 | ❌ 需人工 |
| `PACKAGE_NOT_FOUND` | 套餐不存在 | 高 | ❌ 需人工 |

---

## 异常检测机制

### 自动检测

对账服务在执行过程中自动检测以下异常：

```typescript
// 对账结果结构
interface ReconciliationResult {
  totalChecked: number;    // 检查的订单总数
  synced: number;          // 成功同步的订单数
  cancelled: number;       // 取消的订单数
  errors: ReconciliationError[];  // 错误列表
  executedAt: Date;        // 执行时间
}

// 错误记录结构
interface ReconciliationError {
  orderNo: string;         // 订单号
  error: string;           // 错误信息
  retryCount: number;      // 重试次数
}
```

### 检测规则

1. **超时检测**: 订单创建超过15分钟未支付
2. **状态不一致检测**: 本地待支付但平台已支付
3. **重试上限检测**: 同一订单重试超过3次
4. **批量异常检测**: 单次对账错误数超过阈值

### 日志记录

所有异常都会记录到安全日志表：

```sql
-- 对账日志记录
INSERT INTO security_logs (
  event_type,
  event_data,
  risk_level,
  action_taken
) VALUES (
  'reconciliation',
  '{"totalChecked": 10, "synced": 2, "cancelled": 1, "errorCount": 1, "errors": [...]}',
  'medium',  -- 根据错误数量判断
  'logged'
);
```

---

## 异常处理流程

### 流程图

```
                    ┌─────────────────┐
                    │   检测到异常    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   异常分类判断   │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  可自动恢复   │  │  需确认处理   │  │  需人工干预   │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  加入重试队列 │  │  记录待处理   │  │  发送告警    │
    │  (最多3次)   │  │  人工确认    │  │  暂停处理    │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  重试成功?   │  │  管理员确认   │  │  人工处理    │
    │  是→完成     │  │  后自动处理   │  │  修复数据    │
    │  否→告警     │  └──────────────┘  └──────────────┘
    └──────────────┘
```

### 处理步骤详解

#### 步骤1: 异常捕获

```typescript
try {
  const syncResult = await this.syncOrderStatus(order.order_no);
  // 处理成功
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : '未知错误';
  // 进入异常处理流程
}
```

#### 步骤2: 异常分类

```typescript
function classifyError(error: string): ErrorCategory {
  if (error.includes('ETIMEDOUT') || error.includes('ECONNREFUSED')) {
    return 'NETWORK';
  }
  if (error.includes('签名') || error.includes('signature')) {
    return 'SECURITY';
  }
  if (error.includes('不存在') || error.includes('not found')) {
    return 'DATA';
  }
  return 'UNKNOWN';
}
```

#### 步骤3: 重试机制

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,           // 最大重试次数
  retryIntervalMs: 60000,  // 重试间隔（1分钟）
};

// 重试队列管理
private retryQueue: Map<string, { count: number; lastAttempt: number }> = new Map();

// 加入重试队列
if (retryInfo.count < RETRY_CONFIG.maxRetries) {
  this.retryQueue.set(order.order_no, {
    count: retryInfo.count + 1,
    lastAttempt: Date.now(),
  });
}
```

#### 步骤4: 告警触发

当满足以下条件时触发告警：

- 单个订单重试次数达到上限（3次）
- 单次对账错误数超过10个
- 检测到严重异常（金额不一致、签名失败等）

---

## 告警机制

### 告警级别

| 级别 | 触发条件 | 通知方式 | 响应时间 |
|------|---------|---------|---------|
| 严重 | 金额不一致、签名失败 | 即时通知 | 15分钟内 |
| 高 | VIP开通失败、数据缺失 | 即时通知 | 30分钟内 |
| 中 | 网络异常、重试上限 | 汇总通知 | 2小时内 |
| 低 | 重复回调、超时取消 | 日报汇总 | 24小时内 |

### 告警内容模板

```
【VIP支付系统告警】

告警级别: 严重
告警时间: 2025-12-26 14:30:00
异常类型: 金额不一致

订单信息:
- 订单号: VIP20251226143000001
- 用户ID: user_xxx
- 本地金额: 99.00元
- 平台金额: 199.00元

处理建议:
1. 立即暂停该订单的自动处理
2. 核实支付平台实际交易记录
3. 联系用户确认支付情况
4. 根据核实结果手动修复数据

操作入口: https://admin.example.com/vip/orders/VIP20251226143000001
```

### 告警通知实现

```typescript
async function sendReconciliationAlert(
  level: 'critical' | 'high' | 'medium' | 'low',
  orderNo: string,
  errorType: string,
  details: Record<string, unknown>
): Promise<void> {
  // 记录到安全日志
  await prisma.security_logs.create({
    data: {
      event_type: 'reconciliation_alert',
      event_data: {
        level,
        orderNo,
        errorType,
        details,
        timestamp: new Date().toISOString(),
      },
      risk_level: level === 'critical' ? 'high' : level,
      action_taken: 'alert_sent',
    },
  });

  // 发送站内信给管理员
  const admins = await getAdminUsers();
  for (const admin of admins) {
    await notificationService.sendNotification({
      userId: admin.user_id,
      title: `【对账告警】${errorType}`,
      content: formatAlertContent(level, orderNo, errorType, details),
      type: 'system',
      linkUrl: `/admin/vip/orders/${orderNo}`,
    });
  }

  // 严重告警可扩展：发送邮件、短信、钉钉等
  if (level === 'critical') {
    // await sendEmailAlert(...);
    // await sendSmsAlert(...);
  }
}
```

---

## 人工干预指南

### 何时需要人工干预

1. **金额不一致**: 本地订单金额与支付平台不符
2. **签名验证失败**: 可能存在安全风险
3. **VIP开通失败**: 用户已付款但VIP未生效
4. **重试上限**: 自动重试3次仍失败
5. **数据缺失**: 订单关联信息不完整

### 人工处理步骤

#### 场景1: 用户已付款但VIP未开通

```
1. 登录管理后台
2. 进入 VIP订单管理 > 异常订单
3. 找到对应订单，查看详情
4. 核实支付平台交易记录
5. 确认无误后，点击"手动开通VIP"
6. 系统自动更新订单状态和用户VIP信息
7. 发送通知告知用户
```

#### 场景2: 金额不一致

```
1. 暂停该订单的自动处理
2. 导出支付平台交易明细
3. 对比本地订单记录
4. 确定正确金额
5. 如果平台金额正确：
   - 修复本地订单金额
   - 重新执行对账
6. 如果本地金额正确：
   - 联系支付平台核实
   - 必要时发起退款重新支付
7. 记录处理过程和结论
```

#### 场景3: 签名验证失败

```
1. 立即暂停相关订单处理
2. 检查证书配置是否正确
3. 验证证书是否过期
4. 检查是否存在中间人攻击迹象
5. 如果是配置问题：
   - 更新证书配置
   - 重启服务
   - 重新执行对账
6. 如果疑似攻击：
   - 保留日志证据
   - 联系安全团队
   - 必要时报警处理
```

### 管理后台操作

#### 查看异常订单

```sql
-- 查询对账异常订单
SELECT 
  o.order_no,
  o.user_id,
  o.amount,
  o.payment_status,
  o.payment_method,
  o.created_at,
  sl.event_data->>'error' as error_message,
  sl.created_at as error_time
FROM orders o
LEFT JOIN security_logs sl ON sl.event_data->>'orderNo' = o.order_no
WHERE sl.event_type = 'reconciliation'
  AND sl.risk_level IN ('high', 'medium')
  AND sl.created_at > NOW() - INTERVAL '24 hours'
ORDER BY sl.created_at DESC;
```

#### 手动触发单订单对账

```bash
# 通过API触发
curl -X POST "https://api.example.com/api/v1/admin/reconciliation/manual" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"orderNo": "VIP20251226143000001"}'
```

---

## 数据修复操作

### 修复前准备

1. **备份数据**: 修复前务必备份相关数据
2. **确认权限**: 确保有足够的数据库操作权限
3. **通知相关人员**: 告知运维和客服团队
4. **准备回滚方案**: 制定修复失败的回滚计划

### 常见修复场景

#### 修复1: 订单状态不一致

```sql
-- 1. 备份原数据
CREATE TABLE orders_backup_20251226 AS
SELECT * FROM orders WHERE order_no = 'VIP20251226143000001';

-- 2. 更新订单状态
UPDATE orders
SET 
  payment_status = 1,  -- 已支付
  transaction_id = 'wx_transaction_xxx',
  paid_at = NOW(),
  updated_at = NOW()
WHERE order_no = 'VIP20251226143000001'
  AND payment_status = 0;

-- 3. 验证更新结果
SELECT * FROM orders WHERE order_no = 'VIP20251226143000001';
```

#### 修复2: VIP状态未更新

```sql
-- 1. 查询订单和用户信息
SELECT 
  o.order_no,
  o.user_id,
  o.payment_status,
  vo.package_id,
  vp.duration_days,
  u.vip_level,
  u.vip_expire_at
FROM orders o
JOIN vip_orders vo ON o.order_id = vo.order_id
JOIN vip_packages vp ON vo.package_id = vp.package_id
JOIN users u ON o.user_id = u.user_id
WHERE o.order_no = 'VIP20251226143000001';

-- 2. 备份用户数据
CREATE TABLE users_backup_20251226 AS
SELECT * FROM users WHERE user_id = 'user_xxx';

-- 3. 更新用户VIP状态
UPDATE users
SET 
  vip_level = 1,
  vip_expire_at = CASE 
    WHEN vip_expire_at IS NULL OR vip_expire_at < NOW() 
    THEN NOW() + INTERVAL '30 days'
    ELSE vip_expire_at + INTERVAL '30 days'
  END,
  vip_activated_at = COALESCE(vip_activated_at, NOW()),
  updated_at = NOW()
WHERE user_id = 'user_xxx';

-- 4. 验证更新结果
SELECT user_id, vip_level, vip_expire_at FROM users WHERE user_id = 'user_xxx';
```

#### 修复3: 回调记录缺失

```sql
-- 补录回调记录
INSERT INTO payment_callbacks (
  order_no,
  channel,
  transaction_id,
  callback_data,
  signature_valid,
  processed,
  process_result,
  created_at
) VALUES (
  'VIP20251226143000001',
  'wechat',
  'wx_transaction_xxx',
  '{"manual_fix": true, "reason": "对账修复", "operator": "admin_xxx"}',
  true,
  true,
  'manual_fixed',
  NOW()
);
```

### 修复后验证

```sql
-- 验证订单状态
SELECT 
  o.order_no,
  o.payment_status,
  o.transaction_id,
  u.vip_level,
  u.vip_expire_at,
  pc.process_result
FROM orders o
JOIN users u ON o.user_id = u.user_id
LEFT JOIN payment_callbacks pc ON o.order_no = pc.order_no
WHERE o.order_no = 'VIP20251226143000001';
```

---

## 预防措施

### 系统层面

1. **高可用部署**
   - 支付网关服务多实例部署
   - 数据库主从复制
   - 定时任务单实例执行（避免重复）

2. **监控告警**
   - 对账任务执行监控
   - 错误率监控
   - 响应时间监控

3. **日志完善**
   - 关键操作日志
   - 异常堆栈记录
   - 审计日志

### 运维层面

1. **定期巡检**
   - 每日检查对账日志
   - 每周统计异常趋势
   - 每月复盘重大异常

2. **证书管理**
   - 证书到期提前30天告警
   - 建立证书更新流程
   - 备份证书文件

3. **应急预案**
   - 制定各类异常的处理SOP
   - 定期演练应急流程
   - 保持联系方式畅通

### 代码层面

1. **幂等性保证**
   ```typescript
   // 检查订单是否已处理
   if (order.payment_status !== OrderStatus.PENDING) {
     return { synced: false, reason: 'already_processed' };
   }
   ```

2. **事务处理**
   ```typescript
   await prisma.$transaction(async (tx) => {
     // 更新订单状态
     await tx.orders.update({ ... });
     // 开通VIP
     await tx.users.update({ ... });
     // 记录日志
     await tx.security_logs.create({ ... });
   });
   ```

3. **超时控制**
   ```typescript
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 30000);
   
   try {
     const response = await fetch(url, { signal: controller.signal });
   } finally {
     clearTimeout(timeout);
   }
   ```

---

## 常见问题排查

### Q1: 对账任务一直失败怎么办？

**排查步骤**:

```bash
# 1. 检查错误日志
grep "对账任务.*失败" backend/logs/error.log | tail -20

# 2. 检查网络连接
curl -I https://api.mch.weixin.qq.com
curl -I https://openapi.alipay.com

# 3. 检查证书有效期
openssl x509 -in ./certs/wechat/apiclient_cert.pem -noout -dates

# 4. 检查环境变量
cat .env | grep -E "WECHAT|ALIPAY"
```

### Q2: 用户反馈已付款但VIP未生效？

**排查步骤**:

```sql
-- 1. 查询订单状态
SELECT order_no, payment_status, transaction_id, created_at
FROM orders
WHERE user_id = 'user_xxx'
ORDER BY created_at DESC
LIMIT 5;

-- 2. 查询回调记录
SELECT * FROM payment_callbacks
WHERE order_no = 'VIP20251226xxx'
ORDER BY created_at DESC;

-- 3. 查询用户VIP状态
SELECT user_id, vip_level, vip_expire_at, is_lifetime_vip
FROM users
WHERE user_id = 'user_xxx';
```

### Q3: 对账日志显示大量错误？

**可能原因**:
- 支付平台接口异常
- 网络不稳定
- 证书配置错误
- 请求频率超限

**处理方法**:
1. 检查支付平台公告
2. 检查服务器网络状态
3. 验证证书配置
4. 调整对账频率

### Q4: 如何查看对账统计？

```typescript
// 调用对账统计接口
const stats = await reconciliationService.getReconciliationStats(7);
console.log(stats);
// {
//   totalReconciliations: 1000,
//   totalSynced: 50,
//   totalCancelled: 200,
//   totalErrors: 10
// }
```

```sql
-- 或直接查询数据库
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total,
  SUM((event_data->>'synced')::int) as synced,
  SUM((event_data->>'cancelled')::int) as cancelled,
  SUM((event_data->>'errorCount')::int) as errors
FROM security_logs
WHERE event_type = 'reconciliation'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Q5: 如何手动触发对账？

```typescript
// 方法1: 触发全量对账
import { triggerReconciliation } from './src/tasks/reconciliation.js';
await triggerReconciliation();

// 方法2: 触发单订单对账
import { reconciliationService } from './src/services/reconciliation/reconciliationService.js';
const result = await reconciliationService.manualReconcile('VIP20251226xxx');
```

---

## 附录

### 错误码对照表

| 错误码 | 描述 | 处理建议 |
|-------|------|---------|
| `ERR_NETWORK_TIMEOUT` | 网络超时 | 自动重试 |
| `ERR_INVALID_SIGNATURE` | 签名无效 | 检查证书 |
| `ERR_ORDER_NOT_FOUND` | 订单不存在 | 核实订单号 |
| `ERR_STATUS_MISMATCH` | 状态不一致 | 人工确认 |
| `ERR_AMOUNT_MISMATCH` | 金额不一致 | 人工处理 |
| `ERR_VIP_ACTIVATION` | VIP开通失败 | 人工开通 |
| `ERR_USER_NOT_FOUND` | 用户不存在 | 核实用户 |
| `ERR_PACKAGE_NOT_FOUND` | 套餐不存在 | 核实套餐 |
| `ERR_RATE_LIMIT` | 频率限制 | 延迟重试 |
| `ERR_PLATFORM_ERROR` | 平台错误 | 联系平台 |

### 相关文档

- [定时任务配置指南](./SCHEDULED_TASKS_GUIDE.md)
- [支付API文档](./API_PAYMENT.md)
- [环境变量配置指南](./ENV_CONFIGURATION_GUIDE.md)
- [证书部署指南](./CERTIFICATE_DEPLOYMENT_GUIDE.md)
- [安全审计报告](./SECURITY_AUDIT_REPORT.md)

---

*文档版本: 1.0.0*
*最后更新: 2025-12-26*
*维护人员: Kiro AI*
