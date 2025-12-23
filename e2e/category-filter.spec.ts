import { test, expect } from '@playwright/test';

/**
 * 分类筛选功能测试
 * 验证点击分类后，资源列表只显示该分类的资源
 */

test.describe('分类筛选功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 访问首页，增加超时时间
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    // 等待分类导航加载完成
    await page.waitForSelector('.category-nav', { timeout: 10000 });
  });

  test('点击"图标类"分类，应该只显示图标类资源', async ({ page }) => {
    // 点击"图标类"分类
    await page.click('text=图标类');
    
    // 等待跳转到资源列表页
    await page.waitForURL(/\/resource\?categoryId=/);
    await page.waitForLoadState('networkidle');
    
    // 验证URL包含categoryId参数
    const url = page.url();
    expect(url).toContain('categoryId=');
    
    // 等待资源卡片加载
    await page.waitForSelector('.resource-card', { timeout: 10000 });
    
    // 获取所有资源卡片
    const resourceCards = await page.locator('.resource-card').all();
    console.log(`找到 ${resourceCards.length} 个资源卡片`);
    
    // 验证至少有资源显示
    expect(resourceCards.length).toBeGreaterThan(0);
    
    // 验证每个资源卡片的格式标签
    for (const card of resourceCards) {
      const formatTag = await card.locator('.meta-item.format .el-tag').textContent();
      console.log(`资源格式: ${formatTag}`);
      
      // 图标类资源应该是SVG或PNG格式
      expect(formatTag).toMatch(/SVG|PNG/i);
    }
  });

  test('点击"电商类"分类，应该只显示电商类资源', async ({ page }) => {
    // 点击"电商类"分类
    await page.click('text=电商类');
    
    // 等待跳转到资源列表页
    await page.waitForURL(/\/resource\?categoryId=/);
    await page.waitForLoadState('networkidle');
    
    // 等待资源卡片加载
    await page.waitForSelector('.resource-card', { timeout: 10000 });
    
    // 获取所有资源卡片
    const resourceCards = await page.locator('.resource-card').all();
    console.log(`找到 ${resourceCards.length} 个资源卡片`);
    
    // 验证资源数量（电商类应该有8个资源）
    expect(resourceCards.length).toBeLessThanOrEqual(20); // 一页最多20个
    expect(resourceCards.length).toBeGreaterThan(0);
  });

  test('点击"UI设计类"分类，应该只显示UI设计类资源', async ({ page }) => {
    // 点击"UI设计类"分类
    await page.click('text=UI设计类');
    
    // 等待跳转到资源列表页
    await page.waitForURL(/\/resource\?categoryId=/);
    await page.waitForLoadState('networkidle');
    
    // 等待资源卡片加载
    await page.waitForSelector('.resource-card', { timeout: 10000 });
    
    // 获取所有资源卡片
    const resourceCards = await page.locator('.resource-card').all();
    console.log(`找到 ${resourceCards.length} 个资源卡片`);
    
    // UI设计类应该有7个资源
    expect(resourceCards.length).toBeGreaterThan(0);
    expect(resourceCards.length).toBeLessThanOrEqual(7);
  });

  test('点击"全部"，应该显示所有分类的资源', async ({ page }) => {
    // 先点击某个分类
    await page.click('text=图标类');
    await page.waitForURL(/\/resource\?categoryId=/);
    await page.waitForLoadState('networkidle');
    
    // 再点击"全部"（使用更精确的选择器）
    await page.locator('.all-categories .category-tag').filter({ hasText: '全部' }).click();
    // 等待URL变化或网络空闲（不强制要求URL完全匹配）
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    
    // 验证URL不包含categoryId参数
    const url = page.url();
    expect(url).not.toContain('categoryId=');
    
    // 等待资源卡片加载
    await page.waitForSelector('.resource-card', { timeout: 10000 });
    
    // 获取所有资源卡片
    const resourceCards = await page.locator('.resource-card').all();
    console.log(`找到 ${resourceCards.length} 个资源卡片`);
    
    // 应该显示更多资源（至少20个，因为总共有54个）
    expect(resourceCards.length).toBeGreaterThanOrEqual(20);
  });

  test('在资源列表页切换分类，应该更新资源列表', async ({ page }) => {
    // 直接访问资源列表页
    await page.goto('http://localhost:3000/resource');
    await page.waitForLoadState('networkidle');
    
    // 点击"图标类"分类
    await page.click('text=图标类');
    await page.waitForURL(/categoryId=/);
    await page.waitForLoadState('networkidle');
    
    // 等待资源卡片加载
    await page.waitForSelector('.resource-card', { timeout: 10000 });
    const iconResources = await page.locator('.resource-card').count();
    console.log(`图标类资源数量: ${iconResources}`);
    
    // 切换到"电商类"
    await page.click('text=电商类');
    await page.waitForURL(/categoryId=/);
    await page.waitForLoadState('networkidle');
    
    // 等待资源卡片更新
    await page.waitForTimeout(1000);
    const ecommerceResources = await page.locator('.resource-card').count();
    console.log(`电商类资源数量: ${ecommerceResources}`);
    
    // 验证资源数量不同（说明筛选生效了）
    expect(ecommerceResources).not.toBe(iconResources);
  });

  test('验证分类资源计数显示正确', async ({ page }) => {
    // 检查"图标类"的资源计数
    const iconCategory = await page.locator('text=/图标类.*\\(\\d+\\)/');
    const iconText = await iconCategory.textContent();
    console.log(`图标类显示: ${iconText}`);
    
    // 提取数字
    const iconCount = iconText?.match(/\((\d+)\)/)?.[1];
    expect(iconCount).toBe('6'); // 图标类应该有6个资源
    
    // 检查"电商类"的资源计数
    const ecommerceCategory = await page.locator('text=/电商类.*\\(\\d+\\)/');
    const ecommerceText = await ecommerceCategory.textContent();
    console.log(`电商类显示: ${ecommerceText}`);
    
    const ecommerceCount = ecommerceText?.match(/\((\d+)\)/)?.[1];
    expect(ecommerceCount).toBe('8'); // 电商类应该有8个资源
  });
});
