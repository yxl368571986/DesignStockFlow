/**
 * 认证相关API接口
 */

import { post, get } from '@/utils/request';
import type {
  LoginResponse,
  RegisterRequest,
  UserInfo
} from '@/types/models';
import type { ApiResponse } from '@/types/api';

/**
 * 用户登录（密码登录）
 * @param data 登录信息（手机号、密码）
 * @returns Promise<LoginResponse>
 */
export function login(data: { phone: string; password: string }): Promise<ApiResponse<LoginResponse>> {
  return post<LoginResponse>('/auth/login', data);
}

/**
 * 验证码登录
 * @param data 登录信息（手机号、验证码）
 * @returns Promise<LoginResponse>
 */
export function codeLogin(data: { phone: string; code: string }): Promise<ApiResponse<LoginResponse>> {
  return post<LoginResponse>('/auth/code-login', data);
}

/**
 * 用户注册
 * @param data 注册信息（手机号、验证码、密码）
 * @returns Promise<LoginResponse>
 */
export function register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
  return post<LoginResponse>('/auth/register', data);
}

/**
 * 发送验证码
 * @param data 验证码请求信息（手机号）
 * @returns Promise<void>
 */
export function sendVerifyCode(data: { phone: string }): Promise<ApiResponse<void>> {
  return post<void>('/auth/send-code', data);
}

/**
 * 获取微信登录URL
 * @returns Promise<{ authUrl: string }>
 */
export function getWechatLoginUrl(): Promise<ApiResponse<{ authUrl: string }>> {
  return get<{ authUrl: string }>('/auth/wechat/login');
}

/**
 * 获取用户信息
 * @returns Promise<UserInfo>
 */
export function getUserInfo(): Promise<ApiResponse<UserInfo>> {
  return get<UserInfo>('/user/info');
}

/**
 * 退出登录
 * @returns Promise<void>
 */
export function logout(): Promise<ApiResponse<void>> {
  return post<void>('/auth/logout');
}

/**
 * 刷新Token
 * @returns Promise<{ token: string }>
 */
export function refreshToken(): Promise<ApiResponse<{ token: string }>> {
  return post<{ token: string }>('/auth/refresh-token');
}
