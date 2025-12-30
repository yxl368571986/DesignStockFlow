/**
 * 兑换审计路由
 * 处理积分兑换审计日志查询等 API 请求
 * 
 * 需求: 10.9
 */

import { Router } from 'express';
import { authenticate, requirePermissions } from '@/middlewares/auth.js';
import {
  getExchangeAuditLogsHandler,
  getExchangeStatsHandler,
  refundExchangeHandler,
} from '@/controllers/exchangeAuditController.js';

const router = Router();

// 所有路由需要管理员权限
router.use(authenticate);
router.use(requirePermissions(['admin:points']));

/**
 * GET /api/v1/admin/points/exchange/audit-logs
 * 获取兑换审计日志列表
 */
router.get('/audit-logs', getExchangeAuditLogsHandler);

/**
 * GET /api/v1/admin/points/exchange/stats
 * 获取兑换统计
 */
router.get('/stats', getExchangeStatsHandler);

/**
 * POST /api/v1/admin/points/exchange/:exchangeId/refund
 * 处理兑换退款
 */
router.post('/:exchangeId/refund', refundExchangeHandler);

export default router;
