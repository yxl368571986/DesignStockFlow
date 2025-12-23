# 需求文档 - 前端修复与后台管理系统

## 简介

本文档基于现有的"星潮设计"资源平台,针对前端已知问题进行修复,并新增完整的后台管理系统。系统将包含用户管理、内容审核、数据统计等核心功能,使用PostgreSQL数据库存储数据。

## 术语表

### 系统术语

- **System**: 星潮设计资源平台系统
- **Frontend**: 前端用户界面系统
- **Backend_Admin**: 后台管理系统
- **Database**: PostgreSQL数据库
- **User**: 普通用户
- **Admin**: 超级管理员
- **Moderator**: 内容审核员
- **Resource**: 设计资源文件
- **Audit_Status**: 审核状态(待审核/已通过/已驳回)

### 技术术语

- **PostgreSQL**: 开源关系型数据库
- **MCP**: Model Context Protocol,用于快速数据库操作
- **RBAC**: 基于角色的访问控制
- **SSR**: 服务端渲染
- **API_Gateway**: API网关,统一管理前后端接口

## 需求

### 需求1: 前端UI修复

**用户故事:** 作为用户,我希望前端界面交互流畅、布局合理,以便获得良好的使用体验。

#### 验收标准

1. WHEN 用户点击搜索框 THEN THE System SHALL 显示正确的搜索建议下拉框
2. WHEN 未登录用户访问首页 THEN THE System SHALL 隐藏"上传作品"入口
3. WHEN 已登录用户访问首页 THEN THE System SHALL 显示"上传作品"入口
4. WHEN 用户进入登录界面 THEN THE System SHALL 显示单个电话图标
5. WHEN 用户查看登录/注册表单 THEN THE System SHALL 使用协调的输入框高度(40px)
6. WHEN 用户查看首页 THEN THE System SHALL 在右上角横向排列登录和注册按钮
7. WHEN 用户点击资源卡片进入详情 THEN THE System SHALL 显示返回按钮或关闭按钮
8. WHEN 用户在资源详情页点击返回 THEN THE System SHALL 返回上一页面
9. WHEN 用户在资源详情页点击关闭 THEN THE System SHALL 关闭详情页并返回列表

### 需求2: 侧边栏滚动优化

**用户故事:** 作为用户,我希望侧边栏和主内容区域可以独立滚动,以便更好地浏览内容。

#### 验收标准

1. WHEN 侧边栏内容超出屏幕高度 THEN THE System SHALL 使侧边栏可独立滚动
2. WHEN 鼠标指向侧边栏 THEN THE System SHALL 仅滚动侧边栏内容
3. WHEN 鼠标指向主内容区域 THEN THE System SHALL 仅滚动主内容区域
4. WHEN 用户滚动侧边栏 THEN THE System SHALL 保持主内容区域位置不变
5. WHEN 用户滚动主内容区域 THEN THE System SHALL 保持侧边栏位置不变


### 需求3: 分类筛选功能完善

**用户故事:** 作为用户,我希望能够通过分类筛选资源,并有明确的确认操作,以便精准找到所需内容。

#### 验收标准

1. WHEN 用户选择分类选项 THEN THE System SHALL 高亮显示已选分类
2. WHEN 用户完成分类选择 THEN THE System SHALL 显示"确定"按钮
3. WHEN 用户点击"确定"按钮 THEN THE System SHALL 根据选中分类筛选资源
4. WHEN 用户点击热门分类 THEN THE System SHALL 自动筛选该分类的资源
5. WHEN 用户点击全部分类中的任意分类 THEN THE System SHALL 根据数据库数据筛选对应资源
6. WHEN 筛选结果为空 THEN THE System SHALL 显示"暂无该分类资源"提示

### 需求3.1: 资源排序筛选功能

**用户故事:** 作为用户,我希望能够对资源进行多种方式排序,以便快速精准地定位到我想要的作品内容并下载。

#### 验收标准

1. WHEN 用户访问资源列表页 THEN THE System SHALL 显示排序筛选选项
2. WHEN 排序筛选选项显示 THEN THE System SHALL 包含以下选项:
   - 综合排序(默认)
   - 最多下载
   - 最新发布
   - 最多好评
   - 最多收藏
3. WHEN 用户选择"综合排序" THEN THE System SHALL 按综合评分排序(考虑下载量、浏览量、收藏数、发布时间等因素)
4. WHEN 用户选择"最多下载" THEN THE System SHALL 按下载量降序排列资源
5. WHEN 用户选择"最新发布" THEN THE System SHALL 按发布时间降序排列资源
6. WHEN 用户选择"最多好评" THEN THE System SHALL 按点赞数降序排列资源
7. WHEN 用户选择"最多收藏" THEN THE System SHALL 按收藏数降序排列资源
8. WHEN 用户切换排序方式 THEN THE System SHALL 立即重新加载资源列表
9. WHEN 用户切换排序方式 THEN THE System SHALL 保持当前的分类筛选条件
10. WHEN 排序筛选选项显示 THEN THE System SHALL 高亮显示当前选中的排序方式
11. WHEN 用户刷新页面 THEN THE System SHALL 保持用户上次选择的排序方式
12. WHEN 排序筛选与分类筛选同时使用 THEN THE System SHALL 先按分类筛选再按排序方式排序

### 需求4: 登录注册功能完善

**用户故事:** 作为用户,我希望能够通过多种方式安全地登录和注册,以便灵活使用平台。

#### 验收标准

1. WHEN 用户选择手机号登录 THEN THE System SHALL 要求输入手机号和短信验证码
2. WHEN 用户选择密码登录 THEN THE System SHALL 要求输入手机号和密码
3. WHEN 用户注册账号 THEN THE System SHALL 要求输入手机号、短信验证码和密码
4. WHEN 用户点击"微信登录"图标 THEN THE System SHALL 跳转到微信授权页面
5. WHEN 用户点击"手机登录"图标 THEN THE System SHALL 切换到手机号登录方式
6. WHEN 用户完成微信授权 THEN THE System SHALL 自动登录并返回平台
7. WHEN 用户输入手机号 THEN THE System SHALL 验证手机号格式
8. WHEN 用户点击"获取验证码" THEN THE System SHALL 发送短信验证码并显示60秒倒计时

### 需求5: 资源上传审核流程

**用户故事:** 作为内容创作者,我希望上传资源时能够选择分类并查看审核状态,以便了解作品发布进度。

#### 验收标准

1. WHEN 用户上传作品 THEN THE System SHALL 要求用户选择分类标签
2. WHEN 用户选择分类 THEN THE System SHALL 支持党建类、节日海报类、电商类、UI设计类等预设分类
3. WHEN 用户提交作品 THEN THE System SHALL 将作品状态设置为"审核中"
4. WHEN 作品处于审核中 THEN THE System SHALL 在个人中心显示"审核中"状态标识
5. WHEN 作品审核通过 THEN THE System SHALL 在个人中心显示作品并移除状态标识
6. WHEN 作品审核通过 THEN THE System SHALL 在首页展示该作品
7. WHEN 作品审核驳回 THEN THE System SHALL 在个人中心显示"审核未通过"状态和原因
8. WHEN 用户查看上传作品 THEN THE System SHALL 显示作品的当前状态(上传中/审核中/已发布/已驳回)

### 需求6: 个人中心功能完善

**用户故事:** 作为用户,我希望能够在个人中心管理我的信息和作品,以便更好地使用平台服务。

#### 验收标准

1. WHEN 用户点击"编辑个人信息" THEN THE System SHALL 弹出编辑对话框或跳转到编辑页面
2. WHEN 用户在编辑对话框中修改信息 THEN THE System SHALL 实时验证输入格式
3. WHEN 用户保存个人信息 THEN THE System SHALL 更新数据库并显示成功提示
4. WHEN 用户点击"作品上传" THEN THE System SHALL 跳转到上传页面
5. WHEN 用户在个人中心查看上传作品 THEN THE System SHALL 显示所有作品及其状态
6. WHEN 作品状态为"上传中" THEN THE System SHALL 显示上传进度
7. WHEN 作品状态为"审核中" THEN THE System SHALL 显示"审核中"标识
8. WHEN 作品审核通过 THEN THE System SHALL 正常展示作品不显示状态标识


### 需求7: VIP中心功能实现

**用户故事:** 作为用户,我希望能够了解VIP特权并便捷开通,以便享受更多平台服务。

#### 验收标准

1. WHEN 用户访问VIP中心 THEN THE System SHALL 显示VIP详细说明页面
2. WHEN VIP说明页面显示 THEN THE System SHALL 包含VIP等级、特权对比、价格套餐
3. WHEN VIP说明页面显示 THEN THE System SHALL 包含开通流程指南
4. WHEN 用户点击任何入口的VIP中心 THEN THE System SHALL 正确跳转到VIP页面(不报404错误)
5. WHEN 用户查看VIP特权 THEN THE System SHALL 显示无限下载、专属资源、优先审核等特权
6. WHEN 用户查看价格套餐 THEN THE System SHALL 显示月度、季度、年度套餐及价格
7. WHEN 用户选择套餐 THEN THE System SHALL 跳转到支付页面

### 需求8: 支付功能实现

**用户故事:** 作为用户,我希望能够通过多种支付方式购买VIP,以便灵活完成支付。

#### 验收标准

1. WHEN 用户选择VIP套餐 THEN THE System SHALL 显示支付方式选择(微信支付/支付宝支付)
2. WHEN 用户选择微信支付 THEN THE System SHALL 生成微信支付二维码
3. WHEN 用户选择支付宝支付 THEN THE System SHALL 生成支付宝支付二维码
4. WHEN 支付二维码生成 THEN THE System SHALL 显示订单金额和有效期
5. WHEN 用户完成支付 THEN THE System SHALL 自动检测支付状态并更新VIP信息
6. WHEN 支付成功 THEN THE System SHALL 显示"支付成功"提示并跳转到VIP中心
7. WHEN 支付失败 THEN THE System SHALL 显示"支付失败"提示并支持重新支付
8. WHEN 支付超时 THEN THE System SHALL 显示"订单已过期"提示并支持重新下单

### 需求9: 页面底部导航完善

**用户故事:** 作为用户,我希望页面底部的链接能够正常跳转,以便访问相关页面。

#### 验收标准

1. WHEN 用户点击"关于我们" THEN THE System SHALL 跳转到关于我们页面
2. WHEN 用户点击"联系我们" THEN THE System SHALL 跳转到联系我们页面
3. WHEN 用户点击"用户协议" THEN THE System SHALL 跳转到用户协议页面
4. WHEN 用户点击"隐私政策" THEN THE System SHALL 跳转到隐私政策页面
5. WHEN 用户点击"帮助中心" THEN THE System SHALL 跳转到帮助中心页面
6. WHEN 用户点击"友情链接" THEN THE System SHALL 跳转到对应的外部网站
7. WHEN 底部页面不存在 THEN THE System SHALL 创建对应的页面组件

### 需求10: 资源详情页图片展示

**用户故事:** 作为用户,我希望能够在资源详情页查看作品的详细图片,以便全面了解作品内容。

#### 验收标准

1. WHEN 用户上传作品时添加详情页图片 THEN THE System SHALL 保存所有详情图片
2. WHEN 用户访问资源详情页 THEN THE System SHALL 显示所有详情页图片
3. WHEN 详情页图片较多 THEN THE System SHALL 使用轮播图或网格布局展示
4. WHEN 用户点击详情页图片 THEN THE System SHALL 放大显示图片
5. WHEN 用户在放大模式下 THEN THE System SHALL 支持左右切换查看其他图片
6. WHEN 详情页图片加载失败 THEN THE System SHALL 显示占位图

### 需求10.1: 资源积分消耗展示

**用户故事:** 作为登录用户,我希望在浏览资源时能清楚看到下载所需积分,以便决定是否下载该资源。

#### 验收标准

**A. 资源列表页积分展示**

1. WHEN 未登录用户浏览资源列表 THEN THE System SHALL 不显示任何积分相关信息
2. WHEN 登录的VIP用户浏览资源列表 THEN THE System SHALL 在资源卡片上显示"VIP免费"标识
3. WHEN 登录的普通用户浏览需要积分的资源 THEN THE System SHALL 在资源卡片上显示"下载需X积分"
4. WHEN 登录的普通用户浏览免费资源 THEN THE System SHALL 在资源卡片上显示"免费下载"
5. WHEN 资源卡片显示积分信息 THEN THE System SHALL 使用醒目的图标和颜色标识
6. WHEN 用户悬浮在资源卡片上 THEN THE System SHALL 在下载按钮上显示积分消耗数值

**B. 资源详情页积分展示**

7. WHEN 未登录用户访问资源详情页 THEN THE System SHALL 不显示积分消耗信息
8. WHEN 登录的VIP用户访问资源详情页 THEN THE System SHALL 显示VIP特权说明区域
9. WHEN VIP特权说明区域显示 THEN THE System SHALL 包含"VIP免费下载"、"无需消耗积分"等文字
10. WHEN 登录的普通用户访问需要积分的资源详情页 THEN THE System SHALL 显示积分消耗信息区域
11. WHEN 积分消耗信息区域显示 THEN THE System SHALL 包含所需积分数值、用户当前积分余额
12. WHEN 用户积分不足 THEN THE System SHALL 显示积分差额和"积分不足"提示
13. WHEN 用户积分不足 THEN THE System SHALL 显示"获取积分"按钮
14. WHEN 用户点击"获取积分"按钮 THEN THE System SHALL 跳转到积分获取页面
15. WHEN 积分不足提示显示 THEN THE System SHALL 展示积分获取途径说明(上传作品、签到、邀请等)
16. WHEN 登录的普通用户访问免费资源详情页 THEN THE System SHALL 显示"此资源免费下载"提示

**C. 下载按钮积分展示**

17. WHEN 未登录用户查看下载按钮 THEN THE System SHALL 显示"登录后下载"
18. WHEN 登录的VIP用户查看下载按钮 THEN THE System SHALL 显示"VIP免费下载"
19. WHEN 登录的普通用户查看需要积分的资源下载按钮 THEN THE System SHALL 显示"X积分下载"
20. WHEN 登录的普通用户查看免费资源下载按钮 THEN THE System SHALL 显示"免费下载"
21. WHEN 用户积分不足 THEN THE System SHALL 禁用下载按钮并显示"积分不足"

**D. 下载确认流程**

22. WHEN 普通用户点击需要积分的资源下载按钮 THEN THE System SHALL 弹出确认对话框
23. WHEN 确认对话框显示 THEN THE System SHALL 包含"下载此资源需要消耗X积分,是否继续?"
24. WHEN 用户确认下载 THEN THE System SHALL 扣除相应积分并开始下载
25. WHEN 用户取消下载 THEN THE System SHALL 关闭对话框不扣除积分
26. WHEN VIP用户点击下载按钮 THEN THE System SHALL 直接开始下载不弹出确认对话框
27. WHEN 下载成功 THEN THE System SHALL 显示"下载成功"提示
28. WHEN 下载成功且消耗了积分 THEN THE System SHALL 实时更新用户积分余额显示


### 需求11: 测试账号配置

**用户故事:** 作为开发者,我希望有预配置的测试账号,以便快速测试不同权限的功能。

#### 验收标准

1. WHEN 系统初始化 THEN THE System SHALL 创建普通用户测试账号
2. WHEN 系统初始化 THEN THE System SHALL 创建超级管理员测试账号
3. WHEN 使用普通用户账号登录 THEN THE System SHALL 仅显示普通用户权限功能
4. WHEN 使用管理员账号登录 THEN THE System SHALL 显示所有管理功能
5. WHEN 测试账号信息存储 THEN THE System SHALL 在README或配置文件中记录账号信息
6. WHEN 测试账号包含 THEN THE System SHALL 至少有以下账号:
   - 普通用户: test_user / 123456
   - VIP用户: test_vip / 123456  
   - 管理员: admin / admin123

### 需求12: 后台管理系统 - 用户管理

**用户故事:** 作为超级管理员,我希望能够管理所有用户账号,以便维护平台秩序。

#### 验收标准

1. WHEN 管理员访问用户管理页面 THEN THE System SHALL 显示所有用户列表
2. WHEN 用户列表显示 THEN THE System SHALL 包含用户ID、昵称、手机号、VIP等级、积分余额、注册时间、状态
3. WHEN 管理员搜索用户 THEN THE System SHALL 支持按手机号、昵称、用户ID搜索
4. WHEN 管理员筛选用户 THEN THE System SHALL 支持按VIP等级、账号状态筛选
5. WHEN 管理员点击"查看详情" THEN THE System SHALL 显示用户完整信息、积分明细和操作记录
6. WHEN 管理员点击"禁用账号" THEN THE System SHALL 弹出确认对话框
7. WHEN 管理员确认禁用 THEN THE System SHALL 将用户状态设置为"已禁用"
8. WHEN 用户被禁用 THEN THE System SHALL 阻止该用户登录
9. WHEN 管理员点击"启用账号" THEN THE System SHALL 恢复用户正常状态
10. WHEN 管理员点击"重置密码" THEN THE System SHALL 生成临时密码并通知用户
11. WHEN 管理员点击"调整VIP" THEN THE System SHALL 允许手动设置用户VIP等级和到期时间
12. WHEN 管理员点击"调整积分" THEN THE System SHALL 允许手动增加或扣减用户积分并记录原因

### 需求12.1: 后台管理系统 - VIP功能管理

**用户故事:** 作为超级管理员,我希望能够管理VIP功能和套餐配置,以便灵活调整VIP权益和定价策略。

#### 验收标准

**A. VIP套餐管理**

1. WHEN 管理员访问VIP套餐管理 THEN THE System SHALL 显示所有VIP套餐列表
2. WHEN 套餐列表显示 THEN THE System SHALL 包含套餐名称、时长、原价、现价、状态、创建时间
3. WHEN 管理员点击"添加套餐" THEN THE System SHALL 弹出添加对话框
4. WHEN 管理员添加套餐 THEN THE System SHALL 要求输入套餐名称、时长(天数)、原价、现价、描述
5. WHEN 管理员编辑套餐 THEN THE System SHALL 允许修改套餐价格和描述
6. WHEN 管理员启用/禁用套餐 THEN THE System SHALL 控制套餐在前台的显示
7. WHEN 管理员删除套餐 THEN THE System SHALL 检查是否有用户正在使用该套餐
8. WHEN 套餐被使用 THEN THE System SHALL 提示"该套餐正在使用,无法删除"

**B. VIP特权配置**

9. WHEN 管理员访问VIP特权配置 THEN THE System SHALL 显示所有VIP特权列表
10. WHEN VIP特权包含 THEN THE System SHALL 支持以下特权配置:
    - 免费下载所有资源(无需消耗积分或次数)
    - 专属VIP资源访问权限
    - 优先审核(作品提交后优先处理)
    - 去除下载限制(普通用户每日限制下载次数)
    - 去除广告(如有)
    - 专属客服支持
    - 作品置顶推广(每月N次)
    - 高速下载通道
    - 批量下载功能
    - 收藏夹容量扩展
11. WHEN 管理员配置特权 THEN THE System SHALL 支持启用/禁用每项特权
12. WHEN 管理员配置特权 THEN THE System SHALL 支持设置特权参数(如置顶次数、下载速度等)
13. WHEN 管理员保存特权配置 THEN THE System SHALL 立即对所有VIP用户生效

**C. VIP订单管理**

14. WHEN 管理员访问VIP订单管理 THEN THE System SHALL 显示所有VIP购买订单
15. WHEN 订单列表显示 THEN THE System SHALL 包含订单号、用户、套餐、金额、支付方式、状态、创建时间
16. WHEN 管理员搜索订单 THEN THE System SHALL 支持按订单号、用户手机号、用户昵称搜索
17. WHEN 管理员筛选订单 THEN THE System SHALL 支持按支付状态、支付方式、时间范围筛选
18. WHEN 管理员点击"查看详情" THEN THE System SHALL 显示订单完整信息和支付流水
19. WHEN 管理员点击"退款" THEN THE System SHALL 弹出退款确认对话框
20. WHEN 管理员确认退款 THEN THE System SHALL 调用支付接口退款并撤销用户VIP权限

**D. VIP用户统计**

21. WHEN 管理员访问VIP统计 THEN THE System SHALL 显示VIP用户总数、今日新增、本月新增
22. WHEN 管理员访问VIP统计 THEN THE System SHALL 显示VIP收入总额、今日收入、本月收入
23. WHEN 管理员访问VIP统计 THEN THE System SHALL 显示各套餐销量排行
24. WHEN 管理员访问VIP统计 THEN THE System SHALL 显示VIP用户增长趋势图(最近30天)
25. WHEN 管理员访问VIP统计 THEN THE System SHALL 显示VIP收入趋势图(最近30天)
26. WHEN 管理员访问VIP统计 THEN THE System SHALL 支持导出VIP数据报表

**E. VIP到期提醒**

27. WHEN VIP用户到期前7天 THEN THE System SHALL 发送到期提醒通知
28. WHEN VIP用户到期前3天 THEN THE System SHALL 再次发送到期提醒
29. WHEN VIP用户到期前1天 THEN THE System SHALL 发送最后提醒
30. WHEN VIP用户到期 THEN THE System SHALL 自动降级为普通用户并撤销VIP特权
31. WHEN 管理员查看到期用户 THEN THE System SHALL 显示即将到期的VIP用户列表(7天内)

### 需求12.2: 积分系统

**用户故事:** 作为用户,我希望通过上传作品获得积分奖励,并用积分兑换VIP或其他商品,以便获得更多平台权益。

#### 验收标准

**A. 积分获取规则**

1. WHEN 用户上传作品并审核通过 THEN THE System SHALL 奖励用户积分
2. WHEN 积分奖励规则 THEN THE System SHALL 按以下标准发放:
   - 上传作品审核通过: +50积分
   - 作品被下载1次: +2积分
   - 作品被收藏1次: +5积分
   - 作品被点赞1次: +1积分
   - 每日签到: +10积分
   - 完善个人资料: +20积分(一次性)
   - 绑定邮箱: +10积分(一次性)
   - 绑定微信: +10积分(一次性)
   - 邀请新用户注册: +30积分/人
3. WHEN 用户获得积分 THEN THE System SHALL 实时更新用户积分余额
4. WHEN 用户获得积分 THEN THE System SHALL 记录积分明细(来源、数量、时间)
5. WHEN 用户获得积分 THEN THE System SHALL 发送积分到账通知

**B. 积分消耗规则**

6. WHEN 普通用户下载非VIP资源 THEN THE System SHALL 消耗积分
7. WHEN 积分消耗规则 THEN THE System SHALL 按以下标准扣除:
   - 下载普通资源: -10积分/次
   - 下载高级资源: -20积分/次
   - 下载精品资源: -50积分/次
8. WHEN 用户积分不足 THEN THE System SHALL 提示"积分不足,请充值或上传作品获取积分"
9. WHEN 用户积分不足 THEN THE System SHALL 提供积分购买入口
10. WHEN VIP用户下载资源 THEN THE System SHALL 不消耗积分(VIP特权)

**C. 积分兑换功能**

11. WHEN 用户访问积分商城 THEN THE System SHALL 显示可兑换的商品列表
12. WHEN 积分商城显示 THEN THE System SHALL 包含以下兑换选项:
    - VIP月卡: 1000积分
    - VIP季卡: 2500积分
    - VIP年卡: 8000积分
    - 下载次数包(10次): 80积分
    - 下载次数包(50次): 350积分
    - 下载次数包(100次): 600积分
    - 实物商品(如U盘、鼠标垫等): 根据商品定价
13. WHEN 用户点击兑换 THEN THE System SHALL 检查用户积分是否足够
14. WHEN 积分足够 THEN THE System SHALL 扣除积分并发放对应商品/权益
15. WHEN 兑换VIP THEN THE System SHALL 立即开通VIP并设置到期时间
16. WHEN 兑换实物商品 THEN THE System SHALL 要求用户填写收货地址
17. WHEN 兑换成功 THEN THE System SHALL 记录兑换记录并发送通知

**D. 积分充值功能**

18. WHEN 用户访问积分充值 THEN THE System SHALL 显示积分充值套餐
19. WHEN 积分充值套餐 THEN THE System SHALL 包含:
    - 100积分: ¥10
    - 500积分: ¥45(9折)
    - 1000积分: ¥80(8折)
    - 5000积分: ¥350(7折)
20. WHEN 用户选择充值套餐 THEN THE System SHALL 跳转到支付页面
21. WHEN 用户完成支付 THEN THE System SHALL 自动充值积分到账户
22. WHEN 充值成功 THEN THE System SHALL 发送充值成功通知

**E. 积分明细和查询**

23. WHEN 用户访问积分明细 THEN THE System SHALL 显示所有积分变动记录
24. WHEN 积分明细显示 THEN THE System SHALL 包含时间、类型(获得/消耗/兑换)、数量、余额、说明
25. WHEN 用户筛选积分明细 THEN THE System SHALL 支持按时间范围、类型筛选
26. WHEN 用户查看积分统计 THEN THE System SHALL 显示累计获得积分、累计消耗积分、当前余额
27. WHEN 用户查看积分统计 THEN THE System SHALL 显示积分获取来源占比图

**F. 后台积分管理**

28. WHEN 管理员访问积分管理 THEN THE System SHALL 显示积分规则配置
29. WHEN 管理员配置积分规则 THEN THE System SHALL 支持修改各项积分获取和消耗数值
30. WHEN 管理员访问积分商城管理 THEN THE System SHALL 支持添加/编辑/删除兑换商品
31. WHEN 管理员添加兑换商品 THEN THE System SHALL 要求输入商品名称、所需积分、库存、描述、图片
32. WHEN 管理员访问兑换记录 THEN THE System SHALL 显示所有用户的兑换记录
33. WHEN 管理员查看兑换记录 THEN THE System SHALL 支持按用户、商品、时间筛选
34. WHEN 用户兑换实物商品 THEN THE System SHALL 在后台显示待发货订单
35. WHEN 管理员发货 THEN THE System SHALL 支持填写物流单号并通知用户
36. WHEN 管理员访问积分统计 THEN THE System SHALL 显示积分发放总量、消耗总量、兑换总量
37. WHEN 管理员访问积分统计 THEN THE System SHALL 显示积分流转趋势图

**G. 积分活动和任务**

38. WHEN 管理员创建积分活动 THEN THE System SHALL 支持设置活动时间、奖励倍数
39. WHEN 积分活动进行中 THEN THE System SHALL 在前台显示活动横幅
40. WHEN 积分活动进行中 THEN THE System SHALL 按活动规则发放额外积分
41. WHEN 用户访问每日任务 THEN THE System SHALL 显示可完成的任务列表
42. WHEN 每日任务包含 THEN THE System SHALL 包括:
    - 每日签到: +10积分
    - 上传1个作品: +50积分
    - 下载3个资源: +5积分
    - 收藏5个作品: +5积分
    - 分享作品到社交媒体: +15积分
43. WHEN 用户完成任务 THEN THE System SHALL 自动发放任务奖励积分
44. WHEN 用户完成所有每日任务 THEN THE System SHALL 额外奖励+20积分

**H. 积分等级系统**

45. WHEN 用户累计获得积分 THEN THE System SHALL 根据累计积分提升用户等级
46. WHEN 用户等级系统 THEN THE System SHALL 包含以下等级:
    - LV1 新手: 0-499积分
    - LV2 初级: 500-1999积分
    - LV3 中级: 2000-4999积分
    - LV4 高级: 5000-9999积分
    - LV5 专家: 10000-19999积分
    - LV6 大师: 20000+积分
47. WHEN 用户等级提升 THEN THE System SHALL 发送等级提升通知
48. WHEN 用户等级提升 THEN THE System SHALL 解锁对应等级特权
49. WHEN 等级特权包含 THEN THE System SHALL 包括:
    - LV2: 下载资源-5%积分消耗
    - LV3: 下载资源-10%积分消耗,专属等级徽章
    - LV4: 下载资源-15%积分消耗,作品优先展示
    - LV5: 下载资源-20%积分消耗,专属客服
    - LV6: 下载资源-30%积分消耗,所有特权
50. WHEN 用户查看等级信息 THEN THE System SHALL 显示当前等级、累计积分、下一等级所需积分、等级特权

### 需求13: 后台管理系统 - 内容审核

**用户故事:** 作为内容审核员,我希望能够高效审核用户上传的资源,以便确保平台内容质量。

#### 验收标准

1. WHEN 审核员访问审核页面 THEN THE System SHALL 显示待审核资源列表
2. WHEN 待审核列表显示 THEN THE System SHALL 按提交时间倒序排列
3. WHEN 待审核列表显示 THEN THE System SHALL 包含资源缩略图、标题、上传者、提交时间
4. WHEN 审核员点击资源 THEN THE System SHALL 显示资源详细信息和预览图
5. WHEN 审核员查看资源详情 THEN THE System SHALL 显示所有上传的图片和文件信息
6. WHEN 审核员点击"通过" THEN THE System SHALL 将资源状态设置为"已通过"
7. WHEN 审核通过 THEN THE System SHALL 在首页和列表页展示该资源
8. WHEN 审核员点击"驳回" THEN THE System SHALL 要求输入驳回原因
9. WHEN 审核员提交驳回 THEN THE System SHALL 将资源状态设置为"已驳回"并记录原因
10. WHEN 资源被驳回 THEN THE System SHALL 通知上传者并显示驳回原因
11. WHEN 审核员筛选资源 THEN THE System SHALL 支持按分类、上传者、提交时间筛选
12. WHEN 审核员批量操作 THEN THE System SHALL 支持批量通过或批量驳回

### 需求14: 后台管理系统 - 资源管理

**用户故事:** 作为管理员,我希望能够管理平台上的所有资源,以便维护内容质量。

#### 验收标准

1. WHEN 管理员访问资源管理页面 THEN THE System SHALL 显示所有资源列表
2. WHEN 资源列表显示 THEN THE System SHALL 包含资源ID、标题、分类、上传者、下载次数、状态
3. WHEN 管理员搜索资源 THEN THE System SHALL 支持按标题、资源ID、上传者搜索
4. WHEN 管理员筛选资源 THEN THE System SHALL 支持按分类、审核状态、VIP等级筛选
5. WHEN 管理员点击"编辑" THEN THE System SHALL 允许修改资源标题、分类、标签、描述
6. WHEN 管理员点击"下架" THEN THE System SHALL 将资源从前台隐藏
7. WHEN 管理员点击"删除" THEN THE System SHALL 弹出确认对话框
8. WHEN 管理员确认删除 THEN THE System SHALL 永久删除资源及相关文件
9. WHEN 管理员点击"置顶" THEN THE System SHALL 将资源置顶显示
10. WHEN 管理员点击"推荐" THEN THE System SHALL 将资源添加到推荐位


### 需求15: 后台管理系统 - 分类管理

**用户故事:** 作为管理员,我希望能够管理资源分类,以便灵活组织平台内容。

#### 验收标准

1. WHEN 管理员访问分类管理页面 THEN THE System SHALL 显示所有分类列表
2. WHEN 分类列表显示 THEN THE System SHALL 以树形结构展示一级和二级分类
3. WHEN 管理员点击"添加分类" THEN THE System SHALL 弹出添加对话框
4. WHEN 管理员添加分类 THEN THE System SHALL 要求输入分类名称、图标、排序值
5. WHEN 管理员添加二级分类 THEN THE System SHALL 要求选择父级分类
6. WHEN 管理员点击"编辑" THEN THE System SHALL 允许修改分类信息
7. WHEN 管理员点击"删除" THEN THE System SHALL 检查该分类下是否有资源
8. WHEN 分类下有资源 THEN THE System SHALL 提示"该分类下有资源,无法删除"
9. WHEN 分类下无资源 THEN THE System SHALL 允许删除该分类
10. WHEN 管理员拖拽分类 THEN THE System SHALL 支持调整分类排序

### 需求16: 后台管理系统 - 数据统计

**用户故事:** 作为管理员,我希望能够查看平台运营数据,以便了解平台发展状况。

#### 验收标准

1. WHEN 管理员访问数据统计页面 THEN THE System SHALL 显示核心数据概览
2. WHEN 数据概览显示 THEN THE System SHALL 包含用户总数、资源总数、今日下载量、今日上传量
3. WHEN 数据概览显示 THEN THE System SHALL 包含VIP用户数、待审核资源数
4. WHEN 管理员查看用户增长趋势 THEN THE System SHALL 显示最近30天用户注册趋势图
5. WHEN 管理员查看资源增长趋势 THEN THE System SHALL 显示最近30天资源上传趋势图
6. WHEN 管理员查看下载统计 THEN THE System SHALL 显示最近30天下载量趋势图
7. WHEN 管理员查看热门资源 THEN THE System SHALL 显示下载量TOP10资源
8. WHEN 管理员查看热门分类 THEN THE System SHALL 显示资源数量TOP10分类
9. WHEN 管理员查看活跃用户 THEN THE System SHALL 显示下载量TOP10用户
10. WHEN 管理员选择时间范围 THEN THE System SHALL 支持查看自定义时间段的数据

### 需求17: 后台管理系统 - 内容运营

**用户故事:** 作为运营人员,我希望能够管理首页内容配置,以便灵活调整平台展示。

#### 验收标准

1. WHEN 运营人员访问轮播图管理 THEN THE System SHALL 显示所有轮播图列表
2. WHEN 运营人员点击"添加轮播图" THEN THE System SHALL 弹出添加对话框
3. WHEN 运营人员添加轮播图 THEN THE System SHALL 要求上传图片、设置链接、排序值、生效时间
4. WHEN 运营人员编辑轮播图 THEN THE System SHALL 允许修改所有配置项
5. WHEN 运营人员删除轮播图 THEN THE System SHALL 从前台移除该轮播图
6. WHEN 运营人员访问公告管理 THEN THE System SHALL 显示所有公告列表
7. WHEN 运营人员添加公告 THEN THE System SHALL 要求输入标题、内容、类型、生效时间
8. WHEN 运营人员设置公告类型 THEN THE System SHALL 支持普通/重要/警告三种类型
9. WHEN 运营人员访问推荐位管理 THEN THE System SHALL 显示所有推荐位配置
10. WHEN 运营人员配置推荐位 THEN THE System SHALL 支持自动推荐和手动选择两种模式

### 需求18: 后台管理系统 - 系统设置

**用户故事:** 作为管理员,我希望能够配置系统参数,以便灵活调整平台功能。

#### 验收标准

1. WHEN 管理员访问系统设置 THEN THE System SHALL 显示所有可配置项
2. WHEN 管理员配置网站信息 THEN THE System SHALL 支持修改网站名称、Logo、Favicon
3. WHEN 管理员配置SEO信息 THEN THE System SHALL 支持修改网站标题、关键词、描述
4. WHEN 管理员配置上传限制 THEN THE System SHALL 支持设置文件大小限制、允许格式
5. WHEN 管理员配置下载限制 THEN THE System SHALL 支持设置普通用户每日下载次数
6. WHEN 管理员配置VIP套餐 THEN THE System SHALL 支持设置套餐价格和特权
7. WHEN 管理员配置支付方式 THEN THE System SHALL 支持启用/禁用微信支付和支付宝支付
8. WHEN 管理员配置水印 THEN THE System SHALL 支持设置水印文字、透明度、位置
9. WHEN 管理员保存设置 THEN THE System SHALL 立即生效并通知前台更新
10. WHEN 管理员重置设置 THEN THE System SHALL 恢复默认配置


### 需求19: PostgreSQL数据库设计

**用户故事:** 作为系统架构师,我希望有完善的数据库设计,以便高效存储和查询数据。

#### 验收标准

1. WHEN 系统初始化 THEN THE System SHALL 创建users表存储用户信息(包含VIP等级、VIP到期时间、积分余额、累计积分、用户等级)
2. WHEN 系统初始化 THEN THE System SHALL 创建resources表存储资源信息
3. WHEN 系统初始化 THEN THE System SHALL 创建categories表存储分类信息
4. WHEN 系统初始化 THEN THE System SHALL 创建orders表存储订单信息(包含VIP订单和积分充值订单)
5. WHEN 系统初始化 THEN THE System SHALL 创建audit_logs表存储审核记录
6. WHEN 系统初始化 THEN THE System SHALL 创建download_history表存储下载记录
7. WHEN 系统初始化 THEN THE System SHALL 创建banners表存储轮播图配置
8. WHEN 系统初始化 THEN THE System SHALL 创建announcements表存储公告信息
9. WHEN 系统初始化 THEN THE System SHALL 创建system_config表存储系统配置
10. WHEN 系统初始化 THEN THE System SHALL 创建vip_packages表存储VIP套餐配置
11. WHEN 系统初始化 THEN THE System SHALL 创建vip_privileges表存储VIP特权配置
12. WHEN 系统初始化 THEN THE System SHALL 创建points_records表存储积分变动记录
13. WHEN 系统初始化 THEN THE System SHALL 创建points_products表存储积分商城商品
14. WHEN 系统初始化 THEN THE System SHALL 创建points_exchange_records表存储积分兑换记录
15. WHEN 系统初始化 THEN THE System SHALL 创建points_rules表存储积分规则配置
16. WHEN 系统初始化 THEN THE System SHALL 创建daily_tasks表存储每日任务配置
17. WHEN 系统初始化 THEN THE System SHALL 创建user_tasks表存储用户任务完成记录
18. WHEN 数据库表创建 THEN THE System SHALL 设置适当的索引以优化查询性能
19. WHEN 数据库表创建 THEN THE System SHALL 设置外键约束确保数据完整性
20. WHEN 数据库表创建 THEN THE System SHALL 使用MCP快速执行数据库操作

### 需求20: 用户个人管理后台

**用户故事:** 作为普通用户,我希望有自己的管理后台,以便管理我的作品、个人信息和个性化设置。

#### 验收标准

**A. 我的作品管理**

1. WHEN 用户登录后访问个人后台 THEN THE System SHALL 显示个人管理面板
2. WHEN 个人管理面板显示 THEN THE System SHALL 包含我的作品、我的下载、个人信息、账号安全、个人设置、内容运营
3. WHEN 用户访问"我的作品" THEN THE System SHALL 显示所有上传的作品及状态
4. WHEN 用户点击作品 THEN THE System SHALL 支持编辑作品信息(标题、描述、标签)
5. WHEN 作品未审核通过 THEN THE System SHALL 支持删除作品
6. WHEN 作品已审核通过 THEN THE System SHALL 不允许删除,仅允许编辑信息
7. WHEN 用户查看作品数据 THEN THE System SHALL 显示浏览量、下载量、收藏数

**B. 我的下载管理**

8. WHEN 用户访问"我的下载" THEN THE System SHALL 显示所有下载记录
9. WHEN 用户点击下载记录 THEN THE System SHALL 支持再次下载该资源
10. WHEN 用户查看下载记录 THEN THE System SHALL 显示下载时间、资源信息

**C. 个人信息管理**

11. WHEN 用户访问"个人信息" THEN THE System SHALL 支持修改昵称、头像、简介
12. WHEN 用户上传头像 THEN THE System SHALL 支持图片裁剪功能
13. WHEN 用户查看VIP信息 THEN THE System SHALL 显示VIP等级、到期时间、特权说明

**D. 账号安全管理**

14. WHEN 用户访问"账号安全" THEN THE System SHALL 支持修改密码、绑定邮箱、绑定微信
15. WHEN 用户修改密码 THEN THE System SHALL 要求输入旧密码和新密码
16. WHEN 用户绑定邮箱 THEN THE System SHALL 发送验证邮件
17. WHEN 用户绑定微信 THEN THE System SHALL 跳转到微信授权页面

**E. 个人设置(系统设置)**

18. WHEN 用户访问"个人设置" THEN THE System SHALL 显示个性化设置选项
19. WHEN 用户设置主题 THEN THE System SHALL 支持切换明亮/暗黑模式
20. WHEN 用户设置语言 THEN THE System SHALL 支持中文/英文切换
21. WHEN 用户设置通知 THEN THE System SHALL 支持开启/关闭邮件通知、站内通知
22. WHEN 用户设置隐私 THEN THE System SHALL 支持设置作品可见性(公开/仅自己可见)
23. WHEN 用户设置下载 THEN THE System SHALL 支持设置默认下载路径
24. WHEN 用户保存设置 THEN THE System SHALL 立即生效并保存到数据库

**F. 个人内容运营**

25. WHEN 用户访问"内容运营" THEN THE System SHALL 显示个人作品推广功能
26. WHEN 用户推广作品 THEN THE System SHALL 支持申请作品置顶(需VIP)
27. WHEN 用户推广作品 THEN THE System SHALL 支持申请作品推荐(需VIP)
28. WHEN 用户查看推广效果 THEN THE System SHALL 显示作品曝光量、点击量
29. WHEN 用户设置作品标签 THEN THE System SHALL 支持添加/修改作品标签
30. WHEN 用户设置作品分类 THEN THE System SHALL 支持修改作品分类

**G. 数据统计**

31. WHEN 用户查看数据统计 THEN THE System SHALL 显示作品总数、总下载量、总浏览量
32. WHEN 用户查看数据统计 THEN THE System SHALL 显示最近7天/30天的数据趋势图
33. WHEN 用户查看数据统计 THEN THE System SHALL 显示最受欢迎的作品TOP5
34. WHEN 用户查看数据统计 THEN THE System SHALL 显示粉丝数、获赞数

**注意:** 普通用户的"系统设置"和"内容运营"仅限于个人范围,不能修改全局系统设置或管理其他用户的内容。

### 需求21: 后台管理系统UI设计(创意美观)

**用户故事:** 作为管理员,我希望后台界面美观易用且富有创意,以便高效完成管理工作并享受使用过程。

#### 验收标准

**A. 整体设计风格**

1. WHEN 管理员访问后台 THEN THE System SHALL 使用现代化的扁平设计风格
2. WHEN 后台界面显示 THEN THE System SHALL 使用渐变色和毛玻璃效果增强视觉层次
3. WHEN 后台配色 THEN THE System SHALL 使用专业的配色方案(主色#165DFF蓝色+辅色#FF7D00橙色)
4. WHEN 后台界面 THEN THE System SHALL 使用微动画提升交互体验
5. WHEN 后台界面 THEN THE System SHALL 使用卡片式布局增强内容区分
6. WHEN 后台界面 THEN THE System SHALL 支持暗黑模式切换

**B. 布局设计**

7. WHEN 后台界面显示 THEN THE System SHALL 包含顶部导航栏、侧边菜单栏、主内容区域
8. WHEN 顶部导航栏显示 THEN THE System SHALL 包含Logo、面包屑导航、搜索框、通知、用户头像
9. WHEN 侧边菜单显示 THEN THE System SHALL 使用图标+文字的方式展示菜单项
10. WHEN 侧边菜单显示 THEN THE System SHALL 支持折叠/展开切换
11. WHEN 管理员点击菜单 THEN THE System SHALL 高亮当前选中菜单并显示动画效果
12. WHEN 主内容区域显示 THEN THE System SHALL 使用白色卡片承载内容
13. WHEN 后台使用 THEN THE System SHALL 支持响应式布局(适配桌面和平板)

**C. 数据可视化**

14. WHEN 数据统计页面显示 THEN THE System SHALL 使用ECharts图表库
15. WHEN 数据统计显示 THEN THE System SHALL 使用折线图展示趋势数据
16. WHEN 数据统计显示 THEN THE System SHALL 使用柱状图展示对比数据
17. WHEN 数据统计显示 THEN THE System SHALL 使用饼图展示占比数据
18. WHEN 数据统计显示 THEN THE System SHALL 使用仪表盘展示关键指标
19. WHEN 图表显示 THEN THE System SHALL 使用渐变色填充增强视觉效果
20. WHEN 图表显示 THEN THE System SHALL 支持鼠标悬浮显示详细数据
21. WHEN 图表显示 THEN THE System SHALL 支持图表导出为图片

**D. 表格设计**

22. WHEN 数据表格显示 THEN THE System SHALL 使用Element Plus Table组件
23. WHEN 数据表格显示 THEN THE System SHALL 支持排序、筛选、分页功能
24. WHEN 数据表格显示 THEN THE System SHALL 使用斑马纹增强可读性
25. WHEN 数据表格显示 THEN THE System SHALL 鼠标悬浮行高亮显示
26. WHEN 数据表格显示 THEN THE System SHALL 支持多选和批量操作
27. WHEN 数据表格显示 THEN THE System SHALL 使用不同颜色标识状态(成功/警告/危险)
28. WHEN 数据表格显示 THEN THE System SHALL 支持列宽拖拽调整
29. WHEN 数据表格显示 THEN THE System SHALL 支持固定列和固定表头

**E. 表单设计**

30. WHEN 表单显示 THEN THE System SHALL 使用清晰的标签和输入框
31. WHEN 表单显示 THEN THE System SHALL 使用图标增强输入框识别度
32. WHEN 表单验证 THEN THE System SHALL 实时显示验证结果
33. WHEN 表单验证失败 THEN THE System SHALL 显示红色错误提示
34. WHEN 表单验证成功 THEN THE System SHALL 显示绿色成功提示
35. WHEN 表单提交 THEN THE System SHALL 显示加载动画
36. WHEN 表单复杂 THEN THE System SHALL 使用步骤条引导填写

**F. 按钮和操作**

37. WHEN 操作按钮显示 THEN THE System SHALL 使用不同颜色区分操作类型
38. WHEN 主要操作 THEN THE System SHALL 使用蓝色按钮(#165DFF)
39. WHEN 危险操作 THEN THE System SHALL 使用红色按钮(#F53F3F)
40. WHEN 警告操作 THEN THE System SHALL 使用橙色按钮(#FF7D00)
41. WHEN 次要操作 THEN THE System SHALL 使用灰色按钮
42. WHEN 按钮悬浮 THEN THE System SHALL 显示阴影和颜色加深效果
43. WHEN 按钮点击 THEN THE System SHALL 显示波纹动画效果
44. WHEN 危险操作 THEN THE System SHALL 弹出二次确认对话框

**G. 通知和反馈**

45. WHEN 操作成功 THEN THE System SHALL 显示绿色成功提示(右上角)
46. WHEN 操作失败 THEN THE System SHALL 显示红色错误提示(右上角)
47. WHEN 操作警告 THEN THE System SHALL 显示橙色警告提示(右上角)
48. WHEN 提示显示 THEN THE System SHALL 3秒后自动消失
49. WHEN 提示显示 THEN THE System SHALL 使用滑入动画效果
50. WHEN 有新通知 THEN THE System SHALL 在通知图标显示红点提示

**H. 加载和骨架屏**

51. WHEN 数据加载中 THEN THE System SHALL 显示骨架屏而非空白
52. WHEN 骨架屏显示 THEN THE System SHALL 使用闪烁动画模拟加载
53. WHEN 数据加载完成 THEN THE System SHALL 平滑过渡到真实内容
54. WHEN 页面切换 THEN THE System SHALL 显示顶部进度条
55. WHEN 长时间操作 THEN THE System SHALL 显示加载动画和进度百分比

**I. 空状态设计**

56. WHEN 列表为空 THEN THE System SHALL 显示友好的空状态插画
57. WHEN 空状态显示 THEN THE System SHALL 包含提示文字和操作按钮
58. WHEN 空状态显示 THEN THE System SHALL 使用轻松愉快的插画风格
59. WHEN 搜索无结果 THEN THE System SHALL 显示"未找到相关内容"提示

**J. 创意交互**

60. WHEN 鼠标悬浮卡片 THEN THE System SHALL 显示轻微上浮和阴影效果
61. WHEN 页面滚动 THEN THE System SHALL 使用平滑滚动动画
62. WHEN 数据更新 THEN THE System SHALL 使用淡入淡出动画
63. WHEN 列表项删除 THEN THE System SHALL 使用滑出动画
64. WHEN 列表项添加 THEN THE System SHALL 使用滑入动画
65. WHEN 用户长时间无操作 THEN THE System SHALL 显示可爱的提示动画

**K. 个性化设置**

66. WHEN 管理员使用后台 THEN THE System SHALL 支持自定义主题色
67. WHEN 管理员使用后台 THEN THE System SHALL 支持切换暗黑/明亮模式
68. WHEN 管理员使用后台 THEN THE System SHALL 支持调整字体大小
69. WHEN 管理员使用后台 THEN THE System SHALL 支持自定义侧边栏宽度
70. WHEN 个性化设置 THEN THE System SHALL 保存到本地存储

### 需求22: 权限控制系统(RBAC)

**用户故事:** 作为系统管理员,我希望有完善的权限控制,以便安全管理不同角色的访问权限。

#### 验收标准

**A. 角色和权限初始化**

1. WHEN 系统初始化 THEN THE System SHALL 创建角色表(roles)、权限表(permissions)、角色权限关联表(role_permissions)
2. WHEN 系统初始化 THEN THE System SHALL 预设以下角色:
   - 超级管理员(super_admin): 所有权限
   - 内容审核员(moderator): 内容审核权限
   - 运营人员(operator): 内容运营权限
   - 普通用户(user): 个人中心权限
3. WHEN 系统初始化 THEN THE System SHALL 预设以下权限模块:
   - 用户管理(user_manage): 查看用户、编辑用户、禁用用户、删除用户
   - 资源管理(resource_manage): 查看资源、编辑资源、删除资源、置顶资源
   - 内容审核(content_audit): 查看待审核、审核通过、审核驳回
   - 分类管理(category_manage): 查看分类、添加分类、编辑分类、删除分类
   - 数据统计(data_statistics): 查看统计数据、导出报表
   - 内容运营(content_operation): 管理轮播图、管理公告、管理推荐位
   - 系统设置(system_settings): 查看设置、修改设置
   - 权限管理(permission_manage): 分配角色、管理权限

**B. 登录身份验证**

4. WHEN 用户登录后台管理系统 THEN THE System SHALL 验证用户身份和角色
5. WHEN 用户角色为普通用户 THEN THE System SHALL 仅允许访问个人管理后台
6. WHEN 用户角色为审核员 THEN THE System SHALL 允许访问内容审核模块
7. WHEN 用户角色为运营人员 THEN THE System SHALL 允许访问内容运营模块
8. WHEN 用户角色为超级管理员 THEN THE System SHALL 允许访问所有管理模块
9. WHEN 用户登录 THEN THE System SHALL 在JWT Token中包含用户ID、角色ID、权限列表
10. WHEN 用户Token过期 THEN THE System SHALL 要求重新登录

**C. 页面访问权限控制**

11. WHEN 用户访问后台页面 THEN THE System SHALL 检查用户是否有访问权限
12. WHEN 用户无访问权限 THEN THE System SHALL 显示403禁止访问页面
13. WHEN 用户访问侧边菜单 THEN THE System SHALL 仅显示有权限的菜单项
14. WHEN 用户访问功能按钮 THEN THE System SHALL 仅显示有权限的操作按钮
15. WHEN 前端路由守卫检查 THEN THE System SHALL 验证用户权限后再允许访问

**D. API接口权限控制**

16. WHEN 用户调用API接口 THEN THE System SHALL 验证Token有效性
17. WHEN 用户调用API接口 THEN THE System SHALL 验证用户是否有该接口权限
18. WHEN 用户无接口权限 THEN THE System SHALL 返回403错误和错误信息
19. WHEN 接口需要特定权限 THEN THE System SHALL 在接口上标注所需权限
20. WHEN 后端中间件执行 THEN THE System SHALL 自动验证权限无需手动检查

**E. 权限管理功能**

21. WHEN 超级管理员访问权限管理 THEN THE System SHALL 显示所有角色和权限
22. WHEN 超级管理员创建新角色 THEN THE System SHALL 允许选择权限组合
23. WHEN 超级管理员编辑角色 THEN THE System SHALL 允许修改角色权限
24. WHEN 超级管理员为用户分配角色 THEN THE System SHALL 立即生效
25. WHEN 超级管理员删除角色 THEN THE System SHALL 检查是否有用户使用该角色
26. WHEN 角色被使用 THEN THE System SHALL 提示"该角色正在使用,无法删除"

**F. 权限变更和日志**

27. WHEN 用户权限变更 THEN THE System SHALL 记录操作日志(操作人、时间、变更内容)
28. WHEN 用户下次请求 THEN THE System SHALL 使用新权限(无需重新登录)
29. WHEN 管理员查看权限日志 THEN THE System SHALL 显示所有权限变更记录
30. WHEN 权限异常 THEN THE System SHALL 发送告警通知管理员

**G. 特殊权限场景**

31. WHEN 用户同时拥有多个角色 THEN THE System SHALL 合并所有角色的权限
32. WHEN 用户被禁用 THEN THE System SHALL 立即撤销所有权限
33. WHEN 用户VIP到期 THEN THE System SHALL 自动降级为普通用户权限
34. WHEN 审核员审核自己的作品 THEN THE System SHALL 提示"不能审核自己的作品"
35. WHEN 管理员操作敏感功能 THEN THE System SHALL 要求二次验证(输入密码)


### 需求23: 部署方案(小白友好)

**用户故事:** 作为非技术人员,我希望有详细易懂的部署方案和自动化部署脚本,以便顺利部署系统到生产环境。

#### 验收标准

**A. 部署文档(小白友好)**

1. WHEN 准备部署 THEN THE System SHALL 提供完整的部署文档(中文、图文并茂)
2. WHEN 部署文档提供 THEN THE System SHALL 包含服务器购买指南(推荐阿里云/腾讯云)
3. WHEN 部署文档提供 THEN THE System SHALL 包含服务器配置要求(CPU、内存、硬盘、带宽)
4. WHEN 部署文档提供 THEN THE System SHALL 包含域名购买和备案指南
5. WHEN 部署文档提供 THEN THE System SHALL 包含SSL证书申请和配置指南(Let's Encrypt免费证书)
6. WHEN 部署文档提供 THEN THE System SHALL 使用截图和视频演示每个步骤
7. WHEN 部署文档提供 THEN THE System SHALL 标注每个步骤的预计耗时
8. WHEN 部署文档提供 THEN THE System SHALL 提供常见错误和解决方案

**B. 一键部署脚本**

9. WHEN 部署脚本提供 THEN THE System SHALL 包含服务器环境安装脚本(install.sh)
10. WHEN 安装脚本执行 THEN THE System SHALL 自动安装Node.js、PostgreSQL、Nginx、PM2
11. WHEN 安装脚本执行 THEN THE System SHALL 自动配置防火墙规则
12. WHEN 安装脚本执行 THEN THE System SHALL 自动创建数据库和用户
13. WHEN 部署脚本提供 THEN THE System SHALL 包含应用部署脚本(deploy.sh)
14. WHEN 部署脚本执行 THEN THE System SHALL 自动拉取代码、安装依赖、构建前端
15. WHEN 部署脚本执行 THEN THE System SHALL 自动配置Nginx反向代理
16. WHEN 部署脚本执行 THEN THE System SHALL 自动启动后端服务(使用PM2)
17. WHEN 部署脚本执行 THEN THE System SHALL 自动初始化数据库表和测试数据
18. WHEN 部署完成 THEN THE System SHALL 输出访问地址和管理员账号

**C. 环境配置**

19. WHEN 部署文档提供 THEN THE System SHALL 包含环境变量配置模板(.env.example)
20. WHEN 环境变量配置 THEN THE System SHALL 包含数据库连接信息
21. WHEN 环境变量配置 THEN THE System SHALL 包含JWT密钥
22. WHEN 环境变量配置 THEN THE System SHALL 包含文件存储路径
23. WHEN 环境变量配置 THEN THE System SHALL 包含支付配置(微信/支付宝)
24. WHEN 环境变量配置 THEN THE System SHALL 包含邮件服务配置
25. WHEN 环境变量配置 THEN THE System SHALL 提供详细的配置说明注释

**D. 数据库初始化**

26. WHEN 数据库初始化 THEN THE System SHALL 提供SQL初始化脚本(init.sql)
27. WHEN 初始化脚本执行 THEN THE System SHALL 创建所有数据库表
28. WHEN 初始化脚本执行 THEN THE System SHALL 创建必要的索引和约束
29. WHEN 初始化脚本执行 THEN THE System SHALL 插入测试账号数据
30. WHEN 初始化脚本执行 THEN THE System SHALL 插入预设分类数据
31. WHEN 初始化脚本执行 THEN THE System SHALL 插入系统配置数据

**E. Nginx配置**

32. WHEN Nginx配置提供 THEN THE System SHALL 包含完整的nginx.conf示例
33. WHEN Nginx配置 THEN THE System SHALL 配置HTTPS和SSL证书
34. WHEN Nginx配置 THEN THE System SHALL 配置HTTP自动跳转HTTPS
35. WHEN Nginx配置 THEN THE System SHALL 配置静态文件缓存策略
36. WHEN Nginx配置 THEN THE System SHALL 配置API反向代理
37. WHEN Nginx配置 THEN THE System SHALL 配置Gzip压缩
38. WHEN Nginx配置 THEN THE System SHALL 配置大文件上传支持(client_max_body_size 1000M)
39. WHEN Nginx配置 THEN THE System SHALL 配置安全响应头(X-Frame-Options、CSP等)

**F. 备份和恢复**

40. WHEN 备份方案提供 THEN THE System SHALL 包含数据库自动备份脚本(backup.sh)
41. WHEN 备份脚本执行 THEN THE System SHALL 每天自动备份数据库
42. WHEN 备份脚本执行 THEN THE System SHALL 保留最近7天的备份文件
43. WHEN 备份脚本执行 THEN THE System SHALL 将备份文件上传到云存储(可选)
44. WHEN 恢复方案提供 THEN THE System SHALL 包含数据库恢复脚本(restore.sh)
45. WHEN 恢复脚本执行 THEN THE System SHALL 从备份文件恢复数据库

**G. 监控和维护**

46. WHEN 部署完成 THEN THE System SHALL 配置PM2进程守护
47. WHEN 服务异常退出 THEN THE System SHALL 自动重启服务
48. WHEN 部署完成 THEN THE System SHALL 配置日志轮转(logrotate)
49. WHEN 日志文件过大 THEN THE System SHALL 自动压缩和归档
50. WHEN 部署完成 THEN THE System SHALL 提供健康检查接口(/api/health)

**H. 部署支持**

51. WHEN 用户遇到部署问题 THEN THE System SHALL 提供远程协助服务
52. WHEN 用户需要 THEN THE System SHALL 提供部署视频教程
53. WHEN 用户需要 THEN THE System SHALL 提供部署问题排查清单
54. WHEN 部署成功 THEN THE System SHALL 提供系统使用培训

### 需求24: API接口设计与对接

**用户故事:** 作为前端开发者,我希望有清晰的API接口文档并能顺利对接,以便正确调用后端服务。

#### 验收标准

**A. API接口文档**

1. WHEN API设计完成 THEN THE System SHALL 提供完整的API文档
2. WHEN API文档提供 THEN THE System SHALL 包含所有接口的请求方法、路径、参数
3. WHEN API文档提供 THEN THE System SHALL 包含请求示例和响应示例
4. WHEN API文档提供 THEN THE System SHALL 包含错误码说明
5. WHEN API设计 THEN THE System SHALL 使用RESTful风格
6. WHEN API响应 THEN THE System SHALL 使用统一的响应格式{code, msg, data, timestamp}
7. WHEN API认证 THEN THE System SHALL 使用JWT Token认证
8. WHEN API限流 THEN THE System SHALL 实现接口访问频率限制
9. WHEN API文档 THEN THE System SHALL 使用Swagger或Apifox生成
10. WHEN API版本 THEN THE System SHALL 支持版本控制(/api/v1/)

**B. 前端预留接口对接**

11. WHEN 后端开发 THEN THE System SHALL 检查前端已预留的所有API接口
12. WHEN 后端开发 THEN THE System SHALL 确保接口路径、参数、响应格式与前端预期一致
13. WHEN 接口不一致 THEN THE System SHALL 记录差异并与前端协商调整
14. WHEN 后端实现接口 THEN THE System SHALL 严格按照前端预留的接口规范实现
15. WHEN 接口实现完成 THEN THE System SHALL 提供Mock数据供前端测试

**C. 接口联调与测试**

16. WHEN 后端接口开发完成 THEN THE System SHALL 进行接口联调测试
17. WHEN 联调测试 THEN THE System SHALL 使用Postman或Apifox测试所有接口
18. WHEN 联调测试 THEN THE System SHALL 测试正常场景和异常场景
19. WHEN 联调测试 THEN THE System SHALL 测试权限验证是否正确
20. WHEN 联调测试 THEN THE System SHALL 测试数据格式是否符合前端要求
21. WHEN 接口测试通过 THEN THE System SHALL 通知前端可以对接
22. WHEN 前端对接 THEN THE System SHALL 提供技术支持解决对接问题

**D. 接口文档维护**

23. WHEN 接口变更 THEN THE System SHALL 及时更新API文档
24. WHEN 接口变更 THEN THE System SHALL 通知前端开发者
25. WHEN 接口废弃 THEN THE System SHALL 标记为deprecated并保留一段时间
26. WHEN 新增接口 THEN THE System SHALL 在文档中明确标注
27. WHEN 接口文档更新 THEN THE System SHALL 记录变更日志

### 需求25: 全面测试方案

**用户故事:** 作为测试人员,我希望有完善的测试方案,以便确保系统质量和安全性。

#### 验收标准

**A. 功能测试**

1. WHEN 测试方案制定 THEN THE System SHALL 包含完整的功能测试用例
2. WHEN 功能测试 THEN THE System SHALL 测试所有前端页面功能
3. WHEN 功能测试 THEN THE System SHALL 测试所有后台管理功能
4. WHEN 功能测试 THEN THE System SHALL 测试用户注册登录流程
5. WHEN 功能测试 THEN THE System SHALL 测试资源上传审核流程
6. WHEN 功能测试 THEN THE System SHALL 测试资源下载权限控制
7. WHEN 功能测试 THEN THE System SHALL 测试VIP购买支付流程
8. WHEN 功能测试 THEN THE System SHALL 测试搜索和筛选功能
9. WHEN 功能测试 THEN THE System SHALL 测试个人中心所有功能
10. WHEN 功能测试 THEN THE System SHALL 测试后台权限控制

**B. 接口测试**

11. WHEN 接口测试 THEN THE System SHALL 测试所有API接口
12. WHEN 接口测试 THEN THE System SHALL 测试接口正常响应
13. WHEN 接口测试 THEN THE System SHALL 测试接口异常处理
14. WHEN 接口测试 THEN THE System SHALL 测试接口参数验证
15. WHEN 接口测试 THEN THE System SHALL 测试接口权限验证
16. WHEN 接口测试 THEN THE System SHALL 测试接口响应时间
17. WHEN 接口测试 THEN THE System SHALL 使用Postman或Apifox进行测试
18. WHEN 接口测试 THEN THE System SHALL 生成接口测试报告

**C. 安全测试**

19. WHEN 安全测试 THEN THE System SHALL 测试SQL注入漏洞
20. WHEN 安全测试 THEN THE System SHALL 测试XSS跨站脚本攻击
21. WHEN 安全测试 THEN THE System SHALL 测试CSRF跨站请求伪造
22. WHEN 安全测试 THEN THE System SHALL 测试文件上传安全(恶意文件、超大文件)
23. WHEN 安全测试 THEN THE System SHALL 测试密码加密存储
24. WHEN 安全测试 THEN THE System SHALL 测试Token安全性
25. WHEN 安全测试 THEN THE System SHALL 测试权限绕过漏洞
26. WHEN 安全测试 THEN THE System SHALL 测试敏感信息泄露
27. WHEN 安全测试 THEN THE System SHALL 测试暴力破解防护
28. WHEN 安全测试 THEN THE System SHALL 使用OWASP Top 10作为测试标准
29. WHEN 安全测试 THEN THE System SHALL 使用安全扫描工具(如AWVS、Burp Suite)
30. WHEN 安全测试 THEN THE System SHALL 生成安全测试报告

**D. 性能测试**

31. WHEN 性能测试 THEN THE System SHALL 测试系统并发访问能力
32. WHEN 性能测试 THEN THE System SHALL 测试100并发用户访问
33. WHEN 性能测试 THEN THE System SHALL 测试500并发用户访问
34. WHEN 性能测试 THEN THE System SHALL 测试1000并发用户访问
35. WHEN 性能测试 THEN THE System SHALL 测试页面加载时间
36. WHEN 性能测试 THEN THE System SHALL 测试API响应时间
37. WHEN 性能测试 THEN THE System SHALL 测试数据库查询性能
38. WHEN 性能测试 THEN THE System SHALL 测试大文件上传性能
39. WHEN 性能测试 THEN THE System SHALL 测试大文件下载性能
40. WHEN 性能测试 THEN THE System SHALL 使用JMeter或LoadRunner进行压力测试
41. WHEN 性能测试 THEN THE System SHALL 生成性能测试报告

**E. 压力测试**

42. WHEN 压力测试 THEN THE System SHALL 测试系统极限负载
43. WHEN 压力测试 THEN THE System SHALL 逐步增加并发用户数
44. WHEN 压力测试 THEN THE System SHALL 记录系统崩溃临界点
45. WHEN 压力测试 THEN THE System SHALL 测试长时间高负载运行
46. WHEN 压力测试 THEN THE System SHALL 测试系统恢复能力
47. WHEN 压力测试 THEN THE System SHALL 监控服务器资源使用(CPU、内存、磁盘、网络)
48. WHEN 压力测试 THEN THE System SHALL 生成压力测试报告

**F. 兼容性测试**

49. WHEN 兼容性测试 THEN THE System SHALL 测试Chrome浏览器
50. WHEN 兼容性测试 THEN THE System SHALL 测试Firefox浏览器
51. WHEN 兼容性测试 THEN THE System SHALL 测试Safari浏览器
52. WHEN 兼容性测试 THEN THE System SHALL 测试Edge浏览器
53. WHEN 兼容性测试 THEN THE System SHALL 测试移动端浏览器(iOS Safari、Android Chrome)
54. WHEN 兼容性测试 THEN THE System SHALL 测试不同屏幕分辨率
55. WHEN 兼容性测试 THEN THE System SHALL 测试不同操作系统(Windows、macOS、Linux)

**G. 用户体验测试**

56. WHEN 用户体验测试 THEN THE System SHALL 测试页面加载速度
57. WHEN 用户体验测试 THEN THE System SHALL 测试操作流畅度
58. WHEN 用户体验测试 THEN THE System SHALL 测试错误提示友好性
59. WHEN 用户体验测试 THEN THE System SHALL 测试移动端触摸体验
60. WHEN 用户体验测试 THEN THE System SHALL 测试无障碍访问(Accessibility)

**H. 回归测试**

61. WHEN 系统更新 THEN THE System SHALL 执行回归测试
62. WHEN 回归测试 THEN THE System SHALL 测试核心功能未受影响
63. WHEN 回归测试 THEN THE System SHALL 使用自动化测试脚本
64. WHEN 回归测试 THEN THE System SHALL 生成回归测试报告

**I. 测试报告**

65. WHEN 测试完成 THEN THE System SHALL 生成完整的测试报告
66. WHEN 测试报告 THEN THE System SHALL 包含测试用例执行情况
67. WHEN 测试报告 THEN THE System SHALL 包含发现的Bug列表
68. WHEN 测试报告 THEN THE System SHALL 包含Bug严重程度分级
69. WHEN 测试报告 THEN THE System SHALL 包含性能测试数据
70. WHEN 测试报告 THEN THE System SHALL 包含安全测试结果
71. WHEN 测试报告 THEN THE System SHALL 包含改进建议

### 需求26: 监控和日志

**用户故事:** 作为运维人员,我希望有完善的监控和日志系统,以便及时发现和解决问题。

#### 验收标准

1. WHEN 系统运行 THEN THE System SHALL 记录所有API请求日志
2. WHEN 系统运行 THEN THE System SHALL 记录所有错误日志
3. WHEN 系统运行 THEN THE System SHALL 记录用户操作日志
4. WHEN 系统运行 THEN THE System SHALL 记录审核操作日志
5. WHEN 日志记录 THEN THE System SHALL 包含时间戳、用户ID、操作类型、IP地址
6. WHEN 系统监控 THEN THE System SHALL 监控服务器CPU、内存、磁盘使用率
7. WHEN 系统监控 THEN THE System SHALL 监控数据库连接数和查询性能
8. WHEN 系统监控 THEN THE System SHALL 监控API响应时间
9. WHEN 异常发生 THEN THE System SHALL 发送告警通知(邮件/短信)
10. WHEN 日志查询 THEN THE System SHALL 支持按时间、用户、操作类型筛选日志

## 需求优先级

### P0 - 必须实现(核心功能)
- 需求1: 前端UI修复
- 需求2: 侧边栏滚动优化
- 需求3: 分类筛选功能完善
- 需求4: 登录注册功能完善
- 需求5: 资源上传审核流程
- 需求11: 测试账号配置
- 需求12: 后台管理系统 - 用户管理
- 需求12.1: 后台管理系统 - VIP功能管理
- 需求12.2: 积分系统
- 需求13: 后台管理系统 - 内容审核
- 需求14: 后台管理系统 - 资源管理
- 需求19: PostgreSQL数据库设计
- 需求22: 权限控制系统

### P1 - 应该实现(重要功能)
- 需求6: 个人中心功能完善
- 需求7: VIP中心功能实现
- 需求8: 支付功能实现
- 需求10: 资源详情页图片展示
- 需求15: 后台管理系统 - 分类管理
- 需求16: 后台管理系统 - 数据统计
- 需求20: 用户个人管理后台
- 需求21: 后台管理系统UI设计
- 需求24: API接口设计

### P2 - 可以实现(辅助功能)
- 需求9: 页面底部导航完善
- 需求17: 后台管理系统 - 内容运营
- 需求18: 后台管理系统 - 系统设置
- 需求23: 部署方案
- 需求25: 测试方案
- 需求26: 监控和日志

## 技术栈补充

### 后端技术栈
- **运行环境**: Node.js 18+ / Python 3.10+
- **Web框架**: Express.js / Fastify / Django / FastAPI
- **数据库**: PostgreSQL 14+
- **ORM**: Prisma / TypeORM / SQLAlchemy
- **认证**: JWT + bcrypt
- **文件存储**: 本地存储 / 阿里云OSS / 腾讯云COS
- **支付**: 微信支付SDK + 支付宝SDK
- **任务队列**: Bull / Celery(异步任务处理)

### 开发工具
- **API文档**: Swagger / Apifox
- **数据库工具**: DBeaver / pgAdmin
- **MCP工具**: 使用已配置的MCP进行数据库操作
- **版本控制**: Git + GitHub/GitLab
- **项目管理**: Jira / Trello / 飞书

## 总结

本需求文档共28个需求(包含2个新增子需求),涵盖前端修复、后台管理系统、VIP功能管理、积分系统、数据库设计、部署方案等完整内容。按照优先级分为P0(核心)、P1(重要)、P2(辅助)三个等级,建议按优先级顺序实施开发。

### VIP功能亮点
- 免费下载所有站内资源
- 专属VIP资源访问
- 优先审核通道
- 去除下载限制和广告
- 作品置顶推广
- 高速下载和批量下载
- 专属客服支持

### 积分系统亮点
- 多种积分获取方式(上传作品、每日签到、邀请好友等)
- 积分可兑换VIP会员
- 积分可兑换下载次数包
- 积分可兑换实物商品
- 用户等级系统(LV1-LV6)
- 等级特权(下载折扣、优先展示等)
- 每日任务系统
- 积分充值功能
