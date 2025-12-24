// 管理后台 - 资源管理API

import request from '@/utils/request';

// 资源列表查询参数
export interface ResourceListParams {
  keyword?: string; // 搜索关键词(标题/资源ID/上传者)
  categoryId?: string; // 分类ID
  auditStatus?: number; // 审核状态(0:待审核 1:已通过 2:已驳回)
  vipLevel?: number; // VIP等级
  status?: number; // 状态(1:正常 0:下架)
  page?: number;
  pageSize?: number;
  sortBy?: string; // 排序字段
  sortOrder?: 'asc' | 'desc'; // 排序方向
}

// 资源信息
export interface Resource {
  resourceId: string;
  title: string;
  description: string;
  cover: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileFormat: string;
  previewImages: string[];
  categoryId: string;
  categoryName?: string;
  tags: string[];
  vipLevel: number;
  userId: string;
  userName?: string;
  auditStatus: number;
  auditMsg: string;
  auditorId: string;
  auditedAt: string;
  downloadCount: number;
  viewCount: number;
  likeCount: number;
  collectCount: number;
  isTop: boolean;
  isRecommend: boolean;
  status: number;
  createdAt: string;
  updatedAt: string;
}

// 资源编辑参数
export interface ResourceEditParams {
  title?: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
}

/**
 * 获取资源列表(管理员)
 */
export async function getAdminResourceList(params: ResourceListParams): Promise<{
  list: Resource[];
  total: number;
}> {
  const response = await request<{
    list: Resource[];
    total: number;
  }>({
    url: '/admin/resources',
    method: 'GET',
    params
  });
  // request返回AxiosResponse，需要从data中提取实际数据
  const data = response.data as any;
  if (data.code === 200 && data.data) {
    return data.data;
  }
  return { list: [], total: 0 };
}

/**
 * 获取资源详情(管理员)
 */
export function getAdminResourceDetail(resourceId: string) {
  return request<Resource>({
    url: `/admin/resources/${resourceId}`,
    method: 'GET'
  });
}

/**
 * 编辑资源(管理员)
 */
export function updateAdminResource(resourceId: string, data: ResourceEditParams) {
  return request({
    url: `/admin/resources/${resourceId}`,
    method: 'PUT',
    data
  });
}

/**
 * 下架资源
 */
export function offlineResource(resourceId: string) {
  return request({
    url: `/admin/resources/${resourceId}/offline`,
    method: 'PUT'
  });
}

/**
 * 上架资源
 */
export function onlineResource(resourceId: string) {
  return request({
    url: `/admin/resources/${resourceId}/online`,
    method: 'PUT'
  });
}

/**
 * 删除资源(管理员)
 */
export function deleteAdminResource(resourceId: string) {
  return request({
    url: `/admin/resources/${resourceId}`,
    method: 'DELETE'
  });
}

/**
 * 置顶资源
 */
export function topResource(resourceId: string, isTop: boolean) {
  return request({
    url: `/admin/resources/${resourceId}/top`,
    method: 'PUT',
    data: { isTop }
  });
}

/**
 * 推荐资源
 */
export function recommendResource(resourceId: string, isRecommend: boolean) {
  return request({
    url: `/admin/resources/${resourceId}/recommend`,
    method: 'PUT',
    data: { isRecommend }
  });
}

/**
 * 批量删除资源
 */
export function batchDeleteResources(resourceIds: string[]) {
  return request({
    url: '/admin/resources/batch-delete',
    method: 'POST',
    data: { resourceIds }
  });
}

/**
 * 批量下架资源
 */
export function batchOfflineResources(resourceIds: string[]) {
  return request({
    url: '/admin/resources/batch-offline',
    method: 'POST',
    data: { resourceIds }
  });
}
