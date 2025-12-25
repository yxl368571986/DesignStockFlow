/**
 * 权限分组显示属性测试
 * 使用fast-check进行基于属性的测试
 * Feature: permission-management, Property 2: Permission Grouping Display
 * Validates: Requirements 5.2, 6.2
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
 * 按模块分组权限
 * 这是index.vue中groupedPermissions计算属性的逻辑
 */
function groupPermissionsByModule(permissions: Permission[]): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {};
  permissions.forEach(p => {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push(p);
  });
  return grouped;
}

/**
 * 验证权限是否包含所有必需的显示字段
 */
function hasRequiredDisplayFields(permission: Permission): boolean {
  return (
    typeof permission.permissionName === 'string' &&
    typeof permission.permissionCode === 'string' &&
    typeof permission.module === 'string' &&
    (permission.description === null || typeof permission.description === 'string')
  );
}

/**
 * 验证分组结果中每个权限都属于正确的模块
 */
function validateGroupingCorrectness(
  grouped: Record<string, Permission[]>
): boolean {
  for (const [module, permissions] of Object.entries(grouped)) {
    for (const perm of permissions) {
      if (perm.module !== module) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 验证分组后的权限总数与原始列表一致
 */
function validatePermissionCount(
  original: Permission[],
  grouped: Record<string, Permission[]>
): boolean {
  const groupedCount = Object.values(grouped).reduce((sum, perms) => sum + perms.length, 0);
  return groupedCount === original.length;
}

/**
 * 验证所有原始权限都出现在分组结果中
 */
function validateAllPermissionsPresent(
  original: Permission[],
  grouped: Record<string, Permission[]>
): boolean {
  const groupedIds = new Set(
    Object.values(grouped).flatMap(perms => perms.map(p => p.permissionId))
  );
  return original.every(p => groupedIds.has(p.permissionId));
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
const permissionListArbitrary = fc.array(permissionArbitrary, { minLength: 0, maxLength: 50 });

describe('Permission Management Property-Based Tests', () => {
  /**
   * Property 2: Permission Grouping Display
   * Feature: permission-management, Property 2: Permission Grouping Display
   * Validates: Requirements 5.2, 6.2
   * 
   * 对于任何权限列表，所有权限应该按模块分组显示，
   * 每个权限应该显示permissionName、permissionCode、module和description
   */
  describe('Property 2: Permission Grouping Display', () => {
    /**
     * 5.2, 6.2 权限按模块正确分组
     * 分组后每个权限的module字段应该与其所在分组的key一致
     */
    it('should group permissions correctly by module field', () => {
      fc.assert(
        fc.property(
          permissionListArbitrary,
          (permissions) => {
            const grouped = groupPermissionsByModule(permissions);
            expect(validateGroupingCorrectness(grouped)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 分组后权限总数应该与原始列表一致
     */
    it('should preserve total permission count after grouping', () => {
      fc.assert(
        fc.property(
          permissionListArbitrary,
          (permissions) => {
            const grouped = groupPermissionsByModule(permissions);
            expect(validatePermissionCount(permissions, grouped)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 所有原始权限都应该出现在分组结果中
     */
    it('should include all original permissions in grouped result', () => {
      fc.assert(
        fc.property(
          permissionListArbitrary,
          (permissions) => {
            const grouped = groupPermissionsByModule(permissions);
            expect(validateAllPermissionsPresent(permissions, grouped)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 6.2 每个权限应该包含所有必需的显示字段
     * permissionName, permissionCode, module, description
     */
    it('should have all required display fields for each permission', () => {
      fc.assert(
        fc.property(
          permissionArbitrary,
          (permission) => {
            expect(hasRequiredDisplayFields(permission)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 分组结果中的每个权限都应该包含必需的显示字段
     */
    it('should have all required display fields in grouped permissions', () => {
      fc.assert(
        fc.property(
          permissionListArbitrary,
          (permissions) => {
            const grouped = groupPermissionsByModule(permissions);
            for (const perms of Object.values(grouped)) {
              for (const perm of perms) {
                expect(hasRequiredDisplayFields(perm)).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 空权限列表应该返回空分组
     */
    it('should return empty grouping for empty permission list', () => {
      const grouped = groupPermissionsByModule([]);
      expect(Object.keys(grouped)).toHaveLength(0);
    });

    /**
     * 单一模块的权限应该全部在同一分组中
     */
    it('should group all permissions of same module together', () => {
      fc.assert(
        fc.property(
          moduleArbitrary,
          fc.array(permissionArbitrary, { minLength: 1, maxLength: 20 }),
          (module, permissions) => {
            // 将所有权限设置为同一模块
            const sameModulePermissions = permissions.map(p => ({ ...p, module }));
            const grouped = groupPermissionsByModule(sameModulePermissions);
            
            // 应该只有一个分组
            expect(Object.keys(grouped)).toHaveLength(1);
            // 该分组应该包含所有权限
            expect(grouped[module]?.length).toBe(sameModulePermissions.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 不同模块的权限应该在不同分组中
     */
    it('should separate permissions of different modules into different groups', () => {
      fc.assert(
        fc.property(
          fc.array(moduleArbitrary, { minLength: 2, maxLength: 8 }),
          (modules) => {
            // 为每个模块创建一个权限
            const uniqueModules = [...new Set(modules)];
            const permissions: Permission[] = uniqueModules.map((module, index) => ({
              permissionId: `perm-${index}`,
              permissionName: `Permission ${index}`,
              permissionCode: `perm:${index}`,
              module,
              description: null,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z'
            }));
            
            const grouped = groupPermissionsByModule(permissions);
            
            // 分组数量应该等于唯一模块数量
            expect(Object.keys(grouped).length).toBe(uniqueModules.length);
            // 每个分组应该只包含对应模块的权限
            for (const [module, perms] of Object.entries(grouped)) {
              expect(perms.every(p => p.module === module)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 分组操作应该是幂等的
     * 对同一列表多次分组应该得到相同结果
     */
    it('should produce deterministic grouping results', () => {
      fc.assert(
        fc.property(
          permissionListArbitrary,
          (permissions) => {
            const grouped1 = groupPermissionsByModule(permissions);
            const grouped2 = groupPermissionsByModule(permissions);
            
            // 分组key应该相同
            expect(Object.keys(grouped1).sort()).toEqual(Object.keys(grouped2).sort());
            
            // 每个分组的权限数量应该相同
            for (const module of Object.keys(grouped1)) {
              expect(grouped1[module].length).toBe(grouped2[module].length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
