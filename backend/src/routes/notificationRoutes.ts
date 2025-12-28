/**
 * 通知路由
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getNotificationsHandler,
  markAsReadHandler,
  batchMarkAsReadHandler,
  markAllAsReadHandler,
  getUnreadCountHandler,
} from '../controllers/notificationController.js';

const router = Router();

// 所有通知路由都需要认证
router.use(authenticate);

// 获取未读通知数量
router.get('/unread-count', getUnreadCountHandler);

// 获取用户通知列表
router.get('/', getNotificationsHandler);

// 标记所有通知为已读
router.put('/read-all', markAllAsReadHandler);

// 批量标记通知为已读
router.put('/batch-read', batchMarkAsReadHandler);

// 标记单个通知为已读
router.put('/:notificationId/read', markAsReadHandler);

export default router;
