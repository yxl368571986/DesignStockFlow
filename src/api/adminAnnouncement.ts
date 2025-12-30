// 管理后台 - 公告管理API

import request from '@/utils/request';

// 公告信息
export interface Announcement {
  announcementId: string;
  title: string;
  content: string;
  type: 'normal' | 'important' | 'warning';
  linkUrl: string;
  isTop: boolean;
  startTime: string | null;
  endTime: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
}

// 公告列表查询参数
export interface AnnouncementListParams {
  status?: number;
  type?: string;
  page?: number;
  limit?: number;
}

// 公告创建/编辑参数
export interface AnnouncementFormData {
  title: string;
  content: string;
  type: 'normal' | 'important' | 'warning';
  linkUrl: string;
  isTop: boolean;
  startTime: string | null;
  endTime: string | null;
  status: number;
}

// API响应格式
interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

/**
 * 获取公告列表(管理员)
 */
export async function getAdminAnnouncementList(params: AnnouncementListParams = {}): Promise<{
  list: Announcement[];
  total: number;
}> {
  const response = await request({
    url: '/admin/announcements',
    method: 'GET',
    params
  });
  const data = response.data as unknown as ApiResponse<{ list: Announcement[]; total: number }>;
  if (data.code === 200 && data.data) {
    return { list: data.data.list, total: data.data.total };
  }
  return { list: [], total: 0 };
}

/**
 * 创建公告(管理员)
 */
export async function createAdminAnnouncement(formData: AnnouncementFormData): Promise<Announcement | null> {
  const response = await request({
    url: '/admin/announcements',
    method: 'POST',
    data: formData
  });
  const data = response.data as unknown as ApiResponse<Announcement>;
  if (data.code === 200 && data.data) {
    return data.data;
  }
  return null;
}

/**
 * 更新公告(管理员)
 */
export async function updateAdminAnnouncement(announcementId: string, formData: Partial<AnnouncementFormData>): Promise<Announcement | null> {
  const response = await request({
    url: `/admin/announcements/${announcementId}`,
    method: 'PUT',
    data: formData
  });
  const data = response.data as unknown as ApiResponse<Announcement>;
  if (data.code === 200 && data.data) {
    return data.data;
  }
  return null;
}

/**
 * 删除公告(管理员)
 */
export async function deleteAdminAnnouncement(announcementId: string): Promise<boolean> {
  const response = await request({
    url: `/admin/announcements/${announcementId}`,
    method: 'DELETE'
  });
  const data = response.data as unknown as ApiResponse<unknown>;
  return data.code === 200;
}

/**
 * 更新公告状态(管理员)
 */
export async function updateAdminAnnouncementStatus(announcementId: string, status: number): Promise<boolean> {
  const response = await request({
    url: `/admin/announcements/${announcementId}`,
    method: 'PUT',
    data: { status }
  });
  const data = response.data as unknown as ApiResponse<unknown>;
  return data.code === 200;
}
