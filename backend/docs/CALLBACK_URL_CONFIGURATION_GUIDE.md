# 支付回调URL配置指南

本文档详细说明VIP会员支付系统中微信支付和支付宝支付回调URL的配置方法、安全要求和常见问题解决方案。

## 目录

1. [概述](#概述)
2. [回调URL基础知识](#回调url基础知识)
3. [微信支付回调配置](#微信支付回调配置)
4. [支付宝回调配置](#支付宝回调配置)
5. [本地开发环境配置](#本地开发环境配置)
6. [生产环境配置](#生产环境配置)
7. [回调安全配置](#回调安全配置)
8. [回调处理流程](#回调处理流程)
9. [故障排查](#故障排查)
10. [常见问题](#常见问题)

---

## 概述

支付回调URL是支付平台在用户完成支付后，主动通知商户服务器支付结果的地址。正确配置回调URL是支付系统正常运行的关键。

### 回调类型说明

| 回调类型 | 说明 | 触发时机 |
|---------|------|---------|
| 异步回调（Notify） | 支付平台服务器主动推送 | 支付成功/失败后 |
| 同步回调（Return） | 用户浏览器跳转 | 支付完成后（仅支付宝） |
| 退款回调 | 退款结果通知 | 退款处理完成后 |

### 本系统回调端点

| 端点 | 方法 | 说明 |
|-----|------|------|
| `/api/v1/payment/wechat/notify` | POST | 微信支付异步回调 |
| `/api/v1/payment/alipay/notify` | POST | 支付宝异步回调 |
| `/api/v1/payment/alipay/return` | GET | 支付宝同步回调 |

---

## 回调URL基础知识

### 2.1 URL格式要求

回调URL必须满足以下要求：

1. **协议要求**：必须使用HTTPS协议（生产环境）
2. **域名要求**：必须是已备案的域名（国内服务器）
3. **端口要求**：建议使用443端口（HTTPS默认端口）
4. **路径要求**：路径必须可访问，不能返回404

### 2.2 URL组成结构

```
https://api.yourdomain.com/api/v1/payment/wechat/notify
  │      │                  │
  │      │                  └── 回调路径
  │      └── 域名
  └── 协议（必须HTTPS）
```


### 2.3 环境变量配置

```env
# 微信支付回调URL
WECHAT_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/wechat/notify

# 支付宝异步回调URL
ALIPAY_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/alipay/notify

# 支付宝同步返回URL（前端页面）
ALIPAY_RETURN_URL=https://www.yourdomain.com/payment/success
```

---

## 微信支付回调配置

### 3.1 回调URL格式

```
https://api.yourdomain.com/api/v1/payment/wechat/notify
```

### 3.2 环境变量配置

```env
# 生产环境
WECHAT_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/wechat/notify

# 开发环境（使用内网穿透）
WECHAT_NOTIFY_URL=https://your-subdomain.ngrok.io/api/v1/payment/wechat/notify
```

### 3.3 微信支付商户平台配置

微信支付的回调URL在创建订单时动态指定，无需在商户平台预先配置。但需要确保：

1. **域名白名单**：在商户平台配置支付授权目录
2. **IP白名单**：如有需要，配置服务器IP白名单

#### 配置步骤

1. 登录 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 进入「产品中心」→「开发配置」
3. 配置「支付授权目录」（H5支付需要）
4. 配置「Native支付回调链接」（可选，用于扫码支付）


### 3.4 回调数据格式

微信支付V3版本使用JSON格式回调：

```json
{
  "id": "EV-2018022511223320873",
  "create_time": "2018-06-08T10:34:56+08:00",
  "resource_type": "encrypt-resource",
  "event_type": "TRANSACTION.SUCCESS",
  "summary": "支付成功",
  "resource": {
    "original_type": "transaction",
    "algorithm": "AEAD_AES_256_GCM",
    "ciphertext": "...",
    "associated_data": "...",
    "nonce": "..."
  }
}
```

### 3.5 回调响应要求

微信支付要求商户在收到回调后返回以下响应：

**成功响应**：
```json
{
  "code": "SUCCESS",
  "message": "成功"
}
```

**失败响应**：
```json
{
  "code": "FAIL",
  "message": "失败原因"
}
```

**HTTP状态码**：
- 成功：200
- 失败：4xx 或 5xx

---

## 支付宝回调配置

### 4.1 异步回调URL（notify_url）

异步回调是支付宝服务器主动推送支付结果到商户服务器。

```env
ALIPAY_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/alipay/notify
```


### 4.2 同步返回URL（return_url）

同步返回是用户支付完成后浏览器跳转的前端页面。

```env
ALIPAY_RETURN_URL=https://www.yourdomain.com/payment/success
```

**注意**：
- 同步返回URL是前端页面地址，不是后端API
- 同步返回仅用于用户体验，不能作为支付成功的依据
- 支付结果以异步回调为准

### 4.3 支付宝开放平台配置

支付宝的回调URL可以在创建订单时动态指定，也可以在开放平台预先配置。

#### 配置步骤

1. 登录 [支付宝开放平台](https://open.alipay.com/)
2. 进入应用详情 →「开发设置」
3. 配置「授权回调地址」（如需要）
4. 配置「应用网关」（用于接收支付宝推送消息）

### 4.4 回调数据格式

支付宝使用表单格式（application/x-www-form-urlencoded）回调：

```
gmt_create=2024-01-01+12:00:00
&charset=utf-8
&seller_email=seller@example.com
&subject=VIP会员-月度套餐
&sign=xxx
&buyer_id=2088xxx
&invoice_amount=29.90
&notify_id=xxx
&fund_bill_list=[{"amount":"29.90","fundChannel":"ALIPAYACCOUNT"}]
&notify_type=trade_status_sync
&trade_status=TRADE_SUCCESS
&receipt_amount=29.90
&buyer_pay_amount=29.90
&app_id=2021xxx
&sign_type=RSA2
&seller_id=2088xxx
&gmt_payment=2024-01-01+12:00:05
&notify_time=2024-01-01+12:00:06
&out_trade_no=VIP20240101120000001
&total_amount=29.90
&trade_no=2024010122001xxx
&auth_app_id=2021xxx
&buyer_logon_id=138****1234
&point_amount=0.00
```


### 4.5 回调响应要求

支付宝要求商户在收到回调后返回纯文本响应：

**成功响应**：
```
success
```

**失败响应**：
```
fail
```

**注意**：
- 响应内容必须是纯文本，不能是JSON
- 响应内容区分大小写，必须是小写的 `success` 或 `fail`
- 如果返回 `fail` 或其他内容，支付宝会重试推送

---

## 本地开发环境配置

本地开发时，由于支付平台无法直接访问本地服务器，需要使用内网穿透工具。

### 5.1 使用ngrok

[ngrok](https://ngrok.com/) 是最常用的内网穿透工具。

#### 安装ngrok

```bash
# macOS (使用Homebrew)
brew install ngrok

# Windows (使用Chocolatey)
choco install ngrok

# 或直接下载
# https://ngrok.com/download
```

#### 启动ngrok

```bash
# 将本地8080端口暴露到公网
ngrok http 8080

# 输出示例：
# Forwarding  https://abc123.ngrok.io -> http://localhost:8080
```

#### 配置回调URL

```env
# 使用ngrok生成的HTTPS地址
WECHAT_NOTIFY_URL=https://abc123.ngrok.io/api/v1/payment/wechat/notify
ALIPAY_NOTIFY_URL=https://abc123.ngrok.io/api/v1/payment/alipay/notify
ALIPAY_RETURN_URL=https://abc123.ngrok.io/payment/success
```


### 5.2 使用frp

[frp](https://github.com/fatedier/frp) 是另一个流行的内网穿透工具，支持自建服务器。

#### 客户端配置（frpc.ini）

```ini
[common]
server_addr = your-frp-server.com
server_port = 7000

[web]
type = https
local_port = 8080
custom_domains = payment.yourdomain.com
```

#### 启动frp客户端

```bash
./frpc -c frpc.ini
```

### 5.3 使用localtunnel

[localtunnel](https://github.com/localtunnel/localtunnel) 是一个免费的内网穿透工具。

```bash
# 安装
npm install -g localtunnel

# 启动
lt --port 8080 --subdomain your-subdomain

# 输出示例：
# your url is: https://your-subdomain.loca.lt
```

### 5.4 本地开发注意事项

1. **URL变化**：ngrok免费版每次重启URL会变化，需要重新配置
2. **HTTPS证书**：内网穿透工具通常提供有效的HTTPS证书
3. **请求限制**：免费版可能有请求频率限制
4. **调试日志**：建议开启详细日志记录回调请求

---

## 生产环境配置

### 6.1 域名和SSL证书

生产环境必须使用已备案的域名和有效的SSL证书。

#### 域名要求

- 必须是已备案的域名（国内服务器）
- 建议使用独立的API子域名，如 `api.yourdomain.com`
- 域名解析必须正确指向服务器IP


#### SSL证书要求

- 必须是有效的SSL证书（不能是自签名证书）
- 证书必须未过期
- 证书链必须完整
- 推荐使用 Let's Encrypt 免费证书

### 6.2 Nginx配置示例

```nginx
# /etc/nginx/sites-available/api.yourdomain.com

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # 支付回调路由
    location /api/v1/payment/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 支付回调超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # 其他API路由
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```


### 6.3 防火墙配置

确保服务器防火墙允许支付平台的回调请求。

#### 微信支付IP白名单

微信支付回调来自以下IP段（可能会更新，请以官方文档为准）：

```
101.226.103.0/24
101.226.125.0/24
140.207.54.0/24
140.207.55.0/24
```

#### 支付宝IP白名单

支付宝回调来自以下IP段（可能会更新，请以官方文档为准）：

```
110.75.0.0/16
203.209.0.0/16
```

#### 防火墙规则示例（iptables）

```bash
# 允许微信支付回调
iptables -A INPUT -p tcp --dport 443 -s 101.226.103.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -s 101.226.125.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -s 140.207.54.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -s 140.207.55.0/24 -j ACCEPT

# 允许支付宝回调
iptables -A INPUT -p tcp --dport 443 -s 110.75.0.0/16 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -s 203.209.0.0/16 -j ACCEPT
```

**注意**：建议不要限制回调IP，因为支付平台的IP可能会变化。

### 6.4 环境变量配置

```env
# 生产环境回调URL配置
WECHAT_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/wechat/notify
ALIPAY_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/alipay/notify
ALIPAY_RETURN_URL=https://www.yourdomain.com/payment/success
```

---

## 回调安全配置

### 7.1 签名验证

所有回调请求必须验证签名，防止伪造回调。


#### 微信支付签名验证

微信支付V3使用HTTP头部签名：

```typescript
// 验证微信支付回调签名
function verifyWechatSignature(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string,
  platformCert: string
): boolean {
  const message = `${timestamp}\n${nonce}\n${body}\n`;
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(message);
  return verify.verify(platformCert, signature, 'base64');
}
```

#### 支付宝签名验证

支付宝使用RSA2签名：

```typescript
// 验证支付宝回调签名
function verifyAlipaySignature(
  params: Record<string, string>,
  sign: string,
  alipayPublicKey: string
): boolean {
  // 1. 移除sign和sign_type参数
  const { sign: _, sign_type: __, ...rest } = params;
  
  // 2. 按字母顺序排序并拼接
  const sortedKeys = Object.keys(rest).sort();
  const signContent = sortedKeys
    .map(key => `${key}=${rest[key]}`)
    .join('&');
  
  // 3. 验证签名
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(signContent);
  return verify.verify(alipayPublicKey, sign, 'base64');
}
```

### 7.2 幂等性处理

支付平台可能会重复发送回调，必须保证幂等处理。

```typescript
// 幂等性处理示例
async function handlePaymentCallback(orderNo: string, transactionId: string) {
  // 1. 检查是否已处理
  const existingCallback = await prisma.paymentCallback.findFirst({
    where: { orderNo, transactionId, processed: true }
  });
  
  if (existingCallback) {
    // 已处理，直接返回成功
    return { success: true, message: '已处理' };
  }
  
  // 2. 使用事务处理
  await prisma.$transaction(async (tx) => {
    // 记录回调
    await tx.paymentCallback.create({
      data: { orderNo, transactionId, processed: true }
    });
    
    // 更新订单状态
    await tx.order.update({
      where: { orderNo },
      data: { status: 'PAID' }
    });
    
    // 开通VIP
    await activateVip(orderNo);
  });
  
  return { success: true };
}
```


### 7.3 日志记录

记录所有回调请求，便于问题排查。

```typescript
// 回调日志记录
async function logCallback(
  channel: string,
  orderNo: string,
  data: any,
  result: string
) {
  await prisma.paymentCallback.create({
    data: {
      channel,
      orderNo,
      callbackData: data,
      processResult: result,
      createdAt: new Date()
    }
  });
  
  // 同时记录到日志文件
  logger.info('Payment callback received', {
    channel,
    orderNo,
    result,
    timestamp: new Date().toISOString()
  });
}
```

### 7.4 敏感信息脱敏

日志中不要记录敏感信息：

```typescript
// 脱敏处理
function sanitizeCallbackData(data: any): any {
  const sensitiveFields = ['sign', 'buyer_logon_id', 'buyer_email'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  }
  
  return sanitized;
}
```

---

## 回调处理流程

### 8.1 微信支付回调处理流程

```
微信支付服务器
      │
      │ POST /api/v1/payment/wechat/notify
      ▼
┌─────────────────────────────────────┐
│  1. 接收回调请求                      │
│     - 获取HTTP头部签名信息            │
│     - 获取请求体（加密数据）           │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  2. 验证签名                         │
│     - 使用平台证书验证签名            │
│     - 签名无效则返回失败              │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  3. 解密数据                         │
│     - 使用APIv3密钥解密              │
│     - 获取订单信息                   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  4. 幂等性检查                       │
│     - 检查订单是否已处理              │
│     - 已处理则直接返回成功            │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  5. 业务处理                         │
│     - 更新订单状态                   │
│     - 开通VIP                       │
│     - 发送通知                       │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  6. 返回响应                         │
│     - 成功：{"code":"SUCCESS"}       │
│     - 失败：{"code":"FAIL"}          │
└─────────────────────────────────────┘
```


### 8.2 支付宝回调处理流程

```
支付宝服务器
      │
      │ POST /api/v1/payment/alipay/notify
      ▼
┌─────────────────────────────────────┐
│  1. 接收回调请求                      │
│     - 解析表单数据                    │
│     - 获取签名和业务参数              │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  2. 验证签名                         │
│     - 使用支付宝公钥验证RSA2签名      │
│     - 签名无效则返回fail             │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  3. 验证业务参数                     │
│     - 验证app_id是否匹配             │
│     - 验证seller_id是否匹配          │
│     - 验证订单金额是否匹配            │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  4. 检查交易状态                     │
│     - TRADE_SUCCESS：支付成功        │
│     - TRADE_FINISHED：交易完成       │
│     - 其他状态不处理                 │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  5. 幂等性检查                       │
│     - 检查订单是否已处理              │
│     - 已处理则直接返回success        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  6. 业务处理                         │
│     - 更新订单状态                   │
│     - 开通VIP                       │
│     - 发送通知                       │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  7. 返回响应                         │
│     - 成功：success                  │
│     - 失败：fail                     │
└─────────────────────────────────────┘
```

### 8.3 回调重试机制

支付平台在收到失败响应或超时时会重试推送。

#### 微信支付重试策略

- 重试间隔：15s/15s/30s/3m/10m/20m/30m/30m/30m/60m/3h/3h/3h/6h/6h
- 最大重试次数：15次
- 总时长：约24小时

#### 支付宝重试策略

- 重试间隔：4m/10m/10m/1h/2h/6h/15h
- 最大重试次数：8次
- 总时长：约24小时

---

## 故障排查

### 9.1 回调未收到

**可能原因**：

1. 回调URL配置错误
2. 服务器防火墙阻止
3. SSL证书问题
4. 域名解析问题
5. 服务器未启动


**排查步骤**：

```bash
# 1. 检查域名解析
nslookup api.yourdomain.com

# 2. 检查端口是否开放
telnet api.yourdomain.com 443

# 3. 检查SSL证书
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com

# 4. 测试回调URL是否可访问
curl -X POST https://api.yourdomain.com/api/v1/payment/wechat/notify \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 5. 检查服务器日志
tail -f /var/log/nginx/access.log
tail -f backend/logs/combined.log
```

### 9.2 签名验证失败

**可能原因**：

1. 使用了错误的证书/密钥
2. 沙箱环境和生产环境混用
3. 证书已过期
4. 签名算法不匹配

**排查步骤**：

```bash
# 1. 检查环境配置
echo $PAYMENT_ENV

# 2. 检查证书有效期
openssl x509 -in ./certs/wechat/apiclient_cert.pem -noout -dates

# 3. 检查证书序列号是否匹配
openssl x509 -in ./certs/wechat/apiclient_cert.pem -noout -serial
```

### 9.3 回调处理超时

**可能原因**：

1. 业务处理时间过长
2. 数据库连接问题
3. 外部服务调用超时

**解决方案**：

```typescript
// 异步处理业务逻辑
async function handleCallback(data: any) {
  // 1. 快速验证签名
  if (!verifySignature(data)) {
    return { code: 'FAIL', message: '签名验证失败' };
  }
  
  // 2. 记录回调（快速操作）
  await recordCallback(data);
  
  // 3. 异步处理业务逻辑
  setImmediate(async () => {
    try {
      await processPayment(data);
    } catch (error) {
      logger.error('Payment processing failed', error);
    }
  });
  
  // 4. 立即返回成功
  return { code: 'SUCCESS', message: '成功' };
}
```

### 9.4 订单状态不一致

**可能原因**：

1. 回调丢失
2. 回调处理失败
3. 并发处理问题

**解决方案**：

使用对账机制定期同步订单状态：

```typescript
// 对账任务
async function reconcileOrders() {
  // 查询待支付超过5分钟的订单
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) }
    }
  });
  
  for (const order of pendingOrders) {
    // 查询支付平台实际状态
    const actualStatus = await queryPaymentStatus(order);
    
    if (actualStatus === 'PAID') {
      // 同步状态
      await updateOrderStatus(order.orderNo, 'PAID');
    }
  }
}
```

---

## 常见问题

### Q1: 回调URL必须使用HTTPS吗？

**A**: 是的，生产环境必须使用HTTPS。开发环境可以使用内网穿透工具提供的HTTPS地址。


### Q2: 回调URL可以带参数吗？

**A**: 可以，但不推荐。建议通过订单号关联业务数据，而不是通过URL参数传递。

```env
# 不推荐
WECHAT_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/wechat/notify?source=vip

# 推荐
WECHAT_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/wechat/notify
```

### Q3: 如何测试回调是否正常？

**A**: 可以使用以下方法测试：

1. **沙箱环境测试**：使用支付平台的沙箱环境进行完整支付流程测试
2. **模拟回调**：使用curl或Postman模拟回调请求
3. **日志检查**：查看服务器日志确认回调是否收到

```bash
# 模拟微信支付回调
curl -X POST https://api.yourdomain.com/api/v1/payment/wechat/notify \
  -H "Content-Type: application/json" \
  -H "Wechatpay-Timestamp: 1234567890" \
  -H "Wechatpay-Nonce: test-nonce" \
  -H "Wechatpay-Signature: test-signature" \
  -H "Wechatpay-Serial: test-serial" \
  -d '{"test": true}'
```

### Q4: 回调URL变更后需要做什么？

**A**: 回调URL变更后需要：

1. 更新环境变量配置
2. 重启后端服务
3. 测试新的回调URL是否可访问
4. 进行小额支付测试验证

### Q5: 同一个回调URL可以处理多种支付方式吗？

**A**: 不推荐。建议为不同支付渠道使用不同的回调URL，便于区分和处理：

```env
# 推荐：分开配置
WECHAT_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/wechat/notify
ALIPAY_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/alipay/notify
```

### Q6: 回调处理失败后如何补救？

**A**: 

1. **等待重试**：支付平台会自动重试推送
2. **主动查询**：使用对账机制主动查询订单状态
3. **人工处理**：查看日志，手动处理异常订单

### Q7: 如何处理回调中的敏感信息？

**A**: 

1. 日志中脱敏处理敏感字段
2. 数据库中加密存储敏感信息
3. 不要在错误响应中返回敏感信息

### Q8: 回调超时时间是多少？

**A**: 

- 微信支付：5秒
- 支付宝：15秒

建议在超时时间内完成签名验证和基本处理，复杂业务逻辑异步处理。

### Q9: 本地开发时ngrok地址变化怎么办？

**A**: 

1. 使用ngrok付费版获取固定子域名
2. 使用自建的frp服务
3. 每次启动后更新环境变量并重启服务


### Q10: 如何验证回调URL配置是否正确？

**A**: 使用以下脚本验证：

```bash
# 进入后端目录
cd backend

# 运行验证脚本
npx ts-node -e "
const config = require('./src/config/payment').loadPaymentConfig();

console.log('=== 回调URL配置检查 ===');
console.log('环境:', config.env);
console.log('');
console.log('微信支付回调URL:', config.wechat?.notifyUrl || '未配置');
console.log('支付宝异步回调URL:', config.alipay?.notifyUrl || '未配置');
console.log('支付宝同步返回URL:', config.alipay?.returnUrl || '未配置');

// 验证URL格式
const urls = [
  config.wechat?.notifyUrl,
  config.alipay?.notifyUrl,
  config.alipay?.returnUrl
].filter(Boolean);

console.log('');
console.log('=== URL格式验证 ===');
urls.forEach(url => {
  const isHttps = url.startsWith('https://');
  console.log(\`\${url}: \${isHttps ? '✓ HTTPS' : '✗ 非HTTPS'}\`);
});
"
```

---

## 配置检查清单

部署前请确认以下配置：

**基础配置**

- [ ] 域名已备案（国内服务器）
- [ ] SSL证书已配置且有效
- [ ] 服务器防火墙已开放443端口
- [ ] Nginx/反向代理已正确配置

**微信支付**

- [ ] `WECHAT_NOTIFY_URL` 已配置
- [ ] 回调URL使用HTTPS协议
- [ ] 回调URL可从公网访问
- [ ] 签名验证逻辑已实现

**支付宝**

- [ ] `ALIPAY_NOTIFY_URL` 已配置
- [ ] `ALIPAY_RETURN_URL` 已配置
- [ ] 回调URL使用HTTPS协议
- [ ] 回调URL可从公网访问
- [ ] 签名验证逻辑已实现

**安全配置**

- [ ] 回调签名验证已启用
- [ ] 幂等性处理已实现
- [ ] 回调日志记录已启用
- [ ] 敏感信息已脱敏

**测试验证**

- [ ] 沙箱环境测试通过
- [ ] 生产环境小额测试通过
- [ ] 回调日志正常记录
- [ ] 订单状态正确更新

---

## 相关文档

- [环境变量配置指南](./ENV_CONFIGURATION_GUIDE.md)
- [证书部署指南](./CERTIFICATE_DEPLOYMENT_GUIDE.md)
- [商户申请指南](./MERCHANT_APPLICATION_GUIDE.md)
- [沙箱测试指南](./SANDBOX_TESTING_GUIDE.md)
- [支付API文档](./API_PAYMENT.md)
- [定时任务配置指南](./SCHEDULED_TASKS_GUIDE.md)

---

*文档版本: 1.0.0*
*最后更新: 2025-12-26*
