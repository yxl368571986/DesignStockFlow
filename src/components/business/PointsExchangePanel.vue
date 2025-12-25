<script setup lang="ts">
/**
 * 积分兑换面板组件
 * 用于积分兑换VIP会员
 */

import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Close, Warning, InfoFilled } from '@element-plus/icons-vue';
import { useVipStore } from '@/pinia/vipStore';
import { useUserStore } from '@/pinia/userStore';

interface Props {
  /** 是否显示 */
  visible?: boolean;
}

withDefaults(defineProps<Props>(), {
  visible: true
});

const emit = defineEmits<{
  success: [];
  close: [];
}>();

const vipStore = useVipStore();
const userStore = useUserStore();

/** 选择的月数 */
const selectedMonths = ref(1);

/** 兑换中 */
const exchanging = ref(false);

/** 用户积分 */
const userPoints = computed(() => userStore.pointsBalance);

/** 兑换信息 */
const exchangeInfo = computed(() => vipStore.pointsExchangeInfo);

/** 每月所需积分 */
const pointsPerMonth = computed(() => exchangeInfo.value?.pointsRequired || 1000);

/** 总所需积分 */
const totalPoints = computed(() => pointsPerMonth.value * selectedMonths.value);

/** 是否可以兑换 */
const canExchange = computed(() => {
  if (!exchangeInfo.value) return false;
  if (exchangeInfo.value.hasExchangedThisMonth) return false;
  if (userPoints.value < totalPoints.value) return false;
  return true;
});

/** 不可兑换原因 */
const disabledReason = computed(() => {
  if (!exchangeInfo.value) return '加载中...';
  if (exchangeInfo.value.hasExchangedThisMonth) return '本月已兑换过，下月再来';
  if (userPoints.value < totalPoints.value) {
    return `积分不足，还需${totalPoints.value - userPoints.value}积分`;
  }
  return '';
});

/** 月数选项 */
const monthOptions = computed(() => {
  const max = exchangeInfo.value?.maxMonths || 3;
  return Array.from({ length: max }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}个月`,
    points: pointsPerMonth.value * (i + 1)
  }));
});

/** 执行兑换 */
async function handleExchange() {
  if (!canExchange.value) return;
  
  try {
    await ElMessageBox.confirm(
      `确定使用 ${totalPoints.value} 积分兑换 ${selectedMonths.value} 个月VIP会员吗？`,
      '确认兑换',
      {
        confirmButtonText: '确定兑换',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    exchanging.value = true;
    const success = await vipStore.exchangePointsForVip(selectedMonths.value);
    
    if (success) {
      ElMessage.success('兑换成功！VIP会员已开通');
      emit('success');
    } else {
      ElMessage.error('兑换失败，请稍后重试');
    }
  } catch (error) {
    // 用户取消
    if (error !== 'cancel') {
      ElMessage.error('兑换失败，请稍后重试');
    }
  } finally {
    exchanging.value = false;
  }
}

// 加载兑换信息
onMounted(() => {
  vipStore.fetchPointsExchangeInfo();
});
</script>

<template>
  <div v-if="visible" class="points-exchange-panel">
    <div class="panel-header">
      <h3 class="panel-title">积分兑换VIP</h3>
      <el-button text @click="emit('close')">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    
    <div class="panel-content">
      <!-- 积分余额 -->
      <div class="points-balance">
        <span class="balance-label">当前积分</span>
        <span class="balance-value">{{ userPoints }}</span>
      </div>
      
      <!-- 兑换时长选择 -->
      <div class="exchange-options">
        <div class="options-label">选择兑换时长</div>
        <div class="options-list">
          <div
            v-for="option in monthOptions"
            :key="option.value"
            class="option-item"
            :class="{ active: selectedMonths === option.value }"
            @click="selectedMonths = option.value"
          >
            <span class="option-label">{{ option.label }}</span>
            <span class="option-points">{{ option.points }}积分</span>
          </div>
        </div>
      </div>
      
      <!-- 兑换信息 -->
      <div class="exchange-info">
        <div class="info-row">
          <span>消耗积分</span>
          <span class="info-value">{{ totalPoints }}</span>
        </div>
        <div class="info-row">
          <span>获得VIP</span>
          <span class="info-value">{{ selectedMonths }}个月</span>
        </div>
        <div class="info-row">
          <span>剩余积分</span>
          <span class="info-value">{{ Math.max(0, userPoints - totalPoints) }}</span>
        </div>
      </div>
      
      <!-- 提示信息 -->
      <div v-if="disabledReason" class="exchange-tip warning">
        <el-icon><Warning /></el-icon>
        <span>{{ disabledReason }}</span>
      </div>
      
      <div v-else class="exchange-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>每月限兑换一次，兑换后立即生效</span>
      </div>
      
      <!-- 兑换按钮 -->
      <el-button
        type="primary"
        size="large"
        :disabled="!canExchange"
        :loading="exchanging"
        class="exchange-button"
        @click="handleExchange"
      >
        {{ exchanging ? '兑换中...' : '立即兑换' }}
      </el-button>
    </div>
  </div>
</template>



<style scoped>
.points-exchange-panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #E4E7ED;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.panel-content {
  padding: 20px;
}

.points-balance {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.balance-label {
  font-size: 14px;
  color: #666;
}

.balance-value {
  font-size: 24px;
  font-weight: 600;
  color: #FF9800;
}

.exchange-options {
  margin-bottom: 20px;
}

.options-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.options-list {
  display: flex;
  gap: 12px;
}

.option-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border: 2px solid #E4E7ED;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #409EFF;
}

.option-item.active {
  border-color: #409EFF;
  background: #ECF5FF;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.option-points {
  font-size: 12px;
  color: #909399;
}

.exchange-info {
  background: #F5F7FA;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
}

.info-row .info-value {
  font-weight: 500;
  color: #333;
}

.exchange-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #F0F9FF;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #409EFF;
}

.exchange-tip.warning {
  background: #FFF3E0;
  color: #E6A23C;
}

.exchange-button {
  width: 100%;
}
</style>
