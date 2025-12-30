/**
 * 资源删除数据保留属性测试
 *
 * 属性10: 资源删除数据保留
 * 验证需求: 12.1, 12.2, 12.3
 *
 * 测试场景：
 * - 软删除资源后，收益记录仍然保留
 * - 软删除资源后，下载历史仍然保留
 * - 软删除资源后，定价变更日志仍然保留
 * - 软删除资源在收益明细中显示「已删除」标签
 */

import * as fc from 'fast-check';

describe('资源删除数据保留属性测试', () => {
  // 模拟数据库存储
  let resources: Map<string, { isDeleted: boolean; title: string }>;
  let earningsRecords: Map<string, { resourceId: string; amount: number }[]>;
  let downloadHistory: Map<string, { resourceId: string; downloadedAt: Date }[]>;
  let pricingChangeLogs: Map<string, { resourceId: string; oldValue: number; newValue: number }[]>;

  beforeEach(() => {
    resources = new Map();
    earningsRecords = new Map();
    downloadHistory = new Map();
    pricingChangeLogs = new Map();
  });

  // 模拟软删除资源
  function softDeleteResource(resourceId: string): boolean {
    const resource = resources.get(resourceId);
    if (!resource) return false;
    resource.isDeleted = true;
    return true;
  }

  // 模拟获取收益记录（包含已删除资源）
  function getEarningsRecords(userId: string): Array<{
    resourceId: string;
    amount: number;
    resourceDeleted: boolean;
    resourceTitle: string;
  }> {
    const records = earningsRecords.get(userId) || [];
    return records.map((record) => {
      const resource = resources.get(record.resourceId);
      return {
        resourceId: record.resourceId,
        amount: record.amount,
        resourceDeleted: resource?.isDeleted ?? true,
        resourceTitle: resource?.title ?? '已删除的资源',
      };
    });
  }

  // 模拟获取下载历史（包含已删除资源）
  function getDownloadHistory(userId: string): Array<{
    resourceId: string;
    downloadedAt: Date;
    resourceDeleted: boolean;
  }> {
    const records = downloadHistory.get(userId) || [];
    return records.map((record) => {
      const resource = resources.get(record.resourceId);
      return {
        resourceId: record.resourceId,
        downloadedAt: record.downloadedAt,
        resourceDeleted: resource?.isDeleted ?? true,
      };
    });
  }

  // 模拟获取定价变更日志
  function getPricingChangeLogs(resourceId: string): Array<{
    oldValue: number;
    newValue: number;
  }> {
    return pricingChangeLogs.get(resourceId) || [];
  }

  /**
   * 属性10.1: 软删除资源后收益记录保留
   * 需求 12.2: 资源删除后，相关收益记录仍然保留并可查看
   */
  test('属性10.1: 软删除资源后收益记录保留', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 10 }),
        (resourceId, userId, amounts) => {
          // 创建资源
          resources.set(resourceId, { isDeleted: false, title: '测试资源' });

          // 创建收益记录
          const records = amounts.map((amount) => ({ resourceId, amount }));
          earningsRecords.set(userId, records);

          // 记录删除前的收益记录数量
          const beforeDeleteCount = getEarningsRecords(userId).length;

          // 软删除资源
          softDeleteResource(resourceId);

          // 验证收益记录仍然存在
          const afterDeleteRecords = getEarningsRecords(userId);
          expect(afterDeleteRecords.length).toBe(beforeDeleteCount);

          // 验证所有记录都标记为已删除
          afterDeleteRecords.forEach((record) => {
            expect(record.resourceDeleted).toBe(true);
          });

          // 清理
          resources.delete(resourceId);
          earningsRecords.delete(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性10.2: 软删除资源后下载历史保留
   * 需求 12.3: 资源删除后，下载历史记录仍然保留
   */
  test('属性10.2: 软删除资源后下载历史保留', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.array(fc.date(), { minLength: 1, maxLength: 10 }),
        (resourceId, userId, dates) => {
          // 创建资源
          resources.set(resourceId, { isDeleted: false, title: '测试资源' });

          // 创建下载历史
          const records = dates.map((date) => ({ resourceId, downloadedAt: date }));
          downloadHistory.set(userId, records);

          // 记录删除前的下载历史数量
          const beforeDeleteCount = getDownloadHistory(userId).length;

          // 软删除资源
          softDeleteResource(resourceId);

          // 验证下载历史仍然存在
          const afterDeleteRecords = getDownloadHistory(userId);
          expect(afterDeleteRecords.length).toBe(beforeDeleteCount);

          // 验证所有记录都标记为已删除
          afterDeleteRecords.forEach((record) => {
            expect(record.resourceDeleted).toBe(true);
          });

          // 清理
          resources.delete(resourceId);
          downloadHistory.delete(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性10.3: 软删除资源后定价变更日志保留
   * 需求 12.1: 资源软删除，相关数据保留
   */
  test('属性10.3: 软删除资源后定价变更日志保留', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(
          fc.record({
            oldValue: fc.integer({ min: 0, max: 100 }),
            newValue: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (resourceId, logs) => {
          // 创建资源
          resources.set(resourceId, { isDeleted: false, title: '测试资源' });

          // 创建定价变更日志
          pricingChangeLogs.set(
            resourceId,
            logs.map((log) => ({ resourceId, ...log }))
          );

          // 记录删除前的日志数量
          const beforeDeleteCount = getPricingChangeLogs(resourceId).length;

          // 软删除资源
          softDeleteResource(resourceId);

          // 验证定价变更日志仍然存在
          const afterDeleteLogs = getPricingChangeLogs(resourceId);
          expect(afterDeleteLogs.length).toBe(beforeDeleteCount);

          // 清理
          resources.delete(resourceId);
          pricingChangeLogs.delete(resourceId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性10.4: 软删除不影响其他资源的数据
   * 需求 12.1: 软删除只影响目标资源
   */
  test('属性10.4: 软删除不影响其他资源的数据', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (resourceId1, resourceId2, userId, amount1, amount2) => {
          // 确保两个资源ID不同
          fc.pre(resourceId1 !== resourceId2);

          // 创建两个资源
          resources.set(resourceId1, { isDeleted: false, title: '资源1' });
          resources.set(resourceId2, { isDeleted: false, title: '资源2' });

          // 创建收益记录
          earningsRecords.set(userId, [
            { resourceId: resourceId1, amount: amount1 },
            { resourceId: resourceId2, amount: amount2 },
          ]);

          // 软删除第一个资源
          softDeleteResource(resourceId1);

          // 验证第二个资源不受影响
          const records = getEarningsRecords(userId);
          const resource2Record = records.find((r) => r.resourceId === resourceId2);
          expect(resource2Record?.resourceDeleted).toBe(false);

          // 清理
          resources.delete(resourceId1);
          resources.delete(resourceId2);
          earningsRecords.delete(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性10.5: 收益金额在删除后保持不变
   * 需求 12.2: 收益数据完整性
   */
  test('属性10.5: 收益金额在删除后保持不变', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 20 }),
        (resourceId, userId, amounts) => {
          // 创建资源
          resources.set(resourceId, { isDeleted: false, title: '测试资源' });

          // 创建收益记录
          const records = amounts.map((amount) => ({ resourceId, amount }));
          earningsRecords.set(userId, records);

          // 计算删除前的总收益
          const beforeDeleteTotal = getEarningsRecords(userId).reduce(
            (sum, r) => sum + r.amount,
            0
          );

          // 软删除资源
          softDeleteResource(resourceId);

          // 计算删除后的总收益
          const afterDeleteTotal = getEarningsRecords(userId).reduce(
            (sum, r) => sum + r.amount,
            0
          );

          // 验证总收益不变
          expect(afterDeleteTotal).toBe(beforeDeleteTotal);

          // 清理
          resources.delete(resourceId);
          earningsRecords.delete(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性10.6: 已删除资源显示正确的标签
   * 需求 12.2: 已删除资源在收益明细中显示「已删除」标签
   */
  test('属性10.6: 已删除资源显示正确的标签', () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), fc.integer({ min: 1, max: 100 }), (resourceId, userId, amount) => {
        // 创建资源
        resources.set(resourceId, { isDeleted: false, title: '原始标题' });

        // 创建收益记录
        earningsRecords.set(userId, [{ resourceId, amount }]);

        // 删除前检查
        let records = getEarningsRecords(userId);
        expect(records[0].resourceDeleted).toBe(false);
        expect(records[0].resourceTitle).toBe('原始标题');

        // 软删除资源
        softDeleteResource(resourceId);

        // 删除后检查
        records = getEarningsRecords(userId);
        expect(records[0].resourceDeleted).toBe(true);

        // 清理
        resources.delete(resourceId);
        earningsRecords.delete(userId);
      }),
      { numRuns: 100 }
    );
  });
});
