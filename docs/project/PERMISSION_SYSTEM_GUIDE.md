# 权限系统使用指南

## 快速开始

### 1. 保护API路由

```typescript
import { authenticate, requirePermissions, requireRoles } from '@/middlewares/auth.js';

// 方式1: 使用权限验证
router.get('/admin/users', 
  authenticate,                          // 先验证登录
  requirePermissions(['user:view']),     // 再验证权限
  userController.getUsers
);

// 方式2: 使用角色验证
router.post('/admin/audit', 
  authenticate,                          // 先验证登录
  requireRoles(['super_admin', 'moderator']),  // 再验证角色
  auditController.approve
);

// 方式3: 组合使用（需要多个权限）
router.delete('/admin/users/:id', 
  authenticate, 
  requirePermissions(['user:view', 'user:delete']),  // 需要同时拥有两个权限
  userController.deleteUser
);
```

### 2. 在控制器中获取当前用户信息

```typescript
export class UserController {
  async getProfile(req: Request, res: Response) {
    // req.user 由 authenticate 中间件注入
    const currentUser = req.user;
    
    console.log('当前用户ID:', currentUser?.userId);
    console.log('当前用户角色:', currentUser?.roleCode);
    console.log('当前用户权限:', currentUser?.permissions);
    
    // 业务逻辑...
  }
}
```

### 3. 角色管理

```typescript
import { roleService } from '@/services/roleService.js';

// 获取所有角色
const roles = await roleService.getRoles();

// 获取所有权限
const permissions = await roleService.getAllPermissions();

// 创建新角色
const newRole = await roleService.createRole({
  roleName: '内容编辑',
  roleCode: 'content_editor',
  description: '负责内容编辑和审核',
  permissionIds: ['permission-id-1', 'permission-id-2']
});

// 更新角色
await roleService.updateRole(roleId, {
  roleName: '高级编辑',
  description: '高级内容编辑',
  permissionIds: ['permission-id-1', 'permission-id-2', 'permission-id-3']
});

// 删除角色
await roleService.deleteRole(roleId);

// 为角色分配权限
await roleService.assignPermissionsToRole(roleId, [
  'permission-id-1',
  'permission-id-2'
]);
```

### 4. 用户角色分配

```typescript
import { userRoleService } from '@/services/userRoleService.js';

// 为用户分配角色
await userRoleService.assignRoleToUser(
  userId,           // 用户ID
  roleId,           // 角色ID
  operatorId,       // 操作员ID
  '晋升为管理员'     // 原因（可选）
);

// 移除用户角色（重置为普通用户）
await userRoleService.removeRoleFromUser(
  userId,
  operatorId,
  '降级处理'
);

// 查询用户权限
const userPermissions = await userRoleService.getUserPermissions(userId);
console.log('用户角色:', userPermissions.roleName);
console.log('用户权限:', userPermissions.permissions);

// 检查用户是否有特定权限
const hasPermission = await userRoleService.hasPermission(
  userId,
  'user:delete'
);

// 检查用户是否有特定角色
const isAdmin = await userRoleService.hasRole(userId, 'super_admin');

// 批量分配角色
const result = await userRoleService.batchAssignRole(
  ['user-id-1', 'user-id-2', 'user-id-3'],
  roleId,
  operatorId,
  '批量晋升'
);
console.log(`成功: ${result.success}, 失败: ${result.failed}`);
```

## 系统预设角色

| 角色代码 | 角色名称 | 说明 | 权限 |
|---------|---------|------|------|
| `super_admin` | 超级管理员 | 拥有所有权限 | 所有权限 |
| `moderator` | 内容审核员 | 负责内容审核 | 内容审核相关权限 |
| `operator` | 运营人员 | 负责内容运营 | 内容运营相关权限 |
| `user` | 普通用户 | 默认角色 | 个人中心相关权限 |

## 权限模块列表

### 1. 用户管理 (user_manage)
- `user:view` - 查看用户
- `user:edit` - 编辑用户
- `user:disable` - 禁用用户
- `user:delete` - 删除用户

### 2. 资源管理 (resource_manage)
- `resource:view` - 查看资源
- `resource:edit` - 编辑资源
- `resource:delete` - 删除资源
- `resource:top` - 置顶资源

### 3. 内容审核 (content_audit)
- `audit:view` - 查看待审核
- `audit:approve` - 审核通过
- `audit:reject` - 审核驳回

### 4. 分类管理 (category_manage)
- `category:view` - 查看分类
- `category:add` - 添加分类
- `category:edit` - 编辑分类
- `category:delete` - 删除分类

### 5. 数据统计 (data_statistics)
- `statistics:view` - 查看统计
- `statistics:export` - 导出报表

### 6. 内容运营 (content_operation)
- `banner:manage` - 管理轮播图
- `announcement:manage` - 管理公告
- `recommend:manage` - 管理推荐位

### 7. 系统设置 (system_settings)
- `settings:view` - 查看设置
- `settings:edit` - 修改设置

### 8. 权限管理 (permission_manage)
- `permission:assign` - 分配角色
- `permission:manage` - 管理权限

## 常见使用场景

### 场景1: 创建管理员路由组

```typescript
import express from 'express';
import { authenticate, requireRoles } from '@/middlewares/auth.js';

const adminRouter = express.Router();

// 所有管理员路由都需要先认证
adminRouter.use(authenticate);

// 只有超级管理员可以访问
adminRouter.use('/super', requireRoles(['super_admin']));
adminRouter.get('/super/settings', settingsController.getSettings);

// 审核员和管理员可以访问
adminRouter.use('/audit', requireRoles(['super_admin', 'moderator']));
adminRouter.get('/audit/pending', auditController.getPending);

export default adminRouter;
```

### 场景2: 在业务逻辑中检查权限

```typescript
export class ResourceController {
  async deleteResource(req: Request, res: Response) {
    const resourceId = req.params.id;
    const currentUser = req.user!;
    
    // 获取资源信息
    const resource = await resourceService.getById(resourceId);
    
    // 只有资源所有者或管理员可以删除
    if (resource.userId !== currentUser.userId && 
        currentUser.roleCode !== 'super_admin') {
      return error(res, '无权删除该资源', 403);
    }
    
    // 执行删除
    await resourceService.delete(resourceId);
    return success(res, null, '删除成功');
  }
}
```

### 场景3: 动态权限检查

```typescript
import { userRoleService } from '@/services/userRoleService.js';

export class UserController {
  async updateUser(req: Request, res: Response) {
    const targetUserId = req.params.id;
    const currentUser = req.user!;
    
    // 用户只能修改自己的信息，除非有 user:edit 权限
    if (targetUserId !== currentUser.userId) {
      const hasPermission = await userRoleService.hasPermission(
        currentUser.userId,
        'user:edit'
      );
      
      if (!hasPermission) {
        return error(res, '无权修改其他用户信息', 403);
      }
    }
    
    // 执行更新
    await userService.update(targetUserId, req.body);
    return success(res, null, '更新成功');
  }
}
```

## 最佳实践

### 1. 权限粒度设计
- ✅ 使用细粒度权限（如 `user:view`, `user:edit`）
- ✅ 按模块组织权限（如 `user_manage`, `resource_manage`）
- ❌ 避免过于粗粒度（如只有 `admin` 权限）

### 2. 中间件使用
- ✅ 先使用 `authenticate` 验证登录
- ✅ 再使用 `requirePermissions` 或 `requireRoles` 验证权限
- ✅ 在路由级别应用中间件，而不是在每个控制器方法中

### 3. 错误处理
- ✅ 401 - 未认证（未登录或Token无效）
- ✅ 403 - 无权限（已登录但权限不足）
- ✅ 提供清晰的错误信息

### 4. 日志记录
- ✅ 记录所有权限变更操作
- ✅ 记录权限验证失败的尝试
- ✅ 包含操作员和原因信息

### 5. 超级管理员
- ✅ 超级管理员自动拥有所有权限
- ✅ 不需要为超级管理员分配具体权限
- ✅ 在权限检查时优先判断是否为超级管理员

## 故障排查

### 问题1: Token验证失败
```
错误: Token无效或已过期，请重新登录
```
**解决方案:**
- 检查Token是否正确传递（Authorization: Bearer <token>）
- 检查Token是否过期
- 检查JWT_SECRET配置是否正确

### 问题2: 权限不足
```
错误: 权限不足，无法访问该资源
```
**解决方案:**
- 检查用户是否有所需权限
- 检查权限代码是否正确
- 检查角色权限配置是否正确

### 问题3: 角色删除失败
```
错误: 该角色正在被 X 个用户使用，无法删除
```
**解决方案:**
- 先将使用该角色的用户改为其他角色
- 或者禁用该角色而不是删除

### 问题4: 系统角色无法修改
```
错误: 系统预设角色不允许修改基本信息
```
**解决方案:**
- 系统预设角色（super_admin, moderator, operator, user）受保护
- 只能修改这些角色的权限配置，不能修改名称和代码
- 如需自定义，请创建新角色

## 测试

运行权限系统测试：
```bash
cd backend
npm run build
node dist/test-permissions.js
```

## 相关文档

- [Task 9 完成总结](./TASK9_COMPLETION_SUMMARY.md)
- [数据库Schema](./prisma/schema.prisma)
- [认证服务](./src/services/authService.ts)
- [角色服务](./src/services/roleService.ts)
- [用户角色服务](./src/services/userRoleService.ts)
