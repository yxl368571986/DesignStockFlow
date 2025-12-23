/**
 * useGesture 组合式函数测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { useSwipe, usePullToRefresh, useLongPress } from '../useGesture';

describe('useGesture', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  describe('useSwipe', () => {
    it('应该检测到左滑手势', async () => {
      const onSwipeLeft = vi.fn();
      const elementRef = ref(element);

      const { initSwipeListeners, cleanupSwipeListeners } = useSwipe(elementRef, {
        onSwipeLeft,
        threshold: 50
      });

      // 手动初始化（因为没有挂载组件）
      initSwipeListeners();

      // 模拟触摸事件
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchStart);

      await nextTick();

      // 模拟左滑（向左移动100px）
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchEnd);

      await nextTick();

      expect(onSwipeLeft).toHaveBeenCalled();

      cleanupSwipeListeners();
    });

    it('应该检测到右滑手势', async () => {
      const onSwipeRight = vi.fn();
      const elementRef = ref(element);

      const { initSwipeListeners, cleanupSwipeListeners } = useSwipe(elementRef, {
        onSwipeRight,
        threshold: 50
      });

      initSwipeListeners();

      // 模拟触摸开始
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchStart);

      await nextTick();

      // 模拟右滑（向右移动100px）
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchEnd);

      await nextTick();

      expect(onSwipeRight).toHaveBeenCalled();

      cleanupSwipeListeners();
    });

    it('应该检测到上滑手势', async () => {
      const onSwipeUp = vi.fn();
      const elementRef = ref(element);

      const { initSwipeListeners, cleanupSwipeListeners } = useSwipe(elementRef, {
        onSwipeUp,
        threshold: 50
      });

      initSwipeListeners();

      // 模拟触摸开始
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      });
      element.dispatchEvent(touchStart);

      await nextTick();

      // 模拟上滑（向上移动100px）
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchEnd);

      await nextTick();

      expect(onSwipeUp).toHaveBeenCalled();

      cleanupSwipeListeners();
    });

    it('应该检测到下滑手势', async () => {
      const onSwipeDown = vi.fn();
      const elementRef = ref(element);

      const { initSwipeListeners, cleanupSwipeListeners } = useSwipe(elementRef, {
        onSwipeDown,
        threshold: 50
      });

      initSwipeListeners();

      // 模拟触摸开始
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchStart);

      await nextTick();

      // 模拟下滑（向下移动100px）
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 200 } as Touch]
      });
      element.dispatchEvent(touchEnd);

      await nextTick();

      expect(onSwipeDown).toHaveBeenCalled();

      cleanupSwipeListeners();
    });

    it('当滑动距离小于阈值时不应触发回调', async () => {
      const onSwipeLeft = vi.fn();
      const elementRef = ref(element);

      const { initSwipeListeners, cleanupSwipeListeners } = useSwipe(elementRef, {
        onSwipeLeft,
        threshold: 50
      });

      initSwipeListeners();

      // 模拟触摸开始
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchStart);

      await nextTick();

      // 模拟小距离滑动（只移动30px，小于阈值50px）
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 70, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchEnd);

      await nextTick();

      expect(onSwipeLeft).not.toHaveBeenCalled();

      cleanupSwipeListeners();
    });
  });

  describe('usePullToRefresh', () => {
    it('应该在下拉超过阈值时触发刷新', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const elementRef = ref(element);
      element.scrollTop = 0;

      const {
        isPulling,
        isRefreshing,
        pullDistance,
        initPullToRefreshListeners,
        cleanupPullToRefreshListeners
      } = usePullToRefresh(elementRef, {
        onRefresh,
        threshold: 60
      });

      initPullToRefreshListeners();

      // 模拟触摸开始
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchStart);

      await nextTick();
      expect(isPulling.value).toBe(true);

      // 模拟下拉移动（需要移动足够的距离，考虑阻尼效果0.5）
      // 要达到60px的pullDistance，需要移动120px以上
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 250 } as Touch]
      });
      element.dispatchEvent(touchMove);

      await nextTick();
      expect(pullDistance.value).toBeGreaterThan(0);

      // 模拟触摸结束
      const touchEnd = new TouchEvent('touchend', {});
      element.dispatchEvent(touchEnd);

      await nextTick();
      expect(onRefresh).toHaveBeenCalled();

      // 等待刷新完成
      await vi.waitFor(() => {
        expect(isRefreshing.value).toBe(false);
      });

      cleanupPullToRefreshListeners();
    });

    it('当下拉距离小于阈值时不应触发刷新', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const elementRef = ref(element);
      element.scrollTop = 0;

      const { initPullToRefreshListeners, cleanupPullToRefreshListeners } = usePullToRefresh(
        elementRef,
        {
          onRefresh,
          threshold: 60
        }
      );

      initPullToRefreshListeners();

      // 模拟触摸开始
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchStart);

      await nextTick();

      // 模拟小距离下拉（只移动40px，小于阈值60px）
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 140 } as Touch]
      });
      element.dispatchEvent(touchMove);

      await nextTick();

      // 模拟触摸结束
      const touchEnd = new TouchEvent('touchend', {});
      element.dispatchEvent(touchEnd);

      await nextTick();
      expect(onRefresh).not.toHaveBeenCalled();

      cleanupPullToRefreshListeners();
    });
  });

  describe('useLongPress', () => {
    it('应该在长按后触发回调', async () => {
      vi.useFakeTimers();

      const onLongPress = vi.fn();
      const elementRef = ref(element);

      const { isLongPressing, initLongPressListeners, cleanupLongPressListeners } = useLongPress(
        elementRef,
        {
          onLongPress,
          delay: 500
        }
      );

      initLongPressListeners();

      // 模拟触摸开始
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchStart);

      await nextTick();
      expect(isLongPressing.value).toBe(false);

      // 快进时间到500ms
      vi.advanceTimersByTime(500);
      await nextTick();

      expect(onLongPress).toHaveBeenCalled();
      expect(isLongPressing.value).toBe(true);

      // 模拟触摸结束
      const touchEnd = new TouchEvent('touchend', {});
      element.dispatchEvent(touchEnd);

      await nextTick();
      expect(isLongPressing.value).toBe(false);

      cleanupLongPressListeners();
      vi.useRealTimers();
    });

    it('当移动超过阈值时应取消长按', async () => {
      vi.useFakeTimers();

      const onLongPress = vi.fn();
      const elementRef = ref(element);

      const { initLongPressListeners, cleanupLongPressListeners } = useLongPress(elementRef, {
        onLongPress,
        delay: 500
      });

      initLongPressListeners();

      // 模拟触摸开始
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchStart);

      await nextTick();

      // 模拟移动（移动超过10px）
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 120, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchMove);

      await nextTick();

      // 快进时间到500ms
      vi.advanceTimersByTime(500);
      await nextTick();

      // 长按不应触发
      expect(onLongPress).not.toHaveBeenCalled();

      cleanupLongPressListeners();
      vi.useRealTimers();
    });

    it('当提前结束触摸时应取消长按', async () => {
      vi.useFakeTimers();

      const onLongPress = vi.fn();
      const elementRef = ref(element);

      const { initLongPressListeners, cleanupLongPressListeners } = useLongPress(elementRef, {
        onLongPress,
        delay: 500
      });

      initLongPressListeners();

      // 模拟触摸开始
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      element.dispatchEvent(touchStart);

      await nextTick();

      // 快进时间到300ms（小于500ms）
      vi.advanceTimersByTime(300);
      await nextTick();

      // 模拟触摸结束
      const touchEnd = new TouchEvent('touchend', {});
      element.dispatchEvent(touchEnd);

      await nextTick();

      // 再快进时间到500ms
      vi.advanceTimersByTime(200);
      await nextTick();

      // 长按不应触发
      expect(onLongPress).not.toHaveBeenCalled();

      cleanupLongPressListeners();
      vi.useRealTimers();
    });
  });
});
