# 构建脚本使用指南

## 📦 NPM Scripts 说明

### 开发环境

```bash
# 启动开发服务器（支持局域网访问）
npm run dev

# 类型检查（不生成文件）
npm run type-check
```

### 构建命令

```bash
# 标准构建（类型检查 + 生产构建）
npm run build

# 开发环境构建（保留console，不压缩）
npm run build:dev

# 生产环境构建（移除console，完全压缩）
npm run build:prod

# 构建并分析包体积
npm run build:analyze
```

### 预览构建产物

```bash
# 预览构建后的应用（端口4173）
npm run preview

# 预览dist目录
npm run preview:dist
```

### 测试命令

```bash
# 运行所有测试（单次运行）
npm run test

# 监听模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage

# 使用UI界面运行测试
npm run test:ui
```

### 代码质量

```bash
# 自动修复代码风格问题
npm run lint

# 仅检查代码风格（不修复）
npm run lint:check

# 格式化代码
npm run format

# 检查代码格式（不修复）
npm run format:check
```

### 工具命令

```bash
# 验证环境变量配置
npm run verify-env

# 清理构建缓存和产物
npm run clean

# 安装依赖后自动验证环境
npm run prepare
```

---

## 🏗️ Vite 构建配置详解

### 构建目标

- **target**: `es2015` - 支持现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）
- **outDir**: `dist` - 构建产物输出目录
- **assetsDir**: `assets` - 静态资源子目录

### 代码压缩

使用 **Terser** 进行代码压缩，配置如下：

- ✅ 移除 `console.log`、`console.debug`、`console.info`、`console.warn`
- ✅ 移除 `debugger` 语句
- ✅ 移除死代码（dead code）
- ✅ 优化布尔值、条件语句、循环
- ✅ 混淆变量名（mangle）
- ✅ 移除所有注释

**开发环境构建**时可以保留console：
```bash
npm run build:dev
```

### 代码分割策略

#### 第三方库分包

| 包名 | 大小（约） | 说明 |
|------|-----------|------|
| `vue-vendor` | 200KB | Vue 3 + Vue Router + Pinia |
| `element-plus` | 500KB | Element Plus UI组件库 |
| `utils` | 100KB | axios、dayjs、crypto-js等工具库 |
| `pwa` | 50KB | Workbox PWA相关库 |
| `vendor` | 变动 | 其他第三方库 |

#### 业务代码分包

| 包名 | 说明 |
|------|------|
| `components-business` | 业务组件（ResourceCard、SearchBar等） |
| `components-common` | 通用组件（Loading、Empty等） |
| `components-layout` | 布局组件（Header、Footer等） |
| `composables` | 组合式函数 |
| `stores` | Pinia状态管理 |
| `app-utils` | 应用工具函数 |

### 文件命名策略

构建后的文件使用 **hash** 命名，实现长期缓存：

```
dist/
├── js/
│   ├── main-[hash].js          # 主入口
│   ├── vue-vendor-[hash].js    # Vue核心库
│   ├── element-plus-[hash].js  # UI组件库
│   └── ...
├── css/
│   └── main-[hash].css         # 样式文件
├── images/
│   └── logo-[hash].png         # 图片资源
├── fonts/
│   └── font-[hash].woff2       # 字体文件
└── index.html
```

### Tree Shaking 优化

- ✅ 启用模块副作用检测
- ✅ 移除未使用的导出
- ✅ 移除未使用的代码
- ✅ 使用推荐预设（preset: 'recommended'）

### CSS 优化

- ✅ CSS代码分割（每个组件单独打包）
- ✅ CSS压缩
- ✅ 自动添加浏览器前缀（PostCSS + Autoprefixer）

---

## 📊 构建产物分析

### 查看构建大小

构建完成后会自动显示各文件大小：

```bash
npm run build

# 输出示例：
dist/js/vue-vendor-abc123.js      185.23 kB │ gzip: 68.45 kB
dist/js/element-plus-def456.js    456.78 kB │ gzip: 145.32 kB
dist/js/main-ghi789.js            89.12 kB  │ gzip: 32.15 kB
```

### 包体积优化目标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 主应用（main.js） | < 200KB | gzip后 |
| 首屏加载总大小 | < 500KB | gzip后 |
| 单个chunk | < 500KB | 原始大小 |

### 分析工具（可选）

如需详细分析，可以安装可视化工具：

```bash
# 安装分析工具
npm install -D rollup-plugin-visualizer

# 在vite.config.ts中添加插件
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  visualizer({
    open: true,
    gzipSize: true,
    brotliSize: true
  })
]
```

---

## 🚀 部署流程

### 1. 环境变量配置

确保已配置生产环境变量：

```bash
# 检查环境变量
npm run verify-env

# 如果缺失，复制并编辑
cp .env.example .env.production
```

### 2. 执行构建

```bash
# 清理旧构建
npm run clean

# 执行生产构建
npm run build
```

### 3. 本地预览

```bash
# 预览构建产物
npm run preview

# 访问 http://localhost:4173
```

### 4. 部署到服务器

```bash
# 将dist目录上传到服务器
scp -r dist/* user@server:/var/www/html/

# 或使用CI/CD自动部署
```

---

## ⚙️ 构建优化建议

### 1. 减小包体积

- ✅ 使用按需导入（Element Plus已配置）
- ✅ 移除未使用的依赖
- ✅ 使用轻量级替代库
- ✅ 图片压缩和WebP格式

### 2. 提升加载速度

- ✅ 启用HTTP/2
- ✅ 启用Gzip/Brotli压缩
- ✅ 配置CDN加速
- ✅ 使用Service Worker缓存

### 3. 优化首屏加载

- ✅ 路由懒加载（已配置）
- ✅ 组件懒加载（defineAsyncComponent）
- ✅ 图片懒加载（vue3-lazy）
- ✅ 预加载关键资源

### 4. 长期缓存策略

- ✅ 文件名使用hash（已配置）
- ✅ 配置Nginx缓存策略
- ✅ 使用Service Worker缓存

---

## 🐛 常见问题

### Q1: 构建时内存溢出

```bash
# 增加Node.js内存限制
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Q2: 类型检查失败

```bash
# 跳过类型检查直接构建
vite build

# 或修复类型错误后再构建
npm run type-check
npm run build
```

### Q3: 构建速度慢

- 禁用 `reportCompressedSize`
- 使用 `esbuild` 替代 `terser`（速度更快但压缩率略低）
- 减少 `manualChunks` 的复杂度

### Q4: 构建产物过大

- 检查是否有重复依赖
- 使用 `rollup-plugin-visualizer` 分析
- 考虑使用CDN引入大型库

---

## 📝 环境变量说明

### 开发环境 (.env.development)

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_TITLE=星潮设计（开发）
```

### 生产环境 (.env.production)

```env
VITE_API_BASE_URL=https://api.startide-design.com
VITE_APP_TITLE=星潮设计
VITE_CDN_BASE_URL=https://cdn.startide-design.com
```

---

## 🔗 相关文档

- [Vite 官方文档](https://vitejs.dev/)
- [Rollup 配置指南](https://rollupjs.org/guide/en/)
- [Terser 压缩选项](https://terser.org/docs/api-reference)
- [环境变量配置指南](./ENV_CONFIGURATION_GUIDE.md)

---

## ✅ 构建检查清单

部署前请确认：

- [ ] 环境变量已正确配置
- [ ] 所有测试通过（`npm run test`）
- [ ] 代码风格检查通过（`npm run lint:check`）
- [ ] 类型检查通过（`npm run type-check`）
- [ ] 构建成功（`npm run build`）
- [ ] 本地预览正常（`npm run preview`）
- [ ] 包体积符合预期（< 500KB gzip）
- [ ] 首屏加载时间 < 2秒
- [ ] Lighthouse评分 > 90分

---

**最后更新**: 2024-12-20
**维护者**: 星潮设计开发团队
