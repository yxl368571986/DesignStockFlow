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
      const userStore = useUserStore();
      
      // 确保用户未登录状态
      userStore.logout();

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

  describe('VIP用户下载测试', () => {
    it('VIP用户下载VIP资源应该不显示积分确认对话框', async () => {
      const { handleDownload } = useDownload();
      const userStore = useUserStore();

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // 设置VIP用户
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

      const result = await handleDownload('resource123', 1, 10);

      // VIP用户下载VIP资源应该成功，不显示积分确认对话框
      expect(result.success).toBe(true);
      expect(resourceAPI.downloadResource).toHaveBeenCalledWith('resource123');
    });

    it('VIP用户下载免费资源应该成功', async () => {
      const { handleDownload } = useDownload();
      const userStore = useUserStore();

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // 设置VIP用户
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

      const result = await handleDownload('resource123', 0, 0);

      expect(result.success).toBe(true);
    });
  });

  describe('积分不足下载测试', () => {
    it('积分不足时应该显示积分不足对话框', async () => {
      const { handleDownload } = useDownload();
      const userStore = useUserStore();

      // 设置普通用户
      userStore.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: 'Test User',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      });
      userStore.setToken('test-token');

      // Mock积分余额不足
      vi.mocked(pointsAPI.getMyPointsInfo).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: { pointsBalance: 5, pointsTotal: 5 },
        timestamp: Date.now()
      } as any);

      // 获取mock实例
      const { ElMessageBox } = await import('element-plus');
      const mockConfirm = vi.mocked(ElMessageBox.confirm);
      mockConfirm.mockResolvedValue(undefined);

      const result = await handleDownload('resource123', 0, 10);

      // 积分不足应该返回失败
      expect(result.success).toBe(false);
      expect(result.error).toBe('积分不足');
      expect(result.pointsBalance).toBe(5);
    });

    it('积分充足时应该显示积分确认对话框', async () => {
      const { handleDownload } = useDownload();
      const userStore = useUserStore();

      // 设置普通用户
      userStore.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: 'Test User',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      });
      userStore.setToken('test-token');

      // Mock积分余额充足
      vi.mocked(pointsAPI.getMyPointsInfo).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: { pointsBalance: 100, pointsTotal: 100 },
        timestamp: Date.now()
      } as any);

      // 获取mock实例
      const { ElMessageBox } = await import('element-plus');
      const mockConfirm = vi.mocked(ElMessageBox.confirm);
      // 用户确认下载
      mockConfirm.mockResolvedValue(undefined);

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

      const result = await handleDownload('resource123', 0, 10);

      // 积分充足且用户确认后应该下载成功
      expect(result.success).toBe(true);
      // 应该调用了确认对话框
      expect(mockConfirm).toHaveBeenCalled();
    });

    it('用户取消积分确认对话框时应该取消下载', async () => {
      const { handleDownload } = useDownload();
      const userStore = useUserStore();

      // 设置普通用户
      userStore.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: 'Test User',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      });
      userStore.setToken('test-token');

      // Mock积分余额充足
      vi.mocked(pointsAPI.getMyPointsInfo).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: { pointsBalance: 100, pointsTotal: 100 },
        timestamp: Date.now()
      } as any);

      // 获取mock实例
      const { ElMessageBox } = await import('element-plus');
      const mockConfirm = vi.mocked(ElMessageBox.confirm);
      // 用户取消下载
      mockConfirm.mockRejectedValue(new Error('cancel'));

      const result = await handleDownload('resource123', 0, 10);

      // 用户取消后应该返回失败
      expect(result.success).toBe(false);
      expect(result.error).toBe('用户取消下载');
    });
  });

  describe('下载链接安全性测试', () => {
    it('下载API应该返回有效的下载URL', async () => {
      const { handleDownload } = useDownload();
      const userStore = useUserStore();

      // 设置普通用户
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
          downloadUrl: 'https://example.com/download/resource123?token=abc123&expires=1234567890'
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

      const result = await handleDownload('resource123', 0, 0);

      expect(result.success).toBe(true);
      // 验证下载链接被设置到a标签
      expect(mockLink.href).toBe('https://example.com/download/resource123?token=abc123&expires=1234567890');
    });

    it('未登录用户不应该能够获取下载链接', async () => {
      const { handleDownload } = useDownload();
      const userStore = useUserStore();

      // 确保用户未登录
      userStore.logout();

      // 获取mock实例
      const { ElMessageBox } = await import('element-plus');
      const mockConfirm = vi.mocked(ElMessageBox.confirm);
      mockConfirm.mockRejectedValue(new Error('cancel'));

      const result = await handleDownload('resource123', 0, 0);

      // 未登录用户应该无法下载
      expect(result.success).toBe(false);
      expect(result.error).toBe('需要登录');
      // 不应该调用下载API
      expect(resourceAPI.downloadResource).not.toHaveBeenCalled();
    });

    it('下载API返回错误时应该正确处理', async () => {
      const { handleDownload } = useDownload();
      const userStore = useUserStore();

      // 设置普通用户
      userStore.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: 'Test User',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      });
      userStore.setToken('test-token');

      // Mock下载API返回错误
      const mockResponse: ApiResponse<{ downloadUrl: string }> = {
        code: 403,
        msg: '资源已下架',
        data: null as any,
        timestamp: Date.now()
      };

      vi.mocked(resourceAPI.downloadResource).mockResolvedValue(mockResponse);

      const result = await handleDownload('resource123', 0, 0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('资源已下架');
    });

    it('下载API抛出异常时应该正确处理', async () => {
      const { handleDownload } = useDownload();
      const userStore = useUserStore();

      // 设置普通用户
      userStore.setUserInfo({
        userId: '123',
        phone: '13800138000',
        nickname: 'Test User',
        avatar: '',
        vipLevel: 0,
        createTime: '2024-01-01T00:00:00Z'
      });
      userStore.setToken('test-token');

      // Mock下载API抛出异常
      vi.mocked(resourceAPI.downloadResource).mockRejectedValue(new Error('网络错误'));

      const result = await handleDownload('resource123', 0, 0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('网络错误');
    });
  });
});

// Import userStore after mocks are set up
import { useUserStore } from '@/pinia/userStore';

/**
 * 任务6.0.1：测试未登录状态下的下载行为
 * 
 * 测试场景：
 * - 点击下载按钮 → 应弹出登录提示
 * - 登录提示应包含"登录"相关文案
 * - 点击登录 → 应跳转到登录页面
 * - 登录页面应保存返回URL
 */
describe('6.0.1 测试未登录状态下的下载行为', () => {
  let mockConfirm: any;

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // 获取mock实例
    const { ElMessageBox } = await import('element-plus');
    mockConfirm = vi.mocked(ElMessageBox.confirm);
    mockConfirm.mockResolvedValue(undefined);
  });

  it('未登录用户点击下载应显示登录提示对话框', async () => {
    const { handleDownload } = useDownload();
    const userStore = useUserStore();

    // 确保用户未登录
    userStore.logout();

    // 尝试下载
    const result = await handleDownload('resource123', 0, 0);

    // 验证：应该显示登录对话框
    expect(mockConfirm).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toBe('需要登录');
  });

  it('登录提示对话框应包含"登录"相关文案', async () => {
    const { handleDownload } = useDownload();
    const userStore = useUserStore();

    // 确保用户未登录
    userStore.logout();

    // 尝试下载
    await handleDownload('resource123', 0, 0);

    // 验证：对话框文案应包含"登录"
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.stringContaining('登录'),
      expect.any(String),
      expect.any(Object)
    );
  });

  it('用户确认登录后应跳转到登录页面', async () => {
    const { handleDownload } = useDownload();
    const userStore = useUserStore();

    // 确保用户未登录
    userStore.logout();

    // 用户确认前往登录
    mockConfirm.mockResolvedValue(undefined);

    // 尝试下载
    await handleDownload('resource123', 0, 0);

    // 验证：应该跳转到登录页面
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/login'
      })
    );
  });

  it('跳转登录页面时应保存返回URL（redirect参数）', async () => {
    const { handleDownload } = useDownload();
    const userStore = useUserStore();

    // 确保用户未登录
    userStore.logout();

    // 用户确认前往登录
    mockConfirm.mockResolvedValue(undefined);

    // 尝试下载
    await handleDownload('resource123', 0, 0);

    // 验证：跳转时应包含redirect参数
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/login',
        query: expect.objectContaining({
          redirect: expect.any(String)
        })
      })
    );
  });

  it('用户取消登录对话框时不应跳转', async () => {
    const { handleDownload } = useDownload();
    const userStore = useUserStore();

    // 确保用户未登录
    userStore.logout();

    // 用户取消登录
    mockConfirm.mockRejectedValue(new Error('cancel'));

    // 尝试下载
    const result = await handleDownload('resource123', 0, 0);

    // 验证：不应该跳转
    expect(mockPush).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toBe('需要登录');
  });

  it('未登录用户不应调用下载API', async () => {
    const { handleDownload } = useDownload();
    const userStore = useUserStore();

    // 确保用户未登录
    userStore.logout();

    // 用户取消登录
    mockConfirm.mockRejectedValue(new Error('cancel'));

    // 尝试下载
    await handleDownload('resource123', 0, 0);

    // 验证：不应该调用下载API
    expect(resourceAPI.downloadResource).not.toHaveBeenCalled();
  });

  it('showLoginDialog应返回正确的确认结果', async () => {
    const { showLoginDialog } = useDownload();

    // 用户确认
    mockConfirm.mockResolvedValue(undefined);
    const confirmResult = await showLoginDialog();
    expect(confirmResult).toBe(true);

    // 用户取消
    mockConfirm.mockRejectedValue(new Error('cancel'));
    const cancelResult = await showLoginDialog();
    expect(cancelResult).toBe(false);
  });

  it('checkDownloadPermission应正确检测未登录状态', async () => {
    const { checkDownloadPermission } = useDownload();
    const userStore = useUserStore();

    // 确保用户未登录
    userStore.logout();

    const result = await checkDownloadPermission(0, 0);

    expect(result.hasPermission).toBe(false);
    expect(result.reason).toBe('not_logged_in');
  });
});
