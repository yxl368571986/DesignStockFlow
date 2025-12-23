/**
 * 资源相关API接口
 */

import { get, post, put, del } from '@/utils/request';
import type { ResourceInfo, SearchParams } from '@/types/models';
import type { ApiResponse, PageResponse } from '@/types/api';

// 导入Mock数据
import { mockResources } from '@/mock/data';

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
 * 获取资源列表（支持筛选、排序、分页）
 * @param params 搜索参数
 * @returns Promise<PageResponse<ResourceInfo>>
 */
export function getResourceList(
  params: SearchParams
): Promise<ApiResponse<PageResponse<ResourceInfo>>> {
  if (USE_MOCK) {
    // 模拟分页和筛选
    let filtered = [...mockResources];

    // 按分类筛选
    if (params.categoryId) {
      filtered = filtered.filter((r) => r.categoryId === params.categoryId);
    }

    // 按格式筛选
    if (params.format) {
      filtered = filtered.filter((r) => r.fileFormat === params.format);
    }

    // 按VIP等级筛选
    if (params.vipLevel !== undefined) {
      filtered = filtered.filter((r) => r.vipLevel === params.vipLevel);
    }

    // 排序
    if (params.sortType === 'download') {
      filtered.sort((a, b) => b.downloadCount - a.downloadCount);
    } else if (params.sortType === 'comprehensive') {
      // 综合排序：按浏览量排序
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else {
      filtered.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
    }

    // 分页
    const pageNum = params.pageNum || 1;
    const pageSize = params.pageSize || 20;
    const start = (pageNum - 1) * pageSize;
    const end = start + pageSize;
    const list = filtered.slice(start, end);

    return mockResponse({
      list,
      total: filtered.length,
      pageNum,
      pageSize
    });
  }
  return get<PageResponse<ResourceInfo>>('/resources', params);
}

/**
 * 获取资源详情
 * @param resourceId 资源ID
 * @returns Promise<ResourceInfo>
 */
export function getResourceDetail(resourceId: string): Promise<ApiResponse<ResourceInfo>> {
  if (USE_MOCK) {
    const resource = mockResources.find((r) => r.resourceId === resourceId);
    if (resource) {
      return mockResponse(resource);
    }
    return Promise.reject(new Error('资源不存在'));
  }
  return get<ResourceInfo>(`/resources/${resourceId}`);
}

/**
 * 搜索资源
 * @param params 搜索参数
 * @returns Promise<PageResponse<ResourceInfo>>
 */
export function searchResources(
  params: SearchParams
): Promise<ApiResponse<PageResponse<ResourceInfo>>> {
  if (USE_MOCK) {
    // 使用getResourceList的逻辑
    return getResourceList(params);
  }
  return get<PageResponse<ResourceInfo>>('/resources', params);
}

/**
 * 获取热门资源
 * @param limit 数量限制，默认10
 * @returns Promise<ResourceInfo[]>
 */
export async function getHotResources(limit: number = 10): Promise<ApiResponse<ResourceInfo[]>> {
  if (USE_MOCK) {
    const sorted = [...mockResources].sort((a, b) => b.downloadCount - a.downloadCount);
    return mockResponse(sorted.slice(0, limit));
  }
  // 实际API返回PageResponse，需要提取list
  const response = await get<PageResponse<ResourceInfo>>('/resources', { sortType: 'download', pageSize: limit });
  return {
    ...response,
    data: response.data?.list || []
  };
}

/**
 * 获取推荐资源
 * @param limit 数量限制，默认10
 * @returns Promise<ResourceInfo[]>
 */
export async function getRecommendedResources(limit: number = 10): Promise<ApiResponse<ResourceInfo[]>> {
  if (USE_MOCK) {
    const sorted = [...mockResources].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    return mockResponse(sorted.slice(0, limit));
  }
  // 实际API返回PageResponse，需要提取list
  const response = await get<PageResponse<ResourceInfo>>('/resources', { isRecommend: true, pageSize: limit });
  return {
    ...response,
    data: response.data?.list || []
  };
}

/**
 * 上传资源
 * @param formData FormData对象（包含文件和资源信息）
 * @returns Promise<ResourceInfo>
 */
export function uploadResource(formData: FormData): Promise<ApiResponse<ResourceInfo>> {
  if (USE_MOCK) {
    const mockResource: ResourceInfo = {
      resourceId: 'mock-' + Date.now(),
      title: (formData.get('title') as string) || '未命名资源',
      description: (formData.get('description') as string) || '',
      categoryId: (formData.get('categoryId') as string) || '',
      cover: '',
      previewImages: [],
      format: 'PSD',
      fileFormat: 'PSD',
      fileSize: 1024000,
      downloadCount: 0,
      viewCount: 0,
      collectCount: 0,
      vipLevel: 0,
      categoryName: '',
      tags: [],
      uploaderId: '',
      uploaderName: '',
      isAudit: 0,
      createdAt: new Date().toISOString(),
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };
    return mockResponse(mockResource);
  }
  return post<ResourceInfo>('/resources/upload', formData);
}

/**
 * 下载资源
 * @param resourceId 资源ID
 * @returns Promise<{downloadUrl: string}> 返回下载URL对象
 */
export function downloadResource(
  resourceId: string
): Promise<ApiResponse<{ downloadUrl: string }>> {
  if (USE_MOCK) {
    const resource = mockResources.find((r) => r.resourceId === resourceId);
    if (resource) {
      return mockResponse({
        downloadUrl: resource.fileUrl || `https://example.com/download/${resourceId}`
      });
    }
    return Promise.reject(new Error('资源不存在'));
  }
  return post<{ downloadUrl: string }>(`/resources/${resourceId}/download`, {});
}

/**
 * 编辑资源
 * @param resourceId 资源ID
 * @param data 资源信息
 * @returns Promise<ResourceInfo>
 */
export function updateResource(
  resourceId: string,
  data: Partial<ResourceInfo>
): Promise<ApiResponse<ResourceInfo>> {
  if (USE_MOCK) {
    return mockResponse({ ...data, resourceId } as ResourceInfo);
  }
  return put<ResourceInfo>(`/resources/${resourceId}`, data);
}

/**
 * 删除资源
 * @param resourceId 资源ID
 * @returns Promise<void>
 */
export function deleteResource(resourceId: string): Promise<ApiResponse<void>> {
  if (USE_MOCK) {
    return mockResponse(undefined);
  }
  return del<void>(`/resources/${resourceId}`);
}

/**
 * 收藏资源
 * @param resourceId 资源ID
 * @returns Promise<void>
 */
export function collectResource(resourceId: string): Promise<ApiResponse<void>> {
  if (USE_MOCK) {
    return mockResponse(undefined);
  }
  return post<void>(`/favorites/${resourceId}`);
}

/**
 * 取消收藏资源
 * @param resourceId 资源ID
 * @returns Promise<void>
 */
export function uncollectResource(resourceId: string): Promise<ApiResponse<void>> {
  if (USE_MOCK) {
    return mockResponse(undefined);
  }
  return del<void>(`/favorites/${resourceId}`);
}

/**
 * 检查资源收藏状态
 * @param resourceId 资源ID
 * @returns Promise<{isFavorited: boolean}>
 */
export function checkFavoriteStatus(resourceId: string): Promise<ApiResponse<{isFavorited: boolean}>> {
  if (USE_MOCK) {
    return mockResponse({ isFavorited: false });
  }
  return get<{isFavorited: boolean}>(`/favorites/${resourceId}/check`);
}

/**
 * 批量检查收藏状态
 * @param resourceIds 资源ID数组
 * @returns Promise<Record<string, boolean>>
 */
export function checkFavoritesBatch(resourceIds: string[]): Promise<ApiResponse<Record<string, boolean>>> {
  if (USE_MOCK) {
    const result: Record<string, boolean> = {};
    resourceIds.forEach(id => { result[id] = false; });
    return mockResponse(result);
  }
  return post<Record<string, boolean>>('/favorites/check-batch', { resourceIds });
}

/**
 * 获取相关推荐资源
 * @param resourceId 资源ID
 * @param limit 数量限制，默认6
 * @returns Promise<ResourceInfo[]>
 */
export function getRelatedResources(
  resourceId: string,
  limit: number = 6
): Promise<ApiResponse<ResourceInfo[]>> {
  if (USE_MOCK) {
    const resource = mockResources.find((r) => r.resourceId === resourceId);
    if (resource) {
      // 返回同分类的其他资源
      const related = mockResources
        .filter((r) => r.resourceId !== resourceId && r.categoryId === resource.categoryId)
        .slice(0, limit);
      return mockResponse(related);
    }
    return mockResponse([]);
  }
  return get<ResourceInfo[]>(`/resources/${resourceId}/related`, { limit });
}
