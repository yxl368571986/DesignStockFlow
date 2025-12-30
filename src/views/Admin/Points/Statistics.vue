<script setup lang="ts">
/**
 * 积分统计页面
 * 展示充值统计和积分流水统计
 */
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { TrendCharts, DataLine, Coin, Download } from '@element-plus/icons-vue';
import {
  getRechargeStatistics,
  getPointsFlowStatistics,
  type RechargeStatistics,
  type PointsFlowStatistics
} from '@/api/adminRecharge';
import * as echarts from 'echarts';

// 统计维度
type Dimension = 'day' | 'week' | 'month' | 'year';

// 当前维度
const dimension = ref<Dimension>('day');

// 日期范围
const dateRange = ref<[Date, Date] | null>(null);

// 加载状态
const loading = ref(false);

// 统计数据
const rechargeStats = ref<RechargeStatistics | null>(null);
const pointsFlowStats = ref<PointsFlowStatistics | null>(null);

// 图表实例
let rechargeChart: echarts.ECharts | null = null;
let pointsFlowChart: echarts.ECharts | null = null;

// 维度选项
const dimensionOptions = [
  { label: '按日', value: 'day' },
  { label: '按周', value: 'week' },
  { label: '按月', value: 'month' },
  { label: '按年', value: 'year' }
];

// 快捷日期选项
const shortcuts = [
  {
    text: '最近7天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    }
  },
  {
    text: '最近30天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    }
  },
  {
    text: '最近90天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
      return [start, end];
    }
  },
  {
    text: '本月',
    value: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      return [start, end];
    }
  },
  {
    text: '本年',
    value: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), 0, 1);
      return [start, end];
    }
  }
];

// 格式化日期
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// 获取积分类型名称
const getTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    recharge: '充值',
    download: '下载消耗',
    upload: '上传奖励',
    sign_in: '签到奖励',
    task: '任务奖励',
    admin_add: '管理员增加',
    admin_deduct: '管理员扣除',
    gift: '赠送',
    exchange: '兑换消耗',
    refund: '退款返还'
  };
  return typeMap[type] || type;
};

// 加载统计数据
const loadStatistics = async () => {
  loading.value = true;
  try {
    const params: {
      dimension: Dimension;
      startDate?: string;
      endDate?: string;
    } = { dimension: dimension.value };

    if (dateRange.value) {
      params.startDate = formatDate(dateRange.value[0]);
      params.endDate = formatDate(dateRange.value[1]);
    }

    const [rechargeRes, pointsFlowRes] = await Promise.all([
      getRechargeStatistics(params),
      getPointsFlowStatistics(params)
    ]);

    if (rechargeRes.code === 200) {
      rechargeStats.value = rechargeRes.data;
      updateRechargeChart();
    }

    if (pointsFlowRes.code === 200) {
      pointsFlowStats.value = pointsFlowRes.data;
      updatePointsFlowChart();
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
    ElMessage.error('加载统计数据失败');
  } finally {
    loading.value = false;
  }
};

// 更新充值统计图表
const updateRechargeChart = () => {
  if (!rechargeStats.value || !rechargeChart) return;

  const { stats } = rechargeStats.value;
  const dates = stats.map(s => s.date);
  const amounts = stats.map(s => s.totalAmount);
  const points = stats.map(s => s.totalPoints);
  const orders = stats.map(s => s.orderCount);

  rechargeChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['充值金额(元)', '充值积分', '订单数']
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
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '金额/积分',
        position: 'left'
      },
      {
        type: 'value',
        name: '订单数',
        position: 'right'
      }
    ],
    series: [
      {
        name: '充值金额(元)',
        type: 'line',
        smooth: true,
        data: amounts,
        itemStyle: { color: '#165DFF' }
      },
      {
        name: '充值积分',
        type: 'line',
        smooth: true,
        data: points,
        itemStyle: { color: '#FF7D00' }
      },
      {
        name: '订单数',
        type: 'bar',
        yAxisIndex: 1,
        data: orders,
        itemStyle: { color: '#00B42A' }
      }
    ]
  });
};

// 更新积分流水图表
const updatePointsFlowChart = () => {
  if (!pointsFlowStats.value || !pointsFlowChart) return;

  const { stats } = pointsFlowStats.value;
  const dates = stats.map(s => s.date);
  const earned = stats.map(s => s.earned);
  const consumed = stats.map(s => s.consumed);
  const net = stats.map(s => s.net);

  pointsFlowChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['获得积分', '消耗积分', '净变化']
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
      data: dates
    },
    yAxis: {
      type: 'value',
      name: '积分'
    },
    series: [
      {
        name: '获得积分',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: earned,
        itemStyle: { color: '#00B42A' }
      },
      {
        name: '消耗积分',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: consumed,
        itemStyle: { color: '#F53F3F' }
      },
      {
        name: '净变化',
        type: 'line',
        smooth: true,
        data: net,
        itemStyle: { color: '#165DFF' }
      }
    ]
  });
};

// 初始化图表
const initCharts = () => {
  const rechargeChartDom = document.getElementById('rechargeChart');
  const pointsFlowChartDom = document.getElementById('pointsFlowChart');

  if (rechargeChartDom) {
    rechargeChart = echarts.init(rechargeChartDom);
  }
  if (pointsFlowChartDom) {
    pointsFlowChart = echarts.init(pointsFlowChartDom);
  }

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    rechargeChart?.resize();
    pointsFlowChart?.resize();
  });
};

// 导出Excel
const exportExcel = () => {
  if (!rechargeStats.value || !pointsFlowStats.value) {
    ElMessage.warning('暂无数据可导出');
    return;
  }

  // 构建CSV内容
  let csv = '充值统计\n';
  csv += '日期,充值金额(元),充值积分,订单数,用户数\n';
  rechargeStats.value.stats.forEach(s => {
    csv += `${s.date},${s.totalAmount},${s.totalPoints},${s.orderCount},${s.userCount}\n`;
  });

  csv += '\n积分流水统计\n';
  csv += '日期,获得积分,消耗积分,净变化\n';
  pointsFlowStats.value.stats.forEach(s => {
    csv += `${s.date},${s.earned},${s.consumed},${s.net}\n`;
  });

  // 下载文件
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `积分统计_${formatDate(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);

  ElMessage.success('导出成功');
};

// 监听维度和日期变化
watch([dimension, dateRange], () => {
  loadStatistics();
});

// 组件挂载
onMounted(() => {
  // 设置默认日期范围为最近30天
  const end = new Date();
  const start = new Date();
  start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
  dateRange.value = [start, end];

  // 初始化图表
  setTimeout(() => {
    initCharts();
    loadStatistics();
  }, 100);
});
</script>

<template>
  <div class="statistics-page">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><TrendCharts /></el-icon>
        积分统计
      </h2>
      <div class="header-actions">
        <el-select
          v-model="dimension"
          placeholder="选择维度"
          style="width: 120px"
        >
          <el-option
            v-for="opt in dimensionOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="shortcuts"
          style="width: 280px"
        />
        <el-button
          type="primary"
          :icon="Download"
          @click="exportExcel"
        >
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 汇总卡片 -->
    <div
      v-loading="loading"
      class="summary-cards"
    >
      <!-- 充值汇总 -->
      <el-card class="summary-card">
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon recharge">
              <Coin />
            </el-icon>
            <span>充值汇总</span>
          </div>
        </template>
        <div
          v-if="rechargeStats"
          class="summary-content"
        >
          <div class="summary-item">
            <span class="label">总充值金额</span>
            <span class="value">¥{{ rechargeStats.summary.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">总充值积分</span>
            <span class="value">{{ rechargeStats.summary.totalPoints.toLocaleString() }}</span>
          </div>
          <div class="summary-item">
            <span class="label">总订单数</span>
            <span class="value">{{ rechargeStats.summary.totalOrders }}</span>
          </div>
          <div class="summary-item">
            <span class="label">充值用户数</span>
            <span class="value">{{ rechargeStats.summary.totalUsers }}</span>
          </div>
        </div>
        <el-empty
          v-else
          description="暂无数据"
          :image-size="60"
        />
      </el-card>

      <!-- 积分流水汇总 -->
      <el-card class="summary-card">
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon flow">
              <DataLine />
            </el-icon>
            <span>积分流水汇总</span>
          </div>
        </template>
        <div
          v-if="pointsFlowStats"
          class="summary-content"
        >
          <div class="summary-item">
            <span class="label">总获得积分</span>
            <span class="value earned">+{{ pointsFlowStats.summary.totalEarned.toLocaleString() }}</span>
          </div>
          <div class="summary-item">
            <span class="label">总消耗积分</span>
            <span class="value consumed">-{{ pointsFlowStats.summary.totalConsumed.toLocaleString() }}</span>
          </div>
          <div class="summary-item">
            <span class="label">净变化</span>
            <span
              class="value"
              :class="pointsFlowStats.summary.netChange >= 0 ? 'earned' : 'consumed'"
            >
              {{ pointsFlowStats.summary.netChange >= 0 ? '+' : '' }}{{ pointsFlowStats.summary.netChange.toLocaleString() }}
            </span>
          </div>
        </div>
        <el-empty
          v-else
          description="暂无数据"
          :image-size="60"
        />
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <!-- 充值趋势图 -->
      <el-card class="chart-card">
        <template #header>
          <span>充值趋势</span>
        </template>
        <div
          id="rechargeChart"
          v-loading="loading"
          class="chart-container"
        />
      </el-card>

      <!-- 积分流水趋势图 -->
      <el-card class="chart-card">
        <template #header>
          <span>积分流水趋势</span>
        </template>
        <div
          id="pointsFlowChart"
          v-loading="loading"
          class="chart-container"
        />
      </el-card>
    </div>

    <!-- 积分类型分布 -->
    <el-card
      v-if="pointsFlowStats?.summary.byType"
      class="type-distribution"
    >
      <template #header>
        <span>积分类型分布</span>
      </template>
      <div class="type-list">
        <div
          v-for="(value, type) in pointsFlowStats.summary.byType"
          :key="type"
          class="type-item"
        >
          <span class="type-name">{{ getTypeName(type as string) }}</span>
          <span
            class="type-value"
            :class="value >= 0 ? 'positive' : 'negative'"
          >
            {{ value >= 0 ? '+' : '' }}{{ value.toLocaleString() }}
          </span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.statistics-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  background: #fff;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.card-icon {
  font-size: 20px;
}

.card-icon.recharge {
  color: #ff7d00;
}

.card-icon.flow {
  color: #165dff;
}

.summary-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item .label {
  font-size: 13px;
  color: #86909c;
}

.summary-item .value {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
}

.summary-item .value.earned {
  color: #00b42a;
}

.summary-item .value.consumed {
  color: #f53f3f;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background: #fff;
}

.chart-container {
  height: 350px;
}

.type-distribution {
  background: #fff;
}

.type-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
}

.type-name {
  font-size: 13px;
  color: #86909c;
  margin-bottom: 4px;
}

.type-value {
  font-size: 18px;
  font-weight: 600;
}

.type-value.positive {
  color: #00b42a;
}

.type-value.negative {
  color: #f53f3f;
}

@media (max-width: 1200px) {
  .summary-cards,
  .charts-section {
    grid-template-columns: 1fr;
  }

  .type-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .summary-content {
    grid-template-columns: 1fr;
  }

  .type-list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
