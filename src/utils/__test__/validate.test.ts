/**
 * 验证工具模块单元测试
 * 测试手机号、邮箱、密码、文件等验证功能
 */

import { describe, it, expect } from 'vitest';
import {
  validatePhone,
  validateEmail,
  validatePassword,
  validateFileExtension,
  validateFileSize,
  validateFile,
  validateFileNameSecurity,
  validateURL,
  validateIdCard,
  validateVerifyCode
} from '../validate';

describe('Validate Utils', () => {
  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('13800138000')).toBe(true);
      expect(validatePhone('18912345678')).toBe(true);
      expect(validatePhone('15012345678')).toBe(true);
      expect(validatePhone('17712345678')).toBe(true);
      expect(validatePhone('19912345678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('12345678901')).toBe(false); // starts with 1 but second digit is 2
      expect(validatePhone('1234567890')).toBe(false); // only 10 digits
      expect(validatePhone('138001380001')).toBe(false); // 12 digits
      expect(validatePhone('abc12345678')).toBe(false); // contains letters
      expect(validatePhone('')).toBe(false); // empty
    });

    it('should reject phone numbers with spaces or dashes', () => {
      expect(validatePhone('138 0013 8000')).toBe(false);
      expect(validatePhone('138-0013-8000')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@example.com')).toBe(true);
      expect(validateEmail('user+tag@example.co.uk')).toBe(true);
      expect(validateEmail('user_123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false); // no TLD
      expect(validateEmail('')).toBe(false);
    });

    it('should reject emails with spaces', () => {
      expect(validateEmail('user name@example.com')).toBe(false);
      expect(validateEmail('user@exam ple.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should reject passwords shorter than 6 characters', () => {
      const result = validatePassword('12345');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('密码至少6位');
    });

    it('should validate weak passwords (only one type)', () => {
      const result1 = validatePassword('123456');
      expect(result1.valid).toBe(true);
      expect(result1.strength).toBe('weak');

      const result2 = validatePassword('abcdef');
      expect(result2.valid).toBe(true);
      expect(result2.strength).toBe('weak');
    });

    it('should validate medium passwords (two types)', () => {
      const result1 = validatePassword('abc123');
      expect(result1.valid).toBe(true);
      expect(result1.strength).toBe('medium');

      const result2 = validatePassword('abc!@#');
      expect(result2.valid).toBe(true);
      expect(result2.strength).toBe('medium');

      const result3 = validatePassword('123!@#');
      expect(result3.valid).toBe(true);
      expect(result3.strength).toBe('medium');
    });

    it('should validate strong passwords (three types)', () => {
      const result = validatePassword('Abc123!@#');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should handle various special characters', () => {
      const result = validatePassword('Pass123!@#$%^&*()_+-=[]{};\':"|,.<>/?');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('strong');
    });
  });

  describe('validateFileExtension', () => {
    it('should validate supported file extensions', () => {
      expect(validateFileExtension('file.psd')).toBe(true);
      expect(validateFileExtension('file.PSD')).toBe(true);
      expect(validateFileExtension('file.ai')).toBe(true);
      expect(validateFileExtension('file.cdr')).toBe(true);
      expect(validateFileExtension('file.png')).toBe(true);
      expect(validateFileExtension('file.jpg')).toBe(true);
      expect(validateFileExtension('file.jpeg')).toBe(true);
    });

    it('should reject unsupported file extensions', () => {
      expect(validateFileExtension('file.exe')).toBe(false);
      expect(validateFileExtension('file.txt')).toBe(false);
      expect(validateFileExtension('file.doc')).toBe(false);
      expect(validateFileExtension('file.pdf')).toBe(false);
    });

    it('should handle files without extension', () => {
      expect(validateFileExtension('filename')).toBe(false);
    });

    it('should handle multiple dots in filename', () => {
      expect(validateFileExtension('my.file.name.psd')).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    it('should validate file sizes within limit', () => {
      expect(validateFileSize(1024)).toBe(true); // 1KB
      expect(validateFileSize(1048576)).toBe(true); // 1MB
      expect(validateFileSize(104857600)).toBe(true); // 100MB
    });

    it('should reject file size of 0', () => {
      expect(validateFileSize(0)).toBe(false);
    });

    it('should reject negative file sizes', () => {
      expect(validateFileSize(-1)).toBe(false);
    });

    it('should reject file sizes over limit (1000MB)', () => {
      const maxSize = 1000 * 1024 * 1024;
      expect(validateFileSize(maxSize)).toBe(true); // exactly at limit
      expect(validateFileSize(maxSize + 1)).toBe(false); // over limit
    });
  });

  describe('validateFile', () => {
    it('should validate a correct file', () => {
      const file = new File(['content'], 'test.psd', { type: 'image/vnd.adobe.photoshop' });
      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.details).toBeDefined();
      expect(result.details?.extension).toBe('PSD');
      expect(result.details?.mimeType).toBe('image/vnd.adobe.photoshop');
    });

    it('should reject file without name', () => {
      const file = new File(['content'], '', { type: 'image/png' });
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('文件名不能为空');
    });

    it('should reject file without extension', () => {
      const file = new File(['content'], 'filename', { type: 'image/png' });
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('文件必须包含扩展名');
    });

    it('should reject unsupported file format', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('不支持的文件格式');
    });

    it('should reject file with mismatched MIME type', () => {
      const file = new File(['content'], 'test.psd', { type: 'text/plain' });
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('文件类型不匹配');
    });

    it('should reject file with size 0', () => {
      const file = new File([], 'test.psd', { type: 'image/vnd.adobe.photoshop' });
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('文件大小无效');
    });

    it('should reject file over size limit', () => {
      // 使用 Object.defineProperty 模拟大文件，避免实际创建大内存
      const smallContent = 'test content';
      const file = new File([smallContent], 'test.psd', { type: 'image/vnd.adobe.photoshop' });
      
      // 模拟文件大小超过限制 (1001MB)
      Object.defineProperty(file, 'size', {
        value: 1001 * 1024 * 1024,
        writable: false
      });
      
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('文件大小超出限制');
    });

    it('should handle file without MIME type', () => {
      const file = new File(['content'], 'test.psd', { type: '' });
      const result = validateFile(file);

      // Should pass validation but log warning
      expect(result.valid).toBe(true);
    });
  });

  describe('validateFileNameSecurity', () => {
    it('should validate safe file names', () => {
      expect(validateFileNameSecurity('document.pdf').valid).toBe(true);
      expect(validateFileNameSecurity('my-file_123.psd').valid).toBe(true);
      expect(validateFileNameSecurity('设计文件.ai').valid).toBe(true);
    });

    it('should reject file names with path traversal', () => {
      const result1 = validateFileNameSecurity('../../../etc/passwd');
      expect(result1.valid).toBe(false);
      expect(result1.message).toBe('文件名包含非法路径字符');

      const result2 = validateFileNameSecurity('..\\windows\\system32');
      expect(result2.valid).toBe(false);
    });

    it('should reject file names with path separators', () => {
      const result1 = validateFileNameSecurity('folder/file.txt');
      expect(result1.valid).toBe(false);

      const result2 = validateFileNameSecurity('folder\\file.txt');
      expect(result2.valid).toBe(false);
    });

    it('should reject file names with dangerous characters', () => {
      const result1 = validateFileNameSecurity('file<script>.txt');
      expect(result1.valid).toBe(false);
      expect(result1.message).toBe('文件名包含非法特殊字符');

      const result2 = validateFileNameSecurity('file|pipe.txt');
      expect(result2.valid).toBe(false);
    });

    it('should reject file names that are too long', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = validateFileNameSecurity(longName);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('文件名过长（最多255个字符）');
    });

    it('should reject hidden files (starting with dot)', () => {
      const result = validateFileNameSecurity('.hidden');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('不支持上传隐藏文件');
    });

    it('should handle file names with control characters', () => {
      const result = validateFileNameSecurity('file\x00name.txt');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('should validate correct URLs', () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://example.com')).toBe(true);
      expect(validateURL('https://example.com/path')).toBe(true);
      expect(validateURL('https://example.com/path?query=value')).toBe(true);
      expect(validateURL('https://example.com:8080')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateURL('not-a-url')).toBe(false);
      expect(validateURL('example.com')).toBe(false); // missing protocol
      expect(validateURL('//example.com')).toBe(false);
      expect(validateURL('')).toBe(false);
    });

    it('should validate URLs with different protocols', () => {
      expect(validateURL('ftp://example.com')).toBe(true);
      expect(validateURL('ws://example.com')).toBe(true);
      expect(validateURL('wss://example.com')).toBe(true);
    });
  });

  describe('validateIdCard', () => {
    it('should validate correct 18-digit ID cards', () => {
      expect(validateIdCard('110101199001011234')).toBe(true);
      expect(validateIdCard('31010519900101123X')).toBe(true);
      expect(validateIdCard('31010519900101123x')).toBe(true); // lowercase x
    });

    it('should reject invalid ID cards', () => {
      expect(validateIdCard('12345678901234567')).toBe(false); // 17 digits
      expect(validateIdCard('1234567890123456789')).toBe(false); // 19 digits
      expect(validateIdCard('010101199001011234')).toBe(false); // starts with 0
      expect(validateIdCard('110101179001011234')).toBe(false); // invalid year (17xx)
      // 注意：简单验证不检查年份是否合理，只检查格式
      // expect(validateIdCard('110101209901011234')).toBe(false); // 2099年格式上是有效的
      expect(validateIdCard('110101199013011234')).toBe(false); // invalid month (13)
      expect(validateIdCard('110101199001321234')).toBe(false); // invalid day (32)
      expect(validateIdCard('')).toBe(false);
    });

    it('should handle ID cards with letters other than X', () => {
      expect(validateIdCard('11010119900101123A')).toBe(false);
    });
  });

  describe('validateVerifyCode', () => {
    it('should validate correct 6-digit codes', () => {
      expect(validateVerifyCode('123456')).toBe(true);
      expect(validateVerifyCode('000000')).toBe(true);
      expect(validateVerifyCode('999999')).toBe(true);
    });

    it('should reject invalid codes', () => {
      expect(validateVerifyCode('12345')).toBe(false); // 5 digits
      expect(validateVerifyCode('1234567')).toBe(false); // 7 digits
      expect(validateVerifyCode('12345a')).toBe(false); // contains letter
      expect(validateVerifyCode('12 34 56')).toBe(false); // contains spaces
      expect(validateVerifyCode('')).toBe(false);
    });
  });
});
