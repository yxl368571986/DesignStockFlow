# 待办事项列表 (TODO List)

本文档记录项目中标记为TODO的待实现功能。

## 前端功能

### 资源相关
- [ ] `src/views/Search/index.vue` - 实现下载逻辑
- [ ] `src/views/Resource/List.vue` - 实现下载逻辑

### 用户相关
- [ ] `src/views/Admin/Users/components/UserDetailDialog.vue` - 调用后端API获取用户详情
- [ ] `src/views/Admin/Users/components/UserDetailDialog.vue` - 调用后端API获取积分记录
- [ ] `src/views/Admin/Users/components/UserDetailDialog.vue` - 调用后端API获取操作记录
- [ ] `src/views/Admin/Users/components/ResetPasswordDialog.vue` - 调用后端API重置密码

### 运营相关
- [ ] `src/views/Admin/Statistics/index.vue` - 实现自定义时间范围功能
- [ ] `src/views/Admin/Operation/Recommends/index.vue` - 调用实际API获取推荐列表
- [ ] `src/views/Admin/Operation/Recommends/index.vue` - 调用实际API获取分类列表
- [ ] `src/views/Admin/Operation/Recommends/index.vue` - 调用实际API获取资源列表
- [ ] `src/views/Admin/Operation/Recommends/index.vue` - 调用保存API
- [ ] `src/views/Admin/Operation/Recommends/index.vue` - 实现预览功能
- [ ] `src/views/Admin/Operation/Announcements/index.vue` - 调用实际API获取公告列表
- [ ] `src/views/Admin/Operation/Announcements/index.vue` - 调用删除API
- [ ] `src/views/Admin/Operation/Announcements/index.vue` - 调用置顶API
- [ ] `src/views/Admin/Operation/Announcements/index.vue` - 调用取消置顶API
- [ ] `src/views/Admin/Operation/Announcements/index.vue` - 调用更新状态API
- [ ] `src/views/Admin/Operation/Announcements/index.vue` - 调用添加/编辑API

## 后端功能

### 安全相关
- [ ] `backend/src/utils/request.ts` - 实现完整的CSRF Token机制

## 优化建议

### 性能优化
- 考虑在生产环境构建时自动移除console.log调试代码
- 可以使用babel-plugin-transform-remove-console插件

### 代码质量
- 所有TODO标记的功能应该在相应的迭代中实现
- 建议为每个TODO创建对应的issue或任务卡片

## 更新日志

- 2025-12-31: ✅ 为VIP订单页面添加返回按钮，改善用户导航体验
- 2025-12-31: ✅ 修复个人中心积分明细弹窗切换Tab时的晃动问题
- 2024-12-30: 初始创建，整理项目中的所有TODO标记
