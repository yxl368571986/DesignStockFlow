/**
 * 充值对账服务
 * 提供订单对账、异常检测、自动补单等功能
 */

import prisma from '../../utils/prisma';

// 对账结果
export interface ReconciliationResult {
  totalOrders: number;
  matchedOrders: number;
  mismatchedOrders: number;
  pendingOrders: number;
  autoFixedOrders: number;
  anomalousOrders: AnomalousOrder[];
}

// 异常订单
export interface AnomalousOrder {
  orderId: string;
  orderNo: string;
  userId: string;
  amount: number;
  totalPoints: number;
  paymentStatus: number;
  transactionId?: string;
  anomalyType: AnomalyType;
  anomalyReason: string;
  createdAt: Date;
}

// 异常类型
export enum AnomalyType {
  PAYMENT_TIMEOUT = 'payment_timeout',       // 支付超时未取消
  CALLBACK_MISSING = 'callback_missing',     // 回调缺失
  POINTS_NOT_ISSUED = 'points_not_issued',   // 积分未发放
  DUPLICATE_PAYMENT = 'duplicate_payment',   // 重复支付
  AMOUNT_MISMATCH = 'amount_mismatch',       // 金额不匹配
  STATUS_INCONSISTENT = 'status_inconsistent' // 状态不一致
}

// 对账错误
export class ReconciliationError extends Error {
  constructor(message: string, public code: string = 'RECONCILIATION_ERROR') {
    super(message);
    this.name = 'ReconciliationError';
  }
}

class RechargeReconciliationService {
  /**
   * 执行对账
   */
  async reconcile(startDate: Date, endDate: Date): Promise<ReconciliationResult> {
    const result: ReconciliationResult = {
      totalOrders: 0,
      matchedOrders: 0,
      mismatchedOrders: 0,
      pendingOrders: 0,
      autoFixedOrders: 0,
      anomalousOrders: []
    };

    // 获取时间范围内的所有订单
    const orders = await prisma.recharge_orders.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        users: { select: { user_id: true, nickname: true } }
      }
    });

    result.totalOrders = orders.length;

    for (const order of orders) {
      // 检查订单状态
      if (order.payment_status === 0) {
        // 待支付订单
        if (new Date() > order.expire_at) {
          // 已过期但未取消
          result.anomalousOrders.push({
            orderId: order.order_id,
            orderNo: order.order_no,
            userId: order.user_id,
            amount: Number(order.amount),
            totalPoints: order.total_points,
            paymentStatus: order.payment_status,
            transactionId: order.transaction_id || undefined,
            anomalyType: AnomalyType.PAYMENT_TIMEOUT,
            anomalyReason: '订单已过期但未自动取消',
            createdAt: order.created_at
          });
          result.mismatchedOrders++;
        } else {
          result.pendingOrders++;
        }
      } else if (order.payment_status === 1) {
        // 已支付订单 - 检查积分是否发放
        const pointsRecord = await prisma.points_records.findFirst({
          where: {
            user_id: order.user_id,
            source_id: order.order_id,
            change_type: 'recharge'
          }
        });

        if (!pointsRecord) {
          // 积分未发放
          result.anomalousOrders.push({
            orderId: order.order_id,
            orderNo: order.order_no,
            userId: order.user_id,
            amount: Number(order.amount),
            totalPoints: order.total_points,
            paymentStatus: order.payment_status,
            transactionId: order.transaction_id || undefined,
            anomalyType: AnomalyType.POINTS_NOT_ISSUED,
            anomalyReason: '订单已支付但积分未发放',
            createdAt: order.created_at
          });
          result.mismatchedOrders++;
        } else if (pointsRecord.points_change !== order.total_points) {
          // 积分金额不匹配
          result.anomalousOrders.push({
            orderId: order.order_id,
            orderNo: order.order_no,
            userId: order.user_id,
            amount: Number(order.amount),
            totalPoints: order.total_points,
            paymentStatus: order.payment_status,
            transactionId: order.transaction_id || undefined,
            anomalyType: AnomalyType.AMOUNT_MISMATCH,
            anomalyReason: `积分发放数量不匹配: 应发${order.total_points}, 实发${pointsRecord.points_change}`,
            createdAt: order.created_at
          });
          result.mismatchedOrders++;
        } else {
          result.matchedOrders++;
        }
      } else if (order.payment_status === 2) {
        // 已取消订单 - 正常
        result.matchedOrders++;
      }
    }

    return result;
  }

  /**
   * 查找异常订单
   */
  async findAnomalousOrders(): Promise<AnomalousOrder[]> {
    const anomalousOrders: AnomalousOrder[] = [];

    // 1. 查找过期未取消的订单
    const expiredOrders = await prisma.recharge_orders.findMany({
      where: {
        payment_status: 0,
        expire_at: { lt: new Date() }
      }
    });

    for (const order of expiredOrders) {
      anomalousOrders.push({
        orderId: order.order_id,
        orderNo: order.order_no,
        userId: order.user_id,
        amount: Number(order.amount),
        totalPoints: order.total_points,
        paymentStatus: order.payment_status,
        transactionId: order.transaction_id || undefined,
        anomalyType: AnomalyType.PAYMENT_TIMEOUT,
        anomalyReason: '订单已过期但未自动取消',
        createdAt: order.created_at
      });
    }

    // 2. 查找已支付但积分未发放的订单
    const paidOrders = await prisma.recharge_orders.findMany({
      where: { payment_status: 1 }
    });

    for (const order of paidOrders) {
      const pointsRecord = await prisma.points_records.findFirst({
        where: {
          user_id: order.user_id,
          source_id: order.order_id,
          change_type: 'recharge'
        }
      });

      if (!pointsRecord) {
        anomalousOrders.push({
          orderId: order.order_id,
          orderNo: order.order_no,
          userId: order.user_id,
          amount: Number(order.amount),
          totalPoints: order.total_points,
          paymentStatus: order.payment_status,
          transactionId: order.transaction_id || undefined,
          anomalyType: AnomalyType.POINTS_NOT_ISSUED,
          anomalyReason: '订单已支付但积分未发放',
          createdAt: order.created_at
        });
      }
    }

    return anomalousOrders;
  }

  /**
   * 自动补单 - 为已支付但积分未发放的订单补发积分
   */
  async autoFix(orderId: string): Promise<boolean> {
    return await prisma.$transaction(async (tx) => {
      // 获取订单
      const order = await tx.recharge_orders.findUnique({
        where: { order_id: orderId }
      });

      if (!order) {
        throw new ReconciliationError('订单不存在', 'ORDER_NOT_FOUND');
      }

      if (order.payment_status !== 1) {
        throw new ReconciliationError('只能补单已支付的订单', 'INVALID_ORDER_STATUS');
      }

      // 检查是否已发放积分
      const existingRecord = await tx.points_records.findFirst({
        where: {
          user_id: order.user_id,
          source_id: order.order_id,
          change_type: 'recharge'
        }
      });

      if (existingRecord) {
        throw new ReconciliationError('积分已发放，无需补单', 'POINTS_ALREADY_ISSUED');
      }

      // 获取用户当前积分
      const user = await tx.users.findUnique({
        where: { user_id: order.user_id }
      });

      if (!user) {
        throw new ReconciliationError('用户不存在', 'USER_NOT_FOUND');
      }

      const newBalance = user.points_balance + order.total_points;

      // 更新用户积分
      await tx.users.update({
        where: { user_id: order.user_id },
        data: {
          points_balance: newBalance,
          points_total: { increment: order.total_points },
          updated_at: new Date()
        }
      });

      // 创建积分记录
      await tx.points_records.create({
        data: {
          user_id: order.user_id,
          points_change: order.total_points,
          points_balance: newBalance,
          change_type: 'recharge',
          source: 'recharge_auto_fix',
          source_id: order.order_id,
          description: `充值补单: 订单${order.order_no}，补发${order.total_points}积分`,
          acquired_at: new Date()
        }
      });

      // 发送通知
      await tx.notifications.create({
        data: {
          user_id: order.user_id,
          title: '积分补发通知',
          content: `您的充值订单${order.order_no}积分已补发，到账${order.total_points}积分。`,
          type: 'points_recharge',
          is_read: false
        }
      });

      return true;
    });
  }

  /**
   * 检测重复支付
   */
  async detectDuplicatePayment(transactionId: string): Promise<boolean> {
    // 查找相同transaction_id的回调记录数量
    const callbackCount = await prisma.recharge_callbacks.count({
      where: {
        transaction_id: transactionId,
        processed: true,
        process_result: 'success'
      }
    });

    return callbackCount > 1;
  }

  /**
   * 获取重复支付的订单
   */
  async getDuplicatePaymentOrders(): Promise<AnomalousOrder[]> {
    // 查找有多次成功回调的transaction_id
    const duplicates = await prisma.recharge_callbacks.groupBy({
      by: ['transaction_id'],
      where: {
        processed: true,
        process_result: 'success',
        transaction_id: { not: null }
      },
      having: {
        transaction_id: { _count: { gt: 1 } }
      }
    });

    const anomalousOrders: AnomalousOrder[] = [];

    for (const dup of duplicates) {
      if (!dup.transaction_id) continue;

      const order = await prisma.recharge_orders.findFirst({
        where: { transaction_id: dup.transaction_id }
      });

      if (order) {
        anomalousOrders.push({
          orderId: order.order_id,
          orderNo: order.order_no,
          userId: order.user_id,
          amount: Number(order.amount),
          totalPoints: order.total_points,
          paymentStatus: order.payment_status,
          transactionId: order.transaction_id || undefined,
          anomalyType: AnomalyType.DUPLICATE_PAYMENT,
          anomalyReason: '检测到重复支付回调',
          createdAt: order.created_at
        });
      }
    }

    return anomalousOrders;
  }

  /**
   * 批量取消过期订单
   */
  async cancelExpiredOrders(): Promise<number> {
    const result = await prisma.recharge_orders.updateMany({
      where: {
        payment_status: 0,
        expire_at: { lt: new Date() }
      },
      data: {
        payment_status: 2,
        cancelled_at: new Date(),
        cancel_reason: '订单超时自动取消',
        updated_at: new Date()
      }
    });

    return result.count;
  }

  /**
   * 获取对账统计
   */
  async getReconciliationStats(days: number = 7): Promise<{
    totalOrders: number;
    paidOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    anomalousCount: number;
    totalAmount: number;
    totalPoints: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [stats, anomalous] = await Promise.all([
      prisma.recharge_orders.aggregate({
        where: { created_at: { gte: startDate } },
        _count: { order_id: true },
        _sum: { amount: true, total_points: true }
      }),
      this.findAnomalousOrders()
    ]);

    const statusCounts = await prisma.recharge_orders.groupBy({
      by: ['payment_status'],
      where: { created_at: { gte: startDate } },
      _count: { order_id: true }
    });

    const statusMap = new Map(statusCounts.map(s => [s.payment_status, s._count.order_id]));

    return {
      totalOrders: stats._count.order_id,
      paidOrders: statusMap.get(1) || 0,
      cancelledOrders: statusMap.get(2) || 0,
      pendingOrders: statusMap.get(0) || 0,
      anomalousCount: anomalous.length,
      totalAmount: Number(stats._sum.amount || 0),
      totalPoints: stats._sum.total_points || 0
    };
  }
}

export const rechargeReconciliationService = new RechargeReconciliationService();
export default rechargeReconciliationService;
