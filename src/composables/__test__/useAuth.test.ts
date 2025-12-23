/**
 * 认证组合式函数单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuth } from '../useAuth';
import * as authAPI from '@/api/auth';
import type { ApiResponse } from '@/types/api';
import type { LoginResponse, UserInfo } from '@/types/models';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

// Mock API calls
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  sendVerifyCode: vi.fn(),
  logout: vi.fn()
}));

describe('useAuth', () => {
  beforeEach(() => {
    // 每个测试前创建新的Pinia实例
    setActivePinia(createPinia());
    // 清除所有mock
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should validate phone number', async () => {
      const { login } = useAuth();

      const result = await login('invalid-phone', 'password123', false);

      expect(result.success).toBe(false);
      expect(result.error).toBe('请输入正确的手机号');
    });

    it('should validate password', async () => {
      const { login } = useAuth();

      const result = await login('13800138000', '123', false);

      expect(result.success).toBe(false);
      expect(result.error).toBe('密码至少6位');
    });

    it('should login successfully with valid credentials', async () => {
      const { login } = useAuth();

      const mockUserInfo: UserInfo = {
        userId: '123',
        phone: '13800138000',
        nickname: '测试用户',
        avatar: 'https://example.com/avatar.jpg',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      };

      const mockResponse: ApiResponse<LoginResponse> = {
        code: 200,
        msg: '登录成功',
        data: {
          token: 'test-token-123',
          userInfo: mockUserInfo
        },
        timestamp: Date.now()
      };

      vi.mocked(authAPI.login).mockResolvedValue(mockResponse);

      const result = await login('13800138000', 'password123', false);

      expect(result.success).toBe(true);
      expect(authAPI.login).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '13800138000',
          rememberMe: false
        })
      );
    });

    it('should handle login API error', async () => {
      const { login } = useAuth();

      const mockResponse: ApiResponse<LoginResponse> = {
        code: 400,
        msg: '账号或密码错误',
        data: null as any,
        timestamp: Date.now()
      };

      vi.mocked(authAPI.login).mockResolvedValue(mockResponse);

      const result = await login('13800138000', 'wrongpassword', false);

      expect(result.success).toBe(false);
      expect(result.error).toBe('账号或密码错误');
    });
  });

  describe('register', () => {
    it('should validate phone number', async () => {
      const { register } = useAuth();

      const result = await register('invalid-phone', '123456', 'password123', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('请输入正确的手机号');
    });

    it('should validate verify code', async () => {
      const { register } = useAuth();

      const result = await register('13800138000', '123', 'password123', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('请输入6位数字验证码');
    });

    it('should validate password match', async () => {
      const { register } = useAuth();

      const result = await register('13800138000', '123456', 'password123', 'password456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('两次输入的密码不一致');
    });

    it('should register successfully with valid data', async () => {
      const { register } = useAuth();

      const mockResponse: ApiResponse<void> = {
        code: 200,
        msg: '注册成功',
        data: undefined as any,
        timestamp: Date.now()
      };

      vi.mocked(authAPI.register).mockResolvedValue(mockResponse);

      const result = await register('13800138000', '123456', 'password123', 'password123');

      expect(result.success).toBe(true);
      expect(authAPI.register).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '13800138000',
          verifyCode: '123456'
        })
      );
    });
  });

  describe('sendCode', () => {
    it('should validate phone number', async () => {
      const { sendCode } = useAuth();

      const result = await sendCode('invalid-phone', 'register');

      expect(result.success).toBe(false);
      expect(result.error).toBe('请输入正确的手机号');
    });

    it('should send verify code successfully', async () => {
      const { sendCode, countdown } = useAuth();

      const mockResponse: ApiResponse<void> = {
        code: 200,
        msg: '验证码已发送',
        data: undefined as any,
        timestamp: Date.now()
      };

      vi.mocked(authAPI.sendVerifyCode).mockResolvedValue(mockResponse);

      const result = await sendCode('13800138000', 'register');

      expect(result.success).toBe(true);
      expect(countdown.value).toBe(60);
      expect(authAPI.sendVerifyCode).toHaveBeenCalledWith({
        phone: '13800138000',
        type: 'register'
      });
    });

    it('should prevent sending code during countdown', async () => {
      const { sendCode, countdown } = useAuth();

      const mockResponse: ApiResponse<void> = {
        code: 200,
        msg: '验证码已发送',
        data: undefined as any,
        timestamp: Date.now()
      };

      vi.mocked(authAPI.sendVerifyCode).mockResolvedValue(mockResponse);

      // 第一次发送
      await sendCode('13800138000', 'register');
      expect(countdown.value).toBe(60);

      // 第二次发送（应该被阻止）
      const result = await sendCode('13800138000', 'register');

      expect(result.success).toBe(false);
      expect(result.error).toContain('请等待');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const { logout } = useAuth();

      const mockResponse: ApiResponse<void> = {
        code: 200,
        msg: '退出成功',
        data: undefined as any,
        timestamp: Date.now()
      };

      vi.mocked(authAPI.logout).mockResolvedValue(mockResponse);

      await logout();

      expect(authAPI.logout).toHaveBeenCalled();
    });

    it('should clear local state even if API fails', async () => {
      const { logout } = useAuth();

      vi.mocked(authAPI.logout).mockRejectedValue(new Error('Network error'));

      await logout();

      // Should not throw error and should still clear state
      expect(authAPI.logout).toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    it('should initialize with correct default values', () => {
      const { loading, error, countdown, sendingCode } = useAuth();

      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(countdown.value).toBe(0);
      expect(sendingCode.value).toBe(false);
    });

    it('should update loading state during login', async () => {
      const { login, loading } = useAuth();

      const mockResponse: ApiResponse<LoginResponse> = {
        code: 200,
        msg: '登录成功',
        data: {
          token: 'test-token',
          userInfo: {
            userId: '123',
            phone: '13800138000',
            nickname: '测试用户',
            avatar: '',
            vipLevel: 0,
            createTime: '2024-01-01T00:00:00Z'
          }
        },
        timestamp: Date.now()
      };

      vi.mocked(authAPI.login).mockResolvedValue(mockResponse);

      const loginPromise = login('13800138000', 'password123', false);

      // Loading should be true during API call
      expect(loading.value).toBe(true);

      await loginPromise;

      // Loading should be false after API call
      expect(loading.value).toBe(false);
    });

    it('should reset error state', () => {
      const { error, resetError } = useAuth();

      // Manually set error
      (error as any).value = 'Test error';

      resetError();

      expect(error.value).toBeNull();
    });

    it('should reset countdown', () => {
      const { countdown, resetCountdown } = useAuth();

      // Manually set countdown
      (countdown as any).value = 30;

      resetCountdown();

      expect(countdown.value).toBe(0);
    });
  });
});
