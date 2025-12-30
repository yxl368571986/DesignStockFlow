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
      const trends: Array<{
        date: string;
        newUsers: number;
        newResources: number;
        downloads: number;
      }> = [];
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
      const stats: Array<{
        date: string;
        vipRevenue: number;
        pointsRevenue: number;
        totalRevenue: number;
        orderCount: number;
      }> = [];
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

  /**
   * 获取充值统计
   * @param dimension 统计维度: day, week, month, year
   * @param startDate 开始日期
   * @param endDate 结束日期
   */
  async getRechargeStatistics(dimension: string = 'day', startDate?: string, endDate?: string) {
    try {
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 获取充值订单统计
      const orders = await prisma.recharge_orders.findMany({
        where: {
          created_at: { gte: start, lte: end },
          payment_status: 1, // 已支付
        },
        select: {
          amount: true,
          total_points: true,
          created_at: true,
          user_id: true,
        },
      });

      // 按维度分组统计
      const groupedStats = new Map<string, { amount: number; points: number; count: number; users: Set<string> }>();

      for (const order of orders) {
        const key = this.getDateKey(order.created_at, dimension);
        const existing = groupedStats.get(key) || { amount: 0, points: 0, count: 0, users: new Set<string>() };
        existing.amount += Number(order.amount);
        existing.points += order.total_points;
        existing.count += 1;
        existing.users.add(order.user_id);
        groupedStats.set(key, existing);
      }

      // 转换为数组
      const stats = Array.from(groupedStats.entries()).map(([date, data]) => ({
        date,
        totalAmount: data.amount,
        totalPoints: data.points,
        orderCount: data.count,
        userCount: data.users.size,
      })).sort((a, b) => a.date.localeCompare(b.date));

      // 汇总数据
      const summary = {
        totalAmount: orders.reduce((sum, o) => sum + Number(o.amount), 0),
        totalPoints: orders.reduce((sum, o) => sum + o.total_points, 0),
        totalOrders: orders.length,
        totalUsers: new Set(orders.map(o => o.user_id)).size,
      };

      return { stats, summary };
    } catch (error) {
      logger.error('获取充值统计失败:', error);
      throw new Error('获取充值统计失败');
    }
  }

  /**
   * 获取积分流水统计
   * @param dimension 统计维度: day, week, month, year
   * @param startDate 开始日期
   * @param endDate 结束日期
   */
  async getPointsFlowStatistics(dimension: string = 'day', startDate?: string, endDate?: string) {
    try {
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 获取积分变动记录 (使用正确的表名 points_records)
      const records = await prisma.points_records.findMany({
        where: {
          created_at: { gte: start, lte: end },
        },
        select: {
          points_change: true,
          change_type: true,
          created_at: true,
        },
      });

      // 按维度分组统计
      const groupedStats = new Map<string, { earned: number; consumed: number }>();

      for (const record of records) {
        const key = this.getDateKey(record.created_at, dimension);
        const existing = groupedStats.get(key) || { earned: 0, consumed: 0 };
        if (record.points_change > 0) {
          existing.earned += record.points_change;
        } else {
          existing.consumed += Math.abs(record.points_change);
        }
        groupedStats.set(key, existing);
      }

      // 转换为数组
      const stats = Array.from(groupedStats.entries()).map(([date, data]) => ({
        date,
        earned: data.earned,
        consumed: data.consumed,
        net: data.earned - data.consumed,
      })).sort((a, b) => a.date.localeCompare(b.date));

      // 汇总数据
      const totalEarned = records
        .filter(r => r.points_change > 0)
        .reduce((sum: number, r) => sum + r.points_change, 0);
      const totalConsumed = records
        .filter(r => r.points_change < 0)
        .reduce((sum: number, r) => sum + Math.abs(r.points_change), 0);

      // 按类型统计
      const byType = new Map<string, number>();
      for (const record of records) {
        const type = record.change_type;
        byType.set(type, (byType.get(type) || 0) + record.points_change);
      }

      const summary = {
        totalEarned,
        totalConsumed,
        netChange: totalEarned - totalConsumed,
        byType: Object.fromEntries(byType),
      };

      return { stats, summary };
    } catch (error) {
      logger.error('获取积分流水统计失败:', error);
      throw new Error('获取积分流水统计失败');
    }
  }

  /**
   * 根据维度获取日期键
   */
  private getDateKey(date: Date, dimension: string): string {
    const d = new Date(date);
    switch (dimension) {
      case 'year':
        return d.getFullYear().toString();
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      case 'week': {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().split('T')[0];
      }
      case 'day':
      default:
        return d.toISOString().split('T')[0];
    }
  }
}

export const statisticsService = new StatisticsService();
export default statisticsService;
