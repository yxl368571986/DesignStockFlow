# PostgreSQL 快速修复指南

## 问题确认

✅ **已确认**：系统中**没有安装PostgreSQL**

## 快速解决方案

### 方案1：自动检查脚本（推荐）

在backend目录下运行PowerShell脚本：

```powershell
cd backend
.\install-postgresql.ps1
```

此脚本会：
- 检查PostgreSQL安装状态
- 检查服务运行状态
- 引导你完成安装
- 自动配置环境变量（可选）

### 方案2：手动安装（5步完成）

#### 第1步：下载PostgreSQL

访问官方下载页面：
```
https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
```

选择：
- **版本**：PostgreSQL 14.10 或 15.5
- **平台**：Windows x86-64

#### 第2步：安装PostgreSQL

1. 运行下载的安装程序（例如：`postgresql-14.10-1-windows-x64.exe`）
2. 安装选项：
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ✅ Command Line Tools
   - ✅ Stack Builder（可选）
3. **重要**：设置postgres用户密码（例如：`postgres123`）
   - ⚠️ 请务必记住这个密码！
4. 端口：保持默认 `5432`
5. 区域：选择 `Chinese (Simplified), China` 或 `Default locale`

#### 第3步：验证安装

打开新的命令提示符（CMD）或PowerShell：

```cmd
# 检查版本
psql --version

# 检查服务
sc query postgresql-x64-14
```

如果提示"psql不是内部或外部命令"，需要添加环境变量：
- 路径：`C:\Program Files\PostgreSQL\14\bin`
- 添加到系统PATH后，**重新打开命令提示符**

#### 第4步：创建项目数据库

```cmd
# 连接到PostgreSQL
psql -U postgres

# 输入密码后，执行以下SQL
CREATE DATABASE startide_design;

# 查看数据库
\l

# 退出
\q
```

#### 第5步：配置项目

编辑 `backend/.env` 文件：

```env
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/startide_design?schema=public"
```

例如，如果密码是 `postgres123`：

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/startide_design?schema=public"
```

然后初始化数据库：

```cmd
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## 常见问题

### Q1: 安装后psql命令不可用？

**解决**：添加到PATH环境变量
1. 右键"此电脑" → "属性" → "高级系统设置" → "环境变量"
2. 编辑"系统变量"中的"Path"
3. 添加：`C:\Program Files\PostgreSQL\14\bin`
4. 保存后**重新打开命令提示符**

### Q2: 服务无法启动？

**解决**：
```cmd
# 以管理员身份运行
net start postgresql-x64-14
```

或通过服务管理器：
1. Win + R → 输入 `services.msc`
2. 找到 `postgresql-x64-14`
3. 右键 → "启动"

### Q3: 忘记postgres密码？

**解决**：
1. 停止服务：`net stop postgresql-x64-14`
2. 编辑 `C:\Program Files\PostgreSQL\14\data\pg_hba.conf`
3. 将所有 `md5` 改为 `trust`
4. 启动服务：`net start postgresql-x64-14`
5. 连接并修改密码：
   ```sql
   psql -U postgres
   ALTER USER postgres WITH PASSWORD '新密码';
   ```
6. 恢复 `pg_hba.conf` 的 `md5` 设置
7. 重启服务

### Q4: 端口5432被占用？

**解决**：
```cmd
# 查看占用进程
netstat -ano | findstr :5432

# 修改PostgreSQL端口
# 编辑 C:\Program Files\PostgreSQL\14\data\postgresql.conf
# 找到 port = 5432，改为其他端口（如5433）
# 重启服务
# 更新 .env 中的端口号
```

## 验证安装成功

执行以下命令，全部成功即表示安装正确：

```cmd
# 1. 检查版本
psql --version
# 应显示：psql (PostgreSQL) 14.x

# 2. 检查服务
sc query postgresql-x64-14
# 应显示：STATE: 4 RUNNING

# 3. 连接数据库
psql -U postgres -d startide_design
# 应进入psql命令行

# 4. 查看表（在psql中）
\dt
# 应显示项目的数据库表
```

## 图形化管理工具

### pgAdmin 4（已随PostgreSQL安装）

1. 开始菜单搜索"pgAdmin 4"
2. 首次打开设置主密码
3. 添加服务器连接：
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: 你的密码

### DBeaver（推荐）

更强大的数据库管理工具：
- 下载：https://dbeaver.io/download/
- 支持多种数据库
- 界面友好，功能丰富

## 相关文档

- 📖 详细安装指南：`backend/POSTGRESQL_WINDOWS_INSTALLATION.md`
- 📖 数据库设置指南：`backend/DATABASE_SETUP.md`
- 📖 快速启动指南：`backend/QUICK_START_DATABASE.md`

## 获取帮助

如果遇到其他问题：
1. 查看PostgreSQL日志：`C:\Program Files\PostgreSQL\14\data\log\`
2. 查看项目文档
3. 访问PostgreSQL官方文档：https://www.postgresql.org/docs/

---

**安装完成后，记得更新 `.env` 文件并运行数据库初始化命令！**
