# 前端API对接完成指南

## 📋 任务完成情况

✅ **任务16.1 - 更新前端API配置**
- 更新了 `.env.development` 配置文件，将API地址改为 `http://localhost:3000/api/v1`
- 更新了 `.env.production` 配置文件，将API地址改为 `https://api.startide-design.com/api/v1`
- 更新了 `.env.example` 模板文件
- 更新了CDN和监控相关的URL配置

✅ **任务16.2 - 对接认证相关接口**
- 更新了 `src/api/auth.ts`，匹配后端实际的API路径
- 实现了以下接口：
  - `POST /auth/login` - 密码登录
  - `POST /auth/code-login` - 验证码登录
  - `POST /auth/register` - 用户注册
  - `POST /auth/send-code` - 发送验证码
  - `GET /auth/wechat/login` - 获取微信登录URL
  - `GET /user/info` - 获取用户信息

✅ **任务16.3 - 对接资源相关接口**
- 更新了 `src/api/resource.ts`，匹配后端实际的API路径
- 实现了以下接口：
  - `GET /resources` - 获取资源列表（支持筛选、排序、分页）
  - `GET /resources/:resourceId` - 获取资源详情
  - `POST /resources/upload` - 上传资源
  - `POST /resources/:resourceId/download` - 下载资源
  - `PUT /resources/:resourceId` - 编辑资源
  - `DELETE /resources/:resourceId` - 删除资源

✅ **任务16.4 - 对接用户相关接口**
- 更新了 `src/api/personal.ts`，匹配后端实际的API路径
- 实现了以下接口：
  - `GET /user/info` - 获取用户信息
  - `PUT /user/info` - 更新用户信息
  - `PUT /user/password` - 修改密码
  - `GET /user/download-history` - 获取下载记录
  - `GET /user/upload-history` - 获取上传记录
  - `POST /user/upload-avatar` - 上传头像
  - `POST /user/bind-email` - 绑定邮箱
  - `GET /user/collections` - 获取收藏列表

✅ **任务16.5 - 对接VIP和积分接口**
- 创建了 `src/api/vip.ts`，实现VIP相关接口
- 创建了 `src/api/points.ts`，实现积分相关接口
- 更新了 `src/api/index.ts`，导出新创建的API模块

## 🔧 API接口列表

### 认证接口 (auth.ts)
```typescript
// 密码登录
login(data: { phone: string; password: string })

// 验证码登录
codeLogin(data: { phone: string; code: string })

// 用户注册
register(data: RegisterRequest)

// 发送验证码
sendVerifyCode(data: { phone: string })

// 获取微信登录URL
getWechatLoginUrl()

// 获取用户信息
getUserInfo()

// 退出登录
logout()

// 刷新Token
refreshToken()
```

### 资源接口 (resource.ts)
```typescript
// 获取资源列表
getResourceList(params: SearchParams)

// 获取资源详情
getResourceDetail(resourceId: string)

// 搜索资源
searchResources(params: SearchParams)

// 获取热门资源
getHotResources(limit?: number)

// 获取推荐资源
getRecommendedResources(limit?: number)

// 上传资源
uploadResource(formData: FormData)

// 下载资源
downloadResource(resourceId: string)

// 编辑资源
updateResource(resourceId: string, data: Partial<ResourceInfo>)

// 删除资源
deleteResource(resourceId: string)

// 收藏资源
collectResource(resourceId: string)

// 取消收藏
uncollectResource(resourceId: string)

// 获取相关推荐
getRelatedResources(resourceId: string, limit?: number)
```

### 用户接口 (personal.ts)
```typescript
// 获取用户信息
getUserInfo()

// 更新用户信息
updateUserInfo(data: Partial<UserInfo>)

// 修改密码
changePassword(data: { oldPassword: string; newPassword: string })

// 获取下载记录
getDownloadHistory(params: PageParams)

// 获取上传记录
getUploadHistory(params: PageParams)

// 上传头像
uploadAvatar(formData: FormData)

// 绑定邮箱
bindEmail(data: { email: string; verifyCode: string })

// 获取收藏列表
getCollections(params: PageParams)

// 删除上传的资源
deleteUploadedResource(resourceId: string)
```

### VIP接口 (vip.ts)
```typescript
// 前台接口
getVipPackages()              // 获取VIP套餐列表
getVipPrivileges()            // 获取VIP特权列表
getUserVipInfo()              // 获取用户VIP信息

// 管理员接口
getAllVipPackages()           // 获取所有VIP套餐
createVipPackage(data)        // 创建VIP套餐
updateVipPackage(id, data)    // 更新VIP套餐
deleteVipPackage(id)          // 删除VIP套餐
getAllVipPrivileges()         // 获取所有VIP特权
updateVipPrivilege(id, data)  // 更新VIP特权
getVipOrders(params)          // 获取VIP订单列表
getVipOrderById(id)           // 获取VIP订单详情
refundVipOrder(id, reason)    // VIP订单退款
getVipStatistics()            // 获取VIP统计数据
adjustUserVip(userId, data)   // 手动调整用户VIP
```

### 积分接口 (points.ts)
```typescript
// 前台接口
getMyPointsInfo()             // 获取用户积分信息
getPointsRecords(params)      // 获取积分明细
getPointsProducts(params)     // 获取积分商品列表
exchangeProduct(data)         // 兑换积分商品
getExchangeRecords(params)    // 获取兑换记录
getRechargePackages()         // 获取充值套餐
createRecharge(data)          // 创建充值订单
getDailyTasks()               // 获取每日任务
completeTask(taskCode)        // 完成任务
dailySignin()                 // 每日签到

// 管理员接口
getPointsRules()              // 获取积分规则
updatePointsRule(id, data)    // 更新积分规则
getAdminPointsProducts()      // 获取积分商品列表
createPointsProduct(data)     // 添加积分商品
updatePointsProduct(id, data) // 编辑积分商品
deletePointsProduct(id)       // 删除积分商品
getAdminExchangeRecords(params) // 获取兑换记录
shipExchangeProduct(id, data) // 发货
getPointsStatistics()         // 获取积分统计
adjustUserPoints(userId, data) // 手动调整用户积分
```

## 🧪 测试API连接

### 方法1: 使用测试工具（推荐）

1. 启动后端服务：
```bash
cd backend
npm run dev
```

2. 启动前端服务：
```bash
npm run dev
```

3. 在浏览器控制台运行测试：
```javascript
// 打开浏览器控制台（F12）
window.testApi()
```

这将自动测试所有API接口的连接状态。

### 方法2: 手动测试

1. 确保后端服务运行在 `http://localhost:3000`

2. 在浏览器中访问健康检查接口：
```
http://localhost:3000/health
```

3. 测试具体的API接口：
```bash
# 测试获取VIP套餐列表
curl http://localhost:3000/api/v1/vip/packages

# 测试获取资源列表
curl http://localhost:3000/api/v1/resources?pageNum=1&pageSize=10
```

## 📝 环境变量配置

### 开发环境 (.env.development)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_CDN_BASE_URL=http://localhost:3000
VITE_IMAGE_CDN_URL=http://localhost:3000/uploads
VITE_ENABLE_MOCK=true
```

### 生产环境 (.env.production)
```env
VITE_API_BASE_URL=https://api.startide-design.com/api/v1
VITE_CDN_BASE_URL=https://cdn.startide-design.com
VITE_IMAGE_CDN_URL=https://cdn.startide-design.com/uploads
VITE_ENABLE_MOCK=false
```

## 🔍 Mock数据控制

通过环境变量 `VITE_ENABLE_MOCK` 控制是否使用Mock数据：

- `true`: 使用本地Mock数据（开发时无需后端）
- `false`: 使用真实API接口（需要后端服务运行）

在 `src/api/resource.ts` 中：
```typescript
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK === 'true';
```

## ⚠️ 注意事项

1. **API版本**: 所有API接口都使用 `/api/v1` 前缀
2. **认证方式**: 使用JWT Token，通过 `Authorization: Bearer <token>` 头部传递
3. **CSRF保护**: POST/PUT/DELETE请求需要CSRF Token
4. **字段命名**: 
   - 后端使用 `snake_case`（如 `user_id`）
   - 前端使用 `camelCase`（如 `userId`）
   - 中间件自动转换字段名
5. **错误处理**: 统一的错误响应格式，通过拦截器处理

## 🚀 下一步

现在API对接已完成，可以继续进行以下任务：

1. **任务17**: 实现资源详情页积分展示
2. **任务18**: 实现用户管理API（管理员）
3. **任务19**: 实现用户管理前端（管理后台）

## 📚 相关文档

- [后端API文档](./backend/README.md)
- [数据库设计文档](./.kiro/specs/frontend-fixes-and-backend/database-schema.md)
- [需求文档](./.kiro/specs/frontend-fixes-and-backend/requirements.md)
- [设计文档](./.kiro/specs/frontend-fixes-and-backend/design.md)

## 🐛 常见问题

### Q: API请求返回404
A: 检查后端服务是否运行，确认API路径是否正确

### Q: CORS错误
A: 确保后端配置了正确的CORS设置，允许前端域名访问

### Q: Token过期
A: 系统会自动刷新Token，如果刷新失败会跳转到登录页

### Q: 字段名不匹配
A: 检查中间件是否正确配置，确保字段名转换正常工作
