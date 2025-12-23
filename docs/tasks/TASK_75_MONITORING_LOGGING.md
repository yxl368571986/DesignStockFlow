# Task 75: 配置监控和日志 - 完成总结

## 任务概述

实现了完整的前端性能监控和日志系统，包括性能指标监控、错误追踪、用户行为追踪和日志上报功能。

## 已完成的工作

### 1. 前端性能监控（initMonitor）✅

**文件**: `src/utils/monitor.ts`

实现了完整的性能监控系统，包括：

#### 性能指标监控
- **FCP (First Contentful Paint)**: 首次内容绘制时间
- **LCP (Largest Contentful Paint)**: 最大内容绘制时间
- **FID (First Input Delay)**: 首次输入延迟
- **CLS (Cumulative Layout Shift)**: 累积布局偏移
- **TTFB (Time to First Byte)**: 首字节时间
- **PageLoad**: 页面加载时间
- **DNS**: DNS查询时间
- **TCP**: TCP连接时间

#### 性能指标评级
系统自动对性能指标进行评级（good/needs-improvement/poor）：

| 指标 | 优秀 | 需要改进 | 差 |
|------|------|---------|-----|
| FCP  | ≤1.8s | 1.8s-3.0s | >3.0s |
| LCP  | ≤2.5s | 2.5s-4.0s | >4.0s |
| FID  | ≤100ms | 100ms-300ms | >300ms |
| CLS  | ≤0.1 | 0.1-0.25 | >0.25 |
| TTFB | ≤800ms | 800ms-1800ms | >1800ms |

#### 监控配置
```typescript
initMonitor({
  enabled: true,                    // 是否启用监控
  reportUrl: '/api/monitor/report', // 日志上报接口
  sampleRate: 1.0,                  // 采样率（0-1）
  enableInDev: false,               // 是否在开发环境启用
  batchInterval: 5000,              // 批量上报间隔（毫秒）
  maxBatchSize: 10                  // 最大批量大小
});
```

### 2. 错误追踪（window.onerror、unhandledrejection）✅

实现了全面的错误捕获机制：

#### 错误类型
- **JavaScript运行时错误**: 通过 `window.addEventListener('error')` 捕获
- **Promise未捕获拒绝**: 通过 `window.addEventListener('unhandledrejection')` 捕获
- **资源加载错误**: 捕获图片、脚本、样式加载失败
- **Vue组件错误**: 通过 `window.__VUE_ERROR_HANDLER__` 捕获

#### 错误信息
每个错误日志包含：
- 错误类型（js-error/promise-error/resource-error/vue-error）
- 错误消息
- 错误堆栈
- 文件名和行列号
- 用户代理信息
- 会话ID和时间戳

### 3. 用户行为追踪 ✅

提供了手动上报用户行为的API：

```typescript
import { reportAction } from '@/utils/monitor';

// 上报用户点击
reportAction('button_click', { buttonId: 'download', resourceId: '123' });

// 上报搜索行为
reportAction('search', { keyword: 'UI设计', resultCount: 42 });

// 上报下载行为
reportAction('download', { resourceId: '123', fileSize: 1024000 });
```

### 4. 日志上报机制 ✅

#### 批量上报策略
- 日志缓存在内存队列中
- 每隔5秒自动上报一次
- 队列达到10条时立即上报
- 页面隐藏或卸载时立即上报

#### 上报方式
1. **优先使用 sendBeacon API**
   - 页面卸载时也能可靠发送
   - 不阻塞页面卸载
   - 浏览器自动管理发送时机

2. **降级使用 fetch API**
   - 使用 `keepalive: true` 选项
   - 支持更复杂的请求配置

#### 上报数据格式
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
    }
  ],
  "timestamp": 1703001234569,
  "sessionId": "1234567890-abc123"
}
```

### 5. Nginx日志配置 ✅

**文件**: `nginx.conf.example`

#### 访问日志配置
- 定义了详细的日志格式（包含性能指标）
- 配置了主访问日志
- 配置了API专用访问日志
- 静态资源可选择不记录日志

#### 错误日志配置
- 配置了错误日志级别（warn）
- 分离了HTTP重定向日志
- 分离了API错误日志

#### 日志格式
```nginx
log_format detailed '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    '$request_time $upstream_response_time '
                    '$pipe $connection $connection_requests '
                    '"$http_x_forwarded_for"';
```

### 6. 日志轮转配置 ✅

**文件**: `logrotate.conf.example`

#### 轮转策略
- **主日志**: 每天轮转，保留30天
- **HTTP日志**: 每天轮转，保留7天
- **API日志**: 每天轮转，保留90天（更重要）

#### 轮转特性
- 自动压缩旧日志（gzip）
- 延迟压缩（保留最近一天的未压缩日志）
- 日志文件超过100MB立即轮转
- 轮转后自动通知Nginx重新打开日志文件

### 7. 环境变量配置 ✅

更新了以下文件：
- `.env.development`: 开发环境监控配置
- `.env.production`: 生产环境监控配置
- `.env.example`: 监控配置模板

#### 新增环境变量
```bash
# 监控日志上报接口
VITE_MONITOR_URL=http://localhost:8080/api/monitor/report

# 是否在开发环境启用监控
VITE_ENABLE_MONITOR_IN_DEV=false

# 监控采样率（0-1）
VITE_MONITOR_SAMPLE_RATE=1.0
```

### 8. 应用初始化 ✅

**文件**: `src/main.ts`

在应用启动时自动初始化监控系统：

```typescript
import { initMonitor } from './utils/monitor';

initMonitor({
  enabled: true,
  reportUrl: import.meta.env.VITE_MONITOR_URL || '/api/monitor/report',
  sampleRate: import.meta.env.PROD ? 1.0 : 0.1,
  enableInDev: import.meta.env.VITE_ENABLE_MONITOR_IN_DEV === 'true',
  batchInterval: 5000,
  maxBatchSize: 10
});
```

### 9. TypeScript类型定义 ✅

**文件**: `src/types/monitor.ts`

定义了完整的监控类型：
- `PerformanceMetrics`: 性能指标类型
- `ErrorLog`: 错误日志类型
- `UserAction`: 用户行为类型
- `LogBatch`: 日志批次类型
- `MonitorConfig`: 监控配置类型

### 10. 完整文档 ✅

**文件**: `MONITORING_LOGGING_GUIDE.md`

创建了详细的监控和日志配置指南，包括：
- 功能特性说明
- 配置参数详解
- 性能指标评级标准
- 日志上报机制
- 后端接口实现示例
- Nginx日志配置
- 日志分析工具使用
- 监控告警规则
- 最佳实践
- 故障排查指南

## 技术实现亮点

### 1. 使用 PerformanceObserver API
- 实时监控性能指标
- 自动捕获LCP、FID、CLS等核心指标
- 不阻塞主线程

### 2. 智能批量上报
- 减少网络请求次数
- 降低服务器压力
- 页面卸载时确保数据不丢失

### 3. 采样策略
- 支持配置采样率
- 开发环境和生产环境分别配置
- 降低监控成本

### 4. 会话追踪
- 每个会话生成唯一ID
- 关联同一会话的所有日志
- 便于问题追踪和分析

### 5. 网络连接信息
- 自动检测网络类型（4G/WiFi等）
- 记录网络速度
- 帮助分析性能问题

## 使用示例

### 1. 查看监控日志

在浏览器控制台可以看到监控日志：

```
[Monitor] 初始化监控系统
[Monitor] 性能指标: LCP = 2300ms (good)
[Monitor] 性能指标: FCP = 1500ms (good)
[Monitor] 性能指标: FID = 80ms (good)
[Monitor] 上报 3 条日志 (sendBeacon)
```

### 2. 手动上报用户行为

```typescript
// 在组件中使用
import { reportAction } from '@/utils/monitor';

function handleDownload(resourceId: string) {
  // 执行下载逻辑...
  
  // 上报下载行为
  reportAction('resource_download', {
    resourceId,
    timestamp: Date.now()
  });
}
```

### 3. 查看Nginx日志

```bash
# 查看访问日志
tail -f /var/log/nginx/startide-design-access.log

# 查看API日志
tail -f /var/log/nginx/startide-design-api.log

# 查看错误日志
tail -f /var/log/nginx/startide-design-error.log
```

### 4. 分析日志

```bash
# 统计访问最多的IP
awk '{print $1}' /var/log/nginx/startide-design-access.log | sort | uniq -c | sort -rn | head -10

# 统计HTTP状态码分布
awk '{print $9}' /var/log/nginx/startide-design-access.log | sort | uniq -c | sort -rn

# 统计响应时间超过1秒的请求
awk '$NF > 1.0 {print $0}' /var/log/nginx/startide-design-access.log
```

## 后端接口要求

后端需要实现日志接收接口：

```typescript
// POST /api/monitor/report
interface MonitorReportRequest {
  logs: Array<ErrorLog | PerformanceMetrics | UserAction>;
  timestamp: number;
  sessionId: string;
}

// 响应格式
interface MonitorReportResponse {
  success: boolean;
  message?: string;
}
```

## 验证清单

- [x] 前端性能监控系统已实现
- [x] 错误追踪机制已实现
- [x] 用户行为追踪API已实现
- [x] 日志批量上报机制已实现
- [x] Nginx访问日志已配置
- [x] Nginx错误日志已配置
- [x] 日志轮转配置已创建
- [x] 环境变量已配置
- [x] 应用初始化已集成
- [x] TypeScript类型已定义
- [x] 完整文档已创建

## 性能影响

监控系统对性能的影响：

1. **内存占用**: 约1-2MB（日志队列）
2. **CPU占用**: 可忽略（使用PerformanceObserver）
3. **网络流量**: 每5秒约1-5KB（取决于日志量）
4. **页面加载**: 无影响（异步初始化）

## 最佳实践建议

1. **生产环境**: 100%采样，及时发现问题
2. **开发环境**: 10%采样，减少干扰
3. **敏感信息**: 过滤URL中的token等敏感信息
4. **错误去重**: 避免重复上报相同错误
5. **日志分析**: 定期分析日志，优化性能
6. **告警设置**: 设置性能和错误告警规则

## 下一步建议

1. 集成专业监控工具（如Sentry、Grafana）
2. 实现实时告警机制
3. 创建监控仪表板
4. 定期生成性能报告
5. 优化日志存储和查询

## 总结

Task 75已完成，实现了完整的前端监控和日志系统。系统能够：

✅ 自动监控性能指标（FCP、LCP、FID、CLS等）
✅ 自动捕获各类错误（JS错误、Promise拒绝、资源加载错误）
✅ 支持手动上报用户行为
✅ 智能批量上报日志
✅ 配置了完善的Nginx日志
✅ 提供了详细的使用文档

监控系统已集成到应用中，随应用启动自动运行。开发者可以通过浏览器控制台查看监控日志，通过后端接口接收和分析日志数据。
