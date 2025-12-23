<!--
  用户详情对话框
  
  功能：
  - 显示用户完整信息
  - 显示积分明细
  - 显示操作记录
  
  需求: 需求12.5
-->

<template>
  <el-dialog
    v-model="visible"
    title="用户详情"
    width="900px"
    :close-on-click-modal="false"
  >
    <div v-loading="loading" class="user-detail">
      <!-- 基本信息 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
          </div>
        </template>
        
        <div class="user-basic-info">
          <el-avatar :src="userDetail.avatar" :size="80">
            {{ userDetail.nickname?.charAt(0) }}
          </el-avatar>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="label">用户ID:</span>
              <span class="value">{{ userDetail.userId }}</span>
            </div>
            <div class="info-item">
              <span class="label">昵称:</span>
              <span class="value">{{ userDetail.nickname || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">手机号:</span>
              <span class="value">{{ userDetail.phone }}</span>
            </div>
            <div class="info-item">
              <span class="label">邮箱:</span>
              <span class="value">{{ userDetail.email || '未绑定' }}</span>
            </div>
            <div class="info-item">
              <span class="label">VIP等级:</span>
              <el-tag v-if="userDetail.vipLevel > 0" type="warning" effect="dark">
                <el-icon><Star /></el-icon>
                VIP
              </el-tag>
              <el-tag v-else type="info">普通用户</el-tag>
            </div>
            <div class="info-item">
              <span class="label">VIP到期:</span>
              <span class="value">{{ userDetail.vipExpireAt ? formatDate(userDetail.vipExpireAt) : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">积分余额:</span>
              <span class="value points">{{ userDetail.pointsBalance || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="label">累计积分:</span>
              <span class="value">{{ userDetail.pointsTotal || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="label">用户等级:</span>
              <el-tag :type="getLevelType(userDetail.userLevel)">
                LV{{ userDetail.userLevel || 1 }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">账号状态:</span>
              <el-tag :type="userDetail.status === 1 ? 'success' : 'danger'">
                {{ userDetail.status === 1 ? '正常' : '已禁用' }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">注册时间:</span>
              <span class="value">{{ formatDate(userDetail.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">最后登录:</span>
              <span class="value">{{ userDetail.lastLoginAt ? formatDate(userDetail.lastLoginAt) : '从未登录' }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 标签页：积分明细和操作记录 -->
      <el-tabs v-model="activeTab" class="detail-tabs">
        <!-- 积分明细 -->
        <el-tab-pane label="积分明细" name="points">
          <el-table :data="pointsRecords" stripe max-height="400">
            <el-table-column prop="createdAt" label="时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.pointsChange > 0 ? 'success' : 'warning'">
                  {{ row.changeType === 'earn' ? '获得' : '消耗' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="积分变动" width="120">
              <template #default="{ row }">
                <span :class="row.pointsChange > 0 ? 'text-success' : 'text-warning'">
                  {{ row.pointsChange > 0 ? '+' : '' }}{{ row.pointsChange }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="pointsBalance" label="余额" width="100" />
            <el-table-column prop="description" label="说明" />
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pointsPagination.page"
              v-model:page-size="pointsPagination.pageSize"
              :total="pointsPagination.total"
              layout="prev, pager, next"
              small
              @current-change="fetchPointsRecords"
            />
          </div>
        </el-tab-pane>

        <!-- 操作记录 -->
        <el-tab-pane label="操作记录" name="operations">
          <el-table :data="operationLogs" stripe max-height="400">
            <el-table-column prop="createdAt" label="时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="120" />
            <el-table-column label="操作类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getOperationTypeTag(row.operationType)">
                  {{ getOperationTypeName(row.operationType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="操作说明" />
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="operationPagination.page"
              v-model:page-size="operationPagination.pageSize"
              :total="operationPagination.total"
              layout="prev, pager, next"
              small
              @current-change="fetchOperationLogs"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Star } from '@element-plus/icons-vue';
import { formatTime } from '@/utils/format';

// 格式化日期的辅助函数
const formatDate = (date: string) => formatTime(date, 'YYYY-MM-DD HH:mm:ss');

interface Props {
  modelValue: boolean;
  userId: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'refresh'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 对话框可见性
const visible = ref(false);

// 加载状态
const loading = ref(false);

// 当前标签页
const activeTab = ref('points');

// 用户详情
const userDetail = ref<any>({});

// 积分记录
const pointsRecords = ref<any[]>([]);
const pointsPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

// 操作记录
const operationLogs = ref<any[]>([]);
const operationPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

// 监听对话框显示
watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val && props.userId) {
    fetchUserDetail();
    fetchPointsRecords();
    fetchOperationLogs();
  }
});

// 监听对话框关闭
watch(visible, (val) => {
  emit('update:modelValue', val);
});

// 获取用户详情
const fetchUserDetail = async () => {
  loading.value = true;
  try {
    // TODO: 调用后端API获取用户详情
    // const response = await getUserDetail(props.userId);
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500));
    userDetail.value = {
      userId: props.userId,
      phone: '13800138000',
      nickname: '张三',
      avatar: '',
      email: 'zhangsan@example.com',
      vipLevel: 1,
      vipExpireAt: '2024-12-31 23:59:59',
      pointsBalance: 1500,
      pointsTotal: 3000,
      userLevel: 3,
      status: 1,
      createdAt: '2024-01-15 10:30:00',
      lastLoginAt: '2024-12-20 15:30:00'
    };
  } catch (error) {
    ElMessage.error('获取用户详情失败');
  } finally {
    loading.value = false;
  }
};

// 获取积分记录
const fetchPointsRecords = async () => {
  try {
    // TODO: 调用后端API获取积分记录
    // const response = await getPointsRecords(props.userId, pointsPagination);
    
    // 模拟数据
    pointsRecords.value = [
      {
        createdAt: '2024-12-20 10:00:00',
        changeType: 'earn',
        pointsChange: 50,
        pointsBalance: 1500,
        description: '上传作品审核通过'
      },
      {
        createdAt: '2024-12-19 15:30:00',
        changeType: 'consume',
        pointsChange: -10,
        pointsBalance: 1450,
        description: '下载资源'
      }
    ];
    pointsPagination.total = 2;
  } catch (error) {
    ElMessage.error('获取积分记录失败');
  }
};

// 获取操作记录
const fetchOperationLogs = async () => {
  try {
    // TODO: 调用后端API获取操作记录
    // const response = await getOperationLogs(props.userId, operationPagination);
    
    // 模拟数据
    operationLogs.value = [
      {
        createdAt: '2024-12-15 14:20:00',
        operatorName: '管理员',
        operationType: 'adjust_vip',
        description: '手动开通VIP会员至2024-12-31'
      },
      {
        createdAt: '2024-12-10 09:15:00',
        operatorName: '系统',
        operationType: 'adjust_points',
        description: '手动调整积分+500'
      }
    ];
    operationPagination.total = 2;
  } catch (error) {
    ElMessage.error('获取操作记录失败');
  }
};

// 获取等级类型
const getLevelType = (level: number) => {
  if (level >= 5) return 'danger';
  if (level >= 3) return 'warning';
  return 'info';
};

// 获取操作类型标签
const getOperationTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    disable: 'danger',
    enable: 'success',
    reset_password: 'warning',
    adjust_vip: 'warning',
    adjust_points: 'primary'
  };
  return typeMap[type] || 'info';
};

// 获取操作类型名称
const getOperationTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    disable: '禁用账号',
    enable: '启用账号',
    reset_password: '重置密码',
    adjust_vip: '调整VIP',
    adjust_points: '调整积分'
  };
  return nameMap[type] || type;
};
</script>

<style scoped lang="scss">
.user-detail {
  .info-card {
    margin-bottom: 20px;

    .card-header {
      font-weight: 600;
    }

    .user-basic-info {
      display: flex;
      gap: 24px;

      .info-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .label {
            font-size: 14px;
            color: #666;
            min-width: 80px;
          }

          .value {
            font-size: 14px;
            color: #333;

            &.points {
              font-weight: 600;
              color: #ff7d00;
            }
          }
        }
      }
    }
  }

  .detail-tabs {
    .text-success {
      color: #67c23a;
      font-weight: 600;
    }

    .text-warning {
      color: #e6a23c;
      font-weight: 600;
    }

    .pagination-wrapper {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

// 暗黑模式
:global(.dark) {
  .user-detail {
    .info-grid {
      .info-item {
        .label {
          color: #999;
        }

        .value {
          color: #e0e0e0;
        }
      }
    }
  }
}
</style>
