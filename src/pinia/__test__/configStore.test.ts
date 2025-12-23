/**
 * configStore 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useConfigStore } from '../configStore';
import * as contentAPI from '@/api/content';
import type { SiteConfig, BannerInfo, CategoryInfo, AnnouncementInfo } from '@/types/models';

// Mock API模块
vi.mock('@/api/content');

describe('configStore', () => {
  beforeEach(() => {
    // 每个测试前创建新的Pinia实例
    setActivePinia(createPinia());
    // 清除所有mock
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const store = useConfigStore();

      expect(store.siteConfig).toBeNull();
      expect(store.banners).toEqual([]);
      expect(store.categories).toEqual([]);
      expect(store.announcements).toEqual([]);
      expect(store.loading).toEqual({
        siteConfig: false,
        banners: false,
        categories: false,
        announcements: false
      });
      expect(store.error).toEqual({
        siteConfig: null,
        banners: null,
        categories: null,
        announcements: null
      });
    });
  });

  describe('fetchSiteConfig', () => {
    it('应该成功获取网站配置', async () => {
      const store = useConfigStore();
      const mockConfig: SiteConfig = {
        siteName: '星潮设计',
        logoUrl: 'https://example.com/logo.png',
        faviconUrl: 'https://example.com/favicon.ico',
        copyright: '© 2024 星潮设计',
        icp: '京ICP备12345678号',
        seoTitle: '星潮设计 - 专业设计资源平台',
        seoKeywords: '设计,资源,PSD,AI',
        seoDescription: '专业的设计资源分享平台',
        watermarkText: '星潮设计',
        watermarkOpacity: 0.6
      };

      vi.mocked(contentAPI.getSiteConfig).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockConfig,
        timestamp: Date.now()
      });

      await store.fetchSiteConfig();

      expect(store.siteConfig).toEqual(mockConfig);
      expect(store.loading.siteConfig).toBe(false);
      expect(store.error.siteConfig).toBeNull();
      expect(contentAPI.getSiteConfig).toHaveBeenCalledTimes(1);
    });

    it('应该处理获取配置失败的情况', async () => {
      const store = useConfigStore();

      vi.mocked(contentAPI.getSiteConfig).mockRejectedValue(new Error('Network error'));

      await expect(store.fetchSiteConfig()).rejects.toThrow('Network error');
      expect(store.siteConfig).toBeNull();
      expect(store.loading.siteConfig).toBe(false);
      expect(store.error.siteConfig).toBe('Network error');
    });

    it('应该使用缓存避免重复请求', async () => {
      const store = useConfigStore();
      const mockConfig: SiteConfig = {
        siteName: '星潮设计',
        logoUrl: 'https://example.com/logo.png',
        faviconUrl: 'https://example.com/favicon.ico',
        copyright: '© 2024 星潮设计',
        icp: '京ICP备12345678号',
        seoTitle: '星潮设计',
        seoKeywords: '设计',
        seoDescription: '设计资源平台',
        watermarkText: '星潮设计',
        watermarkOpacity: 0.6
      };

      vi.mocked(contentAPI.getSiteConfig).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockConfig,
        timestamp: Date.now()
      });

      // 第一次调用
      await store.fetchSiteConfig();
      expect(contentAPI.getSiteConfig).toHaveBeenCalledTimes(1);

      // 第二次调用应该使用缓存
      await store.fetchSiteConfig();
      expect(contentAPI.getSiteConfig).toHaveBeenCalledTimes(1);
    });

    it('应该在forceRefresh为true时忽略缓存', async () => {
      const store = useConfigStore();
      const mockConfig: SiteConfig = {
        siteName: '星潮设计',
        logoUrl: 'https://example.com/logo.png',
        faviconUrl: 'https://example.com/favicon.ico',
        copyright: '© 2024 星潮设计',
        icp: '京ICP备12345678号',
        seoTitle: '星潮设计',
        seoKeywords: '设计',
        seoDescription: '设计资源平台',
        watermarkText: '星潮设计',
        watermarkOpacity: 0.6
      };

      vi.mocked(contentAPI.getSiteConfig).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockConfig,
        timestamp: Date.now()
      });

      // 第一次调用
      await store.fetchSiteConfig();
      expect(contentAPI.getSiteConfig).toHaveBeenCalledTimes(1);

      // 强制刷新
      await store.fetchSiteConfig(true);
      expect(contentAPI.getSiteConfig).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchBanners', () => {
    it('应该成功获取轮播图列表', async () => {
      const store = useConfigStore();
      const mockBanners: BannerInfo[] = [
        {
          bannerId: '1',
          title: '轮播图1',
          imageUrl: 'https://example.com/banner1.jpg',
          linkType: 'internal',
          linkUrl: '/category/ui',
          sort: 1,
          status: 1,
          startTime: '2024-01-01T00:00:00Z',
          endTime: '2024-12-31T23:59:59Z'
        },
        {
          bannerId: '2',
          title: '轮播图2',
          imageUrl: 'https://example.com/banner2.jpg',
          linkType: 'external',
          linkUrl: 'https://example.com',
          sort: 2,
          status: 1
        }
      ];

      vi.mocked(contentAPI.getBanners).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockBanners,
        timestamp: Date.now()
      });

      await store.fetchBanners();

      expect(store.banners).toEqual(mockBanners);
      expect(store.loading.banners).toBe(false);
      expect(store.error.banners).toBeNull();
    });

    it('应该使用缓存（5分钟TTL）', async () => {
      const store = useConfigStore();
      const mockBanners: BannerInfo[] = [
        {
          bannerId: '1',
          title: '轮播图1',
          imageUrl: 'https://example.com/banner1.jpg',
          linkType: 'internal',
          linkUrl: '/category/ui',
          sort: 1,
          status: 1
        }
      ];

      vi.mocked(contentAPI.getBanners).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockBanners,
        timestamp: Date.now()
      });

      await store.fetchBanners();
      await store.fetchBanners();

      expect(contentAPI.getBanners).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchCategories', () => {
    it('应该成功获取分类列表', async () => {
      const store = useConfigStore();
      const mockCategories: CategoryInfo[] = [
        {
          categoryId: 'ui-design',
          categoryName: 'UI设计',
          icon: 'icon-ui',
          sort: 1,
          isHot: true,
          isRecommend: true,
          resourceCount: 100
        },
        {
          categoryId: 'illustration',
          categoryName: '插画',
          icon: 'icon-illustration',
          sort: 2,
          isHot: false,
          isRecommend: true,
          resourceCount: 50
        }
      ];

      vi.mocked(contentAPI.getCategories).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockCategories,
        timestamp: Date.now()
      });

      await store.fetchCategories();

      expect(store.categories).toEqual(mockCategories);
      expect(store.loading.categories).toBe(false);
      expect(store.error.categories).toBeNull();
    });
  });

  describe('fetchAnnouncements', () => {
    it('应该成功获取公告列表', async () => {
      const store = useConfigStore();
      const mockAnnouncements: AnnouncementInfo[] = [
        {
          announcementId: '1',
          title: '重要公告',
          content: '系统维护通知',
          type: 'important',
          level: 'important',
          isTop: true,
          status: 1,
          createTime: '2024-01-01T00:00:00Z'
        }
      ];

      vi.mocked(contentAPI.getAnnouncements).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockAnnouncements,
        timestamp: Date.now()
      });

      await store.fetchAnnouncements();

      expect(store.announcements).toEqual(mockAnnouncements);
      expect(store.loading.announcements).toBe(false);
      expect(store.error.announcements).toBeNull();
    });
  });

  describe('initConfig', () => {
    it('应该并行加载所有配置', async () => {
      const store = useConfigStore();

      vi.mocked(contentAPI.getSiteConfig).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: {
          siteName: '星潮设计',
          logoUrl: '',
          faviconUrl: '',
          copyright: '',
          icp: '',
          seoTitle: '',
          seoKeywords: '',
          seoDescription: '',
          watermarkText: '',
          watermarkOpacity: 0.6
        },
        timestamp: Date.now()
      });

      vi.mocked(contentAPI.getBanners).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: [],
        timestamp: Date.now()
      });

      vi.mocked(contentAPI.getCategories).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: [],
        timestamp: Date.now()
      });

      vi.mocked(contentAPI.getAnnouncements).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: [],
        timestamp: Date.now()
      });

      await store.initConfig();

      expect(contentAPI.getSiteConfig).toHaveBeenCalledTimes(1);
      expect(contentAPI.getBanners).toHaveBeenCalledTimes(1);
      expect(contentAPI.getCategories).toHaveBeenCalledTimes(1);
      expect(contentAPI.getAnnouncements).toHaveBeenCalledTimes(1);
    });

    it('应该处理部分配置加载失败的情况', async () => {
      const store = useConfigStore();

      vi.mocked(contentAPI.getSiteConfig).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: {
          siteName: '星潮设计',
          logoUrl: '',
          faviconUrl: '',
          copyright: '',
          icp: '',
          seoTitle: '',
          seoKeywords: '',
          seoDescription: '',
          watermarkText: '',
          watermarkOpacity: 0.6
        },
        timestamp: Date.now()
      });

      vi.mocked(contentAPI.getBanners).mockRejectedValue(new Error('Failed to fetch banners'));

      vi.mocked(contentAPI.getCategories).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: [],
        timestamp: Date.now()
      });

      vi.mocked(contentAPI.getAnnouncements).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: [],
        timestamp: Date.now()
      });

      // 不应该抛出错误
      await expect(store.initConfig()).resolves.toBeUndefined();
    });
  });

  describe('计算属性', () => {
    it('activeBanners应该过滤出激活的轮播图', async () => {
      const store = useConfigStore();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockBanners: BannerInfo[] = [
        {
          bannerId: '1',
          title: '激活的轮播图',
          imageUrl: 'https://example.com/banner1.jpg',
          linkType: 'internal',
          linkUrl: '/category/ui',
          sort: 1,
          status: 1,
          startTime: yesterday.toISOString(),
          endTime: tomorrow.toISOString()
        },
        {
          bannerId: '2',
          title: '禁用的轮播图',
          imageUrl: 'https://example.com/banner2.jpg',
          linkType: 'internal',
          linkUrl: '/category/ui',
          sort: 2,
          status: 0
        },
        {
          bannerId: '3',
          title: '过期的轮播图',
          imageUrl: 'https://example.com/banner3.jpg',
          linkType: 'internal',
          linkUrl: '/category/ui',
          sort: 3,
          status: 1,
          startTime: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
          endTime: yesterday.toISOString()
        }
      ];

      vi.mocked(contentAPI.getBanners).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockBanners,
        timestamp: Date.now()
      });

      await store.fetchBanners();

      expect(store.activeBanners).toHaveLength(1);
      expect(store.activeBanners[0].bannerId).toBe('1');
    });

    it('primaryCategories应该返回一级分类', async () => {
      const store = useConfigStore();
      const mockCategories: CategoryInfo[] = [
        {
          categoryId: 'ui-design',
          categoryName: 'UI设计',
          sort: 1,
          isHot: true,
          isRecommend: true,
          resourceCount: 100
        },
        {
          categoryId: 'ui-mobile',
          categoryName: '移动端UI',
          parentId: 'ui-design',
          sort: 1,
          isHot: false,
          isRecommend: false,
          resourceCount: 50
        }
      ];

      vi.mocked(contentAPI.getCategories).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockCategories,
        timestamp: Date.now()
      });

      await store.fetchCategories();

      expect(store.primaryCategories).toHaveLength(1);
      expect(store.primaryCategories[0].categoryId).toBe('ui-design');
    });

    it('hotCategories应该返回热门分类', async () => {
      const store = useConfigStore();
      const mockCategories: CategoryInfo[] = [
        {
          categoryId: 'ui-design',
          categoryName: 'UI设计',
          sort: 1,
          isHot: true,
          isRecommend: true,
          resourceCount: 100
        },
        {
          categoryId: 'illustration',
          categoryName: '插画',
          sort: 2,
          isHot: false,
          isRecommend: true,
          resourceCount: 50
        }
      ];

      vi.mocked(contentAPI.getCategories).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockCategories,
        timestamp: Date.now()
      });

      await store.fetchCategories();

      expect(store.hotCategories).toHaveLength(1);
      expect(store.hotCategories[0].categoryId).toBe('ui-design');
    });

    it('importantAnnouncements应该返回重要公告', async () => {
      const store = useConfigStore();
      const mockAnnouncements: AnnouncementInfo[] = [
        {
          announcementId: '1',
          title: '置顶公告',
          content: '重要通知',
          type: 'important',
          level: 'important',
          isTop: true,
          status: 1,
          createTime: '2024-01-02T00:00:00Z'
        },
        {
          announcementId: '2',
          title: '普通公告',
          content: '普通通知',
          type: 'normal',
          level: 'normal',
          isTop: false,
          status: 1,
          createTime: '2024-01-01T00:00:00Z'
        }
      ];

      vi.mocked(contentAPI.getAnnouncements).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockAnnouncements,
        timestamp: Date.now()
      });

      await store.fetchAnnouncements();

      expect(store.importantAnnouncements).toHaveLength(1);
      expect(store.importantAnnouncements[0].announcementId).toBe('1');
    });

    it('getSubCategories应该返回子分类', async () => {
      const store = useConfigStore();
      const mockCategories: CategoryInfo[] = [
        {
          categoryId: 'ui-design',
          categoryName: 'UI设计',
          sort: 1,
          isHot: true,
          isRecommend: true,
          resourceCount: 100
        },
        {
          categoryId: 'ui-mobile',
          categoryName: '移动端UI',
          parentId: 'ui-design',
          sort: 1,
          isHot: false,
          isRecommend: false,
          resourceCount: 50
        },
        {
          categoryId: 'ui-web',
          categoryName: 'Web UI',
          parentId: 'ui-design',
          sort: 2,
          isHot: false,
          isRecommend: false,
          resourceCount: 30
        }
      ];

      vi.mocked(contentAPI.getCategories).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockCategories,
        timestamp: Date.now()
      });

      await store.fetchCategories();

      const subCategories = store.getSubCategories('ui-design');
      expect(subCategories).toHaveLength(2);
      expect(subCategories[0].categoryId).toBe('ui-mobile');
      expect(subCategories[1].categoryId).toBe('ui-web');
    });

    it('getCategoryById应该返回指定分类', async () => {
      const store = useConfigStore();
      const mockCategories: CategoryInfo[] = [
        {
          categoryId: 'ui-design',
          categoryName: 'UI设计',
          sort: 1,
          isHot: true,
          isRecommend: true,
          resourceCount: 100
        }
      ];

      vi.mocked(contentAPI.getCategories).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: mockCategories,
        timestamp: Date.now()
      });

      await store.fetchCategories();

      const category = store.getCategoryById('ui-design');
      expect(category).toBeDefined();
      expect(category?.categoryName).toBe('UI设计');
    });
  });

  describe('缓存管理', () => {
    it('clearCache应该清除指定缓存', async () => {
      const store = useConfigStore();

      vi.mocked(contentAPI.getBanners).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: [],
        timestamp: Date.now()
      });

      // 第一次调用
      await store.fetchBanners();
      expect(contentAPI.getBanners).toHaveBeenCalledTimes(1);

      // 清除缓存
      store.clearCache('BANNERS');

      // 再次调用应该重新请求
      await store.fetchBanners();
      expect(contentAPI.getBanners).toHaveBeenCalledTimes(2);
    });

    it('clearAllCache应该清除所有缓存', async () => {
      const store = useConfigStore();

      vi.mocked(contentAPI.getBanners).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: [],
        timestamp: Date.now()
      });

      vi.mocked(contentAPI.getCategories).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: [],
        timestamp: Date.now()
      });

      await store.fetchBanners();
      await store.fetchCategories();

      store.clearAllCache();

      await store.fetchBanners();
      await store.fetchCategories();

      expect(contentAPI.getBanners).toHaveBeenCalledTimes(2);
      expect(contentAPI.getCategories).toHaveBeenCalledTimes(2);
    });
  });

  describe('reset', () => {
    it('应该重置所有状态', async () => {
      const store = useConfigStore();

      vi.mocked(contentAPI.getSiteConfig).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: {
          siteName: '星潮设计',
          logoUrl: '',
          faviconUrl: '',
          copyright: '',
          icp: '',
          seoTitle: '',
          seoKeywords: '',
          seoDescription: '',
          watermarkText: '',
          watermarkOpacity: 0.6
        },
        timestamp: Date.now()
      });

      await store.fetchSiteConfig();
      expect(store.siteConfig).not.toBeNull();

      store.reset();

      expect(store.siteConfig).toBeNull();
      expect(store.banners).toEqual([]);
      expect(store.categories).toEqual([]);
      expect(store.announcements).toEqual([]);
    });
  });
});
