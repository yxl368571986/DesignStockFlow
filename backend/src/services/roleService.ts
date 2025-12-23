/**
 * 角色管理服务
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

// 角色创建请求
export interface CreateRoleRequest {
  roleName: string;
  roleCode: string;
  description?: string;
  permissionIds?: string[];
}

// 角色更新请求
export interface UpdateRoleRequest {
  roleName?: string;
  description?: string;
  permissionIds?: string[];
}

// 角色响应
export interface RoleResponse {
  roleId: string;
  roleName: string;
  roleCode: string;
  description: string | null;
  permissions: PermissionInfo[];
  createdAt: Date;
  updatedAt: Date;
}

// 权限信息
export interface PermissionInfo {
  permissionId: string;
  permissionName: string;
  permissionCode: string;
  module: string;
  description: string | null;
}

export class RoleService {
  /**
   * 创建角色
   */
  async createRole(data: CreateRoleRequest): Promise<RoleResponse> {
    const { roleName, roleCode, description, permissionIds = [] } = data;

    // 检查角色代码是否已存在
    const existingRole = await prisma.roles.findUnique({
      where: { role_code: roleCode },
    });

    if (existingRole) {
      throw new Error('角色代码已存在');
    }

    // 检查角色名称是否已存在
    const existingRoleName = await prisma.roles.findUnique({
      where: { role_name: roleName },
    });

    if (existingRoleName) {
      throw new Error('角色名称已存在');
    }

    // 创建角色
    const role = await prisma.roles.create({
      data: {
        role_name: roleName,
        role_code: roleCode,
        description: description || null,
      },
    });

    // 分配权限
    if (permissionIds.length > 0) {
      await this.assignPermissionsToRole(role.role_id, permissionIds);
    }

    logger.info(`角色创建成功: ${role.role_id} - ${roleName}`);

    return this.getRoleById(role.role_id);
  }

  /**
   * 编辑角色
   */
  async updateRole(
    roleId: string,
    data: UpdateRoleRequest
  ): Promise<RoleResponse> {
    const { roleName, description, permissionIds } = data;

    // 检查角色是否存在
    const existingRole = await prisma.roles.findUnique({
      where: { role_id: roleId },
    });

    if (!existingRole) {
      throw new Error('角色不存在');
    }

    // 检查是否为系统预设角色
    const systemRoles = ['super_admin', 'moderator', 'operator', 'user'];
    if (systemRoles.includes(existingRole.role_code)) {
      throw new Error('系统预设角色不允许修改基本信息');
    }

    // 如果修改角色名称，检查是否重复
    if (roleName && roleName !== existingRole.role_name) {
      const duplicateRole = await prisma.roles.findUnique({
        where: { role_name: roleName },
      });

      if (duplicateRole) {
        throw new Error('角色名称已存在');
      }
    }

    // 更新角色基本信息
    await prisma.roles.update({
      where: { role_id: roleId },
      data: {
        role_name: roleName,
        description: description,
      },
    });

    // 更新权限（如果提供）
    if (permissionIds !== undefined) {
      await prisma.role_permissions.deleteMany({
        where: { role_id: roleId },
      });

      if (permissionIds.length > 0) {
        await this.assignPermissionsToRole(roleId, permissionIds);
      }
    }

    logger.info(`角色更新成功: ${roleId}`);

    return this.getRoleById(roleId);
  }

  /**
   * 删除角色
   */
  async deleteRole(roleId: string): Promise<void> {
    const role = await prisma.roles.findUnique({
      where: { role_id: roleId },
    });

    if (!role) {
      throw new Error('角色不存在');
    }

    const systemRoles = ['super_admin', 'moderator', 'operator', 'user'];
    if (systemRoles.includes(role.role_code)) {
      throw new Error('系统预设角色不允许删除');
    }

    const userCount = await prisma.users.count({
      where: { role_id: roleId },
    });

    if (userCount > 0) {
      throw new Error(`该角色正在被 ${userCount} 个用户使用，无法删除`);
    }

    await prisma.roles.delete({
      where: { role_id: roleId },
    });

    logger.info(`角色删除成功: ${roleId} - ${role.role_name}`);
  }

  /**
   * 为角色分配权限
   */
  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<void> {
    const role = await prisma.roles.findUnique({
      where: { role_id: roleId },
    });

    if (!role) {
      throw new Error('角色不存在');
    }

    const permissions = await prisma.permissions.findMany({
      where: {
        permission_id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new Error('部分权限ID无效');
    }

    await prisma.role_permissions.deleteMany({
      where: { role_id: roleId },
    });

    const rolePermissions = permissionIds.map((permissionId) => ({
      role_id: roleId,
      permission_id: permissionId,
    }));

    await prisma.role_permissions.createMany({
      data: rolePermissions,
    });

    logger.info(
      `角色权限分配成功: ${roleId} - ${permissionIds.length} 个权限`
    );
  }

  /**
   * 获取角色列表
   */
  async getRoles(): Promise<RoleResponse[]> {
    const roles = await prisma.roles.findMany({
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return roles.map((role) => this.formatRoleResponse(role));
  }

  /**
   * 根据ID获取角色
   */
  async getRoleById(roleId: string): Promise<RoleResponse> {
    const role = await prisma.roles.findUnique({
      where: { role_id: roleId },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!role) {
      throw new Error('角色不存在');
    }

    return this.formatRoleResponse(role);
  }

  /**
   * 获取所有权限列表
   */
  async getAllPermissions(): Promise<PermissionInfo[]> {
    const permissions = await prisma.permissions.findMany({
      orderBy: [{ module: 'asc' }, { created_at: 'asc' }],
    });

    return permissions.map((p) => ({
      permissionId: p.permission_id,
      permissionName: p.permission_name,
      permissionCode: p.permission_code,
      module: p.module,
      description: p.description,
    }));
  }

  /**
   * 格式化角色响应
   */
  private formatRoleResponse(role: any): RoleResponse {
    return {
      roleId: role.role_id,
      roleName: role.role_name,
      roleCode: role.role_code,
      description: role.description,
      permissions: role.role_permissions.map((rp: any) => ({
        permissionId: rp.permissions.permission_id,
        permissionName: rp.permissions.permission_name,
        permissionCode: rp.permissions.permission_code,
        module: rp.permissions.module,
        description: rp.permissions.description,
      })),
      createdAt: role.created_at,
      updatedAt: role.updated_at,
    };
  }
}

export const roleService = new RoleService();
export default roleService;
