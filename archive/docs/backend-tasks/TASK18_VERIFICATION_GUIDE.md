# 任务18验证指南：管理员用户管理API

## 🚀 快速验证

### 1. 启动后端服务
```bash
cd backend
npm run dev
```

### 2. 运行测试脚本
```bash
npx tsx src/test-admin-user-api.ts
```

### 3. 预期结果
```
========================================
   测试结果汇总
========================================
总测试数: 12
✅ 通过: 12
❌ 失败: 0
成功率: 100.00%
========================================
```

## 📋 手动验证步骤

### 步骤1: 管理员登录
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13900000000",
    "password": "test123456"
  }'
```

**预期响应**:
```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "userId": "...",
      "phone": "13900000000",
      "nickname": "系统管理员",
      "roleCode": "super_admin"
    }
  }
}
```

保存返回的token，后续请求需要使用。

### 步骤2: 获取用户列表
```bash
curl -X GET "http://localhost:8080/api/v1/admin/users?page=1&page_size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "userId": "...",
        "phone": "13900000001",
        "nickname": "内容审核员",
        "vipLevel": 0,
        "pointsBalance": 500,
        "userLevel": 1,
        "status": 1
      }
    ],
    "total": 4,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

### 步骤3: 搜索用户
```bash
curl -X GET "http://localhost:8080/api/v1/admin/users?search=138" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**验证点**:
- ✅ 返回包含"138"的手机号用户
- ✅ 支持模糊搜索

### 步骤4: 筛选VIP用户
```bash
curl -X GET "http://localhost:8080/api/v1/admin/users?vip_level=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**验证点**:
- ✅ 只返回VIP等级为1的用户
- ✅ 返回VIP用户信息

### 步骤5: 获取用户详情
```bash
curl -X GET "http://localhost:8080/api/v1/admin/users/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期响应**:
```json
{
  "code": 200,
  "data": {
    "userId": "...",
    "phone": "13800000002",
    "nickname": "VIP测试用户",
    "vipLevel": 1,
    "pointsBalance": 550,
    "pointsRecords": [...],
    "operationLogs": [...]
  }
}
```

**验证点**:
- ✅ 返回用户完整信息
- ✅ 包含积分明细
- ✅ 包含操作记录

### 步骤6: 禁用用户
```bash
curl -X PUT "http://localhost:8080/api/v1/admin/users/USER_ID/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": 0,
    "reason": "测试禁用"
  }'
```

**验证点**:
- ✅ 用户状态变为禁用
- ✅ 记录操作日志
- ✅ 禁用后无法登录

### 步骤7: 启用用户
```bash
curl -X PUT "http://localhost:8080/api/v1/admin/users/USER_ID/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": 1,
    "reason": "测试启用"
  }'
```

**验证点**:
- ✅ 用户状态变为正常
- ✅ 记录操作日志
- ✅ 启用后可以登录

### 步骤8: 重置密码
```bash
curl -X POST "http://localhost:8080/api/v1/admin/users/USER_ID/reset-password" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期响应**:
```json
{
  "code": 200,
  "data": {
    "tempPassword": "66pP8z6X"
  },
  "message": "密码重置成功，临时密码已生成"
}
```

**验证点**:
- ✅ 生成8位临时密码
- ✅ 密码已加密存储
- ✅ 记录操作日志
- ✅ 用户可用临时密码登录

### 步骤9: 调整VIP
```bash
curl -X PUT "http://localhost:8080/api/v1/admin/users/USER_ID/vip" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vip_level": 1,
    "vip_expire_at": "2026-01-20T14:00:00.000Z",
    "reason": "测试调整VIP"
  }'
```

**验证点**:
- ✅ VIP等级更新
- ✅ VIP到期时间更新
- ✅ 记录操作日志

### 步骤10: 增加积分
```bash
curl -X POST "http://localhost:8080/api/v1/admin/users/USER_ID/points/adjust" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "points_change": 100,
    "reason": "测试增加积分"
  }'
```

**验证点**:
- ✅ 积分余额增加100
- ✅ 记录积分明细
- ✅ 记录操作日志

### 步骤11: 扣减积分
```bash
curl -X POST "http://localhost:8080/api/v1/admin/users/USER_ID/points/adjust" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "points_change": -50,
    "reason": "测试扣减积分"
  }'
```

**验证点**:
- ✅ 积分余额减少50
- ✅ 记录积分明细
- ✅ 记录操作日志
- ✅ 积分不能为负数

### 步骤12: 验证操作日志
```bash
curl -X GET "http://localhost:8080/api/v1/admin/users/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**验证点**:
- ✅ operationLogs包含所有操作记录
- ✅ 每条记录包含操作者、操作类型、描述、时间
- ✅ 按时间倒序排列

## 🔍 权限验证

### 测试无权限访问
使用普通用户token访问管理员接口：

```bash
# 1. 普通用户登录
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800000001",
    "password": "test123456"
  }'

# 2. 使用普通用户token访问管理员接口
curl -X GET "http://localhost:8080/api/v1/admin/users" \
  -H "Authorization: Bearer USER_TOKEN"
```

**预期响应**:
```json
{
  "code": 403,
  "message": "权限不足，无法访问该资源"
}
```

## 🧪 边界条件测试

### 1. 测试禁用自己
```bash
# 使用管理员token禁用管理员自己
curl -X PUT "http://localhost:8080/api/v1/admin/users/ADMIN_USER_ID/status" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": 0,
    "reason": "测试"
  }'
```

**预期响应**:
```json
{
  "code": 400,
  "message": "不能禁用自己的账号"
}
```

### 2. 测试积分不足
```bash
# 扣减超过余额的积分
curl -X POST "http://localhost:8080/api/v1/admin/users/USER_ID/points/adjust" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "points_change": -99999,
    "reason": "测试"
  }'
```

**预期响应**:
```json
{
  "code": 400,
  "message": "积分余额不足，无法扣减"
}
```

### 3. 测试VIP等级验证
```bash
# 设置无效的VIP等级
curl -X PUT "http://localhost:8080/api/v1/admin/users/USER_ID/vip" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vip_level": 99,
    "reason": "测试"
  }'
```

**预期响应**:
```json
{
  "code": 400,
  "message": "VIP等级必须在0-3之间"
}
```

### 4. 测试必填字段
```bash
# 调整积分不提供原因
curl -X POST "http://localhost:8080/api/v1/admin/users/USER_ID/points/adjust" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "points_change": 100
  }'
```

**预期响应**:
```json
{
  "code": 400,
  "message": "调整原因不能为空"
}
```

## 📊 数据库验证

### 验证操作日志表
```sql
SELECT * FROM admin_operation_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

**验证点**:
- ✅ 所有管理操作都有记录
- ✅ 包含操作者ID和目标用户ID
- ✅ 操作描述清晰

### 验证积分明细
```sql
SELECT * FROM points_records 
WHERE source = 'admin_adjust' 
ORDER BY created_at DESC 
LIMIT 10;
```

**验证点**:
- ✅ 积分调整都有记录
- ✅ 包含变动值和余额
- ✅ 描述包含原因

## ✅ 验证清单

- [ ] 所有12个测试用例通过
- [ ] 用户列表查询正常
- [ ] 搜索功能正常
- [ ] 筛选功能正常
- [ ] 用户详情查询正常
- [ ] 禁用/启用用户正常
- [ ] 重置密码正常
- [ ] VIP调整正常
- [ ] 积分调整正常
- [ ] 操作日志记录正常
- [ ] 权限控制正常
- [ ] 边界条件处理正常

## 🎯 测试账号

| 角色 | 手机号 | 密码 | 说明 |
|------|--------|------|------|
| 超级管理员 | 13900000000 | test123456 | 拥有所有权限 |
| 内容审核员 | 13900000001 | test123456 | 仅审核权限 |
| 普通用户 | 13800000001 | test123456 | 无管理权限 |
| VIP用户 | 13800000002 | test123456 | VIP等级1 |

## 📝 注意事项

1. **Token有效期**: JWT token默认24小时有效
2. **权限要求**: 所有管理员接口都需要相应权限
3. **操作日志**: 所有管理操作都会记录
4. **数据安全**: 密码使用bcrypt加密
5. **防护措施**: 防止管理员禁用自己

## 🐛 常见问题

### Q1: 登录失败
**A**: 确保使用正确的测试账号和密码，密码已使用bcrypt加密。

### Q2: 权限不足
**A**: 确保使用管理员账号登录，普通用户无法访问管理员接口。

### Q3: 操作日志未记录
**A**: 检查数据库中admin_operation_logs表是否存在。

### Q4: 积分调整失败
**A**: 检查积分余额是否足够，不能扣减为负数。

## 🎉 验证完成

如果所有验证步骤都通过，说明任务18已成功完成！
