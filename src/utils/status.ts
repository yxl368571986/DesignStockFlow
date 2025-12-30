/**
 * 状态相关工具函数
 * 提供订单状态、支付状态、退款状态等的文本和类型转换
 */

/**
 * VIP订单支付状态映射
 */
export const VIP_ORDER_STATUS_MAP = {
  text: {
    0: '待支付',
    1: '已支付',
    2: '已取消',
    3: '已退款',
    4: '退款中'
  } as Record<number, string>,
  type: {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'danger',
    4: 'warning'
  } as Record<number, string>
}

/**
 * 积分兑换状态映射
 */
export const POINTS_EXCHANGE_STATUS_MAP = {
  text: {
    pending: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  } as Record<string, string>,
  type: {
    pending: 'warning',
    shipped: 'primary',
    completed: 'success',
    cancelled: 'info'
  } as Record<string, string>
}

/**
 * 支付方式映射
 */
export const PAYMENT_METHOD_MAP = {
  wechat: '微信支付',
  alipay: '支付宝',
  points: '积分兑换'
} as Record<string, string>

/**
 * 退款状态映射
 */
export const REFUND_STATUS_MAP = {
  text: {
    pending: '待处理',
    approved: '已批准',
    rejected: '已拒绝',
    processing: '处理中',
    completed: '已完成',
    failed: '退款失败',
    cancelled: '已取消'
  } as Record<string, string>,
  type: {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    processing: 'info',
    completed: 'success',
    failed: 'danger',
    cancelled: 'info'
  } as Record<string, 'warning' | 'success' | 'danger' | 'info'>
}

/**
 * 风控审核状态映射
 */
export const RISK_CONTROL_STATUS_MAP = {
  text: {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  } as Record<string, string>,
  type: {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  } as Record<string, string>
}

/**
 * 获取VIP订单状态文本
 */
export function getVipOrderStatusText(status: number): string {
  return VIP_ORDER_STATUS_MAP.text[status] || '未知状态'
}

/**
 * 获取VIP订单状态类型
 */
export function getVipOrderStatusType(status: number): string {
  return VIP_ORDER_STATUS_MAP.type[status] || 'info'
}

/**
 * 获取积分兑换状态文本
 */
export function getPointsExchangeStatusText(status: string): string {
  return POINTS_EXCHANGE_STATUS_MAP.text[status] || status
}

/**
 * 获取积分兑换状态类型
 */
export function getPointsExchangeStatusType(status: string): string {
  return POINTS_EXCHANGE_STATUS_MAP.type[status] || 'info'
}

/**
 * 获取支付方式文本
 */
export function getPaymentMethodText(method: string): string {
  return PAYMENT_METHOD_MAP[method] || method
}

/**
 * 获取退款状态文本
 */
export function getRefundStatusText(status: string): string {
  return REFUND_STATUS_MAP.text[status] || status
}

/**
 * 获取退款状态类型
 */
export function getRefundStatusType(status: string): 'warning' | 'success' | 'danger' | 'info' {
  return REFUND_STATUS_MAP.type[status] || 'info'
}

/**
 * 获取风控审核状态文本
 */
export function getRiskControlStatusText(status: string): string {
  return RISK_CONTROL_STATUS_MAP.text[status] || status
}

/**
 * 获取风控审核状态类型
 */
export function getRiskControlStatusType(status: string): string {
  return RISK_CONTROL_STATUS_MAP.type[status] || 'info'
}
