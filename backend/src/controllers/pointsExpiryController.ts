/**
 * 积分有效期控制器
 * 处理积分有效期明细、过期提醒等 API 请求
 * 
 * 需求: 11.2
 */

import { Request, Response } from 'express';
import * as pointsExpiryService from '../services/pointsExpiryService.js';

/**
 * 获取积分有效期明细
 * GET /api/v1/user/points/expiry
 * 
 * 需求: 11.2
 */
export async function getPointsExpiryHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    const {
      pageNum = '1',
      pageSize = '20',
      includeExpired = 'false',
    } = req.query;
    
    const result = await pointsExpiryService.getPointsExpiryDetails(userId, {
      page: Number(pageNum),
      pageSize: Number(pageSize),
      includeExpired: includeExpired === 'true',
    });
    
    res.json({
      code: 0,
      message: '获取成功',
      data: result,
    });
  } catch (error) {
    console.error('获取积分有效期明细失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 获取即将过期积分提醒
 * GET /api/v1/user/points/expiry-reminder
 * 
 * 需求: 11.3
 */
export async function getExpiryReminderHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    const reminder = await pointsExpiryService.getUserExpiryReminder(userId);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: reminder,
    });
  } catch (error) {
    console.error('获取积分过期提醒失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 获取即将过期的积分列表
 * GET /api/v1/user/points/expiring
 * 
 * 需求: 11.3
 */
export async function getExpiringPointsHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    const { days = '30' } = req.query;
    
    const result = await pointsExpiryService.getExpiringPoints(userId, Number(days));
    
    res.json({
      code: 0,
      message: '获取成功',
      data: result,
    });
  } catch (error) {
    console.error('获取即将过期积分失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}
