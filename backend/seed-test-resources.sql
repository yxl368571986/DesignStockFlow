-- 插入测试资源数据
INSERT INTO resources (resource_id, title, description, cover, file_url, file_name, file_size, file_format, preview_images, category_id, tags, vip_level, audit_status, status, download_count, view_count, like_count, collect_count, is_top, is_recommend, created_at, updated_at)
VALUES 
('res-001', 'UI设计素材包', '精美的UI设计素材，包含按钮、图标、表单等组件', 'https://picsum.photos/400/300?random=1', '/uploads/test/ui-kit.zip', 'ui-kit.zip', 10485760, 'ZIP', ARRAY['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=2']::text[], '1ef70739-afec-4042-9e8d-d45f963ebddf', ARRAY['UI', '设计', '素材']::text[], 0, 1, 1, 150, 500, 30, 20, false, true, NOW(), NOW());

INSERT INTO resources (resource_id, title, description, cover, file_url, file_name, file_size, file_format, preview_images, category_id, tags, vip_level, audit_status, status, download_count, view_count, like_count, collect_count, is_top, is_recommend, created_at, updated_at)
VALUES 
('res-002', '电商Banner模板', '高质量电商促销Banner模板，适用于各种电商平台', 'https://picsum.photos/400/300?random=3', '/uploads/test/banner.psd', 'banner.psd', 52428800, 'PSD', ARRAY['https://picsum.photos/800/600?random=3', 'https://picsum.photos/800/600?random=4']::text[], 'e2f00aa8-13f9-42c0-9091-66a0355f3cda', ARRAY['电商', 'Banner', '促销']::text[], 0, 1, 1, 280, 800, 50, 35, true, true, NOW(), NOW());

INSERT INTO resources (resource_id, title, description, cover, file_url, file_name, file_size, file_format, preview_images, category_id, tags, vip_level, audit_status, status, download_count, view_count, like_count, collect_count, is_top, is_recommend, created_at, updated_at)
VALUES 
('res-003', '插画素材合集', '手绘风格插画素材，包含人物、场景、装饰元素', 'https://picsum.photos/400/300?random=5', '/uploads/test/illustration.ai', 'illustration.ai', 31457280, 'AI', ARRAY['https://picsum.photos/800/600?random=5', 'https://picsum.photos/800/600?random=6']::text[], 'b882ca28-c4f0-4f98-92d0-887807f5641e', ARRAY['插画', '手绘', '素材']::text[], 1, 1, 1, 120, 400, 25, 18, false, true, NOW(), NOW());

INSERT INTO resources (resource_id, title, description, cover, file_url, file_name, file_size, file_format, preview_images, category_id, tags, vip_level, audit_status, status, download_count, view_count, like_count, collect_count, is_top, is_recommend, created_at, updated_at)
VALUES 
('res-004', '摄影图片素材', '高清摄影图片，适用于网站背景、海报设计', 'https://picsum.photos/400/300?random=7', '/uploads/test/photos.zip', 'photos.zip', 104857600, 'ZIP', ARRAY['https://picsum.photos/800/600?random=7', 'https://picsum.photos/800/600?random=8']::text[], '407fddd6-f21c-4975-b288-483ca0bb714e', ARRAY['摄影', '图片', '高清']::text[], 0, 1, 1, 200, 600, 40, 28, false, false, NOW(), NOW());

INSERT INTO resources (resource_id, title, description, cover, file_url, file_name, file_size, file_format, preview_images, category_id, tags, vip_level, audit_status, status, download_count, view_count, like_count, collect_count, is_top, is_recommend, created_at, updated_at)
VALUES 
('res-005', '渐变背景素材', '精美渐变背景图，多种配色方案', 'https://picsum.photos/400/300?random=9', '/uploads/test/gradient-bg.zip', 'gradient-bg.zip', 20971520, 'ZIP', ARRAY['https://picsum.photos/800/600?random=9', 'https://picsum.photos/800/600?random=10']::text[], 'b4f4df6f-6940-45a4-9bff-87c2ac654f61', ARRAY['背景', '渐变', '素材']::text[], 0, 1, 1, 180, 550, 35, 22, false, true, NOW(), NOW());

INSERT INTO resources (resource_id, title, description, cover, file_url, file_name, file_size, file_format, preview_images, category_id, tags, vip_level, audit_status, status, download_count, view_count, like_count, collect_count, is_top, is_recommend, created_at, updated_at)
VALUES 
('res-006', '中文字体包', '精选中文字体，包含多种风格', 'https://picsum.photos/400/300?random=11', '/uploads/test/fonts.zip', 'fonts.zip', 52428800, 'ZIP', ARRAY['https://picsum.photos/800/600?random=11', 'https://picsum.photos/800/600?random=12']::text[], 'ececf642-310c-4657-ac91-bab2b2105c04', ARRAY['字体', '中文', '设计']::text[], 1, 1, 1, 320, 900, 60, 45, true, true, NOW(), NOW());

INSERT INTO resources (resource_id, title, description, cover, file_url, file_name, file_size, file_format, preview_images, category_id, tags, vip_level, audit_status, status, download_count, view_count, like_count, collect_count, is_top, is_recommend, created_at, updated_at)
VALUES 
('res-007', '图标素材库', '扁平化图标素材，包含多种分类', 'https://picsum.photos/400/300?random=13', '/uploads/test/icons.svg', 'icons.svg', 5242880, 'SVG', ARRAY['https://picsum.photos/800/600?random=13', 'https://picsum.photos/800/600?random=14']::text[], '4af3111e-1ef1-4760-8810-deb3bf817778', ARRAY['图标', '扁平化', 'SVG']::text[], 0, 1, 1, 250, 700, 45, 32, false, true, NOW(), NOW());

INSERT INTO resources (resource_id, title, description, cover, file_url, file_name, file_size, file_format, preview_images, category_id, tags, vip_level, audit_status, status, download_count, view_count, like_count, collect_count, is_top, is_recommend, created_at, updated_at)
VALUES 
('res-008', 'PPT模板合集', '商务风格PPT模板，适用于各种场景', 'https://picsum.photos/400/300?random=15', '/uploads/test/ppt-templates.zip', 'ppt-templates.zip', 83886080, 'ZIP', ARRAY['https://picsum.photos/800/600?random=15', 'https://picsum.photos/800/600?random=16']::text[], '5ea2ff7a-98b9-4eb2-9629-12ce0a96eca4', ARRAY['PPT', '模板', '商务']::text[], 0, 1, 1, 380, 1100, 70, 55, true, true, NOW(), NOW());
