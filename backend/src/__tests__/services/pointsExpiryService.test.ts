/**
 * PointsExpiryService 属性测试
 * 
 * 属性9: 积分有效期管理
 * 
 * 验证需求: 11.1, 11.3, 11.4
 */

import * as fc from 'fast-check';
import {
  calculateExpireDate,
  isPointsExpired,
  isPointsExpiringSoon,
  POINTS_VALIDITY_MONTHS,
  EXPIRY_REMINDER_DAYS,
} from '../../services/pointsExpiryService';

describe('PointsExpiryService 属性测试', () => {
  /**
   * 属性9: 积分有效期管理
   * 
   * 对于任意积分获取时间，系统应正确计算过期时间：
   * - 过期时间 = 获取时间 + 12个月
   * - 过期前30天应触发提醒
   * - 过期后积分应被标记为已过期
   * 
   * **验证需求: 11.1, 11.3, 11.4**
   */
  describe('属性9: 积分有效期管理', () => {
    describe('11.1 过期时间计算', () => {
      it('过期时间应为获取时间 + 12个月', () => {
        fc.assert(
          fc.property(
            fc.date({
              min: new Date('2020-01-01'),
              max: new Date('2030-12-31'),
            }),
            (acquiredAt) => {
              const expireDate = calculateExpireDate(acquiredAt);
              
              // 计算预期的过期时间
              const expected = new Date(acquiredAt);
              expected.setMonth(expected.getMonth() + POINTS_VALIDITY_MONTHS);
              
              // 验证年月日匹配
              expect(expireDate.getFullYear()).toBe(expected.getFullYear());
              expect(expireDate.getMonth()).toBe(expected.getMonth());
              expect(expireDate.getDate()).toBe(expected.getDate());
            }
          ),
          { numRuns: 100 }
        );
      });

      it('过期时间应始终晚于获取时间', () => {
        fc.assert(
          fc.property(
            fc.date({
              min: new Date('2020-01-01'),
              max: new Date('2030-12-31'),
            }),
            (acquiredAt) => {
              const expireDate = calculateExpireDate(acquiredAt);
              expect(expireDate.getTime()).toBeGreaterThan(acquiredAt.getTime());
            }
          ),
          { numRuns: 100 }
        );
      });

      it('有效期应为12个月', () => {
        expect(POINTS_VALIDITY_MONTHS).toBe(12);
      });
    });

    describe('11.3 过期提醒', () => {
      it('过期前30天内应触发提醒', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 29 }), // 距离过期1-29天
            (daysUntilExpiry) => {
              const now = new Date();
              const expireAt = new Date(now);
              expireAt.setDate(expireAt.getDate() + daysUntilExpiry);
              
              expect(isPointsExpiringSoon(expireAt)).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('过期前超过30天不应触发提醒', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 31, max: 365 }), // 距离过期31天以上
            (daysUntilExpiry) => {
              const now = new Date();
              const expireAt = new Date(now);
              expireAt.setDate(expireAt.getDate() + daysUntilExpiry);
              
              expect(isPointsExpiringSoon(expireAt)).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('已过期的积分不应触发提醒', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 365 }), // 已过期1-365天
            (daysExpired) => {
              const now = new Date();
              const expireAt = new Date(now);
              expireAt.setDate(expireAt.getDate() - daysExpired);
              
              expect(isPointsExpiringSoon(expireAt)).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('提醒天数应为30天', () => {
        expect(EXPIRY_REMINDER_DAYS).toBe(30);
      });
    });

    describe('11.4 过期判定', () => {
      it('过期时间之后应判定为已过期', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 365 }), // 已过期1-365天
            (daysExpired) => {
              const now = new Date();
              const expireAt = new Date(now);
              expireAt.setDate(expireAt.getDate() - daysExpired);
              
              expect(isPointsExpired(expireAt)).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('过期时间之前应判定为未过期', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 365 }), // 距离过期1-365天
            (daysUntilExpiry) => {
              const now = new Date();
              const expireAt = new Date(now);
              expireAt.setDate(expireAt.getDate() + daysUntilExpiry);
              
              expect(isPointsExpired(expireAt)).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  /**
   * 边界值测试
   */
  describe('边界值测试', () => {
    it('恰好30天后过期应触发提醒', () => {
      const now = new Date();
      const expireAt = new Date(now);
      expireAt.setDate(expireAt.getDate() + 30);
      
      expect(isPointsExpiringSoon(expireAt)).toBe(true);
    });

    it('恰好31天后过期不应触发提醒', () => {
      const now = new Date();
      const expireAt = new Date(now);
      expireAt.setDate(expireAt.getDate() + 31);
      
      expect(isPointsExpiringSoon(expireAt)).toBe(false);
    });

    it('今天过期应判定为未过期（当天有效）', () => {
      const now = new Date();
      const expireAt = new Date(now);
      expireAt.setHours(23, 59, 59, 999); // 今天结束时
      
      // 如果当前时间早于过期时间，则未过期
      if (now < expireAt) {
        expect(isPointsExpired(expireAt)).toBe(false);
      }
    });

    it('昨天过期应判定为已过期', () => {
      const now = new Date();
      const expireAt = new Date(now);
      expireAt.setDate(expireAt.getDate() - 1);
      
      expect(isPointsExpired(expireAt)).toBe(true);
    });
  });

  /**
   * 月份边界测试
   */
  describe('月份边界测试', () => {
    it('1月获取的积分应在次年1月过期', () => {
      const acquiredAt = new Date('2024-01-15');
      const expireDate = calculateExpireDate(acquiredAt);
      
      expect(expireDate.getFullYear()).toBe(2025);
      expect(expireDate.getMonth()).toBe(0); // 1月
      expect(expireDate.getDate()).toBe(15);
    });

    it('12月获取的积分应在次年12月过期', () => {
      const acquiredAt = new Date('2024-12-15');
      const expireDate = calculateExpireDate(acquiredAt);
      
      expect(expireDate.getFullYear()).toBe(2025);
      expect(expireDate.getMonth()).toBe(11); // 12月
      expect(expireDate.getDate()).toBe(15);
    });

    it('月末获取的积分应正确处理月份差异', () => {
      // 1月31日 + 12个月 = 次年1月31日
      const acquiredAt = new Date('2024-01-31');
      const expireDate = calculateExpireDate(acquiredAt);
      
      expect(expireDate.getFullYear()).toBe(2025);
      // JavaScript Date 会自动处理月份溢出
    });

    it('闰年2月29日获取的积分应正确处理', () => {
      const acquiredAt = new Date('2024-02-29'); // 2024是闰年
      const expireDate = calculateExpireDate(acquiredAt);
      
      expect(expireDate.getFullYear()).toBe(2025);
      // 2025年2月没有29日，JavaScript会自动调整
    });
  });

  /**
   * 一致性测试
   */
  describe('一致性测试', () => {
    it('相同获取时间应产生相同过期时间', () => {
      fc.assert(
        fc.property(
          fc.date({
            min: new Date('2020-01-01'),
            max: new Date('2030-12-31'),
          }),
          (acquiredAt) => {
            const expireDate1 = calculateExpireDate(acquiredAt);
            const expireDate2 = calculateExpireDate(new Date(acquiredAt));
            
            expect(expireDate1.getTime()).toBe(expireDate2.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('过期判定应与提醒判定互斥', () => {
      fc.assert(
        fc.property(
          fc.date({
            min: new Date('2020-01-01'),
            max: new Date('2030-12-31'),
          }),
          (expireAt) => {
            const expired = isPointsExpired(expireAt);
            const expiringSoon = isPointsExpiringSoon(expireAt);
            
            // 已过期的积分不应触发提醒
            if (expired) {
              expect(expiringSoon).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
