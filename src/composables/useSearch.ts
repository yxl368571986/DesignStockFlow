/**
 * 搜索组合式函数
 * 提供搜索、搜索联想、防抖等功能
 */

import { ref, readonly, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useResourceStore } from '@/pinia/resourceStore';
import { getSearchSuggestions } from '@/api/content';

/**
 * 防抖函数
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    // 清除之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // 设置新的定时器
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 搜索组合式函数
 */
export function useSearch() {
  const router = useRouter();
  const resourceStore = useResourceStore();

  // ========== 状态 ==========

  /**
   * 搜索关键词
   */
  const keyword = ref<string>('');

  /**
   * 搜索联想列表
   */
  const suggestions = ref<string[]>([]);

  /**
   * 是否显示联想列表
   */
  const showSuggestions = ref<boolean>(false);

  /**
   * 是否正在加载联想
   */
  const loadingSuggestions = ref<boolean>(false);

  /**
   * 是否正在搜索
   */
  const searching = ref<boolean>(false);

  /**
   * 错误信息
   */
  const error = ref<string | null>(null);

  // ========== 方法 ==========

  /**
   * 获取搜索联想（内部方法，不防抖）
   * @param searchKeyword 搜索关键词
   */
  async function _fetchSuggestions(searchKeyword: string): Promise<void> {
    // 如果关键词为空或长度小于2，清空联想列表
    if (!searchKeyword || searchKeyword.trim().length < 2) {
      suggestions.value = [];
      showSuggestions.value = false;
      return;
    }

    loadingSuggestions.value = true;
    error.value = null;

    try {
      const response = await getSearchSuggestions(searchKeyword.trim(), 10);

      if (response.code === 200 && response.data) {
        suggestions.value = response.data;
        showSuggestions.value = response.data.length > 0;
      } else {
        suggestions.value = [];
        showSuggestions.value = false;
      }
    } catch (e) {
      console.error('获取搜索联想失败:', e);
      suggestions.value = [];
      showSuggestions.value = false;
      error.value = (e as Error).message || '获取搜索联想失败';
    } finally {
      loadingSuggestions.value = false;
    }
  }

  /**
   * 获取搜索联想（防抖300ms）
   * @param searchKeyword 搜索关键词
   */
  const fetchSuggestions = debounce(_fetchSuggestions, 300);

  /**
   * 执行搜索
   * @param searchKeyword 可选，搜索关键词，不传则使用当前keyword
   */
  async function handleSearch(searchKeyword?: string): Promise<void> {
    // 使用传入的关键词或当前关键词
    const finalKeyword = searchKeyword !== undefined ? searchKeyword : keyword.value;

    // 如果关键词为空，不执行搜索
    if (!finalKeyword || finalKeyword.trim().length === 0) {
      return;
    }

    searching.value = true;
    error.value = null;

    try {
      // 更新关键词
      keyword.value = finalKeyword.trim();

      // 隐藏联想列表
      showSuggestions.value = false;

      // 更新资源Store的搜索参数
      resourceStore.updateSearchParams({
        keyword: keyword.value,
        pageNum: 1
      });

      // 跳转到搜索结果页（如果不在搜索页）
      if (router.currentRoute.value.path !== '/search') {
        await router.push({
          path: '/search',
          query: {
            keyword: keyword.value
          }
        });
      } else {
        // 如果已经在搜索页，更新URL参数
        await router.replace({
          path: '/search',
          query: {
            keyword: keyword.value
          }
        });
      }

      console.log('执行搜索:', keyword.value);
    } catch (e) {
      error.value = (e as Error).message || '搜索失败';
      console.error('搜索失败:', e);
    } finally {
      searching.value = false;
    }
  }

  /**
   * 选择联想词
   * @param suggestion 联想词
   */
  async function selectSuggestion(suggestion: string): Promise<void> {
    // 更新关键词
    keyword.value = suggestion;

    // 隐藏联想列表
    showSuggestions.value = false;

    // 执行搜索
    await handleSearch(suggestion);
  }

  /**
   * 清空搜索
   */
  function clearSearch(): void {
    keyword.value = '';
    suggestions.value = [];
    showSuggestions.value = false;
    error.value = null;
  }

  /**
   * 隐藏联想列表
   */
  function hideSuggestions(): void {
    showSuggestions.value = false;
  }

  /**
   * 显示联想列表
   */
  function showSuggestionsPanel(): void {
    if (suggestions.value.length > 0) {
      showSuggestions.value = true;
    }
  }

  /**
   * 重置错误状态
   */
  function resetError(): void {
    error.value = null;
  }

  // ========== 监听器 ==========

  /**
   * 监听关键词变化，自动获取联想
   */
  watch(keyword, (newKeyword) => {
    if (newKeyword && newKeyword.trim().length >= 2) {
      fetchSuggestions(newKeyword);
    } else {
      suggestions.value = [];
      showSuggestions.value = false;
    }
  });

  // ========== 返回公共接口 ==========
  return {
    // 状态（keyword可写，其他只读）
    keyword,
    suggestions: readonly(suggestions),
    showSuggestions: readonly(showSuggestions),
    loadingSuggestions: readonly(loadingSuggestions),
    searching: readonly(searching),
    error: readonly(error),

    // 方法
    handleSearch,
    fetchSuggestions,
    selectSuggestion,
    clearSearch,
    hideSuggestions,
    showSuggestionsPanel,
    resetError
  };
}
