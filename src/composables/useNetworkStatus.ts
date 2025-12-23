/**
 * 网络状态监控组合式函数
 *
 * 功能：
 * - 监听online/offline事件
 * - 管理isOnline状态
 * - 检测网络类型（4G/WiFi/慢速）
 * - 提供重新连接方法
 * - 离线时显示提示，恢复时自动重试请求
 *
 * 需求: 需求14（离线状态与网络异常处理）
 */

import { ref, readonly, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

/**
 * 网络类型枚举
 */
export type NetworkType = 'wifi' | '4g' | '3g' | '2g' | 'slow' | 'unknown';

/**
 * 网络连接信息接口
 */
interface NetworkConnection extends EventTarget {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

/**
 * 扩展Navigator接口以支持connection属性
 */
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
  mozConnection?: NetworkConnection;
  webkitConnection?: NetworkConnection;
}

/**
 * 网络状态监控组合式函数
 *
 * @param autoInit - 是否自动初始化监听器（默认true，测试时可设为false）
 */
export function useNetworkStatus(autoInit = true) {
  // 在线状态
  const isOnline = ref<boolean>(navigator.onLine);

  // 网络类型
  const networkType = ref<NetworkType>('unknown');

  // 是否为慢速网络
  const isSlowNetwork = ref<boolean>(false);

  // 重连中状态
  const isReconnecting = ref<boolean>(false);

  /**
   * 获取网络连接对象
   */
  function getConnection(): NetworkConnection | undefined {
    const nav = navigator as NavigatorWithConnection;
    return nav.connection || nav.mozConnection || nav.webkitConnection;
  }

  /**
   * 检测网络类型
   */
  function detectNetworkType(): NetworkType {
    const connection = getConnection();

    if (!connection) {
      return 'unknown';
    }

    // 根据effectiveType判断网络类型
    const effectiveType = connection.effectiveType;

    if (effectiveType === '4g') {
      return '4g';
    } else if (effectiveType === '3g') {
      return '3g';
    } else if (effectiveType === '2g') {
      return '2g';
    } else if (effectiveType === 'slow-2g') {
      return 'slow';
    }

    // 根据downlink速度判断（如果有）
    if (connection.downlink !== undefined) {
      if (connection.downlink >= 10) {
        return 'wifi';
      } else if (connection.downlink >= 1.5) {
        return '4g';
      } else if (connection.downlink >= 0.4) {
        return '3g';
      } else {
        return '2g';
      }
    }

    return 'unknown';
  }

  /**
   * 更新网络类型
   */
  function updateNetworkType() {
    const type = detectNetworkType();
    networkType.value = type;

    // 判断是否为慢速网络
    isSlowNetwork.value = type === 'slow' || type === '2g';

    // 如果是慢速网络，显示提示
    if (isSlowNetwork.value && isOnline.value) {
      ElMessage.warning({
        message: '当前网络较慢，建议切换到更快的网络',
        duration: 3000,
        showClose: true
      });
    }
  }

  /**
   * 处理在线事件
   */
  function handleOnline() {
    isOnline.value = true;
    isReconnecting.value = false;

    // 显示网络恢复提示
    ElMessage.success({
      message: '网络已恢复',
      duration: 3000,
      showClose: true
    });

    // 更新网络类型
    updateNetworkType();

    // 触发自定义事件，通知其他模块网络已恢复
    window.dispatchEvent(new CustomEvent('network-restored'));
  }

  /**
   * 处理离线事件
   */
  function handleOffline() {
    isOnline.value = false;
    networkType.value = 'unknown';
    isSlowNetwork.value = false;

    // 显示离线提示
    ElMessage.error({
      message: '网络连接已断开，请检查网络设置',
      duration: 0, // 不自动关闭
      showClose: true
    });

    // 触发自定义事件，通知其他模块网络已断开
    window.dispatchEvent(new CustomEvent('network-disconnected'));
  }

  /**
   * 处理网络变化事件
   */
  function handleConnectionChange() {
    updateNetworkType();
  }

  /**
   * 重新连接
   * 尝试重新检测网络状态
   */
  async function reconnect(): Promise<boolean> {
    if (isReconnecting.value) {
      return false;
    }

    isReconnecting.value = true;

    try {
      // 尝试发送一个轻量级请求来检测网络
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // 网络已恢复
        if (!isOnline.value) {
          handleOnline();
        }
        return true;
      } else {
        // 请求失败
        ElMessage.error({
          message: '重新连接失败，请检查网络设置',
          duration: 3000,
          showClose: true
        });
        return false;
      }
    } catch (error) {
      // 网络仍然不可用
      ElMessage.error({
        message: '网络连接不可用',
        duration: 3000,
        showClose: true
      });
      return false;
    } finally {
      isReconnecting.value = false;
    }
  }

  /**
   * 初始化网络监听
   */
  function initNetworkListeners() {
    // 监听在线/离线事件
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听网络变化事件
    const connection = getConnection();
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // 初始化时检测网络类型
    if (isOnline.value) {
      updateNetworkType();
    }
  }

  /**
   * 清理网络监听
   */
  function cleanupNetworkListeners() {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);

    const connection = getConnection();
    if (connection) {
      connection.removeEventListener('change', handleConnectionChange);
    }
  }

  // 如果autoInit为true，则自动初始化和清理
  if (autoInit) {
    // 组件挂载时初始化
    onMounted(() => {
      initNetworkListeners();
    });

    // 组件卸载时清理
    onUnmounted(() => {
      cleanupNetworkListeners();
    });
  }

  return {
    // 状态（只读）
    isOnline: readonly(isOnline),
    networkType: readonly(networkType),
    isSlowNetwork: readonly(isSlowNetwork),
    isReconnecting: readonly(isReconnecting),

    // 方法
    reconnect,
    updateNetworkType,
    initNetworkListeners,
    cleanupNetworkListeners,

    // 内部方法（用于测试）
    handleOnline,
    handleOffline
  };
}
