/**
 * 审核相关API接口
 */
import request from '@/utils/request';
import type { AuditResource } from '@/types/models';

/**
 * 获取待审核资源列表参数
 */
export interface GetAuditResourcesParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  uploader?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 获取待审核资源列表响应
 */
export interface GetAuditResourcesResponse {
  list: AuditResource[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 审核资源参数
 */
export interface AuditResourceParams {
  action: 'approve' | 'reject';
  reason?: string;
}

/**
 * 获取待审核资源列表
 * GET /api/v1/admin/audit/resources
 */
export const getAuditResources = (params: GetAuditResourcesParams) => {
  return request.get<GetAuditResourcesResponse>('/api/v1/admin/audit/resources', { params });
};

/**
 * 审核资源
 * POST /api/v1/admin/audit/resources/:resourceId
 */
export const auditResource = (resourceId: string, data: AuditResourceParams) => {
  return request.post(`/api/v1/admin/audit/resources/${resourceId}`, data);
};
