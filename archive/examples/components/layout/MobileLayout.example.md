# MobileLayout 移动端布局组件

## 概述

MobileLayout 是专为移动端设计的布局组件，提供了完整的移动端导航体验，包括顶部导航栏、底部Tab栏、侧边抽屉菜单和手势操作支持。

## 功能特性

### 1. 顶部导航栏
- **Logo**: 点击返回首页
- **菜单按钮**: 打开侧边抽屉菜单
- **搜索按钮**: 打开全屏搜索界面

### 2. 底部Tab栏
- **首页**: 跳转到首页
- **分类**: 跳转到分类页面
- **上传**: 跳转到上传页面（中间突出显示）
- **我的**: 跳转到个人中心

### 3. 侧边抽屉菜单
- **用户信息**: 显示头像、昵称、VIP状态
- **快捷入口**: 首页、上传、VIP中心
- **热门分类**: 显示热门分类列表
- **全部分类**: 显示所有分类（最多8个）
- **退出登录**: 已登录用户可退出

### 4. 全屏搜索
- **搜索输入框**: 支持回车搜索
- **热门搜索**: 快速选择热门关键词
- **搜索历史**: （可扩展）

### 5. 手势操作
- **滑动返回**: 从屏幕左边缘向右滑动返回上一页
- **触觉反馈**: 点击时提供视觉反馈动画

## 使用方法

### 基础使用

```vue
<template>
  <MobileLayout>
    <!-- 页面内容会自动渲染在这里 -->
  </MobileLayout>
</template>

<script setup lang="ts">
import MobileLayout from '@/components/layout/MobileLayout.vue';
</script>
```

### 在App.vue中使用

```vue
<template>
  <div id="app">
    <!-- 根据屏幕尺寸选择布局 -->
    <DesktopLayout v-if="isDesktop" />
    <MobileLayout v-else />
  </div>
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

## 响应式设计

### 断点说明

- **< 768px**: 显示移动端布局
- **≥ 768px**: 隐藏移动端布局（显示桌面端布局）

### 安全区域适配

组件自动适配iOS设备的安全区域（刘海屏、底部横条）：

```css
/* 顶部安全区域 */
padding-top: env(safe-area-inset-top);

/* 底部安全区域 */
padding-bottom: env(safe-area-inset-bottom);
```

## 手势操作

### 滑动返回

从屏幕左边缘（< 50px）向右滑动超过50px，触发返回上一页：

```typescript
// 触摸开始
function handleTouchStart(e: TouchEvent) {
  if (e.touches[0].clientX < 50) {
    touchStartX.value = e.touches[0].clientX;
    isSwiping.value = true;
  }
}

// 触摸移动
function handleTouchMove(e: TouchEvent) {
  const deltaX = e.touches[0].clientX - touchStartX.value;
  if (deltaX > 50) {
    router.back(); // 返回上一页
  }
}
```

## 样式定制

### 主题色

组件使用品牌色作为主题色：

```css
/* 主色调 */
--primary-color: #165DFF;

/* 辅助色 */
--secondary-color: #FF7D00;

/* 渐变色 */
background: linear-gradient(135deg, #165DFF 0%, #FF7D00 100%);
```

### 暗色模式

组件自动适配系统暗色模式：

```css
@media (prefers-color-scheme: dark) {
  .mobile-layout {
    background: #1d1e1f;
  }
  
  .mobile-header {
    background: #2b2b2b;
  }
}
```

## 性能优化

### 1. 触摸事件优化

使用 `passive: true` 提升滚动性能：

```typescript
document.addEventListener('touchstart', handleTouchStart, { passive: true });
```

### 2. 点击高亮移除

移除移动端点击时的灰色高亮：

```css
-webkit-tap-highlight-color: transparent;
```

### 3. 动画优化

使用 CSS transform 和 transition 实现流畅动画：

```css
.tab-item {
  transition: color 0.3s ease;
}

.tab-item:active {
  animation: tap-feedback 0.2s ease;
}
```

## 可访问性

### ARIA标签

为按钮添加 `aria-label` 提升可访问性：

```vue
<button 
  class="icon-btn"
  aria-label="打开菜单"
  @click="drawerVisible = true"
>
  <el-icon><MenuIcon /></el-icon>
</button>
```

### 键盘导航

搜索输入框支持回车键提交：

```vue
<input
  v-model="searchKeyword"
  @keyup.enter="handleSearch"
/>
```

## 注意事项

### 1. 路由配置

确保路由配置正确，组件依赖以下路由：

- `/` - 首页
- `/categories` - 分类页面
- `/upload` - 上传页面
- `/personal` - 个人中心
- `/login` - 登录页面
- `/register` - 注册页面
- `/vip` - VIP中心
- `/search` - 搜索结果页

### 2. Store依赖

组件依赖以下Store：

- `userStore` - 用户状态管理
- `configStore` - 配置状态管理

### 3. 图标依赖

组件使用 Element Plus 图标库：

```typescript
import { 
  Menu, 
  Search,
  HomeFilled,
  Grid,
  Upload,
  User,
  Close,
  ArrowLeft
} from '@element-plus/icons-vue';
```

## 浏览器兼容性

- **iOS Safari**: 12+
- **Android Chrome**: 80+
- **Android WebView**: 80+

## 相关组件

- [DesktopLayout](./DesktopLayout.example.md) - 桌面端布局组件
- [SearchBar](../business/SearchBar.example.md) - 搜索框组件
- [CategoryNav](../business/CategoryNav.example.md) - 分类导航组件

## 更新日志

### v1.0.0 (2024-12-20)

- ✨ 初始版本
- ✨ 顶部导航栏
- ✨ 底部Tab栏
- ✨ 侧边抽屉菜单
- ✨ 全屏搜索
- ✨ 滑动返回手势
- ✨ 安全区域适配
- ✨ 暗色模式支持
