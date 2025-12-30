<script setup lang="ts">
/**
 * 积分调整日志页面
 * 查看积分调整记录，支持撤销操作
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, RefreshLeft } from '@element-plus/icons-vue';
import { getAdjustmentLogs, revokeAdjustment, type AdjustmentLog } from '@/api/adminRecharge';

// 日志列表
const logs = ref<AdjustmentLog[]>([]);
const loading = ref(false);
const total = ref(0);

// 筛选条件
const filterForm = reactive({
  adminId: '',
  targetUserId: '',
  adjustmentType: '',
  startDate: '',
  endDate: ''
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10
});

// 调整类型映射
const typeMap: Record<string, { text: string; type: string }> = {
  add: { text: '增加', type: 'success' },
  deduct: { text: '扣除', type: 'danger' },
  batch_gift: { text: '批量赠送', type: 'warning' },
  revoke: { text: '撤销', type: 'info' }
};

/** 加载日志列表 */
async function loadLogs(): Promise<void> {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      pageNum: pagination.page,
      adminId: filterForm.adminId || undefined,
      targetUserId: filterForm.targetUserId || undefined,
      adjustmentType: filterForm.adjustmentType || undefined,
      startDate: filterForm.startDate || undefined,
      endDate: filterForm.endDate || undefined
    };

    const res = await getAdjustmentLogs(params);
    if (res.code === 200 || res.code === 0) {
      // 后端返回的是 logs 字段，不是 list
      logs.value = res.data?.logs || res.data?.list || [];
      total.value = res.data?.total || 0;
    } else {
      ElMessage.error(res.message || '加载日志失败');
    }
  } catch (error) {
    console.error('加载日志失败:', error);
    ElMessage.error('加载日志失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

/** 筛选 */
function handleFilter(): void {
  pagination.page = 1;
  loadLogs();
}

/** 重置筛选 */
function handleReset(): void {
  filterForm.adminId = '';
  filterForm.targetUserId = '';
  filterForm.adjustmentType = '';
  filterForm.startDate = '';
  filterForm.endDate = '';
  handleFilter();
}

/** 分页变化 */
function handlePageChange(page: number): void {
  pagination.page = page;
  loadLogs();
}

/** 撤销调整 */
async function handleRevoke(log: AdjustmentLog): Promise<void> {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `确定要撤销此次积分调整吗？\n\n调整类型: ${getType(log.adjustmentType).text}\n积分变动: ${log.pointsChange > 0 ? '+' : ''}${log.pointsChange}\n目标用户: ${log.targetUserName || log.targetUserId}`,
      '撤销确认',
      {
        confirmButtonText: '确认撤销',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入撤销原因',
        inputValidator: (val) => {
          if (!val || val.trim().length < 10) {
            return '撤销原因至少10个字符';
          }
          return true;
        },
        type: 'warning'
      }
    );

    const res = await revokeAdjustment(log.logId, reason);
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('撤销成功');
      await loadLogs();
    } else {
      ElMessage.error(res.message || '撤销失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('撤销失败:', error);
    }
  }
}

/** 检查是否可撤销（24小时内且未撤销） */
function canRevoke(log: AdjustmentLog): boolean {
  if (log.isRevoked) return false;
  if (log.adjustmentType === 'revoke') return false;
  const createdAt = new Date(log.createdAt).getTime();
  const now = Date.now();
  const hours24 = 24 * 60 * 60 * 1000;
  return now - createdAt < hours24;
}

/** 格式化时间 */
function formatTime(time: string | undefined): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

/** 获取类型信息 */
function getType(type: string): { text: string; type: string } {
  return typeMap[type] || { text: type, type: 'info' };
}

onMounted(() => { loadLogs(); });
</script>

<template>
  <div class="adjustment-logs">
    <div class="page-header">
      <h2 class="page-title">积分调整日志</h2>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-input v-model="filterForm.adminId" placeholder="操作员ID" clearable style="width: 150px" />
      <el-input v-model="filterForm.targetUserId" placeholder="目标用户ID" clearable style="width: 150px" />
      <el-select v-model="filterForm.adjustmentType" placeholder="调整类型" clearable style="width: 120px">
        <el-option label="增加" value="add" />
        <el-option label="扣除" value="deduct" />
        <el-option label="批量赠送" value="batch_gift" />
        <el-option label="撤销" value="revoke" />
      </el-select>
      <el-date-picker v-model="filterForm.startDate" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" style="width: 150px" />
      <el-date-picker v-model="filterForm.endDate" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 150px" />
      <el-button type="primary" :icon="Search" @click="handleFilter">搜索</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <!-- 日志列表 -->
    <div class="log-list">
      <el-table :data="logs" v-loading="loading" stripe border>
        <el-table-column label="操作员" width="120">
          <template #default="{ row }">{{ row.adminName || row.adminId }}</template>
        </el-table-column>
        <el-table-column label="目标用户" width="120">
          <template #default="{ row }">{{ row.targetUserName || row.targetUserId }}</template>
        </el-table-column>
        <el-table-column label="调整类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getType(row.adjustmentType).type as any" size="small">
              {{ getType(row.adjustmentType).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="积分变动" width="100" align="right">
          <template #default="{ row }">
            <span :class="row.pointsChange > 0 ? 'text-green-500' : 'text-red-500'">
              {{ row.pointsChange > 0 ? '+' : '' }}{{ row.pointsChange }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="调整前" width="100" align="right">
          <template #default="{ row }">{{ row.pointsBefore }}</template>
        </el-table-column>
        <el-table-column label="调整后" width="100" align="right">
          <template #default="{ row }">{{ row.pointsAfter }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isRevoked" type="info" size="small">已撤销</el-tag>
            <el-tag v-else type="success" size="small">有效</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-if="canRevoke(row)" type="warning" link :icon="RefreshLeft" @click="handleRevoke(row)">
              撤销
            </el-button>
            <span v-else-if="row.isRevoked" class="text-gray-400">已撤销</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="pagination.page" :page-size="pagination.pageSize" :total="total"
        layout="total, prev, pager, next, jumper" @current-change="handlePageChange" class="mt-4" />
    </div>
  </div>
</template>

<style scoped>
.adjustment-logs { padding: 20px; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
.filter-section { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; padding: 16px; background: #fff; border-radius: 8px; }
.log-list { background: #fff; border-radius: 8px; padding: 16px; }
</style>
