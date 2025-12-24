<!--
  资源卡片组件
  
  功能：
  - 显示资源封面图（带懒加载）
  - 显示资源标题、格式、下载次数
  - 显示VIP标识（vipLevel > 0）
  - 点击卡片跳转详情页
  - 悬停显示操作按钮（下载、收藏）
  - 响应式布局（移动端/桌面端）
  
  需求: 需求3.4（资源卡片展示）
-->

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/pinia/userStore';
import { formatDownloadCount } from '@/utils/format';
import type { ResourceInfo } from '@/types/models';
import { Download, Star, Loading, Picture, Coin } from '@element-plus/icons-vue';

/**
 * 资源卡片组件
 */

// Props定义
interface ResourceCardProps {
  /** 资源信息 */
  resource: ResourceInfo;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 是否懒加载图片 */
  lazy?: boolean;
}

const props = withDefaults(defineProps<ResourceCardProps>(), {
  showActions: true,
  lazy: true
});

// Emits定义
const emit = defineEmits<{
  click: [resourceId: string];
  download: [resourceId: string];
  collect: [resourceId: string];
}>();

const router = useRouter();
const userStore = useUserStore();

/**
 * 根据字符串生成稳定的哈希数值
 * 用于生成一致的占位图ID
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 生成稳定的占位图URL
 * 使用 picsum.photos 的 /id/ 端点，确保图片稳定不变
 * picsum.photos 有约1000张图片，ID范围 0-1084
 */
function getStablePlaceholderUrl(resourceId: string, index: number = 0): string {
  const hash = hashCode(resourceId + '-' + index);
  const imageId = (hash % 1000) + 1; // 生成 1-1000 的图片ID
  return `https://picsum.photos/id/${imageId}/800/600`;
}

// 计算属性：封面图URL（带默认占位图）
// 使用稳定的占位图URL，确保首页卡片和详情页图片完全一致
const coverUrl = computed(() => {
  const cover = props.resource.cover;
  // 如果封面图是相对路径且可能不存在，使用稳定的占位图服务
  if (cover && cover.startsWith('/covers/')) {
    return getStablePlaceholderUrl(props.resource.resourceId, 0);
  }
  return cover || getStablePlaceholderUrl(props.resource.resourceId, 0);
});

// 计算属性：格式化下载次数
const formattedDownloadCount = computed(() => {
  return formatDownloadCount(props.resource.downloadCount);
});

// 计算属性：是否为VIP资源
const isVIP = computed(() => {
  return props.resource.vipLevel > 0;
});

// 计算属性：VIP标签文本
const vipLabel = computed(() => {
  return isVIP.value ? 'VIP' : '';
});

// 计算属性：是否显示积分信息（所有用户都显示，包括未登录用户）
const showPointsInfo = computed(() => {
  return true; // 所有用户都能看到积分信息
});

// 计算属性：积分消耗文本
const pointsCostText = computed(() => {
  // VIP资源显示"会员下载"
  if (isVIP.value) {
    return '会员下载';
  }

  // VIP用户显示"VIP免费"
  if (userStore.isLoggedIn && userStore.isVIP) {
    return 'VIP免费';
  }

  // 根据资源的pointsCost显示
  const pointsCost = props.resource.pointsCost || 0;
  if (pointsCost === 0) {
    return '免费下载';
  }

  return `${pointsCost}积分`;
});

// 计算属性：积分标签类型
const pointsTagType = computed(() => {
  // VIP资源使用黄色/橙色
  if (isVIP.value) {
    return 'warning';
  }

  // VIP用户显示橙色
  if (userStore.isLoggedIn && userStore.isVIP) {
    return 'warning';
  }

  const pointsCost = props.resource.pointsCost || 0;
  if (pointsCost === 0) {
    return 'success'; // 免费用绿色
  }

  return 'primary'; // 需要积分用蓝色
});

// 处理卡片点击
function handleCardClick() {
  emit('click', props.resource.resourceId);
  // 跳转到资源详情页
  router.push(`/resource/${props.resource.resourceId}`);
}

// 处理下载按钮点击
function handleDownload(event?: Event) {
  event?.stopPropagation(); // 阻止事件冒泡
  emit('download', props.resource.resourceId);
}

// 处理收藏按钮点击
function handleCollect(event?: Event) {
  event?.stopPropagation(); // 阻止事件冒泡
  emit('collect', props.resource.resourceId);
}
</script>

<template>
  <div
    class="resource-card"
    @click="handleCardClick"
  >
    <!-- 封面图区域 -->
    <div class="card-cover">
      <el-image
        :src="coverUrl"
        :alt="resource.title"
        :lazy="lazy"
        fit="cover"
        class="cover-image"
      >
        <!-- 加载中占位 -->
        <template #placeholder>
          <div class="image-placeholder">
            <el-icon class="is-loading">
              <Loading />
            </el-icon>
          </div>
        </template>

        <!-- 加载失败占位 -->
        <template #error>
          <div class="image-error">
            <el-icon>
              <Picture />
            </el-icon>
            <span>加载失败</span>
          </div>
        </template>
      </el-image>

      <!-- VIP标识 -->
      <div
        v-if="isVIP"
        class="vip-badge"
      >
        <el-tag
          type="warning"
          effect="dark"
          size="small"
        >
          {{ vipLabel }}
        </el-tag>
      </div>

      <!-- 悬停操作按钮 -->
      <div
        v-if="showActions"
        class="card-actions"
      >
        <el-button
          type="primary"
          :icon="Download"
          circle
          @click="handleDownload"
        />
        <el-button
          type="info"
          :icon="Star"
          circle
          @click="handleCollect"
        />
      </div>
    </div>

    <!-- 信息区域 -->
    <div class="card-info">
      <!-- 标题 -->
      <h3
        class="card-title"
        :title="resource.title"
      >
        {{ resource.title }}
      </h3>

      <!-- 元信息 -->
      <div class="card-meta">
        <span class="meta-item format">
          <el-tag
            size="small"
            type="info"
          >{{ resource.format }}</el-tag>
        </span>
        <span class="meta-item downloads">
          <el-icon><Download /></el-icon>
          <span>{{ formattedDownloadCount }}</span>
        </span>
      </div>

      <!-- 积分信息（所有用户都显示） -->
      <div
        v-if="showPointsInfo"
        class="card-points"
      >
        <el-tag
          :type="pointsTagType"
          size="small"
          effect="dark"
          class="points-tag"
        >
          <el-icon class="points-icon"><Coin /></el-icon>
          <span class="points-text">{{ pointsCostText }}</span>
        </el-tag>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resource-card {
  position: relative;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.resource-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* 封面图区域 */
.card-cover {
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 宽高比 */
  overflow: hidden;
  background: #f5f7fa;
}

.cover-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

:deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 图片占位符 */
.image-placeholder,
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}

.image-placeholder .el-icon {
  font-size: 32px;
}

.image-error {
  gap: 8px;
}

.image-error .el-icon {
  font-size: 40px;
}

.image-error span {
  font-size: 12px;
}

/* VIP标识 */
.vip-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

/* 操作按钮 */
.card-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 3;
}

.resource-card:hover .card-actions {
  opacity: 1;
}

.card-actions .el-button {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 遮罩层效果 */
.resource-card:hover .card-cover::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

/* 信息区域 */
.card-info {
  padding: 12px;
}

/* 标题 */
.card-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

/* 元信息 */
.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item.downloads {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item.downloads .el-icon {
  font-size: 14px;
}

/* 积分信息 */
.card-points {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}

.card-points .points-tag {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  font-weight: 600;
  padding: 6px 14px;
  white-space: nowrap;
  min-width: fit-content;
  line-height: 1;
  height: auto;
}

.card-points .points-icon {
  flex-shrink: 0;
  font-size: 14px;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  vertical-align: middle;
}

.card-points .points-text {
  white-space: nowrap;
  display: inline !important;
  vertical-align: middle;
  line-height: 1;
}

/* 确保el-tag内部元素对齐 */
:deep(.el-tag) {
  display: inline-flex !important;
  align-items: center !important;
}

:deep(.el-tag .el-icon) {
  margin-right: 0 !important;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .resource-card {
    border-radius: 6px;
  }

  .card-cover {
    padding-top: 100%; /* 移动端使用1:1宽高比 */
  }

  /* 移动端始终显示操作按钮 */
  .card-actions {
    opacity: 1;
    top: auto;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
  }

  .card-actions .el-button {
    width: 36px;
    height: 36px;
  }

  .card-info {
    padding: 10px;
  }

  .card-title {
    font-size: 13px;
    -webkit-line-clamp: 1; /* 移动端只显示一行 */
  }

  .card-meta {
    font-size: 11px;
  }

  .vip-badge {
    top: 6px;
    right: 6px;
  }

  /* 移动端不需要hover遮罩 */
  .resource-card:hover .card-cover::after {
    display: none;
  }

  /* 移动端hover效果减弱 */
  .resource-card:hover {
    transform: scale(1.01);
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1200px) {
  .card-cover {
    padding-top: 85%; /* 平板使用中间宽高比 */
  }

  .card-title {
    font-size: 13px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .resource-card {
    background: #1d1e1f;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .resource-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  .card-title {
    color: #e5eaf3;
  }

  .card-meta {
    color: #a8abb2;
  }

  .image-placeholder,
  .image-error {
    background: #2b2b2b;
    color: #a8abb2;
  }
}

/* 高分辨率屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .cover-image {
    image-rendering: -webkit-optimize-contrast;
  }
}
</style>
