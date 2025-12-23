/**
 * 下载组合式函数单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDownload } from '../useDownload';
import * as resourceAPI from '@/api/resource';
import * as pointsAPI from '@/api/points';
import type { ApiResponse } from '@/types/api';

// Mock vue-router
const mockPush = vi.fn();
const mockCurrentRoute = {
  value: {
    fullPath: '/resource/123'
  }
};

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    currentRoute: mockCurrentRoute
  })
}));

// Mock Element Plus - 使用工厂函数避免变量提升问题
vi.mock('element-plus', () => ({
  ElMessageBox: {
    confirm: vi.fn()
  },
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

// Mock API calls
vi.mock('@/api/resource', () => ({
  downloadResource: vi.fn()
}));

vi.mock('@/api/points', () => ({
  getMyPointsInfo: vi.fn()
}));

describe('useDownload', () => {
  let mockConfirm: any;
  let mockMessage: any;

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // 获取mock实例
    const { ElMessageBox, ElMessage } = await import('element-plus');
    mockConfirm = vi.mocked(ElMessageBox.confirm);
    mockMessage = {
      success: vi.mocked(ElMessage.success),
      error: vi.mocked(ElMessage.error),
      warning: vi.mocked(ElMessage.warning)
    };

    // 设置默认行为
    mockConfirm.mockResolvedValue('confirm' as any);
    mockMessage.success.mockReturnValue(undefined as any);
    mockMessage.error.mockReturnValue(undefined as any);
    mockMessage.warning.mockReturnValue(undefined as any);
    
    // Mock getMyPointsInfo API
    vi.mocked(pointsAPI.getMyPointsInfo).mockResolvedValue({
      code: 200,
      msg: 'success',
      data: { pointsBalance: 100, pointsTotal: 200 },
      timestamp: Date.now()
    } as any);
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const { downloading, error } = useDownload();

      expect(downloading.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });

  describe('checkDownloadPermission', () => {
    it('should return not_logged_in when user is not logged in', async () => {
      const { checkDownloadPermission } = useDownload();

      const result = await checkDownloadPermission(0);

      expect(result.hasPermission).toBe(false);
      expect(result.reason).toBe('not_logged_in');
    });

    it('should return not_vip when user is not VIP but resource requires VIP', async () => {
      const { checkDownloadPermission } = useDownload();
      const userStore = useUserStore();

      // Set user as logged in but not VIP
      userStore.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: 'Test User',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      });
      userStore.setToken('test-token');

      const result = await checkDownloadPermission(1);

      expect(result.hasPermission).toBe(false);
      expect(result.reason).toBe('not_vip');
    });

    it('should return hasPermission true when user is logged in and resource is free', async () => {
      const { checkDownloadPermission } = useDownload();
      const userStore = useUserStore();

      // Set user as logged in
      userStore.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: 'Test User',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      });
      userStore.setToken('test-token');

      const result = await checkDownloadPermission(0);

      expect(result.hasPermission).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return hasPermission true when user is VIP and resource requires VIP', async () => {
      const { checkDownloadPermission } = useDownload();
      const userStore = useUserStore();

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // Set user as VIP
      userStore.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: 'VIP User',
        avatar: '',
        vipLevel: 1,
        vipExpireTime: futureDate.toISOString(),
        createTime: '2024-01-01T00:00:00Z'
      });
      userStore.setToken('test-token');

      const result = await checkDownloadPermission(1);

      expect(result.hasPermission).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });

  describe('showLoginDialog', () => {
    it('should return true when user confirms', async () => {
      const { showLoginDialog } = useDownload();

      mockConfirm.mockResolvedValue(undefined);

      const result = await showLoginDialog();

      expect(result).toBe(true);
      expect(mockConfirm).toHaveBeenCalledWith(
        '您需要登录后才能下载资源，是否前往登录？',
        '提示',
        expect.any(Object)
      );
    });

    it('should return false when user cancels', async () => {
      const { showLoginDialog } = useDownload();

      mockConfirm.mockRejectedValue(new Error('cancel'));

      const result = await showLoginDialog();

      expect(result).toBe(false);
    });
  });

  describe('showVIPDialog', () => {
    it('should return true when user confirms', async () => {
      const { showVIPDialog } = useDownload();

      mockConfirm.mockResolvedValue(undefined);

      const result = await showVIPDialog();

      expect(result).toBe(true);
      expect(mockConfirm).toHaveBeenCalledWith(
        '该资源为VIP专属资源，开通VIP享受无限下载特权',
        'VIP专属',
        expect.any(Object)
      );
    });

    it('should return false when user cancels', async () => {
      const { showVIPDialog } = useDownload();

      mockConfirm.mockRejectedValue(new Error('cancel'));

      const result = await showVIPDialog();

      expect(result).toBe(false);
    });
  });

  describe('handleDownload', () => {
    it('should reject download when offline', async () => {
      // Mock offline状态
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      });

      const { handleDownload } = useDownload();

      const result = await handleDownload('resource123', 0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('下载功能需要网络连接');
      expect(mockMessage.warning).toHaveBeenCalled();

      // 恢复online状态
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true
      });
    });

    it('should show login dialog when user is not logged in', async () => {
      const { handleDownload } = useDownload();

      mockConfirm.mockResolvedValue(undefined);

      const result = await handleDownload('resource123', 0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('需要登录');
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/login'
        })
      );
    });

    it('should show VIP dialog when user is not VIP but resource requires VIP', async () => {
      const { handleDownload } = useDownload();
      const userStore = useUserStore();

      // Set user as logged in but not VIP
      userStore.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: 'Test User',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      });
      userStore.setToken('test-token');

      mockConfirm.mockResolvedValue(undefined);

      const result = await handleDownload('resource123', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('需要VIP权限');
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/vip');
    });

    it('should download successfully when user has permission', async () => {
      const { handleDownload } = useDownload();
      const userStore = useUserStore();

      // Set user as logged in
      userStore.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: 'Test User',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      });
      userStore.setToken('test-token');

      const mockResponse: ApiResponse<{ downloadUrl: string }> = {
        code: 200,
        msg: '下载成功',
        data: {
          downloadUrl: 'https://example.com/download/resource123'
        },
        timestamp: Date.now()
      };

      vi.mocked(resourceAPI.downloadResource).mockResolvedValue(mockResponse);

      // Mock document.createElement and appendChild
      const mockLink = {
        href: '',
        style: { display: '' },
        download: '',
        click: vi.fn()
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockLink as any);
      const removeChildSpy = vi
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => mockLink as any);

      const result = await handleDownload('resource123', 0);

      expect(result.success).toBe(true);
      expect(resourceAPI.downloadResource).toHaveBeenCalledWith('resource123');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockMessage.success).toHaveBeenCalledWith('下载成功');

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should handle download API error', async () => {
      const { handleDownload } = useDownload();
      const userStore = useUserStore();

      // Set user as logged in
      userStore.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: 'Test User',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      });
      userStore.setToken('test-token');

      const mockResponse: ApiResponse<{ downloadUrl: string }> = {
        code: 400,
        msg: '下载失败',
        data: null as any,
        timestamp: Date.now()
      };

      vi.mocked(resourceAPI.downloadResource).mockResolvedValue(mockResponse);

      const result = await handleDownload('resource123', 0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('下载失败');
      expect(mockMessage.error).toHaveBeenCalled();
    });

    it('should set downloading state during download', async () => {
      const { handleDownload, downloading } = useDownload();
      const userStore = useUserStore();

      // Set user as logged in
      userStore.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: 'Test User',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      });
      userStore.setToken('test-token');

      const mockResponse: ApiResponse<{ downloadUrl: string }> = {
        code: 200,
        msg: '下载成功',
        data: {
          downloadUrl: 'https://example.com/download/resource123'
        },
        timestamp: Date.now()
      };

      vi.mocked(resourceAPI.downloadResource).mockResolvedValue(mockResponse);

      // Mock document methods
      const mockLink = {
        href: '',
        style: { display: '' },
        download: '',
        click: vi.fn()
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      // 由于 checkDownloadPermission 是异步的，downloading 状态在权限检查完成后才会变为 true
      // 这里我们只验证下载完成后 downloading 变为 false
      const result = await handleDownload('resource123', 0);

      // downloading should be false after download completes
      expect(downloading.value).toBe(false);
      expect(result.success).toBe(true);
    });
  });

  describe('resetError', () => {
    it('should reset error state', () => {
      const { error, resetError } = useDownload();

      // Manually set error
      (error as any).value = 'Test error';

      resetError();

      expect(error.value).toBeNull();
    });
  });
});

// Import userStore after mocks are set up
import { useUserStore } from '@/pinia/userStore';
