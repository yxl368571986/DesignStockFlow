# 任务12验证指南：内容审核API

## 快速验证步骤

### 前置条件
1. 确保PostgreSQL数据库正在运行
2. 确保已执行数据库迁移和种子数据
3. 确保后端服务正在运行

### 步骤1: 初始化数据库（如果还没有）
```bash
cd backend
npm run db:push
npm run db:seed
```

### 步骤2: 启动后端服务
```bash
npm run dev
```

### 步骤3: 运行测试脚本
```bash
npx tsx src/test-audit-api.ts
```

## 预期结果

测试脚本应该输出类似以下内容：

```
========================================
开始测试审核API
========================================

========== 测试1: 管理员登录 ==========
POST http://localhost:3000/api/v1/auth/login
Status: 200
✅ 管理员登录成功

========== 测试2: 审核员登录 ==========
POST http://localhost:3000/api/v1/auth/login
Status: 200
✅ 审核员登录成功

========== 测试3: 获取待审核资源列表 ==========
GET http://localhost:3000/api/v1/admin/audit/resources?page=1&pageSize=10
Status: 200
✅ 获取待审核资源列表成功
待审核资源数量: 0

========== 测试4: 未认证用户访问审核接口 ==========
GET http://localhost:3000/api/v1/admin/audit/resources
Status: 401
✅ 正确拒绝未认证用户

⚠️  跳过测试5: 没有可用的待审核资源

========== 测试6: 审核驳回资源（缺少原因） ==========
POST http://localhost:3000/api/v1/admin/audit/resources/test-resource-id
Status: 400
✅ 正确要求提供驳回原因

========== 测试7: 审核驳回资源（提供原因） ==========
POST http://localhost:3000/api/v1/admin/audit/resources/test-resource-id
Status: 404
✅ 正确处理不存在的资源

========== 测试8: 无效的审核操作 ==========
POST http://localhost:3000/api/v1/admin/audit/resources/test-resource-id
Status: 400
✅ 正确拒绝无效的审核操作

========================================
测试完成
========================================
总计: 7
通过: 7
失败: 0
========================================
```

## 手动测试（使用Postman/Apifox）

### 1. 审核员登录
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "phone": "13900000001",
  "password": "test123456"
}
```

**预期响应**:
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "xxx",
      "phone": "13900000001",
      "nickname": "内容审核员",
      "roleCode": "moderator",
      "permissions": ["audit:view", "audit:approve", "audit:reject"]
    }
  }
}
```

### 2. 获取待审核资源列表
```http
GET http://localhost:3000/api/v1/admin/audit/resources?page=1&pageSize=10
Authorization: Bearer <your_token>
```

**预期响应**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### 3. 创建测试资源（使用普通用户）

首先用普通用户登录并上传资源：

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "phone": "13800000001",
  "password": "test123456"
}
```

然后上传资源（需要使用multipart/form-data）：

```http
POST http://localhost:3000/api/v1/resources/upload
Authorization: Bearer <user_token>
Content-Type: multipart/form-data

file: [选择文件]
title: 测试资源
description: 这是一个测试资源
categoryId: [分类ID]
tags: ["测试", "审核"]
vipLevel: 0
```

### 4. 再次获取待审核资源列表

现在应该能看到刚上传的资源：

```http
GET http://localhost:3000/api/v1/admin/audit/resources?page=1&pageSize=10
Authorization: Bearer <moderator_token>
```

### 5. 审核通过资源

```http
POST http://localhost:3000/api/v1/admin/audit/resources/<resource_id>
Authorization: Bearer <moderator_token>
Content-Type: application/json

{
  "action": "approve"
}
```

**预期响应**:
```json
{
  "code": 200,
  "msg": "审核通过成功",
  "data": null
}
```

### 6. 验证积分奖励

查询上传者的积分余额，应该增加了50积分：

```http
GET http://localhost:3000/api/v1/user/info
Authorization: Bearer <user_token>
```

**预期响应**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "userId": "xxx",
    "pointsBalance": 150,  // 原来100 + 50
    "pointsTotal": 150
  }
}
```

### 7. 审核驳回资源（创建另一个测试资源）

```http
POST http://localhost:3000/api/v1/admin/audit/resources/<resource_id>
Authorization: Bearer <moderator_token>
Content-Type: application/json

{
  "action": "reject",
  "reason": "图片质量不符合要求，请重新上传高清图片"
}
```

**预期响应**:
```json
{
  "code": 200,
  "msg": "审核驳回成功",
  "data": null
}
```

## 验证检查清单

- [ ] 审核员可以成功登录
- [ ] 审核员可以获取待审核资源列表
- [ ] 未认证用户无法访问审核接口（返回401）
- [ ] 普通用户无法访问审核接口（返回403）
- [ ] 审核员可以审核通过资源
- [ ] 审核通过后资源状态变为"已通过"（audit_status = 1）
- [ ] 审核通过后上传者获得50积分
- [ ] 审核通过后记录审核日志
- [ ] 审核员可以审核驳回资源
- [ ] 驳回时必须提供原因
- [ ] 驳回后资源状态变为"已驳回"（audit_status = 2）
- [ ] 驳回后记录驳回原因
- [ ] 无效的审核操作被正确拒绝（返回400）
- [ ] 不存在的资源被正确处理（返回404）
- [ ] 已审核的资源无法重复审核（返回400）

## 数据库验证

### 查看待审核资源
```sql
SELECT resource_id, title, audit_status, created_at 
FROM resources 
WHERE audit_status = 0 
ORDER BY created_at DESC;
```

### 查看审核日志
```sql
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### 查看积分记录
```sql
SELECT * FROM points_records 
WHERE source = 'upload_approved' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 查看用户积分
```sql
SELECT user_id, nickname, points_balance, points_total 
FROM users 
WHERE phone = '13800000001';
```

## 常见问题

### Q1: 测试脚本报错"Connection refused"
**A**: 确保后端服务正在运行（npm run dev）

### Q2: 登录失败
**A**: 确保已执行数据库种子数据（npm run db:seed）

### Q3: 获取待审核资源列表为空
**A**: 需要先用普通用户上传资源，资源默认状态为"待审核"

### Q4: 权限不足（403错误）
**A**: 确保使用审核员或管理员账号登录

### Q5: 积分没有增加
**A**: 检查数据库事务是否正确执行，查看日志是否有错误

## 下一步

任务12已完成，可以继续执行：
- 任务13: VIP功能API
- 任务14: 积分系统API
- 任务15: 支付功能API

或者完善当前功能：
- 实现通知服务（审核结果通知）
- 添加审核统计功能
- 添加审核历史查询功能
