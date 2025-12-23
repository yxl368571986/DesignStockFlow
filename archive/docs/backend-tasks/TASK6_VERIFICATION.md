# 任务6验证清单 - 数据库设计与初始化

本文档用于验证任务6（数据库设计与初始化）是否正确完成。

## ✅ 任务6.1 - 编写Prisma Schema

### 验证项

- [x] **文件存在**: `backend/prisma/schema.prisma` 文件已创建
- [x] **数据库配置**: 配置了 PostgreSQL 数据源
- [x] **命名规范**: 所有字段使用 snake_case 命名（如 `user_id`, `created_at`）
- [x] **表结构完整**: 定义了所有20个数据库表
  - [x] roles (角色表)
  - [x] permissions (权限表)
  - [x] role_permissions (角色权限关联表)
  - [x] users (用户表)
  - [x] categories (分类表)
  - [x] resources (资源表)
  - [x] download_history (下载记录表)
  - [x] audit_logs (审核日志表)
  - [x] vip_packages (VIP套餐表)
  - [x] vip_privileges (VIP特权表)
  - [x] orders (订单表)
  - [x] points_rules (积分规则表)
  - [x] points_records (积分记录表)
  - [x] points_products (积分商品表)
  - [x] points_exchange_records (积分兑换记录表)
  - [x] daily_tasks (每日任务表)
  - [x] user_tasks (用户任务记录表)
  - [x] banners (轮播图表)
  - [x] announcements (公告表)
  - [x] system_config (系统配置表)
- [x] **关系定义**: 所有表关系正确定义（外键、一对多、多对多）
- [x] **索引优化**: 关键字段已添加索引

### 验证命令

```bash
cd backend

# 检查 schema 文件语法
npx prisma validate

# 生成 Prisma Client
npm run prisma:generate
```

**预期结果**: 
- ✅ Schema 验证通过
- ✅ Prisma Client 生成成功

---

## ✅ 任务6.2 - 创建数据库迁移

### 验证项

- [x] **迁移文件存在**: `backend/prisma/migrations/00_init/migration.sql` 已创建
- [x] **SQL语句完整**: 包含所有20个表的 CREATE TABLE 语句
- [x] **索引创建**: 包含所有索引的 CREATE INDEX 语句
- [x] **外键约束**: 包含所有外键约束定义
- [x] **字段类型正确**: 所有字段类型符合设计文档要求

### 验证命令

**注意**: 以下命令需要 PostgreSQL 数据库服务器运行

```bash
cd backend

# 方式1: 使用 Prisma Migrate（推荐）
npm run prisma:migrate

# 方式2: 手动执行 SQL
psql -U postgres -d startide_design -f prisma/migrations/00_init/migration.sql
```

**预期结果**:
- ✅ 数据库中成功创建20个表
- ✅ 所有索引创建成功
- ✅ 所有外键约束创建成功

### 验证数据库表

```bash
# 连接到数据库
psql -U postgres -d startide_design

# 查看所有表
\dt

# 查看特定表结构
\d users
\d resources
\d vip_packages
```

**预期结果**: 显示所有20个表及其结构

---

## ✅ 任务6.3 - 初始化基础数据

### 验证项

- [x] **Seed脚本存在**: `backend/prisma/seed.ts` 已创建
- [x] **package.json配置**: 添加了 `prisma.seed` 配置
- [x] **脚本命令**: 添加了 `prisma:seed` 命令

### 数据初始化内容

#### 1. 角色数据（4个）
- [x] super_admin (超级管理员)
- [x] moderator (内容审核员)
- [x] operator (运营人员)
- [x] user (普通用户)

#### 2. 权限数据（22个）
- [x] 用户管理权限（4个）
- [x] 资源管理权限（4个）
- [x] 内容审核权限（3个）
- [x] 分类管理权限（4个）
- [x] 数据统计权限（2个）
- [x] 内容运营权限（3个）
- [x] 系统设置权限（2个）

#### 3. 角色权限关联
- [x] 超级管理员：所有22个权限
- [x] 审核员：内容审核权限（3个）
- [x] 运营人员：内容运营权限（3个）

#### 4. 分类数据（10个）
- [x] 党建类、节日海报类、电商类、UI设计类
- [x] 插画类、摄影图类、背景素材类
- [x] 字体类、图标类、模板类

#### 5. VIP套餐数据（3个）
- [x] VIP月卡（29.90元/30天）
- [x] VIP季卡（79.90元/90天）
- [x] VIP年卡（299.00元/365天）

#### 6. VIP特权数据（10个）
- [x] 免费下载所有资源
- [x] 专属VIP资源
- [x] 优先审核
- [x] 去除下载限制
- [x] 去除广告
- [x] 专属客服
- [x] 作品置顶推广
- [x] 高速下载通道
- [x] 批量下载
- [x] 收藏夹扩展

#### 7. 积分规则数据（12条）
- [x] 获得积分规则（9条）
  - 上传作品审核通过、作品被下载、作品被收藏、作品被点赞
  - 每日签到、完善个人资料、绑定邮箱、绑定微信、邀请新用户
- [x] 消耗积分规则（3条）
  - 下载普通资源、下载高级资源、下载精品资源

#### 8. 每日任务数据（5个）
- [x] 每日签到（10积分）
- [x] 上传1个作品（50积分）
- [x] 下载3个资源（5积分）
- [x] 收藏5个作品（5积分）
- [x] 分享作品到社交媒体（15积分）

#### 9. 系统配置数据（8个）
- [x] site_name (网站名称)
- [x] site_logo (网站Logo)
- [x] max_file_size (最大文件大小)
- [x] daily_download_limit (每日下载次数)
- [x] watermark_text (水印文字)
- [x] watermark_opacity (水印透明度)
- [x] points_recharge_enabled (积分充值开关)
- [x] vip_auto_renew_enabled (VIP自动续费开关)

#### 10. 测试账号（3个）
- [x] 普通用户: 13800000001 / test123456
- [x] VIP用户: 13800000002 / test123456
- [x] 管理员: 13900000000 / test123456

### 验证命令

**注意**: 需要先完成任务6.2（数据库迁移）

```bash
cd backend

# 执行数据初始化
npm run prisma:seed
```

**预期输出**:
```
开始初始化数据库基础数据...

1. 初始化角色数据...
✓ 成功创建 4 个角色

2. 初始化权限数据...
✓ 成功创建 22 个权限

3. 初始化角色权限关联数据...
✓ 超级管理员已分配所有权限
✓ 审核员已分配审核权限
✓ 运营人员已分配运营权限

4. 初始化分类数据...
✓ 成功创建 10 个分类

5. 初始化VIP套餐数据...
✓ 成功创建 3 个VIP套餐

6. 初始化VIP特权数据...
✓ 成功创建 10 个VIP特权

7. 初始化积分规则数据...
✓ 成功创建 12 条积分规则

8. 初始化每日任务数据...
✓ 成功创建 5 个每日任务

9. 初始化系统配置数据...
✓ 成功创建 8 个系统配置

10. 创建测试账号...
✓ 创建测试用户: 13800000001 / test123456
✓ 创建VIP测试用户: 13800000002 / test123456
✓ 创建管理员账号: 13900000000 / test123456

========================================
数据库初始化完成！
========================================

测试账号信息:
1. 普通用户: 13800000001 / test123456
2. VIP用户: 13800000002 / test123456
3. 管理员: 13900000000 / test123456

⚠️  注意: 密码未加密，生产环境请使用bcrypt加密！
```

### 验证数据

使用 Prisma Studio 可视化查看数据：

```bash
npm run prisma:studio
```

浏览器打开 `http://localhost:5555`，检查：

1. **roles 表**: 应有4条记录
2. **permissions 表**: 应有22条记录
3. **role_permissions 表**: 应有28条记录（超级管理员22个+审核员3个+运营人员3个）
4. **categories 表**: 应有10条记录
5. **vip_packages 表**: 应有3条记录
6. **vip_privileges 表**: 应有10条记录
7. **points_rules 表**: 应有12条记录
8. **daily_tasks 表**: 应有5条记录
9. **system_config 表**: 应有8条记录
10. **users 表**: 应有3条记录（测试账号）

### SQL查询验证

```sql
-- 验证角色数量
SELECT COUNT(*) FROM roles; -- 应返回 4

-- 验证权限数量
SELECT COUNT(*) FROM permissions; -- 应返回 22

-- 验证角色权限关联
SELECT COUNT(*) FROM role_permissions; -- 应返回 28

-- 验证分类数量
SELECT COUNT(*) FROM categories; -- 应返回 10

-- 验证VIP套餐
SELECT COUNT(*) FROM vip_packages; -- 应返回 3

-- 验证VIP特权
SELECT COUNT(*) FROM vip_privileges; -- 应返回 10

-- 验证积分规则
SELECT COUNT(*) FROM points_rules; -- 应返回 12

-- 验证每日任务
SELECT COUNT(*) FROM daily_tasks; -- 应返回 5

-- 验证系统配置
SELECT COUNT(*) FROM system_config; -- 应返回 8

-- 验证测试账号
SELECT COUNT(*) FROM users; -- 应返回 3

-- 查看超级管理员的权限
SELECT p.permission_name, p.permission_code 
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.permission_id
JOIN roles r ON rp.role_id = r.role_id
WHERE r.role_code = 'super_admin';
-- 应返回 22 条记录

-- 查看热门分类
SELECT category_name, category_code 
FROM categories 
WHERE is_hot = true 
ORDER BY sort_order;
-- 应返回 4 条记录（党建类、节日海报类、电商类、UI设计类）
```

---

## 📋 完整验证流程

### 步骤1: 启动 PostgreSQL 数据库

```bash
# Windows (使用服务)
net start postgresql-x64-14

# macOS/Linux
sudo systemctl start postgresql
# 或
brew services start postgresql
```

### 步骤2: 创建数据库

```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE startide_design;

# 退出
\q
```

### 步骤3: 配置环境变量

编辑 `backend/.env` 文件：

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/startide_design?schema=public"
```

### 步骤4: 执行迁移

```bash
cd backend

# 生成 Prisma Client
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate
# 输入迁移名称: init
```

### 步骤5: 初始化数据

```bash
# 执行 seed 脚本
npm run prisma:seed
```

### 步骤6: 验证数据

```bash
# 打开 Prisma Studio
npm run prisma:studio
```

在浏览器中检查所有表的数据是否正确。

---

## ⚠️ 注意事项

### 1. 密码加密问题

当前测试账号的密码是明文存储的（`test123456`），仅用于开发测试。

**生产环境必须修改**:

在 `prisma/seed.ts` 中添加：

```typescript
import bcrypt from 'bcrypt';

// 修改密码生成方式
const testPassword = bcrypt.hashSync('test123456', 10);
```

### 2. 数据库连接问题

如果遇到 `P1001: Can't reach database server` 错误：

1. 确认 PostgreSQL 服务已启动
2. 检查 `.env` 中的 `DATABASE_URL` 配置
3. 确认数据库已创建
4. 确认用户名和密码正确

### 3. 重复执行 Seed

Seed 脚本使用 `upsert` 方法，可以安全地重复执行。如果数据已存在，会跳过创建。

### 4. 重置数据库

如果需要完全重置数据库：

```bash
# 删除所有表并重新迁移
npx prisma migrate reset

# 重新初始化数据
npm run prisma:seed
```

---

## ✅ 任务完成标准

任务6（数据库设计与初始化）完成的标准：

- [x] Prisma Schema 文件正确定义所有20个表
- [x] 所有字段使用 snake_case 命名规范
- [x] 数据库迁移文件已创建
- [x] 数据库表结构创建成功
- [x] Seed 脚本已创建并可执行
- [x] 所有基础数据初始化成功（角色、权限、分类、VIP、积分、任务、配置）
- [x] 测试账号创建成功
- [x] 可以使用 Prisma Studio 查看数据
- [x] 文档完整（DATABASE_SETUP.md）

---

## 📚 相关文档

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 数据库设置指南
- [设计文档 - 数据库设计](../.kiro/specs/frontend-fixes-and-backend/design.md) - 第3章
- [任务清单](../.kiro/specs/frontend-fixes-and-backend/tasks.md) - 任务6

---

## 🎉 验证完成

如果以上所有验证项都通过，则任务6（数据库设计与初始化）已成功完成！

可以继续进行任务7（后端核心架构搭建）的开发工作。
