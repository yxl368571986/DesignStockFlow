/**
 * 管理端充值相关API接口
 */

import { get, post, put, del } from '@/utils/request';
import type { ApiResponse, PageResponse } from '@/types/api';
import type { RechargePackage, RechargeOrder } from './recharge';

/**
 * 创建/更新套餐请求
 */
export interface PackageFormData {
  packageName: string;
  packageCode: string;
  price: number;
  basePoints: number;
  bonusPoints: number;
  sortOrder?: number;
  isRecommend?: boolean;
  status?: number;
}

/**
 * 积分调整请求
 */
export interface PointsAdjustmentRequest {
  targetUserId: string;
  adjustmentType: 'add' | 'deduct';
  pointsChange: number;
  reason: string;
}

/**
 * 批量赠送请求
 */
export interface BatchGiftRequest {
  userIds: string[];
  points: number;
  reason: string;
}

/**
 * 批量赠送结果
 */
export interface BatchGiftResult {
  totalUsers: number;
  successCount: number;
  failedCount: number;
  failedUsers: Array<{ userId: string; reason: string }>;
}

/**
 * 积分调整日志
 */
export interface AdjustmentLog {
  logId: string;
  adminId: string;
  adminName?: string;
  targetUserId: string;
  targetUserName?: string;
  adjustmentType: string;
  pointsChange: number;
  pointsBefore: number;
  pointsAfter: number;
  reason: string;
  isRevoked: boolean;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
  createdAt: string;
}

/**
 * 异常订单
 */
export interface AnomalousOrder {
  orderId: string;
  orderNo: string;
  userId: string;
  amount: number;
  totalPoints: number;
  paymentStatus: number;
  transactionId?: string;
  anomalyType: string;
  anomalyReason: string;
  createdAt: string;
}

/**
 * 对账结果
 */
export interface ReconciliationResult {
  totalOrders: number;
  matchedOrders: number;
  mismatchedOrders: number;
  pendingOrders: number;
  autoFixedOrders: number;
  anomalousOrders: AnomalousOrder[];
}

/**
 * 对账统计
 */
export interface ReconciliationStats {
  totalOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  anomalousCount: number;
  totalAmount: number;
  totalPoints: number;
}

// ==================== 套餐管理 ====================

/**
 * 获取所有套餐（管理员）
 * @returns Promise<RechargePackage[]>
 */
export function getAllPackages(): Promise<ApiResponse<RechargePackage[]>> {
  return get<RechargePackage[]>('/admin/recharge/packages');
}

/**
 * 创建套餐
 * @param data 套餐信息
 * @returns Promise<RechargePackage>
 */
export function createPackage(
  data: PackageFormData
): Promise<ApiResponse<RechargePackage>> {
  return post<RechargePackage>('/admin/recharge/packages', data);
}

/**
 * 更新套餐
 * @param packageId 套餐ID
 * @param data 套餐信息
 * @returns Promise<RechargePackage>
 */
export function updatePackage(
  packageId: string,
  data: Partial<PackageFormData>
): Promise<ApiResponse<RechargePackage>> {
  return put<RechargePackage>(`/admin/recharge/packages/${packageId}`, data);
}

/**
 * 禁用套餐
 * @param packageId 套餐ID
 * @returns Promise<void>
 */
export function disablePackage(packageId: string): Promise<ApiResponse<void>> {
  return del<void>(`/admin/recharge/packages/${packageId}`);
}

/**
 * 更新套餐排序
 * @param sortOrders 排序数据
 * @returns Promise<void>
 */
export function updatePackageSort(
  sortOrders: Array<{ packageId: string; sortOrder: number }>
): Promise<ApiResponse<void>> {
  return put<void>('/admin/recharge/packages/sort', { sortOrders });
}

// ==================== 订单管理 ====================

/**
 * 获取充值订单列表（管理员）
 * @param params 分页和筛选参数
 * @returns Promise<PageResponse<RechargeOrder>>
 */
export function getRechargeOrders(
  params: {
    page?: number;
    pageNum?: number;
    pageSize?: number;
    userId?: string;
    status?: number;
    orderNo?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<PageResponse<RechargeOrder>>> {
  // 兼容page和pageNum
  const apiParams = {
    ...params,
    pageNum: params.pageNum || params.page || 1
  };
  return get<PageResponse<RechargeOrder>>('/admin/recharge/orders', apiParams);
}

/**
 * 获取订单详情（管理员）
 * @param orderId 订单ID
 * @returns Promise<RechargeOrder>
 */
export function getRechargeOrderDetail(
  orderId: string
): Promise<ApiResponse<RechargeOrder>> {
  return get<RechargeOrder>(`/admin/recharge/orders/${orderId}`);
}

// ==================== 积分调整 ====================

/**
 * 调整用户积分
 * @param data 调整信息
 * @returns Promise<AdjustmentLog>
 */
export function adjustUserPoints(
  data: PointsAdjustmentRequest
): Promise<ApiResponse<AdjustmentLog>> {
  return post<AdjustmentLog>('/admin/points-adjust/adjust', data);
}

/**
 * 批量赠送积分
 * @param data 赠送信息
 * @returns Promise<BatchGiftResult>
 */
export function batchGiftPoints(
  data: BatchGiftRequest
): Promise<ApiResponse<BatchGiftResult>> {
  return post<BatchGiftResult>('/admin/points-adjust/batch-gift', data);
}

/**
 * 撤销积分调整
 * @param logId 日志ID
 * @param reason 撤销原因
 * @returns Promise<AdjustmentLog>
 */
export function revokeAdjustment(
  logId: string,
  reason: string
): Promise<ApiResponse<AdjustmentLog>> {
  return post<AdjustmentLog>(`/admin/points-adjust/revoke/${logId}`, { reason });
}

/**
 * 获取积分调整日志
 * @param params 分页和筛选参数
 * @returns Promise<PageResponse<AdjustmentLog>>
 */
export function getAdjustmentLogs(
  params: {
    page?: number;
    pageNum?: number;
    pageSize?: number;
    adminId?: string;
    targetUserId?: string;
    adjustmentType?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<PageResponse<AdjustmentLog>>> {
  // 兼容page和pageNum
  const apiParams = {
    ...params,
    pageNum: params.pageNum || params.page || 1
  };
  return get<PageResponse<AdjustmentLog>>('/admin/points-adjust/adjustment-logs', apiParams);
}

// ==================== 对账管理 ====================

/**
 * 执行对账
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns Promise<ReconciliationResult>
 */
export function reconcileOrders(
  startDate: string,
  endDate: string
): Promise<ApiResponse<ReconciliationResult>> {
  return post<ReconciliationResult>('/admin/recharge/reconcile', { startDate, endDate });
}

/**
 * 获取异常订单
 * @returns Promise<AnomalousOrder[]>
 */
export function getAnomalousOrders(): Promise<ApiResponse<AnomalousOrder[]>> {
  return get<AnomalousOrder[]>('/admin/recharge/anomalous-orders');
}

/**
 * 自动补单
 * @param orderId 订单ID
 * @returns Promise<{ success: boolean }>
 */
export function autoFixOrder(
  orderId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return post<{ success: boolean }>(`/admin/recharge/auto-fix/${orderId}`, {});
}

/**
 * 获取对账统计
 * @param days 天数
 * @returns Promise<ReconciliationStats>
 */
export function getReconciliationStats(
  days?: number
): Promise<ApiResponse<ReconciliationStats>> {
  return get<ReconciliationStats>('/admin/recharge/reconciliation-stats', { days });
}


// ==================== 统计功能 ====================

/**
 * 充值统计数据项
 */
export interface RechargeStatItem {
  date: string;
  totalAmount: number;
  totalPoints: number;
  orderCount: number;
  userCount: number;
}

/**
 * 充值统计汇总
 */
export interface RechargeStatSummary {
  totalAmount: number;
  totalPoints: number;
  totalOrders: number;
  totalUsers: number;
}

/**
 * 充值统计结果
 */
export interface RechargeStatistics {
  stats: RechargeStatItem[];
  summary: RechargeStatSummary;
}

/**
 * 积分流水统计数据项
 */
export interface PointsFlowStatItem {
  date: string;
  earned: number;
  consumed: number;
  net: number;
}

/**
 * 积分流水统计汇总
 */
export interface PointsFlowSummary {
  totalEarned: number;
  totalConsumed: number;
  netChange: number;
  byType: Record<string, number>;
}

/**
 * 积分流水统计结果
 */
export interface PointsFlowStatistics {
  stats: PointsFlowStatItem[];
  summary: PointsFlowSummary;
}

/**
 * 获取充值统计
 * @param params 统计参数
 * @returns Promise<RechargeStatistics>
 */
export function getRechargeStatistics(
  params?: {
    dimension?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<RechargeStatistics>> {
  return get<RechargeStatistics>('/admin/recharge/statistics', params);
}

/**
 * 获取积分流水统计
 * @param params 统计参数
 * @returns Promise<PointsFlowStatistics>
 */
export function getPointsFlowStatistics(
  params?: {
    dimension?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<PointsFlowStatistics>> {
  return get<PointsFlowStatistics>('/admin/points-adjust/flow-statistics', params);
}
