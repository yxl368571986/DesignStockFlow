# NetworkStatus 组件使用说明

## 概述

NetworkStatus 是一个全局网络状态提示组件，用于监控网络连接状态并向用户显示友好的提示信息。

## 功能特性

- ✅ 实时监控网络在线/离线状态
- ✅ 显示离线状态提示条（橙色背景）
- ✅ 显示网络恢复提示（绿色背景，3秒后自动隐藏）
- ✅ 显示慢速网络警告（橙色背景，3秒后自动隐藏）
- ✅ 提供重新连接按钮（离线时可用）
- ✅ 支持手动关闭提示条
- ✅ 响应式设计，适配移动端和桌面端

## 使用方法

### 全局使用（推荐）

在 `App.vue` 中引入组件，使其在整个应用中可用：

```vue
<template>
  <div id="app">
    <!-- 网络状态提示组件 - 全局显示 -->
    <NetworkStatus />
    
    <router-view />
  </div>
</template>

<script setup lang="ts">
import NetworkStatus from '@/components/common/NetworkStatus.vue';
</script>
```

### 局部使用

在特定页面或组件中使用：

```vue
<template>
  <div>
    <NetworkStatus />
    <!-- 其他内容 -->
  </div>
</template>

<script setup lang="ts">
import NetworkStatus from '@/components/common/NetworkStatus.vue';
</script>
```

## 组件行为

### 离线状态

当网络断开时：
- 显示橙色提示条
- 显示消息："网络连接已断开，请检查网络设置"
- 显示"重新连接"按钮
- 提示条不会自动隐藏

### 网络恢复

当网络从离线恢复到在线时：
- 显示绿色提示条
- 显示消息："网络已恢复"
- 3秒后自动隐藏

### 慢速网络

当检测到慢速网络（2G/3G）时：
- 显示橙色提示条
- 显示消息："当前网络较慢，建议切换到更快的网络"
- 3秒后自动隐藏

## 用户交互

### 重新连接按钮

- 仅在离线状态下显示
- 点击后尝试重新连接网络
- 连接中显示加载动画和"重新连接中..."文本
- 连接成功后自动隐藏提示条

### 关闭按钮

- 所有状态下都显示
- 点击后立即隐藏提示条
- 清除自动隐藏定时器

## 样式定制

组件使用 scoped 样式，可以通过以下方式自定义：

```vue
<style>
/* 修改提示条位置 */
.network-status-banner {
  top: 60px; /* 如果有固定导航栏 */
}

/* 修改离线状态颜色 */
.banner-offline {
  background-color: #ff4d4f;
}

/* 修改成功状态颜色 */
.banner-success {
  background-color: #52c41a;
}
</style>
```

## 技术实现

### 依赖

- `useNetworkStatus` composable - 提供网络状态监控
- Vue 3 Composition API
- Element Plus（用于消息提示）

### 核心逻辑

```typescript
// 监听在线状态变化
watch(isOnline, (online, wasOnline) => {
  if (!online) {
    // 离线时显示横幅
    showBanner.value = true;
    clearAutoHideTimer();
  } else if (wasOnline === false) {
    // 从离线恢复到在线时显示横幅，并在3秒后自动隐藏
    showBanner.value = true;
    setAutoHide();
  }
});
```

## 响应式设计

组件在移动端（<768px）会自动调整：
- 减小内边距
- 缩小字体大小
- 缩小图标尺寸
- 调整按钮大小

## 无障碍支持

- 关闭按钮包含 `aria-label="关闭"`
- 使用语义化的 SVG 图标
- 支持键盘操作

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 注意事项

1. **全局唯一性**：建议只在 App.vue 中使用一次，避免重复显示
2. **Z-index**：组件使用 `z-index: 9999`，确保在最上层显示
3. **自动隐藏**：网络恢复和慢速网络提示会在3秒后自动隐藏
4. **离线提示**：离线状态的提示不会自动隐藏，需要用户手动关闭或网络恢复

## 相关需求

- 需求14.1（网络状态提示）
- 需求14.2（离线页面展示）
- 需求14.3（离线功能限制）

## 示例场景

### 场景1：用户网络断开

```
1. 用户正在浏览资源列表
2. 网络突然断开
3. 顶部显示橙色提示条："网络连接已断开，请检查网络设置"
4. 用户点击"重新连接"按钮
5. 系统尝试重新连接
6. 连接成功后显示绿色提示："网络已恢复"
7. 3秒后提示自动消失
```

### 场景2：用户在弱网环境

```
1. 用户切换到2G网络
2. 系统检测到慢速网络
3. 顶部显示橙色提示条："当前网络较慢，建议切换到更快的网络"
4. 3秒后提示自动消失
```

### 场景3：用户手动关闭提示

```
1. 网络断开，显示离线提示
2. 用户点击关闭按钮
3. 提示立即消失
4. 网络恢复时会再次显示提示
```
