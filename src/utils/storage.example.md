# Storage 工具类使用示例

`Storage` 是一个类型安全的 localStorage 封装工具类，提供命名空间、过期时间、自动清理等功能。

## 基本用法

### 1. 使用默认实例

```typescript
import { storage, setStorage, getStorage, removeStorage } from '@/utils/storage';

// 设置缓存（永久）
setStorage('user', userData);

// 设置缓存（5分钟过期）
setStorage('token', tokenData, 5 * 60 * 1000);

// 获取缓存
const user = getStorage<User>('user');

// 移除缓存
removeStorage('user');
```

### 2. 创建自定义实例

```typescript
import { Storage } from '@/utils/storage';

// 创建带命名空间的实例
const myStorage = new Storage({ namespace: 'myapp' });

myStorage.set('key', 'value');
const value = myStorage.get('key');
```

### 3. 使用预定义实例

```typescript
import { userStorage, cacheStorage } from '@/utils/storage';

// 用户相关数据
userStorage.set('profile', userProfile);

// 缓存数据
cacheStorage.set('resources', resourceList, 5 * 60 * 1000);
```

## 实际应用场景

### 场景1：用户信息持久化

```typescript
// composables/useUserPersist.ts
import { userStorage } from '@/utils/storage';
import type { UserInfo } from '@/types/models';

export function useUserPersist() {
  /**
   * 保存用户信息（永久）
   */
  function saveUserInfo(userInfo: UserInfo): void {
    userStorage.set('info', userInfo);
  }

  /**
   * 获取用户信息
   */
  function getUserInfo(): UserInfo | null {
    return userStorage.get<UserInfo>('info');
  }

  /**
   * 清除用户信息
   */
  function clearUserInfo(): void {
    userStorage.remove('info');
  }

  /**
   * 保存Token（7天过期）
   */
  function saveToken(token: string, rememberMe: boolean = false): void {
    const ttl = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    userStorage.set('token', token, ttl);
  }

  /**
   * 获取Token
   */
  function getToken(): string | null {
    return userStorage.get<string>('token');
  }

  return {
    saveUserInfo,
    getUserInfo,
    clearUserInfo,
    saveToken,
    getToken
  };
}
```

### 场景2：搜索历史管理

```typescript
// composables/useSearchHistory.ts
import { storage } from '@/utils/storage';

const MAX_HISTORY = 10;

export function useSearchHistory() {
  /**
   * 添加搜索历史
   */
  function addHistory(keyword: string): void {
    const history = getHistory();
    
    // 移除重复项
    const filtered = history.filter(item => item !== keyword);
    
    // 添加到开头
    filtered.unshift(keyword);
    
    // 限制数量
    const limited = filtered.slice(0, MAX_HISTORY);
    
    // 保存（30天过期）
    storage.set('search_history', limited, 30 * 24 * 60 * 60 * 1000);
  }

  /**
   * 获取搜索历史
   */
  function getHistory(): string[] {
    return storage.get<string[]>('search_history') || [];
  }

  /**
   * 清除搜索历史
   */
  function clearHistory(): void {
    storage.remove('search_history');
  }

  /**
   * 删除单条历史
   */
  function removeHistoryItem(keyword: string): void {
    const history = getHistory();
    const filtered = history.filter(item => item !== keyword);
    storage.set('search_history', filtered, 30 * 24 * 60 * 60 * 1000);
  }

  return {
    addHistory,
    getHistory,
    clearHistory,
    removeHistoryItem
  };
}
```

### 场景3：API响应缓存

```typescript
// composables/useAPICache.ts
import { cacheStorage } from '@/utils/storage';
import { CACHE_TIME } from '@/utils/constants';

export function useAPICache() {
  /**
   * 缓存API响应
   */
  function cacheResponse<T>(key: string, data: T, ttl?: number): void {
    cacheStorage.set(key, data, ttl || CACHE_TIME.RESOURCE);
  }

  /**
   * 获取缓存的响应
   */
  function getCachedResponse<T>(key: string): T | null {
    return cacheStorage.get<T>(key);
  }

  /**
   * 带缓存的API调用
   */
  async function fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = getCachedResponse<T>(key);
    if (cached) {
      console.log(`使用缓存数据: ${key}`);
      return cached;
    }

    // 缓存未命中，调用API
    console.log(`缓存未命中，调用API: ${key}`);
    const data = await fetcher();
    
    // 保存到缓存
    cacheResponse(key, data, ttl);
    
    return data;
  }

  /**
   * 清除指定缓存
   */
  function invalidateCache(key: string): void {
    cacheStorage.remove(key);
  }

  /**
   * 清除所有API缓存
   */
  function clearAllCache(): void {
    cacheStorage.clear();
  }

  return {
    cacheResponse,
    getCachedResponse,
    fetchWithCache,
    invalidateCache,
    clearAllCache
  };
}

// 使用示例
const { fetchWithCache } = useAPICache();

// 获取资源列表（带缓存）
const resources = await fetchWithCache(
  'resource-list:page-1',
  () => getResourceList({ pageNum: 1, pageSize: 20 }),
  5 * 60 * 1000 // 5分钟缓存
);
```

### 场景4：表单草稿自动保存

```typescript
// composables/useFormDraft.ts
import { storage } from '@/utils/storage';
import { watch, onUnmounted } from 'vue';
import type { Ref } from 'vue';

export function useFormDraft<T extends Record<string, any>>(
  formKey: string,
  formData: Ref<T>
) {
  /**
   * 保存草稿
   */
  function saveDraft(): void {
    storage.set(`draft:${formKey}`, formData.value, 24 * 60 * 60 * 1000); // 24小时
  }

  /**
   * 加载草稿
   */
  function loadDraft(): T | null {
    return storage.get<T>(`draft:${formKey}`);
  }

  /**
   * 清除草稿
   */
  function clearDraft(): void {
    storage.remove(`draft:${formKey}`);
  }

  /**
   * 检查是否有草稿
   */
  function hasDraft(): boolean {
    return storage.has(`draft:${formKey}`);
  }

  // 自动保存（防抖）
  let saveTimer: number;
  watch(
    formData,
    () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveDraft();
        console.log('表单草稿已自动保存');
      }, 1000);
    },
    { deep: true }
  );

  // 组件卸载时清理定时器
  onUnmounted(() => {
    clearTimeout(saveTimer);
  });

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft
  };
}

// 使用示例
const formData = ref({
  title: '',
  description: '',
  category: ''
});

const { loadDraft, clearDraft, hasDraft } = useFormDraft('upload-form', formData);

// 页面加载时恢复草稿
onMounted(() => {
  if (hasDraft()) {
    const draft = loadDraft();
    if (draft) {
      formData.value = draft;
      ElMessage.info('已恢复上次编辑的内容');
    }
  }
});

// 提交成功后清除草稿
async function handleSubmit() {
  await submitForm(formData.value);
  clearDraft();
}
```

### 场景5：用户偏好设置

```typescript
// composables/useUserPreferences.ts
import { storage } from '@/utils/storage';
import { ref, watch } from 'vue';

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  pageSize: number;
  sortBy: 'time' | 'download' | 'hot';
  showTutorial: boolean;
}

const defaultPreferences: UserPreferences = {
  theme: 'auto',
  language: 'zh-CN',
  pageSize: 20,
  sortBy: 'hot',
  showTutorial: true
};

export function useUserPreferences() {
  const preferences = ref<UserPreferences>(
    storage.get<UserPreferences>('preferences') || defaultPreferences
  );

  /**
   * 更新偏好设置
   */
  function updatePreferences(updates: Partial<UserPreferences>): void {
    preferences.value = { ...preferences.value, ...updates };
  }

  /**
   * 重置为默认设置
   */
  function resetPreferences(): void {
    preferences.value = { ...defaultPreferences };
  }

  // 自动保存到localStorage
  watch(
    preferences,
    (newPreferences) => {
      storage.set('preferences', newPreferences);
    },
    { deep: true }
  );

  return {
    preferences,
    updatePreferences,
    resetPreferences
  };
}
```

## 高级功能

### 1. 清理过期缓存

```typescript
import { storage } from '@/utils/storage';

// 手动清理过期缓存
const cleared = storage.clearExpired();
console.log(`清除了 ${cleared} 个过期缓存`);

// 定时清理（每小时）
setInterval(() => {
  const cleared = storage.clearExpired();
  if (cleared > 0) {
    console.log(`自动清理了 ${cleared} 个过期缓存`);
  }
}, 60 * 60 * 1000);
```

### 2. 监控存储使用情况

```typescript
import { storage } from '@/utils/storage';

const usage = storage.getUsage();
console.log(`存储使用: ${usage.used} / ${usage.total} (${usage.percentage.toFixed(2)}%)`);

// 如果使用率超过80%，清理过期缓存
if (usage.percentage > 80) {
  console.warn('存储空间不足，正在清理...');
  storage.clearExpired();
}
```

### 3. 获取所有缓存键

```typescript
import { storage } from '@/utils/storage';

const keys = storage.keys();
console.log('所有缓存键:', keys);

const size = storage.size();
console.log('缓存项数量:', size);
```

### 4. 命名空间隔离

```typescript
import { Storage } from '@/utils/storage';

// 不同模块使用不同命名空间
const userStorage = new Storage({ namespace: 'app:user' });
const adminStorage = new Storage({ namespace: 'app:admin' });

userStorage.set('data', 'user data');
adminStorage.set('data', 'admin data');

// 互不干扰
console.log(userStorage.get('data')); // 'user data'
console.log(adminStorage.get('data')); // 'admin data'

// 清空时也互不影响
userStorage.clear(); // 只清空 app:user 命名空间
```

## 最佳实践

### 1. 合理设置过期时间

```typescript
// 短期数据（5分钟）
storage.set('hot-resources', data, 5 * 60 * 1000);

// 中期数据（1小时）
storage.set('category-list', data, 60 * 60 * 1000);

// 长期数据（7天）
storage.set('user-preferences', data, 7 * 24 * 60 * 60 * 1000);

// 永久数据（不过期）
storage.set('user-id', userId);
```

### 2. 使用类型安全

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// 设置时指定类型
storage.set<User>('user', userData);

// 获取时指定类型
const user = storage.get<User>('user');
if (user) {
  console.log(user.name); // TypeScript 知道类型
}
```

### 3. 错误处理

```typescript
// Storage 方法内部已处理错误，返回 boolean 或 null
const success = storage.set('key', 'value');
if (!success) {
  console.error('存储失败，可能空间不足');
  // 尝试清理
  storage.clearExpired();
}

const data = storage.get('key');
if (data === null) {
  console.log('缓存不存在或已过期');
}
```

### 4. 定期维护

```typescript
// 在应用初始化时清理过期缓存
import { onMounted } from 'vue';
import { storage } from '@/utils/storage';

onMounted(() => {
  storage.clearExpired();
});

// 或使用定时器
setInterval(() => {
  storage.clearExpired();
}, 60 * 60 * 1000); // 每小时清理一次
```

## 注意事项

1. **存储限制**：localStorage 通常限制为 5-10MB，不要存储大量数据
2. **同步操作**：localStorage 是同步操作，大量读写可能影响性能
3. **隐私模式**：某些浏览器的隐私模式可能禁用 localStorage
4. **跨域限制**：不同域名的 localStorage 是隔离的
5. **数据安全**：localStorage 中的数据可被用户查看和修改，不要存储敏感信息

## API 参考

### Storage 类

#### 构造函数
```typescript
new Storage(options?: StorageOptions)
```

#### 方法
- `set<T>(key: string, data: T, ttl?: number): boolean` - 设置缓存
- `get<T>(key: string): T | null` - 获取缓存
- `remove(key: string): boolean` - 移除缓存
- `has(key: string): boolean` - 检查缓存是否存在
- `clear(): void` - 清空当前命名空间
- `clearAll(): void` - 清空所有localStorage
- `keys(): string[]` - 获取所有键
- `size(): number` - 获取缓存项数量
- `clearExpired(): number` - 清除过期缓存
- `getUsage(): { used, total, percentage }` - 获取存储使用情况

### 便捷函数
- `setStorage<T>(key: string, data: T, ttl?: number): boolean`
- `getStorage<T>(key: string): T | null`
- `removeStorage(key: string): boolean`
- `clearStorage(): void`

### 预定义实例
- `storage` - 默认实例（命名空间：startide）
- `userStorage` - 用户实例（命名空间：startide:user）
- `cacheStorage` - 缓存实例（命名空间：startide:cache）
