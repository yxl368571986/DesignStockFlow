/**
 * URL处理工具模块
 * 提供图片URL、资源URL等处理功能
 */

/**
 * 获取 API 基础 URL（不含 /api/v1）
 * 用于拼接静态资源路径
 */
export function getApiBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  // 移除 /api/v1 后缀，获取服务器基础地址
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

/**
 * 根据字符串生成稳定的哈希数值
 * 用于生成一致的占位图ID
 */
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 生成稳定的占位图URL
 * 使用 picsum.photos 的 /id/ 端点，确保图片稳定不变
 * picsum.photos 有约1000张图片，ID范围 0-1084
 */
export function getStablePlaceholderUrl(resourceId: string, index: number = 0): string {
  const hash = hashCode(resourceId + '-' + index);
  const imageId = (hash % 1000) + 1; // 生成 1-1000 的图片ID
  return `https://picsum.photos/id/${imageId}/800/600`;
}

/**
 * 处理图片 URL
 * 将相对路径转换为完整 URL
 * 
 * 逻辑说明：
 * 1. url 是 /uploads/ 路径 → 真实上传的文件，拼接服务器地址
 * 2. url 是 https:// 开头 → 外部URL（如picsum），直接使用
 * 3. url 是 /files/ 路径 → 旧测试数据，文件不存在，使用占位图
 * 4. url 为空 → 使用占位图
 * 
 * @param url 图片URL（可能是相对路径或完整URL）
 * @param resourceId 资源ID（用于生成占位图）
 * @returns 完整的图片URL
 */
export function getFullImageUrl(url: string | null | undefined, resourceId?: string): string {
  const baseUrl = getApiBaseUrl();
  const fallbackId = resourceId || 'default';
  
  // 如果没有 URL，使用占位图
  if (!url || url.trim() === '') {
    return getStablePlaceholderUrl(fallbackId, 0);
  }
  
  // 如果是 /uploads/ 相对路径（真实上传的文件），拼接服务器地址
  if (url.startsWith('/uploads/')) {
    return `${baseUrl}${url}`;
  }
  
  // /files/ 路径是旧测试数据，文件不存在，使用占位图
  if (url.startsWith('/files/')) {
    return getStablePlaceholderUrl(fallbackId, 0);
  }
  
  // 如果已经是完整 URL（http/https），直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 其他相对路径，尝试拼接服务器地址
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  
  // 其他情况使用占位图
  return getStablePlaceholderUrl(fallbackId, 0);
}

/**
 * 判断是否为图片文件（通过扩展名或格式）
 */
export function isImageFormat(format: string | null | undefined): boolean {
  if (!format) return false;
  const imageFormats = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'BMP', 'IMAGE/JPEG', 'IMAGE/PNG', 'IMAGE/GIF', 'IMAGE/WEBP'];
  return imageFormats.includes(format.toUpperCase());
}

/**
 * 判断 URL 是否为占位图
 */
export function isPlaceholderUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  return url.includes('picsum.photos') || url.includes('placeholder');
}
