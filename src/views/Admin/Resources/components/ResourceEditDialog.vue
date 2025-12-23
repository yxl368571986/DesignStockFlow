<!--
  资源编辑对话框
  
  功能：
  - 允许修改资源信息
  - 实时验证输入
  
  需求: 需求14.5
-->

<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑资源"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="资源标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入资源标题"
          maxlength="200"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="资源描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入资源描述"
          :rows="4"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="资源分类" prop="categoryId">
        <el-select
          v-model="formData.categoryId"
          placeholder="请选择资源分类"
          style="width: 100%"
        >
          <el-option
            v-for="category in categories"
            :key="category.categoryId"
            :label="category.categoryName"
            :value="category.categoryId"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="资源标签" prop="tags">
        <el-select
          v-model="formData.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="请输入或选择标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in commonTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
        <div class="form-tip">
          可输入自定义标签，按回车添加
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { updateAdminResource, type Resource } from '@/api/adminResource';

// Props
interface Props {
  modelValue: boolean;
  resource: Resource | null;
  categories: Array<{ categoryId: string; categoryName: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  resource: null,
  categories: () => []
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'success': [];
}>();

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive({
  title: '',
  description: '',
  categoryId: '',
  tags: [] as string[]
});

// 常用标签
const commonTags = ref([
  '设计',
  '海报',
  '插画',
  'UI',
  '图标',
  '背景',
  '模板',
  '素材',
  '创意',
  '简约',
  '商务',
  '科技',
  '卡通',
  '扁平',
  '渐变'
]);

// 表单验证规则
const formRules: FormRules = {
  title: [
    { required: true, message: '请输入资源标题', trigger: 'blur' },
    { min: 2, max: 200, message: '标题长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '描述不能超过 500 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择资源分类', trigger: 'change' }
  ],
  tags: [
    {
      type: 'array',
      max: 10,
      message: '最多添加 10 个标签',
      trigger: 'change'
    }
  ]
};

// 提交状态
const submitting = ref(false);

// 监听资源变化，初始化表单
watch(
  () => props.resource,
  (resource) => {
    if (resource) {
      formData.title = resource.title;
      formData.description = resource.description || '';
      formData.categoryId = resource.categoryId;
      formData.tags = resource.tags || [];
    }
  },
  { immediate: true }
);

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
  formRef.value?.resetFields();
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    // 验证表单
    await formRef.value.validate();

    if (!props.resource) {
      ElMessage.error('资源信息不存在');
      return;
    }

    submitting.value = true;

    // 调用API更新资源
    await updateAdminResource(props.resource.resourceId, {
      title: formData.title,
      description: formData.description,
      categoryId: formData.categoryId,
      tags: formData.tags
    });

    emit('success');
  } catch (error: any) {
    if (error !== false) {
      // 不是表单验证错误
      ElMessage.error(error.message || '保存失败');
    }
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 暗黑模式
:global(.dark) {
  .form-tip {
    color: #666;
  }
}
</style>
