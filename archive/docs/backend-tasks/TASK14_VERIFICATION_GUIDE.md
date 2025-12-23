# 任务14：积分管理API - 验证指南

## 🎯 验证目标

验证积分管理系统的所有功能是否正常工作，包括用户积分查询、积分获取、积分消耗、积分商城、每日任务、用户等级系统以及管理员积分管理功能。

## 📋 前置条件

1. **数据库已初始化**
   - 确保PostgreSQL服务正在运行
   - 确保已执行数据库迁移和种子数据

2. **后端服务已启动**
   ```bash
   cd backend
   npm run dev
   ```

3. **测试账号**
   - 普通用户: 13800138001 / 123456
   - 管理员: 13900000000 / admin123

## 🧪 验证步骤

### 步骤1: 运行自动化测试脚本

```bash
cd backend
npx tsx src/test-points-api.ts
```

**预期结果:**
- ✅ 所有测试用例通过
- ✅ 能够成功登录
- ✅ 能够获取积分信息
- ✅ 能够查看积分明细
- ✅ 能够进行签到
- ✅ 能够查看任务列表
- ✅ 能够查看商品列表
- ✅ 管理员能够访问管理接口

### 步骤2: 手动验证用户积分功能

#### 2.1 获取用户积分信息

**请求:**
```bash
curl -X GET http://localhost:3000/api/v1/points/my-info \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期响应:**
```json
{
  "code": 200,
  "message": "获取积分信息成功",
  "data": {
    "pointsBalance": 0,
    "pointsTotal": 0,
    "userLevel": 1,
    "levelName": "LV1 新手",
    "levelDiscount": 0,
    "levelPrivileges": ["基础功能"],
    "nextLevelPoints": 500,
    "nextLevelName": "LV2 初级"
  }
}
```

#### 2.2 每日签到

**请求:**
```bash
curl -X POST http://localhost:3000/api/v1/points/signin \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**预期响应:**
```json
{
  "code": 200,
  "message": "签到成功",
  "data": {
    "taskName": "每日签到",
    "completedCount": 1,
    "targetCount": 1,
    "isCompleted": true,
    "pointsRewarded": 10
  }
}
```

**验证点:**
- ✅ 签到成功后积分增加10
- ✅ 再次签到提示"今日已签到"
- ✅ 积分明细中有签到记录

#### 2.3 获取每日任务列表

**请求:**
```bash
curl -X GET http://localhost:3000/api/v1/points/daily-tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期响应:**
```json
{
  "code": 200,
  "message": "获取任务列表成功",
  "data": {
    "tasks": [
      {
        "taskId": "...",
        "taskName": "每日签到",
        "taskCode": "daily_signin",
        "pointsReward": 10,
        "targetCount": 1,
        "completedCount": 1,
        "isCompleted": true
      }
    ],
    "allCompleted": false,
    "completedCount": 1,
    "totalCount": 5,
    "bonusPoints": 0
  }
}
```

**验证点:**
- ✅ 显示所有启用的任务
- ✅ 显示任务完成进度
- ✅ 已完成的任务标记为完成

#### 2.4 获取积分明细

**请求:**
```bash
curl -X GET "http://localhost:3000/api/v1/points/records?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期响应:**
```json
{
  "code": 200,
  "message": "获取积分明细成功",
  "data": {
    "records": [
      {
        "recordId": "...",
        "pointsChange": 10,
        "pointsBalance": 10,
        "changeType": "earn",
        "source": "daily_signin",
        "description": "每日签到",
        "createdAt": "2024-12-21T..."
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    },
    "statistics": {
      "totalEarned": 10,
      "totalConsumed": 0,
      "currentBalance": 10
    }
  }
}
```

**验证点:**
- ✅ 显示所有积分变动记录
- ✅ 统计数据正确
- ✅ 分页功能正常

#### 2.5 获取积分商品列表

**请求:**
```bash
curl -X GET http://localhost:3000/api/v1/points/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期响应:**
```json
{
  "code": 200,
  "message": "获取商品列表成功",
  "data": [
    {
      "productId": "...",
      "productName": "VIP月卡",
      "productType": "vip",
      "productCode": "vip_month_points",
      "pointsRequired": 1000,
      "productValue": { "days": 30 },
      "stock": -1,
      "description": "使用1000积分兑换VIP月卡"
    }
  ]
}
```

**验证点:**
- ✅ 显示所有上架商品
- ✅ 商品信息完整
- ✅ 按排序值排序

#### 2.6 获取充值套餐

**请求:**
```bash
curl -X GET http://localhost:3000/api/v1/points/recharge-packages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期响应:**
```json
{
  "code": 200,
  "message": "获取充值套餐成功",
  "data": [
    {
      "packageCode": "points_100",
      "points": 100,
      "price": 10.00,
      "originalPrice": 10.00,
      "discount": 1.0,
      "description": "100积分"
    }
  ]
}
```

**验证点:**
- ✅ 显示所有充值套餐
- ✅ 价格和折扣正确

### 步骤3: 验证积分消耗功能

#### 3.1 模拟下载资源消耗积分

这个功能需要在资源下载接口中集成，可以通过以下方式验证：

1. 确保用户有足够积分（通过签到或管理员调整）
2. 下载一个普通资源
3. 检查积分是否减少10分（或根据等级折扣计算）
4. 检查积分明细中有消耗记录

**验证点:**
- ✅ VIP用户下载不消耗积分
- ✅ 普通用户下载消耗积分
- ✅ 用户等级折扣生效
- ✅ 积分不足时阻止下载

### 步骤4: 验证用户等级系统

#### 4.1 测试等级计算

1. 通过管理员接口给用户增加积分
2. 观察用户等级是否自动提升
3. 检查等级特权是否解锁

**测试场景:**
- 0积分 → LV1 新手
- 500积分 → LV2 初级（下载-5%）
- 2000积分 → LV3 中级（下载-10%）
- 5000积分 → LV4 高级（下载-15%）
- 10000积分 → LV5 专家（下载-20%）
- 20000积分 → LV6 大师（下载-30%）

**验证点:**
- ✅ 等级自动计算正确
- ✅ 等级提升时有日志输出
- ✅ 等级特权正确显示
- ✅ 下载折扣正确应用

### 步骤5: 验证管理员功能

#### 5.1 获取积分规则

**请求:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/points/rules \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**预期响应:**
```json
{
  "code": 200,
  "message": "获取积分规则成功",
  "data": [
    {
      "ruleId": "...",
      "ruleName": "上传作品审核通过",
      "ruleCode": "upload_approved",
      "ruleType": "earn",
      "pointsValue": 50,
      "description": "上传作品审核通过奖励50积分",
      "isEnabled": true
    }
  ]
}
```

**验证点:**
- ✅ 显示所有积分规则
- ✅ 规则信息完整

#### 5.2 更新积分规则

**请求:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/points/rules/RULE_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pointsValue": 60,
    "description": "上传作品审核通过奖励60积分"
  }'
```

**验证点:**
- ✅ 规则更新成功
- ✅ 新规则立即生效

#### 5.3 获取积分统计

**请求:**
```bash
curl -X GET http://localhost:3000/api/v1/admin/points/statistics \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**预期响应:**
```json
{
  "code": 200,
  "message": "获取积分统计成功",
  "data": {
    "totalEarned": 1000,
    "totalConsumed": 200,
    "totalExchanged": 100,
    "totalRecharged": 500,
    "totalBalance": 1200,
    "trendData": [
      {
        "date": "2024-12-21",
        "earned": 100,
        "consumed": 20,
        "exchanged": 10
      }
    ]
  }
}
```

**验证点:**
- ✅ 统计数据准确
- ✅ 趋势数据完整

#### 5.4 手动调整用户积分

**请求:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/users/USER_ID/points/adjust \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pointsChange": 100,
    "reason": "活动奖励"
  }'
```

**预期响应:**
```json
{
  "code": 200,
  "message": "调整积分成功",
  "data": {
    "pointsChange": 100,
    "newBalance": 110,
    "reason": "活动奖励"
  }
}
```

**验证点:**
- ✅ 积分调整成功
- ✅ 积分明细中有记录
- ✅ 原因被正确记录

#### 5.5 管理积分商品

**添加商品:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/points/products \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "测试商品",
    "productType": "physical",
    "productCode": "test_product",
    "pointsRequired": 500,
    "stock": 100,
    "description": "测试商品描述"
  }'
```

**验证点:**
- ✅ 商品添加成功
- ✅ 商品在列表中显示
- ✅ 可以编辑和删除商品

## ✅ 验证清单

### 用户功能
- [ ] 获取积分信息
- [ ] 查看积分明细
- [ ] 每日签到
- [ ] 查看每日任务
- [ ] 完成任务获得积分
- [ ] 查看积分商品
- [ ] 兑换积分商品
- [ ] 查看兑换记录
- [ ] 查看充值套餐
- [ ] 创建充值订单

### 积分获取
- [ ] 上传作品审核通过获得积分
- [ ] 作品被下载获得积分
- [ ] 作品被收藏获得积分
- [ ] 作品被点赞获得积分
- [ ] 每日签到获得积分
- [ ] 完善资料获得积分（一次性）
- [ ] 绑定邮箱获得积分（一次性）
- [ ] 绑定微信获得积分（一次性）
- [ ] 邀请新用户获得积分

### 积分消耗
- [ ] 下载普通资源消耗积分
- [ ] 下载高级资源消耗积分
- [ ] 下载精品资源消耗积分
- [ ] VIP用户下载不消耗积分
- [ ] 用户等级折扣生效
- [ ] 积分不足时阻止下载

### 用户等级
- [ ] 等级自动计算
- [ ] 等级提升通知
- [ ] 等级特权显示
- [ ] 下载折扣应用

### 管理员功能
- [ ] 查看积分规则
- [ ] 更新积分规则
- [ ] 查看积分商品
- [ ] 添加积分商品
- [ ] 编辑积分商品
- [ ] 删除积分商品
- [ ] 查看兑换记录
- [ ] 发货处理
- [ ] 查看积分统计
- [ ] 手动调整用户积分

## 🐛 常见问题

### 1. 签到提示"今日已签到"
**原因:** 同一天只能签到一次
**解决:** 等待第二天或修改系统时间测试

### 2. 积分不足无法下载
**原因:** 用户积分余额不足
**解决:** 通过签到或管理员调整增加积分

### 3. 管理员接口返回403
**原因:** 没有相应的管理权限
**解决:** 确保使用管理员账号登录

### 4. 等级没有自动提升
**原因:** 等级基于累计积分计算，消耗积分不影响等级
**解决:** 通过获得积分（而非充值）来提升等级

## 📊 性能验证

### 1. 并发测试
- 测试多个用户同时签到
- 测试多个用户同时兑换商品
- 验证积分扣除的原子性

### 2. 数据一致性
- 验证积分余额与明细记录一致
- 验证等级计算准确性
- 验证商品库存扣减正确

## 🎉 验证完成

完成所有验证清单后，积分管理系统即可投入使用！

---

**验证日期:** 2024年12月21日
**验证人员:** [填写验证人员]
**验证结果:** [ ] 通过 / [ ] 未通过
**备注:** [填写备注信息]
