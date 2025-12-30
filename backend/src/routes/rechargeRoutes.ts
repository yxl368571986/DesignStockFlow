/**
 * 充值路由
 * 用户端充值相关API
 */

import { Router } from 'express';
import * as rechargeController from '../controllers/rechargeController.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = Router();

/**
 * 获取充值套餐列表（无需登录）
 * GET /api/v1/recharge/packages
 */
router.get('/packages', rechargeController.getRechargePackages);

/**
 * 以下接口需要登录
 */

/**
 * 获取用户充值订单列表
 * GET /api/v1/recharge/orders
 */
router.get('/orders', authenticateToken, rechargeController.getUserRechargeOrders);

/**
 * 创建充值订单
 * POST /api/v1/recharge/orders
 */
router.post('/orders', authenticateToken, rechargeController.createRechargeOrder);

/**
 * 查询订单状态
 * GET /api/v1/recharge/orders/:orderId
 */
router.get('/orders/:orderId', authenticateToken, rechargeController.getRechargeOrderStatus);

/**
 * 取消订单
 * POST /api/v1/recharge/orders/:orderId/cancel
 */
router.post('/orders/:orderId/cancel', authenticateToken, rechargeController.cancelRechargeOrder);

export default router;
