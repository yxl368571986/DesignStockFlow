import { Response } from 'express';

/**
 * 统一响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
  timestamp: number;
}

/**
 * 成功响应
 */
export const success = <T = any>(res: Response, data?: T, msg = '操作成功'): void => {
  const response: ApiResponse<T> = {
    code: 200,
    msg,
    data,
    timestamp: Date.now(),
  };
  res.status(200).json(response);
};

/**
 * 失败响应
 */
export const error = (res: Response, msg = '操作失败', code = 400): void => {
  const response: ApiResponse = {
    code,
    msg,
    timestamp: Date.now(),
  };
  
  // 根据错误码设置HTTP状态码
  let httpStatus = 400;
  if (code === 401) {
    httpStatus = 401;
  } else if (code === 403) {
    httpStatus = 403;
  } else if (code === 404) {
    httpStatus = 404;
  } else if (code >= 500) {
    httpStatus = 500;
  }
  
  res.status(httpStatus).json(response);
};

/**
 * 分页响应
 */
export interface PageResponse<T = any> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
}

export const page = <T = any>(
  res: Response,
  list: T[],
  total: number,
  pageNum: number,
  pageSize: number,
  msg = '查询成功'
): void => {
  const pageData: PageResponse<T> = {
    list,
    total,
    pageNum,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
  success(res, pageData, msg);
};

export default {
  success,
  error,
  page,
};
