/**
 * 用户状态管理 Store
 * 管理用户信息、登录状态、Token等
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserInfo } from '@/types/models';
import { 
  getToken as getTokenFromCookie, 
  setToken as setTokenCookie, 
  removeToken as removeTokenCookie,
  getTokenExpireTime,
  setTokenExpireTime,
  removeTokenExpireTime,
  isTokenExpired
} from '@/utils/security';

// LocalStorage键名常量
const USER_INFO_KEY = 'user_info';

/**
 * 从localStorage加载用户信息
 */
function loadUserInfoFromStorage(): UserInfo | null {
  try {
    const stored = localStorage.getItem(USER_INFO_KEY);
    if (stored) {
      return JSON.parse(stored) as UserInfo;
    }
  } catch (error) {
    console.error('Failed to load user info from localStorage:', error);
  }
  return null;
}

/**
 * 保存用户信息到localStorage
 */
function saveUserInfoToStorage(userInfo: UserInfo | null): void {
  try {
    if (userInfo) {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    } else {
      localStorage.removeItem(USER_INFO_KEY);
    }
  } catch (error) {
    console.error('Failed to save user info to localStorage:', error);
  }
}

export const useUserStore = defineStore('user', () => {
  // ========== 状态 (State) ==========

  /**
   * 用户信息
   */
  const userInfo = ref<UserInfo | null>(loadUserInfoFromStorage());

  /**
   * Token（从Cookie中读取，由security.ts管理）
   * 注意：Token实际存储在HttpOnly Cookie中，这里只是标记状态
   */
  const token = ref<string>('');

  // ========== 计算属性 (Getters) ==========

  /**
   * 是否已登录
   */
  const isLoggedIn = computed(() => {
    return userInfo.value !== null && token.value !== '';
  });

  /**
   * 是否为VIP用户
   */
  const isVIP = computed(() => {
    if (!userInfo.value) {
      return false;
    }

    // vipLevel > 0 表示是VIP
    if (userInfo.value.vipLevel <= 0) {
      return false;
    }

    // 检查VIP是否过期
    if (userInfo.value.vipExpireTime) {
      const expireTime = new Date(userInfo.value.vipExpireTime).getTime();
      const now = Date.now();
      return now < expireTime;
    }

    return true;
  });

  /**
   * VIP等级名称
   */
  const vipLevelName = computed(() => {
    if (!userInfo.value) {
      return '普通用户';
    }

    switch (userInfo.value.vipLevel) {
      case 1:
        return '月度VIP';
      case 2:
        return '季度VIP';
      case 3:
        return '年度VIP';
      default:
        return '普通用户';
    }
  });

  /**
   * 用户昵称（如果未设置则显示手机号）
   */
  const displayName = computed(() => {
    if (!userInfo.value) {
      return '';
    }
    return userInfo.value.nickname || userInfo.value.phone;
  });

  /**
   * 用户积分余额
   */
  const pointsBalance = computed(() => {
    if (!userInfo.value) {
      return 0;
    }
    return userInfo.value.pointsBalance || 0;
  });

  /**
   * 用户累计积分
   */
  const pointsTotal = computed(() => {
    if (!userInfo.value) {
      return 0;
    }
    return userInfo.value.pointsTotal || 0;
  });

  // ========== 操作 (Actions) ==========

  /**
   * 设置用户信息
   * @param info 用户信息对象
   */
  function setUserInfo(info: UserInfo): void {
    userInfo.value = info;
    saveUserInfoToStorage(info);
  }

  /**
   * 设置Token（改进版）
   * 确保Token和过期时间同时设置，保持状态一致性
   * @param newToken Token字符串
   * @param rememberMe 是否记住我（影响Cookie过期时间）
   * @param expireTime Token过期时间戳（可选）
   *
   * 注意：实际的Token存储由security.ts的setToken函数处理（存储在Cookie中）
   * 这里只是更新Store中的状态标记
   * 
   * 缓存策略：
   * - 默认缓存24小时，超过24小时需要重新登录
   * - 如果选择"记住我"，缓存7天
   */
  function setToken(newToken: string, rememberMe: boolean = false, expireTime?: number): void {
    // 更新Store中的Token状态
    token.value = newToken;

    // 计算过期时间：默认24小时，记住我则7天
    const defaultExpireTime = Date.now() + 24 * 60 * 60 * 1000; // 24小时
    const rememberMeExpireTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7天
    const calculatedExpireTime = expireTime || (rememberMe ? rememberMeExpireTime : defaultExpireTime);

    // 同步设置Token和过期时间到Cookie
    setTokenCookie(newToken, rememberMe);
    setTokenExpireTime(calculatedExpireTime);
    console.log('Token和过期时间已同步设置，过期时间:', new Date(calculatedExpireTime).toLocaleString());
  }

  /**
   * 更新用户信息（部分更新）
   * @param updates 要更新的字段
   */
  function updateUserInfo(updates: Partial<UserInfo>): void {
    if (userInfo.value) {
      userInfo.value = {
        ...userInfo.value,
        ...updates
      };
      saveUserInfoToStorage(userInfo.value);
    }
  }

  /**
   * 退出登录
   * 清除用户信息、Token和Cookie
   */
  function logout(): void {
    // 清除状态
    userInfo.value = null;
    token.value = '';

    // 清除localStorage
    saveUserInfoToStorage(null);

    // 同步清除Cookie中的Token和过期时间（不使用异步import）
    removeTokenCookie();
    removeTokenExpireTime();

    // 清除其他可能的缓存数据
    try {
      // 清除搜索历史等其他本地数据（如果有）
      localStorage.removeItem('search_history');
      localStorage.removeItem('recent_views');
    } catch (error) {
      console.error('Failed to clear additional storage:', error);
    }
  }

  /**
   * 初始化Token状态（改进版）
   * 从Cookie中读取Token并验证状态一致性
   * 如果Token存在但过期时间缺失，自动设置默认过期时间
   */
  function initToken(): void {
    try {
      // 使用security模块的函数获取Token和过期时间（同步方式）
      const tokenValue = getTokenFromCookie();
      const expireTimeValue = getTokenExpireTime();
      
      console.log('[UserStore] initToken - tokenValue:', tokenValue ? tokenValue.substring(0, 20) + '...' : 'undefined');
      console.log('[UserStore] initToken - expireTimeValue:', expireTimeValue);
      
      if (tokenValue) {
        // 有token，更新store状态
        token.value = tokenValue;
        
        // 检查是否有过期时间
        if (!expireTimeValue) {
          console.warn('[UserStore] Token存在但过期时间缺失，设置默认过期时间');
          // 设置默认过期时间（24小时）
          const defaultExpireTime = Date.now() + 24 * 60 * 60 * 1000;
          setTokenExpireTime(defaultExpireTime);
        } else {
          // 检查是否已过期
          if (isTokenExpired()) {
            console.warn('[UserStore] Token已过期，清除状态');
            logout();
            return;
          }
        }
        
        console.log('[UserStore] Token初始化成功, isLoggedIn将为:', userInfo.value !== null && token.value !== '');
      } else {
        // 没有token，检查是否有用户信息
        if (userInfo.value) {
          console.warn('[UserStore] 没有Token但有用户信息，清除用户信息');
          logout();
        }
      }
    } catch (error) {
      console.error('[UserStore] 初始化Token失败:', error);
      // 出错时清除所有状态
      logout();
    }
  }

  /**
   * 检查VIP状态
   * 如果VIP已过期，更新用户信息
   */
  function checkVIPStatus(): void {
    if (userInfo.value && userInfo.value.vipLevel > 0 && userInfo.value.vipExpireTime) {
      const expireTime = new Date(userInfo.value.vipExpireTime).getTime();
      const now = Date.now();

      if (now >= expireTime) {
        // VIP已过期，降级为普通用户
        updateUserInfo({
          vipLevel: 0,
          vipExpireTime: undefined
        });
      }
    }
  }

  // 初始化时检查Token
  initToken();

  // ========== 返回公共接口 ==========
  return {
    // 状态
    userInfo,
    token,

    // 计算属性
    isLoggedIn,
    isVIP,
    vipLevelName,
    displayName,
    pointsBalance,
    pointsTotal,

    // 操作
    setUserInfo,
    setToken,
    updateUserInfo,
    logout,
    initToken,
    checkVIPStatus
  };
});
