/**
 * 离线浏览组合式函数
 *
 * 功能：
 * - 检测离线状态（useNetworkStatus）
 * - 离线时从IndexedDB加载资源
 * - 显示离线标识
 * - 恢复在线时同步数据
 * - 离线时禁用上传和下载功能
 *
 * 需求: 需求10.2、需求13.4（离线支持）
 */

import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useNetworkStatus } from './useNetworkStatus';
import {
  getAllResources,
  saveResources,
  getResource,
  saveResource,
  clearAll
} from '@/utils/indexedDB';
import type { ResourceInfo } from '@/types/models';

/**
 * 离线浏览组合式函数
 */
export function useOffline() {
  // 使用网络状态监控
  const { isOnline } = useNetworkStatus();

  // 离线模式状态
  const isOfflineMode = ref(false);

  // 缓存的资源列表
  const cachedResources = ref<ResourceInfo[]>([]);

  // 加载状态
  const loading = ref(false);

  // 错误信息
  const error = ref<string | null>(null);

  // 待同步的数据队列
  const syncQueue = ref<Array<{ type: string; data: any }>>([]);

  /**
   * 是否有缓存资源
   */
  const hasCachedResources = computed(() => {
    return cachedResources.value.length > 0;
  });

  /**
   * 是否需要同步
   */
  const needsSync = computed(() => {
    return syncQueue.value.length > 0;
  });

  /**
   * 从IndexedDB加载缓存的资源
   */
  async function loadCachedResources(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const resources = await getAllResources();
      cachedResources.value = resources;
      console.log('从IndexedDB加载资源:', resources.length, '条');
    } catch (e) {
      const errorMessage = (e as Error).message || '加载缓存资源失败';
      error.value = errorMessage;
      console.error('加载缓存资源失败:', e);
      ElMessage.error(errorMessage);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 缓存资源到IndexedDB
   * @param resources 要缓存的资源列表
   */
  async function cacheResources(resources: ResourceInfo[]): Promise<void> {
    if (!resources || resources.length === 0) {
      return;
    }

    try {
      await saveResources(resources);
      console.log('缓存资源到IndexedDB:', resources.length, '条');
    } catch (e) {
      console.error('缓存资源失败:', e);
      // 不显示错误提示，静默失败
    }
  }

  /**
   * 缓存单个资源
   * @param resource 要缓存的资源
   */
  async function cacheResource(resource: ResourceInfo): Promise<void> {
    if (!resource) {
      return;
    }

    try {
      await saveResource(resource);
      console.log('缓存资源到IndexedDB:', resource.resourceId);
    } catch (e) {
      console.error('缓存资源失败:', e);
    }
  }

  /**
   * 从IndexedDB获取单个资源
   * @param resourceId 资源ID
   */
  async function getCachedResource(resourceId: string): Promise<ResourceInfo | null> {
    try {
      const resource = await getResource(resourceId);
      return resource;
    } catch (e) {
      console.error('获取缓存资源失败:', e);
      return null;
    }
  }

  /**
   * 清除所有缓存
   */
  async function clearCache(): Promise<void> {
    try {
      await clearAll();
      cachedResources.value = [];
      console.log('清除所有缓存');
      ElMessage.success('缓存已清除');
    } catch (e) {
      const errorMessage = (e as Error).message || '清除缓存失败';
      console.error('清除缓存失败:', e);
      ElMessage.error(errorMessage);
    }
  }

  /**
   * 添加到同步队列
   * @param type 操作类型
   * @param data 数据
   */
  function addToSyncQueue(type: string, data: any): void {
    syncQueue.value.push({ type, data });
    console.log('添加到同步队列:', type, data);

    // 保存到localStorage
    try {
      localStorage.setItem('sync_queue', JSON.stringify(syncQueue.value));
    } catch (e) {
      console.error('保存同步队列失败:', e);
    }
  }

  /**
   * 从localStorage恢复同步队列
   */
  function restoreSyncQueue(): void {
    try {
      const saved = localStorage.getItem('sync_queue');
      if (saved) {
        syncQueue.value = JSON.parse(saved);
        console.log('恢复同步队列:', syncQueue.value.length, '条');
      }
    } catch (e) {
      console.error('恢复同步队列失败:', e);
    }
  }

  /**
   * 同步数据到服务器
   */
  async function syncData(): Promise<void> {
    if (!isOnline.value || syncQueue.value.length === 0) {
      return;
    }

    console.log('开始同步数据:', syncQueue.value.length, '条');
    ElMessage.info('正在同步数据...');

    const failedItems: Array<{ type: string; data: any }> = [];

    for (const item of syncQueue.value) {
      try {
        // 根据类型执行不同的同步操作
        switch (item.type) {
          case 'collect':
            // TODO: 调用收藏API
            console.log('同步收藏:', item.data);
            break;
          case 'download':
            // TODO: 记录下载历史
            console.log('同步下载记录:', item.data);
            break;
          default:
            console.warn('未知的同步类型:', item.type);
        }
      } catch (e) {
        console.error('同步失败:', item, e);
        failedItems.push(item);
      }
    }

    // 更新同步队列（保留失败的项）
    syncQueue.value = failedItems;

    // 更新localStorage
    try {
      if (failedItems.length > 0) {
        localStorage.setItem('sync_queue', JSON.stringify(failedItems));
        ElMessage.warning(`部分数据同步失败，将在下次网络恢复时重试（${failedItems.length}条）`);
      } else {
        localStorage.removeItem('sync_queue');
        ElMessage.success('数据同步完成');
      }
    } catch (e) {
      console.error('更新同步队列失败:', e);
    }
  }

  /**
   * 检查功能是否可用
   * @param feature 功能名称
   */
  function isFeatureAvailable(feature: 'upload' | 'download' | 'search'): {
    available: boolean;
    reason?: string;
  } {
    if (!isOnline.value) {
      switch (feature) {
        case 'upload':
          return {
            available: false,
            reason: '上传功能需要网络连接'
          };
        case 'download':
          return {
            available: false,
            reason: '下载功能需要网络连接'
          };
        case 'search':
          return {
            available: false,
            reason: '搜索功能需要网络连接'
          };
        default:
          return { available: false };
      }
    }

    return { available: true };
  }

  /**
   * 显示功能不可用提示
   * @param feature 功能名称
   */
  function showFeatureUnavailableMessage(feature: 'upload' | 'download' | 'search'): void {
    const result = isFeatureAvailable(feature);
    if (!result.available && result.reason) {
      ElMessage.warning(result.reason);
    }
  }

  /**
   * 处理网络恢复
   */
  function handleNetworkRestored(): void {
    console.log('网络已恢复，准备同步数据');
    isOfflineMode.value = false;

    // 自动同步数据
    if (needsSync.value) {
      syncData();
    }
  }

  /**
   * 处理网络断开
   */
  function handleNetworkDisconnected(): void {
    console.log('网络已断开，进入离线模式');
    isOfflineMode.value = true;

    // 加载缓存资源
    loadCachedResources();
  }

  // 监听在线状态变化
  watch(isOnline, (online, wasOnline) => {
    if (online && wasOnline === false) {
      // 从离线恢复到在线
      handleNetworkRestored();
    } else if (!online && wasOnline === true) {
      // 从在线变为离线
      handleNetworkDisconnected();
    }
  });

  // 监听自定义网络事件
  onMounted(() => {
    // 恢复同步队列
    restoreSyncQueue();

    // 如果初始状态是离线，加载缓存
    if (!isOnline.value) {
      isOfflineMode.value = true;
      loadCachedResources();
    }

    // 监听网络恢复事件
    window.addEventListener('network-restored', handleNetworkRestored);

    // 监听网络断开事件
    window.addEventListener('network-disconnected', handleNetworkDisconnected);

    // 清理事件监听
    return () => {
      window.removeEventListener('network-restored', handleNetworkRestored);
      window.removeEventListener('network-disconnected', handleNetworkDisconnected);
    };
  });

  return {
    // 状态
    isOnline,
    isOfflineMode,
    cachedResources,
    loading,
    error,
    hasCachedResources,
    needsSync,

    // 方法
    loadCachedResources,
    cacheResources,
    cacheResource,
    getCachedResource,
    clearCache,
    addToSyncQueue,
    syncData,
    isFeatureAvailable,
    showFeatureUnavailableMessage
  };
}
