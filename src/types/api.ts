/**
 * API响应类型定义
 */

// 统一API响应格式
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
  timestamp: number;
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
