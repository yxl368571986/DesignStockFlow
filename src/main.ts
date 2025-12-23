import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'element-plus/dist/index.css';
import './assets/styles/index.css';
import './assets/styles/admin.css'; // 管理后台样式
import App from './App.vue';
import router from './router';
import { createLazyLoadDirective } from './composables/useLazyLoad';
import { preconnect, dnsPrefetch } from './utils/performance';
import { initImageOptimization } from './utils/imageOptimization';
import { initNetworkOptimization } from './utils/network';
import { initMonitor } from './utils/monitor';
import request from './utils/request';

// 开发环境启用Mock服务 - 必须在创建app之前同步初始化
if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
  const { setupMock } = await import('@/mock');
  setupMock(request);
  console.log('✅ Mock服务已启用');
}

// 性能优化：初始化网络优化（DNS预解析、预连接等）
initNetworkOptimization();

// 初始化监控系统
initMonitor({
  enabled: true,
  reportUrl: import.meta.env.VITE_MONITOR_URL || '/api/monitor/report',
  sampleRate: import.meta.env.PROD ? 1.0 : 0.1, // 生产环境100%采样，开发环境10%
  enableInDev: import.meta.env.VITE_ENABLE_MONITOR_IN_DEV === 'true',
  batchInterval: 5000,
  maxBatchSize: 10
});

// 性能优化：预连接和DNS预解析（兼容旧代码）
const CDN_DOMAIN = import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.startide-design.com';
const API_DOMAIN = import.meta.env.VITE_API_BASE_URL || 'https://api.startide-design.com';

// DNS预解析
dnsPrefetch(CDN_DOMAIN);
dnsPrefetch(API_DOMAIN);

// 预连接
preconnect(CDN_DOMAIN);
preconnect(API_DOMAIN);

// 初始化图片优化（检测WebP支持）
initImageOptimization();

const app = createApp(App);
const pinia = createPinia();

// 注册懒加载指令
const lazyLoadDirective = createLazyLoadDirective({
  rootMargin: '50px',
  threshold: 0.01,
  placeholder:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f5f7fa" width="400" height="300"/%3E%3C/svg%3E'
});
app.directive('lazy', lazyLoadDirective);

// 注册所有Element Plus图标（按需注册以优化性能）
const iconsToRegister = [
  'Download',
  'Star',
  'Loading',
  'Picture',
  'Bell',
  'Close',
  'TrendCharts',
  'ArrowRight',
  'Connection',
  'Refresh',
  'Search',
  'User',
  'Setting',
  'Upload',
  'Delete',
  'Edit',
  'View'
];

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  if (iconsToRegister.includes(key)) {
    app.component(key, component);
  }
}

app.use(pinia);
app.use(router);
app.use(ElementPlus);

app.mount('#app');
