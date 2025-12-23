# 设计文档：星潮设计资源平台全面功能测试与修复

## 概述

本设计文档定义了星潮设计资源平台全面功能测试与修复的技术方案。测试采用分层测试策略，从环境配置开始，逐步测试数据库、后端API、前端功能，最后进行集成测试和性能测试。

### 测试策略

1. **环境层测试** - 确保开发环境、数据库、依赖包正确配置
2. **数据库层测试** - 验证表结构、外键关系、数据完整性
3. **API层测试** - 验证接口规范、请求响应、错误处理
4. **前端层测试** - 验证页面布局、交互功能、数据展示
5. **集成层测试** - 验证前后端数据一致性、业务流程完整性
6. **性能层测试** - 验证加载时间、响应速度、并发能力

### 测试执行原则

1. 按照测试顺序依次执行，不跳过任何步骤
2. 功能测试与接口测试同步进行
3. 发现问题立即记录，P0/P1级问题立即修复
4. 修复后必须回归测试所有关联功能
5. 所有沟通和文档使用中文

## 架构设计

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vue3 + TypeScript)              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  首页   │ │资源模块 │ │个人中心 │ │后台管理 │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │           │           │           │                 │
│  ┌────┴───────────┴───────────┴───────────┴────┐           │
│  │              Pinia 状态管理                  │           │
│  └────────────────────┬────────────────────────┘           │
│                       │                                     │
│  ┌────────────────────┴────────────────────────┐           │
│  │              Axios 请求封装                  │           │
│  └────────────────────┬────────────────────────┘           │
└───────────────────────┼─────────────────────────────────────┘
                        │ HTTP/HTTPS
┌───────────────────────┼─────────────────────────────────────┐
│                       │        后端 (Express + Prisma)      │
│  ┌────────────────────┴────────────────────────┐           │
│  │              路由层 (Routes)                 │           │
│  └────────────────────┬────────────────────────┘           │
│                       │                                     │
│  ┌────────────────────┴────────────────────────┐           │
│  │           中间件层 (Middlewares)             │           │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │           │
│  │  │ 认证 │ │ 权限 │ │ 转换 │ │ 日志 │       │           │
│  │  └──────┘ └──────┘ └──────┘ └──────┘       │           │
│  └────────────────────┬────────────────────────┘           │
│                       │                                     │
│  ┌────────────────────┴────────────────────────┐           │
│  │            控制器层 (Controllers)            │           │
│  └────────────────────┬────────────────────────┘           │
│                       │                                     │
│  ┌────────────────────┴────────────────────────┐           │
│  │             服务层 (Services)                │           │
│  └────────────────────┬────────────────────────┘           │
│                       │                                     │
│  ┌────────────────────┴────────────────────────┐           │
│  │           Prisma ORM                         │           │
│  └────────────────────┬────────────────────────┘           │
└───────────────────────┼─────────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────────┐
│                       │        数据库 (PostgreSQL)          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ users   │ │resources│ │ orders  │ │ ...     │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 前端页面结构

```
src/views/
├── Home/              # 首页
├── Auth/              # 认证页面
│   ├── Login.vue      # 登录
│   └── Register.vue   # 注册
├── Resource/          # 资源模块
│   ├── List.vue       # 资源列表
│   └── Detail.vue     # 资源详情
├── Search/            # 搜索页面
├── Upload/            # 上传页面
├── Personal/          # 个人中心
├── VIP/               # VIP中心
├── About/             # 关于页面
├── Admin/             # 后台管理
│   ├── Dashboard/     # 数据概览
│   ├── Users/         # 用户管理
│   ├── Resources/     # 资源管理
│   ├── Audit/         # 内容审核
│   ├── Categories/    # 分类管理
│   ├── Operation/     # 内容运营
│   │   ├── Banners/   # 轮播图管理
│   │   ├── Announcements/ # 公告管理
│   │   └── Recommends/    # 推荐位管理
│   ├── Statistics/    # 数据统计
│   └── Settings/      # 系统设置
└── NotFound.vue       # 404页面
```

### 后端API结构

```
backend/src/
├── routes/            # 路由定义
│   ├── auth.ts        # 认证路由
│   ├── user.ts        # 用户路由
│   ├── resource.ts    # 资源路由
│   ├── category.ts    # 分类路由
│   ├── content.ts     # 内容路由（轮播图、公告等）
│   ├── favorite.ts    # 收藏路由
│   ├── vip.ts         # VIP路由
│   ├── points.ts      # 积分路由
│   ├── payment.ts     # 支付路由
│   ├── audit.ts       # 审核路由
│   ├── statistics.ts  # 统计路由
│   └── adminXxx.ts    # 管理员路由
├── controllers/       # 控制器
├── services/          # 业务逻辑
├── middlewares/       # 中间件
│   ├── auth.ts        # 认证中间件
│   ├── fieldTransform.ts # 字段转换中间件
│   ├── errorHandler.ts   # 错误处理中间件
│   └── requestLogger.ts  # 请求日志中间件
└── utils/             # 工具函数
```

### 数据库表结构

```
数据库表关系图：

users (用户表)
  ├── user_id (PK, UUID)
  ├── phone (唯一)
  ├── password_hash
  ├── nickname
  ├── avatar
  ├── vip_level
  ├── vip_expire_at
  ├── points_balance
  ├── role_id (FK -> roles)
  ├── status
  └── created_at, updated_at

resources (资源表)
  ├── resource_id (PK, UUID)
  ├── title
  ├── description
  ├── cover
  ├── file_url
  ├── file_format
  ├── file_size
  ├── category_id (FK -> categories)
  ├── user_id (FK -> users)
  ├── vip_level
  ├── audit_status
  ├── download_count
  ├── collect_count
  └── created_at, updated_at

categories (分类表)
  ├── category_id (PK, UUID)
  ├── category_name
  ├── category_code (唯一)
  ├── parent_id (FK -> categories)
  ├── icon
  ├── sort_order
  └── resource_count

user_favorites (收藏表)
  ├── favorite_id (PK, UUID)
  ├── user_id (FK -> users)
  ├── resource_id (FK -> resources)
  └── created_at

download_history (下载记录表)
  ├── download_id (PK, UUID)
  ├── user_id (FK -> users)
  ├── resource_id (FK -> resources)
  ├── points_cost
  └── created_at

orders (订单表)
  ├── order_id (PK, UUID)
  ├── order_no (唯一)
  ├── user_id (FK -> users)
  ├── order_type
  ├── amount
  ├── payment_status
  └── created_at, updated_at
```

## 组件和接口

### API接口规范

#### 统一响应格式

```typescript
// 成功响应
{
  code: 0,
  message: "success",
  data: {
    // 具体数据
  }
}

// 分页响应
{
  code: 0,
  message: "success",
  data: {
    list: [],
    total: 100,
    page: 1,
    pageSize: 20,
    totalPages: 5
  }
}

// 错误响应
{
  code: 400,
  message: "参数错误：手机号格式不正确",
  data: null
}
```

#### 核心API接口列表

| 模块 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 认证 | /api/v1/auth/login | POST | 用户登录 |
| 认证 | /api/v1/auth/register | POST | 用户注册 |
| 认证 | /api/v1/auth/refresh | POST | 刷新Token |
| 认证 | /api/v1/auth/logout | POST | 退出登录 |
| 用户 | /api/v1/user/info | GET | 获取用户信息 |
| 用户 | /api/v1/user/profile | PUT | 更新用户资料 |
| 资源 | /api/v1/resources | GET | 获取资源列表 |
| 资源 | /api/v1/resources/:id | GET | 获取资源详情 |
| 资源 | /api/v1/resources | POST | 上传资源 |
| 收藏 | /api/v1/favorites | GET | 获取收藏列表 |
| 收藏 | /api/v1/favorites/:resourceId | POST | 添加收藏 |
| 收藏 | /api/v1/favorites/:resourceId | DELETE | 取消收藏 |
| 内容 | /api/v1/content/banners | GET | 获取轮播图 |
| 内容 | /api/v1/content/categories | GET | 获取分类 |
| 内容 | /api/v1/content/announcements | GET | 获取公告 |
| VIP | /api/v1/vip/packages | GET | 获取VIP套餐 |
| VIP | /api/v1/vip/purchase | POST | 购买VIP |
| 积分 | /api/v1/points/balance | GET | 获取积分余额 |
| 积分 | /api/v1/points/records | GET | 获取积分记录 |
| 管理 | /api/v1/admin/users | GET | 管理员获取用户列表 |
| 管理 | /api/v1/admin/resources | GET | 管理员获取资源列表 |
| 管理 | /api/v1/admin/audit | GET | 获取待审核列表 |
| 管理 | /api/v1/admin/statistics | GET | 获取统计数据 |

### 字段命名转换规范

```typescript
// 前端请求参数 (camelCase)
{
  userId: "xxx",
  resourceId: "xxx",
  pageSize: 20,
  vipLevel: 1,
  categoryId: "xxx"
}

// 后端数据库字段 (snake_case)
{
  user_id: "xxx",
  resource_id: "xxx",
  page_size: 20,
  vip_level: 1,
  category_id: "xxx"
}

// 字段转换中间件 (fieldTransform.ts)
// 请求时：camelCase -> snake_case
// 响应时：snake_case -> camelCase
```

## 数据模型

### 用户模型

```typescript
interface User {
  userId: string;
  phone: string;
  nickname: string | null;
  avatar: string | null;
  email: string | null;
  bio: string | null;
  vipLevel: number;
  vipExpireAt: string | null;
  pointsBalance: number;
  pointsTotal: number;
  userLevel: number;
  roleId: string | null;
  roleCode: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
}
```

### 资源模型

```typescript
interface Resource {
  resourceId: string;
  title: string;
  description: string | null;
  cover: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileFormat: string;
  previewImages: string[];
  categoryId: string | null;
  categoryName: string | null;
  tags: string[];
  vipLevel: number;
  userId: string | null;
  authorName: string | null;
  auditStatus: number;
  auditMsg: string | null;
  downloadCount: number;
  viewCount: number;
  likeCount: number;
  collectCount: number;
  isTop: boolean;
  isRecommend: boolean;
  status: number;
  createdAt: string;
  updatedAt: string;
}
```

### 分类模型

```typescript
interface Category {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  parentId: string | null;
  icon: string | null;
  sortOrder: number;
  isHot: boolean;
  isRecommend: boolean;
  resourceCount: number;
  children?: Category[];
}
```

### 订单模型

```typescript
interface Order {
  orderId: string;
  orderNo: string;
  userId: string;
  orderType: string;
  productType: string;
  productName: string;
  amount: string;
  paymentMethod: string | null;
  paymentStatus: number;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## 正确性属性

*正确性属性是指在系统所有有效执行中都应该保持为真的特征或行为。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性1：登录认证一致性
*对于任何*有效的用户凭证，登录后返回的用户信息应与数据库中存储的用户信息一致
**验证需求：1.2**

### 属性2：Token刷新有效性
*对于任何*有效的refresh_token，刷新后返回的新access_token应能正常访问受保护的API
**验证需求：1.6**

### 属性3：路由守卫正确性
*对于任何*未认证用户，访问requiresAuth为true的路由时应被重定向到登录页
**验证需求：1.8**

### 属性4：权限控制正确性
*对于任何*非管理员用户，访问requiresAdmin为true的路由时应被拒绝访问
**验证需求：1.9**

### 属性5：分类筛选正确性
*对于任何*分类筛选条件，返回的资源列表中所有资源的categoryId应与筛选条件一致
**验证需求：3.2**

### 属性6：VIP等级筛选正确性
*对于任何*VIP等级筛选条件，返回的资源列表中所有资源的vipLevel应小于等于筛选条件
**验证需求：3.3**

### 属性7：排序正确性
*对于任何*排序条件，返回的资源列表应按指定字段正确排序（升序或降序）
**验证需求：3.5**

### 属性8：分页正确性
*对于任何*分页请求，返回的list长度应小于等于pageSize，且total应等于符合条件的总记录数
**验证需求：3.10**

### 属性9：VIP下载权限正确性
*对于任何*VIP用户下载VIP资源，应不扣除积分且成功返回下载链接
**验证需求：4.1**

### 属性10：积分扣除正确性
*对于任何*付费资源下载，用户积分余额应减少相应的积分数量
**验证需求：4.4**

### 属性11：收藏状态一致性
*对于任何*收藏操作，收藏后查询收藏状态应返回true，取消收藏后应返回false
**验证需求：5.1, 5.2**

### 属性12：收藏数量一致性
*对于任何*资源，其collectCount应等于user_favorites表中该资源的收藏记录数
**验证需求：5.4**

### 属性13：API响应格式一致性
*对于任何*API请求，响应格式应包含code、message、data三个字段
**验证需求：19.2, 36.4**

### 属性14：字段命名转换正确性
*对于任何*API响应，字段名应为camelCase格式，不应出现snake_case格式
**验证需求：19.3, 37.3**

### 属性15：外键约束正确性
*对于任何*包含外键的数据插入，如果外键引用的记录不存在，应返回错误
**验证需求：18.1**

### 属性16：数据一致性
*对于任何*前端显示的数据，应与后端API返回的数据完全一致
**验证需求：46.1**

## 错误处理

### HTTP状态码使用规范

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | 成功 | GET、PUT、DELETE请求成功 |
| 201 | 创建成功 | POST请求创建资源成功 |
| 400 | 请求参数错误 | 缺少必填参数、参数格式错误 |
| 401 | 未认证 | Token无效或过期 |
| 403 | 无权限 | 用户无权访问该资源 |
| 404 | 资源不存在 | 请求的资源不存在 |
| 409 | 资源冲突 | 如手机号已注册 |
| 422 | 业务逻辑错误 | 如积分不足 |
| 429 | 请求过于频繁 | 触发限流 |
| 500 | 服务器内部错误 | 服务器异常 |

### 前端错误处理策略

```typescript
// 全局错误处理
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, data } = error.response || {};
    
    switch (status) {
      case 401:
        // Token过期，尝试刷新
        return refreshTokenAndRetry(error.config);
      case 403:
        // 无权限，显示提示
        ElMessage.error('您没有权限执行此操作');
        break;
      case 404:
        // 资源不存在
        ElMessage.error('请求的资源不存在');
        break;
      case 422:
        // 业务逻辑错误，显示具体信息
        ElMessage.error(data.message);
        break;
      case 500:
        // 服务器错误
        ElMessage.error('服务器繁忙，请稍后重试');
        break;
      default:
        ElMessage.error(data?.message || '请求失败');
    }
    
    return Promise.reject(error);
  }
);
```

### 后端错误处理策略

```typescript
// 统一错误处理中间件
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // 记录错误日志
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query
  });

  // 根据错误类型返回不同状态码
  if (err instanceof ValidationError) {
    return res.status(400).json({
      code: 400,
      message: err.message,
      data: null
    });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      code: 401,
      message: '未登录或登录已过期',
      data: null
    });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      code: 403,
      message: '无权限访问',
      data: null
    });
  }

  // 默认返回500
  return res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null
  });
};
```

## 测试策略

### 测试类型

1. **单元测试** - 测试单个函数或组件的正确性
2. **集成测试** - 测试多个模块之间的交互
3. **端到端测试** - 测试完整的用户流程
4. **API测试** - 测试后端接口的正确性
5. **UI测试** - 测试前端页面的显示和交互
6. **性能测试** - 测试系统的响应时间和并发能力

### 测试工具

- **前端单元测试**: Vitest
- **前端E2E测试**: Playwright (推荐) 或 Cypress
- **API测试**: 手动测试 + curl/Postman
- **性能测试**: Lighthouse, JMeter

### 测试数据准备

```sql
-- 测试用户数据
-- 普通用户
INSERT INTO users (user_id, phone, password_hash, nickname, vip_level, status)
VALUES ('user-test-001', '13800000001', '$2b$10$...', '测试用户A', 0, 1);

-- VIP用户
INSERT INTO users (user_id, phone, password_hash, nickname, vip_level, vip_expire_at, status)
VALUES ('user-test-002', '13800000002', '$2b$10$...', 'VIP用户A', 1, '2026-12-31', 1);

-- 管理员
INSERT INTO users (user_id, phone, password_hash, nickname, role_id, status)
VALUES ('user-test-admin', '13900000000', '$2b$10$...', '管理员', 'role-admin', 1);

-- 测试资源数据
INSERT INTO resources (resource_id, title, category_id, user_id, vip_level, audit_status, status)
VALUES 
  ('res-test-001', '免费资源A', 'cat-001', 'user-test-001', 0, 1, 1),
  ('res-test-002', 'VIP资源A', 'cat-001', 'user-test-001', 1, 1, 1),
  ('res-test-003', '待审核资源', 'cat-001', 'user-test-001', 0, 0, 1);
```

### 测试执行顺序

1. **第一阶段：环境准备**
   - 检查数据库连接
   - 检查后端服务启动
   - 检查前端服务启动
   - 准备测试数据

2. **第二阶段：认证模块测试**
   - 登录功能测试
   - 注册功能测试
   - Token刷新测试
   - 路由守卫测试

3. **第三阶段：首页功能测试**
   - 轮播图测试
   - 分类导航测试
   - 资源列表测试
   - 搜索功能测试
   - 公告功能测试

4. **第四阶段：资源模块测试**
   - 资源列表测试
   - 资源详情测试
   - 筛选排序测试
   - 下载功能测试
   - 收藏功能测试

5. **第五阶段：个人中心测试**
   - 用户信息测试
   - 下载历史测试
   - 上传历史测试
   - VIP信息测试

6. **第六阶段：上传功能测试**
   - 文件上传测试
   - 表单验证测试
   - 上传进度测试

7. **第七阶段：VIP和积分测试**
   - VIP套餐测试
   - VIP购买测试
   - 积分余额测试
   - 积分记录测试

8. **第八阶段：后台管理测试**
   - 数据概览测试
   - 用户管理测试
   - 资源管理测试
   - 内容审核测试
   - 分类管理测试
   - 轮播图管理测试
   - 公告管理测试
   - 系统设置测试

9. **第九阶段：集成测试**
   - 完整业务流程测试
   - 数据一致性测试
   - 跨模块交互测试

10. **第十阶段：性能和兼容性测试**
    - 页面加载性能测试
    - API响应时间测试
    - 跨浏览器兼容性测试
    - 移动端适配测试

### 回归测试策略

当修复一个bug后，必须执行以下回归测试：

1. **直接关联测试** - 测试修复的功能本身
2. **同模块测试** - 测试同一模块的其他功能
3. **依赖模块测试** - 测试依赖该模块的其他模块
4. **核心流程测试** - 测试涉及的核心业务流程

### 功能关联映射表

| 修改模块 | 需要回归测试的模块 |
|----------|-------------------|
| 认证模块 | 所有需要登录的功能、个人中心、后台管理 |
| 用户模块 | 个人中心、资源上传、评论、收藏 |
| 资源模块 | 首页、搜索、分类、下载、收藏 |
| 下载模块 | 积分、下载历史、资源统计 |
| 收藏模块 | 资源收藏数、个人收藏列表 |
| VIP模块 | 下载权限、VIP标识、特权功能 |
| 积分模块 | 下载、充值、提现、任务 |
| 后台管理 | 前台对应功能的显示和状态 |
