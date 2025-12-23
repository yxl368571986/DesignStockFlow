# 设计文档 - 前端修复与后台管理系统

## 1. 概述

本文档基于需求文档,详细说明系统架构设计、数据库设计、API接口设计、前端组件设计、后台管理界面设计和安全方案设计。

### 1.1 技术栈

**前端技术栈:**
- **核心框架**: Vue 3.4+ (Composition API) + Vite 5.0+ + TypeScript 5.3+
- **UI组件库**: Element Plus 2.5+ + Tailwind CSS 3.4+
- **状态管理**: Pinia 2.1+
- **路由管理**: Vue Router 4.2+
- **图表库**: ECharts 5.4+
- **动画库**: GSAP 3.12+ / Animate.css

**后端技术栈:**
- **运行环境**: Node.js 18+ LTS
- **Web框架**: Express.js 4.18+ / Fastify 4.x
- **数据库**: PostgreSQL 14+
- **ORM**: Prisma 5.x / TypeORM 0.3+
- **认证**: JWT (jsonwebtoken) + bcrypt
- **文件存储**: Multer + 本地存储/阿里云OSS
- **支付**: 微信支付SDK + 支付宝SDK
- **任务队列**: Bull 4.x (Redis)
- **缓存**: Redis 7.x

**开发工具:**
- **API文档**: Swagger / Apifox
- **数据库工具**: DBeaver / pgAdmin
- **MCP工具**: 使用已配置的MCP进行数据库操作
- **版本控制**: Git + GitHub
- **CI/CD**: GitHub Actions

### 1.2 项目结构

```
project-root/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── api/             # API接口
│   │   ├── assets/          # 静态资源
│   │   ├── components/      # 组件
│   │   ├── composables/     # 组合式函数
│   │   ├── pinia/           # 状态管理
│   │   ├── router/          # 路由
│   │   ├── types/           # 类型定义
│   │   ├── utils/           # 工具函数
│   │   ├── views/           # 页面
│   │   │   ├── frontend/    # 前台页面
│   │   │   └── admin/       # 后台页面
│   │   ├── App.vue
│   │   └── main.ts
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑
│   │   ├── models/          # 数据模型
│   │   ├── middlewares/     # 中间件
│   │   ├── routes/          # 路由
│   │   ├── utils/           # 工具函数
│   │   ├── config/          # 配置
│   │   └── app.ts           # 入口文件
│   ├── prisma/              # Prisma配置
│   │   └── schema.prisma    # 数据库模型
│   ├── package.json
│   └── tsconfig.json
│
├── scripts/                  # 部署脚本
│   ├── install.sh           # 环境安装脚本
│   ├── deploy.sh            # 部署脚本
│   ├── backup.sh            # 备份脚本
│   └── restore.sh           # 恢复脚本
│
├── docs/                     # 文档
│   ├── API.md               # API文档
│   ├── DEPLOY.md            # 部署文档
│   └── DATABASE.md          # 数据库文档
│
└── README.md
```


## 2. 系统架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  普通用户     │  │  管理员       │  │  审核员       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      前端应用层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  前台页面     │  │  个人后台     │  │  管理后台     │      │
│  │  (Vue 3)     │  │  (Vue 3)     │  │  (Vue 3)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Nginx反向代理                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  静态资源 → CDN    API请求 → 后端服务                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      后端服务层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  认证服务     │  │  资源服务     │  │  支付服务     │      │
│  │  (JWT)       │  │  (CRUD)      │  │  (微信/支付宝) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  审核服务     │  │  文件服务     │  │  通知服务     │      │
│  │  (AI审核)    │  │  (上传/下载)  │  │  (邮件/站内)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │  Redis       │  │  文件存储     │      │
│  │  (主数据库)   │  │  (缓存/队列)  │  │  (OSS/本地)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 前端架构

#### 2.2.1 前台页面架构

```
前台页面 (Public Pages)
├── 首页 (Home)
│   ├── 轮播图组件
│   ├── 分类导航组件
│   ├── 热门资源组件
│   └── 推荐资源组件
├── 资源列表 (ResourceList)
│   ├── 筛选栏组件
│   ├── 资源卡片网格
│   └── 分页组件
├── 资源详情 (ResourceDetail)
│   ├── 预览图组件
│   ├── 资源信息组件
│   ├── 下载按钮组件
│   └── 相关推荐组件
├── 搜索结果 (SearchResult)
│   ├── 搜索框组件
│   ├── 筛选栏组件
│   └── 资源卡片网格
├── 登录注册 (Auth)
│   ├── 登录表单
│   ├── 注册表单
│   └── 第三方登录
└── VIP中心 (VIP)
    ├── VIP说明
    ├── 套餐选择
    └── 支付组件
```

#### 2.2.2 个人后台架构

```
个人后台 (User Dashboard)
├── 我的作品 (MyWorks)
│   ├── 作品列表
│   ├── 作品编辑
│   └── 数据统计
├── 我的下载 (MyDownloads)
│   └── 下载记录列表
├── 个人信息 (Profile)
│   ├── 基本信息编辑
│   ├── 头像上传
│   └── VIP信息
├── 账号安全 (Security)
│   ├── 修改密码
│   ├── 绑定邮箱
│   └── 绑定微信
├── 个人设置 (Settings)
│   ├── 主题设置
│   ├── 语言设置
│   ├── 通知设置
│   └── 隐私设置
└── 内容运营 (Promotion)
    ├── 作品推广
    ├── 推广效果
    └── 标签管理
```

#### 2.2.3 管理后台架构

```
管理后台 (Admin Dashboard)
├── 数据概览 (Overview)
│   ├── 核心数据卡片
│   ├── 趋势图表
│   └── 快捷操作
├── 用户管理 (UserManagement)
│   ├── 用户列表
│   ├── 用户详情
│   ├── 用户操作(禁用/启用/重置密码)
│   └── VIP管理
├── 资源管理 (ResourceManagement)
│   ├── 资源列表
│   ├── 资源编辑
│   ├── 资源操作(下架/删除/置顶/推荐)
│   └── 批量操作
├── 内容审核 (ContentAudit)
│   ├── 待审核列表
│   ├── 资源详情预览
│   ├── 审核操作(通过/驳回)
│   └── 审核记录
├── 分类管理 (CategoryManagement)
│   ├── 分类树形列表
│   ├── 添加/编辑分类
│   ├── 删除分类
│   └── 排序调整
├── 数据统计 (Statistics)
│   ├── 用户增长趋势
│   ├── 资源增长趋势
│   ├── 下载统计
│   ├── 热门资源TOP10
│   └── 热门分类TOP10
├── 内容运营 (ContentOperation)
│   ├── 轮播图管理
│   ├── 公告管理
│   ├── 推荐位管理
│   └── 友情链接管理
├── 系统设置 (SystemSettings)
│   ├── 网站信息
│   ├── 上传限制
│   ├── 下载限制
│   ├── VIP配置
│   ├── 支付配置
│   └── 水印配置
└── 权限管理 (PermissionManagement)
    ├── 角色列表
    ├── 权限列表
    ├── 角色权限分配
    └── 用户角色分配
```

### 2.3 后端架构

#### 2.3.1 服务层架构

```
后端服务 (Backend Services)
├── 认证服务 (AuthService)
│   ├── 用户注册
│   ├── 用户登录(密码/验证码/微信)
│   ├── Token生成和验证
│   ├── 密码加密
│   └── 第三方登录对接
├── 用户服务 (UserService)
│   ├── 用户信息管理
│   ├── VIP管理
│   ├── 用户权限管理
│   └── 用户操作日志
├── 资源服务 (ResourceService)
│   ├── 资源CRUD
│   ├── 资源搜索
│   ├── 资源筛选
│   ├── 资源统计
│   ├── 资源推荐
│   └── 积分消耗计算(根据资源类型和用户VIP状态)
├── 文件服务 (FileService)
│   ├── 文件上传(分片/直传)
│   ├── 文件下载
│   ├── 文件验证
│   ├── 预览图生成
│   └── 水印添加
├── 审核服务 (AuditService)
│   ├── AI内容审核
│   ├── 人工审核
│   ├── 审核记录
│   └── 审核通知
├── 支付服务 (PaymentService)
│   ├── 订单创建
│   ├── 微信支付
│   ├── 支付宝支付
│   ├── 支付回调
│   └── 订单查询
├── 积分服务 (PointsService)
│   ├── 积分获取(上传作品、签到、邀请等)
│   ├── 积分消耗(下载资源)
│   ├── 积分兑换(VIP、下载次数包、实物商品)
│   ├── 积分充值
│   ├── 积分明细查询
│   ├── 每日任务管理
│   ├── 用户等级计算
│   └── 积分规则配置
├── VIP服务 (VIPService)
│   ├── VIP套餐管理
│   ├── VIP特权配置
│   ├── VIP订单管理
│   ├── VIP到期提醒
│   ├── VIP权限验证
│   └── VIP统计分析
├── 通知服务 (NotificationService)
│   ├── 邮件通知
│   ├── 站内通知
│   ├── 短信通知
│   └── 通知模板
└── 统计服务 (StatisticsService)
    ├── 用户统计
    ├── 资源统计
    ├── 下载统计
    └── 数据报表
```


## 3. 数据库设计

### 3.1 数据库表结构

#### 3.1.1 用户表 (users)

```sql
CREATE TABLE users (
  user_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  avatar VARCHAR(500),
  email VARCHAR(100),
  bio TEXT,
  vip_level INTEGER DEFAULT 0,
  vip_expire_at TIMESTAMP,
  points_balance INTEGER DEFAULT 0, -- 积分余额
  points_total INTEGER DEFAULT 0, -- 累计获得积分
  user_level INTEGER DEFAULT 1, -- 用户等级(1-6)
  role_id VARCHAR(36) REFERENCES roles(role_id),
  status INTEGER DEFAULT 1, -- 1:正常 0:禁用
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_vip_level ON users(vip_level);
CREATE INDEX idx_users_user_level ON users(user_level);
```

#### 3.1.2 角色表 (roles)

```sql
CREATE TABLE roles (
  role_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) UNIQUE NOT NULL,
  role_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化角色数据
INSERT INTO roles (role_name, role_code, description) VALUES
('超级管理员', 'super_admin', '拥有所有权限'),
('内容审核员', 'moderator', '负责内容审核'),
('运营人员', 'operator', '负责内容运营'),
('普通用户', 'user', '普通用户权限');
```

#### 3.1.3 权限表 (permissions)

```sql
CREATE TABLE permissions (
  permission_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_name VARCHAR(50) NOT NULL,
  permission_code VARCHAR(50) UNIQUE NOT NULL,
  module VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化权限数据
INSERT INTO permissions (permission_name, permission_code, module, description) VALUES
-- 用户管理
('查看用户', 'user:view', 'user_manage', '查看用户列表和详情'),
('编辑用户', 'user:edit', 'user_manage', '编辑用户信息'),
('禁用用户', 'user:disable', 'user_manage', '禁用/启用用户'),
('删除用户', 'user:delete', 'user_manage', '删除用户'),
-- 资源管理
('查看资源', 'resource:view', 'resource_manage', '查看资源列表和详情'),
('编辑资源', 'resource:edit', 'resource_manage', '编辑资源信息'),
('删除资源', 'resource:delete', 'resource_manage', '删除资源'),
('置顶资源', 'resource:top', 'resource_manage', '置顶资源'),
-- 内容审核
('查看待审核', 'audit:view', 'content_audit', '查看待审核内容'),
('审核通过', 'audit:approve', 'content_audit', '审核通过'),
('审核驳回', 'audit:reject', 'content_audit', '审核驳回'),
-- 分类管理
('查看分类', 'category:view', 'category_manage', '查看分类列表'),
('添加分类', 'category:add', 'category_manage', '添加分类'),
('编辑分类', 'category:edit', 'category_manage', '编辑分类'),
('删除分类', 'category:delete', 'category_manage', '删除分类'),
-- 数据统计
('查看统计', 'statistics:view', 'data_statistics', '查看统计数据'),
('导出报表', 'statistics:export', 'data_statistics', '导出数据报表'),
-- 内容运营
('管理轮播图', 'banner:manage', 'content_operation', '管理轮播图'),
('管理公告', 'announcement:manage', 'content_operation', '管理公告'),
('管理推荐位', 'recommend:manage', 'content_operation', '管理推荐位'),
-- 系统设置
('查看设置', 'settings:view', 'system_settings', '查看系统设置'),
('修改设置', 'settings:edit', 'system_settings', '修改系统设置'),
-- 权限管理
('分配角色', 'permission:assign', 'permission_manage', '为用户分配角色'),
('管理权限', 'permission:manage', 'permission_manage', '管理角色和权限');
```

#### 3.1.4 角色权限关联表 (role_permissions)

```sql
CREATE TABLE role_permissions (
  role_id VARCHAR(36) REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id VARCHAR(36) REFERENCES permissions(permission_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
```

#### 3.1.5 资源表 (resources)

```sql
CREATE TABLE resources (
  resource_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  cover VARCHAR(500),
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_format VARCHAR(20) NOT NULL,
  preview_images TEXT[], -- 预览图数组
  category_id VARCHAR(36) REFERENCES categories(category_id),
  tags TEXT[],
  vip_level INTEGER DEFAULT 0,
  user_id VARCHAR(36) REFERENCES users(user_id),
  audit_status INTEGER DEFAULT 0, -- 0:待审核 1:已通过 2:已驳回
  audit_msg TEXT,
  auditor_id VARCHAR(36) REFERENCES users(user_id),
  audited_at TIMESTAMP,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0, -- 点赞数
  collect_count INTEGER DEFAULT 0,
  is_top BOOLEAN DEFAULT FALSE,
  is_recommend BOOLEAN DEFAULT FALSE,
  status INTEGER DEFAULT 1, -- 1:正常 0:下架
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_category_id ON resources(category_id);
CREATE INDEX idx_resources_user_id ON resources(user_id);
CREATE INDEX idx_resources_audit_status ON resources(audit_status);
CREATE INDEX idx_resources_vip_level ON resources(vip_level);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX idx_resources_download_count ON resources(download_count DESC);
CREATE INDEX idx_resources_like_count ON resources(like_count DESC);
CREATE INDEX idx_resources_collect_count ON resources(collect_count DESC);
```

#### 3.1.6 分类表 (categories)

```sql
CREATE TABLE categories (
  category_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(50) NOT NULL,
  category_code VARCHAR(50) UNIQUE NOT NULL,
  parent_id VARCHAR(36) REFERENCES categories(category_id),
  icon VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_hot BOOLEAN DEFAULT FALSE,
  is_recommend BOOLEAN DEFAULT FALSE,
  resource_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- 初始化分类数据
INSERT INTO categories (category_name, category_code, icon, sort_order, is_hot) VALUES
('党建类', 'party-building', '/icons/party.svg', 1, TRUE),
('节日海报类', 'festival-poster', '/icons/festival.svg', 2, TRUE),
('电商类', 'ecommerce', '/icons/shop.svg', 3, TRUE),
('UI设计类', 'ui-design', '/icons/ui.svg', 4, TRUE),
('插画类', 'illustration', '/icons/art.svg', 5, FALSE),
('摄影图类', 'photography', '/icons/camera.svg', 6, FALSE),
('背景素材类', 'background', '/icons/bg.svg', 7, FALSE),
('字体类', 'font', '/icons/font.svg', 8, FALSE),
('图标类', 'icon', '/icons/icon.svg', 9, FALSE),
('模板类', 'template', '/icons/template.svg', 10, FALSE);
```

#### 3.1.7 订单表 (orders)

```sql
CREATE TABLE orders (
  order_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(36) REFERENCES users(user_id),
  order_type VARCHAR(20) NOT NULL, -- vip:VIP订单 points:积分充值订单
  product_type VARCHAR(20) NOT NULL, -- vip_month, vip_quarter, vip_year, points_100, points_500等
  product_name VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(20), -- wechat, alipay
  payment_status INTEGER DEFAULT 0, -- 0:待支付 1:已支付 2:已取消 3:已退款
  transaction_id VARCHAR(100),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_type ON orders(order_type);
```

#### 3.1.8 VIP套餐表 (vip_packages)

```sql
CREATE TABLE vip_packages (
  package_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name VARCHAR(50) NOT NULL,
  package_code VARCHAR(50) UNIQUE NOT NULL, -- vip_month, vip_quarter, vip_year
  duration_days INTEGER NOT NULL, -- 套餐时长(天)
  original_price DECIMAL(10, 2) NOT NULL, -- 原价
  current_price DECIMAL(10, 2) NOT NULL, -- 现价
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1, -- 1:启用 0:禁用
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vip_packages_status ON vip_packages(status);
CREATE INDEX idx_vip_packages_sort_order ON vip_packages(sort_order);

-- 初始化VIP套餐数据
INSERT INTO vip_packages (package_name, package_code, duration_days, original_price, current_price, description, sort_order) VALUES
('VIP月卡', 'vip_month', 30, 39.90, 29.90, '30天VIP会员,享受所有VIP特权', 1),
('VIP季卡', 'vip_quarter', 90, 119.70, 79.90, '90天VIP会员,享受所有VIP特权', 2),
('VIP年卡', 'vip_year', 365, 478.80, 299.00, '365天VIP会员,享受所有VIP特权', 3);
```

#### 3.1.9 VIP特权表 (vip_privileges)

```sql
CREATE TABLE vip_privileges (
  privilege_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  privilege_name VARCHAR(50) NOT NULL,
  privilege_code VARCHAR(50) UNIQUE NOT NULL,
  privilege_type VARCHAR(20) NOT NULL, -- boolean, number, string
  privilege_value TEXT NOT NULL, -- 特权值(JSON格式)
  description TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vip_privileges_is_enabled ON vip_privileges(is_enabled);

-- 初始化VIP特权数据
INSERT INTO vip_privileges (privilege_name, privilege_code, privilege_type, privilege_value, description, sort_order) VALUES
('免费下载所有资源', 'free_download_all', 'boolean', 'true', 'VIP用户可免费下载所有资源,无需消耗积分', 1),
('专属VIP资源', 'vip_exclusive_resources', 'boolean', 'true', 'VIP用户可访问专属VIP资源', 2),
('优先审核', 'priority_audit', 'boolean', 'true', '作品提交后优先审核', 3),
('去除下载限制', 'unlimited_download', 'boolean', 'true', '去除每日下载次数限制', 4),
('去除广告', 'no_ads', 'boolean', 'true', '去除所有广告', 5),
('专属客服', 'exclusive_support', 'boolean', 'true', '享受专属客服支持', 6),
('作品置顶推广', 'top_promotion', 'number', '5', '每月可置顶推广作品次数', 7),
('高速下载通道', 'high_speed_download', 'boolean', 'true', '享受高速下载通道', 8),
('批量下载', 'batch_download', 'boolean', 'true', '支持批量下载功能', 9),
('收藏夹扩展', 'collection_expansion', 'number', '1000', '收藏夹容量扩展至1000个', 10);
```

#### 3.1.10 积分记录表 (points_records)

```sql
CREATE TABLE points_records (
  record_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(36) REFERENCES users(user_id),
  points_change INTEGER NOT NULL, -- 积分变动(正数为增加,负数为减少)
  points_balance INTEGER NOT NULL, -- 变动后余额
  change_type VARCHAR(20) NOT NULL, -- earn:获得 consume:消耗 exchange:兑换 recharge:充值 adjust:调整
  source VARCHAR(50) NOT NULL, -- upload_approved, download, daily_signin, invite_user等
  source_id VARCHAR(36), -- 关联ID(如资源ID、订单ID等)
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_records_user_id ON points_records(user_id);
CREATE INDEX idx_points_records_change_type ON points_records(change_type);
CREATE INDEX idx_points_records_created_at ON points_records(created_at DESC);
```

#### 3.1.11 积分规则表 (points_rules)

```sql
CREATE TABLE points_rules (
  rule_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(50) NOT NULL,
  rule_code VARCHAR(50) UNIQUE NOT NULL,
  rule_type VARCHAR(20) NOT NULL, -- earn:获得 consume:消耗
  points_value INTEGER NOT NULL, -- 积分值
  description TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化积分规则数据
INSERT INTO points_rules (rule_name, rule_code, rule_type, points_value, description) VALUES
-- 获得积分规则
('上传作品审核通过', 'upload_approved', 'earn', 50, '上传作品审核通过奖励50积分'),
('作品被下载', 'work_downloaded', 'earn', 2, '作品被下载1次奖励2积分'),
('作品被收藏', 'work_collected', 'earn', 5, '作品被收藏1次奖励5积分'),
('作品被点赞', 'work_liked', 'earn', 1, '作品被点赞1次奖励1积分'),
('每日签到', 'daily_signin', 'earn', 10, '每日签到奖励10积分'),
('完善个人资料', 'complete_profile', 'earn', 20, '完善个人资料奖励20积分(一次性)'),
('绑定邮箱', 'bind_email', 'earn', 10, '绑定邮箱奖励10积分(一次性)'),
('绑定微信', 'bind_wechat', 'earn', 10, '绑定微信奖励10积分(一次性)'),
('邀请新用户', 'invite_user', 'earn', 30, '邀请新用户注册奖励30积分'),
-- 消耗积分规则
('下载普通资源', 'download_normal', 'consume', 10, '下载普通资源消耗10积分'),
('下载高级资源', 'download_advanced', 'consume', 20, '下载高级资源消耗20积分'),
('下载精品资源', 'download_premium', 'consume', 50, '下载精品资源消耗50积分');
```

#### 3.1.12 积分商品表 (points_products)

```sql
CREATE TABLE points_products (
  product_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(100) NOT NULL,
  product_type VARCHAR(20) NOT NULL, -- vip:VIP会员 download_pack:下载次数包 physical:实物商品
  product_code VARCHAR(50) UNIQUE NOT NULL,
  points_required INTEGER NOT NULL, -- 所需积分
  product_value TEXT, -- 商品价值(JSON格式,如VIP天数、下载次数等)
  stock INTEGER DEFAULT -1, -- 库存(-1表示无限)
  image_url VARCHAR(500),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1, -- 1:上架 0:下架
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_products_product_type ON points_products(product_type);
CREATE INDEX idx_points_products_status ON points_products(status);

-- 初始化积分商品数据
INSERT INTO points_products (product_name, product_type, product_code, points_required, product_value, description, sort_order) VALUES
('VIP月卡', 'vip', 'vip_month_points', 1000, '{"days": 30}', '使用1000积分兑换VIP月卡', 1),
('VIP季卡', 'vip', 'vip_quarter_points', 2500, '{"days": 90}', '使用2500积分兑换VIP季卡', 2),
('VIP年卡', 'vip', 'vip_year_points', 8000, '{"days": 365}', '使用8000积分兑换VIP年卡', 3),
('下载次数包(10次)', 'download_pack', 'download_pack_10', 80, '{"count": 10}', '使用80积分兑换10次下载次数', 4),
('下载次数包(50次)', 'download_pack', 'download_pack_50', 350, '{"count": 50}', '使用350积分兑换50次下载次数', 5),
('下载次数包(100次)', 'download_pack', 'download_pack_100', 600, '{"count": 100}', '使用600积分兑换100次下载次数', 6);
```

#### 3.1.13 积分兑换记录表 (points_exchange_records)

```sql
CREATE TABLE points_exchange_records (
  exchange_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(36) REFERENCES users(user_id),
  product_id VARCHAR(36) REFERENCES points_products(product_id),
  product_name VARCHAR(100) NOT NULL,
  product_type VARCHAR(20) NOT NULL,
  points_cost INTEGER NOT NULL, -- 消耗积分
  delivery_status INTEGER DEFAULT 0, -- 0:待发货 1:已发货 2:已完成(仅实物商品)
  delivery_address TEXT, -- 收货地址(仅实物商品)
  tracking_number VARCHAR(100), -- 物流单号(仅实物商品)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_exchange_records_user_id ON points_exchange_records(user_id);
CREATE INDEX idx_points_exchange_records_delivery_status ON points_exchange_records(delivery_status);
```

#### 3.1.14 每日任务表 (daily_tasks)

```sql
CREATE TABLE daily_tasks (
  task_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name VARCHAR(50) NOT NULL,
  task_code VARCHAR(50) UNIQUE NOT NULL,
  task_type VARCHAR(20) NOT NULL, -- daily:每日任务 weekly:每周任务 once:一次性任务
  points_reward INTEGER NOT NULL, -- 任务奖励积分
  target_count INTEGER DEFAULT 1, -- 目标次数
  description TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化每日任务数据
INSERT INTO daily_tasks (task_name, task_code, task_type, points_reward, target_count, description, sort_order) VALUES
('每日签到', 'daily_signin', 'daily', 10, 1, '每日签到奖励10积分', 1),
('上传1个作品', 'upload_work', 'daily', 50, 1, '上传1个作品奖励50积分', 2),
('下载3个资源', 'download_resources', 'daily', 5, 3, '下载3个资源奖励5积分', 3),
('收藏5个作品', 'collect_works', 'daily', 5, 5, '收藏5个作品奖励5积分', 4),
('分享作品到社交媒体', 'share_work', 'daily', 15, 1, '分享作品到社交媒体奖励15积分', 5);
```

#### 3.1.15 用户任务完成记录表 (user_tasks)

```sql
CREATE TABLE user_tasks (
  record_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(36) REFERENCES users(user_id),
  task_id VARCHAR(36) REFERENCES daily_tasks(task_id),
  task_code VARCHAR(50) NOT NULL,
  completed_count INTEGER DEFAULT 0, -- 已完成次数
  target_count INTEGER NOT NULL, -- 目标次数
  is_completed BOOLEAN DEFAULT FALSE,
  task_date DATE NOT NULL, -- 任务日期(用于每日任务重置)
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX idx_user_tasks_task_date ON user_tasks(task_date);
CREATE INDEX idx_user_tasks_is_completed ON user_tasks(is_completed);
CREATE UNIQUE INDEX idx_user_tasks_unique ON user_tasks(user_id, task_id, task_date);
```

#### 3.1.16 下载记录表 (download_history)

#### 3.1.16 下载记录表 (download_history)

```sql
CREATE TABLE download_history (
  download_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(36) REFERENCES users(user_id),
  resource_id VARCHAR(36) REFERENCES resources(resource_id),
  points_cost INTEGER DEFAULT 0, -- 消耗积分(VIP用户为0)
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_download_history_user_id ON download_history(user_id);
CREATE INDEX idx_download_history_resource_id ON download_history(resource_id);
CREATE INDEX idx_download_history_created_at ON download_history(created_at DESC);
```

#### 3.1.17 审核日志表 (audit_logs)

#### 3.1.17 审核日志表 (audit_logs)

```sql
CREATE TABLE audit_logs (
  log_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id VARCHAR(36) REFERENCES resources(resource_id),
  auditor_id VARCHAR(36) REFERENCES users(user_id),
  action VARCHAR(20) NOT NULL, -- approve, reject
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_auditor_id ON audit_logs(auditor_id);
```

#### 3.1.18 轮播图表 (banners)

#### 3.1.18 轮播图表 (banners)

```sql
CREATE TABLE banners (
  banner_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  link_url VARCHAR(500),
  link_type VARCHAR(20), -- internal, external, category, resource
  sort_order INTEGER DEFAULT 0,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status INTEGER DEFAULT 1, -- 1:启用 0:禁用
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_banners_sort_order ON banners(sort_order);
CREATE INDEX idx_banners_status ON banners(status);
```

#### 3.1.19 公告表 (announcements)

#### 3.1.19 公告表 (announcements)

```sql
CREATE TABLE announcements (
  announcement_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'normal', -- normal, important, warning
  link_url VARCHAR(500),
  is_top BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_is_top ON announcements(is_top);
CREATE INDEX idx_announcements_status ON announcements(status);
```

#### 3.1.20 系统配置表 (system_config)

#### 3.1.20 系统配置表 (system_config)

```sql
CREATE TABLE system_config (
  config_id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  config_type VARCHAR(20) NOT NULL, -- string, number, boolean, json
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化系统配置
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('site_name', '星潮设计', 'string', '网站名称'),
('site_logo', '/logo.png', 'string', '网站Logo'),
('max_file_size', '1000', 'number', '最大文件大小(MB)'),
('daily_download_limit', '10', 'number', '普通用户每日下载次数'),
('watermark_text', '星潮设计', 'string', '水印文字'),
('watermark_opacity', '0.6', 'number', '水印透明度'),
('points_recharge_enabled', 'true', 'boolean', '是否启用积分充值功能'),
('vip_auto_renew_enabled', 'true', 'boolean', '是否启用VIP自动续费');
```

### 3.2 数据库关系图

```
users (用户表)
  ├── 1:N → resources (资源表)
  ├── 1:N → orders (订单表)
  ├── 1:N → download_history (下载记录表)
  ├── 1:N → audit_logs (审核日志表)
  ├── 1:N → points_records (积分记录表)
  ├── 1:N → points_exchange_records (积分兑换记录表)
  ├── 1:N → user_tasks (用户任务记录表)
  └── N:1 → roles (角色表)

roles (角色表)
  └── N:N → permissions (权限表) [通过 role_permissions]

resources (资源表)
  ├── N:1 → categories (分类表)
  ├── N:1 → users (上传者)
  ├── N:1 → users (审核者)
  └── 1:N → download_history (下载记录表)

categories (分类表)
  └── 1:N → categories (子分类,自关联)

vip_packages (VIP套餐表)
  └── 1:N → orders (订单表)

points_products (积分商品表)
  └── 1:N → points_exchange_records (兑换记录表)

daily_tasks (每日任务表)
  └── 1:N → user_tasks (用户任务记录表)
```

### 3.3 资源排序算法设计

#### 3.3.1 排序方式说明

系统提供5种资源排序方式,满足用户不同的浏览需求:

1. **综合排序 (comprehensive)** - 默认排序方式
   - 综合考虑多个维度计算资源评分
   - 评分公式: `score = download_count * 0.4 + view_count * 0.2 + collect_count * 0.3 + time_factor * 0.1`
   - 时间因子: 根据发布时间计算,越新的资源时间因子越高(最近30天内发布的资源获得加成)
   - 按评分降序排列

2. **最多下载 (download)** 
   - 按 `download_count` 降序排列
   - 适合用户寻找热门、实用的资源

3. **最新发布 (latest)**
   - 按 `created_at` 降序排列
   - 适合用户浏览最新上传的资源

4. **最多好评 (like)**
   - 按 `like_count` 降序排列
   - 适合用户寻找高质量、受欢迎的资源

5. **最多收藏 (collect)**
   - 按 `collect_count` 降序排列
   - 适合用户寻找值得收藏的精品资源

#### 3.3.2 综合排序算法详解

综合排序是系统的默认排序方式,通过多维度评分为用户推荐最合适的资源。

**评分公式:**
```
综合评分 = download_count * 0.4 + view_count * 0.2 + collect_count * 0.3 + time_factor * 0.1
```

**权重说明:**
- 下载量权重 40%: 下载量是用户对资源价值的最直接认可
- 收藏数权重 30%: 收藏表示用户认为资源值得保存,质量较高
- 浏览量权重 20%: 浏览量反映资源的曝光度和吸引力
- 时间因子权重 10%: 给予新资源一定的曝光机会,避免老资源垄断

**时间因子计算:**
```typescript
function calculateTimeFactor(createdAt: Date): number {
  const now = new Date();
  const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceCreation <= 7) {
    // 7天内: 时间因子 = 1000
    return 1000;
  } else if (daysSinceCreation <= 30) {
    // 8-30天: 时间因子线性递减 1000 -> 500
    return 1000 - (daysSinceCreation - 7) * (500 / 23);
  } else if (daysSinceCreation <= 90) {
    // 31-90天: 时间因子线性递减 500 -> 100
    return 500 - (daysSinceCreation - 30) * (400 / 60);
  } else {
    // 90天以上: 时间因子 = 0
    return 0;
  }
}
```

**实现示例 (SQL):**
```sql
SELECT 
  *,
  (
    download_count * 0.4 + 
    view_count * 0.2 + 
    collect_count * 0.3 + 
    CASE 
      WHEN EXTRACT(DAY FROM (NOW() - created_at)) <= 7 THEN 1000 * 0.1
      WHEN EXTRACT(DAY FROM (NOW() - created_at)) <= 30 THEN 
        (1000 - (EXTRACT(DAY FROM (NOW() - created_at)) - 7) * (500.0 / 23)) * 0.1
      WHEN EXTRACT(DAY FROM (NOW() - created_at)) <= 90 THEN 
        (500 - (EXTRACT(DAY FROM (NOW() - created_at)) - 30) * (400.0 / 60)) * 0.1
      ELSE 0
    END
  ) AS comprehensive_score
FROM resources
WHERE audit_status = 1 AND status = 1
ORDER BY comprehensive_score DESC;
```

#### 3.3.3 排序性能优化

为确保排序查询性能,采取以下优化措施:

1. **数据库索引优化**
   - 为 `download_count`, `like_count`, `collect_count`, `created_at` 创建降序索引
   - 支持快速排序查询

2. **缓存策略**
   - 综合排序结果缓存30分钟(Redis)
   - 其他排序方式缓存15分钟
   - 资源更新时清除相关缓存

3. **分页查询**
   - 使用游标分页(cursor-based pagination)替代偏移分页
   - 避免大偏移量查询性能问题

4. **异步更新统计数据**
   - 下载量、浏览量、收藏数等统计数据异步更新
   - 使用消息队列(Bull + Redis)处理统计更新
   - 避免高并发下的数据库写入压力


## 4. API接口设计

### 4.1 API设计原则

1. **RESTful风格**: 使用标准HTTP方法(GET/POST/PUT/DELETE)
2. **统一响应格式**: `{code: number, msg: string, data: any, timestamp: number}`
3. **版本控制**: `/api/v1/`
4. **认证方式**: JWT Token (Authorization: Bearer {token})
5. **错误处理**: 统一错误码和错误信息

### 4.2 统一响应格式

```typescript
interface ApiResponse<T = any> {
  code: number;        // 200:成功 其他:失败
  msg: string;         // 响应消息
  data: T;             // 响应数据
  timestamp: number;   // 时间戳
}

// 成功响应示例
{
  "code": 200,
  "msg": "操作成功",
  "data": { ... },
  "timestamp": 1703145600000
}

// 失败响应示例
{
  "code": 400,
  "msg": "参数错误",
  "data": null,
  "timestamp": 1703145600000
}
```

### 4.3 错误码定义

```typescript
enum ErrorCode {
  SUCCESS = 200,              // 成功
  BAD_REQUEST = 400,          // 请求参数错误
  UNAUTHORIZED = 401,         // 未授权
  FORBIDDEN = 403,            // 无权限
  NOT_FOUND = 404,            // 资源不存在
  INTERNAL_ERROR = 500,       // 服务器内部错误
  
  // 业务错误码
  USER_NOT_FOUND = 1001,      // 用户不存在
  USER_DISABLED = 1002,       // 用户已禁用
  WRONG_PASSWORD = 1003,      // 密码错误
  PHONE_EXISTS = 1004,        // 手机号已存在
  VERIFY_CODE_ERROR = 1005,   // 验证码错误
  
  RESOURCE_NOT_FOUND = 2001,  // 资源不存在
  RESOURCE_DELETED = 2002,    // 资源已删除
  DOWNLOAD_LIMIT = 2003,      // 下载次数已用完
  VIP_REQUIRED = 2004,        // 需要VIP权限
  
  FILE_TOO_LARGE = 3001,      // 文件过大
  FILE_FORMAT_ERROR = 3002,   // 文件格式错误
  UPLOAD_FAILED = 3003,       // 上传失败
  
  PAYMENT_FAILED = 4001,      // 支付失败
  ORDER_NOT_FOUND = 4002,     // 订单不存在
}
```

### 4.4 认证相关接口

#### 4.4.1 用户注册

```
POST /api/v1/auth/register

Request Body:
{
  "phone": "13800138000",
  "verifyCode": "123456",
  "password": "password123"
}

Response:
{
  "code": 200,
  "msg": "注册成功",
  "data": {
    "userId": "uuid",
    "phone": "13800138000",
    "nickname": "用户13800138000"
  },
  "timestamp": 1703145600000
}
```

#### 4.4.2 用户登录(密码)

```
POST /api/v1/auth/login

Request Body:
{
  "phone": "13800138000",
  "password": "password123",
  "rememberMe": true
}

Response:
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "jwt_token_string",
    "userInfo": {
      "userId": "uuid",
      "phone": "13800138000",
      "nickname": "用户名",
      "avatar": "/avatar.jpg",
      "vipLevel": 1,
      "vipExpireAt": "2024-12-31T23:59:59Z",
      "roleCode": "user"
    }
  },
  "timestamp": 1703145600000
}
```

#### 4.4.3 发送验证码

```
POST /api/v1/auth/send-code

Request Body:
{
  "phone": "13800138000",
  "type": "register" // register, login, reset
}

Response:
{
  "code": 200,
  "msg": "验证码已发送",
  "data": {
    "expireIn": 60 // 秒
  },
  "timestamp": 1703145600000
}
```

#### 4.4.4 微信登录

```
GET /api/v1/auth/wechat/login

Response: 重定向到微信授权页面

Callback:
GET /api/v1/auth/wechat/callback?code=xxx

Response:
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "jwt_token_string",
    "userInfo": { ... }
  },
  "timestamp": 1703145600000
}
```

### 4.5 用户相关接口

#### 4.5.1 获取用户信息

```
GET /api/v1/user/info

Headers:
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "userId": "uuid",
    "phone": "138****8000",
    "nickname": "用户名",
    "avatar": "/avatar.jpg",
    "email": "user@example.com",
    "bio": "个人简介",
    "vipLevel": 1,
    "vipExpireAt": "2024-12-31T23:59:59Z",
    "roleCode": "user",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "timestamp": 1703145600000
}
```

#### 4.5.2 更新用户信息

```
PUT /api/v1/user/info

Headers:
Authorization: Bearer {token}

Request Body:
{
  "nickname": "新昵称",
  "avatar": "/new-avatar.jpg",
  "bio": "新的个人简介"
}

Response:
{
  "code": 200,
  "msg": "更新成功",
  "data": null,
  "timestamp": 1703145600000
}
```

#### 4.5.3 修改密码

```
PUT /api/v1/user/password

Headers:
Authorization: Bearer {token}

Request Body:
{
  "oldPassword": "old_password",
  "newPassword": "new_password"
}

Response:
{
  "code": 200,
  "msg": "密码修改成功",
  "data": null,
  "timestamp": 1703145600000
}
```

### 4.6 资源相关接口

#### 4.6.1 获取资源列表

```
GET /api/v1/resources?pageNum=1&pageSize=20&categoryId=xxx&vipLevel=0&sortType=comprehensive

Query Parameters:
- pageNum: 页码(默认1)
- pageSize: 每页数量(默认20)
- categoryId: 分类ID(可选)
- vipLevel: VIP等级(可选,0:免费 1:VIP)
- sortType: 排序方式(可选,默认comprehensive)
  * comprehensive: 综合排序(默认,综合评分 = 下载量*0.4 + 浏览量*0.2 + 收藏数*0.3 + 时间因子*0.1)
  * download: 最多下载(按download_count降序)
  * latest: 最新发布(按created_at降序)
  * like: 最多好评(按like_count降序)
  * collect: 最多收藏(按collect_count降序)
- keyword: 搜索关键词(可选)

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "resourceId": "uuid",
        "title": "资源标题",
        "description": "资源描述",
        "cover": "/cover.jpg",
        "fileFormat": "PSD",
        "fileSize": 10485760,
        "vipLevel": 0,
        "pointsCost": 10, // 下载所需积分(VIP用户为0,免费资源为0)
        "downloadCount": 1234,
        "viewCount": 5678,
        "tags": ["UI", "设计"],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "pageNum": 1,
    "pageSize": 20
  },
  "timestamp": 1703145600000
}

注意: pointsCost字段仅在用户登录时返回,未登录用户不返回此字段
```

#### 4.6.2 获取资源详情

```
GET /api/v1/resources/:resourceId

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "resourceId": "uuid",
    "title": "资源标题",
    "description": "资源描述",
    "cover": "/cover.jpg",
    "fileUrl": "/file.psd",
    "fileName": "design.psd",
    "fileSize": 10485760,
    "fileFormat": "PSD",
    "previewImages": ["/preview1.jpg", "/preview2.jpg"],
    "categoryId": "uuid",
    "categoryName": "UI设计类",
    "tags": ["UI", "设计"],
    "vipLevel": 0,
    "pointsCost": 10, // 下载所需积分(VIP用户为0,免费资源为0)
    "downloadCount": 1234,
    "viewCount": 5678,
    "collectCount": 90,
    "uploader": {
      "userId": "uuid",
      "nickname": "上传者",
      "avatar": "/avatar.jpg"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "timestamp": 1703145600000
}

注意: pointsCost字段仅在用户登录时返回,未登录用户不返回此字段
```

#### 4.6.3 下载资源

```
POST /api/v1/resources/:resourceId/download

Headers:
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "msg": "下载成功",
  "data": {
    "downloadUrl": "https://cdn.example.com/file.psd?sign=xxx&expire=xxx"
  },
  "timestamp": 1703145600000
}
```

#### 4.6.4 上传资源

```
POST /api/v1/resources/upload

Headers:
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request Body (FormData):
- file: 文件
- title: 标题
- description: 描述
- categoryId: 分类ID
- tags: 标签(JSON数组字符串)
- vipLevel: VIP等级

Response:
{
  "code": 200,
  "msg": "上传成功",
  "data": {
    "resourceId": "uuid",
    "auditStatus": 0 // 0:待审核
  },
  "timestamp": 1703145600000
}
```

### 4.7 管理后台接口

#### 4.7.1 获取用户列表(管理员)

```
GET /api/v1/admin/users?pageNum=1&pageSize=20&keyword=&vipLevel=&status=

Headers:
Authorization: Bearer {admin_token}

Query Parameters:
- pageNum: 页码
- pageSize: 每页数量
- keyword: 搜索关键词(手机号/昵称/用户ID)
- vipLevel: VIP等级筛选
- status: 状态筛选(1:正常 0:禁用)

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "userId": "uuid",
        "phone": "138****8000",
        "nickname": "用户名",
        "avatar": "/avatar.jpg",
        "vipLevel": 1,
        "vipExpireAt": "2024-12-31T23:59:59Z",
        "roleCode": "user",
        "status": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "lastLoginAt": "2024-01-10T10:00:00Z"
      }
    ],
    "total": 1000,
    "pageNum": 1,
    "pageSize": 20
  },
  "timestamp": 1703145600000
}
```

#### 4.7.2 禁用/启用用户

```
PUT /api/v1/admin/users/:userId/status

Headers:
Authorization: Bearer {admin_token}

Request Body:
{
  "status": 0 // 1:启用 0:禁用
}

Response:
{
  "code": 200,
  "msg": "操作成功",
  "data": null,
  "timestamp": 1703145600000
}
```

#### 4.7.3 获取待审核资源列表

```
GET /api/v1/admin/audit/resources?pageNum=1&pageSize=20

Headers:
Authorization: Bearer {moderator_token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "resourceId": "uuid",
        "title": "资源标题",
        "cover": "/cover.jpg",
        "fileFormat": "PSD",
        "uploader": {
          "userId": "uuid",
          "nickname": "上传者"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "pageNum": 1,
    "pageSize": 20
  },
  "timestamp": 1703145600000
}
```

#### 4.7.4 审核资源

```
POST /api/v1/admin/audit/resources/:resourceId

Headers:
Authorization: Bearer {moderator_token}

Request Body:
{
  "action": "approve", // approve:通过 reject:驳回
  "reason": "驳回原因(action为reject时必填)"
}

Response:
{
  "code": 200,
  "msg": "审核成功",
  "data": null,
  "timestamp": 1703145600000
}
```

#### 4.7.5 获取数据统计

```
GET /api/v1/admin/statistics/overview

Headers:
Authorization: Bearer {admin_token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "userTotal": 10000,
    "resourceTotal": 5000,
    "todayDownload": 1234,
    "todayUpload": 56,
    "vipUserCount": 500,
    "pendingAuditCount": 20,
    "userGrowthTrend": [
      { "date": "2024-01-01", "count": 100 },
      { "date": "2024-01-02", "count": 120 }
    ],
    "resourceGrowthTrend": [
      { "date": "2024-01-01", "count": 50 },
      { "date": "2024-01-02", "count": 60 }
    ]
  },
  "timestamp": 1703145600000
}
```

### 4.8 支付相关接口

#### 4.8.1 创建订单

```
POST /api/v1/payment/orders

Headers:
Authorization: Bearer {token}

Request Body:
{
  "orderType": "vip", // vip:VIP订单 points:积分充值订单
  "productType": "vip_month", // vip_month, vip_quarter, vip_year, points_100, points_500等
  "paymentMethod": "wechat" // wechat, alipay
}

Response:
{
  "code": 200,
  "msg": "订单创建成功",
  "data": {
    "orderNo": "ORDER20240101123456",
    "amount": 29.90,
    "qrCode": "data:image/png;base64,..." // 支付二维码
  },
  "timestamp": 1703145600000
}
```

#### 4.8.2 查询订单状态

```
GET /api/v1/payment/orders/:orderNo

Headers:
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "orderNo": "ORDER20240101123456",
    "paymentStatus": 1, // 0:待支付 1:已支付 2:已取消 3:已退款
    "amount": 29.90,
    "paidAt": "2024-01-01T12:00:00Z"
  },
  "timestamp": 1703145600000
}
```

### 4.9 VIP相关接口

#### 4.9.1 获取VIP套餐列表

```
GET /api/v1/vip/packages

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "packageId": "uuid",
      "packageName": "VIP月卡",
      "packageCode": "vip_month",
      "durationDays": 30,
      "originalPrice": 39.90,
      "currentPrice": 29.90,
      "description": "30天VIP会员,享受所有VIP特权",
      "discount": "7.5折"
    }
  ],
  "timestamp": 1703145600000
}
```

#### 4.9.2 获取VIP特权列表

```
GET /api/v1/vip/privileges

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "privilegeId": "uuid",
      "privilegeName": "免费下载所有资源",
      "privilegeCode": "free_download_all",
      "description": "VIP用户可免费下载所有资源,无需消耗积分",
      "isEnabled": true
    }
  ],
  "timestamp": 1703145600000
}
```

#### 4.9.3 获取用户VIP信息

```
GET /api/v1/vip/my-info

Headers:
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "isVip": true,
    "vipLevel": 1,
    "vipExpireAt": "2024-12-31T23:59:59Z",
    "remainingDays": 180,
    "privileges": [
      {
        "privilegeName": "免费下载所有资源",
        "privilegeCode": "free_download_all",
        "isEnabled": true
      }
    ]
  },
  "timestamp": 1703145600000
}
```

#### 4.9.4 管理员 - 获取VIP套餐列表

```
GET /api/v1/admin/vip/packages?pageNum=1&pageSize=20

Headers:
Authorization: Bearer {admin_token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "packageId": "uuid",
        "packageName": "VIP月卡",
        "packageCode": "vip_month",
        "durationDays": 30,
        "originalPrice": 39.90,
        "currentPrice": 29.90,
        "status": 1,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 3,
    "pageNum": 1,
    "pageSize": 20
  },
  "timestamp": 1703145600000
}
```

#### 4.9.5 管理员 - 添加/编辑VIP套餐

```
POST /api/v1/admin/vip/packages
PUT /api/v1/admin/vip/packages/:packageId

Headers:
Authorization: Bearer {admin_token}

Request Body:
{
  "packageName": "VIP月卡",
  "packageCode": "vip_month",
  "durationDays": 30,
  "originalPrice": 39.90,
  "currentPrice": 29.90,
  "description": "30天VIP会员"
}

Response:
{
  "code": 200,
  "msg": "操作成功",
  "data": null,
  "timestamp": 1703145600000
}
```

#### 4.9.6 管理员 - 获取VIP订单列表

```
GET /api/v1/admin/vip/orders?pageNum=1&pageSize=20&keyword=&paymentStatus=

Headers:
Authorization: Bearer {admin_token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "orderId": "uuid",
        "orderNo": "ORDER20240101123456",
        "user": {
          "userId": "uuid",
          "nickname": "用户名",
          "phone": "138****8000"
        },
        "packageName": "VIP月卡",
        "amount": 29.90,
        "paymentMethod": "wechat",
        "paymentStatus": 1,
        "paidAt": "2024-01-01T12:00:00Z",
        "createdAt": "2024-01-01T11:00:00Z"
      }
    ],
    "total": 100,
    "pageNum": 1,
    "pageSize": 20
  },
  "timestamp": 1703145600000
}
```

#### 4.9.7 管理员 - VIP统计数据

```
GET /api/v1/admin/vip/statistics

Headers:
Authorization: Bearer {admin_token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "vipUserTotal": 500,
    "todayNewVip": 10,
    "monthNewVip": 150,
    "totalRevenue": 50000.00,
    "todayRevenue": 500.00,
    "monthRevenue": 8000.00,
    "packageSales": [
      { "packageName": "VIP月卡", "count": 200 },
      { "packageName": "VIP季卡", "count": 80 },
      { "packageName": "VIP年卡", "count": 50 }
    ],
    "vipGrowthTrend": [
      { "date": "2024-01-01", "count": 10 },
      { "date": "2024-01-02", "count": 15 }
    ],
    "revenueGrowthTrend": [
      { "date": "2024-01-01", "amount": 500.00 },
      { "date": "2024-01-02", "amount": 800.00 }
    ]
  },
  "timestamp": 1703145600000
}
```

### 4.10 积分相关接口

#### 4.10.1 获取用户积分信息

```
GET /api/v1/points/my-info

Headers:
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "pointsBalance": 1500, // 当前积分余额
    "pointsTotal": 5000, // 累计获得积分
    "userLevel": 3, // 用户等级
    "levelName": "中级", // 等级名称
    "nextLevelPoints": 5000, // 下一等级所需积分
    "levelPrivileges": [
      "下载资源-10%积分消耗",
      "专属等级徽章"
    ]
  },
  "timestamp": 1703145600000
}
```

#### 4.10.2 获取积分明细

```
GET /api/v1/points/records?pageNum=1&pageSize=20&changeType=&startDate=&endDate=

Headers:
Authorization: Bearer {token}

Query Parameters:
- pageNum: 页码
- pageSize: 每页数量
- changeType: 类型筛选(earn:获得 consume:消耗 exchange:兑换 recharge:充值)
- startDate: 开始日期
- endDate: 结束日期

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "recordId": "uuid",
        "pointsChange": 50,
        "pointsBalance": 1500,
        "changeType": "earn",
        "source": "upload_approved",
        "description": "上传作品审核通过",
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 100,
    "pageNum": 1,
    "pageSize": 20,
    "statistics": {
      "totalEarned": 5000,
      "totalConsumed": 3500,
      "currentBalance": 1500
    }
  },
  "timestamp": 1703145600000
}
```

#### 4.10.3 获取积分商城商品列表

```
GET /api/v1/points/products?productType=

Query Parameters:
- productType: 商品类型(vip, download_pack, physical)

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "productId": "uuid",
      "productName": "VIP月卡",
      "productType": "vip",
      "productCode": "vip_month_points",
      "pointsRequired": 1000,
      "productValue": {"days": 30},
      "imageUrl": "/vip-month.png",
      "description": "使用1000积分兑换VIP月卡",
      "stock": -1 // -1表示无限
    }
  ],
  "timestamp": 1703145600000
}
```

#### 4.10.4 兑换积分商品

```
POST /api/v1/points/exchange

Headers:
Authorization: Bearer {token}

Request Body:
{
  "productId": "uuid",
  "deliveryAddress": "收货地址(仅实物商品需要)"
}

Response:
{
  "code": 200,
  "msg": "兑换成功",
  "data": {
    "exchangeId": "uuid",
    "pointsCost": 1000,
    "remainingPoints": 500
  },
  "timestamp": 1703145600000
}
```

#### 4.10.5 获取兑换记录

```
GET /api/v1/points/exchange-records?pageNum=1&pageSize=20

Headers:
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "exchangeId": "uuid",
        "productName": "VIP月卡",
        "productType": "vip",
        "pointsCost": 1000,
        "deliveryStatus": 2, // 0:待发货 1:已发货 2:已完成
        "trackingNumber": "SF1234567890",
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 10,
    "pageNum": 1,
    "pageSize": 20
  },
  "timestamp": 1703145600000
}
```

#### 4.10.6 获取每日任务列表

```
GET /api/v1/points/daily-tasks

Headers:
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "taskId": "uuid",
      "taskName": "每日签到",
      "taskCode": "daily_signin",
      "pointsReward": 10,
      "targetCount": 1,
      "completedCount": 0,
      "isCompleted": false,
      "description": "每日签到奖励10积分"
    }
  ],
  "timestamp": 1703145600000
}
```

#### 4.10.7 完成每日任务

```
POST /api/v1/points/daily-tasks/:taskCode/complete

Headers:
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "msg": "任务完成,获得10积分",
  "data": {
    "pointsEarned": 10,
    "currentBalance": 1510
  },
  "timestamp": 1703145600000
}
```

#### 4.10.8 每日签到

```
POST /api/v1/points/signin

Headers:
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "msg": "签到成功,获得10积分",
  "data": {
    "pointsEarned": 10,
    "currentBalance": 1510,
    "continuousDays": 5 // 连续签到天数
  },
  "timestamp": 1703145600000
}
```

#### 4.10.9 管理员 - 获取积分规则列表

```
GET /api/v1/admin/points/rules

Headers:
Authorization: Bearer {admin_token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "ruleId": "uuid",
      "ruleName": "上传作品审核通过",
      "ruleCode": "upload_approved",
      "ruleType": "earn",
      "pointsValue": 50,
      "isEnabled": true
    }
  ],
  "timestamp": 1703145600000
}
```

#### 4.10.10 管理员 - 更新积分规则

```
PUT /api/v1/admin/points/rules/:ruleId

Headers:
Authorization: Bearer {admin_token}

Request Body:
{
  "pointsValue": 60,
  "isEnabled": true
}

Response:
{
  "code": 200,
  "msg": "更新成功",
  "data": null,
  "timestamp": 1703145600000
}
```

#### 4.10.11 管理员 - 积分商城管理

```
GET /api/v1/admin/points/products?pageNum=1&pageSize=20
POST /api/v1/admin/points/products
PUT /api/v1/admin/points/products/:productId
DELETE /api/v1/admin/points/products/:productId

Headers:
Authorization: Bearer {admin_token}

Request Body (POST/PUT):
{
  "productName": "VIP月卡",
  "productType": "vip",
  "productCode": "vip_month_points",
  "pointsRequired": 1000,
  "productValue": "{\"days\": 30}",
  "imageUrl": "/vip-month.png",
  "description": "使用1000积分兑换VIP月卡",
  "stock": -1
}

Response:
{
  "code": 200,
  "msg": "操作成功",
  "data": null,
  "timestamp": 1703145600000
}
```

#### 4.10.12 管理员 - 获取兑换记录

```
GET /api/v1/admin/points/exchange-records?pageNum=1&pageSize=20&keyword=&deliveryStatus=

Headers:
Authorization: Bearer {admin_token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "exchangeId": "uuid",
        "user": {
          "userId": "uuid",
          "nickname": "用户名",
          "phone": "138****8000"
        },
        "productName": "定制U盘",
        "productType": "physical",
        "pointsCost": 500,
        "deliveryStatus": 0,
        "deliveryAddress": "广东省深圳市...",
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 50,
    "pageNum": 1,
    "pageSize": 20
  },
  "timestamp": 1703145600000
}
```

#### 4.10.13 管理员 - 发货

```
PUT /api/v1/admin/points/exchange-records/:exchangeId/ship

Headers:
Authorization: Bearer {admin_token}

Request Body:
{
  "trackingNumber": "SF1234567890"
}

Response:
{
  "code": 200,
  "msg": "发货成功",
  "data": null,
  "timestamp": 1703145600000
}
```

#### 4.10.14 管理员 - 积分统计

```
GET /api/v1/admin/points/statistics

Headers:
Authorization: Bearer {admin_token}

Response:
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "totalIssued": 500000, // 总发放积分
    "totalConsumed": 300000, // 总消耗积分
    "totalExchanged": 100000, // 总兑换积分
    "currentCirculation": 100000, // 当前流通积分
    "pointsFlowTrend": [
      { "date": "2024-01-01", "issued": 5000, "consumed": 3000 }
    ],
    "topEarnUsers": [
      { "userId": "uuid", "nickname": "用户A", "points": 10000 }
    ],
    "popularProducts": [
      { "productName": "VIP月卡", "exchangeCount": 100 }
    ]
  },
  "timestamp": 1703145600000
}
```

#### 4.10.15 管理员 - 手动调整用户积分

```
POST /api/v1/admin/users/:userId/points/adjust

Headers:
Authorization: Bearer {admin_token}

Request Body:
{
  "pointsChange": 100, // 正数为增加,负数为扣减
  "reason": "活动奖励"
}

Response:
{
  "code": 200,
  "msg": "调整成功",
  "data": {
    "newBalance": 1600
  },
  "timestamp": 1703145600000
}
```


## 5. 前端组件设计

### 5.1 前台页面组件

#### 5.1.1 搜索框组件 (SearchBar.vue)

```vue
<template>
  <div class="search-bar">
    <el-input
      v-model="keyword"
      placeholder="搜索设计资源..."
      @input="handleInput"
      @keyup.enter="handleSearch"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
      <template #suffix>
        <el-icon v-if="keyword" @click="clearKeyword"><Close /></el-icon>
      </template>
    </el-input>
    
    <!-- 搜索建议下拉框 -->
    <div v-if="showSuggestions" class="suggestions">
      <div
        v-for="item in suggestions"
        :key="item"
        class="suggestion-item"
        @click="selectSuggestion(item)"
      >
        {{ item }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSearch } from '@/composables/useSearch';
import { debounce } from '@/utils/debounce';

const { keyword, suggestions, showSuggestions, fetchSuggestions, handleSearch } = useSearch();

const handleInput = debounce(() => {
  if (keyword.value.length >= 2) {
    fetchSuggestions();
  }
}, 300);
</script>
```

#### 5.1.2 资源卡片组件 (ResourceCard.vue)

```vue
<template>
  <div class="resource-card" @click="goToDetail">
    <!-- 封面图 -->
    <div class="card-cover">
      <img v-lazy="resource.cover" :alt="resource.title" />
      <div v-if="resource.vipLevel > 0" class="vip-badge">VIP</div>
      
      <!-- 积分消耗标识(仅登录用户可见) -->
      <div v-if="isLoggedIn && !isVip && resource.pointsCost > 0" class="points-badge">
        <el-icon><Coin /></el-icon>
        {{ resource.pointsCost }}积分
      </div>
      
      <!-- VIP免费标识 -->
      <div v-if="isLoggedIn && isVip" class="free-badge">
        VIP免费
      </div>
    </div>
    
    <!-- 资源信息 -->
    <div class="card-info">
      <h3 class="card-title">{{ resource.title }}</h3>
      <div class="card-meta">
      <div class="card-meta">
        <span class="format">{{ resource.fileFormat }}</span>
        <span class="size">{{ formatFileSize(resource.fileSize) }}</span>
      </div>
      <div class="card-stats">
        <span><el-icon><Download /></el-icon> {{ resource.downloadCount }}</span>
        <span><el-icon><View /></el-icon> {{ resource.viewCount }}</span>
      </div>
      
      <!-- 积分消耗信息(仅登录用户可见) -->
      <div v-if="isLoggedIn && !isVip" class="card-points">
        <el-icon><Coin /></el-icon>
        <span v-if="resource.pointsCost > 0">下载需 {{ resource.pointsCost }} 积分</span>
        <span v-else class="free-text">免费下载</span>
      </div>
      <div v-if="isLoggedIn && isVip" class="card-vip-free">
        <el-icon><Star /></el-icon>
        <span>VIP免费下载</span>
      </div>
    </div>
    
    <!-- 悬浮操作按钮 -->
    <div class="card-actions">
      <el-button type="primary" @click.stop="handleDownload">
        <span v-if="isLoggedIn && isVip">免费下载</span>
        <span v-else-if="isLoggedIn && resource.pointsCost > 0">{{ resource.pointsCost }}积分下载</span>
        <span v-else-if="isLoggedIn">免费下载</span>
        <span v-else>下载</span>
      </el-button>
      <el-button @click.stop="handleCollect">
        收藏
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatFileSize } from '@/utils/format';
import { useDownload } from '@/composables/useDownload';
import { useUserStore } from '@/pinia/userStore';

const props = defineProps<{
  resource: ResourceInfo;
}>();

const userStore = useUserStore();
const { handleDownload } = useDownload();

// 是否登录
const isLoggedIn = computed(() => userStore.isLoggedIn);

// 是否VIP用户
const isVip = computed(() => userStore.isVip);

function goToDetail() {
  router.push(`/resource/${props.resource.resourceId}`);
}
</script>

<style scoped lang="scss">
.resource-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    
    .card-actions {
      opacity: 1;
    }
  }
  
  .card-cover {
    position: relative;
    width: 100%;
    padding-top: 75%; // 4:3比例
    overflow: hidden;
    
    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .vip-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 12px;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #fff;
      font-size: 12px;
      font-weight: bold;
      border-radius: 4px;
    }
    
    .points-badge {
      position: absolute;
      bottom: 8px;
      left: 8px;
      padding: 4px 12px;
      background: rgba(22, 93, 255, 0.9);
      color: #fff;
      font-size: 12px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .free-badge {
      position: absolute;
      bottom: 8px;
      left: 8px;
      padding: 4px 12px;
      background: rgba(82, 196, 26, 0.9);
      color: #fff;
      font-size: 12px;
      border-radius: 4px;
    }
  }
  
  .card-info {
    padding: 12px;
    
    .card-title {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .card-meta {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 12px;
      color: #999;
    }
    
    .card-stats {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #666;
      
      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
    
    .card-points {
      margin-top: 8px;
      padding: 6px 12px;
      background: #f0f5ff;
      border-radius: 4px;
      font-size: 12px;
      color: #165DFF;
      display: flex;
      align-items: center;
      gap: 4px;
      
      .free-text {
        color: #52c41a;
      }
    }
    
    .card-vip-free {
      margin-top: 8px;
      padding: 6px 12px;
      background: linear-gradient(135deg, #fff7e6, #ffe7ba);
      border-radius: 4px;
      font-size: 12px;
      color: #fa8c16;
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }
  }
  
  .card-actions {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px;
    background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.3s;
  }
}
</style>
```

#### 5.1.3 资源详情页组件 (ResourceDetail.vue)

```vue
<template>
  <div class="resource-detail">
    <!-- 返回按钮 -->
    <div class="detail-header">
      <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
    </div>
    
    <!-- 资源主要信息 -->
    <div class="detail-main">
      <!-- 左侧预览图 -->
      <div class="detail-preview">
        <el-carousel height="500px" indicator-position="outside">
          <el-carousel-item v-for="(img, index) in resource.previewImages" :key="index">
            <img :src="img" :alt="`预览图${index + 1}`" @click="previewImage(index)" />
          </el-carousel-item>
        </el-carousel>
      </div>
      
      <!-- 右侧信息 -->
      <div class="detail-info">
        <h1 class="detail-title">{{ resource.title }}</h1>
        
        <!-- 资源元信息 -->
        <div class="detail-meta">
          <el-tag>{{ resource.categoryName }}</el-tag>
          <el-tag v-for="tag in resource.tags" :key="tag" type="info">{{ tag }}</el-tag>
          <el-tag v-if="resource.vipLevel > 0" type="warning">VIP专属</el-tag>
        </div>
        
        <!-- 资源统计 -->
        <div class="detail-stats">
          <div class="stat-item">
            <el-icon><Download /></el-icon>
            <span>{{ resource.downloadCount }} 下载</span>
          </div>
          <div class="stat-item">
            <el-icon><View /></el-icon>
            <span>{{ resource.viewCount }} 浏览</span>
          </div>
          <div class="stat-item">
            <el-icon><Star /></el-icon>
            <span>{{ resource.collectCount }} 收藏</span>
          </div>
        </div>
        
        <!-- 积分消耗信息(仅登录用户可见) -->
        <div v-if="isLoggedIn" class="detail-points-info">
          <!-- VIP用户 -->
          <div v-if="isVip" class="vip-download-info">
            <div class="vip-badge-large">
              <el-icon><Crown /></el-icon>
              <span>VIP特权</span>
            </div>
            <div class="vip-text">
              <p class="main-text">您是VIP会员，可免费下载此资源</p>
              <p class="sub-text">无需消耗积分，享受无限下载</p>
            </div>
          </div>
          
          <!-- 普通用户 - 需要积分 -->
          <div v-else-if="resource.pointsCost > 0" class="points-download-info">
            <div class="points-required">
              <el-icon><Coin /></el-icon>
              <span class="points-value">{{ resource.pointsCost }}</span>
              <span class="points-label">积分</span>
            </div>
            <div class="points-balance">
              <p>您当前积分: <span class="balance-value">{{ userPoints }}</span></p>
              <p v-if="userPoints < resource.pointsCost" class="insufficient-tips">
                <el-icon><Warning /></el-icon>
                积分不足，还需 {{ resource.pointsCost - userPoints }} 积分
              </p>
            </div>
          </div>
          
          <!-- 普通用户 - 免费资源 -->
          <div v-else class="free-download-info">
            <el-icon><Gift /></el-icon>
            <span>此资源免费下载</span>
          </div>
        </div>
        
        <!-- 下载按钮 -->
        <div class="detail-actions">
          <el-button 
            type="primary" 
            size="large" 
            :disabled="!canDownload"
            @click="handleDownload"
          >
            <el-icon><Download /></el-icon>
            <span v-if="!isLoggedIn">登录后下载</span>
            <span v-else-if="isVip">VIP免费下载</span>
            <span v-else-if="resource.pointsCost > 0">
              {{ userPoints >= resource.pointsCost ? `${resource.pointsCost}积分下载` : '积分不足' }}
            </span>
            <span v-else>免费下载</span>
          </el-button>
          
          <el-button size="large" @click="handleCollect">
            <el-icon><Star /></el-icon>
            收藏
          </el-button>
          
          <!-- 积分不足时显示充值/赚取积分按钮 -->
          <el-button 
            v-if="isLoggedIn && !isVip && userPoints < resource.pointsCost && resource.pointsCost > 0"
            size="large"
            type="warning"
            @click="goToPoints"
          >
            <el-icon><Coin /></el-icon>
            获取积分
          </el-button>
        </div>
        
        <!-- 积分获取提示 -->
        <div v-if="isLoggedIn && !isVip && userPoints < resource.pointsCost && resource.pointsCost > 0" class="points-tips">
          <el-alert type="info" :closable="false">
            <template #title>
              <div class="tips-content">
                <p>💡 如何获取积分？</p>
                <ul>
                  <li>上传作品审核通过: +50积分</li>
                  <li>每日签到: +10积分</li>
                  <li>邀请好友注册: +30积分</li>
                  <li>或直接充值积分</li>
                </ul>
              </div>
            </template>
          </el-alert>
        </div>
        
        <!-- 文件信息 -->
        <div class="detail-file-info">
          <div class="file-info-item">
            <span class="label">文件格式:</span>
            <span class="value">{{ resource.fileFormat }}</span>
          </div>
          <div class="file-info-item">
            <span class="label">文件大小:</span>
            <span class="value">{{ formatFileSize(resource.fileSize) }}</span>
          </div>
          <div class="file-info-item">
            <span class="label">上传时间:</span>
            <span class="value">{{ formatDate(resource.createdAt) }}</span>
          </div>
        </div>
        
        <!-- 上传者信息 -->
        <div class="detail-uploader">
          <el-avatar :src="resource.uploader.avatar" :size="40" />
          <div class="uploader-info">
            <p class="uploader-name">{{ resource.uploader.nickname }}</p>
            <p class="uploader-desc">上传者</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 资源描述 -->
    <div class="detail-description">
      <h2>资源描述</h2>
      <p>{{ resource.description }}</p>
    </div>
    
    <!-- 相关推荐 -->
    <div class="detail-related">
      <h2>相关推荐</h2>
      <div class="related-list">
        <ResourceCard 
          v-for="item in relatedResources" 
          :key="item.resourceId" 
          :resource="item" 
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/pinia/userStore';
import { useResourceStore } from '@/pinia/resourceStore';
import { formatFileSize, formatDate } from '@/utils/format';
import { ElMessage, ElMessageBox } from 'element-plus';
import ResourceCard from '@/components/ResourceCard.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const resourceStore = useResourceStore();

const resource = ref<ResourceDetail>();
const relatedResources = ref<ResourceInfo[]>([]);

// 是否登录
const isLoggedIn = computed(() => userStore.isLoggedIn);

// 是否VIP用户
const isVip = computed(() => userStore.isVip);

// 用户积分
const userPoints = computed(() => userStore.pointsBalance);

// 是否可以下载
const canDownload = computed(() => {
  if (!isLoggedIn.value) return false;
  if (isVip.value) return true;
  if (!resource.value) return false;
  if (resource.value.pointsCost === 0) return true;
  return userPoints.value >= resource.value.pointsCost;
});

onMounted(async () => {
  await fetchResourceDetail();
  await fetchRelatedResources();
});

async function fetchResourceDetail() {
  const resourceId = route.params.id as string;
  resource.value = await resourceStore.getResourceDetail(resourceId);
}

async function fetchRelatedResources() {
  if (!resource.value) return;
  relatedResources.value = await resourceStore.getRelatedResources(
    resource.value.resourceId,
    resource.value.categoryId
  );
}

function goBack() {
  router.back();
}

async function handleDownload() {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录');
    router.push('/login');
    return;
  }
  
  if (!canDownload.value) {
    ElMessage.warning('积分不足，无法下载');
    return;
  }
  
  // 如果需要消耗积分，先确认
  if (!isVip.value && resource.value!.pointsCost > 0) {
    try {
      await ElMessageBox.confirm(
        `下载此资源需要消耗 ${resource.value!.pointsCost} 积分，是否继续？`,
        '确认下载',
        {
          confirmButtonText: '确认下载',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );
    } catch {
      return;
    }
  }
  
  // 执行下载
  try {
    const downloadUrl = await resourceStore.downloadResource(resource.value!.resourceId);
    window.open(downloadUrl, '_blank');
    ElMessage.success('下载成功');
    
    // 刷新用户积分
    if (!isVip.value && resource.value!.pointsCost > 0) {
      await userStore.refreshUserInfo();
    }
  } catch (error: any) {
    ElMessage.error(error.message || '下载失败');
  }
}

function handleCollect() {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录');
    router.push('/login');
    return;
  }
  
  // 收藏逻辑
  resourceStore.collectResource(resource.value!.resourceId);
  ElMessage.success('收藏成功');
}

function goToPoints() {
  router.push('/points');
}

function previewImage(index: number) {
  // 图片预览逻辑
}
</script>

<style scoped lang="scss">
.resource-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  
  .detail-header {
    margin-bottom: 20px;
  }
  
  .detail-main {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 40px;
    margin-bottom: 40px;
    
    .detail-preview {
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        cursor: pointer;
      }
    }
    
    .detail-info {
      .detail-title {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      
      .detail-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .detail-stats {
        display: flex;
        gap: 24px;
        margin-bottom: 24px;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #666;
        }
      }
      
      .detail-points-info {
        margin-bottom: 24px;
        padding: 20px;
        border-radius: 8px;
        
        .vip-download-info {
          background: linear-gradient(135deg, #fff7e6, #ffe7ba);
          
          .vip-badge-large {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 18px;
            font-weight: 600;
            color: #fa8c16;
            margin-bottom: 12px;
          }
          
          .vip-text {
            .main-text {
              font-size: 16px;
              color: #333;
              margin-bottom: 4px;
            }
            
            .sub-text {
              font-size: 14px;
              color: #666;
            }
          }
        }
        
        .points-download-info {
          background: #f0f5ff;
          
          .points-required {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            
            .points-value {
              font-size: 32px;
              font-weight: 600;
              color: #165DFF;
            }
            
            .points-label {
              font-size: 16px;
              color: #666;
            }
          }
          
          .points-balance {
            font-size: 14px;
            color: #666;
            
            .balance-value {
              font-weight: 600;
              color: #165DFF;
            }
            
            .insufficient-tips {
              display: flex;
              align-items: center;
              gap: 4px;
              margin-top: 8px;
              color: #ff4d4f;
            }
          }
        }
        
        .free-download-info {
          background: #f6ffed;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          color: #52c41a;
          font-weight: 500;
        }
      }
      
      .detail-actions {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        
        .el-button {
          flex: 1;
        }
      }
      
      .points-tips {
        margin-bottom: 24px;
        
        .tips-content {
          p {
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          ul {
            margin: 0;
            padding-left: 20px;
            
            li {
              margin-bottom: 4px;
              font-size: 13px;
            }
          }
        }
      }
      
      .detail-file-info {
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;
        margin-bottom: 16px;
        
        .file-info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .label {
            color: #666;
          }
          
          .value {
            font-weight: 500;
            color: #333;
          }
        }
      }
      
      .detail-uploader {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;
        
        .uploader-info {
          .uploader-name {
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .uploader-desc {
            font-size: 12px;
            color: #999;
          }
        }
      }
    }
  }
  
  .detail-description {
    margin-bottom: 40px;
    
    h2 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    
    p {
      line-height: 1.8;
      color: #666;
    }
  }
  
  .detail-related {
    h2 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    
    .related-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }
  }
}
</style>
```
      </div>
    </div>
    
    <!-- 悬浮操作按钮 -->
    <div class="card-actions">
      <el-button type="primary" @click.stop="handleDownload">
        下载
      </el-button>
      <el-button @click.stop="handleCollect">
        收藏
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatFileSize } from '@/utils/format';
import { useDownload } from '@/composables/useDownload';

const props = defineProps<{
  resource: ResourceInfo;
}>();

const { handleDownload } = useDownload();

function goToDetail() {
  router.push(`/resource/${props.resource.resourceId}`);
}
</script>
```

### 5.2 后台管理组件

#### 5.2.1 侧边菜单组件 (AdminSidebar.vue)

```vue
<template>
  <el-aside :width="collapsed ? '64px' : '200px'" class="admin-sidebar">
    <!-- Logo区域 -->
    <div class="sidebar-logo">
      <img v-if="!collapsed" src="/logo.png" alt="Logo" />
      <img v-else src="/logo-mini.png" alt="Logo" />
    </div>
    
    <!-- 菜单列表 -->
    <el-menu
      :default-active="activeMenu"
      :collapse="collapsed"
      :unique-opened="true"
      router
    >
      <el-menu-item
        v-for="item in menuItems"
        v-show="hasPermission(item.permission)"
        :key="item.path"
        :index="item.path"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </el-menu>
    
    <!-- 折叠按钮 -->
    <div class="sidebar-toggle" @click="toggleCollapse">
      <el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/pinia/userStore';

const route = useRoute();
const userStore = useUserStore();
const collapsed = ref(false);

const activeMenu = computed(() => route.path);

const menuItems = [
  { path: '/admin/overview', title: '数据概览', icon: 'DataAnalysis', permission: 'statistics:view' },
  { path: '/admin/users', title: '用户管理', icon: 'User', permission: 'user:view' },
  { path: '/admin/resources', title: '资源管理', icon: 'Document', permission: 'resource:view' },
  { path: '/admin/audit', title: '内容审核', icon: 'Check', permission: 'audit:view' },
  { path: '/admin/categories', title: '分类管理', icon: 'Menu', permission: 'category:view' },
  { path: '/admin/statistics', title: '数据统计', icon: 'TrendCharts', permission: 'statistics:view' },
  { path: '/admin/operation', title: '内容运营', icon: 'Promotion', permission: 'banner:manage' },
  { path: '/admin/settings', title: '系统设置', icon: 'Setting', permission: 'settings:view' },
  { path: '/admin/permissions', title: '权限管理', icon: 'Lock', permission: 'permission:manage' },
];

function hasPermission(permission: string) {
  return userStore.hasPermission(permission);
}

function toggleCollapse() {
  collapsed.value = !collapsed.value;
}
</script>
```

#### 5.2.2 数据统计图表组件 (StatisticsChart.vue)

```vue
<template>
  <div class="statistics-chart">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps<{
  data: Array<{ date: string; count: number }>;
  title: string;
  type: 'line' | 'bar' | 'pie';
}>();

const chartRef = ref<HTMLElement>();
let chartInstance: echarts.ECharts;

onMounted(() => {
  initChart();
});

watch(() => props.data, () => {
  updateChart();
});

function initChart() {
  chartInstance = echarts.init(chartRef.value!);
  updateChart();
}

function updateChart() {
  const option = {
    title: {
      text: props.title,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: props.data.map(item => item.count),
      type: props.type,
      smooth: true,
      areaStyle: props.type === 'line' ? {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(22, 93, 255, 0.3)' },
          { offset: 1, color: 'rgba(22, 93, 255, 0)' }
        ])
      } : undefined
    }]
  };
  
  chartInstance.setOption(option);
}
</script>
```

## 6. 安全方案设计

### 6.1 认证安全

#### 6.1.1 JWT Token设计

```typescript
// Token结构
interface JWTPayload {
  userId: string;
  roleCode: string;
  permissions: string[];
  iat: number;  // 签发时间
  exp: number;  // 过期时间
}

// Token生成
function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.userId,
    roleCode: user.roleCode,
    permissions: user.permissions,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7天
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!);
}

// Token验证中间件
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ code: 401, msg: '未授权' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, msg: 'Token无效或已过期' });
  }
}
```

#### 6.1.2 密码加密

```typescript
import bcrypt from 'bcrypt';

// 密码加密
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// 密码验证
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

### 6.2 权限控制

#### 6.2.1 权限验证中间件

```typescript
// 权限验证中间件
function permissionMiddleware(requiredPermission: string) {
  return (req, res, next) => {
    const user = req.user as JWTPayload;
    
    if (!user) {
      return res.status(401).json({ code: 401, msg: '未授权' });
    }
    
    // 超级管理员拥有所有权限
    if (user.roleCode === 'super_admin') {
      return next();
    }
    
    // 检查用户是否有所需权限
    if (!user.permissions.includes(requiredPermission)) {
      return res.status(403).json({ code: 403, msg: '无权限' });
    }
    
    next();
  };
}

// 使用示例
router.get('/admin/users', 
  authMiddleware, 
  permissionMiddleware('user:view'), 
  getUserList
);
```

#### 6.2.2 前端权限控制

```typescript
// Pinia Store
export const useUserStore = defineStore('user', () => {
  const permissions = ref<string[]>([]);
  
  function hasPermission(permission: string): boolean {
    // 超级管理员拥有所有权限
    if (roleCode.value === 'super_admin') {
      return true;
    }
    
    return permissions.value.includes(permission);
  }
  
  return { permissions, hasPermission };
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const requiredPermission = to.meta.permission as string;
  
  if (requiredPermission && !userStore.hasPermission(requiredPermission)) {
    next('/403');
  } else {
    next();
  }
});

// 组件中使用
<el-button v-if="hasPermission('user:edit')" @click="editUser">
  编辑
</el-button>
```

### 6.3 XSS防护

```typescript
import xss from 'xss';
import DOMPurify from 'dompurify';

// 后端输入过滤
function sanitizeInput(input: string): string {
  return xss(input, {
    whiteList: {
      p: [],
      br: [],
      strong: [],
      em: []
    },
    stripIgnoreTag: true
  });
}

// 前端HTML净化
function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
    ALLOWED_ATTR: ['href', 'title']
  });
}
```

### 6.4 CSRF防护

```typescript
// 后端生成CSRF Token
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// 设置CSRF Token到Cookie
res.cookie('csrf_token', generateCSRFToken(), {
  httpOnly: false,
  secure: true,
  sameSite: 'strict'
});

// CSRF验证中间件
function csrfMiddleware(req, res, next) {
  const tokenFromCookie = req.cookies.csrf_token;
  const tokenFromHeader = req.headers['x-csrf-token'];
  
  if (!tokenFromCookie || tokenFromCookie !== tokenFromHeader) {
    return res.status(403).json({ code: 403, msg: 'CSRF Token验证失败' });
  }
  
  next();
}

// 前端Axios拦截器
axios.interceptors.request.use(config => {
  const csrfToken = Cookies.get('csrf_token');
  if (csrfToken) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;
  }
  return config;
});
```

### 6.5 文件上传安全

```typescript
// 文件验证
function validateFile(file: Express.Multer.File): { valid: boolean; message?: string } {
  // 验证文件扩展名
  const allowedExtensions = ['psd', 'ai', 'cdr', 'png', 'jpg', 'jpeg'];
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  
  if (!ext || !allowedExtensions.includes(ext)) {
    return { valid: false, message: '不支持的文件格式' };
  }
  
  // 验证MIME类型
  const allowedMimeTypes = [
    'image/vnd.adobe.photoshop',
    'application/postscript',
    'image/png',
    'image/jpeg'
  ];
  
  if (!allowedMimeTypes.some(type => file.mimetype.includes(type))) {
    return { valid: false, message: '文件类型不匹配' };
  }
  
  // 验证文件大小
  const maxSize = 1000 * 1024 * 1024; // 1000MB
  if (file.size > maxSize) {
    return { valid: false, message: '文件大小超出限制' };
  }
  
  return { valid: true };
}

// 文件名安全处理
function sanitizeFileName(fileName: string): string {
  // 移除路径分隔符和特殊字符
  return fileName
    .replace(/[\/\\]/g, '')
    .replace(/[<>:"|?*]/g, '')
    .substring(0, 255);
}
```

### 6.6 SQL注入防护

```typescript
// 使用Prisma ORM自动防护SQL注入
const users = await prisma.user.findMany({
  where: {
    phone: {
      contains: searchKeyword // Prisma会自动转义
    }
  }
});

// 如果使用原生SQL,必须使用参数化查询
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE phone LIKE ${`%${searchKeyword}%`}
`;
```

### 6.7 速率限制

```typescript
import rateLimit from 'express-rate-limit';

// API速率限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
  message: '请求过于频繁,请稍后再试'
});

// 登录速率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 15分钟内最多5次登录尝试
  message: '登录尝试次数过多,请15分钟后再试'
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
```


## 7. 部署架构设计

### 7.1 服务器架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户访问                               │
│                    https://example.com                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Nginx (反向代理)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SSL证书 + HTTPS强制 + Gzip压缩 + 静态资源缓存       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                ↓                           ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│      前端静态资源         │  │      后端API服务          │
│    (Vue 3 Build)         │  │    (Node.js + PM2)       │
│  /var/www/frontend/dist  │  │  http://localhost:3000   │
└──────────────────────────┘  └──────────────────────────┘
                                          ↓
                            ┌──────────────────────────┐
                            │    PostgreSQL数据库       │
                            │  localhost:5432          │
                            └──────────────────────────┘
                                          ↓
                            ┌──────────────────────────┐
                            │    Redis缓存/队列         │
                            │  localhost:6379          │
                            └──────────────────────────┘
```

### 7.2 Nginx配置

```nginx
# /etc/nginx/sites-available/startide-design

# HTTP自动跳转HTTPS
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS配置
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    
    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 安全响应头
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    
    # 前端静态资源
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API反向代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 大文件上传支持
        client_max_body_size 1000M;
        client_body_timeout 300s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # 文件上传目录
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

### 7.3 PM2配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'startide-backend',
    script: './dist/app.js',
    instances: 'max', // 使用所有CPU核心
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};

// 启动命令
// pm2 start ecosystem.config.js
// pm2 save
// pm2 startup
```

### 7.4 数据库初始化脚本

```sql
-- init.sql

-- 创建数据库
CREATE DATABASE startide_design;

-- 连接数据库
\c startide_design;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建所有表(参考3.1节的表结构)
-- ...

-- 插入初始数据
-- 1. 角色数据
INSERT INTO roles (role_name, role_code, description) VALUES
('超级管理员', 'super_admin', '拥有所有权限'),
('内容审核员', 'moderator', '负责内容审核'),
('运营人员', 'operator', '负责内容运营'),
('普通用户', 'user', '普通用户权限');

-- 2. 权限数据(参考3.1.3节)
-- ...

-- 3. 测试账号
-- 超级管理员: admin / admin123
INSERT INTO users (phone, password_hash, nickname, role_id) VALUES
('admin', '$2b$10$...', '超级管理员', (SELECT role_id FROM roles WHERE role_code = 'super_admin'));

-- 普通用户: test_user / 123456
INSERT INTO users (phone, password_hash, nickname, role_id) VALUES
('13800138000', '$2b$10$...', '测试用户', (SELECT role_id FROM roles WHERE role_code = 'user'));

-- VIP用户: test_vip / 123456
INSERT INTO users (phone, password_hash, nickname, vip_level, vip_expire_at, role_id) VALUES
('13800138001', '$2b$10$...', 'VIP测试用户', 1, '2025-12-31 23:59:59', (SELECT role_id FROM roles WHERE role_code = 'user'));

-- 4. 分类数据(参考3.1.6节)
-- ...

-- 5. 系统配置(参考3.1.12节)
-- ...
```

### 7.5 一键部署脚本

```bash
#!/bin/bash
# deploy.sh - 一键部署脚本

set -e

echo "========================================="
echo "星潮设计平台 - 一键部署脚本"
echo "========================================="

# 1. 检查环境
echo "1. 检查环境..."
command -v node >/dev/null 2>&1 || { echo "Node.js未安装"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm未安装"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "PostgreSQL未安装"; exit 1; }
command -v nginx >/dev/null 2>&1 || { echo "Nginx未安装"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "PM2未安装,正在安装..."; npm install -g pm2; }

# 2. 拉取代码
echo "2. 拉取最新代码..."
git pull origin main

# 3. 安装依赖
echo "3. 安装依赖..."
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 4. 构建前端
echo "4. 构建前端..."
cd frontend
npm run build
sudo rm -rf /var/www/frontend/dist
sudo mkdir -p /var/www/frontend
sudo cp -r dist /var/www/frontend/
cd ..

# 5. 构建后端
echo "5. 构建后端..."
cd backend
npm run build
cd ..

# 6. 初始化数据库
echo "6. 初始化数据库..."
read -p "是否需要初始化数据库?(y/n) " init_db
if [ "$init_db" = "y" ]; then
    sudo -u postgres psql -f scripts/init.sql
fi

# 7. 配置Nginx
echo "7. 配置Nginx..."
sudo cp scripts/nginx.conf /etc/nginx/sites-available/startide-design
sudo ln -sf /etc/nginx/sites-available/startide-design /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 8. 启动后端服务
echo "8. 启动后端服务..."
cd backend
pm2 delete startide-backend || true
pm2 start ecosystem.config.js
pm2 save
cd ..

# 9. 配置SSL证书(Let's Encrypt)
echo "9. 配置SSL证书..."
read -p "是否需要配置SSL证书?(y/n) " setup_ssl
if [ "$setup_ssl" = "y" ]; then
    read -p "请输入域名: " domain
    sudo certbot --nginx -d $domain -d www.$domain
fi

# 10. 配置自动备份
echo "10. 配置自动备份..."
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/scripts/backup.sh") | crontab -

echo "========================================="
echo "部署完成!"
echo "前端地址: https://your-domain.com"
echo "后端API: https://your-domain.com/api"
echo "========================================="
echo "测试账号:"
echo "超级管理员: admin / admin123"
echo "普通用户: test_user / 123456"
echo "VIP用户: test_vip / 123456"
echo "========================================="
```

### 7.6 备份脚本

```bash
#!/bin/bash
# backup.sh - 数据库自动备份脚本

BACKUP_DIR="/var/backups/startide-design"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="startide_design"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
echo "开始备份数据库..."
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 备份上传文件
echo "开始备份上传文件..."
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/uploads/

# 删除7天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR"
```

### 7.7 监控和日志

```bash
# 查看后端日志
pm2 logs startide-backend

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看系统资源
pm2 monit

# 重启服务
pm2 restart startide-backend

# 查看服务状态
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
```

## 8. 总结

本设计文档详细说明了系统的架构设计、数据库设计、API接口设计、前端组件设计、安全方案设计和部署架构设计。

**核心设计要点:**

1. **前后端分离**: 前端Vue 3 + 后端Node.js,通过RESTful API通信
2. **权限控制**: 基于RBAC的完善权限系统
3. **安全防护**: JWT认证、XSS防护、CSRF防护、SQL注入防护
4. **性能优化**: Nginx反向代理、Redis缓存、CDN加速
5. **易于部署**: 一键部署脚本、自动备份、PM2进程守护
6. **VIP系统**: 完善的VIP套餐管理和特权配置
7. **积分系统**: 多维度积分获取和消耗机制,支持积分兑换VIP

**技术亮点:**

- 使用PostgreSQL关系型数据库,支持复杂查询
- 使用Prisma ORM,类型安全且防SQL注入
- 使用Redis缓存热点数据,提升性能
- 使用PM2集群模式,充分利用多核CPU
- 使用Let's Encrypt免费SSL证书
- 完善的监控和日志系统

**VIP和积分系统设计亮点:**

1. **积分消耗透明化**
   - 资源卡片和详情页清晰展示积分消耗
   - 仅登录用户可见,保护未登录用户体验
   - VIP用户显示"免费下载"标识
   - 普通用户显示具体积分消耗数值
   - 积分不足时提供获取积分的引导

2. **用户体验优化**
   - 下载前积分余额检查
   - 积分不足时显示差额提示
   - 提供多种积分获取途径说明
   - 一键跳转到积分充值/获取页面
   - 下载确认对话框显示积分消耗

3. **VIP特权展示**
   - VIP用户享受免费下载特权
   - 醒目的VIP标识和特权说明
   - VIP到期提醒机制
   - VIP续费引导

4. **积分系统完整性**
   - 10种积分获取方式
   - 3种资源下载积分消耗等级
   - 积分兑换VIP和实物商品
   - 每日任务系统增加用户粘性
   - 用户等级系统(LV1-LV6)
   - 等级特权(下载折扣5%-30%)

5. **数据安全**
   - 积分变动记录完整追溯
   - 防止积分刷取机制
   - 积分交易日志记录
   - 管理员积分调整权限控制

**下一步:**

根据本设计文档创建详细的任务清单(tasks.md),按照优先级逐步实现各个功能模块。
