<!--
  移动端布局组件
  
  功能：
  - 顶部导航栏（Logo、搜索图标、菜单图标）
  - 底部Tab栏（首页、分类、上传、我的）
  - 抽屉菜单（侧边滑出）
  - 主内容区域（router-view）
  - 支持手势操作（滑动返回）
  
  需求: 需求15.1（移动端布局）
-->

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  HomeFilled,
  Grid,
  Upload,
  User,
  Close as CloseIcon,
  ArrowLeft,
  Coin
} from '@element-plus/icons-vue';
import { useUserStore } from '@/pinia/userStore';
import { useConfigStore } from '@/pinia/configStore';

/**
 * 移动端布局组件
 */

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const configStore = useConfigStore();

// 本地状态
const drawerVisible = ref(false); // 抽屉菜单是否显示
const showSearchBar = ref(false); // 是否显示搜索栏
const searchKeyword = ref(''); // 搜索关键词
const touchStartX = ref(0); // 触摸开始X坐标
const touchStartY = ref(0); // 触摸开始Y坐标
const isSwiping = ref(false); // 是否正在滑动

// 计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn);
const userInfo = computed(() => userStore.userInfo);
const displayName = computed(() => userStore.displayName);
const isVIP = computed(() => userStore.isVIP);
const vipLevelName = computed(() => userStore.vipLevelName);
const pointsBalance = computed(() => userStore.pointsBalance);
const primaryCategories = computed(() => configStore.primaryCategories);
const hotCategories = computed(() => configStore.hotCategories);

// 当前激活的Tab
const activeTab = computed(() => {
  const path = route.path;
  if (path === '/') return 'home';
  if (path.startsWith('/categories') || path.startsWith('/resource')) return 'category';
  if (path.startsWith('/upload')) return 'upload';
  if (path.startsWith('/personal')) return 'personal';
  return 'home';
});

/**
 * 跳转到首页
 */
function goToHome() {
  router.push('/');
  drawerVisible.value = false;
}

/**
 * 跳转到登录页
 */
function goToLogin() {
  router.push('/login');
  drawerVisible.value = false;
}

/**
 * 跳转到注册页
 */
function goToRegister() {
  router.push('/register');
  drawerVisible.value = false;
}

/**
 * 跳转到个人中心
 */
function goToPersonal() {
  router.push('/personal');
  drawerVisible.value = false;
}

/**
 * 跳转到上传页面
 */
function goToUpload() {
  router.push('/upload');
  drawerVisible.value = false;
}

/**
 * 跳转到VIP中心
 */
function goToVIP() {
  router.push('/vip');
  drawerVisible.value = false;
}

/**
 * 跳转到积分页面
 */
function goToPoints() {
  router.push('/points');
  drawerVisible.value = false;
}

/**
 * 跳转到分类页面
 */
function goToCategory(categoryId?: string) {
  if (categoryId) {
    router.push(`/resource?categoryId=${categoryId}`);
  } else {
    router.push('/categories');
  }
  drawerVisible.value = false;
}

/**
 * 退出登录
 */
function handleLogout() {
  userStore.logout();
  drawerVisible.value = false;
  router.push('/');
}

/**
 * 打开搜索栏
 */
function openSearch() {
  showSearchBar.value = true;
}

/**
 * 关闭搜索栏
 */
function closeSearch() {
  showSearchBar.value = false;
  searchKeyword.value = '';
}

/**
 * 执行搜索
 */
function handleSearch() {
  if (searchKeyword.value.trim()) {
    router.push(`/search?keyword=${encodeURIComponent(searchKeyword.value)}`);
    closeSearch();
  }
}

/**
 * Tab栏点击
 */
function handleTabClick(tab: string) {
  switch (tab) {
    case 'home':
      router.push('/');
      break;
    case 'category':
      router.push('/categories');
      break;
    case 'upload':
      router.push('/upload');
      break;
    case 'personal':
      router.push('/personal');
      break;
  }
}

/**
 * 处理触摸开始（滑动返回手势）
 */
function handleTouchStart(e: TouchEvent) {
  // 只在屏幕左边缘触发
  if (e.touches[0].clientX < 50) {
    touchStartX.value = e.touches[0].clientX;
    touchStartY.value = e.touches[0].clientY;
    isSwiping.value = true;
  }
}

/**
 * 处理触摸移动
 */
function handleTouchMove(e: TouchEvent) {
  if (!isSwiping.value) return;

  const touchX = e.touches[0].clientX;
  const touchY = e.touches[0].clientY;
  const deltaX = touchX - touchStartX.value;
  const deltaY = touchY - touchStartY.value;

  // 判断是否为水平滑动（向右滑动且水平距离大于垂直距离）
  if (deltaX > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
    // 触发返回
    if (window.history.length > 1) {
      router.back();
    }
    isSwiping.value = false;
  }
}

/**
 * 处理触摸结束
 */
function handleTouchEnd() {
  isSwiping.value = false;
  touchStartX.value = 0;
  touchStartY.value = 0;
}

// 生命周期钩子
onMounted(() => {
  // 初始化配置
  if (!configStore.siteConfig) {
    configStore.initConfig();
  }

  // 添加手势监听
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
});

onBeforeUnmount(() => {
  // 移除手势监听
  document.removeEventListener('touchstart', handleTouchStart);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', handleTouchEnd);
});
</script>

<template>
  <div class="mobile-layout">
    <!-- 顶部导航栏 -->
    <header class="mobile-header">
      <div class="header-content">
        <!-- 菜单按钮 -->
        <button
          class="icon-btn"
          aria-label="打开菜单"
          @click="drawerVisible = true"
        >
          <el-icon :size="24">
            <MenuIcon />
          </el-icon>
        </button>

        <!-- Logo -->
        <div
          class="logo"
          @click="goToHome"
        >
          <svg
            viewBox="0 0 100 100"
            class="logo-icon"
          >
            <defs>
              <linearGradient
                id="mobileLogoGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style="stop-color: #165dff; stop-opacity: 1"
                />
                <stop
                  offset="100%"
                  style="stop-color: #ff7d00; stop-opacity: 1"
                />
              </linearGradient>
            </defs>
            <polygon
              points="50,10 61,35 88,35 67,52 77,77 50,60 23,77 33,52 12,35 39,35"
              fill="url(#mobileLogoGradient)"
            />
          </svg>
          <span class="logo-text">星潮</span>
        </div>

        <!-- 搜索按钮 -->
        <button
          class="icon-btn"
          aria-label="搜索"
          @click="openSearch"
        >
          <el-icon :size="24">
            <SearchIcon />
          </el-icon>
        </button>
      </div>
    </header>

    <!-- 搜索栏（全屏） -->
    <Transition name="slide-down">
      <div
        v-if="showSearchBar"
        class="search-overlay"
      >
        <div class="search-header">
          <button
            class="icon-btn"
            aria-label="返回"
            @click="closeSearch"
          >
            <el-icon :size="24">
              <ArrowLeft />
            </el-icon>
          </button>
          <input
            v-model="searchKeyword"
            type="search"
            placeholder="搜索设计资源..."
            class="search-input"
            autofocus
            @keyup.enter="handleSearch"
          >
          <button
            v-if="searchKeyword"
            class="icon-btn"
            aria-label="清空"
            @click="searchKeyword = ''"
          >
            <el-icon :size="20">
              <CloseIcon />
            </el-icon>
          </button>
        </div>
        <div class="search-content">
          <!-- 搜索历史、热门搜索等可以在这里添加 -->
          <div class="search-section">
            <h3 class="search-section-title">
              热门搜索
            </h3>
            <div class="search-tags">
              <span
                class="search-tag"
                @click="searchKeyword = 'UI设计'"
              >UI设计</span>
              <span
                class="search-tag"
                @click="searchKeyword = '海报'"
              >海报</span>
              <span
                class="search-tag"
                @click="searchKeyword = '插画'"
              >插画</span>
              <span
                class="search-tag"
                @click="searchKeyword = '图标'"
              >图标</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 侧边抽屉菜单 -->
    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      :size="280"
      :show-close="false"
      class="mobile-drawer"
    >
      <template #header>
        <div class="drawer-header">
          <!-- 用户信息 -->
          <div
            v-if="isLoggedIn"
            class="user-info"
            @click="goToPersonal"
          >
            <el-avatar
              :src="userInfo?.avatar"
              :size="60"
              class="user-avatar"
            >
              <el-icon :size="30">
                <User />
              </el-icon>
            </el-avatar>
            <div class="user-details">
              <span class="user-name">{{ displayName }}</span>
              <span
                v-if="isVIP"
                class="vip-badge"
              >{{ vipLevelName }}</span>
              <!-- 积分显示 -->
              <div
                class="user-points"
                title="点击查看积分详情"
                @click="goToPoints"
              >
                <el-icon><Coin /></el-icon>
                <span>{{ pointsBalance }} 积分</span>
              </div>
            </div>
          </div>

          <!-- 未登录状态 -->
          <div
            v-else
            class="login-prompt"
          >
            <el-button
              type="primary"
              size="large"
              @click="goToLogin"
            >
              登录
            </el-button>
            <el-button
              size="large"
              @click="goToRegister"
            >
              注册
            </el-button>
          </div>
        </div>
      </template>

      <!-- 菜单内容 -->
      <div class="drawer-content">
        <!-- 快捷入口 -->
        <div class="menu-section">
          <h3 class="menu-title">
            快捷入口
          </h3>
          <ul class="menu-list">
            <li
              class="menu-item"
              @click="goToHome"
            >
              <el-icon :size="20">
                <HomeFilled />
              </el-icon>
              <span>首页</span>
            </li>
            <li
              v-if="isLoggedIn"
              class="menu-item"
              @click="goToUpload"
            >
              <el-icon :size="20">
                <Upload />
              </el-icon>
              <span>上传作品</span>
            </li>
            <li
              v-if="isLoggedIn"
              class="menu-item"
              @click="goToVIP"
            >
              <el-icon :size="20">
                <Grid />
              </el-icon>
              <span>VIP中心</span>
            </li>
          </ul>
        </div>

        <!-- 热门分类 -->
        <div
          v-if="hotCategories.length > 0"
          class="menu-section"
        >
          <h3 class="menu-title">
            热门分类
          </h3>
          <ul class="menu-list">
            <li
              v-for="category in hotCategories"
              :key="category.categoryId"
              class="menu-item"
              @click="goToCategory(category.categoryId)"
            >
              <span class="category-icon">{{ category.icon || '📁' }}</span>
              <span>{{ category.categoryName }}</span>
              <span class="category-count">{{ category.resourceCount || 0 }}</span>
            </li>
          </ul>
        </div>

        <!-- 全部分类 -->
        <div
          v-if="primaryCategories.length > 0"
          class="menu-section"
        >
          <h3 class="menu-title">
            全部分类
          </h3>
          <ul class="menu-list">
            <li
              v-for="category in primaryCategories.slice(0, 8)"
              :key="category.categoryId"
              class="menu-item"
              @click="goToCategory(category.categoryId)"
            >
              <span class="category-icon">{{ category.icon || '📁' }}</span>
              <span>{{ category.categoryName }}</span>
              <span class="category-count">{{ category.resourceCount || 0 }}</span>
            </li>
          </ul>
          <div
            class="menu-more"
            @click="goToCategory()"
          >
            查看更多分类 →
          </div>
        </div>

        <!-- 退出登录 -->
        <div
          v-if="isLoggedIn"
          class="menu-section"
        >
          <el-button
            type="danger"
            plain
            class="logout-btn"
            @click="handleLogout"
          >
            退出登录
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 主内容区域 -->
    <main class="mobile-main">
      <router-view />
    </main>

    <!-- 底部Tab栏 -->
    <nav class="mobile-tabbar">
      <div class="tabbar-content">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'home' }"
          @click="handleTabClick('home')"
        >
          <el-icon :size="24">
            <HomeFilled />
          </el-icon>
          <span class="tab-label">首页</span>
        </div>

        <div
          class="tab-item"
          :class="{ active: activeTab === 'category' }"
          @click="handleTabClick('category')"
        >
          <el-icon :size="24">
            <Grid />
          </el-icon>
          <span class="tab-label">分类</span>
        </div>

        <div
          class="tab-item tab-upload"
          :class="{ active: activeTab === 'upload' }"
          @click="handleTabClick('upload')"
        >
          <div class="upload-icon">
            <el-icon :size="28">
              <Upload />
            </el-icon>
          </div>
          <span class="tab-label">上传</span>
        </div>

        <div
          class="tab-item"
          :class="{ active: activeTab === 'personal' }"
          @click="handleTabClick('personal')"
        >
          <el-icon :size="24">
            <User />
          </el-icon>
          <span class="tab-label">我的</span>
        </div>
      </div>
    </nav>
  </div>
</template>

<style scoped>
/* ========== 布局容器 ========== */
.mobile-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  padding-bottom: env(safe-area-inset-bottom);
}

/* ========== 顶部导航栏 ========== */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  padding-top: env(safe-area-inset-top);
}

.header-content {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: #303133;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.3s ease;
  -webkit-tap-highlight-color: transparent;
}

.icon-btn:active {
  background-color: #f5f7fa;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.logo-icon {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  background: linear-gradient(135deg, #165dff 0%, #ff7d00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ========== 搜索栏（全屏） ========== */
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top);
}

.search-header {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.search-input {
  flex: 1;
  height: 40px;
  border: none;
  outline: none;
  font-size: 16px;
  color: #303133;
  background: transparent;
}

.search-input::placeholder {
  color: #909399;
}

.search-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.search-section {
  margin-bottom: 24px;
}

.search-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-tag {
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 20px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
  -webkit-tap-highlight-color: transparent;
}

.search-tag:active {
  background: #e4e7ed;
  transform: scale(0.95);
}

/* 搜索栏动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
}

.slide-down-leave-to {
  transform: translateY(-100%);
}

/* ========== 侧边抽屉 ========== */
.drawer-header {
  padding: 24px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.user-avatar {
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.vip-badge {
  font-size: 12px;
  color: #fff;
  background: linear-gradient(135deg, #ff7d00 0%, #ffa940 100%);
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
  width: fit-content;
}

/* 用户积分显示 */
.user-points {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #f59e0b;
  margin-top: 4px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
  -webkit-tap-highlight-color: transparent;
}

.user-points:hover,
.user-points:active {
  background: rgba(245, 158, 11, 0.1);
}

.user-points .el-icon {
  font-size: 14px;
}

.login-prompt {
  display: flex;
  gap: 12px;
}

.login-prompt .el-button {
  flex: 1;
}

/* 抽屉内容 */
.drawer-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  padding-left: 8px;
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 15px;
  color: #606266;
  -webkit-tap-highlight-color: transparent;
}

.menu-item:active {
  background-color: #f5f7fa;
}

.menu-item .el-icon {
  flex-shrink: 0;
}

.category-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.category-count {
  margin-left: auto;
  font-size: 13px;
  color: #909399;
}

.menu-more {
  padding: 12px 16px;
  text-align: center;
  color: #165dff;
  font-size: 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.menu-more:active {
  opacity: 0.7;
}

.logout-btn {
  width: 100%;
}

/* ========== 主内容区域 ========== */
.mobile-main {
  flex: 1;
  margin-top: calc(56px + env(safe-area-inset-top));
  margin-bottom: calc(64px + env(safe-area-inset-bottom));
  overflow-y: auto;
}

/* ========== 底部Tab栏 ========== */
.mobile-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e4e7ed;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-content {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: #909399;
  transition: color 0.3s ease;
  -webkit-tap-highlight-color: transparent;
  position: relative;
}

.tab-item:active {
  opacity: 0.7;
}

.tab-item.active {
  color: #165dff;
}

.tab-label {
  font-size: 12px;
  font-weight: 500;
}

/* 上传按钮特殊样式 */
.tab-upload {
  position: relative;
}

.upload-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff7d00 0%, #ffa940 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 125, 0, 0.3);
  position: absolute;
  top: -24px;
}

.tab-upload .tab-label {
  margin-top: 28px;
}

.tab-upload.active .upload-icon {
  transform: scale(1.1);
}

/* ========== 响应式适配 ========== */
@media (min-width: 768px) {
  /* 平板及以上设备隐藏移动端布局 */
  .mobile-layout {
    display: none;
  }
}

/* ========== 暗色模式适配 ========== */
@media (prefers-color-scheme: dark) {
  .mobile-layout {
    background: #1d1e1f;
  }

  .mobile-header {
    background: #2b2b2b;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .icon-btn {
    color: #e5eaf3;
  }

  .icon-btn:active {
    background-color: #3a3a3a;
  }

  .search-overlay {
    background: #2b2b2b;
  }

  .search-header {
    border-bottom-color: #3a3a3a;
  }

  .search-input {
    color: #e5eaf3;
  }

  .search-input::placeholder {
    color: #a8abb2;
  }

  .search-section-title {
    color: #e5eaf3;
  }

  .search-tag {
    background: #3a3a3a;
    color: #a8abb2;
  }

  .search-tag:active {
    background: #4a4a4a;
  }

  .drawer-header {
    border-bottom-color: #3a3a3a;
  }

  .user-name {
    color: #e5eaf3;
  }

  .menu-title {
    color: #e5eaf3;
  }

  .menu-item {
    color: #a8abb2;
  }

  .menu-item:active {
    background-color: #3a3a3a;
  }

  .mobile-tabbar {
    background: #2b2b2b;
    border-top-color: #3a3a3a;
  }

  .tab-item {
    color: #a8abb2;
  }

  .tab-item.active {
    color: #4d9fff;
  }
}

/* ========== 触觉反馈动画 ========== */
@keyframes tap-feedback {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

.icon-btn:active,
.menu-item:active,
.tab-item:active {
  animation: tap-feedback 0.2s ease;
}
</style>
