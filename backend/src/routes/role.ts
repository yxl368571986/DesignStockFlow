/**
 * 角色管理路由
 * 处理角色和权限管理相关的API请求
 */
import { Router } from 'express';
import { roleController } from '@/controllers/roleController.js';
import { authenticate, requirePermissions } from '@/middlewares/auth.js';

const router = Router();

// 所有角色管理接口都需要登录
router.use(authenticate);

/**
 * @route   GET /api/v1/admin/roles
 * @desc    获取角色列表
 * @access  Private (需要role:view权限)
 */
router.get(
  '/',
  requirePermissions(['role:view']),
  roleController.getRoles.bind(roleController)
);

/**
 * @route   POST /api/v1/admin/roles
 * @desc    创建角色
 * @access  Private (需要role:create权限)
 */
router.post(
  '/',
  requirePermissions(['role:create']),
  roleController.createRole.bind(roleController)
);

/**
 * @route   PUT /api/v1/admin/roles/:roleId
 * @desc    更新角色
 * @access  Private (需要role:edit权限)
 */
router.put(
  '/:roleId',
  requirePermissions(['role:edit']),
  roleController.updateRole.bind(roleController)
);

/**
 * @route   DELETE /api/v1/admin/roles/:roleId
 * @desc    删除角色
 * @access  Private (需要role:delete权限)
 */
router.delete(
  '/:roleId',
  requirePermissions(['role:delete']),
  roleController.deleteRole.bind(roleController)
);

/**
 * @route   PUT /api/v1/admin/roles/:roleId/permissions
 * @desc    为角色分配权限
 * @access  Private (需要role:edit权限)
 */
router.put(
  '/:roleId/permissions',
  requirePermissions(['role:edit']),
  roleController.assignPermissions.bind(roleController)
);

export default router;
