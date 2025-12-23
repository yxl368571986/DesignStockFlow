# CSRF防护实现指南

## 概述

本文档说明星潮设计平台的CSRF（跨站请求伪造）防护实现方案。

## CSRF攻击原理

CSRF攻击利用用户已登录的身份，诱导用户在不知情的情况下向目标网站发送恶意请求。

**攻击场景示例：**
1. 用户登录了星潮设计平台（www.startide-design.com）
2. 用户访问了恶意网站（evil.com）
3. 恶意网站包含一个隐藏的表单，自动向星潮设计发送请求
4. 由于浏览器会自动携带Cookie，请求会以用户身份执行

## 防护措施

### 1. CSRF Token机制

#### 1.1 Token生成（后端）

后端在用户登录或首次访问时生成CSRF Token：

```javascript
// Node.js示例
const crypto = require('crypto');

// 生成随机Token
const csrfToken = crypto.randomBytes(32).toString('hex');

// 设置到Cookie（允许JavaScript读取）
res.cookie('csrf_token', csrfToken, {
  httpOnly: false,  // 允许JavaScript读取
  secure: true,     // 仅HTTPS传输
  sameSite: 'strict', // 严格同站策略
  maxAge: 24 * 60 * 60 * 1000 // 24小时
});
```

#### 1.2 Token读取（前端）

前端从Cookie中读取CSRF Token：

```typescript
// src/utils/security.ts
import Cookies from 'js-cookie';

export function getCSRFToken(): string | undefined {
  return Cookies.get('csrf_token');
}
```

#### 1.3 Token验证（前端）

在发送请求前验证Token是否存在：

```typescript
// src/utils/security.ts
export function hasValidCSRFToken(): boolean {
  const token = getCSRFToken();
  return !!token && token.length > 0;
}
```

#### 1.4 Token携带（前端）

在所有POST/PUT/DELETE/PATCH请求中携带Token：

```typescript
// src/utils/request.ts
service.interceptors.request.use((config) => {
  const methodsRequiringCSRF = ['post', 'put', 'delete', 'patch'];
  const method = config.method?.toLowerCase();
  
  if (method && methodsRequiringCSRF.includes(method)) {
    if (!hasValidCSRFToken()) {
      ElMessage.warning('安全令牌已过期，请刷新页面后重试');
      return Promise.reject(new Error('CSRF Token missing'));
    }
    
    const csrfToken = getCSRFToken();
    if (csrfToken && config.headers) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }
  }
  
  return config;
});
```

#### 1.5 Token验证（后端）

后端验证请求头中的Token与Cookie中的Token是否一致：

```javascript
// Node.js示例
app.use((req, res, next) => {
  const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (methods.includes(req.method)) {
    const headerToken = req.headers['x-csrf-token'];
    const cookieToken = req.cookies.csrf_token;
    
    if (!headerToken || headerToken !== cookieToken) {
      return res.status(403).json({ 
        code: 403, 
        msg: 'CSRF Token验证失败' 
      });
    }
  }
  
  next();
});
```

### 2. SameSite Cookie属性

设置Cookie的SameSite属性为`strict`，防止跨站请求携带Cookie：

```typescript
// src/utils/security.ts
export function setToken(token: string, rememberMe: boolean = false): void {
  const expires = rememberMe ? 7 : 1;
  Cookies.set('auth_token', token, {
    expires,
    secure: true,
    sameSite: 'strict'  // 严格同站策略
  });
}

export function setCSRFToken(token: string): void {
  Cookies.set('csrf_token', token, {
    secure: true,
    sameSite: 'strict',
    expires: 1
  });
}
```

**SameSite属性说明：**
- `strict`: 完全禁止第三方Cookie，最安全但可能影响用户体验
- `lax`: 允许部分第三方Cookie（如GET请求），平衡安全和体验
- `none`: 允许所有第三方Cookie，需配合`secure`属性

### 3. 请求来源验证

#### 3.1 前端验证（开发辅助）

前端在生产环境验证请求来源：

```typescript
// src/utils/security.ts
export function validateRequestOrigin(allowedOrigins: string[]): boolean {
  const currentOrigin = window.location.origin;
  return allowedOrigins.includes(currentOrigin);
}

export function getAllowedOrigins(): string[] {
  const envOrigins = import.meta.env.VITE_ALLOWED_ORIGINS;
  
  if (envOrigins) {
    return envOrigins.split(',').map((origin: string) => origin.trim());
  }
  
  return [window.location.origin];
}

// src/utils/request.ts
service.interceptors.request.use((config) => {
  if (import.meta.env.PROD) {
    const allowedOrigins = getAllowedOrigins();
    if (!validateRequestOrigin(allowedOrigins)) {
      console.error('请求来源验证失败');
      return Promise.reject(new Error('Invalid request origin'));
    }
  }
  
  return config;
});
```

#### 3.2 后端验证（主要防护）

后端验证请求的Origin和Referer头：

```javascript
// Node.js示例
const allowedOrigins = [
  'https://www.startide-design.com',
  'https://startide-design.com'
];

app.use((req, res, next) => {
  const origin = req.get('origin');
  const referer = req.get('referer');
  
  // 验证Origin
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ 
      code: 403, 
      msg: '请求来源不合法' 
    });
  }
  
  // 验证Referer（可选，作为额外防护）
  if (referer) {
    const refererOrigin = new URL(referer).origin;
    if (!allowedOrigins.includes(refererOrigin)) {
      return res.status(403).json({ 
        code: 403, 
        msg: '请求来源不合法' 
      });
    }
  }
  
  next();
});
```

### 4. 环境变量配置

#### 4.1 开发环境（.env.development）

```bash
# 安全配置 - CSRF防护
VITE_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
```

#### 4.2 生产环境（.env.production）

```bash
# 安全配置 - CSRF防护
VITE_ALLOWED_ORIGINS=https://www.startide-design.com,https://startide-design.com
```

## 使用指南

### 初始化CSRF保护

在应用启动时初始化CSRF保护：

```typescript
// src/main.ts
import { initCSRFProtection } from '@/utils/security';

// 初始化CSRF保护
initCSRFProtection();
```

### API调用示例

使用封装的API方法，CSRF Token会自动添加：

```typescript
// 登录（POST请求，自动携带CSRF Token）
import { post } from '@/utils/request';

const result = await post('/auth/login', {
  phone: '13800138000',
  password: 'encrypted_password'
});

// 上传文件（POST请求，自动携带CSRF Token）
import { upload } from '@/utils/request';

const formData = new FormData();
formData.append('file', file);

const result = await upload('/upload/file', formData, (progress) => {
  console.log(`上传进度: ${progress}%`);
});
```

### 手动验证CSRF Token

在特殊场景下手动验证：

```typescript
import { hasValidCSRFToken } from '@/utils/security';

if (!hasValidCSRFToken()) {
  ElMessage.warning('安全令牌已过期，请刷新页面');
  return;
}

// 继续执行操作
```

## 安全最佳实践

### 1. Token管理

- ✅ CSRF Token有效期设置为24小时
- ✅ Token存储在Cookie中，不使用localStorage
- ✅ Token仅在HTTPS下传输（生产环境）
- ✅ Token不包含敏感信息

### 2. Cookie配置

- ✅ `httpOnly: false` - 允许JavaScript读取CSRF Token
- ✅ `secure: true` - 仅HTTPS传输
- ✅ `sameSite: 'strict'` - 严格同站策略
- ✅ 设置合理的过期时间

### 3. 请求验证

- ✅ 所有修改数据的请求（POST/PUT/DELETE/PATCH）都需要CSRF Token
- ✅ GET请求不需要CSRF Token（符合RESTful规范）
- ✅ 验证请求来源（Origin和Referer）
- ✅ 后端双重验证（Token + Origin）

### 4. 错误处理

- ✅ Token缺失时提示用户刷新页面
- ✅ Token验证失败时返回403错误
- ✅ 记录安全相关的错误日志
- ✅ 不在错误信息中暴露敏感信息

## 测试验证

### 1. 功能测试

```typescript
// 测试CSRF Token获取
import { getCSRFToken, hasValidCSRFToken } from '@/utils/security';

console.log('CSRF Token:', getCSRFToken());
console.log('Token有效:', hasValidCSRFToken());
```

### 2. 请求测试

```typescript
// 测试POST请求携带CSRF Token
import { post } from '@/utils/request';

// 查看请求头
const result = await post('/test/api', { data: 'test' });
// 检查Network面板，确认请求头包含 X-CSRF-TOKEN
```

### 3. 安全测试

**测试场景1：缺少CSRF Token**
```bash
# 使用curl测试（不带CSRF Token）
curl -X POST https://api.startide-design.com/api/test \
  -H "Content-Type: application/json" \
  -d '{"data":"test"}'

# 预期结果：403 Forbidden
```

**测试场景2：错误的CSRF Token**
```bash
# 使用curl测试（错误的Token）
curl -X POST https://api.startide-design.com/api/test \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: invalid_token" \
  -d '{"data":"test"}'

# 预期结果：403 Forbidden
```

**测试场景3：跨站请求**
```html
<!-- 在恶意网站上尝试发起请求 -->
<form action="https://api.startide-design.com/api/test" method="POST">
  <input type="hidden" name="data" value="malicious" />
  <input type="submit" value="Submit" />
</form>

<!-- 预期结果：请求被SameSite策略阻止，或被后端拒绝 -->
```

## 常见问题

### Q1: 为什么CSRF Token的httpOnly设置为false？

A: CSRF Token需要被JavaScript读取并添加到请求头中，所以必须设置为`httpOnly: false`。而认证Token（auth_token）应该设置为`httpOnly: true`以防止XSS攻击窃取。

### Q2: GET请求需要CSRF Token吗？

A: 不需要。根据RESTful规范，GET请求应该是幂等的，不应该修改服务器状态。CSRF防护主要针对会修改数据的请求（POST/PUT/DELETE/PATCH）。

### Q3: 如果用户刷新页面，CSRF Token会丢失吗？

A: 不会。CSRF Token存储在Cookie中，刷新页面后Cookie依然存在。只有在Token过期或用户清除Cookie时才会丢失。

### Q4: SameSite设置为strict会影响第三方登录吗？

A: 可能会。如果使用第三方登录（如微信、QQ），可能需要将SameSite设置为`lax`。但对于CSRF Token，建议保持`strict`以获得最佳安全性。

### Q5: 前端验证请求来源有什么用？

A: 前端验证主要用于开发阶段的辅助检查，真正的安全防护在后端。前端验证可以提前发现配置错误，避免无效请求。

## 相关文档

- [XSS防护指南](./XSS_PROTECTION_GUIDE.md)
- [安全检查清单](./security-checklist.md)
- [API接口文档](./api-contract.md)

## 更新日志

- 2024-12-20: 完成CSRF防护实现
  - ✅ CSRF Token获取和验证
  - ✅ SameSite Cookie配置
  - ✅ 请求来源验证
  - ✅ 环境变量配置
  - ✅ 文档编写
