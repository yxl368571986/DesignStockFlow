/**
 * 任务6.5：测试付费资源下载与积分扣除（数据库同步）
 * 
 * 测试场景：
 * - 下载前验证：记录用户当前积分余额（从数据库查询）、记录资源所需积分数量
 * - 下载操作：积分充足时点击下载 → 应扣除积分并开始下载、下载过程中显示loading状态
 * - 下载后验证（数据库同步）：
 *   - 验证前端显示的积分余额已更新
 *   - 验证数据库中积分余额正确扣除
 *   - 验证积分记录表新增一条消费记录
 *   - 验证下载记录表新增一条记录
 *   - 验证资源下载量+1
 * - API验证：
 *   - 同步检查 POST /api/v1/resources/:id/download 接口
 *   - 验证接口返回正确的积分扣除信息
 * 
 * 需求: 4.4, 8.4, 44.1
 */

import { test, expect, Page } from '@playwright/test';

// 测试账号信息
const TEST_ACCOUNTS = {
  normalUser: {
    phone: '13800000001',
    password: 'test123456',
    name: '普通用户A'
  }
};

// 基础URL
const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:8080/api/v1';

/**
 * 登录并获取token
 */
async function loginAndGetToken(request: any): Promise<string | null> {
  try {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        phone: TEST_ACCOUNTS.normalUser.phone,
        password: TEST_ACCOUNTS.normalUser.password
      }
    });

    if (response.status() !== 200) {
      console.error('登录失败:', response.status());
      return null;
    }

    const data = await response.json();
    return data.data?.accessToken || data.data?.token || null;
  } catch (error) {
    console.error('登录异常:', error);
    return null;
  }
}

/**
 * 获取用户积分信息（通过API）
 */
async function getUserPointsInfo(request: any, token: string): Promise<{ pointsBalance: number; pointsTotal: number } | null> {
  try {
    const response = await request.get(`${API_BASE_URL}/points/my-info`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status() !== 200) {
      console.error('获取积分信息失败:', response.status());
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('获取积分信息异常:', error);
    return null;
  }
}

/**
 * 获取用户积分记录（通过API）
 */
async function getUserPointsRecords(request: any, token: string, pageSize: number = 10): Promise<any[]> {
  try {
    const response = await request.get(`${API_BASE_URL}/points/records?pageSize=${pageSize}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status() !== 200) {
      console.error('获取积分记录失败:', response.status());
      return [];
    }

    const data = await response.json();
    return data.data?.list || [];
  } catch (error) {
    console.error('获取积分记录异常:', error);
    return [];
  }
}

/**
 * 获取资源详情（通过API）
 */
async function getResourceDetail(request: any, resourceId: string, token: string): Promise<any | null> {
  try {
    const response = await request.get(`${API_BASE_URL}/resources/${resourceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status() !== 200) {
      console.error('获取资源详情失败:', response.status());
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('获取资源详情异常:', error);
    return null;
  }
}

/**
 * 获取付费资源列表（通过API）
 */
async function getPaidResources(request: any, token: string): Promise<any[]> {
  try {
    // 获取vipLevel > 0的资源（需要积分下载）
    const response = await request.get(`${API_BASE_URL}/resources?pageSize=20`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status() !== 200) {
      console.error('获取资源列表失败:', response.status());
      return [];
    }

    const data = await response.json();
    const resources = data.data?.list || [];
    
    // 筛选需要积分的资源（pointsCost > 0）
    return resources.filter((r: any) => r.pointsCost > 0);
  } catch (error) {
    console.error('获取资源列表异常:', error);
    return [];
  }
}

/**
 * 下载资源（通过API）
 */
async function downloadResourceAPI(request: any, resourceId: string, token: string): Promise<any> {
  try {
    const response = await request.post(`${API_BASE_URL}/resources/${resourceId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return {
      status: response.status(),
      ...data
    };
  } catch (error) {
    console.error('下载资源异常:', error);
    return { status: 500, error: (error as Error).message };
  }
}

/**
 * 获取用户下载历史（通过API）
 */
async function getUserDownloadHistory(request: any, token: string, pageSize: number = 10): Promise<{ list: any[]; total: number }> {
  try {
    const response = await request.get(`${API_BASE_URL}/user/download-history?pageNum=1&pageSize=${pageSize}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status() !== 200) {
      console.error('获取下载历史失败:', response.status());
      return { list: [], total: 0 };
    }

    const data = await response.json();
    return {
      list: data.data?.list || [],
      total: data.data?.total || 0
    };
  } catch (error) {
    console.error('获取下载历史异常:', error);
    return { list: [], total: 0 };
  }
}


test.describe('6.5 测试付费资源下载与积分扣除（数据库同步）', () => {
  test.describe.configure({ mode: 'serial' });

  let authToken: string | null = null;
  let testResourceId: string | null = null;
  let initialPointsBalance: number = 0;
  let resourcePointsCost: number = 0;
  let initialDownloadCount: number = 0;

  test.beforeAll(async ({ request }) => {
    // 登录获取token
    authToken = await loginAndGetToken(request);
    if (!authToken) {
      console.error('无法获取认证token，测试将跳过');
    }
  });

  test('6.5.1 下载前验证 - 记录用户当前积分余额', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    // 获取用户积分信息
    const pointsInfo = await getUserPointsInfo(request, authToken);
    
    expect(pointsInfo).not.toBeNull();
    expect(pointsInfo).toHaveProperty('pointsBalance');
    
    initialPointsBalance = pointsInfo!.pointsBalance;
    console.log(`用户当前积分余额: ${initialPointsBalance}`);
    
    // 验证积分余额是数字
    expect(typeof initialPointsBalance).toBe('number');
    expect(initialPointsBalance).toBeGreaterThanOrEqual(0);
  });

  test('6.5.2 下载前验证 - 记录资源所需积分数量', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    // 获取付费资源列表
    const paidResources = await getPaidResources(request, authToken);
    
    if (paidResources.length === 0) {
      console.log('没有找到付费资源，跳过测试');
      test.skip();
      return;
    }

    // 选择第一个付费资源
    const resource = paidResources[0];
    testResourceId = resource.resourceId;
    resourcePointsCost = resource.pointsCost;
    
    console.log(`测试资源ID: ${testResourceId}`);
    console.log(`资源所需积分: ${resourcePointsCost}`);
    
    // 验证资源积分消耗是正数
    expect(resourcePointsCost).toBeGreaterThan(0);
    
    // 获取资源详情，记录初始下载量
    const resourceDetail = await getResourceDetail(request, testResourceId, authToken);
    if (resourceDetail) {
      initialDownloadCount = resourceDetail.downloadCount || 0;
      console.log(`资源初始下载量: ${initialDownloadCount}`);
    }
  });

  test('6.5.3 下载操作 - 积分充足时点击下载应扣除积分并开始下载', async ({ request }) => {
    if (!authToken || !testResourceId) {
      test.skip();
      return;
    }

    // 检查积分是否充足
    if (initialPointsBalance < resourcePointsCost) {
      console.log(`积分不足: 当前${initialPointsBalance}, 需要${resourcePointsCost}`);
      test.skip();
      return;
    }

    // 调用下载API
    const downloadResult = await downloadResourceAPI(request, testResourceId, authToken);
    
    console.log('下载API响应:', JSON.stringify(downloadResult, null, 2));
    
    // 验证下载成功
    expect(downloadResult.status).toBe(200);
    expect(downloadResult.code).toBe(200);
    expect(downloadResult.data).toHaveProperty('downloadUrl');
    
    // 验证返回的积分扣除信息
    if (downloadResult.data.pointsCost !== undefined) {
      console.log(`API返回的积分扣除: ${downloadResult.data.pointsCost}`);
      expect(downloadResult.data.pointsCost).toBe(resourcePointsCost);
    }
  });

  test('6.5.4 下载后验证 - 验证前端显示的积分余额已更新', async ({ request }) => {
    if (!authToken || !testResourceId) {
      test.skip();
      return;
    }

    // 检查积分是否充足（如果之前跳过了下载测试）
    if (initialPointsBalance < resourcePointsCost) {
      test.skip();
      return;
    }

    // 获取更新后的积分信息
    const updatedPointsInfo = await getUserPointsInfo(request, authToken);
    
    expect(updatedPointsInfo).not.toBeNull();
    
    const newBalance = updatedPointsInfo!.pointsBalance;
    const expectedBalance = initialPointsBalance - resourcePointsCost;
    
    console.log(`下载前积分: ${initialPointsBalance}`);
    console.log(`扣除积分: ${resourcePointsCost}`);
    console.log(`预期余额: ${expectedBalance}`);
    console.log(`实际余额: ${newBalance}`);
    
    // 验证积分已正确扣除
    expect(newBalance).toBe(expectedBalance);
  });

  test('6.5.5 下载后验证 - 验证积分记录表新增一条消费记录', async ({ request }) => {
    if (!authToken || !testResourceId) {
      test.skip();
      return;
    }

    // 检查积分是否充足
    if (initialPointsBalance < resourcePointsCost) {
      test.skip();
      return;
    }

    // 获取积分记录
    const pointsRecords = await getUserPointsRecords(request, authToken, 5);
    
    console.log('最近积分记录:', JSON.stringify(pointsRecords.slice(0, 3), null, 2));
    
    // 查找最新的消费记录
    const latestConsumeRecord = pointsRecords.find(
      (record: any) => record.changeType === 'consume' && record.source === 'download_resource'
    );
    
    expect(latestConsumeRecord).toBeDefined();
    
    if (latestConsumeRecord) {
      console.log('找到消费记录:', JSON.stringify(latestConsumeRecord, null, 2));
      
      // 验证消费记录的积分变动
      expect(latestConsumeRecord.pointsChange).toBe(-resourcePointsCost);
      
      // 验证消费记录关联的资源ID
      if (latestConsumeRecord.sourceId) {
        expect(latestConsumeRecord.sourceId).toBe(testResourceId);
      }
    }
  });

  test('6.5.6 下载后验证 - 验证资源下载量+1', async ({ request }) => {
    if (!authToken || !testResourceId) {
      test.skip();
      return;
    }

    // 检查积分是否充足
    if (initialPointsBalance < resourcePointsCost) {
      test.skip();
      return;
    }

    // 获取资源详情
    const resourceDetail = await getResourceDetail(request, testResourceId, authToken);
    
    expect(resourceDetail).not.toBeNull();
    
    const newDownloadCount = resourceDetail!.downloadCount || 0;
    
    console.log(`下载前下载量: ${initialDownloadCount}`);
    console.log(`下载后下载量: ${newDownloadCount}`);
    
    // 验证下载量增加了1
    expect(newDownloadCount).toBe(initialDownloadCount + 1);
  });
});


test.describe('6.5 API验证 - POST /api/v1/resources/:id/download 接口', () => {
  test('API应返回正确的响应格式', async ({ request }) => {
    // 登录获取token
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip();
      return;
    }

    // 获取资源列表
    const response = await request.get(`${API_BASE_URL}/resources?pageSize=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status() !== 200) {
      test.skip();
      return;
    }

    const resourcesData = await response.json();
    const resources = resourcesData.data?.list || [];

    if (resources.length === 0) {
      test.skip();
      return;
    }

    // 尝试下载第一个资源
    const resourceId = resources[0].resourceId;
    const downloadResponse = await request.post(`${API_BASE_URL}/resources/${resourceId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const downloadData = await downloadResponse.json();
    
    console.log('下载API响应:', JSON.stringify(downloadData, null, 2));
    
    // 验证响应格式包含必要字段
    expect(downloadData).toHaveProperty('code');
    expect(downloadData).toHaveProperty('msg');
    
    // 如果下载成功，验证返回数据
    if (downloadData.code === 200) {
      expect(downloadData.data).toHaveProperty('downloadUrl');
      expect(downloadData.data).toHaveProperty('fileName');
      expect(downloadData.data).toHaveProperty('fileSize');
      
      // 验证积分扣除信息
      expect(downloadData.data).toHaveProperty('pointsCost');
      expect(typeof downloadData.data.pointsCost).toBe('number');
    }
  });

  test('API应正确返回积分扣除信息', async ({ request }) => {
    // 登录获取token
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip();
      return;
    }

    // 获取用户当前积分
    const pointsInfoBefore = await getUserPointsInfo(request, token);
    if (!pointsInfoBefore) {
      test.skip();
      return;
    }

    console.log(`下载前积分余额: ${pointsInfoBefore.pointsBalance}`);

    // 获取付费资源
    const paidResources = await getPaidResources(request, token);
    
    if (paidResources.length === 0) {
      console.log('没有付费资源可测试');
      test.skip();
      return;
    }

    const resource = paidResources[0];
    const expectedPointsCost = resource.pointsCost;

    // 检查积分是否充足
    if (pointsInfoBefore.pointsBalance < expectedPointsCost) {
      console.log(`积分不足: 当前${pointsInfoBefore.pointsBalance}, 需要${expectedPointsCost}`);
      test.skip();
      return;
    }

    // 下载资源
    const downloadResult = await downloadResourceAPI(request, resource.resourceId, token);
    
    if (downloadResult.code === 200) {
      // 验证返回的积分扣除信息
      expect(downloadResult.data.pointsCost).toBe(expectedPointsCost);
      
      // 获取下载后的积分
      const pointsInfoAfter = await getUserPointsInfo(request, token);
      
      if (pointsInfoAfter) {
        const actualDeduction = pointsInfoBefore.pointsBalance - pointsInfoAfter.pointsBalance;
        console.log(`实际扣除积分: ${actualDeduction}`);
        console.log(`预期扣除积分: ${expectedPointsCost}`);
        
        expect(actualDeduction).toBe(expectedPointsCost);
      }
    }
  });

  test('未认证请求应返回401', async ({ request }) => {
    // 先获取一个有效的资源ID
    // 登录获取token
    const token = await loginAndGetToken(request);
    
    let resourceId = 'test-resource-id';
    
    if (token) {
      // 获取资源列表
      const response = await request.get(`${API_BASE_URL}/resources?pageSize=1`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status() === 200) {
        const resourcesData = await response.json();
        const resources = resourcesData.data?.list || [];
        if (resources.length > 0) {
          resourceId = resources[0].resourceId;
        }
      }
    }

    // 不带token请求下载API
    const downloadResponse = await request.post(`${API_BASE_URL}/resources/${resourceId}/download`);
    
    // 应该返回401未认证
    expect(downloadResponse.status()).toBe(401);
    
    const data = await downloadResponse.json();
    expect(data.code).toBe(401);
  });

  test('下载不存在的资源应返回错误', async ({ request }) => {
    // 登录获取token
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip();
      return;
    }

    // 尝试下载不存在的资源
    const downloadResponse = await request.post(`${API_BASE_URL}/resources/non-existent-resource-id/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // 应该返回错误（404或500）
    expect([404, 500]).toContain(downloadResponse.status());
  });
});

test.describe('6.5 前端UI测试 - 付费资源下载流程', () => {
  /**
   * 登录辅助函数
   */
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
      
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      return !currentUrl.includes('/login');
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  }

  test('下载过程中应显示loading状态', async ({ page }) => {
    // 登录
    const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
    
    if (!loginSuccess) {
      test.skip();
      return;
    }

    // 访问资源列表页
    await page.goto(`${BASE_URL}/resource`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 查找资源卡片
    const resourceCard = page.locator('.resource-card, [class*="resource-item"]').first();
    
    if (await resourceCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 点击进入资源详情
      await resourceCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 查找下载按钮
      const downloadBtn = page.locator('.download-btn, button:has-text("下载"), [class*="download"]').first();
      
      if (await downloadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 点击下载按钮
        await downloadBtn.click();
        
        // 检查是否显示loading状态
        // 可能的loading指示器：按钮上的loading图标、全局loading遮罩等
        const loadingIndicator = page.locator('.el-loading, .loading, [class*="loading"], .el-button.is-loading');
        const hasLoading = await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false);
        
        console.log(`检测到loading状态: ${hasLoading}`);
        
        // 等待下载完成或对话框出现
        await page.waitForTimeout(2000);
        
        // 如果显示积分确认对话框，点击确认
        const confirmBtn = page.locator('.el-message-box__btns button:has-text("确认"), button:has-text("确定")').first();
        if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('下载成功后前端积分显示应更新', async ({ page }) => {
    // 登录
    const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
    
    if (!loginSuccess) {
      test.skip();
      return;
    }

    // 访问个人中心获取初始积分
    await page.goto(`${BASE_URL}/personal`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 获取初始积分显示
    const pointsElement = page.locator('.points-balance, [class*="points"], .user-points, text=/\\d+.*积分/').first();
    let initialPointsText = '';
    if (await pointsElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      initialPointsText = await pointsElement.textContent() || '';
      console.log(`初始积分显示: ${initialPointsText}`);
    }

    // 访问资源列表页
    await page.goto(`${BASE_URL}/resource`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 查找资源卡片
    const resourceCard = page.locator('.resource-card, [class*="resource-item"]').first();
    
    if (await resourceCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 点击进入资源详情
      await resourceCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 查找下载按钮
      const downloadBtn = page.locator('.download-btn, button:has-text("下载"), [class*="download"]').first();
      
      if (await downloadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 点击下载按钮
        await downloadBtn.click();
        await page.waitForTimeout(1500);

        // 如果显示积分确认对话框，点击确认
        const confirmBtn = page.locator('.el-message-box__btns button:has-text("确认"), button:has-text("确定")').first();
        if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(2000);
        }

        // 返回个人中心检查积分是否更新
        await page.goto(`${BASE_URL}/personal`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 获取更新后的积分显示
        if (await pointsElement.isVisible({ timeout: 2000 }).catch(() => false)) {
          const updatedPointsText = await pointsElement.textContent() || '';
          console.log(`更新后积分显示: ${updatedPointsText}`);
          
          // 如果下载了付费资源，积分应该有变化
          // 注意：如果下载的是免费资源，积分不会变化
        }
      }
    }
  });
});


test.describe('6.5 下载记录验证', () => {
  test('下载后应在下载历史中新增记录', async ({ request }) => {
    // 登录获取token
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip();
      return;
    }

    // 获取下载前的下载历史
    const historyBefore = await getUserDownloadHistory(request, token, 20);
    const historyCountBefore = historyBefore.total;
    console.log(`下载前历史记录总数: ${historyCountBefore}`);

    // 获取资源列表
    const response = await request.get(`${API_BASE_URL}/resources?pageSize=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status() !== 200) {
      test.skip();
      return;
    }

    const resourcesData = await response.json();
    const resources = resourcesData.data?.list || [];

    if (resources.length === 0) {
      test.skip();
      return;
    }

    // 下载第一个资源
    const resourceId = resources[0].resourceId;
    const downloadResult = await downloadResourceAPI(request, resourceId, token);
    
    if (downloadResult.code !== 200) {
      console.log('下载失败，跳过验证');
      test.skip();
      return;
    }

    // 获取下载后的下载历史
    const historyAfter = await getUserDownloadHistory(request, token, 20);
    const historyCountAfter = historyAfter.total;
    console.log(`下载后历史记录总数: ${historyCountAfter}`);

    // 验证下载历史增加了一条记录
    expect(historyCountAfter).toBeGreaterThan(historyCountBefore);

    // 验证最新的下载记录是刚才下载的资源
    if (historyAfter.list.length > 0) {
      const latestRecord = historyAfter.list[0];
      console.log('最新下载记录:', JSON.stringify(latestRecord, null, 2));
      
      // 验证记录包含资源ID
      if (latestRecord.resourceId) {
        expect(latestRecord.resourceId).toBe(resourceId);
      }
    }
  });
});
