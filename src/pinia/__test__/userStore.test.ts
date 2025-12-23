/**
 * 用户状态管理 Store 单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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

// Mock global localStorage
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

// Helper function to clear cookies
function clearMockCookies() {
  mockCookies = {};
}

// Helper function to set mock cookie
function setMockCookie(name: string, value: string) {
  mockCookies[name] = value;
}

describe('userStore', () => {
  beforeEach(() => {
    // 每个测试前创建新的Pinia实例
    setActivePinia(createPinia());
    // 清空localStorage
    localStorageMock.clear();
    // 清空cookies
    clearMockCookies();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null userInfo and empty token', () => {
    const store = useUserStore();

    expect(store.userInfo).toBeNull();
    expect(store.token).toBe('');
    expect(store.isLoggedIn).toBe(false);
    expect(store.isVIP).toBe(false);
  });

  it('should set user info correctly', () => {
    const store = useUserStore();

    const mockUserInfo: UserInfo = {
      userId: '123',
      phone: '13800138000',
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      vipLevel: 0,
      createTime: '2024-01-01T00:00:00Z'
    };

    store.setUserInfo(mockUserInfo);

    expect(store.userInfo).toEqual(mockUserInfo);
    expect(store.displayName).toBe('测试用户');
  });

  it('should persist user info to localStorage', () => {
    const store = useUserStore();

    const mockUserInfo: UserInfo = {
      userId: '123',
      phone: '13800138000',
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      vipLevel: 0,
      createTime: '2024-01-01T00:00:00Z'
    };

    store.setUserInfo(mockUserInfo);

    const stored = localStorage.getItem('user_info');
    expect(stored).not.toBeNull();

    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.userId).toBe('123');
      expect(parsed.nickname).toBe('测试用户');
    }
  });

  it('should load user info from localStorage on initialization', () => {
    const mockUserInfo: UserInfo = {
      userId: '456',
      phone: '13900139000',
      nickname: '持久化用户',
      avatar: 'https://example.com/avatar2.jpg',
      vipLevel: 1,
      vipExpireTime: '2025-12-31T23:59:59Z',
      createTime: '2024-01-01T00:00:00Z'
    };

    // 预先存储用户信息
    localStorage.setItem('user_info', JSON.stringify(mockUserInfo));
    
    // 设置有效的token cookie（改进后的initToken需要token才能保留用户信息）
    setMockCookie('auth_token', 'valid-token');
    setMockCookie('token_expire_time', (Date.now() + 3600000).toString());

    // 创建新的store实例
    setActivePinia(createPinia());
    const store = useUserStore();

    expect(store.userInfo).toEqual(mockUserInfo);
    expect(store.displayName).toBe('持久化用户');
  });

  it('should set token correctly', () => {
    const store = useUserStore();

    store.setToken('test-token-123', false);

    expect(store.token).toBe('test-token-123');
  });

  it('should update user info partially', () => {
    const store = useUserStore();

    const mockUserInfo: UserInfo = {
      userId: '123',
      phone: '13800138000',
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      vipLevel: 0,
      createTime: '2024-01-01T00:00:00Z'
    };

    store.setUserInfo(mockUserInfo);

    store.updateUserInfo({
      nickname: '更新后的昵称',
      vipLevel: 1
    });

    expect(store.userInfo?.nickname).toBe('更新后的昵称');
    expect(store.userInfo?.vipLevel).toBe(1);
    expect(store.userInfo?.phone).toBe('13800138000'); // 其他字段保持不变
  });

  it('should check isLoggedIn correctly', () => {
    const store = useUserStore();

    expect(store.isLoggedIn).toBe(false);

    const mockUserInfo: UserInfo = {
      userId: '123',
      phone: '13800138000',
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      vipLevel: 0,
      createTime: '2024-01-01T00:00:00Z'
    };

    store.setUserInfo(mockUserInfo);
    expect(store.isLoggedIn).toBe(false); // 还没有token

    store.setToken('test-token');
    expect(store.isLoggedIn).toBe(true); // 有用户信息和token
  });

  it('should check isVIP correctly for non-VIP user', () => {
    const store = useUserStore();

    const mockUserInfo: UserInfo = {
      userId: '123',
      phone: '13800138000',
      nickname: '普通用户',
      avatar: 'https://example.com/avatar.jpg',
      vipLevel: 0,
      createTime: '2024-01-01T00:00:00Z'
    };

    store.setUserInfo(mockUserInfo);

    expect(store.isVIP).toBe(false);
    expect(store.vipLevelName).toBe('普通用户');
  });

  it('should check isVIP correctly for VIP user', () => {
    const store = useUserStore();

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const mockUserInfo: UserInfo = {
      userId: '123',
      phone: '13800138000',
      nickname: 'VIP用户',
      avatar: 'https://example.com/avatar.jpg',
      vipLevel: 1,
      vipExpireTime: futureDate.toISOString(),
      createTime: '2024-01-01T00:00:00Z'
    };

    store.setUserInfo(mockUserInfo);

    expect(store.isVIP).toBe(true);
    expect(store.vipLevelName).toBe('月度VIP');
  });

  it('should check isVIP correctly for expired VIP', () => {
    const store = useUserStore();

    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    const mockUserInfo: UserInfo = {
      userId: '123',
      phone: '13800138000',
      nickname: '过期VIP',
      avatar: 'https://example.com/avatar.jpg',
      vipLevel: 1,
      vipExpireTime: pastDate.toISOString(),
      createTime: '2024-01-01T00:00:00Z'
    };

    store.setUserInfo(mockUserInfo);

    expect(store.isVIP).toBe(false);
  });

  it('should return correct VIP level names', () => {
    const store = useUserStore();

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    // 月度VIP
    store.setUserInfo({
      userId: '1',
      phone: '13800138000',
      nickname: '月度VIP',
      avatar: '',
      vipLevel: 1,
      vipExpireTime: futureDate.toISOString(),
      createTime: '2024-01-01T00:00:00Z'
    });
    expect(store.vipLevelName).toBe('月度VIP');

    // 季度VIP
    store.setUserInfo({
      userId: '2',
      phone: '13800138001',
      nickname: '季度VIP',
      avatar: '',
      vipLevel: 2,
      vipExpireTime: futureDate.toISOString(),
      createTime: '2024-01-01T00:00:00Z'
    });
    expect(store.vipLevelName).toBe('季度VIP');

    // 年度VIP
    store.setUserInfo({
      userId: '3',
      phone: '13800138002',
      nickname: '年度VIP',
      avatar: '',
      vipLevel: 3,
      vipExpireTime: futureDate.toISOString(),
      createTime: '2024-01-01T00:00:00Z'
    });
    expect(store.vipLevelName).toBe('年度VIP');
  });

  it('should display phone when nickname is not set', () => {
    const store = useUserStore();

    const mockUserInfo: UserInfo = {
      userId: '123',
      phone: '13800138000',
      nickname: '',
      avatar: 'https://example.com/avatar.jpg',
      vipLevel: 0,
      createTime: '2024-01-01T00:00:00Z'
    };

    store.setUserInfo(mockUserInfo);

    expect(store.displayName).toBe('13800138000');
  });

  it('should logout and clear all data', () => {
    const store = useUserStore();

    const mockUserInfo: UserInfo = {
      userId: '123',
      phone: '13800138000',
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      vipLevel: 1,
      createTime: '2024-01-01T00:00:00Z'
    };

    store.setUserInfo(mockUserInfo);
    store.setToken('test-token');

    expect(store.isLoggedIn).toBe(true);

    store.logout();

    expect(store.userInfo).toBeNull();
    expect(store.token).toBe('');
    expect(store.isLoggedIn).toBe(false);
    expect(localStorage.getItem('user_info')).toBeNull();
  });

  it('should check and update expired VIP status', () => {
    const store = useUserStore();

    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    const mockUserInfo: UserInfo = {
      userId: '123',
      phone: '13800138000',
      nickname: '过期VIP',
      avatar: 'https://example.com/avatar.jpg',
      vipLevel: 1,
      vipExpireTime: pastDate.toISOString(),
      createTime: '2024-01-01T00:00:00Z'
    };

    store.setUserInfo(mockUserInfo);

    expect(store.userInfo?.vipLevel).toBe(1);

    store.checkVIPStatus();

    expect(store.userInfo?.vipLevel).toBe(0);
    expect(store.userInfo?.vipExpireTime).toBeUndefined();
  });

  // ========== initToken() 测试 ==========
  
  describe('initToken', () => {
    it('should read token from cookie and update store state', () => {
      // 设置mock cookie
      setMockCookie('auth_token', 'test-token-from-cookie');
      setMockCookie('token_expire_time', (Date.now() + 3600000).toString());
      
      // 创建新的store实例
      setActivePinia(createPinia());
      const store = useUserStore();
      
      expect(store.token).toBe('test-token-from-cookie');
    });

    it('should clear user info when token is missing but user info exists', () => {
      // 预先存储用户信息
      const mockUserInfo: UserInfo = {
        userId: '123',
        phone: '13800138000',
        nickname: '测试用户',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      };
      localStorage.setItem('user_info', JSON.stringify(mockUserInfo));
      
      // 不设置token cookie
      clearMockCookies();
      
      // 创建新的store实例
      setActivePinia(createPinia());
      const store = useUserStore();
      
      // 应该清除用户信息
      expect(store.userInfo).toBeNull();
      expect(store.token).toBe('');
    });

    it('should clear state when token is expired', () => {
      // 设置过期的token
      setMockCookie('auth_token', 'expired-token');
      setMockCookie('token_expire_time', (Date.now() - 3600000).toString()); // 1小时前过期
      
      // 预先存储用户信息
      const mockUserInfo: UserInfo = {
        userId: '123',
        phone: '13800138000',
        nickname: '测试用户',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      };
      localStorage.setItem('user_info', JSON.stringify(mockUserInfo));
      
      // 创建新的store实例
      setActivePinia(createPinia());
      const store = useUserStore();
      
      // 应该清除状态
      expect(store.userInfo).toBeNull();
      expect(store.token).toBe('');
    });

    it('should keep token valid when expire time is missing (fault tolerance)', () => {
      // 设置token但不设置过期时间
      setMockCookie('auth_token', 'token-without-expire');
      
      // 创建新的store实例
      setActivePinia(createPinia());
      const store = useUserStore();
      
      // Token应该被保留（容错处理）
      expect(store.token).toBe('token-without-expire');
    });
  });

  // ========== setToken() 同步设置测试 ==========
  
  describe('setToken synchronization', () => {
    it('should update store token immediately', () => {
      const store = useUserStore();
      
      store.setToken('new-token-123', false);
      
      // Store中的token应该立即更新
      expect(store.token).toBe('new-token-123');
    });

    it('should set token with custom expire time', () => {
      const store = useUserStore();
      const customExpireTime = Date.now() + 2 * 60 * 60 * 1000; // 2小时后
      
      store.setToken('custom-expire-token', false, customExpireTime);
      
      expect(store.token).toBe('custom-expire-token');
    });

    it('should set token with rememberMe option', () => {
      const store = useUserStore();
      
      store.setToken('remember-me-token', true);
      
      expect(store.token).toBe('remember-me-token');
    });
  });

  // ========== Token状态修复逻辑测试 ==========
  
  describe('Token state repair logic', () => {
    it('should handle missing expire time gracefully during init', () => {
      // 只设置token，不设置过期时间
      setMockCookie('auth_token', 'token-only');
      
      setActivePinia(createPinia());
      const store = useUserStore();
      
      // Token应该被保留
      expect(store.token).toBe('token-only');
    });

    it('should not crash when cookie parsing fails', () => {
      // 设置一个格式异常的cookie值
      mockCookies = { 'auth_token': '' };
      
      setActivePinia(createPinia());
      
      // 不应该抛出错误
      expect(() => useUserStore()).not.toThrow();
    });

    it('should maintain state consistency after setToken', () => {
      const store = useUserStore();
      
      // 设置token
      store.setToken('consistent-token', false);
      
      // Store状态应该一致
      expect(store.token).toBe('consistent-token');
      expect(store.isLoggedIn).toBe(false); // 没有用户信息，所以不是登录状态
      
      // 设置用户信息后应该是登录状态
      store.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: '测试',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      });
      
      expect(store.isLoggedIn).toBe(true);
    });
  });
});
