/**
 * 微信支付服务模块
 * 支持 Native支付（PC扫码）和 H5支付（移动端）
 */

import WxPay from 'wechatpay-node-v3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getPaymentConfig, isWechatPayAvailable } from '../../config/payment';
import logger from '../../utils/logger';

// 支付结果类型
export interface WechatPayResult {
  success: boolean;
  code_url?: string;      // Native支付二维码URL
  h5_url?: string;        // H5支付跳转URL
  prepay_id?: string;     // 预支付交易会话标识
  error?: string;
}

// 支付状态查询结果
export interface WechatPayStatus {
  success: boolean;
  trade_state: 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR' | 'UNKNOWN';
  trade_state_desc?: string;
  transaction_id?: string;
  payer_total?: number;
  success_time?: string;
  error?: string;
}

// 退款结果
export interface WechatRefundResult {
  success: boolean;
  refund_id?: string;
  status?: string;
  error?: string;
}

// 回调验证结果
export interface WechatCallbackResult {
  valid: boolean;
  data?: {
    out_trade_no: string;
    transaction_id: string;
    trade_state: string;
    trade_state_desc: string;
    success_time: string;
    payer: { openid: string };
    amount: { total: number; payer_total: number; currency: string };
  };
  error?: string;
}

class WechatPayService {
  private wxpay: WxPay | null = null;
  private initialized = false;

  /**
   * 初始化微信支付实例
   */
  private async initialize(): Promise<boolean> {
    if (this.initialized && this.wxpay) {
      return true;
    }

    const config = getPaymentConfig();
    
    if (!isWechatPayAvailable(config)) {
      logger.warn('微信支付配置不完整，服务不可用');
      return false;
    }

    try {
      // 读取证书文件
      const privateKeyPath = path.resolve(config.wechat.privateKeyPath);
      const certPath = path.resolve(config.wechat.certPath);

      if (!fs.existsSync(privateKeyPath)) {
        logger.error(`微信支付私钥文件不存在: ${privateKeyPath}`);
        return false;
      }

      const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');

      const publicKeyBuffer = fs.existsSync(certPath) ? fs.readFileSync(certPath) : undefined;

      this.wxpay = new WxPay({
        appid: config.wechat.appId,
        mchid: config.wechat.mchId,
        publicKey: publicKeyBuffer,
        privateKey: fs.readFileSync(privateKeyPath),
        key: config.wechat.apiKeyV3,
      } as ConstructorParameters<typeof WxPay>[0]);

      this.initialized = true;
      logger.info('微信支付服务初始化成功');
      return true;
    } catch (error) {
      logger.error('微信支付服务初始化失败:', error);
      return false;
    }
  }

  /**
   * 检查服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    return this.initialize();
  }

  /**
   * 创建Native支付订单（PC扫码支付）
   */
  async createNativePayment(params: {
    orderNo: string;
    amount: number;      // 单位：分
    description: string;
    clientIp: string;
  }): Promise<WechatPayResult> {
    if (!await this.initialize() || !this.wxpay) {
      return { success: false, error: '微信支付服务未初始化' };
    }

    const config = getPaymentConfig();

    try {
      const result = await this.wxpay.transactions_native({
        description: params.description,
        out_trade_no: params.orderNo,
        notify_url: config.wechat.notifyUrl,
        amount: {
          total: params.amount,
          currency: 'CNY',
        },
        scene_info: {
          payer_client_ip: params.clientIp,
        },
      });

      if (result.status === 200 && result.data?.code_url) {
        logger.info(`微信Native支付订单创建成功: ${params.orderNo}`);
        return {
          success: true,
          code_url: result.data.code_url,
        };
      }

      logger.error('微信Native支付创建失败:', result);
      return {
        success: false,
        error: result.data?.message || '创建支付订单失败',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '支付请求异常';
      logger.error('微信Native支付异常:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 创建H5支付订单（移动端浏览器支付）
   */
  async createH5Payment(params: {
    orderNo: string;
    amount: number;
    description: string;
    clientIp: string;
    returnUrl?: string;
  }): Promise<WechatPayResult> {
    if (!await this.initialize() || !this.wxpay) {
      return { success: false, error: '微信支付服务未初始化' };
    }

    const config = getPaymentConfig();

    try {
      const result = await this.wxpay.transactions_h5({
        description: params.description,
        out_trade_no: params.orderNo,
        notify_url: config.wechat.notifyUrl,
        amount: {
          total: params.amount,
          currency: 'CNY',
        },
        scene_info: {
          payer_client_ip: params.clientIp,
          h5_info: {
            type: 'Wap',
            app_name: 'VIP会员中心',
          },
        },
      });

      if (result.status === 200 && result.data?.h5_url) {
        let h5Url = result.data.h5_url;
        // 添加返回URL
        if (params.returnUrl) {
          h5Url += `&redirect_url=${encodeURIComponent(params.returnUrl)}`;
        }

        logger.info(`微信H5支付订单创建成功: ${params.orderNo}`);
        return {
          success: true,
          h5_url: h5Url,
        };
      }

      logger.error('微信H5支付创建失败:', result);
      return {
        success: false,
        error: '创建支付订单失败',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '支付请求异常';
      logger.error('微信H5支付异常:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 查询支付状态
   */
  async queryPaymentStatus(orderNo: string): Promise<WechatPayStatus> {
    if (!await this.initialize() || !this.wxpay) {
      return { success: false, trade_state: 'UNKNOWN', error: '微信支付服务未初始化' };
    }

    try {
      const result = await this.wxpay.query({ out_trade_no: orderNo });

      if (result.status === 200 && result.data) {
        return {
          success: true,
          trade_state: (result.data.trade_state as WechatPayStatus['trade_state']) || 'UNKNOWN',
          trade_state_desc: result.data.trade_state_desc,
          transaction_id: result.data.transaction_id,
          payer_total: result.data.amount?.payer_total,
          success_time: result.data.success_time,
        };
      }

      return {
        success: false,
        trade_state: 'UNKNOWN',
        error: '查询失败',
      };
    } catch (error: unknown) {
      // 订单不存在的情况
      const err = error as { response?: { status?: number }; message?: string };
      if (err.response?.status === 404) {
        return {
          success: true,
          trade_state: 'NOTPAY',
          trade_state_desc: '订单未支付',
        };
      }

      const errorMessage = error instanceof Error ? error.message : '查询异常';
      logger.error('查询微信支付状态异常:', error);
      return {
        success: false,
        trade_state: 'UNKNOWN',
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
    totalAmount: number;   // 原订单金额（分）
    refundAmount: number;  // 退款金额（分）
    reason?: string;
  }): Promise<WechatRefundResult> {
    if (!await this.initialize() || !this.wxpay) {
      return { success: false, error: '微信支付服务未初始化' };
    }

    const config = getPaymentConfig();

    try {
      const result = await this.wxpay.refunds({
        out_trade_no: params.orderNo,
        out_refund_no: params.refundNo,
        reason: params.reason || '用户申请退款',
        notify_url: config.wechat.notifyUrl.replace('/notify', '/refund-notify'),
        amount: {
          refund: params.refundAmount,
          total: params.totalAmount,
          currency: 'CNY',
        },
      });

      if (result.status === 200 && result.data) {
        logger.info(`微信退款申请成功: ${params.orderNo} -> ${params.refundNo}`);
        return {
          success: true,
          refund_id: result.data.refund_id,
          status: result.data.status,
        };
      }

      logger.error('微信退款申请失败:', result);
      return {
        success: false,
        error: '退款申请失败',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '退款请求异常';
      logger.error('微信退款异常:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 验证回调签名
   */
  verifySignature(params: {
    timestamp: string;
    nonce: string;
    body: string;
    signature: string;
  }): boolean {
    const config = getPaymentConfig();

    try {
      // 读取微信支付平台证书公钥
      const platformCertPath = path.resolve(config.wechat.platformCertPath);
      if (!fs.existsSync(platformCertPath)) {
        logger.error('微信支付平台证书不存在');
        return false;
      }

      const publicKey = fs.readFileSync(platformCertPath, 'utf-8');
      const message = `${params.timestamp}\n${params.nonce}\n${params.body}\n`;

      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(message);

      return verify.verify(publicKey, params.signature, 'base64');
    } catch (error) {
      logger.error('验证微信回调签名异常:', error);
      return false;
    }
  }

  /**
   * 解密回调数据
   */
  decryptCallbackData(params: {
    ciphertext: string;
    nonce: string;
    associated_data: string;
  }): WechatCallbackResult {
    const config = getPaymentConfig();

    try {
      const key = Buffer.from(config.wechat.apiKeyV3, 'utf-8');
      const nonce = Buffer.from(params.nonce, 'utf-8');
      const associatedData = Buffer.from(params.associated_data, 'utf-8');
      const ciphertext = Buffer.from(params.ciphertext, 'base64');

      // 分离认证标签（最后16字节）- GCM标准认证标签长度为128位(16字节)
      const AUTH_TAG_LENGTH = 16;
      const authTag = ciphertext.subarray(-AUTH_TAG_LENGTH);
      const data = ciphertext.subarray(0, -AUTH_TAG_LENGTH);

      // 验证认证标签长度
      if (authTag.length !== AUTH_TAG_LENGTH) {
        logger.error(`GCM认证标签长度错误: 期望${AUTH_TAG_LENGTH}字节, 实际${authTag.length}字节`);
        return { valid: false, error: 'GCM认证标签长度错误' };
      }

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
      decipher.setAuthTag(authTag);
      decipher.setAAD(associatedData);

      const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
      const result = JSON.parse(decrypted.toString('utf-8'));

      return {
        valid: true,
        data: result,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '解密失败';
      logger.error('解密微信回调数据失败:', error);
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
    if (!await this.initialize() || !this.wxpay) {
      return { success: false, error: '微信支付服务未初始化' };
    }

    try {
      const result = await this.wxpay.close(orderNo);

      if (result.status === 204) {
        logger.info(`微信订单关闭成功: ${orderNo}`);
        return { success: true };
      }

      return {
        success: false,
        error: '关闭订单失败',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '关闭订单异常';
      logger.error('关闭微信订单异常:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// 导出单例
export const wechatPayService = new WechatPayService();
export default wechatPayService;
