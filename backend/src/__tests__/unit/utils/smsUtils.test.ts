/**
 * 短信工具函数属性测试
 * 
 * Property 1: 手机号格式验证
 * Property 2: 验证码格式验证
 * Property 3: 验证码生成
 * 
 * Validates: Requirements 1.1, 1.8, 2.1, 2.5, 5.1
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';

// 导入待测试的函数
const smsUtils = await import('../../../utils/smsUtils.js');

describe('SMS Utils Property Tests', () => {
  /**
   * Property 1: 手机号格式验证
   * 对于任意字符串，手机号验证函数应正确识别有效手机号（11位数字，以13/14/15/17/18/19开头）和无效手机号。
   * Validates: Requirements 1.1, 2.1
   */
  describe('Property 1: 手机号格式验证', () => {
    // 有效手机号生成器：11位数字，以1[3-9]开头
    const validPhoneArb = fc.stringMatching(/^1[3-9]\d{9}$/);
    
    it('有效手机号应验证通过', () => {
      fc.assert(
        fc.property(validPhoneArb, (phone) => {
          const result = smsUtils.validatePhone(phone);
          expect(result).toBe(true);
          return result === true;
        }),
        { numRuns: 100 }
      );
    });

    it('非11位字符串应验证失败', () => {
      // 生成长度不为11的数字字符串
      const invalidLengthArb = fc.stringMatching(/^\d*$/)
        .filter((s: string) => s.length !== 11 && s.length > 0);
      
      fc.assert(
        fc.property(invalidLengthArb, (phone: string) => {
          const result = smsUtils.validatePhone(phone);
          expect(result).toBe(false);
          return result === false;
        }),
        { numRuns: 100 }
      );
    });

    it('不以1[3-9]开头的11位数字应验证失败', () => {
      // 生成以10/11/12开头的11位数字
      const invalidPrefixArb = fc.tuple(
        fc.constantFrom('10', '11', '12', '20', '00'),
        fc.stringMatching(/^\d{9}$/)
      ).map(([prefix, suffix]) => prefix + suffix);
      
      fc.assert(
        fc.property(invalidPrefixArb, (phone) => {
          const result = smsUtils.validatePhone(phone);
          expect(result).toBe(false);
          return result === false;
        }),
        { numRuns: 100 }
      );
    });

    it('包含非数字字符的字符串应验证失败', () => {
      // 生成包含字母的字符串
      const nonDigitArb = fc.string().filter(s => s.length > 0 && /[^0-9]/.test(s));
      
      fc.assert(
        fc.property(nonDigitArb, (phone) => {
          const result = smsUtils.validatePhone(phone);
          expect(result).toBe(false);
          return result === false;
        }),
        { numRuns: 100 }
      );
    });

    it('空值和非字符串应验证失败', () => {
      const invalidInputArb = fc.constantFrom(null, undefined, '', 0, 123, {}, []);
      
      fc.assert(
        fc.property(invalidInputArb, (input) => {
          const result = smsUtils.validatePhone(input as string);
          expect(result).toBe(false);
          return result === false;
        }),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 2: 验证码格式验证
   * 对于任意字符串，验证码格式验证函数应正确识别有效验证码（6位纯数字）和无效验证码。
   * Validates: Requirements 1.8, 3.1, 3.2
   */
  describe('Property 2: 验证码格式验证', () => {
    // 有效验证码生成器：6位纯数字
    const validCodeArb = fc.stringMatching(/^\d{6}$/);
    
    it('6位纯数字验证码应验证通过', () => {
      fc.assert(
        fc.property(validCodeArb, (code) => {
          const result = smsUtils.validateVerifyCode(code);
          expect(result).toBe(true);
          return result === true;
        }),
        { numRuns: 100 }
      );
    });

    it('非6位数字字符串应验证失败', () => {
      // 生成长度不为6的数字字符串
      const invalidLengthArb = fc.stringMatching(/^\d*$/)
        .filter((s: string) => s.length !== 6 && s.length > 0);
      
      fc.assert(
        fc.property(invalidLengthArb, (code: string) => {
          const result = smsUtils.validateVerifyCode(code);
          expect(result).toBe(false);
          return result === false;
        }),
        { numRuns: 100 }
      );
    });

    it('包含非数字字符的6位字符串应验证失败', () => {
      // 生成包含字母的6位字符串
      const nonDigitCodeArb = fc.string({ minLength: 6, maxLength: 6 })
        .filter(s => /[^0-9]/.test(s));
      
      fc.assert(
        fc.property(nonDigitCodeArb, (code) => {
          const result = smsUtils.validateVerifyCode(code);
          expect(result).toBe(false);
          return result === false;
        }),
        { numRuns: 100 }
      );
    });

    it('空值和非字符串应验证失败', () => {
      const invalidInputArb = fc.constantFrom(null, undefined, '', 0, 123456, {}, []);
      
      fc.assert(
        fc.property(invalidInputArb, (input) => {
          const result = smsUtils.validateVerifyCode(input as string);
          expect(result).toBe(false);
          return result === false;
        }),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 3: 验证码生成
   * 对于任意次调用验证码生成函数，生成的验证码应始终为6位纯数字字符串。
   * Validates: Requirements 2.5, 5.1
   */
  describe('Property 3: 验证码生成', () => {
    it('生成的验证码应始终为6位纯数字', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), () => {
          const code = smsUtils.generateVerificationCode();
          
          // 验证长度为6
          expect(code.length).toBe(6);
          // 验证为纯数字
          expect(/^\d{6}$/.test(code)).toBe(true);
          // 验证数值范围在100000-999999之间
          const numCode = parseInt(code, 10);
          expect(numCode).toBeGreaterThanOrEqual(100000);
          expect(numCode).toBeLessThanOrEqual(999999);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('多次生成的验证码应具有随机性（不全相同）', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(smsUtils.generateVerificationCode());
      }
      // 100次生成至少应有多个不同的值（概率极高）
      expect(codes.size).toBeGreaterThan(1);
    });
  });

  /**
   * 额外属性测试：safeCompare 常量时间比较
   * 验证安全比较函数的正确性
   */
  describe('safeCompare 常量时间比较', () => {
    it('相同字符串应返回 true', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (str) => {
          const result = smsUtils.safeCompare(str, str);
          expect(result).toBe(true);
          return result === true;
        }),
        { numRuns: 100 }
      );
    });

    it('不同字符串应返回 false', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (a, b) => {
            fc.pre(a !== b);
            const result = smsUtils.safeCompare(a, b);
            expect(result).toBe(false);
            return result === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('空值应返回 false', () => {
      const emptyArb = fc.constantFrom(null, undefined, '');
      const validArb = fc.string({ minLength: 1 });
      
      fc.assert(
        fc.property(emptyArb, validArb, (empty, valid) => {
          expect(smsUtils.safeCompare(empty as string, valid)).toBe(false);
          expect(smsUtils.safeCompare(valid, empty as string)).toBe(false);
          return true;
        }),
        { numRuns: 10 }
      );
    });
  });
});
