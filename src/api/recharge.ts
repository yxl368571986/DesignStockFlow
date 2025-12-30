/**
 * 充值相关API接口
 */

import { get, post } from '@/utils/request';
import type { ApiResponse, PageResponse, PageParams } from '@/types/api';

/**
 * 充值套餐
 */
export interface RechargePackage {
  packageId: string;
  packageName: string;
  packageCode: string;
  price: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  bonusRate: number;
  valuePerYuan: number;
  sortOrder: number;
  isRecommend: boolean;
  status: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 充值订单
 */
export interface RechargeOrder {
  orderId: string;
  orderNo: string;
  userId: string;
  packageId: string;
  packageName?: string;
  amount: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  paymentMethod: string;
  paymentStatus: number;
  paymentStatusText: string;
  transactionId?: string;
  expireAt: string;
  paidAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
}

/**
 * 创建订单请求
 */
export interface CreateRechargeOrderRequest {
  packageId: string;
  paymentMethod: 'wechat' | 'alipay';
}

/**
 * 创建订单响应
 */
export interface CreateRechargeOrderResponse extends RechargeOrder {
  paymentUrl?: string;
  qrCodeUrl?: string;
}

// ==================== 用户端接口 ====================

/**
 * 获取充值套餐列表
 * @returns Promise<RechargePackage[]>
 */
export function getRechargePackages(): Promise<ApiResponse<RechargePackage[]>> {
  return get<RechargePackage[]>('/recharge/packages');
}

/**
 * 创建充值订单
 * @param data 订单信息
 * @returns Promise<CreateRechargeOrderResponse>
 */
export function createRechargeOrder(
  data: CreateRechargeOrderRequest
): Promise<ApiResponse<CreateRechargeOrderResponse>> {
  return post<CreateRechargeOrderResponse>('/recharge/orders', data);
}

/**
 * 获取订单状态
 * @param orderId 订单ID
 * @returns Promise<RechargeOrder>
 */
export function getRechargeOrderStatus(
  orderId: string
): Promise<ApiResponse<RechargeOrder>> {
  return get<RechargeOrder>(`/recharge/orders/${orderId}`);
}

/**
 * 取消充值订单
 * @param orderId 订单ID
 * @param reason 取消原因
 * @returns Promise<RechargeOrder>
 */
export function cancelRechargeOrder(
  orderId: string,
  reason?: string
): Promise<ApiResponse<RechargeOrder>> {
  return post<RechargeOrder>(`/recharge/orders/${orderId}/cancel`, { reason });
}

/**
 * 获取用户充值订单列表
 * @param params 分页和筛选参数
 * @returns Promise<PageResponse<RechargeOrder>>
 */
export function getUserRechargeOrders(
  params: PageParams & {
    status?: number;
  }
): Promise<ApiResponse<PageResponse<RechargeOrder>>> {
  return get<PageResponse<RechargeOrder>>('/recharge/orders', params);
}
