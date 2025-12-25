/**
 * VIP到期提醒定时任务
 * 每日9点执行，发送VIP到期提醒
 */

import cron, { ScheduledTask } from 'node-cron';
import { notificationService } from '../services/notification/notificationService.js';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

interface UserExpiry {
  userId: string;
  expireAt: Date;
}

async function getUsersToRemind(): Promise<{
  threeDays: UserExpiry[];
  oneDay: UserExpiry[];
  today: UserExpiry[];
  expired: UserExpiry[];
}> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const twoDaysLater = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
  const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fourDaysLater = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const threeDaysUsers = await prisma.users.findMany({
    where: { vip_level: { gt: 0 }, vip_expire_at: { gte: threeDaysLater, lt: fourDaysLater }, is_lifetime_vip: false },
    select: { user_id: true, vip_expire_at: true },
  });

  const oneDayUsers = await prisma.users.findMany({
    where: { vip_level: { gt: 0 }, vip_expire_at: { gte: tomorrow, lt: twoDaysLater }, is_lifetime_vip: false },
    select: { user_id: true, vip_expire_at: true },
  });

  const todayUsers = await prisma.users.findMany({
    where: { vip_level: { gt: 0 }, vip_expire_at: { gte: today, lt: tomorrow }, is_lifetime_vip: false },
    select: { user_id: true, vip_expire_at: true },
  });

  const expiredUsers = await prisma.users.findMany({
    where: { vip_level: { gt: 0 }, vip_expire_at: { gte: sevenDaysAgo, lt: today }, is_lifetime_vip: false },
    select: { user_id: true, vip_expire_at: true },
  });

  return {
    threeDays: threeDaysUsers.map((u) => ({ userId: u.user_id, expireAt: u.vip_expire_at! })),
    oneDay: oneDayUsers.map((u) => ({ userId: u.user_id, expireAt: u.vip_expire_at! })),
    today: todayUsers.map((u) => ({ userId: u.user_id, expireAt: u.vip_expire_at! })),
    expired: expiredUsers.map((u) => ({ userId: u.user_id, expireAt: u.vip_expire_at! })),
  };
}

async function executeVipReminder(): Promise<void> {
  try {
    logger.info('[VIP提醒任务] 开始执行');
    const users = await getUsersToRemind();
    let sentCount = 0;

    for (const user of users.threeDays) { await notificationService.sendVipExpiryReminder(user.userId, 3); sentCount++; }
    for (const user of users.oneDay) { await notificationService.sendVipExpiryReminder(user.userId, 1); sentCount++; }
    for (const user of users.today) { await notificationService.sendVipExpiryReminder(user.userId, 0); sentCount++; }
    for (const user of users.expired) {
      const daysExpired = Math.floor((Date.now() - user.expireAt.getTime()) / (24 * 60 * 60 * 1000));
      await notificationService.sendVipExpiryReminder(user.userId, -daysExpired);
      sentCount++;
    }

    logger.info('[VIP提醒任务] 执行完成，共发送 ' + sentCount + ' 条提醒');
  } catch (error) {
    logger.error('[VIP提醒任务] 执行失败:', error);
  }
}

export function startVipReminderTask(): ScheduledTask {
  const task = cron.schedule('0 9 * * *', () => { executeVipReminder(); });
  logger.info('[VIP提醒任务] 定时任务已启动，每日9点执行');
  return task;
}

export async function triggerVipReminder(): Promise<void> {
  await executeVipReminder();
}

export default { startVipReminderTask, triggerVipReminder };
