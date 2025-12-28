/**
 * API响应类型定义
 */

// 统一API响应格式
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data: T;
  timestamp?: number;
}

/**
 * 检查API响应是否成功
 * 后端API使用 code: 0 表示成功，部分旧接口使用 code: 200
 * @param res API响应对象
 * @returns 是否成功
 */
export function isApiSuccess(res: ApiResponse): boolean {
  return res.code === 0 || res.code === 200;
}

// 分页响应
export interface PageResponse<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

// 分页请求参数
export interface PageParams {
  pageNum: number;
  pageSize: number;
}
