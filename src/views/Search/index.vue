<!--
  搜索结果页
  
  功能：
  - SearchBar组件集成
  - 资源结果网格（使用ResourceCard组件）
  - 筛选控件（格式、VIP等级、排序）
  - 分页组件
  - 搜索词高亮
  - 空状态（推荐相关资源）
  
  需求: 需求7.1-7.3（搜索功能）
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useResourceStore } from '@/pinia/resourceStore';
import { useUserStore } from '@/pinia/userStore';
import { collectResource } from '@/api/resource';
import SearchBar from '@/components/business/SearchBar.vue';
import ResourceCard from '@/components/business/ResourceCard.vue';
import Loading from '@/components/common/Loading.vue';
import Empty from '@/components/common/Empty.vue';
import { Filter, ArrowLeft } from '@element-plus/icons-vue';

/**
 * 搜索结果页
 */

const route = useRoute();
const router = useRouter();
const resourceStore = useResourceStore();
const userStore = useUserStore();

// 本地状态
const showFilterDrawer = ref(false); // 是否显示筛选抽屉（移动端）
const searchInitialized = ref(false); // 搜索是否已初始化完成

/**
 * 返回上一页
 */
function handleGoBack() {
  // 如果有历史记录则返回，否则跳转到首页
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
}

// 筛选选项
const formatOptions = [
  { label: '全部格式', value: '' },
  { label: 'PSD', value: 'PSD' },
  { label: 'AI', value: 'AI' },
  { label: 'CDR', value: 'CDR' },
  { label: 'EPS', value: 'EPS' },
  { label: 'SKETCH', value: 'SKETCH' },
  { label: 'XD', value: 'XD' },
  { label: 'FIGMA', value: 'FIGMA' },
  { label: 'SVG', value: 'SVG' },
  { label: 'PNG', value: 'PNG' },
  { label: 'JPG', value: 'JPG' }
];

const vipLevelOptions = [
  { label: '全部资源', value: -1 },
  { label: '免费资源', value: 0 },
  { label: 'VIP专属', value: 1 }
];

const sortOptions: { label: string; value: 'comprehensive' | 'download' | 'latest' | 'like' | 'collect' }[] = [
  { label: '综合排序', value: 'comprehensive' },
  { label: '最新上传', value: 'latest' },
  { label: '下载最多', value: 'download' },
  { label: '最多点赞', value: 'like' },
  { label: '最多收藏', value: 'collect' }
];

// 计算属性：当前搜索关键词
const currentKeyword = computed(() => {
  return resourceStore.searchParams.keyword || '';
});

// 计算属性：是否有搜索结果
const hasResults = computed(() => {
  return resourceStore.hasResources;
});

// 计算属性：是否正在加载
const isLoading = computed(() => {
  return resourceStore.loading;
});

// 计算属性：搜索结果数量
const resultCount = computed(() => {
  return resourceStore.total;
});

// 计算属性：当前页码
const currentPage = computed({
  get: () => resourceStore.searchParams.pageNum,
  set: (value: number) => resourceStore.setPageNum(value)
});

// 计算属性：每页数量
const pageSize = computed({
  get: () => resourceStore.searchParams.pageSize,
  set: (value: number) => resourceStore.setPageSize(value)
});

// 计算属性：当前格式筛选
const currentFormat = computed({
  get: () => resourceStore.searchParams.format || '',
  set: (value: string) => resourceStore.setFormat(value === '' ? undefined : value)
});

// 计算属性：当前VIP等级筛选
const currentVipLevel = computed({
  get: () => resourceStore.searchParams.vipLevel ?? -1,
  set: (value: number) => resourceStore.setVipLevel(value === -1 ? undefined : value)
});

// 计算属性：当前排序方式
const currentSortType = computed({
  get: () => resourceStore.searchParams.sortType || 'latest',
  set: (value: 'comprehensive' | 'download' | 'latest' | 'like' | 'collect') => resourceStore.setSortType(value)
});

/**
 * 从URL参数初始化搜索
 */
async function initSearchFromUrl() {
  const keyword = route.query.keyword as string | undefined;
  const categoryId = route.query.category as string | undefined;
  const format = route.query.format as string | undefined;
  const vipLevel = route.query.vipLevel ? Number(route.query.vipLevel) : undefined;
  const sortType = (route.query.sort as 'comprehensive' | 'download' | 'latest' | 'like' | 'collect') || 'latest';
  const pageNum = route.query.page ? Number(route.query.page) : 1;

  // 更新搜索参数
  resourceStore.updateSearchParams(
    {
      keyword,
      categoryId,
      format,
      vipLevel,
      sortType,
      pageNum
    },
    false // 不自动获取数据
  );

  // 执行搜索
  await resourceStore.fetchResources();
  searchInitialized.value = true;
}

/**
 * 更新URL参数
 */
function updateUrlParams() {
  const query: Record<string, string> = {};

  if (resourceStore.searchParams.keyword) {
    query.keyword = resourceStore.searchParams.keyword;
  }
  if (resourceStore.searchParams.categoryId) {
    query.category = resourceStore.searchParams.categoryId;
  }
  if (resourceStore.searchParams.format) {
    query.format = resourceStore.searchParams.format;
  }
  if (resourceStore.searchParams.vipLevel !== undefined) {
    query.vipLevel = String(resourceStore.searchParams.vipLevel);
  }
  if (resourceStore.searchParams.sortType) {
    query.sort = resourceStore.searchParams.sortType;
  }
  if (resourceStore.searchParams.pageNum > 1) {
    query.page = String(resourceStore.searchParams.pageNum);
  }

  router.replace({ query });
}

/**
 * 处理搜索
 * @param keyword 搜索关键词
 */
function handleSearch(keyword: string) {
  resourceStore.setKeyword(keyword);
  updateUrlParams();
}

/**
 * 处理筛选变化
 */
function handleFilterChange() {
  updateUrlParams();
  // 移动端关闭筛选抽屉
  showFilterDrawer.value = false;
}

/**
 * 处理分页变化
 * @param page 页码
 */
function handlePageChange(page: number) {
  currentPage.value = page;
  updateUrlParams();
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 处理每页数量变化
 * @param size 每页数量
 */
function handlePageSizeChange(size: number) {
  pageSize.value = size;
  updateUrlParams();
}

/**
 * 处理资源卡片点击
 * @param resourceId 资源ID
 */
function handleResourceClick(resourceId: string) {
  router.push(`/resource/${resourceId}`);
}

/**
 * 处理下载
 * @param resourceId 资源ID
 */
function handleDownload(resourceId: string) {
  // TODO: 实现下载逻辑
}

/**
 * 处理收藏
 * @param resourceId 资源ID
 */
async function handleCollect(resourceId: string) {
  
  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    ElMessage.warning('未登录，请先登录');
    // 延迟跳转，让用户看到提示，并携带重定向参数
    const currentPath = route.fullPath;
    setTimeout(() => {
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
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
 * 重置筛选
 */
function handleResetFilters() {
  currentFormat.value = '';
  currentVipLevel.value = -1;
  currentSortType.value = 'latest';
  handleFilterChange();
}

/**
 * 打开筛选抽屉（移动端）
 */
function openFilterDrawer() {
  showFilterDrawer.value = true;
}

// 监听路由变化
watch(
  () => route.query,
  () => {
    // 只在搜索页面时响应路由变化
    if (route.path === '/search') {
      initSearchFromUrl();
    }
  }
);

// 生命周期钩子
onMounted(() => {
  initSearchFromUrl();
});
</script>

<template>
  <div class="search-page">
    <!-- 搜索栏 -->
    <div class="search-header">
      <div class="container">
        <div class="search-header-content">
          <!-- 返回按钮 -->
          <el-button
            class="back-btn"
            :icon="ArrowLeft"
            circle
            @click="handleGoBack"
          />
          <div class="search-bar-wrapper">
            <SearchBar @search="handleSearch" />
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="search-content">
      <div class="container">
        <!-- 搜索信息栏 -->
        <div class="search-info">
          <div class="info-left">
            <span
              v-if="currentKeyword"
              class="search-keyword"
            >
              搜索结果：<strong>{{ currentKeyword }}</strong>
            </span>
            <span class="result-count">
              共找到 <strong>{{ resultCount }}</strong> 个资源
            </span>
          </div>

          <!-- 移动端筛选按钮 -->
          <el-button
            class="mobile-filter-btn"
            :icon="Filter"
            @click="openFilterDrawer"
          >
            筛选
          </el-button>
        </div>

        <div class="search-main">
          <!-- 侧边筛选栏（桌面端） -->
          <aside class="filter-sidebar desktop-only">
            <!-- 筛选标题 -->
            <div class="filter-header">
              <span class="filter-header-text">筛选条件</span>
            </div>

            <div class="filter-section">
              <h3 class="filter-title">
                <span class="title-icon">📄</span>
                文件格式
              </h3>
              <div class="filter-options">
                <div
                  v-for="option in formatOptions"
                  :key="option.value || 'all'"
                  class="filter-option"
                  :class="{ 'filter-option-active': currentFormat === option.value }"
                  @click="currentFormat = option.value; handleFilterChange()"
                >
                  {{ option.label }}
                </div>
              </div>
            </div>

            <div class="filter-section">
              <h3 class="filter-title">
                <span class="title-icon">⭐</span>
                资源类型
              </h3>
              <div class="filter-options">
                <div
                  v-for="option in vipLevelOptions"
                  :key="option.value ?? 'all'"
                  class="filter-option"
                  :class="{ 'filter-option-active': currentVipLevel === option.value }"
                  @click="currentVipLevel = option.value; handleFilterChange()"
                >
                  {{ option.label }}
                </div>
              </div>
            </div>

            <div class="filter-section">
              <h3 class="filter-title">
                <span class="title-icon">📊</span>
                排序方式
              </h3>
              <div class="filter-options">
                <div
                  v-for="option in sortOptions"
                  :key="option.value"
                  class="filter-option"
                  :class="{ 'filter-option-active': currentSortType === option.value }"
                  @click="currentSortType = option.value; handleFilterChange()"
                >
                  {{ option.label }}
                </div>
              </div>
            </div>

            <button
              class="reset-btn"
              @click="handleResetFilters"
            >
              <span class="reset-icon">🔄</span>
              重置筛选
            </button>
          </aside>

          <!-- 资源列表区 -->
          <div class="results-area">
            <!-- 加载状态：只在loading且搜索未完成时显示 -->
            <Loading
              v-if="isLoading || !searchInitialized"
              text="正在搜索..."
            />

            <!-- 搜索结果 -->
            <div
              v-else-if="hasResults"
              class="results-grid"
            >
              <ResourceCard
                v-for="resource in resourceStore.resources"
                :key="resource.resourceId"
                :resource="resource"
                @click="handleResourceClick"
                @download="handleDownload"
                @collect="handleCollect"
              />
            </div>

            <!-- 空状态：当搜索完成且没有结果时显示 -->
            <Empty
              v-else
              icon="Search"
              description="没有找到相关资源"
            >
              <template #extra>
                <p class="empty-tip">
                  试试其他关键词或浏览推荐资源
                </p>
              </template>
            </Empty>

            <!-- 分页 -->
            <div
              v-if="hasResults && resultCount > pageSize"
              class="pagination-wrapper"
            >
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="resultCount"
                :page-sizes="[20, 40, 60, 80]"
                layout="total, sizes, prev, pager, next, jumper"
                background
                @current-change="handlePageChange"
                @size-change="handlePageSizeChange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端筛选抽屉 -->
    <el-drawer
      v-model="showFilterDrawer"
      title="筛选条件"
      direction="rtl"
      size="80%"
      class="mobile-filter-drawer"
    >
      <div class="drawer-content">
        <div class="filter-section">
          <h3 class="filter-title">
            文件格式
          </h3>
          <el-radio-group
            v-model="currentFormat"
            class="filter-group"
          >
            <el-radio
              v-for="option in formatOptions"
              :key="option.value || 'all'"
              :value="option.value"
              class="filter-radio"
            >
              {{ option.label }}
            </el-radio>
          </el-radio-group>
        </div>

        <div class="filter-section">
          <h3 class="filter-title">
            资源类型
          </h3>
          <el-radio-group
            v-model="currentVipLevel"
            class="filter-group"
          >
            <el-radio
              v-for="option in vipLevelOptions"
              :key="option.value ?? 'all'"
              :value="option.value"
              class="filter-radio"
            >
              {{ option.label }}
            </el-radio>
          </el-radio-group>
        </div>

        <div class="filter-section">
          <h3 class="filter-title">
            排序方式
          </h3>
          <el-radio-group
            v-model="currentSortType"
            class="filter-group"
          >
            <el-radio
              v-for="option in sortOptions"
              :key="option.value"
              :value="option.value"
              class="filter-radio"
            >
              {{ option.label }}
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="handleResetFilters">
            重置
          </el-button>
          <el-button
            type="primary"
            @click="handleFilterChange"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 搜索头部 */
.search-header {
  background: #fff;
  padding: 24px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.search-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: 1px solid #dcdfe6;
  background: #fff;
}

.back-btn:hover {
  color: #165dff;
  border-color: #165dff;
  background: #f0f5ff;
}

.search-bar-wrapper {
  flex: 1;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 搜索内容区 */
.search-content {
  padding: 24px 0;
}

/* 搜索信息栏 */
.search-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.info-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-keyword {
  font-size: 14px;
  color: #606266;
}

.search-keyword strong {
  color: #165dff;
  font-weight: 500;
}

.result-count {
  font-size: 13px;
  color: #909399;
}

.result-count strong {
  color: #303133;
  font-weight: 500;
}

.mobile-filter-btn {
  display: none;
}

/* 主内容区 */
.search-main {
  display: flex;
  gap: 24px;
}

/* 侧边筛选栏 */
.filter-sidebar {
  flex-shrink: 0;
  width: 220px;
  background: #fff;
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  height: fit-content;
  position: sticky;
  top: 100px;
  overflow: hidden;
}

/* 筛选头部 */
.filter-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px 20px;
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
  color: #fff;
}

.filter-header-text {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 6px;
  text-indent: 6px;
}

/* 筛选区块 */
.filter-section {
  padding: 20px;
  border-bottom: 1px solid #f0f2f5;
}

.filter-section:last-of-type {
  border-bottom: none;
}

.filter-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  text-align: center;
}

.title-icon {
  font-size: 14px;
}

/* 筛选选项 */
.filter-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.filter-option {
  padding: 8px 14px;
  font-size: 13px;
  color: #606266;
  background: #f5f7fa;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid transparent;
  text-align: center;
  min-width: 60px;
}

.filter-option:hover {
  background: #e8f4ff;
  color: #165dff;
  border-color: #c6e2ff;
  transform: translateY(-2px);
}

.filter-option-active {
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.35);
}

.filter-option-active:hover {
  background: linear-gradient(135deg, #0e42d2 0%, #165dff 100%);
  color: #fff;
  border-color: transparent;
  transform: translateY(-2px);
}

/* 重置按钮 */
.reset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: calc(100% - 40px);
  margin: 8px 20px 20px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #909399;
  background: #fafafa;
  border: 1px dashed #dcdfe6;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.reset-btn:hover {
  color: #ff6b6b;
  background: #fff5f5;
  border-color: #ff6b6b;
  transform: translateY(-2px);
}

.reset-icon {
  font-size: 14px;
}

/* 结果区域 */
.results-area {
  flex: 1;
  min-width: 0;
}

/* 结果网格 */
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 32px 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 空状态提示 */
.empty-tip {
  margin-top: 12px;
  font-size: 13px;
  color: #909399;
}

/* 移动端筛选抽屉 */
.drawer-content {
  padding: 0 20px;
}

.drawer-footer {
  display: flex;
  gap: 12px;
}

.drawer-footer .el-button {
  flex: 1;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .search-header {
    padding: 16px 0;
  }

  .search-header-content {
    gap: 12px;
  }

  .back-btn {
    width: 36px;
    height: 36px;
  }

  .container {
    padding: 0 16px;
  }

  .search-content {
    padding: 16px 0;
  }

  .search-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    margin-bottom: 16px;
  }

  .info-left {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .mobile-filter-btn {
    display: flex;
    width: 100%;
  }

  .desktop-only {
    display: none;
  }

  .search-main {
    gap: 0;
  }

  .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }

  .pagination-wrapper {
    padding: 20px 16px;
  }

  :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }

  :deep(.el-pagination .el-pagination__sizes) {
    margin: 0;
  }

  :deep(.el-pagination .el-pagination__jump) {
    margin-left: 0;
    margin-top: 8px;
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1200px) {
  .filter-sidebar {
    width: 180px;
  }

  .filter-header {
    padding: 14px 16px;
  }

  .filter-header-text {
    font-size: 14px;
    letter-spacing: 1px;
  }

  .filter-section {
    padding: 16px;
  }

  .filter-title {
    font-size: 13px;
    margin-bottom: 12px;
  }

  .filter-option {
    padding: 6px 10px;
    font-size: 12px;
    min-width: 50px;
  }

  .reset-btn {
    width: calc(100% - 32px);
    margin: 8px 16px 16px;
    padding: 10px 12px;
    font-size: 12px;
  }

  .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
}

/* 大屏适配 */
@media (min-width: 1400px) {
  .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .search-page {
    background: #141414;
  }

  .search-header,
  .search-info,
  .pagination-wrapper {
    background: #1d1e1f;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .filter-sidebar {
    background: #1d1e1f;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }

  .filter-header {
    background: linear-gradient(135deg, #0e42d2 0%, #165dff 100%);
  }

  .filter-section {
    border-bottom-color: #3a3a3a;
  }

  .filter-title {
    color: #e5eaf3;
  }

  .filter-option {
    background: #2b2b2b;
    color: #a8abb2;
    border-color: transparent;
  }

  .filter-option:hover {
    background: #353535;
    color: #4080ff;
    border-color: #4080ff;
  }

  .filter-option-active {
    background: linear-gradient(135deg, #0e42d2 0%, #165dff 100%);
    color: #fff;
  }

  .reset-btn {
    background: #2b2b2b;
    color: #a8abb2;
    border-color: #4c4d4f;
  }

  .reset-btn:hover {
    background: #353535;
    color: #4080ff;
    border-color: #4080ff;
  }

  .back-btn {
    background: #1d1e1f;
    border-color: #4c4d4f;
    color: #e5eaf3;
  }

  .back-btn:hover {
    color: #4080ff;
    border-color: #4080ff;
    background: #252627;
  }

  .search-keyword,
  .result-count {
    color: #a8abb2;
  }

  .search-keyword strong {
    color: #4080ff;
  }

  .result-count strong {
    color: #e5eaf3;
  }

  .empty-tip {
    color: #a8abb2;
  }
}
</style>
