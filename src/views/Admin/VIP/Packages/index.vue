<script setup lang="ts">
/**
 * VIP套餐管理页面
 */
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Refresh } from '@element-plus/icons-vue'
import {
  getAllVipPackages,
  createVipPackage,
  updateVipPackage,
  deleteVipPackage,
  type VipPackage
} from '@/api/vip'

const loading = ref(false)
const packageList = ref<VipPackage[]>([])

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增套餐')
const editingId = ref<string | null>(null)
const formRef = ref()
const formData = reactive({
  packageName: '',
  packageCode: '',
  durationDays: 30,
  originalPrice: 0,
  currentPrice: 0,
  description: '',
  sortOrder: 0,
  status: 1
})

const formRules = {
  packageName: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  packageCode: [{ required: true, message: '请输入套餐编码', trigger: 'blur' }],
  durationDays: [{ required: true, message: '请输入有效天数', trigger: 'blur' }],
  currentPrice: [{ required: true, message: '请输入当前价格', trigger: 'blur' }]
}

// 加载套餐列表
const loadPackages = async () => {
  loading.value = true
  try {
    const res = await getAllVipPackages()
    if (res.code === 200) {
      packageList.value = res.data || []
    }
  } catch (error) {
    console.error('加载套餐列表失败:', error)
    ElMessage.error('加载套餐列表失败')
  } finally {
    loading.value = false
  }
}

// 打开新增对话框
const handleAdd = () => {
  editingId.value = null
  dialogTitle.value = '新增套餐'
  Object.assign(formData, {
    packageName: '',
    packageCode: '',
    durationDays: 30,
    originalPrice: 0,
    currentPrice: 0,
    description: '',
    sortOrder: packageList.value.length,
    status: 1
  })
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row: VipPackage) => {
  editingId.value = row.packageId
  dialogTitle.value = '编辑套餐'
  Object.assign(formData, {
    packageName: row.packageName,
    packageCode: row.packageCode,
    durationDays: Number(row.durationDays),
    originalPrice: Number(row.originalPrice),
    currentPrice: Number(row.currentPrice),
    description: row.description,
    sortOrder: Number(row.sortOrder),
    status: row.status
  })
  dialogVisible.value = true
}

// 删除套餐
const handleDelete = async (row: VipPackage) => {
  try {
    await ElMessageBox.confirm(`确定要删除套餐「${row.packageName}」吗？`, '删除确认', {
      type: 'warning'
    })
    const res = await deleteVipPackage(row.packageId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadPackages()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch {
    // 用户取消
  }
}

// 修复浮点数精度问题
const fixPrecision = (value: number, precision: number = 2): number => {
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision)
}

// 保存套餐
const handleSave = async () => {
  try {
    await formRef.value?.validate()
    
    // 修复价格精度问题
    const submitData = {
      ...formData,
      originalPrice: fixPrecision(formData.originalPrice),
      currentPrice: fixPrecision(formData.currentPrice)
    }
    
    if (editingId.value) {
      const res = await updateVipPackage(editingId.value, submitData)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        loadPackages()
      } else {
        ElMessage.error(res.msg || '更新失败')
      }
    } else {
      const res = await createVipPackage(submitData)
      if (res.code === 200) {
        ElMessage.success('创建成功')
        dialogVisible.value = false
        loadPackages()
      } else {
        ElMessage.error(res.msg || '创建失败')
      }
    }
  } catch {
    // 验证失败
  }
}

// 切换状态
const handleToggleStatus = async (row: VipPackage) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确定要${action}套餐「${row.packageName}」吗？`, '状态变更', {
      type: 'warning'
    })
    const res = await updateVipPackage(row.packageId, { status: newStatus })
    if (res.code === 200) {
      ElMessage.success(`${action}成功`)
      loadPackages()
    } else {
      ElMessage.error(res.msg || `${action}失败`)
    }
  } catch {
    // 用户取消
  }
}

// 格式化时长
const formatDuration = (days: number) => {
  if (days >= 365) return `${Math.floor(days / 365)}年`
  if (days >= 30) return `${Math.floor(days / 30)}个月`
  return `${days}天`
}

onMounted(() => {
  loadPackages()
})
</script>

<template>
  <div class="packages-page">
    <div class="toolbar">
      <el-button
        type="primary"
        :icon="Plus"
        @click="handleAdd"
      >
        新增套餐
      </el-button>
      <el-button
        :icon="Refresh"
        @click="loadPackages"
      >
        刷新
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="packageList"
      stripe
      border
    >
      <el-table-column
        prop="packageName"
        label="套餐名称"
        width="120"
      />
      <el-table-column
        prop="packageCode"
        label="套餐编码"
        width="120"
      />
      <el-table-column
        label="时长"
        width="100"
      >
        <template #default="{ row }">
          {{ formatDuration(row.durationDays) }}
        </template>
      </el-table-column>
      <el-table-column
        label="原价"
        width="100"
      >
        <template #default="{ row }">
          <span class="original-price">¥{{ Number(row.originalPrice).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="现价"
        width="100"
      >
        <template #default="{ row }">
          <span class="current-price">¥{{ Number(row.currentPrice).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="description"
        label="描述"
        min-width="200"
        show-overflow-tooltip
      />
      <el-table-column
        prop="sortOrder"
        label="排序"
        width="80"
      />
      <el-table-column
        label="状态"
        width="100"
      >
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="200"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            :icon="Edit"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            :type="row.status === 1 ? 'warning' : 'success'"
            link
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 1 ? '停用' : '启用' }}
          </el-button>
          <el-button
            type="danger"
            link
            :icon="Delete"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item
          label="套餐名称"
          prop="packageName"
        >
          <el-input
            v-model="formData.packageName"
            placeholder="请输入套餐名称"
          />
        </el-form-item>
        <el-form-item
          label="套餐编码"
          prop="packageCode"
        >
          <el-input
            v-model="formData.packageCode"
            placeholder="如: monthly, yearly"
            :disabled="!!editingId"
          />
        </el-form-item>
        <el-form-item
          label="有效天数"
          prop="durationDays"
        >
          <el-input-number
            v-model="formData.durationDays"
            :min="1"
            :max="3650"
          />
        </el-form-item>
        <el-form-item
          label="原价"
          prop="originalPrice"
        >
          <el-input-number
            v-model="formData.originalPrice"
            :min="0"
            :precision="2"
          />
        </el-form-item>
        <el-form-item
          label="现价"
          prop="currentPrice"
        >
          <el-input-number
            v-model="formData.currentPrice"
            :min="0"
            :precision="2"
          />
        </el-form-item>
        <el-form-item
          label="描述"
          prop="description"
        >
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="套餐描述"
          />
        </el-form-item>
        <el-form-item
          label="排序"
          prop="sortOrder"
        >
          <el-input-number
            v-model="formData.sortOrder"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="formData.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleSave"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.packages-page {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.original-price {
  color: #999;
  text-decoration: line-through;
}
.current-price {
  color: #f56c6c;
  font-weight: 600;
}
</style>
