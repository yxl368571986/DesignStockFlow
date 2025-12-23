# SearchBar 搜索框组件

搜索框组件，提供搜索输入、联想建议、历史记录和热门搜索功能。

## 功能特性

- ✅ 搜索输入框（支持清空）
- ✅ 搜索按钮
- ✅ 搜索联想（防抖300ms）
- ✅ 历史搜索记录（localStorage存储）
- ✅ 热门搜索词展示
- ✅ 响应式设计
- ✅ 暗色模式支持

## 基础用法

```vue
<template>
  <SearchBar @search="handleSearch" />
</template>

<script setup lang="ts">
import SearchBar from '@/components/business/SearchBar.vue';

function handleSearch(keyword: string) {
  console.log('搜索关键词:', keyword);
}
</script>
```

## 自定义占位符

```vue
<template>
  <SearchBar placeholder="搜索你想要的设计资源..." />
</template>
```

## 隐藏搜索按钮

```vue
<template>
  <SearchBar :show-button="false" />
</template>
```

## 自动聚焦

```vue
<template>
  <SearchBar autofocus />
</template>
```

## 限制历史记录数量

```vue
<template>
  <SearchBar :max-history="5" />
</template>
```

## Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| placeholder | 占位符文本 | string | '搜索设计资源...' |
| showButton | 是否显示搜索按钮 | boolean | true |
| maxHistory | 最大历史记录数量 | number | 10 |
| autofocus | 是否自动聚焦 | boolean | false |

## Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| search | 执行搜索时触发 | (keyword: string) |
| clear | 清空搜索时触发 | - |

## 功能说明

### 搜索联想

- 输入关键词后自动显示搜索建议
- 防抖300ms，减少API请求
- 点击建议项直接搜索

### 历史记录

- 自动保存搜索历史到localStorage
- 支持删除单条记录
- 支持清空所有历史
- 最多保存10条（可配置）

### 热门搜索

- 显示平台热门搜索词
- 前3名高亮显示
- 点击直接搜索

## 样式定制

组件使用Element Plus主题色，支持暗色模式自动适配。

## 依赖

- Element Plus
- useSearch composable
- getHotSearchKeywords API

## 需求映射

- 需求7.1: 搜索框输入和联想
- 需求7.2: 历史搜索记录
- 需求7.3: 热门搜索词展示
