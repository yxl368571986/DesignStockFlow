/**
 * 订单对账定时任务
 * 每5分钟执行一次，同步待对账订单状态
 */

import cron, { ScheduledTask } from 'node-cron';
import { reconciliationService } from '../services/reconciliation/reconciliationService.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 60000; // 1分钟

/**
 * 执行对账任务（带重试）
 */
async function executeReconciliation(retryCount = 0): Promise<void> {
  try {
    logger.info(`[对账任务] 开始执行，第 ${retryCount + 1} 次尝试`);

    const result = await reconciliationService.runReconciliation();

    logger.info(`[对账任务] 执行完成`, {
      totalChecked: result.totalChecked,
      synced: result.synced,
      cancelled: result.cancelled,
      errors: result.errors.length,
    });

    if (result.errors.length > 0) {
      logger.warn(`[对账任务] 部分订单对账失败: ${result.errors.length} 个`);
    }
  } catch (error) {
    logger.error(`[对账任务] 执行失败:`, error);

    // 重试逻辑
    if (retryCount < MAX_RETRIES - 1) {
      logger.info(`[对账任务] ${RETRY_INTERVAL / 1000}秒后重试...`);
      setTimeout(() => {
        executeReconciliation(retryCount + 1);
      }, RETRY_INTERVAL);
    } else {
      logger.error(`[对账任务] 已达到最大重试次数(${MAX_RETRIES})，放弃本次对账`);
      // 可以在这里发送告警通知
    }
  }
}

/**
 * 启动对账定时任务
 * 每5分钟执行一次
 */
export function startReconciliationTask(): ScheduledTask {
  const task = cron.schedule('*/5 * * * *', () => {
    executeReconciliation();
  });

  logger.info('[对账任务] 定时任务已启动，每5分钟执行一次');
  return task;
}

/**
 * 手动触发对账（用于测试或紧急情况）
 */
export async function triggerReconciliation(): Promise<void> {
  await executeReconciliation();
}

export default { startReconciliationTask, triggerReconciliation };
