# 监控和日志配置指南

## 概述

本文档详细说明了星潮设计资源平台的前端监控和日志系统的配置和使用方法。

## 功能特性

### 1. 性能监控

系统自动监控以下性能指标：

- **FCP (First Contentful Paint)**: 首次内容绘制时间
- **LCP (Largest Contentful Paint)**: 最大内容绘制时间
- **FID (First Input Delay)**: 首次输入延迟
- **CLS (Cumulative Layout Shift)**: 累积布局偏移
- **TTFB (Time to First Byte)**: 首字节时间
- **PageLoad**: 页面加载时间
- **DNS**: DNS查询时间
- **TCP**: TCP连接时间

### 2. 错误追踪

系统自动捕获以下类型的错误：

- **JavaScript运行时错误**: 代码执行错误
- **Promise未捕获拒绝**: 异步错误
- **资源加载错误**: 图片、脚本、样式加载失败
- **Vue组件错误**: Vue框架内部错误

### 3. 用户行为追踪

可以手动上报用户行为：

```typescript
import { reportAction } from '@/utils/monitor';

// 上报用户点击
reportAction('button_click', { buttonId: 'download', resourceId: '123' });

// 上报搜索行为
reportAction('search', { keyword: 'UI设计', resultCount: 42 });

// 上报下载行为
reportAction('download', { resourceId: '123', fileSize: 1024000 });
```

## 配置说明

### 环境变量配置

在 `.env.development` 和 `.env.production` 中配置：

```bash
# 监控日志上报接口
VITE_MONITOR_URL=https://api.startide-design.com/api/monitor/report

# 是否在开发环境启用监控（可选，默认false）
VITE_ENABLE_MONITOR_IN_DEV=false
```

### 监控配置参数

在 `src/main.ts` 中初始化监控时可以配置：

```typescript
initMonitor({
  enabled: true,                    // 是否启用监控
  reportUrl: '/api/monitor/report', // 日志上报接口
  sampleRate: 1.0,                  // 采样率（0-1），1.0表示100%采样
  enableInDev: false,               // 是否在开发环境启用
  batchInterval: 5000,              // 批量上报间隔（毫秒）
  maxBatchSize: 10                  // 最大批量大小
});
```

## 性能指标评级标准

系统会自动对性能指标进行评级：

| 指标 | 优秀 (good) | 需要改进 (needs-improvement) | 差 (poor) |
|------|------------|----------------------------|----------|
| FCP  | ≤ 1.8s     | 1.8s - 3.0s                | > 3.0s   |
| LCP  | ≤ 2.5s     | 2.5s - 4.0s                | > 4.0s   |
| FID  | ≤ 100ms    | 100ms - 300ms              | > 300ms  |
| CLS  | ≤ 0.1      | 0.1 - 0.25                 | > 0.25   |
| TTFB | ≤ 800ms    | 800ms - 1800ms             | > 1800ms |
| PageLoad | ≤ 2.0s | 2.0s - 4.0s                | > 4.0s   |

## 日志上报机制

### 批量上报

- 系统会将日志缓存在内存队列中
- 每隔 `batchInterval` 毫秒自动上报一次
- 当队列达到 `maxBatchSize` 时立即上报
- 页面隐藏或卸载时立即上报

### 上报方式

1. **优先使用 sendBeacon API**
   - 页面卸载时也能可靠发送
   - 不阻塞页面卸载
   - 浏览器自动管理发送时机

2. **降级使用 fetch API**
   - 使用 `keepalive: true` 选项
   - 支持更复杂的请求配置

### 上报数据格式

```json
{
  "logs": [
    {
      "type": "performance",
      "sessionId": "1234567890-abc123",
      "timestamp": 1703001234567,
      "url": "https://startide-design.com/resource/123",
      "metric": "LCP",
      "value": 2300,
      "rating": "good",
      "userAgent": "Mozilla/5.0...",
      "connection": "4g (10Mbps)"
    },
    {
      "type": "error",
      "sessionId": "1234567890-abc123",
      "timestamp": 1703001234568,
      "url": "https://startide-design.com/upload",
      "errorType": "js-error",
      "message": "Cannot read property 'name' of undefined",
      "stack": "Error: Cannot read property...",
      "filename": "https://startide-design.com/assets/index.js",
      "lineno": 123,
      "colno": 45,
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "timestamp": 1703001234569,
  "sessionId": "1234567890-abc123"
}
```

## 后端接口实现

后端需要实现日志接收接口：

```typescript
// POST /api/monitor/report
interface MonitorReportRequest {
  logs: Array<ErrorLog | PerformanceMetrics | UserAction>;
  timestamp: number;
  sessionId: string;
}

// 示例实现（Node.js + Express）
app.post('/api/monitor/report', async (req, res) => {
  try {
    const { logs, timestamp, sessionId } = req.body;
    
    // 验证数据
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: 'Invalid logs' });
    }
    
    // 存储到数据库或日志系统
    await saveLogsToDatabase(logs, sessionId);
    
    // 或者写入日志文件
    logs.forEach(log => {
      if (log.type === 'error') {
        logger.error('Frontend Error', log);
      } else if (log.type === 'performance') {
        logger.info('Performance Metric', log);
      } else if (log.type === 'action') {
        logger.info('User Action', log);
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Monitor report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Nginx日志配置

### 访问日志配置

在 `nginx.conf` 中配置访问日志：

```nginx
http {
    # 定义日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    '$request_time $upstream_response_time';
    
    # 定义详细日志格式（包含更多信息）
    log_format detailed '$remote_addr - $remote_user [$time_local] '
                        '"$request" $status $body_bytes_sent '
                        '"$http_referer" "$http_user_agent" '
                        '$request_time $upstream_response_time '
                        '$pipe $connection $connection_requests';
    
    server {
        listen 80;
        server_name startide-design.com;
        
        # 访问日志
        access_log /var/log/nginx/startide-access.log main;
        
        # 错误日志
        error_log /var/log/nginx/startide-error.log warn;
        
        # 静态资源不记录日志（可选）
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf)$ {
            access_log off;
        }
        
        # API请求使用详细日志
        location /api/ {
            access_log /var/log/nginx/startide-api.log detailed;
            proxy_pass http://backend;
        }
    }
}
```

### 错误日志级别

```nginx
# 错误日志级别（从低到高）：
# debug, info, notice, warn, error, crit, alert, emerg

# 开发环境
error_log /var/log/nginx/error.log debug;

# 生产环境
error_log /var/log/nginx/error.log warn;
```

### 日志轮转配置

创建 `/etc/logrotate.d/nginx` 文件：

```bash
/var/log/nginx/*.log {
    daily                   # 每天轮转
    missingok              # 日志文件不存在不报错
    rotate 30              # 保留30天
    compress               # 压缩旧日志
    delaycompress          # 延迟压缩（下次轮转时压缩）
    notifempty             # 空文件不轮转
    create 0640 nginx nginx # 创建新日志文件的权限
    sharedscripts          # 所有日志轮转完后执行一次脚本
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

## 日志分析

### 使用 GoAccess 分析访问日志

```bash
# 安装 GoAccess
apt-get install goaccess

# 实时分析访问日志
goaccess /var/log/nginx/startide-access.log -c

# 生成HTML报告
goaccess /var/log/nginx/startide-access.log -o /var/www/html/report.html --log-format=COMBINED

# 实时更新HTML报告
goaccess /var/log/nginx/startide-access.log -o /var/www/html/report.html --log-format=COMBINED --real-time-html
```

### 使用 AWK 分析日志

```bash
# 统计访问最多的IP
awk '{print $1}' /var/log/nginx/startide-access.log | sort | uniq -c | sort -rn | head -10

# 统计访问最多的URL
awk '{print $7}' /var/log/nginx/startide-access.log | sort | uniq -c | sort -rn | head -10

# 统计HTTP状态码分布
awk '{print $9}' /var/log/nginx/startide-access.log | sort | uniq -c | sort -rn

# 统计响应时间超过1秒的请求
awk '$NF > 1.0 {print $0}' /var/log/nginx/startide-access.log

# 统计每小时的请求量
awk '{print $4}' /var/log/nginx/startide-access.log | cut -d: -f2 | sort | uniq -c
```

## 监控告警

### 性能告警规则

建议设置以下告警规则：

1. **LCP > 4秒**: 页面加载过慢
2. **FID > 300ms**: 交互响应过慢
3. **CLS > 0.25**: 布局稳定性差
4. **错误率 > 1%**: 错误频率过高
5. **API响应时间 > 2秒**: 后端响应慢

### 日志监控工具

推荐使用以下工具：

1. **ELK Stack** (Elasticsearch + Logstash + Kibana)
   - 强大的日志搜索和分析
   - 可视化仪表板
   - 实时告警

2. **Sentry**
   - 专业的错误追踪
   - 自动分组和去重
   - 邮件/Slack通知

3. **Grafana + Prometheus**
   - 性能指标可视化
   - 自定义告警规则
   - 多数据源支持

## 最佳实践

### 1. 采样策略

```typescript
// 生产环境：根据用户分组采样
const userId = getUserId();
const sampleRate = userId % 10 === 0 ? 1.0 : 0.1; // 10%用户全量，90%用户10%采样

initMonitor({
  sampleRate
});
```

### 2. 敏感信息过滤

```typescript
// 在上报前过滤敏感信息
function sanitizeLog(log: any) {
  // 移除URL中的token
  log.url = log.url.replace(/token=[^&]+/, 'token=***');
  
  // 移除错误堆栈中的敏感信息
  if (log.stack) {
    log.stack = log.stack.replace(/password=\w+/g, 'password=***');
  }
  
  return log;
}
```

### 3. 性能优化

```typescript
// 使用 requestIdleCallback 延迟非关键日志上报
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    reportAction('page_view', { page: location.pathname });
  });
} else {
  setTimeout(() => {
    reportAction('page_view', { page: location.pathname });
  }, 1000);
}
```

### 4. 错误去重

```typescript
// 避免重复上报相同错误
const reportedErrors = new Set<string>();

function reportError(error: Error) {
  const errorKey = `${error.message}:${error.stack?.split('\n')[0]}`;
  
  if (reportedErrors.has(errorKey)) {
    return; // 已上报过，跳过
  }
  
  reportedErrors.add(errorKey);
  // 上报错误...
}
```

## 故障排查

### 问题1：日志未上报

**可能原因：**
- 监控未启用
- 采样率设置过低
- 网络请求被拦截
- 后端接口异常

**排查步骤：**
1. 检查浏览器控制台是否有 `[Monitor]` 日志
2. 检查网络面板是否有上报请求
3. 检查后端接口是否正常响应
4. 检查环境变量配置

### 问题2：性能指标不准确

**可能原因：**
- 浏览器不支持 PerformanceObserver
- 页面加载过快导致指标未捕获
- 网络环境影响

**排查步骤：**
1. 检查浏览器兼容性
2. 使用 Chrome DevTools 的 Performance 面板验证
3. 对比 Lighthouse 报告

### 问题3：日志量过大

**解决方案：**
1. 降低采样率
2. 增加批量上报间隔
3. 过滤不重要的日志
4. 使用日志聚合和去重

## 总结

通过完善的监控和日志系统，我们可以：

1. ✅ 实时监控前端性能指标
2. ✅ 快速发现和定位错误
3. ✅ 分析用户行为和使用习惯
4. ✅ 优化用户体验
5. ✅ 提升系统稳定性

定期查看监控数据，持续优化系统性能！
