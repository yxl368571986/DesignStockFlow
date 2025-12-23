/**
 * 积分相关API接口
 */

import { get, post, put, del } from '@/utils/request';
import type { ApiResponse, PageResponse, PageParams } from '@/types/api';

/**
 * 用户积分信息
 */
export interface UserPointsInfo {
  userId: string;
  pointsBalance: number;
  pointsTotal: number;
  userLevel: number;
  levelName: string;
  nextLevelPoints: number;
  privileges: string[];
}

/**
 * 积分记录
 */
export interface PointsRecord {
  recordId: string;
  userId: string;
  pointsChange: number;
  pointsBalance: number;
  changeType: string;
  source: string;
  sourceId: string;
  description: string;
  createdAt: string;
}

/**
 * 积分商品
 */
export interface PointsProduct {
  productId: string;
  productName: string;
  productType: string;
  productCode: string;
  pointsRequired: number;
  productValue: string;
  stock: number;
  imageUrl: string;
  description: string;
  sortOrder: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 积分兑换记录
 */
export interface PointsExchangeRecord {
  exchangeId: string;
  userId: string;
  productId: string;
  productName: string;
  productType: string;
  pointsCost: number;
  deliveryStatus: number;
  deliveryAddress: string;
  trackingNumber: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 积分充值套餐
 */
export interface PointsRechargePackage {
  packageId: string;
  packageName: string;
  points: number;
  price: number;
  discount: number;
  description: string;
}

/**
 * 每日任务
 */
export interface DailyTask {
  taskId: string;
  taskName: string;
  taskCode: string;
  taskType: string;
  pointsReward: number;
  targetCount: number;
  completedCount: number;
  isCompleted: boolean;
  description: string;
  sortOrder: number;
}

/**
 * 积分规则
 */
export interface PointsRule {
  ruleId: string;
  ruleName: string;
  ruleCode: string;
  ruleType: string;
  pointsValue: number;
  description: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 积分统计
 */
export interface PointsStatistics {
  totalEarned: number;
  totalConsumed: number;
  totalExchanged: number;
  currentBalance: number;
  earnTrend: Array<{
    date: string;
    amount: number;
  }>;
  consumeTrend: Array<{
    date: string;
    amount: number;
  }>;
  sourceDistribution: Array<{
    source: string;
    amount: number;
  }>;
}

/**
 * 获取用户积分信息
 * @returns Promise<UserPointsInfo>
 */
export function getMyPointsInfo(): Promise<ApiResponse<UserPointsInfo>> {
  return get<UserPointsInfo>('/points/my-info');
}

/**
 * 获取积分明细记录
 * @param params 分页和筛选参数
 * @returns Promise<PageResponse<PointsRecord>>
 */
export function getPointsRecords(
  params: PageParams & {
    changeType?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<PageResponse<PointsRecord>>> {
  return get<PageResponse<PointsRecord>>('/points/records', params);
}

/**
 * 获取积分商品列表
 * @param params 筛选参数
 * @returns Promise<PointsProduct[]>
 */
export function getPointsProducts(params?: {
  productType?: string;
}): Promise<ApiResponse<PointsProduct[]>> {
  return get<PointsProduct[]>('/points/products', params);
}

/**
 * 兑换积分商品
 * @param data 兑换信息
 * @returns Promise<PointsExchangeRecord>
 */
export function exchangeProduct(data: {
  productId: string;
  deliveryAddress?: string;
}): Promise<ApiResponse<PointsExchangeRecord>> {
  return post<PointsExchangeRecord>('/points/exchange', data);
}

/**
 * 获取兑换记录
 * @param params 分页参数
 * @returns Promise<PageResponse<PointsExchangeRecord>>
 */
export function getExchangeRecords(
  params: PageParams
): Promise<ApiResponse<PageResponse<PointsExchangeRecord>>> {
  return get<PageResponse<PointsExchangeRecord>>('/points/exchange-records', params);
}

/**
 * 获取积分充值套餐
 * @returns Promise<PointsRechargePackage[]>
 */
export function getRechargePackages(): Promise<ApiResponse<PointsRechargePackage[]>> {
  return get<PointsRechargePackage[]>('/points/recharge-packages');
}

/**
 * 创建积分充值订单
 * @param data 充值信息
 * @returns Promise<{ orderId: string; orderNo: string }>
 */
export function createRecharge(data: {
  packageId: string;
  paymentMethod: string;
}): Promise<ApiResponse<{ orderId: string; orderNo: string }>> {
  return post<{ orderId: string; orderNo: string }>('/points/recharge', data);
}

/**
 * 获取每日任务列表
 * @returns Promise<DailyTask[]>
 */
export function getDailyTasks(): Promise<ApiResponse<DailyTask[]>> {
  return get<DailyTask[]>('/points/daily-tasks');
}

/**
 * 完成任务
 * @param taskCode 任务代码
 * @returns Promise<{ pointsReward: number }>
 */
export function completeTask(
  taskCode: string
): Promise<ApiResponse<{ pointsReward: number }>> {
  return post<{ pointsReward: number }>(`/points/daily-tasks/${taskCode}/complete`, {});
}

/**
 * 每日签到
 * @returns Promise<{ pointsReward: number }>
 */
export function dailySignin(): Promise<ApiResponse<{ pointsReward: number }>> {
  return post<{ pointsReward: number }>('/points/signin', {});
}

/**
 * 获取积分规则（管理员）
 * @returns Promise<PointsRule[]>
 */
export function getPointsRules(): Promise<ApiResponse<PointsRule[]>> {
  return get<PointsRule[]>('/admin/points/rules');
}

/**
 * 更新积分规则（管理员）
 * @param ruleId 规则ID
 * @param data 规则信息
 * @returns Promise<PointsRule>
 */
export function updatePointsRule(
  ruleId: string,
  data: Partial<PointsRule>
): Promise<ApiResponse<PointsRule>> {
  return put<PointsRule>(`/admin/points/rules/${ruleId}`, data);
}

/**
 * 获取积分商品列表（管理员）
 * @returns Promise<PointsProduct[]>
 */
export function getAdminPointsProducts(): Promise<ApiResponse<PointsProduct[]>> {
  return get<PointsProduct[]>('/admin/points/products');
}

/**
 * 添加积分商品（管理员）
 * @param data 商品信息
 * @returns Promise<PointsProduct>
 */
export function createPointsProduct(
  data: Partial<PointsProduct>
): Promise<ApiResponse<PointsProduct>> {
  return post<PointsProduct>('/admin/points/products', data);
}

/**
 * 编辑积分商品（管理员）
 * @param productId 商品ID
 * @param data 商品信息
 * @returns Promise<PointsProduct>
 */
export function updatePointsProduct(
  productId: string,
  data: Partial<PointsProduct>
): Promise<ApiResponse<PointsProduct>> {
  return put<PointsProduct>(`/admin/points/products/${productId}`, data);
}

/**
 * 删除积分商品（管理员）
 * @param productId 商品ID
 * @returns Promise<void>
 */
export function deletePointsProduct(productId: string): Promise<ApiResponse<void>> {
  return del<void>(`/admin/points/products/${productId}`);
}

/**
 * 获取兑换记录（管理员）
 * @param params 分页和筛选参数
 * @returns Promise<PageResponse<PointsExchangeRecord>>
 */
export function getAdminExchangeRecords(
  params: PageParams & {
    deliveryStatus?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<PageResponse<PointsExchangeRecord>>> {
  return get<PageResponse<PointsExchangeRecord>>('/admin/points/exchange-records', params);
}

/**
 * 发货（管理员）
 * @param exchangeId 兑换记录ID
 * @param data 发货信息
 * @returns Promise<void>
 */
export function shipExchangeProduct(
  exchangeId: string,
  data: {
    trackingNumber: string;
  }
): Promise<ApiResponse<void>> {
  return put<void>(`/admin/points/exchange-records/${exchangeId}/ship`, data);
}

/**
 * 获取积分统计（管理员）
 * @returns Promise<PointsStatistics>
 */
export function getPointsStatistics(): Promise<ApiResponse<PointsStatistics>> {
  return get<PointsStatistics>('/admin/points/statistics');
}

/**
 * 手动调整用户积分（管理员）
 * @param userId 用户ID
 * @param data 积分调整信息
 * @returns Promise<void>
 */
export function adjustUserPoints(
  userId: string,
  data: {
    pointsChange: number;
    reason: string;
  }
): Promise<ApiResponse<void>> {
  return post<void>(`/admin/users/${userId}/points/adjust`, data);
}
