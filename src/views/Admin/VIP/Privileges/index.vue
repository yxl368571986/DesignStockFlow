<script setup lang="ts">
/**
 * VIP特权配置页面
 */
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Refresh, Check, Close } from '@element-plus/icons-vue'
import { getAllVipPrivileges, updateVipPrivilege, type VipPrivilege } from '@/api/vip'

const loading = ref(false)
const privilegeList = ref<VipPrivilege[]>([])

// 编辑对话框
const dialogVisible = ref(false)
const editingPrivilege = ref<VipPrivilege | null>(null)
const formRef = ref()
const formData = ref({
  privilegeName: '',
  privilegeValue: '',
  description: '',
  isEnabled: true,
  sortOrder: 0
})

// 加载特权列表
const loadPrivileges = async () => {
  loading.value = true
  try {
    const res = await getAllVipPrivileges()
    if (res.code === 200) {
      privilegeList.value = res.data || []
    }
  } catch (error) {
    console.error('加载特权列表失败:', error)
    ElMessage.error('加载特权列表失败')
  } finally {
    loading.value = false
  }
}

// 打开编辑对话框
const handleEdit = (row: VipPrivilege) => {
  editingPrivilege.value = row
  formData.value = {
    privilegeName: row.privilegeName,
    privilegeValue: row.privilegeValue,
    description: row.description,
    isEnabled: row.isEnabled,
    sortOrder: row.sortOrder
  }
  dialogVisible.value = true
}

// 保存特权配置
const handleSave = async () => {
  if (!editingPrivilege.value) return
  
  try {
    const res = await updateVipPrivilege(editingPrivilege.value.privilegeId, formData.value)
    if (res.code === 200) {
      ElMessage.success('更新成功')
      dialogVisible.value = false
      loadPrivileges()
    } else {
      ElMessage.error(res.msg || '更新失败')
    }
  } catch (error) {
    console.error('更新特权失败:', error)
    ElMessage.error('更新失败')
  }
}

// 快速切换启用状态
const handleToggleEnabled = async (row: VipPrivilege) => {
  const newEnabled = !row.isEnabled
  const action = newEnabled ? '启用' : '停用'
  
  try {
    await ElMessageBox.confirm(`确定要${action}特权「${row.privilegeName}」吗？`, '状态变更', {
      type: 'warning'
    })
    const res = await updateVipPrivilege(row.privilegeId, { isEnabled: newEnabled })
    if (res.code === 200) {
      ElMessage.success(`${action}成功`)
      loadPrivileges()
    } else {
      ElMessage.error(res.msg || `${action}失败`)
    }
  } catch {
    // 用户取消
  }
}

// 获取特权类型标签
const getPrivilegeTypeTag = (type: string) => {
  const typeMap: Record<string, { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
    download: { label: '下载', type: 'primary' },
    watermark: { label: '水印', type: 'success' },
    service: { label: '服务', type: 'warning' },
    badge: { label: '标识', type: 'danger' },
    other: { label: '其他', type: 'info' }
  }
  return typeMap[type] || { label: type, type: 'info' }
}

onMounted(() => {
  loadPrivileges()
})
</script>

<template>
  <div class="privileges-page">
    <div class="toolbar">
      <el-button
        :icon="Refresh"
        @click="loadPrivileges"
      >
        刷新
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="privilegeList"
      stripe
      border
    >
      <el-table-column
        prop="privilegeName"
        label="特权名称"
        width="150"
      />
      <el-table-column
        prop="privilegeCode"
        label="特权编码"
        width="150"
      />
      <el-table-column
        label="特权类型"
        width="100"
      >
        <template #default="{ row }">
          <el-tag
            :type="getPrivilegeTypeTag(row.privilegeType).type"
            size="small"
          >
            {{ getPrivilegeTypeTag(row.privilegeType).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="privilegeValue"
        label="特权值"
        width="120"
      />
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
          <el-tag :type="row.isEnabled ? 'success' : 'info'">
            {{ row.isEnabled ? '启用' : '停用' }}
          </el-tag>
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
            :icon="Edit"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            :type="row.isEnabled ? 'warning' : 'success'"
            link
            :icon="row.isEnabled ? Close : Check"
            @click="handleToggleEnabled(row)"
          >
            {{ row.isEnabled ? '停用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑特权配置"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        label-width="100px"
      >
        <el-form-item label="特权名称">
          <el-input
            v-model="formData.privilegeName"
            placeholder="请输入特权名称"
          />
        </el-form-item>
        <el-form-item label="特权值">
          <el-input
            v-model="formData.privilegeValue"
            placeholder="如: unlimited, 100"
          />
          <div class="form-tip">
            根据特权类型填写对应的值，如下载次数、是否去水印等
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="特权描述"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="formData.sortOrder"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="formData.isEnabled" />
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
.privileges-page {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
