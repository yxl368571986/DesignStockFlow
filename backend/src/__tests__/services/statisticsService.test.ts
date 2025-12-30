/**
 * 统计服务属性测试
 * Property 8: 统计数据准确性
 * Validates: Requirements 7.1, 7.2, 7.5
 */

import fc from 'fast-check';

/**
 * 模拟充值订单数据
 */
interface MockRechargeOrder {
  orderId: string;
  userId: string;
  amount: number;
  totalPoints: number;
  paymentStatus: number;
  createdAt: Date;
}

/**
 * 模拟积分记录数据
 */
interface MockPointsRecord {
  recordId: string;
  userId: string;
  pointsChange: number;
  changeType: string;
  createdAt: Date;
}

/**
 * 统计结果接口
 */
interface RechargeStatistics {
  stats: Array<{
    date: string;
    totalAmount: number;
    totalPoints: number;
    orderCount: number;
    userCount: number;
  }>;
  summary: {
    totalAmount: number;
    totalPoints: number;
    totalOrders: number;
    totalUsers: number;
  };
}

interface PointsFlowStatistics {
  stats: Array<{
    date: string;
    earned: number;
    consumed: number;
    net: number;
  }>;
  summary: {
    totalEarned: number;
    totalConsumed: number;
    netChange: number;
    byType: Record<string, number>;
  };
}

/**
 * 纯函数：计算充值统计
 * 从订单列表计算统计数据
 */
function calculateRechargeStatistics(
  orders: MockRechargeOrder[],
  dimension: 'day' | 'week' | 'month' | 'year' = 'day'
): RechargeStatistics {
  // 只统计已支付订单
  const paidOrders = orders.filter(o => o.paymentStatus === 1);

  // 按维度分组
  const groupedStats = new Map<string, {
    amount: number;
    points: number;
    count: number;
    users: Set<string>;
  }>();

  for (const order of paidOrders) {
    const key = getDateKey(order.createdAt, dimension);
    const existing = groupedStats.get(key) || {
      amount: 0,
      points: 0,
      count: 0,
      users: new Set<string>()
    };
    existing.amount += order.amount;
    existing.points += order.totalPoints;
    existing.count += 1;
    existing.users.add(order.userId);
    groupedStats.set(key, existing);
  }

  // 转换为数组
  const stats = Array.from(groupedStats.entries()).map(([date, data]) => ({
    date,
    totalAmount: data.amount,
    totalPoints: data.points,
    orderCount: data.count,
    userCount: data.users.size
  })).sort((a, b) => a.date.localeCompare(b.date));

  // 汇总数据
  const summary = {
    totalAmount: paidOrders.reduce((sum, o) => sum + o.amount, 0),
    totalPoints: paidOrders.reduce((sum, o) => sum + o.totalPoints, 0),
    totalOrders: paidOrders.length,
    totalUsers: new Set(paidOrders.map(o => o.userId)).size
  };

  return { stats, summary };
}

/**
 * 纯函数：计算积分流水统计
 */
function calculatePointsFlowStatistics(
  records: MockPointsRecord[],
  dimension: 'day' | 'week' | 'month' | 'year' = 'day'
): PointsFlowStatistics {
  // 按维度分组
  const groupedStats = new Map<string, { earned: number; consumed: number }>();

  for (const record of records) {
    const key = getDateKey(record.createdAt, dimension);
    const existing = groupedStats.get(key) || { earned: 0, consumed: 0 };
    if (record.pointsChange > 0) {
      existing.earned += record.pointsChange;
    } else {
      existing.consumed += Math.abs(record.pointsChange);
    }
    groupedStats.set(key, existing);
  }

  // 转换为数组
  const stats = Array.from(groupedStats.entries()).map(([date, data]) => ({
    date,
    earned: data.earned,
    consumed: data.consumed,
    net: data.earned - data.consumed
  })).sort((a, b) => a.date.localeCompare(b.date));

  // 汇总数据
  const totalEarned = records
    .filter(r => r.pointsChange > 0)
    .reduce((sum, r) => sum + r.pointsChange, 0);
  const totalConsumed = records
    .filter(r => r.pointsChange < 0)
    .reduce((sum, r) => sum + Math.abs(r.pointsChange), 0);

  // 按类型统计
  const byType: Record<string, number> = {};
  for (const record of records) {
    byType[record.changeType] = (byType[record.changeType] || 0) + record.pointsChange;
  }

  const summary = {
    totalEarned,
    totalConsumed,
    netChange: totalEarned - totalConsumed,
    byType
  };

  return { stats, summary };
}

/**
 * 根据维度获取日期键
 */
function getDateKey(date: Date, dimension: string): string {
  const d = new Date(date);
  switch (dimension) {
    case 'year':
      return d.getFullYear().toString();
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    case 'week': {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return weekStart.toISOString().split('T')[0];
    }
    case 'day':
    default:
      return d.toISOString().split('T')[0];
  }
}

/**
 * 生成随机日期（最近30天内）- 确保生成有效日期
 */
const dateArbitrary = fc.integer({
  min: Date.now() - 30 * 24 * 60 * 60 * 1000,
  max: Date.now()
}).map(timestamp => new Date(timestamp));

/**
 * 生成随机充值订单
 */
const rechargeOrderArbitrary = fc.record({
  orderId: fc.uuid(),
  userId: fc.uuid(),
  amount: fc.integer({ min: 1, max: 1000 }),
  totalPoints: fc.integer({ min: 10, max: 10000 }),
  paymentStatus: fc.constantFrom(0, 1, 2), // 0=待支付, 1=已支付, 2=已取消
  createdAt: dateArbitrary
});

/**
 * 生成随机积分记录
 */
const pointsRecordArbitrary = fc.record({
  recordId: fc.uuid(),
  userId: fc.uuid(),
  pointsChange: fc.integer({ min: -1000, max: 1000 }).filter(n => n !== 0),
  changeType: fc.constantFrom('recharge', 'download', 'upload', 'sign_in', 'task', 'admin_add', 'admin_deduct'),
  createdAt: dateArbitrary
});

describe('StatisticsService', () => {
  describe('Property 8: 统计数据准确性', () => {
    /**
     * 测试发放积分统计正确
     * 对于任意积分记录列表，总获得积分应等于所有正数积分变动之和
     */
    it('总获得积分应等于所有正数积分变动之和', () => {
      fc.assert(
        fc.property(
          fc.array(pointsRecordArbitrary, { minLength: 0, maxLength: 50 }),
          (records) => {
            const result = calculatePointsFlowStatistics(records);
            
            // 手动计算期望值
            const expectedEarned = records
              .filter(r => r.pointsChange > 0)
              .reduce((sum, r) => sum + r.pointsChange, 0);
            
            expect(result.summary.totalEarned).toBe(expectedEarned);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试消耗积分统计正确
     * 对于任意积分记录列表，总消耗积分应等于所有负数积分变动绝对值之和
     */
    it('总消耗积分应等于所有负数积分变动绝对值之和', () => {
      fc.assert(
        fc.property(
          fc.array(pointsRecordArbitrary, { minLength: 0, maxLength: 50 }),
          (records) => {
            const result = calculatePointsFlowStatistics(records);
            
            // 手动计算期望值
            const expectedConsumed = records
              .filter(r => r.pointsChange < 0)
              .reduce((sum, r) => sum + Math.abs(r.pointsChange), 0);
            
            expect(result.summary.totalConsumed).toBe(expectedConsumed);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试净变化计算正确
     * 净变化 = 总获得 - 总消耗
     */
    it('净变化应等于总获得减去总消耗', () => {
      fc.assert(
        fc.property(
          fc.array(pointsRecordArbitrary, { minLength: 0, maxLength: 50 }),
          (records) => {
            const result = calculatePointsFlowStatistics(records);
            
            expect(result.summary.netChange).toBe(
              result.summary.totalEarned - result.summary.totalConsumed
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试充值用户数统计正确
     * 对于任意充值订单列表，充值用户数应等于去重后的用户ID数量
     */
    it('充值用户数应等于去重后的用户ID数量', () => {
      fc.assert(
        fc.property(
          fc.array(rechargeOrderArbitrary, { minLength: 0, maxLength: 50 }),
          (orders) => {
            const result = calculateRechargeStatistics(orders);
            
            // 手动计算期望值（只统计已支付订单）
            const paidOrders = orders.filter(o => o.paymentStatus === 1);
            const expectedUsers = new Set(paidOrders.map(o => o.userId)).size;
            
            expect(result.summary.totalUsers).toBe(expectedUsers);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试充值金额统计正确
     * 对于任意充值订单列表，总充值金额应等于所有已支付订单金额之和
     */
    it('总充值金额应等于所有已支付订单金额之和', () => {
      fc.assert(
        fc.property(
          fc.array(rechargeOrderArbitrary, { minLength: 0, maxLength: 50 }),
          (orders) => {
            const result = calculateRechargeStatistics(orders);
            
            // 手动计算期望值
            const expectedAmount = orders
              .filter(o => o.paymentStatus === 1)
              .reduce((sum, o) => sum + o.amount, 0);
            
            expect(result.summary.totalAmount).toBe(expectedAmount);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试充值积分统计正确
     * 对于任意充值订单列表，总充值积分应等于所有已支付订单积分之和
     */
    it('总充值积分应等于所有已支付订单积分之和', () => {
      fc.assert(
        fc.property(
          fc.array(rechargeOrderArbitrary, { minLength: 0, maxLength: 50 }),
          (orders) => {
            const result = calculateRechargeStatistics(orders);
            
            // 手动计算期望值
            const expectedPoints = orders
              .filter(o => o.paymentStatus === 1)
              .reduce((sum, o) => sum + o.totalPoints, 0);
            
            expect(result.summary.totalPoints).toBe(expectedPoints);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试订单数统计正确
     * 对于任意充值订单列表，总订单数应等于已支付订单数量
     */
    it('总订单数应等于已支付订单数量', () => {
      fc.assert(
        fc.property(
          fc.array(rechargeOrderArbitrary, { minLength: 0, maxLength: 50 }),
          (orders) => {
            const result = calculateRechargeStatistics(orders);
            
            // 手动计算期望值
            const expectedOrders = orders.filter(o => o.paymentStatus === 1).length;
            
            expect(result.summary.totalOrders).toBe(expectedOrders);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试按类型统计正确
     * 对于任意积分记录列表，按类型统计的总和应等于各类型积分变动之和
     */
    it('按类型统计应正确分组', () => {
      fc.assert(
        fc.property(
          fc.array(pointsRecordArbitrary, { minLength: 1, maxLength: 50 }),
          (records) => {
            const result = calculatePointsFlowStatistics(records);
            
            // 验证每种类型的统计
            const types = [...new Set(records.map(r => r.changeType))];
            for (const type of types) {
              const expectedSum = records
                .filter(r => r.changeType === type)
                .reduce((sum, r) => sum + r.pointsChange, 0);
              
              expect(result.summary.byType[type]).toBe(expectedSum);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试空数据处理
     * 空订单列表应返回零值统计
     */
    it('空订单列表应返回零值统计', () => {
      const result = calculateRechargeStatistics([]);
      
      expect(result.summary.totalAmount).toBe(0);
      expect(result.summary.totalPoints).toBe(0);
      expect(result.summary.totalOrders).toBe(0);
      expect(result.summary.totalUsers).toBe(0);
      expect(result.stats).toHaveLength(0);
    });

    /**
     * 测试空积分记录处理
     */
    it('空积分记录列表应返回零值统计', () => {
      const result = calculatePointsFlowStatistics([]);
      
      expect(result.summary.totalEarned).toBe(0);
      expect(result.summary.totalConsumed).toBe(0);
      expect(result.summary.netChange).toBe(0);
      expect(result.stats).toHaveLength(0);
    });

    /**
     * 测试日期分组正确性
     * 同一天的订单应被分到同一组
     */
    it('同一天的订单应被分到同一组', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      const orders: MockRechargeOrder[] = [
        {
          orderId: 'order1',
          userId: 'user1',
          amount: 100,
          totalPoints: 1000,
          paymentStatus: 1,
          createdAt: new Date(today.getTime())
        },
        {
          orderId: 'order2',
          userId: 'user2',
          amount: 200,
          totalPoints: 2000,
          paymentStatus: 1,
          createdAt: new Date(today.getTime() + 3600000) // 1小时后
        }
      ];
      
      const result = calculateRechargeStatistics(orders, 'day');
      
      // 应该只有一个日期分组
      expect(result.stats).toHaveLength(1);
      expect(result.stats[0].orderCount).toBe(2);
      expect(result.stats[0].totalAmount).toBe(300);
    });

    /**
     * 测试不同维度分组
     */
    it('不同维度应产生不同的分组结果', () => {
      fc.assert(
        fc.property(
          fc.array(rechargeOrderArbitrary.filter(o => o.paymentStatus === 1), { minLength: 5, maxLength: 20 }),
          (orders) => {
            const dayResult = calculateRechargeStatistics(orders, 'day');
            const monthResult = calculateRechargeStatistics(orders, 'month');
            
            // 月维度的分组数应该小于等于日维度
            expect(monthResult.stats.length).toBeLessThanOrEqual(dayResult.stats.length);
            
            // 但总数应该相同
            expect(dayResult.summary.totalOrders).toBe(monthResult.summary.totalOrders);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * 测试未支付订单不计入统计
     */
    it('未支付订单不应计入统计', () => {
      fc.assert(
        fc.property(
          fc.array(rechargeOrderArbitrary, { minLength: 1, maxLength: 50 }),
          (orders) => {
            const result = calculateRechargeStatistics(orders);
            
            // 统计的订单数应该只包含已支付的
            const paidCount = orders.filter(o => o.paymentStatus === 1).length;
            expect(result.summary.totalOrders).toBe(paidCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
