-- 修复积分商品的随机图片问题
-- 为每个商品设置不同的固定ID的picsum图片，确保图片不会随机变化

-- 新测试商品 - 使用固定ID 1（自然风景）
UPDATE points_products 
SET image_url = 'https://picsum.photos/id/1/280/180'
WHERE product_id = 'ca9f0fc1-6a78-4e67-afbc-6b14c39b6479';

-- 10元优惠券 - 使用固定ID 20（商务场景）
UPDATE points_products 
SET image_url = 'https://picsum.photos/id/20/280/180'
WHERE product_id = '30d9df64-1b3f-4b60-973f-b7c1533afa45';

-- 精美鼠标垫 - 使用固定ID 96（办公用品）
UPDATE points_products 
SET image_url = 'https://picsum.photos/id/96/280/180'
WHERE product_id = '20088841-ecd0-4b39-9a6c-fd2d332b65ed';

-- 下载次数+10 - 使用固定ID 119（科技感）
UPDATE points_products 
SET image_url = 'https://picsum.photos/id/119/280/180'
WHERE product_id = '1f0d5dda-8903-403f-a8e2-ec1428042a1e';

-- 专属头像框 - 使用固定ID 160（艺术风格）
UPDATE points_products 
SET image_url = 'https://picsum.photos/id/160/280/180'
WHERE product_id = 'c1fe416a-aa4a-4f9b-b5c0-7a9decee39a7';

-- 20元优惠券 - 使用固定ID 180（现代设计）
UPDATE points_products 
SET image_url = 'https://picsum.photos/id/180/280/180'
WHERE product_id = '87509970-7472-4594-9def-415e55081639';
