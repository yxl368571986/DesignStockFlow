<template>
  <div class="audit-logs-page">
    <div class="page-header">
      <h2 class="page-title">
        审核日志
      </h2>
    </div>

    <el-card
      class="filter-card"
      shadow="never"
    >
      <el-form
        :inline="true"
        :model="filterForm"
        class="filter-form"
      >
        <el-form-item label="资源ID">
          <el-input
            v-model="filterForm.resourceId"
            placeholder="输入资源ID"
            clearable
            style="width: 220px"
            @clear="handleFilter"
            @keyup.enter="handleFilter"
          />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input
            v-model="filterForm.operatorId"
            placeholder="输入操作人ID"
            clearable
            style="width: 180px"
            @clear="handleFilter"
            @keyup.enter="handleFilter"
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
            @change="handleFilter"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="Search"
            @click="handleFilter"
          >
            搜索
          </el-button>
          <el-button @click="handleResetFilter">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card
      class="table-card"
      shadow="never"
    >
      <el-table
        v-loading="loading"
        :data="logs"
        stripe
      >
        <el-table-column
          label="资源ID"
          width="280"
        >
          <template #default="{ row }">
            <el-link
              type="primary"
              @click="handleViewResource(row.resourceId)"
            >
              {{ row.resourceId }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column
          label="操作类型"
          width="120"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.operatorType === 'system' ? 'info' : 'primary'"
              size="small"
            >
              {{ row.operatorType === 'system' ? '系统自动' : '人工审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="操作人"
          width="150"
        >
          <template #default="{ row }">
            {{ row.operatorName || (row.operatorType === 'system' ? '系统' : '-') }}
          </template>
        </el-table-column>
        <el-table-column
          label="状态变更"
          width="200"
        >
          <template #default="{ row }">
            <div class="status-change">
              <el-tag
                :type="getStatusType(row.previousStatus)"
                size="small"
              >
                {{ getStatusText(row.previousStatus) }}
              </el-tag>
              <el-icon class="arrow-icon">
                <ArrowRight />
              </el-icon>
              <el-tag
                :type="getStatusType(row.newStatus)"
                size="small"
              >
                {{ getStatusText(row.newStatus) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="驳回原因"
          min-width="200"
        >
          <template #default="{ row }">
            <template v-if="row.newStatus === 2">
              <el-tooltip
                v-if="row.rejectReason && row.rejectReason.length > 30"
                :content="row.rejectReason"
                placement="top"
              >
                <span class="reject-reason">{{ row.rejectReason.substring(0, 30) }}...</span>
              </el-tooltip>
              <span
                v-else
                class="reject-reason"
              >{{ row.rejectReason || '-' }}</span>
            </template>
            <span
              v-else
              class="text-muted"
            >-</span>
          </template>
        </el-table-column>
        <el-table-column
          label="操作时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadLogs"
          @current-change="loadLogs"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, ArrowRight } from '@element-plus/icons-vue';
import { getAuditLogs, type AuditLogEntry } from '@/api/audit';

const router = useRouter();

const loading = ref(false);
const logs = ref<AuditLogEntry[]>([]);
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const filterForm = reactive({
  resourceId: '',
  operatorId: '',
  dateRange: null as [string, string] | null
});

/** 加载审核日志 */
async function loadLogs() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      pageNum: pagination.page,
      pageSize: pagination.pageSize
    };
    if (filterForm.resourceId) {
      params.resourceId = filterForm.resourceId;
    }
    if (filterForm.operatorId) {
      params.operatorId = filterForm.operatorId;
    }
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startTime = filterForm.dateRange[0];
      params.endTime = filterForm.dateRange[1];
    }

    const res = await getAuditLogs(params);
    if (res.code === 200 && res.data) {
      logs.value = res.data.list || [];
      pagination.total = res.data.total || 0;
    } else {
      logs.value = [];
      pagination.total = 0;
    }
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(err.message || '加载审核日志失败');
    logs.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

/** 筛选 */
function handleFilter() {
  pagination.page = 1;
  loadLogs();
}

/** 重置筛选 */
function handleResetFilter() {
  filterForm.resourceId = '';
  filterForm.operatorId = '';
  filterForm.dateRange = null;
  handleFilter();
}

/** 查看资源 */
function handleViewResource(resourceId: string) {
  router.push(`/resource/${resourceId}`);
}

/** 获取状态文本 */
function getStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: '待审核',
    1: '已通过',
    2: '已驳回'
  };
  return statusMap[status] || '未知';
}

/** 获取状态类型 */
function getStatusType(status: number): 'warning' | 'success' | 'danger' | 'info' {
  const typeMap: Record<number, 'warning' | 'success' | 'danger' | 'info'> = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  };
  return typeMap[status] || 'info';
}

/** 格式化日期 */
function formatDate(date: string): string {
  if (!date) return '-';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

onMounted(() => {
  loadLogs();
});
</script>

<style scoped lang="scss">
.audit-logs-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
  }

  .filter-card {
    margin-bottom: 20px;

    .filter-form {
      margin-bottom: 0;

      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }
  }

  .table-card {
    .status-change {
      display: flex;
      align-items: center;
      gap: 8px;

      .arrow-icon {
        color: #909399;
      }
    }

    .reject-reason {
      color: #f56c6c;
    }

    .text-muted {
      color: #c0c4cc;
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
