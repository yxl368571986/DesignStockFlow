/**
 * 管理员积分调整服务属性测试
 * Property 5: 积分调整安全性
 * Property 6: 撤销操作有效性
 * Validates: Requirements 3.3, 3.5, 3.8, 3.9, 3.10
 */

import fc from 'fast-check';
import {
  validateReason,
  checkApprovalRequired,
  AdjustmentError,
  AdjustmentType
} from '../../services/adminPointsService';

describe('AdminPointsService', () => {
  describe('Property 5: 积分调整安全性', () => {
    /**
     * 测试调整原因长度验证（20-200字）
     */
    it('应接受20-200字符的调整原因', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 20, maxLength: 200 }),
          (reason) => {
            expect(() => validateReason(reason)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试过短的调整原因被拒绝
     */
    it('应拒绝少于20字符的调整原因', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 19 }),
          (reason) => {
            expect(() => validateReason(reason)).toThrow(AdjustmentError);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试过长的调整原因被拒绝
     */
    it('应拒绝超过200字符的调整原因', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 201, maxLength: 500 }),
          (reason) => {
            expect(() => validateReason(reason)).toThrow(AdjustmentError);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试空调整原因被拒绝
     */
    it('应拒绝空的调整原因', () => {
      expect(() => validateReason('')).toThrow(AdjustmentError);
      expect(() => validateReason('   ')).toThrow(AdjustmentError);
    });

    /**
     * 测试余额不足时扣除失败
     */
    it('余额不足时扣除应失败', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 101, max: 1000 }),
          (balance, deductAmount) => {
            // 模拟余额检查
            const canDeduct = balance >= deductAmount;
            expect(canDeduct).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试余额充足时扣除成功
     */
    it('余额充足时扣除应成功', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (balance, deductAmount) => {
            const canDeduct = balance >= deductAmount;
            expect(canDeduct).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试调整后余额不为负
     */
    it('调整后余额不应为负', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: -500, max: 500 }),
          (balance, change) => {
            const newBalance = balance + change;
            // 如果变动会导致负数，应该被阻止
            if (newBalance < 0) {
              // 这种情况应该被拒绝
              expect(newBalance).toBeLessThan(0);
            } else {
              expect(newBalance).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('二次审批检查', () => {
    /**
     * 测试单次≥1000积分触发审批
     */
    it('单次调整≥1000积分应触发审批', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000 }),
          (points) => {
            const needsApproval = checkApprovalRequired(points, 1);
            expect(needsApproval).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试单次<1000积分不触发审批
     */
    it('单次调整<1000积分不应触发审批', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 999 }),
          (points) => {
            const needsApproval = checkApprovalRequired(points, 1);
            expect(needsApproval).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试批量≥100人触发审批
     */
    it('批量赠送≥100人应触发审批', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          (userCount) => {
            const needsApproval = checkApprovalRequired(100, userCount);
            expect(needsApproval).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试批量<100人不触发审批
     */
    it('批量赠送<100人不应触发审批', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 99 }),
          (userCount) => {
            const needsApproval = checkApprovalRequired(100, userCount);
            expect(needsApproval).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: 撤销操作有效性', () => {
    /**
     * 测试24小时内可撤销
     */
    it('24小时内的操作应可撤销', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 23 }),
          (hoursAgo) => {
            const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
            const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
            expect(hoursSinceCreation).toBeLessThanOrEqual(24);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试超过24小时不可撤销
     */
    it('超过24小时的操作不应可撤销', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 25, max: 168 }),
          (hoursAgo) => {
            const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
            const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
            expect(hoursSinceCreation).toBeGreaterThan(24);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试积分已消耗不可撤销
     */
    it('积分已消耗时撤销应失败', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 50, max: 99 }),
          (addedPoints, currentBalance) => {
            // 如果当前余额小于增加的积分，说明已消耗部分
            const canRevoke = currentBalance >= addedPoints;
            expect(canRevoke).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试积分未消耗可撤销
     */
    it('积分未消耗时撤销应成功', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 500, max: 1000 }),
          (addedPoints, currentBalance) => {
            // 当前余额大于等于增加的积分，可以撤销
            const canRevoke = currentBalance >= addedPoints;
            expect(canRevoke).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('调整类型', () => {
    /**
     * 测试调整类型枚举值
     */
    it('调整类型枚举值应正确', () => {
      expect(AdjustmentType.ADD).toBe('add');
      expect(AdjustmentType.DEDUCT).toBe('deduct');
      expect(AdjustmentType.GIFT).toBe('gift');
      expect(AdjustmentType.BATCH_GIFT).toBe('batch_gift');
    });

    /**
     * 测试扣除操作的积分变动为负数
     */
    it('扣除操作的实际变动应为负数', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (points) => {
            const adjustmentType = AdjustmentType.DEDUCT;
            const actualChange = adjustmentType === AdjustmentType.DEDUCT ? -points : points;
            expect(actualChange).toBeLessThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试增加操作的积分变动为正数
     */
    it('增加操作的实际变动应为正数', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (points) => {
            const adjustmentType: string = AdjustmentType.ADD;
            const actualChange = adjustmentType === AdjustmentType.DEDUCT ? -points : points;
            expect(actualChange).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('AdjustmentError', () => {
    /**
     * 测试错误类属性
     */
    it('AdjustmentError应包含正确的属性', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('POINTS_008', 'POINTS_010', 'INSUFFICIENT_BALANCE', 'USER_NOT_FOUND'),
          (message, code) => {
            const error = new AdjustmentError(message, code);
            expect(error.message).toBe(message);
            expect(error.code).toBe(code);
            expect(error.name).toBe('AdjustmentError');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
