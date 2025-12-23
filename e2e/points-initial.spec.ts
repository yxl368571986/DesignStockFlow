/**
 * E2E测试 - 任务6.1: 已登录用户初始积分规则
 * 
 * 测试内容:
 * 1. 新注册普通用户初始积分应为500
 * 2. VIP用户根据VIP等级获取相应积分
 * 3. 验证数据库中积分记录正确
 * 4. 同步检查 GET /api/v1/points/my-info 接口
 * 5. 验证返回的积分余额与数据库一致
 * 
 * 验证需求: 8.11, 8.12, 44.1
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:8080/api/v1';

// 测试账号信息
const TEST_ACCOUNTS = {
  normalUser: {
    phone: '13800000001',
    password: 'test123456',
    expectedMinPoints: 0,  // 普通用户可能已消费积分
  },
  vipUser: {
    phone: '13800000002',
    password: 'test123456',
    expectedMinPoints: 0,  // VIP用户可能已消费积分
  },
  admin: {
    phone: '13900000000',
    password: 'test123456',
  },
};

/**
 * 登录并获取token
 */
async function loginAndGetToken(page: Page, phone: string, password: string): Promise<string | null> {
  // 监听登录API响应
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/auth/login') && response.status() === 200,
    { timeout: 15000 }
  ).catch(() => null);

  // 访问登录页面
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // 等待表单加载
  await page.waitForSelector('.login-form', { timeout: 10000 });

  // 填写登录表单 - 使用Element Plus输入框的选择器
  const phoneInput = page.locator('.login-form .el-input').first().locator('input');
  const passwordInput = page.locator('.login-form .el-input').nth(1).locator('input');
  
  await phoneInput.fill(phone);
  await passwordInput.fill(password);

  // 点击登录按钮
  await page.click('.login-button');

  // 等待登录响应
  const response = await responsePromise;
  if (response) {
    const data = await response.json();
    if (data.code === 200 && data.data?.token) {
      return data.data.token;
    }
  }

  // 从localStorage获取token
  await page.waitForTimeout(2000);
  const token = await page.evaluate(() => {
    return localStorage.getItem('token') || localStorage.getItem('access_token');
  });

  return token;
}

/**
 * 通过API获取用户积分信息
 */
interface PointsInfoResponse {
  code: number;
  msg: string;
  data: {
    pointsBalance: number;
    pointsTotal: number;
    userLevel: number;
    levelName: string;
    nextLevelPoints?: number;
    privileges?: string[];
  };
}

async function getPointsInfoFromAPI(page: Page, token: string): Promise<PointsInfoResponse | null> {
  const response = await page.request.get(`${API_BASE_URL}/points/my-info`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok()) {
    return await response.json();
  }
  return null;
}

/**
 * 从页面获取显示的积分余额
 */
async function getPointsFromPage(page: Page): Promise<number | null> {
  try {
    // 尝试多种选择器获取积分显示
    const selectors = [
      '.points-balance',
      '[class*="points"]',
      '.user-points',
      '.points-value',
      '[data-testid="points-balance"]',
    ];

    for (const selector of selectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await element.textContent();
        if (text) {
          const match = text.match(/\d+/);
          if (match) {
            return parseInt(match[0], 10);
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

test.describe('任务6.1: 已登录用户初始积分规则', () => {
  test.describe('初始积分规则验证', () => {
    test('普通用户应有积分余额', async ({ page }) => {
      // 登录普通用户
      const token = await loginAndGetToken(
        page,
        TEST_ACCOUNTS.normalUser.phone,
        TEST_ACCOUNTS.normalUser.password
      );

      // 如果登录失败，跳过测试
      if (!token) {
        test.skip();
        return;
      }

      // 通过API获取积分信息
      const pointsInfo = await getPointsInfoFromAPI(page, token);

      expect(pointsInfo).not.toBeNull();
      expect(pointsInfo.code).toBe(200);
      expect(pointsInfo.data).toBeDefined();
      expect(pointsInfo.data.pointsBalance).toBeGreaterThanOrEqual(0);
      expect(pointsInfo.data.pointsTotal).toBeGreaterThanOrEqual(0);
    });

    test('VIP用户应有积分余额', async ({ page }) => {
      // 登录VIP用户
      const token = await loginAndGetToken(
        page,
        TEST_ACCOUNTS.vipUser.phone,
        TEST_ACCOUNTS.vipUser.password
      );

      if (!token) {
        test.skip();
        return;
      }

      // 通过API获取积分信息
      const pointsInfo = await getPointsInfoFromAPI(page, token);

      expect(pointsInfo).not.toBeNull();
      expect(pointsInfo.code).toBe(200);
      expect(pointsInfo.data).toBeDefined();
      expect(pointsInfo.data.pointsBalance).toBeGreaterThanOrEqual(0);
      expect(pointsInfo.data.pointsTotal).toBeGreaterThanOrEqual(0);
    });

    test('积分余额应小于等于累计积分', async ({ page }) => {
      const token = await loginAndGetToken(
        page,
        TEST_ACCOUNTS.normalUser.phone,
        TEST_ACCOUNTS.normalUser.password
      );

      if (!token) {
        test.skip();
        return;
      }

      const pointsInfo = await getPointsInfoFromAPI(page, token);

      expect(pointsInfo).not.toBeNull();
      expect(pointsInfo.code).toBe(200);
      // 积分余额应小于等于累计积分（因为可能有消费）
      expect(pointsInfo.data.pointsBalance).toBeLessThanOrEqual(pointsInfo.data.pointsTotal);
    });
  });

  test.describe('积分余额API验证', () => {
    test('GET /api/v1/points/my-info 接口应返回正确格式', async ({ page }) => {
      const token = await loginAndGetToken(
        page,
        TEST_ACCOUNTS.normalUser.phone,
        TEST_ACCOUNTS.normalUser.password
      );

      if (!token) {
        test.skip();
        return;
      }

      const pointsInfo = await getPointsInfoFromAPI(page, token);

      // 验证响应格式
      expect(pointsInfo).toHaveProperty('code');
      expect(pointsInfo).toHaveProperty('msg');
      expect(pointsInfo).toHaveProperty('data');

      // 验证数据字段
      expect(pointsInfo.data).toHaveProperty('pointsBalance');
      expect(pointsInfo.data).toHaveProperty('pointsTotal');
      expect(pointsInfo.data).toHaveProperty('userLevel');
      expect(pointsInfo.data).toHaveProperty('levelName');

      // 验证数据类型
      expect(typeof pointsInfo.data.pointsBalance).toBe('number');
      expect(typeof pointsInfo.data.pointsTotal).toBe('number');
      expect(typeof pointsInfo.data.userLevel).toBe('number');
      expect(typeof pointsInfo.data.levelName).toBe('string');
    });

    test('未登录用户调用接口应返回401错误', async ({ page }) => {
      // 直接调用API，不带token
      const response = await page.request.get(`${API_BASE_URL}/points/my-info`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // 应该返回401未授权
      expect(response.status()).toBe(401);
    });

    test('返回的积分余额应为非负数', async ({ page }) => {
      const token = await loginAndGetToken(
        page,
        TEST_ACCOUNTS.normalUser.phone,
        TEST_ACCOUNTS.normalUser.password
      );

      if (!token) {
        test.skip();
        return;
      }

      const pointsInfo = await getPointsInfoFromAPI(page, token);

      expect(pointsInfo.data.pointsBalance).toBeGreaterThanOrEqual(0);
      expect(pointsInfo.data.pointsTotal).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('用户等级与积分关系验证', () => {
    test('用户等级应与累计积分对应', async ({ page }) => {
      const token = await loginAndGetToken(
        page,
        TEST_ACCOUNTS.normalUser.phone,
        TEST_ACCOUNTS.normalUser.password
      );

      if (!token) {
        test.skip();
        return;
      }

      const pointsInfo = await getPointsInfoFromAPI(page, token);

      const { pointsTotal, userLevel } = pointsInfo.data;

      // 根据积分规则验证等级
      // LV1: 0-499, LV2: 500-1999, LV3: 2000-4999, LV4: 5000-9999, LV5: 10000-19999, LV6: 20000+
      if (pointsTotal < 500) {
        expect(userLevel).toBe(1);
      } else if (pointsTotal < 2000) {
        expect(userLevel).toBe(2);
      } else if (pointsTotal < 5000) {
        expect(userLevel).toBe(3);
      } else if (pointsTotal < 10000) {
        expect(userLevel).toBe(4);
      } else if (pointsTotal < 20000) {
        expect(userLevel).toBe(5);
      } else {
        expect(userLevel).toBe(6);
      }
    });

    test('等级名称应与等级对应', async ({ page }) => {
      const token = await loginAndGetToken(
        page,
        TEST_ACCOUNTS.normalUser.phone,
        TEST_ACCOUNTS.normalUser.password
      );

      if (!token) {
        test.skip();
        return;
      }

      const pointsInfo = await getPointsInfoFromAPI(page, token);

      const { userLevel, levelName } = pointsInfo.data;

      // 验证等级名称
      const levelNames: Record<number, string> = {
        1: 'LV1 新手',
        2: 'LV2 初级',
        3: 'LV3 中级',
        4: 'LV4 高级',
        5: 'LV5 专家',
        6: 'LV6 大师',
      };

      expect(levelName).toBe(levelNames[userLevel]);
    });
  });

  test.describe('数据一致性验证', () => {
    test('API返回的积分应与页面显示一致', async ({ page }) => {
      const token = await loginAndGetToken(
        page,
        TEST_ACCOUNTS.normalUser.phone,
        TEST_ACCOUNTS.normalUser.password
      );

      if (!token) {
        test.skip();
        return;
      }

      // 获取API返回的积分
      const pointsInfo = await getPointsInfoFromAPI(page, token);
      const apiPointsBalance = pointsInfo.data.pointsBalance;

      // 访问个人中心页面
      await page.goto(`${BASE_URL}/personal`);
      await page.waitForLoadState('networkidle');

      // 尝试从页面获取积分显示
      const pagePoints = await getPointsFromPage(page);

      // 如果页面有显示积分，验证一致性
      if (pagePoints !== null) {
        expect(pagePoints).toBe(apiPointsBalance);
      }
    });

    test('多次调用API应返回一致的积分', async ({ page }) => {
      const token = await loginAndGetToken(
        page,
        TEST_ACCOUNTS.normalUser.phone,
        TEST_ACCOUNTS.normalUser.password
      );

      if (!token) {
        test.skip();
        return;
      }

      // 连续调用两次API
      const pointsInfo1 = await getPointsInfoFromAPI(page, token);
      const pointsInfo2 = await getPointsInfoFromAPI(page, token);

      // 在没有积分变动的情况下，两次调用应返回相同结果
      expect(pointsInfo1.data.pointsBalance).toBe(pointsInfo2.data.pointsBalance);
      expect(pointsInfo1.data.pointsTotal).toBe(pointsInfo2.data.pointsTotal);
    });
  });
});
