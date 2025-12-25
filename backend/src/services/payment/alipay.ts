/**
 * 支付宝支付服务模块
 * 支持 PC网站支付 和 手机网站支付（WAP）
 */

import * as AlipaySdkModule from 'alipay-sdk';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AlipaySdk = (AlipaySdkModule as any).default || AlipaySdkModule;
import { getPaymentConfig, isAlipayAvailable } from '../../config/payment';
import logger from '../../utils/logger';
import crypto from 'crypto';

// 支付宝SDK配置类型
interface AlipaySdkConfig {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
  gateway?: string;
  signType?: 'RSA2' | 'RSA';
}

// 支付宝SDK响应类型
interface AlipayResponse {
  code?: string;
  msg?: string;
  subCode?: string;
  subMsg?: string;
  tradeStatus?: string;
  tradeNo?: string;
  buyerPayAmount?: string;
  gmtPayment?: string;
  refundFee?: string;
  gmtRefundPay?: string;
}

// 支付结果类型
export interface AlipayPayResult {
  success: boolean;
  formHtml?: string;      // PC网站支付表单HTML
  payUrl?: string;        // WAP支付跳转URL
  error?: string;
}

// 支付状态查询结果
export interface AlipayPayStatus {
  success: boolean;
  trade_status: 'WAIT_BUYER_PAY' | 'TRADE_CLOSED' | 'TRADE_SUCCESS' | 'TRADE_FINISHED' | 'UNKNOWN';
  trade_no?: string;
  buyer_pay_amount?: string;
  gmt_payment?: string;
  error?: string;
}

// 退款结果
export interface AlipayRefundResult {
  success: boolean;
  refund_fee?: string;
  gmt_refund_pay?: string;
  error?: string;
}

// 回调验证结果
export interface AlipayCallbackResult {
  valid: boolean;
  data?: {
    out_trade_no: string;
    trade_no: string;
    trade_status: string;
    total_amount: string;
    buyer_pay_amount: string;
    gmt_payment: string;
    buyer_id: string;
  };
  error?: string;
}

class AlipayService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private alipaySdk: any = null;
  private initialized = false;

  /**
   * 初始化支付宝SDK实例
   */
  private initialize(): boolean {
    if (this.initialized && this.alipaySdk) {
      return true;
    }

    const config = getPaymentConfig();

    if (!isAlipayAvailable(config)) {
      logger.warn('支付宝配置不完整，服务不可用');
      return false;
    }

    try {
      const sdkConfig: AlipaySdkConfig = {
        appId: config.alipay.appId,
        privateKey: config.alipay.privateKey,
        alipayPublicKey: config.alipay.alipayPublicKey,
        gateway: config.alipay.gateway,
        signType: 'RSA2',
      };
      this.alipaySdk = new AlipaySdk(sdkConfig);

      this.initialized = true;
      logger.info('支付宝支付服务初始化成功');
      return true;
    } catch (error) {
      logger.error('支付宝支付服务初始化失败:', error);
      return false;
    }
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return this.initialize();
  }

  /**
   * 创建PC网站支付（电脑网站支付）
   */
  async createPCPayment(params: {
    orderNo: string;
    amount: string;        // 单位：元，保留两位小数
    subject: string;
    body?: string;
    returnUrl?: string;
  }): Promise<AlipayPayResult> {
    if (!this.initialize() || !this.alipaySdk) {
      return { success: false, error: '支付宝服务未初始化' };
    }

    const config = getPaymentConfig();

    try {
      const result = this.alipaySdk.pageExec('alipay.trade.page.pay', {
        method: 'GET',
        bizContent: {
          out_trade_no: params.orderNo,
          total_amount: params.amount,
          subject: params.subject,
          body: params.body || params.subject,
          product_code: 'FAST_INSTANT_TRADE_PAY',
          timeout_express: `${config.vip.orderTimeoutMinutes}m`,
        },
        notify_url: config.alipay.notifyUrl,
        return_url: params.returnUrl || config.alipay.returnUrl,
      });

      if (result) {
        logger.info(`支付宝PC支付订单创建成功: ${params.orderNo}`);
        return {
          success: true,
          payUrl: result as string,
        };
      }

      return {
        success: false,
        error: '创建支付订单失败',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '支付请求异常';
      logger.error('支付宝PC支付异常:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 创建手机网站支付（WAP支付）
   */
  async createWapPayment(params: {
    orderNo: string;
    amount: string;
    subject: string;
    body?: string;
    returnUrl?: string;
    quitUrl?: string;
  }): Promise<AlipayPayResult> {
    if (!this.initialize() || !this.alipaySdk) {
      return { success: false, error: '支付宝服务未初始化' };
    }

    const config = getPaymentConfig();

    try {
      const result = this.alipaySdk.pageExec('alipay.trade.wap.pay', {
        method: 'GET',
        bizContent: {
          out_trade_no: params.orderNo,
          total_amount: params.amount,
          subject: params.subject,
          body: params.body || params.subject,
          product_code: 'QUICK_WAP_WAY',
          timeout_express: `${config.vip.orderTimeoutMinutes}m`,
          quit_url: params.quitUrl || config.alipay.returnUrl,
        },
        notify_url: config.alipay.notifyUrl,
        return_url: params.returnUrl || config.alipay.returnUrl,
      });

      if (result) {
        logger.info(`支付宝WAP支付订单创建成功: ${params.orderNo}`);
        return {
          success: true,
          payUrl: result as string,
        };
      }

      return {
        success: false,
        error: '创建支付订单失败',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '支付请求异常';
      logger.error('支付宝WAP支付异常:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 查询支付状态
   */
  async queryPaymentStatus(orderNo: string): Promise<AlipayPayStatus> {
    if (!this.initialize() || !this.alipaySdk) {
      return { success: false, trade_status: 'UNKNOWN', error: '支付宝服务未初始化' };
    }

    try {
      const result = await this.alipaySdk.exec('alipay.trade.query', {
        bizContent: {
          out_trade_no: orderNo,
        },
      });

      const data = result as AlipayResponse;

      if (data.code === '10000') {
        return {
          success: true,
          trade_status: (data.tradeStatus as AlipayPayStatus['trade_status']) || 'UNKNOWN',
          trade_no: data.tradeNo,
          buyer_pay_amount: data.buyerPayAmount,
          gmt_payment: data.gmtPayment,
        };
      }

      // 订单不存在
      if (data.code === '40004' && data.subCode === 'ACQ.TRADE_NOT_EXIST') {
        return {
          success: true,
          trade_status: 'WAIT_BUYER_PAY',
        };
      }

      return {
        success: false,
        trade_status: 'UNKNOWN',
        error: data.subMsg || data.msg || '查询失败',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '查询异常';
      logger.error('查询支付宝支付状态异常:', error);
      return {
        success: false,
        trade_status: 'UNKNOWN',
        error: errorMessage,
      };
    }
  }

  /**
   * 申请退款
   */
  async refund(params: {
    orderNo: string;
    refundNo: string;
    refundAmount: string;  // 单位：元
    reason?: string;
  }): Promise<AlipayRefundResult> {
    if (!this.initialize() || !this.alipaySdk) {
      return { success: false, error: '支付宝服务未初始化' };
    }

    try {
      const result = await this.alipaySdk.exec('alipay.trade.refund', {
        bizContent: {
          out_trade_no: params.orderNo,
          out_request_no: params.refundNo,
          refund_amount: params.refundAmount,
          refund_reason: params.reason || '用户申请退款',
        },
      });

      const data = result as AlipayResponse;

      if (data.code === '10000') {
        logger.info(`支付宝退款成功: ${params.orderNo} -> ${params.refundNo}`);
        return {
          success: true,
          refund_fee: data.refundFee,
          gmt_refund_pay: data.gmtRefundPay,
        };
      }

      logger.error('支付宝退款失败:', data);
      return {
        success: false,
        error: data.subMsg || data.msg || '退款失败',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '退款请求异常';
      logger.error('支付宝退款异常:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 验证异步回调签名
   */
  verifyCallback(params: Record<string, string>): AlipayCallbackResult {
    if (!this.initialize() || !this.alipaySdk) {
      return { valid: false, error: '支付宝服务未初始化' };
    }

    try {
      // 获取签名
      const sign = params.sign;
      const signType = params.sign_type || 'RSA2';

      if (!sign) {
        return { valid: false, error: '缺少签名参数' };
      }

      // 构建待验签字符串
      const sortedParams = Object.keys(params)
        .filter(key => key !== 'sign' && key !== 'sign_type' && params[key])
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');

      // 验证签名
      const config = getPaymentConfig();
      const verify = crypto.createVerify(signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1');
      verify.update(sortedParams, 'utf8');

      // 格式化公钥
      let publicKey = config.alipay.alipayPublicKey;
      if (!publicKey.includes('-----BEGIN')) {
        publicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
      }

      const isValid = verify.verify(publicKey, sign, 'base64');

      if (!isValid) {
        logger.warn('支付宝回调签名验证失败');
        return { valid: false, error: '签名验证失败' };
      }

      return {
        valid: true,
        data: {
          out_trade_no: params.out_trade_no,
          trade_no: params.trade_no,
          trade_status: params.trade_status,
          total_amount: params.total_amount,
          buyer_pay_amount: params.buyer_pay_amount,
          gmt_payment: params.gmt_payment,
          buyer_id: params.buyer_id,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '验签异常';
      logger.error('验证支付宝回调签名异常:', error);
      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 关闭订单
   */
  async closeOrder(orderNo: string): Promise<{ success: boolean; error?: string }> {
    if (!this.initialize() || !this.alipaySdk) {
      return { success: false, error: '支付宝服务未初始化' };
    }

    try {
      const result = await this.alipaySdk.exec('alipay.trade.close', {
        bizContent: {
          out_trade_no: orderNo,
        },
      });

      const data = result as AlipayResponse;

      if (data.code === '10000') {
        logger.info(`支付宝订单关闭成功: ${orderNo}`);
        return { success: true };
      }

      // 订单不存在或已关闭，视为成功
      if (data.subCode === 'ACQ.TRADE_NOT_EXIST' || data.subCode === 'ACQ.TRADE_STATUS_ERROR') {
        return { success: true };
      }

      return {
        success: false,
        error: data.subMsg || data.msg || '关闭订单失败',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '关闭订单异常';
      logger.error('关闭支付宝订单异常:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// 导出单例
export const alipayService = new AlipayService();
export default alipayService;
