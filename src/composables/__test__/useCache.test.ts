/**
 * useCache 组合式函数单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCache, getGlobalCache } from '../useCache';

describe('useCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('基本功能', () => {
    it('应该能够设置和获取缓存', () => {
      const { set, get } = useCache();

      const testData = { id: 1, name: 'Test' };
      set('test-key', testData);

      const result = get('test-key');
      expect(result).toEqual(testData);
    });

    it('应该在缓存不存在时返回null', () => {
      const { get } = useCache();

      const result = get('non-existent-key');
      expect(result).toBeNull();
    });

    it('应该能够存储不同类型的数据', () => {
      const { set, get } = useCache();

      // 字符串
      set('string', 'hello');
      expect(get('string')).toBe('hello');

      // 数字
      set('number', 42);
      expect(get('number')).toBe(42);

      // 布尔值
      set('boolean', true);
      expect(get('boolean')).toBe(true);

      // 数组
      set('array', [1, 2, 3]);
      expect(get('array')).toEqual([1, 2, 3]);

      // 对象
      set('object', { a: 1, b: 2 });
      expect(get('object')).toEqual({ a: 1, b: 2 });

      // null
      set('null', null);
      expect(get('null')).toBeNull();

      // undefined
      set('undefined', undefined);
      expect(get('undefined')).toBeUndefined();
    });
  });

  describe('TTL过期机制', () => {
    it('应该在TTL过期后返回null', () => {
      const { set, get } = useCache({ ttl: 5000 }); // 5秒TTL

      set('test-key', 'test-value');

      // 立即获取应该成功
      expect(get('test-key')).toBe('test-value');

      // 4秒后应该还能获取
      vi.advanceTimersByTime(4000);
      expect(get('test-key')).toBe('test-value');

      // 6秒后应该过期
      vi.advanceTimersByTime(2000);
      expect(get('test-key')).toBeNull();
    });

    it('应该支持自定义TTL', () => {
      const { set, get } = useCache({ ttl: 10000 }); // 默认10秒

      // 使用默认TTL
      set('key1', 'value1');

      // 使用自定义TTL（5秒）
      set('key2', 'value2', 5000);

      // 6秒后
      vi.advanceTimersByTime(6000);

      // key1应该还有效（默认10秒）
      expect(get('key1')).toBe('value1');

      // key2应该已过期（自定义5秒）
      expect(get('key2')).toBeNull();
    });

    it('应该使用默认TTL（30分钟）', () => {
      const { set, get } = useCache(); // 不传TTL，使用默认30分钟

      set('test-key', 'test-value');

      // 29分钟后应该还有效
      vi.advanceTimersByTime(29 * 60 * 1000);
      expect(get('test-key')).toBe('test-value');

      // 31分钟后应该过期
      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(get('test-key')).toBeNull();
    });
  });

  describe('clear方法', () => {
    it('应该能够清除指定缓存', () => {
      const { set, get, clear } = useCache();

      set('key1', 'value1');
      set('key2', 'value2');

      // 清除key1
      const cleared = clear('key1');
      expect(cleared).toBe(true);

      // key1应该不存在
      expect(get('key1')).toBeNull();

      // key2应该还存在
      expect(get('key2')).toBe('value2');
    });

    it('应该在清除不存在的缓存时返回false', () => {
      const { clear } = useCache();

      const cleared = clear('non-existent-key');
      expect(cleared).toBe(false);
    });
  });

  describe('clearAll方法', () => {
    it('应该能够清除所有缓存', () => {
      const { set, get, clearAll } = useCache();

      set('key1', 'value1');
      set('key2', 'value2');
      set('key3', 'value3');

      clearAll();

      expect(get('key1')).toBeNull();
      expect(get('key2')).toBeNull();
      expect(get('key3')).toBeNull();
    });

    it('应该在清空后能够重新设置缓存', () => {
      const { set, get, clearAll } = useCache();

      set('key1', 'value1');
      clearAll();

      set('key1', 'new-value');
      expect(get('key1')).toBe('new-value');
    });
  });

  describe('has方法', () => {
    it('应该正确检查缓存是否存在', () => {
      const { set, has } = useCache();

      expect(has('test-key')).toBe(false);

      set('test-key', 'test-value');
      expect(has('test-key')).toBe(true);
    });

    it('应该在缓存过期后返回false', () => {
      const { set, has } = useCache({ ttl: 5000 });

      set('test-key', 'test-value');
      expect(has('test-key')).toBe(true);

      vi.advanceTimersByTime(6000);
      expect(has('test-key')).toBe(false);
    });

    it('应该在检查过期缓存时自动清除', () => {
      const { set, has, size } = useCache({ ttl: 5000 });

      set('test-key', 'test-value');
      expect(size()).toBe(1);

      vi.advanceTimersByTime(6000);
      has('test-key'); // 触发过期检查

      expect(size()).toBe(0);
    });
  });

  describe('size方法', () => {
    it('应该返回正确的缓存数量', () => {
      const { set, size } = useCache();

      expect(size()).toBe(0);

      set('key1', 'value1');
      expect(size()).toBe(1);

      set('key2', 'value2');
      expect(size()).toBe(2);

      set('key3', 'value3');
      expect(size()).toBe(3);
    });

    it('应该在清除缓存后更新数量', () => {
      const { set, clear, size } = useCache();

      set('key1', 'value1');
      set('key2', 'value2');
      expect(size()).toBe(2);

      clear('key1');
      expect(size()).toBe(1);
    });
  });

  describe('keys方法', () => {
    it('应该返回所有缓存键', () => {
      const { set, keys } = useCache();

      set('key1', 'value1');
      set('key2', 'value2');
      set('key3', 'value3');

      const allKeys = keys();
      expect(allKeys).toHaveLength(3);
      expect(allKeys).toContain('key1');
      expect(allKeys).toContain('key2');
      expect(allKeys).toContain('key3');
    });

    it('应该在空缓存时返回空数组', () => {
      const { keys } = useCache();

      expect(keys()).toEqual([]);
    });
  });

  describe('clearExpired方法', () => {
    it('应该清除所有过期缓存', () => {
      const { set, get, clearExpired } = useCache({ ttl: 5000 });

      set('key1', 'value1'); // 5秒TTL
      set('key2', 'value2', 10000); // 10秒TTL
      set('key3', 'value3'); // 5秒TTL

      // 6秒后，key1和key3应该过期
      vi.advanceTimersByTime(6000);

      const cleared = clearExpired();
      expect(cleared).toBe(2);

      // key1和key3应该被清除
      expect(get('key1')).toBeNull();
      expect(get('key3')).toBeNull();

      // key2应该还存在
      expect(get('key2')).toBe('value2');
    });

    it('应该在没有过期缓存时返回0', () => {
      const { set, clearExpired } = useCache({ ttl: 10000 });

      set('key1', 'value1');
      set('key2', 'value2');

      vi.advanceTimersByTime(5000);

      const cleared = clearExpired();
      expect(cleared).toBe(0);
    });
  });

  describe('统计信息', () => {
    it('应该正确统计缓存命中次数', () => {
      const { set, get, stats } = useCache();

      set('key1', 'value1');

      expect(stats.value.hits).toBe(0);

      get('key1'); // 命中
      expect(stats.value.hits).toBe(1);

      get('key1'); // 再次命中
      expect(stats.value.hits).toBe(2);
    });

    it('应该正确统计缓存未命中次数', () => {
      const { get, stats } = useCache();

      expect(stats.value.misses).toBe(0);

      get('non-existent'); // 未命中
      expect(stats.value.misses).toBe(1);

      get('another-non-existent'); // 再次未命中
      expect(stats.value.misses).toBe(2);
    });

    it('应该正确统计设置次数', () => {
      const { set, stats } = useCache();

      expect(stats.value.sets).toBe(0);

      set('key1', 'value1');
      expect(stats.value.sets).toBe(1);

      set('key2', 'value2');
      expect(stats.value.sets).toBe(2);
    });

    it('应该正确统计清除次数', () => {
      const { set, clear, clearAll, stats } = useCache();

      set('key1', 'value1');
      set('key2', 'value2');
      set('key3', 'value3');

      expect(stats.value.clears).toBe(0);

      clear('key1');
      expect(stats.value.clears).toBe(1);

      clearAll(); // 清除2个缓存
      expect(stats.value.clears).toBe(3);
    });

    it('应该能够重置统计信息', () => {
      const { set, get, stats, resetStats } = useCache();

      set('key1', 'value1');
      get('key1');
      get('non-existent');

      expect(stats.value.hits).toBeGreaterThan(0);
      expect(stats.value.misses).toBeGreaterThan(0);
      expect(stats.value.sets).toBeGreaterThan(0);

      resetStats();

      expect(stats.value.hits).toBe(0);
      expect(stats.value.misses).toBe(0);
      expect(stats.value.sets).toBe(0);
      expect(stats.value.clears).toBe(0);
    });

    it('应该正确计算缓存命中率', () => {
      const { set, get, getHitRate } = useCache();

      set('key1', 'value1');

      // 初始命中率为0
      expect(getHitRate()).toBe(0);

      // 2次命中，1次未命中
      get('key1'); // 命中
      get('key1'); // 命中
      get('non-existent'); // 未命中

      // 命中率应该是 2/3
      expect(getHitRate()).toBeCloseTo(2 / 3);
    });
  });

  describe('边界情况', () => {
    it('应该能够覆盖已存在的缓存', () => {
      const { set, get } = useCache();

      set('key1', 'old-value');
      expect(get('key1')).toBe('old-value');

      set('key1', 'new-value');
      expect(get('key1')).toBe('new-value');
    });

    it('应该能够处理空字符串作为键', () => {
      const { set, get } = useCache();

      set('', 'empty-key-value');
      expect(get('')).toBe('empty-key-value');
    });

    it('应该能够处理特殊字符作为键', () => {
      const { set, get } = useCache();

      const specialKeys = ['key:with:colons', 'key/with/slashes', 'key.with.dots'];

      specialKeys.forEach((key) => {
        set(key, `value-for-${key}`);
        expect(get(key)).toBe(`value-for-${key}`);
      });
    });

    it('应该在获取过期缓存时自动清除', () => {
      const { set, get, size } = useCache({ ttl: 5000 });

      set('test-key', 'test-value');
      expect(size()).toBe(1);

      vi.advanceTimersByTime(6000);

      // 获取过期缓存应该返回null并自动清除
      expect(get('test-key')).toBeNull();
      expect(size()).toBe(0);
    });
  });

  describe('getGlobalCache', () => {
    it('应该返回单例实例', () => {
      const cache1 = getGlobalCache();
      const cache2 = getGlobalCache();

      expect(cache1).toBe(cache2);
    });

    it('应该在不同调用间共享数据', () => {
      const cache1 = getGlobalCache();
      cache1.set('shared-key', 'shared-value');

      const cache2 = getGlobalCache();
      expect(cache2.get('shared-key')).toBe('shared-value');
    });

    it('应该能够在全局实例中使用所有功能', () => {
      const cache = getGlobalCache();

      // 清空之前的数据
      cache.clearAll();

      // 设置新数据
      cache.set('global-test-key', 'global-test-value', 5000);

      // 验证可以获取
      expect(cache.get('global-test-key')).toBe('global-test-value');

      // 验证过期后无法获取
      vi.advanceTimersByTime(6000);
      expect(cache.get('global-test-key')).toBeNull();
    });
  });

  describe('实际使用场景', () => {
    it('应该能够缓存API响应数据', () => {
      const { set, get } = useCache({ ttl: 5 * 60 * 1000 }); // 5分钟

      const apiResponse = {
        code: 200,
        data: {
          list: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' }
          ],
          total: 2
        }
      };

      set('api:resource-list', apiResponse);

      const cached = get('api:resource-list');
      expect(cached).toEqual(apiResponse);
    });

    it('应该能够缓存用户配置', () => {
      const { set, get } = useCache({ ttl: 30 * 60 * 1000 }); // 30分钟

      const userConfig = {
        theme: 'dark',
        language: 'zh-CN',
        pageSize: 20
      };

      set('user:config', userConfig);

      const cached = get('user:config');
      expect(cached).toEqual(userConfig);
    });

    it('应该能够实现缓存失效重新获取的模式', () => {
      const { set, get } = useCache({ ttl: 5000 });

      // 模拟数据获取函数
      let fetchCount = 0;
      const fetchData = () => {
        fetchCount++;
        return { data: `fetch-${fetchCount}` };
      };

      // 首次获取
      let cached = get('data-key');
      if (!cached) {
        cached = fetchData();
        set('data-key', cached);
      }
      expect(cached).toEqual({ data: 'fetch-1' });
      expect(fetchCount).toBe(1);

      // 再次获取（使用缓存）
      cached = get('data-key');
      expect(cached).toEqual({ data: 'fetch-1' });
      expect(fetchCount).toBe(1); // 没有重新获取

      // 缓存过期后获取
      vi.advanceTimersByTime(6000);
      cached = get('data-key');
      if (!cached) {
        cached = fetchData();
        set('data-key', cached);
      }
      expect(cached).toEqual({ data: 'fetch-2' });
      expect(fetchCount).toBe(2); // 重新获取了
    });
  });
});
