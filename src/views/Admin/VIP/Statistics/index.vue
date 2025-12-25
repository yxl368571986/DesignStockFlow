<script setup lang="ts">
/**
 * VIP统计页面
 * 包含用户增长、收入趋势、套餐销量、退款统计、支付渠道分布、异常订单统计
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, User, Money, TrendCharts, Warning, CreditCard, RefreshRight } from '@element-plus/icons-vue'
import { getVipStatistics, type VipStatistics } from '@/api/vip'
import {
  getRefundStatistics,
  getPaymentChannelDistribution,
  getAbnormalOrderStatistics
} from '@/api/adminVip'
import * as echarts from 'echarts'

const loading = ref(false)
const statistics = ref<VipStatistics | null>(null)

// 扩展统计数据
const refundStats = ref({
  totalRefunds: 0,
  totalRefundAmount: 0,
  pendingRefunds: 0,
  approvedRefunds: 0,
  rejectedRefunds: 0,
  refundRate: 0
})

const paymentChannels = ref<Array<{ channel: string; count: number; amount: number }>>([])

const abnormalOrders = ref({
  timeoutOrders: 0,
  failedPayments: 0,
  suspiciousOrders: 0,
  blockedPayments: 0
})

// 图表实例
const userChartRef = ref<HTMLElement | null>(null)
const revenueChartRef = ref<HTMLElement | null>(null)
const packageChartRef = ref<HTMLElement | null>(null)
const paymentChannelChartRef = ref<HTMLElement | null>(null)
let userChart: echarts.ECharts | null = null
let revenueChart: echarts.ECharts | null = null
let packageChart: echarts.ECharts | null = null
let paymentChannelChart: echarts.ECharts | null = null

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
    
    // 加载扩展统计数据
    await loadExtendedStatistics()
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
    // 使用模拟数据
    loadMockData()
  } finally {
    loading.value = false
  }
}

// 加载扩展统计数据
const loadExtendedStatistics = async () => {
  try {
    // 退款统计
    const refundRes = await getRefundStatistics()
    if (refundRes.code === 200 && refundRes.data) {
      refundStats.value = refundRes.data
    }
    
    // 支付渠道分布
    const channelRes = await getPaymentChannelDistribution()
    if (channelRes.code === 200 && channelRes.data) {
      paymentChannels.value = channelRes.data
      setTimeout(() => renderPaymentChannelChart(), 100)
    }
    
    // 异常订单统计
    const abnormalRes = await getAbnormalOrderStatistics()
    if (abnormalRes.code === 200 && abnormalRes.data) {
      abnormalOrders.value = abnormalRes.data
    }
  } catch (error) {
    console.error('加载扩展统计失败:', error)
    // 使用模拟数据
    loadMockExtendedData()
  }
}

// 模拟数据
const loadMockData = () => {
  statistics.value = {
    totalVipUsers: 1256,
    todayNewVipUsers: 12,
    monthNewVipUsers: 156,
    totalRevenue: 186520.8,
    todayRevenue: 1580.5,
    monthRevenue: 15680.5,
    userGrowthTrend: [
      { date: '01-10', count: 8 },
      { date: '01-11', count: 12 },
      { date: '01-12', count: 15 },
      { date: '01-13', count: 10 },
      { date: '01-14', count: 18 },
      { date: '01-15', count: 12 }
    ],
    revenueTrend: [
      { date: '01-10', amount: 1200 },
      { date: '01-11', amount: 1580 },
      { date: '01-12', amount: 2100 },
      { date: '01-13', amount: 1800 },
      { date: '01-14', amount: 2500 },
      { date: '01-15', amount: 1580 }
    ],
    packageSales: [
      { packageName: '月度会员', salesCount: 450 },
      { packageName: '季度会员', salesCount: 280 },
      { packageName: '年度会员', salesCount: 156 },
      { packageName: '终身会员', salesCount: 45 }
    ]
  }
  setTimeout(() => renderCharts(), 100)
}

// 模拟扩展数据
const loadMockExtendedData = () => {
  refundStats.value = {
    totalRefunds: 23,
    totalRefundAmount: 2580.5,
    pendingRefunds: 5,
    approvedRefunds: 15,
    rejectedRefunds: 3,
    refundRate: 2.5
  }
  
  paymentChannels.value = [
    { channel: '微信支付', count: 580, amount: 45680 },
    { channel: '支付宝', count: 420, amount: 38520 },
    { channel: '积分兑换', count: 156, amount: 0 }
  ]
  
  abnormalOrders.value = {
    timeoutOrders: 45,
    failedPayments: 12,
    suspiciousOrders: 3,
    blockedPayments: 8
  }
  
  setTimeout(() => renderPaymentChannelChart(), 100)
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

// 支付渠道分布图
const renderPaymentChannelChart = () => {
  if (!paymentChannelChartRef.value || paymentChannels.value.length === 0) return
  
  if (paymentChannelChart) {
    paymentChannelChart.dispose()
  }
  
  paymentChannelChart = echarts.init(paymentChannelChartRef.value)
  
  const option: echarts.EChartsOption = {
    title: {
      text: '支付渠道分布',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = paymentChannels.value[params.dataIndex]
        return `${params.name}<br/>订单数: ${data.count}单<br/>金额: ¥${data.amount.toFixed(2)}`
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [{
      name: '支付渠道',
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
        show: true,
        formatter: '{b}: {d}%'
      },
      data: paymentChannels.value.map((item, index) => ({
        name: item.channel,
        value: item.count,
        itemStyle: {
          color: ['#07C160', '#1677FF', '#FFD700'][index] || '#999'
        }
      }))
    }]
  }
  
  paymentChannelChart.setOption(option)
}

// 窗口大小变化时重新渲染图表
const handleResize = () => {
  userChart?.resize()
  revenueChart?.resize()
  packageChart?.resize()
  paymentChannelChart?.resize()
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
  paymentChannelChart?.dispose()
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

      <!-- 退款统计卡片 -->
      <div class="stat-card">
        <div class="stat-icon refund">
          <el-icon><RefreshRight /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">
            {{ refundStats.totalRefunds }}
          </div>
          <div class="stat-label">
            退款申请
          </div>
        </div>
        <div class="stat-extra">
          <span class="pending">待处理 {{ refundStats.pendingRefunds }}</span>
          <span class="rate">退款率 {{ refundStats.refundRate }}%</span>
        </div>
      </div>

      <!-- 支付渠道卡片 -->
      <div class="stat-card">
        <div class="stat-icon channel">
          <el-icon><CreditCard /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">
            {{ paymentChannels.length }}
          </div>
          <div class="stat-label">
            支付渠道
          </div>
        </div>
        <div class="stat-extra">
          <span class="total">
            总订单 {{ paymentChannels.reduce((sum, c) => sum + c.count, 0) }}单
          </span>
        </div>
      </div>

      <!-- 异常订单卡片 -->
      <div class="stat-card">
        <div class="stat-icon abnormal">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">
            {{ abnormalOrders.timeoutOrders + abnormalOrders.failedPayments }}
          </div>
          <div class="stat-label">
            异常订单
          </div>
        </div>
        <div class="stat-extra">
          <span class="timeout">超时 {{ abnormalOrders.timeoutOrders }}</span>
          <span class="blocked">阻止 {{ abnormalOrders.blockedPayments }}</span>
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
        <div class="chart-container">
          <div
            ref="packageChartRef"
            class="chart"
          />
        </div>
        <div class="chart-container">
          <div
            ref="paymentChannelChartRef"
            class="chart"
          />
        </div>
      </div>
    </div>

    <!-- 退款统计详情 -->
    <div class="detail-section">
      <h3 class="section-title">退款统计详情</h3>
      <div class="detail-cards">
        <div class="detail-card">
          <div class="detail-value approved">{{ refundStats.approvedRefunds }}</div>
          <div class="detail-label">已批准</div>
        </div>
        <div class="detail-card">
          <div class="detail-value rejected">{{ refundStats.rejectedRefunds }}</div>
          <div class="detail-label">已拒绝</div>
        </div>
        <div class="detail-card">
          <div class="detail-value amount">¥{{ refundStats.totalRefundAmount.toFixed(2) }}</div>
          <div class="detail-label">退款总额</div>
        </div>
      </div>
    </div>

    <!-- 异常订单详情 -->
    <div class="detail-section">
      <h3 class="section-title">异常订单详情</h3>
      <div class="detail-cards">
        <div class="detail-card">
          <div class="detail-value timeout">{{ abnormalOrders.timeoutOrders }}</div>
          <div class="detail-label">超时订单</div>
        </div>
        <div class="detail-card">
          <div class="detail-value failed">{{ abnormalOrders.failedPayments }}</div>
          <div class="detail-label">支付失败</div>
        </div>
        <div class="detail-card">
          <div class="detail-value suspicious">{{ abnormalOrders.suspiciousOrders }}</div>
          <div class="detail-label">可疑订单</div>
        </div>
        <div class="detail-card">
          <div class="detail-value blocked">{{ abnormalOrders.blockedPayments }}</div>
          <div class="detail-label">阻止支付</div>
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

.stat-icon.refund {
  background: linear-gradient(135deg, #F53F3F, #FF7D00);
}

.stat-icon.channel {
  background: linear-gradient(135deg, #722ED1, #9254DE);
}

.stat-icon.abnormal {
  background: linear-gradient(135deg, #EB2F96, #FF85C0);
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

.stat-extra .pending {
  color: #ff7d00;
}

.stat-extra .rate {
  color: #f53f3f;
}

.stat-extra .timeout {
  color: #ff7d00;
}

.stat-extra .blocked {
  color: #f53f3f;
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
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

/* 详情区域 */
.detail-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 16px 0;
}

.detail-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.detail-card {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.detail-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.detail-value.approved {
  color: #00b42a;
}

.detail-value.rejected {
  color: #f53f3f;
}

.detail-value.amount {
  color: #ff7d00;
}

.detail-value.timeout {
  color: #ff7d00;
}

.detail-value.failed {
  color: #f53f3f;
}

.detail-value.suspicious {
  color: #722ed1;
}

.detail-value.blocked {
  color: #eb2f96;
}

.detail-label {
  font-size: 14px;
  color: #86909c;
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
  
  .detail-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
