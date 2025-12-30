<!--
  定价徽章组件
  
  功能：
  - 免费资源显示「免费」绿色标签
  - 付费资源显示「X积分」橙色标签
  - VIP专属显示「VIP」红色标签
  
  需求: 7.1
-->

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** 定价类型: 0-免费, 1-付费积分, 2-VIP专属 */
  pricingType: number;
  /** 积分价格 (仅当pricingType=1时有效) */
  pointsCost?: number;
  /** 尺寸: small, default, large */
  size?: 'small' | 'default' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  pointsCost: 0,
  size: 'default',
});

// 徽章配置
const badgeConfig = computed(() => {
  switch (props.pricingType) {
    case 0: // 免费
      return {
        text: '免费',
        type: 'success' as const,
        icon: '🆓',
        className: 'badge-free',
      };
    case 1: // 付费积分
      return {
        text: `${props.pointsCost}积分`,
        type: 'warning' as const,
        icon: '💰',
        className: 'badge-paid',
      };
    case 2: // VIP专属
      return {
        text: 'VIP',
        type: 'danger' as const,
        icon: '👑',
        className: 'badge-vip',
      };
    default:
      return {
        text: '免费',
        type: 'success' as const,
        icon: '🆓',
        className: 'badge-free',
      };
  }
});

// 尺寸类名
const sizeClass = computed(() => `badge-${props.size}`);
</script>

<template>
  <el-tag
    :type="badgeConfig.type"
    :size="size === 'large' ? 'default' : size"
    :class="['pricing-badge', badgeConfig.className, sizeClass]"
    effect="dark"
    round
  >
    <span class="badge-icon">{{ badgeConfig.icon }}</span>
    <span class="badge-text">{{ badgeConfig.text }}</span>
  </el-tag>
</template>

<style scoped>
.pricing-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.badge-icon {
  font-size: 12px;
  line-height: 1;
}

.badge-text {
  line-height: 1;
}

/* 尺寸变体 */
.badge-small {
  padding: 2px 6px;
  font-size: 11px;
}

.badge-small .badge-icon {
  font-size: 10px;
}

.badge-default {
  padding: 4px 8px;
  font-size: 12px;
}

.badge-large {
  padding: 6px 12px;
  font-size: 14px;
}

.badge-large .badge-icon {
  font-size: 14px;
}

/* 免费徽章 */
.badge-free {
  background-color: #67c23a;
  border-color: #67c23a;
}

/* 付费徽章 */
.badge-paid {
  background-color: #ff7d00;
  border-color: #ff7d00;
}

/* VIP徽章 */
.badge-vip {
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  border-color: #f56c6c;
}
</style>
