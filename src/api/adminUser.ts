/**
 * 管理后台 - 用户管理API
 * 
 * 需求: 需求11.1-11.12
 */

import { get, put, post } from '@/utils/request';
import type { ApiResponse, PageResponse } from '@/types/api';

/**
 * 用户信息
 */
export interface AdminUser {
  userId: string;
  phone: string;
  nickname: string;
  avatar: string;
  email: string | null;
  vipLevel: number;
  vipExpireAt: string | null;
  pointsBalance: number;
  userLevel: number;
  status: number;
  role: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 用户详情（包含更多信息）
 */
export interface AdminUserDetail extends AdminUser {
  downloadCount: number;
  uploadCount: number;
  favoriteCount: number;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
}

/**
 * 用户列表查询参数
 */
export interface UserListParams {
  keyword?: string;
  vipLevel?: number;
  status?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 获取用户列表
 * GET /api/v1/admin/users
 */
export const getUserList = (
  params: UserListParams
): Promise<ApiResponse<PageResponse<AdminUser>>> => {
  // 转换参数名为后端期望的格式
  const apiParams: Record<string, unknown> = {
    page: params.page,
    page_size: params.pageSize
  };
  
  if (params.keyword) {
    apiParams.search = params.keyword;
  }
  if (params.vipLevel !== undefined) {
    apiParams.vip_level = params.vipLevel;
  }
  if (params.status !== undefined) {
    apiParams.status = params.status;
  }
  if (params.sortBy) {
    apiParams.sort_by = params.sortBy;
    apiParams.sort_order = params.sortOrder;
  }
  
  return get<PageResponse<AdminUser>>('/admin/users', apiParams);
};

/**
 * 搜索用户（用于积分调整等场景）
 * GET /api/v1/admin/users
 */
export const searchUsers = (
  params: { keyword: string; page?: number; pageSize?: number }
): Promise<ApiResponse<PageResponse<AdminUser>>> => {
  return get<PageResponse<AdminUser>>('/admin/users', {
    search: params.keyword,
    page: params.page || 1,
    page_size: params.pageSize || 10
  });
};

/**
 * 获取用户详情
 * GET /api/v1/admin/users/:userId
 */
export const getUserDetail = (
  userId: string
): Promise<ApiResponse<AdminUserDetail>> => {
  return get<AdminUserDetail>(`/admin/users/${userId}`);
};

/**
 * 更新用户状态（禁用/启用）
 * PUT /api/v1/admin/users/:userId/status
 */
export const updateUserStatus = (
  userId: string,
  status: number
): Promise<ApiResponse<void>> => {
  return put<void>(`/admin/users/${userId}/status`, { status });
};

/**
 * 重置用户密码
 * POST /api/v1/admin/users/:userId/reset-password
 */
export const resetUserPassword = (
  userId: string,
  newPassword: string
): Promise<ApiResponse<void>> => {
  return post<void>(`/admin/users/${userId}/reset-password`, { newPassword });
};

/**
 * 调整用户VIP
 * PUT /api/v1/admin/users/:userId/vip
 */
export const adjustUserVip = (
  userId: string,
  data: {
    vipLevel: number;
    expireAt: string | null;
    reason?: string;
  }
): Promise<ApiResponse<void>> => {
  // 转换参数名以匹配后端API
  return put<void>(`/admin/users/${userId}/vip`, {
    vip_level: data.vipLevel,
    vip_expire_at: data.expireAt,
    reason: data.reason
  });
};

/**
 * 调整用户积分
 * POST /api/v1/admin/users/:userId/points/adjust
 */
export const adjustUserPoints = (
  userId: string,
  data: {
    type: 'add' | 'subtract';
    amount: number;
    reason: string;
  }
): Promise<ApiResponse<void>> => {
  // 转换参数格式以匹配后端API
  const pointsChange = data.type === 'add' ? data.amount : -data.amount;
  return post<void>(`/admin/users/${userId}/points/adjust`, {
    points_change: pointsChange,
    reason: data.reason
  });
};

/**
 * 获取用户下载记录
 * GET /api/v1/admin/users/:userId/downloads
 */
export const getUserDownloads = (
  userId: string,
  params?: { page?: number; pageSize?: number }
): Promise<ApiResponse<PageResponse<unknown>>> => {
  return get<PageResponse<unknown>>(`/admin/users/${userId}/downloads`, params);
};

/**
 * 获取用户上传记录
 * GET /api/v1/admin/users/:userId/uploads
 */
export const getUserUploads = (
  userId: string,
  params?: { page?: number; pageSize?: number }
): Promise<ApiResponse<PageResponse<unknown>>> => {
  return get<PageResponse<unknown>>(`/admin/users/${userId}/uploads`, params);
};
