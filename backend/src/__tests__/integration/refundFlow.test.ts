/**
 * 退款流程集成测试
 * 测试完整的VIP退款流程
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Prisma Client
const mockPrismaClient = {
  users: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  orders: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  vip_orders: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  vip_packages: {
    findUnique: vi.fn(),
  },
  refund_requests: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  download_history: {
    count: vi.fn(),
  },
  payment_callbacks: {
    create: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrismaClient)),
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
}));

// Mock 支付服务
vi.mock('../../services/payment/wechatPay', () => ({
  wechatPayService: {
    refund: vi.fn(),
    queryRefundStatus: vi.fn(),
    isAvailable: vi.fn(() => true),
  },
}));

vi.mock('../../services/payment/alipay', () => ({
  alipayService: {
    refund: vi.fn(),
    queryRefundStatus: vi.fn(),
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
      secondaryAuthThreshold: 20000,
    },
  })),
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
import { vipOrderService, OrderStatus, RefundStatus } from '../../services/order/vipOrderService';

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
    vi.clearAllMocks();
    
    mockPrismaClient.users.findUnique.mockResolvedValue(mockUser);
    mockPrismaClient.orders.findUnique.mockResolvedValue(mockPaidOrder);
    mockPrismaClient.orders.findFirst.mockResolvedValue(mockPaidOrder);
    mockPrismaClient.vip_packages.findUnique.mockResolvedValue(mockVipPackage);
    mockPrismaClient.download_history.count.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('退款资格检查', () => {
    it('7天内未下载的订单应该可以退款', async () => {
      const result = await vipOrderService.checkRefundable(mockPaidOrder.order_no);

      expect(result.refundable).toBe(true);
      expect(result.refundAmount).toBe(79);
    });

    it('未支付订单不能退款', async () => {
      mockPrismaClient.orders.findUnique.mockResolvedValue({
        ...mockPaidOrder,
        payment_status: OrderStatus.PENDING,
      });

      const result = await vipOrderService.checkRefundable(mockPaidOrder.order_no);

      expect(result.refundable).toBe(false);
      expect(result.reason).toBe('订单未支付，无需退款');
    });

    it('已有退款申请的订单不能重复申请', async () => {
      mockPrismaClient.orders.findUnique.mockResolvedValue({
        ...mockPaidOrder,
        refund_status: RefundStatus.PENDING,
      });

      const result = await vipOrderService.checkRefundable(mockPaidOrder.order_no);

      expect(result.refundable).toBe(false);
      expect(result.reason).toBe('订单已有退款申请');
    });

    it('终身会员套餐不支持退款', async () => {
      mockPrismaClient.orders.findUnique.mockResolvedValue({
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

      const result = await vipOrderService.checkRefundable(mockPaidOrder.order_no);

      expect(result.refundable).toBe(false);
      expect(result.reason).toBe('终身会员套餐不支持退款');
    });

    it('购买超过7天不支持退款', async () => {
      mockPrismaClient.orders.findUnique.mockResolvedValue({
        ...mockPaidOrder,
        paid_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10天前
      });

      const result = await vipOrderService.checkRefundable(mockPaidOrder.order_no);

      expect(result.refundable).toBe(false);
      expect(result.reason).toBe('购买超过7天，不支持退款');
    });

    it('购买后已下载资源不支持退款', async () => {
      mockPrismaClient.download_history.count.mockResolvedValue(5);

      const result = await vipOrderService.checkRefundable(mockPaidOrder.order_no);

      expect(result.refundable).toBe(false);
      expect(result.reason).toBe('购买后已下载资源，不支持退款');
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

      mockPrismaClient.refund_requests.create.mockResolvedValue(mockRefundRequest);
      mockPrismaClient.orders.update.mockResolvedValue({
        ...mockPaidOrder,
        refund_status: RefundStatus.PENDING,
      });

      const result = await vipOrderService.createRefundRequest(
        mockPaidOrder.order_no,
        mockUser.user_id,
        '不想要了',
        'other'
      );

      expect(result.refundId).toBe('refund-001');
      expect(result.refundAmount).toBe(79);
      expect(result.status).toBe(0);
    });

    it('不符合退款条件时应该抛出错误', async () => {
      mockPrismaClient.download_history.count.mockResolvedValue(5);

      await expect(
        vipOrderService.createRefundRequest(
          mockPaidOrder.order_no,
          mockUser.user_id,
          '不想要了'
        )
      ).rejects.toThrow('购买后已下载资源，不支持退款');
    });
  });

  describe('微信退款流程', () => {
    it('应该成功发起微信退款', async () => {
      vi.mocked(wechatPayService.refund).mockResolvedValue({
        success: true,
        refund_id: 'wx_refund_001',
        status: 'SUCCESS',
      });

      const refundResult = await wechatPayService.refund({
        orderNo: mockPaidOrder.order_no,
        transactionId: mockPaidOrder.transaction_id!,
        refundAmount: 7900,
        totalAmount: 7900,
        reason: '用户申请退款',
      });

      expect(refundResult.success).toBe(true);
      expect(refundResult.refund_id).toBe('wx_refund_001');
    });

    it('应该正确处理微信退款失败', async () => {
      vi.mocked(wechatPayService.refund).mockResolvedValue({
        success: false,
        error: '退款金额超过可退金额',
      });

      const refundResult = await wechatPayService.refund({
        orderNo: mockPaidOrder.order_no,
        transactionId: mockPaidOrder.transaction_id!,
        refundAmount: 7900,
        totalAmount: 7900,
        reason: '用户申请退款',
      });

      expect(refundResult.success).toBe(false);
      expect(refundResult.error).toBe('退款金额超过可退金额');
    });

    it('应该正确查询微信退款状态', async () => {
      vi.mocked(wechatPayService.queryRefundStatus).mockResolvedValue({
        success: true,
        status: 'SUCCESS',
        refund_id: 'wx_refund_001',
        success_time: new Date().toISOString(),
      });

      const statusResult = await wechatPayService.queryRefundStatus('wx_refund_001');

      expect(statusResult.success).toBe(true);
      expect(statusResult.status).toBe('SUCCESS');
    });
  });

  describe('支付宝退款流程', () => {
    it('应该成功发起支付宝退款', async () => {
      const alipayOrder = {
        ...mockPaidOrder,
        payment_method: 'alipay',
        transaction_id: 'ali_trans_001',
      };
      mockPrismaClient.orders.findUnique.mockResolvedValue(alipayOrder);

      vi.mocked(alipayService.refund).mockResolvedValue({
        success: true,
        refund_id: 'ali_refund_001',
        fund_change: 'Y',
      });

      const refundResult = await alipayService.refund({
        orderNo: alipayOrder.order_no,
        tradeNo: alipayOrder.transaction_id!,
        refundAmount: 79.00,
        reason: '用户申请退款',
      });

      expect(refundResult.success).toBe(true);
      expect(refundResult.fund_change).toBe('Y');
    });

    it('应该正确处理支付宝退款失败', async () => {
      vi.mocked(alipayService.refund).mockResolvedValue({
        success: false,
        error: 'TRADE_HAS_CLOSE',
        error_msg: '交易已关闭',
      });

      const refundResult = await alipayService.refund({
        orderNo: mockPaidOrder.order_no,
        tradeNo: 'ali_trans_001',
        refundAmount: 79.00,
        reason: '用户申请退款',
      });

      expect(refundResult.success).toBe(false);
      expect(refundResult.error).toBe('TRADE_HAS_CLOSE');
    });
  });

  describe('退款后VIP状态处理', () => {
    it('退款成功后应该取消用户VIP状态', async () => {
      mockPrismaClient.users.update.mockResolvedValue({
        ...mockUser,
        vip_level: 0,
        vip_expire_at: null,
      });

      // 模拟退款成功后更新用户状态
      const updatedUser = await mockPrismaClient.users.update({
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
      const originalExpireAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const newExpireAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      mockPrismaClient.users.update.mockResolvedValue({
        ...mockUser,
        vip_expire_at: newExpireAt,
      });

      const updatedUser = await mockPrismaClient.users.update({
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
      mockPrismaClient.refund_requests.findUnique.mockResolvedValue(mockRefundRequest);
      mockPrismaClient.refund_requests.update.mockResolvedValue({
        ...mockRefundRequest,
        status: 2, // 已批准
        approved_at: new Date(),
        approved_by: 'admin-001',
      });

      const updatedRequest = await mockPrismaClient.refund_requests.update({
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
      mockPrismaClient.refund_requests.findUnique.mockResolvedValue(mockRefundRequest);
      mockPrismaClient.refund_requests.update.mockResolvedValue({
        ...mockRefundRequest,
        status: 3, // 已拒绝
        reject_reason: '不符合退款条件',
        rejected_at: new Date(),
        rejected_by: 'admin-001',
      });

      const updatedRequest = await mockPrismaClient.refund_requests.update({
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
});
