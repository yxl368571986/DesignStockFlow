-- ==========================================
-- 数据清理前验证脚本
-- 用途：在执行清理前检查数据库状态
-- ==========================================

-- 执行方式：
-- $env:PGPASSWORD='your_password'; $env:PGCLIENTENCODING='UTF8'; psql -h localhost -U postgres -d startide_design -f verify-before-cleanup.sql

\echo '========================================';
\echo '数据清理前验证';
\echo '========================================';

-- 1. 检查管理员账号是否存在
\echo '';
\echo '1. 检查管理员账号 13900000000:';
SELECT 
  user_id,
  phone,
  nickname,
  vip_level,
  points_balance,
  role_id,
  status,
  created_at
FROM users 
WHERE phone = '13900000000';

-- 2. 统计当前数据量
\echo '';
\echo '2. 当前数据库统计:';
SELECT 
  '用户总数' as 项目, COUNT(*) as 数量 FROM users
UNION ALL
SELECT '资源总数', COUNT(*) FROM resources
UNION ALL
SELECT '订单总数', COUNT(*) FROM orders
UNION ALL
SELECT '下载记录', COUNT(*) FROM download_history
UNION ALL
SELECT '积分记录', COUNT(*) FROM points_records
UNION ALL
SELECT '收藏记录', COUNT(*) FROM user_favorites
UNION ALL
SELECT '充值订单', COUNT(*) FROM recharge_orders
UNION ALL
SELECT 'VIP订单', COUNT(*) FROM vip_orders
UNION ALL
SELECT '公告数量', COUNT(*) FROM announcements
UNION ALL
SELECT '轮播图数量', COUNT(*) FROM banners
UNION ALL
SELECT '分类数量', COUNT(*) FROM categories;

-- 3. 检查管理员相关数据
\echo '';
\echo '3. 管理员账号关联数据:';
WITH admin_user AS (
  SELECT user_id FROM users WHERE phone = '13900000000'
)
SELECT 
  '上传的资源' as 项目, COUNT(*) as 数量 
FROM resources 
WHERE user_id IN (SELECT user_id FROM admin_user)
UNION ALL
SELECT '下载记录', COUNT(*) 
FROM download_history 
WHERE user_id IN (SELECT user_id FROM admin_user)
UNION ALL
SELECT '积分记录', COUNT(*) 
FROM points_records 
WHERE user_id IN (SELECT user_id FROM admin_user)
UNION ALL
SELECT '订单记录', COUNT(*) 
FROM orders 
WHERE user_id IN (SELECT user_id FROM admin_user);

-- 4. 检查测试数据特征
\echo '';
\echo '4. 可能的测试数据:';
SELECT 
  '测试手机号用户' as 类型, COUNT(*) as 数量
FROM users 
WHERE phone LIKE '139%' AND phone != '13900000000'
UNION ALL
SELECT '今天创建的用户', COUNT(*)
FROM users 
WHERE DATE(created_at) = CURRENT_DATE
UNION ALL
SELECT '今天创建的资源', COUNT(*)
FROM resources 
WHERE DATE(created_at) = CURRENT_DATE
UNION ALL
SELECT '今天的订单', COUNT(*)
FROM orders 
WHERE DATE(created_at) = CURRENT_DATE;

-- 5. 检查系统配置数据
\echo '';
\echo '5. 系统配置数据:';
SELECT 
  'VIP套餐' as 配置项, COUNT(*) as 数量 FROM vip_packages WHERE status = 1
UNION ALL
SELECT '充值套餐', COUNT(*) FROM recharge_packages WHERE status = 1
UNION ALL
SELECT '积分规则', COUNT(*) FROM points_rules WHERE is_enabled = true
UNION ALL
SELECT '每日任务', COUNT(*) FROM daily_tasks WHERE is_enabled = true
UNION ALL
SELECT '角色配置', COUNT(*) FROM roles
UNION ALL
SELECT '权限配置', COUNT(*) FROM permissions;

\echo '';
\echo '========================================';
\echo '验证完成！';
\echo '请检查以上信息，确认无误后再执行清理脚本';
\echo '========================================';
