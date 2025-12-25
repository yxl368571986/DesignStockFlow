/**
 * 管理后台 - VIP管理相关API
 */
import { get, put, post } from '@/utils/request';

/** 退款申请状态 */
export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';

/** 退款申请信息 */
export interface RefundRequest {
  refundId: string;
  orderNo: string;
  userId: string;
  username: string;
  phone: string;
  packageName: string;
  orderAmount: number;
  refundAmount: number;
  reason: string;
  status: RefundStatus;
  hasDownloaded: boolean;
  downloadCount: number;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectReason?: string;
}

/** 退款列表查询参数 */
export interface RefundListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: RefundStatus;
  startDate?: string;
  endDate?: string;
}

/** 退款列表响应 */
export interface RefundListResponse {
  list: RefundRequest[];
  total: number;
}

/** 处理退款参数 */
export interface ProcessRefundParams {
  action: 'approve' | 'reject';
  rejectReason?: string;
}

/** 安全日志类型 */
export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'payment_blocked'
  | 'suspicious_ip'
  | 'device_limit'
  | 'refund_request'
  | 'password_change'
  | 'secondary_auth';

/** 风险等级 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** 安全日志信息 */
export interface SecurityLog {
  logId: string;
  userId: string;
  username: string;
  eventType: SecurityEventType;
  riskLevel: RiskLevel;
  ipAddress: string;
  userAgent: string;
  location?: string;
  details: string;
  createdAt: string;
}

/** 安全日志查询参数 */
export interface SecurityLogParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  eventType?: SecurityEventType;
  riskLevel?: RiskLevel;
  startDate?: string;
  endDate?: string;
}

/** 安全日志响应 */
export interface SecurityLogResponse {
  list: SecurityLog[];
  total: number;
}

/**
 * 获取退款申请列表
 */
export function getRefundList(params: RefundListParams) {
  return get<RefundListResponse>('/admin/vip/refunds', params);
}

/**
 * 处理退款申请
 */
export function processRefund(refundId: string, data: ProcessRefundParams) {
  return put(`/admin/vip/refunds/${refundId}`, data);
}

/**
 * 获取安全日志列表
 */
export function getSecurityLogs(params: SecurityLogParams) {
  return get<SecurityLogResponse>('/admin/security/logs', params);
}

/**
 * 解除用户支付限制
 */
export function unlockUserPayment(userId: string) {
  return post(`/admin/users/${userId}/unlock-payment`);
}

/**
 * 获取VIP统计数据
 */
export function getVipStatistics(params?: { startDate?: string; endDate?: string }) {
  return get('/admin/vip/statistics', params);
}

/**
 * 获取退款统计
 */
export function getRefundStatistics(params?: { startDate?: string; endDate?: string }) {
  return get('/admin/vip/refunds/statistics', params);
}

/**
 * 获取支付渠道分布
 */
export function getPaymentChannelDistribution(params?: { startDate?: string; endDate?: string }) {
  return get('/admin/vip/payment-channels', params);
}

/**
 * 获取异常订单统计
 */
export function getAbnormalOrderStatistics(params?: { startDate?: string; endDate?: string }) {
  return get('/admin/vip/abnormal-orders', params);
}
