# CategoryNav 分类导航组件

## 功能说明

分类导航组件用于展示和切换资源分类，支持一级分类和二级分类的展示与交互。

## 主要特性

- ✅ 横向滚动分类列表（展示一级分类）
- ✅ 当前选中分类高亮显示
- ✅ 点击切换分类（更新路由参数）
- ✅ 支持二级分类展开（桌面端悬浮展开）
- ✅ 显示分类图标、名称、资源数量
- ✅ 热门分类显示"热门"标签
- ✅ 移动端支持左右滑动
- ✅ 桌面端支持鼠标拖拽滚动
- ✅ 从configStore获取分类数据

## 使用示例

### 基础使用

```vue
<template>
  <CategoryNav @category-change="handleCategoryChange" />
</template>

<script setup lang="ts">
import CategoryNav from '@/components/business/CategoryNav.vue';

function handleCategoryChange(categoryId: string | null) {
  console.log('分类切换:', categoryId);
}
</script>
```

### 隐藏滚动按钮

```vue
<template>
  <CategoryNav :show-scroll-buttons="false" />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| showScrollButtons | boolean | true | 是否显示滚动按钮（桌面端） |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| category-change | categoryId: string \| null | 分类切换时触发 |

## 数据来源

组件从 `configStore` 获取分类数据：

- `primaryCategories` - 一级分类列表
- `getSubCategories(parentId)` - 获取子分类
- `categories` - 所有分类数据

## 交互说明

### 桌面端

1. **点击分类** - 切换到该分类，更新路由参数
2. **悬浮分类** - 如果有二级分类，显示下拉菜单
3. **鼠标拖拽** - 可以拖拽滚动分类列表
4. **滚动按钮** - 点击左右箭头按钮滚动

### 移动端

1. **点击分类** - 切换到该分类
2. **左右滑动** - 滑动查看更多分类
3. **触摸拖拽** - 支持触摸拖拽滚动

## 样式说明

### 分类状态

- **默认状态** - 灰色背景 `#f5f7fa`
- **悬浮状态** - 蓝色背景 `#e8f4ff`，向上浮动
- **选中状态** - 蓝色渐变背景，白色文字

### 热门标签

热门分类会显示橙色渐变的"热门"标签。

### 二级分类

桌面端悬浮一级分类时，如果有二级分类会显示下拉菜单。

## 路由集成

组件会自动读取和更新路由参数：

```typescript
// 读取当前分类
const currentCategoryId = route.query.categoryId;

// 切换分类
router.push({
  query: {
    ...route.query,
    categoryId: newCategoryId,
    pageNum: '1' // 重置页码
  }
});
```

## 响应式设计

- **移动端** (<768px) - 隐藏滚动按钮，隐藏二级分类下拉
- **平板** (768px-1200px) - 调整间距和字体大小
- **桌面端** (>1200px) - 完整功能

## 性能优化

1. **懒加载分类数据** - 仅在需要时加载
2. **缓存分类数据** - configStore自动缓存10分钟
3. **虚拟滚动** - 使用CSS滚动，性能优秀
4. **防抖处理** - 悬浮事件有200ms延迟

## 注意事项

1. 确保在使用前已初始化 `configStore`
2. 组件依赖 `vue-router`，需要在路由环境中使用
3. 移动端不显示二级分类下拉菜单
4. 分类图标需要在 `CategoryInfo` 中配置

## 相关组件

- `ResourceCard` - 资源卡片组件
- `SearchBar` - 搜索框组件
- `ResourceList` - 资源列表页面
