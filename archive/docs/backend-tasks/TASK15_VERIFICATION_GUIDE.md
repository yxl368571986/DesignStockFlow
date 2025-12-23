# 任务15: 支付API验证指南

## 快速验证步骤

### 前置条件
1. 确保PostgreSQL数据库正在运行
2. 确保后端服务已启动（`npm run dev`）
3. 确保已有测试用户账号

### 方法1: 使用自动化测试脚本（推荐）

```bash
# 进入backend目录
cd backend

# 运行测试脚本
npx ts-node src/test-payment-api.ts
```

测试脚本会自动执行以下测试：
1. 用户登录
2. 创建VIP订单
3. 创建积分充值订单
4. 查询订单状态
5. 模拟微信支付回调
6. 模拟支付宝支付回调
7. 验证VIP已开通
8. 验证积分已充值

### 方法2: 使用Postman/Apifox手动测试

#### 步骤1: 用户登录
```
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "password123"
}
```

保存返回的`token`，后续请求需要使用。

#### 步骤2: 创建VIP订单
```
POST http://localhost:3000/api/v1/payment/orders
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "orderType": "vip",
  "productType": "vip_month",
  "paymentMethod": "wechat"
}
```

保存返回的`orderNo`。

#### 步骤3: 查询订单状态
```
GET http://localhost:3000/api/v1/payment/orders/{orderNo}
Authorization: Bearer {your_token}
```

#### 步骤4: 模拟微信支付回调
```
POST http://localhost:3000/api/v1/payment/wechat/callback
Content-Type: application/json

{
  "orderNo": "{your_orderNo}",
  "transactionId": "WX1234567890",
  "signature": "mock_signature"
}
```

#### 步骤5: 验证VIP已开通
```
GET http://localhost:3000/api/v1/vip/my-info
Authorization: Bearer {your_token}
```

检查返回的`isVip`是否为`true`，`vipLevel`是否为`1`。

#### 步骤6: 创建积分充值订单
```
POST http://localhost:3000/api/v1/payment/orders
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "orderType": "points",
  "productType": "points_500",
  "paymentMethod": "alipay"
}
```

保存返回的`orderNo`。

#### 步骤7: 模拟支付宝支付回调
```
POST http://localhost:3000/api/v1/payment/alipay/callback
Content-Type: application/json

{
  "orderNo": "{your_orderNo}",
  "transactionId": "ALI1234567890",
  "signature": "mock_signature"
}
```

#### 步骤8: 验证积分已充值
```
GET http://localhost:3000/api/v1/points/my-info
Authorization: Bearer {your_token}
```

检查`pointsBalance`是否增加了500积分。

## 验证清单

### 功能验证
- [ ] 可以成功创建VIP订单
- [ ] 可以成功创建积分充值订单
- [ ] 订单号格式正确（ORDER + 时间戳 + 随机数）
- [ ] 返回的金额正确
- [ ] 返回了支付二维码（base64格式）

### 订单状态验证
- [ ] 新创建的订单状态为0（待支付）
- [ ] 可以查询订单状态
- [ ] 订单信息完整（订单号、金额、状态、支付时间）

### 支付回调验证
- [ ] 微信支付回调处理成功
- [ ] 支付宝支付回调处理成功
- [ ] 回调后订单状态更新为1（已支付）
- [ ] 记录了交易号
- [ ] 记录了支付时间

### VIP开通验证
- [ ] VIP订单支付后自动开通VIP
- [ ] VIP等级设置为1
- [ ] VIP到期时间正确（当前时间 + 套餐天数）
- [ ] 如果已是VIP，在原有基础上延长

### 积分充值验证
- [ ] 积分订单支付后自动充值积分
- [ ] 积分余额增加正确
- [ ] 累计积分增加正确
- [ ] 记录了积分明细

### 超时处理验证
- [ ] 定时任务正常启动
- [ ] 30分钟后未支付的订单自动取消
- [ ] 取消的订单状态更新为2（已取消）

### 错误处理验证
- [ ] 订单类型错误时返回400错误
- [ ] 支付方式错误时返回400错误
- [ ] 产品类型不存在时返回错误
- [ ] 查询不存在的订单返回错误
- [ ] 未登录时返回401错误

## 数据库验证

### 查询订单表
```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
```

检查：
- 订单记录是否正确创建
- 订单号是否唯一
- 订单金额是否正确
- 支付状态是否正确更新

### 查询用户VIP信息
```sql
SELECT user_id, vip_level, vip_expire_at FROM users WHERE phone = '13800138000';
```

检查：
- VIP等级是否为1
- VIP到期时间是否正确

### 查询用户积分信息
```sql
SELECT user_id, points_balance, points_total FROM users WHERE phone = '13800138000';
```

检查：
- 积分余额是否增加
- 累计积分是否增加

### 查询积分明细
```sql
SELECT * FROM points_records WHERE user_id = (
  SELECT user_id FROM users WHERE phone = '13800138000'
) ORDER BY created_at DESC LIMIT 10;
```

检查：
- 是否有充值记录
- 积分变动是否正确
- 来源是否为'points_recharge'

## 常见问题

### 1. 创建订单失败
**可能原因**：
- Token无效或过期
- VIP套餐不存在或已下架
- 参数格式错误

**解决方法**：
- 重新登录获取新Token
- 检查数据库中VIP套餐是否存在且status=1
- 检查请求参数格式

### 2. 支付回调失败
**可能原因**：
- 订单号不存在
- 订单已支付
- 签名验证失败（当前为模拟实现，应该不会失败）

**解决方法**：
- 检查订单号是否正确
- 查询订单状态确认是否已支付
- 检查回调参数是否完整

### 3. VIP未开通
**可能原因**：
- 支付回调未成功
- VIP套餐信息错误
- 数据库更新失败

**解决方法**：
- 检查订单支付状态
- 检查VIP套餐配置
- 查看后端日志

### 4. 积分未充值
**可能原因**：
- 支付回调未成功
- 积分套餐映射错误
- 数据库更新失败

**解决方法**：
- 检查订单支付状态
- 检查积分套餐配置
- 查看后端日志

## 性能测试

### 并发订单创建测试
使用工具（如Apache Bench或JMeter）测试并发创建订单：

```bash
# 使用ab测试（需要先安装Apache Bench）
ab -n 100 -c 10 -H "Authorization: Bearer {token}" \
   -p order.json -T application/json \
   http://localhost:3000/api/v1/payment/orders
```

检查：
- 订单号是否唯一
- 是否有并发冲突
- 响应时间是否合理

## 日志检查

查看后端日志，确认：
- [ ] 订单创建日志
- [ ] 支付回调日志
- [ ] VIP开通日志
- [ ] 积分充值日志
- [ ] 定时任务日志
- [ ] 错误日志（如果有）

## 下一步

验证完成后，可以继续：
1. 集成真实的支付SDK
2. 实现订单管理功能
3. 实现退款功能
4. 添加支付通知功能
5. 实现对账功能

---

**验证完成后请在任务文档中标记为已完成** ✅
