/**
 * VIP模块路由配置
 * 
 * 使用懒加载优化前端组件加载性能
 */

import type { RouteRecordRaw } from 'vue-router';

// 懒加载VIP相关页面组件
const VipCenter = () => import('@/views/VIP/index.vue');
const OrderList = () => import('@/views/VIP/OrderList.vue');
const OrderDetail = () => import('@/views/VIP/OrderDetail.vue');
const PaymentSuccess = () => import('@/views/VIP/PaymentSuccess.vue');

// 懒加载管理后台VIP相关页面
const AdminRefunds = () => import('@/views/Admin/VIP/Refunds/index.vue');
const AdminSecurityLogs = () => import('@/views/Admin/Security/Logs/index.vue');
const AdminVipStatistics = () => import('@/views/Admin/VIP/Statistics/index.vue');

// 懒加载用户设备管理页面
const UserDevices = () => import('@/views/User/Devices.vue');

/**
 * VIP用户端路由
 */
export const vipUserRoutes: RouteRecordRaw[] = [
  {
    path: '/vip',
    name: 'VipCenter',
    component: VipCenter,
    meta: {
      title: 'VIP会员中心',
      requiresAuth: true,
    },
  },
  {
    path: '/vip/orders',
    name: 'VipOrderList',
    component: OrderList,
    meta: {
      title: '我的订单',
      requiresAuth: true,
    },
  },
  {
    path: '/vip/orders/:orderNo',
    name: 'VipOrderDetail',
    component: OrderDetail,
    meta: {
      title: '订单详情',
      requiresAuth: true,
    },
  },
  {
    path: '/vip/payment/success',
    name: 'PaymentSuccess',
    component: PaymentSuccess,
    meta: {
      title: '支付成功',
      requiresAuth: true,
    },
  },
  {
    path: '/user/devices',
    name: 'UserDevices',
    component: UserDevices,
    meta: {
      title: '设备管理',
      requiresAuth: true,
    },
  },
];

/**
 * VIP管理后台路由
 */
export const vipAdminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/vip/refunds',
    name: 'AdminVipRefunds',
    component: AdminRefunds,
    meta: {
      title: '退款管理',
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/security/logs',
    name: 'AdminSecurityLogs',
    component: AdminSecurityLogs,
    meta: {
      title: '安全日志',
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: '/admin/vip/statistics',
    name: 'AdminVipStatistics',
    component: AdminVipStatistics,
    meta: {
      title: 'VIP统计',
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
];

/**
 * 预加载VIP相关组件
 * 在用户登录后或访问相关页面前调用
 */
export function preloadVipComponents(): void {
  // 预加载核心VIP页面
  VipCenter();
  OrderList();
}

/**
 * 预加载管理后台VIP组件
 * 在管理员登录后调用
 */
export function preloadAdminVipComponents(): void {
  AdminRefunds();
  AdminSecurityLogs();
  AdminVipStatistics();
}

export default {
  vipUserRoutes,
  vipAdminRoutes,
  preloadVipComponents,
  preloadAdminVipComponents,
};
