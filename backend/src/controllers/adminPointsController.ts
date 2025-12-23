import { Request, Response } from 'express';
import * as pointsService from '../services/pointsService';
import { success as successResponse, error as errorResponse } from '../utils/response';

/**
 * 获取积分规则列表
 * GET /api/v1/admin/points/rules
 */
export async function getPointsRules(req: Request, res: Response) {
  try {
    const rules = await pointsService.getAllPointsRules();
    return successResponse(res, rules, '获取积分规则成功');
  } catch (error: any) {
    console.error('获取积分规则失败:', error);
    return errorResponse(res, error.message || '获取积分规则失败', 500);
  }
}

/**
 * 更新积分规则
 * PUT /api/v1/admin/points/rules/:ruleId
 */
export async function updatePointsRule(req: Request, res: Response) {
  try {
    const { ruleId } = req.params;
    const { pointsValue, description, isEnabled } = req.body;

    const rule = await pointsService.updatePointsRule(ruleId, {
      pointsValue,
      description,
      isEnabled
    });

    return successResponse(res, rule, '更新积分规则成功');
  } catch (error: any) {
    console.error('更新积分规则失败:', error);
    return errorResponse(res, error.message || '更新积分规则失败', 500);
  }
}

/**
 * 获取积分商品列表
 * GET /api/v1/admin/points/products
 */
export async function getPointsProducts(req: Request, res: Response) {
  try {
    const products = await pointsService.getAllPointsProducts();
    return successResponse(res, products, '获取商品列表成功');
  } catch (error: any) {
    console.error('获取商品列表失败:', error);
    return errorResponse(res, error.message || '获取商品列表失败', 500);
  }
}

/**
 * 添加积分商品
 * POST /api/v1/admin/points/products
 */
export async function addPointsProduct(req: Request, res: Response) {
  try {
    const {
      productName,
      productType,
      productCode,
      pointsRequired,
      productValue,
      stock,
      imageUrl,
      description,
      sortOrder
    } = req.body;

    if (!productName || !productType || !productCode || !pointsRequired) {
      return errorResponse(res, '商品名称、类型、代码和所需积分不能为空', 400);
    }

    const product = await pointsService.addPointsProduct({
      productName,
      productType,
      productCode,
      pointsRequired,
      productValue,
      stock,
      imageUrl,
      description,
      sortOrder
    });

    return successResponse(res, product, '添加商品成功');
  } catch (error: any) {
    console.error('添加商品失败:', error);
    return errorResponse(res, error.message || '添加商品失败', 500);
  }
}

/**
 * 更新积分商品
 * PUT /api/v1/admin/points/products/:productId
 */
export async function updatePointsProduct(req: Request, res: Response) {
  try {
    const { productId } = req.params;
    const {
      productName,
      pointsRequired,
      productValue,
      stock,
      imageUrl,
      description,
      sortOrder,
      status
    } = req.body;

    const product = await pointsService.updatePointsProduct(productId, {
      productName,
      pointsRequired,
      productValue,
      stock,
      imageUrl,
      description,
      sortOrder,
      status
    });

    return successResponse(res, product, '更新商品成功');
  } catch (error: any) {
    console.error('更新商品失败:', error);
    return errorResponse(res, error.message || '更新商品失败', 500);
  }
}

/**
 * 删除积分商品
 * DELETE /api/v1/admin/points/products/:productId
 */
export async function deletePointsProduct(req: Request, res: Response) {
  try {
    const { productId } = req.params;

    await pointsService.deletePointsProduct(productId);

    return successResponse(res, null, '删除商品成功');
  } catch (error: any) {
    console.error('删除商品失败:', error);
    return errorResponse(res, error.message || '删除商品失败', 500);
  }
}

/**
 * 获取兑换记录
 * GET /api/v1/admin/points/exchange-records
 */
export async function getExchangeRecords(req: Request, res: Response) {
  try {
    const { page, pageSize, deliveryStatus } = req.query;

    const options: any = {};
    if (page) options.page = parseInt(page as string);
    if (pageSize) options.pageSize = parseInt(pageSize as string);
    if (deliveryStatus !== undefined) options.deliveryStatus = parseInt(deliveryStatus as string);

    const result = await pointsService.getAllExchangeRecords(options);

    return successResponse(res, result, '获取兑换记录成功');
  } catch (error: any) {
    console.error('获取兑换记录失败:', error);
    return errorResponse(res, error.message || '获取兑换记录失败', 500);
  }
}

/**
 * 发货
 * PUT /api/v1/admin/points/exchange-records/:exchangeId/ship
 */
export async function shipExchangeRecord(req: Request, res: Response) {
  try {
    const { exchangeId } = req.params;
    const { trackingNumber } = req.body;

    if (!trackingNumber) {
      return errorResponse(res, '物流单号不能为空', 400);
    }

    const result = await pointsService.shipExchangeRecord(exchangeId, trackingNumber);

    return successResponse(res, result, '发货成功');
  } catch (error: any) {
    console.error('发货失败:', error);
    return errorResponse(res, error.message || '发货失败', 500);
  }
}

/**
 * 获取积分统计
 * GET /api/v1/admin/points/statistics
 */
export async function getPointsStatistics(req: Request, res: Response) {
  try {
    const statistics = await pointsService.getPointsStatistics();
    return successResponse(res, statistics, '获取积分统计成功');
  } catch (error: any) {
    console.error('获取积分统计失败:', error);
    return errorResponse(res, error.message || '获取积分统计失败', 500);
  }
}

/**
 * 手动调整用户积分
 * POST /api/v1/admin/users/:userId/points/adjust
 */
export async function adjustUserPoints(req: Request, res: Response) {
  try {
    const adminId = (req as any).user?.userId;
    const { userId } = req.params;
    const { pointsChange, reason } = req.body;

    if (!pointsChange || pointsChange === 0) {
      return errorResponse(res, '积分变动值不能为空或0', 400);
    }

    if (!reason) {
      return errorResponse(res, '调整原因不能为空', 400);
    }

    const result = await pointsService.adjustUserPoints(userId, pointsChange, reason, adminId);

    return successResponse(res, result, '调整积分成功');
  } catch (error: any) {
    console.error('调整积分失败:', error);
    return errorResponse(res, error.message || '调整积分失败', 500);
  }
}
