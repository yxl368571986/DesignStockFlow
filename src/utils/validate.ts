/**
 * 验证工具模块
 * 提供手机号、邮箱、密码、文件等验证功能
 */

import { SUPPORTED_FORMATS, MIME_TYPES, MAX_FILE_SIZE } from './constants';

/**
 * 手机号验证
 * @param phone 手机号
 * @returns 是否有效
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 邮箱验证
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * 密码强度验证
 * @param password 密码
 * @returns 验证结果 { valid: boolean, strength?: 'weak' | 'medium' | 'strong', message?: string }
 */
export function validatePassword(password: string): {
  valid: boolean;
  strength?: 'weak' | 'medium' | 'strong';
  message?: string;
} {
  if (password.length < 6) {
    return { valid: false, message: '密码至少6位' };
  }

  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const strengthCount = [hasNumber, hasLetter, hasSpecial].filter(Boolean).length;

  if (strengthCount >= 3) {
    return { valid: true, strength: 'strong' };
  } else if (strengthCount >= 2) {
    return { valid: true, strength: 'medium' };
  } else {
    return { valid: true, strength: 'weak' };
  }
}

/**
 * 文件扩展名验证
 * @param fileName 文件名
 * @returns 是否为支持的格式
 */
export function validateFileExtension(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toUpperCase();
  if (!ext) {
    return false;
  }
  return SUPPORTED_FORMATS.includes(ext as any);
}

/**
 * 文件大小验证
 * @param fileSize 文件大小（字节）
 * @returns 是否在限制范围内
 */
export function validateFileSize(fileSize: number): boolean {
  return fileSize > 0 && fileSize <= MAX_FILE_SIZE;
}

/**
 * 文件完整验证（扩展名 + MIME类型 + 大小）
 * 双重验证机制：前端验证 + 后端验证
 * @param file File对象
 * @returns 验证结果 { valid: boolean, message?: string, details?: object }
 */
export function validateFile(file: File): {
  valid: boolean;
  message?: string;
  details?: {
    extension: string;
    mimeType: string;
    size: number;
    sizeFormatted: string;
  };
} {
  // 1. 验证文件名是否存在
  if (!file.name || file.name.trim() === '') {
    return {
      valid: false,
      message: '文件名不能为空'
    };
  }

  // 2. 验证扩展名（白名单机制）
  const parts = file.name.split('.');
  // 如果文件名没有点，或者点在最后，则没有扩展名
  if (parts.length < 2 || parts[parts.length - 1] === '') {
    return {
      valid: false,
      message: '文件必须包含扩展名'
    };
  }
  const ext = parts.pop()?.toUpperCase();

  if (!SUPPORTED_FORMATS.includes(ext as any)) {
    return {
      valid: false,
      message: `不支持的文件格式"${ext}"，仅支持：${SUPPORTED_FORMATS.join('/')}`
    };
  }

  // 3. 验证MIME类型（双重验证）
  const allowedMimeTypes: string[] = ext ? (MIME_TYPES[ext] || []) : [];

  // 如果浏览器提供了MIME类型，必须验证
  if (file.type) {
    const isValidMime = allowedMimeTypes.some((mimeType: string) =>
      file.type.toLowerCase().includes(mimeType.toLowerCase())
    );

    if (!isValidMime) {
      return {
        valid: false,
        message: `文件类型不匹配：扩展名为"${ext}"但MIME类型为"${file.type}"，可能是伪造文件`
      };
    }
  } else {
    // 如果浏览器未提供MIME类型，发出警告但允许通过（某些浏览器可能不提供）
    console.warn(`文件"${file.name}"未提供MIME类型，仅通过扩展名验证`);
  }

  // 4. 验证文件大小（防止DoS攻击）
  if (file.size <= 0) {
    return {
      valid: false,
      message: '文件大小无效，文件可能已损坏'
    };
  }

  if (!validateFileSize(file.size)) {
    const maxSizeMB = MAX_FILE_SIZE / 1024 / 1024;
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      message: `文件大小超出限制：${fileSizeMB}MB > ${maxSizeMB}MB`
    };
  }

  // 5. 验证通过，返回详细信息
  return {
    valid: true,
    details: {
      extension: ext || '',
      mimeType: file.type || 'unknown',
      size: file.size,
      sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    }
  };
}

/**
 * 验证文件名安全性
 * 检查文件名是否包含危险字符或路径遍历攻击
 * @param fileName 文件名
 * @returns 验证结果 { valid: boolean, message?: string }
 */
export function validateFileNameSecurity(fileName: string): {
  valid: boolean;
  message?: string;
} {
  // 检查路径遍历攻击
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      message: '文件名包含非法路径字符'
    };
  }

  // 检查危险字符
  // eslint-disable-next-line no-control-regex
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(fileName)) {
    return {
      valid: false,
      message: '文件名包含非法特殊字符'
    };
  }

  // 检查文件名长度
  if (fileName.length > 255) {
    return {
      valid: false,
      message: '文件名过长（最多255个字符）'
    };
  }

  // 检查是否为隐藏文件（以.开头）
  if (fileName.startsWith('.')) {
    return {
      valid: false,
      message: '不支持上传隐藏文件'
    };
  }

  return { valid: true };
}

/**
 * URL验证
 * @param url URL字符串
 * @returns 是否为有效URL
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 身份证号验证（简单验证）
 * @param idCard 身份证号
 * @returns 是否有效
 */
export function validateIdCard(idCard: string): boolean {
  // 18位身份证号正则
  const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  return idCardRegex.test(idCard);
}

/**
 * 验证码验证（6位数字）
 * @param code 验证码
 * @returns 是否有效
 */
export function validateVerifyCode(code: string): boolean {
  const codeRegex = /^\d{6}$/;
  return codeRegex.test(code);
}
