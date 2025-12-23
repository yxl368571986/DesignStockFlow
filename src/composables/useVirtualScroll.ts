/**
 * 虚拟滚动 Composable
 *
 * 功能：
 * - 使用@tanstack/vue-virtual实现虚拟滚动
 * - 优化长列表渲染性能
 * - 支持动态高度
 * - 支持水平和垂直滚动
 *
 * 需求: 需求15.3（移动端性能优化）
 */

import { ref, computed, watch, Ref } from 'vue';
import { useVirtualizer } from '@tanstack/vue-virtual';

/**
 * 虚拟滚动配置选项
 */
export interface VirtualScrollOptions {
  /** 列表项数量 */
  count: number;
  /** 预估项高度 */
  estimateSize?: number;
  /** 超出视口的项数 */
  overscan?: number;
  /** 是否水平滚动 */
  horizontal?: boolean;
  /** 获取项的key */
  getItemKey?: (index: number) => string | number;
}

/**
 * 虚拟滚动 Composable
 */
export function useVirtualScroll<T = any>(
  items: Ref<T[]>,
  containerRef: Ref<HTMLElement | null>,
  options: Partial<VirtualScrollOptions> = {}
) {
  const { estimateSize = 200, overscan = 5, horizontal = false, getItemKey } = options;

  // 虚拟化器实例
  const virtualizer = useVirtualizer(
    computed(() => ({
      count: items.value.length,
      getScrollElement: () => containerRef.value,
      estimateSize: () => estimateSize,
      overscan,
      horizontal,
      getItemKey: getItemKey ? (index: number) => getItemKey(index) : undefined
    }))
  );

  // 虚拟项列表
  const virtualItems = computed(() => virtualizer.value.getVirtualItems());

  // 总大小
  const totalSize = computed(() => virtualizer.value.getTotalSize());

  // 滚动到指定索引
  function scrollToIndex(
    index: number,
    options?: { align?: 'start' | 'center' | 'end' | 'auto' }
  ): void {
    virtualizer.value.scrollToIndex(index, options as any);
  }

  // 滚动到偏移量
  function scrollToOffset(
    offset: number,
    options?: { align?: 'start' | 'center' | 'end' | 'auto' }
  ): void {
    virtualizer.value.scrollToOffset(offset, options as any);
  }

  // 测量元素
  function measureElement(el: Element | null): void {
    if (el) {
      virtualizer.value.measureElement(el);
    }
  }

  return {
    virtualItems,
    totalSize,
    scrollToIndex,
    scrollToOffset,
    measureElement,
    virtualizer
  };
}

/**
 * 网格虚拟滚动 Composable
 * 用于资源卡片网格等场景
 */
export function useVirtualGrid<T = any>(
  items: Ref<T[]>,
  containerRef: Ref<HTMLElement | null>,
  options: {
    columns: number;
    rowHeight: number;
    gap?: number;
    overscan?: number;
  }
) {
  const { columns, rowHeight, gap = 0, overscan = 2 } = options;

  // 计算行数
  const rowCount = computed(() => Math.ceil(items.value.length / columns));

  // 虚拟化器
  const virtualizer = useVirtualizer(
    computed(() => ({
      count: rowCount.value,
      getScrollElement: () => containerRef.value,
      estimateSize: () => rowHeight + gap,
      overscan
    }))
  );

  // 虚拟行
  const virtualRows = computed(() => virtualizer.value.getVirtualItems());

  // 获取行中的项
  function getRowItems(rowIndex: number): T[] {
    const startIndex = rowIndex * columns;
    const endIndex = Math.min(startIndex + columns, items.value.length);
    return items.value.slice(startIndex, endIndex);
  }

  // 总高度
  const totalHeight = computed(() => virtualizer.value.getTotalSize());

  return {
    virtualRows,
    totalHeight,
    getRowItems,
    columns
  };
}

/**
 * 无限滚动 Composable
 * 结合虚拟滚动实现无限加载
 */
export function useInfiniteVirtualScroll<T = any>(
  items: Ref<T[]>,
  containerRef: Ref<HTMLElement | null>,
  loadMore: () => Promise<void>,
  options: Partial<VirtualScrollOptions> & {
    threshold?: number;
    hasMore?: Ref<boolean>;
  } = {}
) {
  const { threshold = 200, hasMore = ref(true), ...virtualOptions } = options;

  const loading = ref(false);

  // 虚拟滚动
  const virtualScroll = useVirtualScroll(items, containerRef, virtualOptions);

  // 监听滚动位置
  watch(
    () => containerRef.value?.scrollTop,
    async (scrollTop) => {
      if (!containerRef.value || loading.value || !hasMore.value) {
        return;
      }

      const { scrollHeight, clientHeight } = containerRef.value;
      const distanceToBottom = scrollHeight - (scrollTop || 0) - clientHeight;

      // 接近底部时加载更多
      if (distanceToBottom < threshold) {
        loading.value = true;
        try {
          await loadMore();
        } finally {
          loading.value = false;
        }
      }
    }
  );

  return {
    ...virtualScroll,
    loading,
    hasMore
  };
}
