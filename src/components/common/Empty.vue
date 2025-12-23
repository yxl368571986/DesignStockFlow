<!--
  空状态组件
  
  功能：
  - 显示空状态图标和文本
  - 支持自定义图标和描述
  - 支持操作按钮（如"去上传"）
  - 使用Element Plus的Empty组件
  
  需求: 需求3.5（空状态提示）
-->

<script setup lang="ts">
/**
 * 空状态组件
 */

// Props定义
interface EmptyProps {
  /** 空状态图片URL */
  image?: string;
  /** 图片大小 */
  imageSize?: number;
  /** 描述文字 */
  description?: string;
  /** 是否显示操作按钮 */
  showAction?: boolean;
  /** 操作按钮文字 */
  actionText?: string;
  /** 操作按钮类型 */
  actionType?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text';
}

// 设置默认值
const props = withDefaults(defineProps<EmptyProps>(), {
  image: '',
  imageSize: 200,
  description: '暂无数据',
  showAction: false,
  actionText: '去上传',
  actionType: 'primary'
});

// Emits定义
const emit = defineEmits<{
  action: [];
}>();

// 处理操作按钮点击
function handleAction() {
  emit('action');
}
</script>

<template>
  <div class="empty-container">
    <el-empty
      :image="props.image"
      :image-size="props.imageSize"
      :description="props.description"
    >
      <!-- 自定义描述插槽 -->
      <template
        v-if="$slots.description"
        #description
      >
        <slot name="description" />
      </template>

      <!-- 操作按钮插槽 -->
      <template #default>
        <slot name="action">
          <el-button
            v-if="props.showAction"
            :type="props.actionType"
            @click="handleAction"
          >
            {{ props.actionText }}
          </el-button>
        </slot>
      </template>
    </el-empty>
  </div>
</template>

<style scoped>
.empty-container {
  width: 100%;
  padding: 40px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 自定义Element Plus Empty组件样式 */
:deep(.el-empty) {
  padding: 20px 0;
}

:deep(.el-empty__image) {
  margin-bottom: 20px;
}

:deep(.el-empty__description) {
  margin-top: 16px;
  margin-bottom: 20px;
  color: #909399;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.el-empty__bottom) {
  margin-top: 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .empty-container {
    padding: 30px 16px;
  }

  :deep(.el-empty__image) {
    width: 150px !important;
    height: 150px !important;
  }

  :deep(.el-empty__description) {
    font-size: 13px;
  }

  :deep(.el-button) {
    font-size: 14px;
    padding: 8px 20px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  :deep(.el-empty__description) {
    color: #a8abb2;
  }
}
</style>
