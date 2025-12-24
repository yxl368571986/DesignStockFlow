/**
 * 系统设置API接口
 * 
 * 功能：
 * - 获取系统设置
 * - 更新系统设置
 * - 重置系统设置
 * 
 * 需求: 需求18.1-18.10
 */

import request from '@/utils/request';

/**
 * 系统设置数据类型
 */
export interface SystemSettings {
  // 网站信息
  siteName: string;
  siteLogo: string;
  siteFavicon: string;
  
  // SEO信息
  siteTitle: string;
  siteKeywords: string;
  siteDescription: string;
  
  // 上传限制
  maxFileSize: number;
  allowedFileFormats: string;
  
  // 下载限制
  dailyDownloadLimit: number;
  
  // 水印配置
  watermarkText: string;
  watermarkOpacity: number;
  watermarkPosition: string;
  
  // 支付方式
  wechatPayEnabled: boolean;
  alipayEnabled: boolean;
  
  // 其他配置
  pointsRechargeEnabled: boolean;
  vipAutoRenewEnabled: boolean;
}

/**
 * 系统设置响应类型
 */
export interface SystemSettingsResponse {
  [key: string]: {
    value: any;
    type: string;
    description: string;
  };
}

/**
 * 获取系统设置
 */
export function getSystemSettings() {
  return request<SystemSettingsResponse>({
    url: '/admin/settings',
    method: 'GET'
  });
}

/**
 * 更新系统设置
 */
export function updateSystemSettings(data: Partial<Record<string, any>>) {
  return request({
    url: '/admin/settings',
    method: 'PUT',
    data
  });
}

/**
 * 重置系统设置
 */
export function resetSystemSettings() {
  return request({
    url: '/admin/settings/reset',
    method: 'POST'
  });
}
