/**
 * 初始化充值套餐数据脚本
 * 运行: npx ts-node scripts/init-recharge-packages.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface PackageData {
  packageName: string;
  packageCode: string;
  price: number;
  basePoints: number;
  bonusPoints: number;
  sortOrder: number;
  isRecommend: boolean;
}

// 默认充值套餐配置
const defaultPackages: PackageData[] = [
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
    packageName: '基础套餐',
    packageCode: 'basic',
    price: 30,
    basePoints: 300,
    bonusPoints: 50,
    sortOrder: 2,
    isRecommend: false
  },
  {
    packageName: '进阶套餐',
    packageCode: 'advanced',
    price: 50,
    basePoints: 500,
    bonusPoints: 100,
    sortOrder: 3,
    isRecommend: true
  },
  {
    packageName: '专业套餐',
    packageCode: 'professional',
    price: 100,
    basePoints: 1000,
    bonusPoints: 250,
    sortOrder: 4,
    isRecommend: false
  },
  {
    packageName: '尊享套餐',
    packageCode: 'premium',
    price: 200,
    basePoints: 2000,
    bonusPoints: 600,
    sortOrder: 5,
    isRecommend: false
  },
  {
    packageName: '至尊套餐',
    packageCode: 'ultimate',
    price: 500,
    basePoints: 5000,
    bonusPoints: 2000,
    sortOrder: 6,
    isRecommend: false
  }
];

async function initPackages() {
  console.log('开始初始化充值套餐...');
  
  // 检查是否已有套餐
  const existingCount = await prisma.recharge_packages.count();
  if (existingCount > 0) {
    console.log(`数据库中已有 ${existingCount} 个套餐，跳过初始化`);
    return;
  }

  for (const pkg of defaultPackages) {
    const totalPoints = pkg.basePoints + pkg.bonusPoints;
    const bonusRate = (pkg.bonusPoints / pkg.basePoints) * 100;
    
    await prisma.recharge_packages.create({
      data: {
        package_name: pkg.packageName,
        package_code: pkg.packageCode,
        price: new Prisma.Decimal(pkg.price),
        base_points: pkg.basePoints,
        bonus_points: pkg.bonusPoints,
        bonus_rate: new Prisma.Decimal(bonusRate),
        sort_order: pkg.sortOrder,
        is_recommend: pkg.isRecommend,
        status: 1
      }
    });
    
    console.log(`✓ 创建套餐: ${pkg.packageName} (¥${pkg.price} = ${totalPoints}积分)`);
  }

  console.log('\n充值套餐初始化完成！');
}

async function main() {
  try {
    await initPackages();
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
