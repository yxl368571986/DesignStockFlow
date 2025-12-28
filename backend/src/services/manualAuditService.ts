/**
 * 人工审核服务
 * 负责待审核资源列表、审核操作、批量审核、缩略图生成等功能
 */

import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import {
  AuditStatus,
  PRESET_REJECT_REASONS,
} from '../config/audit.js';

const prisma = new PrismaClient();

/**
 * 审核列表查询参数
 */
export interface AuditListQuery {
  pageNum: number;
  pageSize: number;
  uploaderId?: string;
  fileType?: string;
  sortBy?: 'uploadTime' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

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
  uploadTime: Date;
  auditStatus: number;
  thumbnail?: string;
  extractedFiles?: unknown[];
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
export async function getAuditList(query: AuditListQuery): Promise<AuditListResult> {
  const { pageNum, pageSize, uploaderId, fileType, sortBy, sortOrder } = query;
  const skip = (pageNum - 1) * pageSize;
  
  // 构建查询条件
  const where: Record<string, unknown> = {
    audit_status: AuditStatus.PENDING,
  };
  
  if (uploaderId) {
    where.user_id = uploaderId;
  }
  
  if (fileType) {
    where.file_format = fileType.toUpperCase();
  }
  
  // 构建排序
  const orderBy: Record<string, string> = {};
  if (sortBy === 'uploadTime') {
    orderBy.created_at = sortOrder || 'desc';
  } else if (sortBy === 'fileSize') {
    orderBy.file_size = sortOrder || 'desc';
  } else {
    orderBy.created_at = 'desc';
  }
  
  // 查询数据
  const [resources, total] = await Promise.all([
    prisma.resources.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        users_resources_user_idTousers: {
          select: {
            user_id: true,
            nickname: true,
          },
        },
      },
    }),
    prisma.resources.count({ where }),
  ]);
  
  // 转换数据格式
  const list: AuditListItem[] = resources.map(resource => ({
    resourceId: resource.resource_id,
    title: resource.title,
    fileName: resource.file_name,
    fileSize: Number(resource.file_size),
    fileFormat: resource.file_format,
    uploaderId: resource.user_id || '',
    uploaderName: resource.users_resources_user_idTousers?.nickname || '未知用户',
    uploadTime: resource.created_at,
    auditStatus: resource.audit_status,
    thumbnail: resource.cover || undefined,
    extractedFiles: resource.extracted_files as unknown[] || undefined,
  }));
  
  return { list, total };
}

/**
 * 审核通过
 * @param resourceId 资源ID
 * @param operatorId 操作人ID
 */
export async function approveResource(resourceId: string, operatorId: string): Promise<void> {
  const resource = await prisma.resources.findUnique({
    where: { resource_id: resourceId },
  });
  
  if (!resource) {
    throw new Error('资源不存在');
  }
  
  if (resource.audit_status !== AuditStatus.PENDING) {
    throw new Error('资源已审核');
  }
  
  // 更新资源状态
  await prisma.resources.update({
    where: { resource_id: resourceId },
    data: {
      audit_status: AuditStatus.APPROVED,
      updated_at: new Date(),
    },
  });
  
  // 记录审核日志
  await prisma.audit_logs.create({
    data: {
      resource_id: resourceId,
      auditor_id: operatorId,
      action: 'approve',
      operator_type: 'manual',
      previous_status: AuditStatus.PENDING,
      new_status: AuditStatus.APPROVED,
    },
  });
}


/**
 * 审核驳回
 * @param params 驳回参数
 */
export async function rejectResource(params: {
  resourceId: string;
  operatorId: string;
  reasonCode: string;
  reasonDetail?: string;
}): Promise<void> {
  const { resourceId, operatorId, reasonCode, reasonDetail } = params;
  
  const resource = await prisma.resources.findUnique({
    where: { resource_id: resourceId },
  });
  
  if (!resource) {
    throw new Error('资源不存在');
  }
  
  if (resource.audit_status !== AuditStatus.PENDING) {
    throw new Error('资源已审核');
  }
  
  // 获取驳回原因文本
  const presetReason = PRESET_REJECT_REASONS.find(r => r.code === reasonCode);
  const rejectReason = reasonDetail || presetReason?.label || reasonCode;
  
  // 更新资源状态
  await prisma.resources.update({
    where: { resource_id: resourceId },
    data: {
      audit_status: AuditStatus.REJECTED,
      reject_reason: rejectReason,
      reject_reason_code: reasonCode,
      updated_at: new Date(),
    },
  });
  
  // 记录审核日志
  await prisma.audit_logs.create({
    data: {
      resource_id: resourceId,
      auditor_id: operatorId,
      action: 'reject',
      operator_type: 'manual',
      previous_status: AuditStatus.PENDING,
      new_status: AuditStatus.REJECTED,
      reason: rejectReason,
      reject_reason_code: reasonCode,
    },
  });
}

/**
 * 批量审核通过
 * @param resourceIds 资源ID列表
 * @param operatorId 操作人ID
 * @returns 批量操作结果
 */
export async function batchApprove(resourceIds: string[], operatorId: string): Promise<BatchAuditResult> {
  const result: BatchAuditResult = {
    successCount: 0,
    failCount: 0,
    failedIds: [],
  };
  
  for (const resourceId of resourceIds) {
    try {
      await approveResource(resourceId, operatorId);
      result.successCount++;
    } catch {
      result.failCount++;
      result.failedIds.push(resourceId);
    }
  }
  
  return result;
}

/**
 * 批量审核驳回
 * @param params 批量驳回参数
 * @returns 批量操作结果
 */
export async function batchReject(params: {
  resourceIds: string[];
  operatorId: string;
  reasonCode: string;
  reasonDetail?: string;
}): Promise<BatchAuditResult> {
  const { resourceIds, operatorId, reasonCode, reasonDetail } = params;
  
  const result: BatchAuditResult = {
    successCount: 0,
    failCount: 0,
    failedIds: [],
  };
  
  for (const resourceId of resourceIds) {
    try {
      await rejectResource({ resourceId, operatorId, reasonCode, reasonDetail });
      result.successCount++;
    } catch {
      result.failCount++;
      result.failedIds.push(resourceId);
    }
  }
  
  return result;
}

/**
 * 生成缩略图
 * @param filePath 文件路径
 * @param format 文件格式
 * @returns 缩略图路径，失败返回 null
 */
export async function generateThumbnail(filePath: string, format: string): Promise<string | null> {
  // 检查文件是否存在
  const exists = await fs.promises.access(filePath).then(() => true).catch(() => false);
  if (!exists) {
    return null;
  }
  
  const upperFormat = format.toUpperCase();
  
  // 图片文件：直接使用原图作为缩略图（实际项目中应使用 sharp 等库生成缩略图）
  if (['JPG', 'JPEG', 'PNG'].includes(upperFormat)) {
    // TODO: 使用 sharp 库生成实际缩略图，尺寸从 getAuditConfig().thumbnailSize 获取
    // 目前返回原图路径
    return filePath;
  }
  
  // 设计文件：返回默认图标路径
  if (['PSD', 'AI', 'CDR'].includes(upperFormat)) {
    return `/assets/icons/${upperFormat.toLowerCase()}-icon.png`;
  }
  
  return null;
}

/**
 * 获取文件详情
 * @param resourceId 资源ID
 * @returns 文件详情
 */
export async function getFileDetails(resourceId: string): Promise<FileDetails | null> {
  const resource = await prisma.resources.findUnique({
    where: { resource_id: resourceId },
  });
  
  if (!resource) {
    return null;
  }
  
  const details: FileDetails = {
    format: resource.file_format,
  };
  
  // TODO: 根据文件类型读取更多详情（尺寸、分辨率、色彩模式等）
  // 需要使用专门的库来解析不同格式的文件
  
  return details;
}

/**
 * 获取预设驳回原因列表
 * @returns 预设驳回原因
 */
export function getPresetRejectReasons() {
  return PRESET_REJECT_REASONS;
}
