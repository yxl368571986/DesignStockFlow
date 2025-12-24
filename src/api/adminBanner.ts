// 管理后台 - 轮播图管理API

import request from '@/utils/request';

// 轮播图信息
export interface Banner {
  bannerId: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  linkType: 'internal' | 'external' | 'category' | 'resource';
  sortOrder: number;
  startTime: string | null;
  endTime: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
}

// 轮播图列表查询参数
export interface BannerListParams {
  status?: number;
  page?: number;
  limit?: number;
}

// 轮播图创建/编辑参数
export interface BannerFormData {
  title: string;
  imageUrl: string;
  linkUrl: string;
  linkType: 'internal' | 'external' | 'category' | 'resource';
  sortOrder: number;
  startTime: string | null;
  endTime: string | null;
  status: number;
}

// 后端返回的原始轮播图数据（后端已返回camelCase格式）
interface RawBanner {
  bannerId: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  linkType: 'internal' | 'external' | 'category' | 'resource';
  sortOrder: number;
  startTime: string | null;
  endTime: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
}

// API响应格式
interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

/**
 * 获取轮播图列表(管理员)
 */
export async function getAdminBannerList(params: BannerListParams = {}): Promise<{
  list: Banner[];
  total: number;
}> {
  const response = await request({
    url: '/admin/banners',
    method: 'GET',
    params
  });
  // request返回AxiosResponse，需要从data中提取实际数据
  const data = response.data as unknown as ApiResponse<{ list: RawBanner[]; total: number }>;
  if (data.code === 200 && data.data) {
    // 后端已返回camelCase格式，直接使用
    return { list: data.data.list, total: data.data.total };
  }
  return { list: [], total: 0 };
}

/**
 * 创建轮播图(管理员)
 */
export async function createAdminBanner(formData: BannerFormData): Promise<Banner | null> {
  const response = await request({
    url: '/admin/banners',
    method: 'POST',
    data: {
      title: formData.title,
      imageUrl: formData.imageUrl,
      linkUrl: formData.linkUrl,
      linkType: formData.linkType,
      sortOrder: formData.sortOrder,
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: formData.status
    }
  });
  const data = response.data as unknown as ApiResponse<RawBanner>;
  if (data.code === 200 && data.data) {
    return data.data;
  }
  return null;
}

/**
 * 更新轮播图(管理员)
 */
export async function updateAdminBanner(bannerId: string, formData: Partial<BannerFormData>): Promise<Banner | null> {
  const response = await request({
    url: `/admin/banners/${bannerId}`,
    method: 'PUT',
    data: formData
  });
  const data = response.data as unknown as ApiResponse<RawBanner>;
  if (data.code === 200 && data.data) {
    return data.data;
  }
  return null;
}

/**
 * 删除轮播图(管理员)
 */
export async function deleteAdminBanner(bannerId: string): Promise<boolean> {
  const response = await request({
    url: `/admin/banners/${bannerId}`,
    method: 'DELETE'
  });
  const data = response.data as unknown as ApiResponse<unknown>;
  return data.code === 200;
}

/**
 * 更新轮播图状态(管理员)
 */
export async function updateAdminBannerStatus(bannerId: string, status: number): Promise<boolean> {
  const response = await request({
    url: `/admin/banners/${bannerId}`,
    method: 'PUT',
    data: { status }
  });
  const data = response.data as unknown as ApiResponse<unknown>;
  return data.code === 200;
}
