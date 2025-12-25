# Implementation Plan: Permission Management

## Overview

本实现计划将权限管理功能分解为可执行的编码任务，按照后端API → 前端API → 前端组件 → 路由配置的顺序进行开发。

## Tasks

- [x] 1. 创建后端权限管理路由和控制器
  - [x] 1.1 创建权限管理路由文件 `backend/src/routes/role.ts`
    - 定义 GET /api/v1/admin/roles 获取角色列表
    - 定义 POST /api/v1/admin/roles 创建角色
    - 定义 PUT /api/v1/admin/roles/:roleId 更新角色
    - 定义 DELETE /api/v1/admin/roles/:roleId 删除角色
    - 定义 GET /api/v1/admin/permissions 获取所有权限
    - 定义 PUT /api/v1/admin/roles/:roleId/permissions 分配权限
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [x] 1.2 创建权限管理控制器 `backend/src/controllers/roleController.ts`
    - 实现 getRoles 方法调用 roleService.getRoles()
    - 实现 createRole 方法调用 roleService.createRole()
    - 实现 updateRole 方法调用 roleService.updateRole()
    - 实现 deleteRole 方法调用 roleService.deleteRole()
    - 实现 getAllPermissions 方法调用 roleService.getAllPermissions()
    - 实现 assignPermissions 方法调用 roleService.assignPermissionsToRole()
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [x] 1.3 在 `backend/src/app.ts` 中注册角色管理路由
    - 添加 import roleRoutes from '@/routes/role.js'
    - 添加 app.use('/api/v1/admin/roles', roleRoutes)
    - 添加 app.use('/api/v1/admin/permissions', permissionRoutes)
    - _Requirements: 8.1_

- [x] 2. 创建前端权限管理API模块
  - [x] 2.1 创建 `src/api/permission.ts` API模块
    - 定义 Role 和 Permission 接口类型
    - 实现 getRoles() 方法
    - 实现 createRole(data) 方法
    - 实现 updateRole(roleId, data) 方法
    - 实现 deleteRole(roleId) 方法
    - 实现 getAllPermissions() 方法
    - 实现 assignPermissions(roleId, permissionIds) 方法
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [x] 2.2 编写API模块单元测试 `src/api/__test__/permission.test.ts`
    - 测试各API方法的请求格式
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 3. 创建权限管理页面主组件
  - [x] 3.1 创建页面目录结构
    - 创建 `src/views/Admin/Permissions/` 目录
    - 创建 `src/views/Admin/Permissions/components/` 目录
    - _Requirements: 1.1_
  - [x] 3.2 创建主页面组件 `src/views/Admin/Permissions/index.vue`
    - 实现页面布局：标签页切换（角色管理/权限列表）
    - 实现角色列表加载和显示
    - 实现加载状态和错误处理
    - 实现新建角色按钮
    - _Requirements: 1.1, 1.2, 1.3, 6.1_
  - [x] 3.3 编写属性测试：系统角色保护
    - **Property 1: System Role Protection**
    - **Validates: Requirements 1.4, 3.3, 4.2**

- [x] 4. 创建角色表格组件
  - [x] 4.1 创建 `src/views/Admin/Permissions/components/RoleTable.vue`
    - 实现角色列表表格，包含角色名称、代码、描述、权限数量列
    - 实现系统预设角色的特殊标识（Tag标签）
    - 实现操作列：编辑、配置权限、删除按钮
    - 实现系统预设角色的删除按钮禁用
    - _Requirements: 1.1, 1.4, 4.2_
    - **Note: 已集成到主页面 index.vue 中**

- [x] 5. 创建角色对话框组件
  - [x] 5.1 创建 `src/views/Admin/Permissions/components/RoleDialog.vue`
    - 实现角色创建/编辑表单
    - 实现表单验证：角色名称必填、角色代码必填
    - 实现编辑模式下角色代码禁用
    - 实现系统预设角色的基本信息禁用
    - 实现表单提交和错误处理
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4_
    - **Note: 已集成到主页面 index.vue 中**
  - [x] 5.2 编写属性测试：表单验证规则
    - **Property 5: Form Validation Rules**
    - **Validates: Requirements 2.2, 3.2**

- [x] 6. 创建权限配置对话框组件
  - [x] 6.1 创建 `src/views/Admin/Permissions/components/PermissionDialog.vue`
    - 实现权限树形结构，按模块分组显示
    - 实现权限预选（当前角色已有权限）
    - 实现权限保存功能
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
    - **Note: 已集成到主页面 index.vue 中**
  - [x] 6.2 编写属性测试：权限分组显示
    - **Property 2: Permission Grouping Display**
    - **Validates: Requirements 5.2, 6.2**
  - [x] 6.3 编写属性测试：权限预选
    - **Property 3: Permission Pre-selection**
    - **Validates: Requirements 5.3**

- [x] 7. 创建权限列表组件
  - [x] 7.1 创建 `src/views/Admin/Permissions/components/PermissionList.vue`
    - 实现权限列表表格，按模块分组
    - 实现模块筛选下拉框
    - 显示权限名称、代码、模块、描述
    - _Requirements: 6.1, 6.2, 6.3_
    - **Note: 已集成到主页面 index.vue 中**
  - [x] 7.2 编写属性测试：模块筛选正确性
    - **Property 4: Module Filter Correctness**
    - **Validates: Requirements 6.3**

- [x] 8. 配置路由
  - [x] 8.1 在 `src/router/index.ts` 中添加权限管理路由
    - 添加 /admin/permissions 路由配置
    - 设置页面标题为"权限管理 - 管理后台"
    - 配置 requiresAuth 和 requiresAdmin 元信息
    - _Requirements: 8.1, 8.2, 8.3_
    - **Note: 路由已存在**

- [x] 9. Checkpoint - 功能集成测试
  - 确保所有组件正确集成
  - 确保后端API正常工作
  - 确保前端页面正常显示
  - 确保所有测试通过，如有问题请询问用户

- [x] 10. 删除确认对话框实现
  - [x] 10.1 在 RoleTable.vue 中实现删除确认逻辑
    - 点击删除按钮显示确认对话框
    - 处理删除成功和失败的情况
    - 显示"角色正在被使用"的错误提示
    - _Requirements: 4.1, 4.3, 4.4_

- [x] 11. Final Checkpoint - 完整功能验证
  - 确保所有功能正常工作
  - 确保所有测试通过
  - 如有问题请询问用户

## Notes

- All tasks are required for comprehensive testing
- 后端已有 roleService 和 userRoleService，只需创建路由和控制器
- 使用 Element Plus 组件库进行UI开发
- 遵循项目现有的代码风格和目录结构
