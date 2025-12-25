/**
 * 管理后台 - 权限管理API
 * 
 * 处理角色和权限管理相关的API请求
 */

import { get, post, put, del } from '@/utils/request';
import type { ApiResponse } from '@/types/api';

/**
 * 权限信息
 */
export interface Permission {
  permissionId: string;
  permissionName: string;
  permissionCode: string;
  module: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 角色信息
 */
export interface Role {
  roleId: string;
  roleName: string;
  roleCode: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
  _count?: {
    permissions: number;
    users: number;
  };
}

/**
 * 创建角色参数
 */
export interface CreateRoleParams {
  roleName: string;
  roleCode: string;
  description?: string;
  permissionIds?: string[];
}

/**
 * 更新角色参数
 */
export interface UpdateRoleParams {
  roleName?: string;
  description?: string;
  permissionIds?: string[];
}

/**
 * 获取角色列表
 * GET /api/v1/admin/roles
 */
export const getRoles = (): Promise<ApiResponse<Role[]>> => {
  return get<Role[]>('/admin/roles');
};

/**
 * 创建角色
 * POST /api/v1/admin/roles
 */
export const createRole = (
  data: CreateRoleParams
): Promise<ApiResponse<Role>> => {
  return post<Role>('/admin/roles', data);
};

/**
 * 更新角色
 * PUT /api/v1/admin/roles/:roleId
 */
export const updateRole = (
  roleId: string,
  data: UpdateRoleParams
): Promise<ApiResponse<Role>> => {
  return put<Role>(`/admin/roles/${roleId}`, data);
};

/**
 * 删除角色
 * DELETE /api/v1/admin/roles/:roleId
 */
export const deleteRole = (
  roleId: string
): Promise<ApiResponse<void>> => {
  return del<void>(`/admin/roles/${roleId}`);
};

/**
 * 获取所有权限列表
 * GET /api/v1/admin/permissions
 */
export const getAllPermissions = (): Promise<ApiResponse<Permission[]>> => {
  return get<Permission[]>('/admin/permissions');
};

/**
 * 为角色分配权限
 * PUT /api/v1/admin/roles/:roleId/permissions
 */
export const assignPermissions = (
  roleId: string,
  permissionIds: string[]
): Promise<ApiResponse<Role>> => {
  return put<Role>(`/admin/roles/${roleId}/permissions`, { permissionIds });
};
