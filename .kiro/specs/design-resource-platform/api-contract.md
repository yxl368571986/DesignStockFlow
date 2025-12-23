# 前后端接口约定文档

## 说明

本文档定义前端需要调用的后端API接口规范。**前端只负责调用这些接口，具体的业务逻辑（文件转换、AI审核等）由后端实现。**

---

## 通用规范

### 请求头
```
Content-Type: application/json;charset=utf-8
Authorization: Bearer {token}  // 登录后携带
X-Requested-With: XMLHttpRequest
```

### 统一响应格式
```typescript
{
  code: number;      // 200表示成功，其他表示失败
  msg: string;       // 提示信息
  data: any;         // 响应数据
  timestamp: number; // 时间戳
}
```

### 错误码说明
- `200`: 成功
- `401`: 未登录或Token过期
- `403`: 权限不足
- `500`: 服务器错误

---

## 核心接口列表

### 1. 文件上传接口

#### 1.1 文件格式校验
```
POST /api/upload/validate
```

**请求参数：**
```typescript
{
  fileName: string;  // 文件名
  fileSize: number;  // 文件大小（字节）
}
```

**响应数据：**
```typescript
{
  isValid: boolean;  // 是否允许上传
  msg: string;       // 提示信息（如"仅支持PSD/AI/CDR等格式"）
}
```

**前端使用场景：** 用户选择文件后，上传前先调用此接口验证

---

#### 1.2 分片上传
```
POST /api/upload/chunk
Content-Type: multipart/form-data
```

**请求参数（FormData）：**
```typescript
{
  resourceId: string;    // 资源唯一标识（前端生成UUID）
  chunkIndex: number;    // 分片索引（从0开始）
  totalChunks: number;   // 总分片数
  chunkSize: number;     // 分片大小（字节）
  file: Blob;            // 分片文件
  fileName: string;      // 原文件名
  fileSize: number;      // 原文件大小（字节）
  fileFormat: string;    // 文件格式（如"PSD"）
}
```

**响应数据：**
```typescript
{
  // 成功返回空对象即可
}
```

**前端使用场景：** 文件>100MB时，前端分片上传

---

#### 1.3 上传完成（合并分片）
```
POST /api/upload/complete
```

**请求参数：**
```typescript
{
  resourceId: string;    // 资源唯一标识
  fileName: string;      // 原文件名
  fileSize: number;      // 文件大小（字节）
  fileFormat: string;    // 文件格式
  title: string;         // 资源标题
  categoryId: string;    // 分类ID
  tags: string[];        // 标签列表
  description: string;   // 资源描述
}
```

**响应数据：**
```typescript
{
  resourceId: string;    // 资源ID
}
```

**后端处理流程（前端无需关心）：**
1. 合并分片文件
2. 生成预览图（PSD/AI/CDR → PNG/JPG）
3. 提交AI内容审核
4. 返回资源ID

**前端使用场景：** 所有分片上传完成后，提交元信息并触发后端处理

---

### 2. 资源查询接口

#### 2.1 获取用户上传资源列表
```
GET /api/upload/list
```

**请求参数：**
```typescript
{
  pageNum: number;       // 页码
  pageSize: number;      // 每页条数
  auditStatus?: 0|1|2;   // 可选：筛选审核状态
}
```

**响应数据：**
```typescript
{
  list: ResourceInfo[];  // 资源列表
  total: number;         // 总条数
  pageNum: number;       // 当前页码
  pageSize: number;      // 每页条数
  totalPages: number;    // 总页数
}

// ResourceInfo 结构
{
  resourceId: string;
  title: string;
  cover: string;         // 封面图URL（后端已处理好的CDN链接）
  format: string;
  size: number;
  sizeText: string;
  downloadCount: number;
  vipLevel: 0|1|2|3;
  categoryId: string;
  categoryName: string;
  tags: string[];
  createTime: string;
  isAudit: 0|1|2;        // 0-待审核、1-已通过、2-已驳回
  auditMsg?: string;     // 驳回原因（如"检测到违规内容：色情"）
}
```

**前端使用场景：** "我的上传"页面展示用户上传的资源及审核状态

---

#### 2.2 获取资源详情
```
GET /api/resource/detail/:resourceId
```

**响应数据：**
```typescript
{
  resourceId: string;
  title: string;
  cover: string;
  format: string;
  size: number;
  sizeText: string;
  downloadCount: number;
  uploaderId: string;
  uploaderName: string;
  vipLevel: 0|1|2|3;
  categoryId: string;
  categoryName: string;
  tags: string[];
  createTime: string;
  description: string;           // 资源详情描述
  previewImages: string[];       // 预览图URL数组（后端已生成好的CDN链接）
  downloadUrl: string;           // 下载地址（带时效签名）
}
```

**前端使用场景：** 资源详情页展示，直接使用 `previewImages` 字段展示预览图

---

#### 2.3 获取资源列表（带筛选）
```
GET /api/resource/list
```

**请求参数：**
```typescript
{
  pageNum: number;
  pageSize: number;
  keyword?: string;      // 搜索关键词
  categoryId?: string;   // 分类ID
  format?: string;       // 文件格式
  sizeType?: string;     // 尺寸类型
  sortType: 'download'|'time';  // 排序方式
}
```

**响应数据：** 同 2.1

**前端使用场景：** 首页、资源列表页展示

---

### 3. 下载接口

#### 3.1 资源下载
```
POST /api/resource/download
```

**请求参数：**
```typescript
{
  resourceId: string;
}
```

**响应数据：**
```typescript
{
  downloadUrl: string;   // 带时效签名的下载链接
  expireTime: string;    // 链接过期时间
}
```

**前端使用场景：** 
1. 用户点击下载按钮
2. 前端调用此接口获取下载链接
3. 前端使用 `window.open(downloadUrl)` 或 `<a>` 标签触发下载

---

## 前端职责清单

✅ **前端负责：**
- 界面展示和用户交互
- 表单验证（文件格式、大小等前置校验）
- 文件分片逻辑（>100MB自动分片）
- 调用后端API接口
- 展示后端返回的预览图（使用 `previewImages` 字段）
- 展示审核状态和结果（使用 `isAudit` 和 `auditMsg` 字段）
- 图片懒加载、渐进式加载
- 下载进度展示

❌ **前端不负责：**
- 文件格式转换（PSD → PNG）
- 预览图生成
- AI内容审核
- 水印添加
- 文件存储和CDN上传

---

## 接口调用示例

### 示例1：上传文件流程

```typescript
// 1. 用户选择文件
const file = event.target.files[0];

// 2. 前端校验格式和大小
const validateRes = await validateFileFormat({
  fileName: file.name,
  fileSize: file.size
});

if (!validateRes.data.isValid) {
  ElMessage.error(validateRes.data.msg);
  return;
}

// 3. 分片上传（如果文件>100MB）
const resourceId = generateUUID();
const chunkSize = 5 * 1024 * 1024; // 5MB
const totalChunks = Math.ceil(file.size / chunkSize);

for (let i = 0; i < totalChunks; i++) {
  const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
  await uploadFileChunk({
    resourceId,
    chunkIndex: i,
    totalChunks,
    chunkSize,
    file: chunk,
    fileName: file.name,
    fileSize: file.size,
    fileFormat: getFileExtension(file.name)
  });
}

// 4. 上传完成，提交元信息
await completeFileUpload({
  resourceId,
  fileName: file.name,
  fileSize: file.size,
  fileFormat: getFileExtension(file.name),
  title: formData.title,
  categoryId: formData.categoryId,
  tags: formData.tags,
  description: formData.description
});

// 5. 显示"正在审核中"提示
ElMessage.success('上传成功，正在审核中...');

// 6. 轮询审核状态（每5秒查询一次）
const timer = setInterval(async () => {
  const res = await getUserUploadResources({ pageNum: 1, pageSize: 10 });
  const resource = res.data.list.find(r => r.resourceId === resourceId);
  
  if (resource.isAudit === 1) {
    clearInterval(timer);
    ElMessage.success('审核通过，资源已上架！');
  } else if (resource.isAudit === 2) {
    clearInterval(timer);
    ElMessage.error(`审核未通过：${resource.auditMsg}`);
  }
}, 5000);
```

### 示例2：展示资源详情

```vue
<template>
  <div class="resource-detail">
    <!-- 预览图轮播 -->
    <el-carousel v-if="detail.previewImages.length > 0">
      <el-carousel-item v-for="(img, index) in detail.previewImages" :key="index">
        <img :src="img" @click="handleImageClick(img)" />
      </el-carousel-item>
    </el-carousel>
    
    <!-- 资源信息 -->
    <div class="info">
      <h1>{{ detail.title }}</h1>
      <p>{{ detail.description }}</p>
      <p>格式：{{ detail.format }}</p>
      <p>大小：{{ detail.sizeText }}</p>
    </div>
    
    <!-- 下载按钮 -->
    <el-button @click="handleDownload">立即下载</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getResourceDetail, downloadResource } from '@/api';

const detail = ref<ResourceDetail>();

onMounted(async () => {
  // 调用接口获取详情（后端已经生成好预览图）
  const res = await getResourceDetail(route.params.id);
  detail.value = res.data;
});

const handleDownload = async () => {
  // 调用下载接口获取下载链接
  const res = await downloadResource({ resourceId: detail.value.resourceId });
  // 触发下载
  window.open(res.data.downloadUrl);
};
</script>
```

---

---

## 4. 内容管理接口（运营配置）

### 4.1 获取首页轮播图列表
```
GET /api/content/banners
```

**请求参数：**
```typescript
{
  position?: string;  // 可选：轮播位置（home-top/home-middle等）
  status?: 0|1;       // 可选：状态（0-禁用，1-启用）
}
```

**响应数据：**
```typescript
{
  list: Banner[];
}

// Banner 结构
{
  bannerId: string;
  title: string;           // 轮播图标题
  imageUrl: string;        // 图片URL（后端已处理好的CDN链接）
  linkUrl: string;         // 点击跳转链接
  linkType: 'internal'|'external'|'category'|'resource';  // 链接类型
  position: string;        // 展示位置（home-top/home-middle等）
  sort: number;            // 排序序号（数字越小越靠前）
  status: 0|1;             // 状态（0-禁用，1-启用）
  startTime: string;       // 开始展示时间
  endTime: string;         // 结束展示时间
  createTime: string;      // 创建时间
}
```

**前端使用场景：** 首页加载时获取轮播图列表并展示

---

### 4.2 获取首页推荐位配置
```
GET /api/content/recommendations
```

**请求参数：**
```typescript
{
  section: string;  // 版块标识（hot-resources/new-resources/vip-resources等）
}
```

**响应数据：**
```typescript
{
  sectionId: string;
  sectionName: string;      // 版块名称（如"热门资源"）
  sectionType: string;      // 版块类型（hot/new/vip/custom）
  displayMode: 'auto'|'manual';  // 展示模式（auto-自动获取，manual-手动配置）
  resourceIds: string[];    // 手动配置的资源ID列表（displayMode为manual时使用）
  limit: number;            // 展示数量限制
  sort: number;             // 版块排序
  status: 0|1;              // 状态（0-禁用，1-启用）
}
```

**前端使用场景：** 
- 如果 `displayMode` 为 `auto`，前端调用对应的资源列表接口（如热门资源接口）
- 如果 `displayMode` 为 `manual`，前端使用 `resourceIds` 批量获取指定资源

---

### 4.3 批量获取指定资源
```
POST /api/resource/batch
```

**请求参数：**
```typescript
{
  resourceIds: string[];  // 资源ID数组
}
```

**响应数据：**
```typescript
{
  list: ResourceInfo[];  // 资源列表（按resourceIds顺序返回）
}
```

**前端使用场景：** 获取运营手动配置的推荐资源

---

### 4.4 获取公告通知列表
```
GET /api/content/notices
```

**请求参数：**
```typescript
{
  type?: 'system'|'activity'|'update';  // 可选：公告类型
  status?: 0|1;                         // 可选：状态
}
```

**响应数据：**
```typescript
{
  list: Notice[];
}

// Notice 结构
{
  noticeId: string;
  title: string;           // 公告标题
  content: string;         // 公告内容（支持HTML）
  type: 'system'|'activity'|'update';  // 公告类型
  level: 'info'|'warning'|'important'; // 重要级别
  imageUrl?: string;       // 可选：配图
  linkUrl?: string;        // 可选：跳转链接
  isTop: boolean;          // 是否置顶
  sort: number;            // 排序序号
  status: 0|1;             // 状态
  startTime: string;       // 开始展示时间
  endTime: string;         // 结束展示时间
  createTime: string;      // 创建时间
}
```

**前端使用场景：** 
- 首页顶部展示重要公告（level为important的）
- 公告列表页展示所有公告

---

### 4.5 获取分类配置
```
GET /api/content/categories
```

**请求参数：**
```typescript
{
  parentId?: string;  // 可选：父分类ID（获取子分类时传入）
  level?: 1|2;        // 可选：分类层级（1-一级分类，2-二级分类）
}
```

**响应数据：**
```typescript
{
  list: CategoryConfig[];
}

// CategoryConfig 结构
{
  categoryId: string;
  categoryName: string;    // 分类名称
  categoryCode: string;    // 分类代码（如：party-building、festival-poster）
  icon: string;            // 分类图标URL
  coverImage: string;      // 分类封面图URL
  description: string;     // 分类描述
  parentId?: string;       // 父分类ID（一级分类为null）
  level: 1|2;              // 分类层级（1-一级，2-二级）
  sort: number;            // 排序序号
  isHot: boolean;          // 是否热门分类
  isRecommend: boolean;    // 是否推荐分类
  status: 0|1;             // 状态
  resourceCount: number;   // 该分类下的资源数量
  children?: CategoryConfig[];  // 子分类列表（仅一级分类有）
}
```

**预设分类列表：**

**一级分类：**
1. **党建类** (party-building)
   - 党建海报、党建展板、党建PPT、党建文化墙

2. **节日海报类** (festival-poster)
   - 春节、元宵节、清明节、劳动节、端午节、中秋节、国庆节、元旦、圣诞节、情人节、母亲节、父亲节

3. **电商类** (e-commerce)
   - 主图、详情页、店铺首页、促销海报、直通车、钻展

4. **UI设计类** (ui-design)
   - 网页设计、APP界面、小程序界面、图标设计、后台管理

5. **插画类** (illustration)
   - 扁平插画、手绘插画、2.5D插画、国潮插画、商业插画

6. **摄影图类** (photography)
   - 人物摄影、风景摄影、美食摄影、产品摄影、建筑摄影

7. **背景素材类** (background)
   - 纯色背景、渐变背景、纹理背景、节日背景、科技背景

8. **字体类** (font)
   - 中文字体、英文字体、书法字体、艺术字体、商用字体

9. **图标类** (icon)
   - 线性图标、面性图标、扁平图标、3D图标、动态图标

10. **模板类** (template)
    - PPT模板、简历模板、名片模板、海报模板、证书模板

**前端使用场景：** 
- 首页分类快捷入口展示（展示一级分类）
- 分类筛选下拉菜单（支持二级分类展开）
- 上传资源时选择分类（支持二级分类选择）
- 资源列表页分类筛选

**接口调用示例：**
```typescript
// 获取所有一级分类
const res1 = await getCategories({ level: 1 });

// 获取指定一级分类的子分类
const res2 = await getCategories({ parentId: 'festival-poster', level: 2 });

// 获取所有分类（包含子分类）
const res3 = await getCategories();
// 返回的数据中，一级分类的children字段包含子分类列表
```

---

### 4.6 获取网站配置信息
```
GET /api/content/site-config
```

**响应数据：**
```typescript
{
  siteName: string;              // 网站名称（星潮设计）
  siteSlogan: string;            // 网站标语
  logoUrl: string;               // Logo URL
  faviconUrl: string;            // Favicon URL
  contactEmail: string;          // 联系邮箱
  contactPhone: string;          // 联系电话
  icp: string;                   // ICP备案号
  copyright: string;             // 版权信息
  socialLinks: {                 // 社交媒体链接
    wechat?: string;
    weibo?: string;
    qq?: string;
  };
  seo: {                         // SEO配置
    title: string;
    keywords: string;
    description: string;
  };
  watermark: {                   // 水印配置
    text: string;                // 水印文字（星潮设计）
    opacity: number;             // 透明度（0-1）
    fontSize: number;            // 字体大小
    color: string;               // 颜色
  };
}
```

**前端使用场景：** 
- 应用初始化时获取网站配置
- 动态设置页面标题、Logo、版权信息等

---

### 4.7 获取活动配置
```
GET /api/content/activities
```

**请求参数：**
```typescript
{
  status?: 'upcoming'|'ongoing'|'ended';  // 可选：活动状态
}
```

**响应数据：**
```typescript
{
  list: Activity[];
}

// Activity 结构
{
  activityId: string;
  title: string;           // 活动标题
  description: string;     // 活动描述
  bannerUrl: string;       // 活动横幅图
  linkUrl: string;         // 活动详情链接
  type: 'discount'|'free'|'vip'|'custom';  // 活动类型
  startTime: string;       // 活动开始时间
  endTime: string;         // 活动结束时间
  status: 'upcoming'|'ongoing'|'ended';    // 活动状态
  isPopup: boolean;        // 是否弹窗展示
  sort: number;            // 排序序号
}
```

**前端使用场景：** 
- 首页展示进行中的活动
- 用户首次访问时弹窗展示重要活动

---

### 4.8 获取友情链接
```
GET /api/content/links
```

**响应数据：**
```typescript
{
  list: FriendLink[];
}

// FriendLink 结构
{
  linkId: string;
  name: string;            // 链接名称
  url: string;             // 链接地址
  logo?: string;           // 可选：Logo URL
  description?: string;    // 可选：描述
  sort: number;            // 排序序号
  status: 0|1;             // 状态
}
```

**前端使用场景：** 底部友情链接展示

---

## 5. 统计分析接口

### 5.1 记录页面访问
```
POST /api/analytics/page-view
```

**请求参数：**
```typescript
{
  page: string;            // 页面路径
  referrer?: string;       // 来源页面
  userAgent: string;       // 用户代理
}
```

**响应数据：**
```typescript
{
  // 成功返回空对象即可
}
```

**前端使用场景：** 路由切换时记录页面访问（用于统计分析）

---

### 5.2 记录资源点击
```
POST /api/analytics/resource-click
```

**请求参数：**
```typescript
{
  resourceId: string;      // 资源ID
  source: string;          // 来源（home/search/category等）
}
```

**响应数据：**
```typescript
{
  // 成功返回空对象即可
}
```

**前端使用场景：** 用户点击资源卡片时记录（用于热门资源排序）

---

## 接口调用示例

### 示例3：首页内容加载

```typescript
// 首页组件
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  getBanners, 
  getRecommendations, 
  getResourceList,
  batchGetResources,
  getNotices,
  getSiteConfig
} from '@/api';

const banners = ref<Banner[]>([]);
const hotResources = ref<ResourceInfo[]>([]);
const newResources = ref<ResourceInfo[]>([]);
const notices = ref<Notice[]>([]);
const siteConfig = ref<SiteConfig>();

onMounted(async () => {
  // 1. 获取网站配置（Logo、水印等）
  const configRes = await getSiteConfig();
  siteConfig.value = configRes.data;
  
  // 2. 获取轮播图
  const bannerRes = await getBanners({ position: 'home-top', status: 1 });
  banners.value = bannerRes.data.list;
  
  // 3. 获取热门资源推荐配置
  const hotConfig = await getRecommendations({ section: 'hot-resources' });
  
  if (hotConfig.data.displayMode === 'auto') {
    // 自动模式：调用热门资源接口
    const hotRes = await getResourceList({
      pageNum: 1,
      pageSize: hotConfig.data.limit,
      sortType: 'download'
    });
    hotResources.value = hotRes.data.list;
  } else {
    // 手动模式：批量获取指定资源
    const hotRes = await batchGetResources({
      resourceIds: hotConfig.data.resourceIds
    });
    hotResources.value = hotRes.data.list;
  }
  
  // 4. 获取最新资源
  const newRes = await getResourceList({
    pageNum: 1,
    pageSize: 10,
    sortType: 'time'
  });
  newResources.value = newRes.data.list;
  
  // 5. 获取重要公告
  const noticeRes = await getNotices({ level: 'important', status: 1 });
  notices.value = noticeRes.data.list;
});
</script>
```

---

## 总结

**新增内容管理接口：**
1. **轮播图管理**：支持多位置、定时展示、启用/禁用
2. **推荐位配置**：支持自动/手动两种模式
3. **公告通知**：支持多类型、多级别、定时展示
4. **分类配置**：支持图标、封面、排序、热门标记
5. **网站配置**：Logo、水印、SEO、联系方式等
6. **活动配置**：支持活动横幅、弹窗、定时展示
7. **友情链接**：底部链接管理
8. **统计分析**：页面访问、资源点击记录

**前端工作重点：**
1. 实现美观的界面和流畅的交互
2. 调用后端API接口
3. 展示后端返回的数据（预览图、审核状态等）
4. 处理用户操作（上传、下载、搜索等）
5. **根据运营配置动态展示内容**（轮播图、推荐位、公告等）

**后端工作重点：**
1. 接收和存储文件
2. 生成预览图（文件格式转换）
3. AI内容审核
4. 返回处理好的数据给前端
5. **提供内容管理后台**（运营人员可配置轮播图、推荐位等）

**接口设计原则：**
- 简洁明了：前端只需要知道调用哪个接口、传什么参数、返回什么数据
- 职责清晰：前端负责展示，后端负责处理和配置管理
- 易于理解：接口命名和参数命名通俗易懂
- 灵活配置：运营人员可通过后台灵活调整首页内容，无需修改代码
