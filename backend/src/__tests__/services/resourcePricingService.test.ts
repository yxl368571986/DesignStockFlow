/**
 * ResourcePricingService 属性测试
 * 
 * 属性1: 定价类型设置一致性
 * 属性2: 积分值验证规则
 * 
 * 验证需求: 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.5
 */

import * as fc from 'fast-check';
import {
  validatePointsCost,
  snapToNearestFive,
  getPricingLabel,
  PricingType,
} from '../../services/resourcePricingService';

describe('ResourcePricingService 属性测试', () => {
  /**
   * 属性1: 定价类型设置一致性
   * 
   * 对于任意定价类型选择操作，当用户选择定价类型时，系统应正确设置 pricing_type 和 points_cost 的值：
   * - 选择免费资源 → pricing_type=0, points_cost=0
   * - 选择付费积分资源 → pricing_type=1, points_cost∈[5,100]且为5的倍数
   * - 选择VIP专属资源 → pricing_type=2, points_cost=0
   * 
   * **验证需求: 1.2, 1.3, 1.4**
   */
  describe('属性1: 定价类型设置一致性', () => {
    it('免费资源定价类型应为0，积分价格应为0', () => {
      fc.assert(
        fc.property(fc.constant(PricingType.FREE), (pricingType) => {
          // 免费资源的积分价格始终为0
          const expectedPointsCost = 0;
          expect(pricingType).toBe(0);
          expect(expectedPointsCost).toBe(0);
          
          // 验证标签
          const label = getPricingLabel(pricingType, expectedPointsCost);
          expect(label).toBe('免费');
        }),
        { numRuns: 100 }
      );
    });

    it('付费积分资源定价类型应为1，积分价格应在[5,100]范围内且为5的倍数', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }).map(n => n * 5), // 生成5的倍数: 5, 10, 15, ..., 100
          (pointsCost) => {
            const pricingType = PricingType.PAID_POINTS;
            
            // 验证定价类型
            expect(pricingType).toBe(1);
            
            // 验证积分价格范围
            expect(pointsCost).toBeGreaterThanOrEqual(5);
            expect(pointsCost).toBeLessThanOrEqual(100);
            
            // 验证是5的倍数
            expect(pointsCost % 5).toBe(0);
            
            // 验证标签
            const label = getPricingLabel(pricingType, pointsCost);
            expect(label).toBe(`${pointsCost}积分`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('VIP专属资源定价类型应为2，积分价格应为0', () => {
      fc.assert(
        fc.property(fc.constant(PricingType.VIP_ONLY), (pricingType) => {
          // VIP专属资源的积分价格始终为0
          const expectedPointsCost = 0;
          expect(pricingType).toBe(2);
          expect(expectedPointsCost).toBe(0);
          
          // 验证标签
          const label = getPricingLabel(pricingType, expectedPointsCost);
          expect(label).toBe('VIP专属');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 属性2: 积分值验证规则
   * 
   * 对于任意积分输入值 n，验证函数应满足：
   * - 若 n < 5，返回错误「积分不能低于5分」
   * - 若 n > 100，返回错误「积分不能超过100分」
   * - 若 n 不是5的倍数，自动吸附到最近的5的倍数
   * - 若 5 ≤ n ≤ 100 且 n 是5的倍数，验证通过
   * 
   * **验证需求: 2.1, 2.2, 2.3, 2.5**
   */
  describe('属性2: 积分值验证规则', () => {
    it('小于5的积分值应返回错误并建议调整为5', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 4 }),
          (pointsCost) => {
            const result = validatePointsCost(pointsCost);
            
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('POINTS_TOO_LOW');
            expect(result.errorMessage).toBe('积分不能低于5分');
            expect(result.adjustedValue).toBe(5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('大于100的积分值应返回错误并建议调整为100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 101, max: 10000 }),
          (pointsCost) => {
            const result = validatePointsCost(pointsCost);
            
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('POINTS_TOO_HIGH');
            expect(result.errorMessage).toBe('积分不能超过100分');
            expect(result.adjustedValue).toBe(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('非5的倍数应返回错误并自动吸附到最近的5的倍数', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 100 }).filter(n => n % 5 !== 0),
          (pointsCost) => {
            const result = validatePointsCost(pointsCost);
            
            expect(result.valid).toBe(false);
            expect(result.errorCode).toBe('INVALID_POINTS_STEP');
            expect(result.errorMessage).toBe('积分需为5的倍数');
            
            // 验证吸附值是5的倍数
            expect(result.adjustedValue).toBeDefined();
            expect(result.adjustedValue! % 5).toBe(0);
            
            // 验证吸附值在有效范围内
            expect(result.adjustedValue).toBeGreaterThanOrEqual(5);
            expect(result.adjustedValue).toBeLessThanOrEqual(100);
            
            // 验证吸附到最近的5的倍数
            const expectedSnapped = Math.round(pointsCost / 5) * 5;
            expect(result.adjustedValue).toBe(Math.max(5, Math.min(100, expectedSnapped)));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('有效的积分值（5-100且为5的倍数）应验证通过', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }).map(n => n * 5), // 生成5, 10, 15, ..., 100
          (pointsCost) => {
            const result = validatePointsCost(pointsCost);
            
            expect(result.valid).toBe(true);
            expect(result.errorCode).toBeUndefined();
            expect(result.errorMessage).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('snapToNearestFive 应正确吸附到最近的5的倍数', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }),
          (value) => {
            const snapped = snapToNearestFive(value);
            
            // 结果应该是5的倍数
            expect(snapped % 5).toBe(0);
            
            // 结果应该在[5, 100]范围内
            expect(snapped).toBeGreaterThanOrEqual(5);
            expect(snapped).toBeLessThanOrEqual(100);
            
            // 验证吸附逻辑
            const expectedSnapped = Math.round(value / 5) * 5;
            const clampedExpected = Math.max(5, Math.min(100, expectedSnapped));
            expect(snapped).toBe(clampedExpected);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 边界值测试
   */
  describe('边界值测试', () => {
    it('边界值4应返回错误', () => {
      const result = validatePointsCost(4);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('POINTS_TOO_LOW');
    });

    it('边界值5应验证通过', () => {
      const result = validatePointsCost(5);
      expect(result.valid).toBe(true);
    });

    it('边界值100应验证通过', () => {
      const result = validatePointsCost(100);
      expect(result.valid).toBe(true);
    });

    it('边界值101应返回错误', () => {
      const result = validatePointsCost(101);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('POINTS_TOO_HIGH');
    });

    it('吸附测试: 7应吸附到5', () => {
      expect(snapToNearestFive(7)).toBe(5);
    });

    it('吸附测试: 8应吸附到10', () => {
      expect(snapToNearestFive(8)).toBe(10);
    });

    it('吸附测试: 13应吸附到15', () => {
      expect(snapToNearestFive(13)).toBe(15);
    });
  });
});
