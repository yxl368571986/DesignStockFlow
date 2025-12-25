/**
 * 认证控制器
 */
import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/authService.js';
import { success, error } from '@/utils/response.js';
import { logger } from '@/utils/logger.js';
import type {
  RegisterRequest,
  LoginRequest,
  SendCodeRequest,
} from '@/types/auth.js';

export class AuthController {
  /**
   * 用户注册
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const data: RegisterRequest = req.body;

      // 验证必填字段
      if (!data.phone || !data.verify_code || !data.password) {
        error(res, '手机号、验证码和密码不能为空', 400);
        return;
      }

      // 调用服务
      const result = await authService.register(data);

      success(res, result, '注册成功');
    } catch (err: unknown) {
      logger.error('注册失败:', err);
      const message = err instanceof Error ? err.message : '注册失败';
      error(res, message, 400);
    }
  }

  /**
   * 用户登录（密码）
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const data: LoginRequest = req.body;

      // 验证必填字段
      if (!data.phone || !data.password) {
        error(res, '手机号和密码不能为空', 400);
        return;
      }

      // 调用服务
      const result = await authService.login(data);

      success(res, result, '登录成功');
    } catch (err: unknown) {
      logger.error('登录失败:', err);
      const message = err instanceof Error ? err.message : '登录失败';
      const errorCode = (err as Error & { code?: string })?.code;
      
      // 返回带错误码的响应，便于前端区分错误类型
      res.status(401).json({
        code: 401,
        msg: message,
        data: null,
        errorCode: errorCode || 'LOGIN_FAILED'
      });
    }
  }

  /**
   * 验证码登录
   * POST /api/v1/auth/login/code
   */
  async loginWithCode(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { phone, verify_code } = req.body;

      if (!phone || !verify_code) {
        error(res, '手机号和验证码不能为空', 400);
        return;
      }

      const result = await authService.loginWithCode({ phone, verify_code });

      success(res, result, '登录成功');
    } catch (err: unknown) {
      logger.error('验证码登录失败:', err);
      const message = err instanceof Error ? err.message : '登录失败';
      error(res, message, 401);
    }
  }

  /**
   * 发送验证码
   * POST /api/v1/auth/send-code
   */
  async sendCode(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const data: SendCodeRequest = req.body;

      if (!data.phone) {
        error(res, '手机号不能为空', 400);
        return;
      }

      await authService.sendVerifyCode(data);

      success(res, null, '验证码发送成功');
    } catch (err: unknown) {
      logger.error('发送验证码失败:', err);
      const message = err instanceof Error ? err.message : '发送验证码失败';
      error(res, message, 400);
    }
  }

  /**
   * 刷新Token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        error(res, 'refresh_token不能为空', 400);
        return;
      }

      const result = await authService.refreshToken(refresh_token);

      success(res, result, 'Token刷新成功');
    } catch (err: unknown) {
      logger.error('刷新Token失败:', err);
      const message = err instanceof Error ? err.message : 'Token刷新失败';
      error(res, message, 401);
    }
  }

  /**
   * 退出登录
   * POST /api/v1/auth/logout
   */
  async logout(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      // 可以在这里处理token黑名单等逻辑
      success(res, null, '退出成功');
    } catch (err: unknown) {
      logger.error('退出失败:', err);
      const message = err instanceof Error ? err.message : '退出失败';
      error(res, message, 500);
    }
  }

  /**
   * 重置密码
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { phone, verify_code, new_password } = req.body;

      if (!phone || !verify_code || !new_password) {
        error(res, '手机号、验证码和新密码不能为空', 400);
        return;
      }

      await authService.resetPassword({ phone, verify_code, new_password });

      success(res, null, '密码重置成功');
    } catch (err: unknown) {
      logger.error('重置密码失败:', err);
      const message = err instanceof Error ? err.message : '重置密码失败';
      error(res, message, 400);
    }
  }

  /**
   * 修改密码
   * POST /api/v1/auth/change-password
   */
  async changePassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        error(res, '未登录', 401);
        return;
      }

      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        error(res, '旧密码和新密码不能为空', 400);
        return;
      }

      await authService.changePassword(userId, { old_password, new_password });

      success(res, null, '密码修改成功');
    } catch (err: unknown) {
      logger.error('修改密码失败:', err);
      const message = err instanceof Error ? err.message : '修改密码失败';
      error(res, message, 400);
    }
  }
}

export const authController = new AuthController();
export default authController;
