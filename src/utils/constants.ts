/**
 * 全局常量定义
 */

// 支持的文件格式
export const SUPPORTED_FORMATS = [
  'PSD',
  'AI',
  'CDR',
  'EPS',
  'SKETCH',
  'XD',
  'FIGMA',
  'SVG',
  'PNG',
  'JPG',
  'JPEG',
  'WEBP'
] as const;

// 文件格式对应的MIME类型
export const MIME_TYPES: Record<string, string[]> = {
  PSD: ['image/vnd.adobe.photoshop', 'application/x-photoshop'],
  AI: ['application/postscript', 'application/illustrator'],
  CDR: ['application/cdr', 'application/x-cdr'],
  EPS: ['application/postscript'],
  SKETCH: ['application/sketch'],
  XD: ['application/vnd.adobe.xd'],
  FIGMA: ['application/figma'],
  SVG: ['image/svg+xml'],
  PNG: ['image/png'],
  JPG: ['image/jpeg'],
  JPEG: ['image/jpeg'],
  WEBP: ['image/webp']
};

// 文件大小限制（字节）
export const MAX_FILE_SIZE = 1000 * 1024 * 1024; // 1000MB
export const CHUNK_THRESHOLD = 100 * 1024 * 1024; // 100MB，超过此大小使用分片上传
export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB每片

// VIP等级
export const VIP_LEVELS = {
  FREE: 0,
  MONTHLY: 1,
  QUARTERLY: 2,
  YEARLY: 3
} as const;

// 审核状态
export const AUDIT_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
} as const;

// 缓存时间（毫秒）
export const CACHE_TIME = {
  BANNER: 5 * 60 * 1000, // 轮播图5分钟
  CONFIG: 30 * 60 * 1000, // 配置30分钟
  CATEGORY: 10 * 60 * 1000, // 分类10分钟
  RESOURCE: 5 * 60 * 1000 // 资源列表5分钟
} as const;

// API超时时间（毫秒）
export const REQUEST_TIMEOUT = 10000; // 10秒

// 防抖延迟（毫秒）
export const DEBOUNCE_DELAY = 300;

// 品牌色
export const BRAND_COLORS = {
  PRIMARY: '#165DFF',
  SECONDARY: '#FF7D00',
  PRIMARY_LIGHT: '#4080FF',
  PRIMARY_DARK: '#0E42D2',
  SECONDARY_LIGHT: '#FFA940',
  SECONDARY_DARK: '#D66A00'
} as const;
