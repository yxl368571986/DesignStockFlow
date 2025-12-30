<script setup lang="ts">
/**
 * VIP订单列表页面
 * 展示用户的VIP订单历史
 */

import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Clock, Star } from '@element-plus/icons-vue';
import { useVipStore } from '@/pinia/vipStore';
import type { VipOrder } from '@/api/vip';
import { getVipOrderStatusText, getVipOrderStatusType, getPaymentMethodText as getPaymentText } from '@/utils/status';
import { formatTime as formatDateTime } from '@/utils/format';

const router = useRouter();
const vipStore = useVipStore();

/** 当前页码 */
const currentPage = ref(1);

/** 每页数量 */
const pageSize = ref(10);

/** 状态筛选 */
const statusFilter = ref<number | undefined>(undefined);

/** 订单列表 */
const orders = computed(() => vipStore.orders);

/** 订单总数 */
const total = computed(() => vipStore.orderTotal);

/** 加载状态 */
const loading = computed(() => vipStore.loading);

/** 状态选项 */
const statusOptions = [
  { label: '全部', value: undefined },
  { label: '待支付', value: 0 },
  { label: '已支付', value: 1 },
  { label: '已取消', value: 2 },
  { label: '已退款', value: 3 }
];

/** 获取状态文本 */
function getStatusText(status: number): string {
  return getVipOrderStatusText(status);
}

/** 获取状态类型 */
function getStatusType(status: number): string {
  return getVipOrderStatusType(status);
}

/** 获取支付方式文本 */
function getPaymentMethodText(method: string): string {
  return getPaymentText(method);
}

/** 格式化时间 */
function formatTime(time: string): string {
  if (!time) return '-';
  return formatDateTime(time, 'YYYY-MM-DD HH:mm');
}

/** 加载订单列表 */
async function loadOrders() {
  await vipStore.fetchOrders({
    page: currentPage.value,
    pageSize: pageSize.value,
    status: statusFilter.value
  });
}

/** 处理页码变化 */
function handlePageChange(page: number) {
  currentPage.value = page;
  loadOrders();
}

/** 处理状态筛选变化 */
function handleStatusChange() {
  currentPage.value = 1;
  loadOrders();
}

/** 查看订单详情 */
function viewOrder(order: VipOrder) {
  router.push(`/vip/orders/${order.orderNo}`);
}

/** 继续支付 */
async function continuePay(order: VipOrder) {
  router.push({
    path: '/vip',
    query: { orderNo: order.orderNo }
  });
}

/** 取消订单 */
async function cancelOrder(order: VipOrder) {
  try {
    await ElMessageBox.confirm(
      '确定要取消该订单吗？取消后无法恢复。',
      '取消订单',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '暂不取消',
        type: 'warning'
      }
    );
    
    const success = await vipStore.cancelOrder(order.orderNo);
    if (success) {
      ElMessage.success('订单已取消');
      loadOrders();
    } else {
      ElMessage.error('取消失败');
    }
  } catch {
    // 用户取消操作
  }
}

/** 申请退款 */
function requestRefund(order: VipOrder) {
  router.push(`/vip/orders/${order.orderNo}?action=refund`);
}

// 初始化
onMounted(() => {
  loadOrders();
});
</script>

<template>
  <div class="order-list-page">
    <!-- 页面容器 -->
    <div class="page-container">
      <!-- 返回按钮 -->
      <div class="back-section">
        <el-button class="back-button" text @click="router.back()">
          <el-icon>
            <ArrowLeft />
          </el-icon>
          <span>返回</span>
        </el-button>
      </div>

      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">
          我的订单
        </h1>
        <p class="page-subtitle">
          查看和管理您的VIP订单
        </p>
      </div>

      <!-- 状态筛选 -->
      <div class="filter-section">
        <el-radio-group
          v-model="statusFilter"
          @change="handleStatusChange"
        >
          <el-radio-button
            v-for="option in statusOptions"
            :key="option.value ?? 'all'"
            :value="option.value"
          >
            {{ option.label }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 加载状态 -->
      <div
        v-if="loading"
        class="loading-wrapper"
      >
        <el-skeleton :rows="3" animated />
        <el-skeleton :rows="3" animated style="margin-top: 16px" />
      </div>

      <!-- 空状态 -->
      <el-empty
        v-else-if="orders.length === 0"
        description="暂无订单记录"
        class="empty-state"
      >
        <el-button
          type="primary"
          @click="router.push('/vip')"
        >
          去开通VIP
        </el-button>
      </el-empty>

      <!-- 订单列表 -->
      <div
        v-else
        class="order-list"
      >
        <div
          v-for="order in orders"
          :key="order.orderId"
          class="order-card"
        >
          <!-- 订单头部 -->
          <div class="order-header">
            <div class="order-info-left">
              <div class="order-no">
                <span class="label">订单号</span>
                <span class="value">{{ order.orderNo }}</span>
              </div>
              <div class="order-time">
                <el-icon class="time-icon">
                  <Clock />
                </el-icon>
                <span>{{ formatTime(order.createdAt) }}</span>
              </div>
            </div>
            <el-tag
              :type="getStatusType(order.paymentStatus)"
              size="large"
              effect="dark"
              class="status-tag"
            >
              {{ getStatusText(order.paymentStatus) }}
            </el-tag>
          </div>

          <!-- 订单内容 -->
          <div class="order-body">
            <div class="package-info">
              <div class="package-icon">
                <el-icon>
                  <Star />
                </el-icon>
              </div>
              <div class="package-details">
                <h3 class="package-name">
                  {{ order.packageName }}
                </h3>
                <div class="package-meta">
                  <el-tag
                    size="small"
                    type="info"
                  >
                    {{ getPaymentMethodText(order.paymentMethod) }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div class="order-amount">
              <div class="amount-label">
                订单金额
              </div>
              <div class="amount-value">
                <span class="currency">¥</span>
                <span class="amount">{{ order.amount.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- 订单操作 -->
          <div class="order-footer">
            <el-button
              text
              type="info"
              @click="viewOrder(order)"
            >
              查看详情
            </el-button>

            <!-- 待支付：继续支付、取消订单 -->
            <div
              v-if="order.paymentStatus === 0"
              class="action-buttons"
            >
              <el-button
                size="default"
                @click="cancelOrder(order)"
              >
                取消订单
              </el-button>
              <el-button
                type="primary"
                size="default"
                @click="continuePay(order)"
              >
                继续支付
              </el-button>
            </div>

            <!-- 已支付：申请退款 -->
            <div
              v-if="order.paymentStatus === 1"
              class="action-buttons"
            >
              <el-button
                type="warning"
                size="default"
                plain
                @click="requestRefund(order)"
              >
                申请退款
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div
        v-if="total > pageSize"
        class="pagination-wrapper"
      >
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.order-list-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
  padding: 24px;
}

.page-container {
  max-width: 900px;
  margin: 0 auto;
}

/* 返回按钮 */
.back-section {
  margin-bottom: 20px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.back-button:hover {
  color: #165DFF;
  background: rgba(22, 93, 255, 0.08);
}

.back-button .el-icon {
  font-size: 16px;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1d2129;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 14px;
  color: #86909c;
  margin: 0;
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 加载状态 */
.loading-wrapper {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* 空状态 */
.empty-state {
  background: #fff;
  border-radius: 16px;
  padding: 60px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* 订单列表 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 订单卡片 */
.order-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.order-card:hover {
  box-shadow: 0 4px 20px rgba(22, 93, 255, 0.12);
  border-color: rgba(22, 93, 255, 0.1);
  transform: translateY(-2px);
}

/* 订单头部 */
.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 2px solid #f2f3f5;
  margin-bottom: 20px;
}

.order-info-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-no {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-no .label {
  font-size: 12px;
  color: #86909c;
  font-weight: 500;
}

.order-no .value {
  font-size: 13px;
  color: #1d2129;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  background: #f2f3f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.order-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #86909c;
}

.time-icon {
  font-size: 14px;
}

.status-tag {
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
}

/* 订单内容 */
.order-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 20px;
}

.package-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.package-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.package-details {
  flex: 1;
}

.package-name {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 8px 0;
}

.package-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-amount {
  text-align: right;
  padding: 12px 20px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
  border-radius: 12px;
  border: 2px solid #ffebeb;
}

.amount-label {
  font-size: 12px;
  color: #86909c;
  margin-bottom: 4px;
  font-weight: 500;
}

.amount-value {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
}

.amount-value .currency {
  font-size: 16px;
  color: #f53f3f;
  font-weight: 600;
  margin-right: 2px;
}

.amount-value .amount {
  font-size: 28px;
  font-weight: 700;
  color: #f53f3f;
  line-height: 1;
}

/* 订单操作 */
.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 2px solid #f2f3f5;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .order-list-page {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .filter-section {
    padding: 12px;
  }

  .order-card {
    padding: 16px;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .order-body {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-amount {
    width: 100%;
    text-align: left;
  }

  .amount-value {
    justify-content: flex-start;
  }

  .order-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .action-buttons {
    width: 100%;
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .package-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .package-name {
    font-size: 16px;
  }
}
</style>
