/**
 * VipDownloadButton组件单元测试
 * 测试VIP下载按钮的不同状态和交互
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import VipDownloadButton from '../VipDownloadButton.vue';

// Mock vue-router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    currentRoute: {
      value: {
        fullPath: '/resource/123'
      }
    }
  })
}));

// Mock Element Plus
vi.mock('element-plus', async () => {
  return {
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    },
    ElButton: {
      name: 'ElButton',
      template: '<button :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
      props: ['type', 'size', 'loading']
    },
    ElIcon: {
      name: 'ElIcon',
      template: '<span><slot /></span>'
    }
  };
});

// Mock stores
const mockVipStore = {
  isValidVip: false
};

const mockUserStore = {
  isLoggedIn: false
};

vi.mock('@/pinia/vipStore', () => ({
  useVipStore: () => mockVipStore
}));

vi.mock('@/pinia/userStore', () => ({
  useUserStore: () => mockUserStore
}));

// Mock API
const mockCheckDownloadPermission = vi.fn();
vi.mock('@/api/vip', () => ({
  checkDownloadPermission: (resourceId: string) => mockCheckDownloadPermission(resourceId)
}));

describe('VipDownloadButton', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    // 重置store状态
    mockVipStore.isValidVip = false;
    mockUserStore.isLoggedIn = false;
  });

  describe('按钮文本显示', () => {
    it('未登录时应该显示"登录后下载"', () => {
      mockUserStore.isLoggedIn = false;

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      expect(wrapper.find('button').text()).toContain('登录后下载');
    });

    it('已登录非VIP用户应该显示"开通VIP下载"', () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = false;

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      expect(wrapper.find('button').text()).toContain('开通VIP下载');
    });

    it('VIP用户应该显示"VIP免费下载"', () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = true;

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      expect(wrapper.find('button').text()).toContain('VIP免费下载');
    });

    it('免费资源应该显示"免费下载"', () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = false;

      const wrapper = mount(VipDownloadButton, {
        props: { 
          resourceId: 'res-001',
          isFree: true
        }
      });

      expect(wrapper.find('button').text()).toContain('免费下载');
    });
  });

  describe('按钮类型', () => {
    it('未登录时按钮类型应该是info', () => {
      mockUserStore.isLoggedIn = false;

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      // 检查传递给ElButton的type prop
      expect(wrapper.findComponent({ name: 'ElButton' }).props('type')).toBe('info');
    });

    it('VIP用户按钮类型应该是primary', () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = true;

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      expect(wrapper.findComponent({ name: 'ElButton' }).props('type')).toBe('primary');
    });

    it('非VIP用户按钮类型应该是warning', () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = false;

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      expect(wrapper.findComponent({ name: 'ElButton' }).props('type')).toBe('warning');
    });

    it('免费资源按钮类型应该是primary', () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = false;

      const wrapper = mount(VipDownloadButton, {
        props: { 
          resourceId: 'res-001',
          isFree: true
        }
      });

      expect(wrapper.findComponent({ name: 'ElButton' }).props('type')).toBe('primary');
    });
  });

  describe('点击行为', () => {
    it('未登录时点击应该跳转到登录页', async () => {
      mockUserStore.isLoggedIn = false;

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      await wrapper.find('button').trigger('click');

      expect(mockPush).toHaveBeenCalledWith({
        path: '/login',
        query: { redirect: '/resource/123' }
      });
    });

    it('非VIP用户点击应该跳转到VIP中心', async () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = false;

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      await wrapper.find('button').trigger('click');

      expect(mockPush).toHaveBeenCalledWith({
        path: '/vip',
        query: { source: 'res-001' }
      });
    });

    it('VIP用户点击应该检查权限并触发下载', async () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = true;

      mockCheckDownloadPermission.mockResolvedValue({
        code: 200,
        data: {
          canDownload: true,
          remainingDownloads: 45,
          dailyLimit: 50
        }
      });

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      await wrapper.find('button').trigger('click');
      await flushPromises();

      expect(mockCheckDownloadPermission).toHaveBeenCalledWith('res-001');
      expect(wrapper.emitted('download')).toBeTruthy();
      expect(wrapper.emitted('download')![0]).toEqual(['res-001']);
    });

    it('下载权限不足时应该显示警告', async () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = true;

      mockCheckDownloadPermission.mockResolvedValue({
        code: 200,
        data: {
          canDownload: false,
          reason: '今日下载次数已用完',
          remainingDownloads: 0,
          dailyLimit: 50
        }
      });

      const { ElMessage } = await import('element-plus');

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      await wrapper.find('button').trigger('click');
      await flushPromises();

      expect(ElMessage.warning).toHaveBeenCalledWith('今日下载次数已用完');
      expect(wrapper.emitted('download')).toBeFalsy();
    });
  });

  describe('下载次数显示', () => {
    it('showCount为true时应该显示下载次数', async () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = true;

      mockCheckDownloadPermission.mockResolvedValue({
        code: 200,
        data: {
          canDownload: true,
          remainingDownloads: 45,
          dailyLimit: 50
        }
      });

      const wrapper = mount(VipDownloadButton, {
        props: { 
          resourceId: 'res-001',
          showCount: true
        }
      });

      // 等待onMounted中的checkPermission完成
      await flushPromises();

      const countText = wrapper.find('.download-count');
      expect(countText.exists()).toBe(true);
      expect(countText.text()).toContain('45');
      expect(countText.text()).toContain('50');
    });

    it('showCount为false时不应该显示下载次数', async () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = true;

      mockCheckDownloadPermission.mockResolvedValue({
        code: 200,
        data: {
          canDownload: true,
          remainingDownloads: 45,
          dailyLimit: 50
        }
      });

      const wrapper = mount(VipDownloadButton, {
        props: { 
          resourceId: 'res-001',
          showCount: false
        }
      });

      await flushPromises();

      expect(wrapper.find('.download-count').exists()).toBe(false);
    });
  });

  describe('VIP提示显示', () => {
    it('非VIP用户应该显示VIP提示', () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = false;

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      expect(wrapper.find('.vip-tip').exists()).toBe(true);
      expect(wrapper.find('.tip-text').text()).toContain('开通VIP');
    });

    it('VIP用户不应该显示VIP提示', () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = true;

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      expect(wrapper.find('.vip-tip').exists()).toBe(false);
    });

    it('免费资源不应该显示VIP提示', () => {
      mockUserStore.isLoggedIn = true;
      mockVipStore.isValidVip = false;

      const wrapper = mount(VipDownloadButton, {
        props: { 
          resourceId: 'res-001',
          isFree: true
        }
      });

      expect(wrapper.find('.vip-tip').exists()).toBe(false);
    });
  });

  describe('按钮尺寸', () => {
    it('默认尺寸应该是default', () => {
      mockUserStore.isLoggedIn = true;

      const wrapper = mount(VipDownloadButton, {
        props: { resourceId: 'res-001' }
      });

      expect(wrapper.findComponent({ name: 'ElButton' }).props('size')).toBe('default');
    });

    it('应该支持small尺寸', () => {
      mockUserStore.isLoggedIn = true;

      const wrapper = mount(VipDownloadButton, {
        props: { 
          resourceId: 'res-001',
          size: 'small'
        }
      });

      expect(wrapper.findComponent({ name: 'ElButton' }).props('size')).toBe('small');
    });

    it('应该支持large尺寸', () => {
      mockUserStore.isLoggedIn = true;

      const wrapper = mount(VipDownloadButton, {
        props: { 
          resourceId: 'res-001',
          size: 'large'
        }
      });

      expect(wrapper.findComponent({ name: 'ElButton' }).props('size')).toBe('large');
    });
  });
});
