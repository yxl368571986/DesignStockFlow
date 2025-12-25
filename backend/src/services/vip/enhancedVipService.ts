/**
 * 增强的VIP服务
 * 处理VIP状态管理、权限校验、到期处理
 */

import { PrismaClient } from '@prisma/client';
import { getPaymentConfig } from '../../config/payment';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

// VIP图标状态
export enum VipIconStatus {
  NONE = 'none',                     // 无图标
  ACTIVE = 'active',                 // 金色图标
  ACTIVE_LIFETIME = 'active_lifetime', // 金色图标+终身标签
  GRACE_PERIOD = 'grace_period'      // 灰色图标（7天宽限期）
}

// VIP特权
export interface VipPrivilege {
  code: string;
  name: string;
  description: string;
  value: string;
}

// 用户VIP信息
export interface UserVipInfo {
  userId: string;
  vipLevel: number;
  isVip: boolean;
  isLifetime: boolean;
  expireAt: Date | null;
  daysRemaining: number;
  iconStatus: VipIconStatus;
  privileges: VipPrivilege[];
  activatedAt: Date | null;
}

// VIP激活结果
export interface VipActivationResult {
  success: boolean;
  vipLevel: number;
  expireAt: Date | null;
  isLifetime: boolean;
  isRenewal: boolean;
  previousExpireAt: Date | null;
}

class EnhancedVipService {
  /**
   * 获取用户VIP信息
   */
  async getUserVipInfo(userId: string): Promise<UserVipInfo> {
    const config = getPaymentConfig();

    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        vip_level: true,
        vip_expire_at: true,
        is_lifetime_vip: true,
        vip_activated_at: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const now = new Date();
    const isLifetime = user.is_lifetime_vip;
    let isVip = false;
    let daysRemaining = 0;
    let iconStatus = VipIconStatus.NONE;

    if (isLifetime) {
      // 终身会员
      isVip = true;
      daysRemaining = -1; // -1 表示永久
      iconStatus = VipIconStatus.ACTIVE_LIFETIME;
    } else if (user.vip_expire_at) {
      const expireTime = user.vip_expire_at.getTime();
      const nowTime = now.getTime();
      const gracePeriodEnd = expireTime + config.vip.gracePeriodDays * 24 * 60 * 60 * 1000;

      if (nowTime < expireTime) {
        // VIP有效期内
        isVip = true;
        daysRemaining = Math.ceil((expireTime - nowTime) / (24 * 60 * 60 * 1000));
        iconStatus = VipIconStatus.ACTIVE;
      } else if (nowTime < gracePeriodEnd) {
        // 宽限期内
        isVip = false;
        daysRemaining = 0;
        iconStatus = VipIconStatus.GRACE_PERIOD;
      } else {
        // 已过期
        isVip = false;
        daysRemaining = 0;
        iconStatus = VipIconStatus.NONE;
      }
    }

    // 获取VIP特权
    const privileges = await this.getVipPrivileges();

    return {
      userId: user.user_id,
      vipLevel: user.vip_level,
      isVip,
      isLifetime,
      expireAt: user.vip_expire_at,
      daysRemaining,
      iconStatus,
      privileges: isVip ? privileges : [],
      activatedAt: user.vip_activated_at,
    };
  }

  /**
   * 获取VIP特权列表
   */
  async getVipPrivileges(): Promise<VipPrivilege[]> {
    const privileges = await prisma.vip_privileges.findMany({
      where: { is_enabled: true },
      orderBy: { sort_order: 'asc' },
    });

    return privileges.map(p => ({
      code: p.privilege_code,
      name: p.privilege_name,
      description: p.description || '',
      value: p.privilege_value,
    }));
  }

  /**
   * 开通/续费VIP
   */
  async activateVip(userId: string, packageId: string, orderId: string): Promise<VipActivationResult> {
    // 获取套餐信息
    const pkg = await prisma.vip_packages.findUnique({
      where: { package_id: packageId },
    });

    if (!pkg) {
      throw new Error('VIP套餐不存在');
    }

    // 获取用户信息
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const now = new Date();
    const previousExpireAt = user.vip_expire_at;
    const isRenewal = Boolean(user.vip_level > 0 && user.vip_expire_at && user.vip_expire_at > now);
    const isLifetimePackage = pkg.duration_days === -1 || pkg.package_code === 'lifetime';

    let expireAt: Date | null = null;

    if (isLifetimePackage) {
      // 终身会员
      expireAt = null;
    } else if (isRenewal && user.vip_expire_at) {
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
        is_lifetime_vip: isLifetimePackage,
        vip_activated_at: user.vip_activated_at || now,
        updated_at: now,
      },
    });

    logger.info(`用户 ${userId} VIP开通成功，套餐: ${pkg.package_name}, 到期时间: ${expireAt || '终身'}`);

    return {
      success: true,
      vipLevel: 1,
      expireAt,
      isLifetime: isLifetimePackage,
      isRenewal,
      previousExpireAt,
    };
  }

  /**
   * 检查VIP状态
   */
  async checkVipStatus(userId: string): Promise<{
    isVip: boolean;
    isLifetime: boolean;
    expireAt: Date | null;
    inGracePeriod: boolean;
  }> {
    const config = getPaymentConfig();

    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: {
        vip_level: true,
        vip_expire_at: true,
        is_lifetime_vip: true,
      },
    });

    if (!user) {
      return { isVip: false, isLifetime: false, expireAt: null, inGracePeriod: false };
    }

    if (user.is_lifetime_vip) {
      return { isVip: true, isLifetime: true, expireAt: null, inGracePeriod: false };
    }

    if (!user.vip_expire_at) {
      return { isVip: false, isLifetime: false, expireAt: null, inGracePeriod: false };
    }

    const now = new Date();
    const expireTime = user.vip_expire_at.getTime();
    const nowTime = now.getTime();
    const gracePeriodEnd = expireTime + config.vip.gracePeriodDays * 24 * 60 * 60 * 1000;

    if (nowTime < expireTime) {
      return { isVip: true, isLifetime: false, expireAt: user.vip_expire_at, inGracePeriod: false };
    } else if (nowTime < gracePeriodEnd) {
      return { isVip: false, isLifetime: false, expireAt: user.vip_expire_at, inGracePeriod: true };
    }

    return { isVip: false, isLifetime: false, expireAt: user.vip_expire_at, inGracePeriod: false };
  }

  /**
   * 取消VIP（退款时调用）
   */
  async revokeVip(userId: string, _orderId: string): Promise<void> {
    // 获取订单信息
    const order = await prisma.orders.findUnique({
      where: { order_id: _orderId },
      include: {
        vip_orders: {
          include: {
            vip_packages: true,
          },
        },
      },
    });

    if (!order || !order.vip_orders[0]) {
      throw new Error('订单不存在');
    }

    const vipOrder = order.vip_orders[0];
    const pkg = vipOrder.vip_packages;

    if (!pkg) {
      throw new Error('套餐信息不存在');
    }

    // 获取用户信息
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 如果是终身会员，直接取消
    if (user.is_lifetime_vip && (pkg.duration_days === -1 || pkg.package_code === 'lifetime')) {
      await prisma.users.update({
        where: { user_id: userId },
        data: {
          vip_level: 0,
          vip_expire_at: null,
          is_lifetime_vip: false,
          updated_at: new Date(),
        },
      });
    } else if (user.vip_expire_at) {
      // 普通VIP，减去套餐天数
      const newExpireAt = new Date(user.vip_expire_at);
      newExpireAt.setDate(newExpireAt.getDate() - pkg.duration_days);

      const now = new Date();
      if (newExpireAt <= now) {
        // 减去后已过期，取消VIP
        await prisma.users.update({
          where: { user_id: userId },
          data: {
            vip_level: 0,
            vip_expire_at: null,
            updated_at: new Date(),
          },
        });
      } else {
        // 减去后仍有效，更新到期时间
        await prisma.users.update({
          where: { user_id: userId },
          data: {
            vip_expire_at: newExpireAt,
            updated_at: new Date(),
          },
        });
      }
    }

    logger.info(`用户 ${userId} VIP已取消，订单: ${_orderId}`);
  }

  /**
   * 获取VIP图标状态
   */
  async getVipIconStatus(userId: string): Promise<VipIconStatus> {
    const vipInfo = await this.getUserVipInfo(userId);
    return vipInfo.iconStatus;
  }

  /**
   * 检查是否终身会员
   */
  async isLifetimeMember(userId: string): Promise<boolean> {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { is_lifetime_vip: true },
    });

    return user?.is_lifetime_vip || false;
  }

  /**
   * 获取即将到期的VIP用户
   */
  async getExpiringUsers(daysUntilExpiry: number): Promise<Array<{
    userId: string;
    nickname: string | null;
    phone: string;
    expireAt: Date;
    daysRemaining: number;
  }>> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysUntilExpiry);

    // 设置时间范围为目标日期的整天
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const users = await prisma.users.findMany({
      where: {
        vip_level: { gt: 0 },
        is_lifetime_vip: false,
        vip_expire_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        user_id: true,
        nickname: true,
        phone: true,
        vip_expire_at: true,
      },
    });

    return users.map(user => ({
      userId: user.user_id,
      nickname: user.nickname,
      phone: user.phone,
      expireAt: user.vip_expire_at!,
      daysRemaining: daysUntilExpiry,
    }));
  }

  /**
   * 获取已过期超过指定天数的用户
   */
  async getExpiredUsers(daysAfterExpiry: number): Promise<Array<{
    userId: string;
    expireAt: Date;
  }>> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAfterExpiry);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const users = await prisma.users.findMany({
      where: {
        vip_level: { gt: 0 },
        is_lifetime_vip: false,
        vip_expire_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        user_id: true,
        vip_expire_at: true,
      },
    });

    return users.map(user => ({
      userId: user.user_id,
      expireAt: user.vip_expire_at!,
    }));
  }

  /**
   * 积分兑换VIP
   */
  async exchangePointsForVip(userId: string, months: number): Promise<{
    success: boolean;
    pointsCost: number;
    vipDaysGranted: number;
    newExpireAt: Date | null;
  }> {
    const config = getPaymentConfig();

    // 检查兑换月数限制
    if (months < 1 || months > config.pointsExchange.maxExchangeMonths) {
      throw new Error(`兑换月数必须在1-${config.pointsExchange.maxExchangeMonths}之间`);
    }

    // 获取用户信息
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查是否为终身会员
    if (user.is_lifetime_vip) {
      throw new Error('终身会员无需兑换');
    }

    // 计算所需积分
    const pointsCost = config.pointsExchange.pointsPerMonth * months;

    // 检查积分余额
    if (user.points_balance < pointsCost) {
      throw new Error('积分不足');
    }

    // 检查本月是否已兑换
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const existingExchange = await prisma.points_vip_exchanges.findFirst({
      where: {
        user_id: userId,
        exchange_month: currentMonth,
      },
    });

    if (existingExchange) {
      throw new Error('本月已兑换过VIP，每月限兑换1次');
    }

    // 计算VIP天数（每月按30天计算）
    const vipDays = months * 30;

    // 计算新的到期时间
    const now = new Date();
    let newExpireAt: Date;

    if (user.vip_expire_at && user.vip_expire_at > now) {
      newExpireAt = new Date(user.vip_expire_at);
      newExpireAt.setDate(newExpireAt.getDate() + vipDays);
    } else {
      newExpireAt = new Date();
      newExpireAt.setDate(newExpireAt.getDate() + vipDays);
    }

    // 获取积分兑换套餐（如果有）
    const exchangePackage = await prisma.vip_packages.findFirst({
      where: { package_code: 'points_exchange' },
    });

    // 执行兑换
    await prisma.$transaction(async (tx) => {
      // 扣除积分
      await tx.users.update({
        where: { user_id: userId },
        data: {
          points_balance: { decrement: pointsCost },
          vip_level: 1,
          vip_expire_at: newExpireAt,
          vip_activated_at: user.vip_activated_at || now,
          updated_at: now,
        },
      });

      // 记录积分变动
      await tx.points_records.create({
        data: {
          user_id: userId,
          points_change: -pointsCost,
          points_balance: user.points_balance - pointsCost,
          change_type: 'exchange',
          source: 'vip_exchange',
          description: `积分兑换VIP ${months}个月`,
        },
      });

      // 记录兑换记录
      await tx.points_vip_exchanges.create({
        data: {
          user_id: userId,
          package_id: exchangePackage?.package_id || 'points_exchange',
          points_cost: pointsCost,
          exchange_month: currentMonth,
          vip_days_granted: vipDays,
          status: 1,
        },
      });
    });

    logger.info(`用户 ${userId} 积分兑换VIP成功，消耗 ${pointsCost} 积分，获得 ${vipDays} 天VIP`);

    return {
      success: true,
      pointsCost,
      vipDaysGranted: vipDays,
      newExpireAt,
    };
  }

  /**
   * 获取用户积分兑换信息
   */
  async getPointsExchangeInfo(userId: string): Promise<{
    pointsBalance: number;
    pointsPerMonth: number;
    maxExchangeMonths: number;
    hasExchangedThisMonth: boolean;
    lastExchangeDate: Date | null;
  }> {
    const config = getPaymentConfig();

    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { points_balance: true },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查本月是否已兑换
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const lastExchange = await prisma.points_vip_exchanges.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    const hasExchangedThisMonth = lastExchange?.exchange_month.getTime() === currentMonth.getTime();

    return {
      pointsBalance: user.points_balance,
      pointsPerMonth: config.pointsExchange.pointsPerMonth,
      maxExchangeMonths: config.pointsExchange.maxExchangeMonths,
      hasExchangedThisMonth,
      lastExchangeDate: lastExchange?.created_at || null,
    };
  }
}

export const enhancedVipService = new EnhancedVipService();
export default enhancedVipService;
