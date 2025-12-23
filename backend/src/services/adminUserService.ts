/**
 * 管理员用户服务
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

export interface UserListFilters {
  search?: string; // 搜索关键词（手机号/昵称/用户ID）
  vipLevel?: number; // VIP等级筛选
  status?: number; // 状态筛选
}

export interface UserListItem {
  userId: string;
  phone: string;
  nickname: string | null;
  avatar: string | null;
  vipLevel: number;
  vipExpireAt: Date | null;
  pointsBalance: number;
  pointsTotal: number;
  userLevel: number;
  status: number;
  roleCode: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface UserListResponse {
  list: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserDetailResponse extends UserListItem {
  email: string | null;
  bio: string | null;
  pointsRecords: Array<{
    recordId: string;
    pointsChange: number;
    pointsBalance: number;
    changeType: string;
    source: string;
    description: string | null;
    createdAt: Date;
  }>;
  operationLogs: Array<{
    logId: string;
    action: string;
    description: string;
    operatorId: string;
    operatorName: string;
    createdAt: Date;
  }>;
}

export class AdminUserService {
  /**
   * 获取用户列表
   */
  async getUserList(
    page: number,
    pageSize: number,
    filters: UserListFilters
  ): Promise<UserListResponse> {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { phone: { contains: filters.search } },
        { nickname: { contains: filters.search } },
        { user_id: { contains: filters.search } },
      ];
    }

    if (filters.vipLevel !== undefined) {
      where.vip_level = filters.vipLevel;
    }

    if (filters.status !== undefined) {
      where.status = filters.status;
    }

    const total = await prisma.users.count({ where });

    const users = await prisma.users.findMany({
      where,
      include: {
        roles: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const list: UserListItem[] = users.map((user) => ({
      userId: user.user_id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      vipLevel: user.vip_level,
      vipExpireAt: user.vip_expire_at,
      pointsBalance: user.points_balance,
      pointsTotal: user.points_total,
      userLevel: user.user_level,
      status: user.status,
      roleCode: user.roles?.role_code || 'user',
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    }));

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取用户详情
   */
  async getUserDetail(userId: string): Promise<UserDetailResponse> {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const pointsRecords = await prisma.points_records.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    const operationLogs = await prisma.admin_operation_logs.findMany({
      where: { target_user_id: userId },
      include: {
        users_admin_operation_logs_operator_idTousers: {
          select: {
            user_id: true,
            nickname: true,
            phone: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    return {
      userId: user.user_id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      bio: user.bio,
      vipLevel: user.vip_level,
      vipExpireAt: user.vip_expire_at,
      pointsBalance: user.points_balance,
      pointsTotal: user.points_total,
      userLevel: user.user_level,
      status: user.status,
      roleCode: user.roles?.role_code || 'user',
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      pointsRecords: pointsRecords.map((record) => ({
        recordId: record.record_id,
        pointsChange: record.points_change,
        pointsBalance: record.points_balance,
        changeType: record.change_type,
        source: record.source,
        description: record.description,
        createdAt: record.created_at,
      })),
      operationLogs: operationLogs.map((log) => ({
        logId: log.log_id,
        action: log.action,
        description: log.description,
        operatorId: log.operator_id,
        operatorName: log.users_admin_operation_logs_operator_idTousers.nickname || log.users_admin_operation_logs_operator_idTousers.phone,
        createdAt: log.created_at,
      })),
    };
  }

  /**
   * 更新用户状态（禁用/启用）
   */
  async updateUserStatus(
    userId: string,
    status: number,
    operatorId: string,
    reason?: string
  ): Promise<void> {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (userId === operatorId) {
      throw new Error('不能禁用自己的账号');
    }

    await prisma.users.update({
      where: { user_id: userId },
      data: {
        status,
        updated_at: new Date(),
      },
    });

    await this.createOperationLog(
      operatorId,
      userId,
      status === 1 ? 'enable_user' : 'disable_user',
      `${status === 1 ? '启用' : '禁用'}用户${reason ? `: ${reason}` : ''}`
    );

    logger.info(`用户状态更新成功: ${userId}, 状态: ${status}, 操作者: ${operatorId}`);
  }

  /**
   * 重置用户密码
   */
  async resetPassword(userId: string, operatorId: string): Promise<string> {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.users.update({
      where: { user_id: userId },
      data: {
        password_hash: passwordHash,
        updated_at: new Date(),
      },
    });

    await this.createOperationLog(
      operatorId,
      userId,
      'reset_password',
      '重置用户密码'
    );

    logger.info(`用户密码重置成功: ${userId}, 操作者: ${operatorId}`);

    return tempPassword;
  }

  /**
   * 调整用户VIP
   */
  async adjustVip(
    userId: string,
    vipLevel: number,
    vipExpireAt: Date | null,
    operatorId: string,
    reason?: string
  ): Promise<void> {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (vipLevel < 0 || vipLevel > 3) {
      throw new Error('VIP等级必须在0-3之间');
    }

    if (vipLevel > 0 && !vipExpireAt) {
      throw new Error('设置VIP等级时必须指定到期时间');
    }

    await prisma.users.update({
      where: { user_id: userId },
      data: {
        vip_level: vipLevel,
        vip_expire_at: vipExpireAt,
        updated_at: new Date(),
      },
    });

    await this.createOperationLog(
      operatorId,
      userId,
      'adjust_vip',
      `调整VIP等级为${vipLevel}${vipExpireAt ? `，到期时间：${vipExpireAt.toISOString()}` : ''}${reason ? `，原因：${reason}` : ''}`
    );

    logger.info(`用户VIP调整成功: ${userId}, VIP等级: ${vipLevel}, 操作者: ${operatorId}`);
  }

  /**
   * 调整用户积分
   */
  async adjustPoints(
    userId: string,
    pointsChange: number,
    reason: string,
    operatorId: string
  ): Promise<void> {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const newBalance = user.points_balance + pointsChange;

    if (newBalance < 0) {
      throw new Error('积分余额不足，无法扣除');
    }

    await prisma.users.update({
      where: { user_id: userId },
      data: {
        points_balance: newBalance,
        points_total: pointsChange > 0 ? user.points_total + pointsChange : user.points_total,
        updated_at: new Date(),
      },
    });

    await prisma.points_records.create({
      data: {
        user_id: userId,
        points_change: pointsChange,
        points_balance: newBalance,
        change_type: 'adjust',
        source: 'admin_adjust',
        description: `管理员调整积分：${reason}`,
      },
    });

    await this.createOperationLog(
      operatorId,
      userId,
      'adjust_points',
      `调整积分${pointsChange > 0 ? '+' : ''}${pointsChange}，原因：${reason}`
    );

    logger.info(`用户积分调整成功: ${userId}, 变动: ${pointsChange}, 操作者: ${operatorId}`);
  }

  /**
   * 创建操作日志
   */
  private async createOperationLog(
    operatorId: string,
    targetUserId: string,
    action: string,
    description: string
  ): Promise<void> {
    await prisma.admin_operation_logs.create({
      data: {
        operator_id: operatorId,
        target_user_id: targetUserId,
        action,
        description,
      },
    });
  }

  /**
   * 生成临时密码
   */
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

export const adminUserService = new AdminUserService();
export default adminUserService;
