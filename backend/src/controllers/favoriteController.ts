/**
 * 收藏控制器
 */
import { Request, Response } from 'express';
import { favoriteService } from '@/services/favoriteService.js';
import { success, error } from '@/utils/response.js';
import { logger } from '@/utils/logger.js';

class FavoriteController {
  /**
   * 添加收藏
   * POST /api/v1/favorites/:resourceId
   */
  async addFavorite(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { resourceId } = req.params;

      if (!userId) {
        return error(res, '请先登录', 401);
      }

      const result = await favoriteService.addFavorite(userId, resourceId);
      return success(res, result, '收藏成功');
    } catch (err: any) {
      logger.error('添加收藏失败:', err);
      return error(res, err.message || '收藏失败', 400);
    }
  }

  /**
   * 取消收藏
   * DELETE /api/v1/favorites/:resourceId
   */
  async removeFavorite(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { resourceId } = req.params;

      if (!userId) {
        return error(res, '请先登录', 401);
      }

      const result = await favoriteService.removeFavorite(userId, resourceId);
      return success(res, result, '取消收藏成功');
    } catch (err: any) {
      logger.error('取消收藏失败:', err);
      return error(res, err.message || '取消收藏失败', 400);
    }
  }

  /**
   * 检查收藏状态
   * GET /api/v1/favorites/:resourceId/check
   */
  async checkFavorite(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { resourceId } = req.params;

      if (!userId) {
        return success(res, { isFavorited: false });
      }

      const isFavorited = await favoriteService.checkFavorite(userId, resourceId);
      return success(res, { isFavorited });
    } catch (err: any) {
      logger.error('检查收藏状态失败:', err);
      return error(res, err.message || '检查失败', 400);
    }
  }

  /**
   * 批量检查收藏状态
   * POST /api/v1/favorites/check-batch
   */
  async checkFavorites(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      // 注意：requestFieldTransform 中间件会将 camelCase 转换为 snake_case
      const resourceIds = req.body.resource_ids || req.body.resourceIds;

      if (!userId) {
        const result: Record<string, boolean> = {};
        resourceIds?.forEach((id: string) => { result[id] = false; });
        return success(res, result);
      }

      if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
        return error(res, '请提供资源ID列表', 400);
      }

      const result = await favoriteService.batchCheckFavorites(userId, resourceIds);
      return success(res, result);
    } catch (err: any) {
      logger.error('批量检查收藏状态失败:', err);
      return error(res, err.message || '检查失败', 400);
    }
  }

  /**
   * 获取收藏列表
   * GET /api/v1/favorites
   */
  async getFavoriteList(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { pageNum = '1', pageSize = '20' } = req.query;

      if (!userId) {
        return error(res, '请先登录', 401);
      }

      const result = await favoriteService.getFavoriteList(userId, {
        page: parseInt(pageNum as string),
        pageSize: parseInt(pageSize as string),
      });
      return success(res, result, '获取收藏列表成功');
    } catch (err: any) {
      logger.error('获取收藏列表失败:', err);
      return error(res, err.message || '获取失败', 400);
    }
  }
}

export const favoriteController = new FavoriteController();
export default favoriteController;
