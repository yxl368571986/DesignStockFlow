<!--
  上传区域组件
  
  功能：
  - 拖拽上传区域（支持拖拽文件）
  - 点击选择文件按钮
  - 文件列表展示（文件名、大小、状态）
  - 上传进度条（每个文件独立进度）
  - 删除文件按钮
  - 文件格式和大小验证提示
  
  需求: 需求5.1-5.5（文件上传）
-->

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Upload,
  Delete,
  Document,
  CircleCheck,
  CircleClose,
  Loading
} from '@element-plus/icons-vue';
import { validateFile } from '@/utils/validate';
import { formatFileSize } from '@/utils/format';
import { SUPPORTED_FORMATS, MAX_FILE_SIZE } from '@/utils/constants';
import { FileStatus, type FileItem } from './UploadArea.types';

/**
 * 上传区域组件
 */

// Props定义
interface UploadAreaProps {
  /** 是否允许多文件上传 */
  multiple?: boolean;
  /** 是否自动上传 */
  autoUpload?: boolean;
  /** 最大文件数量 */
  maxFiles?: number;
  /** 是否禁用 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<UploadAreaProps>(), {
  multiple: false,
  autoUpload: false,
  maxFiles: 10,
  disabled: false
});

// Emits定义
const emit = defineEmits<{
  /** 文件添加事件 */
  'file-add': [file: File];
  /** 文件移除事件 */
  'file-remove': [fileId: string];
  /** 文件列表变化事件 */
  'files-change': [files: FileItem[]];
  /** 上传开始事件 */
  'upload-start': [fileId: string];
  /** 上传进度事件 */
  'upload-progress': [fileId: string, progress: number];
  /** 上传成功事件 */
  'upload-success': [fileId: string];
  /** 上传失败事件 */
  'upload-error': [fileId: string, error: string];
}>();

// ========== 状态 ==========

/** 文件列表 */
const fileList = ref<FileItem[]>([]);

/** 是否拖拽悬浮 */
const isDragOver = ref(false);

/** 文件输入框引用 */
const fileInputRef = ref<HTMLInputElement | null>(null);

// ========== 计算属性 ==========

/** 是否可以添加更多文件 */
const canAddMore = computed(() => {
  return fileList.value.length < props.maxFiles;
});

/** 支持的格式提示文本 */
const supportedFormatsText = computed(() => {
  return SUPPORTED_FORMATS.join(', ');
});

/** 最大文件大小提示文本 */
const maxFileSizeText = computed(() => {
  return formatFileSize(MAX_FILE_SIZE);
});

/** 是否有文件 */
const hasFiles = computed(() => {
  return fileList.value.length > 0;
});

/** 上传中的文件数量 */
const uploadingCount = computed(() => {
  return fileList.value.filter((f) => f.status === FileStatus.UPLOADING).length;
});

// ========== 方法 ==========

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 处理文件选择
 */
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (files && files.length > 0) {
    handleFiles(Array.from(files));
  }

  // 清空input，允许重复选择同一文件
  target.value = '';
}

/**
 * 处理拖拽进入
 */
function handleDragEnter(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();

  if (!props.disabled) {
    isDragOver.value = true;
  }
}

/**
 * 处理拖拽悬浮
 */
function handleDragOver(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * 处理拖拽离开
 */
function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();

  // 检查是否真的离开了拖拽区域
  const target = event.currentTarget as HTMLElement;
  const relatedTarget = event.relatedTarget as HTMLElement;

  if (!target.contains(relatedTarget)) {
    isDragOver.value = false;
  }
}

/**
 * 处理文件拖放
 */
function handleDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();

  isDragOver.value = false;

  if (props.disabled) {
    return;
  }

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFiles(Array.from(files));
  }
}

/**
 * 处理文件数组
 */
function handleFiles(files: File[]) {
  // 检查是否可以添加更多文件
  if (!canAddMore.value) {
    ElMessage.warning(`最多只能上传${props.maxFiles}个文件`);
    return;
  }

  // 限制文件数量
  const remainingSlots = props.maxFiles - fileList.value.length;
  const filesToAdd = props.multiple ? files.slice(0, remainingSlots) : [files[0]];

  // 验证并添加文件
  filesToAdd.forEach((file) => {
    addFile(file);
  });
}

/**
 * 添加文件
 */
function addFile(file: File) {
  // 检查是否可以添加更多文件
  if (!canAddMore.value) {
    ElMessage.warning(`最多只能上传${props.maxFiles}个文件`);
    return;
  }

  // 验证文件
  const validation = validateFile(file);

  if (!validation.valid) {
    ElMessage.error(validation.message || '文件验证失败');
    return;
  }

  // 创建文件项
  const fileItem: FileItem = {
    id: generateId(),
    file,
    name: file.name,
    size: file.size,
    status: FileStatus.WAITING,
    progress: 0
  };

  // 添加到列表
  if (props.multiple) {
    fileList.value.push(fileItem);
  } else {
    fileList.value = [fileItem];
  }

  // 触发事件
  emit('file-add', file);
  emit('files-change', fileList.value);

  ElMessage.success(`已添加文件：${file.name}`);
}

/**
 * 移除文件
 */
function removeFile(fileId: string) {
  const index = fileList.value.findIndex((f) => f.id === fileId);

  if (index !== -1) {
    const file = fileList.value[index];

    // 如果正在上传，提示用户
    if (file.status === FileStatus.UPLOADING) {
      ElMessage.warning('文件正在上传中，无法删除');
      return;
    }

    fileList.value.splice(index, 1);

    // 触发事件
    emit('file-remove', fileId);
    emit('files-change', fileList.value);

    ElMessage.success('已移除文件');
  }
}

/**
 * 清空文件列表
 */
function clearFiles() {
  // 检查是否有正在上传的文件
  const hasUploading = fileList.value.some((f) => f.status === FileStatus.UPLOADING);

  if (hasUploading) {
    ElMessage.warning('有文件正在上传中，无法清空');
    return;
  }

  fileList.value = [];
  emit('files-change', fileList.value);
  ElMessage.success('已清空文件列表');
}

/**
 * 获取文件状态图标
 */
function getStatusIcon(status: FileStatus) {
  switch (status) {
    case FileStatus.WAITING:
      return Document;
    case FileStatus.UPLOADING:
      return Loading;
    case FileStatus.SUCCESS:
      return CircleCheck;
    case FileStatus.ERROR:
      return CircleClose;
    default:
      return Document;
  }
}

/**
 * 获取文件状态类型
 */
function getStatusType(status: FileStatus): 'info' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case FileStatus.WAITING:
      return 'info';
    case FileStatus.UPLOADING:
      return 'warning';
    case FileStatus.SUCCESS:
      return 'success';
    case FileStatus.ERROR:
      return 'danger';
    default:
      return 'info';
  }
}

/**
 * 更新文件状态
 */
function updateFileStatus(fileId: string, status: FileStatus, progress?: number, error?: string) {
  const file = fileList.value.find((f) => f.id === fileId);

  if (file) {
    file.status = status;

    if (progress !== undefined) {
      file.progress = progress;
    }

    if (error) {
      file.error = error;
    }
  }
}

/**
 * 获取所有文件
 */
function getFiles(): FileItem[] {
  return fileList.value;
}

/**
 * 获取待上传的文件
 */
function getPendingFiles(): FileItem[] {
  return fileList.value.filter((f) => f.status === FileStatus.WAITING);
}

// 暴露方法给父组件
defineExpose({
  fileList,
  addFile,
  removeFile,
  clearFiles,
  updateFileStatus,
  getFiles,
  getPendingFiles
});
</script>

<template>
  <div class="upload-area">
    <!-- 拖拽上传区域 - 使用 label 包裹以支持点击触发文件选择 -->
    <label
      for="file-upload-input"
      class="upload-dragger"
      :class="{
        'is-dragover': isDragOver,
        'is-disabled': disabled,
        'has-files': hasFiles
      }"
      @dragenter="handleDragEnter"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <el-icon
        class="upload-icon"
        :size="48"
      >
        <Upload />
      </el-icon>

      <div class="upload-text">
        <p class="upload-title">
          {{ hasFiles ? '继续添加文件' : '拖拽文件到此处，或点击选择文件' }}
        </p>
        <p class="upload-hint">
          支持格式：{{ supportedFormatsText }}
        </p>
        <p class="upload-hint">
          单个文件最大：{{ maxFileSizeText }}
        </p>
        <p
          v-if="multiple"
          class="upload-hint"
        >
          最多上传：{{ maxFiles }} 个文件
        </p>
      </div>

      <!-- 隐藏的文件输入框 -->
      <input
        id="file-upload-input"
        ref="fileInputRef"
        type="file"
        :multiple="multiple"
        :accept="SUPPORTED_FORMATS.map((f) => `.${f.toLowerCase()}`).join(',')"
        :disabled="disabled || !canAddMore"
        class="upload-input"
        @change="handleFileSelect"
      >
    </label>

    <!-- 文件列表 -->
    <div
      v-if="hasFiles"
      class="file-list"
    >
      <div class="file-list-header">
        <span class="file-count">已选择 {{ fileList.length }} 个文件</span>
        <el-button
          v-if="!uploadingCount"
          type="danger"
          text
          size="small"
          @click="clearFiles"
        >
          清空列表
        </el-button>
      </div>

      <div class="file-items">
        <div
          v-for="fileItem in fileList"
          :key="fileItem.id"
          class="file-item"
          :class="`is-${fileItem.status}`"
        >
          <!-- 文件图标 -->
          <div class="file-icon">
            <el-icon
              :size="24"
              :class="{ 'is-loading': fileItem.status === FileStatus.UPLOADING }"
            >
              <component :is="getStatusIcon(fileItem.status)" />
            </el-icon>
          </div>

          <!-- 文件信息 -->
          <div class="file-info">
            <div
              class="file-name"
              :title="fileItem.name"
            >
              {{ fileItem.name }}
            </div>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(fileItem.size) }}</span>
              <el-tag
                v-if="fileItem.status !== FileStatus.WAITING"
                :type="getStatusType(fileItem.status)"
                size="small"
                effect="plain"
              >
                {{
                  fileItem.status === FileStatus.UPLOADING
                    ? '上传中'
                    : fileItem.status === FileStatus.SUCCESS
                      ? '上传成功'
                      : fileItem.status === FileStatus.ERROR
                        ? '上传失败'
                        : ''
                }}
              </el-tag>
            </div>

            <!-- 进度条 -->
            <div
              v-if="fileItem.status === FileStatus.UPLOADING"
              class="file-progress"
            >
              <el-progress
                :percentage="fileItem.progress"
                :stroke-width="4"
                :show-text="true"
                :format="(percentage: number) => `${percentage}%`"
              />
            </div>

            <!-- 错误信息 -->
            <div
              v-if="fileItem.status === FileStatus.ERROR && fileItem.error"
              class="file-error"
            >
              <el-text
                type="danger"
                size="small"
              >
                {{ fileItem.error }}
              </el-text>
            </div>
          </div>

          <!-- 删除按钮 -->
          <div class="file-actions">
            <el-button
              type="danger"
              text
              circle
              :icon="Delete"
              :disabled="fileItem.status === FileStatus.UPLOADING"
              @click="removeFile(fileItem.id)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-area {
  width: 100%;
}

/* 拖拽上传区域 - label 元素需要设置为 block */
.upload-dragger {
  display: block;
  position: relative;
  width: 100%;
  padding: 40px 20px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  box-sizing: border-box;
}

.upload-dragger:hover {
  border-color: #165dff;
  background: #f5f8ff;
}

.upload-dragger.is-dragover {
  border-color: #165dff;
  background: #e8f3ff;
  transform: scale(1.02);
}

.upload-dragger.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background: #f5f5f5;
}

.upload-dragger.is-disabled:hover {
  border-color: #dcdfe6;
  background: #f5f5f5;
}

.upload-dragger.has-files {
  padding: 20px;
  border-style: solid;
  background: #fff;
}

/* 上传图标 */
.upload-icon {
  color: #909399;
  margin-bottom: 16px;
  transition: color 0.3s ease;
}

.upload-dragger:hover .upload-icon {
  color: #165dff;
}

.upload-dragger.is-dragover .upload-icon {
  color: #165dff;
  transform: scale(1.1);
}

/* 上传文本 */
.upload-text {
  color: #606266;
}

.upload-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.upload-hint {
  margin: 4px 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

/* 隐藏的文件输入框 - 使用视觉隐藏而不是 display:none */
/* 这样可以确保在所有浏览器中都能通过 label 的 for 属性触发文件选择对话框 */
.upload-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 文件列表 */
.file-list {
  margin-top: 20px;
}

.file-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}

.file-count {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

/* 文件项容器 */
.file-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 文件项 */
.file-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
  transition: all 0.3s ease;
}

.file-item:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.file-item.is-uploading {
  border-color: #ff7d00;
  background: #fff7f0;
}

.file-item.is-success {
  border-color: #67c23a;
  background: #f0f9eb;
}

.file-item.is-error {
  border-color: #f56c6c;
  background: #fef0f0;
}

/* 文件图标 */
.file-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background: #f5f7fa;
}

.file-item.is-waiting .file-icon {
  color: #909399;
}

.file-item.is-uploading .file-icon {
  color: #ff7d00;
  background: #fff7f0;
}

.file-item.is-success .file-icon {
  color: #67c23a;
  background: #f0f9eb;
}

.file-item.is-error .file-icon {
  color: #f56c6c;
  background: #fef0f0;
}

.file-icon .is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 文件信息 */
.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

/* 进度条 */
.file-progress {
  margin-top: 8px;
}

/* 错误信息 */
.file-error {
  margin-top: 4px;
}

/* 文件操作 */
.file-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .upload-dragger {
    padding: 30px 16px;
  }

  .upload-dragger.has-files {
    padding: 16px;
  }

  .upload-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }

  .upload-title {
    font-size: 14px;
  }

  .upload-hint {
    font-size: 11px;
  }

  .file-item {
    padding: 10px;
    gap: 10px;
  }

  .file-icon {
    width: 36px;
    height: 36px;
  }

  .file-icon .el-icon {
    font-size: 20px;
  }

  .file-name {
    font-size: 13px;
  }

  .file-size {
    font-size: 11px;
  }

  .file-list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .upload-dragger {
    border-color: #4c4d4f;
    background: #1d1e1f;
  }

  .upload-dragger:hover {
    border-color: #165dff;
    background: #1a2332;
  }

  .upload-dragger.is-dragover {
    background: #1a2840;
  }

  .upload-dragger.has-files {
    background: #141414;
  }

  .upload-title {
    color: #e5eaf3;
  }

  .upload-hint {
    color: #a8abb2;
  }

  .file-item {
    border-color: #4c4d4f;
    background: #1d1e1f;
  }

  .file-item:hover {
    border-color: #606266;
  }

  .file-item.is-uploading {
    background: #2b2416;
  }

  .file-item.is-success {
    background: #1c2518;
  }

  .file-item.is-error {
    background: #2b1d1d;
  }

  .file-name {
    color: #e5eaf3;
  }

  .file-size {
    color: #a8abb2;
  }

  .file-icon {
    background: #2b2b2b;
  }

  .file-count {
    color: #e5eaf3;
  }
}
</style>
