/**
 * VIP路由
 * 处理VIP相关的路由
 */

import { Router } from 'express';
import {
  getVipPackages,
  getVipPrivileges,
  getUserVipInfo,
  getAllVipPackages,
  createVipPackage,
  updateVipPackage,
  deleteVipPackage,
  getAllVipPrivileges,
  updateVipPrivilege,
  adjustUserVip,
} from '@/controllers/vipController.js';
import { authenticate as authenticateToken } from '@/middlewares/auth.js';

const router = Router();

/**
 * 前台VIP接口
 */

// GET /api/v1/vip/packages - 获取VIP套餐列表
router.get('/packages', getVipPackages);

// GET /api/v1/vip/privileges - 获取VIP特权列表
router.get('/privileges', getVipPrivileges);

// GET /api/v1/vip/my-info - 获取用户VIP信息（需要登录）
router.get('/my-info', authenticateToken, getUserVipInfo);

/**
 * 管理员VIP接口
 */

// GET /api/v1/admin/vip/packages - 获取所有VIP套餐（管理员）
router.get('/admin/packages', authenticateToken, getAllVipPackages);

// POST /api/v1/admin/vip/packages - 创建VIP套餐（管理员）
router.post('/admin/packages', authenticateToken, createVipPackage);

// PUT /api/v1/admin/vip/packages/:packageId - 更新VIP套餐（管理员）
router.put('/admin/packages/:packageId', authenticateToken, updateVipPackage);

// DELETE /api/v1/admin/vip/packages/:packageId - 删除VIP套餐（管理员）
router.delete('/admin/packages/:packageId', authenticateToken, deleteVipPackage);

// GET /api/v1/admin/vip/privileges - 获取所有VIP特权（管理员）
router.get('/admin/privileges', authenticateToken, getAllVipPrivileges);

// PUT /api/v1/admin/vip/privileges/:privilegeId - 更新VIP特权配置（管理员）
router.put('/admin/privileges/:privilegeId', authenticateToken, updateVipPrivilege);

// PUT /api/v1/admin/users/:userId/vip - 手动调整用户VIP（管理员）
router.put('/admin/users/:userId/vip', authenticateToken, adjustUserVip);

// 以下功能暂未实现
// router.get('/admin/orders', authenticateToken, getVipOrders);
// router.get('/admin/orders/:orderId', authenticateToken, getVipOrderById);
// router.post('/admin/orders/:orderId/refund', authenticateToken, refundVipOrder);
// router.get('/admin/statistics', authenticateToken, getVipStatistics);

export default router;
