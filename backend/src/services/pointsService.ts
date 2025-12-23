import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

// 用户等级配置
const USER_LEVELS = [
  { level: 1, name: 'LV1 新手', minPoints: 0, maxPoints: 499, discount: 0, privileges: ['基础功能'] },
  { level: 2, name: 'LV2 初级', minPoints: 500, maxPoints: 1999, discount: 0.05, privileges: ['下载资源-5%积分消耗'] },
  { level: 3, name: 'LV3 中级', minPoints: 2000, maxPoints: 4999, discount: 0.10, privileges: ['下载资源-10%积分消耗', '专属等级徽章'] },
  { level: 4, name: 'LV4 高级', minPoints: 5000, maxPoints: 9999, discount: 0.15, privileges: ['下载资源-15%积分消耗', '作品优先展示'] },
  { level: 5, name: 'LV5 专家', minPoints: 10000, maxPoints: 19999, discount: 0.20, privileges: ['下载资源-20%积分消耗', '专属客服'] },
  { level: 6, name: 'LV6 大师', minPoints: 20000, maxPoints: Infinity, discount: 0.30, privileges: ['下载资源-30%积分消耗', '所有特权'] }
];

/**
 * 根据累计积分计算用户等级
 */
export function calculateUserLevel(totalPoints: number): number {
  for (const levelConfig of USER_LEVELS) {
    if (totalPoints >= levelConfig.minPoints && totalPoints <= levelConfig.maxPoints) {
      return levelConfig.level;
    }
  }
  return 1;
}

/**
 * 获取等级配置信息
 */
export function getLevelConfig(level: number) {
  return USER_LEVELS.find(l => l.level === level) || USER_LEVELS[0];
}

/**
 * 获取下一等级所需积分
 */
export function getNextLevelPoints(currentLevel: number, currentTotalPoints: number): number | null {
  if (currentLevel >= 6) {
    return null;
  }
  const nextLevel = USER_LEVELS.find(l => l.level === currentLevel + 1);
  return nextLevel ? nextLevel.minPoints - currentTotalPoints : null;
}

/**
 * 获取用户积分信息
 */
export async function getUserPointsInfo(userId: string) {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: {
      points_balance: true,
      points_total: true,
      user_level: true,
    },
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  const levelConfig = getLevelConfig(user.user_level);
  const nextLevelPoints = getNextLevelPoints(user.user_level, user.points_total);

  return {
    pointsBalance: user.points_balance,
    pointsTotal: user.points_total,
    userLevel: user.user_level,
    levelName: levelConfig.name,
    levelDiscount: levelConfig.discount,
    levelPrivileges: levelConfig.privileges,
    nextLevelPoints,
  };
}

/**
 * 获取积分明细记录
 */
export async function getPointsRecords(userId: string, options: {
  page?: number;
  pageSize?: number;
  changeType?: string;
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const { page = 1, pageSize = 20, changeType, startDate, endDate } = options;

  const where: any = { user_id: userId };

  if (changeType) {
    where.change_type = changeType;
  }

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      where.created_at.gte = startDate;
    }
    if (endDate) {
      where.created_at.lte = endDate;
    }
  }

  const [records, total] = await Promise.all([
    prisma.points_records.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.points_records.count({ where }),
  ]);

  return {
    list: records.map(record => ({
      recordId: record.record_id,
      pointsChange: record.points_change,
      pointsBalance: record.points_balance,
      changeType: record.change_type,
      source: record.source,
      sourceId: record.source_id,
      description: record.description,
      createdAt: record.created_at,
    })),
    total,
    pageNum: page,
    pageSize,
  };
}

/**
 * 增加用户积分
 */
export async function addPoints(userId: string, points: number, data: {
  changeType: string;
  source: string;
  sourceId?: string;
  description?: string;
}) {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { points_balance: true, points_total: true, user_level: true },
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  const newBalance = user.points_balance + points;
  const newTotal = user.points_total + points;
  const newLevel = calculateUserLevel(newTotal);

  // 更新用户积分
  await prisma.users.update({
    where: { user_id: userId },
    data: {
      points_balance: newBalance,
      points_total: newTotal,
      user_level: newLevel,
      updated_at: new Date(),
    },
  });

  // 记录积分变动
  await prisma.points_records.create({
    data: {
      user_id: userId,
      points_change: points,
      points_balance: newBalance,
      change_type: data.changeType,
      source: data.source,
      source_id: data.sourceId,
      description: data.description,
    },
  });

  logger.info(`用户 ${userId} 获得 ${points} 积分，来源: ${data.source}`);

  return {
    pointsBalance: newBalance,
    pointsTotal: newTotal,
    userLevel: newLevel,
  };
}

/**
 * 扣除用户积分
 */
export async function deductPoints(userId: string, points: number, data: {
  changeType: string;
  source: string;
  sourceId?: string;
  description?: string;
}) {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { points_balance: true },
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  if (user.points_balance < points) {
    throw new Error('积分不足');
  }

  const newBalance = user.points_balance - points;

  // 更新用户积分
  await prisma.users.update({
    where: { user_id: userId },
    data: {
      points_balance: newBalance,
      updated_at: new Date(),
    },
  });

  // 记录积分变动
  await prisma.points_records.create({
    data: {
      user_id: userId,
      points_change: -points,
      points_balance: newBalance,
      change_type: data.changeType,
      source: data.source,
      source_id: data.sourceId,
      description: data.description,
    },
  });

  logger.info(`用户 ${userId} 消耗 ${points} 积分，来源: ${data.source}`);

  return {
    pointsBalance: newBalance,
  };
}

/**
 * 获取积分规则列表
 */
export async function getPointsRules() {
  const rules = await prisma.points_rules.findMany({
    where: { is_enabled: true },
    orderBy: { rule_type: 'asc' },
  });

  return rules.map(rule => ({
    ruleId: rule.rule_id,
    ruleName: rule.rule_name,
    ruleCode: rule.rule_code,
    ruleType: rule.rule_type,
    pointsValue: rule.points_value,
    description: rule.description,
  }));
}

/**
 * 获取积分商品列表
 */
export async function getPointsProducts(options: {
  page?: number;
  pageSize?: number;
  productType?: string;
} = {}) {
  const { page = 1, pageSize = 20, productType } = options;

  const where: any = { status: 1 };
  if (productType) {
    where.product_type = productType;
  }

  const [products, total] = await Promise.all([
    prisma.points_products.findMany({
      where,
      orderBy: { sort_order: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.points_products.count({ where }),
  ]);

  return {
    list: products.map(product => ({
      productId: product.product_id,
      productName: product.product_name,
      productType: product.product_type,
      productCode: product.product_code,
      pointsRequired: product.points_required,
      productValue: product.product_value,
      stock: product.stock,
      imageUrl: product.image_url,
      description: product.description,
    })),
    total,
    page,
    pageSize,
  };
}

/**
 * 兑换积分商品
 */
export async function exchangeProduct(userId: string, productId: string, deliveryAddress?: string) {
  const product = await prisma.points_products.findUnique({
    where: { product_id: productId },
  });

  if (!product) {
    throw new Error('商品不存在');
  }

  if (product.status !== 1) {
    throw new Error('商品已下架');
  }

  if (product.stock !== -1 && product.stock <= 0) {
    throw new Error('商品库存不足');
  }

  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { points_balance: true },
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  if (user.points_balance < product.points_required) {
    throw new Error('积分不足');
  }

  // 扣除积分
  const newBalance = user.points_balance - product.points_required;
  await prisma.users.update({
    where: { user_id: userId },
    data: {
      points_balance: newBalance,
      updated_at: new Date(),
    },
  });

  // 记录积分消耗
  await prisma.points_records.create({
    data: {
      user_id: userId,
      points_change: -product.points_required,
      points_balance: newBalance,
      change_type: 'exchange',
      source: 'points_exchange',
      source_id: productId,
      description: `兑换商品: ${product.product_name}`,
    },
  });

  // 创建兑换记录
  const exchange = await prisma.points_exchange_records.create({
    data: {
      user_id: userId,
      product_id: productId,
      product_name: product.product_name,
      product_type: product.product_type,
      points_cost: product.points_required,
      delivery_status: 0,
      delivery_address: deliveryAddress,
    },
  });

  // 更新库存
  if (product.stock !== -1) {
    await prisma.points_products.update({
      where: { product_id: productId },
      data: {
        stock: { decrement: 1 },
        updated_at: new Date(),
      },
    });
  }

  logger.info(`用户 ${userId} 兑换商品 ${product.product_name}，消耗 ${product.points_required} 积分`);

  return {
    exchangeId: exchange.exchange_id,
    productName: product.product_name,
    pointsCost: product.points_required,
    pointsBalance: newBalance,
  };
}

/**
 * 获取用户兑换记录
 */
export async function getExchangeRecords(userId: string, options: {
  page?: number;
  pageSize?: number;
} = {}) {
  const { page = 1, pageSize = 20 } = options;

  const [records, total] = await Promise.all([
    prisma.points_exchange_records.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.points_exchange_records.count({ where: { user_id: userId } }),
  ]);

  return {
    list: records.map(record => ({
      exchangeId: record.exchange_id,
      productName: record.product_name,
      productType: record.product_type,
      pointsCost: record.points_cost,
      deliveryStatus: record.delivery_status,
      deliveryAddress: record.delivery_address,
      trackingNumber: record.tracking_number,
      createdAt: record.created_at,
    })),
    total,
    page,
    pageSize,
  };
}

/**
 * 获取每日任务列表
 */
export async function getDailyTasks(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 获取所有启用的任务
  const tasks = await prisma.daily_tasks.findMany({
    where: { is_enabled: true },
    orderBy: { sort_order: 'asc' },
  });

  // 获取用户今日任务完成情况
  const userTasks = await prisma.user_tasks.findMany({
    where: {
      user_id: userId,
      task_date: today,
    },
  });

  const userTaskMap = new Map(userTasks.map(ut => [ut.task_id, ut]));

  return tasks.map(task => {
    const userTask = userTaskMap.get(task.task_id);
    return {
      taskId: task.task_id,
      taskName: task.task_name,
      taskCode: task.task_code,
      taskType: task.task_type,
      pointsReward: task.points_reward,
      targetCount: task.target_count,
      description: task.description,
      completedCount: userTask?.completed_count || 0,
      isCompleted: userTask?.is_completed || false,
    };
  });
}

/**
 * 完成每日任务
 */
export async function completeDailyTask(userId: string, taskCode: string) {
  const task = await prisma.daily_tasks.findUnique({
    where: { task_code: taskCode },
  });

  if (!task) {
    throw new Error('任务不存在');
  }

  if (!task.is_enabled) {
    throw new Error('任务已禁用');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 查找或创建用户任务记录
  let userTask = await prisma.user_tasks.findFirst({
    where: {
      user_id: userId,
      task_id: task.task_id,
      task_date: today,
    },
  });

  if (userTask?.is_completed) {
    throw new Error('任务已完成');
  }

  const newCompletedCount = (userTask?.completed_count || 0) + 1;
  const isCompleted = newCompletedCount >= task.target_count;

  if (userTask) {
    // 更新任务进度
    await prisma.user_tasks.update({
      where: { record_id: userTask.record_id },
      data: {
        completed_count: newCompletedCount,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date() : null,
        updated_at: new Date(),
      },
    });
  } else {
    // 创建任务记录
    await prisma.user_tasks.create({
      data: {
        user_id: userId,
        task_id: task.task_id,
        task_code: taskCode,
        completed_count: newCompletedCount,
        target_count: task.target_count,
        is_completed: isCompleted,
        task_date: today,
        completed_at: isCompleted ? new Date() : null,
      },
    });
  }

  // 如果任务完成，发放积分奖励
  if (isCompleted) {
    await addPoints(userId, task.points_reward, {
      changeType: 'task',
      source: 'daily_task',
      sourceId: task.task_id,
      description: `完成任务: ${task.task_name}`,
    });

    logger.info(`用户 ${userId} 完成任务 ${task.task_name}，获得 ${task.points_reward} 积分`);
  }

  return {
    taskId: task.task_id,
    taskName: task.task_name,
    completedCount: newCompletedCount,
    targetCount: task.target_count,
    isCompleted,
    pointsReward: isCompleted ? task.points_reward : 0,
  };
}


/**
 * 获取所有积分规则（管理员用）
 */
export async function getAllPointsRules() {
  const rules = await prisma.points_rules.findMany({
    orderBy: { rule_type: 'asc' },
  });

  return rules.map(rule => ({
    ruleId: rule.rule_id,
    ruleName: rule.rule_name,
    ruleCode: rule.rule_code,
    ruleType: rule.rule_type,
    pointsValue: rule.points_value,
    description: rule.description,
    isEnabled: rule.is_enabled,
    createdAt: rule.created_at,
    updatedAt: rule.updated_at,
  }));
}

/**
 * 更新积分规则
 */
export async function updatePointsRule(ruleId: string, data: {
  pointsValue?: number;
  description?: string;
  isEnabled?: boolean;
}) {
  const rule = await prisma.points_rules.findUnique({
    where: { rule_id: ruleId },
  });

  if (!rule) {
    throw new Error('积分规则不存在');
  }

  const updateData: Record<string, unknown> = { updated_at: new Date() };
  if (data.pointsValue !== undefined) updateData.points_value = data.pointsValue;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isEnabled !== undefined) updateData.is_enabled = data.isEnabled;

  const updated = await prisma.points_rules.update({
    where: { rule_id: ruleId },
    data: updateData,
  });

  return {
    ruleId: updated.rule_id,
    ruleName: updated.rule_name,
    ruleCode: updated.rule_code,
    ruleType: updated.rule_type,
    pointsValue: updated.points_value,
    description: updated.description,
    isEnabled: updated.is_enabled,
  };
}

/**
 * 获取所有积分商品（管理员用）
 */
export async function getAllPointsProducts() {
  const products = await prisma.points_products.findMany({
    orderBy: { sort_order: 'asc' },
  });

  return products.map(product => ({
    productId: product.product_id,
    productName: product.product_name,
    productType: product.product_type,
    productCode: product.product_code,
    pointsRequired: product.points_required,
    productValue: product.product_value,
    stock: product.stock,
    imageUrl: product.image_url,
    description: product.description,
    sortOrder: product.sort_order,
    status: product.status,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  }));
}

/**
 * 添加积分商品
 */
export async function addPointsProduct(data: {
  productName: string;
  productType: string;
  productCode: string;
  pointsRequired: number;
  productValue?: string;
  stock?: number;
  imageUrl?: string;
  description?: string;
  sortOrder?: number;
}) {
  // 检查商品代码是否已存在
  const existing = await prisma.points_products.findUnique({
    where: { product_code: data.productCode },
  });

  if (existing) {
    throw new Error('商品代码已存在');
  }

  const product = await prisma.points_products.create({
    data: {
      product_name: data.productName,
      product_type: data.productType,
      product_code: data.productCode,
      points_required: data.pointsRequired,
      product_value: data.productValue,
      stock: data.stock ?? -1,
      image_url: data.imageUrl,
      description: data.description,
      sort_order: data.sortOrder ?? 0,
      status: 1,
    },
  });

  logger.info(`添加积分商品: ${product.product_name}`);

  return {
    productId: product.product_id,
    productName: product.product_name,
    productType: product.product_type,
    productCode: product.product_code,
    pointsRequired: product.points_required,
  };
}

/**
 * 更新积分商品
 */
export async function updatePointsProduct(productId: string, data: {
  productName?: string;
  pointsRequired?: number;
  productValue?: string;
  stock?: number;
  imageUrl?: string;
  description?: string;
  sortOrder?: number;
  status?: number;
}) {
  const product = await prisma.points_products.findUnique({
    where: { product_id: productId },
  });

  if (!product) {
    throw new Error('商品不存在');
  }

  const updateData: Record<string, unknown> = { updated_at: new Date() };
  if (data.productName !== undefined) updateData.product_name = data.productName;
  if (data.pointsRequired !== undefined) updateData.points_required = data.pointsRequired;
  if (data.productValue !== undefined) updateData.product_value = data.productValue;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;
  if (data.status !== undefined) updateData.status = data.status;

  const updated = await prisma.points_products.update({
    where: { product_id: productId },
    data: updateData,
  });

  logger.info(`更新积分商品: ${updated.product_name}`);

  return {
    productId: updated.product_id,
    productName: updated.product_name,
    productType: updated.product_type,
    productCode: updated.product_code,
    pointsRequired: updated.points_required,
    status: updated.status,
  };
}

/**
 * 删除积分商品
 */
export async function deletePointsProduct(productId: string) {
  const product = await prisma.points_products.findUnique({
    where: { product_id: productId },
  });

  if (!product) {
    throw new Error('商品不存在');
  }

  await prisma.points_products.delete({
    where: { product_id: productId },
  });

  logger.info(`删除积分商品: ${product.product_name}`);
}

/**
 * 获取所有兑换记录（管理员用）
 */
export async function getAllExchangeRecords(options: {
  page?: number;
  pageSize?: number;
  deliveryStatus?: number;
} = {}) {
  const { page = 1, pageSize = 20, deliveryStatus } = options;

  const where: Record<string, unknown> = {};
  if (deliveryStatus !== undefined) {
    where.delivery_status = deliveryStatus;
  }

  const [records, total] = await Promise.all([
    prisma.points_exchange_records.findMany({
      where,
      include: {
        users: {
          select: {
            user_id: true,
            nickname: true,
            phone: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.points_exchange_records.count({ where }),
  ]);

  return {
    list: records.map(record => ({
      exchangeId: record.exchange_id,
      userId: record.user_id,
      userName: record.users?.nickname || record.users?.phone,
      productName: record.product_name,
      productType: record.product_type,
      pointsCost: record.points_cost,
      deliveryStatus: record.delivery_status,
      deliveryAddress: record.delivery_address,
      trackingNumber: record.tracking_number,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    })),
    total,
    page,
    pageSize,
  };
}

/**
 * 发货
 */
export async function shipExchangeRecord(exchangeId: string, trackingNumber: string) {
  const record = await prisma.points_exchange_records.findUnique({
    where: { exchange_id: exchangeId },
  });

  if (!record) {
    throw new Error('兑换记录不存在');
  }

  if (record.delivery_status !== 0) {
    throw new Error('该订单已发货或已完成');
  }

  const updated = await prisma.points_exchange_records.update({
    where: { exchange_id: exchangeId },
    data: {
      delivery_status: 1,
      tracking_number: trackingNumber,
      updated_at: new Date(),
    },
  });

  logger.info(`兑换订单 ${exchangeId} 已发货，物流单号: ${trackingNumber}`);

  return {
    exchangeId: updated.exchange_id,
    deliveryStatus: updated.delivery_status,
    trackingNumber: updated.tracking_number,
  };
}

/**
 * 获取积分统计
 */
export async function getPointsStatistics() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 今日发放积分
  const todayEarned = await prisma.points_records.aggregate({
    where: {
      created_at: { gte: today },
      points_change: { gt: 0 },
    },
    _sum: { points_change: true },
  });

  // 今日消耗积分
  const todaySpent = await prisma.points_records.aggregate({
    where: {
      created_at: { gte: today },
      points_change: { lt: 0 },
    },
    _sum: { points_change: true },
  });

  // 本月发放积分
  const monthEarned = await prisma.points_records.aggregate({
    where: {
      created_at: { gte: thisMonth },
      points_change: { gt: 0 },
    },
    _sum: { points_change: true },
  });

  // 本月消耗积分
  const monthSpent = await prisma.points_records.aggregate({
    where: {
      created_at: { gte: thisMonth },
      points_change: { lt: 0 },
    },
    _sum: { points_change: true },
  });

  // 总积分余额
  const totalBalance = await prisma.users.aggregate({
    _sum: { points_balance: true },
  });

  // 待发货订单数
  const pendingShipments = await prisma.points_exchange_records.count({
    where: { delivery_status: 0 },
  });

  return {
    todayEarned: todayEarned._sum.points_change || 0,
    todaySpent: Math.abs(todaySpent._sum.points_change || 0),
    monthEarned: monthEarned._sum.points_change || 0,
    monthSpent: Math.abs(monthSpent._sum.points_change || 0),
    totalBalance: totalBalance._sum.points_balance || 0,
    pendingShipments,
  };
}

/**
 * 手动调整用户积分
 */
export async function adjustUserPoints(
  userId: string,
  pointsChange: number,
  reason: string,
  adminId: string
) {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { points_balance: true, points_total: true, user_level: true },
  });

  if (!user) {
    throw new Error('用户不存在');
  }

  const newBalance = user.points_balance + pointsChange;
  if (newBalance < 0) {
    throw new Error('调整后积分不能为负数');
  }

  let newTotal = user.points_total;
  if (pointsChange > 0) {
    newTotal += pointsChange;
  }
  const newLevel = calculateUserLevel(newTotal);

  // 更新用户积分
  await prisma.users.update({
    where: { user_id: userId },
    data: {
      points_balance: newBalance,
      points_total: newTotal,
      user_level: newLevel,
      updated_at: new Date(),
    },
  });

  // 记录积分变动
  await prisma.points_records.create({
    data: {
      user_id: userId,
      points_change: pointsChange,
      points_balance: newBalance,
      change_type: pointsChange > 0 ? 'admin_add' : 'admin_deduct',
      source: 'admin_adjust',
      source_id: adminId,
      description: reason,
    },
  });

  logger.info(`管理员 ${adminId} 调整用户 ${userId} 积分 ${pointsChange}，原因: ${reason}`);

  return {
    userId,
    pointsChange,
    pointsBalance: newBalance,
    pointsTotal: newTotal,
    userLevel: newLevel,
  };
}
