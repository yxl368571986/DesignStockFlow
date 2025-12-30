/**
 * 充值控制器
 * 处理用户端充值相关请求
 */

import { Request, Response } from 'express';
import { rechargePackageService } from '../services/rechargePackageService.js';
import { rechargeOrderService } from '../services/rechargeOrderService.js';
import { rechargeCallbackService } from '../services/payment/rechargeCallbackService.js';
import { success as successResponse, error as errorResponse } from '../utils/response.js';

/**
 * 获取充值套餐列表
 * GET /api/v1/recharge/packages
 */
export async function getRechargePackages(req: Request, res: Response) {
  try {
    const packages = await rechargePackageService.getAvailablePackages();
    return successResponse(res, packages, '获取充值套餐成功');
  } catch (error: any) {
    console.error('获取充值套餐失败:', error);
    return errorResponse(res, error.message || '获取充值套餐失败', 500);
  }
}

/**
 * 创建充值订单
 * POST /api/v1/recharge/orders
 */
export async function createRechargeOrder(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return errorResponse(res, '未登录', 401);
    }

    const { packageId, paymentMethod } = req.body;

    if (!packageId) {
      return errorResponse(res, '套餐ID不能为空', 400);
    }

    if (!paymentMethod || !['wechat', 'alipay'].includes(paymentMethod)) {
      return errorResponse(res, '支付方式无效，请选择微信或支付宝', 400);
    }

    // 获取套餐信息以检查充值限制
    const pkg = await rechargePackageService.getPackageById(packageId);
    if (!pkg) {
      return errorResponse(res, '套餐不存在', 404);
    }

    // 检查充值限制
    const limitCheck = await rechargeOrderService.checkRechargeLimit(userId, pkg.price);
    if (!limitCheck.allowed) {
      return errorResponse(res, limitCheck.reason || '充值受限', 403);
    }

    // 获取客户端信息
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    const deviceInfo = req.headers['user-agent'] || '';

    const order = await rechargeOrderService.createRechargeOrder({
      userId,
      packageId,
      paymentMethod,
      ipAddress,
      deviceInfo
    });

    return successResponse(res, order, '创建充值订单成功');
  } catch (error: any) {
    console.error('创建充值订单失败:', error);
    return errorResponse(res, error.message || '创建充值订单失败', 500);
  }
}

/**
 * 查询订单状态
 * GET /api/v1/recharge/orders/:orderId
 */
export async function getRechargeOrderStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return errorResponse(res, '未登录', 401);
    }

    const { orderId } = req.params;
    if (!orderId) {
      return errorResponse(res, '订单ID不能为空', 400);
    }

    const order = await rechargeOrderService.getOrderById(orderId);
    if (!order) {
      return errorResponse(res, '订单不存在', 404);
    }

    // 验证订单归属
    if (order.userId !== userId) {
      return errorResponse(res, '无权查看此订单', 403);
    }

    return successResponse(res, order, '获取订单状态成功');
  } catch (error: any) {
    console.error('获取订单状态失败:', error);
    return errorResponse(res, error.message || '获取订单状态失败', 500);
  }
}

/**
 * 取消充值订单
 * POST /api/v1/recharge/orders/:orderId/cancel
 */
export async function cancelRechargeOrder(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return errorResponse(res, '未登录', 401);
    }

    const { orderId } = req.params;
    if (!orderId) {
      return errorResponse(res, '订单ID不能为空', 400);
    }

    // 先验证订单归属
    const order = await rechargeOrderService.getOrderById(orderId);
    if (!order) {
      return errorResponse(res, '订单不存在', 404);
    }
    if (order.userId !== userId) {
      return errorResponse(res, '无权操作此订单', 403);
    }

    const { reason } = req.body;
    const result = await rechargeOrderService.cancelOrder(orderId, reason || '用户主动取消');

    return successResponse(res, result, '取消订单成功');
  } catch (error: any) {
    console.error('取消订单失败:', error);
    return errorResponse(res, error.message || '取消订单失败', 500);
  }
}

/**
 * 获取用户充值订单列表
 * GET /api/v1/recharge/orders
 */
export async function getUserRechargeOrders(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return errorResponse(res, '未登录', 401);
    }

    const { page, pageSize, status } = req.query;

    const options: any = {};
    if (page) options.page = parseInt(page as string);
    if (pageSize) options.pageSize = parseInt(pageSize as string);
    if (status !== undefined) options.status = parseInt(status as string);

    const result = await rechargeOrderService.getUserOrders(userId, options);

    return successResponse(res, result, '获取充值订单成功');
  } catch (error: any) {
    console.error('获取充值订单失败:', error);
    return errorResponse(res, error.message || '获取充值订单失败', 500);
  }
}

/**
 * 微信支付回调
 * POST /api/v1/payment/recharge/wechat/callback
 */
export async function wechatRechargeCallback(req: Request, res: Response) {
  try {
    const headers = req.headers as Record<string, string>;
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const result = await rechargeCallbackService.processWechatCallback(headers, body);

    // 微信回调需要返回特定格式
    if (result.success) {
      return res.status(200).json({ code: 'SUCCESS', message: '成功' });
    } else {
      return res.status(200).json({ code: 'FAIL', message: result.error || '处理失败' });
    }
  } catch (error: any) {
    console.error('微信充值回调处理失败:', error);
    return res.status(200).json({ code: 'FAIL', message: error.message || '处理失败' });
  }
}

/**
 * 支付宝支付回调
 * POST /api/v1/payment/recharge/alipay/callback
 */
export async function alipayRechargeCallback(req: Request, res: Response) {
  try {
    const params = req.body as Record<string, string>;

    const result = await rechargeCallbackService.processAlipayCallback(params);

    // 支付宝回调需要返回特定字符串
    if (result.success) {
      return res.status(200).send('success');
    } else {
      return res.status(200).send('fail');
    }
  } catch (error: any) {
    console.error('支付宝充值回调处理失败:', error);
    return res.status(200).send('fail');
  }
}
