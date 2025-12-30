<template>
  <div class="points-rules-page">
    <div class="page-header">
      <h2>积分规则管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增规则</el-button>
    </div>

    <!-- 规则列表 -->
    <el-card class="rules-card">
      <el-table :data="rulesList" v-loading="loading" stripe>
        <el-table-column prop="name" label="规则名称" min-width="150" />
        <el-table-column prop="type" label="规则类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getRuleTypeTag(row.type)">{{ getRuleTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分数量" width="100" align="center" />
        <el-table-column prop="description" label="规则描述" min-width="200" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑规则' : '新增规则'" width="500px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择规则类型" style="width: 100%">
            <el-option label="签到奖励" value="sign_in" />
            <el-option label="上传资源" value="upload" />
            <el-option label="下载资源" value="download" />
            <el-option label="分享资源" value="share" />
            <el-option label="邀请注册" value="invite" />
            <el-option label="首次注册" value="register" />
          </el-select>
        </el-form-item>
        <el-form-item label="积分数量" prop="points">
          <el-input-number v-model="formData.points" :min="1" :max="10000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="规则描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入规则描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 积分规则管理页面
 * 管理积分获取和消耗规则
 */
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

interface PointsRule {
  id: string
  name: string
  type: string
  points: number
  description: string
  status: number
}

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

// 规则列表（模拟数据）
const rulesList = ref<PointsRule[]>([
  { id: '1', name: '每日签到', type: 'sign_in', points: 10, description: '每日签到可获得10积分', status: 1 },
  { id: '2', name: '上传资源', type: 'upload', points: 50, description: '上传资源审核通过后获得50积分', status: 1 },
  { id: '3', name: '下载资源', type: 'download', points: -5, description: '下载资源消耗5积分', status: 1 },
  { id: '4', name: '分享资源', type: 'share', points: 5, description: '分享资源到社交平台获得5积分', status: 1 },
  { id: '5', name: '邀请注册', type: 'invite', points: 100, description: '邀请新用户注册获得100积分', status: 1 },
  { id: '6', name: '首次注册', type: 'register', points: 50, description: '新用户注册赠送50积分', status: 1 }
])

const formData = reactive({
  id: '',
  name: '',
  type: '',
  points: 10,
  description: '',
  status: 1
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  points: [{ required: true, message: '请输入积分数量', trigger: 'blur' }]
}

const getRuleTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    sign_in: '签到奖励',
    upload: '上传资源',
    download: '下载资源',
    share: '分享资源',
    invite: '邀请注册',
    register: '首次注册'
  }
  return typeMap[type] || type
}

const getRuleTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    sign_in: 'success',
    upload: 'primary',
    download: 'warning',
    share: 'info',
    invite: 'success',
    register: 'primary'
  }
  return tagMap[type] || 'info'
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(formData, { id: '', name: '', type: '', points: 10, description: '', status: 1 })
  dialogVisible.value = true
}

const handleEdit = (row: PointsRule) => {
  isEdit.value = true
  Object.assign(formData, row)
  dialogVisible.value = true
}

const handleDelete = async (row: PointsRule) => {
  await ElMessageBox.confirm('确定要删除该规则吗？', '提示', { type: 'warning' })
  rulesList.value = rulesList.value.filter(item => item.id !== row.id)
  ElMessage.success('删除成功')
}

const handleStatusChange = (row: PointsRule) => {
  ElMessage.success(`规则已${row.status === 1 ? '启用' : '禁用'}`)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value) {
      const index = rulesList.value.findIndex(item => item.id === formData.id)
      if (index !== -1) {
        rulesList.value[index] = { ...formData }
      }
      ElMessage.success('更新成功')
    } else {
      rulesList.value.push({ ...formData, id: Date.now().toString() })
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  // 加载规则列表
})
</script>

<style scoped lang="scss">
.points-rules-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    h2 { margin: 0; font-size: 20px; }
  }
  .rules-card { margin-bottom: 20px; }
}
</style>
