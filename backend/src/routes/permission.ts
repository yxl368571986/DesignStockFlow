/**
 * 权限管理路由
 * 处理权限列表查询相关的API请求
 */
import { Router } from 'express';
import { roleController } from '@/controllers/roleController.js';
import { authenticate, requirePermissions } from '@/middlewares/auth.js';

const router = Router();

// 所有权限管理接口都需要登录
router.use(authenticate);

/**
 * @route   GET /api/v1/admin/permissions
 * @desc    获取所有权限列表
 * @access  Private (需要role:view权限)
 */
router.get(
  '/',
  requirePermissions(['role:view']),
  roleController.getAllPermissions.bind(roleController)
);

export default router;
