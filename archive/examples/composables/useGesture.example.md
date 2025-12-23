# useGesture 使用示例

手势交互组合式函数，提供滑动、下拉刷新和长按功能。

## 功能特性

- ✅ 滑动手势（左滑、右滑、上滑、下滑）
- ✅ 下拉刷新
- ✅ 长按操作
- ✅ 触觉反馈支持
- ✅ 自动事件清理

## 使用示例

### 1. 滑动手势 (useSwipe)

```vue
<template>
  <div ref="swipeContainer" class="swipe-container">
    <div class="content">
      左右滑动切换图片
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSwipe } from '@/composables/useGesture';

const swipeContainer = ref<HTMLElement>();
const currentIndex = ref(0);

// 使用滑动手势
useSwipe(swipeContainer, {
  onSwipeLeft: () => {
    console.log('向左滑动');
    currentIndex.value = Math.min(currentIndex.value + 1, 10);
  },
  onSwipeRight: () => {
    console.log('向右滑动');
    currentIndex.value = Math.max(currentIndex.value - 1, 0);
  },
  threshold: 50 // 触发滑动的最小距离（像素）
});
</script>
```

### 2. 下拉刷新 (usePullToRefresh)

```vue
<template>
  <div ref="refreshContainer" class="refresh-container">
    <!-- 下拉提示 -->
    <div 
      class="pull-indicator"
      :style="{ transform: `translateY(${pullDistance}px)` }"
    >
      <span v-if="pullDistance < 60">下拉刷新</span>
      <span v-else-if="!isRefreshing">释放刷新</span>
      <span v-else>刷新中...</span>
    </div>
    
    <!-- 内容区 -->
    <div class="content">
      <div v-for="item in items" :key="item.id">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePullToRefresh } from '@/composables/useGesture';

const refreshContainer = ref<HTMLElement>();
const items = ref([]);

// 使用下拉刷新
const { isPulling, isRefreshing, pullDistance } = usePullToRefresh(
  refreshContainer,
  {
    onRefresh: async () => {
      // 执行刷新操作
      await fetchData();
    },
    threshold: 60, // 触发刷新的最小距离（像素）
    maxDistance: 100 // 最大下拉距离（像素）
  }
);

async function fetchData() {
  // 模拟API请求
  await new Promise(resolve => setTimeout(resolve, 1000));
  items.value = [/* 新数据 */];
}
</script>

<style scoped>
.refresh-container {
  overflow-y: auto;
  height: 100vh;
}

.pull-indicator {
  text-align: center;
  padding: 10px;
  transition: transform 0.3s ease;
}
</style>
```

### 3. 长按操作 (useLongPress)

```vue
<template>
  <div ref="longPressElement" class="long-press-item">
    <img :src="resource.cover" :alt="resource.title" />
    <h3>{{ resource.title }}</h3>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useLongPress } from '@/composables/useGesture';
import { ElMessageBox } from 'element-plus';

const longPressElement = ref<HTMLElement>();

// 使用长按操作
const { isLongPressing } = useLongPress(longPressElement, {
  onLongPress: (event) => {
    console.log('长按触发');
    
    // 显示操作菜单
    ElMessageBox.confirm('选择操作', '操作菜单', {
      confirmButtonText: '下载',
      cancelButtonText: '收藏',
      distinguishCancelAndClose: true
    }).then(() => {
      // 下载操作
      handleDownload();
    }).catch((action) => {
      if (action === 'cancel') {
        // 收藏操作
        handleCollect();
      }
    });
  },
  delay: 500 // 长按触发延迟（毫秒）
});

function handleDownload() {
  console.log('下载资源');
}

function handleCollect() {
  console.log('收藏资源');
}
</script>

<style scoped>
.long-press-item {
  cursor: pointer;
  user-select: none;
}
</style>
```

### 4. 组合使用

```vue
<template>
  <div ref="container" class="gesture-container">
    <div 
      v-for="item in items" 
      :key="item.id"
      ref="itemRefs"
      class="item"
    >
      {{ item.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSwipe, useLongPress } from '@/composables/useGesture';

const container = ref<HTMLElement>();
const itemRefs = ref<HTMLElement[]>([]);

// 容器支持左右滑动
useSwipe(container, {
  onSwipeLeft: () => {
    console.log('向左滑动，显示下一页');
  },
  onSwipeRight: () => {
    console.log('向右滑动，显示上一页');
  }
});

// 每个项目支持长按
itemRefs.value.forEach((item, index) => {
  useLongPress(ref(item), {
    onLongPress: () => {
      console.log(`长按第 ${index} 项`);
    }
  });
});
</script>
```

## API 参考

### useSwipe

**参数：**
- `element: Ref<HTMLElement | null | undefined>` - 目标元素的ref
- `options: SwipeOptions` - 滑动选项
  - `onSwipeLeft?: () => void` - 左滑回调
  - `onSwipeRight?: () => void` - 右滑回调
  - `onSwipeUp?: () => void` - 上滑回调
  - `onSwipeDown?: () => void` - 下滑回调
  - `threshold?: number` - 触发滑动的最小距离（默认50px）

**返回值：**
- `isSwiping: Readonly<Ref<boolean>>` - 是否正在滑动
- `initSwipeListeners: () => void` - 初始化事件监听
- `cleanupSwipeListeners: () => void` - 清理事件监听

### usePullToRefresh

**参数：**
- `element: Ref<HTMLElement | null | undefined>` - 目标元素的ref
- `options: PullToRefreshOptions` - 下拉刷新选项
  - `onRefresh: () => Promise<void>` - 刷新回调（必需）
  - `threshold?: number` - 触发刷新的最小距离（默认60px）
  - `maxDistance?: number` - 最大下拉距离（默认100px）

**返回值：**
- `isPulling: Readonly<Ref<boolean>>` - 是否正在下拉
- `isRefreshing: Readonly<Ref<boolean>>` - 是否正在刷新
- `pullDistance: Readonly<Ref<number>>` - 当前下拉距离
- `initPullToRefreshListeners: () => void` - 初始化事件监听
- `cleanupPullToRefreshListeners: () => void` - 清理事件监听

### useLongPress

**参数：**
- `element: Ref<HTMLElement | null | undefined>` - 目标元素的ref
- `options: LongPressOptions` - 长按选项
  - `onLongPress: (event: TouchEvent) => void` - 长按回调（必需）
  - `delay?: number` - 长按触发延迟（默认500ms）

**返回值：**
- `isLongPressing: Readonly<Ref<boolean>>` - 是否正在长按
- `cancelLongPress: () => void` - 取消长按
- `initLongPressListeners: () => void` - 初始化事件监听
- `cleanupLongPressListeners: () => void` - 清理事件监听

## 注意事项

1. **自动清理**：所有手势监听器会在组件卸载时自动清理
2. **触觉反馈**：长按操作支持触觉反馈（需要浏览器支持）
3. **阻尼效果**：下拉刷新使用阻尼效果，下拉距离会随着拉动距离增加而减缓
4. **移动检测**：长按时如果移动超过10px会自动取消
5. **快速滑动**：滑动手势只响应300ms内的快速滑动

## 浏览器兼容性

- ✅ iOS Safari 10+
- ✅ Android Chrome 60+
- ✅ 支持触摸事件的现代浏览器

## 相关需求

- 需求15.2（手势交互）
- 需求9.11-9.16（移动端交互优化）
