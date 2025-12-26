# 沙箱测试指南

## 概述

本文档提供VIP会员支付系统的完整沙箱测试指南，包括微信支付和支付宝支付的沙箱环境配置、测试用例、常见问题排查等内容。

---

## 一、测试环境准备

### 1.1 系统要求

| 组件 | 版本要求 | 说明 |
| ---- | -------- | ---- |
| Node.js | >= 18.0.0 | 后端运行环境 |
| PostgreSQL | >= 14.0 | 数据库 |
| npm/pnpm | 最新版 | 包管理器 |
| ngrok | 最新版 | 内网穿透工具 |

### 1.2 项目启动

```bash
# 1. 克隆项目并安装依赖
git clone <repository-url>
cd project-root

# 2. 安装前端依赖
npm install

# 3. 安装后端依赖
cd backend
npm install

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置沙箱参数

# 5. 初始化数据库
npx prisma db push
npx prisma db seed

# 6. 启动后端服务
npm run dev

# 7. 启动前端服务（新终端）
cd ..
npm run dev
```

### 1.3 内网穿透配置

支付回调需要公网可访问的地址，推荐使用 ngrok：

```bash
# 安装 ngrok（Windows PowerShell）
choco install ngrok

# 或使用 npm 安装
npm install -g ngrok

# 配置 ngrok 账号（可选，免费账号有限制）
ngrok config add-authtoken <your-auth-token>

# 启动内网穿透，映射后端端口
ngrok http 8080

# 输出示例：
# Forwarding  https://abc123.ngrok.io -> http://localhost:8080
```

**重要**：记录 ngrok 生成的 HTTPS 地址，用于配置支付回调URL。

---

## 二、微信支付沙箱测试

### 2.1 沙箱环境说明

微信支付沙箱环境是一个模拟真实支付的测试环境，具有以下特点：

- 使用专用的沙箱密钥（需通过API获取）
- 支付金额有特定规则（用于模拟不同场景）
- 不产生真实资金流动
- 回调机制与生产环境一致

### 2.2 获取沙箱密钥

微信支付沙箱需要通过API获取专用密钥：

```javascript
// backend/scripts/get-wechat-sandbox-key.js
const crypto = require('crypto');
const axios = require('axios');
const xml2js = require('xml2js');

async function getSandboxSignKey(mchId, apiKey) {
  const nonceStr = crypto.randomBytes(16).toString('hex');
  
  // 构建签名字符串
  const signStr = `mch_id=${mchId}&nonce_str=${nonceStr}&key=${apiKey}`;
  const sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  
  // 构建XML请求
  const xml = `<xml>
    <mch_id>${mchId}</mch_id>
    <nonce_str>${nonceStr}</nonce_str>
    <sign>${sign}</sign>
  </xml>`;
  
  try {
    const response = await axios.post(
      'https://api.mch.weixin.qq.com/sandboxnew/pay/getsignkey',
      xml,
      { headers: { 'Content-Type': 'text/xml' } }
    );
    
    // 解析XML响应
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);
    
    if (result.xml.return_code === 'SUCCESS') {
      console.log('沙箱密钥获取成功！');
      console.log('sandbox_signkey:', result.xml.sandbox_signkey);
      return result.xml.sandbox_signkey;
    } else {
      console.error('获取失败:', result.xml.return_msg);
      return null;
    }
  } catch (error) {
    console.error('请求失败:', error.message);
    return null;
  }
}

// 使用示例
// 替换为你的商户号和API密钥
const MCH_ID = 'your_mch_id';
const API_KEY = 'your_api_key';

getSandboxSignKey(MCH_ID, API_KEY);
```

运行脚本获取沙箱密钥：

```bash
cd backend
node scripts/get-wechat-sandbox-key.js
```

### 2.3 环境变量配置

```env
# backend/.env

# 支付环境标识
PAYMENT_ENV=sandbox

# 微信支付配置
WECHAT_APP_ID=your_app_id
WECHAT_MCH_ID=your_mch_id
WECHAT_API_KEY=sandbox_signkey_from_api  # 使用沙箱密钥
WECHAT_API_V3_KEY=your_api_v3_key
WECHAT_CERT_SERIAL_NO=your_cert_serial_no

# 沙箱模式开关
WECHAT_SANDBOX=true

# 回调地址（使用ngrok地址）
WECHAT_NOTIFY_URL=https://your-ngrok-url.ngrok.io/api/v1/payment/wechat/notify

# 证书路径
WECHAT_CERT_PATH=./certs/wechat/apiclient_cert.pem
WECHAT_KEY_PATH=./certs/wechat/apiclient_key.pem
```

### 2.4 沙箱测试金额规则

微信支付沙箱使用特定金额来模拟不同的支付场景：

| 金额（分） | 场景描述 | 预期结果 | 测试目的 |
| ---------- | -------- | -------- | -------- |
| 101 | 正常支付 | 支付成功 | 验证正常支付流程 |
| 102 | 正常支付 | 支付成功 | 验证正常支付流程 |
| 201 | 订单不存在 | 支付失败 | 验证异常处理 |
| 202 | 商户订单号重复 | 支付失败 | 验证幂等性 |
| 301 | 余额不足 | 支付失败 | 验证余额不足处理 |
| 302 | 银行系统异常 | 支付失败 | 验证系统异常处理 |
| 303 | 订单已支付 | 支付失败 | 验证重复支付处理 |
| 401 | 订单已关闭 | 支付失败 | 验证订单状态处理 |

### 2.5 测试用例

#### 测试用例1：正常支付流程

**前置条件**：
- 后端服务已启动
- ngrok 已配置
- 沙箱密钥已获取

**测试步骤**：

1. 访问 VIP 中心页面 `http://localhost:3000/vip`
2. 选择一个 VIP 套餐（确保金额为 1.01 元或 1.02 元）
3. 选择「微信支付」
4. 点击「立即支付」
5. 系统生成支付二维码
6. 使用微信扫描二维码完成支付
7. 等待支付结果

**预期结果**：
- [x] 订单创建成功，状态为「待支付」
- [x] 二维码正常显示
- [x] 支付完成后，订单状态更新为「已支付」
- [x] 用户 VIP 状态开通
- [x] 收到支付成功通知

#### 测试用例2：支付超时取消

**测试步骤**：

1. 创建 VIP 订单
2. 不进行支付，等待 15 分钟
3. 检查订单状态

**预期结果**：
- [x] 订单状态自动更新为「已取消」
- [x] 用户可以重新下单

#### 测试用例3：回调幂等性测试

**测试步骤**：

1. 完成一笔支付
2. 手动触发重复回调（模拟微信重发）
3. 检查订单状态和 VIP 状态

**预期结果**：
- [x] 订单状态保持「已支付」
- [x] VIP 不会重复开通
- [x] 回调记录显示重复处理

---

## 三、支付宝沙箱测试

### 3.1 沙箱环境说明

支付宝沙箱环境特点：

- 独立的沙箱应用和密钥
- 专用的沙箱网关地址
- 提供测试买家账号
- 需要使用「支付宝沙箱版」App

### 3.2 进入沙箱环境

1. 登录 [支付宝开放平台](https://open.alipay.com/)
2. 点击右上角「沙箱」按钮
3. 进入沙箱控制台

### 3.3 获取沙箱配置

在沙箱控制台获取以下信息：

| 配置项 | 获取位置 | 说明 |
| ------ | -------- | ---- |
| 沙箱 AppID | 沙箱应用 → 基本信息 | 2021开头的测试AppID |
| 沙箱网关 | 固定值 | `https://openapi-sandbox.dl.alipaydev.com/gateway.do` |
| 应用私钥 | 沙箱应用 → 开发设置 | 需要自己生成并上传公钥 |
| 支付宝公钥 | 沙箱应用 → 开发设置 | 上传公钥后获取 |

### 3.4 配置沙箱密钥

#### 步骤1：生成密钥对

使用支付宝密钥工具或 OpenSSL：

```bash
# 使用 OpenSSL 生成密钥
openssl genrsa -out sandbox_private_key.pem 2048
openssl rsa -in sandbox_private_key.pem -pubout -out sandbox_public_key.pem

# 查看公钥内容（去除头尾后上传到支付宝）
cat sandbox_public_key.pem
```

#### 步骤2：上传公钥

1. 在沙箱控制台，点击「开发设置」
2. 找到「接口加签方式」，点击「设置」
3. 选择「公钥」模式
4. 粘贴公钥内容（去除 `-----BEGIN PUBLIC KEY-----` 等头尾）
5. 保存后获取支付宝公钥

### 3.5 环境变量配置

```env
# backend/.env

# 支付环境标识
PAYMENT_ENV=sandbox

# 支付宝沙箱配置
ALIPAY_APP_ID=2021000000000000  # 沙箱AppID
ALIPAY_PRIVATE_KEY=MIIEvgIBADANBg...  # 应用私钥（单行，去除头尾）
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhk...   # 支付宝公钥（单行，去除头尾）

# 沙箱网关（重要！）
ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do

# 回调地址
ALIPAY_NOTIFY_URL=https://your-ngrok-url.ngrok.io/api/v1/payment/alipay/notify
ALIPAY_RETURN_URL=http://localhost:3000/vip/payment/success
```

### 3.6 沙箱测试账号

在沙箱控制台获取测试买家账号：

| 信息 | 说明 |
| ---- | ---- |
| 买家账号 | 沙箱提供的手机号（如 `jfjbwb4477@sandbox.com`） |
| 登录密码 | 沙箱提供（如 `111111`） |
| 支付密码 | 默认 `111111` |
| 账户余额 | 可在沙箱环境充值（默认有余额） |

### 3.7 沙箱钱包 App

下载「支付宝沙箱版」App 进行扫码支付测试：

1. 在沙箱控制台页面找到「沙箱工具」
2. 扫描二维码下载沙箱版 App
3. 使用沙箱买家账号登录
4. 用于扫描支付二维码

### 3.8 测试用例

#### 测试用例1：PC 网站支付

**测试步骤**：

1. 访问 VIP 中心页面
2. 选择 VIP 套餐
3. 选择「支付宝支付」
4. 点击「立即支付」
5. 页面跳转到支付宝收银台
6. 使用沙箱买家账号登录
7. 输入支付密码完成支付
8. 页面跳转回商户网站

**预期结果**：
- [x] 正确跳转到支付宝沙箱收银台
- [x] 显示正确的订单金额和商品信息
- [x] 支付成功后正确跳转回商户页面
- [x] 订单状态更新为「已支付」
- [x] VIP 状态正确开通

#### 测试用例2：手机网站支付（H5）

**测试步骤**：

1. 使用手机浏览器访问 VIP 中心页面
2. 选择 VIP 套餐和支付宝支付
3. 点击支付，跳转到支付宝 H5 页面
4. 完成支付

**预期结果**：
- [x] 正确跳转到支付宝 H5 支付页面
- [x] 支付完成后正确返回

#### 测试用例3：异步回调验证

**测试步骤**：

1. 完成一笔支付
2. 检查后端日志，确认收到异步回调
3. 验证签名验证逻辑

**预期结果**：
- [x] 收到支付宝异步回调通知
- [x] 签名验证通过
- [x] 订单状态正确更新

---

## 四、积分兑换测试

### 4.1 测试准备

确保测试用户有足够的积分：

```sql
-- 为测试用户添加积分
UPDATE users SET points = 5000 WHERE user_id = 'test-user-id';
```

### 4.2 测试用例

#### 测试用例1：正常积分兑换

**测试步骤**：

1. 登录测试账号（积分 >= 1000）
2. 访问 VIP 中心页面
3. 选择「积分兑换」支付方式
4. 选择兑换时长（1个月）
5. 确认兑换

**预期结果**：
- [x] 积分正确扣除（1000积分/月）
- [x] VIP 状态开通
- [x] 兑换记录正确保存

#### 测试用例2：积分不足

**测试步骤**：

1. 登录测试账号（积分 < 1000）
2. 尝试积分兑换

**预期结果**：
- [x] 显示「积分不足」提示
- [x] 无法进行兑换

#### 测试用例3：每月兑换限制

**测试步骤**：

1. 完成一次积分兑换
2. 同月内再次尝试兑换

**预期结果**：
- [x] 显示「本月已兑换」提示
- [x] 无法重复兑换

---

## 五、退款流程测试

### 5.1 退款条件

- 月度/季度/年度 VIP（非终身）
- 购买后 7 天内
- 未下载任何资源

### 5.2 测试用例

#### 测试用例1：符合条件的退款

**测试步骤**：

1. 购买月度 VIP
2. 不下载任何资源
3. 在 7 天内申请退款
4. 管理员审核通过

**预期结果**：
- [x] 退款申请创建成功
- [x] 管理员可以看到退款申请
- [x] 审核通过后，退款接口被调用
- [x] VIP 状态被取消

#### 测试用例2：不符合条件的退款

**测试步骤**：

1. 购买 VIP 后下载资源
2. 尝试申请退款

**预期结果**：
- [x] 显示「不符合退款条件」提示
- [x] 无法提交退款申请

---

## 六、对账功能测试

### 6.1 手动触发对账

```bash
# 调用对账 API（需要管理员权限）
curl -X POST http://localhost:8080/api/v1/admin/reconciliation/run \
  -H "Authorization: Bearer <admin-token>"
```

### 6.2 测试场景

#### 场景1：回调丢失的订单

**模拟步骤**：

1. 创建订单并完成支付
2. 手动将订单状态改回「待支付」（模拟回调丢失）
3. 等待对账任务执行（或手动触发）

**预期结果**：
- [x] 对账任务检测到状态不一致
- [x] 调用支付平台查询接口
- [x] 订单状态同步为「已支付」
- [x] VIP 状态正确开通

#### 场景2：超时未支付订单

**模拟步骤**：

1. 创建订单但不支付
2. 等待 15 分钟以上
3. 检查对账结果

**预期结果**：
- [x] 订单状态更新为「已取消」

---

## 七、安全功能测试

### 7.1 二次验证测试

**测试步骤**：

1. 选择金额 >= 200 元的套餐
2. 发起支付
3. 系统要求输入验证码
4. 输入正确/错误验证码

**预期结果**：
- [x] 金额 >= 200 元时触发二次验证
- [x] 验证码发送成功
- [x] 正确验证码可以继续支付
- [x] 错误验证码被拒绝

### 7.2 支付限制测试

**测试步骤**：

1. 同一账号在 1 小时内创建 6 个未支付订单
2. 尝试创建第 7 个订单

**预期结果**：
- [x] 第 6 个订单后触发支付限制
- [x] 显示「支付功能已被限制」提示
- [x] 安全日志记录异常行为

### 7.3 设备限制测试

**测试步骤**：

1. 使用同一 VIP 账号在 4 台设备登录
2. 检查设备列表

**预期结果**：
- [x] 最多保留 3 台设备
- [x] 最早登录的设备被踢出
- [x] 被踢出设备收到提示

---

## 八、常见问题排查

### 8.1 回调收不到

**排查步骤**：

1. 检查 ngrok 是否正常运行
   ```bash
   # 查看 ngrok 状态
   curl http://127.0.0.1:4040/api/tunnels
   ```

2. 检查回调 URL 配置
   ```bash
   # 确认环境变量
   echo $WECHAT_NOTIFY_URL
   echo $ALIPAY_NOTIFY_URL
   ```

3. 查看 ngrok 请求日志
   - 访问 `http://127.0.0.1:4040`
   - 查看是否有回调请求

4. 检查后端日志
   ```bash
   # 查看后端日志
   tail -f backend/logs/combined.log
   ```

### 8.2 签名验证失败

**排查步骤**：

1. 确认使用正确的密钥
   - 沙箱环境使用沙箱密钥
   - 生产环境使用生产密钥

2. 检查签名算法
   - 微信支付：MD5 或 HMAC-SHA256
   - 支付宝：RSA2

3. 检查参数编码
   - 确保 UTF-8 编码
   - 检查特殊字符处理

4. 查看详细错误日志
   ```javascript
   // 在签名验证处添加日志
   console.log('待签名字符串:', signStr);
   console.log('计算签名:', calculatedSign);
   console.log('接收签名:', receivedSign);
   ```

### 8.3 支付宝沙箱支付失败

**常见原因**：

1. **网关地址错误**
   - 确认使用沙箱网关：`https://openapi-sandbox.dl.alipaydev.com/gateway.do`

2. **密钥不匹配**
   - 确认使用沙箱应用的密钥

3. **账号问题**
   - 确认使用沙箱测试买家账号
   - 检查账户余额

4. **App 版本问题**
   - 确认使用「支付宝沙箱版」App

### 8.4 订单状态不更新

**排查步骤**：

1. 检查回调是否收到
2. 检查签名验证是否通过
3. 检查数据库事务是否提交
4. 检查是否有异常被捕获但未处理

```javascript
// 添加详细日志
try {
  await updateOrderStatus(orderNo, 'PAID');
  console.log('订单状态更新成功:', orderNo);
} catch (error) {
  console.error('订单状态更新失败:', error);
  throw error;
}
```

---

## 九、测试报告模板

### 9.1 测试概要

| 项目 | 内容 |
| ---- | ---- |
| 测试日期 | YYYY-MM-DD |
| 测试环境 | 沙箱环境 |
| 测试人员 | XXX |
| 测试版本 | v1.0.0 |

### 9.2 测试结果汇总

| 测试模块 | 用例数 | 通过 | 失败 | 阻塞 | 通过率 |
| -------- | ------ | ---- | ---- | ---- | ------ |
| 微信支付 | 5 | 5 | 0 | 0 | 100% |
| 支付宝支付 | 5 | 5 | 0 | 0 | 100% |
| 积分兑换 | 3 | 3 | 0 | 0 | 100% |
| 退款流程 | 2 | 2 | 0 | 0 | 100% |
| 对账功能 | 2 | 2 | 0 | 0 | 100% |
| 安全功能 | 3 | 3 | 0 | 0 | 100% |
| **总计** | **20** | **20** | **0** | **0** | **100%** |

### 9.3 问题记录

| 问题ID | 描述 | 严重程度 | 状态 | 备注 |
| ------ | ---- | -------- | ---- | ---- |
| - | - | - | - | - |

### 9.4 测试结论

- [ ] 所有核心功能测试通过
- [ ] 异常场景处理正确
- [ ] 安全功能验证通过
- [ ] 可以进入生产环境测试

---

## 十、生产环境切换

完成沙箱测试后，按以下步骤切换到生产环境：

### 10.1 配置变更

```env
# 修改环境标识
PAYMENT_ENV=production

# 微信支付 - 使用生产密钥
WECHAT_API_KEY=your_production_api_key
WECHAT_SANDBOX=false

# 支付宝 - 使用生产网关
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
ALIPAY_APP_ID=your_production_app_id
ALIPAY_PRIVATE_KEY=your_production_private_key
ALIPAY_PUBLIC_KEY=your_production_public_key

# 回调地址 - 使用正式域名
WECHAT_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/wechat/notify
ALIPAY_NOTIFY_URL=https://api.yourdomain.com/api/v1/payment/alipay/notify
ALIPAY_RETURN_URL=https://www.yourdomain.com/vip/payment/success
```

### 10.2 生产环境检查清单

- [ ] 使用生产环境密钥和证书
- [ ] 回调地址使用 HTTPS
- [ ] 配置 IP 白名单
- [ ] 日志级别调整为 INFO
- [ ] 敏感信息脱敏
- [ ] 监控告警配置
- [ ] 小额真实支付测试

---

## 附录

### A. 相关文档

- [微信支付沙箱文档](https://pay.weixin.qq.com/wiki/doc/api/native.php?chapter=23_1)
- [支付宝沙箱文档](https://opendocs.alipay.com/common/02kkv7)
- [ngrok 官方文档](https://ngrok.com/docs)

### B. 联系方式

如有问题，请联系：
- 技术支持：[项目 Issue 页面]
- 微信支付技术支持：商户平台 → 帮助中心
- 支付宝技术支持：开放平台 → 帮助中心
