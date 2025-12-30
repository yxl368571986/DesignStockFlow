/**
 * 管理端充值控制器
 * 处理管理员充值套餐管理、订单管理、积分调整等请求
 */

import { Request, Response } from 'express';
import { rechargePackageService } from '../services/rechargePackageService.js';
import { rechargeOrderService } from '../services/rechargeOrderService.js';
import { adminPointsService, AdjustmentType } from '../services/adminPointsService.js';
import { rechargeReconciliationService } from '../services/reconciliation/rechargeReconciliationService.js';
import { statisticsService } from '../services/statisticsService.js';
import { success as successResponse, error as errorResponse } from '../utils/response.js';

// ==================== 套餐管理 ====================

/**
 * 获取所有套餐（包括禁用的）
 * GET /api/v1/admin/recharge/packages
 */
export async function getAllPackages(req: Request, res: Response) {
  try {
    const { page, pageSize, status } = req.query;

    const options: any = {};
    if (page) options.page = parseInt(page as string);
    if (pageSize) options.pageSize = parseInt(pageSize as string);
    if (status !== undefined) options.status = parseInt(status as string);

    const result = await rechargePackageService.getAllPackages();
    return successResponse(res, result, '获取套餐列表成功');
  } catch (error: any) {
    console.error('获取套餐列表失败:', error);
    return errorResponse(res, error.message || '获取套餐列表失败', 500);
  }
}

/**
 * 创建套餐
 * POST /api/v1/admin/recharge/packages
 */
export async function createPackage(req: Request, res: Response) {
  try {
    const packageData = req.body;

    if (!packageData.packageName) {
      return errorResponse(res, '套餐名称不能为空', 400);
    }
    if (!packageData.packageCode) {
      return errorResponse(res, '套餐编码不能为空', 400);
    }
    if (!packageData.price || packageData.price <= 0) {
      return errorResponse(res, '价格必须为正数', 400);
    }

    const result = await rechargePackageService.createPackage(packageData);
    return successResponse(res, result, '创建套餐成功');
  } catch (error: any) {
    console.error('创建套餐失败:', error);
    return errorResponse(res, error.message || '创建套餐失败', 500);
  }
}

/**
 * 更新套餐
 * PUT /api/v1/admin/recharge/packages/:packageId
 */
export async function updatePackage(req: Request, res: Response) {
  try {
    const { packageId } = req.params;
    const packageData = req.body;

    if (!packageId) {
      return errorResponse(res, '套餐ID不能为空', 400);
    }

    const result = await rechargePackageService.updatePackage(packageId, packageData);
    return successResponse(res, result, '更新套餐成功');
  } catch (error: any) {
    console.error('更新套餐失败:', error);
    return errorResponse(res, error.message || '更新套餐失败', 500);
  }
}

/**
 * 禁用套餐
 * DELETE /api/v1/admin/recharge/packages/:packageId
 */
export async function disablePackage(req: Request, res: Response) {
  try {
    const { packageId } = req.params;

    if (!packageId) {
      return errorResponse(res, '套餐ID不能为空', 400);
    }

    const result = await rechargePackageService.disablePackage(packageId);
    return successResponse(res, result, '禁用套餐成功');
  } catch (error: any) {
    console.error('禁用套餐失败:', error);
    return errorResponse(res, error.message || '禁用套餐失败', 500);
  }
}

/**
 * 更新套餐排序
 * PUT /api/v1/admin/recharge/packages/sort
 */
export async function updatePackageSort(req: Request, res: Response) {
  try {
    const { sortOrders } = req.body;

    if (!sortOrders || !Array.isArray(sortOrders)) {
      return errorResponse(res, '排序数据格式错误', 400);
    }

    // 逐个更新排序
    for (const item of sortOrders) {
      await rechargePackageService.updateSortOrder(item.packageId, item.sortOrder);
    }
    return successResponse(res, null, '更新排序成功');
  } catch (error: any) {
    console.error('更新排序失败:', error);
    return errorResponse(res, error.message || '更新排序失败', 500);
  }
}

// ==================== 订单管理 ====================

/**
 * 获取充值订单列表
 * GET /api/v1/admin/recharge/orders
 */
export async function getRechargeOrders(req: Request, res: Response) {
  try {
    const { page, pageSize, userId, status, orderNo, startDate, endDate } = req.query;

    const options: any = {};
    if (page) options.page = parseInt(page as string);
    if (pageSize) options.pageSize = parseInt(pageSize as string);
    if (userId) options.userId = userId as string;
    if (status !== undefined) options.status = parseInt(status as string);
    if (orderNo) options.orderNo = orderNo as string;
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);

    const result = await rechargeOrderService.getAllOrders(options);
    return successResponse(res, result, '获取订单列表成功');
  } catch (error: any) {
    console.error('获取订单列表失败:', error);
    return errorResponse(res, error.message || '获取订单列表失败', 500);
  }
}

/**
 * 获取订单详情
 * GET /api/v1/admin/recharge/orders/:orderId
 */
export async function getRechargeOrderDetail(req: Request, res: Response) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return errorResponse(res, '订单ID不能为空', 400);
    }

    const order = await rechargeOrderService.getOrderById(orderId);
    if (!order) {
      return errorResponse(res, '订单不存在', 404);
    }

    return successResponse(res, order, '获取订单详情成功');
  } catch (error: any) {
    console.error('获取订单详情失败:', error);
    return errorResponse(res, error.message || '获取订单详情失败', 500);
  }
}

// ==================== 积分调整 ====================

/**
 * 调整用户积分
 * POST /api/v1/admin/points/adjust
 */
export async function adjustUserPoints(req: Request, res: Response) {
  try {
    const adminId = (req as any).user?.userId;
    if (!adminId) {
      return errorResponse(res, '未登录', 401);
    }

    // 注意：requestFieldTransform 中间件会将 camelCase 转换为 snake_case
    // 同时兼容两种命名格式
    const targetUserId = req.body.target_user_id || req.body.targetUserId;
    const adjustmentType = req.body.adjustment_type || req.body.adjustmentType;
    const pointsChange = req.body.points_change || req.body.pointsChange;
    const reason = req.body.reason;

    if (!targetUserId) {
      return errorResponse(res, '目标用户ID不能为空', 400);
    }
    if (!adjustmentType || !['add', 'deduct'].includes(adjustmentType)) {
      return errorResponse(res, '调整类型无效', 400);
    }
    if (!pointsChange || pointsChange <= 0) {
      return errorResponse(res, '积分变动值必须为正数', 400);
    }
    if (!reason) {
      return errorResponse(res, '调整原因不能为空', 400);
    }

    // 检查是否需要审批
    const needsApproval = adminPointsService.checkApprovalRequired(pointsChange, 1);
    if (needsApproval) {
      // TODO: 实现审批流程
      // 目前先记录日志，允许操作
      console.log(`大额积分调整需要审批: adminId=${adminId}, points=${pointsChange}`);
    }

    const result = await adminPointsService.adjustUserPoints({
      adminId,
      targetUserId,
      adjustmentType: adjustmentType === 'add' ? AdjustmentType.ADD : AdjustmentType.DEDUCT,
      pointsChange,
      reason
    });

    return successResponse(res, result, '积分调整成功');
  } catch (error: any) {
    console.error('积分调整失败:', error);
    return errorResponse(res, error.message || '积分调整失败', 500);
  }
}

/**
 * 批量赠送积分
 * POST /api/v1/admin/points/batch-gift
 */
export async function batchGiftPoints(req: Request, res: Response) {
  try {
    const adminId = (req as any).user?.userId;
    if (!adminId) {
      return errorResponse(res, '未登录', 401);
    }

    const { userIds, points, reason } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse(res, '用户ID列表不能为空', 400);
    }
    if (!points || points <= 0) {
      return errorResponse(res, '赠送积分必须为正数', 400);
    }
    if (!reason) {
      return errorResponse(res, '赠送原因不能为空', 400);
    }

    // 检查是否需要审批
    const needsApproval = adminPointsService.checkApprovalRequired(points, userIds.length);
    if (needsApproval) {
      console.log(`批量赠送需要审批: adminId=${adminId}, users=${userIds.length}, points=${points}`);
    }

    const result = await adminPointsService.batchGiftPoints({
      adminId,
      userIds,
      points,
      reason
    });

    return successResponse(res, result, '批量赠送完成');
  } catch (error: any) {
    console.error('批量赠送失败:', error);
    return errorResponse(res, error.message || '批量赠送失败', 500);
  }
}

/**
 * 撤销积分调整
 * POST /api/v1/admin/points/revoke/:logId
 */
export async function revokeAdjustment(req: Request, res: Response) {
  try {
    const adminId = (req as any).user?.userId;
    if (!adminId) {
      return errorResponse(res, '未登录', 401);
    }

    const { logId } = req.params;
    const { reason } = req.body;

    if (!logId) {
      return errorResponse(res, '日志ID不能为空', 400);
    }
    if (!reason) {
      return errorResponse(res, '撤销原因不能为空', 400);
    }

    const result = await adminPointsService.revokeAdjustment(logId, adminId, reason);
    return successResponse(res, result, '撤销成功');
  } catch (error: any) {
    console.error('撤销失败:', error);
    return errorResponse(res, error.message || '撤销失败', 500);
  }
}

/**
 * 获取积分调整日志
 * GET /api/v1/admin/points/adjustment-logs
 */
export async function getAdjustmentLogs(req: Request, res: Response) {
  try {
    const { page, pageSize, adminId, targetUserId, adjustmentType, startDate, endDate } = req.query;

    const options: any = {};
    if (page) options.page = parseInt(page as string);
    if (pageSize) options.pageSize = parseInt(pageSize as string);
    if (adminId) options.adminId = adminId as string;
    if (targetUserId) options.targetUserId = targetUserId as string;
    if (adjustmentType) options.adjustmentType = adjustmentType as string;
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);

    const result = await adminPointsService.getAdjustmentLogs(options);
    return successResponse(res, result, '获取调整日志成功');
  } catch (error: any) {
    console.error('获取调整日志失败:', error);
    return errorResponse(res, error.message || '获取调整日志失败', 500);
  }
}

// ==================== 对账管理 ====================

/**
 * 执行对账
 * POST /api/v1/admin/recharge/reconcile
 */
export async function reconcileOrders(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return errorResponse(res, '请指定对账时间范围', 400);
    }

    const result = await rechargeReconciliationService.reconcile(
      new Date(startDate),
      new Date(endDate)
    );

    return successResponse(res, result, '对账完成');
  } catch (error: any) {
    console.error('对账失败:', error);
    return errorResponse(res, error.message || '对账失败', 500);
  }
}

/**
 * 获取异常订单
 * GET /api/v1/admin/recharge/anomalous-orders
 */
export async function getAnomalousOrders(req: Request, res: Response) {
  try {
    const orders = await rechargeReconciliationService.findAnomalousOrders();
    return successResponse(res, orders, '获取异常订单成功');
  } catch (error: any) {
    console.error('获取异常订单失败:', error);
    return errorResponse(res, error.message || '获取异常订单失败', 500);
  }
}

/**
 * 自动补单
 * POST /api/v1/admin/recharge/auto-fix/:orderId
 */
export async function autoFixOrder(req: Request, res: Response) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return errorResponse(res, '订单ID不能为空', 400);
    }

    const result = await rechargeReconciliationService.autoFix(orderId);
    return successResponse(res, { success: result }, '补单成功');
  } catch (error: any) {
    console.error('补单失败:', error);
    return errorResponse(res, error.message || '补单失败', 500);
  }
}

/**
 * 获取对账统计
 * GET /api/v1/admin/recharge/reconciliation-stats
 */
export async function getReconciliationStats(req: Request, res: Response) {
  try {
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;

    const stats = await rechargeReconciliationService.getReconciliationStats(daysNum);
    return successResponse(res, stats, '获取对账统计成功');
  } catch (error: any) {
    console.error('获取对账统计失败:', error);
    return errorResponse(res, error.message || '获取对账统计失败', 500);
  }
}

// ==================== 统计功能 ====================

/**
 * 获取充值统计
 * GET /api/v1/admin/recharge/statistics
 */
export async function getRechargeStatistics(req: Request, res: Response) {
  try {
    const { dimension, startDate, endDate } = req.query;

    const result = await statisticsService.getRechargeStatistics(
      (dimension as string) || 'day',
      startDate as string | undefined,
      endDate as string | undefined
    );

    return successResponse(res, result, '获取充值统计成功');
  } catch (error: any) {
    console.error('获取充值统计失败:', error);
    return errorResponse(res, error.message || '获取充值统计失败', 500);
  }
}

/**
 * 获取积分流水统计
 * GET /api/v1/admin/points/flow-statistics
 */
export async function getPointsFlowStatistics(req: Request, res: Response) {
  try {
    const { dimension, startDate, endDate } = req.query;

    const result = await statisticsService.getPointsFlowStatistics(
      (dimension as string) || 'day',
      startDate as string | undefined,
      endDate as string | undefined
    );

    return successResponse(res, result, '获取积分流水统计成功');
  } catch (error: any) {
    console.error('获取积分流水统计失败:', error);
    return errorResponse(res, error.message || '获取积分流水统计失败', 500);
  }
}
