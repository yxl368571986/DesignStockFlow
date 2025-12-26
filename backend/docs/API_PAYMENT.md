# VIP会员支付系统 API 文档

## 概述

本文档描述了VIP会员支付系统的所有API接口，包括支付回调、VIP订单管理、积分兑换、二次验证等功能模块。

## 基础信息

- **Base URL**: `/api/v1`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "操作成功",
  "data": { ... }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "错误描述"
}
```

### 常见错误码

| 错误码 | 描述 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或Token过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 一、支付回调接口

### 1.1 微信支付异步回调

微信支付完成后，微信服务器会调用此接口通知支付结果。

**请求**

```
POST /api/v1/payment/wechat/notify
```

**请求头**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| Wechatpay-Timestamp | string | 是 | 时间戳 |
| Wechatpay-Nonce | string | 是 | 随机字符串 |
| Wechatpay-Signature | string | 是 | 签名 |

**请求体**

```json
{
  "id": "回调通知ID",
  "create_time": "2024-01-01T12:00:00+08:00",
  "resource_type": "encrypt-resource",
  "event_type": "TRANSACTION.SUCCESS",
  "resource": {
    "algorithm": "AEAD_AES_256_GCM",
    "ciphertext": "加密数据",
    "nonce": "随机串",
    "associated_data": "附加数据"
  }
}
```

**响应**

```json
{
  "code": "SUCCESS",
  "message": "成功"
}
```

**错误响应**

```json
{
  "code": "FAIL",
  "message": "签名验证失败"
}
```

---

### 1.2 支付宝异步回调

支付宝支付完成后，支付宝服务器会调用此接口通知支付结果。

**请求**

```
POST /api/v1/payment/alipay/notify
Content-Type: application/x-www-form-urlencoded
```

**请求参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| out_trade_no | string | 是 | 商户订单号 |
| trade_no | string | 是 | 支付宝交易号 |
| trade_status | string | 是 | 交易状态 |
| total_amount | string | 是 | 订单金额 |
| sign | string | 是 | 签名 |
| sign_type | string | 是 | 签名类型 (RSA2) |

**交易状态说明**

| 状态 | 描述 |
|------|------|
| WAIT_BUYER_PAY | 等待买家付款 |
| TRADE_CLOSED | 交易关闭 |
| TRADE_SUCCESS | 交易成功 |
| TRADE_FINISHED | 交易完成 |

**响应**

成功返回: `success`
失败返回: `fail`

---

### 1.3 支付宝同步回调

用户在支付宝完成支付后，会被重定向到此接口。

**请求**

```
GET /api/v1/payment/alipay/return
```

**请求参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| out_trade_no | string | 是 | 商户订单号 |
| trade_no | string | 否 | 支付宝交易号 |
| total_amount | string | 否 | 订单金额 |

**响应**

重定向到支付结果页面:
```
/vip/payment-result?orderNo={orderNo}&returnUrl={returnUrl}
```

---

## 二、VIP订单接口

### 2.1 创建VIP订单

创建VIP会员购买订单。

**请求**

```
POST /api/v1/vip/orders
Authorization: Bearer {token}
```

**请求参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| packageId | string | 是 | VIP套餐ID |
| paymentMethod | string | 是 | 支付方式 |
| sourceUrl | string | 否 | 来源页面URL |
| sourceResourceId | string | 否 | 来源资源ID |
| deviceFingerprint | string | 否 | 设备指纹 |

**支付方式枚举**

| 值 | 描述 |
|------|------|
| wechat_native | 微信扫码支付 (PC端) |
| wechat_h5 | 微信H5支付 (移动端) |
| alipay_pc | 支付宝电脑网站支付 |
| alipay_wap | 支付宝手机网站支付 |
| points | 积分兑换 |

**响应**

```json
{
  "code": 0,
  "data": {
    "orderId": "订单ID",
    "orderNo": "订单号",
    "amount": 99.00,
    "amountInCents": 9900,
    "expireAt": "2024-01-01T12:15:00Z",
    "requireSecondaryAuth": false,
    "packageName": "月度会员",
    "durationDays": 30
  }
}
```

**错误响应**

| code | message |
|------|---------|
| 400 | 缺少必要参数 |
| 400 | 不支持的支付方式 |
| 403 | 您有过多未支付订单，请先完成或取消现有订单 |
| 403 | 支付受限，请联系客服 |

---

### 2.2 发起支付

对已创建的订单发起支付，获取支付凭证。

**请求**

```
POST /api/v1/vip/orders/:orderNo/pay
Authorization: Bearer {token}
```

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| orderNo | string | 是 | 订单号 |

**请求参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| secondaryAuthCode | string | 条件必填 | 二次验证码 (金额≥200元时必填) |

**响应**

```json
{
  "code": 0,
  "data": {
    "paymentMethod": "wechat_native",
    "paymentData": "weixin://wxpay/bizpayurl?pr=xxx",
    "expireAt": "2024-01-01T12:15:00Z"
  }
}
```

**paymentData 说明**

| 支付方式 | paymentData 内容 |
|----------|------------------|
| wechat_native | 微信支付二维码URL |
| wechat_h5 | 微信H5支付跳转URL |
| alipay_pc | 支付宝支付表单HTML |
| alipay_wap | 支付宝H5支付跳转URL |

**错误响应**

| code | message |
|------|---------|
| 400 | 订单状态不正确 |
| 400 | 订单已过期，请重新下单 |
| 400 | 该订单需要二次验证 |
| 400 | 验证码错误或已过期 |

---

### 2.3 查询支付状态

查询订单的支付状态，用于前端轮询。

**请求**

```
GET /api/v1/vip/orders/:orderNo/status
Authorization: Bearer {token}
```

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| orderNo | string | 是 | 订单号 |

**响应**

```json
{
  "code": 0,
  "data": {
    "orderNo": "VIP20240101120000001",
    "status": 1,
    "paidAt": "2024-01-01T12:05:00Z",
    "vipExpireAt": "2024-02-01T12:05:00Z",
    "returnUrl": "/resource/123"
  }
}
```

**订单状态枚举**

| 值 | 描述 |
|----|------|
| 0 | 待支付 |
| 1 | 已支付 |
| 2 | 已退款 |
| 3 | 已取消 |
| 4 | 退款处理中 |

---

### 2.4 获取用户订单列表

获取当前用户的VIP订单列表。

**请求**

```
GET /api/v1/vip/orders
Authorization: Bearer {token}
```

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 10 | 每页数量 |
| status | number | 否 | - | 订单状态筛选 |

**响应**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "orderId": "订单ID",
        "orderNo": "VIP20240101120000001",
        "packageName": "月度会员",
        "amount": 99.00,
        "paymentMethod": "wechat_native",
        "paymentStatus": 1,
        "paidAt": "2024-01-01T12:05:00Z",
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 10
  }
}
```

---

### 2.5 获取订单详情

获取指定订单的详细信息。

**请求**

```
GET /api/v1/vip/orders/:orderNo
Authorization: Bearer {token}
```

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| orderNo | string | 是 | 订单号 |

**响应**

```json
{
  "code": 0,
  "data": {
    "orderId": "订单ID",
    "orderNo": "VIP20240101120000001",
    "productName": "月度会员",
    "amount": 99.00,
    "paymentMethod": "wechat_native",
    "paymentStatus": 1,
    "paidAt": "2024-01-01T12:05:00Z",
    "createdAt": "2024-01-01T12:00:00Z",
    "expireAt": "2024-01-01T12:15:00Z",
    "vipOrder": {
      "packageId": "套餐ID",
      "sourceUrl": "/resource/123",
      "sourceResourceId": "资源ID",
      "requireSecondaryAuth": false,
      "secondaryAuthVerified": false
    },
    "refundable": true,
    "refundableReason": null
  }
}
```

---

### 2.6 取消订单

取消待支付状态的订单。

**请求**

```
POST /api/v1/vip/orders/:orderNo/cancel
Authorization: Bearer {token}
```

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| orderNo | string | 是 | 订单号 |

**请求参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| reason | string | 否 | 取消原因 |

**响应**

```json
{
  "code": 0,
  "message": "订单已取消"
}
```

**错误响应**

| code | message |
|------|---------|
| 400 | 订单状态不允许取消 |
| 404 | 订单不存在 |

---

### 2.7 申请退款

对已支付的订单申请退款。

**请求**

```
POST /api/v1/vip/orders/:orderNo/refund
Authorization: Bearer {token}
```

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| orderNo | string | 是 | 订单号 |

**请求参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| reason | string | 是 | 退款原因 |
| reasonType | string | 否 | 原因类型 |

**原因类型枚举**

| 值 | 描述 |
|------|------|
| not_satisfied | 资源不符合预期 |
| not_needed | 不需要了 |
| other | 其他 |

**响应**

```json
{
  "code": 0,
  "message": "退款申请已提交，请等待审核",
  "data": {
    "refundId": "退款申请ID",
    "status": 0,
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

**退款条件**

- 月度/季度/年度VIP：购买后7天内且未下载任何资源
- 终身VIP：不支持退款

**错误响应**

| code | message |
|------|---------|
| 400 | 请填写退款原因 |
| 400 | 终身会员不支持退款 |
| 400 | 已超过退款期限 |
| 400 | 已下载资源，不支持退款 |

---

## 三、积分兑换接口

### 3.1 获取积分兑换信息

获取用户积分余额和兑换规则。

**请求**

```
GET /api/v1/vip/points-exchange/info
Authorization: Bearer {token}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "pointsBalance": 5000,
    "pointsPerMonth": 1000,
    "maxExchangeMonths": 3,
    "hasExchangedThisMonth": false,
    "lastExchangeDate": null,
    "maxAffordableMonths": 3
  }
}
```

**字段说明**

| 字段 | 描述 |
|------|------|
| pointsBalance | 当前积分余额 |
| pointsPerMonth | 每月VIP所需积分 |
| maxExchangeMonths | 单次最大兑换月数 |
| hasExchangedThisMonth | 本月是否已兑换 |
| lastExchangeDate | 上次兑换日期 |
| maxAffordableMonths | 当前积分可兑换的最大月数 |

---

### 3.2 积分兑换VIP

使用积分兑换VIP会员。

**请求**

```
POST /api/v1/vip/points-exchange
Authorization: Bearer {token}
```

**请求参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| months | number | 是 | 兑换月数 (1-3) |

**响应**

```json
{
  "code": 0,
  "message": "兑换成功",
  "data": {
    "pointsCost": 1000,
    "vipDaysGranted": 30,
    "newExpireAt": "2024-02-01T12:00:00Z"
  }
}
```

**兑换规则**

- 1000积分 = 1个月VIP
- 每月限兑换1次
- 单次最多兑换3个月

**错误响应**

| code | message |
|------|---------|
| 400 | 请选择兑换月数 |
| 400 | 积分不足 |
| 400 | 本月已兑换过VIP |
| 400 | 单次最多兑换3个月 |

---

### 3.3 获取兑换记录

获取用户的积分兑换VIP历史记录。

**请求**

```
GET /api/v1/vip/points-exchange/records
Authorization: Bearer {token}
```

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 10 | 每页数量 |

**响应**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "exchangeId": "兑换记录ID",
        "pointsCost": 1000,
        "vipDaysGranted": 30,
        "exchangeMonth": "2024-01",
        "status": 1,
        "packageName": "月度会员",
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 10
  }
}
```

**状态枚举**

| 值 | 描述 |
|----|------|
| 0 | 失败 |
| 1 | 成功 |

---

## 四、二次验证接口

### 4.1 发送二次验证码

发送支付二次验证短信验证码。

**请求**

```
POST /api/v1/vip/auth/send-code
Authorization: Bearer {token}
```

**响应**

```json
{
  "code": 0,
  "message": "验证码已发送"
}
```

**发送规则**

- 60秒冷却时间
- 验证码有效期5分钟
- 金额≥200元的订单需要二次验证

**错误响应**

| code | message |
|------|---------|
| 400 | 请60秒后再试 |
| 400 | 用户手机号未绑定 |

---

### 4.2 验证二次验证码

验证支付二次验证码。

**请求**

```
POST /api/v1/vip/auth/verify-code
Authorization: Bearer {token}
```

**请求参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| code | string | 是 | 6位验证码 |

**响应**

```json
{
  "code": 0,
  "message": "验证成功"
}
```

**错误响应**

| code | message |
|------|---------|
| 400 | 请输入验证码 |
| 400 | 验证码错误或已过期 |

---

## 五、设备管理接口

### 5.1 获取登录设备列表

获取当前用户的登录设备列表。

**请求**

```
GET /api/v1/user/devices
Authorization: Bearer {token}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "sessionId": "会话ID",
        "deviceType": "pc",
        "browser": "Chrome 120",
        "os": "Windows 10",
        "ip": "192.168.1.1",
        "lastActiveAt": "2024-01-01T12:00:00Z",
        "createdAt": "2024-01-01T10:00:00Z",
        "isCurrent": true
      }
    ],
    "maxDevices": 3
  }
}
```

**设备类型枚举**

| 值 | 描述 |
|------|------|
| pc | 电脑 |
| mobile | 手机 |
| tablet | 平板 |

---

### 5.2 踢出设备

踢出指定的登录设备。

**请求**

```
DELETE /api/v1/user/devices/:sessionId
Authorization: Bearer {token}
```

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| sessionId | string | 是 | 设备会话ID |

**响应**

```json
{
  "code": 0,
  "message": "设备已踢出"
}
```

**错误响应**

| code | message |
|------|---------|
| 400 | 不能踢出当前设备 |
| 404 | 设备不存在 |

---

## 六、管理后台接口

### 6.1 获取VIP订单列表（管理员）

获取所有VIP订单列表，支持分页和筛选。

**请求**

```http
GET /api/v1/vip/admin/orders
Authorization: Bearer {token}
```

**权限要求**: `vip:view`

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| pageNum | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 10 | 每页数量 |
| paymentStatus | number | 否 | - | 支付状态筛选 |
| paymentMethod | string | 否 | - | 支付方式筛选 |
| startDate | string | 否 | - | 开始日期 (YYYY-MM-DD) |
| endDate | string | 否 | - | 结束日期 (YYYY-MM-DD) |

**响应**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "orderId": "订单ID",
        "orderNo": "VIP20240101120000001",
        "userId": "用户ID",
        "userName": "用户昵称",
        "packageId": "套餐ID",
        "packageName": "月度会员",
        "amount": 99.00,
        "paymentMethod": "wechat_native",
        "paymentStatus": 1,
        "transactionId": "第三方交易号",
        "paidAt": "2024-01-01T12:05:00Z",
        "createdAt": "2024-01-01T12:00:00Z",
        "updatedAt": "2024-01-01T12:05:00Z"
      }
    ],
    "total": 100,
    "pageNum": 1,
    "pageSize": 10
  }
}
```

**支付状态枚举**

| 值 | 描述 |
|----|------|
| 0 | 待支付 |
| 1 | 已支付 |
| 2 | 已退款 |
| 3 | 已取消 |
| 4 | 退款处理中 |

---

### 6.2 获取VIP订单详情（管理员）

获取指定VIP订单的详细信息。

**请求**

```http
GET /api/v1/vip/admin/orders/:orderId
Authorization: Bearer {token}
```

**权限要求**: `vip:view`

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| orderId | string | 是 | 订单ID |

**响应**

```json
{
  "code": 0,
  "data": {
    "orderId": "订单ID",
    "orderNo": "VIP20240101120000001",
    "userId": "用户ID",
    "userName": "用户昵称",
    "packageName": "月度会员",
    "amount": 99.00,
    "paymentMethod": "wechat_native",
    "paymentStatus": 1,
    "transactionId": "第三方交易号",
    "paidAt": "2024-01-01T12:05:00Z",
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:05:00Z"
  }
}
```

**错误响应**

| code | message |
|------|---------|
| 404 | 订单不存在 |

---

### 6.3 VIP订单退款（管理员）

管理员直接对VIP订单进行退款操作。

**请求**

```http
POST /api/v1/vip/admin/orders/:orderId/refund
Authorization: Bearer {token}
```

**权限要求**: `vip:refund`

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| orderId | string | 是 | 订单ID |

**请求参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| reason | string | 是 | 退款原因 |

**响应**

```json
{
  "code": 0,
  "message": "退款成功"
}
```

**错误响应**

| code | message |
|------|---------|
| 400 | 请提供退款原因 |
| 400 | 订单状态不允许退款 |
| 404 | 订单不存在 |
| 500 | 退款失败 |

---

### 6.4 获取退款申请列表

获取所有退款申请列表（管理员）。

**请求**

```
GET /api/v1/admin/vip/refunds
Authorization: Bearer {token}
```

**权限要求**: `vip:refund`

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页数量 |
| status | number | 否 | - | 状态筛选 |
| startDate | string | 否 | - | 开始日期 |
| endDate | string | 否 | - | 结束日期 |

**退款状态枚举**

| 值 | 描述 |
|----|------|
| 0 | 待审核 |
| 1 | 已通过 |
| 2 | 已拒绝 |
| 3 | 退款中 |
| 4 | 已退款 |
| 5 | 退款失败 |

**响应**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "refundId": "退款申请ID",
        "orderNo": "VIP20240101120000001",
        "userId": "用户ID",
        "username": "用户名",
        "email": "user@example.com",
        "amount": 99.00,
        "productName": "月度会员",
        "reason": "不需要了",
        "reasonType": "not_needed",
        "status": 0,
        "adminNote": null,
        "processedAt": null,
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 6.5 处理退款申请

审批或拒绝退款申请（管理员）。

**请求**

```
PUT /api/v1/admin/vip/refunds/:refundId
Authorization: Bearer {token}
```

**权限要求**: `vip:refund`

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| refundId | string | 是 | 退款申请ID |

**请求参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| action | string | 是 | 操作类型 (approve/reject) |
| adminNote | string | 否 | 管理员备注 |

**响应**

```json
{
  "code": 0,
  "message": "退款成功"
}
```

**错误响应**

| code | message |
|------|---------|
| 400 | 无效的操作 |
| 400 | 该退款申请已处理 |
| 404 | 退款申请不存在 |
| 500 | 退款失败 |

---

### 6.6 获取安全日志列表

获取支付安全相关的日志记录（管理员）。

**请求**

```
GET /api/v1/admin/security/logs
Authorization: Bearer {token}
```

**权限要求**: `security:view`

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页数量 |
| eventType | string | 否 | - | 事件类型筛选 |
| riskLevel | string | 否 | - | 风险等级筛选 |
| userId | string | 否 | - | 用户ID筛选 |
| startDate | string | 否 | - | 开始日期 |
| endDate | string | 否 | - | 结束日期 |

**事件类型枚举**

| 值 | 描述 |
|------|------|
| payment_attempt | 支付尝试 |
| suspicious_activity | 可疑活动 |
| account_locked | 账号锁定 |
| account_unlocked | 账号解锁 |
| secondary_auth | 二次验证 |

**风险等级枚举**

| 值 | 描述 |
|------|------|
| low | 低风险 |
| medium | 中风险 |
| high | 高风险 |

**响应**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "logId": "日志ID",
        "userId": "用户ID",
        "username": "用户名",
        "eventType": "payment_attempt",
        "riskLevel": "low",
        "ip": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "details": { ... },
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 6.7 解除用户支付限制

解除被限制支付的用户（管理员）。

**请求**

```
POST /api/v1/admin/users/:userId/unlock-payment
Authorization: Bearer {token}
```

**权限要求**: `security:manage`

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| userId | string | 是 | 用户ID |

**请求参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| reason | string | 否 | 解除原因 |

**响应**

```json
{
  "code": 0,
  "message": "已解除支付限制"
}
```

---

### 6.8 获取VIP订单统计

获取VIP订单的统计数据（管理员）。

**请求**

```
GET /api/v1/admin/vip/order-statistics
Authorization: Bearer {token}
```

**权限要求**: `vip:view`

**查询参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应**

```json
{
  "code": 0,
  "data": {
    "totalOrders": 1000,
    "paidOrders": 800,
    "refundedOrders": 50,
    "totalRevenue": 79200.00,
    "refundAmount": 4950.00,
    "netRevenue": 74250.00,
    "channelDistribution": [
      {
        "channel": "wechat_native",
        "count": 500,
        "amount": 49500.00
      },
      {
        "channel": "alipay_pc",
        "count": 300,
        "amount": 29700.00
      }
    ]
  }
}
```

---

## 七、VIP信息接口

### 7.1 获取VIP套餐列表

获取所有可用的VIP套餐。

**请求**

```
GET /api/v1/vip/packages
```

**响应**

```json
{
  "code": 0,
  "data": [
    {
      "packageId": "套餐ID",
      "packageName": "月度会员",
      "originalPrice": 129.00,
      "price": 99.00,
      "durationDays": 30,
      "description": "月度VIP会员",
      "privileges": ["每日50次下载", "专属客服"],
      "isLifetime": false,
      "sortOrder": 1,
      "status": 1
    }
  ]
}
```

---

### 7.2 获取VIP特权列表

获取VIP会员的特权说明。

**请求**

```
GET /api/v1/vip/privileges
```

**响应**

```json
{
  "code": 0,
  "data": [
    {
      "privilegeId": "特权ID",
      "privilegeName": "每日下载次数",
      "description": "VIP用户每日可下载50次",
      "icon": "download",
      "sortOrder": 1
    }
  ]
}
```

---

### 7.3 获取用户VIP信息

获取当前登录用户的VIP状态信息。

**请求**

```
GET /api/v1/vip/my-info
Authorization: Bearer {token}
```

**响应**

```json
{
  "code": 0,
  "data": {
    "userId": "用户ID",
    "vipLevel": 1,
    "isVip": true,
    "isLifetime": false,
    "expireAt": "2024-02-01T12:00:00Z",
    "daysRemaining": 30,
    "iconStatus": "active",
    "privileges": [
      {
        "name": "每日下载次数",
        "value": "50次"
      }
    ],
    "downloadStats": {
      "todayUsed": 5,
      "todayLimit": 50,
      "remaining": 45
    }
  }
}
```

**iconStatus 枚举**

| 值 | 描述 |
|------|------|
| none | 无图标 (非VIP) |
| active | 金色图标 (有效VIP) |
| active_lifetime | 金色图标+终身标签 |
| grace_period | 灰色图标 (7天宽限期) |

---

## 八、支付流程说明

### 8.1 微信支付流程 (PC端)

```
1. 用户选择套餐 → 调用 POST /api/v1/vip/orders 创建订单
2. 获取订单号 → 调用 POST /api/v1/vip/orders/:orderNo/pay 发起支付
3. 获取二维码URL → 前端展示二维码
4. 用户扫码支付 → 前端轮询 GET /api/v1/vip/orders/:orderNo/status
5. 微信回调 → POST /api/v1/payment/wechat/notify
6. 支付成功 → 前端跳转成功页面
```

### 8.2 支付宝支付流程 (PC端)

```
1. 用户选择套餐 → 调用 POST /api/v1/vip/orders 创建订单
2. 获取订单号 → 调用 POST /api/v1/vip/orders/:orderNo/pay 发起支付
3. 获取表单HTML → 前端提交表单跳转支付宝
4. 用户完成支付 → 支付宝同步回调 GET /api/v1/payment/alipay/return
5. 支付宝异步回调 → POST /api/v1/payment/alipay/notify
6. 重定向到结果页 → 前端展示支付结果
```

### 8.3 积分兑换流程

```
1. 用户选择积分兑换 → 调用 GET /api/v1/vip/points-exchange/info 获取信息
2. 选择兑换月数 → 调用 POST /api/v1/vip/points-exchange 执行兑换
3. 兑换成功 → 前端展示成功页面
```

---

## 九、安全机制

### 9.1 签名验证

- 微信支付: API V3签名 (HMAC-SHA256)
- 支付宝: RSA2签名

### 9.2 二次验证

- 触发条件: 支付金额 ≥ 200元
- 验证方式: 手机短信验证码
- 有效期: 5分钟
- 冷却时间: 60秒

### 9.3 支付限制

- 同一账号1小时内未支付订单 > 5个: 暂时限制支付
- 同一IP 1小时内切换 > 3个账号支付: 标记为可疑

### 9.4 设备限制

- VIP账号最多同时登录3台设备
- 超出限制时踢出最早登录的设备

### 9.5 回调幂等性

- 每次回调记录唯一标识
- 重复回调直接返回成功，不重复处理

---

## 十、错误码汇总

| 错误码 | 描述 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或Token过期 |
| 403 | 权限不足或支付受限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## OpenAPI/Swagger 规范

本API文档同时提供OpenAPI 3.0规范文件，可用于自动生成客户端SDK、API测试和交互式文档。

**OpenAPI规范文件位置**: `backend/docs/openapi/vip-payment.yaml`

### 使用方式

1. **Swagger UI**: 将YAML文件导入 [Swagger Editor](https://editor.swagger.io/) 查看交互式文档
2. **Postman**: 直接导入YAML文件生成API集合
3. **代码生成**: 使用 [OpenAPI Generator](https://openapi-generator.tech/) 生成客户端SDK

```bash
# 使用OpenAPI Generator生成TypeScript客户端
npx @openapitools/openapi-generator-cli generate \
  -i backend/docs/openapi/vip-payment.yaml \
  -g typescript-axios \
  -o src/api/generated
```

---

## 更新日志

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.2.0 | 2024-12-26 | 添加OpenAPI 3.0规范文件 (vip-payment.yaml) |
| 1.1.0 | 2024-12-26 | 添加管理员VIP订单管理API文档（获取订单列表、订单详情、订单退款） |
| 1.0.0 | 2024-12-26 | 初始版本，包含完整支付API文档 |
