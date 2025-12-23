<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';

/**
 * PWA更新提示组件
 *
 * 功能：
 * 1. 检测Service Worker更新
 * 2. 显示更新提示对话框
 * 3. 立即更新（刷新页面）
 * 4. 稍后更新（关闭对话框）
 *
 * 需求: 需求13.3（PWA更新提示）
 */

// 使用vite-plugin-pwa提供的注册钩子
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(registration) {
    console.log('Service Worker registered:', registration);

    // 定期检查更新（每小时检查一次）
    if (registration) {
      setInterval(
        () => {
          registration.update();
        },
        60 * 60 * 1000
      );
    }
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  }
});

// 响应式状态
const updating = ref(false);

/**
 * 立即更新
 * 通知Service Worker跳过等待并激活新版本，然后刷新页面
 */
async function handleUpdate() {
  updating.value = true;

  try {
    await updateServiceWorker(true);
  } catch (error) {
    console.error('Update failed:', error);
    // 如果更新失败，直接刷新页面
    window.location.reload();
  }
}

/**
 * 稍后更新
 * 关闭对话框，用户可以继续使用当前版本
 */
function handleLater() {
  needRefresh.value = false;
}

// 生命周期钩子
onMounted(() => {
  console.log('PWA Update Prompt mounted');
});
</script>

<template>
  <el-dialog
    v-model="needRefresh"
    title="发现新版本"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
  >
    <div class="update-content">
      <el-icon
        :size="48"
        color="#165DFF"
        class="update-icon"
      >
        <Refresh />
      </el-icon>
      <p class="update-message">
        检测到新版本可用，更新后可获得更好的体验和新功能。
      </p>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleLater">
          稍后更新
        </el-button>
        <el-button
          type="primary"
          :loading="updating"
          @click="handleUpdate"
        >
          立即更新
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.update-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.update-icon {
  margin-bottom: 16px;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.update-message {
  text-align: center;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
