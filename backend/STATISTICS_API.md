# 数据统计API文档

## 概述

本文档描述了管理员数据统计相关的API接口。所有接口都需要管理员权限（`statistics:view`）。

## 基础URL

```
/api/v1/admin/statistics
```

## 认证

所有接口都需要在请求头中携带JWT Token：

```
Authorization: Bearer <token>
```

## 接口列表

### 1. 获取数据概览

获取平台核心数据概览，包括用户总数、资源总数、今日下载量等。

**请求**

```
GET /api/v1/admin/statistics/overview
```

**响应示例**

```json
{
  "code": 200,
  "message": "获取数据概览成功",
  "data": {
    "totalUsers": 1250,
    "totalResources": 3420,
    "todayDownloads": 156,
    "todayUploads": 23,
    "vipUsers": 89,
    "pendingAudit": 12
  }
}
```

### 2. 获取用户增长趋势

获取最近30天的用户注册趋势数据。

**请求**

```
GET /api/v1/admin/statistics/user-growth
```

**响应示例**

```json
{
  "code": 200,
  "message": "获取用户增长趋势成功",
  "data": [
    {
      "date": "2025-12-01",
      "count": 15
    },
    {
      "date": "2025-12-02",
      "count": 23
    }
    // ... 30天数据
  ]
}
```

### 3. 获取资源增长趋势

获取最近30天的资源上传趋势数据。

**请求**

```
GET /api/v1/admin/statistics/resource-growth
```

**响应示例**

```json
{
  "code": 200,
  "message": "获取资源增长趋势成功",
  "data": [
    {
      "date": "2025-12-01",
      "count": 45
    },
    {
      "date": "2025-12-02",
      "count": 52
    }
    // ... 30天数据
  ]
}
```

### 4. 获取下载统计

获取最近30天的下载量趋势数据。

**请求**

```
GET /api/v1/admin/statistics/download
```

**响应示例**

```json
{
  "code": 200,
  "message": "获取下载统计成功",
  "data": [
    {
      "date": "2025-12-01",
      "count": 234
    },
    {
      "date": "2025-12-02",
      "count": 189
    }
    // ... 30天数据
  ]
}
```

### 5. 获取热门资源TOP10

获取下载量最高的10个资源。

**请求**

```
GET /api/v1/admin/statistics/hot-resources
```

**响应示例**

```json
{
  "code": 200,
  "message": "获取热门资源成功",
  "data": [
    {
      "resourceId": "uuid-1",
      "title": "精美UI设计套件",
      "cover": "/uploads/cover1.jpg",
      "downloadCount": 1523,
      "viewCount": 5234,
      "likeCount": 456,
      "collectCount": 789,
      "createdAt": "2025-11-15T08:30:00.000Z",
      "uploader": {
        "userId": "uuid-user-1",
        "nickname": "设计师小王",
        "avatar": "/uploads/avatar1.jpg"
      }
    }
    // ... 最多10条
  ]
}
```

### 6. 获取热门分类TOP10

获取资源数量最多的10个分类。

**请求**

```
GET /api/v1/admin/statistics/hot-categories
```

**响应示例**

```json
{
  "code": 200,
  "message": "获取热门分类成功",
  "data": [
    {
      "categoryId": "uuid-cat-1",
      "categoryName": "UI设计类",
      "categoryCode": "ui-design",
      "icon": "/icons/ui.svg",
      "resourceCount": 856
    }
    // ... 最多10条
  ]
}
```

### 7. 获取活跃用户TOP10

获取下载量最高的10个用户。

**请求**

```
GET /api/v1/admin/statistics/active-users
```

**响应示例**

```json
{
  "code": 200,
  "message": "获取活跃用户成功",
  "data": [
    {
      "userId": "uuid-user-1",
      "nickname": "设计爱好者",
      "avatar": "/uploads/avatar1.jpg",
      "vipLevel": 1,
      "pointsBalance": 1250,
      "userLevel": 5,
      "downloadCount": 234
    }
    // ... 最多10条
  ]
}
```

### 8. 获取自定义时间范围统计

获取指定时间范围内的统计数据。

**请求**

```
GET /api/v1/admin/statistics/custom?start_date=2025-12-01&end_date=2025-12-22
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 是 | 开始日期，格式：YYYY-MM-DD |
| end_date | string | 是 | 结束日期，格式：YYYY-MM-DD |

**响应示例**

```json
{
  "code": 200,
  "message": "获取自定义时间范围统计成功",
  "data": {
    "startDate": "2025-12-01",
    "endDate": "2025-12-22",
    "userCount": 156,
    "resourceCount": 423,
    "downloadCount": 3456,
    "vipOrderCount": 45,
    "vipOrderAmount": 13455.50,
    "pointsRechargeCount": 89,
    "pointsRechargeAmount": 4567.00,
    "totalRevenue": 18022.50
  }
}
```

## 错误响应

所有接口在出错时返回统一的错误格式：

```json
{
  "code": 400,
  "message": "错误信息描述",
  "data": null
}
```

常见错误码：

- `400`: 请求参数错误
- `401`: 未认证，需要登录
- `403`: 无权限访问
- `500`: 服务器内部错误

## 权限要求

所有统计接口都需要 `statistics:view` 权限。该权限通常分配给以下角色：

- 超级管理员（super_admin）
- 数据分析员（如果配置）

## 使用示例

### JavaScript/TypeScript

```typescript
// 获取数据概览
async function getOverview() {
  const response = await fetch('/api/v1/admin/statistics/overview', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log(data);
}

// 获取自定义时间范围统计
async function getCustomStats(startDate: string, endDate: string) {
  const url = `/api/v1/admin/statistics/custom?start_date=${startDate}&end_date=${endDate}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log(data);
}
```

### cURL

```bash
# 获取数据概览
curl -X GET "http://localhost:3000/api/v1/admin/statistics/overview" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取用户增长趋势
curl -X GET "http://localhost:3000/api/v1/admin/statistics/user-growth" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取自定义时间范围统计
curl -X GET "http://localhost:3000/api/v1/admin/statistics/custom?start_date=2025-12-01&end_date=2025-12-22" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 注意事项

1. 所有日期时间字段都使用ISO 8601格式
2. 趋势数据默认返回最近30天，每天一个数据点
3. TOP10排行榜按降序排列
4. 自定义时间范围统计支持任意时间段，但建议不要超过1年
5. 所有金额字段单位为元（人民币）
6. 数据统计可能有轻微延迟（通常在1分钟内）

## 更新日志

### v1.0.0 (2025-12-22)

- 初始版本
- 实现8个统计接口
- 支持数据概览、趋势分析、TOP10排行、自定义时间范围统计
