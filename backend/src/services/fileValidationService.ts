/**
 * 文件验证服务
 * 负责文件格式验证、MD5哈希计算、重复文件检测等功能
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import {
  isAllowedFormat,
  isDesignFormat,
  isArchiveFormat,
  getFileType,
  UploadErrorCodes,
  getAuditConfig,
} from '../config/audit.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

/**
 * 文件验证结果接口
 */
export interface FileValidationResult {
  valid: boolean;
  message?: string;
  errorCode?: string;
  fileHash?: string;
  fileType?: 'design' | 'archive' | 'unknown';
}

/**
 * 重复文件检测结果接口
 */
export interface DuplicateCheckResult {
  exists: boolean;
  resourceId?: string;
  auditStatus?: number;
  canOverwrite?: boolean;
}

/**
 * 文件名安全性验证
 * 检查文件名是否包含非法字符或路径遍历攻击
 * @param fileName 文件名
 * @returns 验证结果
 */
export function validateFileNameSecurity(fileName: string): FileValidationResult {
  // 检查空文件名
  if (!fileName || fileName.trim() === '') {
    return {
      valid: false,
      message: '文件名不能为空',
      errorCode: UploadErrorCodes.UPLOAD_003.code,
    };
  }

  // 检查路径遍历攻击
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      message: '文件名包含非法字符',
      errorCode: UploadErrorCodes.UPLOAD_003.code,
    };
  }

  // 检查非法字符（Windows 和 Unix 系统保留字符）
  const illegalChars = /[<>:"|?*\x00-\x1f]/;
  if (illegalChars.test(fileName)) {
    return {
      valid: false,
      message: '文件名包含非法字符',
      errorCode: UploadErrorCodes.UPLOAD_003.code,
    };
  }

  // 检查文件名长度
  if (fileName.length > 255) {
    return {
      valid: false,
      message: '文件名过长（最大255个字符）',
      errorCode: UploadErrorCodes.UPLOAD_003.code,
    };
  }

  return { valid: true };
}

/**
 * 验证文件格式
 * @param fileName 文件名
 * @returns 验证结果
 */
export function validateFileFormat(fileName: string): FileValidationResult {
  const ext = path.extname(fileName).toLowerCase().replace('.', '');
  
  if (!ext) {
    return {
      valid: false,
      message: '无法识别文件格式',
      errorCode: UploadErrorCodes.UPLOAD_001.code,
    };
  }

  if (!isAllowedFormat(ext)) {
    return {
      valid: false,
      message: `不支持的文件格式: ${ext}`,
      errorCode: UploadErrorCodes.UPLOAD_001.code,
    };
  }

  return {
    valid: true,
    fileType: getFileType(ext),
  };
}

/**
 * 验证文件大小
 * @param fileSize 文件大小（字节）
 * @returns 验证结果
 */
export function validateFileSize(fileSize: number): FileValidationResult {
  const maxSize = config.upload.maxFileSize;
  
  if (fileSize <= 0) {
    return {
      valid: false,
      message: '文件大小无效',
      errorCode: UploadErrorCodes.UPLOAD_002.code,
    };
  }

  if (fileSize > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      message: `文件大小超过限制（最大 ${maxSizeMB}MB）`,
      errorCode: UploadErrorCodes.UPLOAD_002.code,
    };
  }

  return { valid: true };
}


/**
 * 综合验证文件（文件名安全性、格式、大小）
 * @param file Express.Multer.File 对象
 * @returns 验证结果
 */
export function validateFile(file: {
  originalname: string;
  size: number;
  mimetype?: string;
}): FileValidationResult {
  // 1. 验证文件名安全性
  const nameResult = validateFileNameSecurity(file.originalname);
  if (!nameResult.valid) {
    return nameResult;
  }

  // 2. 验证文件格式
  const formatResult = validateFileFormat(file.originalname);
  if (!formatResult.valid) {
    return formatResult;
  }

  // 3. 验证文件大小
  const sizeResult = validateFileSize(file.size);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  return {
    valid: true,
    fileType: formatResult.fileType,
  };
}

/**
 * 计算文件 MD5 哈希值
 * @param filePath 文件路径
 * @returns MD5 哈希值
 */
export async function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * 从 Buffer 计算 MD5 哈希值
 * @param buffer 文件内容 Buffer
 * @returns MD5 哈希值
 */
export function calculateBufferHash(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * 检查文件是否已存在（重复检测）
 * @param fileHash 文件 MD5 哈希值
 * @returns 重复检测结果
 */
export async function checkDuplicateFile(fileHash: string): Promise<DuplicateCheckResult> {
  try {
    const existingResource = await prisma.resources.findFirst({
      where: {
        file_hash: fileHash,
      },
      select: {
        resource_id: true,
        audit_status: true,
      },
    });

    if (!existingResource) {
      return { exists: false };
    }

    // 如果文件已存在且审核通过，不允许重复上传
    if (existingResource.audit_status === 1) {
      return {
        exists: true,
        resourceId: existingResource.resource_id,
        auditStatus: existingResource.audit_status,
        canOverwrite: false,
      };
    }

    // 如果文件存在但审核状态为待审核(0)或已驳回(2)，允许覆盖
    return {
      exists: true,
      resourceId: existingResource.resource_id,
      auditStatus: existingResource.audit_status,
      canOverwrite: true,
    };
  } catch (error) {
    console.error('检查重复文件失败:', error);
    return { exists: false };
  }
}

/**
 * 验证文件并检查重复
 * @param file Express.Multer.File 对象
 * @param filePath 文件路径（用于计算哈希）
 * @returns 验证结果
 */
export async function validateFileWithDuplicateCheck(
  file: { originalname: string; size: number; mimetype?: string },
  filePath?: string
): Promise<FileValidationResult & { duplicateInfo?: DuplicateCheckResult }> {
  // 1. 基础验证
  const validationResult = validateFile(file);
  if (!validationResult.valid) {
    return validationResult;
  }

  // 2. 如果提供了文件路径，计算哈希并检查重复
  if (filePath && fs.existsSync(filePath)) {
    try {
      const fileHash = await calculateFileHash(filePath);
      const duplicateInfo = await checkDuplicateFile(fileHash);

      if (duplicateInfo.exists && !duplicateInfo.canOverwrite) {
        return {
          valid: false,
          message: '文件已存在，无需重复上传',
          errorCode: UploadErrorCodes.UPLOAD_004.code,
          fileHash,
          fileType: validationResult.fileType,
          duplicateInfo,
        };
      }

      return {
        ...validationResult,
        fileHash,
        duplicateInfo,
      };
    } catch (error) {
      console.error('计算文件哈希失败:', error);
      // 哈希计算失败不影响上传，继续处理
      return validationResult;
    }
  }

  return validationResult;
}

export default {
  validateFileNameSecurity,
  validateFileFormat,
  validateFileSize,
  validateFile,
  calculateFileHash,
  calculateBufferHash,
  checkDuplicateFile,
  validateFileWithDuplicateCheck,
};


// ==================== 设计文件有效性验证 ====================

/**
 * 文件魔数（Magic Number）定义
 * 用于验证文件头格式是否合法
 */
const FILE_SIGNATURES: Record<string, { signature: Buffer; offset?: number }[]> = {
  // PSD 文件签名: "8BPS"
  PSD: [{ signature: Buffer.from([0x38, 0x42, 0x50, 0x53]) }],
  
  // AI 文件签名: "%PDF" (AI 文件通常是 PDF 格式) 或 "%!PS" (PostScript)
  AI: [
    { signature: Buffer.from([0x25, 0x50, 0x44, 0x46]) }, // %PDF
    { signature: Buffer.from([0x25, 0x21, 0x50, 0x53]) }, // %!PS
  ],
  
  // CDR 文件签名: "RIFF" + "CDR"
  CDR: [{ signature: Buffer.from([0x52, 0x49, 0x46, 0x46]) }], // RIFF
  
  // JPG/JPEG 文件签名: FFD8FF
  JPG: [{ signature: Buffer.from([0xFF, 0xD8, 0xFF]) }],
  JPEG: [{ signature: Buffer.from([0xFF, 0xD8, 0xFF]) }],
  
  // PNG 文件签名: 89 50 4E 47 0D 0A 1A 0A
  PNG: [{ signature: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) }],
};

/**
 * 验证文件头签名
 * @param filePath 文件路径
 * @param format 文件格式
 * @returns 是否有效
 */
async function validateFileSignature(filePath: string, format: string): Promise<boolean> {
  const upperFormat = format.toUpperCase().replace('.', '');
  const signatures = FILE_SIGNATURES[upperFormat];
  
  if (!signatures) {
    // 没有定义签名的格式，默认通过
    return true;
  }

  try {
    const fd = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(16); // 读取前16字节
    await fd.read(buffer, 0, 16, 0);
    await fd.close();

    // 检查是否匹配任一签名
    for (const sig of signatures) {
      const offset = sig.offset || 0;
      const sigBuffer = sig.signature;
      
      if (buffer.slice(offset, offset + sigBuffer.length).equals(sigBuffer)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('验证文件签名失败:', error);
    return false;
  }
}

/**
 * 验证图片文件是否包含有效像素信息
 * @param filePath 文件路径
 * @param format 文件格式
 * @returns 是否有效
 */
async function validateImagePixels(filePath: string, format: string): Promise<boolean> {
  const upperFormat = format.toUpperCase().replace('.', '');
  
  try {
    const stats = await fs.promises.stat(filePath);
    
    // 检查文件大小是否合理（至少100字节）
    if (stats.size < 100) {
      return false;
    }

    // 对于 JPG/JPEG，检查文件结尾是否为 FFD9
    if (upperFormat === 'JPG' || upperFormat === 'JPEG') {
      const fd = await fs.promises.open(filePath, 'r');
      const buffer = Buffer.alloc(2);
      await fd.read(buffer, 0, 2, stats.size - 2);
      await fd.close();
      
      // JPG 文件应该以 FFD9 结尾
      if (buffer[0] !== 0xFF || buffer[1] !== 0xD9) {
        // 有些 JPG 文件可能不严格以 FFD9 结尾，但仍然有效
        // 这里只做警告，不直接拒绝
        console.warn('JPG 文件可能不完整（未以 FFD9 结尾）');
      }
      return true;
    }

    // 对于 PNG，检查 IHDR 块是否存在
    if (upperFormat === 'PNG') {
      const fd = await fs.promises.open(filePath, 'r');
      const buffer = Buffer.alloc(24);
      await fd.read(buffer, 0, 24, 0);
      await fd.close();
      
      // PNG 文件的 IHDR 块应该在第 12-15 字节位置
      const ihdrSignature = Buffer.from([0x49, 0x48, 0x44, 0x52]); // "IHDR"
      if (!buffer.slice(12, 16).equals(ihdrSignature)) {
        return false;
      }
      
      // 检查图片尺寸是否有效（宽度和高度都应该大于0）
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      
      if (width === 0 || height === 0) {
        return false;
      }
      
      return true;
    }

    // 其他格式默认通过
    return true;
  } catch (error) {
    console.error('验证图片像素信息失败:', error);
    return false;
  }
}

/**
 * 验证 PSD 文件有效性
 * @param filePath 文件路径
 * @returns 是否有效
 */
async function validatePSDFile(filePath: string): Promise<boolean> {
  try {
    const fd = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(26);
    await fd.read(buffer, 0, 26, 0);
    await fd.close();

    // 检查 PSD 签名 "8BPS"
    if (!buffer.slice(0, 4).equals(Buffer.from([0x38, 0x42, 0x50, 0x53]))) {
      return false;
    }

    // 检查版本号（1 = PSD, 2 = PSB）
    const version = buffer.readUInt16BE(4);
    if (version !== 1 && version !== 2) {
      return false;
    }

    // 检查通道数（1-56）
    const channels = buffer.readUInt16BE(12);
    if (channels < 1 || channels > 56) {
      return false;
    }

    // 检查图片高度和宽度
    const height = buffer.readUInt32BE(14);
    const width = buffer.readUInt32BE(18);
    
    if (height === 0 || width === 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('验证 PSD 文件失败:', error);
    return false;
  }
}

/**
 * 验证设计文件有效性
 * @param filePath 文件路径
 * @param format 文件格式
 * @returns 是否有效
 */
export async function validateDesignFile(filePath: string, format: string): Promise<boolean> {
  const upperFormat = format.toUpperCase().replace('.', '');

  // 1. 验证文件签名
  const signatureValid = await validateFileSignature(filePath, upperFormat);
  if (!signatureValid) {
    console.warn(`文件签名验证失败: ${filePath}`);
    return false;
  }

  // 2. 根据格式进行特定验证
  switch (upperFormat) {
    case 'PSD':
      return validatePSDFile(filePath);
    
    case 'JPG':
    case 'JPEG':
    case 'PNG':
      return validateImagePixels(filePath, upperFormat);
    
    case 'AI':
    case 'CDR':
      // AI 和 CDR 文件只验证签名
      return true;
    
    default:
      // 其他格式默认通过
      return true;
  }
}

/**
 * 设计文件验证结果接口
 */
export interface DesignFileValidationResult {
  valid: boolean;
  format: string;
  message?: string;
  dimensions?: { width: number; height: number };
}

/**
 * 获取设计文件详细信息
 * @param filePath 文件路径
 * @param format 文件格式
 * @returns 验证结果和详细信息
 */
export async function getDesignFileInfo(
  filePath: string,
  format: string
): Promise<DesignFileValidationResult> {
  const upperFormat = format.toUpperCase().replace('.', '');
  
  const isValid = await validateDesignFile(filePath, upperFormat);
  
  if (!isValid) {
    return {
      valid: false,
      format: upperFormat,
      message: '文件格式无效或已损坏',
    };
  }

  // 尝试获取图片尺寸
  let dimensions: { width: number; height: number } | undefined;
  
  try {
    if (upperFormat === 'PNG') {
      const fd = await fs.promises.open(filePath, 'r');
      const buffer = Buffer.alloc(24);
      await fd.read(buffer, 0, 24, 0);
      await fd.close();
      
      dimensions = {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      };
    } else if (upperFormat === 'PSD') {
      const fd = await fs.promises.open(filePath, 'r');
      const buffer = Buffer.alloc(26);
      await fd.read(buffer, 0, 26, 0);
      await fd.close();
      
      dimensions = {
        width: buffer.readUInt32BE(18),
        height: buffer.readUInt32BE(14),
      };
    }
  } catch (error) {
    console.error('获取文件尺寸失败:', error);
  }

  return {
    valid: true,
    format: upperFormat,
    dimensions,
  };
}
