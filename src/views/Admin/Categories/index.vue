<!--
  分类管理页面
  
  功能：
  - 以树形结构显示分类列表
  - 添加/编辑/删除分类
  - 拖拽调整分类排序
  
  需求: 需求15
-->

<template>
  <div class="categories-page">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">分类管理</h2>
        <p class="page-desc">管理资源分类，支持二级分类，拖拽可调整排序</p>
      </div>
      <div class="header-right">
        <el-button
          v-if="sortMode"
          type="success"
          :icon="Check"
          @click="handleSaveSortOrder"
          :loading="savingSortOrder"
        >
          保存排序
        </el-button>
        <el-button
          v-if="sortMode"
          :icon="Close"
          @click="handleCancelSort"
        >
          取消
        </el-button>
        <el-button
          v-if="!sortMode"
          type="warning"
          :icon="Sort"
          @click="handleEnterSortMode"
        >
          调整排序
        </el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd()">
          添加一级分类
        </el-button>
      </div>
    </div>

    <!-- 排序模式提示 -->
    <el-alert
      v-if="sortMode"
      title="排序模式"
      type="info"
      :closable="false"
      class="sort-alert"
    >
      <template #default>
        拖拽分类可调整排序，完成后点击"保存排序"按钮
      </template>
    </el-alert>

    <!-- 分类树形表格 -->
    <el-card class="categories-card" shadow="never">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="categoryTree"
        row-key="categoryId"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
        class="category-table"
        :class="{ 'sort-mode': sortMode }"
      >
        <!-- 拖拽手柄 -->
        <el-table-column v-if="sortMode" label="" width="50" align="center">
          <template #default>
            <el-icon class="drag-handle">
              <Rank />
            </el-icon>
          </template>
        </el-table-column>

        <!-- 分类名称 -->
        <el-table-column label="分类名称" min-width="200">
          <template #default="{ row }">
            <div class="category-name">
              <el-image 
                v-if="row.icon && row.icon.startsWith('/')" 
                :src="row.icon" 
                class="category-icon-img"
                fit="contain"
              >
                <template #error>
                  <el-icon class="category-icon"><Folder /></el-icon>
                </template>
              </el-image>
              <el-icon v-else-if="row.icon" class="category-icon">
                <component :is="row.icon" />
              </el-icon>
              <span>{{ row.categoryName }}</span>
              <el-tag v-if="row.isHot" type="danger" size="small" class="ml-2">热门</el-tag>
              <el-tag v-if="row.isRecommend" type="warning" size="small" class="ml-2">推荐</el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- 分类代码 -->
        <el-table-column prop="categoryCode" label="分类代码" width="150" />

        <!-- 排序值 -->
        <el-table-column prop="sortOrder" label="排序" width="100" align="center" />

        <!-- 资源数量 -->
        <el-table-column prop="resourceCount" label="资源数量" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.resourceCount }}</el-tag>
          </template>
        </el-table-column>

        <!-- 创建时间 -->
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column v-if="!sortMode" label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.parentId"
              type="primary"
              link
              :icon="Plus"
              @click="handleAdd(row.categoryId)"
            >
              添加子分类
            </el-button>
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="categoryName">
          <el-input
            v-model="formData.categoryName"
            placeholder="请输入分类名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="分类代码" prop="categoryCode">
          <el-input
            v-model="formData.categoryCode"
            placeholder="请输入分类代码（英文，如：ui-design）"
            maxlength="50"
            show-word-limit
          />
          <div class="form-tip">分类代码用于URL和API，只能包含字母、数字和连字符</div>
        </el-form-item>

        <el-form-item v-if="!formData.parentId" label="父级分类">
          <el-select
            v-model="formData.parentId"
            placeholder="选择父级分类（不选则为一级分类）"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="category in parentCategories"
              :key="category.categoryId"
              :label="category.categoryName"
              :value="category.categoryId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="图标" prop="icon">
          <el-input
            v-model="formData.icon"
            placeholder="请输入图标路径或图标名称"
          />
          <div class="form-tip">例如：/icons/ui.svg 或 Element Plus 图标名称</div>
        </el-form-item>

        <el-form-item label="排序值" prop="sortOrder">
          <el-input-number
            v-model="formData.sortOrder"
            :min="0"
            :max="9999"
            controls-position="right"
            style="width: 100%"
          />
          <div class="form-tip">数值越小越靠前</div>
        </el-form-item>

        <el-form-item label="热门分类">
          <el-switch v-model="formData.isHot" />
          <span class="ml-2 text-gray-500">热门分类会在首页显示</span>
        </el-form-item>

        <el-form-item label="推荐分类">
          <el-switch v-model="formData.isRecommend" />
          <span class="ml-2 text-gray-500">推荐分类会优先展示</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus';
import { Plus, Edit, Delete, Sort, Check, Close, Rank, Folder } from '@element-plus/icons-vue';
import Sortable from 'sortablejs';
import {
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoriesSort,
  type Category,
  type CreateCategoryParams,
  type UpdateCategoryParams,
  type SortDataItem
} from '@/api/category';

// 加载状态
const loading = ref(false);
const submitting = ref(false);
const savingSortOrder = ref(false);

// 分类树数据
const categoryTree = ref<Category[]>([]);
const originalCategoryTree = ref<Category[]>([]);

// 排序模式
const sortMode = ref(false);
let sortableInstance: Sortable | null = null;

// 表格引用
const tableRef = ref();

// 对话框状态
const dialogVisible = ref(false);
const dialogTitle = ref('添加分类');
const isEdit = ref(false);
const currentCategoryId = ref('');

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = ref<CreateCategoryParams & { categoryId?: string }>({
  categoryName: '',
  categoryCode: '',
  parentId: null,
  icon: '',
  sortOrder: 0,
  isHot: false,
  isRecommend: false
});

// 表单验证规则
const formRules: FormRules = {
  categoryName: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '分类名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  categoryCode: [
    { required: true, message: '请输入分类代码', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '分类代码只能包含小写字母、数字和连字符', trigger: 'blur' }
  ],
  sortOrder: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
};

// 获取一级分类列表（用于选择父级分类）
const parentCategories = computed(() => {
  return categoryTree.value.filter(cat => !cat.parentId);
});

/**
 * 格式化日期
 */
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 加载分类树
 */
const loadCategoryTree = async () => {
  loading.value = true;
  try {
    const res = await getCategoryTree();
    // res是AxiosResponse，res.data是ApiResponse，res.data.data才是实际数据
    const responseData = res.data as any;
    if (responseData.code === 200 && responseData.data) {
      categoryTree.value = Array.isArray(responseData.data) ? responseData.data : [];
    } else {
      categoryTree.value = [];
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载分类列表失败');
    categoryTree.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 进入排序模式
 */
const handleEnterSortMode = () => {
  sortMode.value = true;
  // 保存原始数据
  originalCategoryTree.value = JSON.parse(JSON.stringify(categoryTree.value));
  
  // 初始化拖拽
  nextTick(() => {
    initSortable();
  });
};

/**
 * 取消排序
 */
const handleCancelSort = () => {
  sortMode.value = false;
  // 恢复原始数据
  categoryTree.value = JSON.parse(JSON.stringify(originalCategoryTree.value));
  // 销毁拖拽实例
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
};

/**
 * 初始化拖拽排序
 */
const initSortable = () => {
  if (!tableRef.value) return;

  const tbody = tableRef.value.$el.querySelector('.el-table__body-wrapper tbody');
  if (!tbody) return;

  sortableInstance = Sortable.create(tbody, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost',
    onEnd: (evt: any) => {
      const { oldIndex, newIndex } = evt;
      if (oldIndex === newIndex) return;

      // 更新数据顺序
      const movedItem = categoryTree.value.splice(oldIndex, 1)[0];
      categoryTree.value.splice(newIndex, 0, movedItem);

      // 更新排序值
      categoryTree.value.forEach((item, index) => {
        item.sortOrder = index;
      });
    }
  });
};

/**
 * 保存排序
 */
const handleSaveSortOrder = async () => {
  savingSortOrder.value = true;
  try {
    // 构建排序数据
    const sortData: SortDataItem[] = [];
    
    // 一级分类排序
    categoryTree.value.forEach((category, index) => {
      sortData.push({
        categoryId: category.categoryId,
        sortOrder: index
      });
      
      // 二级分类排序
      if (category.children && category.children.length > 0) {
        category.children.forEach((child, childIndex) => {
          sortData.push({
            categoryId: child.categoryId,
            sortOrder: childIndex
          });
        });
      }
    });

    // 调用API保存排序
    await updateCategoriesSort(sortData);
    ElMessage.success('保存排序成功');
    
    // 退出排序模式
    sortMode.value = false;
    if (sortableInstance) {
      sortableInstance.destroy();
      sortableInstance = null;
    }
    
    // 重新加载数据
    loadCategoryTree();
  } catch (error: any) {
    ElMessage.error(error.message || '保存排序失败');
  } finally {
    savingSortOrder.value = false;
  }
};

/**
 * 打开添加对话框
 */
const handleAdd = (parentId?: string) => {
  isEdit.value = false;
  dialogTitle.value = parentId ? '添加二级分类' : '添加一级分类';
  formData.value = {
    categoryName: '',
    categoryCode: '',
    parentId: parentId || null,
    icon: '',
    sortOrder: 0,
    isHot: false,
    isRecommend: false
  };
  dialogVisible.value = true;
};

/**
 * 打开编辑对话框
 */
const handleEdit = (category: Category) => {
  isEdit.value = true;
  dialogTitle.value = '编辑分类';
  currentCategoryId.value = category.categoryId;
  formData.value = {
    categoryName: category.categoryName,
    categoryCode: category.categoryCode,
    parentId: category.parentId,
    icon: category.icon || '',
    sortOrder: category.sortOrder,
    isHot: category.isHot,
    isRecommend: category.isRecommend
  };
  dialogVisible.value = true;
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    if (isEdit.value) {
      // 编辑分类
      const updateData: UpdateCategoryParams = {
        categoryName: formData.value.categoryName,
        categoryCode: formData.value.categoryCode,
        icon: formData.value.icon || null,
        sortOrder: formData.value.sortOrder,
        isHot: formData.value.isHot,
        isRecommend: formData.value.isRecommend
      };
      await updateCategory(currentCategoryId.value, updateData);
      ElMessage.success('更新分类成功');
    } else {
      // 添加分类
      await createCategory(formData.value);
      ElMessage.success('添加分类成功');
    }

    dialogVisible.value = false;
    loadCategoryTree();
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

/**
 * 删除分类
 */
const handleDelete = async (category: Category) => {
  // 检查是否有子分类
  if (category.children && category.children.length > 0) {
    ElMessage.warning('该分类下有子分类，无法删除');
    return;
  }

  // 检查是否有资源
  if (category.resourceCount > 0) {
    ElMessage.warning(`该分类下有 ${category.resourceCount} 个资源，无法删除`);
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${category.categoryName}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await deleteCategory(category.categoryId);
    ElMessage.success('删除分类成功');
    loadCategoryTree();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除分类失败');
    }
  }
};

// 初始化
onMounted(() => {
  loadCategoryTree();
});
</script>

<style scoped lang="scss">
.categories-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      .page-title {
        font-size: 24px;
        font-weight: 600;
        color: #333;
        margin: 0 0 8px 0;
      }

      .page-desc {
        font-size: 14px;
        color: #666;
        margin: 0;
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .sort-alert {
    margin-bottom: 20px;
  }

  .categories-card {
    border-radius: 8px;

    :deep(.el-card__body) {
      padding: 0;
    }

    .category-table {
      .category-name {
        display: flex;
        align-items: center;
        gap: 8px;

        .category-icon {
          font-size: 18px;
          color: #165dff;
        }

        .category-icon-img {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
      }

      .ml-2 {
        margin-left: 8px;
      }

      .drag-handle {
        cursor: move;
        font-size: 18px;
        color: #999;

        &:hover {
          color: #165dff;
        }
      }

      &.sort-mode {
        :deep(.el-table__row) {
          cursor: move;
        }
      }
    }

    .sortable-ghost {
      opacity: 0.5;
      background: #f5f7fa;
    }
  }

  .form-tip {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }

  .ml-2 {
    margin-left: 8px;
  }

  .text-gray-500 {
    color: #999;
  }
}

// 暗黑模式
:global(.dark) {
  .categories-page {
    .page-header {
      .header-left {
        .page-title {
          color: #e0e0e0;
        }

        .page-desc {
          color: #999;
        }
      }
    }

    .sortable-ghost {
      background: #3a3a3a;
    }
  }
}
</style>
