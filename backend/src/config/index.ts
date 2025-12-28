import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * 应用配置
 */
export const config = {
  // 服务器配置
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8080', 10),
    host: process.env.HOST || '0.0.0.0',
  },

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // JWT配置
  jwt: {
    secret: (process.env.JWT_SECRET || 'default-secret-change-in-production') as string,
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as string,
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // 文件存储配置
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '1048576000', 10), // 1000MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || '').split(','),
  },

  // 阿里云OSS配置
  oss: {
    region: process.env.OSS_REGION || '',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.OSS_BUCKET || '',
    endpoint: process.env.OSS_ENDPOINT || '',
  },

  // 微信支付配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    mchId: process.env.WECHAT_MCH_ID || '',
    apiKey: process.env.WECHAT_API_KEY || '',
    certPath: process.env.WECHAT_CERT_PATH || '',
    keyPath: process.env.WECHAT_KEY_PATH || '',
  },

  // 支付宝支付配置
  alipay: {
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
  },

  // 短信服务配置
  sms: {
    provider: process.env.SMS_PROVIDER || 'mock',
    accessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || '',
    signName: process.env.SMS_SIGN_NAME || '星潮设计',
    templateCode: process.env.SMS_TEMPLATE_CODE || '',
    
    // 阿里云短信配置
    aliyun: {
      accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || '',
      signName: process.env.ALIYUN_SMS_SIGN_NAME || '星潮设计',
      templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || '',
    },
    
    // 腾讯云短信配置
    tencent: {
      secretId: process.env.TENCENT_SMS_SECRET_ID || '',
      secretKey: process.env.TENCENT_SMS_SECRET_KEY || '',
      signName: process.env.TENCENT_SMS_SIGN_NAME || '星潮设计',
      templateId: process.env.TENCENT_SMS_TEMPLATE_ID || '',
      appId: process.env.TENCENT_SMS_APP_ID || '',
    },
    
    // Twilio短信配置
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
  },

  // 邮件服务配置
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },

  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  // 限流配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分钟
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // 系统配置
  site: {
    name: process.env.SITE_NAME || '星潮设计',
    url: process.env.SITE_URL || 'http://localhost:5173',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  },

  // 审核模式配置
  audit: {
    mode: (process.env.AUDIT_MODE as 'production' | 'development') || 'production',
  },
};

export default config;
