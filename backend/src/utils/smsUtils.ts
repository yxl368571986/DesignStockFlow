/**
 * 短信验证码相关工具函数
 */

import crypto from 'crypto';

/**
 * 生成6位数字验证码
 * @returns 6位数字字符串
 */
export function generateVerificationCode(): string {
  // 使用crypto生成更安全的随机数
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  // 取模确保在100000-999999范围内
  const code = 100000 + (randomNumber % 900000);
  return code.toString();
}

/**
 * 验证手机号格式
 * 规则：11位数字，以13/14/15/17/18/19开头
 * @param phone 手机号
 * @returns 是否有效
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // 11位数字，以1开头，第二位是3-9
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证验证码格式
 * 规则：6位纯数字
 * @param code 验证码
 * @returns 是否有效
 */
export function validateVerifyCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // 6位纯数字
  const codeRegex = /^\d{6}$/;
  return codeRegex.test(code);
}

/**
 * 常量时间比较（防止时序攻击）
 * @param a 字符串a
 * @param b 字符串b
 * @returns 是否相等
 */
export function safeCompare(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }
  
  // 使用crypto.timingSafeEqual进行常量时间比较
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  
  // 如果长度不同，仍然进行比较以保持常量时间
  if (bufferA.length !== bufferB.length) {
    // 创建一个与bufferA相同长度的buffer进行比较
    const paddedB = Buffer.alloc(bufferA.length);
    bufferB.copy(paddedB, 0, 0, Math.min(bufferB.length, bufferA.length));
    
    try {
      crypto.timingSafeEqual(bufferA, paddedB);
    } catch {
      // 忽略错误
    }
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

/**
 * 脱敏手机号
 * @param phone 手机号
 * @returns 脱敏后的手机号（如：138****8888）
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) {
    return phone;
  }
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

/**
 * 验证码过期时间（毫秒）
 */
export const CODE_EXPIRE_TIME = 5 * 60 * 1000; // 5分钟

/**
 * 检查验证码是否过期
 * @param createTime 创建时间戳（毫秒）
 * @returns 是否过期
 */
export function isCodeExpired(createTime: number): boolean {
  return Date.now() - createTime > CODE_EXPIRE_TIME;
}

// 默认导出
export default {
  generateVerificationCode,
  validatePhone,
  validateVerifyCode,
  safeCompare,
  maskPhone,
  isCodeExpired,
  CODE_EXPIRE_TIME,
};
