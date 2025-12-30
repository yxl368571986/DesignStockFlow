/**
 * 收益服务
 * 负责收益计算、发放、查询、冻结/恢复等功能
 * 
 * 收益计算规则：
 * - 免费资源被下载 → 收益 = 2积分（固定奖励）
 * - 付费资源被普通用户下载 → 收益 = points_cost（100%归上传者）
 * - 付费资源被VIP用户下载 → 收益 = points_cost（100%由平台补贴给上传者）
 * - VIP专属资源被VIP用户下载 → 收益 = 10积分（固定，平台补贴）
 */

import { PrismaClient } from '@prisma/client';
import { PricingType } from './resourcePricingService';
import { addPoints } from './pointsService';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

// 收益来源类型
export enum EarningsSource {
  NORMAL_DOWNLOAD = 'normal_download',   // 普通用户下载
  VIP_DOWNLOAD = 'vip_download',         // VIP用户下载
  PLATFORM_SUBSIDY = 'platform_subsidy', // 平台补贴
}

// 收益状态
export enum EarningsStatus {
  PENDING = 'pending',     // 待发放
  AWARDED = 'awarded',     // 已发放
  FROZEN = 'frozen',       // 已冻结
  CANCELLED = 'cancelled', // 已取消
}

// 收益计算结果
export interface EarningsCalculation {
  earningsPoints: number;
  earningsSource: EarningsSource;
  description: string;
}

// 收益发放结果
export interface EarningsResult {
  success: boolean;
  earningId?: string;
  earningsPoints?: number;
  errorCode?: string;
  errorMessage?: string;
}

// 收益明细项
export interface EarningItem {
  earningId: string;
  resourceId: string;
  resourceTitle: string;
  resourceDeleted: boolean;
  resourceUrl?: string;
  downloadTime: Date;
  downloaderType: 'normal' | 'vip';
  earningsPoints: number;
  status: string;
}

// 收益统计
export interface EarningsStats {
  totalEarnings: number;
  monthEarnings: number;
  totalDownloads: number;
  monthDownloads: number;
}

// 查询选项
export interface QueryOptions {
  pageNum?: number;
  pageSize?: number;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

/**
 * 计算收益积分
 * 
 * 收益计算规则：
 * - 免费资源被下载 → 收益 = 2积分（固定奖励，鼓励分享）
 * - 付费资源被普通用户下载 → 收益 = points_cost（100%归上传者）
 * - 付费资源被VIP用户下载 → 收益 = points_cost（100%由平台补贴给上传者）
 * - VIP专属资源被VIP用户下载 → 收益 = 10积分（固定，平台补贴）
 * 
 * @param pricingType 定价类型
 * @param pointsCost 积分价格
 * @param isVipDownloader 下载者是否为VIP
 * @returns 收益计算结果
 */
export function calculateEarnings(
  pricingType: number,
  pointsCost: number,
  isVipDownloader: boolean
): EarningsCalculation {
  let earningsPoints: number;
  let earningsSource: EarningsSource;
  let description: string;

  switch (pricingType) {
    case PricingType.FREE:
      // 免费资源：固定2积分（鼓励分享）
      earningsPoints = 2;
      earningsSource = isVipDownloader ? EarningsSource.VIP_DOWNLOAD : EarningsSource.NORMAL_DOWNLOAD;
      description = '免费资源下载收益';
      break;

    case PricingType.PAID_POINTS:
      // 付费资源：100%归上传者
      earningsPoints = pointsCost;
      if (isVipDownloader) {
        // VIP用户下载：平台补贴全额积分给上传者
        earningsSource = EarningsSource.PLATFORM_SUBSIDY;
        description = `VIP用户下载付费资源，平台补贴${pointsCost}积分给上传者`;
      } else {
        // 普通用户下载：下载者支付的积分100%转给上传者
        earningsSource = EarningsSource.NORMAL_DOWNLOAD;
        description = `付费资源下载收益${pointsCost}积分`;
      }
      break;

    case PricingType.VIP_ONLY:
      // VIP专属资源：固定10积分（平台补贴）
      earningsPoints = 10;
      earningsSource = EarningsSource.PLATFORM_SUBSIDY;
      description = 'VIP专属资源下载收益（平台补贴）';
      break;

    default:
      // 未知类型：默认2积分
      earningsPoints = 2;
      earningsSource = EarningsSource.NORMAL_DOWNLOAD;
      description = '资源下载收益';
  }

  return {
    earningsPoints,
    earningsSource,
    description,
  };
}


/**
 * 发放收益
 * 
 * @param downloadId 下载记录ID
 * @returns 收益发放结果
 */
export async function awardEarnings(downloadId: string): Promise<EarningsResult> {
  try {
    // 获取下载记录
    const download = await prisma.download_history.findUnique({
      where: { download_id: downloadId },
      include: {
        resources: {
          select: {
            resource_id: true,
            title: true,
            user_id: true,
            pricing_type: true,
            points_cost: true,
            is_deleted: true,
          },
        },
        users: {
          select: {
            user_id: true,
            vip_level: true,
          },
        },
      },
    });

    if (!download) {
      return {
        success: false,
        errorCode: 'DOWNLOAD_NOT_FOUND',
        errorMessage: '下载记录不存在',
      };
    }

    // 检查是否已发放收益
    if (download.earnings_awarded) {
      return {
        success: false,
        errorCode: 'DUPLICATE_EARNINGS',
        errorMessage: '该下载已发放过收益',
      };
    }

    const resource = download.resources;
    if (!resource) {
      return {
        success: false,
        errorCode: 'RESOURCE_NOT_FOUND',
        errorMessage: '资源不存在',
      };
    }

    // 检查是否为自下载
    if (download.user_id === resource.user_id) {
      return {
        success: false,
        errorCode: 'SELF_DOWNLOAD',
        errorMessage: '下载自己的资源不产生收益',
      };
    }

    // 判断下载者是否为VIP
    const isVipDownloader = (download.users?.vip_level || 0) > 0;
    const downloaderType = isVipDownloader ? 'vip' : 'normal';

    // 计算收益
    const calculation = calculateEarnings(
      resource.pricing_type,
      resource.points_cost,
      isVipDownloader
    );

    // 使用事务发放收益
    const result = await prisma.$transaction(async (tx) => {
      // 创建收益记录
      const earningsRecord = await tx.earnings_records.create({
        data: {
          resource_id: resource.resource_id,
          uploader_id: resource.user_id!,
          downloader_id: download.user_id!,
          download_id: downloadId,
          pricing_type: resource.pricing_type,
          points_cost: resource.points_cost,
          earnings_points: calculation.earningsPoints,
          earnings_source: calculation.earningsSource,
          status: EarningsStatus.AWARDED,
        },
      });

      // 更新下载记录
      await tx.download_history.update({
        where: { download_id: downloadId },
        data: {
          earnings_awarded: true,
          uploader_id: resource.user_id,
          downloader_type: downloaderType,
        },
      });

      return earningsRecord;
    });

    // 发放积分给上传者
    await addPoints(resource.user_id!, calculation.earningsPoints, {
      changeType: 'earn',
      source: 'work_downloaded',
      sourceId: downloadId,
      description: `作品「${resource.title}」被下载，获得${calculation.earningsPoints}积分`,
    });

    logger.info(
      `收益发放成功: 上传者=${resource.user_id}, 资源=${resource.resource_id}, ` +
      `收益=${calculation.earningsPoints}积分, 来源=${calculation.earningsSource}`
    );

    return {
      success: true,
      earningId: result.earning_id,
      earningsPoints: calculation.earningsPoints,
    };
  } catch (error) {
    logger.error('收益发放失败:', error);
    return {
      success: false,
      errorCode: 'AWARD_FAILED',
      errorMessage: (error as Error).message,
    };
  }
}

/**
 * 获取收益明细
 * 
 * @param uploaderId 上传者ID
 * @param options 查询选项
 * @returns 收益明细列表
 */
export async function getEarningsHistory(
  uploaderId: string,
  options: QueryOptions = {}
): Promise<{ list: EarningItem[]; total: number; pageNum: number; pageSize: number }> {
  const { pageNum = 1, pageSize = 20, startDate, endDate, status } = options;
  const skip = (pageNum - 1) * pageSize;

  // 构建查询条件
  const where: Record<string, unknown> = { uploader_id: uploaderId };
  
  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      (where.created_at as Record<string, Date>).gte = startDate;
    }
    if (endDate) {
      (where.created_at as Record<string, Date>).lte = endDate;
    }
  }

  const [records, total] = await Promise.all([
    prisma.earnings_records.findMany({
      where,
      include: {
        resources: {
          select: {
            resource_id: true,
            title: true,
            is_deleted: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.earnings_records.count({ where }),
  ]);

  const list: EarningItem[] = records.map((record) => ({
    earningId: record.earning_id,
    resourceId: record.resource_id,
    resourceTitle: record.resources?.title || '未知资源',
    resourceDeleted: record.resources?.is_deleted || false,
    resourceUrl: record.resources?.is_deleted ? undefined : `/resource/${record.resource_id}`,
    downloadTime: record.created_at,
    downloaderType: record.earnings_source === EarningsSource.VIP_DOWNLOAD || 
                    record.earnings_source === EarningsSource.PLATFORM_SUBSIDY ? 'vip' : 'normal',
    earningsPoints: record.earnings_points,
    status: record.status,
  }));

  return {
    list,
    total,
    pageNum,
    pageSize,
  };
}


/**
 * 获取收益统计
 * 
 * @param uploaderId 上传者ID
 * @returns 收益统计数据
 */
export async function getEarningsStats(uploaderId: string): Promise<EarningsStats> {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 总收益
  const totalEarningsResult = await prisma.earnings_records.aggregate({
    where: {
      uploader_id: uploaderId,
      status: EarningsStatus.AWARDED,
    },
    _sum: { earnings_points: true },
    _count: true,
  });

  // 本月收益
  const monthEarningsResult = await prisma.earnings_records.aggregate({
    where: {
      uploader_id: uploaderId,
      status: EarningsStatus.AWARDED,
      created_at: { gte: thisMonth },
    },
    _sum: { earnings_points: true },
    _count: true,
  });

  return {
    totalEarnings: totalEarningsResult._sum.earnings_points || 0,
    monthEarnings: monthEarningsResult._sum.earnings_points || 0,
    totalDownloads: totalEarningsResult._count || 0,
    monthDownloads: monthEarningsResult._count || 0,
  };
}

/**
 * 冻结收益（风控触发）
 * 
 * @param resourceId 资源ID
 * @param reason 冻结原因
 */
export async function freezeEarnings(resourceId: string, reason: string): Promise<void> {
  // 获取该资源所有待发放和已发放的收益记录
  const records = await prisma.earnings_records.findMany({
    where: {
      resource_id: resourceId,
      status: { in: [EarningsStatus.PENDING, EarningsStatus.AWARDED] },
    },
  });

  if (records.length === 0) {
    logger.info(`资源 ${resourceId} 没有可冻结的收益记录`);
    return;
  }

  // 批量更新为冻结状态
  await prisma.earnings_records.updateMany({
    where: {
      resource_id: resourceId,
      status: { in: [EarningsStatus.PENDING, EarningsStatus.AWARDED] },
    },
    data: {
      status: EarningsStatus.FROZEN,
    },
  });

  logger.info(`资源 ${resourceId} 的 ${records.length} 条收益记录已冻结，原因: ${reason}`);
}

/**
 * 恢复收益（风控审核通过）
 * 
 * @param resourceId 资源ID
 * @param reviewerId 审核员ID
 */
export async function unfreezeEarnings(resourceId: string, reviewerId: string): Promise<void> {
  // 获取该资源所有冻结的收益记录
  const records = await prisma.earnings_records.findMany({
    where: {
      resource_id: resourceId,
      status: EarningsStatus.FROZEN,
    },
  });

  if (records.length === 0) {
    logger.info(`资源 ${resourceId} 没有冻结的收益记录`);
    return;
  }

  // 批量更新为已发放状态
  await prisma.earnings_records.updateMany({
    where: {
      resource_id: resourceId,
      status: EarningsStatus.FROZEN,
    },
    data: {
      status: EarningsStatus.AWARDED,
    },
  });

  logger.info(`资源 ${resourceId} 的 ${records.length} 条收益记录已恢复，审核员: ${reviewerId}`);
}

/**
 * 取消收益（风控审核拒绝）
 * 
 * @param resourceId 资源ID
 * @param reason 取消原因
 */
export async function cancelEarnings(resourceId: string, reason: string): Promise<void> {
  // 获取该资源所有冻结的收益记录
  const records = await prisma.earnings_records.findMany({
    where: {
      resource_id: resourceId,
      status: EarningsStatus.FROZEN,
    },
    include: {
      resources: {
        select: { user_id: true },
      },
    },
  });

  if (records.length === 0) {
    logger.info(`资源 ${resourceId} 没有冻结的收益记录`);
    return;
  }

  // 计算需要扣除的总积分
  const totalPoints = records.reduce((sum, r) => sum + r.earnings_points, 0);
  const uploaderId = records[0].resources?.user_id;

  // 使用事务处理
  await prisma.$transaction(async (tx) => {
    // 批量更新为取消状态
    await tx.earnings_records.updateMany({
      where: {
        resource_id: resourceId,
        status: EarningsStatus.FROZEN,
      },
      data: {
        status: EarningsStatus.CANCELLED,
      },
    });

    // 如果有上传者，扣除已发放的积分
    if (uploaderId && totalPoints > 0) {
      const user = await tx.users.findUnique({
        where: { user_id: uploaderId },
        select: { points_balance: true },
      });

      if (user) {
        const newBalance = Math.max(0, user.points_balance - totalPoints);
        await tx.users.update({
          where: { user_id: uploaderId },
          data: {
            points_balance: newBalance,
            updated_at: new Date(),
          },
        });

        // 记录积分扣除
        await tx.points_records.create({
          data: {
            user_id: uploaderId,
            points_change: -totalPoints,
            points_balance: newBalance,
            change_type: 'admin_deduct',
            source: 'earnings_cancelled',
            source_id: resourceId,
            description: `收益取消: ${reason}`,
          },
        });
      }
    }
  });

  logger.info(
    `资源 ${resourceId} 的 ${records.length} 条收益记录已取消，` +
    `扣除积分: ${totalPoints}，原因: ${reason}`
  );
}

/**
 * 根据下载记录ID获取收益记录
 * 
 * @param downloadId 下载记录ID
 * @returns 收益记录
 */
export async function getEarningsByDownloadId(downloadId: string) {
  return prisma.earnings_records.findFirst({
    where: { download_id: downloadId },
  });
}

/**
 * 检查是否已发放收益
 * 
 * @param downloadId 下载记录ID
 * @returns 是否已发放
 */
export async function hasEarningsAwarded(downloadId: string): Promise<boolean> {
  const record = await prisma.earnings_records.findFirst({
    where: { download_id: downloadId },
  });
  return !!record;
}

export default {
  calculateEarnings,
  awardEarnings,
  getEarningsHistory,
  getEarningsStats,
  freezeEarnings,
  unfreezeEarnings,
  cancelEarnings,
  getEarningsByDownloadId,
  hasEarningsAwarded,
  EarningsSource,
  EarningsStatus,
};
