/**
 * 环境变量类型定义
 * 为 import.meta.env 提供TypeScript类型支持
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // ============================================
  // 应用基础配置
  // ============================================
  /** 应用标题 */
  readonly VITE_APP_TITLE: string;
  
  /** 应用版本号 */
  readonly VITE_APP_VERSION: string;
  
  /** 运行环境标识 */
  readonly VITE_APP_ENV: 'development' | 'production' | 'staging';

  // ============================================
  // API配置
  // ============================================
  /** API基础URL */
  readonly VITE_API_BASE_URL: string;
  
  /** API请求超时时间（毫秒） */
  readonly VITE_API_TIMEOUT: string;

  // ============================================
  // CDN配置
  // ============================================
  /** CDN基础URL */
  readonly VITE_CDN_BASE_URL: string;
  
  /** 图片CDN地址 */
  readonly VITE_IMAGE_CDN_URL?: string;

  // ============================================
  // 文件上传配置
  // ============================================
  /** 单个文件最大大小（字节） */
  readonly VITE_MAX_FILE_SIZE: string;
  
  /** 分片上传的分片大小（字节） */
  readonly VITE_CHUNK_SIZE: string;
  
  /** 分片上传阈值（字节） */
  readonly VITE_CHUNK_THRESHOLD: string;
  
  /** 支持的文件格式 */
  readonly VITE_ALLOWED_FILE_TYPES: string;

  // ============================================
  // 功能开关
  // ============================================
  /** 是否启用Mock数据 */
  readonly VITE_ENABLE_MOCK: string;
  
  /** 是否启用PWA功能 */
  readonly VITE_ENABLE_PWA: string;
  
  /** 是否启用调试模式 */
  readonly VITE_ENABLE_DEBUG: string;
  
  /** 是否显示性能监控 */
  readonly VITE_ENABLE_PERFORMANCE: string;
  
  /** 是否启用错误追踪 */
  readonly VITE_ENABLE_ERROR_TRACKING: string;

  // ============================================
  // 安全配置
  // ============================================
  /** CSRF防护 - 允许的请求来源 */
  readonly VITE_ALLOWED_ORIGINS: string;
  
  /** Token存储方式 */
  readonly VITE_TOKEN_STORAGE: 'cookie' | 'localStorage';
  
  /** Token过期时间（天） */
  readonly VITE_TOKEN_EXPIRE_DAYS: string;

  // ============================================
  // 缓存配置
  // ============================================
  /** 资源列表缓存时间（分钟） */
  readonly VITE_CACHE_RESOURCE_LIST: string;
  
  /** 网站配置缓存时间（分钟） */
  readonly VITE_CACHE_SITE_CONFIG: string;
  
  /** 分类列表缓存时间（分钟） */
  readonly VITE_CACHE_CATEGORIES: string;

  // ============================================
  // 第三方服务配置
  // ============================================
  /** 微信登录AppID */
  readonly VITE_WECHAT_APP_ID?: string;
  
  /** 支付宝AppID */
  readonly VITE_ALIPAY_APP_ID?: string;

  // ============================================
  // 日志配置
  // ============================================
  /** 日志级别 */
  readonly VITE_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  
  /** 是否上报日志到服务器 */
  readonly VITE_LOG_REPORT: string;
  
  /** 日志上报地址 */
  readonly VITE_LOG_REPORT_URL?: string;

  // ============================================
  // 监控配置
  // ============================================
  /** 监控日志上报接口 */
  readonly VITE_MONITOR_URL?: string;
  
  /** 是否在开发环境启用监控 */
  readonly VITE_ENABLE_MONITOR_IN_DEV?: string;
  
  /** 监控采样率（0-1） */
  readonly VITE_MONITOR_SAMPLE_RATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
