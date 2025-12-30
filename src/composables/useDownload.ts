/**
 * 下载组合式函数
 * 提供资源下载、权限检查、对话框提示等功能
 */

import { ref, readonly } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useUserStore } from '@/pinia/userStore';
import { downloadResource } from '@/api/resource';
import { getMyPointsInfo } from '@/api/points';
import { usePointsSync } from './usePointsSync';
import { getToken } from '@/utils/security';

/**
 * 下载组合式函数
 */
export function useDownload() {
  const router = useRouter();
  const userStore = useUserStore();
  const { refreshAfterDownload } = usePointsSync();

  // ========== 状态 ==========

  /**
   * 下载中状态
   */
  const downloading = ref(false);

  /**
   * 错误信息
   */
  const error = ref<string | null>(null);

  // ========== 方法 ==========

  /**
   * 检查下载权限
   * @param vipLevel 资源所需的VIP等级（0-普通用户可下载，1-需要VIP）
   * @param pointsCost 下载所需积分
   * @returns { hasPermission: boolean, reason?: string }
   */
  async function checkDownloadPermission(
    vipLevel: number = 0,
    pointsCost: number = 0
  ): Promise<{
    hasPermission: boolean;
    reason?: 'not_logged_in' | 'not_vip' | 'insufficient_points';
    pointsBalance?: number;
  }> {
    // 检查是否登录
    if (!userStore.isLoggedIn) {
      return {
        hasPermission: false,
        reason: 'not_logged_in'
      };
    }

    // 检查VIP权限
    if (vipLevel > 0 && !userStore.isVIP) {
      return {
        hasPermission: false,
        reason: 'not_vip'
      };
    }

    // VIP用户无需检查积分
    if (userStore.isVIP) {
      return {
        hasPermission: true
      };
    }

    // 免费资源无需检查积分
    if (pointsCost === 0) {
      return {
        hasPermission: true
      };
    }

    // 检查积分余额
    try {
      const res = await getMyPointsInfo();
      if (res.code === 200 && res.data) {
        const pointsBalance = res.data.pointsBalance;
        if (pointsBalance < pointsCost) {
          return {
            hasPermission: false,
            reason: 'insufficient_points',
            pointsBalance
          };
        }
        return {
          hasPermission: true,
          pointsBalance
        };
      }
    } catch (e) {
      console.error('获取积分信息失败:', e);
    }

    // 权限检查通过
    return {
      hasPermission: true
    };
  }

  /**
   * 显示未登录确认对话框
   * @returns Promise<boolean> 用户是否确认前往登录
   */
  async function showLoginDialog(): Promise<boolean> {
    try {
      await ElMessageBox.confirm('您需要登录后才能下载资源，是否前往登录？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      });
      return true;
    } catch {
      // 用户点击取消
      return false;
    }
  }

  /**
   * 显示VIP升级提示对话框
   * @returns Promise<boolean> 用户是否确认前往VIP页面
   */
  async function showVIPDialog(): Promise<boolean> {
    try {
      await ElMessageBox.confirm('该资源为VIP专属资源，开通VIP享受无限下载特权', 'VIP专属', {
        confirmButtonText: '开通VIP',
        cancelButtonText: '取消',
        type: 'warning',
        center: true,
        dangerouslyUseHTMLString: true,
        message: `
            <div style="text-align: center;">
              <p style="margin-bottom: 16px;">该资源为VIP专属资源</p>
              <p style="color: #FF7D00; font-weight: bold; margin-bottom: 8px;">开通VIP享受无限下载特权</p>
              <p style="font-size: 12px; color: #909399;">更多精品资源等你来探索</p>
            </div>
          `
      });
      return true;
    } catch {
      // 用户点击取消
      return false;
    }
  }

  /**
   * 显示积分不足提示对话框
   * @param pointsCost 所需积分
   * @param pointsBalance 当���积分余额
   * @returns Promise<boolean> 用户是否确认前往积分页面
   */
  async function showInsufficientPointsDialog(
    pointsCost: number,
    pointsBalance: number
  ): Promise<boolean> {
    const deficit = pointsCost - pointsBalance;
    try {
      await ElMessageBox.confirm(
        `下载此资源需要消耗 ${pointsCost} 积分，您当前积分余额为 ${pointsBalance}，还需 ${deficit} 积分。是否前往获取积分？`,
        '积分不足',
        {
          confirmButtonText: '获取积分',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        }
      );
      return true;
    } catch {
      // 用户点击取消
      return false;
    }
  }

  /**
   * 显示积分消耗确认对话框
   * @param pointsCost 所需积分
   * @param pointsBalance 当前积分余额
   * @returns Promise<boolean> 用户是否确认下载
   */
  async function showPointsConfirmDialog(
    pointsCost: number,
    pointsBalance: number
  ): Promise<boolean> {
    try {
      await ElMessageBox.confirm(
        `下载此资源需要消耗 ${pointsCost} 积分，当前余额 ${pointsBalance} 积分，是否继续？`,
        '确认下载',
        {
          confirmButtonText: '确认下载',
          cancelButtonText: '取消',
          type: 'info',
          center: true
        }
      );
      return true;
    } catch {
      // 用户点击取消
      return false;
    }
  }

  /**
   * 处理资源下载
   * @param resourceId 资源ID
   * @param vipLevel 资源所需的VIP等级（0-普通用户可下载，1-需要VIP）
   * @param pointsCost 下载所需积分
   * @returns Promise<{ success: boolean, error?: string, pointsBalance?: number }>
   */
  async function handleDownload(
    resourceId: string,
    vipLevel: number = 0,
    pointsCost: number = 0
  ): Promise<{ success: boolean; error?: string; pointsBalance?: number }> {
    // 检查网络状态
    if (!navigator.onLine) {
      error.value = '下载功能需要网络连接';
      ElMessage.warning(error.value);
      return { success: false, error: error.value };
    }

    // 重置错误状态
    error.value = null;

    // 检查下载权限
    const permission = await checkDownloadPermission(vipLevel, pointsCost);

    // 未登录处理
    if (!permission.hasPermission && permission.reason === 'not_logged_in') {
      const confirmed = await showLoginDialog();
      if (confirmed) {
        // 用户确认前往登录，保存当前页面路径用于登录后返回
        const currentPath = router.currentRoute.value.fullPath;
        await router.push({
          path: '/login',
          query: { redirect: currentPath }
        });
      }
      return { success: false, error: '需要登录' };
    }

    // 非VIP用户下载VIP资源
    if (!permission.hasPermission && permission.reason === 'not_vip') {
      const confirmed = await showVIPDialog();
      if (confirmed) {
        // 用户确认前往VIP页面
        await router.push('/vip');
      }
      return { success: false, error: '需要VIP权限' };
    }

    // 积分不足处理
    if (!permission.hasPermission && permission.reason === 'insufficient_points') {
      const confirmed = await showInsufficientPointsDialog(
        pointsCost,
        permission.pointsBalance || 0
      );
      if (confirmed) {
        // 用户确认前往积分页面
        await router.push('/points');
      }
      return {
        success: false,
        error: '积分不足',
        pointsBalance: permission.pointsBalance
      };
    }

    // 普通用户下载需要积分的资源，显示确认对话框
    if (!userStore.isVIP && pointsCost > 0) {
      const confirmed = await showPointsConfirmDialog(pointsCost, permission.pointsBalance || 0);
      if (!confirmed) {
        return { success: false, error: '用户取消下载' };
      }
    }

    // 权限检查通过，开始下载
    downloading.value = true;

    try {
      // 调用下载API
      const response = await downloadResource(resourceId);

      // 检查响应
      if (response.code === 200 && response.data?.downloadUrl) {
        // 使用新的文件流下载端点，强制浏览器下载
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
        // 移除末尾的斜杠
        const baseUrl = apiBaseUrl.replace(/\/$/, '');
        const fileDownloadUrl = `${baseUrl}/resources/${resourceId}/download/file`;

        // 从Cookie获取token用于认证
        const token = getToken();
        
        // 使用fetch下载文件，带上认证头
        const downloadResponse = await fetch(fileDownloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (!downloadResponse.ok) {
          const errorData = await downloadResponse.json().catch(() => ({}));
          error.value = errorData.message || '下载失败';
          ElMessage.error(error.value);
          return { success: false, error: error.value };
        }

        // 从响应头获取文件名
        const contentDisposition = downloadResponse.headers.get('Content-Disposition');
        let fileName = response.data.fileName || 'download';
        if (contentDisposition) {
          // 解析 filename*=UTF-8''xxx 格式
          const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/i);
          if (filenameMatch) {
            fileName = decodeURIComponent(filenameMatch[1]);
          } else {
            // 尝试解析普通 filename="xxx" 格式
            const simpleMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i);
            if (simpleMatch) {
              fileName = simpleMatch[1];
            }
          }
        }

        // 获取文件blob
        const blob = await downloadResponse.blob();
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 释放URL对象
        window.URL.revokeObjectURL(url);

        // 显示成功提示
        ElMessage.success('下载成功');

        // 如果消耗了积分，更新用户积分信息
        if (!userStore.isVIP && pointsCost > 0) {
          // 使用积分同步功能刷新积分余额
          await refreshAfterDownload(pointsCost);
        }

        return {
          success: true,
          pointsBalance: userStore.pointsBalance
        };
      } else {
        error.value = response.msg || '下载失败';
        ElMessage.error(error.value);
        return { success: false, error: error.value };
      }
    } catch (e) {
      error.value = (e as Error).message || '下载失败，请稍后重试';
      ElMessage.error(error.value);
      return { success: false, error: error.value };
    } finally {
      downloading.value = false;
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
    downloading: readonly(downloading),
    error: readonly(error),

    // 方法
    handleDownload,
    checkDownloadPermission,
    showLoginDialog,
    showVIPDialog,
    showInsufficientPointsDialog,
    showPointsConfirmDialog,
    resetError
  };
}
