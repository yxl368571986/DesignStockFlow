/**
 * 管理后台VIP控制器
 * 处理退款审核、安全日志、支付限制解除等
 */

import { Request, Response } from 'express';
import { vipOrderService, OrderStatus } from '../services/order/vipOrderService.js';
import { securityMonitor, SecurityEventType, RiskLevel } from '../services/security/securityMonitor.js';
import { paymentGateway, PaymentChannel } from '../services/payment/paymentGateway.js';
import { notificationService } from '../services/notification/notificationService.js';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

interface RefundRecord {
  refund_id: string;
  user_id: string;
  order_id: string;
  reason: string | null;
  reason_type: string | null;
  status: number;
  admin_note: string | null;
  processed_at: Date | null;
  created_at: Date;
  orders?: {
    order_no: string;
    amount: number | null;
    product_name: string | null;
    payment_method: string | null;
    paid_at: Date | null;
  } | null;
  users?: {
    user_id: string;
    username: string | null;
    email: string | null;
  } | null;
}

interface SecurityLog {
  log_id: string;
  user_id: string | null;
  event_type: string;
  risk_level: string | null;
  ip: string | null;
  user_agent: string | null;
  details: unknown;
  created_at: Date;
  users?: {
    username: string | null;
    email: string | null;
  } | null;
}

/**
 * 获取退款申请列表
 * GET /api/v1/admin/vip/refunds
 */
export async function getRefundList(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20, status, startDate, endDate } = req.query;

    // 使用原始SQL查询退款记录
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    let whereClause = 'WHERE 1=1';
    if (status !== undefined) {
      whereClause += ` AND rr.status = ${Number(status)}`;
    }
    if (startDate) {
      whereClause += ` AND rr.created_at >= '${startDate}'`;
    }
    if (endDate) {
      whereClause += ` AND rr.created_at <= '${endDate}'`;
    }

    const refunds = await prisma.$queryRawUnsafe<RefundRecord[]>(`
      SELECT rr.*, 
             o.order_no, o.amount, o.product_name, o.payment_method, o.paid_at,
             u.user_id as "users.user_id", u.username as "users.username", u.email as "users.email"
      FROM refund_requests rr
      LEFT JOIN orders o ON rr.order_id = o.order_id
      LEFT JOIN users u ON rr.user_id = u.user_id
      ${whereClause}
      ORDER BY rr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
      SELECT COUNT(*) as count FROM refund_requests rr ${whereClause}
    `);
    const total = Number(countResult[0]?.count || 0);

    res.json({
      code: 0,
      data: {
        list: refunds.map((r: RefundRecord) => ({
          refundId: r.refund_id,
          orderNo: r.orders?.order_no,
          userId: r.user_id,
          username: r.users?.username,
          email: r.users?.email,
          amount: r.orders?.amount,
          productName: r.orders?.product_name,
          reason: r.reason,
          reasonType: r.reason_type,
          status: r.status,
          adminNote: r.admin_note,
          processedAt: r.processed_at,
          createdAt: r.created_at,
        })),
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('获取退款列表失败:', err);
    res.status(500).json({ code: 500, message: err.message || '获取退款列表失败' });
  }
}

/**
 * 处理退款申请
 * PUT /api/v1/admin/vip/refunds/:refundId
 */
export async function processRefund(req: Request, res: Response) {
  try {
    const adminId = req.user?.userId;
    const { refundId } = req.params;
    const { action, adminNote } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ code: 400, message: '无效的操作' });
    }

    // 获取退款申请
    const refundRequests = await prisma.$queryRawUnsafe<Array<{
      refund_id: string;
      user_id: string;
      order_id: string;
      status: number;
      order_no: string;
      amount: number;
      payment_method: string;
    }>>(`
      SELECT rr.*, o.order_no, o.amount, o.payment_method
      FROM refund_requests rr
      LEFT JOIN orders o ON rr.order_id = o.order_id
      WHERE rr.refund_id = '${refundId}'
      LIMIT 1
    `);

    const refundRequest = refundRequests[0];

    if (!refundRequest) {
      return res.status(404).json({ code: 404, message: '退款申请不存在' });
    }

    if (refundRequest.status !== 0) {
      return res.status(400).json({ code: 400, message: '该退款申请已处理' });
    }

    if (action === 'approve') {
      // 确定支付渠道
      let channel: PaymentChannel = 'wechat_native';
      if (refundRequest.payment_method?.includes('alipay')) {
        channel = 'alipay_pc';
      }

      // 调用支付网关退款
      const refundResult = await paymentGateway.refund({
        orderNo: refundRequest.order_no,
        refundNo: `RF${Date.now()}`,
        totalAmount: Math.round(refundRequest.amount * 100),
        refundAmount: Math.round(refundRequest.amount * 100),
        reason: '用户申请退款',
        channel,
      });

      if (!refundResult.success) {
        return res.status(500).json({ code: 500, message: refundResult.error || '退款失败' });
      }

      // 更新退款申请状态
      await prisma.$executeRawUnsafe(`
        UPDATE refund_requests 
        SET status = 1, admin_note = '${adminNote || ''}', processed_by = '${adminId}', 
            processed_at = NOW(), refund_no = '${refundResult.refundId || ''}'
        WHERE refund_id = '${refundId}'
      `);

      // 更新订单状态
      await vipOrderService.updateOrderStatus(refundRequest.order_no, OrderStatus.REFUNDED);

      // 发送退款成功通知
      await notificationService.sendRefundNotification(
        refundRequest.user_id,
        refundRequest.order_no,
        'approved'
      );
    } else {
      // 拒绝退款
      await prisma.$executeRawUnsafe(`
        UPDATE refund_requests 
        SET status = 2, admin_note = '${adminNote || ''}', processed_by = '${adminId}', processed_at = NOW()
        WHERE refund_id = '${refundId}'
      `);

      // 发送退款拒绝通知
      await notificationService.sendRefundNotification(
        refundRequest.user_id,
        refundRequest.order_no,
        'rejected'
      );
    }

    res.json({ code: 0, message: action === 'approve' ? '退款成功' : '已拒绝退款申请' });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('处理退款失败:', err);
    res.status(500).json({ code: 500, message: err.message || '处理退款失败' });
  }
}

/**
 * 获取安全日志列表
 * GET /api/v1/admin/security/logs
 */
export async function getSecurityLogs(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 20,
      eventType,
      riskLevel,
      userId,
      startDate,
      endDate,
    } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    let whereClause = 'WHERE 1=1';
    if (eventType) {
      whereClause += ` AND sl.event_type = '${eventType}'`;
    }
    if (riskLevel) {
      whereClause += ` AND sl.risk_level = '${riskLevel}'`;
    }
    if (userId) {
      whereClause += ` AND sl.user_id = '${userId}'`;
    }
    if (startDate) {
      whereClause += ` AND sl.created_at >= '${startDate}'`;
    }
    if (endDate) {
      whereClause += ` AND sl.created_at <= '${endDate}'`;
    }

    const logs = await prisma.$queryRawUnsafe<SecurityLog[]>(`
      SELECT sl.*, u.username as "users.username", u.email as "users.email"
      FROM security_logs sl
      LEFT JOIN users u ON sl.user_id = u.user_id
      ${whereClause}
      ORDER BY sl.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
      SELECT COUNT(*) as count FROM security_logs sl ${whereClause}
    `);
    const total = Number(countResult[0]?.count || 0);

    res.json({
      code: 0,
      data: {
        list: logs.map((log: SecurityLog) => ({
          logId: log.log_id,
          userId: log.user_id,
          username: log.users?.username,
          eventType: log.event_type,
          riskLevel: log.risk_level,
          ip: log.ip,
          userAgent: log.user_agent,
          details: log.details,
          createdAt: log.created_at,
        })),
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('获取安全日志失败:', err);
    res.status(500).json({ code: 500, message: err.message || '获取安全日志失败' });
  }
}

/**
 * 解除用户支付限制
 * POST /api/v1/admin/users/:userId/unlock-payment
 */
export async function unlockUserPayment(req: Request, res: Response) {
  try {
    const adminId = req.user?.userId;
    const { userId } = req.params;
    const { reason } = req.body;

    await securityMonitor.unlockPayment(userId, adminId || 'system');

    // 记录操作日志
    await securityMonitor.logSecurityEvent({
      userId,
      eventType: SecurityEventType.ACCOUNT_UNLOCKED,
      eventData: { adminId, reason },
      riskLevel: RiskLevel.LOW,
      actionTaken: 'unlocked',
    });

    res.json({ code: 0, message: '已解除支付限制' });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('解除支付限制失败:', err);
    res.status(500).json({ code: 500, message: err.message || '解除支付限制失败' });
  }
}

/**
 * 获取VIP订单统计
 * GET /api/v1/admin/vip/order-statistics
 */
export async function getVipOrderStatistics(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    if (startDate) {
      dateFilter += ` AND created_at >= '${startDate}'`;
    }
    if (endDate) {
      dateFilter += ` AND created_at <= '${endDate}'`;
    }

    // 获取订单统计
    const statsResult = await prisma.$queryRawUnsafe<Array<{
      total_orders: bigint;
      paid_orders: bigint;
      refunded_orders: bigint;
      total_revenue: number | null;
      refund_amount: number | null;
    }>>(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN payment_status = 1 THEN 1 END) as paid_orders,
        COUNT(CASE WHEN payment_status = 3 THEN 1 END) as refunded_orders,
        SUM(CASE WHEN payment_status = 1 THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN payment_status = 3 THEN amount ELSE 0 END) as refund_amount
      FROM orders
      WHERE order_type = 'vip' ${dateFilter}
    `);

    const stats = statsResult[0];

    // 支付渠道分布
    const channelDistribution = await prisma.$queryRawUnsafe<Array<{
      payment_method: string;
      count: bigint;
      amount: number | null;
    }>>(`
      SELECT payment_method, COUNT(*) as count, SUM(amount) as amount
      FROM orders
      WHERE order_type = 'vip' AND payment_status = 1 ${dateFilter}
      GROUP BY payment_method
    `);

    res.json({
      code: 0,
      data: {
        totalOrders: Number(stats?.total_orders || 0),
        paidOrders: Number(stats?.paid_orders || 0),
        refundedOrders: Number(stats?.refunded_orders || 0),
        totalRevenue: stats?.total_revenue || 0,
        refundAmount: stats?.refund_amount || 0,
        netRevenue: (Number(stats?.total_revenue) || 0) - (Number(stats?.refund_amount) || 0),
        channelDistribution: channelDistribution.map(c => ({
          channel: c.payment_method,
          count: Number(c.count),
          amount: c.amount,
        })),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('获取VIP订单统计失败:', err);
    res.status(500).json({ code: 500, message: err.message || '获取统计失败' });
  }
}
