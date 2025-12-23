# 管理员资源管理API实现文档

## 概述

本文档记录了任务20：管理员资源管理API的实现情况。

## 实现的功能

### 1. 获取资源列表(管理员) - 子任务20.1 ✅

**接口**: `GET /api/v1/admin/resources`

**功能**:
- 支持分页查询
- 支持搜索(标题/资源ID/上传者昵称/手机号)
- 支持筛选(分类/审核状态/VIP等级/资源状态)
- 返回完整的资源信息，包括上传者和分类信息

**参数**:
- `page`: 页码(默认1)
- `page_size`: 每页数量(默认20，最大100)
- `search`: 搜索关键词
- `category_id`: 分类ID
- `audit_status`: 审核状态(0:待审核 1:已通过 2:已驳回)
- `vip_level`: VIP等级
- `status`: 资源状态(1:正常 0:下架)

**权限**: 需要管理员角色(super_admin或moderator)

### 2. 编辑资源(管理员) - 子任务20.2 ✅

**接口**: `PUT /api/v1/admin/resources/:resourceId`

**功能**:
- 允许修改资源标题、描述、分类、标签
- 验证分类是否存在
- 记录操作日志

**参数**:
- `title`: 资源标题
- `description`: 资源描述
- `category_id`: 分类ID
- `tags`: 标签数组

**权限**: 需要管理员角色(super_admin或moderator)

### 3. 下架资源 - 子任务20.3 ✅

**接口**: `PUT /api/v1/admin/resources/:resourceId/offline`

**功能**:
- 将资源状态设置为下架(status=0)
- 资源从前台隐藏，但不删除数据
- 可选提供下架原因

**参数**:
- `reason`: 下架原因(可选)

**权限**: 需要管理员角色(super_admin或moderator)

### 4. 删除资源(管理员) - 子任务20.4 ✅

**接口**: `DELETE /api/v1/admin/resources/:resourceId`

**功能**:
- 永久删除资源记录(硬删除)
- 删除相关文件(资源文件、封面图、预览图)
- 记录操作日志

**权限**: 需要管理员角色(super_admin或moderator)

**注意**: 此操作不可逆，建议前端实现二次确认

### 5. 置顶资源 - 子任务20.5 ✅

**接口**: `PUT /api/v1/admin/resources/:resourceId/top`

**功能**:
- 设置或取消资源置顶状态
- 置顶资源在列表中优先显示

**参数**:
- `is_top`: 是否置顶(true/false)

**权限**: 需要管理员角色(super_admin或moderator)

### 6. 推荐资源 - 子任务20.6 ✅

**接口**: `PUT /api/v1/admin/resources/:resourceId/recommend`

**功能**:
- 将资源添加到推荐位或从推荐位移除
- 推荐资源在首页推荐区域显示

**参数**:
- `is_recommend`: 是否推荐(true/false)

**权限**: 需要管理员角色(super_admin或moderator)

## 文件结构

```
backend/src/
├── controllers/
│   └── adminResourceController.ts    # 管理员资源控制器
├── services/
│   └── adminResourceService.ts       # 管理员资源服务
├── routes/
│   └── adminResource.ts              # 管理员资源路由
└── app.ts                            # 注册路由
```

## 技术实现

### 控制器层 (adminResourceController.ts)

- 处理HTTP请求和响应
- 参数验证和转换
- 调用服务层处理业务逻辑
- 统一错误处理

### 服务层 (adminResourceService.ts)

- 实现核心业务逻辑
- 数据库操作(使用Prisma ORM)
- 文件系统操作(删除资源文件)
- 数据转换和格式化

### 路由层 (adminResource.ts)

- 定义API端点
- 应用认证中间件(authenticate)
- 应用角色验证中间件(requireRoles)
- 绑定控制器方法

## 权限控制

所有管理员资源API都需要:
1. 用户已登录(通过JWT认证)
2. 用户角色为`super_admin`或`moderator`

权限验证通过中间件实现:
```typescript
router.use(authenticate);
router.use(requireRoles(['super_admin', 'moderator']));
```

## 数据库操作

使用Prisma ORM进行数据库操作，主要涉及的表:
- `Resource`: 资源表
- `Category`: 分类表
- `User`: 用户表

字段命名规范:
- 数据库字段使用snake_case(如`resource_id`, `created_at`)
- TypeScript代码使用camelCase(如`resourceId`, `createdAt`)
- 字段转换由中间件自动处理

## 错误处理

所有API都实现了统一的错误处理:
- 参数验证错误: 400 Bad Request
- 认证失败: 401 Unauthorized
- 权限不足: 403 Forbidden
- 资源不存在: 404 Not Found
- 服务器错误: 500 Internal Server Error

## 日志记录

所有操作都会记录日志:
- 使用Winston日志库
- 记录操作类型、操作者、目标资源
- 便于审计和问题排查

## 待优化项

1. **操作日志**: 当前使用logger记录，建议创建专门的资源操作日志表
2. **文件删除**: 可以考虑软删除或移动到回收站
3. **批量操作**: 可以添加批量下架、批量删除等功能
4. **操作权限细化**: 可以区分不同操作的权限要求

## 测试建议

1. 使用Postman或类似工具测试所有API端点
2. 测试不同角色的权限控制
3. 测试边界条件(如不存在的资源ID)
4. 测试文件删除功能
5. 测试搜索和筛选功能

## API使用示例

### 获取资源列表
```bash
GET /api/v1/admin/resources?page=1&page_size=20&search=设计&audit_status=1
Authorization: Bearer <token>
```

### 编辑资源
```bash
PUT /api/v1/admin/resources/xxx-xxx-xxx
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新标题",
  "description": "新描述",
  "category_id": "xxx-xxx-xxx",
  "tags": ["标签1", "标签2"]
}
```

### 下架资源
```bash
PUT /api/v1/admin/resources/xxx-xxx-xxx/offline
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "违反平台规定"
}
```

### 删除资源
```bash
DELETE /api/v1/admin/resources/xxx-xxx-xxx
Authorization: Bearer <token>
```

### 置顶资源
```bash
PUT /api/v1/admin/resources/xxx-xxx-xxx/top
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_top": true
}
```

### 推荐资源
```bash
PUT /api/v1/admin/resources/xxx-xxx-xxx/recommend
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_recommend": true
}
```

## 总结

任务20的所有子任务已成功实现:
- ✅ 20.1 实现获取资源列表接口(管理员)
- ✅ 20.2 实现资源编辑接口(管理员)
- ✅ 20.3 实现资源下架接口
- ✅ 20.4 实现资源删除接口(管理员)
- ✅ 20.5 实现资源置顶接口
- ✅ 20.6 实现资源推荐接口

所有接口都已实现完整的功能、权限控制和错误处理，可以投入使用。
