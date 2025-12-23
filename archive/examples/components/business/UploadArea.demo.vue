<!--
  UploadArea 组件演示
  展示上传区域组件的各种用法
-->

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import UploadArea from './UploadArea.vue';
import { FileStatus } from './UploadArea.types';

// 单文件上传示例
const singleUploadRef = ref<InstanceType<typeof UploadArea> | null>(null);

// 多文件上传示例
const multipleUploadRef = ref<InstanceType<typeof UploadArea> | null>(null);

// 模拟上传状态
const isUploading = ref(false);

// 计算属性：是否有待上传文件
const hasPendingFiles = computed(() => {
  const files = multipleUploadRef.value?.getPendingFiles();
  return files && files.length > 0;
});

// 处理文件添加
function handleFileAdd(file: File) {
  console.log('文件已添加:', file.name);
  ElMessage.success(`已添加文件：${file.name}`);
}

// 处理文件移除
function handleFileRemove(fileId: string) {
  console.log('文件已移除:', fileId);
}

// 处理文件列表变化
function handleFilesChange(files: any[]) {
  console.log('文件列表已更新，当前文件数:', files.length);
}

// 模拟上传
async function handleMockUpload() {
  const files = multipleUploadRef.value?.getPendingFiles();

  if (!files || files.length === 0) {
    ElMessage.warning('请先选择文件');
    return;
  }

  isUploading.value = true;

  for (const fileItem of files) {
    // 更新状态为上传中
    multipleUploadRef.value?.updateFileStatus(fileItem.id, FileStatus.UPLOADING, 0);

    // 模拟上传进度
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      multipleUploadRef.value?.updateFileStatus(fileItem.id, FileStatus.UPLOADING, progress);
    }

    // 随机成功或失败
    const isSuccess = Math.random() > 0.2;

    if (isSuccess) {
      multipleUploadRef.value?.updateFileStatus(fileItem.id, FileStatus.SUCCESS, 100);
      ElMessage.success(`${fileItem.name} 上传成功`);
    } else {
      multipleUploadRef.value?.updateFileStatus(
        fileItem.id,
        FileStatus.ERROR,
        0,
        '上传失败：网络错误'
      );
      ElMessage.error(`${fileItem.name} 上传失败`);
    }
  }

  isUploading.value = false;
  ElMessage.success('所有文件上传完成');
}

// 清空文件列表
function handleClearFiles() {
  multipleUploadRef.value?.clearFiles();
  ElMessage.success('已清空文件列表');
}
</script>

<template>
  <div class="upload-demo">
    <h1>UploadArea 上传区域组件演示</h1>

    <!-- 基础用法 -->
    <section class="demo-section">
      <h2>基础用法</h2>
      <p class="demo-desc">
        单文件上传，点击或拖拽文件到区域内
      </p>

      <UploadArea
        ref="singleUploadRef"
        @file-add="handleFileAdd"
        @file-remove="handleFileRemove"
        @files-change="handleFilesChange"
      />
    </section>

    <!-- 多文件上传 -->
    <section class="demo-section">
      <h2>多文件上传</h2>
      <p class="demo-desc">
        支持同时选择多个文件，最多5个
      </p>

      <UploadArea
        ref="multipleUploadRef"
        multiple
        :max-files="5"
        @file-add="handleFileAdd"
        @file-remove="handleFileRemove"
        @files-change="handleFilesChange"
      />

      <div class="demo-actions">
        <el-button
          type="primary"
          :loading="isUploading"
          :disabled="!hasPendingFiles"
          @click="handleMockUpload"
        >
          开始上传
        </el-button>

        <el-button
          :disabled="isUploading"
          @click="handleClearFiles"
        >
          清空列表
        </el-button>
      </div>
    </section>

    <!-- 禁用状态 -->
    <section class="demo-section">
      <h2>禁用状态</h2>
      <p class="demo-desc">
        禁用上传功能
      </p>

      <UploadArea disabled />
    </section>

    <!-- 使用说明 -->
    <section class="demo-section">
      <h2>使用说明</h2>

      <el-alert
        title="支持的文件格式"
        type="info"
        :closable="false"
        show-icon
      >
        <p>PSD, AI, CDR, EPS, SKETCH, XD, FIGMA, SVG, PNG, JPG, JPEG, WEBP</p>
      </el-alert>

      <el-alert
        title="文件大小限制"
        type="warning"
        :closable="false"
        show-icon
        style="margin-top: 12px"
      >
        <p>单个文件最大 1000MB</p>
        <p>超过 100MB 的文件会自动使用分片上传</p>
      </el-alert>

      <el-alert
        title="上传方式"
        type="success"
        :closable="false"
        show-icon
        style="margin-top: 12px"
      >
        <ul style="margin: 0; padding-left: 20px">
          <li>点击上传区域选择文件</li>
          <li>拖拽文件到上传区域</li>
          <li>支持多文件同时上传</li>
        </ul>
      </el-alert>
    </section>

    <!-- 功能特性 -->
    <section class="demo-section">
      <h2>功能特性</h2>

      <el-descriptions
        :column="1"
        border
      >
        <el-descriptions-item label="文件验证">
          自动验证文件格式、大小和MIME类型
        </el-descriptions-item>
        <el-descriptions-item label="拖拽上传">
          支持拖拽文件到上传区域
        </el-descriptions-item>
        <el-descriptions-item label="进度显示">
          每个文件独立显示上传进度
        </el-descriptions-item>
        <el-descriptions-item label="状态管理">
          等待、上传中、成功、失败四种状态
        </el-descriptions-item>
        <el-descriptions-item label="文件管理">
          支持删除文件、清空列表
        </el-descriptions-item>
        <el-descriptions-item label="响应式设计">
          适配移动端和桌面端
        </el-descriptions-item>
      </el-descriptions>
    </section>
  </div>
</template>

<style scoped>
.upload-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  margin: 0 0 32px 0;
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  text-align: center;
}

.demo-section {
  margin-bottom: 48px;
  padding: 24px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
}

.demo-section h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.demo-desc {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #606266;
}

.demo-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .upload-demo {
    padding: 20px 12px;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 24px;
  }

  .demo-section {
    padding: 16px;
    margin-bottom: 24px;
  }

  .demo-section h2 {
    font-size: 18px;
  }

  .demo-actions {
    flex-direction: column;
  }

  .demo-actions .el-button {
    width: 100%;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .upload-demo {
    background: #141414;
  }

  h1 {
    color: #e5eaf3;
  }

  .demo-section {
    border-color: #4c4d4f;
    background: #1d1e1f;
  }

  .demo-section h2 {
    color: #e5eaf3;
  }

  .demo-desc {
    color: #a8abb2;
  }
}
</style>
