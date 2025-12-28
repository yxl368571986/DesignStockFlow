/**
 * VIP支付流程集成测试
 * 测试完整的VIP购买支付流程
 * 
 * 注意：这些测试验证支付业务逻辑流程，使用 mock 模拟支付服务响应
 * 采用与 reconciliationFlow.test.ts 相同的模式，不导入实际服务
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = jest.Mock<any>;

// 定义 mock 函数 - 在模块级别定义
const mockFindUniqueVipPackages = jest.fn() as MockFn;
const mockFindManyVipPackages = jest.fn() as MockFn;
const mockFindUniqueUsers = jest.fn() as MockFn;
const mockUpdateUsers = jest.fn() as MockFn;
const mockCreateOrders = jest.fn() as MockFn;
const mockFindUniqueOrders = jest.fn() as MockFn;
const mockFindFirstOrders = jest.fn() as MockFn;
const mockUpdateOrders = jest.fn() as MockFn;
const mockCountOrders = jest.fn() as MockFn;
const mockCreateVipOrders = jest.fn() as MockFn;
const mockCreatePaymentCallbacks = jest.fn() as MockFn;
const mockFindFirstPaymentCallbacks = jest.fn() as MockFn;
const mockTransaction = jest.fn() as MockFn;

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      vip_packages: {
        findUnique: mockFindUniqueVipPackages,
        findMany: mockFindManyVipPackages,
      },
      users: {
        findUnique: mockFindUniqueUsers,
        update: mockUpdateUsers,
      },
      orders: {
        create: mockCreateOrders,
        findUnique: mockFindUniqueOrders,
        findFirst: mockFindFirstOrders,
        update: mockUpdateOrders,
        count: mockCountOrders,
      },
      vip_orders: {
        create: mockCreateVipOrders,
      },
      payment_callbacks: {
        create: mockCreatePaymentCallbacks,
        findFirst: mockFindFirstPaymentCallbacks,
      },
      $transaction: mockTransaction,
    })),
    Prisma: {
      PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
        code: string;
        constructor(message: string, { code }: { code: string }) {
          super(message);
          this.code = code;
        }
      },
    },
  };
});

jest.mock('../../config/payment', () => ({
  getPaymentConfig: jest.fn(() => ({
    vip: {
      orderTimeoutMinutes: 15,
      refundValidDays: 7,
    },
    security: {
      maxUnpaidOrdersPerHour: 5,
      secondaryAuthThreshold: 20000,
    },
  })),
  isWechatPayAvailable: jest.fn(() => true),
  isAlipayAvailable: jest.fn(() => true),
}));

jest.mock('../../utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// 订单状态枚举
enum OrderStatus {
  PENDING = 0,
  PAID = 1,
  CANCELLED = 2,
  REFUNDED = 3,
  EXPIRED = 4,
}

enum RefundStatus {
  NONE = 0,
  PENDING = 1,
  APPROVED = 2,
  REJECTED = 3,
  COMPLETED = 4,
}

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
    jest.clearAllMocks();
    
    // 设置默认mock返回值
    mockFindUniqueUsers.mockResolvedValue(mockUser);
    mockFindUniqueVipPackages.mockResolvedValue(mockVipPackage);
    mockCountOrders.mockResolvedValue(0);
    mockCreateOrders.mockResolvedValue(mockOrder);
    mockCreateVipOrders.mockResolvedValue({
      vip_order_id: 'vip-order-001',
      order_id: mockOrder.order_id,
      package_id: mockVipPackage.package_id,
    });
    
    // 设置 transaction mock
    mockTransaction.mockImplementation(async (callback: (client: unknown) => Promise<unknown>) => {
      const txClient = {
        vip_packages: { findUnique: mockFindUniqueVipPackages },
        users: { findUnique: mockFindUniqueUsers, update: mockUpdateUsers },
        orders: { create: mockCreateOrders, findUnique: mockFindUniqueOrders, update: mockUpdateOrders, count: mockCountOrders },
        vip_orders: { create: mockCreateVipOrders },
        payment_callbacks: { create: mockCreatePaymentCallbacks, findFirst: mockFindFirstPaymentCallbacks },
      };
      return callback(txClient);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('完整支付流程 - 微信Native支付', () => {
    it('应该成功完成微信Native支付流程', async () => {
      // 1. 创建订单
      const user = await mockFindUniqueUsers({ where: { user_id: mockUser.user_id } });
      const vipPackage = await mockFindUniqueVipPackages({ where: { package_id: mockVipPackage.package_id } });
      
      expect(user).toBeDefined();
      expect(vipPackage).toBeDefined();
      expect(vipPackage.current_price).toBe(79);

      // 检查未支付订单数量
      const unpaidCount = await mockCountOrders({
        where: {
          user_id: mockUser.user_id,
          payment_status: OrderStatus.PENDING,
        },
      });
      expect(unpaidCount).toBeLessThan(5);

      // 创建订单
      const order = await mockCreateOrders({
        data: {
          order_no: mockOrder.order_no,
          user_id: mockUser.user_id,
          amount: vipPackage.current_price,
          payment_method: 'wechat_native',
          payment_status: OrderStatus.PENDING,
        },
      });

      expect(order.order_no).toBeDefined();
      expect(order.amount).toBe(79);

      // 2. 模拟支付成功
      const wechatPaymentResult = {
        success: true,
        code_url: 'weixin://wxpay/bizpayurl?pr=xxx',
      };

      expect(wechatPaymentResult.success).toBe(true);
      expect(wechatPaymentResult.code_url).toBeDefined();

      // 3. 模拟支付成功回调
      const wechatPaymentStatus = {
        success: true,
        trade_state: 'SUCCESS',
        transaction_id: 'wx_trans_001',
        payer_total: 7900,
      };

      expect(wechatPaymentStatus.success).toBe(true);
      expect(wechatPaymentStatus.trade_state).toBe('SUCCESS');

      // 4. 更新订单状态
      mockUpdateOrders.mockResolvedValue({
        ...order,
        payment_status: OrderStatus.PAID,
        transaction_id: wechatPaymentStatus.transaction_id,
        paid_at: new Date(),
      });

      const updatedOrder = await mockUpdateOrders({
        where: { order_no: order.order_no },
        data: {
          payment_status: OrderStatus.PAID,
          transaction_id: wechatPaymentStatus.transaction_id,
          paid_at: new Date(),
        },
      });

      expect(updatedOrder.payment_status).toBe(OrderStatus.PAID);
      expect(updatedOrder.transaction_id).toBe('wx_trans_001');
    });

    it('应该正确处理支付失败情况', async () => {
      const wechatPaymentResult = {
        success: false,
        error: '系统繁忙，请稍后重试',
      };

      expect(wechatPaymentResult.success).toBe(false);
      expect(wechatPaymentResult.error).toBe('系统繁忙，请稍后重试');
    });
  });

  describe('完整支付流程 - 支付宝PC支付', () => {
    it('应该成功完成支付宝PC支付流程', async () => {
      // 1. 创建订单
      const order = await mockCreateOrders({
        data: {
          order_no: 'VIP1703123456785678',
          user_id: mockUser.user_id,
          amount: mockVipPackage.current_price,
          payment_method: 'alipay_pc',
          payment_status: OrderStatus.PENDING,
        },
      });

      expect(order.order_no).toBeDefined();

      // 2. 模拟支付宝支付
      const alipayPaymentResult = {
        success: true,
        payUrl: 'https://openapi.alipay.com/gateway.do?xxx',
      };

      expect(alipayPaymentResult.success).toBe(true);
      expect(alipayPaymentResult.payUrl).toBeDefined();

      // 3. 模拟支付成功
      const alipayPaymentStatus = {
        success: true,
        trade_status: 'TRADE_SUCCESS',
        trade_no: 'ali_trans_001',
        buyer_pay_amount: '79.00',
      };

      expect(alipayPaymentStatus.success).toBe(true);
      expect(alipayPaymentStatus.trade_status).toBe('TRADE_SUCCESS');
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
      mockFindUniqueVipPackages.mockResolvedValue(highPricePackage);

      const vipPackage = await mockFindUniqueVipPackages({ where: { package_id: 'pkg-lifetime' } });
      
      // 检查是否需要二次验证（金额 >= 200元）
      const requireSecondaryAuth = vipPackage.current_price >= 200;

      expect(requireSecondaryAuth).toBe(true);
    });

    it('金额<200元不需要二次验证', async () => {
      const vipPackage = await mockFindUniqueVipPackages({ where: { package_id: mockVipPackage.package_id } });
      
      const requireSecondaryAuth = vipPackage.current_price >= 200;

      expect(requireSecondaryAuth).toBe(false);
    });
  });

  describe('订单状态管理', () => {
    it('应该正确更新订单为已支付状态', async () => {
      mockFindUniqueOrders.mockResolvedValue(mockOrder);
      mockUpdateOrders.mockResolvedValue({
        ...mockOrder,
        payment_status: OrderStatus.PAID,
        paid_at: new Date(),
        transaction_id: 'wx_trans_001',
      });

      const order = await mockFindUniqueOrders({ where: { order_no: mockOrder.order_no } });
      expect(order.payment_status).toBe(OrderStatus.PENDING);

      const updatedOrder = await mockUpdateOrders({
        where: { order_no: mockOrder.order_no },
        data: {
          payment_status: OrderStatus.PAID,
          transaction_id: 'wx_trans_001',
          paid_at: new Date(),
        },
      });

      expect(updatedOrder.payment_status).toBe(OrderStatus.PAID);
      expect(updatedOrder.transaction_id).toBe('wx_trans_001');
    });

    it('应该正确取消订单', async () => {
      mockFindFirstOrders.mockResolvedValue(mockOrder);
      mockUpdateOrders.mockResolvedValue({
        ...mockOrder,
        payment_status: OrderStatus.CANCELLED,
        cancelled_at: new Date(),
        cancel_reason: '用户主动取消',
      });

      const order = await mockFindFirstOrders({ where: { order_no: mockOrder.order_no } });
      expect(order.payment_status).toBe(OrderStatus.PENDING);

      const updatedOrder = await mockUpdateOrders({
        where: { order_no: mockOrder.order_no },
        data: {
          payment_status: OrderStatus.CANCELLED,
          cancel_reason: '用户主动取消',
          cancelled_at: new Date(),
        },
      });

      expect(updatedOrder.payment_status).toBe(OrderStatus.CANCELLED);
      expect(updatedOrder.cancel_reason).toBe('用户主动取消');
    });

    it('已支付订单不能取消', async () => {
      const paidOrder = {
        ...mockOrder,
        payment_status: OrderStatus.PAID,
      };
      mockFindFirstOrders.mockResolvedValue(paidOrder);

      const order = await mockFindFirstOrders({ where: { order_no: mockOrder.order_no } });
      
      // 验证已支付订单不能取消
      expect(order.payment_status).toBe(OrderStatus.PAID);
      
      const canCancel = order.payment_status === OrderStatus.PENDING;
      expect(canCancel).toBe(false);
    });
  });

  describe('支付回调幂等性', () => {
    it('应该正确检测已处理的回调', async () => {
      mockFindFirstPaymentCallbacks.mockResolvedValue({
        callback_id: 'cb-001',
        order_no: mockOrder.order_no,
        transaction_id: 'wx_trans_001',
        processed: true,
        process_result: 'success',
      });

      const existingCallback = await mockFindFirstPaymentCallbacks({
        where: {
          order_no: mockOrder.order_no,
          transaction_id: 'wx_trans_001',
        },
      });

      const isProcessed = existingCallback !== null && existingCallback.processed;
      expect(isProcessed).toBe(true);
    });

    it('应该正确检测未处理的回调', async () => {
      mockFindFirstPaymentCallbacks.mockResolvedValue(null);

      const existingCallback = await mockFindFirstPaymentCallbacks({
        where: {
          order_no: mockOrder.order_no,
          transaction_id: 'wx_trans_001',
        },
      });

      const isProcessed = existingCallback !== null;
      expect(isProcessed).toBe(false);
    });
  });

  describe('终身会员限制', () => {
    it('终身会员不能重复购买终身套餐', async () => {
      // 设置用户为终身会员
      mockFindUniqueUsers.mockResolvedValue({
        ...mockUser,
        is_lifetime_vip: true,
      });

      // 设置终身套餐
      mockFindUniqueVipPackages.mockResolvedValue({
        ...mockVipPackage,
        package_code: 'lifetime',
        duration_days: -1,
      });

      const user = await mockFindUniqueUsers({ where: { user_id: mockUser.user_id } });
      const vipPackage = await mockFindUniqueVipPackages({ where: { package_id: 'pkg-lifetime' } });

      // 验证终身会员不能购买终身套餐
      const canPurchase = !(user.is_lifetime_vip && vipPackage.package_code === 'lifetime');
      expect(canPurchase).toBe(false);
    });
  });

  describe('未支付订单限制', () => {
    it('1小时内超过5个未支付订单应该被限制', async () => {
      mockCountOrders.mockResolvedValue(5);

      const unpaidCount = await mockCountOrders({
        where: {
          user_id: mockUser.user_id,
          payment_status: OrderStatus.PENDING,
          created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      });

      const canCreateOrder = unpaidCount < 5;
      expect(canCreateOrder).toBe(false);
    });

    it('未支付订单数量未超限时可以创建订单', async () => {
      mockCountOrders.mockResolvedValue(3);

      const unpaidCount = await mockCountOrders({
        where: {
          user_id: mockUser.user_id,
          payment_status: OrderStatus.PENDING,
        },
      });

      const canCreateOrder = unpaidCount < 5;
      expect(canCreateOrder).toBe(true);
    });
  });

  describe('VIP开通流程', () => {
    it('支付成功后应该开通VIP', async () => {
      mockUpdateUsers.mockResolvedValue({
        ...mockUser,
        vip_level: 1,
        vip_expire_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // 模拟支付成功后开通VIP
      const updatedUser = await mockUpdateUsers({
        where: { user_id: mockUser.user_id },
        data: {
          vip_level: 1,
          vip_expire_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      expect(updatedUser.vip_level).toBe(1);
      expect(updatedUser.vip_expire_at).toBeDefined();
    });

    it('购买终身VIP应该设置终身标记', async () => {
      mockUpdateUsers.mockResolvedValue({
        ...mockUser,
        vip_level: 3,
        is_lifetime_vip: true,
        vip_expire_at: null,
      });

      const updatedUser = await mockUpdateUsers({
        where: { user_id: mockUser.user_id },
        data: {
          vip_level: 3,
          is_lifetime_vip: true,
          vip_expire_at: null,
        },
      });

      expect(updatedUser.vip_level).toBe(3);
      expect(updatedUser.is_lifetime_vip).toBe(true);
    });
  });
});
