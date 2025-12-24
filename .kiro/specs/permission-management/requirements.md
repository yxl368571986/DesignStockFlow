# Requirements Document

## Introduction

权限管理功能是后台管理系统的核心模块，用于管理系统角色和权限分配。该功能允许管理员创建、编辑、删除角色，为角色分配权限，以及为用户分配角色。系统预设了四种角色：超级管理员(super_admin)、内容审核员(moderator)、运营人员(operator)和普通用户(user)。

## Glossary

- **Permission_Manager**: 权限管理页面组件，负责展示和管理角色与权限
- **Role**: 角色实体，包含角色名称、代码、描述和关联的权限列表
- **Permission**: 权限实体，包含权限名称、代码、所属模块和描述
- **Role_Service**: 后端角色管理服务，处理角色的CRUD操作
- **User_Role_Service**: 后端用户角色分配服务，处理用户与角色的关联
- **Permission_API**: 前端权限管理API模块，封装与后端的通信

## Requirements

### Requirement 1: 角色列表展示

**User Story:** As a 管理员, I want 查看系统中所有角色的列表, so that 我可以了解当前系统的角色配置情况

#### Acceptance Criteria

1. WHEN 管理员访问权限管理页面, THE Permission_Manager SHALL 显示角色列表表格，包含角色名称、角色代码、描述、权限数量和操作列
2. WHEN 角色列表加载中, THE Permission_Manager SHALL 显示加载状态指示器
3. IF 角色列表加载失败, THEN THE Permission_Manager SHALL 显示错误提示信息并提供重试按钮
4. THE Permission_Manager SHALL 区分显示系统预设角色和自定义角色，系统预设角色显示特殊标识

### Requirement 2: 创建角色

**User Story:** As a 管理员, I want 创建新的自定义角色, so that 我可以根据业务需求定义不同的权限组合

#### Acceptance Criteria

1. WHEN 管理员点击"新建角色"按钮, THE Permission_Manager SHALL 打开角色创建对话框
2. THE Permission_Manager SHALL 要求输入角色名称（必填）、角色代码（必填、唯一）和描述（选填）
3. WHEN 管理员提交创建表单, THE Permission_Manager SHALL 验证角色名称和代码的唯一性
4. IF 角色代码已存在, THEN THE Permission_Manager SHALL 显示"角色代码已存在"错误提示
5. IF 角色名称已存在, THEN THE Permission_Manager SHALL 显示"角色名称已存在"错误提示
6. WHEN 角色创建成功, THE Permission_Manager SHALL 关闭对话框、刷新角色列表并显示成功提示

### Requirement 3: 编辑角色

**User Story:** As a 管理员, I want 编辑现有角色的信息, so that 我可以更新角色的名称和描述

#### Acceptance Criteria

1. WHEN 管理员点击角色的"编辑"按钮, THE Permission_Manager SHALL 打开角色编辑对话框并填充当前角色信息
2. THE Permission_Manager SHALL 允许修改角色名称和描述，但不允许修改角色代码
3. IF 编辑的是系统预设角色, THEN THE Permission_Manager SHALL 禁用基本信息编辑，仅允许修改权限配置
4. WHEN 角色更新成功, THE Permission_Manager SHALL 关闭对话框、刷新角色列表并显示成功提示

### Requirement 4: 删除角色

**User Story:** As a 管理员, I want 删除不再需要的自定义角色, so that 我可以保持角色列表的整洁

#### Acceptance Criteria

1. WHEN 管理员点击角色的"删除"按钮, THE Permission_Manager SHALL 显示删除确认对话框
2. IF 删除的是系统预设角色, THEN THE Permission_Manager SHALL 禁用删除按钮并显示"系统预设角色不允许删除"提示
3. IF 角色正在被用户使用, THEN THE Permission_Manager SHALL 显示"该角色正在被N个用户使用，无法删除"错误提示
4. WHEN 角色删除成功, THE Permission_Manager SHALL 刷新角色列表并显示成功提示

### Requirement 5: 权限分配

**User Story:** As a 管理员, I want 为角色分配权限, so that 我可以控制不同角色能够执行的操作

#### Acceptance Criteria

1. WHEN 管理员点击角色的"配置权限"按钮, THE Permission_Manager SHALL 打开权限配置对话框
2. THE Permission_Manager SHALL 按模块分组显示所有可用权限，使用树形结构或分组复选框
3. THE Permission_Manager SHALL 预选当前角色已拥有的权限
4. WHEN 管理员保存权限配置, THE Permission_Manager SHALL 更新角色的权限列表
5. WHEN 权限配置保存成功, THE Permission_Manager SHALL 关闭对话框并显示成功提示

### Requirement 6: 权限列表展示

**User Story:** As a 管理员, I want 查看系统中所有可用的权限, so that 我可以了解系统的权限体系

#### Acceptance Criteria

1. THE Permission_Manager SHALL 提供权限列表标签页，展示所有系统权限
2. THE Permission_Manager SHALL 按模块分组显示权限，包含权限名称、权限代码、所属模块和描述
3. THE Permission_Manager SHALL 支持按模块筛选权限列表

### Requirement 7: 前端API封装

**User Story:** As a 开发者, I want 有统一的权限管理API模块, so that 前端组件可以方便地与后端通信

#### Acceptance Criteria

1. THE Permission_API SHALL 提供获取角色列表的方法 getRoles()
2. THE Permission_API SHALL 提供创建角色的方法 createRole(data)
3. THE Permission_API SHALL 提供更新角色的方法 updateRole(roleId, data)
4. THE Permission_API SHALL 提供删除角色的方法 deleteRole(roleId)
5. THE Permission_API SHALL 提供获取所有权限的方法 getAllPermissions()
6. THE Permission_API SHALL 提供为角色分配权限的方法 assignPermissions(roleId, permissionIds)

### Requirement 8: 路由配置

**User Story:** As a 用户, I want 通过URL访问权限管理页面, so that 我可以直接导航到该功能

#### Acceptance Criteria

1. WHEN 用户访问 /admin/permissions 路径, THE Router SHALL 加载权限管理页面组件
2. THE Router SHALL 配置页面标题为"权限管理 - 管理后台"
3. THE Router SHALL 要求用户具有管理员权限才能访问该页面
