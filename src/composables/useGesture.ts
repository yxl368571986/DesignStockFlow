/**
 * 手势交互组合式函数
 *
 * 功能：
 * - 滑动手势（左滑、右滑、上滑、下滑）
 * - 下拉刷新
 * - 长按操作
 *
 * 需求: 需求15.2（手势交互）
 */

import { ref, readonly, onMounted, onUnmounted, Ref } from 'vue';

/**
 * 滑动方向枚举
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/**
 * 滑动选项接口
 */
export interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // 触发滑动的最小距离（像素）
}

/**
 * 下拉刷新选项接口
 */
export interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // 触发刷新的最小距离（像素）
  maxDistance?: number; // 最大下拉距离（像素）
}

/**
 * 长按选项接口
 */
export interface LongPressOptions {
  onLongPress: (event: TouchEvent) => void;
  delay?: number; // 长按触发延迟（毫秒）
}

/**
 * 滑动手势
 *
 * @param element - 目标元素的ref
 * @param options - 滑动选项
 */
export function useSwipe(element: Ref<HTMLElement | null | undefined>, options: SwipeOptions) {
  const startX = ref(0);
  const startY = ref(0);
  const startTime = ref(0);
  const threshold = options.threshold || 50;
  const isSwiping = ref(false);

  /**
   * 处理触摸开始事件
   */
  function handleTouchStart(e: TouchEvent) {
    startX.value = e.touches[0].clientX;
    startY.value = e.touches[0].clientY;
    startTime.value = Date.now();
    isSwiping.value = true;
  }

  /**
   * 处理触摸结束事件
   */
  function handleTouchEnd(e: TouchEvent) {
    if (!isSwiping.value) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const endTime = Date.now();

    const diffX = endX - startX.value;
    const diffY = endY - startY.value;
    const diffTime = endTime - startTime.value;

    // 只处理快速滑动（小于300ms）
    if (diffTime > 300) {
      isSwiping.value = false;
      return;
    }

    // 判断滑动方向（水平或垂直）
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // 水平滑动
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          options.onSwipeRight?.();
        } else {
          options.onSwipeLeft?.();
        }
      }
    } else {
      // 垂直滑动
      if (Math.abs(diffY) > threshold) {
        if (diffY > 0) {
          options.onSwipeDown?.();
        } else {
          options.onSwipeUp?.();
        }
      }
    }

    isSwiping.value = false;
  }

  /**
   * 处理触摸取消事件
   */
  function handleTouchCancel() {
    isSwiping.value = false;
  }

  /**
   * 初始化事件监听
   */
  function initSwipeListeners() {
    const el = element.value;
    if (el) {
      el.addEventListener('touchstart', handleTouchStart, { passive: true });
      el.addEventListener('touchend', handleTouchEnd, { passive: true });
      el.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    }
  }

  /**
   * 清理事件监听
   */
  function cleanupSwipeListeners() {
    const el = element.value;
    if (el) {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchCancel);
    }
  }

  // 自动初始化和清理
  onMounted(() => {
    initSwipeListeners();
  });

  onUnmounted(() => {
    cleanupSwipeListeners();
  });

  return {
    isSwiping: readonly(isSwiping),
    initSwipeListeners,
    cleanupSwipeListeners
  };
}

/**
 * 下拉刷新
 *
 * @param element - 目标元素的ref
 * @param options - 下拉刷新选项
 */
export function usePullToRefresh(
  element: Ref<HTMLElement | null | undefined>,
  options: PullToRefreshOptions
) {
  const startY = ref(0);
  const isPulling = ref(false);
  const isRefreshing = ref(false);
  const pullDistance = ref(0);
  const threshold = options.threshold || 60;
  const maxDistance = options.maxDistance || 100;

  /**
   * 处理触摸开始事件
   */
  function handleTouchStart(e: TouchEvent) {
    const el = element.value;
    if (el && el.scrollTop === 0 && !isRefreshing.value) {
      startY.value = e.touches[0].clientY;
      isPulling.value = true;
    }
  }

  /**
   * 处理触摸移动事件
   */
  function handleTouchMove(e: TouchEvent) {
    if (!isPulling.value || isRefreshing.value) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.value;

    // 只处理向下拉动
    if (distance > 0) {
      // 限制最大下拉距离，使用阻尼效果
      pullDistance.value = Math.min(distance * 0.5, maxDistance);

      // 阻止默认滚动行为
      if (pullDistance.value > 0) {
        e.preventDefault();
      }
    }
  }

  /**
   * 处理触摸结束事件
   */
  async function handleTouchEnd() {
    if (!isPulling.value || isRefreshing.value) return;

    // 如果下拉距离超过阈值，触发刷新
    if (pullDistance.value >= threshold) {
      isRefreshing.value = true;

      try {
        await options.onRefresh();
      } catch (error) {
        console.error('刷新失败:', error);
      } finally {
        isRefreshing.value = false;
      }
    }

    // 重置状态
    isPulling.value = false;
    pullDistance.value = 0;
    startY.value = 0;
  }

  /**
   * 处理触摸取消事件
   */
  function handleTouchCancel() {
    isPulling.value = false;
    pullDistance.value = 0;
    startY.value = 0;
  }

  /**
   * 初始化事件监听
   */
  function initPullToRefreshListeners() {
    const el = element.value;
    if (el) {
      el.addEventListener('touchstart', handleTouchStart, { passive: true });
      el.addEventListener('touchmove', handleTouchMove, { passive: false });
      el.addEventListener('touchend', handleTouchEnd, { passive: true });
      el.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    }
  }

  /**
   * 清理事件监听
   */
  function cleanupPullToRefreshListeners() {
    const el = element.value;
    if (el) {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchCancel);
    }
  }

  // 自动初始化和清理
  onMounted(() => {
    initPullToRefreshListeners();
  });

  onUnmounted(() => {
    cleanupPullToRefreshListeners();
  });

  return {
    isPulling: readonly(isPulling),
    isRefreshing: readonly(isRefreshing),
    pullDistance: readonly(pullDistance),
    initPullToRefreshListeners,
    cleanupPullToRefreshListeners
  };
}

/**
 * 长按操作
 *
 * @param element - 目标元素的ref
 * @param options - 长按选项
 */
export function useLongPress(
  element: Ref<HTMLElement | null | undefined>,
  options: LongPressOptions
) {
  const isLongPressing = ref(false);
  const longPressTimer = ref<number | null>(null);
  const delay = options.delay || 500;
  const startX = ref(0);
  const startY = ref(0);
  const moveThreshold = 10; // 移动超过10px取消长按

  /**
   * 处理触摸开始事件
   */
  function handleTouchStart(e: TouchEvent) {
    startX.value = e.touches[0].clientX;
    startY.value = e.touches[0].clientY;

    // 设置长按定时器
    longPressTimer.value = window.setTimeout(() => {
      isLongPressing.value = true;
      options.onLongPress(e);

      // 触发触觉反馈（如果支持）
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, delay);
  }

  /**
   * 处理触摸移动事件
   */
  function handleTouchMove(e: TouchEvent) {
    // 如果移动距离超过阈值，取消长按
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(currentX - startX.value);
    const diffY = Math.abs(currentY - startY.value);

    if (diffX > moveThreshold || diffY > moveThreshold) {
      cancelLongPress();
    }
  }

  /**
   * 处理触摸结束事件
   */
  function handleTouchEnd() {
    cancelLongPress();
  }

  /**
   * 处理触摸取消事件
   */
  function handleTouchCancel() {
    cancelLongPress();
  }

  /**
   * 取消长按
   */
  function cancelLongPress() {
    if (longPressTimer.value !== null) {
      clearTimeout(longPressTimer.value);
      longPressTimer.value = null;
    }
    isLongPressing.value = false;
  }

  /**
   * 初始化事件监听
   */
  function initLongPressListeners() {
    const el = element.value;
    if (el) {
      el.addEventListener('touchstart', handleTouchStart, { passive: true });
      el.addEventListener('touchmove', handleTouchMove, { passive: true });
      el.addEventListener('touchend', handleTouchEnd, { passive: true });
      el.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    }
  }

  /**
   * 清理事件监听
   */
  function cleanupLongPressListeners() {
    const el = element.value;
    if (el) {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchCancel);
    }

    // 清理定时器
    cancelLongPress();
  }

  // 自动初始化和清理
  onMounted(() => {
    initLongPressListeners();
  });

  onUnmounted(() => {
    cleanupLongPressListeners();
  });

  return {
    isLongPressing: readonly(isLongPressing),
    cancelLongPress,
    initLongPressListeners,
    cleanupLongPressListeners
  };
}
