/**
 * 短信验证码频率限制服务
 * 
 * 实现手机号和IP双维度的防刷保护
 * - 手机号：60秒1次，每日5次
 * - IP：60秒3次，每日20次
 */

import { logger } from '@/utils/logger.js';

/**
 * 频率限制检查结果
 */
export interface RateLimitResult {
  allowed: boolean;
  errorCode?: string;
  retryAfter?: number;  // 需要等待的秒数
  message?: string;
}

/**
 * 限制配置
 */
const LIMITS = {
  // 手机号限制
  PHONE_INTERVAL: 60 * 1000,      // 60秒间隔
  PHONE_DAILY_MAX: 5,             // 每日最多5次
  
  // IP限制
  IP_INTERVAL: 60 * 1000,         // 60秒间隔
  IP_INTERVAL_MAX: 3,             // 60秒内最多3次
  IP_DAILY_MAX: 20,               // 每日最多20次
};

// 存储结构
interface RequestRecord {
  lastRequestTime: number;        // 上次请求时间
  dailyCount: number;             // 当日请求次数
  intervalCount: number;          // 间隔内请求次数
  date: string;                   // 日期（用于重置每日计数）
}

// 内存存储
const phoneRecords = new Map<string, RequestRecord>();
const ipRecords = new Map<string, RequestRecord>();

/**
 * 获取当前日期字符串（yyyy-MM-dd格式）
 */
function getCurrentDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * 获取或创建记录
 */
function getOrCreateRecord(records: Map<string, RequestRecord>, key: string): RequestRecord {
  const currentDate = getCurrentDate();
  let record = records.get(key);
  
  if (!record || record.date !== currentDate) {
    // 新记录或跨天重置
    record = {
      lastRequestTime: 0,
      dailyCount: 0,
      intervalCount: 0,
      date: currentDate,
    };
    records.set(key, record);
  }
  
  return record;
}

/**
 * 检查手机号是否可以请求验证码
 * @param phone 手机号
 */
export async function checkPhoneLimit(phone: string): Promise<RateLimitResult> {
  const record = getOrCreateRecord(phoneRecords, phone);
  const now = Date.now();
  
  // 检查60秒间隔
  const timeSinceLastRequest = now - record.lastRequestTime;
  if (timeSinceLastRequest < LIMITS.PHONE_INTERVAL) {
    const retryAfter = Math.ceil((LIMITS.PHONE_INTERVAL - timeSinceLastRequest) / 1000);
    logger.warn(`[RateLimiter] 手机号请求过于频繁: ${phone.slice(0, 3)}****${phone.slice(-4)}, 需等待${retryAfter}秒`);
    return {
      allowed: false,
      errorCode: 'SMS_002',
      retryAfter,
      message: `获取验证码过于频繁，请${retryAfter}秒后再试`,
    };
  }
  
  // 检查每日限制
  if (record.dailyCount >= LIMITS.PHONE_DAILY_MAX) {
    logger.warn(`[RateLimiter] 手机号每日请求次数已达上限: ${phone.slice(0, 3)}****${phone.slice(-4)}`);
    return {
      allowed: false,
      errorCode: 'SMS_003',
      message: '今日获取验证码次数已达上限，请明日再试',
    };
  }
  
  return { allowed: true };
}

/**
 * 检查IP是否可以请求验证码
 * @param ip IP地址
 */
export async function checkIpLimit(ip: string): Promise<RateLimitResult> {
  const record = getOrCreateRecord(ipRecords, ip);
  const now = Date.now();
  
  // 重置间隔计数（如果超过间隔时间）
  if (now - record.lastRequestTime >= LIMITS.IP_INTERVAL) {
    record.intervalCount = 0;
  }
  
  // 检查60秒内请求次数
  if (record.intervalCount >= LIMITS.IP_INTERVAL_MAX) {
    const timeSinceLastRequest = now - record.lastRequestTime;
    const retryAfter = Math.ceil((LIMITS.IP_INTERVAL - timeSinceLastRequest) / 1000);
    logger.warn(`[RateLimiter] IP请求过于频繁: ${ip}, 需等待${retryAfter}秒`);
    return {
      allowed: false,
      errorCode: 'SMS_008',
      retryAfter: retryAfter > 0 ? retryAfter : 60,
      message: '操作过于频繁，请稍后再试',
    };
  }
  
  // 检查每日限制
  if (record.dailyCount >= LIMITS.IP_DAILY_MAX) {
    logger.warn(`[RateLimiter] IP每日请求次数已达上限: ${ip}`);
    return {
      allowed: false,
      errorCode: 'SMS_008',
      message: '操作过于频繁，请稍后再试',
    };
  }
  
  return { allowed: true };
}

/**
 * 记录一次请求
 * @param phone 手机号
 * @param ip IP地址
 */
export async function recordRequest(phone: string, ip: string): Promise<void> {
  const now = Date.now();
  
  // 更新手机号记录
  const phoneRecord = getOrCreateRecord(phoneRecords, phone);
  phoneRecord.lastRequestTime = now;
  phoneRecord.dailyCount++;
  
  // 更新IP记录
  const ipRecord = getOrCreateRecord(ipRecords, ip);
  
  // 如果超过间隔时间，重置间隔计数
  if (now - ipRecord.lastRequestTime >= LIMITS.IP_INTERVAL) {
    ipRecord.intervalCount = 0;
  }
  
  ipRecord.lastRequestTime = now;
  ipRecord.intervalCount++;
  ipRecord.dailyCount++;
  
  logger.info(`[RateLimiter] 记录请求: 手机号=${phone.slice(0, 3)}****${phone.slice(-4)}, IP=${ip}`);
}

/**
 * 获取统计信息
 */
export function getStats(): { phoneRecords: number; ipRecords: number } {
  return {
    phoneRecords: phoneRecords.size,
    ipRecords: ipRecords.size,
  };
}

/**
 * 清空所有记录（仅用于测试）
 */
export function clearAll(): void {
  phoneRecords.clear();
  ipRecords.clear();
}

// 默认导出
export default {
  checkPhoneLimit,
  checkIpLimit,
  recordRequest,
  getStats,
  clearAll,
};
