/**
 * 收益控制器
 * 处理收益明细、统计等 API 请求
 * 
 * 需求: 8.1, 8.2, 8.3, 8.4
 */

import { Request, Response } from 'express';
import * as earningsService from '../services/earningsService.js';

/**
 * 获取收益明细列表
 * GET /api/v1/user/earnings
 * 
 * 需求: 8.1, 8.2, 8.3
 */
export async function getEarningsListHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    const {
      pageNum = '1',
      pageSize = '20',
      startDate,
      endDate,
      status,
    } = req.query;
    
    const result = await earningsService.getEarningsHistory(userId, {
      pageNum: Number(pageNum),
      pageSize: Number(pageSize),
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string | undefined,
    });
    
    res.json({
      code: 0,
      message: '获取成功',
      data: result,
    });
  } catch (error) {
    console.error('获取收益明细失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 获取收益统计
 * GET /api/v1/user/earnings/stats
 * 
 * 需求: 8.4
 */
export async function getEarningsStatsHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    const stats = await earningsService.getEarningsStats(userId);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: stats,
    });
  } catch (error) {
    console.error('获取收益统计失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}
