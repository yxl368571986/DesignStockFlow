<!--
  重置密码对话框
  
  功能：
  - 生成临时密码
  - 发送通知给用户
  
  需求: 需求12.10
-->

<template>
  <el-dialog
    v-model="visible"
    title="重置密码"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-alert
      title="提示"
      type="warning"
      :closable="false"
      show-icon
      class="mb-4"
    >
      重置密码后将生成临时密码，系统会通过短信通知用户
    </el-alert>

    <div class="user-info">
      <div class="info-item">
        <span class="label">用户昵称:</span>
        <span class="value">{{ user?.nickname }}</span>
      </div>
      <div class="info-item">
        <span class="label">手机号:</span>
        <span class="value">{{ user?.phone }}</span>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="临时密码" prop="tempPassword">
        <el-input
          v-model="form.tempPassword"
          placeholder="系统自动生成"
          readonly
        >
          <template #append>
            <el-button @click="generatePassword">
              <el-icon><Refresh /></el-icon>
              重新生成
            </el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="通知方式">
        <el-checkbox-group v-model="form.notifyMethods">
          <el-checkbox label="sms">短信通知</el-checkbox>
          <el-checkbox label="email" :disabled="!user?.email">邮件通知</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定重置
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';

interface Props {
  modelValue: boolean;
  user: any;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 对话框可见性
const visible = ref(false);

// 加载状态
const loading = ref(false);

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const form = reactive({
  tempPassword: '',
  notifyMethods: ['sms'] as string[]
});

// 表单验证规则
const rules: FormRules = {
  tempPassword: [
    { required: true, message: '请生成临时密码', trigger: 'blur' }
  ]
};

// 监听对话框显示
watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val) {
    generatePassword();
  }
});

// 监听对话框关闭
watch(visible, (val) => {
  emit('update:modelValue', val);
  if (!val) {
    formRef.value?.resetFields();
  }
});

// 生成随机密码
const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  form.tempPassword = password;
};

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      // TODO: 调用后端API重置密码
      // await resetUserPassword({
      //   userId: props.user.userId,
      //   tempPassword: form.tempPassword,
      //   notifyMethods: form.notifyMethods
      // });

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      ElMessage.success('密码重置成功，已通知用户');
      emit('success');
    } catch (error) {
      ElMessage.error('密码重置失败');
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped lang="scss">
.user-info {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;

  .info-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      font-size: 14px;
      color: #666;
      min-width: 80px;
    }

    .value {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }
  }
}

.mb-4 {
  margin-bottom: 16px;
}

// 暗黑模式
:global(.dark) {
  .user-info {
    background: #2a2a2a;

    .info-item {
      .label {
        color: #999;
      }

      .value {
        color: #e0e0e0;
      }
    }
  }
}
</style>
