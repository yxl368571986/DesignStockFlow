/**
 * 用户角色分配服务
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

// 用户权限信息
export interface UserPermissionsResponse {
  userId: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  permissions: string[];
}

// 权限变更日志
export interface PermissionChangeLog {
  logId: string;
  userId: string;
  operatorId: string;
  operatorName: string;
  action: string;
  oldRoleId: string | null;
  oldRoleName: string | null;
  newRoleId: string | null;
  newRoleName: string | null;
  reason: string | null;
  createdAt: Date;
}

export class UserRoleService {
  /**
   * 为用户分配角色
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    operatorId: string,
    reason?: string
  ): Promise<void> {
    // 1. 检查用户是否存在
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 2. 检查角色是否存在
    const role = await prisma.roles.findUnique({
      where: { role_id: roleId },
    });

    if (!role) {
      throw new Error('角色不存在');
    }

    // 3. 记录旧角色信息
    const oldRoleId = user.role_id;
    const oldRoleName = user.roles?.role_name || null;

    // 4. 更新用户角色
    await prisma.users.update({
      where: { user_id: userId },
      data: {
        role_id: roleId,
      },
    });

    // 5. 记录权限变更日志
    await this.logPermissionChange({
      userId,
      operatorId,
      action: 'assign_role',
      oldRoleId,
      oldRoleName,
      newRoleId: roleId,
      newRoleName: role.role_name,
      reason,
    });

    logger.info(
      `用户角色分配成功: 用户 ${userId} 从 ${oldRoleName || '无'} 变更为 ${role.role_name}`
    );
  }

  /**
   * 移除用户角色
   */
  async removeRoleFromUser(
    userId: string,
    operatorId: string,
    reason?: string
  ): Promise<void> {
    // 1. 检查用户是否存在
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 2. 记录旧角色信息
    const oldRoleId = user.role_id;
    const oldRoleName = user.roles?.role_name || null;

    // 3. 获取默认角色（普通用户）
    const defaultRole = await prisma.roles.findUnique({
      where: { role_code: 'user' },
    });

    if (!defaultRole) {
      throw new Error('系统默认角色不存在');
    }

    // 4. 更新用户角色为默认角色
    await prisma.users.update({
      where: { user_id: userId },
      data: {
        role_id: defaultRole.role_id,
      },
    });

    // 5. 记录权限变更日志
    await this.logPermissionChange({
      userId,
      operatorId,
      action: 'remove_role',
      oldRoleId,
      oldRoleName,
      newRoleId: defaultRole.role_id,
      newRoleName: defaultRole.role_name,
      reason,
    });

    logger.info(
      `用户角色移除成功: 用户 ${userId} 从 ${oldRoleName || '无'} 变更为 ${defaultRole.role_name}`
    );
  }

  /**
   * 查询用户权限列表
   */
  async getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
    // 1. 查询用户及其角色权限
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        roles: {
          include: {
            role_permissions: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (!user.roles) {
      throw new Error('用户未分配角色');
    }

    // 2. 提取权限代码列表
    const permissions = user.roles.role_permissions.map(
      (rp) => rp.permissions.permission_code
    );

    return {
      userId: user.user_id,
      roleId: user.roles.role_id,
      roleCode: user.roles.role_code,
      roleName: user.roles.role_name,
      permissions,
    };
  }

  /**
   * 检查用户是否拥有指定权限
   */
  async hasPermission(
    userId: string,
    permissionCode: string
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    // 超级管理员拥有所有权限
    if (userPermissions.roleCode === 'super_admin') {
      return true;
    }

    return userPermissions.permissions.includes(permissionCode);
  }

  /**
   * 检查用户是否拥有指定角色
   */
  async hasRole(userId: string, roleCode: string): Promise<boolean> {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        roles: true,
      },
    });

    if (!user || !user.roles) {
      return false;
    }

    return user.roles.role_code === roleCode;
  }

  /**
   * 获取用户的权限变更日志
   */
  async getPermissionChangeLogs(
    userId: string,
    _limit: number = 50
  ): Promise<PermissionChangeLog[]> {
    // 注意：这里需要一个权限变更日志表，暂时使用简化实现
    // 在实际项目中，应该创建一个专门的 permission_change_logs 表
    logger.info(`查询用户 ${userId} 的权限变更日志（功能待实现）`);
    return [];
  }

  /**
   * 记录权限变更日志
   */
  private async logPermissionChange(data: {
    userId: string;
    operatorId: string;
    action: string;
    oldRoleId: string | null;
    oldRoleName: string | null;
    newRoleId: string | null;
    newRoleName: string | null;
    reason?: string;
  }): Promise<void> {
    const {
      userId,
      operatorId,
      action,
      oldRoleId,
      oldRoleName,
      newRoleId,
      newRoleName,
      reason,
    } = data;

    // 获取操作员信息
    const operator = await prisma.users.findUnique({
      where: { user_id: operatorId },
    });

    const logMessage = `权限变更: 用户 ${userId} | 操作 ${action} | 旧角色 ${oldRoleName || '无'} (${oldRoleId || '无'}) | 新角色 ${newRoleName || '无'} (${newRoleId || '无'}) | 操作员 ${operator?.nickname || operatorId} | 原因 ${reason || '无'}`;

    logger.info(logMessage);

    // TODO: 在实际项目中，应该将日志写入数据库的 permission_change_logs 表
    // 这里暂时只记录到日志文件
  }

  /**
   * 批量分配角色
   */
  async batchAssignRole(
    userIds: string[],
    roleId: string,
    operatorId: string,
    reason?: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        await this.assignRoleToUser(userId, roleId, operatorId, reason);
        success++;
      } catch (error: unknown) {
        failed++;
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`用户 ${userId}: ${message}`);
      }
    }

    logger.info(
      `批量分配角色完成: 成功 ${success}, 失败 ${failed}, 总计 ${userIds.length}`
    );

    return { success, failed, errors };
  }
}

export const userRoleService = new UserRoleService();
export default userRoleService;
