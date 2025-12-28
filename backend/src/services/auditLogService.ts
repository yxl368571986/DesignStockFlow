/**
 * 审核日志服务
 * 负责记录和查询审核操作日志
 */

import { PrismaClient } from '@prisma/client';
import { AuditOperatorType } from '../config/audit.js';

const prisma = new PrismaClient();

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
  createdAt: Date;
}

/**
 * 审核日志查询参数
 */
export interface AuditLogQuery {
  resourceId?: string;
  operatorId?: string;
  startTime?: Date;
  endTime?: Date;
  pageNum: number;
  pageSize: number;
}

/**
 * 审核日志查询结果
 */
export interface AuditLogResult {
  list: AuditLogEntry[];
  total: number;
}

/**
 * 记录审核日志参数
 */
export interface LogAuditActionParams {
  resourceId: string;
  operatorType: AuditOperatorType | string;
  operatorId?: string;
  previousStatus: number;
  newStatus: number;
  rejectReason?: string;
  rejectReasonCode?: string;
}

/**
 * 记录审核日志
 * @param params 日志参数
 */
export async function logAuditAction(params: LogAuditActionParams): Promise<void> {
  const { resourceId, operatorType, operatorId, previousStatus, newStatus, rejectReason, rejectReasonCode } = params;
  
  // 确定操作类型
  const action = newStatus === 1 ? 'approve' : newStatus === 2 ? 'reject' : 'update';
  
  await prisma.audit_logs.create({
    data: {
      resource_id: resourceId,
      auditor_id: operatorId,
      action,
      operator_type: operatorType,
      previous_status: previousStatus,
      new_status: newStatus,
      reason: rejectReason,
      reject_reason_code: rejectReasonCode,
    },
  });
}

/**
 * 查询审核日志
 * @param query 查询参数
 * @returns 日志列表
 */
export async function getAuditLogs(query: AuditLogQuery): Promise<AuditLogResult> {
  const { resourceId, operatorId, startTime, endTime, pageNum, pageSize } = query;
  const skip = (pageNum - 1) * pageSize;
  
  // 构建查询条件
  const where: Record<string, unknown> = {};
  
  if (resourceId) {
    where.resource_id = resourceId;
  }
  
  if (operatorId) {
    where.auditor_id = operatorId;
  }
  
  if (startTime || endTime) {
    where.created_at = {};
    if (startTime) {
      (where.created_at as Record<string, Date>).gte = startTime;
    }
    if (endTime) {
      (where.created_at as Record<string, Date>).lte = endTime;
    }
  }
  
  // 查询数据
  const [logs, total] = await Promise.all([
    prisma.audit_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
      include: {
        users: {
          select: {
            user_id: true,
            nickname: true,
          },
        },
      },
    }),
    prisma.audit_logs.count({ where }),
  ]);
  
  // 转换数据格式
  const list: AuditLogEntry[] = logs.map(log => ({
    logId: log.log_id,
    resourceId: log.resource_id || '',
    operatorType: log.operator_type || 'system',
    operatorId: log.auditor_id || undefined,
    operatorName: log.users?.nickname || (log.operator_type === 'system' ? '系统' : '未知'),
    previousStatus: log.previous_status || 0,
    newStatus: log.new_status || 0,
    rejectReason: log.reason || undefined,
    rejectReasonCode: log.reject_reason_code || undefined,
    createdAt: log.created_at,
  }));
  
  return { list, total };
}

/**
 * 获取资源的审核历史
 * @param resourceId 资源ID
 * @returns 审核历史列表
 */
export async function getResourceAuditHistory(resourceId: string): Promise<AuditLogEntry[]> {
  const result = await getAuditLogs({
    resourceId,
    pageNum: 1,
    pageSize: 100,
  });
  
  return result.list;
}
