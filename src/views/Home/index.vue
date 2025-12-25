<!--
  首页组件
  
  功能：
  - 轮播图区域（BannerCarousel组件）
  - 分类导航区域（CategoryNav组件）
  - 热门资源区域（ResourceCard网格）
  - 推荐资源区域（ResourceCard网格）
  - 公告区域（滚动公告）
  - 使用configStore和resourceStore
  
  需求: 需求1.1、需求9.2、需求9.4（首页布局）
-->

<template>
  <div class="home-page">
    <!-- 离线模式提示 -->
    <div
      v-if="isOfflineMode"
      class="offline-indicator"
    >
      <el-icon class="offline-icon">
        <Connection />
      </el-icon>
      <span class="offline-text">离线浏览模式 - 显示缓存内容</span>
    </div>

    <!-- 公告横幅 -->
    <div
      v-if="importantAnnouncements.length > 0 && !isAnnouncementClosed"
      class="announcement-banner"
    >
      <div class="announcement-content">
        <el-icon class="announcement-icon">
          <Bell />
        </el-icon>
        <div class="announcement-text">
          <el-carousel
            :interval="5000"
            height="24px"
            direction="vertical"
            :autoplay="importantAnnouncements.length > 1"
            indicator-position="none"
            arrow="never"
          >
            <el-carousel-item
              v-for="announcement in importantAnnouncements"
              :key="announcement.announcementId"
            >
              <div
                class="announcement-item"
                :class="{ clickable: announcement.linkUrl }"
                @click="handleAnnouncementClick(announcement)"
              >
                <span
                  v-if="announcement.isTop"
                  class="announcement-badge"
                >置顶</span>
                <span class="announcement-title">{{ announcement.title }}</span>
              </div>
            </el-carousel-item>
          </el-carousel>
        </div>
        <el-button
          text
          :icon="Close"
          class="announcement-close"
          @click="closeAnnouncement"
        />
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="home-content">
      <!-- 轮播图区域 -->
      <section class="section banner-section">
        <BannerCarousel
          height="400px"
          mobile-height="200px"
          @change="handleBannerChange"
        />
      </section>

      <!-- 分类导航区域 -->
      <section class="section category-section">
        <CategoryNav
          :show-scroll-buttons="true"
          @category-change="handleCategoryChange"
        />
      </section>

      <!-- 热门资源区域 -->
      <section class="section hot-resources-section">
        <div class="section-header">
          <h2 class="section-title">
            <el-icon class="title-icon">
              <TrendCharts />
            </el-icon>
            热门资源
          </h2>
          <el-button
            text
            type="primary"
            @click="viewMoreHotResources"
          >
            查看更多
            <el-icon class="ml-1">
              <ArrowRight />
            </el-icon>
          </el-button>
        </div>

        <!-- 加载状态 -->
        <Loading
          v-if="loadingHot"
          type="card"
          :rows="4"
        />

        <!-- 资源网格 -->
        <div
          v-else-if="hotResources.length > 0"
          class="resource-grid"
        >
          <ResourceCard
            v-for="resource in hotResources"
            :key="resource.resourceId"
            :resource="resource"
            :show-actions="true"
            @click="handleResourceClick"
            @download="handleResourceDownload"
            @collect="handleResourceCollect"
          />
        </div>

        <!-- 空状态 -->
        <Empty
          v-else
          description="暂无热门资源"
          :show-action="false"
        />
      </section>

      <!-- 推荐资源区域 -->
      <section class="section recommended-resources-section">
        <div class="section-header">
          <h2 class="section-title">
            <el-icon class="title-icon">
              <Star />
            </el-icon>
            精选推荐
          </h2>
          <el-button
            text
            type="primary"
            @click="viewMoreRecommendedResources"
          >
            查看更多
            <el-icon class="ml-1">
              <ArrowRight />
            </el-icon>
          </el-button>
        </div>

        <!-- 加载状态 -->
        <Loading
          v-if="loadingRecommended"
          type="card"
          :rows="4"
        />

        <!-- 资源网格 -->
        <div
          v-else-if="recommendedResources.length > 0"
          class="resource-grid"
        >
          <ResourceCard
            v-for="resource in recommendedResources"
            :key="resource.resourceId"
            :resource="resource"
            :show-actions="true"
            @click="handleResourceClick"
            @download="handleResourceDownload"
            @collect="handleResourceCollect"
          />
        </div>

        <!-- 空状态 -->
        <Empty
          v-else
          description="暂无推荐资源"
          :show-action="false"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Bell, Close, TrendCharts, Star, ArrowRight, Connection } from '@element-plus/icons-vue';
import { useConfigStore } from '@/pinia/configStore';
import { useUserStore } from '@/pinia/userStore';
import { useDownload } from '@/composables/useDownload';
import { useOffline } from '@/composables/useOffline';
import { getHotResources, getRecommendedResources, collectResource } from '@/api/resource';
import type { ResourceInfo, AnnouncementInfo } from '@/types/models';
import BannerCarousel from '@/components/business/BannerCarousel.vue';
import CategoryNav from '@/components/business/CategoryNav.vue';
import ResourceCard from '@/components/business/ResourceCard.vue';
import Loading from '@/components/common/Loading.vue';
import Empty from '@/components/common/Empty.vue';

// ========== Composables ==========
const router = useRouter();
const configStore = useConfigStore();
const userStore = useUserStore();
const { handleDownload } = useDownload();
const { isOnline, isOfflineMode, cachedResources, cacheResources } = useOffline();

// ========== 状态 ==========

/**
 * 热门资源列表
 */
const hotResources = ref<ResourceInfo[]>([]);

/**
 * 推荐资源列表
 */
const recommendedResources = ref<ResourceInfo[]>([]);

/**
 * 热门资源加载状态
 */
const loadingHot = ref(false);

/**
 * 推荐资源加载状态
 */
const loadingRecommended = ref(false);

/**
 * 公告是否已关闭
 */
const isAnnouncementClosed = ref(false);

// ========== 计算属性 ==========

/**
 * 重要公告列表
 */
const importantAnnouncements = computed(() => configStore.importantAnnouncements);

// ========== 方法 ==========

/**
 * 获取热门资源
 */
async function fetchHotResources(): Promise<void> {
  // 如果离线，使用缓存资源
  if (!isOnline.value && cachedResources.value.length > 0) {
    console.log('离线模式：使用缓存的热门资源');
    hotResources.value = cachedResources.value.slice(0, 8);
    return;
  }

  loadingHot.value = true;
  try {
    const res = await getHotResources(8); // 获取8个热门资源
    if (res.code === 200 && res.data) {
      hotResources.value = res.data;
      // 缓存资源用于离线访问
      await cacheResources(res.data);
    } else {
      console.error('获取热门资源失败:', res.msg);
    }
  } catch (error) {
    console.error('获取热门资源失败:', error);
    // 如果请求失败且有缓存，使用缓存
    if (cachedResources.value.length > 0) {
      console.log('使用缓存的热门资源');
      hotResources.value = cachedResources.value.slice(0, 8);
    }
  } finally {
    loadingHot.value = false;
  }
}

/**
 * 获取推荐资源
 */
async function fetchRecommendedResources(): Promise<void> {
  // 如果离线，使用缓存资源
  if (!isOnline.value && cachedResources.value.length > 0) {
    console.log('离线模式：使用缓存的推荐资源');
    recommendedResources.value = cachedResources.value.slice(8, 16);
    return;
  }

  loadingRecommended.value = true;
  try {
    const res = await getRecommendedResources(8); // 获取8个推荐资源
    if (res.code === 200 && res.data) {
      recommendedResources.value = res.data;
      // 缓存资源用于离线访问
      await cacheResources(res.data);
    } else {
      console.error('获取推荐资源失败:', res.msg);
    }
  } catch (error) {
    console.error('获取推荐资源失败:', error);
    // 如果请求失败且有缓存，使用缓存
    if (cachedResources.value.length > 8) {
      console.log('使用缓存的推荐资源');
      recommendedResources.value = cachedResources.value.slice(8, 16);
    }
  } finally {
    loadingRecommended.value = false;
  }
}

/**
 * 处理轮播图切换
 */
function handleBannerChange(index: number): void {
  console.log('轮播图切换到:', index);
}

/**
 * 处理分类切换
 */
function handleCategoryChange(categoryId: string | null): void {
  console.log('切换分类:', categoryId);
  // 跳转到资源列表页
  router.push({
    path: '/resource',
    query: categoryId ? { categoryId } : undefined
  });
}

/**
 * 处理资源卡片点击
 */
function handleResourceClick(resourceId: string): void {
  console.log('点击资源:', resourceId);
  // 路由跳转由ResourceCard组件内部处理
}

/**
 * 处理资源下载
 */
async function handleResourceDownload(resourceId: string): Promise<void> {
  console.log('下载资源:', resourceId);

  // 查找资源信息
  const resource = [...hotResources.value, ...recommendedResources.value].find(
    (r) => r.resourceId === resourceId
  );

  if (resource) {
    await handleDownload(resourceId, resource.vipLevel);
  }
}

/**
 * 处理资源收藏
 */
async function handleResourceCollect(resourceId: string): Promise<void> {
  console.log('收藏资源:', resourceId);

  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    ElMessage.warning('未登录，请先登录');
    // 延迟跳转，让用户看到提示，并携带重定向参数
    setTimeout(() => {
      router.push(`/login?redirect=${encodeURIComponent('/')}`);
    }, 500);
    return;
  }

  try {
    const res = await collectResource(resourceId);
    if (res.code === 200) {
      ElMessage.success('收藏成功');
    } else {
      ElMessage.error(res.msg || '收藏失败');
    }
  } catch (error) {
    console.error('收藏失败:', error);
    ElMessage.error('收藏失败，请稍后重试');
  }
}

/**
 * 查看更多热门资源
 */
function viewMoreHotResources(): void {
  router.push({
    path: '/resource',
    query: { sortType: 'hot' }
  });
}

/**
 * 查看更多推荐资源
 */
function viewMoreRecommendedResources(): void {
  router.push({
    path: '/resource',
    query: { sortType: 'download' }
  });
}

/**
 * 处理公告点击
 */
function handleAnnouncementClick(announcement: AnnouncementInfo): void {
  if (announcement.linkUrl) {
    // 如果是外部链接，新标签页打开
    if (announcement.linkUrl.startsWith('http')) {
      window.open(announcement.linkUrl, '_blank', 'noopener,noreferrer');
    } else {
      // 内部链接，路由跳转
      router.push(announcement.linkUrl);
    }
  }
}

/**
 * 关闭公告横幅
 */
function closeAnnouncement(): void {
  isAnnouncementClosed.value = true;
  // 记录到本地存储，24小时内不再显示
  const closeTime = Date.now();
  localStorage.setItem('announcement_closed_time', closeTime.toString());
}

/**
 * 检查公告是否应该显示
 */
function checkAnnouncementDisplay(): void {
  const closedTime = localStorage.getItem('announcement_closed_time');
  if (closedTime) {
    const now = Date.now();
    const elapsed = now - parseInt(closedTime);
    // 24小时 = 24 * 60 * 60 * 1000 毫秒
    if (elapsed < 24 * 60 * 60 * 1000) {
      isAnnouncementClosed.value = true;
    } else {
      // 超过24小时，清除记录
      localStorage.removeItem('announcement_closed_time');
    }
  }
}

/**
 * 初始化页面数据
 */
async function initPage(): Promise<void> {
  // 检查公告显示状态
  checkAnnouncementDisplay();

  // 初始化配置（轮播图、分类、公告）
  if (configStore.banners.length === 0 || configStore.categories.length === 0) {
    await configStore.initConfig();
  }

  // 并行获取热门和推荐资源
  await Promise.all([fetchHotResources(), fetchRecommendedResources()]);
}

// ========== 生命周期 ==========

onMounted(() => {
  initPage();
});
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 离线模式提示 */
.offline-indicator {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-bottom: 1px solid #64b5f6;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
}

.offline-icon {
  font-size: 18px;
  color: #1976d2;
}

.offline-text {
  font-size: 14px;
  color: #1565c0;
  font-weight: 500;
}

/* 公告横幅 */
.announcement-banner {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-bottom: 1px solid #ffb74d;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.1);
}

.announcement-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.announcement-icon {
  font-size: 20px;
  color: #ff9800;
  flex-shrink: 0;
}

.announcement-text {
  flex: 1;
  overflow: hidden;
}

.announcement-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #5d4037;
  line-height: 24px;

  &.clickable {
    cursor: pointer;

    &:hover {
      color: #ff9800;
    }
  }
}

.announcement-badge {
  padding: 2px 8px;
  background: #ff9800;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  flex-shrink: 0;
}

.announcement-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-close {
  flex-shrink: 0;
  color: #8d6e63;

  &:hover {
    color: #ff9800;
  }
}

/* 主要内容区域 */
.home-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* 区块样式 */
.section {
  margin-bottom: 40px;

  &:last-child {
    margin-bottom: 0;
  }
}

.banner-section {
  margin-bottom: 32px;
}

.category-section {
  margin-bottom: 32px;
}

/* 区块头部 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;

  .title-icon {
    font-size: 28px;
    color: #165dff;
  }
}

/* 资源网格 */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .home-content {
    padding: 16px;
  }

  .announcement-content {
    padding: 10px 16px;
  }

  .announcement-icon {
    font-size: 18px;
  }

  .announcement-item {
    font-size: 13px;
  }

  .section {
    margin-bottom: 32px;
  }

  .banner-section,
  .category-section {
    margin-bottom: 24px;
  }

  .section-header {
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 18px;

    .title-icon {
      font-size: 22px;
    }
  }

  .resource-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1200px) {
  .home-content {
    padding: 20px;
  }

  .section-title {
    font-size: 20px;

    .title-icon {
      font-size: 24px;
    }
  }

  .resource-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

/* 大屏幕适配 */
@media (min-width: 1400px) {
  .home-content {
    max-width: 1400px;
  }

  .announcement-content {
    max-width: 1400px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .home-page {
    background: #1d1e1f;
  }

  .announcement-banner {
    background: linear-gradient(135deg, #3e2723 0%, #4e342e 100%);
    border-bottom-color: #5d4037;
  }

  .announcement-item {
    color: #ffcc80;
  }

  .announcement-close {
    color: #bcaaa4;

    &:hover {
      color: #ffcc80;
    }
  }

  .section-title {
    color: #e5eaf3;
  }
}
</style>
