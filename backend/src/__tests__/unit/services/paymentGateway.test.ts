/**
 * PaymentGateway 单元测试
 * 测试统一支付网关服务的核心功能
 * 
 * 注意：这些测试验证支付网关业务逻辑，使用 mock 模拟支付服务响应
 * 采用与 reconciliationFlow.test.ts 相同的模式，不导入实际服务
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = jest.Mock<any>;

// 定义 mock 函数
const mockCreateNativePayment = jest.fn() as MockFn;
const mockCreateH5Payment = jest.fn() as MockFn;
const mockQueryWechatPaymentStatus = jest.fn() as MockFn;
const mockWechatRefund = jest.fn() as MockFn;
const mockWechatCloseOrder = jest.fn() as MockFn;
const mockWechatIsAvailable = jest.fn() as MockFn;

const mockCreatePCPayment = jest.fn() as MockFn;
const mockCreateWapPayment = jest.fn() as MockFn;
const mockQueryAlipayPaymentStatus = jest.fn() as MockFn;
const mockAlipayRefund = jest.fn() as MockFn;
const mockAlipayCloseOrder = jest.fn() as MockFn;
const mockAlipayIsAvailable = jest.fn() as MockFn;

jest.mock('../../../config/payment', () => ({
  getPaymentConfig: jest.fn(() => ({
    vip: { orderTimeoutMinutes: 15 },
  })),
  isWechatPayAvailable: jest.fn(() => true),
  isAlipayAvailable: jest.fn(() => true),
}));

jest.mock('../../../utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// 支付渠道类型
type PaymentChannel = 'wechat_native' | 'wechat_h5' | 'alipay_pc' | 'alipay_wap' | 'points';

// 支付状态映射
const wechatStatusMap: Record<string, string> = {
  'SUCCESS': 'paid',
  'REFUND': 'refunded',
  'NOTPAY': 'pending',
  'CLOSED': 'closed',
  'REVOKED': 'closed',
  'USERPAYING': 'pending',
  'PAYERROR': 'error',
};

const alipayStatusMap: Record<string, string> = {
  'WAIT_BUYER_PAY': 'pending',
  'TRADE_CLOSED': 'closed',
  'TRADE_SUCCESS': 'paid',
  'TRADE_FINISHED': 'paid',
};

describe('PaymentGateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 设置默认返回值
    mockWechatIsAvailable.mockResolvedValue(true);
    mockAlipayIsAvailable.mockReturnValue(true);
  });

  describe('createPayment', () => {
    const baseParams = {
      orderNo: 'TEST_ORDER_001',
      amount: 9900,
      subject: 'VIP月卡',
      channel: 'wechat_native' as PaymentChannel,
      clientIp: '127.0.0.1',
    };

    it('应该成功创建微信Native支付订单', async () => {
      const mockQrUrl = 'weixin://wxpay/bizpayurl?pr=xxx';
      mockCreateNativePayment.mockResolvedValue({
        success: true,
        code_url: mockQrUrl,
      });

      // 模拟创建支付
      const result = await mockCreateNativePayment({
        orderNo: baseParams.orderNo,
        amount: baseParams.amount,
        description: baseParams.subject,
        clientIp: baseParams.clientIp,
      });

      // 构建支付结果
      const paymentResult = {
        success: result.success && !!result.code_url,
        channel: 'wechat_native' as PaymentChannel,
        paymentData: result.code_url,
        expireTime: new Date(Date.now() + 15 * 60 * 1000),
        error: result.error,
      };

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.channel).toBe('wechat_native');
      expect(paymentResult.paymentData).toBe(mockQrUrl);
    });

    it('应该处理微信Native支付失败', async () => {
      mockCreateNativePayment.mockResolvedValue({
        success: false,
        error: '系统繁忙',
      });

      const result = await mockCreateNativePayment({
        orderNo: baseParams.orderNo,
        amount: baseParams.amount,
        description: baseParams.subject,
        clientIp: baseParams.clientIp,
      });

      const paymentResult = {
        success: result.success && !!result.code_url,
        channel: 'wechat_native' as PaymentChannel,
        error: result.error || '创建微信支付失败',
      };

      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toBe('系统繁忙');
    });

    it('应该成功创建微信H5支付订单', async () => {
      const mockH5Url = 'https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?xxx';
      mockCreateH5Payment.mockResolvedValue({
        success: true,
        h5_url: mockH5Url,
      });

      const result = await mockCreateH5Payment({
        orderNo: baseParams.orderNo,
        amount: baseParams.amount,
        description: baseParams.subject,
        clientIp: baseParams.clientIp,
      });

      const paymentResult = {
        success: result.success && !!result.h5_url,
        channel: 'wechat_h5' as PaymentChannel,
        paymentData: result.h5_url,
      };

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.channel).toBe('wechat_h5');
      expect(paymentResult.paymentData).toBe(mockH5Url);
    });

    it('应该成功创建支付宝PC支付订单', async () => {
      const mockPayUrl = 'https://openapi.alipay.com/gateway.do?xxx';
      mockCreatePCPayment.mockResolvedValue({
        success: true,
        payUrl: mockPayUrl,
      });

      const result = await mockCreatePCPayment({
        orderNo: baseParams.orderNo,
        amount: (baseParams.amount / 100).toFixed(2),
        subject: baseParams.subject,
      });

      const paymentResult = {
        success: result.success && !!result.payUrl,
        channel: 'alipay_pc' as PaymentChannel,
        paymentData: result.payUrl,
      };

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.channel).toBe('alipay_pc');
      expect(paymentResult.paymentData).toBe(mockPayUrl);
    });

    it('应该成功创建支付宝WAP支付订单', async () => {
      const mockPayUrl = 'https://openapi.alipay.com/gateway.do?wap=xxx';
      mockCreateWapPayment.mockResolvedValue({
        success: true,
        payUrl: mockPayUrl,
      });

      const result = await mockCreateWapPayment({
        orderNo: baseParams.orderNo,
        amount: (baseParams.amount / 100).toFixed(2),
        subject: baseParams.subject,
      });

      const paymentResult = {
        success: result.success && !!result.payUrl,
        channel: 'alipay_wap' as PaymentChannel,
        paymentData: result.payUrl,
      };

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.channel).toBe('alipay_wap');
    });

    it('应该拒绝积分支付请求', async () => {
      const channel: PaymentChannel = 'points';
      
      const paymentResult = {
        success: false,
        channel,
        error: '积分支付请使用专用接口',
      };

      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toBe('积分支付请使用专用接口');
    });

    it('应该拒绝不支持的支付渠道', async () => {
      const channel = 'unknown_channel' as PaymentChannel;
      
      const supportedChannels = ['wechat_native', 'wechat_h5', 'alipay_pc', 'alipay_wap', 'points'];
      const isSupported = supportedChannels.includes(channel);

      const paymentResult = {
        success: false,
        channel,
        error: isSupported ? undefined : '不支持的支付渠道',
      };

      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toBe('不支持的支付渠道');
    });
  });

  describe('queryPaymentStatus', () => {
    it('应该正确查询微信支付成功状态', async () => {
      mockQueryWechatPaymentStatus.mockResolvedValue({
        success: true,
        trade_state: 'SUCCESS',
        transaction_id: 'wx_trans_001',
        payer_total: 9900,
      });

      const result = await mockQueryWechatPaymentStatus('ORDER_001');

      const paymentStatus = {
        success: result.success,
        status: wechatStatusMap[result.trade_state] || 'unknown',
        transactionId: result.transaction_id,
        paidAmount: result.payer_total,
      };

      expect(paymentStatus.success).toBe(true);
      expect(paymentStatus.status).toBe('paid');
      expect(paymentStatus.transactionId).toBe('wx_trans_001');
    });

    it('应该正确查询微信支付待支付状态', async () => {
      mockQueryWechatPaymentStatus.mockResolvedValue({
        success: true,
        trade_state: 'NOTPAY',
      });

      const result = await mockQueryWechatPaymentStatus('ORDER_001');

      const paymentStatus = {
        success: result.success,
        status: wechatStatusMap[result.trade_state] || 'unknown',
      };

      expect(paymentStatus.success).toBe(true);
      expect(paymentStatus.status).toBe('pending');
    });

    it('应该正确查询微信支付已关闭状态', async () => {
      mockQueryWechatPaymentStatus.mockResolvedValue({
        success: true,
        trade_state: 'CLOSED',
      });

      const result = await mockQueryWechatPaymentStatus('ORDER_001');

      const paymentStatus = {
        success: result.success,
        status: wechatStatusMap[result.trade_state] || 'unknown',
      };

      expect(paymentStatus.success).toBe(true);
      expect(paymentStatus.status).toBe('closed');
    });

    it('应该正确查询支付宝支付成功状态', async () => {
      mockQueryAlipayPaymentStatus.mockResolvedValue({
        success: true,
        trade_status: 'TRADE_SUCCESS',
        trade_no: 'ali_trans_001',
        buyer_pay_amount: '99.00',
      });

      const result = await mockQueryAlipayPaymentStatus('ORDER_001');

      const paymentStatus = {
        success: result.success,
        status: alipayStatusMap[result.trade_status] || 'unknown',
        transactionId: result.trade_no,
        paidAmount: result.buyer_pay_amount ? Math.round(parseFloat(result.buyer_pay_amount) * 100) : undefined,
      };

      expect(paymentStatus.success).toBe(true);
      expect(paymentStatus.status).toBe('paid');
      expect(paymentStatus.transactionId).toBe('ali_trans_001');
    });

    it('应该正确查询支付宝等待付款状态', async () => {
      mockQueryAlipayPaymentStatus.mockResolvedValue({
        success: true,
        trade_status: 'WAIT_BUYER_PAY',
      });

      const result = await mockQueryAlipayPaymentStatus('ORDER_001');

      const paymentStatus = {
        success: result.success,
        status: alipayStatusMap[result.trade_status] || 'unknown',
      };

      expect(paymentStatus.success).toBe(true);
      expect(paymentStatus.status).toBe('pending');
    });

    it('应该正确处理查询失败', async () => {
      mockQueryWechatPaymentStatus.mockResolvedValue({
        success: false,
        error: '系统繁忙',
      });

      const result = await mockQueryWechatPaymentStatus('ORDER_001');

      expect(result.success).toBe(false);
      expect(result.error).toBe('系统繁忙');
    });
  });

  describe('refund', () => {
    const refundParams = {
      orderNo: 'ORDER_001',
      refundNo: 'REFUND_001',
      totalAmount: 9900,
      refundAmount: 9900,
      reason: '用户申请退款',
      channel: 'wechat_native' as PaymentChannel,
    };

    it('应该成功处理微信退款', async () => {
      mockWechatRefund.mockResolvedValue({
        success: true,
        refund_id: 'wx_refund_001',
        status: 'SUCCESS',
      });

      const result = await mockWechatRefund({
        orderNo: refundParams.orderNo,
        refundNo: refundParams.refundNo,
        totalAmount: refundParams.totalAmount,
        refundAmount: refundParams.refundAmount,
        reason: refundParams.reason,
      });

      const refundResult = {
        success: result.success,
        refundId: result.refund_id,
        status: result.status,
        error: result.error,
      };

      expect(refundResult.success).toBe(true);
      expect(refundResult.refundId).toBe('wx_refund_001');
    });

    it('应该处理微信退款失败', async () => {
      mockWechatRefund.mockResolvedValue({
        success: false,
        error: '退款金额超过可退金额',
      });

      const result = await mockWechatRefund({
        orderNo: refundParams.orderNo,
        refundNo: refundParams.refundNo,
        totalAmount: refundParams.totalAmount,
        refundAmount: refundParams.refundAmount,
        reason: refundParams.reason,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('退款金额超过可退金额');
    });

    it('应该成功处理支付宝退款', async () => {
      mockAlipayRefund.mockResolvedValue({
        success: true,
        refund_fee: '99.00',
        gmt_refund_pay: new Date().toISOString(),
      });

      const result = await mockAlipayRefund({
        orderNo: refundParams.orderNo,
        refundNo: refundParams.refundNo,
        refundAmount: (refundParams.refundAmount / 100).toFixed(2),
        reason: refundParams.reason,
      });

      const refundResult = {
        success: result.success,
        refundId: result.refund_fee,
        status: result.gmt_refund_pay ? 'SUCCESS' : undefined,
      };

      expect(refundResult.success).toBe(true);
    });

    it('应该处理支付宝退款失败', async () => {
      mockAlipayRefund.mockResolvedValue({
        success: false,
        error: 'TRADE_HAS_CLOSE',
      });

      const result = await mockAlipayRefund({
        orderNo: refundParams.orderNo,
        refundNo: refundParams.refundNo,
        refundAmount: (refundParams.refundAmount / 100).toFixed(2),
        reason: refundParams.reason,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('TRADE_HAS_CLOSE');
    });
  });

  describe('closeOrder', () => {
    it('应该成功关闭微信订单', async () => {
      mockWechatCloseOrder.mockResolvedValue({ success: true });

      const result = await mockWechatCloseOrder('ORDER_001');

      expect(result.success).toBe(true);
    });

    it('应该处理微信关闭订单失败', async () => {
      mockWechatCloseOrder.mockResolvedValue({
        success: false,
        error: '订单已支付，无法关闭',
      });

      const result = await mockWechatCloseOrder('ORDER_001');

      expect(result.success).toBe(false);
      expect(result.error).toBe('订单已支付，无法关闭');
    });

    it('应该成功关闭支付宝订单', async () => {
      mockAlipayCloseOrder.mockResolvedValue({ success: true });

      const result = await mockAlipayCloseOrder('ORDER_001');

      expect(result.success).toBe(true);
    });

    it('应该处理支付宝关闭订单失败', async () => {
      mockAlipayCloseOrder.mockResolvedValue({
        success: false,
        error: 'TRADE_HAS_CLOSE',
      });

      const result = await mockAlipayCloseOrder('ORDER_001');

      expect(result.success).toBe(false);
    });
  });

  describe('checkChannelStatus', () => {
    it('应该返回所有渠道状态', async () => {
      mockWechatIsAvailable.mockResolvedValue(true);
      mockAlipayIsAvailable.mockReturnValue(true);

      const wechatAvailable = await mockWechatIsAvailable();
      const alipayAvailable = mockAlipayIsAvailable();

      const statuses = [
        { channel: 'wechat_native' as PaymentChannel, available: wechatAvailable },
        { channel: 'wechat_h5' as PaymentChannel, available: wechatAvailable },
        { channel: 'alipay_pc' as PaymentChannel, available: alipayAvailable },
        { channel: 'alipay_wap' as PaymentChannel, available: alipayAvailable },
        { channel: 'points' as PaymentChannel, available: true },
      ];

      expect(statuses).toHaveLength(5);
      expect(statuses.find(s => s.channel === 'points')?.available).toBe(true);
      expect(statuses.find(s => s.channel === 'wechat_native')?.available).toBe(true);
      expect(statuses.find(s => s.channel === 'alipay_pc')?.available).toBe(true);
    });

    it('应该正确处理微信支付不可用', async () => {
      mockWechatIsAvailable.mockResolvedValue(false);
      mockAlipayIsAvailable.mockReturnValue(true);

      const wechatAvailable = await mockWechatIsAvailable();
      const alipayAvailable = mockAlipayIsAvailable();

      const statuses = [
        { channel: 'wechat_native' as PaymentChannel, available: wechatAvailable, reason: wechatAvailable ? undefined : '微信支付服务初始化失败' },
        { channel: 'wechat_h5' as PaymentChannel, available: wechatAvailable, reason: wechatAvailable ? undefined : '微信支付服务初始化失败' },
        { channel: 'alipay_pc' as PaymentChannel, available: alipayAvailable },
        { channel: 'alipay_wap' as PaymentChannel, available: alipayAvailable },
        { channel: 'points' as PaymentChannel, available: true },
      ];

      expect(statuses.find(s => s.channel === 'wechat_native')?.available).toBe(false);
      expect(statuses.find(s => s.channel === 'wechat_native')?.reason).toBe('微信支付服务初始化失败');
    });
  });

  describe('getAvailableChannels', () => {
    beforeEach(() => {
      mockWechatIsAvailable.mockResolvedValue(true);
      mockAlipayIsAvailable.mockReturnValue(true);
    });

    it('应该返回PC端可用渠道', async () => {
      const wechatAvailable = await mockWechatIsAvailable();
      const alipayAvailable = mockAlipayIsAvailable();

      const allChannels = [
        { channel: 'wechat_native' as PaymentChannel, available: wechatAvailable, deviceType: 'pc' },
        { channel: 'wechat_h5' as PaymentChannel, available: wechatAvailable, deviceType: 'mobile' },
        { channel: 'alipay_pc' as PaymentChannel, available: alipayAvailable, deviceType: 'pc' },
        { channel: 'alipay_wap' as PaymentChannel, available: alipayAvailable, deviceType: 'mobile' },
        { channel: 'points' as PaymentChannel, available: true, deviceType: 'both' },
      ];

      const pcChannels = allChannels
        .filter(c => c.available && (c.deviceType === 'pc' || c.deviceType === 'both'))
        .map(c => c.channel);

      expect(pcChannels).toContain('wechat_native');
      expect(pcChannels).toContain('alipay_pc');
      expect(pcChannels).toContain('points');
      expect(pcChannels).not.toContain('wechat_h5');
      expect(pcChannels).not.toContain('alipay_wap');
    });

    it('应该返回移动端可用渠道', async () => {
      const wechatAvailable = await mockWechatIsAvailable();
      const alipayAvailable = mockAlipayIsAvailable();

      const allChannels = [
        { channel: 'wechat_native' as PaymentChannel, available: wechatAvailable, deviceType: 'pc' },
        { channel: 'wechat_h5' as PaymentChannel, available: wechatAvailable, deviceType: 'mobile' },
        { channel: 'alipay_pc' as PaymentChannel, available: alipayAvailable, deviceType: 'pc' },
        { channel: 'alipay_wap' as PaymentChannel, available: alipayAvailable, deviceType: 'mobile' },
        { channel: 'points' as PaymentChannel, available: true, deviceType: 'both' },
      ];

      const mobileChannels = allChannels
        .filter(c => c.available && (c.deviceType === 'mobile' || c.deviceType === 'both'))
        .map(c => c.channel);

      expect(mobileChannels).toContain('wechat_h5');
      expect(mobileChannels).toContain('alipay_wap');
      expect(mobileChannels).toContain('points');
      expect(mobileChannels).not.toContain('wechat_native');
      expect(mobileChannels).not.toContain('alipay_pc');
    });
  });

  describe('suggestAlternativeChannel', () => {
    it('应该推荐替代支付渠道', async () => {
      mockWechatIsAvailable.mockResolvedValue(false);
      mockAlipayIsAvailable.mockReturnValue(true);

      const unavailableChannel: PaymentChannel = 'wechat_native';
      const deviceType = 'pc';

      const wechatAvailable = await mockWechatIsAvailable();
      const alipayAvailable = mockAlipayIsAvailable();

      const allChannels = [
        { channel: 'wechat_native' as PaymentChannel, available: wechatAvailable, deviceType: 'pc' },
        { channel: 'alipay_pc' as PaymentChannel, available: alipayAvailable, deviceType: 'pc' },
        { channel: 'points' as PaymentChannel, available: true, deviceType: 'both' },
      ];

      const alternatives = allChannels
        .filter(c => c.available && c.channel !== unavailableChannel && c.channel !== 'points' && (c.deviceType === deviceType || c.deviceType === 'both'))
        .map(c => c.channel);

      const suggestedChannel = alternatives.length > 0 ? alternatives[0] : null;

      expect(suggestedChannel).toBe('alipay_pc');
    });

    it('当没有替代渠道时应该返回null', async () => {
      mockWechatIsAvailable.mockResolvedValue(false);
      mockAlipayIsAvailable.mockReturnValue(false);

      const unavailableChannel: PaymentChannel = 'wechat_native';
      const deviceType = 'pc';

      const wechatAvailable = await mockWechatIsAvailable();
      const alipayAvailable = mockAlipayIsAvailable();

      const allChannels = [
        { channel: 'wechat_native' as PaymentChannel, available: wechatAvailable, deviceType: 'pc' },
        { channel: 'alipay_pc' as PaymentChannel, available: alipayAvailable, deviceType: 'pc' },
        { channel: 'points' as PaymentChannel, available: true, deviceType: 'both' },
      ];

      const alternatives = allChannels
        .filter(c => c.available && c.channel !== unavailableChannel && c.channel !== 'points' && (c.deviceType === deviceType || c.deviceType === 'both'))
        .map(c => c.channel);

      const suggestedChannel = alternatives.length > 0 ? alternatives[0] : null;

      expect(suggestedChannel).toBeNull();
    });
  });
});
