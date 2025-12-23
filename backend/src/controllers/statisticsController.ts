/**
 * 统计控制器
 */
import { Request, Response, NextFunction } from 'express';
import { statisticsService } from '@/services/statisticsService.js';
import { success, error } from '@/utils/response.js';
import { logger } from '@/utils/logger.js';

export class StatisticsController {
  /**
   * 获取数据概览
   * GET /api/v1/admin/statistics/overview
   */
  async getOverview(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const overview = await statisticsService.getOverview();
      success(res, overview, '获取数据概览成功');
    } catch (err: unknown) {
      logger.error('获取数据概览失败:', err);
      const message = err instanceof Error ? err.message : '获取数据概览失败';
      error(res, message, 400);
    }
  }

  /**
   * 获取用户增长趋势
   * GET /api/v1/admin/statistics/user-growth
   */
  async getUserGrowth(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const growth = await statisticsService.getTrends(30);
      success(res, growth, '获取用户增长趋势成功');
    } catch (err: unknown) {
      logger.error('获取用户增长趋势失败:', err);
      const message = err instanceof Error ? err.message : '获取用户增长趋势失败';
      error(res, message, 400);
    }
  }

  /**
   * 获取资源增长趋势
   * GET /api/v1/admin/statistics/resource-growth
   */
  async getResourceGrowth(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const growth = await statisticsService.getTrends(30);
      success(res, growth, '获取资源增长趋势成功');
    } catch (err: unknown) {
      logger.error('获取资源增长趋势失败:', err);
      const message = err instanceof Error ? err.message : '获取资源增长趋势失败';
      error(res, message, 400);
    }
  }

  /**
   * 获取下载统计
   * GET /api/v1/admin/statistics/download
   */
  async getDownloadStatistics(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const statistics = await statisticsService.getTrends(30);
      success(res, statistics, '获取下载统计成功');
    } catch (err: unknown) {
      logger.error('获取下载统计失败:', err);
      const message = err instanceof Error ? err.message : '获取下载统计失败';
      error(res, message, 400);
    }
  }

  /**
   * 获取热门资源TOP10
   * GET /api/v1/admin/statistics/hot-resources
   */
  async getHotResources(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const hotResources = await statisticsService.getHotResources();
      success(res, hotResources, '获取热门资源成功');
    } catch (err: unknown) {
      logger.error('获取热门资源失败:', err);
      const message = err instanceof Error ? err.message : '获取热门资源失败';
      error(res, message, 400);
    }
  }

  /**
   * 获取热门分类TOP10
   * GET /api/v1/admin/statistics/hot-categories
   */
  async getHotCategories(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const hotCategories = await statisticsService.getCategoryStats();
      success(res, hotCategories, '获取热门分类成功');
    } catch (err: unknown) {
      logger.error('获取热门分类失败:', err);
      const message = err instanceof Error ? err.message : '获取热门分类失败';
      error(res, message, 400);
    }
  }

  /**
   * 获取活跃用户TOP10
   * GET /api/v1/admin/statistics/active-users
   */
  async getActiveUsers(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const activeUsers = await statisticsService.getActiveUsers();
      success(res, activeUsers, '获取活跃用户成功');
    } catch (err: unknown) {
      logger.error('获取活跃用户失败:', err);
      const message = err instanceof Error ? err.message : '获取活跃用户失败';
      error(res, message, 400);
    }
  }

  /**
   * 获取自定义时间范围统计
   * GET /api/v1/admin/statistics/custom
   */
  async getCustomStatistics(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { start_date, end_date } = req.query;

      // 参数验证
      if (!start_date || !end_date) {
        error(res, '开始日期和结束日期不能为空', 400);
        return;
      }

      const startDate = new Date(start_date as string);
      const endDate = new Date(end_date as string);

      // 验证日期有效性
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        error(res, '日期格式无效', 400);
        return;
      }

      // 验证日期范围
      if (startDate > endDate) {
        error(res, '开始日期不能大于结束日期', 400);
        return;
      }

      // 计算天数差
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const statistics = await statisticsService.getTrends(days);
      success(res, statistics, '获取自定义时间范围统计成功');
    } catch (err: unknown) {
      logger.error('获取自定义时间范围统计失败:', err);
      const message = err instanceof Error ? err.message : '获取自定义时间范围统计失败';
      error(res, message, 400);
    }
  }
}

export const statisticsController = new StatisticsController();
export default statisticsController;
