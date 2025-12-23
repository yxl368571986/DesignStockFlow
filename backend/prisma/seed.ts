/**
 * 数据库初始化脚本 (Seed Script)
 * 用于初始化基础数据，包括角色、权限、分类、VIP套餐等
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库基础数据...\n');

  // ============================================
  // 1. 初始化角色数据
  // ============================================
  console.log('1. 初始化角色数据...');
  const roles = await Promise.all([
    prisma.roles.upsert({
      where: { role_code: 'super_admin' },
      update: {},
      create: {
        role_name: '超级管理员',
        role_code: 'super_admin',
        description: '拥有所有权限',
      },
    }),
    prisma.roles.upsert({
      where: { role_code: 'moderator' },
      update: {},
      create: {
        role_name: '内容审核员',
        role_code: 'moderator',
        description: '负责内容审核',
      },
    }),
    prisma.roles.upsert({
      where: { role_code: 'operator' },
      update: {},
      create: {
        role_name: '运营人员',
        role_code: 'operator',
        description: '负责内容运营',
      },
    }),
    prisma.roles.upsert({
      where: { role_code: 'user' },
      update: {},
      create: {
        role_name: '普通用户',
        role_code: 'user',
        description: '普通用户权限',
      },
    }),
  ]);
  console.log(`✓ 成功创建 ${roles.length} 个角色\n`);

  // ============================================
  // 2. 初始化权限数据
  // ============================================
  console.log('2. 初始化权限数据...');
  const permissionsData = [
    // 用户管理
    { permission_name: '查看用户', permission_code: 'user:view', module: 'user_manage', description: '查看用户列表和详情' },
    { permission_name: '编辑用户', permission_code: 'user:edit', module: 'user_manage', description: '编辑用户信息' },
    { permission_name: '禁用用户', permission_code: 'user:disable', module: 'user_manage', description: '禁用/启用用户' },
    { permission_name: '删除用户', permission_code: 'user:delete', module: 'user_manage', description: '删除用户' },
    // 资源管理
    { permission_name: '查看资源', permission_code: 'resource:view', module: 'resource_manage', description: '查看资源列表和详情' },
    { permission_name: '编辑资源', permission_code: 'resource:edit', module: 'resource_manage', description: '编辑资源信息' },
    { permission_name: '删除资源', permission_code: 'resource:delete', module: 'resource_manage', description: '删除资源' },
    { permission_name: '置顶资源', permission_code: 'resource:top', module: 'resource_manage', description: '置顶资源' },
    // 内容审核
    { permission_name: '查看待审核', permission_code: 'audit:view', module: 'content_audit', description: '查看待审核内容' },
    { permission_name: '审核通过', permission_code: 'audit:approve', module: 'content_audit', description: '审核通过' },
    { permission_name: '审核驳回', permission_code: 'audit:reject', module: 'content_audit', description: '审核驳回' },
    // 分类管理
    { permission_name: '查看分类', permission_code: 'category:view', module: 'category_manage', description: '查看分类列表' },
    { permission_name: '添加分类', permission_code: 'category:add', module: 'category_manage', description: '添加分类' },
    { permission_name: '编辑分类', permission_code: 'category:edit', module: 'category_manage', description: '编辑分类' },
    { permission_name: '删除分类', permission_code: 'category:delete', module: 'category_manage', description: '删除分类' },
    // 数据统计
    { permission_name: '查看统计', permission_code: 'statistics:view', module: 'data_statistics', description: '查看统计数据' },
    { permission_name: '导出报表', permission_code: 'statistics:export', module: 'data_statistics', description: '导出数据报表' },
    // 内容运营
    { permission_name: '管理轮播图', permission_code: 'banner:manage', module: 'content_operation', description: '管理轮播图' },
    { permission_name: '管理公告', permission_code: 'announcement:manage', module: 'content_operation', description: '管理公告' },
    { permission_name: '管理推荐位', permission_code: 'recommend:manage', module: 'content_operation', description: '管理推荐位' },
    // 系统设置
    { permission_name: '查看设置', permission_code: 'settings:view', module: 'system_settings', description: '查看系统设置' },
    { permission_name: '修改设置', permission_code: 'settings:edit', module: 'system_settings', description: '修改系统设置' },
  ];

  const permissions = await Promise.all(
    permissionsData.map((perm) =>
      prisma.permissions.upsert({
        where: { permission_code: perm.permission_code },
        update: {},
        create: perm,
      })
    )
  );
  console.log(`✓ 成功创建 ${permissions.length} 个权限\n`);

  // ============================================
  // 3. 初始化角色权限关联数据
  // ============================================
  console.log('3. 初始化角色权限关联数据...');
  
  // 超级管理员拥有所有权限
  const superAdminRole = roles.find((r) => r.role_code === 'super_admin');
  if (superAdminRole) {
    await Promise.all(
      permissions.map((perm) =>
        prisma.role_permissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: superAdminRole.role_id,
              permission_id: perm.permission_id,
            },
          },
          update: {},
          create: {
            role_id: superAdminRole.role_id,
            permission_id: perm.permission_id,
          },
        })
      )
    );
    console.log(`✓ 超级管理员已分配所有权限`);
  }

  // 审核员拥有审核相关权限
  const moderatorRole = roles.find((r) => r.role_code === 'moderator');
  const auditPermissions = permissions.filter((p) => p.module === 'content_audit');
  if (moderatorRole && auditPermissions.length > 0) {
    await Promise.all(
      auditPermissions.map((perm) =>
        prisma.role_permissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: moderatorRole.role_id,
              permission_id: perm.permission_id,
            },
          },
          update: {},
          create: {
            role_id: moderatorRole.role_id,
            permission_id: perm.permission_id,
          },
        })
      )
    );
    console.log(`✓ 审核员已分配审核权限`);
  }

  // 运营人员拥有内容运营相关权限
  const operatorRole = roles.find((r) => r.role_code === 'operator');
  const operationPermissions = permissions.filter((p) => p.module === 'content_operation');
  if (operatorRole && operationPermissions.length > 0) {
    await Promise.all(
      operationPermissions.map((perm) =>
        prisma.role_permissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: operatorRole.role_id,
              permission_id: perm.permission_id,
            },
          },
          update: {},
          create: {
            role_id: operatorRole.role_id,
            permission_id: perm.permission_id,
          },
        })
      )
    );
    console.log(`✓ 运营人员已分配运营权限\n`);
  }

  // ============================================
  // 4. 初始化分类数据
  // ============================================
  console.log('4. 初始化分类数据...');
  const categoriesData = [
    { category_name: '党建类', category_code: 'party-building', icon: '/icons/party.svg', sort_order: 1, is_hot: true },
    { category_name: '节日海报类', category_code: 'festival-poster', icon: '/icons/festival.svg', sort_order: 2, is_hot: true },
    { category_name: '电商类', category_code: 'ecommerce', icon: '/icons/shop.svg', sort_order: 3, is_hot: true },
    { category_name: 'UI设计类', category_code: 'ui-design', icon: '/icons/ui.svg', sort_order: 4, is_hot: true },
    { category_name: '插画类', category_code: 'illustration', icon: '/icons/art.svg', sort_order: 5, is_hot: false },
    { category_name: '摄影图类', category_code: 'photography', icon: '/icons/camera.svg', sort_order: 6, is_hot: false },
    { category_name: '背景素材类', category_code: 'background', icon: '/icons/bg.svg', sort_order: 7, is_hot: false },
    { category_name: '字体类', category_code: 'font', icon: '/icons/font.svg', sort_order: 8, is_hot: false },
    { category_name: '图标类', category_code: 'icon', icon: '/icons/icon.svg', sort_order: 9, is_hot: false },
    { category_name: '模板类', category_code: 'template', icon: '/icons/template.svg', sort_order: 10, is_hot: false },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) =>
      prisma.categories.upsert({
        where: { category_code: cat.category_code },
        update: {},
        create: cat,
      })
    )
  );
  console.log(`✓ 成功创建 ${categories.length} 个分类\n`);

  // ============================================
  // 5. 初始化VIP套餐数据
  // ============================================
  console.log('5. 初始化VIP套餐数据...');
  const vipPackagesData = [
    {
      package_name: 'VIP月卡',
      package_code: 'vip_month',
      duration_days: 30,
      original_price: 39.90,
      current_price: 29.90,
      description: '30天VIP会员,享受所有VIP特权',
      sort_order: 1,
    },
    {
      package_name: 'VIP季卡',
      package_code: 'vip_quarter',
      duration_days: 90,
      original_price: 119.70,
      current_price: 79.90,
      description: '90天VIP会员,享受所有VIP特权',
      sort_order: 2,
    },
    {
      package_name: 'VIP年卡',
      package_code: 'vip_year',
      duration_days: 365,
      original_price: 478.80,
      current_price: 299.00,
      description: '365天VIP会员,享受所有VIP特权',
      sort_order: 3,
    },
  ];

  const vipPackages = await Promise.all(
    vipPackagesData.map((pkg) =>
      prisma.vip_packages.upsert({
        where: { package_code: pkg.package_code },
        update: {},
        create: pkg,
      })
    )
  );
  console.log(`✓ 成功创建 ${vipPackages.length} 个VIP套餐\n`);

  // ============================================
  // 6. 初始化VIP特权数据
  // ============================================
  console.log('6. 初始化VIP特权数据...');
  const vipPrivilegesData = [
    { privilege_name: '免费下载所有资源', privilege_code: 'free_download_all', privilege_type: 'boolean', privilege_value: 'true', description: 'VIP用户可免费下载所有资源,无需消耗积分', sort_order: 1 },
    { privilege_name: '专属VIP资源', privilege_code: 'vip_exclusive_resources', privilege_type: 'boolean', privilege_value: 'true', description: 'VIP用户可访问专属VIP资源', sort_order: 2 },
    { privilege_name: '优先审核', privilege_code: 'priority_audit', privilege_type: 'boolean', privilege_value: 'true', description: '作品提交后优先审核', sort_order: 3 },
    { privilege_name: '去除下载限制', privilege_code: 'unlimited_download', privilege_type: 'boolean', privilege_value: 'true', description: '去除每日下载次数限制', sort_order: 4 },
    { privilege_name: '去除广告', privilege_code: 'no_ads', privilege_type: 'boolean', privilege_value: 'true', description: '去除所有广告', sort_order: 5 },
    { privilege_name: '专属客服', privilege_code: 'exclusive_support', privilege_type: 'boolean', privilege_value: 'true', description: '享受专属客服支持', sort_order: 6 },
    { privilege_name: '作品置顶推广', privilege_code: 'top_promotion', privilege_type: 'number', privilege_value: '5', description: '每月可置顶推广作品次数', sort_order: 7 },
    { privilege_name: '高速下载通道', privilege_code: 'high_speed_download', privilege_type: 'boolean', privilege_value: 'true', description: '享受高速下载通道', sort_order: 8 },
    { privilege_name: '批量下载', privilege_code: 'batch_download', privilege_type: 'boolean', privilege_value: 'true', description: '支持批量下载功能', sort_order: 9 },
    { privilege_name: '收藏夹扩展', privilege_code: 'collection_expansion', privilege_type: 'number', privilege_value: '1000', description: '收藏夹容量扩展至1000个', sort_order: 10 },
  ];

  const vipPrivileges = await Promise.all(
    vipPrivilegesData.map((priv) =>
      prisma.vip_privileges.upsert({
        where: { privilege_code: priv.privilege_code },
        update: {},
        create: priv,
      })
    )
  );
  console.log(`✓ 成功创建 ${vipPrivileges.length} 个VIP特权\n`);

  // ============================================
  // 7. 初始化积分规则数据
  // ============================================
  console.log('7. 初始化积分规则数据...');
  const pointsRulesData = [
    // 获得积分规则
    { rule_name: '上传作品审核通过', rule_code: 'upload_approved', rule_type: 'earn', points_value: 50, description: '上传作品审核通过奖励50积分' },
    { rule_name: '作品被下载', rule_code: 'work_downloaded', rule_type: 'earn', points_value: 2, description: '作品被下载1次奖励2积分' },
    { rule_name: '作品被收藏', rule_code: 'work_collected', rule_type: 'earn', points_value: 5, description: '作品被收藏1次奖励5积分' },
    { rule_name: '作品被点赞', rule_code: 'work_liked', rule_type: 'earn', points_value: 1, description: '作品被点赞1次奖励1积分' },
    { rule_name: '每日签到', rule_code: 'daily_signin', rule_type: 'earn', points_value: 10, description: '每日签到奖励10积分' },
    { rule_name: '完善个人资料', rule_code: 'complete_profile', rule_type: 'earn', points_value: 20, description: '完善个人资料奖励20积分(一次性)' },
    { rule_name: '绑定邮箱', rule_code: 'bind_email', rule_type: 'earn', points_value: 10, description: '绑定邮箱奖励10积分(一次性)' },
    { rule_name: '绑定微信', rule_code: 'bind_wechat', rule_type: 'earn', points_value: 10, description: '绑定微信奖励10积分(一次性)' },
    { rule_name: '邀请新用户', rule_code: 'invite_user', rule_type: 'earn', points_value: 30, description: '邀请新用户注册奖励30积分' },
    // 消耗积分规则
    { rule_name: '下载普通资源', rule_code: 'download_normal', rule_type: 'consume', points_value: 10, description: '下载普通资源消耗10积分' },
    { rule_name: '下载高级资源', rule_code: 'download_advanced', rule_type: 'consume', points_value: 20, description: '下载高级资源消耗20积分' },
    { rule_name: '下载精品资源', rule_code: 'download_premium', rule_type: 'consume', points_value: 50, description: '下载精品资源消耗50积分' },
  ];

  const pointsRules = await Promise.all(
    pointsRulesData.map((rule) =>
      prisma.points_rules.upsert({
        where: { rule_code: rule.rule_code },
        update: {},
        create: rule,
      })
    )
  );
  console.log(`✓ 成功创建 ${pointsRules.length} 条积分规则\n`);

  // ============================================
  // 8. 初始化每日任务数据
  // ============================================
  console.log('8. 初始化每日任务数据...');
  const dailyTasksData = [
    { task_name: '每日签到', task_code: 'daily_signin', task_type: 'daily', points_reward: 10, target_count: 1, description: '每日签到奖励10积分', sort_order: 1 },
    { task_name: '上传1个作品', task_code: 'upload_work', task_type: 'daily', points_reward: 50, target_count: 1, description: '上传1个作品奖励50积分', sort_order: 2 },
    { task_name: '下载3个资源', task_code: 'download_resources', task_type: 'daily', points_reward: 5, target_count: 3, description: '下载3个资源奖励5积分', sort_order: 3 },
    { task_name: '收藏5个作品', task_code: 'collect_works', task_type: 'daily', points_reward: 5, target_count: 5, description: '收藏5个作品奖励5积分', sort_order: 4 },
    { task_name: '分享作品到社交媒体', task_code: 'share_work', task_type: 'daily', points_reward: 15, target_count: 1, description: '分享作品到社交媒体奖励15积分', sort_order: 5 },
  ];

  const dailyTasks = await Promise.all(
    dailyTasksData.map((task) =>
      prisma.daily_tasks.upsert({
        where: { task_code: task.task_code },
        update: {},
        create: task,
      })
    )
  );
  console.log(`✓ 成功创建 ${dailyTasks.length} 个每日任务\n`);

  // ============================================
  // 9. 初始化系统配置数据
  // ============================================
  console.log('9. 初始化系统配置数据...');
  const systemConfigData = [
    // 网站信息
    { config_key: 'site_name', config_value: '星潮设计', config_type: 'string', description: '网站名称' },
    { config_key: 'site_logo', config_value: '/logo.png', config_type: 'string', description: '网站Logo' },
    { config_key: 'site_favicon', config_value: '/favicon.ico', config_type: 'string', description: '网站Favicon' },
    // SEO信息
    { config_key: 'site_title', config_value: '星潮设计 - 优质设计资源分享平台', config_type: 'string', description: 'SEO标题' },
    { config_key: 'site_keywords', config_value: '设计资源,UI设计,平面设计,素材下载', config_type: 'string', description: 'SEO关键词' },
    { config_key: 'site_description', config_value: '星潮设计是一个专业的设计资源分享平台，提供海量优质设计素材', config_type: 'string', description: 'SEO描述' },
    // 上传限制
    { config_key: 'max_file_size', config_value: '1000', config_type: 'number', description: '最大文件大小(MB)' },
    { config_key: 'allowed_file_formats', config_value: 'jpg,jpeg,png,gif,svg,psd,ai,sketch,fig,pdf,zip,rar', config_type: 'string', description: '允许的文件格式' },
    // 下载限制
    { config_key: 'daily_download_limit', config_value: '10', config_type: 'number', description: '普通用户每日下载次数' },
    // 水印配置
    { config_key: 'watermark_text', config_value: '星潮设计', config_type: 'string', description: '水印文字' },
    { config_key: 'watermark_opacity', config_value: '0.6', config_type: 'number', description: '水印透明度' },
    { config_key: 'watermark_position', config_value: 'bottom-right', config_type: 'string', description: '水印位置' },
    // 支付配置
    { config_key: 'wechat_pay_enabled', config_value: 'true', config_type: 'boolean', description: '是否启用微信支付' },
    { config_key: 'alipay_enabled', config_value: 'true', config_type: 'boolean', description: '是否启用支付宝支付' },
    // 其他功能
    { config_key: 'points_recharge_enabled', config_value: 'true', config_type: 'boolean', description: '是否启用积分充值功能' },
    { config_key: 'vip_auto_renew_enabled', config_value: 'true', config_type: 'boolean', description: '是否启用VIP自动续费' },
  ];

  const systemConfigs = await Promise.all(
    systemConfigData.map((config) =>
      prisma.system_config.upsert({
        where: { config_key: config.config_key },
        update: {},
        create: config,
      })
    )
  );
  console.log(`✓ 成功创建 ${systemConfigs.length} 个系统配置\n`);

  // ============================================
  // 10. 创建测试账号
  // ============================================
  console.log('10. 创建测试账号...');
  
  // 使用bcrypt加密密码
  const testPassword = await bcrypt.hash('test123456', 10);
  
  const userRole = roles.find((r) => r.role_code === 'user');
  const adminRole = roles.find((r) => r.role_code === 'super_admin');

  // 创建普通测试用户
  await prisma.users.upsert({
    where: { phone: '13800000001' },
    update: {},
    create: {
      phone: '13800000001',
      password_hash: testPassword,
      nickname: '测试用户',
      role_id: userRole?.role_id,
      points_balance: 100,
      points_total: 100,
    },
  });
  console.log('✓ 创建测试用户: 13800000001 / test123456');

  // 创建VIP测试用户
  const vipExpireDate = new Date();
  vipExpireDate.setDate(vipExpireDate.getDate() + 365); // VIP有效期1年
  
  await prisma.users.upsert({
    where: { phone: '13800000002' },
    update: {
      password_hash: testPassword,
      nickname: 'VIP测试用户',
      vip_level: 1,
      vip_expire_at: vipExpireDate,
    },
    create: {
      phone: '13800000002',
      password_hash: testPassword,
      nickname: 'VIP测试用户',
      role_id: userRole?.role_id,
      vip_level: 1,
      vip_expire_at: vipExpireDate,
      points_balance: 500,
      points_total: 500,
    },
  });
  console.log('✓ 创建VIP测试用户: 13800000002 / test123456');

  // 创建管理员账号
  await prisma.users.upsert({
    where: { phone: '13900000000' },
    update: {},
    create: {
      phone: '13900000000',
      password_hash: testPassword,
      nickname: '系统管理员',
      role_id: adminRole?.role_id,
      points_balance: 1000,
      points_total: 1000,
    },
  });
  console.log('✓ 创建管理员账号: 13900000000 / test123456');

  // 创建审核员账号
  await prisma.users.upsert({
    where: { phone: '13900000001' },
    update: {},
    create: {
      phone: '13900000001',
      password_hash: testPassword,
      nickname: '内容审核员',
      role_id: moderatorRole?.role_id,
      points_balance: 500,
      points_total: 500,
    },
  });
  console.log('✓ 创建审核员账号: 13900000001 / test123456');

  // 创建普通用户B（用于交互功能测试）
  await prisma.users.upsert({
    where: { phone: '13800000003' },
    update: {},
    create: {
      phone: '13800000003',
      password_hash: testPassword,
      nickname: '测试用户B',
      role_id: userRole?.role_id,
      points_balance: 200,
      points_total: 200,
    },
  });
  console.log('✓ 创建普通用户B: 13800000003 / test123456');

  // 创建创作者A（用于上传功能测试）
  await prisma.users.upsert({
    where: { phone: '13800000004' },
    update: {},
    create: {
      phone: '13800000004',
      password_hash: testPassword,
      nickname: '创作者A',
      role_id: userRole?.role_id,
      points_balance: 300,
      points_total: 300,
    },
  });
  console.log('✓ 创建创作者A: 13800000004 / test123456\n');

  console.log('========================================');
  console.log('数据库初始化完成！');
  console.log('========================================');
  console.log('\n测试账号信息:');
  console.log('1. 普通用户A: 13800000001 / test123456');
  console.log('2. VIP用户A: 13800000002 / test123456');
  console.log('3. 普通用户B: 13800000003 / test123456');
  console.log('4. 创作者A: 13800000004 / test123456');
  console.log('5. 审核员: 13900000001 / test123456');
  console.log('6. 超级管理员: 13900000000 / test123456');
  console.log('\n✅ 所有密码已使用bcrypt加密！');
}

main()
  .catch((e) => {
    console.error('❌ 数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
