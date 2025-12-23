# 数据库快速启动指南

## 🚀 5分钟完成数据库初始化

本指南帮助你快速完成数据库的设置和初始化。

---

## 前置条件

- ✅ 已安装 Node.js 18+
- ✅ 已安装 PostgreSQL 14+
- ✅ 已安装项目依赖 (`npm install`)

---

## 步骤1: 启动 PostgreSQL 数据库

### Windows

```bash
# 使用服务管理器启动
net start postgresql-x64-14

# 或使用 pg_ctl
pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start
```

### macOS

```bash
# 使用 Homebrew
brew services start postgresql@14

# 或使用 pg_ctl
pg_ctl -D /usr/local/var/postgres start
```

### Linux

```bash
sudo systemctl start postgresql
```

---

## 步骤2: 创建数据库

```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE startide_design;

# 退出
\q
```

---

## 步骤3: 配置环境变量

编辑 `backend/.env` 文件（如果不存在则创建）：

```env
# 数据库连接
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/startide_design?schema=public"

# JWT密钥
JWT_SECRET="your-secret-key-change-in-production"

# 其他配置...
```

**重要**: 将 `your_password` 替换为你的 PostgreSQL 密码！

---

## 步骤4: 执行数据库初始化

```bash
cd backend

# 1. 生成 Prisma Client
npm run prisma:generate

# 2. 执行数据库迁移（创建表结构）
npm run prisma:migrate
# 提示输入迁移名称时，输入: init

# 3. 初始化基础数据
npm run prisma:seed
```

---

## 步骤5: 验证数据

```bash
# 打开 Prisma Studio 可视化查看数据
npm run prisma:studio
```

浏览器会自动打开 `http://localhost:5555`

检查以下表是否有数据：
- ✅ roles (4条)
- ✅ permissions (22条)
- ✅ categories (10条)
- ✅ vip_packages (3条)
- ✅ users (3条测试账号)

---

## 🎉 完成！

数据库初始化成功！你现在可以：

1. **启动后端服务**:
   ```bash
   npm run dev
   ```

2. **使用测试账号登录**:
   - 普通用户: `13800000001` / `test123456`
   - VIP用户: `13800000002` / `test123456`
   - 管理员: `13900000000` / `test123456`

---

## ⚠️ 常见问题

### 问题1: 数据库连接失败

**错误**: `P1001: Can't reach database server`

**解决**:
1. 确认 PostgreSQL 服务已启动
2. 检查 `.env` 中的 `DATABASE_URL` 是否正确
3. 确认数据库 `startide_design` 已创建

### 问题2: 迁移执行失败

**错误**: `P3005: The database schema is not empty`

**解决**:
```bash
# 重置数据库
npx prisma migrate reset
```

### 问题3: Seed 脚本执行失败

**错误**: `Unique constraint failed`

**解决**:
- Seed 脚本可以重复执行，使用 `upsert` 会自动处理已存在的数据
- 如果仍然失败，尝试重置数据库后重新执行

---

## 📚 详细文档

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 完整的数据库设置指南
- [TASK6_VERIFICATION.md](./TASK6_VERIFICATION.md) - 详细的验证清单
- [TASK6_COMPLETION_SUMMARY.md](./TASK6_COMPLETION_SUMMARY.md) - 任务完成总结

---

## 🔧 高级操作

### 重置数据库

```bash
# 删除所有表并重新迁移
npx prisma migrate reset

# 重新初始化数据
npm run prisma:seed
```

### 查看数据库结构

```bash
# 连接到数据库
psql -U postgres -d startide_design

# 查看所有表
\dt

# 查看特定表结构
\d users
```

### 备份数据库

```bash
# 导出数据库
pg_dump -U postgres startide_design > backup.sql

# 恢复数据库
psql -U postgres startide_design < backup.sql
```

---

## 💡 提示

1. **开发环境**: 可以使用 Prisma Studio 可视化管理数据
2. **生产环境**: 记得修改测试账号密码并使用 bcrypt 加密
3. **数据备份**: 定期备份生产环境数据库
4. **性能优化**: 根据实际使用情况调整索引

---

## 下一步

数据库初始化完成后，继续开发：

1. ✅ 任务6: 数据库设计与初始化（已完成）
2. ⏭️ 任务7: 后端核心架构搭建
3. ⏭️ 任务8: 实现认证服务
4. ⏭️ 任务9: 实现权限控制系统

祝开发顺利！🚀
