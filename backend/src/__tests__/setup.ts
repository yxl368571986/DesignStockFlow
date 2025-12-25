/**
 * Jest 测试环境设置
 * 在所有测试运行前执行
 */

import { jest, beforeAll, afterAll } from '@jest/globals';

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Mock console.error 以避免测试输出过多噪音
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn() as typeof console.error;
});

afterAll(() => {
  console.error = originalConsoleError;
});

// 全局测试超时设置
jest.setTimeout(10000);
