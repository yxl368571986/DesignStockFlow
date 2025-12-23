# 后端项目安装指南

## 前置要求

在开始之前，请确保您的系统已安装以下软件：

### 必需软件

1. **Node.js** (v18.0.0 或更高版本)
   - 下载地址: https://nodejs.org/
   - 验证安装: `node --version`

2. **npm** (v9.0.0 或更高版本，通常随Node.js一起安装)
   - 验证安装: `npm --version`

3. **PostgreSQL** (v14.0 或更高版本)
   - 下载地址: https://www.postgresql.org/download/
   - 验证安装: `psql --version`

4. **Redis** (v7.0 或更高版本)
   - Windows: https://github.com/tporadowski/redis/releases
   - 验证安装: `redis-cli --version`

### 可选软件

- **Git**: 用于版本控制
- **Postman** 或 **Apifox**: 用于API测试

## 安装步骤

### 1. 克隆或进入项目目录

```bash
cd backend
```

### 2. 安装依赖

```bash
npm install
```

如果安装速度较慢，可以使用国内镜像：

```bash
npm install --registry=https://registry.npmmirror.com
```

### 3. 配置环境变量

复制环境变量示例文件：

```bash
# Windows (CMD)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

编辑 `.env` 文件，配置以下关键参数：

```env
# 数据库配置（必须）
DATABASE_URL="postgresql://用户名:密码@localhost:5432/数据库名?schema=public"

# JWT密钥（必须，建议使用随机字符串）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Redis配置（必须）
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS配置（必须，前端地址）
CORS_ORIGIN=http://localhost:5173
```

### 4. 创建数据库

使用 PostgreSQL 命令行或图形工具创建数据库：

```sql
-- 连接到PostgreSQL
psql -U postgres

-- 创建数据库
CREATE DATABASE startide_design;

-- 创建用户（可选）
CREATE USER startide_user WITH PASSWORD 'your_password';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE startide_design TO startide_user;

-- 退出
\q
```

### 5. 初始化Prisma

```bash
# 生成Prisma Client
npm run prisma:generate

# 运行数据库迁移（在任务6中会创建schema）
# npm run prisma:migrate
```

### 6. 启动开发服务器

```bash
npm run dev
```

如果一切正常，您应该看到类似以下的输出：

```
🚀 Server is running on http://0.0.0.0:8080
📝 Environment: development
🔗 Health check: http://0.0.0.0:8080/health
📚 API endpoint: http://0.0.0.0:8080/api
```

### 7. 验证安装

打开浏览器或使用curl访问健康检查接口：

```bash
curl http://localhost:8080/health
```

应该返回类似以下的JSON响应：

```json
{
  "status": "ok",
  "timestamp": 1703001234567,
  "uptime": 123.456,
  "environment": "development"
}
```

## 常见问题

### 问题1: 依赖安装失败

**症状**: `npm install` 报错

**解决方案**:
1. 清除npm缓存: `npm cache clean --force`
2. 删除 `node_modules` 和 `package-lock.json`
3. 重新安装: `npm install`

### 问题2: 数据库连接失败

**症状**: 启动时报错 "Can't reach database server"

**解决方案**:
1. 确认PostgreSQL服务已启动
2. 检查 `DATABASE_URL` 配置是否正确
3. 确认数据库已创建
4. 测试连接: `psql -U postgres -d startide_design`

### 问题3: Redis连接失败

**症状**: 启动时报错 "Redis connection failed"

**解决方案**:
1. 确认Redis服务已启动
   - Windows: 检查服务管理器中的Redis服务
   - Linux/Mac: `redis-cli ping` 应返回 "PONG"
2. 检查 `REDIS_HOST` 和 `REDIS_PORT` 配置

### 问题4: 端口被占用

**症状**: 启动时报错 "Port 8080 is already in use"

**解决方案**:
1. 修改 `.env` 文件中的 `PORT` 配置
2. 或者关闭占用端口的程序

### 问题5: TypeScript编译错误

**症状**: 启动时报TypeScript错误

**解决方案**:
1. 确认Node.js版本 >= 18
2. 删除 `dist` 目录
3. 重新构建: `npm run build`

## 开发工具推荐

### 1. 数据库管理工具

- **DBeaver**: 免费开源，支持多种数据库
  - 下载: https://dbeaver.io/download/
- **pgAdmin**: PostgreSQL官方工具
  - 下载: https://www.pgadmin.org/download/

### 2. API测试工具

- **Postman**: 功能强大的API测试工具
  - 下载: https://www.postman.com/downloads/
- **Apifox**: 国产API工具，支持中文
  - 下载: https://www.apifox.cn/

### 3. Redis管理工具

- **Redis Desktop Manager**: Redis可视化管理
  - 下载: https://resp.app/
- **RedisInsight**: Redis官方工具
  - 下载: https://redis.com/redis-enterprise/redis-insight/

## 下一步

安装完成后，您可以：

1. 查看 [README.md](./README.md) 了解项目结构和功能
2. 继续执行任务6：数据库设计与初始化
3. 开始开发API接口

## 获取帮助

如果遇到问题，可以：

1. 查看项目文档
2. 检查日志文件 `logs/error.log`
3. 提交Issue到项目仓库

祝您开发顺利！🎉
