/**
 * PaymentGateway 单元测试
 * 测试统一支付网关服务的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 使用vitest的mock
vi.mock('../../../services/payment/wechatPay', () => ({
  wechatPayService: {
    createNativePayment: vi.fn(),
    createH5Payment: vi.fn(),
    queryPaymentStatus: vi.fn(),
    refund: vi.fn(),
    closeOrder: vi.fn(),
    isAvailable: vi.fn(),
  },
}));

vi.mock('../../../services/payment/alipay', () => ({
  alipayService: {
    createPCPayment: vi.fn(),
    createWapPayment: vi.fn(),
    queryPaymentStatus: vi.fn(),
    refund: vi.fn(),
    closeOrder: vi.fn(),
    isAvailable: vi.fn(),
  },
}));

vi.mock('../../../config/payment', () => ({
  getPaymentConfig: vi.fn(() => ({
    vip: { orderTimeoutMinutes: 15 },
  })),
  isWechatPayAvailable: vi.fn(() => true),
  isAlipayAvailable: vi.fn(() => true),
}));

import { wechatPayService } from '../../../services/payment/wechatPay';
import { alipayService } from '../../../services/payment/alipay';
import { paymentGateway, type PaymentChannel } from '../../../services/payment/paymentGateway';

describe('PaymentGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      vi.mocked(wechatPayService.createNativePayment).mockResolvedValue({
        success: true,
        code_url: mockQrUrl,
      });

      const result = await paymentGateway.createPayment({
        ...baseParams,
        channel: 'wechat_native',
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe('wechat_native');
      expect(result.paymentData).toBe(mockQrUrl);
    });

    it('应该处理微信Native支付失败', async () => {
      vi.mocked(wechatPayService.createNativePayment).mockResolvedValue({
        success: false,
        error: '系统繁忙',
      });

      const result = await paymentGateway.createPayment({
        ...baseParams,
        channel: 'wechat_native',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('系统繁忙');
    });

    it('应该成功创建支付宝PC支付订单', async () => {
      const mockPayUrl = 'https://openapi.alipay.com/gateway.do?xxx';
      vi.mocked(alipayService.createPCPayment).mockResolvedValue({
        success: true,
        payUrl: mockPayUrl,
      });

      const result = await paymentGateway.createPayment({
        ...baseParams,
        channel: 'alipay_pc',
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe('alipay_pc');
      expect(result.paymentData).toBe(mockPayUrl);
    });

    it('应该拒绝积分支付请求', async () => {
      const result = await paymentGateway.createPayment({
        ...baseParams,
        channel: 'points',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('积分支付请使用专用接口');
    });

    it('应该拒绝不支持的支付渠道', async () => {
      const result = await paymentGateway.createPayment({
        ...baseParams,
        channel: 'unknown_channel' as PaymentChannel,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('不支持的支付渠道');
    });
  });

  describe('queryPaymentStatus', () => {
    it('应该正确查询微信支付成功状态', async () => {
      vi.mocked(wechatPayService.queryPaymentStatus).mockResolvedValue({
        success: true,
        trade_state: 'SUCCESS',
        transaction_id: 'wx_trans_001',
        payer_total: 9900,
      });

      const result = await paymentGateway.queryPaymentStatus('ORDER_001', 'wechat_native');

      expect(result.success).toBe(true);
      expect(result.status).toBe('paid');
      expect(result.transactionId).toBe('wx_trans_001');
    });

    it('应该正确查询支付宝支付成功状态', async () => {
      vi.mocked(alipayService.queryPaymentStatus).mockResolvedValue({
        success: true,
        trade_status: 'TRADE_SUCCESS',
        trade_no: 'ali_trans_001',
        buyer_pay_amount: '99.00',
      });

      const result = await paymentGateway.queryPaymentStatus('ORDER_001', 'alipay_pc');

      expect(result.success).toBe(true);
      expect(result.status).toBe('paid');
      expect(result.transactionId).toBe('ali_trans_001');
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
      vi.mocked(wechatPayService.refund).mockResolvedValue({
        success: true,
        refund_id: 'wx_refund_001',
        status: 'SUCCESS',
      });

      const result = await paymentGateway.refund(refundParams);

      expect(result.success).toBe(true);
      expect(result.refundId).toBe('wx_refund_001');
    });

    it('应该成功处理支付宝退款', async () => {
      vi.mocked(alipayService.refund).mockResolvedValue({
        success: true,
        refund_fee: '99.00',
      });

      const result = await paymentGateway.refund({
        ...refundParams,
        channel: 'alipay_pc',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('closeOrder', () => {
    it('应该成功关闭微信订单', async () => {
      vi.mocked(wechatPayService.closeOrder).mockResolvedValue({ success: true });

      const result = await paymentGateway.closeOrder('ORDER_001', 'wechat_native');

      expect(result.success).toBe(true);
    });

    it('应该成功关闭支付宝订单', async () => {
      vi.mocked(alipayService.closeOrder).mockResolvedValue({ success: true });

      const result = await paymentGateway.closeOrder('ORDER_001', 'alipay_pc');

      expect(result.success).toBe(true);
    });
  });

  describe('checkChannelStatus', () => {
    it('应该返回所有渠道状态', async () => {
      vi.mocked(wechatPayService.isAvailable).mockResolvedValue(true);
      vi.mocked(alipayService.isAvailable).mockReturnValue(true);

      const statuses = await paymentGateway.checkChannelStatus();

      expect(statuses).toHaveLength(5);
      expect(statuses.find(s => s.channel === 'points')?.available).toBe(true);
    });
  });

  describe('getAvailableChannels', () => {
    beforeEach(() => {
      vi.mocked(wechatPayService.isAvailable).mockResolvedValue(true);
      vi.mocked(alipayService.isAvailable).mockReturnValue(true);
    });

    it('应该返回PC端可用渠道', async () => {
      const channels = await paymentGateway.getAvailableChannels('pc');

      expect(channels).toContain('wechat_native');
      expect(channels).toContain('alipay_pc');
      expect(channels).toContain('points');
    });

    it('应该返回移动端可用渠道', async () => {
      const channels = await paymentGateway.getAvailableChannels('mobile');

      expect(channels).toContain('wechat_h5');
      expect(channels).toContain('alipay_wap');
      expect(channels).toContain('points');
    });
  });
});
