# 支付商户申请与配置指南

## 概述

本文档提供微信支付和支付宝支付的商户申请流程、证书配置方法以及沙箱测试指南。在接入支付功能前，需要完成商户资质申请和相关配置。

---

## 一、微信支付商户申请指南

### 1.1 申请前准备

#### 1.1.1 所需材料清单

| 材料类型 | 具体要求 | 备注 |
|---------|---------|------|
| 营业执照 | 彩色扫描件，清晰可辨 | 需在有效期内 |
| 法人身份证 | 正反面彩色扫描件 | 需在有效期内 |
| 对公银行账户 | 开户许可证或银行回单 | 用于结算 |
| 联系人信息 | 手机号、邮箱 | 用于接收通知 |
| 网站/APP信息 | 网站域名或APP下载链接 | 需已上线 |
| ICP备案号 | 网站备案信息 | 仅网站支付需要 |

#### 1.1.2 商户类型选择

| 商户类型 | 适用场景 | 结算周期 |
|---------|---------|---------|
| 普通商户 | 单一主体经营 | T+1 |
| 服务商 | 为其他商户提供支付服务 | T+1 |
| 银行服务商 | 银行合作模式 | 按协议 |

### 1.2 申请流程

#### 步骤一：注册微信支付商户平台账号

1. 访问 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 点击「成为商户」
3. 使用微信扫码登录
4. 选择商户类型（推荐选择「普通商户」）

#### 步骤二：填写商户信息

1. **主体信息**
   - 选择主体类型（企业/个体工商户）
   - 上传营业执照
   - 填写商户简称（将显示在支付页面）

2. **法人信息**
   - 上传法人身份证正反面
   - 填写法人姓名、身份证号

3. **结算信息**
   - 选择结算账户类型（对公/对私）
   - 填写银行账户信息
   - 上传开户许可证

4. **联系信息**
   - 填写超级管理员信息
   - 填写客服电话

#### 步骤三：等待审核

- 审核周期：1-5个工作日
- 审核通过后会收到短信和邮件通知
- 如审核不通过，根据反馈修改后重新提交

#### 步骤四：签署协议并验证

1. 在线签署《微信支付服务协议》
2. 完成账户验证（小额打款验证）
3. 验证通过后获得商户号（mch_id）

#### 步骤五：配置API密钥

1. 登录商户平台 → 账户中心 → API安全
2. 设置API密钥（32位字符串）
3. 下载API证书（用于退款等敏感操作）

### 1.3 获取关键配置参数

完成申请后，需要获取以下参数：

| 参数名 | 获取位置 | 用途 |
|-------|---------|------|
| AppID | 微信公众平台/开放平台 | 应用标识 |
| 商户号(mch_id) | 商户平台首页 | 商户标识 |
| API密钥 | 商户平台 → API安全 | 签名验证 |
| APIv3密钥 | 商户平台 → API安全 | V3接口签名 |
| 证书序列号 | 商户平台 → API安全 | 证书标识 |

### 1.4 支付产品开通

根据业务需求开通相应支付产品：

| 产品名称 | 适用场景 | 开通方式 |
|---------|---------|---------|
| Native支付 | PC网站扫码支付 | 商户平台 → 产品中心 |
| JSAPI支付 | 微信内H5支付 | 需关联公众号 |
| H5支付 | 手机浏览器支付 | 需申请开通 |
| APP支付 | 移动APP支付 | 需关联开放平台应用 |

### 1.5 回调地址配置

1. 登录商户平台 → 产品中心 → 开发配置
2. 配置支付结果通知URL
3. 配置退款结果通知URL
4. 添加IP白名单（可选）

---

## 二、支付宝商户申请指南

### 2.1 申请前准备

#### 2.1.1 所需材料清单

| 材料类型 | 具体要求 | 备注 |
| -------- | -------- | ---- |
| 营业执照 | 彩色扫描件，清晰可辨 | 需在有效期内，三证合一 |
| 法人身份证 | 正反面彩色扫描件 | 需在有效期内 |
| 对公银行账户 | 银行开户许可证或基本户信息 | 用于结算，需与营业执照主体一致 |
| 网站/APP信息 | 已上线的网站或APP | 需可正常访问 |
| ICP备案号 | 网站备案信息截图 | 网站支付必需，需与营业执照主体一致 |
| 联系人信息 | 手机号、邮箱 | 用于接收审核通知和技术支持 |
| 网站授权函 | 非自有网站需提供 | 模板可在开放平台下载 |

#### 2.1.2 账户类型选择

| 账户类型 | 适用场景 | 特点 | 结算周期 |
| -------- | -------- | ---- | -------- |
| 企业支付宝 | 企业/个体工商户 | 支持全部支付产品，无限额 | T+1 |
| 个人支付宝 | 个人开发者测试 | 功能受限，有交易限额 | T+1 |

> **推荐**：正式商用请使用企业支付宝账号，个人账号仅适合开发测试。

#### 2.1.3 支付宝企业账号注册

如果还没有企业支付宝账号，需要先注册：

1. 访问 [支付宝企业账户注册](https://memberprod.alipay.com/account/reg/enterpriseIndex.htm)
2. 选择「企业账户」
3. 填写企业邮箱作为登录名
4. 完成手机验证
5. 上传营业执照，填写企业信息
6. 绑定法人支付宝进行实名认证
7. 设置支付密码和登录密码

### 2.2 申请流程

#### 步骤一：注册支付宝开放平台账号

1. 访问 [支付宝开放平台](https://open.alipay.com/)
2. 点击右上角「登录」，使用企业支付宝账号登录
3. 首次登录需完成开发者认证：
   - 填写开发者信息
   - 上传企业资质
   - 等待审核（通常1个工作日内）

#### 步骤二：创建应用

1. 登录后进入「控制台」
2. 点击「我的应用」→「创建应用」
3. 选择应用类型：「网页/移动应用」
4. 填写应用基本信息：

| 字段 | 说明 | 示例 |
| ---- | ---- | ---- |
| 应用名称 | 将显示在支付页面 | XX设计资源平台 |
| 应用图标 | 200x200px，PNG/JPG | 公司Logo |
| 应用简介 | 简要描述应用功能 | 提供设计资源下载服务的VIP会员系统 |
| 应用类型 | 网页应用/移动应用 | 网页应用 |

5. 点击「确认创建」

#### 步骤三：添加支付能力

1. 在应用详情页，找到「能力列表」区域
2. 点击「添加能力」按钮
3. 在能力市场中选择需要的支付能力：

| 能力名称 | 用途 | 是否需要签约 |
| -------- | ---- | ------------ |
| 电脑网站支付 | PC端网页支付 | 是 |
| 手机网站支付 | 移动端H5支付 | 是 |
| APP支付 | 原生APP支付 | 是 |
| 当面付 | 线下扫码支付 | 是 |
| 单笔转账到支付宝账户 | 退款/提现 | 是 |

4. 添加能力后，点击「签约」
5. 阅读并同意相关协议
6. 填写签约信息（网站URL、ICP备案号等）
7. 提交签约申请

#### 步骤四：配置应用密钥

支付宝支持两种加签方式，推荐使用证书模式：

**方式一：公钥证书模式（推荐）**

1. 下载 [支付宝开放平台密钥工具](https://opendocs.alipay.com/common/02kipk)
2. 打开工具，选择「生成密钥」
3. 选择加签方式：「公钥证书」
4. 选择密钥长度：RSA2（2048位）
5. 点击「生成密钥」
6. 保存生成的文件：
   - `应用私钥.txt` - 妥善保管，不要泄露
   - `应用公钥.txt` - 用于上传到开放平台
   - `CSR文件.csr` - 用于申请证书

7. 在开放平台应用详情页：
   - 点击「开发设置」→「接口加签方式」→「设置」
   - 选择「公钥证书」
   - 上传CSR文件
   - 下载三个证书文件：
     - `appCertPublicKey_应用APPID.crt` - 应用公钥证书
     - `alipayCertPublicKey_RSA2.crt` - 支付宝公钥证书
     - `alipayRootCert.crt` - 支付宝根证书

**方式二：公钥模式**

1. 使用密钥工具生成密钥对
2. 选择加签方式：「公钥」
3. 在开放平台上传应用公钥
4. 获取支付宝公钥

#### 步骤五：配置应用网关和回调地址

1. 在应用详情页，点击「开发设置」
2. 配置以下信息：

| 配置项 | 说明 | 示例 |
| ------ | ---- | ---- |
| 应用网关 | 接收支付宝异步通知的地址 | `https://api.example.com/api/v1/payment/alipay/notify` |
| 授权回调地址 | OAuth授权回调（如需要） | `https://www.example.com/auth/callback` |
| 接口内容加密方式 | 可选，增强安全性 | AES密钥 |

3. 配置IP白名单（可选但推荐）：
   - 添加服务器出口IP
   - 增强接口调用安全性

#### 步骤六：提交审核

1. 确认以下信息已完整配置：
   - [x] 应用基本信息
   - [x] 支付能力已添加并签约
   - [x] 接口加签方式已设置
   - [x] 应用网关已配置

2. 点击「提交审核」
3. 审核周期：1-3个工作日
4. 审核状态可在「我的应用」中查看
5. 审核通过后，应用状态变为「已上线」

### 2.3 获取关键配置参数

完成申请后，需要获取以下参数用于系统配置：

| 参数名 | 获取位置 | 用途 | 示例 |
| ------ | -------- | ---- | ---- |
| AppID | 应用详情页 → 基本信息 | 应用唯一标识 | 2021001234567890 |
| 应用私钥 | 本地密钥工具生成 | 请求签名 | MIIEvgIBADANBg... |
| 支付宝公钥 | 应用详情页 → 开发设置（公钥模式） | 验证支付宝响应签名 | MIIBIjANBgkqhk... |
| 应用公钥证书 | 应用详情页下载（证书模式） | 证书模式签名 | appCertPublicKey.crt |
| 支付宝公钥证书 | 应用详情页下载（证书模式） | 验证支付宝响应 | alipayCertPublicKey.crt |
| 支付宝根证书 | 应用详情页下载（证书模式） | 证书链验证 | alipayRootCert.crt |
| 网关地址 | 固定值 | API请求地址 | `https://openapi.alipay.com/gateway.do` |
| PID | 账户中心 → 合作伙伴管理 | 商户ID（部分接口需要） | 2088001234567890 |

### 2.4 签约支付产品

#### 2.4.1 产品费率说明

| 产品名称 | 适用场景 | 标准费率 | 结算周期 | 单笔限额 |
| -------- | -------- | -------- | -------- | -------- |
| 电脑网站支付 | PC网站 | 0.6% | T+1 | 无限制 |
| 手机网站支付 | 移动端H5 | 0.6% | T+1 | 无限制 |
| APP支付 | 移动APP | 0.6% | T+1 | 无限制 |
| 当面付 | 线下扫码 | 0.6% | T+1 | 无限制 |

> **费率优惠**：交易量大的商户可联系支付宝商务申请费率优惠。

#### 2.4.2 签约流程

1. 在应用详情页点击对应能力的「签约」按钮
2. 填写签约信息：
   - 网站/APP名称
   - 网站URL（需与ICP备案一致）
   - ICP备案号
   - 经营类目
3. 上传补充材料（如需要）
4. 提交签约申请
5. 等待审核（1-3个工作日）

#### 2.4.3 签约注意事项

- 网站URL必须可正常访问
- ICP备案主体需与营业执照一致
- 经营类目需与实际业务相符
- 部分特殊行业需要额外资质

### 2.5 配置回调地址

#### 2.5.1 异步通知地址（必须配置）

异步通知用于接收支付结果，是支付流程的关键环节：

```plaintext
配置位置：应用详情页 → 开发设置 → 应用网关
示例地址：https://api.example.com/api/v1/payment/alipay/notify
```

**配置要求**：
- 必须使用HTTPS协议
- 必须是公网可访问的地址
- 端口只能是443（HTTPS默认端口）
- 路径中不能包含特殊字符

#### 2.5.2 同步回调地址（支付时传入）

同步回调用于支付完成后跳转回商户页面：

```plaintext
在调用支付接口时通过 return_url 参数传入
示例地址：https://www.example.com/vip/payment/success
```

**配置要求**：
- 可以使用HTTP或HTTPS
- 用于展示支付结果页面
- 不要依赖此回调更新订单状态（应以异步通知为准）

#### 2.5.3 IP白名单配置（推荐）

```plaintext
配置位置：应用详情页 → 开发设置 → IP白名单
```

添加服务器出口IP，增强安全性：
- 只有白名单内的IP才能调用支付宝接口
- 防止密钥泄露后被滥用
- 生产环境强烈建议配置

### 2.6 常见问题与解决方案

#### Q1: 签约审核不通过怎么办？

常见原因及解决方案：

| 原因 | 解决方案 |
| ---- | -------- |
| 网站无法访问 | 确保网站已上线且可正常访问 |
| ICP备案不一致 | 确保备案主体与营业执照一致 |
| 经营类目不符 | 选择与实际业务相符的类目 |
| 网站内容不完善 | 完善网站内容，添加公司信息、联系方式等 |

#### Q2: 如何获取PID（合作伙伴ID）？

1. 登录 [支付宝商家中心](https://b.alipay.com/)
2. 进入「账户中心」→「账户信息」
3. 查看「合作伙伴ID」或「商户ID」

#### Q3: 证书模式和公钥模式如何选择？

| 对比项 | 证书模式 | 公钥模式 |
| ------ | -------- | -------- |
| 安全性 | 更高 | 一般 |
| 配置复杂度 | 较复杂 | 简单 |
| 证书管理 | 需要管理多个证书文件 | 只需管理密钥字符串 |
| 推荐场景 | 生产环境 | 开发测试 |

**推荐**：生产环境使用证书模式，开发测试可使用公钥模式。

#### Q4: 应用审核需要多长时间？

- 首次审核：1-3个工作日
- 修改后重新审核：1-2个工作日
- 加急审核：可联系支付宝商务

### 2.7 技术对接检查清单

完成商户申请后，进行技术对接前请确认：

- [ ] 已获取AppID
- [ ] 已生成并保存应用私钥
- [ ] 已下载支付宝公钥/证书
- [ ] 已配置应用网关（异步通知地址）
- [ ] 已签约所需的支付产品
- [ ] 应用状态为「已上线」
- [ ] 已配置IP白名单（推荐）

---

## 三、证书配置指南

### 3.1 微信支付证书配置

#### 3.1.1 证书类型说明

| 证书类型 | 文件名 | 用途 |
|---------|-------|------|
| 商户API证书 | apiclient_cert.pem | 敏感操作身份验证 |
| 商户API私钥 | apiclient_key.pem | 请求签名 |
| 平台证书 | wechatpay_cert.pem | 验证微信支付响应 |

#### 3.1.2 证书下载

1. 登录微信支付商户平台
2. 进入「账户中心」→「API安全」
3. 点击「申请API证书」
4. 按照指引完成证书申请
5. 下载证书压缩包

#### 3.1.3 证书存放

```
backend/
├── certs/
│   └── wechat/
│       ├── apiclient_cert.pem    # 商户证书
│       ├── apiclient_key.pem     # 商户私钥
│       └── wechatpay_cert.pem    # 平台证书
```

#### 3.1.4 环境变量配置

```env
# 微信支付证书路径
WECHAT_CERT_PATH=./certs/wechat/apiclient_cert.pem
WECHAT_KEY_PATH=./certs/wechat/apiclient_key.pem
WECHAT_PLATFORM_CERT_PATH=./certs/wechat/wechatpay_cert.pem

# 证书序列号
WECHAT_CERT_SERIAL_NO=你的证书序列号
```

#### 3.1.5 证书安全注意事项

- ⚠️ 证书文件不要提交到代码仓库
- ⚠️ 在 `.gitignore` 中排除证书目录
- ⚠️ 生产环境使用环境变量或密钥管理服务
- ⚠️ 定期更新证书（证书有效期5年）

### 3.2 支付宝证书配置

#### 3.2.1 密钥生成方式

**方式一：使用支付宝密钥生成工具（推荐）**

1. 下载 [支付宝开放平台密钥工具](https://opendocs.alipay.com/common/02kipk)
2. 选择「生成密钥」
3. 选择密钥格式：RSA2（推荐）
4. 选择密钥长度：2048位
5. 生成后保存私钥和公钥

**方式二：使用OpenSSL命令行**

```bash
# 生成私钥
openssl genrsa -out app_private_key.pem 2048

# 生成公钥
openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem

# 转换为PKCS8格式（Java需要）
openssl pkcs8 -topk8 -inform PEM -in app_private_key.pem -outform PEM -nocrypt -out app_private_key_pkcs8.pem
```

#### 3.2.2 公钥模式配置

1. 将生成的应用公钥上传到支付宝开放平台
2. 获取支付宝公钥
3. 配置环境变量：

```env
# 支付宝公钥模式
ALIPAY_APP_ID=你的AppID
ALIPAY_PRIVATE_KEY=你的应用私钥（去除头尾和换行）
ALIPAY_PUBLIC_KEY=支付宝公钥（去除头尾和换行）
```

#### 3.2.3 证书模式配置（推荐）

1. 在支付宝开放平台下载三个证书：
   - 应用公钥证书（appCertPublicKey.crt）
   - 支付宝公钥证书（alipayCertPublicKey.crt）
   - 支付宝根证书（alipayRootCert.crt）

2. 证书存放：

```
backend/
├── certs/
│   └── alipay/
│       ├── appCertPublicKey.crt      # 应用公钥证书
│       ├── alipayCertPublicKey.crt   # 支付宝公钥证书
│       ├── alipayRootCert.crt        # 支付宝根证书
│       └── app_private_key.pem       # 应用私钥
```

3. 环境变量配置：

```env
# 支付宝证书模式
ALIPAY_APP_ID=你的AppID
ALIPAY_PRIVATE_KEY_PATH=./certs/alipay/app_private_key.pem
ALIPAY_APP_CERT_PATH=./certs/alipay/appCertPublicKey.crt
ALIPAY_ALIPAY_CERT_PATH=./certs/alipay/alipayCertPublicKey.crt
ALIPAY_ROOT_CERT_PATH=./certs/alipay/alipayRootCert.crt
```

### 3.3 证书目录结构与初始化

#### 3.3.1 完整目录结构

```plaintext
backend/
├── certs/
│   ├── README.md                     # 证书配置说明（不含敏感信息）
│   ├── wechat/
│   │   ├── apiclient_cert.pem        # 微信商户API证书
│   │   ├── apiclient_key.pem         # 微信商户API私钥
│   │   └── wechatpay_cert.pem        # 微信平台证书
│   └── alipay/
│       ├── app_private_key.pem       # 支付宝应用私钥
│       ├── appCertPublicKey.crt      # 支付宝应用公钥证书
│       ├── alipayCertPublicKey.crt   # 支付宝公钥证书
│       └── alipayRootCert.crt        # 支付宝根证书
```

#### 3.3.2 初始化证书目录

在 Windows PowerShell 中执行：

```powershell
# 创建证书目录
New-Item -ItemType Directory -Force -Path "backend/certs/wechat"
New-Item -ItemType Directory -Force -Path "backend/certs/alipay"

# 创建占位说明文件
@"
# 支付证书目录

此目录用于存放支付相关证书文件，请勿将证书文件提交到代码仓库。

## 微信支付证书 (wechat/)
- apiclient_cert.pem - 商户API证书
- apiclient_key.pem - 商户API私钥
- wechatpay_cert.pem - 平台证书

## 支付宝证书 (alipay/)
- app_private_key.pem - 应用私钥
- appCertPublicKey.crt - 应用公钥证书
- alipayCertPublicKey.crt - 支付宝公钥证书
- alipayRootCert.crt - 支付宝根证书

请从商户平台下载证书后放置到对应目录。
"@ | Out-File -FilePath "backend/certs/README.md" -Encoding UTF8
```

在 Linux/Mac 中执行：

```bash
# 创建证书目录
mkdir -p backend/certs/wechat
mkdir -p backend/certs/alipay

# 设置目录权限
chmod 700 backend/certs
chmod 700 backend/certs/wechat
chmod 700 backend/certs/alipay
```

### 3.4 证书目录权限设置

#### 3.4.1 Linux/Mac 权限配置

```bash
# 设置证书目录权限（仅所有者可访问）
chmod 700 backend/certs
chmod 700 backend/certs/wechat
chmod 700 backend/certs/alipay

# 设置证书文件权限（仅所有者可读）
chmod 600 backend/certs/wechat/*
chmod 600 backend/certs/alipay/*

# 验证权限设置
ls -la backend/certs/
ls -la backend/certs/wechat/
ls -la backend/certs/alipay/
```

#### 3.4.2 Windows 权限配置

```powershell
# 使用 icacls 设置权限（仅管理员和当前用户可访问）
icacls "backend\certs" /inheritance:r /grant:r "$env:USERNAME:(OI)(CI)F" /grant:r "SYSTEM:(OI)(CI)F"
icacls "backend\certs\wechat" /inheritance:r /grant:r "$env:USERNAME:(OI)(CI)F" /grant:r "SYSTEM:(OI)(CI)F"
icacls "backend\certs\alipay" /inheritance:r /grant:r "$env:USERNAME:(OI)(CI)F" /grant:r "SYSTEM:(OI)(CI)F"
```

### 3.5 .gitignore 配置

确保证书文件不被提交到代码仓库：

```gitignore
# 支付证书目录
backend/certs/wechat/
backend/certs/alipay/

# 证书文件类型
*.pem
*.crt
*.p12
*.pfx
*.key

# 保留说明文件
!backend/certs/README.md
```

### 3.6 环境变量完整配置

#### 3.6.1 开发环境配置 (.env.development)

```env
# ========== 支付环境 ==========
PAYMENT_ENV=sandbox

# ========== 微信支付配置 ==========
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_MCH_ID=1234567890
WECHAT_API_KEY=your_api_key_32_characters_here
WECHAT_API_V3_KEY=your_api_v3_key_32_chars_here
WECHAT_CERT_SERIAL_NO=your_cert_serial_number

# 微信支付证书路径
WECHAT_CERT_PATH=./certs/wechat/apiclient_cert.pem
WECHAT_KEY_PATH=./certs/wechat/apiclient_key.pem
WECHAT_PLATFORM_CERT_PATH=./certs/wechat/wechatpay_cert.pem

# 微信支付回调地址（开发环境使用内网穿透）
WECHAT_NOTIFY_URL=https://your-ngrok-domain.ngrok.io/api/v1/payment/wechat/notify

# ========== 支付宝配置 ==========
ALIPAY_APP_ID=2021001234567890
ALIPAY_SIGN_TYPE=RSA2

# 支付宝证书路径（证书模式）
ALIPAY_PRIVATE_KEY_PATH=./certs/alipay/app_private_key.pem
ALIPAY_APP_CERT_PATH=./certs/alipay/appCertPublicKey.crt
ALIPAY_ALIPAY_CERT_PATH=./certs/alipay/alipayCertPublicKey.crt
ALIPAY_ROOT_CERT_PATH=./certs/alipay/alipayRootCert.crt

# 支付宝网关（沙箱环境）
ALIPAY_GATEWAY=https://openapi.alipaydev.com/gateway.do

# 支付宝回调地址
ALIPAY_NOTIFY_URL=https://your-ngrok-domain.ngrok.io/api/v1/payment/alipay/notify
ALIPAY_RETURN_URL=http://localhost:3000/vip/payment/success
```

#### 3.6.2 生产环境配置 (.env.production)

```env
# ========== 支付环境 ==========
PAYMENT_ENV=production

# ========== 微信支付配置 ==========
WECHAT_APP_ID=wx_production_app_id
WECHAT_MCH_ID=production_mch_id
WECHAT_API_KEY=production_api_key_32_chars
WECHAT_API_V3_KEY=production_v3_key_32_chars
WECHAT_CERT_SERIAL_NO=production_cert_serial

# 微信支付证书路径（生产环境建议使用绝对路径或密钥管理服务）
WECHAT_CERT_PATH=/etc/payment/certs/wechat/apiclient_cert.pem
WECHAT_KEY_PATH=/etc/payment/certs/wechat/apiclient_key.pem
WECHAT_PLATFORM_CERT_PATH=/etc/payment/certs/wechat/wechatpay_cert.pem

# 微信支付回调地址（生产环境）
WECHAT_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/wechat/notify

# ========== 支付宝配置 ==========
ALIPAY_APP_ID=production_app_id
ALIPAY_SIGN_TYPE=RSA2

# 支付宝证书路径
ALIPAY_PRIVATE_KEY_PATH=/etc/payment/certs/alipay/app_private_key.pem
ALIPAY_APP_CERT_PATH=/etc/payment/certs/alipay/appCertPublicKey.crt
ALIPAY_ALIPAY_CERT_PATH=/etc/payment/certs/alipay/alipayCertPublicKey.crt
ALIPAY_ROOT_CERT_PATH=/etc/payment/certs/alipay/alipayRootCert.crt

# 支付宝网关（生产环境）
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do

# 支付宝回调地址
ALIPAY_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/alipay/notify
ALIPAY_RETURN_URL=https://www.yourdomain.com/vip/payment/success
```

### 3.7 证书验证与测试

#### 3.7.1 验证证书文件完整性

```bash
# 验证微信支付私钥
openssl rsa -in backend/certs/wechat/apiclient_key.pem -check -noout
# 预期输出: RSA key ok

# 验证微信支付证书
openssl x509 -in backend/certs/wechat/apiclient_cert.pem -text -noout | head -20

# 验证支付宝私钥
openssl rsa -in backend/certs/alipay/app_private_key.pem -check -noout
# 预期输出: RSA key ok

# 验证支付宝证书
openssl x509 -in backend/certs/alipay/appCertPublicKey.crt -text -noout | head -20
```

#### 3.7.2 验证证书有效期

```bash
# 查看微信支付证书有效期
openssl x509 -in backend/certs/wechat/apiclient_cert.pem -noout -dates

# 查看支付宝证书有效期
openssl x509 -in backend/certs/alipay/appCertPublicKey.crt -noout -dates
openssl x509 -in backend/certs/alipay/alipayCertPublicKey.crt -noout -dates
```

#### 3.7.3 Node.js 证书加载测试

```javascript
// test-certs.js - 证书加载测试脚本
const fs = require('fs');
const path = require('path');

function testCertificates() {
  const certsDir = path.join(__dirname, 'certs');
  
  const files = [
    'wechat/apiclient_cert.pem',
    'wechat/apiclient_key.pem',
    'alipay/app_private_key.pem',
    'alipay/appCertPublicKey.crt',
    'alipay/alipayCertPublicKey.crt',
    'alipay/alipayRootCert.crt'
  ];
  
  console.log('证书文件检查结果：\n');
  
  files.forEach(file => {
    const filePath = path.join(certsDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const size = Buffer.byteLength(content, 'utf8');
      console.log(`✅ ${file} - 存在 (${size} bytes)`);
    } catch (err) {
      console.log(`❌ ${file} - 不存在或无法读取`);
    }
  });
}

testCertificates();
```

### 3.8 证书安全最佳实践

#### 3.8.1 安全存储建议

| 环境 | 存储方式 | 说明 |
| ---- | -------- | ---- |
| 开发环境 | 本地文件 | 使用 .gitignore 排除，设置文件权限 |
| 测试环境 | 环境变量/配置中心 | 使用 CI/CD 注入证书内容 |
| 生产环境 | 密钥管理服务 | 推荐使用 AWS KMS、阿里云 KMS 等 |

#### 3.8.2 证书轮换流程

1. **提前准备**：在证书到期前30天申请新证书
2. **并行配置**：新旧证书同时配置，确保平滑过渡
3. **灰度切换**：先在测试环境验证新证书
4. **监控告警**：配置证书到期告警（建议提前60天）
5. **备份旧证书**：保留旧证书备份，以便回滚

#### 3.8.3 证书泄露应急处理

如果发现证书泄露，请立即执行以下步骤：

1. **立即吊销**：登录商户平台吊销泄露的证书
2. **申请新证书**：重新申请并下载新证书
3. **更新配置**：更新所有环境的证书配置
4. **审计日志**：检查是否有异常交易
5. **通知相关方**：如有必要，通知支付平台和用户

### 3.9 常见证书问题排查

#### Q1: 证书加载失败

```plaintext
错误信息: Error: error:0906D06C:PEM routines:PEM_read_bio:no start line
```

**原因**：证书文件格式不正确或文件损坏

**解决方案**：
1. 确认证书文件是 PEM 格式
2. 检查文件是否包含完整的 `-----BEGIN CERTIFICATE-----` 和 `-----END CERTIFICATE-----`
3. 重新从商户平台下载证书

#### Q2: 签名验证失败

```plaintext
错误信息: signature verification failed
```

**原因**：使用了错误的密钥或证书不匹配

**解决方案**：
1. 确认私钥和证书是配对的
2. 确认使用的是正确环境的证书（沙箱/生产）
3. 检查签名算法是否正确（RSA2/SHA256）

#### Q3: 证书过期

```plaintext
错误信息: certificate has expired
```

**原因**：证书已过有效期

**解决方案**：
1. 登录商户平台申请新证书
2. 下载并替换旧证书
3. 重启应用服务

#### Q4: 权限不足

```plaintext
错误信息: EACCES: permission denied
```

**原因**：应用进程没有读取证书文件的权限

**解决方案**：
1. 检查证书文件权限：`ls -la backend/certs/`
2. 确保运行应用的用户有读取权限
3. 使用 `chmod 600` 设置正确权限

---

## 四、沙箱测试指南

### 4.1 微信支付沙箱环境

#### 4.1.1 获取沙箱密钥

微信支付沙箱需要通过API获取专用的沙箱密钥：

```javascript
// 获取沙箱密钥示例
const crypto = require('crypto');
const axios = require('axios');

async function getSandboxSignKey(mchId, apiKey) {
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const signStr = `mch_id=${mchId}&nonce_str=${nonceStr}&key=${apiKey}`;
  const sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  
  const xml = `<xml>
    <mch_id>${mchId}</mch_id>
    <nonce_str>${nonceStr}</nonce_str>
    <sign>${sign}</sign>
  </xml>`;
  
  const response = await axios.post(
    'https://api.mch.weixin.qq.com/sandboxnew/pay/getsignkey',
    xml,
    { headers: { 'Content-Type': 'text/xml' } }
  );
  
  // 解析返回的沙箱密钥
  return parseSandboxKey(response.data);
}
```

#### 4.1.2 沙箱环境配置

```env
# 支付环境
PAYMENT_ENV=sandbox

# 微信支付沙箱配置
WECHAT_APP_ID=你的AppID
WECHAT_MCH_ID=你的商户号
WECHAT_API_KEY=沙箱密钥（通过API获取）
WECHAT_SANDBOX=true

# 沙箱回调地址（使用内网穿透）
WECHAT_NOTIFY_URL=https://your-domain.ngrok.io/api/v1/payment/wechat/notify
```

#### 4.1.3 沙箱测试金额规则

| 金额（分） | 测试场景 | 预期结果 |
|-----------|---------|---------|
| 101 | 正常支付 | 支付成功 |
| 102 | 正常支付 | 支付成功 |
| 201 | 异常测试 | 订单不存在 |
| 202 | 异常测试 | 商户订单号重复 |
| 301 | 异常测试 | 余额不足 |
| 302 | 异常测试 | 银行系统异常 |

#### 4.1.4 内网穿透配置

推荐使用 ngrok 进行内网穿透测试：

```bash
# 安装 ngrok
npm install -g ngrok

# 启动内网穿透
ngrok http 8080

# 获取公网URL，配置到 WECHAT_NOTIFY_URL
```

### 4.2 支付宝沙箱环境

#### 4.2.1 进入沙箱环境

1. 登录 [支付宝开放平台](https://open.alipay.com/)
2. 点击右上角「沙箱」进入沙箱环境
3. 获取沙箱应用信息

#### 4.2.2 沙箱配置参数

| 参数 | 获取位置 |
|-----|---------|
| 沙箱AppID | 沙箱应用 → 基本信息 |
| 沙箱网关 | https://openapi.alipaydev.com/gateway.do |
| 沙箱私钥 | 沙箱应用 → 开发设置 |
| 沙箱公钥 | 沙箱应用 → 开发设置 |

#### 4.2.3 沙箱环境配置

```env
# 支付环境
PAYMENT_ENV=sandbox

# 支付宝沙箱配置
ALIPAY_APP_ID=沙箱AppID
ALIPAY_PRIVATE_KEY=沙箱应用私钥
ALIPAY_PUBLIC_KEY=沙箱支付宝公钥

# 重要：使用沙箱网关
ALIPAY_GATEWAY=https://openapi.alipaydev.com/gateway.do

# 沙箱回调地址
ALIPAY_NOTIFY_URL=https://your-domain.ngrok.io/api/v1/payment/alipay/notify
ALIPAY_RETURN_URL=http://localhost:3000/vip/payment/success
```

#### 4.2.4 沙箱测试账号

在沙箱环境中获取测试买家账号：

| 信息 | 说明 |
|-----|------|
| 买家账号 | 沙箱环境提供的手机号 |
| 登录密码 | 沙箱环境提供 |
| 支付密码 | 111111（默认） |
| 账户余额 | 可在沙箱环境充值 |

#### 4.2.5 沙箱钱包App

下载「支付宝沙箱版」App进行扫码支付测试：
- 在支付宝开放平台沙箱环境页面下载
- 使用沙箱买家账号登录
- 扫描沙箱环境生成的付款码

### 4.3 测试流程

#### 4.3.1 环境准备

```bash
# 1. 配置沙箱环境变量
cp backend/.env.example backend/.env
# 编辑 .env 文件，配置沙箱参数

# 2. 启动后端服务
cd backend
npm run dev

# 3. 启动前端服务
cd ..
npm run dev

# 4. 启动内网穿透（新终端）
ngrok http 8080
```

#### 4.3.2 支付测试步骤

1. **创建测试订单**
   - 访问 VIP 中心页面
   - 选择测试套餐
   - 选择支付方式

2. **完成支付**
   - 微信：使用微信扫描二维码
   - 支付宝：使用沙箱账号登录支付

3. **验证结果**
   - 检查订单状态更新
   - 检查VIP状态开通
   - 检查回调日志

#### 4.3.3 退款测试步骤

1. 创建并完成支付订单
2. 在订单详情页申请退款
3. 管理员审核通过
4. 验证退款状态和VIP状态

### 4.4 常见问题排查

#### Q1: 回调收不到？

1. 检查内网穿透是否正常运行
2. 检查回调URL配置是否正确
3. 查看 ngrok 控制台（http://127.0.0.1:4040）
4. 检查防火墙设置

#### Q2: 签名验证失败？

1. 确认使用正确的密钥（沙箱/生产）
2. 检查签名算法是否正确
3. 检查参数编码是否正确
4. 查看详细错误日志

#### Q3: 支付宝沙箱支付失败？

1. 确认使用沙箱网关地址
2. 确认使用沙箱应用密钥
3. 确认使用沙箱测试账号
4. 检查账户余额是否充足

---

## 五、生产环境切换清单

完成沙箱测试后，按以下清单切换到生产环境：

### 5.1 配置切换

- [ ] 修改 `PAYMENT_ENV=production`
- [ ] 配置正式商户号和密钥
- [ ] 配置正式证书文件
- [ ] 配置正式回调地址（HTTPS）
- [ ] 配置正式网关地址

### 5.2 安全检查

- [ ] 确认证书文件权限正确
- [ ] 确认密钥未提交到代码仓库
- [ ] 确认日志中无敏感信息
- [ ] 配置IP白名单

### 5.3 功能验证

- [ ] 小额真实支付测试
- [ ] 退款功能测试
- [ ] 回调接收测试
- [ ] 对账功能测试

### 5.4 监控配置

- [ ] 配置支付异常告警
- [ ] 配置对账异常告警
- [ ] 配置日志监控
- [ ] 配置性能监控

---

## 六、附录

### 6.1 微信支付官方文档

- [微信支付商户平台](https://pay.weixin.qq.com/)
- [微信支付开发文档](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)
- [Native支付接入指引](https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_7_0.shtml)
- [H5支付接入指引](https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_6_0.shtml)

### 6.2 支付宝官方文档

- [支付宝开放平台](https://open.alipay.com/)
- [支付宝支付文档](https://opendocs.alipay.com/open/270/105898)
- [电脑网站支付](https://opendocs.alipay.com/open/270/105899)
- [手机网站支付](https://opendocs.alipay.com/open/203/105288)

### 6.3 常用工具

- [支付宝密钥生成工具](https://opendocs.alipay.com/common/02kipk)
- [ngrok内网穿透](https://ngrok.com/)
- [在线RSA密钥生成](https://www.bejson.com/enc/rsa/)

### 6.4 技术支持

- 微信支付技术支持：商户平台 → 帮助中心
- 支付宝技术支持：开放平台 → 帮助中心
- 项目问题反馈：[项目Issue页面]
