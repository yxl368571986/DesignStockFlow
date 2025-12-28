/**
 * 验证码存储服务
 * 
 * 使用内存存储（Map）管理验证码，支持TTL过期机制
 * 生产环境可扩展为Redis存储
 */

import { logger } from '@/utils/logger.js';

/**
 * 验证码数据结构
 */
export interface VerificationCode {
  code: string;           // 6位验证码
  createTime: number;     // 创建时间戳（毫秒）
  used: boolean;          // 是否已使用
}

/**
 * 存储条目（包含过期时间）
 */
interface StoreEntry {
  data: VerificationCode;
  expireAt: number;       // 过期时间戳（毫秒）
}

// 内存存储
const store = new Map<string, StoreEntry>();

// 默认过期时间：5分钟
const DEFAULT_TTL = 5 * 60 * 1000;

// 清理间隔：1分钟
const CLEANUP_INTERVAL = 60 * 1000;

// 清理定时器
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * 生成存储key
 * @param phone 手机号
 */
function getKey(phone: string): string {
  return `register_sms_${phone}`;
}

/**
 * 存储验证码
 * @param phone 手机号
 * @param code 验证码
 * @param ttl 过期时间（毫秒），默认5分钟
 */
export async function set(phone: string, code: string, ttl: number = DEFAULT_TTL): Promise<void> {
  const key = getKey(phone);
  const now = Date.now();
  
  const entry: StoreEntry = {
    data: {
      code,
      createTime: now,
      used: false,
    },
    expireAt: now + ttl,
  };
  
  store.set(key, entry);
  logger.info(`[VerificationCodeStore] 存储验证码: ${phone.slice(0, 3)}****${phone.slice(-4)}`);
}

/**
 * 获取验证码
 * @param phone 手机号
 * @returns 验证码数据或null（不存在或已过期）
 */
export async function get(phone: string): Promise<VerificationCode | null> {
  const key = getKey(phone);
  const entry = store.get(key);
  
  if (!entry) {
    return null;
  }
  
  // 检查是否过期
  if (Date.now() > entry.expireAt) {
    store.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * 标记验证码为已使用
 * @param phone 手机号
 */
export async function markAsUsed(phone: string): Promise<void> {
  const key = getKey(phone);
  const entry = store.get(key);
  
  if (entry) {
    entry.data.used = true;
    store.set(key, entry);
    logger.info(`[VerificationCodeStore] 标记验证码已使用: ${phone.slice(0, 3)}****${phone.slice(-4)}`);
  }
}

/**
 * 删除验证码
 * @param phone 手机号
 */
export async function remove(phone: string): Promise<void> {
  const key = getKey(phone);
  store.delete(key);
  logger.info(`[VerificationCodeStore] 删除验证码: ${phone.slice(0, 3)}****${phone.slice(-4)}`);
}

/**
 * 检查是否存在有效验证码
 * @param phone 手机号
 */
export async function exists(phone: string): Promise<boolean> {
  const data = await get(phone);
  return data !== null && !data.used;
}

/**
 * 清理过期的验证码
 */
function cleanupExpired(): void {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const [key, entry] of store.entries()) {
    if (now > entry.expireAt) {
      store.delete(key);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    logger.debug(`[VerificationCodeStore] 清理了 ${deletedCount} 条过期验证码`);
  }
}

/**
 * 启动清理定时器
 */
export function startCleanup(): void {
  if (cleanupTimer) {
    return;
  }
  
  cleanupTimer = setInterval(cleanupExpired, CLEANUP_INTERVAL);
  logger.info('[VerificationCodeStore] 清理定时器已启动');
}

/**
 * 停止清理定时器
 */
export function stopCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    logger.info('[VerificationCodeStore] 清理定时器已停止');
  }
}

/**
 * 获取存储统计信息
 */
export function getStats(): { size: number } {
  return {
    size: store.size,
  };
}

/**
 * 清空所有存储（仅用于测试）
 */
export function clearAll(): void {
  store.clear();
}

// 默认导出
export default {
  set,
  get,
  markAsUsed,
  remove,
  exists,
  startCleanup,
  stopCleanup,
  getStats,
  clearAll,
};
