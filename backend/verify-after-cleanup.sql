-- ==========================================
-- 数据清理后验证脚本
-- 用途：验证清理是否成功，管理员账号是否正常
-- ==========================================

-- 执行方式：
-- $env:PGPASSWORD='your_password'; $env:PGCLIENTENCODING='UTF8'; psql -h localhost -U postgres -d startide_design -f verify-after-cleanup.sql

\echo '========================================';
\echo '数据清理后验证';
\echo '========================================';

-- 1. 验证管理员账号
\echo '';
\echo '1. 管理员账号状态:';
SELECT 
  user_id,
  phone,
  nickname,
  vip_level,
  points_balance,
  points_total,
  role_id,
  status,
  created_at,
  last_login_at
FROM users 
WHERE phone = '13900000000';

-- 2. 验证数据清理结果
\echo '';
\echo '2. 清理后数据统计:';
SELECT 
  '用户总数' as 项目, COUNT(*) as 数量, '应该为 1' as 预期 FROM users
UNION ALL
SELECT '资源总数', COUNT(*), '应该为 0（或管理员上传的数量）' FROM resources
UNION ALL
SELECT '订单总数', COUNT(*), '应该为 0' FROM orders
UNION ALL
SELECT '下载记录', COUNT(*), '应该为 0' FROM download_history
UNION ALL
SELECT '积分记录', COUNT(*), '应该为 0' FROM points_records
UNION ALL
SELECT '收藏记录', COUNT(*), '应该为 0' FROM user_favorites
UNION ALL
SELECT '充值订单', COUNT(*), '应该为 0' FROM recharge_orders
UNION ALL
SELECT 'VIP订单', COUNT(*), '应该为 0' FROM vip_orders
UNION ALL
SELECT '审核日志', COUNT(*), '应该为 0' FROM audit_logs
UNION ALL
SELECT '管理员操作日志', COUNT(*), '应该为 0' FROM admin_operation_logs;

-- 3. 验证管理员关联数据
\echo '';
\echo '3. 管理员关联数据:';
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

-- 4. 验证系统配置数据（应该保留）
\echo '';
\echo '4. 系统配置数据:';
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
SELECT '权限配置', COUNT(*) FROM permissions
UNION ALL
SELECT '分类数据', COUNT(*) FROM categories
UNION ALL
SELECT '公告数据', COUNT(*) FROM announcements WHERE status = 1
UNION ALL
SELECT '轮播图数据', COUNT(*) FROM banners WHERE status = 1;

-- 5. 检查分类资源计数是否正确
\echo '';
\echo '5. 分类资源计数验证:';
SELECT 
  c.category_name as 分类名称,
  c.resource_count as 记录的数量,
  COUNT(r.resource_id) as 实际数量,
  CASE 
    WHEN c.resource_count = COUNT(r.resource_id) THEN '✓ 正确'
    ELSE '✗ 不匹配'
  END as 状态
FROM categories c
LEFT JOIN resources r ON c.category_id = r.category_id 
  AND r.status = 1 
  AND r.audit_status = 1
WHERE c.parent_id IS NULL
GROUP BY c.category_id, c.category_name, c.resource_count
ORDER BY c.sort_order;

-- 6. 检查是否有孤立数据
\echo '';
\echo '6. 孤立数据检查:';
SELECT 
  '孤立的资源（无用户）' as 检查项, 
  COUNT(*) as 数量,
  CASE WHEN COUNT(*) = 0 THEN '✓ 正常' ELSE '✗ 存在孤立数据' END as 状态
FROM resources 
WHERE user_id NOT IN (SELECT user_id FROM users)
UNION ALL
SELECT 
  '孤立的订单（无用户）', 
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✓ 正常' ELSE '✗ 存在孤立数据' END
FROM orders 
WHERE user_id NOT IN (SELECT user_id FROM users)
UNION ALL
SELECT 
  '孤立的下载记录（无用户）', 
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✓ 正常' ELSE '✗ 存在孤立数据' END
FROM download_history 
WHERE user_id NOT IN (SELECT user_id FROM users);

-- 7. 验证管理员角色和权限
\echo '';
\echo '7. 管理员角色和权限:';
SELECT 
  u.phone as 手机号,
  r.role_name as 角色名称,
  r.role_code as 角色代码,
  COUNT(rp.permission_id) as 权限数量
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
WHERE u.phone = '13900000000'
GROUP BY u.phone, r.role_name, r.role_code;

\echo '';
\echo '========================================';
\echo '验证完成！';
\echo '';
\echo '检查清单:';
\echo '□ 管理员账号 13900000000 存在且状态正常';
\echo '□ 用户总数应该为 1（仅管理员）';
\echo '□ 系统配置数据完整（VIP套餐、充值套餐、分类等）';
\echo '□ 分类资源计数正确';
\echo '□ 无孤立数据';
\echo '□ 管理员拥有正确的角色和权限';
\echo '========================================';
