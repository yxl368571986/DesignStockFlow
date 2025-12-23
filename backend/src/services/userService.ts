/**
 * 用户服务
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '@/utils/logger.js';
import type { UserInfoResponse } from '@/types/auth.js';

const prisma = new PrismaClient();

export interface UpdateUserInfoRequest {
  nickname?: string;
  avatar?: string;
  bio?: string;
  email?: string;
}

export class UserService {
  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string): Promise<UserInfoResponse> {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return this.formatUserInfo(user);
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(
    userId: string,
    updateData: UpdateUserInfoRequest
  ): Promise<UserInfoResponse> {
    // 验证输入格式
    if (updateData.nickname !== undefined) {
      if (!this.validateNickname(updateData.nickname)) {
        throw new Error('昵称长度应在2-50个字符之间');
      }
    }

    if (updateData.email !== undefined && updateData.email) {
      if (!this.validateEmail(updateData.email)) {
        throw new Error('邮箱格式不正确');
      }
    }

    if (updateData.bio !== undefined && updateData.bio) {
      if (updateData.bio.length > 500) {
        throw new Error('个人简介不能超过500个字符');
      }
    }

    // 更新用户信息
    const user = await prisma.users.update({
      where: { user_id: userId },
      data: {
        nickname: updateData.nickname,
        avatar: updateData.avatar,
        bio: updateData.bio,
        email: updateData.email,
        updated_at: new Date(),
      },
      include: {
        roles: true,
      },
    });

    logger.info(`用户信息更新成功: ${userId}`);

    return this.formatUserInfo(user);
  }

  /**
   * 修改密码
   */
  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    // 1. 验证新密码强度
    if (!this.validatePassword(newPassword)) {
      throw new Error('新密码长度至少6位');
    }

    // 2. 查找用户
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 3. 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      throw new Error('旧密码不正确');
    }

    // 4. 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 5. 更新密码
    await prisma.users.update({
      where: { user_id: userId },
      data: {
        password_hash: newPasswordHash,
        updated_at: new Date(),
      },
    });

    logger.info(`用户密码修改成功: ${userId}`);
  }

  /**
   * 获取下载历史
   */
  async getDownloadHistory(userId: string, pageNum: number, pageSize: number) {
    const skip = (pageNum - 1) * pageSize;

    // 获取总数
    const total = await prisma.download_history.count({
      where: { user_id: userId },
    });

    // 获取下载历史列表
    const records = await prisma.download_history.findMany({
      where: { user_id: userId },
      include: {
        resources: {
          select: {
            resource_id: true,
            title: true,
            cover: true,
            file_size: true,
            download_count: true,
            vip_level: true,
            categories: {
              select: {
                category_id: true,
                category_name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    });

    // 格式化返回数据
    const list = records.map((record) => ({
      downloadId: record.download_id,
      resourceId: record.resource_id,
      downloadedAt: record.created_at,
      resource: record.resources
        ? {
            resourceId: record.resources.resource_id,
            title: record.resources.title,
            coverImage: record.resources.cover,
            fileSize: record.resources.file_size?.toString() || '0', // 将BigInt转换为字符串
            downloadCount: record.resources.download_count,
            vipLevel: record.resources.vip_level,
            category: record.resources.categories
              ? {
                  categoryId: record.resources.categories.category_id,
                  name: record.resources.categories.category_name,
                }
              : null,
          }
        : null,
    }));

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取上传历史
   */
  async getUploadHistory(userId: string, pageNum: number, pageSize: number) {
    const skip = (pageNum - 1) * pageSize;

    // 获取总数
    const total = await prisma.resources.count({
      where: { user_id: userId },
    });

    // 获取上传资源列表
    const records = await prisma.resources.findMany({
      where: { user_id: userId },
      include: {
        categories: {
          select: {
            category_id: true,
            category_name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    });

    // 格式化返回数据
    const list = records.map((record) => ({
      resourceId: record.resource_id,
      title: record.title,
      coverImage: record.cover,
      fileSize: record.file_size,
      downloadCount: record.download_count,
      viewCount: record.view_count,
      vipLevel: record.vip_level,
      status: record.status,
      auditStatus: record.audit_status,
      createdAt: record.created_at,
      category: record.categories
        ? {
            categoryId: record.categories.category_id,
            name: record.categories.category_name,
          }
        : null,
    }));

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取VIP信息
   */
  async getVIPInfo(userId: string) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        vip_level: true,
        vip_expire_at: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 判断VIP是否过期
    const now = new Date();
    const isVIP = user.vip_level > 0 && user.vip_expire_at && user.vip_expire_at > now;

    return {
      vipLevel: user.vip_level,
      vipExpireAt: user.vip_expire_at,
      isVIP,
      daysRemaining: isVIP && user.vip_expire_at
        ? Math.ceil((user.vip_expire_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    };
  }

  /**
   * 格式化用户信息
   */
  private formatUserInfo(user: {
    user_id: string;
    phone: string;
    nickname: string | null;
    avatar: string | null;
    email: string | null;
    bio: string | null;
    vip_level: number;
    vip_expire_at: Date | null;
    points_balance: number;
    points_total: number;
    user_level: number;
    status: number;
    created_at: Date;
    last_login_at: Date | null;
    roles: { role_code: string } | null;
  }): UserInfoResponse {
    return {
      userId: user.user_id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      bio: user.bio,
      vipLevel: user.vip_level,
      vipExpireAt: user.vip_expire_at,
      roleCode: user.roles?.role_code || 'user',
      pointsBalance: user.points_balance,
      pointsTotal: user.points_total,
      userLevel: user.user_level,
      status: user.status,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    };
  }

  /**
   * 验证昵称
   */
  private validateNickname(nickname: string): boolean {
    return nickname.length >= 2 && nickname.length <= 50;
  }

  /**
   * 验证邮箱格式
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证密码强度
   */
  private validatePassword(password: string): boolean {
    return password.length >= 6;
  }
}

export const userService = new UserService();
export default userService;
