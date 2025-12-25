/**
 * 用户路由
 */
import { Router } from 'express';
import { userController } from '@/controllers/userController.js';
import { authenticate } from '@/middlewares/auth.js';
import { getUserDevices, kickDevice } from '@/controllers/deviceController.js';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/controllers/notificationController.js';
import { getDownloadStats } from '@/controllers/downloadController.js';

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

/**
 * 设备管理接口 (Task 3.5)
 */

/**
 * @route   GET /api/v1/user/devices
 * @desc    获取用户设备列表
 * @access  Private (需要认证)
 */
router.get('/devices', authenticate, getUserDevices);

/**
 * @route   DELETE /api/v1/user/devices/:sessionId
 * @desc    踢出设备
 * @access  Private (需要认证)
 */
router.delete('/devices/:sessionId', authenticate, kickDevice);

/**
 * 下载统计接口 (Task 3.6)
 */

/**
 * @route   GET /api/v1/user/download-stats
 * @desc    获取用户下载次数统计
 * @access  Private (需要认证)
 */
router.get('/download-stats', authenticate, getDownloadStats);

/**
 * 通知接口
 */

/**
 * @route   GET /api/v1/user/notifications
 * @desc    获取用户通知列表
 * @access  Private (需要认证)
 */
router.get('/notifications', authenticate, getUserNotifications);

/**
 * @route   GET /api/v1/user/notifications/unread-count
 * @desc    获取未读通知数量
 * @access  Private (需要认证)
 */
router.get('/notifications/unread-count', authenticate, getUnreadCount);

/**
 * @route   PUT /api/v1/user/notifications/read-all
 * @desc    标记所有通知为已读
 * @access  Private (需要认证)
 */
router.put('/notifications/read-all', authenticate, markAllAsRead);

/**
 * @route   PUT /api/v1/user/notifications/:notificationId/read
 * @desc    标记通知为已读
 * @access  Private (需要认证)
 */
router.put('/notifications/:notificationId/read', authenticate, markAsRead);

/**
 * @route   DELETE /api/v1/user/notifications/:notificationId
 * @desc    删除通知
 * @access  Private (需要认证)
 */
router.delete('/notifications/:notificationId', authenticate, deleteNotification);

export default router;
