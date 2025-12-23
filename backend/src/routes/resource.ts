/**
 * 资源路由
 */
import { Router } from 'express';
import { resourceController } from '@/controllers/resourceController.js';
import { authenticate, optionalAuthenticate } from '@/middlewares/auth.js';
import { uploadFields } from '@/middlewares/upload.js';

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
 * 获取资源详情
 * GET /api/v1/resources/:resourceId
 * 可选认证（登录用户返回积分信息）
 */
router.get('/:resourceId', optionalAuthenticate, resourceController.getResourceDetail);

/**
 * 下载资源
 * POST /api/v1/resources/:resourceId/download
 * 需要认证
 * 验证VIP权限或积分余额
 */
router.post('/:resourceId/download', authenticate, resourceController.downloadResource);

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
