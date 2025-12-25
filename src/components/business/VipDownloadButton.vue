<script setup lang="ts">
/**
 * VIP下载按钮组件
 * 根据用户VIP状态显示不同的下载按钮样式和提示
 */

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import { useVipStore } from '@/pinia/vipStore';
import { useUserStore } from '@/pinia/userStore';
import { checkDownloadPermission } from '@/api/vip';

interface Props {
  /** 资源ID */
  resourceId: string;
  /** 资源是否免费 */
  isFree?: boolean;
  /** 按钮尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 是否显示下载次数 */
  showCount?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isFree: false,
  size: 'default',
  showCount: true
});

const emit = defineEmits<{
  download: [resourceId: string];
}>();

const router = useRouter();
const vipStore = useVipStore();
const userStore = useUserStore();

/** 加载状态 */
const loading = ref(false);

/** 下载权限信息 */
const permission = ref<{
  canDownload: boolean;
  reason?: string;
  remainingDownloads: number;
  dailyLimit: number;
} | null>(null);

/** 是否已登录 */
const isLoggedIn = computed(() => userStore.isLoggedIn);

/** 是否是VIP */
const isVip = computed(() => vipStore.isValidVip);

/** 按钮文本 */
const buttonText = computed(() => {
  if (!isLoggedIn.value) return '登录后下载';
  if (props.isFree) return '免费下载';
  if (isVip.value) return 'VIP免费下载';
  return '开通VIP下载';
});

/** 按钮类型 */
const buttonType = computed(() => {
  if (!isLoggedIn.value) return 'info';
  if (props.isFree || isVip.value) return 'primary';
  return 'warning';
});

/** 剩余下载次数文本 */
const remainingText = computed(() => {
  if (!permission.value) return '';
  if (isVip.value) {
    return `今日剩余 ${permission.value.remainingDownloads}/${permission.value.dailyLimit} 次`;
  }
  return `免费下载剩余 ${permission.value.remainingDownloads}/${permission.value.dailyLimit} 次`;
});

/** 检查下载权限 */
async function checkPermission() {
  if (!isLoggedIn.value) return;
  
  try {
    const res = await checkDownloadPermission(props.resourceId);
    if (res.code === 200 && res.data) {
      permission.value = res.data;
    }
  } catch (error) {
    console.error('检查下载权限失败:', error);
  }
}

/** 处理点击 */
async function handleClick() {
  // 未登录跳转登录
  if (!isLoggedIn.value) {
    router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath }
    });
    return;
  }
  
  // 免费资源或VIP用户直接下载
  if (props.isFree || isVip.value) {
    loading.value = true;
    try {
      // 检查权限
      const res = await checkDownloadPermission(props.resourceId);
      if (res.code === 200 && res.data) {
        if (res.data.canDownload) {
          emit('download', props.resourceId);
        } else {
          ElMessage.warning(res.data.reason || '无法下载');
        }
        permission.value = res.data;
      }
    } catch (error) {
      ElMessage.error('下载失败，请稍后重试');
    } finally {
      loading.value = false;
    }
    return;
  }
  
  // 非VIP跳转VIP中心
  router.push({
    path: '/vip',
    query: { source: props.resourceId }
  });
}

// 组件挂载时检查权限
import { onMounted } from 'vue';
onMounted(() => {
  checkPermission();
});
</script>

<template>
  <div class="vip-download-button">
    <el-button
      :type="buttonType"
      :size="size"
      :loading="loading"
      @click="handleClick"
    >
      <el-icon v-if="!loading" class="mr-1"><Download /></el-icon>
      {{ buttonText }}
    </el-button>
    
    <!-- 下载次数提示 -->
    <div v-if="showCount && isLoggedIn && remainingText" class="download-count">
      {{ remainingText }}
    </div>
    
    <!-- 非VIP提示 -->
    <div v-if="isLoggedIn && !isVip && !isFree" class="vip-tip">
      <span class="tip-text">开通VIP，无限下载所有资源</span>
    </div>
  </div>
</template>

<style scoped>
.vip-download-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.download-count {
  font-size: 12px;
  color: #909399;
}

.vip-tip {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tip-text {
  font-size: 12px;
  color: #E6A23C;
}

.mr-1 {
  margin-right: 4px;
}
</style>
