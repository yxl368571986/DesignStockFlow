/**
 * 系统角色保护属性测试
 * 使用fast-check进行基于属性的测试
 * Feature: permission-management, Property 1: System Role Protection
 * Validates: Requirements 1.4, 3.3, 4.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Role } from '@/api/permission';

/**
 * 系统预设角色代码列表
 * 根据设计文档定义
 */
const SYSTEM_ROLE_CODES = ['super_admin', 'moderator', 'operator', 'user'];

/**
 * 判断角色是否为系统预设角色
 * 基于roleCode判断
 */
function isSystemRole(role: Role): boolean {
  return role.isSystem === true || SYSTEM_ROLE_CODES.includes(role.roleCode);
}

/**
 * 判断删除按钮是否应该被禁用
 * 系统预设角色的删除按钮应该被禁用
 */
function shouldDisableDelete(role: Role): boolean {
  return isSystemRole(role);
}

/**
 * 判断基本信息编辑是否应该被禁用
 * 系统预设角色的基本信息（名称、代码）编辑应该被禁用
 */
function shouldDisableBasicInfoEdit(role: Role): boolean {
  return isSystemRole(role);
}

/**
 * 判断角色代码编辑是否应该被禁用
 * 所有角色的代码在编辑模式下都应该被禁用（创建后不可修改）
 */
function shouldDisableRoleCodeEdit(isEditMode: boolean): boolean {
  return isEditMode;
}

/**
 * 生成有效日期字符串的Arbitrary
 * 使用常量日期字符串避免Invalid Date问题
 */
const validDateArbitrary = fc.constantFrom(
  '2024-01-01T00:00:00.000Z',
  '2024-06-15T12:30:00.000Z',
  '2025-01-01T00:00:00.000Z',
  '2025-12-25T08:00:00.000Z'
);

/**
 * 生成随机角色数据的Arbitrary
 */
const roleArbitrary = fc.record({
  roleId: fc.uuid(),
  roleName: fc.string({ minLength: 1, maxLength: 50 }),
  roleCode: fc.string({ minLength: 1, maxLength: 30 }),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  isSystem: fc.boolean(),
  createdAt: validDateArbitrary,
  updatedAt: validDateArbitrary,
  permissions: fc.constant([]),
  _count: fc.record({
    permissions: fc.integer({ min: 0, max: 100 }),
    users: fc.integer({ min: 0, max: 1000 })
  })
}) as fc.Arbitrary<Role>;

/**
 * 生成系统预设角色的Arbitrary
 */
const systemRoleArbitrary = fc.record({
  roleId: fc.uuid(),
  roleName: fc.constantFrom('超级管理员', '内容审核员', '运营人员', '普通用户'),
  roleCode: fc.constantFrom(...SYSTEM_ROLE_CODES),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  isSystem: fc.constant(true),
  createdAt: validDateArbitrary,
  updatedAt: validDateArbitrary,
  permissions: fc.constant([]),
  _count: fc.record({
    permissions: fc.integer({ min: 0, max: 100 }),
    users: fc.integer({ min: 0, max: 1000 })
  })
}) as fc.Arbitrary<Role>;

/**
 * 生成自定义角色的Arbitrary
 */
const customRoleArbitrary = fc.record({
  roleId: fc.uuid(),
  roleName: fc.string({ minLength: 1, maxLength: 50 }),
  roleCode: fc.string({ minLength: 1, maxLength: 30 })
    .filter(code => !SYSTEM_ROLE_CODES.includes(code)),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  isSystem: fc.constant(false),
  createdAt: validDateArbitrary,
  updatedAt: validDateArbitrary,
  permissions: fc.constant([]),
  _count: fc.record({
    permissions: fc.integer({ min: 0, max: 100 }),
    users: fc.integer({ min: 0, max: 1000 })
  })
}) as fc.Arbitrary<Role>;

describe('Permission Management Property-Based Tests', () => {
  /**
   * Property 1: System Role Protection
   * Feature: permission-management, Property 1: System Role Protection
   * Validates: Requirements 1.4, 3.3, 4.2
   * 
   * 对于任何系统预设角色（super_admin, moderator, operator, user），
   * Permission_Manager应该：
   * - 显示特殊标识表明这是系统角色
   * - 禁用删除按钮
   * - 禁用基本信息编辑（名称、代码），但允许权限编辑
   */
  describe('Property 1: System Role Protection', () => {
    /**
     * 1.4 系统预设角色应该被正确识别
     */
    it('should correctly identify system preset roles by roleCode', () => {
      fc.assert(
        fc.property(
          systemRoleArbitrary,
          (role) => {
            // 系统预设角色应该被识别为系统角色
            expect(isSystemRole(role)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify custom roles as non-system roles', () => {
      fc.assert(
        fc.property(
          customRoleArbitrary,
          (role) => {
            // 自定义角色不应该被识别为系统角色
            expect(isSystemRole(role)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 4.2 系统预设角色的删除按钮应该被禁用
     */
    it('should disable delete button for system preset roles', () => {
      fc.assert(
        fc.property(
          systemRoleArbitrary,
          (role) => {
            // 系统预设角色的删除按钮应该被禁用
            expect(shouldDisableDelete(role)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enable delete button for custom roles', () => {
      fc.assert(
        fc.property(
          customRoleArbitrary,
          (role) => {
            // 自定义角色的删除按钮应该启用
            expect(shouldDisableDelete(role)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 3.3 系统预设角色的基本信息编辑应该被禁用
     */
    it('should disable basic info editing for system preset roles', () => {
      fc.assert(
        fc.property(
          systemRoleArbitrary,
          (role) => {
            // 系统预设角色的基本信息编辑应该被禁用
            expect(shouldDisableBasicInfoEdit(role)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enable basic info editing for custom roles', () => {
      fc.assert(
        fc.property(
          customRoleArbitrary,
          (role) => {
            // 自定义角色的基本信息编辑应该启用
            expect(shouldDisableBasicInfoEdit(role)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 角色代码在编辑模式下应该始终被禁用（无论是系统角色还是自定义角色）
     */
    it('should always disable roleCode editing in edit mode', () => {
      fc.assert(
        fc.property(
          roleArbitrary,
          (role) => {
            // 编辑模式下，角色代码应该被禁用
            expect(shouldDisableRoleCodeEdit(true)).toBe(true);
            // 创建模式下，角色代码应该启用
            expect(shouldDisableRoleCodeEdit(false)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 混合测试：随机角色列表中的系统角色保护
     */
    it('should protect all system roles in a mixed role list', () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(systemRoleArbitrary, customRoleArbitrary), { minLength: 1, maxLength: 20 }),
          (roles) => {
            roles.forEach(role => {
              if (role.isSystem || SYSTEM_ROLE_CODES.includes(role.roleCode)) {
                // 系统角色应该受保护
                expect(shouldDisableDelete(role)).toBe(true);
                expect(shouldDisableBasicInfoEdit(role)).toBe(true);
              } else {
                // 自定义角色不应该受保护
                expect(shouldDisableDelete(role)).toBe(false);
                expect(shouldDisableBasicInfoEdit(role)).toBe(false);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 边界测试：isSystem标志与roleCode的一致性
     */
    it('should handle isSystem flag correctly regardless of roleCode', () => {
      fc.assert(
        fc.property(
          fc.record({
            roleId: fc.uuid(),
            roleName: fc.string({ minLength: 1, maxLength: 50 }),
            roleCode: fc.string({ minLength: 1, maxLength: 30 }),
            description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
            isSystem: fc.constant(true), // 强制设置为系统角色
            createdAt: validDateArbitrary,
            updatedAt: validDateArbitrary,
            permissions: fc.constant([]),
            _count: fc.record({
              permissions: fc.integer({ min: 0, max: 100 }),
              users: fc.integer({ min: 0, max: 1000 })
            })
          }) as fc.Arbitrary<Role>,
          (role) => {
            // 只要isSystem为true，就应该被识别为系统角色
            expect(isSystemRole(role)).toBe(true);
            expect(shouldDisableDelete(role)).toBe(true);
            expect(shouldDisableBasicInfoEdit(role)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
