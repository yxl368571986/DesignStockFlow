/**
 * 性能优化工具函数
 *
 * 功能：
 * - 防抖和节流
 * - 请求动画帧优化
 * - 触摸事件优化
 * - 资源预加载
 *
 * 需求: 需求15.3（移动端性能优化）
 */

/**
 * 防抖函数
 * 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

/**
 * 节流函数
 * 规定在一个单位时间内，只能触发一次函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;

  return function (this: any, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    const now = Date.now();

    if (!previous) {
      previous = now;
    }

    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(context, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(context, args);
      }, remaining);
    }
  };
}

/**
 * 使用requestAnimationFrame优化的节流
 * 适用于滚动、resize等高频事件
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    if (rafId !== null) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      func.apply(context, args);
      rafId = null;
    });
  };
}

/**
 * 空闲时执行
 * 使用requestIdleCallback在浏览器空闲时执行任务
 */
export function runWhenIdle(callback: () => void, options?: IdleRequestOptions): number {
  if ('requestIdleCallback' in window) {
    return (window as Window & typeof globalThis).requestIdleCallback(callback, options);
  } else {
    // 降级方案：使用setTimeout
    return (window as Window & typeof globalThis).setTimeout(callback, 1) as unknown as number;
  }
}

/**
 * 取消空闲任务
 */
export function cancelIdle(id: number): void {
  if ('cancelIdleCallback' in window) {
    (window as Window & typeof globalThis).cancelIdleCallback(id);
  } else {
    (window as Window & typeof globalThis).clearTimeout(id);
  }
}

/**
 * 优化触摸事件
 * 添加passive选项提升滚动性能
 */
export function addPassiveEventListener(
  element: Element | Window,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): void {
  const passiveSupported = checkPassiveSupport();

  element.addEventListener(
    event,
    handler,
    passiveSupported ? { ...options, passive: true } : false
  );
}

/**
 * 检查浏览器是否支持passive选项
 */
let passiveSupported: boolean | null = null;

function checkPassiveSupport(): boolean {
  if (passiveSupported !== null) {
    return passiveSupported;
  }

  try {
    const options = {
      get passive() {
        passiveSupported = true;
        return false;
      }
    };

    const testHandler = () => {};
    window.addEventListener('test' as any, testHandler, options);
    window.removeEventListener('test' as any, testHandler);
  } catch (err) {
    passiveSupported = false;
  }

  return passiveSupported || false;
}

/**
 * 图片预加载
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 批量预加载图片
 */
export async function preloadImages(
  srcs: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  let loaded = 0;
  const total = srcs.length;

  const promises = srcs.map(async (src) => {
    try {
      await preloadImage(src);
      loaded++;
      onProgress?.(loaded, total);
    } catch (error) {
      console.error(`Failed to preload image: ${src}`, error);
      loaded++;
      onProgress?.(loaded, total);
    }
  });

  await Promise.all(promises);
}

/**
 * 资源预加载（使用link标签）
 */
export function preloadResource(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch',
  options?: {
    type?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  }
): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;

  if (options?.type) {
    link.type = options.type;
  }

  if (options?.crossOrigin) {
    link.crossOrigin = options.crossOrigin;
  }

  document.head.appendChild(link);
}

/**
 * DNS预解析
 */
export function dnsPrefetch(domain: string): void {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = domain;
  document.head.appendChild(link);
}

/**
 * 预连接
 */
export function preconnect(url: string, crossOrigin?: 'anonymous' | 'use-credentials'): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;

  if (crossOrigin) {
    link.crossOrigin = crossOrigin;
  }

  document.head.appendChild(link);
}

/**
 * 延迟执行
 * 延迟到下一个宏任务
 */
export function defer(callback: () => void): void {
  setTimeout(callback, 0);
}

/**
 * 批处理执行
 * 将多个任务分批执行，避免阻塞主线程
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => R | Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    // 让出主线程
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return results;
}

/**
 * 性能监控
 */
export interface PerformanceMetrics {
  /** 首次内容绘制 */
  fcp?: number;
  /** 最大内容绘制 */
  lcp?: number;
  /** 首次输入延迟 */
  fid?: number;
  /** 累积布局偏移 */
  cls?: number;
  /** 首次字节时间 */
  ttfb?: number;
}

/**
 * 获取性能指标
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {};

  if ('performance' in window && 'getEntriesByType' in performance) {
    // FCP
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      metrics.fcp = fcpEntry.startTime;
    }

    // TTFB
    const navigationEntries = performance.getEntriesByType(
      'navigation'
    ) as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      metrics.ttfb = navigationEntries[0].responseStart - navigationEntries[0].requestStart;
    }
  }

  return metrics;
}

/**
 * 监听性能指标
 */
export function observePerformance(callback: (metrics: PerformanceMetrics) => void): void {
  if ('PerformanceObserver' in window) {
    // 监听LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        callback({ lcp: lastEntry.renderTime || lastEntry.loadTime });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observation not supported');
    }

    // 监听FID
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          callback({ fid: entry.processingStart - entry.startTime });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID observation not supported');
    }

    // 监听CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            callback({ cls: clsValue });
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observation not supported');
    }
  }

  // 获取初始指标
  defer(() => {
    callback(getPerformanceMetrics());
  });
}

/**
 * 内存优化：清理未使用的对象
 */
export function clearUnusedObjects<T extends Record<string, any>>(
  obj: T,
  keysToKeep: (keyof T)[]
): void {
  const keys = Object.keys(obj) as (keyof T)[];
  keys.forEach((key) => {
    if (!keysToKeep.includes(key)) {
      delete obj[key];
    }
  });
}

/**
 * 检测设备性能
 */
export interface DevicePerformance {
  /** 设备内存（GB） */
  memory?: number;
  /** CPU核心数 */
  cores?: number;
  /** 是否低端设备 */
  isLowEnd: boolean;
}

export function detectDevicePerformance(): DevicePerformance {
  const nav = navigator as any;
  const memory = nav.deviceMemory; // GB
  const cores = nav.hardwareConcurrency;

  // 判断是否为低端设备
  const isLowEnd = (memory && memory < 4) || (cores && cores < 4);

  return {
    memory,
    cores,
    isLowEnd
  };
}
