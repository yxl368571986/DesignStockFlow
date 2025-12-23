/**
 * 网络优化工具模块
 * 提供DNS预解析、资源预加载、请求防抖节流等网络优化功能
 */

import { debounce, throttle, rafThrottle } from './performance';

/**
 * DNS预解析配置
 * 预解析常用域名，减少DNS查询时间
 */
export const DNS_PREFETCH_DOMAINS = [
  'api.startide-design.com',
  'cdn.startide-design.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

/**
 * 资源预加载配置
 * 预加载关键资源，提升首屏加载速度
 */
export const PRELOAD_RESOURCES = [
  { href: '/src/assets/styles/index.css', as: 'style' },
  { href: '/src/main.ts', as: 'script' }
];

/**
 * 动态添加DNS预解析
 * @param domains 域名列表
 */
export function addDNSPrefetch(domains: string[]): void {
  if (typeof document === 'undefined') return;

  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
}

/**
 * 动态添加预连接
 * @param urls URL列表
 */
export function addPreconnect(urls: string[]): void {
  if (typeof document === 'undefined') return;

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * 动态添加资源预加载
 * @param resources 资源列表
 */
export function addPreload(resources: Array<{ href: string; as: string; type?: string }>): void {
  if (typeof document === 'undefined') return;

  resources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) {
      link.type = resource.type;
    }
    document.head.appendChild(link);
  });
}

/**
 * 预加载图片（批量）
 * @param urls 图片URL列表
 */
export function preloadImagesBatch(urls: string[]): Promise<void[]> {
  const promises = urls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  });

  return Promise.all(promises);
}

/**
 * 搜索请求防抖
 * 用于搜索框输入、搜索联想等场景
 * @param fn 搜索函数
 * @param delay 延迟时间（默认300ms）
 */
export function debounceSearch<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  return debounce(fn, delay);
}

/**
 * 滚动事件节流
 * 用于滚动加载、滚动监听等场景
 * @param fn 滚动处理函数
 * @param delay 延迟时间（默认100ms）
 */
export function throttleScroll<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  return throttle(fn, delay);
}

/**
 * 窗口resize事件节流
 * 用于响应式布局调整、图表重绘等场景
 * @param fn resize处理函数
 * @param delay 延迟时间（默认200ms）
 */
export function throttleResize<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 200
): (...args: Parameters<T>) => void {
  return throttle(fn, delay);
}

/**
 * 使用requestAnimationFrame的滚动节流
 * 性能更好，适用于动画相关的滚动处理
 * @param fn 滚动处理函数
 */
export function rafThrottleScroll<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  return rafThrottle(fn);
}

/**
 * 使用requestAnimationFrame的resize节流
 * 性能更好，适用于动画相关的resize处理
 * @param fn resize处理函数
 */
export function rafThrottleResize<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  return rafThrottle(fn);
}

/**
 * 检测网络连接类型
 * @returns 网络类型信息
 */
export function getNetworkType(): {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
} {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    };
  }

  const connection = (navigator as any).connection;
  return {
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false
  };
}

/**
 * 判断是否为慢速网络
 * @returns 是否为慢速网络
 */
export function isSlowNetwork(): boolean {
  const { effectiveType, saveData } = getNetworkType();
  return effectiveType === 'slow-2g' || effectiveType === '2g' || saveData;
}

/**
 * 判断是否为快速网络
 * @returns 是否为快速网络
 */
export function isFastNetwork(): boolean {
  const { effectiveType } = getNetworkType();
  return effectiveType === '4g' || effectiveType === '5g';
}

/**
 * 根据网络状态调整资源质量
 * @param highQualityUrl 高质量资源URL
 * @param lowQualityUrl 低质量资源URL
 * @returns 适合当前网络的资源URL
 */
export function getAdaptiveResourceUrl(highQualityUrl: string, lowQualityUrl: string): string {
  return isSlowNetwork() ? lowQualityUrl : highQualityUrl;
}

/**
 * 初始化网络优化
 * 在应用启动时调用，配置DNS预解析和资源预加载
 */
export function initNetworkOptimization(): void {
  // 添加DNS预解析
  addDNSPrefetch(DNS_PREFETCH_DOMAINS);

  // 添加预连接
  addPreconnect(['https://api.startide-design.com', 'https://cdn.startide-design.com']);

  // 监听网络状态变化
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    connection.addEventListener('change', () => {
      console.log('Network status changed:', getNetworkType());
    });
  }
}

/**
 * 请求队列管理器
 * 用于控制并发请求数量，避免浏览器连接数限制
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 6) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * 添加请求到队列
   * @param request 请求函数
   */
  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  /**
   * 处理队列
   */
  private async process(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const request = this.queue.shift();

    if (request) {
      try {
        await request();
      } finally {
        this.running--;
        this.process();
      }
    }
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * 获取队列长度
   */
  get length(): number {
    return this.queue.length;
  }
}

/**
 * 全局请求队列实例
 */
export const globalRequestQueue = new RequestQueue(6);

/**
 * 资源提示（Resource Hints）工具
 */
export const ResourceHints = {
  /**
   * DNS预解析
   */
  dnsPrefetch: addDNSPrefetch,

  /**
   * 预连接
   */
  preconnect: addPreconnect,

  /**
   * 资源预加载
   */
  preload: addPreload,

  /**
   * 图片预加载（批量）
   */
  preloadImagesBatch
};

export default {
  initNetworkOptimization,
  debounceSearch,
  throttleScroll,
  throttleResize,
  rafThrottleScroll,
  rafThrottleResize,
  getNetworkType,
  isSlowNetwork,
  isFastNetwork,
  getAdaptiveResourceUrl,
  RequestQueue,
  globalRequestQueue,
  ResourceHints
};
