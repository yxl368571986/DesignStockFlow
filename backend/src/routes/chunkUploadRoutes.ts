/**
 * 分片上传路由
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  initUpload,
  uploadChunkHandler,
  getChunks,
  completeUpload,
  cancelUpload,
} from '../controllers/chunkUploadController.js';
import { uploadSingle } from '../middlewares/upload.js';
import { authenticate } from '../middlewares/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// 配置 multer 用于接收分片数据
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 单个分片最大 10MB
  },
});

/**
 * 上传单张图片（用于轮播图、头像等）
 * POST /api/v1/upload/image
 */
router.post('/image', authenticate, uploadSingle('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        msg: '请选择要上传的图片',
        data: null
      });
    }

    // 构建图片URL
    const imageUrl = `/uploads/${req.file.filename}`;
    
    logger.info(`图片上传成功: ${req.file.filename}, 大小: ${req.file.size} bytes`);

    res.json({
      code: 200,
      msg: '上传成功',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    logger.error('图片上传失败:', error);
    res.status(500).json({
      code: 500,
      msg: '图片上传失败',
      data: null
    });
  }
});

// 初始化分片上传
router.post('/init', initUpload);

// 上传分片
router.post('/chunk', upload.single('chunk'), uploadChunkHandler);

// 获取已上传的分片列表（断点续传）
router.get('/:uploadId/chunks', getChunks);

// 完成分片上传
router.post('/:uploadId/complete', completeUpload);

// 取消分片上传
router.delete('/:uploadId', cancelUpload);

export default router;
