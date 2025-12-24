<script setup lang="ts">
/**
 * VIP统计页面
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, User, Money, TrendCharts } from '@element-plus/icons-vue'
import { getVipStatistics, type VipStatistics } from '@/api/vip'
import * as echarts from 'echarts'

const loading = ref(false)
const statistics = ref<VipStatistics | null>(null)

// 图表实例
const userChartRef = ref<HTMLElement | null>(null)
const revenueChartRef = ref<HTMLElement | null>(null)
const packageChartRef = ref<HTMLElement | null>(null)
let userChart: echarts.ECharts | null = null
let revenueChart: echarts.ECharts | null = null
let packageChart: echarts.ECharts | null = null

// 加载统计数据
const loadStatistics = async () => {
  loading.value = true
  try {
    const res = await getVipStatistics()
    if (res.code === 200) {
      statistics.value = res.data
      // 渲染图表
      setTimeout(() => {
        renderCharts()
      }, 100)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

// 渲染图表
const renderCharts = () => {
  if (!statistics.value) return
  
  renderUserGrowthChart()
  renderRevenueChart()
  renderPackageSalesChart()
}

// 用户增长趋势图
const renderUserGrowthChart = () => {
  if (!userChartRef.value || !statistics.value) return
  
  if (userChart) {
    userChart.dispose()
  }
  
  userChart = echarts.init(userChartRef.value)
  const data = statistics.value.userGrowthTrend || []
  
  const option: echarts.EChartsOption = {
    title: {
      text: 'VIP用户增长趋势',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>新增用户: {c}人'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '用户数'
    },
    series: [{
      name: '新增用户',
      type: 'line',
      smooth: true,
      data: data.map(item => item.count),
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(22, 93, 255, 0.3)' },
          { offset: 1, color: 'rgba(22, 93, 255, 0.05)' }
        ])
      },
      lineStyle: { color: '#165DFF' },
      itemStyle: { color: '#165DFF' }
    }]
  }
  
  userChart.setOption(option)
}

// 收入趋势图
const renderRevenueChart = () => {
  if (!revenueChartRef.value || !statistics.value) return
  
  if (revenueChart) {
    revenueChart.dispose()
  }
  
  revenueChart = echarts.init(revenueChartRef.value)
  const data = statistics.value.revenueTrend || []
  
  const option: echarts.EChartsOption = {
    title: {
      text: '收入趋势',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>收入: ¥{c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '金额(元)'
    },
    series: [{
      name: '收入',
      type: 'bar',
      data: data.map(item => item.amount),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#FF7D00' },
          { offset: 1, color: '#FFA940' }
        ])
      }
    }]
  }
  
  revenueChart.setOption(option)
}

// 套餐销量饼图
const renderPackageSalesChart = () => {
  if (!packageChartRef.value || !statistics.value) return
  
  if (packageChart) {
    packageChart.dispose()
  }
  
  packageChart = echarts.init(packageChartRef.value)
  const data = statistics.value.packageSales || []
  
  const option: echarts.EChartsOption = {
    title: {
      text: '套餐销量分布',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}单 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [{
      name: '套餐销量',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
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
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: data.map(item => ({
        name: item.packageName,
        value: item.salesCount
      }))
    }]
  }
  
  packageChart.setOption(option)
}

// 窗口大小变化时重新渲染图表
const handleResize = () => {
  userChart?.resize()
  revenueChart?.resize()
  packageChart?.resize()
}

// 格式化金额
const formatMoney = (value: number) => {
  if (value >= 10000) {
    return (value / 10000).toFixed(2) + '万'
  }
  return value.toFixed(2)
}

onMounted(() => {
  loadStatistics()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  userChart?.dispose()
  revenueChart?.dispose()
  packageChart?.dispose()
})
</script>

<template>
  <div
    v-loading="loading"
    class="statistics-page"
  >
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button
        :icon="Refresh"
        @click="loadStatistics"
      >
        刷新数据
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon user">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">
            {{ statistics?.totalVipUsers || 0 }}
          </div>
          <div class="stat-label">
            VIP总用户
          </div>
        </div>
        <div class="stat-extra">
          <span class="today">今日 +{{ statistics?.todayNewVipUsers || 0 }}</span>
          <span class="month">本月 +{{ statistics?.monthNewVipUsers || 0 }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon revenue">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">
            ¥{{ formatMoney(statistics?.totalRevenue || 0) }}
          </div>
          <div class="stat-label">
            累计收入
          </div>
        </div>
        <div class="stat-extra">
          <span class="today">今日 ¥{{ statistics?.todayRevenue || 0 }}</span>
          <span class="month">本月 ¥{{ formatMoney(statistics?.monthRevenue || 0) }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon trend">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">
            {{ statistics?.packageSales?.length || 0 }}
          </div>
          <div class="stat-label">
            在售套餐
          </div>
        </div>
        <div class="stat-extra">
          <span class="total">
            总销量 {{ statistics?.packageSales?.reduce((sum, p) => sum + p.salesCount, 0) || 0 }}单
          </span>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-row">
        <div class="chart-container">
          <div
            ref="userChartRef"
            class="chart"
          />
        </div>
        <div class="chart-container">
          <div
            ref="revenueChartRef"
            class="chart"
          />
        </div>
      </div>
      <div class="chart-row">
        <div class="chart-container full">
          <div
            ref="packageChartRef"
            class="chart"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.statistics-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.toolbar {
  margin-bottom: 16px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-icon.user {
  background: linear-gradient(135deg, #165DFF, #4080FF);
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #FF7D00, #FFA940);
}

.stat-icon.trend {
  background: linear-gradient(135deg, #00B42A, #23C343);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #86909c;
  margin-top: 4px;
}

.stat-extra {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #86909c;
}

.stat-extra .today {
  color: #00b42a;
}

.stat-extra .month {
  color: #165dff;
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-container.full {
  grid-column: span 2;
}

.chart {
  width: 100%;
  height: 300px;
}

@media (max-width: 1200px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-row {
    grid-template-columns: 1fr;
  }
  
  .chart-container.full {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .stat-cards {
    grid-template-columns: 1fr;
  }
}
</style>
