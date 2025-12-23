# 网络优化工具使用示例

本文档展示如何使用网络优化工具模块提升应用性能。

## 1. DNS预解析和预连接

### 自动初始化（推荐）

在应用启动时自动配置DNS预解析和预连接：

```typescript
import { initNetworkOptimization } from '@/utils/network';

// 在main.ts中调用
initNetworkOptimization();
```

### 手动添加DNS预解析

```typescript
import { addDNSPrefetch } from '@/utils/network';

// 添加单个域名
addDNSPrefetch(['api.example.com']);

// 添加多个域名
addDNSPrefetch([
  'api.example.com',
  'cdn.example.com',
  'fonts.googleapis.com'
]);
```

### 手动添加预连接

```typescript
import { addPreconnect } from '@/utils/network';

// 预连接到API服务器
addPreconnect(['https://api.example.com']);

// 预连接到CDN
addPreconnect(['https://cdn.example.com']);
```

## 2. 资源预加载

### 预加载关键CSS和JS

```typescript
import { addPreload } from '@/utils/network';

addPreload([
  { href: '/assets/main.css', as: 'style' },
  { href: '/assets/main.js', as: 'script' },
  { href: '/assets/font.woff2', as: 'font', type: 'font/woff2' }
]);
```

### 预加载图片

```typescript
import { preloadImagesBatch } from '@/utils/network';

// 预加载首屏图片
const imageUrls = [
  '/images/banner1.jpg',
  '/images/banner2.jpg',
  '/images/logo.png'
];

preloadImagesBatch(imageUrls)
  .then(() => {
    console.log('所有图片预加载完成');
  })
  .catch((error) => {
    console.error('图片预加载失败:', error);
  });
```

## 3. 请求防抖（Debounce）

### 搜索框防抖

```typescript
import { debounceSearch } from '@/utils/network';

// 在组件中使用
const handleSearch = debounceSearch((keyword: string) => {
  console.log('执行搜索:', keyword);
  // 调用搜索API
  searchAPI(keyword);
}, 300); // 300ms延迟

// 用户输入时调用
input.addEventListener('input', (e) => {
  handleSearch(e.target.value);
});
```

### 自动保存防抖

```typescript
import { debounce } from '@/utils/network';

const autoSave = debounce((content: string) => {
  console.log('自动保存:', content);
  saveAPI(content);
}, 1000); // 1秒延迟

// 用户编辑时调用
textarea.addEventListener('input', (e) => {
  autoSave(e.target.value);
});
```

## 4. 请求节流（Throttle）

### 滚动事件节流

```typescript
import { throttleScroll } from '@/utils/network';

// 滚动加载更多
const handleScroll = throttleScroll(() => {
  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  if (scrollTop + windowHeight >= documentHeight - 100) {
    console.log('加载更多');
    loadMore();
  }
}, 100); // 100ms节流

window.addEventListener('scroll', handleScroll);
```

### 窗口resize节流

```typescript
import { throttleResize } from '@/utils/network';

// 响应式布局调整
const handleResize = throttleResize(() => {
  const width = window.innerWidth;
  console.log('窗口宽度:', width);
  
  if (width < 768) {
    // 移动端布局
    switchToMobileLayout();
  } else {
    // 桌面端布局
    switchToDesktopLayout();
  }
}, 200); // 200ms节流

window.addEventListener('resize', handleResize);
```

## 5. requestAnimationFrame节流

### 滚动动画优化

```typescript
import { rafThrottleScroll } from '@/utils/network';

// 使用RAF优化滚动动画
const handleScrollAnimation = rafThrottleScroll(() => {
  const scrollTop = window.scrollY;
  
  // 更新视差效果
  parallaxElement.style.transform = `translateY(${scrollTop * 0.5}px)`;
});

window.addEventListener('scroll', handleScrollAnimation);
```

### Resize动画优化

```typescript
import { rafThrottleResize } from '@/utils/network';

// 使用RAF优化resize动画
const handleResizeAnimation = rafThrottleResize(() => {
  const width = window.innerWidth;
  
  // 更新图表尺寸
  chart.resize({ width });
});

window.addEventListener('resize', handleResizeAnimation);
```

## 6. 网络状态检测

### 检测网络类型

```typescript
import { getNetworkType, isSlowNetwork, isFastNetwork } from '@/utils/network';

// 获取网络信息
const networkInfo = getNetworkType();
console.log('网络类型:', networkInfo.effectiveType); // '4g', '3g', '2g', 'slow-2g'
console.log('下行速度:', networkInfo.downlink, 'Mbps');
console.log('往返时间:', networkInfo.rtt, 'ms');
console.log('省流量模式:', networkInfo.saveData);

// 判断网络速度
if (isSlowNetwork()) {
  console.log('慢速网络，加载低质量图片');
  loadLowQualityImages();
} else if (isFastNetwork()) {
  console.log('快速网络，加载高质量图片');
  loadHighQualityImages();
}
```

### 根据网络状态调整资源质量

```typescript
import { getAdaptiveResourceUrl } from '@/utils/network';

// 自动选择合适的资源
const imageUrl = getAdaptiveResourceUrl(
  'https://cdn.example.com/image-hq.jpg', // 高质量
  'https://cdn.example.com/image-lq.jpg'  // 低质量
);

img.src = imageUrl;
```

## 7. 请求队列管理

### 控制并发请求数量

```typescript
import { RequestQueue } from '@/utils/network';

// 创建请求队列（最多6个并发）
const queue = new RequestQueue(6);

// 添加请求到队列
const promises = imageUrls.map((url) => {
  return queue.add(() => fetch(url));
});

// 等待所有请求完成
Promise.all(promises).then((responses) => {
  console.log('所有请求完成');
});
```

### 使用全局请求队列

```typescript
import { globalRequestQueue } from '@/utils/network';

// 使用全局队列
async function loadResource(url: string) {
  return globalRequestQueue.add(() => fetch(url));
}

// 批量加载资源
const urls = ['url1', 'url2', 'url3', ...];
const results = await Promise.all(urls.map(loadResource));
```

## 8. 在Vue组件中使用

### 搜索组件示例

```vue
<template>
  <div class="search-box">
    <input
      v-model="keyword"
      @input="handleInput"
      placeholder="搜索资源..."
    />
    <div v-if="suggestions.length > 0" class="suggestions">
      <div
        v-for="item in suggestions"
        :key="item"
        @click="selectSuggestion(item)"
      >
        {{ item }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { debounceSearch } from '@/utils/network';

const keyword = ref('');
const suggestions = ref<string[]>([]);

// 防抖搜索联想
const fetchSuggestions = debounceSearch(async (value: string) => {
  if (!value) {
    suggestions.value = [];
    return;
  }
  
  const res = await fetch(`/api/search/suggest?keyword=${value}`);
  const data = await res.json();
  suggestions.value = data.suggestions;
}, 300);

function handleInput() {
  fetchSuggestions(keyword.value);
}

function selectSuggestion(item: string) {
  keyword.value = item;
  suggestions.value = [];
  // 执行搜索
}
</script>
```

### 无限滚动组件示例

```vue
<template>
  <div class="resource-list" @scroll="handleScroll">
    <ResourceCard
      v-for="resource in resources"
      :key="resource.id"
      :resource="resource"
    />
    <div v-if="loading" class="loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { throttleScroll } from '@/utils/network';

const resources = ref([]);
const loading = ref(false);
const hasMore = ref(true);

// 节流滚动加载
const handleScroll = throttleScroll((e: Event) => {
  const target = e.target as HTMLElement;
  const scrollTop = target.scrollTop;
  const scrollHeight = target.scrollHeight;
  const clientHeight = target.clientHeight;

  if (scrollTop + clientHeight >= scrollHeight - 100 && !loading.value && hasMore.value) {
    loadMore();
  }
}, 100);

async function loadMore() {
  loading.value = true;
  try {
    const res = await fetch('/api/resources?page=' + (resources.value.length / 20 + 1));
    const data = await res.json();
    resources.value.push(...data.resources);
    hasMore.value = data.hasMore;
  } finally {
    loading.value = false;
  }
}
</script>
```

### 响应式布局组件示例

```vue
<template>
  <div :class="layoutClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { throttleResize } from '@/utils/network';

const layoutClass = ref('desktop-layout');

// 节流resize处理
const handleResize = throttleResize(() => {
  const width = window.innerWidth;
  
  if (width < 768) {
    layoutClass.value = 'mobile-layout';
  } else if (width < 1200) {
    layoutClass.value = 'tablet-layout';
  } else {
    layoutClass.value = 'desktop-layout';
  }
}, 200);

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>
```

## 9. 性能监控

### 监听网络状态变化

```typescript
import { getNetworkType } from '@/utils/network';

if (typeof navigator !== 'undefined' && 'connection' in navigator) {
  const connection = (navigator as any).connection;
  
  connection.addEventListener('change', () => {
    const networkInfo = getNetworkType();
    console.log('网络状态变化:', networkInfo);
    
    // 根据网络状态调整策略
    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      // 切换到省流量模式
      enableDataSavingMode();
    } else {
      // 恢复正常模式
      disableDataSavingMode();
    }
  });
}
```

## 10. 最佳实践

### 1. 搜索场景使用防抖

```typescript
// ✅ 推荐：使用防抖减少API调用
const search = debounceSearch(searchAPI, 300);

// ❌ 不推荐：每次输入都调用API
input.addEventListener('input', () => searchAPI());
```

### 2. 滚动场景使用节流

```typescript
// ✅ 推荐：使用节流限制执行频率
const handleScroll = throttleScroll(updateUI, 100);

// ❌ 不推荐：滚动时频繁执行
window.addEventListener('scroll', updateUI);
```

### 3. 动画场景使用RAF节流

```typescript
// ✅ 推荐：使用RAF优化动画性能
const handleScroll = rafThrottleScroll(updateParallax);

// ❌ 不推荐：使用普通节流可能不够流畅
const handleScroll = throttleScroll(updateParallax, 16);
```

### 4. 根据网络状态优化

```typescript
// ✅ 推荐：根据网络状态加载不同质量资源
if (isSlowNetwork()) {
  loadLowQualityImages();
} else {
  loadHighQualityImages();
}

// ❌ 不推荐：不考虑网络状态，总是加载高质量资源
loadHighQualityImages();
```

### 5. 控制并发请求

```typescript
// ✅ 推荐：使用请求队列控制并发
const queue = new RequestQueue(6);
urls.forEach(url => queue.add(() => fetch(url)));

// ❌ 不推荐：同时发起大量请求
urls.forEach(url => fetch(url));
```

## 总结

网络优化工具提供了以下功能：

1. **DNS预解析和预连接** - 减少DNS查询和连接建立时间
2. **资源预加载** - 提前加载关键资源，提升首屏速度
3. **请求防抖** - 减少不必要的API调用（搜索、自动保存）
4. **请求节流** - 限制高频事件的执行频率（滚动、resize）
5. **RAF节流** - 优化动画性能
6. **网络状态检测** - 根据网络状态调整资源质量
7. **请求队列** - 控制并发请求数量

合理使用这些工具可以显著提升应用性能和用户体验。
