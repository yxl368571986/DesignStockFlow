<script setup lang="ts">
/**
 * VIP会员中心页面
 * 展示VIP套餐、支付流程、用户VIP状态
 */

import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useVipStore } from '@/pinia/vipStore';
import { useUserStore } from '@/pinia/userStore';
import VipIcon from '@/components/business/VipIcon.vue';
import VipStatusCard from '@/components/business/VipStatusCard.vue';
import PaymentMethodSelector from '@/components/business/PaymentMethodSelector.vue';
import PaymentDialog from '@/components/business/PaymentDialog.vue';
import SecondaryAuthDialog from '@/components/business/SecondaryAuthDialog.vue';
import PaymentSuccessDialog from '@/components/business/PaymentSuccessDialog.vue';
import PointsExchangePanel from '@/components/business/PointsExchangePanel.vue';
import type { VipPackage } from '@/api/vip';

const route = useRoute();
const router = useRouter();
const vipStore = useVipStore();
const userStore = useUserStore();

/** 加载状态 */
const loading = ref(true);

/** 选中的套餐 */
const selectedPackage = ref<VipPackage | null>(null);

/** 选中的支付方式 */
const selectedPaymentMethod = ref('wechat');

/** 显示支付弹窗 */
const showPaymentDialog = ref(false);

/** 显示二次验证弹窗 */
const showAuthDialog = ref(false);

/** 显示支付成功弹窗 */
const showSuccessDialog = ref(false);

/** 显示积分兑换面板 */
const showPointsExchange = ref(false);

/** 当前订单信息 */
const currentOrderInfo = ref<{
  orderNo: string;
  amount: number;
  qrCodeUrl?: string;
  payUrl?: string;
  expireTime?: number;
} | null>(null);

/** 支付成功信息 */
const successInfo = ref<{
  orderNo: string;
  packageName: string;
  amount: number;
  expireAt: string;
  isLifetime: boolean;
} | null>(null);

/** 来源资源ID */
const sourceResourceId = computed(() => route.query.source as string || '');

/** 是否已登录 */
const isLoggedIn = computed(() => userStore.isLoggedIn);

/** 用户VIP信息 */
const userVipInfo = computed(() => vipStore.userVipInfo);

/** VIP状态 */
const vipStatus = computed(() => vipStore.vipStatus);

/** 是否是终身VIP */
const isLifetimeVip = computed(() => vipStore.isLifetimeVip);

/** 可用套餐列表 */
const packages = computed(() => vipStore.availablePackages);

/** VIP特权列表 */
const privileges = computed(() => vipStore.privileges);

/** 积分兑换信息 */
const pointsExchangeInfo = computed(() => vipStore.pointsExchangeInfo);

/** 用户积分 */
const userPoints = computed(() => userStore.pointsBalance);

/** 是否需要二次验证 */
const needSecondaryAuth = computed(() => {
  if (!selectedPackage.value) return false;
  return selectedPackage.value.currentPrice >= 200;
});

/** 初始化数据 */
async function initData() {
  loading.value = true;
  try {
    await vipStore.initVipData();
    if (isLoggedIn.value) {
      await vipStore.fetchPointsExchangeInfo();
    }
    
    // 默认选中第一个套餐
    if (packages.value.length > 0 && !selectedPackage.value) {
      selectedPackage.value = packages.value[0];
    }
  } catch (error) {
    console.error('初始化VIP数据失败:', error);
    ElMessage.error('加载失败，请刷新重试');
  } finally {
    loading.value = false;
  }
}

/** 选择套餐 */
function selectPackage(pkg: VipPackage) {
  selectedPackage.value = pkg;
}

/** 获取套餐标签 */
function getPackageTag(pkg: VipPackage): string {
  if (pkg.packageCode === 'yearly') return '推荐';
  if (pkg.packageCode === 'lifetime') return '最划算';
  return '';
}

/** 计算折扣 */
function getDiscount(pkg: VipPackage): string {
  if (pkg.originalPrice <= pkg.currentPrice) return '';
  const discount = Math.round((pkg.currentPrice / pkg.originalPrice) * 10);
  return `${discount}折`;
}

/** 处理购买 */
async function handlePurchase() {
  if (!isLoggedIn.value) {
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    });
    return;
  }
  
  if (!selectedPackage.value) {
    ElMessage.warning('请选择套餐');
    return;
  }
  
  // 积分兑换
  if (selectedPaymentMethod.value === 'points') {
    showPointsExchange.value = true;
    return;
  }
  
  // 创建订单
  const orderNo = await vipStore.createOrder(
    selectedPackage.value.packageId,
    selectedPaymentMethod.value,
    sourceResourceId.value ? window.location.href : undefined
  );
  
  if (!orderNo) {
    ElMessage.error('创建订单失败');
    return;
  }
  
  // 大额支付需要二次验证
  if (needSecondaryAuth.value) {
    currentOrderInfo.value = {
      orderNo,
      amount: selectedPackage.value.currentPrice
    };
    showAuthDialog.value = true;
    return;
  }
  
  // 发起支付
  await initiatePayment(orderNo);
}

/** 发起支付 */
async function initiatePayment(orderNo: string) {
  const paymentInfo = await vipStore.initiatePayment(orderNo);
  
  if (!paymentInfo) {
    ElMessage.error('发起支付失败');
    return;
  }
  
  currentOrderInfo.value = {
    orderNo,
    amount: selectedPackage.value?.currentPrice || 0,
    qrCodeUrl: paymentInfo.qrCodeUrl,
    payUrl: paymentInfo.payUrl,
    expireTime: paymentInfo.expireTime
  };
  
  showPaymentDialog.value = true;
}

/** 二次验证成功 */
async function handleAuthSuccess() {
  if (currentOrderInfo.value) {
    await initiatePayment(currentOrderInfo.value.orderNo);
  }
}

/** 支付成功 */
function handlePaymentSuccess() {
  showPaymentDialog.value = false;
  
  // 显示成功弹窗
  successInfo.value = {
    orderNo: currentOrderInfo.value?.orderNo || '',
    packageName: selectedPackage.value?.packageName || '',
    amount: currentOrderInfo.value?.amount || 0,
    expireAt: userVipInfo.value?.vipExpireAt || '',
    isLifetime: selectedPackage.value?.packageCode === 'lifetime'
  };
  showSuccessDialog.value = true;
  
  // 刷新用户信息
  vipStore.fetchUserVipInfo();
}

/** 支付失败 */
function handlePaymentFail() {
  showPaymentDialog.value = false;
  ElMessage.error('支付失败，请重试');
}

/** 支付超时 */
function handlePaymentTimeout() {
  showPaymentDialog.value = false;
  ElMessage.warning('订单已超时，请重新下单');
}

/** 积分兑换成功 */
function handleExchangeSuccess() {
  showPointsExchange.value = false;
  ElMessage.success('兑换成功！');
  vipStore.fetchUserVipInfo();
}

// 监听登录状态
watch(() => userStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    vipStore.fetchUserVipInfo();
    vipStore.fetchPointsExchangeInfo();
  }
});

// 初始化
onMounted(() => {
  initData();
});
</script>

<template>
  <div class="vip-page">
    <!-- 页面头部 -->
    <div class="vip-header">
      <div class="header-content">
        <h1 class="page-title">
          <VipIcon status="active" size="large" />
          VIP会员中心
        </h1>
        <p class="page-subtitle">升级VIP，享受无限下载特权</p>
      </div>
    </div>
    
    <div class="vip-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-wrapper">
        <el-skeleton :rows="5" animated />
      </div>
      
      <template v-else>
        <!-- 用户VIP状态卡片 -->
        <div v-if="isLoggedIn" class="user-vip-section">
          <VipStatusCard
            :is-vip="vipStatus === 'active' || vipStatus === 'lifetime'"
            :is-lifetime-vip="isLifetimeVip"
            :expire-at="userVipInfo?.vipExpireAt"
            :days-remaining="userVipInfo?.daysRemaining || 0"
            :privileges="privileges"
            :show-privileges="false"
            compact
          />
        </div>
        
        <!-- 终身VIP提示 -->
        <div v-if="isLifetimeVip" class="lifetime-notice">
          <el-icon><Star /></el-icon>
          <span>您已是终身VIP会员，无需再次购买</span>
        </div>
        
        <!-- 套餐选择 -->
        <div v-else class="packages-section">
          <h2 class="section-title">选择套餐</h2>
          
          <div class="packages-grid">
            <div
              v-for="pkg in packages"
              :key="pkg.packageId"
              class="package-card"
              :class="{ 
                active: selectedPackage?.packageId === pkg.packageId,
                featured: pkg.packageCode === 'yearly'
              }"
              @click="selectPackage(pkg)"
            >
              <!-- 标签 -->
              <div v-if="getPackageTag(pkg)" class="package-tag">
                {{ getPackageTag(pkg) }}
              </div>
              
              <!-- 套餐名称 -->
              <h3 class="package-name">{{ pkg.packageName }}</h3>
              
              <!-- 价格 -->
              <div class="package-price">
                <span class="currency">¥</span>
                <span class="amount">{{ pkg.currentPrice }}</span>
                <span v-if="pkg.durationDays > 0" class="duration">
                  /{{ pkg.durationDays >= 365 ? '年' : pkg.durationDays >= 30 ? '月' : `${pkg.durationDays}天` }}
                </span>
                <span v-else class="duration">/终身</span>
              </div>
              
              <!-- 原价 -->
              <div v-if="pkg.originalPrice > pkg.currentPrice" class="original-price">
                <span class="price-text">原价 ¥{{ pkg.originalPrice }}</span>
                <span class="discount-tag">{{ getDiscount(pkg) }}</span>
              </div>
              
              <!-- 描述 -->
              <p class="package-desc">{{ pkg.description }}</p>
              
              <!-- 选中标记 -->
              <div v-if="selectedPackage?.packageId === pkg.packageId" class="check-mark">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 支付方式选择 -->
        <div v-if="!isLifetimeVip && selectedPackage" class="payment-section">
          <PaymentMethodSelector
            v-model="selectedPaymentMethod"
            :wechat-enabled="true"
            :alipay-enabled="true"
            :points-enabled="pointsExchangeInfo?.canExchange || false"
            :user-points="userPoints"
            :points-required="pointsExchangeInfo?.pointsRequired || 0"
            :has-exchanged-this-month="pointsExchangeInfo?.hasExchangedThisMonth || false"
          />
        </div>
        
        <!-- 购买按钮 -->
        <div v-if="!isLifetimeVip" class="purchase-section">
          <el-button
            type="primary"
            size="large"
            :disabled="!selectedPackage"
            :loading="vipStore.loading"
            class="purchase-button"
            @click="handlePurchase"
          >
            {{ isLoggedIn ? '立即开通' : '登录后开通' }}
          </el-button>
          
          <p class="purchase-tip">
            支付即表示同意
            <a href="/agreement" target="_blank">《VIP会员服务协议》</a>
          </p>
        </div>
        
        <!-- VIP特权展示 -->
        <div class="privileges-section">
          <h2 class="section-title">VIP专属特权</h2>
          
          <div class="privileges-grid">
            <div class="privilege-card">
              <div class="privilege-icon download">
                <el-icon><Download /></el-icon>
              </div>
              <h4>无限下载</h4>
              <p>每日可下载50次VIP资源</p>
            </div>
            
            <div class="privilege-card">
              <div class="privilege-icon speed">
                <el-icon><Promotion /></el-icon>
              </div>
              <h4>极速下载</h4>
              <p>享受高速下载通道</p>
            </div>
            
            <div class="privilege-card">
              <div class="privilege-icon exclusive">
                <el-icon><Star /></el-icon>
              </div>
              <h4>专属资源</h4>
              <p>解锁全站VIP专属素材</p>
            </div>
            
            <div class="privilege-card">
              <div class="privilege-icon support">
                <el-icon><Service /></el-icon>
              </div>
              <h4>优先客服</h4>
              <p>专属客服优先响应</p>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <!-- 支付弹窗 -->
    <PaymentDialog
      v-model:visible="showPaymentDialog"
      :order-no="currentOrderInfo?.orderNo || ''"
      :payment-method="selectedPaymentMethod"
      :amount="currentOrderInfo?.amount || 0"
      :qr-code-url="currentOrderInfo?.qrCodeUrl"
      :pay-url="currentOrderInfo?.payUrl"
      :expire-time="currentOrderInfo?.expireTime"
      @success="handlePaymentSuccess"
      @fail="handlePaymentFail"
      @timeout="handlePaymentTimeout"
    />
    
    <!-- 二次验证弹窗 -->
    <SecondaryAuthDialog
      v-model:visible="showAuthDialog"
      :order-no="currentOrderInfo?.orderNo || ''"
      :amount="currentOrderInfo?.amount || 0"
      @success="handleAuthSuccess"
      @cancel="() => showAuthDialog = false"
    />
    
    <!-- 支付成功弹窗 -->
    <PaymentSuccessDialog
      v-model:visible="showSuccessDialog"
      :order-no="successInfo?.orderNo || ''"
      :package-name="successInfo?.packageName || ''"
      :amount="successInfo?.amount || 0"
      :expire-at="successInfo?.expireAt || ''"
      :is-lifetime="successInfo?.isLifetime || false"
      :source-resource-id="sourceResourceId"
    />
    
    <!-- 积分兑换面板 -->
    <el-dialog
      v-model="showPointsExchange"
      title=""
      width="400px"
      :show-close="false"
    >
      <PointsExchangePanel
        :visible="showPointsExchange"
        @success="handleExchangeSuccess"
        @close="showPointsExchange = false"
      />
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Check, Star, Download, Promotion, Service } from '@element-plus/icons-vue';
export default {
  components: { Check, Star, Download, Promotion, Service }
};
</script>

<style scoped>
.vip-page {
  min-height: 100vh;
  background: #F5F7FA;
}

.vip-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 20px 80px;
  text-align: center;
}

.header-content {
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 12px 0;
}

.page-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.vip-container {
  max-width: 900px;
  margin: -40px auto 40px;
  padding: 0 20px;
}

.loading-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
}

.user-vip-section {
  margin-bottom: 24px;
}

.lifetime-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  border-radius: 12px;
  font-size: 16px;
  color: #B8860B;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

.packages-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.package-card {
  position: relative;
  padding: 24px;
  border: 2px solid #E4E7ED;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.package-card:hover {
  border-color: #409EFF;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.package-card.active {
  border-color: #409EFF;
  background: #ECF5FF;
}

.package-card.featured {
  border-color: #E6A23C;
}

.package-card.featured.active {
  background: #FDF6EC;
}

.package-tag {
  position: absolute;
  top: -10px;
  right: 16px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
}

.package-card.featured .package-tag {
  background: linear-gradient(135deg, #E6A23C 0%, #F56C6C 100%);
}

.package-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.package-price {
  margin-bottom: 8px;
}

.package-price .currency {
  font-size: 16px;
  color: #F56C6C;
}

.package-price .amount {
  font-size: 36px;
  font-weight: 700;
  color: #F56C6C;
}

.package-price .duration {
  font-size: 14px;
  color: #909399;
}

.original-price {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.price-text {
  font-size: 13px;
  color: #C0C4CC;
  text-decoration: line-through;
}

.discount-tag {
  font-size: 12px;
  color: #F56C6C;
  background: #FEF0F0;
  padding: 2px 6px;
  border-radius: 4px;
}

.package-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
  line-height: 1.5;
}

.check-mark {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409EFF;
  color: #fff;
  border-radius: 50%;
}

.payment-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.purchase-section {
  text-align: center;
  margin-bottom: 40px;
}

.purchase-button {
  width: 100%;
  max-width: 400px;
  height: 48px;
  font-size: 16px;
}

.purchase-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}

.purchase-tip a {
  color: #409EFF;
  text-decoration: none;
}

.privileges-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.privileges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.privilege-card {
  text-align: center;
  padding: 20px;
}

.privilege-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  border-radius: 12px;
  font-size: 28px;
}

.privilege-icon.download {
  background: #E8F5E9;
  color: #4CAF50;
}

.privilege-icon.speed {
  background: #E3F2FD;
  color: #2196F3;
}

.privilege-icon.exclusive {
  background: #FFF3E0;
  color: #FF9800;
}

.privilege-icon.support {
  background: #FCE4EC;
  color: #E91E63;
}

.privilege-card h4 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.privilege-card p {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

@media (max-width: 768px) {
  .vip-header {
    padding: 40px 16px 60px;
  }
  
  .page-title {
    font-size: 28px;
  }
  
  .vip-container {
    margin-top: -30px;
    padding: 0 16px;
  }
  
  .packages-grid {
    grid-template-columns: 1fr;
  }
  
  .privileges-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
