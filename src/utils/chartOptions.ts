/**
 * ECharts图表配置工具
 * 
 * 提供预设的图表配置，包括：
 * - 折线图
 * - 柱状图
 * - 饼图
 * - 仪表盘
 * 
 * 需求: 需求21 C部分
 */

import type { EChartsOption } from 'echarts';

// 颜色配置
export const chartColors = {
  primary: ['#165DFF', '#4080FF', '#6AA1FF', '#94BFFF', '#BEDAFF'],
  secondary: ['#FF7D00', '#FFA940', '#FFC069', '#FFD591', '#FFE7BA'],
  success: ['#00B42A', '#23C343', '#4CD263', '#7BE188', '#AFF0B5'],
  danger: ['#F53F3F', '#F76560', '#F98981', '#FBACA3', '#FDCDC5'],
  gradient: {
    primary: {
      type: 'linear' as const,
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: 'rgba(22, 93, 255, 0.8)' },
        { offset: 1, color: 'rgba(22, 93, 255, 0.1)' }
      ]
    },
    secondary: {
      type: 'linear' as const,
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: 'rgba(255, 125, 0, 0.8)' },
        { offset: 1, color: 'rgba(255, 125, 0, 0.1)' }
      ]
    }
  }
};

/**
 * 创建折线图配置
 */
export function createLineChartOption(
  data: {
    xAxis: string[];
    series: Array<{
      name: string;
      data: number[];
      smooth?: boolean;
      areaStyle?: boolean;
    }>;
  },
  options?: Partial<EChartsOption>
): EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: data.series.map(s => s.name),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.xAxis,
      axisLine: {
        lineStyle: {
          color: '#e5e6eb'
        }
      },
      axisLabel: {
        color: '#4e5969'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#4e5969'
      },
      splitLine: {
        lineStyle: {
          color: '#f2f3f5',
          type: 'dashed'
        }
      }
    },
    series: data.series.map((item, index) => ({
      name: item.name,
      type: 'line',
      smooth: item.smooth !== false,
      data: item.data,
      lineStyle: {
        width: 3,
        color: chartColors.primary[index % chartColors.primary.length]
      },
      itemStyle: {
        color: chartColors.primary[index % chartColors.primary.length]
      },
      areaStyle: item.areaStyle ? {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: `${chartColors.primary[index % chartColors.primary.length]}80`
            },
            {
              offset: 1,
              color: `${chartColors.primary[index % chartColors.primary.length]}10`
            }
          ]
        } as any
      } : undefined,
      emphasis: {
        focus: 'series'
      }
    })) as any,
    ...options
  };
}

/**
 * 创建柱状图配置
 */
export function createBarChartOption(
  data: {
    xAxis: string[];
    series: Array<{
      name: string;
      data: number[];
      stack?: string;
    }>;
  },
  options?: Partial<EChartsOption>
): EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: data.series.map(s => s.name),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.xAxis,
      axisLine: {
        lineStyle: {
          color: '#e5e6eb'
        }
      },
      axisLabel: {
        color: '#4e5969'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#4e5969'
      },
      splitLine: {
        lineStyle: {
          color: '#f2f3f5',
          type: 'dashed'
        }
      }
    },
    series: data.series.map((item, index) => ({
      name: item.name,
      type: 'bar',
      stack: item.stack,
      data: item.data,
      barWidth: '60%',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: chartColors.primary[index % chartColors.primary.length]
            },
            {
              offset: 1,
              color: chartColors.primary[(index + 1) % chartColors.primary.length]
            }
          ]
        } as any,
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        focus: 'series'
      }
    })) as any,
    ...options
  };
}

/**
 * 创建饼图配置
 */
export function createPieChartOption(
  data: Array<{
    name: string;
    value: number;
  }>,
  options?: Partial<EChartsOption>
): EChartsOption {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'center',
      textStyle: {
        color: '#4e5969'
      }
    },
    series: [
      {
        name: '数据统计',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
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
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map((item, index) => ({
          ...item,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: chartColors.primary[index % chartColors.primary.length]
                },
                {
                  offset: 1,
                  color: chartColors.primary[(index + 1) % chartColors.primary.length]
                }
              ]
            } as any
          }
        }))
      }
    ],
    ...options
  };
}

/**
 * 创建仪表盘配置
 */
export function createGaugeChartOption(
  value: number,
  options?: {
    title?: string;
    max?: number;
    unit?: string;
  } & Partial<EChartsOption>
): EChartsOption {
  const { title = '完成率', max = 100, unit = '%', ...restOptions } = options || {};

  return {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max,
        splitNumber: 8,
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.3, '#F53F3F'],
              [0.7, '#FF7D00'],
              [1, '#00B42A']
            ]
          }
        },
        pointer: {
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          distance: -20,
          length: 8,
          lineStyle: {
            color: '#fff',
            width: 2
          }
        },
        splitLine: {
          distance: -20,
          length: 20,
          lineStyle: {
            color: '#fff',
            width: 4
          }
        },
        axisLabel: {
          color: 'auto',
          distance: 30,
          fontSize: 12
        },
        detail: {
          valueAnimation: true,
          formatter: `{value}${unit}`,
          color: 'auto',
          fontSize: 24,
          offsetCenter: [0, '70%']
        },
        title: {
          show: true,
          offsetCenter: [0, '90%'],
          fontSize: 14,
          color: '#4e5969'
        },
        data: [
          {
            value,
            name: title
          }
        ]
      }
    ],
    ...restOptions
  };
}

/**
 * 创建雷达图配置
 */
export function createRadarChartOption(
  data: {
    indicator: Array<{ name: string; max: number }>;
    series: Array<{
      name: string;
      value: number[];
    }>;
  },
  options?: Partial<EChartsOption>
): EChartsOption {
  return {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: data.series.map(s => s.name),
      bottom: 0
    },
    radar: {
      indicator: data.indicator,
      shape: 'circle',
      splitNumber: 5,
      axisName: {
        color: '#4e5969'
      },
      splitLine: {
        lineStyle: {
          color: '#e5e6eb'
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(22, 93, 255, 0.05)', 'rgba(22, 93, 255, 0.02)']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#e5e6eb'
        }
      }
    },
    series: [
      {
        type: 'radar',
        data: data.series.map((item, index) => ({
          value: item.value,
          name: item.name,
          lineStyle: {
            color: chartColors.primary[index % chartColors.primary.length],
            width: 2
          },
          areaStyle: {
            color: `${chartColors.primary[index % chartColors.primary.length]}40`
          },
          itemStyle: {
            color: chartColors.primary[index % chartColors.primary.length]
          }
        })) as any
      }
    ],
    ...options
  };
}
