/**
 * 权限管理API测试
 * 测试任务2.2：权限管理API模块单元测试
 * 需求: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock request模块
vi.mock('@/utils/request', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import { get, post, put, del } from '@/utils/request';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  assignPermissions,
  type Role,
  type Permission,
  type CreateRoleParams,
  type UpdateRoleParams,
} from '@/api/permission';

const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);
const mockPut = vi.mocked(put);
const mockDel = vi.mocked(del);

describe('权限管理API测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  /**
   * 7.1 获取角色列表 - GET /api/v1/admin/roles
   */
  describe('7.1 获取角色列表 - getRoles()', () => {
    it('应该正确调用GET /admin/roles接口', async () => {
      const mockRoles: Role[] = [
        {
          roleId: 'role-001',
          roleName: '超级管理员',
          roleCode: 'super_admin',
          description: '拥有所有权限',
          isSystem: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          permissions: [],
          _count: { permissions: 10, users: 1 },
        },
        {
          roleId: 'role-002',
          roleName: '内容审核员',
          roleCode: 'moderator',
          description: '负责内容审核',
          isSystem: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          permissions: [],
          _count: { permissions: 5, users: 3 },
        },
      ];

      mockGet.mockResolvedValueOnce({
        code: 200,
        msg: '获取角色列表成功',
        data: mockRoles,
        timestamp: Date.now(),
      });

      const result = await getRoles();

      expect(mockGet).toHaveBeenCalledWith('/admin/roles');
      expect(result.code).toBe(200);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].roleCode).toBe('super_admin');
    });

    it('应该正确返回角色的权限数量', async () => {
      const mockRoles: Role[] = [
        {
          roleId: 'role-001',
          roleName: '测试角色',
          roleCode: 'test_role',
          description: null,
          isSystem: false,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          _count: { permissions: 15, users: 5 },
        },
      ];

      mockGet.mockResolvedValueOnce({
        code: 200,
        msg: '获取角色列表成功',
        data: mockRoles,
        timestamp: Date.now(),
      });

      const result = await getRoles();

      expect(result.data[0]._count?.permissions).toBe(15);
      expect(result.data[0]._count?.users).toBe(5);
    });

    it('未授权时应该返回401错误', async () => {
      mockGet.mockRejectedValueOnce({
        code: 401,
        msg: '请先登录',
        data: null,
      });

      await expect(getRoles()).rejects.toMatchObject({
        code: 401,
        msg: '请先登录',
      });
    });
  });

  /**
   * 7.2 创建角色 - POST /api/v1/admin/roles
   */
  describe('7.2 创建角色 - createRole()', () => {
    it('应该正确调用POST /admin/roles接口', async () => {
      const createParams: CreateRoleParams = {
        roleName: '自定义角色',
        roleCode: 'custom_role',
        description: '这是一个自定义角色',
        permissionIds: ['perm-001', 'perm-002'],
      };

      const mockCreatedRole: Role = {
        roleId: 'role-new-001',
        roleName: '自定义角色',
        roleCode: 'custom_role',
        description: '这是一个自定义角色',
        isSystem: false,
        createdAt: '2025-12-25T00:00:00.000Z',
        updatedAt: '2025-12-25T00:00:00.000Z',
        permissions: [],
      };

      mockPost.mockResolvedValueOnce({
        code: 200,
        msg: '创建角色成功',
        data: mockCreatedRole,
        timestamp: Date.now(),
      });

      const result = await createRole(createParams);

      expect(mockPost).toHaveBeenCalledWith('/admin/roles', createParams);
      expect(result.code).toBe(200);
      expect(result.data.roleCode).toBe('custom_role');
    });

    it('角色代码已存在时应该返回错误', async () => {
      const createParams: CreateRoleParams = {
        roleName: '重复角色',
        roleCode: 'super_admin',
        description: '尝试创建重复的角色代码',
      };

      mockPost.mockRejectedValueOnce({
        code: 400,
        msg: '角色代码已存在',
        data: null,
      });

      await expect(createRole(createParams)).rejects.toMatchObject({
        code: 400,
        msg: '角色代码已存在',
      });
    });

    it('角色名称已存在时应该返回错误', async () => {
      const createParams: CreateRoleParams = {
        roleName: '超级管理员',
        roleCode: 'new_admin',
        description: '尝试创建重复的角色名称',
      };

      mockPost.mockRejectedValueOnce({
        code: 400,
        msg: '角色名称已存在',
        data: null,
      });

      await expect(createRole(createParams)).rejects.toMatchObject({
        code: 400,
        msg: '角色名称已存在',
      });
    });

    it('缺少必填字段时应该返回错误', async () => {
      const createParams = {
        roleName: '',
        roleCode: '',
      } as CreateRoleParams;

      mockPost.mockRejectedValueOnce({
        code: 400,
        msg: '角色名称和角色代码为必填项',
        data: null,
      });

      await expect(createRole(createParams)).rejects.toMatchObject({
        code: 400,
      });
    });
  });

  /**
   * 7.3 更新角色 - PUT /api/v1/admin/roles/:roleId
   */
  describe('7.3 更新角色 - updateRole()', () => {
    it('应该正确调用PUT /admin/roles/:roleId接口', async () => {
      const roleId = 'role-001';
      const updateParams: UpdateRoleParams = {
        roleName: '更新后的角色名',
        description: '更新后的描述',
      };

      const mockUpdatedRole: Role = {
        roleId: 'role-001',
        roleName: '更新后的角色名',
        roleCode: 'custom_role',
        description: '更新后的描述',
        isSystem: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-12-25T00:00:00.000Z',
      };

      mockPut.mockResolvedValueOnce({
        code: 200,
        msg: '更新角色成功',
        data: mockUpdatedRole,
        timestamp: Date.now(),
      });

      const result = await updateRole(roleId, updateParams);

      expect(mockPut).toHaveBeenCalledWith(`/admin/roles/${roleId}`, updateParams);
      expect(result.code).toBe(200);
      expect(result.data.roleName).toBe('更新后的角色名');
    });

    it('角色不存在时应该返回404错误', async () => {
      const roleId = 'non-existent-role';
      const updateParams: UpdateRoleParams = {
        roleName: '新名称',
      };

      mockPut.mockRejectedValueOnce({
        code: 404,
        msg: '角色不存在',
        data: null,
      });

      await expect(updateRole(roleId, updateParams)).rejects.toMatchObject({
        code: 404,
        msg: '角色不存在',
      });
    });

    it('更新系统预设角色基本信息时应该返回错误', async () => {
      const roleId = 'system-role-001';
      const updateParams: UpdateRoleParams = {
        roleName: '尝试修改系统角色名',
      };

      mockPut.mockRejectedValueOnce({
        code: 403,
        msg: '系统预设角色不允许修改基本信息',
        data: null,
      });

      await expect(updateRole(roleId, updateParams)).rejects.toMatchObject({
        code: 403,
        msg: '系统预设角色不允许修改基本信息',
      });
    });
  });

  /**
   * 7.4 删除角色 - DELETE /api/v1/admin/roles/:roleId
   */
  describe('7.4 删除角色 - deleteRole()', () => {
    it('应该正确调用DELETE /admin/roles/:roleId接口', async () => {
      const roleId = 'role-custom-001';

      mockDel.mockResolvedValueOnce({
        code: 200,
        msg: '删除角色成功',
        data: null,
        timestamp: Date.now(),
      });

      const result = await deleteRole(roleId);

      expect(mockDel).toHaveBeenCalledWith(`/admin/roles/${roleId}`);
      expect(result.code).toBe(200);
      expect(result.msg).toBe('删除角色成功');
    });

    it('删除系统预设角色时应该返回错误', async () => {
      const roleId = 'super-admin-role';

      mockDel.mockRejectedValueOnce({
        code: 403,
        msg: '系统预设角色不允许删除',
        data: null,
      });

      await expect(deleteRole(roleId)).rejects.toMatchObject({
        code: 403,
        msg: '系统预设角色不允许删除',
      });
    });

    it('角色正在被使用时应该返回错误', async () => {
      const roleId = 'role-in-use';

      mockDel.mockRejectedValueOnce({
        code: 400,
        msg: '该角色正在被5个用户使用，无法删除',
        data: null,
      });

      await expect(deleteRole(roleId)).rejects.toMatchObject({
        code: 400,
        msg: '该角色正在被5个用户使用，无法删除',
      });
    });

    it('角色不存在时应该返回404错误', async () => {
      const roleId = 'non-existent-role';

      mockDel.mockRejectedValueOnce({
        code: 404,
        msg: '角色不存在',
        data: null,
      });

      await expect(deleteRole(roleId)).rejects.toMatchObject({
        code: 404,
        msg: '角色不存在',
      });
    });
  });

  /**
   * 7.5 获取所有权限 - GET /api/v1/admin/permissions
   */
  describe('7.5 获取所有权限 - getAllPermissions()', () => {
    it('应该正确调用GET /admin/permissions接口', async () => {
      const mockPermissions: Permission[] = [
        {
          permissionId: 'perm-001',
          permissionName: '查看用户',
          permissionCode: 'user:view',
          module: 'user',
          description: '查看用户列表和详情',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          permissionId: 'perm-002',
          permissionName: '编辑用户',
          permissionCode: 'user:edit',
          module: 'user',
          description: '编辑用户信息',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          permissionId: 'perm-003',
          permissionName: '查看资源',
          permissionCode: 'resource:view',
          module: 'resource',
          description: '查看资源列表和详情',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockGet.mockResolvedValueOnce({
        code: 200,
        msg: '获取权限列表成功',
        data: mockPermissions,
        timestamp: Date.now(),
      });

      const result = await getAllPermissions();

      expect(mockGet).toHaveBeenCalledWith('/admin/permissions');
      expect(result.code).toBe(200);
      expect(result.data).toHaveLength(3);
    });

    it('权限应该包含模块信息', async () => {
      const mockPermissions: Permission[] = [
        {
          permissionId: 'perm-001',
          permissionName: '查看用户',
          permissionCode: 'user:view',
          module: 'user',
          description: null,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockGet.mockResolvedValueOnce({
        code: 200,
        msg: '获取权限列表成功',
        data: mockPermissions,
        timestamp: Date.now(),
      });

      const result = await getAllPermissions();

      expect(result.data[0].module).toBe('user');
      expect(result.data[0].permissionCode).toBe('user:view');
    });

    it('未授权时应该返回401错误', async () => {
      mockGet.mockRejectedValueOnce({
        code: 401,
        msg: '请先登录',
        data: null,
      });

      await expect(getAllPermissions()).rejects.toMatchObject({
        code: 401,
        msg: '请先登录',
      });
    });
  });

  /**
   * 7.6 为角色分配权限 - PUT /api/v1/admin/roles/:roleId/permissions
   */
  describe('7.6 为角色分配权限 - assignPermissions()', () => {
    it('应该正确调用PUT /admin/roles/:roleId/permissions接口', async () => {
      const roleId = 'role-001';
      const permissionIds = ['perm-001', 'perm-002', 'perm-003'];

      const mockUpdatedRole: Role = {
        roleId: 'role-001',
        roleName: '自定义角色',
        roleCode: 'custom_role',
        description: '测试角色',
        isSystem: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-12-25T00:00:00.000Z',
        permissions: [
          {
            permissionId: 'perm-001',
            permissionName: '查看用户',
            permissionCode: 'user:view',
            module: 'user',
            description: null,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
      };

      mockPut.mockResolvedValueOnce({
        code: 200,
        msg: '权限分配成功',
        data: mockUpdatedRole,
        timestamp: Date.now(),
      });

      const result = await assignPermissions(roleId, permissionIds);

      expect(mockPut).toHaveBeenCalledWith(`/admin/roles/${roleId}/permissions`, {
        permissionIds,
      });
      expect(result.code).toBe(200);
      expect(result.msg).toBe('权限分配成功');
    });

    it('分配空权限列表应该清空角色权限', async () => {
      const roleId = 'role-001';
      const permissionIds: string[] = [];

      const mockUpdatedRole: Role = {
        roleId: 'role-001',
        roleName: '自定义角色',
        roleCode: 'custom_role',
        description: '测试角色',
        isSystem: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-12-25T00:00:00.000Z',
        permissions: [],
      };

      mockPut.mockResolvedValueOnce({
        code: 200,
        msg: '权限分配成功',
        data: mockUpdatedRole,
        timestamp: Date.now(),
      });

      const result = await assignPermissions(roleId, permissionIds);

      expect(mockPut).toHaveBeenCalledWith(`/admin/roles/${roleId}/permissions`, {
        permissionIds: [],
      });
      expect(result.data.permissions).toHaveLength(0);
    });

    it('角色不存在时应该返回404错误', async () => {
      const roleId = 'non-existent-role';
      const permissionIds = ['perm-001'];

      mockPut.mockRejectedValueOnce({
        code: 404,
        msg: '角色不存在',
        data: null,
      });

      await expect(assignPermissions(roleId, permissionIds)).rejects.toMatchObject({
        code: 404,
        msg: '角色不存在',
      });
    });

    it('权限ID不存在时应该返回错误', async () => {
      const roleId = 'role-001';
      const permissionIds = ['non-existent-perm'];

      mockPut.mockRejectedValueOnce({
        code: 400,
        msg: '部分权限ID不存在',
        data: null,
      });

      await expect(assignPermissions(roleId, permissionIds)).rejects.toMatchObject({
        code: 400,
        msg: '部分权限ID不存在',
      });
    });
  });
});
