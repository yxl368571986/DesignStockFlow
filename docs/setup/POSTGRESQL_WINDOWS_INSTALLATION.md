# PostgreSQL Windows 安装与配置指南

## 问题诊断

经过检查，系统中**没有安装PostgreSQL**。需要完整安装PostgreSQL数据库。

## 安装步骤

### 1. 下载PostgreSQL

访问PostgreSQL官方下载页面：
- 官方下载地址：https://www.postgresql.org/download/windows/
- 推荐使用EDB安装程序：https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

**推荐版本**：PostgreSQL 14.x 或 15.x（稳定版本）

### 2. 运行安装程序

1. 双击下载的安装程序（例如：`postgresql-14.10-1-windows-x64.exe`）
2. 点击"Next"开始安装

### 3. 安装配置选项

#### 3.1 选择安装目录
- 默认路径：`C:\Program Files\PostgreSQL\14`
- 可以保持默认，或选择其他路径

#### 3.2 选择组件
**必须勾选以下组件**：
- ✅ PostgreSQL Server（数据库服务器）
- ✅ pgAdmin 4（图形化管理工具）
- ✅ Stack Builder（可选，用于安装额外工具）
- ✅ Command Line Tools（命令行工具，包含psql）

#### 3.3 选择数据目录
- 默认路径：`C:\Program Files\PostgreSQL\14\data`
- 建议保持默认

#### 3.4 设置超级用户密码
- 用户名：`postgres`（默认超级用户）
- **密码**：设置一个强密码并记住（例如：`postgres123`）
- ⚠️ **重要**：请务必记住这个密码，后续配置需要使用

#### 3.5 设置端口
- 默认端口：`5432`
- 建议保持默认，除非端口被占用

#### 3.6 选择区域设置
- 建议选择：`Chinese (Simplified), China` 或 `Default locale`

### 4. 完成安装

1. 点击"Next"开始安装
2. 等待安装完成（约5-10分钟）
3. 安装完成后，**勾选"Launch Stack Builder"**（可选）
4. 点击"Finish"完成安装

### 5. 验证安装

#### 5.1 检查Windows服务

打开命令提示符（以管理员身份运行），执行：

```cmd
sc query postgresql-x64-14
```

应该看到服务状态为"RUNNING"。

#### 5.2 检查PostgreSQL版本

```cmd
psql --version
```

应该显示类似：`psql (PostgreSQL) 14.10`

**如果提示"psql不是内部或外部命令"**，需要添加环境变量：

1. 右键"此电脑" → "属性" → "高级系统设置" → "环境变量"
2. 在"系统变量"中找到"Path"，点击"编辑"
3. 添加PostgreSQL的bin目录：`C:\Program Files\PostgreSQL\14\bin`
4. 点击"确定"保存
5. **重新打开命令提示符**，再次测试

### 6. 启动PostgreSQL服务

如果服务未启动，使用以下命令：

```cmd
net start postgresql-x64-14
```

或者通过服务管理器：
1. 按 `Win + R`，输入 `services.msc`
2. 找到 `postgresql-x64-14` 服务
3. 右键 → "启动"

### 7. 连接到PostgreSQL

使用psql命令行工具连接：

```cmd
psql -U postgres
```

输入之前设置的密码，成功连接后会看到：

```
postgres=#
```

### 8. 创建项目数据库

在psql命令行中执行：

```sql
-- 创建数据库
CREATE DATABASE startide_design;

-- 查看数据库列表
\l

-- 退出psql
\q
```

## 配置项目环境变量

### 1. 编辑 backend/.env 文件

```env
# 数据库连接（修改密码为你设置的密码）
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/startide_design?schema=public"

# 示例（如果密码是postgres123）
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/startide_design?schema=public"
```

### 2. 初始化数据库

在backend目录下执行：

```cmd
cd backend

# 1. 生成Prisma Client
npm run prisma:generate

# 2. 执行数据库迁移
npm run prisma:migrate

# 3. 初始化基础数据
npm run prisma:seed
```

## 常见问题解决

### 问题1：端口5432被占用

**解决方案**：
1. 查看占用端口的进程：
   ```cmd
   netstat -ano | findstr :5432
   ```
2. 修改PostgreSQL端口：
   - 编辑 `C:\Program Files\PostgreSQL\14\data\postgresql.conf`
   - 找到 `port = 5432`，修改为其他端口（如5433）
   - 重启PostgreSQL服务
   - 更新 `.env` 中的端口号

### 问题2：服务无法启动

**解决方案**：
1. 检查日志文件：`C:\Program Files\PostgreSQL\14\data\log\`
2. 常见原因：
   - 数据目录权限问题
   - 端口被占用
   - 配置文件错误

### 问题3：忘记postgres密码

**解决方案**：
1. 停止PostgreSQL服务
2. 编辑 `C:\Program Files\PostgreSQL\14\data\pg_hba.conf`
3. 将所有 `md5` 改为 `trust`
4. 重启服务
5. 使用 `psql -U postgres` 连接（无需密码）
6. 修改密码：
   ```sql
   ALTER USER postgres WITH PASSWORD '新密码';
   ```
7. 恢复 `pg_hba.conf` 的 `md5` 设置
8. 重启服务

### 问题4：pgAdmin无法连接

**解决方案**：
1. 确认PostgreSQL服务已启动
2. 检查连接参数：
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: 你设置的密码
3. 检查防火墙设置

## 图形化管理工具

### pgAdmin 4（已随PostgreSQL安装）

1. 打开pgAdmin 4（开始菜单中搜索）
2. 首次打开需要设置主密码
3. 左侧"Servers" → 右键 → "Create" → "Server"
4. 配置连接：
   - Name: Local PostgreSQL
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: 你的密码
5. 保存后即可管理数据库

### DBeaver（推荐，功能更强大）

1. 下载：https://dbeaver.io/download/
2. 安装后创建新连接
3. 选择PostgreSQL
4. 配置连接参数
5. 测试连接成功后保存

## 下一步

安装完成后，继续执行：

1. ✅ 验证PostgreSQL服务运行正常
2. ✅ 创建项目数据库
3. ✅ 配置 `.env` 文件
4. ✅ 执行数据库迁移和初始化
5. ✅ 启动后端服务测试

## 参考资料

- PostgreSQL官方文档：https://www.postgresql.org/docs/
- Windows安装指南：https://www.postgresql.org/docs/current/install-windows.html
- pgAdmin文档：https://www.pgadmin.org/docs/

---

**安装完成后，请执行以下命令验证**：

```cmd
# 1. 检查服务状态
sc query postgresql-x64-14

# 2. 检查版本
psql --version

# 3. 连接数据库
psql -U postgres -d startide_design

# 4. 查看表（在psql中执行）
\dt
```

如果一切正常，你应该能看到项目的数据库表结构。
