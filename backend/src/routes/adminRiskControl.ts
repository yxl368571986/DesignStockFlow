/**
 * 风控审核路由
 * 处理风控预警列表、审核等 API 请求
 * 
 * 需求: 5.7, 5.9, 5.10
 */

import { Router } from 'express';
import { authenticate, requirePermissions } from '@/middlewares/auth.js';
import {
  getRiskControlListHandler,
  reviewRiskControlHandler,
  getRiskControlStatsHandler,
} from '@/controllers/riskControlController.js';

const router = Router();

// 所有路由需要管理员权限
router.use(authenticate);
router.use(requirePermissions(['admin:risk-control']));

/**
 * GET /api/v1/admin/risk-control/list
 * 获取风控预警列表
 */
router.get('/list', getRiskControlListHandler);

/**
 * GET /api/v1/admin/risk-control/stats
 * 获取风控统计
 */
router.get('/stats', getRiskControlStatsHandler);

/**
 * POST /api/v1/admin/risk-control/:logId/review
 * 审核风控预警
 */
router.post('/:logId/review', reviewRiskControlHandler);

export default router;
