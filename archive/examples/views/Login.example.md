# 登录页面 (Login.vue)

## 功能概述

登录页面提供用户认证功能，支持手机号+密码登录方式，包含完整的表单验证和用户体验优化。

## 主要功能

### 1. 表单输入
- **手机号输入框**：支持格式验证（11位手机号）
- **密码输入框**：支持显示/隐藏密码切换
- **记住我复选框**：7天免登录
- **清空按钮**：快速清除输入内容

### 2. 表单验证
- 手机号格式验证（使用 `validatePhone` 工具函数）
- 密码长度验证（6-20位）
- 实时验证反馈
- 提交前完整验证

### 3. 用户体验
- **加载状态**：登录按钮显示 loading 动画
- **错误提示**：友好的错误信息提示
- **快捷操作**：支持 Enter 键提交表单
- **密码可见性切换**：点击眼睛图标切换密码显示

### 4. 页面导航
- **忘记密码链接**：跳转到密码重置页面
- **注册链接**：跳转到注册页面
- **第三方登录**：微信、QQ登录入口（待实现）

## 技术实现

### 使用的 Composables
- `useAuth`：认证逻辑封装
  - `login(phone, password, rememberMe)`：登录方法
  - `loading`：加载状态
  - `error`：错误信息

### 表单验证规则
```typescript
const loginRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
    { max: 20, message: '密码最多20位', trigger: 'blur' }
  ]
};
```

### 登录流程
1. 用户输入手机号和密码
2. 点击登录按钮或按 Enter 键
3. 表单验证（Element Plus Form）
4. 调用 `useAuth().login()` 方法
5. 密码自动加密（SHA256）
6. 发送登录请求到后端
7. 成功后更新用户状态（Pinia Store）
8. 自动跳转到首页

## 路由配置

```typescript
{
  path: '/login',
  name: 'Login',
  component: () => import('@/views/Auth/Login.vue'),
  meta: {
    title: '登录 - 星潮设计'
  }
}
```

## 样式特点

### 设计风格
- **渐变背景**：紫色渐变背景（#667eea → #764ba2）
- **卡片式布局**：白色圆角卡片，阴影效果
- **品牌色应用**：Logo 使用品牌色渐变
- **响应式设计**：适配移动端和桌面端

### 交互效果
- 按钮悬浮效果（上移 + 阴影）
- 输入框聚焦效果
- 链接悬浮变色
- 第三方登录按钮悬浮效果

## 安全特性

### 密码安全
- 密码输入框默认隐藏
- 密码传输前 SHA256 加密
- 不在前端存储明文密码

### Token 安全
- Token 存储在 HttpOnly Cookie
- 支持"记住我"功能（7天有效期）
- 登录成功后自动跳转

### XSS 防护
- 所有用户输入经过验证
- 使用 TypeScript 类型安全

## 使用示例

### 访问登录页
```
http://localhost:3000/login
```

### 测试账号（开发环境）
```
手机号：13800138000
密码：123456
```

## 相关文件

- **组件**：`src/views/Auth/Login.vue`
- **路由**：`src/router/index.ts`
- **认证逻辑**：`src/composables/useAuth.ts`
- **API 接口**：`src/api/auth.ts`
- **用户状态**：`src/pinia/userStore.ts`
- **验证工具**：`src/utils/validate.ts`
- **安全工具**：`src/utils/security.ts`

## 待实现功能

- [ ] 第三方登录（微信、QQ）
- [ ] 短信验证码登录
- [ ] 图形验证码
- [ ] 登录失败次数限制
- [ ] 记住账号功能

## 需求映射

- **需求 1.1**：用户提交注册信息验证 ✅
- **需求 1.2**：密码登录方式 ✅
- **需求 1.6**：记住密码选项 ✅
- **需求 1.7**：Token 过期处理 ✅
- **需求 1.8**：密码强度显示 ⏳（注册页实现）
- **需求 7.1**：XSS 防护 ✅
- **需求 7.9**：Token 安全存储 ✅
- **需求 7.11**：密码加密传输 ✅
