<!--
  CategoryNav 组件演示
  展示分类导航组件的各种使用场景
-->

<template>
  <div class="category-nav-demo">
    <h1>CategoryNav 分类导航组件演示</h1>

    <!-- 基础使用 -->
    <section class="demo-section">
      <h2>基础使用</h2>
      <p>展示分类导航，支持点击切换分类</p>
      <div class="demo-container">
        <CategoryNav @category-change="handleCategoryChange" />
      </div>
      <div class="demo-info">
        <p>
          当前选中分类ID: <strong>{{ selectedCategoryId || '全部' }}</strong>
        </p>
        <p>
          当前选中分类名称: <strong>{{ selectedCategoryName || '全部' }}</strong>
        </p>
      </div>
    </section>

    <!-- 隐藏滚动按钮 -->
    <section class="demo-section">
      <h2>隐藏滚动按钮</h2>
      <p>移动端风格，不显示左右滚动按钮</p>
      <div class="demo-container">
        <CategoryNav :show-scroll-buttons="false" />
      </div>
    </section>

    <!-- 分类数据展示 -->
    <section class="demo-section">
      <h2>分类数据</h2>
      <div class="category-data">
        <div class="data-card">
          <h3>一级分类数量</h3>
          <p class="data-value">
            {{ primaryCategories.length }}
          </p>
        </div>
        <div class="data-card">
          <h3>总分类数量</h3>
          <p class="data-value">
            {{ allCategories.length }}
          </p>
        </div>
        <div class="data-card">
          <h3>热门分类数量</h3>
          <p class="data-value">
            {{ hotCategories.length }}
          </p>
        </div>
        <div class="data-card">
          <h3>推荐分类数量</h3>
          <p class="data-value">
            {{ recommendedCategories.length }}
          </p>
        </div>
      </div>
    </section>

    <!-- 分类列表 -->
    <section class="demo-section">
      <h2>分类列表详情</h2>
      <el-table
        :data="primaryCategories"
        border
        style="width: 100%"
      >
        <el-table-column
          prop="categoryName"
          label="分类名称"
          width="150"
        />
        <el-table-column
          prop="categoryId"
          label="分类ID"
          width="200"
        />
        <el-table-column
          prop="resourceCount"
          label="资源数量"
          width="100"
        />
        <el-table-column
          label="是否热门"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.isHot"
              type="danger"
              size="small"
            >
              热门
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          label="是否推荐"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.isRecommend"
              type="success"
              size="small"
            >
              推荐
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          label="子分类"
          width="100"
        >
          <template #default="{ row }">
            {{ getSubCategoriesCount(row.categoryId) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="sort"
          label="排序"
          width="80"
        />
      </el-table>
    </section>

    <!-- 操作按钮 -->
    <section class="demo-section">
      <h2>操作</h2>
      <div class="demo-actions">
        <el-button
          type="primary"
          @click="refreshCategories"
        >
          刷新分类数据
        </el-button>
        <el-button @click="clearCache">
          清除缓存
        </el-button>
        <el-button @click="resetSelection">
          重置选择
        </el-button>
      </div>
    </section>

    <!-- 加载状态 -->
    <section
      v-if="loading"
      class="demo-section"
    >
      <el-alert
        type="info"
        :closable="false"
      >
        <template #title>
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
          正在加载分类数据...
        </template>
      </el-alert>
    </section>

    <!-- 错误提示 -->
    <section
      v-if="error"
      class="demo-section"
    >
      <el-alert
        type="error"
        :closable="false"
      >
        <template #title>
          加载失败: {{ error }}
        </template>
      </el-alert>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useConfigStore } from '@/pinia/configStore';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import CategoryNav from './CategoryNav.vue';

// ========== Composables ==========
const router = useRouter();
const configStore = useConfigStore();

// ========== 状态 ==========
const selectedCategoryId = ref<string | null>(null);

// ========== 计算属性 ==========

const primaryCategories = computed(() => configStore.primaryCategories);
const allCategories = computed(() => configStore.categories);
const hotCategories = computed(() => configStore.hotCategories);
const recommendedCategories = computed(() => configStore.recommendedCategories);
const loading = computed(() => configStore.loading.categories);
const error = computed(() => configStore.error.categories);

const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value) return null;
  const category = configStore.getCategoryById(selectedCategoryId.value);
  return category?.categoryName || null;
});

// ========== 方法 ==========

/**
 * 处理分类切换
 */
function handleCategoryChange(categoryId: string | null) {
  selectedCategoryId.value = categoryId;
  ElMessage.success(`切换到分类: ${selectedCategoryName.value || '全部'}`);
}

/**
 * 获取子分类数量
 */
function getSubCategoriesCount(categoryId: string): number {
  return configStore.getSubCategories(categoryId).length;
}

/**
 * 刷新分类数据
 */
async function refreshCategories() {
  try {
    await configStore.fetchCategories(true);
    ElMessage.success('分类数据已刷新');
  } catch (e) {
    ElMessage.error('刷新失败');
  }
}

/**
 * 清除缓存
 */
function clearCache() {
  configStore.clearCache('CATEGORIES');
  ElMessage.success('缓存已清除');
}

/**
 * 重置选择
 */
function resetSelection() {
  selectedCategoryId.value = null;
  router.push({ query: {} });
  ElMessage.info('已重置选择');
}

// ========== 生命周期 ==========

onMounted(async () => {
  // 加载分类数据
  if (configStore.categories.length === 0) {
    await configStore.fetchCategories();
  }
});
</script>

<style scoped lang="scss">
.category-nav-demo {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 32px;
  }
}

.demo-section {
  margin-bottom: 48px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #606266;
    margin-bottom: 16px;
  }
}

.demo-container {
  background: #f5f7fa;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.demo-info {
  padding: 16px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;

  p {
    margin: 8px 0;
    font-size: 14px;
    color: #606266;

    strong {
      color: #165dff;
      font-weight: 600;
    }
  }
}

.category-data {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.data-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  border-radius: 12px;
  color: #fff;
  text-align: center;

  &:nth-child(2) {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &:nth-child(3) {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &:nth-child(4) {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }

  h3 {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 12px;
    opacity: 0.9;
  }

  .data-value {
    font-size: 32px;
    font-weight: 700;
    margin: 0;
  }
}

.demo-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .category-nav-demo {
    padding: 16px;

    h1 {
      font-size: 24px;
      margin-bottom: 24px;
    }
  }

  .demo-section {
    margin-bottom: 32px;

    h2 {
      font-size: 18px;
    }
  }

  .demo-container {
    padding: 16px;
  }

  .category-data {
    grid-template-columns: repeat(2, 1fr);
  }

  .data-card {
    padding: 16px;

    .data-value {
      font-size: 24px;
    }
  }
}
</style>
