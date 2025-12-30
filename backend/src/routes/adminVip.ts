/**
 * 管理后台VIP路由
 * 处理退款审核、安全日志等管理功能
 */

import { Router } from 'express';
import { authenticate, requirePermissions } from '@/middlewares/auth.js';
import {
  getRefundList,
  processRefund,
  getSecurityLogs,
  unlockUserPayment,
  getVipOrderStatistics,
  getRefundStatistics,
  getPaymentChannelDistribution,
  getAbnormalOrderStatistics,
} from '@/controllers/adminVipController.js';

const router = Router();

// 所有管理员接口都需要登录
router.use(authenticate);

/**
 * 退款管理接口 (Task 3.7)
 */

/**
 * @route   GET /api/v1/admin/vip/refunds
 * @desc    获取退款申请列表
 * @access  Private (需要vip:refund权限)
 */
router.get('/refunds', requirePermissions(['vip:refund']), getRefundList);

/**
 * @route   GET /api/v1/admin/vip/refunds/statistics
 * @desc    获取退款统计
 * @access  Private (需要vip:view权限)
 */
router.get('/refunds/statistics', requirePermissions(['vip:view']), getRefundStatistics);

/**
 * @route   PUT /api/v1/admin/vip/refunds/:refundId
 * @desc    处理退款申请（审批/拒绝）
 * @access  Private (需要vip:refund权限)
 */
router.put('/refunds/:refundId', requirePermissions(['vip:refund']), processRefund);

/**
 * @route   GET /api/v1/admin/vip/payment-channels
 * @desc    获取支付渠道分布
 * @access  Private (需要vip:view权限)
 */
router.get('/payment-channels', requirePermissions(['vip:view']), getPaymentChannelDistribution);

/**
 * @route   GET /api/v1/admin/vip/abnormal-orders
 * @desc    获取异常订单统计
 * @access  Private (需要vip:view权限)
 */
router.get('/abnormal-orders', requirePermissions(['vip:view']), getAbnormalOrderStatistics);

/**
 * @route   GET /api/v1/admin/vip/order-statistics
 * @desc    获取VIP订单统计
 * @access  Private (需要vip:view权限)
 */
router.get('/order-statistics', requirePermissions(['vip:view']), getVipOrderStatistics);

export default router;
