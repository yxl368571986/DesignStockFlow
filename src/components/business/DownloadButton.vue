<!--
  下载按钮组件
  
  功能：
  - 显示下载按钮（根据VIP等级显示不同样式）
  - 点击触发下载（调用useDownload）
  - 显示下载中状态（loading动画）
  - 未登录显示确认对话框
  - 非VIP显示升级提示
  
  需求: 需求4.1-4.4（资源下载）
-->

<script setup lang="ts">
import { computed } from 'vue';
import { Download } from '@element-plus/icons-vue';
import { useDownload } from '@/composables/useDownload';
import { useUserStore } from '@/pinia/userStore';

/**
 * 下载按钮组件
 */

// Props定义
interface DownloadButtonProps {
  /** 资源ID */
  resourceId: string;
  /** 资源所需的VIP等级（0-普通用户可下载，1-需要VIP） */
  vipLevel?: number;
  /** 下载所需积分 */
  pointsCost?: number;
  /** 按钮类型 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  /** 按钮大小 */
  size?: 'large' | 'default' | 'small';
  /** 是否为圆形按钮 */
  circle?: boolean;
  /** 是否为圆角按钮 */
  round?: boolean;
  /** 是否为朴素按钮 */
  plain?: boolean;
  /** 按钮文本（不传则只显示图标） */
  text?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<DownloadButtonProps>(), {
  vipLevel: 0,
  pointsCost: 0,
  type: 'primary',
  size: 'default',
  circle: false,
  round: false,
  plain: false,
  text: '',
  disabled: false
});

// Emits定义
const emit = defineEmits<{
  success: [resourceId: string];
  error: [error: string];
}>();

// 使用下载组合式函数和用户store
const { downloading, handleDownload } = useDownload();
const userStore = useUserStore();

// 计算属性：按钮类型（VIP资源使用warning样式）
const buttonType = computed(() => {
  if (props.vipLevel > 0) {
    return 'warning';
  }
  return props.type;
});

// 计算属性：按钮文本
const buttonText = computed(() => {
  if (downloading.value) {
    return '下载中...';
  }

  // 未登录用户
  if (!userStore.isLoggedIn) {
    return '登录后下载';
  }

  // VIP用户
  if (userStore.isVIP) {
    return props.text || 'VIP免费下载';
  }

  // 普通用户
  if (props.pointsCost === 0) {
    return props.text || '免费下载';
  }

  return props.text || `${props.pointsCost}积分下载`;
});

// 计算属性：是否显示图标
const showIcon = computed(() => {
  return !props.text || props.circle;
});

// 处理下载点击
async function handleClick() {
  if (props.disabled || downloading.value) {
    return;
  }

  const result = await handleDownload(props.resourceId, props.vipLevel, props.pointsCost);

  if (result.success) {
    emit('success', props.resourceId);
  } else if (result.error) {
    emit('error', result.error);
  }
}
</script>

<template>
  <el-button
    :type="buttonType"
    :size="props.size"
    :circle="props.circle"
    :round="props.round"
    :plain="props.plain"
    :loading="downloading"
    :disabled="props.disabled"
    :icon="showIcon ? Download : undefined"
    @click="handleClick"
  >
    <template v-if="!props.circle && props.text">
      {{ buttonText }}
    </template>
  </el-button>
</template>

<style scoped>
/* VIP按钮特殊样式 */
.el-button--warning {
  background: linear-gradient(135deg, #ff7d00 0%, #ffb800 100%);
  border-color: #ff7d00;
  color: #fff;
}

.el-button--warning:hover {
  background: linear-gradient(135deg, #ff9500 0%, #ffc800 100%);
  border-color: #ff9500;
}

.el-button--warning:active {
  background: linear-gradient(135deg, #e67000 0%, #e6a600 100%);
  border-color: #e67000;
}

.el-button--warning.is-plain {
  background: transparent;
  border-color: #ff7d00;
  color: #ff7d00;
}

.el-button--warning.is-plain:hover {
  background: rgba(255, 125, 0, 0.1);
  border-color: #ff9500;
  color: #ff9500;
}

/* 下载中状态 */
.el-button.is-loading {
  pointer-events: none;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .el-button {
    font-size: 13px;
  }

  .el-button--large {
    font-size: 14px;
  }

  .el-button--small {
    font-size: 12px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .el-button--warning {
    background: linear-gradient(135deg, #ff7d00 0%, #ffb800 100%);
  }

  .el-button--warning:hover {
    background: linear-gradient(135deg, #ff9500 0%, #ffc800 100%);
  }

  .el-button--warning.is-plain {
    background: transparent;
    border-color: #ff7d00;
    color: #ff7d00;
  }

  .el-button--warning.is-plain:hover {
    background: rgba(255, 125, 0, 0.15);
  }
}
</style>
