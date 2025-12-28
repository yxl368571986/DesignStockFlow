/**
 * 上传相关API接口
 * 支持直接上传和分片上传两种方式
 */

import { get, post, del, upload } from '@/utils/request';
import type { UploadMetadata, ResourceInfo } from '@/types/models';
import type { ApiResponse } from '@/types/api';

// 允许的设计文件格式
const ALLOWED_DESIGN_FORMATS = ['PSD', 'AI', 'CDR', 'JPG', 'JPEG', 'PNG'];
// 允许的压缩包格式
const ALLOWED_ARCHIVE_FORMATS = ['ZIP', 'RAR', '7Z', 'TAR', 'GZ'];
// 所有允许的格式
const ALLOWED_FORMATS = [...ALLOWED_DESIGN_FORMATS, ...ALLOWED_ARCHIVE_FORMATS];
// 最大文件大小 (1000MB)
const MAX_FILE_SIZE = 1000 * 1024 * 1024;
// 分片大小 (5MB)
const CHUNK_SIZE = 5 * 1024 * 1024;
// 使用分片上传的文件大小阈值 (50MB)
const CHUNK_UPLOAD_THRESHOLD = 50 * 1024 * 1024;

/**
 * 分片上传初始化结果
 */
export interface ChunkUploadInitResult {
  uploadId: string;
  chunkSize: number;
}

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
 * 分片上传结果
 */
export interface ChunkUploadResult {
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
 * 文件格式验证（前端验证）
 * @param data 文件信息
 * @returns 验证结果
 */
export function validateFileFormat(data: {
  fileName: string;
  fileSize: number;
}): Promise<ApiResponse<{ isValid: boolean; msg: string }>> {
  const ext = data.fileName.split('.').pop()?.toUpperCase() || '';
  const timestamp = Date.now();
  
  if (!ALLOWED_FORMATS.includes(ext)) {
    return Promise.resolve({
      code: 200,
      msg: 'success',
      timestamp,
      data: {
        isValid: false,
        msg: `不支持的文件格式: ${ext}，支持的格式: ${ALLOWED_FORMATS.join(', ')}`
      }
    });
  }
  
  if (data.fileSize > MAX_FILE_SIZE) {
    return Promise.resolve({
      code: 200,
      msg: 'success',
      timestamp,
      data: {
        isValid: false,
        msg: `文件大小超过限制，最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }
    });
  }
  
  return Promise.resolve({
    code: 200,
    msg: 'success',
    timestamp,
    data: {
      isValid: true,
      msg: '文件格式验证通过'
    }
  });
}

/**
 * 判断是否应该使用分片上传
 * @param fileSize 文件大小
 * @returns 是否使用分片上传
 */
export function shouldUseChunkUpload(fileSize: number): boolean {
  return fileSize > CHUNK_UPLOAD_THRESHOLD;
}

/**
 * 获取分片大小
 * @returns 分片大小（字节）
 */
export function getChunkSize(): number {
  return CHUNK_SIZE;
}

/**
 * 计算总分片数
 * @param fileSize 文件大小
 * @returns 总分片数
 */
export function calculateTotalChunks(fileSize: number): number {
  return Math.ceil(fileSize / CHUNK_SIZE);
}


/**
 * 初始化分片上传
 * @param data 文件信息
 * @returns 上传会话信息
 */
export function initChunkUpload(data: {
  fileName: string;
  fileSize: number;
  fileHash: string;
  totalChunks: number;
}): Promise<ApiResponse<ChunkUploadInitResult>> {
  return post<ChunkUploadInitResult>('/upload/init', data);
}

/**
 * 上传分片
 * @param formData FormData对象（包含uploadId、chunkIndex、chunk文件）
 * @param onProgress 上传进度回调
 * @returns 上传结果
 */
export function uploadChunk(
  formData: FormData,
  onProgress?: (progressEvent: ProgressEvent) => void
): Promise<ApiResponse<ChunkUploadResult>> {
  return upload<ChunkUploadResult>('/upload/chunk', formData, onProgress);
}

/**
 * 获取已上传的分片列表（断点续传）
 * @param uploadId 上传会话ID
 * @returns 分片信息列表
 */
export function getUploadedChunks(uploadId: string): Promise<ApiResponse<{ chunks: ChunkInfo[] }>> {
  return get<{ chunks: ChunkInfo[] }>(`/upload/${uploadId}/chunks`);
}

/**
 * 完成分片上传
 * @param uploadId 上传会话ID
 * @returns 完成结果
 */
export function completeChunkUpload(uploadId: string): Promise<ApiResponse<CompleteUploadResult>> {
  return post<CompleteUploadResult>(`/upload/${uploadId}/complete`);
}

/**
 * 取消分片上传
 * @param uploadId 上传会话ID
 * @returns void
 */
export function cancelChunkUpload(uploadId: string): Promise<ApiResponse<void>> {
  return del<void>(`/upload/${uploadId}`);
}

/**
 * 直接上传文件（小文件）
 * @param formData FormData对象（包含file文件和元数据）
 * @param onProgress 上传进度回调
 * @returns 资源信息
 */
export function uploadFile(
  formData: FormData,
  onProgress?: (progressEvent: ProgressEvent) => void
): Promise<ApiResponse<ResourceInfo>> {
  return upload<ResourceInfo>('/resources/upload', formData, onProgress);
}

/**
 * 完成文件上传（分片上传后创建资源）
 * @param data 上传信息
 * @returns 资源信息
 */
export function completeFileUpload(data: {
  uploadId: string;
  metadata: UploadMetadata;
}): Promise<ApiResponse<ResourceInfo>> {
  return post<ResourceInfo>('/resources/complete-upload', data);
}

/**
 * 取消上传（兼容旧接口）
 * @param uploadId 上传ID
 * @returns void
 */
export function cancelUpload(uploadId: string): Promise<ApiResponse<void>> {
  return cancelChunkUpload(uploadId);
}

/**
 * 获取上传进度（通过已上传分片计算）
 * @param uploadId 上传ID
 * @returns 进度信息
 */
export async function getUploadProgress(
  uploadId: string
): Promise<ApiResponse<{ progress: number; uploadedChunks: number; totalChunks: number }>> {
  const result = await getUploadedChunks(uploadId);
  const timestamp = Date.now();
  
  if (result.code !== 0 || !result.data) {
    return {
      code: result.code,
      msg: result.msg,
      timestamp,
      data: { progress: 0, uploadedChunks: 0, totalChunks: 0 }
    };
  }
  
  const chunks = result.data.chunks;
  const uploadedChunks = chunks.filter(c => c.uploaded).length;
  const totalChunks = chunks.length > 0 ? chunks[0].totalChunks : 0;
  const progress = totalChunks > 0 ? Math.round((uploadedChunks / totalChunks) * 100) : 0;
  
  return {
    code: 0,
    msg: 'success',
    timestamp,
    data: { progress, uploadedChunks, totalChunks }
  };
}
