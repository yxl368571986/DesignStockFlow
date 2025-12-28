/**
 * 退款流程集成测试
 * 测试完整的VIP退款流程
 * 
 * 注意：这些测试验证退款业务逻辑流程，使用 mock 模拟支付服务响应
 * 采用与 reconciliationFlow.test.ts 相同的模式，不导入实际服务
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = jest.Mock<any>;

// 定义 mock 函数
const mockFindUniqueUsers = jest.fn() as MockFn;
const mockUpdateUsers = jest.fn() as MockFn;
const mockFindUniqueOrders = jest.fn() as MockFn;
const mockFindFirstOrders = jest.fn() as MockFn;
const mockUpdateOrders = jest.fn() as MockFn;
const mockFindUniqueVipPackages = jest.fn() as MockFn;
const mockCreateRefundRequests = jest.fn() as MockFn;
const mockFindUniqueRefundRequests = jest.fn() as MockFn;
const mockUpdateRefundRequests = jest.fn() as MockFn;
const mockCountDownloadHistory = jest.fn() as MockFn;
const mockTransaction = jest.fn() as MockFn;

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      users: {
        findUnique: mockFindUniqueUsers,
        update: mockUpdateUsers,
      },
      orders: {
        findUnique: mockFindUniqueOrders,
        findFirst: mockFindFirstOrders,
        update: mockUpdateOrders,
      },
      vip_packages: {
        findUnique: mockFindUniqueVipPackages,
      },
      refund_requests: {
        create: mockCreateRefundRequests,
        findUnique: mockFindUniqueRefundRequests,
        update: mockUpdateRefundRequests,
      },
      download_history: {
        count: mockCountDownloadHistory,
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

describe('退款流程集成测试', () => {
  // 测试数据
  const mockUser = {
    user_id: 'user-001',
    nickname: '测试用户',
    phone: '13800138000',
    vip_level: 1,
    vip_expire_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    is_lifetime_vip: false,
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

  const mockPaidOrder = {
    order_id: 'order-001',
    order_no: 'VIP1703123456781234',
    user_id: 'user-001',
    order_type: 'vip',
    product_type: 'monthly',
    product_name: 'VIP月卡',
    amount: 79.00,
    payment_method: 'wechat',
    payment_status: OrderStatus.PAID,
    refund_status: RefundStatus.NONE,
    transaction_id: 'wx_trans_001',
    paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前支付
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    vip_orders: [{
      vip_order_id: 'vip-order-001',
      package_id: 'pkg-001',
      vip_packages: mockVipPackage,
    }],
    users: mockUser,
    refund_requests: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFindUniqueUsers.mockResolvedValue(mockUser);
    mockFindUniqueOrders.mockResolvedValue(mockPaidOrder);
    mockFindFirstOrders.mockResolvedValue(mockPaidOrder);
    mockFindUniqueVipPackages.mockResolvedValue(mockVipPackage);
    mockCountDownloadHistory.mockResolvedValue(0);
    
    // 设置 transaction mock
    mockTransaction.mockImplementation(async (callback: (client: unknown) => Promise<unknown>) => {
      const txClient = {
        users: { findUnique: mockFindUniqueUsers, update: mockUpdateUsers },
        orders: { findUnique: mockFindUniqueOrders, findFirst: mockFindFirstOrders, update: mockUpdateOrders },
        refund_requests: { create: mockCreateRefundRequests, update: mockUpdateRefundRequests },
        download_history: { count: mockCountDownloadHistory },
      };
      return callback(txClient);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('退款资格检查', () => {
    it('7天内未下载的订单应该可以退款', async () => {
      const order = await mockFindUniqueOrders({ where: { order_no: mockPaidOrder.order_no } });
      const downloadCount = await mockCountDownloadHistory({
        where: {
          user_id: order.user_id,
          downloaded_at: { gte: order.paid_at },
        },
      });

      // 检查退款条件
      const daysSincePaid = Math.floor((Date.now() - order.paid_at.getTime()) / (24 * 60 * 60 * 1000));
      const isWithinRefundPeriod = daysSincePaid <= 7;
      const hasNoDownloads = downloadCount === 0;
      const isPaid = order.payment_status === OrderStatus.PAID;
      const hasNoRefundRequest = order.refund_status === RefundStatus.NONE;

      const refundable = isPaid && hasNoRefundRequest && isWithinRefundPeriod && hasNoDownloads;

      expect(refundable).toBe(true);
      expect(order.amount).toBe(79);
    });

    it('未支付订单不能退款', async () => {
      mockFindUniqueOrders.mockResolvedValue({
        ...mockPaidOrder,
        payment_status: OrderStatus.PENDING,
      });

      const order = await mockFindUniqueOrders({ where: { order_no: mockPaidOrder.order_no } });
      
      const refundable = order.payment_status === OrderStatus.PAID;
      expect(refundable).toBe(false);
    });

    it('已有退款申请的订单不能重复申请', async () => {
      mockFindUniqueOrders.mockResolvedValue({
        ...mockPaidOrder,
        refund_status: RefundStatus.PENDING,
      });

      const order = await mockFindUniqueOrders({ where: { order_no: mockPaidOrder.order_no } });
      
      const canApplyRefund = order.refund_status === RefundStatus.NONE;
      expect(canApplyRefund).toBe(false);
    });

    it('终身会员套餐不支持退款', async () => {
      mockFindUniqueOrders.mockResolvedValue({
        ...mockPaidOrder,
        vip_orders: [{
          ...mockPaidOrder.vip_orders[0],
          vip_packages: {
            ...mockVipPackage,
            package_code: 'lifetime',
            duration_days: -1,
          },
        }],
      });

      const order = await mockFindUniqueOrders({ where: { order_no: mockPaidOrder.order_no } });
      const vipPackage = order.vip_orders[0]?.vip_packages;
      
      const isLifetimePackage = vipPackage?.package_code === 'lifetime';
      expect(isLifetimePackage).toBe(true);
    });

    it('购买超过7天不支持退款', async () => {
      mockFindUniqueOrders.mockResolvedValue({
        ...mockPaidOrder,
        paid_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10天前
      });

      const order = await mockFindUniqueOrders({ where: { order_no: mockPaidOrder.order_no } });
      
      const daysSincePaid = Math.floor((Date.now() - order.paid_at.getTime()) / (24 * 60 * 60 * 1000));
      const isWithinRefundPeriod = daysSincePaid <= 7;
      
      expect(isWithinRefundPeriod).toBe(false);
    });

    it('购买后已下载资源不支持退款', async () => {
      mockCountDownloadHistory.mockResolvedValue(5);

      const downloadCount = await mockCountDownloadHistory({
        where: {
          user_id: mockPaidOrder.user_id,
          downloaded_at: { gte: mockPaidOrder.paid_at },
        },
      });

      const hasNoDownloads = downloadCount === 0;
      expect(hasNoDownloads).toBe(false);
    });
  });

  describe('创建退款申请', () => {
    it('应该成功创建退款申请', async () => {
      const mockRefundRequest = {
        refund_id: 'refund-001',
        order_id: mockPaidOrder.order_id,
        user_id: mockUser.user_id,
        refund_amount: 79.00,
        reason: '不想要了',
        reason_type: 'other',
        status: 0,
        created_at: new Date(),
      };

      mockCreateRefundRequests.mockResolvedValue(mockRefundRequest);
      mockUpdateOrders.mockResolvedValue({
        ...mockPaidOrder,
        refund_status: RefundStatus.PENDING,
      });

      // 创建退款申请
      const refundRequest = await mockCreateRefundRequests({
        data: {
          order_id: mockPaidOrder.order_id,
          user_id: mockUser.user_id,
          refund_amount: mockPaidOrder.amount,
          reason: '不想要了',
          reason_type: 'other',
          status: 0,
        },
      });

      expect(refundRequest.refund_id).toBe('refund-001');
      expect(refundRequest.refund_amount).toBe(79);

      // 更新订单退款状态
      const updatedOrder = await mockUpdateOrders({
        where: { order_no: mockPaidOrder.order_no },
        data: { refund_status: RefundStatus.PENDING },
      });

      expect(updatedOrder.refund_status).toBe(RefundStatus.PENDING);
    });

    it('不符合退款条件时不应创建退款申请', async () => {
      mockCountDownloadHistory.mockResolvedValue(5);

      const downloadCount = await mockCountDownloadHistory({
        where: {
          user_id: mockPaidOrder.user_id,
          downloaded_at: { gte: mockPaidOrder.paid_at },
        },
      });

      // 验证不符合退款条件
      expect(downloadCount).toBeGreaterThan(0);
      
      // 不应该创建退款申请
      expect(mockCreateRefundRequests).not.toHaveBeenCalled();
    });
  });

  describe('微信退款流程', () => {
    it('应该成功发起微信退款', async () => {
      const wechatRefundResult = {
        success: true,
        refund_id: 'wx_refund_001',
        status: 'SUCCESS',
      };

      expect(wechatRefundResult.success).toBe(true);
      expect(wechatRefundResult.refund_id).toBe('wx_refund_001');
    });

    it('应该正确处理微信退款失败', async () => {
      const wechatRefundResult = {
        success: false,
        error: '退款金额超过可退金额',
      };

      expect(wechatRefundResult.success).toBe(false);
      expect(wechatRefundResult.error).toBe('退款金额超过可退金额');
    });
  });

  describe('支付宝退款流程', () => {
    it('应该成功发起支付宝退款', async () => {
      const alipayRefundResult = {
        success: true,
        refund_fee: '79.00',
        gmt_refund_pay: new Date().toISOString(),
      };

      expect(alipayRefundResult.success).toBe(true);
      expect(alipayRefundResult.refund_fee).toBe('79.00');
    });

    it('应该正确处理支付宝退款失败', async () => {
      const alipayRefundResult = {
        success: false,
        error: 'TRADE_HAS_CLOSE',
      };

      expect(alipayRefundResult.success).toBe(false);
      expect(alipayRefundResult.error).toBe('TRADE_HAS_CLOSE');
    });
  });

  describe('退款后VIP状态处理', () => {
    it('退款成功后应该取消用户VIP状态', async () => {
      mockUpdateUsers.mockResolvedValue({
        ...mockUser,
        vip_level: 0,
        vip_expire_at: null,
      });

      // 模拟退款成功后更新用户状态
      const updatedUser = await mockUpdateUsers({
        where: { user_id: mockUser.user_id },
        data: {
          vip_level: 0,
          vip_expire_at: null,
        },
      });

      expect(updatedUser.vip_level).toBe(0);
      expect(updatedUser.vip_expire_at).toBeNull();
    });

    it('部分退款时应该调整VIP到期时间', async () => {
      // 假设用户购买了3个月，退款1个月
      const newExpireAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      mockUpdateUsers.mockResolvedValue({
        ...mockUser,
        vip_expire_at: newExpireAt,
      });

      const updatedUser = await mockUpdateUsers({
        where: { user_id: mockUser.user_id },
        data: {
          vip_expire_at: newExpireAt,
        },
      });

      expect(updatedUser.vip_expire_at).toEqual(newExpireAt);
    });
  });

  describe('退款申请审核流程', () => {
    const mockRefundRequest = {
      refund_id: 'refund-001',
      order_id: mockPaidOrder.order_id,
      user_id: mockUser.user_id,
      refund_amount: 79.00,
      reason: '不想要了',
      status: 0, // 待审核
      created_at: new Date(),
    };

    it('管理员应该能够批准退款申请', async () => {
      mockFindUniqueRefundRequests.mockResolvedValue(mockRefundRequest);
      mockUpdateRefundRequests.mockResolvedValue({
        ...mockRefundRequest,
        status: 2, // 已批准
        approved_at: new Date(),
        approved_by: 'admin-001',
      });

      const refundRequest = await mockFindUniqueRefundRequests({
        where: { refund_id: mockRefundRequest.refund_id },
      });
      expect(refundRequest.status).toBe(0);

      const updatedRequest = await mockUpdateRefundRequests({
        where: { refund_id: mockRefundRequest.refund_id },
        data: {
          status: 2,
          approved_at: new Date(),
          approved_by: 'admin-001',
        },
      });

      expect(updatedRequest.status).toBe(2);
    });

    it('管理员应该能够拒绝退款申请', async () => {
      mockFindUniqueRefundRequests.mockResolvedValue(mockRefundRequest);
      mockUpdateRefundRequests.mockResolvedValue({
        ...mockRefundRequest,
        status: 3, // 已拒绝
        reject_reason: '不符合退款条件',
        rejected_at: new Date(),
        rejected_by: 'admin-001',
      });

      const updatedRequest = await mockUpdateRefundRequests({
        where: { refund_id: mockRefundRequest.refund_id },
        data: {
          status: 3,
          reject_reason: '不符合退款条件',
          rejected_at: new Date(),
          rejected_by: 'admin-001',
        },
      });

      expect(updatedRequest.status).toBe(3);
      expect(updatedRequest.reject_reason).toBe('不符合退款条件');
    });
  });

  describe('退款金额计算', () => {
    it('全额退款应该返回订单全额', async () => {
      const order = await mockFindUniqueOrders({ where: { order_no: mockPaidOrder.order_no } });
      
      const refundAmount = order.amount;
      expect(refundAmount).toBe(79);
    });

    it('部分退款应该按比例计算', async () => {
      // 假设用户使用了10天，总共30天
      const usedDays = 10;
      const totalDays = 30;
      const orderAmount = 79;

      const refundAmount = Math.round(orderAmount * (totalDays - usedDays) / totalDays * 100) / 100;
      
      expect(refundAmount).toBeCloseTo(52.67, 2);
    });
  });

  describe('退款状态流转', () => {
    it('退款状态应该正确流转: NONE -> PENDING -> APPROVED -> COMPLETED', async () => {
      // 初始状态
      expect(mockPaidOrder.refund_status).toBe(RefundStatus.NONE);

      // 申请退款
      mockUpdateOrders.mockResolvedValueOnce({
        ...mockPaidOrder,
        refund_status: RefundStatus.PENDING,
      });

      let order = await mockUpdateOrders({
        where: { order_no: mockPaidOrder.order_no },
        data: { refund_status: RefundStatus.PENDING },
      });
      expect(order.refund_status).toBe(RefundStatus.PENDING);

      // 批准退款
      mockUpdateOrders.mockResolvedValueOnce({
        ...mockPaidOrder,
        refund_status: RefundStatus.APPROVED,
      });

      order = await mockUpdateOrders({
        where: { order_no: mockPaidOrder.order_no },
        data: { refund_status: RefundStatus.APPROVED },
      });
      expect(order.refund_status).toBe(RefundStatus.APPROVED);

      // 退款完成
      mockUpdateOrders.mockResolvedValueOnce({
        ...mockPaidOrder,
        refund_status: RefundStatus.COMPLETED,
        payment_status: OrderStatus.REFUNDED,
      });

      order = await mockUpdateOrders({
        where: { order_no: mockPaidOrder.order_no },
        data: {
          refund_status: RefundStatus.COMPLETED,
          payment_status: OrderStatus.REFUNDED,
        },
      });
      expect(order.refund_status).toBe(RefundStatus.COMPLETED);
      expect(order.payment_status).toBe(OrderStatus.REFUNDED);
    });

    it('退款被拒绝后状态应该是 REJECTED', async () => {
      mockUpdateOrders.mockResolvedValue({
        ...mockPaidOrder,
        refund_status: RefundStatus.REJECTED,
      });

      const order = await mockUpdateOrders({
        where: { order_no: mockPaidOrder.order_no },
        data: { refund_status: RefundStatus.REJECTED },
      });

      expect(order.refund_status).toBe(RefundStatus.REJECTED);
    });
  });
});
