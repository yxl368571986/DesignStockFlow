/**
 * 收藏服务
 * 处理用户收藏相关的业务逻辑
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

class FavoriteService {
  /**
   * 添加收藏
   */
  async addFavorite(userId: string, resourceId: string) {
    try {
      // 检查资源是否存在
      const resource = await prisma.resources.findUnique({
        where: { resource_id: resourceId },
      });

      if (!resource) {
        throw new Error('资源不存在');
      }

      // 检查是否已收藏
      const existing = await prisma.user_favorites.findUnique({
        where: {
          user_id_resource_id: {
            user_id: userId,
            resource_id: resourceId,
          },
        },
      });

      if (existing) {
        throw new Error('已收藏该资源');
      }

      // 创建收藏记录
      await prisma.user_favorites.create({
        data: {
          user_id: userId,
          resource_id: resourceId,
        },
      });

      // 更新资源收藏数
      await prisma.resources.update({
        where: { resource_id: resourceId },
        data: { collect_count: { increment: 1 } },
      });

      logger.info(`用户 ${userId} 收藏资源 ${resourceId}`);

      return { success: true, message: '收藏成功' };
    } catch (err) {
      logger.error('添加收藏失败:', err);
      throw err;
    }
  }

  /**
   * 取消收藏
   */
  async removeFavorite(userId: string, resourceId: string) {
    try {
      // 检查是否已收藏
      const existing = await prisma.user_favorites.findUnique({
        where: {
          user_id_resource_id: {
            user_id: userId,
            resource_id: resourceId,
          },
        },
      });

      if (!existing) {
        throw new Error('未收藏该资源');
      }

      // 删除收藏记录
      await prisma.user_favorites.delete({
        where: {
          user_id_resource_id: {
            user_id: userId,
            resource_id: resourceId,
          },
        },
      });

      // 更新资源收藏数
      await prisma.resources.update({
        where: { resource_id: resourceId },
        data: { collect_count: { decrement: 1 } },
      });

      logger.info(`用户 ${userId} 取消收藏资源 ${resourceId}`);

      return { success: true, message: '取消收藏成功' };
    } catch (err) {
      logger.error('取消收藏失败:', err);
      throw err;
    }
  }

  /**
   * 检查是否已收藏
   */
  async checkFavorite(userId: string, resourceId: string): Promise<boolean> {
    try {
      const existing = await prisma.user_favorites.findUnique({
        where: {
          user_id_resource_id: {
            user_id: userId,
            resource_id: resourceId,
          },
        },
      });

      return !!existing;
    } catch (err) {
      logger.error('检查收藏状态失败:', err);
      return false;
    }
  }

  /**
   * 获取用户收藏列表
   */
  async getFavoriteList(userId: string, options: {
    page?: number;
    pageSize?: number;
  } = {}) {
    try {
      const { page = 1, pageSize = 20 } = options;

      const [favorites, total] = await Promise.all([
        prisma.user_favorites.findMany({
          where: { user_id: userId },
          include: {
            resources: {
              select: {
                resource_id: true,
                title: true,
                description: true,
                cover: true,
                file_format: true,
                vip_level: true,
                download_count: true,
                view_count: true,
                like_count: true,
                collect_count: true,
                created_at: true,
                categories: {
                  select: {
                    category_id: true,
                    category_name: true,
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.user_favorites.count({ where: { user_id: userId } }),
      ]);

      const list = favorites.map(fav => ({
        favoriteId: fav.favorite_id,
        resourceId: fav.resources.resource_id,
        title: fav.resources.title,
        description: fav.resources.description,
        cover: fav.resources.cover,
        format: fav.resources.file_format,
        vipLevel: fav.resources.vip_level,
        downloadCount: fav.resources.download_count,
        viewCount: fav.resources.view_count,
        likeCount: fav.resources.like_count,
        collectCount: fav.resources.collect_count,
        category: fav.resources.categories,
        resourceCreatedAt: fav.resources.created_at,
        favoriteAt: fav.created_at,
      }));

      return {
        list,
        total,
        page,
        pageSize,
      };
    } catch (err) {
      logger.error('获取收藏列表失败:', err);
      throw new Error('获取收藏列表失败');
    }
  }

  /**
   * 批量检查收藏状态
   */
  async batchCheckFavorites(userId: string, resourceIds: string[]): Promise<Record<string, boolean>> {
    try {
      const favorites = await prisma.user_favorites.findMany({
        where: {
          user_id: userId,
          resource_id: { in: resourceIds },
        },
        select: { resource_id: true },
      });

      const favoriteSet = new Set(favorites.map(f => f.resource_id));
      const result: Record<string, boolean> = {};

      for (const resourceId of resourceIds) {
        result[resourceId] = favoriteSet.has(resourceId);
      }

      return result;
    } catch (err) {
      logger.error('批量检查收藏状态失败:', err);
      return {};
    }
  }

  /**
   * 获取用户收藏数量
   */
  async getFavoriteCount(userId: string): Promise<number> {
    try {
      return await prisma.user_favorites.count({
        where: { user_id: userId },
      });
    } catch (err) {
      logger.error('获取收藏数量失败:', err);
      return 0;
    }
  }
}

export const favoriteService = new FavoriteService();
export default favoriteService;
