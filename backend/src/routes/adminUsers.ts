/**
 * 管理员用户路由
 */
import { Router } from 'express';
import { adminUserController } from '@/controllers/adminUserController.js';
import { authenticate, requirePermissions } from '@/middlewares/auth.js';

const router = Router();

// 所有管理员用户接口都需要登录
router.use(authenticate);

/**
 * @route   GET /api/v1/admin/users
 * @desc    获取用户列表
 * @access  Private (需要user:view权限)
 */
router.get(
  '/',
  requirePermissions(['user:view']),
  adminUserController.getUserList.bind(adminUserController)
);

/**
 * @route   GET /api/v1/admin/users/:userId
 * @desc    获取用户详情
 * @access  Private (需要user:view权限)
 */
router.get(
  '/:userId',
  requirePermissions(['user:view']),
  adminUserController.getUserDetail.bind(adminUserController)
);

/**
 * @route   PUT /api/v1/admin/users/:userId/status
 * @desc    禁用/启用用户
 * @access  Private (需要user:disable权限)
 */
router.put(
  '/:userId/status',
  requirePermissions(['user:disable']),
  adminUserController.updateUserStatus.bind(adminUserController)
);

/**
 * @route   POST /api/v1/admin/users/:userId/reset-password
 * @desc    重置用户密码
 * @access  Private (需要user:edit权限)
 */
router.post(
  '/:userId/reset-password',
  requirePermissions(['user:edit']),
  adminUserController.resetPassword.bind(adminUserController)
);

/**
 * @route   PUT /api/v1/admin/users/:userId/vip
 * @desc    调整用户VIP
 * @access  Private (需要user:edit权限)
 */
router.put(
  '/:userId/vip',
  requirePermissions(['user:edit']),
  adminUserController.adjustVip.bind(adminUserController)
);

/**
 * @route   POST /api/v1/admin/users/:userId/points/adjust
 * @desc    调整用户积分
 * @access  Private (需要user:edit权限)
 */
router.post(
  '/:userId/points/adjust',
  requirePermissions(['user:edit']),
  adminUserController.adjustPoints.bind(adminUserController)
);

export default router;
