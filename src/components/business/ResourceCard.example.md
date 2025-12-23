# ResourceCard 资源卡片组件

资源卡片组件用于展示设计资源的缩略信息，支持懒加载、VIP标识、操作按钮等功能。

## 功能特性

- ✅ 显示资源封面图（带懒加载）
- ✅ 显示资源标题、格式、下载次数
- ✅ 显示VIP标识（vipLevel > 0）
- ✅ 点击卡片跳转详情页
- ✅ 悬停显示操作按钮（下载、收藏）
- ✅ 响应式布局（移动端/桌面端）
- ✅ 暗色模式支持
- ✅ 高分辨率屏幕优化

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| resource | ResourceInfo | - | 资源信息对象（必填） |
| showActions | boolean | true | 是否显示操作按钮 |
| lazy | boolean | true | 是否懒加载图片 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| click | resourceId: string | 点击卡片时触发 |
| download | resourceId: string | 点击下载按钮时触发 |
| collect | resourceId: string | 点击收藏按钮时触发 |

## 基础用法

```vue
<template>
  <ResourceCard
    :resource="resource"
    @click="handleCardClick"
    @download="handleDownload"
    @collect="handleCollect"
  />
</template>

<script setup lang="ts">
import ResourceCard from '@/components/business/ResourceCard.vue';
import type { ResourceInfo } from '@/types/models';

const resource: ResourceInfo = {
  resourceId: '123',
  title: 'UI设计素材包',
  description: '精美的UI设计素材',
  cover: 'https://example.com/cover.jpg',
  previewImages: [],
  format: 'PSD',
  fileSize: 1024000,
  downloadCount: 1234,
  vipLevel: 1,
  categoryId: 'ui-design',
  categoryName: 'UI设计',
  tags: ['UI', '设计'],
  uploaderId: 'user123',
  uploaderName: '设计师',
  isAudit: 1,
  createTime: '2024-01-01',
  updateTime: '2024-01-01'
};

function handleCardClick(resourceId: string) {
  console.log('点击卡片:', resourceId);
}

function handleDownload(resourceId: string) {
  console.log('下载资源:', resourceId);
}

function handleCollect(resourceId: string) {
  console.log('收藏资源:', resourceId);
}
</script>
```

## 网格布局示例

```vue
<template>
  <div class="resource-grid">
    <ResourceCard
      v-for="resource in resources"
      :key="resource.resourceId"
      :resource="resource"
      @download="handleDownload"
      @collect="handleCollect"
    />
  </div>
</template>

<style scoped>
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

/* 移动端 */
@media (max-width: 768px) {
  .resource-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;
  }
}

/* 平板 */
@media (min-width: 769px) and (max-width: 1200px) {
  .resource-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

/* 桌面端 */
@media (min-width: 1201px) {
  .resource-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
}
</style>
```

## 隐藏操作按钮

```vue
<template>
  <ResourceCard
    :resource="resource"
    :show-actions="false"
  />
</template>
```

## 禁用懒加载

```vue
<template>
  <ResourceCard
    :resource="resource"
    :lazy="false"
  />
</template>
```

## 响应式设计

组件自动适配不同屏幕尺寸：

- **桌面端（>1200px）**: 4:3宽高比，悬停显示操作按钮
- **平板（769px-1200px）**: 中间宽高比，悬停显示操作按钮
- **移动端（<768px）**: 1:1宽高比，始终显示操作按钮

## 样式定制

组件使用CSS变量，可以通过覆盖样式进行定制：

```vue
<style>
.resource-card {
  --card-border-radius: 12px;
  --card-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  --card-hover-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
</style>
```

## 注意事项

1. **资源对象必填**: resource prop是必填的，必须提供完整的ResourceInfo对象
2. **路由配置**: 点击卡片会跳转到 `/resource/:id`，需要确保路由已配置
3. **事件处理**: 下载和收藏事件需要在父组件中处理具体逻辑
4. **图片优化**: 建议使用CDN加速和WebP格式提升加载速度
5. **懒加载**: 默认开启图片懒加载，适合长列表场景

## 相关需求

- 需求3.4（资源卡片展示）
- 需求2.2（未登录用户浏览资源列表）
- 需求15.1（响应式设计）
