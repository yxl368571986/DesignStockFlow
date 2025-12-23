/**
 * 安全工具模块单元测试
 * 测试XSS防护、CSRF防护、Token安全、文件上传安全
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Cookies from 'js-cookie';
import {
  sanitizeInput,
  sanitizeHTML,
  encryptPassword,
  getToken,
  setToken,
  removeToken,
  hasToken,
  getCSRFToken,
  setCSRFToken,
  removeCSRFToken,
  hasValidCSRFToken,
  maskPhone,
  maskEmail,
  maskIdCard,
  encodeURL,
  sanitizeFileName,
  generateSecureFileName,
  validateFilePath,
  getTokenExpireTime,
  setTokenExpireTime,
  removeTokenExpireTime,
  isTokenExpiringSoon,
  isTokenExpired,
  validateTokenState
} from '../security';

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }
}));

describe('Security Utils - XSS Protection', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags from input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(maliciousInput);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
    });

    it('should remove event attributes from input', () => {
      const maliciousInput = '<div onclick="alert(\'xss\')">Click me</div>';
      const result = sanitizeInput(maliciousInput);

      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('should allow safe HTML tags', () => {
      const safeInput = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeInput(safeInput);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('should remove style tags', () => {
      const maliciousInput = '<style>body { display: none; }</style>Content';
      const result = sanitizeInput(maliciousInput);

      expect(result).not.toContain('<style>');
      expect(result).not.toContain('display: none');
      expect(result).toContain('Content');
    });

    it('should handle empty input', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const plainText = 'This is plain text';
      const result = sanitizeInput(plainText);
      expect(result).toBe(plainText);
    });

    it('should remove iframe tags', () => {
      const maliciousInput = '<iframe src="evil.com"></iframe>Content';
      const result = sanitizeInput(maliciousInput);

      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('evil.com');
    });

    it('should remove img tags with onerror attribute', () => {
      const maliciousInput = '<img src="x" onerror="alert(\'xss\')">Text';
      const result = sanitizeInput(maliciousInput);

      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });
  });

  describe('sanitizeHTML', () => {
    it('should remove dangerous HTML tags', () => {
      const dangerousHTML = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeHTML(dangerousHTML);

      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>');
      expect(result).toContain('Safe content');
    });

    it('should allow safe attributes', () => {
      const htmlWithLink = '<a href="https://example.com" title="Example">Link</a>';
      const result = sanitizeHTML(htmlWithLink);

      expect(result).toContain('href');
      expect(result).toContain('title');
      expect(result).toContain('https://example.com');
    });

    it('should remove data attributes', () => {
      const htmlWithData = '<div data-user-id="123">Content</div>';
      const result = sanitizeHTML(htmlWithData);

      expect(result).not.toContain('data-user-id');
    });

    it('should remove javascript: protocol in links', () => {
      const maliciousLink = '<a href="javascript:alert(\'xss\')">Click</a>';
      const result = sanitizeHTML(maliciousLink);

      expect(result).not.toContain('javascript:');
    });

    it('should handle nested malicious tags', () => {
      const nestedMalicious = '<div><script>alert("xss")</script><p>Text</p></div>';
      const result = sanitizeHTML(nestedMalicious);

      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>');
    });
  });

  describe('encodeURL', () => {
    it('should encode special characters in URL', () => {
      const url = 'https://example.com?query=hello world&param=<script>';
      const result = encodeURL(url);

      expect(result).not.toContain(' ');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('%20'); // space encoded
    });

    it('should encode Chinese characters', () => {
      const url = '搜索关键词';
      const result = encodeURL(url);

      expect(result).not.toContain('搜');
      expect(result).toContain('%');
    });

    it('should handle empty string', () => {
      const result = encodeURL('');
      expect(result).toBe('');
    });
  });
});

describe('Security Utils - Token Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Token CRUD operations', () => {
    it('should set token with default expiry (1 day)', () => {
      setToken('test-token-123', false);

      expect(Cookies.set).toHaveBeenCalledWith(
        'auth_token',
        'test-token-123',
        expect.objectContaining({
          expires: 1,
          sameSite: 'strict',
          path: '/'
        })
      );
    });

    it('should set token with extended expiry when rememberMe is true', () => {
      setToken('test-token-123', true);

      expect(Cookies.set).toHaveBeenCalledWith(
        'auth_token',
        'test-token-123',
        expect.objectContaining({
          expires: 7,
          sameSite: 'strict',
          path: '/'
        })
      );
    });

    it('should get token from cookies', () => {
      (vi.mocked(Cookies.get) as any).mockReturnValue('test-token-123');

      const token = getToken();

      expect(Cookies.get).toHaveBeenCalledWith('auth_token');
      expect(token).toBe('test-token-123');
    });

    it('should return undefined when token does not exist', () => {
      (vi.mocked(Cookies.get) as any).mockReturnValue(undefined);

      const token = getToken();

      expect(token).toBeUndefined();
    });

    it('should remove token from cookies', () => {
      removeToken();

      expect(Cookies.remove).toHaveBeenCalledWith('auth_token', { path: '/' });
    });

    it('should check if token exists', () => {
      (vi.mocked(Cookies.get) as any).mockReturnValue('test-token-123');

      const exists = hasToken();

      expect(exists).toBe(true);
    });

    it('should return false when token does not exist', () => {
      (vi.mocked(Cookies.get) as any).mockReturnValue(undefined);

      const exists = hasToken();

      expect(exists).toBe(false);
    });

    it('should return false when token is empty string', () => {
      (vi.mocked(Cookies.get) as any).mockReturnValue('');

      const exists = hasToken();

      expect(exists).toBe(false);
    });
  });

  describe('Token expiration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set token expire time', () => {
      const expireTime = Date.now() + 3600000; // 1 hour from now
      setTokenExpireTime(expireTime);

      expect(Cookies.set).toHaveBeenCalledWith(
        'token_expire_time',
        expireTime.toString(),
        expect.objectContaining({
          sameSite: 'strict',
          path: '/'
        })
      );
    });

    it('should get token expire time', () => {
      const expireTime = Date.now() + 3600000;
      (vi.mocked(Cookies.get) as any).mockReturnValue(expireTime.toString());

      const result = getTokenExpireTime();

      expect(result).toBe(expireTime);
    });

    it('should return null when expire time does not exist', () => {
      (vi.mocked(Cookies.get) as any).mockReturnValue(undefined);

      const result = getTokenExpireTime();

      expect(result).toBeNull();
    });

    it('should remove token expire time', () => {
      removeTokenExpireTime();

      expect(Cookies.remove).toHaveBeenCalledWith('token_expire_time', { path: '/' });
    });

    describe('isTokenExpired - 改进版', () => {
      it('should return true when token does not exist', () => {
        (vi.mocked(Cookies.get) as any).mockImplementation((key: string) => {
          if (key === 'auth_token') return undefined;
          return undefined;
        });

        const result = isTokenExpired();

        expect(result).toBe(true);
      });

      it('should return false when token exists but expire time does not exist (容错处理)', () => {
        (vi.mocked(Cookies.get) as any).mockImplementation((key: string) => {
          if (key === 'auth_token') return 'test-token';
          if (key === 'token_expire_time') return undefined;
          return undefined;
        });

        const result = isTokenExpired();

        expect(result).toBe(false);
      });

      it('should return true when token is expired', () => {
        const now = Date.now();
        const expireTime = now - 1000; // 1 second ago

        (vi.mocked(Cookies.get) as any).mockImplementation((key: string) => {
          if (key === 'auth_token') return 'test-token';
          if (key === 'token_expire_time') return expireTime.toString();
          return undefined;
        });

        const result = isTokenExpired();

        expect(result).toBe(true);
      });

      it('should return false when token is not expired', () => {
        const now = Date.now();
        const expireTime = now + 3600000; // 1 hour from now

        (vi.mocked(Cookies.get) as any).mockImplementation((key: string) => {
          if (key === 'auth_token') return 'test-token';
          if (key === 'token_expire_time') return expireTime.toString();
          return undefined;
        });

        const result = isTokenExpired();

        expect(result).toBe(false);
      });
    });

    describe('isTokenExpiringSoon - 改进版', () => {
      it('should return false when token does not exist', () => {
        (vi.mocked(Cookies.get) as any).mockImplementation((key: string) => {
          if (key === 'auth_token') return undefined;
          return undefined;
        });

        const result = isTokenExpiringSoon();

        expect(result).toBe(false);
      });

      it('should return false when token exists but expire time does not exist', () => {
        (vi.mocked(Cookies.get) as any).mockImplementation((key: string) => {
          if (key === 'auth_token') return 'test-token';
          if (key === 'token_expire_time') return undefined;
          return undefined;
        });

        const result = isTokenExpiringSoon();

        expect(result).toBe(false);
      });

      it('should return true when token is expiring soon (within 5 minutes)', () => {
        const now = Date.now();
        const expireTime = now + 4 * 60 * 1000; // 4 minutes from now

        (vi.mocked(Cookies.get) as any).mockImplementation((key: string) => {
          if (key === 'auth_token') return 'test-token';
          if (key === 'token_expire_time') return expireTime.toString();
          return undefined;
        });

        const result = isTokenExpiringSoon();

        expect(result).toBe(true);
      });

      it('should return false when token is not expiring soon', () => {
        const now = Date.now();
        const expireTime = now + 10 * 60 * 1000; // 10 minutes from now

        (vi.mocked(Cookies.get) as any).mockImplementation((key: string) => {
          if (key === 'auth_token') return 'test-token';
          if (key === 'token_expire_time') return expireTime.toString();
          return undefined;
        });

        const result = isTokenExpiringSoon();

        expect(result).toBe(false);
      });

      it('should return false when token is already expired', () => {
        const now = Date.now();
        const expireTime = now - 1000; // 1 second ago

        (vi.mocked(Cookies.get) as any).mockImplementation((key: string) => {
          if (key === 'auth_token') return 'test-token';
          if (key === 'token_expire_time') return expireTime.toString();
          return undefined;
        });

        const result = isTokenExpiringSoon();

        expect(result).toBe(false);
      });
    });

    describe('validateTokenState', () => {
      it('should return valid when both token and expire time exist', () => {
        (vi.mocked(Cookies.get) as any).mockImplementation((key: string) => {
          if (key === 'auth_token') return 'test-token';
          if (key === 'token_expire_time') return '1234567890';
          return undefined;
        });

        const result = validateTokenState();

        expect(result.valid).toBe(true);
        expect(result.hasToken).toBe(true);
        expect(result.hasExpireTime).toBe(true);
      });

      it('should return valid when both token and expire time do not exist', () => {
        (vi.mocked(Cookies.get) as any).mockReturnValue(undefined);

        const result = validateTokenState();

        expect(result.valid).toBe(true);
        expect(result.hasToken).toBe(false);
        expect(result.hasExpireTime).toBe(false);
      });

      it('should return invalid when token exists but expire time does not', () => {
        (vi.mocked(Cookies.get) as any).mockImplementation((key: string) => {
          if (key === 'auth_token') return 'test-token';
          if (key === 'token_expire_time') return undefined;
          return undefined;
        });

        const result = validateTokenState();

        expect(result.valid).toBe(false);
        expect(result.hasToken).toBe(true);
        expect(result.hasExpireTime).toBe(false);
      });

      it('should return invalid when expire time exists but token does not', () => {
        (vi.mocked(Cookies.get) as any).mockImplementation((key: string) => {
          if (key === 'auth_token') return undefined;
          if (key === 'token_expire_time') return '1234567890';
          return undefined;
        });

        const result = validateTokenState();

        expect(result.valid).toBe(false);
        expect(result.hasToken).toBe(false);
        expect(result.hasExpireTime).toBe(true);
      });
    });
  });

  describe('Password encryption', () => {
    it('should encrypt password using SHA256', () => {
      const password = 'mySecurePassword123';
      const encrypted = encryptPassword(password);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(password);
      expect(encrypted.length).toBe(64); // SHA256 produces 64 character hex string
    });

    it('should produce consistent hash for same password', () => {
      const password = 'mySecurePassword123';
      const encrypted1 = encryptPassword(password);
      const encrypted2 = encryptPassword(password);

      expect(encrypted1).toBe(encrypted2);
    });

    it('should produce different hash for different passwords', () => {
      const password1 = 'password123';
      const password2 = 'password456';
      const encrypted1 = encryptPassword(password1);
      const encrypted2 = encryptPassword(password2);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty password', () => {
      const encrypted = encryptPassword('');

      expect(encrypted).toBeTruthy();
      expect(encrypted.length).toBe(64);
    });

    it('should handle special characters in password', () => {
      const password = 'p@ssw0rd!#$%^&*()';
      const encrypted = encryptPassword(password);

      expect(encrypted).toBeTruthy();
      expect(encrypted.length).toBe(64);
    });
  });
});

describe('Security Utils - CSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CSRF Token management', () => {
    it('should set CSRF token', () => {
      setCSRFToken('csrf-token-123');

      expect(Cookies.set).toHaveBeenCalledWith(
        'csrf_token',
        'csrf-token-123',
        expect.objectContaining({
          secure: true,
          sameSite: 'strict',
          expires: 1
        })
      );
    });

    it('should get CSRF token', () => {
      (vi.mocked(Cookies.get) as any).mockReturnValue('csrf-token-123');

      const token = getCSRFToken();

      expect(Cookies.get).toHaveBeenCalledWith('csrf_token');
      expect(token).toBe('csrf-token-123');
    });

    it('should remove CSRF token', () => {
      removeCSRFToken();

      expect(Cookies.remove).toHaveBeenCalledWith('csrf_token');
    });

    it('should validate CSRF token exists', () => {
      (vi.mocked(Cookies.get) as any).mockReturnValue('csrf-token-123');

      const isValid = hasValidCSRFToken();

      expect(isValid).toBe(true);
    });

    it('should return false when CSRF token does not exist', () => {
      (vi.mocked(Cookies.get) as any).mockReturnValue(undefined);

      const isValid = hasValidCSRFToken();

      expect(isValid).toBe(false);
    });

    it('should return false when CSRF token is empty', () => {
      (vi.mocked(Cookies.get) as any).mockReturnValue('');

      const isValid = hasValidCSRFToken();

      expect(isValid).toBe(false);
    });
  });
});

describe('Security Utils - Sensitive Information Masking', () => {
  describe('maskPhone', () => {
    it('should mask middle 4 digits of phone number', () => {
      const phone = '13800138000';
      const masked = maskPhone(phone);

      expect(masked).toBe('138****8000');
      expect(masked).not.toContain('0013');
    });

    it('should return original if phone is not 11 digits', () => {
      const phone = '1234567';
      const masked = maskPhone(phone);

      expect(masked).toBe(phone);
    });

    it('should handle empty phone', () => {
      const masked = maskPhone('');

      expect(masked).toBe('');
    });

    it('should handle null or undefined', () => {
      const masked1 = maskPhone(null as any);
      const masked2 = maskPhone(undefined as any);

      expect(masked1).toBe(null);
      expect(masked2).toBe(undefined);
    });
  });

  describe('maskEmail', () => {
    it('should mask email username', () => {
      const email = 'abcdefg@example.com';
      const masked = maskEmail(email);

      expect(masked).toBe('abc***@example.com');
      expect(masked).toContain('@example.com');
    });

    it('should handle short username', () => {
      const email = 'ab@example.com';
      const masked = maskEmail(email);

      expect(masked).toBe('a***@example.com');
    });

    it('should return original if no @ symbol', () => {
      const email = 'notanemail';
      const masked = maskEmail(email);

      expect(masked).toBe(email);
    });

    it('should handle empty email', () => {
      const masked = maskEmail('');

      expect(masked).toBe('');
    });
  });

  describe('maskIdCard', () => {
    it('should mask middle digits of ID card', () => {
      const idCard = '123456789012345678';
      const masked = maskIdCard(idCard);

      expect(masked).toBe('1234**********5678');
      expect(masked).toContain('1234');
      expect(masked).toContain('5678');
    });

    it('should return original if ID card is too short', () => {
      const idCard = '1234567';
      const masked = maskIdCard(idCard);

      expect(masked).toBe(idCard);
    });

    it('should handle empty ID card', () => {
      const masked = maskIdCard('');

      expect(masked).toBe('');
    });
  });
});

describe('Security Utils - File Upload Security', () => {
  describe('sanitizeFileName', () => {
    it('should remove path separators', () => {
      const fileName = '../../../etc/passwd';
      const sanitized = sanitizeFileName(fileName);

      expect(sanitized).not.toContain('/');
      expect(sanitized).not.toContain('\\');
      expect(sanitized).not.toContain('..');
    });

    it('should remove dangerous special characters', () => {
      const fileName = 'file<>:"|?*.txt';
      const sanitized = sanitizeFileName(fileName);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain(':');
      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain('|');
      expect(sanitized).not.toContain('?');
      expect(sanitized).not.toContain('*');
    });

    it('should remove multiple consecutive dots', () => {
      const fileName = 'file...txt';
      const sanitized = sanitizeFileName(fileName);

      expect(sanitized).not.toContain('...');
      expect(sanitized).toBe('file.txt');
    });

    it('should remove leading dots', () => {
      const fileName = '...hidden.txt';
      const sanitized = sanitizeFileName(fileName);

      expect(sanitized).not.toMatch(/^\./);
      expect(sanitized).toBe('hidden.txt');
    });

    it('should replace spaces with underscores', () => {
      const fileName = 'my file name.txt';
      const sanitized = sanitizeFileName(fileName);

      expect(sanitized).toBe('my_file_name.txt');
      expect(sanitized).not.toContain(' ');
    });

    it('should limit file name length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const sanitized = sanitizeFileName(longName);

      expect(sanitized.length).toBeLessThanOrEqual(255);
      expect(sanitized).toContain('.txt');
    });

    it('should preserve file extension when truncating', () => {
      const longName = 'a'.repeat(300) + '.psd';
      const sanitized = sanitizeFileName(longName);

      expect(sanitized).toMatch(/\.psd$/);
    });

    it('should return default name for empty input', () => {
      const sanitized = sanitizeFileName('');

      expect(sanitized).toBe('unnamed_file');
    });

    it('should return default name for whitespace only', () => {
      const sanitized = sanitizeFileName('   ');

      expect(sanitized).toBe('unnamed_file');
    });

    it('should handle normal file names', () => {
      const fileName = 'document.pdf';
      const sanitized = sanitizeFileName(fileName);

      expect(sanitized).toBe('document.pdf');
    });

    it('should handle file names with Chinese characters', () => {
      const fileName = '设计文件.psd';
      const sanitized = sanitizeFileName(fileName);

      expect(sanitized).toBe('设计文件.psd');
    });
  });

  describe('generateSecureFileName', () => {
    it('should generate unique file name with timestamp', () => {
      const originalName = 'test.psd';
      const secureName = generateSecureFileName(originalName);

      expect(secureName).toContain('.psd');
      expect(secureName).toMatch(/^\d+_[a-z0-9]+\.psd$/);
    });

    it('should generate different names for same input', () => {
      const originalName = 'test.psd';
      const secureName1 = generateSecureFileName(originalName);
      const secureName2 = generateSecureFileName(originalName);

      expect(secureName1).not.toBe(secureName2);
    });

    it('should preserve file extension', () => {
      const originalName = 'document.pdf';
      const secureName = generateSecureFileName(originalName);

      expect(secureName).toContain('.pdf');
    });

    it('should handle file without extension', () => {
      const originalName = 'noextension';
      const secureName = generateSecureFileName(originalName);

      // The function treats the whole name as extension if no dot exists
      // So it will have .noextension at the end
      expect(secureName).toMatch(/^\d+_[a-z0-9]+\.noextension$/);
    });

    it('should convert extension to lowercase', () => {
      const originalName = 'test.PSD';
      const secureName = generateSecureFileName(originalName);

      expect(secureName).toContain('.psd');
      expect(secureName).not.toContain('.PSD');
    });
  });

  describe('validateFilePath', () => {
    it('should allow path within allowed base path', () => {
      const filePath = '/uploads/user123/file.psd';
      const basePath = '/uploads/user123';

      const isValid = validateFilePath(filePath, basePath);

      expect(isValid).toBe(true);
    });

    it('should reject path with traversal attempt', () => {
      const filePath = '/uploads/user123/../admin/file.psd';
      const basePath = '/uploads/user123';

      const isValid = validateFilePath(filePath, basePath);

      expect(isValid).toBe(false);
    });

    it('should reject path outside base path', () => {
      const filePath = '/etc/passwd';
      const basePath = '/uploads/user123';

      const isValid = validateFilePath(filePath, basePath);

      expect(isValid).toBe(false);
    });

    it('should handle Windows-style paths', () => {
      const filePath = 'C:\\uploads\\user123\\file.psd';
      const basePath = 'C:\\uploads\\user123';

      const isValid = validateFilePath(filePath, basePath);

      expect(isValid).toBe(true);
    });

    it('should reject Windows-style path traversal', () => {
      const filePath = 'C:\\uploads\\user123\\..\\..\\windows\\system32';
      const basePath = 'C:\\uploads\\user123';

      const isValid = validateFilePath(filePath, basePath);

      expect(isValid).toBe(false);
    });

    it('should normalize mixed path separators', () => {
      const filePath = '/uploads/user123\\file.psd';
      const basePath = '/uploads/user123';

      const isValid = validateFilePath(filePath, basePath);

      expect(isValid).toBe(true);
    });
  });
});

