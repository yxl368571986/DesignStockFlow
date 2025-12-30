<!--
  积分有效期明细页面
  
  需求: 11.2
  - 显示各批次积分的获取时间和过期时间
  - 高亮即将过期的积分
-->

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Coin, Clock, CircleClose } from '@element-plus/icons-vue';
import { useUserStore } from '@/pinia/userStore';

interface ExpiryRecord {
  recordId: string;
  pointsChange: number;
  acquiredAt: string;
  expireAt: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number | null;
  source: string;
  description: string | null;
}

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const expiryList = ref<ExpiryRecord[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);
const includeExpired = ref(false);

const summary = reactive({
  totalActivePoints: 0,
  totalExpiringPoints: 0,
  totalExpiredPoints: 0,
});

/** 格式化日期时间 */
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 获取来源文本 */
function getSourceText(source: string): string {
  const sourceMap: Record<string, string> = {
    work_downloaded: '作品被下载',
    download_resource: '下载资源',
    points_exchange: '积分兑换',
    points_expired: '积分过期',
    daily_task: '每日任务',
    sign_in: '签到奖励',
    upload_reward: '上传奖励',
    admin_add: '管理员添加',
    admin_deduct: '管理员扣除',
    exchange_refund: '兑换退款',
  };
  return sourceMap[source] || source;
}

/** 获取行样式类名 */
function getRowClassName({ row }: { row: ExpiryRecord }): string {
  if (row.isExpired) return 'row-expired';
  if (row.isExpiringSoon) return 'row-expiring';
  return '';
}

/** 返回上一页 */
function goBack() {
  router.back();
}

/** 跳转到兑换页面 */
function goToExchange() {
  router.push('/points/exchange');
}

/** 获取数据 */
async function fetchData() {
  loading.value = true;
  try {
    const response = await fetch(
      `/api/v1/user/points/expiry?page=${pageNum.value}&pageSize=${pageSize.value}&includeExpired=${includeExpired.value}`,
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );

    const result = await response.json();

    if (result.code === 0 || result.code === 200) {
      expiryList.value = result.data?.list || [];
      total.value = result.data?.total || 0;
      
      if (result.data?.summary) {
        summary.totalActivePoints = result.data.summary.totalActivePoints || 0;
        summary.totalExpiringPoints = result.data.summary.totalExpiringPoints || 0;
        summary.totalExpiredPoints = result.data.summary.totalExpiredPoints || 0;
      }
    }
  } catch (error) {
    console.error('获取积分有效期明细失败:', error);
    // 使用模拟数据
    const now = new Date();
    const mockData: ExpiryRecord[] = [
      {
        recordId: '1',
        pointsChange: 50,
        acquiredAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        expireAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: false,
        isExpiringSoon: true,
        daysUntilExpiry: 15,
        source: 'work_downloaded',
        description: '作品《设计素材包》被下载',
      },
      {
        recordId: '2',
        pointsChange: 100,
        acquiredAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        expireAt: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: false,
        isExpiringSoon: false,
        daysUntilExpiry: 300,
        source: 'upload_reward',
        description: '上传作品奖励',
      },
    ];
    expiryList.value = mockData;
    total.value = mockData.length;
    summary.totalActivePoints = 150;
    summary.totalExpiringPoints = 50;
    summary.totalExpiredPoints = 0;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="points-expiry-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-button
        :icon="ArrowLeft"
        text
        @click="goBack"
      >
        返回
      </el-button>
      <h2>积分有效期明细</h2>
    </div>

    <!-- 汇总信息 -->
    <div class="summary-cards">
      <div class="summary-card active">
        <div class="card-icon">
          <el-icon><Coin /></el-icon>
        </div>
        <div class="card-info">
          <span class="label">有效积分</span>
          <span class="value">{{ summary.totalActivePoints }}</span>
        </div>
      </div>
      <div class="summary-card expiring">
        <div class="card-icon">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="card-info">
          <span class="label">即将过期</span>
          <span class="value">{{ summary.totalExpiringPoints }}</span>
        </div>
        <span class="hint">30天内</span>
      </div>
      <div class="summary-card expired">
        <div class="card-icon">
          <el-icon><CircleClose /></el-icon>
        </div>
        <div class="card-info">
          <span class="label">已过期</span>
          <span class="value">{{ summary.totalExpiredPoints }}</span>
        </div>
      </div>
    </div>

    <!-- 过期提醒 -->
    <el-alert
      v-if="summary.totalExpiringPoints > 0"
      type="warning"
      :closable="false"
      show-icon
      class="expiry-alert"
    >
      <template #title>
        您有 <strong>{{ summary.totalExpiringPoints }}</strong> 积分将在30天内过期，请尽快使用！
      </template>
      <template #default>
        <el-button
          type="warning"
          size="small"
          @click="goToExchange"
        >
          去兑换
        </el-button>
      </template>
    </el-alert>

    <!-- 筛选选项 -->
    <div class="filter-bar">
      <el-checkbox
        v-model="includeExpired"
        @change="fetchData"
      >
        显示已过期积分
      </el-checkbox>
    </div>

    <!-- 积分明细列表 -->
    <div
      v-loading="loading"
      class="expiry-list"
    >
      <el-table
        :data="expiryList"
        style="width: 100%"
        :row-class-name="getRowClassName"
      >
        <el-table-column
          label="获取时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDateTime(row.acquiredAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="积分"
          width="120"
        >
          <template #default="{ row }">
            <span class="points-value">+{{ row.pointsChange }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="来源"
          min-width="200"
        >
          <template #default="{ row }">
            <span>{{ getSourceText(row.source) }}</span>
            <p
              v-if="row.description"
              class="source-desc"
            >
              {{ row.description }}
            </p>
          </template>
        </el-table-column>
        <el-table-column
          label="过期时间"
          width="180"
        >
          <template #default="{ row }">
            <span v-if="row.expireAt">{{ formatDateTime(row.expireAt) }}</span>
            <span
              v-else
              class="no-expiry"
            >
              永久有效
            </span>
          </template>
        </el-table-column>
        <el-table-column
          label="状态"
          width="140"
        >
          <template #default="{ row }">
            <el-tag
              v-if="row.isExpired"
              type="info"
              size="small"
            >
              已过期
            </el-tag>
            <el-tag
              v-else-if="row.isExpiringSoon"
              type="warning"
              size="small"
            >
              {{ row.daysUntilExpiry }}天后过期
            </el-tag>
            <el-tag
              v-else
              type="success"
              size="small"
            >
              有效
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!loading && expiryList.length === 0"
        description="暂无积分记录"
      />

      <!-- 分页 -->
      <el-pagination
        v-if="total > pageSize"
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        class="pagination"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.points-expiry-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;

  .card-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-size: 24px;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      font-size: 14px;
      color: #999;
    }

    .value {
      font-size: 24px;
      font-weight: 700;
    }
  }

  .hint {
    position: absolute;
    top: 12px;
    right: 12px;
    font-size: 12px;
    color: #999;
  }

  &.active {
    .card-icon {
      background: #e8f5e9;
      color: #4caf50;
    }

    .value {
      color: #4caf50;
    }
  }

  &.expiring {
    .card-icon {
      background: #fff3e0;
      color: #ff9800;
    }

    .value {
      color: #ff9800;
    }
  }

  &.expired {
    .card-icon {
      background: #f5f5f5;
      color: #9e9e9e;
    }

    .value {
      color: #9e9e9e;
    }
  }
}

.expiry-alert {
  margin-bottom: 24px;

  :deep(.el-alert__content) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
}

.filter-bar {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.expiry-list {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .points-value {
    font-weight: 600;
    color: #67c23a;
  }

  .source-desc {
    margin: 4px 0 0 0;
    font-size: 12px;
    color: #999;
  }

  .no-expiry {
    color: #67c23a;
  }

  :deep(.row-expired) {
    background: #fafafa;
    color: #999;

    .points-value {
      color: #999;
    }
  }

  :deep(.row-expiring) {
    background: #fff8e6;
  }
}

.pagination {
  margin-top: 20px;
  justify-content: center;
}

@media (max-width: 768px) {
  .points-expiry-page {
    padding: 16px;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
