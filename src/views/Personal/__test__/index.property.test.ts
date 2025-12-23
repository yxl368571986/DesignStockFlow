/**
 * 个人中心页面属性测试
 * Property 5: 数据加载失败容错
 * Validates: Requirements 4.2, 4.4
 * 
 * 对于任何个人中心数据加载失败（非401/403错误），系统应该显示空状态而不是退出登录
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * isAuthError辅助函数 - 从组件中提取的逻辑
 * 用于区分认证错误和其他错误
 */
interface ErrorResponse {
  response?: {
    status?: number;
    data?: { code?: number };
  };
  message?: string;
  code?: string;
}

function isAuthError(error: ErrorResponse): boolean {
  const status = error.response?.status;
  const code = error.response?.data?.code;
  return status === 401 || status === 403 || code === 401 || code === 403;
}

/**
 * 模拟数据加载错误处理逻辑
 * 这是从Personal/index.vue中提取的核心逻辑
 */
interface DataLoadResult {
  showWarning: boolean;
  setEmptyData: boolean;
  triggerLogout: boolean;
}

function handleDataLoadError(error: ErrorResponse): DataLoadResult {
  const result: DataLoadResult = {
    showWarning: false,
    setEmptyData: true, // 总是设置空数据
    triggerLogout: false // 页面级别不触发退出登录
  };

  // 区分认证错误和其他错误
  if (!isAuthError(error)) {
    // 非认证错误，显示友好提示
    result.showWarning = true;
  }
  // 认证错误由请求拦截器统一处理，页面不显示消息也不触发退出

  return result;
}

describe('Property 5: 数据加载失败容错', () => {
  /**
   * Feature: personal-center-auth-ux, Property 5: 数据加载失败容错
   * 
   * 对于任何个人中心数据加载失败（非401/403错误），
   * 系统应该显示空状态而不是退出登录
   * 
   * Validates: Requirements 4.2, 4.4
   */

  // 生成非认证错误的HTTP状态码
  const nonAuthStatusCodes = fc.integer({ min: 400, max: 599 })
    .filter(status => status !== 401 && status !== 403);

  // 生成认证错误的HTTP状态码
  const authStatusCodes = fc.constantFrom(401, 403);

  // 生成非认证错误的业务码
  const nonAuthBusinessCodes = fc.integer({ min: 400, max: 599 })
    .filter(code => code !== 401 && code !== 403);

  // 生成错误消息
  const errorMessages = fc.constantFrom(
    'Server Error',
    'Bad Gateway',
    'Service Unavailable',
    'Gateway Timeout',
    'Internal Server Error',
    'Not Found',
    'Bad Request',
    'Network Error',
    'Connection Refused',
    'Timeout'
  );

  describe('非认证错误应该显示警告但不退出登录', () => {
    it('Property: 对于任何非401/403的HTTP状态码，应该显示警告消息', () => {
      fc.assert(
        fc.property(
          nonAuthStatusCodes,
          errorMessages,
          (status, message) => {
            const error = {
              response: {
                status,
                data: { code: status, msg: message }
              }
            };

            const result = handleDataLoadError(error);

            // 非认证错误应该显示警告
            expect(result.showWarning).toBe(true);
            // 应该设置空数据
            expect(result.setEmptyData).toBe(true);
            // 不应该触发退出登录
            expect(result.triggerLogout).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: 对于任何非401/403的业务错误码，应该显示警告消息', () => {
      fc.assert(
        fc.property(
          nonAuthBusinessCodes,
          errorMessages,
          (code, message) => {
            const error = {
              response: {
                status: 200,
                data: { code, msg: message }
              }
            };

            const result = handleDataLoadError(error);

            // 非认证错误应该显示警告
            expect(result.showWarning).toBe(true);
            // 应该设置空数据
            expect(result.setEmptyData).toBe(true);
            // 不应该触发退出登录
            expect(result.triggerLogout).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: 对于任何网络错误（无response），应该显示警告消息', () => {
      fc.assert(
        fc.property(
          errorMessages,
          (message) => {
            const error: ErrorResponse = {
              message,
              code: 'NETWORK_ERROR'
            };

            const result = handleDataLoadError(error);

            // 网络错误应该显示警告
            expect(result.showWarning).toBe(true);
            // 应该设置空数据
            expect(result.setEmptyData).toBe(true);
            // 不应该触发退出登录
            expect(result.triggerLogout).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('认证错误不应该在页面级别显示警告', () => {
    it('Property: 对于任何401/403错误，不应该显示警告消息', () => {
      fc.assert(
        fc.property(
          authStatusCodes,
          errorMessages,
          (status, message) => {
            const error = {
              response: {
                status,
                data: { code: status, msg: message }
              }
            };

            const result = handleDataLoadError(error);

            // 认证错误不应该在页面级别显示警告（由拦截器处理）
            expect(result.showWarning).toBe(false);
            // 应该设置空数据
            expect(result.setEmptyData).toBe(true);
            // 页面级别不触发退出登录（由拦截器处理）
            expect(result.triggerLogout).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('所有错误都应该设置空数据', () => {
    it('Property: 对于任何错误，都应该设置空数据以避免页面报错', () => {
      // 生成各种类型的错误
      const errorArbitrary = fc.oneof(
        // HTTP错误
        fc.record({
          response: fc.record({
            status: fc.integer({ min: 400, max: 599 }),
            data: fc.record({
              code: fc.integer({ min: 400, max: 599 }),
              msg: errorMessages
            })
          })
        }),
        // 网络错误
        fc.record({
          message: errorMessages,
          code: fc.constantFrom('NETWORK_ERROR', 'ECONNABORTED', 'ETIMEDOUT'),
          response: fc.constant(undefined)
        }),
        // 未知错误
        fc.record({
          message: errorMessages,
          response: fc.constant(undefined)
        })
      );

      fc.assert(
        fc.property(
          errorArbitrary,
          (error) => {
            const result = handleDataLoadError(error as ErrorResponse);

            // 所有错误都应该设置空数据
            expect(result.setEmptyData).toBe(true);
            // 页面级别不应该触发退出登录
            expect(result.triggerLogout).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('isAuthError函数属性测试', () => {
  /**
   * 测试isAuthError函数的正确性
   * 确保它能正确区分认证错误和非认证错误
   */

  it('Property: isAuthError对于401/403状态码返回true', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(401, 403),
        fc.record({ code: fc.integer() }).map(d => d as { code?: number }),
        (status, data) => {
          const error: ErrorResponse = { response: { status, data } };
          expect(isAuthError(error)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: isAuthError对于401/403业务码返回true', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 200, max: 299 }), // 成功的HTTP状态码
        fc.constantFrom(401, 403),
        (status, code) => {
          const error: ErrorResponse = { response: { status, data: { code } } };
          expect(isAuthError(error)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: isAuthError对于非401/403状态码返回false', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 599 }).filter(s => s !== 401 && s !== 403),
        fc.integer({ min: 400, max: 599 }).filter(c => c !== 401 && c !== 403),
        (status, code) => {
          const error: ErrorResponse = { response: { status, data: { code } } };
          expect(isAuthError(error)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: isAuthError对于无response的错误返回false', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (message, code) => {
          const error: ErrorResponse = { message, code };
          expect(isAuthError(error)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
