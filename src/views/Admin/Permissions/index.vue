<script setup lang="ts">
/**
 * 权限管理页面
 * 管理角色、权限、菜单等
 */
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Refresh, Lock } from '@element-plus/icons-vue'

interface Role {
  id: number
  name: string
  code: string
  description: string
  permissions: string[]
  userCount: number
  status: 'active' | 'inactive'
  createdAt: string
}

interface Permission {
  id: number
  name: string
  code: string
  module: string
  description: string
}

const activeTab = ref('roles')
const roleList = ref<Role[]>([])
const roleLoading = ref(false)
const permissionList = ref<Permission[]>([])

const roleDialogVisible = ref(false)
const roleDialogTitle = ref('新增角色')
const roleForm = reactive<Partial<Role>>({
  name: '', code: '', description: '', permissions: [], status: 'active'
})
const roleFormRef = ref()
const editingRoleId = ref<number | null>(null)

const mockRoles: Role[] = [
  { id: 1, name: '超级管理员', code: 'super_admin', description: '拥有所有权限', permissions: ['*'], userCount: 2, status: 'active', createdAt: '2024-01-01' },
  { id: 2, name: '内容管理员', code: 'content_admin', description: '管理资源和内容审核', permissions: ['resource:view', 'resource:edit', 'resource:delete', 'audit:view', 'audit:approve'], userCount: 5, status: 'active', createdAt: '2024-01-01' },
  { id: 3, name: '用户管理员', code: 'user_admin', description: '管理用户和会员', permissions: ['user:view', 'user:edit', 'user:ban', 'vip:view', 'vip:manage'], userCount: 3, status: 'active', createdAt: '2024-01-01' },
  { id: 4, name: '运营人员', code: 'operator', description: '管理运营相关功能', permissions: ['banner:view', 'banner:edit', 'announce:view', 'announce:edit', 'recommend:view', 'recommend:edit'], userCount: 8, status: 'active', createdAt: '2024-01-01' },
  { id: 5, name: '数据分析员', code: 'analyst', description: '查看统计数据', permissions: ['statistics:view'], userCount: 4, status: 'active', createdAt: '2024-01-01' }
]

const mockPermissions: Permission[] = [
  { id: 1, name: '查看用户', code: 'user:view', module: '用户管理', description: '查看用户列表和详情' },
  { id: 2, name: '编辑用户', code: 'user:edit', module: '用户管理', description: '编辑用户信息' },
  { id: 3, name: '封禁用户', code: 'user:ban', module: '用户管理', description: '封禁/解封用户' },
  { id: 4, name: '查看资源', code: 'resource:view', module: '资源管理', description: '查看资源列表和详情' },
  { id: 5, name: '编辑资源', code: 'resource:edit', module: '资源管理', description: '编辑资源信息' },
  { id: 6, name: '删除资源', code: 'resource:delete', module: '资源管理', description: '删除资源' },
  { id: 7, name: '查看审核', code: 'audit:view', module: '内容审核', description: '查看待审核内容' },
  { id: 8, name: '审核操作', code: 'audit:approve', module: '内容审核', description: '通过/拒绝审核' },
  { id: 9, name: '查看VIP', code: 'vip:view', module: 'VIP管理', description: '查看VIP套餐和订单' },
  { id: 10, name: '管理VIP', code: 'vip:manage', module: 'VIP管理', description: '管理VIP套餐' },
  { id: 11, name: '查看轮播', code: 'banner:view', module: '运营管理', description: '查看轮播图' },
  { id: 12, name: '编辑轮播', code: 'banner:edit', module: '运营管理', description: '编辑轮播图' },
  { id: 13, name: '查看公告', code: 'announce:view', module: '运营管理', description: '查看公告' },
  { id: 14, name: '编辑公告', code: 'announce:edit', module: '运营管理', description: '编辑公告' },
  { id: 15, name: '查看推荐', code: 'recommend:view', module: '运营管理', description: '查看推荐位' },
  { id: 16, name: '编辑推荐', code: 'recommend:edit', module: '运营管理', description: '编辑推荐位' },
  { id: 17, name: '查看统计', code: 'statistics:view', module: '数据统计', description: '查看统计数据' }
]

// 按模块分组权限
const groupedPermissions = ref<Record<string, Permission[]>>({})

const loadRoles = async () => {
  roleLoading.value = true
  await new Promise(r => setTimeout(r, 500))
  roleList.value = mockRoles
  roleLoading.value = false
}

const loadPermissions = () => {
  permissionList.value = mockPermissions
  const grouped: Record<string, Permission[]> = {}
  mockPermissions.forEach(p => {
    if (!grouped[p.module]) grouped[p.module] = []
    grouped[p.module].push(p)
  })
  groupedPermissions.value = grouped
}

const handleAddRole = () => {
  editingRoleId.value = null
  roleDialogTitle.value = '新增角色'
  Object.assign(roleForm, { name: '', code: '', description: '', permissions: [], status: 'active' })
  roleDialogVisible.value = true
}

const handleEditRole = (role: Role) => {
  editingRoleId.value = role.id
  roleDialogTitle.value = '编辑角色'
  Object.assign(roleForm, { ...role, permissions: [...role.permissions] })
  roleDialogVisible.value = true
}

const handleDeleteRole = async (role: Role) => {
  if (role.code === 'super_admin') {
    ElMessage.warning('超级管理员角色不能删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除角色「${role.name}」吗？该角色下有 ${role.userCount} 个用户。`, '删除确认', { type: 'warning' })
    roleList.value = roleList.value.filter(r => r.id !== role.id)
    ElMessage.success('删除成功')
  } catch { /* 用户取消 */ }
}

const handleSaveRole = async () => {
  try {
    await roleFormRef.value?.validate()
    if (editingRoleId.value) {
      const idx = roleList.value.findIndex(r => r.id === editingRoleId.value)
      if (idx > -1) roleList.value[idx] = { ...roleList.value[idx], ...roleForm } as Role
      ElMessage.success('更新成功')
    } else {
      roleList.value.push({ id: Date.now(), ...roleForm, userCount: 0, createdAt: new Date().toISOString() } as Role)
      ElMessage.success('新增成功')
    }
    roleDialogVisible.value = false
  } catch { /* 验证失败 */ }
}

const handleToggleRoleStatus = async (role: Role) => {
  if (role.code === 'super_admin') {
    ElMessage.warning('超级管理员角色不能停用')
    return
  }
  const newStatus = role.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确定要${action}角色「${role.name}」吗？`, '状态变更', { type: 'warning' })
    role.status = newStatus
    ElMessage.success(`${action}成功`)
  } catch { /* 用户取消 */ }
}

onMounted(() => { loadRoles(); loadPermissions() })
</script>

<template>
  <div class="permissions-management">
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- 角色管理 -->
      <el-tab-pane label="角色管理" name="roles">
        <div class="toolbar">
          <el-button type="primary" :icon="Plus" @click="handleAddRole">新增角色</el-button>
          <el-button :icon="Refresh" @click="loadRoles">刷新</el-button>
        </div>
        <el-table :data="roleList" v-loading="roleLoading" stripe>
          <el-table-column prop="name" label="角色名称" width="120" />
          <el-table-column prop="code" label="角色标识" width="120" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column label="权限数" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ row.permissions.includes('*') ? '全部' : row.permissions.length }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="userCount" label="用户数" width="80" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-switch v-model="row.status" active-value="active" inactive-value="inactive"
                :disabled="row.code === 'super_admin'" @change="handleToggleRoleStatus(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link :icon="Edit" @click="handleEditRole(row)">编辑</el-button>
              <el-button type="danger" link :icon="Delete" @click="handleDeleteRole(row)" :disabled="row.code === 'super_admin'">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 权限列表 -->
      <el-tab-pane label="权限列表" name="permissions">
        <div class="permission-modules">
          <div v-for="(perms, module) in groupedPermissions" :key="module" class="permission-module">
            <div class="module-header">
              <el-icon><Lock /></el-icon>
              <span>{{ module }}</span>
              <el-tag size="small" type="info">{{ perms.length }}</el-tag>
            </div>
            <div class="permission-list">
              <div v-for="perm in perms" :key="perm.id" class="permission-item">
                <div class="perm-name">{{ perm.name }}</div>
                <div class="perm-code">{{ perm.code }}</div>
                <div class="perm-desc">{{ perm.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 角色编辑对话框 -->
    <el-dialog v-model="roleDialogVisible" :title="roleDialogTitle" width="600px">
      <el-form ref="roleFormRef" :model="roleForm" label-width="100px">
        <el-form-item label="角色名称" prop="name" :rules="[{ required: true, message: '请输入角色名称' }]">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色标识" prop="code" :rules="[{ required: true, message: '请输入角色标识' }]">
          <el-input v-model="roleForm.code" placeholder="如: content_admin" :disabled="!!editingRoleId" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" rows="2" placeholder="角色描述" />
        </el-form-item>
        <el-form-item label="权限配置">
          <div class="permission-config">
            <div v-for="(perms, module) in groupedPermissions" :key="module" class="config-module">
              <div class="config-module-header">{{ module }}</div>
              <el-checkbox-group v-model="roleForm.permissions">
                <el-checkbox v-for="perm in perms" :key="perm.id" :value="perm.code">{{ perm.name }}</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="roleForm.status" active-value="active" inactive-value="inactive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.permissions-management { padding: 20px; }
.main-tabs { background: #fff; border-radius: 8px; padding: 16px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.permission-modules { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.permission-module { background: #f9fafb; border-radius: 8px; padding: 16px; }
.module-header { display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 12px; color: #374151; }
.permission-list { display: flex; flex-direction: column; gap: 8px; }
.permission-item { background: #fff; border-radius: 6px; padding: 12px; display: grid; grid-template-columns: 100px 120px 1fr; gap: 8px; align-items: center; }
.perm-name { font-weight: 500; color: #1f2937; }
.perm-code { font-family: monospace; font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
.perm-desc { font-size: 13px; color: #9ca3af; }
.permission-config { max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
.config-module { margin-bottom: 16px; }
.config-module:last-child { margin-bottom: 0; }
.config-module-header { font-weight: 600; color: #374151; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
</style>
