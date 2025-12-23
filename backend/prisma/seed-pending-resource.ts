/**
 * 创建待审核测试资源
 * 用于测试上传资源获得积分功能
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建待审核测试资源...\n');

  // 获取创作者A用户
  const creator = await prisma.users.findUnique({
    where: { phone: '13800000004' }
  });

  if (!creator) {
    console.error('❌ 未找到创作者A用户（13800000004），请先运行 seed.ts');
    return;
  }

  console.log(`找到创作者: ${creator.nickname} (${creator.phone})`);
  console.log(`当前积分余额: ${creator.points_balance}`);
  console.log(`累计积分: ${creator.points_total}\n`);

  // 获取一个分类
  const category = await prisma.categories.findFirst();
  if (!category) {
    console.error('❌ 未找到分类，请先运行 seed.ts');
    return;
  }

  // 创建待审核资源
  const resourceTitle = `测试上传资源_${Date.now()}`;
  
  try {
    const resource = await prisma.resources.create({
      data: {
        title: resourceTitle,
        description: '这是一个用于测试上传积分奖励的待审核资源',
        cover: '/covers/test-pending.jpg',
        file_url: '/files/test/test-pending-resource.zip',
        file_name: 'test-pending-resource.zip',
        file_size: BigInt(1024 * 1024 * 5), // 5MB
        file_format: 'ZIP',
        preview_images: ['/previews/test-preview-1.jpg'],
        category_id: category.category_id,
        tags: ['测试', '待审核'],
        vip_level: 0,
        user_id: creator.user_id,
        audit_status: 0, // 待审核
        status: 1,
        download_count: 0,
        view_count: 0,
        like_count: 0,
        collect_count: 0,
        is_top: false,
        is_recommend: false,
      },
    });

    console.log('✅ 成功创建待审核资源:');
    console.log(`   资源ID: ${resource.resource_id}`);
    console.log(`   标题: ${resource.title}`);
    console.log(`   上传者: ${creator.nickname}`);
    console.log(`   审核状态: 待审核 (audit_status=0)`);
    console.log(`   分类: ${category.category_name}`);
    
    console.log('\n========================================');
    console.log('待审核资源创建完成！');
    console.log('========================================');
    console.log('\n现在可以运行E2E测试来验证审核通过后的积分奖励功能');
    console.log('测试命令: npx playwright test e2e/upload-points-reward.spec.ts');
    
  } catch (error) {
    console.error('❌ 创建待审核资源失败:', error);
  }
}

main()
  .catch((e) => {
    console.error('❌ 脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
