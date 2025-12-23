/**
 * 个人中心认证集成测试
 * Task 7.1: 编写集成测试
 * 
 * 测试完整登录 → 访问个人中心流程
 * 测试Token刷新流程
 * 测试401错误恢复流程
 * 测试个人中心Tab切换流程
 * 
 * Requirements: 1.1, 4.1, 4.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import MockAdapter from 'axios-mock-adapter';
import { ElMessage } from 'element-plus';
import * as security from '@/utils/security';

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}));

// Mock security utils
vi.mock('@/utils/security', () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  removeToken: vi.fn(),
  getTokenExpireTime: vi.fn(),
  setTokenExpireTime: vi.fn(),
  removeTokenExpireTime: vi.fn(),
  getCSRFToken: vi.fn(),
  hasValidCSRFToken: vi.fn(),
  validateRequestOrigin: vi.fn(),
  getAllowedOrigins: vi.fn(),
  isTokenExpiringSoon: vi.fn(),
  isTokenExpired: vi.fn(),
  validateTokenState: vi.fn(),
  maskPhone: vi.fn((phone: string) => phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '')
}));

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/personal',
  origin: 'http://localhost:3000',
  assign: vi.fn(),
  replace: vi.fn()
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('Personal Center Auth Integration Tests', () => {
  let mock: MockAdapter;
  let service: any;
  let resetUnauthorizedHandling: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    setActivePinia(createPinia());

    // Set default mock returns for security functions
    vi.mocked(security.getToken).mockReturnValue('test-token-123');
    vi.mocked(security.getCSRFToken).mockReturnValue('csrf-token-123');
    vi.mocked(security.hasValidCSRFToken).mockReturnValue(true);
    vi.mocked(security.validateRequestOrigin).mockReturnValue(true);
    vi.mocked(security.getAllowedOrigins).mockReturnValue(['http://localhost']);
    vi.mocked(security.isTokenExpiringSoon).mockReturnValue(false);
    vi.mocked(security.isTokenExpired).mockReturnValue(false);
    vi.mocked(security.validateTokenState).mockReturnValue({
      valid: true,
      hasToken: true,
      hasExpireTime: true
    });

    // Import request module after mocks are set up
    const requestModule = await import('@/utils/request');
    service = requestModule.default;
    resetUnauthorizedHandling = requestModule.resetUnauthorizedHandling;

    // Create mock adapter
    mock = new MockAdapter(service);

    // Reset 401 handling state
    resetUnauthorizedHandling();
  });

  afterEach(() => {
    mock.reset();
    resetUnauthorizedHandling();
  });

  /**
   * 测试场景1: 完整登录 → 访问个人中心流程
   * Requirements: 1.1, 4.1
   */
  describe('Complete Login → Personal Center Flow', () => {
    it('should successfully login and access personal center data', async () => {
      // Step 1: Mock login response
      mock.onPost('/auth/login').reply(200, {
        code: 200,
        msg: 'success',
        data: {
          token: 'new-auth-token-456',
          userInfo: {
            userId: 'user-123',
            phone: '13800138000',
            nickname: '测试用户',
            avatar: '',
            vipLevel: 0,
            createTime: '2024-01-01'
          }
        }
      });

      // Step 2: Mock personal center API responses
      mock.onGet('/user/download-history').reply(200, {
        code: 200,
        msg: 'success',
        data: {
          list: [
            { recordId: '1', resourceTitle: '资源1', downloadTime: '2024-01-01' }
          ],
          total: 1,
          pageNum: 1,
          pageSize: 12
        }
      });

      mock.onGet('/user/upload-history').reply(200, {
        code: 200,
        msg: 'success',
        data: {
          list: [],
          total: 0,
          pageNum: 1,
          pageSize: 12
        }
      });

      mock.onGet('/user/vip-info').reply(200, {
        code: 200,
        msg: 'success',
        data: {
          vipLevel: 0,
          downloadLimit: 10,
          downloadUsed: 1
        }
      });

      // Execute login
      const { post, get } = await import('@/utils/request');
      const loginResponse = await post('/auth/login', {
        phone: '13800138000',
        password: 'password123'
      });

      expect(loginResponse.code).toBe(200);
      expect(loginResponse.data.token).toBe('new-auth-token-456');

      // Access personal center data
      const downloadResponse = await get('/user/download-history', { pageNum: 1, pageSize: 12 });
      expect(downloadResponse.code).toBe(200);
      expect(downloadResponse.data.list).toHaveLength(1);

      const uploadResponse = await get('/user/upload-history', { pageNum: 1, pageSize: 12 });
      expect(uploadResponse.code).toBe(200);
      expect(uploadResponse.data.list).toHaveLength(0);

      const vipResponse = await get('/user/vip-info');
      expect(vipResponse.code).toBe(200);
      expect(vipResponse.data.vipLevel).toBe(0);
    });

    it('should include valid authorization header in personal center requests', async () => {
      mock.onGet('/user/download-history').reply((config) => {
        // Verify authorization header is present
        expect(config.headers?.Authorization).toBe('Bearer test-token-123');
        return [200, {
          code: 200,
          msg: 'success',
          data: { list: [], total: 0, pageNum: 1, pageSize: 12 }
        }];
      });

      const { get } = await import('@/utils/request');
      await get('/user/download-history', { pageNum: 1, pageSize: 12 });

      expect(security.getToken).toHaveBeenCalled();
    });

    it('should not logout when accessing personal center with valid token', async () => {
      // Mock successful API responses
      mock.onGet('/user/download-history').reply(200, {
        code: 200,
        msg: 'success',
        data: { list: [], total: 0, pageNum: 1, pageSize: 12 }
      });

      const { get } = await import('@/utils/request');
      await get('/user/download-history', { pageNum: 1, pageSize: 12 });

      // Should not trigger logout
      expect(security.removeToken).not.toHaveBeenCalled();
      expect(security.removeTokenExpireTime).not.toHaveBeenCalled();
      expect(ElMessage.error).not.toHaveBeenCalledWith('登录已过期，请重新登录');
    });
  });

  /**
   * 测试场景2: Token刷新流程
   * Requirements: 1.1, 1.3
   * 注意：复杂的Token刷新场景在 request.test.ts 中已有详细测试
   * 这里只测试基本的集成场景
   */
  describe('Token Refresh Flow', () => {
    it('should not refresh token when token is not expiring soon', async () => {
      // Token is not expiring soon
      vi.mocked(security.isTokenExpiringSoon).mockReturnValue(false);

      // Mock personal center endpoint
      mock.onGet('/user/download-history').reply(200, {
        code: 200,
        msg: 'success',
        data: { list: [], total: 0, pageNum: 1, pageSize: 12 }
      });

      const { get } = await import('@/utils/request');
      await get('/user/download-history', { pageNum: 1, pageSize: 12 });

      // Token refresh should not be called
      expect(mock.history.post.filter(r => r.url === '/auth/refresh-token')).toHaveLength(0);
    });

    it('should check token expiring status before making request', async () => {
      // Token is not expiring
      vi.mocked(security.isTokenExpiringSoon).mockReturnValue(false);

      // Mock personal center endpoint
      mock.onGet('/user/download-history').reply(200, {
        code: 200,
        msg: 'success',
        data: { list: [], total: 0, pageNum: 1, pageSize: 12 }
      });

      const { get } = await import('@/utils/request');
      await get('/user/download-history', { pageNum: 1, pageSize: 12 });

      // isTokenExpiringSoon should be called
      expect(security.isTokenExpiringSoon).toHaveBeenCalled();
    });

    it('should validate token state before making request', async () => {
      // Token state is valid
      vi.mocked(security.validateTokenState).mockReturnValue({
        valid: true,
        hasToken: true,
        hasExpireTime: true
      });

      // Mock personal center endpoint
      mock.onGet('/user/download-history').reply(200, {
        code: 200,
        msg: 'success',
        data: { list: [], total: 0, pageNum: 1, pageSize: 12 }
      });

      const { get } = await import('@/utils/request');
      await get('/user/download-history', { pageNum: 1, pageSize: 12 });

      // validateTokenState should be called
      expect(security.validateTokenState).toHaveBeenCalled();
    });
  });

  /**
   * 测试场景3: 401错误恢复流程
   * Requirements: 1.4, 1.5
   */
  describe('401 Error Recovery Flow', () => {
    it('should attempt token refresh when receiving 401 with valid token', async () => {
      // Token exists and is not expired
      vi.mocked(security.getToken).mockReturnValue('test-token-123');
      vi.mocked(security.isTokenExpired).mockReturnValue(false);

      // Mock 401 response
      mock.onGet('/user/download-history').reply(401, {
        code: 401,
        msg: 'Unauthorized'
      });

      // Mock successful token refresh
      mock.onPost('/auth/refresh-token').reply(200, {
        code: 200,
        msg: 'success',
        data: { token: 'new-token-after-401' }
      });

      const { get } = await import('@/utils/request');
      
      await expect(get('/user/download-history', { pageNum: 1, pageSize: 12 }))
        .rejects.toThrow();

      // Wait for async handling
      await new Promise(resolve => setTimeout(resolve, 150));

      // Token should be refreshed
      expect(security.setToken).toHaveBeenCalledWith('new-token-after-401', false);
      expect(ElMessage.warning).toHaveBeenCalledWith('认证已更新，请重试操作');
    });

    it('should logout when token is expired and 401 is received', async () => {
      // Token is expired
      vi.mocked(security.isTokenExpired).mockReturnValue(true);

      // Request should be rejected in interceptor
      const { get } = await import('@/utils/request');
      
      await expect(get('/user/download-history', { pageNum: 1, pageSize: 12 }))
        .rejects.toThrow('Token expired');

      // Should trigger logout
      expect(security.removeToken).toHaveBeenCalled();
      expect(security.removeTokenExpireTime).toHaveBeenCalled();
    });

    it('should logout when token refresh fails after 401', async () => {
      // Token exists and is not expired
      vi.mocked(security.getToken).mockReturnValue('test-token-123');
      vi.mocked(security.isTokenExpired).mockReturnValue(false);

      // Mock 401 response
      mock.onGet('/user/download-history').reply(401, {
        code: 401,
        msg: 'Unauthorized'
      });

      // Mock failed token refresh
      mock.onPost('/auth/refresh-token').reply(200, {
        code: 401,
        msg: 'Token refresh failed'
      });

      const { get } = await import('@/utils/request');
      
      await expect(get('/user/download-history', { pageNum: 1, pageSize: 12 }))
        .rejects.toThrow();

      // Wait for async handling
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should trigger logout
      expect(security.removeToken).toHaveBeenCalled();
      expect(security.removeTokenExpireTime).toHaveBeenCalled();
      expect(ElMessage.error).toHaveBeenCalledWith('登录已过期，请重新登录');
    });

    it('should handle concurrent 401 errors with deduplication', async () => {
      // Token exists and is not expired
      vi.mocked(security.getToken).mockReturnValue('test-token-123');
      vi.mocked(security.isTokenExpired).mockReturnValue(false);

      // Mock 401 responses for multiple endpoints
      mock.onGet('/user/download-history').reply(401, { code: 401, msg: 'Unauthorized' });
      mock.onGet('/user/upload-history').reply(401, { code: 401, msg: 'Unauthorized' });
      mock.onGet('/user/vip-info').reply(401, { code: 401, msg: 'Unauthorized' });

      // Mock failed token refresh
      mock.onPost('/auth/refresh-token').reply(200, {
        code: 401,
        msg: 'Token refresh failed'
      });

      const { get } = await import('@/utils/request');
      
      // Send concurrent requests
      const promises = [
        get('/user/download-history', { pageNum: 1, pageSize: 12 }).catch(() => {}),
        get('/user/upload-history', { pageNum: 1, pageSize: 12 }).catch(() => {}),
        get('/user/vip-info').catch(() => {})
      ];

      await Promise.allSettled(promises);

      // Wait for async handling
      await new Promise(resolve => setTimeout(resolve, 200));

      // removeToken should only be called once (deduplication)
      expect(security.removeToken).toHaveBeenCalledTimes(1);
      expect(security.removeTokenExpireTime).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * 测试场景4: 个人中心Tab切换流程
   * Requirements: 4.1, 4.3
   */
  describe('Personal Center Tab Switching Flow', () => {
    it('should load data only when tab is switched', async () => {
      // Mock all personal center endpoints
      mock.onGet('/user/download-history').reply(200, {
        code: 200,
        msg: 'success',
        data: { list: [{ recordId: '1' }], total: 1, pageNum: 1, pageSize: 12 }
      });

      mock.onGet('/user/upload-history').reply(200, {
        code: 200,
        msg: 'success',
        data: { list: [{ recordId: '2' }], total: 1, pageNum: 1, pageSize: 12 }
      });

      mock.onGet('/user/vip-info').reply(200, {
        code: 200,
        msg: 'success',
        data: { vipLevel: 1, downloadLimit: 100, downloadUsed: 5 }
      });

      const { get } = await import('@/utils/request');

      // Initial load - download history
      const downloadResponse = await get('/user/download-history', { pageNum: 1, pageSize: 12 });
      expect(downloadResponse.code).toBe(200);
      expect(downloadResponse.data.list).toHaveLength(1);

      // Switch to upload tab
      const uploadResponse = await get('/user/upload-history', { pageNum: 1, pageSize: 12 });
      expect(uploadResponse.code).toBe(200);
      expect(uploadResponse.data.list).toHaveLength(1);

      // Switch to VIP tab
      const vipResponse = await get('/user/vip-info');
      expect(vipResponse.code).toBe(200);
      expect(vipResponse.data.vipLevel).toBe(1);

      // All requests should have been made with valid token
      expect(mock.history.get).toHaveLength(3);
    });

    it('should handle tab switch with network error gracefully', async () => {
      // First tab loads successfully
      mock.onGet('/user/download-history').reply(200, {
        code: 200,
        msg: 'success',
        data: { list: [], total: 0, pageNum: 1, pageSize: 12 }
      });

      // Second tab fails with network error
      mock.onGet('/user/upload-history').reply(500, {
        code: 500,
        msg: 'Server error'
      });

      const { get } = await import('@/utils/request');

      // First tab
      const downloadResponse = await get('/user/download-history', { pageNum: 1, pageSize: 12 });
      expect(downloadResponse.code).toBe(200);

      // Second tab - should fail but not logout
      await expect(get('/user/upload-history', { pageNum: 1, pageSize: 12 }))
        .rejects.toThrow();

      // Should not trigger logout
      expect(security.removeToken).not.toHaveBeenCalled();
      expect(ElMessage.error).toHaveBeenCalledWith('服务器错误，请稍后重试');
    });

    it('should maintain authentication across multiple tab switches', async () => {
      // Mock all endpoints
      mock.onGet('/user/download-history').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer test-token-123');
        return [200, { code: 200, data: { list: [], total: 0, pageNum: 1, pageSize: 12 } }];
      });

      mock.onGet('/user/upload-history').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer test-token-123');
        return [200, { code: 200, data: { list: [], total: 0, pageNum: 1, pageSize: 12 } }];
      });

      mock.onGet('/user/vip-info').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer test-token-123');
        return [200, { code: 200, data: { vipLevel: 0 } }];
      });

      const { get } = await import('@/utils/request');

      // Multiple tab switches
      await get('/user/download-history', { pageNum: 1, pageSize: 12 });
      await get('/user/upload-history', { pageNum: 1, pageSize: 12 });
      await get('/user/vip-info');
      await get('/user/download-history', { pageNum: 1, pageSize: 12 }); // Switch back

      // All requests should have valid authorization
      expect(mock.history.get).toHaveLength(4);
      // Should not trigger any logout
      expect(security.removeToken).not.toHaveBeenCalled();
    });
  });

  /**
   * 测试场景5: 多次访问个人中心不会退出登录
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   */
  describe('Multiple Personal Center Visits Without Logout', () => {
    it('should not logout after multiple successful visits', async () => {
      mock.onGet('/user/download-history').reply(200, {
        code: 200,
        msg: 'success',
        data: { list: [], total: 0, pageNum: 1, pageSize: 12 }
      });

      const { get } = await import('@/utils/request');

      // Simulate multiple visits
      for (let i = 0; i < 5; i++) {
        const response = await get('/user/download-history', { pageNum: 1, pageSize: 12 });
        expect(response.code).toBe(200);
      }

      // Should never trigger logout
      expect(security.removeToken).not.toHaveBeenCalled();
      expect(security.removeTokenExpireTime).not.toHaveBeenCalled();
      expect(ElMessage.error).not.toHaveBeenCalledWith('登录已过期，请重新登录');
    });

    it('should handle token state inconsistency without logout', async () => {
      // Token exists but expire time is missing
      vi.mocked(security.validateTokenState).mockReturnValue({
        valid: false,
        hasToken: true,
        hasExpireTime: false
      });

      mock.onGet('/user/download-history').reply(200, {
        code: 200,
        msg: 'success',
        data: { list: [], total: 0, pageNum: 1, pageSize: 12 }
      });

      const { get } = await import('@/utils/request');
      const response = await get('/user/download-history', { pageNum: 1, pageSize: 12 });

      expect(response.code).toBe(200);
      // Should fix the state by setting expire time
      expect(security.setTokenExpireTime).toHaveBeenCalled();
      // Should not logout
      expect(security.removeToken).not.toHaveBeenCalled();
    });

    it('should allow request when token does not exist (let backend handle)', async () => {
      // No token
      vi.mocked(security.getToken).mockReturnValue(undefined);

      mock.onGet('/user/download-history').reply(401, {
        code: 401,
        msg: 'Unauthorized'
      });

      const { get } = await import('@/utils/request');
      
      await expect(get('/user/download-history', { pageNum: 1, pageSize: 12 }))
        .rejects.toThrow();

      // Wait for async handling
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should show login expired message
      expect(ElMessage.error).toHaveBeenCalledWith('登录已过期，请重新登录');
    });
  });
});
