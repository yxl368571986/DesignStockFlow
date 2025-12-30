/**
 * 定价优化通知任务
 * 
 * 需求: 9.7
 * - 21.2 发送老资源定价优化通知
 * - 向所有上传者发送站内信
 * - 通知「老资源定价优化通道已开启」
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';
import * as notificationService from '@/services/notificationService.js';

const prisma = new PrismaClient();

/**
 * 发送老资源定价优化通知
 * 
 * 需求: 9.7 - 向所有上传者发送站内信
 */
export async function sendPricingOptimizationNotification(): Promise<{
  success: boolean;
  sentCount: number;
  failedCount: number;
  users: string[];
  error?: string;
}> {
  logger.info('[定价优化通知] 开始发送老资源定价优化通知...');
  
  try {
    // 查找所有有上传资源的用户
    const uploaders = await prisma.resources.groupBy({
      by: ['user_id'],
      where: {
        user_id: { not: null },
      },
    });

    const sentUsers: string[] = [];
    let failedCount = 0;

    for (const uploader of uploaders) {
      if (!uploader.user_id) continue;

      try {
        await notificationService.sendSystemNotification({
          userId: uploader.user_id,
          title: '老资源定价优化通道已开启',
          content: `亲爱的创作者，您好！

我们很高兴地通知您，平台已开启老资源定价优化功能。您现在可以为之前上传的免费资源设置积分定价，让您的优质作品获得更多收益。

主要功能：
• 为老资源设置付费积分定价（5-100积分，5的倍数）
• 设置VIP专属资源
• 每次被下载可获得收益分成

立即前往「我的作品」页面，为您的作品设置合适的定价吧！

如有任何问题，请联系客服。

祝创作愉快！
平台运营团队`,
          linkUrl: '/user/works',
        });

        sentUsers.push(uploader.user_id);
        logger.info(`[定价优化通知] 已发送给用户: ${uploader.user_id}`);
      } catch (err) {
        failedCount++;
        logger.warn(`[定价优化通知] 发送失败: ${uploader.user_id}`, err);
      }
    }

    logger.info(
      `[定价优化通知] 完成，成功发送 ${sentUsers.length} 条，失败 ${failedCount} 条`
    );

    return {
      success: true,
      sentCount: sentUsers.length,
      failedCount,
      users: sentUsers,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[定价优化通知] 执行失败:', error);

    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      users: [],
      error: errorMessage,
    };
  }
}

/**
 * 发送定价调整通知给特定用户
 * 
 * 需求: 6.5 - 定价调整后通知上传者
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
}): Promise<boolean> {
  const {
    userId,
    resourceTitle,
    oldPricingType,
    newPricingType,
    oldPointsCost,
    newPointsCost,
    reason,
  } = params;

  const getPricingText = (type: number, points: number): string => {
    if (type === 0) return '免费';
    if (type === 1) return `${points}积分`;
    if (type === 2) return 'VIP专属';
    return '未知';
  };

  const oldText = getPricingText(oldPricingType, oldPointsCost);
  const newText = getPricingText(newPricingType, newPointsCost);

  try {
    await notificationService.sendSystemNotification({
      userId,
      title: '您的作品定价已被调整',
      content: `您的作品「${resourceTitle}」定价已被审核员调整。

调整详情：
• 原定价：${oldText}
• 新定价：${newText}
• 调整原因：${reason}

如有疑问，请联系客服。`,
      linkUrl: '/user/works',
    });

    logger.info(`[定价调整通知] 已发送给用户: ${userId}`);
    return true;
  } catch (error) {
    logger.error(`[定价调整通知] 发送失败: ${userId}`, error);
    return false;
  }
}
