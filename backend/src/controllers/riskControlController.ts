/**
 * 风控审核控制器
 * 处理风控预警列表、审核等 API 请求
 * 
 * 需求: 5.7, 5.9, 5.10
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取风控预警列表
 * GET /api/v1/admin/risk-control/list
 * 
 * 需求: 5.7
 */
export async function getRiskControlListHandler(req: Request, res: Response): Promise<void> {
  try {
    const {
      pageNum = '1',
      pageSize = '20',
      status,
      triggerType,
      startDate,
      endDate,
    } = req.query;
    
    const skip = (Number(pageNum) - 1) * Number(pageSize);
    
    // 构建查询条件
    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (triggerType) {
      where.trigger_type = triggerType;
    }
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        (where.created_at as Record<string, Date>).gte = new Date(startDate as string);
      }
      if (endDate) {
        (where.created_at as Record<string, Date>).lte = new Date(endDate as string);
      }
    }
    
    const [logs, total] = await Promise.all([
      prisma.risk_control_logs.findMany({
        where,
        include: {
          resources: {
            select: {
              resource_id: true,
              title: true,
              cover: true,
              user_id: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(pageSize),
      }),
      prisma.risk_control_logs.count({ where }),
    ]);
    
    // 获取资源上传者信息
    const uploaderIds = [...new Set(logs.map(log => log.resources?.user_id).filter(Boolean))] as string[];
    const uploaders = uploaderIds.length > 0 
      ? await prisma.users.findMany({
          where: { user_id: { in: uploaderIds } },
          select: { user_id: true, nickname: true, phone: true },
        })
      : [];
    const uploaderMap = new Map(uploaders.map(u => [u.user_id, u]));
    
    const list = logs.map(log => {
      const uploader = log.resources?.user_id ? uploaderMap.get(log.resources.user_id) : null;
      // 从 trigger_data 中提取风险类型和级别信息
      const triggerData = log.trigger_data as Record<string, unknown> | null;
      
      return {
        logId: log.log_id,
        resourceId: log.resource_id,
        resourceTitle: log.resources?.title || '未知资源',
        resourceCover: log.resources?.cover,
        uploaderId: log.resources?.user_id || null,
        uploaderName: uploader?.nickname || uploader?.phone || '未知用户',
        triggerType: log.trigger_type,
        triggerData: triggerData,
        riskLevel: (triggerData?.riskLevel as string) || 'medium',
        description: (triggerData?.description as string) || `触发${log.trigger_type}风控规则`,
        status: log.status,
        reviewerId: log.reviewer_id,
        reviewNote: log.review_note,
        reviewedAt: log.reviewed_at,
        createdAt: log.created_at,
      };
    });
    
    res.json({
      code: 0,
      message: '获取成功',
      data: {
        list,
        total,
        pageNum: Number(pageNum),
        pageSize: Number(pageSize),
      },
    });
  } catch (error) {
    console.error('获取风控预警列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 审核风控预警
 * POST /api/v1/admin/risk-control/:logId/review
 * 
 * 需求: 5.9, 5.10
 */
export async function reviewRiskControlHandler(req: Request, res: Response): Promise<void> {
  try {
    const { logId } = req.params;
    const { status: reviewStatus, review_note: reviewNote } = req.body;
    const reviewerId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!reviewerId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    // 验证审核结果
    if (!reviewStatus || !['approved', 'rejected'].includes(reviewStatus)) {
      res.status(400).json({
        code: 'INVALID_REVIEW_RESULT',
        message: '审核结果必须是 approved 或 rejected',
      });
      return;
    }
    
    // 获取风控记录
    const log = await prisma.risk_control_logs.findUnique({
      where: { log_id: logId },
      include: {
        resources: {
          select: {
            resource_id: true,
            user_id: true,
          },
        },
      },
    });
    
    if (!log) {
      res.status(404).json({ code: 'LOG_NOT_FOUND', message: '风控记录不存在' });
      return;
    }
    
    if (log.status !== 'pending') {
      res.status(400).json({ code: 'ALREADY_REVIEWED', message: '该记录已审核' });
      return;
    }
    
    // 更新风控记录
    await prisma.risk_control_logs.update({
      where: { log_id: logId },
      data: {
        status: reviewStatus,
        reviewer_id: reviewerId,
        review_note: reviewNote || null,
        reviewed_at: new Date(),
      },
    });
    
    // 如果审核通过，恢复收益；如果拒绝，取消收益
    if (log.resource_id) {
      const { unfreezeEarnings, cancelEarnings } = await import('../services/earningsService.js');
      
      if (reviewStatus === 'approved') {
        await unfreezeEarnings(log.resource_id, reviewerId);
      } else {
        await cancelEarnings(log.resource_id, reviewNote || '风控审核拒绝');
      }
    }
    
    res.json({
      code: 0,
      message: '审核完成',
    });
  } catch (error) {
    console.error('审核风控预警失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 获取风控统计
 * GET /api/v1/admin/risk-control/stats
 */
export async function getRiskControlStatsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const [pendingCount, approvedCount, rejectedCount, todayCount] = await Promise.all([
      prisma.risk_control_logs.count({ where: { status: 'pending' } }),
      prisma.risk_control_logs.count({ where: { status: 'approved' } }),
      prisma.risk_control_logs.count({ where: { status: 'rejected' } }),
      prisma.risk_control_logs.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: {
        pendingCount,
        approvedCount,
        rejectedCount,
        reviewedCount: approvedCount + rejectedCount,
        todayCount,
      },
    });
  } catch (error) {
    console.error('获取风控统计失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}
