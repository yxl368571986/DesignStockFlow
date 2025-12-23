# IndexedDB 存储模块使用示例

## 概述

IndexedDB存储模块提供了离线数据存储功能，用于缓存资源数据以支持PWA离线访问。

## 功能特性

- ✅ 自动初始化数据库和对象存储
- ✅ 保存单个或批量资源
- ✅ 获取资源（按ID或分类）
- ✅ 删除资源
- ✅ 清空所有数据
- ✅ 容量限制检查（最大50MB）
- ✅ 存储使用情况查询

## 基本使用

### 1. 保存资源

```typescript
import { saveResource } from '@/utils/indexedDB';

const resource: ResourceInfo = {
  resourceId: 'res-001',
  title: 'UI设计资源',
  description: '精美的UI设计素材',
  cover: 'https://example.com/cover.jpg',
  previewImages: ['https://example.com/preview1.jpg'],
  format: 'PSD',
  fileSize: 1024000,
  downloadCount: 100,
  vipLevel: 0,
  categoryId: 'ui-design',
  categoryName: 'UI设计',
  tags: ['UI', '设计'],
  uploaderId: 'user-1',
  uploaderName: '设计师',
  isAudit: 1,
  createTime: '2024-01-01T00:00:00Z',
  updateTime: '2024-01-01T00:00:00Z'
};

try {
  await saveResource(resource);
  console.log('资源保存成功');
} catch (error) {
  console.error('保存失败:', error.message);
}
```

### 2. 获取资源

```typescript
import { getResource } from '@/utils/indexedDB';

try {
  const resource = await getResource('res-001');
  if (resource) {
    console.log('找到资源:', resource.title);
  } else {
    console.log('资源不存在');
  }
} catch (error) {
  console.error('获取失败:', error.message);
}
```

### 3. 批量保存资源

```typescript
import { saveResources } from '@/utils/indexedDB';

const resources: ResourceInfo[] = [
  // ... 资源数组
];

try {
  await saveResources(resources);
  console.log(`成功保存 ${resources.length} 个资源`);
} catch (error) {
  console.error('批量保存失败:', error.message);
}
```

### 4. 按分类获取资源

```typescript
import { getResourcesByCategory } from '@/utils/indexedDB';

try {
  const resources = await getResourcesByCategory('ui-design');
  console.log(`找到 ${resources.length} 个UI设计资源`);
} catch (error) {
  console.error('获取失败:', error.message);
}
```

### 5. 获取所有资源

```typescript
import { getAllResources } from '@/utils/indexedDB';

try {
  const allResources = await getAllResources();
  console.log(`缓存中共有 ${allResources.length} 个资源`);
} catch (error) {
  console.error('获取失败:', error.message);
}
```

### 6. 删除资源

```typescript
import { deleteResource } from '@/utils/indexedDB';

try {
  await deleteResource('res-001');
  console.log('资源删除成功');
} catch (error) {
  console.error('删除失败:', error.message);
}
```

### 7. 清空所有数据

```typescript
import { clearAll } from '@/utils/indexedDB';

try {
  await clearAll();
  console.log('所有缓存数据已清空');
} catch (error) {
  console.error('清空失败:', error.message);
}
```

### 8. 查看存储使用情况

```typescript
import { getStorageInfo } from '@/utils/indexedDB';

try {
  const info = await getStorageInfo();
  console.log(`已使用: ${(info.used / 1024 / 1024).toFixed(2)} MB`);
  console.log(`总容量: ${(info.max / 1024 / 1024).toFixed(2)} MB`);
  console.log(`使用率: ${info.percentage}%`);
  
  if (info.percentage > 80) {
    console.warn('存储空间即将用完，建议清理缓存');
  }
} catch (error) {
  console.error('获取存储信息失败:', error.message);
}
```

## 在组件中使用

### 离线资源浏览

```vue
<template>
  <div class="resource-list">
    <div v-if="isOffline" class="offline-tip">
      当前离线，显示缓存资源
    </div>
    
    <ResourceCard
      v-for="resource in resources"
      :key="resource.resourceId"
      :resource="resource"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNetworkStatus } from '@/composables/useNetworkStatus';
import { getAllResources, saveResources } from '@/utils/indexedDB';
import { getResourceList } from '@/api/resource';

const { isOnline } = useNetworkStatus();
const isOffline = computed(() => !isOnline.value);
const resources = ref<ResourceInfo[]>([]);

onMounted(async () => {
  if (isOnline.value) {
    // 在线时从API获取
    try {
      const res = await getResourceList({ pageNum: 1, pageSize: 20 });
      resources.value = res.data.list;
      
      // 保存到IndexedDB供离线使用
      await saveResources(resources.value);
    } catch (error) {
      console.error('获取资源失败:', error);
    }
  } else {
    // 离线时从IndexedDB读取
    try {
      resources.value = await getAllResources();
    } catch (error) {
      console.error('读取缓存失败:', error);
    }
  }
});
</script>
```

### 资源详情页缓存

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNetworkStatus } from '@/composables/useNetworkStatus';
import { getResource, saveResource } from '@/utils/indexedDB';
import { getResourceDetail } from '@/api/resource';

const route = useRoute();
const { isOnline } = useNetworkStatus();
const resource = ref<ResourceInfo | null>(null);

onMounted(async () => {
  const resourceId = route.params.id as string;
  
  if (isOnline.value) {
    // 在线时从API获取
    try {
      const res = await getResourceDetail(resourceId);
      resource.value = res.data;
      
      // 保存到IndexedDB
      await saveResource(resource.value);
    } catch (error) {
      console.error('获取资源详情失败:', error);
    }
  } else {
    // 离线时从IndexedDB读取
    try {
      resource.value = await getResource(resourceId);
      if (!resource.value) {
        ElMessage.warning('该资源未缓存，请在线访问');
      }
    } catch (error) {
      console.error('读取缓存失败:', error);
    }
  }
});
</script>
```

## 错误处理

### 容量超限

```typescript
try {
  await saveResource(largeResource);
} catch (error) {
  if (error.message.includes('存储空间不足')) {
    // 提示用户清理缓存
    ElMessageBox.confirm(
      '离线缓存空间已满（50MB），是否清理部分缓存？',
      '提示',
      {
        confirmButtonText: '清理',
        cancelButtonText: '取消'
      }
    ).then(async () => {
      await clearAll();
      ElMessage.success('缓存已清空');
    });
  }
}
```

### 浏览器不支持

```typescript
try {
  await initDB();
} catch (error) {
  if (error.message.includes('不支持IndexedDB')) {
    ElMessage.warning('当前浏览器不支持离线功能');
  }
}
```

## 最佳实践

### 1. 定期清理过期缓存

```typescript
// 清理7天前的缓存
async function cleanOldCache() {
  const resources = await getAllResources();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  for (const resource of resources) {
    const createTime = new Date(resource.createTime).getTime();
    if (createTime < sevenDaysAgo) {
      await deleteResource(resource.resourceId);
    }
  }
}
```

### 2. 监控存储使用率

```typescript
async function checkStorageUsage() {
  const info = await getStorageInfo();
  
  if (info.percentage > 90) {
    // 自动清理最旧的资源
    const resources = await getAllResources();
    resources.sort((a, b) => 
      new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
    );
    
    // 删除最旧的20%
    const toDelete = Math.floor(resources.length * 0.2);
    for (let i = 0; i < toDelete; i++) {
      await deleteResource(resources[i].resourceId);
    }
  }
}
```

### 3. 网络恢复时同步

```typescript
watch(isOnline, async (online) => {
  if (online) {
    // 网络恢复，刷新缓存
    try {
      const res = await getResourceList({ pageNum: 1, pageSize: 50 });
      await saveResources(res.data.list);
      ElMessage.success('缓存已更新');
    } catch (error) {
      console.error('更新缓存失败:', error);
    }
  }
});
```

## 注意事项

1. **容量限制**: 最大50MB，超出会抛出错误
2. **浏览器兼容性**: 需要浏览器支持IndexedDB（现代浏览器都支持）
3. **异步操作**: 所有方法都是异步的，需要使用await
4. **错误处理**: 建议使用try-catch捕获错误
5. **数据持久化**: IndexedDB数据会持久化存储，除非用户清除浏览器数据
6. **隐私模式**: 某些浏览器的隐私模式可能限制IndexedDB使用

## 相关文档

- [MDN - IndexedDB API](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API)
- [PWA离线支持](./PWA_CONFIGURATION.md)
- [网络状态监控](../composables/useNetworkStatus.example.md)
