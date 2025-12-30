/**
 * 积分有效期服务
 * 
 * 实现积分有效期管理功能
 * 
 * 需求: 11.1, 11.2, 11.3, 11.4
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';
import * as notificationService from './notificationService.js';

const prisma = new PrismaClient();

/**
 * 积分有效期配置（月数）
 */
export const POINTS_VALIDITY_MONTHS = 12;

/**
 * 过期提醒天数
 */
export const EXPIRY_REMINDER_DAYS = 30;

/**
 * 计算积分过期时间
 * 
 * 需求: 11.1 - 积分获取时间 + 12个月
 */
export function calculateExpireDate(acquiredAt: Date): Date {
  const expireDate = new Date(acquiredAt);
  expireDate.setMonth(expireDate.getMonth() + POINTS_VALIDITY_MONTHS);
  return expireDate;
}

/**
 * 检查积分是否已过期
 */
export function isPointsExpired(expireAt: Date): boolean {
  return new Date() > expireAt;
}

/**
 * 检查积分是否即将过期（30天内）
 */
export function isPointsExpiringSoon(expireAt: Date): boolean {
  const now = new Date();
  const reminderDate = new Date(expireAt);
  reminderDate.setDate(reminderDate.getDate() - EXPIRY_REMINDER_DAYS);
  return now >= reminderDate && now < expireAt;
}

/**
 * 获取即将过期的积分
 * 
 * 需求: 11.3 - 获取30天内即将过期的积分
 */
export async function getExpiringPoints(
  userId: string,
  daysUntilExpiry: number = EXPIRY_REMINDER_DAYS
): Promise<{
  totalExpiringPoints: number;
  records: Array<{
    recordId: string;
    pointsChange: number;
    acquiredAt: Date;
    expireAt: Date;
    daysUntilExpiry: number;
    source: string;
    description: string | null;
  }>;
}> {
  const now = new Date();
  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() + daysUntilExpiry);

  const records = await prisma.points_records.findMany({
    where: {
      user_id: userId,
      points_change: { gt: 0 }, // 只查询获得的积分
      is_expired: false,
      expire_at: {
        gt: now,
        lte: expiryThreshold,
      },
    },
    orderBy: { expire_at: 'asc' },
  });

  const mappedRecords = records.map(record => {
    const expireAt = record.expire_at || new Date();
    const daysLeft = Math.ceil(
      (expireAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      recordId: record.record_id,
      pointsChange: record.points_change,
      acquiredAt: record.acquired_at || record.created_at,
      expireAt,
      daysUntilExpiry: Math.max(0, daysLeft),
      source: record.source,
      description: record.description,
    };
  });

  const totalExpiringPoints = mappedRecords.reduce(
    (sum, r) => sum + r.pointsChange,
    0
  );

  return {
    totalExpiringPoints,
    records: mappedRecords,
  };
}

/**
 * 获取积分有效期明细
 * 
 * 需求: 11.2 - 显示各批次积分的获取时间和过期时间
 */
export async function getPointsExpiryDetails(
  userId: string,
  options: {
    page?: number;
    pageSize?: number;
    includeExpired?: boolean;
  } = {}
): Promise<{
  list: Array<{
    recordId: string;
    pointsChange: number;
    acquiredAt: Date;
    expireAt: Date | null;
    isExpired: boolean;
    isExpiringSoon: boolean;
    daysUntilExpiry: number | null;
    source: string;
    description: string | null;
  }>;
  total: number;
  pageNum: number;
  pageSize: number;
  summary: {
    totalActivePoints: number;
    totalExpiringPoints: number;
    totalExpiredPoints: number;
  };
}> {
  const { page = 1, pageSize = 20, includeExpired = false } = options;
  const now = new Date();

  const where: Record<string, unknown> = {
    user_id: userId,
    points_change: { gt: 0 }, // 只查询获得的积分
  };

  if (!includeExpired) {
    where.is_expired = false;
  }

  const [records, total] = await Promise.all([
    prisma.points_records.findMany({
      where,
      orderBy: { expire_at: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.points_records.count({ where }),
  ]);

  // 计算汇总信息
  const allRecords = await prisma.points_records.findMany({
    where: {
      user_id: userId,
      points_change: { gt: 0 },
    },
  });

  let totalActivePoints = 0;
  let totalExpiringPoints = 0;
  let totalExpiredPoints = 0;

  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() + EXPIRY_REMINDER_DAYS);

  for (const record of allRecords) {
    if (record.is_expired) {
      totalExpiredPoints += record.points_change;
    } else if (record.expire_at && record.expire_at <= expiryThreshold) {
      totalExpiringPoints += record.points_change;
      totalActivePoints += record.points_change;
    } else {
      totalActivePoints += record.points_change;
    }
  }

  const list = records.map(record => {
    const expireAt = record.expire_at;
    const isExpired = record.is_expired || (expireAt ? now > expireAt : false);
    const isExpiringSoon = expireAt ? isPointsExpiringSoon(expireAt) : false;
    const daysUntilExpiry = expireAt
      ? Math.max(0, Math.ceil((expireAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    return {
      recordId: record.record_id,
      pointsChange: record.points_change,
      acquiredAt: record.acquired_at || record.created_at,
      expireAt,
      isExpired,
      isExpiringSoon,
      daysUntilExpiry: isExpired ? null : daysUntilExpiry,
      source: record.source,
      description: record.description,
    };
  });

  return {
    list,
    total,
    pageNum: page,
    pageSize,
    summary: {
      totalActivePoints,
      totalExpiringPoints,
      totalExpiredPoints,
    },
  };
}

/**
 * 处理过期积分
 * 
 * 需求: 11.4 - 定时任务处理过期积分
 */
export async function processExpiredPoints(): Promise<{
  processedCount: number;
  totalExpiredPoints: number;
  affectedUsers: string[];
}> {
  const now = new Date();

  // 查找所有已过期但未标记的积分记录
  const expiredRecords = await prisma.points_records.findMany({
    where: {
      points_change: { gt: 0 },
      is_expired: false,
      expire_at: { lte: now },
    },
  });

  if (expiredRecords.length === 0) {
    return {
      processedCount: 0,
      totalExpiredPoints: 0,
      affectedUsers: [],
    };
  }

  // 按用户分组
  const userExpiredPoints = new Map<string, number>();
  for (const record of expiredRecords) {
    if (!record.user_id) continue; // 跳过没有用户ID的记录
    const current = userExpiredPoints.get(record.user_id) || 0;
    userExpiredPoints.set(record.user_id, current + record.points_change);
  }

  // 批量更新过期标记
  const recordIds = expiredRecords.map(r => r.record_id);
  await prisma.points_records.updateMany({
    where: { record_id: { in: recordIds } },
    data: { is_expired: true },
  });

  // 扣除用户积分余额
  for (const [userId, expiredPoints] of userExpiredPoints) {
    await prisma.users.update({
      where: { user_id: userId },
      data: {
        points_balance: { decrement: expiredPoints },
      },
    });

    // 记录积分过期
    await prisma.points_records.create({
      data: {
        user_id: userId,
        points_change: -expiredPoints,
        points_balance: 0, // 将在后续更新
        change_type: 'expire',
        source: 'points_expiry',
        description: `${expiredPoints} 积分已过期`,
      },
    });

    logger.info(`用户 ${userId} 有 ${expiredPoints} 积分过期`);
  }

  const totalExpiredPoints = Array.from(userExpiredPoints.values()).reduce(
    (sum, points) => sum + points,
    0
  );

  return {
    processedCount: expiredRecords.length,
    totalExpiredPoints,
    affectedUsers: Array.from(userExpiredPoints.keys()),
  };
}

/**
 * 发送过期提醒
 * 
 * 需求: 11.3 - 发送积分过期提醒通知
 */
export async function sendExpiryReminders(): Promise<{
  sentCount: number;
  users: string[];
}> {
  const now = new Date();
  const reminderThreshold = new Date();
  reminderThreshold.setDate(reminderThreshold.getDate() + EXPIRY_REMINDER_DAYS);

  // 查找有即将过期积分的用户
  const usersWithExpiringPoints = await prisma.points_records.groupBy({
    by: ['user_id'],
    where: {
      points_change: { gt: 0 },
      is_expired: false,
      expire_at: {
        gt: now,
        lte: reminderThreshold,
      },
    },
    _sum: {
      points_change: true,
    },
  });

  const sentUsers: string[] = [];

  for (const userGroup of usersWithExpiringPoints) {
    const expiringPoints = userGroup._sum.points_change || 0;
    if (expiringPoints <= 0) continue;
    if (!userGroup.user_id) continue; // 跳过没有用户ID的记录

    const userId = userGroup.user_id;

    try {
      await notificationService.sendSystemNotification({
        userId,
        title: '积分即将过期提醒',
        content: `您有 ${expiringPoints} 积分将在30天内过期，请尽快使用！`,
        linkUrl: '/user/points',
      });

      sentUsers.push(userId);
      logger.info(`已发送积分过期提醒给用户 ${userId}，即将过期积分: ${expiringPoints}`);
    } catch (err) {
      logger.warn(`发送积分过期提醒失败: ${userId}`, err);
    }
  }

  return {
    sentCount: sentUsers.length,
    users: sentUsers,
  };
}

/**
 * 获取用户积分过期提醒信息
 * 
 * 用于在用户积分页面显示过期提醒
 */
export async function getUserExpiryReminder(userId: string): Promise<{
  hasExpiringPoints: boolean;
  expiringPoints: number;
  nearestExpiryDate: Date | null;
  daysUntilExpiry: number | null;
}> {
  const expiringInfo = await getExpiringPoints(userId);

  if (expiringInfo.totalExpiringPoints === 0) {
    return {
      hasExpiringPoints: false,
      expiringPoints: 0,
      nearestExpiryDate: null,
      daysUntilExpiry: null,
    };
  }

  const nearestRecord = expiringInfo.records[0];

  return {
    hasExpiringPoints: true,
    expiringPoints: expiringInfo.totalExpiringPoints,
    nearestExpiryDate: nearestRecord.expireAt,
    daysUntilExpiry: nearestRecord.daysUntilExpiry,
  };
}
