# 个人中心自动退出登录问题修复总结

## 问题描述

用户在登录状态下访问个人中心页面时，会被自动退出登录。这是由于Token管理和401错误处理逻辑存在缺陷导致的。

## 根本原因分析

### 1. Token过期检查逻辑缺陷
- 当`token_expire_time` Cookie不存在时，系统错误地将Token视为已过期
- 这导致即使Token有效，用户也会被强制退出登录

### 2. 401错误处理过于激进
- 收到401错误后立即执行退出登录，没有验证Token是否真的过期
- 并发请求可能触发多次退出登录操作

### 3. Token状态不一致
- Token和过期时间可能不同步（有Token但无过期时间）
- 应用初始化时没有正确处理这种不一致状态

## 解决方案

### 1. 改进Token过期检查 (`src/utils/security.ts`)

```typescript
// 改进前：过期时间不存在时返回true（视为过期）
// 改进后：过期时间不存在时返回false（容错处理，视为未过期）
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) {
    return true; // 没有token，视为过期
  }
  
  const expireTime = getTokenExpireTime();
  if (!expireTime) {
    return false; // 有token但没有过期时间，容错处理，视为未过期
  }

  return Date.now() >= expireTime;
}
```

### 2. 添加Token状态验证函数

```typescript
export function validateTokenState(): { valid: boolean; hasToken: boolean; hasExpireTime: boolean } {
  const token = getToken();
  const expireTime = getTokenExpireTime();
  
  return {
    valid: (!!token && !!expireTime) || (!token && !expireTime),
    hasToken: !!token,
    hasExpireTime: !!expireTime
  };
}
```

### 3. 改进请求拦截器 (`src/utils/request.ts`)

- 添加Token存在性检查
- 添加Token状态一致性验证和自动修复
- 改进Token过期检查逻辑

### 4. 改进401错误处理

- 添加并发401去重机制
- 验证Token是否真的过期后再决定是否退出登录
- Token未过期时尝试刷新Token

```typescript
function handleUnauthorizedError(): Promise<void> {
  // 防止并发请求多次触发
  if (isHandlingUnauthorized) {
    return unauthorizedHandlingPromise || Promise.resolve();
  }
  
  isHandlingUnauthorized = true;
  
  // 验证Token是否真的过期
  const token = getToken();
  const isExpired = isTokenExpired();

  if (!token || isExpired) {
    // Token确实过期，执行退出登录
    handleTokenExpired();
  } else {
    // Token未过期，尝试刷新
    await refreshAuthToken();
  }
}
```

### 5. 改进用户Store (`src/pinia/userStore.ts`)

- 改进`initToken()`函数，自动修复Token状态不一致
- 改进`setToken()`函数，确保Token和过期时间同时设置

### 6. 改进个人中心页面 (`src/views/Personal/index.vue`)

- 区分认证错误和其他错误
- 认证错误由拦截器统一处理
- 其他错误显示友好提示，不退出登录

## 测试覆盖

### 单元测试
- Token过期检查测试（95个测试用例）
- 请求拦截器测试（19个测试用例）
- 用户Store测试（33个测试用例）

### 属性测试
- Property 1: Token状态一致性
- Property 2: 过期检查容错性
- Property 3: 401错误处理幂等性
- Property 4: Token验证优先级
- Property 5: 数据加载失败容错
- Property 6: Token初始化修复
- Property 7: Store和Cookie同步

### 集成测试
- 完整登录 → 访问个人中心流程
- Token刷新流程
- 401错误恢复流程
- 个人中心Tab切换流程
- 多次访问个人中心不退出登录

## 验证结果

所有测试通过：
- security.test.ts: 85 tests passed
- security.property.test.ts: 10 tests passed
- request.test.ts: 15 tests passed
- request.property.test.ts: 4 tests passed
- userStore.test.ts: 24 tests passed
- userStore.property.test.ts: 9 tests passed
- personal-center-auth.integration.test.ts: 16 tests passed

## 测试内存优化

由于项目测试文件较多，一次性运行所有测试可能会导致内存溢出。我们提供了分批测试脚本来解决这个问题：

### 运行方式

```bash
# 分批运行所有测试（推荐）
npm run test:batch

# 运行单个测试文件
node --max-old-space-size=4096 ./node_modules/vitest/vitest.mjs --run <test-file>

# 运行所有测试（可能会内存溢出）
npm run test
```

### 配置说明

- `vitest.config.ts` 已配置为单线程运行，减少内存占用
- `package.json` 中的测试脚本已设置 `--max-old-space-size=8192` 增加内存限制
- 分批测试脚本 `scripts/run-tests-batch.js` 会逐个运行测试文件，避免内存累积

## 修复日期

2025年12月22日
