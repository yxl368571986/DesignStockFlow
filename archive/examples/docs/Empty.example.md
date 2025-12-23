# Empty 空状态组件

空状态组件用于在没有数据时显示友好的提示信息和操作引导。

## 基础用法

```vue
<template>
  <Empty description="暂无资源" />
</template>

<script setup lang="ts">
import Empty from '@/components/common/Empty.vue';
</script>
```

## 带操作按钮

```vue
<template>
  <Empty
    description="您还没有上传任何资源"
    :show-action="true"
    action-text="去上传"
    @action="handleUpload"
  />
</template>

<script setup lang="ts">
import Empty from '@/components/common/Empty.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

function handleUpload() {
  router.push('/upload');
}
</script>
```

## 自定义图片

```vue
<template>
  <Empty
    image="https://example.com/custom-empty.png"
    :image-size="150"
    description="没有找到相关资源"
  />
</template>

<script setup lang="ts">
import Empty from '@/components/common/Empty.vue';
</script>
```

## 自定义描述

```vue
<template>
  <Empty :show-action="true" action-text="刷新">
    <template #description>
      <p>暂无搜索结果</p>
      <p class="text-sm text-gray-500">试试其他关键词吧</p>
    </template>
  </Empty>
</template>

<script setup lang="ts">
import Empty from '@/components/common/Empty.vue';
</script>
```

## 自定义操作按钮

```vue
<template>
  <Empty description="您的下载记录为空">
    <template #action>
      <div class="flex gap-2">
        <el-button type="primary" @click="handleBrowse">
          浏览资源
        </el-button>
        <el-button @click="handleRefresh">
          刷新
        </el-button>
      </div>
    </template>
  </Empty>
</template>

<script setup lang="ts">
import Empty from '@/components/common/Empty.vue';

function handleBrowse() {
  console.log('浏览资源');
}

function handleRefresh() {
  console.log('刷新');
}
</script>
```

## 不同场景示例

### 搜索无结果

```vue
<template>
  <Empty
    description="没有找到相关资源"
    :show-action="true"
    action-text="清空搜索"
    action-type="text"
    @action="handleClearSearch"
  />
</template>
```

### 下载记录为空

```vue
<template>
  <Empty
    description="您还没有下载过任何资源"
    :show-action="true"
    action-text="去浏览"
    @action="handleBrowse"
  />
</template>
```

### 上传记录为空

```vue
<template>
  <Empty
    description="您还没有上传任何资源"
    :show-action="true"
    action-text="去上传"
    @action="handleUpload"
  />
</template>
```

### 收藏列表为空

```vue
<template>
  <Empty
    description="您还没有收藏任何资源"
    :show-action="true"
    action-text="去发现"
    @action="handleDiscover"
  />
</template>
```

## Props

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| image | 空状态图片URL | string | - | '' |
| imageSize | 图片大小 | number | - | 200 |
| description | 描述文字 | string | - | '暂无数据' |
| showAction | 是否显示操作按钮 | boolean | - | false |
| actionText | 操作按钮文字 | string | - | '去上传' |
| actionType | 操作按钮类型 | string | primary / success / warning / danger / info / text | 'primary' |

## Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| action | 点击操作按钮时触发 | - |

## Slots

| 插槽名 | 说明 |
|--------|------|
| description | 自定义描述内容 |
| action | 自定义操作按钮区域 |

## 使用场景

1. **资源列表为空**：显示"暂无资源"提示，引导用户上传或浏览其他分类
2. **搜索无结果**：显示"没有找到相关资源"，建议用户更换关键词
3. **下载记录为空**：显示"您还没有下载过任何资源"，引导用户去浏览
4. **上传记录为空**：显示"您还没有上传任何资源"，引导用户去上传
5. **收藏列表为空**：显示"您还没有收藏任何资源"，引导用户去发现
6. **网络错误**：显示"加载失败"，提供重试按钮

## 设计原则

- **友好提示**：使用温和的语言，避免让用户感到挫败
- **明确引导**：提供明确的操作建议，帮助用户知道下一步该做什么
- **视觉平衡**：图标和文字大小适中，不要过于突兀
- **响应式**：在移动端自动调整图片大小和按钮样式
- **可定制**：支持自定义图片、描述和操作按钮，适应不同场景
