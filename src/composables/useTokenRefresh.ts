/**
 * Token刷新组合式函数
 * 提供Token自动刷新和过期检查功能
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/pinia/userStore';
import { refreshToken as refreshTokenAPI } from '@/api/auth';
import {
  isTokenExpiringSoon,
  isTokenExpired,
  setToken,
  setTokenExpireTime,
  hasToken
} from '@/utils/security';

/**
 * Token刷新组合式函数
 */
export function useTokenRefresh() {
  const userStore = useUserStore();

  // ========== 状态 ==========

  /**
   * 是否正在刷新Token
   */
  const isRefreshing = ref(false);

  /**
   * 刷新失败次数
   */
  const refreshFailCount = ref(0);

  /**
   * 最大刷新失败次数
   */
  const MAX_REFRESH_FAIL_COUNT = 3;

  /**
   * 定时器ID
   */
  let checkTimer: number | null = null;

  // ========== 方法 ==========

  /**
   * 刷新Token
   * @returns Promise<boolean> 是否刷新成功
   */
  async function refreshToken(): Promise<boolean> {
    // 如果正在刷新，直接返回
    if (isRefreshing.value) {
      return false;
    }

    // 如果没有Token，不需要刷新
    if (!hasToken()) {
      return false;
    }

    // 如果刷新失败次数过多，停止刷新
    if (refreshFailCount.value >= MAX_REFRESH_FAIL_COUNT) {
      console.error('Token刷新失败次数过多，停止刷新');
      userStore.logout();
      return false;
    }

    isRefreshing.value = true;

    try {
      // 调用刷新Token API
      const response = await refreshTokenAPI();

      if (response.code === 200 && response.data) {
        const newToken = response.data.token;

        // 更新Token
        setToken(newToken, false);

        // 设置新的过期时间（默认24小时）
        const newExpireTime = Date.now() + 24 * 60 * 60 * 1000;
        setTokenExpireTime(newExpireTime);

        // 更新Store中的Token状态
        userStore.setToken(newToken, false, newExpireTime);

        // 重置失败次数
        refreshFailCount.value = 0;

        console.log('Token刷新成功');
        return true;
      } else {
        throw new Error('Token刷新失败');
      }
    } catch (error) {
      console.error('Token刷新失败:', error);
      refreshFailCount.value++;

      // 如果刷新失败次数达到上限，退出登录
      if (refreshFailCount.value >= MAX_REFRESH_FAIL_COUNT) {
        userStore.logout();
      }

      return false;
    } finally {
      isRefreshing.value = false;
    }
  }

  /**
   * 检查Token状态
   * 如果Token即将过期或已过期，自动刷新
   */
  async function checkTokenStatus(): Promise<void> {
    // 如果没有Token，不需要检查
    if (!hasToken()) {
      return;
    }

    // 如果Token已过期，退出登录
    if (isTokenExpired()) {
      console.warn('Token已过期，退出登录');
      userStore.logout();
      return;
    }

    // 如果Token即将过期，刷新Token
    if (isTokenExpiringSoon()) {
      console.log('Token即将过期，开始刷新...');
      await refreshToken();
    }
  }

  /**
   * 启动定时检查
   * 每分钟检查一次Token状态
   */
  function startTokenCheck(): void {
    // 清除之前的定时器
    stopTokenCheck();

    // 立即检查一次
    checkTokenStatus();

    // 每分钟检查一次
    checkTimer = window.setInterval(() => {
      checkTokenStatus();
    }, 60 * 1000); // 60秒
  }

  /**
   * 停止定时检查
   */
  function stopTokenCheck(): void {
    if (checkTimer !== null) {
      clearInterval(checkTimer);
      checkTimer = null;
    }
  }

  // ========== 生命周期 ==========

  onMounted(() => {
    // 组件挂载时启动定时检查
    startTokenCheck();
  });

  onUnmounted(() => {
    // 组件卸载时停止定时检查
    stopTokenCheck();
  });

  // ========== 返回公共接口 ==========
  return {
    // 状态
    isRefreshing,
    refreshFailCount,

    // 方法
    refreshToken,
    checkTokenStatus,
    startTokenCheck,
    stopTokenCheck
  };
}
