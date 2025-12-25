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
  getVipOrders,
  getVipOrderById,
  refundVipOrder,
  getVipStatistics,
} from '@/controllers/vipController.js';
import {
  createVipOrder,
  initiatePayment,
  getPaymentStatus,
  getUserOrders,
  getOrderDetail,
  cancelOrder,
  requestRefund,
  sendSecondaryAuthCode,
  verifySecondaryAuthCode,
} from '@/controllers/vipPaymentController.js';
import {
  getPointsExchangeInfo,
  exchangePointsForVip,
  getExchangeRecords,
} from '@/controllers/pointsExchangeController.js';
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
 * VIP订单接口 (Task 3.2)
 */

// POST /api/v1/vip/orders - 创建VIP订单
router.post('/orders', authenticateToken, createVipOrder);

// GET /api/v1/vip/orders - 获取用户订单列表
router.get('/orders', authenticateToken, getUserOrders);

// GET /api/v1/vip/orders/:orderNo - 获取订单详情
router.get('/orders/:orderNo', authenticateToken, getOrderDetail);

// POST /api/v1/vip/orders/:orderNo/pay - 发起支付
router.post('/orders/:orderNo/pay', authenticateToken, initiatePayment);

// GET /api/v1/vip/orders/:orderNo/status - 查询支付状态
router.get('/orders/:orderNo/status', authenticateToken, getPaymentStatus);

// POST /api/v1/vip/orders/:orderNo/cancel - 取消订单
router.post('/orders/:orderNo/cancel', authenticateToken, cancelOrder);

// POST /api/v1/vip/orders/:orderNo/refund - 申请退款
router.post('/orders/:orderNo/refund', authenticateToken, requestRefund);

/**
 * 积分兑换接口 (Task 3.3)
 */

// GET /api/v1/vip/points-exchange/info - 获取积分兑换信息
router.get('/points-exchange/info', authenticateToken, getPointsExchangeInfo);

// POST /api/v1/vip/points-exchange - 积分兑换VIP
router.post('/points-exchange', authenticateToken, exchangePointsForVip);

// GET /api/v1/vip/points-exchange/records - 获取兑换记录
router.get('/points-exchange/records', authenticateToken, getExchangeRecords);

/**
 * 二次验证接口 (Task 3.4)
 */

// POST /api/v1/vip/auth/send-code - 发送二次验证码
router.post('/auth/send-code', authenticateToken, sendSecondaryAuthCode);

// POST /api/v1/vip/auth/verify-code - 验证二次验证码
router.post('/auth/verify-code', authenticateToken, verifySecondaryAuthCode);

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

// GET /api/v1/vip/admin/orders - 获取VIP订单列表（管理员）
router.get('/admin/orders', authenticateToken, getVipOrders);

// GET /api/v1/vip/admin/orders/:orderId - 获取VIP订单详情（管理员）
router.get('/admin/orders/:orderId', authenticateToken, getVipOrderById);

// POST /api/v1/vip/admin/orders/:orderId/refund - VIP订单退款（管理员）
router.post('/admin/orders/:orderId/refund', authenticateToken, refundVipOrder);

// GET /api/v1/vip/admin/statistics - 获取VIP统计数据（管理员）
router.get('/admin/statistics', authenticateToken, getVipStatistics);

export default router;
