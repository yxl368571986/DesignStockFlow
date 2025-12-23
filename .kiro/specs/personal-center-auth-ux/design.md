# Design Document

## Overview

本设计文档描述了如何修复个人中心自动退出登录的问题。核心策略是改进token过期检查逻辑、增强错误处理机制，并确保token状态在cookies和store之间的一致性。

## Architecture

### 当前架构问题

1. **Token过期检查时机不当**：在请求拦截器中过早检查token过期
2. **缺少过期时间容错**：当`token_expire_time`不存在时，逻辑处理不一致
3. **401错误处理链路过长**：401错误 → 立即清除状态 → 跳转登录，没有中间验证
4. **状态同步不完整**：cookies和store之间的token状态可能不一致

### 改进后的架构

```
用户登录
  ↓
设置Token + 过期时间（同时更新cookies和store）
  ↓
请求拦截器
  ↓
检查Token是否存在 → 不存在 → 跳转登录
  ↓ 存在
检查过期时间是否存在 → 不存在 → 使用Token（容错）
  ↓ 存在
检查是否过期 → 已过期 → 尝试刷新 → 失败 → 跳转登录
  ↓ 未过期
添加Authorization头 → 发送请求
  ↓
响应拦截器
  ↓
401错误 → 验证Token是否真的过期 → 是 → 跳转登录
                              ↓ 否
                         尝试刷新Token → 重试请求
```

## Components and Interfaces

### 1. Token管理模块 (security.ts)

**改进的函数：**

```typescript
/**
 * 检查Token是否已过期（改进版）
 * 如果过期时间不存在，返回false（容错处理）
 */
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

/**
 * 检查Token是否即将过期（改进版）
 * 如果过期时间不存在，返回false
 */
export function isTokenExpiringSoon(): boolean {
  const token = getToken();
  if (!token) {
    return false;
  }
  
  const expireTime = getTokenExpireTime();
  if (!expireTime) {
    return false; // 没有过期时间，不触发刷新
  }

  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return expireTime - now < fiveMinutes && expireTime > now;
}

/**
 * 验证Token状态一致性
 * 检查token和过期时间是否都存在或都不存在
 */
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

### 2. 请求拦截器 (request.ts)

**改进的拦截器逻辑：**

```typescript
service.interceptors.request.use(
  async (config) => {
    // 1. 首先检查Token是否存在
    const token = getToken();
    if (!token) {
      console.warn('Token不存在，跳过认证检查');
      return config; // 让请求继续，由后端返回401
    }

    // 2. 检查Token状态一致性
    const tokenState = validateTokenState();
    if (!tokenState.valid) {
      console.warn('Token状态不一致，尝试修复');
      if (tokenState.hasToken && !tokenState.hasExpireTime) {
        // 有token但没有过期时间，设置默认过期时间
        const defaultExpireTime = Date.now() + 24 * 60 * 60 * 1000; // 24小时
        setTokenExpireTime(defaultExpireTime);
      }
    }

    // 3. 检查Token是否过期（只在有过期时间时检查）
    if (isTokenExpired()) {
      console.warn('Token已过期');
      handleTokenExpired();
      return Promise.reject(new Error('Token expired'));
    }

    // 4. 检查Token是否即将过期，如果是则刷新
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
        // 刷新失败不立即退出，让请求继续
        // 如果真的过期，后端会返回401
      }
    }

    // 5. 如果正在刷新Token，将请求加入队列
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

    // 6. 添加Token到请求头
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);
```

### 3. 响应拦截器 (request.ts)

**改进的401错误处理：**

```typescript
// 添加一个标志，防止多次触发退出登录
let isHandlingUnauthorized = false;

service.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse;

    if (res.code !== 200) {
      ElMessage.error(res.msg || '请求失败');

      if (res.code === 401) {
        // 401错误，验证Token是否真的过期
        handleUnauthorizedError();
      } else if (res.code === 403) {
        ElMessage.error('没有权限访问');
      }

      return Promise.reject(new Error(res.msg || '请求失败'));
    }

    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    console.error('响应错误:', error);

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.msg || '请求失败';

      switch (status) {
        case 401:
          handleUnauthorizedError();
          break;
        case 403:
          ElMessage.error('没有权限访问');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器错误，请稍后重试');
          break;
        default:
          ElMessage.error(message);
      }
    } else if (error.request) {
      ElMessage.error('网络异常，请检查网络连接');
    } else {
      ElMessage.error('请求配置错误');
    }

    return Promise.reject(error);
  }
);

/**
 * 处理401未授权错误
 * 验证Token是否真的过期，避免误判
 */
function handleUnauthorizedError(): void {
  // 防止并发请求多次触发
  if (isHandlingUnauthorized) {
    return;
  }
  
  isHandlingUnauthorized = true;

  // 验证Token是否真的过期
  const token = getToken();
  const isExpired = isTokenExpired();

  if (!token || isExpired) {
    // Token确实过期或不存在，执行退出登录
    ElMessage.error('登录已过期，请重新登录');
    handleTokenExpired();
  } else {
    // Token存在且未过期，可能是其他原因导致的401
    // 尝试刷新Token
    console.log('Token未过期但收到401，尝试刷新Token');
    refreshAuthToken()
      .then(() => {
        console.log('Token刷新成功，请重试操作');
        ElMessage.warning('认证已更新，请重试操作');
      })
      .catch(() => {
        console.error('Token刷新失败，执行退出登录');
        ElMessage.error('登录已过期，请重新登录');
        handleTokenExpired();
      })
      .finally(() => {
        isHandlingUnauthorized = false;
      });
    return;
  }

  isHandlingUnauthorized = false;
}
```

### 4. 用户Store (userStore.ts)

**改进的Token初始化：**

```typescript
/**
 * 初始化Token状态（改进版）
 * 从Cookie中读取Token并验证状态一致性
 */
function initToken(): void {
  try {
    const token = getToken();
    const expireTime = getTokenExpireTime();
    
    if (token) {
      // 有token，更新store状态
      tokenRef.value = token;
      
      // 检查是否有过期时间
      if (!expireTime) {
        console.warn('Token存在但过期时间缺失，设置默认过期时间');
        // 设置默认过期时间（24小时）
        const defaultExpireTime = Date.now() + 24 * 60 * 60 * 1000;
        setTokenExpireTime(defaultExpireTime);
      } else {
        // 检查是否已过期
        if (Date.now() >= expireTime) {
          console.warn('Token已过期，清除状态');
          logout();
        }
      }
    } else {
      // 没有token，检查是否有用户信息
      if (userInfo.value) {
        console.warn('没有Token但有用户信息，清除用户信息');
        logout();
      }
    }
  } catch (error) {
    console.error('初始化Token失败:', error);
    // 出错时清除所有状态
    logout();
  }
}

/**
 * 设置Token（改进版）
 * 确保Token和过期时间同时设置
 */
function setToken(newToken: string, rememberMe: boolean = false, expireTime?: number): void {
  tokenRef.value = newToken;

  // 计算过期时间
  const calculatedExpireTime = expireTime || 
    Date.now() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);

  // 同时设置Token和过期时间
  import('@/utils/security').then(({ setToken: setTokenCookie, setTokenExpireTime }) => {
    setTokenCookie(newToken, rememberMe);
    setTokenExpireTime(calculatedExpireTime);
    console.log('Token和过期时间已设置');
  });
}
```

### 5. 个人中心页面 (Personal/index.vue)

**改进的数据加载错误处理：**

```typescript
async function fetchDownloadHistory() {
  downloadLoading.value = true;
  try {
    const res = await getDownloadHistory({
      pageNum: downloadPage.value,
      pageSize: downloadPageSize.value
    });

    if (res.code === 200) {
      downloadList.value = res.data.list;
      downloadTotal.value = res.data.total;
    }
  } catch (error: any) {
    console.error('获取下载记录失败:', error);
    
    // 区分错误类型
    const status = error.response?.status;
    
    if (status === 401 || status === 403) {
      // 认证错误，由拦截器处理，这里不显示消息
      console.log('认证错误，由拦截器处理');
    } else {
      // 其他错误，显示友好提示
      ElMessage.warning('暂时无法加载下载记录，请稍后再试');
    }
    
    // 设置空数据，避免页面报错
    downloadList.value = [];
    downloadTotal.value = 0;
  } finally {
    downloadLoading.value = false;
  }
}
```

## Data Models

### Token状态模型

```typescript
interface TokenState {
  token: string | undefined;
  expireTime: number | null;
  isValid: boolean;
  isExpiring: boolean;
  isExpired: boolean;
}
```

### 错误处理状态

```typescript
interface ErrorHandlingState {
  isHandlingUnauthorized: boolean;
  unauthorizedCount: number;
  lastUnauthorizedTime: number;
}
```

## Correctness Properties

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: Token状态一致性

*对于任何*时刻，如果Token存在于cookies中，那么过期时间也必须存在于cookies中（或被设置为默认值）

**Validates: Requirements 2.1, 2.3, 2.5**

### Property 2: 过期检查容错性

*对于任何*Token过期检查，如果过期时间不存在，系统应该将Token视为有效（容错处理），而不是视为过期

**Validates: Requirements 1.2, 2.1**

### Property 3: 401错误处理幂等性

*对于任何*401错误响应，系统应该只触发一次退出登录流程，即使有多个并发请求失败

**Validates: Requirements 1.5, 3.2**

### Property 4: Token验证优先级

*对于任何*401错误，系统应该先验证Token是否真的过期，然后再决定是否退出登录

**Validates: Requirements 3.1, 3.5**

### Property 5: 数据加载失败容错

*对于任何*个人中心数据加载失败（非401/403错误），系统应该显示空状态而不是退出登录

**Validates: Requirements 4.2, 4.4**

### Property 6: Token初始化修复

*对于任何*应用初始化，如果发现Token存在但过期时间缺失，系统应该自动设置默认过期时间

**Validates: Requirements 2.1, 5.1, 5.3**

### Property 7: Store和Cookie同步

*对于任何*Token设置操作，系统应该同时更新cookies和store中的Token状态

**Validates: Requirements 5.2, 5.5**

## Error Handling

### 1. Token不存在

- **场景**：用户未登录或Token被清除
- **处理**：允许请求继续，由后端返回401，然后跳转登录页

### 2. Token过期时间缺失

- **场景**：旧版本登录或Cookie被部分清除
- **处理**：设置默认过期时间（24小时），允许Token继续使用

### 3. Token过期

- **场景**：Token确实已过期
- **处理**：尝试刷新Token，失败则跳转登录页

### 4. 401错误但Token未过期

- **场景**：后端Token验证失败或其他原因
- **处理**：尝试刷新Token，提示用户重试操作

### 5. 并发401错误

- **场景**：多个请求同时返回401
- **处理**：使用标志位防止多次触发退出登录

### 6. 个人中心数据加载失败

- **场景**：网络错误或服务器错误
- **处理**：显示空状态和友好提示，不退出登录

## Testing Strategy

### Unit Tests

1. **Token过期检查测试**
   - 测试有Token有过期时间的情况
   - 测试有Token无过期时间的情况（应返回false）
   - 测试无Token的情况（应返回true）
   - 测试过期时间已过的情况

2. **Token状态验证测试**
   - 测试Token和过期时间都存在的情况
   - 测试Token存在但过期时间缺失的情况
   - 测试Token和过期时间都不存在的情况

3. **401错误处理测试**
   - 测试Token过期时的401处理
   - 测试Token未过期时的401处理
   - 测试并发401请求的去重

4. **个人中心数据加载测试**
   - 测试成功加载数据
   - 测试401错误处理
   - 测试网络错误处理
   - 测试空数据显示

### Property-Based Tests

使用 **fast-check** 库进行属性测试，每个测试运行最少100次迭代。

1. **Property 1测试：Token状态一致性**
   - 生成随机Token和过期时间
   - 验证设置后两者都存在或都不存在

2. **Property 2测试：过期检查容错性**
   - 生成有Token但无过期时间的状态
   - 验证`isTokenExpired()`返回false

3. **Property 3测试：401错误处理幂等性**
   - 模拟多个并发401错误
   - 验证只触发一次退出登录

4. **Property 4测试：Token验证优先级**
   - 生成各种Token状态（有效、过期、缺失）
   - 验证401处理逻辑的正确性

5. **Property 5测试：数据加载失败容错**
   - 生成各种错误状态码（除401/403外）
   - 验证不会触发退出登录

6. **Property 6测试：Token初始化修复**
   - 生成有Token无过期时间的初始状态
   - 验证初始化后过期时间被设置

7. **Property 7测试：Store和Cookie同步**
   - 生成随机Token和过期时间
   - 验证设置后cookies和store状态一致

### Integration Tests

1. **完整登录流程测试**
   - 登录 → 设置Token → 访问个人中心 → 验证数据加载

2. **Token刷新流程测试**
   - 设置即将过期的Token → 发起请求 → 验证Token被刷新

3. **401错误恢复测试**
   - 模拟401错误 → 验证Token刷新 → 验证请求重试

4. **个人中心完整流程测试**
   - 访问个人中心 → 切换Tab → 验证数据加载 → 验证不会退出登录
