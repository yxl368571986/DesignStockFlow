<script setup lang="ts">
/**
 * 支付方式选择组件
 * 支持微信支付、支付宝、积分兑换
 */

import { computed } from 'vue';

interface Props {
  /** 当前选中的支付方式 */
  modelValue: string;
  /** 微信支付是否可用 */
  wechatEnabled?: boolean;
  /** 支付宝是否可用 */
  alipayEnabled?: boolean;
  /** 积分兑换是否可用 */
  pointsEnabled?: boolean;
  /** 用户积分余额 */
  userPoints?: number;
  /** 兑换所需积分 */
  pointsRequired?: number;
  /** 本月是否已兑换 */
  hasExchangedThisMonth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  wechatEnabled: true,
  alipayEnabled: true,
  pointsEnabled: true,
  userPoints: 0,
  pointsRequired: 0,
  hasExchangedThisMonth: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

/** 支付方式列表 */
const paymentMethods = computed(() => [
  {
    value: 'wechat',
    label: '微信支付',
    icon: 'wechat',
    enabled: props.wechatEnabled,
    disabledReason: '微信支付暂不可用'
  },
  {
    value: 'alipay',
    label: '支付宝',
    icon: 'alipay',
    enabled: props.alipayEnabled,
    disabledReason: '支付宝暂不可用'
  },
  {
    value: 'points',
    label: '积分兑换',
    icon: 'points',
    enabled: props.pointsEnabled && !props.hasExchangedThisMonth && props.userPoints >= props.pointsRequired,
    disabledReason: getPointsDisabledReason()
  }
]);

/** 获取积分兑换不可用原因 */
function getPointsDisabledReason(): string {
  if (!props.pointsEnabled) return '积分兑换暂不可用';
  if (props.hasExchangedThisMonth) return '本月已兑换过';
  if (props.userPoints < props.pointsRequired) {
    return `积分不足（需要${props.pointsRequired}，当前${props.userPoints}）`;
  }
  return '';
}

/** 选择支付方式 */
function selectMethod(method: string) {
  const selected = paymentMethods.value.find(m => m.value === method);
  if (selected?.enabled) {
    emit('update:modelValue', method);
  }
}
</script>

<template>
  <div class="payment-method-selector">
    <div class="selector-title">选择支付方式</div>
    
    <div class="method-list">
      <div
        v-for="method in paymentMethods"
        :key="method.value"
        class="method-item"
        :class="{
          active: modelValue === method.value,
          disabled: !method.enabled
        }"
        @click="selectMethod(method.value)"
      >
        <!-- 图标 -->
        <div class="method-icon" :class="method.icon">
          <template v-if="method.icon === 'wechat'">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
            </svg>
          </template>
          <template v-else-if="method.icon === 'alipay'">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.422 16.656c-2.098-.534-4.088-1.199-5.963-1.994.18-.36.35-.73.51-1.11h4.03v-1.5h-4.89c.11-.39.2-.79.27-1.2h5.12v-1.5h-4.89c.02-.27.03-.54.03-.82v-.68h-1.5v.68c0 .28-.01.55-.03.82H8.5v1.5h4.39c-.07.41-.16.81-.27 1.2H9v1.5h2.89c-.16.38-.34.75-.54 1.11-2.09.89-4.35 1.59-6.78 2.09l.42 1.46c2.09-.43 4.04-1.01 5.85-1.74.89.42 1.82.8 2.78 1.14 1.89.67 3.89 1.2 5.99 1.59l.42-1.46c-1.77-.33-3.46-.77-5.07-1.31-.67-.23-1.32-.48-1.95-.75.89-1.67 1.52-3.53 1.87-5.53h.01c.35 2 .98 3.86 1.87 5.53 1.81.77 3.76 1.31 5.85 1.74l.42-1.46c-2.43-.5-4.69-1.2-6.78-2.09zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </template>
          <template v-else>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
            </svg>
          </template>
        </div>
        
        <!-- 标签 -->
        <div class="method-info">
          <span class="method-label">{{ method.label }}</span>
          <span v-if="!method.enabled" class="method-disabled-reason">
            {{ method.disabledReason }}
          </span>
          <span v-else-if="method.value === 'points'" class="method-points">
            消耗 {{ pointsRequired }} 积分
          </span>
        </div>
        
        <!-- 选中标记 -->
        <div v-if="modelValue === method.value" class="method-check">
          <el-icon><Check /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Check } from '@element-plus/icons-vue';
export default {
  components: { Check }
};
</script>

<style scoped>
.payment-method-selector {
  width: 100%;
}

.selector-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.method-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.method-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #E4E7ED;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.method-item:hover:not(.disabled) {
  border-color: #409EFF;
  background: #F5F7FA;
}

.method-item.active {
  border-color: #409EFF;
  background: #ECF5FF;
}

.method-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #F5F7FA;
}

.method-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.method-icon svg {
  width: 28px;
  height: 28px;
}

.method-icon.wechat {
  background: #E8F5E9;
  color: #07C160;
}

.method-icon.alipay {
  background: #E3F2FD;
  color: #1677FF;
}

.method-icon.points {
  background: #FFF3E0;
  color: #FF9800;
}

.method-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.method-label {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.method-disabled-reason {
  font-size: 12px;
  color: #F56C6C;
}

.method-points {
  font-size: 12px;
  color: #909399;
}

.method-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409EFF;
  color: #fff;
  border-radius: 50%;
}
</style>
