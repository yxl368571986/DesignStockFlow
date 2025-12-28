/**
 * 验证码存储服务属性测试
 * 
 * Property 4: 验证码存储与读取
 * 对于任意有效手机号和验证码，存储后立即读取应能获取到相同的验证码数据。
 * 
 * Validates: Requirements 2.6, 2.7
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';

// 直接导入模块
const verificationCodeStore = await import('../../../../services/sms/verificationCodeStore.js');

describe('VerificationCodeStore Property Tests', () => {
  beforeEach(() => {
    verificationCodeStore.clearAll();
  });

  describe('Property 4: 验证码存储与读取', () => {
    const validPhoneArb = fc.stringMatching(/^1[3-9]\d{9}$/);
    const validCodeArb = fc.stringMatching(/^\d{6}$/);

    it('存储后立即读取应能获取到相同的验证码', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, async (phone, code) => {
          await verificationCodeStore.set(phone, code);
          const result = await verificationCodeStore.get(phone);
          
          expect(result).not.toBeNull();
          expect(result?.code).toBe(code);
          expect(result?.used).toBe(false);
          expect(typeof result?.createTime).toBe('number');
          
          await verificationCodeStore.remove(phone);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('存储后 exists 应返回 true', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, async (phone, code) => {
          await verificationCodeStore.set(phone, code);
          const exists = await verificationCodeStore.exists(phone);
          expect(exists).toBe(true);
          await verificationCodeStore.remove(phone);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('删除后读取应返回 null', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, async (phone, code) => {
          await verificationCodeStore.set(phone, code);
          await verificationCodeStore.remove(phone);
          const result = await verificationCodeStore.get(phone);
          expect(result).toBeNull();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('标记为已使用后 used 应为 true', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, async (phone, code) => {
          await verificationCodeStore.set(phone, code);
          await verificationCodeStore.markAsUsed(phone);
          const result = await verificationCodeStore.get(phone);
          expect(result).not.toBeNull();
          expect(result?.used).toBe(true);
          await verificationCodeStore.remove(phone);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('标记为已使用后 exists 应返回 false', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, async (phone, code) => {
          await verificationCodeStore.set(phone, code);
          await verificationCodeStore.markAsUsed(phone);
          const exists = await verificationCodeStore.exists(phone);
          expect(exists).toBe(false);
          await verificationCodeStore.remove(phone);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('不存在的手机号读取应返回 null', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, async (phone) => {
          await verificationCodeStore.remove(phone);
          const result = await verificationCodeStore.get(phone);
          expect(result).toBeNull();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('不存在的手机号 exists 应返回 false', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, async (phone) => {
          await verificationCodeStore.remove(phone);
          const exists = await verificationCodeStore.exists(phone);
          expect(exists).toBe(false);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('覆盖存储应更新验证码', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, validCodeArb, async (phone, code1, code2) => {
          fc.pre(code1 !== code2);
          await verificationCodeStore.set(phone, code1);
          await verificationCodeStore.set(phone, code2);
          const result = await verificationCodeStore.get(phone);
          expect(result).not.toBeNull();
          expect(result?.code).toBe(code2);
          expect(result?.used).toBe(false);
          await verificationCodeStore.remove(phone);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
