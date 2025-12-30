<!--
  用户管理页面
  
  功能：
  - 显示用户列表表格
  - 搜索和筛选功能
  - 分页功能
  - 用户操作（查看详情、禁用/启用、重置密码、调整VIP、调整积分）
  
  需求: 需求12.1-12.12
-->

<template>
  <div class="users-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <p class="page-desc">管理平台所有用户账号</p>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="手机号/昵称/用户ID"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="VIP等级">
          <el-select
            v-model="searchForm.vipLevel"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="普通用户" :value="0" />
            <el-option label="VIP用户" :value="1" />
          </el-select>
        </el-form-item>

        <el-form-item label="账号状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="正常" :value="1" />
            <el-option label="已禁用" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="userList"
        stripe
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="userId" label="用户ID" width="200" />
        
        <el-table-column label="用户信息" width="250">
          <template #default="{ row }">
            <div class="user-info-cell">
              <el-avatar :src="row.avatar" :size="40">
                {{ row.nickname?.charAt(0) }}
              </el-avatar>
              <div class="user-details">
                <div class="nickname">{{ row.nickname || '未设置' }}</div>
                <div class="phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="VIP等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.vipLevel > 0" type="warning" effect="dark">
              <el-icon><Star /></el-icon>
              VIP
            </el-tag>
            <el-tag v-else type="info">普通</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="VIP到期时间" width="180">
          <template #default="{ row }">
            <span v-if="row.vipExpireAt">
              {{ formatDate(row.vipExpireAt) }}
            </span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>

        <el-table-column 
          prop="pointsBalance" 
          label="积分余额" 
          width="120" 
          align="center"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="points-text">{{ row.pointsBalance || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="用户等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.userLevel)">
              LV{{ row.userLevel || 1 }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column 
          prop="createdAt" 
          label="注册时间" 
          width="180"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              :icon="View"
              @click="handleViewDetail(row)"
            >
              查看详情
            </el-button>
            <el-button 
              :type="row.status === 1 ? 'warning' : 'success'" 
              link
              :icon="row.status === 1 ? Lock : Unlock"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-dropdown @command="(cmd: string) => handleMoreAction(cmd, row)">
              <el-button type="primary" link>
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="resetPassword" :icon="Key">
                    重置密码
                  </el-dropdown-item>
                  <el-dropdown-item command="adjustVip" :icon="Star">
                    调整VIP
                  </el-dropdown-item>
                  <el-dropdown-item command="adjustPoints" :icon="Coin">
                    调整积分
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 用户详情对话框 -->
    <UserDetailDialog
      v-model="detailDialogVisible"
      :user-id="selectedUserId"
      @refresh="fetchUserList"
    />

    <!-- 重置密码对话框 -->
    <ResetPasswordDialog
      v-model="resetPasswordDialogVisible"
      :user="selectedUser"
      @success="handleResetPasswordSuccess"
    />

    <!-- 调整VIP对话框 -->
    <AdjustVipDialog
      v-model="adjustVipDialogVisible"
      :user="selectedUser"
      @success="handleAdjustVipSuccess"
    />

    <!-- 调整积分对话框 -->
    <AdjustPointsDialog
      v-model="adjustPointsDialogVisible"
      :user="selectedUser"
      @success="handleAdjustPointsSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search,
  Refresh,
  View,
  Lock,
  Unlock,
  ArrowDown,
  Key,
  Star,
  Coin
} from '@element-plus/icons-vue';
import UserDetailDialog from './components/UserDetailDialog.vue';
import ResetPasswordDialog from './components/ResetPasswordDialog.vue';
import AdjustVipDialog from './components/AdjustVipDialog.vue';
import AdjustPointsDialog from './components/AdjustPointsDialog.vue';
import { formatTime } from '@/utils/format';
import { getUserList, updateUserStatus, type AdminUser, type UserListParams } from '@/api/adminUser';

// 格式化日期的辅助函数
const formatDate = (date: string) => formatTime(date, 'YYYY-MM-DD HH:mm:ss');

// 使用API定义的类型
type User = AdminUser;

// 搜索表单
const searchForm = reactive({
  keyword: '',
  vipLevel: undefined as number | undefined,
  status: undefined as number | undefined
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

// 加载状态
const loading = ref(false);

// 用户列表
const userList = ref<User[]>([]);

// 对话框状态
const detailDialogVisible = ref(false);
const resetPasswordDialogVisible = ref(false);
const adjustVipDialogVisible = ref(false);
const adjustPointsDialogVisible = ref(false);

// 选中的用户
const selectedUserId = ref('');
const selectedUser = ref<User | null>(null);

// 排序参数
const sortParams = reactive({
  sortBy: '',
  sortOrder: 'desc' as 'asc' | 'desc'
});

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true;
  try {
    const params: UserListParams = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };
    
    // 添加搜索条件
    if (searchForm.keyword) {
      params.keyword = searchForm.keyword;
    }
    if (searchForm.vipLevel !== undefined) {
      params.vipLevel = searchForm.vipLevel;
    }
    if (searchForm.status !== undefined) {
      params.status = searchForm.status;
    }
    
    // 添加排序参数
    if (sortParams.sortBy) {
      params.sortBy = sortParams.sortBy;
      params.sortOrder = sortParams.sortOrder;
    }
    
    const response = await getUserList(params);
    
    if (response.code === 200 && response.data) {
      userList.value = response.data.list || [];
      pagination.total = response.data.total || 0;
      // 后端返回的是 page，不是 pageNum
      if (response.data.page) {
        pagination.page = response.data.page;
      }
    } else {
      ElMessage.error(response.message || '获取用户列表失败');
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchUserList();
};

// 重置
const handleReset = () => {
  searchForm.keyword = '';
  searchForm.vipLevel = undefined;
  searchForm.status = undefined;
  pagination.page = 1;
  fetchUserList();
};

// 排序变化
const handleSortChange = ({ prop, order }: { prop: string; order: string | null }) => {
  if (order) {
    sortParams.sortBy = prop;
    sortParams.sortOrder = order === 'ascending' ? 'asc' : 'desc';
  } else {
    sortParams.sortBy = '';
    sortParams.sortOrder = 'desc';
  }
  fetchUserList();
};

// 分页大小变化
const handleSizeChange = () => {
  pagination.page = 1;
  fetchUserList();
};

// 页码变化
const handlePageChange = () => {
  fetchUserList();
};

// 查看详情
const handleViewDetail = (user: User) => {
  selectedUserId.value = user.userId;
  detailDialogVisible.value = true;
};

// 切换用户状态
const handleToggleStatus = async (user: User) => {
  const action = user.status === 1 ? '禁用' : '启用';
  const newStatus = user.status === 1 ? 0 : 1;
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}用户"${user.nickname || user.phone}"吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const response = await updateUserStatus(user.userId, newStatus);
    
    if (response.code === 200) {
      ElMessage.success(`${action}成功`);
      fetchUserList();
    } else {
      ElMessage.error(response.message || `${action}失败`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${action}失败:`, error);
      ElMessage.error(`${action}失败`);
    }
  }
};

// 更多操作
const handleMoreAction = (command: string, user: User) => {
  selectedUser.value = user;
  
  switch (command) {
    case 'resetPassword':
      resetPasswordDialogVisible.value = true;
      break;
    case 'adjustVip':
      adjustVipDialogVisible.value = true;
      break;
    case 'adjustPoints':
      adjustPointsDialogVisible.value = true;
      break;
  }
};

// 重置密码成功
const handleResetPasswordSuccess = () => {
  ElMessage.success('密码重置成功');
  resetPasswordDialogVisible.value = false;
};

// 调整VIP成功
const handleAdjustVipSuccess = () => {
  ElMessage.success('VIP调整成功');
  adjustVipDialogVisible.value = false;
  fetchUserList();
};

// 调整积分成功
const handleAdjustPointsSuccess = () => {
  ElMessage.success('积分调整成功');
  adjustPointsDialogVisible.value = false;
  fetchUserList();
};

// 获取等级类型
const getLevelType = (level: number) => {
  if (level >= 5) return 'danger';
  if (level >= 3) return 'warning';
  return 'info';
};

// 初始化
onMounted(() => {
  fetchUserList();
});
</script>

<style scoped lang="scss">
.users-page {
  .page-header {
    margin-bottom: 20px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .page-desc {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
  }

  .search-card {
    margin-bottom: 20px;
  }

  .table-card {
    .user-info-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      .user-details {
        flex: 1;

        .nickname {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
        }

        .phone {
          font-size: 12px;
          color: #999;
        }
      }
    }

    .points-text {
      font-weight: 600;
      color: #ff7d00;
    }

    .text-gray {
      color: #999;
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

// 暗黑模式
:global(.dark) {
  .users-page {
    .page-header {
      .page-title {
        color: #e0e0e0;
      }

      .page-desc {
        color: #999;
      }
    }

    .user-info-cell {
      .user-details {
        .nickname {
          color: #e0e0e0;
        }
      }
    }
  }
}
</style>
