/**
 * 审核路由
 * 仅审核员和管理员可访问
 */
import { Router } from 'express';
import { auditController } from '@/controllers/auditController.js';
import { authenticate, requirePermissions } from '@/middlewares/auth.js';

const router = Router();

/**
 * 获取待审核资源列表
 * GET /api/v1/admin/audit/resources
 * 需要权限：audit:view
 */
router.get(
  '/resources',
  authenticate,
  requirePermissions(['audit:view']),
  auditController.getPendingResources.bind(auditController)
);

/**
 * 审核资源
 * POST /api/v1/admin/audit/resources/:resourceId
 * 需要权限：audit:approve 或 audit:reject
 */
router.post(
  '/resources/:resourceId',
  authenticate,
  requirePermissions(['audit:approve', 'audit:reject']),
  auditController.auditResource.bind(auditController)
);

export default router;
