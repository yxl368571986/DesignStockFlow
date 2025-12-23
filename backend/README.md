# 星潮设计资源平台 - 后端服务

## 项目简介

星潮设计资源平台后端服务，基于 Node.js + Express + TypeScript + Prisma + PostgreSQL 构建。

## 技术栈

- **运行环境**: Node.js 18+ LTS
- **Web框架**: Express.js 4.18+
- **数据库**: PostgreSQL 14+
- **ORM**: Prisma 5.x
- **认证**: JWT (jsonwebtoken) + bcrypt
- **缓存**: Redis 7.x
- **任务队列**: Bull 4.x
- **文件存储**: Multer + 本地存储/阿里云OSS
- **支付**: 微信支付SDK + 支付宝SDK
- **语言**: TypeScript 5.3+

## 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── services/        # 业务逻辑
│   ├── models/          # 数据模型
│   ├── middlewares/     # 中间件
│   ├── routes/          # 路由
│   ├── utils/           # 工具函数
│   ├── types/           # 类型定义
│   └── app.ts           # 入口文件
├── prisma/              # Prisma配置
│   └── schema.prisma    # 数据库模型
├── uploads/             # 文件上传目录
├── logs/                # 日志目录
├── .env                 # 环境变量
├── .env.example         # 环境变量示例
├── package.json
├── tsconfig.json
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

主要配置项：
- `DATABASE_URL`: PostgreSQL数据库连接字符串
- `JWT_SECRET`: JWT密钥
- `REDIS_HOST`: Redis主机地址
- `CORS_ORIGIN`: 允许的跨域来源

### 3. 初始化数据库

```bash
# 生成Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# (可选) 打开Prisma Studio查看数据
npm run prisma:studio
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:8080` 启动。

### 5. 构建生产版本

```bash
npm run build
npm start
```

## 核心功能

### 已实现功能

- ✅ 基础项目结构
- ✅ 环境配置管理
- ✅ 日志系统 (Winston)
- ✅ 统一响应格式
- ✅ 全局错误处理
- ✅ 请求日志记录
- ✅ 字段名转换中间件 (snake_case ↔ camelCase)
- ✅ 安全响应头 (Helmet)
- ✅ CORS跨域配置
- ✅ 请求限流 (Rate Limiting)
- ✅ 健康检查接口

### 待实现功能

- ⏳ 数据库模型设计 (Prisma Schema)
- ⏳ 用户认证系统 (JWT)
- ⏳ 权限控制系统 (RBAC)
- ⏳ 用户管理API
- ⏳ 资源管理API
- ⏳ 文件上传下载
- ⏳ 内容审核系统
- ⏳ VIP功能管理
- ⏳ 积分系统
- ⏳ 支付功能
- ⏳ 通知系统

## API文档

### 健康检查

```
GET /health
```

响应示例：
```json
{
  "status": "ok",
  "timestamp": 1703001234567,
  "uptime": 123.456,
  "environment": "development"
}
```

### API根路径

```
GET /api
```

响应示例：
```json
{
  "message": "星潮设计资源平台 API",
  "version": "1.0.0",
  "docs": "/api/docs"
}
```

## 字段名转换说明

为了保持数据库命名规范（snake_case）和前端命名规范（camelCase）的一致性，后端实现了自动字段名转换：

- **请求**: 前端发送的 camelCase 字段会自动转换为 snake_case
- **响应**: 数据库返回的 snake_case 字段会自动转换为 camelCase

示例：
```javascript
// 前端发送
{ userId: "123", userName: "张三" }

// 后端接收（自动转换）
{ user_id: "123", user_name: "张三" }

// 数据库返回
{ user_id: "123", user_name: "张三", created_at: "2024-01-01" }

// 前端接收（自动转换）
{ userId: "123", userName: "张三", createdAt: "2024-01-01" }
```

## 开发规范

### 代码风格

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 TypeScript 严格模式

### 提交规范

```bash
# 运行代码检查
npm run lint

# 运行代码格式化
npm run format
```

### 日志规范

使用 Winston 记录日志，日志级别：
- `error`: 错误信息
- `warn`: 警告信息
- `info`: 一般信息
- `debug`: 调试信息

## 环境变量说明

详见 `.env.example` 文件，主要配置项：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务端口 | 8080 |
| DATABASE_URL | 数据库连接 | - |
| JWT_SECRET | JWT密钥 | - |
| REDIS_HOST | Redis主机 | localhost |
| CORS_ORIGIN | 跨域来源 | http://localhost:5173 |

## 常见问题

### 1. 数据库连接失败

检查 `DATABASE_URL` 配置是否正确，确保 PostgreSQL 服务已启动。

### 2. 端口被占用

修改 `.env` 文件中的 `PORT` 配置。

### 3. CORS错误

检查 `CORS_ORIGIN` 配置是否包含前端地址。

## 许可证

MIT License
