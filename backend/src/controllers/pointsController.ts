import { Request, Response } from 'express';
import * as pointsService from '../services/pointsService.js';
import { success as successResponse, error as errorResponse } from '../utils/response.js';

/**
 * 获取用户积分信息
 * GET /api/v1/points/my-info
 */
export async function getMyPointsInfo(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return errorResponse(res, '未登录', 401);
    }

    const pointsInfo = await pointsService.getUserPointsInfo(userId);
    
    return successResponse(res, pointsInfo, '获取积分信息成功');
  } catch (error: any) {
    console.error('获取积分信息失败:', error);
    return errorResponse(res, error.message || '获取积分信息失败', 500);
  }
}

/**
 * 获取积分明细记录
 * GET /api/v1/points/records
 */
export async function getPointsRecords(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return errorResponse(res, '未登录', 401);
    }

    const { page, pageSize, changeType, startDate, endDate } = req.query;

    const options: any = {};
    
    if (page) options.page = parseInt(page as string);
    if (pageSize) options.pageSize = parseInt(pageSize as string);
    if (changeType) options.changeType = changeType as string;
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);

    const result = await pointsService.getPointsRecords(userId, options);
    
    return successResponse(res, result, '获取积分明细成功');
  } catch (error: any) {
    console.error('获取积分明细失败:', error);
    return errorResponse(res, error.message || '获取积分明细失败', 500);
  }
}

/**
 * 获取积分商品列表
 * GET /api/v1/points/products
 */
export async function getPointsProducts(req: Request, res: Response) {
  try {
    const { page, pageSize, productType } = req.query;

    const options: any = {};
    if (page) options.page = parseInt(page as string);
    if (pageSize) options.pageSize = parseInt(pageSize as string);
    if (productType) options.productType = productType as string;

    const products = await pointsService.getPointsProducts(options);
    
    return successResponse(res, products, '获取商品列表成功');
  } catch (error: any) {
    console.error('获取商品列表失败:', error);
    return errorResponse(res, error.message || '获取商品列表失败', 500);
  }
}

/**
 * 兑换积分商品
 * POST /api/v1/points/exchange
 */
export async function exchangeProduct(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return errorResponse(res, '未登录', 401);
    }

    const { productId, deliveryAddress } = req.body;

    if (!productId) {
      return errorResponse(res, '商品ID不能为空', 400);
    }

    const result = await pointsService.exchangeProduct(userId, productId, deliveryAddress);
    
    return successResponse(res, result, '兑换成功');
  } catch (error: any) {
    console.error('兑换商品失败:', error);
    return errorResponse(res, error.message || '兑换商品失败', 500);
  }
}

/**
 * 获取兑换记录
 * GET /api/v1/points/exchange-records
 */
export async function getExchangeRecords(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return errorResponse(res, '未登录', 401);
    }

    const { page, pageSize } = req.query;

    const options: any = {};
    if (page) options.page = parseInt(page as string);
    if (pageSize) options.pageSize = parseInt(pageSize as string);

    const result = await pointsService.getExchangeRecords(userId, options);
    
    return successResponse(res, result, '获取兑换记录成功');
  } catch (error: any) {
    console.error('获取兑换记录失败:', error);
    return errorResponse(res, error.message || '获取兑换记录失败', 500);
  }
}

/**
 * 获取积分规则列表
 * GET /api/v1/points/rules
 */
export async function getPointsRules(req: Request, res: Response) {
  try {
    const rules = await pointsService.getPointsRules();
    return successResponse(res, rules, '获取积分规则成功');
  } catch (error: any) {
    console.error('获取积分规则失败:', error);
    return errorResponse(res, error.message || '获取积分规则失败', 500);
  }
}

/**
 * 获取每日任务列表
 * GET /api/v1/points/daily-tasks
 */
export async function getDailyTasks(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return errorResponse(res, '未登录', 401);
    }

    const tasks = await pointsService.getDailyTasks(userId);
    
    return successResponse(res, tasks, '获取任务列表成功');
  } catch (error: any) {
    console.error('获取任务列表失败:', error);
    return errorResponse(res, error.message || '获取任务列表失败', 500);
  }
}

/**
 * 完成任务
 * POST /api/v1/points/daily-tasks/:taskCode/complete
 */
export async function completeTask(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return errorResponse(res, '未登录', 401);
    }

    const { taskCode } = req.params;

    if (!taskCode) {
      return errorResponse(res, '任务代码不能为空', 400);
    }

    const result = await pointsService.completeDailyTask(userId, taskCode);
    
    return successResponse(res, result, '任务完成');
  } catch (error: any) {
    console.error('完成任务失败:', error);
    return errorResponse(res, error.message || '完成任务失败', 500);
  }
}

/**
 * 每日签到
 * POST /api/v1/points/signin
 */
export async function dailySignin(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return errorResponse(res, '未登录', 401);
    }

    // 签到实际上是完成签到任务
    const result = await pointsService.completeDailyTask(userId, 'daily_signin');
    
    return successResponse(res, result, '签到成功');
  } catch (error: any) {
    console.error('签到失败:', error);
    return errorResponse(res, error.message || '签到失败', 500);
  }
}
