<!--
  管理后台 - 数据概览页面
  
  展示：
  - 核心数据卡片
  - 趋势图表
  - 快捷操作
  
  需求: 需求16, 需求21
-->

<template>
  <div class="admin-dashboard">
    <!-- 核心数据卡片 -->
    <div class="dashboard-stats">
      <div class="admin-stat-card admin-fade-in" style="animation-delay: 0s">
        <div class="admin-stat-label">
          <el-icon><User /></el-icon>
          用户总数
        </div>
        <div class="admin-stat-value">{{ stats.totalUsers.toLocaleString() }}</div>
        <div class="admin-stat-trend up">
          <el-icon><CaretTop /></el-icon>
          {{ stats.userGrowth }}%
        </div>
      </div>

      <div class="admin-stat-card admin-fade-in" style="animation-delay: 0.1s">
        <div class="admin-stat-label">
          <el-icon><Document /></el-icon>
          资源总数
        </div>
        <div class="admin-stat-value">{{ stats.totalResources.toLocaleString() }}</div>
        <div class="admin-stat-trend up">
          <el-icon><CaretTop /></el-icon>
          {{ stats.resourceGrowth }}%
        </div>
      </div>

      <div class="admin-stat-card admin-fade-in" style="animation-delay: 0.2s">
        <div class="admin-stat-label">
          <el-icon><Download /></el-icon>
          今日下载
        </div>
        <div class="admin-stat-value">{{ stats.todayDownloads.toLocaleString() }}</div>
        <div class="admin-stat-trend down">
          <el-icon><CaretBottom /></el-icon>
          {{ stats.downloadChange }}%
        </div>
      </div>

      <div class="admin-stat-card admin-fade-in" style="animation-delay: 0.3s">
        <div class="admin-stat-label">
          <el-icon><Star /></el-icon>
          VIP用户
        </div>
        <div class="admin-stat-value">{{ stats.vipUsers.toLocaleString() }}</div>
        <div class="admin-stat-trend up">
          <el-icon><CaretTop /></el-icon>
          {{ stats.vipGrowth }}%
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="dashboard-charts">
      <div class="chart-row">
        <div class="chart-col">
          <AdminChart
            title="用户增长趋势"
            :option="userGrowthOption"
            height="350px"
            :refreshable="true"
            @refresh="loadUserGrowth"
          />
        </div>
        <div class="chart-col">
          <AdminChart
            title="资源增长趋势"
            :option="resourceGrowthOption"
            height="350px"
            :refreshable="true"
            @refresh="loadResourceGrowth"
          />
        </div>
      </div>

      <div class="chart-row">
        <div class="chart-col">
          <AdminChart
            title="热门分类分布"
            :option="categoryDistributionOption"
            height="350px"
          />
        </div>
        <div class="chart-col">
          <AdminChart
            title="下载量统计"
            :option="downloadStatsOption"
            height="350px"
          />
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="dashboard-actions">
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">快捷操作</h3>
        </div>
        <div class="admin-card-body">
          <div class="action-grid">
            <div class="action-item admin-card-interactive" @click="goToAudit">
              <el-icon class="action-icon" :size="32"><Select /></el-icon>
              <div class="action-label">内容审核</div>
              <div class="action-badge" v-if="pendingAudit > 0">{{ pendingAudit }}</div>
            </div>
            <div class="action-item admin-card-interactive" @click="goToUsers">
              <el-icon class="action-icon" :size="32"><User /></el-icon>
              <div class="action-label">用户管理</div>
            </div>
            <div class="action-item admin-card-interactive" @click="goToResources">
              <el-icon class="action-icon" :size="32"><Document /></el-icon>
              <div class="action-label">资源管理</div>
            </div>
            <div class="action-item admin-card-interactive" @click="goToSettings">
              <el-icon class="action-icon" :size="32"><Setting /></el-icon>
              <div class="action-label">系统设置</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminChart from '@/components/common/AdminChart.vue';
import { createLineChartOption, createPieChartOption, createBarChartOption } from '@/utils/chartOptions';
import {
  User,
  Document,
  Download,
  Star,
  CaretTop,
  CaretBottom,
  Select,
  Setting
} from '@element-plus/icons-vue';

const router = useRouter();

// 统计数据
const stats = ref({
  totalUsers: 12580,
  userGrowth: 12.5,
  totalResources: 8964,
  resourceGrowth: 8.3,
  todayDownloads: 1256,
  downloadChange: -3.2,
  vipUsers: 856,
  vipGrowth: 15.8
});

// 待审核数量
const pendingAudit = ref(23);

// 用户增长趋势数据
const userGrowthOption = ref(createLineChartOption({
  xAxis: ['1月', '2月', '3月', '4月', '5月', '6月'],
  series: [{
    name: '新增用户',
    data: [820, 932, 901, 934, 1290, 1330],
    areaStyle: true
  }]
}) as any);

// 资源增长趋势数据
const resourceGrowthOption = ref(createLineChartOption({
  xAxis: ['1月', '2月', '3月', '4月', '5月', '6月'],
  series: [{
    name: '新增资源',
    data: [620, 732, 701, 734, 990, 1130],
    areaStyle: true
  }]
}) as any);

// 分类分布数据
const categoryDistributionOption = ref(createPieChartOption([
  { name: 'UI设计', value: 2580 },
  { name: '插画', value: 1856 },
  { name: '摄影图', value: 1456 },
  { name: '电商', value: 1256 },
  { name: '其他', value: 816 }
]) as any);

// 下载量统计数据
const downloadStatsOption = ref(createBarChartOption({
  xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  series: [{
    name: '下载量',
    data: [820, 932, 901, 934, 1290, 1330, 1120]
  }]
}) as any);

// 加载用户增长数据
const loadUserGrowth = () => {
  console.log('刷新用户增长数据');
  // 这里可以调用API重新加载数据
};

// 加载资源增长数据
const loadResourceGrowth = () => {
  console.log('刷新资源增长数据');
  // 这里可以调用API重新加载数据
};

// 快捷操作导航
const goToAudit = () => {
  router.push('/admin/audit');
};

const goToUsers = () => {
  router.push('/admin/users');
};

const goToResources = () => {
  router.push('/admin/resources');
};

const goToSettings = () => {
  router.push('/admin/settings');
};

onMounted(() => {
  // 初始化数据
  console.log('Dashboard mounted');
});
</script>

<style scoped lang="scss">
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 统计卡片网格
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

// 图表区域
.dashboard-charts {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
}

.chart-col {
  min-width: 0;
}

// 快捷操作
.dashboard-actions {
  .action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    border-radius: var(--admin-radius-md);
    background: var(--admin-bg);
    cursor: pointer;
    position: relative;
    transition: all var(--admin-transition-normal);

    &:hover {
      background: linear-gradient(135deg, rgba(22, 93, 255, 0.08), rgba(255, 125, 0, 0.08));
      
      .action-icon {
        transform: scale(1.2) rotate(5deg);
      }
    }

    .action-icon {
      color: var(--admin-primary);
      margin-bottom: 12px;
      transition: all var(--admin-transition-normal);
    }

    .action-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--admin-text);
    }

    .action-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: linear-gradient(135deg, var(--admin-danger), #F76560);
      color: white;
      font-size: 12px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      animation: pulse 2s infinite;
    }
  }
}

// 响应式
@media (max-width: 1200px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-stats {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .dashboard-actions {
    .action-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
  }
}
</style>
