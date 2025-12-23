<!--
  调整VIP对话框
  
  功能：
  - 手动设置VIP等级和到期时间
  - 记录操作日志
  
  需求: 需求12.11
-->

<template>
  <el-dialog
    v-model="visible"
    title="调整VIP"
    width="500px"
    :close-on-click-modal="false"
  >
    <div class="user-info">
      <div class="info-item">
        <span class="label">用户昵称:</span>
        <span class="value">{{ user?.nickname }}</span>
      </div>
      <div class="info-item">
        <span class="label">当前VIP:</span>
        <el-tag v-if="user?.vipLevel > 0" type="warning" effect="dark">
          <el-icon><Star /></el-icon>
          VIP
        </el-tag>
        <el-tag v-else type="info">普通用户</el-tag>
      </div>
      <div v-if="user?.vipExpireAt" class="info-item">
        <span class="label">到期时间:</span>
        <span class="value">{{ formatDate(user.vipExpireAt) }}</span>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="VIP等级" prop="vipLevel">
        <el-radio-group v-model="form.vipLevel">
          <el-radio :label="0">普通用户</el-radio>
          <el-radio :label="1">VIP会员</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item 
        v-if="form.vipLevel > 0" 
        label="到期时间" 
        prop="vipExpireAt"
      >
        <el-date-picker
          v-model="form.vipExpireAt"
          type="datetime"
          placeholder="选择到期时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          :disabled-date="disabledDate"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="快捷设置" v-if="form.vipLevel > 0">
        <el-button-group>
          <el-button size="small" @click="setExpireTime(30)">1个月</el-button>
          <el-button size="small" @click="setExpireTime(90)">3个月</el-button>
          <el-button size="small" @click="setExpireTime(180)">6个月</el-button>
          <el-button size="small" @click="setExpireTime(365)">1年</el-button>
        </el-button-group>
      </el-form-item>

      <el-form-item label="操作原因" prop="reason">
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="3"
          placeholder="请输入调整VIP的原因"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定调整
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Star } from '@element-plus/icons-vue';
import { formatTime } from '@/utils/format';
import type { FormInstance, FormRules } from 'element-plus';

// 格式化日期的辅助函数
const formatDate = (date: string) => formatTime(date, 'YYYY-MM-DD HH:mm:ss');

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
  vipLevel: 0,
  vipExpireAt: '',
  reason: ''
});

// 表单验证规则
const rules: FormRules = {
  vipLevel: [
    { required: true, message: '请选择VIP等级', trigger: 'change' }
  ],
  vipExpireAt: [
    { required: true, message: '请选择到期时间', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请输入操作原因', trigger: 'blur' },
    { min: 5, max: 200, message: '原因长度在5-200个字符', trigger: 'blur' }
  ]
};

// 监听对话框显示
watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val && props.user) {
    form.vipLevel = props.user.vipLevel || 0;
    form.vipExpireAt = props.user.vipExpireAt || '';
    form.reason = '';
  }
});

// 监听对话框关闭
watch(visible, (val) => {
  emit('update:modelValue', val);
  if (!val) {
    formRef.value?.resetFields();
  }
});

// 禁用过去的日期
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now();
};

// 设置到期时间
const setExpireTime = (days: number) => {
  const now = new Date();
  now.setDate(now.getDate() + days);
  form.vipExpireAt = formatDate(now.toISOString());
};

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      // TODO: 调用后端API调整VIP
      // await adjustUserVip({
      //   userId: props.user.userId,
      //   vipLevel: form.vipLevel,
      //   vipExpireAt: form.vipExpireAt,
      //   reason: form.reason
      // });

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      ElMessage.success('VIP调整成功');
      emit('success');
    } catch (error) {
      ElMessage.error('VIP调整失败');
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
