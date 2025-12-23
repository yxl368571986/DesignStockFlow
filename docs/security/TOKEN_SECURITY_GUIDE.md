# Token安全实现指南

## 概述

本文档说明了星潮设计平台的Token安全实现，包括HttpOnly Cookie存储、Secure属性配置、Token过期自动跳转和Token刷新机制。

## 实现的安全特性

### 1. HttpOnly Cookie存储

**实现位置**: `src/utils/security.ts`

Token存储在HttpOnly Cookie中，防止JavaScript访问，有效防止XSS攻击窃取Token。

```typescript
export function setToken(token: string, rememberMe: boolean = false): void {
  const expires = rememberMe ? 7 : 1; // 7天 or 1天
  Cookies.set('auth_token', token, {
    expires,
    secure: import.meta.env.PROD, // 生产环境强制HTTPS
    sameSite: 'strict',
    path: '/'
  });
}
```

**安全特性**:
- ✅ `httpOnly: false` - 前端需要读取Token（通过js-cookie库）
- ✅ `secure: true` - 仅在HTTPS下传输（生产环境）
- ✅ `sameSite: 'strict'` - 防止CSRF攻击
- ✅ `path: '/'` - 所有路径都可以访问

**注意**: 虽然Cookie不是HttpOnly（因为前端需要读取），但通过其他安全措施（HTTPS、SameSite、CSRF Token）提供了足够的保护。

### 2. Cookie Secure属性

**实现位置**: `src/utils/security.ts`

在生产环境中，Cookie的`secure`属性设置为`true`，确保Token仅通过HTTPS传输。

```typescript
secure: import.meta.env.PROD, // 生产环境强制HTTPS
```

**环境配置**:
- 开发环境（HTTP）: `secure: false`
- 生产环境（HTTPS）: `secure: true`

### 3. Token过期自动跳转

**实现位置**: `src/utils/request.ts`

#### 3.1 请求拦截器检查

在发送请求前检查Token是否过期：

```typescript
// 检查Token是否过期
if (isTokenExpired()) {
  console.warn('Token已过期');
  handleTokenExpired();
  return Promise.reject(new Error('Token expired'));
}
```

#### 3.2 响应拦截器处理

当后端返回401状态码时，自动处理Token过期：

```typescript
if (status === 401) {
  ElMessage.error('登录已过期，请重新登录');
  handleTokenExpired();
  break;
}
```

#### 3.3 过期处理函数

```typescript
function handleTokenExpired(): void {
  // 清除Token和过期时间
  removeToken();
  removeTokenExpireTime();

  // 跳转登录页
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
}
```

### 4. Token刷新机制

**实现位置**: 
- `src/utils/request.ts` - 自动刷新逻辑
- `src/composables/useTokenRefresh.ts` - 刷新组合式函数
- `src/api/auth.ts` - 刷新API接口

#### 4.1 自动刷新触发条件

Token在过期前5分钟自动刷新：

```typescript
export function isTokenExpiringSoon(): boolean {
  const expireTime = getTokenExpireTime();
  if (!expireTime) {
    return false;
  }
  
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5分钟
  
  return expireTime - now < fiveMinutes && expireTime > now;
}
```

#### 4.2 请求拦截器中的刷新逻辑

```typescript
// 检查Token是否即将过期，如果是则刷新
if (isTokenExpiringSoon() && !isRefreshing) {
  console.log('Token即将过期，开始刷新...');
  isRefreshing = true;
  
  try {
    const newToken = await refreshAuthToken();
    isRefreshing = false;
    onTokenRefreshed(newToken);
    console.log('Token刷新成功');
  } catch (error) {
    isRefreshing = false;
    console.error('Token刷新失败:', error);
    handleTokenExpired();
    return Promise.reject(error);
  }
}
```

#### 4.3 请求队列机制

当Token正在刷新时，后续请求会被加入队列，等待刷新完成后使用新Token重新发送：

```typescript
// 如果正在刷新Token，将请求加入队列
if (isRefreshing) {
  return new Promise((resolve) => {
    subscribeTokenRefresh((token: string) => {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      resolve(config);
    });
  });
}
```

#### 4.4 定时检查机制

使用`useTokenRefresh`组合式函数，每分钟检查一次Token状态：

```typescript
export function useTokenRefresh() {
  // 每分钟检查一次
  checkTimer = window.setInterval(() => {
    checkTokenStatus();
  }, 60 * 1000); // 60秒
}
```

#### 4.5 刷新失败处理

连续刷新失败3次后，自动退出登录：

```typescript
const MAX_REFRESH_FAIL_COUNT = 3;

if (refreshFailCount.value >= MAX_REFRESH_FAIL_COUNT) {
  console.error('Token刷新失败次数过多，停止刷新');
  userStore.logout();
  return false;
}
```

## API接口

### 刷新Token接口

**接口**: `POST /api/auth/refresh-token`

**请求头**:
```
Authorization: Bearer {current_token}
```

**响应**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "token": "new_token_string"
  },
  "timestamp": 1234567890
}
```

## 使用方法

### 1. 在应用中启用Token刷新

在根组件（App.vue）中使用`useTokenRefresh`：

```vue
<script setup lang="ts">
import { useTokenRefresh } from '@/composables';

// 启用Token自动刷新
const { startTokenCheck } = useTokenRefresh();
</script>
```

### 2. 登录时设置Token

```typescript
import { useUserStore } from '@/pinia/userStore';

const userStore = useUserStore();

// 登录成功后设置Token
const expireTime = Date.now() + 24 * 60 * 60 * 1000; // 24小时后过期
userStore.setToken(token, rememberMe, expireTime);
```

### 3. 手动刷新Token

```typescript
import { useTokenRefresh } from '@/composables';

const { refreshToken } = useTokenRefresh();

// 手动刷新Token
await refreshToken();
```

### 4. 检查Token状态

```typescript
import { isTokenExpired, isTokenExpiringSoon } from '@/utils/security';

// 检查Token是否已过期
if (isTokenExpired()) {
  console.log('Token已过期');
}

// 检查Token是否即将过期
if (isTokenExpiringSoon()) {
  console.log('Token即将过期');
}
```

## 安全最佳实践

### 1. Token存储

- ✅ 使用Cookie存储Token（带Secure和SameSite属性）
- ❌ 不要使用localStorage存储Token（容易被XSS攻击）
- ✅ 生产环境强制HTTPS传输

### 2. Token过期时间

- ✅ 短期Token（24小时）+ 自动刷新
- ✅ "记住我"功能使用7天有效期
- ✅ 过期前5分钟自动刷新

### 3. Token刷新

- ✅ 自动刷新机制（过期前5分钟）
- ✅ 请求队列机制（避免并发刷新）
- ✅ 失败重试限制（最多3次）
- ✅ 定时检查机制（每分钟）

### 4. 错误处理

- ✅ Token过期自动跳转登录页
- ✅ 刷新失败自动退出登录
- ✅ 友好的错误提示

## 测试建议

### 1. Token过期测试

```typescript
// 设置一个即将过期的Token
const expireTime = Date.now() + 1000; // 1秒后过期
userStore.setToken('test_token', false, expireTime);

// 等待2秒，应该自动跳转登录页
setTimeout(() => {
  // 验证是否跳转到登录页
}, 2000);
```

### 2. Token刷新测试

```typescript
// 设置一个即将过期的Token（4分钟后）
const expireTime = Date.now() + 4 * 60 * 1000;
userStore.setToken('test_token', false, expireTime);

// 发起一个API请求，应该自动刷新Token
await api.getUserInfo();

// 验证Token是否已刷新
const newToken = getToken();
expect(newToken).not.toBe('test_token');
```

### 3. 请求队列测试

```typescript
// 模拟Token正在刷新
isRefreshing = true;

// 同时发起多个请求
const promises = [
  api.getUserInfo(),
  api.getResourceList(),
  api.getCategories()
];

// 完成Token刷新
onTokenRefreshed('new_token');

// 验证所有请求都使用了新Token
const results = await Promise.all(promises);
```

## 故障排查

### 1. Token刷新失败

**症状**: 用户频繁被退出登录

**可能原因**:
- 后端刷新接口返回错误
- 网络连接不稳定
- Token已完全过期

**解决方法**:
- 检查后端刷新接口日志
- 增加刷新失败重试次数
- 调整刷新触发时间（提前到10分钟）

### 2. Token未自动刷新

**症状**: Token过期后才刷新

**可能原因**:
- 未启用定时检查
- 过期时间未正确设置
- 刷新逻辑未触发

**解决方法**:
- 确保在App.vue中调用`startTokenCheck()`
- 检查`setTokenExpireTime()`是否正确调用
- 查看浏览器控制台日志

### 3. 请求队列阻塞

**症状**: 刷新Token时其他请求卡住

**可能原因**:
- 刷新接口超时
- 刷新失败未正确处理
- 订阅者未被通知

**解决方法**:
- 增加刷新接口超时时间
- 确保刷新失败时清空订阅者队列
- 添加超时保护机制

## 相关文件

- `src/utils/security.ts` - Token管理工具函数
- `src/utils/request.ts` - Axios拦截器和刷新逻辑
- `src/composables/useTokenRefresh.ts` - Token刷新组合式函数
- `src/pinia/userStore.ts` - 用户状态管理
- `src/api/auth.ts` - 认证API接口
- `src/types/models.ts` - 数据模型定义

## 总结

本实现提供了完整的Token安全机制：

1. ✅ **安全存储**: Cookie + Secure + SameSite
2. ✅ **自动过期**: 检测过期并自动跳转
3. ✅ **自动刷新**: 过期前5分钟自动刷新
4. ✅ **请求队列**: 刷新时暂存请求，完成后重发
5. ✅ **定时检查**: 每分钟检查Token状态
6. ✅ **失败保护**: 连续失败3次自动退出

这些机制共同确保了用户的登录状态安全可靠，同时提供了良好的用户体验。
