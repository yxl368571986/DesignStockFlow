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
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Upload as UploadIcon,
  Plus,
  Delete,
  Check,
  Close,
  Warning,
  RefreshRight
} from '@element-plus/icons-vue';
import UploadArea from '@/components/business/UploadArea.vue';
import PricingTypeSelector from '@/components/business/PricingTypeSelector.vue';
import { useUpload } from '@/composables/useUpload';
import { useConfigStore } from '@/pinia/configStore';
import { useUserStore } from '@/pinia/userStore';
import { FileStatus } from '@/components/business/UploadArea.types';
import type { UploadMetadata } from '@/types/models';
import { formatFileSize } from '@/utils/format';

/**
 * 手动修改标记 - 追踪哪些字段被用户手动修改过
 */
interface ManualOverrides {
  categoryId: boolean;
  description: boolean;
  pricingType: boolean;
  pointsCost: boolean;
}

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
  metadata: UploadMetadata & {
    pricingType: number;
    pointsCost: number;
  };
  /** 手动修改标记 - 被标记的字段不会被通用设置覆盖 */
  manualOverrides: ManualOverrides;
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
  vipLevel: 0,
  pricingType: 0,
  pointsCost: 0
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

// ========== 通用设置实时同步 ==========
// 监听通用设置变化，自动同步到未手动修改的文件
watch(() => formData.value.categoryId, (newVal) => {
  if (!isBatchMode.value) return;
  for (const file of batchFiles.value) {
    if (file.status === 'pending' && !file.manualOverrides.categoryId) {
      file.metadata.categoryId = newVal;
    }
  }
});

watch(() => formData.value.pricingType, (newVal) => {
  if (!isBatchMode.value) return;
  for (const file of batchFiles.value) {
    if (file.status === 'pending' && !file.manualOverrides.pricingType) {
      file.metadata.pricingType = newVal ?? 0;
      // 如果选择VIP专属，同步设置vipLevel
      if (newVal === 2) {
        file.metadata.vipLevel = 1;
      }
    }
  }
});

watch(() => formData.value.pointsCost, (newVal) => {
  if (!isBatchMode.value) return;
  for (const file of batchFiles.value) {
    if (file.status === 'pending' && !file.manualOverrides.pointsCost) {
      file.metadata.pointsCost = newVal ?? 0;
    }
  }
});

watch(() => formData.value.description, (newVal) => {
  if (!isBatchMode.value) return;
  for (const file of batchFiles.value) {
    if (file.status === 'pending' && !file.manualOverrides.description && newVal) {
      file.metadata.description = newVal;
    }
  }
});

/**
 * 标记文件的某个字段为手动修改
 */
function markAsManualOverride(fileId: string, field: keyof ManualOverrides) {
  const file = batchFiles.value.find(f => f.id === fileId);
  if (file) {
    file.manualOverrides[field] = true;
  }
}

/**
 * 检查文件是否有任何手动修改
 */
function hasAnyManualOverride(file: BatchUploadItem): boolean {
  return file.manualOverrides.categoryId || 
         file.manualOverrides.description || 
         file.manualOverrides.pricingType || 
         file.manualOverrides.pointsCost;
}

/**
 * 获取手动修改的字段列表（用于tooltip显示）
 */
function getManualOverrideFields(file: BatchUploadItem): string[] {
  const fields: string[] = [];
  if (file.manualOverrides.categoryId) fields.push('分类');
  if (file.manualOverrides.description) fields.push('描述');
  if (file.manualOverrides.pricingType) fields.push('定价类型');
  if (file.manualOverrides.pointsCost) fields.push('积分价格');
  return fields;
}

/**
 * 重置文件设置为通用设置
 */
function resetToCommonSettings(fileId: string) {
  const file = batchFiles.value.find(f => f.id === fileId);
  if (file && file.status === 'pending') {
    file.metadata.categoryId = formData.value.categoryId;
    file.metadata.description = formData.value.description || file.metadata.description;
    file.metadata.pricingType = formData.value.pricingType || 0;
    file.metadata.pointsCost = formData.value.pointsCost || 0;
    file.metadata.vipLevel = formData.value.vipLevel;
    file.metadata.tags = [...formData.value.tags];
    // 清除所有手动修改标记
    file.manualOverrides = {
      categoryId: false,
      description: false,
      pricingType: false,
      pointsCost: false
    };
    ElMessage.success('已重置为通用设置');
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

function toggleBatchMode(newValue: boolean) {
  // el-switch 已经自动更新了 isBatchMode 的值，这里只需要处理清理逻辑
  if (!newValue) {
    batchFiles.value = [];
    batchResult.total = 0;
    batchResult.success = 0;
    batchResult.failed = 0;
  }
}

function triggerBatchFileSelect() {
  if (batchFileInput.value) {
    batchFileInput.value.click();
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
        vipLevel: formData.value.vipLevel,
        pricingType: formData.value.pricingType || 0,
        pointsCost: formData.value.pointsCost || 0
      },
      // 新文件默认不标记为手动修改，这样通用设置变化会自动同步
      manualOverrides: {
        categoryId: false,
        description: false,
        pricingType: false,
        pointsCost: false
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
      file.metadata.pricingType = formData.value.pricingType || 0;
      file.metadata.pointsCost = formData.value.pointsCost || 0;
      if (formData.value.description) file.metadata.description = formData.value.description;
      // 清除所有手动修改标记
      file.manualOverrides = {
        categoryId: false,
        description: false,
        pricingType: false,
        pointsCost: false
      };
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
    if (result.data.isAudit === 1) {
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
  formData.value = { title: '', categoryId: '', tags: [], description: '', vipLevel: 0, pricingType: 0, pointsCost: 0 };
  uploadAreaRef.value?.clearFiles();
  formRef.value?.clearValidate();
}

function handleCancel() {
  router.back();
}

/**
 * 处理定价类型变化
 */
function handlePricingChange(pricingType: number, pointsCost: number) {
  formData.value.pricingType = pricingType;
  formData.value.pointsCost = pointsCost;
  // 如果选择VIP专属，同步设置vipLevel
  if (pricingType === 2) {
    formData.value.vipLevel = 1;
  }
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
        <!-- 操作提示 -->
        <div class="batch-tips">
          <el-alert
            title="批量上传说明"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="tips-content">
                <p>1. 点击"选择多个文件"按钮添加要上传的文件</p>
                <p>2. 在"通用设置"中设置分类、定价等信息，<strong>会自动同步到所有文件</strong></p>
                <p>3. 如需单独设置某个文件，直接修改即可（修改后不再自动同步该字段）</p>
                <p>4. 点击"应用到所有文件"可强制覆盖所有文件的设置</p>
              </div>
            </template>
          </el-alert>
        </div>

        <!-- 文件选择区域 -->
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
            @click="triggerBatchFileSelect"
          >
            选择多个文件
          </el-button>
          <span class="batch-hint">支持 PSD、AI、CDR、JPG、PNG、ZIP、RAR、7Z 格式，单个文件最大 1000MB</span>
        </div>

        <!-- 通用设置区域 -->
        <div
          v-if="batchFiles.length > 0"
          class="common-settings"
        >
          <div class="settings-header">
            <span class="settings-title">📋 通用设置（自动同步到所有文件）</span>
            <el-button
              size="small"
              type="primary"
              :disabled="isUploading"
              @click="applyCommonSettings"
            >
              强制应用到所有文件
            </el-button>
          </div>
          <div class="settings-form">
            <div class="settings-row">
              <el-form-item label="资源分类">
                <el-cascader
                  v-model="formData.categoryId"
                  :options="cascaderCategories"
                  :props="{ value: 'value', label: 'label', children: 'children', emitPath: false }"
                  placeholder="选择通用分类"
                  :disabled="isUploading"
                  clearable
                  filterable
                  style="width: 200px"
                  @change="handleCategoryChange"
                />
              </el-form-item>
              <el-form-item label="资源定价">
                <el-radio-group
                  v-model="formData.pricingType"
                  :disabled="isUploading"
                >
                  <el-radio :value="0">
                    🆓 免费
                  </el-radio>
                  <el-radio :value="1">
                    💰 付费积分
                  </el-radio>
                  <el-radio :value="2">
                    👑 VIP专属
                  </el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item
                v-if="formData.pricingType === 1"
                label="积分价格"
              >
                <el-input-number
                  v-model="formData.pointsCost"
                  :min="1"
                  :max="9999"
                  :disabled="isUploading"
                  style="width: 120px"
                />
              </el-form-item>
            </div>
            <div class="settings-row">
              <el-form-item label="通用描述">
                <el-input
                  v-model="formData.description"
                  placeholder="输入通用描述（可选，至少10字）"
                  :disabled="isUploading"
                  style="width: 400px"
                />
              </el-form-item>
            </div>
          </div>
        </div>

        <!-- 文件列表 -->
        <div
          v-if="batchFiles.length > 0"
          class="batch-file-list"
        >
          <div class="list-header">
            <span class="list-title">📁 待上传文件 ({{ batchFiles.length }})</span>
            <span
              v-if="batchResult.total > 0"
              class="batch-stats"
            >
              <el-tag
                type="success"
                size="small"
              >
                成功: {{ batchResult.success }}
              </el-tag>
              <el-tag
                type="danger"
                size="small"
              >
                失败: {{ batchResult.failed }}
              </el-tag>
            </span>
          </div>
          
          <!-- 文件卡片列表 -->
          <div
            v-for="item in batchFiles"
            :key="item.id"
            class="batch-file-card"
            :class="{
              'is-uploading': item.status === 'uploading',
              'is-success': item.status === 'success',
              'is-error': item.status === 'error'
            }"
          >
            <!-- 文件头部信息 -->
            <div class="file-header">
              <div class="file-name-row">
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
                <el-icon
                  v-else
                  class="status-icon pending"
                >
                  <UploadIcon />
                </el-icon>
                <span class="file-name-text">{{ item.name }}</span>
                <el-tag
                  size="small"
                  type="info"
                >
                  {{ formatFileSize(item.size) }}
                </el-tag>
                <!-- 手动修改标记 -->
                <el-tooltip
                  v-if="hasAnyManualOverride(item)"
                  :content="`已自定义: ${getManualOverrideFields(item).join('、')}`"
                  placement="top"
                >
                  <el-tag
                    size="small"
                    type="warning"
                    class="custom-tag"
                  >
                    已自定义
                  </el-tag>
                </el-tooltip>
                <!-- 重置按钮 -->
                <el-button
                  v-if="item.status === 'pending' && hasAnyManualOverride(item)"
                  type="info"
                  :icon="RefreshRight"
                  size="small"
                  circle
                  title="重置为通用设置"
                  @click="resetToCommonSettings(item.id)"
                />
                <el-button
                  v-if="item.status === 'pending'"
                  type="danger"
                  :icon="Delete"
                  size="small"
                  circle
                  class="delete-btn"
                  @click="removeBatchFile(item.id)"
                />
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

            <!-- 文件元数据编辑区域 -->
            <div
              v-if="item.status === 'pending'"
              class="file-metadata-form"
            >
              <div class="metadata-row">
                <div class="metadata-field">
                  <label class="field-label">
                    <span class="required">*</span> 资源标题
                  </label>
                  <el-input
                    v-model="item.metadata.title"
                    placeholder="请输入资源标题（2-100字符）"
                    maxlength="100"
                    show-word-limit
                  />
                </div>
                <div class="metadata-field">
                  <label class="field-label">
                    <span class="required">*</span> 资源分类
                    <el-tag
                      v-if="item.manualOverrides.categoryId"
                      size="small"
                      type="warning"
                      class="override-indicator"
                    >
                      已自定义
                    </el-tag>
                  </label>
                  <el-cascader
                    v-model="item.metadata.categoryId"
                    :options="cascaderCategories"
                    :props="{ value: 'value', label: 'label', children: 'children', emitPath: false }"
                    placeholder="请选择分类"
                    clearable
                    filterable
                    style="width: 100%"
                    @change="markAsManualOverride(item.id, 'categoryId')"
                  />
                </div>
              </div>
              <div class="metadata-row">
                <div class="metadata-field full-width">
                  <label class="field-label">
                    <span class="required">*</span> 资源描述
                    <el-tag
                      v-if="item.manualOverrides.description"
                      size="small"
                      type="warning"
                      class="override-indicator"
                    >
                      已自定义
                    </el-tag>
                  </label>
                  <el-input
                    v-model="item.metadata.description"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入资源描述（10-500字符）"
                    maxlength="500"
                    show-word-limit
                    @input="markAsManualOverride(item.id, 'description')"
                  />
                </div>
              </div>
              <div class="metadata-row">
                <div class="metadata-field">
                  <label class="field-label">
                    资源定价
                    <el-tag
                      v-if="item.manualOverrides.pricingType"
                      size="small"
                      type="warning"
                      class="override-indicator"
                    >
                      已自定义
                    </el-tag>
                  </label>
                  <el-radio-group
                    v-model="item.metadata.pricingType"
                    @change="markAsManualOverride(item.id, 'pricingType')"
                  >
                    <el-radio :value="0">
                      🆓 免费
                    </el-radio>
                    <el-radio :value="1">
                      💰 付费积分
                    </el-radio>
                    <el-radio :value="2">
                      👑 VIP专属
                    </el-radio>
                  </el-radio-group>
                </div>
                <div
                  v-if="item.metadata.pricingType === 1"
                  class="metadata-field"
                >
                  <label class="field-label">
                    积分价格
                    <el-tag
                      v-if="item.manualOverrides.pointsCost"
                      size="small"
                      type="warning"
                      class="override-indicator"
                    >
                      已自定义
                    </el-tag>
                  </label>
                  <el-input-number
                    v-model="item.metadata.pointsCost"
                    :min="1"
                    :max="9999"
                    style="width: 150px"
                    @change="markAsManualOverride(item.id, 'pointsCost')"
                  />
                </div>
              </div>
            </div>

            <!-- 上传进度 -->
            <div
              v-if="item.status === 'uploading'"
              class="file-progress"
            >
              <el-progress
                :percentage="uploadProgress"
                :stroke-width="8"
                status="success"
              />
              <div class="progress-info">
                <span>上传中...</span>
                <span>{{ formattedSpeed }}</span>
              </div>
            </div>

            <!-- 上传成功状态 -->
            <div
              v-if="item.status === 'success'"
              class="file-success-info"
            >
              <el-icon class="success-icon">
                <Check />
              </el-icon>
              <span>上传成功，等待审核</span>
            </div>
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div
          v-if="batchFiles.length > 0"
          class="batch-actions"
        >
          <el-button
            size="large"
            :disabled="isUploading"
            @click="batchFiles = []; batchResult.total = 0; batchResult.success = 0; batchResult.failed = 0;"
          >
            清空列表
          </el-button>
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

        <!-- 空状态提示 -->
        <div
          v-if="batchFiles.length === 0"
          class="empty-state"
        >
          <el-empty description="请点击上方按钮选择要上传的文件" />
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
            <el-form-item label="资源定价">
              <PricingTypeSelector
                v-model:pricing-type="formData.pricingType"
                v-model:points-cost="formData.pointsCost"
                :disabled="isUploading"
                @change="handlePricingChange"
              />
              <div class="form-hint">
                免费资源所有用户可下载；付费积分资源需消耗积分；VIP专属仅VIP用户可下载
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

.batch-tips {
  margin-bottom: 20px;
}

.tips-content {
  line-height: 1.8;
}

.tips-content p {
  margin: 0;
  font-size: 13px;
}

.batch-file-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
}

.batch-hint {
  font-size: 14px;
  color: #909399;
}

.common-settings {
  margin-bottom: 24px;
  padding: 20px;
  border-radius: 8px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.settings-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: flex-end;
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
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.batch-stats {
  display: flex;
  gap: 8px;
}

.batch-file-card {
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.batch-file-card:hover {
  border-color: #c0c4cc;
}

.batch-file-card.is-uploading {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.batch-file-card.is-success {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.batch-file-card.is-error {
  background: #fff2f0;
  border-color: #ffccc7;
}

.file-header {
  margin-bottom: 12px;
}

.file-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-name-text {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  margin-left: auto;
}

.file-error {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #f56c6c;
}

.status-icon {
  font-size: 18px;
}

.status-icon.success {
  color: #67c23a;
}

.status-icon.error {
  color: #f56c6c;
}

.status-icon.pending {
  color: #909399;
}

.status-icon.uploading {
  color: #409eff;
  animation: spin 1s linear infinite;
}

.custom-tag {
  margin-left: 8px;
}

.override-indicator {
  margin-left: 8px;
  font-weight: normal;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.file-metadata-form {
  padding: 16px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.metadata-row {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.metadata-row:last-child {
  margin-bottom: 0;
}

.metadata-field {
  flex: 1;
  min-width: 200px;
}

.metadata-field.full-width {
  flex: 1 1 100%;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.field-label .required {
  color: #f56c6c;
  margin-right: 4px;
}

.file-progress {
  padding: 12px 16px;
  background: #fff;
  border-radius: 6px;
}

.file-progress .progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.file-success-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0f9eb;
  border-radius: 6px;
  color: #67c23a;
  font-size: 14px;
}

.file-success-info .success-icon {
  font-size: 20px;
}

.batch-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.empty-state {
  padding: 40px 0;
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
