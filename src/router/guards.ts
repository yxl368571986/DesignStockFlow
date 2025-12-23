/**
 * 路由守卫模块
 *
 * 功能：
 * - 认证守卫（检查Token，未登录跳转登录页）
 * - VIP权限守卫（检查VIP等级）
 * - 页面标题更新
 * - 页面访问日志
 *
 * 需求: 需求2.4、需求4.2（权限控制）
 */

import type { Router, RouteLocationNormalized } from 'vue-router';
import { useUserStore } from '@/pinia/userStore';
import { ElMessage } from 'element-plus';

/**
 * 检查用户是否已登录
 */
function checkAuth(): boolean {
  const userStore = useUserStore();
  return userStore.isLoggedIn;
}

/**
 * 检查用户是否有管理员权限
 */
function checkAdmin(): boolean {
  const userStore = useUserStore();
  if (!userStore.isLoggedIn || !userStore.userInfo) {
    return false;
  }
  
  const roleCode = userStore.userInfo.roleCode;
  return roleCode === 'super_admin' || 
         roleCode === 'moderator' || 
         roleCode === 'operator';
}

/**
 * 检查用户VIP等级
 */
function checkVIP(requiredLevel: number): boolean {
  const userStore = useUserStore();
  if (!userStore.isLoggedIn || !userStore.userInfo) {
    return false;
  }
  
  return userStore.isVIP && (userStore.userInfo.vipLevel || 0) >= requiredLevel;
}

/**
 * 更新页面标题
 */
function updateTitle(to: RouteLocationNormalized): void {
  if (to.meta.title) {
    document.title = to.meta.title as string;
  } else {
    document.title = '星潮设计 - 专业的设计资源分享平台';
  }
}

/**
 * 记录访问日志
 */
function logNavigation(from: RouteLocationNormalized, to: RouteLocationNormalized): void {
  if (import.meta.env.DEV) {
    console.log('[Router]', {
      from: from.fullPath,
      to: to.fullPath,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 注册所有路由守卫
 * @param router Vue Router实例
 */
export function setupRouterGuards(router: Router): void {
  // 全局前置守卫
  router.beforeEach((to, from, next) => {
    // 1. 更新页面标题
    updateTitle(to);
    
    // 2. 记录访问日志
    logNavigation(from, to);
    
    // 3. 如果已登录且访问登录/注册页面，重定向到首页
    if (checkAuth() && (to.path === '/login' || to.path === '/register')) {
      const redirect = to.query.redirect as string;
      if (redirect) {
        next(redirect);
      } else {
        next('/');
      }
      return;
    }
    
    // 4. 检查是否需要管理员权限（优先检查，因为admin路由也需要认证）
    if (to.meta.requiresAdmin || to.path.startsWith('/admin')) {
      // 先检查是否登录
      if (!checkAuth()) {
        ElMessage.warning('请先登录');
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        });
        return;
      }
      
      // 再检查是否有管理员权限
      if (!checkAdmin()) {
        ElMessage.error('您没有权限访问管理后台');
        next('/');
        return;
      }
    }
    
    // 5. 检查是否需要认证
    if (to.meta.requiresAuth) {
      if (!checkAuth()) {
        ElMessage.warning('请先登录');
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        });
        return;
      }
    }
    
    // 6. 检查是否需要VIP权限
    if (to.meta.requiresVIP) {
      const requiredVIPLevel = (to.meta.vipLevel as number) || 1;
      if (!checkVIP(requiredVIPLevel)) {
        ElMessage.warning(`此功能需要VIP${requiredVIPLevel}及以上等级`);
        next(false);
        return;
      }
    }
    
    // 7. 通过所有检查，允许导航
    next();
  });

  // 全局后置守卫
  router.afterEach((to, from) => {
    // 页面切换完成后的处理
    if (import.meta.env.DEV) {
      console.log('[Router] Navigation completed:', {
        from: from.fullPath,
        to: to.fullPath
      });
    }
    
    // 滚动到顶部（如果没有hash）
    if (!to.hash) {
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 100);
    }
  });

  // 全局错误处理
  router.onError((error) => {
    console.error('[Router] Navigation error:', error);
    ElMessage.error('页面加载失败，请刷新重试');
  });
}

/**
 * 扩展路由元信息类型
 */
declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题 */
    title?: string;
    /** 是否需要登录 */
    requiresAuth?: boolean;
    /** 是否需要管理员权限 */
    requiresAdmin?: boolean;
    /** 是否需要VIP */
    requiresVIP?: boolean;
    /** 需要的VIP等级 */
    vipLevel?: number;
  }
}
