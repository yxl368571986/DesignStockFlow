<!--
  管理后台数据统计页面
  
  功能：
  - 显示核心数据卡片
  - 用户增长趋势图
  - 资源增长趋势图
  - 下载统计图
  - 热门资源排行
  - 热门分类排行
  - 活跃用户排行
  - 时间范围选择器
  
  需求: 需求16, 需求21
-->

<template>
  <div class="statistics-page">
    <div class="page-header">
      <h2 class="page-title">
        数据统计
      </h2>
      
      <!-- 时间范围选择器 -->
      <div class="date-range-picker">
        <el-radio-group
          v-model="dateRange"
          @change="handleDateRangeChange"
        >
          <el-radio-button label="7">
            最近7天
          </el-radio-button>
          <el-radio-button label="30">
            最近30天
          </el-radio-button>
          <el-radio-button label="90">
            最近90天
          </el-radio-button>
          <el-radio-button label="custom">
            自定义
          </el-radio-button>
        </el-radio-group>
        
        <el-date-picker
          v-if="dateRange === 'custom'"
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="ml-3"
          @change="handleCustomDateChange"
        />
      </div>
    </div>

    <!-- 核心数据卡片 -->
    <div class="stats-grid">
      <el-card
        v-loading="loading.overview"
        class="stat-card"
        shadow="hover"
      >
        <div class="stat-content">
          <div class="stat-icon user">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ formatNumber(overview.totalUsers) }}
            </div>
            <div class="stat-label">
              用户总数
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        v-loading="loading.overview"
        class="stat-card"
        shadow="hover"
      >
        <div class="stat-content">
          <div class="stat-icon resource">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ formatNumber(overview.totalResources) }}
            </div>
            <div class="stat-label">
              资源总数
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        v-loading="loading.overview"
        class="stat-card"
        shadow="hover"
      >
        <div class="stat-content">
          <div class="stat-icon download">
            <el-icon><Download /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ formatNumber(overview.todayDownloads) }}
            </div>
            <div class="stat-label">
              今日下载
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        v-loading="loading.overview"
        class="stat-card"
        shadow="hover"
      >
        <div class="stat-content">
          <div class="stat-icon upload">
            <el-icon><Upload /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ formatNumber(overview.todayUploads) }}
            </div>
            <div class="stat-label">
              今日上传
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        v-loading="loading.overview"
        class="stat-card"
        shadow="hover"
      >
        <div class="stat-content">
          <div class="stat-icon vip">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ formatNumber(overview.vipUsers) }}
            </div>
            <div class="stat-label">
              VIP用户
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        v-loading="loading.overview"
        class="stat-card"
        shadow="hover"
      >
        <div class="stat-content">
          <div class="stat-icon audit">
            <el-icon><Select /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">
              {{ formatNumber(overview.pendingAudit) }}
            </div>
            <div class="stat-label">
              待审核
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 趋势图表 -->
    <div class="charts-row">
      <el-card
        v-loading="loading.userGrowth"
        class="chart-card"
        shadow="never"
      >
        <template #header>
          <div class="card-header">
            <span>用户增长趋势</span>
          </div>
        </template>
        <div
          ref="userGrowthChart"
          class="chart-container"
        />
      </el-card>

      <el-card
        v-loading="loading.resourceGrowth"
        class="chart-card"
        shadow="never"
      >
        <template #header>
          <div class="card-header">
            <span>资源增长趋势</span>
          </div>
        </template>
        <div
          ref="resourceGrowthChart"
          class="chart-container"
        />
      </el-card>
    </div>

    <div class="charts-row">
      <el-card
        v-loading="loading.downloadStats"
        class="chart-card full-width"
        shadow="never"
      >
        <template #header>
          <div class="card-header">
            <span>下载统计</span>
          </div>
        </template>
        <div
          ref="downloadStatsChart"
          class="chart-container"
        />
      </el-card>
    </div>

    <!-- 排行榜 -->
    <div class="charts-row">
      <el-card
        v-loading="loading.hotResources"
        class="chart-card"
        shadow="never"
      >
        <template #header>
          <div class="card-header">
            <span>热门资源TOP10</span>
          </div>
        </template>
        <div
          ref="hotResourcesChart"
          class="chart-container"
        />
      </el-card>

      <el-card
        v-loading="loading.hotCategories"
        class="chart-card"
        shadow="never"
      >
        <template #header>
          <div class="card-header">
            <span>热门分类TOP10</span>
          </div>
        </template>
        <div
          ref="hotCategoriesChart"
          class="chart-container"
        />
      </el-card>
    </div>

    <div class="charts-row">
      <el-card
        v-loading="loading.activeUsers"
        class="chart-card full-width"
        shadow="never"
      >
        <template #header>
          <div class="card-header">
            <span>活跃用户TOP10</span>
          </div>
        </template>
        <div
          ref="activeUsersChart"
          class="chart-container"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import {
  User,
  Document,
  Download,
  Upload,
  Star,
  Select
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';
import {
  getOverview,
  getUserGrowth,
  getResourceGrowth,
  getDownloadStats,
  getHotResources,
  getHotCategories,
  getActiveUsers,
  type OverviewData,
  type TrendDataPoint,
  type HotResourceItem,
  type HotCategoryItem,
  type ActiveUserItem
} from '@/api/statistics';

// 数据概览
const overview = ref<OverviewData>({
  totalUsers: 0,
  totalResources: 0,
  todayDownloads: 0,
  todayUploads: 0,
  vipUsers: 0,
  pendingAudit: 0
});

// 加载状态
const loading = ref({
  overview: false,
  userGrowth: false,
  resourceGrowth: false,
  downloadStats: false,
  hotResources: false,
  hotCategories: false,
  activeUsers: false
});

// 日期范围
const dateRange = ref('30');
const customDateRange = ref<[string, string]>(['', '']);

// 图表引用
const userGrowthChart = ref<HTMLElement>();
const resourceGrowthChart = ref<HTMLElement>();
const downloadStatsChart = ref<HTMLElement>();
const hotResourcesChart = ref<HTMLElement>();
const hotCategoriesChart = ref<HTMLElement>();
const activeUsersChart = ref<HTMLElement>();

// 图表实例
let userGrowthChartInstance: ECharts | null = null;
let resourceGrowthChartInstance: ECharts | null = null;
let downloadStatsChartInstance: ECharts | null = null;
let hotResourcesChartInstance: ECharts | null = null;
let hotCategoriesChartInstance: ECharts | null = null;
let activeUsersChartInstance: ECharts | null = null;

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  return num.toString();
};

// 获取数据概览
const fetchOverview = async () => {
  loading.value.overview = true;
  try {
    const response = await getOverview();
    if (response.code === 200 && response.data) {
      overview.value = response.data;
    }
  } catch (error) {
    console.error('获取数据概览失败:', error);
    ElMessage.error('获取数据概览失败');
  } finally {
    loading.value.overview = false;
  }
};

// 获取用户增长趋势
const fetchUserGrowth = async () => {
  loading.value.userGrowth = true;
  try {
    const days = parseInt(dateRange.value);
    const response = await getUserGrowth(days);
    if (response.code === 200 && response.data) {
      renderUserGrowthChart(response.data);
    }
  } catch (error) {
    console.error('获取用户增长趋势失败:', error);
    ElMessage.error('获取用户增长趋势失败');
  } finally {
    loading.value.userGrowth = false;
  }
};

// 获取资源增长趋势
const fetchResourceGrowth = async () => {
  loading.value.resourceGrowth = true;
  try {
    const days = parseInt(dateRange.value);
    const response = await getResourceGrowth(days);
    if (response.code === 200 && response.data) {
      renderResourceGrowthChart(response.data);
    }
  } catch (error) {
    console.error('获取资源增长趋势失败:', error);
    ElMessage.error('获取资源增长趋势失败');
  } finally {
    loading.value.resourceGrowth = false;
  }
};

// 获取下载统计
const fetchDownloadStats = async () => {
  loading.value.downloadStats = true;
  try {
    const days = parseInt(dateRange.value);
    const response = await getDownloadStats(days);
    if (response.code === 200 && response.data) {
      renderDownloadStatsChart(response.data);
    }
  } catch (error) {
    console.error('获取下载统计失败:', error);
    ElMessage.error('获取下载统计失败');
  } finally {
    loading.value.downloadStats = false;
  }
};

// 获取热门资源
const fetchHotResources = async () => {
  loading.value.hotResources = true;
  try {
    const response = await getHotResources();
    if (response.code === 200 && response.data) {
      renderHotResourcesChart(response.data);
    }
  } catch (error) {
    console.error('获取热门资源失败:', error);
    ElMessage.error('获取热门资源失败');
  } finally {
    loading.value.hotResources = false;
  }
};

// 获取热门分类
const fetchHotCategories = async () => {
  loading.value.hotCategories = true;
  try {
    const response = await getHotCategories();
    if (response.code === 200 && response.data) {
      renderHotCategoriesChart(response.data);
    }
  } catch (error) {
    console.error('获取热门分类失败:', error);
    ElMessage.error('获取热门分类失败');
  } finally {
    loading.value.hotCategories = false;
  }
};

// 获取活跃用户
const fetchActiveUsers = async () => {
  loading.value.activeUsers = true;
  try {
    const response = await getActiveUsers();
    if (response.code === 200 && response.data) {
      renderActiveUsersChart(response.data);
    }
  } catch (error) {
    console.error('获取活跃用户失败:', error);
    ElMessage.error('获取活跃用户失败');
  } finally {
    loading.value.activeUsers = false;
  }
};

// 渲染用户增长趋势图
const renderUserGrowthChart = (data: TrendDataPoint[]) => {
  if (!userGrowthChart.value) return;

  if (!userGrowthChartInstance) {
    userGrowthChartInstance = echarts.init(userGrowthChart.value);
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(102, 126, 234, 0.5)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.1)' }
            ]
          }
        },
        lineStyle: {
          color: '#667eea',
          width: 2
        },
        itemStyle: {
          color: '#667eea'
        },
        data: data.map(item => item.count)
      }
    ]
  };

  userGrowthChartInstance.setOption(option);
};

// 渲染资源增长趋势图
const renderResourceGrowthChart = (data: TrendDataPoint[]) => {
  if (!resourceGrowthChart.value) return;

  if (!resourceGrowthChartInstance) {
    resourceGrowthChartInstance = echarts.init(resourceGrowthChart.value);
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增资源',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(240, 147, 251, 0.5)' },
              { offset: 1, color: 'rgba(240, 147, 251, 0.1)' }
            ]
          }
        },
        lineStyle: {
          color: '#f093fb',
          width: 2
        },
        itemStyle: {
          color: '#f093fb'
        },
        data: data.map(item => item.count)
      }
    ]
  };

  resourceGrowthChartInstance.setOption(option);
};

// 渲染下载统计图
const renderDownloadStatsChart = (data: TrendDataPoint[]) => {
  if (!downloadStatsChart.value) return;

  if (!downloadStatsChartInstance) {
    downloadStatsChartInstance = echarts.init(downloadStatsChart.value);
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '下载量',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(79, 172, 254, 0.5)' },
              { offset: 1, color: 'rgba(79, 172, 254, 0.1)' }
            ]
          }
        },
        lineStyle: {
          color: '#4facfe',
          width: 2
        },
        itemStyle: {
          color: '#4facfe'
        },
        data: data.map(item => item.count)
      }
    ]
  };

  downloadStatsChartInstance.setOption(option);
};

// 渲染热门资源图
const renderHotResourcesChart = (data: HotResourceItem[]) => {
  if (!hotResourcesChart.value) return;

  if (!hotResourcesChartInstance) {
    hotResourcesChartInstance = echarts.init(hotResourcesChart.value);
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title).reverse()
    },
    series: [
      {
        name: '下载量',
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ]
          }
        },
        data: data.map(item => item.downloadCount).reverse()
      }
    ]
  };

  hotResourcesChartInstance.setOption(option);
};

// 渲染热门分类图
const renderHotCategoriesChart = (data: HotCategoryItem[]) => {
  if (!hotCategoriesChart.value) return;

  if (!hotCategoriesChartInstance) {
    hotCategoriesChartInstance = echarts.init(hotCategoriesChart.value);
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'center'
    },
    series: [
      {
        name: '资源数量',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map((item, index) => ({
          value: item.resourceCount,
          name: item.categoryName,
          itemStyle: {
            color: [
              '#667eea', '#f093fb', '#4facfe', '#43e97b',
              '#fa709a', '#30cfd0', '#ff7d00', '#165dff',
              '#f53f3f', '#00b42a'
            ][index % 10]
          }
        }))
      }
    ]
  };

  hotCategoriesChartInstance.setOption(option);
};

// 渲染活跃用户图
const renderActiveUsersChart = (data: ActiveUserItem[]) => {
  if (!activeUsersChart.value) return;

  if (!activeUsersChartInstance) {
    activeUsersChartInstance = echarts.init(activeUsersChart.value);
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.nickname)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '下载量',
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#43e97b' },
              { offset: 1, color: '#38f9d7' }
            ]
          }
        },
        data: data.map(item => item.downloadCount)
      }
    ]
  };

  activeUsersChartInstance.setOption(option);
};

// 处理日期范围变化
const handleDateRangeChange = () => {
  if (dateRange.value !== 'custom') {
    fetchUserGrowth();
    fetchResourceGrowth();
    fetchDownloadStats();
  }
};

// 处理自定义日期变化
const handleCustomDateChange = () => {
  if (customDateRange.value && customDateRange.value[0] && customDateRange.value[1]) {
    // TODO: 调用自定义时间范围API
    ElMessage.info('自定义时间范围功能开发中');
  }
};

// 初始化所有图表
const initCharts = async () => {
  await nextTick();
  
  // 获取所有数据
  await Promise.all([
    fetchOverview(),
    fetchUserGrowth(),
    fetchResourceGrowth(),
    fetchDownloadStats(),
    fetchHotResources(),
    fetchHotCategories(),
    fetchActiveUsers()
  ]);
};

// 窗口大小变化时重新渲染图表
const handleResize = () => {
  userGrowthChartInstance?.resize();
  resourceGrowthChartInstance?.resize();
  downloadStatsChartInstance?.resize();
  hotResourcesChartInstance?.resize();
  hotCategoriesChartInstance?.resize();
  activeUsersChartInstance?.resize();
};

onMounted(() => {
  initCharts();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  
  // 销毁图表实例
  userGrowthChartInstance?.dispose();
  resourceGrowthChartInstance?.dispose();
  downloadStatsChartInstance?.dispose();
  hotResourcesChartInstance?.dispose();
  hotCategoriesChartInstance?.dispose();
  activeUsersChartInstance?.dispose();
});
</script>

<style scoped lang="scss">
.statistics-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .date-range-picker {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 24px;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: #fff;

          &.user {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.resource {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.download {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.upload {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }

          &.vip {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          }

          &.audit {
            background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
          }
        }

        .stat-info {
          flex: 1;

          .stat-value {
            font-size: 28px;
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 14px;
            color: #666;
          }
        }
      }
    }
  }

  .charts-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 24px;

    .chart-card {
      &.full-width {
        grid-column: 1 / -1;
      }

      .card-header {
        font-weight: 600;
        font-size: 16px;
      }

      .chart-container {
        width: 100%;
        height: 350px;
      }
    }
  }
}

// 暗黑模式
:global(.dark) {
  .statistics-page {
    .page-header {
      .page-title {
        color: #e0e0e0;
      }
    }

    .stat-card {
      .stat-content {
        .stat-info {
          .stat-value {
            color: #e0e0e0;
          }

          .stat-label {
            color: #999;
          }
        }
      }
    }
  }
}
</style>
