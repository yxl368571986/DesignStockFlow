/**
 * 环境变量工具函数
 * 提供类型安全的环境变量访问和验证
 */

/**
 * 获取字符串类型的环境变量
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 环境变量值
 */
export function getEnvString(key: keyof ImportMetaEnv, defaultValue = ''): string {
  return import.meta.env[key] || defaultValue;
}

/**
 * 获取数字类型的环境变量
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 环境变量值（数字）
 */
export function getEnvNumber(key: keyof ImportMetaEnv, defaultValue = 0): number {
  const value = import.meta.env[key];
  if (!value) return defaultValue;
  
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 获取布尔类型的环境变量
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 环境变量值（布尔）
 */
export function getEnvBoolean(key: keyof ImportMetaEnv, defaultValue = false): boolean {
  const value = import.meta.env[key];
  if (!value) return defaultValue;
  
  return value === 'true' || value === '1';
}

/**
 * 获取数组类型的环境变量（逗号分隔）
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 环境变量值（数组）
 */
export function getEnvArray(key: keyof ImportMetaEnv, defaultValue: string[] = []): string[] {
  const value = import.meta.env[key];
  if (!value) return defaultValue;
  
  return value.split(',').map((item: string) => item.trim()).filter(Boolean);
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return import.meta.env.MODE === 'development' || import.meta.env.DEV;
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return import.meta.env.MODE === 'production' || import.meta.env.PROD;
}

/**
 * 获取应用配置
 */
export function getAppConfig() {
  return {
    title: getEnvString('VITE_APP_TITLE', '星潮设计'),
    version: getEnvString('VITE_APP_VERSION', '1.0.0'),
    env: getEnvString('VITE_APP_ENV', 'development'),
    isDev: isDevelopment(),
    isProd: isProduction()
  };
}

/**
 * 获取API配置
 */
export function getApiConfig() {
  return {
    baseURL: getEnvString('VITE_API_BASE_URL', '/api'),
    timeout: getEnvNumber('VITE_API_TIMEOUT', 10000)
  };
}

/**
 * 获取CDN配置
 */
export function getCdnConfig() {
  return {
    baseURL: getEnvString('VITE_CDN_BASE_URL', ''),
    imageURL: getEnvString('VITE_IMAGE_CDN_URL', getEnvString('VITE_CDN_BASE_URL', ''))
  };
}

/**
 * 获取上传配置
 */
export function getUploadConfig() {
  return {
    maxFileSize: getEnvNumber('VITE_MAX_FILE_SIZE', 1048576000), // 1000MB
    chunkSize: getEnvNumber('VITE_CHUNK_SIZE', 10485760), // 10MB
    chunkThreshold: getEnvNumber('VITE_CHUNK_THRESHOLD', 104857600), // 100MB
    allowedTypes: getEnvArray('VITE_ALLOWED_FILE_TYPES', [
      'PSD', 'AI', 'CDR', 'EPS', 'SKETCH', 'XD', 'FIGMA', 'SVG', 'PNG', 'JPG', 'JPEG', 'WEBP'
    ])
  };
}

/**
 * 获取功能开关配置
 */
export function getFeatureConfig() {
  return {
    enableMock: getEnvBoolean('VITE_ENABLE_MOCK', false),
    enablePWA: getEnvBoolean('VITE_ENABLE_PWA', false),
    enableDebug: getEnvBoolean('VITE_ENABLE_DEBUG', isDevelopment()),
    enablePerformance: getEnvBoolean('VITE_ENABLE_PERFORMANCE', true),
    enableErrorTracking: getEnvBoolean('VITE_ENABLE_ERROR_TRACKING', true)
  };
}

/**
 * 获取安全配置
 */
export function getSecurityConfig() {
  return {
    allowedOrigins: getEnvArray('VITE_ALLOWED_ORIGINS', []),
    tokenStorage: getEnvString('VITE_TOKEN_STORAGE', 'cookie') as 'cookie' | 'localStorage',
    tokenExpireDays: getEnvNumber('VITE_TOKEN_EXPIRE_DAYS', 7)
  };
}

/**
 * 获取缓存配置
 */
export function getCacheConfig() {
  return {
    resourceList: getEnvNumber('VITE_CACHE_RESOURCE_LIST', 5), // 分钟
    siteConfig: getEnvNumber('VITE_CACHE_SITE_CONFIG', 30), // 分钟
    categories: getEnvNumber('VITE_CACHE_CATEGORIES', 10) // 分钟
  };
}

/**
 * 获取第三方服务配置
 */
export function getThirdPartyConfig() {
  return {
    wechatAppId: getEnvString('VITE_WECHAT_APP_ID', ''),
    alipayAppId: getEnvString('VITE_ALIPAY_APP_ID', '')
  };
}

/**
 * 获取日志配置
 */
export function getLogConfig() {
  return {
    level: getEnvString('VITE_LOG_LEVEL', 'debug') as 'debug' | 'info' | 'warn' | 'error',
    report: getEnvBoolean('VITE_LOG_REPORT', false),
    reportURL: getEnvString('VITE_LOG_REPORT_URL', '')
  };
}

/**
 * 验证必需的环境变量是否已配置
 * @throws Error 如果缺少必需的环境变量
 */
export function validateEnv(): void {
  const requiredEnvVars: Array<keyof ImportMetaEnv> = [
    'VITE_APP_TITLE',
    'VITE_API_BASE_URL',
    'VITE_CDN_BASE_URL'
  ];

  const missingVars = requiredEnvVars.filter(key => !import.meta.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `缺少必需的环境变量: ${missingVars.join(', ')}\n` +
      '请检查 .env.development 或 .env.production 文件'
    );
  }
}

/**
 * 打印环境变量配置（仅开发环境）
 */
export function printEnvConfig(): void {
  if (!isDevelopment()) return;

  console.group('🔧 环境变量配置');
  console.log('应用配置:', getAppConfig());
  console.log('API配置:', getApiConfig());
  console.log('CDN配置:', getCdnConfig());
  console.log('上传配置:', getUploadConfig());
  console.log('功能开关:', getFeatureConfig());
  console.log('安全配置:', getSecurityConfig());
  console.log('缓存配置:', getCacheConfig());
  console.log('第三方服务:', getThirdPartyConfig());
  console.log('日志配置:', getLogConfig());
  console.groupEnd();
}

// 导出所有配置的统一接口
export const ENV_CONFIG = {
  app: getAppConfig(),
  api: getApiConfig(),
  cdn: getCdnConfig(),
  upload: getUploadConfig(),
  feature: getFeatureConfig(),
  security: getSecurityConfig(),
  cache: getCacheConfig(),
  thirdParty: getThirdPartyConfig(),
  log: getLogConfig()
};
