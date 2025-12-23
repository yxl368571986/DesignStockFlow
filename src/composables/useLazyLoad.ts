/**
 * 图片懒加载 Composable
 *
 * 功能：
 * - 使用Intersection Observer API实现图片懒加载
 * - 支持自定义占位图
 * - 支持加载失败处理
 * - 优化移动端性能
 *
 * 需求: 需求15.3（移动端性能优化）
 */

import { ref, onMounted, onUnmounted, Ref } from 'vue';

/**
 * 懒加载配置选项
 */
export interface LazyLoadOptions {
  /** 根元素，默认为viewport */
  root?: Element | null;
  /** 根元素的边距 */
  rootMargin?: string;
  /** 触发加载的阈值 */
  threshold?: number;
  /** 占位图URL */
  placeholder?: string;
  /** 加载失败时的图片URL */
  errorImage?: string;
}

/**
 * 图片懒加载 Composable
 */
export function useLazyLoad(options: LazyLoadOptions = {}) {
  const { root = null, rootMargin = '50px', threshold = 0.01, errorImage = '' } = options;

  // 观察器实例
  let observer: IntersectionObserver | null = null;

  // 已加载的图片集合
  const loadedImages = new Set<Element>();

  /**
   * 创建观察器
   */
  function createObserver(): IntersectionObserver {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当元素进入视口时
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            loadImage(img);
            // 停止观察已加载的图片
            observer?.unobserve(img);
          }
        });
      },
      {
        root,
        rootMargin,
        threshold
      }
    );
  }

  /**
   * 加载图片
   */
  function loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (!src || loadedImages.has(img)) {
      return;
    }

    // 创建新的Image对象预加载
    const image = new Image();

    image.onload = () => {
      img.src = src;
      img.classList.add('lazy-loaded');
      img.classList.remove('lazy-loading');
      loadedImages.add(img);
    };

    image.onerror = () => {
      if (errorImage) {
        img.src = errorImage;
      }
      img.classList.add('lazy-error');
      img.classList.remove('lazy-loading');
    };

    img.classList.add('lazy-loading');
    image.src = src;
  }

  /**
   * 观察元素
   */
  function observe(el: Element): void {
    if (!observer) {
      observer = createObserver();
    }
    observer.observe(el);
  }

  /**
   * 取消观察元素
   */
  function unobserve(el: Element): void {
    observer?.unobserve(el);
  }

  /**
   * 销毁观察器
   */
  function destroy(): void {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    loadedImages.clear();
  }

  return {
    observe,
    unobserve,
    destroy
  };
}

/**
 * 图片懒加载指令
 */
export function createLazyLoadDirective(options: LazyLoadOptions = {}) {
  const { observe, unobserve } = useLazyLoad(options);

  return {
    mounted(el: HTMLImageElement, binding: { value: string }) {
      // 设置占位图
      if (options.placeholder) {
        el.src = options.placeholder;
      }

      // 将真实图片URL存储在data-src中
      el.dataset.src = binding.value;

      // 添加懒加载类名
      el.classList.add('lazy-image');

      // 开始观察
      observe(el);
    },

    updated(el: HTMLImageElement, binding: { value: string }) {
      // 如果图片URL变化，更新data-src
      if (el.dataset.src !== binding.value) {
        el.dataset.src = binding.value;
      }
    },

    unmounted(el: HTMLImageElement) {
      // 取消观察
      unobserve(el);
    }
  };
}

/**
 * 批量懒加载图片
 */
export function useBatchLazyLoad(
  containerRef: Ref<HTMLElement | null>,
  options: LazyLoadOptions = {}
) {
  const { observe, destroy } = useLazyLoad(options);
  const isInitialized = ref(false);

  /**
   * 初始化懒加载
   */
  function init(): void {
    if (!containerRef.value || isInitialized.value) {
      return;
    }

    // 查找所有需要懒加载的图片
    const images = containerRef.value.querySelectorAll('img[data-src]');
    images.forEach((img) => {
      observe(img);
    });

    isInitialized.value = true;
  }

  /**
   * 重新初始化（用于动态内容）
   */
  function refresh(): void {
    if (!containerRef.value) {
      return;
    }

    // 查找新添加的图片
    const images = containerRef.value.querySelectorAll('img[data-src]:not(.lazy-image)');
    images.forEach((img) => {
      (img as HTMLImageElement).classList.add('lazy-image');
      observe(img);
    });
  }

  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    destroy();
  });

  return {
    init,
    refresh,
    isInitialized
  };
}
