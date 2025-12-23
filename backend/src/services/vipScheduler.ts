/**
 * VIP定时任务调度器
 * 处理VIP到期提醒和自动降级
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

/**
 * 获取即将到期的VIP用户
 */
async function getExpiringVipUsers(days: number) {
  const now = new Date();
  const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return prisma.users.findMany({
    where: {
      vip_level: { gt: 0 },
      vip_expire_at: {
        gte: now,
        lte: targetDate,
      },
    },
    select: {
      user_id: true,
      nickname: true,
      phone: true,
      vip_level: true,
      vip_expire_at: true,
    },
  });
}

/**
 * 处理已过期的VIP用户
 */
async function handleExpiredVip() {
  const now = new Date();
  
  const expiredUsers = await prisma.users.findMany({
    where: {
      vip_level: { gt: 0 },
      vip_expire_at: { lt: now },
    },
    select: {
      user_id: true,
      nickname: true,
      vip_level: true,
    },
  });

  if (expiredUsers.length === 0) {
    return { processed_count: 0, users: [] };
  }

  // 批量更新过期用户的VIP等级
  await prisma.users.updateMany({
    where: {
      user_id: { in: expiredUsers.map(u => u.user_id) },
    },
    data: {
      vip_level: 0,
      updated_at: new Date(),
    },
  });

  return {
    processed_count: expiredUsers.length,
    users: expiredUsers,
  };
}

/**
 * VIP到期提醒任务
 * 每天执行一次，检查即将到期的VIP用户并发送提醒
 */
export async function vipExpirationReminderTask() {
  try {
    logger.info('开始执行VIP到期提醒任务');

    // 查询7天后到期的用户
    const users7Days = await getExpiringVipUsers(7);
    if (users7Days.length > 0) {
      logger.info(`发现 ${users7Days.length} 个用户VIP将在7天后到期`);
      // TODO: 发送到期提醒通知
    }

    // 查询3天后到期的用户
    const users3Days = await getExpiringVipUsers(3);
    if (users3Days.length > 0) {
      logger.info(`发现 ${users3Days.length} 个用户VIP将在3天后到期`);
      // TODO: 发送到期提醒通知
    }

    // 查询1天后到期的用户
    const users1Day = await getExpiringVipUsers(1);
    if (users1Day.length > 0) {
      logger.info(`发现 ${users1Day.length} 个用户VIP将在1天后到期`);
      // TODO: 发送到期提醒通知
    }

    logger.info('VIP到期提醒任务执行完成');
  } catch (error) {
    logger.error('VIP到期提醒任务执行失败:', error);
  }
}

/**
 * VIP到期处理任务
 * 每天执行一次，将已过期的VIP用户降级为普通用户
 */
export async function vipExpirationHandlerTask() {
  try {
    logger.info('开始执行VIP到期处理任务');

    const result = await handleExpiredVip();

    if (result.processed_count > 0) {
      logger.info(`成功处理 ${result.processed_count} 个过期VIP用户`);
      // TODO: 发送VIP到期通知
    } else {
      logger.info('没有需要处理的过期VIP用户');
    }

    logger.info('VIP到期处理任务执行完成');
  } catch (error) {
    logger.error('VIP到期处理任务执行失败:', error);
  }
}

/**
 * 启动VIP定时任务
 */
export function startVipScheduler() {
  // 每天凌晨2点执行VIP到期提醒任务
  const reminderInterval = 24 * 60 * 60 * 1000; // 24小时
  setInterval(vipExpirationReminderTask, reminderInterval);

  // 每天凌晨3点执行VIP到期处理任务
  const handlerInterval = 24 * 60 * 60 * 1000; // 24小时
  setTimeout(() => {
    vipExpirationHandlerTask();
    setInterval(vipExpirationHandlerTask, handlerInterval);
  }, 60 * 60 * 1000); // 延迟1小时后开始

  // 立即执行一次（可选，用于测试）
  if (process.env.NODE_ENV === 'development') {
    logger.info('开发环境：立即执行一次VIP定时任务');
  }

  logger.info('VIP定时任务调度器已启动');
}

/**
 * 手动触发VIP到期提醒任务（用于测试）
 */
export async function triggerVipExpirationReminder() {
  await vipExpirationReminderTask();
}

/**
 * 手动触发VIP到期处理任务（用于测试）
 */
export async function triggerVipExpirationHandler() {
  await vipExpirationHandlerTask();
}
