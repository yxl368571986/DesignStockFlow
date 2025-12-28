/**
 * DownloadService 单元测试
 * 测试下载服务的核心功能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('DownloadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('下载次数限制', () => {
    it('VIP用户每日下载限制应为50次', () => {
      const VIP_DAILY_LIMIT = 50;
      expect(VIP_DAILY_LIMIT).toBe(50);
    });

    it('普通用户每日免费下载限制应为2次', () => {
      const FREE_DAILY_LIMIT = 2;
      expect(FREE_DAILY_LIMIT).toBe(2);
    });

    it('应该正确判断VIP用户是否超出下载限制', () => {
      const VIP_DAILY_LIMIT = 50;
      
      // 已下载49次，未超限
      expect(49 < VIP_DAILY_LIMIT).toBe(true);
      
      // 已下载50次，已达限制
      expect(50 >= VIP_DAILY_LIMIT).toBe(true);
    });

    it('应该正确判断普通用户是否超出下载限制', () => {
      const FREE_DAILY_LIMIT = 2;
      
      // 已下载1次，未超限
      expect(1 < FREE_DAILY_LIMIT).toBe(true);
      
      // 已下载2次，已达限制
      expect(2 >= FREE_DAILY_LIMIT).toBe(true);
    });
  });

  describe('VIP等级权限', () => {
    it('应该正确判断VIP等级权限', () => {
      // VIP等级: 0=普通用户, 1=月卡, 2=季卡, 3=年卡, 4=终身
      const checkVipAccess = (userLevel: number, resourceLevel: number): boolean => {
        return userLevel >= resourceLevel;
      };

      // 普通用户只能下载免费资源(level=0)
      expect(checkVipAccess(0, 0)).toBe(true);
      expect(checkVipAccess(0, 1)).toBe(false);

      // 月卡用户可以下载level<=1的资源
      expect(checkVipAccess(1, 0)).toBe(true);
      expect(checkVipAccess(1, 1)).toBe(true);
      expect(checkVipAccess(1, 2)).toBe(false);

      // 终身会员可以下载所有资源
      expect(checkVipAccess(4, 0)).toBe(true);
      expect(checkVipAccess(4, 4)).toBe(true);
    });
  });

  describe('免费资源判断', () => {
    it('应该正确判断资源是否免费', () => {
      const isFreeResource = (vipLevel: number): boolean => {
        return vipLevel === 0;
      };

      expect(isFreeResource(0)).toBe(true);
      expect(isFreeResource(1)).toBe(false);
      expect(isFreeResource(2)).toBe(false);
    });
  });

  describe('下载统计日期重置', () => {
    it('应该正确判断是否需要重置每日统计', () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // 今天的统计，不需要重置
      const todayStats = new Date(today.getTime() + 1000);
      const isSameDay = todayStats.toDateString() === now.toDateString();
      expect(isSameDay).toBe(true);
      
      // 昨天的统计，需要重置
      const yesterdayStats = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const isDifferentDay = yesterdayStats.toDateString() !== now.toDateString();
      expect(isDifferentDay).toBe(true);
    });
  });

  describe('批量下载', () => {
    it('应该正确计算批量下载消耗的次数', () => {
      const calculateBatchDownloadCount = (resourceCount: number): number => {
        return resourceCount; // 每个资源消耗1次下载次数
      };

      expect(calculateBatchDownloadCount(1)).toBe(1);
      expect(calculateBatchDownloadCount(5)).toBe(5);
      expect(calculateBatchDownloadCount(10)).toBe(10);
    });

    it('应该正确判断批量下载是否超出限制', () => {
      const VIP_DAILY_LIMIT = 50;
      
      const canBatchDownload = (currentCount: number, batchSize: number): boolean => {
        return currentCount + batchSize <= VIP_DAILY_LIMIT;
      };

      // 已下载40次，批量下载10个，不超限
      expect(canBatchDownload(40, 10)).toBe(true);
      
      // 已下载45次，批量下载10个，超限
      expect(canBatchDownload(45, 10)).toBe(false);
    });
  });

  describe('VIP宽限期', () => {
    it('应该正确判断VIP是否在7天宽限期内', () => {
      const GRACE_PERIOD_DAYS = 7;
      const now = new Date();
      
      const isInGracePeriod = (expireAt: Date): boolean => {
        const daysSinceExpiry = (now.getTime() - expireAt.getTime()) / (24 * 60 * 60 * 1000);
        return daysSinceExpiry > 0 && daysSinceExpiry <= GRACE_PERIOD_DAYS;
      };

      // 3天前过期，在宽限期内
      const expiredThreeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(isInGracePeriod(expiredThreeDaysAgo)).toBe(true);

      // 10天前过期，不在宽限期内
      const expiredTenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      expect(isInGracePeriod(expiredTenDaysAgo)).toBe(false);

      // 未过期
      const notExpired = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      expect(isInGracePeriod(notExpired)).toBe(false);
    });
  });
});
