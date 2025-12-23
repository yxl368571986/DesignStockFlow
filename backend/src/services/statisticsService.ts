/**
 * 统计服务
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

export class StatisticsService {
  /**
   * 获取数据概览
   * 返回用户总数、资源总数、今日下载量、今日上传量、VIP用户数、待审核资源数
   */
  async getOverview() {
    try {
      // 获取今天的开始时间
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 并行查询所有统计数据
      const [
        totalUsers,
        totalResources,
        todayDownloads,
        todayUploads,
        vipUsers,
        pendingAudit,
      ] = await Promise.all([
        // 用户总数
        prisma.users.count(),
        
        // 资源总数（已通过审核）
        prisma.resources.count({
          where: {
            audit_status: 1,
            status: 1,
          },
        }),
        
        // 今日下载量
        prisma.download_history.count({
          where: {
            created_at: {
              gte: today,
            },
          },
        }),
        
        // 今日上传量
        prisma.resources.count({
          where: {
            created_at: {
              gte: today,
            },
          },
        }),
        
        // VIP用户数
        prisma.users.count({
          where: {
            vip_level: {
              gt: 0,
            },
            vip_expire_at: {
              gt: new Date(),
            },
          },
        }),
        
        // 待审核资源数
        prisma.resources.count({
          where: {
            audit_status: 0,
          },
        }),
      ]);

      return {
        totalUsers,
        totalResources,
        todayDownloads,
        todayUploads,
        vipUsers,
        pendingAudit,
      };
    } catch (error) {
      logger.error('获取数据概览失败:', error);
      throw new Error('获取数据概览失败');
    }
  }

  /**
   * 获取趋势数据
   * 返回最近N天的用户注册、资源上传、下载量趋势
   */
  async getTrends(days: number = 7) {
    try {
      const trends: any[] = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const [newUsers, newResources, downloads] = await Promise.all([
          prisma.users.count({
            where: {
              created_at: {
                gte: date,
                lt: nextDate,
              },
            },
          }),
          prisma.resources.count({
            where: {
              created_at: {
                gte: date,
                lt: nextDate,
              },
            },
          }),
          prisma.download_history.count({
            where: {
              created_at: {
                gte: date,
                lt: nextDate,
              },
            },
          }),
        ]);

        trends.push({
          date: date.toISOString().split('T')[0],
          newUsers,
          newResources,
          downloads,
        });
      }

      return trends;
    } catch (error) {
      logger.error('获取趋势数据失败:', error);
      throw new Error('获取趋势数据失败');
    }
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats() {
    try {
      const categories = await prisma.categories.findMany({
        where: {
          parent_id: null,
        },
        select: {
          category_id: true,
          category_name: true,
          resource_count: true,
        },
        orderBy: {
          resource_count: 'desc',
        },
        take: 10,
      });

      return categories.map(cat => ({
        categoryId: cat.category_id,
        categoryName: cat.category_name,
        resourceCount: cat.resource_count,
      }));
    } catch (error) {
      logger.error('获取分类统计失败:', error);
      throw new Error('获取分类统计失败');
    }
  }

  /**
   * 获取热门资源
   */
  async getHotResources(limit: number = 10) {
    try {
      const resources = await prisma.resources.findMany({
        where: {
          audit_status: 1,
          status: 1,
        },
        select: {
          resource_id: true,
          title: true,
          download_count: true,
          view_count: true,
          like_count: true,
          collect_count: true,
        },
        orderBy: {
          download_count: 'desc',
        },
        take: limit,
      });

      return resources.map(res => ({
        resourceId: res.resource_id,
        title: res.title,
        downloadCount: res.download_count,
        viewCount: res.view_count,
        likeCount: res.like_count,
        collectCount: res.collect_count,
      }));
    } catch (error) {
      logger.error('获取热门资源失败:', error);
      throw new Error('获取热门资源失败');
    }
  }

  /**
   * 获取活跃用户
   */
  async getActiveUsers(limit: number = 10) {
    try {
      const users = await prisma.users.findMany({
        where: {
          status: 1,
        },
        select: {
          user_id: true,
          nickname: true,
          avatar: true,
          points_total: true,
          vip_level: true,
        },
        orderBy: {
          points_total: 'desc',
        },
        take: limit,
      });

      return users.map(user => ({
        userId: user.user_id,
        nickname: user.nickname,
        avatar: user.avatar,
        pointsTotal: user.points_total,
        vipLevel: user.vip_level,
      }));
    } catch (error) {
      logger.error('获取活跃用户失败:', error);
      throw new Error('获取活跃用户失败');
    }
  }

  /**
   * 获取收入统计
   */
  async getRevenueStats(days: number = 30) {
    try {
      const stats: any[] = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const orders = await prisma.orders.findMany({
          where: {
            payment_status: 1,
            paid_at: {
              gte: date,
              lt: nextDate,
            },
          },
          select: {
            amount: true,
            order_type: true,
          },
        });

        const vipRevenue = orders
          .filter(o => o.order_type === 'vip')
          .reduce((sum, o) => sum + Number(o.amount), 0);

        const pointsRevenue = orders
          .filter(o => o.order_type === 'points')
          .reduce((sum, o) => sum + Number(o.amount), 0);

        stats.push({
          date: date.toISOString().split('T')[0],
          vipRevenue,
          pointsRevenue,
          totalRevenue: vipRevenue + pointsRevenue,
          orderCount: orders.length,
        });
      }

      return stats;
    } catch (error) {
      logger.error('获取收入统计失败:', error);
      throw new Error('获取收入统计失败');
    }
  }
}

export const statisticsService = new StatisticsService();
export default statisticsService;
