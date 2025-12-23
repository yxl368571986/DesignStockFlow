/**
 * 统计路由
 */
import { Router } from 'express';
import { statisticsController } from '@/controllers/statisticsController.js';
import { authenticate, requirePermissions } from '@/middlewares/auth.js';

const router = Router();

// 所有统计接口都需要登录和statistics:view权限
router.use(authenticate);
router.use(requirePermissions(['statistics:view']));

/**
 * @route   GET /api/v1/admin/statistics/overview
 * @desc    获取数据概览
 * @access  Private (需要statistics:view权限)
 */
router.get(
  '/overview',
  statisticsController.getOverview.bind(statisticsController)
);

/**
 * @route   GET /api/v1/admin/statistics/user-growth
 * @desc    获取用户增长趋势（最近30天）
 * @access  Private (需要statistics:view权限)
 */
router.get(
  '/user-growth',
  statisticsController.getUserGrowth.bind(statisticsController)
);

/**
 * @route   GET /api/v1/admin/statistics/resource-growth
 * @desc    获取资源增长趋势（最近30天）
 * @access  Private (需要statistics:view权限)
 */
router.get(
  '/resource-growth',
  statisticsController.getResourceGrowth.bind(statisticsController)
);

/**
 * @route   GET /api/v1/admin/statistics/download
 * @desc    获取下载统计（最近30天）
 * @access  Private (需要statistics:view权限)
 */
router.get(
  '/download',
  statisticsController.getDownloadStatistics.bind(statisticsController)
);

/**
 * @route   GET /api/v1/admin/statistics/hot-resources
 * @desc    获取热门资源TOP10
 * @access  Private (需要statistics:view权限)
 */
router.get(
  '/hot-resources',
  statisticsController.getHotResources.bind(statisticsController)
);

/**
 * @route   GET /api/v1/admin/statistics/hot-categories
 * @desc    获取热门分类TOP10
 * @access  Private (需要statistics:view权限)
 */
router.get(
  '/hot-categories',
  statisticsController.getHotCategories.bind(statisticsController)
);

/**
 * @route   GET /api/v1/admin/statistics/active-users
 * @desc    获取活跃用户TOP10
 * @access  Private (需要statistics:view权限)
 */
router.get(
  '/active-users',
  statisticsController.getActiveUsers.bind(statisticsController)
);

/**
 * @route   GET /api/v1/admin/statistics/custom
 * @desc    获取自定义时间范围统计
 * @access  Private (需要statistics:view权限)
 */
router.get(
  '/custom',
  statisticsController.getCustomStatistics.bind(statisticsController)
);

export default router;
