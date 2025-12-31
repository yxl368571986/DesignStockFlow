-- ==========================================
-- 生产环境数据清理脚本
-- 用途：清理所有测试数据，保留管理员账号 13900000000
-- 执行前请务必备份数据库！
-- ==========================================

-- 执行方式：
-- $env:PGPASSWORD='your_password'; $env:PGCLIENTENCODING='UTF8'; psql -h localhost -U postgres -d startide_design -f production-data-cleanup.sql

BEGIN;

-- ==========================================
-- 第一步：获取要保留的管理员账号ID
-- ==========================================

-- 创建临时表存储管理员ID
CREATE TEMP TABLE admin_to_keep AS
SELECT user_id FROM users WHERE phone = '13900000000';

-- 验证管理员账号存在
DO $$
DECLARE
  admin_count INT;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM admin_to_keep;
  IF admin_count = 0 THEN
    RAISE EXCEPTION '错误：未找到管理员账号 13900000000，请检查数据库！';
  END IF;
  RAISE NOTICE '找到管理员账号，将保留此账号';
END $$;

-- ==========================================
-- 第二步：清理关联数据（按依赖顺序）
-- ==========================================

-- 1. 清理分片上传相关数据
DELETE FROM chunk_parts WHERE upload_id IN (
  SELECT upload_id FROM chunk_uploads WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep)
);
DELETE FROM chunk_uploads WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 2. 清理收益记录（所有）
DELETE FROM earnings_records;

-- 3. 清理定价变更日志（所有）
DELETE FROM pricing_change_logs;

-- 4. 清理风控日志（所有）
DELETE FROM risk_control_logs;

-- 5. 清理充值相关数据
DELETE FROM recharge_callbacks;
DELETE FROM recharge_orders WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 6. 清理积分调整日志
DELETE FROM points_adjustment_logs WHERE target_user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 7. 清理VIP相关数据
DELETE FROM points_vip_exchanges WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);
DELETE FROM vip_orders WHERE order_id IN (
  SELECT order_id FROM orders WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep)
);

-- 8. 清理支付回调记录（所有）
DELETE FROM payment_callbacks;

-- 9. 清理设备会话
DELETE FROM device_sessions WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 10. 清理安全日志
DELETE FROM security_logs WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 11. 清理退款申请
DELETE FROM refund_requests WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 12. 清理用户下载统计
DELETE FROM user_download_stats WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 13. 清理站内信
DELETE FROM notifications WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 14. 清理订单
DELETE FROM orders WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 15. 清理积分兑换记录
DELETE FROM points_exchange_records WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 16. 清理积分记录
DELETE FROM points_records WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 17. 清理用户任务
DELETE FROM user_tasks WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 18. 清理用户收藏
DELETE FROM user_favorites WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- 19. 清理下载历史（所有）
DELETE FROM download_history;

-- 20. 清理审核日志（所有）
DELETE FROM audit_logs;

-- 21. 清理管理员操作日志（所有，包括target_user_id的引用）
DELETE FROM admin_operation_logs;

-- 22. 清理所有资源（包括前端展示的所有卡片数据）
-- 这将删除所有用户上传的资源，包括管理员上传的资源
DELETE FROM resources;

-- 23. 清理测试用户（保留管理员账号）
DELETE FROM users WHERE user_id NOT IN (SELECT user_id FROM admin_to_keep);

-- ==========================================
-- 第三步：清理系统配置数据（可选）
-- ==========================================

-- 清理测试轮播图（如果需要清理所有轮播图，取消下面的注释）
-- DELETE FROM banners;

-- 清理测试公告（如果需要清理所有公告，取消下面的注释）
-- DELETE FROM announcements;

-- ==========================================
-- 第四步：重置管理员账号数据
-- ==========================================

-- 重置管理员的积分和统计数据
UPDATE users SET
  points_balance = 0,
  points_total = 0,
  daily_recharge_count = 0,
  daily_recharge_amount = 0,
  last_recharge_date = NULL,
  payment_locked = false,
  payment_locked_at = NULL,
  payment_lock_reason = NULL,
  updated_at = NOW()
WHERE phone = '13900000000';

-- ==========================================
-- 第五步：重置分类资源计数
-- ==========================================

-- 将所有分类的资源计数重置为0（因为所有资源都被删除了）
UPDATE categories SET resource_count = 0;

-- ==========================================
-- 第六步：验证清理结果
-- ==========================================

DO $$
DECLARE
  user_count INT;
  resource_count INT;
  order_count INT;
  download_count INT;
  admin_phone VARCHAR(20);
BEGIN
  -- 统计剩余数据
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO resource_count FROM resources;
  SELECT COUNT(*) INTO order_count FROM orders;
  SELECT COUNT(*) INTO download_count FROM download_history;
  SELECT phone INTO admin_phone FROM users WHERE phone = '13900000000';
  
  -- 输出清理结果
  RAISE NOTICE '========================================';
  RAISE NOTICE '数据清理完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '剩余用户数: % (应该为 1)', user_count;
  RAISE NOTICE '剩余资源数: % (应该为 0)', resource_count;
  RAISE NOTICE '剩余订单数: % (应该为 0)', order_count;
  RAISE NOTICE '剩余下载记录: % (应该为 0)', download_count;
  RAISE NOTICE '保留的管理员账号: %', admin_phone;
  RAISE NOTICE '========================================';
  
  -- 验证管理员账号存在
  IF admin_phone IS NULL THEN
    RAISE EXCEPTION '错误：管理员账号 13900000000 已被删除！';
  END IF;
  
  -- 验证资源已全部清理
  IF resource_count > 0 THEN
    RAISE WARNING '警告：仍有 % 个资源未被清理！', resource_count;
  END IF;
END $$;

-- ==========================================
-- 提交事务
-- ==========================================

COMMIT;

-- 清理完成后的建议：
-- 1. 验证管理员账号可以正常登录
-- 2. 检查系统配置是否正确（VIP套餐、充值套餐、积分规则等）
-- 3. 检查分类数据是否完整
-- 4. 前端应该不显示任何资源卡片
-- 5. 上传一些真实的生产环境资源
-- 6. 测试完整的用户注册、登录、上传、下载流程
