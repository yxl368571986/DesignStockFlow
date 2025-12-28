/**
 * 分片上传服务
 * 负责大文件分片上传、断点续传、分片合并等功能
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { getAuditConfig } from '../config/audit.js';

const prisma = new PrismaClient();

/**
 * 分片信息
 */
export interface ChunkInfo {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkSize: number;
  uploaded: boolean;
}

/**
 * 初始化分片上传参数
 */
export interface InitChunkUploadParams {
  userId: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  totalChunks: number;
}

/**
 * 初始化分片上传结果
 */
export interface InitChunkUploadResult {
  uploadId: string;
  chunkSize: number;
}

/**
 * 上传分片参数
 */
export interface UploadChunkParams {
  uploadId: string;
  chunkIndex: number;
  chunkData: Buffer;
}

/**
 * 上传分片结果
 */
export interface UploadChunkResult {
  success: boolean;
  uploaded: number;
  total: number;
}


/**
 * 完成上传结果
 */
export interface CompleteUploadResult {
  success: boolean;
  filePath: string;
  fileSize: number;
}

/**
 * 初始化分片上传
 * @param params 初始化参数
 * @returns 上传会话信息
 */
export async function initChunkUpload(params: InitChunkUploadParams): Promise<InitChunkUploadResult> {
  const config = getAuditConfig();
  const uploadId = uuidv4();
  const tempDir = path.join(config.tempDir, `chunks_${uploadId}`);
  
  // 创建临时目录
  await fs.promises.mkdir(tempDir, { recursive: true });
  
  // 计算过期时间
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + config.chunkUpload.sessionExpireHours);
  
  // 创建上传会话记录
  await prisma.chunk_uploads.create({
    data: {
      upload_id: uploadId,
      user_id: params.userId,
      file_name: params.fileName,
      file_size: BigInt(params.fileSize),
      file_hash: params.fileHash,
      total_chunks: params.totalChunks,
      uploaded_chunks: 0,
      status: 'uploading',
      temp_dir: tempDir,
      expires_at: expiresAt,
    },
  });
  
  // 创建分片记录
  const chunkParts = [];
  for (let i = 0; i < params.totalChunks; i++) {
    chunkParts.push({
      upload_id: uploadId,
      chunk_index: i,
      chunk_size: i === params.totalChunks - 1
        ? params.fileSize - (params.totalChunks - 1) * config.chunkUpload.chunkSize
        : config.chunkUpload.chunkSize,
      uploaded: false,
    });
  }
  
  await prisma.chunk_parts.createMany({
    data: chunkParts,
  });
  
  return {
    uploadId,
    chunkSize: config.chunkUpload.chunkSize,
  };
}

/**
 * 上传单个分片
 * @param params 上传参数
 * @returns 上传结果
 */
export async function uploadChunk(params: UploadChunkParams): Promise<UploadChunkResult> {
  // 获取上传会话
  const upload = await prisma.chunk_uploads.findUnique({
    where: { upload_id: params.uploadId },
  });
  
  if (!upload) {
    throw new Error('上传会话不存在');
  }
  
  if (upload.status !== 'uploading') {
    throw new Error('上传会话已结束');
  }
  
  // 检查分片索引有效性
  if (params.chunkIndex < 0 || params.chunkIndex >= upload.total_chunks) {
    throw new Error('分片索引无效');
  }
  
  // 保存分片文件
  const chunkPath = path.join(upload.temp_dir!, `chunk_${params.chunkIndex}`);
  await fs.promises.writeFile(chunkPath, params.chunkData);
  
  // 更新分片状态
  await prisma.chunk_parts.updateMany({
    where: {
      upload_id: params.uploadId,
      chunk_index: params.chunkIndex,
    },
    data: {
      uploaded: true,
      chunk_size: params.chunkData.length,
    },
  });
  
  // 更新已上传分片数
  const uploadedCount = await prisma.chunk_parts.count({
    where: {
      upload_id: params.uploadId,
      uploaded: true,
    },
  });
  
  await prisma.chunk_uploads.update({
    where: { upload_id: params.uploadId },
    data: { uploaded_chunks: uploadedCount },
  });
  
  return {
    success: true,
    uploaded: uploadedCount,
    total: upload.total_chunks,
  };
}


/**
 * 获取已上传的分片信息（断点续传）
 * @param uploadId 上传会话ID
 * @returns 分片信息列表
 */
export async function getUploadedChunks(uploadId: string): Promise<ChunkInfo[]> {
  const upload = await prisma.chunk_uploads.findUnique({
    where: { upload_id: uploadId },
    include: { chunk_parts: true },
  });
  
  if (!upload) {
    throw new Error('上传会话不存在');
  }
  
  return upload.chunk_parts.map(part => ({
    uploadId: upload.upload_id,
    chunkIndex: part.chunk_index,
    totalChunks: upload.total_chunks,
    chunkSize: part.chunk_size,
    uploaded: part.uploaded,
  }));
}

/**
 * 合并分片完成上传
 * @param uploadId 上传会话ID
 * @returns 完成结果
 */
export async function completeChunkUpload(uploadId: string): Promise<CompleteUploadResult> {
  const upload = await prisma.chunk_uploads.findUnique({
    where: { upload_id: uploadId },
    include: { chunk_parts: { orderBy: { chunk_index: 'asc' } } },
  });
  
  if (!upload) {
    throw new Error('上传会话不存在');
  }
  
  if (upload.status !== 'uploading') {
    throw new Error('上传会话已结束');
  }
  
  // 检查所有分片是否已上传
  const allUploaded = upload.chunk_parts.every(part => part.uploaded);
  if (!allUploaded) {
    throw new Error('还有分片未上传完成');
  }
  
  // 创建最终文件目录
  const finalDir = './uploads/resources';
  await fs.promises.mkdir(finalDir, { recursive: true });
  
  // 生成最终文件路径 - 保留原始文件名，如果冲突则添加序号
  const originalFileName = upload.file_name;
  const ext = path.extname(originalFileName);
  const basename = path.basename(originalFileName, ext);
  
  let finalFileName = originalFileName;
  let counter = 1;
  
  // 检查文件是否存在，如果存在则添加序号
  while (fs.existsSync(path.join(finalDir, finalFileName))) {
    finalFileName = `${basename}(${counter})${ext}`;
    counter++;
  }
  
  const finalPath = path.join(finalDir, finalFileName);
  
  // 合并分片
  const writeStream = fs.createWriteStream(finalPath);
  
  for (const part of upload.chunk_parts) {
    const chunkPath = path.join(upload.temp_dir!, `chunk_${part.chunk_index}`);
    const chunkData = await fs.promises.readFile(chunkPath);
    writeStream.write(chunkData);
  }
  
  await new Promise<void>((resolve, reject) => {
    writeStream.end((err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  // 获取最终文件大小
  const stats = await fs.promises.stat(finalPath);
  
  // 更新上传会话状态
  await prisma.chunk_uploads.update({
    where: { upload_id: uploadId },
    data: { status: 'completed' },
  });
  
  // 清理临时分片文件
  await cleanupChunkTempFiles(upload.temp_dir!);
  
  return {
    success: true,
    filePath: finalPath,
    fileSize: stats.size,
  };
}

/**
 * 取消分片上传
 * @param uploadId 上传会话ID
 */
export async function cancelChunkUpload(uploadId: string): Promise<void> {
  const upload = await prisma.chunk_uploads.findUnique({
    where: { upload_id: uploadId },
  });
  
  if (!upload) {
    throw new Error('上传会话不存在');
  }
  
  // 更新状态为已取消
  await prisma.chunk_uploads.update({
    where: { upload_id: uploadId },
    data: { status: 'cancelled' },
  });
  
  // 清理临时文件
  if (upload.temp_dir) {
    await cleanupChunkTempFiles(upload.temp_dir);
  }
}

/**
 * 清理分片临时文件
 * @param tempDir 临时目录
 */
async function cleanupChunkTempFiles(tempDir: string): Promise<void> {
  try {
    const exists = await fs.promises.access(tempDir).then(() => true).catch(() => false);
    if (exists) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('清理分片临时文件失败:', error);
  }
}

/**
 * 清理过期的分片上传会话
 */
export async function cleanupExpiredChunkUploads(): Promise<void> {
  const now = new Date();
  
  // 查找过期的上传会话
  const expiredUploads = await prisma.chunk_uploads.findMany({
    where: {
      status: 'uploading',
      expires_at: { lt: now },
    },
  });
  
  for (const upload of expiredUploads) {
    // 清理临时文件
    if (upload.temp_dir) {
      await cleanupChunkTempFiles(upload.temp_dir);
    }
    
    // 更新状态为已取消
    await prisma.chunk_uploads.update({
      where: { upload_id: upload.upload_id },
      data: { status: 'cancelled' },
    });
  }
  
  console.log(`已清理 ${expiredUploads.length} 个过期的分片上传会话`);
}

/**
 * 初始化分片上传服务
 */
export async function initChunkUploadService(): Promise<void> {
  console.log('初始化分片上传服务...');
  await cleanupExpiredChunkUploads();
  console.log('分片上传服务初始化完成');
}
