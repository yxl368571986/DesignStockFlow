import { Router } from 'express';
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner
} from '../controllers/bannerController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// 所有轮播图管理接口都需要管理员权限
router.use(authenticate);

// 获取轮播图列表
router.get('/', getBanners);

// 添加轮播图
router.post('/', createBanner);

// 编辑轮播图
router.put('/:bannerId', updateBanner);

// 删除轮播图
router.delete('/:bannerId', deleteBanner);

export default router;
