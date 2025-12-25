<script setup lang="ts">
/**
 * VIP推广弹窗组件
 * 用于非VIP用户尝试下载VIP资源时显示
 */

import { useRouter } from 'vue-router';
import { Download, Promotion, Star, Service } from '@element-plus/icons-vue';
import VipIcon from './VipIcon.vue';

interface Props {
  /** 是否显示 */
  visible: boolean;
  /** 资源ID（用于跳转后返回） */
  resourceId?: string;
  /** 资源标题 */
  resourceTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  resourceId: '',
  resourceTitle: ''
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  close: [];
}>();

const router = useRouter();

/** 关闭弹窗 */
function handleClose() {
  emit('update:visible', false);
  emit('close');
}

/** 跳转VIP中心 */
function goToVip() {
  handleClose();
  router.push({
    path: '/vip',
    query: props.resourceId ? { source: props.resourceId } : undefined
  });
}

/** 继续浏览 */
function continueBrowsing() {
  handleClose();
}

// 暴露给模板使用
defineExpose({});
</script>

<template>
  <el-dialog
    :model-value="visible"
    title=""
    width="400px"
    :show-close="true"
    @update:model-value="handleClose"
  >
    <div class="promotion-content">
      <!-- VIP图标 -->
      <div class="vip-icon-wrapper">
        <VipIcon
          status="active"
          size="large"
        />
      </div>
      
      <!-- 标题 -->
      <h2 class="promotion-title">
        开通VIP，畅享下载
      </h2>
      
      <!-- 资源提示 -->
      <p
        v-if="resourceTitle"
        class="resource-tip"
      >
        「{{ resourceTitle }}」为VIP专属资源
      </p>
      
      <!-- 特权列表 -->
      <div class="privilege-list">
        <div class="privilege-item">
          <el-icon class="privilege-icon">
            <Download />
          </el-icon>
          <span>无限下载VIP资源</span>
        </div>
        <div class="privilege-item">
          <el-icon class="privilege-icon">
            <Promotion />
          </el-icon>
          <span>极速下载通道</span>
        </div>
        <div class="privilege-item">
          <el-icon class="privilege-icon">
            <Star />
          </el-icon>
          <span>专属VIP标识</span>
        </div>
        <div class="privilege-item">
          <el-icon class="privilege-icon">
            <Service />
          </el-icon>
          <span>优先客服支持</span>
        </div>
      </div>
      
      <!-- 价格提示 -->
      <div class="price-tip">
        <span class="price-label">低至</span>
        <span class="price-value">¥29</span>
        <span class="price-unit">/月</span>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button
          type="primary"
          size="large"
          class="vip-button"
          @click="goToVip"
        >
          立即开通VIP
        </el-button>
        <el-button
          text
          @click="continueBrowsing"
        >
          暂不需要，继续浏览
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.promotion-content {
  text-align: center;
  padding: 20px 0;
}

.vip-icon-wrapper {
  margin-bottom: 16px;
}

.promotion-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.resource-tip {
  font-size: 14px;
  color: #909399;
  margin: 0 0 24px 0;
}

.privilege-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  text-align: left;
}

.privilege-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 8px;
  font-size: 13px;
  color: #606266;
}

.privilege-icon {
  color: #FFD700;
  font-size: 18px;
}

.price-tip {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  padding: 16px;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  border-radius: 8px;
}

.price-label {
  font-size: 14px;
  color: #666;
}

.price-value {
  font-size: 32px;
  font-weight: 700;
  color: #F56C6C;
}

.price-unit {
  font-size: 14px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vip-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border: none;
  color: #333;
  font-weight: 600;
}

.vip-button:hover {
  background: linear-gradient(135deg, #FFE44D 0%, #FFB733 100%);
}
</style>
