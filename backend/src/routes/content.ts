/**
 * 公共内容路由
 * 提供前端首页、搜索等公共内容API
 */
import { Router } from 'express';
import { contentController } from '@/controllers/contentController.js';

const router = Router();

/**
 * @route   GET /api/v1/content/hot-search
 * @desc    获取热门搜索关键词
 * @access  Public
 */
router.get('/hot-search', contentController.getHotSearchKeywords);

/**
 * @route   GET /api/v1/content/search-suggestions
 * @desc    获取搜索联想词
 * @access  Public
 */
router.get('/search-suggestions', contentController.getSearchSuggestions);

/**
 * @route   GET /api/v1/content/banners
 * @desc    获取轮播图列表
 * @access  Public
 */
router.get('/banners', contentController.getBanners);

/**
 * @route   GET /api/v1/content/categories
 * @desc    获取分类列表
 * @access  Public
 */
router.get('/categories', contentController.getCategories);

/**
 * @route   GET /api/v1/content/category-tree
 * @desc    获取分类树
 * @access  Public
 */
router.get('/category-tree', contentController.getCategoryTree);

/**
 * @route   GET /api/v1/content/announcements
 * @desc    获取公告列表
 * @access  Public
 */
router.get('/announcements', contentController.getAnnouncements);

/**
 * @route   GET /api/v1/content/site-config
 * @desc    获取网站配置
 * @access  Public
 */
router.get('/site-config', contentController.getSiteConfig);

export default router;
