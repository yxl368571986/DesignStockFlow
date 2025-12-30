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
  getDownloadConfirmation,
  executeDownloadWithEarnings,
  downloadFile,
} from '@/controllers/downloadController.js';
import {
  setPricingHandler,
  getPricingHandler,
  setBatchPricingHandler,
} from '@/controllers/pricingController.js';

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
 * 完成分片上传后创建资源
 * POST /api/v1/resources/complete-upload
 * 需要认证
 * 用于分片上传完成后，创建资源记录
 */
router.post('/complete-upload', authenticate, resourceController.completeChunkUpload);

/**
 * VIP批量下载 (Task 3.6)
 * POST /api/v1/resources/batch-download
 * 需要认证，仅VIP用户可用
 */
router.post('/batch-download', authenticate, batchDownload);

/**
 * 批量设置资源定价
 * POST /api/v1/resources/batch-pricing
 * 需要认证
 * 
 * 需求: 1.6
 */
router.post('/batch-pricing', authenticate, setBatchPricingHandler);

/**
 * 获取资源详情
 * GET /api/v1/resources/:resourceId
 * 可选认证（登录用户返回积分信息）
 */
router.get('/:resourceId', optionalAuthenticate, resourceController.getResourceDetail);

/**
 * 获取资源定价信息
 * GET /api/v1/resources/:resourceId/pricing
 * 
 * 需求: 1.1
 */
router.get('/:resourceId/pricing', getPricingHandler);

/**
 * 设置资源定价
 * POST /api/v1/resources/:resourceId/pricing
 * 需要认证
 * 
 * 需求: 1.1
 */
router.post('/:resourceId/pricing', authenticate, setPricingHandler);

/**
 * 检查下载权限 (Task 3.6)
 * GET /api/v1/resources/:resourceId/download-permission
 * 需要认证
 */
router.get('/:resourceId/download-permission', authenticate, checkDownloadPermission);

/**
 * 获取下载确认信息
 * GET /api/v1/resources/:resourceId/download/confirm
 * 需要认证
 * 
 * 需求: 3.3, 3.4
 */
router.get('/:resourceId/download/confirm', authenticate, getDownloadConfirmation);

/**
 * 执行下载（带积分扣除和收益发放）
 * POST /api/v1/resources/:resourceId/download/execute
 * 需要认证
 * 
 * 需求: 3.1, 3.2, 3.4, 3.5, 3.6, 4.6, 4.7
 */
router.post('/:resourceId/download/execute', authenticate, executeDownloadWithEarnings);

/**
 * 文件流下载
 * GET /api/v1/resources/:resourceId/download/file
 * 需要认证
 * 直接返回文件流，强制浏览器下载
 */
router.get('/:resourceId/download/file', authenticate, downloadFile);

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
