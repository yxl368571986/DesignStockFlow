import { Router } from 'express';
import * as adminPointsController from '../controllers/adminPointsController';
import { authenticate as authenticateToken, requirePermissions as requirePermission } from '../middlewares/auth';

const router = Router();

// 所有管理员积分接口都需要登录和权限验证
router.use(authenticateToken);

// 积分规则管理
router.get('/rules', requirePermission(['settings:view']), adminPointsController.getPointsRules);
router.put('/rules/:ruleId', requirePermission(['settings:edit']), adminPointsController.updatePointsRule);

// 积分商品管理
router.get('/products', requirePermission(['settings:view']), adminPointsController.getPointsProducts);
router.post('/products', requirePermission(['settings:edit']), adminPointsController.addPointsProduct);
router.put('/products/:productId', requirePermission(['settings:edit']), adminPointsController.updatePointsProduct);
router.delete('/products/:productId', requirePermission(['settings:edit']), adminPointsController.deletePointsProduct);

// 兑换记录管理
router.get('/exchange-records', requirePermission(['settings:view']), adminPointsController.getExchangeRecords);
router.put('/exchange-records/:exchangeId/ship', requirePermission(['settings:edit']), adminPointsController.shipExchangeRecord);

// 积分统计
router.get('/statistics', requirePermission(['statistics:view']), adminPointsController.getPointsStatistics);

export default router;
