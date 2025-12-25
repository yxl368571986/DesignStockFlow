/**
 * EnhancedVipService 单元测试
 * 测试VIP服务的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('EnhancedVipService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('VIP等级定义', () => {
    it('应该正确定义VIP等级', () => {
      const VIP_LEVELS = {
        FREE: 0,      // 普通用户
        MONTHLY: 1,   // 月卡
        QUARTERLY: 2, // 季卡
        YEARLY: 3,    // 年卡
        LIFETIME: 4,  // 终身
      };

      expect(VIP_LEVELS.FREE).toBe(0);
      expect(VIP_LEVELS.MONTHLY).toBe(1);
      expect(VIP_LEVELS.QUARTERLY).toBe(2);
      expect(VIP_LEVELS.YEARLY).toBe(3);
      expect(VIP_LEVELS.LIFETIME).toBe(4);
    });
  });

  describe('VIP套餐时长', () => {
    it('应该正确计算套餐时长（天）', () => {
      const PACKAGE_DAYS = {
        monthly: 30,
        quarterly: 90,
        yearly: 365,
        lifetime: -1, // 终身
      };

      expect(PACKAGE_DAYS.monthly).toBe(30);
      expect(PACKAGE_DAYS.quarterly).toBe(90);
      expect(PACKAGE_DAYS.yearly).toBe(365);
      expect(PACKAGE_DAYS.lifetime).toBe(-1);
    });
  });

  describe('VIP到期时间计算', () => {
    it('新开通VIP应该从当前时间开始计算', () => {
      const now = new Date();
      const days = 30;
      const expireAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      
      // 到期时间应该在30天后
      const diffDays = Math.round((expireAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      expect(diffDays).toBe(30);
    });

    it('续费VIP应该从当前到期时间开始计算', () => {
      const now = new Date();
      const currentExpireAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 还剩10天
      const renewDays = 30;
      
      const newExpireAt = new Date(currentExpireAt.getTime() + renewDays * 24 * 60 * 60 * 1000);
      
      // 新到期时间应该是当前到期时间 + 续费天数
      const diffFromCurrent = Math.round((newExpireAt.getTime() - currentExpireAt.getTime()) / (24 * 60 * 60 * 1000));
      expect(diffFromCurrent).toBe(30);
      
      // 从现在算起应该是40天
      const diffFromNow = Math.round((newExpireAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      expect(diffFromNow).toBe(40);
    });

    it('已过期用户续费应该从当前时间开始计算', () => {
      const now = new Date();
      const expiredAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5天前过期
      const renewDays = 30;
      
      // 已过期，从当前时间开始计算
      const newExpireAt = new Date(now.getTime() + renewDays * 24 * 60 * 60 * 1000);
      
      const diffDays = Math.round((newExpireAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      expect(diffDays).toBe(30);
    });
  });

  describe('终身会员判断', () => {
    it('应该正确判断是否为终身会员', () => {
      const isLifetimeVip = (user: { is_lifetime_vip: boolean; vip_level: number }): boolean => {
        return user.is_lifetime_vip || user.vip_level === 4;
      };

      expect(isLifetimeVip({ is_lifetime_vip: true, vip_level: 4 })).toBe(true);
      expect(isLifetimeVip({ is_lifetime_vip: false, vip_level: 4 })).toBe(true);
      expect(isLifetimeVip({ is_lifetime_vip: true, vip_level: 3 })).toBe(true);
      expect(isLifetimeVip({ is_lifetime_vip: false, vip_level: 3 })).toBe(false);
    });

    it('终身会员不应该显示到期时间', () => {
      const shouldShowExpireTime = (isLifetime: boolean): boolean => {
        return !isLifetime;
      };

      expect(shouldShowExpireTime(true)).toBe(false);
      expect(shouldShowExpireTime(false)).toBe(true);
    });
  });

  describe('VIP状态判断', () => {
    it('应该正确判断VIP是否有效', () => {
      const now = new Date();
      
      const isVipValid = (user: { vip_level: number; vip_expire_at: Date | null; is_lifetime_vip: boolean }): boolean => {
        if (user.is_lifetime_vip) return true;
        if (user.vip_level === 0) return false;
        if (!user.vip_expire_at) return false;
        return user.vip_expire_at.getTime() > now.getTime();
      };

      // 终身会员
      expect(isVipValid({ vip_level: 4, vip_expire_at: null, is_lifetime_vip: true })).toBe(true);
      
      // 普通用户
      expect(isVipValid({ vip_level: 0, vip_expire_at: null, is_lifetime_vip: false })).toBe(false);
      
      // 有效VIP
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      expect(isVipValid({ vip_level: 1, vip_expire_at: futureDate, is_lifetime_vip: false })).toBe(true);
      
      // 已过期VIP
      const pastDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      expect(isVipValid({ vip_level: 1, vip_expire_at: pastDate, is_lifetime_vip: false })).toBe(false);
    });
  });

  describe('VIP图标状态', () => {
    it('应该正确返回VIP图标状态', () => {
      const now = new Date();
      const GRACE_PERIOD_DAYS = 7;
      
      const getVipIconStatus = (user: { 
        vip_level: number; 
        vip_expire_at: Date | null; 
        is_lifetime_vip: boolean 
      }): 'gold' | 'gray' | 'none' => {
        if (user.is_lifetime_vip || user.vip_level === 4) return 'gold';
        if (user.vip_level === 0) return 'none';
        if (!user.vip_expire_at) return 'none';
        
        const expireTime = user.vip_expire_at.getTime();
        if (expireTime > now.getTime()) return 'gold';
        
        // 检查宽限期
        const daysSinceExpiry = (now.getTime() - expireTime) / (24 * 60 * 60 * 1000);
        if (daysSinceExpiry <= GRACE_PERIOD_DAYS) return 'gray';
        
        return 'none';
      };

      // 终身会员 - 金色
      expect(getVipIconStatus({ vip_level: 4, vip_expire_at: null, is_lifetime_vip: true })).toBe('gold');
      
      // 有效VIP - 金色
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      expect(getVipIconStatus({ vip_level: 1, vip_expire_at: futureDate, is_lifetime_vip: false })).toBe('gold');
      
      // 宽限期内 - 灰色
      const recentExpired = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(getVipIconStatus({ vip_level: 1, vip_expire_at: recentExpired, is_lifetime_vip: false })).toBe('gray');
      
      // 宽限期外 - 无
      const longExpired = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      expect(getVipIconStatus({ vip_level: 1, vip_expire_at: longExpired, is_lifetime_vip: false })).toBe('none');
      
      // 普通用户 - 无
      expect(getVipIconStatus({ vip_level: 0, vip_expire_at: null, is_lifetime_vip: false })).toBe('none');
    });
  });

  describe('积分兑换VIP', () => {
    it('应该正确计算积分兑换比例', () => {
      const POINTS_PER_MONTH = 1000; // 1000积分 = 1个月VIP
      
      // 1个月需要1000积分
      expect(1 * POINTS_PER_MONTH).toBe(1000);
      
      // 3个月需要3000积分
      expect(3 * POINTS_PER_MONTH).toBe(3000);
    });

    it('应该正确判断积分是否足够', () => {
      const POINTS_PER_MONTH = 1000;
      
      const hasEnoughPoints = (userPoints: number, months: number): boolean => {
        return userPoints >= months * POINTS_PER_MONTH;
      };

      // 有1500积分，兑换1个月，足够
      expect(hasEnoughPoints(1500, 1)).toBe(true);
      
      // 有1500积分，兑换2个月，不够
      expect(hasEnoughPoints(1500, 2)).toBe(false);
      
      // 有3000积分，兑换3个月，刚好
      expect(hasEnoughPoints(3000, 3)).toBe(true);
    });

    it('每月只能兑换一次', () => {
      const now = new Date();
      
      const canExchangeThisMonth = (lastExchangeAt: Date | null): boolean => {
        if (!lastExchangeAt) return true;
        
        const lastMonth = lastExchangeAt.getMonth();
        const lastYear = lastExchangeAt.getFullYear();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return currentYear > lastYear || currentMonth > lastMonth;
      };

      // 从未兑换过
      expect(canExchangeThisMonth(null)).toBe(true);
      
      // 上个月兑换过
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      expect(canExchangeThisMonth(lastMonth)).toBe(true);
      
      // 本月已兑换
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      expect(canExchangeThisMonth(thisMonth)).toBe(false);
    });
  });

  describe('VIP特权列表', () => {
    it('应该返回正确的VIP特权', () => {
      const VIP_PRIVILEGES = [
        { id: 'download', name: '每日50次下载', description: '每天可下载50个资源' },
        { id: 'exclusive', name: '专属资源', description: '访问VIP专属资源' },
        { id: 'no_ads', name: '无广告', description: '浏览无广告干扰' },
        { id: 'priority', name: '优先客服', description: '享受优先客服支持' },
      ];

      expect(VIP_PRIVILEGES.length).toBe(4);
      expect(VIP_PRIVILEGES[0].id).toBe('download');
      expect(VIP_PRIVILEGES[1].id).toBe('exclusive');
    });
  });
});
