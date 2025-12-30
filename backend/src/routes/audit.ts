/**
 * 审核路由
 * 仅审核员和管理员可访问
 */
import { Router } from 'express';
import { authenticate, requirePermissions } from '@/middlewares/auth.js';
import {
  getAuditListHandler,
  approveHandler,
  rejectHandler,
  batchApproveHandler,
  batchRejectHandler,
  getRejectReasonsHandler,
  getResourceDetailsHandler,
  getAuditLogsHandler,
  getResourceHistoryHandler,
  adjustResourcePricingHandler,
  getPricingHistoryHandler,
} from '@/controllers/auditController.js';

const router = Router();

/**
 * 获取待审核资源列表
 * GET /api/v1/admin/audit/list
 * 需要权限：audit:view
 */
router.get(
  '/list',
  authenticate,
  requirePermissions(['audit:view']),
  getAuditListHandler
);

/**
 * 获取预设驳回原因列表
 * GET /api/v1/admin/audit/reject-reasons
 */
router.get(
  '/reject-reasons',
  authenticate,
  requirePermissions(['audit:view']),
  getRejectReasonsHandler
);

/**
 * 获取审核日志列表
 * GET /api/v1/admin/audit/logs
 * 需要权限：audit:view
 */
router.get(
  '/logs',
  authenticate,
  requirePermissions(['audit:view']),
  getAuditLogsHandler
);

/**
 * 批量审核通过
 * POST /api/v1/admin/audit/batch-approve
 * 需要权限：audit:approve
 */
router.post(
  '/batch-approve',
  authenticate,
  requirePermissions(['audit:approve']),
  batchApproveHandler
);

/**
 * 批量审核驳回
 * POST /api/v1/admin/audit/batch-reject
 * 需要权限：audit:reject
 */
router.post(
  '/batch-reject',
  authenticate,
  requirePermissions(['audit:reject']),
  batchRejectHandler
);

/**
 * 获取资源详情
 * GET /api/v1/admin/audit/:resourceId/details
 * 需要权限：audit:view
 */
router.get(
  '/:resourceId/details',
  authenticate,
  requirePermissions(['audit:view']),
  getResourceDetailsHandler
);

/**
 * 获取资源审核历史
 * GET /api/v1/admin/audit/:resourceId/history
 * 需要权限：audit:view
 */
router.get(
  '/:resourceId/history',
  authenticate,
  requirePermissions(['audit:view']),
  getResourceHistoryHandler
);

/**
 * 审核通过
 * POST /api/v1/admin/audit/:resourceId/approve
 * 需要权限：audit:approve
 */
router.post(
  '/:resourceId/approve',
  authenticate,
  requirePermissions(['audit:approve']),
  approveHandler
);

/**
 * 审核驳回
 * POST /api/v1/admin/audit/:resourceId/reject
 * 需要权限：audit:reject
 */
router.post(
  '/:resourceId/reject',
  authenticate,
  requirePermissions(['audit:reject']),
  rejectHandler
);

/**
 * 调整资源定价
 * POST /api/v1/admin/audit/:resourceId/adjust-pricing
 * 需要权限：audit:approve（审核员权限）
 * 
 * 需求: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
router.post(
  '/:resourceId/adjust-pricing',
  authenticate,
  requirePermissions(['audit:approve']),
  adjustResourcePricingHandler
);

/**
 * 获取资源定价变更历史
 * GET /api/v1/admin/audit/:resourceId/pricing-history
 * 需要权限：audit:view
 * 
 * 需求: 8.6
 */
router.get(
  '/:resourceId/pricing-history',
  authenticate,
  requirePermissions(['audit:view']),
  getPricingHistoryHandler
);

export default router;
