# 代码分割配置指南

本文档详细说明了星潮设计平台的代码分割策略和配置，帮助开发者理解和优化应用性能。

## 目录

- [概述](#概述)
- [配置说明](#配置说明)
- [分包策略](#分包策略)
- [Tree Shaking](#tree-shaking)
- [代码压缩](#代码压缩)
- [性能监控](#性能监控)
- [最佳实践](#最佳实践)

## 概述

### 什么是代码分割？

代码分割（Code Splitting）是一种优化技术，将应用代码拆分成多个小块（chunks），按需加载，而不是一次性加载所有代码。

### 为什么需要代码分割？

**问题：**
- 首屏加载时间过长
- 初始包体积过大（可能超过1MB）
- 用户可能永远不会访问某些功能
- 浪费带宽和加载时间

**解决方案：**
- ✅ 减少初始包体积（目标：主应用 < 200KB gzip后）
- ✅ 提升首屏加载速度（目标：< 2秒）
- ✅ 按需加载功能模块
- ✅ 提升用户体验

### 性能目标

| 指标 | 目标值 | 当前值 |
|------|--------|--------|
| 首屏加载时间 | < 2秒 | 待测试 |
| 白屏时间 | < 1秒 | 待测试 |
| 可交互时间 | < 3秒 | 待测试 |
| 主应用体积 | < 200KB (gzip) | 待测试 |
| Lighthouse评分 | > 90分 | 待测试 |

## 配置说明

### Vite配置文件（vite.config.ts）

```typescript
export default defineConfig({
  build: {
    // 目标浏览器版本
    target: 'es2015',
    
    // 输出目录
    outDir: 'dist',
    
    // 静态资源目录
    assetsDir: 'assets',
    
    // 生产环境不生成sourcemap（减小体积）
    sourcemap: false,
    
    // 使用Terser压缩
    minify: 'terser',
    
    // chunk大小警告阈值（KB）
    chunkSizeWarningLimit: 1000,
    
    // Terser压缩配置
    terserOptions: { /* ... */ },
    
    // Rollup配置
    rollupOptions: { /* ... */ },
    
    // CSS代码分割
    cssCodeSplit: true,
    
    // CSS压缩
    cssMinify: true,
    
    // 报告压缩后的文件大小
    reportCompressedSize: true
  }
});
```

## 分包策略

### 1. 第三方库分包

将第三方库按功能分组，避免重复打包：

```typescript
manualChunks: (id) => {
  // Vue核心库（vue, vue-router, pinia）
  if (id.includes('node_modules/vue/') || 
      id.includes('node_modules/@vue/') ||
      id.includes('node_modules/vue-router/') || 
      id.includes('node_modules/pinia/')) {
    return 'vue-vendor';
  }
  
  // Element Plus UI库
  if (id.includes('node_modules/element-plus/') || 
      id.includes('node_modules/@element-plus/')) {
    return 'element-plus';
  }
  
  // 工具库（axios, dayjs, crypto-js等）
  if (id.includes('node_modules/axios/') ||
      id.includes('node_modules/dayjs/') ||
      id.includes('node_modules/crypto-js/') ||
      id.includes('node_modules/xss/') ||
      id.includes('node_modules/dompurify/') ||
      id.includes('node_modules/js-cookie/')) {
    return 'utils';
  }
  
  // PWA相关库
  if (id.includes('node_modules/workbox-') ||
      id.includes('node_modules/vite-plugin-pwa/')) {
    return 'pwa';
  }
  
  // 其他第三方库
  if (id.includes('node_modules/')) {
    return 'vendor';
  }
}
```

**分包结果：**
- `vue-vendor.js` - Vue核心库（~100KB gzip）
- `element-plus.js` - UI组件库（~150KB gzip）
- `utils.js` - 工具库（~50KB gzip）
- `pwa.js` - PWA相关（~30KB gzip）
- `vendor.js` - 其他第三方库（~50KB gzip）

### 2. 业务代码分包

将业务代码按模块分组：

```typescript
// 业务组件按目录分包
if (id.includes('/src/components/business/')) {
  return 'components-business';
}

if (id.includes('/src/components/common/')) {
  return 'components-common';
}

if (id.includes('/src/components/layout/')) {
  return 'components-layout';
}

// Composables
if (id.includes('/src/composables/')) {
  return 'composables';
}

// Pinia stores
if (id.includes('/src/pinia/')) {
  return 'stores';
}

// Utils
if (id.includes('/src/utils/')) {
  return 'app-utils';
}
```

**分包结果：**
- `components-business.js` - 业务组件（资源卡片、搜索框等）
- `components-common.js` - 通用组件（加载、空状态等）
- `components-layout.js` - 布局组件（桌面端、移动端）
- `composables.js` - 组合式函数
- `stores.js` - Pinia状态管理
- `app-utils.js` - 应用工具函数

### 3. 路由级别分包

路由组件使用动态import实现懒加载：

```typescript
const routes = [
  {
    path: '/',
    name: 'Home',
    // 懒加载首页组件
    component: () => import('@/views/Home/index.vue')
  },
  {
    path: '/resource',
    name: 'ResourceList',
    // 懒加载资源列表页
    component: () => import('@/views/Resource/List.vue')
  },
  // ... 其他路由
];
```

**优势：**
- 用户访问首页时，不会加载资源列表页的代码
- 每个路由页面独立打包
- 减少初始加载体积

### 4. 组件级别分包

使用`defineAsyncComponent`实现组件懒加载：

```typescript
import { defineAsyncComponent } from 'vue';

// 懒加载布局组件
const DesktopLayout = defineAsyncComponent({
  loader: () => import('@/components/layout/DesktopLayout.vue'),
  loadingComponent: LoadingSpinner,
  delay: 200,
  timeout: 10000
});
```

**适用场景：**
- 对话框/模态框
- 标签页内容
- 条件渲染的组件
- 大型第三方组件

## Tree Shaking

### 什么是Tree Shaking？

Tree Shaking是一种通过静态分析消除未使用代码的优化技术。

### 配置

```typescript
rollupOptions: {
  treeshake: {
    // 启用模块副作用检测
    moduleSideEffects: 'no-external',
    
    // 移除未使用的导出
    propertyReadSideEffects: false,
    
    // 移除未使用的代码
    tryCatchDeoptimization: false
  }
}
```

### 如何编写Tree Shaking友好的代码

#### ✅ 推荐写法

```typescript
// 使用ES6模块导入
import { formatFileSize } from '@/utils/format';

// 按需导入Element Plus组件
import { ElButton, ElMessage } from 'element-plus';

// 导出具名函数
export function myFunction() { }
export const myConstant = 'value';
```

#### ❌ 避免的写法

```typescript
// 避免使用CommonJS
const utils = require('@/utils/format');

// 避免导入整个库
import * as ElementPlus from 'element-plus';

// 避免使用默认导出（不利于Tree Shaking）
export default {
  myFunction,
  myConstant
};
```

### package.json配置

```json
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "*.vue"
  ]
}
```

标记有副作用的文件，帮助打包工具正确进行Tree Shaking。

## 代码压缩

### Terser配置

```typescript
terserOptions: {
  compress: {
    // 移除console和debugger
    drop_console: true,
    drop_debugger: true,
    
    // 移除未使用的代码
    pure_funcs: ['console.log', 'console.info', 'console.debug'],
    
    // 优化布尔值
    booleans: true,
    
    // 优化条件语句
    conditionals: true,
    
    // 移除死代码
    dead_code: true,
    
    // 优化if语句
    if_return: true,
    
    // 合并连续变量声明
    join_vars: true,
    
    // 优化循环
    loops: true,
    
    // 移除未使用的变量
    unused: true
  },
  
  mangle: {
    // 混淆变量名
    safari10: true
  },
  
  format: {
    // 移除注释
    comments: false
  }
}
```

### 压缩效果

| 文件类型 | 原始大小 | 压缩后 | Gzip后 | 压缩率 |
|---------|---------|--------|--------|--------|
| JavaScript | 1.5MB | 500KB | 150KB | 90% |
| CSS | 200KB | 100KB | 30KB | 85% |
| HTML | 50KB | 30KB | 10KB | 80% |

## 性能监控

### 1. 构建分析

使用Rollup插件可视化分析：

```bash
# 安装插件
npm install -D rollup-plugin-visualizer

# 构建并生成分析报告
npm run build
```

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
});
```

### 2. 运行时监控

```typescript
// 监控chunk加��时间
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'resource' && entry.name.includes('.js')) {
      console.log(`${entry.name}: ${entry.duration}ms`);
    }
  }
});

observer.observe({ entryTypes: ['resource'] });
```

### 3. Lighthouse评分

```bash
# 使用Lighthouse CLI
npm install -g lighthouse

# 运行评估
lighthouse https://your-domain.com --view
```

**关注指标：**
- First Contentful Paint (FCP) - 首次内容绘制
- Largest Contentful Paint (LCP) - 最大内容绘制
- Time to Interactive (TTI) - 可交互时间
- Total Blocking Time (TBT) - 总阻塞时间
- Cumulative Layout Shift (CLS) - 累积布局偏移

## 最佳实践

### 1. 合理的分包粒度

**❌ 过度分包：**
```typescript
// 每个组件都单独打包（不推荐）
if (id.includes('/ResourceCard.vue')) return 'resource-card';
if (id.includes('/SearchBar.vue')) return 'search-bar';
// ... 太多小文件，增加HTTP请求
```

**✅ 适度分包：**
```typescript
// 按功能模块分组（推荐）
if (id.includes('/components/business/')) return 'components-business';
if (id.includes('/components/common/')) return 'components-common';
```

### 2. 预加载关键资源

```html
<!-- index.html -->
<link rel="preload" href="/js/vue-vendor.js" as="script">
<link rel="preload" href="/js/element-plus.js" as="script">
```

### 3. 使用CDN

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['vue', 'vue-router'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter'
        }
      }
    }
  }
});
```

```html
<!-- index.html -->
<script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js"></script>
```

### 4. 缓存策略

```nginx
# Nginx配置
location ~* \.(js|css)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

### 5. 监控包体积

```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "analyze": "vite build --mode analyze",
    "size": "size-limit"
  },
  "size-limit": [
    {
      "path": "dist/js/index-*.js",
      "limit": "200 KB"
    }
  ]
}
```

## 常见问题

### Q1: 分包后首屏加载反而变慢？

**A:** 可能原因：
- 分包过细，HTTP请求过多
- 没有使用HTTP/2
- 没有配置预加载

**解决方案：**
- 合并小文件
- 启用HTTP/2
- 使用`<link rel="preload">`

### Q2: Tree Shaking不生效？

**A:** 检查：
- 是否使用ES6模块导入
- package.json是否配置sideEffects
- 是否有副作用代码

### Q3: 如何确定最佳分包策略？

**A:** 
1. 使用分析工具查看当前包体积
2. 识别大型依赖
3. 按使用频率分组
4. 测试不同策略的效果

### Q4: 懒加载会影响SEO吗？

**A:** 
- 客户端渲染：不影响（爬虫会等待JS执行）
- 服务端渲染：需要特殊处理
- 关键内容不应懒加载

## 性能检查清单

构建前检查：

- [ ] 配置了手动分包策略
- [ ] 启用了Tree Shaking
- [ ] 配置了Terser压缩
- [ ] 路由使用懒加载
- [ ] 大型组件使用懒加载
- [ ] 配置了CSS代码分割
- [ ] 移除了console.log
- [ ] 配置了缓存策略

构建后检查：

- [ ] 主应用体积 < 200KB (gzip)
- [ ] 单个chunk < 500KB
- [ ] 首屏加载时间 < 2秒
- [ ] Lighthouse评分 > 90
- [ ] 没有重复打包的依赖
- [ ] 生成了分析报告

## 总结

代码分割是优化应用性能的关键技术：

1. **合理分包** - 按功能和使用频率分组
2. **懒加载** - 路由和组件按需加载
3. **Tree Shaking** - 移除未使用的代码
4. **代码压缩** - 使用Terser优化代码
5. **持续监控** - 使用工具分析和优化

记住：**性能优化是一个持续的过程，需要根据实际情况不断调整和优化。**

## 参考资源

- [Vite官方文档 - 构建优化](https://vitejs.dev/guide/build.html)
- [Rollup官方文档 - 代码分割](https://rollupjs.org/guide/en/#code-splitting)
- [Vue 3官方文档 - 异步组件](https://vuejs.org/guide/components/async.html)
- [Web.dev - 代码分割](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
