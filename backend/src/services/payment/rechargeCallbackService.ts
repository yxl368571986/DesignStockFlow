/**
 * 充值支付回调处理服务
 * 处理微信支付和支付宝的充值回调，实现幂等处理
 */

import { Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import { OrderStatus } from '../rechargeOrderService';
import { wechatPayService } from './wechatPay';
import { alipayService } from './alipay';
import logger from '../../utils/logger';

// 回调处理结果
export interface CallbackResult {
  success: boolean;
  orderNo: string;
  transactionId?: string;
  amount?: number;
  paidAt?: Date;
  error?: string;
  isDuplicate?: boolean;
}

// 回调错误类
export class CallbackError extends Error {
  constructor(message: string, public code: string = 'CALLBACK_ERROR') {
    super(message);
    this.name = 'CallbackError';
  }
}

class RechargeCallbackService {
  /**
   * 验证微信支付回调签名
   */
  verifyWechatCallback(headers: Record<string, string>, body: string): boolean {
    try {
      const timestamp = headers['wechatpay-timestamp'] || '';
      const nonce = headers['wechatpay-nonce'] || '';
      const signature = headers['wechatpay-signature'] || '';
      
      return wechatPayService.verifySignature({
        timestamp,
        nonce,
        body,
        signature
      });
    } catch (error) {
      logger.error('微信回调签名验证失败', { error });
      return false;
    }
  }

  /**
   * 验证支付宝回调签名
   */
  verifyAlipayCallback(params: Record<string, string>): boolean {
    try {
      const result = alipayService.verifyCallback(params);
      return result.valid;
    } catch (error) {
      logger.error('支付宝回调签名验证失败', { error });
      return false;
    }
  }

  /**
   * 检查是否为重复回调（幂等检查）
   */
  async isDuplicateCallback(transactionId: string): Promise<boolean> {
    const existing = await prisma.recharge_callbacks.findFirst({
      where: {
        transaction_id: transactionId,
        processed: true,
        process_result: 'success'
      }
    });
    return !!existing;
  }

  /**
   * 记录回调日志
   */
  async logCallback(
    orderNo: string,
    channel: 'wechat' | 'alipay',
    data: Record<string, unknown>,
    transactionId: string | null,
    signatureValid: boolean,
    processed: boolean,
    processResult: string | null,
    errorMessage?: string
  ): Promise<string> {
    const callback = await prisma.recharge_callbacks.create({
      data: {
        order_no: orderNo,
        channel,
        transaction_id: transactionId,
        callback_data: data as Prisma.InputJsonValue,
        signature_valid: signatureValid,
        processed,
        process_result: processResult,
        error_message: errorMessage
      }
    });
    return callback.callback_id;
  }

  /**
   * 处理微信支付回调
   */
  async processWechatCallback(
    headers: Record<string, string>,
    body: string
  ): Promise<CallbackResult> {
    let orderNo = '';
    let transactionId = '';
    
    try {
      // 解析回调数据
      const data = JSON.parse(body);
      const resource = data.resource;
      
      // 解密获取订单信息
      const decrypted = wechatPayService.decryptCallbackData({
        ciphertext: resource.ciphertext,
        nonce: resource.nonce,
        associated_data: resource.associated_data
      });
      
      if (!decrypted.valid || !decrypted.data) {
        throw new CallbackError('回调数据解密失败', 'DECRYPT_ERROR');
      }
      
      orderNo = decrypted.data.out_trade_no;
      transactionId = decrypted.data.transaction_id;
      const amount = decrypted.data.amount?.payer_total || 0;
      const paidAt = decrypted.data.success_time ? new Date(decrypted.data.success_time) : new Date();

      // 验证签名
      const signatureValid = this.verifyWechatCallback(headers, body);
      if (!signatureValid) {
        await this.logCallback(orderNo, 'wechat', data, transactionId, false, false, 'failed', '签名验证失败');
        throw new CallbackError('签名验证失败', 'POINTS_004');
      }

      // 幂等检查
      const isDuplicate = await this.isDuplicateCallback(transactionId);
      if (isDuplicate) {
        await this.logCallback(orderNo, 'wechat', data, transactionId, true, true, 'duplicate', '重复回调');
        return {
          success: true,
          orderNo,
          transactionId,
          isDuplicate: true
        };
      }

      // 处理支付成功
      await this.handlePaymentSuccess(orderNo, transactionId, amount, paidAt);

      // 记录成功日志
      await this.logCallback(orderNo, 'wechat', data, transactionId, true, true, 'success');

      return {
        success: true,
        orderNo,
        transactionId,
        amount,
        paidAt
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error('处理微信回调失败', { orderNo, transactionId, error: errorMessage });
      
      if (orderNo) {
        await this.logCallback(orderNo, 'wechat', { body }, transactionId || null, false, false, 'failed', errorMessage);
      }

      return {
        success: false,
        orderNo,
        transactionId,
        error: errorMessage
      };
    }
  }

  /**
   * 处理支付宝回调
   */
  async processAlipayCallback(params: Record<string, string>): Promise<CallbackResult> {
    const orderNo = params.out_trade_no || '';
    const transactionId = params.trade_no || '';
    
    try {
      // 验证签名
      const signatureValid = this.verifyAlipayCallback(params);
      if (!signatureValid) {
        await this.logCallback(orderNo, 'alipay', params, transactionId, false, false, 'failed', '签名验证失败');
        throw new CallbackError('签名验证失败', 'POINTS_004');
      }

      // 检查交易状态
      const tradeStatus = params.trade_status;
      if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
        await this.logCallback(orderNo, 'alipay', params, transactionId, true, false, 'pending', `交易状态: ${tradeStatus}`);
        return {
          success: false,
          orderNo,
          transactionId,
          error: `交易状态不是成功: ${tradeStatus}`
        };
      }

      // 幂等检查
      const isDuplicate = await this.isDuplicateCallback(transactionId);
      if (isDuplicate) {
        await this.logCallback(orderNo, 'alipay', params, transactionId, true, true, 'duplicate', '重复回调');
        return {
          success: true,
          orderNo,
          transactionId,
          isDuplicate: true
        };
      }

      // 解析金额（支付宝金额单位是元）
      const amount = Math.round(parseFloat(params.total_amount || '0') * 100);
      const paidAt = params.gmt_payment ? new Date(params.gmt_payment) : new Date();

      // 处理支付成功
      await this.handlePaymentSuccess(orderNo, transactionId, amount, paidAt);

      // 记录成功日志
      await this.logCallback(orderNo, 'alipay', params, transactionId, true, true, 'success');

      return {
        success: true,
        orderNo,
        transactionId,
        amount,
        paidAt
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error('处理支付宝回调失败', { orderNo, transactionId, error: errorMessage });
      
      if (orderNo) {
        await this.logCallback(orderNo, 'alipay', params, transactionId || null, false, false, 'failed', errorMessage);
      }

      return {
        success: false,
        orderNo,
        transactionId,
        error: errorMessage
      };
    }
  }

  /**
   * 处理支付成功（核心逻辑）
   */
  async handlePaymentSuccess(
    orderNo: string,
    transactionId: string,
    _amount: number,
    paidAt: Date
  ): Promise<void> {
    // 使用事务确保原子性
    await prisma.$transaction(async (tx) => {
      // 获取订单
      const order = await tx.recharge_orders.findUnique({
        where: { order_no: orderNo }
      });

      if (!order) {
        throw new CallbackError('订单不存在', 'ORDER_NOT_FOUND');
      }

      // 检查订单状态
      if (order.payment_status === OrderStatus.PAID) {
        // 已支付，检查是否重复支付
        if (order.transaction_id !== transactionId) {
          // 不同的交易ID，可能是重复支付，需要退款
          logger.warn('检测到重复支付', { orderNo, existingTxId: order.transaction_id, newTxId: transactionId });
          throw new CallbackError('重复支付，需要退款', 'POINTS_005');
        }
        // 相同交易ID，幂等返回
        return;
      }

      if (order.payment_status !== OrderStatus.PENDING) {
        throw new CallbackError('订单状态异常，无法处理支付', 'ORDER_STATUS_ERROR');
      }

      // 更新订单状态
      await tx.recharge_orders.update({
        where: { order_no: orderNo },
        data: {
          payment_status: OrderStatus.PAID,
          transaction_id: transactionId,
          paid_at: paidAt,
          updated_at: new Date()
        }
      });

      // 获取用户当前积分
      const user = await tx.users.findUnique({
        where: { user_id: order.user_id }
      });

      if (!user) {
        throw new CallbackError('用户不存在', 'USER_NOT_FOUND');
      }

      const newBalance = user.points_balance + order.total_points;
      const newTotal = user.points_total + order.total_points;

      // 更新用户积分
      await tx.users.update({
        where: { user_id: order.user_id },
        data: {
          points_balance: newBalance,
          points_total: newTotal,
          daily_recharge_count: {
            increment: 1
          },
          daily_recharge_amount: {
            increment: order.amount
          },
          last_recharge_date: new Date(),
          updated_at: new Date()
        }
      });

      // 创建积分变动记录
      await tx.points_records.create({
        data: {
          user_id: order.user_id,
          points_change: order.total_points,
          points_balance: newBalance,
          change_type: 'recharge',
          source: 'recharge_order',
          source_id: order.order_id,
          description: `充值${order.total_points}积分（基础${order.base_points}+赠送${order.bonus_points}）`,
          acquired_at: new Date()
        }
      });

      // 发送站内通知
      await tx.notifications.create({
        data: {
          user_id: order.user_id,
          title: '积分充值成功',
          content: `您已成功充值${order.total_points}积分（基础${order.base_points}积分+赠送${order.bonus_points}积分），当前积分余额：${newBalance}`,
          type: 'recharge_success',
          is_read: false
        }
      });

      logger.info('充值成功', {
        orderNo,
        userId: order.user_id,
        totalPoints: order.total_points,
        newBalance
      });
    });
  }

  /**
   * 检测重复支付
   */
  async detectDuplicatePayment(transactionId: string): Promise<{
    isDuplicate: boolean;
    originalOrderNo?: string;
  }> {
    const callbacks = await prisma.recharge_callbacks.findMany({
      where: {
        transaction_id: transactionId,
        processed: true,
        process_result: 'success'
      },
      orderBy: { created_at: 'asc' }
    });

    if (callbacks.length > 1) {
      return {
        isDuplicate: true,
        originalOrderNo: callbacks[0].order_no
      };
    }

    return { isDuplicate: false };
  }

  /**
   * 获取回调记录
   */
  async getCallbackLogs(
    orderNo: string
  ): Promise<Array<{
    callbackId: string;
    channel: string;
    transactionId: string | null;
    signatureValid: boolean | null;
    processed: boolean;
    processResult: string | null;
    errorMessage: string | null;
    createdAt: Date;
  }>> {
    const callbacks = await prisma.recharge_callbacks.findMany({
      where: { order_no: orderNo },
      orderBy: { created_at: 'desc' }
    });

    return callbacks.map(cb => ({
      callbackId: cb.callback_id,
      channel: cb.channel,
      transactionId: cb.transaction_id,
      signatureValid: cb.signature_valid,
      processed: cb.processed,
      processResult: cb.process_result,
      errorMessage: cb.error_message,
      createdAt: cb.created_at
    }));
  }
}

export const rechargeCallbackService = new RechargeCallbackService();
export default rechargeCallbackService;
