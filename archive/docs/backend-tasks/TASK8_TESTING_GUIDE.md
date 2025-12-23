# 任务8测试指南 - 认证服务

## 快速测试（无需数据库）

### 1. 测试核心功能

运行测试脚本验证认证服务的核心逻辑:

```bash
cd backend
npx tsx src/test-auth.ts
```

**测试内容**:
- ✅ 密码加密和验证（bcrypt）
- ✅ JWT Token生成和验证
- ✅ 手机号格式验证
- ✅ 密码强度验证

---

## 完整测试（需要数据库）

### 前置条件

1. **安装PostgreSQL 14+**
2. **启动PostgreSQL服务**
3. **创建数据库**:
   ```sql
   CREATE DATABASE startide_design;
   ```
4. **配置环境变量** (backend/.env):
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/startide_design?schema=public"
   JWT_SECRET="your-secret-key"
   ```

### 步骤1: 初始化数据库

```bash
cd backend

# 生成Prisma Client
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate

# 初始化基础数据
npm run prisma:seed
```

### 步骤2: 启动后端服务

```bash
npm run dev
```

服务器将在 `http://localhost:8080` 启动

### 步骤3: 测试API接口

#### 3.1 测试发送验证码

**PowerShell**:
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/send-code" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"13800138000","type":"register"}' | 
  Select-Object -ExpandProperty Content
```

**curl**:
```bash
curl -X POST http://localhost:8080/api/v1/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","type":"register"}'
```

**预期响应**:
```json
{
  "code": 200,
  "msg": "验证码已发送",
  "data": {
    "expireIn": 60
  },
  "timestamp": 1766312444000
}
```

#### 3.2 测试用户注册

**PowerShell**:
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"13800138001","verifyCode":"123456","password":"test123456"}' |
  Select-Object -ExpandProperty Content
```

**curl**:
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138001","verifyCode":"123456","password":"test123456"}'
```

**预期响应**:
```json
{
  "code": 200,
  "msg": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "userId": "uuid",
      "phone": "13800138001",
      "nickname": "用户8001",
      "vipLevel": 0,
      "roleCode": "user",
      "pointsBalance": 0,
      "pointsTotal": 0,
      "userLevel": 1,
      "status": 1
    }
  },
  "timestamp": 1766312444000
}
```

#### 3.3 测试用户登录

**PowerShell**:
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"13800138001","password":"test123456"}' |
  Select-Object -ExpandProperty Content
```

**curl**:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138001","password":"test123456"}'
```

**预期响应**:
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": { ... }
  },
  "timestamp": 1766312444000
}
```

#### 3.4 测试使用预置测试账号登录

数据库初始化后会创建3个测试账号:

**普通用户**:
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"13800000001","password":"test123456"}' |
  Select-Object -ExpandProperty Content
```

**VIP用户**:
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"13800000002","password":"test123456"}' |
  Select-Object -ExpandProperty Content
```

**管理员**:
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"13900000000","password":"test123456"}' |
  Select-Object -ExpandProperty Content
```

---

## 错误场景测试

### 1. 手机号格式错误

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"12345678901","verifyCode":"123456","password":"test123456"}'
```

**预期响应**:
```json
{
  "code": 400,
  "msg": "手机号格式不正确",
  "timestamp": 1766312444000
}
```

### 2. 密码过短

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"13800138002","verifyCode":"123456","password":"123"}'
```

**预期响应**:
```json
{
  "code": 400,
  "msg": "密码长度至少6位",
  "timestamp": 1766312444000
}
```

### 3. 手机号已注册

```powershell
# 先注册一次
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"13800138003","verifyCode":"123456","password":"test123456"}'

# 再次注册相同手机号
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"13800138003","verifyCode":"123456","password":"test123456"}'
```

**预期响应**:
```json
{
  "code": 400,
  "msg": "该手机号已注册",
  "timestamp": 1766312444000
}
```

### 4. 登录密码错误

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"13800138001","password":"wrongpassword"}'
```

**预期响应**:
```json
{
  "code": 400,
  "msg": "手机号或密码错误",
  "timestamp": 1766312444000
}
```

### 5. 用户不存在

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"phone":"19999999999","password":"test123456"}'
```

**预期响应**:
```json
{
  "code": 400,
  "msg": "手机号或密码错误",
  "timestamp": 1766312444000
}
```

---

## 使用Postman测试

### 1. 导入环境变量

创建环境变量:
- `base_url`: `http://localhost:8080`
- `token`: (登录后自动设置)

### 2. 创建请求集合

**发送验证码**:
- Method: POST
- URL: `{{base_url}}/api/v1/auth/send-code`
- Body (JSON):
  ```json
  {
    "phone": "13800138000",
    "type": "register"
  }
  ```

**用户注册**:
- Method: POST
- URL: `{{base_url}}/api/v1/auth/register`
- Body (JSON):
  ```json
  {
    "phone": "13800138001",
    "verifyCode": "123456",
    "password": "test123456"
  }
  ```
- Tests (自动保存Token):
  ```javascript
  if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
  }
  ```

**用户登录**:
- Method: POST
- URL: `{{base_url}}/api/v1/auth/login`
- Body (JSON):
  ```json
  {
    "phone": "13800138001",
    "password": "test123456"
  }
  ```
- Tests (自动保存Token):
  ```javascript
  if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
  }
  ```

---

## 验证清单

### 功能验证
- [ ] 发送验证码接口正常响应
- [ ] 用户注册成功并返回Token
- [ ] 用户登录成功并返回Token
- [ ] Token格式正确（JWT格式）
- [ ] 用户信息完整返回

### 验证逻辑
- [ ] 手机号格式验证生效
- [ ] 密码强度验证生效
- [ ] 重复注册被拒绝
- [ ] 错误密码登录失败
- [ ] 不存在用户登录失败

### 安全性
- [ ] 密码已加密存储（bcrypt）
- [ ] Token包含正确的用户信息
- [ ] Token有过期时间
- [ ] 错误信息不泄露敏感数据

### 性能
- [ ] 注册响应时间 < 1秒
- [ ] 登录响应时间 < 500ms
- [ ] 验证码发送响应时间 < 200ms

---

## 故障排查

### 问题1: 数据库连接失败

**错误**: `Can't reach database server at localhost:5432`

**解决方案**:
1. 确认PostgreSQL服务已启动
2. 检查`.env`中的`DATABASE_URL`配置
3. 确认数据库`startide_design`已创建
4. 测试数据库连接: `psql -U postgres -d startide_design`

### 问题2: Prisma Client未生成

**错误**: `Cannot find module '@prisma/client'`

**解决方案**:
```bash
npm run prisma:generate
```

### 问题3: 数据库表不存在

**错误**: `Table 'users' does not exist`

**解决方案**:
```bash
npm run prisma:migrate
npm run prisma:seed
```

### 问题4: Token验证失败

**错误**: `Token无效或已过期`

**解决方案**:
1. 检查Token格式是否正确
2. 确认Token未过期（有效期7天）
3. 检查JWT_SECRET配置是否一致

---

## 下一步

认证服务测试通过后，可以继续：

1. **任务9**: 实现权限控制系统
2. **任务10**: 实现用户管理API
3. **任务11**: 实现资源管理API

---

## 相关文档

- [TASK8_COMPLETION_SUMMARY.md](./TASK8_COMPLETION_SUMMARY.md) - 任务完成总结
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 数据库设置指南
- [QUICK_START_DATABASE.md](./QUICK_START_DATABASE.md) - 数据库快速启动

---

祝测试顺利！🚀
