/**
 * VIP支付流程集成测试
 * 测试完整的VIP购买支付流程
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Prisma Client
const mockPrismaClient = {
  vip_packages: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  users: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  orders: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  vip_orders: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  payment_callbacks: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  download_history: {
    count: vi.fn(),
  },
  refund_requests: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrismaClient)),
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
}));

// Mock 支付服务
vi.mock('../../services/payment/wechatPay', () => ({
  wechatPayService: {
    createNativePayment: vi.fn(),
    createH5Payment: vi.fn(),
    queryPaymentStatus: vi.fn(),
    refund: vi.fn(),
    closeOrder: vi.fn(),
    isAvailable: vi.fn(() => true),
  },
}));

vi.mock('../../services/payment/alipay', () => ({
  alipayService: {
    createPCPayment: vi.fn(),
    createWapPayment: vi.fn(),
    queryPaymentStatus: vi.fn(),
    refund: vi.fn(),
    closeOrder: vi.fn(),
    isAvailable: vi.fn(() => true),
  },
}));

vi.mock('../../config/payment', () => ({
  getPaymentConfig: vi.fn(() => ({
    vip: {
      orderTimeoutMinutes: 15,
      refundValidDays: 7,
    },
    security: {
      maxUnpaidOrdersPerHour: 5,
      secondaryAuthThreshold: 20000, // 200元
    },
  })),
  isWechatPayAvailable: vi.fn(() => true),
  isAlipayAvailable: vi.fn(() => true),
}));

vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { wechatPayService } from '../../services/payment/wechatPay';
import { alipayService } from '../../services/payment/alipay';
import { paymentGateway } from '../../services/payment/paymentGateway';
import { vipOrderService, OrderStatus, RefundStatus } from '../../services/order/vipOrderService';

describe('VIP支付流程集成测试', () => {
  // 测试数据
  const mockUser = {
    user_id: 'user-001',
    nickname: '测试用户',
    phone: '13800138000',
    vip_level: 0,
    vip_expire_at: null,
    is_lifetime_vip: false,
    payment_locked: false,
  };

  const mockVipPackage = {
    package_id: 'pkg-001',
    package_name: 'VIP月卡',
    package_code: 'monthly',
    duration_days: 30,
    original_price: 99.00,
    current_price: 79.00,
    status: 1,
  };

  const mockOrder = {
    order_id: 'order-001',
    order_no: 'VIP1703123456781234',
    user_id: 'user-001',
    order_type: 'vip',
    product_type: 'monthly',
    product_name: 'VIP月卡',
    amount: 79.00,
    payment_method: 'wechat',
    payment_status: OrderStatus.PENDING,
    expire_at: new Date(Date.now() + 15 * 60 * 1000),
    refund_status: RefundStatus.NONE,
    callback_count: 0,
    created_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置默认mock返回值
    mockPrismaClient.users.findUnique.mockResolvedValue(mockUser);
    mockPrismaClient.vip_packages.findUnique.mockResolvedValue(mockVipPackage);
    mockPrismaClient.orders.count.mockResolvedValue(0);
    mockPrismaClient.orders.create.mockResolvedValue(mockOrder);
    mockPrismaClient.vip_orders.create.mockResolvedValue({
      vip_order_id: 'vip-order-001',
      order_id: mockOrder.order_id,
      package_id: mockVipPackage.package_id,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('完整支付流程 - 微信Native支付', () => {
    it('应该成功完成微信Native支付流程', async () => {
      // 1. 创建订单
      const orderResult = await vipOrderService.createVipOrder({
        userId: mockUser.user_id,
        packageId: mockVipPackage.package_id,
        paymentMethod: 'wechat_native',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ip: '127.0.0.1',
          deviceType: 'pc',
          browser: 'Chrome',
          os: 'Windows',
        },
      });

      expect(orderResult.orderNo).toBeDefined();
      expect(orderResult.amount).toBe(79);
      expect(orderResult.requireSecondaryAuth).toBe(false);

      // 2. 发起支付
      const mockQrUrl = 'weixin://wxpay/bizpayurl?pr=xxx';
      vi.mocked(wechatPayService.createNativePayment).mockResolvedValue({
        success: true,
        code_url: mockQrUrl,
      });

      const paymentResult = await paymentGateway.createPayment({
        orderNo: orderResult.orderNo,
        amount: Math.round(orderResult.amount * 100),
        subject: mockVipPackage.package_name,
        channel: 'wechat_native',
        clientIp: '127.0.0.1',
      });

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.paymentData).toBe(mockQrUrl);
      expect(paymentResult.channel).toBe('wechat_native');

      // 3. 模拟支付成功回调
      vi.mocked(wechatPayService.queryPaymentStatus).mockResolvedValue({
        success: true,
        trade_state: 'SUCCESS',
        transaction_id: 'wx_trans_001',
        payer_total: 7900,
      });

      const statusResult = await paymentGateway.queryPaymentStatus(
        orderResult.orderNo,
        'wechat_native'
      );

      expect(statusResult.success).toBe(true);
      expect(statusResult.status).toBe('paid');
      expect(statusResult.transactionId).toBe('wx_trans_001');
    });

    it('应该正确处理支付失败情况', async () => {
      vi.mocked(wechatPayService.createNativePayment).mockResolvedValue({
        success: false,
        error: '系统繁忙，请稍后重试',
      });

      const paymentResult = await paymentGateway.createPayment({
        orderNo: 'TEST_ORDER_001',
        amount: 7900,
        subject: 'VIP月卡',
        channel: 'wechat_native',
        clientIp: '127.0.0.1',
      });

      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toBe('系统繁忙，请稍后重试');
    });
  });

  describe('完整支付流程 - 支付宝PC支付', () => {
    it('应该成功完成支付宝PC支付流程', async () => {
      // 1. 创建订单
      const orderResult = await vipOrderService.createVipOrder({
        userId: mockUser.user_id,
        packageId: mockVipPackage.package_id,
        paymentMethod: 'alipay_pc',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ip: '127.0.0.1',
          deviceType: 'pc',
          browser: 'Chrome',
          os: 'Windows',
        },
      });

      expect(orderResult.orderNo).toBeDefined();

      // 2. 发起支付
      const mockPayUrl = 'https://openapi.alipay.com/gateway.do?xxx';
      vi.mocked(alipayService.createPCPayment).mockResolvedValue({
        success: true,
        payUrl: mockPayUrl,
      });

      const paymentResult = await paymentGateway.createPayment({
        orderNo: orderResult.orderNo,
        amount: Math.round(orderResult.amount * 100),
        subject: mockVipPackage.package_name,
        channel: 'alipay_pc',
        clientIp: '127.0.0.1',
        returnUrl: 'https://example.com/return',
      });

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.paymentData).toBe(mockPayUrl);
      expect(paymentResult.channel).toBe('alipay_pc');

      // 3. 模拟支付成功
      vi.mocked(alipayService.queryPaymentStatus).mockResolvedValue({
        success: true,
        trade_status: 'TRADE_SUCCESS',
        trade_no: 'ali_trans_001',
        buyer_pay_amount: '79.00',
      });

      const statusResult = await paymentGateway.queryPaymentStatus(
        orderResult.orderNo,
        'alipay_pc'
      );

      expect(statusResult.success).toBe(true);
      expect(statusResult.status).toBe('paid');
      expect(statusResult.transactionId).toBe('ali_trans_001');
    });
  });

  describe('二次验证流程', () => {
    it('金额>=200元应该要求二次验证', async () => {
      // 设置高价套餐
      const highPricePackage = {
        ...mockVipPackage,
        package_id: 'pkg-lifetime',
        package_name: '终身VIP',
        package_code: 'lifetime',
        current_price: 299.00,
        duration_days: -1,
      };
      mockPrismaClient.vip_packages.findUnique.mockResolvedValue(highPricePackage);

      const orderResult = await vipOrderService.createVipOrder({
        userId: mockUser.user_id,
        packageId: highPricePackage.package_id,
        paymentMethod: 'wechat_native',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ip: '127.0.0.1',
          deviceType: 'pc',
        },
      });

      expect(orderResult.requireSecondaryAuth).toBe(true);
    });

    it('金额<200元不需要二次验证', async () => {
      const orderResult = await vipOrderService.createVipOrder({
        userId: mockUser.user_id,
        packageId: mockVipPackage.package_id,
        paymentMethod: 'wechat_native',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ip: '127.0.0.1',
          deviceType: 'pc',
        },
      });

      expect(orderResult.requireSecondaryAuth).toBe(false);
    });
  });

  describe('订单状态管理', () => {
    it('应该正确更新订单为已支付状态', async () => {
      mockPrismaClient.orders.findUnique.mockResolvedValue(mockOrder);
      mockPrismaClient.orders.update.mockResolvedValue({
        ...mockOrder,
        payment_status: OrderStatus.PAID,
        paid_at: new Date(),
        transaction_id: 'wx_trans_001',
      });

      const updatedOrder = await vipOrderService.updateOrderStatus(
        mockOrder.order_no,
        OrderStatus.PAID,
        'wx_trans_001'
      );

      expect(updatedOrder.payment_status).toBe(OrderStatus.PAID);
      expect(mockPrismaClient.orders.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { order_no: mockOrder.order_no },
          data: expect.objectContaining({
            payment_status: OrderStatus.PAID,
          }),
        })
      );
    });

    it('应该正确取消订单', async () => {
      mockPrismaClient.orders.findFirst.mockResolvedValue(mockOrder);
      mockPrismaClient.orders.update.mockResolvedValue({
        ...mockOrder,
        payment_status: OrderStatus.CANCELLED,
        cancelled_at: new Date(),
        cancel_reason: '用户主动取消',
      });

      await vipOrderService.cancelOrder(mockOrder.order_no, '用户主动取消');

      expect(mockPrismaClient.orders.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { order_no: mockOrder.order_no },
          data: expect.objectContaining({
            payment_status: OrderStatus.CANCELLED,
            cancel_reason: '用户主动取消',
          }),
        })
      );
    });

    it('已支付订单不能取消', async () => {
      mockPrismaClient.orders.findFirst.mockResolvedValue({
        ...mockOrder,
        payment_status: OrderStatus.PAID,
      });

      await expect(
        vipOrderService.cancelOrder(mockOrder.order_no, '用户主动取消')
      ).rejects.toThrow('已支付订单无法取消，请申请退款');
    });
  });

  describe('支付回调幂等性', () => {
    it('应该正确检测已处理的回调', async () => {
      mockPrismaClient.payment_callbacks.findFirst.mockResolvedValue({
        callback_id: 'cb-001',
        order_no: mockOrder.order_no,
        transaction_id: 'wx_trans_001',
        processed: true,
        process_result: 'success',
      });

      const isProcessed = await vipOrderService.isCallbackProcessed(
        mockOrder.order_no,
        'wx_trans_001'
      );

      expect(isProcessed).toBe(true);
    });

    it('应该正确检测未处理的回调', async () => {
      mockPrismaClient.payment_callbacks.findFirst.mockResolvedValue(null);

      const isProcessed = await vipOrderService.isCallbackProcessed(
        mockOrder.order_no,
        'wx_trans_001'
      );

      expect(isProcessed).toBe(false);
    });
  });

  describe('终身会员限制', () => {
    it('终身会员不能重复购买终身套餐', async () => {
      // 设置用户为终身会员
      mockPrismaClient.users.findUnique.mockResolvedValue({
        ...mockUser,
        is_lifetime_vip: true,
      });

      // 设置终身套餐
      mockPrismaClient.vip_packages.findUnique.mockResolvedValue({
        ...mockVipPackage,
        package_code: 'lifetime',
        duration_days: -1,
      });

      await expect(
        vipOrderService.createVipOrder({
          userId: mockUser.user_id,
          packageId: 'pkg-lifetime',
          paymentMethod: 'wechat_native',
          deviceInfo: {
            userAgent: 'Mozilla/5.0',
            ip: '127.0.0.1',
            deviceType: 'pc',
          },
        })
      ).rejects.toThrow('您已是终身会员，无需重复购买');
    });
  });

  describe('未支付订单限制', () => {
    it('1小时内超过5个未支付订单应该被限制', async () => {
      mockPrismaClient.orders.count.mockResolvedValue(5);

      await expect(
        vipOrderService.createVipOrder({
          userId: mockUser.user_id,
          packageId: mockVipPackage.package_id,
          paymentMethod: 'wechat_native',
          deviceInfo: {
            userAgent: 'Mozilla/5.0',
            ip: '127.0.0.1',
            deviceType: 'pc',
          },
        })
      ).rejects.toThrow('您有过多未支付订单，请先完成或取消现有订单');
    });
  });
});
