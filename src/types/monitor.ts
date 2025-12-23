/**
 * 监控相关类型定义
 */

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  type: 'performance';
  sessionId: string;
  timestamp: number;
  url: string;
  metric: string; // FCP, LCP, FID, CLS, TTFB, PageLoad, DNS, TCP
  value: number;
  rating: string; // good, needs-improvement, poor
  userAgent: string;
  connection: string;
}

/**
 * 错误日志
 */
export interface ErrorLog {
  type: 'error';
  sessionId: string;
  timestamp: number;
  url: string;
  errorType: string; // js-error, promise-error, resource-error, vue-error
  message: string;
  stack: string;
  filename: string;
  lineno: number;
  colno: number;
  userAgent: string;
  extra?: any;
}

/**
 * 用户行为
 */
export interface UserAction {
  type: 'action';
  sessionId: string;
  timestamp: number;
  url: string;
  action: string;
  data?: any;
  userAgent: string;
}

/**
 * 日志批次
 */
export interface LogBatch {
  logs: Array<ErrorLog | PerformanceMetrics | UserAction>;
  timestamp: number;
  sessionId: string;
}

/**
 * 监控配置
 */
export interface MonitorConfig {
  enabled: boolean;
  reportUrl: string;
  sampleRate: number;
  enableInDev: boolean;
  batchInterval: number;
  maxBatchSize: number;
}

// 扩展 Window 接口
declare global {
  interface Window {
    __VUE_ERROR_HANDLER__?: (err: Error, instance: any, info: string) => void;
  }
}
