/**
 * 资源定价控制器
 * 处理资源定价设置、查询等 API 请求
 * 
 * 需求: 1.1, 1.6
 */

import { Request, Response } from 'express';
import * as resourcePricingService from '../services/resourcePricingService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 设置资源定价
 * POST /api/v1/resources/:resourceId/pricing
 * 
 * 需求: 1.1
 */
export async function setPricingHandler(req: Request, res: Response): Promise<void> {
  try {
    const { resourceId } = req.params;
    const { pricing_type: pricingType, points_cost: pointsCost } = req.body;
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    // 检查资源是否存在且属于当前用户
    const resource = await prisma.resources.findUnique({
      where: { resource_id: resourceId },
      select: { user_id: true },
    });
    
    if (!resource) {
      res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: '资源不存在' });
      return;
    }
    
    if (resource.user_id !== userId) {
      res.status(403).json({ code: 'FORBIDDEN', message: '无权修改此资源定价' });
      return;
    }
    
    // 验证定价类型
    if (pricingType === undefined || ![0, 1, 2].includes(pricingType)) {
      res.status(400).json({
        code: 'INVALID_PRICING_TYPE',
        message: '无效的定价类型，必须是 0(免费)、1(付费积分) 或 2(VIP专属)',
      });
      return;
    }
    
    // 如果是付费积分类型，验证积分值
    if (pricingType === 1) {
      if (pointsCost === undefined || typeof pointsCost !== 'number') {
        res.status(400).json({
          code: 'INVALID_POINTS_COST',
          message: '付费积分类型必须提供积分值',
        });
        return;
      }
      
      const validation = resourcePricingService.validatePointsCost(pointsCost);
      if (!validation.valid && validation.adjustedValue === undefined) {
        res.status(400).json({
          code: validation.errorCode,
          message: validation.errorMessage,
        });
        return;
      }
    }
    
    await resourcePricingService.setPricing({
      resourceId,
      pricingType,
      pointsCost: pricingType === 1 ? pointsCost : 0,
      operatorId: userId,
      operatorType: 'uploader',
    });
    
    res.json({
      code: 0,
      message: '定价设置成功',
    });
  } catch (error) {
    console.error('设置定价失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 获取资源定价信息
 * GET /api/v1/resources/:resourceId/pricing
 * 
 * 需求: 1.1
 */
export async function getPricingHandler(req: Request, res: Response): Promise<void> {
  try {
    const { resourceId } = req.params;
    
    const pricingInfo = await resourcePricingService.getPricingInfo(resourceId);
    
    if (!pricingInfo) {
      res.status(404).json({ code: 'RESOURCE_NOT_FOUND', message: '资源不存在' });
      return;
    }
    
    res.json({
      code: 0,
      message: '获取成功',
      data: pricingInfo,
    });
  } catch (error) {
    console.error('获取定价信息失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 批量设置资源定价
 * POST /api/v1/resources/batch-pricing
 * 
 * 需求: 1.6
 */
export async function setBatchPricingHandler(req: Request, res: Response): Promise<void> {
  try {
    const { resource_ids: resourceIds, pricing_type: pricingType, points_cost: pointsCost } = req.body;
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      res.status(400).json({ code: 'INVALID_RESOURCE_IDS', message: '请提供资源ID列表' });
      return;
    }
    
    // 验证定价类型
    if (pricingType === undefined || ![0, 1, 2].includes(pricingType)) {
      res.status(400).json({
        code: 'INVALID_PRICING_TYPE',
        message: '无效的定价类型',
      });
      return;
    }
    
    // 验证所有资源都属于当前用户
    const resources = await prisma.resources.findMany({
      where: { resource_id: { in: resourceIds } },
      select: { resource_id: true, user_id: true },
    });
    
    const notOwnedIds = resources
      .filter(r => r.user_id !== userId)
      .map(r => r.resource_id);
    
    if (notOwnedIds.length > 0) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: `以下资源不属于您: ${notOwnedIds.join(', ')}`,
      });
      return;
    }
    
    const result = await resourcePricingService.setBatchPricing(
      resourceIds,
      pricingType,
      pricingType === 1 ? pointsCost : 0,
      userId,
      'uploader'
    );
    
    res.json({
      code: 0,
      message: `批量设置完成，成功 ${result.success} 个，失败 ${result.failed} 个`,
      data: result,
    });
  } catch (error) {
    console.error('批量设置定价失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}
