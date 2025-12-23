/**
 * 渲染优化工具函数
 *
 * 功能：
 * - 提供渲染优化相关的工具函数
 * - 性能监控和调试
 * - 优化建议和检查
 *
 * 需求: 性能优化（渲染优化）
 */

import { Ref, computed, shallowRef, markRaw, watch, WatchStopHandle } from 'vue';

/**
 * 性能监控配置
 */
export interface PerformanceMonitorConfig {
  /** 组件名称 */
  componentName: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 警告阈值（毫秒） */
  warningThreshold?: number;
}

/**
 * 渲染性能指标
 */
export interface RenderMetrics {
  /** 组件名称 */
  componentName: string;
  /** 首次渲染时间 */
  initialRenderTime: number;
  /** 更新次数 */
  updateCount: number;
  /** 平均更新时间 */
  averageUpdateTime: number;
  /** 最大更新时间 */
  maxUpdateTime: number;
  /** 总渲染时间 */
  totalRenderTime: number;
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
  private metrics: Map<string, RenderMetrics> = new Map();
  private updateTimes: Map<string, number[]> = new Map();

  /**
   * 记录首次渲染
   */
  recordInitialRender(componentName: string, renderTime: number): void {
    this.metrics.set(componentName, {
      componentName,
      initialRenderTime: renderTime,
      updateCount: 0,
      averageUpdateTime: 0,
      maxUpdateTime: 0,
      totalRenderTime: renderTime
    });

    if (renderTime > 100) {
      console.warn(`[性能警告] ${componentName} 首次渲染耗时 ${renderTime.toFixed(2)}ms，建议优化`);
    }
  }

  /**
   * 记录更新渲染
   */
  recordUpdate(componentName: string, updateTime: number): void {
    const metric = this.metrics.get(componentName);
    if (!metric) {
      return;
    }

    // 记录更新时间
    const times = this.updateTimes.get(componentName) || [];
    times.push(updateTime);
    this.updateTimes.set(componentName, times);

    // 更新指标
    metric.updateCount++;
    metric.totalRenderTime += updateTime;
    metric.maxUpdateTime = Math.max(metric.maxUpdateTime, updateTime);
    metric.averageUpdateTime = times.reduce((a, b) => a + b, 0) / times.length;

    if (updateTime > 50) {
      console.warn(`[性能警告] ${componentName} 更新耗时 ${updateTime.toFixed(2)}ms，建议优化`);
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(componentName?: string): RenderMetrics | RenderMetrics[] {
    if (componentName) {
      return (
        this.metrics.get(componentName) || {
          componentName,
          initialRenderTime: 0,
          updateCount: 0,
          averageUpdateTime: 0,
          maxUpdateTime: 0,
          totalRenderTime: 0
        }
      );
    }
    return Array.from(this.metrics.values());
  }

  /**
   * 清除指标
   */
  clear(componentName?: string): void {
    if (componentName) {
      this.metrics.delete(componentName);
      this.updateTimes.delete(componentName);
    } else {
      this.metrics.clear();
      this.updateTimes.clear();
    }
  }

  /**
   * 打印性能报告
   */
  printReport(): void {
    const allMetrics = Array.from(this.metrics.values());

    if (allMetrics.length === 0) {
      console.log('[性能报告] 暂无数据');
      return;
    }

    console.group('[性能报告]');

    allMetrics.forEach((metric) => {
      console.group(metric.componentName);
      console.log(`首次渲染: ${metric.initialRenderTime.toFixed(2)}ms`);
      console.log(`更新次数: ${metric.updateCount}`);
      console.log(`平均更新: ${metric.averageUpdateTime.toFixed(2)}ms`);
      console.log(`最大更新: ${metric.maxUpdateTime.toFixed(2)}ms`);
      console.log(`总耗时: ${metric.totalRenderTime.toFixed(2)}ms`);
      console.groupEnd();
    });

    console.groupEnd();
  }
}

// 全局性能监控器实例
export const performanceMonitor = new PerformanceMonitor();

/**
 * 创建性能监控钩子
 *
 * @example
 * ```ts
 * const { startRender, endRender } = useRenderMonitor('ResourceList');
 *
 * onMounted(() => {
 *   endRender('mount');
 * });
 *
 * onUpdated(() => {
 *   endRender('update');
 * });
 *
 * startRender(); // 在setup开始时调用
 * ```
 */
export function useRenderMonitor(componentName: string, enabled = true) {
  if (!enabled) {
    return {
      startRender: () => {},
      endRender: () => {}
    };
  }

  let renderStart = 0;
  let isInitialRender = true;

  function startRender(): void {
    renderStart = performance.now();
  }

  function endRender(phase: 'mount' | 'update'): void {
    const renderTime = performance.now() - renderStart;

    if (phase === 'mount') {
      performanceMonitor.recordInitialRender(componentName, renderTime);
      isInitialRender = false;
    } else if (!isInitialRender) {
      performanceMonitor.recordUpdate(componentName, renderTime);
    }
  }

  return {
    startRender,
    endRender
  };
}

/**
 * 创建优化的计算属性
 * 自动检测计算属性的执行时间
 *
 * @example
 * ```ts
 * const filteredList = createOptimizedComputed(
 *   'filteredList',
 *   () => items.value.filter(item => item.active)
 * );
 * ```
 */
export function createOptimizedComputed<T>(
  name: string,
  getter: () => T,
  warnThreshold = 10
): Ref<T> {
  return computed(() => {
    const start = performance.now();
    const result = getter();
    const duration = performance.now() - start;

    if (duration > warnThreshold) {
      console.warn(`[计算属性警告] ${name} 执行耗时 ${duration.toFixed(2)}ms，建议优化`);
    }

    return result;
  });
}

/**
 * 创建浅层响应式引用（优化大数据）
 *
 * @example
 * ```ts
 * const largeList = createShallowRef([...1000项数据]);
 * ```
 */
export function createShallowRef<T>(value: T): Ref<T> {
  return shallowRef(value);
}

/**
 * 标记为非响应式（优化静态数据）
 *
 * @example
 * ```ts
 * const config = createRawData({
 *   apiUrl: 'https://api.example.com',
 *   timeout: 5000
 * });
 * ```
 */
export function createRawData<T extends object>(value: T): T {
  return markRaw(value);
}

/**
 * 检查是否应该使用v-show
 *
 * @param toggleFrequency - 切换频率（次/分钟）
 * @param hasComplexChildren - 是否有复杂子组件
 * @returns true表示应该使用v-show
 */
export function shouldUseVShow(toggleFrequency: number, hasComplexChildren = false): boolean {
  // 频繁切换（>5次/分钟）且没有复杂子组件，使用v-show
  return toggleFrequency > 5 && !hasComplexChildren;
}

/**
 * 生成唯一的列表key
 *
 * @param item - 列表项
 * @param fields - 用于生成key的字段
 * @returns 唯一key
 */
export function generateListKey(item: any, fields: string[]): string {
  return fields.map((field) => item[field]).join('-');
}

/**
 * 检查列表key是否唯一
 *
 * @param items - 列表项
 * @param keyField - key字段名
 * @returns 是否唯一
 */
export function validateListKeys(items: any[], keyField: string): boolean {
  const keys = items.map((item) => item[keyField]);
  const uniqueKeys = new Set(keys);

  if (keys.length !== uniqueKeys.size) {
    console.error(`[列表key警告] 检测到重复的key，这会导致渲染问题。字段: ${keyField}`);
    return false;
  }

  return true;
}

/**
 * 优化的watch（自动清理）
 *
 * @example
 * ```ts
 * const stop = createOptimizedWatch(
 *   () => searchKeyword.value,
 *   (keyword) => {
 *     console.log('搜索:', keyword);
 *   },
 *   { debounce: 300 }
 * );
 *
 * // 组件卸载时自动清理
 * onUnmounted(stop);
 * ```
 */
export function createOptimizedWatch<T>(
  source: () => T,
  callback: (value: T, oldValue: T) => void,
  options: {
    immediate?: boolean;
    deep?: boolean;
    debounce?: number;
    throttle?: number;
  } = {}
): WatchStopHandle {
  const { immediate, deep, debounce, throttle } = options;

  let timeoutId: number | undefined;
  let lastCallTime = 0;

  const wrappedCallback = (value: T, oldValue: T) => {
    // 防抖
    if (debounce) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        callback(value, oldValue);
      }, debounce);
      return;
    }

    // 节流
    if (throttle) {
      const now = Date.now();
      if (now - lastCallTime < throttle) {
        return;
      }
      lastCallTime = now;
    }

    callback(value, oldValue);
  };

  return watch(source, wrappedCallback as any, { immediate, deep });
}

/**
 * 批量更新优化
 * 将多个更新合并为一次
 *
 * @example
 * ```ts
 * const batchUpdate = createBatchUpdater();
 *
 * batchUpdate(() => {
 *   state1.value = newValue1;
 *   state2.value = newValue2;
 *   state3.value = newValue3;
 * });
 * ```
 */
export function createBatchUpdater() {
  let pending = false;
  const callbacks: Array<() => void> = [];

  function flush(): void {
    pending = false;
    const cbs = callbacks.slice();
    callbacks.length = 0;
    cbs.forEach((cb) => cb());
  }

  return function batchUpdate(callback: () => void): void {
    callbacks.push(callback);

    if (!pending) {
      pending = true;
      Promise.resolve().then(flush);
    }
  };
}

/**
 * 渲染优化建议
 */
export interface OptimizationSuggestion {
  /** 建议类型 */
  type: 'warning' | 'info' | 'error';
  /** 建议内容 */
  message: string;
  /** 组件名称 */
  componentName?: string;
  /** 优化方案 */
  solution?: string;
}

/**
 * 分析组件性能并给出优化建议
 */
export function analyzePerformance(componentName: string): OptimizationSuggestion[] {
  const metrics = performanceMonitor.getMetrics(componentName) as RenderMetrics;
  const suggestions: OptimizationSuggestion[] = [];

  if (!metrics || metrics.updateCount === 0) {
    return suggestions;
  }

  // 检查首次渲染时间
  if (metrics.initialRenderTime > 100) {
    suggestions.push({
      type: 'warning',
      message: `首次渲染耗时 ${metrics.initialRenderTime.toFixed(2)}ms，超过100ms`,
      componentName,
      solution: '考虑使用代码分割、懒加载或减少初始渲染的内容'
    });
  }

  // 检查更新频率
  if (metrics.updateCount > 50) {
    suggestions.push({
      type: 'warning',
      message: `更新次数过多 (${metrics.updateCount}次)`,
      componentName,
      solution: '检查是否有不必要的重渲染，使用computed缓存计算结果'
    });
  }

  // 检查平均更新时间
  if (metrics.averageUpdateTime > 16) {
    suggestions.push({
      type: 'warning',
      message: `平均更新时间 ${metrics.averageUpdateTime.toFixed(2)}ms，超过16ms（60fps）`,
      componentName,
      solution: '优化更新逻辑，考虑使用虚拟滚动或v-memo'
    });
  }

  // 检查最大更新时间
  if (metrics.maxUpdateTime > 50) {
    suggestions.push({
      type: 'error',
      message: `最大更新时间 ${metrics.maxUpdateTime.toFixed(2)}ms，严重影响性能`,
      componentName,
      solution: '定位耗时操作，考虑异步处理或Web Worker'
    });
  }

  return suggestions;
}

/**
 * 打印优化建议
 */
export function printOptimizationSuggestions(componentName?: string): void {
  const components = componentName
    ? [componentName]
    : Array.from((performanceMonitor.getMetrics() as RenderMetrics[]).map((m) => m.componentName));

  console.group('[渲染优化建议]');

  components.forEach((name) => {
    const suggestions = analyzePerformance(name);

    if (suggestions.length === 0) {
      console.log(`✅ ${name}: 性能良好`);
      return;
    }

    console.group(`⚠️ ${name}`);
    suggestions.forEach((suggestion) => {
      const icon = suggestion.type === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${suggestion.message}`);
      if (suggestion.solution) {
        console.log(`   💡 ${suggestion.solution}`);
      }
    });
    console.groupEnd();
  });

  console.groupEnd();
}

/**
 * 开发环境性能调试工具
 */
export const devPerformanceTools = {
  /** 获取性能指标 */
  getMetrics: (componentName?: string) => performanceMonitor.getMetrics(componentName),

  /** 打印性能报告 */
  printReport: () => performanceMonitor.printReport(),

  /** 打印优化建议 */
  printSuggestions: (componentName?: string) => printOptimizationSuggestions(componentName),

  /** 清除性能数据 */
  clear: (componentName?: string) => performanceMonitor.clear(componentName),

  /** 分析性能 */
  analyze: (componentName: string) => analyzePerformance(componentName)
};

// 在开发环境暴露到window
if (import.meta.env.DEV) {
  (window as any).__PERF__ = devPerformanceTools;
  console.log('[渲染优化] 性能调试工具已加载，使用 window.__PERF__ 访问');
}
