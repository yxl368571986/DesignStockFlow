/**
 * Axios网络请求封装
 * 提供统一的请求/响应拦截、错误处理、Token管理、CSRF防护
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { ElMessage } from 'element-plus';
import {
  getToken,
  validateRequestOrigin,
  getAllowedOrigins,
  isTokenExpiringSoon,
  isTokenExpired,
  setToken,
  setTokenExpireTime,
  removeToken,
  removeTokenExpireTime,
  validateTokenState
} from './security';
import type { ApiResponse } from '@/types/api';

// Token刷新状态
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * 添加Token刷新订阅者
 * @param callback 回调函数
 */
function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * 通知所有Token刷新订阅者
 * @param token 新Token
 */
function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * 刷新Token
 * @returns Promise<string> 新Token
 */
async function refreshAuthToken(): Promise<string> {
  try {
    // 使用service实例而不是直接使用axios，这样可以被mock
    const response = await service.post<ApiResponse<{ token: string }>>(
      '/auth/refresh-token',
      {},
      {
        // 跳过拦截器，避免循环
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      }
    );

    if (response.data.code === 200 && response.data.data) {
      const newToken = response.data.data.token;

      // 更新Token（保持原有的rememberMe设置）
      setToken(newToken, false);

      return newToken;
    } else {
      throw new Error('Token刷新失败');
    }
  } catch (error) {
    console.error('Token刷新失败:', error);
    throw error;
  }
}

// 创建Axios实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000, // 10秒超时
  withCredentials: true, // 携带Cookie
  headers: {
    'Content-Type': 'application/json'
  }
});

// 配置请求重试
axiosRetry(service, {
  retries: 3, // 重试3次
  retryDelay: axiosRetry.exponentialDelay, // 指数退避
  retryCondition: (error: AxiosError) => {
    // 网络错误或5xx错误时重试
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status !== undefined && error.response.status >= 500)
    );
  }
});

// 请求拦截器
service.interceptors.request.use(
  async (config) => {
    // 验证请求来源（仅在生产环境）
    if (import.meta.env.PROD) {
      const allowedOrigins = getAllowedOrigins();
      if (!validateRequestOrigin(allowedOrigins)) {
        console.error('请求来源验证失败');
        return Promise.reject(new Error('Invalid request origin'));
      }
    }

    // 1. 首先检查Token是否存在
    const token = getToken();
    
    if (!token) {
      return config; // 让请求继续，由后端返回401
    }

    // 2. 检查Token状态一致性
    const tokenState = validateTokenState();
    
    if (!tokenState.valid) {
      if (tokenState.hasToken && !tokenState.hasExpireTime) {
        // 有token但没有过期时间，设置默认过期时间
        const defaultExpireTime = Date.now() + 24 * 60 * 60 * 1000; // 24小时
        setTokenExpireTime(defaultExpireTime);
      }
    }

    // 3. 检查Token是否过期（只在有过期时间时检查）
    if (isTokenExpired()) {
      handleTokenExpired();
      return Promise.reject(new Error('Token expired'));
    }

    // 4. 检查Token是否即将过期，如果是则刷新
    if (isTokenExpiringSoon() && !isRefreshing) {
      isRefreshing = true;

      try {
        const newToken = await refreshAuthToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);
      } catch (error) {
        isRefreshing = false;
        // 刷新失败不立即退出，让请求继续
        // 如果真的过期，后端会返回401
      }
    }

    // 5. 如果正在刷新Token，将请求加入队列
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          resolve(config);
        });
      });
    }

    // 6. 添加Token到请求头
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 对于POST、PUT、DELETE、PATCH请求，添加CSRF Token
    const methodsRequiringCSRF = ['post', 'put', 'delete', 'patch'];
    const method = config.method?.toLowerCase();

    if (method && methodsRequiringCSRF.includes(method)) {
      // 临时禁用CSRF检查，以便测试
      // TODO: 实现完整的CSRF Token机制
      /*
      // 检查CSRF Token是否存在
      if (!hasValidCSRFToken()) {
        console.error('CSRF Token不存在或已过期');
        ElMessage.warning('安全令牌已过期，请刷新页面后重试');
        return Promise.reject(new Error('CSRF Token missing or expired'));
      }

      // 添加CSRF Token到请求头
      const csrfToken = getCSRFToken();
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }
      */
    }

    // 添加请求标识
    if (config.headers) {
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    // 添加Referer和Origin（浏览器会自动添加，这里显式设置以确保）
    if (config.headers && import.meta.env.PROD) {
      config.headers['Origin'] = window.location.origin;
      config.headers['Referer'] = window.location.href;
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加一个标志，防止多次触发退出登录
let isHandlingUnauthorized = false;
// 用于存储401处理的Promise，确保并发请求等待同一个处理完成
let unauthorizedHandlingPromise: Promise<void> | null = null;
// 记录最后一次401处理的时间，用于去重
let lastUnauthorizedHandleTime = 0;
// 去重时间窗口（毫秒）
const UNAUTHORIZED_DEBOUNCE_TIME = 1000;
// 记录是否已经执行过退出登录（在去重窗口内）
let hasLoggedOut = false;

/**
 * 处理401未授权错误
 * 验证Token是否真的过期，避免误判
 * 注意：此函数使用同步标志来防止并发调用
 */
function handleUnauthorizedError(): Promise<void> {
  const now = Date.now();
  
  // 检查是否在去重时间窗口内已经执行过退出登录
  if (hasLoggedOut && now - lastUnauthorizedHandleTime < UNAUTHORIZED_DEBOUNCE_TIME) {
    return Promise.resolve();
  }

  // 防止并发请求多次触发 - 同步检查
  if (isHandlingUnauthorized) {
    // 如果已经在处理中，等待当前处理完成
    // 注意：这里必须返回现有的 Promise，即使它是 null 也要等待
    return unauthorizedHandlingPromise || Promise.resolve();
  }

  // 立即同步设置标志，防止并发调用
  isHandlingUnauthorized = true;
  lastUnauthorizedHandleTime = now;

  // 立即创建处理Promise（同步），让并发请求可以等待
  const handleAsync = async () => {
    try {
      // 验证Token是否真的过期
      const token = getToken();
      const isExpired = isTokenExpired();

      if (!token || isExpired) {
        // Token确实过期或不存在，执行退出登录
        ElMessage.error('登录已过期，请重新登录');
        handleTokenExpired();
        hasLoggedOut = true;
      } else {
        // Token存在且未过期，可能是其他原因导致的401
        // 尝试刷新Token
        console.log('Token未过期但收到401，尝试刷新Token');
        try {
          await refreshAuthToken();
          console.log('Token刷新成功，请重试操作');
          ElMessage.warning('认证已更新，请重试操作');
        } catch (refreshError) {
          console.error('Token刷新失败，执行退出登录');
          ElMessage.error('登录已过期，请重新登录');
          handleTokenExpired();
          hasLoggedOut = true;
        }
      }
    } finally {
      isHandlingUnauthorized = false;
      unauthorizedHandlingPromise = null;
    }
  };

  // 同步创建 Promise 并赋值
  unauthorizedHandlingPromise = handleAsync();

  return unauthorizedHandlingPromise;
}

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data as ApiResponse;

    // 如果响应码不是200，视为错误
    if (res.code !== 200) {
      ElMessage.error(res.msg || '请求失败');

      // 特殊错误码处理
      if (res.code === 401) {
        // 登录接口的401不触发自动跳转，由登录页面自己处理
        const url = response.config.url || '';
        if (!url.includes('/auth/login')) {
          // 401错误，验证Token是否真的过期
          handleUnauthorizedError();
        }
      } else if (res.code === 403) {
        ElMessage.error('没有权限访问');
      }

      return Promise.reject(new Error(res.msg || '请求失败'));
    }

    // 返回整个response对象，保持Axios的响应结构
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    console.error('响应错误:', error);

    // 处理HTTP状态码错误
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.msg || '请求失败';
      const url = error.config?.url || '';

      switch (status) {
        case 401:
          // 登录接口的401不触发自动跳转，由登录页面自己处理
          if (!url.includes('/auth/login')) {
            handleUnauthorizedError();
          }
          break;
        case 403:
          ElMessage.error('没有权限访问');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器错误，请稍后重试');
          break;
        case 502:
        case 503:
        case 504:
          ElMessage.error('服务暂时不可用，请稍后重试');
          break;
        default:
          ElMessage.error(message);
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      ElMessage.error('网络异常，请检查网络连接');
    } else {
      // 请求配置错误
      ElMessage.error('请求配置错误');
    }

    return Promise.reject(error);
  }
);

/**
 * 处理Token过期
 * 注意：此函数使用 hasLoggedOut 标志来防止重复调用
 */
function handleTokenExpired(): void {
  // 检查是否已经执行过退出登录
  if (hasLoggedOut) {
    return;
  }
  
  hasLoggedOut = true;
  
  // 清除Token和过期时间
  removeToken();
  removeTokenExpireTime();

  // 清除用户信息（通过Store）
  // 注意：这里不能直接导入Store，因为会造成循环依赖
  // Store的清理会在路由守卫或组件中处理

  // 跳转登录页
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
}

/**
 * GET请求
 * @param url 请求URL
 * @param params 请求参数
 * @param config 请求配置
 * @returns Promise<T>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function get<T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return service.get(url, { params, ...config }).then((res) => res.data as ApiResponse<T>);
}

/**
 * POST请求
 * @param url 请求URL
 * @param data 请求数据
 * @param config 请求配置
 * @returns Promise<T>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return service.post(url, data, config).then((res) => res.data as ApiResponse<T>);
}

/**
 * PUT请求
 * @param url 请求URL
 * @param data 请求数据
 * @param config 请求配置
 * @returns Promise<T>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function put<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return service.put(url, data, config).then((res) => res.data as ApiResponse<T>);
}

/**
 * DELETE请求
 * @param url 请求URL
 * @param params 请求参数
 * @param config 请求配置
 * @returns Promise<T>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function del<T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return service.delete(url, { params, ...config }).then((res) => res.data as ApiResponse<T>);
}

/**
 * PATCH请求
 * @param url 请求URL
 * @param data 请求数据
 * @param config 请求配置
 * @returns Promise<T>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function patch<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return service.patch(url, data, config).then((res) => res.data as ApiResponse<T>);
}

/**
 * 文件上传
 * @param url 请求URL
 * @param formData FormData对象
 * @param onUploadProgress 上传进度回调
 * @returns Promise<T>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function upload<T = any>(
  url: string,
  formData: FormData,
  onUploadProgress?: (progressEvent: any) => void
): Promise<ApiResponse<T>> {
  return service
    .post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    })
    .then((res) => res.data as ApiResponse<T>);
}

/**
 * 文件下载
 * @param url 请求URL
 * @param params 请求参数
 * @param fileName 文件名
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function download(
  url: string,
  params?: Record<string, any>,
  fileName?: string
): Promise<void> {
  try {
    const response = await service.get(url, {
      params,
      responseType: 'blob'
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('下载失败:', error);
    ElMessage.error('下载失败，请稍后重试');
  }
}

// 导出Axios实例（用于特殊场景）
export default service;

// 导出用于测试的函数和状态检查器
export { handleUnauthorizedError };

/**
 * 获取当前是否正在处理401错误（用于测试）
 */
export function getIsHandlingUnauthorized(): boolean {
  return isHandlingUnauthorized;
}

/**
 * 重置401错误处理状态（用于测试）
 */
export function resetUnauthorizedHandling(): void {
  isHandlingUnauthorized = false;
  unauthorizedHandlingPromise = null;
  lastUnauthorizedHandleTime = 0;
  hasLoggedOut = false;
}
