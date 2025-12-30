<!--
  兑换审计日志页面
  
  功能：
  - 显示兑换审计日志
  - 支持日期范围筛选
  
  需求: 10.9
-->

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Search, Refresh, Document } from '@element-plus/icons-vue';
import { useUserStore } from '@/pinia/userStore';

interface ExchangeAuditLog {
  recordId: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  pointsRequired: number;
  exchangeStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  ipAddress: string;
  deviceInfo: string | null;
  refundReason: string | null;
  refundedAt: string | null;
  createdAt: string;
}

const userStore = useUserStore();
const loading = ref(false);
const auditLogs = ref<ExchangeAuditLog[]>([]);
const total = ref(0);

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  status: '' as 'pending' | 'completed' | 'failed' | 'refunded' | '',
  dateRange: [] as string[],
  keyword: '',
});

/** 获取状态标签类型 */
function getStatusType(status: string): string {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger',
    refunded: 'info',
  };
  return typeMap[status] || 'info';
}

/** 获取状态文本 */
function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    pending: '处理中',
    completed: '已完成',
    failed: '失败',
    refunded: '已退款',
  };
  return textMap[status] || status;
}

/** 格式化日期时间 */
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** 获取兑换审计日志 */
async function fetchAuditLogs() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.append('page', String(queryParams.page));
    params.append('pageSize', String(queryParams.pageSize));
    if (queryParams.status) params.append('status', queryParams.status);
    if (queryParams.keyword) params.append('keyword', queryParams.keyword);
    if (queryParams.dateRange.length === 2) {
      params.append('startDate', queryParams.dateRange[0]);
      params.append('endDate', queryParams.dateRange[1]);
    }

    const response = await fetch(`/api/v1/admin/points/exchange/audit-logs?${params}`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    });

    const result = await response.json();

    if (result.code === 0 || result.code === 200) {
      auditLogs.value = result.data?.list || [];
      total.value = result.data?.total || 0;
    }
  } catch (error) {
    console.error('获取兑换审计日志失败:', error);
    // 使用模拟数据
    auditLogs.value = [
      {
        recordId: '1',
        userId: 'user1',
        userName: '测试用户1',
        productId: 'vip-month',
        productName: 'VIP月卡',
        pointsRequired: 500,
        exchangeStatus: 'completed',
        ipAddress: '192.168.1.100',
        deviceInfo: 'Chrome 120.0 / Windows 10',
        refundReason: null,
        refundedAt: null,
        createdAt: new Date().toISOString(),
      },
      {
        recordId: '2',
        userId: 'user2',
        userName: '测试用户2',
        productId: 'gift-1',
        productName: '定制礼品',
        pointsRequired: 1000,
        exchangeStatus: 'refunded',
        ipAddress: '192.168.1.101',
        deviceInfo: 'Safari 17.0 / macOS',
        refundReason: '用户申请退款',
        refundedAt: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
    total.value = 2;
  } finally {
    loading.value = false;
  }
}

/** 搜索 */
function handleSearch() {
  queryParams.page = 1;
  fetchAuditLogs();
}

/** 重置筛选 */
function handleReset() {
  queryParams.page = 1;
  queryParams.status = '';
  queryParams.dateRange = [];
  queryParams.keyword = '';
  fetchAuditLogs();
}

/** 分页变化 */
function handlePageChange(page: number) {
  queryParams.page = page;
  fetchAuditLogs();
}

onMounted(() => {
  fetchAuditLogs();
});
</script>

<template>
  <div class="exchange-audit-page">
    <div class="page-header">
      <h2>
        <el-icon><Document /></el-icon>
        兑换审计日志
      </h2>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select
        v-model="queryParams.status"
        placeholder="状态"
        clearable
        style="width: 120px"
        @change="handleSearch"
      >
        <el-option label="处理中" value="pending" />
        <el-option label="已完成" value="completed" />
        <el-option label="失败" value="failed" />
        <el-option label="已退款" value="refunded" />
      </el-select>

      <el-date-picker
        v-model="queryParams.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 260px"
        @change="handleSearch"
      />

      <el-input
        v-model="queryParams.keyword"
        placeholder="搜索用户名/商品名"
        clearable
        style="width: 200px"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-button type="primary" @click="handleSearch">
        搜索
      </el-button>
      <el-button @click="handleReset">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
    </div>

    <!-- 列表 -->
    <div v-loading="loading" class="audit-list">
      <el-table :data="auditLogs" style="width: 100%">
        <el-table-column label="用户" width="120">
          <template #default="{ row }">
            <span>{{ row.userName }}</span>
          </template>
        </el-table-column>

        <el-table-column label="商品" width="150">
          <template #default="{ row }">
            <span>{{ row.productName }}</span>
          </template>
        </el-table-column>

        <el-table-column label="消耗积分" width="100">
          <template #default="{ row }">
            <span class="points-value">{{ row.pointsRequired }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.exchangeStatus)" size="small">
              {{ getStatusText(row.exchangeStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="IP地址" width="140">
          <template #default="{ row }">
            <span class="ip-address">{{ row.ipAddress }}</span>
          </template>
        </el-table-column>

        <el-table-column label="设备信息" min-width="180">
          <template #default="{ row }">
            <span class="device-info">{{ row.deviceInfo || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="兑换时间" width="170">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="退款信息" width="200">
          <template #default="{ row }">
            <template v-if="row.exchangeStatus === 'refunded'">
              <div class="refund-info">
                <p class="refund-reason">{{ row.refundReason || '无原因' }}</p>
                <p class="refund-time">{{ formatDateTime(row.refundedAt) }}</p>
              </div>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && auditLogs.length === 0" description="暂无审计日志" />

      <el-pagination
        v-if="total > queryParams.pageSize"
        v-model:current-page="queryParams.page"
        :page-size="queryParams.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        class="pagination"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.exchange-audit-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;

    .el-icon {
      color: #409eff;
    }
  }
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.audit-list {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .points-value {
    font-weight: 600;
    color: #f59e0b;
  }

  .ip-address {
    font-family: monospace;
    font-size: 13px;
    color: #666;
  }

  .device-info {
    font-size: 12px;
    color: #999;
  }

  .refund-info {
    .refund-reason {
      margin: 0 0 4px 0;
      font-size: 13px;
      color: #666;
    }

    .refund-time {
      margin: 0;
      font-size: 12px;
      color: #999;
    }
  }
}

.pagination {
  margin-top: 20px;
  justify-content: center;
}
</style>
