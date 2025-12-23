# 移动端优化与PWA实现指南

## 说明

本文档详细说明如何实现移动端优化和PWA（渐进式Web应用）功能，确保用户在手机浏览器和离线状态下都能获得良好体验。

---

## 1. 移动端响应式布局

### 1.1 Viewport配置

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="format-detection" content="telephone=no, email=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#165DFF">
  <title>设计资源下载平台</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>
```

### 1.2 Tailwind CSS响应式断点

```javascript
// tailwind.config.js
export default {
  theme: {
    screens: {
      'xs': '375px',    // 小屏手机
      'sm': '640px',    // 大屏手机
      'md': '768px',    // 平板
      'lg': '1024px',   // 小屏笔记本
      'xl': '1280px',   // 桌面
      '2xl': '1536px'   // 大屏桌面
    },
    extend: {
      // 移动端优化的间距
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)'
      }
    }
  }
}
```

### 1.3 响应式组件示例

```vue
<template>
  <div class="resource-grid">
    <!-- 移动端：单列，平板：双列，桌面：四列 -->
    <div 
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4"
    >
      <ResourceCard 
        v-for="item in resources" 
        :key="item.id" 
        :resource="item"
      />
    </div>
  </div>
</template>

<style scoped>
/* 移动端优化 */
@media (max-width: 768px) {
  .resource-grid {
    padding: 0.5rem;
  }
}
</style>
```

---

## 2. 移动端导航优化

### 2.1 底部Tab栏（移动端）

```vue
<template>
  <div class="mobile-layout">
    <!-- 主内容区 -->
    <div class="content pb-16">
      <router-view />
    </div>
    
    <!-- 底部Tab栏（仅移动端显示） -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50">
      <div class="flex justify-around items-center h-16">
        <TabItem icon="home" label="首页" to="/" />
        <TabItem icon="category" label="分类" to="/categories" />
        <TabItem icon="upload" label="上传" to="/upload" />
        <TabItem icon="user" label="我的" to="/personal" />
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TabItem from './TabItem.vue';
</script>

<style scoped>
/* 为底部Tab栏预留空间 */
.content {
  padding-bottom: 4rem;
}

/* 安全区域适配（iPhone刘海屏） */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  nav {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
```

### 2.2 汉堡菜单（移动端）

```vue
<template>
  <div>
    <!-- 汉堡菜单按钮 -->
    <button 
      class="md:hidden p-2" 
      @click="drawerVisible = true"
      aria-label="打开菜单"
    >
      <MenuIcon class="w-6 h-6" />
    </button>
    
    <!-- 侧边抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      :size="280"
      :show-close="false"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold">菜单</h3>
          <button @click="drawerVisible = false">
            <CloseIcon class="w-5 h-5" />
          </button>
        </div>
      </template>
      
      <nav class="space-y-2">
        <NavItem icon="home" label="首页" to="/" />
        <NavItem icon="hot" label="热门资源" to="/hot" />
        <NavItem icon="new" label="最新资源" to="/new" />
        <NavItem icon="vip" label="VIP专区" to="/vip" />
      </nav>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const drawerVisible = ref(false);
</script>
```

---

## 3. 移动端手势交互

### 3.1 下拉刷新

```vue
<template>
  <div 
    ref="containerRef"
    class="pull-refresh-container"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- 下拉提示 -->
    <div 
      class="pull-refresh-indicator"
      :style="{ transform: `translateY(${pullDistance}px)` }"
    >
      <span v-if="pullDistance < 60">下拉刷新</span>
      <span v-else-if="pullDistance >= 60 && !isRefreshing">释放刷新</span>
      <span v-else>刷新中...</span>
    </div>
    
    <!-- 内容区 -->
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const containerRef = ref<HTMLElement>();
const pullDistance = ref(0);
const isRefreshing = ref(false);
const startY = ref(0);

const emit = defineEmits<{
  refresh: [];
}>();

function handleTouchStart(e: TouchEvent) {
  if (containerRef.value?.scrollTop === 0) {
    startY.value = e.touches[0].clientY;
  }
}

function handleTouchMove(e: TouchEvent) {
  if (startY.value === 0) return;
  
  const currentY = e.touches[0].clientY;
  const distance = currentY - startY.value;
  
  if (distance > 0 && distance < 100) {
    pullDistance.value = distance;
    e.preventDefault();
  }
}

async function handleTouchEnd() {
  if (pullDistance.value >= 60) {
    isRefreshing.value = true;
    emit('refresh');
    
    // 模拟刷新完成
    setTimeout(() => {
      isRefreshing.value = false;
      pullDistance.value = 0;
    }, 1500);
  } else {
    pullDistance.value = 0;
  }
  
  startY.value = 0;
}
</script>
```

### 3.2 图片手势缩放

```vue
<template>
  <div 
    ref="imageContainerRef"
    class="image-viewer"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <img 
      :src="imageSrc"
      :style="{
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`
      }"
      @dblclick="handleDoubleClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  imageSrc: string;
}>();

const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const lastDistance = ref(0);

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    // 双指缩放
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    lastDistance.value = getDistance(touch1, touch2);
  }
}

function handleTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    e.preventDefault();
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = getDistance(touch1, touch2);
    
    const scaleChange = distance / lastDistance.value;
    scale.value = Math.max(1, Math.min(3, scale.value * scaleChange));
    lastDistance.value = distance;
  }
}

function handleTouchEnd() {
  lastDistance.value = 0;
}

function handleDoubleClick() {
  // 双击放大/还原
  scale.value = scale.value === 1 ? 2 : 1;
  translateX.value = 0;
  translateY.value = 0;
}

function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}
</script>
```

---

## 4. PWA配置

### 4.1 安装vite-plugin-pwa

```bash
pnpm add -D vite-plugin-pwa workbox-window
```

### 4.2 Vite配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: '设计资源下载平台',
        short_name: '设计资源',
        description: '专业的设计资源分享平台',
        theme_color: '#165DFF',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // 缓存策略
        runtimeCaching: [
          {
            // 缓存API请求
            urlPattern: /^https:\/\/api\.your-domain\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24小时
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // 缓存图片资源
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
              }
            }
          },
          {
            // 缓存CDN资源
            urlPattern: /^https:\/\/cdn\.your-domain\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
              }
            }
          }
        ]
      }
    })
  ]
});
```

### 4.3 Service Worker注册

```typescript
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { registerSW } from 'virtual:pwa-register';

const app = createApp(App);

// 注册Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    // 有新版本可用
    if (confirm('发现新版本，是否立即更新？')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('应用已准备好离线使用');
  }
});

app.mount('#app');
```

---

## 5. 离线状态处理

### 5.1 网络状态监听

```typescript
// composables/useNetworkStatus.ts
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine);
  const networkType = ref<string>('unknown');

  function updateOnlineStatus() {
    isOnline.value = navigator.onLine;
    
    if (isOnline.value) {
      ElMessage.success({
        message: '网络已恢复',
        duration: 3000
      });
    } else {
      ElMessage.warning({
        message: '网络连接已断开',
        duration: 0, // 不自动关闭
        showClose: true
      });
    }
  }

  function updateNetworkType() {
    const connection = (navigator as any).connection;
    if (connection) {
      networkType.value = connection.effectiveType || 'unknown';
    }
  }

  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkType);
      updateNetworkType();
    }
  });

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.removeEventListener('change', updateNetworkType);
    }
  });

  return {
    isOnline,
    networkType,
    isSlowNetwork: () => ['slow-2g', '2g'].includes(networkType.value)
  };
}
```

### 5.2 离线提示组件

```vue
<template>
  <Transition name="slide-down">
    <div v-if="!isOnline" class="offline-banner">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <WifiOffIcon class="w-5 h-5" />
          <span class="text-sm font-medium">当前网络不可用，部分功能受限</span>
        </div>
        <button 
          class="text-sm underline"
          @click="handleRetry"
        >
          重试
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useNetworkStatus } from '@/composables/useNetworkStatus';

const { isOnline } = useNetworkStatus();

function handleRetry() {
  window.location.reload();
}
</script>

<style scoped>
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #FF7D00 0%, #FF9500 100%);
  color: white;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>
```

### 5.3 离线页面

```vue
<template>
  <div class="offline-page">
    <div class="text-center">
      <CloudOffIcon class="w-24 h-24 mx-auto text-gray-400 mb-6" />
      <h1 class="text-2xl font-bold text-gray-800 mb-4">网络连接不可用</h1>
      <p class="text-gray-600 mb-8">
        请检查您的网络设置，或稍后再试
      </p>
      <el-button type="primary" @click="handleRetry">
        重新加载
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
function handleRetry() {
  window.location.reload();
}
</script>

<style scoped>
.offline-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
</style>
```

---

## 6. IndexedDB离线数据存储

### 6.1 IndexedDB封装

```typescript
// utils/indexedDB.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DesignResourceDB extends DBSchema {
  resources: {
    key: string;
    value: {
      id: string;
      title: string;
      cover: string;
      data: any;
      timestamp: number;
    };
  };
  drafts: {
    key: string;
    value: {
      id: string;
      type: string;
      data: any;
      timestamp: number;
    };
  };
}

let db: IDBPDatabase<DesignResourceDB>;

export async function initDB() {
  db = await openDB<DesignResourceDB>('design-resource-db', 1, {
    upgrade(db) {
      // 创建资源缓存表
      if (!db.objectStoreNames.contains('resources')) {
        db.createObjectStore('resources', { keyPath: 'id' });
      }
      
      // 创建草稿表
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'id' });
      }
    }
  });
}

// 缓存资源数据
export async function cacheResource(id: string, data: any) {
  await db.put('resources', {
    id,
    title: data.title,
    cover: data.cover,
    data,
    timestamp: Date.now()
  });
}

// 获取缓存的资源
export async function getCachedResource(id: string) {
  return await db.get('resources', id);
}

// 保存草稿
export async function saveDraft(type: string, data: any) {
  const id = `draft_${type}_${Date.now()}`;
  await db.put('drafts', {
    id,
    type,
    data,
    timestamp: Date.now()
  });
  return id;
}

// 获取所有草稿
export async function getAllDrafts() {
  return await db.getAll('drafts');
}

// 删除草稿
export async function deleteDraft(id: string) {
  await db.delete('drafts', id);
}

// 清理过期缓存（7天前的数据）
export async function cleanExpiredCache() {
  const expireTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const allResources = await db.getAll('resources');
  
  for (const resource of allResources) {
    if (resource.timestamp < expireTime) {
      await db.delete('resources', resource.id);
    }
  }
}
```

---

## 7. 移动端性能优化

### 7.1 图片懒加载

```vue
<template>
  <img 
    v-lazy="imageSrc"
    :alt="alt"
    class="lazy-image"
  />
</template>

<script setup lang="ts">
import { directive as vLazy } from 'vue3-lazy';

const props = defineProps<{
  imageSrc: string;
  alt: string;
}>();
</script>

<style scoped>
.lazy-image[lazy=loading] {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

### 7.2 虚拟滚动（长列表优化）

```vue
<template>
  <RecycleScroller
    :items="resources"
    :item-size="200"
    key-field="id"
    v-slot="{ item }"
    class="scroller"
  >
    <ResourceCard :resource="item" />
  </RecycleScroller>
</template>

<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

const props = defineProps<{
  resources: any[];
}>();
</script>
```

---

## 8. 移动端调试

### 8.1 vConsole配置（开发环境）

```typescript
// main.ts
import VConsole from 'vconsole';

// 仅在移动端开发环境启用
if (import.meta.env.DEV && /Mobile|Android|iPhone/i.test(navigator.userAgent)) {
  new VConsole();
}
```

---

## 总结

本指南涵盖了移动端优化和PWA实现的核心内容：

1. **响应式布局**：Tailwind CSS断点、Viewport配置
2. **移动端导航**：底部Tab栏、汉堡菜单、侧边抽屉
3. **手势交互**：下拉刷新、图片缩放、滑动切换
4. **PWA功能**：Service Worker、离线缓存、应用安装
5. **离线处理**：网络状态监听、离线提示、IndexedDB存储
6. **性能优化**：图片懒加载、虚拟滚动、代码分割
7. **移动端调试**：vConsole、真机调试

这些技术确保用户在手机浏览器和离线状态下都能获得流畅的体验。
