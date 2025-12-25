<script setup lang="ts">
/**
 * 支付弹窗组件
 * 显示支付二维码、倒计时、支付状态等
 */

import { ref, computed, watch, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useVipStore, PaymentStatus } from '@/pinia/vipStore';
import QRCode from 'qrcode';

interface Props {
  /** 是否显示 */
  visible: boolean;
  /** 订单号 */
  orderNo: string;
  /** 支付方式 */
  paymentMethod: string;
  /** 支付金额 */
  amount: number;
  /** 二维码URL（微信支付） */
  qrCodeUrl?: string;
  /** 支付跳转URL（支付宝） */
  payUrl?: string;
  /** 过期时间戳 */
  expireTime?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
  fail: [];
  timeout: [];
}>();

const vipStore = useVipStore();

/** 二维码图片 */
const qrCodeImage = ref('');

/** 倒计时（秒） */
const countdown = ref(0);

/** 倒计时定时器 */
let countdownTimer: ReturnType<typeof setInterval> | null = null;

/** 支付状态 */
const paymentStatus = ref<PaymentStatus>(PaymentStatus.PENDING);

/** 是否正在检查状态 */
const checking = ref(false);

/** 格式化倒计时 */
const formattedCountdown = computed(() => {
  const minutes = Math.floor(countdown.value / 60);
  const seconds = countdown.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

/** 是否是微信支付 */
const isWechat = computed(() => props.paymentMethod === 'wechat');

/** 是否是支付宝 */
const isAlipay = computed(() => props.paymentMethod === 'alipay');

/** 生成二维码 */
async function generateQRCode(url: string) {
  try {
    qrCodeImage.value = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (error) {
    console.error('生成二维码失败:', error);
    ElMessage.error('生成二维码失败');
  }
}

/** 开始倒计时 */
function startCountdown() {
  if (props.expireTime) {
    const now = Date.now();
    countdown.value = Math.max(0, Math.floor((props.expireTime - now) / 1000));
    
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        stopCountdown();
        handleTimeout();
      }
    }, 1000);
  }
}

/** 停止倒计时 */
function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

/** 处理超时 */
function handleTimeout() {
  paymentStatus.value = PaymentStatus.CANCELLED;
  vipStore.stopPaymentPolling();
  emit('timeout');
}

/** 处理支付成功 */
function handleSuccess() {
  paymentStatus.value = PaymentStatus.PAID;
  stopCountdown();
  emit('success');
}

/** 处理支付失败 */
function handleFail() {
  paymentStatus.value = PaymentStatus.FAILED;
  stopCountdown();
  emit('fail');
}

/** 关闭弹窗 */
function handleClose() {
  stopCountdown();
  vipStore.stopPaymentPolling();
  emit('update:visible', false);
}

/** 跳转支付宝支付 */
function goToAlipay() {
  if (props.payUrl) {
    window.open(props.payUrl, '_blank');
  }
}

/** 手动检查支付状态 */
async function checkStatus() {
  checking.value = true;
  try {
    const status = await vipStore.checkPaymentStatus(props.orderNo);
    if (status === PaymentStatus.PAID) {
      handleSuccess();
    } else if (status === PaymentStatus.CANCELLED || status === PaymentStatus.FAILED) {
      handleFail();
    }
  } finally {
    checking.value = false;
  }
}

// 监听visible变化
watch(() => props.visible, async (visible) => {
  if (visible) {
    paymentStatus.value = PaymentStatus.PENDING;
    
    // 生成二维码
    if (props.qrCodeUrl) {
      await generateQRCode(props.qrCodeUrl);
    }
    
    // 开始倒计时
    startCountdown();
    
    // 开始轮询支付状态
    vipStore.startPaymentPolling(
      props.orderNo,
      handleSuccess,
      handleFail
    );
  } else {
    stopCountdown();
    vipStore.stopPaymentPolling();
  }
});

// 组件卸载时清理
onUnmounted(() => {
  stopCountdown();
  vipStore.stopPaymentPolling();
});
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="支付订单"
    width="400px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
  >
    <div class="payment-dialog-content">
      <!-- 支付中状态 -->
      <template v-if="paymentStatus === PaymentStatus.PENDING">
        <!-- 订单信息 -->
        <div class="order-info">
          <div class="order-row">
            <span class="label">订单号：</span>
            <span class="value">{{ orderNo }}</span>
          </div>
          <div class="order-row">
            <span class="label">支付金额：</span>
            <span class="value amount">¥{{ amount.toFixed(2) }}</span>
          </div>
        </div>
        
        <!-- 微信支付二维码 -->
        <div v-if="isWechat && qrCodeImage" class="qrcode-section">
          <img :src="qrCodeImage" alt="支付二维码" class="qrcode-image" />
          <p class="qrcode-tip">请使用微信扫码支付</p>
        </div>
        
        <!-- 支付宝跳转 -->
        <div v-if="isAlipay" class="alipay-section">
          <el-button type="primary" size="large" @click="goToAlipay">
            前往支付宝支付
          </el-button>
          <p class="alipay-tip">点击按钮跳转至支付宝完成支付</p>
        </div>
        
        <!-- 倒计时 -->
        <div class="countdown-section">
          <span class="countdown-label">支付剩余时间：</span>
          <span class="countdown-time">{{ formattedCountdown }}</span>
        </div>
        
        <!-- 手动检查按钮 -->
        <div class="check-section">
          <el-button :loading="checking" @click="checkStatus">
            已完成支付
          </el-button>
        </div>
      </template>
      
      <!-- 支付成功 -->
      <template v-else-if="paymentStatus === PaymentStatus.PAID">
        <div class="result-section success">
          <el-icon class="result-icon"><CircleCheck /></el-icon>
          <h3>支付成功</h3>
          <p>您的VIP会员已开通</p>
        </div>
      </template>
      
      <!-- 支付失败/超时 -->
      <template v-else>
        <div class="result-section fail">
          <el-icon class="result-icon"><CircleClose /></el-icon>
          <h3>{{ paymentStatus === PaymentStatus.CANCELLED ? '订单已超时' : '支付失败' }}</h3>
          <p>请重新下单支付</p>
        </div>
      </template>
    </div>
    
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { CircleCheck, CircleClose } from '@element-plus/icons-vue';
export default {
  components: { CircleCheck, CircleClose }
};
</script>

<style scoped>
.payment-dialog-content {
  text-align: center;
}

.order-info {
  background: #F5F7FA;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.order-row .label {
  color: #909399;
  font-size: 14px;
}

.order-row .value {
  color: #333;
  font-size: 14px;
}

.order-row .value.amount {
  color: #F56C6C;
  font-size: 20px;
  font-weight: 600;
}

.qrcode-section {
  margin: 20px 0;
}

.qrcode-image {
  width: 200px;
  height: 200px;
  border: 1px solid #E4E7ED;
  border-radius: 8px;
}

.qrcode-tip {
  margin-top: 12px;
  color: #909399;
  font-size: 14px;
}

.alipay-section {
  margin: 30px 0;
}

.alipay-tip {
  margin-top: 12px;
  color: #909399;
  font-size: 14px;
}

.countdown-section {
  margin: 20px 0;
  padding: 12px;
  background: #FFF3E0;
  border-radius: 8px;
}

.countdown-label {
  color: #E6A23C;
  font-size: 14px;
}

.countdown-time {
  color: #F56C6C;
  font-size: 18px;
  font-weight: 600;
  margin-left: 8px;
}

.check-section {
  margin-top: 16px;
}

.result-section {
  padding: 40px 20px;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.result-section.success .result-icon {
  color: #67C23A;
}

.result-section.fail .result-icon {
  color: #F56C6C;
}

.result-section h3 {
  font-size: 20px;
  color: #333;
  margin: 0 0 8px 0;
}

.result-section p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}
</style>
