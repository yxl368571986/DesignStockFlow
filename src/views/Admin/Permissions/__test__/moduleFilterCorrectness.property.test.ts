/**
 * 模块筛选正确性属性测试
 * 使用fast-check进行基于属性的测试
 * Feature: permission-management, Property 4: Module Filter Correctness
 * Validates: Requirements 6.3
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
 * 模块筛选函数
 * 这是index.vue中filteredPermissions计算属性的逻辑
 * @param groupedPermissions 按模块分组的权限
 * @param selectedModule 选中的模块，空字符串表示不筛选
 * @returns 筛选后的权限分组
 */
function filterPermissionsByModule(
  groupedPermissions: Record<string, Permission[]>,
  selectedModule: string
): Record<string, Permission[]> {
  if (!selectedModule) return groupedPermissions;
  return { [selectedModule]: groupedPermissions[selectedModule] || [] };
}

/**
 * 验证筛选结果中所有权限的module字段都等于选中的模块
 */
function validateFilteredPermissionsModule(
  filtered: Record<string, Permission[]>,
  selectedModule: string
): boolean {
  // 如果没有选择模块，不需要验证
  if (!selectedModule) return true;
  
  // 筛选结果应该只有一个key，且等于selectedModule
  const keys = Object.keys(filtered);
  if (keys.length > 1) return false;
  if (keys.length === 1 && keys[0] !== selectedModule) return false;
  
  // 所有权限的module字段都应该等于selectedModule
  const permissions = filtered[selectedModule] || [];
  return permissions.every(p => p.module === selectedModule);
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
   * Property 4: Module Filter Correctness
   * Feature: permission-management, Property 4: Module Filter Correctness
   * Validates: Requirements 6.3
   * 
   * 对于任何应用于权限列表的模块筛选，
   * 筛选结果应该只包含permission.module等于选中模块的权限
   */
  describe('Property 4: Module Filter Correctness', () => {
    /**
     * 6.3 筛选后的权限列表只包含选中模块的权限
     */
    it('should only contain permissions where module equals selected module', () => {
      fc.assert(
        fc.property(
          permissionListArbitrary,
          moduleArbitrary,
          (permissions, selectedModule) => {
            const grouped = groupPermissionsByModule(permissions);
            const filtered = filterPermissionsByModule(grouped, selectedModule);
            
            expect(validateFilteredPermissionsModule(filtered, selectedModule)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 不选择模块时应该返回所有分组
     */
    it('should return all groups when no module is selected', () => {
      fc.assert(
        fc.property(
          permissionListArbitrary,
          (permissions) => {
            const grouped = groupPermissionsByModule(permissions);
            const filtered = filterPermissionsByModule(grouped, '');
            
            // 不筛选时应该返回原始分组
            expect(Object.keys(filtered).sort()).toEqual(Object.keys(grouped).sort());
            
            // 每个分组的权限数量应该相同
            for (const module of Object.keys(grouped)) {
              expect(filtered[module]?.length).toBe(grouped[module].length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 筛选结果应该只有一个分组（当选择了模块时）
     */
    it('should return only one group when a module is selected', () => {
      fc.assert(
        fc.property(
          permissionListArbitrary,
          moduleArbitrary,
          (permissions, selectedModule) => {
            const grouped = groupPermissionsByModule(permissions);
            const filtered = filterPermissionsByModule(grouped, selectedModule);
            
            // 筛选后应该只有一个分组
            expect(Object.keys(filtered).length).toBeLessThanOrEqual(1);
            
            // 如果有分组，key应该等于selectedModule
            if (Object.keys(filtered).length === 1) {
              expect(Object.keys(filtered)[0]).toBe(selectedModule);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 筛选不存在的模块应该返回空数组
     */
    it('should return empty array for non-existent module', () => {
      // 排除系统模块和JavaScript保留属性名
      const reservedNames = [
        'user', 'resource', 'audit', 'category', 'operation', 'statistics', 'system', 'role',
        'constructor', 'prototype', '__proto__', 'hasOwnProperty', 'toString', 'valueOf'
      ];
      
      fc.assert(
        fc.property(
          permissionListArbitrary,
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !reservedNames.includes(s)),
          (permissions, nonExistentModule) => {
            const grouped = groupPermissionsByModule(permissions);
            const filtered = filterPermissionsByModule(grouped, nonExistentModule);
            
            // 筛选不存在的模块应该返回空数组
            expect(filtered[nonExistentModule]).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 筛选结果的权限数量应该等于原始分组中该模块的权限数量
     */
    it('should preserve permission count for selected module', () => {
      fc.assert(
        fc.property(
          permissionListArbitrary,
          moduleArbitrary,
          (permissions, selectedModule) => {
            const grouped = groupPermissionsByModule(permissions);
            const filtered = filterPermissionsByModule(grouped, selectedModule);
            
            const originalCount = grouped[selectedModule]?.length || 0;
            const filteredCount = filtered[selectedModule]?.length || 0;
            
            expect(filteredCount).toBe(originalCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 筛选操作应该是幂等的
     */
    it('should produce deterministic filtering results', () => {
      fc.assert(
        fc.property(
          permissionListArbitrary,
          moduleArbitrary,
          (permissions, selectedModule) => {
            const grouped = groupPermissionsByModule(permissions);
            const filtered1 = filterPermissionsByModule(grouped, selectedModule);
            const filtered2 = filterPermissionsByModule(grouped, selectedModule);
            
            // 两次筛选结果应该相同
            expect(Object.keys(filtered1).sort()).toEqual(Object.keys(filtered2).sort());
            
            for (const module of Object.keys(filtered1)) {
              expect(filtered1[module].length).toBe(filtered2[module].length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 筛选后的权限应该保持原始顺序
     */
    it('should preserve permission order within filtered module', () => {
      fc.assert(
        fc.property(
          permissionListArbitrary,
          moduleArbitrary,
          (permissions, selectedModule) => {
            const grouped = groupPermissionsByModule(permissions);
            const filtered = filterPermissionsByModule(grouped, selectedModule);
            
            const originalPerms = grouped[selectedModule] || [];
            const filteredPerms = filtered[selectedModule] || [];
            
            // 权限ID顺序应该保持一致
            const originalIds = originalPerms.map(p => p.permissionId);
            const filteredIds = filteredPerms.map(p => p.permissionId);
            
            expect(filteredIds).toEqual(originalIds);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 连续筛选不同模块应该正确切换
     */
    it('should correctly switch between different module filters', () => {
      fc.assert(
        fc.property(
          permissionListArbitrary,
          fc.array(moduleArbitrary, { minLength: 2, maxLength: 5 }),
          (permissions, modules) => {
            const grouped = groupPermissionsByModule(permissions);
            
            // 连续筛选不同模块
            for (const module of modules) {
              const filtered = filterPermissionsByModule(grouped, module);
              
              // 每次筛选结果都应该只包含对应模块的权限
              expect(validateFilteredPermissionsModule(filtered, module)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
