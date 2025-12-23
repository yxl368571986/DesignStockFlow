/**
 * 用户路由
 */
import { Router } from 'express';
import { userController } from '@/controllers/userController.js';
import { authenticate } from '@/middlewares/auth.js';

const router = Router();

/**
 * @route   GET /api/v1/user/info
 * @desc    获取当前登录用户信息
 * @access  Private (需要认证)
 */
router.get('/info', authenticate, userController.getUserInfo.bind(userController));

/**
 * @route   PUT /api/v1/user/info
 * @desc    更新用户信息
 * @access  Private (需要认证)
 */
router.put('/info', authenticate, userController.updateUserInfo.bind(userController));

/**
 * @route   PUT /api/v1/user/password
 * @desc    修改密码
 * @access  Private (需要认证)
 */
router.put('/password', authenticate, userController.updatePassword.bind(userController));

/**
 * @route   GET /api/v1/user/download-history
 * @desc    获取下载历史
 * @access  Private (需要认证)
 */
router.get('/download-history', authenticate, userController.getDownloadHistory.bind(userController));

/**
 * @route   GET /api/v1/user/upload-history
 * @desc    获取上传历史
 * @access  Private (需要认证)
 */
router.get('/upload-history', authenticate, userController.getUploadHistory.bind(userController));

/**
 * @route   GET /api/v1/user/vip-info
 * @desc    获取VIP信息
 * @access  Private (需要认证)
 */
router.get('/vip-info', authenticate, userController.getVIPInfo.bind(userController));

export default router;
