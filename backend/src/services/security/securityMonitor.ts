/**
 * 安全监控服务
 * 处理支付安全检查、异常行为检测、二次验证
 */

import { PrismaClient } from '@prisma/client';
import { getPaymentConfig } from '../../config/payment';
import logger from '../../utils/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

// 安全检查结果
export interface SecurityCheckResult {
  allowed: boolean;
  reason?: SecurityBlockReason;
  requireSecondaryAuth: boolean;
}

// 安全阻止原因
export enum SecurityBlockReason {
  TOO_MANY_UNPAID_ORDERS = 'too_many_unpaid_orders',
  SUSPICIOUS_IP = 'suspicious_ip',
  ACCOUNT_LOCKED = 'account_locked',
  DEVICE_LIMIT_EXCEEDED = 'device_limit_exceeded'
}

// 安全事件类型
export enum SecurityEventType {
  PAYMENT_ATTEMPT = 'payment_attempt',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  SECONDARY_AUTH_SENT = 'secondary_auth_sent',
  SECONDARY_AUTH_VERIFIED = 'secondary_auth_verified',
  SECONDARY_AUTH_FAILED = 'secondary_auth_failed',
  DEVICE_KICKED = 'device_kicked',
  REFUND_REQUESTED = 'refund_requested'
}

// 风险等级
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// 设备信息
export interface DeviceInfo {
  userAgent: string;
  ip: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  fingerprint?: string;
}

// 验证码存储（生产环境应使用Redis）
const verificationCodes = new Map<string, { code: string; expireAt: number }>();

class SecurityMonitor {
  /**
   * 检查支付安全
   */
  async checkPaymentSecurity(userId: string, deviceInfo: DeviceInfo): Promise<SecurityCheckResult> {
    const config = getPaymentConfig();

    // 检查账号是否被锁定
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        payment_locked: true,
        payment_lock_reason: true,
        status: true,
      },
    });

    if (!user) {
      return { allowed: false, reason: SecurityBlockReason.ACCOUNT_LOCKED, requireSecondaryAuth: false };
    }

    if (user.status !== 1) {
      return { allowed: false, reason: SecurityBlockReason.ACCOUNT_LOCKED, requireSecondaryAuth: false };
    }

    if (user.payment_locked) {
      return { allowed: false, reason: SecurityBlockReason.ACCOUNT_LOCKED, requireSecondaryAuth: false };
    }

    // 检查1小时内未支付订单数量
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const unpaidCount = await prisma.orders.count({
      where: {
        user_id: userId,
        payment_status: 0,
        created_at: { gte: oneHourAgo },
      },
    });

    if (unpaidCount >= config.security.maxUnpaidOrdersPerHour) {
      // 记录安全日志
      await this.logSecurityEvent({
        userId,
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        eventData: { reason: 'too_many_unpaid_orders', count: unpaidCount },
        deviceInfo,
        riskLevel: RiskLevel.MEDIUM,
        actionTaken: 'blocked',
      });

      return { allowed: false, reason: SecurityBlockReason.TOO_MANY_UNPAID_ORDERS, requireSecondaryAuth: false };
    }

    // 检查可疑IP（简单实现，生产环境应使用IP信誉库）
    const suspiciousIp = await this.checkSuspiciousIp(deviceInfo.ip);
    if (suspiciousIp) {
      await this.logSecurityEvent({
        userId,
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        eventData: { reason: 'suspicious_ip', ip: deviceInfo.ip },
        deviceInfo,
        riskLevel: RiskLevel.HIGH,
        actionTaken: 'blocked',
      });

      return { allowed: false, reason: SecurityBlockReason.SUSPICIOUS_IP, requireSecondaryAuth: false };
    }

    return { allowed: true, requireSecondaryAuth: false };
  }

  /**
   * 检查是否需要二次验证
   */
  requireSecondaryAuth(amountInCents: number): boolean {
    const config = getPaymentConfig();
    return amountInCents >= config.security.secondaryAuthThreshold;
  }

  /**
   * 发送二次验证码
   */
  async sendSecondaryAuthCode(userId: string): Promise<{ success: boolean; message: string }> {
    // 获取用户手机号
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { phone: true },
    });

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expireAt = Date.now() + 5 * 60 * 1000; // 5分钟有效

    // 存储验证码
    verificationCodes.set(userId, { code, expireAt });

    // 记录安全日志
    await this.logSecurityEvent({
      userId,
      eventType: SecurityEventType.SECONDARY_AUTH_SENT,
      eventData: { phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') },
      riskLevel: RiskLevel.LOW,
      actionTaken: 'none',
    });

    // TODO: 实际发送短信（MVP阶段仅记录日志）
    // 安全：日志中脱敏处理手机号和验证码
    const maskedPhone = user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    logger.info(`[模拟短信] 向 ${maskedPhone} 发送验证码: ******`);

    return { success: true, message: '验证码已发送' };
  }

  /**
   * 验证二次验证码
   */
  async verifySecondaryAuth(userId: string, code: string): Promise<boolean> {
    const stored = verificationCodes.get(userId);

    if (!stored) {
      await this.logSecurityEvent({
        userId,
        eventType: SecurityEventType.SECONDARY_AUTH_FAILED,
        eventData: { reason: 'no_code_found' },
        riskLevel: RiskLevel.MEDIUM,
        actionTaken: 'none',
      });
      return false;
    }

    if (Date.now() > stored.expireAt) {
      verificationCodes.delete(userId);
      await this.logSecurityEvent({
        userId,
        eventType: SecurityEventType.SECONDARY_AUTH_FAILED,
        eventData: { reason: 'code_expired' },
        riskLevel: RiskLevel.LOW,
        actionTaken: 'none',
      });
      return false;
    }

    if (stored.code !== code) {
      await this.logSecurityEvent({
        userId,
        eventType: SecurityEventType.SECONDARY_AUTH_FAILED,
        eventData: { reason: 'invalid_code' },
        riskLevel: RiskLevel.MEDIUM,
        actionTaken: 'none',
      });
      return false;
    }

    // 验证成功，删除验证码
    verificationCodes.delete(userId);

    await this.logSecurityEvent({
      userId,
      eventType: SecurityEventType.SECONDARY_AUTH_VERIFIED,
      eventData: {},
      riskLevel: RiskLevel.LOW,
      actionTaken: 'none',
    });

    return true;
  }

  /**
   * 记录支付尝试
   */
  async recordPaymentAttempt(
    userId: string,
    orderNo: string,
    deviceInfo: DeviceInfo
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      eventType: SecurityEventType.PAYMENT_ATTEMPT,
      eventData: { orderNo },
      deviceInfo,
      riskLevel: RiskLevel.LOW,
      actionTaken: 'none',
    });
  }

  /**
   * 锁定用户支付
   */
  async lockPayment(userId: string, reason: string): Promise<void> {
    await prisma.users.update({
      where: { user_id: userId },
      data: {
        payment_locked: true,
        payment_locked_at: new Date(),
        payment_lock_reason: reason,
        updated_at: new Date(),
      },
    });

    await this.logSecurityEvent({
      userId,
      eventType: SecurityEventType.ACCOUNT_LOCKED,
      eventData: { reason },
      riskLevel: RiskLevel.HIGH,
      actionTaken: 'locked',
    });

    logger.warn(`用户 ${userId} 支付已锁定: ${reason}`);
  }

  /**
   * 解除支付限制
   */
  async unlockPayment(userId: string, adminId: string): Promise<void> {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { payment_lock_reason: true },
    });

    await prisma.users.update({
      where: { user_id: userId },
      data: {
        payment_locked: false,
        payment_locked_at: null,
        payment_lock_reason: null,
        updated_at: new Date(),
      },
    });

    await this.logSecurityEvent({
      userId,
      eventType: SecurityEventType.ACCOUNT_UNLOCKED,
      eventData: { adminId, previousReason: user?.payment_lock_reason },
      riskLevel: RiskLevel.LOW,
      actionTaken: 'unlocked',
    });

    logger.info(`管理员 ${adminId} 解除用户 ${userId} 的支付限制`);
  }

  /**
   * 记录安全日志
   */
  async logSecurityEvent(params: {
    userId?: string;
    eventType: SecurityEventType;
    eventData: any;
    deviceInfo?: DeviceInfo;
    riskLevel: RiskLevel;
    actionTaken: string;
  }): Promise<void> {
    await prisma.security_logs.create({
      data: {
        user_id: params.userId,
        event_type: params.eventType,
        event_data: params.eventData,
        ip_address: params.deviceInfo?.ip,
        device_fingerprint: params.deviceInfo?.fingerprint,
        risk_level: params.riskLevel,
        action_taken: params.actionTaken,
      },
    });
  }

  /**
   * 获取用户安全日志
   */
  async getSecurityLogs(
    userId: string,
    options: { page?: number; pageSize?: number } = {}
  ) {
    const { page = 1, pageSize = 20 } = options;

    const [logs, total] = await Promise.all([
      prisma.security_logs.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.security_logs.count({ where: { user_id: userId } }),
    ]);

    return {
      list: logs.map(log => ({
        logId: log.log_id,
        eventType: log.event_type,
        eventData: log.event_data,
        ipAddress: log.ip_address,
        riskLevel: log.risk_level,
        actionTaken: log.action_taken,
        createdAt: log.created_at,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取管理员安全日志（支持筛选）
   */
  async getAdminSecurityLogs(options: {
    page?: number;
    pageSize?: number;
    userId?: string;
    eventType?: string;
    riskLevel?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const { page = 1, pageSize = 20, userId, eventType, riskLevel, startDate, endDate } = options;

    const where: any = {};
    if (userId) where.user_id = userId;
    if (eventType) where.event_type = eventType;
    if (riskLevel) where.risk_level = riskLevel;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = startDate;
      if (endDate) where.created_at.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.security_logs.findMany({
        where,
        include: {
          users: {
            select: {
              user_id: true,
              nickname: true,
              phone: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.security_logs.count({ where }),
    ]);

    return {
      list: logs.map(log => ({
        logId: log.log_id,
        userId: log.user_id,
        user: log.users ? {
          nickname: log.users.nickname,
          phone: log.users.phone,
        } : null,
        eventType: log.event_type,
        eventData: log.event_data,
        ipAddress: log.ip_address,
        deviceFingerprint: log.device_fingerprint,
        riskLevel: log.risk_level,
        actionTaken: log.action_taken,
        createdAt: log.created_at,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 检查可疑IP
   */
  private async checkSuspiciousIp(ip: string): Promise<boolean> {
    // 简单实现：检查该IP在过去1小时内是否有多次失败的支付尝试
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const failedAttempts = await prisma.security_logs.count({
      where: {
        ip_address: ip,
        event_type: SecurityEventType.PAYMENT_FAILED,
        created_at: { gte: oneHourAgo },
      },
    });

    // 如果1小时内失败超过10次，标记为可疑
    return failedAttempts >= 10;
  }

  /**
   * 生成设备指纹
   */
  generateDeviceFingerprint(deviceInfo: DeviceInfo): string {
    const data = `${deviceInfo.userAgent}|${deviceInfo.ip}|${deviceInfo.browser || ''}|${deviceInfo.os || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }
}

export const securityMonitor = new SecurityMonitor();
export default securityMonitor;
