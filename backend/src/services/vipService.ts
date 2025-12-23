/**
 * VIP服务
 * 处理VIP套餐、特权、订单等业务逻辑
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

/**
 * VIP套餐服务
 */
export class VipPackageService {
  /**
   * 获取所有启用的VIP套餐
   */
  async getActivePackages() {
    try {
      const packages = await prisma.vip_packages.findMany({
        where: {
          status: 1,
        },
        orderBy: {
          sort_order: 'asc',
        },
      });

      return packages;
    } catch (error) {
      logger.error('获取VIP套餐列表失败:', error);
      throw new Error('获取VIP套餐列表失败');
    }
  }

  /**
   * 获取所有VIP套餐（管理员）
   */
  async getAllPackages() {
    try {
      const packages = await prisma.vip_packages.findMany({
        orderBy: {
          sort_order: 'asc',
        },
      });

      return packages;
    } catch (error) {
      logger.error('获取VIP套餐列表失败:', error);
      throw new Error('获取VIP套餐列表失败');
    }
  }

  /**
   * 获取VIP套餐详情
   */
  async getPackageById(packageId: string) {
    try {
      const pkg = await prisma.vip_packages.findUnique({
        where: { package_id: packageId },
      });

      if (!pkg) {
        throw new Error('VIP套餐不存在');
      }

      return pkg;
    } catch (error) {
      logger.error('获取VIP套餐详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建VIP套餐
   */
  async createPackage(data: {
    packageName: string;
    packageCode: string;
    durationDays: number;
    originalPrice: number;
    currentPrice: number;
    description?: string;
    sortOrder?: number;
    status?: number;
  }) {
    try {
      const existing = await prisma.vip_packages.findUnique({
        where: { package_code: data.packageCode },
      });

      if (existing) {
        throw new Error('套餐编码已存在');
      }

      const pkg = await prisma.vip_packages.create({
        data: {
          package_name: data.packageName,
          package_code: data.packageCode,
          duration_days: data.durationDays,
          original_price: data.originalPrice,
          current_price: data.currentPrice,
          description: data.description,
          sort_order: data.sortOrder || 0,
          status: data.status ?? 1,
        },
      });

      logger.info(`创建VIP套餐成功: ${pkg.package_id}`);
      return pkg;
    } catch (error) {
      logger.error('创建VIP套餐失败:', error);
      throw error;
    }
  }

  /**
   * 更新VIP套餐
   */
  async updatePackage(packageId: string, data: {
    packageName?: string;
    durationDays?: number;
    originalPrice?: number;
    currentPrice?: number;
    description?: string;
    sortOrder?: number;
    status?: number;
  }) {
    try {
      const pkg = await prisma.vip_packages.update({
        where: { package_id: packageId },
        data: {
          package_name: data.packageName,
          duration_days: data.durationDays,
          original_price: data.originalPrice,
          current_price: data.currentPrice,
          description: data.description,
          sort_order: data.sortOrder,
          status: data.status,
          updated_at: new Date(),
        },
      });

      logger.info(`更新VIP套餐成功: ${packageId}`);
      return pkg;
    } catch (error) {
      logger.error('更新VIP套餐失败:', error);
      throw error;
    }
  }

  /**
   * 删除VIP套餐
   */
  async deletePackage(packageId: string) {
    try {
      await prisma.vip_packages.delete({
        where: { package_id: packageId },
      });

      logger.info(`删除VIP套餐成功: ${packageId}`);
      return { success: true };
    } catch (error) {
      logger.error('删除VIP套餐失败:', error);
      throw error;
    }
  }
}

/**
 * VIP特权服务
 */
export class VipPrivilegeService {
  /**
   * 获取所有启用的VIP特权
   */
  async getActivePrivileges() {
    try {
      const privileges = await prisma.vip_privileges.findMany({
        where: {
          is_enabled: true,
        },
        orderBy: {
          sort_order: 'asc',
        },
      });

      return privileges;
    } catch (error) {
      logger.error('获取VIP特权列表失败:', error);
      throw new Error('获取VIP特权列表失败');
    }
  }

  /**
   * 获取所有VIP特权（管理员）
   */
  async getAllPrivileges() {
    try {
      const privileges = await prisma.vip_privileges.findMany({
        orderBy: {
          sort_order: 'asc',
        },
      });

      return privileges;
    } catch (error) {
      logger.error('获取VIP特权列表失败:', error);
      throw new Error('获取VIP特权列表失败');
    }
  }

  /**
   * 创建VIP特权
   */
  async createPrivilege(data: {
    privilegeName: string;
    privilegeCode: string;
    privilegeType: string;
    privilegeValue: string;
    description?: string;
    sortOrder?: number;
    isEnabled?: boolean;
  }) {
    try {
      const existing = await prisma.vip_privileges.findUnique({
        where: { privilege_code: data.privilegeCode },
      });

      if (existing) {
        throw new Error('特权编码已存在');
      }

      const privilege = await prisma.vip_privileges.create({
        data: {
          privilege_name: data.privilegeName,
          privilege_code: data.privilegeCode,
          privilege_type: data.privilegeType,
          privilege_value: data.privilegeValue,
          description: data.description,
          sort_order: data.sortOrder || 0,
          is_enabled: data.isEnabled ?? true,
        },
      });

      logger.info(`创建VIP特权成功: ${privilege.privilege_id}`);
      return privilege;
    } catch (error) {
      logger.error('创建VIP特权失败:', error);
      throw error;
    }
  }

  /**
   * 更新VIP特权
   */
  async updatePrivilege(privilegeId: string, data: {
    privilegeName?: string;
    privilegeType?: string;
    privilegeValue?: string;
    description?: string;
    sortOrder?: number;
    isEnabled?: boolean;
  }) {
    try {
      const privilege = await prisma.vip_privileges.update({
        where: { privilege_id: privilegeId },
        data: {
          privilege_name: data.privilegeName,
          privilege_type: data.privilegeType,
          privilege_value: data.privilegeValue,
          description: data.description,
          sort_order: data.sortOrder,
          is_enabled: data.isEnabled,
          updated_at: new Date(),
        },
      });

      logger.info(`更新VIP特权成功: ${privilegeId}`);
      return privilege;
    } catch (error) {
      logger.error('更新VIP特权失败:', error);
      throw error;
    }
  }

  /**
   * 删除VIP特权
   */
  async deletePrivilege(privilegeId: string) {
    try {
      await prisma.vip_privileges.delete({
        where: { privilege_id: privilegeId },
      });

      logger.info(`删除VIP特权成功: ${privilegeId}`);
      return { success: true };
    } catch (error) {
      logger.error('删除VIP特权失败:', error);
      throw error;
    }
  }
}

/**
 * 用户VIP服务
 */
export class UserVipService {
  /**
   * 获取用户VIP信息
   */
  async getUserVipInfo(userId: string) {
    try {
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

      const isVip = user.vip_level > 0 && user.vip_expire_at && user.vip_expire_at > new Date();

      return {
        vipLevel: user.vip_level,
        vipExpireAt: user.vip_expire_at,
        isVip,
      };
    } catch (error) {
      logger.error('获取用户VIP信息失败:', error);
      throw error;
    }
  }

  /**
   * 开通/续费VIP
   */
  async activateVip(userId: string, packageId: string) {
    try {
      const pkg = await prisma.vip_packages.findUnique({
        where: { package_id: packageId },
      });

      if (!pkg) {
        throw new Error('VIP套餐不存在');
      }

      if (pkg.status !== 1) {
        throw new Error('VIP套餐已下架');
      }

      const user = await prisma.users.findUnique({
        where: { user_id: userId },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 计算VIP到期时间
      const now = new Date();
      let expireAt: Date;

      if (user.vip_expire_at && user.vip_expire_at > now) {
        // 续费：在原有基础上延长
        expireAt = new Date(user.vip_expire_at);
        expireAt.setDate(expireAt.getDate() + pkg.duration_days);
      } else {
        // 新开通：从现在开始计算
        expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + pkg.duration_days);
      }

      // 更新用户VIP状态
      await prisma.users.update({
        where: { user_id: userId },
        data: {
          vip_level: 1,
          vip_expire_at: expireAt,
          updated_at: new Date(),
        },
      });

      logger.info(`用户 ${userId} VIP开通成功，到期时间: ${expireAt}`);

      return {
        vipLevel: 1,
        vipExpireAt: expireAt,
        isVip: true,
      };
    } catch (error) {
      logger.error('开通VIP失败:', error);
      throw error;
    }
  }

  /**
   * 检查VIP是否过期
   */
  async checkVipExpired(userId: string): Promise<boolean> {
    try {
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: {
          vip_level: true,
          vip_expire_at: true,
        },
      });

      if (!user) {
        return true;
      }

      if (user.vip_level === 0) {
        return true;
      }

      if (!user.vip_expire_at) {
        return true;
      }

      return user.vip_expire_at < new Date();
    } catch (error) {
      logger.error('检查VIP状态失败:', error);
      return true;
    }
  }
}

export const vipPackageService = new VipPackageService();
export const vipPrivilegeService = new VipPrivilegeService();
export const userVipService = new UserVipService();
