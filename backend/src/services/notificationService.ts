/**
 * 通知服务
 * 负责发送审核结果通知、查询用户通知、标记已读等功能
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 通知类型
 */
export type NotificationType = 
  | 'audit_approved' 
  | 'audit_rejected' 
  | 'system' 
  | 'vip_expire'
  | 'earnings'           // 收益到账
  | 'pricing_adjusted'   // 定价调整
  | 'points_expiry'      // 积分过期提醒
  | 'exchange'           // 兑换结果
  | 'risk_control';      // 风控预警

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


/**
 * 发送收益到账通知
 * 
 * 需求: 4.7
 * 
 * @param params 通知参数
 */
export async function sendEarningsNotification(params: {
  userId: string;
  resourceId: string;
  resourceTitle: string;
  earningsPoints: number;
  downloaderType: 'normal' | 'vip';
}): Promise<void> {
  const { userId, resourceId, resourceTitle, earningsPoints, downloaderType } = params;
  
  const downloaderDesc = downloaderType === 'vip' ? 'VIP用户' : '用户';
  const content = `您的作品「${resourceTitle}」被${downloaderDesc}下载，获得 ${earningsPoints} 积分收益。`;
  
  await prisma.notifications.create({
    data: {
      user_id: userId,
      type: 'earnings',
      title: '收益到账通知',
      content,
      resource_id: resourceId,
      link_url: `/user/earnings`,
      is_read: false,
    },
  });
}

/**
 * 发送定价调整通知
 * 
 * 需求: 6.5
 * 
 * @param params 通知参数
 */
export async function sendPricingAdjustedNotification(params: {
  userId: string;
  resourceId: string;
  resourceTitle: string;
  oldPricingType: number;
  newPricingType: number;
  oldPointsCost: number;
  newPointsCost: number;
  reason: string;
  adjustedBy: string;
}): Promise<void> {
  const { userId, resourceId, resourceTitle, oldPricingType, newPricingType, oldPointsCost, newPointsCost, reason } = params;
  
  // 定价类型描述
  const pricingTypeDesc = (type: number, points: number): string => {
    switch (type) {
      case 0: return '免费';
      case 1: return `${points}积分`;
      case 2: return 'VIP专属';
      default: return '未知';
    }
  };
  
  const oldDesc = pricingTypeDesc(oldPricingType, oldPointsCost);
  const newDesc = pricingTypeDesc(newPricingType, newPointsCost);
  
  const content = `您的作品「${resourceTitle}」定价已由审核员调整：${oldDesc} → ${newDesc}。调整原因：${reason}`;
  
  await prisma.notifications.create({
    data: {
      user_id: userId,
      type: 'pricing_adjusted',
      title: '作品定价调整通知',
      content,
      resource_id: resourceId,
      link_url: `/resource/${resourceId}`,
      is_read: false,
    },
  });
}

/**
 * 发送积分过期提醒通知
 * 
 * 需求: 11.3
 * 
 * @param params 通知参数
 */
export async function sendPointsExpiryNotification(params: {
  userId: string;
  expiringPoints: number;
  daysUntilExpiry: number;
}): Promise<void> {
  const { userId, expiringPoints, daysUntilExpiry } = params;
  
  let content: string;
  if (daysUntilExpiry <= 7) {
    content = `您有 ${expiringPoints} 积分将在 ${daysUntilExpiry} 天内过期，请尽快使用！`;
  } else {
    content = `您有 ${expiringPoints} 积分将在 ${daysUntilExpiry} 天内过期，建议尽早使用。`;
  }
  
  await prisma.notifications.create({
    data: {
      user_id: userId,
      type: 'points_expiry',
      title: '积分即将过期提醒',
      content,
      link_url: '/user/points',
      is_read: false,
    },
  });
}

/**
 * 发送兑换结果通知
 * 
 * 需求: 10.6
 * 
 * @param params 通知参数
 */
export async function sendExchangeNotification(params: {
  userId: string;
  exchangeId: string;
  productName: string;
  pointsCost: number;
  success: boolean;
  failReason?: string;
}): Promise<void> {
  const { userId, exchangeId, productName, pointsCost, success, failReason } = params;
  
  let title: string;
  let content: string;
  
  if (success) {
    title = '兑换成功';
    content = `您已成功兑换「${productName}」，消耗 ${pointsCost} 积分。`;
  } else {
    title = '兑换失败';
    content = `您兑换「${productName}」失败`;
    if (failReason) {
      content += `，原因：${failReason}`;
    }
    content += '。积分已退还至您的账户。';
  }
  
  await prisma.notifications.create({
    data: {
      user_id: userId,
      type: 'exchange',
      title,
      content,
      link_url: `/user/exchange/${exchangeId}`,
      is_read: false,
    },
  });
}

/**
 * 发送风控预警通知（给运营人员）
 * 
 * 需求: 5.8
 * 
 * @param params 通知参数
 */
export async function sendRiskControlNotification(params: {
  adminUserIds: string[];
  resourceId: string;
  resourceTitle: string;
  uploaderId: string;
  uploaderName: string;
  riskType: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}): Promise<void> {
  const { adminUserIds, resourceId, resourceTitle, uploaderId, uploaderName, riskType, riskLevel, description } = params;
  
  const levelDesc = {
    low: '低',
    medium: '中',
    high: '高',
  };
  
  const content = `检测到风险预警：用户「${uploaderName}」的作品「${resourceTitle}」触发${riskType}风控规则。风险等级：${levelDesc[riskLevel]}。详情：${description}`;
  
  // 给所有运营人员发送通知
  const notifications = adminUserIds.map(adminId => ({
    user_id: adminId,
    type: 'risk_control' as const,
    title: '风控预警通知',
    content,
    resource_id: resourceId,
    link_url: `/admin/risk-control?resourceId=${resourceId}&uploaderId=${uploaderId}`,
    is_read: false,
    created_at: new Date(),
    updated_at: new Date(),
  }));
  
  await prisma.notifications.createMany({
    data: notifications,
  });
}

/**
 * 批量发送系统通知（给多个用户）
 * 
 * @param params 通知参数
 */
export async function sendBatchSystemNotification(params: {
  userIds: string[];
  title: string;
  content: string;
  linkUrl?: string;
}): Promise<void> {
  const { userIds, title, content, linkUrl } = params;
  
  const notifications = userIds.map(userId => ({
    user_id: userId,
    type: 'system' as const,
    title,
    content,
    link_url: linkUrl,
    is_read: false,
    created_at: new Date(),
    updated_at: new Date(),
  }));
  
  await prisma.notifications.createMany({
    data: notifications,
  });
}
