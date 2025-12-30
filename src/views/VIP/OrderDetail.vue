<script setup lang="ts">
/**
 * VIP订单详情页面
 */

import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getOrderDetail, requestRefund } from '@/api/vip';
import type { VipOrder } from '@/api/vip';
import { getVipOrderStatusText, getVipOrderStatusType, getPaymentMethodText as getPaymentText } from '@/utils/status';
import { formatTime as formatDateTime } from '@/utils/format';

const route = useRoute();
const router = useRouter();

/** 订单号 */
const orderNo = computed(() => route.params.orderNo as string);

/** 是否显示退款表单 */
const showRefundForm = computed(() => route.query.action === 'refund');

/** 订单详情 */
const order = ref<VipOrder | null>(null);

/** 加载状态 */
const loading = ref(true);

/** 退款原因 */
const refundReason = ref('');

/** 退款原因类型 */
const refundReasonType = ref('');

/** 提交退款中 */
const submittingRefund = ref(false);

/** 退款原因类型选项 */
const refundReasonTypes = [
  { label: '不想要了', value: 'unwanted' },
  { label: '误操作购买', value: 'mistake' },
  { label: '功能不符合预期', value: 'not_as_expected' },
  { label: '其他原因', value: 'other' }
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
  return formatDateTime(time, 'YYYY-MM-DD HH:mm:ss');
}

/** 是否可以退款 */
const canRefund = computed(() => {
  if (!order.value) return false;
  if (order.value.paymentStatus !== 1) return false;
  
  // 检查是否在7天内
  const paidAt = new Date(order.value.paidAt);
  const now = new Date();
  const diffDays = (now.getTime() - paidAt.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
});

/** 加载订单详情 */
async function loadOrder() {
  loading.value = true;
  try {
    const res = await getOrderDetail(orderNo.value);
    if (res.code === 200 && res.data) {
      order.value = res.data;
    } else {
      ElMessage.error('订单不存在');
      router.push('/vip/orders');
    }
  } catch (error) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
}

/** 提交退款申请 */
async function submitRefund() {
  if (!refundReasonType.value) {
    ElMessage.warning('请选择退款原因');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要申请退款吗？退款后VIP权益将立即失效。',
      '确认退款',
      {
        confirmButtonText: '确定退款',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    submittingRefund.value = true;
    const res = await requestRefund(orderNo.value, {
      reason: refundReason.value,
      reasonType: refundReasonType.value
    });
    
    if (res.code === 200) {
      ElMessage.success('退款申请已提交，请等待审核');
      router.push('/vip/orders');
    } else {
      ElMessage.error(res.msg || '提交失败');
    }
  } catch {
    // 用户取消
  } finally {
    submittingRefund.value = false;
  }
}

/** 返回订单列表 */
function goBack() {
  router.push('/vip/orders');
}

// 初始化
onMounted(() => {
  loadOrder();
});
</script>

<template>
  <div class="order-detail-page">
    <div class="page-container">
      <!-- 返回按钮 -->
      <div class="back-section">
        <el-button text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回订单列表
        </el-button>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-wrapper">
        <el-skeleton :rows="8" animated />
      </div>
      
      <template v-else-if="order">
        <!-- 订单状态 -->
        <div class="status-card">
          <el-tag :type="getStatusType(order.paymentStatus)" size="large">
            {{ getStatusText(order.paymentStatus) }}
          </el-tag>
          <p v-if="order.paymentStatus === 0" class="status-tip">
            请在15分钟内完成支付
          </p>
        </div>
        
        <!-- 订单信息 -->
        <div class="info-card">
          <h3 class="card-title">订单信息</h3>
          
          <div class="info-list">
            <div class="info-row">
              <span class="label">订单号</span>
              <span class="value">{{ order.orderNo }}</span>
            </div>
            <div class="info-row">
              <span class="label">套餐名称</span>
              <span class="value">{{ order.packageName }}</span>
            </div>
            <div class="info-row">
              <span class="label">订单金额</span>
              <span class="value amount">¥{{ order.amount.toFixed(2) }}</span>
            </div>
            <div class="info-row">
              <span class="label">支付方式</span>
              <span class="value">{{ getPaymentMethodText(order.paymentMethod) }}</span>
            </div>
            <div class="info-row">
              <span class="label">创建时间</span>
              <span class="value">{{ formatTime(order.createdAt) }}</span>
            </div>
            <div v-if="order.paidAt" class="info-row">
              <span class="label">支付时间</span>
              <span class="value">{{ formatTime(order.paidAt) }}</span>
            </div>
            <div v-if="order.transactionId" class="info-row">
              <span class="label">交易号</span>
              <span class="value">{{ order.transactionId }}</span>
            </div>
          </div>
        </div>
        
        <!-- 退款表单 -->
        <div v-if="showRefundForm && canRefund" class="refund-card">
          <h3 class="card-title">申请退款</h3>
          
          <el-form label-position="top">
            <el-form-item label="退款原因" required>
              <el-select v-model="refundReasonType" placeholder="请选择退款原因">
                <el-option
                  v-for="option in refundReasonTypes"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="补充说明">
              <el-input
                v-model="refundReason"
                type="textarea"
                :rows="3"
                placeholder="请输入补充说明（选填）"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item>
              <el-button
                type="primary"
                :loading="submittingRefund"
                @click="submitRefund"
              >
                提交退款申请
              </el-button>
            </el-form-item>
          </el-form>
          
          <div class="refund-notice">
            <h4>退款须知</h4>
            <ul>
              <li>退款申请提交后，将在1-3个工作日内审核</li>
              <li>审核通过后，退款将原路返回</li>
              <li>退款成功后，VIP权益将立即失效</li>
              <li>如有下载记录，可能影响退款审核</li>
            </ul>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div v-if="!showRefundForm" class="action-section">
          <el-button
            v-if="canRefund"
            type="warning"
            @click="router.push({ query: { action: 'refund' } })"
          >
            申请退款
          </el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue';
export default {
  components: { ArrowLeft }
};
</script>

<style scoped>
.order-detail-page {
  min-height: 100vh;
  background: #F5F7FA;
  padding: 24px;
}

.page-container {
  max-width: 600px;
  margin: 0 auto;
}

.back-section {
  margin-bottom: 16px;
}

.loading-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.status-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  margin-bottom: 16px;
}

.status-tip {
  margin: 12px 0 0 0;
  font-size: 14px;
  color: #E6A23C;
}

.info-card,
.refund-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #E4E7ED;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row .label {
  font-size: 14px;
  color: #909399;
}

.info-row .value {
  font-size: 14px;
  color: #333;
}

.info-row .value.amount {
  font-size: 18px;
  font-weight: 600;
  color: #F56C6C;
}

.refund-notice {
  margin-top: 24px;
  padding: 16px;
  background: #FFF3E0;
  border-radius: 8px;
}

.refund-notice h4 {
  font-size: 14px;
  font-weight: 600;
  color: #E6A23C;
  margin: 0 0 12px 0;
}

.refund-notice ul {
  margin: 0;
  padding-left: 20px;
}

.refund-notice li {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}

.action-section {
  text-align: center;
}

@media (max-width: 768px) {
  .order-detail-page {
    padding: 16px;
  }
}
</style>
