# 项目结构说明

## 目录结构

```
src/
├── api/                    # API接口定义
│   ├── auth.ts            # 认证相关接口
│   ├── resource.ts        # 资源相关接口
│   ├── upload.ts          # 上传相关接口
│   ├── content.ts         # 内容管理接口
│   ├── personal.ts        # 个人中心接口
│   └── index.ts           # 统一导出
│
├── assets/                # 静态资源
│   ├── images/           # 图片资源
│   ├── icons/            # 图标资源
│   └── styles/           # 全局样式
│       └── index.css     # Tailwind CSS + 全局样式
│
├── components/            # 公共组件
│   ├── common/           # 通用组件
│   │   ├── NetworkStatus.vue      # 网络状态提示
│   │   ├── PWAUpdatePrompt.vue    # PWA更新提示
│   │   ├── Loading.vue            # 加载动画
│   │   └── Empty.vue              # 空状态
│   ├── layout/           # 布局组件
│   │   ├── MobileLayout.vue       # 移动端布局
│   │   ├── DesktopLayout.vue      # 桌面端布局
│   │   ├── Header.vue             # 页面头部
│   │   ├── Footer.vue             # 页面底部
│   │   └── Sidebar.vue            # 侧边栏
│   └── business/         # 业务组件
│       ├── ResourceCard.vue       # 资源卡片
│       ├── SearchBar.vue          # 搜索框
│       ├── DownloadButton.vue     # 下载按钮
│       ├── UploadArea.vue         # 上传区域
│       ├── CategoryNav.vue        # 分类导航
│       └── BannerCarousel.vue     # 轮播图
│
├── composables/           # 组合式函数（业务逻辑）
│   ├── useAuth.ts        # 认证逻辑
│   ├── useUpload.ts      # 上传逻辑
│   ├── useDownload.ts    # 下载逻辑
│   ├── useSearch.ts      # 搜索逻辑
│   ├── useNetworkStatus.ts  # 网络状态监控
│   ├── useGesture.ts     # 手势交互
│   ├── useCache.ts       # 缓存管理
│   └── index.ts          # 统一导出
│
├── pinia/                 # Pinia状态管理
│   ├── userStore.ts      # 用户状态
│   ├── resourceStore.ts  # 资源状态
│   ├── configStore.ts    # 配置状态
│   └── index.ts          # 统一导出
│
├── router/                # 路由配置
│   ├── index.ts          # 路由定义
│   └── guards.ts         # 路由守卫
│
├── types/                 # TypeScript类型定义
│   ├── api.ts            # API类型
│   ├── models.ts         # 数据模型
│   └── index.ts          # 统一导出
│
├── utils/                 # 工具函数
│   ├── request.ts        # Axios封装
│   ├── security.ts       # 安全工具（XSS过滤、加密）
│   ├── validate.ts       # 验证工具
│   ├── format.ts         # 格式化工具
│   ├── constants.ts      # 全局常量
│   ├── indexedDB.ts      # IndexedDB封装
│   └── index.ts          # 统一导出
│
├── views/                 # 页面组件
│   ├── Home/             # 首页
│   │   └── index.vue
│   ├── Resource/         # 资源页面
│   │   ├── List.vue      # 资源列表
│   │   └── Detail.vue    # 资源详情
│   ├── Upload/           # 上传页面
│   │   └── index.vue
│   ├── Personal/         # 个人中心
│   │   └── index.vue
│   └── Auth/             # 认证页面
│       ├── Login.vue     # 登录
│       └── Register.vue  # 注册
│
├── App.vue               # 根组件
├── main.ts               # 入口文件
└── vite-env.d.ts         # TypeScript类型定义
```

## 模块说明

### API层 (api/)
负责与后端API通信，封装所有HTTP请求。每个模块对应一个业务领域。

**设计原则：**
- 统一使用Axios实例
- 统一响应格式处理
- 统一错误处理
- 使用TypeScript定义请求和响应类型

### 组件层 (components/)
可复用的UI组件，分为三类：

1. **通用组件 (common/)**: 与业务无关的基础组件
2. **布局组件 (layout/)**: 页面布局相关组件
3. **业务组件 (business/)**: 与业务逻辑相关的组件

**设计原则：**
- 组件单一职责
- 通过props接收数据，通过emit发送事件
- 使用TypeScript定义props和emits类型
- 支持插槽提高灵活性

### 业务逻辑层 (composables/ + pinia/)
处理业务逻辑、状态管理和数据处理。

**Composables**: 封装可复用的有状态逻辑
**Pinia Stores**: 管理全局共享状态

**设计原则：**
- Composables用于组件内部逻辑
- Stores用于跨组件共享状态
- 使用TypeScript确保类型安全
- 统一的错误处理机制

### 类型定义层 (types/)
TypeScript类型定义，确保类型安全。

**api.ts**: API相关类型（请求、响应）
**models.ts**: 数据模型类型（用户、资源等）

### 工具层 (utils/)
通用工具函数，提供基础功能支持。

**主要模块：**
- **request.ts**: Axios封装，请求/响应拦截
- **security.ts**: 安全工具（XSS过滤、加密、Token管理）
- **validate.ts**: 验证工具（手机号、邮箱、文件等）
- **format.ts**: 格式化工具（文件大小、时间、数字等）
- **constants.ts**: 全局常量定义

### 页面层 (views/)
页面级组件，对应路由。

**设计原则：**
- 页面组件只负责布局和用户交互
- 业务逻辑委托给Composables和Stores
- 使用Vue Router进行页面导航

## 数据流向

```
用户操作 → 组件事件 → Composable/Store → API调用 → 后端
                                              ↓
用户界面 ← 组件更新 ← 响应式数据 ← Store更新 ← API响应
```

## 命名规范

### 文件命名
- 组件文件：PascalCase（如：`ResourceCard.vue`）
- 工具文件：camelCase（如：`request.ts`）
- 类型文件：camelCase（如：`models.ts`）

### 代码命名
- 组件名：PascalCase（如：`ResourceCard`）
- 变量/函数：camelCase（如：`getUserInfo`）
- 常量：UPPER_SNAKE_CASE（如：`MAX_FILE_SIZE`）
- 类型/接口：PascalCase（如：`UserInfo`）

## 环境变量

### .env.development（开发环境）
```
VITE_APP_TITLE=星潮设计
VITE_API_BASE_URL=http://localhost:8080/api
VITE_CDN_BASE_URL=http://localhost:8080
```

### .env.production（生产环境）
```
VITE_APP_TITLE=星潮设计
VITE_API_BASE_URL=https://api.startide-design.com/api
VITE_CDN_BASE_URL=https://cdn.startide-design.com
```

## 构建配置

### Vite配置特性
- ✅ 路径别名：`@` 指向 `src` 目录
- ✅ API代理：开发环境自动代理 `/api` 请求
- ✅ 代码分割：按模块自动分割代码
- ✅ 资源优化：自动压缩、Tree Shaking
- ✅ 环境变量：支持多环境配置

### 代码分割策略
- **vue-vendor**: Vue核心库（vue, vue-router, pinia）
- **element-plus**: UI组件库
- **utils**: 工具库（axios, dayjs, crypto-js等）

## 开发规范

### TypeScript
- 启用strict模式
- 所有函数必须定义参数和返回值类型
- 避免使用any类型
- 使用interface定义数据结构

### ESLint
- 遵循Vue 3推荐规则
- 遵循TypeScript推荐规则
- 自动修复可修复的问题

### Prettier
- 统一代码格式
- 单引号、分号、2空格缩进
- 提交前自动格式化

## 下一步开发

按照tasks.md中的任务顺序，接下来需要实现：

1. **阶段1：基础架构**
   - ✅ 任务1：初始化项目脚手架
   - ✅ 任务2：配置项目结构
   - ⏳ 任务3：实现核心工具函数
   - ⏳ 任务4：实现Axios网络层
   - ⏳ 任务5：基础架构验证

2. **阶段2：数据模型和API接口定义**
3. **阶段3：状态管理（Pinia Stores）**
4. **阶段4：业务逻辑层（Composables）**
5. **后续阶段...**
