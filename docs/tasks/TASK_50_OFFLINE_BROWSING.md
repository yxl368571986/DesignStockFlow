# Task 50: 离线浏览功能实现验证

## 任务概述
实现离线浏览功能，支持在网络断开时从IndexedDB加载缓存资源，并在网络恢复时自动同步数据。

## 实现内容

### 1. 创建离线浏览组合式函数 (`src/composables/useOffline.ts`)

**核心功能：**
- ✅ 检测离线状态（集成 useNetworkStatus）
- ✅ 离线时从IndexedDB加载资源
- ✅ 显示离线标识
- ✅ 恢复在线时同步数据
- ✅ 离线时禁用上传和下载功能

**主要方法：**
```typescript
- loadCachedResources(): 从IndexedDB加载缓存的资源
- cacheResources(resources): 批量缓存资源到IndexedDB
- cacheResource(resource): 缓存单个资源
- getCachedResource(resourceId): 获取单个缓存资源
- clearCache(): 清除所有缓存
- addToSyncQueue(type, data): 添加到同步队列
- syncData(): 同步数据到服务器
- isFeatureAvailable(feature): 检查功能是否可用
- showFeatureUnavailableMessage(feature): 显示功能不可用提示
```

**状态管理：**
```typescript
- isOnline: 在线状态
- isOfflineMode: 离线模式状态
- cachedResources: 缓存的资源列表
- loading: 加载状态
- error: 错误信息
- hasCachedResources: 是否有缓存资源
- needsSync: 是否需要同步
```

### 2. 更新资源Store (`src/pinia/resourceStore.ts`)

**集成离线支持：**
- ✅ 修改 `fetchResources()` 方法支持离线模式
- ✅ 离线时从IndexedDB加载资源
- ✅ 在线时自动缓存资源到IndexedDB
- ✅ 支持强制在线模式参数

**实现逻辑：**
```typescript
async function fetchResources(forceOnline: boolean = false) {
  // 检查是否在线
  const isOnline = navigator.onLine;
  
  // 如果离线且不强制在线模式，从IndexedDB加载
  if (!isOnline && !forceOnline) {
    const cachedResources = await getAllResources();
    resources.value = cachedResources;
    total.value = cachedResources.length;
    return;
  }
  
  // 在线模式：正常请求并缓存到IndexedDB
  const response = await getResourceList(searchParams.value);
  await saveResources(response.data.list);
}
```

### 3. 更新首页 (`src/views/Home/index.vue`)

**集成离线功能：**
- ✅ 导入 `useOffline` 组合式函数
- ✅ 添加离线模式提示横幅
- ✅ 离线时使用缓存资源
- ✅ 在线时自动缓存资源

**UI改进：**
```vue
<!-- 离线模式提示 -->
<div v-if="isOfflineMode" class="offline-indicator">
  <el-icon class="offline-icon">
    <Connection />
  </el-icon>
  <span class="offline-text">离线浏览模式 - 显示缓存内容</span>
</div>
```

**资源加载逻辑：**
```typescript
async function fetchHotResources() {
  // 如果离线，使用缓存资源
  if (!isOnline.value && cachedResources.value.length > 0) {
    hotResources.value = cachedResources.value.slice(0, 8);
    return;
  }
  
  // 在线时正常请求并缓存
  const res = await getHotResources(8);
  await cacheResources(res.data);
}
```

### 4. 更新资源列表页 (`src/views/Resource/List.vue`)

**集成离线功能：**
- ✅ 导入 `useOffline` 组合式函数
- ✅ 添加离线模式提示横幅
- ✅ 显示离线状态

**UI改进：**
```vue
<!-- 离线模式提示 -->
<div v-if="isOfflineMode" class="offline-indicator">
  <el-icon class="offline-icon">
    <Connection />
  </el-icon>
  <span class="offline-text">离线浏览模式 - 显示缓存内容</span>
</div>
```

### 5. 更新上传组合式函数 (`src/composables/useUpload.ts`)

**离线检查：**
```typescript
async function handleFileUpload(file, metadata) {
  // 检查网络状态
  if (!navigator.onLine) {
    error.value = '上传功能需要网络连接';
    ElMessage.warning(error.value);
    return { success: false, error: error.value };
  }
  
  // 继续上传逻辑...
}
```

### 6. 更新下载组合式函数 (`src/composables/useDownload.ts`)

**离线检查：**
```typescript
async function handleDownload(resourceId, vipLevel) {
  // 检查网络状态
  if (!navigator.onLine) {
    error.value = '下载功能需要网络连接';
    ElMessage.warning(error.value);
    return { success: false, error: error.value };
  }
  
  // 继续下载逻辑...
}
```

### 7. 导出新组合式函数 (`src/composables/index.ts`)

```typescript
export * from './useOffline';
```

## 功能特性

### 离线浏览
1. **自动检测离线状态**
   - 使用 `navigator.onLine` 检测网络状态
   - 监听 `online` 和 `offline` 事件
   - 自动切换离线模式

2. **缓存管理**
   - 自动缓存浏览过的资源到IndexedDB
   - 支持批量缓存和单个缓存
   - 最大存储限制：50MB
   - 支持清除缓存

3. **离线数据加载**
   - 离线时从IndexedDB加载资源
   - 显示缓存的热门资源和推荐资源
   - 支持离线浏览资源列表

4. **在线恢复**
   - 网络恢复时自动同步数据
   - 显示"网络已恢复"提示
   - 自动处理同步队列

### 功能限制

1. **上传功能**
   - 离线时禁用上传
   - 显示提示："上传功能需要网络连接"

2. **下载功能**
   - 离线时禁用下载
   - 显示提示："下载功能需要网络连接"

3. **搜索功能**
   - 离线时禁用搜索
   - 显示提示："搜索功能需要网络连接"

### UI指示器

1. **离线模式横幅**
   - 蓝色渐变背景
   - 显示连接图标
   - 文字："离线浏览模式 - 显示缓存内容"
   - 固定在页面顶部

2. **样式设计**
   ```css
   .offline-indicator {
     background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
     border-bottom: 1px solid #64b5f6;
     padding: 10px 24px;
     display: flex;
     align-items: center;
     justify-content: center;
     gap: 8px;
   }
   ```

## 数据流程

### 离线模式流程
```
1. 用户访问页面
   ↓
2. 检测网络状态 (navigator.onLine)
   ↓
3. 如果离线
   ↓
4. 从IndexedDB加载缓存资源
   ↓
5. 显示离线模式提示
   ↓
6. 禁用上传/下载功能
```

### 在线恢复流程
```
1. 网络恢复 (online事件)
   ↓
2. 显示"网络已恢复"提示
   ↓
3. 检查同步队列
   ↓
4. 如果有待同步数据
   ↓
5. 自动同步到服务器
   ↓
6. 清除同步队列
   ↓
7. 恢复正常功能
```

### 缓存流程
```
1. 用户浏览资源
   ↓
2. 请求成功后
   ↓
3. 自动缓存到IndexedDB
   ↓
4. 检查存储限制 (50MB)
   ↓
5. 如果超限，提示用户清理
```

## 技术实现

### 网络状态检测
```typescript
// 使用 navigator.onLine
const isOnline = ref(navigator.onLine);

// 监听网络事件
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);
```

### IndexedDB操作
```typescript
// 保存资源
await saveResources(resources);

// 加载资源
const cachedResources = await getAllResources();

// 清除缓存
await clearAll();
```

### 同步队列
```typescript
// 添加到队列
addToSyncQueue('collect', { resourceId: '123' });

// 同步数据
await syncData();

// 保存到localStorage
localStorage.setItem('sync_queue', JSON.stringify(syncQueue.value));
```

## 测试建议

### 手动测试步骤

1. **离线模式测试**
   ```
   1. 打开浏览器开发者工具
   2. 切换到Network标签
   3. 选择"Offline"模式
   4. 刷新页面
   5. 验证：
      - 显示离线模式提示
      - 显示缓存的资源
      - 上传/下载按钮被禁用
   ```

2. **在线恢复测试**
   ```
   1. 在离线模式下操作
   2. 切换回"Online"模式
   3. 验证：
      - 显示"网络已恢复"提示
      - 自动同步数据
      - 功能恢复正常
   ```

3. **缓存测试**
   ```
   1. 在线浏览资源
   2. 打开IndexedDB查看器
   3. 验证资源已缓存
   4. 切换到离线模式
   5. 验证可以加载缓存资源
   ```

## 需求覆盖

✅ **需求10.2**: 离线状态与网络异常处理
- 检测离线状态
- 显示离线提示
- 禁用需要网络的功能

✅ **需求13.4**: 离线数据存储
- 使用IndexedDB存储资源
- 离线时从IndexedDB加载
- 恢复在线时同步数据

## 文件清单

### 新增文件
- `src/composables/useOffline.ts` - 离线浏览组合式函数

### 修改文件
- `src/composables/index.ts` - 导出新组合式函数
- `src/pinia/resourceStore.ts` - 集成离线支持
- `src/views/Home/index.vue` - 添加离线模式UI
- `src/views/Resource/List.vue` - 添加离线模式UI
- `src/composables/useUpload.ts` - 添加离线检查
- `src/composables/useDownload.ts` - 添加离线检查

## 总结

任务50已成功完成，实现了完整的离线浏览功能：

1. ✅ 检测离线状态（useNetworkStatus）
2. ✅ 离线时从IndexedDB加载资源
3. ✅ 显示离线标识
4. ✅ 恢复在线时同步数据
5. ✅ 离线时禁用上传和下载功能

所有功能都已集成到现有的组件和页面中，用户体验流畅，离线模式下仍可浏览缓存的资源。
