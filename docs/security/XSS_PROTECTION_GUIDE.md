# XSS防护实施指南

## 概述

本文档详细说明了星潮设计资源平台的XSS（跨站脚本攻击）防护措施的实施情况和使用指南。

## 实施状态

✅ **已完成** - 所有XSS防护措施已全部实施

## 防护措施清单

### 1. ✅ 配置xss和DOMPurify库

**状态**: 已安装并配置

**依赖包**:
- `xss`: ^1.0.14 - 用于过滤用户输入
- `dompurify`: ^3.0.0 - 用于净化HTML内容
- `isomorphic-dompurify`: ^2.34.0 - 服务端渲染支持

**安装位置**: `package.json`

### 2. ✅ 过滤所有用户输入（sanitizeInput）

**实现位置**: `src/utils/security.ts`

**函数签名**:
```typescript
export function sanitizeInput(input: string): string
```

**功能说明**:
- 使用xss库过滤用户输入
- 仅允许安全的HTML标签（p, br, strong, em）
- 移除所有script和style标签及其内容
- 移除事件属性（onclick, onerror等）

**配置详情**:
```typescript
xss(input, {
  whiteList: {
    p: [],
    br: [],
    strong: [],
    em: []
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
});
```

**使用场景**:
- 用户注册/登录时的输入
- 搜索关键词
- 评论内容
- 资源描述
- 任何用户可输入的文本字段

**使用示例**:
```typescript
import { sanitizeInput } from '@/utils/security';

// 在表单提交前过滤
const userInput = '<script>alert("xss")</script>Hello';
const safeInput = sanitizeInput(userInput);
// 结果: 'Hello'

// 在API调用前过滤
const formData = {
  title: sanitizeInput(form.title),
  description: sanitizeInput(form.description),
  tags: form.tags.map(tag => sanitizeInput(tag))
};
```

### 3. ✅ 净化HTML内容（sanitizeHTML）

**实现位置**: `src/utils/security.ts`

**函数签名**:
```typescript
export function sanitizeHTML(html: string): string
```

**功能说明**:
- 使用DOMPurify库净化HTML内容
- 允许更多的HTML标签（p, br, strong, em, a, ul, ol, li）
- 仅允许安全的属性（href, title, target）
- 禁止data-*属性
- 移除所有危险的标签和属性

**配置详情**:
```typescript
DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'title', 'target'],
  ALLOW_DATA_ATTR: false
});
```

**使用场景**:
- 富文本编辑器内容
- 用户生成的HTML内容
- 从后端接收的HTML内容
- 任何需要使用v-html渲染的内容

**使用示例**:
```vue
<template>
  <!-- ❌ 危险：未净化的HTML -->
  <div v-html="userContent"></div>

  <!-- ✅ 安全：净化后的HTML -->
  <div v-html="sanitizeHTML(userContent)"></div>
</template>

<script setup lang="ts">
import { sanitizeHTML } from '@/utils/security';

const userContent = ref('<p>Hello</p><script>alert("xss")</script>');
// sanitizeHTML(userContent.value) 结果: '<p>Hello</p>'
</script>
```

### 4. ✅ 配置Content Security Policy

**实施位置**: 
- `index.html` - 前端CSP meta标签
- `nginx.conf.example` - 服务器CSP响应头

#### 4.1 前端CSP配置（index.html）

**配置内容**:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               font-src 'self' data:; 
               connect-src 'self' https://api.startide-design.com https://cdn.startide-design.com; 
               frame-ancestors 'none';">
```

**策略说明**:
- `default-src 'self'`: 默认只允许同源资源
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'`: 允许同源脚本、内联脚本和eval（Vue需要）
- `style-src 'self' 'unsafe-inline'`: 允许同源样式和内联样式
- `img-src 'self' data: https:`: 允许同源图片、data URI和HTTPS图片
- `font-src 'self' data:`: 允许同源字体和data URI字体
- `connect-src 'self' https://api.startide-design.com https://cdn.startide-design.com`: 允许连接到指定的API和CDN
- `frame-ancestors 'none'`: 禁止被嵌入iframe（防止点击劫持）

#### 4.2 服务器CSP配置（nginx.conf.example）

**配置内容**:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.startide-design.com; frame-ancestors 'none';" always;
```

**优势**:
- 服务器级别的CSP更安全（无法被前端修改）
- 支持报告模式（report-uri）
- 可以针对不同路径设置不同策略

**生产环境建议**:
```nginx
# 严格模式（移除unsafe-inline和unsafe-eval）
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.startide-design.com; frame-ancestors 'none'; report-uri /csp-report;" always;
```

### 5. ✅ 避免使用v-html（或使用净化后的内容）

**实施状态**: 已修复所有v-html使用

**修复位置**: `src/components/business/SearchBar.vue`

**修复前**:
```vue
<span class="item-text" v-html="suggestion"></span>
```

**修复后**:
```vue
<span class="item-text" v-html="sanitizeHTML(suggestion)"></span>
```

**最佳实践**:

1. **优先使用文本插值**:
```vue
<!-- ✅ 推荐：自动转义 -->
<div>{{ userInput }}</div>

<!-- ❌ 避免：不转义 -->
<div v-html="userInput"></div>
```

2. **必须使用v-html时，先净化**:
```vue
<template>
  <div v-html="sanitizeHTML(richTextContent)"></div>
</template>

<script setup lang="ts">
import { sanitizeHTML } from '@/utils/security';
</script>
```

3. **使用组件代替HTML**:
```vue
<!-- ❌ 不推荐 -->
<div v-html="'<strong>' + text + '</strong>'"></div>

<!-- ✅ 推荐 -->
<strong>{{ text }}</strong>
```

## 其他安全措施

### 6. URL参数编码

**实现位置**: `src/utils/security.ts`

**函数**:
```typescript
export function encodeURL(url: string): string {
  return encodeURIComponent(url);
}
```

**使用场景**:
```typescript
// 构建搜索URL
const searchUrl = `/search?keyword=${encodeURL(userInput)}`;

// 构建分享链接
const shareUrl = `https://example.com/share?url=${encodeURL(currentUrl)}`;
```

### 7. 文件名安全处理

**实现位置**: `src/utils/security.ts`

**函数**:
```typescript
export function sanitizeFileName(fileName: string): string
```

**功能**:
- 移除路径分隔符（/ \）
- 移除特殊字符（< > : " | ? *）
- 限制文件名长度（最大255字符）

**使用场景**:
```typescript
// 上传文件前处理文件名
const safeFileName = sanitizeFileName(file.name);
```

### 8. 敏感信息脱敏

**实现位置**: `src/utils/security.ts`

**函数**:
- `maskPhone(phone: string)`: 手机号脱敏（138****1234）
- `maskEmail(email: string)`: 邮箱脱敏（abc***@example.com）
- `maskIdCard(idCard: string)`: 身份证号脱敏（1234**********5678）

**使用场景**:
```vue
<template>
  <!-- 显示脱敏后的手机号 -->
  <div>{{ maskPhone(userInfo.phone) }}</div>
  
  <!-- 显示脱敏后的邮箱 -->
  <div>{{ maskEmail(userInfo.email) }}</div>
</template>

<script setup lang="ts">
import { maskPhone, maskEmail } from '@/utils/security';
</script>
```

## 安全检查清单

在开发过程中，请确保：

- [ ] 所有用户输入都经过`sanitizeInput()`过滤
- [ ] 所有使用`v-html`的地方都使用`sanitizeHTML()`净化
- [ ] URL参数使用`encodeURL()`编码
- [ ] 文件名使用`sanitizeFileName()`处理
- [ ] 敏感信息使用脱敏函数处理
- [ ] 不在前端代码中硬编码敏感信息
- [ ] 不使用`eval()`或`Function()`执行动态代码
- [ ] 不使用`innerHTML`直接设置HTML
- [ ] CSP策略已正确配置
- [ ] 生产环境使用HTTPS

## 测试验证

### 手动测试

1. **XSS注入测试**:
```javascript
// 测试输入
const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  '<svg onload=alert("xss")>',
  'javascript:alert("xss")',
  '<iframe src="javascript:alert(\'xss\')"></iframe>'
];

// 验证每个payload都被正确过滤
xssPayloads.forEach(payload => {
  const safe = sanitizeInput(payload);
  console.log('Input:', payload);
  console.log('Output:', safe);
  console.log('Safe:', !safe.includes('script') && !safe.includes('onerror'));
});
```

2. **CSP测试**:
- 打开浏览器开发者工具
- 查看Console是否有CSP违规警告
- 尝试执行内联脚本（应该被阻止）

3. **v-html测试**:
- 在搜索框输入`<script>alert("xss")</script>`
- 验证搜索建议中不会执行脚本
- 验证显示的是纯文本或净化后的HTML

### 自动化测试

参考 `src/utils/__test__/security.test.ts` 中的单元测试。

## 常见问题

### Q1: 为什么CSP配置中包含'unsafe-inline'和'unsafe-eval'？

**A**: Vue 3和Element Plus在开发模式下需要这些权限。生产环境建议：
- 使用nonce或hash代替'unsafe-inline'
- 使用预编译模板避免'unsafe-eval'
- 配置更严格的CSP策略

### Q2: sanitizeInput和sanitizeHTML有什么区别？

**A**: 
- `sanitizeInput`: 用于纯文本输入，只保留最基本的格式标签
- `sanitizeHTML`: 用于富文本内容，允许更多的HTML标签和属性

### Q3: 如何处理第三方脚本（如统计代码）？

**A**: 
1. 在CSP中添加第三方域名到script-src
2. 使用nonce或hash验证脚本
3. 优先使用官方SDK而非直接嵌入脚本

### Q4: 如何在生产环境收集CSP违规报告？

**A**: 
1. 配置report-uri或report-to指令
2. 设置后端接口接收报告
3. 分析报告并调整CSP策略

## 参考资源

- [OWASP XSS Prevention Cheat Sheet](https://cheats.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [xss Library Documentation](https://github.com/leizongmin/js-xss)

## 更新日志

- **2024-12-20**: 初始版本，完成所有XSS防护措施
  - 配置xss和DOMPurify库
  - 实现sanitizeInput和sanitizeHTML函数
  - 配置CSP策略（前端和服务器）
  - 修复SearchBar组件v-html使用
  - 添加URL编码和文件名安全处理
  - 实现敏感信息脱敏

## 维护建议

1. **定期更新依赖**:
   - 每月检查xss和DOMPurify的安全更新
   - 及时修复已知漏洞

2. **代码审查**:
   - 新增v-html使用必须经过审查
   - 确保所有用户输入都经过过滤

3. **安全测试**:
   - 定期进行渗透测试
   - 使用自动化工具扫描XSS漏洞

4. **监控和响应**:
   - 监控CSP违规报告
   - 建立安全事件响应流程
