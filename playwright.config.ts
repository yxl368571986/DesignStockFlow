import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // 注释掉webServer，因为服务已经在运行
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },
});
