# 数据库操作指南

本文档记录PostgreSQL数据库操作的最佳实践和常见问题解决方案。

## 项目数据库配置

- **数据库类型**: PostgreSQL
- **连接信息**: 见 `backend/.env` 文件中的 `DATABASE_URL`
- **ORM**: Prisma
- **Schema位置**: `backend/prisma/schema.prisma`

## SQL执行方式对比

### 1. Prisma db execute (有限制)
```bash
npx prisma db execute --file=script.sql --schema=prisma/schema.prisma
```
**限制**:
- 不支持 `ON CONFLICT` 语法
- 遇到第一个错误就停止执行
- 不返回SELECT查询结果
- 多行VALUES语法可能有问题

**适用场景**: 简单的单条INSERT/UPDATE/DELETE

### 2. psql 直接执行 (推荐)
```powershell
$env:PGPASSWORD='密码'; $env:PGCLIENTENCODING='UTF8'; psql -h localhost -U postgres -d 数据库名 -f script.sql
```
**优点**:
- 支持所有PostgreSQL语法
- 支持 `ON CONFLICT DO NOTHING/UPDATE`
- 即使部分语句失败也会继续执行
- 可以执行SELECT并返回结果

**必须设置**: `$env:PGCLIENTENCODING='UTF8'` 解决中文编码问题

## PostgreSQL INSERT 最佳实践

### 单条插入
```sql
INSERT INTO table_name (col1, col2) VALUES ('val1', 'val2');
```

### 批量插入（多行VALUES）
```sql
INSERT INTO table_name (col1, col2) VALUES
    ('val1', 'val2'),
    ('val3', 'val4'),
    ('val5', 'val6');
```

### 避免主键冲突 - ON CONFLICT DO NOTHING
```sql
INSERT INTO table_name (id, col1, col2) VALUES ('id1', 'val1', 'val2')
ON CONFLICT (id) DO NOTHING;
```

### 主键冲突时更新 - ON CONFLICT DO UPDATE
```sql
INSERT INTO table_name (id, col1, col2) VALUES ('id1', 'val1', 'val2')
ON CONFLICT (id) DO UPDATE SET col1 = EXCLUDED.col1, col2 = EXCLUDED.col2;
```

## 常见错误及解决方案

### 1. P2002 - 唯一约束冲突
```
Error: P2002 Unique constraint failed on the fields: (`resource_id`)
```
**原因**: 插入的主键或唯一字段值已存在
**解决**: 
- 使用 `ON CONFLICT DO NOTHING` 跳过冲突
- 或先查询确认ID不存在
- 或使用完全随机的UUID

### 2. 外键约束冲突
```
ERROR: insert or update on table "resources" violates foreign key constraint
```
**原因**: 引用的外键值（如category_id）在关联表中不存在
**解决**: 先通过API或查询获取有效的外键值
```bash
# 获取有效的category_id
curl http://localhost:8080/api/v1/categories
```

### 3. 编码问题 (GBK/UTF8)
```
ERROR: character with byte sequence 0xab 0xe9 in encoding "GBK" has no equivalent in encoding "UTF8"
```
**原因**: Windows默认使用GBK编码，与PostgreSQL的UTF8不兼容
**解决**: 执行前设置环境变量
```powershell
$env:PGCLIENTENCODING='UTF8'
```

### 4. Prisma不返回SELECT结果
**原因**: `prisma db execute` 设计用于执行命令，不返回查询结果
**解决**: 使用psql或通过API查询数据

## 操作前检查清单

1. **确认数据库类型**: 查看 `backend/prisma/schema.prisma` 中的 `provider`
2. **获取有效外键**: 通过API获取关联表的有效ID
3. **检查主键唯一性**: 确保插入的ID不存在
4. **使用正确编码**: Windows下设置 `PGCLIENTENCODING='UTF8'`
5. **选择正确工具**: 复杂SQL用psql，简单操作可用Prisma

## 本项目有效的Category ID

从API获取的有效分类ID（供INSERT时使用）:
- 电商类: `e2f00aa8-13f9-42c0-9091-66a0355f3cda`
- UI设计类: `1ef70739-afec-4042-9e8d-d45f963ebddf`
- 插画类: `b882ca28-c4f0-4f98-92d0-887807f5641e`
- 摄影图类: `407fddd6-f21c-4975-b288-483ca0bb714e`
- 背景素材类: `b4f4df6f-6940-45a4-9bff-87c2ac654f61`
- 字体类: `ececf642-310c-4657-ac91-bab2b2105c04`
- 图标类: `4af3111e-1ef1-4760-8810-deb3bf817778`
- 模板类: `5ea2ff7a-98b9-4eb2-9629-12ce0a96eca4`
- 党建类: `8cbc36e3-4974-493b-b2d4-13075e88d84c`
- 节日海报类: `e79a1f76-47b7-4a82-a9d3-af9aa55b935f`

## 示例：正确的资源插入SQL

```sql
-- 使用psql执行，设置UTF8编码
-- $env:PGPASSWORD='123456'; $env:PGCLIENTENCODING='UTF8'; psql -h localhost -U postgres -d startide_design -f script.sql

INSERT INTO resources (
    resource_id, title, description, cover, file_url, file_name, 
    file_size, file_format, preview_images, category_id, tags, 
    vip_level, audit_status, status, download_count, view_count, 
    like_count, collect_count, is_top, is_recommend, created_at, updated_at
) VALUES (
    'unique-id-here',
    '资源标题',
    '资源描述',
    'https://picsum.photos/id/100/800/600',
    '/uploads/test/file.psd',
    'file.psd',
    10000000,
    'PSD',
    ARRAY['https://picsum.photos/id/100/800/600'],
    'b882ca28-c4f0-4f98-92d0-887807f5641e',  -- 使用有效的category_id
    ARRAY['标签1', '标签2'],
    0,
    1,
    1,
    100,
    500,
    30,
    20,
    false,
    true,
    NOW(),
    NOW()
) ON CONFLICT (resource_id) DO NOTHING;
```
