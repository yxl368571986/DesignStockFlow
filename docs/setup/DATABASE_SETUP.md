# 数据库设置指南

本文档说明如何设置和初始化数据库。

## 前置条件

1. 已安装 PostgreSQL 14+ 数据库
2. 已配置 `.env` 文件中的 `DATABASE_URL`

## 数据库连接配置

在 `backend/.env` 文件中配置数据库连接：

```env
DATABASE_URL="postgresql://用户名:密码@localhost:5432/数据库名?schema=public"
```

示例：
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/startide_design?schema=public"
```

## 初始化步骤

### 1. 生成 Prisma Client

```bash
cd backend
npm run prisma:generate
```

这将根据 `prisma/schema.prisma` 生成 Prisma Client 代码。

### 2. 创建数据库迁移

**方式一：使用 Prisma Migrate（推荐）**

```bash
npm run prisma:migrate
```

执行后会提示输入迁移名称，建议输入 `init`。

这将：
- 创建数据库表结构
- 生成迁移文件到 `prisma/migrations/` 目录
- 自动执行迁移

**方式二：手动执行 SQL（如果 Prisma Migrate 不可用）**

如果 PostgreSQL 数据库服务器未运行，可以手动执行 SQL：

```bash
# 连接到 PostgreSQL
psql -U postgres -d startide_design

# 执行迁移 SQL
\i prisma/migrations/00_init/migration.sql
```

### 3. 初始化基础数据

```bash
npm run prisma:seed
```

这将初始化以下基础数据：

#### 角色数据（4个）
- 超级管理员 (super_admin)
- 内容审核员 (moderator)
- 运营人员 (operator)
- 普通用户 (user)

#### 权限数据（22个）
- 用户管理权限（4个）
- 资源管理权限（4个）
- 内容审核权限（3个）
- 分类管理权限（4个）
- 数据统计权限（2个）
- 内容运营权限（3个）
- 系统设置权限（2个）

#### 角色权限关联
- 超级管理员：所有权限
- 审核员：内容审核权限
- 运营人员：内容运营权限

#### 分类数据（10个）
- 党建类、节日海报类、电商类、UI设计类
- 插画类、摄影图类、背景素材类
- 字体类、图标类、模板类

#### VIP套餐数据（3个）
- VIP月卡：29.90元/30天
- VIP季卡：79.90元/90天
- VIP年卡：299.00元/365天

#### VIP特权数据（10个）
- 免费下载所有资源
- 专属VIP资源
- 优先审核
- 去除下载限制
- 去除广告
- 专属客服
- 作品置顶推广
- 高速下载通道
- 批量下载
- 收藏夹扩展

#### 积分规则数据（12条）
- 获得积分规则（9条）
- 消耗积分规则（3条）

#### 每日任务数据（5个）
- 每日签到
- 上传1个作品
- 下载3个资源
- 收藏5个作品
- 分享作品到社交媒体

#### 系统配置数据（8个）
- 网站名称、Logo
- 文件大小限制
- 下载次数限制
- 水印配置
- 功能开关

#### 测试账号（3个）
- 普通用户：13800000001 / test123456
- VIP用户：13800000002 / test123456
- 管理员：13900000000 / test123456

## 常用命令

### 查看数据库

使用 Prisma Studio 可视化查看数据库：

```bash
npm run prisma:studio
```

浏览器会自动打开 `http://localhost:5555`

### 重置数据库

如果需要重置数据库（⚠️ 会删除所有数据）：

```bash
# 删除所有表
npx prisma migrate reset

# 重新执行迁移和初始化数据
npm run prisma:migrate
npm run prisma:seed
```

### 更新数据库结构

修改 `prisma/schema.prisma` 后：

```bash
# 创建新的迁移
npm run prisma:migrate

# 重新生成 Prisma Client
npm run prisma:generate
```

## 故障排查

### 问题1：数据库连接失败

**错误信息：**
```
Error: P1001: Can't reach database server
```

**解决方案：**
1. 确认 PostgreSQL 服务已启动
2. 检查 `.env` 中的 `DATABASE_URL` 配置是否正确
3. 确认数据库用户名和密码正确
4. 确认数据库已创建

### 问题2：迁移执行失败

**错误信息：**
```
Error: P3005: The database schema is not empty
```

**解决方案：**
```bash
# 重置数据库
npx prisma migrate reset

# 或手动删除所有表后重新迁移
```

### 问题3：Seed 脚本执行失败

**错误信息：**
```
Unique constraint failed
```

**解决方案：**
- 数据已存在，seed 脚本使用 `upsert` 会自动处理
- 如果仍然失败，检查是否有数据冲突

### 问题4：密码未加密

**注意：**
当前 seed 脚本中的测试账号密码是明文存储的（仅用于开发测试）。

**生产环境解决方案：**
修改 `prisma/seed.ts`，使用 bcrypt 加密密码：

```typescript
import bcrypt from 'bcrypt';

const testPassword = bcrypt.hashSync('test123456', 10);
```

## 数据库字段命名规范

本项目严格遵守 **snake_case** 命名规范：

- 表名：`users`, `resources`, `vip_packages`
- 字段名：`user_id`, `created_at`, `vip_level`

前端使用 **camelCase**，后端通过字段转换中间件自动转换。

## 下一步

数据库初始化完成后，可以：

1. 启动后端服务：`npm run dev`
2. 使用测试账号登录测试
3. 开发业务逻辑和API接口

## 参考资料

- [Prisma 官方文档](https://www.prisma.io/docs)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [数据库设计文档](../.kiro/specs/frontend-fixes-and-backend/design.md)
