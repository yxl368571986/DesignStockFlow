/**
 * 系统设置控制器
 * 处理系统设置相关的HTTP请求
 */
import { Request, Response, NextFunction } from 'express';
import { systemSettingsService } from '@/services/systemSettingsService.js';
import { success, error } from '@/utils/response.js';
import { logger } from '@/utils/logger.js';

export class SystemSettingsController {
  /**
   * 获取所有系统设置
   * GET /api/v1/admin/settings
   */
  async getAllSettings(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      // 验证管理员权限
      const user = req.user;
      if (!user) {
        error(res, '未认证，请先登录', 401);
        return;
      }

      // 获取所有系统设置
      const settings = await systemSettingsService.getAllSettings();

      success(res, settings, '获取系统设置成功');
    } catch (err: any) {
      logger.error('获取系统设置失败:', err);
      error(res, err.message || '获取系统设置失败', 400);
    }
  }

  /**
   * 更新系统设置
   * PUT /api/v1/admin/settings
   */
  async updateSettings(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      // 验证管理员权限
      const user = req.user;
      if (!user) {
        error(res, '未认证，请先登录', 401);
        return;
      }

      const settings = req.body;

      if (!settings || typeof settings !== 'object') {
        error(res, '请提供有效的设置数据', 400);
        return;
      }

      // 验证必要的配置项
      const validKeys = [
        'site_name',
        'site_logo',
        'site_favicon',
        'site_title',
        'site_keywords',
        'site_description',
        'max_file_size',
        'allowed_file_formats',
        'daily_download_limit',
        'watermark_text',
        'watermark_opacity',
        'watermark_position',
        'wechat_pay_enabled',
        'alipay_enabled',
        'points_recharge_enabled',
        'vip_auto_renew_enabled',
      ];

      // 过滤出有效的配置项
      const validSettings: Record<string, any> = {};
      for (const key of Object.keys(settings)) {
        if (validKeys.includes(key)) {
          validSettings[key] = settings[key];
        }
      }

      if (Object.keys(validSettings).length === 0) {
        error(res, '没有有效的配置项需要更新', 400);
        return;
      }

      // 更新系统设置
      await systemSettingsService.updateSettings(validSettings);

      // 记录操作日志
      logger.info(`管理员 ${user.userId} 更新了系统设置`, {
        userId: user.userId,
        settings: Object.keys(validSettings),
      });

      success(res, null, '系统设置更新成功');
    } catch (err: any) {
      logger.error('更新系统设置失败:', err);
      error(res, err.message || '更新系统设置失败', 400);
    }
  }

  /**
   * 重置系统设置
   * POST /api/v1/admin/settings/reset
   */
  async resetSettings(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      // 验证管理员权限
      const user = req.user;
      if (!user) {
        error(res, '未认证，请先登录', 401);
        return;
      }

      // 重置系统设置
      await systemSettingsService.resetSettings();

      // 记录操作日志
      logger.info(`管理员 ${user.userId} 重置了系统设置`, {
        userId: user.userId,
      });

      success(res, null, '系统设置已重置为默认值');
    } catch (err: any) {
      logger.error('重置系统设置失败:', err);
      error(res, err.message || '重置系统设置失败', 400);
    }
  }
}

export const systemSettingsController = new SystemSettingsController();
export default systemSettingsController;
