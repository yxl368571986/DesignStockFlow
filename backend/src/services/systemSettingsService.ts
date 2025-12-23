/**
 * 系统设置服务
 * 处理系统配置的业务逻辑
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

/**
 * 系统设置服务类
 */
class SystemSettingsService {
  /**
   * 获取所有系统设置
   */
  async getAllSettings(): Promise<Record<string, any>> {
    try {
      const configs = await prisma.system_config.findMany({
        orderBy: {
          config_key: 'asc',
        },
      });

      const settings: Record<string, any> = {};
      
      for (const config of configs) {
        let value: any = config.config_value;
        
        switch (config.config_type) {
          case 'number':
            value = parseFloat(config.config_value);
            break;
          case 'boolean':
            value = config.config_value === 'true';
            break;
          case 'json':
            try {
              value = JSON.parse(config.config_value);
            } catch (e) {
              logger.warn(`解析JSON配置失败: ${config.config_key}`, e);
              value = config.config_value;
            }
            break;
          case 'string':
          default:
            value = config.config_value;
            break;
        }

        settings[config.config_key] = {
          value,
          type: config.config_type,
          description: config.description,
        };
      }

      return settings;
    } catch (error) {
      logger.error('获取系统设置失败:', error);
      throw new Error('获取系统设置失败');
    }
  }

  /**
   * 获取单个配置项
   */
  async getSetting(key: string): Promise<any> {
    try {
      const config = await prisma.system_config.findUnique({
        where: { config_key: key },
      });

      if (!config) {
        return null;
      }

      let value: any = config.config_value;
      
      switch (config.config_type) {
        case 'number':
          value = parseFloat(config.config_value);
          break;
        case 'boolean':
          value = config.config_value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(config.config_value);
          } catch (e) {
            logger.warn(`解析JSON配置失败: ${key}`, e);
            value = config.config_value;
          }
          break;
        case 'string':
        default:
          value = config.config_value;
          break;
      }

      return value;
    } catch (error) {
      logger.error(`获取配置项失败: ${key}`, error);
      throw new Error('获取配置项失败');
    }
  }

  /**
   * 更新系统设置
   */
  async updateSettings(settings: Record<string, any>): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        for (const [key, value] of Object.entries(settings)) {
          const existingConfig = await tx.system_config.findUnique({
            where: { config_key: key },
          });

          if (!existingConfig) {
            logger.warn(`配置项不存在，跳过: ${key}`);
            continue;
          }

          let configValue: string;
          let configType = existingConfig.config_type;

          if (typeof value === 'object' && value !== null) {
            configValue = JSON.stringify(value);
            configType = 'json';
          } else if (typeof value === 'boolean') {
            configValue = value.toString();
            configType = 'boolean';
          } else if (typeof value === 'number') {
            configValue = value.toString();
            configType = 'number';
          } else {
            configValue = String(value);
            configType = 'string';
          }

          await tx.system_config.update({
            where: { config_key: key },
            data: {
              config_value: configValue,
              config_type: configType,
              updated_at: new Date(),
            },
          });
        }
      });

      logger.info('系统设置更新成功');
    } catch (error) {
      logger.error('更新系统设置失败:', error);
      throw new Error('更新系统设置失败');
    }
  }

  /**
   * 重置系统设置为默认值
   */
  async resetSettings(): Promise<void> {
    try {
      const defaultSettings = [
        { key: 'site_name', value: '星潮设计', type: 'string', description: '网站名称' },
        { key: 'site_logo', value: '/logo.png', type: 'string', description: '网站Logo' },
        { key: 'site_favicon', value: '/favicon.ico', type: 'string', description: '网站Favicon' },
        { key: 'site_title', value: '星潮设计 - 优质设计资源分享平台', type: 'string', description: 'SEO标题' },
        { key: 'site_keywords', value: '设计资源,UI设计,平面设计,素材下载', type: 'string', description: 'SEO关键词' },
        { key: 'site_description', value: '星潮设计是一个专业的设计资源分享平台，提供海量优质设计素材', type: 'string', description: 'SEO描述' },
        { key: 'max_file_size', value: '1000', type: 'number', description: '最大文件大小(MB)' },
        { key: 'allowed_file_formats', value: 'jpg,jpeg,png,gif,svg,psd,ai,sketch,fig,pdf,zip,rar', type: 'string', description: '允许的文件格式' },
        { key: 'daily_download_limit', value: '10', type: 'number', description: '普通用户每日下载次数' },
        { key: 'watermark_text', value: '星潮设计', type: 'string', description: '水印文字' },
        { key: 'watermark_opacity', value: '0.6', type: 'number', description: '水印透明度' },
        { key: 'watermark_position', value: 'bottom-right', type: 'string', description: '水印位置' },
        { key: 'wechat_pay_enabled', value: 'true', type: 'boolean', description: '是否启用微信支付' },
        { key: 'alipay_enabled', value: 'true', type: 'boolean', description: '是否启用支付宝支付' },
        { key: 'points_recharge_enabled', value: 'true', type: 'boolean', description: '是否启用积分充值功能' },
        { key: 'vip_auto_renew_enabled', value: 'true', type: 'boolean', description: '是否启用VIP自动续费' },
      ];

      await prisma.$transaction(async (tx) => {
        for (const setting of defaultSettings) {
          await tx.system_config.upsert({
            where: { config_key: setting.key },
            update: {
              config_value: setting.value,
              config_type: setting.type,
              description: setting.description,
              updated_at: new Date(),
            },
            create: {
              config_key: setting.key,
              config_value: setting.value,
              config_type: setting.type,
              description: setting.description,
            },
          });
        }
      });

      logger.info('系统设置已重置为默认值');
    } catch (error) {
      logger.error('重置系统设置失败:', error);
      throw new Error('重置系统设置失败');
    }
  }
}

export const systemSettingsService = new SystemSettingsService();
export default systemSettingsService;
