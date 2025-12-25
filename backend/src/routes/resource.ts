/**
 * 资源路由
 */
import { Router } from 'express';
import { resourceController } from '@/controllers/resourceController.js';
import { authenticate, optionalAuthenticate } from '@/middlewares/auth.js';
import { uploadFields } from '@/middlewares/upload.js';
import {
  checkDownloadPermission,
  getDownloadStats,
  batchDownload,
  downloadResourceV2,
} from '@/controllers/downloadController.js';

const router = Router();

/**
 * 获取资源列表
 * GET /api/v1/resources
 * 支持分页、筛选、搜索、排序
 * 可选认证（登录用户返回积分信息）
 */
router.get('/', optionalAuthenticate, resourceController.getResourceList);

/**
 * 上传资源
 * POST /api/v1/resources/upload
 * 需要认证
 * 支持文件上传（multipart/form-data）
 */
router.post(
  '/upload',
  authenticate,
  uploadFields([
    { name: 'file', maxCount: 1 },
    { name: 'previewImages', maxCount: 10 },
  ]),
  resourceController.uploadResource
);

/**
 * VIP批量下载 (Task 3.6)
 * POST /api/v1/resources/batch-download
 * 需要认证，仅VIP用户可用
 */
router.post('/batch-download', authenticate, batchDownload);

/**
 * 获取资源详情
 * GET /api/v1/resources/:resourceId
 * 可选认证（登录用户返回积分信息）
 */
router.get('/:resourceId', optionalAuthenticate, resourceController.getResourceDetail);

/**
 * 检查下载权限 (Task 3.6)
 * GET /api/v1/resources/:resourceId/download-permission
 * 需要认证
 */
router.get('/:resourceId/download-permission', authenticate, checkDownloadPermission);

/**
 * 下载资源（原接口）
 * POST /api/v1/resources/:resourceId/download
 * 需要认证
 * 验证VIP权限或积分余额
 */
router.post('/:resourceId/download', authenticate, resourceController.downloadResource);

/**
 * 增强的下载资源接口 (Task 3.6)
 * POST /api/v1/resources/:resourceId/download-v2
 * 需要认证，支持VIP免费下载和积分下载
 */
router.post('/:resourceId/download-v2', authenticate, downloadResourceV2);

/**
 * 编辑资源
 * PUT /api/v1/resources/:resourceId
 * 需要认证
 * 仅允许上传者或管理员编辑
 */
router.put('/:resourceId', authenticate, resourceController.updateResource);

/**
 * 删除资源
 * DELETE /api/v1/resources/:resourceId
 * 需要认证
 * 仅允许上传者或管理员删除
 */
router.delete('/:resourceId', authenticate, resourceController.deleteResource);

export default router;
