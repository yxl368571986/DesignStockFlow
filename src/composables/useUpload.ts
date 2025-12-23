/**
 * 上传组合式函数
 * 提供文件上传、分片上传、进度管理等功能
 */

import { ref, readonly } from 'vue';
import { ElMessage } from 'element-plus';
import CryptoJS from 'crypto-js';
import {
  validateFileFormat,
  initChunkUpload,
  uploadChunk,
  completeFileUpload,
  uploadFile as uploadFileAPI,
  cancelUpload
} from '@/api/upload';
import { validateFile, validateFileNameSecurity } from '@/utils/validate';
import { sanitizeInput, sanitizeFileName } from '@/utils/security';
import { CHUNK_THRESHOLD, CHUNK_SIZE } from '@/utils/constants';
import type { UploadMetadata, ResourceInfo } from '@/types/models';

/**
 * 上传组合式函数
 */
export function useUpload() {
  // ========== 状态 ==========

  /**
   * 上传进度（0-100）
   */
  const uploadProgress = ref(0);

  /**
   * 是否正在上传
   */
  const isUploading = ref(false);

  /**
   * 错误信息
   */
  const error = ref<string | null>(null);

  /**
   * 当前上传ID（用于取消上传）
   */
  const currentUploadId = ref<string | null>(null);

  /**
   * 上传速度（字节/秒）
   */
  const uploadSpeed = ref(0);

  /**
   * 剩余时间（秒）
   */
  const remainingTime = ref(0);

  // ========== 私有方法 ==========

  /**
   * 计算文件哈希值
   * @param file 文件对象
   * @returns Promise<string> 文件哈希值
   */
  async function calculateFileHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
          const hash = CryptoJS.SHA256(wordArray).toString();
          resolve(hash);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };

      // 对于大文件，只读取前10MB计算哈希（提高性能）
      const blob = file.size > 10 * 1024 * 1024 ? file.slice(0, 10 * 1024 * 1024) : file;
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * 更新上传进度和速度
   * @param loaded 已上传字节数
   * @param total 总字节数
   * @param startTime 开始时间
   */
  function updateProgress(loaded: number, total: number, startTime: number): void {
    // 计算进度百分比
    const progress = Math.round((loaded / total) * 100);
    uploadProgress.value = Math.min(progress, 100);

    // 计算上传速度（字节/秒）
    const elapsedTime = (Date.now() - startTime) / 1000; // 秒
    if (elapsedTime > 0) {
      uploadSpeed.value = Math.round(loaded / elapsedTime);

      // 计算剩余时间（秒）
      const remainingBytes = total - loaded;
      remainingTime.value = Math.round(remainingBytes / uploadSpeed.value);
    }
  }

  // ========== 公共方法 ==========

  /**
   * 处理文件上传
   * @param file 文件对象
   * @param metadata 上传元数据
   * @returns Promise<{ success: boolean, data?: ResourceInfo, error?: string }>
   */
  async function handleFileUpload(
    file: File,
    metadata: UploadMetadata
  ): Promise<{ success: boolean; data?: ResourceInfo; error?: string }> {
    // 检查网络状态
    if (!navigator.onLine) {
      error.value = '上传功能需要网络连接';
      ElMessage.warning(error.value);
      return { success: false, error: error.value };
    }

    // 重置状态
    error.value = null;
    uploadProgress.value = 0;
    uploadSpeed.value = 0;
    remainingTime.value = 0;
    currentUploadId.value = null;

    // ========== 安全验证第一层：前端文件验证 ==========

    // 1. 验证文件名安全性
    const fileNameValidation = validateFileNameSecurity(file.name);
    if (!fileNameValidation.valid) {
      error.value = fileNameValidation.message || '文件名验证失败';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    }

    // 2. 验证文件内容（扩展名 + MIME类型 + 大小）
    const validation = validateFile(file);
    if (!validation.valid) {
      error.value = validation.message || '文件验证失败';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    }

    // 记录验证详情（用于调试）
    if (validation.details) {
      console.log('文件验证通过:', {
        fileName: file.name,
        extension: validation.details.extension,
        mimeType: validation.details.mimeType,
        size: validation.details.sizeFormatted
      });
    }

    // 3. 净化文件名（移除危险字符）
    const sanitizedFileName = sanitizeFileName(file.name);
    console.log('文件名净化:', { original: file.name, sanitized: sanitizedFileName });

    // 4. XSS防护：净化用户输入的元数据
    const sanitizedMetadata: UploadMetadata = {
      title: sanitizeInput(metadata.title),
      categoryId: metadata.categoryId, // 分类ID不需要净化（来自下拉选择）
      tags: metadata.tags.map((tag) => sanitizeInput(tag)),
      description: sanitizeInput(metadata.description),
      vipLevel: metadata.vipLevel // 数字不需要净化
    };

    // 标记为上传中
    isUploading.value = true;

    try {
      // ========== 安全验证第二层：后端文件格式验证 ==========

      const formatValidation = await validateFileFormat({
        fileName: sanitizedFileName, // 使用净化后的文件名
        fileSize: file.size
      });

      if (formatValidation.code !== 200 || !formatValidation.data?.isValid) {
        error.value = formatValidation.data?.msg || '后端文件格式验证失败';
        ElMessage.error(error.value);
        return { success: false, error: error.value };
      }

      console.log('后端验证通过:', formatValidation.data);

      // 根据文件大小选择上传方式
      let result;
      if (file.size > CHUNK_THRESHOLD) {
        // 大文件：分片上传
        result = await uploadInChunks(file, sanitizedMetadata, sanitizedFileName);
      } else {
        // 小文件：直接上传
        result = await uploadDirectly(file, sanitizedMetadata, sanitizedFileName);
      }

      return result;
    } catch (e) {
      error.value = (e as Error).message || '上传失败，请稍后重试';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    } finally {
      isUploading.value = false;
      currentUploadId.value = null;
    }
  }

  /**
   * 分片上传
   * @param file 文件对象
   * @param metadata 上传元数据
   * @param sanitizedFileName 净化后的文件名
   * @returns Promise<{ success: boolean, data?: ResourceInfo, error?: string }>
   */
  async function uploadInChunks(
    file: File,
    metadata: UploadMetadata,
    sanitizedFileName: string
  ): Promise<{ success: boolean; data?: ResourceInfo; error?: string }> {
    const startTime = Date.now();

    try {
      // 计算文件哈希
      ElMessage.info('正在计算文件哈希...');
      const fileHash = await calculateFileHash(file);

      // 计算分片数量
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      // 初始化分片上传（使用净化后的文件名）
      const initResponse = await initChunkUpload({
        fileName: sanitizedFileName,
        fileSize: file.size,
        fileHash,
        totalChunks
      });

      if (initResponse.code !== 200 || !initResponse.data?.uploadId) {
        throw new Error(initResponse.msg || '初始化上传失败');
      }

      const uploadId = initResponse.data.uploadId;
      currentUploadId.value = uploadId;

      ElMessage.success('开始上传...');

      // 上传每个分片
      let uploadedBytes = 0;
      const maxRetries = 3; // 每个分片最多重试3次

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // 创建FormData
        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', i.toString());
        formData.append('chunk', chunk);

        // 重试逻辑
        let retries = 0;
        let chunkUploaded = false;

        while (retries < maxRetries && !chunkUploaded) {
          try {
            // 上传分片
            const chunkResponse = await uploadChunk(formData, (progressEvent) => {
              if (progressEvent.total) {
                const chunkLoaded = progressEvent.loaded;
                const totalLoaded = uploadedBytes + chunkLoaded;
                updateProgress(totalLoaded, file.size, startTime);
              }
            });

            if (chunkResponse.code === 200 && chunkResponse.data?.success) {
              chunkUploaded = true;
              uploadedBytes += chunk.size;
              updateProgress(uploadedBytes, file.size, startTime);
            } else {
              throw new Error(chunkResponse.msg || `分片${i + 1}上传失败`);
            }
          } catch (e) {
            retries++;
            if (retries >= maxRetries) {
              throw new Error(`分片${i + 1}上传失败，已重试${maxRetries}次`);
            }
            // 等待1秒后重试
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      // 完成上传
      ElMessage.info('正在处理文件...');
      const completeResponse = await completeFileUpload({
        uploadId,
        metadata
      });

      if (completeResponse.code === 200 && completeResponse.data) {
        uploadProgress.value = 100;
        ElMessage.success('上传成功！');
        return { success: true, data: completeResponse.data };
      } else {
        throw new Error(completeResponse.msg || '完成上传失败');
      }
    } catch (e) {
      // 取消上传
      if (currentUploadId.value) {
        try {
          await cancelUpload(currentUploadId.value);
        } catch {
          // 忽略取消失败
        }
      }

      error.value = (e as Error).message || '分片上传失败';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    }
  }

  /**
   * 直接上传（小文件）
   * @param file 文件对象
   * @param metadata 上传元数据
   * @param sanitizedFileName 净化后的文件名
   * @returns Promise<{ success: boolean, data?: ResourceInfo, error?: string }>
   */
  async function uploadDirectly(
    file: File,
    metadata: UploadMetadata,
    sanitizedFileName: string
  ): Promise<{ success: boolean; data?: ResourceInfo; error?: string }> {
    const startTime = Date.now();

    try {
      // 创建FormData
      const formData = new FormData();

      // 使用净化后的文件名创建新的File对象
      const sanitizedFile = new File([file], sanitizedFileName, { type: file.type });

      formData.append('file', sanitizedFile);
      formData.append('title', metadata.title);
      formData.append('categoryId', metadata.categoryId);
      formData.append('tags', JSON.stringify(metadata.tags));
      formData.append('description', metadata.description);
      formData.append('vipLevel', metadata.vipLevel.toString());

      ElMessage.success('开始上传...');

      // 上传文件
      const response = await uploadFileAPI(formData, (progressEvent) => {
        if (progressEvent.total) {
          updateProgress(progressEvent.loaded, progressEvent.total, startTime);
        }
      });

      if (response.code === 200 && response.data) {
        uploadProgress.value = 100;
        ElMessage.success('上传成功！');
        return { success: true, data: response.data };
      } else {
        throw new Error(response.msg || '上传失败');
      }
    } catch (e) {
      error.value = (e as Error).message || '上传失败';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    }
  }

  /**
   * 取消当前上传
   * @returns Promise<void>
   */
  async function cancelCurrentUpload(): Promise<void> {
    if (!currentUploadId.value) {
      ElMessage.warning('没有正在进行的上传');
      return;
    }

    try {
      await cancelUpload(currentUploadId.value);
      ElMessage.success('已取消上传');

      // 重置状态
      isUploading.value = false;
      uploadProgress.value = 0;
      uploadSpeed.value = 0;
      remainingTime.value = 0;
      currentUploadId.value = null;
    } catch (e) {
      ElMessage.error('取消上传失败');
    }
  }

  /**
   * 重置上传状态
   */
  function resetUploadState(): void {
    uploadProgress.value = 0;
    isUploading.value = false;
    error.value = null;
    currentUploadId.value = null;
    uploadSpeed.value = 0;
    remainingTime.value = 0;
  }

  // ========== 返回公共接口 ==========
  return {
    // 状态（只读）
    uploadProgress: readonly(uploadProgress),
    isUploading: readonly(isUploading),
    error: readonly(error),
    uploadSpeed: readonly(uploadSpeed),
    remainingTime: readonly(remainingTime),

    // 方法
    handleFileUpload,
    uploadInChunks,
    uploadDirectly,
    cancelCurrentUpload,
    resetUploadState
  };
}
