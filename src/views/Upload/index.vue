<!--
  上传页面
  
  功能：
  - 文件上传区域（UploadArea组件）
  - 元信息表单（标题、分类、标签、描述、VIP等级）
  - 分类选择器（支持一级/二级分类选择，级联下拉）
  - 标签输入（支持多标签，回车添加）
  - 上传按钮和进度显示
  - 使用useUpload组合式函数
  
  需求: 需求5.1-5.5（文件上传）、需求16.28（分类选择）
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload as UploadIcon, Plus } from '@element-plus/icons-vue';
import UploadArea from '@/components/business/UploadArea.vue';
import { useUpload } from '@/composables/useUpload';
import { useConfigStore } from '@/pinia/configStore';
import { useUserStore } from '@/pinia/userStore';
import { FileStatus } from '@/components/business/UploadArea.types';
import type { UploadMetadata } from '@/types/models';

/**
 * 上传页面
 */

const router = useRouter();
const configStore = useConfigStore();
const userStore = useUserStore();
const { handleFileUpload, uploadProgress, isUploading, uploadSpeed, remainingTime } = useUpload();

// ========== 状态 ==========

/** 上传区域组件引用 */
const uploadAreaRef = ref<InstanceType<typeof UploadArea> | null>(null);

/** 表单数据 */
const formData = ref<UploadMetadata>({
  title: '',
  categoryId: '',
  tags: [],
  description: '',
  vipLevel: 0
});

/** 当前输入的标签 */
const currentTag = ref('');

/** 是否显示标签输入框 */
const showTagInput = ref(false);

/** 标签输入框引用 */
const tagInputRef = ref<HTMLInputElement | null>(null);

/** 表单验证规则 */
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

/** 表单引用 */
const formRef = ref<any>(null);

// ========== 计算属性 ==========

/** 是否可以提交 */
const canSubmit = computed(() => {
  // 必须有文件
  const files = uploadAreaRef.value?.getFiles();
  const hasFile = files && files.length > 0;

  // 必须填写标题、分类、描述
  const hasRequiredFields =
    formData.value.title.trim() !== '' &&
    formData.value.categoryId !== '' &&
    formData.value.description.trim() !== '';

  // 不能正在上传
  const notUploading = !isUploading.value;

  return hasFile && hasRequiredFields && notUploading;
});

/** 级联分类选项（包含一级和二级分类） */
const cascaderCategories = computed(() => {
  // 构建级联选择器的数据结构
  return configStore.primaryCategories.map((primary) => {
    const subCategories = configStore.getSubCategories(primary.categoryId);

    return {
      value: primary.categoryId,
      label: primary.categoryName,
      disabled: subCategories.length > 0, // 如果有子分类，禁用父分类选择
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

/** 格式化上传速度 */
const formattedSpeed = computed(() => {
  const speed = uploadSpeed.value;
  if (speed === 0) return '0 KB/s';

  if (speed < 1024) {
    return `${speed.toFixed(0)} B/s`;
  } else if (speed < 1024 * 1024) {
    return `${(speed / 1024).toFixed(2)} KB/s`;
  } else {
    return `${(speed / (1024 * 1024)).toFixed(2)} MB/s`;
  }
});

/** 格式化剩余时间 */
const formattedRemainingTime = computed(() => {
  const time = remainingTime.value;
  if (time === 0) return '计算中...';

  if (time < 60) {
    return `${time} 秒`;
  } else if (time < 3600) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes} 分 ${seconds} 秒`;
  } else {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    return `${hours} 小时 ${minutes} 分`;
  }
});

// ========== 方法 ==========

/**
 * 处理分类变化
 */
function handleCategoryChange(value: string | string[] | null) {
  // 级联选择器返回的是数组，取最后一个值（叶子节点）
  if (Array.isArray(value)) {
    formData.value.categoryId = value[value.length - 1];
  } else if (value) {
    formData.value.categoryId = value;
  } else {
    formData.value.categoryId = '';
  }
}

/**
 * 显示标签输入框
 */
function showTagInputBox() {
  showTagInput.value = true;
  // 下一帧聚焦输入框
  setTimeout(() => {
    tagInputRef.value?.focus();
  }, 0);
}

/**
 * 隐藏标签输入框
 */
function hideTagInputBox() {
  showTagInput.value = false;
  currentTag.value = '';
}

/**
 * 添加标签
 */
function addTag() {
  const tag = currentTag.value.trim();

  if (!tag) {
    hideTagInputBox();
    return;
  }

  // 检查标签是否已存在
  if (formData.value.tags.includes(tag)) {
    ElMessage.warning('标签已存在');
    currentTag.value = '';
    return;
  }

  // 检查标签数量限制
  if (formData.value.tags.length >= 10) {
    ElMessage.warning('最多添加 10 个标签');
    hideTagInputBox();
    return;
  }

  // 检查标签长度
  if (tag.length > 20) {
    ElMessage.warning('标签长度不能超过 20 个字符');
    return;
  }

  // 添加标签
  formData.value.tags.push(tag);
  currentTag.value = '';

  // 继续显示输入框，方便连续添加
  tagInputRef.value?.focus();
}

/**
 * 移除标签
 */
function removeTag(tag: string) {
  const index = formData.value.tags.indexOf(tag);
  if (index !== -1) {
    formData.value.tags.splice(index, 1);
  }
}

/**
 * 处理标签输入框回车
 */
function handleTagInputEnter() {
  addTag();
}

/**
 * 处理标签输入框失焦
 */
function handleTagInputBlur() {
  addTag();
  hideTagInputBox();
}

/**
 * 提交上传
 */
async function handleSubmit() {
  // 验证表单
  if (!formRef.value) {
    return;
  }

  try {
    await formRef.value.validate();
  } catch (error) {
    ElMessage.error('请完善表单信息');
    return;
  }

  // 获取待上传的文件
  const pendingFiles = uploadAreaRef.value?.getPendingFiles();

  if (!pendingFiles || pendingFiles.length === 0) {
    ElMessage.warning('请先选择要上传的文件');
    return;
  }

  // 只上传第一个文件（单文件上传）
  const fileItem = pendingFiles[0];

  // 确认上传
  try {
    await ElMessageBox.confirm(`确认上传文件"${fileItem.name}"吗？`, '确认上传', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    });
  } catch {
    return;
  }

  // 更新文件状态为上传中
  uploadAreaRef.value?.updateFileStatus(fileItem.id, FileStatus.UPLOADING, 0);

  // 执行上传
  const result = await handleFileUpload(fileItem.file, formData.value);

  if (result.success && result.data) {
    // 上传成功
    uploadAreaRef.value?.updateFileStatus(fileItem.id, FileStatus.SUCCESS, 100);

    ElMessage.success('上传成功！');

    // 跳转到资源详情页
    setTimeout(() => {
      router.push(`/resource/${result.data!.resourceId}`);
    }, 1500);
  } else {
    // 上传失败
    uploadAreaRef.value?.updateFileStatus(fileItem.id, FileStatus.ERROR, 0, result.error);
    ElMessage.error(result.error || '上传失败');
  }
}

/**
 * 重置表单
 */
function resetForm() {
  formData.value = {
    title: '',
    categoryId: '',
    tags: [],
    description: '',
    vipLevel: 0
  };

  uploadAreaRef.value?.clearFiles();
  formRef.value?.clearValidate();
}

/**
 * 取消上传
 */
function handleCancel() {
  router.back();
}

// ========== 生命周期 ==========

onMounted(async () => {
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录');
    router.push('/login');
    return;
  }

  // 加载分类数据
  if (configStore.categories.length === 0) {
    try {
      await configStore.fetchCategories();
    } catch (error) {
      ElMessage.error('加载分类数据失败');
    }
  }
});
</script>

<template>
  <div class="upload-page">
    <div class="upload-container">
      <!-- 页面标题 -->
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
      </div>

      <!-- 上传表单 -->
      <div class="upload-form">
        <!-- 左侧：文件上传区域 -->
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

          <!-- 上传进度 -->
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

        <!-- 右侧：元信息表单 -->
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
            <!-- 资源标题 -->
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

            <!-- 资源分类 -->
            <el-form-item
              label="资源分类"
              prop="categoryId"
            >
              <el-cascader
                v-model="formData.categoryId"
                :options="cascaderCategories"
                :props="{
                  value: 'value',
                  label: 'label',
                  children: 'children',
                  emitPath: false,
                  checkStrictly: false
                }"
                placeholder="请选择资源分类"
                :disabled="isUploading"
                clearable
                filterable
                class="full-width"
                @change="handleCategoryChange"
              >
                <template #default="{ node, data }">
                  <span>{{ data.label }}</span>
                  <span
                    v-if="!node.isLeaf && data.resourceCount"
                    class="category-count"
                  >
                    ({{ data.resourceCount }})
                  </span>
                </template>
              </el-cascader>
            </el-form-item>

            <!-- 资源标签 -->
            <el-form-item label="资源标签">
              <div class="tags-container">
                <el-tag
                  v-for="tag in formData.tags"
                  :key="tag"
                  closable
                  :disable-transitions="false"
                  :disabled="isUploading"
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

            <!-- 资源描述 -->
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

            <!-- VIP等级 -->
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

            <!-- 操作按钮 -->
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

/* 页面标题 */
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

/* 上传表单 */
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

/* 上传进度区域 */
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

.progress-speed,
.progress-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 元信息表单 */
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

.category-count {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

/* 标签容器 */
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

/* 表单操作按钮 */
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

/* 响应式布局 */
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

  .page-subtitle {
    font-size: 14px;
  }

  .upload-left,
  .upload-right {
    padding: 16px;
  }

  .section-title {
    font-size: 16px;
  }

  .metadata-form :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  .form-actions :deep(.el-form-item__content) {
    flex-direction: column;
  }

  .submit-button,
  .cancel-button,
  .reset-button {
    width: 100%;
  }

  .tags-container {
    gap: 6px;
  }

  .tag-input {
    width: 100px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .upload-page {
    background: #141414;
  }

  .upload-left,
  .upload-right {
    background: #1d1e1f;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }

  .page-title {
    color: #e5eaf3;
  }

  .page-subtitle {
    color: #a8abb2;
  }

  .section-title {
    color: #e5eaf3;
  }

  .upload-progress-section {
    background: #1a2332;
    border-color: #2b3a4f;
  }

  .progress-title {
    color: #e5eaf3;
  }

  .progress-percentage {
    color: #4c9aff;
  }

  .progress-info {
    color: #a8abb2;
  }

  .metadata-form :deep(.el-form-item__label) {
    color: #e5eaf3;
  }

  .form-hint {
    color: #a8abb2;
  }

  .category-count {
    color: #a8abb2;
  }
}
</style>
