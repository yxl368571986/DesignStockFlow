import { Router } from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// 所有公告管理接口都需要管理员权限
router.use(authenticate);

// 获取公告列表
router.get('/', getAnnouncements);

// 添加公告
router.post('/', createAnnouncement);

// 编辑公告
router.put('/:announcementId', updateAnnouncement);

// 删除公告
router.delete('/:announcementId', deleteAnnouncement);

export default router;
