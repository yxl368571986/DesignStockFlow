/**
 * EarningsService 属性测试
 * 
 * 属性4: 收益计算正确性
 * 
 * 验证需求: 4.1, 4.2, 4.3, 4.4
 */

import * as fc from 'fast-check';
import {
  calculateEarnings,
  EarningsSource,
} from '../../services/earningsService';
import { PricingType } from '../../services/resourcePricingService';

describe('EarningsService 属性测试', () => {
  /**
   * 属性4: 收益计算正确性
   * 
   * 对于任意有效下载事件，上传者收益应满足：
   * - 免费资源被下载 → 收益 = 2积分（固定）
   * - 付费资源被普通用户下载 → 收益 = max(points_cost × 20%, 2)
   * - 付费资源被VIP用户下载 → 收益 = max(points_cost × 20%, 2)（平台承担）
   * - VIP专属资源被VIP用户下载 → 收益 = 10积分（固定）
   * 
   * **验证需求: 4.1, 4.2, 4.3, 4.4**
   */
  describe('属性4: 收益计算正确性', () => {
    describe('4.1 免费资源收益计算', () => {
      it('免费资源被普通用户下载应获得2积分', () => {
        fc.assert(
          fc.property(
            fc.constant(PricingType.FREE),
            fc.integer({ min: 0, max: 100 }), // pointsCost 对免费资源无意义
            fc.constant(false), // 普通用户
            (pricingType, pointsCost, isVipDownloader) => {
              const result = calculateEarnings(pricingType, pointsCost, isVipDownloader);
              
              // 收益应为固定2积分
              expect(result.earningsPoints).toBe(2);
              // 来源应为普通下载
              expect(result.earningsSource).toBe(EarningsSource.NORMAL_DOWNLOAD);
              // 描述应包含免费资源
              expect(result.description).toContain('免费');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('免费资源被VIP用户下载应获得2积分', () => {
        fc.assert(
          fc.property(
            fc.constant(PricingType.FREE),
            fc.integer({ min: 0, max: 100 }),
            fc.constant(true), // VIP用户
            (pricingType, pointsCost, isVipDownloader) => {
              const result = calculateEarnings(pricingType, pointsCost, isVipDownloader);
              
              // 收益应为固定2积分
              expect(result.earningsPoints).toBe(2);
              // 来源应为VIP下载
              expect(result.earningsSource).toBe(EarningsSource.VIP_DOWNLOAD);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('4.2 付费资源被普通用户下载收益计算', () => {
      it('付费资源被普通用户下载应获得 max(points_cost × 20%, 2) 积分', () => {
        fc.assert(
          fc.property(
            fc.constant(PricingType.PAID_POINTS),
            fc.integer({ min: 1, max: 20 }).map(n => n * 5), // 5-100的5的倍数
            fc.constant(false), // 普通用户
            (pricingType, pointsCost, isVipDownloader) => {
              const result = calculateEarnings(pricingType, pointsCost, isVipDownloader);
              
              // 计算期望收益
              const expectedEarnings = Math.max(Math.floor(pointsCost * 0.2), 2);
              
              // 收益应符合公式
              expect(result.earningsPoints).toBe(expectedEarnings);
              // 来源应为普通下载
              expect(result.earningsSource).toBe(EarningsSource.NORMAL_DOWNLOAD);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('低价付费资源（5-10积分）收益应至少为2积分', () => {
        fc.assert(
          fc.property(
            fc.constant(PricingType.PAID_POINTS),
            fc.integer({ min: 1, max: 2 }).map(n => n * 5), // 5或10积分
            fc.constant(false),
            (pricingType, pointsCost, isVipDownloader) => {
              const result = calculateEarnings(pricingType, pointsCost, isVipDownloader);
              
              // 5积分 × 20% = 1，但最低为2
              // 10积分 × 20% = 2
              expect(result.earningsPoints).toBeGreaterThanOrEqual(2);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('高价付费资源（50-100积分）收益应为 points_cost × 20%', () => {
        fc.assert(
          fc.property(
            fc.constant(PricingType.PAID_POINTS),
            fc.integer({ min: 10, max: 20 }).map(n => n * 5), // 50-100积分
            fc.constant(false),
            (pricingType, pointsCost, isVipDownloader) => {
              const result = calculateEarnings(pricingType, pointsCost, isVipDownloader);
              
              // 50积分 × 20% = 10，100积分 × 20% = 20
              const expectedEarnings = Math.floor(pointsCost * 0.2);
              expect(result.earningsPoints).toBe(expectedEarnings);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('4.3 付费资源被VIP用户下载收益计算', () => {
      it('付费资源被VIP用户下载应获得 max(points_cost × 20%, 2) 积分（平台承担）', () => {
        fc.assert(
          fc.property(
            fc.constant(PricingType.PAID_POINTS),
            fc.integer({ min: 1, max: 20 }).map(n => n * 5),
            fc.constant(true), // VIP用户
            (pricingType, pointsCost, isVipDownloader) => {
              const result = calculateEarnings(pricingType, pointsCost, isVipDownloader);
              
              // 计算期望收益
              const expectedEarnings = Math.max(Math.floor(pointsCost * 0.2), 2);
              
              // 收益应符合公式
              expect(result.earningsPoints).toBe(expectedEarnings);
              // 来源应为平台补贴
              expect(result.earningsSource).toBe(EarningsSource.PLATFORM_SUBSIDY);
              // 描述应包含平台补贴
              expect(result.description).toContain('平台补贴');
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('4.4 VIP专属资源收益计算', () => {
      it('VIP专属资源被VIP用户下载应获得10积分', () => {
        fc.assert(
          fc.property(
            fc.constant(PricingType.VIP_ONLY),
            fc.integer({ min: 0, max: 100 }), // pointsCost 对VIP专属无意义
            fc.constant(true), // VIP用户
            (pricingType, pointsCost, isVipDownloader) => {
              const result = calculateEarnings(pricingType, pointsCost, isVipDownloader);
              
              // 收益应为固定10积分
              expect(result.earningsPoints).toBe(10);
              // 来源应为平台补贴
              expect(result.earningsSource).toBe(EarningsSource.PLATFORM_SUBSIDY);
              // 描述应包含VIP专属
              expect(result.description).toContain('VIP专属');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('VIP专属资源被普通用户下载也应获得10积分（理论上不会发生）', () => {
        // 注：实际业务中普通用户无法下载VIP专属资源，但收益计算函数应能处理
        fc.assert(
          fc.property(
            fc.constant(PricingType.VIP_ONLY),
            fc.integer({ min: 0, max: 100 }),
            fc.constant(false), // 普通用户
            (pricingType, pointsCost, isVipDownloader) => {
              const result = calculateEarnings(pricingType, pointsCost, isVipDownloader);
              
              // 收益应为固定10积分
              expect(result.earningsPoints).toBe(10);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });


  /**
   * 收益计算边界值测试
   */
  describe('收益计算边界值测试', () => {
    it('5积分付费资源收益应为2积分（最低保障）', () => {
      const result = calculateEarnings(PricingType.PAID_POINTS, 5, false);
      // 5 × 20% = 1，但最低为2
      expect(result.earningsPoints).toBe(2);
    });

    it('10积分付费资源收益应为2积分', () => {
      const result = calculateEarnings(PricingType.PAID_POINTS, 10, false);
      // 10 × 20% = 2
      expect(result.earningsPoints).toBe(2);
    });

    it('15积分付费资源收益应为3积分', () => {
      const result = calculateEarnings(PricingType.PAID_POINTS, 15, false);
      // 15 × 20% = 3
      expect(result.earningsPoints).toBe(3);
    });

    it('50积分付费资源收益应为10积分', () => {
      const result = calculateEarnings(PricingType.PAID_POINTS, 50, false);
      // 50 × 20% = 10
      expect(result.earningsPoints).toBe(10);
    });

    it('100积分付费资源收益应为20积分', () => {
      const result = calculateEarnings(PricingType.PAID_POINTS, 100, false);
      // 100 × 20% = 20
      expect(result.earningsPoints).toBe(20);
    });
  });

  /**
   * 收益来源正确性测试
   */
  describe('收益来源正确性测试', () => {
    it('免费资源 + 普通用户 → NORMAL_DOWNLOAD', () => {
      const result = calculateEarnings(PricingType.FREE, 0, false);
      expect(result.earningsSource).toBe(EarningsSource.NORMAL_DOWNLOAD);
    });

    it('免费资源 + VIP用户 → VIP_DOWNLOAD', () => {
      const result = calculateEarnings(PricingType.FREE, 0, true);
      expect(result.earningsSource).toBe(EarningsSource.VIP_DOWNLOAD);
    });

    it('付费资源 + 普通用户 → NORMAL_DOWNLOAD', () => {
      const result = calculateEarnings(PricingType.PAID_POINTS, 50, false);
      expect(result.earningsSource).toBe(EarningsSource.NORMAL_DOWNLOAD);
    });

    it('付费资源 + VIP用户 → PLATFORM_SUBSIDY', () => {
      const result = calculateEarnings(PricingType.PAID_POINTS, 50, true);
      expect(result.earningsSource).toBe(EarningsSource.PLATFORM_SUBSIDY);
    });

    it('VIP专属资源 + VIP用户 → PLATFORM_SUBSIDY', () => {
      const result = calculateEarnings(PricingType.VIP_ONLY, 0, true);
      expect(result.earningsSource).toBe(EarningsSource.PLATFORM_SUBSIDY);
    });
  });

  /**
   * 收益计算一致性属性测试
   */
  describe('收益计算一致性属性', () => {
    it('相同输入应产生相同输出（幂等性）', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 2 }), // pricingType
          fc.integer({ min: 0, max: 100 }), // pointsCost
          fc.boolean(), // isVipDownloader
          (pricingType, pointsCost, isVipDownloader) => {
            const result1 = calculateEarnings(pricingType, pointsCost, isVipDownloader);
            const result2 = calculateEarnings(pricingType, pointsCost, isVipDownloader);
            
            expect(result1.earningsPoints).toBe(result2.earningsPoints);
            expect(result1.earningsSource).toBe(result2.earningsSource);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('收益积分应始终为正整数', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 2 }),
          fc.integer({ min: 0, max: 100 }),
          fc.boolean(),
          (pricingType, pointsCost, isVipDownloader) => {
            const result = calculateEarnings(pricingType, pointsCost, isVipDownloader);
            
            expect(result.earningsPoints).toBeGreaterThan(0);
            expect(Number.isInteger(result.earningsPoints)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('收益积分应有合理上限（不超过资源价格的50%）', () => {
      fc.assert(
        fc.property(
          fc.constant(PricingType.PAID_POINTS),
          fc.integer({ min: 1, max: 20 }).map(n => n * 5),
          fc.boolean(),
          (pricingType, pointsCost, isVipDownloader) => {
            const result = calculateEarnings(pricingType, pointsCost, isVipDownloader);
            
            // 收益不应超过资源价格的50%
            expect(result.earningsPoints).toBeLessThanOrEqual(pointsCost * 0.5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 收益描述正确性测试
   */
  describe('收益描述正确性测试', () => {
    it('所有收益计算结果应包含非空描述', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 2 }),
          fc.integer({ min: 0, max: 100 }),
          fc.boolean(),
          (pricingType, pointsCost, isVipDownloader) => {
            const result = calculateEarnings(pricingType, pointsCost, isVipDownloader);
            
            expect(result.description).toBeDefined();
            expect(result.description.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
