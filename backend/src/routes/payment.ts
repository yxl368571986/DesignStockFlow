import { Router } from 'express';
import {
  createOrder,
  getOrderStatus,
  wechatCallback,
  alipayCallback,
} from '../controllers/paymentController.js';
import {
  wechatPayNotify,
  alipayNotify,
  alipayReturn,
} from '../controllers/vipPaymentController.js';
import {
  wechatRechargeCallback,
  alipayRechargeCallback,
} from '../controllers/rechargeController.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

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
 * 微信支付回调（旧接口，保持兼容）
 * POST /api/v1/payment/wechat/callback
 */
router.post('/wechat/callback', wechatCallback);

/**
 * 支付宝支付回调（旧接口，保持兼容）
 * POST /api/v1/payment/alipay/callback
 */
router.post('/alipay/callback', alipayCallback);

/**
 * VIP支付回调接口 (Task 3.1)
 */

/**
 * 微信支付异步回调
 * POST /api/v1/payment/wechat/notify
 */
router.post('/wechat/notify', wechatPayNotify);

/**
 * 支付宝异步回调
 * POST /api/v1/payment/alipay/notify
 */
router.post('/alipay/notify', alipayNotify);

/**
 * 支付宝同步回调
 * GET /api/v1/payment/alipay/return
 */
router.get('/alipay/return', alipayReturn);

/**
 * 充值支付回调接口
 */

/**
 * 微信充值支付回调
 * POST /api/v1/payment/recharge/wechat/callback
 */
router.post('/recharge/wechat/callback', wechatRechargeCallback);

/**
 * 支付宝充值支付回调
 * POST /api/v1/payment/recharge/alipay/callback
 */
router.post('/recharge/alipay/callback', alipayRechargeCallback);

export default router;
