import { logger } from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 支付定时任务调度器
 */
export function startPaymentScheduler() {
  // 每10分钟检查一次超时订单
  const interval = 10 * 60 * 1000;

  // 延迟5秒启动，确保数据库连接已建立
  setTimeout(() => {
    checkExpiredOrders();
    setInterval(checkExpiredOrders, interval);
    logger.info('支付定时任务已启动 - 每10分钟检查超时订单');
  }, 5000);
}

/**
 * 检查并取消超时订单
 */
async function checkExpiredOrders() {
  try {
    logger.info('开始检查超时订单...');
    
    // 查找30分钟前创建且未支付的订单
    const expireTime = new Date(Date.now() - 30 * 60 * 1000);
    
    const expiredOrders = await prisma.orders.findMany({
      where: {
        payment_status: 0, // 待支付
        created_at: {
          lt: expireTime,
        },
      },
    });

    if (expiredOrders.length > 0) {
      // 批量更新为已取消状态
      await prisma.orders.updateMany({
        where: {
          order_id: {
            in: expiredOrders.map(o => o.order_id),
          },
        },
        data: {
          payment_status: 2, // 已取消
          updated_at: new Date(),
        },
      });

      logger.info(`已取消 ${expiredOrders.length} 个超时订单`);
    } else {
      logger.info('没有超时订单需要取消');
    }
  } catch (error: any) {
    logger.error('取消超时订单失败:', {
      message: error?.message || '未知错误',
      stack: error?.stack
    });
  }
}
