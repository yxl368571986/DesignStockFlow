/**
 * 充值订单服务
 * 提供充值订单的创建、查询、取消等功能
 */

import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { rechargePackageService } from './rechargePackageService';

// 订单状态枚举
export enum OrderStatus {
  PENDING = 0,    // 待支付
  PAID = 1,       // 已支付
  CANCELLED = 2,  // 已取消
  REFUNDED = 3    // 已退款
}

// 支付方式枚举
export enum PaymentMethod {
  WECHAT = 'wechat',
  ALIPAY = 'alipay'
}

// 创建订单请求
export interface CreateOrderRequest {
  userId: string;
  packageId: string;
  paymentMethod: PaymentMethod;
  ipAddress?: string;
  deviceInfo?: string;
}

// 订单响应
export interface RechargeOrderResponse {
  orderId: string;
  orderNo: string;
  userId: string;
  packageId: string;
  packageName?: string;
  amount: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  paymentMethod: string;
  paymentStatus: number;
  paymentStatusText: string;
  transactionId?: string;
  expireAt: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
}

// 订单错误类
export class OrderError extends Error {
  constructor(message: string, public code: string = 'ORDER_ERROR') {
    super(message);
    this.name = 'OrderError';
  }
}

// 充值限制配置
export interface RechargeLimitConfig {
  dailyMaxCount: number;      // 每日最大充值次数
  dailyMaxAmount: number;     // 每日最大充值金额
  orderExpireMinutes: number; // 订单过期时间（分钟）
}

// 默认限制配置
const DEFAULT_LIMIT_CONFIG: RechargeLimitConfig = {
  dailyMaxCount: 10,
  dailyMaxAmount: 1000,
  orderExpireMinutes: 30
};

/**
 * 生成唯一订单号
 * 格式：RC + 时间戳 + 6位随机数
 */
let orderNoCounter = 0;
export function generateOrderNo(): string {
  const timestamp = Date.now().toString();
  const counter = (orderNoCounter++ % 1000).toString().padStart(3, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RC${timestamp}${counter}${random}`;
}

/**
 * 获取订单状态文本
 */
export function getOrderStatusText(status: number): string {
  switch (status) {
    case OrderStatus.PENDING:
      return '待支付';
    case OrderStatus.PAID:
      return '已支付';
    case OrderStatus.CANCELLED:
      return '已取消';
    case OrderStatus.REFUNDED:
      return '已退款';
    default:
      return '未知状态';
  }
}

/**
 * 转换数据库记录为响应格式
 */
function toResponse(record: Prisma.recharge_ordersGetPayload<{ include: { recharge_packages: true } }>): RechargeOrderResponse {
  return {
    orderId: record.order_id,
    orderNo: record.order_no,
    userId: record.user_id,
    packageId: record.package_id,
    packageName: record.recharge_packages?.package_name,
    amount: Number(record.amount),
    basePoints: record.base_points,
    bonusPoints: record.bonus_points,
    totalPoints: record.total_points,
    paymentMethod: record.payment_method,
    paymentStatus: record.payment_status,
    paymentStatusText: getOrderStatusText(record.payment_status),
    transactionId: record.transaction_id || undefined,
    expireAt: record.expire_at,
    paidAt: record.paid_at || undefined,
    cancelledAt: record.cancelled_at || undefined,
    cancelReason: record.cancel_reason || undefined,
    createdAt: record.created_at
  };
}

class RechargeOrderService {
  private limitConfig: RechargeLimitConfig = DEFAULT_LIMIT_CONFIG;

  /**
   * 设置限制配置
   */
  setLimitConfig(config: Partial<RechargeLimitConfig>): void {
    this.limitConfig = { ...this.limitConfig, ...config };
  }

  /**
   * 获取限制配置
   */
  getLimitConfig(): RechargeLimitConfig {
    return { ...this.limitConfig };
  }

  /**
   * 检查用户充值限制
   */
  async checkRechargeLimit(userId: string, amount: number): Promise<{ allowed: boolean; reason?: string }> {
    // 获取用户信息
    const user = await prisma.users.findUnique({
      where: { user_id: userId }
    });

    if (!user) {
      return { allowed: false, reason: '用户不存在' };
    }

    // 检查用户状态
    if (user.status !== 1) {
      return { allowed: false, reason: '账号状态异常，无法充值' };
    }

    // 检查是否为VIP用户
    if (user.vip_level > 0 || user.is_lifetime_vip) {
      return { allowed: false, reason: 'VIP用户无需充值积分' };
    }

    // 检查支付锁定
    if (user.payment_locked) {
      return { allowed: false, reason: '账号支付功能已锁定，请联系客服' };
    }

    // 检查每日充值限制
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 如果是新的一天，重置计数
    if (!user.last_recharge_date || new Date(user.last_recharge_date) < today) {
      // 新的一天，计数从0开始
    } else {
      // 检查每日充值次数
      if (user.daily_recharge_count >= this.limitConfig.dailyMaxCount) {
        return { allowed: false, reason: `每日充值次数已达上限（${this.limitConfig.dailyMaxCount}次）` };
      }

      // 检查每日充值金额
      const currentDailyAmount = Number(user.daily_recharge_amount);
      if (currentDailyAmount + amount > this.limitConfig.dailyMaxAmount) {
        return { allowed: false, reason: `每日充值金额已达上限（${this.limitConfig.dailyMaxAmount}元）` };
      }
    }

    return { allowed: true };
  }

  /**
   * 创建充值订单
   */
  async createRechargeOrder(request: CreateOrderRequest): Promise<RechargeOrderResponse> {
    const { userId, packageId, paymentMethod, ipAddress, deviceInfo } = request;

    // 获取套餐信息
    const pkg = await rechargePackageService.getPackageById(packageId);
    if (!pkg) {
      throw new OrderError('套餐不存在', 'POINTS_001');
    }
    if (pkg.status !== 1) {
      throw new OrderError('套餐已禁用', 'POINTS_001');
    }

    // 检查充值限制
    const limitCheck = await this.checkRechargeLimit(userId, pkg.price);
    if (!limitCheck.allowed) {
      throw new OrderError(limitCheck.reason!, 'POINTS_007');
    }

    // 生成订单号
    const orderNo = generateOrderNo();

    // 计算过期时间
    const expireAt = new Date();
    expireAt.setMinutes(expireAt.getMinutes() + this.limitConfig.orderExpireMinutes);

    // 创建订单
    const order = await prisma.recharge_orders.create({
      data: {
        order_no: orderNo,
        user_id: userId,
        package_id: packageId,
        amount: new Prisma.Decimal(pkg.price),
        base_points: pkg.basePoints,
        bonus_points: pkg.bonusPoints,
        total_points: pkg.totalPoints,
        payment_method: paymentMethod,
        payment_status: OrderStatus.PENDING,
        expire_at: expireAt,
        ip_address: ipAddress,
        device_info: deviceInfo
      },
      include: {
        recharge_packages: true
      }
    });

    return toResponse(order);
  }

  /**
   * 根据订单ID获取订单
   */
  async getOrderById(orderId: string): Promise<RechargeOrderResponse | null> {
    const order = await prisma.recharge_orders.findUnique({
      where: { order_id: orderId },
      include: { recharge_packages: true }
    });

    return order ? toResponse(order) : null;
  }

  /**
   * 根据订单号获取订单
   */
  async getOrderByNo(orderNo: string): Promise<RechargeOrderResponse | null> {
    const order = await prisma.recharge_orders.findUnique({
      where: { order_no: orderNo },
      include: { recharge_packages: true }
    });

    return order ? toResponse(order) : null;
  }

  /**
   * 获取订单状态
   */
  async getOrderStatus(orderId: string): Promise<{ status: number; statusText: string } | null> {
    const order = await prisma.recharge_orders.findUnique({
      where: { order_id: orderId },
      select: { payment_status: true }
    });

    if (!order) return null;

    return {
      status: order.payment_status,
      statusText: getOrderStatusText(order.payment_status)
    };
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: string, reason?: string): Promise<RechargeOrderResponse> {
    const order = await prisma.recharge_orders.findUnique({
      where: { order_id: orderId }
    });

    if (!order) {
      throw new OrderError('订单不存在', 'ORDER_NOT_FOUND');
    }

    if (order.payment_status !== OrderStatus.PENDING) {
      throw new OrderError('只能取消待支付的订单', 'ORDER_STATUS_ERROR');
    }

    const updated = await prisma.recharge_orders.update({
      where: { order_id: orderId },
      data: {
        payment_status: OrderStatus.CANCELLED,
        cancelled_at: new Date(),
        cancel_reason: reason || '用户取消',
        updated_at: new Date()
      },
      include: { recharge_packages: true }
    });

    return toResponse(updated);
  }

  /**
   * 取消超时订单
   */
  async cancelExpiredOrders(): Promise<number> {
    const now = new Date();

    const result = await prisma.recharge_orders.updateMany({
      where: {
        payment_status: OrderStatus.PENDING,
        expire_at: { lt: now }
      },
      data: {
        payment_status: OrderStatus.CANCELLED,
        cancelled_at: now,
        cancel_reason: '订单超时自动取消',
        updated_at: now
      }
    });

    return result.count;
  }

  /**
   * 获取用户订单列表
   */
  async getUserOrders(
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
      status?: number;
    } = {}
  ): Promise<{ orders: RechargeOrderResponse[]; total: number }> {
    const { page = 1, pageSize = 10, status } = options;
    const skip = (page - 1) * pageSize;

    const where: Prisma.recharge_ordersWhereInput = {
      user_id: userId,
      ...(status !== undefined && { payment_status: status })
    };

    const [orders, total] = await Promise.all([
      prisma.recharge_orders.findMany({
        where,
        include: { recharge_packages: true },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.recharge_orders.count({ where })
    ]);

    return {
      orders: orders.map(toResponse),
      total
    };
  }

  /**
   * 获取所有订单列表（管理后台用）
   */
  async getAllOrders(
    options: {
      page?: number;
      pageSize?: number;
      status?: number;
      userId?: string;
      orderNo?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ orders: RechargeOrderResponse[]; total: number }> {
    const { page = 1, pageSize = 10, status, userId, orderNo, startDate, endDate } = options;
    const skip = (page - 1) * pageSize;

    const where: Prisma.recharge_ordersWhereInput = {
      ...(status !== undefined && { payment_status: status }),
      ...(userId && { user_id: userId }),
      ...(orderNo && { order_no: { contains: orderNo } }),
      ...(startDate && { created_at: { gte: startDate } }),
      ...(endDate && { created_at: { lte: endDate } })
    };

    const [orders, total] = await Promise.all([
      prisma.recharge_orders.findMany({
        where,
        include: { recharge_packages: true },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.recharge_orders.count({ where })
    ]);

    return {
      orders: orders.map(toResponse),
      total
    };
  }

  /**
   * 检查订单号是否唯一
   */
  async isOrderNoUnique(orderNo: string): Promise<boolean> {
    const existing = await prisma.recharge_orders.findUnique({
      where: { order_no: orderNo }
    });
    return !existing;
  }

  /**
   * 更新订单支付状态（内部使用）
   */
  async updatePaymentStatus(
    orderNo: string,
    status: OrderStatus,
    transactionId?: string
  ): Promise<RechargeOrderResponse> {
    const updateData: Prisma.recharge_ordersUpdateInput = {
      payment_status: status,
      updated_at: new Date()
    };

    if (status === OrderStatus.PAID) {
      updateData.paid_at = new Date();
      if (transactionId) {
        updateData.transaction_id = transactionId;
      }
    }

    const order = await prisma.recharge_orders.update({
      where: { order_no: orderNo },
      data: updateData,
      include: { recharge_packages: true }
    });

    return toResponse(order);
  }
}

export const rechargeOrderService = new RechargeOrderService();
export default rechargeOrderService;
