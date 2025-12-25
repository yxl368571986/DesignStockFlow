/**
 * VIP支付控制器
 * 处理VIP订单创建、支付、回调等
 */

import { Request, Response } from 'express';
import { wechatPayService } from '../services/payment/wechatPay';
import { alipayService } from '../services/payment/alipay';
import { paymentGateway, PaymentChannel } from '../services/payment/paymentGateway';
import { vipOrderService, OrderStatus, DeviceInfo } from '../services/order/vipOrderService';
import { enhancedVipService } from '../services/vip/enhancedVipService';
import { securityMonitor } from '../services/security/securityMonitor';
import { deviceManager } from '../services/device/deviceManager';
import { notificationService } from '../services/notification/notificationService';
import { getPaymentConfig } from '../config/payment';
import logger from '../utils/logger';

/**
 * 解析设备信息
 */
function parseDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers['user-agent'] || '';
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';
  const parsed = deviceManager.parseUserAgent(userAgent);

  return {
    userAgent,
    ip,
    deviceType: parsed.deviceType || 'pc',
    browser: parsed.browser,
    os: parsed.os,
    fingerprint: req.body.deviceFingerprint,
  };
}

/**
 * 创建VIP订单
 * POST /api/v1/vip/orders
 */
export async function createVipOrder(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { packageId, paymentMethod, sourceUrl, sourceResourceId } = req.body;

    if (!packageId || !paymentMethod) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    // 验证支付方式
    const validMethods: PaymentChannel[] = ['wechat_native', 'wechat_h5', 'alipay_pc', 'alipay_wap', 'points'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ code: 400, message: '不支持的支付方式' });
    }

    const deviceInfo = parseDeviceInfo(req);

    // 安全检查
    const securityCheck = await securityMonitor.checkPaymentSecurity(userId, deviceInfo);
    if (!securityCheck.allowed) {
      return res.status(403).json({
        code: 403,
        message: securityCheck.reason === 'too_many_unpaid_orders'
          ? '您有过多未支付订单，请先完成或取消现有订单'
          : '支付受限，请联系客服',
      });
    }

    // 创建订单
    const order = await vipOrderService.createVipOrder({
      userId,
      packageId,
      paymentMethod,
      deviceInfo,
      sourceUrl,
      sourceResourceId,
    });

    // 记录支付尝试
    await securityMonitor.recordPaymentAttempt(userId, order.orderNo, deviceInfo);

    res.json({
      code: 0,
      data: {
        orderId: order.orderId,
        orderNo: order.orderNo,
        amount: order.amount,
        amountInCents: order.amountInCents,
        expireAt: order.expireAt,
        requireSecondaryAuth: order.requireSecondaryAuth,
        packageName: order.packageName,
        durationDays: order.durationDays,
      },
    });
  } catch (error: any) {
    logger.error('创建VIP订单失败:', error);
    res.status(500).json({ code: 500, message: error.message || '创建订单失败' });
  }
}

/**
 * 发起支付
 * POST /api/v1/vip/orders/:orderNo/pay
 */
export async function initiatePayment(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { orderNo } = req.params;
    const { secondaryAuthCode } = req.body;

    // 获取订单详情
    const order = await vipOrderService.getOrderDetail(orderNo, userId);

    if (order.paymentStatus !== OrderStatus.PENDING) {
      return res.status(400).json({ code: 400, message: '订单状态不正确' });
    }

    // 检查订单是否过期
    if (await vipOrderService.isOrderExpired(orderNo)) {
      return res.status(400).json({ code: 400, message: '订单已过期，请重新下单' });
    }

    // 检查是否需要二次验证
    if (order.vipOrder?.requireSecondaryAuth && !order.vipOrder?.secondaryAuthVerified) {
      if (!secondaryAuthCode) {
        return res.status(400).json({
          code: 400,
          message: '该订单需要二次验证',
          data: { requireSecondaryAuth: true },
        });
      }

      // 验证二次验证码
      const verified = await securityMonitor.verifySecondaryAuth(userId, secondaryAuthCode);
      if (!verified) {
        return res.status(400).json({ code: 400, message: '验证码错误或已过期' });
      }

      // 更新二次验证状态
      await vipOrderService.updateSecondaryAuthStatus(orderNo, true);
    }

    const deviceInfo = parseDeviceInfo(req);
    const config = getPaymentConfig();

    // 确定支付渠道
    let channel: PaymentChannel;
    const paymentMethod = order.paymentMethod?.toLowerCase() || '';

    if (paymentMethod.includes('wechat') || paymentMethod === 'wechat') {
      channel = deviceInfo.deviceType === 'mobile' ? 'wechat_h5' : 'wechat_native';
    } else if (paymentMethod.includes('alipay') || paymentMethod === 'alipay') {
      channel = deviceInfo.deviceType === 'mobile' ? 'alipay_wap' : 'alipay_pc';
    } else {
      return res.status(400).json({ code: 400, message: '不支持的支付方式' });
    }

    // 创建支付
    const amountInCents = Math.round(Number(order.amount) * 100);
    const returnUrl = `${req.protocol}://${req.get('host')}/vip/payment-result?orderNo=${orderNo}`;

    const paymentResult = await paymentGateway.createPayment({
      orderNo,
      amount: amountInCents,
      subject: `VIP会员 - ${order.productName}`,
      channel,
      clientIp: deviceInfo.ip,
      returnUrl,
    });

    if (!paymentResult.success) {
      return res.status(500).json({ code: 500, message: paymentResult.error || '创建支付失败' });
    }

    res.json({
      code: 0,
      data: {
        paymentMethod: channel,
        paymentData: paymentResult.paymentData,
        expireAt: paymentResult.expireTime,
      },
    });
  } catch (error: any) {
    logger.error('发起支付失败:', error);
    res.status(500).json({ code: 500, message: error.message || '发起支付失败' });
  }
}

/**
 * 查询支付状态
 * GET /api/v1/vip/orders/:orderNo/status
 */
export async function getPaymentStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { orderNo } = req.params;

    const order = await vipOrderService.getOrderDetail(orderNo, userId || undefined);

    // 获取VIP信息（如果已支付）
    let vipInfo = null;
    if (order.paymentStatus === OrderStatus.PAID && order.user?.user_id) {
      vipInfo = await enhancedVipService.getUserVipInfo(order.user.user_id);
    }

    res.json({
      code: 0,
      data: {
        orderNo: order.orderNo,
        status: order.paymentStatus,
        paidAt: order.paidAt,
        vipExpireAt: vipInfo?.expireAt,
        returnUrl: order.vipOrder?.sourceUrl || '/vip',
      },
    });
  } catch (error: any) {
    logger.error('查询支付状态失败:', error);
    res.status(500).json({ code: 500, message: error.message || '查询失败' });
  }
}

/**
 * 获取用户订单列表
 * GET /api/v1/vip/orders
 */
export async function getUserOrders(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { page = 1, pageSize = 10, status } = req.query;

    const result = await vipOrderService.getUserOrders(userId, {
      page: Number(page),
      pageSize: Number(pageSize),
      status: status !== undefined ? Number(status) : undefined,
    });

    res.json({ code: 0, data: result });
  } catch (error: any) {
    logger.error('获取订单列表失败:', error);
    res.status(500).json({ code: 500, message: error.message || '获取订单列表失败' });
  }
}

/**
 * 获取订单详情
 * GET /api/v1/vip/orders/:orderNo
 */
export async function getOrderDetail(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { orderNo } = req.params;

    const order = await vipOrderService.getOrderDetail(orderNo, userId || undefined);

    res.json({ code: 0, data: order });
  } catch (error: any) {
    logger.error('获取订单详情失败:', error);
    res.status(500).json({ code: 500, message: error.message || '获取订单详情失败' });
  }
}

/**
 * 取消订单
 * POST /api/v1/vip/orders/:orderNo/cancel
 */
export async function cancelOrder(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { orderNo } = req.params;
    const { reason } = req.body;

    await vipOrderService.cancelOrder(orderNo, reason || '用户取消', userId);

    res.json({ code: 0, message: '订单已取消' });
  } catch (error: any) {
    logger.error('取消订单失败:', error);
    res.status(500).json({ code: 500, message: error.message || '取消订单失败' });
  }
}

/**
 * 申请退款
 * POST /api/v1/vip/orders/:orderNo/refund
 */
export async function requestRefund(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { orderNo } = req.params;
    const { reason, reasonType } = req.body;

    if (!reason) {
      return res.status(400).json({ code: 400, message: '请填写退款原因' });
    }

    // 检查是否可退款
    const refundable = await vipOrderService.checkRefundable(orderNo);
    if (!refundable.refundable) {
      return res.status(400).json({ code: 400, message: refundable.reason });
    }

    // 创建退款申请
    const refundRequest = await vipOrderService.createRefundRequest(orderNo, userId, reason, reasonType);

    res.json({
      code: 0,
      message: '退款申请已提交，请等待审核',
      data: refundRequest,
    });
  } catch (error: any) {
    logger.error('申请退款失败:', error);
    res.status(500).json({ code: 500, message: error.message || '申请退款失败' });
  }
}

/**
 * 微信支付回调
 * POST /api/v1/payment/wechat/notify
 */
export async function wechatPayNotify(req: Request, res: Response) {
  try {
    const timestamp = req.headers['wechatpay-timestamp'] as string;
    const nonce = req.headers['wechatpay-nonce'] as string;
    const signature = req.headers['wechatpay-signature'] as string;
    const body = JSON.stringify(req.body);

    // 验证签名
    const isValid = wechatPayService.verifySignature({ timestamp, nonce, body, signature });

    if (!isValid) {
      logger.warn('微信支付回调签名验证失败');
      return res.status(400).json({ code: 'FAIL', message: '签名验证失败' });
    }

    // 解密回调数据
    const { resource } = req.body;
    const decrypted = wechatPayService.decryptCallbackData({
      ciphertext: resource.ciphertext,
      nonce: resource.nonce,
      associated_data: resource.associated_data,
    });

    if (!decrypted.valid || !decrypted.data) {
      logger.warn('微信支付回调数据解密失败');
      return res.status(400).json({ code: 'FAIL', message: '数据解密失败' });
    }

    const { out_trade_no, transaction_id, trade_state } = decrypted.data;

    // 检查是否已处理（幂等性）
    if (await vipOrderService.isCallbackProcessed(out_trade_no, transaction_id)) {
      return res.json({ code: 'SUCCESS', message: '已处理' });
    }

    // 记录回调
    await vipOrderService.recordPaymentCallback({
      orderNo: out_trade_no,
      channel: 'wechat',
      transactionId: transaction_id,
      callbackData: decrypted.data,
      signature,
      signatureValid: true,
      processed: false,
      processResult: 'pending',
    });

    if (trade_state === 'SUCCESS') {
      // 更新订单状态
      await vipOrderService.updateOrderStatus(out_trade_no, OrderStatus.PAID, transaction_id);

      // 获取订单信息并开通VIP
      const order = await vipOrderService.getOrderDetail(out_trade_no);
      if (order.vipOrder && order.user) {
        await enhancedVipService.activateVip(order.user.user_id, order.vipOrder.packageId, order.orderId);

        // 发送支付成功通知
        const vipInfo = await enhancedVipService.getUserVipInfo(order.user.user_id);
        await notificationService.sendPaymentSuccessNotification(
          order.user.user_id,
          out_trade_no,
          order.productName,
          vipInfo.expireAt
        );
      }

      // 更新回调记录
      await vipOrderService.recordPaymentCallback({
        orderNo: out_trade_no,
        channel: 'wechat',
        transactionId: transaction_id,
        callbackData: decrypted.data,
        signatureValid: true,
        processed: true,
        processResult: 'success',
      });
    }

    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (error: any) {
    logger.error('微信支付回调处理失败:', error);
    res.status(500).json({ code: 'FAIL', message: error.message });
  }
}

/**
 * 支付宝异步回调
 * POST /api/v1/payment/alipay/notify
 */
export async function alipayNotify(req: Request, res: Response) {
  try {
    // 验证签名
    const verifyResult = alipayService.verifyCallback(req.body);

    if (!verifyResult.valid || !verifyResult.data) {
      logger.warn('支付宝回调签名验证失败');
      return res.send('fail');
    }

    const { out_trade_no, trade_no, trade_status } = verifyResult.data;

    // 检查是否已处理（幂等性）
    if (await vipOrderService.isCallbackProcessed(out_trade_no, trade_no)) {
      return res.send('success');
    }

    // 记录回调
    await vipOrderService.recordPaymentCallback({
      orderNo: out_trade_no,
      channel: 'alipay',
      transactionId: trade_no,
      callbackData: verifyResult.data,
      signatureValid: true,
      processed: false,
      processResult: 'pending',
    });

    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      // 更新订单状态
      await vipOrderService.updateOrderStatus(out_trade_no, OrderStatus.PAID, trade_no);

      // 获取订单信息并开通VIP
      const order = await vipOrderService.getOrderDetail(out_trade_no);
      if (order.vipOrder && order.user) {
        await enhancedVipService.activateVip(order.user.user_id, order.vipOrder.packageId, order.orderId);

        // 发送支付成功通知
        const vipInfo = await enhancedVipService.getUserVipInfo(order.user.user_id);
        await notificationService.sendPaymentSuccessNotification(
          order.user.user_id,
          out_trade_no,
          order.productName,
          vipInfo.expireAt
        );
      }

      // 更新回调记录
      await vipOrderService.recordPaymentCallback({
        orderNo: out_trade_no,
        channel: 'alipay',
        transactionId: trade_no,
        callbackData: verifyResult.data,
        signatureValid: true,
        processed: true,
        processResult: 'success',
      });
    }

    res.send('success');
  } catch (error: any) {
    logger.error('支付宝回调处理失败:', error);
    res.send('fail');
  }
}

/**
 * 支付宝同步回调
 * GET /api/v1/payment/alipay/return
 */
export async function alipayReturn(req: Request, res: Response) {
  try {
    const { out_trade_no } = req.query;

    if (!out_trade_no) {
      return res.redirect('/vip?error=missing_order');
    }

    // 查询订单状态
    const order = await vipOrderService.getOrderDetail(out_trade_no as string);

    // 重定向到支付结果页面
    const returnUrl = order.vipOrder?.sourceUrl || '/vip';
    res.redirect(`/vip/payment-result?orderNo=${out_trade_no}&returnUrl=${encodeURIComponent(returnUrl)}`);
  } catch (error: any) {
    logger.error('支付宝同步回调处理失败:', error);
    res.redirect('/vip?error=callback_failed');
  }
}

/**
 * 发送二次验证码
 * POST /api/v1/vip/auth/send-code
 */
export async function sendSecondaryAuthCode(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const result = await securityMonitor.sendSecondaryAuthCode(userId);

    if (!result.success) {
      return res.status(400).json({ code: 400, message: result.message });
    }

    res.json({ code: 0, message: result.message });
  } catch (error: any) {
    logger.error('发送验证码失败:', error);
    res.status(500).json({ code: 500, message: error.message || '发送验证码失败' });
  }
}

/**
 * 验证二次验证码
 * POST /api/v1/vip/auth/verify-code
 */
export async function verifySecondaryAuthCode(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ code: 400, message: '请输入验证码' });
    }

    const verified = await securityMonitor.verifySecondaryAuth(userId, code);

    if (!verified) {
      return res.status(400).json({ code: 400, message: '验证码错误或已过期' });
    }

    res.json({ code: 0, message: '验证成功' });
  } catch (error: any) {
    logger.error('验证码验证失败:', error);
    res.status(500).json({ code: 500, message: error.message || '验证失败' });
  }
}
