/**
 * 资源状态管理 Store
 * 管理资源列表、搜索参数、缓存等
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ResourceInfo, SearchParams } from '@/types/models';
import { getResourceList } from '@/api/resource';
import { saveResources, getAllResources } from '@/utils/indexedDB';

// 缓存配置
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 缓存数据结构
interface CacheData {
  data: ResourceInfo[];
  total: number;
  timestamp: number;
  params: SearchParams;
}

/**
 * 生成缓存键
 */
function generateCacheKey(params: SearchParams): string {
  return JSON.stringify(params);
}

/**
 * 检查缓存是否有效
 */
function isCacheValid(cache: CacheData | null): boolean {
  if (!cache) {
    return false;
  }
  const now = Date.now();
  return now - cache.timestamp < CACHE_DURATION;
}

export const useResourceStore = defineStore('resource', () => {
  // ========== 状态 (State) ==========

  /**
   * 资源列表
   */
  const resources = ref<ResourceInfo[]>([]);

  /**
   * 资源总数
   */
  const total = ref<number>(0);

  /**
   * 加载状态
   */
  const loading = ref<boolean>(false);

  /**
   * 错误信息
   */
  const error = ref<string | null>(null);

  /**
   * 搜索参数
   */
  const searchParams = ref<SearchParams>({
    keyword: undefined,
    categoryId: undefined,
    format: undefined,
    vipLevel: undefined,
    pricingType: undefined,
    sortType: 'comprehensive',
    pageNum: 1,
    pageSize: 21
  });

  /**
   * 缓存Map（键为参数JSON字符串，值为缓存数据）
   */
  const cache = ref<Map<string, CacheData>>(new Map());

  // ========== 计算属性 (Getters) ==========

  /**
   * 是否有资源数据
   */
  const hasResources = computed(() => {
    return resources.value.length > 0;
  });

  /**
   * 总页数
   */
  const totalPages = computed(() => {
    return Math.ceil(total.value / searchParams.value.pageSize);
  });

  /**
   * 是否有下一页
   */
  const hasNextPage = computed(() => {
    return searchParams.value.pageNum < totalPages.value;
  });

  /**
   * 是否有上一页
   */
  const hasPrevPage = computed(() => {
    return searchParams.value.pageNum > 1;
  });

  /**
   * 当前是否有筛选条件
   */
  const hasFilters = computed(() => {
    return !!(
      searchParams.value.keyword ||
      searchParams.value.categoryId ||
      searchParams.value.format ||
      searchParams.value.vipLevel !== undefined ||
      searchParams.value.pricingType !== undefined
    );
  });

  // ========== 操作 (Actions) ==========

  /**
   * 获取资源列表
   * 支持缓存策略：5分钟内相同参数的请求直接返回缓存
   * 支持离线模式：离线时从IndexedDB加载资源
   */
  async function fetchResources(forceOnline: boolean = false): Promise<void> {
    // 生成缓存键
    const cacheKey = generateCacheKey(searchParams.value);

    // 检查是否在线
    const isOnline = navigator.onLine;

    // 如果离线且不强制在线模式，从IndexedDB加载
    if (!isOnline && !forceOnline) {
      console.log('离线模式：从IndexedDB加载资源');
      loading.value = true;
      error.value = null;

      try {
        const cachedResources = await getAllResources();
        resources.value = cachedResources;
        total.value = cachedResources.length;
        console.log('从IndexedDB加载资源:', cachedResources.length, '条');
      } catch (e) {
        const errorMessage = (e as Error).message || '加载缓存资源失败';
        error.value = errorMessage;
        console.error('加载缓存资源失败:', e);
        resources.value = [];
        total.value = 0;
      } finally {
        loading.value = false;
      }
      return;
    }

    // 在线模式：检查内存缓存
    const cachedData = cache.value.get(cacheKey);
    if (cachedData && isCacheValid(cachedData)) {
      console.log('使用缓存数据:', cacheKey);
      resources.value = cachedData.data;
      total.value = cachedData.total;
      loading.value = false; // 确保缓存命中时 loading 为 false
      return;
    }

    // 缓存无效或不存在，发起请求
    loading.value = true;
    error.value = null;

    try {
      const response = await getResourceList(searchParams.value);

      if (response.code === 200 && response.data) {
        // 更新状态 - 后端已经处理了排序和分页，直接使用返回的数据
        resources.value = response.data.list;
        total.value = response.data.total;

        // 保存到内存缓存
        cache.value.set(cacheKey, {
          data: response.data.list,
          total: response.data.total,
          timestamp: Date.now(),
          params: { ...searchParams.value }
        });

        // 保存到IndexedDB（用于离线访问）
        try {
          await saveResources(response.data.list);
          console.log('资源已缓存到IndexedDB');
        } catch (e) {
          console.warn('缓存到IndexedDB失败:', e);
          // 不影响主流程，静默失败
        }

        console.log('获取资源列表成功:', response.data.list.length, '条');
      } else {
        throw new Error(response.msg || '获取资源列表失败');
      }
    } catch (e) {
      const errorMessage = (e as Error).message || '获取资源列表失败';
      error.value = errorMessage;
      console.error('获取资源列表失败:', e);

      // 失败时清空数据
      resources.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更新搜索参数
   * @param updates 要更新的参数
   * @param autoFetch 是否自动获取数据，默认true
   */
  function updateSearchParams(updates: Partial<SearchParams>, autoFetch: boolean = true): void {
    // 检查是否只更新了分页参数
    const isOnlyPaginationUpdate = 
      (updates.pageNum !== undefined || updates.pageSize !== undefined) &&
      updates.keyword === undefined &&
      updates.categoryId === undefined &&
      updates.format === undefined &&
      updates.vipLevel === undefined &&
      updates.pricingType === undefined &&
      updates.sortType === undefined;

    // 如果更新了筛选条件（非分页），且没有显式传入pageNum，则重置页码
    const shouldResetPage = !isOnlyPaginationUpdate && 
      updates.pageNum === undefined &&
      (
        updates.keyword !== undefined ||
        updates.categoryId !== undefined ||
        updates.format !== undefined ||
        updates.vipLevel !== undefined ||
        updates.pricingType !== undefined ||
        updates.sortType !== undefined
      );

    // 更新参数
    searchParams.value = {
      ...searchParams.value,
      ...updates
    };

    // 重置页码（仅当筛选条件变化且未显式传入pageNum时）
    if (shouldResetPage) {
      searchParams.value.pageNum = 1;
    }

    // 自动获取数据
    if (autoFetch) {
      fetchResources();
    }
  }

  /**
   * 重置搜索
   * 清除所有筛选条件，恢复默认状态
   */
  function resetSearch(): void {
    searchParams.value = {
      keyword: undefined,
      categoryId: undefined,
      format: undefined,
      vipLevel: undefined,
      pricingType: undefined,
      sortType: 'comprehensive',
      pageNum: 1,
      pageSize: 21
    };

    // 清空资源列表
    resources.value = [];
    total.value = 0;
    error.value = null;

    // 重新获取数据
    fetchResources();
  }

  /**
   * 设置关键词
   * @param keyword 搜索关键词
   */
  function setKeyword(keyword: string): void {
    updateSearchParams({ keyword });
  }

  /**
   * 设置分类
   * @param categoryId 分类ID
   */
  function setCategory(categoryId: string | undefined): void {
    updateSearchParams({ categoryId });
  }

  /**
   * 设置格式
   * @param format 文件格式
   */
  function setFormat(format: string | undefined): void {
    updateSearchParams({ format });
  }

  /**
   * 设置VIP等级
   * @param vipLevel VIP等级
   */
  function setVipLevel(vipLevel: number | undefined): void {
    updateSearchParams({ vipLevel });
  }

  /**
   * 设置定价类型
   * @param pricingType 定价类型: 0-免费, 1-付费积分, 2-VIP专属
   */
  function setPricingType(pricingType: number | undefined): void {
    updateSearchParams({ pricingType });
  }

  /**
   * 设置排序方式
   * @param sortType 排序类型
   */
  function setSortType(sortType: 'comprehensive' | 'download' | 'latest' | 'like' | 'collect'): void {
    updateSearchParams({ sortType });
  }

  /**
   * 设置页码
   * @param pageNum 页码
   */
  function setPageNum(pageNum: number): void {
    updateSearchParams({ pageNum });
  }

  /**
   * 设置每页数量
   * @param pageSize 每页数量
   */
  function setPageSize(pageSize: number): void {
    updateSearchParams({ pageSize });
  }

  /**
   * 下一页
   */
  function nextPage(): void {
    if (hasNextPage.value) {
      setPageNum(searchParams.value.pageNum + 1);
    }
  }

  /**
   * 上一页
   */
  function prevPage(): void {
    if (hasPrevPage.value) {
      setPageNum(searchParams.value.pageNum - 1);
    }
  }

  /**
   * 清除缓存
   * @param cacheKey 可选，指定要清除的缓存键，不传则清除所有缓存
   */
  function clearCache(cacheKey?: string): void {
    if (cacheKey) {
      cache.value.delete(cacheKey);
      console.log('清除指定缓存:', cacheKey);
    } else {
      cache.value.clear();
      console.log('清除所有缓存');
    }
  }

  /**
   * 清除过期缓存
   */
  function clearExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    cache.value.forEach((value, key) => {
      if (now - value.timestamp >= CACHE_DURATION) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      cache.value.delete(key);
    });

    if (keysToDelete.length > 0) {
      console.log('清除过期缓存:', keysToDelete.length, '条');
    }
  }

  /**
   * 根据资源ID查找资源
   * @param resourceId 资源ID
   */
  function findResourceById(resourceId: string): ResourceInfo | undefined {
    return resources.value.find((r) => r.resourceId === resourceId);
  }

  /**
   * 更新资源信息（用于收藏、下载次数等局部更新）
   * @param resourceId 资源ID
   * @param updates 要更新的字段
   */
  function updateResource(resourceId: string, updates: Partial<ResourceInfo>): void {
    const index = resources.value.findIndex((r) => r.resourceId === resourceId);
    if (index !== -1) {
      resources.value[index] = {
        ...resources.value[index],
        ...updates
      };
    }
  }

  /**
   * 重置Store状态
   */
  function reset(): void {
    resources.value = [];
    total.value = 0;
    loading.value = false;
    error.value = null;
    searchParams.value = {
      keyword: undefined,
      categoryId: undefined,
      format: undefined,
      vipLevel: undefined,
      pricingType: undefined,
      sortType: 'comprehensive',
      pageNum: 1,
      pageSize: 21
    };
    cache.value.clear();
  }

  // 定期清除过期缓存（每分钟检查一次）
  setInterval(() => {
    clearExpiredCache();
  }, 60 * 1000);

  // ========== 返回公共接口 ==========
  return {
    // 状态
    resources,
    total,
    loading,
    error,
    searchParams,

    // 计算属性
    hasResources,
    totalPages,
    hasNextPage,
    hasPrevPage,
    hasFilters,

    // 操作
    fetchResources,
    updateSearchParams,
    resetSearch,
    setKeyword,
    setCategory,
    setFormat,
    setVipLevel,
    setPricingType,
    setSortType,
    setPageNum,
    setPageSize,
    nextPage,
    prevPage,
    clearCache,
    clearExpiredCache,
    findResourceById,
    updateResource,
    reset
  };
});
