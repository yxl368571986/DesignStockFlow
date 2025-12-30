/**
 * 充值订单定时任务
 * 处理订单超时取消和对账
 */

import cron, { ScheduledTask } from 'node-cron';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// 订单超时时间（30分钟）
const ORDER_TIMEOUT_MINUTES = 30;

/**
 * 取消超时订单
 * 取消超过30分钟未支付的订单
 */
export async function cancelExpiredRechargeOrders(): Promise<{
  cancelledCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let cancelledCount = 0;

  try {
    const expireTime = new Date();
    expireTime.setMinutes(expireTime.getMinutes() - ORDER_TIMEOUT_MINUTES);

    // 查找超时的待支付订单
    const expiredOrders = await prisma.recharge_orders.findMany({
      where: {
        payment_status: 0, // 待支付
        created_at: {
          lt: expireTime
        }
      },
      select: {
        order_id: true,
        order_no: true,
        user_id: true,
        amount: true
      }
    });

    if (expiredOrders.length === 0) {
      logger.debug('[RechargeOrderTask] 没有超时订单需要取消');
      return { cancelledCount: 0, errors: [] };
    }

    logger.info(`[RechargeOrderTask] 发现 ${expiredOrders.length} 个超时订单`);

    // 批量取消订单
    for (const order of expiredOrders) {
      try {
        await prisma.recharge_orders.update({
          where: { order_id: order.order_id },
          data: {
            payment_status: 2, // 已取消
            updated_at: new Date()
          }
        });

        cancelledCount++;
        logger.info(`[RechargeOrderTask] 已取消超时订单: ${order.order_no}`);
      } catch (error: any) {
        const errorMsg = `取消订单 ${order.order_no} 失败: ${error.message}`;
        errors.push(errorMsg);
        logger.error(`[RechargeOrderTask] ${errorMsg}`);
      }
    }

    logger.info(`[RechargeOrderTask] 完成超时订单取消，成功: ${cancelledCount}，失败: ${errors.length}`);
  } catch (error: any) {
    const errorMsg = `执行超时订单取消任务失败: ${error.message}`;
    errors.push(errorMsg);
    logger.error(`[RechargeOrderTask] ${errorMsg}`);
  }

  return { cancelledCount, errors };
}

/**
 * 执行对账任务
 * 检查订单状态与支付平台是否一致
 */
export async function reconcileRechargeOrders(): Promise<{
  checkedCount: number;
  fixedCount: number;
  anomalousCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let checkedCount = 0;
  let fixedCount = 0;
  let anomalousCount = 0;

  try {
    // 查找需要对账的订单（待支付且未过期）
    const pendingOrders = await prisma.recharge_orders.findMany({
      where: {
        payment_status: 0, // 待支付
        expire_at: {
          gt: new Date() // 未过期
        }
      },
      select: {
        order_id: true,
        order_no: true,
        user_id: true,
        amount: true,
        payment_method: true,
        transaction_id: true,
        created_at: true
      },
      take: 100 // 每次最多处理100个
    });

    if (pendingOrders.length === 0) {
      logger.debug('[RechargeOrderTask] 没有需要对账的订单');
      return { checkedCount: 0, fixedCount: 0, anomalousCount: 0, errors: [] };
    }

    logger.info(`[RechargeOrderTask] 开始对账，待检查订单: ${pendingOrders.length}`);

    for (const order of pendingOrders) {
      checkedCount++;

      try {
        // 检查是否有回调记录但订单状态未更新
        const callback = await prisma.recharge_callbacks.findFirst({
          where: {
            order_no: order.order_no,
            processed: true
          }
        });

        if (callback) {
          // 有成功的回调但订单状态未更新，需要补单
          logger.warn(`[RechargeOrderTask] 发现异常订单: ${order.order_no}，有回调记录但状态未更新`);
          anomalousCount++;
        }
      } catch (error: any) {
        const errorMsg = `对账订单 ${order.order_no} 失败: ${error.message}`;
        errors.push(errorMsg);
        logger.error(`[RechargeOrderTask] ${errorMsg}`);
      }
    }

    logger.info(`[RechargeOrderTask] 对账完成，检查: ${checkedCount}，修复: ${fixedCount}，异常: ${anomalousCount}`);
  } catch (error: any) {
    const errorMsg = `执行对账任务失败: ${error.message}`;
    errors.push(errorMsg);
    logger.error(`[RechargeOrderTask] ${errorMsg}`);
  }

  return { checkedCount, fixedCount, anomalousCount, errors };
}

/**
 * 启动充值订单超时取消任务
 * 每分钟执行一次
 */
export function startRechargeOrderTask(): ScheduledTask {
  logger.info('[RechargeOrderTask] 启动充值订单超时取消任务（每分钟）');

  return cron.schedule('* * * * *', async () => {
    try {
      await cancelExpiredRechargeOrders();
    } catch (error: any) {
      logger.error(`[RechargeOrderTask] 超时订单取消任务异常: ${error.message}`);
    }
  });
}

/**
 * 启动充值订单对账任务
 * 每10分钟执行一次
 */
export function startRechargeReconciliationTask(): ScheduledTask {
  logger.info('[RechargeOrderTask] 启动充值订单对账任务（每10分钟）');

  return cron.schedule('*/10 * * * *', async () => {
    try {
      await reconcileRechargeOrders();
    } catch (error: any) {
      logger.error(`[RechargeOrderTask] 对账任务异常: ${error.message}`);
    }
  });
}

export default {
  cancelExpiredRechargeOrders,
  reconcileRechargeOrders,
  startRechargeOrderTask,
  startRechargeReconciliationTask
};
