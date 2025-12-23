/**
 * LocalStorage 缓存工具类
 * 提供类型安全的localStorage操作，支持过期时间、命名空间、加密存储
 */

/**
 * 存储项接口
 */
interface StorageItem<T = any> {
  data: T;
  timestamp: number;
  expireTime?: number; // 过期时间戳（毫秒）
}

/**
 * 存储配置接口
 */
interface StorageOptions {
  namespace?: string; // 命名空间前缀
  encrypt?: boolean; // 是否加密存储（暂未实现）
}

/**
 * LocalStorage 工具类
 *
 * @example
 * ```typescript
 * const storage = new Storage({ namespace: 'app' });
 *
 * // 设置缓存（永久）
 * storage.set('user', userData);
 *
 * // 设置缓存（5分钟过期）
 * storage.set('token', tokenData, 5 * 60 * 1000);
 *
 * // 获取缓存
 * const user = storage.get<User>('user');
 *
 * // 移除缓存
 * storage.remove('user');
 *
 * // 清空所有缓存
 * storage.clear();
 * ```
 */
export class Storage {
  private namespace: string;

  constructor(options: StorageOptions = {}) {
    this.namespace = options.namespace || 'startide';
    // Note: encrypt option is reserved for future implementation
    // Currently not used but kept in interface for API compatibility
  }

  /**
   * 生成带命名空间的键名
   *
   * @param key 原始键名
   * @returns 带命名空间的键名
   */
  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * 检查存储项是否过期
   *
   * @param item 存储项
   * @returns 是否过期
   */
  private isExpired(item: StorageItem): boolean {
    if (!item.expireTime) {
      return false;
    }
    return Date.now() > item.expireTime;
  }

  /**
   * 设置缓存
   *
   * @param key 缓存键
   * @param data 要缓存的数据
   * @param ttl 可选的过期时间（毫秒），不传则永久有效
   * @returns 是否设置成功
   *
   * @example
   * ```typescript
   * // 永久缓存
   * storage.set('user', userData);
   *
   * // 5分钟后过期
   * storage.set('token', tokenData, 5 * 60 * 1000);
   * ```
   */
  set<T = any>(key: string, data: T, ttl?: number): boolean {
    try {
      const item: StorageItem<T> = {
        data,
        timestamp: Date.now(),
        expireTime: ttl ? Date.now() + ttl : undefined
      };

      const storageKey = this.getKey(key);
      const value = JSON.stringify(item);

      localStorage.setItem(storageKey, value);
      return true;
    } catch (error) {
      console.error(`Failed to set storage [${key}]:`, error);

      // 如果是存储空间不足，尝试清理过期缓存后重试
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, clearing expired items...');
        this.clearExpired();

        try {
          const item: StorageItem<T> = {
            data,
            timestamp: Date.now(),
            expireTime: ttl ? Date.now() + ttl : undefined
          };
          localStorage.setItem(this.getKey(key), JSON.stringify(item));
          return true;
        } catch (retryError) {
          console.error('Failed to set storage after cleanup:', retryError);
        }
      }

      return false;
    }
  }

  /**
   * 获取缓存
   *
   * @param key 缓存键
   * @returns 缓存的数据，如果不存在或已过期则返回null
   *
   * @example
   * ```typescript
   * const user = storage.get<User>('user');
   * if (user) {
   *   console.log('用户信息:', user);
   * }
   * ```
   */
  get<T = any>(key: string): T | null {
    try {
      const storageKey = this.getKey(key);
      const value = localStorage.getItem(storageKey);

      if (!value) {
        return null;
      }

      const item: StorageItem<T> = JSON.parse(value);

      // 检查是否过期
      if (this.isExpired(item)) {
        // 自动删除过期项
        this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error(`Failed to get storage [${key}]:`, error);
      return null;
    }
  }

  /**
   * 移除指定缓存
   *
   * @param key 缓存键
   * @returns 是否移除成功
   *
   * @example
   * ```typescript
   * storage.remove('user');
   * ```
   */
  remove(key: string): boolean {
    try {
      const storageKey = this.getKey(key);
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error(`Failed to remove storage [${key}]:`, error);
      return false;
    }
  }

  /**
   * 检查缓存是否存在且有效
   *
   * @param key 缓存键
   * @returns 缓存是否存在且未过期
   *
   * @example
   * ```typescript
   * if (storage.has('user')) {
   *   console.log('用户信息存在');
   * }
   * ```
   */
  has(key: string): boolean {
    const data = this.get(key);
    return data !== null;
  }

  /**
   * 清空当前命名空间下的所有缓存
   *
   * @example
   * ```typescript
   * storage.clear();
   * ```
   */
  clear(): void {
    try {
      const prefix = `${this.namespace}:`;
      const keysToRemove: string[] = [];

      // 收集所有匹配命名空间的键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      // 删除所有匹配的键
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * 清空所有localStorage（包括其他命名空间）
   *
   * @example
   * ```typescript
   * storage.clearAll();
   * ```
   */
  clearAll(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear all storage:', error);
    }
  }

  /**
   * 获取当前命名空间下的所有键
   *
   * @returns 键名数组（不包含命名空间前缀）
   *
   * @example
   * ```typescript
   * const keys = storage.keys();
   * console.log('所有缓存键:', keys);
   * ```
   */
  keys(): string[] {
    try {
      const prefix = `${this.namespace}:`;
      const keys: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          // 移除命名空间前缀
          keys.push(key.substring(prefix.length));
        }
      }

      return keys;
    } catch (error) {
      console.error('Failed to get storage keys:', error);
      return [];
    }
  }

  /**
   * 获取当前命名空间下的缓存项数量
   *
   * @returns 缓存项数量
   */
  size(): number {
    return this.keys().length;
  }

  /**
   * 清除所有过期的缓存项
   *
   * @returns 清除的缓存项数量
   *
   * @example
   * ```typescript
   * const cleared = storage.clearExpired();
   * console.log(`清除了 ${cleared} 个过期缓存`);
   * ```
   */
  clearExpired(): number {
    try {
      const prefix = `${this.namespace}:`;
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const item: StorageItem = JSON.parse(value);
              if (this.isExpired(item)) {
                keysToRemove.push(key);
              }
            }
          } catch (parseError) {
            // 如果解析失败，也删除该项
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      return keysToRemove.length;
    } catch (error) {
      console.error('Failed to clear expired storage:', error);
      return 0;
    }
  }

  /**
   * 获取存储使用情况
   *
   * @returns 存储使用信息
   */
  getUsage(): {
    used: number; // 已使用字节数（估算）
    total: number; // 总容量（估算，通常为5-10MB）
    percentage: number; // 使用百分比
  } {
    try {
      let used = 0;

      // 计算当前命名空间使用的存储空间
      const prefix = `${this.namespace}:`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            // 估算：key + value 的字符数 * 2（UTF-16编码）
            used += (key.length + value.length) * 2;
          }
        }
      }

      // localStorage通常限制为5-10MB，这里假设5MB
      const total = 5 * 1024 * 1024;
      const percentage = (used / total) * 100;

      return {
        used,
        total,
        percentage: Math.min(percentage, 100)
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return {
        used: 0,
        total: 5 * 1024 * 1024,
        percentage: 0
      };
    }
  }
}

/**
 * 创建默认的Storage实例
 */
export const storage = new Storage({ namespace: 'startide' });

/**
 * 创建用户相关的Storage实例
 */
export const userStorage = new Storage({ namespace: 'startide:user' });

/**
 * 创建缓存相关的Storage实例
 */
export const cacheStorage = new Storage({ namespace: 'startide:cache' });

/**
 * 便捷方法：设置缓存
 */
export function setStorage<T = any>(key: string, data: T, ttl?: number): boolean {
  return storage.set(key, data, ttl);
}

/**
 * 便捷方法：获取缓存
 */
export function getStorage<T = any>(key: string): T | null {
  return storage.get<T>(key);
}

/**
 * 便捷方法：移除缓存
 */
export function removeStorage(key: string): boolean {
  return storage.remove(key);
}

/**
 * 便捷方法：清空缓存
 */
export function clearStorage(): void {
  storage.clear();
}
