/**
 * 短信验证相关错误码定义
 */

/**
 * SMS错误码枚举
 */
export enum SmsErrorCode {
  /** 手机号格式错误 */
  INVALID_PHONE = 'SMS_001',
  /** 手机号60秒内重复请求 */
  PHONE_RATE_LIMIT_60S = 'SMS_002',
  /** 手机号每日请求次数超限 */
  PHONE_RATE_LIMIT_DAILY = 'SMS_003',
  /** 短信发送失败 */
  SEND_FAILED = 'SMS_004',
  /** 验证码错误 */
  CODE_INVALID = 'SMS_005',
  /** 验证码已过期 */
  CODE_EXPIRED = 'SMS_006',
  /** 验证码不存在或已使用 */
  CODE_NOT_FOUND = 'SMS_007',
  /** IP请求频率超限 */
  IP_RATE_LIMIT = 'SMS_008',
  /** 系统异常 */
  SYSTEM_ERROR = 'SMS_009',
}

/**
 * 错误码到HTTP状态码的映射
 */
export const errorCodeToHttpStatus: Record<string, number> = {
  [SmsErrorCode.INVALID_PHONE]: 400,
  [SmsErrorCode.PHONE_RATE_LIMIT_60S]: 429,
  [SmsErrorCode.PHONE_RATE_LIMIT_DAILY]: 429,
  [SmsErrorCode.SEND_FAILED]: 500,
  [SmsErrorCode.CODE_INVALID]: 400,
  [SmsErrorCode.CODE_EXPIRED]: 400,
  [SmsErrorCode.CODE_NOT_FOUND]: 400,
  [SmsErrorCode.IP_RATE_LIMIT]: 429,
  [SmsErrorCode.SYSTEM_ERROR]: 500,
};

/**
 * 错误码到用户提示消息的映射
 */
export const errorCodeToMessage: Record<string, string> = {
  [SmsErrorCode.INVALID_PHONE]: '请输入正确的11位手机号',
  [SmsErrorCode.PHONE_RATE_LIMIT_60S]: '获取验证码过于频繁，请稍后再试',
  [SmsErrorCode.PHONE_RATE_LIMIT_DAILY]: '今日获取验证码次数已达上限',
  [SmsErrorCode.SEND_FAILED]: '验证码发送失败，请稍后重试',
  [SmsErrorCode.CODE_INVALID]: '验证码错误，请核对后重新输入',
  [SmsErrorCode.CODE_EXPIRED]: '验证码已过期，请重新获取',
  [SmsErrorCode.CODE_NOT_FOUND]: '验证码无效或已过期',
  [SmsErrorCode.IP_RATE_LIMIT]: '操作过于频繁，请稍后再试',
  [SmsErrorCode.SYSTEM_ERROR]: '系统异常，请稍后重试',
};

/**
 * 获取HTTP状态码
 */
export function getHttpStatus(errorCode: string): number {
  return errorCodeToHttpStatus[errorCode] || 400;
}

/**
 * 获取用户提示消息
 */
export function getMessage(errorCode: string): string {
  return errorCodeToMessage[errorCode] || '操作失败，请稍后重试';
}

/**
 * 创建带错误码的Error对象
 */
export function createSmsError(errorCode: SmsErrorCode, customMessage?: string): Error & { code: string } {
  const message = customMessage || getMessage(errorCode);
  const error = new Error(message) as Error & { code: string };
  error.code = errorCode;
  return error;
}
