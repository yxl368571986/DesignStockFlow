/**
 * 防作弊服务
 * 负责检测有效下载、账号关联性检测、风控预警等功能
 * 
 * 防作弊规则：
 * - 同一用户24小时内重复下载同一资源 → 仅首次产生收益
 * - 同一用户30天内下载同一资源超过3次 → 第4次起不产生收益
 * - 上传者下载自己的资源 → 不产生收益
 * - 被判定为作弊账号集群的下载 → 不产生收益
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

// 风控触发类型
export enum RiskTriggerType {
  HIGH_FREQUENCY = 'high_frequency',       // 高频下载
  ACCOUNT_CLUSTER = 'account_cluster',     // 账号关联
  NEW_ACCOUNT_BURST = 'new_account_burst', // 新账号爆发
  SELF_DOWNLOAD = 'self_download',         // 自下载
}

// 风控状态
export enum RiskStatus {
  PENDING = 'pending',   // 待审核
  APPROVED = 'approved', // 审核通过
  REJECTED = 'rejected', // 审核拒绝
}

// 有效性检查结果
export interface ValidityCheck {
  isValid: boolean;
  reason?: string;
  riskType?: RiskTriggerType;
  details?: Record<string, unknown>;
}

// 下载频率统计
export interface FrequencyStats {
  last24Hours: number;
  last7Days: number;
  last30Days: number;
  totalDownloads: number;
  uniqueDownloaders: number;
}

// 账号关联检测结果
export interface ClusterDetection {
  isCluster: boolean;
  confidence: number;
  clusterSize: number;
  indicators: string[];
}

// 时间范围
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * 检查是否为有效下载（可产生收益）
 * 
 * 规则：
 * 1. 上传者下载自己的资源 → 无效
 * 2. 同一用户24小时内重复下载同一资源 → 仅首次有效
 * 3. 同一用户30天内下载同一资源超过3次 → 第4次起无效
 * 
 * @param downloaderId 下载者ID
 * @param resourceId 资源ID
 * @param uploaderId 上传者ID
 * @returns 有效性检查结果
 */
export async function isValidDownload(
  downloaderId: string,
  resourceId: string,
  uploaderId: string
): Promise<ValidityCheck> {
  // 规则1: 检查是否为自下载
  if (downloaderId === uploaderId) {
    return {
      isValid: false,
      reason: '下载自己的资源不产生收益',
      riskType: RiskTriggerType.SELF_DOWNLOAD,
    };
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 规则2: 检查24小时内是否已下载过
  const recentDownload = await prisma.download_history.findFirst({
    where: {
      user_id: downloaderId,
      resource_id: resourceId,
      created_at: { gte: twentyFourHoursAgo },
      earnings_awarded: true, // 已产生过收益
    },
  });

  if (recentDownload) {
    return {
      isValid: false,
      reason: '24小时内已下载过该资源',
      riskType: RiskTriggerType.HIGH_FREQUENCY,
      details: {
        lastDownloadTime: recentDownload.created_at,
      },
    };
  }

  // 规则3: 检查30天内下载次数
  const monthlyDownloadCount = await prisma.download_history.count({
    where: {
      user_id: downloaderId,
      resource_id: resourceId,
      created_at: { gte: thirtyDaysAgo },
      earnings_awarded: true,
    },
  });

  if (monthlyDownloadCount >= 3) {
    return {
      isValid: false,
      reason: '30天内下载该资源已超过3次',
      riskType: RiskTriggerType.HIGH_FREQUENCY,
      details: {
        downloadCount: monthlyDownloadCount,
        limit: 3,
      },
    };
  }

  return { isValid: true };
}


/**
 * 检测账号关联性
 * 
 * 检测指标：
 * 1. 相同IP地址（通过下载记录）
 * 2. 短时间内注册
 * 3. 下载行为相似度
 * 
 * @param accountIds 待检测的账号ID列表
 * @returns 关联检测结果
 */
export async function detectAccountCluster(accountIds: string[]): Promise<ClusterDetection> {
  if (accountIds.length < 2) {
    return {
      isCluster: false,
      confidence: 0,
      clusterSize: accountIds.length,
      indicators: [],
    };
  }

  const indicators: string[] = [];
  let score = 0;

  // 获取账号信息
  const accounts = await prisma.users.findMany({
    where: { user_id: { in: accountIds } },
    select: {
      user_id: true,
      created_at: true,
    },
  });

  if (accounts.length < 2) {
    return {
      isCluster: false,
      confidence: 0,
      clusterSize: accounts.length,
      indicators: [],
    };
  }

  // 检测1: 通过下载记录检查相同IP地址
  const downloadRecords = await prisma.download_history.findMany({
    where: { user_id: { in: accountIds } },
    select: { user_id: true, ip_address: true },
    take: 100,
  });
  
  const ipAddresses = downloadRecords.map(d => d.ip_address).filter(Boolean) as string[];
  const uniqueIps = new Set(ipAddresses);
  if (ipAddresses.length > 0 && uniqueIps.size < ipAddresses.length * 0.5) {
    indicators.push('多个账号使用相同IP地址');
    score += 30;
  }

  // 检测2: 短时间内注册（1小时内）
  const creationTimes = accounts.map(a => a.created_at.getTime()).sort();
  const timeDiffs: number[] = [];
  for (let i = 1; i < creationTimes.length; i++) {
    timeDiffs.push(creationTimes[i] - creationTimes[i - 1]);
  }
  const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
  if (avgTimeDiff < 60 * 60 * 1000) { // 1小时内
    indicators.push('账号注册时间间隔过短');
    score += 25;
  }

  // 检测3: 下载行为相似度
  const downloadPatterns = await Promise.all(
    accountIds.map(async (userId) => {
      const downloads = await prisma.download_history.findMany({
        where: { user_id: userId },
        select: { resource_id: true },
        take: 50,
      });
      return new Set(downloads.map(d => d.resource_id));
    })
  );

  // 计算下载资源重叠度
  if (downloadPatterns.length >= 2) {
    let totalOverlap = 0;
    let comparisons = 0;
    for (let i = 0; i < downloadPatterns.length; i++) {
      for (let j = i + 1; j < downloadPatterns.length; j++) {
        const set1 = downloadPatterns[i];
        const set2 = downloadPatterns[j];
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        if (union.size > 0) {
          totalOverlap += intersection.size / union.size;
          comparisons++;
        }
      }
    }
    const avgOverlap = comparisons > 0 ? totalOverlap / comparisons : 0;
    if (avgOverlap > 0.7) {
      indicators.push('下载资源高度重叠');
      score += 35;
    } else if (avgOverlap > 0.5) {
      indicators.push('下载资源存在重叠');
      score += 20;
    }
  }

  // 计算置信度（0-100）
  const confidence = Math.min(100, score);
  const isCluster = confidence >= 60;

  return {
    isCluster,
    confidence,
    clusterSize: accounts.length,
    indicators,
  };
}

/**
 * 触发风控预警
 * 
 * @param resourceId 资源ID
 * @param triggerType 触发类型
 * @param triggerData 触发数据
 */
export async function triggerRiskAlert(
  resourceId: string,
  triggerType: RiskTriggerType,
  triggerData: Record<string, unknown>
): Promise<string> {
  const riskLog = await prisma.risk_control_logs.create({
    data: {
      resource_id: resourceId,
      trigger_type: triggerType,
      trigger_data: triggerData as any,
      status: RiskStatus.PENDING,
    },
  });

  logger.warn(
    `风控预警触发: 资源=${resourceId}, 类型=${triggerType}, ` +
    `数据=${JSON.stringify(triggerData)}`
  );

  return riskLog.log_id;
}

/**
 * 获取下载频率统计
 * 
 * @param resourceId 资源ID
 * @param timeRange 时间范围（可选）
 * @returns 下载频率统计
 */
export async function getDownloadFrequency(
  resourceId: string,
  timeRange?: TimeRange
): Promise<FrequencyStats> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const baseWhere: Record<string, unknown> = { resource_id: resourceId };
  if (timeRange) {
    baseWhere.created_at = {
      gte: timeRange.start,
      lte: timeRange.end,
    };
  }

  const [last24Hours, last7Days, last30Days, totalDownloads, uniqueDownloaders] = await Promise.all([
    prisma.download_history.count({
      where: {
        resource_id: resourceId,
        created_at: { gte: twentyFourHoursAgo },
      },
    }),
    prisma.download_history.count({
      where: {
        resource_id: resourceId,
        created_at: { gte: sevenDaysAgo },
      },
    }),
    prisma.download_history.count({
      where: {
        resource_id: resourceId,
        created_at: { gte: thirtyDaysAgo },
      },
    }),
    prisma.download_history.count({
      where: baseWhere,
    }),
    prisma.download_history.groupBy({
      by: ['user_id'],
      where: baseWhere,
    }).then(result => result.length),
  ]);

  return {
    last24Hours,
    last7Days,
    last30Days,
    totalDownloads,
    uniqueDownloaders,
  };
}

/**
 * 检测高频下载异常
 * 
 * @param resourceId 资源ID
 * @returns 是否存在异常
 */
export async function detectHighFrequencyAnomaly(resourceId: string): Promise<{
  isAnomaly: boolean;
  reason?: string;
  stats?: FrequencyStats;
}> {
  const stats = await getDownloadFrequency(resourceId);

  // 规则1: 24小时内下载超过100次
  if (stats.last24Hours > 100) {
    return {
      isAnomaly: true,
      reason: `24小时内下载次数异常: ${stats.last24Hours}次`,
      stats,
    };
  }

  // 规则2: 下载者重复率过高（同一用户多次下载）
  if (stats.totalDownloads > 10 && stats.uniqueDownloaders < stats.totalDownloads * 0.3) {
    return {
      isAnomaly: true,
      reason: `下载者重复率过高: ${stats.uniqueDownloaders}/${stats.totalDownloads}`,
      stats,
    };
  }

  return { isAnomaly: false, stats };
}

/**
 * 审核风控预警
 * 
 * @param logId 风控日志ID
 * @param reviewerId 审核员ID
 * @param status 审核状态
 * @param reviewNote 审核备注
 */
export async function reviewRiskAlert(
  logId: string,
  reviewerId: string,
  status: RiskStatus.APPROVED | RiskStatus.REJECTED,
  reviewNote: string
): Promise<void> {
  const log = await prisma.risk_control_logs.findUnique({
    where: { log_id: logId },
  });

  if (!log) {
    throw new Error('风控日志不存在');
  }

  if (log.status !== RiskStatus.PENDING) {
    throw new Error('该风控预警已审核');
  }

  await prisma.risk_control_logs.update({
    where: { log_id: logId },
    data: {
      status,
      reviewer_id: reviewerId,
      review_note: reviewNote,
      reviewed_at: new Date(),
    },
  });

  logger.info(
    `风控预警审核完成: logId=${logId}, 审核员=${reviewerId}, ` +
    `状态=${status}, 备注=${reviewNote}`
  );
}

/**
 * 获取待审核的风控预警列表
 * 
 * @param options 查询选项
 * @returns 风控预警列表
 */
export async function getPendingRiskAlerts(options: {
  pageNum?: number;
  pageSize?: number;
  triggerType?: RiskTriggerType;
} = {}): Promise<{
  list: Array<{
    logId: string;
    resourceId: string;
    triggerType: string;
    triggerData: unknown;
    status: string;
    createdAt: Date;
  }>;
  total: number;
}> {
  const { pageNum = 1, pageSize = 20, triggerType } = options;
  const skip = (pageNum - 1) * pageSize;

  const where: Record<string, unknown> = { status: RiskStatus.PENDING };
  if (triggerType) {
    where.trigger_type = triggerType;
  }

  const [logs, total] = await Promise.all([
    prisma.risk_control_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.risk_control_logs.count({ where }),
  ]);

  return {
    list: logs.map(log => ({
      logId: log.log_id,
      resourceId: log.resource_id,
      triggerType: log.trigger_type,
      triggerData: log.trigger_data,
      status: log.status,
      createdAt: log.created_at,
    })),
    total,
  };
}

/**
 * 检查用户是否为新账号（注册不足7天）
 * 
 * @param userId 用户ID
 * @returns 是否为新账号
 */
export async function isNewAccount(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { created_at: true },
  });

  if (!user) {
    return false;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return user.created_at > sevenDaysAgo;
}

/**
 * 检测新账号爆发下载
 * 
 * @param resourceId 资源ID
 * @returns 检测结果
 */
export async function detectNewAccountBurst(resourceId: string): Promise<{
  isBurst: boolean;
  newAccountDownloads: number;
  totalDownloads: number;
  ratio: number;
}> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 获取24小时内的下载记录
  const recentDownloads = await prisma.download_history.findMany({
    where: {
      resource_id: resourceId,
      created_at: { gte: twentyFourHoursAgo },
    },
    include: {
      users: {
        select: { created_at: true },
      },
    },
  });

  const totalDownloads = recentDownloads.length;
  const newAccountDownloads = recentDownloads.filter(
    d => d.users && d.users.created_at > sevenDaysAgo
  ).length;

  const ratio = totalDownloads > 0 ? newAccountDownloads / totalDownloads : 0;

  // 如果新账号下载占比超过50%且总下载超过10次，判定为爆发
  const isBurst = ratio > 0.5 && totalDownloads > 10;

  return {
    isBurst,
    newAccountDownloads,
    totalDownloads,
    ratio,
  };
}

export default {
  isValidDownload,
  detectAccountCluster,
  triggerRiskAlert,
  getDownloadFrequency,
  detectHighFrequencyAnomaly,
  reviewRiskAlert,
  getPendingRiskAlerts,
  isNewAccount,
  detectNewAccountBurst,
  RiskTriggerType,
  RiskStatus,
};
