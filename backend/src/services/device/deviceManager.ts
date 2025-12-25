/**
 * 设备管理服务
 * 处理多设备登录控制和设备指纹管理
 */

import { PrismaClient } from '@prisma/client';
import { getPaymentConfig } from '../../config/payment';
import logger from '../../utils/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

// 设备信息
export interface DeviceInfo {
  userAgent: string;
  ip: string;
  deviceType: 'pc' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  fingerprint?: string;
}

// 设备会话
export interface DeviceSession {
  sessionId: string;
  userId: string;
  deviceInfo: DeviceInfo;
  lastActiveAt: Date;
  createdAt: Date;
  isActive: boolean;
}

// 设备限制检查结果
export interface DeviceLimitResult {
  allowed: boolean;
  currentCount: number;
  maxCount: number;
  kickedSessionId?: string;
}

class DeviceManager {
  /**
   * 生成设备指纹
   */
  generateDeviceFingerprint(deviceInfo: DeviceInfo): string {
    const data = [
      deviceInfo.userAgent,
      deviceInfo.deviceType,
      deviceInfo.browser || '',
      deviceInfo.os || '',
    ].join('|');

    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * 解析User-Agent获取设备信息
   */
  parseUserAgent(userAgent: string): Partial<DeviceInfo> {
    const ua = userAgent.toLowerCase();

    // 检测设备类型
    let deviceType: 'pc' | 'mobile' | 'tablet' = 'pc';
    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
      deviceType = 'mobile';
    } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
      deviceType = 'tablet';
    }

    // 检测浏览器
    let browser = 'Unknown';
    if (/edg/i.test(ua)) browser = 'Edge';
    else if (/chrome/i.test(ua)) browser = 'Chrome';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua)) browser = 'Safari';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';
    else if (/msie|trident/i.test(ua)) browser = 'IE';

    // 检测操作系统
    let os = 'Unknown';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

    return { deviceType, browser, os };
  }

  /**
   * 记录设备登录
   */
  async recordDeviceLogin(userId: string, deviceInfo: DeviceInfo): Promise<DeviceSession> {
    const fingerprint = deviceInfo.fingerprint || this.generateDeviceFingerprint(deviceInfo);

    // 检查是否已有相同设备的会话
    const existingSession = await prisma.device_sessions.findFirst({
      where: {
        user_id: userId,
        device_fingerprint: fingerprint,
        is_active: true,
      },
    });

    if (existingSession) {
      // 更新现有会话
      const updated = await prisma.device_sessions.update({
        where: { session_id: existingSession.session_id },
        data: {
          last_active_at: new Date(),
          ip_address: deviceInfo.ip,
          user_agent: deviceInfo.userAgent,
        },
      });

      return {
        sessionId: updated.session_id,
        userId: updated.user_id,
        deviceInfo: {
          userAgent: updated.user_agent || '',
          ip: updated.ip_address || '',
          deviceType: (updated.device_type as 'pc' | 'mobile' | 'tablet') || 'pc',
          browser: updated.browser || undefined,
          os: updated.os || undefined,
          fingerprint: updated.device_fingerprint,
        },
        lastActiveAt: updated.last_active_at,
        createdAt: updated.created_at,
        isActive: updated.is_active,
      };
    }

    // 创建新会话
    const session = await prisma.device_sessions.create({
      data: {
        user_id: userId,
        device_fingerprint: fingerprint,
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ip_address: deviceInfo.ip,
        user_agent: deviceInfo.userAgent,
        is_active: true,
        last_active_at: new Date(),
      },
    });

    logger.info(`记录设备登录: 用户 ${userId}, 设备 ${fingerprint}`);

    return {
      sessionId: session.session_id,
      userId: session.user_id,
      deviceInfo: {
        userAgent: session.user_agent || '',
        ip: session.ip_address || '',
        deviceType: (session.device_type as 'pc' | 'mobile' | 'tablet') || 'pc',
        browser: session.browser || undefined,
        os: session.os || undefined,
        fingerprint: session.device_fingerprint,
      },
      lastActiveAt: session.last_active_at,
      createdAt: session.created_at,
      isActive: session.is_active,
    };
  }

  /**
   * 获取用户设备列表
   */
  async getUserDevices(userId: string): Promise<DeviceSession[]> {
    const sessions = await prisma.device_sessions.findMany({
      where: {
        user_id: userId,
        is_active: true,
      },
      orderBy: { last_active_at: 'desc' },
    });

    return sessions.map(session => ({
      sessionId: session.session_id,
      userId: session.user_id,
      deviceInfo: {
        userAgent: session.user_agent || '',
        ip: session.ip_address || '',
        deviceType: (session.device_type as 'pc' | 'mobile' | 'tablet') || 'pc',
        browser: session.browser || undefined,
        os: session.os || undefined,
        fingerprint: session.device_fingerprint,
      },
      lastActiveAt: session.last_active_at,
      createdAt: session.created_at,
      isActive: session.is_active,
    }));
  }

  /**
   * 踢出设备
   */
  async kickDevice(userId: string, sessionId: string, reason?: string): Promise<void> {
    const session = await prisma.device_sessions.findFirst({
      where: {
        session_id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      throw new Error('设备会话不存在');
    }

    await prisma.device_sessions.update({
      where: { session_id: sessionId },
      data: {
        is_active: false,
        kicked_at: new Date(),
        kicked_reason: reason || '用户主动踢出',
      },
    });

    logger.info(`踢出设备: 用户 ${userId}, 会话 ${sessionId}, 原因: ${reason || '用户主动踢出'}`);
  }

  /**
   * 检查设备数量限制
   */
  async checkDeviceLimit(userId: string): Promise<DeviceLimitResult> {
    const config = getPaymentConfig();
    const maxDevices = config.security.maxDevicesPerUser;

    const activeDevices = await prisma.device_sessions.findMany({
      where: {
        user_id: userId,
        is_active: true,
      },
      orderBy: { last_active_at: 'asc' },
    });

    const currentCount = activeDevices.length;

    if (currentCount < maxDevices) {
      return {
        allowed: true,
        currentCount,
        maxCount: maxDevices,
      };
    }

    // 如果超过限制，返回最早活跃的设备（将被踢出）
    const oldestDevice = activeDevices[0];

    return {
      allowed: false,
      currentCount,
      maxCount: maxDevices,
      kickedSessionId: oldestDevice?.session_id,
    };
  }

  /**
   * 自动踢出最早的设备（当超过限制时）
   */
  async autoKickOldestDevice(userId: string): Promise<string | null> {
    const limitResult = await this.checkDeviceLimit(userId);

    if (limitResult.allowed || !limitResult.kickedSessionId) {
      return null;
    }

    await this.kickDevice(userId, limitResult.kickedSessionId, '设备数量超限，自动踢出');

    return limitResult.kickedSessionId;
  }

  /**
   * 更新设备活跃时间
   */
  async updateDeviceActivity(sessionId: string): Promise<void> {
    await prisma.device_sessions.update({
      where: { session_id: sessionId },
      data: { last_active_at: new Date() },
    });
  }

  /**
   * 清理不活跃的设备会话
   */
  async cleanupInactiveSessions(daysInactive: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const result = await prisma.device_sessions.updateMany({
      where: {
        is_active: true,
        last_active_at: { lt: cutoffDate },
      },
      data: {
        is_active: false,
        kicked_at: new Date(),
        kicked_reason: '长时间不活跃，自动清理',
      },
    });

    if (result.count > 0) {
      logger.info(`清理不活跃设备会话: ${result.count} 个`);
    }

    return result.count;
  }

  /**
   * 踢出用户所有设备
   */
  async kickAllDevices(userId: string, reason?: string): Promise<number> {
    const result = await prisma.device_sessions.updateMany({
      where: {
        user_id: userId,
        is_active: true,
      },
      data: {
        is_active: false,
        kicked_at: new Date(),
        kicked_reason: reason || '踢出所有设备',
      },
    });

    logger.info(`踢出用户 ${userId} 所有设备: ${result.count} 个`);

    return result.count;
  }
}

export const deviceManager = new DeviceManager();
export default deviceManager;
