# Design Document - VIP会员支付系统

## 1. 架构概述

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              前端 (Vue 3 + TypeScript)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  VIP中心页面  │  支付弹窗组件  │  订单管理页面  │  VIP状态组件  │  下载组件   │
└───────┬───────────────┬───────────────┬───────────────┬───────────────┬─────┘
        │               │               │               │               │
        ▼               ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API Gateway (Express)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  认证中间件  │  限流中间件  │  签名验证中间件  │  日志中间件  │  错误处理    │
└───────┬───────────────┬───────────────┬───────────────┬───────────────┬─────┘
        │               │               │               │               │
        ▼               ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              业务服务层 (Services)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ PaymentGateway │ OrderService │ VipService │ DownloadService │ SecurityMonitor│
│ DeviceManager  │ NotificationService │ ReconciliationService               │
└───────┬───────────────┬───────────────┬───────────────┬───────────────┬─────┘
        │               │               │               │               │
        ▼               ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              数据访问层 (Prisma ORM)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  orders  │  users  │  vip_packages  │  device_sessions  │  security_logs   │
│  payment_callbacks  │  download_records  │  notifications  │  refund_records │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              外部服务                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│      微信支付 API V3      │      支付宝开放平台      │      短信服务(预留)    │
└─────────────────────────────────────────────────────────────────────────────┘
```


### 1.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端框架 | Vue 3 + TypeScript | Composition API + script setup |
| UI组件库 | Element Plus | 表单、弹窗、消息提示 |
| 状态管理 | Pinia | 用户状态、VIP状态、订单状态 |
| 后端框架 | Express + TypeScript | RESTful API |
| ORM | Prisma | 数据库操作 |
| 数据库 | PostgreSQL | 主数据存储 |
| 缓存 | 内存缓存(后续可扩展Redis) | 支付渠道状态、用户会话 |
| 定时任务 | node-cron | 订单对账、VIP到期提醒 |

### 1.3 核心设计原则

1. **幂等性**: 支付回调、订单状态更新必须保证幂等
2. **最终一致性**: 支付状态通过对账机制保证最终一致
3. **安全优先**: 签名验证、二次确认、异常监控
4. **可扩展性**: 支付渠道、VIP等级可灵活扩展
5. **用户体验**: 支付流程简洁、状态反馈及时

## 2. 组件设计

### 2.1 PaymentGateway (支付网关服务)

负责统一处理微信支付和支付宝支付的接口调用。

```typescript
// backend/src/services/payment/paymentGateway.ts

interface PaymentGateway {
  // 创建支付订单
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;
  // 查询支付状态
  queryPayment(orderNo: string, channel: PaymentChannel): Promise<PaymentStatus>;
  // 处理支付回调
  handleCallback(channel: PaymentChannel, data: any): Promise<CallbackResult>;
  // 申请退款
  refund(orderNo: string, amount: number, reason: string): Promise<RefundResult>;
  // 检查渠道可用性
  checkChannelStatus(channel: PaymentChannel): Promise<boolean>;
}

interface CreatePaymentParams {
  orderNo: string;
  amount: number;           // 单位：分
  subject: string;          // 商品描述
  channel: PaymentChannel;  // wechat_native | wechat_h5 | alipay_pc | alipay_wap
  clientIp: string;
  returnUrl?: string;       // 支付宝同步回调URL
}

interface PaymentResult {
  success: boolean;
  channel: PaymentChannel;
  // 微信Native返回二维码URL，H5返回跳转URL
  // 支付宝返回表单HTML或跳转URL
  paymentData: string;
  expireTime: Date;
}

type PaymentChannel = 'wechat_native' | 'wechat_h5' | 'alipay_pc' | 'alipay_wap' | 'points';
```

### 2.2 OrderService (订单服务)

负责订单的创建、状态管理、查询和对账。

```typescript
// backend/src/services/order/orderService.ts

interface OrderService {
  // 创建VIP订单
  createVipOrder(params: CreateVipOrderParams): Promise<Order>;
  // 更新订单状态
  updateOrderStatus(orderNo: string, status: OrderStatus, transactionId?: string): Promise<Order>;
  // 取消订单
  cancelOrder(orderNo: string, reason: string): Promise<void>;
  // 查询用户订单列表
  getUserOrders(userId: string, params: OrderQueryParams): Promise<PageResult<Order>>;
  // 查询订单详情
  getOrderDetail(orderNo: string): Promise<Order>;
  // 检查订单是否可退款
  checkRefundable(orderNo: string): Promise<RefundableResult>;
  // 创建退款申请
  createRefundRequest(orderNo: string, reason: string): Promise<RefundRequest>;
}

interface CreateVipOrderParams {
  userId: string;
  packageId: string;
  paymentMethod: PaymentChannel;
  deviceInfo: DeviceInfo;
  sourceUrl?: string;       // 来源页面URL
  sourceResourceId?: string; // 来源资源ID
}

enum OrderStatus {
  PENDING = 0,      // 待支付
  PAID = 1,         // 已支付
  REFUNDED = 2,     // 已退款
  CANCELLED = 3,    // 已取消
  REFUND_PENDING = 4 // 退款处理中
}
```


### 2.3 VipService (VIP服务)

负责VIP状态管理、权限校验、到期处理。

```typescript
// backend/src/services/vip/vipService.ts

interface VipService {
  // 获取用户VIP信息
  getUserVipInfo(userId: string): Promise<UserVipInfo>;
  // 开通/续费VIP
  activateVip(userId: string, packageId: string, orderId: string): Promise<VipActivationResult>;
  // 检查VIP状态
  checkVipStatus(userId: string): Promise<VipStatus>;
  // 取消VIP（退款时调用）
  revokeVip(userId: string, orderId: string): Promise<void>;
  // 获取VIP图标状态
  getVipIconStatus(userId: string): Promise<VipIconStatus>;
  // 检查是否终身会员
  isLifetimeMember(userId: string): Promise<boolean>;
}

interface UserVipInfo {
  userId: string;
  vipLevel: number;
  isVip: boolean;
  isLifetime: boolean;
  expireAt: Date | null;
  daysRemaining: number;
  iconStatus: VipIconStatus;
  privileges: VipPrivilege[];
}

enum VipIconStatus {
  NONE = 'none',           // 无图标
  ACTIVE = 'active',       // 金色图标
  ACTIVE_LIFETIME = 'active_lifetime', // 金色图标+终身标签
  GRACE_PERIOD = 'grace_period'  // 灰色图标（7天宽限期）
}
```

### 2.4 DownloadService (下载服务)

负责资源下载权限校验和次数管理。

```typescript
// backend/src/services/download/downloadService.ts

interface DownloadService {
  // 检查下载权限
  checkDownloadPermission(userId: string, resourceId: string): Promise<DownloadPermission>;
  // 记录下载
  recordDownload(userId: string, resourceId: string, deviceInfo: DeviceInfo): Promise<void>;
  // 获取今日下载次数
  getTodayDownloadCount(userId: string): Promise<DownloadCountInfo>;
  // 重置每日下载次数（定时任务调用）
  resetDailyDownloadCounts(): Promise<void>;
}

interface DownloadPermission {
  allowed: boolean;
  reason?: DownloadDenyReason;
  remainingFreeDownloads?: number;  // 普通用户剩余免费次数
  remainingVipDownloads?: number;   // VIP用户剩余次数
  isFreeResource: boolean;
}

enum DownloadDenyReason {
  NOT_LOGGED_IN = 'not_logged_in',
  NOT_VIP = 'not_vip',
  FREE_LIMIT_REACHED = 'free_limit_reached',
  VIP_DAILY_LIMIT_REACHED = 'vip_daily_limit_reached',
  ACCOUNT_FROZEN = 'account_frozen'
}

interface DownloadCountInfo {
  vipDailyLimit: number;      // VIP每日上限：50
  vipUsedToday: number;       // VIP今日已用
  freeDailyLimit: number;     // 普通用户每日上限：2
  freeUsedToday: number;      // 普通用户今日已用
}
```

### 2.5 SecurityMonitor (安全监控服务)

负责异常支付行为检测和账号安全管理。

```typescript
// backend/src/services/security/securityMonitor.ts

interface SecurityMonitor {
  // 检查支付安全
  checkPaymentSecurity(userId: string, deviceInfo: DeviceInfo): Promise<SecurityCheckResult>;
  // 记录支付行为
  recordPaymentAttempt(userId: string, orderNo: string, deviceInfo: DeviceInfo): Promise<void>;
  // 检查是否需要二次验证
  requireSecondaryAuth(amount: number): boolean;
  // 验证二次验证码
  verifySecondaryAuth(userId: string, code: string): Promise<boolean>;
  // 发送二次验证码
  sendSecondaryAuthCode(userId: string): Promise<void>;
  // 解除支付限制
  unlockPayment(userId: string, adminId: string): Promise<void>;
  // 获取安全日志
  getSecurityLogs(userId: string): Promise<SecurityLog[]>;
}

interface SecurityCheckResult {
  allowed: boolean;
  reason?: SecurityBlockReason;
  requireSecondaryAuth: boolean;
}

enum SecurityBlockReason {
  TOO_MANY_UNPAID_ORDERS = 'too_many_unpaid_orders',  // 1小时内>5个未支付订单
  SUSPICIOUS_IP = 'suspicious_ip',                     // 可疑IP
  ACCOUNT_LOCKED = 'account_locked'                    // 账号被锁定
}
```


### 2.6 DeviceManager (设备管理服务)

负责多设备登录控制和设备指纹管理。

```typescript
// backend/src/services/device/deviceManager.ts

interface DeviceManager {
  // 记录设备登录
  recordDeviceLogin(userId: string, deviceInfo: DeviceInfo): Promise<DeviceSession>;
  // 获取用户设备列表
  getUserDevices(userId: string): Promise<DeviceSession[]>;
  // 踢出设备
  kickDevice(userId: string, sessionId: string): Promise<void>;
  // 检查设备数量限制
  checkDeviceLimit(userId: string): Promise<DeviceLimitResult>;
  // 生成设备指纹
  generateDeviceFingerprint(deviceInfo: DeviceInfo): string;
}

interface DeviceInfo {
  userAgent: string;
  ip: string;
  deviceType: 'pc' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  fingerprint?: string;
}

interface DeviceSession {
  sessionId: string;
  userId: string;
  deviceInfo: DeviceInfo;
  lastActiveAt: Date;
  createdAt: Date;
}

interface DeviceLimitResult {
  allowed: boolean;
  currentCount: number;
  maxCount: number;  // 最大3台设备
  kickedSessionId?: string;  // 被踢出的设备会话ID
}
```

### 2.7 NotificationService (通知服务)

负责站内信发送和VIP到期提醒。

```typescript
// backend/src/services/notification/notificationService.ts

interface NotificationService {
  // 发送站内信
  sendNotification(params: SendNotificationParams): Promise<void>;
  // 发送VIP到期提醒
  sendVipExpiryReminder(userId: string, daysRemaining: number): Promise<void>;
  // 发送支付成功通知
  sendPaymentSuccessNotification(userId: string, orderNo: string): Promise<void>;
  // 发送退款通知
  sendRefundNotification(userId: string, orderNo: string, status: string): Promise<void>;
  // 批量发送VIP到期提醒（定时任务）
  batchSendExpiryReminders(): Promise<void>;
}

interface SendNotificationParams {
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  linkUrl?: string;
}

enum NotificationType {
  VIP_EXPIRY = 'vip_expiry',
  PAYMENT_SUCCESS = 'payment_success',
  REFUND_STATUS = 'refund_status',
  SYSTEM = 'system'
}
```

### 2.8 ReconciliationService (对账服务)

负责订单对账和状态同步。

```typescript
// backend/src/services/reconciliation/reconciliationService.ts

interface ReconciliationService {
  // 执行对账任务
  runReconciliation(): Promise<ReconciliationResult>;
  // 查询并同步单个订单状态
  syncOrderStatus(orderNo: string): Promise<SyncResult>;
  // 获取待对账订单
  getPendingOrders(): Promise<Order[]>;
  // 记录对账日志
  logReconciliation(result: ReconciliationResult): Promise<void>;
}

interface ReconciliationResult {
  totalChecked: number;
  synced: number;
  cancelled: number;
  errors: ReconciliationError[];
  executedAt: Date;
}

interface SyncResult {
  orderNo: string;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;
  synced: boolean;
  error?: string;
}
```

## 3. 数据模型设计

### 3.1 新增数据表

#### 3.1.1 vip_orders (VIP订单扩展表)

```sql
CREATE TABLE vip_orders (
  vip_order_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(36) NOT NULL REFERENCES orders(order_id),
  package_id VARCHAR(36) NOT NULL REFERENCES vip_packages(package_id),
  source_url VARCHAR(500),           -- 来源页面URL
  source_resource_id VARCHAR(36),    -- 来源资源ID
  device_fingerprint VARCHAR(100),   -- 设备指纹
  device_info JSONB,                 -- 设备详细信息
  ip_address VARCHAR(50),            -- IP地址
  require_secondary_auth BOOLEAN DEFAULT FALSE,
  secondary_auth_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vip_orders_order_id ON vip_orders(order_id);
CREATE INDEX idx_vip_orders_package_id ON vip_orders(package_id);
```


#### 3.1.2 payment_callbacks (支付回调记录表)

```sql
CREATE TABLE payment_callbacks (
  callback_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_no VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,       -- wechat | alipay
  transaction_id VARCHAR(100),        -- 第三方交易号
  callback_data JSONB NOT NULL,       -- 原始回调数据
  signature VARCHAR(500),             -- 签名
  signature_valid BOOLEAN,            -- 签名验证结果
  processed BOOLEAN DEFAULT FALSE,    -- 是否已处理
  process_result VARCHAR(50),         -- 处理结果
  error_message TEXT,                 -- 错误信息
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_callbacks_order_no ON payment_callbacks(order_no);
CREATE INDEX idx_payment_callbacks_processed ON payment_callbacks(processed);
CREATE INDEX idx_payment_callbacks_created_at ON payment_callbacks(created_at DESC);
```

#### 3.1.3 device_sessions (设备会话表)

```sql
CREATE TABLE device_sessions (
  session_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(36) NOT NULL REFERENCES users(user_id),
  device_fingerprint VARCHAR(100) NOT NULL,
  device_type VARCHAR(20),            -- pc | mobile | tablet
  browser VARCHAR(50),
  os VARCHAR(50),
  ip_address VARCHAR(50),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMP DEFAULT NOW(),
  kicked_at TIMESTAMP,
  kicked_reason VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_device_sessions_user_id ON device_sessions(user_id);
CREATE INDEX idx_device_sessions_fingerprint ON device_sessions(device_fingerprint);
CREATE INDEX idx_device_sessions_active ON device_sessions(is_active);
```

#### 3.1.4 security_logs (安全日志表)

```sql
CREATE TABLE security_logs (
  log_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(36) REFERENCES users(user_id),
  event_type VARCHAR(50) NOT NULL,    -- payment_attempt | suspicious_activity | account_locked
  event_data JSONB,
  ip_address VARCHAR(50),
  device_fingerprint VARCHAR(100),
  risk_level VARCHAR(20),             -- low | medium | high
  action_taken VARCHAR(50),           -- none | blocked | require_auth
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at DESC);
```

#### 3.1.5 refund_requests (退款申请表)

```sql
CREATE TABLE refund_requests (
  refund_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(36) NOT NULL REFERENCES orders(order_id),
  user_id VARCHAR(36) NOT NULL REFERENCES users(user_id),
  refund_amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(200),
  reason_type VARCHAR(50),            -- not_satisfied | not_needed | other
  status INT DEFAULT 0,               -- 0:待审核 1:已通过 2:已拒绝 3:退款中 4:已退款 5:退款失败
  reviewer_id VARCHAR(36) REFERENCES users(user_id),
  review_note TEXT,
  reviewed_at TIMESTAMP,
  refund_transaction_id VARCHAR(100), -- 退款交易号
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);
```

#### 3.1.6 user_download_stats (用户下载统计表)

```sql
CREATE TABLE user_download_stats (
  stat_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(36) NOT NULL REFERENCES users(user_id),
  stat_date DATE NOT NULL,
  vip_download_count INT DEFAULT 0,   -- VIP下载次数
  free_download_count INT DEFAULT 0,  -- 免费下载次数
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, stat_date)
);

CREATE INDEX idx_user_download_stats_user_date ON user_download_stats(user_id, stat_date);
```

#### 3.1.7 notifications (站内信表)

```sql
CREATE TABLE notifications (
  notification_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(36) NOT NULL REFERENCES users(user_id),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  link_url VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

#### 3.1.8 points_vip_exchanges (积分兑换VIP记录表)

```sql
CREATE TABLE points_vip_exchanges (
  exchange_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(36) NOT NULL REFERENCES users(user_id),
  package_id VARCHAR(36) NOT NULL REFERENCES vip_packages(package_id),
  points_cost INT NOT NULL,
  exchange_month DATE NOT NULL,       -- 兑换月份（用于限制每月1次）
  vip_days_granted INT NOT NULL,
  status INT DEFAULT 1,               -- 0:失败 1:成功
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_points_vip_exchanges_user_id ON points_vip_exchanges(user_id);
CREATE INDEX idx_points_vip_exchanges_month ON points_vip_exchanges(exchange_month);
CREATE UNIQUE INDEX idx_points_vip_exchanges_user_month ON points_vip_exchanges(user_id, exchange_month);
```


### 3.2 现有表扩展

#### 3.2.1 orders 表扩展字段

需要在现有 `orders` 表中添加以下字段：

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expire_at TIMESTAMP;           -- 订单过期时间
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;        -- 取消时间
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason VARCHAR(200);    -- 取消原因
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status INT DEFAULT 0;   -- 退款状态
ALTER TABLE orders ADD COLUMN IF NOT EXISTS callback_count INT DEFAULT 0;  -- 回调次数（用于幂等）
```

#### 3.2.2 users 表扩展字段

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_lifetime_vip BOOLEAN DEFAULT FALSE;  -- 是否终身会员
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_activated_at TIMESTAMP;             -- VIP首次开通时间
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_locked BOOLEAN DEFAULT FALSE;   -- 支付是否被锁定
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_locked_at TIMESTAMP;            -- 支付锁定时间
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_lock_reason VARCHAR(200);       -- 锁定原因
```

## 4. API设计

### 4.1 前台API

#### 4.1.1 VIP套餐与支付

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/v1/vip/packages | 获取VIP套餐列表 | 否 |
| GET | /api/v1/vip/privileges | 获取VIP特权列表 | 否 |
| GET | /api/v1/vip/my-info | 获取用户VIP信息 | 是 |
| POST | /api/v1/vip/orders | 创建VIP订单 | 是 |
| GET | /api/v1/vip/orders | 获取用户订单列表 | 是 |
| GET | /api/v1/vip/orders/:orderNo | 获取订单详情 | 是 |
| POST | /api/v1/vip/orders/:orderNo/cancel | 取消订单 | 是 |
| POST | /api/v1/vip/orders/:orderNo/pay | 发起支付 | 是 |
| GET | /api/v1/vip/orders/:orderNo/status | 查询支付状态 | 是 |
| POST | /api/v1/vip/orders/:orderNo/refund | 申请退款 | 是 |

#### 4.1.2 积分兑换

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/v1/vip/points-exchange/info | 获取积分兑换信息 | 是 |
| POST | /api/v1/vip/points-exchange | 积分兑换VIP | 是 |
| GET | /api/v1/vip/points-exchange/records | 获取兑换记录 | 是 |

#### 4.1.3 支付回调

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/v1/payment/wechat/notify | 微信支付回调 | 签名验证 |
| POST | /api/v1/payment/alipay/notify | 支付宝支付回调 | 签名验证 |
| GET | /api/v1/payment/alipay/return | 支付宝同步回调 | 否 |

#### 4.1.4 二次验证

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/v1/vip/auth/send-code | 发送二次验证码 | 是 |
| POST | /api/v1/vip/auth/verify-code | 验证二次验证码 | 是 |

#### 4.1.5 设备管理

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/v1/user/devices | 获取登录设备列表 | 是 |
| DELETE | /api/v1/user/devices/:sessionId | 踢出设备 | 是 |

### 4.2 管理后台API

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | /api/v1/admin/vip/orders | 获取所有VIP订单 | admin |
| GET | /api/v1/admin/vip/orders/:orderId | 获取订单详情 | admin |
| POST | /api/v1/admin/vip/orders/:orderId/refund | 审核退款申请 | admin |
| GET | /api/v1/admin/vip/refunds | 获取退款申请列表 | admin |
| PUT | /api/v1/admin/vip/refunds/:refundId | 处理退款申请 | admin |
| GET | /api/v1/admin/vip/statistics | 获取VIP统计数据 | admin |
| GET | /api/v1/admin/security/logs | 获取安全日志 | admin |
| POST | /api/v1/admin/users/:userId/unlock-payment | 解除支付限制 | admin |


### 4.3 关键API详细设计

#### 4.3.1 创建VIP订单

```typescript
// POST /api/v1/vip/orders
// Request
interface CreateVipOrderRequest {
  packageId: string;           // VIP套餐ID
  paymentMethod: PaymentChannel; // 支付方式
  sourceUrl?: string;          // 来源页面URL
  sourceResourceId?: string;   // 来源资源ID
}

// Response
interface CreateVipOrderResponse {
  orderNo: string;
  amount: number;
  expireAt: string;            // 订单过期时间
  requireSecondaryAuth: boolean; // 是否需要二次验证
}
```

#### 4.3.2 发起支付

```typescript
// POST /api/v1/vip/orders/:orderNo/pay
// Request
interface PayOrderRequest {
  secondaryAuthCode?: string;  // 二次验证码（金额≥200时必填）
}

// Response
interface PayOrderResponse {
  paymentMethod: PaymentChannel;
  // 微信Native: qrCodeUrl
  // 微信H5: redirectUrl
  // 支付宝PC: formHtml
  // 支付宝WAP: redirectUrl
  paymentData: string;
  expireAt: string;
}
```

#### 4.3.3 查询支付状态

```typescript
// GET /api/v1/vip/orders/:orderNo/status
// Response
interface OrderStatusResponse {
  orderNo: string;
  status: OrderStatus;
  paidAt?: string;
  vipExpireAt?: string;        // 支付成功后返回VIP到期时间
  returnUrl?: string;          // 支付成功后的返回URL
}
```

## 5. 正确性属性 (Correctness Properties)

### 5.1 支付流程正确性

| 属性ID | 描述 | 验证方式 |
|--------|------|----------|
| CP-PAY-01 | 订单金额必须与套餐价格一致 | 创建订单时校验 |
| CP-PAY-02 | 支付回调签名必须验证通过才能处理 | 回调处理前验证 |
| CP-PAY-03 | 同一订单的支付回调必须幂等处理 | 检查订单状态和回调记录 |
| CP-PAY-04 | 订单超时后不能再支付 | 支付前检查订单状态 |
| CP-PAY-05 | 终身会员不能重复购买终身套餐 | 创建订单时校验 |

### 5.2 VIP状态正确性

| 属性ID | 描述 | 验证方式 |
|--------|------|----------|
| CP-VIP-01 | 支付成功后VIP状态必须立即生效 | 支付回调处理后验证 |
| CP-VIP-02 | 续费必须在原到期日基础上延长 | 计算到期时间时验证 |
| CP-VIP-03 | 退款成功后VIP状态必须立即失效 | 退款处理后验证 |
| CP-VIP-04 | VIP图标状态必须与实际VIP状态一致 | 获取图标状态时计算 |
| CP-VIP-05 | 终身会员到期时间必须为null且is_lifetime_vip为true | 开通终身会员时设置 |

### 5.3 下载权限正确性

| 属性ID | 描述 | 验证方式 |
|--------|------|----------|
| CP-DL-01 | VIP用户单日下载不能超过50次 | 下载前检查计数 |
| CP-DL-02 | 普通用户单日免费下载不能超过2次 | 下载前检查计数 |
| CP-DL-03 | 免费资源所有用户都可下载 | 下载前检查资源类型 |
| CP-DL-04 | 下载计数必须在每日0点重置 | 定时任务执行 |
| CP-DL-05 | 批量下载次数必须正确累加 | 批量下载时逐个计数 |

### 5.4 安全性正确性

| 属性ID | 描述 | 验证方式 |
|--------|------|----------|
| CP-SEC-01 | 金额≥200元必须进行二次验证 | 支付前检查金额 |
| CP-SEC-02 | 同一账号1小时内未支付订单>5个必须限制 | 创建订单前检查 |
| CP-SEC-03 | 同一VIP账号最多3台设备同时登录 | 登录时检查设备数 |
| CP-SEC-04 | 支付密钥不能出现在代码或日志中 | 代码审查 |
| CP-SEC-05 | 所有支付操作必须记录设备信息 | 创建订单时记录 |

### 5.5 退款正确性

| 属性ID | 描述 | 验证方式 |
|--------|------|----------|
| CP-REF-01 | 终身会员不能申请退款 | 申请退款时校验 |
| CP-REF-02 | 购买超过7天不能申请退款 | 申请退款时校验 |
| CP-REF-03 | 已下载资源的订单不能申请退款 | 申请退款时校验下载记录 |
| CP-REF-04 | 退款金额必须等于订单支付金额 | 退款时校验 |
| CP-REF-05 | 退款成功后VIP权益必须立即取消 | 退款回调处理后验证 |


## 6. 支付流程设计

### 6.1 微信支付流程

#### 6.1.1 PC端Native支付流程

```
用户 -> 前端 -> 后端 -> 微信支付
  |      |      |        |
  |  1.选择套餐  |        |
  |  2.选择微信支付       |
  |      |      |        |
  |      |--3.创建订单--->|
  |      |<--订单信息-----|
  |      |      |        |
  |      |--4.发起支付--->|
  |      |      |--5.调用Native下单API-->|
  |      |      |<--code_url-------------|
  |      |<--二维码URL----|
  |      |      |        |
  |  6.展示二维码         |
  |  7.用户扫码支付       |
  |      |      |        |
  |      |--8.轮询订单状态(每3秒)-->|
  |      |      |        |
  |      |      |<--9.微信异步回调--|
  |      |      |--10.验签+更新订单->|
  |      |      |--11.开通VIP------>|
  |      |      |        |
  |      |<--12.返回支付成功--|
  |  13.跳转成功页面      |
```

#### 6.1.2 移动端H5支付流程

```
用户 -> 前端 -> 后端 -> 微信支付
  |      |      |        |
  |  1.选择套餐  |        |
  |  2.选择微信支付       |
  |      |      |        |
  |      |--3.创建订单--->|
  |      |<--订单信息-----|
  |      |      |        |
  |      |--4.发起支付--->|
  |      |      |--5.调用H5下单API-->|
  |      |      |<--h5_url-----------|
  |      |<--跳转URL------|
  |      |      |        |
  |  6.跳转微信支付页面   |
  |  7.用户完成支付       |
  |      |      |        |
  |  8.微信回调redirect_url|
  |      |      |        |
  |      |--9.查询订单状态-->|
  |      |      |<--10.微信异步回调--|
  |      |<--支付结果-----|
  |  11.展示支付结果      |
```

### 6.2 支付宝支付流程

#### 6.2.1 PC端网站支付流程

```
用户 -> 前端 -> 后端 -> 支付宝
  |      |      |        |
  |  1.选择套餐  |        |
  |  2.选择支付宝支付     |
  |      |      |        |
  |      |--3.创建订单--->|
  |      |<--订单信息-----|
  |      |      |        |
  |      |--4.发起支付--->|
  |      |      |--5.生成支付表单-->|
  |      |<--表单HTML-----|
  |      |      |        |
  |  6.提交表单跳转支付宝 |
  |  7.用户完成支付       |
  |      |      |        |
  |  8.支付宝同步回调return_url|
  |      |      |        |
  |      |--9.查询订单状态-->|
  |      |      |<--10.支付宝异步回调--|
  |      |<--支付结果-----|
  |  11.展示支付结果      |
```

### 6.3 积分兑换流程

```
用户 -> 前端 -> 后端
  |      |      |
  |  1.选择积分兑换       |
  |      |      |
  |      |--2.获取兑换信息-->|
  |      |<--积分余额/本月已兑换--|
  |      |      |
  |  3.选择兑换时长       |
  |      |      |
  |      |--4.确认兑换--->|
  |      |      |--5.检查积分余额-->|
  |      |      |--6.检查本月兑换次数-->|
  |      |      |--7.扣除积分-->|
  |      |      |--8.开通VIP-->|
  |      |      |--9.记录兑换记录-->|
  |      |<--兑换成功-----|
  |  10.展示成功页面      |
```

## 7. 定时任务设计

### 7.1 订单对账任务

```typescript
// 每5分钟执行一次
// cron: */5 * * * *

async function reconciliationTask() {
  // 1. 查询待支付超过5分钟的订单
  const pendingOrders = await getPendingOrders(5);
  
  for (const order of pendingOrders) {
    // 2. 调用支付平台查询实际状态
    const actualStatus = await queryPaymentStatus(order);
    
    if (actualStatus === 'PAID' && order.status === 'PENDING') {
      // 3. 同步状态：已支付但本地未更新
      await syncOrderToPaid(order);
    } else if (actualStatus === 'NOT_PAID' && order.isExpired()) {
      // 4. 关闭超时订单
      await cancelOrder(order, 'timeout');
    }
  }
  
  // 5. 记录对账日志
  await logReconciliation(result);
}
```

### 7.2 VIP到期提醒任务

```typescript
// 每天早上9点执行
// cron: 0 9 * * *

async function vipExpiryReminderTask() {
  // 1. 查询3天后到期的VIP用户
  const users3Days = await getExpiringUsers(3);
  for (const user of users3Days) {
    await sendExpiryReminder(user, 3);
  }
  
  // 2. 查询1天后到期的VIP用户
  const users1Day = await getExpiringUsers(1);
  for (const user of users1Day) {
    await sendExpiryReminder(user, 1);
  }
  
  // 3. 查询今天到期的VIP用户
  const usersToday = await getExpiringUsers(0);
  for (const user of usersToday) {
    await sendExpiryNotification(user);
  }
  
  // 4. 查询到期超过7天的用户（隐藏VIP图标）
  const usersExpired7Days = await getExpiredUsers(7);
  for (const user of usersExpired7Days) {
    await sendFinalReminder(user);
  }
}
```

### 7.3 下载次数重置任务

```typescript
// 每天0点执行
// cron: 0 0 * * *

async function resetDownloadCountsTask() {
  // 重置所有用户的每日下载计数
  // 实际上不需要重置，因为使用日期作为统计维度
  // 只需要清理过期的统计记录（可选）
  await cleanupOldDownloadStats(30); // 保留30天
}
```


## 8. 前端组件设计

### 8.1 VIP中心页面重构

```
src/views/VIP/
├── index.vue                    # VIP中心主页面
├── components/
│   ├── PackageList.vue          # 套餐列表组件
│   ├── PackageCard.vue          # 套餐卡片组件
│   ├── PaymentMethodSelector.vue # 支付方式选择器
│   ├── PaymentDialog.vue        # 支付弹窗（二维码/跳转）
│   ├── SecondaryAuthDialog.vue  # 二次验证弹窗
│   ├── PointsExchangePanel.vue  # 积分兑换面板
│   └── PaymentSuccessDialog.vue # 支付成功弹窗
├── OrderList.vue                # 订单列表页面
└── OrderDetail.vue              # 订单详情页面
```

### 8.2 VIP状态组件

```
src/components/business/
├── VipIcon.vue                  # VIP图标组件（金色/灰色/终身）
├── VipBadge.vue                 # VIP徽章组件（用于头像旁）
├── VipStatusCard.vue            # VIP状态卡片（个人中心）
├── VipPromotionBanner.vue       # VIP推广横幅
└── VipDownloadButton.vue        # VIP下载按钮（带权限校验）
```

### 8.3 Pinia Store设计

```typescript
// src/stores/vip.ts

interface VipState {
  // 用户VIP信息
  userVipInfo: UserVipInfo | null;
  // VIP套餐列表
  packages: VipPackage[];
  // 当前订单
  currentOrder: VipOrder | null;
  // 支付状态
  paymentStatus: PaymentStatus;
  // 加载状态
  loading: boolean;
}

interface VipActions {
  // 获取用户VIP信息
  fetchUserVipInfo(): Promise<void>;
  // 获取套餐列表
  fetchPackages(): Promise<void>;
  // 创建订单
  createOrder(params: CreateOrderParams): Promise<VipOrder>;
  // 发起支付
  initiatePayment(orderNo: string): Promise<PaymentResult>;
  // 轮询支付状态
  pollPaymentStatus(orderNo: string): Promise<void>;
  // 取消订单
  cancelOrder(orderNo: string): Promise<void>;
  // 积分兑换
  exchangePoints(packageId: string): Promise<void>;
  // 刷新VIP状态
  refreshVipStatus(): Promise<void>;
}
```

### 8.4 VIP图标组件设计

```vue
<!-- src/components/business/VipIcon.vue -->
<script setup lang="ts">
interface Props {
  /** VIP状态 */
  status: 'none' | 'active' | 'active_lifetime' | 'grace_period';
  /** 图标大小 */
  size?: 'small' | 'medium' | 'large';
  /** 是否显示终身标签 */
  showLifetimeLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  showLifetimeLabel: true
});

const sizeMap = {
  small: 20,
  medium: 24,
  large: 32
};
</script>

<template>
  <div v-if="status !== 'none'" class="vip-icon-wrapper">
    <div 
      class="vip-icon"
      :class="[
        `vip-icon--${size}`,
        { 'vip-icon--gray': status === 'grace_period' }
      ]"
    >
      <svg><!-- VIP图标SVG --></svg>
    </div>
    <span 
      v-if="status === 'active_lifetime' && showLifetimeLabel"
      class="lifetime-label"
    >
      终身
    </span>
  </div>
</template>

<style scoped>
.vip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
}

.vip-icon--gray {
  background: #ccc;
  opacity: 0.5;
}

.vip-icon--small { width: 20px; height: 20px; }
.vip-icon--medium { width: 24px; height: 24px; }
.vip-icon--large { width: 32px; height: 32px; }

.lifetime-label {
  font-size: 12px;
  color: #fff;
  background: #ff4d4f;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
}
</style>
```

## 9. 错误处理策略

### 9.1 支付错误码定义

| 错误码 | 描述 | 前端处理 |
|--------|------|----------|
| PAY_001 | 订单不存在 | 提示重新下单 |
| PAY_002 | 订单已过期 | 提示重新下单 |
| PAY_003 | 订单已支付 | 跳转成功页面 |
| PAY_004 | 订单已取消 | 提示重新下单 |
| PAY_005 | 支付渠道不可用 | 提示切换支付方式 |
| PAY_006 | 二次验证失败 | 提示重新输入验证码 |
| PAY_007 | 支付被限制 | 提示联系客服 |
| PAY_008 | 终身会员不能重复购买 | 隐藏终身套餐 |
| PAY_009 | 积分不足 | 提示积分不足 |
| PAY_010 | 本月已兑换 | 提示下月再来 |

### 9.2 网络异常处理

```typescript
// 前端支付状态恢复逻辑
async function recoverPaymentStatus(orderNo: string) {
  try {
    // 1. 查询本地订单状态
    const localOrder = getLocalOrder(orderNo);
    
    // 2. 查询服务端订单状态
    const serverOrder = await queryOrderStatus(orderNo);
    
    if (serverOrder.status === 'PAID') {
      // 已支付，跳转成功页面
      router.push({ name: 'PaymentSuccess', query: { orderNo } });
    } else if (serverOrder.status === 'PENDING' && !serverOrder.isExpired) {
      // 未支付且未过期，恢复支付页面
      showPaymentDialog(serverOrder);
    } else {
      // 已取消或已过期
      showMessage('订单已取消，请重新下单');
    }
  } catch (error) {
    showMessage('网络异常，请稍后重试');
  }
}
```

## 10. 测试策略

### 10.1 单元测试

| 模块 | 测试重点 |
|------|----------|
| PaymentGateway | 签名生成/验证、金额计算、渠道切换 |
| OrderService | 订单状态流转、幂等性、超时处理 |
| VipService | VIP状态计算、续费逻辑、到期处理 |
| DownloadService | 权限校验、次数统计、每日重置 |
| SecurityMonitor | 异常检测、限制逻辑、解锁流程 |

### 10.2 集成测试

| 场景 | 测试内容 |
|------|----------|
| 完整支付流程 | 创建订单→支付→回调→VIP开通 |
| 退款流程 | 申请退款→审核→退款→VIP取消 |
| 积分兑换 | 检查积分→兑换→扣积分→VIP开通 |
| 对账流程 | 模拟回调丢失→对账任务→状态同步 |

### 10.3 E2E测试

| 场景 | 测试内容 |
|------|----------|
| VIP购买流程 | 选择套餐→选择支付方式→支付→成功页面 |
| 订单管理 | 查看订单→取消订单→申请退款 |
| VIP状态展示 | VIP图标显示→到期后灰色→续费后恢复 |
| 下载权限 | VIP下载→普通用户下载→次数限制 |

### 10.4 沙箱测试

1. 微信支付沙箱：使用微信支付仿真测试系统
2. 支付宝沙箱：使用支付宝开放平台沙箱环境
3. 测试账号：申请官方测试账号进行全流程测试

## 11. 环境配置

### 11.1 环境变量

```env
# 支付环境 (sandbox | production)
PAYMENT_ENV=sandbox

# 微信支付配置
WECHAT_PAY_APP_ID=wx1234567890
WECHAT_PAY_MCH_ID=1234567890
WECHAT_PAY_API_KEY_V3=your-api-key-v3
WECHAT_PAY_CERT_SERIAL_NO=your-cert-serial-no
WECHAT_PAY_PRIVATE_KEY_PATH=./certs/wechat/apiclient_key.pem
WECHAT_PAY_CERT_PATH=./certs/wechat/apiclient_cert.pem
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/v1/payment/wechat/notify

# 支付宝配置
ALIPAY_APP_ID=2021001234567890
ALIPAY_PRIVATE_KEY=your-private-key
ALIPAY_ALIPAY_PUBLIC_KEY=alipay-public-key
ALIPAY_NOTIFY_URL=https://your-domain.com/api/v1/payment/alipay/notify
ALIPAY_RETURN_URL=https://your-domain.com/vip/payment/return

# 安全配置
SECONDARY_AUTH_THRESHOLD=20000  # 二次验证阈值（分）
MAX_UNPAID_ORDERS_PER_HOUR=5    # 每小时最大未支付订单数
MAX_DEVICES_PER_USER=3          # 每用户最大设备数
VIP_DAILY_DOWNLOAD_LIMIT=50     # VIP每日下载上限
FREE_DAILY_DOWNLOAD_LIMIT=2     # 普通用户每日免费下载次数

# 积分兑换配置
POINTS_PER_VIP_MONTH=1000       # 每月VIP所需积分
MAX_EXCHANGE_MONTHS=3           # 单次最大兑换月数
```

### 11.2 证书文件结构

```
backend/
├── certs/
│   ├── wechat/
│   │   ├── apiclient_key.pem      # 商户API私钥
│   │   ├── apiclient_cert.pem     # 商户API证书
│   │   └── wechatpay_cert.pem     # 微信支付平台证书
│   └── alipay/
│       └── app_private_key.pem    # 应用私钥
```

## 12. 部署注意事项

1. **HTTPS必须**: 微信支付和支付宝都要求回调地址必须是HTTPS
2. **域名备案**: 回调域名必须完成ICP备案
3. **证书安全**: 支付证书文件不能提交到代码仓库，使用环境变量或密钥管理服务
4. **日志脱敏**: 支付相关日志不能记录完整的密钥、证书内容
5. **回调幂等**: 支付回调可能重复发送，必须保证幂等处理
6. **对账机制**: 必须实现定时对账，防止回调丢失导致状态不一致
