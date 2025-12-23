/**
 * 安全工具模块
 * 提供XSS过滤、密码加密、Token管理、敏感信息脱敏等安全功能
 */

import xss from 'xss';
import DOMPurify from 'dompurify';
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

/**
 * XSS过滤 - 过滤用户输入
 * @param input 用户输入字符串
 * @returns 过滤后的安全字符串
 */
export function sanitizeInput(input: string): string {
  return xss(input, {
    whiteList: {
      p: [],
      br: [],
      strong: [],
      em: []
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
  });
}

/**
 * HTML净化 - 净化HTML内容
 * @param html HTML字符串
 * @returns 净化后的安全HTML
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false
  });
}

/**
 * 密码加密 - 使用SHA256单向加密
 * @param password 明文密码
 * @returns 加密后的密码
 */
export function encryptPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

/**
 * 获取Token
 * @returns Token字符串或undefined
 */
export function getToken(): string | undefined {
  return Cookies.get('auth_token');
}

/**
 * 设置Token
 * @param token Token字符串
 * @param rememberMe 是否记住我（7天有效期）
 */
export function setToken(token: string, rememberMe: boolean = false): void {
  const expires = rememberMe ? 7 : 1; // 7天 or 1天
  Cookies.set('auth_token', token, {
    expires,
    secure: import.meta.env.PROD, // 生产环境强制HTTPS
    sameSite: 'strict',
    path: '/' // 确保所有路径都可以访问
  });
}

/**
 * 移除Token
 */
export function removeToken(): void {
  Cookies.remove('auth_token', { path: '/' });
}

/**
 * 检查Token是否存在
 * @returns 是否存在Token
 */
export function hasToken(): boolean {
  const token = getToken();
  return !!token && token.length > 0;
}

/**
 * 获取Token过期时间（从Cookie中读取）
 * @returns 过期时间戳或null
 */
export function getTokenExpireTime(): number | null {
  const expireTime = Cookies.get('token_expire_time');
  return expireTime ? parseInt(expireTime, 10) : null;
}

/**
 * 设置Token过期时间
 * @param expireTime 过期时间戳
 */
export function setTokenExpireTime(expireTime: number): void {
  const expires = new Date(expireTime);
  Cookies.set('token_expire_time', expireTime.toString(), {
    expires,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    path: '/'
  });
}

/**
 * 移除Token过期时间
 */
export function removeTokenExpireTime(): void {
  Cookies.remove('token_expire_time', { path: '/' });
}

/**
 * 检查Token是否已过期（改进版）
 * 如果过期时间不存在，返回false（容错处理）
 * @returns 是否已过期
 */
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) {
    return true; // 没有token，视为过期
  }
  
  const expireTime = getTokenExpireTime();
  if (!expireTime) {
    return false; // 有token但没有过期时间，容错处理，视为未过期
  }

  return Date.now() >= expireTime;
}

/**
 * 检查Token是否即将过期（改进版）
 * 如果过期时间不存在，返回false
 * @returns 是否即将过期
 */
export function isTokenExpiringSoon(): boolean {
  const token = getToken();
  if (!token) {
    return false;
  }
  
  const expireTime = getTokenExpireTime();
  if (!expireTime) {
    return false; // 没有过期时间，不触发刷新
  }

  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5分钟

  return expireTime - now < fiveMinutes && expireTime > now;
}

/**
 * 验证Token状态一致性
 * 检查token和过期时间是否都存在或都不存在
 * @returns Token状态验证结果
 */
export function validateTokenState(): { valid: boolean; hasToken: boolean; hasExpireTime: boolean } {
  const token = getToken();
  const expireTime = getTokenExpireTime();
  
  return {
    valid: (!!token && !!expireTime) || (!token && !expireTime),
    hasToken: !!token,
    hasExpireTime: !!expireTime
  };
}

/**
 * 获取CSRF Token
 * @returns CSRF Token字符串或undefined
 */
export function getCSRFToken(): string | undefined {
  return Cookies.get('csrf_token');
}

/**
 * 设置CSRF Token
 * @param token CSRF Token字符串
 */
export function setCSRFToken(token: string): void {
  Cookies.set('csrf_token', token, {
    secure: true,
    sameSite: 'strict',
    expires: 1 // 1天有效期
  });
}

/**
 * 移除CSRF Token
 */
export function removeCSRFToken(): void {
  Cookies.remove('csrf_token');
}

/**
 * 验证CSRF Token是否存在
 * @returns 是否存在有效的CSRF Token
 */
export function hasValidCSRFToken(): boolean {
  const token = getCSRFToken();
  return !!token && token.length > 0;
}

/**
 * 验证请求来源（Referer和Origin）
 * @param allowedOrigins 允许的源列表
 * @returns 是否为合法来源
 */
export function validateRequestOrigin(allowedOrigins: string[]): boolean {
  // 获取当前页面的origin
  const currentOrigin = window.location.origin;

  // 检查当前origin是否在允许列表中
  return allowedOrigins.includes(currentOrigin);
}

/**
 * 获取允许的源列表（从环境变量读取）
 * @returns 允许的源列表
 */
export function getAllowedOrigins(): string[] {
  const envOrigins = import.meta.env.VITE_ALLOWED_ORIGINS;

  if (envOrigins) {
    return envOrigins.split(',').map((origin: string) => origin.trim());
  }

  // 默认允许当前域名
  return [window.location.origin];
}

/**
 * 初始化CSRF保护
 * 在应用启动时调用，验证CSRF Token是否存在
 * @returns 是否初始化成功
 */
export function initCSRFProtection(): boolean {
  const csrfToken = getCSRFToken();

  if (!csrfToken) {
    console.warn('CSRF Token未找到，某些功能可能受限');
    return false;
  }

  console.log('CSRF保护已初始化');
  return true;
}

/**
 * 手机号脱敏
 * @param phone 手机号
 * @returns 脱敏后的手机号（如：138****1234）
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) {
    return phone;
  }
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 邮箱脱敏
 * @param email 邮箱地址
 * @returns 脱敏后的邮箱（如：abc***@example.com）
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }
  const [username, domain] = email.split('@');
  if (username.length <= 3) {
    return `${username.charAt(0)}***@${domain}`;
  }
  return `${username.substring(0, 3)}***@${domain}`;
}

/**
 * 身份证号脱敏
 * @param idCard 身份证号
 * @returns 脱敏后的身份证号（如：1234**********5678）
 */
export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 8) {
    return idCard;
  }
  return idCard.replace(/^(.{4}).*(.{4})$/, '$1**********$2');
}

/**
 * URL参数编码
 * @param url URL字符串
 * @returns 编码后的URL
 */
export function encodeURL(url: string): string {
  return encodeURIComponent(url);
}

/**
 * 文件名安全处理（增强版）
 * 移除危险字符、路径分隔符、限制长度
 * @param fileName 原始文件名
 * @returns 安全的文件名
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || fileName.trim() === '') {
    return 'unnamed_file';
  }

  // 1. 移除路径分隔符（防止路径遍历攻击）
  let safeName = fileName.replace(/[/\\]/g, '');

  // 2. 移除危险特殊字符
  // eslint-disable-next-line no-control-regex
  safeName = safeName.replace(/[<>:"|?*\x00-\x1f]/g, '');

  // 3. 移除多个连续的点（防止..攻击）
  safeName = safeName.replace(/\.{2,}/g, '.');

  // 4. 移除开头的点（防止隐藏文件）
  safeName = safeName.replace(/^\.+/, '');

  // 5. 移除空格和特殊空白字符
  safeName = safeName.replace(/\s+/g, '_');

  // 6. 限制长度（保留扩展名）
  if (safeName.length > 255) {
    const parts = safeName.split('.');
    const ext = parts.length > 1 ? parts.pop() : '';
    const baseName = parts.join('.');

    // 确保扩展名不超过10个字符
    const safeExt = ext ? ext.substring(0, 10) : '';
    const maxBaseLength = 255 - safeExt.length - (safeExt ? 1 : 0); // -1 for the dot if ext exists

    safeName = baseName.substring(0, maxBaseLength) + (safeExt ? '.' + safeExt : '');
  }

  // 7. 如果处理后为空，使用默认名称
  if (!safeName || safeName === '.') {
    safeName = 'unnamed_file';
  }

  return safeName;
}

/**
 * 生成安全的随机文件名
 * 用于服务器端存储，防止文件名冲突和安全问题
 * @param originalFileName 原始文件名（用于提取扩展名）
 * @returns 随机文件名（格式：timestamp_random.ext）
 */
export function generateSecureFileName(originalFileName: string): string {
  // 提取扩展名
  const ext = originalFileName.split('.').pop()?.toLowerCase() || '';

  // 生成时间戳
  const timestamp = Date.now();

  // 生成随机字符串（8位）
  const randomStr = Math.random().toString(36).substring(2, 10);

  // 组合文件名
  return `${timestamp}_${randomStr}${ext ? '.' + ext : ''}`;
}

/**
 * 验证文件路径安全性
 * 防止路径遍历攻击
 * @param filePath 文件路径
 * @param allowedBasePath 允许的基础路径
 * @returns 是否安全
 */
export function validateFilePath(filePath: string, allowedBasePath: string): boolean {
  // 规范化路径
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedBase = allowedBasePath.replace(/\\/g, '/');

  // 检查是否包含路径遍历
  if (normalizedPath.includes('..')) {
    return false;
  }

  // 检查是否在允许的基础路径内
  if (!normalizedPath.startsWith(normalizedBase)) {
    return false;
  }

  return true;
}
