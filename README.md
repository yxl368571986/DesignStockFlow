# 星潮设计 - 设计资源下载平台

专业的设计资源分享平台，支持PSD、AI、CDR等多种设计文件格式。

## 技术栈

- **核心框架**: Vue 3.4+ (Composition API) + Vite 5.0+ + TypeScript 5.3+
- **UI组件库**: Element Plus 2.5+ + Tailwind CSS 3.4+
- **状态管理**: Pinia 2.1+
- **路由管理**: Vue Router 4.2+
- **网络请求**: Axios 1.6+ + axios-retry 4.0+
- **安全防护**: xss + DOMPurify + js-cookie + crypto-js

## 开发环境搭建

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

### 代码格式化

```bash
npm run format
```

## 项目结构

```
src/
├── api/                    # API接口定义
├── assets/                # 静态资源
│   ├── images/           # 图片资源
│   ├── icons/            # 图标资源
│   └── styles/           # 全局样式
├── components/            # 公共组件
│   ├── common/           # 通用组件
│   ├── layout/           # 布局组件
│   └── business/         # 业务组件
├── composables/           # 组合式函数
├── pinia/                 # Pinia状态管理
├── router/                # 路由配置
├── types/                 # TypeScript类型定义
├── utils/                 # 工具函数
├── views/                 # 页面组件
├── App.vue               # 根组件
└── main.ts               # 入口文件
```

## 测试

### 运行测试

```bash
# 运行所有测试
npm test

# Watch模式（开发时推荐）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 使用安全脚本（Windows）
.\scripts\testing\run-tests-safe.ps1
```

详细测试文档请查看 [docs/testing/](./docs/testing/)

## 文档

项目文档已按功能分类组织，详见 [docs/README.md](./docs/README.md)

> 📌 **最近更新**：文档已重新整理，新增安装配置、验证文档等分类。详见 [文件整理总结](./docs/CLEANUP_SUMMARY.md)

### 快速导航

- 📖 [项目文档](./docs/project/) - 项目结构、交付文档
- 🔧 [安装配置](./docs/setup/) - 安装指南、数据库设置
- ✅ [验证文档](./docs/verification/) - 验证检查清单
- 🧪 [测试文档](./docs/testing/) - 测试指南、修复报告
- 🔨 [后端任务](./docs/backend-tasks/) - 后端开发任务文档
- 🚀 [部署文档](./docs/deployment/) - 构建、部署、CI/CD
- 🔒 [安全文档](./docs/security/) - 安全指南、验证清单
- ⚡ [性能文档](./docs/performance/) - 性能优化指南
- 📋 [前端任务](./docs/tasks/) - 前端任务详细文档

## 开发规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 代码规范
- 组件使用 PascalCase 命名
- 文件使用 kebab-case 命名
- 提交代码前运行 lint 和 format

## License

Copyright © 2024 星潮设计
