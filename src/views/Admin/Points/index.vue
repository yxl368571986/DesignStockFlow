<script setup lang="ts">
/**
 * 积分管理页面
 * 管理积分规则、积分记录、积分商城等
 */
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, Refresh, Setting } from '@element-plus/icons-vue'

interface PointRule {
  id: number
  name: string
  type: 'earn' | 'consume'
  action: string
  points: number
  dailyLimit: number
  status: 'active' | 'inactive'
  description: string
}

interface PointRecord {
  id: number
  userId: number
  username: string
  type: 'earn' | 'consume'
  action: string
  points: number
  balance: number
  remark: string
  createdAt: string
}

const activeTab = ref('rules')
const ruleList = ref<PointRule[]>([])
const ruleLoading = ref(false)
const recordList = ref<PointRecord[]>([])
const recordLoading = ref(false)
const recordTotal = ref(0)

const filterForm = reactive({ keyword: '', type: '' })
const pagination = reactive({ page: 1, pageSize: 10 })

const ruleDialogVisible = ref(false)
const ruleDialogTitle = ref('新增规则')
const ruleForm = reactive<Partial<PointRule>>({
  name: '', type: 'earn', action: '', points: 0, dailyLimit: -1, status: 'active', description: ''
})
const ruleFormRef = ref()
const editingRuleId = ref<number | null>(null)

const statistics = reactive({ totalPoints: 1256800, todayEarned: 3580, todayConsumed: 1200, activeUsers: 892 })

const mockRules: PointRule[] = [
  { id: 1, name: '每日签到', type: 'earn', action: 'daily_checkin', points: 10, dailyLimit: 1, status: 'active', description: '每日签到获得积分' },
  { id: 2, name: '上传资源', type: 'earn', action: 'upload_resource', points: 50, dailyLimit: 5, status: 'active', description: '上传资源审核通过后获得积分' },
  { id: 3, name: '邀请好友', type: 'earn', action: 'invite_friend', points: 100, dailyLimit: 3, status: 'active', description: '邀请好友注册成功获得积分' },
  { id: 4, name: '下载资源', type: 'consume', action: 'download_resource', points: -5, dailyLimit: -1, status: 'active', description: '下载资源消耗积分' },
  { id: 5, name: '兑换VIP', type: 'consume', action: 'exchange_vip', points: -500, dailyLimit: -1, status: 'active', description: '积分兑换VIP会员' }
]

const mockRecords: PointRecord[] = [
  { id: 1, userId: 1001, username: '设计师小王', type: 'earn', action: '每日签到', points: 10, balance: 1580, remark: '签到奖励', createdAt: '2024-01-15 09:00:00' },
  { id: 2, userId: 1002, username: '创意达人', type: 'earn', action: '上传资源', points: 50, balance: 2350, remark: '资源审核通过', createdAt: '2024-01-15 10:30:00' },
  { id: 3, userId: 1003, username: '新手用户', type: 'consume', action: '下载资源', points: -5, balance: 95, remark: '下载《UI设计规范》', createdAt: '2024-01-15 11:00:00' },
  { id: 4, userId: 1001, username: '设计师小王', type: 'consume', action: '兑换VIP', points: -500, balance: 1080, remark: '兑换月度VIP', createdAt: '2024-01-15 14:00:00' }
]

const loadRules = async () => {
  ruleLoading.value = true
  await new Promise(r => setTimeout(r, 500))
  ruleList.value = mockRules
  ruleLoading.value = false
}

const loadRecords = async () => {
  recordLoading.value = true
  await new Promise(r => setTimeout(r, 500))
  let filtered = [...mockRecords]
  if (filterForm.keyword) {
    const kw = filterForm.keyword.toLowerCase()
    filtered = filtered.filter(r => r.username.toLowerCase().includes(kw) || r.action.toLowerCase().includes(kw))
  }
  if (filterForm.type) filtered = filtered.filter(r => r.type === filterForm.type)
  recordTotal.value = filtered.length
  recordList.value = filtered.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize)
  recordLoading.value = false
}

const handleAddRule = () => {
  editingRuleId.value = null
  ruleDialogTitle.value = '新增规则'
  Object.assign(ruleForm, { name: '', type: 'earn', action: '', points: 0, dailyLimit: -1, status: 'active', description: '' })
  ruleDialogVisible.value = true
}

const handleEditRule = (rule: PointRule) => {
  editingRuleId.value = rule.id
  ruleDialogTitle.value = '编辑规则'
  Object.assign(ruleForm, { ...rule })
  ruleDialogVisible.value = true
}

const handleDeleteRule = async (rule: PointRule) => {
  try {
    await ElMessageBox.confirm(`确定要删除规则「${rule.name}」吗？`, '删除确认', { type: 'warning' })
    ruleList.value = ruleList.value.filter(r => r.id !== rule.id)
    ElMessage.success('删除成功')
  } catch { /* 用户取消 */ }
}

const handleSaveRule = async () => {
  try {
    await ruleFormRef.value?.validate()
    if (editingRuleId.value) {
      const idx = ruleList.value.findIndex(r => r.id === editingRuleId.value)
      if (idx > -1) ruleList.value[idx] = { ...ruleList.value[idx], ...ruleForm } as PointRule
      ElMessage.success('更新成功')
    } else {
      ruleList.value.push({ id: Date.now(), ...ruleForm } as PointRule)
      ElMessage.success('新增成功')
    }
    ruleDialogVisible.value = false
  } catch { /* 验证失败 */ }
}

const handleFilter = () => { pagination.page = 1; loadRecords() }
const handleResetFilter = () => { filterForm.keyword = ''; filterForm.type = ''; handleFilter() }
const handlePageChange = (page: number) => { pagination.page = page; loadRecords() }

onMounted(() => { loadRules(); loadRecords() })
</script>

<template>
  <div class="points-management">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon total"><el-icon><Setting /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.totalPoints.toLocaleString() }}</div>
          <div class="stat-label">系统总积分</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon earned"><el-icon><Plus /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value text-green-500">+{{ statistics.todayEarned }}</div>
          <div class="stat-label">今日发放</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon consumed"><el-icon><Setting /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value text-red-500">-{{ statistics.todayConsumed }}</div>
          <div class="stat-label">今日消耗</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon users"><el-icon><Setting /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.activeUsers }}</div>
          <div class="stat-label">活跃用户</div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- 积分规则 -->
      <el-tab-pane label="积分规则" name="rules">
        <div class="toolbar">
          <el-button type="primary" :icon="Plus" @click="handleAddRule">新增规则</el-button>
          <el-button :icon="Refresh" @click="loadRules">刷新</el-button>
        </div>
        <el-table :data="ruleList" v-loading="ruleLoading" stripe>
          <el-table-column prop="name" label="规则名称" width="120" />
          <el-table-column label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="row.type === 'earn' ? 'success' : 'danger'" size="small">
                {{ row.type === 'earn' ? '获取' : '消耗' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="action" label="行为标识" width="150" />
          <el-table-column label="积分" width="100">
            <template #default="{ row }">
              <span :class="row.points > 0 ? 'text-green-500' : 'text-red-500'">
                {{ row.points > 0 ? '+' : '' }}{{ row.points }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="每日限制" width="100">
            <template #default="{ row }">{{ row.dailyLimit === -1 ? '无限' : row.dailyLimit + '次' }}</template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                {{ row.status === 'active' ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link :icon="Edit" @click="handleEditRule(row)">编辑</el-button>
              <el-button type="danger" link :icon="Delete" @click="handleDeleteRule(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 积分记录 -->
      <el-tab-pane label="积分记录" name="records">
        <div class="toolbar">
          <el-input v-model="filterForm.keyword" placeholder="搜索用户名/行为" clearable style="width: 200px" :prefix-icon="Search" />
          <el-select v-model="filterForm.type" placeholder="类型" clearable style="width: 100px">
            <el-option label="获取" value="earn" />
            <el-option label="消耗" value="consume" />
          </el-select>
          <el-button type="primary" @click="handleFilter">筛选</el-button>
          <el-button @click="handleResetFilter">重置</el-button>
        </div>
        <el-table :data="recordList" v-loading="recordLoading" stripe>
          <el-table-column prop="username" label="用户" width="120" />
          <el-table-column label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="row.type === 'earn' ? 'success' : 'danger'" size="small">
                {{ row.type === 'earn' ? '获取' : '消耗' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="action" label="行为" width="120" />
          <el-table-column label="积分变动" width="100">
            <template #default="{ row }">
              <span :class="row.points > 0 ? 'text-green-500' : 'text-red-500'">
                {{ row.points > 0 ? '+' : '' }}{{ row.points }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="balance" label="余额" width="100" />
          <el-table-column prop="remark" label="备注" min-width="150" />
          <el-table-column prop="createdAt" label="时间" width="170" />
        </el-table>
        <el-pagination v-model:current-page="pagination.page" :page-size="pagination.pageSize" :total="recordTotal"
          layout="total, prev, pager, next" @current-change="handlePageChange" class="mt-4" />
      </el-tab-pane>
    </el-tabs>

    <!-- 规则编辑对话框 -->
    <el-dialog v-model="ruleDialogVisible" :title="ruleDialogTitle" width="500px">
      <el-form ref="ruleFormRef" :model="ruleForm" label-width="100px">
        <el-form-item label="规则名称" prop="name" :rules="[{ required: true, message: '请输入规则名称' }]">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="ruleForm.type">
            <el-radio value="earn">获取积分</el-radio>
            <el-radio value="consume">消耗积分</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="行为标识" prop="action" :rules="[{ required: true, message: '请输入行为标识' }]">
          <el-input v-model="ruleForm.action" placeholder="如: daily_checkin" />
        </el-form-item>
        <el-form-item label="积分值" prop="points">
          <el-input-number v-model="ruleForm.points" />
        </el-form-item>
        <el-form-item label="每日限制" prop="dailyLimit">
          <el-input-number v-model="ruleForm.dailyLimit" :min="-1" />
          <span class="ml-2 text-gray-500">-1表示无限</span>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="ruleForm.description" type="textarea" rows="2" placeholder="规则描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="ruleForm.status" active-value="active" inactive-value="inactive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.points-management { padding: 20px; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 8px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #fff; }
.stat-icon.total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.earned { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.stat-icon.consumed { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.users { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-value { font-size: 24px; font-weight: 600; color: #1f2937; }
.stat-label { font-size: 14px; color: #6b7280; margin-top: 4px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.main-tabs { background: #fff; border-radius: 8px; padding: 16px; }
</style>
