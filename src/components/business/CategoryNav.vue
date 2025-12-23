<!--
  分类导航组件
  功能：
  - 横向滚动分类列表（展示一级分类）
  - 当前选中分类高亮
  - 点击切换分类（更新路由参数）
  - 支持二级分类展开（悬浮或点击展开子分类）
  - 显示分类图标、名称、资源数量
  - 热门分类显示"热门"标签
  - 移动端支持左右滑动
  - 从configStore获取分类数据
-->

<template>
  <div class="category-nav">
    <!-- 分类滚动容器 -->
    <div
      ref="scrollContainer"
      class="category-scroll-container"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <div class="category-list">
        <!-- 全部分类 -->
        <div
          class="category-item"
          :class="{ active: !currentCategoryId }"
          @click="handleCategoryClick(null)"
        >
          <div class="category-content">
            <el-icon class="category-icon">
              <Grid />
            </el-icon>
            <span class="category-name">全部</span>
          </div>
        </div>

        <!-- 一级分类列表 -->
        <div
          v-for="category in primaryCategories"
          :key="category.categoryId"
          class="category-item"
          :class="{
            active: currentCategoryId === category.categoryId,
            'has-children': hasSubCategories(category.categoryId)
          }"
          @click="handleCategoryClick(category.categoryId)"
          @mouseenter="handleCategoryHover(category.categoryId)"
          @mouseleave="handleCategoryLeave"
        >
          <div class="category-content">
            <!-- 分类图标 -->
            <img
              v-if="category.icon && category.icon.startsWith('/')"
              :src="category.icon"
              :alt="category.categoryName"
              class="category-icon-img"
              @error="handleIconError"
            >
            <el-icon
              v-else
              class="category-icon"
            >
              <Folder />
            </el-icon>

            <!-- 分类名称 -->
            <span class="category-name">{{ category.categoryName }}</span>

            <!-- 资源数量 -->
            <span class="category-count">({{ category.resourceCount }})</span>

            <!-- 热门标签 -->
            <span
              v-if="category.isHot"
              class="hot-badge"
            >热门</span>

            <!-- 二级分类指示器 -->
            <el-icon
              v-if="hasSubCategories(category.categoryId)"
              class="expand-icon"
            >
              <ArrowDown />
            </el-icon>
          </div>

          <!-- 二级分类下拉菜单 -->
          <transition name="dropdown">
            <div
              v-if="
                hoveredCategoryId === category.categoryId && hasSubCategories(category.categoryId)
              "
              class="sub-category-dropdown"
              @click.stop
            >
              <div
                v-for="subCategory in getSubCategories(category.categoryId)"
                :key="subCategory.categoryId"
                class="sub-category-item"
                :class="{ active: currentCategoryId === subCategory.categoryId }"
                @click="handleCategoryClick(subCategory.categoryId)"
              >
                <span class="sub-category-name">{{ subCategory.categoryName }}</span>
                <span class="sub-category-count">({{ subCategory.resourceCount }})</span>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- 左右滚动按钮（桌面端） -->
    <div
      v-if="showScrollButtons"
      class="scroll-buttons"
    >
      <button
        class="scroll-button scroll-left"
        :disabled="!canScrollLeft"
        @click="scrollLeft"
      >
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <button
        class="scroll-button scroll-right"
        :disabled="!canScrollRight"
        @click="scrollRight"
      >
        <el-icon><ArrowRight /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useConfigStore } from '@/pinia/configStore';
import { Grid, Folder, ArrowDown, ArrowLeft, ArrowRight } from '@element-plus/icons-vue';

// ========== Props ==========
interface Props {
  // 是否显示滚动按钮（桌面端）
  showScrollButtons?: boolean;
}

withDefaults(defineProps<Props>(), {
  showScrollButtons: true
});

// ========== Emits ==========
const emit = defineEmits<{
  categoryChange: [categoryId: string | null];
}>();

// ========== Composables ==========
const router = useRouter();
const route = useRoute();
const configStore = useConfigStore();

// ========== 状态 ==========
const scrollContainer = ref<HTMLElement | null>(null);
const hoveredCategoryId = ref<string | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

// 拖拽滚动状态
const isDragging = ref(false);
const startX = ref(0);
const scrollLeftStart = ref(0);

// ========== 计算属性 ==========

/**
 * 当前选中的分类ID（从路由参数获取）
 */
const currentCategoryId = computed(() => {
  return (route.query.categoryId as string) || null;
});

/**
 * 一级分类列表
 */
const primaryCategories = computed(() => {
  return configStore.primaryCategories;
});

/**
 * 获取子分类
 */
const getSubCategories = (parentId: string) => {
  return configStore.getSubCategories(parentId);
};

/**
 * 判断是否有子分类
 */
const hasSubCategories = (categoryId: string) => {
  return getSubCategories(categoryId).length > 0;
};

// ========== 方法 ==========

/**
 * 处理分类点击
 */
function handleCategoryClick(categoryId: string | null) {
  // 判断当前是否在资源列表页
  const isResourceListPage = route.path === '/resource' || route.name === 'ResourceList';

  if (isResourceListPage) {
    // 在资源列表页：更新当前页面的路由参数
    router.push({
      path: route.path,
      query: {
        ...route.query,
        categoryId: categoryId || undefined,
        pageNum: '1' // 重置页码
      }
    });
  } else {
    // 在其他页面（如首页）：触发事件，由父组件处理跳转
    emit('categoryChange', categoryId);
  }

  // 关闭下拉菜单
  hoveredCategoryId.value = null;
}

/**
 * 处理图标加载失败
 */
function handleIconError(event: Event) {
  const img = event.target as HTMLImageElement;
  // 隐藏加载失败的图标
  img.style.display = 'none';
}

/**
 * 处理分类悬浮（桌面端）
 */
function handleCategoryHover(categoryId: string) {
  // 仅在桌面端显示下拉菜单
  if (window.innerWidth >= 768) {
    hoveredCategoryId.value = categoryId;
  }
}

/**
 * 处理分类离开
 */
function handleCategoryLeave() {
  // 延迟关闭，允许鼠标移动到下拉菜单
  setTimeout(() => {
    hoveredCategoryId.value = null;
  }, 200);
}

/**
 * 检查滚动状态
 */
function checkScrollStatus() {
  if (!scrollContainer.value) return;

  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;
  canScrollLeft.value = scrollLeft > 0;
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1;
}

/**
 * 向左滚动
 */
function scrollLeft() {
  if (!scrollContainer.value) return;
  scrollContainer.value.scrollBy({
    left: -200,
    behavior: 'smooth'
  });
}

/**
 * 向右滚动
 */
function scrollRight() {
  if (!scrollContainer.value) return;
  scrollContainer.value.scrollBy({
    left: 200,
    behavior: 'smooth'
  });
}

/**
 * 鼠标拖拽滚动 - 开始
 */
function handleMouseDown(e: MouseEvent) {
  if (!scrollContainer.value) return;

  isDragging.value = true;
  startX.value = e.pageX - scrollContainer.value.offsetLeft;
  scrollLeftStart.value = scrollContainer.value.scrollLeft;
  scrollContainer.value.style.cursor = 'grabbing';
}

/**
 * 鼠标拖拽滚动 - 移动
 */
function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || !scrollContainer.value) return;

  e.preventDefault();
  const x = e.pageX - scrollContainer.value.offsetLeft;
  const walk = (x - startX.value) * 2; // 滚动速度
  scrollContainer.value.scrollLeft = scrollLeftStart.value - walk;
}

/**
 * 鼠标拖拽滚动 - 结束
 */
function handleMouseUp() {
  isDragging.value = false;
  if (scrollContainer.value) {
    scrollContainer.value.style.cursor = 'grab';
  }
}

/**
 * 触摸滚动 - 开始
 */
function handleTouchStart(e: TouchEvent) {
  if (!scrollContainer.value) return;

  startX.value = e.touches[0].pageX - scrollContainer.value.offsetLeft;
  scrollLeftStart.value = scrollContainer.value.scrollLeft;
}

/**
 * 触摸滚动 - 移动
 */
function handleTouchMove(e: TouchEvent) {
  if (!scrollContainer.value) return;

  const x = e.touches[0].pageX - scrollContainer.value.offsetLeft;
  const walk = (x - startX.value) * 2;
  scrollContainer.value.scrollLeft = scrollLeftStart.value - walk;
}

/**
 * 触摸滚动 - 结束
 */
function handleTouchEnd() {
  // 触摸结束，无需特殊处理
}

// ========== 生命周期 ==========

onMounted(() => {
  // 监听滚动事件
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', checkScrollStatus);
    checkScrollStatus();
  }

  // 监听窗口大小变化
  window.addEventListener('resize', checkScrollStatus);

  // 加载分类数据（如果还没有加载）
  if (configStore.categories.length === 0) {
    configStore.fetchCategories();
  }
});

onUnmounted(() => {
  // 移除事件监听
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', checkScrollStatus);
  }
  window.removeEventListener('resize', checkScrollStatus);
});

// 监听分类数据变化，重新检查滚动状态
watch(
  () => configStore.categories,
  () => {
    setTimeout(checkScrollStatus, 100);
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.category-nav {
  position: relative;
  width: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.category-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  cursor: grab;
  user-select: none;

  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }

  &:active {
    cursor: grabbing;
  }
}

.category-list {
  display: flex;
  gap: 8px;
  padding: 16px;
  min-width: min-content;
}

.category-item {
  position: relative;
  flex-shrink: 0;
  padding: 10px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #e8f4ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(22, 93, 255, 0.15);
  }

  &.active {
    background: linear-gradient(135deg, #165dff 0%, #4080ff 100%);
    color: #fff;
    box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);

    .category-name,
    .category-count {
      color: #fff;
    }

    .category-icon {
      color: #fff;
    }

    .hot-badge {
      background: rgba(255, 255, 255, 0.3);
      color: #fff;
    }
  }

  &.has-children {
    padding-right: 32px;
  }
}

.category-content {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.category-icon {
  font-size: 18px;
  color: #165dff;

  .active & {
    color: #fff;
  }
}

.category-icon-img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.category-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;

  .active & {
    color: #fff;
  }
}

.category-count {
  font-size: 12px;
  color: #909399;

  .active & {
    color: rgba(255, 255, 255, 0.8);
  }
}

.hot-badge {
  padding: 2px 6px;
  background: linear-gradient(135deg, #ff7d00 0%, #ffa940 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 3px;
  margin-left: 4px;
}

.expand-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #909399;
  transition: transform 0.3s ease;

  .active & {
    color: #fff;
  }

  .category-item:hover & {
    transform: translateY(-50%) rotate(180deg);
  }
}

/* 二级分类下拉菜单 */
.sub-category-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 8px;
  z-index: 1000;

  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 20px;
    width: 12px;
    height: 12px;
    background: #fff;
    transform: rotate(45deg);
    box-shadow: -2px -2px 4px rgba(0, 0, 0, 0.06);
  }
}

.sub-category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f7fa;
  }

  &.active {
    background: #e8f4ff;

    .sub-category-name {
      color: #165dff;
      font-weight: 600;
    }
  }
}

.sub-category-name {
  font-size: 14px;
  color: #303133;
}

.sub-category-count {
  font-size: 12px;
  color: #909399;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 滚动按钮 */
.scroll-buttons {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  padding: 0 8px;
}

.scroll-button {
  width: 32px;
  height: 32px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover:not(:disabled) {
    background: #165dff;
    border-color: #165dff;
    color: #fff;
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .el-icon {
    font-size: 16px;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .category-list {
    gap: 6px;
    padding: 12px;
  }

  .category-item {
    padding: 8px 12px;
  }

  .category-name {
    font-size: 13px;
  }

  .category-count {
    font-size: 11px;
  }

  .scroll-buttons {
    display: none;
  }

  /* 移动端不显示二级分类下拉 */
  .sub-category-dropdown {
    display: none;
  }
}

/* 平板适配 */
@media (min-width: 768px) and (max-width: 1200px) {
  .category-list {
    gap: 6px;
    padding: 14px;
  }

  .category-item {
    padding: 9px 14px;
  }
}
</style>
