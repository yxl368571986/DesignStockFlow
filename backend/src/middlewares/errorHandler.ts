import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger.js';
import { error } from '@/utils/response.js';

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 记录错误日志
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // 处理不同类型的错误
  if (err.name === 'ValidationError') {
    // 验证错误
    error(res, err.message, 400);
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    // JWT认证错误
    error(res, '身份验证失败，请重新登录', 401);
  } else if (err.name === 'ForbiddenError') {
    // 权限不足
    error(res, '您没有权限访问该资源', 403);
  } else if (err.name === 'NotFoundError') {
    // 资源不存在
    error(res, '请求的资源不存在', 404);
  } else if (err.status === 413) {
    // 文件过大
    error(res, '上传文件过大，请压缩后重试', 413);
  } else {
    // 其他错误
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || '服务器内部错误';
    error(res, message, statusCode);
  }
};

/**
 * 404错误处理
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  error(res, `接口 ${req.method} ${req.url} 不存在`, 404);
};

export default {
  errorHandler,
  notFoundHandler,
};
