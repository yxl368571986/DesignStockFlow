/**
 * 积分兑换控制器
 * 处理积分兑换VIP相关接口
 */

import { Request, Response } from 'express';
import { enhancedVipService } from '../services/vip/enhancedVipService.js';
import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';

interface PointsVipExchange {
  exchange_id: string;
  points_cost: number;
  vip_days_granted: number;
  exchange_month: string;
  status: number;
  created_at: Date;
  vip_packages?: {
    package_name: string;
  } | null;
}

/**
 * 获取积分兑换信息
 * GET /api/v1/vip/points-exchange/info
 */
export async function getPointsExchangeInfo(req: Request, res: Response) {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const info = await enhancedVipService.getPointsExchangeInfo(userId);

    res.json({
      code: 0,
      data: {
        pointsBalance: info.pointsBalance,
        pointsPerMonth: info.pointsPerMonth,
        maxExchangeMonths: info.maxExchangeMonths,
        hasExchangedThisMonth: info.hasExchangedThisMonth,
        lastExchangeDate: info.lastExchangeDate,
        // 计算可兑换的最大月数
        maxAffordableMonths: Math.min(
          Math.floor(info.pointsBalance / info.pointsPerMonth),
          info.maxExchangeMonths
        ),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('获取积分兑换信息失败:', err);
    res.status(500).json({ code: 500, message: err.message || '获取信息失败' });
  }
}

/**
 * 积分兑换VIP
 * POST /api/v1/vip/points-exchange
 */
export async function exchangePointsForVip(req: Request, res: Response) {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { months } = req.body;

    if (!months || months < 1) {
      return res.status(400).json({ code: 400, message: '请选择兑换月数' });
    }

    const result = await enhancedVipService.exchangePointsForVip(userId, months);

    res.json({
      code: 0,
      message: '兑换成功',
      data: {
        pointsCost: result.pointsCost,
        vipDaysGranted: result.vipDaysGranted,
        newExpireAt: result.newExpireAt,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('积分兑换VIP失败:', err);
    res.status(500).json({ code: 500, message: err.message || '兑换失败' });
  }
}

/**
 * 获取兑换记录
 * GET /api/v1/vip/points-exchange/records
 */
export async function getExchangeRecords(req: Request, res: Response) {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { page = 1, pageSize = 10 } = req.query;

    // 使用已导入的prisma实例查询兑换记录
    const [records, total] = await Promise.all([
      prisma.$queryRaw<PointsVipExchange[]>`
        SELECT pve.*, vp.package_name as "vip_packages.package_name"
        FROM points_vip_exchanges pve
        LEFT JOIN vip_packages vp ON pve.package_id = vp.package_id
        WHERE pve.user_id = ${userId}
        ORDER BY pve.created_at DESC
        LIMIT ${Number(pageSize)} OFFSET ${(Number(page) - 1) * Number(pageSize)}
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM points_vip_exchanges WHERE user_id = ${userId}
      `,
    ]);

    res.json({
      code: 0,
      data: {
        list: records.map((r: PointsVipExchange) => ({
          exchangeId: r.exchange_id,
          pointsCost: r.points_cost,
          vipDaysGranted: r.vip_days_granted,
          exchangeMonth: r.exchange_month,
          status: r.status,
          packageName: r.vip_packages?.package_name,
          createdAt: r.created_at,
        })),
        total: Number(total[0]?.count || 0),
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('获取兑换记录失败:', err);
    res.status(500).json({ code: 500, message: err.message || '获取记录失败' });
  }
}
