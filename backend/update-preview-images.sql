-- 更新资源的预览图为5张，用于测试多图展示功能
UPDATE resources 
SET preview_images = ARRAY[
  '/previews/618-1.jpg',
  '/previews/618-2.jpg',
  '/previews/618-3.jpg',
  '/previews/618-4.jpg',
  '/previews/618-5.jpg'
]::text[]
WHERE resource_id = 'd02bdc3c-1797-4c8e-9609-ab85fe8204b7';

-- 验证更新结果
SELECT resource_id, title, preview_images FROM resources WHERE resource_id = 'd02bdc3c-1797-4c8e-9609-ab85fe8204b7';
