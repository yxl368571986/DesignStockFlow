<!--
  管理后台图表组件
  
  功能：
  - 使用ECharts图表库
  - 支持折线图、柱状图、饼图、仪表盘
  - 渐变色填充
  - 鼠标悬浮显示详细数据
  - 支持图表导出
  - 响应式自适应
  
  需求: 需求21 C部分
-->

<template>
  <div class="admin-chart-wrapper">
    <div class="admin-chart-header" v-if="title">
      <h3 class="admin-chart-title">{{ title }}</h3>
      <div class="admin-chart-actions">
        <el-button 
          v-if="exportable" 
          size="small" 
          :icon="Download" 
          @click="exportChart"
        >
          导出图片
        </el-button>
        <el-button 
          v-if="refreshable" 
          size="small" 
          :icon="Refresh" 
          @click="refreshChart"
        >
          刷新
        </el-button>
      </div>
    </div>
    <div 
      ref="chartRef" 
      class="admin-chart" 
      :style="{ height: height }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { Download, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

interface Props {
  title?: string;
  option: echarts.EChartsOption | Record<string, unknown>;
  height?: string;
  exportable?: boolean;
  refreshable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  exportable: true,
  refreshable: false
});

const emit = defineEmits<{
  refresh: [];
}>();

const chartRef = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;

  // 如果已存在实例，先销毁
  if (chartInstance) {
    chartInstance.dispose();
  }

  // 创建图表实例
  chartInstance = echarts.init(chartRef.value);

  // 将option转换为EChartsOption类型
  const chartOption = props.option as echarts.EChartsOption;

  // 设置默认主题配置
  const defaultOption: echarts.EChartsOption = {
    ...chartOption,
    // 全局配置
    backgroundColor: 'transparent',
    // 工具提示
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e6eb',
      borderWidth: 1,
      textStyle: {
        color: '#1d2129'
      },
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      ...(chartOption.tooltip as object || {})
    },
    // 图例
    legend: {
      textStyle: {
        color: '#4e5969'
      },
      ...(chartOption.legend as object || {})
    },
    // 网格
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      ...(chartOption.grid as object || {})
    }
  };

  // 应用配置
  chartInstance.setOption(defaultOption);

  // 添加点击事件
  chartInstance.on('click', (params) => {
    console.log('Chart clicked:', params);
  });
};

// 导出图表为图片
const exportChart = () => {
  if (!chartInstance) return;

  try {
    const url = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    });

    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart-${Date.now()}.png`;
    link.click();

    ElMessage.success('图表导出成功');
  } catch (error) {
    console.error('Export chart error:', error);
    ElMessage.error('图表导出失败');
  }
};

// 刷新图表
const refreshChart = () => {
  emit('refresh');
};

// 响应式调整
const handleResize = () => {
  chartInstance?.resize();
};

// 监听配置变化
watch(() => props.option, () => {
  nextTick(() => {
    initChart();
  });
}, { deep: true });

// 生命周期
onMounted(() => {
  nextTick(() => {
    initChart();
  });

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
  chartInstance = null;
});

// 暴露方法
defineExpose({
  refresh: initChart,
  getInstance: () => chartInstance
});
</script>

<style scoped lang="scss">
.admin-chart-wrapper {
  background: var(--admin-bg-light);
  border-radius: var(--admin-radius-lg);
  padding: 20px;
  box-shadow: var(--admin-shadow-sm);
  transition: all var(--admin-transition-normal);

  &:hover {
    box-shadow: var(--admin-shadow-md);
  }
}

.admin-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--admin-border-light);
}

.admin-chart-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--admin-text);
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    width: 4px;
    height: 16px;
    background: linear-gradient(135deg, var(--admin-primary), var(--admin-primary-light));
    border-radius: 2px;
  }
}

.admin-chart-actions {
  display: flex;
  gap: 8px;
}

.admin-chart {
  width: 100%;
  transition: opacity var(--admin-transition-normal);
}
</style>
