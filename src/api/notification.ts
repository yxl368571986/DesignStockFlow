/**
 * 通知相关API接口
 */

import { get, put } from '@/utils/request';
import type { ApiResponse } from '@/types/api';

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
  readAt?: string;
  createdAt: string;
}

/**
 * 通知列表查询参数
 */
export interface NotificationQuery {
  pageNum?: number;
  pageSize?: number;
  isRead?: boolean;
}

/**
 * 通知列表结果
 */
export interface NotificationListResult {
  list: Notification[];
  total: number;
  unreadCount: number;
}

/**
 * 获取用户通知列表
 * @param query 查询参数
 * @returns 通知列表
 */
export function getNotifications(query?: NotificationQuery): Promise<ApiResponse<NotificationListResult>> {
  return get<NotificationListResult>('/notifications', query);
}

/**
 * 获取未读通知数量
 * @returns 未读数量
 */
export function getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
  return get<{ unreadCount: number }>('/notifications/unread-count');
}

/**
 * 标记通知为已读
 * @param notificationId 通知ID
 * @returns void
 */
export function markAsRead(notificationId: string): Promise<ApiResponse<void>> {
  return put<void>(`/notifications/${notificationId}/read`);
}

/**
 * 批量标记通知为已读
 * @param notificationIds 通知ID列表
 * @returns void
 */
export function batchMarkAsRead(notificationIds: string[]): Promise<ApiResponse<void>> {
  return put<void>('/notifications/batch-read', { notificationIds });
}

/**
 * 标记所有通知为已读
 * @returns void
 */
export function markAllAsRead(): Promise<ApiResponse<void>> {
  return put<void>('/notifications/read-all');
}
