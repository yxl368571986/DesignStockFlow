/**
 * 内容管理相关API接口
 */

import { get } from '@/utils/request';
import type {
  SiteConfig,
  BannerInfo,
  CategoryInfo,
  AnnouncementInfo,
  ActivityInfo,
  FriendLinkInfo
} from '@/types/models';
import type { ApiResponse } from '@/types/api';

// 导入Mock数据
import { mockSiteConfig, mockBanners, mockCategories, mockAnnouncements } from '@/mock/data';

// 是否使用Mock数据
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK === 'true';

/**
 * 模拟API响应
 */
function mockResponse<T>(data: T, delay: number = 300): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        msg: 'success',
        data,
        timestamp: Date.now()
      });
    }, delay);
  });
}

/**
 * 获取网站配置
 * @returns Promise<SiteConfig>
 */
export function getSiteConfig(): Promise<ApiResponse<SiteConfig>> {
  if (USE_MOCK) {
    return mockResponse(mockSiteConfig);
  }
  return get<SiteConfig>('/content/site-config');
}

/**
 * 获取轮播图列表
 * @returns Promise<BannerInfo[]>
 */
export function getBanners(): Promise<ApiResponse<BannerInfo[]>> {
  if (USE_MOCK) {
    return mockResponse(mockBanners);
  }
  return get<BannerInfo[]>('/content/banners');
}

/**
 * 获取分类列表（支持一级/二级分类）
 * @param parentId 父分类ID（可选，不传则获取一级分类）
 * @returns Promise<CategoryInfo[]>
 */
export function getCategories(parentId?: string): Promise<ApiResponse<CategoryInfo[]>> {
  if (USE_MOCK) {
    const filtered = parentId
      ? mockCategories.filter((cat) => cat.parentId === parentId)
      : mockCategories;
    return mockResponse(filtered);
  }
  return get<CategoryInfo[]>('/content/categories', parentId ? { parentId } : undefined);
}

/**
 * 获取分类树（包含一级和二级分类）
 * @returns Promise<CategoryInfo[]>
 */
export function getCategoryTree(): Promise<ApiResponse<CategoryInfo[]>> {
  if (USE_MOCK) {
    return mockResponse(mockCategories);
  }
  return get<CategoryInfo[]>('/content/category-tree');
}

/**
 * 获取公告列表
 * @param level 重要程度（可选：normal/important）
 * @returns Promise<AnnouncementInfo[]>
 */
export function getAnnouncements(level?: string): Promise<ApiResponse<AnnouncementInfo[]>> {
  if (USE_MOCK) {
    const filtered = level
      ? mockAnnouncements.filter((ann) => ann.level === level)
      : mockAnnouncements;
    return mockResponse(filtered);
  }
  return get<AnnouncementInfo[]>('/content/announcements', level ? { level } : undefined);
}

/**
 * 获取活动配置
 * @param status 活动状态（可选：upcoming/ongoing/ended）
 * @returns Promise<ActivityInfo[]>
 */
export function getActivities(status?: string): Promise<ApiResponse<ActivityInfo[]>> {
  return get<ActivityInfo[]>('/content/activities', status ? { status } : undefined);
}

/**
 * 获取友情链接
 * @returns Promise<FriendLinkInfo[]>
 */
export function getFriendLinks(): Promise<ApiResponse<FriendLinkInfo[]>> {
  return get<FriendLinkInfo[]>('/content/friend-links');
}

/**
 * 获取热门搜索词
 * @param limit 数量限制，默认10
 * @returns Promise<string[]>
 */
export function getHotSearchKeywords(limit: number = 10): Promise<ApiResponse<string[]>> {
  return get<string[]>('/content/hot-search', { limit });
}

/**
 * 获取搜索联想词
 * @param keyword 关键词
 * @param limit 数量限制，默认10
 * @returns Promise<string[]>
 */
export function getSearchSuggestions(
  keyword: string,
  limit: number = 10
): Promise<ApiResponse<string[]>> {
  return get<string[]>('/content/search-suggestions', { keyword, limit });
}
