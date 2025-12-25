/**
 * 订单超时取消定时任务
 * 每分钟检查超时订单，自动取消15分钟未支付的订单
 */

import cron, { ScheduledTask } from 'node-cron';
import { vipOrderService, OrderStatus } from '../services/order/vipOrderService.js';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();
const ORDER_TIMEOUT_MINUTES = 15;

interface TimeoutOrder {
  orderId: string;
  orderNo: string;
  createdAt: Date;
}

/**
 * 获取超时未支付的订单
 */
async function getTimeoutOrders(): Promise<TimeoutOrder[]> {
  const timeoutThreshold = new Date(Date.now() - ORDER_TIMEOUT_MINUTES * 60 * 1000);

  const orders = await prisma.orders.findMany({
    where: {
      order_type: 'vip',
      payment_status: 0, // 待支付
      created_at: {
        lt: timeoutThreshold,
      },
    },
    select: {
      order_id: true,
      order_no: true,
      created_at: true,
    },
  });

  return orders.map((o: { order_id: string; order_no: string; created_at: Date }) => ({
    orderId: o.order_id,
    orderNo: o.order_no,
    createdAt: o.created_at,
  }));
}

/**
 * 执行订单超时取消任务
 */
async function executeOrderTimeout(): Promise<void> {
  try {
    const timeoutOrders = await getTimeoutOrders();

    if (timeoutOrders.length === 0) {
      return; // 没有超时订单，静默返回
    }

    logger.info(`[订单超时任务] 发现 ${timeoutOrders.length} 个超时订单`);

    let cancelledCount = 0;
    let failedCount = 0;

    for (const order of timeoutOrders) {
      try {
        await vipOrderService.updateOrderStatus(order.orderNo, OrderStatus.CANCELLED);
        
        // 更新取消原因
        await prisma.orders.update({
          where: { order_no: order.orderNo },
          data: {
            cancel_reason: '订单超时自动取消',
            cancelled_at: new Date(),
          },
        });

        cancelledCount++;
        logger.debug(`[订单超时任务] 订单 ${order.orderNo} 已取消`);
      } catch (error) {
        failedCount++;
        logger.error(`[订单超时任务] 取消订单 ${order.orderNo} 失败:`, error);
      }
    }

    logger.info(`[订单超时任务] 执行完成`, {
      total: timeoutOrders.length,
      cancelled: cancelledCount,
      failed: failedCount,
    });
  } catch (error) {
    logger.error('[订单超时任务] 执行失败:', error);
  }
}

/**
 * 启动订单超时取消定时任务
 * 每分钟执行一次
 */
export function startOrderTimeoutTask(): ScheduledTask {
  const task = cron.schedule('* * * * *', () => {
    executeOrderTimeout();
  });

  logger.info('[订单超时任务] 定时任务已启动，每分钟执行一次');
  return task;
}

/**
 * 手动触发订单超时检查（用于测试）
 */
export async function triggerOrderTimeout(): Promise<void> {
  await executeOrderTimeout();
}

export default { startOrderTimeoutTask, triggerOrderTimeout };
