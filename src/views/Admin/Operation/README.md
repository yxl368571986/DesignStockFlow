# 内容运营管理模块

本模块实现了管理后台的内容运营功能，包括轮播图管理、公告管理和推荐位管理。

## 功能模块

### 1. 轮播图管理 (`/admin/operation/banners`)

**功能特性：**
- ✅ 轮播图列表展示（表格形式）
- ✅ 添加/编辑/删除轮播图
- ✅ 图片上传和预览
- ✅ 链接类型选择（站内/外部/分类/资源）
- ✅ 排序值设置
- ✅ 生效时间范围设置
- ✅ 启用/禁用状态切换

**技术实现：**
- 使用 Element Plus 的 Table、Dialog、Form、Upload 组件
- 图片上传支持预览和格式验证（最大2MB）
- 响应式布局，支持暗黑模式
- 表单验证和错误提示

**需求覆盖：** 需求17.1-17.5

---

### 2. 公告管理 (`/admin/operation/announcements`)

**功能特性：**
- ✅ 公告列表展示（支持筛选和分页）
- ✅ 添加/编辑/删除公告
- ✅ 富文本内容编辑（支持HTML标签）
- ✅ 公告类型设置（普通/重要/警告）
- ✅ 置顶功能
- ✅ 链接地址设置
- ✅ 生效时间范围设置
- ✅ 启用/禁用状态切换

**技术实现：**
- 使用 Element Plus 的 Table、Dialog、Form、Textarea 组件
- 支持按类型、状态、是否置顶筛选
- 分页功能（10/20/50/100条每页）
- 内容预览（去除HTML标签）
- 响应式布局，支持暗黑模式

**需求覆盖：** 需求17.6-17.8

---

### 3. 推荐位管理 (`/admin/operation/recommends`)

**功能特性：**
- ✅ 推荐位配置列表（卡片式布局）
- ✅ 自动推荐模式
  - 推荐规则选择（最多下载/最新发布/最多收藏/综合排序）
  - 推荐数量设置
  - 分类筛选
- ✅ 手动选择模式
  - 资源搜索和选择
  - 拖拽排序（使用 vuedraggable）
  - 已选资源管理
- ✅ 配置保存和预览

**技术实现：**
- 使用 Element Plus 的 Card、Form、Table、Dialog 组件
- 使用 vuedraggable 实现拖拽排序
- 资源选择对话框支持搜索和分页
- 动态切换自动/手动模式
- 响应式布局，支持暗黑模式

**需求覆盖：** 需求17.9, 17.10

---

## 路由配置

已在 `src/router/index.ts` 中添加以下路由：

```typescript
{
  path: 'operation/banners',
  name: 'AdminBanners',
  component: () => import('@/views/Admin/Operation/Banners/index.vue'),
  meta: { title: '轮播图管理 - 管理后台' }
},
{
  path: 'operation/announcements',
  name: 'AdminAnnouncements',
  component: () => import('@/views/Admin/Operation/Announcements/index.vue'),
  meta: { title: '公告管理 - 管理后台' }
},
{
  path: 'operation/recommends',
  name: 'AdminRecommends',
  component: () => import('@/views/Admin/Operation/Recommends/index.vue'),
  meta: { title: '推荐位管理 - 管理后台' }
}
```

## 依赖安装

已安装以下新依赖：
- `vuedraggable@next` - 用于推荐位的拖拽排序功能

## 待完成工作

### 后端API对接
目前所有页面使用模拟数据，需要对接以下后端API：

**轮播图管理：**
- `GET /api/v1/admin/banners` - 获取轮播图列表
- `POST /api/v1/admin/banners` - 添加轮播图
- `PUT /api/v1/admin/banners/:bannerId` - 编辑轮播图
- `DELETE /api/v1/admin/banners/:bannerId` - 删除轮播图
- `PUT /api/v1/admin/banners/:bannerId/status` - 更新状态

**公告管理：**
- `GET /api/v1/admin/announcements` - 获取公告列表
- `POST /api/v1/admin/announcements` - 添加公告
- `PUT /api/v1/admin/announcements/:announcementId` - 编辑公告
- `DELETE /api/v1/admin/announcements/:announcementId` - 删除公告
- `PUT /api/v1/admin/announcements/:announcementId/top` - 置顶/取消置顶
- `PUT /api/v1/admin/announcements/:announcementId/status` - 更新状态

**推荐位管理：**
- `GET /api/v1/admin/recommends` - 获取推荐位配置列表
- `PUT /api/v1/admin/recommends/:recommendId` - 保存推荐位配置
- `GET /api/v1/resources` - 获取资源列表（用于手动选择）
- `GET /api/v1/categories` - 获取分类列表

### 富文本编辑器
公告管理目前使用简单的 textarea，建议集成富文本编辑器（如 TinyMCE 或 Quill）以提供更好的编辑体验。

### 图片上传
需要实现后端图片上传接口 `POST /api/v1/upload/image`，返回图片URL。

## 使用说明

1. 启动开发服务器：`npm run dev`
2. 访问管理后台：`http://localhost:5173/admin`
3. 在侧边栏点击"内容运营"展开子菜单
4. 选择对应的管理页面进行操作

## 注意事项

1. 所有页面都需要管理员权限才能访问
2. 图片上传限制为2MB，支持JPG/PNG格式
3. 轮播图建议尺寸：1920x600px
4. 公告内容支持HTML标签，但需注意XSS安全
5. 推荐位手动选择模式下，资源数量不能超过设置的推荐数量

## 设计规范

- 遵循 Element Plus 设计规范
- 支持明亮/暗黑两种主题模式
- 使用卡片式布局增强视觉层次
- 表格使用斑马纹提高可读性
- 操作按钮使用不同颜色区分（主要/危险/警告）
- 所有危险操作都有二次确认对话框

## 相关文档

- [需求文档](../../../.kiro/specs/frontend-fixes-and-backend/requirements.md)
- [设计文档](../../../.kiro/specs/frontend-fixes-and-backend/design.md)
- [任务列表](../../../.kiro/specs/frontend-fixes-and-backend/tasks.md)
