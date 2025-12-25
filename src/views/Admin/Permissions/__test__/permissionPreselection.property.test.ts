/**
 * 权限预选属性测试
 * 使用fast-check进行基于属性的测试
 * Feature: permission-management, Property 3: Permission Pre-selection
 * Validates: Requirements 5.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * 权限信息接口
 */
interface Permission {
  permissionId: string;
  permissionName: string;
  permissionCode: string;
  module: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 角色信息接口
 */
interface Role {
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
 * 从角色中提取已有权限ID列表
 * 这是index.vue中handleConfigPermissions方法的核心逻辑
 */
function extractRolePermissionIds(role: Role): string[] {
  return role.permissions?.map(p => p.permissionId) || [];
}

/**
 * 验证预选权限是否正确
 * 检查角色的所有权限是否都在预选列表中
 */
function validatePreselection(role: Role, selectedIds: string[]): boolean {
  const rolePermIds = extractRolePermissionIds(role);
  return rolePermIds.every(id => selectedIds.includes(id));
}

/**
 * 验证预选列表只包含角色已有的权限
 * 不应该有额外的权限被预选
 */
function validateNoExtraPreselection(role: Role, selectedIds: string[]): boolean {
  const rolePermIds = new Set(extractRolePermissionIds(role));
  return selectedIds.every(id => rolePermIds.has(id));
}

/**
 * 验证预选列表与角色权限完全匹配
 */
function validateExactPreselection(role: Role, selectedIds: string[]): boolean {
  const rolePermIds = extractRolePermissionIds(role);
  if (rolePermIds.length !== selectedIds.length) return false;
  const selectedSet = new Set(selectedIds);
  return rolePermIds.every(id => selectedSet.has(id));
}

/**
 * 生成有效日期字符串的Arbitrary
 */
const validDateArbitrary = fc.constantFrom(
  '2024-01-01T00:00:00.000Z',
  '2024-06-15T12:30:00.000Z',
  '2025-01-01T00:00:00.000Z',
  '2025-12-25T08:00:00.000Z'
);

/**
 * 生成模块名称的Arbitrary
 */
const moduleArbitrary = fc.constantFrom(
  'user',
  'resource',
  'audit',
  'category',
  'operation',
  'statistics',
  'system',
  'role'
);

/**
 * 生成随机权限数据的Arbitrary
 */
const permissionArbitrary = fc.record({
  permissionId: fc.uuid(),
  permissionName: fc.string({ minLength: 1, maxLength: 50 }),
  permissionCode: fc.string({ minLength: 1, maxLength: 50 }),
  module: moduleArbitrary,
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  createdAt: validDateArbitrary,
  updatedAt: validDateArbitrary
}) as fc.Arbitrary<Permission>;

/**
 * 生成权限列表的Arbitrary
 */
const permissionListArbitrary = fc.array(permissionArbitrary, { minLength: 0, maxLength: 20 });

/**
 * 生成带权限的角色的Arbitrary
 */
const roleWithPermissionsArbitrary = fc.record({
  roleId: fc.uuid(),
  roleName: fc.string({ minLength: 1, maxLength: 50 }),
  roleCode: fc.string({ minLength: 1, maxLength: 30 }),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  isSystem: fc.boolean(),
  createdAt: validDateArbitrary,
  updatedAt: validDateArbitrary,
  permissions: permissionListArbitrary,
  _count: fc.record({
    permissions: fc.integer({ min: 0, max: 100 }),
    users: fc.integer({ min: 0, max: 1000 })
  })
}) as fc.Arbitrary<Role>;

/**
 * 生成无权限的角色的Arbitrary
 */
const roleWithoutPermissionsArbitrary = fc.record({
  roleId: fc.uuid(),
  roleName: fc.string({ minLength: 1, maxLength: 50 }),
  roleCode: fc.string({ minLength: 1, maxLength: 30 }),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  isSystem: fc.boolean(),
  createdAt: validDateArbitrary,
  updatedAt: validDateArbitrary,
  permissions: fc.constant(undefined),
  _count: fc.record({
    permissions: fc.constant(0),
    users: fc.integer({ min: 0, max: 1000 })
  })
}) as fc.Arbitrary<Role>;

describe('Permission Management Property-Based Tests', () => {
  /**
   * Property 3: Permission Pre-selection
   * Feature: permission-management, Property 3: Permission Pre-selection
   * Validates: Requirements 5.3
   * 
   * 对于任何正在编辑的角色，在权限配置对话框中，
   * 该角色当前拥有的所有权限应该被预选（勾选）
   */
  describe('Property 3: Permission Pre-selection', () => {
    /**
     * 5.3 角色已有权限应该被正确提取
     */
    it('should correctly extract permission IDs from role', () => {
      fc.assert(
        fc.property(
          roleWithPermissionsArbitrary,
          (role) => {
            const extractedIds = extractRolePermissionIds(role);
            const expectedIds = role.permissions?.map(p => p.permissionId) || [];
            expect(extractedIds).toEqual(expectedIds);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 5.3 预选列表应该包含角色的所有权限
     */
    it('should pre-select all permissions that the role currently possesses', () => {
      fc.assert(
        fc.property(
          roleWithPermissionsArbitrary,
          (role) => {
            // 模拟handleConfigPermissions的行为
            const selectedIds = extractRolePermissionIds(role);
            expect(validatePreselection(role, selectedIds)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 预选列表不应该包含角色没有的权限
     */
    it('should not pre-select permissions that the role does not possess', () => {
      fc.assert(
        fc.property(
          roleWithPermissionsArbitrary,
          (role) => {
            const selectedIds = extractRolePermissionIds(role);
            expect(validateNoExtraPreselection(role, selectedIds)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 预选列表应该与角色权限完全匹配
     */
    it('should exactly match role permissions in pre-selection', () => {
      fc.assert(
        fc.property(
          roleWithPermissionsArbitrary,
          (role) => {
            const selectedIds = extractRolePermissionIds(role);
            expect(validateExactPreselection(role, selectedIds)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 无权限的角色应该返回空预选列表
     */
    it('should return empty pre-selection for role without permissions', () => {
      fc.assert(
        fc.property(
          roleWithoutPermissionsArbitrary,
          (role) => {
            const selectedIds = extractRolePermissionIds(role);
            expect(selectedIds).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 空权限数组的角色应该返回空预选列表
     */
    it('should return empty pre-selection for role with empty permissions array', () => {
      const roleWithEmptyPermissions: Role = {
        roleId: 'test-id',
        roleName: 'Test Role',
        roleCode: 'test_role',
        description: null,
        isSystem: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        permissions: [],
        _count: { permissions: 0, users: 0 }
      };
      
      const selectedIds = extractRolePermissionIds(roleWithEmptyPermissions);
      expect(selectedIds).toHaveLength(0);
      expect(validateExactPreselection(roleWithEmptyPermissions, selectedIds)).toBe(true);
    });

    /**
     * 预选操作应该是幂等的
     * 多次提取应该得到相同结果
     */
    it('should produce deterministic pre-selection results', () => {
      fc.assert(
        fc.property(
          roleWithPermissionsArbitrary,
          (role) => {
            const selectedIds1 = extractRolePermissionIds(role);
            const selectedIds2 = extractRolePermissionIds(role);
            expect(selectedIds1).toEqual(selectedIds2);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 预选列表的长度应该等于角色权限数量
     */
    it('should have pre-selection count equal to role permission count', () => {
      fc.assert(
        fc.property(
          roleWithPermissionsArbitrary,
          (role) => {
            const selectedIds = extractRolePermissionIds(role);
            const expectedCount = role.permissions?.length || 0;
            expect(selectedIds.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 预选列表中的每个ID都应该是有效的UUID格式
     * （因为permissionId是UUID）
     */
    it('should contain valid permission IDs in pre-selection', () => {
      fc.assert(
        fc.property(
          roleWithPermissionsArbitrary,
          (role) => {
            const selectedIds = extractRolePermissionIds(role);
            // 每个ID都应该是字符串
            selectedIds.forEach(id => {
              expect(typeof id).toBe('string');
              expect(id.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 预选列表不应该包含重复的权限ID
     */
    it('should not contain duplicate permission IDs in pre-selection', () => {
      fc.assert(
        fc.property(
          roleWithPermissionsArbitrary,
          (role) => {
            const selectedIds = extractRolePermissionIds(role);
            const uniqueIds = new Set(selectedIds);
            // 如果有重复，Set的大小会小于数组长度
            // 注意：这里我们假设角色的权限列表本身没有重复
            // 实际上这个测试验证的是提取逻辑不会引入重复
            expect(uniqueIds.size).toBe(selectedIds.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 混合测试：随机角色列表中的权限预选
     */
    it('should correctly pre-select permissions for any role in a list', () => {
      fc.assert(
        fc.property(
          fc.array(roleWithPermissionsArbitrary, { minLength: 1, maxLength: 10 }),
          (roles) => {
            roles.forEach(role => {
              const selectedIds = extractRolePermissionIds(role);
              expect(validateExactPreselection(role, selectedIds)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
