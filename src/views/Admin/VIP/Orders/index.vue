<script setup lang="ts">
/**
 * VIP订单管理页面
 */
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View, RefreshLeft } from '@element-plus/icons-vue'
import { getVipOrders, getVipOrderById, refundVipOrder, type VipOrder } from '@/api/vip'

const loading = ref(false)
const orderList = ref<VipOrder[]>([])
const total = ref(0)

// 筛选条件
const filters = reactive({
  paymentStatus: -1,
  paymentMethod: '',
  startDate: '',
  endDate: '',
  pageNum: 1,
  pageSize: 10
})

// 日期范围
const dateRange = ref<[string, string] | null>(null)

// 订单详情对话框
const detailVisible = ref(false)
const currentOrder = ref<VipOrder | null>(null)
const detailLoading = ref(false)

// 退款对话框
const refundVisible = ref(false)
const refundForm = reactive({
  orderId: '',
  orderNo: '',
  reason: ''
})
const refundLoading = ref(false)

// 支付状态选项
const paymentStatusOptions = [
  { label: '全部', value: -1 },
  { label: '待支付', value: 0 },
  { label: '已支付', value: 1 },
  { label: '已退款', value: 2 },
  { label: '已取消', value: 3 }
]

// 支付方式选项
const paymentMethodOptions = [
  { label: '全部', value: '' },
  { label: '支付宝', value: 'alipay' },
  { label: '微信支付', value: 'wechat' },
  { label: '积分兑换', value: 'points' }
]

// 加载订单列表
const loadOrders = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: filters.pageNum,
      pageSize: filters.pageSize,
      paymentStatus: filters.paymentStatus === -1 ? undefined : filters.paymentStatus,
      paymentMethod: filters.paymentMethod || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    }
    const res = await getVipOrders(params)
    if (res.code === 200 && res.data) {
      orderList.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('加载订单列表失败:', error)
    ElMessage.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  filters.pageNum = 1
  if (dateRange.value) {
    filters.startDate = dateRange.value[0]
    filters.endDate = dateRange.value[1]
  } else {
    filters.startDate = ''
    filters.endDate = ''
  }
  loadOrders()
}

// 重置筛选
const handleReset = () => {
  filters.paymentStatus = -1
  filters.paymentMethod = ''
  filters.startDate = ''
  filters.endDate = ''
  filters.pageNum = 1
  dateRange.value = null
  loadOrders()
}

// 分页变化
const handlePageChange = (page: number) => {
  filters.pageNum = page
  loadOrders()
}

const handleSizeChange = (size: number) => {
  filters.pageSize = size
  filters.pageNum = 1
  loadOrders()
}

// 查看订单详情
const handleViewDetail = async (row: VipOrder) => {
  detailLoading.value = true
  detailVisible.value = true
  try {
    const res = await getVipOrderById(row.orderId)
    if (res.code === 200) {
      currentOrder.value = res.data
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  } finally {
    detailLoading.value = false
  }
}

// 打开退款对话框
const handleRefund = (row: VipOrder) => {
  if (row.paymentStatus !== 1) {
    ElMessage.warning('只有已支付的订单才能退款')
    return
  }
  refundForm.orderId = row.orderId
  refundForm.orderNo = row.orderNo
  refundForm.reason = ''
  refundVisible.value = true
}

// 确认退款
const confirmRefund = async () => {
  if (!refundForm.reason.trim()) {
    ElMessage.warning('请输入退款原因')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要对订单「${refundForm.orderNo}」进行退款吗？此操作不可撤销。`,
      '退款确认',
      { type: 'warning' }
    )
    
    refundLoading.value = true
    const res = await refundVipOrder(refundForm.orderId, refundForm.reason)
    if (res.code === 200) {
      ElMessage.success('退款成功')
      refundVisible.value = false
      loadOrders()
    } else {
      ElMessage.error(res.msg || '退款失败')
    }
  } catch {
    // 用户取消
  } finally {
    refundLoading.value = false
  }
}

// 格式化支付状态
const formatPaymentStatus = (status: number) => {
  const map: Record<number, { text: string; type: string }> = {
    0: { text: '待支付', type: 'warning' },
    1: { text: '已支付', type: 'success' },
    2: { text: '已退款', type: 'info' },
    3: { text: '已取消', type: 'danger' }
  }
  return map[status] || { text: '未知', type: 'info' }
}

// 格式化支付方式
const formatPaymentMethod = (method: string) => {
  const map: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    points: '积分兑换'
  }
  return map[method] || method
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div class="orders-page">
    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-select
        v-model="filters.paymentStatus"
        placeholder="支付状态"
        clearable
        style="width: 120px"
      >
        <el-option
          v-for="item in paymentStatusOptions"
          :key="String(item.value)"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      
      <el-select
        v-model="filters.paymentMethod"
        placeholder="支付方式"
        clearable
        style="width: 120px"
      >
        <el-option
          v-for="item in paymentMethodOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 260px"
      />
      
      <el-button
        type="primary"
        :icon="Search"
        @click="handleSearch"
      >
        搜索
      </el-button>
      <el-button
        :icon="Refresh"
        @click="handleReset"
      >
        重置
      </el-button>
    </div>

    <!-- 订单列表 -->
    <el-table
      v-loading="loading"
      :data="orderList"
      stripe
      border
    >
      <el-table-column
        prop="orderNo"
        label="订单号"
        width="180"
      />
      <el-table-column
        prop="packageName"
        label="套餐名称"
        width="120"
      />
      <el-table-column
        label="金额"
        width="100"
      >
        <template #default="{ row }">
          <span class="amount">¥{{ row.amount }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="支付方式"
        width="100"
      >
        <template #default="{ row }">
          {{ formatPaymentMethod(row.paymentMethod) }}
        </template>
      </el-table-column>
      <el-table-column
        label="支付状态"
        width="100"
      >
        <template #default="{ row }">
          <el-tag :type="formatPaymentStatus(row.paymentStatus).type as any">
            {{ formatPaymentStatus(row.paymentStatus).text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="支付时间"
        width="180"
      >
        <template #default="{ row }">
          {{ formatDate(row.paidAt) }}
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        width="180"
      >
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="150"
        fixed="right"
      >
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
            v-if="row.paymentStatus === 1"
            type="warning"
            link
            :icon="RefreshLeft"
            @click="handleRefund(row)"
          >
            退款
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="filters.pageNum"
        v-model:page-size="filters.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="订单详情"
      width="500px"
    >
      <div
        v-loading="detailLoading"
        class="order-detail"
      >
        <template v-if="currentOrder">
          <div class="detail-item">
            <span class="label">订单号：</span>
            <span class="value">{{ currentOrder.orderNo }}</span>
          </div>
          <div class="detail-item">
            <span class="label">套餐名称：</span>
            <span class="value">{{ currentOrder.packageName }}</span>
          </div>
          <div class="detail-item">
            <span class="label">订单金额：</span>
            <span class="value amount">¥{{ currentOrder.amount }}</span>
          </div>
          <div class="detail-item">
            <span class="label">支付方式：</span>
            <span class="value">{{ formatPaymentMethod(currentOrder.paymentMethod) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">支付状态：</span>
            <el-tag :type="formatPaymentStatus(currentOrder.paymentStatus).type as any">
              {{ formatPaymentStatus(currentOrder.paymentStatus).text }}
            </el-tag>
          </div>
          <div class="detail-item">
            <span class="label">交易流水号：</span>
            <span class="value">{{ currentOrder.transactionId || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">支付时间：</span>
            <span class="value">{{ formatDate(currentOrder.paidAt) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">创建时间：</span>
            <span class="value">{{ formatDate(currentOrder.createdAt) }}</span>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- 退款对话框 -->
    <el-dialog
      v-model="refundVisible"
      title="订单退款"
      width="400px"
    >
      <el-form label-width="80px">
        <el-form-item label="订单号">
          <span>{{ refundForm.orderNo }}</span>
        </el-form-item>
        <el-form-item
          label="退款原因"
          required
        >
          <el-input
            id="refund-reason"
            v-model="refundForm.reason"
            name="refundReason"
            type="textarea"
            :rows="3"
            placeholder="请输入退款原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="refundLoading"
          @click="confirmRefund"
        >
          确认退款
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.orders-page {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.order-detail {
  min-height: 200px;
}

.detail-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  width: 100px;
  color: #666;
  flex-shrink: 0;
}

.detail-item .value {
  flex: 1;
  color: #333;
}
</style>
