<script setup lang="ts">
/**
 * VIP会员管理页面
 * 管理VIP套餐、会员订单、会员权益等
 */
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, View, Refresh, Money } from '@element-plus/icons-vue'

interface VIPPackage {
  id: number
  name: string
  price: number
  originalPrice: number
  duration: number
  downloadLimit: number
  features: string[]
  status: 'active' | 'inactive'
  sortOrder: number
  createdAt: string
}

interface VIPOrder {
  id: number
  orderNo: string
  userId: number
  username: string
  packageName: string
  amount: number
  paymentMethod: 'alipay' | 'wechat' | 'balance'
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  createdAt: string
  paidAt: string | null
}

const activeTab = ref('packages')
const packageList = ref<VIPPackage[]>([])
const packageLoading = ref(false)
const orderList = ref<VIPOrder[]>([])
const orderLoading = ref(false)
const orderTotal = ref(0)

const filterForm = reactive({ keyword: '', status: '', paymentMethod: '' })
const pagination = reactive({ page: 1, pageSize: 10 })

const packageDialogVisible = ref(false)
const packageDialogTitle = ref('新增套餐')
const packageForm = reactive<Partial<VIPPackage>>({
  name: '', price: 0, originalPrice: 0, duration: 30,
  downloadLimit: -1, features: [], status: 'active', sortOrder: 0
})
const packageFormRef = ref()
const editingPackageId = ref<number | null>(null)
const newFeature = ref('')

const statistics = reactive({
  totalMembers: 1256, activeMembers: 892,
  monthlyRevenue: 15680.5, totalRevenue: 186520.8
})

const mockPackages: VIPPackage[] = [
  { id: 1, name: '月度会员', price: 29.9, originalPrice: 49.9, duration: 30, downloadLimit: 50,
    features: ['每日50次下载', '高清无水印', '专属客服'], status: 'active', sortOrder: 1, createdAt: '2024-01-01' },
  { id: 2, name: '季度会员', price: 79.9, originalPrice: 149.7, duration: 90, downloadLimit: 100,
    features: ['每日100次下载', '高清无水印', '专属客服', '专属标识'], status: 'active', sortOrder: 2, createdAt: '2024-01-01' },
  { id: 3, name: '年度会员', price: 199.9, originalPrice: 598.8, duration: 365, downloadLimit: -1,
    features: ['无限下载', '高清无水印', '专属客服', '专属标识', '生日礼包'], status: 'active', sortOrder: 3, createdAt: '2024-01-01' }
]

const mockOrders: VIPOrder[] = [
  { id: 1, orderNo: 'VIP202401150001', userId: 1001, username: '设计师小王', packageName: '季度会员',
    amount: 79.9, paymentMethod: 'alipay', status: 'paid', createdAt: '2024-01-15 14:30:00', paidAt: '2024-01-15 14:31:25' },
  { id: 2, orderNo: 'VIP202401150002', userId: 1002, username: '创意达人', packageName: '年度会员',
    amount: 199.9, paymentMethod: 'wechat', status: 'paid', createdAt: '2024-01-15 15:20:00', paidAt: '2024-01-15 15:21:10' },
  { id: 3, orderNo: 'VIP202401150003', userId: 1003, username: '新手用户', packageName: '月度会员',
    amount: 29.9, paymentMethod: 'balance', status: 'pending', createdAt: '2024-01-15 16:00:00', paidAt: null }
]

const loadPackages = async () => {
  packageLoading.value = true
  await new Promise(r => setTimeout(r, 500))
  packageList.value = mockPackages
  packageLoading.value = false
}

const loadOrders = async () => {
  orderLoading.value = true
  await new Promise(r => setTimeout(r, 500))
  let filtered = [...mockOrders]
  if (filterForm.keyword) {
    const kw = filterForm.keyword.toLowerCase()
    filtered = filtered.filter(o => o.orderNo.toLowerCase().includes(kw) || o.username.toLowerCase().includes(kw))
  }
  if (filterForm.status) filtered = filtered.filter(o => o.status === filterForm.status)
  if (filterForm.paymentMethod) filtered = filtered.filter(o => o.paymentMethod === filterForm.paymentMethod)
  orderTotal.value = filtered.length
  orderList.value = filtered.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize)
  orderLoading.value = false
}

const handleAddPackage = () => {
  editingPackageId.value = null
  packageDialogTitle.value = '新增套餐'
  Object.assign(packageForm, { name: '', price: 0, originalPrice: 0, duration: 30, downloadLimit: -1, features: [], status: 'active', sortOrder: packageList.value.length + 1 })
  packageDialogVisible.value = true
}

const handleEditPackage = (pkg: VIPPackage) => {
  editingPackageId.value = pkg.id
  packageDialogTitle.value = '编辑套餐'
  Object.assign(packageForm, { ...pkg, features: [...pkg.features] })
  packageDialogVisible.value = true
}

const handleDeletePackage = async (pkg: VIPPackage) => {
  try {
    await ElMessageBox.confirm(`确定要删除套餐「${pkg.name}」吗？`, '删除确认', { type: 'warning' })
    packageList.value = packageList.value.filter(p => p.id !== pkg.id)
    ElMessage.success('删除成功')
  } catch { /* 用户取消 */ }
}

const handleSavePackage = async () => {
  try {
    await packageFormRef.value?.validate()
    if (editingPackageId.value) {
      const idx = packageList.value.findIndex(p => p.id === editingPackageId.value)
      if (idx > -1) packageList.value[idx] = { ...packageList.value[idx], ...packageForm } as VIPPackage
      ElMessage.success('更新成功')
    } else {
      packageList.value.push({ id: Date.now(), ...packageForm, createdAt: new Date().toISOString() } as VIPPackage)
      ElMessage.success('新增成功')
    }
    packageDialogVisible.value = false
  } catch { /* 验证失败 */ }
}

const handleAddFeature = () => {
  if (newFeature.value.trim()) {
    if (!packageForm.features) packageForm.features = []
    packageForm.features.push(newFeature.value.trim())
    newFeature.value = ''
  }
}

const handleRemoveFeature = (index: number) => { packageForm.features?.splice(index, 1) }

const handleFilter = () => { pagination.page = 1; loadOrders() }
const handleResetFilter = () => { filterForm.keyword = ''; filterForm.status = ''; filterForm.paymentMethod = ''; handleFilter() }
const handlePageChange = (page: number) => { pagination.page = page; loadOrders() }

const getPaymentMethodText = (m: string) => ({ alipay: '支付宝', wechat: '微信', balance: '余额' }[m] || m)
const getOrderStatusText = (s: string) => ({ pending: '待支付', paid: '已支付', cancelled: '已取消', refunded: '已退款' }[s] || s)
const getOrderStatusType = (s: string) => ({ pending: 'warning', paid: 'success', cancelled: 'info', refunded: 'danger' }[s] || 'info') as 'warning' | 'success' | 'info' | 'danger'

const handleViewOrder = (order: VIPOrder) => {
  ElMessageBox.alert(`订单号：${order.orderNo}<br>用户：${order.username}<br>套餐：${order.packageName}<br>金额：¥${order.amount}<br>状态：${getOrderStatusText(order.status)}`, '订单详情', { dangerouslyUseHTMLString: true })
}

const handleRefund = async (order: VIPOrder) => {
  try {
    await ElMessageBox.confirm(`确定要为订单「${order.orderNo}」办理退款吗？`, '退款确认', { type: 'warning' })
    order.status = 'refunded'
    ElMessage.success('退款成功')
  } catch { /* 用户取消 */ }
}

onMounted(() => { loadPackages(); loadOrders() })
</script>

<template>
  <div class="vip-management">
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon members">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.totalMembers }}</div>
          <div class="stat-label">累计会员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.activeMembers }}</div>
          <div class="stat-label">活跃会员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon monthly">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">¥{{ statistics.monthlyRevenue.toLocaleString() }}</div>
          <div class="stat-label">本月收入</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">¥{{ statistics.totalRevenue.toLocaleString() }}</div>
          <div class="stat-label">累计收入</div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="main-tabs">
      <el-tab-pane label="套餐管理" name="packages">
        <div class="toolbar">
          <el-button type="primary" :icon="Plus" @click="handleAddPackage">新增套餐</el-button>
          <el-button :icon="Refresh" @click="loadPackages">刷新</el-button>
        </div>
        <el-table :data="packageList" v-loading="packageLoading" stripe>
          <el-table-column prop="name" label="套餐名称" width="120" />
          <el-table-column label="价格" width="150">
            <template #default="{ row }">
              <span class="price">¥{{ row.price }}</span>
              <span class="original-price">¥{{ row.originalPrice }}</span>
            </template>
          </el-table-column>
          <el-table-column label="时长" width="100">
            <template #default="{ row }">{{ row.duration === -1 ? '永久' : row.duration + '天' }}</template>
          </el-table-column>
          <el-table-column label="下载限制" width="100">
            <template #default="{ row }">{{ row.downloadLimit === -1 ? '无限' : row.downloadLimit + '次/日' }}</template>
          </el-table-column>
          <el-table-column label="特权" min-width="200">
            <template #default="{ row }">
              <el-tag v-for="f in row.features" :key="f" size="small" class="mr-1 mb-1">{{ f }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status === 'active' ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link :icon="Edit" @click="handleEditPackage(row)">编辑</el-button>
              <el-button type="danger" link :icon="Delete" @click="handleDeletePackage(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="订单管理" name="orders">
        <div class="toolbar">
          <el-input v-model="filterForm.keyword" placeholder="搜索订单号/用户名" clearable style="width: 200px" :prefix-icon="Search" />
          <el-select v-model="filterForm.status" placeholder="订单状态" clearable style="width: 120px">
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已退款" value="refunded" />
          </el-select>
          <el-select v-model="filterForm.paymentMethod" placeholder="支付方式" clearable style="width: 120px">
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信" value="wechat" />
            <el-option label="余额" value="balance" />
          </el-select>
          <el-button type="primary" @click="handleFilter">筛选</el-button>
          <el-button @click="handleResetFilter">重置</el-button>
        </div>
        <el-table :data="orderList" v-loading="orderLoading" stripe>
          <el-table-column prop="orderNo" label="订单号" width="180" />
          <el-table-column prop="username" label="用户" width="120" />
          <el-table-column prop="packageName" label="套餐" width="100" />
          <el-table-column label="金额" width="100">
            <template #default="{ row }"><span class="price">¥{{ row.amount }}</span></template>
          </el-table-column>
          <el-table-column label="支付方式" width="100">
            <template #default="{ row }">{{ getPaymentMethodText(row.paymentMethod) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getOrderStatusType(row.status)">{{ getOrderStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="170" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link :icon="View" @click="handleViewOrder(row)">详情</el-button>
              <el-button v-if="row.status === 'paid'" type="warning" link @click="handleRefund(row)">退款</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="orderTotal"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
          class="mt-4"
        />
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="packageDialogVisible" :title="packageDialogTitle" width="500px">
      <el-form ref="packageFormRef" :model="packageForm" label-width="100px">
        <el-form-item label="套餐名称" prop="name" :rules="[{ required: true, message: '请输入套餐名称' }]">
          <el-input v-model="packageForm.name" placeholder="请输入套餐名称" />
        </el-form-item>
        <el-form-item label="售价" prop="price" :rules="[{ required: true, message: '请输入售价' }]">
          <el-input-number v-model="packageForm.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="原价" prop="originalPrice">
          <el-input-number v-model="packageForm.originalPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="时长(天)" prop="duration">
          <el-input-number v-model="packageForm.duration" :min="-1" />
          <span class="ml-2 text-gray-500">-1表示永久</span>
        </el-form-item>
        <el-form-item label="下载限制" prop="downloadLimit">
          <el-input-number v-model="packageForm.downloadLimit" :min="-1" />
          <span class="ml-2 text-gray-500">-1表示无限</span>
        </el-form-item>
        <el-form-item label="特权">
          <div class="w-full">
            <el-tag
              v-for="(f, i) in packageForm.features"
              :key="i"
              closable
              @close="handleRemoveFeature(i)"
              class="mr-1 mb-1"
            >{{ f }}</el-tag>
            <div class="flex gap-2 mt-2">
              <el-input v-model="newFeature" placeholder="输入特权" size="small" style="width: 150px" @keyup.enter="handleAddFeature" />
              <el-button size="small" @click="handleAddFeature">添加</el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="packageForm.status" active-value="active" inactive-value="inactive" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="packageDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePackage">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.vip-management { padding: 20px; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 8px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #fff; }
.stat-icon.members { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.active { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.stat-icon.monthly { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.total { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-value { font-size: 24px; font-weight: 600; color: #1f2937; }
.stat-label { font-size: 14px; color: #6b7280; margin-top: 4px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.price { color: #f56c6c; font-weight: 600; }
.original-price { color: #999; text-decoration: line-through; margin-left: 8px; font-size: 12px; }
.main-tabs { background: #fff; border-radius: 8px; padding: 16px; }
</style>
