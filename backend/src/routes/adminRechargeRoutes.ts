/**
 * 管理端充值路由
 * 套餐管理、订单管理、积分调整、对账等API
 */

import { Router } from 'express';
import * as adminRechargeController from '../controllers/adminRechargeController.js';
import { authenticate as authenticateToken, requirePermissions as requirePermission } from '../middlewares/auth.js';

const router = Router();

// 所有管理端接口需要登录
router.use(authenticateToken);

// ==================== 套餐管理 ====================

/**
 * 获取所有套餐
 * GET /api/v1/admin/recharge/packages
 */
router.get('/packages', requirePermission(['settings:view']), adminRechargeController.getAllPackages);

/**
 * 创建套餐
 * POST /api/v1/admin/recharge/packages
 */
router.post('/packages', requirePermission(['settings:edit']), adminRechargeController.createPackage);

/**
 * 更新套餐排序
 * PUT /api/v1/admin/recharge/packages/sort
 */
router.put('/packages/sort', requirePermission(['settings:edit']), adminRechargeController.updatePackageSort);

/**
 * 更新套餐
 * PUT /api/v1/admin/recharge/packages/:packageId
 */
router.put('/packages/:packageId', requirePermission(['settings:edit']), adminRechargeController.updatePackage);

/**
 * 禁用套餐
 * DELETE /api/v1/admin/recharge/packages/:packageId
 */
router.delete('/packages/:packageId', requirePermission(['settings:edit']), adminRechargeController.disablePackage);

// ==================== 订单管理 ====================

/**
 * 获取充值订单列表
 * GET /api/v1/admin/recharge/orders
 */
router.get('/orders', requirePermission(['settings:view']), adminRechargeController.getRechargeOrders);

/**
 * 获取订单详情
 * GET /api/v1/admin/recharge/orders/:orderId
 */
router.get('/orders/:orderId', requirePermission(['settings:view']), adminRechargeController.getRechargeOrderDetail);

// ==================== 对账管理 ====================

/**
 * 执行对账
 * POST /api/v1/admin/recharge/reconcile
 */
router.post('/reconcile', requirePermission(['settings:edit']), adminRechargeController.reconcileOrders);

/**
 * 获取异常订单
 * GET /api/v1/admin/recharge/anomalous-orders
 */
router.get('/anomalous-orders', requirePermission(['settings:view']), adminRechargeController.getAnomalousOrders);

/**
 * 自动补单
 * POST /api/v1/admin/recharge/auto-fix/:orderId
 */
router.post('/auto-fix/:orderId', requirePermission(['settings:edit']), adminRechargeController.autoFixOrder);

/**
 * 获取对账统计
 * GET /api/v1/admin/recharge/reconciliation-stats
 */
router.get('/reconciliation-stats', requirePermission(['statistics:view']), adminRechargeController.getReconciliationStats);

// ==================== 统计功能 ====================

/**
 * 获取充值统计
 * GET /api/v1/admin/recharge/statistics
 */
router.get('/statistics', requirePermission(['statistics:view']), adminRechargeController.getRechargeStatistics);

export default router;
