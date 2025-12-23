/**
 * 管理员资源路由
 */
import { Router } from 'express';
import { adminResourceController } from '@/controllers/adminResourceController.js';
import { authenticate, requireRoles } from '@/middlewares/auth.js';

const router = Router();

// 所有路由都需要认证和管理员权限
router.use(authenticate);
router.use(requireRoles(['super_admin', 'moderator']));

/**
 * 获取资源列表(管理员)
 * GET /api/v1/admin/resources
 * 支持搜索(标题/资源ID/上传者)、筛选(分类/审核状态/VIP等级/状态)
 */
router.get('/', adminResourceController.getResourceList.bind(adminResourceController));

/**
 * 编辑资源(管理员)
 * PUT /api/v1/admin/resources/:resourceId
 * 允许修改标题、分类、标签、描述
 */
router.put('/:resourceId', adminResourceController.updateResource.bind(adminResourceController));

/**
 * 下架资源
 * PUT /api/v1/admin/resources/:resourceId/offline
 * 将资源从前台隐藏
 */
router.put('/:resourceId/offline', adminResourceController.offlineResource.bind(adminResourceController));

/**
 * 删除资源(管理员)
 * DELETE /api/v1/admin/resources/:resourceId
 * 永久删除资源及相关文件
 */
router.delete('/:resourceId', adminResourceController.deleteResource.bind(adminResourceController));

/**
 * 置顶资源
 * PUT /api/v1/admin/resources/:resourceId/top
 * 将资源置顶显示
 */
router.put('/:resourceId/top', adminResourceController.topResource.bind(adminResourceController));

/**
 * 推荐资源
 * PUT /api/v1/admin/resources/:resourceId/recommend
 * 将资源添加到推荐位
 */
router.put('/:resourceId/recommend', adminResourceController.recommendResource.bind(adminResourceController));

export default router;
