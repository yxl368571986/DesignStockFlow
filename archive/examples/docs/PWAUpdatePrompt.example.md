# PWAUpdatePrompt 组件使用示例

## 组件说明

PWAUpdatePrompt 是一个用于检测和提示 PWA 应用更新的组件。当检测到新版本的 Service Worker 可用时，会自动显示更新提示对话框。

## 功能特性

1. **自动检测更新**：监听 Service Worker 的 updatefound 事件
2. **更新提示对话框**：友好的 UI 提示用户有新版本可用
3. **立即更新**：点击后通知 Service Worker 跳过等待并刷新页面
4. **稍后更新**：关闭对话框，用户可以继续使用当前版本
5. **定期检查**：每小时自动检查一次更新

## 基础使用

### 在 App.vue 中使用

```vue
<template>
  <div id="app">
    <!-- 其他内容 -->
    <router-view />
    
    <!-- PWA更新提示组件 -->
    <PWAUpdatePrompt />
  </div>
</template>

<script setup lang="ts">
import PWAUpdatePrompt from '@/components/common/PWAUpdatePrompt.vue';
</script>
```

## 工作原理

### 1. Service Worker 更新检测

组件会在挂载时开始监听 Service Worker 的更新：

```typescript
navigator.serviceWorker.ready.then((reg) => {
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // 显示更新提示
        showUpdateDialog.value = true;
      }
    });
  });
});
```

### 2. 立即更新流程

当用户点击"立即更新"按钮时：

1. 发送 `SKIP_WAITING` 消息给等待中的 Service Worker
2. Service Worker 收到消息后跳过等待，立即激活
3. 触发 `controllerchange` 事件
4. 页面自动刷新，加载新版本

```typescript
function handleUpdate() {
  if (registration && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});
```

### 3. 稍后更新

用户可以选择稍后更新，关闭对话框继续使用当前版本：

```typescript
function handleLater() {
  showUpdateDialog.value = false;
}
```

## Service Worker 配置

为了让更新提示正常工作，需要在 Service Worker 中添加消息监听：

```javascript
// service-worker.js
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

## 使用 vite-plugin-pwa

如果使用 `vite-plugin-pwa` 插件，可以在配置中启用自动更新提示：

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt', // 提示用户更新
      workbox: {
        skipWaiting: false, // 不自动跳过等待
        clientsClaim: true
      }
    })
  ]
});
```

## 更新策略

### 定期检查更新

组件会每小时自动检查一次更新：

```typescript
setInterval(() => {
  reg.update();
}, 60 * 60 * 1000); // 每小时
```

### 手动触发检查

如果需要手动触发更新检查，可以调用：

```typescript
navigator.serviceWorker.ready.then((reg) => {
  reg.update();
});
```

## 注意事项

1. **浏览器支持**：需要浏览器支持 Service Worker API
2. **HTTPS 要求**：Service Worker 只能在 HTTPS 或 localhost 环境下工作
3. **更新时机**：新的 Service Worker 只有在所有标签页关闭后才会激活（除非使用 skipWaiting）
4. **缓存策略**：确保 Service Worker 文件本身不被缓存，否则无法检测到更新

## 样式定制

组件使用 Element Plus 的 Dialog 组件，可以通过 CSS 变量定制样式：

```css
/* 自定义对话框样式 */
.el-dialog {
  --el-dialog-border-radius: 8px;
}

/* 自定义图标动画速度 */
.update-icon {
  animation-duration: 1s; /* 默认 2s */
}
```

## 测试

### 本地测试更新流程

1. 构建应用：`npm run build`
2. 启动预览服务器：`npm run preview`
3. 修改代码并重新构建
4. 刷新页面，应该会看到更新提示

### 模拟更新

可以在浏览器开发者工具中模拟 Service Worker 更新：

1. 打开 Chrome DevTools
2. 进入 Application > Service Workers
3. 勾选 "Update on reload"
4. 刷新页面

## 相关需求

- **需求13.3**：PWA更新提示
  - WHEN Service Worker更新 THEN 系统应显示更新提示对话框
  - WHEN 用户点击立即更新 THEN 系统应刷新页面加载新版本
  - WHEN 用户点击稍后更新 THEN 系统应关闭对话框

## 参考资料

- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [vite-plugin-pwa 文档](https://vite-pwa-org.netlify.app/)
- [Workbox 文档](https://developer.chrome.com/docs/workbox/)
