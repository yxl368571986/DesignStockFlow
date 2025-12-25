/**
 * 通知服务
 * 处理站内信发送和VIP到期提醒
 */

import { PrismaClient } from '@prisma/client';
import { enhancedVipService } from '../vip/enhancedVipService';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

// 通知类型
export enum NotificationType {
  VIP_EXPIRY = 'vip_expiry',
  VIP_EXPIRED = 'vip_expired',
  PAYMENT_SUCCESS = 'payment_success',
  REFUND_STATUS = 'refund_status',
  SYSTEM = 'system'
}

// 发送通知参数
export interface SendNotificationParams {
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  linkUrl?: string;
}

// 通知模板
const NOTIFICATION_TEMPLATES = {
  vipExpiry3Days: {
    title: 'VIP即将到期提醒',
    content: '您的VIP会员将在3天后到期，续费可享受更多优惠，点击立即续费。',
    linkUrl: '/vip',
  },
  vipExpiry1Day: {
    title: 'VIP明天到期提醒',
    content: '您的VIP会员将在明天到期，为避免影响您的下载权益，请及时续费。',
    linkUrl: '/vip',
  },
  vipExpiryToday: {
    title: 'VIP今日到期提醒',
    content: '您的VIP会员今日到期，到期后将无法享受VIP专属下载权益，请及时续费。',
    linkUrl: '/vip',
  },
  vipExpired7Days: {
    title: 'VIP已过期提醒',
    content: '您的VIP会员已过期7天，宽限期即将结束。续费后可立即恢复VIP权益。',
    linkUrl: '/vip',
  },
  paymentSuccess: {
    title: '支付成功通知',
    content: '恭喜您成功开通VIP会员！现在可以享受VIP专属下载权益了。',
    linkUrl: '/user/orders',
  },
  refundApproved: {
    title: '退款申请已通过',
    content: '您的退款申请已通过审核，退款金额将在1-3个工作日内原路退回。',
    linkUrl: '/user/orders',
  },
  refundRejected: {
    title: '退款申请被拒绝',
    content: '很抱歉，您的退款申请未通过审核。如有疑问，请联系客服。',
    linkUrl: '/user/orders',
  },
  refundSuccess: {
    title: '退款成功通知',
    content: '您的退款已成功处理，退款金额已原路退回，请注意查收。',
    linkUrl: '/user/orders',
  },
};

class NotificationService {
  /**
   * 发送站内信
   */
  async sendNotification(params: SendNotificationParams): Promise<void> {
    await prisma.notifications.create({
      data: {
        user_id: params.userId,
        title: params.title,
        content: params.content,
        type: params.type,
        link_url: params.linkUrl,
        is_read: false,
      },
    });

    logger.info(`发送站内信: 用户 ${params.userId}, 类型 ${params.type}, 标题: ${params.title}`);
  }

  /**
   * 发送VIP到期提醒
   */
  async sendVipExpiryReminder(userId: string, daysRemaining: number): Promise<void> {
    let template;

    if (daysRemaining === 3) {
      template = NOTIFICATION_TEMPLATES.vipExpiry3Days;
    } else if (daysRemaining === 1) {
      template = NOTIFICATION_TEMPLATES.vipExpiry1Day;
    } else if (daysRemaining === 0) {
      template = NOTIFICATION_TEMPLATES.vipExpiryToday;
    } else if (daysRemaining === -7) {
      template = NOTIFICATION_TEMPLATES.vipExpired7Days;
    } else {
      return; // 不发送其他天数的提醒
    }

    await this.sendNotification({
      userId,
      title: template.title,
      content: template.content,
      type: NotificationType.VIP_EXPIRY,
      linkUrl: template.linkUrl,
    });
  }

  /**
   * 发送支付成功通知
   */
  async sendPaymentSuccessNotification(
    userId: string,
    orderNo: string,
    packageName: string,
    expireAt: Date | null
  ): Promise<void> {
    const expireText = expireAt
      ? `到期时间：${expireAt.toLocaleDateString('zh-CN')}`
      : '终身有效';

    await this.sendNotification({
      userId,
      title: NOTIFICATION_TEMPLATES.paymentSuccess.title,
      content: `恭喜您成功开通${packageName}！${expireText}。现在可以享受VIP专属下载权益了。`,
      type: NotificationType.PAYMENT_SUCCESS,
      linkUrl: `/user/orders/${orderNo}`,
    });
  }

  /**
   * 发送退款通知
   */
  async sendRefundNotification(
    userId: string,
    orderNo: string,
    status: 'approved' | 'rejected' | 'success'
  ): Promise<void> {
    let template;

    switch (status) {
      case 'approved':
        template = NOTIFICATION_TEMPLATES.refundApproved;
        break;
      case 'rejected':
        template = NOTIFICATION_TEMPLATES.refundRejected;
        break;
      case 'success':
        template = NOTIFICATION_TEMPLATES.refundSuccess;
        break;
      default:
        return;
    }

    await this.sendNotification({
      userId,
      title: template.title,
      content: template.content,
      type: NotificationType.REFUND_STATUS,
      linkUrl: `/user/orders/${orderNo}`,
    });
  }

  /**
   * 批量发送VIP到期提醒（定时任务调用）
   */
  async batchSendExpiryReminders(): Promise<{
    sent3Days: number;
    sent1Day: number;
    sentToday: number;
    sent7DaysExpired: number;
  }> {
    const results = {
      sent3Days: 0,
      sent1Day: 0,
      sentToday: 0,
      sent7DaysExpired: 0,
    };

    // 3天后到期
    const users3Days = await enhancedVipService.getExpiringUsers(3);
    for (const user of users3Days) {
      try {
        await this.sendVipExpiryReminder(user.userId, 3);
        results.sent3Days++;
      } catch (error) {
        logger.error(`发送3天到期提醒失败: ${user.userId}`, error);
      }
    }

    // 1天后到期
    const users1Day = await enhancedVipService.getExpiringUsers(1);
    for (const user of users1Day) {
      try {
        await this.sendVipExpiryReminder(user.userId, 1);
        results.sent1Day++;
      } catch (error) {
        logger.error(`发送1天到期提醒失败: ${user.userId}`, error);
      }
    }

    // 今天到期
    const usersToday = await enhancedVipService.getExpiringUsers(0);
    for (const user of usersToday) {
      try {
        await this.sendVipExpiryReminder(user.userId, 0);
        results.sentToday++;
      } catch (error) {
        logger.error(`发送今日到期提醒失败: ${user.userId}`, error);
      }
    }

    // 已过期7天
    const usersExpired7Days = await enhancedVipService.getExpiredUsers(7);
    for (const user of usersExpired7Days) {
      try {
        await this.sendVipExpiryReminder(user.userId, -7);
        results.sent7DaysExpired++;
      } catch (error) {
        logger.error(`发送7天过期提醒失败: ${user.userId}`, error);
      }
    }

    logger.info(`批量发送VIP到期提醒完成: 3天(${results.sent3Days}), 1天(${results.sent1Day}), 今天(${results.sentToday}), 7天过期(${results.sent7DaysExpired})`);

    return results;
  }

  /**
   * 获取用户通知列表
   */
  async getUserNotifications(
    userId: string,
    options: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}
  ) {
    const { page = 1, pageSize = 20, unreadOnly = false } = options;

    const where: any = { user_id: userId };
    if (unreadOnly) {
      where.is_read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notifications.count({ where }),
      prisma.notifications.count({ where: { user_id: userId, is_read: false } }),
    ]);

    return {
      list: notifications.map(n => ({
        notificationId: n.notification_id,
        title: n.title,
        content: n.content,
        type: n.type,
        linkUrl: n.link_url,
        isRead: n.is_read,
        readAt: n.read_at,
        createdAt: n.created_at,
      })),
      total,
      unreadCount,
      page,
      pageSize,
    };
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await prisma.notifications.updateMany({
      where: {
        notification_id: notificationId,
        user_id: userId,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return result.count;
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notifications.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  /**
   * 删除通知
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    await prisma.notifications.deleteMany({
      where: {
        notification_id: notificationId,
        user_id: userId,
      },
    });
  }

  /**
   * 清理过期通知
   */
  async cleanupOldNotifications(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.notifications.deleteMany({
      where: {
        created_at: { lt: cutoffDate },
        is_read: true,
      },
    });

    if (result.count > 0) {
      logger.info(`清理过期通知: ${result.count} 条`);
    }

    return result.count;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
