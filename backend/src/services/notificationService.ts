/**
 * 通知服务
 * 负责发送审核结果通知、查询用户通知、标记已读等功能
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 通知类型
 */
export type NotificationType = 'audit_approved' | 'audit_rejected' | 'system' | 'vip_expire';

/**
 * 通知信息
 */
export interface Notification {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  resourceId?: string;
  linkUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

/**
 * 通知查询参数
 */
export interface NotificationQuery {
  pageNum: number;
  pageSize: number;
  isRead?: boolean;
}

/**
 * 通知查询结果
 */
export interface NotificationResult {
  list: Notification[];
  total: number;
  unreadCount: number;
}

/**
 * 发送审核结果通知
 * @param params 通知参数
 */
export async function sendAuditNotification(params: {
  userId: string;
  resourceId: string;
  resourceTitle: string;
  auditResult: 'approved' | 'rejected';
  rejectReason?: string;
}): Promise<void> {
  const { userId, resourceId, resourceTitle, auditResult, rejectReason } = params;
  
  const isApproved = auditResult === 'approved';
  const type: NotificationType = isApproved ? 'audit_approved' : 'audit_rejected';
  const title = isApproved ? '资源审核通过' : '资源审核未通过';
  
  let content: string;
  if (isApproved) {
    content = `您上传的资源「${resourceTitle}」已通过审核，现已对外展示。`;
  } else {
    content = `您上传的资源「${resourceTitle}」未通过审核。`;
    if (rejectReason) {
      content += `驳回原因：${rejectReason}。`;
    }
    content += `请检查文件内容后再继续上传。`;
  }
  
  await prisma.notifications.create({
    data: {
      user_id: userId,
      type,
      title,
      content,
      resource_id: resourceId,
      link_url: `/user/resources/${resourceId}`,
      is_read: false,
    },
  });
}

/**
 * 获取用户通知列表
 * @param userId 用户ID
 * @param query 查询参数
 * @returns 通知列表
 */
export async function getUserNotifications(userId: string, query: NotificationQuery): Promise<NotificationResult> {
  const { pageNum, pageSize, isRead } = query;
  const skip = (pageNum - 1) * pageSize;
  
  // 构建查询条件
  const where: Record<string, unknown> = {
    user_id: userId,
  };
  
  if (isRead !== undefined) {
    where.is_read = isRead;
  }
  
  // 查询数据
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notifications.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.notifications.count({ where }),
    prisma.notifications.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    }),
  ]);
  
  // 转换数据格式
  const list: Notification[] = notifications.map(n => ({
    notificationId: n.notification_id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    content: n.content,
    resourceId: n.resource_id || undefined,
    linkUrl: n.link_url || undefined,
    isRead: n.is_read,
    readAt: n.read_at || undefined,
    createdAt: n.created_at,
  }));
  
  return { list, total, unreadCount };
}

/**
 * 标记通知为已读
 * @param notificationId 通知ID
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await prisma.notifications.update({
    where: { notification_id: notificationId },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });
}

/**
 * 批量标记通知为已读
 * @param notificationIds 通知ID列表
 */
export async function batchMarkAsRead(notificationIds: string[]): Promise<void> {
  await prisma.notifications.updateMany({
    where: {
      notification_id: { in: notificationIds },
    },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });
}

/**
 * 标记用户所有通知为已读
 * @param userId 用户ID
 */
export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notifications.updateMany({
    where: {
      user_id: userId,
      is_read: false,
    },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });
}

/**
 * 获取用户未读通知数量
 * @param userId 用户ID
 * @returns 未读数量
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notifications.count({
    where: {
      user_id: userId,
      is_read: false,
    },
  });
}

/**
 * 发送系统通知
 * @param params 通知参数
 */
export async function sendSystemNotification(params: {
  userId: string;
  title: string;
  content: string;
  linkUrl?: string;
}): Promise<void> {
  const { userId, title, content, linkUrl } = params;
  
  await prisma.notifications.create({
    data: {
      user_id: userId,
      type: 'system',
      title,
      content,
      link_url: linkUrl,
      is_read: false,
    },
  });
}
