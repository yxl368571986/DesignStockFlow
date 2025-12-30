/**
 * 充值套餐服务属性测试
 * Property 1: 套餐数据验证完整性
 * Validates: Requirements 1.1, 1.4
 */

import fc from 'fast-check';
import {
  validatePackageData,
  calculatePackageMetrics,
  PackageValidationError,
  RechargePackageData
} from '../../services/rechargePackageService';

describe('RechargePackageService', () => {
  describe('Property 1: 套餐数据验证完整性', () => {
    /**
     * 测试套餐名称唯一性验证
     * 对于任意非空字符串，验证函数应接受有效名称
     */
    it('应接受有效的套餐名称（1-50字符）', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (packageName) => {
            const data: RechargePackageData = {
              packageName,
              packageCode: 'test_code',
              price: 10,
              basePoints: 100,
              bonusPoints: 10
            };
            // 不应抛出异常
            expect(() => validatePackageData(data)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试空套餐名称被拒绝
     */
    it('应拒绝空的套餐名称', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\t', '\n'),
          (packageName) => {
            const data: RechargePackageData = {
              packageName,
              packageCode: 'test_code',
              price: 10,
              basePoints: 100,
              bonusPoints: 10
            };
            expect(() => validatePackageData(data)).toThrow(PackageValidationError);
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 测试超长套餐名称被拒绝
     */
    it('应拒绝超过50字符的套餐名称', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 51, maxLength: 100 }),
          (packageName) => {
            const data: RechargePackageData = {
              packageName,
              packageCode: 'test_code',
              price: 10,
              basePoints: 100,
              bonusPoints: 10
            };
            expect(() => validatePackageData(data)).toThrow(PackageValidationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试价格为正数验证
     * 对于任意正数价格，验证应通过
     */
    it('应接受正数价格', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (price) => {
            const basePoints = price * 10;
            const data: RechargePackageData = {
              packageName: '测试套餐',
              packageCode: 'test_code',
              price,
              basePoints,
              bonusPoints: 0
            };
            expect(() => validatePackageData(data)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试非正数价格被拒绝
     */
    it('应拒绝非正数价格', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 0 }),
          (price) => {
            const data: RechargePackageData = {
              packageName: '测试套餐',
              packageCode: 'test_code',
              price,
              basePoints: 100,
              bonusPoints: 10
            };
            expect(() => validatePackageData(data)).toThrow(PackageValidationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试基础积分=价格×10验证
     * 对于任意价格，基础积分必须等于价格×10
     */
    it('应验证基础积分等于价格×10', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (price) => {
            const correctBasePoints = price * 10;
            const data: RechargePackageData = {
              packageName: '测试套餐',
              packageCode: 'test_code',
              price,
              basePoints: correctBasePoints,
              bonusPoints: 0
            };
            expect(() => validatePackageData(data)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试错误的基础积分被拒绝
     */
    it('应拒绝不等于价格×10的基础积分', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (price, offset) => {
            const wrongBasePoints = price * 10 + offset; // 故意错误
            const data: RechargePackageData = {
              packageName: '测试套餐',
              packageCode: 'test_code',
              price,
              basePoints: wrongBasePoints,
              bonusPoints: 0
            };
            expect(() => validatePackageData(data)).toThrow(PackageValidationError);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试负数赠送积分被拒绝
     */
    it('应拒绝负数赠送积分', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: -1 }),
          (bonusPoints) => {
            const data: RechargePackageData = {
              packageName: '测试套餐',
              packageCode: 'test_code',
              price: 10,
              basePoints: 100,
              bonusPoints
            };
            expect(() => validatePackageData(data)).toThrow(PackageValidationError);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('性价比计算正确性', () => {
    /**
     * 测试总积分计算
     * 总积分 = 基础积分 + 赠送积分
     */
    it('总积分应等于基础积分+赠送积分', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 0, max: 5000 }),
          (basePoints, bonusPoints) => {
            const metrics = calculatePackageMetrics(basePoints / 10, basePoints, bonusPoints);
            expect(metrics.totalPoints).toBe(basePoints + bonusPoints);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试赠送比例计算
     * 赠送比例 = (赠送积分 / 基础积分) × 100
     */
    it('赠送比例应正确计算', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 0, max: 5000 }),
          (basePoints, bonusPoints) => {
            const metrics = calculatePackageMetrics(basePoints / 10, basePoints, bonusPoints);
            const expectedRate = Number(((bonusPoints / basePoints) * 100).toFixed(2));
            expect(metrics.bonusRate).toBe(expectedRate);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试性价比计算
     * 性价比 = 总积分 / 价格
     */
    it('性价比应正确计算', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 0, max: 500 }),
          (price, bonusPoints) => {
            const basePoints = price * 10;
            const metrics = calculatePackageMetrics(price, basePoints, bonusPoints);
            const expectedValue = Number(((basePoints + bonusPoints) / price).toFixed(2));
            expect(metrics.valuePerYuan).toBe(expectedValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试零价格处理
     */
    it('零价格时性价比应为0', () => {
      const metrics = calculatePackageMetrics(0, 0, 0);
      expect(metrics.valuePerYuan).toBe(0);
    });

    /**
     * 测试零基础积分时赠送比例为0
     */
    it('零基础积分时赠送比例应为0', () => {
      const metrics = calculatePackageMetrics(10, 0, 50);
      expect(metrics.bonusRate).toBe(0);
    });
  });

  describe('套餐编码验证', () => {
    /**
     * 测试有效的套餐编码
     */
    it('应接受有效的套餐编码（字母数字下划线连字符）', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          (packageCode) => {
            const data: RechargePackageData = {
              packageName: '测试套餐',
              packageCode,
              price: 10,
              basePoints: 100,
              bonusPoints: 10
            };
            expect(() => validatePackageData(data)).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 测试无效的套餐编码（包含特殊字符）
     */
    it('应拒绝包含特殊字符的套餐编码', () => {
      const invalidCodes = ['test@code', 'test code', 'test.code', 'test#code', '测试编码'];
      for (const packageCode of invalidCodes) {
        const data: RechargePackageData = {
          packageName: '测试套餐',
          packageCode,
          price: 10,
          basePoints: 100,
          bonusPoints: 10
        };
        expect(() => validatePackageData(data)).toThrow(PackageValidationError);
      }
    });
  });
});
