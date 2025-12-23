# CSRF防护验证清单

## 实现完成情况

### ✅ 1. CSRF Token管理

- [x] **getCSRFToken()** - 从Cookie读取CSRF Token
- [x] **setCSRFToken()** - 设置CSRF Token到Cookie
- [x] **removeCSRFToken()** - 移除CSRF Token
- [x] **hasValidCSRFToken()** - 验证Token是否存在且有效
- [x] **initCSRFProtection()** - 初始化CSRF保护

### ✅ 2. Cookie安全配置

- [x] **secure: true** - 仅HTTPS传输（生产环境）
- [x] **sameSite: 'strict'** - 严格同站策略
- [x] **httpOnly: false** - 允许JavaScript读取（CSRF Token需要）
- [x] **expires: 1** - 1天有效期

### ✅ 3. 请求拦截器增强

- [x] **请求来源验证** - 验证Origin是否在允许列表中
- [x] **CSRF Token强制验证** - POST/PUT/DELETE/PATCH必须携带Token
- [x] **Token缺失处理** - 提示用户刷新页面
- [x] **自动添加请求头** - X-CSRF-TOKEN, Origin, Referer

### ✅ 4. 环境变量配置

- [x] **.env.example** - 添加VITE_ALLOWED_ORIGINS配置示例
- [x] **.env.development** - 开发环境配置
- [x] **.env.production** - 生产环境配置

### ✅ 5. 文档

- [x] **CSRF_PROTECTION_GUIDE.md** - 完整的实现指南
- [x] **TASK_61_CSRF_PROTECTION_SUMMARY.md** - 任务总结
- [x] **CSRF_VERIFICATION_CHECKLIST.md** - 验证清单

## 功能验证

### 测试场景1：CSRF Token获取

```typescript
import { getCSRFToken, hasValidCSRFToken } from '@/utils/security';

// 测试Token获取
console.log('CSRF Token:', getCSRFToken());

// 测试Token验证
console.log('Token有效:', hasValidCSRFToken());
```

**预期结果：**
- 如果Cookie中有csrf_token，应该返回Token字符串
- hasValidCSRFToken()应该返回true

### 测试场景2：POST请求自动携带Token

```typescript
import { post } from '@/utils/request';

// 发送POST请求
const result = await post('/api/test', { data: 'test' });
```

**验证步骤：**
1. 打开浏览器开发者工具
2. 切换到Network标签
3. 发送POST请求
4. 查看请求头，确认包含：
   - `X-CSRF-TOKEN: <token_value>`
   - `X-Requested-With: XMLHttpRequest`
   - `Origin: <current_origin>`
   - `Referer: <current_url>`

### 测试场景3：Token缺失时的处理

```typescript
// 手动删除CSRF Token
import Cookies from 'js-cookie';
Cookies.remove('csrf_token');

// 尝试发送POST请求
import { post } from '@/utils/request';
await post('/api/test', { data: 'test' });
```

**预期结果：**
- 显示警告提示："安全令牌已过期，请刷新页面后重试"
- 请求被拒绝，不会发送到后端

### 测试场景4：GET请求不需要Token

```typescript
import { get } from '@/utils/request';

// 发送GET请求
const result = await get('/api/test');
```

**预期结果：**
- GET请求正常发送
- 请求头中不包含X-CSRF-TOKEN（符合RESTful规范）

### 测试场景5：请求来源验证（生产环境）

在生产环境下，修改VITE_ALLOWED_ORIGINS为不包含当前域名的值：

```bash
# .env.production
VITE_ALLOWED_ORIGINS=https://other-domain.com
```

**预期结果：**
- 请求被拒绝
- 控制台显示："请求来源验证失败"

## 后端配置验证

### 1. CSRF Token生成接口

后端需要提供一个接口用于生成CSRF Token：

```javascript
// GET /api/csrf-token
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
  
  res.json({ code: 200, msg: 'success' });
});
```

**验证步骤：**
1. 访问 `/api/csrf-token`
2. 检查响应的Set-Cookie头
3. 确认Cookie包含csrf_token

### 2. CSRF Token验证中间件

后端需要验证所有修改数据的请求：

```javascript
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

**验证步骤：**
1. 发送POST请求，不带X-CSRF-TOKEN头
2. 预期返回403错误
3. 发送POST请求，带错误的Token
4. 预期返回403错误
5. 发送POST请求，带正确的Token
6. 预期请求成功

### 3. Origin验证中间件

```javascript
const allowedOrigins = [
  'https://www.startide-design.com',
  'https://startide-design.com'
];

app.use((req, res, next) => {
  const origin = req.get('origin');
  
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ 
      code: 403, 
      msg: '请求来源不合法' 
    });
  }
  
  next();
});
```

**验证步骤：**
1. 使用curl从不同origin发送请求
2. 预期被拒绝

## 安全测试

### 测试1：跨站请求伪造攻击

创建一个恶意HTML页面：

```html
<!DOCTYPE html>
<html>
<head>
  <title>恶意网站</title>
</head>
<body>
  <h1>恶意网站</h1>
  <form id="maliciousForm" action="https://api.startide-design.com/api/test" method="POST">
    <input type="hidden" name="data" value="malicious" />
  </form>
  <script>
    // 自动提交表单
    document.getElementById('maliciousForm').submit();
  </script>
</body>
</html>
```

**预期结果：**
- 请求被SameSite Cookie策略阻止
- 或者后端验证失败（缺少CSRF Token）

### 测试2：Token窃取尝试

尝试通过XSS窃取CSRF Token：

```javascript
// 恶意脚本
console.log(document.cookie);
```

**预期结果：**
- 可以读取csrf_token（因为httpOnly: false）
- 但无法读取auth_token（因为httpOnly: true）
- 这是正常的，CSRF Token需要被JavaScript读取

### 测试3：重放攻击

1. 捕获一个合法的POST请求
2. 重放该请求

**预期结果：**
- 如果Token未过期，请求可能成功（这是正常的）
- 如果Token已过期，请求被拒绝
- 建议后端实现Token一次性使用机制

## 性能测试

### 测试1：请求延迟

测量添加CSRF验证后的请求延迟：

```javascript
console.time('POST Request');
await post('/api/test', { data: 'test' });
console.timeEnd('POST Request');
```

**预期结果：**
- 延迟增加 < 1ms
- 对用户体验无影响

### 测试2：并发请求

同时发送100个POST请求：

```javascript
const promises = [];
for (let i = 0; i < 100; i++) {
  promises.push(post('/api/test', { data: `test${i}` }));
}
await Promise.all(promises);
```

**预期结果：**
- 所有请求都正确携带CSRF Token
- 无性能问题

## 兼容性测试

### 浏览器兼容性

测试以下浏览器：

- [x] Chrome 90+
- [x] Firefox 88+
- [x] Safari 14+
- [x] Edge 90+
- [x] 移动端浏览器（iOS Safari, Chrome Mobile）

**预期结果：**
- 所有现代浏览器都支持SameSite Cookie
- CSRF防护正常工作

### IE11兼容性

IE11不支持SameSite属性：

**处理方案：**
- 依赖CSRF Token验证
- 后端强制验证Origin
- 考虑不支持IE11

## 问题排查

### 问题1：Token一直显示缺失

**可能原因：**
- 后端未设置csrf_token Cookie
- Cookie被浏览器阻止（第三方Cookie设置）
- Cookie域名不匹配

**排查步骤：**
1. 检查浏览器开发者工具 → Application → Cookies
2. 确认csrf_token是否存在
3. 检查Cookie的Domain和Path属性

### 问题2：请求被拒绝（403）

**可能原因：**
- CSRF Token不匹配
- Origin不在允许列表中
- Token已过期

**排查步骤：**
1. 检查请求头中的X-CSRF-TOKEN
2. 检查Cookie中的csrf_token
3. 确认两者是否一致
4. 检查VITE_ALLOWED_ORIGINS配置

### 问题3：开发环境正常，生产环境失败

**可能原因：**
- HTTPS配置问题
- VITE_ALLOWED_ORIGINS配置错误
- 后端CORS配置问题

**排查步骤：**
1. 确认生产环境使用HTTPS
2. 检查.env.production配置
3. 检查后端CORS配置

## 后续优化建议

### 1. Token自动刷新

实现Token即将过期时自动刷新：

```typescript
// 检查Token是否即将过期
function isTokenExpiringSoon(): boolean {
  // 实现逻辑
}

// 自动刷新Token
if (isTokenExpiringSoon()) {
  await refreshCSRFToken();
}
```

### 2. 双Token机制

实现Cookie Token + LocalStorage Token双重验证：

```typescript
// 设置双Token
setCSRFToken(token); // Cookie
localStorage.setItem('csrf_verify', token); // LocalStorage

// 验证时比对两者
function validateDoubleToken(): boolean {
  const cookieToken = getCSRFToken();
  const storageToken = localStorage.getItem('csrf_verify');
  return cookieToken === storageToken;
}
```

### 3. 请求签名

对高安全要求的接口添加签名：

```typescript
function generateSignature(data: any, timestamp: number, nonce: string): string {
  const str = JSON.stringify(data) + timestamp + nonce;
  return CryptoJS.SHA256(str).toString();
}

// 添加到请求头
config.headers['X-Signature'] = generateSignature(data, timestamp, nonce);
config.headers['X-Timestamp'] = timestamp;
config.headers['X-Nonce'] = nonce;
```

### 4. 安全事件监控

添加安全事件监控和告警：

```typescript
// 监控CSRF验证失败
function logSecurityEvent(event: string, details: any) {
  // 发送到监控系统
  console.warn('[Security Event]', event, details);
}

// 在拦截器中使用
if (!hasValidCSRFToken()) {
  logSecurityEvent('CSRF_TOKEN_MISSING', {
    url: config.url,
    method: config.method,
    timestamp: Date.now()
  });
}
```

## 总结

### 已完成

- ✅ CSRF Token管理（获取、设置、验证）
- ✅ Cookie安全配置（SameSite、Secure）
- ✅ 请求拦截器增强（Token验证、来源验证）
- ✅ 环境变量配置
- ✅ 完整文档

### 待完成（后端）

- ⏳ CSRF Token生成接口
- ⏳ CSRF Token验证中间件
- ⏳ Origin验证中间件
- ⏳ 安全日志记录

### 建议优化

- 💡 Token自动刷新机制
- 💡 双Token验证
- 💡 请求签名
- 💡 安全事件监控

## 相关文档

- [CSRF防护指南](./CSRF_PROTECTION_GUIDE.md)
- [任务总结](./TASK_61_CSRF_PROTECTION_SUMMARY.md)
- [XSS防护指南](./XSS_PROTECTION_GUIDE.md)
- [安全检查清单](./.kiro/specs/design-resource-platform/security-checklist.md)
