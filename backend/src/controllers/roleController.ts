/**
 * 角色管理控制器
 * 处理角色和权限管理相关的HTTP请求
 */
import { Request, Response, NextFunction } from 'express';
import { roleService } from '@/services/roleService.js';
import { success, error } from '@/utils/response.js';
import { logger } from '@/utils/logger.js';

/**
 * 角色管理控制器类
 */
class RoleController {
  /**
   * 获取角色列表
   * GET /api/v1/admin/roles
   */
  async getRoles(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const roles = await roleService.getRoles();
      success(res, roles, '获取角色列表成功');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取角色列表失败';
      logger.error('获取角色列表失败:', err);
      error(res, message, 500);
    }
  }

  /**
   * 创建角色
   * POST /api/v1/admin/roles
   */
  async createRole(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { roleName, roleCode, description, permissionIds } = req.body;

      // 参数验证
      if (!roleName || !roleName.trim()) {
        error(res, '角色名称不能为空', 400);
        return;
      }

      if (!roleCode || !roleCode.trim()) {
        error(res, '角色代码不能为空', 400);
        return;
      }

      // 调用服务创建角色
      const role = await roleService.createRole({
        roleName: roleName.trim(),
        roleCode: roleCode.trim(),
        description: description?.trim() || undefined,
        permissionIds: permissionIds || [],
      });

      success(res, role, '角色创建成功');
    } catch (err: unknown) {
      logger.error('创建角色失败:', err);
      const message = err instanceof Error ? err.message : '创建角色失败';
      
      // 处理特定错误
      if (message === '角色代码已存在') {
        error(res, '角色代码已存在', 400);
        return;
      }
      if (message === '角色名称已存在') {
        error(res, '角色名称已存在', 400);
        return;
      }
      
      error(res, message, 500);
    }
  }

  /**
   * 更新角色
   * PUT /api/v1/admin/roles/:roleId
   */
  async updateRole(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const { roleName, description, permissionIds } = req.body;

      if (!roleId) {
        error(res, '角色ID不能为空', 400);
        return;
      }

      // 调用服务更新角色
      const role = await roleService.updateRole(roleId, {
        roleName: roleName?.trim(),
        description: description?.trim(),
        permissionIds,
      });

      success(res, role, '角色更新成功');
    } catch (err: unknown) {
      logger.error('更新角色失败:', err);
      const message = err instanceof Error ? err.message : '更新角色失败';
      
      // 处理特定错误
      if (message === '角色不存在') {
        error(res, '角色不存在', 404);
        return;
      }
      if (message === '系统预设角色不允许修改基本信息') {
        error(res, '系统预设角色不允许修改基本信息', 403);
        return;
      }
      if (message === '角色名称已存在') {
        error(res, '角色名称已存在', 400);
        return;
      }
      
      error(res, message, 500);
    }
  }

  /**
   * 删除角色
   * DELETE /api/v1/admin/roles/:roleId
   */
  async deleteRole(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;

      if (!roleId) {
        error(res, '角色ID不能为空', 400);
        return;
      }

      // 调用服务删除角色
      await roleService.deleteRole(roleId);

      success(res, null, '角色删除成功');
    } catch (err: unknown) {
      logger.error('删除角色失败:', err);
      const message = err instanceof Error ? err.message : '删除角色失败';
      
      // 处理特定错误
      if (message === '角色不存在') {
        error(res, '角色不存在', 404);
        return;
      }
      if (message === '系统预设角色不允许删除') {
        error(res, '系统预设角色不允许删除', 403);
        return;
      }
      if (message.includes('正在被') && message.includes('个用户使用')) {
        error(res, message, 400);
        return;
      }
      
      error(res, message, 500);
    }
  }

  /**
   * 获取所有权限列表
   * GET /api/v1/admin/permissions
   */
  async getAllPermissions(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const permissions = await roleService.getAllPermissions();
      success(res, permissions, '获取权限列表成功');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取权限列表失败';
      logger.error('获取权限列表失败:', err);
      error(res, message, 500);
    }
  }

  /**
   * 为角色分配权限
   * PUT /api/v1/admin/roles/:roleId/permissions
   */
  async assignPermissions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const { permissionIds } = req.body;

      if (!roleId) {
        error(res, '角色ID不能为空', 400);
        return;
      }

      if (!Array.isArray(permissionIds)) {
        error(res, '权限ID列表格式错误', 400);
        return;
      }

      // 调用服务分配权限
      await roleService.assignPermissionsToRole(roleId, permissionIds);

      // 获取更新后的角色信息
      const role = await roleService.getRoleById(roleId);

      success(res, role, '权限分配成功');
    } catch (err: unknown) {
      logger.error('分配权限失败:', err);
      const message = err instanceof Error ? err.message : '分配权限失败';
      
      // 处理特定错误
      if (message === '角色不存在') {
        error(res, '角色不存在', 404);
        return;
      }
      if (message === '部分权限ID无效') {
        error(res, '部分权限ID无效', 400);
        return;
      }
      
      error(res, message, 500);
    }
  }
}

export const roleController = new RoleController();
export default roleController;
