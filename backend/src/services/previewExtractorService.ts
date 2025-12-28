/**
 * 预览图提取服务
 * 负责从不同格式的文件中提取或生成预览图
 */
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger.js';

// ag-psd 库用于解析 PSD 文件
import { readPsd, Psd, initializeCanvas } from 'ag-psd';

// Canvas 类型声明（用于 Node.js 环境）
type CanvasType = {
  toBuffer(mimeType: string): Buffer;
};

/**
 * 支持的图片格式 MIME 类型
 */
const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
];

/**
 * 支持的图片文件扩展名
 */
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

/**
 * PSD 文件扩展名
 */
const PSD_EXTENSIONS = ['.psd'];

/**
 * 预览图提取结果
 */
export interface PreviewExtractionResult {
  /** 封面图 URL（相对路径） */
  cover: string | null;
  /** 预览图 URL 数组（相对路径） */
  previewImages: string[];
  /** 是否成功提取 */
  success: boolean;
  /** 错误信息（如果有） */
  error?: string;
}

/**
 * 预览图提取服务类
 */
class PreviewExtractorService {
  /** 预览图保存目录 */
  private previewDir: string;
  /** canvas 是否已初始化 */
  private canvasInitialized: boolean = false;

  constructor() {
    this.previewDir = './uploads/previews';
    this.ensurePreviewDir();
  }

  /**
   * 确保预览图目录存在
   */
  private async ensurePreviewDir(): Promise<void> {
    try {
      await fs.promises.mkdir(this.previewDir, { recursive: true });
    } catch (error) {
      logger.error('创建预览图目录失败:', error);
    }
  }

  /**
   * 初始化 canvas（用于 PSD 解析）
   * 在 Node.js 环境中需要使用 canvas 库
   */
  private async initCanvas(): Promise<boolean> {
    if (this.canvasInitialized) {
      return true;
    }

    try {
      // 尝试动态导入 canvas 库（可选依赖）
      // @ts-expect-error - dynamic import for optional canvas module
      const canvasModule = await import('canvas');
      const { createCanvas, Image } = canvasModule;
      
      // 初始化 ag-psd 的 canvas
      initializeCanvas(createCanvas, Image);
      this.canvasInitialized = true;
      logger.info('Canvas 初始化成功，PSD 预览图提取功能可用');
      return true;
    } catch (error) {
      logger.warn('Canvas 库未安装或初始化失败，PSD 预览图提取功能不可用');
      logger.warn('如需 PSD 预览功能，请安装 canvas 库: npm install canvas');
      logger.warn('Windows 用户可能需要先安装 GTK 依赖');
      return false;
    }
  }

  /**
   * 判断文件是否为图片格式（通过 MIME 类型）
   */
  isImageByMimeType(mimeType: string): boolean {
    return IMAGE_MIME_TYPES.includes(mimeType.toLowerCase());
  }

  /**
   * 判断文件是否为图片格式（通过扩展名）
   */
  isImageByExtension(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
  }

  /**
   * 判断文件是否为 PSD 格式
   */
  isPsdFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return PSD_EXTENSIONS.includes(ext);
  }


  /**
   * 从文件中提取预览图
   * @param filePath 文件的完整路径
   * @param fileUrl 文件的 URL 路径（用于图片文件直接返回）
   * @param originalName 原始文件名
   * @param mimeType 文件 MIME 类型
   * @returns 预览图提取结果
   */
  async extractPreview(
    filePath: string,
    fileUrl: string,
    originalName: string,
    mimeType: string
  ): Promise<PreviewExtractionResult> {
    try {
      // 1. 图片文件：直接使用原图
      if (this.isImageByMimeType(mimeType) || this.isImageByExtension(originalName)) {
        logger.info(`图片文件直接作为预览图: ${originalName}`);
        return {
          cover: fileUrl,
          previewImages: [fileUrl],
          success: true,
        };
      }

      // 2. PSD 文件：解析并生成预览图
      if (this.isPsdFile(originalName)) {
        return await this.extractPsdPreview(filePath, originalName);
      }

      // 3. 其他格式：不自动提取，返回空
      logger.info(`不支持自动提取预览图的格式: ${originalName}`);
      return {
        cover: null,
        previewImages: [],
        success: true,
        error: '该格式不支持自动提取预览图，请手动上传预览图',
      };
    } catch (error) {
      logger.error(`提取预览图失败: ${originalName}`, error);
      return {
        cover: null,
        previewImages: [],
        success: false,
        error: error instanceof Error ? error.message : '提取预览图失败',
      };
    }
  }

  /**
   * 从 PSD 文件提取预览图
   * @param filePath PSD 文件路径
   * @param originalName 原始文件名
   * @returns 预览图提取结果
   */
  private async extractPsdPreview(
    filePath: string,
    originalName: string
  ): Promise<PreviewExtractionResult> {
    try {
      logger.info(`开始解析 PSD 文件: ${originalName}`);

      // 初始化 canvas
      const canvasReady = await this.initCanvas();
      if (!canvasReady) {
        return {
          cover: null,
          previewImages: [],
          success: false,
          error: 'PSD 解析需要 canvas 库，请安装: npm install canvas',
        };
      }

      // 读取 PSD 文件
      const buffer = await fs.promises.readFile(filePath);
      
      // 解析 PSD
      const psd: Psd = readPsd(buffer, {
        skipLayerImageData: true, // 跳过图层数据以提高性能
        skipThumbnail: false,     // 保留缩略图
      });

      // 检查是否有合成图像
      if (!psd.canvas) {
        logger.warn(`PSD 文件没有合成图像: ${originalName}`);
        return {
          cover: null,
          previewImages: [],
          success: false,
          error: 'PSD 文件没有合成图像，无法生成预览',
        };
      }

      // 生成预览图文件名
      const previewId = uuidv4();
      const previewFileName = `${previewId}.png`;
      const previewPath = path.join(this.previewDir, previewFileName);

      // 确保目录存在
      await fs.promises.mkdir(this.previewDir, { recursive: true });

      // 将 canvas 转换为 PNG buffer 并保存
      const canvas = psd.canvas as CanvasType;
      const pngBuffer = canvas.toBuffer('image/png');
      await fs.promises.writeFile(previewPath, pngBuffer);

      // 构建预览图 URL
      const previewUrl = `/uploads/previews/${previewFileName}`;

      logger.info(`PSD 预览图生成成功: ${previewUrl}`);

      return {
        cover: previewUrl,
        previewImages: [previewUrl],
        success: true,
      };
    } catch (error) {
      logger.error(`解析 PSD 文件失败: ${originalName}`, error);
      return {
        cover: null,
        previewImages: [],
        success: false,
        error: error instanceof Error ? error.message : 'PSD 解析失败',
      };
    }
  }

  /**
   * 批量处理多个预览图文件
   * 用于用户手动上传的预览图
   * @param previewFiles 预览图文件数组
   * @returns 预览图 URL 数组
   */
  processUploadedPreviews(previewFiles: Express.Multer.File[]): string[] {
    return previewFiles.map(file => `/uploads/${file.filename}`);
  }

  /**
   * 获取文件格式的友好名称
   * @param filename 文件名
   * @param mimeType MIME 类型
   * @returns 格式名称
   */
  getFileFormat(filename: string, mimeType: string): string {
    const ext = path.extname(filename).replace('.', '').toUpperCase();
    if (ext) {
      return ext;
    }
    // 从 MIME 类型推断
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'JPG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/webp': 'WEBP',
      'application/postscript': 'AI',
      'application/pdf': 'PDF',
    };
    return mimeMap[mimeType] || mimeType;
  }
}

// 导出单例
export const previewExtractorService = new PreviewExtractorService();
export default previewExtractorService;
