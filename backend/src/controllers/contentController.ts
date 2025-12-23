/**
 * 公共内容控制器
 * 处理前端首页、搜索等公共内容请求
 */
import { Request, Response } from 'express';
import { contentService } from '@/services/contentService.js';

/**
 * 获取热门搜索关键词
 * GET /api/v1/content/hot-search
 */
export const getHotSearchKeywords = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const keywords = await contentService.getHotSearchKeywords(limit);

    res.json({
      code: 200,
      msg: 'success',
      data: keywords,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('获取热门搜索关键词失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取热门搜索关键词失败',
      error: error.message,
    });
  }
};

/**
 * 获取搜索联想词
 * GET /api/v1/content/search-suggestions
 */
export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const keyword = req.query.keyword as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!keyword) {
      return res.json({
        code: 200,
        msg: 'success',
        data: [],
        timestamp: Date.now(),
      });
    }

    const suggestions = await contentService.getSearchSuggestions(keyword, limit);

    res.json({
      code: 200,
      msg: 'success',
      data: suggestions,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('获取搜索联想词失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取搜索联想词失败',
      error: error.message,
    });
  }
};

/**
 * 获取轮播图列表
 * GET /api/v1/content/banners
 */
export const getBanners = async (_req: Request, res: Response) => {
  try {
    const banners = await contentService.getPublicBanners();

    res.json({
      code: 200,
      msg: 'success',
      data: banners,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('获取轮播图失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取轮播图失败',
      error: error.message,
    });
  }
};

/**
 * 获取分类列表
 * GET /api/v1/content/categories
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const parentId = req.query.parentId as string | undefined;
    const categories = await contentService.getPublicCategories(parentId);

    res.json({
      code: 200,
      msg: 'success',
      data: categories,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取分类列表失败',
      error: error.message,
    });
  }
};

/**
 * 获取分类树
 * GET /api/v1/content/category-tree
 */
export const getCategoryTree = async (_req: Request, res: Response) => {
  try {
    const categories = await contentService.getCategoryTree();

    res.json({
      code: 200,
      msg: 'success',
      data: categories,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('获取分类树失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取分类树失败',
      error: error.message,
    });
  }
};

/**
 * 获取公告列表
 * GET /api/v1/content/announcements
 */
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const level = req.query.level as string | undefined;
    const announcements = await contentService.getPublicAnnouncements(level);

    res.json({
      code: 200,
      msg: 'success',
      data: announcements,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('获取公告列表失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取公告列表失败',
      error: error.message,
    });
  }
};

/**
 * 获取网站配置
 * GET /api/v1/content/site-config
 */
export const getSiteConfig = async (_req: Request, res: Response) => {
  try {
    const config = await contentService.getSiteConfig();

    res.json({
      code: 200,
      msg: 'success',
      data: config,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('获取网站配置失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取网站配置失败',
      error: error.message,
    });
  }
};

export const contentController = {
  getHotSearchKeywords,
  getSearchSuggestions,
  getBanners,
  getCategories,
  getCategoryTree,
  getAnnouncements,
  getSiteConfig,
};
