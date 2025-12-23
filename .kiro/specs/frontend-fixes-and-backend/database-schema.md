# 数据库表规范文档

## 重要说明

本文档定义了数据库表结构与前端接口字段的映射关系,确保前后端数据对接的一致性。

**关键原则:**
1. 数据库字段使用**snake_case**(下划线命名)
2. 前端接口字段使用**camelCase**(驼峰命名)
3. 后端API返回数据时需要进行字段名转换
4. 前端发送数据时需要进行字段名转换

## 字段命名映射规则

### 通用映射规则

| 数据库字段 | 前端字段 | 说明 |
|-----------|---------|------|
| user_id | userId | 用户ID |
| resource_id | resourceId | 资源ID |
| category_id | categoryId | 分类ID |
| created_at | createTime | 创建时间 |
| updated_at | updateTime | 更新时间 |
| vip_level | vipLevel | VIP等级 |
| vip_expire_at | vipExpireTime | VIP到期时间 |
| file_url | fileUrl | 文件URL |
| file_size | fileSize | 文件大小 |
| file_format | format 或 fileFormat | 文件格式 |
| download_count | downloadCount | 下载次数 |
| view_count | viewCount | 浏览次数 |
| collect_count | collectCount | 收藏次数 |
| audit_status | isAudit | 审核状态 |
| audit_msg | auditMsg | 审核信息 |

## 核心数据表结构

### 1. users 表 (用户表)

**数据库表结构:**
```sql
CREATE TABLE users (
  user_id VARCHAR(36) PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  avatar VARCHAR(500),
  email VARCHAR(100),
  bio TEXT,
  vip_level INTEGER DEFAULT 0,
  vip_expire_at TIMESTAMP,
  points_balance INTEGER DEFAULT 0,
  points_total INTEGER DEFAULT 0,
  user_level INTEGER DEFAULT 1,
  role_id VARCHAR(36),
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);
```

**前端接口字段 (UserInfo):**
```typescript
interface UserInfo {
  userId: string;              // user_id
  phone: string;               // phone
  nickname: string;            // nickname
  avatar: string;              // avatar
  email?: string;              // email
  vipLevel: number;            // vip_level
  vipExpireTime?: string;      // vip_expire_at (ISO 8601格式)
  createTime: string;          // created_at (ISO 8601格式)
}
```

**字段映射:**
- `user_id` → `userId`
- `vip_level` → `vipLevel`
- `vip_expire_at` → `vipExpireTime`
- `created_at` → `createTime`
- `password_hash` 不返回给前端
- `role_id`, `status`, `updated_at`, `last_login_at` 不返回给普通用户

### 2. resources 表 (资源表)

**数据库表结构:**
```sql
CREATE TABLE resources (
  resource_id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  cover VARCHAR(500),
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_format VARCHAR(20) NOT NULL,
  preview_images TEXT[],
  category_id VARCHAR(36),
  tags TEXT[],
  vip_level INTEGER DEFAULT 0,
  user_id VARCHAR(36),
  audit_status INTEGER DEFAULT 0,
  audit_msg TEXT,
  auditor_id VARCHAR(36),
  audited_at TIMESTAMP,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  collect_count INTEGER DEFAULT 0,
  is_top BOOLEAN DEFAULT FALSE,
  is_recommend BOOLEAN DEFAULT FALSE,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**前端接口字段 (ResourceInfo):**
```typescript
interface ResourceInfo {
  resourceId: string;          // resource_id
  title: string;               // title
  description: string;         // description
  cover: string;               // cover
  coverUrl?: string;           // cover (兼容字段)
  previewImages: string[];     // preview_images
  format: string;              // file_format
  fileFormat?: string;         // file_format (兼容字段)
  fileSize: number;            // file_size
  fileUrl?: string;            // file_url (仅下载时返回)
  downloadCount: number;       // download_count
  viewCount?: number;          // view_count
  collectCount?: number;       // collect_count
  vipLevel: number;            // vip_level
  categoryId: string;          // category_id
  categoryName: string;        // 从categories表关联查询
  tags: string[];              // tags
  uploaderId: string;          // user_id
  uploaderName: string;        // 从users表关联查询nickname
  isAudit: number;             // audit_status
  auditMsg?: string;           // audit_msg
  createTime: string;          // created_at (ISO 8601格式)
  updateTime: string;          // updated_at (ISO 8601格式)
}
```

**字段映射:**
- `resource_id` → `resourceId`
- `file_format` → `format` 和 `fileFormat`
- `file_size` → `fileSize`
- `file_url` → `fileUrl`
- `preview_images` → `previewImages`
- `category_id` → `categoryId`
- `download_count` → `downloadCount`
- `view_count` → `viewCount`
- `collect_count` → `collectCount`
- `vip_level` → `vipLevel`
- `user_id` → `uploaderId`
- `audit_status` → `isAudit`
- `audit_msg` → `auditMsg`
- `created_at` → `createTime`
- `updated_at` → `updateTime`

**特殊说明:**
- `categoryName` 需要通过JOIN查询categories表获取
- `uploaderName` 需要通过JOIN查询users表获取
- `fileUrl` 仅在下载时返回,列表和详情页不返回

### 3. categories 表 (分类表)

**数据库表结构:**
```sql
CREATE TABLE categories (
  category_id VARCHAR(36) PRIMARY KEY,
  category_name VARCHAR(50) NOT NULL,
  category_code VARCHAR(50) UNIQUE NOT NULL,
  parent_id VARCHAR(36),
  icon VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_hot BOOLEAN DEFAULT FALSE,
  is_recommend BOOLEAN DEFAULT FALSE,
  resource_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**前端接口字段 (CategoryInfo):**
```typescript
interface CategoryInfo {
  categoryId: string;          // category_id
  categoryName: string;        // category_name
  icon?: string;               // icon
  parentId?: string | null;    // parent_id
  sort: number;                // sort_order
  isHot: boolean;              // is_hot
  isRecommend: boolean;        // is_recommend
  resourceCount: number;       // resource_count
}
```

**字段映射:**
- `category_id` → `categoryId`
- `category_name` → `categoryName`
- `parent_id` → `parentId`
- `sort_order` → `sort`
- `is_hot` → `isHot`
- `is_recommend` → `isRecommend`
- `resource_count` → `resourceCount`

### 4. banners 表 (轮播图表)

**数据库表结构:**
```sql
CREATE TABLE banners (
  banner_id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  link_url VARCHAR(500),
  link_type VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**前端接口字段 (BannerInfo):**
```typescript
interface BannerInfo {
  bannerId: string;            // banner_id
  title: string;               // title
  imageUrl: string;            // image_url
  linkType: string;            // link_type
  linkUrl: string;             // link_url
  sort: number;                // sort_order
  status: number;              // status
  startTime?: string;          // start_time (ISO 8601格式)
  endTime?: string;            // end_time (ISO 8601格式)
}
```

**字段映射:**
- `banner_id` → `bannerId`
- `image_url` → `imageUrl`
- `link_url` → `linkUrl`
- `link_type` → `linkType`
- `sort_order` → `sort`
- `start_time` → `startTime`
- `end_time` → `endTime`

### 5. announcements 表 (公告表)

**数据库表结构:**
```sql
CREATE TABLE announcements (
  announcement_id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'normal',
  link_url VARCHAR(500),
  is_top BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**前端接口字段 (AnnouncementInfo):**
```typescript
interface AnnouncementInfo {
  announcementId: string;      // announcement_id
  title: string;               // title
  content: string;             // content
  type: string;                // type
  level: string;               // type (兼容字段,映射关系: normal→normal, important→important, warning→warning)
  isTop: boolean;              // is_top
  linkUrl?: string;            // link_url
  status: number;              // status
  createTime: string;          // created_at (ISO 8601格式)
}
```

**字段映射:**
- `announcement_id` → `announcementId`
- `link_url` → `linkUrl`
- `is_top` → `isTop`
- `created_at` → `createTime`

### 6. vip_packages 表 (VIP套餐表)

**数据库表结构:**
```sql
CREATE TABLE vip_packages (
  package_id VARCHAR(36) PRIMARY KEY,
  package_name VARCHAR(50) NOT NULL,
  package_code VARCHAR(50) UNIQUE NOT NULL,
  duration_days INTEGER NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**前端接口字段:**
```typescript
interface VIPPackage {
  packageId: string;           // package_id
  packageName: string;         // package_name
  packageCode: string;         // package_code
  durationDays: number;        // duration_days
  originalPrice: number;       // original_price
  currentPrice: number;        // current_price
  description: string;         // description
  discount?: string;           // 计算得出: (currentPrice / originalPrice * 10).toFixed(1) + '折'
}
```

**字段映射:**
- `package_id` → `packageId`
- `package_name` → `packageName`
- `package_code` → `packageCode`
- `duration_days` → `durationDays`
- `original_price` → `originalPrice`
- `current_price` → `currentPrice`

### 7. points_records 表 (积分记录表)

**数据库表结构:**
```sql
CREATE TABLE points_records (
  record_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  points_change INTEGER NOT NULL,
  points_balance INTEGER NOT NULL,
  change_type VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL,
  source_id VARCHAR(36),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**前端接口字段:**
```typescript
interface PointsRecord {
  recordId: string;            // record_id
  pointsChange: number;        // points_change
  pointsBalance: number;       // points_balance
  changeType: string;          // change_type
  source: string;              // source
  description: string;         // description
  createdAt: string;           // created_at (ISO 8601格式)
}
```

**字段映射:**
- `record_id` → `recordId`
- `points_change` → `pointsChange`
- `points_balance` → `pointsBalance`
- `change_type` → `changeType`
- `created_at` → `createdAt`

### 8. download_history 表 (下载记录表)

**数据库表结构:**
```sql
CREATE TABLE download_history (
  download_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  resource_id VARCHAR(36),
  points_cost INTEGER DEFAULT 0,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**前端接口字段 (DownloadRecord):**
```typescript
interface DownloadRecord {
  recordId: string;            // download_id
  resourceId: string;          // resource_id
  resourceTitle: string;       // 从resources表关联查询
  resourceCover: string;       // 从resources表关联查询
  resourceFormat: string;      // 从resources表关联查询
  downloadTime: string;        // created_at (ISO 8601格式)
}
```

**字段映射:**
- `download_id` → `recordId`
- `resource_id` → `resourceId`
- `created_at` → `downloadTime`

## 时间格式规范

### 数据库存储格式
- 使用PostgreSQL的`TIMESTAMP`类型
- 存储UTC时间
- 示例: `2024-01-01 12:00:00+00`

### API返回格式
- 使用ISO 8601格式
- 包含时区信息
- 示例: `2024-01-01T12:00:00Z` 或 `2024-01-01T20:00:00+08:00`

### 前端显示格式
- 根据用户时区自动转换
- 显示格式: `YYYY-MM-DD HH:mm:ss`
- 示例: `2024-01-01 20:00:00`

## 后端字段转换实现

### 方案1: 使用Prisma中间件

```typescript
// prisma/middleware.ts
import { Prisma } from '@prisma/client';

// 字段名映射表
const fieldMapping: Record<string, string> = {
  user_id: 'userId',
  resource_id: 'resourceId',
  category_id: 'categoryId',
  created_at: 'createTime',
  updated_at: 'updateTime',
  vip_level: 'vipLevel',
  vip_expire_at: 'vipExpireTime',
  file_url: 'fileUrl',
  file_size: 'fileSize',
  file_format: 'format',
  download_count: 'downloadCount',
  view_count: 'viewCount',
  collect_count: 'collectCount',
  audit_status: 'isAudit',
  audit_msg: 'auditMsg',
  // ... 其他映射
};

// 转换对象键名
function transformKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const newKey = fieldMapping[key] || key;
      acc[newKey] = transformKeys(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
}

// Prisma中间件
export const fieldTransformMiddleware: Prisma.Middleware = async (params, next) => {
  const result = await next(params);
  return transformKeys(result);
};
```

### 方案2: 使用DTO转换类

```typescript
// dto/user.dto.ts
export class UserDTO {
  static toResponse(user: any): UserInfo {
    return {
      userId: user.user_id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      vipLevel: user.vip_level,
      vipExpireTime: user.vip_expire_at?.toISOString(),
      createTime: user.created_at.toISOString(),
    };
  }
}

// dto/resource.dto.ts
export class ResourceDTO {
  static toResponse(resource: any, category?: any, uploader?: any): ResourceInfo {
    return {
      resourceId: resource.resource_id,
      title: resource.title,
      description: resource.description,
      cover: resource.cover,
      coverUrl: resource.cover,
      previewImages: resource.preview_images || [],
      format: resource.file_format,
      fileFormat: resource.file_format,
      fileSize: resource.file_size,
      downloadCount: resource.download_count,
      viewCount: resource.view_count,
      collectCount: resource.collect_count,
      vipLevel: resource.vip_level,
      categoryId: resource.category_id,
      categoryName: category?.category_name || '',
      tags: resource.tags || [],
      uploaderId: resource.user_id,
      uploaderName: uploader?.nickname || '',
      isAudit: resource.audit_status,
      auditMsg: resource.audit_msg,
      createTime: resource.created_at.toISOString(),
      updateTime: resource.updated_at.toISOString(),
    };
  }
}
```

## 前端字段转换实现

### 发送请求时转换

```typescript
// utils/fieldTransform.ts
const fieldMapping: Record<string, string> = {
  userId: 'user_id',
  resourceId: 'resource_id',
  categoryId: 'category_id',
  vipLevel: 'vip_level',
  fileUrl: 'file_url',
  fileSize: 'file_size',
  // ... 其他映射
};

export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const newKey = fieldMapping[key] || key;
      acc[newKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
}

export function toCamelCase(obj: any): any {
  // 反向映射
  const reverseMapping = Object.entries(fieldMapping).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {} as Record<string, string>);
  
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const newKey = reverseMapping[key] || key;
      acc[newKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
}
```

## 注意事项

1. **时间字段处理:**
   - 数据库存储UTC时间
   - API返回ISO 8601格式
   - 前端根据用户时区显示

2. **兼容性字段:**
   - 某些字段提供多个名称(如`format`和`fileFormat`)
   - 后端应同时返回这两个字段
   - 前端优先使用新字段名

3. **关联查询:**
   - `categoryName`需要JOIN查询
   - `uploaderName`需要JOIN查询
   - 避免N+1查询问题

4. **敏感字段:**
   - `password_hash`永远不返回给前端
   - `ip_address`仅管理员可见
   - `user_agent`仅管理员可见

5. **NULL值处理:**
   - 数据库NULL值转换为前端undefined
   - 前端undefined转换为数据库NULL

## 测试建议

1. **单元测试:**
   - 测试字段转换函数
   - 测试DTO转换类

2. **集成测试:**
   - 测试API返回的字段名
   - 测试前端发送的字段名

3. **E2E测试:**
   - 测试完整的数据流转
   - 确保前后端数据一致

## 总结

本文档定义了数据库表结构与前端接口字段的完整映射关系。开发时请严格遵守以下原则:

1. 数据库使用snake_case命名
2. 前端使用camelCase命名
3. 后端API负责字段名转换
4. 时间统一使用ISO 8601格式
5. 敏感字段不返回给前端
6. 关联查询避免N+1问题

遵守这些规范可以确保前后端数据对接的一致性和可维护性。
