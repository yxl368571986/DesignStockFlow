<script setup lang="ts">
/**
 * VIP徽章组件
 * 用于在头像旁显示VIP状态徽章
 */

import VipIcon from './VipIcon.vue';

interface Props {
  /** VIP状态 */
  status?: 'active' | 'grace' | 'lifetime' | 'none';
  /** 徽章位置 */
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  /** 图标尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 是否显示终身标签 */
  showLifetimeLabel?: boolean;
}

withDefaults(defineProps<Props>(), {
  status: 'none',
  position: 'bottom-right',
  size: 'small',
  showLifetimeLabel: false
});
</script>

<template>
  <div class="vip-badge-wrapper">
    <!-- 默认插槽：头像或其他内容 -->
    <slot />
    
    <!-- VIP徽章 -->
    <div v-if="status !== 'none'" class="vip-badge" :class="[`position-${position}`]">
      <VipIcon :status="status" :size="size" :show-lifetime-label="showLifetimeLabel" />
    </div>
  </div>
</template>

<style scoped>
.vip-badge-wrapper {
  position: relative;
  display: inline-block;
}

.vip-badge {
  position: absolute;
  z-index: 1;
  background: #fff;
  border-radius: 50%;
  padding: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 位置变体 */
.position-top-right {
  top: -4px;
  right: -4px;
}

.position-bottom-right {
  bottom: -4px;
  right: -4px;
}

.position-top-left {
  top: -4px;
  left: -4px;
}

.position-bottom-left {
  bottom: -4px;
  left: -4px;
}
</style>
