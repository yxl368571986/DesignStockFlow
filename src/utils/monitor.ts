/**
 * 前端性能监控和错误追踪模块
 * 
 * 功能：
 * 1. 性能指标监控（FCP、LCP、FID、CLS、TTFB）
 * 2. 错误追踪（JavaScript错误、Promise拒绝、资源加载错误）
 * 3. 用户行为追踪（页面访问、点击事件）
 * 4. 日志上报
 */

import type { PerformanceMetrics, ErrorLog, UserAction } from '@/types/monitor';

/**
 * 监控配置
 */
interface MonitorConfig {
  /** 是否启用监控 */
  enabled: boolean;
  /** 日志上报接口 */
  reportUrl: string;
  /** 采样率（0-1） */
  sampleRate: number;
  /** 是否在开发环境启用 */
  enableInDev: boolean;
  /** 批量上报间隔（毫秒） */
  batchInterval: number;
  /** 最大批量大小 */
  maxBatchSize: number;
}

/**
 * 默认配置
 */
const defaultConfig: MonitorConfig = {
  enabled: true,
  reportUrl: '/api/monitor/report',
  sampleRate: 1.0, // 100%采样
  enableInDev: false,
  batchInterval: 5000, // 5秒
  maxBatchSize: 10
};

/**
 * 监控管理器
 */
class Monitor {
  private config: MonitorConfig;
  private logQueue: Array<ErrorLog | PerformanceMetrics | UserAction> = [];
  private batchTimer: number | null = null;
  private sessionId: string;

  constructor(config: Partial<MonitorConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.generateSessionId();
  }

  /**
   * 初始化监控
   */
  init(): void {
    // 检查是否启用
    if (!this.shouldEnable()) {
      console.log('[Monitor] 监控已禁用');
      return;
    }

    console.log('[Monitor] 初始化监控系统');

    // 监听性能指标
    this.observePerformance();

    // 监听错误
    this.observeErrors();

    // 监听页面可见性变化
    this.observeVisibility();

    // 监听页面卸载
    this.observeUnload();

    // 启动批量上报定时器
    this.startBatchReporting();
  }

  /**
   * 判断是否应该启用监控
   */
  private shouldEnable(): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // 开发环境检查
    if (import.meta.env.DEV && !this.config.enableInDev) {
      return false;
    }

    // 采样率检查
    if (Math.random() > this.config.sampleRate) {
      return false;
    }

    return true;
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 监听性能指标
   */
  private observePerformance(): void {
    // 使用 PerformanceObserver 监听性能指标
    if ('PerformanceObserver' in window) {
      try {
        // 监听 LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.reportMetric({
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime,
            rating: this.getRating('LCP', lastEntry.renderTime || lastEntry.loadTime)
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // 监听 FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.reportMetric({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              rating: this.getRating('FID', entry.processingStart - entry.startTime)
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // 监听 CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.reportMetric({
            name: 'CLS',
            value: clsValue,
            rating: this.getRating('CLS', clsValue)
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.error('[Monitor] PerformanceObserver error:', e);
      }
    }

    // 监听页面加载完成后的性能指标
    if (document.readyState === 'complete') {
      this.reportNavigationTiming();
    } else {
      window.addEventListener('load', () => {
        this.reportNavigationTiming();
      });
    }
  }

  /**
   * 上报导航时序指标
   */
  private reportNavigationTiming(): void {
    setTimeout(() => {
      const timing = performance.timing;
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        // FCP (First Contentful Paint)
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.reportMetric({
            name: 'FCP',
            value: fcpEntry.startTime,
            rating: this.getRating('FCP', fcpEntry.startTime)
          });
        }

        // TTFB (Time to First Byte)
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.reportMetric({
          name: 'TTFB',
          value: ttfb,
          rating: this.getRating('TTFB', ttfb)
        });

        // 页面加载时间
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        this.reportMetric({
          name: 'PageLoad',
          value: loadTime,
          rating: this.getRating('PageLoad', loadTime)
        });

        // DNS查询时间
        const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
        this.reportMetric({
          name: 'DNS',
          value: dnsTime,
          rating: 'good'
        });

        // TCP连接时间
        const tcpTime = timing.connectEnd - timing.connectStart;
        this.reportMetric({
          name: 'TCP',
          value: tcpTime,
          rating: 'good'
        });
      }
    }, 0);
  }

  /**
   * 获取性能指标评级
   */
  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      FCP: [1800, 3000],
      LCP: [2500, 4000],
      FID: [100, 300],
      CLS: [0.1, 0.25],
      TTFB: [800, 1800],
      PageLoad: [2000, 4000]
    };

    const [good, poor] = thresholds[metric] || [0, 0];
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * 上报性能指标
   */
  private reportMetric(metric: { name: string; value: number; rating: string }): void {
    const performanceMetric: PerformanceMetrics = {
      type: 'performance',
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      metric: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo()
    };

    this.addToQueue(performanceMetric);
    console.log(`[Monitor] 性能指标: ${metric.name} = ${Math.round(metric.value)}ms (${metric.rating})`);
  }

  /**
   * 获取网络连接信息
   */
  private getConnectionInfo(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      return `${connection.effectiveType || 'unknown'} (${connection.downlink || 0}Mbps)`;
    }
    return 'unknown';
  }

  /**
   * 监听错误
   */
  private observeErrors(): void {
    // JavaScript运行时错误
    window.addEventListener('error', (event) => {
      if (event.error) {
        this.reportError({
          type: 'js-error',
          message: event.error.message || event.message,
          stack: event.error.stack || '',
          filename: event.filename || '',
          lineno: event.lineno || 0,
          colno: event.colno || 0
        });
      } else if (event.target && (event.target as any).src) {
        // 资源加载错误
        this.reportError({
          type: 'resource-error',
          message: `Failed to load resource: ${(event.target as any).src}`,
          stack: '',
          filename: (event.target as any).src,
          lineno: 0,
          colno: 0
        });
      }
    }, true);

    // Promise未捕获的拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'promise-error',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack || '',
        filename: '',
        lineno: 0,
        colno: 0
      });
    });

    // Vue错误处理（如果使用Vue）
    if (window.__VUE_ERROR_HANDLER__) {
      const originalHandler = window.__VUE_ERROR_HANDLER__;
      window.__VUE_ERROR_HANDLER__ = (err: Error, instance: any, info: string) => {
        this.reportError({
          type: 'vue-error',
          message: err.message,
          stack: err.stack || '',
          filename: '',
          lineno: 0,
          colno: 0,
          extra: { info }
        });
        originalHandler?.(err, instance, info);
      };
    }
  }

  /**
   * 上报错误
   */
  private reportError(error: {
    type: string;
    message: string;
    stack: string;
    filename: string;
    lineno: number;
    colno: number;
    extra?: any;
  }): void {
    const errorLog: ErrorLog = {
      type: 'error',
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      errorType: error.type,
      message: error.message,
      stack: error.stack,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      userAgent: navigator.userAgent,
      extra: error.extra
    };

    this.addToQueue(errorLog);
    console.error(`[Monitor] 错误: ${error.type} - ${error.message}`);
  }

  /**
   * 监听页面可见性变化
   */
  private observeVisibility(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面隐藏时立即上报
        this.flushQueue();
      }
    });
  }

  /**
   * 监听页面卸载
   */
  private observeUnload(): void {
    window.addEventListener('beforeunload', () => {
      // 页面卸载时立即上报
      this.flushQueue();
    });
  }

  /**
   * 添加到队列
   */
  private addToQueue(log: ErrorLog | PerformanceMetrics | UserAction): void {
    this.logQueue.push(log);

    // 如果队列达到最大大小，立即上报
    if (this.logQueue.length >= this.config.maxBatchSize) {
      this.flushQueue();
    }
  }

  /**
   * 启动批量上报定时器
   */
  private startBatchReporting(): void {
    this.batchTimer = window.setInterval(() => {
      if (this.logQueue.length > 0) {
        this.flushQueue();
      }
    }, this.config.batchInterval);
  }

  /**
   * 刷新队列（上报所有日志）
   */
  private flushQueue(): void {
    if (this.logQueue.length === 0) {
      return;
    }

    const logs = [...this.logQueue];
    this.logQueue = [];

    // 使用 sendBeacon 或 fetch 上报
    this.sendLogs(logs);
  }

  /**
   * 发送日志
   */
  private sendLogs(logs: Array<ErrorLog | PerformanceMetrics | UserAction>): void {
    const data = JSON.stringify({
      logs,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });

    // 优先使用 sendBeacon（页面卸载时也能发送）
    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' });
      const sent = navigator.sendBeacon(this.config.reportUrl, blob);
      if (sent) {
        console.log(`[Monitor] 上报 ${logs.length} 条日志 (sendBeacon)`);
        return;
      }
    }

    // 降级使用 fetch
    fetch(this.config.reportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: data,
      keepalive: true // 页面卸载时也能发送
    }).then(() => {
      console.log(`[Monitor] 上报 ${logs.length} 条日志 (fetch)`);
    }).catch((error) => {
      console.error('[Monitor] 日志上报失败:', error);
    });
  }

  /**
   * 手动上报用户行为
   */
  reportAction(action: string, data?: any): void {
    const userAction: UserAction = {
      type: 'action',
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      action,
      data,
      userAgent: navigator.userAgent
    };

    this.addToQueue(userAction);
  }

  /**
   * 销毁监控
   */
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    this.flushQueue();
  }
}

// 单例实例
let monitorInstance: Monitor | null = null;

/**
 * 初始化监控系统
 */
export function initMonitor(config?: Partial<MonitorConfig>): Monitor {
  if (!monitorInstance) {
    monitorInstance = new Monitor(config);
    monitorInstance.init();
  }
  return monitorInstance;
}

/**
 * 获取监控实例
 */
export function getMonitor(): Monitor | null {
  return monitorInstance;
}

/**
 * 手动上报用户行为
 */
export function reportAction(action: string, data?: any): void {
  monitorInstance?.reportAction(action, data);
}

export default Monitor;
