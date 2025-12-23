# Loading 加载动画组件

加载动画组件，支持全屏加载和骨架屏加载两种模式。

## 功能特性

- ✅ 全屏加载动画
- ✅ 骨架屏加载（多种类型）
- ✅ 自定义加载文本
- ✅ 响应式设计
- ✅ 使用Element Plus Skeleton组件

## 基础用法

### 全屏加载

```vue
<template>
  <div>
    <el-button @click="showLoading = true">显示全屏加载</el-button>
    
    <Loading
      v-if="showLoading"
      fullscreen
      text="加载中..."
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Loading from '@/components/common/Loading.vue';

const showLoading = ref(false);

// 模拟加载
setTimeout(() => {
  showLoading.value = false;
}, 2000);
</script>
```

### 骨架屏加载（默认）

```vue
<template>
  <div class="container">
    <Loading
      v-if="loading"
      :rows="5"
      text="正在加载数据..."
    />
    
    <div v-else>
      <!-- 实际内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Loading from '@/components/common/Loading.vue';

const loading = ref(true);

// 模拟数据加载
setTimeout(() => {
  loading.value = false;
}, 2000);
</script>
```

### 卡片骨架屏

```vue
<template>
  <div class="resource-grid">
    <Loading
      v-if="loading"
      type="card"
      :rows="3"
    />
    
    <ResourceCard
      v-else
      v-for="resource in resources"
      :key="resource.id"
      :resource="resource"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Loading from '@/components/common/Loading.vue';

const loading = ref(true);
const resources = ref([]);
</script>
```

### 列表骨架屏

```vue
<template>
  <div class="list-container">
    <Loading
      v-if="loading"
      type="list"
      :rows="5"
    />
    
    <div v-else class="list">
      <!-- 列表内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Loading from '@/components/common/Loading.vue';

const loading = ref(true);
</script>
```

### 文章骨架屏

```vue
<template>
  <div class="article-container">
    <Loading
      v-if="loading"
      type="article"
      :rows="8"
      text="正在加载文章..."
    />
    
    <article v-else>
      <!-- 文章内容 -->
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Loading from '@/components/common/Loading.vue';

const loading = ref(true);
</script>
```

## Props

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| fullscreen | 是否全屏加载 | boolean | - | false |
| text | 加载文本 | string | - | '' |
| rows | 骨架屏行数 | number | - | 3 |
| animated | 是否启用动画 | boolean | - | true |
| type | 骨架屏类型 | string | default / card / list / article | default |

## 使用场景

### 1. 页面初始加载

```vue
<template>
  <div class="page">
    <Loading
      v-if="pageLoading"
      fullscreen
      text="页面加载中..."
    />
    
    <div v-else class="page-content">
      <!-- 页面内容 -->
    </div>
  </div>
</template>
```

### 2. 资源列表加载

```vue
<template>
  <div class="resource-list">
    <Loading
      v-if="loading"
      type="card"
      :rows="8"
    />
    
    <div v-else class="grid">
      <ResourceCard
        v-for="resource in resources"
        :key="resource.id"
        :resource="resource"
      />
    </div>
  </div>
</template>
```

### 3. 详情页加载

```vue
<template>
  <div class="detail-page">
    <Loading
      v-if="loading"
      type="article"
      :rows="10"
      text="正在加载详情..."
    />
    
    <div v-else class="detail-content">
      <!-- 详情内容 -->
    </div>
  </div>
</template>
```

### 4. 表单提交加载

```vue
<template>
  <div>
    <el-form @submit="handleSubmit">
      <!-- 表单内容 -->
      <el-button type="primary" :loading="submitting">
        提交
      </el-button>
    </el-form>
    
    <Loading
      v-if="submitting"
      fullscreen
      text="提交中，请稍候..."
    />
  </div>
</template>
```

## 最佳实践

### 1. 选择合适的加载类型

- **全屏加载**：适用于页面初始化、表单提交等需要阻塞用户操作的场景
- **骨架屏**：适用于列表、卡片等内容加载，提供更好的用户体验

### 2. 合理设置行数

```vue
<!-- 根据实际内容设置行数 -->
<Loading type="list" :rows="5" />  <!-- 5个列表项 -->
<Loading type="article" :rows="10" />  <!-- 10段文字 -->
```

### 3. 提供加载提示

```vue
<!-- 为用户提供明确的加载提示 -->
<Loading fullscreen text="正在上传文件，请稍候..." />
<Loading type="card" text="正在加载资源列表..." />
```

### 4. 禁用动画（性能优化）

```vue
<!-- 在低性能设备上可以禁用动画 -->
<Loading :animated="false" />
```

## 注意事项

1. **全屏加载会阻塞用户操作**，应谨慎使用，避免长时间显示
2. **骨架屏应与实际内容布局相似**，提供更好的视觉连续性
3. **加载文本应简洁明了**，告知用户当前操作状态
4. **移动端自动适配**，无需额外处理
5. **使用v-if控制显示**，而不是v-show，避免不必要的渲染

## 相关组件

- NetworkStatus - 网络状态提示
- PWAUpdatePrompt - PWA更新提示

## 需求映射

- 需求15.3（骨架屏）
