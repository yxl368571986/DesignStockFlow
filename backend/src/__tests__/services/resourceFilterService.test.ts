/**
 * 资源筛选属性测试
 * 
 * 属性7: 资源筛选正确性
 * 
 * 对于任意定价类型筛选条件，返回的资源列表应满足：
 * - 筛选「免费」→ 所有结果的 pricing_type = 0
 * - 筛选「付费」→ 所有结果的 pricing_type = 1
 * - 筛选「VIP专属」→ 所有结果的 pricing_type = 2
 * - 筛选「全部」→ 返回所有定价类型的资源
 * - 所有结果的 is_deleted = false（不返回已删除资源）
 * 
 * **验证需求: 7.4**
 */

import * as fc from 'fast-check';

// 定价类型枚举
enum PricingType {
  FREE = 0,
  PAID_POINTS = 1,
  VIP_ONLY = 2,
}

// 模拟资源数据结构
interface MockResource {
  resource_id: string;
  title: string;
  pricing_type: number;
  points_cost: number;
  is_deleted: boolean;
  audit_status: number;
  status: number;
}

// 生成随机资源
const resourceArbitrary = fc.record({
  resource_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  pricing_type: fc.integer({ min: 0, max: 2 }),
  points_cost: fc.integer({ min: 0, max: 100 }).map(n => {
    // 付费资源的积分价格为5的倍数
    return Math.round(n / 5) * 5;
  }),
  is_deleted: fc.boolean(),
  audit_status: fc.integer({ min: 0, max: 2 }),
  status: fc.integer({ min: 0, max: 1 }),
});

/**
 * 模拟资源筛选函数
 * 这个函数模拟后端的资源筛选逻辑
 */
function filterResources(
  resources: MockResource[],
  pricingType?: number
): MockResource[] {
  return resources.filter(resource => {
    // 只返回已审核通过且未删除的资源
    if (resource.audit_status !== 1 || resource.status !== 1 || resource.is_deleted) {
      return false;
    }
    
    // 如果指定了定价类型，则按定价类型筛选
    if (pricingType !== undefined) {
      return resource.pricing_type === pricingType;
    }
    
    return true;
  });
}

describe('资源筛选属性测试', () => {
  /**
   * 属性7: 资源筛选正确性
   * 
   * **验证需求: 7.4**
   */
  describe('属性7: 资源筛选正确性', () => {
    it('筛选「免费」应只返回 pricing_type = 0 的资源', () => {
      fc.assert(
        fc.property(
          fc.array(resourceArbitrary, { minLength: 0, maxLength: 50 }),
          (resources) => {
            const filtered = filterResources(resources, PricingType.FREE);
            
            // 所有结果的 pricing_type 应为 0
            filtered.forEach(resource => {
              expect(resource.pricing_type).toBe(0);
            });
            
            // 所有结果应该是已审核通过且未删除的
            filtered.forEach(resource => {
              expect(resource.audit_status).toBe(1);
              expect(resource.status).toBe(1);
              expect(resource.is_deleted).toBe(false);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('筛选「付费」应只返回 pricing_type = 1 的资源', () => {
      fc.assert(
        fc.property(
          fc.array(resourceArbitrary, { minLength: 0, maxLength: 50 }),
          (resources) => {
            const filtered = filterResources(resources, PricingType.PAID_POINTS);
            
            // 所有结果的 pricing_type 应为 1
            filtered.forEach(resource => {
              expect(resource.pricing_type).toBe(1);
            });
            
            // 所有结果应该是已审核通过且未删除的
            filtered.forEach(resource => {
              expect(resource.audit_status).toBe(1);
              expect(resource.status).toBe(1);
              expect(resource.is_deleted).toBe(false);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('筛选「VIP专属」应只返回 pricing_type = 2 的资源', () => {
      fc.assert(
        fc.property(
          fc.array(resourceArbitrary, { minLength: 0, maxLength: 50 }),
          (resources) => {
            const filtered = filterResources(resources, PricingType.VIP_ONLY);
            
            // 所有结果的 pricing_type 应为 2
            filtered.forEach(resource => {
              expect(resource.pricing_type).toBe(2);
            });
            
            // 所有结果应该是已审核通过且未删除的
            filtered.forEach(resource => {
              expect(resource.audit_status).toBe(1);
              expect(resource.status).toBe(1);
              expect(resource.is_deleted).toBe(false);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('筛选「全部」应返回所有定价类型的资源', () => {
      fc.assert(
        fc.property(
          fc.array(resourceArbitrary, { minLength: 0, maxLength: 50 }),
          (resources) => {
            const filtered = filterResources(resources, undefined);
            
            // 所有结果应该是已审核通过且未删除的
            filtered.forEach(resource => {
              expect(resource.audit_status).toBe(1);
              expect(resource.status).toBe(1);
              expect(resource.is_deleted).toBe(false);
            });
            
            // 验证返回的资源数量等于所有有效资源的数量
            const expectedCount = resources.filter(r => 
              r.audit_status === 1 && r.status === 1 && !r.is_deleted
            ).length;
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('所有筛选结果都不应包含已删除的资源', () => {
      fc.assert(
        fc.property(
          fc.array(resourceArbitrary, { minLength: 0, maxLength: 50 }),
          fc.option(fc.integer({ min: 0, max: 2 }), { nil: undefined }),
          (resources, pricingType) => {
            const filtered = filterResources(resources, pricingType);
            
            // 所有结果的 is_deleted 应为 false
            filtered.forEach(resource => {
              expect(resource.is_deleted).toBe(false);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('筛选结果应该是原始数据的子集', () => {
      fc.assert(
        fc.property(
          fc.array(resourceArbitrary, { minLength: 0, maxLength: 50 }),
          fc.option(fc.integer({ min: 0, max: 2 }), { nil: undefined }),
          (resources, pricingType) => {
            const filtered = filterResources(resources, pricingType);
            
            // 筛选结果数量不应超过原始数据数量
            expect(filtered.length).toBeLessThanOrEqual(resources.length);
            
            // 筛选结果中的每个资源都应该在原始数据中存在
            filtered.forEach(filteredResource => {
              const exists = resources.some(r => 
                r.resource_id === filteredResource.resource_id
              );
              expect(exists).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('筛选应该是幂等的（多次筛选结果相同）', () => {
      fc.assert(
        fc.property(
          fc.array(resourceArbitrary, { minLength: 0, maxLength: 50 }),
          fc.option(fc.integer({ min: 0, max: 2 }), { nil: undefined }),
          (resources, pricingType) => {
            const filtered1 = filterResources(resources, pricingType);
            const filtered2 = filterResources(resources, pricingType);
            
            // 两次筛选结果应该相同
            expect(filtered1.length).toBe(filtered2.length);
            
            filtered1.forEach((resource, index) => {
              expect(resource.resource_id).toBe(filtered2[index].resource_id);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 边界值测试
   */
  describe('边界值测试', () => {
    it('空资源列表应返回空结果', () => {
      const filtered = filterResources([], PricingType.FREE);
      expect(filtered).toEqual([]);
    });

    it('所有资源都已删除时应返回空结果', () => {
      const resources: MockResource[] = [
        {
          resource_id: '1',
          title: 'Test 1',
          pricing_type: 0,
          points_cost: 0,
          is_deleted: true,
          audit_status: 1,
          status: 1,
        },
        {
          resource_id: '2',
          title: 'Test 2',
          pricing_type: 1,
          points_cost: 10,
          is_deleted: true,
          audit_status: 1,
          status: 1,
        },
      ];
      
      const filtered = filterResources(resources, undefined);
      expect(filtered).toEqual([]);
    });

    it('所有资源都未审核通过时应返回空结果', () => {
      const resources: MockResource[] = [
        {
          resource_id: '1',
          title: 'Test 1',
          pricing_type: 0,
          points_cost: 0,
          is_deleted: false,
          audit_status: 0, // 待审核
          status: 1,
        },
        {
          resource_id: '2',
          title: 'Test 2',
          pricing_type: 1,
          points_cost: 10,
          is_deleted: false,
          audit_status: 2, // 已驳回
          status: 1,
        },
      ];
      
      const filtered = filterResources(resources, undefined);
      expect(filtered).toEqual([]);
    });

    it('混合状态资源应正确筛选', () => {
      const resources: MockResource[] = [
        {
          resource_id: '1',
          title: 'Free Resource',
          pricing_type: 0,
          points_cost: 0,
          is_deleted: false,
          audit_status: 1,
          status: 1,
        },
        {
          resource_id: '2',
          title: 'Paid Resource',
          pricing_type: 1,
          points_cost: 10,
          is_deleted: false,
          audit_status: 1,
          status: 1,
        },
        {
          resource_id: '3',
          title: 'VIP Resource',
          pricing_type: 2,
          points_cost: 0,
          is_deleted: false,
          audit_status: 1,
          status: 1,
        },
        {
          resource_id: '4',
          title: 'Deleted Resource',
          pricing_type: 0,
          points_cost: 0,
          is_deleted: true,
          audit_status: 1,
          status: 1,
        },
      ];
      
      // 筛选免费资源
      const freeFiltered = filterResources(resources, PricingType.FREE);
      expect(freeFiltered.length).toBe(1);
      expect(freeFiltered[0].resource_id).toBe('1');
      
      // 筛选付费资源
      const paidFiltered = filterResources(resources, PricingType.PAID_POINTS);
      expect(paidFiltered.length).toBe(1);
      expect(paidFiltered[0].resource_id).toBe('2');
      
      // 筛选VIP专属资源
      const vipFiltered = filterResources(resources, PricingType.VIP_ONLY);
      expect(vipFiltered.length).toBe(1);
      expect(vipFiltered[0].resource_id).toBe('3');
      
      // 筛选全部资源
      const allFiltered = filterResources(resources, undefined);
      expect(allFiltered.length).toBe(3);
    });
  });
});
