/**
 * 下载控制器
 * 处理下载权限校验、下载次数统计等
 */

import { Request, Response } from 'express';
import { downloadService, DownloadPermission, DownloadCountInfo } from '../services/download/downloadService.js';
import { resourceService } from '../services/resourceService.js';
import logger from '../utils/logger.js';

/**
 * 检查下载权限
 * GET /api/v1/resources/:resourceId/download-permission
 */
export async function checkDownloadPermission(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { resourceId } = req.params;

    const permission: DownloadPermission = await downloadService.checkDownloadPermission(userId, resourceId);

    res.json({
      code: 0,
      data: {
        canDownload: permission.allowed,
        reason: permission.reason,
        isVip: permission.isVip,
        isFreeResource: permission.isFreeResource,
        remainingFreeDownloads: permission.remainingFreeDownloads,
        remainingVipDownloads: permission.remainingVipDownloads,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('检查下载权限失败:', err);
    res.status(500).json({ code: 500, message: err.message || '检查权限失败' });
  }
}

/**
 * 获取用户下载次数统计
 * GET /api/v1/user/download-stats
 */
export async function getDownloadStats(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const stats: DownloadCountInfo = await downloadService.getTodayDownloadCount(userId);

    res.json({
      code: 0,
      data: {
        todayDownloads: stats.vipUsedToday + stats.freeUsedToday,
        vipDailyLimit: stats.vipDailyLimit,
        vipUsedToday: stats.vipUsedToday,
        vipRemaining: stats.vipRemaining,
        freeDailyLimit: stats.freeDailyLimit,
        freeUsedToday: stats.freeUsedToday,
        freeRemaining: stats.freeRemaining,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('获取下载统计失败:', err);
    res.status(500).json({ code: 500, message: err.message || '获取统计失败' });
  }
}

/**
 * VIP批量下载
 * POST /api/v1/resources/batch-download
 */
export async function batchDownload(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { resourceIds } = req.body;

    if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({ code: 400, message: '请选择要下载的资源' });
    }

    if (resourceIds.length > 10) {
      return res.status(400).json({ code: 400, message: '单次最多下载10个资源' });
    }

    // 检查批量下载权限
    const batchPermission = await downloadService.checkBatchDownloadPermission(userId, resourceIds);

    if (!batchPermission.allowed) {
      return res.status(403).json({
        code: 403,
        message: batchPermission.reason,
        data: {
          allowedCount: batchPermission.allowedCount,
          deniedCount: batchPermission.deniedCount,
        },
      });
    }

    // 执行批量下载 - 逐个下载
    const results: Array<{ resourceId: string; success: boolean; downloadUrl?: string; error?: string }> = [];
    const userVipLevel = (req.user as unknown as { vipLevel?: number })?.vipLevel;
    const isVip = userVipLevel ? userVipLevel > 0 : false;

    for (const resourceId of resourceIds.slice(0, batchPermission.allowedCount)) {
      try {
        const result = await resourceService.downloadResource(resourceId, userId, isVip);
        results.push({ resourceId, success: true, downloadUrl: result.downloadUrl });
      } catch (err) {
        results.push({ resourceId, success: false, error: (err as Error).message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    res.json({
      code: 0,
      data: {
        successCount,
        failedCount,
        downloads: results.filter(r => r.success),
        failedResources: results.filter(r => !r.success),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('批量下载失败:', err);
    res.status(500).json({ code: 500, message: err.message || '批量下载失败' });
  }
}

/**
 * 增强的下载资源接口
 * POST /api/v1/resources/:resourceId/download-v2
 */
export async function downloadResourceV2(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { resourceId } = req.params;
    const { usePoints = false } = req.body;

    // 检查下载权限
    const permission: DownloadPermission = await downloadService.checkDownloadPermission(userId, resourceId);

    if (!permission.allowed) {
      // 如果不能免费下载，提示使用积分
      if (usePoints) {
        // 使用积分下载
        const userVipLevel2 = (req.user as unknown as { vipLevel?: number })?.vipLevel;
        const isVip2 = userVipLevel2 ? userVipLevel2 > 0 : false;
        const result = await resourceService.downloadResource(resourceId, userId, isVip2);
        return res.json({
          code: 0,
          data: {
            ...result,
            downloadMethod: 'points',
          },
        });
      }

      return res.status(403).json({
        code: 403,
        message: permission.reason || '无下载权限',
        data: {
          canUsePoints: true,
        },
      });
    }

    // 执行下载
    const userVipLevel3 = (req.user as unknown as { vipLevel?: number })?.vipLevel;
    const isVip3 = userVipLevel3 ? userVipLevel3 > 0 : false;
    const result = await resourceService.downloadResource(resourceId, userId, isVip3);

    // 记录下载
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '',
    };
    await downloadService.recordDownload(userId, resourceId, deviceInfo, permission.isVip);

    res.json({
      code: 0,
      data: {
        ...result,
        downloadMethod: permission.isVip ? 'vip' : 'free',
        remainingDownloads: permission.isVip ? permission.remainingVipDownloads : permission.remainingFreeDownloads,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('下载资源失败:', err);
    res.status(500).json({ code: 500, message: err.message || '下载失败' });
  }
}
