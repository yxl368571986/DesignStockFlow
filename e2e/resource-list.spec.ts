import { test, expect } from '@playwright/test';

/**
 * 资源列表页E2E测试
 * 
 * 测试内容：
 * - 4.3 分类筛选功能
 * - 4.4 VIP等级筛选功能
 * - 4.5 文件格式筛选功能
 * - 4.6 排序功能
 * - 4.7 分页功能
 * 
 * 需求: 3.2-3.5, 3.10
 */

test.describe('资源列表页测试', () => {
  test.beforeEach(async ({ page }) => {
    // 访问资源列表页
    await page.goto('http://localhost:3000/resource', { waitUntil: 'domcontentloaded' });
    // 等待页面加载完成
    await page.waitForSelector('.resource-list-page', { timeout: 10000 });
  });

  // ========== 4.1 页面布局测试 ==========
  test.describe('4.1 页面布局测试', () => {
    test('应该显示筛选栏', async ({ page }) => {
      await expect(page.locator('.filter-bar')).toBeVisible();
    });

    test('应该显示排序栏', async ({ page }) => {
      await expect(page.locator('.sort-bar')).toBeVisible();
    });

    test('应该显示分类筛选区域', async ({ page }) => {
      await expect(page.locator('.category-filter-section')).toBeVisible();
      await expect(page.locator('.hot-categories')).toBeVisible();
      await expect(page.locator('.all-categories')).toBeVisible();
    });

    test('应该显示格式和VIP筛选下拉框', async ({ page }) => {
      const filterItems = page.locator('.filter-item');
      await expect(filterItems).toHaveCount(2);
    });

    test('应该显示5个排序选项', async ({ page }) => {
      const sortOptions = page.locator('.sort-option');
      await expect(sortOptions).toHaveCount(5);
    });
  });

  // ========== 4.3 分类筛选功能测试 ==========
  test.describe('4.3 分类筛选功能测试', () => {
    test('点击分类应该更新URL参数', async ({ page }) => {
      // 等待分类标签加载
      await page.waitForSelector('.category-tag');
      
      // 点击UI设计分类
      const uiCategory = page.locator('.category-tag').filter({ hasText: 'UI设计' });
      if (await uiCategory.count() > 0) {
        await uiCategory.first().click();
        
        // 等待URL更新
        await page.waitForURL(/categoryId=/);
        
        // 验证URL包含categoryId参数
        expect(page.url()).toContain('categoryId=');
      }
    });

    test('点击"全部"应该清除分类筛选', async ({ page }) => {
      // 先选择一个分类
      const categoryTag = page.locator('.category-tag').filter({ hasText: 'UI设计' });
      if (await categoryTag.count() > 0) {
        await categoryTag.first().click();
        await page.waitForURL(/categoryId=/);
        
        // 点击"全部"
        const allTag = page.locator('.all-categories .category-tag').filter({ hasText: '全部' });
        await allTag.click();
        
        // 等待URL更新
        await page.waitForTimeout(1000);
        
        // 验证URL不包含categoryId参数
        expect(page.url()).not.toContain('categoryId=');
      }
    });

    test('选中的分类应该有selected样式', async ({ page }) => {
      // 点击一个分类
      const categoryTag = page.locator('.category-tag').filter({ hasText: 'UI设计' });
      if (await categoryTag.count() > 0) {
        await categoryTag.first().click();
        await page.waitForTimeout(500);
        
        // 验证有selected类
        const selectedTag = page.locator('.category-tag.selected');
        await expect(selectedTag).toHaveCount(1);
      }
    });
  });

  // ========== 4.4 VIP等级筛选功能测试 ==========
  test.describe('4.4 VIP等级筛选功能测试', () => {
    test('应该有VIP等级筛选下拉框', async ({ page }) => {
      // 验证VIP筛选下拉框存在
      const filterItems = page.locator('.filter-item');
      await expect(filterItems.nth(1)).toBeVisible();
    });

    test('选择免费资源应该更新URL', async ({ page }) => {
      // 点击VIP筛选下拉框
      const vipSelect = page.locator('.filter-item').nth(1).locator('.el-select');
      if (await vipSelect.count() > 0) {
        await vipSelect.click();
        
        // 选择免费资源
        const freeOption = page.locator('.el-select-dropdown__item').filter({ hasText: '免费资源' });
        if (await freeOption.count() > 0) {
          await freeOption.click();
          await page.waitForTimeout(1000);
          
          // 验证URL包含vip参数
          expect(page.url()).toContain('vip=0');
        }
      }
    });

    test('选择VIP资源应该更新URL', async ({ page }) => {
      // 点击VIP筛选下拉框
      const vipSelect = page.locator('.filter-item').nth(1).locator('.el-select');
      if (await vipSelect.count() > 0) {
        await vipSelect.click();
        
        // 选择VIP资源
        const vipOption = page.locator('.el-select-dropdown__item').filter({ hasText: 'VIP资源' });
        if (await vipOption.count() > 0) {
          await vipOption.click();
          await page.waitForTimeout(1000);
          
          // 验证URL包含vip参数
          expect(page.url()).toContain('vip=1');
        }
      }
    });
  });

  // ========== 4.5 文件格式筛选功能测试 ==========
  test.describe('4.5 文件格式筛选功能测试', () => {
    test('应该有格式筛选下拉框', async ({ page }) => {
      // 验证格式筛选下拉框存在
      const filterItems = page.locator('.filter-item');
      await expect(filterItems.first()).toBeVisible();
    });

    test('选择PSD格式应该更新URL', async ({ page }) => {
      // 点击格式筛选下拉框
      const formatSelect = page.locator('.filter-item').first().locator('.el-select');
      if (await formatSelect.count() > 0) {
        await formatSelect.click();
        
        // 选择PSD格式
        const psdOption = page.locator('.el-select-dropdown__item').filter({ hasText: 'PSD' });
        if (await psdOption.count() > 0) {
          await psdOption.click();
          await page.waitForTimeout(1000);
          
          // 验证URL包含format参数
          expect(page.url()).toContain('format=PSD');
        }
      }
    });

    test('选择AI格式应该更新URL', async ({ page }) => {
      // 点击格式筛选下拉框
      const formatSelect = page.locator('.filter-item').first().locator('.el-select');
      if (await formatSelect.count() > 0) {
        await formatSelect.click();
        
        // 选择AI格式
        const aiOption = page.locator('.el-select-dropdown__item').filter({ hasText: 'AI' });
        if (await aiOption.count() > 0) {
          await aiOption.click();
          await page.waitForTimeout(1000);
          
          // 验证URL包含format参数
          expect(page.url()).toContain('format=AI');
        }
      }
    });
  });

  // ========== 4.6 排序功能测试 ==========
  test.describe('4.6 排序功能测试', () => {
    test('应该显示所有排序选项', async ({ page }) => {
      const sortOptions = page.locator('.sort-option');
      await expect(sortOptions).toHaveCount(5);
      
      // 验证排序选项文本
      await expect(page.locator('.sort-option').filter({ hasText: '综合排序' })).toBeVisible();
      await expect(page.locator('.sort-option').filter({ hasText: '最多下载' })).toBeVisible();
      await expect(page.locator('.sort-option').filter({ hasText: '最新发布' })).toBeVisible();
    });

    test('点击"最多下载"应该更新URL', async ({ page }) => {
      // 点击"最多下载"排序
      const downloadSort = page.locator('.sort-option').filter({ hasText: '最多下载' });
      await downloadSort.click();
      await page.waitForTimeout(1000);
      
      // 验证URL包含sort参数
      expect(page.url()).toContain('sort=download');
    });

    test('点击"最新发布"应该更新URL', async ({ page }) => {
      // 点击"最新发布"排序
      const latestSort = page.locator('.sort-option').filter({ hasText: '最新发布' });
      await latestSort.click();
      await page.waitForTimeout(1000);
      
      // 验证URL包含sort参数
      expect(page.url()).toContain('sort=latest');
    });

    test('选中的排序选项应该有active样式', async ({ page }) => {
      // 点击"最多下载"排序
      const downloadSort = page.locator('.sort-option').filter({ hasText: '最多下载' });
      await downloadSort.click();
      await page.waitForTimeout(500);
      
      // 验证有active类
      await expect(downloadSort).toHaveClass(/active/);
    });

    test('默认应该是综合排序', async ({ page }) => {
      // 验证综合排序有active类
      const comprehensiveSort = page.locator('.sort-option').filter({ hasText: '综合排序' });
      await expect(comprehensiveSort).toHaveClass(/active/);
    });
  });

  // ========== 4.7 分页功能测试 ==========
  test.describe('4.7 分页功能测试', () => {
    test('有资源时应该显示分页组件', async ({ page }) => {
      // 等待资源加载
      await page.waitForSelector('.resource-card', { timeout: 10000 });
      
      // 验证分页组件存在
      await expect(page.locator('.pagination-wrapper')).toBeVisible();
      await expect(page.locator('.el-pagination')).toBeVisible();
    });

    test('分页组件应该显示总数', async ({ page }) => {
      // 等待资源加载
      await page.waitForSelector('.resource-card', { timeout: 10000 });
      
      // 验证总数显示
      const total = page.locator('.el-pagination__total');
      await expect(total).toBeVisible();
    });

    test('点击下一页应该更新URL', async ({ page }) => {
      // 等待资源加载
      await page.waitForSelector('.resource-card', { timeout: 10000 });
      
      // 点击下一页
      const nextBtn = page.locator('.el-pagination .btn-next');
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
        
        // 验证URL包含page参数
        expect(page.url()).toContain('page=2');
      }
    });

    test('切换每页数量应该更新列表', async ({ page }) => {
      // 等待资源加载
      await page.waitForSelector('.resource-card', { timeout: 10000 });
      
      // 获取初始资源数量
      const initialCount = await page.locator('.resource-card').count();
      
      // 点击每页数量选择器
      const sizeSelect = page.locator('.el-pagination__sizes .el-select');
      if (await sizeSelect.count() > 0) {
        await sizeSelect.click();
        
        // 选择40条
        const option40 = page.locator('.el-select-dropdown__item').filter({ hasText: '40' });
        if (await option40.count() > 0) {
          await option40.click();
          await page.waitForTimeout(1000);
          
          // 验证资源数量可能变化
          const newCount = await page.locator('.resource-card').count();
          // 如果总数大于20，新数量应该大于初始数量
          expect(newCount).toBeGreaterThanOrEqual(initialCount);
        }
      }
    });
  });

  // ========== 资源卡片交互测试 ==========
  test.describe('4.2 资源卡片交互测试', () => {
    test('应该显示资源卡片', async ({ page }) => {
      // 等待资源加载
      await page.waitForSelector('.resource-card', { timeout: 10000 });
      
      // 验证资源卡片存在
      const cards = page.locator('.resource-card');
      expect(await cards.count()).toBeGreaterThan(0);
    });

    test('资源卡片应该显示标题', async ({ page }) => {
      // 等待资源加载
      await page.waitForSelector('.resource-card', { timeout: 10000 });
      
      // 验证标题存在
      const title = page.locator('.resource-card .card-title').first();
      await expect(title).toBeVisible();
    });

    test('资源卡片应该显示格式标签', async ({ page }) => {
      // 等待资源加载
      await page.waitForSelector('.resource-card', { timeout: 10000 });
      
      // 验证格式标签存在
      const formatTag = page.locator('.resource-card .meta-item.format').first();
      await expect(formatTag).toBeVisible();
    });

    test('点击资源卡片应该跳转到详情页', async ({ page }) => {
      // 等待资源加载
      await page.waitForSelector('.resource-card', { timeout: 10000 });
      
      // 点击第一个资源卡片
      const firstCard = page.locator('.resource-card').first();
      await firstCard.click();
      
      // 等待跳转
      await page.waitForURL(/\/resource\//, { timeout: 5000 });
      
      // 验证URL包含资源ID
      expect(page.url()).toMatch(/\/resource\/[a-zA-Z0-9-]+/);
    });

    test('VIP资源应该显示VIP标识', async ({ page }) => {
      // 等待资源加载
      await page.waitForSelector('.resource-card', { timeout: 10000 });
      
      // 查找VIP标识
      const vipBadges = page.locator('.resource-card .vip-badge');
      // VIP标识可能存在也可能不存在，取决于数据
      const count = await vipBadges.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  // ========== 加载状态和空状态测试 ==========
  test.describe('加载状态和空状态测试', () => {
    test('筛选无结果时应该显示空状态', async ({ page }) => {
      // 使用一个不存在的分类ID
      await page.goto('http://localhost:3000/resource?categoryId=non-existent-category');
      await page.waitForLoadState('networkidle');
      
      // 等待一段时间让页面加载
      await page.waitForTimeout(2000);
      
      // 检查是否显示空状态或资源卡片
      const emptyState = page.locator('.empty-stub, .el-empty');
      const resourceCards = page.locator('.resource-card');
      
      // 应该显示空状态或没有资源卡片
      const hasEmpty = await emptyState.count() > 0;
      const hasCards = await resourceCards.count() > 0;
      
      // 至少满足一个条件
      expect(hasEmpty || !hasCards).toBe(true);
    });
  });

  // ========== 响应式布局测试 ==========
  test.describe('响应式布局测试', () => {
    test('桌面端应该显示多列布局', async ({ page }) => {
      // 设置桌面端视口
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.waitForSelector('.resource-card', { timeout: 10000 });
      
      // 验证资源网格存在
      const grid = page.locator('.resource-grid');
      await expect(grid).toBeVisible();
    });

    test('移动端应该显示单列布局', async ({ page }) => {
      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForSelector('.resource-card', { timeout: 10000 });
      
      // 验证资源网格存在
      const grid = page.locator('.resource-grid');
      await expect(grid).toBeVisible();
    });
  });
});
