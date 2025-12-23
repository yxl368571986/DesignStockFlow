/**
 * 统计数据API
 */

import { get } from '@/utils/request';
import type { ApiResponse } from '@/types/api';

/**
 * 数据概览响应
 */
export interface OverviewData {
  userTotal: number;
  resourceTotal: number;
  todayDownload: number;
  todayUpload: number;
  vipTotal: number;
  pendingAudit: number;
}

/**
 * 趋势数据点
 */
export interface TrendDataPoint {
  date: string;
  count: number;
}

/**
 * 热门资源项
 */
export interface HotResourceItem {
  resourceId: string;
  title: string;
  downloadCount: number;
}

/**
 * 热门分类项
 */
export interface HotCategoryItem {
  categoryId: string;
  categoryName: string;
  resourceCount: number;
}

/**
 * 活跃用户项
 */
export interface ActiveUserItem {
  userId: string;
  nickname: string;
  downloadCount: number;
}

/**
 * 获取数据概览
 */
export const getOverview = (): Promise<ApiResponse<OverviewData>> => {
  return get<OverviewData>('/api/v1/admin/statistics/overview');
};

/**
 * 获取用户增长趋势
 * @param days 天数，默认30天
 */
export const getUserGrowth = (days: number = 30): Promise<ApiResponse<TrendDataPoint[]>> => {
  return get<TrendDataPoint[]>('/api/v1/admin/statistics/user-growth', { days });
};

/**
 * 获取资源增长趋势
 * @param days 天数，默认30天
 */
export const getResourceGrowth = (days: number = 30): Promise<ApiResponse<TrendDataPoint[]>> => {
  return get<TrendDataPoint[]>('/api/v1/admin/statistics/resource-growth', { days });
};

/**
 * 获取下载统计
 * @param days 天数，默认30天
 */
export const getDownloadStats = (days: number = 30): Promise<ApiResponse<TrendDataPoint[]>> => {
  return get<TrendDataPoint[]>('/api/v1/admin/statistics/download', { days });
};

/**
 * 获取热门资源TOP10
 */
export const getHotResources = (): Promise<ApiResponse<HotResourceItem[]>> => {
  return get<HotResourceItem[]>('/api/v1/admin/statistics/hot-resources');
};

/**
 * 获取热门分类TOP10
 */
export const getHotCategories = (): Promise<ApiResponse<HotCategoryItem[]>> => {
  return get<HotCategoryItem[]>('/api/v1/admin/statistics/hot-categories');
};

/**
 * 获取活跃用户TOP10
 */
export const getActiveUsers = (): Promise<ApiResponse<ActiveUserItem[]>> => {
  return get<ActiveUserItem[]>('/api/v1/admin/statistics/active-users');
};

/**
 * 获取自定义时间范围统计
 */
export const getCustomStats = (startDate: string, endDate: string): Promise<ApiResponse<any>> => {
  return get<any>('/api/v1/admin/statistics/custom', { startDate, endDate });
};
