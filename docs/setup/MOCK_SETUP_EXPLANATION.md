# Mock服务设置说明

## 问题根源

浏览器报错 `ERR_CONNECTION_REFUSED` 的根本原因是：

1. **Mock服务设置是异步的** - 在 `src/main.ts` 中使用动态导入
2. **应用启动时立即发起API请求** - Store和组件在mount时就开始请求数据
3. **Mock拦截器还未就绪** - 请求发出时，axios-mock-adapter还没有设置好
4. **请求发往真实后端** - 请求被发送到 `localhost:8080`，但后端服务器不存在

## 解决方案

### 1. 同步初始化Mock服务

**修改前** (`src/main.ts`):
```typescript
// 异步导入，导致时序问题
if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
  import('@/mock').then(({ setupMock }) => {
    setupMock(service);
  });
}
```

**修改后** (`src/main.ts`):
```typescript
// 使用top-level await，确保Mock在app创建前就绪
if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
  const { setupMock } = await import('@/mock');
  setupMock(request);
  console.log('✅ Mock服务已启用');
}
```

### 2. 移除request.ts中的重复Mock设置

**修改前** (`src/utils/request.ts`):
```typescript
// 开发环境启用Mock服务
if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
  import('@/mock').then(({ setupMock }) => {
    setupMock(service);
  });
}
```

**修改后**:
```typescript
// 已移除 - Mock在main.ts中统一初始化
```

### 3. 禁用Vite代理（当Mock启用时）

**修改前** (`vite.config.ts`):
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      // ...
    }
  }
}
```

**修改后** (`vite.config.ts`):
```typescript
server: {
  // 只在Mock未启用时配置代理
  proxy: enableMock ? undefined : {
    '/api': {
      target: env.VITE_API_BASE_URL || 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

## Mock服务工作原理

### 客户端Mock（axios-mock-adapter）

```
浏览器 → axios请求 → Mock拦截器 → 返回Mock数据
                    ↓ (未匹配)
                    → 真实API
```

**特点**:
- ✅ 在浏览器中工作
- ✅ 拦截axios实例的请求
- ✅ 可以模拟延迟、错误等
- ❌ 不拦截fetch请求
- ❌ 不拦截外部请求（如Node.js脚本）

### 服务端代理（Vite proxy）

```
浏览器 → Vite Dev Server → 后端API
         ↓ (代理)
         → localhost:8080
```

**特点**:
- ✅ 拦截所有HTTP请求
- ✅ 可以转发到真实后端
- ✅ 解决CORS问题
- ❌ 与Mock冲突（会优先代理）

## 验证Mock是否工作

### 方法1: 浏览器控制台

1. 打开浏览器访问 `http://localhost:3000`
2. 打开开发者工具 (F12)
3. 查看Console标签，应该看到：
   ```
   ✅ Mock服务已启用
   🎭 Mock服务已启动
   ```
4. 查看Network标签，API请求应该：
   - 状态码: 200
   - 响应时间: 200-500ms (模拟延迟)
   - 响应数据: Mock数据

### 方法2: 检查网络请求

在Network标签中，点击任意API请求，查看：

**Headers**:
- Request URL: `http://localhost:3000/api/xxx`
- Status Code: 200

**Response**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": { ... }
}
```

### 方法3: 查看页面内容

如果Mock工作正常，首页应该显示：
- ✅ 轮播图（3张）
- ✅ 分类导航（5个分类）
- ✅ 热门资源（8个）
- ✅ 推荐资源（8个）
- ✅ 公告横幅

如果Mock未工作，页面会显示：
- ❌ 加载失败
- ❌ 网络错误
- ❌ ERR_CONNECTION_REFUSED

## 常见问题

### Q1: 为什么Node.js测试脚本失败？

**A**: axios-mock-adapter只拦截浏览器中的axios请求，不拦截Node.js中的请求。Node.js脚本会直接访问Vite dev server，得到HTML而不是JSON。

**解决方案**: 在浏览器中测试，或使用MSW (Mock Service Worker) 进行服务端Mock。

### Q2: 如何切换到真实API？

**A**: 修改 `.env.development`:
```bash
# 禁用Mock
VITE_ENABLE_MOCK=false

# 设置真实API地址
VITE_API_BASE_URL=http://your-backend-api.com/api
```

### Q3: Mock数据在哪里？

**A**: `src/mock/data.ts` - 包含所有Mock数据

### Q4: 如何添加新的Mock接口？

**A**: 在 `src/mock/index.ts` 中添加：
```typescript
mock.onGet('/your/endpoint').reply(200, {
  code: 200,
  msg: '成功',
  data: yourMockData
});
```

## 测试清单

- [ ] 浏览器控制台显示 "✅ Mock服务已启用"
- [ ] 浏览器控制台显示 "🎭 Mock服务已启动"
- [ ] Network标签显示API请求返回200
- [ ] 首页正常显示轮播图、分类、资源
- [ ] 没有ERR_CONNECTION_REFUSED错误
- [ ] 搜索功能正常工作
- [ ] 资源列表页正常显示

## 总结

修复后的架构：

```
应用启动
  ↓
main.ts (top-level await)
  ↓
初始化Mock服务 (同步)
  ↓
创建Vue应用
  ↓
挂载应用
  ↓
组件发起API请求
  ↓
Mock拦截器处理
  ↓
返回Mock数据
```

**关键点**:
1. ✅ Mock在应用创建前初始化（同步）
2. ✅ 使用top-level await确保顺序
3. ✅ 禁用Vite代理避免冲突
4. ✅ 统一在main.ts中管理Mock
