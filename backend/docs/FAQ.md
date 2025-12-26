# VIP会员支付系统常见问题FAQ

本文档汇总了VIP会员支付系统在开发、部署和运维过程中的常见问题及解决方案。

## 目录

1. [支付相关问题](#支付相关问题)
2. [VIP权益问题](#vip权益问题)
3. [订单管理问题](#订单管理问题)
4. [退款相关问题](#退款相关问题)
5. [积分兑换问题](#积分兑换问题)
6. [配置与部署问题](#配置与部署问题)
7. [安全相关问题](#安全相关问题)
8. [前端展示问题](#前端展示问题)
9. [定时任务问题](#定时任务问题)
10. [故障排查指南](#故障排查指南)

---

## 支付相关问题

### Q1: 微信支付二维码无法生成怎么办？

**可能原因**:
1. 微信支付配置不完整
2. 商户证书配置错误
3. 网络连接问题
4. 商户号未开通Native支付权限

**排查步骤**:

```bash
# 1. 检查环境变量配置
cat backend/.env | grep WECHAT

# 2. 检查证书文件是否存在
ls -la backend/certs/wechat/

# 3. 验证证书有效期
openssl x509 -in backend/certs/wechat/apiclient_cert.pem -noout -dates

# 4. 测试网络连接
curl -I https://api.mch.weixin.qq.com
```

**解决方案**:
- 确保 `WECHAT_APP_ID`、`WECHAT_MCH_ID`、`WECHAT_PAY_API_KEY_V3` 配置正确
- 确保证书文件路径正确且文件存在
- 检查商户平台是否开通了Native支付权限

---

### Q2: 支付宝支付跳转失败怎么办？

**可能原因**:
1. 支付宝应用未上线
2. RSA2密钥配置错误
3. 回调地址配置不正确
4. 应用签名方式不匹配

**排查步骤**:

```bash
# 1. 检查支付宝配置
cat backend/.env | grep ALIPAY

# 2. 验证私钥格式
# 私钥应为PKCS8格式，不包含头尾标记
```

**解决方案**:
- 确保应用已在支付宝开放平台上线
- 使用支付宝密钥生成工具重新生成RSA2密钥
- 确保 `ALIPAY_NOTIFY_URL` 和 `ALIPAY_RETURN_URL` 配置正确

---

### Q3: 支付回调收不到怎么办？

**可能原因**:
1. 回调URL不可访问
2. 服务器防火墙阻止
3. HTTPS证书问题
4. 域名未备案

**排查步骤**:

```bash
# 1. 测试回调URL是否可访问
curl -X POST https://your-domain.com/api/v1/payment/wechat/notify

# 2. 检查服务器日志
tail -f backend/logs/combined.log | grep "payment.*notify"

# 3. 检查防火墙规则
# 确保443端口开放
```

**解决方案**:
- 确保回调URL使用HTTPS协议
- 在支付平台配置回调白名单
- 使用内网穿透工具（如ngrok）进行本地测试

---

### Q4: 支付成功但订单状态未更新怎么办？

**可能原因**:
1. 回调签名验证失败
2. 回调处理逻辑异常
3. 数据库更新失败
4. 回调被重复处理

**排查步骤**:

```sql
-- 1. 查询订单状态
SELECT order_no, payment_status, transaction_id, updated_at
FROM orders
WHERE order_no = 'VIP20251226xxx';

-- 2. 查询回调记录
SELECT * FROM payment_callbacks
WHERE order_no = 'VIP20251226xxx'
ORDER BY created_at DESC;
```

**解决方案**:
- 检查回调日志中的签名验证结果
- 手动触发订单对账
- 必要时手动更新订单状态

---

### Q5: 如何在本地测试支付功能？

**解决方案**:

1. **使用沙箱环境**:
```bash
# 设置环境变量
PAYMENT_ENV=sandbox
```

2. **使用内网穿透**:
```bash
# 安装ngrok
npm install -g ngrok

# 启动内网穿透
ngrok http 8080

# 将生成的HTTPS地址配置为回调URL
```

3. **使用支付平台沙箱账号**:
- 微信支付：使用沙箱密钥
- 支付宝：使用沙箱应用和测试账号

---

### Q6: 支付金额≥200元需要二次验证，如何配置？

**配置方法**:

```bash
# 在.env文件中设置阈值（单位：分）
SECONDARY_AUTH_THRESHOLD=20000  # 200元 = 20000分

# 设置为0可禁用二次验证（不推荐）
SECONDARY_AUTH_THRESHOLD=0
```

**工作流程**:
1. 用户选择套餐并发起支付
2. 系统检测订单金额是否≥阈值
3. 如果需要二次验证，弹出验证码输入框
4. 用户输入手机验证码
5. 验证通过后继续支付流程

---

## VIP权益问题

### Q7: 用户购买VIP后权益未生效怎么办？

**排查步骤**:

```sql
-- 1. 检查订单状态
SELECT order_no, payment_status, paid_at
FROM orders
WHERE user_id = 'user_xxx' AND payment_status = 1
ORDER BY created_at DESC;

-- 2. 检查用户VIP状态
SELECT user_id, vip_level, vip_expire_at, is_lifetime_vip
FROM users
WHERE user_id = 'user_xxx';
```

**解决方案**:
- 如果订单已支付但VIP未开通，手动执行VIP开通
- 检查VIP开通逻辑是否有异常
- 查看错误日志定位问题

---

### Q8: VIP到期后如何处理？

**系统自动处理**:
1. VIP到期前3天、1天、当天发送站内信提醒
2. VIP到期后7天内显示灰色VIP图标（宽限期）
3. 超过7天后隐藏VIP图标
4. 下载权限立即失效

**配置项**:
```bash
VIP_GRACE_PERIOD_DAYS=7  # 宽限期天数
```

---

### Q9: 终身会员如何判断？

**判断逻辑**:

```typescript
// 终身会员判断
const isLifetime = user.is_lifetime_vip === true;

// 终身会员特点
// 1. vip_expire_at 为 null
// 2. is_lifetime_vip 为 true
// 3. 不显示到期时间
// 4. 不支持退款
```

**数据库查询**:
```sql
SELECT user_id, username, is_lifetime_vip
FROM users
WHERE is_lifetime_vip = true;
```

---

### Q10: VIP用户每日下载次数如何统计？

**统计规则**:
- VIP用户每日上限：50次
- 普通用户每日免费下载：2次
- 统计周期：自然日（00:00-23:59）
- 每日0点自动重置

**查询当日下载次数**:
```sql
SELECT 
  user_id,
  stat_date,
  vip_download_count,
  free_download_count
FROM user_download_stats
WHERE user_id = 'user_xxx'
  AND stat_date = CURRENT_DATE;
```

---

## 订单管理问题

### Q11: 订单超时时间如何配置？

**配置方法**:
```bash
# 在.env文件中设置（单位：分钟）
ORDER_TIMEOUT_MINUTES=15
```

**工作流程**:
1. 订单创建时记录过期时间
2. 定时任务每分钟检查超时订单
3. 超时订单自动取消

---

### Q12: 如何查询用户的订单历史？

**API接口**:
```http
GET /api/v1/vip/orders?page=1&pageSize=20&status=all
Authorization: Bearer {token}
```

**数据库查询**:
```sql
SELECT 
  o.order_no,
  o.amount,
  o.payment_status,
  o.payment_method,
  o.created_at,
  vp.name as package_name
FROM orders o
JOIN vip_orders vo ON o.order_id = vo.order_id
JOIN vip_packages vp ON vo.package_id = vp.package_id
WHERE o.user_id = 'user_xxx'
ORDER BY o.created_at DESC;
```

---

### Q13: 订单状态有哪些？

| 状态码 | 状态名称 | 说明 |
|--------|----------|------|
| 0 | 待支付 | 订单已创建，等待支付 |
| 1 | 已支付 | 支付成功，VIP已开通 |
| 2 | 已退款 | 退款成功 |
| 3 | 已取消 | 用户取消或超时取消 |
| 4 | 退款处理中 | 退款申请已通过，正在处理 |

---

### Q14: 如何处理重复支付？

**系统处理机制**:
1. 支付回调幂等处理：检查订单是否已处理
2. 如果订单已支付，直接返回成功响应
3. 记录重复回调日志

**人工处理**:
如果确实发生重复扣款：
1. 核实支付平台交易记录
2. 确认重复扣款金额
3. 发起退款处理

---

## 退款相关问题

### Q15: 退款条件是什么？

**可退款条件**（需同时满足）:
1. 套餐类型：月度/季度/年度VIP（终身会员不可退）
2. 购买时间：7天内
3. 使用情况：未下载任何资源
4. 订单状态：已支付
5. 退款历史：无进行中的退款申请

---

### Q16: 退款多久到账？

| 支付渠道 | 到账时间 |
|----------|----------|
| 微信支付 | 1-3个工作日 |
| 支付宝 | 即时到账或1-3个工作日 |

**注意**：退款原路返回至支付账户

---

### Q17: 退款失败怎么办？

**常见失败原因**:
1. 商户账户余额不足
2. 原支付订单不存在
3. 退款金额超过可退金额
4. 网络超时

**处理方法**:
1. 检查商户账户余额
2. 核实原支付订单
3. 重新发起退款
4. 必要时联系支付平台客服

---

### Q18: 如何查看退款进度？

**用户端**:
- 在"我的订单"页面查看订单状态
- 退款状态会显示在订单详情中

**管理端**:
```sql
SELECT 
  rr.refund_id,
  rr.status,
  rr.refund_amount,
  rr.created_at,
  rr.refunded_at,
  o.order_no
FROM refund_requests rr
JOIN orders o ON rr.order_id = o.order_id
WHERE rr.user_id = 'user_xxx'
ORDER BY rr.created_at DESC;
```

---

## 积分兑换问题

### Q19: 积分兑换VIP的规则是什么？

**兑换规则**:
- 兑换比例：1000积分 = 1个月VIP
- 每月限制：每用户每月最多兑换1次
- 最大时长：单次最多兑换3个月
- 不可退款：积分兑换的VIP不支持退款

**配置项**:
```bash
POINTS_PER_VIP_MONTH=1000  # 每月VIP所需积分
MAX_EXCHANGE_MONTHS=3       # 单次最大兑换月数
```

---

### Q20: 积分不足时如何提示用户？

**前端展示**:
- 积分兑换选项置灰
- 显示"积分不足，还需X积分"
- 提供积分获取入口链接

**API响应**:
```json
{
  "code": 400,
  "message": "积分不足，还需500积分",
  "data": {
    "currentPoints": 500,
    "requiredPoints": 1000,
    "shortfall": 500
  }
}
```

---

### Q21: 本月已兑换过如何处理？

**系统行为**:
- 积分兑换选项置灰
- 显示"本月已兑换，下月再来"
- 显示下次可兑换时间

**查询本月兑换记录**:
```sql
SELECT * FROM points_vip_exchanges
WHERE user_id = 'user_xxx'
  AND exchange_month = DATE_TRUNC('month', CURRENT_DATE);
```

---

## 配置与部署问题

### Q22: 如何切换沙箱/生产环境？

**环境切换**:
```bash
# 沙箱环境
PAYMENT_ENV=sandbox

# 生产环境
PAYMENT_ENV=production
```

**注意事项**:
- 切换到生产环境前确保所有配置完整
- 沙箱环境订单会添加"测试订单"标识
- 前端在沙箱环境显示"测试环境"水印

---

### Q23: 证书文件放在哪里？

**目录结构**:
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

**权限设置**:
```bash
chmod 600 backend/certs/wechat/*.pem
```

---

### Q24: 如何验证配置是否正确？

**启动时验证**:
系统启动时会自动验证支付配置，验证失败会输出警告。

**手动验证**:
```bash
cd backend
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

### Q25: 必须配置哪些环境变量？

**生产环境必填项**:

| 变量名 | 说明 |
|--------|------|
| `PAYMENT_ENV` | 支付环境（production） |
| `WECHAT_APP_ID` | 微信AppID |
| `WECHAT_MCH_ID` | 微信商户号 |
| `WECHAT_PAY_API_KEY_V3` | 微信API V3密钥 |
| `WECHAT_NOTIFY_URL` | 微信回调地址 |
| `ALIPAY_APP_ID` | 支付宝AppID |
| `ALIPAY_PRIVATE_KEY` | 支付宝私钥 |
| `ALIPAY_PUBLIC_KEY` | 支付宝公钥 |
| `ALIPAY_NOTIFY_URL` | 支付宝回调地址 |

---

## 安全相关问题

### Q26: 如何防止恶意刷单？

**系统防护措施**:
1. 同一账号1小时内最多5个未支付订单
2. 可疑IP检测和记录
3. 支付行为日志记录
4. 异常告警通知

**配置项**:
```bash
MAX_UNPAID_ORDERS_PER_HOUR=5
```

---

### Q27: 多设备登录如何限制？

**限制规则**:
- VIP账号最多同时在3台设备登录
- 超出限制时踢出最早登录的设备
- 被踢出设备收到提示通知

**配置项**:
```bash
MAX_DEVICES_PER_USER=3
```

**查询用户设备**:
```sql
SELECT * FROM device_sessions
WHERE user_id = 'user_xxx'
  AND is_active = true
ORDER BY last_active_at DESC;
```

---

### Q28: 支付密钥如何安全存储？

**最佳实践**:
1. 使用环境变量存储，不硬编码
2. 证书文件设置600权限
3. 不将密钥提交到代码仓库
4. 定期更换密钥
5. 日志中脱敏处理

**`.gitignore`配置**:
```
backend/certs/
backend/.env
```

---

### Q29: 如何处理签名验证失败？

**排查步骤**:
1. 检查证书是否过期
2. 检查密钥配置是否正确
3. 检查签名算法是否匹配
4. 检查是否存在中间人攻击

**处理方法**:
- 更新证书配置
- 重新生成密钥
- 检查网络安全

---

## 前端展示问题

### Q30: VIP图标样式规范是什么？

**图标规格**:
- 金色VIP图标：直径24px，有效VIP
- 灰色VIP图标：直径24px，透明度50%，宽限期
- 终身标签：红色背景白色文字，字体12px

**展示位置**:
- 用户头像旁
- 评论区
- 个人主页
- 个人中心顶部

---

### Q31: 支付成功后如何跳转？

**跳转逻辑**:
1. 从资源详情页来：显示"返回继续下载"按钮
2. 从个人中心来：显示"返回个人中心"按钮
3. 直接访问VIP中心：显示"浏览更多资源"按钮

**实现方式**:
- 创建订单时记录来源URL
- 支付成功后根据来源显示对应按钮

---

### Q32: 移动端适配注意事项？

**适配要点**:
1. VIP图标缩放至20px
2. 支付弹窗全屏显示
3. 二维码适配屏幕宽度
4. 按钮大小适合触摸操作
5. 表单输入框适配软键盘

---

## 定时任务问题

### Q33: 有哪些定时任务？

| 任务 | 执行频率 | 说明 |
|------|----------|------|
| 订单对账 | 每5分钟 | 同步支付平台订单状态 |
| VIP到期提醒 | 每天9:00 | 发送VIP到期提醒通知 |
| 订单超时取消 | 每分钟 | 取消超时未支付订单 |

---

### Q34: 如何手动触发对账？

**方法1：API触发**
```bash
curl -X POST "https://api.example.com/api/v1/admin/reconciliation/manual" \
  -H "Authorization: Bearer <admin_token>"
```

**方法2：代码触发**
```typescript
import { triggerReconciliation } from './src/tasks/reconciliation.js';
await triggerReconciliation();
```

---

### Q35: 定时任务执行失败怎么办？

**排查步骤**:
1. 检查任务日志
2. 检查数据库连接
3. 检查支付平台接口状态
4. 检查服务器资源

**日志查看**:
```bash
grep "定时任务" backend/logs/combined.log | tail -50
```

---

## 故障排查指南

### Q36: 系统启动失败怎么办？

**常见原因**:
1. 数据库连接失败
2. 环境变量缺失
3. 依赖包未安装
4. 端口被占用

**排查命令**:
```bash
# 检查数据库连接
npx prisma db push --preview-feature

# 检查环境变量
cat .env

# 检查依赖
npm install

# 检查端口
netstat -ano | findstr :8080
```

---

### Q37: 如何查看系统日志？

**日志位置**:
```
backend/logs/
├── combined.log    # 所有日志
├── error.log       # 错误日志
```

**实时查看**:
```bash
# 查看所有日志
tail -f backend/logs/combined.log

# 只看错误
tail -f backend/logs/error.log

# 过滤支付相关
tail -f backend/logs/combined.log | grep payment
```

---

### Q38: 数据库查询慢怎么优化？

**优化建议**:
1. 确保索引已创建
2. 避免全表扫描
3. 使用分页查询
4. 定期清理历史数据

**检查索引**:
```sql
-- 查看表索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'orders';
```

---

### Q39: 如何备份重要数据？

**备份命令**:
```bash
# 备份整个数据库
pg_dump -h localhost -U postgres -d startide_design > backup_$(date +%Y%m%d).sql

# 备份特定表
pg_dump -h localhost -U postgres -d startide_design -t orders -t users > backup_orders_users.sql
```

**恢复命令**:
```bash
psql -h localhost -U postgres -d startide_design < backup_20251226.sql
```

---

### Q40: 遇到未知问题如何处理？

**处理步骤**:
1. 收集错误信息（日志、截图、复现步骤）
2. 查看相关文档
3. 搜索错误信息
4. 检查最近的代码变更
5. 联系技术支持

**信息收集模板**:
```
问题描述：
复现步骤：
1. ...
2. ...
3. ...
错误信息：
相关日志：
环境信息：
- 操作系统：
- Node版本：
- 数据库版本：
```

---

## 相关文档

- [环境变量配置指南](./ENV_CONFIGURATION_GUIDE.md)
- [证书部署指南](./CERTIFICATE_DEPLOYMENT_GUIDE.md)
- [支付API文档](./API_PAYMENT.md)
- [退款处理流程](./REFUND_PROCESSING_GUIDE.md)
- [对账异常处理](./RECONCILIATION_EXCEPTION_HANDLING.md)
- [定时任务配置](./SCHEDULED_TASKS_GUIDE.md)
- [安全审计报告](./SECURITY_AUDIT_REPORT.md)
- [商户申请指南](./MERCHANT_APPLICATION_GUIDE.md)
- [沙箱测试指南](./SANDBOX_TESTING_GUIDE.md)

---

*文档版本: 1.0.0*
*最后更新: 2025-12-26*
*维护人员: Kiro AI*
