<!--
  桌面端布局组件
  
  功能：
  - 顶部导航栏（Logo、搜索框、用户信息）
  - 侧边栏（分类导航、快捷入口）
  - 主内容区域（router-view）
  - 底部信息栏（版权、备案号、友情链接）
  - 固定定位导航栏（滚动时保持可见）
  
  需求: 需求1.1（桌面端布局）
-->

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { User, Upload, Download, Setting } from '@element-plus/icons-vue';
import SearchBar from '@/components/business/SearchBar.vue';
import { useUserStore } from '@/pinia/userStore';
import { useConfigStore } from '@/pinia/configStore';

/**
 * 桌面端布局组件
 */

const router = useRouter();
const userStore = useUserStore();
const configStore = useConfigStore();

// 本地状态
const isHeaderFixed = ref(false); // 导航栏是否固定
const showUserMenu = ref(false); // 是否显示用户菜单
const sidebarCollapsed = ref(false); // 侧边栏是否折叠

// 计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn);
const userInfo = computed(() => userStore.userInfo);
const displayName = computed(() => userStore.displayName);
const isVIP = computed(() => userStore.isVIP);
const vipLevelName = computed(() => userStore.vipLevelName);
const siteConfig = computed(() => configStore.siteConfig);
const primaryCategories = computed(() => configStore.primaryCategories);
const hotCategories = computed(() => configStore.hotCategories);

// 检查是否是管理员
const isAdmin = computed(() => {
  const roleCode = userInfo.value?.roleCode;
  return roleCode === 'super_admin' || 
         roleCode === 'moderator' || 
         roleCode === 'operator';
});

/**
 * 处理滚动事件
 */
function handleScroll() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  isHeaderFixed.value = scrollTop > 80;
}

/**
 * 跳转到首页
 */
function goToHome() {
  router.push('/');
}

/**
 * 跳转到登录页
 */
function goToLogin() {
  router.push('/login');
}

/**
 * 跳转到注册页
 */
function goToRegister() {
  router.push('/register');
}

/**
 * 跳转到个人中心
 */
function goToPersonal() {
  router.push('/personal');
  showUserMenu.value = false;
}

/**
 * 跳转到上传页面
 */
function goToUpload() {
  router.push('/upload');
}

/**
 * 跳转到VIP中心
 */
function goToVIP() {
  router.push('/vip');
  showUserMenu.value = false;
}

/**
 * 跳转到管理后台
 */
function goToAdmin() {
  router.push('/admin/dashboard');
  showUserMenu.value = false;
}

/**
 * 退出登录
 */
function handleLogout() {
  userStore.logout();
  showUserMenu.value = false;
  router.push('/');
}

/**
 * 跳转到分类页面
 */
function goToCategory(categoryId: string) {
  router.push(`/resource?categoryId=${categoryId}`);
}

/**
 * 切换侧边栏折叠状态
 */
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

/**
 * 处理搜索
 */
function handleSearch(keyword: string) {
  router.push(`/search?keyword=${encodeURIComponent(keyword)}`);
}

// 生命周期钩子
onMounted(() => {
  // 监听滚动事件
  window.addEventListener('scroll', handleScroll);

  // 初始化配置
  if (!configStore.siteConfig) {
    configStore.initConfig();
  }
});

onBeforeUnmount(() => {
  // 移除滚动事件监听
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="desktop-layout">
    <!-- 顶部导航栏 -->
    <header
      class="header"
      :class="{ 'header-fixed': isHeaderFixed }"
    >
      <div class="header-container">
        <!-- Logo区域 -->
        <div
          class="logo-section"
          @click="goToHome"
        >
          <div class="logo-icon">
            <svg
              viewBox="0 0 100 100"
              class="w-10 h-10"
            >
              <defs>
                <linearGradient
                  id="logoGradient"
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
                fill="url(#logoGradient)"
              />
            </svg>
          </div>
          <div class="logo-text">
            <h1 class="brand-name">
              星潮设计
            </h1>
            <p class="brand-subtitle">
              StarTide Design
            </p>
          </div>
        </div>

        <!-- 搜索框 -->
        <div class="search-section">
          <SearchBar
            placeholder="搜索设计资源..."
            :show-button="true"
            @search="handleSearch"
          />
        </div>

        <!-- 用户操作区域 -->
        <div class="user-section">
          <!-- 未登录状态 -->
          <template v-if="!isLoggedIn">
            <div class="auth-buttons">
              <el-button
                class="login-btn"
                @click="goToLogin"
              >
                登录
              </el-button>
              <el-button
                type="primary"
                class="register-btn"
                @click="goToRegister"
              >
                注册
              </el-button>
            </div>
          </template>

          <!-- 已登录状态 -->
          <template v-else>
            <!-- 上传按钮 -->
            <el-button
              type="warning"
              :icon="Upload"
              class="upload-btn"
              @click="goToUpload"
            >
              上传作品
            </el-button>
            <el-dropdown
              trigger="click"
              @visible-change="(visible: boolean) => (showUserMenu = visible)"
            >
              <div class="user-info">
                <el-avatar
                  :src="userInfo?.avatar"
                  :size="40"
                  class="user-avatar"
                >
                  <el-icon><User /></el-icon>
                </el-avatar>
                <div class="user-details">
                  <span class="user-name">{{ displayName }}</span>
                  <span
                    v-if="isVIP"
                    class="vip-badge"
                  >{{ vipLevelName }}</span>
                </div>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="goToPersonal">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item @click="goToVIP">
                    <el-icon><Download /></el-icon>
                    VIP中心
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="isAdmin"
                    @click="goToAdmin"
                  >
                    <el-icon><Setting /></el-icon>
                    管理后台
                  </el-dropdown-item>
                  <el-dropdown-item
                    divided
                    @click="handleLogout"
                  >
                    <el-icon><Setting /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>
      </div>
    </header>

    <!-- 占位符（当导航栏固定时） -->
    <div
      v-if="isHeaderFixed"
      class="header-placeholder"
    />

    <!-- 主体内容 -->
    <div class="main-wrapper">
      <!-- 侧边栏 -->
      <aside
        class="sidebar"
        :class="{ 'sidebar-collapsed': sidebarCollapsed }"
      >
        <!-- 折叠按钮 -->
        <div
          class="sidebar-toggle"
          @click="toggleSidebar"
        >
          <el-icon>
            <component :is="sidebarCollapsed ? 'ArrowRight' : 'ArrowLeft'" />
          </el-icon>
        </div>

        <!-- 分类导航 -->
        <div
          v-if="!sidebarCollapsed"
          class="sidebar-content"
        >
          <div class="sidebar-section">
            <h3 class="sidebar-title">
              热门分类
            </h3>
            <ul class="category-list">
              <li
                v-for="category in hotCategories"
                :key="category.categoryId"
                class="category-item"
                @click="goToCategory(category.categoryId)"
              >
                <span class="category-icon">{{ category.icon || '📁' }}</span>
                <span class="category-name">{{ category.categoryName }}</span>
                <span class="category-count">{{ category.resourceCount || 0 }}</span>
              </li>
            </ul>
          </div>

          <div class="sidebar-section">
            <h3 class="sidebar-title">
              全部分类
            </h3>
            <ul class="category-list">
              <li
                v-for="category in primaryCategories"
                :key="category.categoryId"
                class="category-item"
                @click="goToCategory(category.categoryId)"
              >
                <span class="category-icon">{{ category.icon || '📁' }}</span>
                <span class="category-name">{{ category.categoryName }}</span>
                <span class="category-count">{{ category.resourceCount || 0 }}</span>
              </li>
            </ul>
          </div>

          <!-- 快捷入口 -->
          <div class="sidebar-section">
            <h3 class="sidebar-title">
              快捷入口
            </h3>
            <ul class="quick-links">
              <li
                class="quick-link-item"
                @click="goToUpload"
              >
                <el-icon><Upload /></el-icon>
                <span>上传作品</span>
              </li>
              <li
                class="quick-link-item"
                @click="goToPersonal"
              >
                <el-icon><User /></el-icon>
                <span>个人中心</span>
              </li>
              <li
                class="quick-link-item"
                @click="goToVIP"
              >
                <el-icon><Download /></el-icon>
                <span>VIP中心</span>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <!-- 主内容区域 -->
      <main class="main-content">
        <router-view />
      </main>
    </div>

    <!-- 底部信息栏 -->
    <footer class="footer">
      <div class="footer-container">
        <!-- 友情链接 -->
        <div class="footer-section">
          <h4 class="footer-title">
            友情链接
          </h4>
          <ul class="footer-links">
            <li>
              <a
                href="https://www.zcool.com.cn/"
                target="_blank"
                rel="noopener"
              >站酷</a>
            </li>
            <li>
              <a
                href="https://www.ui.cn/"
                target="_blank"
                rel="noopener"
              >UI中国</a>
            </li>
            <li>
              <a
                href="https://www.iconfont.cn/"
                target="_blank"
                rel="noopener"
              >iconfont</a>
            </li>
            <li>
              <a
                href="https://www.uisdc.com/"
                target="_blank"
                rel="noopener"
              >优设网</a>
            </li>
          </ul>
        </div>

        <!-- 关于我们 -->
        <div class="footer-section">
          <h4 class="footer-title">
            关于我们
          </h4>
          <ul class="footer-links">
            <li>
              <router-link to="/about">关于星潮</router-link>
            </li>
            <li>
              <router-link to="/contact">联系我们</router-link>
            </li>
            <li>
              <a
                href="#"
                @click.prevent
              >加入我们</a>
            </li>
            <li>
              <router-link to="/agreement">用户协议</router-link>
            </li>
          </ul>
        </div>

        <!-- 帮助中心 -->
        <div class="footer-section">
          <h4 class="footer-title">
            帮助中心
          </h4>
          <ul class="footer-links">
            <li>
              <router-link to="/help">新手指南</router-link>
            </li>
            <li>
              <router-link to="/help">上传规范</router-link>
            </li>
            <li>
              <router-link to="/vip">VIP说明</router-link>
            </li>
            <li>
              <router-link to="/help">常见问题</router-link>
            </li>
          </ul>
        </div>

        <!-- 联系方式 -->
        <div class="footer-section">
          <h4 class="footer-title">
            联系方式
          </h4>
          <ul class="footer-contact">
            <li>客服邮箱：support@startide.com</li>
            <li>商务合作：business@startide.com</li>
            <li>工作时间：9:00-18:00</li>
          </ul>
        </div>
      </div>

      <!-- 版权信息 -->
      <div class="footer-bottom">
        <div class="footer-container">
          <p class="copyright">
            {{ siteConfig?.copyright || '© 2024 星潮设计 StarTide Design. All rights reserved.' }}
            <span class="separator">|</span>
            <router-link to="/agreement" class="footer-link">用户协议</router-link>
            <span class="separator">|</span>
            <router-link to="/privacy" class="footer-link">隐私政策</router-link>
          </p>
          <p class="icp">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener"
            >
              {{ siteConfig?.icp || '京ICP备xxxxxxxx号' }}
            </a>
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ========== 布局容器 ========== */
.desktop-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

/* ========== 顶部导航栏 ========== */
.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  z-index: 1000;
}

.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

.header-placeholder {
  height: 80px;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 80px;
  display: flex;
  align-items: center;
  gap: 32px;
}

/* Logo区域 */
.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.logo-section:hover {
  transform: scale(1.05);
}

.logo-icon {
  width: 40px;
  height: 40px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 20px;
  font-weight: bold;
  background: linear-gradient(135deg, #165dff 0%, #ff7d00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 11px;
  color: #909399;
  margin: 0;
  line-height: 1.2;
}

/* 搜索区域 */
.search-section {
  flex: 1;
  max-width: 600px;
}

/* 用户操作区域 */
.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* 登录注册按钮组 */
.auth-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.login-btn {
  min-width: 80px;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background-color: #f5f7fa;
  border-color: #165dff;
  color: #165dff;
}

.register-btn {
  min-width: 80px;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.3);
  transition: all 0.3s ease;
}

.register-btn:hover {
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.4);
  transform: translateY(-1px);
}

.upload-btn {
  background: linear-gradient(135deg, #ff7d00 0%, #ffa940 100%);
  border: none;
  color: #fff;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(255, 125, 0, 0.3);
  transition: all 0.3s ease;
}

.upload-btn:hover {
  box-shadow: 0 4px 12px rgba(255, 125, 0, 0.4);
  transform: translateY(-1px);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 24px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.vip-badge {
  font-size: 11px;
  color: #fff;
  background: linear-gradient(135deg, #ff7d00 0%, #ffa940 100%);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

/* ========== 主体内容 ========== */
.main-wrapper {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  gap: 24px;
}

/* ========== 侧边栏 ========== */
.sidebar {
  width: 240px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  height: calc(100vh - 128px); /* 固定高度: 视口高度 - header高度 - 上下间距 */
  max-height: calc(100vh - 128px);
  overflow-y: auto; /* 启用垂直滚动 */
  overflow-x: hidden; /* 隐藏水平滚动 */
  position: sticky;
  top: 104px;
  transition: all 0.3s ease;
  flex-shrink: 0;
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #dcdfe6 transparent;
  /* 平滑滚动 */
  scroll-behavior: smooth;
}

/* Webkit浏览器滚动条样式 */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
  transition: background-color 0.3s ease;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}

.sidebar-collapsed {
  width: 60px;
  padding: 20px 10px;
  overflow-y: auto; /* 保持滚动功能 */
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f7fa;
  cursor: pointer;
  margin: 0 auto 16px;
  transition: all 0.3s ease;
}

.sidebar-toggle:hover {
  background: #e4e7ed;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

/* 分类列表 */
.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-item:hover {
  background: #f5f7fa;
  transform: translateX(4px);
}

.category-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.category-name {
  flex: 1;
  font-size: 14px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-count {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

/* 快捷链接 */
.quick-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-link-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #606266;
}

.quick-link-item:hover {
  background: linear-gradient(135deg, #165dff 0%, #ff7d00 100%);
  color: #fff;
}

.quick-link-item .el-icon {
  font-size: 16px;
}

/* ========== 主内容区域 ========== */
.main-content {
  flex: 1;
  min-width: 0;
  /* 主内容区域使用默认的文档流滚动 */
  /* 不设置固定高度和overflow，让内容自然滚动 */
}

/* ========== 底部信息栏 ========== */
.footer {
  background: #fff;
  border-top: 1px solid #e4e7ed;
  margin-top: 48px;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 24px 24px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.footer-links,
.footer-contact {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-links a {
  font-size: 14px;
  color: #606266;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: #165dff;
}

.footer-contact li {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

/* 版权信息 */
.footer-bottom {
  border-top: 1px solid #e4e7ed;
  padding: 24px 0;
}

.footer-bottom .footer-container {
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  grid-template-columns: none;
}

.copyright,
.icp {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.copyright .separator {
  margin: 0 8px;
  color: #dcdfe6;
}

.copyright .footer-link {
  color: #909399;
  text-decoration: none;
  transition: color 0.3s ease;
}

.copyright .footer-link:hover {
  color: #165dff;
}

.icp a {
  color: #909399;
  text-decoration: none;
  transition: color 0.3s ease;
}

.icp a:hover {
  color: #165dff;
}

/* ========== 响应式适配 ========== */
@media (max-width: 1200px) {
  .header-container {
    max-width: 100%;
    gap: 24px;
  }

  .main-wrapper {
    max-width: 100%;
  }

  .sidebar {
    width: 200px;
  }

  .footer-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .search-section {
    max-width: 400px;
  }

  .sidebar {
    display: none;
  }

  .footer-container {
    grid-template-columns: 1fr;
  }
}

/* ========== 暗色模式适配 ========== */
@media (prefers-color-scheme: dark) {
  .desktop-layout {
    background: #1d1e1f;
  }

  .header {
    background: #2b2b2b;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .sidebar {
    background: #2b2b2b;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    scrollbar-color: #4a4a4a transparent; /* 暗色模式滚动条 */
  }

  /* 暗色模式Webkit滚动条 */
  .sidebar::-webkit-scrollbar-thumb {
    background-color: #4a4a4a;
  }

  .sidebar::-webkit-scrollbar-thumb:hover {
    background-color: #5a5a5a;
  }

  .sidebar-title {
    color: #e5eaf3;
    border-bottom-color: #3a3a3a;
  }

  .category-name,
  .quick-link-item {
    color: #a8abb2;
  }

  .category-item:hover {
    background: #3a3a3a;
  }

  .footer {
    background: #2b2b2b;
    border-top-color: #3a3a3a;
  }

  .footer-title {
    color: #e5eaf3;
  }

  .footer-links a,
  .footer-contact li {
    color: #a8abb2;
  }

  .footer-bottom {
    border-top-color: #3a3a3a;
  }
}
</style>
