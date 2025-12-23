# 星潮设计资源平台 - 快速参考指南

## 🚀 快速开始

### 开发环境启动
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问地址
http://localhost:5173
```

### 生产构建
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

---

## 📁 项目结构速查

```
src/
├── api/              # API接口 - 所有后端接口调用
├── components/       # 组件
│   ├── common/      # 通用组件 (Loading, Empty, NetworkStatus)
│   ├── layout/      # 布局组件 (Header, Footer, Sidebar)
│   └── business/    # 业务组件 (ResourceCard, SearchBar, UploadArea)
├── composables/      # 组合式函数 - 可复用业务逻辑
├── pinia/           # 状态管理 - 全局状态
├── router/          # 路由配置
├── types/           # TypeScript类型定义
├── utils/           # 工具函数
└── views/           # 页面组件
```

---

## 🔧 常用命令

### 开发
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
npm run type-check   # TypeScript类型检查
```

### 代码质量
```bash
npm run lint         # ESLint检查
npm run lint:fix     # 自动修复ESLint问题
npm run format       # Prettier格式化
```

### 测试
```bash
npm run test         # 运行所有测试
npm run test:unit    # 运行单元测试
npm run test:coverage # 测试覆盖率报告
```

### 性能
```bash
npm run lighthouse   # Lighthouse性能测试
npm run analyze      # 构建分析
```

---

## 🌐 环境变量

### 开发环境 (.env.development)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_CDN_BASE_URL=http://localhost:3000
VITE_ENABLE_MOCK=true
```

### 生产环境 (.env.production)
```env
VITE_API_BASE_URL=https://api.startide-design.com
VITE_CDN_BASE_URL=https://cdn.startide-design.com
VITE_ENABLE_MOCK=false
```

---

## 📡 API接口速查

### 认证接口 (api/auth.ts)
```typescript
login()              // 用户登录
register()           // 用户注册
sendVerifyCode()     // 发送验证码
getUserInfo()        // 获取用户信息
logout()             // 退出登录
```

### 资源接口 (api/resource.ts)
```typescript
getResourceList()    // 获取资源列表
getResourceDetail()  // 获取资源详情
searchResources()    // 搜索资源
getHotResources()    // 获取热门资源
```

### 上传接口 (api/upload.ts)
```typescript
validateFileFormat() // 验证文件格式
initChunkUpload()    // 初始化分片上传
uploadChunk()        // 上传分片
completeFileUpload() // 完成上传
```

---

## 🎨 组件使用速查

### ResourceCard - 资源卡片
```vue
<ResourceCard
  :resource="resourceData"
  :show-actions="true"
  @click="handleClick"
  @download="handleDownload"
/>
```

### SearchBar - 搜索框
```vue
<SearchBar
  v-model="keyword"
  :show-suggestions="true"
  @search="handleSearch"
/>
```

### UploadArea - 上传区域
```vue
<UploadArea
  :accept="'.psd,.ai,.cdr'"
  :max-size="1000"
  @upload="handleUpload"
/>
```

---

## 🔐 安全功能速查

### XSS防护
```typescript
import { sanitizeInput, sanitizeHTML } from '@/utils/security';

// 过滤用户输入
const safeInput = sanitizeInput(userInput);

// 净化HTML内容
const safeHTML = sanitizeHTML(htmlContent);
```

### CSRF防护
```typescript
// 自动在请求头添加CSRF Token
// 已在Axios拦截器中配置
```

### Token管理
```typescript
import { getToken, setToken, removeToken } from '@/utils/security';

// 获取Token
const token = getToken();

// 设置Token
setToken('your-token', 7); // 7天有效期

// 移除Token
removeToken();
```

---

## 📊 状态管理速查

### userStore - 用户状态
```typescript
import { useUserStore } from '@/pinia/userStore';

const userStore = useUserStore();

// 读取状态
userStore.isLoggedIn
userStore.userInfo
userStore.isVIP

// 操作
userStore.setUserInfo(info)
userStore.setToken(token)
userStore.logout()
```

### resourceStore - 资源状态
```typescript
import { useResourceStore } from '@/pinia/resourceStore';

const resourceStore = useResourceStore();

// 读取状态
resourceStore.resources
resourceStore.total
resourceStore.loading

// 操作
resourceStore.fetchResources(params)
resourceStore.resetSearch()
```

---

## 🛠️ 工具函数速查

### 格式化工具 (utils/format.ts)
```typescript
formatFileSize(1024)           // "1 KB"
formatTime(date, 'YYYY-MM-DD') // "2024-12-20"
formatDownloadCount(1234)      // "1.2k"
```

### 验证工具 (utils/validate.ts)
```typescript
validatePhone('13800138000')   // true
validateEmail('test@example.com') // true
validatePassword('Pass123!')   // { valid: true, strength: 'strong' }
validateFile(file)             // { valid: true }
```

### 安全工具 (utils/security.ts)
```typescript
sanitizeInput(input)           // 过滤XSS
sanitizeHTML(html)             // 净化HTML
encryptPassword(password)      // SHA256加密
maskPhone('13800138000')       // "138****8000"
```

---

## 🚨 故障排查速查

### 页面无法访问
```bash
# 检查Nginx状态
sudo systemctl status nginx

# 重启Nginx
sudo systemctl restart nginx
```

### 构建失败
```bash
# 清理缓存
rm -rf node_modules dist
npm install
npm run build
```

### 测试失败
```bash
# 运行单个测试文件
npm run test -- path/to/test.ts

# 查看详细错误
npm run test -- --reporter=verbose
```

### 性能问题
```bash
# 分析构建产物
npm run analyze

# 运行性能测试
npm run lighthouse
```

---

## 📞 紧急联系

### 技术支持
- **前端负责人**: [姓名] - [邮箱] - [电话]
- **后端负责人**: [姓名] - [邮箱] - [电话]
- **运维负责人**: [姓名] - [邮箱] - [电话]

### 重要链接
- **项目仓库**: https://github.com/[org]/startide-design
- **生产环境**: https://startide-design.com
- **API文档**: https://api.startide-design.com/docs
- **监控面板**: [监控系统地址]

---

## 📚 文档索引

### 必读文档
1. `README.md` - 项目介绍
2. `PROJECT_DELIVERY.md` - 项目交付文档
3. `NGINX_DEPLOYMENT_GUIDE.md` - 部署指南

### 开发文档
- `BUILD_GUIDE.md` - 构建配置
- `ENV_CONFIGURATION_GUIDE.md` - 环境配置
- `CODE_SPLITTING_GUIDE.md` - 代码分割

### 安全文档
- `XSS_PROTECTION_GUIDE.md` - XSS防护
- `CSRF_PROTECTION_GUIDE.md` - CSRF防护
- `TOKEN_SECURITY_GUIDE.md` - Token安全

### 性能文档
- `CACHE_STRATEGY.md` - 缓存策略
- `RENDERING_OPTIMIZATION_GUIDE.md` - 渲染优化
- `PERFORMANCE_CHECKLIST.md` - 性能检查

---

**最后更新**: 2024年12月20日  
**文档版本**: v1.0.0
