-- 插入积分商城商品数据
INSERT INTO points_products (product_id, product_name, product_type, product_code, points_required, product_value, stock, image_url, description, sort_order, status, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'VIP月卡', 'vip', 'vip_monthly', 1000, 'VIP月卡', 999, 'https://picsum.photos/id/1/280/180', 'VIP会员月卡，享受VIP特权30天', 1, 1, NOW(), NOW()),
  (gen_random_uuid(), '10元优惠券', 'coupon', 'coupon_10', 500, '10元', 500, 'https://picsum.photos/id/20/280/180', '满50元可用的10元优惠券', 2, 1, NOW(), NOW()),
  (gen_random_uuid(), '精美鼠标垫', 'physical', 'mousepad_01', 2000, '鼠标垫', 50, 'https://picsum.photos/id/96/280/180', '星潮设计定制鼠标垫', 3, 1, NOW(), NOW()),
  (gen_random_uuid(), '下载次数+10', 'virtual', 'download_10', 300, '10次下载', -1, 'https://picsum.photos/id/119/280/180', '增加10次资源下载次数', 4, 1, NOW(), NOW()),
  (gen_random_uuid(), '专属头像框', 'virtual', 'avatar_frame', 200, '头像框', -1, 'https://picsum.photos/id/160/280/180', '限定版专属头像框', 5, 1, NOW(), NOW()),
  (gen_random_uuid(), '20元优惠券', 'coupon', 'coupon_20', 800, '20元', 200, 'https://picsum.photos/id/180/280/180', '满100元可用的20元优惠券', 6, 1, NOW(), NOW())
ON CONFLICT (product_code) DO NOTHING;
