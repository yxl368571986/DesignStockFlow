<!--
  调整积分对话框
  
  功能：
  - 手动增加或扣减积分
  - 要求输入原因
  - 记录积分明细
  
  需求: 需求12.12
-->

<template>
  <el-dialog
    v-model="visible"
    title="调整积分"
    width="500px"
    :close-on-click-modal="false"
  >
    <div class="user-info">
      <div class="info-item">
        <span class="label">用户昵称:</span>
        <span class="value">{{ user?.nickname }}</span>
      </div>
      <div class="info-item">
        <span class="label">当前积分:</span>
        <span class="value points">{{ user?.pointsBalance || 0 }}</span>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="调整类型" prop="adjustType">
        <el-radio-group v-model="form.adjustType">
          <el-radio label="add">增加积分</el-radio>
          <el-radio label="subtract">扣减积分</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="积分数量" prop="points">
        <el-input-number
          v-model="form.points"
          :min="1"
          :max="form.adjustType === 'subtract' ? user?.pointsBalance : 999999"
          :step="10"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="快捷设置">
        <el-button-group>
          <el-button size="small" @click="form.points = 10">10</el-button>
          <el-button size="small" @click="form.points = 50">50</el-button>
          <el-button size="small" @click="form.points = 100">100</el-button>
          <el-button size="small" @click="form.points = 500">500</el-button>
          <el-button size="small" @click="form.points = 1000">1000</el-button>
        </el-button-group>
      </el-form-item>

      <el-form-item label="调整后积分">
        <div class="result-preview">
          <span class="current">{{ user?.pointsBalance || 0 }}</span>
          <el-icon class="arrow"><Right /></el-icon>
          <span class="new" :class="form.adjustType === 'add' ? 'text-success' : 'text-warning'">
            {{ calculateNewBalance() }}
          </span>
        </div>
      </el-form-item>

      <el-form-item label="调整原因" prop="reason">
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="3"
          placeholder="请输入调整积分的原因"
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { Right } from '@element-plus/icons-vue';
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
  adjustType: 'add' as 'add' | 'subtract',
  points: 10,
  reason: ''
});

// 表单验证规则
const rules: FormRules = {
  adjustType: [
    { required: true, message: '请选择调整类型', trigger: 'change' }
  ],
  points: [
    { required: true, message: '请输入积分数量', trigger: 'blur' },
    { 
      validator: (_rule, value, callback) => {
        if (form.adjustType === 'subtract' && value > (props.user?.pointsBalance || 0)) {
          callback(new Error('扣减积分不能超过当前余额'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ],
  reason: [
    { required: true, message: '请输入调整原因', trigger: 'blur' },
    { min: 5, max: 200, message: '原因长度在5-200个字符', trigger: 'blur' }
  ]
};

// 监听对话框显示
watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val) {
    form.adjustType = 'add';
    form.points = 10;
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

// 计算调整后余额
const calculateNewBalance = () => {
  const currentBalance = props.user?.pointsBalance || 0;
  if (form.adjustType === 'add') {
    return currentBalance + form.points;
  } else {
    return Math.max(0, currentBalance - form.points);
  }
};

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    const actionText = form.adjustType === 'add' ? '增加' : '扣减';
    const newBalance = calculateNewBalance();

    try {
      await ElMessageBox.confirm(
        `确定要${actionText} ${form.points} 积分吗？调整后余额为 ${newBalance}`,
        '确认操作',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );

      loading.value = true;
      try {
        // TODO: 调用后端API调整积分
        // await adjustUserPoints({
        //   userId: props.user.userId,
        //   adjustType: form.adjustType,
        //   points: form.points,
        //   reason: form.reason
        // });

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        ElMessage.success('积分调整成功');
        emit('success');
      } catch (error) {
        ElMessage.error('积分调整失败');
      } finally {
        loading.value = false;
      }
    } catch (error) {
      // 用户取消操作
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

      &.points {
        color: #ff7d00;
        font-size: 18px;
        font-weight: 600;
      }
    }
  }
}

.result-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;

  .current {
    color: #666;
  }

  .arrow {
    color: #999;
  }

  .new {
    &.text-success {
      color: #67c23a;
    }

    &.text-warning {
      color: #e6a23c;
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

  .result-preview {
    .current {
      color: #999;
    }
  }
}
</style>
