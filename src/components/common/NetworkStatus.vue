<!--
  网络状态提示组件
  
  功能：
  - 显示离线状态提示条
  - 显示重新连接按钮
  - 使用useNetworkStatus监听网络状态
  - 支持自动隐藏（恢复在线后3秒）
  
  需求: 需求14.1（网络状态提示）
-->

<template>
  <Transition name="slide-down">
    <div
      v-if="showBanner"
      class="network-status-banner"
      :class="bannerClass"
    >
      <div class="banner-content">
        <!-- 图标 -->
        <div class="banner-icon">
          <svg
            v-if="!isOnline"
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
            />
          </svg>
          <svg
            v-else
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>

        <!-- 消息文本 -->
        <div class="banner-message">
          <span v-if="!isOnline">网络连接已断开，请检查网络设置</span>
          <span v-else-if="isSlowNetwork">当前网络较慢，建议切换到更快的网络</span>
          <span v-else>网络已恢复</span>
        </div>

        <!-- 操作按钮 -->
        <div class="banner-actions">
          <button
            v-if="!isOnline"
            class="reconnect-btn"
            :disabled="isReconnecting"
            @click="handleReconnect"
          >
            <span
              v-if="isReconnecting"
              class="loading-spinner"
            />
            <span>{{ isReconnecting ? '重新连接中...' : '重新连接' }}</span>
          </button>

          <button
            class="close-btn"
            aria-label="关闭"
            @click="handleClose"
          >
            <svg
              class="icon-small"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line
                x1="18"
                y1="6"
                x2="6"
                y2="18"
              />
              <line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useNetworkStatus } from '@/composables/useNetworkStatus';

/**
 * 网络状态提示组件
 */

// 使用网络状态监控
const { isOnline, isSlowNetwork, isReconnecting, reconnect } = useNetworkStatus();

// 是否显示横幅
const showBanner = ref(false);

// 自动隐藏定时器
let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

// 横幅样式类
const bannerClass = computed(() => {
  if (!isOnline.value) {
    return 'banner-offline';
  } else if (isSlowNetwork.value) {
    return 'banner-warning';
  } else {
    return 'banner-success';
  }
});

/**
 * 处理重新连接
 */
async function handleReconnect() {
  await reconnect();
}

/**
 * 处理关闭横幅
 */
function handleClose() {
  showBanner.value = false;
  clearAutoHideTimer();
}

/**
 * 清除自动隐藏定时器
 */
function clearAutoHideTimer() {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }
}

/**
 * 设置自动隐藏
 */
function setAutoHide() {
  clearAutoHideTimer();
  autoHideTimer = setTimeout(() => {
    showBanner.value = false;
  }, 3000);
}

// 监听在线状态变化
watch(isOnline, (online, wasOnline) => {
  if (!online) {
    // 离线时显示横幅
    showBanner.value = true;
    clearAutoHideTimer();
  } else if (wasOnline === false) {
    // 从离线恢复到在线时显示横幅，并在3秒后自动隐藏
    showBanner.value = true;
    setAutoHide();
  }
});

// 监听慢速网络状态
watch(isSlowNetwork, (slow) => {
  if (slow && isOnline.value) {
    // 慢速网络时显示横幅
    showBanner.value = true;
    setAutoHide();
  }
});

// 组件挂载时检查初始状态
onMounted(() => {
  // 如果初始状态是离线，显示横幅
  if (!isOnline.value) {
    showBanner.value = true;
  }
});
</script>

<style scoped>
.network-status-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.banner-offline {
  background-color: #ff7d00;
  color: white;
}

.banner-warning {
  background-color: #ff7d00;
  color: white;
}

.banner-success {
  background-color: #52c41a;
  color: white;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
  gap: 12px;
}

.banner-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.icon {
  width: 20px;
  height: 20px;
}

.icon-small {
  width: 16px;
  height: 16px;
}

.banner-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.reconnect-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.reconnect-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.3);
}

.reconnect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background-color: transparent;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 过渡动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .network-status-banner {
    padding: 10px 12px;
  }

  .banner-content {
    gap: 8px;
  }

  .banner-message {
    font-size: 13px;
  }

  .reconnect-btn {
    padding: 5px 12px;
    font-size: 13px;
  }

  .icon {
    width: 18px;
    height: 18px;
  }
}
</style>
