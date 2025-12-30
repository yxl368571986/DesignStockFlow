/**
 * 积分兑换服务扩展
 * 
 * 实现兑换审计日志和回滚功能
 * 
 * 需求: 10.4, 10.6, 10.9
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';
import * as notificationService from './notificationService.js';

const prisma = new PrismaClient();

/**
 * 兑换状态枚举
 */
export enum ExchangeStatus {
  PENDING = 'pending',      // 待处理
  PROCESSING = 'processing', // 处理中
  SUCCESS = 'success',      // 成功
  FAILED = 'failed',        // 失败
  REFUNDED = 'refunded',    // 已退款
}

/**
 * 兑换审计信息
 */
export interface ExchangeAuditInfo {
  ipAddress: string;
  deviceInfo?: string;
  userAgent?: string;
}

/**
 * 兑换结果
 */
export interface ExchangeResult {
  success: boolean;
  exchangeId?: string;
  productName?: string;
  pointsCost?: number;
  pointsBalance?: number;
  error?: string;
}

/**
 * 执行积分兑换（带审计日志）
 * 
 * 需求: 10.4, 10.9
 */
export async function exchangePoints(
  userId: string,
  productId: string,
  auditInfo: ExchangeAuditInfo,
  deliveryAddress?: string
): Promise<ExchangeResult> {
  // 1. 获取商品信息
  const product = await prisma.points_products.findUnique({
    where: { product_id: productId },
  });

  if (!product) {
    return { success: false, error: '商品不存在' };
  }

  if (product.status !== 1) {
    return { success: false, error: '商品已下架' };
  }

  if (product.stock !== -1 && product.stock <= 0) {
    return { success: false, error: '商品库存不足' };
  }

  // 2. 获取用户信息
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { points_balance: true },
  });

  if (!user) {
    return { success: false, error: '用户不存在' };
  }

  if (user.points_balance < product.points_required) {
    return { success: false, error: '积分不足' };
  }

  try {
    // 3. 扣除积分
    const newBalance = user.points_balance - product.points_required;
    await prisma.users.update({
      where: { user_id: userId },
      data: {
        points_balance: newBalance,
        updated_at: new Date(),
      },
    });

    // 4. 记录积分消耗
    await prisma.points_records.create({
      data: {
        user_id: userId,
        points_change: -product.points_required,
        points_balance: newBalance,
        change_type: 'exchange',
        source: 'points_exchange',
        source_id: productId,
        description: `兑换商品: ${product.product_name}`,
      },
    });

    // 5. 创建兑换记录（带审计信息）
    const exchange = await prisma.points_exchange_records.create({
      data: {
        user_id: userId,
        product_id: productId,
        product_name: product.product_name,
        product_type: product.product_type,
        points_cost: product.points_required,
        delivery_status: 0,
        delivery_address: deliveryAddress,
        ip_address: auditInfo.ipAddress,
        device_info: auditInfo.deviceInfo || auditInfo.userAgent,
        exchange_status: ExchangeStatus.SUCCESS,
      },
    });

    // 6. 更新库存
    if (product.stock !== -1) {
      await prisma.points_products.update({
        where: { product_id: productId },
        data: {
          stock: { decrement: 1 },
          updated_at: new Date(),
        },
      });
    }

    logger.info(`用户 ${userId} 兑换商品 ${product.product_name}，消耗 ${product.points_required} 积分，IP: ${auditInfo.ipAddress}`);

    // 7. 发送兑换成功通知
    try {
      await notificationService.sendSystemNotification({
        userId,
        title: '兑换成功',
        content: `您已成功兑换「${product.product_name}」，消耗 ${product.points_required} 积分`,
        linkUrl: `/user/exchange/${exchange.exchange_id}`,
      });
    } catch (notifyErr) {
      logger.warn(`发送兑换通知失败: ${notifyErr}`);
    }

    return {
      success: true,
      exchangeId: exchange.exchange_id,
      productName: product.product_name,
      pointsCost: product.points_required,
      pointsBalance: newBalance,
    };
  } catch (err) {
    logger.error(`兑换失败: ${err}`);
    return { success: false, error: '兑换失败，请稍后重试' };
  }
}

/**
 * 兑换失败回滚
 * 
 * 需求: 10.6
 */
export async function rollbackExchange(
  exchangeId: string,
  reason: string,
  _operatorId?: string
): Promise<{
  success: boolean;
  refundedPoints?: number;
  error?: string;
}> {
  // 1. 获取兑换记录
  const exchange = await prisma.points_exchange_records.findUnique({
    where: { exchange_id: exchangeId },
  });

  if (!exchange) {
    return { success: false, error: '兑换记录不存在' };
  }

  // 检查是否可以回滚
  if (exchange.exchange_status === ExchangeStatus.REFUNDED) {
    return { success: false, error: '该兑换已退款' };
  }

  if (exchange.exchange_status === ExchangeStatus.SUCCESS && exchange.delivery_status === 2) {
    return { success: false, error: '已完成的兑换不能退款' };
  }

  // 检查 user_id 和 product_id 是否存在
  if (!exchange.user_id) {
    return { success: false, error: '兑换记录用户信息缺失' };
  }

  if (!exchange.product_id) {
    return { success: false, error: '兑换记录商品信息缺失' };
  }

  const exchangeUserId = exchange.user_id;
  const exchangeProductId = exchange.product_id;

  try {
    // 2. 退还积分
    const user = await prisma.users.findUnique({
      where: { user_id: exchangeUserId },
      select: { points_balance: true },
    });

    if (!user) {
      return { success: false, error: '用户不存在' };
    }

    const newBalance = user.points_balance + exchange.points_cost;
    await prisma.users.update({
      where: { user_id: exchangeUserId },
      data: {
        points_balance: newBalance,
        updated_at: new Date(),
      },
    });

    // 3. 记录积分退还
    await prisma.points_records.create({
      data: {
        user_id: exchangeUserId,
        points_change: exchange.points_cost,
        points_balance: newBalance,
        change_type: 'refund',
        source: 'exchange_refund',
        source_id: exchangeId,
        description: `兑换退款: ${exchange.product_name}，原因: ${reason}`,
      },
    });

    // 4. 更新兑换记录状态
    await prisma.points_exchange_records.update({
      where: { exchange_id: exchangeId },
      data: {
        exchange_status: ExchangeStatus.REFUNDED,
        refund_reason: reason,
        refunded_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 5. 恢复库存
    const product = await prisma.points_products.findUnique({
      where: { product_id: exchangeProductId },
    });

    if (product && product.stock !== -1) {
      await prisma.points_products.update({
        where: { product_id: exchangeProductId },
        data: {
          stock: { increment: 1 },
          updated_at: new Date(),
        },
      });
    }

    logger.info(`兑换 ${exchangeId} 已退款，退还 ${exchange.points_cost} 积分，原因: ${reason}`);

    // 6. 发送退款通知
    if (exchangeUserId) {
      try {
        await notificationService.sendSystemNotification({
          userId: exchangeUserId,
          title: '兑换退款通知',
          content: `您的兑换「${exchange.product_name}」已退款，${exchange.points_cost} 积分已退还。原因: ${reason}`,
          linkUrl: `/user/exchange/${exchangeId}`,
        });
      } catch (notifyErr) {
        logger.warn(`发送退款通知失败: ${notifyErr}`);
      }
    }

    return {
      success: true,
      refundedPoints: exchange.points_cost,
    };
  } catch (err) {
    logger.error(`兑换回滚失败: ${err}`);
    return { success: false, error: '退款失败，请稍后重试' };
  }
}

/**
 * 获取兑换审计日志
 * 
 * 需求: 10.9
 */
export async function getExchangeAuditLogs(options: {
  page?: number;
  pageSize?: number;
  userId?: string;
  exchangeStatus?: ExchangeStatus;
  startDate?: Date;
  endDate?: Date;
} = {}): Promise<{
  list: Array<{
    exchangeId: string;
    userId: string | null;
    userName?: string;
    productName: string;
    productType: string;
    pointsCost: number;
    exchangeStatus: ExchangeStatus;
    deliveryStatus: number;
    ipAddress: string | null;
    deviceInfo: string | null;
    refundReason: string | null;
    refundedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  pageNum: number;
  pageSize: number;
}> {
  const { page = 1, pageSize = 20, userId, exchangeStatus, startDate, endDate } = options;

  const where: Record<string, unknown> = {};

  if (userId) {
    where.user_id = userId;
  }

  if (exchangeStatus !== undefined) {
    where.exchange_status = exchangeStatus;
  }

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      (where.created_at as Record<string, Date>).gte = startDate;
    }
    if (endDate) {
      (where.created_at as Record<string, Date>).lte = endDate;
    }
  }

  const [records, total] = await Promise.all([
    prisma.points_exchange_records.findMany({
      where,
      include: {
        users: {
          select: {
            nickname: true,
            phone: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.points_exchange_records.count({ where }),
  ]);

  return {
    list: records.map(record => ({
      exchangeId: record.exchange_id,
      userId: record.user_id,
      userName: record.users?.nickname || record.users?.phone,
      productName: record.product_name,
      productType: record.product_type,
      pointsCost: record.points_cost,
      exchangeStatus: (record.exchange_status || ExchangeStatus.PENDING) as ExchangeStatus,
      deliveryStatus: record.delivery_status,
      ipAddress: record.ip_address,
      deviceInfo: record.device_info,
      refundReason: record.refund_reason,
      refundedAt: record.refunded_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    })),
    total,
    pageNum: page,
    pageSize,
  };
}

/**
 * 更新兑换状态
 */
export async function updateExchangeStatus(
  exchangeId: string,
  status: ExchangeStatus,
  _operatorId?: string
): Promise<{ success: boolean; error?: string }> {
  const exchange = await prisma.points_exchange_records.findUnique({
    where: { exchange_id: exchangeId },
  });

  if (!exchange) {
    return { success: false, error: '兑换记录不存在' };
  }

  await prisma.points_exchange_records.update({
    where: { exchange_id: exchangeId },
    data: {
      exchange_status: status,
      updated_at: new Date(),
    },
  });

  logger.info(`兑换 ${exchangeId} 状态更新为 ${status}`);

  return { success: true };
}
