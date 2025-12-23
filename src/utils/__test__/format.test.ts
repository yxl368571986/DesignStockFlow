/**
 * 格式化工具模块单元测试
 * 测试文件大小、时间、数字、下载次数等格式化功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatFileSize,
  formatTime,
  formatNumber,
  formatDownloadCount,
  formatRelativeTime,
  formatPrice,
  formatPercent,
  formatPhone,
  formatBankCard,
  formatDuration
} from '../format';

describe('Format Utils', () => {
  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500.00 B');
      expect(formatFileSize(1023)).toBe('1023.00 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1536)).toBe('1.50 KB');
      expect(formatFileSize(10240)).toBe('10.00 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(1572864)).toBe('1.50 MB');
      expect(formatFileSize(10485760)).toBe('10.00 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1.00 GB');
      expect(formatFileSize(1610612736)).toBe('1.50 GB');
    });

    it('should format terabytes', () => {
      expect(formatFileSize(1099511627776)).toBe('1.00 TB');
    });

    it('should handle large numbers', () => {
      const result = formatFileSize(999999999999);
      expect(result).toContain('GB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.50 KB');
      expect(formatFileSize(1234567)).toBe('1.18 MB');
    });
  });

  describe('formatTime', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-01-15T10:30:45');
      const result = formatTime(date);
      expect(result).toBe('2024-01-15 10:30:45');
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15T10:30:45');
      expect(formatTime(date, 'YYYY-MM-DD')).toBe('2024-01-15');
      expect(formatTime(date, 'YYYY/MM/DD')).toBe('2024/01/15');
      expect(formatTime(date, 'HH:mm:ss')).toBe('10:30:45');
    });

    it('should format timestamp', () => {
      const timestamp = new Date('2024-01-15T10:30:45').getTime();
      const result = formatTime(timestamp);
      expect(result).toBe('2024-01-15 10:30:45');
    });

    it('should format string date', () => {
      const result = formatTime('2024-01-15T10:30:45');
      expect(result).toBe('2024-01-15 10:30:45');
    });

    it('should handle different date formats', () => {
      expect(formatTime('2024-01-15', 'YYYY年MM月DD日')).toContain('2024年01月15日');
    });
  });

  describe('formatNumber', () => {
    it('should format number with thousand separators', () => {
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(1234567890)).toBe('1,234,567,890');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(123)).toBe('123');
      expect(formatNumber(999)).toBe('999');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234)).toBe('-1,234');
      expect(formatNumber(-1234567)).toBe('-1,234,567');
    });

    it('should handle decimal numbers', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });
  });

  describe('formatDownloadCount', () => {
    it('should format numbers less than 1000', () => {
      expect(formatDownloadCount(0)).toBe('0');
      expect(formatDownloadCount(123)).toBe('123');
      expect(formatDownloadCount(999)).toBe('999');
    });

    it('should format thousands with k suffix', () => {
      expect(formatDownloadCount(1000)).toBe('1.0k');
      expect(formatDownloadCount(1234)).toBe('1.2k');
      expect(formatDownloadCount(5678)).toBe('5.7k');
      expect(formatDownloadCount(9999)).toBe('10.0k');
    });

    it('should format ten thousands with w suffix', () => {
      expect(formatDownloadCount(10000)).toBe('1.0w');
      expect(formatDownloadCount(12345)).toBe('1.2w');
      expect(formatDownloadCount(56789)).toBe('5.7w');
      expect(formatDownloadCount(123456)).toBe('12.3w');
    });

    it('should round to 1 decimal place', () => {
      expect(formatDownloadCount(1234)).toBe('1.2k');
      expect(formatDownloadCount(12345)).toBe('1.2w');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format time within 60 seconds as "刚刚"', () => {
      const now = new Date('2024-01-15T10:30:00');
      vi.setSystemTime(now);

      const time1 = new Date('2024-01-15T10:29:50'); // 10 seconds ago
      const time2 = new Date('2024-01-15T10:29:30'); // 30 seconds ago

      expect(formatRelativeTime(time1)).toBe('刚刚');
      expect(formatRelativeTime(time2)).toBe('刚刚');
    });

    it('should format time within 1 hour as minutes', () => {
      const now = new Date('2024-01-15T10:30:00');
      vi.setSystemTime(now);

      const time1 = new Date('2024-01-15T10:25:00'); // 5 minutes ago
      const time2 = new Date('2024-01-15T10:00:00'); // 30 minutes ago

      expect(formatRelativeTime(time1)).toBe('5分钟前');
      expect(formatRelativeTime(time2)).toBe('30分钟前');
    });

    it('should format time within 24 hours as hours', () => {
      const now = new Date('2024-01-15T10:30:00');
      vi.setSystemTime(now);

      const time1 = new Date('2024-01-15T09:30:00'); // 1 hour ago
      const time2 = new Date('2024-01-15T05:30:00'); // 5 hours ago

      expect(formatRelativeTime(time1)).toBe('1小时前');
      expect(formatRelativeTime(time2)).toBe('5小时前');
    });

    it('should format time within 30 days as days', () => {
      const now = new Date('2024-01-15T10:30:00');
      vi.setSystemTime(now);

      const time1 = new Date('2024-01-14T10:30:00'); // 1 day ago
      const time2 = new Date('2024-01-10T10:30:00'); // 5 days ago

      expect(formatRelativeTime(time1)).toBe('1天前');
      expect(formatRelativeTime(time2)).toBe('5天前');
    });

    it('should format time over 30 days as date', () => {
      const now = new Date('2024-02-15T10:30:00');
      vi.setSystemTime(now);

      const time = new Date('2024-01-01T10:30:00'); // 45 days ago

      expect(formatRelativeTime(time)).toBe('2024-01-01');
    });
  });

  describe('formatPrice', () => {
    it('should format price with ¥ symbol', () => {
      expect(formatPrice(99)).toBe('¥99.00');
      expect(formatPrice(199.5)).toBe('¥199.50');
      expect(formatPrice(1234.56)).toBe('¥1234.56');
    });

    it('should format to 2 decimal places', () => {
      expect(formatPrice(99.9)).toBe('¥99.90');
      expect(formatPrice(99.999)).toBe('¥100.00');
    });

    it('should handle zero', () => {
      expect(formatPrice(0)).toBe('¥0.00');
    });

    it('should handle negative prices', () => {
      expect(formatPrice(-50)).toBe('¥-50.00');
    });
  });

  describe('formatPercent', () => {
    it('should format percentage with default 0 decimals', () => {
      expect(formatPercent(0.5)).toBe('50%');
      expect(formatPercent(0.85)).toBe('85%');
      expect(formatPercent(1)).toBe('100%');
    });

    it('should format percentage with custom decimals', () => {
      expect(formatPercent(0.5, 1)).toBe('50.0%');
      expect(formatPercent(0.856, 2)).toBe('85.60%');
      expect(formatPercent(0.12345, 3)).toBe('12.345%');
    });

    it('should handle zero', () => {
      expect(formatPercent(0)).toBe('0%');
      expect(formatPercent(0, 2)).toBe('0.00%');
    });

    it('should handle values over 1', () => {
      expect(formatPercent(1.5)).toBe('150%');
    });
  });

  describe('formatPhone', () => {
    it('should format 11-digit phone number with spaces', () => {
      expect(formatPhone('13800138000')).toBe('138 0013 8000');
      expect(formatPhone('18912345678')).toBe('189 1234 5678');
    });

    it('should return original if not 11 digits', () => {
      expect(formatPhone('1234567')).toBe('1234567');
      expect(formatPhone('123456789012')).toBe('123456789012');
    });

    it('should handle empty string', () => {
      expect(formatPhone('')).toBe('');
    });

    it('should handle null or undefined', () => {
      expect(formatPhone(null as any)).toBe(null);
      expect(formatPhone(undefined as any)).toBe(undefined);
    });
  });

  describe('formatBankCard', () => {
    it('should format bank card number with spaces', () => {
      expect(formatBankCard('6222000000000000')).toBe('6222 0000 0000 0000');
      expect(formatBankCard('1234567890123456')).toBe('1234 5678 9012 3456');
    });

    it('should handle different lengths', () => {
      expect(formatBankCard('123456789012')).toBe('1234 5678 9012');
      expect(formatBankCard('12345678901234567890')).toBe('1234 5678 9012 3456 7890');
    });

    it('should handle empty string', () => {
      expect(formatBankCard('')).toBe('');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds to HH:MM:SS', () => {
      expect(formatDuration(0)).toBe('00:00:00');
      expect(formatDuration(30)).toBe('00:00:30');
      expect(formatDuration(90)).toBe('00:01:30');
    });

    it('should format minutes', () => {
      expect(formatDuration(60)).toBe('00:01:00');
      expect(formatDuration(300)).toBe('00:05:00');
      expect(formatDuration(3599)).toBe('00:59:59');
    });

    it('should format hours', () => {
      expect(formatDuration(3600)).toBe('01:00:00');
      expect(formatDuration(7200)).toBe('02:00:00');
      expect(formatDuration(3661)).toBe('01:01:01');
    });

    it('should pad with zeros', () => {
      expect(formatDuration(5)).toBe('00:00:05');
      expect(formatDuration(65)).toBe('00:01:05');
      expect(formatDuration(3665)).toBe('01:01:05');
    });

    it('should handle large durations', () => {
      expect(formatDuration(86400)).toBe('24:00:00'); // 1 day
      expect(formatDuration(90061)).toBe('25:01:01'); // 25 hours
    });
  });
});
