/**
 * 验证码验证属性测试
 *
 * Property 5: 验证码验证正确性
 * 对于任意存储的验证码，使用正确的验证码应验证通过，使用错误的验证码应验证失败。
 *
 * Property 6: 验证码单次使用
 * 对于任意验证码，验证成功后再次使用同一验证码应验证失败。
 *
 * Property 7: 验证码过期
 * 对于任意验证码，超过5分钟后应验证失败并返回过期错误。
 *
 * Validates: Requirements 3.3-3.9, 5.2, 5.3
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fc from 'fast-check';

// 导入验证码存储服务
const verificationCodeStore = await import('../../../../services/sms/verificationCodeStore.js');

// 导入工具函数
const smsUtils = await import('../../../../utils/smsUtils.js');

// 导入认证服务
const authServiceModule = await import('../../../../services/authService.js');
const authService = authServiceModule.authService;

describe('验证码验证属性测试', () => {
  // 有效手机号生成器
  const validPhoneArb = fc.stringMatching(/^1[3-9]\d{9}$/);
  // 有效验证码生成器
  const validCodeArb = fc.stringMatching(/^\d{6}$/);

  beforeEach(() => {
    // 清空存储
    verificationCodeStore.clearAll();
    // 恢复所有mock
    jest.restoreAllMocks();
  });

  describe('Property 5: 验证码验证正确性', () => {
    it('使用正确的验证码应验证通过', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, async (phone, code) => {
          // 存储验证码
          await verificationCodeStore.set(phone, code);

          // 使用正确的验证码验证
          const result = await authService.verifyCode(phone, code);

          expect(result.valid).toBe(true);
          expect(result.errorCode).toBeUndefined();

          // 清理
          await verificationCodeStore.remove(phone);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('使用错误的验证码应验证失败', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, validCodeArb, async (phone, correctCode, wrongCode) => {
          // 确保两个验证码不同
          fc.pre(correctCode !== wrongCode);

          // 存储正确的验证码
          await verificationCodeStore.set(phone, correctCode);

          // 使用错误的验证码验证
          const result = await authService.verifyCode(phone, wrongCode);

          expect(result.valid).toBe(false);
          expect(result.errorCode).toBe('SMS_005');
          expect(result.message).toContain('验证码错误');

          // 清理
          await verificationCodeStore.remove(phone);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('验证码不存在时应返回错误', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, async (phone, code) => {
          // 确保验证码不存在
          await verificationCodeStore.remove(phone);

          // 验证不存在的验证码
          const result = await authService.verifyCode(phone, code);

          expect(result.valid).toBe(false);
          expect(result.errorCode).toBe('SMS_007');
          expect(result.message).toContain('无效');

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: 验证码单次使用', () => {
    it('验证成功后再次使用同一验证码应验证失败', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, async (phone, code) => {
          // 存储验证码
          await verificationCodeStore.set(phone, code);

          // 第一次验证应成功
          const firstResult = await authService.verifyCode(phone, code);
          expect(firstResult.valid).toBe(true);

          // 第二次验证应失败（验证码已使用）
          const secondResult = await authService.verifyCode(phone, code);
          expect(secondResult.valid).toBe(false);
          expect(secondResult.errorCode).toBe('SMS_007');

          // 清理
          await verificationCodeStore.remove(phone);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('标记为已使用的验证码应验证失败', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, async (phone, code) => {
          // 存储验证码
          await verificationCodeStore.set(phone, code);

          // 手动标记为已使用
          await verificationCodeStore.markAsUsed(phone);

          // 验证应失败
          const result = await authService.verifyCode(phone, code);
          expect(result.valid).toBe(false);
          expect(result.errorCode).toBe('SMS_007');

          // 清理
          await verificationCodeStore.remove(phone);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: 验证码过期', () => {
    it('超过5分钟后验证码应过期', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, async (phone, code) => {
          // 存储验证码，使用很短的TTL模拟过期
          // 设置TTL为1毫秒，立即过期
          await verificationCodeStore.set(phone, code, 1);

          // 等待一小段时间确保过期
          await new Promise((resolve) => setTimeout(resolve, 10));

          // 验证应失败（验证码已过期/不存在）
          const result = await authService.verifyCode(phone, code);
          expect(result.valid).toBe(false);
          // 过期的验证码会被自动删除，返回SMS_007
          expect(['SMS_006', 'SMS_007']).toContain(result.errorCode);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('isCodeExpired 函数应正确判断过期', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000000 }),
          async (elapsedMs) => {
            const now = Date.now();
            const createTime = now - elapsedMs;
            const fiveMinutesMs = 5 * 60 * 1000;

            const isExpired = smsUtils.isCodeExpired(createTime);

            if (elapsedMs > fiveMinutesMs) {
              expect(isExpired).toBe(true);
            } else {
              expect(isExpired).toBe(false);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('未过期的验证码应能正常验证', async () => {
      await fc.assert(
        fc.asyncProperty(validPhoneArb, validCodeArb, async (phone, code) => {
          // 存储验证码，使用默认TTL（5分钟）
          await verificationCodeStore.set(phone, code);

          // 立即验证应成功
          const result = await authService.verifyCode(phone, code);
          expect(result.valid).toBe(true);

          // 清理
          await verificationCodeStore.remove(phone);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
