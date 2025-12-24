/**
 * VIP控制器
 * 处理VIP相关的HTTP请求
 */

import { Request, Response, NextFunction } from 'express';
import {
  vipPackageService,
  vipPrivilegeService,
  userVipService,
} from '@/services/vipService.js';
import { logger } from '@/utils/logger.js';
import { success as successResponse, error as errorResponse } from '@/utils/response.js';

/**
 * 获取VIP套餐列表（前台）
 */
export const getVipPackages = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const packages = await vipPackageService.getActivePackages();

    return successResponse(res, packages, '获取VIP套餐列表成功');
  } catch (error) {
    logger.error('获取VIP套餐列表失败:', error);
    return errorResponse(res, '获取VIP套餐列表失败', 500);
  }
};

/**
 * 获取VIP特权列表（前台）
 */
export const getVipPrivileges = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const privileges = await vipPrivilegeService.getActivePrivileges();

    return successResponse(res, privileges, '获取VIP特权列表成功');
  } catch (error) {
    logger.error('获取VIP特权列表失败:', error);
    return errorResponse(res, '获取VIP特权列表失败', 500);
  }
};

/**
 * 获取用户VIP信息（前台）
 */
export const getUserVipInfo = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return errorResponse(res, '用户未登录', 401);
    }

    const vipInfo = await userVipService.getUserVipInfo(userId);

    return successResponse(res, vipInfo, '获取用户VIP信息成功');
  } catch (error) {
    logger.error('获取用户VIP信息失败:', error);
    return errorResponse(res, '获取用户VIP信息失败', 500);
  }
};

/**
 * 获取所有VIP套餐（管理员）
 */
export const getAllVipPackages = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const packages = await vipPackageService.getAllPackages();

    return successResponse(res, packages, '获取VIP套餐列表成功');
  } catch (error) {
    logger.error('获取VIP套餐列表失败:', error);
    return errorResponse(res, '获取VIP套餐列表失败', 500);
  }
};

/**
 * 创建VIP套餐（管理员）
 */
export const createVipPackage = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const {
      package_name,
      package_code,
      duration_days,
      original_price,
      current_price,
      description,
      sort_order,
    } = req.body;

    if (
      !package_name ||
      !package_code ||
      !duration_days ||
      original_price === undefined ||
      current_price === undefined
    ) {
      return errorResponse(res, '缺少必填字段', 400);
    }

    const vipPackage = await vipPackageService.createPackage({
      packageName: package_name,
      packageCode: package_code,
      durationDays: Number(duration_days),
      originalPrice: Number(original_price),
      currentPrice: Number(current_price),
      description,
      sortOrder: sort_order ? Number(sort_order) : undefined,
    });

    res.status(201);
    return successResponse(res, vipPackage, '创建VIP套餐成功');
  } catch (error: any) {
    logger.error('创建VIP套餐失败:', error);
    return errorResponse(res, error.message || '创建VIP套餐失败', 500);
  }
};

/**
 * 更新VIP套餐（管理员）
 */
export const updateVipPackage = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { packageId } = req.params;
    const updateData: any = {};

    // 支持camelCase和snake_case两种格式
    const packageName = req.body.package_name || req.body.packageName;
    const durationDays = req.body.duration_days || req.body.durationDays;
    const originalPrice = req.body.original_price || req.body.originalPrice;
    const currentPrice = req.body.current_price || req.body.currentPrice;
    const description = req.body.description;
    const sortOrder = req.body.sort_order ?? req.body.sortOrder;
    const status = req.body.status;

    if (packageName) updateData.packageName = packageName;
    if (durationDays) updateData.durationDays = Number(durationDays);
    if (originalPrice !== undefined) updateData.originalPrice = Number(originalPrice);
    if (currentPrice !== undefined) updateData.currentPrice = Number(currentPrice);
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
    if (status !== undefined) updateData.status = Number(status);

    const vipPackage = await vipPackageService.updatePackage(packageId, updateData);

    return successResponse(res, vipPackage, '更新VIP套餐成功');
  } catch (error: any) {
    logger.error('更新VIP套餐失败:', error);
    return errorResponse(res, error.message || '更新VIP套餐失败', 500);
  }
};

/**
 * 删除VIP套餐（管理员）
 */
export const deleteVipPackage = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { packageId } = req.params;

    await vipPackageService.deletePackage(packageId);

    return successResponse(res, null, '删除VIP套餐成功');
  } catch (error: any) {
    logger.error('删除VIP套餐失败:', error);
    return errorResponse(res, error.message || '删除VIP套餐失败', 500);
  }
};

/**
 * 获取所有VIP特权（管理员）
 */
export const getAllVipPrivileges = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const privileges = await vipPrivilegeService.getAllPrivileges();

    return successResponse(res, privileges, '获取VIP特权列表成功');
  } catch (error) {
    logger.error('获取VIP特权列表失败:', error);
    return errorResponse(res, '获取VIP特权列表失败', 500);
  }
};

/**
 * 更新VIP特权配置（管理员）
 */
export const updateVipPrivilege = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { privilegeId } = req.params;
    const updateData: any = {};

    // 支持camelCase和snake_case两种格式
    const privilegeName = req.body.privilege_name || req.body.privilegeName;
    const privilegeType = req.body.privilege_type || req.body.privilegeType;
    const privilegeValue = req.body.privilege_value || req.body.privilegeValue;
    const description = req.body.description;
    const sortOrder = req.body.sort_order ?? req.body.sortOrder;
    const isEnabled = req.body.is_enabled ?? req.body.isEnabled;

    if (privilegeName) updateData.privilegeName = privilegeName;
    if (privilegeType) updateData.privilegeType = privilegeType;
    if (privilegeValue) updateData.privilegeValue = privilegeValue;
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;

    const privilege = await vipPrivilegeService.updatePrivilege(privilegeId, updateData);

    return successResponse(res, privilege, '更新VIP特权成功');
  } catch (error: any) {
    logger.error('更新VIP特权失败:', error);
    return errorResponse(res, error.message || '更新VIP特权失败', 500);
  }
};

/**
 * 手动调整用户VIP（管理员）
 */
export const adjustUserVip = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { vip_level, vip_expire_at } = req.body;

    if (vip_level === undefined) {
      return errorResponse(res, '缺少VIP等级参数', 400);
    }

    const expireAt = vip_expire_at ? new Date(vip_expire_at) : null;

    // 直接更新用户VIP信息
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.users.update({
      where: { user_id: userId },
      data: {
        vip_level: Number(vip_level),
        vip_expire_at: expireAt,
        updated_at: new Date(),
      },
    });

    return successResponse(res, { userId, vipLevel: vip_level, vipExpireAt: expireAt }, '调整用户VIP成功');
  } catch (error: any) {
    logger.error('调整用户VIP失败:', error);
    return errorResponse(res, error.message || '调整用户VIP失败', 500);
  }
};


/**
 * 获取VIP订单列表（管理员）
 */
export const getVipOrders = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const {
      pageNum = 1,
      pageSize = 10,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
    } = req.query;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // 构建查询条件
    const where: any = {
      order_type: 'vip', // 只查询VIP订单
    };

    if (paymentStatus !== undefined && paymentStatus !== '') {
      where.payment_status = Number(paymentStatus);
    }

    if (paymentMethod) {
      where.payment_method = paymentMethod;
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.created_at.lte = end;
      }
    }

    // 查询总数
    const total = await prisma.orders.count({ where });

    // 查询列表
    const orders = await prisma.orders.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (Number(pageNum) - 1) * Number(pageSize),
      take: Number(pageSize),
      include: {
        users: {
          select: {
            user_id: true,
            nickname: true,
            phone: true,
          },
        },
      },
    });

    // 转换字段名
    const list = orders.map((order) => ({
      orderId: order.order_id,
      orderNo: order.order_no,
      userId: order.user_id,
      userName: order.users?.nickname || order.users?.phone || '-',
      packageId: order.product_type === 'vip' ? order.order_id : null,
      packageName: order.product_name,
      amount: Number(order.amount),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      transactionId: order.transaction_id,
      paidAt: order.paid_at,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));

    return successResponse(res, { list, total, pageNum: Number(pageNum), pageSize: Number(pageSize) }, '获取VIP订单列表成功');
  } catch (error) {
    logger.error('获取VIP订单列表失败:', error);
    return errorResponse(res, '获取VIP订单列表失败', 500);
  }
};

/**
 * 获取VIP订单详情（管理员）
 */
export const getVipOrderById = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { orderId } = req.params;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const order = await prisma.orders.findUnique({
      where: { order_id: orderId },
      include: {
        users: {
          select: {
            user_id: true,
            nickname: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return errorResponse(res, '订单不存在', 404);
    }

    const result = {
      orderId: order.order_id,
      orderNo: order.order_no,
      userId: order.user_id,
      userName: order.users?.nickname || order.users?.phone || '-',
      packageName: order.product_name,
      amount: Number(order.amount),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      transactionId: order.transaction_id,
      paidAt: order.paid_at,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };

    return successResponse(res, result, '获取VIP订单详情成功');
  } catch (error) {
    logger.error('获取VIP订单详情失败:', error);
    return errorResponse(res, '获取VIP订单详情失败', 500);
  }
};

/**
 * VIP订单退款（管理员）
 */
export const refundVipOrder = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return errorResponse(res, '请提供退款原因', 400);
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const order = await prisma.orders.findUnique({
      where: { order_id: orderId },
    });

    if (!order) {
      return errorResponse(res, '订单不存在', 404);
    }

    if (order.payment_status !== 1) {
      return errorResponse(res, '只有已支付的订单才能退款', 400);
    }

    // 更新订单状态为已退款
    await prisma.orders.update({
      where: { order_id: orderId },
      data: {
        payment_status: 2, // 已退款
        updated_at: new Date(),
      },
    });

    // 如果是VIP订单，需要取消用户的VIP状态
    if (order.order_type === 'vip' && order.user_id) {
      await prisma.users.update({
        where: { user_id: order.user_id },
        data: {
          vip_level: 0,
          vip_expire_at: null,
          updated_at: new Date(),
        },
      });
    }

    logger.info(`VIP订单退款成功: ${orderId}, 原因: ${reason}`);
    return successResponse(res, null, '退款成功');
  } catch (error) {
    logger.error('VIP订单退款失败:', error);
    return errorResponse(res, '退款失败', 500);
  }
};

/**
 * 获取VIP统计数据（管理员）
 */
export const getVipStatistics = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // VIP用户总数
    const totalVipUsers = await prisma.users.count({
      where: {
        vip_level: { gt: 0 },
        vip_expire_at: { gt: now },
      },
    });

    // 今日新增VIP用户（通过订单统计）
    const todayNewVipUsers = await prisma.orders.count({
      where: {
        order_type: 'vip',
        payment_status: 1,
        paid_at: { gte: todayStart },
      },
    });

    // 本月新增VIP用户
    const monthNewVipUsers = await prisma.orders.count({
      where: {
        order_type: 'vip',
        payment_status: 1,
        paid_at: { gte: monthStart },
      },
    });

    // 累计收入
    const totalRevenueResult = await prisma.orders.aggregate({
      where: {
        order_type: 'vip',
        payment_status: 1,
      },
      _sum: { amount: true },
    });
    const totalRevenue = Number(totalRevenueResult._sum.amount || 0);

    // 今日收入
    const todayRevenueResult = await prisma.orders.aggregate({
      where: {
        order_type: 'vip',
        payment_status: 1,
        paid_at: { gte: todayStart },
      },
      _sum: { amount: true },
    });
    const todayRevenue = Number(todayRevenueResult._sum.amount || 0);

    // 本月收入
    const monthRevenueResult = await prisma.orders.aggregate({
      where: {
        order_type: 'vip',
        payment_status: 1,
        paid_at: { gte: monthStart },
      },
      _sum: { amount: true },
    });
    const monthRevenue = Number(monthRevenueResult._sum.amount || 0);

    // 套餐销量统计
    const packageSalesRaw = await prisma.orders.groupBy({
      by: ['product_name'],
      where: {
        order_type: 'vip',
        payment_status: 1,
      },
      _count: { order_id: true },
    });
    const packageSales = packageSalesRaw.map((item) => ({
      packageName: item.product_name,
      salesCount: item._count.order_id,
    }));

    // 用户增长趋势（最近30天）
    const userGrowthTrend: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await prisma.orders.count({
        where: {
          order_type: 'vip',
          payment_status: 1,
          paid_at: { gte: dayStart, lt: dayEnd },
        },
      });

      userGrowthTrend.push({
        date: dayStart.toISOString().split('T')[0],
        count,
      });
    }

    // 收入趋势（最近30天）
    const revenueTrend: Array<{ date: string; amount: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const result = await prisma.orders.aggregate({
        where: {
          order_type: 'vip',
          payment_status: 1,
          paid_at: { gte: dayStart, lt: dayEnd },
        },
        _sum: { amount: true },
      });

      revenueTrend.push({
        date: dayStart.toISOString().split('T')[0],
        amount: Number(result._sum.amount || 0),
      });
    }

    const statistics = {
      totalVipUsers,
      todayNewVipUsers,
      monthNewVipUsers,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      packageSales,
      userGrowthTrend,
      revenueTrend,
    };

    return successResponse(res, statistics, '获取VIP统计数据成功');
  } catch (error) {
    logger.error('获取VIP统计数据失败:', error);
    return errorResponse(res, '获取VIP统计数据失败', 500);
  }
};
