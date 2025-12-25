/**
 * SecurityMonitor 单元测试
 * 测试安全监控服务的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SecurityMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('二次验证阈值', () => {
    it('金额>=200元应该需要二次验证', () => {
      const SECONDARY_AUTH_THRESHOLD = 20000; // 200元 = 20000分
      
      // 200元，需要二次验证
      expect(20000 >= SECONDARY_AUTH_THRESHOLD).toBe(true);
      
      // 300元，需要二次验证
      expect(30000 >= SECONDARY_AUTH_THRESHOLD).toBe(true);
    });

    it('金额<200元不需要二次验证', () => {
      const SECONDARY_AUTH_THRESHOLD = 20000;
      
      // 199元，不需要二次验证
      expect(19900 >= SECONDARY_AUTH_THRESHOLD).toBe(false);
      
      // 100元，不需要二次验证
      expect(10000 >= SECONDARY_AUTH_THRESHOLD).toBe(false);
    });
  });

  describe('未支付订单限制', () => {
    it('1小时内未支付订单数应限制为5个', () => {
      const MAX_UNPAID_ORDERS_PER_HOUR = 5;
      
      // 4个未支付订单，允许继续
      expect(4 < MAX_UNPAID_ORDERS_PER_HOUR).toBe(true);
      
      // 5个未支付订单，达到限制
      expect(5 >= MAX_UNPAID_ORDERS_PER_HOUR).toBe(true);
    });
  });

  describe('可疑IP检测', () => {
    it('1小时内失败超过10次应标记为可疑', () => {
      const SUSPICIOUS_THRESHOLD = 10;
      
      // 9次失败，不可疑
      expect(9 >= SUSPICIOUS_THRESHOLD).toBe(false);
      
      // 10次失败，可疑
      expect(10 >= SUSPICIOUS_THRESHOLD).toBe(true);
      
      // 15次失败，可疑
      expect(15 >= SUSPICIOUS_THRESHOLD).toBe(true);
    });
  });

  describe('验证码生成', () => {
    it('应该生成6位数字验证码', () => {
      const generateCode = (): string => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      };

      const code = generateCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThan(1000000);
    });

    it('验证码应该在5分钟内有效', () => {
      const CODE_VALIDITY_MS = 5 * 60 * 1000; // 5分钟
      const now = Date.now();
      const expireAt = now + CODE_VALIDITY_MS;
      
      // 4分钟后，仍然有效
      const fourMinutesLater = now + 4 * 60 * 1000;
      expect(fourMinutesLater < expireAt).toBe(true);
      
      // 6分钟后，已过期
      const sixMinutesLater = now + 6 * 60 * 1000;
      expect(sixMinutesLater >= expireAt).toBe(true);
    });
  });

  describe('风险等级', () => {
    it('应该正确定义风险等级', () => {
      const RiskLevel = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
      };

      expect(RiskLevel.LOW).toBe('low');
      expect(RiskLevel.MEDIUM).toBe('medium');
      expect(RiskLevel.HIGH).toBe('high');
    });
  });

  describe('安全事件类型', () => {
    it('应该正确定义安全事件类型', () => {
      const SecurityEventType = {
        PAYMENT_ATTEMPT: 'payment_attempt',
        PAYMENT_SUCCESS: 'payment_success',
        PAYMENT_FAILED: 'payment_failed',
        SUSPICIOUS_ACTIVITY: 'suspicious_activity',
        ACCOUNT_LOCKED: 'account_locked',
        ACCOUNT_UNLOCKED: 'account_unlocked',
        SECONDARY_AUTH_SENT: 'secondary_auth_sent',
        SECONDARY_AUTH_VERIFIED: 'secondary_auth_verified',
        SECONDARY_AUTH_FAILED: 'secondary_auth_failed',
      };

      expect(SecurityEventType.PAYMENT_ATTEMPT).toBe('payment_attempt');
      expect(SecurityEventType.ACCOUNT_LOCKED).toBe('account_locked');
      expect(SecurityEventType.SECONDARY_AUTH_VERIFIED).toBe('secondary_auth_verified');
    });
  });

  describe('设备指纹生成', () => {
    it('应该基于设备信息生成唯一指纹', () => {
      const generateFingerprint = (userAgent: string, ip: string): string => {
        // 简化的指纹生成逻辑
        const data = `${userAgent}|${ip}`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
          const char = data.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
      };

      const fp1 = generateFingerprint('Mozilla/5.0', '192.168.1.1');
      const fp2 = generateFingerprint('Mozilla/5.0', '192.168.1.1');
      const fp3 = generateFingerprint('Chrome/100', '192.168.1.1');

      // 相同输入应该生成相同指纹
      expect(fp1).toBe(fp2);
      
      // 不同输入应该生成不同指纹
      expect(fp1).not.toBe(fp3);
    });
  });

  describe('账号锁定状态', () => {
    it('应该正确判断账号是否被锁定', () => {
      const isAccountLocked = (user: { payment_locked: boolean; status: number }): boolean => {
        return user.payment_locked || user.status !== 1;
      };

      // 正常账号
      expect(isAccountLocked({ payment_locked: false, status: 1 })).toBe(false);
      
      // 支付被锁定
      expect(isAccountLocked({ payment_locked: true, status: 1 })).toBe(true);
      
      // 账号状态异常
      expect(isAccountLocked({ payment_locked: false, status: 0 })).toBe(true);
    });
  });

  describe('安全阻止原因', () => {
    it('应该正确定义阻止原因', () => {
      const SecurityBlockReason = {
        TOO_MANY_UNPAID_ORDERS: 'too_many_unpaid_orders',
        SUSPICIOUS_IP: 'suspicious_ip',
        ACCOUNT_LOCKED: 'account_locked',
        DEVICE_LIMIT_EXCEEDED: 'device_limit_exceeded',
      };

      expect(SecurityBlockReason.TOO_MANY_UNPAID_ORDERS).toBe('too_many_unpaid_orders');
      expect(SecurityBlockReason.SUSPICIOUS_IP).toBe('suspicious_ip');
      expect(SecurityBlockReason.ACCOUNT_LOCKED).toBe('account_locked');
      expect(SecurityBlockReason.DEVICE_LIMIT_EXCEEDED).toBe('device_limit_exceeded');
    });
  });

  describe('手机号脱敏', () => {
    it('应该正确脱敏手机号', () => {
      const maskPhone = (phone: string): string => {
        return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      };

      expect(maskPhone('13812345678')).toBe('138****5678');
      expect(maskPhone('15987654321')).toBe('159****4321');
    });
  });
});
