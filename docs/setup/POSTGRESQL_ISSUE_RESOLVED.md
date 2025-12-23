# PostgreSQL 问题诊断与解决方案

## 问题确认

✅ **已确认问题**：PostgreSQL **没有安装**在此Windows系统上

### 诊断结果

通过运行 `check-postgres.ps1` 脚本，确认：
- ❌ PostgreSQL安装目录不存在（`C:\Program Files\PostgreSQL`）
- ❌ psql命令不可用
- ❌ PostgreSQL Windows服务不存在

## 解决方案

### 快速解决（推荐）

按照以下步骤完成PostgreSQL安装：

#### 步骤1：下载PostgreSQL

访问官方下载页面：
```
https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
```

选择：
- **版本**：PostgreSQL 14.10 或 15.5（推荐14.10）
- **平台**：Windows x86-64

#### 步骤2：安装PostgreSQL

1. 运行下载的安装程序
2. 安装组件（全部勾选）：
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ✅ Command Line Tools
   - ✅ Stack Builder（可选）

3. **重要配置**：
   - 端口：`5432`（默认）
   - postgres用户密码：设置并**记住**（例如：`postgres123`）
   - 数据目录：默认即可
   - 区域：`Chinese (Simplified), China` 或 `Default locale`

#### 步骤3：验证安装

安装完成后，打开**新的**命令提示符或PowerShell：

```powershell
# 检查版本
psql --version

# 检查服务
sc query postgresql-x64-14

# 或运行检查脚本
cd backend
.\check-postgres.ps1
```

#### 步骤4：创建项目数据库

```cmd
# 连接到PostgreSQL
psql -U postgres

# 输入密码后执行
CREATE DATABASE startide_design;

# 验证数据库
\l

# 退出
\q
```

#### 步骤5：配置项目

编辑 `backend/.env` 文件：

```env
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/startide_design?schema=public"
```

例如，如果密码是 `postgres123`：

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/startide_design?schema=public"
```

#### 步骤6：初始化数据库

```cmd
cd backend

# 生成Prisma Client
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate

# 初始化基础数据
npm run prisma:seed
```

## 验证安装成功

执行以下命令验证：

```cmd
# 1. 检查PostgreSQL版本
psql --version
# 应显示：psql (PostgreSQL) 14.x

# 2. 检查服务状态
sc query postgresql-x64-14
# 应显示：STATE: 4 RUNNING

# 3. 连接数据库
psql -U postgres -d startide_design
# 应成功进入psql命令行

# 4. 查看数据库表（在psql中）
\dt
# 应显示项目的所有表

# 5. 退出
\q
```

## 可用的辅助工具

### 1. 检查脚本

```powershell
cd backend
.\check-postgres.ps1
```

此脚本会检查：
- PostgreSQL安装状态
- psql命令可用性
- Windows服务状态

### 2. 图形化管理工具

#### pgAdmin 4（已随PostgreSQL安装）
- 位置：开始菜单 → pgAdmin 4
- 首次打开需设置主密码
- 添加服务器连接即可使用

#### DBeaver（推荐）
- 下载：https://dbeaver.io/download/
- 功能更强大，界面更友好
- 支持多种数据库

## 相关文档

| 文档 | 说明 |
|------|------|
| `POSTGRESQL_QUICK_FIX.md` | 快速修复指南（5步完成） |
| `POSTGRESQL_WINDOWS_INSTALLATION.md` | 详细安装指南 |
| `DATABASE_SETUP.md` | 数据库设置指南 |
| `QUICK_START_DATABASE.md` | 数据库快速启动 |
| `check-postgres.ps1` | PostgreSQL检查脚本 |

## 常见问题

### Q1: psql命令不可用？

**原因**：PostgreSQL的bin目录未添加到系统PATH

**解决**：
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

或通过服务管理器（`services.msc`）手动启动

### Q3: 端口5432被占用？

**解决**：
```cmd
# 查看占用进程
netstat -ano | findstr :5432

# 修改PostgreSQL端口
# 编辑 C:\Program Files\PostgreSQL\14\data\postgresql.conf
# 修改 port = 5432 为其他端口
# 重启服务
# 更新 .env 中的端口号
```

### Q4: 忘记postgres密码？

**解决**：
1. 停止服务：`net stop postgresql-x64-14`
2. 编辑 `C:\Program Files\PostgreSQL\14\data\pg_hba.conf`
3. 将所有 `md5` 改为 `trust`
4. 启动服务：`net start postgresql-x64-14`
5. 连接并修改密码：
   ```sql
   psql -U postgres
   ALTER USER postgres WITH PASSWORD '新密码';
   \q
   ```
6. 恢复 `pg_hba.conf` 的 `md5` 设置
7. 重启服务

## 安装后的下一步

1. ✅ 验证PostgreSQL服务运行正常
2. ✅ 创建项目数据库 `startide_design`
3. ✅ 配置 `backend/.env` 文件
4. ✅ 执行数据库迁移和初始化
5. ✅ 启动后端服务测试

```cmd
cd backend
npm run dev
```

访问：http://localhost:8080/health

应该返回：
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "uptime": 123.456,
  "environment": "development"
}
```

## 总结

- **问题根源**：PostgreSQL未安装
- **解决方案**：下载并安装PostgreSQL 14.x
- **预计时间**：15-20分钟
- **难度等级**：简单（按步骤操作即可）

---

**重要提示**：
1. 安装时务必记住postgres用户的密码
2. 安装完成后需要重新打开命令提示符
3. 确保防火墙允许PostgreSQL（端口5432）
4. 建议使用pgAdmin或DBeaver进行可视化管理

如有其他问题，请查看相关文档或PostgreSQL官方文档。
