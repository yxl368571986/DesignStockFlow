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

    if (req.body.package_name) updateData.packageName = req.body.package_name;
    if (req.body.duration_days) updateData.durationDays = Number(req.body.duration_days);
    if (req.body.original_price) updateData.originalPrice = Number(req.body.original_price);
    if (req.body.current_price) updateData.currentPrice = Number(req.body.current_price);
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.sort_order !== undefined) updateData.sortOrder = Number(req.body.sort_order);
    if (req.body.status !== undefined) updateData.status = Number(req.body.status);

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

    if (req.body.privilege_name) updateData.privilegeName = req.body.privilege_name;
    if (req.body.privilege_type) updateData.privilegeType = req.body.privilege_type;
    if (req.body.privilege_value) updateData.privilegeValue = req.body.privilege_value;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.sort_order !== undefined) updateData.sortOrder = Number(req.body.sort_order);
    if (req.body.is_enabled !== undefined) updateData.isEnabled = req.body.is_enabled;

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
