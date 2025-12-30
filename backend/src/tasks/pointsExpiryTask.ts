/**
 * 积分过期定时任务
 * 
 * 需求: 11.3, 11.4
 * - 19.1 积分过期检测定时任务：每日凌晨2点执行
 * - 19.2 积分过期提醒定时任务：每日上午10点执行
 */

import { logger } from '@/utils/logger.js';
import * as pointsExpiryService from '@/services/pointsExpiryService.js';

/**
 * 执行积分过期检测任务
 * 
 * 需求: 11.4 - 每日凌晨2点执行
 * - 查找并处理过期积分
 * - 发送过期通知
 */
export async function runExpiredPointsTask(): Promise<{
  success: boolean;
  processedCount: number;
  totalExpiredPoints: number;
  affectedUsers: string[];
  error?: string;
}> {
  logger.info('[积分过期任务] 开始执行积分过期检测...');
  
  try {
    const result = await pointsExpiryService.processExpiredPoints();
    
    logger.info(
      `[积分过期任务] 完成，处理了 ${result.processedCount} 条记录，` +
      `共 ${result.totalExpiredPoints} 积分过期，` +
      `影响 ${result.affectedUsers.length} 个用户`
    );
    
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[积分过期任务] 执行失败:', error);
    
    return {
      success: false,
      processedCount: 0,
      totalExpiredPoints: 0,
      affectedUsers: [],
      error: errorMessage,
    };
  }
}

/**
 * 执行积分过期提醒任务
 * 
 * 需求: 11.3 - 每日上午10点执行
 * - 查找30天内即将过期的积分
 * - 发送提醒通知
 */
export async function runExpiryReminderTask(): Promise<{
  success: boolean;
  sentCount: number;
  users: string[];
  error?: string;
}> {
  logger.info('[积分过期提醒任务] 开始执行...');
  
  try {
    const result = await pointsExpiryService.sendExpiryReminders();
    
    logger.info(
      `[积分过期提醒任务] 完成，发送了 ${result.sentCount} 条提醒通知`
    );
    
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[积分过期提醒任务] 执行失败:', error);
    
    return {
      success: false,
      sentCount: 0,
      users: [],
      error: errorMessage,
    };
  }
}

/**
 * 定时任务调度配置
 * 
 * 使用 node-cron 或类似库时的 cron 表达式：
 * - 积分过期检测：'0 2 * * *' (每日凌晨2点)
 * - 积分过期提醒：'0 10 * * *' (每日上午10点)
 */
export const TASK_SCHEDULES = {
  expiredPointsTask: {
    name: '积分过期检测',
    cron: '0 2 * * *',
    description: '每日凌晨2点执行，处理过期积分',
    handler: runExpiredPointsTask,
  },
  expiryReminderTask: {
    name: '积分过期提醒',
    cron: '0 10 * * *',
    description: '每日上午10点执行，发送过期提醒',
    handler: runExpiryReminderTask,
  },
};

/**
 * 手动触发所有积分相关任务（用于测试或手动执行）
 */
export async function runAllPointsTasks(): Promise<{
  expiredPointsResult: Awaited<ReturnType<typeof runExpiredPointsTask>>;
  expiryReminderResult: Awaited<ReturnType<typeof runExpiryReminderTask>>;
}> {
  logger.info('[积分任务] 开始执行所有积分相关任务...');
  
  const expiredPointsResult = await runExpiredPointsTask();
  const expiryReminderResult = await runExpiryReminderTask();
  
  logger.info('[积分任务] 所有任务执行完成');
  
  return {
    expiredPointsResult,
    expiryReminderResult,
  };
}
