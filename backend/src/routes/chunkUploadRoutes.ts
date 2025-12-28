/**
 * 分片上传路由
 */

import { Router } from 'express';
import multer from 'multer';
import {
  initUpload,
  uploadChunkHandler,
  getChunks,
  completeUpload,
  cancelUpload,
} from '../controllers/chunkUploadController.js';

const router = Router();

// 配置 multer 用于接收分片数据
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 单个分片最大 10MB
  },
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
