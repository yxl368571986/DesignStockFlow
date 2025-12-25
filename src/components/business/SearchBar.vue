<!--
  搜索框组件
  
  功能：
  - 输入框（支持清空按钮）
  - 搜索按钮
  - 搜索联想下拉列表（防抖300ms）
  - 历史搜索记录（localStorage存储）
  - 热门搜索词展示
  - 使用useSearch组合式函数
  
  需求: 需求7.1-7.3（搜索功能）
-->

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Search, Close, Clock, TrendCharts } from '@element-plus/icons-vue';
import { useSearch } from '@/composables/useSearch';
import { getHotSearchKeywords } from '@/api/content';
import { sanitizeHTML } from '@/utils/security';

/**
 * 搜索框组件
 */

// Props定义
interface SearchBarProps {
  /** 占位符文本 */
  placeholder?: string;
  /** 是否显示搜索按钮 */
  showButton?: boolean;
  /** 最大历史记录数量 */
  maxHistory?: number;
  /** 是否自动聚焦 */
  autofocus?: boolean;
}

const props = withDefaults(defineProps<SearchBarProps>(), {
  placeholder: '搜索设计资源...',
  showButton: true,
  maxHistory: 10,
  autofocus: false
});

// Emits定义
const emit = defineEmits<{
  search: [keyword: string];
  clear: [];
}>();

// 使用搜索组合式函数
const {
  keyword,
  suggestions,
  showSuggestions,
  loadingSuggestions,
  searching,
  handleSearch,
  selectSuggestion,
  clearSearch,
  hideSuggestions,
  showSuggestionsPanel
} = useSearch();

// 本地状态
const inputRef = ref<HTMLInputElement | null>(null);
const searchBarRef = ref<HTMLElement | null>(null);
const showPanel = ref(false); // 是否显示下拉面板
const activeTab = ref<'suggestions' | 'history' | 'hot'>('suggestions'); // 当前激活的标签
const searchHistory = ref<string[]>([]); // 搜索历史
const hotKeywords = ref<string[]>([]); // 热门搜索词
const loadingHot = ref(false); // 是否正在加载热门搜索

// 历史记录存储键
const HISTORY_STORAGE_KEY = 'search_history';

// Note: clearable prop on el-input handles clear button automatically

// 计算属性：是否显示联想列表
const showSuggestionsTab = computed(() => {
  return showSuggestions.value && suggestions.value.length > 0;
});

// 计算属性：是否显示历史记录
const showHistoryTab = computed(() => {
  return searchHistory.value.length > 0;
});

// 计算属性：是否显示热门搜索
const showHotTab = computed(() => {
  return hotKeywords.value.length > 0;
});

// Note: Tab switching is handled automatically based on available data

/**
 * 加载搜索历史
 */
function loadSearchHistory() {
  try {
    const historyStr = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (historyStr) {
      const history = JSON.parse(historyStr);
      if (Array.isArray(history)) {
        searchHistory.value = history.slice(0, props.maxHistory);
      }
    }
  } catch (e) {
    console.error('加载搜索历史失败:', e);
    searchHistory.value = [];
  }
}

/**
 * 保存搜索历史
 * @param searchKeyword 搜索关键词
 */
function saveSearchHistory(searchKeyword: string) {
  if (!searchKeyword || searchKeyword.trim().length === 0) {
    return;
  }

  const trimmedKeyword = searchKeyword.trim();

  // 移除重复项
  const filteredHistory = searchHistory.value.filter((item) => item !== trimmedKeyword);

  // 添加到开头
  filteredHistory.unshift(trimmedKeyword);

  // 限制数量
  searchHistory.value = filteredHistory.slice(0, props.maxHistory);

  // 保存到localStorage
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(searchHistory.value));
  } catch (e) {
    console.error('保存搜索历史失败:', e);
  }
}

/**
 * 清空搜索历史
 */
function clearSearchHistory() {
  searchHistory.value = [];
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (e) {
    console.error('清空搜索历史失败:', e);
  }
}

/**
 * 删除单条历史记录
 * @param index 索引
 */
function removeHistoryItem(index: number) {
  searchHistory.value.splice(index, 1);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(searchHistory.value));
  } catch (e) {
    console.error('删除历史记录失败:', e);
  }
}

/**
 * 加载热门搜索词
 */
async function loadHotKeywords() {
  loadingHot.value = true;
  try {
    const response = await getHotSearchKeywords(10);
    if (response.code === 200 && response.data) {
      hotKeywords.value = response.data;
    }
  } catch (e) {
    console.error('加载热门搜索词失败:', e);
  } finally {
    loadingHot.value = false;
  }
}

/**
 * 处理输入框聚焦
 */
function handleFocus() {
  showPanel.value = true;

  // 如果有联想结果，显示联想
  if (showSuggestionsTab.value) {
    activeTab.value = 'suggestions';
    showSuggestionsPanel();
  }
  // 否则显示历史记录或热门搜索
  else if (showHistoryTab.value) {
    activeTab.value = 'history';
  } else if (showHotTab.value) {
    activeTab.value = 'hot';
  }
}

/**
 * 处理输入框失焦
 */
function handleBlur() {
  // 延迟隐藏，以便点击下拉项时能触发事件
  setTimeout(() => {
    showPanel.value = false;
    hideSuggestions();
  }, 200);
}

/**
 * 处理搜索
 */
async function handleSearchClick() {
  if (!keyword.value || keyword.value.trim().length === 0) {
    return;
  }

  // 保存到历史记录
  saveSearchHistory(keyword.value);

  // 执行搜索
  await handleSearch();

  // 触发事件
  emit('search', keyword.value);

  // 隐藏下拉面板
  showPanel.value = false;

  // 失焦输入框
  inputRef.value?.blur();
}

/**
 * 处理清空
 */
function handleClear() {
  clearSearch();
  emit('clear');
  inputRef.value?.focus();
}

/**
 * 处理选择联想词
 * @param suggestion 联想词
 */
function handleSelectSuggestion(suggestion: string) {
  // 保存到历史记录
  saveSearchHistory(suggestion);

  // 选择联想词
  selectSuggestion(suggestion);

  // 触发事件
  emit('search', suggestion);

  // 隐藏下拉面板
  showPanel.value = false;

  // 失焦输入框
  inputRef.value?.blur();
}

/**
 * 处理选择历史记录
 * @param historyItem 历史记录
 */
function handleSelectHistory(historyItem: string) {
  keyword.value = historyItem;
  handleSearchClick();
}

/**
 * 处理选择热门搜索
 * @param hotKeyword 热门搜索词
 */
function handleSelectHot(hotKeyword: string) {
  keyword.value = hotKeyword;
  handleSearchClick();
}

/**
 * 处理回车键
 */
function handleEnter() {
  handleSearchClick();
}

/**
 * 处理点击外部区域
 */
function handleClickOutside(event: MouseEvent) {
  if (searchBarRef.value && !searchBarRef.value.contains(event.target as Node)) {
    showPanel.value = false;
    hideSuggestions();
  }
}

// 生命周期钩子
onMounted(() => {
  // 加载搜索历史
  loadSearchHistory();

  // 加载热门搜索词
  loadHotKeywords();

  // 监听点击外部区域
  document.addEventListener('click', handleClickOutside);

  // 自动聚焦
  if (props.autofocus) {
    inputRef.value?.focus();
  }
});

onBeforeUnmount(() => {
  // 移除事件监听
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div
    ref="searchBarRef"
    class="search-bar"
  >
    <!-- 搜索输入框 -->
    <div class="search-input-wrapper">
      <el-input
        ref="inputRef"
        v-model="keyword"
        name="search"
        :placeholder="placeholder"
        :loading="searching"
        clearable
        size="large"
        class="search-input"
        @focus="handleFocus"
        @blur="handleBlur"
        @keyup.enter="handleEnter"
        @clear="handleClear"
      >
        <template #prefix>
          <el-icon class="search-icon">
            <Search />
          </el-icon>
        </template>
      </el-input>

      <!-- 搜索按钮 -->
      <el-button
        v-if="showButton"
        type="primary"
        size="large"
        :loading="searching"
        :icon="Search"
        class="search-button"
        @click="handleSearchClick"
      >
        搜索
      </el-button>
    </div>

    <!-- 下拉面板 -->
    <transition name="dropdown">
      <div
        v-show="showPanel"
        class="search-dropdown"
      >
        <!-- 搜索联想 -->
        <div
          v-if="showSuggestionsTab"
          class="dropdown-section"
        >
          <div class="section-header">
            <el-icon><Search /></el-icon>
            <span>搜索建议</span>
          </div>
          <div class="section-content">
            <div
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="dropdown-item suggestion-item"
              @click="handleSelectSuggestion(suggestion)"
            >
              <el-icon class="item-icon">
                <Search />
              </el-icon>
              <span
                class="item-text"
                v-html="sanitizeHTML(suggestion)"
              />
            </div>
            <div
              v-if="loadingSuggestions"
              class="loading-item"
            >
              <el-icon class="is-loading">
                <Search />
              </el-icon>
              <span>加载中...</span>
            </div>
          </div>
        </div>

        <!-- 搜索历史 -->
        <div
          v-if="showHistoryTab && !showSuggestionsTab"
          class="dropdown-section"
        >
          <div class="section-header">
            <el-icon><Clock /></el-icon>
            <span>搜索历史</span>
            <el-button
              text
              size="small"
              class="clear-history-btn"
              @click.stop="clearSearchHistory"
            >
              清空
            </el-button>
          </div>
          <div class="section-content">
            <div
              v-for="(item, index) in searchHistory"
              :key="index"
              class="dropdown-item history-item"
              @click="handleSelectHistory(item)"
            >
              <el-icon class="item-icon">
                <Clock />
              </el-icon>
              <span class="item-text">{{ item }}</span>
              <el-icon
                class="remove-icon"
                @click.stop="removeHistoryItem(index)"
              >
                <Close />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 热门搜索 -->
        <div
          v-if="showHotTab && !showSuggestionsTab && !showHistoryTab"
          class="dropdown-section"
        >
          <div class="section-header">
            <el-icon><TrendCharts /></el-icon>
            <span>热门搜索</span>
          </div>
          <div class="section-content">
            <div
              v-for="(item, index) in hotKeywords"
              :key="index"
              class="dropdown-item hot-item"
              @click="handleSelectHot(item)"
            >
              <span
                class="hot-index"
                :class="{ 'top-three': index < 3 }"
              >
                {{ index + 1 }}
              </span>
              <span class="item-text">{{ item }}</span>
            </div>
            <div
              v-if="loadingHot"
              class="loading-item"
            >
              <el-icon class="is-loading">
                <TrendCharts />
              </el-icon>
              <span>加载中...</span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="!showSuggestionsTab && !showHistoryTab && !showHotTab"
          class="empty-state"
        >
          <el-icon><Search /></el-icon>
          <span>输入关键词开始搜索</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  width: 100%;
}

/* 搜索输入框容器 */
.search-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
}

:deep(.el-input__wrapper) {
  border-radius: 24px;
  padding: 8px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 2px 12px rgba(22, 93, 255, 0.2);
}

.search-icon {
  color: #909399;
  font-size: 18px;
}

/* 搜索按钮 */
.search-button {
  border-radius: 24px;
  padding: 12px 32px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.3);
  transition: all 0.3s ease;
}

.search-button:hover {
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.4);
  transform: translateY(-1px);
}

.search-button:active {
  transform: translateY(0);
}

/* 下拉面板 */
.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1001;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 区块 */
.dropdown-section {
  padding: 12px 0;
}

.dropdown-section + .dropdown-section {
  border-top: 1px solid #f0f0f0;
}

/* 区块标题 */
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #909399;
}

.section-header .el-icon {
  font-size: 16px;
}

.clear-history-btn {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}

.clear-history-btn:hover {
  color: #165dff;
}

/* 区块内容 */
.section-content {
  padding: 4px 0;
}

/* 下拉项 */
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f5f7fa;
}

.item-icon {
  flex-shrink: 0;
  font-size: 16px;
  color: #909399;
}

.item-text {
  flex: 1;
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 联想项 */
.suggestion-item .item-icon {
  color: #165dff;
}

/* 历史项 */
.history-item {
  position: relative;
}

.remove-icon {
  flex-shrink: 0;
  font-size: 14px;
  color: #c0c4cc;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.history-item:hover .remove-icon {
  opacity: 1;
}

.remove-icon:hover {
  color: #f56c6c;
}

/* 热门项 */
.hot-item {
  gap: 12px;
}

.hot-index {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: #909399;
  background: #f5f7fa;
  border-radius: 4px;
}

.hot-index.top-three {
  color: #fff;
  background: linear-gradient(135deg, #ff7d00 0%, #ff9d3d 100%);
}

/* 加载项 */
.loading-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  font-size: 13px;
  color: #909399;
}

.loading-item .el-icon {
  font-size: 16px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 16px;
  color: #c0c4cc;
}

.empty-state .el-icon {
  font-size: 48px;
}

.empty-state span {
  font-size: 13px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .search-input-wrapper {
    gap: 8px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 20px;
    padding: 6px 16px;
  }

  .search-button {
    border-radius: 20px;
    padding: 10px 24px;
    font-size: 14px;
  }

  .search-dropdown {
    border-radius: 8px;
    max-height: 300px;
  }

  .dropdown-item {
    padding: 12px 16px;
  }

  .item-text {
    font-size: 13px;
  }

  .section-header {
    font-size: 12px;
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1200px) {
  .search-button {
    padding: 12px 28px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .search-dropdown {
    background: #1d1e1f;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  .dropdown-section + .dropdown-section {
    border-top-color: #2b2b2b;
  }

  .section-header {
    color: #a8abb2;
  }

  .dropdown-item:hover {
    background-color: #2b2b2b;
  }

  .item-text {
    color: #e5eaf3;
  }

  .item-icon {
    color: #a8abb2;
  }

  .hot-index {
    color: #a8abb2;
    background: #2b2b2b;
  }

  .empty-state {
    color: #606266;
  }
}

/* 滚动条样式 */
.search-dropdown::-webkit-scrollbar {
  width: 6px;
}

.search-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.search-dropdown::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.search-dropdown::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

@media (prefers-color-scheme: dark) {
  .search-dropdown::-webkit-scrollbar-thumb {
    background: #606266;
  }

  .search-dropdown::-webkit-scrollbar-thumb:hover {
    background: #909399;
  }
}
</style>
