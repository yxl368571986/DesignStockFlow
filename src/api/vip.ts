/**
 * VIP相关API接口
 */

import { get, post, put, del } from '@/utils/request';
import type { ApiResponse, PageResponse, PageParams } from '@/types/api';

/**
 * VIP套餐信息
 */
export interface VipPackage {
  packageId: string;
  packageName: string;
  packageCode: string;
  durationDays: number;
  originalPrice: number;
  currentPrice: number;
  description: string;
  sortOrder: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * VIP特权信息
 */
export interface VipPrivilege {
  privilegeId: string;
  privilegeName: string;
  privilegeCode: string;
  privilegeType: string;
  privilegeValue: string;
  description: string;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 用户VIP信息
 */
export interface UserVipInfo {
  userId: string;
  vipLevel: number;
  vipExpireAt: string | null;
  isVip: boolean;
  daysRemaining: number;
  privileges: VipPrivilege[];
}

/**
 * VIP订单信息
 */
export interface VipOrder {
  orderId: string;
  orderNo: string;
  userId: string;
  packageId: string;
  packageName: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: number;
  transactionId: string;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * VIP统计信息
 */
export interface VipStatistics {
  totalVipUsers: number;
  todayNewVipUsers: number;
  monthNewVipUsers: number;
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  packageSales: Array<{
    packageName: string;
    salesCount: number;
  }>;
  userGrowthTrend: Array<{
    date: string;
    count: number;
  }>;
  revenueTrend: Array<{
    date: string;
    amount: number;
  }>;
}

/**
 * 获取VIP套餐列表（前台）
 * @returns Promise<VipPackage[]>
 */
export function getVipPackages(): Promise<ApiResponse<VipPackage[]>> {
  return get<VipPackage[]>('/vip/packages');
}

/**
 * 获取VIP特权列表（前台）
 * @returns Promise<VipPrivilege[]>
 */
export function getVipPrivileges(): Promise<ApiResponse<VipPrivilege[]>> {
  return get<VipPrivilege[]>('/vip/privileges');
}

/**
 * 获取用户VIP信息（需要登录）
 * @returns Promise<UserVipInfo>
 */
export function getUserVipInfo(): Promise<ApiResponse<UserVipInfo>> {
  return get<UserVipInfo>('/vip/my-info');
}

/**
 * 获取所有VIP套餐（管理员）
 * @returns Promise<VipPackage[]>
 */
export function getAllVipPackages(): Promise<ApiResponse<VipPackage[]>> {
  return get<VipPackage[]>('/vip/admin/packages');
}

/**
 * 创建VIP套餐（管理员）
 * @param data 套餐信息
 * @returns Promise<VipPackage>
 */
export function createVipPackage(data: Partial<VipPackage>): Promise<ApiResponse<VipPackage>> {
  return post<VipPackage>('/vip/admin/packages', data);
}

/**
 * 更新VIP套餐（管理员）
 * @param packageId 套餐ID
 * @param data 套餐信息
 * @returns Promise<VipPackage>
 */
export function updateVipPackage(
  packageId: string,
  data: Partial<VipPackage>
): Promise<ApiResponse<VipPackage>> {
  return put<VipPackage>(`/vip/admin/packages/${packageId}`, data);
}

/**
 * 删除VIP套餐（管理员）
 * @param packageId 套餐ID
 * @returns Promise<void>
 */
export function deleteVipPackage(packageId: string): Promise<ApiResponse<void>> {
  return del<void>(`/vip/admin/packages/${packageId}`);
}

/**
 * 获取所有VIP特权（管理员）
 * @returns Promise<VipPrivilege[]>
 */
export function getAllVipPrivileges(): Promise<ApiResponse<VipPrivilege[]>> {
  return get<VipPrivilege[]>('/vip/admin/privileges');
}

/**
 * 更新VIP特权配置（管理员）
 * @param privilegeId 特权ID
 * @param data 特权信息
 * @returns Promise<VipPrivilege>
 */
export function updateVipPrivilege(
  privilegeId: string,
  data: Partial<VipPrivilege>
): Promise<ApiResponse<VipPrivilege>> {
  return put<VipPrivilege>(`/vip/admin/privileges/${privilegeId}`, data);
}

/**
 * 获取VIP订单列表（管理员）
 * @param params 分页和筛选参数
 * @returns Promise<PageResponse<VipOrder>>
 */
export function getVipOrders(
  params: PageParams & {
    paymentStatus?: number;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<PageResponse<VipOrder>>> {
  return get<PageResponse<VipOrder>>('/vip/admin/orders', params);
}

/**
 * 获取VIP订单详情（管理员）
 * @param orderId 订单ID
 * @returns Promise<VipOrder>
 */
export function getVipOrderById(orderId: string): Promise<ApiResponse<VipOrder>> {
  return get<VipOrder>(`/vip/admin/orders/${orderId}`);
}

/**
 * VIP订单退款（管理员）
 * @param orderId 订单ID
 * @param reason 退款原因
 * @returns Promise<void>
 */
export function refundVipOrder(orderId: string, reason: string): Promise<ApiResponse<void>> {
  return post<void>(`/vip/admin/orders/${orderId}/refund`, { reason });
}

/**
 * 获取VIP统计数据（管理员）
 * @returns Promise<VipStatistics>
 */
export function getVipStatistics(): Promise<ApiResponse<VipStatistics>> {
  return get<VipStatistics>('/vip/admin/statistics');
}

/**
 * 手动调整用户VIP（管理员）
 * @param userId 用户ID
 * @param data VIP信息
 * @returns Promise<void>
 */
export function adjustUserVip(
  userId: string,
  data: {
    vipLevel: number;
    vipExpireAt: string;
    reason: string;
  }
): Promise<ApiResponse<void>> {
  return put<void>(`/vip/admin/users/${userId}/vip`, data);
}
