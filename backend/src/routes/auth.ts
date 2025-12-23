/**
 * 认证路由
 */
import { Router } from 'express';
import { authController } from '@/controllers/authController.js';
import { authenticate } from '@/middlewares/auth.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', authController.register.bind(authController));

/**
 * @route   POST /api/v1/auth/login
 * @desc    用户登录（密码）
 * @access  Public
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route   POST /api/v1/auth/send-code
 * @desc    发送验证码
 * @access  Public
 */
router.post('/send-code', authController.sendCode.bind(authController));

/**
 * @route   POST /api/v1/auth/code-login
 * @desc    验证码登录
 * @access  Public
 */
router.post('/code-login', authController.loginWithCode.bind(authController));

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    刷新Token
 * @access  Private (需要认证)
 */
router.post('/refresh-token', authenticate, authController.refreshToken.bind(authController));

/**
 * @route   POST /api/v1/auth/logout
 * @desc    退出登录
 * @access  Private (需要认证)
 */
router.post('/logout', authenticate, authController.logout.bind(authController));

// 微信登录功能暂未实现
// router.get('/wechat/login', authController.wechatLogin.bind(authController));
// router.get('/wechat/callback', authController.wechatCallback.bind(authController));

export default router;
