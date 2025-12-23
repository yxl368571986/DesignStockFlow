# PostgreSQL 安装与配置文档索引

## 📋 问题诊断

**问题**：PostgreSQL没有安装为Windows服务

**状态**：✅ 已确认 - PostgreSQL未安装

**诊断工具**：运行 `check-postgres.ps1` 脚本

```powershell
cd backend
.\check-postgres.ps1
```

---

## 📚 文档导航

### 🚀 快速开始（推荐）

| 文档 | 用途 | 适合人群 |
|------|------|----------|
| **[POSTGRESQL_QUICK_FIX.md](./POSTGRESQL_QUICK_FIX.md)** | 5步快速安装指南 | ⭐ 新手首选 |
| **[POSTGRESQL_ISSUE_RESOLVED.md](./POSTGRESQL_ISSUE_RESOLVED.md)** | 问题诊断与解决方案 | 遇到问题时查看 |

### 📖 详细文档

| 文档 | 用途 | 适合人群 |
|------|------|----------|
| [POSTGRESQL_WINDOWS_INSTALLATION.md](./POSTGRESQL_WINDOWS_INSTALLATION.md) | 完整安装指南 | 需要详细步骤 |
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | 数据库设置指南 | 安装后配置 |
| [QUICK_START_DATABASE.md](./QUICK_START_DATABASE.md) | 数据库快速启动 | 快速初始化 |

### 🛠️ 辅助工具

| 工具 | 用途 | 使用方法 |
|------|------|----------|
| `check-postgres.ps1` | 检查PostgreSQL安装状态 | `.\check-postgres.ps1` |
| `install-postgresql.ps1` | 安装引导脚本（有编码问题） | 不推荐使用 |

---

## 🎯 快速解决方案

### 方案1：使用快速修复指南（推荐）

```powershell
# 1. 查看快速修复指南
notepad backend/POSTGRESQL_QUICK_FIX.md

# 2. 下载PostgreSQL
# 访问：https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

# 3. 安装PostgreSQL（按照指南操作）

# 4. 验证安装
.\check-postgres.ps1

# 5. 创建数据库
psql -U postgres -c "CREATE DATABASE startide_design;"

# 6. 配置项目
# 编辑 backend/.env 文件

# 7. 初始化数据库
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 方案2：查看详细安装指南

```powershell
# 查看完整安装文档
notepad backend/POSTGRESQL_WINDOWS_INSTALLATION.md
```

---

## 📝 安装步骤概览

### 1️⃣ 下载PostgreSQL

- 官方下载：https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
- 推荐版本：PostgreSQL 14.10 或 15.5
- 平台：Windows x86-64

### 2️⃣ 安装PostgreSQL

- 勾选所有组件（Server, pgAdmin, Command Line Tools）
- 设置postgres用户密码（**务必记住**）
- 端口：5432（默认）
- 区域：Chinese (Simplified), China

### 3️⃣ 验证安装

```cmd
# 检查版本
psql --version

# 检查服务
sc query postgresql-x64-14

# 或运行检查脚本
.\check-postgres.ps1
```

### 4️⃣ 创建数据库

```cmd
psql -U postgres
CREATE DATABASE startide_design;
\l
\q
```

### 5️⃣ 配置项目

编辑 `backend/.env`：

```env
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/startide_design?schema=public"
```

### 6️⃣ 初始化数据库

```cmd
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

---

## ✅ 验证安装成功

运行以下命令，全部成功即表示安装正确：

```cmd
# 1. 检查版本
psql --version
# 应显示：psql (PostgreSQL) 14.x

# 2. 检查服务
sc query postgresql-x64-14
# 应显示：STATE: 4 RUNNING

# 3. 连接数据库
psql -U postgres -d startide_design
# 应成功进入psql命令行

# 4. 查看表（在psql中）
\dt
# 应显示项目的数据库表

# 5. 退出
\q
```

---

## 🔧 常见问题

### Q1: psql命令不可用？

**解决**：添加到PATH环境变量
- 路径：`C:\Program Files\PostgreSQL\14\bin`
- 添加后**重新打开命令提示符**

### Q2: 服务无法启动？

**解决**：
```cmd
net start postgresql-x64-14
```

### Q3: 忘记postgres密码？

**解决**：查看 [POSTGRESQL_QUICK_FIX.md](./POSTGRESQL_QUICK_FIX.md) 的"常见问题"部分

### Q4: 端口5432被占用？

**解决**：
```cmd
netstat -ano | findstr :5432
# 修改PostgreSQL配置文件中的端口
```

---

## 🎨 图形化管理工具

### pgAdmin 4（已随PostgreSQL安装）
- 位置：开始菜单 → pgAdmin 4
- 功能：数据库可视化管理

### DBeaver（推荐）
- 下载：https://dbeaver.io/download/
- 优点：功能强大，界面友好

---

## 📞 获取帮助

如果遇到问题：

1. 查看 [POSTGRESQL_ISSUE_RESOLVED.md](./POSTGRESQL_ISSUE_RESOLVED.md)
2. 运行 `check-postgres.ps1` 诊断
3. 查看PostgreSQL日志：`C:\Program Files\PostgreSQL\14\data\log\`
4. 访问PostgreSQL官方文档：https://www.postgresql.org/docs/

---

## 🎯 下一步

安装完成后：

1. ✅ 启动后端服务：`npm run dev`
2. ✅ 访问健康检查：http://localhost:8080/health
3. ✅ 使用测试账号登录测试
4. ✅ 继续开发业务功能

---

## 📌 重要提示

1. **记住密码**：postgres用户密码务必记住
2. **重启终端**：安装后需要重新打开命令提示符
3. **防火墙**：确保允许PostgreSQL（端口5432）
4. **备份数据**：生产环境定期备份数据库

---

**最后更新**：2024年12月21日

**维护者**：项目开发团队

**版本**：1.0
