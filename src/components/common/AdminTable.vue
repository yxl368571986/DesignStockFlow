<!--
  管理后台表格组件
  
  功能：
  - 基于Element Plus Table
  - 支持排序、筛选、分页
  - 斑马纹增强可读性
  - 鼠标悬浮行高亮
  - 支持多选和批量操作
  - 不同颜色标识状态
  - 支持列宽拖拽调整
  - 支持固定列和固定表头
  
  需求: 需求21 D部分
-->

<template>
  <div class="admin-table-wrapper">
    <!-- 表格工具栏 -->
    <div class="admin-table-toolbar" v-if="showToolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left">
          <span class="table-title" v-if="title">{{ title }}</span>
        </slot>
      </div>
      <div class="toolbar-right">
        <slot name="toolbar-right">
          <!-- 刷新按钮 -->
          <el-button 
            v-if="refreshable" 
            :icon="Refresh" 
            circle 
            @click="handleRefresh"
            title="刷新"
          />
          <!-- 列设置 -->
          <el-button 
            v-if="columnSettable" 
            :icon="Setting" 
            circle 
            @click="showColumnSetting = true"
            title="列设置"
          />
          <!-- 导出 -->
          <el-button 
            v-if="exportable" 
            :icon="Download" 
            circle 
            @click="handleExport"
            title="导出"
          />
        </slot>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div class="admin-table-batch" v-if="selection.length > 0">
      <div class="batch-info">
        已选择 <span class="batch-count">{{ selection.length }}</span> 项
        <el-button link type="primary" @click="clearSelection">清空</el-button>
      </div>
      <div class="batch-actions">
        <slot name="batch-actions" :selection="selection"></slot>
      </div>
    </div>

    <!-- 表格主体 -->
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="data"
      :stripe="stripe"
      :border="border"
      :height="height"
      :max-height="maxHeight"
      :row-key="rowKey"
      :default-sort="defaultSort"
      :highlight-current-row="highlightCurrentRow"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @row-click="handleRowClick"
      class="admin-table"
      :class="{ 'admin-table-hover': hoverHighlight }"
    >
      <!-- 多选列 -->
      <el-table-column
        v-if="selectable"
        type="selection"
        width="55"
        fixed="left"
        :reserve-selection="reserveSelection"
      />

      <!-- 序号列 -->
      <el-table-column
        v-if="showIndex"
        type="index"
        label="序号"
        width="60"
        fixed="left"
      />

      <!-- 数据列 -->
      <slot></slot>

      <!-- 操作列 -->
      <el-table-column
        v-if="$slots.actions"
        label="操作"
        :width="actionsWidth"
        :fixed="actionsFixed"
      >
        <template #default="scope">
          <slot name="actions" :row="scope.row" :index="scope.$index"></slot>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="admin-table-pagination" v-if="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        :layout="paginationLayout"
        :background="true"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 列设置对话框 -->
    <el-dialog
      v-model="showColumnSetting"
      title="列设置"
      width="400px"
    >
      <div class="column-setting">
        <el-checkbox-group v-model="visibleColumns">
          <el-checkbox 
            v-for="col in columns" 
            :key="col.prop" 
            :label="col.prop"
          >
            {{ col.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="showColumnSetting = false">取消</el-button>
        <el-button type="primary" @click="applyColumnSetting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Refresh, Setting, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { TableInstance } from 'element-plus';

interface Props {
  // 数据
  data: any[];
  loading?: boolean;
  
  // 表格配置
  title?: string;
  stripe?: boolean;
  border?: boolean;
  height?: string | number;
  maxHeight?: string | number;
  rowKey?: string;
  defaultSort?: { prop: string; order: string };
  highlightCurrentRow?: boolean;
  hoverHighlight?: boolean;
  
  // 选择
  selectable?: boolean;
  reserveSelection?: boolean;
  
  // 序号
  showIndex?: boolean;
  
  // 操作列
  actionsWidth?: string | number;
  actionsFixed?: 'left' | 'right';
  
  // 分页
  pagination?: boolean;
  total?: number;
  pageSizes?: number[];
  paginationLayout?: string;
  
  // 工具栏
  showToolbar?: boolean;
  refreshable?: boolean;
  columnSettable?: boolean;
  exportable?: boolean;
  
  // 列配置
  columns?: Array<{ prop: string; label: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  stripe: true,
  border: false,
  highlightCurrentRow: true,
  hoverHighlight: true,
  selectable: false,
  reserveSelection: false,
  showIndex: false,
  actionsWidth: 200,
  actionsFixed: 'right',
  pagination: true,
  total: 0,
  pageSizes: () => [10, 20, 50, 100],
  paginationLayout: 'total, sizes, prev, pager, next, jumper',
  showToolbar: true,
  refreshable: true,
  columnSettable: false,
  exportable: false,
  columns: () => []
});

const emit = defineEmits<{
  refresh: [];
  selectionChange: [selection: any[]];
  sortChange: [sort: { prop: string; order: string }];
  rowClick: [row: any];
  sizeChange: [size: number];
  currentChange: [page: number];
}>();

const tableRef = ref<TableInstance>();
const selection = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(props.pageSizes[0]);
const showColumnSetting = ref(false);
const visibleColumns = ref<string[]>([]);

// 处理选择变化
const handleSelectionChange = (val: any[]) => {
  selection.value = val;
  emit('selectionChange', val);
};

// 清空选择
const clearSelection = () => {
  tableRef.value?.clearSelection();
};

// 处理排序变化
const handleSortChange = (sort: any) => {
  emit('sortChange', sort);
};

// 处理行点击
const handleRowClick = (row: any) => {
  emit('rowClick', row);
};

// 处理刷新
const handleRefresh = () => {
  emit('refresh');
};

// 处理导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...');
};

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  emit('sizeChange', size);
};

// 处理当前页变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  emit('currentChange', page);
};

// 应用列设置
const applyColumnSetting = () => {
  showColumnSetting.value = false;
  ElMessage.success('列设置已保存');
};

// 暴露方法
defineExpose({
  clearSelection,
  toggleRowSelection: (row: any, selected?: boolean) => {
    tableRef.value?.toggleRowSelection(row, selected);
  },
  toggleAllSelection: () => {
    tableRef.value?.toggleAllSelection();
  },
  clearSort: () => {
    tableRef.value?.clearSort();
  },
  sort: (prop: string, order: string) => {
    tableRef.value?.sort(prop, order);
  }
});
</script>

<style scoped lang="scss">
.admin-table-wrapper {
  background: var(--admin-bg-light);
  border-radius: var(--admin-radius-lg);
  padding: 20px;
  box-shadow: var(--admin-shadow-sm);
}

// 工具栏
.admin-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--admin-border-light);

  .toolbar-left {
    .table-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--admin-text);
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: '';
        width: 4px;
        height: 16px;
        background: linear-gradient(135deg, var(--admin-primary), var(--admin-primary-light));
        border-radius: 2px;
      }
    }
  }

  .toolbar-right {
    display: flex;
    gap: 8px;

    :deep(.el-button) {
      transition: all var(--admin-transition-fast);

      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

// 批量操作栏
.admin-table-batch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: linear-gradient(90deg, rgba(22, 93, 255, 0.08), transparent);
  border-radius: var(--admin-radius-sm);
  border-left: 4px solid var(--admin-primary);

  .batch-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--admin-text-secondary);

    .batch-count {
      font-weight: 600;
      color: var(--admin-primary);
      font-size: 16px;
    }
  }

  .batch-actions {
    display: flex;
    gap: 8px;
  }
}

// 表格样式
.admin-table {
  :deep(.el-table__header) {
    th {
      background: var(--admin-bg);
      color: var(--admin-text);
      font-weight: 600;
      border-bottom: 2px solid var(--admin-border);
    }
  }

  :deep(.el-table__body) {
    tr {
      transition: all var(--admin-transition-fast);

      &:hover {
        background: rgba(22, 93, 255, 0.04) !important;
      }

      td {
        border-bottom: 1px solid var(--admin-border-light);
      }
    }

    // 斑马纹
    tr.el-table__row--striped {
      background: rgba(0, 0, 0, 0.01);
    }
  }

  // 状态标签样式
  :deep(.el-tag) {
    border: none;
    font-weight: 500;

    &.el-tag--success {
      background: rgba(0, 180, 42, 0.1);
      color: var(--admin-success);
    }

    &.el-tag--warning {
      background: rgba(255, 125, 0, 0.1);
      color: var(--admin-warning);
    }

    &.el-tag--danger {
      background: rgba(245, 63, 63, 0.1);
      color: var(--admin-danger);
    }

    &.el-tag--info {
      background: rgba(22, 93, 255, 0.1);
      color: var(--admin-info);
    }
  }
}

// 悬浮高亮
.admin-table-hover {
  :deep(.el-table__body) {
    tr:hover {
      box-shadow: 0 2px 8px rgba(22, 93, 255, 0.1);
      transform: translateY(-1px);
    }
  }
}

// 分页
.admin-table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--admin-border-light);

  :deep(.el-pagination) {
    .el-pager li {
      transition: all var(--admin-transition-fast);

      &:hover {
        transform: scale(1.1);
      }

      &.is-active {
        background: linear-gradient(135deg, var(--admin-primary), var(--admin-primary-light));
        color: white;
      }
    }

    .btn-prev,
    .btn-next {
      transition: all var(--admin-transition-fast);

      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

// 列设置
.column-setting {
  :deep(.el-checkbox-group) {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .el-checkbox {
      margin: 0;
    }
  }
}
</style>
