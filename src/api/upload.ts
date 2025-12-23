/**
 * 上传相关API接口
 */

import { post, upload } from '@/utils/request';
import type { UploadMetadata, ResourceInfo } from '@/types/models';
import type { ApiResponse } from '@/types/api';

/**
 * 文件格式验证接口
 * @param data 文件信息（文件名、文件大小）
 * @returns Promise<{ isValid: boolean; msg: string }>
 */
export function validateFileFormat(data: {
  fileName: string;
  fileSize: number;
}): Promise<ApiResponse<{ isValid: boolean; msg: string }>> {
  return post<{ isValid: boolean; msg: string }>('/upload/validate', data);
}

/**
 * 初始化分片上传
 * @param data 文件信息（文件名、文件大小、文件哈希、总分片数）
 * @returns Promise<{ uploadId: string }>
 */
export function initChunkUpload(data: {
  fileName: string;
  fileSize: number;
  fileHash: string;
  totalChunks: number;
}): Promise<ApiResponse<{ uploadId: string }>> {
  return post<{ uploadId: string }>('/upload/init-chunk', data);
}

/**
 * 上传分片
 * @param formData FormData对象（包含uploadId、chunkIndex、chunk文件）
 * @param onProgress 上传进度回调
 * @returns Promise<{ chunkIndex: number; success: boolean }>
 */
export function uploadChunk(
  formData: FormData,
  onProgress?: (progressEvent: any) => void
): Promise<ApiResponse<{ chunkIndex: number; success: boolean }>> {
  return upload<{ chunkIndex: number; success: boolean }>('/upload/chunk', formData, onProgress);
}

/**
 * 完成文件上传
 * @param data 上传信息（uploadId、元数据）
 * @returns Promise<ResourceInfo>
 */
export function completeFileUpload(data: {
  uploadId: string;
  metadata: UploadMetadata;
}): Promise<ApiResponse<ResourceInfo>> {
  return post<ResourceInfo>('/upload/complete', data);
}

/**
 * 直接上传文件（小文件）
 * @param formData FormData对象（包含file文件和元数据）
 * @param onProgress 上传进度回调
 * @returns Promise<ResourceInfo>
 */
export function uploadFile(
  formData: FormData,
  onProgress?: (progressEvent: any) => void
): Promise<ApiResponse<ResourceInfo>> {
  return upload<ResourceInfo>('/upload/file', formData, onProgress);
}

/**
 * 取消上传
 * @param uploadId 上传ID
 * @returns Promise<void>
 */
export function cancelUpload(uploadId: string): Promise<ApiResponse<void>> {
  return post<void>('/upload/cancel', { uploadId });
}

/**
 * 获取上传进度
 * @param uploadId 上传ID
 * @returns Promise<{ progress: number; uploadedChunks: number; totalChunks: number }>
 */
export function getUploadProgress(
  uploadId: string
): Promise<ApiResponse<{ progress: number; uploadedChunks: number; totalChunks: number }>> {
  return post<{ progress: number; uploadedChunks: number; totalChunks: number }>(
    '/upload/progress',
    { uploadId }
  );
}
