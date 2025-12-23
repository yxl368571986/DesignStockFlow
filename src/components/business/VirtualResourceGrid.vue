<!--
  虚拟滚动资源网格组件
  
  功能：
  - 使用虚拟滚动优化长列表性能
  - 支持响应式网格布局
  - 支持懒加载图片
  - 优化移动端性能
  
  需求: 需求15.3（移动端性能优化）
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useVirtualGrid } from '@/composables/useVirtualScroll';
import ResourceCard from './ResourceCard.vue';
import type { ResourceInfo } from '@/types/models';

/**
 * 虚拟资源网格组件
 */

// Props定义
interface VirtualResourceGridProps {
  /** 资源列表 */
  resources: ResourceInfo[];
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 列数（响应式） */
  columns?: number;
  /** 行高 */
  rowHeight?: number;
  /** 间距 */
  gap?: number;
}

const props = withDefaults(defineProps<VirtualResourceGridProps>(), {
  showActions: true,
  columns: 4,
  rowHeight: 320,
  gap: 20
});

// Emits定义
const emit = defineEmits<{
  click: [resourceId: string];
  download: [resourceId: string];
  collect: [resourceId: string];
}>();

// 容器引用
const containerRef = ref<HTMLElement | null>(null);

// 响应式列数
const responsiveColumns = ref(props.columns);

// 虚拟网格
const { virtualRows, totalHeight, getRowItems } = useVirtualGrid(
  computed(() => props.resources),
  containerRef,
  {
    columns: responsiveColumns.value,
    rowHeight: props.rowHeight,
    gap: props.gap,
    overscan: 2
  }
);

/**
 * 更新响应式列数
 */
function updateColumns(): void {
  if (!containerRef.value) {
    return;
  }

  const width = containerRef.value.clientWidth;

  if (width < 768) {
    // 移动端：1列
    responsiveColumns.value = 1;
  } else if (width < 1200) {
    // 平板：2-3列
    responsiveColumns.value = Math.min(3, props.columns);
  } else {
    // 桌面端：使用props指定的列数
    responsiveColumns.value = props.columns;
  }
}

/**
 * 处理窗口resize
 */
let resizeObserver: ResizeObserver | null = null;

function setupResizeObserver(): void {
  if (!containerRef.value) {
    return;
  }

  resizeObserver = new ResizeObserver(() => {
    updateColumns();
  });

  resizeObserver.observe(containerRef.value);
}

function cleanupResizeObserver(): void {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
}

// 事件处理
function handleClick(resourceId: string): void {
  emit('click', resourceId);
}

function handleDownload(resourceId: string): void {
  emit('download', resourceId);
}

function handleCollect(resourceId: string): void {
  emit('collect', resourceId);
}

// 生命周期
onMounted(() => {
  updateColumns();
  setupResizeObserver();
});

onUnmounted(() => {
  cleanupResizeObserver();
});

// 监听columns变化
watch(
  () => props.columns,
  () => {
    updateColumns();
  }
);
</script>

<template>
  <div
    ref="containerRef"
    class="virtual-resource-grid"
  >
    <div
      class="virtual-grid-inner"
      :style="{
        height: `${totalHeight}px`,
        position: 'relative'
      }"
    >
      <div
        v-for="virtualRow in virtualRows"
        :key="String(virtualRow.key)"
        class="virtual-row"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`
        }"
      >
        <div
          class="row-content"
          :style="{
            display: 'grid',
            gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
            gap: `${gap}px`,
            height: '100%'
          }"
        >
          <ResourceCard
            v-for="resource in getRowItems(virtualRow.index)"
            :key="resource.resourceId"
            :resource="resource"
            :show-actions="showActions"
            :lazy="true"
            @click="handleClick"
            @download="handleDownload"
            @collect="handleCollect"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-resource-grid {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.virtual-grid-inner {
  width: 100%;
}

.virtual-row {
  will-change: transform;
}

.row-content {
  width: 100%;
  height: 100%;
}

/* 优化滚动性能 */
.virtual-resource-grid {
  /* 使用GPU加速 */
  transform: translateZ(0);
  /* 优化滚动 */
  scroll-behavior: smooth;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .virtual-resource-grid {
    /* 移动端禁用平滑滚动，提升性能 */
    scroll-behavior: auto;
  }
}
</style>
