/**
 * 设备管理控制器
 * 处理用户设备列表和踢出设备
 */

import { Request, Response } from 'express';
import { deviceManager } from '../services/device/deviceManager';
import logger from '../utils/logger';

/**
 * 获取用户设备列表
 * GET /api/v1/user/devices
 */
export async function getUserDevices(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const devices = await deviceManager.getUserDevices(userId);

    res.json({
      code: 0,
      data: {
        list: devices.map(d => ({
          sessionId: d.sessionId,
          deviceType: d.deviceInfo.deviceType,
          browser: d.deviceInfo.browser,
          os: d.deviceInfo.os,
          ip: d.deviceInfo.ip,
          lastActiveAt: d.lastActiveAt,
          createdAt: d.createdAt,
          isCurrent: d.deviceInfo.fingerprint === req.body.currentFingerprint,
        })),
        total: devices.length,
      },
    });
  } catch (error: any) {
    logger.error('获取设备列表失败:', error);
    res.status(500).json({ code: 500, message: error.message || '获取设备列表失败' });
  }
}

/**
 * 踢出设备
 * DELETE /api/v1/user/devices/:sessionId
 */
export async function kickDevice(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    const { sessionId } = req.params;

    await deviceManager.kickDevice(userId, sessionId, '用户主动踢出');

    res.json({ code: 0, message: '设备已踢出' });
  } catch (error: any) {
    logger.error('踢出设备失败:', error);
    res.status(500).json({ code: 500, message: error.message || '踢出设备失败' });
  }
}
