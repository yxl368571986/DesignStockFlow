# 需求文档 - 设计资源下载平台

## 简介

**星潮设计**是一个面向设计师和创意工作者的在线资源分享平台，类似昵图网。用户可以浏览、搜索、下载各类设计资源（PSD、AI、CDR等格式），支持资源上传、VIP会员体系、在线支付等功能。平台注重界面美观、操作便捷、安全高效。

## 品牌信息

- **网站名称**: 星潮设计
- **英文名称**: StarTide Design（可选）
- **品牌定位**: 专业、创意、潮流
- **品牌色**: 主色调蓝色 #165DFF（专业）+ 辅助色橙色 #FF7D00（活力）
- **Logo要求**: 包含"星潮设计"文字标识，可搭配星星或波浪图形元素

## 技术栈选型

### 核心技术栈（严格遵守）

| 技术类别 | 具体选型 | 版本要求 | 选型理由 |
|---------|---------|---------|---------|
| **基础框架** | Vue 3 + Vite 5 + TypeScript 5.x | Vue 3.4+, Vite 5.0+, TS 5.3+ | Vue 3 Composition API提供更好的代码组织和类型推断；Vite极速热更新；TypeScript强类型约束减少运行时错误 |
| **状态管理** | Pinia 2.x | Pinia 2.1+ | 轻量级、原生TypeScript支持、DevTools调试友好 |
| **UI组件库** | Element Plus + Tailwind CSS 3.x | Element Plus 2.5+, Tailwind 3.4+ | Element Plus提供企业级组件；Tailwind实现快速样式定制 |
| **路由管理** | Vue Router 4.x | Vue Router 4.2+ | 支持路由守卫、动态路由、TypeScript类型安全 |
| **网络请求** | Axios 1.x + axios-retry | Axios 1.6+, axios-retry 4.0+ | 拦截器机制、请求重试、取消重复请求 |
| **安全防护** | xss + DOMPurify + js-cookie | 最新稳定版 | XSS过滤、HTML净化、安全Cookie操作 |
| **表单验证** | VeeValidate 4.x / 自定义验证 | VeeValidate 4.12+ | 强大的表单验证、异步验证支持 |
| **图片懒加载** | vue3-lazy / Intersection Observer API | - | 性能优化、减少初始加载 |
| **进度条** | nprogress | 0.2+ | 页面加载进度反馈 |
| **加密工具** | crypto-js | 4.2+ | 密码加密、敏感数据加密传输 |
| **日期处理** | dayjs | 1.11+ | 轻量级日期处理库 |
| **代码规范** | ESLint + Prettier | ESLint 8.x, Prettier 3.x | 代码质量保证、统一代码风格 |
| **PWA支持** | Workbox + vite-plugin-pwa | Workbox 7.0+, vite-plugin-pwa 0.17+ | Service Worker、离线缓存、应用安装 |
| **移动端适配** | postcss-px-to-viewport / amfe-flexible | 最新稳定版 | 移动端rem/vw适配方案 |
| **手势库** | @vueuse/gesture（可选）| 最新稳定版 | 移动端手势操作（滑动、缩放） |
| **虚拟滚动** | vue-virtual-scroller | 2.0+ | 长列表性能优化 |

### 开发工具链

- **包管理器**: pnpm（推荐）或 npm
- **Git Hooks**: husky + lint-staged（提交前代码检查）
- **CSS预处理器**: Sass/SCSS（可选，Tailwind为主）
- **构建优化**: Vite插件生态（压缩、分析、CDN）
- **PWA工具**: Workbox（Service Worker管理）
- **移动端调试**: vConsole（移动端调试工具）
- **性能监控**: web-vitals（核心Web指标监控）

## 术语表

### 业务术语

- **System**: 设计资源下载平台系统（星潮设计）
- **Brand_Name**: 品牌名称"星潮设计"，英文名称"StarTide Design"
- **Watermark**: 水印，在资源预览图上添加的半透明品牌标识，包含"星潮设计"文字和资源ID，用于防止盗图
- **User**: 平台用户（包括普通用户、VIP用户、上传者）
- **Resource**: 设计资源文件（PSD、AI、CDR等格式）
- **Supported_Format**: 系统支持的文件格式，包括：PSD（Photoshop）、AI（Illustrator）、CDR（CorelDRAW）、EPS（封装PostScript）、SKETCH（Sketch设计文件）、XD（Adobe XD）、FIGMA（Figma设计文件）、SVG（矢量图）、PNG（位图）、JPG/JPEG（位图）、WEBP（位图）
- **VIP_User**: 付费会员用户
- **Admin**: 平台管理员
- **Upload_Module**: 资源上传模块
- **Download_Module**: 资源下载模块
- **Auth_Module**: 用户认证授权模块
- **Payment_Module**: 支付模块
- **Chunk_Upload**: 分片上传，将大文件分割成多个小块分别上传，适用于大于100MB的文件
- **Content_Audit_Module**: 内容审核模块，使用AI技术自动审核上传内容是否包含违规信息（色情、政治敏感、暴力等）
- **Preview_Generator**: 预览图生成器，将设计文件（PSD/AI/CDR等）转换为可在网页展示的预览图（PNG/JPG/WEBP）
- **Audit_Status**: 审核状态，0-待审核、1-审核通过、2-审核驳回

### 安全术语

- **XSS**: 跨站脚本攻击（Cross-Site Scripting），攻击者在网页中注入恶意脚本，前端使用xss库和DOMPurify进行防护
- **CSRF**: 跨站请求伪造（Cross-Site Request Forgery），攻击者诱导用户执行非预期操作，前端通过CSRF Token防护
- **Token**: 用户认证令牌，存储在HttpOnly Cookie中，每次请求携带在Authorization请求头
- **HttpOnly_Cookie**: 只能通过HTTP协议访问的Cookie，JavaScript无法读取，防止XSS窃取Token
- **HTTPS**: 超文本传输安全协议，加密传输数据，防止中间人攻击
- **CSP**: 内容安全策略（Content Security Policy），限制网页可以加载的资源来源，防止XSS攻击
- **DOMPurify**: HTML净化库，移除危险的HTML标签和属性，防止XSS攻击
- **SHA256**: 安全哈希算法，用于密码加密，单向不可逆
- **Salt**: 密码加盐，在密码加密前添加随机字符串，增强安全性
- **MIME_Type**: 多用途互联网邮件扩展类型，用于标识文件类型，前端验证上传文件的MIME类型
- **Whitelist**: 白名单机制，只允许明确列出的安全项通过，用于文件格式验证、HTML标签过滤等

### 移动端与PWA术语

- **PWA**: 渐进式Web应用（Progressive Web App），具备离线访问、应用安装、推送通知等原生应用特性的Web应用
- **Service_Worker**: 服务工作线程，运行在浏览器后台的脚本，用于实现离线缓存、推送通知、后台同步等功能
- **Cache_API**: 浏览器缓存API，用于存储和检索网络请求的响应，实现离线访问
- **IndexedDB**: 浏览器端的NoSQL数据库，用于存储大量结构化数据，支持离线数据存储
- **Viewport**: 视口，移动设备上网页的可视区域，通过meta标签配置缩放和宽度
- **Touch_Event**: 触摸事件，移动设备上的触摸交互事件（touchstart、touchmove、touchend）
- **Responsive_Design**: 响应式设计，网页根据不同设备屏幕尺寸自动调整布局和样式
- **Mobile_First**: 移动优先设计策略，先设计移动端界面，再扩展到桌面端
- **Lazy_Load**: 懒加载，延迟加载页面资源（图片、组件），提升首屏加载速度
- **Pull_to_Refresh**: 下拉刷新，移动端常见交互模式，用户下拉页面顶部触发内容刷新
- **Infinite_Scroll**: 无限滚动，用户滚动到页面底部自动加载更多内容
- **Haptic_Feedback**: 触觉反馈，通过设备震动提供操作反馈，增强交互体验
- **Offline_First**: 离线优先策略，优先使用本地缓存数据，网络可用时同步更新

## 需求

### 需求 1：用户认证与授权

**用户故事：** 作为用户，我希望能够安全地注册、登录和管理我的账户，以便访问平台功能和保护我的个人信息。

#### 验收标准

1. WHEN 用户提交注册信息（手机号、短信验证码、密码）THEN THE System SHALL 验证信息格式并创建用户账户
2. WHEN 用户选择密码登录方式 THEN THE System SHALL 验证账号密码并返回认证令牌
3. WHEN 用户选择短信验证码登录方式 THEN THE System SHALL 发送验证码并验证后返回认证令牌
4. WHEN 用户点击获取短信验证码 THEN THE System SHALL 验证手机号格式并在60秒内发送验证码
5. WHEN 用户选择第三方登录（微信/QQ）THEN THE System SHALL 跳转到第三方授权页面并完成授权登录
6. WHEN 用户勾选"记住密码"选项 THEN THE System SHALL 加密存储登录凭证并保持7天有效期
7. WHEN 用户的认证令牌过期 THEN THE System SHALL 清除令牌并跳转到登录页面
8. WHEN 用户输入密码 THEN THE System SHALL 实时显示密码强度（弱/中/强）

### 需求 2：资源浏览与搜索

**用户故事：** 作为用户，我希望能够快速找到我需要的设计资源，以便提高工作效率。

#### 验收标准

1. WHEN 未登录用户访问首页 THEN THE System SHALL 允许访问并展示轮播图、分类入口、热门资源、新品推荐和VIP专属资源区
2. WHEN 未登录用户浏览资源列表 THEN THE System SHALL 允许查看所有资源卡片信息
3. WHEN 用户在搜索框输入关键词 THEN THE System SHALL 实时显示关键词联想列表
4. WHEN 用户提交搜索请求 THEN THE System SHALL 返回匹配的资源列表并支持分页展示
5. WHEN 用户选择筛选条件（分类、格式、尺寸、排序方式）THEN THE System SHALL 根据条件过滤资源列表
6. WHEN 用户点击资源卡片 THEN THE System SHALL 跳转到资源详情页面（无需登录）
7. WHEN 用户滚动页面到资源图片可视区域 THEN THE System SHALL 懒加载图片资源
8. WHEN 用户鼠标悬浮在资源卡片上 THEN THE System SHALL 放大卡片1.02倍并显示快速操作按钮
9. WHEN 用户点击分类快捷入口 THEN THE System SHALL 筛选并展示该分类下的所有资源

### 需求 3：资源详情与下载

**用户故事：** 作为用户，我希望能够查看资源的详细信息并下载所需资源，以便在我的项目中使用。

#### 验收标准

1. WHEN 用户访问资源详情页 THEN THE System SHALL 展示资源预览图、标题、描述、格式、大小、下载次数、上传者信息
2. WHEN 用户点击预览图 THEN THE System SHALL 放大显示图片并支持再次点击关闭
3. WHEN 未登录用户点击下载按钮 THEN THE System SHALL 弹出确认对话框提示"您需要登录后才能下载资源，是否前往登录？"
4. WHEN 未登录用户在确认对话框点击"确定" THEN THE System SHALL 跳转到登录页面
5. WHEN 未登录用户在确认对话框点击"取消" THEN THE System SHALL 关闭对话框并保持用户停留在当前页面
6. WHEN 已登录的普通用户点击下载按钮 THEN THE System SHALL 验证下载次数限制
7. WHEN 已登录的VIP用户点击下载按钮 THEN THE System SHALL 直接触发下载并显示下载进度
8. WHEN 普通用户下载次数超出限制 THEN THE System SHALL 弹出VIP开通弹窗提示"您的免费下载次数已用完，开通VIP享受无限下载"
9. WHEN 非VIP用户点击VIP专属资源下载按钮 THEN THE System SHALL 弹出VIP开通弹窗展示套餐价格
10. WHEN 下载完成 THEN THE System SHALL 显示"下载成功"提示并记录下载历史

### 需求 4：资源上传与管理

**用户故事：** 作为内容创作者，我希望能够上传和管理我的设计资源，以便分享给其他用户并获得收益。

#### 验收标准

1. WHEN 用户拖拽文件到上传区域 THEN THE System SHALL 自动识别并开始上传流程
2. WHEN 用户选择文件上传 THEN THE System SHALL 验证文件格式是否为允许的设计格式（PSD、AI、CDR、EPS、SKETCH、XD、FIGMA、SVG、PNG、JPG、WEBP）
3. WHEN 用户上传不支持的文件格式 THEN THE System SHALL 显示错误提示"仅支持设计文件格式：PSD/AI/CDR/EPS/SKETCH/XD/FIGMA/SVG/PNG/JPG/WEBP"
4. WHEN 用户上传的文件大小超过1000MB THEN THE System SHALL 显示错误提示"单个文件大小不能超过1000MB"
5. WHEN 文件大小超过100MB THEN THE System SHALL 自动启用分片上传功能
6. WHEN 分片上传过程中 THEN THE System SHALL 支持暂停、继续和断点续传
7. WHEN 文件格式和大小校验通过 THEN THE System SHALL 显示上传进度并开始上传
8. WHEN 文件上传完成 THEN THE System SHALL 自动生成文件预览图
9. WHEN 预览图生成完成 THEN THE System SHALL 要求用户填写资源标题、分类、标签、描述等元信息
10. WHEN 用户提交资源 THEN THE System SHALL 自动提交到AI内容审核系统
11. WHEN AI审核进行中 THEN THE System SHALL 显示"正在审核中，通常在几分钟内完成"提示
12. WHEN AI审核通过 THEN THE System SHALL 自动上架资源并通知用户"您的资源已审核通过并上架"
13. WHEN AI审核驳回 THEN THE System SHALL 通知用户并显示具体驳回原因
14. WHEN 用户访问"我的上传"页面 THEN THE System SHALL 展示所有上传资源及其审核状态（待审核/已通过/已驳回）
15. WHEN 资源处于待审核或已驳回状态 THEN THE System SHALL 允许用户编辑或删除该资源
16. WHEN 资源已审核通过 THEN THE System SHALL 不允许删除，仅允许编辑元信息（不能更换文件）
17. WHEN 后端接收到上传文件 THEN THE System SHALL 再次验证文件格式和大小（双重校验）

### 需求 5：个人中心管理

**用户故事：** 作为用户，我希望能够管理我的个人信息、查看下载记录和管理上传资源，以便更好地使用平台服务。

#### 验收标准

1. WHEN 用户访问个人中心 THEN THE System SHALL 展示个人信息、下载记录、我的上传、VIP中心、安全设置等功能入口
2. WHEN 用户上传头像 THEN THE System SHALL 提供图片裁剪功能并保存头像
3. WHEN 用户修改昵称 THEN THE System SHALL 验证昵称格式并更新用户信息
4. WHEN 用户修改密码 THEN THE System SHALL 验证旧密码并要求确认新密码
5. WHEN 用户访问下载记录 THEN THE System SHALL 按时间倒序展示所有下载过的资源
6. WHEN 用户在下载记录中点击资源 THEN THE System SHALL 支持再次下载该资源
7. WHEN 用户访问VIP中心 THEN THE System SHALL 显示当前VIP等级、到期时间和续费入口
8. WHEN 用户绑定邮箱 THEN THE System SHALL 发送验证邮件并完成绑定

### 需求 6：VIP会员体系

**用户故事：** 作为用户，我希望能够购买VIP会员以获得更多下载权限和特权，以便更高效地使用平台资源。

#### 验收标准

1. WHEN 用户访问VIP会员页 THEN THE System SHALL 展示所有VIP套餐（月度/季度/年度）及其价格和权益
2. WHEN 用户选择VIP套餐 THEN THE System SHALL 高亮显示选中的套餐卡片
3. WHEN 用户选择支付方式（微信/支付宝）THEN THE System SHALL 生成支付二维码
4. WHEN 支付二维码生成后 THEN THE System SHALL 显示倒计时并在过期后支持刷新
5. WHEN 用户完成支付 THEN THE System SHALL 自动刷新VIP状态并显示成功提示
6. WHEN 支付失败 THEN THE System SHALL 提示"支付失败，请重新尝试"并支持重新支付
7. WHEN VIP用户访问VIP专属资源 THEN THE System SHALL 允许直接下载
8. WHEN VIP到期 THEN THE System SHALL 降级为普通用户权限

### 需求 7：前端安全防护（严格执行）

**用户故事：** 作为系统管理员，我希望前端具备完善的安全防护机制，以便保护用户数据、防止常见Web攻击、确保系统安全。

#### 验收标准

**A. XSS（跨站脚本攻击）防护**

1. WHEN 用户在任何输入框输入内容 THEN THE System SHALL 使用xss库过滤所有用户输入
2. WHEN 系统渲染用户生成的内容（评论、描述等）THEN THE System SHALL 使用DOMPurify净化HTML
3. WHEN 系统使用v-html指令 THEN THE System SHALL 先通过DOMPurify.sanitize()处理内容
4. WHEN 系统拼接URL参数 THEN THE System SHALL 使用encodeURIComponent()编码
5. WHEN 系统处理富文本内容 THEN THE System SHALL 使用白名单机制只允许安全标签和属性

**B. CSRF（跨站请求伪造）防护**

6. WHEN 系统发起任何API请求 THEN THE System SHALL 在请求头中携带CSRF Token
7. WHEN 页面加载时 THEN THE System SHALL 从Cookie中读取CSRF Token并存储到内存
8. WHEN Token不存在或过期 THEN THE System SHALL 拒绝发送请求并提示用户刷新页面

**C. 认证与授权安全**

9. WHEN 用户登录成功 THEN THE System SHALL 将Token存储在HttpOnly Cookie中（不使用localStorage）
10. WHEN Token过期（后端返回401）THEN THE System SHALL 立即清除Token并跳转登录页
11. WHEN 用户输入密码 THEN THE System SHALL 使用crypto-js进行SHA256加密后再传输
12. WHEN 用户点击"记住密码" THEN THE System SHALL 加密存储凭证并设置7天有效期
13. WHEN 未登录用户访问受保护页面 THEN THE System SHALL 通过路由守卫拦截并跳转登录页
14. WHEN 非VIP用户访问VIP资源 THEN THE System SHALL 通过权限校验拦截并提示开通VIP

**D. 敏感信息保护**

15. WHEN 系统显示手机号 THEN THE System SHALL 部分隐藏中间数字（如138****1234）
16. WHEN 系统显示邮箱 THEN THE System SHALL 部分隐藏用户名（如abc***@example.com）
17. WHEN 系统显示身份证号 THEN THE System SHALL 只显示前4位和后4位
18. WHEN 用户输入密码 THEN THE System SHALL 使用type="password"并支持显示/隐藏切换
19. WHEN 系统打印日志 THEN THE System SHALL 过滤敏感信息（密码、Token等）

**E. 文件上传安全**

20. WHEN 用户上传文件 THEN THE System SHALL 验证文件扩展名白名单（仅允许设计文件格式）
21. WHEN 用户上传文件 THEN THE System SHALL 验证文件MIME类型
22. WHEN 用户上传文件 THEN THE System SHALL 限制文件大小（单个≤1000MB）
23. WHEN 用户上传文件 THEN THE System SHALL 生成随机文件名（不使用原始文件名）
24. WHEN 用户上传文件 THEN THE System SHALL 在前端和后端双重校验

**F. 点击劫持防护**

25. WHEN 系统部署上线 THEN THE System SHALL 配置X-Frame-Options响应头（DENY或SAMEORIGIN）
26. WHEN 系统使用iframe THEN THE System SHALL 仅允许同源iframe

**G. 内容安全策略（CSP）**

27. WHEN 系统加载外部资源 THEN THE System SHALL 配置Content-Security-Policy响应头
28. WHEN 系统使用CDN THEN THE System SHALL 在CSP中明确允许的CDN域名
29. WHEN 系统执行脚本 THEN THE System SHALL 禁止内联脚本（使用nonce或hash）

**H. 请求安全**

30. WHEN 系统发起请求 THEN THE System SHALL 使用HTTPS协议（生产环境强制）
31. WHEN 系统处理API响应 THEN THE System SHALL 验证响应数据格式和类型
32. WHEN 系统遇到异常响应 THEN THE System SHALL 统一错误处理，不暴露敏感信息
33. WHEN 用户快速点击按钮 THEN THE System SHALL 防抖处理，避免重复请求

**I. 前端代码安全**

34. WHEN 系统构建打包 THEN THE System SHALL 移除console.log和debugger语句
35. WHEN 系统构建打包 THEN THE System SHALL 混淆和压缩JavaScript代码
36. WHEN 系统使用环境变量 THEN THE System SHALL 不在前端代码中硬编码敏感配置
37. WHEN 系统使用第三方库 THEN THE System SHALL 定期检查依赖漏洞（npm audit）

**J. 会话安全**

38. WHEN 用户长时间无操作（30分钟）THEN THE System SHALL 自动退出登录
39. WHEN 用户在多个标签页登录 THEN THE System SHALL 同步登录状态
40. WHEN 用户退出登录 THEN THE System SHALL 清除所有本地存储的敏感数据

### 需求 8：性能优化

**用户故事：** 作为用户，我希望系统响应快速、加载流畅，以便获得良好的使用体验。

#### 验收标准

1. WHEN 页面加载图片资源 THEN THE System SHALL 使用懒加载技术延迟加载
2. WHEN 系统请求热门资源或分类列表 THEN THE System SHALL 使用缓存机制（有效期30分钟）
3. WHEN 用户快速切换分页 THEN THE System SHALL 取消重复的API请求
4. WHEN 系统加载静态资源 THEN THE System SHALL 通过CDN分发资源
5. WHEN 系统打包构建 THEN THE System SHALL 启用Gzip压缩
6. WHEN 页面渲染长列表 THEN THE System SHALL 使用虚拟滚动技术
7. WHEN 用户上传大文件 THEN THE System SHALL 显示上传进度条
8. WHEN 用户下载大文件 THEN THE System SHALL 显示下载进度条

### 需求 9：响应式设计与移动端优化

**用户故事：** 作为用户，我希望能够在不同设备上流畅使用平台，特别是在手机上也能获得良好的浏览和操作体验。

#### 验收标准

**A. 响应式布局**

1. WHEN 用户在移动端访问（<768px）THEN THE System SHALL 展示单列布局
2. WHEN 用户在平板访问（768px-1200px）THEN THE System SHALL 展示双列布局
3. WHEN 用户在桌面端访问（>1200px）THEN THE System SHALL 展示四列布局
4. WHEN 用户在移动端访问 THEN THE System SHALL 隐藏侧边分类栏并显示底部Tab栏
5. WHEN 用户在移动端浏览资源卡片 THEN THE System SHALL 设置卡片宽度为100%并优化间距

**B. 移动端导航优化**

6. WHEN 用户在移动端访问 THEN THE System SHALL 显示汉堡菜单图标（左上角）
7. WHEN 用户点击汉堡菜单 THEN THE System SHALL 从左侧滑出导航抽屉
8. WHEN 用户在移动端点击搜索图标 THEN THE System SHALL 弹出全屏搜索页面
9. WHEN 用户在移动端浏览 THEN THE System SHALL 显示底部固定Tab栏（首页、分类、上传、我的）
10. WHEN 用户在移动端滚动页面 THEN THE System SHALL 自动隐藏顶部导航栏（向下滚动时）并在向上滚动时显示

**C. 移动端交互优化**

11. WHEN 用户在移动端点击资源卡片 THEN THE System SHALL 提供触觉反馈（vibration API）
12. WHEN 用户在移动端长按资源卡片 THEN THE System SHALL 显示快捷操作菜单（下载、收藏、分享）
13. WHEN 用户在移动端双击图片 THEN THE System SHALL 放大图片查看
14. WHEN 用户在移动端使用手势 THEN THE System SHALL 支持左右滑动切换图片
15. WHEN 用户在移动端下拉页面顶部 THEN THE System SHALL 触发下拉刷新
16. WHEN 用户在移动端上拉页面底部 THEN THE System SHALL 自动加载更多内容

**D. 移动端表单优化**

17. WHEN 用户在移动端填写表单 THEN THE System SHALL 使用合适的输入类型（tel、email、number）
18. WHEN 用户在移动端输入 THEN THE System SHALL 自动弹出对应的键盘类型
19. WHEN 用户在移动端上传文件 THEN THE System SHALL 支持调用相机拍照或从相册选择
20. WHEN 用户在移动端填写长表单 THEN THE System SHALL 自动保存草稿（防止误关闭丢失）

**E. 移动端性能优化**

21. WHEN 用户在移动端访问 THEN THE System SHALL 优先加载关键内容（首屏优化）
22. WHEN 用户在移动端浏览图片 THEN THE System SHALL 加载适配移动端尺寸的图片（减少流量消耗）
23. WHEN 用户在移动端使用弱网络 THEN THE System SHALL 显示加载进度和网络状态提示
24. WHEN 用户在移动端切换页面 THEN THE System SHALL 使用页面过渡动画（提升体验）

**F. 移动端适配细节**

25. WHEN 用户在移动端访问 THEN THE System SHALL 设置viewport meta标签（禁止缩放）
26. WHEN 用户在移动端点击链接 THEN THE System SHALL 移除300ms点击延迟
27. WHEN 用户在移动端浏览 THEN THE System SHALL 使用更大的触摸目标（最小44x44px）
28. WHEN 用户在移动端横屏浏览 THEN THE System SHALL 自动调整布局适配横屏模式
29. WHEN 用户在移动端访问 THEN THE System SHALL 隐藏浏览器地址栏（全屏沉浸式体验）
30. WHEN 页面滚动超过500px THEN THE System SHALL 显示返回顶部按钮（移动端右下角悬浮）

### 需求 10：内容审核展示（前端）

**用户故事：** 作为用户，我希望能够看到我上传资源的审核状态和结果，以便了解资源是否可以正常展示。

#### 验收标准

1. WHEN 用户上传文件并提交 THEN THE System SHALL 显示"正在审核中"的状态提示
2. WHEN 前端轮询审核状态（每5秒查询一次）THEN THE System SHALL 调用后端接口获取最新审核状态
3. WHEN 后端返回审核通过（isAudit: 1）THEN THE System SHALL 显示"审核通过"并提示用户资源已上架
4. WHEN 后端返回审核驳回（isAudit: 2）THEN THE System SHALL 显示"审核未通过"和具体驳回原因
5. WHEN 用户在"我的上传"页面查看资源 THEN THE System SHALL 显示审核状态标签（待审核/已通过/已驳回）
6. WHEN 审核驳回原因为"色情内容" THEN THE System SHALL 显示红色警告标签和修改建议
7. WHEN 审核驳回原因为"政治敏感" THEN THE System SHALL 显示红色警告标签和修改建议
8. WHEN 审核通过的资源 THEN THE System SHALL 在首页、列表页、详情页正常展示
9. WHEN 审核未通过的资源 THEN THE System SHALL 仅在上传者的"我的上传"页面显示
10. WHEN 用户点击被驳回的资源 THEN THE System SHALL 显示详细的驳回原因和重新上传按钮

**注意：** AI审核、文件转换等处理逻辑由后端实现，前端只负责展示审核结果。

### 需求 11：文件预览展示（前端）

**用户故事：** 作为用户，我希望能够在下载前预览设计文件的内容，以便判断是否符合我的需求。

#### 验收标准

1. WHEN 前端调用资源详情接口 THEN THE System SHALL 接收后端返回的预览图URL数组（previewImages字段）
2. WHEN 预览图URL为空 THEN THE System SHALL 显示默认占位图
3. WHEN 预览图有多张 THEN THE System SHALL 使用轮播组件展示所有预览图
4. WHEN 用户点击预览图 THEN THE System SHALL 放大显示图片（全屏查看模式）
5. WHEN 用户在全屏模式点击图片 THEN THE System SHALL 关闭全屏并返回详情页
6. WHEN 预览图加载 THEN THE System SHALL 先显示模糊的缩略图，再加载高清图（渐进式加载）
7. WHEN 预览图滚动到可视区域 THEN THE System SHALL 才开始加载图片（懒加载）
8. WHEN 资源列表展示卡片 THEN THE System SHALL 使用后端返回的封面图（cover字段）
9. WHEN 用户鼠标悬浮在资源卡片 THEN THE System SHALL 显示快速预览效果
10. WHEN 预览图加载失败 THEN THE System SHALL 显示"图片加载失败"占位图

**注意：** 预览图生成、格式转换、水印添加等由后端实现，前端只负责展示后端返回的图片URL。

### 需求 12：前后端接口约定

**用户故事：** 作为前端开发者，我希望有清晰的API接口定义，以便前端能够正确调用后端服务并处理响应数据。

#### 验收标准

1. WHEN 前端调用任何API接口 THEN THE System SHALL 使用统一的响应格式 `{ code: number, msg: string, data: any, timestamp: number }`
2. WHEN API调用成功 THEN THE System SHALL 返回 `code: 200` 和相应的数据
3. WHEN API调用失败 THEN THE System SHALL 返回非200的错误码和错误信息
4. WHEN 前端上传文件 THEN THE System SHALL 调用 `POST /api/upload/chunk` 接口（后端负责接收、存储、生成预览图、AI审核）
5. WHEN 前端查询审核状态 THEN THE System SHALL 调用 `GET /api/upload/list` 接口获取资源列表及审核状态
6. WHEN 后端完成AI审核 THEN THE System SHALL 在资源数据中返回 `isAudit` 字段（0-待审核、1-已通过、2-已驳回）
7. WHEN 审核驳回 THEN THE System SHALL 在 `auditMsg` 字段返回驳回原因（如"检测到违规内容：色情"）
8. WHEN 前端请求资源详情 THEN THE System SHALL 调用 `GET /api/resource/detail/:id` 接口，后端返回预览图URL数组
9. WHEN 前端展示预览图 THEN THE System SHALL 使用后端返回的 `previewImages` 字段（已经是处理好的CDN链接）
10. WHEN 前端需要下载文件 THEN THE System SHALL 调用 `POST /api/resource/download` 接口，后端返回带时效签名的下载链接
11. WHEN 前端发起请求 THEN THE System SHALL 在请求头自动携带 `Authorization: Bearer {token}`
12. WHEN Token过期（后端返回401）THEN THE System SHALL 自动清除Token并跳转登录页

**前端职责：**
- 界面展示和用户交互
- 表单验证（格式、大小等前置校验）
- 调用后端API接口
- 处理API响应并展示结果
- 文件分片上传逻辑

**后端职责（接口需实现）：**
- 文件接收和存储
- 文件预览图生成（PSD/AI/CDR → PNG/JPG）
- AI内容审核（调用第三方服务）
- 审核结果处理和通知
- 返回处理好的预览图CDN链接

### 需求 13：代码质量与规范

**用户故事：** 作为开发团队成员，我希望代码遵循严格的规范和最佳实践，以便提高代码质量、可维护性和安全性。

#### 验收标准

**A. TypeScript类型安全**

1. WHEN 编写任何函数 THEN THE System SHALL 明确定义参数类型和返回值类型
2. WHEN 定义接口响应 THEN THE System SHALL 使用TypeScript interface定义数据结构
3. WHEN 使用any类型 THEN THE System SHALL 必须添加注释说明原因（尽量避免使用any）
4. WHEN 编译代码 THEN THE System SHALL 启用strict模式（tsconfig.json中strict: true）
5. WHEN 使用第三方库 THEN THE System SHALL 安装对应的@types类型定义包

**B. 代码风格规范**

6. WHEN 编写代码 THEN THE System SHALL 遵循ESLint规则（无警告、无错误）
7. WHEN 提交代码 THEN THE System SHALL 通过Prettier格式化（统一缩进、引号、分号）
8. WHEN 命名变量 THEN THE System SHALL 使用驼峰命名法（camelCase）
9. WHEN 命名组件 THEN THE System SHALL 使用帕斯卡命名法（PascalCase）
10. WHEN 命名常量 THEN THE System SHALL 使用大写下划线命名法（UPPER_SNAKE_CASE）

**C. 组件设计规范**

11. WHEN 创建组件 THEN THE System SHALL 遵循单一职责原则（一个组件只做一件事）
12. WHEN 组件超过300行 THEN THE System SHALL 拆分为更小的子组件
13. WHEN 定义Props THEN THE System SHALL 使用TypeScript interface并添加默认值
14. WHEN 定义Emits THEN THE System SHALL 明确声明事件名称和参数类型
15. WHEN 使用Composition API THEN THE System SHALL 将可复用逻辑提取到composables

**D. 性能优化规范**

16. WHEN 渲染列表 THEN THE System SHALL 使用v-for的key属性（使用唯一ID）
17. WHEN 组件不需要响应式 THEN THE System SHALL 使用shallowRef或markRaw
18. WHEN 计算属性依赖多个值 THEN THE System SHALL 使用computed而非watch
19. WHEN 组件卸载 THEN THE System SHALL 清理定时器、事件监听器、订阅
20. WHEN 使用大型第三方库 THEN THE System SHALL 按需引入（tree-shaking）

**E. 错误处理规范**

21. WHEN 调用API接口 THEN THE System SHALL 使用try-catch捕获异常
22. WHEN 发生错误 THEN THE System SHALL 记录错误日志（开发环境console.error）
23. WHEN 发生错误 THEN THE System SHALL 向用户显示友好的错误提示
24. WHEN 处理异步操作 THEN THE System SHALL 使用async/await而非Promise链

**F. 注释与文档规范**

25. WHEN 编写复杂逻辑 THEN THE System SHALL 添加注释说明业务逻辑
26. WHEN 定义公共函数 THEN THE System SHALL 使用JSDoc注释（参数、返回值、示例）
27. WHEN 使用魔法数字 THEN THE System SHALL 定义为常量并添加注释
28. WHEN 编写组件 THEN THE System SHALL 在文件顶部添加组件说明注释

**G. Git提交规范**

29. WHEN 提交代码 THEN THE System SHALL 使用约定式提交格式（feat/fix/docs/style/refactor/test/chore）
30. WHEN 提交代码 THEN THE System SHALL 通过husky的pre-commit钩子检查（lint + 类型检查）

**H. 测试规范（可选但推荐）**

31. WHEN 编写工具函数 THEN THE System SHALL 编写单元测试（Vitest）
32. WHEN 编写关键组件 THEN THE System SHALL 编写组件测试（Vue Test Utils）
33. WHEN 测试覆盖率低于80% THEN THE System SHALL 补充测试用例

### 需求 14：离线状态与网络异常处理

**用户故事：** 作为用户，我希望在网络不稳定或离线状态下也能获得友好的提示和基本的浏览功能，以便了解当前状态并在网络恢复后继续使用。

#### 验收标准

**A. 网络状态检测**

1. WHEN 用户网络断开 THEN THE System SHALL 立即检测到离线状态（使用navigator.onLine）
2. WHEN 用户网络恢复 THEN THE System SHALL 立即检测到在线状态并显示提示
3. WHEN 用户处于离线状态 THEN THE System SHALL 在页面顶部显示离线提示条（橙色背景）
4. WHEN 用户网络恢复 THEN THE System SHALL 显示"网络已恢复"提示（绿色，3秒后自动消失）
5. WHEN 用户网络状态变化 THEN THE System SHALL 使用Service Worker监听online/offline事件

**B. 离线页面展示**

6. WHEN 用户在离线状态访问首页 THEN THE System SHALL 显示缓存的首页内容（如果有）
7. WHEN 用户在离线状态访问资源列表 THEN THE System SHALL 显示缓存的资源列表（最近浏览）
8. WHEN 用户在离线状态访问资源详情 THEN THE System SHALL 显示缓存的详情页（如果之前访问过）
9. WHEN 用户在离线状态访问未缓存的页面 THEN THE System SHALL 显示友好的离线提示页面
10. WHEN 离线提示页面显示 THEN THE System SHALL 包含离线图标、提示文字、重试按钮

**C. 离线功能限制**

11. WHEN 用户在离线状态点击下载按钮 THEN THE System SHALL 提示"当前网络不可用，请检查网络连接"
12. WHEN 用户在离线状态提交表单 THEN THE System SHALL 提示"网络不可用，数据将在网络恢复后自动提交"
13. WHEN 用户在离线状态上传文件 THEN THE System SHALL 禁用上传按钮并显示离线提示
14. WHEN 用户在离线状态搜索 THEN THE System SHALL 提示"搜索功能需要网络连接"
15. WHEN 用户在离线状态登录 THEN THE System SHALL 提示"登录需要网络连接"

**D. 离线缓存策略（PWA）**

16. WHEN 用户首次访问网站 THEN THE System SHALL 注册Service Worker
17. WHEN Service Worker激活 THEN THE System SHALL 缓存核心静态资源（HTML、CSS、JS、图标）
18. WHEN 用户浏览资源 THEN THE System SHALL 缓存资源列表和详情数据（IndexedDB）
19. WHEN 用户浏览图片 THEN THE System SHALL 缓存图片资源（Cache API）
20. WHEN 缓存空间不足 THEN THE System SHALL 自动清理最旧的缓存数据（LRU策略）

**E. 网络请求失败处理**

21. WHEN API请求超时（10秒）THEN THE System SHALL 显示"请求超时，请检查网络"提示
22. WHEN API请求失败（网络错误）THEN THE System SHALL 显示"网络异常，请稍后重试"提示
23. WHEN API请求失败 THEN THE System SHALL 提供"重试"按钮
24. WHEN 用户点击重试按钮 THEN THE System SHALL 重新发起请求
25. WHEN 连续3次请求失败 THEN THE System SHALL 提示"网络连接不稳定，请检查网络设置"

**F. 弱网络优化**

26. WHEN 用户网络速度慢（检测到）THEN THE System SHALL 显示"网络较慢"提示
27. WHEN 用户处于弱网络 THEN THE System SHALL 降低图片质量（加载低分辨率版本）
28. WHEN 用户处于弱网络 THEN THE System SHALL 减少自动加载内容（禁用自动播放、懒加载更激进）
29. WHEN 用户处于弱网络 THEN THE System SHALL 压缩请求数据（启用gzip）
30. WHEN 用户处于弱网络 THEN THE System SHALL 显示数据加载进度条

**G. 离线数据同步**

31. WHEN 用户在离线状态填写表单 THEN THE System SHALL 将数据保存到本地存储（IndexedDB）
32. WHEN 用户网络恢复 THEN THE System SHALL 自动检测本地待同步数据
33. WHEN 检测到待同步数据 THEN THE System SHALL 显示"正在同步数据..."提示
34. WHEN 数据同步成功 THEN THE System SHALL 清除本地待同步数据并显示成功提示
35. WHEN 数据同步失败 THEN THE System SHALL 保留本地数据并提示用户手动重试

**H. 离线提示UI设计**

36. WHEN 显示离线提示条 THEN THE System SHALL 使用橙色背景、白色文字、网络图标
37. WHEN 显示离线页面 THEN THE System SHALL 使用灰色调、离线图标、友好的文案
38. WHEN 显示重试按钮 THEN THE System SHALL 使用主题色、圆角、加载动画
39. WHEN 网络恢复提示显示 THEN THE System SHALL 使用绿色背景、白色文字、成功图标
40. WHEN 离线提示条显示 THEN THE System SHALL 固定在页面顶部，不遮挡主要内容

### 需求 15：品牌标识与水印

**用户故事：** 作为平台运营者，我希望在网站各处展示"星潮设计"品牌标识，并在资源预览图上添加水印，以便提升品牌认知度和防止盗图。

#### 验收标准

**A. 品牌标识展示**

1. WHEN 用户访问网站 THEN THE System SHALL 在页面顶部左侧显示"星潮设计"Logo和文字标识
2. WHEN 用户在桌面端浏览 THEN THE System SHALL 显示完整Logo（图标+文字"星潮设计"）
3. WHEN 用户在移动端浏览 THEN THE System SHALL 显示简化Logo（仅图标或缩写"星潮"）
4. WHEN 用户点击Logo THEN THE System SHALL 跳转到首页
5. WHEN 页面加载 THEN THE System SHALL 在浏览器标签页显示"星潮设计"标题和Favicon图标
6. WHEN 用户访问首页 THEN THE System SHALL 在Hero区域展示"星潮设计"大标题和Slogan
7. WHEN 用户访问底部 THEN THE System SHALL 显示"星潮设计 © 2024 版权所有"版权声明
8. WHEN 用户分享链接 THEN THE System SHALL 在社交媒体预览中显示"星潮设计"品牌信息（Open Graph标签）

**B. 资源预览图水印（前端展示）**

9. WHEN 用户浏览资源列表 THEN THE System SHALL 在资源封面图上显示"星潮设计"水印
10. WHEN 用户查看资源详情 THEN THE System SHALL 在所有预览图上显示"星潮设计"水印
11. WHEN 水印显示 THEN THE System SHALL 使用半透明白色文字（opacity: 0.6）
12. WHEN 水印显示 THEN THE System SHALL 包含"星潮设计"文字和资源ID
13. WHEN 水印显示 THEN THE System SHALL 斜向45度角放置在图片中央
14. WHEN 水印显示 THEN THE System SHALL 使用合适的字体大小（根据图片尺寸自适应）
15. WHEN 水印显示 THEN THE System SHALL 确保水印清晰可见但不过度遮挡内容

**C. 水印生成（后端处理，前端接收）**

16. WHEN 后端生成预览图 THEN THE System SHALL 自动添加"星潮设计"水印
17. WHEN 后端生成水印 THEN THE System SHALL 包含网站Logo图标
18. WHEN 后端生成水印 THEN THE System SHALL 包含"星潮设计"文字
19. WHEN 后端生成水印 THEN THE System SHALL 包含资源唯一ID（防止水印被裁剪后盗用）
20. WHEN 后端生成水印 THEN THE System SHALL 使用平铺模式（多个水印分布在图片各处）

**D. 品牌色应用**

21. WHEN 系统渲染UI THEN THE System SHALL 使用主色调蓝色#165DFF作为主要品牌色
22. WHEN 系统渲染按钮 THEN THE System SHALL 下载/VIP按钮使用辅助色橙色#FF7D00
23. WHEN 系统渲染Logo THEN THE System SHALL 使用品牌色渐变效果（蓝色到橙色）
24. WHEN 系统渲染加载动画 THEN THE System SHALL 使用品牌色作为主色调

**E. 品牌一致性**

25. WHEN 用户收到系统通知 THEN THE System SHALL 在通知中包含"星潮设计"品牌标识
26. WHEN 用户查看错误页面（404/500）THEN THE System SHALL 显示"星潮设计"Logo和品牌信息
27. WHEN 用户安装PWA应用 THEN THE System SHALL 使用"星潮设计"作为应用名称和图标
28. WHEN 用户分享资源 THEN THE System SHALL 在分享卡片中显示"来自星潮设计"标识

**F. 防盗图措施（前端配合）**

29. WHEN 用户右键点击预览图 THEN THE System SHALL 禁用右键菜单（可选，避免影响用户体验）
30. WHEN 用户尝试拖拽预览图 THEN THE System SHALL 禁用图片拖拽功能
31. WHEN 用户查看预览图 THEN THE System SHALL 使用CSS防止图片被轻易保存（user-select: none）
32. WHEN 用户下载资源 THEN THE System SHALL 提供无水印的原始文件（仅预览图有水印）

### 需求 16：内容运营管理（前端展示）

**用户故事：** 作为运营人员，我希望能够灵活配置首页内容（轮播图、推荐位、公告等），以便根据运营策略动态调整网站展示，无需修改前端代码。

#### 验收标准

**A. 轮播图展示**

1. WHEN 用户访问首页 THEN THE System SHALL 调用轮播图接口获取配置数据
2. WHEN 轮播图数据返回 THEN THE System SHALL 按sort字段排序展示
3. WHEN 轮播图数据包含时间范围 THEN THE System SHALL 仅展示当前时间在startTime和endTime之间的轮播图
4. WHEN 轮播图数据status为0 THEN THE System SHALL 不展示该轮播图
5. WHEN 用户点击轮播图 THEN THE System SHALL 根据linkType跳转到对应页面（内部链接/外部链接/分类/资源详情）
6. WHEN 轮播图自动播放 THEN THE System SHALL 每5秒切换一次
7. WHEN 用户鼠标悬浮轮播图 THEN THE System SHALL 暂停自动播放
8. WHEN 轮播图数据为空 THEN THE System SHALL 显示默认占位图或隐藏轮播区域

**B. 推荐位展示**

9. WHEN 用户访问首页 THEN THE System SHALL 调用推荐位配置接口获取各版块配置
10. WHEN 推荐位displayMode为auto THEN THE System SHALL 调用对应的资源列表接口（热门/最新/VIP）
11. WHEN 推荐位displayMode为manual THEN THE System SHALL 使用resourceIds批量获取指定资源
12. WHEN 推荐位status为0 THEN THE System SHALL 不展示该版块
13. WHEN 推荐位数据按sort排序 THEN THE System SHALL 按顺序展示各版块
14. WHEN 推荐位资源数量超过limit THEN THE System SHALL 仅展示limit数量的资源

**C. 公告通知展示**

15. WHEN 用户访问首页 THEN THE System SHALL 调用公告接口获取重要公告（level为important）
16. WHEN 公告数据返回 THEN THE System SHALL 在页面顶部展示公告横幅
17. WHEN 公告isTop为true THEN THE System SHALL 优先展示置顶公告
18. WHEN 用户点击公告 THEN THE System SHALL 跳转到公告详情页或linkUrl
19. WHEN 用户关闭公告横幅 THEN THE System SHALL 记录到本地存储，24小时内不再显示
20. WHEN 公告type为warning THEN THE System SHALL 使用橙色背景展示
21. WHEN 公告type为important THEN THE System SHALL 使用红色背景展示

**D. 分类配置展示**

22. WHEN 用户访问首页 THEN THE System SHALL 调用分类配置接口获取分类列表
23. WHEN 分类数据返回 THEN THE System SHALL 按sort字段排序展示分类快捷入口
24. WHEN 分类isHot为true THEN THE System SHALL 显示"热门"标签
25. WHEN 分类isRecommend为true THEN THE System SHALL 在首页优先展示
26. WHEN 用户点击分类 THEN THE System SHALL 跳转到该分类的资源列表页
27. WHEN 系统初始化分类数据 THEN THE System SHALL 支持以下预设分类：党建类、节日海报类、电商类、UI设计类、插画类、摄影图类、背景素材类、字体类、图标类、模板类
28. WHEN 用户上传资源 THEN THE System SHALL 要求用户从分类列表中选择一个主分类
29. WHEN 用户筛选资源 THEN THE System SHALL 支持按分类筛选并显示该分类下的资源数量
30. WHEN 分类包含子分类 THEN THE System SHALL 支持二级分类展示（例如：节日海报类 → 春节、中秋、国庆等）
31. WHEN 用户浏览分类 THEN THE System SHALL 显示分类图标、名称、资源数量

**E. 网站配置应用**

32. WHEN 应用初始化 THEN THE System SHALL 调用网站配置接口获取全局配置
33. WHEN 网站配置返回 THEN THE System SHALL 动态设置页面标题为siteName
34. WHEN 网站配置返回 THEN THE System SHALL 动态设置Favicon为faviconUrl
35. WHEN 网站配置返回 THEN THE System SHALL 在顶部导航栏显示logoUrl
36. WHEN 网站配置返回 THEN THE System SHALL 在底部显示copyright版权信息
37. WHEN 网站配置返回 THEN THE System SHALL 应用水印配置到所有预览图
38. WHEN 网站配置返回 THEN THE System SHALL 设置SEO meta标签（title、keywords、description）

**F. 活动配置展示**

39. WHEN 用户首次访问网站 THEN THE System SHALL 调用活动接口获取进行中的活动
40. WHEN 活动isPopup为true THEN THE System SHALL 弹窗展示活动详情
41. WHEN 用户关闭活动弹窗 THEN THE System SHALL 记录到本地存储，当天不再弹出
42. WHEN 活动status为ongoing THEN THE System SHALL 在首页展示活动横幅
43. WHEN 用户点击活动横幅 THEN THE System SHALL 跳转到linkUrl

**G. 友情链接展示**

44. WHEN 用户滚动到页面底部 THEN THE System SHALL 调用友情链接接口获取链接列表
45. WHEN 友情链接数据返回 THEN THE System SHALL 按sort字段排序展示
46. WHEN 友情链接包含logo THEN THE System SHALL 显示logo图标
47. WHEN 用户点击友情链接 THEN THE System SHALL 在新标签页打开链接

**H. 数据缓存策略**

48. WHEN 获取轮播图数据 THEN THE System SHALL 缓存5分钟（避免频繁请求）
49. WHEN 获取网站配置 THEN THE System SHALL 缓存30分钟
50. WHEN 获取分类配置 THEN THE System SHALL 缓存10分钟
51. WHEN 用户刷新页面 THEN THE System SHALL 清除所有内容配置缓存并重新获取

### 需求 17：用户体验优化

**用户故事：** 作为用户，我希望系统提供友好的交互反馈和便捷的操作方式，以便提升使用体验。

#### 验收标准

1. WHEN 系统执行操作成功 THEN THE System SHALL 显示绿色成功提示（3秒后自动消失）
2. WHEN 系统执行操作失败 THEN THE System SHALL 显示红色错误提示（3秒后自动消失）
3. WHEN 用户点击按钮提交请求 THEN THE System SHALL 显示加载图标并禁用按钮
4. WHEN 页面加载数据 THEN THE System SHALL 显示顶部进度条
5. WHEN 用户按下Ctrl+K快捷键 THEN THE System SHALL 聚焦到搜索框
6. WHEN 用户在表单中按下Enter键 THEN THE System SHALL 提交表单
7. WHEN 轮播图自动播放时用户鼠标悬浮 THEN THE System SHALL 暂停轮播
8. WHEN 用户鼠标离开轮播图 THEN THE System SHALL 继续自动轮播

### 需求 18：资源列表页面UI重新设计与美化

**用户故事：** 作为用户，我希望资源列表页面的筛选栏布局清晰、图标大小规范、视觉设计美观，以便获得更好的浏览和筛选体验。

#### 验收标准

**A. 图标尺寸规范化**

1. WHEN 系统渲染分类标签图标 THEN THE System SHALL 使用统一的14px尺寸
2. WHEN 系统渲染排序按钮图标 THEN THE System SHALL 使用统一的16px尺寸
3. WHEN 系统渲染选中状态对勾图标 THEN THE System SHALL 使用统一的12px尺寸
4. WHEN 系统渲染热门徽章图标 THEN THE System SHALL 使用统一的10px尺寸
5. WHEN 系统渲染筛选下拉框图标 THEN THE System SHALL 使用统一的14px尺寸

**B. 筛选栏布局优化**

6. WHEN 用户查看筛选栏 THEN THE System SHALL 将分类筛选、格式筛选、类型筛选、排序选项分为清晰的视觉区域
7. WHEN 系统渲染筛选项之间的间距 THEN THE System SHALL 使用一致的12px间距
8. WHEN 用户在移动端查看筛选栏 THEN THE System SHALL 垂直堆叠筛选项并使用全宽布局
9. WHEN 用户在桌面端查看筛选栏 THEN THE System SHALL 使用横向布局并合理分配空间
10. WHEN 系统渲染筛选区域分隔线 THEN THE System SHALL 使用1px的浅灰色边框（#ebeef5）

**C. 视觉设计增强**

11. WHEN 系统渲染分类标签 THEN THE System SHALL 使用8px圆角、浅灰背景（#f5f7fa）、1px边框（#dcdfe6）
12. WHEN 用户悬浮分类标签 THEN THE System SHALL 显示蓝色背景（#e8f4ff）、蓝色边框（#165dff）、向上2px位移、阴影效果
13. WHEN 用户选中分类标签 THEN THE System SHALL 显示蓝色渐变背景（#165dff到#4080ff）、白色文字、对勾图标、增强阴影
14. WHEN 系统渲染热门分类标签 THEN THE System SHALL 在右上角显示橙色"热"徽章（#ff7d00）
15. WHEN 系统渲染排序选项卡片 THEN THE System SHALL 使用8px圆角、浅灰背景、2px边框、垂直布局（标题+描述）
16. WHEN 用户悬浮排序选项 THEN THE System SHALL 显示蓝色背景、蓝色边框、向上2px位移、阴影效果
17. WHEN 用户选中排序选项 THEN THE System SHALL 显示蓝色渐变背景、白色文字、右上角对勾图标、增强阴影
18. WHEN 系统渲染筛选栏容器 THEN THE System SHALL 使用白色背景、8px圆角、轻微阴影（0 2px 8px rgba(0,0,0,0.08)）

**D. 排版和字体优化**

19. WHEN 系统渲染筛选标签文字 THEN THE System SHALL 使用14px字体大小、500字重
20. WHEN 系统渲染排序选项标题 THEN THE System SHALL 使用14px字体大小、500字重
21. WHEN 系统渲染排序选项描述 THEN THE System SHALL 使用11px字体大小、400字重、灰色文字（#909399）
22. WHEN 系统渲染分类区域标题 THEN THE System SHALL 使用14px字体大小、500字重、深灰色文字（#606266）
23. WHEN 系统渲染结果统计文字 THEN THE System SHALL 使用14px字体大小、高亮数字使用蓝色（#165dff）、600字重

**E. 间距和对齐优化**

24. WHEN 系统渲染筛选栏内边距 THEN THE System SHALL 使用20px内边距（移动端16px）
25. WHEN 系统渲染筛选区域之间的间隙 THEN THE System SHALL 使用16px垂直间距（移动端12px）
26. WHEN 系统渲染分类标签之间的间隙 THEN THE System SHALL 使用10px间距（移动端8px）
27. WHEN 系统渲染排序选项之间的间隙 THEN THE System SHALL 使用10px间距（移动端8px）
28. WHEN 系统渲染筛选项标签和内容的间隙 THEN THE System SHALL 使用8px间距（移动端6px）

**F. 交互动画和微交互**

29. WHEN 用户悬浮或点击可交互元素 THEN THE System SHALL 使用0.3s的cubic-bezier(0.4, 0, 0.2, 1)缓动函数
30. WHEN 用户选中标签时 THEN THE System SHALL 显示对勾图标的弹出动画（0.3s，缩放从0.5到1.2再到1）
31. WHEN 用户悬浮标签时 THEN THE System SHALL 显示渐变背景的淡入效果（0.3s）
32. WHEN 用户点击确定按钮后 THEN THE System SHALL 显示筛选结果的淡入动画（0.3s）
33. WHEN 页面加载筛选栏时 THEN THE System SHALL 显示从上到下的淡入动画（0.2s）

**G. 响应式设计优化**

34. WHEN 用户在移动端查看分类标签 THEN THE System SHALL 使用全宽布局、垂直堆叠、6px内边距、13px字体
35. WHEN 用户在移动端查看排序选项 THEN THE System SHALL 使用弹性布局、每行2-3个选项、8px内边距
36. WHEN 用户在移动端查看确定按钮 THEN THE System SHALL 使用全宽按钮
37. WHEN 用户在平板端查看（768px-1200px）THEN THE System SHALL 使用中等尺寸的标签和间距
38. WHEN 用户在大屏幕查看（>1200px）THEN THE System SHALL 限制最大宽度为1400px并居中显示

**H. 暗色模式适配**

39. WHEN 用户启用暗色模式 THEN THE System SHALL 使用深色背景（#141414）、深灰卡片（#1d1e1f）
40. WHEN 用户在暗色模式下查看标签 THEN THE System SHALL 使用深灰背景（#2b2b2b）、深灰边框（#3a3a3a）
41. WHEN 用户在暗色模式下悬浮标签 THEN THE System SHALL 使用深蓝背景（#1e3a5f）、亮蓝边框（#4c9bff）
42. WHEN 用户在暗色模式下选中标签 THEN THE System SHALL 使用亮蓝渐变背景（#4c9bff到#6db0ff）
43. WHEN 用户在暗色模式下查看文字 THEN THE System SHALL 使用浅灰色文字（#a8abb2）、高亮使用亮蓝色（#4c9bff）

**I. 可访问性优化**

44. WHEN 用户使用键盘导航 THEN THE System SHALL 显示清晰的焦点指示器（2px蓝色边框）
45. WHEN 用户使用屏幕阅读器 THEN THE System SHALL 为所有交互元素提供aria-label属性
46. WHEN 系统渲染颜色对比 THEN THE System SHALL 确保文字和背景的对比度≥4.5:1（WCAG AA标准）
47. WHEN 用户点击标签 THEN THE System SHALL 提供触觉反馈（移动端振动）

**J. 性能优化**

48. WHEN 系统渲染筛选栏 THEN THE System SHALL 使用CSS transform和opacity进行动画（避免重排）
49. WHEN 用户快速切换筛选条件 THEN THE System SHALL 使用防抖处理（300ms）避免频繁请求
50. WHEN 系统渲染大量分类标签 THEN THE System SHALL 使用虚拟滚动或分页加载（超过50个标签时）
