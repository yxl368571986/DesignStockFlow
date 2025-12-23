# 任务13验证指南 - VIP管理API

## 快速验证步骤

### 前置条件
1. 确保PostgreSQL数据库已启动
2. 确保数据库已初始化（运行过seed.ts）
3. 确保后端服务已启动

### 步骤1: 启动后端服务

```bash
cd backend
npm run dev
```

服务启动后应该看到：
```
🚀 Server is running on http://localhost:3000
💎 VIP routes loaded
✅ VIP定时任务调度器已启动
```

### 步骤2: 运行VIP API测试

在另一个终端窗口运行：

```bash
cd backend
tsx src/test-vip-api.ts
```

### 步骤3: 验证测试结果

测试脚本会依次执行以下测试：

#### 测试1: 用户登录
- ✅ 普通用户登录成功
- ✅ 管理员登录成功

#### 测试2: 获取VIP套餐列表（前台）
- ✅ 返回所有启用的VIP套餐
- ✅ 应该看到3个套餐（月卡、季卡、年卡）

#### 测试3: 获取VIP特权列表（前台）
- ✅ 返回所有启用的VIP特权
- ✅ 应该看到10个特权

#### 测试4: 获取用户VIP信息（前台）
- ✅ 返回用户VIP状态
- ✅ 包含剩余天数和特权列表

#### 测试5: 获取所有VIP套餐（管理员）
- ✅ 返回所有VIP套餐（包括禁用的）

#### 测试6: 创建VIP套餐（管理员）
- ✅ 成功创建测试套餐
- ✅ 返回套餐ID

#### 测试7: 更新VIP套餐（管理员）
- ✅ 成功更新套餐价格和描述

#### 测试8: 获取所有VIP特权（管理员）
- ✅ 返回所有VIP特权

#### 测试9: 更新VIP特权配置（管理员）
- ✅ 成功更新特权描述

#### 测试10: 获取VIP订单列表（管理员）
- ✅ 返回VIP订单列表（可能为空）

#### 测试11: 获取VIP统计数据（管理员）
- ✅ 返回VIP用户统计
- ✅ 返回VIP收入统计
- ✅ 返回套餐销量排行
- ✅ 返回增长趋势数据

#### 测试12: 删除VIP套餐（管理员）
- ✅ 成功删除测试套餐

## 手动API测试

### 使用Postman或curl测试

#### 1. 获取VIP套餐列表（无需认证）

```bash
curl http://localhost:3000/api/v1/vip/packages
```

预期响应：
```json
{
  "code": 200,
  "msg": "获取VIP套餐列表成功",
  "data": [
    {
      "package_id": "...",
      "package_name": "VIP月卡",
      "package_code": "vip_month",
      "duration_days": 30,
      "original_price": "39.90",
      "current_price": "29.90",
      "description": "30天VIP会员,享受所有VIP特权",
      "sort_order": 1,
      "status": 1
    }
  ],
  "timestamp": 1703145600000
}
```

#### 2. 获取VIP特权列表（无需认证）

```bash
curl http://localhost:3000/api/v1/vip/privileges
```

#### 3. 获取用户VIP信息（需要登录）

```bash
# 先登录获取token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138001","password":"123456"}'

# 使用token获取VIP信息
curl http://localhost:3000/api/v1/vip/my-info \
  -H "Authorization: Bearer YOUR_TOKEN"
```

预期响应：
```json
{
  "code": 200,
  "msg": "获取用户VIP信息成功",
  "data": {
    "user_id": "...",
    "vip_level": 0,
    "vip_expire_at": null,
    "is_vip": false,
    "days_remaining": 0,
    "privileges": []
  },
  "timestamp": 1703145600000
}
```

#### 4. 创建VIP套餐（管理员）

```bash
# 先用管理员账号登录
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"admin123"}'

# 创建VIP套餐
curl -X POST http://localhost:3000/api/v1/vip/admin/packages \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_name": "VIP周卡",
    "package_code": "vip_week",
    "duration_days": 7,
    "original_price": 19.9,
    "current_price": 9.9,
    "description": "7天VIP会员",
    "sort_order": 0
  }'
```

#### 5. 获取VIP统计数据（管理员）

```bash
curl http://localhost:3000/api/v1/vip/admin/statistics \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

预期响应：
```json
{
  "code": 200,
  "msg": "获取VIP统计数据成功",
  "data": {
    "overview": {
      "total_vip_users": 0,
      "today_new_vip_users": 0,
      "month_new_vip_users": 0,
      "total_revenue": 0,
      "today_revenue": 0,
      "month_revenue": 0
    },
    "package_sales": [],
    "user_growth_trend": [...],
    "revenue_trend": [...]
  },
  "timestamp": 1703145600000
}
```

## 数据库验证

### 查看VIP套餐数据

```sql
SELECT * FROM vip_packages ORDER BY sort_order;
```

应该看到3个预设套餐：
- VIP月卡（30天，29.90元）
- VIP季卡（90天，79.90元）
- VIP年卡（365天，299.00元）

### 查看VIP特权数据

```sql
SELECT * FROM vip_privileges ORDER BY sort_order;
```

应该看到10个预设特权：
1. 免费下载所有资源
2. 专属VIP资源
3. 优先审核
4. 去除下载限制
5. 去除广告
6. 专属客服
7. 作品置顶推广
8. 高速下载通道
9. 批量下载
10. 收藏夹扩展

### 查看用户VIP状态

```sql
SELECT user_id, nickname, vip_level, vip_expire_at 
FROM users 
WHERE vip_level > 0;
```

### 查看VIP订单

```sql
SELECT * FROM orders 
WHERE order_type = 'vip' 
ORDER BY created_at DESC;
```

## 定时任务验证

### 查看定时任务日志

启动后端服务后，应该在日志中看到：
```
✅ VIP定时任务调度器已启动
```

### 手动触发定时任务（开发环境）

可以在代码中临时启用立即执行：

```typescript
// 在 vipScheduler.ts 中
if (process.env.NODE_ENV === 'development') {
  logger.info('开发环境：立即执行一次VIP定时任务');
  vipExpirationReminderTask(); // 取消注释
  vipExpirationHandlerTask();  // 取消注释
}
```

### 测试VIP到期处理

1. 手动设置一个用户的VIP为已过期：

```sql
UPDATE users 
SET vip_level = 1, 
    vip_expire_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'YOUR_USER_ID';
```

2. 运行到期处理任务（在代码中调用或等待定时任务执行）

3. 验证用户已被降级：

```sql
SELECT user_id, nickname, vip_level, vip_expire_at 
FROM users 
WHERE user_id = 'YOUR_USER_ID';
```

应该看到 `vip_level` 已变为 0

## 常见问题排查

### 问题1: 路由404错误

**症状**: 访问VIP接口返回404

**解决方案**:
1. 检查app.ts中是否已注册VIP路由
2. 确认路由路径是否正确
3. 重启后端服务

### 问题2: 认证失败

**症状**: 返回401未授权错误

**解决方案**:
1. 确认已登录并获取token
2. 检查Authorization header格式：`Bearer YOUR_TOKEN`
3. 确认token未过期

### 问题3: 数据库连接错误

**症状**: 服务启动失败或API调用报错

**解决方案**:
1. 检查PostgreSQL是否已启动
2. 检查.env文件中的DATABASE_URL配置
3. 运行 `npx prisma generate` 重新生成Prisma客户端

### 问题4: 定时任务未执行

**症状**: VIP到期用户未被降级

**解决方案**:
1. 检查服务日志，确认定时任务已启动
2. 检查定时任务执行时间设置
3. 手动触发任务进行测试

### 问题5: 创建套餐失败

**症状**: 返回"套餐代码已存在"错误

**解决方案**:
1. 检查数据库中是否已存在相同的package_code
2. 使用不同的package_code
3. 或先删除已存在的套餐

## 性能测试

### 并发测试

使用Apache Bench测试VIP接口性能：

```bash
# 测试获取VIP套餐列表接口
ab -n 1000 -c 10 http://localhost:3000/api/v1/vip/packages

# 测试获取VIP特权列表接口
ab -n 1000 -c 10 http://localhost:3000/api/v1/vip/privileges
```

### 预期性能指标

- 响应时间: < 100ms
- 并发处理: 支持10+并发请求
- 错误率: 0%

## 安全测试

### 权限测试

1. 尝试不带token访问管理员接口（应返回401）
2. 尝试用普通用户token访问管理员接口（应返回403，需要实现权限检查）
3. 尝试访问不存在的资源（应返回404）

### 输入验证测试

1. 创建套餐时缺少必填字段（应返回400）
2. 创建套餐时使用无效的数据类型（应返回400）
3. 更新不存在的套餐（应返回404）

## 验证完成标准

- [ ] 所有自动化测试通过
- [ ] 所有手动API测试返回正确响应
- [ ] 数据库中有正确的VIP数据
- [ ] 定时任务正常启动
- [ ] VIP到期处理功能正常
- [ ] 无TypeScript编译错误
- [ ] 无运行时错误
- [ ] 日志输出正常

## 下一步

验证完成后，可以继续进行：
1. 集成支付系统
2. 实现通知系统
3. 添加更细粒度的权限控制
4. 优化性能和缓存
5. 编写单元测试和集成测试
