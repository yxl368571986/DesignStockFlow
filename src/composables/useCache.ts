/**
 * 缓存管理组合式函数
 * 提供通用的内存缓存功能，支持TTL（Time To Live）过期机制
 */

import { ref, readonly } from 'vue';

/**
 * 缓存项接口
 */
interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // 生存时间（毫秒）
}

/**
 * 缓存配置接口
 */
interface CacheOptions {
  ttl?: number; // 默认TTL（毫秒），默认30分钟
}

/**
 * 默认缓存时间：30分钟
 */
const DEFAULT_TTL = 30 * 60 * 1000;

/**
 * 缓存管理组合式函数
 *
 * @param options 缓存配置选项
 * @returns 缓存管理方法
 *
 * @example
 * ```typescript
 * const { get, set, clear, clearAll } = useCache({ ttl: 5 * 60 * 1000 });
 *
 * // 设置缓存
 * set('user-list', userData);
 *
 * // 获取缓存
 * const cachedData = get('user-list');
 *
 * // 清除指定缓存
 * clear('user-list');
 *
 * // 清除所有缓存
 * clearAll();
 * ```
 */
export function useCache(options: CacheOptions = {}) {
  const defaultTTL = options.ttl || DEFAULT_TTL;

  /**
   * 缓存存储（使用Map实现）
   */
  const cache = ref<Map<string, CacheItem>>(new Map());

  /**
   * 缓存统计信息
   */
  const stats = ref({
    hits: 0, // 缓存命中次数
    misses: 0, // 缓存未命中次数
    sets: 0, // 设置缓存次数
    clears: 0 // 清除缓存次数
  });

  /**
   * 检查缓存项是否过期
   *
   * @param item 缓存项
   * @returns 是否过期
   */
  function isExpired(item: CacheItem): boolean {
    const now = Date.now();
    return now - item.timestamp >= item.ttl;
  }

  /**
   * 获取缓存数据
   *
   * @param key 缓存键
   * @returns 缓存的数据，如果不存在或已过期则返回null
   *
   * @example
   * ```typescript
   * const userData = get<User[]>('user-list');
   * if (userData) {
   *   console.log('使用缓存数据:', userData);
   * } else {
   *   console.log('缓存未命中，需要重新获取');
   * }
   * ```
   */
  function get<T = any>(key: string): T | null {
    const item = cache.value.get(key);

    // 缓存不存在
    if (!item) {
      stats.value.misses++;
      return null;
    }

    // 检查是否过期
    if (isExpired(item)) {
      // 自动清除过期缓存
      cache.value.delete(key);
      stats.value.misses++;
      return null;
    }

    // 缓存命中
    stats.value.hits++;
    return item.data as T;
  }

  /**
   * 设置缓存数据
   *
   * @param key 缓存键
   * @param data 要缓存的数据
   * @param ttl 可选的自定义TTL（毫秒），不传则使用默认TTL
   *
   * @example
   * ```typescript
   * // 使用默认TTL（30分钟）
   * set('user-list', userData);
   *
   * // 使用自定义TTL（5分钟）
   * set('hot-resources', hotData, 5 * 60 * 1000);
   * ```
   */
  function set<T = any>(key: string, data: T, ttl?: number): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || defaultTTL
    };

    cache.value.set(key, cacheItem);
    stats.value.sets++;
  }

  /**
   * 清除指定缓存
   *
   * @param key 缓存键
   * @returns 是否成功清除（如果缓存不存在则返回false）
   *
   * @example
   * ```typescript
   * const cleared = clear('user-list');
   * if (cleared) {
   *   console.log('缓存已清除');
   * }
   * ```
   */
  function clear(key: string): boolean {
    const existed = cache.value.has(key);
    if (existed) {
      cache.value.delete(key);
      stats.value.clears++;
    }
    return existed;
  }

  /**
   * 清除所有缓存
   *
   * @example
   * ```typescript
   * clearAll();
   * console.log('所有缓存已清除');
   * ```
   */
  function clearAll(): void {
    const count = cache.value.size;
    cache.value.clear();
    stats.value.clears += count;
  }

  /**
   * 检查缓存是否存在且有效
   *
   * @param key 缓存键
   * @returns 缓存是否存在且未过期
   *
   * @example
   * ```typescript
   * if (has('user-list')) {
   *   console.log('缓存存在且有效');
   * }
   * ```
   */
  function has(key: string): boolean {
    const item = cache.value.get(key);
    if (!item) {
      return false;
    }
    if (isExpired(item)) {
      cache.value.delete(key);
      return false;
    }
    return true;
  }

  /**
   * 获取缓存大小（缓存项数量）
   *
   * @returns 缓存项数量
   */
  function size(): number {
    return cache.value.size;
  }

  /**
   * 获取所有缓存键
   *
   * @returns 缓存键数组
   */
  function keys(): string[] {
    return Array.from(cache.value.keys());
  }

  /**
   * 清除所有过期缓存
   *
   * @returns 清除的缓存项数量
   *
   * @example
   * ```typescript
   * const cleared = clearExpired();
   * console.log(`清除了 ${cleared} 个过期缓存`);
   * ```
   */
  function clearExpired(): number {
    const keysToDelete: string[] = [];

    cache.value.forEach((item, key) => {
      if (isExpired(item)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      cache.value.delete(key);
    });

    stats.value.clears += keysToDelete.length;
    return keysToDelete.length;
  }

  /**
   * 重置统计信息
   */
  function resetStats(): void {
    stats.value = {
      hits: 0,
      misses: 0,
      sets: 0,
      clears: 0
    };
  }

  /**
   * 获取缓存命中率
   *
   * @returns 命中率（0-1之间的小数）
   */
  function getHitRate(): number {
    const total = stats.value.hits + stats.value.misses;
    if (total === 0) {
      return 0;
    }
    return stats.value.hits / total;
  }

  return {
    // 核心方法
    get,
    set,
    clear,
    clearAll,

    // 辅助方法
    has,
    size,
    keys,
    clearExpired,

    // 统计信息
    stats: readonly(stats),
    resetStats,
    getHitRate
  };
}

/**
 * 创建单例缓存实例
 * 用于全局共享的缓存场景
 */
let globalCacheInstance: ReturnType<typeof useCache> | null = null;

/**
 * 获取全局缓存实例
 *
 * @param options 缓存配置选项（仅在首次调用时生效）
 * @returns 全局缓存实例
 *
 * @example
 * ```typescript
 * // 在应用初始化时创建全局缓存
 * const cache = getGlobalCache({ ttl: 10 * 60 * 1000 });
 *
 * // 在其他地方使用同一个缓存实例
 * const cache = getGlobalCache();
 * cache.set('key', 'value');
 * ```
 */
export function getGlobalCache(options?: CacheOptions): ReturnType<typeof useCache> {
  if (!globalCacheInstance) {
    globalCacheInstance = useCache(options);
  }
  return globalCacheInstance;
}
