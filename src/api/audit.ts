/**
 * 审核相关API接口
 */
import { get, post } from '@/utils/request';
import type { ApiResponse } from '@/types/api';

/**
 * 审核列表项
 */
export interface AuditListItem {
  resourceId: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileFormat: string;
  uploaderId: string;
  uploaderName: string;
  uploadTime: string;
  auditStatus: number;
  thumbnail?: string;
  extractedFiles?: ExtractedFile[];
}

/**
 * 解压后的文件信息
 */
export interface ExtractedFile {
  fileName: string;
  fileSize: number;
  fileFormat: string;
  filePath: string;
  isValid: boolean;
  isIllegal: boolean;
}

/**
 * 审核列表查询参数
 */
export interface AuditListQuery {
  pageNum?: number;
  pageSize?: number;
  uploaderId?: string;
  fileType?: string;
  sortBy?: 'uploadTime' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 审核列表结果
 */
export interface AuditListResult {
  list: AuditListItem[];
  total: number;
}

/**
 * 批量审核结果
 */
export interface BatchAuditResult {
  successCount: number;
  failCount: number;
  failedIds: string[];
}

/**
 * 预设驳回原因
 */
export interface RejectReason {
  code: string;
  label: string;
}

/**
 * 审核日志条目
 */
export interface AuditLogEntry {
  logId: string;
  resourceId: string;
  operatorType: string;
  operatorId?: string;
  operatorName?: string;
  previousStatus: number;
  newStatus: number;
  rejectReason?: string;
  rejectReasonCode?: string;
  createdAt: string;
}

/**
 * 审核日志查询参数
 */
export interface AuditLogQuery {
  pageNum?: number;
  pageSize?: number;
  resourceId?: string;
  operatorId?: string;
  startTime?: string;
  endTime?: string;
}

/**
 * 审核日志结果
 */
export interface AuditLogResult {
  list: AuditLogEntry[];
  total: number;
}

/**
 * 文件详情
 */
export interface FileDetails {
  format: string;
  dimensions?: { width: number; height: number };
  resolution?: number;
  colorMode?: string;
}


/**
 * 获取待审核资源列表
 * @param query 查询参数
 * @returns 审核列表
 */
export function getAuditList(query?: AuditListQuery): Promise<ApiResponse<AuditListResult>> {
  return get<AuditListResult>('/admin/audit/list', query);
}

/**
 * 获取预设驳回原因列表
 * @returns 驳回原因列表
 */
export function getRejectReasons(): Promise<ApiResponse<RejectReason[]>> {
  return get<RejectReason[]>('/admin/audit/reject-reasons');
}

/**
 * 审核通过
 * @param resourceId 资源ID
 * @returns void
 */
export function approveResource(resourceId: string): Promise<ApiResponse<void>> {
  return post<void>(`/admin/audit/${resourceId}/approve`);
}

/**
 * 审核驳回
 * @param resourceId 资源ID
 * @param reasonCode 驳回原因代码
 * @param reasonDetail 驳回原因详情（可选）
 * @returns void
 */
export function rejectResource(
  resourceId: string,
  reasonCode: string,
  reasonDetail?: string
): Promise<ApiResponse<void>> {
  return post<void>(`/admin/audit/${resourceId}/reject`, { reasonCode, reasonDetail });
}

/**
 * 批量审核通过
 * @param resourceIds 资源ID列表
 * @returns 批量操作结果
 */
export function batchApprove(resourceIds: string[]): Promise<ApiResponse<BatchAuditResult>> {
  return post<BatchAuditResult>('/admin/audit/batch-approve', { resourceIds });
}

/**
 * 批量审核驳回
 * @param resourceIds 资源ID列表
 * @param reasonCode 驳回原因代码
 * @param reasonDetail 驳回原因详情（可选）
 * @returns 批量操作结果
 */
export function batchReject(
  resourceIds: string[],
  reasonCode: string,
  reasonDetail?: string
): Promise<ApiResponse<BatchAuditResult>> {
  return post<BatchAuditResult>('/admin/audit/batch-reject', { resourceIds, reasonCode, reasonDetail });
}

/**
 * 获取资源详情
 * @param resourceId 资源ID
 * @returns 文件详情
 */
export function getResourceDetails(resourceId: string): Promise<ApiResponse<FileDetails>> {
  return get<FileDetails>(`/admin/audit/${resourceId}/details`);
}

/**
 * 获取资源审核历史
 * @param resourceId 资源ID
 * @returns 审核历史
 */
export function getResourceHistory(resourceId: string): Promise<ApiResponse<AuditLogEntry[]>> {
  return get<AuditLogEntry[]>(`/admin/audit/${resourceId}/history`);
}

/**
 * 获取审核日志列表
 * @param query 查询参数
 * @returns 审核日志
 */
export function getAuditLogs(query?: AuditLogQuery): Promise<ApiResponse<AuditLogResult>> {
  return get<AuditLogResult>('/admin/audit/logs', query);
}

// 兼容旧接口
export interface GetAuditResourcesParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  uploader?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditResourceParams {
  action: 'approve' | 'reject';
  reason?: string;
}

/**
 * 获取待审核资源列表（兼容旧接口）
 * @deprecated 请使用 getAuditList
 */
export function getAuditResources(params: GetAuditResourcesParams): Promise<ApiResponse<AuditListResult>> {
  return getAuditList({
    pageNum: params.page,
    pageSize: params.pageSize,
    uploaderId: params.uploader,
  });
}

/**
 * 审核资源（兼容旧接口）
 * @deprecated 请使用 approveResource 或 rejectResource
 */
export function auditResource(resourceId: string, data: AuditResourceParams): Promise<ApiResponse<void>> {
  if (data.action === 'approve') {
    return approveResource(resourceId);
  } else {
    return rejectResource(resourceId, 'CUSTOM', data.reason);
  }
}
