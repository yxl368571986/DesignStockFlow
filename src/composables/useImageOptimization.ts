/**
 * 图片优化 Composable
 *
 * 功能：
 * - 图片压缩
 * - 响应式图片URL生成
 * - WebP格式支持
 * - 批量图片处理
 *
 * 需求: 性能优化（图片优化）
 */

import { ref, computed } from 'vue';
import {
  compressImage,
  compressImages,
  isWebPSupported,
  getCDNImageUrl,
  generateSrcSet,
  generateSizes,
  getOptimizedImageUrl,
  getImageMetadata,
  generateThumbnail,
  type ImageCompressOptions,
  type ImageSize
} from '@/utils/imageOptimization';

/**
 * 图片优化 Composable
 */
export function useImageOptimization() {
  // 状态
  const isCompressing = ref(false);
  const compressProgress = ref(0);
  const error = ref<string | null>(null);

  // 计算属性：是否支持WebP
  const supportsWebP = computed(() => isWebPSupported());

  /**
   * 压缩单张图片
   */
  async function compress(file: File, options?: ImageCompressOptions): Promise<Blob | null> {
    isCompressing.value = true;
    error.value = null;

    try {
      const compressed = await compressImage(file, options);
      return compressed;
    } catch (e) {
      error.value = (e as Error).message;
      console.error('Failed to compress image:', e);
      return null;
    } finally {
      isCompressing.value = false;
    }
  }

  /**
   * 批量压缩图片
   */
  async function compressBatch(files: File[], options?: ImageCompressOptions): Promise<Blob[]> {
    isCompressing.value = true;
    error.value = null;
    compressProgress.value = 0;

    try {
      const compressed = await compressImages(files, options, (current, total) => {
        compressProgress.value = Math.floor((current / total) * 100);
      });
      return compressed;
    } catch (e) {
      error.value = (e as Error).message;
      console.error('Failed to compress images:', e);
      return [];
    } finally {
      isCompressing.value = false;
      compressProgress.value = 0;
    }
  }

  /**
   * 生成缩略图
   */
  async function createThumbnail(file: File, size: number = 200): Promise<Blob | null> {
    try {
      return await generateThumbnail(file, size);
    } catch (e) {
      error.value = (e as Error).message;
      console.error('Failed to generate thumbnail:', e);
      return null;
    }
  }

  /**
   * 获取图片元信息
   */
  async function getMetadata(file: File) {
    try {
      return await getImageMetadata(file);
    } catch (e) {
      error.value = (e as Error).message;
      console.error('Failed to get image metadata:', e);
      return null;
    }
  }

  /**
   * 获取优化后的图片URL
   */
  function getOptimizedUrl(path: string, size?: ImageSize, quality?: number): string {
    return getOptimizedImageUrl(path, size, quality);
  }

  /**
   * 获取CDN图片URL
   */
  function getCDNUrl(
    path: string,
    options?: {
      size?: ImageSize;
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpg' | 'png';
    }
  ): string {
    return getCDNImageUrl(path, options);
  }

  /**
   * 生成响应式图片srcset
   */
  function getSrcSet(path: string, sizes?: ImageSize[], format?: 'webp' | 'jpg' | 'png'): string {
    return generateSrcSet(path, sizes, format);
  }

  /**
   * 生成响应式图片sizes属性
   */
  function getSizes(breakpoints?: { mobile?: string; tablet?: string; desktop?: string }): string {
    return generateSizes(breakpoints);
  }

  /**
   * 重置状态
   */
  function reset() {
    isCompressing.value = false;
    compressProgress.value = 0;
    error.value = null;
  }

  return {
    // 状态
    isCompressing,
    compressProgress,
    error,
    supportsWebP,

    // 方法
    compress,
    compressBatch,
    createThumbnail,
    getMetadata,
    getOptimizedUrl,
    getCDNUrl,
    getSrcSet,
    getSizes,
    reset
  };
}

/**
 * 图片预加载 Composable
 */
export function useImagePreload() {
  const isPreloading = ref(false);
  const preloadProgress = ref(0);
  const preloadedImages = ref<Set<string>>(new Set());

  /**
   * 预加载单张图片
   */
  async function preload(src: string): Promise<boolean> {
    if (preloadedImages.value.has(src)) {
      return true;
    }

    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        preloadedImages.value.add(src);
        resolve(true);
      };

      img.onerror = () => {
        console.error(`Failed to preload image: ${src}`);
        resolve(false);
      };

      img.src = src;
    });
  }

  /**
   * 批量预加载图片
   */
  async function preloadBatch(srcs: string[]): Promise<void> {
    isPreloading.value = true;
    preloadProgress.value = 0;

    let loaded = 0;
    const total = srcs.length;

    const promises = srcs.map(async (src) => {
      const success = await preload(src);
      loaded++;
      preloadProgress.value = Math.floor((loaded / total) * 100);
      return success;
    });

    await Promise.all(promises);
    isPreloading.value = false;
    preloadProgress.value = 0;
  }

  /**
   * 检查图片是否已预加载
   */
  function isPreloaded(src: string): boolean {
    return preloadedImages.value.has(src);
  }

  /**
   * 清除预加载缓存
   */
  function clearCache() {
    preloadedImages.value.clear();
  }

  return {
    isPreloading,
    preloadProgress,
    preload,
    preloadBatch,
    isPreloaded,
    clearCache
  };
}
