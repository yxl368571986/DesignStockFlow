# useNetworkStatus 使用示例

## 基本使用

```vue
<template>
  <div>
    <!-- 网络状态指示器 -->
    <div v-if="!isOnline" class="offline-banner">
      <span>网络已断开</span>
      <button @click="handleReconnect" :disabled="isReconnecting">
        {{ isReconnecting ? '重连中...' : '重新连接' }}
      </button>
    </div>

    <!-- 慢速网络提示 -->
    <div v-if="isSlowNetwork && isOnline" class="slow-network-banner">
      当前网络较慢 ({{ networkType }})
    </div>

    <!-- 主要内容 -->
    <div class="content">
      <p>在线状态: {{ isOnline ? '在线' : '离线' }}</p>
      <p>网络类型: {{ networkType }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNetworkStatus } from '@/composables';

// 使用网络状态监控
const {
  isOnline,
  networkType,
  isSlowNetwork,
  isReconnecting,
  reconnect
} = useNetworkStatus();

// 手动重连
async function handleReconnect() {
  const success = await reconnect();
  if (success) {
    console.log('网络已恢复');
  } else {
    console.log('重连失败');
  }
}
</script>
```

## 在全局组件中使用

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <!-- 网络状态提示条 -->
    <NetworkStatusBar />
    
    <!-- 路由视图 -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useNetworkStatus } from '@/composables';
import { onMounted } from 'vue';

// 全局监听网络状态
const { isOnline } = useNetworkStatus();

// 监听网络恢复事件，自动重试失败的请求
onMounted(() => {
  window.addEventListener('network-restored', () => {
    console.log('网络已恢复，可以重试失败的请求');
    // 这里可以重试之前失败的请求
  });

  window.addEventListener('network-disconnected', () => {
    console.log('网络已断开');
    // 这里可以取消正在进行的请求
  });
});
</script>
```

## 与Axios集成

```typescript
// utils/request.ts
import axios from 'axios';
import { useNetworkStatus } from '@/composables';

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
});

// 请求拦截器 - 检查网络状态
service.interceptors.request.use(
  (config) => {
    // 在组件外部使用时，需要手动检查
    if (!navigator.onLine) {
      return Promise.reject(new Error('网络连接不可用'));
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理网络错误
service.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!navigator.onLine) {
      ElMessage.error('网络连接已断开，请检查网络设置');
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

export default service;
```

## 功能特性

### 1. 自动监听网络状态
- 监听 `online` 和 `offline` 事件
- 自动更新 `isOnline` 状态
- 显示友好的提示消息

### 2. 网络类型检测
- 检测网络类型：wifi、4g、3g、2g、slow、unknown
- 基于 Network Information API
- 自动识别慢速网络并提示用户

### 3. 重新连接功能
- 提供 `reconnect()` 方法手动检测网络
- 通过发送轻量级请求验证网络连接
- 5秒超时机制
- 防止重复重连

### 4. 自定义事件
- `network-restored`: 网络恢复时触发
- `network-disconnected`: 网络断开时触发
- 可用于全局监听和处理

## API 参考

### 返回值

```typescript
{
  // 状态（只读）
  isOnline: Readonly<Ref<boolean>>,           // 是否在线
  networkType: Readonly<Ref<NetworkType>>,    // 网络类型
  isSlowNetwork: Readonly<Ref<boolean>>,      // 是否慢速网络
  isReconnecting: Readonly<Ref<boolean>>,     // 是否正在重连
  
  // 方法
  reconnect: () => Promise<boolean>,          // 重新连接
  updateNetworkType: () => void,              // 更新网络类型
  initNetworkListeners: () => void,           // 初始化监听器
  cleanupNetworkListeners: () => void,        // 清理监听器
  handleOnline: () => void,                   // 处理在线事件
  handleOffline: () => void                   // 处理离线事件
}
```

### NetworkType 类型

```typescript
type NetworkType = 'wifi' | '4g' | '3g' | '2g' | 'slow' | 'unknown';
```

## 注意事项

1. **浏览器兼容性**: Network Information API 在某些浏览器中可能不可用，此时 `networkType` 将返回 `'unknown'`

2. **自动初始化**: 默认情况下，composable 会在组件挂载时自动初始化监听器。如果需要手动控制，可以传入 `autoInit: false`

3. **测试环境**: 在测试环境中使用时，建议传入 `autoInit: false` 以避免生命周期钩子问题

4. **全局使用**: 建议在 App.vue 中使用一次，通过事件系统通知其他组件

5. **性能考虑**: 监听器会在组件卸载时自动清理，无需手动处理
