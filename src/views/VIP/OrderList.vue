<script setup lang="ts">
/**
 * VIP订单列表页面
 * 展示用户的VIP订单历史
 */

import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useVipStore } from '@/pinia/vipStore';
import type { VipOrder } from '@/api/vip';

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
  const map: Record<number, string> = {
    0: '待支付',
    1: '已支付',
    2: '已取消',
    3: '已退款',
    4: '支付失败'
  };
  return map[status] || '未知';
}

/** 获取状态类型 */
function getStatusType(status: number): string {
  const map: Record<number, string> = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'danger',
    4: 'danger'
  };
  return map[status] || 'info';
}

/** 获取支付方式文本 */
function getPaymentMethodText(method: string): string {
  const map: Record<string, string> = {
    wechat: '微信支付',
    alipay: '支付宝',
    points: '积分兑换'
  };
  return map[method] || method;
}

/** 格式化时间 */
function formatTime(time: string): string {
  if (!time) return '-';
  const date = new Date(time);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
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
    <div class="page-header">
      <h1 class="page-title">我的订单</h1>
      
      <!-- 状态筛选 -->
      <div class="filter-section">
        <el-radio-group v-model="statusFilter" @change="handleStatusChange">
          <el-radio-button
            v-for="option in statusOptions"
            :key="option.value ?? 'all'"
            :value="option.value"
          >
            {{ option.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>
    
    <div class="order-list-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-wrapper">
        <el-skeleton :rows="5" animated />
      </div>
      
      <!-- 空状态 -->
      <el-empty v-else-if="orders.length === 0" description="暂无订单" />
      
      <!-- 订单列表 -->
      <div v-else class="order-list">
        <div
          v-for="order in orders"
          :key="order.orderId"
          class="order-card"
        >
          <!-- 订单头部 -->
          <div class="order-header">
            <div class="order-no">
              <span class="label">订单号：</span>
              <span class="value">{{ order.orderNo }}</span>
            </div>
            <el-tag :type="getStatusType(order.paymentStatus)" size="small">
              {{ getStatusText(order.paymentStatus) }}
            </el-tag>
          </div>
          
          <!-- 订单内容 -->
          <div class="order-content">
            <div class="order-info">
              <h3 class="package-name">{{ order.packageName }}</h3>
              <div class="order-meta">
                <span>{{ getPaymentMethodText(order.paymentMethod) }}</span>
                <span class="divider">|</span>
                <span>{{ formatTime(order.createdAt) }}</span>
              </div>
            </div>
            <div class="order-amount">
              <span class="currency">¥</span>
              <span class="amount">{{ order.amount.toFixed(2) }}</span>
            </div>
          </div>
          
          <!-- 订单操作 -->
          <div class="order-actions">
            <el-button text type="primary" @click="viewOrder(order)">
              查看详情
            </el-button>
            
            <!-- 待支付：继续支付、取消订单 -->
            <template v-if="order.paymentStatus === 0">
              <el-button type="primary" size="small" @click="continuePay(order)">
                继续支付
              </el-button>
              <el-button size="small" @click="cancelOrder(order)">
                取消订单
              </el-button>
            </template>
            
            <!-- 已支付：申请退款（7天内） -->
            <template v-if="order.paymentStatus === 1">
              <el-button text type="warning" @click="requestRefund(order)">
                申请退款
              </el-button>
            </template>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-list-page {
  min-height: 100vh;
  background: #F5F7FA;
  padding: 24px;
}

.page-header {
  max-width: 800px;
  margin: 0 auto 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.filter-section {
  margin-bottom: 16px;
}

.order-list-container {
  max-width: 800px;
  margin: 0 auto;
}

.loading-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #E4E7ED;
  margin-bottom: 16px;
}

.order-no .label {
  font-size: 13px;
  color: #909399;
}

.order-no .value {
  font-size: 13px;
  color: #333;
  font-family: monospace;
}

.order-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.package-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.order-meta {
  font-size: 13px;
  color: #909399;
}

.order-meta .divider {
  margin: 0 8px;
  color: #E4E7ED;
}

.order-amount {
  text-align: right;
}

.order-amount .currency {
  font-size: 14px;
  color: #F56C6C;
}

.order-amount .amount {
  font-size: 24px;
  font-weight: 600;
  color: #F56C6C;
}

.order-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #E4E7ED;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .order-list-page {
    padding: 16px;
  }
  
  .order-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .order-amount {
    text-align: left;
  }
  
  .order-actions {
    flex-wrap: wrap;
  }
}
</style>
