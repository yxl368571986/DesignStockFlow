/**
 * 分类管理路由
 */
import { Router } from 'express';
import { categoryController } from '@/controllers/categoryController.js';
import { authenticate, requireRoles } from '@/middlewares/auth.js';

const router = Router();

// 所有路由都需要认证和管理员权限
router.use(authenticate);
router.use(requireRoles(['super_admin', 'operator']));

/**
 * 获取分类列表(树形结构)
 * GET /api/v1/admin/categories
 * 返回一级和二级分类
 */
router.get('/', categoryController.getCategoryTree.bind(categoryController));

/**
 * 批量更新分类排序
 * PUT /api/v1/admin/categories/sort
 * 支持拖拽调整排序
 * 注意：这个路由必须在 /:categoryId 之前，否则会被匹配为 categoryId
 */
router.put('/sort', categoryController.updateCategoriesSort.bind(categoryController));

/**
 * 添加分类
 * POST /api/v1/admin/categories
 * 支持添加一级分类和二级分类
 */
router.post('/', categoryController.createCategory.bind(categoryController));

/**
 * 更新分类
 * PUT /api/v1/admin/categories/:categoryId
 * 允许修改分类信息
 */
router.put('/:categoryId', categoryController.updateCategory.bind(categoryController));

/**
 * 删除分类
 * DELETE /api/v1/admin/categories/:categoryId
 * 检查分类下是否有资源，有资源时不允许删除
 */
router.delete('/:categoryId', categoryController.deleteCategory.bind(categoryController));

export default router;
