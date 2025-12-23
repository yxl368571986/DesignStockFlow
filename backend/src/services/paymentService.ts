import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';

// 使用单例模式确保Prisma客户端只初始化一次
const prisma = new PrismaClient();

/**
 * 支付服务
 */
export class PaymentService {
  /**
   * 生成唯一订单号
   */
  generateOrderNo(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORDER${timestamp}${random}`;
  }

  /**
   * 创建订单
   */
  async createOrder(data: {
    userId: string;
    orderType: 'vip' | 'points';
    productType: string;
    paymentMethod: 'wechat' | 'alipay';
  }) {
    const { userId, orderType, productType, paymentMethod } = data;

    // 根据产品类型获取产品信息和价格
    let productName = '';
    let amount = 0;

    if (orderType === 'vip') {
      // 获取VIP套餐信息
      const vipPackage = await prisma.vip_packages.findFirst({
        where: {
          package_code: productType,
          status: 1,
        },
      });

      if (!vipPackage) {
        throw new Error('VIP套餐不存在或已下架');
      }

      productName = vipPackage.package_name;
      amount = Number(vipPackage.current_price);
    } else if (orderType === 'points') {
      // 获取积分商品信息
      const pointsProduct = await prisma.points_products.findFirst({
        where: {
          product_code: productType,
          status: 1,
        },
      });

      if (!pointsProduct) {
        throw new Error('积分商品不存在或已下架');
      }

      productName = pointsProduct.product_name;
      // 积分商品可能需要不同的价格计算逻辑
      amount = pointsProduct.points_required;
    }

    // 创建订单
    const orderNo = this.generateOrderNo();
    const order = await prisma.orders.create({
      data: {
        order_no: orderNo,
        user_id: userId,
        order_type: orderType,
        product_type: productType,
        product_name: productName,
        amount: amount,
        payment_method: paymentMethod,
        payment_status: 0, // 待支付
      },
    });

    logger.info(`创建订单成功: ${orderNo}, 用户: ${userId}, 类型: ${orderType}`);

    return {
      orderId: order.order_id,
      orderNo: order.order_no,
      amount: Number(order.amount),
      paymentMethod,
    };
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(orderNo: string, userId?: string) {
    const where: any = { order_no: orderNo };
    if (userId) {
      where.user_id = userId;
    }

    const order = await prisma.orders.findFirst({
      where,
      include: {
        users: {
          select: {
            user_id: true,
            nickname: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    return {
      orderId: order.order_id,
      orderNo: order.order_no,
      orderType: order.order_type,
      productType: order.product_type,
      productName: order.product_name,
      amount: Number(order.amount),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      transactionId: order.transaction_id,
      paidAt: order.paid_at,
      createdAt: order.created_at,
      user: order.users,
    };
  }

  /**
   * 处理支付回调
   */
  async handlePaymentCallback(data: {
    orderNo: string;
    transactionId: string;
    paymentMethod: string;
  }) {
    const { orderNo, transactionId, paymentMethod } = data;

    // 查找订单
    const order = await prisma.orders.findUnique({
      where: { order_no: orderNo },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.payment_status === 1) {
      logger.warn(`订单已支付: ${orderNo}`);
      return { success: true, message: '订单已支付' };
    }

    // 更新订单状态
    await prisma.orders.update({
      where: { order_no: orderNo },
      data: {
        payment_status: 1,
        transaction_id: transactionId,
        payment_method: paymentMethod,
        paid_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 根据订单类型处理业务逻辑
    if (order.order_type === 'vip') {
      await this.processVipOrder(order);
    } else if (order.order_type === 'points') {
      await this.processPointsOrder(order);
    }

    logger.info(`订单支付成功: ${orderNo}`);

    return { success: true, message: '支付成功' };
  }

  /**
   * 处理VIP订单
   */
  private async processVipOrder(order: any) {
    // 获取VIP套餐信息
    const vipPackage = await prisma.vip_packages.findFirst({
      where: { package_code: order.product_type },
    });

    if (!vipPackage) {
      throw new Error('VIP套餐不存在');
    }

    // 获取用户当前VIP信息
    const user = await prisma.users.findUnique({
      where: { user_id: order.user_id },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 计算VIP到期时间
    const now = new Date();
    let expireAt: Date;

    if (user.vip_expire_at && user.vip_expire_at > now) {
      // 如果当前VIP未过期，在原有基础上延长
      expireAt = new Date(user.vip_expire_at);
      expireAt.setDate(expireAt.getDate() + vipPackage.duration_days);
    } else {
      // 如果已过期或从未开通，从现在开始计算
      expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + vipPackage.duration_days);
    }

    // 更新用户VIP状态
    await prisma.users.update({
      where: { user_id: order.user_id },
      data: {
        vip_level: 1, // 设置为VIP
        vip_expire_at: expireAt,
        updated_at: new Date(),
      },
    });

    logger.info(`用户 ${order.user_id} VIP开通成功，到期时间: ${expireAt}`);
  }

  /**
   * 处理积分订单
   */
  private async processPointsOrder(order: any) {
    // 获取积分商品信息
    const product = await prisma.points_products.findFirst({
      where: { product_code: order.product_type },
    });

    if (!product) {
      throw new Error('积分商品不存在');
    }

    // 获取用户当前积分
    const user = await prisma.users.findUnique({
      where: { user_id: order.user_id },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 计算充值积分数量（根据商品价值）
    const pointsToAdd = parseInt(product.product_value || '0', 10);

    // 更新用户积分
    await prisma.users.update({
      where: { user_id: order.user_id },
      data: {
        points_balance: { increment: pointsToAdd },
        points_total: { increment: pointsToAdd },
        updated_at: new Date(),
      },
    });

    // 记录积分变动
    await prisma.points_records.create({
      data: {
        user_id: order.user_id,
        points_change: pointsToAdd,
        points_balance: user.points_balance + pointsToAdd,
        change_type: 'recharge',
        source: 'purchase',
        source_id: order.order_id,
        description: `购买积分: ${product.product_name}`,
      },
    });

    logger.info(`用户 ${order.user_id} 积分充值成功，充值 ${pointsToAdd} 积分`);
  }

  /**
   * 获取用户订单列表
   */
  async getUserOrders(userId: string, options: {
    page?: number;
    pageSize?: number;
    orderType?: string;
    paymentStatus?: number;
  } = {}) {
    const { page = 1, pageSize = 10, orderType, paymentStatus } = options;

    const where: any = { user_id: userId };
    if (orderType) {
      where.order_type = orderType;
    }
    if (paymentStatus !== undefined) {
      where.payment_status = paymentStatus;
    }

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
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
        orderType: order.order_type,
        productType: order.product_type,
        productName: order.product_name,
        amount: Number(order.amount),
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        paidAt: order.paid_at,
        createdAt: order.created_at,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderNo: string, userId: string) {
    const order = await prisma.orders.findFirst({
      where: {
        order_no: orderNo,
        user_id: userId,
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.payment_status === 1) {
      throw new Error('已支付订单无法取消');
    }

    await prisma.orders.update({
      where: { order_no: orderNo },
      data: {
        payment_status: 2, // 已取消
        updated_at: new Date(),
      },
    });

    logger.info(`订单取消成功: ${orderNo}`);

    return { success: true, message: '订单已取消' };
  }
}

export const paymentService = new PaymentService();
export default paymentService;
