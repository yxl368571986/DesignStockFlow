<!--
  资源详情页
  
  功能：
  - 左侧预览图区域（大图+缩略图列表）
  - 右侧信息区域（标题、格式、大小、下载次数）
  - 资源描述
  - 标签列表
  - 下载按钮（DownloadButton组件）
  - 收藏按钮
  - 相关推荐资源
  - 水印显示（"星潮设计" + 资源ID）
  
  需求: 需求3.4、需求4.1（资源详情）
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/pinia/userStore';
import {
  getResourceDetail,
  getRecommendedResources,
  collectResource,
  uncollectResource
} from '@/api/resource';
import { getMyPointsInfo } from '@/api/points';
import { formatFileSize, formatDownloadCount, formatTime } from '@/utils/format';
import type { ResourceInfo } from '@/types/models';
import type { UserPointsInfo } from '@/api/points';
import DownloadButton from '@/components/business/DownloadButton.vue';
import ResourceCard from '@/components/business/ResourceCard.vue';
import Loading from '@/components/common/Loading.vue';
import {
  Star,
  StarFilled,
  User,
  Calendar,
  Download,
  ZoomIn,
  Loading as LoadingIcon,
  Picture,
  ArrowLeft,
  Close,
  Coin,
  TrophyBase,
  Warning
} from '@element-plus/icons-vue';

/**
 * 资源详情页组件
 */

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// ========== 状态 ==========

/**
 * 资源详情
 */
const resource = ref<ResourceInfo | null>(null);

/**
 * 加载状态
 */
const loading = ref(true);

/**
 * 当前预览图索引
 */
const currentImageIndex = ref(0);

/**
 * 是否显示大图查看器
 */
const showImageViewer = ref(false);

/**
 * 是否已收藏
 */
const isCollected = ref(false);

/**
 * 收藏加载状态
 */
const collectLoading = ref(false);

/**
 * 推荐资源列表
 */
const recommendedResources = ref<ResourceInfo[]>([]);

/**
 * 推荐资源加载状态
 */
const recommendedLoading = ref(false);

/**
 * 用户积分信息
 */
const userPointsInfo = ref<UserPointsInfo | null>(null);

/**
 * 积分信息加载状态
 */
const pointsLoading = ref(false);

// ========== 计算属性 ==========

/**
 * 资源ID
 */
const resourceId = computed(() => route.params.id as string);

/**
 * 当前预览图URL
 */
const currentImageUrl = computed(() => {
  if (!resource.value || !resource.value.previewImages.length) {
    return '';
  }
  return resource.value.previewImages[currentImageIndex.value];
});

/**
 * 格式化的文件大小
 */
const formattedFileSize = computed(() => {
  if (!resource.value) return '';
  return formatFileSize(resource.value.fileSize);
});

/**
 * 格式化的下载次数
 */
const formattedDownloadCount = computed(() => {
  if (!resource.value) return '';
  return formatDownloadCount(resource.value.downloadCount);
});

/**
 * 格式化的上传时间
 */
const formattedCreateTime = computed(() => {
  if (!resource.value) return '';
  return formatTime(resource.value.createTime, 'YYYY-MM-DD HH:mm');
});

/**
 * 是否为VIP资源
 */
const isVIP = computed(() => {
  return resource.value?.vipLevel && resource.value.vipLevel > 0;
});

/**
 * 水印文本
 */
const watermarkText = computed(() => {
  if (!resource.value) return '';
  return `星潮设计 ${resource.value.resourceId}`;
});

/**
 * 是否显示积分信息（仅登录用户显示）
 */
const showPointsInfo = computed(() => {
  return userStore.isLoggedIn;
});

/**
 * 积分消耗数值
 */
const pointsCost = computed(() => {
  return resource.value?.pointsCost || 0;
});

/**
 * 用户当前积分余额
 */
const pointsBalance = computed(() => {
  return userPointsInfo.value?.pointsBalance || 0;
});

/**
 * 积分是否不足
 */
const isPointsInsufficient = computed(() => {
  if (!showPointsInfo.value || userStore.isVIP) {
    return false;
  }
  return pointsBalance.value < pointsCost.value;
});

/**
 * 积分差额
 */
const pointsDeficit = computed(() => {
  if (!isPointsInsufficient.value) {
    return 0;
  }
  return pointsCost.value - pointsBalance.value;
});

// ========== 方法 ==========

/**
 * 获取资源详情
 */
async function fetchResourceDetail() {
  loading.value = true;
  try {
    const res = await getResourceDetail(resourceId.value);
    if (res.code === 200 && res.data) {
      resource.value = res.data;

      // 更新页面标题
      document.title = `${resource.value.title} - 星潮设计`;

      // 如果用户已登录，获取积分信息
      if (userStore.isLoggedIn) {
        fetchUserPointsInfo();
      }

      // 获取推荐资源
      fetchRecommendedResources();
    } else {
      ElMessage.error(res.msg || '获取资源详情失败');
      router.push('/resource');
    }
  } catch (error) {
    console.error('获取资源详情失败:', error);
    ElMessage.error('获取资源详情失败');
    router.push('/resource');
  } finally {
    loading.value = false;
  }
}

/**
 * 获取用户积分信息
 */
async function fetchUserPointsInfo() {
  if (!userStore.isLoggedIn) {
    return;
  }

  pointsLoading.value = true;
  try {
    const res = await getMyPointsInfo();
    if (res.code === 200 && res.data) {
      userPointsInfo.value = res.data;
    }
  } catch (error) {
    console.error('获取积分信息失败:', error);
  } finally {
    pointsLoading.value = false;
  }
}

/**
 * 获取推荐资源
 */
async function fetchRecommendedResources() {
  recommendedLoading.value = true;
  try {
    const res = await getRecommendedResources(8);
    if (res.code === 200 && res.data) {
      recommendedResources.value = res.data;
    }
  } catch (error) {
    console.error('获取推荐资源失败:', error);
  } finally {
    recommendedLoading.value = false;
  }
}

/**
 * 切换预览图
 */
function handleImageChange(index: number) {
  currentImageIndex.value = index;
}

/**
 * 打开大图查看器
 */
function handleImageClick() {
  showImageViewer.value = true;
}

/**
 * 关闭大图查看器
 */
function handleCloseViewer() {
  showImageViewer.value = false;
}

/**
 * 处理收藏/取消收藏
 */
async function handleCollect() {
  if (!resource.value) return;

  collectLoading.value = true;
  try {
    if (isCollected.value) {
      // 取消收藏
      const res = await uncollectResource(resource.value.resourceId);
      if (res.code === 200) {
        isCollected.value = false;
        ElMessage.success('已取消收藏');
      } else {
        ElMessage.error(res.msg || '取消收藏失败');
      }
    } else {
      // 收藏
      const res = await collectResource(resource.value.resourceId);
      if (res.code === 200) {
        isCollected.value = true;
        ElMessage.success('收藏成功');
      } else {
        ElMessage.error(res.msg || '收藏失败');
      }
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    ElMessage.error('操作失败，请稍后重试');
  } finally {
    collectLoading.value = false;
  }
}

/**
 * 处理下载成功
 */
function handleDownloadSuccess() {
  if (resource.value) {
    // 更新下载次数
    resource.value.downloadCount += 1;
  }
}

/**
 * 处理下载失败
 */
function handleDownloadError(error: string) {
  ElMessage.error(error);
}

/**
 * 处理推荐资源点击
 */
function handleRecommendedClick(resourceId: string) {
  // 跳转到新的资源详情页
  router.push(`/resource/${resourceId}`);
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 返回上一页
 */
function handleGoBack() {
  router.back();
}

/**
 * 关闭详情页并返回列表
 */
function handleClose() {
  router.push('/resource');
}

/**
 * 跳转到积分获取页面
 */
function handleGoToPoints() {
  router.push('/points');
}

// ========== 生命周期 ==========

onMounted(() => {
  fetchResourceDetail();
});
</script>

<template>
  <div class="resource-detail-page">
    <!-- 加载状态 -->
    <Loading
      v-if="loading"
      text="加载中..."
    />

    <!-- 资源详情 -->
    <div
      v-else-if="resource"
      class="detail-container"
    >
      <!-- 返回/关闭按钮 -->
      <div class="navigation-buttons">
        <el-button
          :icon="ArrowLeft"
          @click="handleGoBack"
        >
          返回
        </el-button>
        <el-button
          :icon="Close"
          @click="handleClose"
        >
          关闭
        </el-button>
      </div>

      <!-- 主要内容区 -->
      <div class="detail-main">
        <!-- 左侧：预览图区域 -->
        <div class="preview-section">
          <!-- 主预览图 -->
          <div class="main-preview">
            <div
              class="preview-wrapper"
              @click="handleImageClick"
            >
              <el-image
                :src="currentImageUrl"
                :alt="resource.title"
                fit="contain"
                class="preview-image"
              >
                <template #placeholder>
                  <div class="image-loading">
                    <el-icon class="is-loading">
                      <LoadingIcon />
                    </el-icon>
                  </div>
                </template>
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                    <span>加载失败</span>
                  </div>
                </template>
              </el-image>

              <!-- 水印 -->
              <div class="watermark">
                {{ watermarkText }}
              </div>

              <!-- 放大提示 -->
              <div class="zoom-hint">
                <el-icon><ZoomIn /></el-icon>
                <span>点击查看大图</span>
              </div>
            </div>
          </div>

          <!-- 缩略图列表 -->
          <div
            v-if="resource.previewImages.length > 1"
            class="thumbnail-list"
          >
            <div
              v-for="(image, index) in resource.previewImages"
              :key="index"
              class="thumbnail-item"
              :class="{ active: currentImageIndex === index }"
              @click="handleImageChange(index)"
            >
              <el-image
                :src="image"
                :alt="`预览图 ${index + 1}`"
                fit="cover"
                class="thumbnail-image"
              />
            </div>
          </div>
        </div>

        <!-- 右侧：信息区域 -->
        <div class="info-section">
          <!-- 标题 -->
          <h1 class="resource-title">
            {{ resource.title }}
            <el-tag
              v-if="isVIP"
              type="warning"
              effect="dark"
              size="large"
            >
              VIP
            </el-tag>
          </h1>

          <!-- 元信息 -->
          <div class="resource-meta">
            <div class="meta-item">
              <span class="meta-label">格式：</span>
              <el-tag
                type="info"
                size="large"
              >
                {{ resource.format }}
              </el-tag>
            </div>
            <div class="meta-item">
              <span class="meta-label">大小：</span>
              <span class="meta-value">{{ formattedFileSize }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">下载：</span>
              <span class="meta-value">
                <el-icon><Download /></el-icon>
                {{ formattedDownloadCount }}
              </span>
            </div>
          </div>

          <!-- 分类和标签 -->
          <div class="resource-tags">
            <div class="tags-row">
              <span class="tags-label">分类：</span>
              <el-tag type="primary">
                {{ resource.categoryName }}
              </el-tag>
            </div>
            <div
              v-if="resource.tags.length > 0"
              class="tags-row"
            >
              <span class="tags-label">标签：</span>
              <el-tag
                v-for="tag in resource.tags"
                :key="tag"
                type="info"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <DownloadButton
              :resource-id="resource.resourceId"
              :vip-level="resource.vipLevel"
              :points-cost="pointsCost"
              type="primary"
              size="large"
              text="立即下载"
              @success="handleDownloadSuccess"
              @error="handleDownloadError"
            />
            <el-button
              size="large"
              :icon="isCollected ? StarFilled : Star"
              :loading="collectLoading"
              @click="handleCollect"
            >
              {{ isCollected ? '已收藏' : '收藏' }}
            </el-button>
          </div>

          <!-- 积分信息区域（仅登录用户显示） -->
          <div
            v-if="showPointsInfo"
            class="points-section"
          >
            <!-- VIP用户显示VIP特权说明 -->
            <div
              v-if="userStore.isVIP"
              class="vip-privilege-box"
            >
              <div class="privilege-header">
                <el-icon class="privilege-icon">
                  <TrophyBase />
                </el-icon>
                <span class="privilege-title">VIP特权</span>
              </div>
              <div class="privilege-content">
                <p class="privilege-text">
                  <el-icon><Coin /></el-icon>
                  <span>VIP免费下载</span>
                </p>
                <p class="privilege-text">
                  <el-icon><Download /></el-icon>
                  <span>无需消耗积分</span>
                </p>
              </div>
            </div>

            <!-- 普通用户显示积分消耗信息 -->
            <div
              v-else
              class="points-info-box"
            >
              <div class="points-header">
                <el-icon class="points-icon">
                  <Coin />
                </el-icon>
                <span class="points-title">积分消耗</span>
              </div>
              <div class="points-content">
                <div class="points-row">
                  <span class="points-label">所需积分：</span>
                  <span class="points-value required">{{ pointsCost }} 积分</span>
                </div>
                <div class="points-row">
                  <span class="points-label">当前余额：</span>
                  <span
                    class="points-value balance"
                    :class="{ insufficient: isPointsInsufficient }"
                  >
                    {{ pointsBalance }} 积分
                  </span>
                </div>
                <div
                  v-if="isPointsInsufficient"
                  class="points-row insufficient-tip"
                >
                  <el-icon><Warning /></el-icon>
                  <span>积分不足，还需 {{ pointsDeficit }} 积分</span>
                </div>
              </div>
              <el-button
                v-if="isPointsInsufficient"
                type="warning"
                size="small"
                class="get-points-btn"
                @click="handleGoToPoints"
              >
                获取积分
              </el-button>
            </div>
          </div>

          <!-- 上传者信息 -->
          <div class="uploader-info">
            <div class="info-item">
              <el-icon><User /></el-icon>
              <span>上传者：{{ resource.uploaderName }}</span>
            </div>
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>上传时间：{{ formattedCreateTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 资源描述 -->
      <div class="description-section">
        <h2 class="section-title">
          资源描述
        </h2>
        <div class="description-content">
          {{ resource.description || '暂无描述' }}
        </div>
      </div>

      <!-- 推荐资源 -->
      <div
        v-if="recommendedResources.length > 0"
        class="recommended-section"
      >
        <h2 class="section-title">
          相关推荐
        </h2>
        <div
          v-if="recommendedLoading"
          class="recommended-loading"
        >
          <Loading text="加载推荐资源..." />
        </div>
        <div
          v-else
          class="recommended-grid"
        >
          <ResourceCard
            v-for="item in recommendedResources"
            :key="item.resourceId"
            :resource="item"
            :show-actions="true"
            @click="handleRecommendedClick"
          />
        </div>
      </div>
    </div>

    <!-- 大图查看器 -->
    <el-image-viewer
      v-if="showImageViewer && resource"
      :url-list="resource.previewImages"
      :initial-index="currentImageIndex"
      :hide-on-click-modal="true"
      @close="handleCloseViewer"
    />
  </div>
</template>

<style scoped>
.resource-detail-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.detail-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* 导航按钮 */
.navigation-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.navigation-buttons .el-button {
  background: #fff;
  border-color: #dcdfe6;
  color: #606266;
  transition: all 0.3s ease;
}

.navigation-buttons .el-button:hover {
  background: #165dff;
  border-color: #165dff;
  color: #fff;
}

/* 主要内容区 */
.detail-main {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  margin-bottom: 32px;
}

/* 预览区域 */
.preview-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.main-preview {
  margin-bottom: 16px;
}

.preview-wrapper {
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 宽高比 */
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  cursor: zoom-in;
}

.preview-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

:deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-loading,
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #909399;
  gap: 8px;
}

.image-loading .el-icon {
  font-size: 32px;
}

.image-error .el-icon {
  font-size: 48px;
}

/* 水印 */
.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 32px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
  z-index: 1;
}

/* 放大提示 */
.zoom-hint {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 2;
}

.preview-wrapper:hover .zoom-hint {
  opacity: 1;
}

/* 缩略图列表 */
.thumbnail-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 0;
}

.thumbnail-item {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.thumbnail-item:hover {
  border-color: #165dff;
}

.thumbnail-item.active {
  border-color: #165dff;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.2);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
}

/* 信息区域 */
.info-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.resource-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 12px;
}

.resource-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.meta-label {
  color: #909399;
  min-width: 50px;
}

.meta-value {
  color: #303133;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 标签 */
.resource-tags {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
}

.tags-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tags-label {
  color: #909399;
  font-size: 14px;
  min-width: 50px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.action-buttons .el-button {
  flex: 1;
}

/* 上传者信息 */
.uploader-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.info-item .el-icon {
  color: #909399;
}

/* 积分信息区域 */
.points-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

/* VIP特权盒子 */
.vip-privilege-box {
  padding: 16px;
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
  border: 2px solid #ff7d00;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(255, 125, 0, 0.15);
}

.privilege-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.privilege-icon {
  font-size: 20px;
  color: #ff7d00;
}

.privilege-title {
  font-size: 16px;
  font-weight: 600;
  color: #ff7d00;
}

.privilege-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.privilege-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #d46b08;
  margin: 0;
}

.privilege-text .el-icon {
  font-size: 16px;
}

/* 积分信息盒子 */
.points-info-box {
  padding: 16px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
}

.points-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.points-icon {
  font-size: 20px;
  color: #165dff;
}

.points-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.points-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.points-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.points-label {
  color: #606266;
}

.points-value {
  font-weight: 600;
}

.points-value.required {
  color: #165dff;
  font-size: 16px;
}

.points-value.balance {
  color: #67c23a;
  font-size: 16px;
}

.points-value.balance.insufficient {
  color: #f56c6c;
}

.points-row.insufficient-tip {
  padding: 8px 12px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  color: #f56c6c;
  font-size: 13px;
  gap: 6px;
  justify-content: flex-start;
}

.points-row.insufficient-tip .el-icon {
  font-size: 16px;
}

.get-points-btn {
  width: 100%;
  margin-top: 8px;
}

/* 描述区域 */
.description-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.description-content {
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 推荐资源 */
.recommended-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.recommended-loading {
  min-height: 200px;
}

.recommended-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .resource-detail-page {
    padding: 12px;
  }

  .navigation-buttons {
    margin-bottom: 16px;
  }

  .navigation-buttons .el-button {
    flex: 1;
  }

  .detail-main {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .preview-section,
  .info-section,
  .description-section,
  .recommended-section {
    padding: 16px;
  }

  .resource-title {
    font-size: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .watermark {
    font-size: 20px;
  }

  .thumbnail-item {
    width: 60px;
    height: 60px;
  }

  .recommended-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1200px) {
  .detail-main {
    grid-template-columns: 1fr 350px;
  }

  .recommended-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .resource-detail-page {
    background: #141414;
  }

  .preview-section,
  .info-section,
  .description-section,
  .recommended-section {
    background: #1d1e1f;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .resource-title {
    color: #e5eaf3;
  }

  .meta-label,
  .tags-label {
    color: #a8abb2;
  }

  .meta-value {
    color: #e5eaf3;
  }

  .description-content {
    color: #a8abb2;
  }

  .uploader-info {
    background: #2b2b2b;
  }

  .info-item {
    color: #a8abb2;
  }

  .preview-wrapper {
    background: #2b2b2b;
  }

  .resource-meta,
  .resource-tags {
    border-bottom-color: #2b2b2b;
  }
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-container {
  animation: fadeIn 0.3s ease-in-out;
}
</style>
