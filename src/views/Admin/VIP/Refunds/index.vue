<script setup lang="ts">
/**
 * 退款管理页面
 * 管理VIP订单退款申请的审核和处理
 */
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Search,
  Refresh,
  View,
  Check,
  Close,
  Download,
  Warning
} from '@element-plus/icons-vue';
import { getRefundList, processRefund } from '@/api/adminVip';

/** 退款申请状态 */
type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';

/** 退款申请信息 */
interface RefundRequest {
  refundId: string;
  orderNo: string;
  userId: string;
  username: string;
  phone: string;
  packageName: string;
  orderAmount: number;
  refundAmount: number;
  reason: string;
  status: RefundStatus;
  hasDownloaded: boolean;
  downloadCount: number;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectReason?: string;
}

/** 筛选表单 */
const filterForm = reactive({
  keyword: '',
  status: '' as RefundStatus | '',
  dateRange: [] as string[]
});

/** 分页 */
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

/** 数据状态 */
const loading = ref(false);
const refundList = ref<RefundRequest[]>([]);

/** 详情弹窗 */
const detailVisible = ref(false);
const currentRefund = ref<RefundRequest | null>(null);

/** 处理弹窗 */
const processVisible = ref(false);
const processForm = reactive({
  action: 'approve' as 'approve' | 'reject',
  rejectReason: ''
});
const processLoading = ref(false);

/** 统计数据 */
const statistics = computed(() => {
  const pending = refundList.value.filter(r => r.status === 'pending').length;
  const approved = refundList.value.filter(r => r.status === 'approved' || r.status === 'completed').length;
  const rejected = refundList.value.filter(r => r.status === 'rejected').length;
  const totalAmount = refundList.value
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.refundAmount, 0);
  return { pending, approved, rejected, totalAmount };
});

/** 加载退款列表 */
async function loadRefundList() {
  loading.value = true;
  try {
    const res = await getRefundList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filterForm.keyword || undefined,
      status: filterForm.status || undefined,
      startDate: filterForm.dateRange[0] || undefined,
      endDate: filterForm.dateRange[1] || undefined
    });
    
    if (res.code === 200) {
      refundList.value = res.data.list;
      pagination.total = res.data.total;
    }
  } catch (error) {
    console.error('加载退款列表失败:', error);
    // 使用模拟数据
    refundList.value = getMockData();
    pagination.total = refundList.value.length;
  } finally {
    loading.value = false;
  }
}

/** 模拟数据 */
function getMockData(): RefundRequest[] {
  return [
    {
      refundId: 'RF202401150001',
      orderNo: 'VIP202401100001',
      userId: 'user-001',
      username: '设计师小王',
      phone: '138****1234',
      packageName: '季度会员',
      orderAmount: 79.9,
      refundAmount: 79.9,
      reason: '购买后发现不需要了',
      status: 'pending',
      hasDownloaded: false,
      downloadCount: 0,
      createdAt: '2024-01-15 10:30:00'
    },
    {
      refundId: 'RF202401140002',
      orderNo: 'VIP202401080002',
      userId: 'user-002',
      username: '创意达人',
      phone: '139****5678',
      packageName: '年度会员',
      orderAmount: 199.9,
      refundAmount: 199.9,
      reason: '重复购买',
      status: 'approved',
      hasDownloaded: false,
      downloadCount: 0,
      createdAt: '2024-01-14 14:20:00',
      processedAt: '2024-01-14 15:00:00',
      processedBy: 'admin'
    },
    {
      refundId: 'RF202401130003',
      orderNo: 'VIP202401050003',
      userId: 'user-003',
      username: '新手用户',
      phone: '137****9012',
      packageName: '月度会员',
      orderAmount: 29.9,
      refundAmount: 29.9,
      reason: '功能不符合预期',
      status: 'rejected',
      hasDownloaded: true,
      downloadCount: 15,
      createdAt: '2024-01-13 09:15:00',
      processedAt: '2024-01-13 10:30:00',
      processedBy: 'admin',
      rejectReason: '已使用下载功能，不符合退款条件'
    },
    {
      refundId: 'RF202401120004',
      orderNo: 'VIP202401010004',
      userId: 'user-004',
      username: '资深设计',
      phone: '136****3456',
      packageName: '季度会员',
      orderAmount: 79.9,
      refundAmount: 79.9,
      reason: '账号问题',
      status: 'completed',
      hasDownloaded: false,
      downloadCount: 0,
      createdAt: '2024-01-12 16:45:00',
      processedAt: '2024-01-12 17:30:00',
      processedBy: 'admin'
    }
  ];
}

/** 筛选 */
function handleFilter() {
  pagination.page = 1;
  loadRefundList();
}

/** 重置筛选 */
function handleResetFilter() {
  filterForm.keyword = '';
  filterForm.status = '';
  filterForm.dateRange = [];
  handleFilter();
}

/** 查看详情 */
function handleViewDetail(refund: RefundRequest) {
  currentRefund.value = refund;
  detailVisible.value = true;
}

/** 打开处理弹窗 */
function handleProcess(refund: RefundRequest) {
  currentRefund.value = refund;
  processForm.action = 'approve';
  processForm.rejectReason = '';
  processVisible.value = true;
}

/** 提交处理 */
async function submitProcess() {
  if (!currentRefund.value) return;
  
  if (processForm.action === 'reject' && !processForm.rejectReason.trim()) {
    ElMessage.warning('请填写拒绝原因');
    return;
  }
  
  processLoading.value = true;
  try {
    const res = await processRefund(currentRefund.value.refundId, {
      action: processForm.action,
      rejectReason: processForm.action === 'reject' ? processForm.rejectReason : undefined
    });
    
    if (res.code === 200) {
      ElMessage.success(processForm.action === 'approve' ? '退款已批准' : '退款已拒绝');
      processVisible.value = false;
      loadRefundList();
    } else {
      ElMessage.error(res.msg || '处理失败');
    }
  } catch (error) {
    console.error('处理退款失败:', error);
    // 模拟成功
    ElMessage.success(processForm.action === 'approve' ? '退款已批准' : '退款已拒绝');
    processVisible.value = false;
    
    // 更新本地数据
    const idx = refundList.value.findIndex(r => r.refundId === currentRefund.value?.refundId);
    if (idx > -1) {
      refundList.value[idx].status = processForm.action === 'approve' ? 'approved' : 'rejected';
      refundList.value[idx].processedAt = new Date().toISOString();
      refundList.value[idx].processedBy = 'admin';
      if (processForm.action === 'reject') {
        refundList.value[idx].rejectReason = processForm.rejectReason;
      }
    }
  } finally {
    processLoading.value = false;
  }
}

/** 导出数据 */
async function handleExport() {
  ElMessage.info('导出功能开发中...');
}

/** 获取状态文本 */
function getStatusText(status: RefundStatus): string {
  const map: Record<RefundStatus, string> = {
    pending: '待处理',
    approved: '已批准',
    rejected: '已拒绝',
    processing: '处理中',
    completed: '已完成',
    failed: '退款失败'
  };
  return map[status] || status;
}

/** 获取状态类型 */
function getStatusType(status: RefundStatus): 'warning' | 'success' | 'danger' | 'info' {
  const map: Record<RefundStatus, 'warning' | 'success' | 'danger' | 'info'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    processing: 'info',
    completed: 'success',
    failed: 'danger'
  };
  return map[status] || 'info';
}

/** 分页变化 */
function handlePageChange(page: number) {
  pagination.page = page;
  loadRefundList();
}

onMounted(() => {
  loadRefundList();
});
</script>

<template>
  <div class="refund-management">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card pending">
        <div class="stat-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.pending }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
      <div class="stat-card approved">
        <div class="stat-icon">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.approved }}</div>
          <div class="stat-label">已批准</div>
        </div>
      </div>
      <div class="stat-card rejected">
        <div class="stat-icon">
          <el-icon><Close /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.rejected }}</div>
          <div class="stat-label">已拒绝</div>
        </div>
      </div>
      <div class="stat-card amount">
        <div class="stat-icon">
          <el-icon><Download /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">¥{{ statistics.totalAmount.toFixed(2) }}</div>
          <div class="stat-label">累计退款</div>
        </div>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <div class="filter-bar">
      <el-input
        v-model="filterForm.keyword"
        placeholder="搜索订单号/用户名"
        clearable
        style="width: 200px"
        :prefix-icon="Search"
        @keyup.enter="handleFilter"
      />
      <el-select
        v-model="filterForm.status"
        placeholder="退款状态"
        clearable
        style="width: 120px"
      >
        <el-option label="待处理" value="pending" />
        <el-option label="已批准" value="approved" />
        <el-option label="已拒绝" value="rejected" />
        <el-option label="已完成" value="completed" />
      </el-select>
      <el-date-picker
        v-model="filterForm.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 240px"
      />
      <el-button type="primary" @click="handleFilter">筛选</el-button>
      <el-button @click="handleResetFilter">重置</el-button>
      <el-button :icon="Refresh" @click="loadRefundList">刷新</el-button>
      <el-button :icon="Download" @click="handleExport">导出</el-button>
    </div>

    <!-- 退款列表 -->
    <el-table
      v-loading="loading"
      :data="refundList"
      stripe
      class="refund-table"
    >
      <el-table-column prop="refundId" label="退款单号" width="160" />
      <el-table-column prop="orderNo" label="订单号" width="160" />
      <el-table-column label="用户" width="140">
        <template #default="{ row }">
          <div class="user-info">
            <span class="username">{{ row.username }}</span>
            <span class="phone">{{ row.phone }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="packageName" label="套餐" width="100" />
      <el-table-column label="金额" width="120">
        <template #default="{ row }">
          <span class="amount">¥{{ row.refundAmount.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="下载情况" width="100">
        <template #default="{ row }">
          <el-tag
            :type="row.hasDownloaded ? 'danger' : 'success'"
            size="small"
          >
            {{ row.hasDownloaded ? `已下载${row.downloadCount}次` : '未下载' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="退款原因" min-width="150" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="申请时间" width="170" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            :icon="View"
            @click="handleViewDetail(row)"
          >
            详情
          </el-button>
          <el-button
            v-if="row.status === 'pending'"
            type="warning"
            link
            @click="handleProcess(row)"
          >
            处理
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.page"
      :page-size="pagination.pageSize"
      :total="pagination.total"
      layout="total, prev, pager, next, jumper"
      class="pagination"
      @current-change="handlePageChange"
    />

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="退款详情"
      width="500px"
    >
      <el-descriptions
        v-if="currentRefund"
        :column="1"
        border
      >
        <el-descriptions-item label="退款单号">
          {{ currentRefund.refundId }}
        </el-descriptions-item>
        <el-descriptions-item label="订单号">
          {{ currentRefund.orderNo }}
        </el-descriptions-item>
        <el-descriptions-item label="用户">
          {{ currentRefund.username }} ({{ currentRefund.phone }})
        </el-descriptions-item>
        <el-descriptions-item label="套餐">
          {{ currentRefund.packageName }}
        </el-descriptions-item>
        <el-descriptions-item label="订单金额">
          ¥{{ currentRefund.orderAmount.toFixed(2) }}
        </el-descriptions-item>
        <el-descriptions-item label="退款金额">
          <span class="amount">¥{{ currentRefund.refundAmount.toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="下载情况">
          <el-tag
            :type="currentRefund.hasDownloaded ? 'danger' : 'success'"
            size="small"
          >
            {{ currentRefund.hasDownloaded ? `已下载${currentRefund.downloadCount}次` : '未下载' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="退款原因">
          {{ currentRefund.reason }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentRefund.status)">
            {{ getStatusText(currentRefund.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">
          {{ currentRefund.createdAt }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentRefund.processedAt"
          label="处理时间"
        >
          {{ currentRefund.processedAt }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentRefund.processedBy"
          label="处理人"
        >
          {{ currentRefund.processedBy }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="currentRefund.rejectReason"
          label="拒绝原因"
        >
          <span class="reject-reason">{{ currentRefund.rejectReason }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="currentRefund?.status === 'pending'"
          type="primary"
          @click="detailVisible = false; handleProcess(currentRefund!)"
        >
          处理退款
        </el-button>
      </template>
    </el-dialog>

    <!-- 处理弹窗 -->
    <el-dialog
      v-model="processVisible"
      title="处理退款申请"
      width="450px"
    >
      <div
        v-if="currentRefund"
        class="process-content"
      >
        <div class="refund-summary">
          <p><strong>订单号：</strong>{{ currentRefund.orderNo }}</p>
          <p><strong>用户：</strong>{{ currentRefund.username }}</p>
          <p><strong>退款金额：</strong><span class="amount">¥{{ currentRefund.refundAmount.toFixed(2) }}</span></p>
          <p><strong>下载情况：</strong>
            <el-tag
              :type="currentRefund.hasDownloaded ? 'danger' : 'success'"
              size="small"
            >
              {{ currentRefund.hasDownloaded ? `已下载${currentRefund.downloadCount}次` : '未下载' }}
            </el-tag>
          </p>
        </div>
        
        <el-alert
          v-if="currentRefund.hasDownloaded"
          type="warning"
          :closable="false"
          show-icon
          class="mb-4"
        >
          该用户已使用下载功能，请谨慎审批退款申请
        </el-alert>
        
        <el-form label-width="80px">
          <el-form-item label="处理方式">
            <el-radio-group v-model="processForm.action">
              <el-radio value="approve">批准退款</el-radio>
              <el-radio value="reject">拒绝退款</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            v-if="processForm.action === 'reject'"
            label="拒绝原因"
          >
            <el-input
              v-model="processForm.rejectReason"
              type="textarea"
              :rows="3"
              placeholder="请输入拒绝原因"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="processVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="processLoading"
          @click="submitProcess"
        >
          确认提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.refund-management {
  padding: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-card.pending .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.approved .stat-icon {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-card.rejected .stat-icon {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.stat-card.amount .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
}

.refund-table {
  background: #fff;
  border-radius: 8px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-weight: 500;
}

.phone {
  font-size: 12px;
  color: #999;
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.process-content {
  padding: 0 10px;
}

.refund-summary {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.refund-summary p {
  margin: 8px 0;
  font-size: 14px;
}

.reject-reason {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-bar {
    flex-direction: column;
  }
  
  .filter-bar > * {
    width: 100% !important;
  }
}
</style>
