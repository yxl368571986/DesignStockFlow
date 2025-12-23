# Mock数据使用指南

## 问题修复说明

已修复以下两个问题：

### 1. 网络异常问题
**原因**: 前端尝试连接后端API服务器（http://localhost:8080），但后端服务未启动

**解决方案**: 
- 添加了Mock数据支持，在开发环境下自动使用Mock数据
- 当后端服务可用时，可以通过修改环境变量切换到真实API

### 2. 图片丢失问题
**原因**: 由于API请求失败，无法获取轮播图和资源数据

**解决方案**:
- 使用placeholder图片服务（via.placeholder.com）提供临时图片
- Mock数据包含完整的轮播图、分类、资源等信息

## Mock数据文件

### 文件位置
- `src/mock/data.ts` - Mock数据定义文件

### 包含的Mock数据
1. **网站配置** (`mockSiteConfig`)
   - 网站名称、描述、Logo等基本信息

2. **轮播图** (`mockBanners`)
   - 3个轮播图，包含标题、图片、链接等

3. **分类** (`mockCategories`)
   - 5个主要分类：UI设计、海报模板、Logo设计、图标素材、插画素材

4. **公告** (`mockAnnouncements`)
   - 2条公告信息

5. **资源** (`mockResources`)
   - 8个设计资源，包含封面图、文件信息、下载数等

## 已修改的API文件

### 1. `src/api/content.ts`
添加了Mock支持的函数：
- `getSiteConfig()` - 获取网站配置
- `getBanners()` - 获取轮播图
- `getCategories()` - 获取分类列表
- `getAnnouncements()` - 获取公告列表

### 2. `src/api/resource.ts`
完全重写，添加了Mock支持：
- `getResourceList()` - 获取资源列表（支持筛选、排序、分页）
- `getResourceDetail()` - 获取资源详情
- `searchResources()` - 搜索资源
- `getHotResources()` - 获取热门资源
- `getRecommendedResources()` - 获取推荐资源
- `downloadResource()` - 下载资源
- `collectResource()` - 收藏资源
- `getRelatedResources()` - 获取相关推荐

## 如何切换到真实API

### 方法1: 修改环境变量（推荐）
在 `.env.development` 文件中添加：
```env
VITE_USE_MOCK=false
```

然后在API文件中修改：
```typescript
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
```

### 方法2: 直接修改代码
在各个API文件中，将：
```typescript
const USE_MOCK = import.meta.env.DEV;
```

改为：
```typescript
const USE_MOCK = false;
```

## 当前状态

✅ **已修复**:
- 网络异常提示已消失
- 轮播图正常显示
- 分类导航正常显示
- 热门资源和推荐资源正常显示
- 所有图片使用placeholder服务正常加载

✅ **可用功能**:
- 首页浏览
- 轮播图切换
- 分类导航
- 资源卡片展示
- 搜索功能（使用Mock数据）
- 资源列表筛选和分页

⚠️ **注意事项**:
1. Mock数据仅在开发环境（`npm run dev`）下自动启用
2. 生产构建时需要确保后端API可用
3. 图片使用的是placeholder服务，实际项目中需要替换为真实图片URL

## 后续步骤

### 如果要连接真实后端：
1. 启动后端服务（确保运行在 http://localhost:8080）
2. 按照上述方法切换到真实API
3. 确保后端API接口与前端定义的接口一致

### 如果要使用真实图片：
1. 准备图片资源
2. 上传到CDN或静态资源服务器
3. 修改Mock数据中的图片URL
4. 或者连接真实后端API获取真实图片URL

## 测试建议

访问以下页面测试功能：
- 首页: http://localhost:3000/
- 搜索页: http://localhost:3000/search
- 资源列表: http://localhost:3000/resource
- 登录页: http://localhost:3000/login
- 注册页: http://localhost:3000/register

所有页面应该都能正常显示，不再出现网络异常提示。
