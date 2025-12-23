/**
 * 配置状态管理 Store
 * 管理网站配置、轮播图、分类、公告等内容
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SiteConfig, BannerInfo, CategoryInfo, AnnouncementInfo } from '@/types/models';
import {
  getSiteConfig as getSiteConfigAPI,
  getBanners as getBannersAPI,
  getCategories as getCategoriesAPI,
  getAnnouncements as getAnnouncementsAPI
} from '@/api/content';

// 缓存配置
interface CacheConfig {
  data: any;
  timestamp: number;
  ttl: number; // 缓存有效期（毫秒）
}

// 缓存管理器
class CacheManager {
  private cache: Map<string, CacheConfig> = new Map();

  /**
   * 设置缓存
   */
  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 获取缓存
   * @returns 缓存数据，如果过期或不存在则返回null
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - cached.timestamp > cached.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 清除指定缓存
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清除所有缓存
   */
  clearAll(): void {
    this.cache.clear();
  }
}

// 缓存键名常量
const CACHE_KEYS = {
  SITE_CONFIG: 'site_config',
  BANNERS: 'banners',
  CATEGORIES: 'categories',
  ANNOUNCEMENTS: 'announcements'
};

// 缓存有效期（毫秒）
const CACHE_TTL = {
  SITE_CONFIG: 30 * 60 * 1000, // 30分钟
  BANNERS: 5 * 60 * 1000, // 5分钟
  CATEGORIES: 10 * 60 * 1000, // 10分钟
  ANNOUNCEMENTS: 5 * 60 * 1000 // 5分钟
};

export const useConfigStore = defineStore('config', () => {
  // ========== 缓存管理器 ==========
  const cacheManager = new CacheManager();

  // ========== 状态 (State) ==========

  /**
   * 网站配置
   */
  const siteConfig = ref<SiteConfig | null>(null);

  /**
   * 轮播图列表
   */
  const banners = ref<BannerInfo[]>([]);

  /**
   * 分类列表
   */
  const categories = ref<CategoryInfo[]>([]);

  /**
   * 公告列表
   */
  const announcements = ref<AnnouncementInfo[]>([]);

  /**
   * 加载状态
   */
  const loading = ref({
    siteConfig: false,
    banners: false,
    categories: false,
    announcements: false
  });

  /**
   * 错误信息
   */
  const error = ref({
    siteConfig: null as string | null,
    banners: null as string | null,
    categories: null as string | null,
    announcements: null as string | null
  });

  // ========== 计算属性 (Getters) ==========

  /**
   * 激活的轮播图（状态为启用且在有效期内）
   */
  const activeBanners = computed(() => {
    const now = new Date().getTime();
    return banners.value
      .filter((banner) => {
        // 状态必须为启用
        if (banner.status !== 1) {
          return false;
        }

        // 检查时间范围
        if (banner.startTime && banner.endTime) {
          const startTime = new Date(banner.startTime).getTime();
          const endTime = new Date(banner.endTime).getTime();
          return now >= startTime && now <= endTime;
        }

        return true;
      })
      .sort((a, b) => a.sort - b.sort);
  });

  /**
   * 一级分类列表
   */
  const primaryCategories = computed(() => {
    return categories.value.filter((cat) => !cat.parentId).sort((a, b) => a.sort - b.sort);
  });

  /**
   * 热门分类列表
   */
  const hotCategories = computed(() => {
    return categories.value.filter((cat) => cat.isHot).sort((a, b) => a.sort - b.sort);
  });

  /**
   * 推荐分类列表
   */
  const recommendedCategories = computed(() => {
    return categories.value.filter((cat) => cat.isRecommend).sort((a, b) => a.sort - b.sort);
  });

  /**
   * 重要公告列表（置顶或重要级别）
   */
  const importantAnnouncements = computed(() => {
    return announcements.value
      .filter((ann) => ann.status === 1 && (ann.isTop || ann.level === 'important'))
      .sort((a, b) => {
        // 置顶优先
        if (a.isTop && !b.isTop) return -1;
        if (!a.isTop && b.isTop) return 1;
        // 按创建时间倒序
        return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
      });
  });

  /**
   * 根据分类ID获取子分类
   */
  const getSubCategories = computed(() => {
    return (parentId: string) => {
      return categories.value
        .filter((cat) => cat.parentId === parentId)
        .sort((a, b) => a.sort - b.sort);
    };
  });

  /**
   * 根据分类ID获取分类信息
   */
  const getCategoryById = computed(() => {
    return (categoryId: string) => {
      return categories.value.find((cat) => cat.categoryId === categoryId);
    };
  });

  // ========== 操作 (Actions) ==========

  /**
   * 获取网站配置
   * @param forceRefresh 是否强制刷新（忽略缓存）
   */
  async function fetchSiteConfig(forceRefresh: boolean = false): Promise<void> {
    // 检查缓存
    if (!forceRefresh) {
      const cached = cacheManager.get(CACHE_KEYS.SITE_CONFIG);
      if (cached) {
        siteConfig.value = cached;
        return;
      }
    }

    loading.value.siteConfig = true;
    error.value.siteConfig = null;

    try {
      const res = await getSiteConfigAPI();
      if (res.code === 200 && res.data) {
        siteConfig.value = res.data;
        // 设置缓存
        cacheManager.set(CACHE_KEYS.SITE_CONFIG, res.data, CACHE_TTL.SITE_CONFIG);
      } else {
        throw new Error(res.msg || '获取网站配置失败');
      }
    } catch (e) {
      const errorMsg = (e as Error).message;
      error.value.siteConfig = errorMsg;
      console.error('Failed to fetch site config:', e);
      throw e;
    } finally {
      loading.value.siteConfig = false;
    }
  }

  /**
   * 获取轮播图列表
   * @param forceRefresh 是否强制刷新（忽略缓存）
   */
  async function fetchBanners(forceRefresh: boolean = false): Promise<void> {
    // 检查缓存
    if (!forceRefresh) {
      const cached = cacheManager.get(CACHE_KEYS.BANNERS);
      if (cached) {
        banners.value = cached;
        return;
      }
    }

    loading.value.banners = true;
    error.value.banners = null;

    try {
      const res = await getBannersAPI();
      if (res.code === 200 && res.data) {
        banners.value = res.data;
        // 设置缓存
        cacheManager.set(CACHE_KEYS.BANNERS, res.data, CACHE_TTL.BANNERS);
      } else {
        throw new Error(res.msg || '获取轮播图失败');
      }
    } catch (e) {
      const errorMsg = (e as Error).message;
      error.value.banners = errorMsg;
      console.error('Failed to fetch banners:', e);
      throw e;
    } finally {
      loading.value.banners = false;
    }
  }

  /**
   * 获取分类列表
   * @param forceRefresh 是否强制刷新（忽略缓存）
   */
  async function fetchCategories(forceRefresh: boolean = false): Promise<void> {
    // 检查缓存
    if (!forceRefresh) {
      const cached = cacheManager.get(CACHE_KEYS.CATEGORIES);
      if (cached) {
        categories.value = cached;
        return;
      }
    }

    loading.value.categories = true;
    error.value.categories = null;

    try {
      const res = await getCategoriesAPI();
      if (res.code === 200 && res.data) {
        categories.value = res.data;
        // 设置缓存
        cacheManager.set(CACHE_KEYS.CATEGORIES, res.data, CACHE_TTL.CATEGORIES);
      } else {
        throw new Error(res.msg || '获取分类列表失败');
      }
    } catch (e) {
      const errorMsg = (e as Error).message;
      error.value.categories = errorMsg;
      console.error('Failed to fetch categories:', e);
      throw e;
    } finally {
      loading.value.categories = false;
    }
  }

  /**
   * 获取公告列表
   * @param forceRefresh 是否强制刷新（忽略缓存）
   */
  async function fetchAnnouncements(forceRefresh: boolean = false): Promise<void> {
    // 检查缓存
    if (!forceRefresh) {
      const cached = cacheManager.get(CACHE_KEYS.ANNOUNCEMENTS);
      if (cached) {
        announcements.value = cached;
        return;
      }
    }

    loading.value.announcements = true;
    error.value.announcements = null;

    try {
      const res = await getAnnouncementsAPI();
      if (res.code === 200 && res.data) {
        announcements.value = res.data;
        // 设置缓存
        cacheManager.set(CACHE_KEYS.ANNOUNCEMENTS, res.data, CACHE_TTL.ANNOUNCEMENTS);
      } else {
        throw new Error(res.msg || '获取公告列表失败');
      }
    } catch (e) {
      const errorMsg = (e as Error).message;
      error.value.announcements = errorMsg;
      console.error('Failed to fetch announcements:', e);
      throw e;
    } finally {
      loading.value.announcements = false;
    }
  }

  /**
   * 初始化所有配置
   * 并行加载所有配置数据
   * @param forceRefresh 是否强制刷新（忽略缓存）
   */
  async function initConfig(forceRefresh: boolean = false): Promise<void> {
    try {
      // 并行加载所有配置
      await Promise.all([
        fetchSiteConfig(forceRefresh),
        fetchBanners(forceRefresh),
        fetchCategories(forceRefresh),
        fetchAnnouncements(forceRefresh)
      ]);
    } catch (e) {
      console.error('Failed to initialize config:', e);
      // 不抛出错误，允许部分配置加载失败
    }
  }

  /**
   * 清除指定缓存
   */
  function clearCache(key: keyof typeof CACHE_KEYS): void {
    cacheManager.clear(CACHE_KEYS[key]);
  }

  /**
   * 清除所有缓存
   */
  function clearAllCache(): void {
    cacheManager.clearAll();
  }

  /**
   * 重置所有状态
   */
  function reset(): void {
    siteConfig.value = null;
    banners.value = [];
    categories.value = [];
    announcements.value = [];
    loading.value = {
      siteConfig: false,
      banners: false,
      categories: false,
      announcements: false
    };
    error.value = {
      siteConfig: null,
      banners: null,
      categories: null,
      announcements: null
    };
    clearAllCache();
  }

  // ========== 返回公共接口 ==========
  return {
    // 状态
    siteConfig,
    banners,
    categories,
    announcements,
    loading,
    error,

    // 计算属性
    activeBanners,
    primaryCategories,
    hotCategories,
    recommendedCategories,
    importantAnnouncements,
    getSubCategories,
    getCategoryById,

    // 操作
    fetchSiteConfig,
    fetchBanners,
    fetchCategories,
    fetchAnnouncements,
    initConfig,
    clearCache,
    clearAllCache,
    reset
  };
});
