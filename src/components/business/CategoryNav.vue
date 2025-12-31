<script setup lang="ts">
/**
 * 分类导航组件
 * 功能：
 * - 垂直列表展示分类（左侧边栏）
 * - 当前选中分类高亮
 * - 点击切换分类（更新路由参数）
 * - 支持二级分类展开（点击展开子分类）
 * - 显示分类图标、名称、资源数量
 * - 热门分类单独显示
 * - 从configStore获取分类数据
 */
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useConfigStore } from '@/pinia/configStore';
import { Grid, Folder, ArrowDown } from '@element-plus/icons-vue';

// ========== Emits ==========
const emit = defineEmits<{
  categoryChange: [categoryId: string | null];
}>();

// ========== Composables ==========
const router = useRouter();
const route = useRoute();
const configStore = useConfigStore();

// ========== 状态 ==========
const expandedCategories = ref<string[]>([]); // 展开的分类ID列表

// ========== 计算属性 ==========

/**
 * 当前选中的分类ID（从路由参数获取）
 */
const currentCategoryId = computed(() => {
  return (route.query.categoryId as string) || null;
});

/**
 * 热门分类列表
 */
const hotCategories = computed(() => {
  return configStore.hotCategories;
});

/**
 * 全部分类列表(非热门)
 */
const allCategories = computed(() => {
  return configStore.primaryCategories.filter(cat => !cat.isHot);
});

// ========== 方法 ==========

/**
 * 获取子分类
 */
function getSubCategories(parentId: string) {
  const result = configStore.getSubCategories(parentId);
  console.log('getSubCategories called for:', parentId, 'result:', result);
  return result;
}

/**
 * 判断是否有子分类
 */
function hasSubCategories(categoryId: string) {
  const subs = getSubCategories(categoryId);
  const hasSubs = subs.length > 0;
  console.log('hasSubCategories for', categoryId, ':', hasSubs, 'subs:', subs);
  return hasSubs;
}

/**
 * 处理分类点击
 */
function handleCategoryClick(categoryId: string | null, isSubCategory: boolean = false) {
  // 判断当前是否在资源列表页
  const isResourceListPage = route.path === '/resource' || route.name === 'ResourceList';

  // 如果是一级分类且有子分类
  if (!isSubCategory && categoryId && hasSubCategories(categoryId)) {
    // 如果当前已经选中这个分类，则只切换展开/收起状态，不重新跳转
    if (currentCategoryId.value === categoryId) {
      toggleCategoryExpand(categoryId);
      return;
    }
    
    // 如果未选中，则展开子分类（但继续执行跳转逻辑）
    if (!isCategoryExpanded(categoryId)) {
      expandedCategories.value.push(categoryId);
    }
    // 注意：这里不return，继续执行下面的跳转逻辑
  }

  // 跳转到分类筛选
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
}

/**
 * 切换分类展开/收起
 */
function toggleCategoryExpand(categoryId: string) {
  const index = expandedCategories.value.indexOf(categoryId);
  if (index > -1) {
    // 已展开,收起
    expandedCategories.value.splice(index, 1);
  } else {
    // 未展开,展开
    expandedCategories.value.push(categoryId);
  }
}

/**
 * 判断分类是否展开
 */
function isCategoryExpanded(categoryId: string) {
  return expandedCategories.value.includes(categoryId);
}

/**
 * 处理图标加载失败
 */
function handleIconError(event: Event) {
  const img = event.target as HTMLImageElement;
  // 隐藏加载失败的图标
  img.style.display = 'none';
}

// ========== 生命周期 ==========

onMounted(() => {
  // 加载分类数据（如果还没有加载）
  if (configStore.categories.length === 0) {
    configStore.fetchCategories();
  }
  
  // 调试：检查分类数据
  console.log('CategoryNav mounted, categories:', configStore.categories.length);
  const ecommerce = configStore.categories.find(c => c.categoryName === '电商类');
  console.log('电商类 category:', ecommerce);
  console.log('电商类 children:', ecommerce?.children);
  console.log('hotCategories:', configStore.hotCategories);
});
</script>

<template>
  <div class="category-nav">
    <!-- 热门分类 -->
    <div class="category-section">
      <h3 class="section-title">
        热门分类
      </h3>
      <div class="category-list-vertical">
        <div
          v-for="category in hotCategories"
          :key="category.categoryId"
          class="category-group"
        >
          <!-- 一级分类 -->
          <div
            class="category-item-vertical"
            :class="{
              active: currentCategoryId === category.categoryId,
              'has-children': hasSubCategories(category.categoryId),
              expanded: isCategoryExpanded(category.categoryId)
            }"
            @click="handleCategoryClick(category.categoryId)"
          >
            <div class="category-content-vertical">
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
              <span class="category-count">{{ category.resourceCount }}</span>

              <!-- 展开/收起图标 -->
              <el-icon
                v-if="hasSubCategories(category.categoryId)"
                class="expand-icon"
                :class="{ expanded: isCategoryExpanded(category.categoryId) }"
              >
                <ArrowDown />
              </el-icon>
            </div>
          </div>

          <!-- 二级分类列表 -->
          <transition name="sub-category-slide">
            <div
              v-if="isCategoryExpanded(category.categoryId) && hasSubCategories(category.categoryId)"
              class="sub-category-list-vertical"
            >
              <div
                v-for="subCategory in getSubCategories(category.categoryId)"
                :key="subCategory.categoryId"
                class="sub-category-item-vertical"
                :class="{ active: currentCategoryId === subCategory.categoryId }"
                @click.stop="handleCategoryClick(subCategory.categoryId, true)"
              >
                <span class="sub-category-name">{{ subCategory.categoryName }}</span>
                <span class="sub-category-count">{{ subCategory.resourceCount }}</span>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- 全部分类 -->
    <div class="category-section">
      <h3 class="section-title">
        全部分类
      </h3>
      <div class="category-list-vertical">
        <!-- 全部选项 -->
        <div
          class="category-item-vertical"
          :class="{ active: !currentCategoryId }"
          @click="handleCategoryClick(null)"
        >
          <div class="category-content-vertical">
            <el-icon class="category-icon">
              <Grid />
            </el-icon>
            <span class="category-name">全部</span>
          </div>
        </div>

        <!-- 一级分类列表 -->
        <div
          v-for="category in allCategories"
          :key="category.categoryId"
          class="category-group"
        >
          <!-- 一级分类 -->
          <div
            class="category-item-vertical"
            :class="{
              active: currentCategoryId === category.categoryId,
              'has-children': hasSubCategories(category.categoryId),
              expanded: isCategoryExpanded(category.categoryId)
            }"
            @click="handleCategoryClick(category.categoryId)"
          >
            <div class="category-content-vertical">
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
              <span class="category-count">{{ category.resourceCount }}</span>

              <!-- 展开/收起图标 -->
              <el-icon
                v-if="hasSubCategories(category.categoryId)"
                class="expand-icon"
                :class="{ expanded: isCategoryExpanded(category.categoryId) }"
              >
                <ArrowDown />
              </el-icon>
            </div>
          </div>

          <!-- 二级分类列表 -->
          <transition name="sub-category-slide">
            <div
              v-if="isCategoryExpanded(category.categoryId) && hasSubCategories(category.categoryId)"
              class="sub-category-list-vertical"
            >
              <div
                v-for="subCategory in getSubCategories(category.categoryId)"
                :key="subCategory.categoryId"
                class="sub-category-item-vertical"
                :class="{ active: currentCategoryId === subCategory.categoryId }"
                @click.stop="handleCategoryClick(subCategory.categoryId, true)"
              >
                <span class="sub-category-name">{{ subCategory.categoryName }}</span>
                <span class="sub-category-count">{{ subCategory.resourceCount }}</span>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.category-nav {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.category-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 14px 0;
  padding-left: 4px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 14px;
    background: linear-gradient(180deg, #165dff 0%, #4080ff 100%);
    border-radius: 2px;
  }
}

.category-list-vertical {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-group {
  display: flex;
  flex-direction: column;
}

.category-item-vertical {
  display: flex;
  align-items: center;
  padding: 11px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
  border: 1px solid transparent;
  position: relative;

  &:hover {
    background: #f7f9fc;
    border-color: #e8edf3;
    transform: translateX(1px);

    .category-icon {
      color: #165dff;
      transform: scale(1.05);
    }

    .expand-icon {
      color: #165dff;
    }
  }

  &.active {
    background: linear-gradient(135deg, #e8f4ff 0%, #f0f7ff 100%);
    border-color: #b3d8ff;
    box-shadow: 0 2px 12px rgba(22, 93, 255, 0.1);

    .category-name {
      color: #165dff;
      font-weight: 600;
    }

    .category-icon {
      color: #165dff;
    }

    .category-count {
      color: #165dff;
      background: rgba(22, 93, 255, 0.1);
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 500;
    }
  }

  &.has-children {
    .category-content-vertical {
      padding-right: 40px;
      position: relative;
    }
  }

  &.expanded {
    background: #fafbfc;
    border-color: #e3e8ef;
  }
}

.category-content-vertical {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.category-icon {
  font-size: 18px;
  color: #606266;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.category-icon-img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.category-name {
  font-size: 14px;
  color: #303133;
  flex: 1;
}

.category-count {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
  transition: all 0.2s ease;
}

.expand-icon {
  position: absolute;
  right: 10px;
  font-size: 14px;
  color: #909399;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.expanded {
    transform: rotate(180deg);
    color: #165dff;
  }
}

/* 二级分类列表 */
.sub-category-list-vertical {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 26px;
  margin-top: 8px;
  margin-bottom: 4px;
  position: relative;

  // 左侧连接线
  &::before {
    content: '';
    position: absolute;
    left: 12px;
    top: 0;
    bottom: 8px;
    width: 1px;
    background: linear-gradient(to bottom, #e0e0e0 0%, #e0e0e0 100%);
  }
}

.sub-category-item-vertical {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 14px;
  padding-left: 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
  border: 1px solid transparent;
  position: relative;

  // 左侧小圆点
  &::before {
    content: '';
    position: absolute;
    left: -14px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #d0d0d0;
    transition: all 0.25s ease;
  }

  &:hover {
    background: #f7f9fc;
    border-color: #e3e8ef;
    transform: translateX(2px);

    &::before {
      background: #909399;
      width: 7px;
      height: 7px;
    }

    .sub-category-name {
      color: #303133;
    }
  }

  &.active {
    background: linear-gradient(90deg, #e8f4ff 0%, #f0f7ff 100%);
    border-color: #b3d8ff;
    box-shadow: 0 2px 8px rgba(22, 93, 255, 0.08);

    &::before {
      background: #165dff;
      width: 8px;
      height: 8px;
      box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
    }

    .sub-category-name {
      color: #165dff;
      font-weight: 600;
    }

    .sub-category-count {
      color: #165dff;
      font-weight: 500;
      background: rgba(22, 93, 255, 0.1);
      padding: 2px 8px;
      border-radius: 10px;
    }
  }
}

.sub-category-name {
  font-size: 13px;
  color: #606266;
  transition: color 0.2s ease;
  flex: 1;
}

.sub-category-count {
  font-size: 12px;
  color: #909399;
  transition: all 0.2s ease;
  min-width: 20px;
  text-align: right;
}

/* 二级分类展开动画 */
.sub-category-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sub-category-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
  overflow: hidden;
}

.sub-category-slide-enter-from {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  transform: translateY(-8px);
}

.sub-category-slide-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  transform: translateY(-4px);
}

.sub-category-slide-enter-to,
.sub-category-slide-leave-from {
  max-height: 500px;
  opacity: 1;
  margin-top: 8px;
  transform: translateY(0);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .category-section {
    padding: 12px;
  }

  .section-title {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .category-item-vertical {
    padding: 8px 10px;
  }

  .category-name {
    font-size: 13px;
  }

  .category-count {
    font-size: 11px;
  }

  .sub-category-list-vertical {
    padding-left: 24px;
  }

  .sub-category-item-vertical {
    padding: 6px 10px;
  }

  .sub-category-name {
    font-size: 12px;
  }
}
</style>
