# 定时任务配置指南

本文档详细说明VIP会员支付系统中定时任务的配置、管理和运维方法。

## 目录

1. [概述](#概述)
2. [任务列表](#任务列表)
3. [技术实现](#技术实现)
4. [配置说明](#配置说明)
5. [启动与停止](#启动与停止)
6. [监控与日志](#监控与日志)
7. [手动触发](#手动触发)
8. [故障排查](#故障排查)
9. [生产环境部署](#生产环境部署)
10. [常见问题](#常见问题)

---

## 概述

VIP会员支付系统包含三个核心定时任务，用于保障支付流程的完整性和用户体验：

| 任务名称 | 执行频率 | 主要功能 |
|---------|---------|---------|
| 订单对账任务 | 每5分钟 | 同步支付平台订单状态，确保订单状态一致性 |
| VIP到期提醒任务 | 每日9:00 | 发送VIP到期提醒站内信 |
| 订单超时取消任务 | 每分钟 | 自动取消超时未支付的订单 |

### 任务依赖关系

```
应用启动
    │
    ▼
startAllTasks()
    │
    ├── startReconciliationTask()  ──► 每5分钟执行
    │
    ├── startVipReminderTask()     ──► 每日9:00执行
    │
    └── startOrderTimeoutTask()    ──► 每分钟执行
```

---

## 任务列表

### 1. 订单对账任务 (Reconciliation Task)

**文件位置**: `backend/src/tasks/reconciliation.ts`

**执行频率**: 每5分钟 (`*/5 * * * *`)

**功能说明**:
- 查询所有"待支付"状态超过5分钟的订单
- 调用微信/支付宝接口查询实际支付状态
- 如果支付平台显示已支付但本地为待支付，自动同步状态并开通VIP
- 如果支付平台显示未支付且超过15分钟，自动关闭订单

**重试机制**:
- 最大重试次数: 3次
- 重试间隔: 1分钟
- 达到最大重试次数后记录错误日志

**执行流程**:

```
开始执行
    │
    ▼
查询待对账订单
    │
    ▼
遍历每个订单
    │
    ├── 调用支付平台查询接口
    │       │
    │       ├── 已支付 → 更新订单状态 → 开通VIP
    │       │
    │       ├── 未支付且超时 → 关闭订单
    │       │
    │       └── 查询失败 → 记录错误
    │
    ▼
记录对账结果日志
    │
    ▼
执行完成
```

---

### 2. VIP到期提醒任务 (VIP Reminder Task)

**文件位置**: `backend/src/tasks/vipReminder.ts`

**执行频率**: 每日9:00 (`0 9 * * *`)

**功能说明**:
- 查询VIP即将到期的用户
- 发送站内信提醒用户续费
- 支持多个提醒时间点

**提醒时间点**:

| 时间点 | 提醒内容 |
|-------|---------|
| 到期前3天 | "您的VIP会员将在3天后到期，请及时续费" |
| 到期前1天 | "您的VIP会员将在明天到期，请及时续费" |
| 到期当天 | "您的VIP会员今日到期，续费可继续享受VIP权益" |
| 到期后7天内 | "您的VIP会员已到期X天，VIP图标即将隐藏" |

**执行流程**:

```
每日9:00触发
    │
    ▼
查询各时间点用户
    │
    ├── 3天后到期用户
    ├── 1天后到期用户
    ├── 今日到期用户
    └── 已到期7天内用户
    │
    ▼
遍历发送站内信
    │
    ▼
记录发送统计
```

---

### 3. 订单超时取消任务 (Order Timeout Task)

**文件位置**: `backend/src/tasks/orderTimeout.ts`

**执行频率**: 每分钟 (`* * * * *`)

**功能说明**:
- 查询创建超过15分钟且未支付的订单
- 自动将订单状态更新为"已取消"
- 记录取消原因为"订单超时自动取消"

**超时时间**: 15分钟（可通过常量配置）

**执行流程**:

```
每分钟触发
    │
    ▼
查询超时订单
    │
    ├── 无超时订单 → 静默返回
    │
    └── 有超时订单
            │
            ▼
        遍历取消订单
            │
            ├── 更新订单状态为"已取消"
            └── 记录取消原因和时间
            │
            ▼
        记录执行统计
```

---

## 技术实现

### 依赖库

系统使用 `node-cron` 库实现定时任务调度：

```json
{
  "dependencies": {
    "node-cron": "^3.0.3"
  }
}
```

### Cron表达式说明

```
┌────────────── 分钟 (0-59)
│ ┌──────────── 小时 (0-23)
│ │ ┌────────── 日期 (1-31)
│ │ │ ┌──────── 月份 (1-12)
│ │ │ │ ┌────── 星期 (0-7, 0和7都表示周日)
│ │ │ │ │
* * * * *
```

**本系统使用的Cron表达式**:

| 任务 | Cron表达式 | 说明 |
|-----|-----------|------|
| 订单对账 | `*/5 * * * *` | 每5分钟执行 |
| VIP提醒 | `0 9 * * *` | 每天9:00执行 |
| 订单超时 | `* * * * *` | 每分钟执行 |

### 代码结构

```
backend/src/tasks/
├── index.ts              # 任务统一注册与管理
├── reconciliation.ts     # 订单对账任务
├── vipReminder.ts        # VIP到期提醒任务
└── orderTimeout.ts       # 订单超时取消任务
```

### 任务注册入口

```typescript
// backend/src/tasks/index.ts
import { startReconciliationTask } from './reconciliation.js';
import { startVipReminderTask } from './vipReminder.js';
import { startOrderTimeoutTask } from './orderTimeout.js';

export function startAllTasks(): void {
  // 启动订单对账任务（每5分钟）
  tasks.reconciliation = startReconciliationTask();

  // 启动VIP到期提醒任务（每日9点）
  tasks.vipReminder = startVipReminderTask();

  // 启动订单超时取消任务（每分钟）
  tasks.orderTimeout = startOrderTimeoutTask();
}
```

---

## 配置说明

### 环境变量配置

在 `.env` 文件中可以配置以下定时任务相关参数：

```bash
# ============================================
# 定时任务配置
# ============================================

# 是否启用定时任务（默认true）
ENABLE_CRON=true

# 订单超时时间（分钟，默认15）
ORDER_TIMEOUT_MINUTES=15

# 对账任务重试次数（默认3）
RECONCILIATION_MAX_RETRIES=3

# 对账任务重试间隔（毫秒，默认60000）
RECONCILIATION_RETRY_INTERVAL=60000
```

### 任务参数配置

各任务的核心参数在代码中定义，如需修改请编辑对应文件：

**订单超时任务** (`orderTimeout.ts`):

```typescript
const ORDER_TIMEOUT_MINUTES = 15;  // 订单超时时间
```

**对账任务** (`reconciliation.ts`):

```typescript
const MAX_RETRIES = 3;              // 最大重试次数
const RETRY_INTERVAL = 60000;       // 重试间隔（毫秒）
```

**VIP提醒任务** (`vipReminder.ts`):

```typescript
// 提醒时间点在代码中硬编码
// 3天、1天、当天、到期后7天内
```

### 修改执行频率

如需修改任务执行频率，编辑对应任务文件中的cron表达式：

```typescript
// 示例：将对账任务改为每10分钟执行
const task = cron.schedule('*/10 * * * *', () => {
  executeReconciliation();
});
```

**常用Cron表达式参考**:

| 表达式 | 说明 |
|-------|------|
| `* * * * *` | 每分钟 |
| `*/5 * * * *` | 每5分钟 |
| `*/10 * * * *` | 每10分钟 |
| `0 * * * *` | 每小时整点 |
| `0 9 * * *` | 每天9:00 |
| `0 9,18 * * *` | 每天9:00和18:00 |
| `0 0 * * *` | 每天0:00 |
| `0 0 * * 1` | 每周一0:00 |
| `0 0 1 * *` | 每月1日0:00 |

---

## 启动与停止

### 自动启动

定时任务在应用启动时自动初始化：

```typescript
// backend/src/app.ts
import { startAllTasks } from '@/tasks/index.js';
startAllTasks();
```

### 手动停止

可以通过调用 `stopAllTasks()` 函数停止所有定时任务：

```typescript
import { stopAllTasks } from '@/tasks/index.js';
stopAllTasks();
```

### 查看任务状态

```typescript
import { getTaskStatus } from '@/tasks/index.js';

const status = getTaskStatus();
console.log(status);
// 输出: { reconciliation: true, vipReminder: true, orderTimeout: true }
```

### PM2进程管理

使用PM2管理应用时，定时任务会随应用自动启动/停止：

```bash
# 启动应用（包含定时任务）
pm2 start npm --name "backend" -- run start

# 重启应用（定时任务会重新初始化）
pm2 restart backend

# 停止应用（定时任务会停止）
pm2 stop backend

# 查看日志
pm2 logs backend
```

---

## 监控与日志

### 日志输出

所有定时任务执行都会输出日志，日志格式如下：

**启动日志**:

```
========== 启动定时任务 ==========
[对账任务] 定时任务已启动，每5分钟执行一次
[VIP提醒任务] 定时任务已启动，每日9点执行
[订单超时任务] 定时任务已启动，每分钟执行一次
========== 定时任务启动完成 ==========
```

**执行日志**:

```
[对账任务] 开始执行，第 1 次尝试
[对账任务] 执行完成 { totalChecked: 5, synced: 2, cancelled: 1, errors: 0 }

[VIP提醒任务] 开始执行
[VIP提醒任务] 执行完成，共发送 15 条提醒

[订单超时任务] 发现 3 个超时订单
[订单超时任务] 执行完成 { total: 3, cancelled: 3, failed: 0 }
```

**错误日志**:

```
[对账任务] 执行失败: Error: ...
[对账任务] 60秒后重试...
[对账任务] 已达到最大重试次数(3)，放弃本次对账
```

### 日志文件位置

日志文件存储在 `backend/logs/` 目录：

```
backend/logs/
├── combined.log      # 所有日志
├── error.log         # 错误日志
└── combined1.log     # 轮转日志
```

### 日志查看命令

```bash
# 查看最新日志
tail -f backend/logs/combined.log

# 查看错误日志
tail -f backend/logs/error.log

# 搜索特定任务日志
grep "对账任务" backend/logs/combined.log
grep "VIP提醒任务" backend/logs/combined.log
grep "订单超时任务" backend/logs/combined.log
```

### 监控指标

建议监控以下指标：

| 指标 | 说明 | 告警阈值 |
|-----|------|---------|
| 对账任务执行时间 | 单次对账耗时 | > 5分钟 |
| 对账错误数 | 对账失败的订单数 | > 10个/次 |
| 对账重试次数 | 连续重试次数 | = 3次 |
| VIP提醒发送数 | 每日发送的提醒数 | 异常波动 |
| 超时订单数 | 每分钟取消的订单数 | > 100个/分钟 |

---

## 手动触发

### 通过代码触发

每个任务都提供了手动触发函数，用于测试或紧急情况：

```typescript
// 手动触发对账任务
import { triggerReconciliation } from '@/tasks/reconciliation.js';
await triggerReconciliation();

// 手动触发VIP提醒任务
import { triggerVipReminder } from '@/tasks/vipReminder.js';
await triggerVipReminder();

// 手动触发订单超时检查
import { triggerOrderTimeout } from '@/tasks/orderTimeout.js';
await triggerOrderTimeout();
```

### 通过API触发（可选实现）

如需通过API触发定时任务，可以添加管理接口：

```typescript
// 示例：添加管理API
router.post('/api/v1/admin/tasks/reconciliation/trigger', async (req, res) => {
  await triggerReconciliation();
  res.json({ success: true, message: '对账任务已触发' });
});
```

### 通过命令行触发

```bash
# 进入后端目录
cd backend

# 触发对账任务
npx ts-node -e "
import { triggerReconciliation } from './src/tasks/reconciliation.js';
triggerReconciliation().then(() => process.exit(0));
"

# 触发VIP提醒任务
npx ts-node -e "
import { triggerVipReminder } from './src/tasks/vipReminder.js';
triggerVipReminder().then(() => process.exit(0));
"
```

---

## 故障排查

### 常见问题

#### 1. 定时任务未执行

**可能原因**:
- 应用未正常启动
- `ENABLE_CRON` 环境变量设置为 `false`
- 任务启动时发生错误

**排查步骤**:

```bash
# 1. 检查应用是否运行
pm2 status

# 2. 检查启动日志
grep "启动定时任务" backend/logs/combined.log

# 3. 检查错误日志
grep "定时任务启动失败" backend/logs/error.log
```

#### 2. 对账任务持续失败

**可能原因**:
- 支付平台接口不可用
- 网络连接问题
- 证书配置错误

**排查步骤**:

```bash
# 1. 检查对账错误日志
grep "对账任务.*失败" backend/logs/error.log

# 2. 检查支付平台连接
curl -I https://api.mch.weixin.qq.com

# 3. 验证证书配置
openssl x509 -in ./certs/wechat/apiclient_cert.pem -noout -dates
```

#### 3. VIP提醒未发送

**可能原因**:
- 没有符合条件的用户
- 通知服务异常
- 数据库查询错误

**排查步骤**:

```bash
# 1. 检查VIP提醒日志
grep "VIP提醒任务" backend/logs/combined.log

# 2. 手动查询即将到期用户
psql -d your_database -c "
SELECT COUNT(*) FROM users 
WHERE vip_level > 0 
AND vip_expire_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
AND is_lifetime_vip = false;
"
```

#### 4. 订单超时任务执行缓慢

**可能原因**:
- 待处理订单过多
- 数据库查询性能问题
- 单次处理订单数量过大

**优化建议**:

```typescript
// 添加批量处理限制
const BATCH_SIZE = 100;
const timeoutOrders = await getTimeoutOrders().slice(0, BATCH_SIZE);
```

### 错误恢复

#### 对账任务失败恢复

如果对账任务连续失败，可以手动执行对账：

```bash
# 1. 检查失败原因
grep "对账任务.*失败" backend/logs/error.log | tail -20

# 2. 修复问题后手动触发
npx ts-node -e "
import { triggerReconciliation } from './src/tasks/reconciliation.js';
triggerReconciliation();
"

# 3. 验证执行结果
grep "对账任务.*完成" backend/logs/combined.log | tail -5
```

#### 数据不一致修复

如果发现订单状态与支付平台不一致：

```sql
-- 查询可能不一致的订单
SELECT order_no, payment_status, created_at
FROM orders
WHERE order_type = 'vip'
AND payment_status = 0
AND created_at < NOW() - INTERVAL '1 hour';
```

---

## 生产环境部署

### 部署检查清单

部署前请确认以下事项：

- [ ] 环境变量配置正确
- [ ] 支付证书已部署
- [ ] 数据库连接正常
- [ ] 日志目录可写
- [ ] PM2或其他进程管理器已配置
- [ ] 监控告警已设置

### PM2配置示例

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'backend',
    script: 'dist/app.js',
    instances: 1,  // 定时任务建议单实例
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      ENABLE_CRON: 'true'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true
  }]
};
```

**注意**: 定时任务建议使用单实例部署，避免多实例重复执行。

### 多实例部署方案

如果需要多实例部署，可以使用以下方案：

**方案一：主从模式**

```javascript
// 只在主实例启动定时任务
if (process.env.PM2_INSTANCE_ID === '0') {
  startAllTasks();
}
```

**方案二：独立任务服务**

将定时任务拆分为独立服务：

```
backend-api/       # API服务（多实例）
backend-tasks/     # 定时任务服务（单实例）
```

**方案三：使用分布式任务调度**

使用Redis或数据库实现分布式锁：

```typescript
async function executeWithLock(taskName: string, task: () => Promise<void>) {
  const lockKey = `task:lock:${taskName}`;
  const locked = await redis.set(lockKey, '1', 'NX', 'EX', 300);
  
  if (!locked) {
    logger.debug(`[${taskName}] 其他实例正在执行，跳过`);
    return;
  }
  
  try {
    await task();
  } finally {
    await redis.del(lockKey);
  }
}
```

### Docker部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .
RUN npm ci --only=production

# 确保日志目录存在
RUN mkdir -p logs

ENV NODE_ENV=production
ENV ENABLE_CRON=true

CMD ["node", "dist/app.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - ENABLE_CRON=true
      - DATABASE_URL=postgresql://...
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/certs:/app/certs:ro
    deploy:
      replicas: 1  # 定时任务单实例
```

### 健康检查

添加定时任务健康检查端点：

```typescript
// 健康检查API
router.get('/api/v1/health/tasks', (req, res) => {
  const status = getTaskStatus();
  const healthy = Object.values(status).every(v => v === true);
  
  res.status(healthy ? 200 : 503).json({
    healthy,
    tasks: status,
    timestamp: new Date().toISOString()
  });
});
```

---

## 常见问题

### Q1: 如何禁用定时任务？

**A**: 设置环境变量 `ENABLE_CRON=false`，或在代码中注释掉 `startAllTasks()` 调用。

### Q2: 定时任务会在多实例环境下重复执行吗？

**A**: 是的，每个实例都会独立执行定时任务。建议使用单实例部署或实现分布式锁。

### Q3: 如何修改任务执行时间？

**A**: 编辑对应任务文件中的cron表达式，然后重启应用。

### Q4: 任务执行失败会影响其他任务吗？

**A**: 不会，每个任务独立执行，一个任务失败不会影响其他任务。

### Q5: 如何查看任务执行历史？

**A**: 查看日志文件 `backend/logs/combined.log`，搜索对应任务名称。

### Q6: 对账任务的重试机制是怎样的？

**A**: 对账任务失败后会间隔1分钟重试，最多重试3次。达到最大重试次数后记录错误日志。

### Q7: VIP提醒任务为什么选择9点执行？

**A**: 9点是用户活跃时间，提醒效果更好。如需修改，编辑 `vipReminder.ts` 中的cron表达式。

### Q8: 订单超时时间可以配置吗？

**A**: 可以，修改 `orderTimeout.ts` 中的 `ORDER_TIMEOUT_MINUTES` 常量，或通过环境变量配置。

### Q9: 如何在不重启应用的情况下停止某个任务？

**A**: 目前需要重启应用。如需动态控制，可以添加任务开关API。

### Q10: 定时任务的时区是什么？

**A**: 使用服务器系统时区。建议生产环境统一使用UTC或北京时间。

---

## 相关文档

- [环境变量配置指南](./ENV_CONFIGURATION_GUIDE.md)
- [证书部署指南](./CERTIFICATE_DEPLOYMENT_GUIDE.md)
- [支付API文档](./API_PAYMENT.md)
- [安全审计报告](./SECURITY_AUDIT_REPORT.md)

---

*文档版本: 1.0.0*
*最后更新: 2025-12-26*
