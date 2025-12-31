# 生产环境数据清理指南

## 概述

本指南用于在生产环境部署前清理所有测试数据，仅保留管理员账号 `13900000000`。

## ⚠️ 重要警告

**执行前必读：**
1. 此操作将删除除管理员账号外的所有用户数据
2. 此操作不可逆，请务必先备份数据库
3. 建议在测试环境先执行一次，验证无误后再在生产环境执行
4. 执行过程中请勿中断，否则可能导致数据不一致

## 准备工作

### 1. 确认数据库连接信息

检查 `backend/.env` 文件中的数据库配置：
```env
DATABASE_URL="postgresql://用户名:密码@localhost:5432/数据库名"
```

### 2. 安装 PostgreSQL 客户端工具

确保已安装 `psql` 命令行工具。

### 3. 设置环境变量

```powershell
# Windows PowerShell
$env:PGPASSWORD='your_password'
$env:PGCLIENTENCODING='UTF8'
```

## 执行步骤

### 步骤 1: 备份数据库（必须！）

```powershell
# 备份整个数据库
pg_dump -h localhost -U postgres -d startide_design -F c -f backup_before_cleanup_$(Get-Date -Format 'yyyyMMdd_HHmmss').backup

# 或者导出为 SQL 文件
pg_dump -h localhost -U postgres -d startide_design -f backup_before_cleanup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

### 步骤 2: 执行清理前验证

```powershell
psql -h localhost -U postgres -d startide_design -f verify-before-cleanup.sql
```

**检查验证结果：**
- ✅ 管理员账号 `13900000000` 存在
- ✅ 查看当前数据量，确认需要清理
- ✅ 查看系统配置数据（VIP套餐、充值套餐等）

### 步骤 3: 执行数据清理

```powershell
psql -h localhost -U postgres -d startide_design -f production-data-cleanup.sql
```

**清理过程：**
1. 脚本会自动查找管理员账号
2. 按依赖顺序删除关联数据
3. 删除测试用户
4. 重置管理员账号的统计数据
5. 重新计算分类资源计数
6. 输出清理结果

**预期输出：**
```
NOTICE:  找到管理员账号，将保留此账号
NOTICE:  ========================================
NOTICE:  数据清理完成！
NOTICE:  ========================================
NOTICE:  剩余用户数: 1
NOTICE:  剩余资源数: X
NOTICE:  剩余订单数: 0
NOTICE:  保留的管理员账号: 13900000000
NOTICE:  ========================================
COMMIT
```

### 步骤 4: 执行清理后验证

```powershell
psql -h localhost -U postgres -d startide_design -f verify-after-cleanup.sql
```

**验证检查清单：**
- ✅ 管理员账号 `13900000000` 存在且状态正常
- ✅ 用户总数为 1（仅管理员）
- ✅ 系统配置数据完整（VIP套餐、充值套餐、分类等）
- ✅ 分类资源计数正确
- ✅ 无孤立数据
- ✅ 管理员拥有正确的角色和权限

### 步骤 5: 功能测试

1. **登录测试**
   ```bash
   # 启动后端服务
   cd backend
   npm run dev
   ```
   - 使用 `13900000000` 登录管理后台
   - 验证所有管理功能正常

2. **注册新用户测试**
   - 注册一个新的测试用户
   - 验证注册流程正常

3. **上传资源测试**
   - 上传一个测试资源
   - 验证上传、审核流程正常

4. **下载测试**
   - 测试资源下载功能
   - 验证积分扣除正常

5. **支付测试**
   - 测试VIP购买流程（使用沙箱环境）
   - 测试积分充值流程（使用沙箱环境）

## 清理内容详细说明

### 会被删除的数据

1. **用户相关**
   - 除 `13900000000` 外的所有用户账号
   - 用户的积分记录、订单记录、下载记录
   - 用户的收藏、任务完成记录

2. **资源相关**
   - **默认：删除所有资源**（推荐用于生产环境部署）
   - 可选：仅删除非管理员上传的资源
   - 资源的审核日志、下载历史
   - **前端展示的所有卡片数据都会被清除**

3. **订单相关**
   - 所有VIP订单
   - 所有充值订单
   - 支付回调记录

4. **系统日志**
   - 管理员操作日志
   - 安全日志
   - 设备会话记录

5. **其他数据**
   - 分片上传记录
   - 收益记录
   - 风控日志
   - 退款申请

### 会被保留的数据

1. **系统配置**
   - VIP套餐配置
   - 充值套餐配置
   - 积分规则
   - 每日任务配置
   - 角色和权限配置

2. **基础数据**
   - 分类数据
   - 公告数据（可选）
   - 轮播图数据（可选）

3. **管理员账号**
   - 账号 `13900000000`
   - 管理员上传的资源（如果有）
   - 管理员的角色和权限

## 回滚方案

如果清理后发现问题，可以从备份恢复：

```powershell
# 从 .backup 文件恢复
pg_restore -h localhost -U postgres -d startide_design -c backup_file.backup

# 从 .sql 文件恢复
psql -h localhost -U postgres -d startide_design -f backup_file.sql
```

## 常见问题

### Q1: 如果管理员账号不是 13900000000 怎么办？

修改 `production-data-cleanup.sql` 文件中的手机号：
```sql
-- 将所有 '13900000000' 替换为实际的管理员手机号
WHERE phone = '你的管理员手机号'
```

### Q2: 如果想保留多个管理员账号怎么办？

修改 `production-data-cleanup.sql` 文件：
```sql
-- 修改临时表创建语句
CREATE TEMP TABLE admin_to_keep AS
SELECT user_id FROM users WHERE phone IN ('13900000000', '13900000001', '13900000002');
```

### Q3: 如果想保留某些测试资源怎么办？

在清理前，将这些资源的 `user_id` 改为管理员的 `user_id`：
```sql
UPDATE resources 
SET user_id = (SELECT user_id FROM users WHERE phone = '13900000000')
WHERE resource_id IN ('资源ID1', '资源ID2');
```

### Q4: 清理后分类资源计数不对怎么办？

重新运行计数更新：
```sql
UPDATE categories SET resource_count = (
  SELECT COUNT(*) FROM resources 
  WHERE resources.category_id = categories.category_id 
  AND resources.status = 1 
  AND resources.audit_status = 1
);
```

### Q5: 如果想清理轮播图和公告怎么办？

取消 `production-data-cleanup.sql` 中相关部分的注释：
```sql
-- 清理所有轮播图
DELETE FROM banners;

-- 清理所有公告
DELETE FROM announcements;
```

## 清理后的建议

1. **重新初始化系统配置**
   - 检查VIP套餐价格是否正确
   - 检查充值套餐价格是否正确
   - 检查积分规则是否符合生产环境

2. **上传真实资源**
   - 准备一些高质量的真实资源
   - 通过管理员账号上传并审核通过
   - 设置合理的分类和标签

3. **配置生产环境参数**
   - 更新 `.env.production` 文件
   - 配置真实的支付密钥
   - 配置真实的短信服务

4. **性能优化**
   - 执行 `VACUUM ANALYZE` 优化数据库
   - 检查数据库索引
   - 配置数据库连接池

5. **监控和日志**
   - 配置日志轮转
   - 设置错误告警
   - 配置性能监控

## 执行清理的完整命令

```powershell
# 1. 设置环境变量
$env:PGPASSWORD='your_password'
$env:PGCLIENTENCODING='UTF8'

# 2. 备份数据库
pg_dump -h localhost -U postgres -d startide_design -F c -f "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').backup"

# 3. 清理前验证
psql -h localhost -U postgres -d startide_design -f verify-before-cleanup.sql

# 4. 执行清理（确认无误后执行）
psql -h localhost -U postgres -d startide_design -f production-data-cleanup.sql

# 5. 清理后验证
psql -h localhost -U postgres -d startide_design -f verify-after-cleanup.sql

# 6. 优化数据库
psql -h localhost -U postgres -d startide_design -c "VACUUM ANALYZE;"
```

## 联系支持

如果在清理过程中遇到问题，请：
1. 立即停止操作
2. 检查错误信息
3. 从备份恢复数据库
4. 联系技术支持

---

**最后提醒：数据无价，谨慎操作！**
