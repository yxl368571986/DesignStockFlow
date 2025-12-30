/**
 * 收藏路由
 */
import { Router } from 'express';
import { favoriteController } from '@/controllers/favoriteController.js';
import { authenticate, optionalAuthenticate } from '@/middlewares/auth.js';

const router = Router();

/**
 * @route   GET /api/v1/favorites
 * @desc    获取收藏列表
 * @access  Private
 */
router.get('/', authenticate, favoriteController.getFavoriteList.bind(favoriteController));

/**
 * @route   POST /api/v1/favorites/check-batch
 * @desc    批量检查收藏状态
 * @access  Public (未登录返回全false)
 * @note    必须在 /:resourceId 路由之前定义，否则会被错误匹配
 */
router.post('/check-batch', optionalAuthenticate, favoriteController.checkFavorites.bind(favoriteController));

/**
 * @route   POST /api/v1/favorites/:resourceId
 * @desc    添加收藏
 * @access  Private
 */
router.post('/:resourceId', authenticate, favoriteController.addFavorite.bind(favoriteController));

/**
 * @route   DELETE /api/v1/favorites/:resourceId
 * @desc    取消收藏
 * @access  Private
 */
router.delete('/:resourceId', authenticate, favoriteController.removeFavorite.bind(favoriteController));

/**
 * @route   GET /api/v1/favorites/:resourceId/check
 * @desc    检查单个资源收藏状态
 * @access  Public (未登录返回false)
 */
router.get('/:resourceId/check', optionalAuthenticate, favoriteController.checkFavorite.bind(favoriteController));

export default router;
