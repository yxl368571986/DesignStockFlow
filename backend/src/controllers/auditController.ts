/**
 * 审核控制器
 * 处理人工审核相关的 API 请求
 */

import { Request, Response } from 'express';
import {
  getAuditList,
  approveResource,
  rejectResource,
  batchApprove,
  batchReject,
  getPresetRejectReasons,
  getFileDetails,
} from '../services/manualAuditService.js';
import { getAuditLogs, getResourceAuditHistory } from '../services/auditLogService.js';
import { sendAuditNotification } from '../services/notificationService.js';
import { AuditErrorCodes } from '../config/audit.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取待审核资源列表
 * GET /api/v1/admin/audit/list
 */
export async function getAuditListHandler(req: Request, res: Response): Promise<void> {
  try {
    const {
      pageNum = '1',
      pageSize = '20',
      uploaderId,
      fileType,
      sortBy,
      sortOrder,
    } = req.query;
    
    const result = await getAuditList({
      pageNum: Number(pageNum),
      pageSize: Number(pageSize),
      uploaderId: uploaderId as string | undefined,
      fileType: fileType as string | undefined,
      sortBy: sortBy as 'uploadTime' | 'fileSize' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });
    
    res.json({
      code: 0,
      message: '获取成功',
      data: result,
    });
  } catch (error) {
    console.error('获取审核列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 审核通过
 * POST /api/v1/admin/audit/:resourceId/approve
 */
export async function approveHandler(req: Request, res: Response): Promise<void> {
  try {
    const { resourceId } = req.params;
    const operatorId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!operatorId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    // 获取资源信息用于发送通知
    const resource = await prisma.resources.findUnique({
      where: { resource_id: resourceId },
    });
    
    if (!resource) {
      res.status(404).json({
        code: AuditErrorCodes.AUDIT_001.code,
        message: AuditErrorCodes.AUDIT_001.message,
      });
      return;
    }
    
    await approveResource(resourceId, operatorId);
    
    // 发送通知给资源上传者
    if (resource.user_id) {
      await sendAuditNotification({
        userId: resource.user_id,
        resourceId,
        resourceTitle: resource.title,
        auditResult: 'approved',
      });
    }
    
    res.json({
      code: 0,
      message: '审核通过',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '服务器错误';
    
    if (errorMessage === '资源不存在') {
      res.status(404).json({
        code: AuditErrorCodes.AUDIT_001.code,
        message: AuditErrorCodes.AUDIT_001.message,
      });
      return;
    }
    
    if (errorMessage === '资源已审核') {
      res.status(400).json({
        code: AuditErrorCodes.AUDIT_002.code,
        message: AuditErrorCodes.AUDIT_002.message,
      });
      return;
    }
    
    console.error('审核通过失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}


/**
 * 审核驳回
 * POST /api/v1/admin/audit/:resourceId/reject
 */
export async function rejectHandler(req: Request, res: Response): Promise<void> {
  try {
    const { resourceId } = req.params;
    // 注意：requestFieldTransform 中间件会将 camelCase 转换为 snake_case
    const { reason_code: reasonCode, reason_detail: reasonDetail } = req.body;
    const operatorId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!operatorId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    if (!reasonCode) {
      res.status(400).json({
        code: AuditErrorCodes.AUDIT_004.code,
        message: AuditErrorCodes.AUDIT_004.message,
      });
      return;
    }
    
    // 获取资源信息用于发送通知
    const resource = await prisma.resources.findUnique({
      where: { resource_id: resourceId },
    });
    
    if (!resource) {
      res.status(404).json({
        code: AuditErrorCodes.AUDIT_001.code,
        message: AuditErrorCodes.AUDIT_001.message,
      });
      return;
    }
    
    await rejectResource({
      resourceId,
      operatorId,
      reasonCode,
      reasonDetail,
    });
    
    // 发送通知给资源上传者
    if (resource.user_id) {
      await sendAuditNotification({
        userId: resource.user_id,
        resourceId,
        resourceTitle: resource.title,
        auditResult: 'rejected',
        rejectReason: reasonDetail || reasonCode,
      });
    }
    
    res.json({
      code: 0,
      message: '已驳回',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '服务器错误';
    
    if (errorMessage === '资源不存在') {
      res.status(404).json({
        code: AuditErrorCodes.AUDIT_001.code,
        message: AuditErrorCodes.AUDIT_001.message,
      });
      return;
    }
    
    if (errorMessage === '资源已审核') {
      res.status(400).json({
        code: AuditErrorCodes.AUDIT_002.code,
        message: AuditErrorCodes.AUDIT_002.message,
      });
      return;
    }
    
    console.error('审核驳回失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 批量审核通过
 * POST /api/v1/admin/audit/batch-approve
 */
export async function batchApproveHandler(req: Request, res: Response): Promise<void> {
  try {
    // 注意：requestFieldTransform 中间件会将 camelCase 转换为 snake_case
    const { resource_ids: resourceIds } = req.body;
    const operatorId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!operatorId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      res.status(400).json({ code: 400, message: '请选择要审核的资源' });
      return;
    }
    
    const result = await batchApprove(resourceIds, operatorId);
    
    // 为成功审核的资源发送通知
    for (const resourceId of resourceIds) {
      if (!result.failedIds.includes(resourceId)) {
        const resource = await prisma.resources.findUnique({
          where: { resource_id: resourceId },
        });
        if (resource?.user_id) {
          await sendAuditNotification({
            userId: resource.user_id,
            resourceId,
            resourceTitle: resource.title,
            auditResult: 'approved',
          });
        }
      }
    }
    
    res.json({
      code: 0,
      message: `批量审核完成，成功 ${result.successCount} 个，失败 ${result.failCount} 个`,
      data: result,
    });
  } catch (error) {
    console.error('批量审核通过失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 批量审核驳回
 * POST /api/v1/admin/audit/batch-reject
 */
export async function batchRejectHandler(req: Request, res: Response): Promise<void> {
  try {
    // 注意：requestFieldTransform 中间件会将 camelCase 转换为 snake_case
    const { resource_ids: resourceIds, reason_code: reasonCode, reason_detail: reasonDetail } = req.body;
    const operatorId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!operatorId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      res.status(400).json({ code: 400, message: '请选择要审核的资源' });
      return;
    }
    
    if (!reasonCode) {
      res.status(400).json({
        code: AuditErrorCodes.AUDIT_004.code,
        message: AuditErrorCodes.AUDIT_004.message,
      });
      return;
    }
    
    const result = await batchReject({
      resourceIds,
      operatorId,
      reasonCode,
      reasonDetail,
    });
    
    // 为成功驳回的资源发送通知
    for (const resourceId of resourceIds) {
      if (!result.failedIds.includes(resourceId)) {
        const resource = await prisma.resources.findUnique({
          where: { resource_id: resourceId },
        });
        if (resource?.user_id) {
          await sendAuditNotification({
            userId: resource.user_id,
            resourceId,
            resourceTitle: resource.title,
            auditResult: 'rejected',
            rejectReason: reasonDetail || reasonCode,
          });
        }
      }
    }
    
    res.json({
      code: 0,
      message: `批量驳回完成，成功 ${result.successCount} 个，失败 ${result.failCount} 个`,
      data: result,
    });
  } catch (error) {
    console.error('批量审核驳回失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 获取预设驳回原因列表
 * GET /api/v1/admin/audit/reject-reasons
 */
export async function getRejectReasonsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const reasons = getPresetRejectReasons();
    res.json({
      code: 0,
      message: '获取成功',
      data: reasons,
    });
  } catch (error) {
    console.error('获取驳回原因失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 获取资源详情
 * GET /api/v1/admin/audit/:resourceId/details
 */
export async function getResourceDetailsHandler(req: Request, res: Response): Promise<void> {
  try {
    const { resourceId } = req.params;
    
    const details = await getFileDetails(resourceId);
    
    if (!details) {
      res.status(404).json({
        code: AuditErrorCodes.AUDIT_001.code,
        message: AuditErrorCodes.AUDIT_001.message,
      });
      return;
    }
    
    res.json({
      code: 0,
      message: '获取成功',
      data: details,
    });
  } catch (error) {
    console.error('获取资源详情失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 获取审核日志列表
 * GET /api/v1/admin/audit/logs
 */
export async function getAuditLogsHandler(req: Request, res: Response): Promise<void> {
  try {
    const {
      pageNum = '1',
      pageSize = '20',
      resourceId,
      operatorId,
      startTime,
      endTime,
    } = req.query;
    
    const result = await getAuditLogs({
      pageNum: Number(pageNum),
      pageSize: Number(pageSize),
      resourceId: resourceId as string | undefined,
      operatorId: operatorId as string | undefined,
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
    });
    
    res.json({
      code: 0,
      message: '获取成功',
      data: result,
    });
  } catch (error) {
    console.error('获取审核日志失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 获取资源审核历史
 * GET /api/v1/admin/audit/:resourceId/history
 */
export async function getResourceHistoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const { resourceId } = req.params;
    
    const history = await getResourceAuditHistory(resourceId);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: history,
    });
  } catch (error) {
    console.error('获取审核历史失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}


/**
 * 审核员调整资源定价
 * POST /api/v1/admin/audit/:resourceId/adjust-pricing
 * 
 * 需求: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export async function adjustResourcePricingHandler(req: Request, res: Response): Promise<void> {
  try {
    const { resourceId } = req.params;
    // 注意：requestFieldTransform 中间件会将 camelCase 转换为 snake_case
    const { pricing_type: pricingType, points_cost: pointsCost, reason } = req.body;
    const operatorId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!operatorId) {
      res.status(401).json({ code: 401, message: '未登录' });
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
      
      // 验证积分值范围和步长
      const { validatePointsCost } = await import('../services/resourcePricingService.js');
      const validation = validatePointsCost(pointsCost);
      if (!validation.valid && validation.adjustedValue === undefined) {
        res.status(400).json({
          code: validation.errorCode,
          message: validation.errorMessage,
        });
        return;
      }
    }
    
    // 验证修改原因
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({
        code: 'REASON_REQUIRED',
        message: '请填写定价调整原因',
      });
      return;
    }
    
    // 获取资源信息
    const resource = await prisma.resources.findUnique({
      where: { resource_id: resourceId },
      select: {
        resource_id: true,
        title: true,
        user_id: true,
        pricing_type: true,
        points_cost: true,
      },
    });
    
    if (!resource) {
      res.status(404).json({
        code: AuditErrorCodes.AUDIT_001.code,
        message: AuditErrorCodes.AUDIT_001.message,
      });
      return;
    }
    
    // 保存旧的定价信息
    const oldPricingType = resource.pricing_type;
    const oldPointsCost = resource.points_cost;
    
    // 调用定价服务设置新定价
    const { setPricing } = await import('../services/resourcePricingService.js');
    await setPricing({
      resourceId,
      pricingType,
      pointsCost: pricingType === 1 ? pointsCost : 0,
      operatorId,
      operatorType: 'auditor',
      reason: reason.trim(),
    });
    
    // 发送定价调整通知给上传者
    if (resource.user_id) {
      const { sendPricingAdjustedNotification } = await import('../services/notificationService.js');
      await sendPricingAdjustedNotification({
        userId: resource.user_id,
        resourceId,
        resourceTitle: resource.title,
        oldPricingType,
        newPricingType: pricingType,
        oldPointsCost,
        newPointsCost: pricingType === 1 ? pointsCost : 0,
        reason: reason.trim(),
        adjustedBy: operatorId,
      });
    }
    
    res.json({
      code: 0,
      message: '定价调整成功',
      data: {
        resourceId,
        oldPricingType,
        newPricingType: pricingType,
        oldPointsCost,
        newPointsCost: pricingType === 1 ? pointsCost : 0,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '服务器错误';
    
    if (errorMessage === '资源不存在') {
      res.status(404).json({
        code: AuditErrorCodes.AUDIT_001.code,
        message: AuditErrorCodes.AUDIT_001.message,
      });
      return;
    }
    
    console.error('定价调整失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 获取资源定价变更历史
 * GET /api/v1/admin/audit/:resourceId/pricing-history
 * 
 * 需求: 8.6
 */
export async function getPricingHistoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const { resourceId } = req.params;
    const { pageNum = '1', pageSize = '10' } = req.query;
    
    // 检查资源是否存在
    const resource = await prisma.resources.findUnique({
      where: { resource_id: resourceId },
      select: { resource_id: true },
    });
    
    if (!resource) {
      res.status(404).json({
        code: AuditErrorCodes.AUDIT_001.code,
        message: AuditErrorCodes.AUDIT_001.message,
      });
      return;
    }
    
    const { getPricingChangeHistory } = await import('../services/resourcePricingService.js');
    const result = await getPricingChangeHistory(resourceId, {
      pageNum: Number(pageNum),
      pageSize: Number(pageSize),
    });
    
    res.json({
      code: 0,
      message: '获取成功',
      data: result,
    });
  } catch (error) {
    console.error('获取定价历史失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}
