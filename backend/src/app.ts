import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from '@/config/index.js';
import { logger } from '@/utils/logger.js';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler.js';
import { requestLogger } from '@/middlewares/requestLogger.js';
import {
  requestFieldTransform,
  responseFieldTransform,
} from '@/middlewares/fieldTransform.js';

/**
 * 创建Express应用
 */
const app: Application = express();

/**
 * 安全中间件
 */
// Helmet - 设置安全响应头
app.use(
  helmet({
    contentSecurityPolicy: false, // 根据需要配置CSP
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false, // 允许跨域资源访问
  })
);

// CORS - 跨域资源共享
const allowedOrigins = config.cors.origin.split(',').map(origin => origin.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // 开发环境：允许所有来源
      if (config.server.env === 'development') {
        callback(null, true);
        return;
      }
      
      // 生产环境：检查origin是否在允许列表中
      // 允许没有origin的请求（如Postman、服务器端请求）
      if (!origin) {
        callback(null, true);
        return;
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-TOKEN'],
  })
);

/**
 * 静态文件服务 - 提供上传文件的访问
 * 必须在 CORS 之后配置，以便跨域请求能正常访问
 */
const uploadsPath = path.resolve(process.cwd(), 'uploads');

// MIME 类型映射表
const mimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.psd': 'image/vnd.adobe.photoshop',
  '.ai': 'application/postscript',
  '.eps': 'application/postscript',
  '.cdr': 'application/cdr',
  '.sketch': 'application/sketch',
  '.xd': 'application/xd',
  '.figma': 'application/figma',
};

app.use('/uploads', express.static(uploadsPath, {
  // 设置跨域响应头和正确的 Content-Type，允许前端访问
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // 根据文件扩展名设置正确的 Content-Type
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext];
    if (mimeType) {
      res.setHeader('Content-Type', mimeType);
    }
  }
}));
logger.info(`📁 Static files served from: ${uploadsPath}`);

// 同时为 /files 路径提供静态文件服务（兼容旧数据）
const filesPath = path.resolve(process.cwd(), 'files');
app.use('/files', express.static(filesPath, {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext];
    if (mimeType) {
      res.setHeader('Content-Type', mimeType);
    }
  }
}));
logger.info(`📁 Static files also served from: ${filesPath}`);

// 限流 - 开发环境放宽限制以支持E2E测试
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.server.env === 'development' ? 1000 : config.rateLimit.maxRequests, // 开发环境1000次/15分钟
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => config.server.env === 'development', // 开发环境跳过限流
});
app.use('/api/', limiter);

/**
 * 基础中间件
 */
// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));

// 解析URL编码请求体
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use(requestLogger);

// 字段名转换
app.use(requestFieldTransform);
app.use(responseFieldTransform);

/**
 * 健康检查接口
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    environment: config.server.env,
  });
});

/**
 * API路由
 */
app.get('/api', (_req, res) => {
  res.json({
    message: '星潮设计资源平台 API',
    version: '1.0.0',
    docs: '/api/docs',
  });
});

// 认证路由
import authRoutes from '@/routes/auth.js';
app.use('/api/v1/auth', authRoutes);
logger.info('🔐 Auth routes loaded');

// 用户路由
import userRoutes from '@/routes/user.js';
app.use('/api/v1/user', userRoutes);
logger.info('👤 User routes loaded');

// 资源路由
import resourceRoutes from '@/routes/resource.js';
app.use('/api/v1/resources', resourceRoutes);
logger.info('📦 Resource routes loaded');

// 审核路由（管理员）
import auditRoutes from '@/routes/audit.js';
app.use('/api/v1/admin/audit', auditRoutes);
logger.info('✅ Audit routes loaded');

// VIP路由
import vipRoutes from '@/routes/vip.js';
app.use('/api/v1/vip', vipRoutes);
logger.info('💎 VIP routes loaded');

// 积分路由
import pointsRoutes from '@/routes/points.js';
app.use('/api/v1/points', pointsRoutes);
logger.info('🎁 Points routes loaded');

// 管理员积分路由
import adminPointsRoutes from '@/routes/adminPoints.js';
app.use('/api/v1/admin/points', adminPointsRoutes);
logger.info('🎁 Admin points routes loaded');

// 管理员用户路由
import adminUsersRoutes from '@/routes/adminUsers.js';
app.use('/api/v1/admin/users', adminUsersRoutes);
logger.info('👤 Admin users routes loaded');

// 管理员资源路由
import adminResourceRoutes from '@/routes/adminResource.js';
app.use('/api/v1/admin/resources', adminResourceRoutes);
logger.info('📦 Admin resources routes loaded');

// 管理员分类路由
import categoryRoutes from '@/routes/category.js';
app.use('/api/v1/admin/categories', categoryRoutes);
logger.info('📂 Admin categories routes loaded');

// 管理员统计路由
import statisticsRoutes from '@/routes/statistics.js';
app.use('/api/v1/admin/statistics', statisticsRoutes);
logger.info('📊 Admin statistics routes loaded');

// 管理员轮播图路由
import bannerRoutes from '@/routes/banner.js';
app.use('/api/v1/admin/banners', bannerRoutes);
logger.info('🎨 Admin banners routes loaded');

// 管理员公告路由
import announcementRoutes from '@/routes/announcement.js';
app.use('/api/v1/admin/announcements', announcementRoutes);
logger.info('📢 Admin announcements routes loaded');

// 管理员推荐位路由
import recommendRoutes from '@/routes/recommend.js';
app.use('/api/v1/admin/recommends', recommendRoutes);
logger.info('⭐ Admin recommends routes loaded');

// 管理员系统设置路由
import systemSettingsRoutes from '@/routes/systemSettings.js';
app.use('/api/v1/admin/settings', systemSettingsRoutes);
logger.info('⚙️ Admin settings routes loaded');

// 管理员角色管理路由
import roleRoutes from '@/routes/role.js';
app.use('/api/v1/admin/roles', roleRoutes);
logger.info('🔑 Admin roles routes loaded');

// 管理员权限管理路由
import permissionRoutes from '@/routes/permission.js';
app.use('/api/v1/admin/permissions', permissionRoutes);
logger.info('🛡️ Admin permissions routes loaded');

// 支付路由
import paymentRoutes from '@/routes/payment.js';
app.use('/api/v1/payment', paymentRoutes);
logger.info('💳 Payment routes loaded');

// 管理后台VIP路由
import adminVipRoutes from '@/routes/adminVip.js';
app.use('/api/v1/admin/vip', adminVipRoutes);
logger.info('💎 Admin VIP routes loaded');

// 管理后台安全路由
import adminSecurityRoutes from '@/routes/adminSecurity.js';
app.use('/api/v1/admin/security', adminSecurityRoutes);
logger.info('🔒 Admin security routes loaded');

// 风控审核路由
import adminRiskControlRoutes from '@/routes/adminRiskControl.js';
app.use('/api/v1/admin/risk-control', adminRiskControlRoutes);
logger.info('🛡️ Admin risk control routes loaded');

// 兑换审计路由
import adminExchangeAuditRoutes from '@/routes/adminExchangeAudit.js';
app.use('/api/v1/admin/points/exchange', adminExchangeAuditRoutes);
logger.info('📋 Admin exchange audit routes loaded');

// 充值路由
import rechargeRoutes from '@/routes/rechargeRoutes.js';
app.use('/api/v1/recharge', rechargeRoutes);
logger.info('💰 Recharge routes loaded');

// 管理端充值路由
import adminRechargeRoutes from '@/routes/adminRechargeRoutes.js';
app.use('/api/v1/admin/recharge', adminRechargeRoutes);
logger.info('💰 Admin recharge routes loaded');

// 管理端积分调整路由
import adminPointsAdjustRoutes from '@/routes/adminPointsAdjustRoutes.js';
app.use('/api/v1/admin/points-adjust', adminPointsAdjustRoutes);
logger.info('🎯 Admin points adjust routes loaded');

// 公共内容路由
import contentRoutes from '@/routes/content.js';
app.use('/api/v1/content', contentRoutes);
logger.info('📄 Content routes loaded');

// 收藏路由
import favoriteRoutes from '@/routes/favorite.js';
app.use('/api/v1/favorites', favoriteRoutes);
logger.info('⭐ Favorite routes loaded');

// 分片上传路由
import chunkUploadRoutes from '@/routes/chunkUploadRoutes.js';
app.use('/api/v1/upload', chunkUploadRoutes);
logger.info('📤 Chunk upload routes loaded');

// 通知路由
import notificationRoutes from '@/routes/notificationRoutes.js';
app.use('/api/v1/notifications', notificationRoutes);
logger.info('🔔 Notification routes loaded');

// 启动VIP定时任务
import { startVipScheduler } from '@/services/vipScheduler.js';
startVipScheduler();

// 启动支付定时任务
import { startPaymentScheduler } from '@/services/paymentScheduler.js';
startPaymentScheduler();

// 启动VIP支付系统定时任务 (Phase 4)
import { startAllTasks } from '@/tasks/index.js';
startAllTasks();

// 测试路由（仅开发环境）
if (config.server.env === 'development') {
  import('@/routes/test.js').then((module) => {
    app.use('/api/test', module.default);
    logger.info('🧪 Test routes loaded');
  });
}

/**
 * 错误处理
 */
// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

/**
 * 启动服务器
 */
const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server is running on http://${HOST}:${PORT}`);
  logger.info(`📝 Environment: ${config.server.env}`);
  logger.info(`🔗 Health check: http://${HOST}:${PORT}/health`);
  logger.info(`📚 API endpoint: http://${HOST}:${PORT}/api`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
