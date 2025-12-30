<template>
  <div class="recharge-page">
    <div class="recharge-container">
      <!-- 返回按钮和标题 -->
      <div class="page-header">
        <div
          class="back-btn"
          @click="goBack"
        >
          <el-icon>
            <ArrowLeft />
          </el-icon>
          <span>返回</span>
        </div>
        <h1 class="page-title">
          积分充值
        </h1>
      </div>

      <!-- VIP用户提示 -->
      <div
        v-if="isVIP"
        class="vip-notice"
      >
        <el-icon>
          <Star />
        </el-icon>
        <span>您是VIP用户，无需充值积分即可下载VIP资源</span>
      </div>

      <!-- 当前积分余额 -->
      <div class="balance-card">
        <div class="balance-info">
          <span class="balance-label">当前积分余额</span>
          <span class="balance-value">{{ pointsBalance }}</span>
        </div>
      </div>

      <!-- 充值套餐列表 -->
      <div
        v-if="!isVIP"
        class="packages-section"
      >
        <h2 class="section-title">
          选择充值套餐
        </h2>
        <div
          v-loading="packagesLoading"
          class="packages-list"
        >
          <div
            v-for="pkg in packages"
            :key="pkg.packageId"
            class="package-card"
            :class="{
              selected: selectedPackageId === pkg.packageId,
              recommended: pkg.isRecommend
            }"
            @click="selectPackage(pkg)"
          >
            <div
              v-if="pkg.isRecommend"
              class="recommend-badge"
            >
              推荐
            </div>
            <div class="package-price">
              <span class="price-symbol">¥</span>
              <span class="price-value">{{ pkg.price }}</span>
            </div>
            <div class="package-points">
              <span class="points-value">{{ pkg.totalPoints }}</span>
              <span class="points-unit">积分</span>
            </div>
            <div class="package-detail">
              <span>基础 {{ pkg.basePoints }} + 赠送 {{ pkg.bonusPoints }}</span>
            </div>
            <div class="package-value">
              <span>{{ pkg.valuePerYuan }} 积分/元</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 支付方式选择 -->
      <div
        v-if="!isVIP && selectedPackageId"
        class="payment-section"
      >
        <h2 class="section-title">
          选择支付方式
        </h2>
        <div class="payment-methods">
          <div
            class="payment-method"
            :class="{ selected: paymentMethod === 'wechat' }"
            @click="paymentMethod = 'wechat'"
          >
            <div class="method-icon wechat">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
              </svg>
            </div>
            <span class="method-name">微信支付</span>
          </div>
          <div
            class="payment-method"
            :class="{ selected: paymentMethod === 'alipay' }"
            @click="paymentMethod = 'alipay'"
          >
            <div class="method-icon alipay">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.422 20.422H3.578V3.578h16.844v16.844zM21.6 0H2.4A2.4 2.4 0 0 0 0 2.4v19.2A2.4 2.4 0 0 0 2.4 24h19.2a2.4 2.4 0 0 0 2.4-2.4V2.4A2.4 2.4 0 0 0 21.6 0zm-3.6 12.469s-1.875-.469-2.625-.656c.75-1.125 1.313-2.531 1.594-4.031h-3.375V6.375h4.031V5.25h-4.031V3.375h-1.5v1.875H8.063V6.375h4.031v1.406H8.625v1.125h5.906c-.188.938-.563 1.781-1.031 2.531-1.219-.281-2.531-.469-3.844-.469-2.156 0-3.656.75-3.656 2.156 0 1.406 1.5 2.344 3.656 2.344 1.594 0 3-.469 4.125-1.219.938.563 2.063 1.125 3.375 1.594l.844-1.375z" />
              </svg>
            </div>
            <span class="method-name">支付宝</span>
          </div>
        </div>
      </div>

      <!-- 确认充值按钮 -->
      <div
        v-if="!isVIP"
        class="recharge-action"
      >
        <el-button
          type="primary"
          size="large"
          :disabled="!selectedPackageId || !paymentMethod"
          :loading="orderCreating"
          @click="handleRecharge"
        >
          立即充值
        </el-button>
      </div>

      <!-- 支付弹窗 -->
      <el-dialog
        v-model="paymentDialogVisible"
        title="扫码支付"
        width="400px"
        :close-on-click-modal="false"
        @close="handlePaymentDialogClose"
      >
        <div class="payment-dialog-content">
          <div class="qrcode-container">
            <!-- 真实二维码 -->
            <img
              v-if="qrCodeUrl"
              :src="qrCodeUrl"
              alt="支付二维码"
              class="qrcode-image"
            >
            <!-- 占位符（当没有二维码URL时显示） -->
            <div
              v-else
              class="qrcode-placeholder"
            >
              <el-icon :size="48">
                <Picture />
              </el-icon>
              <p>{{ qrCodeLoading ? '正在生成二维码...' : '支付二维码' }}</p>
            </div>
          </div>
          <div class="payment-info">
            <p class="payment-amount">
              支付金额：<span>¥{{ selectedPackage?.price || 0 }}</span>
            </p>
            <p class="payment-points">
              充值积分：<span>{{ selectedPackage?.totalPoints || 0 }}</span> 积分
            </p>
            <p class="payment-tip">
              请使用{{ paymentMethod === 'wechat' ? '微信' : '支付宝' }}扫码支付
            </p>
            <p class="payment-expire">
              订单将在 <span>{{ orderExpireCountdown }}</span> 后过期
            </p>
          </div>
          <div class="payment-status">
            <el-icon
              v-if="paymentPolling"
              class="loading-icon"
            >
              <Loading />
            </el-icon>
            <span>{{ paymentStatusText }}</span>
          </div>
          <div class="payment-actions">
            <el-button
              type="default"
              @click="handleCancelOrder"
            >
              取消订单
            </el-button>
            <el-button
              type="primary"
              @click="handleRefreshQrCode"
            >
              刷新二维码
            </el-button>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 积分充值页面
 * 提供充值套餐选择、支付方式选择和订单创建功能
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Star, Picture, Loading } from '@element-plus/icons-vue';
import { useUserStore } from '@/pinia/userStore';
import { usePointsSync } from '@/composables/usePointsSync';
import {
  getRechargePackages,
  createRechargeOrder,
  getRechargeOrderStatus,
  cancelRechargeOrder,
  type RechargePackage,
  type CreateRechargeOrderRequest
} from '@/api/recharge';

const router = useRouter();
const userStore = useUserStore();
const { refreshPoints } = usePointsSync();

// 用户状态
const isVIP = computed(() => userStore.isVIP);
const pointsBalance = computed(() => userStore.pointsBalance);

// 套餐数据
const packages = ref<RechargePackage[]>([]);
const packagesLoading = ref(false);
const selectedPackageId = ref<string>('');
const selectedPackage = computed(() =>
  packages.value.find(p => p.packageId === selectedPackageId.value)
);

// 支付方式
const paymentMethod = ref<'wechat' | 'alipay'>('wechat');

// 订单状态
const orderCreating = ref(false);
const currentOrderId = ref<string>('');
const currentOrderExpireAt = ref<string>('');

// 支付弹窗
const paymentDialogVisible = ref(false);
const paymentPolling = ref(false);
const paymentStatusText = ref('等待支付...');
const qrCodeUrl = ref<string>('');
const qrCodeLoading = ref(false);
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// 订单过期倒计时
const orderExpireCountdown = ref<string>('30:00');

/**
 * 返回上一页
 */
function goBack(): void {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/points');
  }
}

/**
 * 加载充值套餐
 */
async function loadPackages(): Promise<void> {
  packagesLoading.value = true;
  try {
    const res = await getRechargePackages();
    if (res.code === 200 || res.code === 0) {
      packages.value = res.data || [];
      // 默认选中推荐套餐
      const recommended = packages.value.find(p => p.isRecommend);
      if (recommended) {
        selectedPackageId.value = recommended.packageId;
      } else if (packages.value.length > 0) {
        selectedPackageId.value = packages.value[0].packageId;
      }
    }
  } catch (error) {
    console.error('加载套餐失败:', error);
    ElMessage.error('加载套餐失败，请稍后重试');
  } finally {
    packagesLoading.value = false;
  }
}

/**
 * 选择套餐
 */
function selectPackage(pkg: RechargePackage): void {
  selectedPackageId.value = pkg.packageId;
}

/**
 * 处理充值
 */
async function handleRecharge(): Promise<void> {
  if (!selectedPackageId.value) {
    ElMessage.warning('请选择充值套餐');
    return;
  }
  if (!paymentMethod.value) {
    ElMessage.warning('请选择支付方式');
    return;
  }

  orderCreating.value = true;
  qrCodeLoading.value = true;
  try {
    const data: CreateRechargeOrderRequest = {
      packageId: selectedPackageId.value,
      paymentMethod: paymentMethod.value
    };
    const res = await createRechargeOrder(data);
    if (res.code === 200 || res.code === 0) {
      currentOrderId.value = res.data.orderId;
      currentOrderExpireAt.value = res.data.expireAt;
      qrCodeUrl.value = res.data.qrCodeUrl || '';
      paymentDialogVisible.value = true;
      startPolling();
      startCountdown();
      ElMessage.success('订单创建成功，请完成支付');
    } else {
      ElMessage.error(res.message || '创建订单失败');
    }
  } catch (error: any) {
    console.error('创建订单失败:', error);
    ElMessage.error(error.response?.data?.message || '创建订单失败，请稍后重试');
  } finally {
    orderCreating.value = false;
    qrCodeLoading.value = false;
  }
}

/**
 * 开始轮询订单状态
 */
function startPolling(): void {
  paymentPolling.value = true;
  paymentStatusText.value = '等待支付...';

  pollingTimer = setInterval(async () => {
    try {
      const res = await getRechargeOrderStatus(currentOrderId.value);
      if (res.code === 200 || res.code === 0) {
        const order = res.data;
        if (order.paymentStatus === 1) {
          // 支付成功
          stopPolling();
          stopCountdown();
          paymentStatusText.value = '支付成功！';
          ElMessage.success(`充值成功！获得 ${order.totalPoints} 积分`);
          await refreshPoints(true);
          setTimeout(() => {
            paymentDialogVisible.value = false;
            router.push('/points');
          }, 1500);
        } else if (order.paymentStatus === 2) {
          // 已取消
          stopPolling();
          stopCountdown();
          paymentStatusText.value = '订单已取消';
          ElMessage.warning('订单已取消');
        } else if (order.paymentStatus === 3) {
          // 已过期
          stopPolling();
          stopCountdown();
          paymentStatusText.value = '订单已过期';
          ElMessage.warning('订单已过期，请重新下单');
        }
      }
    } catch (error) {
      console.error('查询订单状态失败:', error);
    }
  }, 3000);
}

/**
 * 停止轮询
 */
function stopPolling(): void {
  paymentPolling.value = false;
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

/**
 * 开始倒计时
 */
function startCountdown(): void {
  updateCountdown();
  countdownTimer = setInterval(() => {
    updateCountdown();
  }, 1000);
}

/**
 * 更新倒计时显示
 */
function updateCountdown(): void {
  if (!currentOrderExpireAt.value) {
    orderExpireCountdown.value = '30:00';
    return;
  }
  
  const expireTime = new Date(currentOrderExpireAt.value).getTime();
  const now = Date.now();
  const diff = expireTime - now;
  
  if (diff <= 0) {
    orderExpireCountdown.value = '00:00';
    stopCountdown();
    return;
  }
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  orderExpireCountdown.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 停止倒计时
 */
function stopCountdown(): void {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

/**
 * 处理支付弹窗关闭
 */
function handlePaymentDialogClose(): void {
  stopPolling();
  stopCountdown();
  qrCodeUrl.value = '';
  currentOrderId.value = '';
  currentOrderExpireAt.value = '';
}

/**
 * 取消订单
 */
async function handleCancelOrder(): Promise<void> {
  try {
    await ElMessageBox.confirm('确定要取消当前订单吗？', '取消订单', {
      confirmButtonText: '确定',
      cancelButtonText: '继续支付',
      type: 'warning'
    });
    
    const res = await cancelRechargeOrder(currentOrderId.value, '用户主动取消');
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('订单已取消');
      paymentDialogVisible.value = false;
    } else {
      ElMessage.error(res.message || '取消订单失败');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error);
      ElMessage.error('取消订单失败，请稍后重试');
    }
  }
}

/**
 * 刷新二维码
 */
async function handleRefreshQrCode(): Promise<void> {
  // 先取消当前订单，再创建新订单
  try {
    await cancelRechargeOrder(currentOrderId.value, '刷新二维码');
  } catch (error) {
    // 忽略取消失败的错误
  }
  
  paymentDialogVisible.value = false;
  stopPolling();
  stopCountdown();
  
  // 重新创建订单
  await handleRecharge();
}

onMounted(() => {
  loadPackages();
  refreshPoints(true);
});

onUnmounted(() => {
  stopPolling();
  stopCountdown();
});
</script>

<style scoped lang="scss">
.recharge-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 24px;
}

.recharge-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 16px 0;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #409eff;
  }
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.vip-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  margin-bottom: 16px;
  color: #92400e;
  font-size: 14px;

  .el-icon {
    color: #f59e0b;
    font-size: 20px;
  }
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  color: #fff;
}

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.9;
}

.balance-value {
  font-size: 36px;
  font-weight: 700;
}

.packages-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.packages-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.package-card {
  position: relative;
  background: #fafafa;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #409eff;
    background: #f0f7ff;
  }

  &.selected {
    border-color: #409eff;
    background: linear-gradient(180deg, #f0f7ff 0%, #e6f0ff 100%);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }

  &.recommended {
    border-color: #f5a623;

    &.selected {
      border-color: #f5a623;
      background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%);
      box-shadow: 0 0 0 2px rgba(245, 166, 35, 0.2);
    }
  }
}

.recommend-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #f5a623 0%, #f7b84e 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 10px;
}

.package-price {
  margin-bottom: 8px;

  .price-symbol {
    font-size: 16px;
    color: #303133;
  }

  .price-value {
    font-size: 32px;
    font-weight: 700;
    color: #303133;
  }
}

.package-points {
  margin-bottom: 8px;

  .points-value {
    font-size: 20px;
    font-weight: 600;
    color: #409eff;
  }

  .points-unit {
    font-size: 14px;
    color: #909399;
    margin-left: 4px;
  }
}

.package-detail {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.package-value {
  font-size: 12px;
  color: #67c23a;
  font-weight: 500;
}

.payment-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.payment-methods {
  display: flex;
  gap: 16px;
}

.payment-method {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #c0c4cc;
  }

  &.selected {
    border-color: #409eff;
    background: #f0f7ff;
  }
}

.method-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
  }

  &.wechat {
    background: #07c160;
    color: #fff;
  }

  &.alipay {
    background: #1677ff;
    color: #fff;
  }
}

.method-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.recharge-action {
  display: flex;
  justify-content: center;

  .el-button {
    min-width: 200px;
    height: 48px;
    font-size: 16px;
  }
}

.payment-dialog-content {
  text-align: center;
  padding: 20px 0;
}

.qrcode-container {
  margin-bottom: 20px;
}

.qrcode-placeholder {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;

  p {
    margin: 8px 0 0 0;
    font-size: 14px;
  }
}

.qrcode-image {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  display: block;
  border-radius: 8px;
}

.payment-info {
  margin-bottom: 16px;
}

.payment-amount {
  font-size: 16px;
  color: #303133;
  margin: 0 0 8px 0;

  span {
    font-size: 24px;
    font-weight: 700;
    color: #f56c6c;
  }
}

.payment-points {
  font-size: 14px;
  color: #606266;
  margin: 0 0 8px 0;

  span {
    font-size: 18px;
    font-weight: 600;
    color: #409eff;
  }
}

.payment-tip {
  font-size: 14px;
  color: #909399;
  margin: 0 0 8px 0;
}

.payment-expire {
  font-size: 13px;
  color: #e6a23c;
  margin: 0;

  span {
    font-weight: 600;
    color: #f56c6c;
  }
}

.payment-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #409eff;
  font-size: 14px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.payment-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .packages-list {
    grid-template-columns: 1fr;
  }

  .payment-methods {
    flex-direction: column;
  }

  .package-price .price-value {
    font-size: 28px;
  }
}
</style>
