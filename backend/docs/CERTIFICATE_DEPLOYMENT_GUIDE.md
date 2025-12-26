# 支付证书部署指南

本文档详细说明VIP会员支付系统中微信支付和支付宝支付证书的部署方法、安全配置和常见问题解决方案。

## 目录

1. [概述](#概述)
2. [证书目录结构](#证书目录结构)
3. [微信支付证书部署](#微信支付证书部署)
4. [支付宝证书部署](#支付宝证书部署)
5. [证书安全配置](#证书安全配置)
6. [环境变量配置](#环境变量配置)
7. [证书验证](#证书验证)
8. [证书更新与轮换](#证书更新与轮换)
9. [常见问题](#常见问题)
10. [附录](#附录)

---

## 概述

支付证书是保障支付安全的核心组件，用于：
- **请求签名**：证明请求来自合法商户
- **响应验签**：验证支付平台响应的真实性
- **数据加密**：保护敏感支付数据

### 证书类型说明

| 支付渠道 | 证书类型 | 用途 | 有效期 |
|---------|---------|------|--------|
| 微信支付 | 商户API证书 | 敏感操作身份验证 | 5年 |
| 微信支付 | 商户API私钥 | 请求签名 | 与证书相同 |
| 微信支付 | 平台证书 | 验证微信支付响应 | 定期更新 |
| 支付宝 | 应用私钥 | 请求签名 | 永久 |
| 支付宝 | 应用公钥证书 | 证书模式签名 | 5年 |
| 支付宝 | 支付宝公钥证书 | 验证支付宝响应 | 定期更新 |
| 支付宝 | 支付宝根证书 | 证书链验证 | 长期有效 |

---

## 证书目录结构

### 标准目录布局

```
backend/
├── certs/                          # 证书根目录
│   ├── wechat/                     # 微信支付证书目录
│   │   ├── apiclient_cert.pem      # 商户API证书
│   │   ├── apiclient_key.pem       # 商户API私钥
│   │   └── wechatpay_cert.pem      # 微信支付平台证书
│   └── alipay/                     # 支付宝证书目录
│       ├── app_private_key.pem     # 应用私钥（公钥模式）
│       ├── appCertPublicKey.crt    # 应用公钥证书（证书模式）
│       ├── alipayCertPublicKey.crt # 支付宝公钥证书（证书模式）
│       └── alipayRootCert.crt      # 支付宝根证书（证书模式）
└── .env                            # 环境变量配置
```

### 创建证书目录

```bash
# 进入后端目录
cd backend

# 创建证书目录结构
mkdir -p certs/wechat
mkdir -p certs/alipay

# 设置目录权限（Linux/Mac）
chmod 700 certs
chmod 700 certs/wechat
chmod 700 certs/alipay
```

```powershell
# Windows PowerShell
cd backend
New-Item -ItemType Directory -Force -Path certs\wechat
New-Item -ItemType Directory -Force -Path certs\alipay
```

---

## 微信支付证书部署

### 3.1 证书获取

#### 步骤一：登录商户平台

1. 访问 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 使用管理员账号登录
3. 进入「账户中心」→「API安全」

#### 步骤二：申请API证书

1. 在「API证书」区域，点击「申请证书」
2. 按照指引完成证书申请：
   - 下载证书工具
   - 生成证书请求文件
   - 上传请求文件
   - 下载证书

#### 步骤三：下载证书文件

申请成功后，下载证书压缩包，包含以下文件：

| 文件名 | 说明 | 部署位置 |
|-------|------|---------|
| `apiclient_cert.pem` | 商户API证书 | `certs/wechat/` |
| `apiclient_key.pem` | 商户API私钥 | `certs/wechat/` |
| `apiclient_cert.p12` | PKCS12格式证书（备用） | 可选保留 |

#### 步骤四：获取平台证书

微信支付平台证书需要通过API获取：

```bash
# 使用微信支付官方工具下载平台证书
# 详见：https://github.com/wechatpay-apiv3/CertificateDownloader

java -jar CertificateDownloader.jar \
  -k ${apiV3key} \
  -m ${mchId} \
  -f ${privateKeyFilePath} \
  -s ${mchSerialNo} \
  -o ${outputFilePath}
```

或者使用Node.js脚本：

```javascript
// scripts/download-wechat-cert.js
const WxPay = require('wechatpay-node-v3');
const fs = require('fs');

async function downloadPlatformCert() {
  const pay = new WxPay({
    appid: process.env.WECHAT_APP_ID,
    mchid: process.env.WECHAT_MCH_ID,
    publicKey: fs.readFileSync('./certs/wechat/apiclient_cert.pem'),
    privateKey: fs.readFileSync('./certs/wechat/apiclient_key.pem'),
  });
  
  const result = await pay.get_certificates();
  // 保存平台证书
  fs.writeFileSync('./certs/wechat/wechatpay_cert.pem', result.data[0].encrypt_certificate);
}

downloadPlatformCert();
```

### 3.2 证书部署

#### 复制证书文件

```bash
# Linux/Mac
cp /path/to/downloaded/apiclient_cert.pem ./certs/wechat/
cp /path/to/downloaded/apiclient_key.pem ./certs/wechat/
cp /path/to/downloaded/wechatpay_cert.pem ./certs/wechat/

# 设置文件权限
chmod 600 ./certs/wechat/*.pem
```

```powershell
# Windows PowerShell
Copy-Item "C:\path\to\downloaded\apiclient_cert.pem" -Destination ".\certs\wechat\"
Copy-Item "C:\path\to\downloaded\apiclient_key.pem" -Destination ".\certs\wechat\"
Copy-Item "C:\path\to\downloaded\wechatpay_cert.pem" -Destination ".\certs\wechat\"
```

#### 获取证书序列号

证书序列号可以通过以下方式获取：

**方式一：商户平台查看**
1. 登录微信支付商户平台
2. 进入「账户中心」→「API安全」→「API证书」
3. 查看证书序列号

**方式二：使用OpenSSL命令**

```bash
# 查看证书序列号
openssl x509 -in ./certs/wechat/apiclient_cert.pem -noout -serial

# 输出示例：serial=1234567890ABCDEF1234567890ABCDEF12345678
```

**方式三：使用Node.js脚本**

```javascript
const fs = require('fs');
const crypto = require('crypto');

const cert = fs.readFileSync('./certs/wechat/apiclient_cert.pem');
const x509 = new crypto.X509Certificate(cert);
console.log('证书序列号:', x509.serialNumber);
```

### 3.3 环境变量配置

```env
# 微信支付证书配置
WECHAT_CERT_PATH=./certs/wechat/apiclient_cert.pem
WECHAT_KEY_PATH=./certs/wechat/apiclient_key.pem
WECHAT_PAY_PLATFORM_CERT_PATH=./certs/wechat/wechatpay_cert.pem
WECHAT_PAY_CERT_SERIAL_NO=你的证书序列号
```

---

## 支付宝证书部署

支付宝支持两种加签方式：**公钥模式**和**证书模式**。生产环境推荐使用证书模式。

### 4.1 公钥模式部署

公钥模式配置简单，适合开发测试环境。

#### 步骤一：生成密钥对

**使用支付宝密钥工具（推荐）**

1. 下载 [支付宝开放平台密钥工具](https://opendocs.alipay.com/common/02kipk)
2. 打开工具，选择「生成密钥」
3. 选择密钥格式：RSA2（2048位）
4. 选择密钥类型：PKCS8（Java适用）
5. 点击「生成密钥」
6. 保存生成的文件

**使用OpenSSL命令行**

```bash
# 生成RSA私钥
openssl genrsa -out app_private_key_pkcs1.pem 2048

# 转换为PKCS8格式
openssl pkcs8 -topk8 -inform PEM -in app_private_key_pkcs1.pem \
  -outform PEM -nocrypt -out app_private_key.pem

# 生成公钥
openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem
```

#### 步骤二：上传公钥到支付宝

1. 登录 [支付宝开放平台](https://open.alipay.com/)
2. 进入应用详情 →「开发设置」→「接口加签方式」
3. 选择「公钥」模式
4. 上传应用公钥内容
5. 保存后获取「支付宝公钥」

#### 步骤三：部署私钥文件

```bash
# 复制私钥到证书目录
cp /path/to/app_private_key.pem ./certs/alipay/

# 设置文件权限
chmod 600 ./certs/alipay/app_private_key.pem
```

#### 步骤四：环境变量配置

```env
# 支付宝公钥模式配置
ALIPAY_APP_ID=你的AppID
ALIPAY_PRIVATE_KEY=MIIEvgIBADANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...（私钥内容，去除头尾和换行）
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...（支付宝公钥，去除头尾和换行）
```

> **注意**：环境变量中的密钥需要去除 `-----BEGIN/END PRIVATE KEY-----` 头尾标记和所有换行符。

### 4.2 证书模式部署（推荐）

证书模式安全性更高，推荐生产环境使用。

#### 步骤一：生成CSR文件

1. 使用支付宝密钥工具
2. 选择「生成密钥」→「公钥证书」
3. 填写证书信息（组织名称、部门等）
4. 生成以下文件：
   - `应用私钥.txt` - 应用私钥
   - `CSR文件.csr` - 证书签名请求

#### 步骤二：申请证书

1. 登录支付宝开放平台
2. 进入应用详情 →「开发设置」→「接口加签方式」
3. 选择「公钥证书」模式
4. 上传CSR文件
5. 下载三个证书文件：
   - `appCertPublicKey_应用APPID.crt` - 应用公钥证书
   - `alipayCertPublicKey_RSA2.crt` - 支付宝公钥证书
   - `alipayRootCert.crt` - 支付宝根证书

#### 步骤三：部署证书文件

```bash
# 复制证书文件到证书目录
cp /path/to/app_private_key.pem ./certs/alipay/
cp /path/to/appCertPublicKey_*.crt ./certs/alipay/appCertPublicKey.crt
cp /path/to/alipayCertPublicKey_RSA2.crt ./certs/alipay/alipayCertPublicKey.crt
cp /path/to/alipayRootCert.crt ./certs/alipay/

# 设置文件权限
chmod 600 ./certs/alipay/*.pem
chmod 600 ./certs/alipay/*.crt
```

#### 步骤四：环境变量配置

```env
# 支付宝证书模式配置
ALIPAY_APP_ID=你的AppID
ALIPAY_PRIVATE_KEY_PATH=./certs/alipay/app_private_key.pem
ALIPAY_APP_CERT_PATH=./certs/alipay/appCertPublicKey.crt
ALIPAY_ALIPAY_CERT_PATH=./certs/alipay/alipayCertPublicKey.crt
ALIPAY_ROOT_CERT_PATH=./certs/alipay/alipayRootCert.crt
```

---

## 证书安全配置

### 5.1 文件权限设置

确保证书文件只有应用进程可以读取：

```bash
# Linux/Mac 权限设置
# 目录权限：仅所有者可读写执行
chmod 700 ./certs
chmod 700 ./certs/wechat
chmod 700 ./certs/alipay

# 文件权限：仅所有者可读写
chmod 600 ./certs/wechat/*.pem
chmod 600 ./certs/alipay/*.pem
chmod 600 ./certs/alipay/*.crt

# 验证权限
ls -la ./certs/wechat/
# 应显示：-rw------- 1 user group ... apiclient_key.pem
```

### 5.2 Git忽略配置

确保证书文件不会被提交到代码仓库：

```gitignore
# backend/.gitignore

# 支付证书 - 绝对不能提交到代码仓库
certs/
*.pem
*.key
*.crt
*.p12
*.pfx

# 环境变量文件
.env
.env.local
.env.*.local
```

### 5.3 生产环境安全建议

| 安全措施 | 说明 | 优先级 |
|---------|------|--------|
| 文件权限 | 设置600权限，仅应用进程可读 | 必须 |
| Git忽略 | 确保证书不提交到代码仓库 | 必须 |
| 环境变量 | 敏感配置使用环境变量 | 必须 |
| 密钥管理服务 | 使用AWS KMS、HashiCorp Vault等 | 推荐 |
| 定期轮换 | 定期更新证书和密钥 | 推荐 |
| 访问审计 | 记录证书文件访问日志 | 可选 |
| 备份加密 | 证书备份时进行加密 | 推荐 |

### 5.4 Docker部署安全配置

使用Docker部署时，推荐使用Docker Secrets或挂载卷：

**方式一：使用Docker Secrets（推荐）**

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    image: your-backend-image
    secrets:
      - wechat_cert
      - wechat_key
      - alipay_private_key
    environment:
      - WECHAT_CERT_PATH=/run/secrets/wechat_cert
      - WECHAT_KEY_PATH=/run/secrets/wechat_key

secrets:
  wechat_cert:
    file: ./certs/wechat/apiclient_cert.pem
  wechat_key:
    file: ./certs/wechat/apiclient_key.pem
  alipay_private_key:
    file: ./certs/alipay/app_private_key.pem
```

**方式二：使用挂载卷**

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    image: your-backend-image
    volumes:
      - ./certs:/app/certs:ro  # 只读挂载
    environment:
      - WECHAT_CERT_PATH=/app/certs/wechat/apiclient_cert.pem
      - WECHAT_KEY_PATH=/app/certs/wechat/apiclient_key.pem
```

---

## 环境变量配置

### 6.1 完整配置示例

```env
# ============================================
# 支付证书配置
# ============================================

# 支付环境：sandbox（沙箱）或 production（生产）
PAYMENT_ENV=production

# ============================================
# 微信支付证书配置
# ============================================

# 微信支付基础配置
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_MCH_ID=1234567890
WECHAT_PAY_API_KEY_V3=your-32-character-api-v3-key-here

# 微信支付证书路径
WECHAT_CERT_PATH=./certs/wechat/apiclient_cert.pem
WECHAT_KEY_PATH=./certs/wechat/apiclient_key.pem
WECHAT_PAY_PLATFORM_CERT_PATH=./certs/wechat/wechatpay_cert.pem

# 微信支付证书序列号
WECHAT_PAY_CERT_SERIAL_NO=1234567890ABCDEF1234567890ABCDEF12345678

# 微信支付回调地址
WECHAT_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/wechat/notify

# ============================================
# 支付宝证书配置（公钥模式）
# ============================================

ALIPAY_APP_ID=2021001234567890
ALIPAY_PRIVATE_KEY=MIIEvgIBADANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...

# ============================================
# 支付宝证书配置（证书模式，推荐）
# ============================================

# ALIPAY_APP_ID=2021001234567890
# ALIPAY_PRIVATE_KEY_PATH=./certs/alipay/app_private_key.pem
# ALIPAY_APP_CERT_PATH=./certs/alipay/appCertPublicKey.crt
# ALIPAY_ALIPAY_CERT_PATH=./certs/alipay/alipayCertPublicKey.crt
# ALIPAY_ROOT_CERT_PATH=./certs/alipay/alipayRootCert.crt

# 支付宝回调地址
ALIPAY_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/alipay/notify
ALIPAY_RETURN_URL=https://www.yourdomain.com/payment/success
```

### 6.2 路径配置说明

| 配置项 | 默认值 | 说明 |
|-------|--------|------|
| `WECHAT_CERT_PATH` | `./certs/wechat/apiclient_cert.pem` | 微信商户证书路径 |
| `WECHAT_KEY_PATH` | `./certs/wechat/apiclient_key.pem` | 微信商户私钥路径 |
| `WECHAT_PAY_PLATFORM_CERT_PATH` | `./certs/wechat/wechatpay_cert.pem` | 微信平台证书路径 |

路径支持以下格式：
- **相对路径**：相对于后端项目根目录，如 `./certs/wechat/apiclient_key.pem`
- **绝对路径**：完整文件系统路径，如 `/etc/payment/certs/wechat/apiclient_key.pem`

---

## 证书验证

### 7.1 验证证书文件完整性

```bash
# 验证微信支付证书
openssl x509 -in ./certs/wechat/apiclient_cert.pem -noout -text

# 验证微信支付私钥
openssl rsa -in ./certs/wechat/apiclient_key.pem -check

# 验证证书和私钥是否匹配
openssl x509 -noout -modulus -in ./certs/wechat/apiclient_cert.pem | openssl md5
openssl rsa -noout -modulus -in ./certs/wechat/apiclient_key.pem | openssl md5
# 两个命令输出的MD5值应该相同
```

### 7.2 验证证书有效期

```bash
# 查看微信支付证书有效期
openssl x509 -in ./certs/wechat/apiclient_cert.pem -noout -dates

# 输出示例：
# notBefore=Jan  1 00:00:00 2024 GMT
# notAfter=Jan  1 00:00:00 2029 GMT

# 查看支付宝证书有效期
openssl x509 -in ./certs/alipay/appCertPublicKey.crt -noout -dates
```

### 7.3 应用启动验证

系统启动时会自动验证证书配置，可以通过以下方式手动验证：

```bash
# 进入后端目录
cd backend

# 运行证书验证脚本
npx ts-node -e "
const fs = require('fs');
const path = require('path');

// 检查微信支付证书
const wechatCerts = [
  './certs/wechat/apiclient_cert.pem',
  './certs/wechat/apiclient_key.pem',
  './certs/wechat/wechatpay_cert.pem'
];

console.log('=== 微信支付证书检查 ===');
wechatCerts.forEach(certPath => {
  const exists = fs.existsSync(certPath);
  console.log(\`\${certPath}: \${exists ? '✓ 存在' : '✗ 不存在'}\`);
});

// 检查支付宝证书
const alipayCerts = [
  './certs/alipay/app_private_key.pem',
  './certs/alipay/appCertPublicKey.crt',
  './certs/alipay/alipayCertPublicKey.crt',
  './certs/alipay/alipayRootCert.crt'
];

console.log('\n=== 支付宝证书检查 ===');
alipayCerts.forEach(certPath => {
  const exists = fs.existsSync(certPath);
  console.log(\`\${certPath}: \${exists ? '✓ 存在' : '✗ 不存在'}\`);
});
"
```

### 7.4 支付功能测试

部署证书后，建议进行以下测试：

1. **沙箱环境测试**
   - 创建测试订单
   - 完成支付流程
   - 验证回调接收

2. **生产环境小额测试**
   - 使用最小金额进行真实支付
   - 验证订单状态更新
   - 测试退款功能

---

## 证书更新与轮换

### 8.1 微信支付证书更新

微信支付证书有效期为5年，到期前需要更新：

#### 更新步骤

1. **申请新证书**
   - 登录微信支付商户平台
   - 进入「账户中心」→「API安全」
   - 点击「更新证书」

2. **下载新证书**
   - 下载新的证书文件
   - 记录新的证书序列号

3. **部署新证书**
   ```bash
   # 备份旧证书
   mv ./certs/wechat/apiclient_cert.pem ./certs/wechat/apiclient_cert.pem.bak
   mv ./certs/wechat/apiclient_key.pem ./certs/wechat/apiclient_key.pem.bak
   
   # 部署新证书
   cp /path/to/new/apiclient_cert.pem ./certs/wechat/
   cp /path/to/new/apiclient_key.pem ./certs/wechat/
   chmod 600 ./certs/wechat/*.pem
   ```

4. **更新环境变量**
   ```env
   WECHAT_PAY_CERT_SERIAL_NO=新的证书序列号
   ```

5. **重启服务**
   ```bash
   pm2 restart backend
   # 或
   systemctl restart backend
   ```

6. **验证功能**
   - 进行小额支付测试
   - 确认支付功能正常

### 8.2 支付宝证书更新

支付宝证书更新流程：

1. **生成新密钥对**
   - 使用支付宝密钥工具生成新的密钥对
   - 保存新的私钥文件

2. **更新开放平台配置**
   - 登录支付宝开放平台
   - 进入应用详情 →「开发设置」
   - 更新接口加签方式

3. **下载新证书**
   - 下载新的应用公钥证书
   - 下载新的支付宝公钥证书

4. **部署新证书**
   ```bash
   # 备份旧证书
   cp -r ./certs/alipay ./certs/alipay.bak
   
   # 部署新证书
   cp /path/to/new/app_private_key.pem ./certs/alipay/
   cp /path/to/new/appCertPublicKey.crt ./certs/alipay/
   cp /path/to/new/alipayCertPublicKey.crt ./certs/alipay/
   chmod 600 ./certs/alipay/*
   ```

5. **重启服务并验证**

### 8.3 证书到期提醒

建议设置证书到期提醒，可以使用以下脚本定期检查：

```bash
#!/bin/bash
# scripts/check-cert-expiry.sh

# 检查微信支付证书
WECHAT_CERT="./certs/wechat/apiclient_cert.pem"
if [ -f "$WECHAT_CERT" ]; then
  EXPIRY=$(openssl x509 -enddate -noout -in "$WECHAT_CERT" | cut -d= -f2)
  EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
  NOW_EPOCH=$(date +%s)
  DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
  
  if [ $DAYS_LEFT -lt 30 ]; then
    echo "警告：微信支付证书将在 $DAYS_LEFT 天后过期！"
  else
    echo "微信支付证书：剩余 $DAYS_LEFT 天"
  fi
fi

# 检查支付宝证书
ALIPAY_CERT="./certs/alipay/appCertPublicKey.crt"
if [ -f "$ALIPAY_CERT" ]; then
  EXPIRY=$(openssl x509 -enddate -noout -in "$ALIPAY_CERT" | cut -d= -f2)
  EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
  NOW_EPOCH=$(date +%s)
  DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
  
  if [ $DAYS_LEFT -lt 30 ]; then
    echo "警告：支付宝证书将在 $DAYS_LEFT 天后过期！"
  else
    echo "支付宝证书：剩余 $DAYS_LEFT 天"
  fi
fi
```

---

## 常见问题

### Q1: 证书文件找不到

**错误信息**：
```
Error: ENOENT: no such file or directory, open './certs/wechat/apiclient_key.pem'
```

**解决方案**：
1. 确认证书文件已复制到正确位置
2. 检查环境变量中的路径配置
3. 确认应用工作目录正确

```bash
# 检查当前工作目录
pwd

# 检查证书文件是否存在
ls -la ./certs/wechat/
```

### Q2: 证书权限不足

**错误信息**：
```
Error: EACCES: permission denied, open './certs/wechat/apiclient_key.pem'
```

**解决方案**：
```bash
# 检查文件权限
ls -la ./certs/wechat/

# 修复权限
chmod 600 ./certs/wechat/*.pem
chown $(whoami) ./certs/wechat/*.pem
```

### Q3: 证书格式错误

**错误信息**：
```
Error: error:0906D06C:PEM routines:PEM_read_bio:no start line
```

**解决方案**：
1. 确认证书文件格式正确（PEM格式）
2. 检查文件是否被损坏
3. 重新下载证书文件

```bash
# 验证证书格式
openssl x509 -in ./certs/wechat/apiclient_cert.pem -noout -text
```

### Q4: 证书和私钥不匹配

**错误信息**：
```
Error: key values mismatch
```

**解决方案**：
```bash
# 验证证书和私钥是否匹配
openssl x509 -noout -modulus -in ./certs/wechat/apiclient_cert.pem | openssl md5
openssl rsa -noout -modulus -in ./certs/wechat/apiclient_key.pem | openssl md5

# 两个命令输出的MD5值应该相同
# 如果不同，需要重新下载匹配的证书和私钥
```

### Q5: 签名验证失败

**错误信息**：
```
签名验证失败 / Signature verification failed
```

**解决方案**：
1. 确认使用正确的证书（沙箱/生产环境）
2. 检查证书序列号是否正确
3. 确认平台证书是最新的

```bash
# 重新下载微信支付平台证书
# 参考 3.1 节的平台证书获取方法
```

### Q6: Windows环境路径问题

**错误信息**：
```
Error: ENOENT: no such file or directory
```

**解决方案**：
Windows环境下路径分隔符可能导致问题：

```env
# 使用正斜杠（推荐）
WECHAT_KEY_PATH=./certs/wechat/apiclient_key.pem

# 或使用双反斜杠
WECHAT_KEY_PATH=.\\certs\\wechat\\apiclient_key.pem
```

### Q7: Docker容器中证书不可用

**解决方案**：
1. 确认证书已正确挂载到容器
2. 检查容器内路径配置

```bash
# 进入容器检查
docker exec -it backend sh
ls -la /app/certs/wechat/
```

---

## 附录

### A.1 证书文件格式说明

| 格式 | 扩展名 | 说明 |
|-----|--------|------|
| PEM | `.pem`, `.crt`, `.cer` | Base64编码，最常用 |
| DER | `.der`, `.cer` | 二进制格式 |
| PKCS12 | `.p12`, `.pfx` | 包含证书和私钥 |
| PKCS8 | `.pem` | 私钥格式（Java常用） |

### A.2 格式转换命令

```bash
# PEM转DER
openssl x509 -in cert.pem -outform DER -out cert.der

# DER转PEM
openssl x509 -in cert.der -inform DER -outform PEM -out cert.pem

# PKCS12提取证书
openssl pkcs12 -in cert.p12 -clcerts -nokeys -out cert.pem

# PKCS12提取私钥
openssl pkcs12 -in cert.p12 -nocerts -nodes -out key.pem

# PKCS1转PKCS8
openssl pkcs8 -topk8 -inform PEM -in key_pkcs1.pem -outform PEM -nocrypt -out key_pkcs8.pem
```

### A.3 证书信息查看命令

```bash
# 查看证书详细信息
openssl x509 -in cert.pem -noout -text

# 查看证书主题
openssl x509 -in cert.pem -noout -subject

# 查看证书颁发者
openssl x509 -in cert.pem -noout -issuer

# 查看证书有效期
openssl x509 -in cert.pem -noout -dates

# 查看证书序列号
openssl x509 -in cert.pem -noout -serial

# 查看证书指纹
openssl x509 -in cert.pem -noout -fingerprint -sha256
```

### A.4 快速部署检查清单

部署证书前，请确认以下事项：

**微信支付**
- [ ] 已下载商户API证书（apiclient_cert.pem）
- [ ] 已下载商户API私钥（apiclient_key.pem）
- [ ] 已获取平台证书（wechatpay_cert.pem）
- [ ] 已记录证书序列号
- [ ] 证书文件已复制到 `certs/wechat/` 目录
- [ ] 已设置正确的文件权限（600）
- [ ] 已配置环境变量

**支付宝**
- [ ] 已生成应用私钥
- [ ] 已在开放平台配置公钥/证书
- [ ] 已下载支付宝公钥/证书（证书模式）
- [ ] 证书文件已复制到 `certs/alipay/` 目录
- [ ] 已设置正确的文件权限（600）
- [ ] 已配置环境变量

**安全检查**
- [ ] 证书目录已添加到 .gitignore
- [ ] 证书文件权限设置正确
- [ ] 环境变量中无硬编码密钥
- [ ] 日志中无敏感信息输出

---

## 相关文档

- [环境变量配置指南](./ENV_CONFIGURATION_GUIDE.md)
- [商户申请指南](./MERCHANT_APPLICATION_GUIDE.md)
- [沙箱测试指南](./SANDBOX_TESTING_GUIDE.md)
- [支付API文档](./API_PAYMENT.md)
- [安全审计报告](./SECURITY_AUDIT_REPORT.md)

---

*文档版本: 1.0.0*
*最后更新: 2025-12-26*
