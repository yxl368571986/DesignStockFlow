-- 修复积分商品的随机图片问题
-- 将所有使用 picsum.photos 的随机图片URL替换为固定的占位图片

UPDATE points_products 
SET image_url = '/icons/icon.svg'
WHERE image_url LIKE 'https://picsum.photos%';
