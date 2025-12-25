/**
 * 下载服务
 * 处理资源下载权限校验和次数管理
 */

import { PrismaClient } from '@prisma/client';
import { getPaymentConfig } from '../../config/payment';
import { enhancedVipService } from '../vip/enhancedVipService';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

// 下载拒绝原因
export enum DownloadDenyReason {
  NOT_LOGGED_IN = 'not_logged_in',
  NOT_VIP = 'not_vip',
  FREE_LIMIT_REACHED = 'free_limit_reached',
  VIP_DAILY_LIMIT_REACHED = 'vip_daily_limit_reached',
  ACCOUNT_FROZEN = 'account_frozen',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  RESOURCE_UNAVAILABLE = 'resource_unavailable'
}

// 下载权限结果
export interface DownloadPermission {
  allowed: boolean;
  reason?: DownloadDenyReason;
  remainingFreeDownloads?: number;
  remainingVipDownloads?: number;
  isFreeResource: boolean;
  isVip: boolean;
}

// 下载次数信息
export interface DownloadCountInfo {
  vipDailyLimit: number;
  vipUsedToday: number;
  vipRemaining: number;
  freeDailyLimit: number;
  freeUsedToday: number;
  freeRemaining: number;
}

// 设备信息
export interface DeviceInfo {
  userAgent: string;
  ip: string;
  deviceType?: string;
}

class DownloadService {
  /**
   * 获取今日日期字符串（用于统计）
   */
  private getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * 检查下载权限
   */
  async checkDownloadPermission(userId: string | null, resourceId: string): Promise<DownloadPermission> {
    const config = getPaymentConfig();

    // 获取资源信息
    const resource = await prisma.resources.findUnique({
      where: { resource_id: resourceId },
      select: {
        resource_id: true,
        vip_level: true,
        status: true,
        audit_status: true,
      },
    });

    if (!resource) {
      return {
        allowed: false,
        reason: DownloadDenyReason.RESOURCE_NOT_FOUND,
        isFreeResource: false,
        isVip: false,
      };
    }

    // 检查资源状态
    if (resource.status !== 1 || resource.audit_status !== 1) {
      return {
        allowed: false,
        reason: DownloadDenyReason.RESOURCE_UNAVAILABLE,
        isFreeResource: false,
        isVip: false,
      };
    }

    // 判断是否为免费资源
    const isFreeResource = resource.vip_level === 0;

    // 未登录用户
    if (!userId) {
      if (isFreeResource) {
        // 免费资源允许未登录下载（但不记录）
        return {
          allowed: true,
          isFreeResource: true,
          isVip: false,
        };
      }
      return {
        allowed: false,
        reason: DownloadDenyReason.NOT_LOGGED_IN,
        isFreeResource: false,
        isVip: false,
      };
    }

    // 获取用户信息
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        status: true,
        vip_level: true,
        vip_expire_at: true,
        is_lifetime_vip: true,
      },
    });

    if (!user) {
      return {
        allowed: false,
        reason: DownloadDenyReason.NOT_LOGGED_IN,
        isFreeResource,
        isVip: false,
      };
    }

    // 检查账号状态
    if (user.status !== 1) {
      return {
        allowed: false,
        reason: DownloadDenyReason.ACCOUNT_FROZEN,
        isFreeResource,
        isVip: false,
      };
    }

    // 检查VIP状态
    const vipStatus = await enhancedVipService.checkVipStatus(userId);
    const isVip = vipStatus.isVip;

    // 获取今日下载次数
    const downloadCount = await this.getTodayDownloadCount(userId);

    if (isFreeResource) {
      // 免费资源：所有用户都可下载
      return {
        allowed: true,
        remainingFreeDownloads: config.vip.freeDailyDownloadLimit - downloadCount.freeUsedToday,
        remainingVipDownloads: isVip ? config.vip.dailyDownloadLimit - downloadCount.vipUsedToday : 0,
        isFreeResource: true,
        isVip,
      };
    }

    // VIP资源
    if (!isVip) {
      // 非VIP用户检查免费下载次数
      if (downloadCount.freeUsedToday >= config.vip.freeDailyDownloadLimit) {
        return {
          allowed: false,
          reason: DownloadDenyReason.FREE_LIMIT_REACHED,
          remainingFreeDownloads: 0,
          isFreeResource: false,
          isVip: false,
        };
      }

      return {
        allowed: true,
        remainingFreeDownloads: config.vip.freeDailyDownloadLimit - downloadCount.freeUsedToday - 1,
        isFreeResource: false,
        isVip: false,
      };
    }

    // VIP用户检查每日下载上限
    if (downloadCount.vipUsedToday >= config.vip.dailyDownloadLimit) {
      return {
        allowed: false,
        reason: DownloadDenyReason.VIP_DAILY_LIMIT_REACHED,
        remainingVipDownloads: 0,
        isFreeResource: false,
        isVip: true,
      };
    }

    return {
      allowed: true,
      remainingVipDownloads: config.vip.dailyDownloadLimit - downloadCount.vipUsedToday - 1,
      isFreeResource: false,
      isVip: true,
    };
  }

  /**
   * 记录下载
   */
  async recordDownload(
    userId: string,
    resourceId: string,
    deviceInfo: DeviceInfo,
    isVipDownload: boolean
  ): Promise<void> {
    const today = this.getTodayDate();

    await prisma.$transaction(async (tx) => {
      // 记录下载历史
      await tx.download_history.create({
        data: {
          user_id: userId,
          resource_id: resourceId,
          ip_address: deviceInfo.ip,
          user_agent: deviceInfo.userAgent,
          points_cost: 0, // VIP免费下载
        },
      });

      // 更新资源下载计数
      await tx.resources.update({
        where: { resource_id: resourceId },
        data: {
          download_count: { increment: 1 },
        },
      });

      // 更新用户下载统计
      const existingStat = await tx.user_download_stats.findUnique({
        where: {
          user_id_stat_date: {
            user_id: userId,
            stat_date: today,
          },
        },
      });

      if (existingStat) {
        await tx.user_download_stats.update({
          where: {
            user_id_stat_date: {
              user_id: userId,
              stat_date: today,
            },
          },
          data: {
            vip_download_count: isVipDownload ? { increment: 1 } : existingStat.vip_download_count,
            free_download_count: !isVipDownload ? { increment: 1 } : existingStat.free_download_count,
            updated_at: new Date(),
          },
        });
      } else {
        await tx.user_download_stats.create({
          data: {
            user_id: userId,
            stat_date: today,
            vip_download_count: isVipDownload ? 1 : 0,
            free_download_count: !isVipDownload ? 1 : 0,
          },
        });
      }
    });

    logger.info(`记录下载: 用户 ${userId}, 资源 ${resourceId}, VIP下载: ${isVipDownload}`);
  }

  /**
   * 获取今日下载次数
   */
  async getTodayDownloadCount(userId: string): Promise<DownloadCountInfo> {
    const config = getPaymentConfig();
    const today = this.getTodayDate();

    const stat = await prisma.user_download_stats.findUnique({
      where: {
        user_id_stat_date: {
          user_id: userId,
          stat_date: today,
        },
      },
    });

    const vipUsedToday = stat?.vip_download_count || 0;
    const freeUsedToday = stat?.free_download_count || 0;

    return {
      vipDailyLimit: config.vip.dailyDownloadLimit,
      vipUsedToday,
      vipRemaining: Math.max(0, config.vip.dailyDownloadLimit - vipUsedToday),
      freeDailyLimit: config.vip.freeDailyDownloadLimit,
      freeUsedToday,
      freeRemaining: Math.max(0, config.vip.freeDailyDownloadLimit - freeUsedToday),
    };
  }

  /**
   * 获取用户下载历史
   */
  async getUserDownloadHistory(
    userId: string,
    options: { page?: number; pageSize?: number } = {}
  ) {
    const { page = 1, pageSize = 20 } = options;

    const [downloads, total] = await Promise.all([
      prisma.download_history.findMany({
        where: { user_id: userId },
        include: {
          resources: {
            select: {
              resource_id: true,
              title: true,
              cover: true,
              file_format: true,
              file_size: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.download_history.count({ where: { user_id: userId } }),
    ]);

    return {
      list: downloads.map(d => ({
        downloadId: d.download_id,
        resourceId: d.resource_id,
        resource: d.resources ? {
          title: d.resources.title,
          cover: d.resources.cover,
          fileFormat: d.resources.file_format,
          fileSize: Number(d.resources.file_size),
        } : null,
        pointsCost: d.points_cost,
        createdAt: d.created_at,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 检查批量下载权限
   */
  async checkBatchDownloadPermission(
    userId: string,
    resourceIds: string[]
  ): Promise<{
    allowed: boolean;
    allowedCount: number;
    deniedCount: number;
    reason?: string;
  }> {
    const config = getPaymentConfig();

    // 检查VIP状态
    const vipStatus = await enhancedVipService.checkVipStatus(userId);

    if (!vipStatus.isVip) {
      return {
        allowed: false,
        allowedCount: 0,
        deniedCount: resourceIds.length,
        reason: '批量下载仅限VIP用户',
      };
    }

    // 获取今日下载次数
    const downloadCount = await this.getTodayDownloadCount(userId);
    const remaining = config.vip.dailyDownloadLimit - downloadCount.vipUsedToday;

    if (remaining <= 0) {
      return {
        allowed: false,
        allowedCount: 0,
        deniedCount: resourceIds.length,
        reason: '今日下载次数已用完',
      };
    }

    const allowedCount = Math.min(resourceIds.length, remaining);
    const deniedCount = resourceIds.length - allowedCount;

    return {
      allowed: allowedCount > 0,
      allowedCount,
      deniedCount,
      reason: deniedCount > 0 ? `剩余下载次数不足，只能下载 ${allowedCount} 个资源` : undefined,
    };
  }

  /**
   * 清理过期的下载统计记录
   */
  async cleanupOldDownloadStats(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.user_download_stats.deleteMany({
      where: {
        stat_date: { lt: cutoffDate },
      },
    });

    if (result.count > 0) {
      logger.info(`清理过期下载统计记录: ${result.count} 条`);
    }

    return result.count;
  }
}

export const downloadService = new DownloadService();
export default downloadService;
