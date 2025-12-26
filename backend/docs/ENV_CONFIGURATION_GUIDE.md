# VIP支付系统环境变量配置指南

本文档详细说明VIP会员支付系统所需的所有环境变量配置，包括开发环境、测试环境和生产环境的配置方法。

## 目录

1. [快速开始](#快速开始)
2. [环境变量分类](#环境变量分类)
3. [支付系统核心配置](#支付系统核心配置)
4. [微信支付配置](#微信支付配置)
5. [支付宝支付配置](#支付宝支付配置)
6. [VIP业务配置](#vip业务配置)
7. [安全配置](#安全配置)
8. [定时任务配置](#定时任务配置)
9. [环境切换指南](#环境切换指南)
10. [配置验证](#配置验证)
11. [常见问题](#常见问题)

---

## 快速开始

### 1. 复制配置模板

```bash
# 进入后端目录
cd backend

# 复制环境变量模板
cp .env.example .env
```

### 2. 最小化配置（开发环境）

开发环境只需配置以下必要项即可启动：

```bash
# 基础配置
NODE_ENV=development
PORT=8080
DATABASE_URL="postgresql://postgres:password@localhost:5432/startide_design?schema=public"
JWT_SECRET=your-dev-jwt-secret-at-least-32-characters

# 支付环境（沙箱模式）
PAYMENT_ENV=sandbox
```

### 3. 生产环境配置清单

生产环境部署前，请确保以下配置项已正确设置：

- [ ] `NODE_ENV=production`
- [ ] `PAYMENT_ENV=production`
- [ ] 微信支付完整配置
- [ ] 支付宝完整配置
- [ ] 支付回调URL配置
- [ ] 证书文件部署
- [ ] 安全密钥更新

---

## 环境变量分类

| 分类 | 前缀/关键字 | 说明 |
|------|-------------|------|
| 支付环境 | `PAYMENT_ENV` | 控制沙箱/生产环境切换 |
| 微信支付 | `WECHAT_*` | 微信支付相关配置 |
| 支付宝 | `ALIPAY_*` | 支付宝相关配置 |
| VIP业务 | `VIP_*`, `*_DOWNLOAD_*` | VIP功能相关配置 |
| 安全控制 | `SECONDARY_AUTH_*`, `MAX_*` | 安全限制相关配置 |
| 积分兑换 | `POINTS_*`, `*_EXCHANGE_*` | 积分兑换相关配置 |

---

## 支付系统核心配置

### PAYMENT_ENV

**支付环境标识**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 可选值 | `sandbox` / `production` |
| 默认值 | `sandbox` |
| 必填 | 是 |

```bash
# 沙箱测试环境
PAYMENT_ENV=sandbox

# 正式生产环境
PAYMENT_ENV=production
```

**说明**：
- `sandbox`：使用微信/支付宝沙箱环境，用于开发测试
- `production`：使用正式支付接口，处理真实交易

**注意事项**：
- 切换到 `production` 前，必须完成所有支付配置
- 沙箱环境的订单会添加"测试订单"标识
- 前端在沙箱环境会显示"测试环境"水印

---

## 微信支付配置

### 基础配置

#### WECHAT_APP_ID

**微信开放平台AppID**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 示例 | `wx1234567890abcdef` |
| 必填 | 生产环境必填 |

```bash
WECHAT_APP_ID=wx1234567890abcdef
```

**获取方式**：
1. 登录 [微信开放平台](https://open.weixin.qq.com/)
2. 进入"管理中心" → "应用详情"
3. 复制AppID

---

#### WECHAT_MCH_ID

**微信支付商户号**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 示例 | `1234567890` |
| 必填 | 生产环境必填 |

```bash
WECHAT_MCH_ID=1234567890
```

**获取方式**：
1. 登录 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 进入"产品中心" → "开发配置"
3. 查看商户号

---

#### WECHAT_PAY_API_KEY_V3

**微信支付API V3密钥**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 长度 | 32位 |
| 必填 | 生产环境必填 |

```bash
WECHAT_PAY_API_KEY_V3=your-32-character-api-v3-key-here
```

**获取方式**：
1. 登录微信支付商户平台
2. 进入"账户中心" → "API安全"
3. 设置APIv3密钥（32位字符串）

**安全提示**：
- 密钥必须妥善保管，不要泄露
- 建议定期更换密钥
- 不要在代码中硬编码

---

### 证书配置

#### WECHAT_PAY_CERT_SERIAL_NO

**微信支付证书序列号**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 示例 | `1234567890ABCDEF1234567890ABCDEF12345678` |
| 必填 | 生产环境必填 |

```bash
WECHAT_PAY_CERT_SERIAL_NO=1234567890ABCDEF1234567890ABCDEF12345678
```

**获取方式**：
1. 登录微信支付商户平台
2. 进入"账户中心" → "API安全" → "API证书"
3. 查看证书序列号

---

#### WECHAT_CERT_PATH

**微信支付商户证书路径**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 默认值 | `./certs/wechat/apiclient_cert.pem` |
| 必填 | 生产环境必填 |

```bash
WECHAT_CERT_PATH=./certs/wechat/apiclient_cert.pem
```

---

#### WECHAT_KEY_PATH

**微信支付商户私钥路径**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 默认值 | `./certs/wechat/apiclient_key.pem` |
| 必填 | 生产环境必填 |

```bash
WECHAT_KEY_PATH=./certs/wechat/apiclient_key.pem
```

---

#### WECHAT_PAY_PLATFORM_CERT_PATH

**微信支付平台证书路径**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 默认值 | `./certs/wechat/wechatpay_cert.pem` |
| 必填 | 生产环境必填 |

```bash
WECHAT_PAY_PLATFORM_CERT_PATH=./certs/wechat/wechatpay_cert.pem
```

**证书下载方式**：
1. 登录微信支付商户平台
2. 进入"账户中心" → "API安全" → "下载证书"
3. 将证书文件放置到 `backend/certs/wechat/` 目录

---

### 回调配置

#### WECHAT_NOTIFY_URL

**微信支付回调地址**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 格式 | `https://域名/api/v1/payment/wechat/notify` |
| 必填 | 生产环境必填 |

```bash
# 生产环境
WECHAT_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/wechat/notify

# 开发环境（使用内网穿透）
WECHAT_NOTIFY_URL=https://your-ngrok-url.ngrok.io/api/v1/payment/wechat/notify
```

**注意事项**：
- 必须使用HTTPS协议
- 域名必须已备案（国内服务器）
- 需要在微信支付商户平台配置白名单

---

## 支付宝支付配置

### 基础配置

#### ALIPAY_APP_ID

**支付宝应用AppID**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 示例 | `2021001234567890` |
| 必填 | 生产环境必填 |

```bash
ALIPAY_APP_ID=2021001234567890
```

**获取方式**：
1. 登录 [支付宝开放平台](https://open.alipay.com/)
2. 进入"控制台" → "应用列表"
3. 查看应用APPID

---

#### ALIPAY_PRIVATE_KEY

**支付宝应用私钥（RSA2）**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 格式 | PKCS8格式私钥 |
| 必填 | 生产环境必填 |

```bash
ALIPAY_PRIVATE_KEY=MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
```

**生成方式**：
1. 下载 [支付宝密钥生成工具](https://opendocs.alipay.com/common/02kipl)
2. 选择"RSA2(SHA256)"
3. 选择"PKCS8(Java适用)"格式
4. 生成密钥对

**安全提示**：
- 私钥必须严格保密
- 不要将私钥提交到代码仓库
- 建议使用环境变量或密钥管理服务

---

#### ALIPAY_PUBLIC_KEY

**支付宝公钥**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 说明 | 支付宝的公钥，非应用公钥 |
| 必填 | 生产环境必填 |

```bash
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```

**获取方式**：
1. 登录支付宝开放平台
2. 进入应用详情 → "开发信息" → "接口加签方式"
3. 上传应用公钥后，获取支付宝公钥

---

#### ALIPAY_GATEWAY

**支付宝网关地址**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 默认值 | 根据 `PAYMENT_ENV` 自动选择 |
| 必填 | 否（自动配置） |

```bash
# 正式环境（默认）
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do

# 沙箱环境
ALIPAY_GATEWAY=https://openapi.alipaydev.com/gateway.do
```

**说明**：
- 如果不设置，系统会根据 `PAYMENT_ENV` 自动选择
- `production` → 正式网关
- `sandbox` → 沙箱网关

---

### 回调配置

#### ALIPAY_NOTIFY_URL

**支付宝异步回调地址**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 格式 | `https://域名/api/v1/payment/alipay/notify` |
| 必填 | 生产环境必填 |

```bash
ALIPAY_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/alipay/notify
```

---

#### ALIPAY_RETURN_URL

**支付宝同步返回地址**

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 格式 | `https://域名/payment/success` |
| 必填 | 否 |

```bash
ALIPAY_RETURN_URL=https://www.yourdomain.com/payment/success
```

**说明**：
- 用户支付完成后跳转的前端页面
- 不是必填项，但建议配置以提升用户体验

---

## VIP业务配置

### 下载限制

#### VIP_DAILY_DOWNLOAD_LIMIT

**VIP用户每日下载上限**

| 属性 | 值 |
|------|-----|
| 类型 | `number` |
| 默认值 | `50` |
| 单位 | 次/天 |

```bash
VIP_DAILY_DOWNLOAD_LIMIT=50
```

---

#### FREE_DAILY_DOWNLOAD_LIMIT

**普通用户每日免费下载次数**

| 属性 | 值 |
|------|-----|
| 类型 | `number` |
| 默认值 | `2` |
| 单位 | 次/天 |

```bash
FREE_DAILY_DOWNLOAD_LIMIT=2
```

---

### 订单配置

#### ORDER_TIMEOUT_MINUTES

**订单超时时间**

| 属性 | 值 |
|------|-----|
| 类型 | `number` |
| 默认值 | `15` |
| 单位 | 分钟 |

```bash
ORDER_TIMEOUT_MINUTES=15
```

**说明**：
- 订单创建后超过此时间未支付，自动取消
- 建议设置为15-30分钟

---

#### REFUND_VALID_DAYS

**退款申请有效期**

| 属性 | 值 |
|------|-----|
| 类型 | `number` |
| 默认值 | `7` |
| 单位 | 天 |

```bash
REFUND_VALID_DAYS=7
```

**说明**：
- 购买后超过此天数不能申请退款
- 终身会员不支持退款

---

#### VIP_GRACE_PERIOD_DAYS

**VIP宽限期**

| 属性 | 值 |
|------|-----|
| 类型 | `number` |
| 默认值 | `7` |
| 单位 | 天 |

```bash
VIP_GRACE_PERIOD_DAYS=7
```

**说明**：
- VIP到期后，在宽限期内显示灰色VIP图标
- 超过宽限期后隐藏VIP图标

---

### 积分兑换配置

#### POINTS_PER_VIP_MONTH

**每月VIP所需积分**

| 属性 | 值 |
|------|-----|
| 类型 | `number` |
| 默认值 | `1000` |
| 单位 | 积分 |

```bash
POINTS_PER_VIP_MONTH=1000
```

---

#### MAX_EXCHANGE_MONTHS

**单次最大兑换月数**

| 属性 | 值 |
|------|-----|
| 类型 | `number` |
| 默认值 | `3` |
| 单位 | 月 |

```bash
MAX_EXCHANGE_MONTHS=3
```

**说明**：
- 用户每月只能兑换一次VIP
- 单次最多兑换3个月

---

## 安全配置

### 二次验证

#### SECONDARY_AUTH_THRESHOLD

**二次验证阈值**

| 属性 | 值 |
|------|-----|
| 类型 | `number` |
| 默认值 | `20000` |
| 单位 | 分（人民币） |

```bash
# 200元 = 20000分
SECONDARY_AUTH_THRESHOLD=20000
```

**说明**：
- 订单金额 ≥ 此值时，需要手机验证码二次确认
- 设置为0表示禁用二次验证（不推荐）

---

### 限流配置

#### MAX_UNPAID_ORDERS_PER_HOUR

**每小时最大未支付订单数**

| 属性 | 值 |
|------|-----|
| 类型 | `number` |
| 默认值 | `5` |
| 单位 | 个/小时 |

```bash
MAX_UNPAID_ORDERS_PER_HOUR=5
```

**说明**：
- 同一账号1小时内创建超过此数量的未支付订单，将被限制支付
- 用于防止恶意刷单

---

#### MAX_DEVICES_PER_USER

**每用户最大登录设备数**

| 属性 | 值 |
|------|-----|
| 类型 | `number` |
| 默认值 | `3` |
| 单位 | 台 |

```bash
MAX_DEVICES_PER_USER=3
```

**说明**：
- VIP账号最多同时在3台设备登录
- 超出限制时，最早登录的设备会被踢出

---

## 定时任务配置

### 对账任务

系统内置以下定时任务，通过代码配置：

| 任务 | 执行频率 | 说明 |
|------|----------|------|
| 订单对账 | 每5分钟 | 同步支付平台订单状态 |
| VIP到期提醒 | 每天9:00 | 发送VIP到期提醒通知 |
| 订单超时取消 | 每分钟 | 取消超时未支付订单 |

**启用定时任务**：

```bash
# 启用定时任务（默认true）
ENABLE_CRON=true
```

---

## 环境切换指南

### 开发环境 → 测试环境

1. 确保沙箱账号已申请
2. 配置沙箱环境变量：

```bash
PAYMENT_ENV=sandbox
WECHAT_APP_ID=沙箱AppID
WECHAT_MCH_ID=沙箱商户号
ALIPAY_APP_ID=沙箱AppID
```

### 测试环境 → 生产环境

1. **检查清单**：
   - [ ] 所有支付配置已填写
   - [ ] 证书文件已部署
   - [ ] 回调URL已配置且可访问
   - [ ] 域名已备案
   - [ ] HTTPS证书已配置

2. **切换配置**：

```bash
# 切换到生产环境
PAYMENT_ENV=production

# 更新回调地址
WECHAT_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/wechat/notify
ALIPAY_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/alipay/notify
ALIPAY_RETURN_URL=https://www.yourdomain.com/payment/success
```

3. **验证配置**：

```bash
# 启动服务后检查日志
npm run start

# 查看配置验证结果
# 如果配置不完整，会在启动时输出警告
```

---

## 配置验证

### 启动时验证

系统启动时会自动验证支付配置，验证逻辑如下：

```typescript
// backend/src/config/payment.ts
export function validatePaymentConfig(config: PaymentConfig): { valid: boolean; errors: string[] }
```

**验证项目**：
- 生产环境必须配置微信支付AppID、商户号、API密钥、回调地址
- 生产环境必须配置支付宝AppID、私钥、公钥、回调地址

### 手动验证

可以通过以下方式手动验证配置：

```bash
# 进入后端目录
cd backend

# 运行配置检查脚本
npx ts-node -e "
import { loadPaymentConfig, validatePaymentConfig } from './src/config/payment';
const config = loadPaymentConfig();
const result = validatePaymentConfig(config);
console.log('环境:', config.env);
console.log('验证结果:', result.valid ? '通过' : '失败');
if (result.errors.length > 0) {
  console.log('错误:', result.errors);
}
"
```

---

## 常见问题

### Q1: 如何获取微信支付沙箱账号？

**A**: 微信支付沙箱环境需要使用正式商户号，但可以使用沙箱密钥进行测试。详见 [微信支付沙箱环境](https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=23_1)。

### Q2: 支付回调收不到怎么办？

**A**: 请检查以下几点：
1. 回调URL是否使用HTTPS
2. 服务器防火墙是否开放
3. 域名是否已备案
4. 是否在支付平台配置了回调白名单

### Q3: 如何在本地测试支付回调？

**A**: 可以使用内网穿透工具：
1. 安装 [ngrok](https://ngrok.com/) 或 [frp](https://github.com/fatedier/frp)
2. 启动内网穿透：`ngrok http 8080`
3. 将生成的HTTPS地址配置为回调URL

### Q4: 证书文件放在哪里？

**A**: 证书文件应放置在 `backend/certs/` 目录下：

```
backend/
├── certs/
│   ├── wechat/
│   │   ├── apiclient_cert.pem    # 商户证书
│   │   ├── apiclient_key.pem     # 商户私钥
│   │   └── wechatpay_cert.pem    # 平台证书
│   └── alipay/
│       └── (支付宝使用环境变量配置密钥)
```

### Q5: 如何更新支付密钥？

**A**: 
1. 在支付平台生成新密钥
2. 更新 `.env` 文件中的密钥配置
3. 重启后端服务
4. 验证支付功能正常

### Q6: 生产环境配置检查失败怎么办？

**A**: 检查以下配置是否完整：
- `WECHAT_APP_ID`
- `WECHAT_MCH_ID`
- `WECHAT_PAY_API_KEY_V3`
- `WECHAT_NOTIFY_URL`
- `ALIPAY_APP_ID`
- `ALIPAY_PRIVATE_KEY`
- `ALIPAY_PUBLIC_KEY`
- `ALIPAY_NOTIFY_URL`

---

## 配置示例

### 完整的生产环境配置示例

```bash
# ============================================
# VIP支付系统生产环境配置
# ============================================

# 支付环境
PAYMENT_ENV=production

# 微信支付配置
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_MCH_ID=1234567890
WECHAT_PAY_API_KEY_V3=your-32-character-api-v3-key-here
WECHAT_PAY_CERT_SERIAL_NO=1234567890ABCDEF1234567890ABCDEF12345678
WECHAT_CERT_PATH=./certs/wechat/apiclient_cert.pem
WECHAT_KEY_PATH=./certs/wechat/apiclient_key.pem
WECHAT_PAY_PLATFORM_CERT_PATH=./certs/wechat/wechatpay_cert.pem
WECHAT_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/wechat/notify

# 支付宝配置
ALIPAY_APP_ID=2021001234567890
ALIPAY_PRIVATE_KEY=MIIEvgIBADANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
ALIPAY_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/alipay/notify
ALIPAY_RETURN_URL=https://www.yourdomain.com/payment/success

# VIP业务配置
VIP_DAILY_DOWNLOAD_LIMIT=50
FREE_DAILY_DOWNLOAD_LIMIT=2
ORDER_TIMEOUT_MINUTES=15
REFUND_VALID_DAYS=7
VIP_GRACE_PERIOD_DAYS=7

# 积分兑换配置
POINTS_PER_VIP_MONTH=1000
MAX_EXCHANGE_MONTHS=3

# 安全配置
SECONDARY_AUTH_THRESHOLD=20000
MAX_UNPAID_ORDERS_PER_HOUR=5
MAX_DEVICES_PER_USER=3

# 定时任务
ENABLE_CRON=true
```

---

## 相关文档

- [商户申请指南](./MERCHANT_APPLICATION_GUIDE.md)
- [沙箱测试指南](./SANDBOX_TESTING_GUIDE.md)
- [支付API文档](./API_PAYMENT.md)
- [安全审计报告](./SECURITY_AUDIT_REPORT.md)

---

*文档版本: 1.0.0*
*最后更新: 2025-12-26*
