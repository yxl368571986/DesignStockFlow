-- 修复 res-070 资源的乱码标题和无效封面
UPDATE resources 
SET 
    title = '几何图形背景素材',
    cover = 'https://picsum.photos/id/170/800/600',
    updated_at = NOW()
WHERE resource_id = 'res-070';

-- 验证更新结果
SELECT resource_id, title, cover FROM resources WHERE resource_id = 'res-070';
