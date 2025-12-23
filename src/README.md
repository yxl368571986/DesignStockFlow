# 源代码目录说明

## 目录结构

### 📁 api/
API接口定义，负责与后端通信。

**文件：**
- `auth.ts` - 认证相关接口（登录、注册、验证码）
- `resource.ts` - 资源相关接口（列表、详情、下载、搜索）
- `upload.ts` - 上传相关接口（验证、分片、完成）
- `content.ts` - 内容管理接口（配置、轮播图、分类）
- `personal.ts` - 个人中心接口（下载记录、VIP信息）
- `index.ts` - 统一导出

### 📁 assets/
静态资源文件。

**子目录：**
- `images/` - 图片资源
- `icons/` - 图标资源
- `styles/` - 全局样式（Tailwind CSS + 自定义样式）

### 📁 components/
可复用的UI组件。

**子目录：**
- `common/` - 通用组件（Loading、Empty、NetworkStatus等）
- `layout/` - 布局组件（Header、Footer、Sidebar等）
- `business/` - 业务组件（ResourceCard、SearchBar、UploadArea等）

### 📁 composables/
组合式函数，封装可复用的业务逻辑。

**文件：**
- `useAuth.ts` - 认证逻辑（登录、注册、退出）
- `useUpload.ts` - 上传逻辑（文件验证、分片上传）
- `useDownload.ts` - 下载逻辑（权限检查、下载触发）
- `useSearch.ts` - 搜索逻辑（关键词搜索、搜索联想）
- `useNetworkStatus.ts` - 网络状态监控
- `useCache.ts` - 缓存管理
- `index.ts` - 统一导出

### 📁 pinia/
Pinia状态管理，管理全局共享状态。

**文件：**
- `userStore.ts` - 用户状态（用户信息、Token、登录状态）
- `resourceStore.ts` - 资源状态（资源列表、搜索参数）
- `configStore.ts` - 配置状态（网站配置、轮播图、分类）
- `index.ts` - 统一导出

### 📁 router/
Vue Router路由配置。

**文件：**
- `index.ts` - 路由定义
- `guards.ts` - 路由守卫（认证、权限检查）

### 📁 types/
TypeScript类型定义。

**文件：**
- `api.ts` - API相关类型（请求、响应、分页）
- `models.ts` - 数据模型类型（用户、资源、配置等）
- `index.ts` - 统一导出

### 📁 utils/
工具函数库。

**文件：**
- `request.ts` - Axios封装（请求/响应拦截、错误处理）
- `security.ts` - 安全工具（XSS过滤、加密、Token管理）
- `validate.ts` - 验证工具（手机号、邮箱、文件验证）
- `format.ts` - 格式化工具（文件大小、时间、数字）
- `constants.ts` - 全局常量定义
- `indexedDB.ts` - IndexedDB封装（离线存储）
- `index.ts` - 统一导出

### 📁 views/
页面级组件，对应路由。

**子目录：**
- `Home/` - 首页
- `Resource/` - 资源页面（列表、详情）
- `Upload/` - 上传页面
- `Personal/` - 个人中心
- `Auth/` - 认证页面（登录、注册）

### 📄 App.vue
根组件，应用入口。

### 📄 main.ts
应用主入口文件，初始化Vue应用、Pinia、Router、Element Plus等。

### 📄 vite-env.d.ts
Vite环境变量和Vue模块的TypeScript类型定义。

## 开发指南

### 导入路径
使用 `@` 别名代替相对路径：

```typescript
// ❌ 不推荐
import { getUserInfo } from '../../../api/auth';

// ✅ 推荐
import { getUserInfo } from '@/api/auth';
```

### 组件导入
```typescript
// 导入组件
import ResourceCard from '@/components/business/ResourceCard.vue';

// 导入Composable
import { useAuth } from '@/composables/useAuth';

// 导入Store
import { useUserStore } from '@/pinia/userStore';

// 导入工具函数
import { formatFileSize } from '@/utils/format';

// 导入类型
import type { UserInfo } from '@/types/models';
```

### 类型定义
所有数据结构都应该有TypeScript类型定义：

```typescript
// 定义接口
interface UserInfo {
  userId: string;
  nickname: string;
  avatar: string;
}

// 使用类型
const user: UserInfo = {
  userId: '123',
  nickname: '用户名',
  avatar: 'https://...'
};
```

### 命名规范
- **组件名**: PascalCase（`ResourceCard.vue`）
- **文件名**: camelCase（`useAuth.ts`）
- **变量/函数**: camelCase（`getUserInfo`）
- **常量**: UPPER_SNAKE_CASE（`MAX_FILE_SIZE`）
- **类型/接口**: PascalCase（`UserInfo`）

## 注意事项

1. **不要直接修改Store状态**，使用Actions
2. **不要在组件中直接调用API**，使用Composables
3. **所有用户输入必须经过XSS过滤**
4. **文件上传必须进行格式和大小验证**
5. **敏感信息（Token）存储在HttpOnly Cookie中**
6. **使用TypeScript严格模式，避免any类型**
