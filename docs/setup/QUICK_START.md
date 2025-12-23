# 后端快速开始指南

## 环境要求

- Node.js 18+ LTS
- PostgreSQL 14+
- Redis 7.x (可选，用于缓存和队列)

## 安装步骤

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息。

### 3. 初始化数据库

```bash
# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充初始数据
npm run prisma:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:8080` 启动。

## 测试

### 健康检查

```bash
curl http://localhost:8080/health
```

### 运行自动化测试

```bash
node test-middleware.cjs
```

## 开发指南

### 1. 创建新的API路由

在 `src/routes/` 目录下创建路由文件：

```typescript
// src/routes/user.ts
import { Router } from 'express';
import { success, error } from '@/utils/response.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // 业务逻辑
    const users = await getUsersFromDatabase();
    success(res, users, '获取用户列表成功');
  } catch (err) {
    error(res, '获取用户列表失败', 500);
  }
});

export default router;
```

在 `src/app.ts` 中注册路由：

```typescript
import userRoutes from '@/routes/user.js';
app.use('/api/users', userRoutes);
```

### 2. 字段名转换

**数据库字段使用 snake_case，前端字段使用 camelCase**

中间件会自动转换，无需手动处理：

```typescript
// 前端发送: { userId: "123", userName: "Test" }
// 后端接收: { user_id: "123", user_name: "Test" }

// 数据库返回: { user_id: "123", user_name: "Test" }
// 前端接收: { userId: "123", userName: "Test" }
```

### 3. 统一响应格式

使用 `response.success()` 和 `response.error()`：

```typescript
import { success, error, page } from '@/utils/response.js';

// 成功响应
success(res, data, '操作成功');

// 错误响应
error(res, '操作失败', 400);

// 分页响应
page(res, list, total, pageNum, pageSize, '查询成功');
```

### 4. 错误处理

直接抛出错误，中间件会自动捕获：

```typescript
router.get('/', async (req, res) => {
  // 不需要try-catch，中间件会自动处理
  const user = await getUserById(req.params.id);
  if (!user) {
    throw new Error('用户不存在');
  }
  success(res, user);
});
```

### 5. 日志记录

使用 `logger` 记录日志：

```typescript
import { logger } from '@/utils/logger.js';

logger.info('用户登录成功', { userId: '123' });
logger.warn('密码错误次数过多', { userId: '123' });
logger.error('数据库连接失败', { error: err.message });
```

## 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器（处理HTTP请求）
│   ├── services/        # 业务逻辑
│   ├── models/          # 数据模型
│   ├── middlewares/     # 中间件
│   ├── routes/          # 路由
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript类型
│   └── app.ts           # 应用入口
├── prisma/              # Prisma配置
│   ├── schema.prisma    # 数据库模型
│   └── seed.ts          # 初始数据
├── logs/                # 日志文件
├── .env                 # 环境变量
└── package.json
```

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器（热重载）

# 构建
npm run build            # 编译TypeScript

# 生产
npm start                # 启动生产服务器

# 数据库
npm run prisma:generate  # 生成Prisma客户端
npm run prisma:migrate   # 运行数据库迁移
npm run prisma:studio    # 打开Prisma Studio
npm run prisma:seed      # 填充初始数据

# 代码质量
npm run lint             # 运行ESLint
npm run format           # 格式化代码
```

## 调试

### VS Code调试配置

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## 常见问题

### 1. 端口被占用

修改 `.env` 文件中的 `PORT` 配置。

### 2. 数据库连接失败

检查 `.env` 文件中的 `DATABASE_URL` 配置是否正确。

### 3. 字段名转换不生效

确保中间件已在 `app.ts` 中正确注册：

```typescript
app.use(requestFieldTransform);
app.use(responseFieldTransform);
```

### 4. 日志文件过大

日志文件会自动轮转，最大5MB，保留5个文件。

## 更多信息

- [完整文档](./TASK7_COMPLETION_SUMMARY.md)
- [数据库设计](../docs/DATABASE.md)
- [API文档](../docs/API.md)
