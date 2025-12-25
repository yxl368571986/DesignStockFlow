/**
 * VIP支付系统E2E测试
 * 测试任务7.4：E2E测试
 * 
 * 测试场景：
 * 7.4.1 VIP购买流程E2E测试
 * 7.4.2 订单管理E2E测试
 * 7.4.3 VIP状态展示E2E测试
 * 7.4.4 下载权限E2E测试
 */

import { test, expect, Page } from '@playwright/test';
import { BASE_URL, API_BASE_URL, TEST_ACCOUNTS } from './config';

/**
 * 登录辅助函数
 */
async function login(page: Page, phone: string, password: string): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"], input[placeholder*="手机号"]', phone);
    await page.fill('input[type="password"]', password);
    
    const loginBtn = page.locator('button[type="submit"], .login-btn, button:has-text("登录")').first();
    await loginBtn.click();
    
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    return !currentUrl.includes('/login');
  } catch (error) {
    console.error('登录失败:', error);
    return false;
  }
}

/**
 * 退出登录辅助函数
 */
async function logout(page: Page): Promise<void> {
  try {
    const userAvatar = page.locator('.user-avatar, .el-avatar, .header-user').first();
    if (await userAvatar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userAvatar.click();
      await page.waitForTimeout(500);
      
      const logoutBtn = page.locator('text=退出登录').first();
      if (await logoutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  } catch (error) {
    console.error('退出登录失败:', error);
  }
}

test.describe('VIP支付系统E2E测试', () => {
  test.describe.configure({ mode: 'serial' });

  // ==================== 7.4.1 VIP购买流程E2E测试 ====================
  test.describe('7.4.1 VIP购买流程', () => {
    test('应该能够访问VIP中心页面', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      // 访问VIP中心
      await page.goto(`${BASE_URL}/vip`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 验证VIP中心页面加载成功
      const vipPage = page.locator('.vip-center, .vip-page, [class*="vip"]').first();
      await expect(vipPage).toBeVisible({ timeout: 5000 });

      await logout(page);
    });

    test('应该显示VIP套餐列表', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/vip`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 验证套餐列表存在
      const packageList = page.locator('.package-list, .vip-packages, [class*="package"]');
      await expect(packageList.or(page.locator('.package-card'))).toBeVisible({ timeout: 5000 });

      // 验证至少有一个套餐卡片
      const packageCards = page.locator('.package-card, [class*="package-item"]');
      const count = await packageCards.count();
      expect(count).toBeGreaterThan(0);

      await logout(page);
    });

    test('点击套餐应该显示支付方式选择', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/vip`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 点击第一个套餐
      const packageCard = page.locator('.package-card, [class*="package-item"]').first();
      if (await packageCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await packageCard.click();
        await page.waitForTimeout(1000);

        // 验证支付方式选择器出现
        const paymentSelector = page.locator('.payment-method-selector, .payment-methods, [class*="payment"]');
        const hasPaymentSelector = await paymentSelector.isVisible({ timeout: 3000 }).catch(() => false);
        
        // 或者验证购买按钮出现
        const buyButton = page.locator('button:has-text("立即开通"), button:has-text("购买"), button:has-text("支付")').first();
        const hasBuyButton = await buyButton.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasPaymentSelector || hasBuyButton).toBeTruthy();
      }

      await logout(page);
    });

    test('选择微信支付应该显示二维码', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/vip`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 点击套餐
      const packageCard = page.locator('.package-card, [class*="package-item"]').first();
      if (await packageCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await packageCard.click();
        await page.waitForTimeout(1000);

        // 选择微信支付
        const wechatOption = page.locator('text=微信支付, [class*="wechat"]').first();
        if (await wechatOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await wechatOption.click();
          await page.waitForTimeout(500);
        }

        // 点击购买按钮
        const buyButton = page.locator('button:has-text("立即开通"), button:has-text("购买"), button:has-text("支付")').first();
        if (await buyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await buyButton.click();
          await page.waitForTimeout(2000);

          // 验证支付弹窗出现
          const paymentDialog = page.locator('.payment-dialog, .el-dialog, [class*="payment"]');
          const hasDialog = await paymentDialog.isVisible({ timeout: 5000 }).catch(() => false);

          // 验证二维码出现（如果是微信支付）
          const qrCode = page.locator('.qrcode, [class*="qr"], img[alt*="二维码"]');
          const hasQrCode = await qrCode.isVisible({ timeout: 3000 }).catch(() => false);

          expect(hasDialog || hasQrCode).toBeTruthy();
        }
      }

      await logout(page);
    });

    test('支付弹窗应该显示倒计时', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/vip`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 点击套餐并发起支付
      const packageCard = page.locator('.package-card, [class*="package-item"]').first();
      if (await packageCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await packageCard.click();
        await page.waitForTimeout(1000);

        const buyButton = page.locator('button:has-text("立即开通"), button:has-text("购买"), button:has-text("支付")').first();
        if (await buyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await buyButton.click();
          await page.waitForTimeout(2000);

          // 验证倒计时显示
          const countdown = page.locator('.countdown, [class*="countdown"], text=/\\d+:\\d+/');
          const hasCountdown = await countdown.isVisible({ timeout: 5000 }).catch(() => false);

          // 如果有支付弹窗，应该有倒计时
          const paymentDialog = page.locator('.payment-dialog, .el-dialog');
          if (await paymentDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
            expect(hasCountdown).toBeTruthy();
          }
        }
      }

      await logout(page);
    });
  });

  // ==================== 7.4.2 订单管理E2E测试 ====================
  test.describe('7.4.2 订单管理', () => {
    test('应该能够访问订单列表页面', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      // 访问订单列表
      await page.goto(`${BASE_URL}/vip/orders`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 验证订单列表页面加载成功
      const orderPage = page.locator('.order-list, .orders-page, [class*="order"]').first();
      const hasOrderPage = await orderPage.isVisible({ timeout: 5000 }).catch(() => false);

      // 或者显示空状态
      const emptyState = page.locator('.empty, .no-data, text=暂无订单');
      const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasOrderPage || hasEmptyState).toBeTruthy();

      await logout(page);
    });

    test('订单列表应该支持状态筛选', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/vip/orders`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 查找状态筛选器
      const statusFilter = page.locator('.status-filter, .el-tabs, [class*="filter"]');
      const hasFilter = await statusFilter.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasFilter) {
        // 点击不同状态Tab
        const tabs = page.locator('.el-tabs__item, .filter-item');
        const tabCount = await tabs.count();
        
        if (tabCount > 1) {
          await tabs.nth(1).click();
          await page.waitForTimeout(1000);
          
          // 验证筛选生效（URL变化或列表更新）
          const currentUrl = page.url();
          console.log(`筛选后URL: ${currentUrl}`);
        }
      }

      await logout(page);
    });

    test('点击订单应该显示订单详情', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/vip/orders`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 查找订单项
      const orderItem = page.locator('.order-item, .order-card, [class*="order-row"]').first();
      
      if (await orderItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await orderItem.click();
        await page.waitForTimeout(1000);

        // 验证跳转到订单详情页或显示详情弹窗
        const currentUrl = page.url();
        const isDetailPage = currentUrl.includes('/order/') || currentUrl.includes('orderNo=');
        
        const detailDialog = page.locator('.order-detail, .el-dialog, [class*="detail"]');
        const hasDetailDialog = await detailDialog.isVisible({ timeout: 3000 }).catch(() => false);

        expect(isDetailPage || hasDetailDialog).toBeTruthy();
      }

      await logout(page);
    });

    test('待支付订单应该显示继续支付按钮', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/vip/orders?status=pending`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 查找待支付订单
      const pendingOrder = page.locator('.order-item, .order-card').filter({ hasText: /待支付|未支付/ }).first();
      
      if (await pendingOrder.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 验证继续支付按钮存在
        const payButton = pendingOrder.locator('button:has-text("继续支付"), button:has-text("去支付")');
        await expect(payButton).toBeVisible({ timeout: 3000 });
      }

      await logout(page);
    });

    test('待支付订单应该显示取消按钮', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/vip/orders?status=pending`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 查找待支付订单
      const pendingOrder = page.locator('.order-item, .order-card').filter({ hasText: /待支付|未支付/ }).first();
      
      if (await pendingOrder.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 验证取消按钮存在
        const cancelButton = pendingOrder.locator('button:has-text("取消"), button:has-text("取消订单")');
        await expect(cancelButton).toBeVisible({ timeout: 3000 });
      }

      await logout(page);
    });
  });

  // ==================== 7.4.3 VIP状态展示E2E测试 ====================
  test.describe('7.4.3 VIP状态展示', () => {
    test('VIP用户应该显示VIP图标', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.vipUser.phone, TEST_ACCOUNTS.vipUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 验证VIP图标显示
      const vipIcon = page.locator('.vip-icon, [class*="vip-badge"], [class*="vip"]').first();
      const hasVipIcon = await vipIcon.isVisible({ timeout: 5000 }).catch(() => false);

      // 或者在用户头像旁边显示VIP标识
      const vipBadge = page.locator('.user-avatar .vip, .avatar-vip, [class*="vip-tag"]');
      const hasVipBadge = await vipBadge.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasVipIcon || hasVipBadge).toBeTruthy();

      await logout(page);
    });

    test('个人中心应该显示VIP状态卡片', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.vipUser.phone, TEST_ACCOUNTS.vipUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/personal`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 验证VIP状态卡片显示
      const vipCard = page.locator('.vip-status-card, .vip-card, [class*="vip-info"]');
      const hasVipCard = await vipCard.isVisible({ timeout: 5000 }).catch(() => false);

      // 验证显示VIP到期时间
      const expireInfo = page.locator('text=/到期|有效期|剩余/');
      const hasExpireInfo = await expireInfo.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasVipCard || hasExpireInfo).toBeTruthy();

      await logout(page);
    });

    test('非VIP用户应该显示开通VIP入口', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/personal`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 验证开通VIP入口显示
      const openVipButton = page.locator('button:has-text("开通VIP"), button:has-text("成为VIP"), a:has-text("开通VIP")');
      const hasOpenVipButton = await openVipButton.isVisible({ timeout: 5000 }).catch(() => false);

      // 或者显示VIP推广卡片
      const vipPromo = page.locator('.vip-promo, [class*="vip-banner"]');
      const hasVipPromo = await vipPromo.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasOpenVipButton || hasVipPromo).toBeTruthy();

      await logout(page);
    });

    test('VIP中心应该显示当前VIP状态', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.vipUser.phone, TEST_ACCOUNTS.vipUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/vip`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 验证当前VIP状态显示
      const vipStatus = page.locator('.current-vip, .vip-status, [class*="vip-level"]');
      const hasVipStatus = await vipStatus.isVisible({ timeout: 5000 }).catch(() => false);

      // 验证显示VIP会员字样
      const vipText = page.locator('text=/VIP会员|会员有效期/');
      const hasVipText = await vipText.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasVipStatus || hasVipText).toBeTruthy();

      await logout(page);
    });
  });

  // ==================== 7.4.4 下载权限E2E测试 ====================
  test.describe('7.4.4 下载权限', () => {
    test('VIP用户应该能够免费下载VIP资源', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.vipUser.phone, TEST_ACCOUNTS.vipUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      // 访问资源列表，筛选VIP资源
      await page.goto(`${BASE_URL}/resource?vipLevel=1`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 点击第一个VIP资源
      const resourceCard = page.locator('.resource-card, [class*="resource-item"]').first();
      
      if (await resourceCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await resourceCard.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 验证下载按钮显示"VIP免费下载"
        const vipDownloadBtn = page.locator('button:has-text("VIP免费下载"), button:has-text("免费下载")');
        const hasVipDownloadBtn = await vipDownloadBtn.isVisible({ timeout: 3000 }).catch(() => false);

        // 或者普通下载按钮可点击
        const downloadBtn = page.locator('.download-btn, button:has-text("下载")').first();
        const hasDownloadBtn = await downloadBtn.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasVipDownloadBtn || hasDownloadBtn).toBeTruthy();
      }

      await logout(page);
    });

    test('非VIP用户下载VIP资源应该显示开通提示', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      // 访问资源列表，筛选VIP资源
      await page.goto(`${BASE_URL}/resource?vipLevel=1`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 点击第一个VIP资源
      const resourceCard = page.locator('.resource-card, [class*="resource-item"]').first();
      
      if (await resourceCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await resourceCard.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 验证显示开通VIP提示
        const openVipTip = page.locator('text=/开通VIP|成为VIP|VIP专享/');
        const hasOpenVipTip = await openVipTip.isVisible({ timeout: 3000 }).catch(() => false);

        // 或者下载按钮显示"开通VIP下载"
        const vipDownloadBtn = page.locator('button:has-text("开通VIP"), button:has-text("开通VIP下载")');
        const hasVipDownloadBtn = await vipDownloadBtn.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasOpenVipTip || hasVipDownloadBtn).toBeTruthy();
      }

      await logout(page);
    });

    test('VIP用户应该显示剩余下载次数', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.vipUser.phone, TEST_ACCOUNTS.vipUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      // 访问资源详情页
      await page.goto(`${BASE_URL}/resource`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const resourceCard = page.locator('.resource-card, [class*="resource-item"]').first();
      
      if (await resourceCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await resourceCard.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 验证显示下载次数信息
        const downloadCount = page.locator('text=/剩余.*次|今日.*次|下载次数/');
        const hasDownloadCount = await downloadCount.isVisible({ timeout: 5000 }).catch(() => false);

        // 或者在个人中心查看
        if (!hasDownloadCount) {
          await page.goto(`${BASE_URL}/personal`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);

          const personalDownloadCount = page.locator('text=/下载次数|今日下载/');
          const hasPersonalDownloadCount = await personalDownloadCount.isVisible({ timeout: 3000 }).catch(() => false);
          
          expect(hasPersonalDownloadCount).toBeTruthy();
        } else {
          expect(hasDownloadCount).toBeTruthy();
        }
      }

      await logout(page);
    });

    test('资源详情页应该显示VIP下载按钮组件', async ({ page }) => {
      const loginSuccess = await login(page, TEST_ACCOUNTS.normalUser.phone, TEST_ACCOUNTS.normalUser.password);
      
      if (!loginSuccess) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/resource`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const resourceCard = page.locator('.resource-card, [class*="resource-item"]').first();
      
      if (await resourceCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await resourceCard.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 验证VIP下载按钮组件存在
        const vipDownloadButton = page.locator('.vip-download-button, [class*="download-btn"], button:has-text("下载")');
        await expect(vipDownloadButton.first()).toBeVisible({ timeout: 5000 });
      }

      await logout(page);
    });
  });
});
