<!--
  定价类型选择器组件
  
  功能：
  - 三种定价类型单选按钮（免费、付费积分、VIP专属）
  - 付费积分时显示积分设置（下拉框+滑块联动）
  - 积分值自动吸附到5的倍数
  
  需求: 1.1, 1.2, 1.3, 1.4, 1.5, 2.4, 2.5, 2.6
-->

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Check } from '@element-plus/icons-vue';

/**
 * 定价类型枚举
 * 0: 免费资源
 * 1: 付费积分资源
 * 2: VIP专属资源
 */
const PRICING_TYPE_FREE = 0;
const PRICING_TYPE_PAID = 1;
const PRICING_TYPE_VIP = 2;

interface Props {
  /** 定价类型 */
  pricingType?: number;
  /** 积分价格 */
  pointsCost?: number;
  /** 是否禁用 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  pricingType: 0,
  pointsCost: 0,
  disabled: false,
});

const emit = defineEmits<{
  'update:pricingType': [value: number];
  'update:pointsCost': [value: number];
  change: [pricingType: number, pointsCost: number];
}>();

// 内部状态
const internalPricingType = ref(props.pricingType);
const internalPointsCost = ref(props.pointsCost || 5);

// 积分选项（5-100，步长5）
const pointsOptions = computed(() => {
  const options = [];
  for (let i = 5; i <= 100; i += 5) {
    options.push({ value: i, label: `${i}积分` });
  }
  return options;
});

// 定价类型选项
const pricingTypeOptions = [
  {
    value: PRICING_TYPE_FREE,
    label: '免费资源',
    description: '所有用户可免费下载',
    icon: '🆓',
  },
  {
    value: PRICING_TYPE_PAID,
    label: '付费积分',
    description: '用户需消耗积分下载',
    icon: '💰',
  },
  {
    value: PRICING_TYPE_VIP,
    label: 'VIP专属',
    description: '仅VIP用户可下载',
    icon: '👑',
  },
];

// 监听外部属性变化
watch(() => props.pricingType, (newVal) => {
  internalPricingType.value = newVal;
});

watch(() => props.pointsCost, (newVal) => {
  if (newVal && newVal > 0) {
    internalPointsCost.value = snapToNearestFive(newVal);
  }
});

/**
 * 将积分值吸附到最近的5的倍数
 */
function snapToNearestFive(value: number): number {
  const snapped = Math.round(value / 5) * 5;
  return Math.max(5, Math.min(100, snapped));
}

/**
 * 处理定价类型变化
 */
function handlePricingTypeChange(type: number) {
  internalPricingType.value = type;
  
  // 如果切换到付费积分，确保有默认积分值
  let pointsCost = 0;
  if (type === PRICING_TYPE_PAID) {
    pointsCost = internalPointsCost.value || 5;
  }
  
  emit('update:pricingType', type);
  emit('update:pointsCost', pointsCost);
  emit('change', type, pointsCost);
}

/**
 * 处理积分值变化（下拉框）
 */
function handlePointsSelectChange(value: number) {
  internalPointsCost.value = value;
  emit('update:pointsCost', value);
  emit('change', internalPricingType.value, value);
}

/**
 * 处理积分值变化（滑块）
 */
function handlePointsSliderChange(value: number) {
  const snappedValue = snapToNearestFive(value);
  if (snappedValue !== internalPointsCost.value) {
    internalPointsCost.value = snappedValue;
    emit('update:pointsCost', snappedValue);
    emit('change', internalPricingType.value, snappedValue);
  }
}

/**
 * 处理滑块输入（实时吸附）
 */
function handleSliderInput(value: number) {
  // 实时显示吸附后的值
  const snappedValue = snapToNearestFive(value);
  if (snappedValue !== value) {
    internalPointsCost.value = snappedValue;
  }
}

// 是否显示积分设置
const showPointsSettings = computed(() => {
  return internalPricingType.value === PRICING_TYPE_PAID;
});

// 滑块标记
const sliderMarks = {
  5: '5',
  25: '25',
  50: '50',
  75: '75',
  100: '100',
};
</script>

<template>
  <div class="pricing-type-selector">
    <!-- 定价类型选择 -->
    <div class="pricing-type-options">
      <div
        v-for="option in pricingTypeOptions"
        :key="option.value"
        class="pricing-type-option"
        :class="{
          'is-active': internalPricingType === option.value,
          'is-disabled': disabled,
        }"
        @click="!disabled && handlePricingTypeChange(option.value)"
      >
        <div class="option-icon">{{ option.icon }}</div>
        <div class="option-content">
          <div class="option-label">{{ option.label }}</div>
          <div class="option-description">{{ option.description }}</div>
        </div>
        <div class="option-check" v-if="internalPricingType === option.value">
          <el-icon><Check /></el-icon>
        </div>
      </div>
    </div>

    <!-- 积分设置（仅付费积分时显示） -->
    <div v-if="showPointsSettings" class="points-settings">
      <div class="points-header">
        <span class="points-label">设置积分价格</span>
        <span class="points-hint">积分范围：5-100，步长为5</span>
      </div>
      
      <div class="points-controls">
        <!-- 下拉框选择 -->
        <el-select
          v-model="internalPointsCost"
          :disabled="disabled"
          placeholder="选择积分"
          class="points-select"
          @change="handlePointsSelectChange"
        >
          <el-option
            v-for="option in pointsOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <!-- 滑块选择 -->
        <div class="points-slider-wrapper">
          <el-slider
            v-model="internalPointsCost"
            :min="5"
            :max="100"
            :step="5"
            :marks="sliderMarks"
            :disabled="disabled"
            show-stops
            @change="handlePointsSliderChange"
            @input="handleSliderInput"
          />
        </div>
      </div>

      <!-- 积分预览 -->
      <div class="points-preview">
        <span class="preview-label">当前定价：</span>
        <span class="preview-value">{{ internalPointsCost }} 积分</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pricing-type-selector {
  width: 100%;
}

.pricing-type-options {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.pricing-type-option {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.pricing-type-option:hover:not(.is-disabled) {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.pricing-type-option.is-active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.pricing-type-option.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.option-icon {
  font-size: 24px;
  margin-right: 12px;
}

.option-content {
  flex: 1;
}

.option-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.option-description {
  font-size: 12px;
  color: #909399;
}

.option-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background-color: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.points-settings {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.points-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.points-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.points-hint {
  font-size: 12px;
  color: #909399;
}

.points-controls {
  display: flex;
  align-items: center;
  gap: 24px;
}

.points-select {
  width: 120px;
}

.points-slider-wrapper {
  flex: 1;
  padding: 0 10px;
}

.points-preview {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
  text-align: center;
}

.preview-label {
  font-size: 14px;
  color: #606266;
}

.preview-value {
  font-size: 18px;
  font-weight: 600;
  color: #ff7d00;
  margin-left: 8px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .pricing-type-options {
    flex-direction: column;
  }

  .points-controls {
    flex-direction: column;
    gap: 16px;
  }

  .points-select {
    width: 100%;
  }

  .points-slider-wrapper {
    width: 100%;
  }
}
</style>
