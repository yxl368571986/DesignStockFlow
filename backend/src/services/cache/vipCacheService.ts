/**
 * VIP状态缓存服务
 * 
 * 使用内存缓存优化VIP状态查询性能
 * 支持Redis缓存（可选）
 */

interface VipStatusCache {
  userId: string;
  isVip: boolean;
  vipLevel: number;
  isLifetime: boolean;
  expireAt: Date | null;
  inGracePeriod: boolean;
  cachedAt: Date;
  ttl: number; // 缓存过期时间（毫秒）
}

interface DownloadQuotaCache {
  userId: string;
  date: string;
  vipDownloadCount: number;
  freeDownloadCount: number;
  cachedAt: Date;
}

// 内存缓存
const vipStatusCache = new Map<string, VipStatusCache>();
const downloadQuotaCache = new Map<string, DownloadQuotaCache>();

// 缓存配置
const CACHE_CONFIG = {
  VIP_STATUS_TTL: 5 * 60 * 1000, // VIP状态缓存5分钟
  DOWNLOAD_QUOTA_TTL: 60 * 1000, // 下载配额缓存1分钟
  MAX_CACHE_SIZE: 10000, // 最大缓存条目数
  CLEANUP_INTERVAL: 60 * 1000, // 清理间隔1分钟
};

/**
 * 获取VIP状态缓存
 */
export function getVipStatusFromCache(userId: string): VipStatusCache | null {
  const cached = vipStatusCache.get(userId);
  
  if (!cached) {
    return null;
  }
  
  // 检查是否过期
  const now = Date.now();
  if (now - cached.cachedAt.getTime() > cached.ttl) {
    vipStatusCache.delete(userId);
    return null;
  }
  
  return cached;
}

/**
 * 设置VIP状态缓存
 */
export function setVipStatusCache(
  userId: string,
  status: Omit<VipStatusCache, 'userId' | 'cachedAt' | 'ttl'>
): void {
  // 检查缓存大小，必要时清理
  if (vipStatusCache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
    cleanupExpiredCache();
  }
  
  vipStatusCache.set(userId, {
    ...status,
    userId,
    cachedAt: new Date(),
    ttl: CACHE_CONFIG.VIP_STATUS_TTL,
  });
}

/**
 * 使VIP状态缓存失效
 */
export function invalidateVipStatusCache(userId: string): void {
  vipStatusCache.delete(userId);
}

/**
 * 批量使VIP状态缓存失效
 */
export function invalidateVipStatusCacheBatch(userIds: string[]): void {
  userIds.forEach(userId => vipStatusCache.delete(userId));
}

/**
 * 获取下载配额缓存
 */
export function getDownloadQuotaFromCache(userId: string, date: string): DownloadQuotaCache | null {
  const key = `${userId}:${date}`;
  const cached = downloadQuotaCache.get(key);
  
  if (!cached) {
    return null;
  }
  
  // 检查是否过期
  const now = Date.now();
  if (now - cached.cachedAt.getTime() > CACHE_CONFIG.DOWNLOAD_QUOTA_TTL) {
    downloadQuotaCache.delete(key);
    return null;
  }
  
  return cached;
}

/**
 * 设置下载配额缓存
 */
export function setDownloadQuotaCache(
  userId: string,
  date: string,
  quota: { vipDownloadCount: number; freeDownloadCount: number }
): void {
  const key = `${userId}:${date}`;
  
  // 检查缓存大小
  if (downloadQuotaCache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
    cleanupExpiredDownloadCache();
  }
  
  downloadQuotaCache.set(key, {
    userId,
    date,
    ...quota,
    cachedAt: new Date(),
  });
}

/**
 * 使下载配额缓存失效
 */
export function invalidateDownloadQuotaCache(userId: string, date?: string): void {
  if (date) {
    downloadQuotaCache.delete(`${userId}:${date}`);
  } else {
    // 删除该用户所有日期的缓存
    for (const key of downloadQuotaCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        downloadQuotaCache.delete(key);
      }
    }
  }
}

/**
 * 清理过期的VIP状态缓存
 */
function cleanupExpiredCache(): void {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const [key, value] of vipStatusCache.entries()) {
    if (now - value.cachedAt.getTime() > value.ttl) {
      vipStatusCache.delete(key);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`[VipCache] 清理了 ${deletedCount} 条过期的VIP状态缓存`);
  }
}

/**
 * 清理过期的下载配额缓存
 */
function cleanupExpiredDownloadCache(): void {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const [key, value] of downloadQuotaCache.entries()) {
    if (now - value.cachedAt.getTime() > CACHE_CONFIG.DOWNLOAD_QUOTA_TTL) {
      downloadQuotaCache.delete(key);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`[VipCache] 清理了 ${deletedCount} 条过期的下载配额缓存`);
  }
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): {
  vipStatusCacheSize: number;
  downloadQuotaCacheSize: number;
  maxCacheSize: number;
} {
  return {
    vipStatusCacheSize: vipStatusCache.size,
    downloadQuotaCacheSize: downloadQuotaCache.size,
    maxCacheSize: CACHE_CONFIG.MAX_CACHE_SIZE,
  };
}

/**
 * 清空所有缓存
 */
export function clearAllCache(): void {
  vipStatusCache.clear();
  downloadQuotaCache.clear();
  console.log('[VipCache] 已清空所有缓存');
}

// 定期清理过期缓存
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * 启动缓存清理定时器
 */
export function startCacheCleanup(): void {
  if (cleanupTimer) {
    return;
  }
  
  cleanupTimer = setInterval(() => {
    cleanupExpiredCache();
    cleanupExpiredDownloadCache();
  }, CACHE_CONFIG.CLEANUP_INTERVAL);
  
  console.log('[VipCache] 缓存清理定时器已启动');
}

/**
 * 停止缓存清理定时器
 */
export function stopCacheCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    console.log('[VipCache] 缓存清理定时器已停止');
  }
}

export default {
  getVipStatusFromCache,
  setVipStatusCache,
  invalidateVipStatusCache,
  invalidateVipStatusCacheBatch,
  getDownloadQuotaFromCache,
  setDownloadQuotaCache,
  invalidateDownloadQuotaCache,
  getCacheStats,
  clearAllCache,
  startCacheCleanup,
  stopCacheCleanup,
};
