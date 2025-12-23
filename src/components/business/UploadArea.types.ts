/**
 * UploadArea 组件类型定义
 */

// 文件状态枚举
export enum FileStatus {
  WAITING = 'waiting', // 等待上传
  UPLOADING = 'uploading', // 上传中
  SUCCESS = 'success', // 上传成功
  ERROR = 'error' // 上传失败
}

// 文件项接口
export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
  error?: string;
}
