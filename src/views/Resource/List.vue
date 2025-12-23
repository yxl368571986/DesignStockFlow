<!--
  资源列表页
  
  功能：
  - 筛选栏（分类、格式、VIP等级、排序）
  - 资源网格（ResourceCard组件）
  - 分页组件（Element Plus Pagination）
  - 加载状态（骨架屏）
  - 空状态提示
  - 使用resourceStore
  - 支持URL参数（分类、关键词、页码）
  
  需求: 需求3.1-3.5（资源浏览）
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResourceStore } from '@/pinia/resourceStore';
import { useConfigStore } from '@/pinia/configStore';
import { useUserStore } from '@/pinia/userStore';
import { useOffline } from '@/composables/useOffline';
import { collectResource } from '@/api/resource';
import ResourceCard from '@/components/business/ResourceCard.vue';
import Loading from '@/components/common/Loading.vue';
import Empty from '@/components/common/Empty.vue';
import { Connection } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

/**
 * 资源列表页组件
 */

const route = useRoute();
const router = useRouter();
const resourceStore = useResourceStore();
const configStore = useConfigStore();
const userStore = useUserStore();
const { isOfflineMode } = useOffline();

// ========== 状态 ==========

/**
 * 筛选条件
 */
const filters = ref({
  categoryId: undefined as string | undefined,
  format: undefined as string | undefined,
  vipLevel: undefined as number | undefined,
  sortType: 'comprehensive' as 'comprehensive' | 'download' | 'latest' | 'like' | 'collect'
});

/**
 * 临时选中的分类ID（用于确定按钮）
 */
const tempSelectedCategoryId = ref<string | undefined>(undefined);

/**
 * 支持的文件格式列表
 */
const formatOptions = [
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
];

/**
 * VIP等级选项
 */
const vipLevelOptions = [
  { label: '全部资源', value: undefined },
  { label: '免费资源', value: 0 },
  { label: 'VIP资源', value: 1 }
];

/**
 * 排序选项
 */
const sortOptions = [
  { label: '综合排序', value: 'comprehensive', description: '综合评分推荐' },
  { label: '最多下载', value: 'download', description: '按下载量排序' },
  { label: '最新发布', value: 'latest', description: '按发布时间排序' },
  { label: '最多好评', value: 'like', description: '按点赞数排序' },
  { label: '最多收藏', value: 'collect', description: '按收藏数排序' }
];

// ========== 计算属性 ==========

/**
 * 资源列表
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
 * 是否有资源
 */
const hasResources = computed(() => resourceStore.hasResources);

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
 * 热门分类列表
 */
const hotCategories = computed(() => {
  return configStore.categories.filter(cat => cat.isHot);
});

/**
 * 全部分类列表（非热门）
 */
const allCategoriesFiltered = computed(() => {
  return configStore.categories.filter(cat => !cat.isHot);
});

/**
 * 是否有筛选条件
 */
const hasFilters = computed(() => {
  return !!(
    filters.value.categoryId ||
    filters.value.format ||
    filters.value.vipLevel !== undefined ||
    resourceStore.searchParams.keyword
  );
});

// ========== 方法 ==========

/**
 * 从 localStorage 加载排序偏好
 */
function loadSortPreference(): 'comprehensive' | 'download' | 'latest' | 'like' | 'collect' {
  try {
    const saved = localStorage.getItem('resource_sort_preference');
    if (saved && ['comprehensive', 'download', 'latest', 'like', 'collect'].includes(saved)) {
      return saved as 'comprehensive' | 'download' | 'latest' | 'like' | 'collect';
    }
  } catch (e) {
    console.warn('加载排序偏好失败:', e);
  }
  return 'comprehensive'; // 默认值
}

/**
 * 保存排序偏好到 localStorage
 */
function saveSortPreference(sortType: 'comprehensive' | 'download' | 'latest' | 'like' | 'collect'): void {
  try {
    localStorage.setItem('resource_sort_preference', sortType);
  } catch (e) {
    console.warn('保存排序偏好失败:', e);
  }
}

/**
 * 从URL参数初始化筛选条件
 */
function initFiltersFromURL() {
  const { categoryId, category, format, vip, sort, page, keyword } = route.query;

  // 设置筛选条件（兼容 categoryId 和 category 两种参数名）
  filters.value.categoryId = (categoryId || category) as string | undefined;
  filters.value.format = format as string | undefined;
  filters.value.vipLevel = vip ? Number(vip) : undefined;
  
  // 排序方式：优先使用URL参数，其次使用localStorage，最后使用默认值
  if (sort && ['comprehensive', 'download', 'latest', 'like', 'collect'].includes(sort as string)) {
    filters.value.sortType = sort as 'comprehensive' | 'download' | 'latest' | 'like' | 'collect';
  } else {
    filters.value.sortType = loadSortPreference();
  }

  // 更新store
  resourceStore.updateSearchParams(
    {
      categoryId: filters.value.categoryId,
      format: filters.value.format,
      vipLevel: filters.value.vipLevel,
      sortType: filters.value.sortType,
      pageNum: page ? Number(page) : 1,
      keyword: keyword as string | undefined
    },
    false // 不自动获取数据
  );
}

/**
 * 更新URL参数
 */
function updateURL() {
  const query: Record<string, string> = {};

  if (filters.value.categoryId) {
    query.categoryId = filters.value.categoryId;
  }
  if (filters.value.format) {
    query.format = filters.value.format;
  }
  if (filters.value.vipLevel !== undefined) {
    query.vip = String(filters.value.vipLevel);
  }
  if (filters.value.sortType !== 'comprehensive') {
    query.sort = filters.value.sortType;
  }
  if (currentPage.value > 1) {
    query.page = String(currentPage.value);
  }
  if (resourceStore.searchParams.keyword) {
    query.keyword = resourceStore.searchParams.keyword;
  }

  // 使用 push 而不是 replace，确保URL完全更新
  router.push({ path: '/resource', query });
}

/**
 * 处理热门分类点击（直接筛选）
 */
function handleHotCategoryClick(categoryId: string | undefined) {
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
  
  // 保存排序偏好到 localStorage
  saveSortPreference(sortType);
  
  updateURL();
}

/**
 * 处理资源卡片点击
 */
function handleResourceClick(resourceId: string) {
  console.log('点击资源:', resourceId);
  // ResourceCard组件内部已处理跳转
}

/**
 * 处理下载
 */
function handleDownload(resourceId: string) {
  console.log('下载资源:', resourceId);
  // TODO: 实现下载逻辑（在后续任务中实现）
}

/**
 * 处理收藏
 */
async function handleCollect(resourceId: string) {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录');
    router.push('/login');
    return;
  }
  
  try {
    const res = await collectResource(resourceId);
    if (res.code === 200) {
      ElMessage.success('收藏成功');
      // 刷新列表更新收藏数
      resourceStore.fetchResources();
    } else {
      ElMessage.error(res.msg || '收藏失败');
    }
  } catch (error) {
    console.error('收藏失败:', error);
    ElMessage.error('收藏失败，请稍后重试');
  }
}

/**
 * 处理页码变化
 */
function handlePageChange(page: number) {
  currentPage.value = page;
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 处理每页数量变化
 */
function handlePageSizeChange(size: number) {
  pageSize.value = size;
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== 生命周期 ==========

onMounted(async () => {
  // 初始化配置（如果还没有加载）
  if (configStore.categories.length === 0) {
    await configStore.fetchCategories();
  }

  // 从URL初始化筛选条件
  initFiltersFromURL();
  
  // 初始化临时选中的分类
  tempSelectedCategoryId.value = filters.value.categoryId;

  // 获取资源列表
  await resourceStore.fetchResources();
});

// 监听路由变化
watch(
  () => route.query,
  () => {
    // 只在资源列表页时响应路由变化
    if (route.name === 'ResourceList') {
      initFiltersFromURL();
      resourceStore.fetchResources();
    }
  }
);
</script>

<template>
  <div class="resource-list-page">
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

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-container">
        <!-- 分类筛选 -->
        <div class="category-filter-section">
          <!-- 热门分类 -->
          <div class="hot-categories">
            <span class="category-section-title">热门分类：</span>
            <div class="category-tags">
              <div
                v-for="category in hotCategories"
                :key="category.categoryId"
                class="category-tag hot-tag"
                :class="{ 'selected': filters.categoryId === category.categoryId }"
                @click="handleHotCategoryClick(category.categoryId)"
              >
                {{ category.categoryName }}
              </div>
            </div>
          </div>

          <!-- 全部分类 -->
          <div class="all-categories">
            <span class="category-section-title">全部分类：</span>
            <div class="category-tags">
              <div
                class="category-tag"
                :class="{ 'selected': filters.categoryId === undefined }"
                @click="handleHotCategoryClick(undefined)"
              >
                全部
              </div>
              <div
                v-for="category in allCategoriesFiltered"
                :key="category.categoryId"
                class="category-tag"
                :class="{ 'selected': filters.categoryId === category.categoryId }"
                @click="handleHotCategoryClick(category.categoryId)"
              >
                {{ category.categoryName }}
              </div>
            </div>
          </div>
        </div>

        <!-- 其他筛选项 -->
        <div class="other-filters">
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
        </div>
      </div>

      <!-- 结果统计 -->
      <div class="result-info">
        <span
          v-if="!loading && hasResources"
          class="result-count"
        >
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

    <!-- 排序栏 -->
    <div class="sort-bar">
      <div class="sort-options">
        <div
          v-for="option in sortOptions"
          :key="option.value"
          class="sort-option"
          :class="{ 'active': filters.sortType === option.value }"
          @click="handleSortChange(option.value as any)"
        >
          <span class="sort-title">{{ option.label }}</span>
          <span
            v-if="option.description"
            class="sort-description"
          >{{ option.description }}</span>
        </div>
      </div>
    </div>

    <!-- 资源网格 -->
    <div class="resource-content">
      <!-- 加载状态 -->
      <Loading
        v-if="loading"
        text="加载中..."
      />

      <!-- 资源列表 -->
      <div
        v-else-if="hasResources"
        class="resource-grid"
      >
        <ResourceCard
          v-for="resource in resources"
          :key="resource.resourceId"
          :resource="resource"
          :show-actions="true"
          @click="handleResourceClick"
          @download="handleDownload"
          @collect="handleCollect"
        />
      </div>

      <!-- 空状态 -->
      <Empty
        v-else
        :description="hasFilters ? '暂无该分类资源' : '暂无资源'"
        :show-action="false"
      />
    </div>

    <!-- 分页 -->
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
  </div>
</template>

<style scoped>
.resource-list-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

/* 离线模式提示 */
.offline-indicator {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-bottom: 1px solid #64b5f6;
  border-radius: 8px;
  padding: 10px 20px;
  margin-bottom: 20px;
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

/* 筛选栏 */
.filter-bar {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 200px;
}

/* 统一图标尺寸 */
.filter-bar :deep(.el-icon) {
  font-size: 14px !important;
}

.filter-bar :deep(.el-select .el-icon) {
  font-size: 14px !important;
}

.filter-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 分类筛选区域 */
.category-filter-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.category-section-title {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  margin-right: 10px;
  white-space: nowrap;
  min-width: 80px;
}

.hot-categories,
.all-categories {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
  align-items: center;
  position: relative;
  z-index: 1;
}

.category-tag {
  padding: 6px 14px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  position: relative;
  overflow: visible;
  line-height: 1.5;
  z-index: 1;
}

.category-tag:hover {
  background: #e8f4ff;
  border-color: #165dff;
  color: #165dff;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.15);
}

.category-tag.selected {
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
  border-color: #165dff;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.4);
}

@keyframes checkmarkAppear {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.category-tag.hot-tag {
  position: relative;
  padding-right: 14px;
}

/* "热"字标签 - 始终保持在左上角外面，无任何变化 */
.category-tag.hot-tag::after {
  content: '热';
  position: absolute;
  top: -6px;
  left: -6px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff7d00 0%, #ffa940 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 3px;
  line-height: 1;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(255, 125, 0, 0.4);
  pointer-events: none;
}

.confirm-button {
  flex-shrink: 0;
  align-self: flex-start;
}

/* 其他筛选项 */
.other-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid #ebeef5;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  font-weight: 500;
  min-width: 40px;
}

.filter-item .el-select {
  width: 140px;
}

/* 排序选项样式 */
.sort-filter {
  flex: 1;
  flex-direction: column;
  align-items: stretch !important;
  gap: 10px;
}

.sort-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sort-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  position: relative;
  overflow: hidden;
  min-width: 100px;
}

.sort-option::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(22, 93, 255, 0.08) 0%, rgba(64, 128, 255, 0.08) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sort-option:hover {
  background: #e8f4ff;
  border-color: #165dff;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.15);
}

.sort-option:hover::before {
  opacity: 1;
}

.sort-option.active {
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
  border-color: #165dff;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
}

.sort-option.active .sort-label {
  color: #fff;
  font-weight: 600;
}

.sort-option.active .sort-description {
  color: rgba(255, 255, 255, 0.9);
}

.sort-label {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  line-height: 1.4;
  position: relative;
  z-index: 1;
}

.sort-description {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
  line-height: 1.2;
  position: relative;
  z-index: 1;
}

.filter-actions {
  margin-left: auto;
}

/* 结果统计 */
.result-info {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: #606266;
  min-height: 40px;
}

.result-count strong,
.search-keyword strong {
  color: #165dff;
  font-weight: 600;
}

/* 排序栏 */
.sort-bar {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.sort-bar .sort-options {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.sort-bar .sort-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  position: relative;
  overflow: hidden;
  flex: 1;
}

.sort-bar .sort-option::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(22, 93, 255, 0.08) 0%, rgba(64, 128, 255, 0.08) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sort-bar .sort-option:hover {
  background: #e8f4ff;
  border-color: #165dff;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.15);
}

.sort-bar .sort-option:hover::before {
  opacity: 1;
}

.sort-bar .sort-option.active {
  background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
  border-color: #165dff;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
}

.sort-bar .sort-option.active .sort-title {
  color: #fff;
  font-weight: 600;
}

.sort-bar .sort-option.active .sort-description {
  color: rgba(255, 255, 255, 0.9);
}

.sort-bar .sort-title {
  font-size: 15px;
  color: #303133;
  font-weight: 500;
  line-height: 1.4;
  position: relative;
  z-index: 1;
}

.sort-bar .sort-description {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
  line-height: 1.2;
  position: relative;
  z-index: 1;
}

/* 资源内容区 */
.resource-content {
  min-height: 600px;
  position: relative;
}

/* 资源网格 */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
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

/* 移动端适配 */
@media (max-width: 768px) {
  .resource-list-page {
    padding: 12px;
  }

  .filter-bar {
    padding: 16px;
    margin-bottom: 16px;
  }

  .filter-container {
    gap: 16px;
  }

  .category-filter-section {
    gap: 12px;
  }

  .category-section-title {
    font-size: 13px;
    margin-right: 8px;
  }

  .hot-categories,
  .all-categories {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .category-tags {
    gap: 8px;
  }

  .category-tag {
    padding: 6px 12px;
    font-size: 13px;
  }

  .category-tag.selected {
    box-shadow: 0 4px 12px rgba(22, 93, 255, 0.35);
  }

  .category-tag.selected::after {
    font-size: 11px;
    top: 1px;
    right: 3px;
  }

  .category-tag.hot-tag {
    padding-right: 18px;
  }

  .category-tag.hot-tag.selected::after {
    left: 3px;
  }

  .confirm-button {
    width: 100%;
  }

  .other-filters {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding-top: 12px;
  }

  .filter-item {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .filter-label {
    font-size: 13px;
  }

  .filter-item .el-select {
    width: 100%;
  }

  .sort-filter {
    gap: 10px;
  }

  .sort-options {
    gap: 8px;
  }

  .sort-option {
    padding: 8px 12px;
    min-width: 100px;
    flex: 1;
  }

  .sort-label {
    font-size: 13px;
  }

  .sort-description {
    font-size: 10px;
  }

  .filter-actions {
    margin-left: 0;
  }

  .filter-actions .el-button {
    width: 100%;
  }

  .result-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
  }

  /* 移动端单列布局 */
  .resource-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .pagination-wrapper {
    padding: 16px;
    margin-top: 20px;
  }

  /* 移动端分页简化 */
  .pagination-wrapper :deep(.el-pagination) {
    justify-content: center;
  }

  .pagination-wrapper :deep(.el-pagination__sizes) {
    display: none;
  }

  .pagination-wrapper :deep(.el-pagination__jump) {
    display: none;
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1200px) {
  .resource-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .filter-item .el-select {
    width: 140px;
  }
}

/* 大屏幕适配 */
@media (min-width: 1201px) {
  .resource-list-page {
    max-width: 1400px;
    margin: 0 auto;
  }

  .resource-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .resource-list-page {
    background: #141414;
  }

  .filter-bar,
  .pagination-wrapper {
    background: #1d1e1f;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .filter-label {
    color: #a8abb2;
  }

  .result-info {
    color: #a8abb2;
    border-top-color: #2b2b2b;
  }

  .result-count strong,
  .search-keyword strong {
    color: #4c9bff;
  }

  .category-tag {
    background: #2b2b2b;
    border-color: #3a3a3a;
    color: #a8abb2;
  }

  .category-tag:hover {
    background: #1e3a5f;
    border-color: #4c9bff;
    color: #4c9bff;
  }

  .category-tag.selected {
    background: linear-gradient(135deg, #4c9bff 0%, #6db0ff 100%);
    border-color: #4c9bff;
    color: #fff;
    box-shadow: 0 6px 16px rgba(76, 155, 255, 0.4);
  }

  .sort-option {
    background: #2b2b2b;
    border-color: #3a3a3a;
  }

  .sort-option:hover {
    background: #1e3a5f;
    border-color: #4c9bff;
  }

  .sort-option.active {
    background: linear-gradient(135deg, #4c9bff 0%, #6db0ff 100%);
    border-color: #4c9bff;
    box-shadow: 0 6px 16px rgba(76, 155, 255, 0.4);
  }

  .sort-label {
    color: #a8abb2;
  }

  .sort-option.active .sort-label {
    color: #fff;
  }

  .sort-description {
    color: #6b6e76;
  }

  .sort-option.active .sort-description {
    color: rgba(255, 255, 255, 0.9);
  }
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

.resource-grid {
  animation: fadeIn 0.3s ease-in-out;
}

/* 筛选栏动画 */
.filter-bar {
  animation: fadeIn 0.2s ease-in-out;
}

</style>
