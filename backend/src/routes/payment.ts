import { Router } from 'express';
import {
  createOrder,
  getOrderStatus,
  wechatCallback,
  alipayCallback,
} from '../controllers/paymentController';
import { authenticate as authenticateToken } from '../middlewares/auth';

const router = Router();

/**
 * 创建订单
 * POST /api/v1/payment/orders
 */
router.post('/orders', authenticateToken, createOrder);

/**
 * 查询订单状态
 * GET /api/v1/payment/orders/:orderNo
 */
router.get('/orders/:orderNo', authenticateToken, getOrderStatus);

/**
 * 微信支付回调
 * POST /api/v1/payment/wechat/callback
 */
router.post('/wechat/callback', wechatCallback);

/**
 * 支付宝支付回调
 * POST /api/v1/payment/alipay/callback
 */
router.post('/alipay/callback', alipayCallback);

export default router;
