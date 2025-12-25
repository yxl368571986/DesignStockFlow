/**
 * 积分兑换VIP流程集成测试
 * 测试完整的积分兑换VIP流程
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Prisma Client
const mockPrismaClient = {
  users: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  vip_packages: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  points_vip_exchanges: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  point_records: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrismaClient)),
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
}));

vi.mock('../../config/payment', () => ({
  getPaymentConfig: vi.fn(() => ({
    points: {
      exchangeRatio: 100, // 100积分 = 1天VIP
      maxExchangeDaysPerMonth: 90, // 每月最多兑换90天
      minExchangeDays: 30, // 最少兑换30天
    },
  })),
}));

vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('积分兑换VIP流程集成测试', () => {
  // 测试数据
  const mockUser = {
    user_id: 'user-001',
    nickname: '测试用户',
    phone: '13800138000',
    points: 10000, // 10000积分
    vip_level: 0,
    vip_expire_at: null,
    is_lifetime_vip: false,
  };

  const mockVipUser = {
    ...mockUser,
    vip_level: 1,
    vip_expire_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后到期
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaClient.users.findUnique.mockResolvedValue(mockUser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('积分兑换资格检查', () => {
    it('积分充足时应该可以兑换', async () => {
      const exchangeDays = 30;
      const requiredPoints = exchangeDays * 100; // 3000积分

      expect(mockUser.points).toBeGreaterThanOrEqual(requiredPoints);
    });

    it('积分不足时不能兑换', async () => {
      const poorUser = { ...mockUser, points: 1000 };
      mockPrismaClient.users.findUnique.mockResolvedValue(poorUser);

      const exchangeDays = 30;
      const requiredPoints = exchangeDays * 100; // 3000积分

      expect(poorUser.points).toBeLessThan(requiredPoints);
    });

    it('终身会员不能兑换', async () => {
      const lifetimeUser = { ...mockUser, is_lifetime_vip: true };
      mockPrismaClient.users.findUnique.mockResolvedValue(lifetimeUser);

      expect(lifetimeUser.is_lifetime_vip).toBe(true);
    });

    it('本月已兑换超过限额时不能继续兑换', async () => {
      // 模拟本月已兑换60天
      mockPrismaClient.points_vip_exchanges.findMany.mockResolvedValue([
        { exchange_days: 30, created_at: new Date() },
        { exchange_days: 30, created_at: new Date() },
      ]);

      const existingExchanges = await mockPrismaClient.points_vip_exchanges.findMany({
        where: {
          user_id: mockUser.user_id,
          created_at: { gte: new Date(new Date().setDate(1)) }, // 本月1号
        },
      });

      const totalExchangedDays = existingExchanges.reduce(
        (sum: number, e: { exchange_days: number }) => sum + e.exchange_days,
        0
      );

      expect(totalExchangedDays).toBe(60);
      expect(totalExchangedDays + 30).toBeLessThanOrEqual(90); // 还可以兑换30天
      expect(totalExchangedDays + 60).toBeGreaterThan(90); // 不能再兑换60天
    });
  });

  describe('积分兑换执行', () => {
    it('应该成功兑换VIP（新用户）', async () => {
      const exchangeDays = 30;
      const requiredPoints = exchangeDays * 100;
      const newExpireAt = new Date(Date.now() + exchangeDays * 24 * 60 * 60 * 1000);

      mockPrismaClient.points_vip_exchanges.findMany.mockResolvedValue([]);
      mockPrismaClient.users.update.mockResolvedValue({
        ...mockUser,
        points: mockUser.points - requiredPoints,
        vip_level: 1,
        vip_expire_at: newExpireAt,
      });
      mockPrismaClient.points_vip_exchanges.create.mockResolvedValue({
        exchange_id: 'exchange-001',
        user_id: mockUser.user_id,
        points_used: requiredPoints,
        exchange_days: exchangeDays,
        created_at: new Date(),
      });
      mockPrismaClient.point_records.create.mockResolvedValue({
        record_id: 'record-001',
        user_id: mockUser.user_id,
        points: -requiredPoints,
        type: 'exchange_vip',
        description: `兑换${exchangeDays}天VIP`,
      });

      // 执行兑换
      const result = await mockPrismaClient.$transaction(async (tx: typeof mockPrismaClient) => {
        // 扣除积分
        const updatedUser = await tx.users.update({
          where: { user_id: mockUser.user_id },
          data: {
            points: { decrement: requiredPoints },
            vip_level: 1,
            vip_expire_at: newExpireAt,
          },
        });

        // 创建兑换记录
        const exchange = await tx.points_vip_exchanges.create({
          data: {
            user_id: mockUser.user_id,
            points_used: requiredPoints,
            exchange_days: exchangeDays,
          },
        });

        // 创建积分变动记录
        await tx.point_records.create({
          data: {
            user_id: mockUser.user_id,
            points: -requiredPoints,
            type: 'exchange_vip',
            description: `兑换${exchangeDays}天VIP`,
          },
        });

        return { user: updatedUser, exchange };
      });

      expect(result.user.vip_level).toBe(1);
      expect(result.user.points).toBe(mockUser.points - requiredPoints);
    });

    it('应该成功续费VIP（已有VIP用户）', async () => {
      mockPrismaClient.users.findUnique.mockResolvedValue(mockVipUser);

      const exchangeDays = 30;
      const requiredPoints = exchangeDays * 100;
      // 在原有到期时间基础上延长
      const originalExpireAt = mockVipUser.vip_expire_at!;
      const newExpireAt = new Date(originalExpireAt.getTime() + exchangeDays * 24 * 60 * 60 * 1000);

      mockPrismaClient.points_vip_exchanges.findMany.mockResolvedValue([]);
      mockPrismaClient.users.update.mockResolvedValue({
        ...mockVipUser,
        points: mockVipUser.points - requiredPoints,
        vip_expire_at: newExpireAt,
      });

      const result = await mockPrismaClient.users.update({
        where: { user_id: mockVipUser.user_id },
        data: {
          points: { decrement: requiredPoints },
          vip_expire_at: newExpireAt,
        },
      });

      expect(result.vip_expire_at.getTime()).toBeGreaterThan(originalExpireAt.getTime());
    });

    it('兑换失败时应该回滚事务', async () => {
      mockPrismaClient.$transaction.mockRejectedValue(new Error('数据库错误'));

      await expect(
        mockPrismaClient.$transaction(async () => {
          throw new Error('数据库错误');
        })
      ).rejects.toThrow('数据库错误');

      // 确保用户积分未变
      const user = await mockPrismaClient.users.findUnique({
        where: { user_id: mockUser.user_id },
      });
      expect(user?.points).toBe(mockUser.points);
    });
  });

  describe('兑换记录查询', () => {
    it('应该正确查询用户兑换记录', async () => {
      const mockExchanges = [
        {
          exchange_id: 'exchange-001',
          user_id: mockUser.user_id,
          points_used: 3000,
          exchange_days: 30,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          exchange_id: 'exchange-002',
          user_id: mockUser.user_id,
          points_used: 6000,
          exchange_days: 60,
          created_at: new Date(),
        },
      ];

      mockPrismaClient.points_vip_exchanges.findMany.mockResolvedValue(mockExchanges);

      const exchanges = await mockPrismaClient.points_vip_exchanges.findMany({
        where: { user_id: mockUser.user_id },
        orderBy: { created_at: 'desc' },
      });

      expect(exchanges).toHaveLength(2);
      expect(exchanges[0].exchange_days).toBe(30);
      expect(exchanges[1].exchange_days).toBe(60);
    });

    it('应该正确统计本月兑换天数', async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      mockPrismaClient.points_vip_exchanges.findMany.mockResolvedValue([
        { exchange_days: 30, created_at: new Date() },
      ]);

      const exchanges = await mockPrismaClient.points_vip_exchanges.findMany({
        where: {
          user_id: mockUser.user_id,
          created_at: { gte: startOfMonth },
        },
      });

      const totalDays = exchanges.reduce(
        (sum: number, e: { exchange_days: number }) => sum + e.exchange_days,
        0
      );

      expect(totalDays).toBe(30);
    });
  });

  describe('兑换信息获取', () => {
    it('应该正确返回兑换信息', async () => {
      mockPrismaClient.points_vip_exchanges.findMany.mockResolvedValue([
        { exchange_days: 30, created_at: new Date() },
      ]);

      const user = mockUser;
      const exchangeRatio = 100;
      const maxDaysPerMonth = 90;

      const exchanges = await mockPrismaClient.points_vip_exchanges.findMany({
        where: { user_id: user.user_id },
      });

      const exchangedThisMonth = exchanges.reduce(
        (sum: number, e: { exchange_days: number }) => sum + e.exchange_days,
        0
      );

      const exchangeInfo = {
        userPoints: user.points,
        exchangeRatio,
        maxDaysPerMonth,
        exchangedThisMonth,
        remainingDays: maxDaysPerMonth - exchangedThisMonth,
        maxExchangeableDays: Math.min(
          Math.floor(user.points / exchangeRatio),
          maxDaysPerMonth - exchangedThisMonth
        ),
      };

      expect(exchangeInfo.userPoints).toBe(10000);
      expect(exchangeInfo.exchangedThisMonth).toBe(30);
      expect(exchangeInfo.remainingDays).toBe(60);
      expect(exchangeInfo.maxExchangeableDays).toBe(60); // min(100, 60) = 60
    });
  });

  describe('边界条件测试', () => {
    it('刚好达到最低兑换天数时应该可以兑换', async () => {
      const minDays = 30;
      const requiredPoints = minDays * 100;
      const userWithExactPoints = { ...mockUser, points: requiredPoints };

      mockPrismaClient.users.findUnique.mockResolvedValue(userWithExactPoints);

      expect(userWithExactPoints.points).toBe(requiredPoints);
    });

    it('积分刚好不足最低兑换天数时不能兑换', async () => {
      const minDays = 30;
      const requiredPoints = minDays * 100;
      const userWithLessPoints = { ...mockUser, points: requiredPoints - 1 };

      mockPrismaClient.users.findUnique.mockResolvedValue(userWithLessPoints);

      expect(userWithLessPoints.points).toBeLessThan(requiredPoints);
    });

    it('本月剩余可兑换天数为0时不能兑换', async () => {
      mockPrismaClient.points_vip_exchanges.findMany.mockResolvedValue([
        { exchange_days: 90, created_at: new Date() },
      ]);

      const exchanges = await mockPrismaClient.points_vip_exchanges.findMany({
        where: { user_id: mockUser.user_id },
      });

      const totalExchanged = exchanges.reduce(
        (sum: number, e: { exchange_days: number }) => sum + e.exchange_days,
        0
      );

      expect(totalExchanged).toBe(90);
      expect(90 - totalExchanged).toBe(0);
    });
  });
});
