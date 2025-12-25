<script setup lang="ts">
/**
 * 二次验证弹窗组件
 * 用于大额支付的安全验证
 */

import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { sendSecondaryAuthCode, verifySecondaryAuthCode } from '@/api/vip';

interface Props {
  /** 是否显示 */
  visible: boolean;
  /** 订单号 */
  orderNo: string;
  /** 支付金额 */
  amount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
  cancel: [];
}>();

/** 验证码 */
const code = ref('');

/** 发送中 */
const sending = ref(false);

/** 验证中 */
const verifying = ref(false);

/** 倒计时 */
const countdown = ref(0);

/** 倒计时定时器 */
let countdownTimer: ReturnType<typeof setInterval> | null = null;

/** 是否可以发送 */
const canSend = computed(() => countdown.value === 0 && !sending.value);

/** 发送按钮文本 */
const sendButtonText = computed(() => {
  if (sending.value) return '发送中...';
  if (countdown.value > 0) return `${countdown.value}秒后重发`;
  return '发送验证码';
});

/** 发送验证码 */
async function handleSendCode() {
  if (!canSend.value) return;
  
  sending.value = true;
  try {
    const res = await sendSecondaryAuthCode(props.orderNo);
    if (res.code === 200) {
      ElMessage.success('验证码已发送');
      startCountdown();
    } else {
      ElMessage.error(res.msg || '发送失败');
    }
  } catch (error) {
    ElMessage.error('发送失败，请稍后重试');
  } finally {
    sending.value = false;
  }
}

/** 开始倒计时 */
function startCountdown() {
  countdown.value = 60;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      stopCountdown();
    }
  }, 1000);
}

/** 停止倒计时 */
function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  countdown.value = 0;
}

/** 验证 */
async function handleVerify() {
  if (!code.value || code.value.length !== 6) {
    ElMessage.warning('请输入6位验证码');
    return;
  }
  
  verifying.value = true;
  try {
    const res = await verifySecondaryAuthCode({
      orderNo: props.orderNo,
      code: code.value
    });
    if (res.code === 200) {
      ElMessage.success('验证成功');
      emit('success');
      handleClose();
    } else {
      ElMessage.error(res.msg || '验证失败');
    }
  } catch (error) {
    ElMessage.error('验证失败，请稍后重试');
  } finally {
    verifying.value = false;
  }
}

/** 关闭弹窗 */
function handleClose() {
  stopCountdown();
  code.value = '';
  emit('update:visible', false);
}

/** 取消 */
function handleCancel() {
  emit('cancel');
  handleClose();
}

// 监听visible变化
watch(() => props.visible, (visible) => {
  if (!visible) {
    stopCountdown();
    code.value = '';
  }
});
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="安全验证"
    width="400px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
  >
    <div class="auth-dialog-content">
      <!-- 提示信息 -->
      <div class="auth-tip">
        <el-icon class="tip-icon"><Warning /></el-icon>
        <p>您正在进行大额支付（¥{{ amount.toFixed(2) }}），为保障账户安全，请完成二次验证。</p>
      </div>
      
      <!-- 验证码输入 -->
      <div class="code-input-section">
        <el-input
          v-model="code"
          placeholder="请输入6位验证码"
          maxlength="6"
          size="large"
          class="code-input"
        >
          <template #append>
            <el-button
              :disabled="!canSend"
              :loading="sending"
              @click="handleSendCode"
            >
              {{ sendButtonText }}
            </el-button>
          </template>
        </el-input>
      </div>
      
      <!-- 说明 -->
      <div class="auth-note">
        <p>验证码将发送至您的注册手机号</p>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="handleCancel">取消支付</el-button>
      <el-button
        type="primary"
        :loading="verifying"
        :disabled="!code || code.length !== 6"
        @click="handleVerify"
      >
        确认验证
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { Warning } from '@element-plus/icons-vue';
export default {
  components: { Warning }
};
</script>

<style scoped>
.auth-dialog-content {
  padding: 10px 0;
}

.auth-tip {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #FFF3E0;
  border-radius: 8px;
  margin-bottom: 24px;
}

.tip-icon {
  color: #E6A23C;
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.auth-tip p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.code-input-section {
  margin-bottom: 16px;
}

.code-input :deep(.el-input__inner) {
  letter-spacing: 8px;
  font-size: 18px;
  text-align: center;
}

.auth-note {
  text-align: center;
}

.auth-note p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}
</style>
