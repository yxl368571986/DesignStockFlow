<script setup lang="ts">
/**
 * 支付成功页面
 * 显示支付成功信息和后续操作引导
 */

import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CircleCheckFilled } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

/** 订单号 */
const orderNo = computed(() => route.query.orderNo as string || '');

/** 套餐名称 */
const packageName = computed(() => route.query.packageName as string || 'VIP会员');

/** 返回首页 */
function goHome() {
  router.push('/');
}

/** 查看订单 */
function goToOrders() {
  router.push('/vip/orders');
}

/** 继续浏览 */
function goToVip() {
  router.push('/vip');
}

onMounted(() => {
  // 如果没有订单号，跳转到VIP中心
  if (!orderNo.value) {
    router.replace('/vip');
  }
});
</script>

<template>
  <div class="payment-success-page">
    <div class="success-card">
      <div class="success-icon">
        <el-icon
          :size="80"
          color="#67C23A"
        >
          <CircleCheckFilled />
        </el-icon>
      </div>
      
      <h1 class="success-title">
        支付成功
      </h1>
      
      <p class="success-desc">
        恭喜您成功开通{{ packageName }}，现在可以享受VIP专属特权了！
      </p>
      
      <div
        v-if="orderNo"
        class="order-info"
      >
        <span class="label">订单号：</span>
        <span class="value">{{ orderNo }}</span>
      </div>
      
      <div class="action-buttons">
        <el-button
          type="primary"
          size="large"
          @click="goHome"
        >
          返回首页
        </el-button>
        <el-button
          size="large"
          @click="goToOrders"
        >
          查看订单
        </el-button>
        <el-button
          size="large"
          @click="goToVip"
        >
          VIP中心
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-success-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F7FA;
  padding: 20px;
}

.success-card {
  background: #fff;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.success-icon {
  margin-bottom: 24px;
}

.success-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.success-desc {
  font-size: 16px;
  color: #666;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.order-info {
  background: #F5F7FA;
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 32px;
  font-size: 14px;
}

.order-info .label {
  color: #909399;
}

.order-info .value {
  color: #333;
  font-family: monospace;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .success-card {
    padding: 40px 24px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
