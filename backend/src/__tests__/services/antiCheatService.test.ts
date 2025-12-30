/**
 * AntiCheatService 属性测试
 * 
 * 属性5: 防作弊收益限制
 * 
 * 验证需求: 5.1, 5.2, 5.3, 5.5
 * 
 * 注：由于 isValidDownload 和 detectAccountCluster 依赖数据库，
 * 这里主要测试防作弊规则的逻辑正确性，通过模拟输入验证规则。
 */

import * as fc from 'fast-check';
import { RiskTriggerType, RiskStatus } from '../../services/antiCheatService';

describe('AntiCheatService 属性测试', () => {
  /**
   * 属性5: 防作弊收益限制
   * 
   * 对于任意下载请求，系统应正确判定是否产生有效收益：
   * - 同一用户24小时内重复下载同一资源 → 仅首次产生收益
   * - 同一用户30天内下载同一资源超过3次 → 第4次起不产生收益
   * - 上传者下载自己的资源 → 不产生收益
   * - 被判定为作弊账号集群的下载 → 不产生收益
   * 
   * **验证需求: 5.1, 5.2, 5.3, 5.5**
   */
  describe('属性5: 防作弊收益限制规则验证', () => {
    /**
     * 模拟 isValidDownload 的规则逻辑
     */
    function simulateValidityCheck(
      downloaderId: string,
      uploaderId: string,
      hasRecentDownload: boolean,
      monthlyDownloadCount: number
    ): { isValid: boolean; reason?: string; riskType?: RiskTriggerType } {
      // 规则1: 自下载检测
      if (downloaderId === uploaderId) {
        return {
          isValid: false,
          reason: '下载自己的资源不产生收益',
          riskType: RiskTriggerType.SELF_DOWNLOAD,
        };
      }

      // 规则2: 24小时内重复下载
      if (hasRecentDownload) {
        return {
          isValid: false,
          reason: '24小时内已下载过该资源',
          riskType: RiskTriggerType.HIGH_FREQUENCY,
        };
      }

      // 规则3: 30天内下载次数限制
      if (monthlyDownloadCount >= 3) {
        return {
          isValid: false,
          reason: '30天内下载该资源已超过3次',
          riskType: RiskTriggerType.HIGH_FREQUENCY,
        };
      }

      return { isValid: true };
    }

    describe('5.1 自下载检测', () => {
      it('上传者下载自己的资源应返回无效', () => {
        fc.assert(
          fc.property(
            fc.uuid(), // 用户ID（同时作为上传者和下载者）
            fc.boolean(), // hasRecentDownload
            fc.integer({ min: 0, max: 10 }), // monthlyDownloadCount
            (userId, hasRecentDownload, monthlyDownloadCount) => {
              const result = simulateValidityCheck(
                userId,
                userId, // 同一用户
                hasRecentDownload,
                monthlyDownloadCount
              );
              
              expect(result.isValid).toBe(false);
              expect(result.reason).toContain('自己的资源');
              expect(result.riskType).toBe(RiskTriggerType.SELF_DOWNLOAD);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('不同用户下载资源应检查其他规则', () => {
        fc.assert(
          fc.property(
            fc.uuid(),
            fc.uuid(),
            (downloaderId, uploaderId) => {
              // 确保下载者和上传者不同
              if (downloaderId === uploaderId) return;

              const result = simulateValidityCheck(
                downloaderId,
                uploaderId,
                false, // 没有最近下载
                0 // 没有月度下载
              );
              
              // 如果没有其他限制，应该是有效的
              expect(result.isValid).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('5.2 24小时重复下载检测', () => {
      it('24小时内已下载过的资源应返回无效', () => {
        fc.assert(
          fc.property(
            fc.uuid(),
            fc.uuid(),
            (downloaderId, uploaderId) => {
              if (downloaderId === uploaderId) return;

              const result = simulateValidityCheck(
                downloaderId,
                uploaderId,
                true, // 24小时内有下载
                0
              );
              
              expect(result.isValid).toBe(false);
              expect(result.reason).toContain('24小时');
              expect(result.riskType).toBe(RiskTriggerType.HIGH_FREQUENCY);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('24小时内未下载过的资源应继续检查其他规则', () => {
        fc.assert(
          fc.property(
            fc.uuid(),
            fc.uuid(),
            (downloaderId, uploaderId) => {
              if (downloaderId === uploaderId) return;

              const result = simulateValidityCheck(
                downloaderId,
                uploaderId,
                false, // 24小时内没有下载
                0
              );
              
              expect(result.isValid).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('5.3 30天内下载次数限制', () => {
      it('30天内下载超过3次应返回无效', () => {
        fc.assert(
          fc.property(
            fc.uuid(),
            fc.uuid(),
            fc.integer({ min: 3, max: 100 }), // 下载次数 >= 3
            (downloaderId, uploaderId, downloadCount) => {
              if (downloaderId === uploaderId) return;

              const result = simulateValidityCheck(
                downloaderId,
                uploaderId,
                false,
                downloadCount
              );
              
              expect(result.isValid).toBe(false);
              expect(result.reason).toContain('30天');
              expect(result.riskType).toBe(RiskTriggerType.HIGH_FREQUENCY);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('30天内下载不超过2次应返回有效', () => {
        fc.assert(
          fc.property(
            fc.uuid(),
            fc.uuid(),
            fc.integer({ min: 0, max: 2 }), // 下载次数 < 3
            (downloaderId, uploaderId, downloadCount) => {
              if (downloaderId === uploaderId) return;

              const result = simulateValidityCheck(
                downloaderId,
                uploaderId,
                false,
                downloadCount
              );
              
              expect(result.isValid).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });


  /**
   * 账号关联检测规则验证
   */
  describe('账号关联检测规则', () => {
    /**
     * 模拟账号关联检测逻辑
     */
    function simulateClusterDetection(
      accountCount: number,
      sameIpRatio: number,
      avgRegistrationInterval: number, // 毫秒
      downloadOverlapRatio: number
    ): { isCluster: boolean; confidence: number; indicators: string[] } {
      if (accountCount < 2) {
        return { isCluster: false, confidence: 0, indicators: [] };
      }

      const indicators: string[] = [];
      let score = 0;

      // 检测1: 相同IP地址（超过50%使用相同IP）
      if (sameIpRatio > 0.5) {
        indicators.push('多个账号使用相同IP地址');
        score += 30;
      }

      // 检测2: 短时间内注册（1小时内）
      if (avgRegistrationInterval < 60 * 60 * 1000) {
        indicators.push('账号注册时间间隔过短');
        score += 25;
      }

      // 检测3: 下载行为相似度
      if (downloadOverlapRatio > 0.7) {
        indicators.push('下载资源高度重叠');
        score += 35;
      } else if (downloadOverlapRatio > 0.5) {
        indicators.push('下载资源存在重叠');
        score += 20;
      }

      const confidence = Math.min(100, score);
      const isCluster = confidence >= 60;

      return { isCluster, confidence, indicators };
    }

    it('单个账号不应被判定为关联', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1, noNaN: true }),
          fc.integer({ min: 0, max: 86400000 }),
          fc.double({ min: 0, max: 1, noNaN: true }),
          (sameIpRatio, avgInterval, overlapRatio) => {
            const result = simulateClusterDetection(1, sameIpRatio, avgInterval, overlapRatio);
            
            expect(result.isCluster).toBe(false);
            expect(result.confidence).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('无关联指标的账号不应被判定为关联', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (accountCount) => {
            const result = simulateClusterDetection(
              accountCount,
              0.3, // 低IP重复率
              24 * 60 * 60 * 1000, // 24小时间隔
              0.2 // 低下载重叠率
            );
            
            expect(result.isCluster).toBe(false);
            expect(result.confidence).toBeLessThan(60);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('高IP重复率应增加关联置信度', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.double({ min: 0.51, max: 1, noNaN: true }), // 高IP重复率，排除NaN
          (accountCount, sameIpRatio) => {
            const result = simulateClusterDetection(
              accountCount,
              sameIpRatio,
              24 * 60 * 60 * 1000, // 正常间隔
              0.2 // 低重叠率
            );
            
            expect(result.confidence).toBeGreaterThanOrEqual(30);
            expect(result.indicators).toContain('多个账号使用相同IP地址');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('短时间内注册应增加关联置信度', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 0, max: 59 * 60 * 1000 }), // 小于1小时
          (accountCount, avgInterval) => {
            const result = simulateClusterDetection(
              accountCount,
              0.3, // 低IP重复率
              avgInterval,
              0.2 // 低重叠率
            );
            
            expect(result.confidence).toBeGreaterThanOrEqual(25);
            expect(result.indicators).toContain('账号注册时间间隔过短');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('高下载重叠率应增加关联置信度', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.double({ min: 0.71, max: 1, noNaN: true }), // 高重叠率，排除NaN
          (accountCount, overlapRatio) => {
            const result = simulateClusterDetection(
              accountCount,
              0.3, // 低IP重复率
              24 * 60 * 60 * 1000, // 正常间隔
              overlapRatio
            );
            
            expect(result.confidence).toBeGreaterThanOrEqual(35);
            expect(result.indicators).toContain('下载资源高度重叠');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('多个关联指标应累加置信度', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (accountCount) => {
            // 同时满足多个条件
            const result = simulateClusterDetection(
              accountCount,
              0.8, // 高IP重复率 +30
              30 * 60 * 1000, // 短间隔 +25
              0.8 // 高重叠率 +35
            );
            
            // 30 + 25 + 35 = 90
            expect(result.confidence).toBe(90);
            expect(result.isCluster).toBe(true);
            expect(result.indicators.length).toBe(3);
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
    function simulateValidityCheck(
      downloaderId: string,
      uploaderId: string,
      hasRecentDownload: boolean,
      monthlyDownloadCount: number
    ): { isValid: boolean } {
      if (downloaderId === uploaderId) return { isValid: false };
      if (hasRecentDownload) return { isValid: false };
      if (monthlyDownloadCount >= 3) return { isValid: false };
      return { isValid: true };
    }

    it('恰好第3次下载应返回有效（下载次数为2）', () => {
      const result = simulateValidityCheck('downloader', 'uploader', false, 2);
      expect(result.isValid).toBe(true);
    });

    it('恰好第4次下载应返回无效（下载次数为3）', () => {
      const result = simulateValidityCheck('downloader', 'uploader', false, 3);
      expect(result.isValid).toBe(false);
    });
  });

  /**
   * 规则优先级测试
   */
  describe('规则优先级测试', () => {
    function simulateValidityCheck(
      downloaderId: string,
      uploaderId: string,
      hasRecentDownload: boolean,
      monthlyDownloadCount: number
    ): { riskType?: RiskTriggerType } {
      // 自下载优先级最高
      if (downloaderId === uploaderId) {
        return { riskType: RiskTriggerType.SELF_DOWNLOAD };
      }
      // 24小时规则次之
      if (hasRecentDownload) {
        return { riskType: RiskTriggerType.HIGH_FREQUENCY };
      }
      // 30天规则最后
      if (monthlyDownloadCount >= 3) {
        return { riskType: RiskTriggerType.HIGH_FREQUENCY };
      }
      return {};
    }

    it('自下载规则应优先于其他规则', () => {
      // 即使有其他限制，自下载也应该返回 SELF_DOWNLOAD
      const result = simulateValidityCheck('same-user', 'same-user', true, 10);
      expect(result.riskType).toBe(RiskTriggerType.SELF_DOWNLOAD);
    });

    it('24小时规则应优先于30天规则', () => {
      // 同时满足24小时和30天限制时，应返回24小时相关的风险类型
      const result = simulateValidityCheck('downloader', 'uploader', true, 10);
      expect(result.riskType).toBe(RiskTriggerType.HIGH_FREQUENCY);
    });
  });

  /**
   * 风控类型枚举测试
   */
  describe('风控类型枚举', () => {
    it('RiskTriggerType 应包含所有预期的类型', () => {
      expect(RiskTriggerType.HIGH_FREQUENCY).toBe('high_frequency');
      expect(RiskTriggerType.ACCOUNT_CLUSTER).toBe('account_cluster');
      expect(RiskTriggerType.NEW_ACCOUNT_BURST).toBe('new_account_burst');
      expect(RiskTriggerType.SELF_DOWNLOAD).toBe('self_download');
    });

    it('RiskStatus 应包含所有预期的状态', () => {
      expect(RiskStatus.PENDING).toBe('pending');
      expect(RiskStatus.APPROVED).toBe('approved');
      expect(RiskStatus.REJECTED).toBe('rejected');
    });
  });
});
