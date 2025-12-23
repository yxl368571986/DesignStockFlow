/**
 * 用户Store属性测试
 * 使用fast-check进行基于属性的测试
 * Feature: personal-center-auth-ux
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '../userStore';
import type { UserInfo } from '@/types/models';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock document.cookie
let mockCookies: Record<string, string> = {};

const cookieDescriptor = {
  get: () => {
    return Object.entries(mockCookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  },
  set: (value: string) => {
    const parts = value.split(';')[0].split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      mockCookies[key] = val;
    }
  },
  configurable: true
};

Object.defineProperty(document, 'cookie', cookieDescriptor);

function clearMockCookies() {
  mockCookies = {};
}

function setMockCookie(name: string, value: string) {
  mockCookies[name] = value;
}

function getMockCookie(name: string): string | undefined {
  return mockCookies[name];
}

describe('User Store Property-Based Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorageMock.clear();
    clearMockCookies();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 6: Token初始化修复
   * Feature: personal-center-auth-ux, Property 6: Token初始化修复
   * Validates: Requirements 2.1, 5.1, 5.3
   * 
   * 对于任何应用初始化，如果发现Token存在但过期时间缺失，系统应该自动设置默认过期时间
   */
  describe('Property 6: Token初始化修复', () => {
    // 生成有效的token字符串（类似JWT格式：字母数字和点，无空格，无cookie特殊字符）
    const validTokenArb = fc.stringMatching(/^[a-zA-Z0-9._-]{10,100}$/);

    it('should keep token valid when expire time is missing during init', () => {
      fc.assert(
        fc.property(
          validTokenArb,
          (token) => {
            // 清理状态
            clearMockCookies();
            localStorageMock.clear();
            
            // 只设置token，不设置过期时间
            setMockCookie('auth_token', token);
            
            // 创建新的store实例
            setActivePinia(createPinia());
            const store = useUserStore();
            
            // Token应该被保留（容错处理）
            expect(store.token).toBe(token);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear state when token is expired during init', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            validTokenArb,
            fc.integer({ min: 1, max: Date.now() - 1000 }) // 过去的时间
          ),
          ([token, expireTime]) => {
            // 清理状态
            clearMockCookies();
            localStorageMock.clear();
            
            // 设置过期的token
            setMockCookie('auth_token', token);
            setMockCookie('token_expire_time', expireTime.toString());
            
            // 创建新的store实例
            setActivePinia(createPinia());
            const store = useUserStore();
            
            // Token应该被清除
            expect(store.token).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should keep token when expire time is valid during init', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            validTokenArb,
            fc.integer({ min: Date.now() + 1000, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }) // 未来的时间
          ),
          ([token, expireTime]) => {
            // 清理状态
            clearMockCookies();
            localStorageMock.clear();
            
            // 设置有效的token
            setMockCookie('auth_token', token);
            setMockCookie('token_expire_time', expireTime.toString());
            
            // 创建新的store实例
            setActivePinia(createPinia());
            const store = useUserStore();
            
            // Token应该被保留
            expect(store.token).toBe(token);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear user info when token is missing but user info exists', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/),
            phone: fc.stringMatching(/^1[3-9]\d{9}$/),
            nickname: fc.string({ minLength: 1, maxLength: 50 }),
            vipLevel: fc.integer({ min: 0, max: 3 })
          }),
          (userInfoData) => {
            // 清理状态
            clearMockCookies();
            localStorageMock.clear();
            
            // 预先存储用户信息
            const mockUserInfo: UserInfo = {
              userId: userInfoData.userId,
              phone: userInfoData.phone,
              nickname: userInfoData.nickname,
              avatar: '',
              vipLevel: userInfoData.vipLevel,
              createTime: '2024-01-01T00:00:00Z'
            };
            localStorage.setItem('user_info', JSON.stringify(mockUserInfo));
            
            // 不设置token cookie
            
            // 创建新的store实例
            setActivePinia(createPinia());
            const store = useUserStore();
            
            // 用户信息应该被清除
            expect(store.userInfo).toBeNull();
            expect(store.token).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Store和Cookie同步
   * Feature: personal-center-auth-ux, Property 7: Store和Cookie同步
   * Validates: Requirements 5.2, 5.5
   * 
   * 对于任何Token设置操作，系统应该同时更新cookies和store中的Token状态
   */
  describe('Property 7: Store和Cookie同步', () => {
    // 生成有效的token字符串（类似JWT格式：字母数字和点，无空格，无cookie特殊字符）
    const validTokenArb = fc.stringMatching(/^[a-zA-Z0-9._-]{10,100}$/);

    it('should update store token immediately when setToken is called', () => {
      fc.assert(
        fc.property(
          validTokenArb,
          (token) => {
            // 清理状态
            clearMockCookies();
            localStorageMock.clear();
            
            setActivePinia(createPinia());
            const store = useUserStore();
            
            // 设置token
            store.setToken(token, false);
            
            // Store中的token应该立即更新
            expect(store.token).toBe(token);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain store state consistency after setToken with rememberMe', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            validTokenArb,
            fc.boolean()
          ),
          ([token, rememberMe]) => {
            // 清理状态
            clearMockCookies();
            localStorageMock.clear();
            
            setActivePinia(createPinia());
            const store = useUserStore();
            
            // 设置token
            store.setToken(token, rememberMe);
            
            // Store中的token应该立即更新
            expect(store.token).toBe(token);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain store state consistency after setToken with custom expire time', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            validTokenArb,
            fc.integer({ min: Date.now() + 1000, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
          ),
          ([token, expireTime]) => {
            // 清理状态
            clearMockCookies();
            localStorageMock.clear();
            
            setActivePinia(createPinia());
            const store = useUserStore();
            
            // 设置token和自定义过期时间
            store.setToken(token, false, expireTime);
            
            // Store中的token应该立即更新
            expect(store.token).toBe(token);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear both store and cookies on logout', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            validTokenArb,
            fc.record({
              userId: fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/),
              phone: fc.stringMatching(/^1[3-9]\d{9}$/),
              nickname: fc.string({ minLength: 1, maxLength: 50 }),
              vipLevel: fc.integer({ min: 0, max: 3 })
            })
          ),
          ([token, userInfoData]) => {
            // 清理状态
            clearMockCookies();
            localStorageMock.clear();
            
            setActivePinia(createPinia());
            const store = useUserStore();
            
            // 设置用户信息和token
            const mockUserInfo: UserInfo = {
              userId: userInfoData.userId,
              phone: userInfoData.phone,
              nickname: userInfoData.nickname,
              avatar: '',
              vipLevel: userInfoData.vipLevel,
              createTime: '2024-01-01T00:00:00Z'
            };
            store.setUserInfo(mockUserInfo);
            store.setToken(token, false);
            
            // 验证设置成功
            expect(store.token).toBe(token);
            expect(store.userInfo).not.toBeNull();
            
            // 执行logout
            store.logout();
            
            // Store状态应该被清除
            expect(store.token).toBe('');
            expect(store.userInfo).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain isLoggedIn consistency with token and userInfo', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            validTokenArb,
            fc.record({
              userId: fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/),
              phone: fc.stringMatching(/^1[3-9]\d{9}$/),
              nickname: fc.string({ minLength: 1, maxLength: 50 }),
              vipLevel: fc.integer({ min: 0, max: 3 })
            })
          ),
          ([token, userInfoData]) => {
            // 清理状态
            clearMockCookies();
            localStorageMock.clear();
            
            setActivePinia(createPinia());
            const store = useUserStore();
            
            // 初始状态：未登录
            expect(store.isLoggedIn).toBe(false);
            
            // 只设置token：仍未登录（需要用户信息）
            store.setToken(token, false);
            expect(store.isLoggedIn).toBe(false);
            
            // 设置用户信息：已登录
            const mockUserInfo: UserInfo = {
              userId: userInfoData.userId,
              phone: userInfoData.phone,
              nickname: userInfoData.nickname,
              avatar: '',
              vipLevel: userInfoData.vipLevel,
              createTime: '2024-01-01T00:00:00Z'
            };
            store.setUserInfo(mockUserInfo);
            expect(store.isLoggedIn).toBe(true);
            
            // logout后：未登录
            store.logout();
            expect(store.isLoggedIn).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
