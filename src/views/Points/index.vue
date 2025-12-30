<template>
  <div class="points-page">
    <div class="points-container">
      <!-- 积分余额卡片（包含返回按钮） -->
      <div class="points-balance-card">
        <!-- 返回按钮在卡片内部左上角 -->
        <div
          class="card-back-btn"
          @click="goBack"
        >
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        
        <!-- 卡片主体内容 -->
        <div class="card-main-content">
          <div class="balance-left">
            <!-- 积分图标 - 使用SVG线条图标 -->
            <div class="balance-icon">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="24" cy="12" rx="16" ry="6" stroke="currentColor" stroke-width="2.5" fill="none"/>
                <path d="M8 12v8c0 3.314 7.163 6 16 6s16-2.686 16-6v-8" stroke="currentColor" stroke-width="2.5" fill="none"/>
                <path d="M8 20v8c0 3.314 7.163 6 16 6s16-2.686 16-6v-8" stroke="currentColor" stroke-width="2.5" fill="none"/>
                <path d="M8 28v8c0 3.314 7.163 6 16 6s16-2.686 16-6v-8" stroke="currentColor" stroke-width="2.5" fill="none"/>
              </svg>
            </div>
            <div class="balance-details">
              <h2 class="balance-title">我的积分</h2>
              <div
                class="balance-value"
                :class="{ 'refreshing': refreshing }"
              >
                {{ pointsBalance }}
                <el-icon
                  v-if="refreshing"
                  class="refresh-icon"
                  :size="16"
                >
                  <Loading />
                </el-icon>
              </div>
              <p class="balance-tip">积分可用于下载付费资源</p>
            </div>
          </div>
          <div class="balance-actions">
            <button
              class="action-btn refresh-btn"
              :disabled="refreshing"
              @click="handleRefreshPoints"
            >
              刷新
            </button>
            <button
              class="action-btn mall-btn"
              @click="goToMall"
            >
              积分商城
            </button>
            <button
              class="action-btn recharge-btn"
              @click="handleRecharge"
            >
              积分充值
            </button>
          </div>
        </div>
      </div>

      <!-- 积分充值区域 -->
      <div class="points-recharge-section">
        <div class="section-header">
          <h3>
            <el-icon><ShoppingCart /></el-icon>
            积分充值
          </h3>
          <span class="section-tip">选择充值套餐，快速获取积分</span>
        </div>
        <div class="recharge-packages">
          <div
            v-for="pkg in rechargePackages"
            :key="pkg.packageId"
            class="package-card"
            :class="{ 'selected': selectedPackage === pkg.packageId, 'recommended': pkg.recommended }"
            @click="selectPackage(pkg.packageId)"
          >
            <div
              v-if="pkg.recommended"
              class="recommend-badge"
            >
              推荐
            </div>
            <div class="package-points">
              <span class="points-value">{{ pkg.points }}</span>
              <span class="points-unit">积分</span>
            </div>
            <div class="package-price">
              <span class="price-symbol">¥</span>
              <span class="price-value">{{ pkg.price }}</span>
            </div>
            <div
              v-if="pkg.discount < 1"
              class="package-discount"
            >
              {{ Math.round(pkg.discount * 10) }}折
            </div>
            <div class="package-desc">
              {{ pkg.description }}
            </div>
          </div>
        </div>
        <div class="recharge-actions">
          <el-button
            type="primary"
            size="large"
            :disabled="!selectedPackage"
            @click="confirmRecharge"
          >
            <el-icon><Wallet /></el-icon>
            立即充值
          </el-button>
        </div>
      </div>

      <!-- 积分明细 -->
      <div class="points-records">
        <div class="records-header">
          <h3>积分明细</h3>
          <el-select
            v-model="recordType"
            placeholder="全部类型"
            clearable
            @change="fetchRecords"
          >
            <el-option
              label="全部类型"
              value=""
            />
            <el-option
              label="充值"
              value="recharge"
            />
            <el-option
              label="消费"
              value="consume"
            />
            <el-option
              label="奖励"
              value="reward"
            />
          </el-select>
        </div>

        <div
          v-loading="loading"
          class="records-list"
        >
          <template v-if="records.length > 0">
            <div
              v-for="record in records"
              :key="record.recordId"
              class="record-item"
            >
              <div class="record-info">
                <div
                  class="record-icon"
                  :class="getRecordTypeClass(record.type)"
                >
                  <el-icon>
                    <component :is="getRecordIcon(record.type)" />
                  </el-icon>
                </div>
                <div class="record-details">
                  <span class="record-title">{{ record.description }}</span>
                  <span class="record-time">{{ formatTime(record.createdAt) }}</span>
                </div>
              </div>
              <div
                class="record-amount"
                :class="{ positive: record.amount > 0, negative: record.amount < 0 }"
              >
                {{ record.amount > 0 ? '+' : '' }}{{ record.amount }}
              </div>
            </div>
          </template>
          <el-empty
            v-else
            description="暂无积分记录"
          />
        </div>

        <!-- 分页 -->
        <div
          v-if="total > pageSize"
          class="records-pagination"
        >
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="fetchRecords"
          />
        </div>
      </div>

      <!-- 积分规则说明 -->
      <div class="points-rules">
        <h3>积分规则</h3>
        <div class="rules-list">
          <div class="rule-item">
            <el-icon><Download /></el-icon>
            <div class="rule-content">
              <h4>下载消费</h4>
              <p>下载付费资源时扣除相应积分</p>
            </div>
          </div>
          <div class="rule-item">
            <el-icon><Upload /></el-icon>
            <div class="rule-content">
              <h4>上传奖励</h4>
              <p>上传资源审核通过后获得积分奖励</p>
            </div>
          </div>
          <div class="rule-item">
            <el-icon><Star /></el-icon>
            <div class="rule-content">
              <h4>VIP特权</h4>
              <p>VIP用户下载VIP资源不消耗积分</p>
            </div>
          </div>
          <div class="rule-item">
            <el-icon><Wallet /></el-icon>
            <div class="rule-content">
              <h4>积分充值</h4>
              <p>可通过充值获取更多积分</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Coin, Download, Upload, Star, Wallet, Plus, Minus, Present, ArrowLeft, Loading, ShoppingCart } from '@element-plus/icons-vue';
import { useUserStore } from '@/pinia/userStore';
import { getPointsRecords, type PointsRecord as ApiPointsRecord, type PointsRechargePackage } from '@/api/points';
import { usePointsSync } from '@/composables/usePointsSync';
import { formatTime } from '@/utils/format';

// 本地使用的积分记录类型（简化版）
interface PointsRecord {
  recordId: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

// 扩展充值套餐类型，添加推荐标识
interface RechargePackageWithRecommend extends PointsRechargePackage {
  recommended?: boolean;
}

const userStore = useUserStore();
const router = useRouter();
const { refreshPoints, refreshing } = usePointsSync();
const pointsBalance = computed(() => userStore.pointsBalance);

const loading = ref(false);
const records = ref<PointsRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const recordType = ref('');

// 充值相关状态
const selectedPackage = ref<string>('');
const rechargePackages = ref<RechargePackageWithRecommend[]>([
  {
    packageId: 'pkg-1',
    packageName: '入门套餐',
    points: 100,
    price: 10,
    discount: 1,
    description: '适合轻度使用',
    recommended: false
  },
  {
    packageId: 'pkg-2',
    packageName: '标准套餐',
    points: 500,
    price: 45,
    discount: 0.9,
    description: '9折优惠',
    recommended: false
  },
  {
    packageId: 'pkg-3',
    packageName: '超值套餐',
    points: 1000,
    price: 80,
    discount: 0.8,
    description: '8折优惠，最受欢迎',
    recommended: true
  },
  {
    packageId: 'pkg-4',
    packageName: '豪华套餐',
    points: 2000,
    price: 150,
    discount: 0.75,
    description: '7.5折优惠，超值之选',
    recommended: false
  },
  {
    packageId: 'pkg-5',
    packageName: '至尊套餐',
    points: 5000,
    price: 350,
    discount: 0.7,
    description: '7折优惠，专业用户首选',
    recommended: false
  }
]);

/**
 * 返回上一页
 */
function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
}

/**
 * 跳转到积分商城
 */
function goToMall() {
  router.push('/points/mall');
}

/**
 * 获取积分记录
 */
async function fetchRecords() {
  loading.value = true;
  try {
    const res = await getPointsRecords({
      pageNum: page.value,
      pageSize: pageSize.value,
      changeType: recordType.value || undefined
    });
    if (res.code === 200 || res.code === 0) {
      // 将API返回的记录转换为本地格式
      const apiRecords = res.data.list || [];
      records.value = apiRecords.map((record: ApiPointsRecord) => ({
        recordId: record.recordId,
        type: record.changeType,
        amount: record.pointsChange,
        description: record.description,
        createdAt: record.createdAt
      }));
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error('获取积分记录失败:', error);
    ElMessage.warning('暂时无法加载积分记录');
  } finally {
    loading.value = false;
  }
}

/**
 * 获取记录类型样式类
 */
function getRecordTypeClass(type: string): string {
  const classMap: Record<string, string> = {
    recharge: 'type-recharge',
    consume: 'type-consume',
    reward: 'type-reward'
  };
  return classMap[type] || 'type-default';
}

/**
 * 获取记录类型图标
 */
function getRecordIcon(type: string) {
  const iconMap: Record<string, typeof Plus | typeof Minus | typeof Present | typeof Coin> = {
    recharge: Plus,
    consume: Minus,
    reward: Present
  };
  return iconMap[type] || Coin;
}

/**
 * 选择充值套餐
 */
function selectPackage(packageId: string) {
  selectedPackage.value = packageId;
}

/**
 * 处理充值按钮点击（滚动到充值区域）
 */
function handleRecharge() {
  const rechargeSection = document.querySelector('.points-recharge-section');
  if (rechargeSection) {
    rechargeSection.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * 确认充值
 */
async function confirmRecharge() {
  if (!selectedPackage.value) {
    ElMessage.warning('请先选择充值套餐');
    return;
  }

  const pkg = rechargePackages.value.find(p => p.packageId === selectedPackage.value);
  if (!pkg) {
    ElMessage.error('套餐信息错误');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确认充值 ${pkg.points} 积分，支付 ¥${pkg.price}？`,
      '确认充值',
      {
        confirmButtonText: '确认支付',
        cancelButtonText: '取消',
        type: 'info'
      }
    );

    // 显示支付功能开发中提示
    ElMessage.info('支付功能正在开发中，敬请期待！');
  } catch {
    // 用户取消
  }
}

/**
 * 手动刷新积分余额
 */
async function handleRefreshPoints() {
  const result = await refreshPoints(true);
  if (result.success) {
    ElMessage.success('积分已刷新');
    // 同时刷新积分记录
    fetchRecords();
  } else {
    ElMessage.warning(result.error || '刷新失败，请稍后重试');
  }
}

onMounted(() => {
  // 进入页面时刷新积分余额
  refreshPoints(true);
  fetchRecords();
});

// 页面被激活时（从缓存恢复）也刷新积分
onActivated(() => {
  refreshPoints(true);
  fetchRecords();
});
</script>

<style scoped lang="scss">
.points-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 0;
}

.points-container {
  max-width: 100%;
  margin: 0 auto;
}

/* 积分余额卡片 - 完全复刻截图样式 */
.points-balance-card {
  background: linear-gradient(180deg, #f5a623 0%, #f7b84e 100%);
  border-radius: 0 0 20px 20px;
  padding: 16px 20px 28px;
  color: #fff;
  margin-bottom: 24px;
}

/* 返回按钮 */
.card-back-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 15px;
  color: #fff;
  cursor: pointer;
  margin-bottom: 20px;
  width: fit-content;

  &:hover {
    opacity: 0.85;
  }

  .el-icon {
    font-size: 18px;
  }
}

/* 卡片主体内容 */
.card-main-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 积分图标 - 线条样式 */
.balance-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);

  svg {
    width: 100%;
    height: 100%;
  }
}

.balance-details {
  .balance-title {
    font-size: 15px;
    font-weight: 500;
    margin: 0 0 6px 0;
    color: #fff;
  }

  .balance-value {
    font-size: 40px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    letter-spacing: -1px;

    &.refreshing {
      opacity: 0.7;
    }

    .refresh-icon {
      animation: spin 1s linear infinite;
    }
  }

  .balance-tip {
    font-size: 13px;
    margin: 0;
    color: rgba(255, 255, 255, 0.85);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 操作按钮 */
.balance-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  border: none;
  border-radius: 18px;
  padding: 8px 18px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.action-btn.refresh-btn {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.4);
  }
}

.action-btn.mall-btn {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
  }
}

.action-btn.recharge-btn {
  background: #fff;
  color: #f5a623;
  font-weight: 500;

  &:hover {
    background: rgba(255, 255, 255, 0.95);
  }
}

/* 积分充值区域 */
.points-recharge-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin: 0 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 积分明细 */
.points-records {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin: 0 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }

  .el-select {
    width: 140px;
  }
}

.records-list {
  min-height: 200px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.record-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.record-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;

  &.type-recharge {
    background: #e6f7ff;
    color: #1890ff;
  }

  &.type-consume {
    background: #fff2e8;
    color: #fa541c;
  }

  &.type-reward {
    background: #f6ffed;
    color: #52c41a;
  }

  &.type-default {
    background: #f5f5f5;
    color: #909399;
  }
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .record-title {
    font-size: 14px;
    color: #303133;
  }

  .record-time {
    font-size: 12px;
    color: #909399;
  }
}

.record-amount {
  font-size: 16px;
  font-weight: 600;

  &.positive {
    color: #52c41a;
  }

  &.negative {
    color: #fa541c;
  }
}

.records-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 积分充值区域 */
.points-recharge-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 积分充值区域 - 内部样式 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;

    .el-icon {
      color: #f5a623;
    }
  }

  .section-tip {
    font-size: 12px;
    color: #909399;
  }
}

.recharge-packages {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.package-card {
  position: relative;
  background: #fafafa;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  padding: 16px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.package-card:hover {
  border-color: #f5a623;
  background: #fffbeb;
}

/* 选中状态 - 最高优先级 */
.package-card.selected {
  border-color: #f5a623 !important;
  background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%) !important;
  box-shadow: 0 0 0 2px rgba(245, 166, 35, 0.2);
}

/* 推荐标签样式 - 不影响边框 */
.package-card.recommended {
  background: #fafafa;
}

/* 推荐+选中状态 */
.package-card.recommended.selected {
  border-color: #f5a623 !important;
  background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%) !important;
}

.recommend-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: linear-gradient(135deg, #f5a623 0%, #f7b84e 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 8px;
  z-index: 1;
}

.package-points {
  margin-bottom: 6px;

  .points-value {
    font-size: 28px;
    font-weight: 700;
    color: #f5a623;
  }

  .points-unit {
    font-size: 13px;
    color: #909399;
    margin-left: 2px;
  }
}

.package-price {
  margin-bottom: 6px;

  .price-symbol {
    font-size: 13px;
    color: #303133;
  }

  .price-value {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.package-discount {
  display: inline-block;
  background: #ff4d4f;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.package-desc {
  font-size: 11px;
  color: #909399;
  line-height: 1.4;
}

.recharge-actions {
  display: flex;
  justify-content: center;

  .el-button {
    min-width: 200px;
    font-size: 16px;
    height: 48px;
  }
}

/* 积分规则 */
.points-rules {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin: 0 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 20px 0;
  }
}

.rules-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;

  .el-icon {
    font-size: 24px;
    color: #f59e0b;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .rule-content {
    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 4px 0;
    }

    p {
      font-size: 13px;
      color: #909399;
      margin: 0;
    }
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .card-main-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .balance-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .recharge-packages {
    grid-template-columns: repeat(2, 1fr);
  }

  .package-card {
    padding: 16px 12px;
  }

  .package-points .points-value {
    font-size: 24px;
  }

  .package-price .price-value {
    font-size: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .rules-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .recharge-packages {
    grid-template-columns: 1fr;
  }
}
</style>
