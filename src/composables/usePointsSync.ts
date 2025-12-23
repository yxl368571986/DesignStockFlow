/**
 * 积分同步组合式函数
 * 提供积分余额实时更新功能
 * 
 * 功能：
 * - 从后端获取最新积分信息并更新到用户状态
 * - 在下载、充值、上传奖励等操作后自动刷新积分
 * - 提供手动刷新积分的方法
 * 
 * 需求: 4.19, 8.19 - 积分发生变动时实时更新所有显示积分的位置
 */

import { ref, readonly } from 'vue';
import { useUserStore } from '@/pinia/userStore';
import { getMyPointsInfo } from '@/api/points';

/**
 * 积分同步组合式函数
 */
export function usePointsSync() {
  const userStore = useUserStore();

  // ========== 状态 ==========

  /**
   * 是否正在刷新积分
   */
  const refreshing = ref(false);

  /**
   * 上次刷新时间
   */
  const lastRefreshTime = ref<number | null>(null);

  /**
   * 刷新错误信息
   */
  const error = ref<string | null>(null);

  // ========== 方法 ==========

  /**
   * 刷新积分余额
   * 从后端获取最新积分信息并更新到用户状态
   * 
   * @param force 是否强制刷新（忽略防抖）
   * @returns Promise<{ success: boolean, pointsBalance?: number, error?: string }>
   */
  async function refreshPoints(force: boolean = false): Promise<{
    success: boolean;
    pointsBalance?: number;
    pointsTotal?: number;
    error?: string;
  }> {
    // 检查是否已登录
    if (!userStore.isLoggedIn) {
      return {
        success: false,
        error: '用户未登录'
      };
    }

    // 防抖：如果不是强制刷新，且距离上次刷新不到2秒，则跳过
    if (!force && lastRefreshTime.value) {
      const timeSinceLastRefresh = Date.now() - lastRefreshTime.value;
      if (timeSinceLastRefresh < 2000) {
        return {
          success: true,
          pointsBalance: userStore.pointsBalance,
          pointsTotal: userStore.pointsTotal
        };
      }
    }

    // 如果正在刷新中，等待完成
    if (refreshing.value) {
      return {
        success: true,
        pointsBalance: userStore.pointsBalance,
        pointsTotal: userStore.pointsTotal
      };
    }

    refreshing.value = true;
    error.value = null;

    try {
      const res = await getMyPointsInfo();

      if (res.code === 200 && res.data) {
        const { pointsBalance, pointsTotal } = res.data;

        // 更新用户状态中的积分信息
        userStore.updateUserInfo({
          pointsBalance,
          pointsTotal
        });

        // 更新刷新时间
        lastRefreshTime.value = Date.now();

        console.log('[PointsSync] 积分已更新:', { pointsBalance, pointsTotal });

        return {
          success: true,
          pointsBalance,
          pointsTotal
        };
      } else {
        const errorMsg = res.msg || '获取积分信息失败';
        error.value = errorMsg;
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (e) {
      const errorMsg = (e as Error).message || '获取积分信息失败';
      error.value = errorMsg;
      console.error('[PointsSync] 刷新积分失败:', e);
      return {
        success: false,
        error: errorMsg
      };
    } finally {
      refreshing.value = false;
    }
  }

  /**
   * 下载后刷新积分
   * 在资源下载成功后调用，确保积分余额实时更新
   * 
   * @param pointsCost 本次下载消耗的积分
   */
  async function refreshAfterDownload(pointsCost: number): Promise<void> {
    if (pointsCost > 0) {
      console.log('[PointsSync] 下载消耗积分，刷新积分余额...');
      await refreshPoints(true);
    }
  }

  /**
   * 充值后刷新积分
   * 在积分充值成功后调用，确保积分余额实时更新
   * 
   * @param pointsAdded 本次充值增加的积分
   */
  async function refreshAfterRecharge(pointsAdded: number): Promise<void> {
    if (pointsAdded > 0) {
      console.log('[PointsSync] 充值成功，刷新积分余额...');
      await refreshPoints(true);
    }
  }

  /**
   * 上传奖励后刷新积分
   * 在资源上传审核通过获得奖励后调用，确保积分余额实时更新
   * 
   * @param pointsRewarded 本次获得的奖励积分
   */
  async function refreshAfterUploadReward(pointsRewarded: number): Promise<void> {
    if (pointsRewarded > 0) {
      console.log('[PointsSync] 上传奖励，刷新积分余额...');
      await refreshPoints(true);
    }
  }

  /**
   * 重置错误状态
   */
  function resetError(): void {
    error.value = null;
  }

  // ========== 返回公共接口 ==========
  return {
    // 状态（只读）
    refreshing: readonly(refreshing),
    lastRefreshTime: readonly(lastRefreshTime),
    error: readonly(error),

    // 方法
    refreshPoints,
    refreshAfterDownload,
    refreshAfterRecharge,
    refreshAfterUploadReward,
    resetError
  };
}
