/**
 * 受保护路由示例
 * 演示如何使用权限控制系统保护API接口
 */
import express, { Request, Response } from 'express';
import { authenticate, requirePermissions, requireRoles } from '@/middlewares/auth.js';
import { success } from '@/utils/response.js';

const router = express.Router();

/**
 * 示例1: 只需要登录即可访问
 * 任何已登录用户都可以访问
 */
router.get('/profile', authenticate, (req: Request, res: Response) => {
  success(res, {
    message: '这是个人资料页面',
    user: req.user,
  });
});

/**
 * 示例2: 需要特定权限
 * 只有拥有 user:view 权限的用户可以访问
 */
router.get(
  '/users',
  authenticate,
  requirePermissions(['user:view']),
  (req: Request, res: Response) => {
    success(res, {
      message: '用户列表',
      note: '需要 user:view 权限',
      users: [
        { id: 1, name: '用户1' },
        { id: 2, name: '用户2' },
      ],
    });
  }
);

/**
 * 示例3: 需要多个权限
 * 必须同时拥有 user:view 和 user:edit 权限
 */
router.put(
  '/users/:id',
  authenticate,
  requirePermissions(['user:view', 'user:edit']),
  (req: Request, res: Response) => {
    success(res, {
      message: '更新用户成功',
      note: '需要 user:view 和 user:edit 权限',
      userId: req.params.id,
    });
  }
);

/**
 * 示例4: 需要特定角色
 * 只有超级管理员和审核员可以访问
 */
router.get(
  '/audit/pending',
  authenticate,
  requireRoles(['super_admin', 'moderator']),
  (req: Request, res: Response) => {
    success(res, {
      message: '待审核列表',
      note: '需要 super_admin 或 moderator 角色',
      pendingItems: [
        { id: 1, title: '待审核资源1' },
        { id: 2, title: '待审核资源2' },
      ],
    });
  }
);

/**
 * 示例5: 组合使用角色和权限
 * 需要是审核员角色，并且拥有审核通过权限
 */
router.post(
  '/audit/:id/approve',
  authenticate,
  requireRoles(['super_admin', 'moderator']),
  requirePermissions(['audit:approve']),
  (req: Request, res: Response) => {
    success(res, {
      message: '审核通过',
      note: '需要 moderator 角色和 audit:approve 权限',
      resourceId: req.params.id,
    });
  }
);

/**
 * 示例6: 超级管理员专属
 * 只有超级管理员可以访问
 */
router.delete(
  '/users/:id',
  authenticate,
  requireRoles(['super_admin']),
  (req: Request, res: Response) => {
    success(res, {
      message: '删除用户成功',
      note: '只有 super_admin 可以删除用户',
      userId: req.params.id,
    });
  }
);

/**
 * 示例7: 在控制器中动态检查权限
 * 根据业务逻辑动态判断权限
 */
router.post(
  '/resources/:id/delete',
  authenticate,
  async (req: Request, res: Response) => {
    const currentUser = req.user!;
    const resourceId = req.params.id;

    // 模拟获取资源信息
    const resource = {
      id: resourceId,
      userId: 'resource-owner-id',
      title: '示例资源',
    };

    // 业务逻辑：只有资源所有者或管理员可以删除
    const isOwner = resource.userId === currentUser.userId;
    const isAdmin = currentUser.roleCode === 'super_admin';
    const hasPermission = currentUser.permissions?.includes('resource:delete');

    if (!isOwner && !isAdmin && !hasPermission) {
      return res.status(403).json({
        success: false,
        message: '无权删除该资源',
        note: '只有资源所有者、管理员或拥有 resource:delete 权限的用户可以删除',
      });
    }

    success(res, {
      message: '删除资源成功',
      note: '动态权限检查通过',
      resourceId,
    });
  }
);

/**
 * 示例8: 权限信息查询
 * 返回当前用户的权限信息
 */
router.get('/my-permissions', authenticate, (req: Request, res: Response) => {
  const user = req.user!;
  
  success(res, {
    userId: user.userId,
    phone: user.phone,
    roleCode: user.roleCode,
    roleId: user.roleId,
    permissions: user.permissions || [],
    permissionCount: user.permissions?.length || 0,
    isSuperAdmin: user.roleCode === 'super_admin',
  });
});

export default router;
