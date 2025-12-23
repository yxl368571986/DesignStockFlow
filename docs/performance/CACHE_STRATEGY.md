# 缓存优化策略文档

本文档详细说明星潮设计资源平台的多层缓存策略，包括内存缓存、localStorage缓存、HTTP缓存和Service Worker缓存。

## 目录

1. [缓存架构概览](#缓存架构概览)
2. [内存缓存（Memory Cache）](#内存缓存memory-cache)
3. [LocalStorage缓存](#localstorage缓存)
4. [HTTP缓存（Nginx）](#http缓存nginx)
5. [Service Worker缓存（PWA）](#service-worker缓存pwa)
6. [缓存策略总结](#缓存策略总结)
7. [最佳实践](#最佳实践)

---

## 缓存架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        用户请求                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  第1层：内存缓存（useCache）                                 │
│  - 最快速度（微秒级）                                        │
│  - 生命周期：页面会话期间                                    │
│  - 适用：API响应、计算结果、临时数据                         │
│  - TTL：5-30分钟                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓ 未命中
┌─────────────────────────────────────────────────────────────┐
│  第2层：LocalStorage缓存（Storage类）                        │
│  - 快速（毫秒级）                                            │
│  - 生命周期：持久化，跨会话                                  │
│  - 适用：用户信息、偏好设置、搜索历史                        │
│  - TTL：1小时-30天                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓ 未命中
┌─────────────────────────────────────────────────────────────┐
│  第3层：Service Worker缓存（PWA）                            │
│  - 中等速度（毫秒级）                                        │
│  - 生命周期：持久化，离线可用                                │
│  - 适用：静态资源、API响应、图片                             │
│  - TTL：7天-1年                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓ 未命中
┌─────────────────────────────────────────────────────────────┐
│  第4层：HTTP缓存（Nginx + 浏览器）                           │
│  - 中等速度（毫秒级）                                        │
│  - 生命周期：根据Cache-Control                               │
│  - 适用：静态资源（JS/CSS/图片/字体）                        │
│  - TTL：7天-1年                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓ 未命中
┌─────────────────────────────────────────────────────────────┐
│  第5层：后端服务器                                           │
│  - 最慢（秒级）                                              │
│  - 从数据库或文件系统获取数据                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 内存缓存（Memory Cache）

### 实现方式

使用 `useCache` Composable，基于 JavaScript Map 实现。

### 特点

- ✅ 最快速度（微秒级访问）
- ✅ 支持TTL过期机制
- ✅ 自动清理过期缓存
- ✅ 类型安全（TypeScript）
- ❌ 页面刷新后丢失
- ❌ 不跨标签页共享

### 使用场景

| 数据类型 | TTL | 说明 |
|---------|-----|------|
| 热门资源列表 | 5分钟 | 频繁访问，变化较快 |
| 分类列表 | 10分钟 | 访问频繁，变化较慢 |
| 网站配置 | 30分钟 | 访问频繁，几乎不变 |
| 搜索联想 | 5分钟 | 实时性要求高 |
| 计算结果 | 10分钟 | 避免重复计算 |

### 代码示例

```typescript
import { useCache } from '@/composables';
import { CACHE_TIME } from '@/utils/constants';

// 创建缓存实例
const cache = useCache({ ttl: CACHE_TIME.RESOURCE });

// 缓存API响应
async function fetchResources(params: SearchParams) {
  const cacheKey = `resource-list:${JSON.stringify(params)}`;
  
  // 尝试从缓存获取
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('使用内存缓存');
    return cached;
  }
  
  // 缓存未命中，调用API
  const response = await getResourceList(params);
  
  // 保存到缓存（5分钟）
  cache.set(cacheKey, response.data, CACHE_TIME.RESOURCE);
  
  return response.data;
}
```

### 配置常量

```typescript
// src/utils/constants.ts
export const CACHE_TIME = {
  BANNER: 5 * 60 * 1000,      // 轮播图：5分钟
  CONFIG: 30 * 60 * 1000,     // 配置：30分钟
  CATEGORY: 10 * 60 * 1000,   // 分类：10分钟
  RESOURCE: 5 * 60 * 1000     // 资源列表：5分钟
} as const;
```

---

## LocalStorage缓存

### 实现方式

使用 `Storage` 工具类，封装 localStorage API。

### 特点

- ✅ 持久化存储（跨会话）
- ✅ 支持TTL过期机制
- ✅ 命名空间隔离
- ✅ 自动清理过期数据
- ✅ 类型安全（TypeScript）
- ❌ 存储空间限制（5-10MB）
- ❌ 同步操作（可能阻塞）

### 使用场景

| 数据类型 | TTL | 说明 |
|---------|-----|------|
| 用户信息 | 永久 | 登录状态持久化 |
| Token | 7天 | 记住我功能 |
| 用户偏好 | 永久 | 主题、语言等设置 |
| 搜索历史 | 30天 | 用户搜索记录 |
| 表单草稿 | 24小时 | 防止数据丢失 |
| API缓存 | 1小时 | 减少API调用 |

### 代码示例

```typescript
import { storage, userStorage, cacheStorage } from '@/utils/storage';

// 1. 用户信息持久化（永久）
userStorage.set('info', userInfo);
const user = userStorage.get<UserInfo>('info');

// 2. Token存储（7天过期）
userStorage.set('token', token, 7 * 24 * 60 * 60 * 1000);

// 3. 搜索历史（30天过期）
storage.set('search_history', history, 30 * 24 * 60 * 60 * 1000);

// 4. API响应缓存（1小时过期）
cacheStorage.set('resource-list', data, 60 * 60 * 1000);

// 5. 用户偏好（永久）
storage.set('preferences', preferences);
```

### 命名空间设计

```typescript
// 默认命名空间
const storage = new Storage({ namespace: 'startide' });

// 用户相关
const userStorage = new Storage({ namespace: 'startide:user' });

// 缓存相关
const cacheStorage = new Storage({ namespace: 'startide:cache' });
```

### 自动清理策略

```typescript
// 在应用初始化时清理过期缓存
import { onMounted } from 'vue';
import { storage } from '@/utils/storage';

onMounted(() => {
  const cleared = storage.clearExpired();
  console.log(`清理了 ${cleared} 个过期缓存`);
});

// 定时清理（每小时）
setInterval(() => {
  storage.clearExpired();
}, 60 * 60 * 1000);
```

---

## HTTP缓存（Nginx）

### 实现方式

通过 Nginx 配置 `Cache-Control` 响应头。

### 特点

- ✅ 浏览器原生支持
- ✅ 减少服务器负载
- ✅ 加快页面加载速度
- ✅ 支持协商缓存（ETag）
- ✅ CDN友好

### 缓存策略

| 资源类型 | Cache-Control | 过期时间 | 说明 |
|---------|--------------|---------|------|
| HTML | no-cache | 0 | 始终验证，确保最新 |
| JS/CSS | max-age=31536000 | 1年 | 文件名带哈希，可长期缓存 |
| 图片 | max-age=2592000 | 30天 | 静态资源，变化较少 |
| 字体 | max-age=31536000 | 1年 | 几乎不变，长期缓存 |
| API | no-cache | 0 | 动态内容，不缓存 |
| Service Worker | no-cache | 0 | 确保及时更新 |

### Nginx配置示例

```nginx
# HTML文件 - 不缓存
location ~* \.html$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
}

# JavaScript和CSS - 长期缓存（1年）
location ~* \.(js|css)$ {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    expires 1y;
}

# 图片 - 中期缓存（30天）
location ~* \.(jpg|jpeg|png|gif|svg|webp)$ {
    add_header Cache-Control "public, max-age=2592000" always;
    expires 30d;
}

# 字体 - 长期缓存（1年）
location ~* \.(woff|woff2|ttf|otf|eot)$ {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    expires 1y;
}

# API - 不缓存
location /api/ {
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
}
```

### Cache-Control指令说明

| 指令 | 说明 |
|-----|------|
| `public` | 可被任何缓存（浏览器、CDN）缓存 |
| `private` | 仅浏览器可缓存，CDN不可缓存 |
| `no-cache` | 可缓存，但每次使用前必须验证 |
| `no-store` | 完全不缓存 |
| `max-age=N` | 缓存有效期（秒） |
| `immutable` | 内容永不改变，无需验证 |
| `must-revalidate` | 过期后必须重新验证 |

---

## Service Worker缓存（PWA）

### 实现方式

使用 Workbox 配置 Service Worker 缓存策略。

### 特点

- ✅ 离线可用
- ✅ 后台更新
- ✅ 灵活的缓存策略
- ✅ 减少网络请求
- ✅ 提升加载速度

### 缓存策略

| 资源类型 | 策略 | 说明 |
|---------|------|------|
| API请求 | NetworkFirst | 优先网络，失败时使用缓存 |
| 图片 | CacheFirst | 优先缓存，未命中时请求网络 |
| 字体 | CacheFirst | 优先缓存，长期有效 |
| JS/CSS | StaleWhileRevalidate | 使用缓存同时后台更新 |

### Workbox配置

```javascript
// vite.config.ts
workbox: {
  runtimeCaching: [
    {
      // API请求 - NetworkFirst
      urlPattern: /^https:\/\/.*\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 // 24小时
        },
        networkTimeoutSeconds: 10
      }
    },
    {
      // 图片 - CacheFirst
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
        }
      }
    },
    {
      // JS/CSS - StaleWhileRevalidate
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 60 * 60 * 24 * 7 // 7天
        }
      }
    }
  ]
}
```

### 缓存策略详解

#### 1. NetworkFirst（网络优先）

```
请求 → 网络（10秒超时）→ 成功 → 返回并更新缓存
                      ↓ 失败
                    缓存 → 返回
```

**适用场景**：API请求、动态内容

#### 2. CacheFirst（缓存优先）

```
请求 → 缓存 → 命中 → 返回
           ↓ 未命中
         网络 → 返回并缓存
```

**适用场景**：图片、字体、静态资源

#### 3. StaleWhileRevalidate（过期重验证）

```
请求 → 缓存 → 返回（立即）
           ↓
         网络 → 更新缓存（后台）
```

**适用场景**：JS/CSS文件、需要快速响应的资源

#### 4. NetworkOnly（仅网络）

```
请求 → 网络 → 返回
```

**适用场景**：实时数据、不可缓存的内容

#### 5. CacheOnly（仅缓存）

```
请求 → 缓存 → 返回
```

**适用场景**：预缓存的离线资源

---

## 缓存策略总结

### 按数据类型分类

| 数据类型 | 内存缓存 | LocalStorage | HTTP缓存 | Service Worker | 说明 |
|---------|---------|-------------|---------|---------------|------|
| 用户信息 | ❌ | ✅ 永久 | ❌ | ❌ | 持久化存储 |
| Token | ❌ | ✅ 7天 | ❌ | ❌ | 安全存储 |
| 热门资源 | ✅ 5分钟 | ✅ 1小时 | ❌ | ✅ NetworkFirst | 多层缓存 |
| 分类列表 | ✅ 10分钟 | ✅ 1小时 | ❌ | ✅ NetworkFirst | 变化较慢 |
| 网站配置 | ✅ 30分钟 | ✅ 1天 | ❌ | ✅ NetworkFirst | 几乎不变 |
| 搜索历史 | ❌ | ✅ 30天 | ❌ | ❌ | 用户数据 |
| 用户偏好 | ❌ | ✅ 永久 | ❌ | ❌ | 设置数据 |
| HTML | ❌ | ❌ | ✅ no-cache | ✅ NetworkFirst | 始终最新 |
| JS/CSS | ❌ | ❌ | ✅ 1年 | ✅ StaleWhileRevalidate | 文件名哈希 |
| 图片 | ❌ | ❌ | ✅ 30天 | ✅ CacheFirst | 静态资源 |
| 字体 | ❌ | ❌ | ✅ 1年 | ✅ CacheFirst | 长期缓存 |

### 按TTL分类

| TTL | 适用数据 | 缓存层 |
|-----|---------|--------|
| 永久 | 用户信息、偏好设置 | LocalStorage |
| 30天 | 搜索历史、图片 | LocalStorage, HTTP |
| 7天 | Token、JS/CSS | LocalStorage, HTTP, SW |
| 1天 | 网站配置 | LocalStorage |
| 1小时 | API缓存 | LocalStorage |
| 30分钟 | 网站配置 | 内存缓存 |
| 10分钟 | 分类列表 | 内存缓存 |
| 5分钟 | 热门资源、轮播图 | 内存缓存 |

---

## 最佳实践

### 1. 缓存层级选择

```typescript
// ✅ 正确：根据数据特性选择合适的缓存层
// 用户信息 → LocalStorage（持久化）
userStorage.set('info', userInfo);

// 热门资源 → 内存缓存（快速访问）
cache.set('hot-resources', data, 5 * 60 * 1000);

// 静态资源 → HTTP缓存 + Service Worker
// 通过Nginx和Workbox自动处理
```

### 2. 缓存键命名规范

```typescript
// ✅ 好的命名：清晰、有层次
'user:profile:123'
'resource:list:page-1:category-ui'
'cache:api:resource-detail:456'

// ❌ 不好的命名：模糊、难以管理
'data'
'list'
'temp'
```

### 3. 缓存失效策略

```typescript
// 方式1：主动失效（数据更新时）
async function updateResource(id: string, data: any) {
  await updateResourceAPI(id, data);
  
  // 清除相关缓存
  cache.clear(`resource:detail:${id}`);
  cache.clear('resource:list');
  cacheStorage.remove(`resource:detail:${id}`);
}

// 方式2：被动失效（TTL过期）
cache.set('data', value, 5 * 60 * 1000); // 5分钟后自动过期

// 方式3：手动清理
cache.clearExpired(); // 清理所有过期缓存
```

### 4. 缓存预热

```typescript
// 在应用初始化时预加载关键数据
async function preloadCache() {
  const configStore = useConfigStore();
  
  // 预加载网站配置
  await configStore.initConfig();
  
  // 预加载分类列表
  await configStore.fetchCategories();
  
  // 预加载热门资源
  const resourceStore = useResourceStore();
  await resourceStore.fetchHotResources();
}

// 在main.ts中调用
app.mount('#app').then(() => {
  preloadCache();
});
```

### 5. 缓存监控

```typescript
// 监控缓存命中率
const { stats, getHitRate } = useCache();

console.log('缓存统计:', {
  hits: stats.value.hits,
  misses: stats.value.misses,
  hitRate: getHitRate()
});

// 监控存储使用情况
const usage = storage.getUsage();
console.log(`存储使用: ${usage.percentage.toFixed(2)}%`);

// 如果使用率过高，清理过期数据
if (usage.percentage > 80) {
  storage.clearExpired();
}
```

### 6. 错误处理

```typescript
// 缓存操作可能失败（存储空间不足等）
const success = storage.set('key', largeData);
if (!success) {
  console.error('缓存失败，可能空间不足');
  
  // 尝试清理后重试
  storage.clearExpired();
  storage.set('key', largeData);
}
```

### 7. 开发环境调试

```typescript
// 开发环境禁用缓存
if (import.meta.env.DEV) {
  // 禁用内存缓存
  const cache = useCache({ ttl: 0 });
  
  // 清空localStorage
  storage.clearAll();
  
  // 禁用Service Worker
  // 在vite.config.ts中设置 devOptions.enabled = false
}
```

### 8. 性能优化建议

```typescript
// ✅ 使用批量操作
const keys = ['key1', 'key2', 'key3'];
const values = keys.map(key => cache.get(key));

// ✅ 避免频繁的缓存写入
let saveTimer: number;
watch(data, () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    storage.set('data', data.value);
  }, 1000); // 防抖1秒
});

// ✅ 定期清理过期缓存
setInterval(() => {
  cache.clearExpired();
  storage.clearExpired();
}, 60 * 60 * 1000); // 每小时清理一次
```

---

## 总结

星潮设计资源平台采用四层缓存架构：

1. **内存缓存**：最快速度，适用于频繁访问的临时数据
2. **LocalStorage缓存**：持久化存储，适用于用户数据和长期缓存
3. **HTTP缓存**：浏览器原生支持，适用于静态资源
4. **Service Worker缓存**：离线支持，适用于PWA应用

通过合理配置各层缓存的TTL和策略，可以显著提升应用性能，减少服务器负载，改善用户体验。

**关键指标**：
- 首屏加载时间：< 2秒
- 白屏时间：< 1秒
- 缓存命中率：> 80%
- 离线可用性：核心功能可离线访问
