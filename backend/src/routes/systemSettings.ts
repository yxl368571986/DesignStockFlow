/**
 * 系统设置路由
 * 管理员系统设置相关接口
 */
import { Router } from 'express';
import { systemSettingsController } from '@/controllers/systemSettingsController.js';
import { authenticate } from '@/middlewares/auth.js';

const router = Router();

// 所有系统设置接口都需要管理员权限
router.use(authenticate);

/**
 * 获取所有系统设置
 * GET /api/v1/admin/settings
 */
router.get('/', systemSettingsController.getAllSettings.bind(systemSettingsController));

/**
 * 更新系统设置
 * PUT /api/v1/admin/settings
 */
router.put('/', systemSettingsController.updateSettings.bind(systemSettingsController));

/**
 * 重置系统设置
 * POST /api/v1/admin/settings/reset
 */
router.post('/reset', systemSettingsController.resetSettings.bind(systemSettingsController));

export default router;
