<script setup lang="ts">
/**
 * 支付成功弹窗组件
 * 显示支付成功信息和后续操作引导
 */

import { computed } from 'vue';
import { useRouter } from 'vue-router';
import VipIcon from './VipIcon.vue';

interface Props {
  /** 是否显示 */
  visible: boolean;
  /** 订单号 */
  orderNo: string;
  /** 套餐名称 */
  packageName: string;
  /** 支付金额 */
  amount: number;
  /** VIP到期时间 */
  expireAt: string;
  /** 是否是终身VIP */
  isLifetime?: boolean;
  /** 来源资源ID（用于跳转回下载） */
  sourceResourceId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isLifetime: false,
  sourceResourceId: ''
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  close: [];
}>();

const router = useRouter();

/** 格式化到期时间 */
const formattedExpireAt = computed(() => {
  if (props.isLifetime) return '永久有效';
  const date = new Date(props.expireAt);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

/** 关闭弹窗 */
function handleClose() {
  emit('update:visible', false);
  emit('close');
}

/** 返回继续下载 */
function goBackToDownload() {
  handleClose();
  if (props.sourceResourceId) {
    router.push(`/resource/${props.sourceResourceId}`);
  }
}

/** 浏览更多资源 */
function browseResources() {
  handleClose();
  router.push('/');
}

/** 查看订单 */
function viewOrders() {
  handleClose();
  router.push('/vip/orders');
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title=""
    width="420px"
    :show-close="false"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
  >
    <div class="success-dialog-content">
      <!-- 成功图标 -->
      <div class="success-icon-wrapper">
        <el-icon class="success-icon"><CircleCheckFilled /></el-icon>
      </div>
      
      <!-- 成功标题 -->
      <h2 class="success-title">支付成功</h2>
      <p class="success-subtitle">恭喜您成为VIP会员！</p>
      
      <!-- VIP状态 -->
      <div class="vip-status">
        <VipIcon :status="isLifetime ? 'lifetime' : 'active'" size="large" />
        <span class="vip-label">{{ packageName }}</span>
      </div>
      
      <!-- 订单信息 -->
      <div class="order-info">
        <div class="info-row">
          <span class="label">订单号</span>
          <span class="value">{{ orderNo }}</span>
        </div>
        <div class="info-row">
          <span class="label">支付金额</span>
          <span class="value amount">¥{{ amount.toFixed(2) }}</span>
        </div>
        <div class="info-row">
          <span class="label">有效期至</span>
          <span class="value">{{ formattedExpireAt }}</span>
        </div>
      </div>
      
      <!-- 特权提示 -->
      <div class="privilege-tip">
        <el-icon><Star /></el-icon>
        <span>您现在可以无限下载所有VIP资源</span>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <!-- 有来源资源时显示返回下载按钮 -->
        <el-button
          v-if="sourceResourceId"
          type="primary"
          size="large"
          @click="goBackToDownload"
        >
          返回继续下载
        </el-button>
        
        <el-button
          :type="sourceResourceId ? 'default' : 'primary'"
          size="large"
          @click="browseResources"
        >
          浏览更多资源
        </el-button>
        
        <el-button text @click="viewOrders">
          查看订单
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { CircleCheckFilled, Star } from '@element-plus/icons-vue';
export default {
  components: { CircleCheckFilled, Star }
};
</script>

<style scoped>
.success-dialog-content {
  text-align: center;
  padding: 20px 0;
}

.success-icon-wrapper {
  margin-bottom: 16px;
}

.success-icon {
  font-size: 72px;
  color: #67C23A;
}

.success-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.success-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0 0 24px 0;
}

.vip-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  border-radius: 24px;
  margin-bottom: 24px;
}

.vip-label {
  font-size: 16px;
  font-weight: 600;
  color: #B8860B;
}

.order-info {
  background: #F5F7FA;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  text-align: left;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid #E4E7ED;
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
  color: #F56C6C;
  font-weight: 600;
}

.privilege-tip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #FFF3E0;
  border-radius: 8px;
  font-size: 14px;
  color: #E6A23C;
}

.dialog-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialog-footer .el-button {
  width: 100%;
  margin: 0;
}
</style>
