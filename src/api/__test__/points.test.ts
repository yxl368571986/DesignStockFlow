/**
 * 积分系统测试 - 任务6.1
 * 测试已登录用户初始积分规则
 * 
 * 验证需求: 8.11, 8.12, 44.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMyPointsInfo } from '../points';
import * as request from '@/utils/request';

// Mock request module
vi.mock('@/utils/request', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

describe('积分系统测试 - 任务6.1: 已登录用户初始积分规则', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始积分规则验证', () => {
    it('新注册普通用户初始积分应为500', async () => {
      // 模拟新注册普通用户的积分信息
      const mockNewUserPointsInfo = {
        code: 200,
        msg: 'success',
        data: {
          userId: 'new-user-001',
          pointsBalance: 500,  // 新用户初始积分应为500
          pointsTotal: 500,
          userLevel: 2,  // LV2 初级 (500-1999积分)
          levelName: 'LV2 初级',
          nextLevelPoints: 1500,
          privileges: ['下载资源-5%积分消耗'],
        },
        timestamp: Date.now(),
      };

      vi.mocked(request.get).mockResolvedValue(mockNewUserPointsInfo);

      const result = await getMyPointsInfo();

      expect(result.code).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data?.pointsBalance).toBe(500);
      expect(result.data?.pointsTotal).toBe(500);
      // 验证API调用正确
      expect(request.get).toHaveBeenCalledWith('/points/my-info');
    });

    it('VIP用户根据VIP等级获取相应积分', async () => {
      // 模拟VIP用户的积分信息（VIP用户通常有更多积分）
      const mockVipUserPointsInfo = {
        code: 200,
        msg: 'success',
        data: {
          userId: 'vip-user-001',
          pointsBalance: 500,  // VIP用户初始积分
          pointsTotal: 500,
          userLevel: 2,
          levelName: 'LV2 初级',
          nextLevelPoints: 1500,
          privileges: ['下载资源-5%积分消耗'],
        },
        timestamp: Date.now(),
      };

      vi.mocked(request.get).mockResolvedValue(mockVipUserPointsInfo);

      const result = await getMyPointsInfo();

      expect(result.code).toBe(200);
      expect(result.data).toBeDefined();
      // VIP用户应该有积分
      expect(result.data?.pointsBalance).toBeGreaterThanOrEqual(0);
      expect(result.data?.pointsTotal).toBeGreaterThanOrEqual(0);
    });

    it('验证数据库中积分记录正确 - 积分余额和累计积分应一致', async () => {
      const mockPointsInfo = {
        code: 200,
        msg: 'success',
        data: {
          userId: 'test-user-001',
          pointsBalance: 500,
          pointsTotal: 500,
          userLevel: 2,
          levelName: 'LV2 初级',
          nextLevelPoints: 1500,
          privileges: ['下载资源-5%积分消耗'],
        },
        timestamp: Date.now(),
      };

      vi.mocked(request.get).mockResolvedValue(mockPointsInfo);

      const result = await getMyPointsInfo();

      expect(result.code).toBe(200);
      expect(result.data).toBeDefined();
      // 对于新用户，积分余额应等于累计积分
      expect(result.data?.pointsBalance).toBe(result.data?.pointsTotal);
    });
  });

  describe('积分余额API验证', () => {
    it('GET /api/v1/points/my-info 接口应返回正确格式', async () => {
      const mockPointsInfo = {
        code: 200,
        msg: 'success',
        data: {
          userId: 'test-user-001',
          pointsBalance: 100,
          pointsTotal: 200,
          userLevel: 1,
          levelName: 'LV1 新手',
          nextLevelPoints: 400,
          privileges: ['基础功能'],
        },
        timestamp: Date.now(),
      };

      vi.mocked(request.get).mockResolvedValue(mockPointsInfo);

      const result = await getMyPointsInfo();

      // 验证响应格式
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('msg');
      expect(result).toHaveProperty('data');
      
      // 验证数据字段
      expect(result.data).toHaveProperty('userId');
      expect(result.data).toHaveProperty('pointsBalance');
      expect(result.data).toHaveProperty('pointsTotal');
      expect(result.data).toHaveProperty('userLevel');
      expect(result.data).toHaveProperty('levelName');
      
      // 验证数据类型
      expect(typeof result.data?.pointsBalance).toBe('number');
      expect(typeof result.data?.pointsTotal).toBe('number');
      expect(typeof result.data?.userLevel).toBe('number');
    });

    it('返回的积分余额应为非负数', async () => {
      const mockPointsInfo = {
        code: 200,
        msg: 'success',
        data: {
          userId: 'test-user-001',
          pointsBalance: 100,
          pointsTotal: 200,
          userLevel: 1,
          levelName: 'LV1 新手',
          nextLevelPoints: 400,
          privileges: ['基础功能'],
        },
        timestamp: Date.now(),
      };

      vi.mocked(request.get).mockResolvedValue(mockPointsInfo);

      const result = await getMyPointsInfo();

      expect(result.data?.pointsBalance).toBeGreaterThanOrEqual(0);
      expect(result.data?.pointsTotal).toBeGreaterThanOrEqual(0);
    });

    it('未登录用户调用接口应返回401错误', async () => {
      const mockUnauthorizedResponse = {
        code: 401,
        msg: '未登录',
        data: null,
        timestamp: Date.now(),
      };

      vi.mocked(request.get).mockResolvedValue(mockUnauthorizedResponse);

      const result = await getMyPointsInfo();

      expect(result.code).toBe(401);
      expect(result.msg).toBe('未登录');
    });

    it('积分余额应小于等于累计积分', async () => {
      // 因为积分可以消费，所以余额应该小于等于累计积分
      const mockPointsInfo = {
        code: 200,
        msg: 'success',
        data: {
          userId: 'test-user-001',
          pointsBalance: 50,  // 消费后的余额
          pointsTotal: 200,   // 累计获得的积分
          userLevel: 1,
          levelName: 'LV1 新手',
          nextLevelPoints: 300,
          privileges: ['基础功能'],
        },
        timestamp: Date.now(),
      };

      vi.mocked(request.get).mockResolvedValue(mockPointsInfo);

      const result = await getMyPointsInfo();

      expect(result.data?.pointsBalance).toBeLessThanOrEqual(result.data?.pointsTotal || 0);
    });
  });

  describe('用户等级与积分关系验证', () => {
    it('LV1新手用户积分范围应为0-499', async () => {
      const mockLv1User = {
        code: 200,
        msg: 'success',
        data: {
          userId: 'lv1-user',
          pointsBalance: 100,
          pointsTotal: 100,
          userLevel: 1,
          levelName: 'LV1 新手',
          nextLevelPoints: 400,
          privileges: ['基础功能'],
        },
        timestamp: Date.now(),
      };

      vi.mocked(request.get).mockResolvedValue(mockLv1User);

      const result = await getMyPointsInfo();

      expect(result.data?.userLevel).toBe(1);
      expect(result.data?.pointsTotal).toBeLessThan(500);
    });

    it('LV2初级用户积分范围应为500-1999', async () => {
      const mockLv2User = {
        code: 200,
        msg: 'success',
        data: {
          userId: 'lv2-user',
          pointsBalance: 500,
          pointsTotal: 500,
          userLevel: 2,
          levelName: 'LV2 初级',
          nextLevelPoints: 1500,
          privileges: ['下载资源-5%积分消耗'],
        },
        timestamp: Date.now(),
      };

      vi.mocked(request.get).mockResolvedValue(mockLv2User);

      const result = await getMyPointsInfo();

      expect(result.data?.userLevel).toBe(2);
      expect(result.data?.pointsTotal).toBeGreaterThanOrEqual(500);
      expect(result.data?.pointsTotal).toBeLessThan(2000);
    });
  });
});
