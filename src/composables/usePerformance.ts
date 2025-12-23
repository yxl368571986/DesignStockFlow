/**
 * 性能监控 Composable
 *
 * 功能：
 * - 监控页面性能指标
 * - 检测设备性能
 * - 根据设备性能调整策略
 * - 性能数据上报
 *
 * 需求: 需求15.3（移动端性能优化）
 */

import { ref, onMounted, onUnmounted } from 'vue';
import {
  observePerformance,
  detectDevicePerformance,
  type PerformanceMetrics,
  type DevicePerformance
} from '@/utils/performance';

/**
 * 性能监控 Composable
 */
export function usePerformance() {
  // 性能指标
  const metrics = ref<PerformanceMetrics>({});

  // 设备性能
  const devicePerformance = ref<DevicePerformance>({
    isLowEnd: false
  });

  // 是否为低端设备
  const isLowEndDevice = ref(false);

  /**
   * 初始化性能监控
   */
  function initPerformanceMonitoring(): void {
    // 检测设备性能
    devicePerformance.value = detectDevicePerformance();
    isLowEndDevice.value = devicePerformance.value.isLowEnd;

    // 监听性能指标
    observePerformance((newMetrics) => {
      metrics.value = { ...metrics.value, ...newMetrics };
    });
  }

  /**
   * 获取性能建议
   */
  function getPerformanceRecommendations(): {
    enableVirtualScroll: boolean;
    enableLazyLoad: boolean;
    imageQuality: 'high' | 'medium' | 'low';
    animationEnabled: boolean;
  } {
    const isLowEnd = isLowEndDevice.value;

    return {
      enableVirtualScroll: !!(isLowEnd || (metrics.value.lcp && metrics.value.lcp > 2500)),
      enableLazyLoad: true, // 始终启用懒加载
      imageQuality: isLowEnd ? 'low' : 'high',
      animationEnabled: !isLowEnd
    };
  }

  /**
   * 上报性能数据
   */
  function reportPerformance(): void {
    if (!metrics.value.fcp && !metrics.value.lcp) {
      return;
    }

    // 这里可以将性能数据发送到后端
    console.log('Performance Metrics:', {
      ...metrics.value,
      device: devicePerformance.value,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });

    // TODO: 实际项目中应该调用API上报
    // await reportPerformanceAPI(metrics.value);
  }

  onMounted(() => {
    initPerformanceMonitoring();

    // 页面卸载时上报性能数据
    window.addEventListener('beforeunload', reportPerformance);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', reportPerformance);
  });

  return {
    metrics,
    devicePerformance,
    isLowEndDevice,
    getPerformanceRecommendations,
    reportPerformance
  };
}

/**
 * 首屏性能优化 Composable
 */
export function useFirstScreenOptimization() {
  const isFirstScreenLoaded = ref(false);
  const firstScreenTime = ref(0);

  /**
   * 标记首屏加载完成
   */
  function markFirstScreenLoaded(): void {
    if (isFirstScreenLoaded.value) {
      return;
    }

    isFirstScreenLoaded.value = true;
    firstScreenTime.value = performance.now();

    console.log(`首屏加载时间: ${firstScreenTime.value.toFixed(2)}ms`);
  }

  /**
   * 优化首屏资源加载
   */
  function optimizeFirstScreen(): void {
    // 延迟加载非关键资源
    requestIdleCallback(() => {
      // 预加载下一页可能需要的资源
      console.log('预加载非关键资源');
    });
  }

  onMounted(() => {
    // 监听首屏加载
    if (document.readyState === 'complete') {
      markFirstScreenLoaded();
    } else {
      window.addEventListener('load', markFirstScreenLoaded);
    }

    optimizeFirstScreen();
  });

  onUnmounted(() => {
    window.removeEventListener('load', markFirstScreenLoaded);
  });

  return {
    isFirstScreenLoaded,
    firstScreenTime,
    markFirstScreenLoaded
  };
}

/**
 * 触摸事件优化 Composable
 */
export function useTouchOptimization() {
  /**
   * 添加优化的触摸事件监听器
   */
  function addOptimizedTouchListener(
    element: HTMLElement,
    event: 'touchstart' | 'touchmove' | 'touchend',
    handler: (e: TouchEvent) => void,
    options?: { passive?: boolean; capture?: boolean }
  ): () => void {
    const opts = {
      passive: true, // 默认使用passive提升性能
      ...options
    };

    element.addEventListener(event, handler as EventListener, opts);

    // 返回清理函数
    return () => {
      element.removeEventListener(event, handler as EventListener, opts);
    };
  }

  /**
   * 防止触摸穿透
   */
  function preventTouchThrough(element: HTMLElement): () => void {
    const handler = (e: TouchEvent) => {
      e.stopPropagation();
    };

    element.addEventListener('touchstart', handler, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handler);
    };
  }

  return {
    addOptimizedTouchListener,
    preventTouchThrough
  };
}
