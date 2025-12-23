# DesktopLayout 桌面端布局组件

## 概述

桌面端布局组件，提供完整的页面布局结构，包括顶部导航栏、侧边栏、主内容区域和底部信息栏。

## 功能特性

- ✅ 顶部导航栏（Logo、搜索框、用户信息）
- ✅ 侧边栏（分类导航、快捷入口）
- ✅ 主内容区域（router-view）
- ✅ 底部信息栏（版权、备案号、友情链接）
- ✅ 固定定位导航栏（滚动时保持可见）
- ✅ 响应式设计（适配不同屏幕尺寸）
- ✅ 暗色模式支持

## 使用方式

### 基础用法

在 `App.vue` 中使用：

```vue
<template>
  <DesktopLayout v-if="isDesktop" />
  <MobileLayout v-else />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import DesktopLayout from '@/components/layout/DesktopLayout.vue';
import MobileLayout from '@/components/layout/MobileLayout.vue';

const isDesktop = ref(window.innerWidth >= 768);

function handleResize() {
  isDesktop.value = window.innerWidth >= 768;
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>
```

### 在路由中使用

```typescript
// router/index.ts
import DesktopLayout from '@/components/layout/DesktopLayout.vue';

const routes = [
  {
    path: '/',
    component: DesktopLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home/index.vue')
      },
      {
        path: 'resource/list',
        name: 'ResourceList',
        component: () => import('@/views/Resource/List.vue')
      }
      // ... 其他子路由
    ]
  }
];
```

## 布局结构

```
┌─────────────────────────────────────────────────────────┐
│                      顶部导航栏                          │
│  Logo  |  搜索框  |  上传  |  登录/用户信息              │
└─────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────────┐
│          │                                              │
│  侧边栏  │            主内容区域                        │
│          │          (router-view)                       │
│  分类    │                                              │
│  导航    │                                              │
│          │                                              │
│  快捷    │                                              │
│  入口    │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                      底部信息栏                          │
│  友情链接  |  关于我们  |  帮助中心  |  联系方式        │
│                    版权信息 | 备案号                    │
└─────────────────────────────────────────────────────────┘
```

## 组件特性

### 1. 顶部导航栏

- **Logo区域**：点击跳转首页，支持悬浮放大效果
- **搜索框**：集成 SearchBar 组件，支持搜索联想
- **上传按钮**：橙色渐变按钮，跳转上传页面
- **用户信息**：
  - 未登录：显示登录/注册按钮
  - 已登录：显示用户头像、昵称、VIP标识
  - 下拉菜单：个人中心、VIP中心、退出登录

### 2. 固定导航栏

- 页面滚动超过 80px 时，导航栏固定在顶部
- 固定时增强阴影效果，提升视觉层次
- 添加占位符防止内容跳动

### 3. 侧边栏

- **分类导航**：
  - 热门分类：显示标记为热门的分类
  - 全部分类：显示所有一级分类
  - 显示分类图标、名称、资源数量
  - 悬浮效果：背景变化 + 向右平移

- **快捷入口**：
  - 上传作品
  - 个人中心
  - VIP中心
  - 悬浮渐变背景效果

- **折叠功能**：
  - 点击折叠按钮收起/展开侧边栏
  - 折叠后宽度从 240px 缩小到 60px
  - 平滑过渡动画

- **粘性定位**：
  - 侧边栏固定在视口顶部（top: 104px）
  - 滚动时保持可见

### 4. 主内容区域

- 使用 `<router-view />` 渲染子路由
- 自适应宽度，占据剩余空间
- 最小宽度为 0，防止内容溢出

### 5. 底部信息栏

- **友情链接**：外部链接，新标签页打开
- **关于我们**：关于、联系、加入、协议
- **帮助中心**：新手指南、上传规范、VIP说明、FAQ
- **联系方式**：客服邮箱、商务合作、工作时间
- **版权信息**：从 configStore 读取，支持自定义
- **备案号**：链接到工信部备案查询

## 响应式设计

### 桌面端（> 1200px）
- 完整布局，侧边栏宽度 240px
- 搜索框最大宽度 600px
- 底部信息栏 4 列网格

### 平板端（992px - 1200px）
- 侧边栏宽度缩小到 200px
- 搜索框最大宽度 400px
- 底部信息栏 2 列网格

### 小屏幕（< 992px）
- 隐藏侧边栏
- 底部信息栏 1 列网格
- 建议切换到 MobileLayout

## 暗色模式

组件支持系统暗色模式，自动适配：

- 背景色：#1d1e1f
- 卡片背景：#2b2b2b
- 文字颜色：#e5eaf3 / #a8abb2
- 边框颜色：#3a3a3a
- 悬浮背景：#3a3a3a

## 依赖组件

- `SearchBar`：搜索框组件
- `useUserStore`：用户状态管理
- `useConfigStore`：配置状态管理
- `vue-router`：路由管理
- `element-plus`：UI组件库

## 注意事项

1. **初始化配置**：组件挂载时会自动调用 `configStore.initConfig()` 初始化配置
2. **滚动监听**：组件会监听 window 滚动事件，卸载时自动清理
3. **响应式断点**：建议在 768px 以下切换到 MobileLayout
4. **路由跳转**：所有导航操作都通过 vue-router 进行
5. **状态管理**：用户信息和配置数据从 Pinia Store 读取

## 性能优化

- 使用 `computed` 缓存计算属性
- 侧边栏使用 `position: sticky` 减少重绘
- 过渡动画使用 CSS `transition`，性能更好
- 滚动事件监听在组件卸载时清理

## 可访问性

- Logo 区域可点击，支持键盘导航
- 所有交互元素支持键盘操作
- 使用语义化 HTML 标签（header、aside、main、footer）
- 链接使用 `rel="noopener"` 防止安全风险

## 相关需求

- 需求1.1：桌面端布局
- 需求2：用户认证与授权
- 需求7：搜索功能
- 需求16：内容运营管理
