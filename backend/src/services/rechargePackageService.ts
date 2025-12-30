/**
 * 充值套餐管理服务
 * 提供充值套餐的CRUD操作和性价比计算功能
 */

import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

// 套餐数据接口
export interface RechargePackageData {
  packageName: string;
  packageCode: string;
  price: number;
  basePoints: number;
  bonusPoints: number;
  sortOrder?: number;
  isRecommend?: boolean;
  status?: number;
}

// 套餐响应接口
export interface RechargePackageResponse {
  packageId: string;
  packageName: string;
  packageCode: string;
  price: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  bonusRate: number;
  valuePerYuan: number;
  sortOrder: number;
  isRecommend: boolean;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

// 验证错误类
export class PackageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PackageValidationError';
  }
}

/**
 * 验证套餐数据
 */
export function validatePackageData(data: RechargePackageData): void {
  // 验证套餐名称
  if (!data.packageName || data.packageName.trim().length === 0) {
    throw new PackageValidationError('套餐名称不能为空');
  }
  if (data.packageName.length > 50) {
    throw new PackageValidationError('套餐名称不能超过50个字符');
  }

  // 验证套餐编码
  if (!data.packageCode || data.packageCode.trim().length === 0) {
    throw new PackageValidationError('套餐编码不能为空');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(data.packageCode)) {
    throw new PackageValidationError('套餐编码只能包含字母、数字、下划线和连字符');
  }

  // 验证价格
  if (typeof data.price !== 'number' || data.price <= 0) {
    throw new PackageValidationError('价格必须为正数');
  }

  // 验证基础积分 = 价格 × 10
  const expectedBasePoints = Math.round(data.price * 10);
  if (data.basePoints !== expectedBasePoints) {
    throw new PackageValidationError(`基础积分必须等于价格×10，期望值: ${expectedBasePoints}`);
  }

  // 验证赠送积分
  if (typeof data.bonusPoints !== 'number' || data.bonusPoints < 0) {
    throw new PackageValidationError('赠送积分不能为负数');
  }
}

/**
 * 计算套餐性价比信息
 */
export function calculatePackageMetrics(price: number, basePoints: number, bonusPoints: number) {
  const totalPoints = basePoints + bonusPoints;
  const bonusRate = basePoints > 0 ? Number(((bonusPoints / basePoints) * 100).toFixed(2)) : 0;
  const valuePerYuan = price > 0 ? Number((totalPoints / price).toFixed(2)) : 0;
  
  return {
    totalPoints,
    bonusRate,
    valuePerYuan
  };
}

/**
 * 转换数据库记录为响应格式
 */
function toResponse(record: Prisma.recharge_packagesGetPayload<object>): RechargePackageResponse {
  const metrics = calculatePackageMetrics(
    Number(record.price),
    record.base_points,
    record.bonus_points
  );
  
  return {
    packageId: record.package_id,
    packageName: record.package_name,
    packageCode: record.package_code,
    price: Number(record.price),
    basePoints: record.base_points,
    bonusPoints: record.bonus_points,
    totalPoints: metrics.totalPoints,
    bonusRate: metrics.bonusRate,
    valuePerYuan: metrics.valuePerYuan,
    sortOrder: record.sort_order,
    isRecommend: record.is_recommend,
    status: record.status,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

class RechargePackageService {
  /**
   * 获取可用的充值套餐列表（前端展示用）
   */
  async getAvailablePackages(): Promise<RechargePackageResponse[]> {
    const packages = await prisma.recharge_packages.findMany({
      where: { status: 1 },
      orderBy: { sort_order: 'asc' }
    });
    
    return packages.map(toResponse);
  }

  /**
   * 获取所有套餐列表（管理后台用）
   */
  async getAllPackages(): Promise<RechargePackageResponse[]> {
    const packages = await prisma.recharge_packages.findMany({
      orderBy: { sort_order: 'asc' }
    });
    
    return packages.map(toResponse);
  }

  /**
   * 根据ID获取套餐
   */
  async getPackageById(packageId: string): Promise<RechargePackageResponse | null> {
    const pkg = await prisma.recharge_packages.findUnique({
      where: { package_id: packageId }
    });
    
    return pkg ? toResponse(pkg) : null;
  }

  /**
   * 根据编码获取套餐
   */
  async getPackageByCode(packageCode: string): Promise<RechargePackageResponse | null> {
    const pkg = await prisma.recharge_packages.findUnique({
      where: { package_code: packageCode }
    });
    
    return pkg ? toResponse(pkg) : null;
  }

  /**
   * 创建充值套餐
   */
  async createPackage(data: RechargePackageData): Promise<RechargePackageResponse> {
    // 验证数据
    validatePackageData(data);

    // 检查套餐名称唯一性
    const existingByName = await prisma.recharge_packages.findFirst({
      where: { package_name: data.packageName }
    });
    if (existingByName) {
      throw new PackageValidationError('套餐名称已存在');
    }

    // 检查套餐编码唯一性
    const existingByCode = await prisma.recharge_packages.findUnique({
      where: { package_code: data.packageCode }
    });
    if (existingByCode) {
      throw new PackageValidationError('套餐编码已存在');
    }

    // 计算性价比
    const metrics = calculatePackageMetrics(data.price, data.basePoints, data.bonusPoints);

    // 创建套餐
    const pkg = await prisma.recharge_packages.create({
      data: {
        package_name: data.packageName,
        package_code: data.packageCode,
        price: new Prisma.Decimal(data.price),
        base_points: data.basePoints,
        bonus_points: data.bonusPoints,
        bonus_rate: new Prisma.Decimal(metrics.bonusRate),
        sort_order: data.sortOrder ?? 0,
        is_recommend: data.isRecommend ?? false,
        status: data.status ?? 1
      }
    });

    return toResponse(pkg);
  }

  /**
   * 更新充值套餐
   */
  async updatePackage(packageId: string, data: Partial<RechargePackageData>): Promise<RechargePackageResponse> {
    // 检查套餐是否存在
    const existing = await prisma.recharge_packages.findUnique({
      where: { package_id: packageId }
    });
    if (!existing) {
      throw new PackageValidationError('套餐不存在');
    }

    // 构建更新数据
    const updateData: Prisma.recharge_packagesUpdateInput = {
      updated_at: new Date()
    };

    // 如果更新名称，检查唯一性
    if (data.packageName !== undefined) {
      if (!data.packageName || data.packageName.trim().length === 0) {
        throw new PackageValidationError('套餐名称不能为空');
      }
      const existingByName = await prisma.recharge_packages.findFirst({
        where: {
          package_name: data.packageName,
          package_id: { not: packageId }
        }
      });
      if (existingByName) {
        throw new PackageValidationError('套餐名称已存在');
      }
      updateData.package_name = data.packageName;
    }

    // 如果更新价格或积分，需要重新验证和计算
    if (data.price !== undefined || data.basePoints !== undefined || data.bonusPoints !== undefined) {
      const price = data.price ?? Number(existing.price);
      const basePoints = data.basePoints ?? existing.base_points;
      const bonusPoints = data.bonusPoints ?? existing.bonus_points;

      // 验证价格
      if (price <= 0) {
        throw new PackageValidationError('价格必须为正数');
      }

      // 验证基础积分
      const expectedBasePoints = Math.round(price * 10);
      if (basePoints !== expectedBasePoints) {
        throw new PackageValidationError(`基础积分必须等于价格×10，期望值: ${expectedBasePoints}`);
      }

      // 验证赠送积分
      if (bonusPoints < 0) {
        throw new PackageValidationError('赠送积分不能为负数');
      }

      // 计算性价比
      const metrics = calculatePackageMetrics(price, basePoints, bonusPoints);

      updateData.price = new Prisma.Decimal(price);
      updateData.base_points = basePoints;
      updateData.bonus_points = bonusPoints;
      updateData.bonus_rate = new Prisma.Decimal(metrics.bonusRate);
    }

    // 更新其他字段
    if (data.sortOrder !== undefined) {
      updateData.sort_order = data.sortOrder;
    }
    if (data.isRecommend !== undefined) {
      updateData.is_recommend = data.isRecommend;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const pkg = await prisma.recharge_packages.update({
      where: { package_id: packageId },
      data: updateData
    });

    return toResponse(pkg);
  }

  /**
   * 禁用套餐
   */
  async disablePackage(packageId: string): Promise<RechargePackageResponse> {
    const existing = await prisma.recharge_packages.findUnique({
      where: { package_id: packageId }
    });
    if (!existing) {
      throw new PackageValidationError('套餐不存在');
    }

    const pkg = await prisma.recharge_packages.update({
      where: { package_id: packageId },
      data: {
        status: 0,
        updated_at: new Date()
      }
    });

    return toResponse(pkg);
  }

  /**
   * 启用套餐
   */
  async enablePackage(packageId: string): Promise<RechargePackageResponse> {
    const existing = await prisma.recharge_packages.findUnique({
      where: { package_id: packageId }
    });
    if (!existing) {
      throw new PackageValidationError('套餐不存在');
    }

    const pkg = await prisma.recharge_packages.update({
      where: { package_id: packageId },
      data: {
        status: 1,
        updated_at: new Date()
      }
    });

    return toResponse(pkg);
  }

  /**
   * 更新套餐排序
   */
  async updateSortOrder(packageId: string, sortOrder: number): Promise<RechargePackageResponse> {
    const existing = await prisma.recharge_packages.findUnique({
      where: { package_id: packageId }
    });
    if (!existing) {
      throw new PackageValidationError('套餐不存在');
    }

    const pkg = await prisma.recharge_packages.update({
      where: { package_id: packageId },
      data: {
        sort_order: sortOrder,
        updated_at: new Date()
      }
    });

    return toResponse(pkg);
  }

  /**
   * 批量更新套餐排序
   */
  async batchUpdateSortOrder(items: { packageId: string; sortOrder: number }[]): Promise<void> {
    await prisma.$transaction(
      items.map(item =>
        prisma.recharge_packages.update({
          where: { package_id: item.packageId },
          data: {
            sort_order: item.sortOrder,
            updated_at: new Date()
          }
        })
      )
    );
  }

  /**
   * 初始化默认套餐（如果不存在）
   */
  async initDefaultPackages(): Promise<void> {
    const count = await prisma.recharge_packages.count();
    if (count > 0) {
      return; // 已有套餐，不初始化
    }

    const defaultPackages: RechargePackageData[] = [
      {
        packageName: '体验套餐',
        packageCode: 'experience',
        price: 10,
        basePoints: 100,
        bonusPoints: 10,
        sortOrder: 1,
        isRecommend: false
      },
      {
        packageName: '进阶套餐',
        packageCode: 'advanced',
        price: 50,
        basePoints: 500,
        bonusPoints: 100,
        sortOrder: 2,
        isRecommend: true
      },
      {
        packageName: '尊享套餐',
        packageCode: 'premium',
        price: 100,
        basePoints: 1000,
        bonusPoints: 250,
        sortOrder: 3,
        isRecommend: false
      }
    ];

    for (const pkg of defaultPackages) {
      await this.createPackage(pkg);
    }
  }
}

export const rechargePackageService = new RechargePackageService();
export default rechargePackageService;
