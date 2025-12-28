-- ============================================
-- 修复资源图片URL问题
-- ============================================
-- 问题：数据库中有58条资源的file_url指向/files/目录
-- 但该目录不存在，导致图片加载失败
-- 
-- 解决方案：
-- 1. 对于file_url指向/files/的资源，保持cover使用picsum占位图
-- 2. 确保前端不会尝试用不存在的fileUrl替代cover
-- ============================================

-- 首先查看受影响的资源数量
SELECT 
    COUNT(*) as affected_count,
    'file_url指向/files/的资源' as description
FROM resources 
WHERE file_url LIKE '/files/%';

-- 查看这些资源的cover是否已经是有效的picsum URL
SELECT 
    COUNT(*) as has_valid_cover,
    'cover已经是picsum占位图' as description
FROM resources 
WHERE file_url LIKE '/files/%' 
AND cover LIKE 'https://picsum.photos/%';

-- 由于cover已经是有效的picsum URL，问题出在前端的"智能选择"逻辑
-- 前端会检测到cover是占位图，然后尝试用fileUrl替代
-- 但fileUrl指向的文件不存在

-- 解决方案：将这些资源的fileUrl也改为有效的占位图路径
-- 或者在数据库层面标记这些资源的文件不可用

-- 方案1：创建files目录的符号链接指向uploads（不推荐，治标不治本）
-- 方案2：修改前端逻辑，增加文件存在性检查（性能开销大）
-- 方案3：在数据库中标记这些资源为"仅预览"状态
-- 方案4（推荐）：将这些资源的format改为非图片格式，这样前端不会尝试用fileUrl替代cover

-- 查看这些资源的format分布
SELECT 
    format,
    COUNT(*) as count
FROM resources 
WHERE file_url LIKE '/files/%'
GROUP BY format
ORDER BY count DESC;
