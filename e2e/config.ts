/**
 * E2E 测试统一配置文件
 * 
 * 重要说明：
 * - 前端服务端口: 3000 (Vite dev server 配置在 vite.config.ts)
 * - 后端 API 端口: 8080 (Express server 配置在 backend/.env)
 * - 此配置必须与 playwright.config.ts 中的 baseURL 保持一致
 * 
 * 常见错误：
 * - 不要使用 5173 端口（这是 Vite 默认端口，但本项目配置为 3000）
 * - 不要使用 3000 作为 API 端口（API 在 8080）
 */

// 前端服务 URL
export const BASE_URL = 'http://localhost:3000';

// 后端 API URL
export const API_BASE_URL = 'http://localhost:8080/api/v1';

// 测试账号信息
export const TEST_ACCOUNTS = {
  normalUser: {
    phone: '13800000001',
    password: 'test123456',
    name: '普通用户A'
  },
  normalUserB: {
    phone: '13800000003',
    password: 'test123456',
    name: '普通用户B'
  },
  vipUser: {
    phone: '13800000002',
    password: 'test123456',
    name: 'VIP用户A'
  },
  creator: {
    phone: '13800000004',
    password: 'test123456',
    name: '创作者A'
  },
  auditor: {
    phone: '13900000001',
    password: 'test123456',
    name: '审核员'
  },
  admin: {
    phone: '13900000000',
    password: 'test123456',
    name: '超级管理员'
  }
};
