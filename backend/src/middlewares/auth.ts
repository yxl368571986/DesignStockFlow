/**
 * JWT认证中间件
 */
import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/authService.js';
import { error } from '@/utils/response.js';
import { logger } from '@/utils/logger.js';
import type { JwtPayload } from '@/types/auth.js';

// 扩展Express Request类型，添加user属性
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT认证中间件
 * 验证Token有效性并将用户信息注入请求上下文
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. 从请求头获取Token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      error(res, '未提供认证Token', 401);
      return;
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 2. 验证Token
    const payload = authService.verifyToken(token);

    // 3. 将用户信息注入请求上下文
    req.user = payload;

    // 4. 继续处理请求
    next();
  } catch (err: any) {
    logger.error('Token验证失败:', err);
    error(res, 'Token无效或已过期，请重新登录', 401);
  }
};

/**
 * 可选认证中间件
 * Token存在时验证，不存在时继续执行
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      req.user = payload;
    }
    next();
  } catch (err: any) {
    // Token无效时不报错，继续执行
    logger.warn('可选认证Token验证失败:', err);
    next();
  }
};

/**
 * 权限验证中间件工厂函数
 * 检查用户是否拥有指定权限
 * @param requiredPermissions 需要的权限代码数组
 * @returns Express中间件函数
 */
export const requirePermissions = (requiredPermissions: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // 1. 检查用户是否已认证
      if (!req.user) {
        error(res, '未认证，请先登录', 401);
        return;
      }

      // 2. 超级管理员拥有所有权限
      if (req.user.roleCode === 'super_admin') {
        next();
        return;
      }

      // 3. 检查用户权限
      const userPermissions = req.user.permissions || [];
      const hasPermission = requiredPermissions.every((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        logger.warn(
          `用户 ${req.user.userId} 缺少权限: ${requiredPermissions.join(', ')}`
        );
        error(res, '权限不足，无法访问该资源', 403);
        return;
      }

      // 4. 权限验证通过，继续处理请求
      next();
    } catch (err: any) {
      logger.error('权限验证失败:', err);
      error(res, '权限验证失败', 500);
    }
  };
};

/**
 * 角色验证中间件工厂函数
 * 检查用户是否拥有指定角色
 * @param requiredRoles 需要的角色代码数组
 * @returns Express中间件函数
 */
export const requireRoles = (requiredRoles: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // 1. 检查用户是否已认证
      if (!req.user) {
        error(res, '未认证，请先登录', 401);
        return;
      }

      // 2. 检查用户角色
      if (!requiredRoles.includes(req.user.roleCode)) {
        logger.warn(
          `用户 ${req.user.userId} 角色不匹配: 需要 ${requiredRoles.join(', ')}, 实际 ${req.user.roleCode}`
        );
        error(res, '角色权限不足，无法访问该资源', 403);
        return;
      }

      // 3. 角色验证通过，继续处理请求
      next();
    } catch (err: any) {
      logger.error('角色验证失败:', err);
      error(res, '角色验证失败', 500);
    }
  };
};

export default {
  authenticate,
  optionalAuthenticate,
  requirePermissions,
  requireRoles,
};
