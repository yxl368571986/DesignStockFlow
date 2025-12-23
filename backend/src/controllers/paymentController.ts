import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService.js';
import { success as successResponse, error as errorResponse } from '../utils/response.js';

/**
 * 创建订单
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { orderType, productType, paymentMethod } = req.body;

    if (!orderType || !productType || !paymentMethod) {
      return errorResponse(res, '参数不完整', 400);
    }

    if (!['vip', 'points'].includes(orderType)) {
      return errorResponse(res, '订单类型错误', 400);
    }

    if (!['wechat', 'alipay'].includes(paymentMethod)) {
      return errorResponse(res, '支付方式错误', 400);
    }

    const result = await paymentService.createOrder({
      userId,
      orderType,
      productType,
      paymentMethod,
    });

    return successResponse(res, result, '订单创建成功');
  } catch (error: any) {
    console.error('创建订单失败:', error);
    return errorResponse(res, error.message || '订单创建失败', 500);
  }
};

/**
 * 查询订单状态
 */
export const getOrderStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { orderNo } = req.params;

    if (!orderNo) {
      return errorResponse(res, '订单号不能为空', 400);
    }

    const result = await paymentService.getOrderDetail(orderNo, userId);

    return successResponse(res, result, '获取成功');
  } catch (error: any) {
    console.error('查询订单状态失败:', error);
    return errorResponse(res, error.message || '查询订单状态失败', 500);
  }
};

/**
 * 微信支付回调
 */
export const wechatCallback = async (req: Request, res: Response) => {
  try {
    const { orderNo, transactionId } = req.body;

    if (!orderNo || !transactionId) {
      return errorResponse(res, '参数不完整', 400);
    }

    const result = await paymentService.handlePaymentCallback({
      orderNo,
      transactionId,
      paymentMethod: 'wechat',
    });

    return successResponse(res, result, '处理成功');
  } catch (error: any) {
    console.error('微信支付回调处理失败:', error);
    return errorResponse(res, error.message || '回调处理失败', 500);
  }
};

/**
 * 支付宝支付回调
 */
export const alipayCallback = async (req: Request, res: Response) => {
  try {
    const { orderNo, transactionId } = req.body;

    if (!orderNo || !transactionId) {
      return errorResponse(res, '参数不完整', 400);
    }

    const result = await paymentService.handlePaymentCallback({
      orderNo,
      transactionId,
      paymentMethod: 'alipay',
    });

    return successResponse(res, result, '处理成功');
  } catch (error: any) {
    console.error('支付宝支付回调处理失败:', error);
    return errorResponse(res, error.message || '回调处理失败', 500);
  }
};

/**
 * 获取用户订单列表
 */
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { page, pageSize, orderType, paymentStatus } = req.query;

    const result = await paymentService.getUserOrders(userId, {
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      orderType: orderType as string,
      paymentStatus: paymentStatus ? parseInt(paymentStatus as string) : undefined,
    });

    return successResponse(res, result, '获取成功');
  } catch (error: any) {
    console.error('获取订单列表失败:', error);
    return errorResponse(res, error.message || '获取订单列表失败', 500);
  }
};

/**
 * 取消订单
 */
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { orderNo } = req.params;

    if (!orderNo) {
      return errorResponse(res, '订单号不能为空', 400);
    }

    const result = await paymentService.cancelOrder(orderNo, userId);

    return successResponse(res, result, '订单已取消');
  } catch (error: any) {
    console.error('取消订单失败:', error);
    return errorResponse(res, error.message || '取消订单失败', 500);
  }
};
