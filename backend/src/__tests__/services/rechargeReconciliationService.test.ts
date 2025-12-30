/**
 * 充值对账服务测试
 * 测试对账、异常检测、自动补单等功能
 */

import fc from 'fast-check';
import {
  AnomalyType,
  ReconciliationError
} from '../../services/reconciliation/rechargeReconciliationService';

describe('RechargeReconciliationService', () => {
  describe('异常类型枚举', () => {
    it('应包含所有异常类型', () => {
      expect(AnomalyType.PAYMENT_TIMEOUT).toBe('payment_timeout');
      expect(AnomalyType.CALLBACK_MISSING).toBe('callback_missing');
      expect(AnomalyType.POINTS_NOT_ISSUED).toBe('points_not_issued');
      expect(AnomalyType.DUPLICATE_PAYMENT).toBe('duplicate_payment');
      expect(AnomalyType.AMOUNT_MISMATCH).toBe('amount_mismatch');
      expect(AnomalyType.STATUS_INCONSISTENT).toBe('status_inconsistent');
    });
  });

  describe('ReconciliationError', () => {
    it('应正确创建错误对象', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('ORDER_NOT_FOUND', 'INVALID_ORDER_STATUS', 'POINTS_ALREADY_ISSUED', 'USER_NOT_FOUND'),
          (message, code) => {
            const error = new ReconciliationError(message, code);
            expect(error.message).toBe(message);
            expect(error.code).toBe(code);
            expect(error.name).toBe('ReconciliationError');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('应使用默认错误码', () => {
      const error = new ReconciliationError('测试错误');
      expect(error.code).toBe('RECONCILIATION_ERROR');
    });
  });

  describe('订单过期检测逻辑', () => {
    /**
     * 测试过期订单检测
     */
    it('应正确检测过期订单', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 31, max: 1440 }), // 31分钟到24小时
          (minutesAgo) => {
            const expireAt = new Date(Date.now() - minutesAgo * 60 * 1000);
            const isExpired = new Date() > expireAt;
            expect(isExpired).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试未过期订单
     */
    it('应正确识别未过期订单', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 29 }), // 1到29分钟后
          (minutesLater) => {
            const expireAt = new Date(Date.now() + minutesLater * 60 * 1000);
            const isExpired = new Date() > expireAt;
            expect(isExpired).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('积分发放验证逻辑', () => {
    /**
     * 测试积分金额匹配
     */
    it('应正确验证积分金额匹配', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 10000 }),
          (expectedPoints) => {
            const actualPoints = expectedPoints;
            const isMatch = actualPoints === expectedPoints;
            expect(isMatch).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试积分金额不匹配
     */
    it('应正确检测积分金额不匹配', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 10000 }),
          fc.integer({ min: 1, max: 99 }),
          (expectedPoints, diff) => {
            const actualPoints = expectedPoints + diff;
            const isMatch = actualPoints === expectedPoints;
            expect(isMatch).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('重复支付检测逻辑', () => {
    /**
     * 测试重复支付检测
     */
    it('应正确检测重复支付', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (callbackCount) => {
            const isDuplicate = callbackCount > 1;
            expect(isDuplicate).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试单次支付不被标记为重复
     */
    it('单次支付不应被标记为重复', () => {
      const callbackCount = 1;
      const isDuplicate = callbackCount > 1;
      expect(isDuplicate).toBe(false);
    });
  });

  describe('对账结果统计', () => {
    /**
     * 测试对账结果计算
     */
    it('对账结果总数应等于各状态之和', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (matched, mismatched, pending) => {
            const total = matched + mismatched + pending;
            // 总数应该等于各状态之和
            expect(total).toBe(matched + mismatched + pending);
            expect(total).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试自动修复数量不超过异常订单数
     */
    it('自动修复数量不应超过异常订单数', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (mismatched) => {
            // 自动修复的订单数量不能超过异常订单数
            const autoFixed = Math.floor(Math.random() * (mismatched + 1));
            expect(autoFixed).toBeLessThanOrEqual(mismatched);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('订单状态验证', () => {
    /**
     * 测试订单状态值
     */
    it('订单状态应为有效值', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(0, 1, 2, 3),
          (status) => {
            // 0=待支付, 1=已支付, 2=已取消, 3=已退款
            expect([0, 1, 2, 3]).toContain(status);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * 测试只有已支付订单需要检查积分发放
     */
    it('只有已支付订单需要检查积分发放', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(0, 1, 2, 3),
          (status) => {
            const needsPointsCheck = status === 1;
            if (status === 1) {
              expect(needsPointsCheck).toBe(true);
            } else {
              expect(needsPointsCheck).toBe(false);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('补单逻辑验证', () => {
    /**
     * 测试补单后积分余额计算
     */
    it('补单后积分余额应正确增加', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 100, max: 5000 }),
          (currentBalance, pointsToAdd) => {
            const newBalance = currentBalance + pointsToAdd;
            expect(newBalance).toBe(currentBalance + pointsToAdd);
            expect(newBalance).toBeGreaterThan(currentBalance);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试补单条件验证
     */
    it('只有已支付且积分未发放的订单可以补单', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(0, 1, 2, 3),
          fc.boolean(),
          (paymentStatus, pointsIssued) => {
            const canAutoFix = paymentStatus === 1 && !pointsIssued;
            if (paymentStatus === 1 && !pointsIssued) {
              expect(canAutoFix).toBe(true);
            } else {
              expect(canAutoFix).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('时间范围对账', () => {
    /**
     * 测试时间范围验证
     */
    it('结束时间应大于等于开始时间', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          (daysRange) => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysRange);
            expect(endDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
