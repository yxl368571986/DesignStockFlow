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

import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { useUserStore } from '@/pinia/userStore';
import { ElMessage } from 'element-plus';

/**
 * 认证守卫
 * 检查用户是否已登录，未登录则跳转到登录页
 */
function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const userStore = useUserStore();

  // 检查路由是否需要认证
  if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn) {
      // 未登录，跳转到登录页，并记录目标路由
      ElMessage.warning('请先登录');
      next({
        path: '/login',
        query: {
          redirect: to.fullPath // 登录成功后跳转回原页面
        }
      });
      return;
    }
  }

  next();
}

/**
 * 管理员权限守卫
 * 检查用户是否有管理员权限
 */
function adminGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const userStore = useUserStore();

  // 检查路由是否需要管理员权限
  if (to.meta.requiresAdmin) {
    // 检查是否登录
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录');
      next({
        path: '/login',
        query: {
          redirect: to.fullPath
        }
      });
      return;
    }

    // 检查用户角色
    const roleCode = userStore.userInfo?.roleCode;
    const isAdmin = roleCode === 'super_admin' || 
                    roleCode === 'moderator' || 
                    roleCode === 'operator';
    
    if (!isAdmin) {
      ElMessage.error('您没有权限访问管理后台');
      next('/');
      return;
    }
  }

  next();
}

/**
 * VIP权限守卫
 * 检查用户VIP等级是否满足要求
 */
function vipGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const userStore = useUserStore();

  // 检查路由是否需要VIP权限
  if (to.meta.requiresVIP) {
    const requiredVIPLevel = (to.meta.vipLevel as number) || 1;

    if (!userStore.isVIP || (userStore.userInfo?.vipLevel || 0) < requiredVIPLevel) {
      // VIP等级不足
      ElMessage.warning(`此功能需要VIP${requiredVIPLevel}及以上等级`);
      next(false); // 阻止导航
      return;
    }
  }

  next();
}

/**
 * 页面标题守卫
 * 更新浏览器标题
 */
function titleGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  // 更新页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string;
  } else {
    document.title = '星潮设计 - 专业的设计资源分享平台';
  }

  next();
}

/**
 * 页面访问日志守卫
 * 记录用户访问的页面路径和时间
 */
function logGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  // 开发环境下记录路由跳转日志
  if (import.meta.env.DEV) {
    console.log('[Router]', {
      from: from.fullPath,
      to: to.fullPath,
      timestamp: new Date().toISOString()
    });
  }

  // 生产环境可以发送到日志服务器
  if (import.meta.env.PROD) {
    // TODO: 发送访问日志到服务器
    // sendPageViewLog({
    //   path: to.fullPath,
    //   referrer: from.fullPath,
    //   timestamp: Date.now()
    // });
  }

  next();
}

/**
 * 登录重定向守卫
 * 如果用户已登录，访问登录/注册页面时自动跳转到首页或目标页面
 */
function loginRedirectGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const userStore = useUserStore();

  // 如果已登录且访问登录/注册页面
  if (userStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    // 如果有重定向目标，跳转到目标页面
    const redirect = to.query.redirect as string;
    if (redirect) {
      next(redirect);
    } else {
      // 否则跳转到首页
      next('/');
    }
    return;
  }

  next();
}

/**
 * 滚动行为守卫
 * 页面切换后滚动到顶部
 */
function scrollGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  // 如果路由有hash，不滚动（让浏览器自动滚动到锚点）
  if (!to.hash) {
    // 延迟滚动，确保DOM已更新
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  }

  next();
}

/**
 * 注册所有路由守卫
 * @param router Vue Router实例
 */
export function setupRouterGuards(router: Router): void {
  // 全局前置守卫（按顺序执行）
  router.beforeEach((to, from, next) => {
    // 1. 页面标题更新
    titleGuard(to, from, () => {
      // 2. 登录重定向检查
      loginRedirectGuard(to, from, () => {
        // 3. 认证检查
        authGuard(to, from, () => {
          // 4. 管理员权限检查
          adminGuard(to, from, () => {
            // 5. VIP权限检查
            vipGuard(to, from, () => {
              // 6. 访问日志记录
              logGuard(to, from, () => {
                // 7. 滚动行为
                scrollGuard(to, from, next);
              });
            });
          });
        });
      });
    });
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
