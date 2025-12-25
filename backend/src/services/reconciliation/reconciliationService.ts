/**
 * 对账服务
 * 处理订单对账和状态同步
 */

import { PrismaClient } from '@prisma/client';
import { paymentGateway, PaymentChannel } from '../payment/paymentGateway';
import { vipOrderService, OrderStatus } from '../order/vipOrderService';
import { enhancedVipService } from '../vip/enhancedVipService';
import { notificationService } from '../notification/notificationService';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

// 对账结果
export interface ReconciliationResult {
  totalChecked: number;
  synced: number;
  cancelled: number;
  errors: ReconciliationError[];
  executedAt: Date;
}

// 对账错误
export interface ReconciliationError {
  orderNo: string;
  error: string;
  retryCount: number;
}

// 同步结果
export interface SyncResult {
  orderNo: string;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;
  synced: boolean;
  error?: string;
}

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  retryIntervalMs: 60 * 1000, // 1分钟
};

class ReconciliationService {
  private retryQueue: Map<string, { count: number; lastAttempt: number }> = new Map();

  /**
   * 执行对账任务
   */
  async runReconciliation(): Promise<ReconciliationResult> {
    const result: ReconciliationResult = {
      totalChecked: 0,
      synced: 0,
      cancelled: 0,
      errors: [],
      executedAt: new Date(),
    };

    try {
      // 获取待对账订单（创建超过5分钟的待支付订单）
      const pendingOrders = await vipOrderService.getPendingReconciliationOrders(5);
      result.totalChecked = pendingOrders.length;

      for (const order of pendingOrders) {
        try {
          const syncResult = await this.syncOrderStatus(order.order_no);

          if (syncResult.synced) {
            if (syncResult.currentStatus === OrderStatus.PAID) {
              result.synced++;
            } else if (syncResult.currentStatus === OrderStatus.CANCELLED) {
              result.cancelled++;
            }
          }

          // 清除重试记录
          this.retryQueue.delete(order.order_no);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          const retryInfo = this.retryQueue.get(order.order_no) || { count: 0, lastAttempt: 0 };

          if (retryInfo.count < RETRY_CONFIG.maxRetries) {
            // 加入重试队列
            this.retryQueue.set(order.order_no, {
              count: retryInfo.count + 1,
              lastAttempt: Date.now(),
            });
          }

          result.errors.push({
            orderNo: order.order_no,
            error: errorMessage,
            retryCount: retryInfo.count + 1,
          });

          logger.error(`对账失败: ${order.order_no}`, error);
        }
      }

      // 处理超时订单
      const timeoutCancelled = await vipOrderService.cancelTimeoutOrders();
      result.cancelled += timeoutCancelled;

      // 记录对账日志
      await this.logReconciliation(result);

      logger.info(`对账完成: 检查 ${result.totalChecked}, 同步 ${result.synced}, 取消 ${result.cancelled}, 错误 ${result.errors.length}`);

      return result;
    } catch (error) {
      logger.error('对账任务执行失败:', error);
      throw error;
    }
  }

  /**
   * 查询并同步单个订单状态
   */
  async syncOrderStatus(orderNo: string): Promise<SyncResult> {
    // 获取订单信息
    const order = await prisma.orders.findUnique({
      where: { order_no: orderNo },
    });

    if (!order) {
      return {
        orderNo,
        previousStatus: OrderStatus.PENDING,
        currentStatus: OrderStatus.PENDING,
        synced: false,
        error: '订单不存在',
      };
    }

    // 获取关联的VIP订单
    const vipOrder = await prisma.vip_orders.findFirst({
      where: { order_id: order.order_id },
    });

    const previousStatus = order.payment_status as unknown as OrderStatus;

    // 如果订单已不是待支付状态，无需同步
    if (previousStatus !== OrderStatus.PENDING) {
      return {
        orderNo,
        previousStatus,
        currentStatus: previousStatus,
        synced: false,
      };
    }

    // 确定支付渠道
    let channel: PaymentChannel;
    const paymentMethod = order.payment_method?.toLowerCase() || '';

    if (paymentMethod.includes('wechat') || paymentMethod === 'wechat') {
      // 根据设备类型判断具体渠道
      const deviceInfo = vipOrder?.device_info as Record<string, unknown> | null;
      channel = deviceInfo?.deviceType === 'mobile' ? 'wechat_h5' : 'wechat_native';
    } else if (paymentMethod.includes('alipay') || paymentMethod === 'alipay') {
      const deviceInfo = vipOrder?.device_info as Record<string, unknown> | null;
      channel = deviceInfo?.deviceType === 'mobile' ? 'alipay_wap' : 'alipay_pc';
    } else {
      return {
        orderNo,
        previousStatus,
        currentStatus: previousStatus,
        synced: false,
        error: '未知支付渠道',
      };
    }

    // 查询支付平台状态
    const paymentStatus = await paymentGateway.queryPaymentStatus(orderNo, channel);

    if (!paymentStatus.success) {
      return {
        orderNo,
        previousStatus,
        currentStatus: previousStatus,
        synced: false,
        error: paymentStatus.error,
      };
    }

    // 根据支付状态更新订单
    let currentStatus: OrderStatus = previousStatus;
    let synced = false;

    if (paymentStatus.status === 'paid') {
      // 支付成功，更新订单状态并开通VIP
      await this.handlePaymentSuccess(order, vipOrder, paymentStatus.transactionId);
      currentStatus = OrderStatus.PAID;
      synced = true;
    } else if (paymentStatus.status === 'closed') {
      // 订单已关闭
      await vipOrderService.cancelOrder(orderNo, '支付平台订单已关闭');
      currentStatus = OrderStatus.CANCELLED;
      synced = true;
    }

    return {
      orderNo,
      previousStatus,
      currentStatus,
      synced,
    };
  }

  /**
   * 处理支付成功
   */
  private async handlePaymentSuccess(
    order: { order_id: string; order_no: string; user_id: string | null },
    vipOrder: { package_id: string } | null,
    transactionId?: string
  ): Promise<void> {
    if (!vipOrder) {
      throw new Error('VIP订单信息不存在');
    }

    if (!order.user_id) {
      throw new Error('订单用户信息不存在');
    }

    // 更新订单状态
    await vipOrderService.updateOrderStatus(order.order_no, OrderStatus.PAID, transactionId);

    // 开通VIP
    const activationResult = await enhancedVipService.activateVip(
      order.user_id,
      vipOrder.package_id,
      order.order_id
    );

    // 发送支付成功通知
    const pkg = await prisma.vip_packages.findUnique({
      where: { package_id: vipOrder.package_id },
    });

    await notificationService.sendPaymentSuccessNotification(
      order.user_id,
      order.order_no,
      pkg?.package_name || 'VIP会员',
      activationResult.expireAt
    );

    logger.info(`对账同步支付成功: ${order.order_no}, 用户: ${order.user_id}`);
  }

  /**
   * 获取待对账订单
   */
  async getPendingOrders() {
    return vipOrderService.getPendingReconciliationOrders(5);
  }

  /**
   * 记录对账日志
   */
  async logReconciliation(result: ReconciliationResult): Promise<void> {
    // 记录到安全日志表
    await prisma.security_logs.create({
      data: {
        event_type: 'reconciliation',
        event_data: {
          totalChecked: result.totalChecked,
          synced: result.synced,
          cancelled: result.cancelled,
          errorCount: result.errors.length,
          errors: result.errors.slice(0, 10).map(e => ({
            orderNo: e.orderNo,
            error: e.error,
            retryCount: e.retryCount,
          })),
        },
        risk_level: result.errors.length > 0 ? 'medium' : 'low',
        action_taken: 'logged',
      },
    });
  }

  /**
   * 处理重试队列
   */
  async processRetryQueue(): Promise<number> {
    let processed = 0;
    const now = Date.now();

    for (const [orderNo, retryInfo] of this.retryQueue.entries()) {
      // 检查是否到达重试时间
      if (now - retryInfo.lastAttempt < RETRY_CONFIG.retryIntervalMs) {
        continue;
      }

      // 检查是否超过最大重试次数
      if (retryInfo.count >= RETRY_CONFIG.maxRetries) {
        this.retryQueue.delete(orderNo);
        logger.warn(`订单 ${orderNo} 对账重试次数已达上限，移出队列`);
        continue;
      }

      try {
        await this.syncOrderStatus(orderNo);
        this.retryQueue.delete(orderNo);
        processed++;
      } catch (error) {
        this.retryQueue.set(orderNo, {
          count: retryInfo.count + 1,
          lastAttempt: now,
        });
      }
    }

    return processed;
  }

  /**
   * 获取对账统计
   */
  async getReconciliationStats(days: number = 7): Promise<{
    totalReconciliations: number;
    totalSynced: number;
    totalCancelled: number;
    totalErrors: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.security_logs.findMany({
      where: {
        event_type: 'reconciliation',
        created_at: { gte: startDate },
      },
    });

    let totalReconciliations = 0;
    let totalSynced = 0;
    let totalCancelled = 0;
    let totalErrors = 0;

    for (const log of logs) {
      const data = log.event_data as Record<string, number> | null;
      if (data) {
        totalReconciliations += data.totalChecked || 0;
        totalSynced += data.synced || 0;
        totalCancelled += data.cancelled || 0;
        totalErrors += data.errorCount || 0;
      }
    }

    return {
      totalReconciliations,
      totalSynced,
      totalCancelled,
      totalErrors,
    };
  }

  /**
   * 手动触发单个订单对账
   */
  async manualReconcile(orderNo: string): Promise<SyncResult> {
    logger.info(`手动触发对账: ${orderNo}`);
    return this.syncOrderStatus(orderNo);
  }
}

export const reconciliationService = new ReconciliationService();
export default reconciliationService;
