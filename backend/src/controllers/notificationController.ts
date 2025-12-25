/**
 * 通知控制器
 * 处理站内信相关接口
 */

import { Request, Response } from 'express';
import { notificationService } from '../services/notification/notificationService';
import logger from '../utils/logger';

/**
 * 获取用户通知列表
 * GET /api/v1/user/notifications
 */
export async function getUserNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { page = 1, pageSize = 20, unreadOnly = 'false' } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: Number(page),
      pageSize: Number(pageSize),
      unreadOnly: unreadOnly === 'true',
    });

    res.json({ code: 0, data: result });
  } catch (error: any) {
    logger.error('获取通知列表失败:', error);
    res.status(500).json({ code: 500, message: error.message || '获取通知列表失败' });
  }
}

/**
 * 获取未读通知数量
 * GET /api/v1/user/notifications/unread-count
 */
export async function getUnreadCount(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const count = await notificationService.getUnreadCount(userId);

    res.json({ code: 0, data: { unreadCount: count } });
  } catch (error: any) {
    logger.error('获取未读数量失败:', error);
    res.status(500).json({ code: 500, message: error.message || '获取未读数量失败' });
  }
}

/**
 * 标记通知为已读
 * PUT /api/v1/user/notifications/:notificationId/read
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { notificationId } = req.params;

    await notificationService.markAsRead(userId, notificationId);

    res.json({ code: 0, message: '已标记为已读' });
  } catch (error: any) {
    logger.error('标记已读失败:', error);
    res.status(500).json({ code: 500, message: error.message || '标记已读失败' });
  }
}

/**
 * 标记所有通知为已读
 * PUT /api/v1/user/notifications/read-all
 */
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const count = await notificationService.markAllAsRead(userId);

    res.json({ code: 0, message: `已标记 ${count} 条通知为已读` });
  } catch (error: any) {
    logger.error('标记全部已读失败:', error);
    res.status(500).json({ code: 500, message: error.message || '标记全部已读失败' });
  }
}

/**
 * 删除通知
 * DELETE /api/v1/user/notifications/:notificationId
 */
export async function deleteNotification(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { notificationId } = req.params;

    await notificationService.deleteNotification(userId, notificationId);

    res.json({ code: 0, message: '通知已删除' });
  } catch (error: any) {
    logger.error('删除通知失败:', error);
    res.status(500).json({ code: 500, message: error.message || '删除通知失败' });
  }
}
