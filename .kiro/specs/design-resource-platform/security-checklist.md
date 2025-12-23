# 前端安全配置清单

## 说明

本文档列出前端项目必须实施的安全措施，确保代码严格、规范、简洁且安全。

---

## 1. 项目初始化安全配置

### 1.1 依赖安全

```bash
# 安装核心安全依赖
pnpm add xss dompurify js-cookie crypto-js

# 安装类型定义
pnpm add -D @types/dompurify @types/js-cookie

# 定期检查依赖漏洞
pnpm audit
pnpm audit fix

# 使用 npm-check-updates 更新依赖
pnpm add -D npm-check-updates
npx ncu -u
```

### 1.2 TypeScript严格模式配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,                    // 启用所有严格类型检查
    "noImplicitAny": true,             // 禁止隐式any
    "strictNullChecks": true,          // 严格空值检查
    "strictFunctionTypes": true,       // 严格函数类型检查
    "noUnusedLocals": true,            // 检查未使用的局部变量
    "noUnusedParameters": true,        // 检查未使用的参数
    "noImplicitReturns": true,         // 检查函数返回值
    "noFallthroughCasesInSwitch": true // 检查switch语句
  }
}
```

### 1.3 ESLint安全规则

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/typescript/recommended',
    'plugin:security/recommended'  // 安全规则插件
  ],
  rules: {
    // 禁止使用eval
    'no-eval': 'error',
    // 禁止使用with
    'no-with': 'error',
    // 禁止使用console（生产环境）
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // 禁止使用debugger（生产环境）
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // 禁止使用alert
    'no-alert': 'error',
    // 要求使用===和!==
    'eqeqeq': ['error', 'always'],
    // 禁止使用var
    'no-var': 'error',
    // 优先使用const
    'prefer-const': 'error',
    // TypeScript相关
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn'
  }
}
```

---

## 2. XSS防护实现

### 2.1 输入过滤工具函数

```typescript
// utils/security.ts
import xss from 'xss';
import DOMPurify from 'dompurify';

/**
 * XSS过滤 - 用于普通文本输入
 * @param input 用户输入
 * @returns 过滤后的安全文本
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return xss(input);
}

/**
 * HTML净化 - 用于富文本内容
 * @param html HTML内容
 * @returns 净化后的安全HTML
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target'],
    ALLOW_DATA_ATTR: false
  });
}

/**
 * URL编码
 * @param url URL字符串
 * @returns 编码后的URL
 */
export function encodeURL(url: string): string {
  return encodeURIComponent(url);
}

/**
 * 移除HTML标签
 * @param html HTML字符串
 * @returns 纯文本
 */
export function stripHTML(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
```

### 2.2 Vue组件中使用

```vue
<template>
  <div>
    <!-- 安全渲染用户输入 -->
    <p>{{ sanitizedText }}</p>
    
    <!-- 安全渲染HTML（必须使用v-html时） -->
    <div v-html="sanitizedHTML"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { sanitizeInput, sanitizeHTML } from '@/utils/security';

const props = defineProps<{
  userInput: string;
  htmlContent: string;
}>();

// 过滤用户输入
const sanitizedText = computed(() => sanitizeInput(props.userInput));

// 净化HTML内容
const sanitizedHTML = computed(() => sanitizeHTML(props.htmlContent));
</script>
```

---

## 3. CSRF防护实现

### 3.1 CSRF Token管理

```typescript
// utils/security.ts
import Cookies from 'js-cookie';

const CSRF_TOKEN_KEY = 'XSRF-TOKEN';

/**
 * 获取CSRF Token
 * @returns CSRF Token
 */
export function getCSRFToken(): string | undefined {
  return Cookies.get(CSRF_TOKEN_KEY);
}

/**
 * 设置CSRF Token
 * @param token CSRF Token
 */
export function setCSRFToken(token: string): void {
  Cookies.set(CSRF_TOKEN_KEY, token, {
    secure: true,      // 仅HTTPS传输
    sameSite: 'strict' // 严格同站策略
  });
}
```

### 3.2 Axios拦截器配置

```typescript
// utils/request.ts
import axios from 'axios';
import { getCSRFToken } from './security';

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true // 允许携带Cookie
});

// 请求拦截器 - 添加CSRF Token
service.interceptors.request.use(
  (config) => {
    const csrfToken = getCSRFToken();
    if (csrfToken && config.headers) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

---

## 4. 认证Token安全管理

### 4.1 Token存储（使用HttpOnly Cookie）

```typescript
// utils/security.ts
import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';

/**
 * 获取Token（从HttpOnly Cookie）
 * 注意：前端无法直接读取HttpOnly Cookie，这里是示例
 * 实际Token由后端设置在HttpOnly Cookie中
 */
export function getToken(): string | undefined {
  // 如果后端使用HttpOnly Cookie，前端无需手动获取
  // Token会自动在请求中携带
  return Cookies.get(TOKEN_KEY);
}

/**
 * 移除Token
 */
export function removeToken(): void {
  Cookies.remove(TOKEN_KEY);
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}
```

### 4.2 密码加密

```typescript
// utils/security.ts
import CryptoJS from 'crypto-js';

/**
 * SHA256加密密码
 * @param password 明文密码
 * @returns 加密后的密码
 */
export function encryptPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

/**
 * 加密敏感数据（使用AES）
 * @param data 明文数据
 * @param key 加密密钥
 * @returns 加密后的数据
 */
export function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

/**
 * 解密敏感数据
 * @param encryptedData 加密数据
 * @param key 解密密钥
 * @returns 明文数据
 */
export function decryptData(encryptedData: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

---

## 5. 敏感信息脱敏

### 5.1 脱敏工具函数

```typescript
// utils/format.ts

/**
 * 手机号脱敏
 * @param phone 手机号
 * @returns 脱敏后的手机号（如：138****1234）
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 邮箱脱敏
 * @param email 邮箱
 * @returns 脱敏后的邮箱（如：abc***@example.com）
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 3
    ? username.slice(0, 3) + '***'
    : username + '***';
  return `${maskedUsername}@${domain}`;
}

/**
 * 身份证号脱敏
 * @param idCard 身份证号
 * @returns 脱敏后的身份证号（如：1234**********5678）
 */
export function maskIDCard(idCard: string): string {
  if (!idCard || idCard.length < 8) return idCard;
  return idCard.replace(/^(.{4}).*(.{4})$/, '$1**********$2');
}

/**
 * 银行卡号脱敏
 * @param cardNo 银行卡号
 * @returns 脱敏后的银行卡号
 */
export function maskBankCard(cardNo: string): string {
  if (!cardNo || cardNo.length < 8) return cardNo;
  return cardNo.replace(/^(.{4}).*(.{4})$/, '$1 **** **** $2');
}
```

---

## 6. 文件上传安全校验

### 6.1 文件类型校验

```typescript
// utils/validate.ts

// 允许的文件格式白名单
const ALLOWED_FILE_EXTENSIONS = [
  'psd', 'ai', 'cdr', 'eps', 'sketch', 'xd', 'figma',
  'svg', 'png', 'jpg', 'jpeg', 'webp'
];

// 允许的MIME类型白名单
const ALLOWED_MIME_TYPES = [
  'image/vnd.adobe.photoshop',
  'application/postscript',
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/webp'
];

/**
 * 验证文件扩展名
 * @param fileName 文件名
 * @returns 是否允许
 */
export function validateFileExtension(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? ALLOWED_FILE_EXTENSIONS.includes(ext) : false;
}

/**
 * 验证文件MIME类型
 * @param file 文件对象
 * @returns 是否允许
 */
export function validateFileMimeType(file: File): boolean {
  return ALLOWED_MIME_TYPES.includes(file.type);
}

/**
 * 验证文件大小
 * @param fileSize 文件大小（字节）
 * @param maxSize 最大大小（字节），默认1000MB
 * @returns 是否允许
 */
export function validateFileSize(fileSize: number, maxSize = 1000 * 1024 * 1024): boolean {
  return fileSize > 0 && fileSize <= maxSize;
}

/**
 * 综合验证文件
 * @param file 文件对象
 * @returns 验证结果
 */
export function validateFile(file: File): { valid: boolean; message: string } {
  // 验证扩展名
  if (!validateFileExtension(file.name)) {
    return {
      valid: false,
      message: '仅支持设计文件格式：PSD/AI/CDR/EPS/SKETCH/XD/FIGMA/SVG/PNG/JPG/WEBP'
    };
  }

  // 验证MIME类型
  if (!validateFileMimeType(file)) {
    return {
      valid: false,
      message: '文件类型不合法'
    };
  }

  // 验证文件大小
  if (!validateFileSize(file.size)) {
    return {
      valid: false,
      message: '文件大小不能超过1000MB'
    };
  }

  return { valid: true, message: '验证通过' };
}
```

---

## 7. 路由守卫安全配置

### 7.1 路由守卫实现

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated } from '@/utils/security';
import { useUserStore } from '@/pinia/userStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ... 路由配置
  ]
});

// 需要登录的路由路径
const AUTH_REQUIRED_PATHS = [
  '/personal',
  '/upload',
  '/orders'
];

// 需要VIP权限的路由路径
const VIP_REQUIRED_PATHS = [
  '/vip-resources'
];

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  // 检查是否需要登录
  const requiresAuth = AUTH_REQUIRED_PATHS.some(path => to.path.startsWith(path));
  
  if (requiresAuth && !isAuthenticated()) {
    // 未登录，跳转登录页
    next({
      path: '/login',
      query: { redirect: to.fullPath } // 保存目标路径，登录后跳转
    });
    return;
  }

  // 检查是否需要VIP权限
  const requiresVIP = VIP_REQUIRED_PATHS.some(path => to.path.startsWith(path));
  
  if (requiresVIP && userStore.userInfo?.vipLevel === 0) {
    // 非VIP用户，跳转VIP开通页
    next('/vip');
    return;
  }

  next();
});

// 全局后置钩子 - 页面标题
router.afterEach((to) => {
  document.title = (to.meta.title as string) || '设计资源下载平台';
});

export default router;
```

---

## 8. 环境变量安全配置

### 8.1 环境变量文件

```bash
# .env.development（开发环境）
VITE_API_BASE_URL=http://localhost:8080
VITE_CDN_BASE_URL=http://localhost:8080/cdn
VITE_ENABLE_MOCK=true

# .env.production（生产环境）
VITE_API_BASE_URL=https://api.your-domain.com
VITE_CDN_BASE_URL=https://cdn.your-domain.com
VITE_ENABLE_MOCK=false
```

### 8.2 环境变量类型定义

```typescript
// vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_CDN_BASE_URL: string;
  readonly VITE_ENABLE_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 8.3 安全注意事项

```typescript
// ❌ 错误：不要在前端代码中硬编码敏感信息
const API_KEY = 'sk-1234567890abcdef'; // 危险！

// ✅ 正确：使用环境变量
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ❌ 错误：不要将敏感信息暴露在前端
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY; // 危险！

// ✅ 正确：敏感信息只在后端使用
```

---

## 9. 生产环境构建配置

### 9.1 Vite构建优化

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    vue(),
    visualizer() // 打包分析
  ],
  build: {
    // 生产环境移除console和debugger
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus'],
          'utils': ['axios', 'dayjs']
        }
      }
    },
    // 启用源码映射（仅开发环境）
    sourcemap: false
  },
  // 安全响应头（需要服务器配置）
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }
  }
});
```

---

## 10. 安全检查清单

### 部署前必检项

- [ ] 所有用户输入都经过XSS过滤
- [ ] 所有HTML渲染都经过DOMPurify净化
- [ ] CSRF Token在所有请求中携带
- [ ] Token存储在HttpOnly Cookie中
- [ ] 密码使用SHA256加密传输
- [ ] 敏感信息（手机号、邮箱）已脱敏
- [ ] 文件上传有扩展名和MIME类型双重校验
- [ ] 路由守卫正确拦截未授权访问
- [ ] 生产环境已移除console.log和debugger
- [ ] 代码已通过ESLint检查（无错误）
- [ ] TypeScript编译无错误（strict模式）
- [ ] 依赖漏洞已修复（npm audit）
- [ ] 环境变量无敏感信息泄露
- [ ] HTTPS强制启用（生产环境）
- [ ] CSP响应头已配置
- [ ] X-Frame-Options已配置
- [ ] 代码已混淆和压缩

---

## 总结

本安全配置清单涵盖了前端开发中的核心安全措施，确保代码：

1. **严格**：TypeScript strict模式、ESLint严格规则
2. **规范**：统一的代码风格、命名规范、注释规范
3. **简洁**：避免冗余代码、提取可复用逻辑
4. **安全**：XSS/CSRF防护、Token安全、输入验证、敏感信息保护

请在开发过程中严格遵守这些规范，确保项目的安全性和代码质量。
