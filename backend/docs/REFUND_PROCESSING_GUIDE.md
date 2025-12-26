# 退款处理流程指南

本文档详细说明VIP会员支付系统中退款申请的处理流程、审核规则和异常处理方案。

## 目录

1. [概述](#概述)
2. [退款条件与规则](#退款条件与规则)
3. [退款流程详解](#退款流程详解)
4. [用户端退款操作](#用户端退款操作)
5. [管理员审核流程](#管理员审核流程)
6. [支付平台退款对接](#支付平台退款对接)
7. [退款异常处理](#退款异常处理)
8. [退款状态说明](#退款状态说明)
9. [常见问题与解决方案](#常见问题与解决方案)
10. [相关API接口](#相关api接口)

---

## 概述

### 退款系统架构


```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              退款处理系统                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  用户申请    │───▶│  条件校验    │───▶│  创建工单    │                   │
│  │  退款        │    │  (7天/下载)  │    │  (待审核)    │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│                                                 │                            │
│                                                 ▼                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  VIP取消     │◀───│  退款执行    │◀───│  管理员审核  │                   │
│  │  权益回收    │    │  (支付平台)  │    │  (通过/拒绝) │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                   │                                                │
│         ▼                   ▼                                                │
│  ┌──────────────┐    ┌──────────────┐                                       │
│  │  通知用户    │    │  更新订单    │                                       │
│  │  (站内信)    │    │  状态        │                                       │
│  └──────────────┘    └──────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 核心文件位置

| 文件 | 说明 |
|------|------|
| `backend/src/controllers/vipPaymentController.ts` | 用户退款申请接口 |
| `backend/src/controllers/adminVipController.ts` | 管理员退款审核接口 |
| `backend/src/services/order/vipOrderService.ts` | 退款业务逻辑 |
| `backend/src/services/payment/paymentGateway.ts` | 支付平台退款调用 |
| `backend/src/services/vip/vipService.ts` | VIP状态管理 |
| `backend/src/services/notification/notificationService.ts` | 退款通知服务 |

---

## 退款条件与规则

### 可退款条件

用户申请退款需同时满足以下条件：

| 条件 | 说明 | 校验方式 |
|------|------|----------|
| 套餐类型 | 月度/季度/年度VIP | 检查 `is_lifetime` 字段 |
| 购买时间 | 购买后7天内 | 计算 `paid_at` 与当前时间差 |
| 下载记录 | 未下载任何资源 | 查询 `download_records` 表 |
| 订单状态 | 已支付状态 | 检查 `payment_status = 1` |
| 退款历史 | 无进行中的退款申请 | 查询 `refund_requests` 表 |

### 不可退款情况

| 情况 | 原因 | 用户提示 |
|------|------|----------|
| 终身会员 | 终身会员不支持退款 | "终身会员不支持退款" |
| 超过7天 | 已超过退款期限 | "已超过退款期限（7天）" |
| 已下载资源 | 已使用VIP权益 | "已下载资源，不支持退款" |
| 积分兑换 | 积分兑换不支持退款 | "积分兑换的VIP不支持退款" |
| 已有退款申请 | 存在进行中的退款 | "您已有进行中的退款申请" |

### 退款金额规则

- **全额退款**: 退款金额等于订单支付金额
- **不支持部分退款**: 系统不支持按比例退款
- **退款到账**: 原路返回至支付账户


---

## 退款流程详解

### 完整流程图

```
用户                    系统                    管理员                支付平台
 │                       │                       │                      │
 │  1.申请退款           │                       │                      │
 │──────────────────────▶│                       │                      │
 │                       │                       │                      │
 │                       │  2.校验退款条件       │                      │
 │                       │  (套餐/时间/下载)     │                      │
 │                       │                       │                      │
 │  3.返回校验结果       │                       │                      │
 │◀──────────────────────│                       │                      │
 │                       │                       │                      │
 │                       │  4.创建退款工单       │                      │
 │                       │  (状态:待审核)        │                      │
 │                       │                       │                      │
 │                       │  5.发送审核通知       │                      │
 │                       │──────────────────────▶│                      │
 │                       │                       │                      │
 │                       │                       │  6.审核退款申请      │
 │                       │                       │  (通过/拒绝)         │
 │                       │                       │                      │
 │                       │  7.审核结果           │                      │
 │                       │◀──────────────────────│                      │
 │                       │                       │                      │
 │                       │  8.调用退款接口       │                      │
 │                       │─────────────────────────────────────────────▶│
 │                       │                       │                      │
 │                       │  9.退款结果           │                      │
 │                       │◀─────────────────────────────────────────────│
 │                       │                       │                      │
 │                       │  10.更新订单状态      │                      │
 │                       │  11.取消VIP权益       │                      │
 │                       │  12.发送通知          │                      │
 │                       │                       │                      │
 │  13.退款完成通知      │                       │                      │
 │◀──────────────────────│                       │                      │
 │                       │                       │                      │
```

### 流程步骤说明

#### 步骤1-3: 用户申请退款

```typescript
// 用户调用退款申请接口
POST /api/v1/vip/orders/:orderNo/refund
{
  "reason": "不需要了",
  "reasonType": "not_needed"
}

// 系统校验退款条件
const refundable = await vipOrderService.checkRefundable(orderNo);
if (!refundable.refundable) {
  return { code: 400, message: refundable.reason };
}
```

#### 步骤4-5: 创建退款工单

```typescript
// 创建退款申请记录
const refundRequest = await prisma.refund_requests.create({
  data: {
    refund_id: generateUUID(),
    order_id: order.order_id,
    user_id: userId,
    refund_amount: order.amount,
    reason: reason,
    reason_type: reasonType,
    status: 0,  // 待审核
    created_at: new Date(),
  }
});

// 发送站内信通知管理员
await notificationService.sendNotification({
  userId: adminUserId,
  title: '新的退款申请',
  content: `用户 ${username} 申请退款，订单号：${orderNo}`,
  type: 'system',
  linkUrl: `/admin/vip/refunds/${refundRequest.refund_id}`,
});
```

#### 步骤6-7: 管理员审核

```typescript
// 管理员审核接口
PUT /api/v1/admin/vip/refunds/:refundId
{
  "action": "approve",  // 或 "reject"
  "adminNote": "审核通过"
}
```

#### 步骤8-9: 调用支付平台退款

```typescript
// 根据支付渠道调用对应退款接口
const refundResult = await paymentGateway.refund({
  orderNo: order.order_no,
  refundNo: `RF${Date.now()}`,
  totalAmount: Math.round(order.amount * 100),  // 转换为分
  refundAmount: Math.round(order.amount * 100),
  reason: '用户申请退款',
  channel: order.payment_method,
});
```

#### 步骤10-13: 完成退款

```typescript
// 更新订单状态
await prisma.orders.update({
  where: { order_id: order.order_id },
  data: {
    payment_status: 2,  // 已退款
    refund_status: 4,   // 已退款
    updated_at: new Date(),
  }
});

// 取消VIP权益
await vipService.revokeVip(order.user_id, order.order_id);

// 发送退款完成通知
await notificationService.sendRefundNotification(
  order.user_id,
  order.order_no,
  'completed'
);
```


---

## 用户端退款操作

### 退款入口

用户可以通过以下方式申请退款：

1. **订单详情页**: 在符合条件的订单详情页显示"申请退款"按钮
2. **我的订单列表**: 在订单列表中点击"申请退款"

### 退款申请界面

```
┌─────────────────────────────────────────────────────────────┐
│                      申请退款                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  订单信息                                                    │
│  ─────────────────────────────────────────────────────────  │
│  订单号：VIP20251226143000001                               │
│  套餐名称：月度会员                                          │
│  支付金额：¥99.00                                           │
│  支付时间：2025-12-26 14:30:00                              │
│                                                              │
│  退款原因 *                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ 资源不符合预期                                     │   │
│  │ ○ 不需要了                                           │   │
│  │ ○ 其他                                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  补充说明（选填）                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ⚠️ 退款须知：                                               │
│  • 退款将在3-7个工作日内原路返回                            │
│  • 退款成功后VIP权益将立即失效                              │
│  • 退款申请需管理员审核                                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    提交申请                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 退款原因类型

| 类型代码 | 显示文本 | 说明 |
|----------|----------|------|
| `not_satisfied` | 资源不符合预期 | 用户对VIP资源不满意 |
| `not_needed` | 不需要了 | 用户不再需要VIP服务 |
| `other` | 其他 | 其他原因 |

### 用户端状态展示

| 退款状态 | 用户端显示 | 操作按钮 |
|----------|------------|----------|
| 待审核 | "退款申请审核中" | 无 |
| 已通过 | "退款处理中" | 无 |
| 已拒绝 | "退款申请被拒绝" | 查看原因 |
| 退款中 | "退款处理中" | 无 |
| 已退款 | "退款成功" | 无 |
| 退款失败 | "退款失败" | 联系客服 |

---

## 管理员审核流程

### 审核入口

管理员通过以下路径进入退款审核页面：

```
管理后台 → VIP管理 → 退款管理
路由: /admin/vip/refunds
```

### 退款列表页面

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  退款管理                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  筛选条件：                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  ┌──────────┐   │
│  │ 全部状态 ▼│  │ 开始日期 │  │ 结束日期                 │  │   搜索   │   │
│  └──────────┘  └──────────┘  └──────────────────────────┘  └──────────┘   │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 退款ID    │ 订单号           │ 用户    │ 金额   │ 原因     │ 状态   │ 操作 │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │ RF001     │ VIP202512260001  │ user1   │ ¥99    │ 不需要了 │ 待审核 │ 审核 │
│  │ RF002     │ VIP202512260002  │ user2   │ ¥299   │ 其他     │ 已通过 │ 详情 │
│  │ RF003     │ VIP202512260003  │ user3   │ ¥99    │ 不满意   │ 已拒绝 │ 详情 │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  共 50 条记录  < 1 2 3 4 5 >                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 审核详情页面

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  退款申请详情                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  基本信息                                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  退款申请ID：RF20251226001                                                  │
│  申请时间：2025-12-26 15:00:00                                              │
│  当前状态：待审核                                                            │
│                                                                              │
│  订单信息                                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  订单号：VIP20251226143000001                                               │
│  套餐名称：月度会员                                                          │
│  支付金额：¥99.00                                                           │
│  支付方式：微信支付                                                          │
│  支付时间：2025-12-26 14:30:00                                              │
│                                                                              │
│  用户信息                                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  用户ID：user_xxx                                                           │
│  用户名：张三                                                                │
│  邮箱：zhangsan@example.com                                                 │
│  下载记录：0 次（符合退款条件）                                              │
│                                                                              │
│  退款原因                                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  原因类型：不需要了                                                          │
│  补充说明：暂时不需要VIP服务                                                 │
│                                                                              │
│  审核操作                                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  审核备注：                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                                  │
│  │   通过并退款    │  │   拒绝申请      │                                  │
│  └─────────────────┘  └─────────────────┘                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 审核要点

管理员审核时需要确认以下信息：

1. **订单有效性**: 确认订单存在且状态正确
2. **退款条件**: 确认符合退款条件（7天内、未下载）
3. **用户历史**: 查看用户是否有频繁退款记录
4. **退款原因**: 评估退款原因是否合理

### 审核操作

#### 通过退款

```typescript
// 管理员点击"通过并退款"
PUT /api/v1/admin/vip/refunds/:refundId
{
  "action": "approve",
  "adminNote": "符合退款条件，审核通过"
}
```

#### 拒绝退款

```typescript
// 管理员点击"拒绝申请"
PUT /api/v1/admin/vip/refunds/:refundId
{
  "action": "reject",
  "adminNote": "用户已下载资源，不符合退款条件"
}
```


---

## 支付平台退款对接

### 微信支付退款

#### 接口信息

| 项目 | 说明 |
|------|------|
| 接口名称 | 申请退款 |
| 接口地址 | `https://api.mch.weixin.qq.com/v3/refund/domestic/refunds` |
| 请求方式 | POST |
| 签名方式 | API V3 签名 |

#### 请求参数

```typescript
interface WechatRefundRequest {
  out_trade_no: string;      // 商户订单号
  out_refund_no: string;     // 商户退款单号
  reason?: string;           // 退款原因
  notify_url?: string;       // 退款结果通知URL
  amount: {
    refund: number;          // 退款金额（分）
    total: number;           // 原订单金额（分）
    currency: string;        // 货币类型 CNY
  };
}
```

#### 调用示例

```typescript
// backend/src/services/payment/wechatPay.ts
async refund(params: {
  orderNo: string;
  refundNo: string;
  totalAmount: number;
  refundAmount: number;
  reason?: string;
}): Promise<WechatRefundResult> {
  const result = await this.wxpay.refunds({
    out_trade_no: params.orderNo,
    out_refund_no: params.refundNo,
    reason: params.reason || '用户申请退款',
    notify_url: config.wechat.notifyUrl.replace('/notify', '/refund-notify'),
    amount: {
      refund: params.refundAmount,
      total: params.totalAmount,
      currency: 'CNY',
    },
  });

  return {
    success: result.status === 200,
    refund_id: result.data?.refund_id,
    status: result.data?.status,
  };
}
```

#### 退款状态

| 状态 | 说明 |
|------|------|
| SUCCESS | 退款成功 |
| CLOSED | 退款关闭 |
| PROCESSING | 退款处理中 |
| ABNORMAL | 退款异常 |

### 支付宝退款

#### 接口信息

| 项目 | 说明 |
|------|------|
| 接口名称 | 统一收单交易退款接口 |
| 接口地址 | `alipay.trade.refund` |
| 请求方式 | POST |
| 签名方式 | RSA2 |

#### 请求参数

```typescript
interface AlipayRefundRequest {
  out_trade_no: string;      // 商户订单号
  out_request_no: string;    // 退款请求号
  refund_amount: string;     // 退款金额（元）
  refund_reason?: string;    // 退款原因
}
```

#### 调用示例

```typescript
// backend/src/services/payment/alipay.ts
async refund(params: {
  orderNo: string;
  refundNo: string;
  refundAmount: string;
  reason?: string;
}): Promise<AlipayRefundResult> {
  const result = await this.alipaySdk.exec('alipay.trade.refund', {
    bizContent: {
      out_trade_no: params.orderNo,
      out_request_no: params.refundNo,
      refund_amount: params.refundAmount,
      refund_reason: params.reason || '用户申请退款',
    },
  });

  return {
    success: result.code === '10000',
    refund_fee: result.refundFee,
    gmt_refund_pay: result.gmtRefundPay,
  };
}
```

#### 响应码说明

| 响应码 | 说明 |
|--------|------|
| 10000 | 退款成功 |
| 40004 | 业务处理失败 |
| 20000 | 服务不可用 |

### 统一退款网关

```typescript
// backend/src/services/payment/paymentGateway.ts
async refund(params: {
  orderNo: string;
  refundNo: string;
  totalAmount: number;
  refundAmount: number;
  reason?: string;
  channel: PaymentChannel;
}): Promise<RefundResult> {
  // 根据支付渠道选择退款方式
  if (params.channel.includes('wechat')) {
    return await wechatPayService.refund({
      orderNo: params.orderNo,
      refundNo: params.refundNo,
      totalAmount: params.totalAmount,
      refundAmount: params.refundAmount,
      reason: params.reason,
    });
  } else if (params.channel.includes('alipay')) {
    return await alipayService.refund({
      orderNo: params.orderNo,
      refundNo: params.refundNo,
      refundAmount: (params.refundAmount / 100).toFixed(2),  // 转换为元
      reason: params.reason,
    });
  }

  return { success: false, error: '不支持的支付渠道' };
}
```


---

## 退款异常处理

### 异常类型分类

| 异常类型 | 描述 | 严重程度 | 处理方式 |
|----------|------|----------|----------|
| 网络超时 | 支付平台接口超时 | 中 | 自动重试 |
| 签名错误 | 请求签名验证失败 | 高 | 检查证书配置 |
| 余额不足 | 商户账户余额不足 | 严重 | 人工充值 |
| 订单不存在 | 支付平台找不到订单 | 高 | 人工核实 |
| 重复退款 | 订单已退款 | 低 | 幂等处理 |
| 退款金额错误 | 退款金额超过可退金额 | 高 | 人工核实 |

### 异常处理流程

```
                    ┌─────────────────┐
                    │   退款请求      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   调用支付平台   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │  成功    │   │  失败    │   │  超时    │
       └────┬─────┘   └────┬─────┘   └────┬─────┘
            │              │              │
            ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ 更新状态 │   │ 记录日志 │   │ 重试机制 │
       │ 通知用户 │   │ 发送告警 │   │ (3次)    │
       └──────────┘   └──────────┘   └────┬─────┘
                                          │
                           ┌──────────────┼──────────────┐
                           │              │              │
                           ▼              ▼              ▼
                    ┌──────────┐   ┌──────────┐   ┌──────────┐
                    │ 重试成功 │   │ 重试失败 │   │ 人工处理 │
                    └──────────┘   └──────────┘   └──────────┘
```

### 重试机制

```typescript
const REFUND_RETRY_CONFIG = {
  maxRetries: 3,           // 最大重试次数
  retryIntervalMs: 60000,  // 重试间隔（1分钟）
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNREFUSED',
    'SYSTEM_ERROR',
  ],
};

async function refundWithRetry(params: RefundParams): Promise<RefundResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= REFUND_RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const result = await paymentGateway.refund(params);
      if (result.success) {
        return result;
      }

      // 检查是否可重试
      if (!isRetryableError(result.error)) {
        return result;
      }

      lastError = new Error(result.error);
    } catch (error) {
      lastError = error as Error;
    }

    // 等待后重试
    if (attempt < REFUND_RETRY_CONFIG.maxRetries) {
      await sleep(REFUND_RETRY_CONFIG.retryIntervalMs);
    }
  }

  // 重试失败，记录日志并告警
  await logRefundFailure(params, lastError);
  await sendRefundAlert(params, lastError);

  return { success: false, error: '退款失败，已通知管理员处理' };
}
```

### 异常告警

当退款出现异常时，系统会发送告警通知：

```
【VIP支付系统告警】

告警级别: 高
告警时间: 2025-12-26 15:30:00
异常类型: 退款失败

退款信息:
- 退款申请ID: RF20251226001
- 订单号: VIP20251226143000001
- 退款金额: ¥99.00
- 支付渠道: 微信支付
- 错误信息: NOTENOUGH - 商户余额不足

处理建议:
1. 检查商户账户余额
2. 充值后重新发起退款
3. 联系用户说明情况

操作入口: https://admin.example.com/admin/vip/refunds/RF20251226001
```

### 人工处理指南

#### 场景1: 商户余额不足

```
1. 登录微信商户平台/支付宝商户后台
2. 查看账户余额
3. 进行充值操作
4. 返回管理后台，重新发起退款
```

#### 场景2: 订单不存在

```
1. 核实订单号是否正确
2. 检查支付平台交易记录
3. 如果确实不存在，联系支付平台客服
4. 必要时进行线下退款
```

#### 场景3: 重复退款

```
1. 查询支付平台退款记录
2. 确认退款是否已成功
3. 如果已成功，更新本地订单状态
4. 通知用户退款已完成
```


---

## 退款状态说明

### 状态流转图

```
                    ┌─────────────────┐
                    │   用户申请      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   待审核 (0)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ 已通过(1)│   │ 已拒绝(2)│   │ 超时关闭 │
       └────┬─────┘   └──────────┘   └──────────┘
            │
            ▼
       ┌──────────┐
       │ 退款中(3)│
       └────┬─────┘
            │
     ┌──────┼──────┐
     │             │
     ▼             ▼
┌──────────┐ ┌──────────┐
│ 已退款(4)│ │退款失败(5)│
└──────────┘ └──────────┘
```

### 状态码定义

| 状态码 | 状态名称 | 说明 | 用户可见 |
|--------|----------|------|----------|
| 0 | 待审核 | 用户已提交，等待管理员审核 | 审核中 |
| 1 | 已通过 | 管理员审核通过，准备退款 | 处理中 |
| 2 | 已拒绝 | 管理员拒绝退款申请 | 已拒绝 |
| 3 | 退款中 | 正在调用支付平台退款 | 处理中 |
| 4 | 已退款 | 退款成功完成 | 退款成功 |
| 5 | 退款失败 | 退款调用失败 | 退款失败 |

### 状态转换规则

| 当前状态 | 可转换状态 | 触发条件 |
|----------|------------|----------|
| 待审核(0) | 已通过(1) | 管理员审核通过 |
| 待审核(0) | 已拒绝(2) | 管理员拒绝申请 |
| 已通过(1) | 退款中(3) | 开始调用支付平台 |
| 退款中(3) | 已退款(4) | 支付平台返回成功 |
| 退款中(3) | 退款失败(5) | 支付平台返回失败 |
| 退款失败(5) | 退款中(3) | 管理员重新发起退款 |

### 数据库表结构

```sql
-- refund_requests 表
CREATE TABLE refund_requests (
  refund_id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL REFERENCES orders(order_id),
  user_id VARCHAR(36) NOT NULL REFERENCES users(user_id),
  refund_amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(200),
  reason_type VARCHAR(50),
  status INT DEFAULT 0,
  admin_note TEXT,
  processed_by VARCHAR(36) REFERENCES users(user_id),
  processed_at TIMESTAMP,
  refund_no VARCHAR(100),
  refund_transaction_id VARCHAR(100),
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);
CREATE INDEX idx_refund_requests_created_at ON refund_requests(created_at DESC);
```

---

## 常见问题与解决方案

### Q1: 用户反馈退款未到账？

**排查步骤**:

```sql
-- 1. 查询退款申请状态
SELECT 
  rr.refund_id,
  rr.status,
  rr.refund_no,
  rr.refund_transaction_id,
  rr.refunded_at,
  o.order_no,
  o.payment_method
FROM refund_requests rr
JOIN orders o ON rr.order_id = o.order_id
WHERE o.order_no = 'VIP20251226xxx';

-- 2. 检查订单状态
SELECT order_no, payment_status, refund_status
FROM orders
WHERE order_no = 'VIP20251226xxx';
```

**处理方案**:

1. 如果状态为"已退款"，告知用户退款到账时间（微信1-3天，支付宝即时）
2. 如果状态为"退款中"，查询支付平台退款状态
3. 如果状态为"退款失败"，查看失败原因并重新发起

### Q2: 退款申请长时间未处理？

**排查步骤**:

```sql
-- 查询超过24小时未处理的退款申请
SELECT 
  rr.refund_id,
  rr.created_at,
  u.username,
  o.order_no,
  o.amount
FROM refund_requests rr
JOIN users u ON rr.user_id = u.user_id
JOIN orders o ON rr.order_id = o.order_id
WHERE rr.status = 0
  AND rr.created_at < NOW() - INTERVAL '24 hours'
ORDER BY rr.created_at ASC;
```

**处理方案**:

1. 通知管理员及时处理
2. 考虑设置自动审核规则（符合条件自动通过）
3. 向用户发送处理进度通知

### Q3: 退款成功但VIP未取消？

**排查步骤**:

```sql
-- 检查用户VIP状态
SELECT 
  u.user_id,
  u.vip_level,
  u.vip_expire_at,
  rr.status as refund_status,
  rr.refunded_at
FROM users u
JOIN refund_requests rr ON u.user_id = rr.user_id
WHERE rr.refund_id = 'RF20251226xxx';
```

**处理方案**:

```sql
-- 手动取消VIP权益
UPDATE users
SET 
  vip_level = 0,
  vip_expire_at = NULL,
  updated_at = NOW()
WHERE user_id = 'user_xxx';
```

### Q4: 如何查看退款统计？

```sql
-- 退款统计查询
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as rejected,
  SUM(CASE WHEN status = 5 THEN 1 ELSE 0 END) as failed,
  SUM(CASE WHEN status = 4 THEN refund_amount ELSE 0 END) as total_refunded
FROM refund_requests
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Q5: 如何处理频繁退款用户？

**识别方法**:

```sql
-- 查询频繁退款用户
SELECT 
  u.user_id,
  u.username,
  COUNT(rr.refund_id) as refund_count,
  SUM(rr.refund_amount) as total_refunded
FROM users u
JOIN refund_requests rr ON u.user_id = rr.user_id
WHERE rr.status = 4
  AND rr.created_at > NOW() - INTERVAL '90 days'
GROUP BY u.user_id, u.username
HAVING COUNT(rr.refund_id) >= 3
ORDER BY refund_count DESC;
```

**处理建议**:

1. 标记为高风险用户
2. 后续退款申请需人工审核
3. 必要时限制购买VIP


---

## 相关API接口

### 用户端接口

#### 申请退款

```http
POST /api/v1/vip/orders/:orderNo/refund
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "不需要了",
  "reasonType": "not_needed"
}
```

**响应**:

```json
{
  "code": 0,
  "message": "退款申请已提交，请等待审核",
  "data": {
    "refundId": "RF20251226001",
    "status": 0,
    "createdAt": "2025-12-26T15:00:00Z"
  }
}
```

**错误响应**:

| code | message |
|------|---------|
| 400 | 请填写退款原因 |
| 400 | 终身会员不支持退款 |
| 400 | 已超过退款期限 |
| 400 | 已下载资源，不支持退款 |
| 400 | 您已有进行中的退款申请 |

### 管理员接口

#### 获取退款列表

```http
GET /api/v1/admin/vip/refunds
Authorization: Bearer {token}
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |
| status | number | 否 | 状态筛选 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应**:

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "refundId": "RF20251226001",
        "orderNo": "VIP20251226143000001",
        "userId": "user_xxx",
        "username": "张三",
        "email": "zhangsan@example.com",
        "amount": 99.00,
        "productName": "月度会员",
        "reason": "不需要了",
        "reasonType": "not_needed",
        "status": 0,
        "hasDownloaded": false,
        "downloadCount": 0,
        "createdAt": "2025-12-26T15:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 处理退款申请

```http
PUT /api/v1/admin/vip/refunds/:refundId
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "approve",
  "adminNote": "符合退款条件，审核通过"
}
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 操作类型：approve/reject |
| adminNote | string | 否 | 管理员备注 |

**响应**:

```json
{
  "code": 0,
  "message": "退款成功"
}
```

**错误响应**:

| code | message |
|------|---------|
| 400 | 无效的操作 |
| 400 | 该退款申请已处理 |
| 404 | 退款申请不存在 |
| 500 | 退款失败 |

#### 获取退款统计

```http
GET /api/v1/admin/vip/refunds/statistics
Authorization: Bearer {token}
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应**:

```json
{
  "code": 0,
  "data": {
    "totalRequests": 100,
    "pendingCount": 5,
    "approvedCount": 80,
    "rejectedCount": 10,
    "failedCount": 5,
    "totalRefundedAmount": 7920.00
  }
}
```

---

## 附录

### 退款到账时间

| 支付渠道 | 到账时间 | 说明 |
|----------|----------|------|
| 微信支付 | 1-3个工作日 | 原路返回至微信零钱或银行卡 |
| 支付宝 | 即时到账 | 原路返回至支付宝账户 |

### 退款限制

| 限制项 | 限制值 | 说明 |
|--------|--------|------|
| 退款期限 | 7天 | 购买后7天内可申请 |
| 下载限制 | 0次 | 未下载任何资源 |
| 套餐限制 | 非终身 | 终身会员不支持退款 |
| 支付方式 | 非积分 | 积分兑换不支持退款 |

### 相关文档

- [支付API文档](./API_PAYMENT.md)
- [对账异常处理流程](./RECONCILIATION_EXCEPTION_HANDLING.md)
- [环境变量配置指南](./ENV_CONFIGURATION_GUIDE.md)
- [证书部署指南](./CERTIFICATE_DEPLOYMENT_GUIDE.md)
- [沙箱测试指南](./SANDBOX_TESTING_GUIDE.md)

---

*文档版本: 1.0.0*
*最后更新: 2025-12-26*
*维护人员: Kiro AI*
