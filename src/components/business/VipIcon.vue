<script setup lang="ts">
/**
 * VIP图标组件
 * 显示VIP状态图标，支持多种尺寸和状态
 * - 金色：有效VIP
 * - 灰色：7天宽限期
 * - 终身标签：红色背景白色文字
 */

interface Props {
  /** VIP状态: active-有效, grace-宽限期, lifetime-终身, none-非VIP */
  status?: 'active' | 'grace' | 'lifetime' | 'none';
  /** 图标尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 是否显示终身标签 */
  showLifetimeLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  status: 'none',
  size: 'medium',
  showLifetimeLabel: true
});

/** 尺寸映射 */
const sizeMap = {
  small: { icon: 16, label: 10 },
  medium: { icon: 20, label: 12 },
  large: { icon: 28, label: 14 }
};

/** 获取图标颜色 */
const iconColor = computed(() => {
  switch (props.status) {
    case 'active':
    case 'lifetime':
      return '#FFD700'; // 金色
    case 'grace':
      return '#9CA3AF'; // 灰色
    default:
      return 'transparent';
  }
});

/** 是否显示图标 */
const showIcon = computed(() => {
  return props.status !== 'none';
});

/** 是否显示终身标签 */
const showLabel = computed(() => {
  return props.status === 'lifetime' && props.showLifetimeLabel;
});

import { computed } from 'vue';
</script>

<template>
  <span v-if="showIcon" class="vip-icon-wrapper" :class="[`size-${size}`]">
    <!-- VIP图标 -->
    <svg
      class="vip-icon"
      :width="sizeMap[size].icon"
      :height="sizeMap[size].icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- 皇冠图标 -->
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        :fill="iconColor"
        :stroke="status === 'grace' ? '#6B7280' : '#B8860B'"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    
    <!-- 终身标签 -->
    <span v-if="showLabel" class="lifetime-label" :style="{ fontSize: `${sizeMap[size].label}px` }">
      终身
    </span>
  </span>
</template>

<style scoped>
.vip-icon-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.vip-icon {
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.lifetime-label {
  background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
  line-height: 1.2;
}

/* 尺寸变体 */
.size-small {
  gap: 2px;
}

.size-small .lifetime-label {
  padding: 1px 4px;
  border-radius: 3px;
}

.size-large {
  gap: 6px;
}

.size-large .lifetime-label {
  padding: 3px 8px;
  border-radius: 5px;
}
</style>
