/**
 * IndexedDB存储模块
 * 用于离线缓存资源数据，支持PWA离线访问
 */

import type { ResourceInfo } from '@/types/models';

// 数据库配置
const DB_NAME = 'startide_design_db';
const DB_VERSION = 1;
const STORE_NAME = 'resources';
const MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * 初始化IndexedDB数据库
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // 检查浏览器是否支持IndexedDB
    if (!window.indexedDB) {
      reject(new Error('当前浏览器不支持IndexedDB'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('IndexedDB打开失败'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 如果对象存储不存在，则创建
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: 'resourceId'
        });

        // 创建索引以支持查询
        objectStore.createIndex('categoryId', 'categoryId', { unique: false });
        objectStore.createIndex('createTime', 'createTime', { unique: false });
        objectStore.createIndex('downloadCount', 'downloadCount', {
          unique: false
        });
      }
    };
  });
}

/**
 * 获取当前存储大小（估算）
 */
async function getStorageSize(db: IDBDatabase): Promise<number> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    request.onsuccess = () => {
      const resources = request.result;
      // 估算存储大小（JSON字符串长度）
      const size = JSON.stringify(resources).length;
      resolve(size);
    };

    request.onerror = () => {
      reject(new Error('获取存储大小失败'));
    };
  });
}

/**
 * 检查存储容量是否超限
 */
async function checkStorageLimit(db: IDBDatabase, newResourceSize: number): Promise<boolean> {
  const currentSize = await getStorageSize(db);
  return currentSize + newResourceSize <= MAX_STORAGE_SIZE;
}

/**
 * 保存资源到IndexedDB
 * @param resource 资源信息
 */
export async function saveResource(resource: ResourceInfo): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    // 估算新资源大小
    const resourceSize = JSON.stringify(resource).length;

    // 检查容量限制
    checkStorageLimit(db, resourceSize)
      .then((withinLimit) => {
        if (!withinLimit) {
          reject(new Error('存储空间不足，已达到50MB限制。请清理部分缓存数据。'));
          db.close();
          return;
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.put(resource);

        request.onsuccess = () => {
          db.close();
          resolve();
        };

        request.onerror = () => {
          db.close();
          reject(new Error('保存资源失败'));
        };
      })
      .catch((error) => {
        db.close();
        reject(error);
      });
  });
}

/**
 * 从IndexedDB获取资源
 * @param resourceId 资源ID
 */
export async function getResource(resourceId: string): Promise<ResourceInfo | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.get(resourceId);

    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };

    request.onerror = () => {
      db.close();
      reject(new Error('获取资源失败'));
    };
  });
}

/**
 * 删除IndexedDB中的资源
 * @param resourceId 资源ID
 */
export async function deleteResource(resourceId: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.delete(resourceId);

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(new Error('删除资源失败'));
    };
  });
}

/**
 * 清空IndexedDB中的所有数据
 */
export async function clearAll(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.clear();

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(new Error('清空数据失败'));
    };
  });
}

/**
 * 获取所有缓存的资源
 */
export async function getAllResources(): Promise<ResourceInfo[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };

    request.onerror = () => {
      db.close();
      reject(new Error('获取所有资源失败'));
    };
  });
}

/**
 * 批量保存资源
 * @param resources 资源数组
 */
export async function saveResources(resources: ResourceInfo[]): Promise<void> {
  // 如果资源数组为空，直接返回
  if (resources.length === 0) {
    return;
  }

  const db = await initDB();

  return new Promise((resolve, reject) => {
    // 估算批量资源大小
    const resourcesSize = JSON.stringify(resources).length;

    checkStorageLimit(db, resourcesSize)
      .then((withinLimit) => {
        if (!withinLimit) {
          reject(new Error('存储空间不足，已达到50MB限制。请清理部分缓存数据。'));
          db.close();
          return;
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);

        let completed = 0;
        let hasError = false;

        resources.forEach((resource) => {
          const request = objectStore.put(resource);

          request.onsuccess = () => {
            completed++;
            if (completed === resources.length && !hasError) {
              db.close();
              resolve();
            }
          };

          request.onerror = () => {
            if (!hasError) {
              hasError = true;
              db.close();
              reject(new Error('批量保存资源失败'));
            }
          };
        });
      })
      .catch((error) => {
        db.close();
        reject(error);
      });
  });
}

/**
 * 根据分类ID获取资源
 * @param categoryId 分类ID
 */
export async function getResourcesByCategory(categoryId: string): Promise<ResourceInfo[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const index = objectStore.index('categoryId');
    const request = index.getAll(categoryId);

    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };

    request.onerror = () => {
      db.close();
      reject(new Error('获取分类资源失败'));
    };
  });
}

/**
 * 获取当前存储使用情况
 */
export async function getStorageInfo(): Promise<{
  used: number;
  max: number;
  percentage: number;
}> {
  const db = await initDB();
  const used = await getStorageSize(db);
  db.close();

  return {
    used,
    max: MAX_STORAGE_SIZE,
    percentage: Math.round((used / MAX_STORAGE_SIZE) * 100)
  };
}
