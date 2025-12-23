# 首页组件 (Home/index.vue)

## 功能概述

首页是星潮设计平台的主入口，展示平台的核心内容和功能入口。

## 主要功能

### 1. 公告横幅
- 显示重要公告和置顶公告
- 支持垂直轮播（多条公告时）
- 点击公告可跳转到详情页或外部链接
- 支持关闭，24小时内不再显示

### 2. 轮播图区域
- 使用 `BannerCarousel` 组件
- 自动轮播，3秒间隔
- 响应式图片（桌面端400px，移动端200px）
- 点击可跳转到指定页面

### 3. 分类导航区域
- 使用 `CategoryNav` 组件
- 横向滚动展示所有分类
- 支持二级分类下拉
- 点击分类跳转到资源列表页

### 4. 热门资源区域
- 展示8个热门资源
- 使用 `ResourceCard` 组件网格布局
- 支持下载和收藏操作
- 点击"查看更多"跳转到热门资源列表

### 5. 推荐资源区域
- 展示8个精选推荐资源
- 使用 `ResourceCard` 组件网格布局
- 支持下载和收藏操作
- 点击"查看更多"跳转到推荐资源列表

## 数据来源

### ConfigStore
- `importantAnnouncements` - 重要公告列表
- `activeBanners` - 激活的轮播图列表
- `primaryCategories` - 一级分类列表

### API接口
- `getHotResources(limit)` - 获取热门资源
- `getRecommendedResources(limit)` - 获取推荐资源
- `collectResource(resourceId)` - 收藏资源

## 响应式设计

### 桌面端 (>1200px)
- 资源网格：4列
- 轮播图高度：400px
- 显示完整导航和操作按钮

### 平板端 (768px-1200px)
- 资源网格：3列
- 轮播图高度：300px
- 适当缩小间距

### 移动端 (<768px)
- 资源网格：2列
- 轮播图高度：200px
- 隐藏部分操作按钮
- 优化触摸交互

## 使用示例

```vue
<template>
  <Home />
</template>

<script setup lang="ts">
import Home from '@/views/Home/index.vue';
</script>
```

## 路由配置

```typescript
{
  path: '/',
  name: 'Home',
  component: () => import('@/views/Home/index.vue'),
  meta: {
    title: '首页 - 星潮设计'
  }
}
```

## 性能优化

1. **并行加载**: 热门资源和推荐资源并行获取
2. **缓存策略**: ConfigStore自动缓存轮播图和分类数据
3. **懒加载**: 资源卡片图片使用懒加载
4. **骨架屏**: 加载时显示骨架屏，提升用户体验

## 注意事项

1. 首次访问时会自动初始化配置数据（轮播图、分类、公告）
2. 公告关闭后会记录到localStorage，24小时内不再显示
3. 资源下载需要登录，未登录会弹出确认对话框
4. VIP资源需要VIP权限，非VIP用户会弹出升级提示

## 相关组件

- `BannerCarousel` - 轮播图组件
- `CategoryNav` - 分类导航组件
- `ResourceCard` - 资源卡片组件
- `Loading` - 加载动画组件
- `Empty` - 空状态组件

## 相关Store

- `configStore` - 配置状态管理
- `userStore` - 用户状态管理（通过useDownload间接使用）

## 相关API

- `/resource/hot` - 获取热门资源
- `/resource/recommended` - 获取推荐资源
- `/resource/collect` - 收藏资源
