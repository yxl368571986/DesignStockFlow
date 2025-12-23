/**
 * useNetworkStatus 组合式函数测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useNetworkStatus', () => {
  beforeEach(() => {
    // 模拟 navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该初始化为在线状态', () => {
    const { isOnline } = useNetworkStatus(false);
    expect(isOnline.value).toBe(true);
  });

  it('应该初始化为离线状态（当navigator.onLine为false时）', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const { isOnline } = useNetworkStatus(false);
    expect(isOnline.value).toBe(false);
  });

  it('应该检测到离线事件', () => {
    const { isOnline, handleOffline } = useNetworkStatus(false);

    // 模拟离线事件
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    handleOffline();

    expect(isOnline.value).toBe(false);
  });

  it('应该检测到在线事件', () => {
    // 先设置为离线
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const { isOnline, handleOnline } = useNetworkStatus(false);

    // 模拟在线事件
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    handleOnline();

    expect(isOnline.value).toBe(true);
  });

  it('应该提供reconnect方法', () => {
    const { reconnect } = useNetworkStatus(false);
    expect(typeof reconnect).toBe('function');
  });

  it('应该提供updateNetworkType方法', () => {
    const { updateNetworkType } = useNetworkStatus(false);
    expect(typeof updateNetworkType).toBe('function');
  });

  it('应该暴露isReconnecting状态', () => {
    const { isReconnecting } = useNetworkStatus(false);
    expect(isReconnecting.value).toBe(false);
  });

  it('应该暴露networkType状态', () => {
    const { networkType } = useNetworkStatus(false);
    expect(networkType.value).toBeDefined();
  });

  it('应该暴露isSlowNetwork状态', () => {
    const { isSlowNetwork } = useNetworkStatus(false);
    expect(typeof isSlowNetwork.value).toBe('boolean');
  });

  it('reconnect应该返回Promise', async () => {
    const { reconnect } = useNetworkStatus(false);
    const result = reconnect();
    expect(result).toBeInstanceOf(Promise);
  });
});
