<script setup lang="ts">
/**
 * 权限管理页面
 * 管理角色和权限
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Refresh, Lock, Setting } from '@element-plus/icons-vue'
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  assignPermissions,
  type Role,
  type Permission,
  type CreateRoleParams,
  type UpdateRoleParams
} from '@/api/permission'

// 当前激活的标签页
const activeTab = ref('roles')

// 角色列表相关
const roleList = ref<Role[]>([])
const roleLoading = ref(false)

// 权限列表相关
const permissionList = ref<Permission[]>([])
const permissionLoading = ref(false)
const selectedModule = ref('')

// 角色对话框相关
const roleDialogVisible = ref(false)
const roleDialogTitle = ref('新增角色')
const roleFormRef = ref()
const editingRole = ref<Role | null>(null)
const roleForm = ref<CreateRoleParams>({
  roleName: '',
  roleCode: '',
  description: '',
  permissionIds: []
})
const roleFormLoading = ref(false)

// 权限配置对话框相关
const permissionDialogVisible = ref(false)
const permissionDialogRole = ref<Role | null>(null)
const selectedPermissionIds = ref<string[]>([])
const permissionSaving = ref(false)

// 按模块分组的权限
const groupedPermissions = computed(() => {
  const grouped: Record<string, Permission[]> = {}
  permissionList.value.forEach(p => {
    if (!grouped[p.module]) grouped[p.module] = []
    grouped[p.module].push(p)
  })
  return grouped
})

// 模块列表（用于筛选）
const moduleList = computed(() => {
  return Object.keys(groupedPermissions.value)
})

// 筛选后的权限（权限列表标签页使用）
const filteredPermissions = computed(() => {
  if (!selectedModule.value) return groupedPermissions.value
  return { [selectedModule.value]: groupedPermissions.value[selectedModule.value] || [] }
})

// 加载角色列表
const loadRoles = async () => {
  roleLoading.value = true
  try {
    const res = await getRoles()
    if (res.code === 200 && res.data) {
      roleList.value = res.data
    }
  } catch (err) {
    console.error('加载角色列表失败:', err)
  } finally {
    roleLoading.value = false
  }
}

// 加载权限列表
const loadPermissions = async () => {
  permissionLoading.value = true
  try {
    const res = await getAllPermissions()
    if (res.code === 200 && res.data) {
      permissionList.value = res.data
    }
  } catch (err) {
    console.error('加载权限列表失败:', err)
  } finally {
    permissionLoading.value = false
  }
}

// 新增角色
const handleAddRole = () => {
  editingRole.value = null
  roleDialogTitle.value = '新增角色'
  roleForm.value = {
    roleName: '',
    roleCode: '',
    description: '',
    permissionIds: []
  }
  roleDialogVisible.value = true
}

// 编辑角色
const handleEditRole = (role: Role) => {
  editingRole.value = role
  roleDialogTitle.value = '编辑角色'
  roleForm.value = {
    roleName: role.roleName,
    roleCode: role.roleCode,
    description: role.description || '',
    permissionIds: role.permissions?.map(p => p.permissionId) || []
  }
  roleDialogVisible.value = true
}

// 删除角色
const handleDeleteRole = async (role: Role) => {
  // 系统预设角色不允许删除
  if (role.isSystem) {
    ElMessage.warning('系统预设角色不允许删除')
    return
  }
  
  try {
    // 显示删除确认对话框
    await ElMessageBox.confirm(
      `确定要删除角色「${role.roleName}」吗？删除后不可恢复。`,
      '删除确认',
      { 
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    // 执行删除操作
    const res = await deleteRole(role.roleId)
    if (res.code === 200) {
      ElMessage.success('角色删除成功')
      loadRoles()
    } else {
      // 处理业务错误
      handleDeleteError(res.msg || '删除失败')
    }
  } catch (err: unknown) {
    // 用户点击取消按钮
    if (err === 'cancel' || (err as Error).message === 'cancel') {
      return
    }
    
    // 处理API错误
    const errorMessage = (err as Error).message || '删除角色失败'
    handleDeleteError(errorMessage)
  }
}

// 处理删除错误
const handleDeleteError = (errorMessage: string) => {
  // 检查是否是"角色正在被使用"的错误
  if (errorMessage.includes('正在被') && errorMessage.includes('个用户使用')) {
    // 显示详细的错误提示对话框
    ElMessageBox.alert(
      errorMessage,
      '无法删除',
      {
        type: 'error',
        confirmButtonText: '我知道了'
      }
    )
  } else if (errorMessage.includes('系统预设角色')) {
    ElMessage.warning('系统预设角色不允许删除')
  } else if (errorMessage.includes('角色不存在')) {
    ElMessage.error('角色不存在，可能已被删除')
    loadRoles() // 刷新列表
  } else {
    // 其他错误
    ElMessage.error(errorMessage)
  }
}

// 保存角色
const handleSaveRole = async () => {
  try {
    await roleFormRef.value?.validate()
    roleFormLoading.value = true
    
    if (editingRole.value) {
      // 更新角色
      const updateData: UpdateRoleParams = {
        roleName: roleForm.value.roleName,
        description: roleForm.value.description
      }
      const res = await updateRole(editingRole.value.roleId, updateData)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        roleDialogVisible.value = false
        loadRoles()
      }
    } else {
      // 创建角色
      const res = await createRole(roleForm.value)
      if (res.code === 200) {
        ElMessage.success('创建成功')
        roleDialogVisible.value = false
        loadRoles()
      }
    }
  } catch (err) {
    console.error('保存角色失败:', err)
  } finally {
    roleFormLoading.value = false
  }
}

// 配置权限
const handleConfigPermissions = (role: Role) => {
  permissionDialogRole.value = role
  selectedPermissionIds.value = role.permissions?.map(p => p.permissionId) || []
  permissionDialogVisible.value = true
}

// 检查模块是否全选
const isModuleAllChecked = (module: string): boolean => {
  const perms = groupedPermissions.value[module] || []
  if (perms.length === 0) return false
  return perms.every(p => selectedPermissionIds.value.includes(p.permissionId))
}

// 检查模块是否部分选中
const isModuleIndeterminate = (module: string): boolean => {
  const perms = groupedPermissions.value[module] || []
  if (perms.length === 0) return false
  const checkedCount = perms.filter(p => selectedPermissionIds.value.includes(p.permissionId)).length
  return checkedCount > 0 && checkedCount < perms.length
}

// 模块全选/取消全选
const handleModuleCheckAll = (module: string, checked: boolean) => {
  const perms = groupedPermissions.value[module] || []
  const permIds = perms.map(p => p.permissionId)
  
  if (checked) {
    // 添加该模块所有权限
    const newIds = new Set([...selectedPermissionIds.value, ...permIds])
    selectedPermissionIds.value = Array.from(newIds)
  } else {
    // 移除该模块所有权限
    selectedPermissionIds.value = selectedPermissionIds.value.filter(id => !permIds.includes(id))
  }
}

// 保存权限配置
const handleSavePermissions = async () => {
  if (!permissionDialogRole.value) return
  
  permissionSaving.value = true
  try {
    const res = await assignPermissions(permissionDialogRole.value.roleId, selectedPermissionIds.value)
    if (res.code === 200) {
      ElMessage.success('权限配置成功')
      permissionDialogVisible.value = false
      loadRoles()
    }
  } catch (err) {
    console.error('保存权限配置失败:', err)
  } finally {
    permissionSaving.value = false
  }
}

// 初始化
onMounted(() => {
  loadRoles()
  loadPermissions()
})
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
          <el-table-column prop="roleName" label="角色名称" width="140" />
          <el-table-column prop="roleCode" label="角色代码" width="140">
            <template #default="{ row }">
              <code class="role-code">{{ row.roleCode }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="权限数" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row._count?.permissions || 0 }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="用户数" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small">{{ row._count?.users || 0 }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isSystem" type="warning" size="small">系统预设</el-tag>
              <el-tag v-else type="success" size="small">自定义</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link :icon="Edit" @click="handleEditRole(row)">编辑</el-button>
              <el-button type="primary" link :icon="Setting" @click="handleConfigPermissions(row)">权限</el-button>
              <el-button 
                type="danger" 
                link 
                :icon="Delete" 
                @click="handleDeleteRole(row)" 
                :disabled="row.isSystem"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 权限列表 -->
      <el-tab-pane label="权限列表" name="permissions">
        <div class="toolbar">
          <el-select v-model="selectedModule" placeholder="按模块筛选" clearable style="width: 200px">
            <el-option v-for="m in moduleList" :key="m" :label="m" :value="m" />
          </el-select>
          <el-button :icon="Refresh" @click="loadPermissions">刷新</el-button>
        </div>
        <div class="permission-modules" v-loading="permissionLoading">
          <div v-for="(perms, module) in filteredPermissions" :key="module" class="permission-module">
            <div class="module-header">
              <el-icon><Lock /></el-icon>
              <span>{{ module }}</span>
              <el-tag size="small" type="info">{{ perms.length }}</el-tag>
            </div>
            <div class="permission-list">
              <div v-for="perm in perms" :key="perm.permissionId" class="permission-item">
                <div class="perm-name">{{ perm.permissionName }}</div>
                <div class="perm-code">{{ perm.permissionCode }}</div>
                <div class="perm-desc">{{ perm.description || '-' }}</div>
              </div>
            </div>
          </div>
          <el-empty v-if="Object.keys(filteredPermissions).length === 0" description="暂无权限数据" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 角色编辑对话框 -->
    <el-dialog v-model="roleDialogVisible" :title="roleDialogTitle" width="500px" @closed="roleFormRef?.resetFields()">
      <el-form ref="roleFormRef" :model="roleForm" label-width="100px">
        <el-form-item label="角色名称" prop="roleName" :rules="[{ required: true, message: '请输入角色名称' }]">
          <el-input 
            v-model="roleForm.roleName" 
            placeholder="请输入角色名称"
            :disabled="editingRole?.isSystem"
          />
        </el-form-item>
        <el-form-item label="角色代码" prop="roleCode" :rules="[{ required: true, message: '请输入角色代码' }]">
          <el-input 
            v-model="roleForm.roleCode" 
            placeholder="如: content_admin" 
            :disabled="!!editingRole"
          />
          <div class="form-tip" v-if="!editingRole">角色代码创建后不可修改</div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="roleForm.description" 
            type="textarea" 
            rows="3" 
            placeholder="角色描述"
            :disabled="editingRole?.isSystem"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRole" :loading="roleFormLoading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 权限配置对话框 -->
    <el-dialog 
      v-model="permissionDialogVisible" 
      :title="`配置权限 - ${permissionDialogRole?.roleName}`" 
      width="700px"
    >
      <div class="permission-config" v-loading="permissionLoading">
        <div v-for="(perms, module) in groupedPermissions" :key="module" class="config-module">
          <div class="config-module-header">
            <el-checkbox 
              :indeterminate="isModuleIndeterminate(module as string)"
              :model-value="isModuleAllChecked(module as string)"
              @change="handleModuleCheckAll(module as string, $event as boolean)"
            >
              {{ module }}
            </el-checkbox>
          </div>
          <el-checkbox-group v-model="selectedPermissionIds" class="config-permissions">
            <el-checkbox 
              v-for="perm in perms" 
              :key="perm.permissionId" 
              :value="perm.permissionId"
            >
              {{ perm.permissionName }}
              <span class="perm-code-small">{{ perm.permissionCode }}</span>
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <el-empty v-if="Object.keys(groupedPermissions).length === 0" description="暂无权限数据" />
      </div>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePermissions" :loading="permissionSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>


<style scoped>
.permissions-management {
  padding: 20px;
}

.main-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.role-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
}

.permission-modules {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.permission-module {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.module-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #374151;
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission-item {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  display: grid;
  grid-template-columns: 100px 140px 1fr;
  gap: 8px;
  align-items: center;
}

.perm-name {
  font-weight: 500;
  color: #1f2937;
}

.perm-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.perm-desc {
  font-size: 13px;
  color: #9ca3af;
}

.form-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.permission-config {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.config-module {
  margin-bottom: 20px;
}

.config-module:last-child {
  margin-bottom: 0;
}

.config-module-header {
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.config-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.perm-code-small {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #9ca3af;
  margin-left: 4px;
}

/* 响应式 */
@media (max-width: 768px) {
  .permission-item {
    grid-template-columns: 1fr;
  }
  
  .permission-modules {
    grid-template-columns: 1fr;
  }
}
</style>
