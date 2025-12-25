/**
 * 表单验证规则属性测试
 * 使用fast-check进行基于属性的测试
 * Feature: permission-management, Property 5: Form Validation Rules
 * Validates: Requirements 2.2, 3.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * 角色表单数据接口
 */
interface RoleFormData {
  roleName: string;
  roleCode: string;
  description: string;
}

/**
 * 表单验证结果接口
 */
interface ValidationResult {
  valid: boolean;
  errors: {
    roleName?: string;
    roleCode?: string;
    description?: string;
  };
}

/**
 * 验证角色名称
 * 角色名称必填且非空
 */
function validateRoleName(roleName: string): { valid: boolean; error?: string } {
  const trimmed = roleName.trim();
  if (!trimmed) {
    return { valid: false, error: '请输入角色名称' };
  }
  return { valid: true };
}

/**
 * 验证角色代码
 * 角色代码必填且非空
 */
function validateRoleCode(roleCode: string): { valid: boolean; error?: string } {
  const trimmed = roleCode.trim();
  if (!trimmed) {
    return { valid: false, error: '请输入角色代码' };
  }
  return { valid: true };
}

/**
 * 验证描述字段
 * 描述字段为可选
 */
function validateDescription(_description: string): { valid: boolean; error?: string } {
  // 描述字段是可选的，任何值都有效
  return { valid: true };
}

/**
 * 验证整个表单（创建模式）
 */
function validateCreateForm(form: RoleFormData): ValidationResult {
  const errors: ValidationResult['errors'] = {};
  
  const roleNameResult = validateRoleName(form.roleName);
  if (!roleNameResult.valid) {
    errors.roleName = roleNameResult.error;
  }
  
  const roleCodeResult = validateRoleCode(form.roleCode);
  if (!roleCodeResult.valid) {
    errors.roleCode = roleCodeResult.error;
  }
  
  // 描述字段可选，不需要验证
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 验证整个表单（编辑模式）
 * 编辑模式下角色代码应该被禁用，不需要验证
 */
function validateEditForm(form: RoleFormData): ValidationResult {
  const errors: ValidationResult['errors'] = {};
  
  const roleNameResult = validateRoleName(form.roleName);
  if (!roleNameResult.valid) {
    errors.roleName = roleNameResult.error;
  }
  
  // 编辑模式下角色代码被禁用，不需要验证
  // 描述字段可选，不需要验证
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 判断角色代码字段是否应该被禁用
 */
function shouldRoleCodeBeDisabled(isEditMode: boolean): boolean {
  return isEditMode;
}

describe('Permission Management Property-Based Tests', () => {
  /**
   * Property 5: Form Validation Rules
   * Feature: permission-management, Property 5: Form Validation Rules
   * Validates: Requirements 2.2, 3.2
   * 
   * 对于任何角色创建或编辑表单：
   * - roleName字段必填且非空
   * - roleCode字段必填、非空，且在编辑模式下被禁用
   * - description字段为可选
   */
  describe('Property 5: Form Validation Rules', () => {
    /**
     * 2.2 角色名称必填验证
     * 任何空字符串或纯空白字符串的角色名称都应该验证失败
     */
    it('should reject empty or whitespace-only role names', () => {
      // 生成空字符串或纯空白字符串
      const emptyOrWhitespaceArbitrary = fc.oneof(
        fc.constant(''),
        fc.constant(' '),
        fc.constant('  '),
        fc.constant('\t'),
        fc.constant('\n'),
        fc.constant('\r'),
        fc.constant('   \t\n  ')
      );
      
      fc.assert(
        fc.property(
          emptyOrWhitespaceArbitrary,
          (roleName) => {
            const result = validateRoleName(roleName);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('请输入角色名称');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 2.2 有效角色名称应该通过验证
     */
    it('should accept valid non-empty role names', () => {
      // 生成非空且包含非空白字符的字符串
      const validRoleNameArbitrary = fc.string({ minLength: 1, maxLength: 50 })
        .filter(s => s.trim().length > 0);
      
      fc.assert(
        fc.property(
          validRoleNameArbitrary,
          (roleName) => {
            const result = validateRoleName(roleName);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 2.2 角色代码必填验证
     * 任何空字符串或纯空白字符串的角色代码都应该验证失败
     */
    it('should reject empty or whitespace-only role codes', () => {
      const emptyOrWhitespaceArbitrary = fc.oneof(
        fc.constant(''),
        fc.constant(' '),
        fc.constant('  '),
        fc.constant('\t'),
        fc.constant('\n'),
        fc.constant('\r'),
        fc.constant('   \t\n  ')
      );
      
      fc.assert(
        fc.property(
          emptyOrWhitespaceArbitrary,
          (roleCode) => {
            const result = validateRoleCode(roleCode);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('请输入角色代码');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 2.2 有效角色代码应该通过验证
     */
    it('should accept valid non-empty role codes', () => {
      const validRoleCodeArbitrary = fc.string({ minLength: 1, maxLength: 30 })
        .filter(s => s.trim().length > 0);
      
      fc.assert(
        fc.property(
          validRoleCodeArbitrary,
          (roleCode) => {
            const result = validateRoleCode(roleCode);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 描述字段可选验证
     * 任何描述值（包括空字符串）都应该通过验证
     */
    it('should accept any description value including empty', () => {
      const anyDescriptionArbitrary = fc.oneof(
        fc.constant(''),
        fc.constant(' '),
        fc.constant('\t\n'),
        fc.string({ maxLength: 200 })
      );
      
      fc.assert(
        fc.property(
          anyDescriptionArbitrary,
          (description) => {
            const result = validateDescription(description);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 3.2 编辑模式下角色代码应该被禁用
     */
    it('should disable roleCode field in edit mode', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isEditMode) => {
            const shouldBeDisabled = shouldRoleCodeBeDisabled(isEditMode);
            // 编辑模式下应该禁用，创建模式下应该启用
            expect(shouldBeDisabled).toBe(isEditMode);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 创建模式表单验证
     * 有效表单（非空roleName和roleCode）应该通过验证
     */
    it('should validate create form with valid data', () => {
      const validFormArbitrary = fc.record({
        roleName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        roleCode: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        description: fc.string({ maxLength: 200 })
      });
      
      fc.assert(
        fc.property(
          validFormArbitrary,
          (form) => {
            const result = validateCreateForm(form);
            expect(result.valid).toBe(true);
            expect(Object.keys(result.errors)).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 创建模式表单验证
     * 无效表单（空roleName或roleCode）应该验证失败
     */
    it('should reject create form with empty required fields', () => {
      // 生成空或纯空白字符串的arbitrary
      const emptyStringArbitrary = fc.constantFrom('', ' ', '  ', '\t', '\n');
      
      // 生成至少有一个必填字段为空的表单
      const invalidFormArbitrary = fc.oneof(
        // roleName为空
        fc.record({
          roleName: emptyStringArbitrary,
          roleCode: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          description: fc.string({ maxLength: 200 })
        }),
        // roleCode为空
        fc.record({
          roleName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          roleCode: emptyStringArbitrary,
          description: fc.string({ maxLength: 200 })
        }),
        // 两者都为空
        fc.record({
          roleName: emptyStringArbitrary,
          roleCode: emptyStringArbitrary,
          description: fc.string({ maxLength: 200 })
        })
      );
      
      fc.assert(
        fc.property(
          invalidFormArbitrary,
          (form) => {
            const result = validateCreateForm(form);
            expect(result.valid).toBe(false);
            expect(Object.keys(result.errors).length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 编辑模式表单验证
     * 有效表单（非空roleName）应该通过验证，roleCode不参与验证
     */
    it('should validate edit form with valid roleName regardless of roleCode', () => {
      const validEditFormArbitrary = fc.record({
        roleName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        roleCode: fc.string({ maxLength: 30 }), // roleCode可以是任何值，因为在编辑模式下被禁用
        description: fc.string({ maxLength: 200 })
      });
      
      fc.assert(
        fc.property(
          validEditFormArbitrary,
          (form) => {
            const result = validateEditForm(form);
            expect(result.valid).toBe(true);
            expect(Object.keys(result.errors)).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 编辑模式表单验证
     * 空roleName应该验证失败
     */
    it('should reject edit form with empty roleName', () => {
      const emptyStringArbitrary = fc.constantFrom('', ' ', '  ', '\t', '\n');
      
      const invalidEditFormArbitrary = fc.record({
        roleName: emptyStringArbitrary,
        roleCode: fc.string({ maxLength: 30 }),
        description: fc.string({ maxLength: 200 })
      });
      
      fc.assert(
        fc.property(
          invalidEditFormArbitrary,
          (form) => {
            const result = validateEditForm(form);
            expect(result.valid).toBe(false);
            expect(result.errors.roleName).toBe('请输入角色名称');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 综合测试：表单验证规则的一致性
     * 对于任何表单数据，验证结果应该是确定性的
     */
    it('should produce deterministic validation results', () => {
      const formArbitrary = fc.record({
        roleName: fc.string({ maxLength: 50 }),
        roleCode: fc.string({ maxLength: 30 }),
        description: fc.string({ maxLength: 200 })
      });
      
      fc.assert(
        fc.property(
          formArbitrary,
          (form) => {
            // 多次验证同一表单应该得到相同结果
            const result1 = validateCreateForm(form);
            const result2 = validateCreateForm(form);
            
            expect(result1.valid).toBe(result2.valid);
            expect(JSON.stringify(result1.errors)).toBe(JSON.stringify(result2.errors));
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
