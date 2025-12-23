/**
 * 图片优化工具函数
 *
 * 功能：
 * - 图片压缩（Canvas压缩）
 * - 响应式图片URL生成
 * - WebP格式支持检测
 * - CDN URL生成
 * - 图片尺寸计算
 *
 * 需求: 性能优化（图片优化）
 */

/**
 * 图片压缩选项
 */
export interface ImageCompressOptions {
  /** 目标宽度 */
  maxWidth?: number;
  /** 目标高度 */
  maxHeight?: number;
  /** 压缩质量 0-1 */
  quality?: number;
  /** 输出格式 */
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  /** 是否保持宽高比 */
  maintainAspectRatio?: boolean;
}

/**
 * 使用Canvas压缩图片
 */
export async function compressImage(file: File, options: ImageCompressOptions = {}): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    mimeType = 'image/jpeg',
    maintainAspectRatio = true
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // 计算目标尺寸
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (maintainAspectRatio) {
          // 保持宽高比
          if (img.width > maxWidth || img.height > maxHeight) {
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            targetWidth = Math.floor(img.width * ratio);
            targetHeight = Math.floor(img.height * ratio);
          }
        } else {
          // 不保持宽高比
          targetWidth = Math.min(img.width, maxWidth);
          targetHeight = Math.min(img.height, maxHeight);
        }

        // 创建Canvas
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 批量压缩图片
 */
export async function compressImages(
  files: File[],
  options: ImageCompressOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> {
  const results: Blob[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    try {
      const compressed = await compressImage(files[i], options);
      results.push(compressed);
      onProgress?.(i + 1, total);
    } catch (error) {
      console.error(`Failed to compress image ${i}:`, error);
      // 如果压缩失败，使用原文件
      results.push(files[i]);
      onProgress?.(i + 1, total);
    }
  }

  return results;
}

/**
 * 检测浏览器是否支持WebP格式
 */
let webpSupported: boolean | null = null;

export async function checkWebPSupport(): Promise<boolean> {
  if (webpSupported !== null) {
    return webpSupported;
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      webpSupported = img.width > 0 && img.height > 0;
      resolve(webpSupported);
    };

    img.onerror = () => {
      webpSupported = false;
      resolve(false);
    };

    // 1x1像素的WebP图片
    img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
  });
}

/**
 * 同步检测WebP支持（使用缓存结果）
 */
export function isWebPSupported(): boolean {
  return webpSupported ?? false;
}

/**
 * CDN配置
 */
const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.startide-design.com';

/**
 * 响应式图片尺寸配置
 */
export const IMAGE_SIZES = {
  thumbnail: 200, // 缩略图
  small: 400, // 小图
  medium: 800, // 中图
  large: 1200, // 大图
  xlarge: 1920 // 超大图
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

/**
 * 生成CDN图片URL
 */
export function getCDNImageUrl(
  path: string,
  options?: {
    size?: ImageSize;
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  }
): string {
  if (!path) {
    return '';
  }

  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 移除开头的斜杠
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // 构建基础URL
  let url = `${CDN_BASE_URL}/${cleanPath}`;

  // 如果没有指定任何选项，直接返回
  if (!options) {
    return url;
  }

  // 构建查询参数（假设CDN支持图片处理参数）
  const params: string[] = [];

  if (options.size) {
    const width = IMAGE_SIZES[options.size];
    params.push(`w=${width}`);
  } else if (options.width) {
    params.push(`w=${options.width}`);
  }

  if (options.height) {
    params.push(`h=${options.height}`);
  }

  if (options.quality) {
    params.push(`q=${options.quality}`);
  }

  if (options.format) {
    params.push(`f=${options.format}`);
  }

  // 如果有参数，添加到URL
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }

  return url;
}

/**
 * 生成响应式图片srcset
 */
export function generateSrcSet(
  path: string,
  sizes: ImageSize[] = ['small', 'medium', 'large'],
  format?: 'webp' | 'jpg' | 'png'
): string {
  return sizes
    .map((size) => {
      const width = IMAGE_SIZES[size];
      const url = getCDNImageUrl(path, { width, format });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * 生成响应式图片sizes属性
 */
export function generateSizes(breakpoints?: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}): string {
  const { mobile = '100vw', tablet = '50vw', desktop = '33vw' } = breakpoints || {};

  return [`(max-width: 768px) ${mobile}`, `(max-width: 1200px) ${tablet}`, desktop].join(', ');
}

/**
 * 获取优化后的图片URL（自动选择WebP）
 */
export function getOptimizedImageUrl(path: string, size?: ImageSize, quality: number = 80): string {
  const format = isWebPSupported() ? 'webp' : 'jpg';
  return getCDNImageUrl(path, { size, quality, format });
}

/**
 * 计算图片显示尺寸
 */
export function calculateImageSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight, 1);

  return {
    width: Math.floor(originalWidth * ratio),
    height: Math.floor(originalHeight * ratio)
  };
}

/**
 * 预加载图片（内部使用）
 */
function preloadImageInternal(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 批量预加载图片（内部使用）
 */
async function preloadImagesInternal(
  srcs: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  let loaded = 0;
  const total = srcs.length;

  const promises = srcs.map(async (src) => {
    try {
      await preloadImageInternal(src);
      loaded++;
      onProgress?.(loaded, total);
    } catch (error) {
      console.error(`Failed to preload image: ${src}`, error);
      loaded++;
      onProgress?.(loaded, total);
    }
  });

  await Promise.all(promises);
}

/**
 * 获取图片元信息
 */
export function getImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 转换图片格式
 */
export async function convertImageFormat(
  file: File,
  targetFormat: 'image/jpeg' | 'image/png' | 'image/webp',
  quality: number = 0.9
): Promise<Blob> {
  return compressImage(file, {
    mimeType: targetFormat,
    quality,
    maxWidth: 4096,
    maxHeight: 4096
  });
}

/**
 * 生成缩略图
 */
export async function generateThumbnail(
  file: File,
  size: number = 200,
  quality: number = 0.7
): Promise<Blob> {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality,
    mimeType: 'image/jpeg'
  });
}

/**
 * 初始化图片优化（检测WebP支持）
 */
export async function initImageOptimization(): Promise<void> {
  await checkWebPSupport();
  console.log('WebP support:', isWebPSupported());
}

/**
 * 预加载图片（导出版本，避免与performance.ts冲突）
 */
export function preloadOptimizedImage(src: string): Promise<void> {
  return preloadImageInternal(src);
}

/**
 * 批量预加载图片（导出版本，避免与performance.ts冲突）
 */
export async function preloadOptimizedImages(
  srcs: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  return preloadImagesInternal(srcs, onProgress);
}
