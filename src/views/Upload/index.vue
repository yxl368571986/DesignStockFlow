<!--
  上传页面
  
  功能：
  - 文件上传区域（UploadArea组件）
  - 元信息表单（标题、分类、标签、描述、VIP等级）
  - 分类选择器（支持一级/二级分类选择，级联下拉）
  - 标签输入（支持多标签，回车添加）
  - 上传按钮和进度显示
  - 使用useUpload组合式函数
  - 支持批量上传多个文件
  
  需求: 需求5.1-5.5（文件上传）、需求16.28（分类选择）
-->

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Upload as UploadIcon,
  Plus,
  Delete,
  Check,
  Close,
  Warning
} from '@element-plus/icons-vue';
import UploadArea from '@/components/business/UploadArea.vue';
import { useUpload } from '@/composables/useUpload';
import { useConfigStore } from '@/pinia/configStore';
import { useUserStore } from '@/pinia/userStore';
import { FileStatus } from '@/components/business/UploadArea.types';
import type { UploadMetadata } from '@/types/models';

/**
 * 批量上传文件项
 */
interface BatchUploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  metadata: UploadMetadata;
}

const router = useRouter();
const configStore = useConfigStore();
const userStore = useUserStore();
const {
  handleFileUpload,
  uploadProgress,
  isUploading,
  uploadSpeed,
  remainingTime
} = useUpload();

// ========== 状态 ==========
const uploadAreaRef = ref<InstanceType<typeof UploadArea> | null>(null);
const isBatchMode = ref(false);
const batchFiles = ref<BatchUploadItem[]>([]);
const currentUploadIndex = ref(-1);
const batchResult = reactive({ total: 0, success: 0, failed: 0 });
const batchFileInput = ref<HTMLInputElement | null>(null);

const formData = ref<UploadMetadata>({
  title: '',
  categoryId: '',
  tags: [],
  description: '',
  vipLevel: 0
});

const currentTag = ref('');
const showTagInput = ref(false);
const tagInputRef = ref<HTMLInputElement | null>(null);
const formRef = ref<InstanceType<typeof import('element-plus')['ElForm']> | null>(null);

const formRules = {
  title: [
    { required: true, message: '请输入资源标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  categoryId: [{ required: true, message: '请选择资源分类', trigger: 'change' }],
  description: [
    { required: true, message: '请输入资源描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述长度在 10 到 500 个字符', trigger: 'blur' }
  ]
};

// ========== 计算属性 ==========
const canSubmit = computed(() => {
  if (isBatchMode.value) {
    return batchFiles.value.some((f) => f.status === 'pending') && !isUploading.value;
  }
  const files = uploadAreaRef.value?.getFiles();
  const hasFile = files && files.length > 0;
  const hasRequiredFields =
    formData.value.title.trim() !== '' &&
    formData.value.categoryId !== '' &&
    formData.value.description.trim() !== '';
  return hasFile && hasRequiredFields && !isUploading.value;
});

const cascaderCategories = computed(() => {
  return configStore.primaryCategories.map((primary) => {
    const subCategories = configStore.getSubCategories(primary.categoryId);
    return {
      value: primary.categoryId,
      label: primary.categoryName,
      disabled: subCategories.length > 0,
      children:
        subCategories.length > 0
          ? subCategories.map((sub) => ({
              value: sub.categoryId,
              label: sub.categoryName,
              resourceCount: sub.resourceCount
            }))
          : undefined
    };
  });
});

const formattedSpeed = computed(() => {
  const speed = uploadSpeed.value;
  if (speed === 0) return '0 KB/s';
  if (speed < 1024) return `${speed.toFixed(0)} B/s`;
  if (speed < 1024 * 1024) return `${(speed / 1024).toFixed(2)} KB/s`;
  return `${(speed / (1024 * 1024)).toFixed(2)} MB/s`;
});

const formattedRemainingTime = computed(() => {
  const time = remainingTime.value;
  if (time === 0) return '计算中...';
  if (time < 60) return `${time} 秒`;
  if (time < 3600) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes} 分 ${seconds} 秒`;
  }
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  return `${hours} 小时 ${minutes} 分`;
});

// ========== 方法 ==========
function handleCategoryChange(value: string | string[] | null) {
  if (Array.isArray(value)) {
    formData.value.categoryId = value[value.length - 1];
  } else if (value) {
    formData.value.categoryId = value;
  } else {
    formData.value.categoryId = '';
  }
}

function showTagInputBox() {
  showTagInput.value = true;
  setTimeout(() => tagInputRef.value?.focus(), 0);
}

function hideTagInputBox() {
  showTagInput.value = false;
  currentTag.value = '';
}

function addTag() {
  const tag = currentTag.value.trim();
  if (!tag) {
    hideTagInputBox();
    return;
  }
  if (formData.value.tags.includes(tag)) {
    ElMessage.warning('标签已存在');
    currentTag.value = '';
    return;
  }
  if (formData.value.tags.length >= 10) {
    ElMessage.warning('最多添加 10 个标签');
    hideTagInputBox();
    return;
  }
  if (tag.length > 20) {
    ElMessage.warning('标签长度不能超过 20 个字符');
    return;
  }
  formData.value.tags.push(tag);
  currentTag.value = '';
  tagInputRef.value?.focus();
}

function removeTag(tag: string) {
  const index = formData.value.tags.indexOf(tag);
  if (index !== -1) formData.value.tags.splice(index, 1);
}

function handleTagInputEnter() {
  addTag();
}

function handleTagInputBlur() {
  addTag();
  hideTagInputBox();
}

function toggleBatchMode() {
  isBatchMode.value = !isBatchMode.value;
  if (!isBatchMode.value) {
    batchFiles.value = [];
    batchResult.total = 0;
    batchResult.success = 0;
    batchResult.failed = 0;
  }
}

function handleBatchFilesSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const files = Array.from(input.files);
  for (const file of files) {
    if (batchFiles.value.some((f) => f.name === file.name && f.size === file.size)) continue;
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    batchFiles.value.push({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
      metadata: {
        title: nameWithoutExt,
        categoryId: formData.value.categoryId || '',
        tags: [...formData.value.tags],
        description: formData.value.description || `${nameWithoutExt} 设计资源`,
        vipLevel: formData.value.vipLevel
      }
    });
  }
  input.value = '';
}

function removeBatchFile(id: string) {
  const index = batchFiles.value.findIndex((f) => f.id === id);
  if (index !== -1) batchFiles.value.splice(index, 1);
}

function applyCommonSettings() {
  for (const file of batchFiles.value) {
    if (file.status === 'pending') {
      file.metadata.categoryId = formData.value.categoryId;
      file.metadata.tags = [...formData.value.tags];
      file.metadata.vipLevel = formData.value.vipLevel;
      if (formData.value.description) file.metadata.description = formData.value.description;
    }
  }
  ElMessage.success('已应用通用设置到所有待上传文件');
}

async function handleBatchUpload() {
  const pendingFiles = batchFiles.value.filter((f) => f.status === 'pending');
  if (pendingFiles.length === 0) {
    ElMessage.warning('没有待上传的文件');
    return;
  }
  for (const file of pendingFiles) {
    if (!file.metadata.title.trim()) {
      ElMessage.error(`文件 "${file.name}" 缺少标题`);
      return;
    }
    if (!file.metadata.categoryId) {
      ElMessage.error(`文件 "${file.name}" 缺少分类`);
      return;
    }
    if (!file.metadata.description.trim() || file.metadata.description.length < 10) {
      ElMessage.error(`文件 "${file.name}" 描述不能少于10个字符`);
      return;
    }
  }
  try {
    await ElMessageBox.confirm(`确认上传 ${pendingFiles.length} 个文件吗？`, '批量上传确认', {
      confirmButtonText: '确认上传',
      cancelButtonText: '取消',
      type: 'info'
    });
  } catch {
    return;
  }
  batchResult.total = pendingFiles.length;
  batchResult.success = 0;
  batchResult.failed = 0;
  for (let i = 0; i < pendingFiles.length; i++) {
    const fileItem = pendingFiles[i];
    currentUploadIndex.value = batchFiles.value.findIndex((f) => f.id === fileItem.id);
    fileItem.status = 'uploading';
    fileItem.progress = 0;
    try {
      const result = await handleFileUpload(fileItem.file, fileItem.metadata);
      if (result.success) {
        fileItem.status = 'success';
        fileItem.progress = 100;
        batchResult.success++;
      } else {
        fileItem.status = 'error';
        fileItem.error = result.error || '上传失败';
        batchResult.failed++;
      }
    } catch (e) {
      fileItem.status = 'error';
      fileItem.error = (e as Error).message || '上传失败';
      batchResult.failed++;
    }
  }
  currentUploadIndex.value = -1;
  if (batchResult.failed === 0) {
    ElMessage.success(`全部 ${batchResult.success} 个文件上传成功！`);
  } else if (batchResult.success === 0) {
    ElMessage.error(`全部 ${batchResult.failed} 个文件上传失败`);
  } else {
    ElMessage.warning(`上传完成：${batchResult.success} 个成功，${batchResult.failed} 个失败`);
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

async function handleSubmit() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    ElMessage.error('请完善表单信息');
    return;
  }
  const pendingFiles = uploadAreaRef.value?.getPendingFiles();
  if (!pendingFiles || pendingFiles.length === 0) {
    ElMessage.warning('请先选择要上传的文件');
    return;
  }
  const fileItem = pendingFiles[0];
  try {
    await ElMessageBox.confirm(`确认上传文件"${fileItem.name}"吗？`, '确认上传', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    });
  } catch {
    return;
  }
  uploadAreaRef.value?.updateFileStatus(fileItem.id, FileStatus.UPLOADING, 0);
  const result = await handleFileUpload(fileItem.file, formData.value);
  if (result.success && result.data) {
    uploadAreaRef.value?.updateFileStatus(fileItem.id, FileStatus.SUCCESS, 100);
    // 根据审核状态显示不同提示
    if (result.data.auditStatus === 1) {
      ElMessage.success('上传成功！资源已通过审核');
    } else {
      ElMessage.success('上传成功！资源正在审核中，审核通过后将展示在首页');
    }
    // 跳转到首页而不是资源详情页
    setTimeout(() => router.push('/'), 1500);
  } else {
    uploadAreaRef.value?.updateFileStatus(fileItem.id, FileStatus.ERROR, 0, result.error);
    ElMessage.error(result.error || '上传失败');
  }
}

function resetForm() {
  formData.value = { title: '', categoryId: '', tags: [], description: '', vipLevel: 0 };
  uploadAreaRef.value?.clearFiles();
  formRef.value?.clearValidate();
}

function handleCancel() {
  router.back();
}

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录');
    router.push('/login');
    return;
  }
  if (configStore.categories.length === 0) {
    try {
      await configStore.fetchCategories();
    } catch {
      ElMessage.error('加载分类数据失败');
    }
  }
});
</script>

<template>
  <div class="upload-page">
    <div class="upload-container">
      <div class="page-header">
        <h1 class="page-title">
          <el-icon :size="28">
            <UploadIcon />
          </el-icon>
          <span>上传资源</span>
        </h1>
        <p class="page-subtitle">
          分享您的设计作品，让更多人看到您的创意
        </p>
        <div class="mode-switch">
          <el-switch
            v-model="isBatchMode"
            active-text="批量上传"
            inactive-text="单文件上传"
            :disabled="isUploading"
            @change="toggleBatchMode"
          />
        </div>
      </div>

      <!-- 批量上传模式 -->
      <div
        v-if="isBatchMode"
        class="batch-upload-section"
      >
        <div class="batch-file-selector">
          <input
            ref="batchFileInput"
            type="file"
            multiple
            accept=".psd,.ai,.cdr,.jpg,.jpeg,.png,.zip,.rar,.7z"
            style="display: none"
            @change="handleBatchFilesSelect"
          >
          <el-button
            type="primary"
            size="large"
            :icon="Plus"
            :disabled="isUploading"
            @click="batchFileInput?.click()"
          >
            选择多个文件
          </el-button>
          <span class="batch-hint">支持 PSD、AI、CDR、JPG、PNG、ZIP、RAR、7Z 格式</span>
        </div>

        <div
          v-if="batchFiles.length > 0"
          class="common-settings"
        >
          <div class="settings-header">
            <span class="settings-title">通用设置</span>
            <el-button
              size="small"
              type="primary"
              :disabled="isUploading"
              @click="applyCommonSettings"
            >
              应用到所有文件
            </el-button>
          </div>
          <div class="settings-form">
            <el-form-item label="分类">
              <el-cascader
                v-model="formData.categoryId"
                :options="cascaderCategories"
                :props="{ value: 'value', label: 'label', children: 'children', emitPath: false }"
                placeholder="选择通用分类"
                :disabled="isUploading"
                clearable
                filterable
                size="small"
                @change="handleCategoryChange"
              />
            </el-form-item>
            <el-form-item label="VIP等级">
              <el-radio-group
                v-model="formData.vipLevel"
                :disabled="isUploading"
                size="small"
              >
                <el-radio :value="0">
                  免费
                </el-radio>
                <el-radio :value="1">
                  VIP
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </div>
        </div>

        <div
          v-if="batchFiles.length > 0"
          class="batch-file-list"
        >
          <div class="list-header">
            <span>待上传文件 ({{ batchFiles.length }})</span>
            <span
              v-if="batchResult.total > 0"
              class="batch-stats"
            >
              成功: {{ batchResult.success }} / 失败: {{ batchResult.failed }}
            </span>
          </div>
          <div
            v-for="item in batchFiles"
            :key="item.id"
            class="batch-file-item"
            :class="{
              'is-uploading': item.status === 'uploading',
              'is-success': item.status === 'success',
              'is-error': item.status === 'error'
            }"
          >
            <div class="file-info">
              <div class="file-name">
                <el-icon
                  v-if="item.status === 'success'"
                  class="status-icon success"
                >
                  <Check />
                </el-icon>
                <el-icon
                  v-else-if="item.status === 'error'"
                  class="status-icon error"
                >
                  <Close />
                </el-icon>
                <el-icon
                  v-else-if="item.status === 'uploading'"
                  class="status-icon uploading"
                >
                  <UploadIcon />
                </el-icon>
                <span>{{ item.name }}</span>
                <span class="file-size">({{ formatFileSize(item.size) }})</span>
              </div>
              <div
                v-if="item.error"
                class="file-error"
              >
                <el-icon>
                  <Warning />
                </el-icon>
                {{ item.error }}
              </div>
            </div>
            <div
              v-if="item.status === 'pending'"
              class="file-metadata"
            >
              <el-input
                v-model="item.metadata.title"
                placeholder="标题"
                size="small"
                class="metadata-input"
              />
              <el-cascader
                v-model="item.metadata.categoryId"
                :options="cascaderCategories"
                :props="{ value: 'value', label: 'label', children: 'children', emitPath: false }"
                placeholder="分类"
                size="small"
                class="metadata-cascader"
              />
              <el-input
                v-model="item.metadata.description"
                placeholder="描述（至少10字）"
                size="small"
                class="metadata-input description"
              />
            </div>
            <div
              v-if="item.status === 'uploading'"
              class="file-progress"
            >
              <el-progress
                :percentage="uploadProgress"
                :stroke-width="6"
                :show-text="false"
              />
            </div>
            <el-button
              v-if="item.status === 'pending'"
              type="danger"
              :icon="Delete"
              size="small"
              circle
              @click="removeBatchFile(item.id)"
            />
          </div>
        </div>

        <div
          v-if="batchFiles.length > 0"
          class="batch-actions"
        >
          <el-button
            type="primary"
            size="large"
            :loading="isUploading"
            :disabled="!canSubmit"
            @click="handleBatchUpload"
          >
            {{ isUploading ? '上传中...' : `开始上传 (${batchFiles.filter((f: BatchUploadItem) => f.status === 'pending').length} 个文件)` }}
          </el-button>
        </div>
      </div>

      <!-- 单文件上传模式 -->
      <div
        v-else
        class="upload-form"
      >
        <div class="upload-left">
          <div class="section-title">
            选择文件
          </div>
          <UploadArea
            ref="uploadAreaRef"
            :multiple="false"
            :auto-upload="false"
            :disabled="isUploading"
          />
          <div
            v-if="isUploading"
            class="upload-progress-section"
          >
            <div class="progress-header">
              <span class="progress-title">上传中...</span>
              <span class="progress-percentage">{{ uploadProgress }}%</span>
            </div>
            <el-progress
              :percentage="uploadProgress"
              :stroke-width="12"
              :show-text="false"
              status="success"
            />
            <div class="progress-info">
              <span class="progress-speed">速度: {{ formattedSpeed }}</span>
              <span class="progress-time">剩余: {{ formattedRemainingTime }}</span>
            </div>
          </div>
        </div>

        <div class="upload-right">
          <div class="section-title">
            资源信息
          </div>
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="80px"
            label-position="top"
            class="metadata-form"
          >
            <el-form-item
              label="资源标题"
              prop="title"
            >
              <el-input
                v-model="formData.title"
                placeholder="请输入资源标题（2-100个字符）"
                :disabled="isUploading"
                maxlength="100"
                show-word-limit
                clearable
              />
            </el-form-item>
            <el-form-item
              label="资源分类"
              prop="categoryId"
            >
              <el-cascader
                v-model="formData.categoryId"
                :options="cascaderCategories"
                :props="{ value: 'value', label: 'label', children: 'children', emitPath: false }"
                placeholder="请选择资源分类"
                :disabled="isUploading"
                clearable
                filterable
                class="full-width"
                @change="handleCategoryChange"
              />
            </el-form-item>
            <el-form-item label="资源标签">
              <div class="tags-container">
                <el-tag
                  v-for="tag in formData.tags"
                  :key="tag"
                  closable
                  :disable-transitions="false"
                  class="tag-item"
                  @close="removeTag(tag)"
                >
                  {{ tag }}
                </el-tag>
                <el-input
                  v-if="showTagInput"
                  ref="tagInputRef"
                  v-model="currentTag"
                  size="small"
                  class="tag-input"
                  placeholder="输入标签"
                  maxlength="20"
                  @keyup.enter="handleTagInputEnter"
                  @blur="handleTagInputBlur"
                />
                <el-button
                  v-else
                  size="small"
                  :icon="Plus"
                  :disabled="isUploading || formData.tags.length >= 10"
                  class="add-tag-button"
                  @click="showTagInputBox"
                >
                  添加标签
                </el-button>
              </div>
              <div class="form-hint">
                最多添加 10 个标签，每个标签不超过 20 个字符
              </div>
            </el-form-item>
            <el-form-item
              label="资源描述"
              prop="description"
            >
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="6"
                placeholder="请详细描述资源内容、适用场景、设计理念等（10-500个字符）"
                :disabled="isUploading"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="VIP等级">
              <el-radio-group
                v-model="formData.vipLevel"
                :disabled="isUploading"
              >
                <el-radio :value="0">
                  免费资源
                </el-radio>
                <el-radio :value="1">
                  VIP专属
                </el-radio>
              </el-radio-group>
              <div class="form-hint">
                VIP专属资源只有VIP用户才能下载
              </div>
            </el-form-item>
            <el-form-item class="form-actions">
              <el-button
                type="primary"
                size="large"
                :loading="isUploading"
                :disabled="!canSubmit"
                class="submit-button"
                @click="handleSubmit"
              >
                {{ isUploading ? '上传中...' : '开始上传' }}
              </el-button>
              <el-button
                size="large"
                :disabled="isUploading"
                class="cancel-button"
                @click="handleCancel"
              >
                取消
              </el-button>
              <el-button
                size="large"
                :disabled="isUploading"
                class="reset-button"
                @click="resetForm"
              >
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.upload-page {
  min-height: 100vh;
  padding: 24px;
  background: #f5f7fa;
}

.upload-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
  text-align: center;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  margin: 0;
  font-size: 16px;
  color: #909399;
}

.mode-switch {
  margin-top: 16px;
}

.upload-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.upload-left,
.upload-right {
  padding: 24px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.upload-progress-section {
  margin-top: 24px;
  padding: 20px;
  border-radius: 8px;
  background: #f5f8ff;
  border: 1px solid #d9ecff;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.progress-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.progress-percentage {
  font-size: 16px;
  font-weight: 600;
  color: #165dff;
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}

.metadata-form {
  margin-top: 0;
}

.metadata-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}

.full-width {
  width: 100%;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-item {
  margin: 0;
}

.tag-input {
  width: 120px;
}

.add-tag-button {
  height: 28px;
  padding: 0 12px;
}

.form-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.form-actions {
  margin-top: 32px;
}

.form-actions :deep(.el-form-item__content) {
  display: flex;
  gap: 12px;
}

.submit-button {
  flex: 1;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.cancel-button,
.reset-button {
  height: 48px;
  font-size: 16px;
}

.batch-upload-section {
  padding: 24px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.batch-file-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.batch-hint {
  font-size: 14px;
  color: #909399;
}

.common-settings {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 8px;
  background: #f5f7fa;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.settings-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.settings-form {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.settings-form .el-form-item {
  margin-bottom: 0;
}

.batch-file-list {
  margin-bottom: 24px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.batch-stats {
  font-size: 12px;
  color: #909399;
}

.batch-file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #f5f7fa;
  transition: all 0.3s;
}

.batch-file-item.is-uploading {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
}

.batch-file-item.is-success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.batch-file-item.is-error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

.file-info {
  flex: 0 0 200px;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #303133;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.file-error {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: #f56c6c;
}

.status-icon {
  font-size: 16px;
}

.status-icon.success {
  color: #67c23a;
}

.status-icon.error {
  color: #f56c6c;
}

.status-icon.uploading {
  color: #409eff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.file-metadata {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
}

.metadata-input {
  width: 150px;
}

.metadata-input.description {
  width: 200px;
}

.metadata-cascader {
  width: 150px;
}

.file-progress {
  flex: 1;
  max-width: 200px;
}

.batch-actions {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}

@media (max-width: 1200px) {
  .upload-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .upload-page {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .upload-left,
  .upload-right {
    padding: 16px;
  }

  .form-actions :deep(.el-form-item__content) {
    flex-direction: column;
  }

  .submit-button,
  .cancel-button,
  .reset-button {
    width: 100%;
  }

  .batch-file-selector {
    flex-direction: column;
    align-items: flex-start;
  }

  .batch-file-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .file-info {
    flex: none;
    width: 100%;
  }

  .file-metadata {
    flex-direction: column;
    width: 100%;
  }

  .metadata-input,
  .metadata-input.description,
  .metadata-cascader {
    width: 100%;
  }

  .file-progress {
    width: 100%;
    max-width: none;
  }
}
</style>
