/**
 * 性能测试脚本
 * 用于自动化测试应用性能指标
 */

import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';

// 测试配置
const TEST_CONFIG = {
  url: 'http://localhost:5173', // 开发服务器地址
  outputDir: './performance-reports',
  tests: {
    desktop: {
      device: 'Desktop',
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    mobile: {
      device: 'Mobile',
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    }
  }
};

// 性能指标阈值
const THRESHOLDS = {
  FP: 1000,    // 白屏时间 < 1s
  FCP: 2000,   // 首屏加载 < 2s
  TTI: 3000,   // 可交互时间 < 3s
  LCP: 2500,   // 最大内容绘制 < 2.5s
  TBT: 300,    // 总阻塞时间 < 300ms
  CLS: 0.1,    // 累积布局偏移 < 0.1
  lighthouse: 90 // Lighthouse评分 > 90
};

/**
 * 运行Lighthouse测试
 */
async function runLighthouse(url, device) {
  console.log(`\n🚀 运行Lighthouse测试 (${device})...`);
  
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu']
  });

  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
    formFactor: device.toLowerCase(),
    screenEmulation: {
      mobile: device === 'Mobile',
      width: device === 'Mobile' ? 375 : 1920,
      height: device === 'Mobile' ? 667 : 1080,
      deviceScaleFactor: device === 'Mobile' ? 2 : 1
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: device === 'Mobile' ? 4 : 1
    }
  };

  const runnerResult = await lighthouse(url, options);
  await chrome.kill();

  const { lhr } = runnerResult;
  
  // 提取关键指标
  const metrics = {
    performance: lhr.categories.performance.score * 100,
    accessibility: lhr.categories.accessibility.score * 100,
    bestPractices: lhr.categories['best-practices'].score * 100,
    seo: lhr.categories.seo.score * 100,
    fcp: lhr.audits['first-contentful-paint'].numericValue,
    lcp: lhr.audits['largest-contentful-paint'].numericValue,
    tti: lhr.audits['interactive'].numericValue,
    tbt: lhr.audits['total-blocking-time'].numericValue,
    cls: lhr.audits['cumulative-layout-shift'].numericValue,
    speedIndex: lhr.audits['speed-index'].numericValue
  };

  return metrics;
}

/**
 * 使用Playwright测试性能
 */
async function runPlaywrightTest(url, deviceConfig) {
  console.log(`\n🎭 运行Playwright性能测试 (${deviceConfig.device})...`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: deviceConfig.viewport,
    userAgent: deviceConfig.userAgent
  });
  
  const page = await context.newPage();
  
  // 收集性能指标
  // const metrics = {};
  
  // 监听性能条目
  await page.addInitScript(() => {
    window.performanceMetrics = {
      fp: null,
      fcp: null,
      lcp: null,
      fid: null,
      cls: 0
    };
    
    // 监听FP和FCP
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-paint') {
          window.performanceMetrics.fp = entry.startTime;
        }
        if (entry.name === 'first-contentful-paint') {
          window.performanceMetrics.fcp = entry.startTime;
        }
      }
    });
    observer.observe({ entryTypes: ['paint'] });
    
    // 监听LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      window.performanceMetrics.lcp = lastEntry.startTime;
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // 监听CLS
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          window.performanceMetrics.cls = clsValue;
        }
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  });
  
  // 导航到页面
  const startTime = Date.now();
  await page.goto(url, { waitUntil: 'networkidle' });
  const loadTime = Date.now() - startTime;
  
  // 等待页面稳定
  await page.waitForTimeout(2000);
  
  // 获取性能指标
  const performanceMetrics = await page.evaluate(() => window.performanceMetrics);
  
  // 获取导航时间
  const navigationTiming = await page.evaluate(() => {
    const timing = performance.timing;
    return {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      dom: timing.domComplete - timing.domLoading,
      load: timing.loadEventEnd - timing.loadEventStart
    };
  });
  
  await browser.close();
  
  return {
    ...performanceMetrics,
    loadTime,
    navigationTiming
  };
}

/**
 * 测试长列表渲染性能
 */
async function testLongListPerformance(url) {
  console.log('\n📋 测试长列表渲染性能...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 导航到资源列表页
  await page.goto(`${url}/resource/list`);
  await page.waitForSelector('.resource-card', { timeout: 10000 });
  
  // 测试滚动性能
  const scrollMetrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      const container = document.querySelector('.resource-list') || document.documentElement;
      const frameRates = [];
      let lastTime = performance.now();
      let frameCount = 0;
      
      const measureFPS = () => {
        const currentTime = performance.now();
        const delta = currentTime - lastTime;
        
        if (delta >= 1000) {
          const fps = Math.round((frameCount * 1000) / delta);
          frameRates.push(fps);
          frameCount = 0;
          lastTime = currentTime;
        }
        
        frameCount++;
        
        if (frameRates.length < 5) {
          requestAnimationFrame(measureFPS);
        } else {
          const avgFPS = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
          const minFPS = Math.min(...frameRates);
          resolve({ avgFPS, minFPS, frameRates });
        }
      };
      
      // 开始滚动
      let scrollTop = 0;
      const scrollInterval = setInterval(() => {
        scrollTop += 100;
        container.scrollTop = scrollTop;
        
        if (scrollTop >= 2000) {
          clearInterval(scrollInterval);
        }
      }, 16);
      
      requestAnimationFrame(measureFPS);
    });
  });
  
  await browser.close();
  
  return scrollMetrics;
}

/**
 * 生成测试报告
 */
function generateReport(results) {
  console.log('\n📊 生成测试报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      desktop: {
        passed: true,
        issues: []
      },
      mobile: {
        passed: true,
        issues: []
      }
    },
    results
  };
  
  // 检查桌面端指标
  const desktop = results.desktop;
  if (desktop.playwright.fcp > THRESHOLDS.FCP) {
    report.summary.desktop.passed = false;
    report.summary.desktop.issues.push(`FCP超出阈值: ${desktop.playwright.fcp}ms > ${THRESHOLDS.FCP}ms`);
  }
  if (desktop.lighthouse.performance < THRESHOLDS.lighthouse) {
    report.summary.desktop.passed = false;
    report.summary.desktop.issues.push(`Lighthouse评分低于阈值: ${desktop.lighthouse.performance} < ${THRESHOLDS.lighthouse}`);
  }
  
  // 检查移动端指标
  const mobile = results.mobile;
  if (mobile.playwright.fcp > THRESHOLDS.FCP) {
    report.summary.mobile.passed = false;
    report.summary.mobile.issues.push(`FCP超出阈值: ${mobile.playwright.fcp}ms > ${THRESHOLDS.FCP}ms`);
  }
  if (mobile.lighthouse.performance < THRESHOLDS.lighthouse) {
    report.summary.mobile.passed = false;
    report.summary.mobile.issues.push(`Lighthouse评分低于阈值: ${mobile.lighthouse.performance} < ${THRESHOLDS.lighthouse}`);
  }
  
  // 保存报告
  const outputPath = path.join(TEST_CONFIG.outputDir, `performance-report-${Date.now()}.json`);
  fs.mkdirSync(TEST_CONFIG.outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  
  console.log(`\n✅ 报告已保存: ${outputPath}`);
  
  return report;
}

/**
 * 打印测试结果
 */
function printResults(report) {
  console.log('\n' + '='.repeat(60));
  console.log('性能测试结果');
  console.log('='.repeat(60));
  
  // 桌面端结果
  console.log('\n📱 桌面端:');
  console.log(`  状态: ${report.summary.desktop.passed ? '✅ 通过' : '❌ 未通过'}`);
  if (report.summary.desktop.issues.length > 0) {
    console.log('  问题:');
    report.summary.desktop.issues.forEach(issue => console.log(`    - ${issue}`));
  }
  
  const desktop = report.results.desktop;
  console.log('\n  Lighthouse评分:');
  console.log(`    Performance: ${desktop.lighthouse.performance.toFixed(0)} ${desktop.lighthouse.performance >= THRESHOLDS.lighthouse ? '✅' : '❌'}`);
  console.log(`    Accessibility: ${desktop.lighthouse.accessibility.toFixed(0)}`);
  console.log(`    Best Practices: ${desktop.lighthouse.bestPractices.toFixed(0)}`);
  console.log(`    SEO: ${desktop.lighthouse.seo.toFixed(0)}`);
  
  console.log('\n  核心指标:');
  console.log(`    FP: ${desktop.playwright.fp?.toFixed(0) || 'N/A'}ms ${(desktop.playwright.fp || 0) < THRESHOLDS.FP ? '✅' : '❌'}`);
  console.log(`    FCP: ${desktop.playwright.fcp?.toFixed(0) || 'N/A'}ms ${(desktop.playwright.fcp || 0) < THRESHOLDS.FCP ? '✅' : '❌'}`);
  console.log(`    LCP: ${desktop.lighthouse.lcp?.toFixed(0) || 'N/A'}ms ${(desktop.lighthouse.lcp || 0) < THRESHOLDS.LCP ? '✅' : '❌'}`);
  console.log(`    TTI: ${desktop.lighthouse.tti?.toFixed(0) || 'N/A'}ms ${(desktop.lighthouse.tti || 0) < THRESHOLDS.TTI ? '✅' : '❌'}`);
  console.log(`    TBT: ${desktop.lighthouse.tbt?.toFixed(0) || 'N/A'}ms ${(desktop.lighthouse.tbt || 0) < THRESHOLDS.TBT ? '✅' : '❌'}`);
  console.log(`    CLS: ${desktop.lighthouse.cls?.toFixed(3) || 'N/A'} ${(desktop.lighthouse.cls || 0) < THRESHOLDS.CLS ? '✅' : '❌'}`);
  
  // 移动端结果
  console.log('\n📱 移动端:');
  console.log(`  状态: ${report.summary.mobile.passed ? '✅ 通过' : '❌ 未通过'}`);
  if (report.summary.mobile.issues.length > 0) {
    console.log('  问题:');
    report.summary.mobile.issues.forEach(issue => console.log(`    - ${issue}`));
  }
  
  const mobile = report.results.mobile;
  console.log('\n  Lighthouse评分:');
  console.log(`    Performance: ${mobile.lighthouse.performance.toFixed(0)} ${mobile.lighthouse.performance >= THRESHOLDS.lighthouse ? '✅' : '❌'}`);
  console.log(`    Accessibility: ${mobile.lighthouse.accessibility.toFixed(0)}`);
  console.log(`    Best Practices: ${mobile.lighthouse.bestPractices.toFixed(0)}`);
  console.log(`    SEO: ${mobile.lighthouse.seo.toFixed(0)}`);
  
  console.log('\n  核心指标:');
  console.log(`    FP: ${mobile.playwright.fp?.toFixed(0) || 'N/A'}ms ${(mobile.playwright.fp || 0) < THRESHOLDS.FP ? '✅' : '❌'}`);
  console.log(`    FCP: ${mobile.playwright.fcp?.toFixed(0) || 'N/A'}ms ${(mobile.playwright.fcp || 0) < THRESHOLDS.FCP ? '✅' : '❌'}`);
  console.log(`    LCP: ${mobile.lighthouse.lcp?.toFixed(0) || 'N/A'}ms ${(mobile.lighthouse.lcp || 0) < THRESHOLDS.LCP ? '✅' : '❌'}`);
  console.log(`    TTI: ${mobile.lighthouse.tti?.toFixed(0) || 'N/A'}ms ${(mobile.lighthouse.tti || 0) < THRESHOLDS.TTI ? '✅' : '❌'}`);
  console.log(`    TBT: ${mobile.lighthouse.tbt?.toFixed(0) || 'N/A'}ms ${(mobile.lighthouse.tbt || 0) < THRESHOLDS.TBT ? '✅' : '❌'}`);
  console.log(`    CLS: ${mobile.lighthouse.cls?.toFixed(3) || 'N/A'} ${(mobile.lighthouse.cls || 0) < THRESHOLDS.CLS ? '✅' : '❌'}`);
  
  // 长列表性能
  if (report.results.longList) {
    console.log('\n📋 长列表渲染性能:');
    console.log(`  平均帧率: ${report.results.longList.avgFPS.toFixed(1)} FPS ${report.results.longList.avgFPS >= 55 ? '✅' : '❌'}`);
    console.log(`  最低帧率: ${report.results.longList.minFPS} FPS ${report.results.longList.minFPS >= 50 ? '✅' : '❌'}`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // 总结
  const allPassed = report.summary.desktop.passed && report.summary.mobile.passed;
  console.log(`\n${allPassed ? '✅ 所有测试通过！' : '❌ 部分测试未通过，请查看上述问题'}`);
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始性能测试...');
  console.log(`测试URL: ${TEST_CONFIG.url}`);
  
  try {
    const results = {
      desktop: {},
      mobile: {},
      longList: null
    };
    
    // 测试桌面端
    results.desktop.lighthouse = await runLighthouse(TEST_CONFIG.url, 'Desktop');
    results.desktop.playwright = await runPlaywrightTest(TEST_CONFIG.url, TEST_CONFIG.tests.desktop);
    
    // 测试移动端
    results.mobile.lighthouse = await runLighthouse(TEST_CONFIG.url, 'Mobile');
    results.mobile.playwright = await runPlaywrightTest(TEST_CONFIG.url, TEST_CONFIG.tests.mobile);
    
    // 测试长列表性能
    try {
      results.longList = await testLongListPerformance(TEST_CONFIG.url);
    } catch (error) {
      console.warn('⚠️  长列表测试失败:', error.message);
    }
    
    // 生成报告
    const report = generateReport(results);
    
    // 打印结果
    printResults(report);
    
    // 退出码
    const exitCode = report.summary.desktop.passed && report.summary.mobile.passed ? 0 : 1;
    process.exit(exitCode);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
main();
