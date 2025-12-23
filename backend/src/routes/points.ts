import { Router } from 'express';
import * as pointsController from '../controllers/pointsController.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = Router();

// 所有积分相关接口都需要登录
router.use(authenticateToken);

// 获取用户积分信息
router.get('/my-info', pointsController.getMyPointsInfo);

// 获取积分明细记录
router.get('/records', pointsController.getPointsRecords);

// 获取积分商品列表
router.get('/products', pointsController.getPointsProducts);

// 兑换积分商品
router.post('/exchange', pointsController.exchangeProduct);

// 获取兑换记录
router.get('/exchange-records', pointsController.getExchangeRecords);

// 获取积分规则
router.get('/rules', pointsController.getPointsRules);

// 获取每日任务列表
router.get('/daily-tasks', pointsController.getDailyTasks);

// 完成任务
router.post('/daily-tasks/:taskCode/complete', pointsController.completeTask);

// 每日签到
router.post('/signin', pointsController.dailySignin);

// 以下功能暂未实现
// router.get('/recharge-packages', pointsController.getRechargePackages);
// router.post('/recharge', pointsController.createRecharge);

export default router;
