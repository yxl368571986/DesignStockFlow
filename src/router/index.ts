/**
 * Vue Router配置
 *
 * 功能：
 * - 定义所有路由（首页、列表、详情、上传、个人中心、登录、注册）
 * - 配置路由懒加载
 * - 配置路由元信息（requiresAuth、title）
 * - 配置404页面
 * - 集成路由守卫
 *
 * 需求: 需求1（页面路由）
 */

import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { setupRouterGuards } from './guards';

/**
 * 路由配置
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home/index.vue'),
    meta: {
      title: '首页 - 星潮设计'
    }
  },
  {
    path: '/resource',
    name: 'ResourceList',
    component: () => import('@/views/Resource/List.vue'),
    meta: {
      title: '资源列表 - 星潮设计'
    }
  },
  {
    path: '/resource/:id',
    name: 'ResourceDetail',
    component: () => import('@/views/Resource/Detail.vue'),
    meta: {
      title: '资源详情 - 星潮设计'
    }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search/index.vue'),
    meta: {
      title: '搜索结果 - 星潮设计'
    }
  },
  {
    path: '/upload',
    name: 'Upload',
    component: () => import('@/views/Upload/index.vue'),
    meta: {
      title: '上传资源 - 星潮设计',
      requiresAuth: true
    }
  },
  {
    path: '/personal',
    name: 'Personal',
    component: () => import('@/views/Personal/index.vue'),
    meta: {
      title: '个人中心 - 星潮设计',
      requiresAuth: true
    }
  },
  {
    path: '/vip',
    name: 'VIP',
    component: () => import('@/views/VIP/index.vue'),
    meta: {
      title: 'VIP中心 - 星潮设计'
      // 不需要登录即可访问VIP页面，购买时再检查登录状态
    }
  },
  {
    path: '/vip/orders',
    name: 'VIPOrders',
    component: () => import('@/views/VIP/OrderList.vue'),
    meta: {
      title: '我的订单 - 星潮设计',
      requiresAuth: true
    }
  },
  {
    path: '/vip/orders/:orderNo',
    name: 'VIPOrderDetail',
    component: () => import('@/views/VIP/OrderDetail.vue'),
    meta: {
      title: '订单详情 - 星潮设计',
      requiresAuth: true
    }
  },
  {
    path: '/user/devices',
    name: 'UserDevices',
    component: () => import('@/views/User/Devices.vue'),
    meta: {
      title: '设备管理 - 星潮设计',
      requiresAuth: true
    }
  },
  {
    path: '/points',
    name: 'Points',
    component: () => import('@/views/Points/index.vue'),
    meta: {
      title: '我的积分 - 星潮设计',
      requiresAuth: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Auth/Login.vue'),
    meta: {
      title: '登录 - 星潮设计'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Auth/Register.vue'),
    meta: {
      title: '注册 - 星潮设计'
    }
  },
  // 关于页面路由
  {
    path: '/about',
    name: 'AboutUs',
    component: () => import('@/views/About/AboutUs.vue'),
    meta: {
      title: '关于我们 - 星潮设计'
    }
  },
  {
    path: '/contact',
    name: 'ContactUs',
    component: () => import('@/views/About/ContactUs.vue'),
    meta: {
      title: '联系我们 - 星潮设计'
    }
  },
  {
    path: '/agreement',
    name: 'UserAgreement',
    component: () => import('@/views/About/UserAgreement.vue'),
    meta: {
      title: '用户协议 - 星潮设计'
    }
  },
  {
    path: '/privacy',
    name: 'PrivacyPolicy',
    component: () => import('@/views/About/PrivacyPolicy.vue'),
    meta: {
      title: '隐私政策 - 星潮设计'
    }
  },
  {
    path: '/help',
    name: 'HelpCenter',
    component: () => import('@/views/About/HelpCenter.vue'),
    meta: {
      title: '帮助中心 - 星潮设计'
    }
  },
  // 管理后台路由
  {
    path: '/admin',
    component: () => import('@/views/Admin/Layout.vue'),
    meta: {
      title: '管理后台',
      requiresAuth: true,
      requiresAdmin: true
    },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/Admin/Dashboard/index.vue'),
        meta: {
          title: '数据概览 - 管理后台'
        }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/Admin/Users/index.vue'),
        meta: {
          title: '用户管理 - 管理后台'
        }
      },
      {
        path: 'resources',
        name: 'AdminResources',
        component: () => import('@/views/Admin/Resources/index.vue'),
        meta: {
          title: '资源管理 - 管理后台'
        }
      },
      {
        path: 'audit',
        name: 'AdminAudit',
        component: () => import('@/views/Admin/Audit/index.vue'),
        meta: {
          title: '内容审核 - 管理后台'
        }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('@/views/Admin/Categories/index.vue'),
        meta: {
          title: '分类管理 - 管理后台'
        }
      },
      {
        path: 'statistics',
        name: 'AdminStatistics',
        component: () => import('@/views/Admin/Statistics/index.vue'),
        meta: {
          title: '数据统计 - 管理后台'
        }
      },
      // 内容运营
      {
        path: 'operation/banners',
        name: 'AdminBanners',
        component: () => import('@/views/Admin/Operation/Banners/index.vue'),
        meta: {
          title: '轮播图管理 - 管理后台'
        }
      },
      {
        path: 'operation/announcements',
        name: 'AdminAnnouncements',
        component: () => import('@/views/Admin/Operation/Announcements/index.vue'),
        meta: {
          title: '公告管理 - 管理后台'
        }
      },
      {
        path: 'operation/recommends',
        name: 'AdminRecommends',
        component: () => import('@/views/Admin/Operation/Recommends/index.vue'),
        meta: {
          title: '推荐位管理 - 管理后台'
        }
      },
      // VIP管理
      {
        path: 'vip',
        name: 'AdminVIP',
        component: () => import('@/views/Admin/VIP/index.vue'),
        meta: {
          title: 'VIP管理 - 管理后台'
        }
      },
      {
        path: 'vip/packages',
        name: 'AdminVIPPackages',
        component: () => import('@/views/Admin/VIP/Packages/index.vue'),
        meta: {
          title: '套餐管理 - 管理后台'
        }
      },
      {
        path: 'vip/privileges',
        name: 'AdminVIPPrivileges',
        component: () => import('@/views/Admin/VIP/Privileges/index.vue'),
        meta: {
          title: '特权配置 - 管理后台'
        }
      },
      {
        path: 'vip/orders',
        name: 'AdminVIPOrders',
        component: () => import('@/views/Admin/VIP/Orders/index.vue'),
        meta: {
          title: '订单管理 - 管理后台'
        }
      },
      {
        path: 'vip/statistics',
        name: 'AdminVIPStatistics',
        component: () => import('@/views/Admin/VIP/Statistics/index.vue'),
        meta: {
          title: 'VIP统计 - 管理后台'
        }
      },
      // 退款管理
      {
        path: 'vip/refunds',
        name: 'AdminVIPRefunds',
        component: () => import('@/views/Admin/VIP/Refunds/index.vue'),
        meta: {
          title: '退款管理 - 管理后台'
        }
      },
      // 安全日志
      {
        path: 'security/logs',
        name: 'AdminSecurityLogs',
        component: () => import('@/views/Admin/Security/Logs/index.vue'),
        meta: {
          title: '安全日志 - 管理后台'
        }
      },
      // 积分管理
      {
        path: 'points',
        name: 'AdminPoints',
        component: () => import('@/views/Admin/Points/index.vue'),
        meta: {
          title: '积分管理 - 管理后台'
        }
      },
      // 权限管理
      {
        path: 'permissions',
        name: 'AdminPermissions',
        component: () => import('@/views/Admin/Permissions/index.vue'),
        meta: {
          title: '权限管理 - 管理后台'
        }
      },
      // 系统设置
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/Admin/Settings/index.vue'),
        meta: {
          title: '系统设置 - 管理后台'
        }
      }
    ]
  },
  // 测试页面（仅用于开发测试）
  {
    path: '/test/banner',
    name: 'BannerTest',
    component: () => import('@/views/Test/BannerTest.vue'),
    meta: {
      title: '轮播图跳转测试 - 星潮设计'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面未找到 - 星潮设计'
    }
  }
];

/**
 * 创建路由实例
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 滚动行为配置
  scrollBehavior(to, _from, savedPosition) {
    // 如果有保存的位置（浏览器前进/后退），恢复到该位置
    if (savedPosition) {
      return savedPosition;
    }
    // 如果有hash锚点，滚动到锚点
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      };
    }
    // 否则滚动到顶部
    return { top: 0 };
  }
});

/**
 * 注册路由守卫
 */
setupRouterGuards(router);

export default router;
