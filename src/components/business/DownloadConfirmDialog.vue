<!--
  下载确认弹窗组件
  
  功能：
  - 显示资源标题、所需积分、当前余额
  - 积分不足时显示获取渠道入口
  - 确认/取消按钮
  
  需求: 3.3, 3.4
-->

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Download, Coin, Warning, ShoppingCart } from '@element-plus/icons-vue';

interface Props {
  /** 是否显示弹窗 */
  visible: boolean;
  /** 资源标题 */
  resourceTitle: string;
  /** 所需积分 */
  pointsCost: number;
  /** 当前积分余额 */
  currentPoints: number;
  /** 是否VIP用户 */
  isVip?: boolean;
  /** 定价类型: 0-免费, 1-付费积分, 2-VIP专属 */
  pricingType?: number;
  /** 是否正在下载 */
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isVip: false,
  pricingType: 0,
  loading: false,
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  confirm: [];
  cancel: [];
}>();

const router = useRouter();

// 是否积分充足
const hasEnoughPoints = computed(() => {
  if (props.isVip) return true;
  if (props.pricingType === 0) return true;
  return props.currentPoints >= props.pointsCost;
});

// 积分差额
const pointsGap = computed(() => {
  if (hasEnoughPoints.value) return 0;
  return props.pointsCost - props.currentPoints;
});

// 是否免费下载
const isFreeDownload = computed(() => {
  return props.isVip || props.pricingType === 0 || props.pointsCost === 0;
});

// 弹窗标题
const dialogTitle = computed(() => {
  if (isFreeDownload.value) {
    return '确认下载';
  }
  return '积分下载确认';
});

// 关闭弹窗
function handleClose() {
  emit('update:visible', false);
  emit('cancel');
}

// 确认下载
function handleConfirm() {
  emit('confirm');
}

// 跳转到积分获取页面
function goToPointsPage() {
  handleClose();
  router.push('/personal?tab=points');
}

// 跳转到VIP购买页面
function goToVipPage() {
  handleClose();
  router.push('/vip');
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="420px"
    :close-on-click-modal="false"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <div class="download-confirm-content">
      <!-- 资源信息 -->
      <div class="resource-info">
        <el-icon class="resource-icon"><Download /></el-icon>
        <div class="resource-title">{{ resourceTitle }}</div>
      </div>

      <!-- 积分信息 -->
      <div class="points-info">
        <!-- VIP用户或免费资源 -->
        <template v-if="isFreeDownload">
          <div class="free-download-tip">
            <el-icon class="tip-icon success"><Coin /></el-icon>
            <span v-if="isVip" class="tip-text">VIP用户免费下载</span>
            <span v-else class="tip-text">免费资源，无需消耗积分</span>
          </div>
        </template>

        <!-- 付费资源 -->
        <template v-else>
          <div class="points-row">
            <span class="label">所需积分：</span>
            <span class="value cost">{{ pointsCost }} 积分</span>
          </div>
          <div class="points-row">
            <span class="label">当前余额：</span>
            <span class="value" :class="{ insufficient: !hasEnoughPoints }">
              {{ currentPoints }} 积分
            </span>
          </div>
          
          <!-- 积分不足提示 -->
          <div v-if="!hasEnoughPoints" class="insufficient-tip">
            <el-icon class="tip-icon warning"><Warning /></el-icon>
            <span class="tip-text">积分不足，还需 {{ pointsGap }} 积分</span>
          </div>
        </template>
      </div>

      <!-- 积分获取渠道（积分不足时显示） -->
      <div v-if="!hasEnoughPoints && !isFreeDownload" class="points-channels">
        <div class="channels-title">获取积分方式：</div>
        <div class="channels-list">
          <div class="channel-item" @click="goToPointsPage">
            <el-icon><Coin /></el-icon>
            <span>上传作品赚积分</span>
          </div>
          <div class="channel-item" @click="goToVipPage">
            <el-icon><ShoppingCart /></el-icon>
            <span>开通VIP免费下载</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="loading">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!hasEnoughPoints && !isFreeDownload"
          @click="handleConfirm"
        >
          {{ isFreeDownload ? '确认下载' : `确认消耗 ${pointsCost} 积分下载` }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.download-confirm-content {
  padding: 8px 0;
}

.resource-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.resource-icon {
  font-size: 24px;
  color: #409eff;
}

.resource-title {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
  word-break: break-all;
}

.points-info {
  margin-bottom: 16px;
}

.points-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.points-row:last-child {
  border-bottom: none;
}

.label {
  font-size: 14px;
  color: #606266;
}

.value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.value.cost {
  color: #ff7d00;
}

.value.insufficient {
  color: #f56c6c;
}

.free-download-tip,
.insufficient-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 12px;
}

.free-download-tip {
  background-color: #f0f9eb;
}

.insufficient-tip {
  background-color: #fef0f0;
}

.tip-icon {
  font-size: 18px;
}

.tip-icon.success {
  color: #67c23a;
}

.tip-icon.warning {
  color: #f56c6c;
}

.tip-text {
  font-size: 14px;
}

.free-download-tip .tip-text {
  color: #67c23a;
}

.insufficient-tip .tip-text {
  color: #f56c6c;
}

.points-channels {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #dcdfe6;
}

.channels-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.channels-list {
  display: flex;
  gap: 12px;
}

.channel-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 13px;
  color: #606266;
}

.channel-item:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
