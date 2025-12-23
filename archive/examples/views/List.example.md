# 资源列表页示例

## 功能说明

资源列表页是用户浏览和筛选设计资源的主要页面，提供了丰富的筛选和排序功能。

## 主要功能

### 1. 筛选功能
- **分类筛选**：按资源分类筛选（党建类、节日海报类、电商类等）
- **格式筛选**：按文件格式筛选（PSD、AI、CDR、PNG等）
- **VIP等级筛选**：筛选免费资源或VIP资源
- **排序**：支持按最新上传、下载最多、最热门排序

### 2. 资源展示
- **网格布局**：响应式网格布局，自适应不同屏幕尺寸
- **资源卡片**：显示资源封面、标题、格式、下载次数
- **VIP标识**：VIP资源显示VIP标签
- **懒加载**：图片懒加载，提升性能

### 3. 分页功能
- **分页器**：支持页码跳转、每页数量调整
- **总数显示**：显示资源总数
- **平滑滚动**：切换页码时自动滚动到顶部

### 4. URL参数支持
- **分类参数**：`?category=ui-design`
- **格式参数**：`?format=PSD`
- **VIP参数**：`?vip=1`
- **排序参数**：`?sort=download`
- **页码参数**：`?page=2`
- **关键词参数**：`?keyword=海报`

### 5. 状态管理
- **加载状态**：显示骨架屏加载动画
- **空状态**：无资源时显示空状态提示
- **错误处理**：网络错误时显示错误提示

### 6. 缓存策略
- **5分钟缓存**：相同筛选条件的请求使用缓存
- **自动清理**：定期清理过期缓存

## 使用示例

### 基本使用

```vue
<template>
  <ResourceList />
</template>

<script setup lang="ts">
import ResourceList from '@/views/Resource/List.vue';
</script>
```

### 通过路由跳转

```typescript
// 跳转到资源列表页
router.push('/resource');

// 跳转到指定分类
router.push('/resource?category=ui-design');

// 跳转到指定格式
router.push('/resource?format=PSD');

// 跳转到VIP资源
router.push('/resource?vip=1');

// 跳转到指定排序
router.push('/resource?sort=download');

// 跳转到指定页码
router.push('/resource?page=2');

// 组合多个参数
router.push('/resource?category=ui-design&format=PSD&sort=download&page=2');
```

### 从首页跳转

```vue
<!-- 首页分类导航 -->
<CategoryNav @category-click="handleCategoryClick" />

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function handleCategoryClick(categoryId: string) {
  router.push(`/resource?category=${categoryId}`);
}
</script>
```

### 从搜索框跳转

```vue
<!-- 搜索框 -->
<SearchBar @search="handleSearch" />

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function handleSearch(keyword: string) {
  router.push(`/resource?keyword=${keyword}`);
}
</script>
```

## 响应式设计

### 桌面端（>1200px）
- 4列网格布局
- 完整的筛选栏
- 完整的分页器

### 平板端（769px-1200px）
- 3列网格布局
- 简化的筛选栏
- 完整的分页器

### 移动端（<768px）
- 单列布局
- 垂直筛选栏
- 简化的分页器（隐藏每页数量和跳转）

## 性能优化

### 1. 图片懒加载
- 使用Element Plus的Image组件懒加载
- 只加载可视区域的图片

### 2. 缓存策略
- 5分钟缓存，减少重复请求
- 自动清理过期缓存

### 3. 虚拟滚动（可选）
- 长列表使用虚拟滚动
- 只渲染可视区域的元素

### 4. 防抖节流
- 筛选条件变化时防抖
- 滚动事件节流

## 注意事项

1. **URL同步**：筛选条件和URL参数保持同步
2. **状态管理**：使用resourceStore管理资源列表状态
3. **错误处理**：网络错误时显示友好提示
4. **空状态**：无资源时提供重置筛选按钮
5. **加载状态**：使用骨架屏提升用户体验
6. **移动端优化**：移动端使用简化布局和交互

## 相关组件

- `ResourceCard.vue` - 资源卡片组件
- `Loading.vue` - 加载动画组件
- `Empty.vue` - 空状态组件
- `CategoryNav.vue` - 分类导航组件
- `SearchBar.vue` - 搜索框组件

## 相关Store

- `resourceStore` - 资源状态管理
- `configStore` - 配置状态管理（分类列表）

## 相关API

- `getResourceList` - 获取资源列表
- `getCategories` - 获取分类列表
