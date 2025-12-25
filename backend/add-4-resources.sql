-- 添加4个资源使总数达到84个（21×4=84，每页21个，共4页，每页都填满）

INSERT INTO resources (resource_id, title, description, cover, file_url, file_name, file_size, file_format, preview_images, category_id, tags, vip_level, audit_status, status, download_count, view_count, like_count, collect_count, is_top, is_recommend, created_at, updated_at) VALUES 
('extra-res-081', '企业宣传册模板', '高端企业宣传册设计模板', 'https://picsum.photos/id/201/800/600', '/uploads/test/brochure.ai', 'brochure.ai', 22000000, 'AI', ARRAY['https://picsum.photos/id/201/800/600'], '5ea2ff7a-98b9-4eb2-9629-12ce0a96eca4', ARRAY['宣传册', '企业', '模板'], 0, 1, 1, 175, 480, 42, 33, false, true, NOW(), NOW())
ON CONFLICT (resource_id) DO NOTHING;

INSERT INTO resources (resource_id, title, description, cover, file_url, file_name, file_size, file_format, preview_images, category_id, tags, vip_level, audit_status, status, download_count, view_count, like_count, collect_count, is_top, is_recommend, created_at, updated_at) VALUES 
('extra-res-082', '科技感图标包', '现代科技风格图标素材', 'https://picsum.photos/id/202/800/600', '/uploads/test/tech-icons.svg', 'tech-icons.svg', 3500000, 'SVG', ARRAY['https://picsum.photos/id/202/800/600'], '4af3111e-1ef1-4760-8810-deb3bf817778', ARRAY['科技', '图标', '现代'], 0, 1, 1, 198, 520, 48, 38, false, true, NOW(), NOW())
ON CONFLICT (resource_id) DO NOTHING;

INSERT INTO resources (resource_id, title, description, cover, file_url, file_name, file_size, file_format, preview_images, category_id, tags, vip_level, audit_status, status, download_count, view_count, like_count, collect_count, is_top, is_recommend, created_at, updated_at) VALUES 
('extra-res-083', '城市夜景摄影', '城市夜景高清摄影图片', 'https://picsum.photos/id/203/800/600', '/uploads/test/city-night.jpg', 'city-night.jpg', 9500000, 'JPG', ARRAY['https://picsum.photos/id/203/800/600'], '407fddd6-f21c-4975-b288-483ca0bb714e', ARRAY['城市', '夜景', '摄影'], 0, 1, 1, 210, 560, 52, 41, false, false, NOW(), NOW())
ON CONFLICT (resource_id) DO NOTHING;

INSERT INTO resources (resource_id, title, description, cover, file_url, file_name, file_size, file_format, preview_images, category_id, tags, vip_level, audit_status, status, download_count, view_count, like_count, collect_count, is_top, is_recommend, created_at, updated_at) VALUES 
('extra-res-084', '手写英文字体', '优雅手写风格英文字体', 'https://picsum.photos/id/204/800/600', '/uploads/test/handwriting.ttf', 'handwriting.ttf', 2200000, 'TTF', ARRAY['https://picsum.photos/id/204/800/600'], 'ececf642-310c-4657-ac91-bab2b2105c04', ARRAY['手写', '英文', '字体'], 0, 1, 1, 165, 440, 38, 29, false, true, NOW(), NOW())
ON CONFLICT (resource_id) DO NOTHING;
