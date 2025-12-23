# 渲染优化工具使用示例

## 1. 性能监控

### 1.1 基础使用

```vue
<script setup lang="ts">
import { onMounted, onUpdated } from 'vue';
import { useRenderMonitor } from '@/utils/renderOptimization';

// 创建性能监控
const { startRender, endRender } = useRenderMonitor('ResourceList');

// 在setup开始时启动监控
startRender();

// 监控首次渲染
onMounted(() => {
  endRender('mount');
});

// 监控更新渲染
onUpdated(() => {
  endRender('update');
});
</script>
```

### 1.2 查看性能报告

```typescript
import { devPerformanceTools } from '@/utils/renderOptimization';

// 在浏览器控制台
window.__PERF__.printReport();

// 输出:
// [性能报告]
//   ResourceList
//     首次渲染: 45.23ms
//     更新次数: 12
//     平均更新: 8.45ms
//     最大更新: 23.12ms
//     总耗时: 146.63ms
```

### 1.3 获取优化建议

```typescript
// 获取特定组件的优化建议
window.__PERF__.printSuggestions('ResourceList');

// 输出:
// [渲染优化建议]
//   ✅ ResourceList: 性能良好

// 或者
// [渲染优化建议]
//   ⚠️ ResourceList
//     ⚠️ 更新次数过多 (52次)
//        💡 检查是否有不必要的重渲染，使用computed缓存计算结果
```

## 2. 优化的计算属性

### 2.1 基础使用

```typescript
import { createOptimizedComputed } from '@/utils/renderOptimization';

// 创建优化的计算属性，自动监控执行时间
const filteredResources = createOptimizedComputed(
  'filteredResources',
  () => {
    return resources.value.filter(r => {
      if (filters.categoryId && r.categoryId !== filters.categoryId) return false;
      if (filters.format && r.format !== filters.format) return false;
      return true;
    });
  },
  10 // 警告阈值（毫秒）
);

// 如果执行时间超过10ms，会在控制台输出警告
// [计算属性警告] filteredResources 执行耗时 15.23ms，建议优化
```

### 2.2 复杂计算优化

```typescript
// ❌ 不好：一个计算属性做所有事情
const processedData = computed(() => {
  const filtered = data.value.filter(/* ... */);
  const sorted = filtered.sort(/* ... */);
  const paginated = sorted.slice(/* ... */);
  return paginated;
});

// ✅ 好：拆分为多个计算属性
const filteredData = createOptimizedComputed('filteredData', () => {
  return data.value.filter(/* ... */);
});

const sortedData = createOptimizedComputed('sortedData', () => {
  return [...filteredData.value].sort(/* ... */);
});

const paginatedData = createOptimizedComputed('paginatedData', () => {
  const start = (page.value - 1) * pageSize.value;
  return sortedData.value.slice(start, start + pageSize.value);
});
```

## 3. 浅层响应式优化

### 3.1 大数据列表

```typescript
import { createShallowRef } from '@/utils/renderOptimization';

// ❌ 不好：深度响应式，性能开销大
const resources = ref<ResourceInfo[]>([]);

// ✅ 好：浅层响应式，性能更好
const resources = createShallowRef<ResourceInfo[]>([]);

// 更新整个数组时会触发响应
resources.value = newResources;

// 修改数组项的属性不会触发响应（这是预期的）
resources.value[0].title = 'New Title'; // 不会触发更新
```

### 3.2 静态配置数据

```typescript
import { createRawData } from '@/utils/renderOptimization';

// ✅ 好：标记为非响应式，减少开销
const staticConfig = createRawData({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retryCount: 3,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 这些数据不会被Vue追踪，性能更好
console.log(staticConfig.apiUrl);
```

## 4. 条件渲染优化

### 4.1 v-show vs v-if 选择

```typescript
import { shouldUseVShow } from '@/utils/renderOptimization';

// 根据切换频率自动选择
const useVShow = shouldUseVShow(
  10, // 切换频率：10次/分钟
  false // 是否有复杂子组件
);

// 在模板中使用
// <div v-show="useVShow && isVisible">...</div>
// <div v-if="!useVShow && isVisible">...</div>
```

### 4.2 实际应用

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { shouldUseVShow } from '@/utils/renderOptimization';

const showMenu = ref(false);
const showModal = ref(false);

// 菜单频繁切换，使用v-show
const menuUseVShow = shouldUseVShow(15, false);

// 模态框很少打开，使用v-if
const modalUseVShow = shouldUseVShow(2, true);
</script>

<template>
  <!-- 频繁切换的菜单 -->
  <div v-show="showMenu" class="menu">
    <!-- 简单内容 -->
  </div>

  <!-- 很少打开的模态框 -->
  <Modal v-if="showModal" @close="showModal = false">
    <!-- 复杂组件 -->
  </Modal>
</template>
```

## 5. 列表key优化

### 5.1 生成唯一key

```typescript
import { generateListKey } from '@/utils/renderOptimization';

const resources = ref<ResourceInfo[]>([]);

// 生成组合key
const getResourceKey = (resource: ResourceInfo) => {
  return generateListKey(resource, ['categoryId', 'resourceId']);
};
```

```vue
<template>
  <div
    v-for="resource in resources"
    :key="getResourceKey(resource)"
  >
    {{ resource.title }}
  </div>
</template>
```

### 5.2 验证key唯一性

```typescript
import { validateListKeys } from '@/utils/renderOptimization';

// 在开发环境验证key
if (import.meta.env.DEV) {
  watch(resources, (newResources) => {
    validateListKeys(newResources, 'resourceId');
  });
}

// 如果有重复key，会在控制台输出警告
// [列表key警告] 检测到重复的key，这会导致渲染问题。字段: resourceId
```

## 6. 优化的watch

### 6.1 防抖watch

```typescript
import { createOptimizedWatch } from '@/utils/renderOptimization';

const searchKeyword = ref('');

// 创建防抖watch
const stopWatch = createOptimizedWatch(
  () => searchKeyword.value,
  (keyword) => {
    console.log('搜索:', keyword);
    searchResources(keyword);
  },
  { debounce: 300 } // 300ms防抖
);

// 组件卸载时清理
onUnmounted(stopWatch);
```

### 6.2 节流watch

```typescript
import { createOptimizedWatch } from '@/utils/renderOptimization';

const scrollTop = ref(0);

// 创建节流watch
const stopWatch = createOptimizedWatch(
  () => scrollTop.value,
  (top) => {
    console.log('滚动位置:', top);
    handleScroll(top);
  },
  { throttle: 100 } // 100ms节流
);

onUnmounted(stopWatch);
```

## 7. 批量更新

### 7.1 基础使用

```typescript
import { createBatchUpdater } from '@/utils/renderOptimization';

const batchUpdate = createBatchUpdater();

const state1 = ref(0);
const state2 = ref('');
const state3 = ref(false);

// ❌ 不好：每次更新都会触发重渲染
function updateStates() {
  state1.value = 1;    // 触发渲染
  state2.value = 'a';  // 触发渲染
  state3.value = true; // 触发渲染
}

// ✅ 好：批量更新，只触发一次渲染
function updateStatesBatch() {
  batchUpdate(() => {
    state1.value = 1;
    state2.value = 'a';
    state3.value = true;
  });
}
```

### 7.2 实际应用

```typescript
import { createBatchUpdater } from '@/utils/renderOptimization';

const batchUpdate = createBatchUpdater();

// 批量更新筛选条件
function applyFilters(newFilters: Filters) {
  batchUpdate(() => {
    filters.categoryId = newFilters.categoryId;
    filters.format = newFilters.format;
    filters.vipLevel = newFilters.vipLevel;
    filters.sortType = newFilters.sortType;
  });
}
```

## 8. 完整示例：优化的资源列表组件

```vue
<script setup lang="ts">
import { ref, onMounted, onUpdated, onUnmounted } from 'vue';
import {
  useRenderMonitor,
  createOptimizedComputed,
  createShallowRef,
  createOptimizedWatch,
  validateListKeys
} from '@/utils/renderOptimization';

// ========== 性能监控 ==========
const { startRender, endRender } = useRenderMonitor('OptimizedResourceList');
startRender();

onMounted(() => endRender('mount'));
onUpdated(() => endRender('update'));

// ========== 状态管理 ==========
// 使用浅层响应式存储大量数据
const resources = createShallowRef<ResourceInfo[]>([]);

const filters = ref({
  categoryId: undefined as string | undefined,
  format: undefined as string | undefined,
  keyword: ''
});

// ========== 优化的计算属性 ==========
// 过滤
const filteredResources = createOptimizedComputed(
  'filteredResources',
  () => {
    return resources.value.filter(r => {
      if (filters.value.categoryId && r.categoryId !== filters.value.categoryId) {
        return false;
      }
      if (filters.value.format && r.format !== filters.value.format) {
        return false;
      }
      if (filters.value.keyword) {
        const keyword = filters.value.keyword.toLowerCase();
        return r.title.toLowerCase().includes(keyword);
      }
      return true;
    });
  }
);

// 排序
const sortedResources = createOptimizedComputed(
  'sortedResources',
  () => {
    return [...filteredResources.value].sort((a, b) => {
      return b.downloadCount - a.downloadCount;
    });
  }
);

// ========== 优化的watch ==========
// 搜索防抖
const stopSearchWatch = createOptimizedWatch(
  () => filters.value.keyword,
  (keyword) => {
    console.log('搜索:', keyword);
  },
  { debounce: 300 }
);

// ========== 验证key唯一性 ==========
if (import.meta.env.DEV) {
  const stopKeyWatch = createOptimizedWatch(
    () => resources.value,
    (newResources) => {
      validateListKeys(newResources, 'resourceId');
    }
  );
  
  onUnmounted(stopKeyWatch);
}

// ========== 清理 ==========
onUnmounted(() => {
  stopSearchWatch();
});
</script>

<template>
  <div class="optimized-resource-list">
    <!-- 筛选栏 -->
    <div class="filters">
      <input
        v-model="filters.keyword"
        type="text"
        placeholder="搜索资源..."
      />
    </div>

    <!-- 资源列表 -->
    <div class="resource-grid">
      <ResourceCard
        v-for="resource in sortedResources"
        :key="resource.resourceId"
        :resource="resource"
      />
    </div>
  </div>
</template>
```

## 9. 性能调试工作流

### 9.1 开发阶段

```typescript
// 1. 添加性能监控
const { startRender, endRender } = useRenderMonitor('MyComponent');
startRender();

// 2. 开发功能...

// 3. 在浏览器控制台查看性能报告
window.__PERF__.printReport();

// 4. 获取优化建议
window.__PERF__.printSuggestions('MyComponent');

// 5. 根据建议优化代码

// 6. 再次查看性能报告，验证优化效果
window.__PERF__.clear();
window.__PERF__.printReport();
```

### 9.2 性能对比

```typescript
// 优化前
window.__PERF__.printReport();
// MyComponent
//   首次渲染: 150.23ms
//   更新次数: 45
//   平均更新: 25.45ms

// 应用优化...

// 优化后
window.__PERF__.clear();
window.__PERF__.printReport();
// MyComponent
//   首次渲染: 45.12ms  ✅ 提升 70%
//   更新次数: 12       ✅ 减少 73%
//   平均更新: 8.23ms   ✅ 提升 68%
```

## 10. 最佳实践总结

### 10.1 开发检查清单

- [ ] 长列表使用虚拟滚动
- [ ] 大数据使用 `createShallowRef`
- [ ] 静态数据使用 `createRawData`
- [ ] 复杂计算使用 `createOptimizedComputed`
- [ ] 搜索输入使用防抖 watch
- [ ] 滚动事件使用节流 watch
- [ ] 列表使用唯一 key
- [ ] 频繁切换使用 v-show
- [ ] 很少切换使用 v-if
- [ ] 添加性能监控

### 10.2 性能目标

- ✅ 首次渲染 < 100ms
- ✅ 更新渲染 < 16ms (60fps)
- ✅ 计算属性 < 10ms
- ✅ 内存占用合理

### 10.3 调试命令

```typescript
// 查看所有组件性能
window.__PERF__.printReport();

// 查看特定组件性能
window.__PERF__.getMetrics('MyComponent');

// 获取优化建议
window.__PERF__.printSuggestions();

// 分析特定组件
window.__PERF__.analyze('MyComponent');

// 清除性能数据
window.__PERF__.clear();
```
