<template>
  <div id="app">
    <!-- 网络状态提示组件 - 全局显示 -->
    <NetworkStatus />

    <!-- PWA更新提示组件 - 全局显示 -->
    <PWAUpdatePrompt />

    <!-- 响应式布局切换 -->
    <Transition
      name="layout-fade"
      mode="out-in"
    >
      <!-- 桌面端布局 (>= 768px) -->
      <DesktopLayout
        v-if="isDesktop"
        key="desktop"
      />

      <!-- 移动端布局 (< 768px) -->
      <MobileLayout
        v-else
        key="mobile"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue';
import NetworkStatus from '@/components/common/NetworkStatus.vue';
import PWAUpdatePrompt from '@/components/common/PWAUpdatePrompt.vue';

/**
 * 异步加载布局组件 - 按需加载，减少初始包体积
 *
 * 使用defineAsyncComponent实现组件懒加载：
 * - DesktopLayout: 桌面端布局（仅在桌面端加载）
 * - MobileLayout: 移动端布局（仅在移动端加载）
 *
 * 优势：
 * - 减少首屏加载时间
 * - 按需加载，节省带宽
 * - 提升移动端性能
 */
const DesktopLayout = defineAsyncComponent({
  loader: () => import('@/components/layout/DesktopLayout.vue'),
  // 加载时显示的组件
  loadingComponent: {
    template:
      '<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">加载中...</div>'
  },
  // 加载失败时显示的组件
  errorComponent: {
    template:
      '<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; color: red;">加载失败，请刷新页面</div>'
  },
  // 延迟显示加载组件的时间（ms）
  delay: 200,
  // 超时时间（ms）
  timeout: 10000
});

const MobileLayout = defineAsyncComponent({
  loader: () => import('@/components/layout/MobileLayout.vue'),
  loadingComponent: {
    template:
      '<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">加载中...</div>'
  },
  errorComponent: {
    template:
      '<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; color: red;">加载失败，请刷新页面</div>'
  },
  delay: 200,
  timeout: 10000
});

/**
 * 响应式布局切换
 *
 * 功能：
 * - 检测屏幕宽度（768px断点）
 * - 桌面端使用DesktopLayout
 * - 移动端使用MobileLayout
 * - 监听窗口resize事件
 * - 平滑过渡动画
 *
 * 需求: 需求15.1（响应式设计）
 */

// 断点宽度（768px）
const BREAKPOINT = 768;

// 是否为桌面端
const isDesktop = ref(false);

// 防抖定时器
let resizeTimer: number | null = null;

/**
 * 检测屏幕宽度并更新布局
 */
function checkScreenSize() {
  const width = window.innerWidth;
  isDesktop.value = width >= BREAKPOINT;
}

/**
 * 处理窗口resize事件（带防抖）
 */
function handleResize() {
  // 清除之前的定时器
  if (resizeTimer !== null) {
    clearTimeout(resizeTimer);
  }

  // 设置新的定时器（防抖300ms）
  resizeTimer = window.setTimeout(() => {
    checkScreenSize();
    resizeTimer = null;
  }, 300);
}

// 生命周期钩子
onMounted(() => {
  // 初始化检测屏幕尺寸
  checkScreenSize();

  // 监听窗口resize事件
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  // 移除resize事件监听
  window.removeEventListener('resize', handleResize);

  // 清除定时器
  if (resizeTimer !== null) {
    clearTimeout(resizeTimer);
  }
});
</script>

<style>
/* ========== 全局样式 ========== */
#app {
  width: 100%;
  min-height: 100vh;
  position: relative;
}

/* ========== 布局切换动画 ========== */
.layout-fade-enter-active,
.layout-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.layout-fade-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.layout-fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

/* ========== 平滑过渡 ========== */
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}

/* 排除某些元素的过渡效果 */
*:where(input, textarea, select, button, [role='button'], a, summary, [tabindex]) {
  transition-property: none;
}

/* ========== 滚动条样式 ========== */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* Firefox滚动条样式 */
* {
  scrollbar-width: thin;
  scrollbar-color: #c0c4cc #f5f7fa;
}

/* ========== 响应式断点 ========== */
/* 移动端 (< 768px) */
@media (max-width: 767px) {
  /* 移动端特定样式 */
  body {
    font-size: 14px;
  }
}

/* 平板 (768px - 1199px) */
@media (min-width: 768px) and (max-width: 1199px) {
  /* 平板特定样式 */
  body {
    font-size: 15px;
  }
}

/* 桌面端 (>= 1200px) */
@media (min-width: 1200px) {
  /* 桌面端特定样式 */
  body {
    font-size: 16px;
  }
}

/* ========== 暗色模式适配 ========== */
@media (prefers-color-scheme: dark) {
  ::-webkit-scrollbar-track {
    background: #2b2b2b;
  }

  ::-webkit-scrollbar-thumb {
    background: #606266;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #909399;
  }

  * {
    scrollbar-color: #606266 #2b2b2b;
  }
}

/* ========== 触摸设备优化 ========== */
@media (hover: none) and (pointer: coarse) {
  /* 移除hover效果，使用active代替 */
  *:hover {
    /* 禁用hover效果 */
  }

  /* 增大触摸目标 */
  button,
  a,
  [role='button'],
  [tabindex] {
    min-height: 44px;
    min-width: 44px;
  }
}

/* ========== 打印样式 ========== */
@media print {
  /* 隐藏不需要打印的元素 */
  header,
  nav,
  aside,
  footer,
  .mobile-tabbar,
  .sidebar {
    display: none !important;
  }

  /* 优化打印布局 */
  #app {
    background: #fff !important;
  }

  .main-content {
    max-width: 100% !important;
    padding: 0 !important;
  }
}

/* ========== 无障碍优化 ========== */
/* 聚焦指示器 */
:focus-visible {
  outline: 2px solid #165dff;
  outline-offset: 2px;
  border-radius: 4px;
}

/* 减少动画（用户偏好） */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .layout-fade-enter-active,
  .layout-fade-leave-active {
    transition: none !important;
  }
}

/* ========== 高对比度模式 ========== */
@media (prefers-contrast: high) {
  /* 增强对比度 */
  body {
    color: #000;
    background: #fff;
  }

  a {
    text-decoration: underline;
  }

  button {
    border: 2px solid currentColor;
  }
}
</style>
