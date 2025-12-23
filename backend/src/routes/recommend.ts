import { Router } from 'express';
import {
  getRecommends,
  createRecommend,
  updateRecommend,
  deleteRecommend
} from '../controllers/recommendController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// 所有推荐位管理接口都需要管理员权限
router.use(authenticate);

// 获取推荐位配置列表
router.get('/', getRecommends);

// 创建推荐位配置
router.post('/', createRecommend);

// 更新推荐位配置
router.put('/:recommendId', updateRecommend);

// 删除推荐位配置
router.delete('/:recommendId', deleteRecommend);

export default router;
