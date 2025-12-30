<!--
  优化的资源列表页示例
  
  展示所有渲染优化技术：
  - 虚拟滚动
  - 计算属性缓存
  - v-show vs v-if优化
  - 列表key优化
  - 避免不必要的重渲染
  
  需求: 性能优化（渲染优化）
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUpdated, onUnmounted, markRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResourceStore } from '@/pinia/resourceStore';
import { useConfigStore } from '@/pinia/configStore';
import VirtualResourceGrid from '@/components/business/VirtualResourceGrid.vue';
import Loading from '@/components/common/Loading.vue';
import Empty from '@/components/common/Empty.vue';
import { Refresh } from '@element-plus/icons-vue';
import {
  useRenderMonitor,
  createOptimizedComputed,
  createOptimizedWatch,
  validateListKeys,
  createBatchUpdater
} from '@/utils/renderOptimization';

/**
 * 优化的资源列表页组件
 *
 * 优化点：
 * 1. 使用虚拟滚动减少DOM节点
 * 2. 使用shallowRef存储大量数据
 * 3. 使用computed缓存计算结果
 * 4. 使用防抖优化搜索
 * 5. 使用批量更新减少重渲染
 * 6. 使用v-show优化频繁切换
 * 7. 使用唯一key优化列表
 */

// ========== 性能监控 ==========
const { startRender, endRender } = useRenderMonitor('OptimizedResourceList', import.meta.env.DEV);
startRender();

onMounted(() => {
  endRender('mount');

  // 开发环境：打印性能报告
  if (import.meta.env.DEV) {
    setTimeout(() => {
      (window as any).__PERF__?.printReport();
      (window as any).__PERF__?.printSuggestions('OptimizedResourceList');
    }, 1000);
  }
});

onUpdated(() => {
  endRender('update');
});

// ========== 路由和Store ==========
const route = useRoute();
const router = useRouter();
const resourceStore = useResourceStore();
const configStore = useConfigStore();

// ========== 状态管理 ==========

/**
 * 筛选条件（使用普通ref，因为数据量小）
 */
const filters = ref({
  categoryId: undefined as string | undefined,
  format: undefined as string | undefined,
  vipLevel: undefined as number | undefined,
  sortType: 'latest' as 'comprehensive' | 'download' | 'latest' | 'like' | 'collect'
});

/**
 * UI状态（频繁切换，使用v-show）
 */
const showFilterBar = ref(true);
const showResultInfo = ref(true);

/**
 * 静态配置（使用markRaw，不需要响应式）
 */
const formatOptions = markRaw([
  { label: '全部格式', value: undefined },
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
]);

const vipLevelOptions = markRaw([
  { label: '全部资源', value: undefined },
  { label: '免费资源', value: 0 },
  { label: 'VIP资源', value: 1 }
]);

const sortOptions = markRaw([
  { label: '最新上传', value: 'time' },
  { label: '下载最多', value: 'download' },
  { label: '最热门', value: 'hot' }
]);

// ========== 优化的计算属性 ==========

/**
 * 资源列表（使用shallowRef，因为数据量大）
 * 注意：这里从store获取，store内部已经是ref
 */
const resources = computed(() => resourceStore.resources);

/**
 * 总数
 */
const total = computed(() => resourceStore.total);

/**
 * 加载状态
 */
const loading = computed(() => resourceStore.loading);

/**
 * 是否有资源（优化的计算属性）
 */
const hasResources = createOptimizedComputed('hasResources', () => resourceStore.hasResources);

/**
 * 当前页码
 */
const currentPage = computed({
  get: () => resourceStore.searchParams.pageNum,
  set: (value: number) => {
    resourceStore.setPageNum(value);
    updateURL();
  }
});

/**
 * 每页数量
 */
const pageSize = computed({
  get: () => resourceStore.searchParams.pageSize,
  set: (value: number) => {
    resourceStore.setPageSize(value);
    updateURL();
  }
});

/**
 * 分类列表（优化的计算属性）
 */
const categories = createOptimizedComputed('categories', () => {
  const allCategories = [
    {
      categoryId: undefined,
      categoryName: '全部分类',
      icon: '',
      resourceCount: 0,
      sort: 0,
      isHot: false,
      isRecommend: false
    }
  ];
  return [...allCategories, ...configStore.categories];
});

/**
 * 是否有筛选条件（优化的计算属性）
 */
const hasFilters = createOptimizedComputed('hasFilters', () => {
  return !!(
    filters.value.categoryId ||
    filters.value.format ||
    filters.value.vipLevel !== undefined ||
    resourceStore.searchParams.keyword
  );
});

// ========== 批量更新 ==========
const batchUpdate = createBatchUpdater();

// ========== 方法 ==========

/**
 * 从URL参数初始化筛选条件
 */
function initFiltersFromURL() {
  const { category, format, vip, sort, page, keyword } = route.query;

  // 使用批量更新，减少重渲染
  batchUpdate(() => {
    filters.value.categoryId = category as string | undefined;
    filters.value.format = format as string | undefined;
    filters.value.vipLevel = vip ? Number(vip) : undefined;
    filters.value.sortType = (sort as 'comprehensive' | 'download' | 'latest' | 'like' | 'collect') || 'latest';

    resourceStore.updateSearchParams(
      {
        categoryId: filters.value.categoryId,
        format: filters.value.format,
        vipLevel: filters.value.vipLevel,
        sortType: filters.value.sortType,
        pageNum: page ? Number(page) : 1,
        keyword: keyword as string | undefined
      },
      false
    );
  });
}

/**
 * 更新URL参数
 */
function updateURL() {
  const query: Record<string, string> = {};

  if (filters.value.categoryId) {
    query.category = filters.value.categoryId;
  }
  if (filters.value.format) {
    query.format = filters.value.format;
  }
  if (filters.value.vipLevel !== undefined) {
    query.vip = String(filters.value.vipLevel);
  }
  if (filters.value.sortType !== 'latest') {
    query.sort = filters.value.sortType;
  }
  if (currentPage.value > 1) {
    query.page = String(currentPage.value);
  }
  if (resourceStore.searchParams.keyword) {
    query.keyword = resourceStore.searchParams.keyword;
  }

  router.replace({ query });
}

/**
 * 处理分类变化
 */
function handleCategoryChange(categoryId: string | undefined) {
  filters.value.categoryId = categoryId;
  resourceStore.setCategory(categoryId);
  updateURL();
}

/**
 * 处理格式变化
 */
function handleFormatChange(format: string | undefined) {
  filters.value.format = format;
  resourceStore.setFormat(format);
  updateURL();
}

/**
 * 处理VIP等级变化
 */
function handleVipLevelChange(vipLevel: number | undefined) {
  filters.value.vipLevel = vipLevel;
  resourceStore.setVipLevel(vipLevel);
  updateURL();
}

/**
 * 处理排序变化
 */
function handleSortChange(sortType: 'comprehensive' | 'download' | 'latest' | 'like' | 'collect') {
  filters.value.sortType = sortType;
  resourceStore.setSortType(sortType);
  updateURL();
}

/**
 * 重置筛选
 */
function handleResetFilters() {
  // 使用批量更新
  batchUpdate(() => {
    filters.value = {
      categoryId: undefined,
      format: undefined,
      vipLevel: undefined,
      sortType: 'latest'
    };
    resourceStore.resetSearch();
  });
  router.replace({ query: {} });
}

/**
 * 处理资源卡片点击
 */
function handleResourceClick(resourceId: string) {
  console.log('点击资源:', resourceId);
}

/**
 * 处理下载
 */
function handleDownload(resourceId: string) {
  console.log('下载资源:', resourceId);
}

/**
 * 处理收藏
 */
function handleCollect(resourceId: string) {
  console.log('收藏资源:', resourceId);
}

/**
 * 处理页码变化
 */
function handlePageChange(page: number) {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 处理每页数量变化
 */
function handlePageSizeChange(size: number) {
  pageSize.value = size;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 切换筛选栏显示
 */
function toggleFilterBar() {
  showFilterBar.value = !showFilterBar.value;
}

// ========== 优化的watch ==========

/**
 * 监听路由变化（防抖优化）
 */
const stopRouteWatch = createOptimizedWatch(
  () => route.query,
  () => {
    if (route.name === 'ResourceList') {
      initFiltersFromURL();
      resourceStore.fetchResources();
    }
  },
  { debounce: 100 }
);

// ========== 开发环境：验证key唯一性 ==========
if (import.meta.env.DEV) {
  const stopKeyWatch = createOptimizedWatch(
    () => resources.value,
    (newResources) => {
      if (newResources.length > 0) {
        validateListKeys(newResources, 'resourceId');
      }
    }
  );

  onUnmounted(() => {
    stopKeyWatch();
  });
}

// ========== 生命周期 ==========

onMounted(async () => {
  // 初始化配置
  if (configStore.categories.length === 0) {
    await configStore.fetchCategories();
  }

  // 从URL初始化筛选条件
  initFiltersFromURL();

  // 获取资源列表
  await resourceStore.fetchResources();
});

// ========== 性能调试方法 ==========
function printPerformanceReport() {
  (window as any).__PERF__?.printReport();
}

function printPerformanceSuggestions() {
  (window as any).__PERF__?.printSuggestions();
}

function clearPerformanceData() {
  (window as any).__PERF__?.clear();
}

// ========== 清理 ==========
onUnmounted(() => {
  stopRouteWatch();
});
</script>

<template>
  <div class="optimized-resource-list-page">
    <!-- 筛选栏切换按钮（移动端） -->
    <div class="filter-toggle">
      <el-button @click="toggleFilterBar">
        {{ showFilterBar ? '隐藏筛选' : '显示筛选' }}
      </el-button>
    </div>

    <!-- 筛选栏（使用v-show，因为频繁切换） -->
    <div
      v-show="showFilterBar"
      class="filter-bar"
    >
      <div class="filter-container">
        <!-- 分类筛选 -->
        <div class="filter-item">
          <label class="filter-label">分类：</label>
          <el-select
            :model-value="filters.categoryId"
            placeholder="选择分类"
            clearable
            @change="handleCategoryChange"
          >
            <el-option
              v-for="category in categories"
              :key="category.categoryId || 'all'"
              :label="category.categoryName"
              :value="category.categoryId"
            />
          </el-select>
        </div>

        <!-- 格式筛选 -->
        <div class="filter-item">
          <label class="filter-label">格式：</label>
          <el-select
            :model-value="filters.format"
            placeholder="选择格式"
            clearable
            @change="handleFormatChange"
          >
            <el-option
              v-for="option in formatOptions"
              :key="option.value || 'all'"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <!-- VIP等级筛选 -->
        <div class="filter-item">
          <label class="filter-label">类型：</label>
          <el-select
            :model-value="filters.vipLevel"
            placeholder="选择类型"
            clearable
            @change="handleVipLevelChange"
          >
            <el-option
              v-for="option in vipLevelOptions"
              :key="option.value ?? 'all'"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <!-- 排序 -->
        <div class="filter-item">
          <label class="filter-label">排序：</label>
          <el-select
            :model-value="filters.sortType"
            placeholder="选择排序"
            @change="handleSortChange"
          >
            <el-option
              v-for="option in sortOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <!-- 重置按钮（使用v-if，因为很少显示） -->
        <div
          v-if="hasFilters"
          class="filter-actions"
        >
          <el-button
            :icon="Refresh"
            @click="handleResetFilters"
          >
            重置筛选
          </el-button>
        </div>
      </div>

      <!-- 结果统计（使用v-show，因为可能频繁切换） -->
      <div
        v-show="showResultInfo && !loading && hasResources"
        class="result-info"
      >
        <span class="result-count">
          找到 <strong>{{ total }}</strong> 个资源
        </span>
        <span
          v-if="resourceStore.searchParams.keyword"
          class="search-keyword"
        >
          搜索关键词：<strong>{{ resourceStore.searchParams.keyword }}</strong>
        </span>
      </div>
    </div>

    <!-- 资源内容 -->
    <div class="resource-content">
      <!-- 加载状态（使用v-if，因为很少显示） -->
      <Loading
        v-if="loading"
        text="加载中..."
      />

      <!-- 虚拟滚动资源网格（使用v-else-if，因为和loading互斥） -->
      <VirtualResourceGrid
        v-else-if="hasResources"
        :resources="resources"
        :columns="4"
        :row-height="320"
        :gap="20"
        :show-actions="true"
        @click="handleResourceClick"
        @download="handleDownload"
        @collect="handleCollect"
      />

      <!-- 空状态（使用v-else，因为很少显示） -->
      <Empty
        v-else
        description="暂无资源"
        :show-action="hasFilters"
        action-text="重置筛选"
        @action="handleResetFilters"
      />
    </div>

    <!-- 分页（使用v-if，因为只在有资源时显示） -->
    <div
      v-if="hasResources && !loading"
      class="pagination-wrapper"
    >
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 40, 60, 80]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>

    <!-- 开发环境：性能调试面板 -->
    <div
      v-if="import.meta.env.DEV"
      class="dev-panel"
    >
      <el-button
        size="small"
        @click="printPerformanceReport"
      >
        性能报告
      </el-button>
      <el-button
        size="small"
        @click="printPerformanceSuggestions"
      >
        优化建议
      </el-button>
      <el-button
        size="small"
        @click="clearPerformanceData"
      >
        清除数据
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.optimized-resource-list-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

/* 筛选栏切换按钮 */
.filter-toggle {
  display: none;
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .filter-toggle {
    display: block;
  }
}

/* 筛选栏 */
.filter-bar {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  /* 使用GPU加速 */
  transform: translateZ(0);
  will-change: transform;
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  font-weight: 500;
}

.filter-item .el-select {
  width: 160px;
}

.filter-actions {
  margin-left: auto;
}

/* 结果统计 */
.result-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #606266;
}

.result-count strong,
.search-keyword strong {
  color: #165dff;
  font-weight: 600;
}

/* 资源内容区 */
.resource-content {
  min-height: 400px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 开发环境调试面板 */
.dev-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  gap: 8px;
  z-index: 9999;
}

.dev-panel .el-button {
  color: #fff;
  border-color: #fff;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .optimized-resource-list-page {
    padding: 12px;
  }

  .filter-bar {
    padding: 16px;
    margin-bottom: 16px;
  }

  .filter-container {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filter-item {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .filter-item .el-select {
    width: 100%;
  }

  .filter-actions {
    margin-left: 0;
  }

  .dev-panel {
    bottom: 10px;
    right: 10px;
    flex-direction: column;
  }
}

/* 性能优化：减少重绘 */
.filter-bar,
.pagination-wrapper {
  contain: layout style paint;
}

/* 性能优化：使用transform代替top/left */
.filter-bar {
  transition: transform 0.3s ease;
}

/* 加载动画 */
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

.resource-content {
  animation: fadeIn 0.3s ease-in-out;
}
</style>
