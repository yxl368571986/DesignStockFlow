/**
 * VIP支付系统配置模块
 * 负责加载和管理支付相关的环境配置
 */

export type PaymentEnv = 'sandbox' | 'production';

export interface WechatPayConfig {
  appId: string;
  mchId: string;
  apiKeyV3: string;
  certSerialNo: string;
  privateKeyPath: string;
  certPath: string;
  platformCertPath: string;
  notifyUrl: string;
}

export interface AlipayConfig {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
  gateway: string;
  notifyUrl: string;
  returnUrl: string;
}

export interface SecurityConfig {
  secondaryAuthThreshold: number;  // 二次验证阈值（分）
  maxUnpaidOrdersPerHour: number;  // 每小时最大未支付订单数
  maxDevicesPerUser: number;       // 每用户最大设备数
}

export interface VipConfig {
  dailyDownloadLimit: number;      // VIP每日下载上限
  freeDailyDownloadLimit: number;  // 普通用户每日免费下载次数
  orderTimeoutMinutes: number;     // 订单超时时间（分钟）
  refundValidDays: number;         // 退款有效期（天）
  gracePeriodDays: number;         // VIP宽限期（天）
}

export interface PointsExchangeConfig {
  pointsPerMonth: number;          // 每月VIP所需积分
  maxExchangeMonths: number;       // 单次最大兑换月数
}

export interface PaymentConfig {
  env: PaymentEnv;
  wechat: WechatPayConfig;
  alipay: AlipayConfig;
  security: SecurityConfig;
  vip: VipConfig;
  pointsExchange: PointsExchangeConfig;
}

/**
 * 获取支付环境
 */
function getPaymentEnv(): PaymentEnv {
  const env = process.env.PAYMENT_ENV || 'sandbox';
  if (env !== 'sandbox' && env !== 'production') {
    console.warn(`Invalid PAYMENT_ENV: ${env}, falling back to sandbox`);
    return 'sandbox';
  }
  return env;
}

/**
 * 获取支付宝网关地址
 */
function getAlipayGateway(env: PaymentEnv): string {
  if (process.env.ALIPAY_GATEWAY) {
    return process.env.ALIPAY_GATEWAY;
  }
  return env === 'production'
    ? 'https://openapi.alipay.com/gateway.do'
    : 'https://openapi.alipaydev.com/gateway.do';
}

/**
 * 加载支付配置
 */
export function loadPaymentConfig(): PaymentConfig {
  const env = getPaymentEnv();

  return {
    env,
    wechat: {
      appId: process.env.WECHAT_APP_ID || '',
      mchId: process.env.WECHAT_MCH_ID || '',
      apiKeyV3: process.env.WECHAT_PAY_API_KEY_V3 || process.env.WECHAT_API_V3_KEY || '',
      certSerialNo: process.env.WECHAT_PAY_CERT_SERIAL_NO || '',
      privateKeyPath: process.env.WECHAT_KEY_PATH || './certs/wechat/apiclient_key.pem',
      certPath: process.env.WECHAT_CERT_PATH || './certs/wechat/apiclient_cert.pem',
      platformCertPath: process.env.WECHAT_PAY_PLATFORM_CERT_PATH || './certs/wechat/wechatpay_cert.pem',
      notifyUrl: process.env.WECHAT_NOTIFY_URL || '',
    },
    alipay: {
      appId: process.env.ALIPAY_APP_ID || '',
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      gateway: getAlipayGateway(env),
      notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
      returnUrl: process.env.ALIPAY_RETURN_URL || '',
    },
    security: {
      secondaryAuthThreshold: parseInt(process.env.SECONDARY_AUTH_THRESHOLD || '20000', 10),
      maxUnpaidOrdersPerHour: parseInt(process.env.MAX_UNPAID_ORDERS_PER_HOUR || '5', 10),
      maxDevicesPerUser: parseInt(process.env.MAX_DEVICES_PER_USER || '3', 10),
    },
    vip: {
      dailyDownloadLimit: parseInt(process.env.VIP_DAILY_DOWNLOAD_LIMIT || '50', 10),
      freeDailyDownloadLimit: parseInt(process.env.FREE_DAILY_DOWNLOAD_LIMIT || '2', 10),
      orderTimeoutMinutes: parseInt(process.env.ORDER_TIMEOUT_MINUTES || '15', 10),
      refundValidDays: parseInt(process.env.REFUND_VALID_DAYS || '7', 10),
      gracePeriodDays: parseInt(process.env.VIP_GRACE_PERIOD_DAYS || '7', 10),
    },
    pointsExchange: {
      pointsPerMonth: parseInt(process.env.POINTS_PER_VIP_MONTH || '1000', 10),
      maxExchangeMonths: parseInt(process.env.MAX_EXCHANGE_MONTHS || '3', 10),
    },
  };
}

/**
 * 验证支付配置是否完整
 */
export function validatePaymentConfig(config: PaymentConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 生产环境必须配置支付参数
  if (config.env === 'production') {
    // 微信支付配置检查
    if (!config.wechat.appId) errors.push('缺少微信支付 WECHAT_APP_ID');
    if (!config.wechat.mchId) errors.push('缺少微信支付 WECHAT_MCH_ID');
    if (!config.wechat.apiKeyV3) errors.push('缺少微信支付 WECHAT_PAY_API_KEY_V3');
    if (!config.wechat.notifyUrl) errors.push('缺少微信支付 WECHAT_NOTIFY_URL');

    // 支付宝配置检查
    if (!config.alipay.appId) errors.push('缺少支付宝 ALIPAY_APP_ID');
    if (!config.alipay.privateKey) errors.push('缺少支付宝 ALIPAY_PRIVATE_KEY');
    if (!config.alipay.alipayPublicKey) errors.push('缺少支付宝 ALIPAY_PUBLIC_KEY');
    if (!config.alipay.notifyUrl) errors.push('缺少支付宝 ALIPAY_NOTIFY_URL');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 检查微信支付是否可用
 */
export function isWechatPayAvailable(config: PaymentConfig): boolean {
  return !!(
    config.wechat.appId &&
    config.wechat.mchId &&
    config.wechat.apiKeyV3 &&
    config.wechat.notifyUrl
  );
}

/**
 * 检查支付宝是否可用
 */
export function isAlipayAvailable(config: PaymentConfig): boolean {
  return !!(
    config.alipay.appId &&
    config.alipay.privateKey &&
    config.alipay.alipayPublicKey &&
    config.alipay.notifyUrl
  );
}

// 单例配置实例
let paymentConfigInstance: PaymentConfig | null = null;

/**
 * 获取支付配置（单例）
 */
export function getPaymentConfig(): PaymentConfig {
  if (!paymentConfigInstance) {
    paymentConfigInstance = loadPaymentConfig();
  }
  return paymentConfigInstance;
}

/**
 * 重新加载支付配置
 */
export function reloadPaymentConfig(): PaymentConfig {
  paymentConfigInstance = loadPaymentConfig();
  return paymentConfigInstance;
}

export default getPaymentConfig;
