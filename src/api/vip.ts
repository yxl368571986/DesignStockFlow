/**
 * VIP相关API接口
 * 包含VIP套餐、订单、支付、积分兑换等功能
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
  isLifetimeVip: boolean;
  daysRemaining: number;
  privileges: VipPrivilege[];
}

/**
 * 创建订单请求
 */
export interface CreateOrderRequest {
  packageId: string;
  paymentMethod: string;
  sourceUrl?: string;
}

/**
 * 创建订单响应
 */
export interface CreateOrderResponse {
  orderNo: string;
  orderId: string;
  amount: number;
  expireTime: number;
}

/**
 * 支付响应
 */
export interface PaymentResponse {
  orderNo: string;
  qrCodeUrl?: string;
  payUrl?: string;
  expireTime: number;
}

/**
 * 支付状态响应
 */
export interface PaymentStatusResponse {
  orderNo: string;
  paymentStatus: number;
  paidAt?: string;
}

/**
 * 退款请求
 */
export interface RefundRequest {
  reason: string;
  reasonType: string;
}

/**
 * 积分兑换信息
 */
export interface PointsExchangeInfo {
  canExchange: boolean;
  hasExchangedThisMonth: boolean;
  pointsRequired: number;
  userPoints: number;
  maxMonths: number;
}

/**
 * 积分兑换请求
 */
export interface PointsExchangeRequest {
  months: number;
}

/**
 * 二次验证请求
 */
export interface SecondaryAuthRequest {
  orderNo: string;
  code: string;
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  sessionId: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  lastActiveAt: string;
  isActive: boolean;
  isCurrent: boolean;
}

/**
 * 下载权限信息
 */
export interface DownloadPermission {
  canDownload: boolean;
  reason?: string;
  isVip: boolean;
  remainingDownloads: number;
  dailyLimit: number;
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


// ==================== 用户端VIP订单API ====================

/**
 * 创建VIP订单
 * @param data 订单信息
 * @returns Promise<CreateOrderResponse>
 */
export function createVipOrder(data: CreateOrderRequest): Promise<ApiResponse<CreateOrderResponse>> {
  return post<CreateOrderResponse>('/vip/orders', data);
}

/**
 * 获取用户订单列表
 * @param params 分页参数
 * @returns Promise<PageResponse<VipOrder>>
 */
export function getUserOrders(
  params: { page: number; pageSize: number; status?: number }
): Promise<ApiResponse<PageResponse<VipOrder>>> {
  return get<PageResponse<VipOrder>>('/vip/orders', params);
}

/**
 * 获取订单详情
 * @param orderNo 订单号
 * @returns Promise<VipOrder>
 */
export function getOrderDetail(orderNo: string): Promise<ApiResponse<VipOrder>> {
  return get<VipOrder>(`/vip/orders/${orderNo}`);
}

/**
 * 取消订单
 * @param orderNo 订单号
 * @returns Promise<void>
 */
export function cancelOrder(orderNo: string): Promise<ApiResponse<void>> {
  return post<void>(`/vip/orders/${orderNo}/cancel`);
}

/**
 * 发起支付
 * @param orderNo 订单号
 * @returns Promise<PaymentResponse>
 */
export function initiatePayment(orderNo: string): Promise<ApiResponse<PaymentResponse>> {
  return post<PaymentResponse>(`/vip/orders/${orderNo}/pay`);
}

/**
 * 查询支付状态
 * @param orderNo 订单号
 * @returns Promise<PaymentStatusResponse>
 */
export function getPaymentStatus(orderNo: string): Promise<ApiResponse<PaymentStatusResponse>> {
  return get<PaymentStatusResponse>(`/vip/orders/${orderNo}/status`);
}

/**
 * 申请退款
 * @param orderNo 订单号
 * @param data 退款信息
 * @returns Promise<void>
 */
export function requestRefund(orderNo: string, data: RefundRequest): Promise<ApiResponse<void>> {
  return post<void>(`/vip/orders/${orderNo}/refund`, data);
}

// ==================== 积分兑换API ====================

/**
 * 获取积分兑换信息
 * @returns Promise<PointsExchangeInfo>
 */
export function getPointsExchangeInfo(): Promise<ApiResponse<PointsExchangeInfo>> {
  return get<PointsExchangeInfo>('/vip/points-exchange/info');
}

/**
 * 积分兑换VIP
 * @param data 兑换信息
 * @returns Promise<void>
 */
export function exchangePointsForVip(data: PointsExchangeRequest): Promise<ApiResponse<void>> {
  return post<void>('/vip/points-exchange', data);
}

/**
 * 获取积分兑换记录
 * @param params 分页参数
 * @returns Promise<PageResponse<any>>
 */
export function getPointsExchangeRecords(
  params: PageParams
): Promise<ApiResponse<PageResponse<{ exchangeId: string; pointsCost: number; vipDaysGranted: number; createdAt: string }>>> {
  return get<PageResponse<{ exchangeId: string; pointsCost: number; vipDaysGranted: number; createdAt: string }>>('/vip/points-exchange/records', params);
}

// ==================== 二次验证API ====================

/**
 * 发送二次验证码
 * @param orderNo 订单号
 * @returns Promise<void>
 */
export function sendSecondaryAuthCode(orderNo: string): Promise<ApiResponse<void>> {
  return post<void>('/vip/auth/send-code', { orderNo });
}

/**
 * 验证二次验证码
 * @param data 验证信息
 * @returns Promise<void>
 */
export function verifySecondaryAuthCode(data: SecondaryAuthRequest): Promise<ApiResponse<void>> {
  return post<void>('/vip/auth/verify-code', data);
}

// ==================== 设备管理API ====================

/**
 * 获取用户设备列表
 * @returns Promise<DeviceInfo[]>
 */
export function getUserDevices(): Promise<ApiResponse<DeviceInfo[]>> {
  return get<DeviceInfo[]>('/user/devices');
}

/**
 * 踢出设备
 * @param sessionId 会话ID
 * @returns Promise<void>
 */
export function kickDevice(sessionId: string): Promise<ApiResponse<void>> {
  return del<void>(`/user/devices/${sessionId}`);
}

// ==================== 下载权限API ====================

/**
 * 检查下载权限
 * @param resourceId 资源ID
 * @returns Promise<DownloadPermission>
 */
export function checkDownloadPermission(resourceId: string): Promise<ApiResponse<DownloadPermission>> {
  return get<DownloadPermission>(`/resources/${resourceId}/download-permission`);
}

/**
 * 获取下载统计
 * @returns Promise<{ vipDownloadCount: number; freeDownloadCount: number; dailyLimit: number }>
 */
export function getDownloadStats(): Promise<ApiResponse<{ vipDownloadCount: number; freeDownloadCount: number; dailyLimit: number }>> {
  return get<{ vipDownloadCount: number; freeDownloadCount: number; dailyLimit: number }>('/user/download-stats');
}

// ==================== 通知API ====================

/**
 * 获取用户通知列表
 * @param params 分页参数
 * @returns Promise<PageResponse<Notification>>
 */
export interface Notification {
  notificationId: string;
  title: string;
  content: string;
  type: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export function getUserNotifications(
  params: PageParams & { isRead?: boolean }
): Promise<ApiResponse<PageResponse<Notification>>> {
  return get<PageResponse<Notification>>('/user/notifications', params);
}

/**
 * 标记通知为已读
 * @param notificationId 通知ID
 * @returns Promise<void>
 */
export function markNotificationRead(notificationId: string): Promise<ApiResponse<void>> {
  return put<void>(`/user/notifications/${notificationId}/read`);
}

/**
 * 标记所有通知为已读
 * @returns Promise<void>
 */
export function markAllNotificationsRead(): Promise<ApiResponse<void>> {
  return put<void>('/user/notifications/read-all');
}

/**
 * 获取未读通知数量
 * @returns Promise<{ count: number }>
 */
export function getUnreadNotificationCount(): Promise<ApiResponse<{ count: number }>> {
  return get<{ count: number }>('/user/notifications/unread-count');
}
