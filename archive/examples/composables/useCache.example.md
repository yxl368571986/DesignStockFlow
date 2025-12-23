# useCache 使用示例

`useCache` 是一个通用的内存缓存管理组合式函数，支持 TTL（Time To Live）过期机制。

## 基本用法

### 1. 创建缓存实例

```typescript
import { useCache } from '@/composables';

// 使用默认配置（30分钟TTL）
const cache = useCache();

// 自定义TTL（5分钟）
const cache = useCache({ ttl: 5 * 60 * 1000 });
```

### 2. 设置和获取缓存

```typescript
const { set, get } = useCache();

// 设置缓存
set('user-list', userData);

// 获取缓存
const cachedData = get('user-list');
if (cachedData) {
  console.log('使用缓存数据:', cachedData);
} else {
  console.log('缓存未命中，需要重新获取');
}
```

### 3. 自定义TTL

```typescript
const { set, get } = useCache({ ttl: 10 * 60 * 1000 }); // 默认10分钟

// 使用默认TTL
set('key1', 'value1');

// 使用自定义TTL（5分钟）
set('key2', 'value2', 5 * 60 * 1000);
```

### 4. 清除缓存

```typescript
const { set, clear, clearAll } = useCache();

// 清除指定缓存
clear('user-list');

// 清除所有缓存
clearAll();
```

## 实际应用场景

### 场景1：缓存API响应数据

```typescript
// composables/useResourceList.ts
import { ref } from 'vue';
import { useCache } from '@/composables';
import { getResourceList } from '@/api/resource';

export function useResourceList() {
  const cache = useCache({ ttl: 5 * 60 * 1000 }); // 5分钟缓存
  const loading = ref(false);

  async function fetchResources(params: SearchParams) {
    const cacheKey = `resource-list:${JSON.stringify(params)}`;
    
    // 尝试从缓存获取
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('使用缓存数据');
      return cached;
    }

    // 缓存未命中，从API获取
    loading.value = true;
    try {
      const response = await getResourceList(params);
      
      // 保存到缓存
      cache.set(cacheKey, response.data);
      
      return response.data;
    } finally {
      loading.value = false;
    }
  }

  return {
    fetchResources,
    loading
  };
}
```

### 场景2：缓存用户配置

```typescript
// composables/useUserConfig.ts
import { useCache } from '@/composables';

export function useUserConfig() {
  const cache = useCache({ ttl: 30 * 60 * 1000 }); // 30分钟缓存

  function saveConfig(config: UserConfig) {
    cache.set('user:config', config);
    // 同时保存到localStorage
    localStorage.setItem('user-config', JSON.stringify(config));
  }

  function getConfig(): UserConfig | null {
    // 先从缓存获取
    let config = cache.get<UserConfig>('user:config');
    
    // 缓存未命中，从localStorage获取
    if (!config) {
      const stored = localStorage.getItem('user-config');
      if (stored) {
        config = JSON.parse(stored);
        // 重新缓存
        cache.set('user:config', config);
      }
    }
    
    return config;
  }

  return {
    saveConfig,
    getConfig
  };
}
```

### 场景3：缓存计算结果

```typescript
// composables/useExpensiveCalculation.ts
import { useCache } from '@/composables';

export function useExpensiveCalculation() {
  const cache = useCache({ ttl: 10 * 60 * 1000 }); // 10分钟缓存

  function calculate(input: number): number {
    const cacheKey = `calc:${input}`;
    
    // 检查缓存
    const cached = cache.get<number>(cacheKey);
    if (cached !== null) {
      console.log('使用缓存的计算结果');
      return cached;
    }

    // 执行耗时计算
    console.log('执行计算...');
    const result = expensiveOperation(input);
    
    // 缓存结果
    cache.set(cacheKey, result);
    
    return result;
  }

  function expensiveOperation(input: number): number {
    // 模拟耗时计算
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(input * i);
    }
    return result;
  }

  return {
    calculate
  };
}
```

### 场景4：全局缓存实例

```typescript
// utils/globalCache.ts
import { getGlobalCache } from '@/composables';

// 创建全局缓存实例
export const globalCache = getGlobalCache({ ttl: 15 * 60 * 1000 }); // 15分钟

// 在任何地方使用
// composables/useFeatureA.ts
import { globalCache } from '@/utils/globalCache';

export function useFeatureA() {
  function doSomething() {
    globalCache.set('feature-a-data', data);
  }
  
  return { doSomething };
}

// composables/useFeatureB.ts
import { globalCache } from '@/utils/globalCache';

export function useFeatureB() {
  function doSomethingElse() {
    const data = globalCache.get('feature-a-data');
    // 使用来自 Feature A 的数据
  }
  
  return { doSomethingElse };
}
```

## 高级功能

### 1. 检查缓存是否存在

```typescript
const { has } = useCache();

if (has('user-list')) {
  console.log('缓存存在且有效');
}
```

### 2. 获取缓存统计信息

```typescript
const { stats, getHitRate } = useCache();

console.log('缓存命中次数:', stats.value.hits);
console.log('缓存未命中次数:', stats.value.misses);
console.log('缓存命中率:', getHitRate());
```

### 3. 清除过期缓存

```typescript
const { clearExpired } = useCache();

// 手动清除所有过期缓存
const clearedCount = clearExpired();
console.log(`清除了 ${clearedCount} 个过期缓存`);
```

### 4. 获取所有缓存键

```typescript
const { keys, size } = useCache();

console.log('缓存键列表:', keys());
console.log('缓存项数量:', size());
```

## 最佳实践

### 1. 合理设置TTL

```typescript
// 热门数据：短TTL（5分钟）
const hotCache = useCache({ ttl: 5 * 60 * 1000 });

// 配置数据：长TTL（30分钟）
const configCache = useCache({ ttl: 30 * 60 * 1000 });

// 静态数据：超长TTL（1小时）
const staticCache = useCache({ ttl: 60 * 60 * 1000 });
```

### 2. 使用有意义的缓存键

```typescript
// ❌ 不好的键名
set('data', userData);
set('list', resourceList);

// ✅ 好的键名
set('user:profile:123', userData);
set('resource:list:page-1:category-ui', resourceList);
```

### 3. 缓存失效重新获取模式

```typescript
async function getData(key: string) {
  // 尝试从缓存获取
  let data = cache.get(key);
  
  // 缓存未命中，从API获取
  if (!data) {
    data = await fetchFromAPI();
    cache.set(key, data);
  }
  
  return data;
}
```

### 4. 定期清理过期缓存

```typescript
// 在应用初始化时设置定时清理
import { onMounted, onUnmounted } from 'vue';

export function useAutoCleanCache() {
  const cache = useCache();
  let timer: number;

  onMounted(() => {
    // 每分钟清理一次过期缓存
    timer = setInterval(() => {
      const cleared = cache.clearExpired();
      if (cleared > 0) {
        console.log(`自动清理了 ${cleared} 个过期缓存`);
      }
    }, 60 * 1000);
  });

  onUnmounted(() => {
    clearInterval(timer);
  });

  return cache;
}
```

## 注意事项

1. **内存限制**：缓存存储在内存中，不要缓存过大的数据
2. **页面刷新**：缓存会在页面刷新后丢失，需要持久化的数据请使用 localStorage
3. **TTL精度**：TTL基于时间戳检查，不是定时器，只在访问时检查过期
4. **类型安全**：使用 TypeScript 泛型指定缓存数据类型

```typescript
// 使用泛型指定类型
interface User {
  id: string;
  name: string;
}

const userData = cache.get<User>('user-profile');
if (userData) {
  console.log(userData.name); // TypeScript 知道 userData 是 User 类型
}
```

## API 参考

### useCache(options?)

创建缓存实例。

**参数：**
- `options.ttl` (可选): 默认TTL（毫秒），默认30分钟

**返回：**
- `get<T>(key: string): T | null` - 获取缓存
- `set<T>(key: string, data: T, ttl?: number): void` - 设置缓存
- `clear(key: string): boolean` - 清除指定缓存
- `clearAll(): void` - 清除所有缓存
- `has(key: string): boolean` - 检查缓存是否存在
- `size(): number` - 获取缓存数量
- `keys(): string[]` - 获取所有缓存键
- `clearExpired(): number` - 清除过期缓存
- `stats: Readonly<Ref<Stats>>` - 统计信息
- `resetStats(): void` - 重置统计信息
- `getHitRate(): number` - 获取缓存命中率

### getGlobalCache(options?)

获取全局缓存实例（单例模式）。

**参数：**
- `options.ttl` (可选): 默认TTL（仅首次调用时生效）

**返回：**
- 与 `useCache` 相同的API
