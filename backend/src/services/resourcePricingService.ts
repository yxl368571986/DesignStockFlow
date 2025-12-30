/**
 * 资源定价服务
 * 负责资源定价类型设置、积分值验证、批量定价、软删除等功能
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 定价类型枚举
export enum PricingType {
  FREE = 0,        // 免费资源
  PAID_POINTS = 1, // 付费积分资源
  VIP_ONLY = 2,    // VIP专属资源
}

// 积分值验证结果
export interface PointsValidationResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
  adjustedValue?: number;
}

// 定价信息
export interface PricingInfo {
  resourceId: string;
  pricingType: number;
  pointsCost: number;
  pricingLabel: string;
}

// 定价设置参数
export interface SetPricingParams {
  resourceId: string;
  pricingType: number;
  pointsCost: number;
  operatorId: string;
  operatorType: 'uploader' | 'auditor';
  reason?: string;
}

/**
 * 验证积分值是否合法
 * 规则：5-100之间，必须是5的倍数
 * @param pointsCost 积分值
 * @returns 验证结果
 */
export function validatePointsCost(pointsCost: number): PointsValidationResult {
  // 检查是否为数字
  if (typeof pointsCost !== 'number' || isNaN(pointsCost)) {
    return {
      valid: false,
      errorCode: 'INVALID_POINTS_TYPE',
      errorMessage: '积分值必须是数字',
    };
  }

  // 检查是否小于5
  if (pointsCost < 5) {
    return {
      valid: false,
      errorCode: 'POINTS_TOO_LOW',
      errorMessage: '积分不能低于5分',
      adjustedValue: 5,
    };
  }

  // 检查是否大于100
  if (pointsCost > 100) {
    return {
      valid: false,
      errorCode: 'POINTS_TOO_HIGH',
      errorMessage: '积分不能超过100分',
      adjustedValue: 100,
    };
  }

  // 检查是否为5的倍数，如果不是则自动吸附
  if (pointsCost % 5 !== 0) {
    const adjustedValue = Math.round(pointsCost / 5) * 5;
    return {
      valid: false,
      errorCode: 'INVALID_POINTS_STEP',
      errorMessage: '积分需为5的倍数',
      adjustedValue: Math.max(5, Math.min(100, adjustedValue)),
    };
  }

  return { valid: true };
}

/**
 * 将积分值吸附到最近的5的倍数
 * @param value 原始值
 * @returns 吸附后的值
 */
export function snapToNearestFive(value: number): number {
  const snapped = Math.round(value / 5) * 5;
  return Math.max(5, Math.min(100, snapped));
}

/**
 * 根据定价类型获取定价标签
 * @param pricingType 定价类型
 * @param pointsCost 积分价格
 * @returns 定价标签
 */
export function getPricingLabel(pricingType: number, pointsCost: number): string {
  switch (pricingType) {
    case PricingType.FREE:
      return '免费';
    case PricingType.PAID_POINTS:
      return `${pointsCost}积分`;
    case PricingType.VIP_ONLY:
      return 'VIP专属';
    default:
      return '未知';
  }
}

/**
 * 设置资源定价
 * @param params 定价参数
 */
export async function setPricing(params: SetPricingParams): Promise<void> {
  const { resourceId, pricingType, pointsCost, operatorId, operatorType, reason } = params;

  // 获取当前资源信息
  const resource = await prisma.resources.findUnique({
    where: { resource_id: resourceId },
    select: {
      pricing_type: true,
      points_cost: true,
      user_id: true,
    },
  });

  if (!resource) {
    throw new Error('资源不存在');
  }

  // 验证定价类型
  if (![PricingType.FREE, PricingType.PAID_POINTS, PricingType.VIP_ONLY].includes(pricingType)) {
    throw new Error('无效的定价类型');
  }

  // 计算实际积分值
  let actualPointsCost = 0;
  if (pricingType === PricingType.PAID_POINTS) {
    const validation = validatePointsCost(pointsCost);
    if (!validation.valid) {
      if (validation.adjustedValue !== undefined) {
        actualPointsCost = validation.adjustedValue;
      } else {
        throw new Error(validation.errorMessage);
      }
    } else {
      actualPointsCost = pointsCost;
    }
  }

  // 使用事务更新资源和记录变更日志
  await prisma.$transaction(async (tx) => {
    // 更新资源定价
    await tx.resources.update({
      where: { resource_id: resourceId },
      data: {
        pricing_type: pricingType,
        points_cost: actualPointsCost,
        updated_at: new Date(),
      },
    });

    // 记录定价变更日志
    await tx.pricing_change_logs.create({
      data: {
        resource_id: resourceId,
        operator_id: operatorId,
        operator_type: operatorType,
        old_pricing_type: resource.pricing_type,
        new_pricing_type: pricingType,
        old_points_cost: resource.points_cost,
        new_points_cost: actualPointsCost,
        reason: reason || null,
      },
    });
  });
}

/**
 * 批量设置资源定价
 * @param resourceIds 资源ID列表
 * @param pricingType 定价类型
 * @param pointsCost 积分价格
 * @param operatorId 操作者ID
 * @param operatorType 操作者类型
 */
export async function setBatchPricing(
  resourceIds: string[],
  pricingType: number,
  pointsCost: number,
  operatorId: string,
  operatorType: 'uploader' | 'auditor'
): Promise<{ success: number; failed: number; errors: string[] }> {
  const result = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const resourceId of resourceIds) {
    try {
      await setPricing({
        resourceId,
        pricingType,
        pointsCost,
        operatorId,
        operatorType,
      });
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(`资源 ${resourceId}: ${(error as Error).message}`);
    }
  }

  return result;
}

/**
 * 获取资源定价信息
 * @param resourceId 资源ID
 * @returns 定价信息
 */
export async function getPricingInfo(resourceId: string): Promise<PricingInfo | null> {
  const resource = await prisma.resources.findUnique({
    where: { resource_id: resourceId },
    select: {
      resource_id: true,
      pricing_type: true,
      points_cost: true,
    },
  });

  if (!resource) {
    return null;
  }

  return {
    resourceId: resource.resource_id,
    pricingType: resource.pricing_type,
    pointsCost: resource.points_cost,
    pricingLabel: getPricingLabel(resource.pricing_type, resource.points_cost),
  };
}

/**
 * 软删除资源（保留收益记录）
 * @param resourceId 资源ID
 * @param operatorId 操作者ID
 */
export async function softDeleteResource(resourceId: string, _operatorId: string): Promise<void> {
  const resource = await prisma.resources.findUnique({
    where: { resource_id: resourceId },
    select: { user_id: true, is_deleted: true },
  });

  if (!resource) {
    throw new Error('资源不存在');
  }

  if (resource.is_deleted) {
    throw new Error('资源已被删除');
  }

  await prisma.resources.update({
    where: { resource_id: resourceId },
    data: {
      is_deleted: true,
      updated_at: new Date(),
    },
  });
}

/**
 * 获取定价变更历史
 * @param resourceId 资源ID
 * @param options 查询选项
 */
export async function getPricingChangeHistory(
  resourceId: string,
  options: { pageNum?: number; pageSize?: number } = {}
): Promise<{
  list: Array<{
    logId: string;
    operatorId: string;
    operatorType: string;
    oldPricingType: number;
    newPricingType: number;
    oldPointsCost: number;
    newPointsCost: number;
    reason: string | null;
    createdAt: Date;
  }>;
  total: number;
}> {
  const { pageNum = 1, pageSize = 10 } = options;
  const skip = (pageNum - 1) * pageSize;

  const [logs, total] = await Promise.all([
    prisma.pricing_change_logs.findMany({
      where: { resource_id: resourceId },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.pricing_change_logs.count({
      where: { resource_id: resourceId },
    }),
  ]);

  return {
    list: logs.map((log) => ({
      logId: log.log_id,
      operatorId: log.operator_id,
      operatorType: log.operator_type,
      oldPricingType: log.old_pricing_type,
      newPricingType: log.new_pricing_type,
      oldPointsCost: log.old_points_cost,
      newPointsCost: log.new_points_cost,
      reason: log.reason,
      createdAt: log.created_at,
    })),
    total,
  };
}

export default {
  validatePointsCost,
  snapToNearestFive,
  getPricingLabel,
  setPricing,
  setBatchPricing,
  getPricingInfo,
  softDeleteResource,
  getPricingChangeHistory,
  PricingType,
};
