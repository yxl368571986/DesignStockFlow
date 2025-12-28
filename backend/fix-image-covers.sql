-- 修复已上传图片资源的封面和预览图
-- 对于 file_url 是图片格式的资源，将 file_url 设置为 cover 和 preview_images
-- 这个脚本会更新所有图片资源，无论当前 cover 是什么值

-- 更新所有图片类型资源的 cover 字段（基于 file_url 扩展名判断）
UPDATE resources 
SET cover = file_url,
    preview_images = ARRAY[file_url],
    updated_at = NOW()
WHERE (
    file_url ILIKE '%.jpg' 
    OR file_url ILIKE '%.jpeg' 
    OR file_url ILIKE '%.png' 
    OR file_url ILIKE '%.gif' 
    OR file_url ILIKE '%.webp'
    OR file_url ILIKE '%.bmp'
)
AND file_url LIKE '/uploads/%'
AND (cover IS NULL OR cover = '' OR cover LIKE 'https://picsum.photos/%');

-- 显示更新结果
SELECT resource_id, title, file_format, file_url, cover, preview_images 
FROM resources 
WHERE file_url LIKE '/uploads/%'
AND (
    file_url ILIKE '%.jpg' 
    OR file_url ILIKE '%.jpeg' 
    OR file_url ILIKE '%.png' 
    OR file_url ILIKE '%.gif' 
    OR file_url ILIKE '%.webp'
);
