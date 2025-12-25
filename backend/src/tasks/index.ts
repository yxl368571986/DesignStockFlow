/**
 * 定时任务统一注册与启动
 * 在应用启动时初始化所有定时任务
 */

import { ScheduledTask } from 'node-cron';
import { startReconciliationTask } from './reconciliation.js';
import { startVipReminderTask } from './vipReminder.js';
import { startOrderTimeoutTask } from './orderTimeout.js';
import logger from '../utils/logger.js';

interface TaskRegistry {
  reconciliation?: ScheduledTask;
  vipReminder?: ScheduledTask;
  orderTimeout?: ScheduledTask;
}

const tasks: TaskRegistry = {};

/**
 * 启动所有定时任务
 */
export function startAllTasks(): void {
  logger.info('========== 启动定时任务 ==========');

  try {
    // 启动订单对账任务（每5分钟）
    tasks.reconciliation = startReconciliationTask();

    // 启动VIP到期提醒任务（每日9点）
    tasks.vipReminder = startVipReminderTask();

    // 启动订单超时取消任务（每分钟）
    tasks.orderTimeout = startOrderTimeoutTask();

    logger.info('========== 定时任务启动完成 ==========');
  } catch (error) {
    logger.error('定时任务启动失败:', error);
  }
}

/**
 * 停止所有定时任务
 */
export function stopAllTasks(): void {
  logger.info('========== 停止定时任务 ==========');

  if (tasks.reconciliation) {
    tasks.reconciliation.stop();
    logger.info('[对账任务] 已停止');
  }

  if (tasks.vipReminder) {
    tasks.vipReminder.stop();
    logger.info('[VIP提醒任务] 已停止');
  }

  if (tasks.orderTimeout) {
    tasks.orderTimeout.stop();
    logger.info('[订单超时任务] 已停止');
  }

  logger.info('========== 定时任务已全部停止 ==========');
}

/**
 * 获取任务状态
 */
export function getTaskStatus(): Record<string, boolean> {
  return {
    reconciliation: !!tasks.reconciliation,
    vipReminder: !!tasks.vipReminder,
    orderTimeout: !!tasks.orderTimeout,
  };
}

export default {
  startAllTasks,
  stopAllTasks,
  getTaskStatus,
};
