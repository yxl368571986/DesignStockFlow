# 环境变量配置指南

## 📋 目录

- [概述](#概述)
- [文件说明](#文件说明)
- [配置项详解](#配置项详解)
- [使用方法](#使用方法)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 概述

本项目使用 Vite 的环境变量系统来管理不同环境下的配置。环境变量文件位于项目根目录，以 `.env` 开头。

### 环境变量文件列表

| 文件名 | 用途 | 是否提交到Git |
|--------|------|--------------|
| `.env.development` | 开发环境配置 | ❌ 不提交 |
| `.env.production` | 生产环境配置 | ❌ 不提交 |
| `.env.example` | 配置模板 | ✅ 提交 |

---

## 文件说明

### .env.development（开发环境）

用于本地开发环境，启动命令：`npm run dev`

**特点：**
- API地址指向本地后端（localhost:8080）
- 启用调试模式和详细日志
- 禁用PWA功能（避免缓存干扰开发）
- 允许跨域请求（localhost多端口）

### .env.production（生产环境）

用于生产环境部署，构建命令：`npm run build`

**特点：**
- API地址指向生产服务器
- 关闭调试模式
- 启用PWA功能
- 启用性能监控和错误追踪
- 移除console日志

### .env.example（配置模板）

环境变量配置模板，包含所有可配置项和详细说明。

**使用方法：**
```bash
# 复制模板创建开发环境配置
cp .env.example .env.development

# 复制模板创建生产环境配置
cp .env.example .env.production
```

---

## 配置项详解

### 1. 应用基础配置

```bash
# 应用标题（显示在浏览器标签页）
VITE_APP_TITLE=星潮设计

# 应用版本号
VITE_APP_VERSION=1.0.0

# 运行环境标识
VITE_APP_ENV=development
```

**说明：**
- `VITE_APP_TITLE`: 网站标题，显示在浏览器标签页和PWA应用名称
- `VITE_APP_VERSION`: 应用版本号，用于版本管理和缓存控制
- `VITE_APP_ENV`: 环境标识，可选值：development/production/staging

### 2. API配置

```bash
# API基础URL（后端接口地址）
VITE_API_BASE_URL=http://localhost:8080/api

# API请求超时时间（毫秒）
VITE_API_TIMEOUT=10000
```

**说明：**
- `VITE_API_BASE_URL`: 后端API的基础地址
  - 开发环境：`http://localhost:8080/api`
  - 生产环境：`https://api.startide-design.com/api`
- `VITE_API_TIMEOUT`: 请求超时时间，默认10秒

### 3. CDN配置

```bash
# CDN基础URL（静态资源地址）
VITE_CDN_BASE_URL=http://localhost:8080

# 图片CDN地址
VITE_IMAGE_CDN_URL=http://localhost:8080/images
```

**说明：**
- `VITE_CDN_BASE_URL`: 静态资源CDN地址
- `VITE_IMAGE_CDN_URL`: 图片专用CDN地址（可选）

### 4. 文件上传配置

```bash
# 单个文件最大大小（字节）
VITE_MAX_FILE_SIZE=1048576000

# 分片上传的分片大小（字节）
VITE_CHUNK_SIZE=10485760

# 分片上传阈值（字节）
VITE_CHUNK_THRESHOLD=104857600

# 支持的文件格式
VITE_ALLOWED_FILE_TYPES=PSD,AI,CDR,EPS,SKETCH,XD,FIGMA,SVG,PNG,JPG,JPEG,WEBP
```

**说明：**
- `VITE_MAX_FILE_SIZE`: 单个文件最大1000MB（1048576000字节）
- `VITE_CHUNK_SIZE`: 每个分片10MB（10485760字节）
- `VITE_CHUNK_THRESHOLD`: 超过100MB启用分片上传
- `VITE_ALLOWED_FILE_TYPES`: 允许上传的文件格式（逗号分隔）

### 5. 功能开关

```bash
# 是否启用Mock数据
VITE_ENABLE_MOCK=false

# 是否启用PWA功能
VITE_ENABLE_PWA=false

# 是否启用调试模式
VITE_ENABLE_DEBUG=true

# 是否显示性能监控
VITE_ENABLE_PERFORMANCE=true

# 是否启用错误追踪
VITE_ENABLE_ERROR_TRACKING=true
```

**说明：**
- `VITE_ENABLE_MOCK`: 使用Mock数据（开发环境可启用）
- `VITE_ENABLE_PWA`: 启用PWA功能（生产环境建议开启）
- `VITE_ENABLE_DEBUG`: 调试模式（生产环境必须关闭）
- `VITE_ENABLE_PERFORMANCE`: 性能监控
- `VITE_ENABLE_ERROR_TRACKING`: 错误追踪

### 6. 安全配置

```bash
# CSRF防护 - 允许的请求来源
VITE_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8080

# Token存储方式
VITE_TOKEN_STORAGE=cookie

# Token过期时间（天）
VITE_TOKEN_EXPIRE_DAYS=7
```

**说明：**
- `VITE_ALLOWED_ORIGINS`: CSRF防护白名单（逗号分隔）
- `VITE_TOKEN_STORAGE`: Token存储方式（cookie推荐，更安全）
- `VITE_TOKEN_EXPIRE_DAYS`: Token有效期（天）

### 7. 缓存配置

```bash
# 资源列表缓存时间（分钟）
VITE_CACHE_RESOURCE_LIST=5

# 网站配置缓存时间（分钟）
VITE_CACHE_SITE_CONFIG=30

# 分类列表缓存时间（分钟）
VITE_CACHE_CATEGORIES=10
```

**说明：**
- 配置各类数据的缓存时间，单位为分钟
- 合理的缓存时间可以减少API请求，提升性能

### 8. 第三方服务配置

```bash
# 微信登录AppID
VITE_WECHAT_APP_ID=

# 支付宝AppID
VITE_ALIPAY_APP_ID=
```

**说明：**
- 第三方服务的AppID配置
- 需要在对应平台申请后填入

### 9. 日志配置

```bash
# 日志级别
VITE_LOG_LEVEL=debug

# 是否上报日志到服务器
VITE_LOG_REPORT=false

# 日志上报地址
VITE_LOG_REPORT_URL=https://api.startide-design.com/api/log/report
```

**说明：**
- `VITE_LOG_LEVEL`: 日志级别（debug/info/warn/error）
- `VITE_LOG_REPORT`: 是否上报日志
- `VITE_LOG_REPORT_URL`: 日志上报接口地址

---

## 使用方法

### 1. 在代码中访问环境变量

#### 方式一：直接访问（基础用法）

```typescript
// 直接访问环境变量
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const appTitle = import.meta.env.VITE_APP_TITLE;

console.log('API地址:', apiUrl);
console.log('应用标题:', appTitle);
```

#### 方式二：使用工具函数（推荐）

```typescript
import { getApiConfig, getAppConfig, ENV_CONFIG } from '@/utils/env';

// 获取API配置
const apiConfig = getApiConfig();
console.log('API基础URL:', apiConfig.baseURL);
console.log('API超时时间:', apiConfig.timeout);

// 获取应用配置
const appConfig = getAppConfig();
console.log('应用标题:', appConfig.title);
console.log('应用版本:', appConfig.version);
console.log('是否开发环境:', appConfig.isDev);

// 使用统一配置对象
console.log('所有配置:', ENV_CONFIG);
```

#### 方式三：类型安全访问

```typescript
import { getEnvString, getEnvNumber, getEnvBoolean, getEnvArray } from '@/utils/env';

// 获取字符串类型
const apiUrl = getEnvString('VITE_API_BASE_URL', '/api');

// 获取数字类型
const timeout = getEnvNumber('VITE_API_TIMEOUT', 10000);

// 获取布尔类型
const enableDebug = getEnvBoolean('VITE_ENABLE_DEBUG', false);

// 获取数组类型
const allowedOrigins = getEnvArray('VITE_ALLOWED_ORIGINS', []);
```

### 2. 在Vite配置中使用

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd());

  return {
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true
        }
      }
    }
  };
});
```

### 3. 环境变量验证

```typescript
// main.ts
import { validateEnv, printEnvConfig } from '@/utils/env';

// 验证必需的环境变量
try {
  validateEnv();
  console.log('✅ 环境变量验证通过');
} catch (error) {
  console.error('❌ 环境变量验证失败:', error);
}

// 打印环境变量配置（仅开发环境）
printEnvConfig();
```

---

## 最佳实践

### 1. 安全性

✅ **推荐做法：**
- 不要在环境变量中存储敏感密钥（如私钥、密码）
- 使用 `.gitignore` 忽略 `.env.development` 和 `.env.production`
- 敏感配置放在后端，前端通过API获取

❌ **避免做法：**
```bash
# ❌ 不要这样做
VITE_DATABASE_PASSWORD=123456
VITE_SECRET_KEY=abc123xyz
```

### 2. 命名规范

✅ **推荐做法：**
- 所有环境变量必须以 `VITE_` 开头
- 使用大写字母和下划线（UPPER_SNAKE_CASE）
- 变量名要清晰表达含义

```bash
# ✅ 好的命名
VITE_API_BASE_URL=http://localhost:8080/api
VITE_MAX_FILE_SIZE=1048576000

# ❌ 不好的命名
VITE_URL=http://localhost:8080
VITE_SIZE=1000
```

### 3. 默认值处理

✅ **推荐做法：**
```typescript
// 提供默认值，避免undefined
const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const timeout = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;
```

### 4. 类型转换

✅ **推荐做法：**
```typescript
// 环境变量都是字符串，需要类型转换
const maxSize = Number(import.meta.env.VITE_MAX_FILE_SIZE);
const enableDebug = import.meta.env.VITE_ENABLE_DEBUG === 'true';
const allowedTypes = import.meta.env.VITE_ALLOWED_FILE_TYPES.split(',');
```

### 5. 环境判断

✅ **推荐做法：**
```typescript
import { isDevelopment, isProduction } from '@/utils/env';

if (isDevelopment()) {
  console.log('开发环境');
}

if (isProduction()) {
  console.log('生产环境');
}
```

---

## 常见问题

### Q1: 修改环境变量后不生效？

**A:** 修改环境变量后需要重启开发服务器：
```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
npm run dev
```

### Q2: 如何查看当前的环境变量？

**A:** 在浏览器控制台输入：
```javascript
console.log(import.meta.env);
```

或使用工具函数：
```typescript
import { printEnvConfig } from '@/utils/env';
printEnvConfig();
```

### Q3: 环境变量为什么是undefined？

**A:** 可能的原因：
1. 变量名拼写错误（区分大小写）
2. 没有以 `VITE_` 开头
3. 环境变量文件不存在或路径错误
4. 修改后没有重启开发服务器

### Q4: 如何在不同环境使用不同配置？

**A:** Vite会根据运行模式自动加载对应的环境文件：
```bash
# 开发环境（自动加载 .env.development）
npm run dev

# 生产环境（自动加载 .env.production）
npm run build

# 自定义环境（加载 .env.staging）
npm run build -- --mode staging
```

### Q5: 前端环境变量安全吗？

**A:** 前端环境变量会被打包到代码中，用户可见。因此：
- ✅ 可以存储：API地址、CDN地址、功能开关
- ❌ 不能存储：密码、私钥、敏感密钥

### Q6: 如何在生产环境修改配置？

**A:** 两种方式：
1. 修改 `.env.production` 后重新构建
2. 使用服务器环境变量（需要配置构建工具）

### Q7: 环境变量的优先级？

**A:** 优先级从高到低：
1. `.env.[mode].local`（本地覆盖，不提交Git）
2. `.env.[mode]`（环境特定配置）
3. `.env.local`（本地覆盖，不提交Git）
4. `.env`（通用配置）

---

## 相关文件

- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置
- `.env.example` - 配置模板
- `src/types/env.d.ts` - 环境变量类型定义
- `src/utils/env.ts` - 环境变量工具函数

---

## 参考资料

- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [Vue 3 官方文档](https://vuejs.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)

---

**最后更新时间：** 2024-12-20
