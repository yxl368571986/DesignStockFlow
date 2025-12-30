-- 修复资源封面图片，将本地路径更新为有效的 picsum.photos URL
-- 使用不同的 picsum ID 避免 ORB 阻止问题

-- 更新所有使用本地路径的封面图片
UPDATE resources SET cover = 'https://picsum.photos/id/' || (100 + (EXTRACT(EPOCH FROM created_at)::int % 200))::text || '/800/600' 
WHERE cover LIKE '/covers/%' OR cover LIKE '/uploads/%';

-- 验证更新结果
SELECT resource_id, title, cover FROM resources LIMIT 10;
