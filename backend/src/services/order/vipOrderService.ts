/**
 * VIP订单服务
 * 处理VIP订单的创建、状态管理、查询和退款
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { getPaymentConfig } from '../../config/payment';
import { PaymentChannel } from '../payment/paymentGateway';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

// 订单状态枚举
export enum OrderStatus {
  PENDING = 0,      // 待支付
  PAID = 1,         // 已支付
  REFUNDED = 2,     // 已退款
  CANCELLED = 3,    // 已取消
  REFUND_PENDING = 4 // 退款处理中
}

// 退款状态枚举
export enum RefundStatus {
  NONE = 0,         // 无退款
  PENDING = 1,      // 退款申请中
  APPROVED = 2,     // 已批准
  REJECTED = 3,     // 已拒绝
  PROCESSING = 4,   // 退款处理中
  SUCCESS = 5,      // 退款成功
  FAILED = 6        // 退款失败
}

// 设备信息接口
export interface DeviceInfo {
  userAgent: string;
  ip: string;
  deviceType: 'pc' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  fingerprint?: string;
}

// 创建VIP订单参数
export interface CreateVipOrderParams {
  userId: string;
  packageId: string;
  paymentMethod: PaymentChannel;
  deviceInfo: DeviceInfo;
  sourceUrl?: string;
  sourceResourceId?: string;
}

// 订单查询参数
export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
}

// 分页结果
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 退款检查结果
export interface RefundableResult {
  refundable: boolean;
  reason?: string;
  refundAmount?: number;
}

class VipOrderService {
  /**
   * 生成订单号
   */
  private generateOrderNo(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `VIP${timestamp}${random}`;
  }

  /**
   * 创建VIP订单
   */
  async createVipOrder(params: CreateVipOrderParams) {
    const config = getPaymentConfig();

    // 获取套餐信息
    const pkg = await prisma.vip_packages.findUnique({
      where: { package_id: params.packageId },
    });

    if (!pkg) {
      throw new Error('VIP套餐不存在');
    }

    if (pkg.status !== 1) {
      throw new Error('VIP套餐已下架');
    }

    // 获取用户信息
    const user = await prisma.users.findUnique({
      where: { user_id: params.userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查是否为终身会员购买终身套餐
    const isLifetimePackage = pkg.duration_days === -1 || pkg.package_code === 'lifetime';
    if (user.is_lifetime_vip && isLifetimePackage) {
      throw new Error('您已是终身会员，无需重复购买');
    }

    // 检查1小时内未支付订单数量
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const unpaidCount = await prisma.orders.count({
      where: {
        user_id: params.userId,
        payment_status: OrderStatus.PENDING,
        created_at: { gte: oneHourAgo },
      },
    });

    if (unpaidCount >= config.security.maxUnpaidOrdersPerHour) {
      throw new Error('您有过多未支付订单，请先完成或取消现有订单');
    }

    // 计算订单过期时间
    const expireAt = new Date(Date.now() + config.vip.orderTimeoutMinutes * 60 * 1000);

    // 判断是否需要二次验证
    const amountInCents = Math.round(Number(pkg.current_price) * 100);
    const requireSecondaryAuth = amountInCents >= config.security.secondaryAuthThreshold;

    // 创建订单
    const orderNo = this.generateOrderNo();

    const order = await prisma.$transaction(async (tx) => {
      // 创建主订单
      const mainOrder = await tx.orders.create({
        data: {
          order_no: orderNo,
          user_id: params.userId,
          order_type: 'vip',
          product_type: pkg.package_code,
          product_name: pkg.package_name,
          amount: pkg.current_price,
          payment_method: params.paymentMethod.replace('_native', '').replace('_h5', '').replace('_pc', '').replace('_wap', ''),
          payment_status: OrderStatus.PENDING,
          expire_at: expireAt,
          refund_status: RefundStatus.NONE,
          callback_count: 0,
        },
      });

      // 创建VIP订单扩展信息
      await tx.vip_orders.create({
        data: {
          order_id: mainOrder.order_id,
          package_id: params.packageId,
          source_url: params.sourceUrl,
          source_resource_id: params.sourceResourceId,
          device_fingerprint: params.deviceInfo.fingerprint,
          device_info: params.deviceInfo as unknown as Prisma.InputJsonValue,
          ip_address: params.deviceInfo.ip,
          require_secondary_auth: requireSecondaryAuth,
          secondary_auth_verified: false,
        },
      });

      return mainOrder;
    });

    logger.info(`创建VIP订单成功: ${orderNo}, 用户: ${params.userId}, 套餐: ${pkg.package_name}`);

    return {
      orderId: order.order_id,
      orderNo: order.order_no,
      amount: Number(order.amount),
      amountInCents,
      expireAt,
      requireSecondaryAuth,
      packageName: pkg.package_name,
      durationDays: pkg.duration_days,
    };
  }

  /**
   * 更新订单状态
   */
  async updateOrderStatus(
    orderNo: string,
    status: OrderStatus,
    transactionId?: string
  ) {
    const order = await prisma.orders.findUnique({
      where: { order_no: orderNo },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    const updateData: Prisma.ordersUpdateInput = {
      payment_status: status,
      updated_at: new Date(),
    };

    if (status === OrderStatus.PAID) {
      updateData.paid_at = new Date();
      if (transactionId) {
        updateData.transaction_id = transactionId;
      }
      updateData.callback_count = { increment: 1 };
    } else if (status === OrderStatus.CANCELLED) {
      updateData.cancelled_at = new Date();
    }

    const updatedOrder = await prisma.orders.update({
      where: { order_no: orderNo },
      data: updateData,
    });

    logger.info(`订单状态更新: ${orderNo} -> ${status}`);

    return updatedOrder;
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderNo: string, reason: string, userId?: string) {
    const where: Prisma.ordersWhereInput = { order_no: orderNo };
    if (userId) {
      where.user_id = userId;
    }

    const order = await prisma.orders.findFirst({ where });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.payment_status === OrderStatus.PAID) {
      throw new Error('已支付订单无法取消，请申请退款');
    }

    if (order.payment_status === OrderStatus.CANCELLED) {
      throw new Error('订单已取消');
    }

    await prisma.orders.update({
      where: { order_no: orderNo },
      data: {
        payment_status: OrderStatus.CANCELLED,
        cancelled_at: new Date(),
        cancel_reason: reason,
        updated_at: new Date(),
      },
    });

    logger.info(`订单取消: ${orderNo}, 原因: ${reason}`);
  }

  /**
   * 查询用户订单列表
   */
  async getUserOrders(userId: string, params: OrderQueryParams): Promise<PageResult<any>> {
    const { page = 1, pageSize = 10, status, startDate, endDate } = params;

    const where: Prisma.ordersWhereInput = {
      user_id: userId,
      order_type: 'vip',
    };

    if (status !== undefined) {
      where.payment_status = status;
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = startDate;
      }
      if (endDate) {
        where.created_at.lte = endDate;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        include: {
          vip_orders: {
            include: {
              vip_packages: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.orders.count({ where }),
    ]);

    return {
      list: orders.map(order => ({
        orderId: order.order_id,
        orderNo: order.order_no,
        productName: order.product_name,
        amount: Number(order.amount),
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        refundStatus: order.refund_status,
        expireAt: order.expire_at,
        paidAt: order.paid_at,
        cancelledAt: order.cancelled_at,
        createdAt: order.created_at,
        vipOrder: order.vip_orders[0] ? {
          packageId: order.vip_orders[0].package_id,
          packageName: order.vip_orders[0].vip_packages?.package_name,
          durationDays: order.vip_orders[0].vip_packages?.duration_days,
        } : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(orderNo: string, userId?: string) {
    const where: Prisma.ordersWhereInput = { order_no: orderNo };
    if (userId) {
      where.user_id = userId;
    }

    const order = await prisma.orders.findFirst({
      where,
      include: {
        vip_orders: {
          include: {
            vip_packages: true,
          },
        },
        users: {
          select: {
            user_id: true,
            nickname: true,
            phone: true,
            vip_level: true,
            vip_expire_at: true,
          },
        },
        refund_requests: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    const vipOrder = order.vip_orders[0];
    const refundRequest = order.refund_requests[0];

    return {
      orderId: order.order_id,
      orderNo: order.order_no,
      orderType: order.order_type,
      productType: order.product_type,
      productName: order.product_name,
      amount: Number(order.amount),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      refundStatus: order.refund_status,
      transactionId: order.transaction_id,
      expireAt: order.expire_at,
      paidAt: order.paid_at,
      cancelledAt: order.cancelled_at,
      cancelReason: order.cancel_reason,
      createdAt: order.created_at,
      user: order.users,
      vipOrder: vipOrder ? {
        packageId: vipOrder.package_id,
        packageName: vipOrder.vip_packages?.package_name,
        durationDays: vipOrder.vip_packages?.duration_days,
        sourceUrl: vipOrder.source_url,
        sourceResourceId: vipOrder.source_resource_id,
        requireSecondaryAuth: vipOrder.require_secondary_auth,
        secondaryAuthVerified: vipOrder.secondary_auth_verified,
      } : null,
      refundRequest: refundRequest ? {
        refundId: refundRequest.refund_id,
        refundAmount: Number(refundRequest.refund_amount),
        reason: refundRequest.reason,
        status: refundRequest.status,
        createdAt: refundRequest.created_at,
      } : null,
    };
  }

  /**
   * 检查订单是否可退款
   */
  async checkRefundable(orderNo: string): Promise<RefundableResult> {
    const config = getPaymentConfig();

    const order = await prisma.orders.findUnique({
      where: { order_no: orderNo },
      include: {
        vip_orders: {
          include: {
            vip_packages: true,
          },
        },
        users: true,
      },
    });

    if (!order) {
      return { refundable: false, reason: '订单不存在' };
    }

    // 检查订单状态
    if (order.payment_status !== OrderStatus.PAID) {
      return { refundable: false, reason: '订单未支付，无需退款' };
    }

    // 检查是否已有退款申请
    if (order.refund_status !== RefundStatus.NONE) {
      return { refundable: false, reason: '订单已有退款申请' };
    }

    // 检查是否为终身会员套餐
    const vipOrder = order.vip_orders[0];
    if (vipOrder?.vip_packages?.duration_days === -1 || vipOrder?.vip_packages?.package_code === 'lifetime') {
      return { refundable: false, reason: '终身会员套餐不支持退款' };
    }

    // 检查购买时间是否超过退款有效期
    if (order.paid_at) {
      const daysSincePurchase = Math.floor((Date.now() - order.paid_at.getTime()) / (24 * 60 * 60 * 1000));
      if (daysSincePurchase > config.vip.refundValidDays) {
        return { refundable: false, reason: `购买超过${config.vip.refundValidDays}天，不支持退款` };
      }
    }

    // 检查是否有下载记录
    const downloadCount = await prisma.download_history.count({
      where: {
        user_id: order.user_id!,
        created_at: { gte: order.paid_at! },
      },
    });

    if (downloadCount > 0) {
      return { refundable: false, reason: '购买后已下载资源，不支持退款' };
    }

    return {
      refundable: true,
      refundAmount: Number(order.amount),
    };
  }

  /**
   * 创建退款申请
   */
  async createRefundRequest(orderNo: string, userId: string, reason: string, reasonType?: string) {
    // 检查是否可退款
    const refundable = await this.checkRefundable(orderNo);
    if (!refundable.refundable) {
      throw new Error(refundable.reason || '订单不支持退款');
    }

    const order = await prisma.orders.findFirst({
      where: { order_no: orderNo, user_id: userId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 创建退款申请
    const refundRequest = await prisma.$transaction(async (tx) => {
      // 更新订单退款状态
      await tx.orders.update({
        where: { order_no: orderNo },
        data: {
          refund_status: RefundStatus.PENDING,
          updated_at: new Date(),
        },
      });

      // 创建退款申请记录
      return tx.refund_requests.create({
        data: {
          order_id: order.order_id,
          user_id: userId,
          refund_amount: order.amount,
          reason,
          reason_type: reasonType || 'other',
          status: 0, // 待审核
        },
      });
    });

    logger.info(`创建退款申请: ${orderNo}, 用户: ${userId}`);

    return {
      refundId: refundRequest.refund_id,
      orderNo,
      refundAmount: Number(refundRequest.refund_amount),
      status: refundRequest.status,
    };
  }

  /**
   * 检查订单是否已过期
   */
  async isOrderExpired(orderNo: string): Promise<boolean> {
    const order = await prisma.orders.findUnique({
      where: { order_no: orderNo },
    });

    if (!order) {
      return true;
    }

    if (order.payment_status !== OrderStatus.PENDING) {
      return false;
    }

    if (order.expire_at && order.expire_at < new Date()) {
      return true;
    }

    return false;
  }

  /**
   * 获取待对账订单
   */
  async getPendingReconciliationOrders(minutesAgo: number = 5) {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);

    return prisma.orders.findMany({
      where: {
        payment_status: OrderStatus.PENDING,
        order_type: 'vip',
        created_at: { lte: cutoffTime },
        expire_at: { gt: new Date() },
      },
      include: {
        vip_orders: true,
      },
    });
  }

  /**
   * 获取超时订单
   */
  async getTimeoutOrders() {
    return prisma.orders.findMany({
      where: {
        payment_status: OrderStatus.PENDING,
        order_type: 'vip',
        expire_at: { lte: new Date() },
      },
    });
  }

  /**
   * 批量取消超时订单
   */
  async cancelTimeoutOrders() {
    const timeoutOrders = await this.getTimeoutOrders();

    let cancelledCount = 0;
    for (const order of timeoutOrders) {
      try {
        await this.cancelOrder(order.order_no, '订单超时自动取消');
        cancelledCount++;
      } catch (error) {
        logger.error(`取消超时订单失败: ${order.order_no}`, error);
      }
    }

    if (cancelledCount > 0) {
      logger.info(`批量取消超时订单: ${cancelledCount}个`);
    }

    return cancelledCount;
  }

  /**
   * 记录支付回调
   */
  async recordPaymentCallback(data: {
    orderNo: string;
    channel: string;
    transactionId?: string;
    callbackData: any;
    signature?: string;
    signatureValid?: boolean;
    processed: boolean;
    processResult?: string;
    errorMessage?: string;
  }) {
    return prisma.payment_callbacks.create({
      data: {
        order_no: data.orderNo,
        channel: data.channel,
        transaction_id: data.transactionId,
        callback_data: data.callbackData,
        signature: data.signature,
        signature_valid: data.signatureValid,
        processed: data.processed,
        process_result: data.processResult,
        error_message: data.errorMessage,
      },
    });
  }

  /**
   * 检查回调是否已处理（幂等性）
   */
  async isCallbackProcessed(orderNo: string, transactionId: string): Promise<boolean> {
    const existing = await prisma.payment_callbacks.findFirst({
      where: {
        order_no: orderNo,
        transaction_id: transactionId,
        processed: true,
        process_result: 'success',
      },
    });

    return !!existing;
  }

  /**
   * 更新二次验证状态
   */
  async updateSecondaryAuthStatus(orderNo: string, verified: boolean) {
    const order = await prisma.orders.findUnique({
      where: { order_no: orderNo },
      include: { vip_orders: true },
    });

    if (!order || !order.vip_orders[0]) {
      throw new Error('订单不存在');
    }

    await prisma.vip_orders.update({
      where: { vip_order_id: order.vip_orders[0].vip_order_id },
      data: {
        secondary_auth_verified: verified,
        updated_at: new Date(),
      },
    });
  }
}

export const vipOrderService = new VipOrderService();
export default vipOrderService;
