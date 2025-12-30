<script setup lang="ts">
/**
 * 充值订单管理页面
 * 查看和管理用户充值订单
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Refresh, View } from '@element-plus/icons-vue';
import { getRechargeOrders, getRechargeOrderDetail } from '@/api/adminRecharge';
import type { RechargeOrder } from '@/api/recharge';

// 订单列表
const orders = ref<RechargeOrder[]>([]);
const loading = ref(false);
const total = ref(0);

// 筛选条件
const filterForm = reactive({
  orderNo: '',
  userId: '',
  status: undefined as number | undefined,
  startDate: '',
  endDate: ''
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10
});

// 订单详情弹窗
const detailVisible = ref(false);
const detailLoading = ref(false);
const currentOrder = ref<RechargeOrder | null>(null);

// 支付状态映射
const statusMap: Record<number, { text: string; type: string }> = {
  0: { text: '待支付', type: 'warning' },
  1: { text: '已支付', type: 'success' },
  2: { text: '已取消', type: 'info' },
  3: { text: '已过期', type: 'danger' }
};

/** 加载订单列表 */
async function loadOrders(): Promise<void> {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      pageNum: pagination.page,
      orderNo: filterForm.orderNo || undefined,
      userId: filterForm.userId || undefined,
      status: filterForm.status,
      startDate: filterForm.startDate || undefined,
      endDate: filterForm.endDate || undefined
    };

    const res = await getRechargeOrders(params);
    if (res.code === 200 || res.code === 0) {
      orders.value = res.data?.list || [];
      total.value = res.data?.total || 0;
    } else {
      ElMessage.error(res.message || '加载订单失败');
    }
  } catch (error) {
    console.error('加载订单失败:', error);
    ElMessage.error('加载订单失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

/** 筛选 */
function handleFilter(): void {
  pagination.page = 1;
  loadOrders();
}

/** 重置筛选 */
function handleReset(): void {
  filterForm.orderNo = '';
  filterForm.userId = '';
  filterForm.status = undefined;
  filterForm.startDate = '';
  filterForm.endDate = '';
  handleFilter();
}

/** 分页变化 */
function handlePageChange(page: number): void {
  pagination.page = page;
  loadOrders();
}

/** 查看订单详情 */
async function handleViewDetail(order: RechargeOrder): Promise<void> {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    const res = await getRechargeOrderDetail(order.orderId);
    if (res.code === 200 || res.code === 0) {
      currentOrder.value = res.data;
    } else {
      currentOrder.value = order;
    }
  } catch (error) {
    console.error('获取订单详情失败:', error);
    currentOrder.value = order;
  } finally {
    detailLoading.value = false;
  }
}

/** 格式化时间 */
function formatTime(time: string | undefined): string {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

/** 获取状态信息 */
function getStatus(status: number): { text: string; type: string } {
  return statusMap[status] || { text: '未知', type: 'info' };
}

onMounted(() => { loadOrders(); });
</script>

<template>
  <div class="recharge-orders">
    <div class="page-header">
      <h2 class="page-title">充值订单管理</h2>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-input v-model="filterForm.orderNo" placeholder="订单号" clearable style="width: 180px" />
      <el-input v-model="filterForm.userId" placeholder="用户ID" clearable style="width: 180px" />
      <el-select v-model="filterForm.status" placeholder="支付状态" clearable style="width: 120px">
        <el-option label="待支付" :value="0" />
        <el-option label="已支付" :value="1" />
        <el-option label="已取消" :value="2" />
        <el-option label="已过期" :value="3" />
      </el-select>
      <el-date-picker v-model="filterForm.startDate" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" style="width: 150px" />
      <el-date-picker v-model="filterForm.endDate" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 150px" />
      <el-button type="primary" :icon="Search" @click="handleFilter">搜索</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <!-- 订单列表 -->
    <div class="order-list">
      <el-table :data="orders" v-loading="loading" stripe border>
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column prop="userId" label="用户ID" width="120" show-overflow-tooltip />
        <el-table-column prop="packageName" label="套餐" width="120" />
        <el-table-column label="金额" width="100" align="right">
          <template #default="{ row }"><span class="amount">¥{{ row.amount }}</span></template>
        </el-table-column>
        <el-table-column label="积分" width="100" align="right">
          <template #default="{ row }"><span class="points">{{ row.totalPoints }}</span></template>
        </el-table-column>
        <el-table-column label="支付方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.paymentMethod === 'wechat' ? 'success' : 'primary'">
              {{ row.paymentMethod === 'wechat' ? '微信' : '支付宝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatus(row.paymentStatus).type as any" size="small">
              {{ getStatus(row.paymentStatus).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="支付时间" width="170">
          <template #default="{ row }">{{ formatTime(row.paidAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="handleViewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="pagination.page" :page-size="pagination.pageSize" :total="total"
        layout="total, prev, pager, next, jumper" @current-change="handlePageChange" class="mt-4" />
    </div>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="600px">
      <div v-loading="detailLoading" class="order-detail">
        <template v-if="currentOrder">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号" :span="2">{{ currentOrder.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ currentOrder.userId }}</el-descriptions-item>
            <el-descriptions-item label="套餐名称">{{ currentOrder.packageName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="支付金额">
              <span class="amount">¥{{ currentOrder.amount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="获得积分">
              <span class="points">{{ currentOrder.totalPoints }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="基础积分">{{ currentOrder.basePoints }}</el-descriptions-item>
            <el-descriptions-item label="赠送积分">{{ currentOrder.bonusPoints }}</el-descriptions-item>
            <el-descriptions-item label="支付方式">
              {{ currentOrder.paymentMethod === 'wechat' ? '微信支付' : '支付宝' }}
            </el-descriptions-item>
            <el-descriptions-item label="支付状态">
              <el-tag :type="getStatus(currentOrder.paymentStatus).type as any">
                {{ getStatus(currentOrder.paymentStatus).text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="交易号" :span="2">{{ currentOrder.transactionId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(currentOrder.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="过期时间">{{ formatTime(currentOrder.expireAt) }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ formatTime(currentOrder.paidAt) }}</el-descriptions-item>
            <el-descriptions-item label="取消时间">{{ formatTime(currentOrder.cancelledAt) }}</el-descriptions-item>
            <el-descriptions-item v-if="currentOrder.cancelReason" label="取消原因" :span="2">
              {{ currentOrder.cancelReason }}
            </el-descriptions-item>
          </el-descriptions>
        </template>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.recharge-orders { padding: 20px; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
.filter-section { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; padding: 16px; background: #fff; border-radius: 8px; }
.order-list { background: #fff; border-radius: 8px; padding: 16px; }
.amount { font-weight: 600; color: #f56c6c; }
.points { font-weight: 600; color: #409eff; }
.order-detail { padding: 10px 0; }
</style>
