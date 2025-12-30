/**
 * 兑换审计控制器
 * 处理积分兑换审计日志查询等 API 请求
 * 
 * 需求: 10.9
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取兑换审计日志列表
 * GET /api/v1/admin/points/exchange/audit-logs
 * 
 * 需求: 10.9
 */
export async function getExchangeAuditLogsHandler(req: Request, res: Response): Promise<void> {
  try {
    const {
      pageNum = '1',
      pageSize = '20',
      userId,
      exchangeStatus,
      startDate,
      endDate,
    } = req.query;
    
    const skip = (Number(pageNum) - 1) * Number(pageSize);
    
    // 构建查询条件
    const where: Record<string, unknown> = {};
    
    if (userId) {
      where.user_id = userId;
    }
    
    if (exchangeStatus) {
      where.exchange_status = exchangeStatus;
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
    
    const [records, total] = await Promise.all([
      prisma.points_exchange_records.findMany({
        where,
        include: {
          users: {
            select: {
              user_id: true,
              nickname: true,
              phone: true,
            },
          },
          points_products: {
            select: {
              product_id: true,
              product_name: true,
              product_type: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(pageSize),
      }),
      prisma.points_exchange_records.count({ where }),
    ]);
    
    const list = records.map(record => ({
      exchangeId: record.exchange_id,
      userId: record.user_id,
      userName: record.users?.nickname || record.users?.phone || '未知用户',
      productId: record.product_id,
      productName: record.product_name,
      productType: record.product_type,
      pointsCost: record.points_cost,
      deliveryStatus: record.delivery_status,
      deliveryAddress: record.delivery_address,
      trackingNumber: record.tracking_number,
      exchangeStatus: record.exchange_status,
      ipAddress: record.ip_address,
      deviceInfo: record.device_info,
      refundReason: record.refund_reason,
      refundedAt: record.refunded_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));
    
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
    console.error('获取兑换审计日志失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 获取兑换统计
 * GET /api/v1/admin/points/exchange/stats
 */
export async function getExchangeStatsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      totalCount,
      successCount,
      failedCount,
      refundedCount,
      todayCount,
      totalPointsSpent,
    ] = await Promise.all([
      prisma.points_exchange_records.count(),
      prisma.points_exchange_records.count({ where: { exchange_status: 'success' } }),
      prisma.points_exchange_records.count({ where: { exchange_status: 'failed' } }),
      prisma.points_exchange_records.count({ where: { exchange_status: 'refunded' } }),
      prisma.points_exchange_records.count({
        where: {
          created_at: { gte: today },
        },
      }),
      prisma.points_exchange_records.aggregate({
        _sum: { points_cost: true },
        where: { exchange_status: 'success' },
      }),
    ]);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: {
        totalCount,
        successCount,
        failedCount,
        refundedCount,
        todayCount,
        totalPointsSpent: totalPointsSpent._sum.points_cost || 0,
      },
    });
  } catch (error) {
    console.error('获取兑换统计失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 处理兑换退款
 * POST /api/v1/admin/points/exchange/:exchangeId/refund
 */
export async function refundExchangeHandler(req: Request, res: Response): Promise<void> {
  try {
    const { exchangeId } = req.params;
    const { reason } = req.body;
    const operatorId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!operatorId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    // 获取兑换记录
    const record = await prisma.points_exchange_records.findUnique({
      where: { exchange_id: exchangeId },
    });
    
    if (!record) {
      res.status(404).json({ code: 'RECORD_NOT_FOUND', message: '兑换记录不存在' });
      return;
    }
    
    if (record.exchange_status === 'refunded') {
      res.status(400).json({ code: 'ALREADY_REFUNDED', message: '该记录已退款' });
      return;
    }
    
    if (record.exchange_status === 'failed') {
      res.status(400).json({ code: 'EXCHANGE_FAILED', message: '兑换失败的记录无需退款' });
      return;
    }
    
    // 使用事务处理退款
    await prisma.$transaction(async (tx) => {
      // 更新兑换记录状态
      await tx.points_exchange_records.update({
        where: { exchange_id: exchangeId },
        data: {
          exchange_status: 'refunded',
          refund_reason: reason || '管理员退款',
          refunded_at: new Date(),
          updated_at: new Date(),
        },
      });
      
      // 退还积分给用户
      if (record.user_id) {
        await tx.users.update({
          where: { user_id: record.user_id },
          data: {
            points_balance: { increment: record.points_cost },
          },
        });
        
        // 记录积分变动
        await tx.points_records.create({
          data: {
            user_id: record.user_id,
            points_change: record.points_cost,
            points_balance: 0, // 将在查询后更新
            change_type: 'refund',
            source: 'exchange_refund',
            source_id: exchangeId,
            description: `兑换退款: ${record.product_name}`,
          },
        });
      }
    });
    
    res.json({
      code: 0,
      message: '退款成功',
    });
  } catch (error) {
    console.error('处理兑换退款失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}
