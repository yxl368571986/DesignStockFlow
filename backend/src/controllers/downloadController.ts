/**
 * 下载控制器
 * 处理下载权限校验、下载次数统计等
 */

import { Request, Response } from 'express';
import { downloadService, DownloadPermission, DownloadCountInfo } from '../services/download/downloadService.js';
import { resourceService } from '../services/resourceService.js';
import logger from '../utils/logger.js';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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


/**
 * 获取下载确认信息
 * GET /api/v1/resources/:resourceId/download/confirm
 * 
 * 需求: 3.3, 3.4
 */
export async function getDownloadConfirmation(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { resourceId } = req.params;
    const userVipLevel = (req.user as unknown as { vipLevel?: number })?.vipLevel;
    const isVip = userVipLevel ? userVipLevel > 0 : false;

    // 动态导入下载服务
    const downloadServiceModule = await import('../services/downloadService.js');
    const confirmInfo = await downloadServiceModule.getDownloadConfirmation(resourceId, userId, isVip);

    res.json({
      code: 0,
      data: confirmInfo,
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('获取下载确认信息失败:', err);
    
    if (err.message === '资源不存在' || err.message === '用户不存在') {
      return res.status(404).json({ code: 404, message: err.message });
    }
    
    res.status(500).json({ code: 500, message: err.message || '获取确认信息失败' });
  }
}

/**
 * 执行下载（带积分扣除和收益发放）
 * POST /api/v1/resources/:resourceId/download/execute
 * 
 * 需求: 3.1, 3.2, 3.4, 3.5, 3.6, 4.6, 4.7
 */
export async function executeDownloadWithEarnings(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { resourceId } = req.params;
    const { confirmed = false } = req.body;
    const userVipLevel = (req.user as unknown as { vipLevel?: number })?.vipLevel;
    const isVip = userVipLevel ? userVipLevel > 0 : false;

    // 获取请求信息
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    // 动态导入下载服务
    const downloadServiceModule = await import('../services/downloadService.js');
    
    // 先检查权限
    const permission = await downloadServiceModule.checkDownloadPermission(resourceId, userId, isVip);
    
    if (!permission.canDownload) {
      return res.status(403).json({
        code: 403,
        message: permission.reason,
        data: {
          pointsCost: permission.pointsCost,
          pointsChannels: permission.pointsChannels,
        },
      });
    }

    // 如果需要扣积分且未确认，返回确认信息
    if (permission.pointsCost > 0 && !confirmed) {
      const confirmInfo = await downloadServiceModule.getDownloadConfirmation(resourceId, userId, isVip);
      return res.json({
        code: 1,
        message: '请确认下载',
        data: {
          needConfirm: true,
          ...confirmInfo,
        },
      });
    }

    // 执行下载
    const result = await downloadServiceModule.executeDownload(
      resourceId,
      userId,
      isVip,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return res.status(400).json({
        code: 400,
        message: result.error,
      });
    }

    res.json({
      code: 0,
      message: '下载成功',
      data: {
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
        fileSize: result.fileSize,
        pointsCost: result.pointsCost,
        earningsAwarded: result.earningsAwarded,
        earningsAmount: result.earningsAmount,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('执行下载失败:', err);
    res.status(500).json({ code: 500, message: err.message || '下载失败' });
  }
}


/**
 * 文件流下载接口
 * GET /api/v1/resources/:resourceId/download/file
 * 
 * 直接返回文件流，设置Content-Disposition: attachment强制浏览器下载
 * 需要认证
 */
export async function downloadFile(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { resourceId } = req.params;

    // 获取资源信息
    const resource = await prisma.resources.findUnique({
      where: { resource_id: resourceId },
    });

    if (!resource) {
      return res.status(404).json({ code: 404, message: '资源不存在' });
    }

    if (resource.audit_status !== 1) {
      return res.status(403).json({ code: 403, message: '资源未通过审核' });
    }

    if (resource.status !== 1) {
      return res.status(403).json({ code: 403, message: '资源已下架' });
    }

    // 检查文件是否存在
    const fileUrl = resource.file_url;
    if (!fileUrl) {
      return res.status(404).json({ code: 404, message: '资源文件不存在' });
    }

    // 将URL路径转换为文件系统路径
    let filePath = '';
    if (fileUrl.startsWith('/uploads/')) {
      // 解码URL编码的文件名
      const decodedUrl = decodeURIComponent(fileUrl);
      filePath = path.join(process.cwd(), decodedUrl);
    } else if (fileUrl.startsWith('/files/')) {
      const decodedUrl = decodeURIComponent(fileUrl);
      filePath = path.join(process.cwd(), decodedUrl);
    } else {
      // 外部URL，无法直接下载
      return res.status(400).json({ code: 400, message: '不支持的文件类型' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      logger.warn(`下载文件不存在: ${filePath}`);
      return res.status(404).json({ code: 404, message: '资源文件不存在或已被删除' });
    }

    // 获取文件信息
    const stat = fs.statSync(filePath);
    const fileName = resource.file_name || path.basename(filePath);

    // 设置响应头，强制浏览器下载
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);
    // 使用RFC 5987编码处理中文文件名
    const encodedFileName = encodeURIComponent(fileName).replace(/['()]/g, escape);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    res.setHeader('Cache-Control', 'no-cache');

    // 创建文件读取流并发送
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (err) => {
      logger.error('文件流读取错误:', err);
      if (!res.headersSent) {
        res.status(500).json({ code: 500, message: '文件读取失败' });
      }
    });

    fileStream.pipe(res);

    logger.info(`用户 ${userId} 下载文件: ${fileName}`);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('文件下载失败:', err);
    if (!res.headersSent) {
      res.status(500).json({ code: 500, message: err.message || '下载失败' });
    }
  }
}
