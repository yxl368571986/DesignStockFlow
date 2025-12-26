# 安全事件处理流程

本文档详细说明VIP会员支付系统中安全事件的识别、分类、处理和响应流程。

## 目录

1. [概述](#概述)
2. [安全事件分类](#安全事件分类)
3. [事件检测机制](#事件检测机制)
4. [事件处理流程](#事件处理流程)
5. [告警与通知](#告警与通知)
6. [人工干预指南](#人工干预指南)
7. [应急响应预案](#应急响应预案)
8. [事后分析与改进](#事后分析与改进)
9. [常见问题排查](#常见问题排查)

---

## 概述

安全监控服务是VIP支付系统的核心安全组件，负责检测、记录和响应各类安全事件，保障用户资金安全和系统稳定运行。

### 安全监控架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    安全监控服务 (SecurityMonitor)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  事件检测    │───▶│  风险评估    │───▶│  响应决策    │       │
│  │  (实时监控)  │    │  (等级判定)  │    │  (自动/人工) │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  日志记录    │    │  告警通知    │    │  执行响应    │       │
│  │  (审计追溯)  │    │  (管理员)    │    │  (锁定/解锁) │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 核心文件位置

| 文件 | 说明 |
|------|------|
| `backend/src/services/security/securityMonitor.ts` | 安全监控服务主逻辑 |
| `backend/src/services/device/deviceManager.ts` | 设备管理服务 |
| `backend/src/controllers/adminVipController.ts` | 管理后台安全API |
| `backend/prisma/schema.prisma` | 安全日志表定义 |

---

## 安全事件分类

### 1. 支付安全事件

| 事件类型 | 事件代码 | 风险等级 | 自动响应 |
|---------|---------|---------|---------|
| 支付尝试 | `payment_attempt` | 低 | ✅ 记录日志 |
| 支付成功 | `payment_success` | 低 | ✅ 记录日志 |
| 支付失败 | `payment_failed` | 中 | ✅ 记录+监控 |
| 大额支付 | `high_amount_payment` | 中 | ✅ 二次验证 |
| 频繁未支付 | `too_many_unpaid_orders` | 中 | ✅ 限制支付 |

### 2. 账号安全事件

| 事件类型 | 事件代码 | 风险等级 | 自动响应 |
|---------|---------|---------|---------|
| 账号锁定 | `account_locked` | 高 | ✅ 阻止操作 |
| 账号解锁 | `account_unlocked` | 低 | ✅ 记录日志 |
| 可疑IP访问 | `suspicious_ip` | 高 | ✅ 阻止+告警 |
| 设备踢出 | `device_kicked` | 低 | ✅ 记录日志 |
| 设备超限 | `device_limit_exceeded` | 中 | ✅ 踢出旧设备 |

### 3. 验证安全事件

| 事件类型 | 事件代码 | 风险等级 | 自动响应 |
|---------|---------|---------|---------|
| 验证码发送 | `secondary_auth_sent` | 低 | ✅ 记录日志 |
| 验证码验证成功 | `secondary_auth_verified` | 低 | ✅ 记录日志 |
| 验证码验证失败 | `secondary_auth_failed` | 中 | ✅ 记录+监控 |
| 验证码过期 | `auth_code_expired` | 低 | ✅ 记录日志 |

### 4. 退款安全事件

| 事件类型 | 事件代码 | 风险等级 | 自动响应 |
|---------|---------|---------|---------|
| 退款申请 | `refund_requested` | 中 | ✅ 记录+审核 |
| 退款审核通过 | `refund_approved` | 低 | ✅ 记录日志 |
| 退款审核拒绝 | `refund_rejected` | 低 | ✅ 记录日志 |
| 异常退款 | `suspicious_refund` | 高 | ❌ 人工审核 |

---

## 事件检测机制

### 实时检测规则

#### 规则1: 未支付订单数量限制

```typescript
// 检测条件: 同一账号1小时内创建超过5个未支付订单
const MAX_UNPAID_ORDERS_PER_HOUR = 5;

async function checkUnpaidOrderLimit(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const unpaidCount = await prisma.orders.count({
    where: {
      user_id: userId,
      payment_status: 0,
      created_at: { gte: oneHourAgo },
    },
  });
  return unpaidCount >= MAX_UNPAID_ORDERS_PER_HOUR;
}
```

**触发响应**: 暂时限制该账号支付功能

#### 规则2: 可疑IP检测

```typescript
// 检测条件: 同一IP在1小时内支付失败超过10次
const MAX_FAILED_PAYMENTS_PER_IP = 10;

async function checkSuspiciousIp(ip: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const failedAttempts = await prisma.security_logs.count({
    where: {
      ip_address: ip,
      event_type: 'payment_failed',
      created_at: { gte: oneHourAgo },
    },
  });
  return failedAttempts >= MAX_FAILED_PAYMENTS_PER_IP;
}
```

**触发响应**: 标记IP为可疑，阻止支付并告警

#### 规则3: 大额支付二次验证

```typescript
// 检测条件: 支付金额 >= 200元（20000分）
const SECONDARY_AUTH_THRESHOLD = 20000; // 单位：分

function requireSecondaryAuth(amountInCents: number): boolean {
  return amountInCents >= SECONDARY_AUTH_THRESHOLD;
}
```

**触发响应**: 要求用户输入手机验证码

#### 规则4: 设备数量限制

```typescript
// 检测条件: 同一VIP账号登录设备超过3台
const MAX_DEVICES_PER_USER = 3;

async function checkDeviceLimit(userId: string): Promise<DeviceLimitResult> {
  const activeDevices = await prisma.device_sessions.count({
    where: { user_id: userId, is_active: true },
  });
  return {
    allowed: activeDevices < MAX_DEVICES_PER_USER,
    currentCount: activeDevices,
    maxCount: MAX_DEVICES_PER_USER,
  };
}
```

**触发响应**: 踢出最早登录的设备

### 日志记录结构

```typescript
// 安全日志记录接口
interface SecurityLogEntry {
  log_id: string;           // 日志ID
  user_id?: string;         // 用户ID（可选）
  event_type: string;       // 事件类型
  event_data: object;       // 事件详情（JSON）
  ip_address?: string;      // IP地址
  device_fingerprint?: string; // 设备指纹
  risk_level: 'low' | 'medium' | 'high'; // 风险等级
  action_taken: string;     // 采取的措施
  created_at: Date;         // 记录时间
}
```

---

## 事件处理流程

### 总体流程图

```
                    ┌─────────────────┐
                    │   检测到事件    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   风险等级评估   │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   低风险     │  │   中风险     │  │   高风险     │
    │  (记录日志)  │  │ (记录+监控)  │  │ (阻止+告警)  │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  正常继续    │  │  增强监控    │  │  立即响应    │
    │              │  │  累计告警    │  │  人工介入    │
    └──────────────┘  └──────────────┘  └──────────────┘
```

### 低风险事件处理

**适用事件**: `payment_attempt`, `payment_success`, `secondary_auth_sent`, `device_kicked`

**处理步骤**:
1. 记录安全日志
2. 允许操作继续
3. 纳入统计分析

```typescript
// 低风险事件处理示例
await securityMonitor.logSecurityEvent({
  userId,
  eventType: SecurityEventType.PAYMENT_ATTEMPT,
  eventData: { orderNo },
  deviceInfo,
  riskLevel: RiskLevel.LOW,
  actionTaken: 'none',
});
```

### 中风险事件处理

**适用事件**: `payment_failed`, `secondary_auth_failed`, `too_many_unpaid_orders`

**处理步骤**:
1. 记录安全日志
2. 增加监控频率
3. 累计达到阈值时升级为高风险
4. 发送汇总告警

```typescript
// 中风险事件处理示例
await securityMonitor.logSecurityEvent({
  userId,
  eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
  eventData: { reason: 'too_many_unpaid_orders', count: unpaidCount },
  deviceInfo,
  riskLevel: RiskLevel.MEDIUM,
  actionTaken: 'blocked',
});

// 阻止支付
return { 
  allowed: false, 
  reason: SecurityBlockReason.TOO_MANY_UNPAID_ORDERS 
};
```

### 高风险事件处理

**适用事件**: `suspicious_ip`, `account_locked`, `suspicious_refund`

**处理步骤**:
1. 立即阻止相关操作
2. 记录详细安全日志
3. 发送即时告警通知
4. 等待人工审核处理

```typescript
// 高风险事件处理示例
await securityMonitor.logSecurityEvent({
  userId,
  eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
  eventData: { reason: 'suspicious_ip', ip: deviceInfo.ip },
  deviceInfo,
  riskLevel: RiskLevel.HIGH,
  actionTaken: 'blocked',
});

// 锁定账号支付
await securityMonitor.lockPayment(userId, '可疑IP访问');

// 发送告警
await sendSecurityAlert('high', userId, 'suspicious_ip', { ip: deviceInfo.ip });
```

---

## 告警与通知

### 告警级别定义

| 级别 | 触发条件 | 通知方式 | 响应时间 |
|------|---------|---------|---------|
| 严重 | 签名验证失败、金额篡改 | 即时通知+短信 | 15分钟内 |
| 高 | 可疑IP、账号锁定、异常退款 | 即时通知 | 30分钟内 |
| 中 | 频繁失败、验证码错误 | 汇总通知 | 2小时内 |
| 低 | 正常操作记录 | 日报汇总 | 24小时内 |

### 告警内容模板

#### 高风险告警模板

```
【VIP支付系统安全告警】

告警级别: 高
告警时间: 2025-12-26 14:30:00
事件类型: 可疑IP访问

事件详情:
- 用户ID: user_xxx
- IP地址: 192.168.1.100
- 设备指纹: abc123def456
- 触发原因: 该IP在1小时内支付失败超过10次

已采取措施:
- 已阻止该用户支付功能
- 已记录安全日志

处理建议:
1. 核实该IP是否为用户本人操作
2. 检查是否存在暴力破解行为
3. 确认无风险后可解除支付限制

操作入口: https://admin.example.com/security/logs?userId=user_xxx
```

#### 账号锁定告警模板

```
【VIP支付系统安全告警】

告警级别: 高
告警时间: 2025-12-26 15:00:00
事件类型: 账号支付锁定

事件详情:
- 用户ID: user_xxx
- 用户昵称: 张三
- 锁定原因: 1小时内创建超过5个未支付订单
- 未支付订单数: 6

已采取措施:
- 已锁定该用户支付功能
- 已记录安全日志

处理建议:
1. 联系用户确认是否为本人操作
2. 检查是否存在恶意刷单行为
3. 确认无风险后可解除支付限制

操作入口: https://admin.example.com/users/user_xxx/unlock-payment
```

### 告警通知实现

```typescript
async function sendSecurityAlert(
  level: 'critical' | 'high' | 'medium' | 'low',
  userId: string,
  eventType: string,
  details: Record<string, unknown>
): Promise<void> {
  // 1. 记录到安全日志
  await prisma.security_logs.create({
    data: {
      user_id: userId,
      event_type: `alert_${eventType}`,
      event_data: {
        level,
        details,
        timestamp: new Date().toISOString(),
      },
      risk_level: level === 'critical' ? 'high' : level,
      action_taken: 'alert_sent',
    },
  });

  // 2. 发送站内信给管理员
  const admins = await getAdminUsers();
  for (const admin of admins) {
    await notificationService.sendNotification({
      userId: admin.user_id,
      title: `【安全告警】${getEventTypeLabel(eventType)}`,
      content: formatAlertContent(level, userId, eventType, details),
      type: 'system',
      linkUrl: `/admin/security/logs?userId=${userId}`,
    });
  }

  // 3. 严重告警扩展通知
  if (level === 'critical' || level === 'high') {
    logger.warn(`[安全告警] ${level.toUpperCase()}: ${eventType}`, { userId, details });
    // 可扩展: 发送邮件、短信、钉钉等
  }
}
```

---

## 人工干预指南

### 何时需要人工干预

1. **账号被锁定**: 用户反馈无法支付
2. **可疑IP告警**: 需要确认是否为恶意行为
3. **异常退款申请**: 金额异常或频繁退款
4. **签名验证失败**: 可能存在安全攻击
5. **设备异常**: 用户反馈设备被踢出

### 人工处理步骤

#### 场景1: 解除账号支付限制

**前置条件**: 确认用户身份，排除恶意行为

**操作步骤**:

```
1. 登录管理后台
2. 进入 安全管理 > 安全日志
3. 搜索用户ID，查看安全事件记录
4. 分析锁定原因和历史行为
5. 确认无风险后，点击"解除支付限制"
6. 系统自动记录解锁操作和操作人
7. 通知用户支付功能已恢复
```

**API调用**:

```bash
# 解除支付限制
curl -X POST "https://api.example.com/api/v1/admin/users/{userId}/unlock-payment" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"
```

**数据库操作** (紧急情况):

```sql
-- 1. 备份用户数据
CREATE TABLE users_backup_20251226 AS
SELECT * FROM users WHERE user_id = 'user_xxx';

-- 2. 解除支付限制
UPDATE users
SET 
  payment_locked = false,
  payment_locked_at = NULL,
  payment_lock_reason = NULL,
  updated_at = NOW()
WHERE user_id = 'user_xxx';

-- 3. 记录操作日志
INSERT INTO security_logs (
  user_id, event_type, event_data, risk_level, action_taken
) VALUES (
  'user_xxx',
  'account_unlocked',
  '{"admin_id": "admin_xxx", "reason": "人工审核确认无风险"}',
  'low',
  'unlocked'
);
```

#### 场景2: 处理可疑IP告警

**操作步骤**:

```
1. 查看告警详情，获取IP地址
2. 查询该IP的历史访问记录
3. 分析访问模式（时间、频率、操作类型）
4. 判断是否为恶意行为:
   - 如果是: 加入IP黑名单，保留证据
   - 如果否: 解除用户限制，标记为误报
5. 记录处理结果和判断依据
```

**查询IP历史记录**:

```sql
-- 查询IP的安全日志
SELECT 
  user_id,
  event_type,
  event_data,
  risk_level,
  action_taken,
  created_at
FROM security_logs
WHERE ip_address = '192.168.1.100'
ORDER BY created_at DESC
LIMIT 50;

-- 查询IP关联的用户
SELECT DISTINCT user_id
FROM security_logs
WHERE ip_address = '192.168.1.100'
  AND created_at > NOW() - INTERVAL '24 hours';
```

#### 场景3: 处理异常退款申请

**操作步骤**:

```
1. 查看退款申请详情
2. 核实订单信息和支付记录
3. 检查用户是否有下载记录
4. 判断是否符合退款条件:
   - 购买7天内
   - 非终身会员
   - 无下载记录
5. 审核通过或拒绝
6. 记录审核结果和理由
```

**退款审核API**:

```bash
# 审核通过
curl -X PUT "https://api.example.com/api/v1/admin/vip/refunds/{refundId}" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": 1, "reviewNote": "符合退款条件，审核通过"}'

# 审核拒绝
curl -X PUT "https://api.example.com/api/v1/admin/vip/refunds/{refundId}" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": 2, "reviewNote": "已有下载记录，不符合退款条件"}'
```

---

## 应急响应预案

### 预案1: 大规模支付失败

**触发条件**: 5分钟内支付失败率超过50%

**响应步骤**:

```
1. 立即检查支付平台状态
   - 微信支付: https://pay.weixin.qq.com/
   - 支付宝: https://open.alipay.com/

2. 检查服务器网络连接
   curl -I https://api.mch.weixin.qq.com
   curl -I https://openapi.alipay.com

3. 检查证书有效期
   openssl x509 -in ./certs/wechat/apiclient_cert.pem -noout -dates

4. 如果是平台问题:
   - 在前端显示"支付服务暂时不可用"
   - 引导用户使用其他支付方式
   - 持续监控平台恢复状态

5. 如果是本地问题:
   - 检查错误日志定位问题
   - 修复问题并重启服务
   - 验证支付功能恢复正常

6. 事后处理:
   - 统计受影响的订单数量
   - 主动联系受影响用户
   - 编写事故报告
```

### 预案2: 疑似攻击行为

**触发条件**: 检测到签名验证失败或异常请求模式

**响应步骤**:

```
1. 立即保留证据
   - 导出相关安全日志
   - 保存原始请求数据
   - 记录攻击时间和来源IP

2. 临时防护措施
   - 将可疑IP加入临时黑名单
   - 增强请求验证
   - 启用更严格的限流

3. 分析攻击类型
   - 签名伪造: 检查密钥是否泄露
   - 重放攻击: 检查时间戳验证
   - 暴力破解: 检查请求频率

4. 根据分析结果采取措施
   - 如果密钥泄露: 立即更换密钥
   - 如果是外部攻击: 加强防护，必要时报警
   - 如果是误报: 解除限制，优化检测规则

5. 事后处理
   - 完善安全检测规则
   - 更新应急预案
   - 进行安全培训
```

### 预案3: 用户资金损失

**触发条件**: 用户反馈付款成功但VIP未开通

**响应步骤**:

```
1. 安抚用户，记录问题详情
   - 订单号
   - 支付时间
   - 支付金额
   - 支付方式

2. 核实支付状态
   - 查询本地订单状态
   - 查询支付平台交易记录
   - 对比确认实际支付情况

3. 确认问题原因
   - 回调丢失: 手动触发对账
   - 系统故障: 修复后补开VIP
   - 用户误操作: 解释说明

4. 解决用户问题
   - 如果确实已支付: 立即手动开通VIP
   - 如果未支付: 引导用户重新支付
   - 如果重复支付: 发起退款

5. 事后处理
   - 分析问题根因
   - 优化对账机制
   - 完善用户反馈渠道
```

### 应急联系人

| 角色 | 姓名 | 联系方式 | 职责 |
|------|------|---------|------|
| 技术负责人 | [姓名] | [电话] | 技术问题决策 |
| 运维负责人 | [姓名] | [电话] | 服务器和网络问题 |
| 产品负责人 | [姓名] | [电话] | 用户沟通和业务决策 |
| 安全负责人 | [姓名] | [电话] | 安全事件处理 |

---

## 事后分析与改进

### 事件复盘流程

```
1. 事件收集
   - 收集所有相关日志
   - 整理时间线
   - 记录影响范围

2. 原因分析
   - 直接原因: 触发事件的具体操作
   - 根本原因: 导致问题的深层原因
   - 贡献因素: 加剧问题的其他因素

3. 改进措施
   - 短期: 立即可执行的修复
   - 中期: 需要开发的功能改进
   - 长期: 架构或流程优化

4. 跟踪验证
   - 确认改进措施已实施
   - 验证问题不再复现
   - 更新相关文档
```

### 事件报告模板

```markdown
# 安全事件报告

## 基本信息
- 事件ID: SEC-2025-001
- 发生时间: 2025-12-26 14:30:00
- 发现时间: 2025-12-26 14:35:00
- 解决时间: 2025-12-26 15:00:00
- 事件级别: 高

## 事件描述
[简要描述事件内容]

## 影响范围
- 受影响用户数: X
- 受影响订单数: X
- 资金影响: X元

## 时间线
- 14:30 - 事件发生
- 14:35 - 告警触发
- 14:40 - 开始处理
- 15:00 - 问题解决

## 原因分析
### 直接原因
[描述直接原因]

### 根本原因
[描述根本原因]

## 处理过程
[描述处理步骤]

## 改进措施
1. [措施1] - 负责人: XXX - 完成时间: XXXX-XX-XX
2. [措施2] - 负责人: XXX - 完成时间: XXXX-XX-XX

## 经验教训
[总结经验教训]
```

### 定期安全审查

| 审查项 | 频率 | 负责人 | 输出 |
|--------|------|--------|------|
| 安全日志分析 | 每日 | 运维 | 日报 |
| 异常事件统计 | 每周 | 安全 | 周报 |
| 安全规则评估 | 每月 | 安全 | 评估报告 |
| 渗透测试 | 每季度 | 安全 | 测试报告 |
| 安全培训 | 每半年 | 安全 | 培训记录 |

---

## 常见问题排查

### Q1: 用户反馈支付被限制怎么办？

**排查步骤**:

```sql
-- 1. 查询用户支付锁定状态
SELECT 
  user_id,
  payment_locked,
  payment_locked_at,
  payment_lock_reason
FROM users
WHERE user_id = 'user_xxx';

-- 2. 查询用户最近的安全日志
SELECT 
  event_type,
  event_data,
  risk_level,
  action_taken,
  created_at
FROM security_logs
WHERE user_id = 'user_xxx'
ORDER BY created_at DESC
LIMIT 10;

-- 3. 查询用户最近的未支付订单
SELECT 
  order_no,
  amount,
  payment_status,
  created_at
FROM orders
WHERE user_id = 'user_xxx'
  AND payment_status = 0
ORDER BY created_at DESC;
```

**处理方法**:
- 如果是正常触发限制: 解释原因，等待限制自动解除或人工解除
- 如果是误触发: 解除限制，优化检测规则

### Q2: 如何查看某个IP的所有活动？

```sql
-- 查询IP的所有安全日志
SELECT 
  log_id,
  user_id,
  event_type,
  event_data,
  risk_level,
  action_taken,
  created_at
FROM security_logs
WHERE ip_address = '192.168.1.100'
ORDER BY created_at DESC;

-- 统计IP的事件类型分布
SELECT 
  event_type,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM security_logs
WHERE ip_address = '192.168.1.100'
GROUP BY event_type
ORDER BY count DESC;
```

### Q3: 如何统计安全事件趋势？

```sql
-- 按天统计各类安全事件
SELECT 
  DATE(created_at) as date,
  event_type,
  risk_level,
  COUNT(*) as count
FROM security_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), event_type, risk_level
ORDER BY date DESC, count DESC;

-- 统计高风险事件
SELECT 
  DATE(created_at) as date,
  COUNT(*) as high_risk_count
FROM security_logs
WHERE risk_level = 'high'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Q4: 如何手动触发安全检查？

```typescript
// 通过代码触发安全检查
import { securityMonitor } from './src/services/security/securityMonitor.js';

// 检查用户支付安全
const result = await securityMonitor.checkPaymentSecurity(userId, deviceInfo);
console.log(result);
// { allowed: true/false, reason: '...', requireSecondaryAuth: true/false }

// 检查是否需要二次验证
const needAuth = securityMonitor.requireSecondaryAuth(amountInCents);
console.log(needAuth); // true/false
```

### Q5: 验证码发送失败怎么办？

**排查步骤**:
1. 检查用户手机号是否正确
2. 检查短信服务配置
3. 检查发送频率限制
4. 查看错误日志

**临时解决方案**:
- MVP阶段验证码记录在日志中（已脱敏）
- 管理员可查看日志获取验证码（仅限测试环境）

---

## 附录

### 安全事件类型代码表

| 代码 | 名称 | 描述 |
|------|------|------|
| `payment_attempt` | 支付尝试 | 用户发起支付请求 |
| `payment_success` | 支付成功 | 支付完成确认 |
| `payment_failed` | 支付失败 | 支付未成功 |
| `suspicious_activity` | 可疑活动 | 检测到异常行为 |
| `account_locked` | 账号锁定 | 账号支付功能被锁定 |
| `account_unlocked` | 账号解锁 | 账号支付功能被解锁 |
| `secondary_auth_sent` | 验证码发送 | 二次验证码已发送 |
| `secondary_auth_verified` | 验证成功 | 二次验证通过 |
| `secondary_auth_failed` | 验证失败 | 二次验证未通过 |
| `device_kicked` | 设备踢出 | 设备被强制下线 |
| `refund_requested` | 退款申请 | 用户申请退款 |

### 风险等级定义

| 等级 | 代码 | 描述 | 响应要求 |
|------|------|------|---------|
| 低 | `low` | 正常操作，无风险 | 记录日志 |
| 中 | `medium` | 需要关注，可能有风险 | 记录+监控 |
| 高 | `high` | 存在风险，需要处理 | 阻止+告警 |

### 相关文档

- [对账异常处理流程](./RECONCILIATION_EXCEPTION_HANDLING.md)
- [退款处理流程](./REFUND_PROCESSING_GUIDE.md)
- [安全审计报告](./SECURITY_AUDIT_REPORT.md)
- [环境变量配置指南](./ENV_CONFIGURATION_GUIDE.md)
- [证书部署指南](./CERTIFICATE_DEPLOYMENT_GUIDE.md)

---

*文档版本: 1.0.0*
*最后更新: 2025-12-26*
*维护人员: Kiro AI*
