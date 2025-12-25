/**
 * 管理后台安全路由
 * 处理安全日志查询、支付限制解除等
 */

import { Router } from 'express';
import { authenticate, requirePermissions } from '@/middlewares/auth.js';
import { getSecurityLogs, unlockUserPayment } from '@/controllers/adminVipController.js';

const router = Router();

// 所有管理员接口都需要登录
router.use(authenticate);

/**
 * 安全日志接口 (Task 3.7)
 */

/**
 * @route   GET /api/v1/admin/security/logs
 * @desc    获取安全日志列表
 * @access  Private (需要security:view权限)
 */
router.get('/logs', requirePermissions(['security:view']), getSecurityLogs);

/**
 * @route   POST /api/v1/admin/users/:userId/unlock-payment
 * @desc    解除用户支付限制
 * @access  Private (需要security:manage权限)
 */
router.post('/users/:userId/unlock-payment', requirePermissions(['security:manage']), unlockUserPayment);

export default router;
