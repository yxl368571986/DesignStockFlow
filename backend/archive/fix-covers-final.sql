-- ============================================
-- 最终修复：更新测试数据的封面图
-- ============================================
-- 问题：数据库中有84条测试资源的file_url指向不存在的文件
-- 解决：确保这些资源的cover字段使用有效的picsum占位图URL
-- ============================================

-- 查看当前问题数据
SELECT COUNT(*) as problem_count FROM resources 
WHERE (file_url LIKE '/files/%' OR file_url LIKE '/uploads/test/%');

-- 确保所有测试数据的cover都是有效的picsum URL
-- 如果cover不是picsum URL，则更新为基于resource_id的稳定picsum URL
UPDATE resources 
SET cover = 'https://picsum.photos/id/' || (abs(hashtext(resource_id)) % 200 + 1)::text || '/800/600'
WHERE (file_url LIKE '/files/%' OR file_url LIKE '/uploads/test/%')
AND (cover IS NULL OR cover = '' OR cover NOT LIKE 'https://picsum.photos/%');

-- 验证更新结果
SELECT COUNT(*) as fixed_count FROM resources 
WHERE (file_url LIKE '/files/%' OR file_url LIKE '/uploads/test/%')
AND cover LIKE 'https://picsum.photos/%';
