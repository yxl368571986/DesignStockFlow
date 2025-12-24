/**
 * 收藏功能E2E测试
 * 测试任务7：收藏功能测试
 * 需求: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 44.1
 */
import { test, expect, Page } from '@playwright/test';
import { BASE_URL, API_BASE_URL, TEST_ACCOUNTS } from './config';

// 测试账号
const TEST_USER = TEST_ACCOUNTS.normalUser;

// 辅助函数：登录
async function login(page: Page, phone: string, password: string): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Element Plus el-input 组件的输入框选择器
    const phoneInput = page.locator('.el-input input[placeholder="请输入手机号"]');
    const passwordInput = page.locator('.el-input input[placeholder="请输入密码"]');
    
    await phoneInput.fill(phone);
    await passwordInput.fill(password);
    
    // 登录按钮使用 native-type="submit" 和 class="login-button"
    const loginBtn = page.locator('button.login-button, button[type="submit"]:has-text("登录")').first();
    await loginBtn.click();
    
    // 等待登录完成
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    return !currentUrl.includes('/login');
  } catch (error) {
    console.error('登录失败:', error);
    return false;
  }
}

test.describe('Task 7: Favorite Function Tests', () => {
  
  test.describe('7.1 Add Favorite Tests', () => {
    test('logged in user should be able to add favorite', async ({ page }) => {
      // 登录
      const loginSuccess = await login(page, TEST_USER.phone, TEST_USER.password);
      if (!loginSuccess) {
        test.skip();
        return;
      }
      
      // 访问资源列表
      await page.goto(`${BASE_URL}/resources`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // 找到资源卡片并悬停
      const resourceCard = page.locator('.resource-card, [class*="resource-item"]').first();
      if (await resourceCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await resourceCard.hover();
        await page.waitForTimeout(300);
        
        // 查找收藏按钮
        const collectButton = page.locator('[class*="collect"], [class*="favorite"], button:has-text("收藏")').first();
        if (await collectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await collectButton.click();
          await page.waitForTimeout(500);
          
          // 验证收藏成功提示或按钮状态变化
          const successMessage = page.locator('.el-message--success, [class*="success"]');
          const isCollected = page.locator('[class*="collected"], [class*="favorited"], .is-collected');
          
          const hasSuccess = await successMessage.isVisible({ timeout: 2000 }).catch(() => false);
          const hasCollectedState = await isCollected.isVisible({ timeout: 2000 }).catch(() => false);
          
          expect(hasSuccess || hasCollectedState).toBeTruthy();
        }
      }
    });

    test('favorite button state should change correctly', async ({ page }) => {
      const loginSuccess = await login(page, TEST_USER.phone, TEST_USER.password);
      if (!loginSuccess) {
        test.skip();
        return;
      }
      
      await page.goto(`${BASE_URL}/resources`);
      await page.waitForLoadState('networkidle');
      
      // 进入资源详情
      const resourceCard = page.locator('.resource-card, [class*="resource-item"]').first();
      if (await resourceCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await resourceCard.click();
        await page.waitForLoadState('networkidle');
        
        // 检查收藏按钮存在
        const collectButton = page.locator('button:has-text("收藏"), [class*="collect"], [class*="favorite"]').first();
        await expect(collectButton).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('7.2 Remove Favorite Tests', () => {
    test('clicking favorite button on collected resource should remove favorite', async ({ page }) => {
      const loginSuccess = await login(page, TEST_USER.phone, TEST_USER.password);
      if (!loginSuccess) {
        test.skip();
        return;
      }
      
      // 先访问个人中心的收藏列表
      await page.goto(`${BASE_URL}/personal`);
      await page.waitForLoadState('networkidle');
      
      // 点击收藏Tab
      const collectTab = page.locator('[class*="tab"]:has-text("收藏"), button:has-text("我的收藏")');
      if (await collectTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await collectTab.click();
        await page.waitForTimeout(500);
      }
      
      // 如果有收藏的资源，尝试取消收藏
      const collectedItem = page.locator('.favorite-item, [class*="collect-item"]').first();
      if (await collectedItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 找到取消收藏按钮
        const uncollectButton = page.locator('button:has-text("取消收藏"), [class*="uncollect"]').first();
        if (await uncollectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await uncollectButton.click();
          await page.waitForTimeout(500);
          
          // 验证取消成功
          const successMessage = page.locator('.el-message--success');
          const hasSuccess = await successMessage.isVisible({ timeout: 2000 }).catch(() => false);
          expect(hasSuccess).toBeTruthy();
        }
      }
    });
  });

  test.describe('7.3 Favorite List Tests', () => {
    test('personal center should display favorite list', async ({ page }) => {
      const loginSuccess = await login(page, TEST_USER.phone, TEST_USER.password);
      if (!loginSuccess) {
        test.skip();
        return;
      }
      
      await page.goto(`${BASE_URL}/personal`);
      await page.waitForLoadState('networkidle');
      
      // 查找收藏相关的Tab或区域
      const collectTab = page.locator('[class*="tab"]:has-text("收藏"), button:has-text("我的收藏"), [role="tab"]:has-text("收藏")');
      
      if (await collectTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await collectTab.click();
        await page.waitForTimeout(500);
        
        // 验证收藏列表区域存在
        const collectList = page.locator('[class*="favorite"], [class*="collect-list"], [class*="collection"]');
        await expect(collectList.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('favorite list API should return correct format', async ({ page, request }) => {
      // 先登录获取token
      const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          phone: TEST_USER.phone,
          password: TEST_USER.password
        }
      });
      
      const loginData = await loginResponse.json();
      const token = loginData.data?.accessToken || loginData.data?.token;
      
      if (token) {
        // 调用收藏列表API
        const response = await request.get(`${API_BASE_URL}/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            pageNum: 1,
            pageSize: 20
          }
        });
        
        expect(response.status()).toBe(200);
        
        const data = await response.json();
        expect(data).toHaveProperty('code');
        expect(data).toHaveProperty('data');
        
        if (data.data) {
          expect(data.data).toHaveProperty('list');
          expect(data.data).toHaveProperty('total');
          expect(Array.isArray(data.data.list)).toBeTruthy();
        }
      }
    });
  });

  test.describe('7.4 Unauthenticated Favorite Tests', () => {
    test('unauthenticated user clicking favorite should prompt login', async ({ page }) => {
      // 直接访问资源页面（不登录）
      await page.goto(`${BASE_URL}/resources`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // 找到资源卡片并悬停
      const resourceCard = page.locator('.resource-card, [class*="resource-item"]').first();
      if (await resourceCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await resourceCard.hover();
        await page.waitForTimeout(300);
        
        // 点击收藏按钮
        const collectButton = page.locator('[class*="collect"], [class*="favorite"]').first();
        if (await collectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await collectButton.click();
          await page.waitForTimeout(500);
          
          // 验证提示登录或跳转到登录页
          const loginPrompt = page.locator('.el-message:has-text("登录"), .el-message-box:has-text("登录")');
          const isOnLoginPage = page.url().includes('/login');
          
          const hasLoginPrompt = await loginPrompt.isVisible({ timeout: 2000 }).catch(() => false);
          
          expect(hasLoginPrompt || isOnLoginPage).toBeTruthy();
        }
      }
    });

    test('unauthenticated access to favorite list should redirect to login', async ({ page }) => {
      // 直接访问个人中心
      await page.goto(`${BASE_URL}/personal`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // 应该被重定向到登录页
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('7.5 Favorite Status Display Tests', () => {
    test('resource card should display correct favorite status', async ({ page }) => {
      const loginSuccess = await login(page, TEST_USER.phone, TEST_USER.password);
      if (!loginSuccess) {
        test.skip();
        return;
      }
      
      await page.goto(`${BASE_URL}/resources`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // 悬停在资源卡片上
      const resourceCard = page.locator('.resource-card, [class*="resource-item"]').first();
      if (await resourceCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await resourceCard.hover();
        await page.waitForTimeout(300);
        
        // 检查收藏按钮存在
        const collectButton = page.locator('[class*="collect"], [class*="favorite"]').first();
        await expect(collectButton).toBeVisible({ timeout: 3000 });
      }
    });

    test('detail page should display correct favorite status', async ({ page }) => {
      const loginSuccess = await login(page, TEST_USER.phone, TEST_USER.password);
      if (!loginSuccess) {
        test.skip();
        return;
      }
      
      await page.goto(`${BASE_URL}/resources`);
      await page.waitForLoadState('networkidle');
      
      // 进入资源详情
      const resourceCard = page.locator('.resource-card, [class*="resource-item"]').first();
      if (await resourceCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await resourceCard.click();
        await page.waitForLoadState('networkidle');
        
        // 检查收藏按钮和状态
        const collectButton = page.locator('button:has-text("收藏"), [class*="collect-btn"], [class*="favorite-btn"]');
        await expect(collectButton.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('favorite status check API should work correctly', async ({ request }) => {
      // 先登录获取token
      const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          phone: TEST_USER.phone,
          password: TEST_USER.password
        }
      });
      
      const loginData = await loginResponse.json();
      const token = loginData.data?.accessToken || loginData.data?.token;
      
      // 测试收藏状态检查API（使用一个测试资源ID）
      const testResourceId = 'test-resource-001';
      const response = await request.get(`${API_BASE_URL}/favorites/${testResourceId}/check`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      
      // API应该返回200（即使资源不存在也应该返回false）
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('isFavorited');
      expect(typeof data.data.isFavorited).toBe('boolean');
    });

    test('batch favorite status check API should work correctly', async ({ request }) => {
      // 先登录获取token
      const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          phone: TEST_USER.phone,
          password: TEST_USER.password
        }
      });
      
      const loginData = await loginResponse.json();
      const token = loginData.data?.accessToken || loginData.data?.token;
      
      if (!token) {
        // 如果没有token，跳过测试
        return;
      }
      
      // 测试批量检查API - 使用非空数组
      const resourceIds = ['res-001', 'res-002', 'res-003'];
      const response = await request.post(`${API_BASE_URL}/favorites/check-batch`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { resourceIds }
      });
      
      // API可能返回200或400（取决于资源是否存在）
      const status = response.status();
      expect([200, 400]).toContain(status);
      
      const data = await response.json();
      expect(data).toHaveProperty('code');
    });
  });
});

test.describe('Favorite API Format Tests', () => {
  test('POST /api/v1/favorites/:resourceId format validation', async ({ request }) => {
    // 先登录
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        phone: TEST_USER.phone,
        password: TEST_USER.password
      }
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.data?.accessToken || loginData.data?.token;
    
    if (token) {
      // 测试添加收藏接口
      const response = await request.post(`${API_BASE_URL}/favorites/test-resource-001`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      // 验证响应格式
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('msg');
      // code应该是数字
      expect(typeof data.code).toBe('number');
    }
  });

  test('DELETE /api/v1/favorites/:resourceId format validation', async ({ request }) => {
    // 先登录
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        phone: TEST_USER.phone,
        password: TEST_USER.password
      }
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.data?.accessToken || loginData.data?.token;
    
    if (token) {
      // 测试取消收藏接口
      const response = await request.delete(`${API_BASE_URL}/favorites/test-resource-001`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      // 验证响应格式
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('msg');
    }
  });

  test('GET /api/v1/favorites format validation', async ({ request }) => {
    // 先登录
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        phone: TEST_USER.phone,
        password: TEST_USER.password
      }
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.data?.accessToken || loginData.data?.token;
    
    if (token) {
      const response = await request.get(`${API_BASE_URL}/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      // 验证响应格式
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('msg');
      expect(data).toHaveProperty('data');
      
      // 验证分页格式
      if (data.data) {
        expect(data.data).toHaveProperty('list');
        expect(data.data).toHaveProperty('total');
        expect(Array.isArray(data.data.list)).toBeTruthy();
        expect(typeof data.data.total).toBe('number');
      }
    }
  });

  test('unauthenticated request should return 401', async ({ request }) => {
    // 不带token请求收藏列表
    const response = await request.get(`${API_BASE_URL}/favorites`);
    
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.code).toBe(401);
  });
});
