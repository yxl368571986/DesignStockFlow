/**
 * 用户控制器
 */
import { Request, Response, NextFunction } from 'express';
import { userService } from '@/services/userService.js';
import { success, error } from '@/utils/response.js';
import { logger } from '@/utils/logger.js';

export class UserController {
  /**
   * 获取当前登录用户信息
   * GET /api/v1/user/info
   */
  async getUserInfo(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        error(res, '未认证，请先登录', 401);
        return;
      }

      const userId = req.user.userId;
      const userInfo = await userService.getUserInfo(userId);

      success(res, userInfo, '获取用户信息成功');
    } catch (err: any) {
      logger.error('获取用户信息失败:', err);
      error(res, err.message || '获取用户信息失败', 400);
    }
  }

  /**
   * 更新用户信息
   * PUT /api/v1/user/info
   */
  async updateUserInfo(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        error(res, '未认证，请先登录', 401);
        return;
      }

      const userId = req.user.userId;
      const updateData = req.body;

      const userInfo = await userService.updateUserInfo(userId, updateData);

      success(res, userInfo, '更新用户信息成功');
    } catch (err: any) {
      logger.error('更新用户信息失败:', err);
      error(res, err.message || '更新用户信息失败', 400);
    }
  }

  /**
   * 修改密码
   * PUT /api/v1/user/password
   */
  async updatePassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        error(res, '未认证，请先登录', 401);
        return;
      }

      const userId = req.user.userId;
      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        error(res, '旧密码和新密码不能为空', 400);
        return;
      }

      await userService.updatePassword(userId, old_password, new_password);

      success(res, null, '密码修改成功');
    } catch (err: any) {
      logger.error('修改密码失败:', err);
      error(res, err.message || '修改密码失败', 400);
    }
  }

  /**
   * 获取下载历史
   * GET /api/v1/user/download-history
   */
  async getDownloadHistory(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        error(res, '未认证，请先登录', 401);
        return;
      }

      const userId = req.user.userId;
      const { pageNum = 1, pageSize = 10 } = req.query;

      const result = await userService.getDownloadHistory(
        userId,
        Number(pageNum),
        Number(pageSize)
      );

      success(res, result, '获取下载历史成功');
    } catch (err: any) {
      logger.error('获取下载历史失败:', err);
      error(res, err.message || '获取下载历史失败', 400);
    }
  }

  /**
   * 获取上传历史
   * GET /api/v1/user/upload-history
   */
  async getUploadHistory(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        error(res, '未认证，请先登录', 401);
        return;
      }

      const userId = req.user.userId;
      const { pageNum = 1, pageSize = 10 } = req.query;

      const result = await userService.getUploadHistory(
        userId,
        Number(pageNum),
        Number(pageSize)
      );

      success(res, result, '获取上传历史成功');
    } catch (err: any) {
      logger.error('获取上传历史失败:', err);
      error(res, err.message || '获取上传历史失败', 400);
    }
  }

  /**
   * 获取VIP信息
   * GET /api/v1/user/vip-info
   */
  async getVIPInfo(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        error(res, '未认证，请先登录', 401);
        return;
      }

      const userId = req.user.userId;
      const vipInfo = await userService.getVIPInfo(userId);

      success(res, vipInfo, '获取VIP信息成功');
    } catch (err: any) {
      logger.error('获取VIP信息失败:', err);
      error(res, err.message || '获取VIP信息失败', 400);
    }
  }
}

export const userController = new UserController();
export default userController;
