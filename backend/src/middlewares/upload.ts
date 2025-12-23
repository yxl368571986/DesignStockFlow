/**
 * 文件上传中间件
 */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '@/config/index.js';
import { logger } from '@/utils/logger.js';

// 确保上传目录存在
const uploadDir = config.upload.dir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`创建上传目录: ${uploadDir}`);
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳-随机数-原始文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许的文件类型
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/vnd.adobe.photoshop', // PSD
    'application/postscript', // AI
    'image/vnd.adobe.photoshop', // PSD
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`));
  }
};

// 创建multer实例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 最大文件大小
  },
});

// 单文件上传
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// 多文件上传
export const uploadMultiple = (fieldName: string, maxCount: number) =>
  upload.array(fieldName, maxCount);

// 多字段上传
export const uploadFields = (fields: { name: string; maxCount: number }[]) =>
  upload.fields(fields);

export default upload;
