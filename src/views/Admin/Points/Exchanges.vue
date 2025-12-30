<template>
  <div class="points-exchanges-page">
    <div class="page-header">
      <h2>兑换记录管理</h2>
      <div class="header-actions">
        <el-input v-model="searchKeyword" placeholder="搜索用户/商品" clearable style="width: 200px" @clear="handleSearch" @keyup.enter="handleSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="handleExport">导出记录</el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="兑换状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待发货" value="pending" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品分类">
          <el-select v-model="filterForm.category" placeholder="全部分类" clearable style="width: 120px">
            <el-option label="虚拟商品" value="虚拟商品" />
            <el-option label="实物商品" value="实物商品" />
            <el-option label="优惠券" value="优惠券" />
            <el-option label="会员特权" value="会员特权" />
          </el-select>
        </el-form-item>
        <el-form-item label="兑换时间">
          <el-date-picker v-model="filterForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 兑换记录列表 -->
    <el-card class="exchanges-card">
      <el-table :data="exchangesList" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="兑换单号" width="180" />
        <el-table-column prop="userName" label="用户" width="120" />
        <el-table-column prop="productName" label="商品名称" min-width="150" />
        <el-table-column prop="category" label="商品分类" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="消耗积分" width="100" align="center">
          <template #default="{ row }">
            <span class="points-text">-{{ row.points }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="兑换时间" width="170" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button v-if="row.status === 'pending'" type="success" link @click="handleShip(row)">发货</el-button>
            <el-button v-if="row.status === 'pending'" type="danger" link @click="handleCancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="兑换详情" width="600px">
      <el-descriptions :column="2" border v-if="currentExchange">
        <el-descriptions-item label="兑换单号">{{ currentExchange.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentExchange.userName }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ currentExchange.productName }}</el-descriptions-item>
        <el-descriptions-item label="商品分类">{{ currentExchange.category }}</el-descriptions-item>
        <el-descriptions-item label="消耗积分">{{ currentExchange.points }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentExchange.quantity }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentExchange.status)">{{ getStatusName(currentExchange.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="兑换时间">{{ currentExchange.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2" v-if="currentExchange.category === '实物商品'">{{ currentExchange.address || '无' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentExchange.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 兑换记录管理页面
 * 管理用户的积分兑换记录
 */
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Exchange {
  id: string
  orderNo: string
  userId: string
  userName: string
  productId: string
  productName: string
  category: string
  points: number
  quantity: number
  status: string
  address?: string
  remark?: string
  createdAt: string
}

const loading = ref(false)
const searchKeyword = ref('')
const detailVisible = ref(false)
const currentExchange = ref<Exchange | null>(null)

const filterForm = reactive({
  status: '',
  category: '',
  dateRange: null as [Date, Date] | null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 100
})

// 兑换记录列表（模拟数据）
const exchangesList = ref<Exchange[]>([
  { id: '1', orderNo: 'EX202412290001', userId: 'u1', userName: '张三', productId: 'p1', productName: 'VIP月卡', category: '会员特权', points: 1000, quantity: 1, status: 'completed', createdAt: '2024-12-29 10:30:00' },
  { id: '2', orderNo: 'EX202412290002', userId: 'u2', userName: '李四', productId: 'p2', productName: '10元优惠券', category: '优惠券', points: 500, quantity: 2, status: 'completed', createdAt: '2024-12-29 11:20:00' },
  { id: '3', orderNo: 'EX202412290003', userId: 'u3', userName: '王五', productId: 'p3', productName: '精美鼠标垫', category: '实物商品', points: 2000, quantity: 1, status: 'pending', address: '北京市朝阳区xxx街道xxx号', createdAt: '2024-12-29 14:15:00' },
  { id: '4', orderNo: 'EX202412290004', userId: 'u4', userName: '赵六', productId: 'p4', productName: '下载次数+10', category: '虚拟商品', points: 300, quantity: 1, status: 'completed', createdAt: '2024-12-29 15:45:00' },
  { id: '5', orderNo: 'EX202412290005', userId: 'u5', userName: '钱七', productId: 'p3', productName: '精美鼠标垫', category: '实物商品', points: 2000, quantity: 1, status: 'shipped', address: '上海市浦东新区xxx路xxx号', createdAt: '2024-12-28 09:30:00' }
])

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = { pending: 'warning', shipped: 'primary', completed: 'success', cancelled: 'info' }
  return typeMap[status] || 'info'
}

const getStatusName = (status: string) => {
  const nameMap: Record<string, string> = { pending: '待发货', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
  return nameMap[status] || status
}

const handleSearch = () => {
  pagination.page = 1
  // 执行搜索
}

const handleReset = () => {
  filterForm.status = ''
  filterForm.category = ''
  filterForm.dateRange = null
  searchKeyword.value = ''
  handleSearch()
}

const handleView = (row: Exchange) => {
  currentExchange.value = row
  detailVisible.value = true
}

const handleShip = async (row: Exchange) => {
  await ElMessageBox.confirm('确定要发货吗？', '提示', { type: 'warning' })
  row.status = 'shipped'
  ElMessage.success('发货成功')
}

const handleCancel = async (row: Exchange) => {
  await ElMessageBox.confirm('确定要取消该兑换订单吗？积分将退还给用户。', '提示', { type: 'warning' })
  row.status = 'cancelled'
  ElMessage.success('已取消，积分已退还')
}

const handleExport = () => {
  ElMessage.success('导出功能开发中')
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  handleSearch()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  // 加载数据
}

onMounted(() => {
  // 加载兑换记录
})
</script>

<style scoped lang="scss">
.points-exchanges-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    h2 { margin: 0; font-size: 20px; }
    .header-actions { display: flex; gap: 12px; }
  }
  .filter-card { margin-bottom: 20px; }
  .exchanges-card { margin-bottom: 20px; }
  .points-text { color: #f56c6c; font-weight: 600; }
  .pagination-wrapper { margin-top: 20px; display: flex; justify-content: flex-end; }
}
</style>
