<!--
  加载动画组件
  
  功能：
  - 骨架屏加载动画
  - 支持全屏加载和局部加载
  - 支持自定义加载文本
  - 使用Element Plus的Skeleton组件
  
  需求: 需求15.3（骨架屏）
-->

<script setup lang="ts">
/**
 * 加载动画组件
 */

// Props定义
interface LoadingProps {
  /** 是否全屏加载 */
  fullscreen?: boolean;
  /** 加载文本 */
  text?: string;
  /** 骨架屏行数 */
  rows?: number;
  /** 是否启用动画 */
  animated?: boolean;
  /** 骨架屏类型：default | card | list | article */
  type?: 'default' | 'card' | 'list' | 'article';
}

// 设置默认值
const props = withDefaults(defineProps<LoadingProps>(), {
  fullscreen: false,
  text: '',
  rows: 3,
  animated: true,
  type: 'default'
});
</script>

<template>
  <!-- 全屏加载 -->
  <div
    v-if="props.fullscreen"
    class="loading-fullscreen"
  >
    <div class="loading-content">
      <!-- 加载图标 -->
      <div class="loading-spinner">
        <svg
          class="spinner-icon"
          viewBox="0 0 50 50"
        >
          <circle
            class="spinner-path"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke-width="4"
          />
        </svg>
      </div>

      <!-- 加载文本 -->
      <p
        v-if="props.text"
        class="loading-text"
      >
        {{ props.text }}
      </p>
    </div>
  </div>

  <!-- 局部加载（骨架屏） -->
  <div
    v-else
    class="loading-skeleton"
  >
    <el-skeleton
      :rows="props.rows"
      :animated="props.animated"
      :loading="true"
    >
      <template #template>
        <!-- 自定义骨架屏模板 -->
        <div
          v-if="props.type === 'card'"
          class="skeleton-card"
        >
          <el-skeleton-item
            variant="image"
            class="skeleton-image"
          />
          <div class="skeleton-content">
            <el-skeleton-item
              variant="h3"
              class="skeleton-title"
            />
            <el-skeleton-item
              variant="text"
              class="skeleton-text"
            />
            <el-skeleton-item
              variant="text"
              class="skeleton-text"
            />
          </div>
        </div>

        <div
          v-else-if="props.type === 'list'"
          class="skeleton-list"
        >
          <div
            v-for="i in props.rows"
            :key="i"
            class="skeleton-list-item"
          >
            <el-skeleton-item
              variant="circle"
              class="skeleton-avatar"
            />
            <div class="skeleton-list-content">
              <el-skeleton-item
                variant="text"
                class="skeleton-list-title"
              />
              <el-skeleton-item
                variant="text"
                class="skeleton-list-desc"
              />
            </div>
          </div>
        </div>

        <div
          v-else-if="props.type === 'article'"
          class="skeleton-article"
        >
          <el-skeleton-item
            variant="h1"
            class="skeleton-article-title"
          />
          <el-skeleton-item
            variant="text"
            class="skeleton-article-meta"
          />
          <el-skeleton-item
            variant="image"
            class="skeleton-article-image"
          />
          <el-skeleton-item
            v-for="i in props.rows"
            :key="i"
            variant="text"
            class="skeleton-article-text"
          />
        </div>

        <div
          v-else
          class="skeleton-default"
        >
          <el-skeleton-item
            v-for="i in props.rows"
            :key="i"
            variant="text"
            class="skeleton-default-text"
          />
        </div>
      </template>
    </el-skeleton>

    <!-- 加载文本（骨架屏模式） -->
    <p
      v-if="props.text"
      class="skeleton-loading-text"
    >
      {{ props.text }}
    </p>
  </div>
</template>

<style scoped>
/* 全屏加载样式 */
.loading-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
}

.spinner-icon {
  width: 100%;
  height: 100%;
  animation: rotate 2s linear infinite;
}

.spinner-path {
  stroke: #165dff;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

.loading-text {
  margin: 0;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 局部加载（骨架屏）样式 */
.loading-skeleton {
  width: 100%;
}

.skeleton-loading-text {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  color: #909399;
}

/* 卡片骨架屏 */
.skeleton-card {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.skeleton-image {
  width: 100%;
  height: 200px;
  margin-bottom: 16px;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-title {
  width: 60%;
  height: 24px;
}

.skeleton-text {
  width: 100%;
  height: 16px;
}

/* 列表骨架屏 */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.skeleton-list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-list-title {
  width: 40%;
  height: 20px;
}

.skeleton-list-desc {
  width: 80%;
  height: 16px;
}

/* 文章骨架屏 */
.skeleton-article {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-article-title {
  width: 70%;
  height: 32px;
}

.skeleton-article-meta {
  width: 30%;
  height: 16px;
}

.skeleton-article-image {
  width: 100%;
  height: 300px;
  margin: 16px 0;
}

.skeleton-article-text {
  width: 100%;
  height: 16px;
}

/* 默认骨架屏 */
.skeleton-default {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-default-text {
  width: 100%;
  height: 16px;
}

.skeleton-default-text:first-child {
  width: 60%;
}

.skeleton-default-text:last-child {
  width: 80%;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .loading-spinner {
    width: 40px;
    height: 40px;
  }

  .loading-text {
    font-size: 13px;
  }

  .skeleton-image {
    height: 150px;
  }

  .skeleton-article-image {
    height: 200px;
  }

  .skeleton-avatar {
    width: 40px;
    height: 40px;
  }
}
</style>
