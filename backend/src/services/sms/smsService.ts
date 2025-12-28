/**
 * 短信发送服务
 * 
 * 支持多种短信服务商：
 * - mock: 模拟模式，打印到控制台（开发环境）
 * - aliyun: 阿里云短信
 * - tencent: 腾讯云短信
 * - twilio: Twilio短信
 */

import { config } from '@/config/index.js';
import { logger } from '@/utils/logger.js';

/**
 * 短信发送结果
 */
export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * 短信服务接口
 */
export interface ISmsService {
  /**
   * 发送验证码短信
   * @param phone 手机号
   * @param code 验证码
   * @returns 发送结果
   */
  sendVerificationCode(phone: string, code: string): Promise<SmsSendResult>;
}

/**
 * 模拟短信服务（开发环境）
 * 将验证码打印到控制台
 */
class MockSmsService implements ISmsService {
  async sendVerificationCode(phone: string, code: string): Promise<SmsSendResult> {
    const maskedPhone = `${phone.slice(0, 3)}****${phone.slice(-4)}`;
    
    // 打印到控制台，方便开发测试
    // eslint-disable-next-line no-console
    console.log('\n');
    // eslint-disable-next-line no-console
    console.log('╔════════════════════════════════════════════════════════════╗');
    // eslint-disable-next-line no-console
    console.log('║                    📱 短信验证码（模拟）                    ║');
    // eslint-disable-next-line no-console
    console.log('╠════════════════════════════════════════════════════════════╣');
    // eslint-disable-next-line no-console
    console.log(`║  手机号: ${maskedPhone.padEnd(48)}║`);
    // eslint-disable-next-line no-console
    console.log(`║  验证码: ${code.padEnd(48)}║`);
    // eslint-disable-next-line no-console
    console.log(`║  有效期: 5分钟${' '.repeat(43)}║`);
    // eslint-disable-next-line no-console
    console.log('╠════════════════════════════════════════════════════════════╣');
    // eslint-disable-next-line no-console
    console.log('║  【星潮设计】您的注册验证码是：' + code + '，5分钟内有效，   ║');
    // eslint-disable-next-line no-console
    console.log('║  请勿泄露给他人。                                          ║');
    // eslint-disable-next-line no-console
    console.log('╚════════════════════════════════════════════════════════════╝');
    // eslint-disable-next-line no-console
    console.log('\n');
    
    logger.info(`[MockSmsService] 验证码已发送（模拟）: ${maskedPhone} -> ${code}`);
    
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
    };
  }
}

/**
 * 阿里云短信服务
 */
class AliyunSmsService implements ISmsService {
  async sendVerificationCode(phone: string, code: string): Promise<SmsSendResult> {
    const signName = config.sms.aliyun.signName;
    const templateCode = config.sms.aliyun.templateCode;
    const accessKeyId = config.sms.aliyun.accessKeyId;
    const accessKeySecret = config.sms.aliyun.accessKeySecret;

    if (!signName || !templateCode) {
      logger.error('[AliyunSmsService] 配置缺失：签名或模板CODE未配置');
      return {
        success: false,
        errorCode: 'SMS_CONFIG_ERROR',
        errorMessage: '短信服务配置错误',
      };
    }

    if (!accessKeyId || !accessKeySecret) {
      logger.error('[AliyunSmsService] 配置缺失：AccessKey未配置');
      return {
        success: false,
        errorCode: 'SMS_CONFIG_ERROR',
        errorMessage: '短信服务配置错误',
      };
    }

    try {
      // 动态导入阿里云SDK
      const Dysmsapi = await import('@alicloud/dysmsapi20170525');
      const OpenApi = await import('@alicloud/openapi-client');
      const Util = await import('@alicloud/tea-util');
      
      // 创建客户端配置
      const clientConfig = new OpenApi.Config({
        accessKeyId,
        accessKeySecret,
      });
      clientConfig.endpoint = 'dysmsapi.aliyuncs.com';
      
      // 创建客户端
      const client = new Dysmsapi.default(clientConfig);
      
      // 创建发送请求
      // 注意：阿里云模板变量要求code为纯数字字符串
      const templateParamStr = `{"code":"${code}"}`;
      logger.info(`[AliyunSmsService] 发送参数: phone=${phone}, templateParam=${templateParamStr}`);
      
      const sendSmsRequest = new Dysmsapi.SendSmsRequest({
        phoneNumbers: phone,
        signName: signName,
        templateCode: templateCode,
        templateParam: templateParamStr,
      });

      const runtime = new Util.RuntimeOptions({});
      
      const response = await client.sendSmsWithOptions(sendSmsRequest, runtime);
      
      const maskedPhone = `${phone.slice(0, 3)}****${phone.slice(-4)}`;
      
      if (response.body?.code === 'OK') {
        logger.info(`[AliyunSmsService] 短信发送成功: ${maskedPhone}, BizId: ${response.body.bizId}`);
        return {
          success: true,
          messageId: response.body.bizId,
        };
      } else {
        logger.error(`[AliyunSmsService] 短信发送失败: ${maskedPhone}, Code: ${response.body?.code}, Message: ${response.body?.message}`);
        return {
          success: false,
          errorCode: response.body?.code || 'UNKNOWN_ERROR',
          errorMessage: response.body?.message || '短信发送失败',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error(`[AliyunSmsService] 短信发送异常: ${errorMessage}`);
      return {
        success: false,
        errorCode: 'SMS_SEND_ERROR',
        errorMessage,
      };
    }
  }
}

/**
 * 腾讯云短信服务（预留接口）
 */
class TencentSmsService implements ISmsService {
  async sendVerificationCode(phone: string, code: string): Promise<SmsSendResult> {
    // TODO: 实现腾讯云短信发送
    // 需要安装 tencentcloud-sdk-nodejs 依赖
    logger.warn('[TencentSmsService] 腾讯云短信服务尚未实现，使用模拟模式');
    
    // 暂时使用模拟模式
    const mockService = new MockSmsService();
    return mockService.sendVerificationCode(phone, code);
  }
}

/**
 * Twilio短信服务（预留接口）
 */
class TwilioSmsService implements ISmsService {
  async sendVerificationCode(phone: string, code: string): Promise<SmsSendResult> {
    // TODO: 实现Twilio短信发送
    // 需要安装 twilio 依赖
    logger.warn('[TwilioSmsService] Twilio短信服务尚未实现，使用模拟模式');
    
    // 暂时使用模拟模式
    const mockService = new MockSmsService();
    return mockService.sendVerificationCode(phone, code);
  }
}

/**
 * 短信服务工厂
 * 根据SMS_PROVIDER环境变量创建对应的短信服务实例
 */
export function createSmsService(): ISmsService {
  const provider = config.sms.provider || 'mock';
  
  logger.info(`[SmsService] 使用短信服务商: ${provider}`);
  
  switch (provider.toLowerCase()) {
    case 'aliyun':
      return new AliyunSmsService();
    case 'tencent':
      return new TencentSmsService();
    case 'twilio':
      return new TwilioSmsService();
    case 'mock':
    default:
      return new MockSmsService();
  }
}

// 创建单例实例
let smsServiceInstance: ISmsService | null = null;

/**
 * 获取短信服务实例（单例）
 */
export function getSmsService(): ISmsService {
  if (!smsServiceInstance) {
    smsServiceInstance = createSmsService();
  }
  return smsServiceInstance;
}

/**
 * 发送验证码短信（便捷方法）
 * @param phone 手机号
 * @param code 验证码
 * @param retries 重试次数，默认2次
 */
export async function sendVerificationCode(
  phone: string,
  code: string,
  retries: number = 2
): Promise<SmsSendResult> {
  const service = getSmsService();
  let lastError: SmsSendResult | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await service.sendVerificationCode(phone, code);
      
      if (result.success) {
        return result;
      }
      
      lastError = result;
      
      // 如果不是最后一次尝试，等待后重试（指数退避）
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // 1秒, 2秒
        logger.warn(`[SmsService] 发送失败，${delay / 1000}秒后重试 (${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error(`[SmsService] 发送异常: ${errorMessage}`);
      lastError = {
        success: false,
        errorCode: 'SMS_004',
        errorMessage,
      };
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logger.error(`[SmsService] 发送失败，已重试${retries}次`);
  return lastError || {
    success: false,
    errorCode: 'SMS_004',
    errorMessage: '验证码发送失败',
  };
}

// 默认导出
export default {
  createSmsService,
  getSmsService,
  sendVerificationCode,
};
