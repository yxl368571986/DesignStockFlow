/**
 * 下载服务扩展
 * 
 * 实现新的定价逻辑和收益发放
 * 
 * 需求: 3.1, 3.2, 3.4, 3.5, 3.6, 4.6, 4.7
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';
import * as earningsService from './earningsService.js';
import * as antiCheatService from './antiCheatService.js';
import * as notificationService from './notificationService.js';

const prisma = new PrismaClient();

/**
 * 定价类型枚举
 */
export enum PricingType {
  FREE = 0,        // 免费资源
  PAID = 1,        // 付费资源
  VIP_ONLY = 2,    // VIP专属
}

/**
 * 下载者类型枚举
 */
export enum DownloaderType {
  NORMAL = 'normal',  // 普通用户
  VIP = 'vip',        // VIP用户
}

/**
 * 下载权限检查结果
 */
export interface DownloadPermissionResult {
  canDownload: boolean;
  reason?: string;
  pointsCost: number;
  isFree: boolean;
  isVipFree: boolean;
  pointsChannels?: string[];  // 积分获取渠道
}

/**
 * 下载确认信息
 */
export interface DownloadConfirmInfo {
  resourceId: string;
  resourceTitle: string;
  pricingType: PricingType;
  pointsCost: number;
  userPointsBalance: number;
  isVip: boolean;
  canDownload: boolean;
  insufficientPoints: boolean;
  pointsChannels: string[];
}

/**
 * 下载结果
 */
export interface DownloadResult {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: string;
  pointsCost: number;
  earningsAwarded: boolean;
  earningsAmount?: number;
  error?: string;
}

/**
 * 检查用户是否为有效VIP
 * 
 * @param userId 用户ID
 * @returns 是否为有效VIP
 */
async function checkUserVipStatus(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { 
      vip_level: true, 
      vip_expire_at: true 
    },
  });

  if (!user) {
    return false;
  }

  // VIP等级大于0且未过期
  if (user.vip_level > 0) {
    if (user.vip_expire_at) {
      return new Date(user.vip_expire_at) > new Date();
    }
    return true; // 没有过期时间则永久VIP
  }

  return false;
}

/**
 * 检查下载权限
 * 
 * 需求: 3.1, 3.2, 3.4, 3.5
 * 
 * 注意：isVip参数已废弃，函数内部会自动从数据库查询用户VIP状态
 */
export async function checkDownloadPermission(
  resourceId: string,
  userId: string,
  _isVip?: boolean  // 参数保留但不使用，改为从数据库查询
): Promise<DownloadPermissionResult> {
  // 从数据库查询用户真实的VIP状态
  const isVip = await checkUserVipStatus(userId);
  
  const resource = await prisma.resources.findUnique({
    where: { resource_id: resourceId },
    select: {
      pricing_type: true,
      points_cost: true,
      audit_status: true,
      status: true,
      is_deleted: true,
    },
  });

  if (!resource) {
    return {
      canDownload: false,
      reason: '资源不存在',
      pointsCost: 0,
      isFree: false,
      isVipFree: false,
    };
  }

  if (resource.is_deleted) {
    return {
      canDownload: false,
      reason: '资源已删除',
      pointsCost: 0,
      isFree: false,
      isVipFree: false,
    };
  }

  if (resource.audit_status !== 1) {
    return {
      canDownload: false,
      reason: '资源未通过审核',
      pointsCost: 0,
      isFree: false,
      isVipFree: false,
    };
  }

  if (resource.status !== 1) {
    return {
      canDownload: false,
      reason: '资源已下架',
      pointsCost: 0,
      isFree: false,
      isVipFree: false,
    };
  }

  const pricingType = resource.pricing_type as PricingType;
  const pointsCost = resource.points_cost || 0;

  // VIP用户免费下载所有资源
  if (isVip) {
    return {
      canDownload: true,
      pointsCost: 0,
      isFree: pricingType === PricingType.FREE,
      isVipFree: true,
    };
  }

  // 普通用户处理
  switch (pricingType) {
    case PricingType.FREE:
      return {
        canDownload: true,
        pointsCost: 0,
        isFree: true,
        isVipFree: false,
      };

    case PricingType.PAID: {
      // 检查用户积分余额
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { points_balance: true },
      });

      if (!user) {
        return {
          canDownload: false,
          reason: '用户不存在',
          pointsCost,
          isFree: false,
          isVipFree: false,
        };
      }

      if (user.points_balance < pointsCost) {
        return {
          canDownload: false,
          reason: '积分不足',
          pointsCost,
          isFree: false,
          isVipFree: false,
          pointsChannels: ['签到', '上传作品', '邀请好友', '充值'],
        };
      }

      return {
        canDownload: true,
        pointsCost,
        isFree: false,
        isVipFree: false,
      };
    }

    case PricingType.VIP_ONLY:
      return {
        canDownload: false,
        reason: 'VIP专属资源，请开通VIP后下载',
        pointsCost: 0,
        isFree: false,
        isVipFree: false,
        pointsChannels: ['开通VIP'],
      };

    default:
      return {
        canDownload: false,
        reason: '未知定价类型',
        pointsCost: 0,
        isFree: false,
        isVipFree: false,
      };
  }
}

/**
 * 获取下载确认信息
 * 
 * 需求: 3.3, 3.4
 * 
 * 注意：isVip参数已废弃，函数内部会自动从数据库查询用户VIP状态
 */
export async function getDownloadConfirmation(
  resourceId: string,
  userId: string,
  _isVip?: boolean  // 参数保留但不使用，改为从数据库查询
): Promise<DownloadConfirmInfo> {
  // 从数据库查询用户真实的VIP状态
  const isVip = await checkUserVipStatus(userId);
  
  const resource = await prisma.resources.findUnique({
    where: { resource_id: resourceId },
    select: {
      resource_id: true,
      title: true,
      pricing_type: true,
      points_cost: true,
    },
  });

  if (!resource) {
    throw new Error('资源不存在');
  }

  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { points_balance: true },
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  const pricingType = resource.pricing_type as PricingType;
  const pointsCost = resource.points_cost || 0;

  // 计算实际需要支付的积分
  let actualPointsCost = 0;
  if (!isVip && pricingType === PricingType.PAID) {
    actualPointsCost = pointsCost;
  }

  const insufficientPoints = actualPointsCost > user.points_balance;
  const canDownload = isVip || pricingType === PricingType.FREE || 
    (pricingType === PricingType.PAID && !insufficientPoints);

  // 积分获取渠道
  const pointsChannels = insufficientPoints 
    ? ['签到', '上传作品', '邀请好友', '充值']
    : [];

  return {
    resourceId: resource.resource_id,
    resourceTitle: resource.title,
    pricingType,
    pointsCost: actualPointsCost,
    userPointsBalance: user.points_balance,
    isVip,
    canDownload,
    insufficientPoints,
    pointsChannels,
  };
}

/**
 * 执行下载（带收益发放）
 * 
 * 需求: 3.1, 3.2, 3.4, 3.5, 3.6, 4.6, 4.7
 * 
 * 注意：isVip参数已废弃，函数内部会自动从数据库查询用户VIP状态
 */
export async function executeDownload(
  resourceId: string,
  userId: string,
  _isVip?: boolean,  // 参数保留但不使用，改为从数据库查询
  ipAddress?: string,
  userAgent?: string
): Promise<DownloadResult> {
  // 从数据库查询用户真实的VIP状态
  const isVip = await checkUserVipStatus(userId);
  
  // 1. 检查下载权限
  const permission = await checkDownloadPermission(resourceId, userId);
  if (!permission.canDownload) {
    return {
      success: false,
      pointsCost: 0,
      earningsAwarded: false,
      error: permission.reason,
    };
  }

  // 2. 获取资源信息
  const resource = await prisma.resources.findUnique({
    where: { resource_id: resourceId },
    select: {
      resource_id: true,
      title: true,
      file_url: true,
      file_name: true,
      file_size: true,
      user_id: true,
      pricing_type: true,
      points_cost: true,
    },
  });

  if (!resource) {
    return {
      success: false,
      pointsCost: 0,
      earningsAwarded: false,
      error: '资源不存在',
    };
  }

  const uploaderId = resource.user_id;
  const pricingType = resource.pricing_type as PricingType;
  const pointsCost = permission.pointsCost;
  const downloaderType = isVip ? DownloaderType.VIP : DownloaderType.NORMAL;

  // 3. 扣除积分（如果需要）
  if (pointsCost > 0) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { points_balance: true },
    });

    if (!user || user.points_balance < pointsCost) {
      return {
        success: false,
        pointsCost: 0,
        earningsAwarded: false,
        error: '积分不足',
      };
    }

    await prisma.users.update({
      where: { user_id: userId },
      data: {
        points_balance: { decrement: pointsCost },
      },
    });

    await prisma.points_records.create({
      data: {
        user_id: userId,
        points_change: -pointsCost,
        points_balance: user.points_balance - pointsCost,
        change_type: 'consume',
        source: 'download_resource',
        source_id: resourceId,
        description: `下载资源《${resource.title}》`,
      },
    });

    logger.info(`用户 ${userId} 消耗 ${pointsCost} 积分下载资源 ${resourceId}`);
  }

  // 4. 检查是否为有效下载（防作弊）
  let earningsAwarded = false;
  let earningsAmount = 0;

  if (uploaderId) {
    const validityCheck = await antiCheatService.isValidDownload(
      resourceId,
      userId,
      uploaderId
    );

    if (validityCheck.isValid) {
      // 5. 计算收益
      const earningsResult = earningsService.calculateEarnings(
        pricingType,
        resource.points_cost || 0,
        isVip
      );

      earningsAwarded = true;
      earningsAmount = earningsResult.earningsPoints;

      // 6. 给上传者增加积分收益
      if (earningsAmount > 0) {
        const uploader = await prisma.users.findUnique({
          where: { user_id: uploaderId },
          select: { points_balance: true },
        });

        if (uploader) {
          await prisma.users.update({
            where: { user_id: uploaderId },
            data: {
              points_balance: { increment: earningsAmount },
            },
          });

          // 记录上传者的积分变动
          await prisma.points_records.create({
            data: {
              user_id: uploaderId,
              points_change: earningsAmount,
              points_balance: uploader.points_balance + earningsAmount,
              change_type: 'earn',
              source: 'work_downloaded',
              source_id: resourceId,
              description: `作品《${resource.title}》被下载，获得${earningsAmount}积分收益`,
            },
          });

          logger.info(`上传者 ${uploaderId} 获得 ${earningsAmount} 积分收益，来源: ${earningsResult.earningsSource}`);
        }
      }

      // 7. 发送收益通知给上传者
      try {
        await notificationService.sendSystemNotification({
          userId: uploaderId,
          title: '收益到账通知',
          content: `您的作品《${resource.title}》被下载，获得 ${earningsAmount} 积分收益`,
          linkUrl: `/resource/${resourceId}`,
        });
      } catch (notifyErr) {
        logger.warn(`发送收益通知失败: ${notifyErr}`);
      }
    } else {
      logger.info(`下载不产生收益: ${validityCheck.reason}`);
    }
  }

  // 7. 记录下载历史
  await prisma.download_history.create({
    data: {
      user_id: userId,
      resource_id: resourceId,
      points_cost: pointsCost,
      ip_address: ipAddress || '',
      user_agent: userAgent || '',
      earnings_awarded: earningsAwarded,
      uploader_id: uploaderId,
      downloader_type: downloaderType,
    },
  });

  // 8. 更新资源下载次数
  await prisma.resources.update({
    where: { resource_id: resourceId },
    data: { download_count: { increment: 1 } },
  });

  logger.info(`用户 ${userId} 下载资源 ${resourceId}，收益发放: ${earningsAwarded}`);

  return {
    success: true,
    downloadUrl: resource.file_url || undefined,
    fileName: resource.file_name || undefined,
    fileSize: resource.file_size?.toString(),
    pointsCost,
    earningsAwarded,
    earningsAmount: earningsAwarded ? earningsAmount : undefined,
  };
}

/**
 * 获取用户下载历史
 */
export async function getUserDownloadHistory(
  userId: string,
  options: {
    page?: number;
    pageSize?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const { page = 1, pageSize = 20, startDate, endDate } = options;

  const where: Record<string, unknown> = { user_id: userId };

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
    prisma.download_history.findMany({
      where,
      include: {
        resources: {
          select: {
            resource_id: true,
            title: true,
            cover: true,
            is_deleted: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.download_history.count({ where }),
  ]);

  return {
    list: records.map(record => ({
      downloadId: record.download_id,
      resourceId: record.resource_id,
      resourceTitle: record.resources?.title || '已删除的资源',
      resourceCover: record.resources?.cover,
      isDeleted: record.resources?.is_deleted || false,
      pointsCost: record.points_cost,
      createdAt: record.created_at,
    })),
    total,
    pageNum: page,
    pageSize,
  };
}
