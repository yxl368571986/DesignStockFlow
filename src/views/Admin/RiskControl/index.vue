<!--
  风控预警列表页面
  
  功能：
  - 显示待审核的风控预警
  - 审核操作（通过/拒绝）
  
  需求: 5.7
-->

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Warning, Check, Close, Search, Refresh } from '@element-plus/icons-vue';
import { useUserStore } from '@/pinia/userStore';
import { getRiskControlStatusText, getRiskControlStatusType } from '@/utils/status';
import { formatTime } from '@/utils/format';

interface RiskControlLog {
  logId: string;
  userId: string;
  userName: string;
  riskType: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  details: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

const userStore = useUserStore();
const loading = ref(false);
const riskLogs = ref<RiskControlLog[]>([]);
const total = ref(0);

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  status: 'pending' as 'pending' | 'approved' | 'rejected' | '',
  riskLevel: '' as 'low' | 'medium' | 'high' | '',
  keyword: '',
});

/** 获取风险类型文本 */
function getRiskTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    self_download: '自下载检测',
    frequent_download: '频繁下载',
    account_cluster: '账号关联',
    ip_anomaly: 'IP异常',
    device_anomaly: '设备异常',
    earnings_anomaly: '收益异常',
  };
  return typeMap[type] || type;
}

/** 获取风险等级标签类型 */
function getRiskLevelType(level: string): string {
  const typeMap: Record<string, string> = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
  };
  return typeMap[level] || 'info';
}

/** 获取风险等级文本 */
function getRiskLevelText(level: string): string {
  const textMap: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
  };
  return textMap[level] || level;
}

/** 获取状态标签类型 */
function getStatusType(status: string): string {
  return getRiskControlStatusType(status);
}

/** 获取状态文本 */
function getStatusText(status: string): string {
  return getRiskControlStatusText(status);
}

/** 格式化日期时间 */
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  return formatTime(dateStr, 'YYYY-MM-DD HH:mm:ss');
}
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 获取风控预警列表 */
async function fetchRiskLogs() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.append('page', String(queryParams.page));
    params.append('pageSize', String(queryParams.pageSize));
    if (queryParams.status) params.append('status', queryParams.status);
    if (queryParams.riskLevel) params.append('riskLevel', queryParams.riskLevel);
    if (queryParams.keyword) params.append('keyword', queryParams.keyword);

    const response = await fetch(`/api/v1/admin/risk-control/list?${params}`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    });

    const result = await response.json();

    if (result.code === 0 || result.code === 200) {
      riskLogs.value = result.data?.list || [];
      total.value = result.data?.total || 0;
    }
  } catch (error) {
    console.error('获取风控预警列表失败:', error);
    // 使用模拟数据
    riskLogs.value = [
      {
        logId: '1',
        userId: 'user1',
        userName: '测试用户1',
        riskType: 'frequent_download',
        riskLevel: 'medium',
        description: '24小时内下载同一资源超过3次',
        details: { downloadCount: 5, resourceId: 'res1' },
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        reviewNote: null,
        createdAt: new Date().toISOString(),
      },
      {
        logId: '2',
        userId: 'user2',
        userName: '测试用户2',
        riskType: 'account_cluster',
        riskLevel: 'high',
        description: '检测到账号关联行为',
        details: { relatedAccounts: ['user3', 'user4'] },
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        reviewNote: null,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
    total.value = 2;
  } finally {
    loading.value = false;
  }
}

/** 审核风控预警 */
async function handleReview(log: RiskControlLog, action: 'approve' | 'reject') {
  const actionText = action === 'approve' ? '通过' : '拒绝';
  
  try {
    const { value: note } = await ElMessageBox.prompt(
      `请输入${actionText}原因（可选）`,
      `${actionText}风控预警`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入审核备注',
      }
    );

    const response = await fetch(`/api/v1/admin/risk-control/${log.logId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userStore.token}`,
      },
      body: JSON.stringify({
        action,
        note: note || '',
      }),
    });

    const result = await response.json();

    if (result.code === 0 || result.code === 200) {
      ElMessage.success(`${actionText}成功`);
      fetchRiskLogs();
    } else {
      ElMessage.error(result.message || `${actionText}失败`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核失败:', error);
      ElMessage.error('审核失败，请稍后重试');
    }
  }
}

/** 搜索 */
function handleSearch() {
  queryParams.page = 1;
  fetchRiskLogs();
}

/** 重置筛选 */
function handleReset() {
  queryParams.page = 1;
  queryParams.status = 'pending';
  queryParams.riskLevel = '';
  queryParams.keyword = '';
  fetchRiskLogs();
}

/** 分页变化 */
function handlePageChange(page: number) {
  queryParams.page = page;
  fetchRiskLogs();
}

onMounted(() => {
  fetchRiskLogs();
});
</script>

<template>
  <div class="risk-control-page">
    <div class="page-header">
      <h2>
        <el-icon><Warning /></el-icon>
        风控预警管理
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
        <el-option label="待审核" value="pending" />
        <el-option label="已通过" value="approved" />
        <el-option label="已拒绝" value="rejected" />
      </el-select>

      <el-select
        v-model="queryParams.riskLevel"
        placeholder="风险等级"
        clearable
        style="width: 120px"
        @change="handleSearch"
      >
        <el-option label="低风险" value="low" />
        <el-option label="中风险" value="medium" />
        <el-option label="高风险" value="high" />
      </el-select>

      <el-input
        v-model="queryParams.keyword"
        placeholder="搜索用户名"
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
    <div v-loading="loading" class="risk-list">
      <el-table :data="riskLogs" style="width: 100%">
        <el-table-column label="用户" width="150">
          <template #default="{ row }">
            <span>{{ row.userName }}</span>
          </template>
        </el-table-column>

        <el-table-column label="风险类型" width="140">
          <template #default="{ row }">
            <span>{{ getRiskTypeText(row.riskType) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="风险等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getRiskLevelType(row.riskLevel)" size="small">
              {{ getRiskLevelText(row.riskLevel) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="描述" min-width="200">
          <template #default="{ row }">
            <span>{{ row.description }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button
                type="success"
                size="small"
                :icon="Check"
                @click="handleReview(row, 'approve')"
              >
                通过
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Close"
                @click="handleReview(row, 'reject')"
              >
                拒绝
              </el-button>
            </template>
            <template v-else>
              <span class="review-info">
                {{ row.reviewedBy ? `由 ${row.reviewedBy} 审核` : '-' }}
              </span>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && riskLogs.length === 0" description="暂无风控预警" />

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
.risk-control-page {
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
      color: #e6a23c;
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
}

.risk-list {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .review-info {
    font-size: 12px;
    color: #999;
  }
}

.pagination {
  margin-top: 20px;
  justify-content: center;
}
</style>
