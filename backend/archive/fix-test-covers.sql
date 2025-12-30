-- 修复指向不存在的 /uploads/test/ 目录的封面图
-- 将这些封面替换为 picsum 占位图

UPDATE resources 
SET cover = 'https://picsum.photos/id/169/800/600', updated_at = NOW()
WHERE resource_id = 'res-069';

UPDATE resources 
SET cover = 'https://picsum.photos/id/177/800/600', updated_at = NOW()
WHERE resource_id = 'res-077';

UPDATE resources 
SET cover = 'https://picsum.photos/id/183/800/600', updated_at = NOW()
WHERE resource_id = 'extra-res-083';

-- 验证更新结果
SELECT resource_id, title, cover FROM resources 
WHERE resource_id IN ('res-069', 'res-077', 'extra-res-083');
