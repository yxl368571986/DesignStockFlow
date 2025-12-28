/**
 * 通知控制器
 * 处理用户通知相关的 API 请求
 */

import { Request, Response } from 'express';
import {
  getUserNotifications as getNotifications,
  markAsRead as markNotificationAsRead,
  batchMarkAsRead,
  markAllAsRead as markAllNotificationsAsRead,
  getUnreadCount as getNotificationUnreadCount,
} from '../services/notificationService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取用户通知列表
 * GET /api/v1/notifications
 * GET /api/v1/user/notifications
 */
export async function getNotificationsHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    const {
      pageNum = '1',
      pageSize = '20',
      isRead,
    } = req.query;
    
    const result = await getNotifications(userId, {
      pageNum: Number(pageNum),
      pageSize: Number(pageSize),
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
    });
    
    res.json({
      code: 0,
      message: '获取成功',
      data: result,
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

// 导出别名以兼容现有路由
export const getUserNotifications = getNotificationsHandler;

/**
 * 标记通知为已读
 * PUT /api/v1/notifications/:notificationId/read
 * PUT /api/v1/user/notifications/:notificationId/read
 */
export async function markAsReadHandler(req: Request, res: Response): Promise<void> {
  try {
    const { notificationId } = req.params;
    
    if (!notificationId) {
      res.status(400).json({ code: 400, message: '缺少通知ID' });
      return;
    }
    
    await markNotificationAsRead(notificationId);
    
    res.json({
      code: 0,
      message: '已标记为已读',
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

// 导出别名
export const markAsRead = markAsReadHandler;

/**
 * 批量标记通知为已读
 * PUT /api/v1/notifications/batch-read
 */
export async function batchMarkAsReadHandler(req: Request, res: Response): Promise<void> {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      res.status(400).json({ code: 400, message: '请选择要标记的通知' });
      return;
    }
    
    await batchMarkAsRead(notificationIds);
    
    res.json({
      code: 0,
      message: '已批量标记为已读',
    });
  } catch (error) {
    console.error('批量标记已读失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 标记所有通知为已读
 * PUT /api/v1/notifications/read-all
 * PUT /api/v1/user/notifications/read-all
 */
export async function markAllAsReadHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    await markAllNotificationsAsRead(userId);
    
    res.json({
      code: 0,
      message: '已全部标记为已读',
    });
  } catch (error) {
    console.error('标记全部已读失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

// 导出别名
export const markAllAsRead = markAllAsReadHandler;

/**
 * 获取未读通知数量
 * GET /api/v1/notifications/unread-count
 * GET /api/v1/user/notifications/unread-count
 */
export async function getUnreadCountHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    const count = await getNotificationUnreadCount(userId);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error('获取未读数量失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

// 导出别名
export const getUnreadCount = getUnreadCountHandler;

/**
 * 删除通知
 * DELETE /api/v1/user/notifications/:notificationId
 */
export async function deleteNotification(req: Request, res: Response): Promise<void> {
  try {
    const { notificationId } = req.params;
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    if (!notificationId) {
      res.status(400).json({ code: 400, message: '缺少通知ID' });
      return;
    }
    
    // 验证通知属于当前用户
    const notification = await prisma.notifications.findUnique({
      where: { notification_id: notificationId },
    });
    
    if (!notification) {
      res.status(404).json({ code: 404, message: '通知不存在' });
      return;
    }
    
    if (notification.user_id !== userId) {
      res.status(403).json({ code: 403, message: '无权删除此通知' });
      return;
    }
    
    await prisma.notifications.delete({
      where: { notification_id: notificationId },
    });
    
    res.json({
      code: 0,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}
