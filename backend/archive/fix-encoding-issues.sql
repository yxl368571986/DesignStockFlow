-- 修复编码问题的资源记录
-- 问题：数据库中的文件路径与实际文件名不匹配
-- 解决方案：将文件重命名为纯ASCII名称，并更新数据库记录

-- 更新第一条记录 (3e689dda-7d4c-42a3-be6b-016b7a5c2bb6)
UPDATE resources 
SET 
    title = 'Photography Work 1',
    cover = '/uploads/photo-1766848857586-699330628.jpg',
    file_url = '/uploads/photo-1766848857586-699330628.jpg',
    file_name = 'photo-1766848857586-699330628.jpg',
    updated_at = NOW()
WHERE resource_id = '3e689dda-7d4c-42a3-be6b-016b7a5c2bb6';

-- 更新第二条记录 (9893e802-7575-4e55-906a-b4514245901e)
UPDATE resources 
SET 
    title = 'Photography Work 2',
    cover = '/uploads/photo-1766849322670-818316045.jpg',
    file_url = '/uploads/photo-1766849322670-818316045.jpg',
    file_name = 'photo-1766849322670-818316045.jpg',
    updated_at = NOW()
WHERE resource_id = '9893e802-7575-4e55-906a-b4514245901e';

-- 更新第三条记录 (ebe206ff-7d9d-46ef-aa7d-4ac37b6fe051)
UPDATE resources 
SET 
    title = 'Photography Work 3',
    cover = '/uploads/photo-1766849717730-811804878.jpg',
    file_url = '/uploads/photo-1766849717730-811804878.jpg',
    file_name = 'photo-1766849717730-811804878.jpg',
    updated_at = NOW()
WHERE resource_id = 'ebe206ff-7d9d-46ef-aa7d-4ac37b6fe051';

-- 验证更新结果
SELECT resource_id, title, cover, file_url FROM resources 
WHERE resource_id IN (
    '3e689dda-7d4c-42a3-be6b-016b7a5c2bb6',
    '9893e802-7575-4e55-906a-b4514245901e',
    'ebe206ff-7d9d-46ef-aa7d-4ac37b6fe051'
);
