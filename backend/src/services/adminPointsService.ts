/**
 * 管理员积分调整服务
 * 提供积分调整、批量赠送、撤销等管理功能
 */

import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

// 调整类型枚举
export enum AdjustmentType {
  ADD = 'add',
  DEDUCT = 'deduct',
  GIFT = 'gift',
  BATCH_GIFT = 'batch_gift'
}

// 积分调整请求
export interface PointsAdjustmentRequest {
  adminId: string;
  targetUserId: string;
  adjustmentType: AdjustmentType;
  pointsChange: number;
  reason: string;
}

// 批量赠送请求
export interface BatchGiftRequest {
  adminId: string;
  userIds: string[];
  points: number;
  reason: string;
}

// 批量赠送结果
export interface BatchGiftResult {
  totalUsers: number;
  successCount: number;
  failedCount: number;
  failedUsers: Array<{ userId: string; reason: string }>;
}

// 调整日志响应
export interface AdjustmentLogResponse {
  logId: string;
  adminId: string;
  adminName?: string;
  targetUserId: string;
  targetUserName?: string;
  adjustmentType: string;
  pointsChange: number;
  pointsBefore: number;
  pointsAfter: number;
  reason: string;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedBy?: string;
  revokeReason?: string;
  createdAt: Date;
}

// 调整错误类
export class AdjustmentError extends Error {
  constructor(message: string, public code: string = 'ADJUSTMENT_ERROR') {
    super(message);
    this.name = 'AdjustmentError';
  }
}

// 审批配置
export interface ApprovalConfig {
  singlePointsThreshold: number;  // 单次调整积分阈值
  batchUserThreshold: number;     // 批量用户数阈值
  maxSingleAdjustment: number;    // 单次最大调整积分
}

// 默认审批配置
const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = {
  singlePointsThreshold: 1000,
  batchUserThreshold: 100,
  maxSingleAdjustment: 10000
};

/**
 * 验证调整原因
 */
export function validateReason(reason: string): void {
  if (!reason || reason.trim().length === 0) {
    throw new AdjustmentError('调整原因不能为空', 'POINTS_008');
  }
  if (reason.length < 5) {
    throw new AdjustmentError('调整原因不能少于5个字符', 'POINTS_008');
  }
  if (reason.length > 200) {
    throw new AdjustmentError('调整原因不能超过200个字符', 'POINTS_008');
  }
}

/**
 * 检查是否需要二次审批
 */
export function checkApprovalRequired(
  pointsChange: number,
  userCount: number,
  config: ApprovalConfig = DEFAULT_APPROVAL_CONFIG
): boolean {
  return Math.abs(pointsChange) >= config.singlePointsThreshold ||
         userCount >= config.batchUserThreshold;
}

class AdminPointsService {
  private approvalConfig: ApprovalConfig = DEFAULT_APPROVAL_CONFIG;

  /**
   * 设置审批配置
   */
  setApprovalConfig(config: Partial<ApprovalConfig>): void {
    this.approvalConfig = { ...this.approvalConfig, ...config };
  }

  /**
   * 获取审批配置
   */
  getApprovalConfig(): ApprovalConfig {
    return { ...this.approvalConfig };
  }

  /**
   * 单用户积分调整
   */
  async adjustUserPoints(request: PointsAdjustmentRequest): Promise<AdjustmentLogResponse> {
    const { adminId, targetUserId, adjustmentType, pointsChange, reason } = request;

    // 验证原因
    validateReason(reason);

    // 验证积分变动值
    if (pointsChange <= 0) {
      throw new AdjustmentError('积分变动值必须为正数', 'INVALID_POINTS');
    }

    // 检查单次调整上限
    if (pointsChange > this.approvalConfig.maxSingleAdjustment) {
      throw new AdjustmentError(`单次调整积分不能超过${this.approvalConfig.maxSingleAdjustment}`, 'EXCEED_LIMIT');
    }

    // 计算实际变动值（扣除为负数）
    const actualChange = adjustmentType === AdjustmentType.DEDUCT ? -pointsChange : pointsChange;

    // 使用事务
    return await prisma.$transaction(async (tx) => {
      // 获取目标用户
      const targetUser = await tx.users.findUnique({
        where: { user_id: targetUserId }
      });

      if (!targetUser) {
        throw new AdjustmentError('目标用户不存在', 'USER_NOT_FOUND');
      }

      // 扣除时检查余额
      if (adjustmentType === AdjustmentType.DEDUCT) {
        if (targetUser.points_balance < pointsChange) {
          throw new AdjustmentError(
            `用户积分余额不足，当前余额: ${targetUser.points_balance}，需扣除: ${pointsChange}`,
            'INSUFFICIENT_BALANCE'
          );
        }
      }

      const pointsBefore = targetUser.points_balance;
      const pointsAfter = pointsBefore + actualChange;

      // 确保积分不为负
      if (pointsAfter < 0) {
        throw new AdjustmentError('调整后积分余额不能为负数', 'NEGATIVE_BALANCE');
      }

      // 更新用户积分
      await tx.users.update({
        where: { user_id: targetUserId },
        data: {
          points_balance: pointsAfter,
          // 只有增加类型才增加累计积分
          ...(actualChange > 0 && { points_total: { increment: actualChange } }),
          updated_at: new Date()
        }
      });

      // 创建积分变动记录
      await tx.points_records.create({
        data: {
          user_id: targetUserId,
          points_change: actualChange,
          points_balance: pointsAfter,
          change_type: `admin_${adjustmentType}`,
          source: 'admin_adjustment',
          description: `管理员${adjustmentType === AdjustmentType.DEDUCT ? '扣除' : '增加'}积分: ${reason}`,
          acquired_at: new Date()
        }
      });

      // 创建调整日志
      const log = await tx.points_adjustment_logs.create({
        data: {
          admin_id: adminId,
          target_user_id: targetUserId,
          adjustment_type: adjustmentType,
          points_change: actualChange,
          points_before: pointsBefore,
          points_after: pointsAfter,
          reason
        }
      });

      // 发送通知
      await tx.notifications.create({
        data: {
          user_id: targetUserId,
          title: adjustmentType === AdjustmentType.DEDUCT ? '积分扣除通知' : '积分增加通知',
          content: `您的积分${adjustmentType === AdjustmentType.DEDUCT ? '被扣除' : '增加了'}${Math.abs(actualChange)}，原因：${reason}。当前积分余额：${pointsAfter}`,
          type: 'points_adjustment',
          is_read: false
        }
      });

      return {
        logId: log.log_id,
        adminId: log.admin_id,
        targetUserId: log.target_user_id,
        adjustmentType: log.adjustment_type,
        pointsChange: log.points_change,
        pointsBefore: log.points_before,
        pointsAfter: log.points_after,
        reason: log.reason,
        isRevoked: log.is_revoked,
        createdAt: log.created_at
      };
    });
  }

  /**
   * 批量赠送积分
   */
  async batchGiftPoints(request: BatchGiftRequest): Promise<BatchGiftResult> {
    const { adminId, userIds, points, reason } = request;

    // 验证原因
    validateReason(reason);

    // 验证积分
    if (points <= 0) {
      throw new AdjustmentError('赠送积分必须为正数', 'INVALID_POINTS');
    }

    const result: BatchGiftResult = {
      totalUsers: userIds.length,
      successCount: 0,
      failedCount: 0,
      failedUsers: []
    };

    // 逐个处理用户
    for (const userId of userIds) {
      try {
        await this.adjustUserPoints({
          adminId,
          targetUserId: userId,
          adjustmentType: AdjustmentType.BATCH_GIFT,
          pointsChange: points,
          reason
        });
        result.successCount++;
      } catch (error) {
        result.failedCount++;
        result.failedUsers.push({
          userId,
          reason: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    return result;
  }

  /**
   * 撤销积分调整
   */
  async revokeAdjustment(
    logId: string,
    adminId: string,
    revokeReason: string
  ): Promise<AdjustmentLogResponse> {
    // 验证撤销原因
    if (!revokeReason || revokeReason.trim().length === 0) {
      throw new AdjustmentError('撤销原因不能为空', 'POINTS_010');
    }

    return await prisma.$transaction(async (tx) => {
      // 获取调整日志
      const log = await tx.points_adjustment_logs.findUnique({
        where: { log_id: logId }
      });

      if (!log) {
        throw new AdjustmentError('调整记录不存在', 'LOG_NOT_FOUND');
      }

      if (log.is_revoked) {
        throw new AdjustmentError('该调整已被撤销', 'ALREADY_REVOKED');
      }

      // 检查24小时时间限制
      const hoursSinceCreation = (Date.now() - log.created_at.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation > 24) {
        throw new AdjustmentError('只能撤销24小时内的调整操作', 'POINTS_010');
      }

      // 获取用户当前积分
      const user = await tx.users.findUnique({
        where: { user_id: log.target_user_id }
      });

      if (!user) {
        throw new AdjustmentError('用户不存在', 'USER_NOT_FOUND');
      }

      // 计算撤销后的积分
      const revertChange = -log.points_change;
      const newBalance = user.points_balance + revertChange;

      // 如果是撤销增加操作，检查用户是否已消耗
      if (log.points_change > 0 && newBalance < 0) {
        throw new AdjustmentError(
          `无法撤销：用户已消耗部分积分，当前余额${user.points_balance}不足以撤销${log.points_change}积分`,
          'POINTS_CONSUMED'
        );
      }

      // 更新用户积分
      await tx.users.update({
        where: { user_id: log.target_user_id },
        data: {
          points_balance: newBalance,
          // 如果原操作是增加，撤销时减少累计积分
          ...(log.points_change > 0 && { points_total: { decrement: log.points_change } }),
          updated_at: new Date()
        }
      });

      // 创建撤销的积分变动记录
      await tx.points_records.create({
        data: {
          user_id: log.target_user_id,
          points_change: revertChange,
          points_balance: newBalance,
          change_type: 'admin_revoke',
          source: 'admin_adjustment_revoke',
          source_id: logId,
          description: `撤销积分调整: ${revokeReason}`,
          acquired_at: new Date()
        }
      });

      // 更新调整日志
      const updatedLog = await tx.points_adjustment_logs.update({
        where: { log_id: logId },
        data: {
          is_revoked: true,
          revoked_at: new Date(),
          revoked_by: adminId,
          revoke_reason: revokeReason
        }
      });

      // 发送通知
      await tx.notifications.create({
        data: {
          user_id: log.target_user_id,
          title: '积分调整撤销通知',
          content: `您之前的积分调整已被撤销，积分变动${revertChange}，原因：${revokeReason}。当前积分余额：${newBalance}`,
          type: 'points_revoke',
          is_read: false
        }
      });

      return {
        logId: updatedLog.log_id,
        adminId: updatedLog.admin_id,
        targetUserId: updatedLog.target_user_id,
        adjustmentType: updatedLog.adjustment_type,
        pointsChange: updatedLog.points_change,
        pointsBefore: updatedLog.points_before,
        pointsAfter: updatedLog.points_after,
        reason: updatedLog.reason,
        isRevoked: updatedLog.is_revoked,
        revokedAt: updatedLog.revoked_at || undefined,
        revokedBy: updatedLog.revoked_by || undefined,
        revokeReason: updatedLog.revoke_reason || undefined,
        createdAt: updatedLog.created_at
      };
    });
  }

  /**
   * 检查是否需要二次审批
   */
  checkApprovalRequired(pointsChange: number, userCount: number = 1): boolean {
    return checkApprovalRequired(pointsChange, userCount, this.approvalConfig);
  }

  /**
   * 获取调整日志列表
   */
  async getAdjustmentLogs(options: {
    page?: number;
    pageSize?: number;
    adminId?: string;
    targetUserId?: string;
    adjustmentType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{ logs: AdjustmentLogResponse[]; total: number }> {
    const { page = 1, pageSize = 10, adminId, targetUserId, adjustmentType, startDate, endDate } = options;
    const skip = (page - 1) * pageSize;

    const where: Prisma.points_adjustment_logsWhereInput = {
      ...(adminId && { admin_id: adminId }),
      ...(targetUserId && { target_user_id: targetUserId }),
      ...(adjustmentType && { adjustment_type: adjustmentType }),
      ...(startDate && { created_at: { gte: startDate } }),
      ...(endDate && { created_at: { lte: endDate } })
    };

    const [logs, total] = await Promise.all([
      prisma.points_adjustment_logs.findMany({
        where,
        include: {
          admin_user: { select: { nickname: true, phone: true } },
          target_user: { select: { nickname: true, phone: true } }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.points_adjustment_logs.count({ where })
    ]);

    return {
      logs: logs.map(log => ({
        logId: log.log_id,
        adminId: log.admin_id,
        adminName: log.admin_user?.nickname || log.admin_user?.phone,
        targetUserId: log.target_user_id,
        targetUserName: log.target_user?.nickname || log.target_user?.phone,
        adjustmentType: log.adjustment_type,
        pointsChange: log.points_change,
        pointsBefore: log.points_before,
        pointsAfter: log.points_after,
        reason: log.reason,
        isRevoked: log.is_revoked,
        revokedAt: log.revoked_at || undefined,
        revokedBy: log.revoked_by || undefined,
        revokeReason: log.revoke_reason || undefined,
        createdAt: log.created_at
      })),
      total
    };
  }

  /**
   * 获取单条调整日志
   */
  async getAdjustmentLogById(logId: string): Promise<AdjustmentLogResponse | null> {
    const log = await prisma.points_adjustment_logs.findUnique({
      where: { log_id: logId },
      include: {
        admin_user: { select: { nickname: true, phone: true } },
        target_user: { select: { nickname: true, phone: true } }
      }
    });

    if (!log) return null;

    return {
      logId: log.log_id,
      adminId: log.admin_id,
      adminName: log.admin_user?.nickname || log.admin_user?.phone,
      targetUserId: log.target_user_id,
      targetUserName: log.target_user?.nickname || log.target_user?.phone,
      adjustmentType: log.adjustment_type,
      pointsChange: log.points_change,
      pointsBefore: log.points_before,
      pointsAfter: log.points_after,
      reason: log.reason,
      isRevoked: log.is_revoked,
      revokedAt: log.revoked_at || undefined,
      revokedBy: log.revoked_by || undefined,
      revokeReason: log.revoke_reason || undefined,
      createdAt: log.created_at
    };
  }
}

export const adminPointsService = new AdminPointsService();
export default adminPointsService;
