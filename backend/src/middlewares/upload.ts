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

/**
 * 生成不冲突的文件名
 * 保留原始文件名，如果存在同名文件则添加序号 (1), (2) 等
 */
function getUniqueFilename(dir: string, originalName: string): string {
  // 解码文件名（处理中文等特殊字符，multer 使用 latin1 编码）
  let decodedName: string;
  try {
    decodedName = Buffer.from(originalName, 'latin1').toString('utf8');
  } catch {
    decodedName = originalName;
  }
  
  const ext = path.extname(decodedName);
  const basename = path.basename(decodedName, ext);
  
  let filename = decodedName;
  let counter = 1;
  
  // 检查文件是否存在，如果存在则添加序号
  while (fs.existsSync(path.join(dir, filename))) {
    filename = `${basename}(${counter})${ext}`;
    counter++;
  }
  
  return filename;
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 保留原始文件名，如果冲突则添加序号
    const uniqueFilename = getUniqueFilename(uploadDir, file.originalname);
    logger.info(`文件上传: 原始名称 "${file.originalname}" -> 保存为 "${uniqueFilename}"`);
    cb(null, uniqueFilename);
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
    'application/octet-stream', // 通用二进制类型（PSD、AI等文件可能被识别为此类型）
  ];

  // 允许的文件扩展名（用于 application/octet-stream 类型的额外验证）
  const allowedExtensions = [
    '.psd', '.ai', '.eps', '.cdr', '.sketch', '.xd', '.figma',
    '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp',
    '.pdf', '.zip', '.rar', '.7z'
  ];

  // 解码文件名
  let decodedName: string;
  try {
    decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
  } catch {
    decodedName = file.originalname;
  }
  const ext = path.extname(decodedName).toLowerCase();

  // 如果MIME类型在允许列表中
  if (allowedMimes.includes(file.mimetype)) {
    // 对于 application/octet-stream，需要额外检查扩展名
    if (file.mimetype === 'application/octet-stream') {
      if (allowedExtensions.includes(ext)) {
        logger.info(`文件类型验证通过: ${decodedName} (MIME: ${file.mimetype}, 扩展名: ${ext})`);
        cb(null, true);
      } else {
        cb(new Error(`不支持的文件扩展名: ${ext}`));
      }
    } else {
      cb(null, true);
    }
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
