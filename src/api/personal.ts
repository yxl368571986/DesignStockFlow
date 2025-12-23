/**
 * 个人中心相关API接口
 */

import { get, post, put, del } from '@/utils/request';
import type { DownloadRecord, UploadRecord, VIPInfo, UserInfo } from '@/types/models';
import type { ApiResponse, PageResponse, PageParams } from '@/types/api';

/**
 * 获取用户信息
 * @returns Promise<UserInfo>
 */
export function getUserInfo(): Promise<ApiResponse<UserInfo>> {
  return get<UserInfo>('/user/info');
}

/**
 * 更新用户信息
 * @param data 用户信息（昵称、头像、邮箱等）
 * @returns Promise<UserInfo>
 */
export function updateUserInfo(data: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> {
  return put<UserInfo>('/user/info', data);
}

/**
 * 修改密码
 * @param data 密码信息（旧密码、新密码）
 * @returns Promise<void>
 */
export function changePassword(data: {
  oldPassword: string;
  newPassword: string;
}): Promise<ApiResponse<void>> {
  return put<void>('/user/password', data);
}

/**
 * 获取下载记录
 * @param params 分页参数
 * @returns Promise<PageResponse<DownloadRecord>>
 */
export function getDownloadHistory(
  params: PageParams
): Promise<ApiResponse<PageResponse<DownloadRecord>>> {
  return get<PageResponse<DownloadRecord>>('/user/download-history', params);
}

/**
 * 获取上传记录
 * @param params 分页参数
 * @returns Promise<PageResponse<UploadRecord>>
 */
export function getUploadHistory(
  params: PageParams
): Promise<ApiResponse<PageResponse<UploadRecord>>> {
  return get<PageResponse<UploadRecord>>('/user/upload-history', params);
}

/**
 * 上传头像
 * @param formData FormData对象（包含avatar文件）
 * @returns Promise<{ avatarUrl: string }>
 */
export function uploadAvatar(formData: FormData): Promise<ApiResponse<{ avatarUrl: string }>> {
  return post<{ avatarUrl: string }>('/user/upload-avatar', formData);
}

/**
 * 绑定邮箱
 * @param data 邮箱信息（邮箱、验证码）
 * @returns Promise<void>
 */
export function bindEmail(data: { email: string; verifyCode: string }): Promise<ApiResponse<void>> {
  return post<void>('/user/bind-email', data);
}

/**
 * 获取收藏列表
 * @param params 分页参数
 * @returns Promise<PageResponse<ResourceInfo>>
 */
export function getCollections(params: PageParams): Promise<ApiResponse<PageResponse<any>>> {
  return get<PageResponse<any>>('/favorites', params);
}

/**
 * 删除上传的资源
 * @param resourceId 资源ID
 * @returns Promise<void>
 */
export function deleteUploadedResource(resourceId: string): Promise<ApiResponse<void>> {
  return del<void>(`/resources/${resourceId}`);
}

/**
 * 获取VIP信息
 * @returns Promise<VIPInfo>
 */
export function getVIPInfo(): Promise<ApiResponse<VIPInfo>> {
  return get<VIPInfo>('/user/vip-info');
}
