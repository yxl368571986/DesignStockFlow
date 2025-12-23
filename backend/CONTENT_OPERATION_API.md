# 内容运营API文档

本文档描述了内容运营相关的API接口，包括轮播图管理、公告管理和推荐位管理。

## 1. 轮播图管理API

### 1.1 获取轮播图列表

**接口地址**: `GET /api/v1/admin/banners`

**权限要求**: 需要管理员权限

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | number | 否 | 状态筛选 (1:启用 0:禁用) |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "获取轮播图列表成功",
  "data": {
    "list": [
      {
        "banner_id": "uuid",
        "title": "春节活动",
        "image_url": "https://example.com/banner1.jpg",
        "link_url": "https://example.com/activity",
        "link_type": "external",
        "sort_order": 1,
        "start_time": "2024-01-01T00:00:00Z",
        "end_time": "2024-02-01T00:00:00Z",
        "status": 1,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

### 1.2 添加轮播图

**接口地址**: `POST /api/v1/admin/banners`

**权限要求**: 需要管理员权限

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 轮播图标题 |
| imageUrl | string | 是 | 图片URL |
| linkUrl | string | 否 | 链接URL |
| linkType | string | 否 | 链接类型 (internal/external/category/resource) |
| sortOrder | number | 否 | 排序值，默认0 |
| startTime | string | 否 | 生效开始时间 (ISO 8601格式) |
| endTime | string | 否 | 生效结束时间 (ISO 8601格式) |
| status | number | 否 | 状态 (1:启用 0:禁用)，默认1 |

**请求示例**:
```json
{
  "title": "春节活动",
  "imageUrl": "https://example.com/banner1.jpg",
  "linkUrl": "https://example.com/activity",
  "linkType": "external",
  "sortOrder": 1,
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-02-01T00:00:00Z",
  "status": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "添加轮播图成功",
  "data": {
    "banner_id": "uuid",
    "title": "春节活动",
    "image_url": "https://example.com/banner1.jpg",
    "link_url": "https://example.com/activity",
    "link_type": "external",
    "sort_order": 1,
    "start_time": "2024-01-01T00:00:00Z",
    "end_time": "2024-02-01T00:00:00Z",
    "status": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 1.3 编辑轮播图

**接口地址**: `PUT /api/v1/admin/banners/:bannerId`

**权限要求**: 需要管理员权限

**请求参数**: 同添加轮播图，所有字段均为可选

**响应示例**:
```json
{
  "code": 200,
  "message": "编辑轮播图成功",
  "data": {
    "banner_id": "uuid",
    "title": "春节活动（已更新）",
    ...
  }
}
```

### 1.4 删除轮播图

**接口地址**: `DELETE /api/v1/admin/banners/:bannerId`

**权限要求**: 需要管理员权限

**响应示例**:
```json
{
  "code": 200,
  "message": "删除轮播图成功"
}
```

---

## 2. 公告管理API

### 2.1 获取公告列表

**接口地址**: `GET /api/v1/admin/announcements`

**权限要求**: 需要管理员权限

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | number | 否 | 状态筛选 (1:启用 0:禁用) |
| type | string | 否 | 类型筛选 (normal/important/warning) |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "获取公告列表成功",
  "data": {
    "list": [
      {
        "announcement_id": "uuid",
        "title": "系统维护通知",
        "content": "系统将于今晚22:00-24:00进行维护",
        "type": "important",
        "link_url": null,
        "is_top": true,
        "start_time": "2024-01-01T00:00:00Z",
        "end_time": "2024-02-01T00:00:00Z",
        "status": 1,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

### 2.2 添加公告

**接口地址**: `POST /api/v1/admin/announcements`

**权限要求**: 需要管理员权限

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 公告标题 |
| content | string | 是 | 公告内容 |
| type | string | 否 | 公告类型 (normal/important/warning)，默认normal |
| linkUrl | string | 否 | 链接URL |
| isTop | boolean | 否 | 是否置顶，默认false |
| startTime | string | 否 | 生效开始时间 (ISO 8601格式) |
| endTime | string | 否 | 生效结束时间 (ISO 8601格式) |
| status | number | 否 | 状态 (1:启用 0:禁用)，默认1 |

**请求示例**:
```json
{
  "title": "系统维护通知",
  "content": "系统将于今晚22:00-24:00进行维护，期间无法访问",
  "type": "important",
  "isTop": true,
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-02-01T00:00:00Z",
  "status": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "添加公告成功",
  "data": {
    "announcement_id": "uuid",
    "title": "系统维护通知",
    "content": "系统将于今晚22:00-24:00进行维护，期间无法访问",
    "type": "important",
    "link_url": null,
    "is_top": true,
    "start_time": "2024-01-01T00:00:00Z",
    "end_time": "2024-02-01T00:00:00Z",
    "status": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 2.3 编辑公告

**接口地址**: `PUT /api/v1/admin/announcements/:announcementId`

**权限要求**: 需要管理员权限

**请求参数**: 同添加公告，所有字段均为可选

**响应示例**:
```json
{
  "code": 200,
  "message": "编辑公告成功",
  "data": {
    "announcement_id": "uuid",
    "title": "系统维护通知（已更新）",
    ...
  }
}
```

### 2.4 删除公告

**接口地址**: `DELETE /api/v1/admin/announcements/:announcementId`

**权限要求**: 需要管理员权限

**响应示例**:
```json
{
  "code": 200,
  "message": "删除公告成功"
}
```

---

## 3. 推荐位管理API

推荐位配置通过系统配置表管理，支持自动推荐和手动选择两种模式。

### 3.1 获取推荐位配置列表

**接口地址**: `GET /api/v1/admin/recommends`

**权限要求**: 需要管理员权限

**响应示例**:
```json
{
  "code": 200,
  "message": "获取推荐位配置成功",
  "data": [
    {
      "config_id": "uuid",
      "config_key": "recommend_home_hot",
      "config_value": {
        "name": "热门推荐",
        "mode": "auto",
        "type": "hot",
        "limit": 8,
        "resourceIds": [],
        "status": 1
      },
      "config_type": "json",
      "description": "首页热门推荐位配置",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    {
      "config_id": "uuid",
      "config_key": "recommend_home_latest",
      "config_value": {
        "name": "最新上传",
        "mode": "auto",
        "type": "latest",
        "limit": 8,
        "resourceIds": [],
        "status": 1
      },
      "config_type": "json",
      "description": "首页最新上传推荐位配置",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 3.2 创建推荐位配置

**接口地址**: `POST /api/v1/admin/recommends`

**权限要求**: 需要管理员权限

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| key | string | 是 | 配置键（会自动添加recommend_前缀） |
| name | string | 是 | 推荐位名称 |
| mode | string | 否 | 推荐模式 (auto/manual)，默认auto |
| type | string | 否 | 推荐类型 (hot/latest/vip)，默认hot（仅auto模式需要） |
| limit | number | 否 | 显示数量限制，默认8 |
| resourceIds | array | 否 | 资源ID数组（仅manual模式需要），默认[] |
| status | number | 否 | 状态 (1:启用 0:禁用)，默认1 |
| description | string | 否 | 配置描述 |

**请求示例（自动推荐）**:
```json
{
  "key": "home_featured",
  "name": "精选推荐",
  "mode": "auto",
  "type": "hot",
  "limit": 10,
  "status": 1,
  "description": "首页精选推荐位"
}
```

**请求示例（手动选择）**:
```json
{
  "key": "home_manual",
  "name": "编辑推荐",
  "mode": "manual",
  "limit": 6,
  "resourceIds": ["resource-id-1", "resource-id-2", "resource-id-3"],
  "status": 1,
  "description": "首页编辑手动推荐位"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "创建推荐位配置成功",
  "data": {
    "config_id": "uuid",
    "config_key": "recommend_home_featured",
    "config_value": {
      "name": "精选推荐",
      "mode": "auto",
      "type": "hot",
      "limit": 10,
      "resourceIds": [],
      "status": 1
    },
    "config_type": "json",
    "description": "首页精选推荐位",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 3.3 更新推荐位配置

**接口地址**: `PUT /api/v1/admin/recommends/:recommendId`

**权限要求**: 需要管理员权限

**请求参数**: 同创建推荐位配置，所有字段均为可选

**请求示例（切换为手动模式）**:
```json
{
  "mode": "manual",
  "resourceIds": ["resource-id-1", "resource-id-2", "resource-id-3", "resource-id-4"]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "配置推荐位成功",
  "data": {
    "config_id": "uuid",
    "config_key": "recommend_home_hot",
    "config_value": {
      "name": "热门推荐",
      "mode": "manual",
      "type": "hot",
      "limit": 8,
      "resourceIds": ["resource-id-1", "resource-id-2", "resource-id-3", "resource-id-4"],
      "status": 1
    },
    "config_type": "json",
    "description": "首页热门推荐位配置",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 3.4 删除推荐位配置

**接口地址**: `DELETE /api/v1/admin/recommends/:recommendId`

**权限要求**: 需要管理员权限

**响应示例**:
```json
{
  "code": 200,
  "message": "删除推荐位配置成功"
}
```

---

## 推荐位模式说明

### 自动推荐模式 (mode: "auto")

自动推荐模式下，系统根据配置的类型自动获取资源：

- **hot**: 按综合评分排序（下载量、浏览量、收藏数等）
- **latest**: 按发布时间倒序排列
- **vip**: 仅显示VIP专属资源

前端调用资源列表接口时，传入对应的排序参数即可。

### 手动选择模式 (mode: "manual")

手动选择模式下，运营人员手动选择要展示的资源：

- 需要提供 `resourceIds` 数组
- 前端根据资源ID批量获取资源详情
- 按照 `resourceIds` 的顺序展示

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 注意事项

1. 所有接口都需要管理员权限，需要在请求头中携带有效的JWT Token
2. 时间参数使用ISO 8601格式（如：2024-01-01T00:00:00Z）
3. 轮播图和公告支持设置生效时间范围，超出时间范围的内容不会在前台展示
4. 推荐位配置存储在系统配置表中，配置键以 `recommend_` 开头
5. 手动推荐模式下，必须提供至少一个资源ID
6. 公告类型包括：normal（普通）、important（重要）、warning（警告）
7. 轮播图链接类型包括：internal（内部链接）、external（外部链接）、category（分类页）、resource（资源详情页）
