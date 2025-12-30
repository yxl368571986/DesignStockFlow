/**
 * 管理端积分调整路由
 * 积分调整、批量赠送、撤销等API
 */

import { Router } from 'express';
import * as adminRechargeController from '../controllers/adminRechargeController.js';
import { authenticate as authenticateToken, requirePermissions as requirePermission } from '../middlewares/auth.js';

const router = Router();

// 所有管理端接口需要登录
router.use(authenticateToken);

/**
 * 调整用户积分
 * POST /api/v1/admin/points/adjust
 */
router.post('/adjust', requirePermission(['settings:edit']), adminRechargeController.adjustUserPoints);

/**
 * 批量赠送积分
 * POST /api/v1/admin/points/batch-gift
 */
router.post('/batch-gift', requirePermission(['settings:edit']), adminRechargeController.batchGiftPoints);

/**
 * 撤销积分调整
 * POST /api/v1/admin/points/revoke/:logId
 */
router.post('/revoke/:logId', requirePermission(['settings:edit']), adminRechargeController.revokeAdjustment);

/**
 * 获取积分调整日志
 * GET /api/v1/admin/points/adjustment-logs
 */
router.get('/adjustment-logs', requirePermission(['settings:view']), adminRechargeController.getAdjustmentLogs);

/**
 * 获取积分流水统计
 * GET /api/v1/admin/points-adjust/flow-statistics
 */
router.get('/flow-statistics', requirePermission(['statistics:view']), adminRechargeController.getPointsFlowStatistics);

export default router;
