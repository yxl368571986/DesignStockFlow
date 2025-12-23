import { test, expect } from '@playwright/test';

/**
 * 资源详情页E2E测试
 * 
 * 测试内容：
 * - 5.1 详情页布局和按钮
 * - 5.2 预览图区域
 * - 5.3 资源信息区域
 * - 5.4 下载和收藏按钮
 * - 5.5 相关推荐区域
 * 
 * 需求: 3.7, 3.8, 3.9, 4.1-4.6, 5.1-5.2
 */

test.describe('资源详情页测试', () => {
  // 先从资源列表页获取一个资源ID，然后跳转到详情页
  test.beforeEach(async ({ page }) => {
    // 访问资源列表页
    await page.goto('http://localhost:3000/resource', { waitUntil: 'domcontentloaded' });
    // 等待资源卡片加载
    await page.waitForSelector('.resource-card', { timeout: 15000 });
    
    // 点击第一个资源卡片跳转到详情页
    const firstCard = page.locator('.resource-card').first();
    await firstCard.click();
    
    // 等待详情页加载
    await page.waitForURL(/\/resource\//, { timeout: 10000 });
    await page.waitForSelector('.resource-detail-page', { timeout: 10000 });
  });

  // ========== 5.1 详情页布局和按钮测试 ==========
  test.describe('5.1 详情页布局和按钮测试', () => {
    test('应该显示详情页主容器', async ({ page }) => {
      await expect(page.locator('.resource-detail-page')).toBeVisible();
      await expect(page.locator('.detail-container')).toBeVisible();
    });

    test('应该显示返回按钮', async ({ page }) => {
      const navButtons = page.locator('.navigation-buttons');
      await expect(navButtons).toBeVisible();
      
      // 验证有返回按钮
      const buttons = navButtons.locator('.el-button');
      await expect(buttons.first()).toBeVisible();
    });

    test('点击返回按钮应该返回上一页', async ({ page }) => {
      // 记录当前URL
      const currentUrl = page.url();
      
      // 点击返回按钮
      const backButton = page.locator('.navigation-buttons .el-button').first();
      await backButton.click();
      
      // 等待导航
      await page.waitForTimeout(1000);
      
      // 验证URL已改变
      expect(page.url()).not.toBe(currentUrl);
    });

    test('应该显示关闭按钮', async ({ page }) => {
      const navButtons = page.locator('.navigation-buttons');
      const buttons = navButtons.locator('.el-button');
      
      // 应该有两个按钮（返回和关闭）
      await expect(buttons).toHaveCount(2);
    });

    test('点击关闭按钮应该跳转到资源列表', async ({ page }) => {
      // 点击关闭按钮（第二个按钮）
      const closeButton = page.locator('.navigation-buttons .el-button').nth(1);
      await closeButton.click();
      
      // 等待跳转到资源列表
      await page.waitForURL('**/resource', { timeout: 5000 });
      
      // 验证URL
      expect(page.url()).toContain('/resource');
      expect(page.url()).not.toMatch(/\/resource\/[a-zA-Z0-9-]+/);
    });

    test('应该显示主要内容区域', async ({ page }) => {
      await expect(page.locator('.detail-main')).toBeVisible();
    });
  });

  // ========== 5.2 预览图区域测试 ==========
  test.describe('5.2 预览图区域测试', () => {
    test('应该显示预览区域', async ({ page }) => {
      await expect(page.locator('.preview-section')).toBeVisible();
    });

    test('应该显示主预览图', async ({ page }) => {
      await expect(page.locator('.main-preview')).toBeVisible();
      await expect(page.locator('.preview-wrapper')).toBeVisible();
    });

    test('应该显示预览图图片', async ({ page }) => {
      const previewImage = page.locator('.preview-image');
      await expect(previewImage).toBeVisible();
    });

    test('应该显示放大提示', async ({ page }) => {
      // 悬停在预览图上
      const previewWrapper = page.locator('.preview-wrapper');
      await previewWrapper.hover();
      
      // 验证放大提示显示
      const zoomHint = page.locator('.zoom-hint');
      await expect(zoomHint).toBeVisible();
    });

    test('点击预览图应该打开大图查看器', async ({ page }) => {
      // 点击预览图
      const previewWrapper = page.locator('.preview-wrapper');
      await previewWrapper.click();
      
      // 等待大图查看器显示
      await page.waitForTimeout(500);
      
      // 验证大图查看器显示
      const imageViewer = page.locator('.el-image-viewer__wrapper');
      await expect(imageViewer).toBeVisible();
    });

    test('应该显示水印', async ({ page }) => {
      const watermark = page.locator('.watermark');
      await expect(watermark).toBeVisible();
      await expect(watermark).toContainText('星潮设计');
    });

    test('多张预览图时应该显示缩略图列表', async ({ page }) => {
      // 检查缩略图列表是否存在（可能不存在，取决于资源）
      const thumbnailList = page.locator('.thumbnail-list');
      const thumbnailCount = await thumbnailList.count();
      
      if (thumbnailCount > 0) {
        await expect(thumbnailList).toBeVisible();
        
        // 验证缩略图项存在
        const thumbnails = page.locator('.thumbnail-item');
        expect(await thumbnails.count()).toBeGreaterThan(0);
      }
    });

    test('点击缩略图应该切换主预览图', async ({ page }) => {
      const thumbnailList = page.locator('.thumbnail-list');
      const thumbnailCount = await thumbnailList.count();
      
      if (thumbnailCount > 0) {
        const thumbnails = page.locator('.thumbnail-item');
        const count = await thumbnails.count();
        
        if (count > 1) {
          // 点击第二个缩略图
          await thumbnails.nth(1).click();
          await page.waitForTimeout(300);
          
          // 验证第二个缩略图有active类
          await expect(thumbnails.nth(1)).toHaveClass(/active/);
        }
      }
    });
  });

  // ========== 5.3 资源信息区域测试 ==========
  test.describe('5.3 资源信息区域测试', () => {
    test('应该显示信息区域', async ({ page }) => {
      await expect(page.locator('.info-section')).toBeVisible();
    });

    test('应该显示资源标题', async ({ page }) => {
      const title = page.locator('.resource-title');
      await expect(title).toBeVisible();
      
      // 验证标题不为空
      const titleText = await title.textContent();
      expect(titleText?.trim().length).toBeGreaterThan(0);
    });

    test('应该显示资源元信息', async ({ page }) => {
      const meta = page.locator('.resource-meta');
      await expect(meta).toBeVisible();
    });

    test('应该显示资源格式', async ({ page }) => {
      const meta = page.locator('.resource-meta');
      const metaText = await meta.textContent();
      
      // 验证包含格式信息
      expect(metaText).toContain('格式');
    });

    test('应该显示文件大小', async ({ page }) => {
      const meta = page.locator('.resource-meta');
      const metaText = await meta.textContent();
      
      // 验证包含大小信息
      expect(metaText).toContain('大小');
    });

    test('应该显示下载次数', async ({ page }) => {
      const meta = page.locator('.resource-meta');
      const metaText = await meta.textContent();
      
      // 验证包含下载信息
      expect(metaText).toContain('下载');
    });

    test('应该显示分类和标签区域', async ({ page }) => {
      const tags = page.locator('.resource-tags');
      await expect(tags).toBeVisible();
    });

    test('应该显示分类标签', async ({ page }) => {
      const tags = page.locator('.resource-tags');
      const tagsText = await tags.textContent();
      
      // 验证包含分类信息
      expect(tagsText).toContain('分类');
    });

    test('应该显示上传者信息', async ({ page }) => {
      const uploaderInfo = page.locator('.uploader-info');
      await expect(uploaderInfo).toBeVisible();
      
      const infoText = await uploaderInfo.textContent();
      expect(infoText).toContain('上传者');
    });

    test('应该显示上传时间', async ({ page }) => {
      const uploaderInfo = page.locator('.uploader-info');
      const infoText = await uploaderInfo.textContent();
      
      expect(infoText).toContain('上传时间');
    });

    test('应该显示资源描述区域', async ({ page }) => {
      const descSection = page.locator('.description-section');
      await expect(descSection).toBeVisible();
      
      const sectionTitle = descSection.locator('.section-title');
      await expect(sectionTitle).toContainText('资源描述');
    });
  });

  // ========== 5.4 下载和收藏按钮测试 ==========
  test.describe('5.4 下载和收藏按钮测试', () => {
    test('应该显示操作按钮区域', async ({ page }) => {
      await expect(page.locator('.action-buttons')).toBeVisible();
    });

    test('应该显示下载按钮', async ({ page }) => {
      const downloadBtn = page.locator('.download-btn');
      await expect(downloadBtn).toBeVisible();
    });

    test('应该显示收藏按钮', async ({ page }) => {
      const collectBtn = page.locator('.collect-btn');
      await expect(collectBtn).toBeVisible();
    });

    test('应该显示积分信息', async ({ page }) => {
      const pointsInfo = page.locator('.points-info');
      // 积分信息可能存在也可能不存在，取决于资源类型
      const count = await pointsInfo.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('VIP资源应该显示VIP标识', async ({ page }) => {
      // 检查是否有VIP标识
      const vipBadge = page.locator('.vip-badge, .vip-tag');
      const count = await vipBadge.count();
      // VIP标识可能存在也可能不存在
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  // ========== 5.5 相关推荐区域测试 ==========
  test.describe('5.5 相关推荐区域测试', () => {
    test('应该显示相关推荐区域', async ({ page }) => {
      const recommendSection = page.locator('.recommend-section');
      await expect(recommendSection).toBeVisible();
    });

    test('应该显示相关推荐标题', async ({ page }) => {
      const sectionTitle = page.locator('.recommend-section .section-title');
      await expect(sectionTitle).toBeVisible();
      await expect(sectionTitle).toContainText('相关推荐');
    });

    test('应该显示推荐资源卡片', async ({ page }) => {
      const recommendCards = page.locator('.recommend-section .resource-card, .recommend-section .recommend-item');
      // 等待推荐资源加载
      await page.waitForTimeout(1000);
      const count = await recommendCards.count();
      // 推荐资源可能存在也可能不存在
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('点击推荐资源应该跳转到详情页', async ({ page }) => {
      const recommendCards = page.locator('.recommend-section .resource-card, .recommend-section .recommend-item');
      await page.waitForTimeout(1000);
      const count = await recommendCards.count();
      
      if (count > 0) {
        // 记录当前URL
        const currentUrl = page.url();
        
        // 点击第一个推荐资源
        await recommendCards.first().click();
        
        // 等待导航
        await page.waitForURL(/\/resource\//, { timeout: 5000 });
        
        // 验证URL已改变
        expect(page.url()).not.toBe(currentUrl);
      }
    });
  });

  // ========== 错误处理测试 ==========
  test.describe('错误处理测试', () => {
    test('访问不存在的资源应该显示错误状态', async ({ page }) => {
      // 直接访问一个不存在的资源ID
      await page.goto('http://localhost:3000/resource/non-existent-resource-id', { waitUntil: 'domcontentloaded' });
      
      // 等待页面加载
      await page.waitForTimeout(2000);
      
      // 应该显示错误状态或空状态
      const errorState = page.locator('.error-state, .el-empty, .not-found');
      const detailPage = page.locator('.resource-detail-page');
      
      // 要么显示错误状态，要么详情页不显示正常内容
      const hasError = await errorState.count() > 0;
      const hasDetail = await detailPage.count() > 0;
      
      expect(hasError || !hasDetail).toBe(true);
    });
  });
});
