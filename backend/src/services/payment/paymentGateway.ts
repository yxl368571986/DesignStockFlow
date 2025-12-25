/**
 * 统一支付网关服务
 * 封装微信支付和支付宝支付，提供统一的支付接口
 */

import { wechatPayService } from './wechatPay';
import { alipayService } from './alipay';
import { getPaymentConfig, isWechatPayAvailable, isAlipayAvailable } from '../../config/payment';

// 支付渠道类型
export type PaymentChannel = 'wechat_native' | 'wechat_h5' | 'alipay_pc' | 'alipay_wap' | 'points';

// 统一支付结果
export interface PaymentResult {
  success: boolean;
  channel: PaymentChannel;
  paymentData?: string;      // 二维码URL / 跳转URL / 表单HTML
  expireTime?: Date;
  error?: string;
}

// 统一支付状态
export interface PaymentStatus {
  success: boolean;
  status: 'pending' | 'paid' | 'closed' | 'refunded' | 'error' | 'unknown';
  transactionId?: string;
  paidAmount?: number;       // 单位：分
  paidAt?: Date;
  error?: string;
}

// 统一退款结果
export interface RefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  error?: string;
}

// 渠道状态
export interface ChannelStatus {
  channel: PaymentChannel;
  available: boolean;
  reason?: string;
}

// 创建支付参数
export interface CreatePaymentParams {
  orderNo: string;
  amount: number;            // 单位：分
  subject: string;
  channel: PaymentChannel;
  clientIp: string;
  returnUrl?: string;
  quitUrl?: string;
}

// 退款参数
export interface RefundParams {
  orderNo: string;
  refundNo: string;
  totalAmount: number;       // 原订单金额（分）
  refundAmount: number;      // 退款金额（分）
  reason?: string;
  channel: PaymentChannel;
}

class PaymentGateway {
  /**
   * 创建支付订单
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const config = getPaymentConfig();
    const expireTime = new Date(Date.now() + config.vip.orderTimeoutMinutes * 60 * 1000);

    switch (params.channel) {
      case 'wechat_native':
        return this.createWechatNativePayment(params, expireTime);
      case 'wechat_h5':
        return this.createWechatH5Payment(params, expireTime);
      case 'alipay_pc':
        return this.createAlipayPCPayment(params, expireTime);
      case 'alipay_wap':
        return this.createAlipayWapPayment(params, expireTime);
      case 'points':
        return { success: false, channel: params.channel, error: '积分支付请使用专用接口' };
      default:
        return { success: false, channel: params.channel, error: '不支持的支付渠道' };
    }
  }

  /**
   * 微信Native支付
   */
  private async createWechatNativePayment(params: CreatePaymentParams, expireTime: Date): Promise<PaymentResult> {
    const result = await wechatPayService.createNativePayment({
      orderNo: params.orderNo,
      amount: params.amount,
      description: params.subject,
      clientIp: params.clientIp,
    });

    if (result.success && result.code_url) {
      return {
        success: true,
        channel: 'wechat_native',
        paymentData: result.code_url,
        expireTime,
      };
    }

    return {
      success: false,
      channel: 'wechat_native',
      error: result.error || '创建微信支付失败',
    };
  }

  /**
   * 微信H5支付
   */
  private async createWechatH5Payment(params: CreatePaymentParams, expireTime: Date): Promise<PaymentResult> {
    const result = await wechatPayService.createH5Payment({
      orderNo: params.orderNo,
      amount: params.amount,
      description: params.subject,
      clientIp: params.clientIp,
      returnUrl: params.returnUrl,
    });

    if (result.success && result.h5_url) {
      return {
        success: true,
        channel: 'wechat_h5',
        paymentData: result.h5_url,
        expireTime,
      };
    }

    return {
      success: false,
      channel: 'wechat_h5',
      error: result.error || '创建微信H5支付失败',
    };
  }

  /**
   * 支付宝PC支付
   */
  private async createAlipayPCPayment(params: CreatePaymentParams, expireTime: Date): Promise<PaymentResult> {
    // 金额转换：分 -> 元
    const amountYuan = (params.amount / 100).toFixed(2);

    const result = await alipayService.createPCPayment({
      orderNo: params.orderNo,
      amount: amountYuan,
      subject: params.subject,
      returnUrl: params.returnUrl,
    });

    if (result.success && result.payUrl) {
      return {
        success: true,
        channel: 'alipay_pc',
        paymentData: result.payUrl,
        expireTime,
      };
    }

    return {
      success: false,
      channel: 'alipay_pc',
      error: result.error || '创建支付宝支付失败',
    };
  }

  /**
   * 支付宝WAP支付
   */
  private async createAlipayWapPayment(params: CreatePaymentParams, expireTime: Date): Promise<PaymentResult> {
    const amountYuan = (params.amount / 100).toFixed(2);

    const result = await alipayService.createWapPayment({
      orderNo: params.orderNo,
      amount: amountYuan,
      subject: params.subject,
      returnUrl: params.returnUrl,
      quitUrl: params.quitUrl,
    });

    if (result.success && result.payUrl) {
      return {
        success: true,
        channel: 'alipay_wap',
        paymentData: result.payUrl,
        expireTime,
      };
    }

    return {
      success: false,
      channel: 'alipay_wap',
      error: result.error || '创建支付宝WAP支付失败',
    };
  }

  /**
   * 查询支付状态
   */
  async queryPaymentStatus(orderNo: string, channel: PaymentChannel): Promise<PaymentStatus> {
    if (channel === 'wechat_native' || channel === 'wechat_h5') {
      return this.queryWechatStatus(orderNo);
    } else if (channel === 'alipay_pc' || channel === 'alipay_wap') {
      return this.queryAlipayStatus(orderNo);
    }

    return { success: false, status: 'unknown', error: '不支持的支付渠道' };
  }

  /**
   * 查询微信支付状态
   */
  private async queryWechatStatus(orderNo: string): Promise<PaymentStatus> {
    const result = await wechatPayService.queryPaymentStatus(orderNo);

    if (!result.success) {
      return { success: false, status: 'error', error: result.error };
    }

    const statusMap: Record<string, PaymentStatus['status']> = {
      'SUCCESS': 'paid',
      'REFUND': 'refunded',
      'NOTPAY': 'pending',
      'CLOSED': 'closed',
      'REVOKED': 'closed',
      'USERPAYING': 'pending',
      'PAYERROR': 'error',
    };

    return {
      success: true,
      status: statusMap[result.trade_state] || 'unknown',
      transactionId: result.transaction_id,
      paidAmount: result.payer_total,
      paidAt: result.success_time ? new Date(result.success_time) : undefined,
    };
  }

  /**
   * 查询支付宝支付状态
   */
  private async queryAlipayStatus(orderNo: string): Promise<PaymentStatus> {
    const result = await alipayService.queryPaymentStatus(orderNo);

    if (!result.success) {
      return { success: false, status: 'error', error: result.error };
    }

    const statusMap: Record<string, PaymentStatus['status']> = {
      'WAIT_BUYER_PAY': 'pending',
      'TRADE_CLOSED': 'closed',
      'TRADE_SUCCESS': 'paid',
      'TRADE_FINISHED': 'paid',
    };

    return {
      success: true,
      status: statusMap[result.trade_status] || 'unknown',
      transactionId: result.trade_no,
      paidAmount: result.buyer_pay_amount ? Math.round(parseFloat(result.buyer_pay_amount) * 100) : undefined,
      paidAt: result.gmt_payment ? new Date(result.gmt_payment) : undefined,
    };
  }

  /**
   * 申请退款
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    if (params.channel === 'wechat_native' || params.channel === 'wechat_h5') {
      return this.wechatRefund(params);
    } else if (params.channel === 'alipay_pc' || params.channel === 'alipay_wap') {
      return this.alipayRefund(params);
    }

    return { success: false, error: '不支持的支付渠道' };
  }

  /**
   * 微信退款
   */
  private async wechatRefund(params: RefundParams): Promise<RefundResult> {
    const result = await wechatPayService.refund({
      orderNo: params.orderNo,
      refundNo: params.refundNo,
      totalAmount: params.totalAmount,
      refundAmount: params.refundAmount,
      reason: params.reason,
    });

    return {
      success: result.success,
      refundId: result.refund_id,
      status: result.status,
      error: result.error,
    };
  }

  /**
   * 支付宝退款
   */
  private async alipayRefund(params: RefundParams): Promise<RefundResult> {
    const refundAmountYuan = (params.refundAmount / 100).toFixed(2);

    const result = await alipayService.refund({
      orderNo: params.orderNo,
      refundNo: params.refundNo,
      refundAmount: refundAmountYuan,
      reason: params.reason,
    });

    return {
      success: result.success,
      refundId: result.refund_fee,
      status: result.gmt_refund_pay ? 'SUCCESS' : undefined,
      error: result.error,
    };
  }

  /**
   * 关闭订单
   */
  async closeOrder(orderNo: string, channel: PaymentChannel): Promise<{ success: boolean; error?: string }> {
    if (channel === 'wechat_native' || channel === 'wechat_h5') {
      return wechatPayService.closeOrder(orderNo);
    } else if (channel === 'alipay_pc' || channel === 'alipay_wap') {
      return alipayService.closeOrder(orderNo);
    }

    return { success: false, error: '不支持的支付渠道' };
  }

  /**
   * 检查支付渠道状态
   */
  async checkChannelStatus(): Promise<ChannelStatus[]> {
    const config = getPaymentConfig();
    const statuses: ChannelStatus[] = [];

    // 检查微信支付
    const wechatAvailable = isWechatPayAvailable(config);
    if (wechatAvailable) {
      const isReady = await wechatPayService.isAvailable();
      statuses.push({
        channel: 'wechat_native',
        available: isReady,
        reason: isReady ? undefined : '微信支付服务初始化失败',
      });
      statuses.push({
        channel: 'wechat_h5',
        available: isReady,
        reason: isReady ? undefined : '微信支付服务初始化失败',
      });
    } else {
      statuses.push({
        channel: 'wechat_native',
        available: false,
        reason: '微信支付配置不完整',
      });
      statuses.push({
        channel: 'wechat_h5',
        available: false,
        reason: '微信支付配置不完整',
      });
    }

    // 检查支付宝
    const alipayAvailable = isAlipayAvailable(config);
    if (alipayAvailable) {
      const isReady = alipayService.isAvailable();
      statuses.push({
        channel: 'alipay_pc',
        available: isReady,
        reason: isReady ? undefined : '支付宝服务初始化失败',
      });
      statuses.push({
        channel: 'alipay_wap',
        available: isReady,
        reason: isReady ? undefined : '支付宝服务初始化失败',
      });
    } else {
      statuses.push({
        channel: 'alipay_pc',
        available: false,
        reason: '支付宝配置不完整',
      });
      statuses.push({
        channel: 'alipay_wap',
        available: false,
        reason: '支付宝配置不完整',
      });
    }

    // 积分支付始终可用
    statuses.push({
      channel: 'points',
      available: true,
    });

    return statuses;
  }

  /**
   * 获取可用的支付渠道
   */
  async getAvailableChannels(deviceType: 'pc' | 'mobile'): Promise<PaymentChannel[]> {
    const statuses = await this.checkChannelStatus();
    const available: PaymentChannel[] = [];

    for (const status of statuses) {
      if (!status.available) continue;

      // 根据设备类型过滤
      if (deviceType === 'pc') {
        if (status.channel === 'wechat_native' || status.channel === 'alipay_pc' || status.channel === 'points') {
          available.push(status.channel);
        }
      } else {
        if (status.channel === 'wechat_h5' || status.channel === 'alipay_wap' || status.channel === 'points') {
          available.push(status.channel);
        }
      }
    }

    return available;
  }

  /**
   * 推荐支付渠道（当某渠道不可用时）
   */
  async suggestAlternativeChannel(unavailableChannel: PaymentChannel): Promise<PaymentChannel | null> {
    const deviceType = unavailableChannel.includes('native') || unavailableChannel.includes('pc') ? 'pc' : 'mobile';
    const available = await this.getAvailableChannels(deviceType);

    // 过滤掉不可用的渠道和积分支付
    const alternatives = available.filter(c => c !== unavailableChannel && c !== 'points');

    if (alternatives.length > 0) {
      return alternatives[0];
    }

    return null;
  }
}

// 导出单例
export const paymentGateway = new PaymentGateway();
export default paymentGateway;
