/**
 * 分片上传控制器
 * 处理大文件分片上传相关的 API 请求
 */

import { Request, Response } from 'express';
import {
  initChunkUpload,
  uploadChunk,
  getUploadedChunks,
  completeChunkUpload,
  cancelChunkUpload,
} from '../services/chunkUploadService.js';
import { UploadErrorCodes } from '../config/audit.js';

/**
 * 初始化分片上传
 * POST /api/v1/upload/init
 */
export async function initUpload(req: Request, res: Response): Promise<void> {
  try {
    const { fileName, fileSize, fileHash, totalChunks } = req.body;
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    
    if (!fileName || !fileSize || !fileHash || !totalChunks) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    
    const result = await initChunkUpload({
      userId,
      fileName,
      fileSize: Number(fileSize),
      fileHash,
      totalChunks: Number(totalChunks),
    });
    
    res.json({
      code: 0,
      message: '初始化成功',
      data: result,
    });
  } catch (error) {
    console.error('初始化分片上传失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 上传分片
 * POST /api/v1/upload/chunk
 */
export async function uploadChunkHandler(req: Request, res: Response): Promise<void> {
  try {
    const { uploadId, chunkIndex } = req.body;
    const file = req.file;
    
    if (!uploadId || chunkIndex === undefined || !file) {
      res.status(400).json({ code: 400, message: '缺少必要参数' });
      return;
    }
    
    const result = await uploadChunk({
      uploadId,
      chunkIndex: Number(chunkIndex),
      chunkData: file.buffer,
    });
    
    res.json({
      code: 0,
      message: '分片上传成功',
      data: result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '服务器错误';
    
    if (errorMessage === '上传会话不存在') {
      res.status(404).json({
        code: UploadErrorCodes.UPLOAD_005.code,
        message: UploadErrorCodes.UPLOAD_005.message,
      });
      return;
    }
    
    if (errorMessage === '分片索引无效') {
      res.status(400).json({
        code: UploadErrorCodes.UPLOAD_006.code,
        message: UploadErrorCodes.UPLOAD_006.message,
      });
      return;
    }
    
    console.error('上传分片失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 获取已上传的分片列表（断点续传）
 * GET /api/v1/upload/:uploadId/chunks
 */
export async function getChunks(req: Request, res: Response): Promise<void> {
  try {
    const { uploadId } = req.params;
    
    if (!uploadId) {
      res.status(400).json({ code: 400, message: '缺少上传ID' });
      return;
    }
    
    const chunks = await getUploadedChunks(uploadId);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: { chunks },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '服务器错误';
    
    if (errorMessage === '上传会话不存在') {
      res.status(404).json({
        code: UploadErrorCodes.UPLOAD_005.code,
        message: UploadErrorCodes.UPLOAD_005.message,
      });
      return;
    }
    
    console.error('获取分片列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 完成分片上传
 * POST /api/v1/upload/:uploadId/complete
 */
export async function completeUpload(req: Request, res: Response): Promise<void> {
  try {
    const { uploadId } = req.params;
    
    if (!uploadId) {
      res.status(400).json({ code: 400, message: '缺少上传ID' });
      return;
    }
    
    const result = await completeChunkUpload(uploadId);
    
    res.json({
      code: 0,
      message: '上传完成',
      data: result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '服务器错误';
    
    if (errorMessage === '上传会话不存在') {
      res.status(404).json({
        code: UploadErrorCodes.UPLOAD_005.code,
        message: UploadErrorCodes.UPLOAD_005.message,
      });
      return;
    }
    
    if (errorMessage === '还有分片未上传完成') {
      res.status(400).json({ code: 400, message: errorMessage });
      return;
    }
    
    console.error('完成上传失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}

/**
 * 取消分片上传
 * DELETE /api/v1/upload/:uploadId
 */
export async function cancelUpload(req: Request, res: Response): Promise<void> {
  try {
    const { uploadId } = req.params;
    
    if (!uploadId) {
      res.status(400).json({ code: 400, message: '缺少上传ID' });
      return;
    }
    
    await cancelChunkUpload(uploadId);
    
    res.json({
      code: 0,
      message: '已取消上传',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '服务器错误';
    
    if (errorMessage === '上传会话不存在') {
      res.status(404).json({
        code: UploadErrorCodes.UPLOAD_005.code,
        message: UploadErrorCodes.UPLOAD_005.message,
      });
      return;
    }
    
    console.error('取消上传失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
}
