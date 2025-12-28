/**
 * 自动审核服务
 * 负责文件自动审核、压缩包解压、内容验证等功能
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AdmZip from 'adm-zip';
import {
  getAuditConfig,
  isDesignFormat,
  isArchiveFormat,
  isIllegalExecutable,
  AuditStatus,
  AuditErrorCodes,
} from '../config/audit.js';
import {
  validateDesignFile,
} from './fileValidationService.js';

/**
 * 解压后的文件信息
 */
export interface ExtractedFileInfo {
  fileName: string;
  fileSize: number;
  fileFormat: string;
  filePath: string;
  isValid: boolean;
  isIllegal: boolean;
}

/**
 * 自动审核结果
 */
export interface AutoAuditResult {
  passed: boolean;
  auditStatus: AuditStatus;
  message: string;
  messageType: 'success' | 'warning' | 'error';
  extractedFiles?: ExtractedFileInfo[];
  errorCode?: string;
}

/**
 * 压缩包解压结果
 */
export interface ExtractResult {
  success: boolean;
  tempDir?: string;
  files?: ExtractedFileInfo[];
  error?: string;
  errorCode?: string;
}

/**
 * 解压内容验证结果
 */
export interface ContentValidationResult {
  hasValidDesignFile: boolean;
  hasIllegalFile: boolean;
  validFiles: ExtractedFileInfo[];
  illegalFiles: ExtractedFileInfo[];
}

/**
 * 执行自动审核
 * @param file 上传的文件信息
 * @param filePath 文件路径
 * @returns 审核结果
 */
export async function performAutoAudit(
  file: { originalname: string; size: number; mimetype?: string },
  filePath: string
): Promise<AutoAuditResult> {
  const config = getAuditConfig();
  
  // 开发模式：直接通过审核
  if (config.mode === 'development') {
    return {
      passed: true,
      auditStatus: AuditStatus.APPROVED,
      message: '上传成功',
      messageType: 'success',
    };
  }

  // 生产模式：执行完整审核流程
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  // 设计文件审核
  if (isDesignFormat(ext)) {
    return auditDesignFile(filePath, ext);
  }
  
  // 压缩包审核
  if (isArchiveFormat(ext)) {
    return auditArchiveFile(filePath, ext);
  }

  // 未知格式，转入人工审核
  return {
    passed: false,
    auditStatus: AuditStatus.PENDING,
    message: '上传成功，等待审核',
    messageType: 'warning',
  };
}

/**
 * 审核设计文件
 * @param filePath 文件路径
 * @param format 文件格式
 * @returns 审核结果
 */
async function auditDesignFile(filePath: string, format: string): Promise<AutoAuditResult> {
  try {
    const isValid = await validateDesignFile(filePath, format);
    
    if (isValid) {
      return {
        passed: true,
        auditStatus: AuditStatus.APPROVED,
        message: '上传成功，已自动审核通过',
        messageType: 'success',
      };
    } else {
      return {
        passed: false,
        auditStatus: AuditStatus.PENDING,
        message: '上传成功，等待审核',
        messageType: 'warning',
      };
    }
  } catch (error) {
    console.error('设计文件审核失败:', error);
    return {
      passed: false,
      auditStatus: AuditStatus.PENDING,
      message: '上传成功，等待审核',
      messageType: 'warning',
    };
  }
}

/**
 * 审核压缩包文件
 * @param filePath 文件路径
 * @param format 文件格式
 * @returns 审核结果
 */
async function auditArchiveFile(filePath: string, format: string): Promise<AutoAuditResult> {
  let tempDir: string | undefined;
  
  try {
    // 解压压缩包
    const extractResult = await extractArchive(filePath, format);
    tempDir = extractResult.tempDir;
    
    if (!extractResult.success) {
      return {
        passed: false,
        auditStatus: AuditStatus.PENDING,
        message: extractResult.error || '压缩包无法自动解压（损坏/密码保护），已转入人工审核',
        messageType: 'warning',
        errorCode: extractResult.errorCode,
      };
    }

    // 验证解压内容
    const validationResult = validateExtractedContent(extractResult.files || []);
    
    // 检查是否有非法文件
    if (validationResult.hasIllegalFile) {
      return {
        passed: false,
        auditStatus: AuditStatus.PENDING,
        message: '压缩包内含有非法文件，已转入人工审核',
        messageType: 'warning',
        extractedFiles: extractResult.files,
      };
    }

    // 检查是否有有效设计文件
    if (!validationResult.hasValidDesignFile) {
      return {
        passed: false,
        auditStatus: AuditStatus.PENDING,
        message: '压缩包内无有效设计文件，已转入人工审核',
        messageType: 'warning',
        extractedFiles: extractResult.files,
      };
    }

    // 审核通过
    return {
      passed: true,
      auditStatus: AuditStatus.APPROVED,
      message: '上传成功，已自动审核通过',
      messageType: 'success',
      extractedFiles: extractResult.files,
    };
  } catch (error) {
    console.error('压缩包审核失败:', error);
    return {
      passed: false,
      auditStatus: AuditStatus.PENDING,
      message: '上传成功，等待审核',
      messageType: 'warning',
    };
  } finally {
    // 清理临时文件
    if (tempDir) {
      await cleanupTempFiles(tempDir);
    }
  }
}

/**
 * 解压压缩包到临时目录
 * @param filePath 压缩包文件路径
 * @param format 压缩包格式
 * @returns 解压结果
 */
export async function extractArchive(filePath: string, format: string): Promise<ExtractResult> {
  const config = getAuditConfig();
  const upperFormat = format.toUpperCase();
  
  // 创建临时目录
  const tempDir = path.join(config.tempDir, `extract_${uuidv4()}`);
  
  try {
    // 确保临时目录存在
    await fs.promises.mkdir(tempDir, { recursive: true });
    
    // 目前只支持 ZIP 格式的自动解压
    if (upperFormat === 'ZIP') {
      return await extractZipArchive(filePath, tempDir);
    }
    
    // RAR/7Z/TAR/GZ 格式暂不支持自动解压，转入人工审核
    return {
      success: false,
      error: `${upperFormat} 格式暂不支持自动解压，已转入人工审核`,
      errorCode: AuditErrorCodes.AUDIT_005.code,
    };
  } catch (error) {
    console.error('解压压缩包失败:', error);
    // 清理临时目录
    await cleanupTempFiles(tempDir);
    return {
      success: false,
      error: '压缩包解压失败',
      errorCode: AuditErrorCodes.AUDIT_005.code,
    };
  }
}

/**
 * 解压 ZIP 文件
 * @param filePath ZIP 文件路径
 * @param tempDir 临时目录
 * @returns 解压结果
 */
async function extractZipArchive(filePath: string, tempDir: string): Promise<ExtractResult> {
  try {
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();
    
    // 检查是否为加密压缩包
    for (const entry of entries) {
      if (entry.header.flags & 0x01) {
        return {
          success: false,
          tempDir,
          error: '压缩包有密码保护，无法自动解压',
          errorCode: AuditErrorCodes.AUDIT_005.code,
        };
      }
    }
    
    // 解压文件
    zip.extractAllTo(tempDir, true);
    
    // 收集解压后的文件信息
    const files = await collectExtractedFiles(tempDir);
    
    return {
      success: true,
      tempDir,
      files,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 检查是否为密码保护或损坏的压缩包
    if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
      return {
        success: false,
        tempDir,
        error: '压缩包有密码保护，无法自动解压',
        errorCode: AuditErrorCodes.AUDIT_005.code,
      };
    }
    
    if (errorMessage.includes('Invalid') || errorMessage.includes('corrupt')) {
      return {
        success: false,
        tempDir,
        error: '压缩包已损坏，无法解压',
        errorCode: AuditErrorCodes.AUDIT_005.code,
      };
    }
    
    throw error;
  }
}

/**
 * 递归收集解压后的文件信息
 * @param dir 目录路径
 * @param basePath 基础路径（用于计算相对路径）
 * @returns 文件信息列表
 */
async function collectExtractedFiles(dir: string, basePath?: string): Promise<ExtractedFileInfo[]> {
  const files: ExtractedFileInfo[] = [];
  const base = basePath || dir;
  
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // 递归处理子目录
        const subFiles = await collectExtractedFiles(fullPath, base);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const stats = await fs.promises.stat(fullPath);
        const ext = path.extname(entry.name).toLowerCase().replace('.', '');
        const relativePath = path.relative(base, fullPath);
        
        files.push({
          fileName: entry.name,
          fileSize: stats.size,
          fileFormat: ext.toUpperCase(),
          filePath: relativePath,
          isValid: isDesignFormat(ext),
          isIllegal: isIllegalExecutable(ext),
        });
      }
    }
  } catch (error) {
    console.error('收集解压文件信息失败:', error);
  }
  
  return files;
}

/**
 * 验证解压后的文件内容
 * @param files 解压后的文件列表
 * @returns 验证结果
 */
export function validateExtractedContent(files: ExtractedFileInfo[]): ContentValidationResult {
  const validFiles: ExtractedFileInfo[] = [];
  const illegalFiles: ExtractedFileInfo[] = [];
  
  for (const file of files) {
    if (file.isIllegal) {
      illegalFiles.push(file);
    }
    if (file.isValid) {
      validFiles.push(file);
    }
  }
  
  return {
    hasValidDesignFile: validFiles.length > 0,
    hasIllegalFile: illegalFiles.length > 0,
    validFiles,
    illegalFiles,
  };
}

/**
 * 清理临时文件目录
 * @param tempDir 临时目录路径
 */
export async function cleanupTempFiles(tempDir: string): Promise<void> {
  try {
    // 检查目录是否存在
    const exists = await fs.promises.access(tempDir).then(() => true).catch(() => false);
    if (!exists) {
      return;
    }
    
    // 递归删除目录
    await fs.promises.rm(tempDir, { recursive: true, force: true });
    console.log(`已清理临时目录: ${tempDir}`);
  } catch (error) {
    console.error(`清理临时目录失败: ${tempDir}`, error);
  }
}

/**
 * 清理过期的临时文件（定时任务）
 * 删除超过配置时间（默认24小时）的临时解压目录
 */
export async function cleanupExpiredTempFiles(): Promise<void> {
  const config = getAuditConfig();
  const tempBaseDir = config.tempDir;
  const expireHours = config.tempFileExpireHours;
  const expireMs = expireHours * 60 * 60 * 1000;
  const now = Date.now();
  
  try {
    // 确保临时目录存在
    const exists = await fs.promises.access(tempBaseDir).then(() => true).catch(() => false);
    if (!exists) {
      console.log('临时目录不存在，跳过清理');
      return;
    }
    
    const entries = await fs.promises.readdir(tempBaseDir, { withFileTypes: true });
    let cleanedCount = 0;
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      // 只处理 extract_ 开头的目录
      if (!entry.name.startsWith('extract_')) continue;
      
      const dirPath = path.join(tempBaseDir, entry.name);
      
      try {
        const stats = await fs.promises.stat(dirPath);
        const age = now - stats.mtimeMs;
        
        if (age > expireMs) {
          await fs.promises.rm(dirPath, { recursive: true, force: true });
          cleanedCount++;
          console.log(`已清理过期临时目录: ${dirPath}`);
        }
      } catch (error) {
        console.error(`检查临时目录失败: ${dirPath}`, error);
      }
    }
    
    console.log(`临时文件清理完成，共清理 ${cleanedCount} 个过期目录`);
  } catch (error) {
    console.error('清理过期临时文件失败:', error);
  }
}

/**
 * 初始化自动审核服务
 * 系统启动时调用，执行临时文件清理
 */
export async function initAutoAuditService(): Promise<void> {
  console.log('初始化自动审核服务...');
  
  // 确保临时目录存在
  const config = getAuditConfig();
  try {
    await fs.promises.mkdir(config.tempDir, { recursive: true });
  } catch (error) {
    console.error('创建临时目录失败:', error);
  }
  
  // 启动时清理过期临时文件
  await cleanupExpiredTempFiles();
  
  console.log('自动审核服务初始化完成');
}
