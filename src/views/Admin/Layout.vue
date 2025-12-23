<!--
  管理后台布局组件
  
  功能：
  - 侧边菜单导航
  - 顶部导航栏
  - 面包屑导航
  - 主内容区域
  
  需求: 需求21 B部分
-->

<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside 
      class="admin-sidebar" 
      :class="{ 'collapsed': isCollapsed }"
    >
      <!-- Logo区域 -->
      <div class="sidebar-logo">
        <img v-if="!isCollapsed" src="https://via.placeholder.com/120x32?text=StarTide" alt="星潮设计" class="logo-img" />
        <img v-else src="https://via.placeholder.com/32x32?text=ST" alt="星潮设计" class="logo-mini" />
        <span v-if="!isCollapsed" class="logo-text">星潮设计</span>
      </div>

      <!-- 菜单导航 -->
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        :unique-opened="true"
        class="sidebar-menu"
        router
      >
        <!-- 数据概览 -->
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据概览</template>
        </el-menu-item>

        <!-- 用户管理 -->
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>

        <!-- 资源管理 -->
        <el-menu-item index="/admin/resources">
          <el-icon><Document /></el-icon>
          <template #title>资源管理</template>
        </el-menu-item>

        <!-- 内容审核 -->
        <el-menu-item index="/admin/audit">
          <el-icon><Select /></el-icon>
          <template #title>内容审核</template>
        </el-menu-item>

        <!-- 分类管理 -->
        <el-menu-item index="/admin/categories">
          <el-icon><Menu /></el-icon>
          <template #title>分类管理</template>
        </el-menu-item>

        <!-- VIP管理 -->
        <el-sub-menu index="vip">
          <template #title>
            <el-icon><Star /></el-icon>
            <span>VIP管理</span>
          </template>
          <el-menu-item index="/admin/vip/packages">套餐管理</el-menu-item>
          <el-menu-item index="/admin/vip/privileges">特权配置</el-menu-item>
          <el-menu-item index="/admin/vip/orders">订单管理</el-menu-item>
          <el-menu-item index="/admin/vip/statistics">VIP统计</el-menu-item>
        </el-sub-menu>

        <!-- 积分管理 -->
        <el-sub-menu index="points">
          <template #title>
            <el-icon><Coin /></el-icon>
            <span>积分管理</span>
          </template>
          <el-menu-item index="/admin/points/rules">积分规则</el-menu-item>
          <el-menu-item index="/admin/points/products">商城商品</el-menu-item>
          <el-menu-item index="/admin/points/exchanges">兑换记录</el-menu-item>
          <el-menu-item index="/admin/points/statistics">积分统计</el-menu-item>
        </el-sub-menu>

        <!-- 数据统计 -->
        <el-menu-item index="/admin/statistics">
          <el-icon><TrendCharts /></el-icon>
          <template #title>数据统计</template>
        </el-menu-item>

        <!-- 内容运营 -->
        <el-sub-menu index="operation">
          <template #title>
            <el-icon><Operation /></el-icon>
            <span>内容运营</span>
          </template>
          <el-menu-item index="/admin/operation/banners">轮播图管理</el-menu-item>
          <el-menu-item index="/admin/operation/announcements">公告管理</el-menu-item>
          <el-menu-item index="/admin/operation/recommends">推荐位管理</el-menu-item>
        </el-sub-menu>

        <!-- 系统设置 -->
        <el-menu-item index="/admin/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>

        <!-- 权限管理 -->
        <el-menu-item index="/admin/permissions">
          <el-icon><Lock /></el-icon>
          <template #title>权限管理</template>
        </el-menu-item>
      </el-menu>
    </aside>

    <!-- 主内容区域 -->
    <div class="admin-main">
      <!-- 顶部导航栏 -->
      <header class="admin-header">
        <!-- 左侧：折叠按钮 + 面包屑 -->
        <div class="header-left">
          <el-button 
            :icon="isCollapsed ? Expand : Fold" 
            circle 
            @click="toggleSidebar"
            class="collapse-btn"
          />
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item 
              v-for="item in breadcrumbs" 
              :key="item.path"
              :to="item.path ? { path: item.path } : undefined"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <!-- 右侧：搜索 + 通知 + 用户信息 -->
        <div class="header-right">
          <!-- 搜索框 -->
          <el-input
            v-model="searchKeyword"
            placeholder="搜索..."
            :prefix-icon="Search"
            class="search-input"
            clearable
          />

          <!-- 通知 -->
          <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="notification-badge">
            <el-button :icon="Bell" circle />
          </el-badge>

          <!-- 主题切换 -->
          <el-button :icon="isDark ? Sunny : Moon" circle @click="toggleTheme" />

          <!-- 用户信息 -->
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :src="userInfo.avatar" :size="32">
                {{ userInfo.nickname?.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ userInfo.nickname }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="settings">账号设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="admin-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/pinia/userStore';
import { ElMessage } from 'element-plus';
import {
  DataAnalysis,
  User,
  Document,
  Select,
  Menu,
  Star,
  Coin,
  TrendCharts,
  Operation,
  Setting,
  Lock,
  Expand,
  Fold,
  Search,
  Bell,
  Sunny,
  Moon
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 侧边栏折叠状态
const isCollapsed = ref(false);

// 主题模式
const isDark = ref(false);

// 搜索关键词
const searchKeyword = ref('');

// 通知数量
const notificationCount = ref(0);

// 用户信息
const userInfo = computed(() => userStore.userInfo || {
  nickname: '管理员',
  avatar: ''
});

// 当前激活的菜单
const activeMenu = computed(() => route.path);

// 面包屑导航
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title);
  return matched.map(item => ({
    title: item.meta.title as string,
    path: item.path
  }));
});

// 切换侧边栏
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
  // 保存到本地存储
  localStorage.setItem('admin-sidebar-collapsed', String(isCollapsed.value));
};

// 切换主题
const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  localStorage.setItem('admin-theme', isDark.value ? 'dark' : 'light');
};

// 处理用户下拉菜单命令
const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/admin/profile');
      break;
    case 'settings':
      router.push('/admin/account-settings');
      break;
    case 'logout':
      handleLogout();
      break;
  }
};

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.logout();
    ElMessage.success('退出登录成功');
    router.push('/login');
  } catch (error) {
    ElMessage.error('退出登录失败');
  }
};

// 初始化：从本地存储恢复状态
const initializeState = () => {
  const savedCollapsed = localStorage.getItem('admin-sidebar-collapsed');
  if (savedCollapsed !== null) {
    isCollapsed.value = savedCollapsed === 'true';
  }

  const savedTheme = localStorage.getItem('admin-theme');
  if (savedTheme === 'dark') {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  }
};

initializeState();
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  height: 100vh;
  background: var(--admin-bg);
}

// 侧边栏样式
.admin-sidebar {
  width: 240px;
  background: var(--admin-bg-light);
  box-shadow: var(--admin-shadow-sm);
  transition: width var(--admin-transition-normal), box-shadow var(--admin-transition-normal);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;

  // 渐变装饰
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--admin-primary), var(--admin-secondary));
  }

  &.collapsed {
    width: 64px;
  }

  &:hover {
    box-shadow: var(--admin-shadow-md);
  }

  .sidebar-logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    border-bottom: 1px solid var(--admin-border-light);
    background: linear-gradient(135deg, rgba(22, 93, 255, 0.05), rgba(255, 125, 0, 0.05));

    .logo-img {
      height: 32px;
      margin-right: 12px;
      transition: transform var(--admin-transition-normal);
    }

    .logo-mini {
      height: 32px;
      transition: transform var(--admin-transition-normal);
    }

    .logo-img:hover,
    .logo-mini:hover {
      transform: scale(1.1) rotate(5deg);
    }

    .logo-text {
      font-size: 18px;
      font-weight: 600;
      background: linear-gradient(135deg, var(--admin-primary), var(--admin-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .sidebar-menu {
    flex: 1;
    border-right: none;
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--admin-border);
      border-radius: 3px;
      transition: background var(--admin-transition-fast);
    }

    &::-webkit-scrollbar-thumb:hover {
      background: var(--admin-primary-light);
    }

    // 菜单项动画
    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      transition: all var(--admin-transition-fast);
      
      &:hover {
        background: linear-gradient(90deg, rgba(22, 93, 255, 0.08), transparent) !important;
        transform: translateX(4px);
      }

      &.is-active {
        background: linear-gradient(90deg, rgba(22, 93, 255, 0.12), transparent) !important;
        color: var(--admin-primary) !important;
        font-weight: 600;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(180deg, var(--admin-primary), var(--admin-primary-light));
          border-radius: 0 2px 2px 0;
        }
      }
    }
  }
}

// 主内容区域
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 顶部导航栏
.admin-header {
  height: 60px;
  background: var(--admin-bg-light);
  box-shadow: var(--admin-shadow-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 10;
  position: relative;

  // 毛玻璃效果
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .collapse-btn {
      border: none;
      background: transparent;
      transition: all var(--admin-transition-fast);

      &:hover {
        background: var(--admin-bg);
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .breadcrumb {
      font-size: 14px;
      
      :deep(.el-breadcrumb__item) {
        .el-breadcrumb__inner {
          transition: color var(--admin-transition-fast);
          
          &:hover {
            color: var(--admin-primary);
          }
        }
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .search-input {
      width: 200px;
      transition: width var(--admin-transition-normal);

      &:focus-within {
        width: 280px;
      }

      :deep(.el-input__wrapper) {
        transition: all var(--admin-transition-fast);
        
        &:hover {
          box-shadow: 0 0 0 1px var(--admin-primary-light);
        }
      }
    }

    .notification-badge {
      :deep(.el-badge__content) {
        background: linear-gradient(135deg, var(--admin-secondary), var(--admin-secondary-light));
        animation: pulse 2s infinite;
      }

      :deep(.el-button) {
        transition: all var(--admin-transition-fast);

        &:hover {
          transform: scale(1.1);
          background: var(--admin-bg);
        }
      }
    }

    :deep(.el-button) {
      transition: all var(--admin-transition-fast);

      &:hover {
        transform: scale(1.1);
        background: var(--admin-bg);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 12px;
      border-radius: var(--admin-radius-sm);
      transition: all var(--admin-transition-fast);

      &:hover {
        background: var(--admin-bg);
        box-shadow: var(--admin-shadow-sm);
        transform: translateY(-1px);
      }

      :deep(.el-avatar) {
        transition: transform var(--admin-transition-fast);
      }

      &:hover :deep(.el-avatar) {
        transform: scale(1.1);
      }

      .user-name {
        font-size: 14px;
        color: var(--admin-text);
        font-weight: 500;
      }
    }
  }
}

// 内容区域
.admin-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--admin-bg);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--admin-border);
    border-radius: 4px;
    transition: background var(--admin-transition-fast);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--admin-primary-light);
  }
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--admin-transition-normal), transform var(--admin-transition-normal);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// 暗黑模式特殊样式
:global(.dark) {
  .sidebar-logo {
    background: linear-gradient(135deg, rgba(22, 93, 255, 0.1), rgba(255, 125, 0, 0.1));
  }
}

// 响应式
@media (max-width: 768px) {
  .admin-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
    
    &.show {
      transform: translateX(0);
    }
  }

  .admin-header {
    .header-right {
      .search-input {
        width: 150px;
        
        &:focus-within {
          width: 200px;
        }
      }
    }
  }
}
</style>
