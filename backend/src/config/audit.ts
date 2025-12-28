/**
 * 审核配置模块
 * 定义审核相关的配置项，包括审核模式、文件格式、临时文件过期时间等
 */

/**
 * 审核配置接口
 */
export interface AuditConfig {
  /** 审核模式: production | development */
  mode: 'production' | 'development';
  /** 临时文件过期时间（小时） */
  tempFileExpireHours: number;
  /** 允许的设计文件格式（大写） */
  allowedDesignFormats: string[];
  /** 允许的压缩包格式（大写） */
  allowedArchiveFormats: string[];
  /** 非法可执行文件扩展名（大写） */
  illegalExecutableExtensions: string[];
  /** 缩略图尺寸 */
  thumbnailSize: { width: number; height: number };
  /** 临时文件目录 */
  tempDir: string;
  /** 分片上传配置 */
  chunkUpload: {
    /** 分片大小（字节），默认 5MB */
    chunkSize: number;
    /** 分片上传会话过期时间（小时） */
    sessionExpireHours: number;
  };
}

/**
 * 预设驳回原因
 */
export interface RejectReason {
  code: string;
  label: string;
}

/**
 * 预设驳回原因列表
 */
export const PRESET_REJECT_REASONS: RejectReason[] = [
  { code: 'NO_VALID_FILE', label: '无有效设计文件' },
  { code: 'FILE_CORRUPTED', label: '文件损坏' },
  { code: 'ILLEGAL_CONTENT', label: '含违规内容' },
  { code: 'PASSWORD_PROTECTED', label: '压缩包密码保护' },
];

/**
 * 默认审核配置
 */
export const defaultAuditConfig: AuditConfig = {
  mode: (process.env.AUDIT_MODE as 'production' | 'development') || 'production',
  tempFileExpireHours: 24,
  allowedDesignFormats: ['PSD', 'AI', 'CDR', 'JPG', 'JPEG', 'PNG'],
  allowedArchiveFormats: ['ZIP', 'RAR', '7Z', 'TAR', 'GZ', 'GZIP'],
  illegalExecutableExtensions: ['EXE', 'BAT', 'SH', 'CMD', 'COM', 'MSI', 'DLL', 'SCR', 'VBS', 'JS'],
  thumbnailSize: { width: 200, height: 200 },
  tempDir: './uploads/temp',
  chunkUpload: {
    chunkSize: 5 * 1024 * 1024, // 5MB
    sessionExpireHours: 24,
  },
};

/**
 * 获取审核配置
 * @returns 审核配置对象
 */
export function getAuditConfig(): AuditConfig {
  return {
    ...defaultAuditConfig,
    mode: (process.env.AUDIT_MODE as 'production' | 'development') || defaultAuditConfig.mode,
  };
}

/**
 * 检查文件格式是否为设计文件（大小写不敏感）
 * @param format 文件格式/扩展名
 * @returns 是否为设计文件
 */
export function isDesignFormat(format: string): boolean {
  const upperFormat = format.toUpperCase().replace(/^\./, '');
  return defaultAuditConfig.allowedDesignFormats.includes(upperFormat);
}

/**
 * 检查文件格式是否为压缩包（大小写不敏感）
 * @param format 文件格式/扩展名
 * @returns 是否为压缩包
 */
export function isArchiveFormat(format: string): boolean {
  const upperFormat = format.toUpperCase().replace(/^\./, '');
  return defaultAuditConfig.allowedArchiveFormats.includes(upperFormat);
}

/**
 * 检查文件格式是否为非法可执行文件（大小写不敏感）
 * @param format 文件格式/扩展名
 * @returns 是否为非法可执行文件
 */
export function isIllegalExecutable(format: string): boolean {
  const upperFormat = format.toUpperCase().replace(/^\./, '');
  return defaultAuditConfig.illegalExecutableExtensions.includes(upperFormat);
}

/**
 * 检查文件格式是否被允许上传（大小写不敏感）
 * @param format 文件格式/扩展名
 * @returns 是否允许上传
 */
export function isAllowedFormat(format: string): boolean {
  return isDesignFormat(format) || isArchiveFormat(format);
}

/**
 * 获取文件类型
 * @param format 文件格式/扩展名
 * @returns 文件类型: 'design' | 'archive' | 'unknown'
 */
export function getFileType(format: string): 'design' | 'archive' | 'unknown' {
  if (isDesignFormat(format)) return 'design';
  if (isArchiveFormat(format)) return 'archive';
  return 'unknown';
}

/**
 * 审核状态枚举
 */
export enum AuditStatus {
  /** 待审核 */
  PENDING = 0,
  /** 审核通过 */
  APPROVED = 1,
  /** 审核驳回 */
  REJECTED = 2,
}

/**
 * 审核操作类型
 */
export enum AuditOperatorType {
  /** 系统自动审核 */
  SYSTEM = 'system',
  /** 人工审核 */
  MANUAL = 'manual',
}

/**
 * 上传错误码
 */
export const UploadErrorCodes = {
  UPLOAD_001: { code: 'UPLOAD_001', message: '文件格式不支持', httpStatus: 400 },
  UPLOAD_002: { code: 'UPLOAD_002', message: '文件大小超限', httpStatus: 400 },
  UPLOAD_003: { code: 'UPLOAD_003', message: '文件名包含非法字符', httpStatus: 400 },
  UPLOAD_004: { code: 'UPLOAD_004', message: '文件已存在', httpStatus: 409 },
  UPLOAD_005: { code: 'UPLOAD_005', message: '分片上传会话不存在', httpStatus: 404 },
  UPLOAD_006: { code: 'UPLOAD_006', message: '分片索引无效', httpStatus: 400 },
} as const;

/**
 * 审核错误码
 */
export const AuditErrorCodes = {
  AUDIT_001: { code: 'AUDIT_001', message: '资源不存在', httpStatus: 404 },
  AUDIT_002: { code: 'AUDIT_002', message: '资源已审核', httpStatus: 400 },
  AUDIT_003: { code: 'AUDIT_003', message: '无审核权限', httpStatus: 403 },
  AUDIT_004: { code: 'AUDIT_004', message: '驳回原因不能为空', httpStatus: 400 },
  AUDIT_005: { code: 'AUDIT_005', message: '压缩包解压失败/密码保护', httpStatus: 400 },
} as const;

export default {
  getAuditConfig,
  isDesignFormat,
  isArchiveFormat,
  isIllegalExecutable,
  isAllowedFormat,
  getFileType,
  AuditStatus,
  AuditOperatorType,
  UploadErrorCodes,
  AuditErrorCodes,
  PRESET_REJECT_REASONS,
};
