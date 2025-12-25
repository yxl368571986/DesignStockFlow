# Requirements Document

## Introduction

本文档定义了VIP会员支付系统的完整需求，包括微信支付、支付宝支付、积分兑换VIP、VIP权限校验、VIP状态管理、订单管理、支付安全等核心功能模块。系统需要支持PC端扫码支付和移动端H5支付，实现完整的VIP购买、续费、退款流程，并确保支付安全和用户体验。

## Glossary

- **VIP_System**: VIP会员管理系统，负责VIP状态、权限、到期管理
- **Payment_Gateway**: 支付网关，统一处理微信支付和支付宝支付的接口调用
- **Order_Service**: 订单服务，负责订单创建、状态管理、对账
- **Download_Service**: 下载服务，负责资源下载权限校验
- **Notification_Service**: 通知服务，负责站内信发送
- **Security_Monitor**: 安全监控服务，负责异常支付行为检测
- **Device_Manager**: 设备管理服务，负责多设备登录控制
- **Native_Payment**: 微信Native支付，PC端扫码支付模式
- **H5_Payment**: 移动端网页支付，在手机浏览器中唤起支付
- **Alipay_PC**: 支付宝电脑网站支付
- **Alipay_WAP**: 支付宝手机网站支付

## Requirements

### Requirement 1: VIP套餐展示与选择

**User Story:** As a 用户, I want to 在VIP中心页面查看所有可用的VIP套餐并选择购买, so that I can 了解各套餐的价格和权益后做出购买决策。

#### Acceptance Criteria

1. WHEN 用户访问VIP中心页面 THEN THE VIP_System SHALL 从后端API获取所有启用状态的VIP套餐列表并按排序顺序展示
2. WHEN 套餐列表加载完成 THEN THE VIP_System SHALL 展示每个套餐的名称、原价（划线价）、现价、有效时长、权益描述
3. WHEN 用户已是终身会员 THEN THE VIP_System SHALL 隐藏终身会员套餐的购买入口并显示"您已是终身会员"提示
4. WHEN 用户已是VIP且未到期 THEN THE VIP_System SHALL 在套餐卡片上显示"续费"按钮替代"立即开通"按钮
5. WHEN 用户点击套餐卡片或购买按钮 THEN THE VIP_System SHALL 选中该套餐并高亮显示，同时更新底部支付区域的金额
6. IF 套餐列表加载失败 THEN THE VIP_System SHALL 显示友好的错误提示并提供重试按钮

### Requirement 2: 支付方式选择与订单创建

**User Story:** As a 用户, I want to 选择微信支付、支付宝支付或积分兑换来购买VIP, so that I can 使用我偏好的支付方式完成购买。

#### Acceptance Criteria

1. WHEN 用户选择了VIP套餐 THEN THE Payment_Gateway SHALL 展示可用的支付方式（微信支付、支付宝支付、积分兑换）
2. WHEN 某个支付渠道不可用（如维护中） THEN THE Payment_Gateway SHALL 将该支付方式置灰并显示"暂不可用"提示
3. WHEN 用户选择支付方式并点击"立即支付" THEN THE Order_Service SHALL 创建订单并返回订单号
4. WHEN 订单创建成功 THEN THE Order_Service SHALL 记录订单信息（用户ID、套餐ID、金额、支付方式、设备信息、IP地址）
5. WHEN 支付金额≥200元 THEN THE Payment_Gateway SHALL 要求用户输入手机验证码进行二次确认
6. IF 用户未登录 THEN THE VIP_System SHALL 弹出登录框，登录成功后继续支付流程
7. IF 订单创建失败 THEN THE Order_Service SHALL 返回具体错误原因并提示用户重试

### Requirement 3: 微信支付流程

**User Story:** As a 用户, I want to 通过微信支付购买VIP, so that I can 使用微信完成快捷支付。

#### Acceptance Criteria

1. WHEN 用户在PC端选择微信支付 THEN THE Payment_Gateway SHALL 调用微信Native支付接口生成支付二维码
2. WHEN 支付二维码生成成功 THEN THE VIP_System SHALL 在弹窗中展示二维码，并显示"请使用微信扫码支付"提示和倒计时（15分钟）
3. WHEN 用户在移动端选择微信支付 THEN THE Payment_Gateway SHALL 调用微信H5支付接口，跳转至微信支付页面
4. WHILE 用户在PC端扫码支付页面 THEN THE VIP_System SHALL 每3秒轮询订单状态，检测支付结果
5. WHEN 微信支付回调通知到达 THEN THE Payment_Gateway SHALL 验证签名后更新订单状态
6. IF 支付二维码生成失败 THEN THE Payment_Gateway SHALL 显示错误提示并建议用户切换支付宝支付
7. IF 支付超时（15分钟） THEN THE Order_Service SHALL 自动取消订单并提示用户重新下单

### Requirement 4: 支付宝支付流程

**User Story:** As a 用户, I want to 通过支付宝支付购买VIP, so that I can 使用支付宝完成快捷支付。

#### Acceptance Criteria

1. WHEN 用户在PC端选择支付宝支付 THEN THE Payment_Gateway SHALL 调用支付宝电脑网站支付接口，跳转至支付宝收银台页面
2. WHEN 用户在移动端选择支付宝支付 THEN THE Payment_Gateway SHALL 调用支付宝手机网站支付接口，跳转至支付宝H5支付页面
3. WHEN 支付宝同步回调返回 THEN THE VIP_System SHALL 显示"支付处理中"状态并查询订单最终状态
4. WHEN 支付宝异步回调通知到达 THEN THE Payment_Gateway SHALL 验证签名后更新订单状态
5. IF 支付宝接口调用失败 THEN THE Payment_Gateway SHALL 显示错误提示并建议用户切换微信支付
6. IF 用户在支付宝页面取消支付 THEN THE VIP_System SHALL 返回VIP中心页面并保留订单（待支付状态）

### Requirement 5: 积分兑换VIP

**User Story:** As a 用户, I want to 使用积分兑换VIP会员, so that I can 不花钱也能享受VIP权益。

#### Acceptance Criteria

1. WHEN 用户选择积分兑换 THEN THE VIP_System SHALL 显示当前积分余额和所需积分数量
2. WHEN 用户积分不足 THEN THE VIP_System SHALL 将积分兑换选项置灰并显示"积分不足，还需X积分"
3. WHEN 用户本月已兑换过VIP THEN THE VIP_System SHALL 将积分兑换选项置灰并显示"本月已兑换，下月再来"
4. WHEN 用户选择兑换时长超过3个月 THEN THE VIP_System SHALL 限制最大兑换时长为3个月
5. WHEN 用户确认积分兑换 THEN THE Order_Service SHALL 创建积分兑换订单，扣除积分，开通VIP
6. IF 积分扣除失败 THEN THE Order_Service SHALL 回滚操作并提示用户重试

### Requirement 6: 支付成功处理

**User Story:** As a 用户, I want to 支付成功后立即获得VIP权益, so that I can 马上开始使用VIP功能。

#### Acceptance Criteria

1. WHEN 支付成功确认 THEN THE VIP_System SHALL 立即更新用户VIP状态和到期时间
2. WHEN 用户已是VIP再次购买 THEN THE VIP_System SHALL 在当前到期日基础上延长相应时长
3. WHEN VIP开通成功 THEN THE Notification_Service SHALL 发送站内信通知用户VIP已开通
4. WHEN 支付成功 THEN THE VIP_System SHALL 显示支付成功页面，包含订单号、VIP到期时间、返回按钮
5. WHEN 用户从资源详情页跳转来支付 THEN THE VIP_System SHALL 支付成功后提供"返回继续下载"按钮
6. IF 支付成功但VIP开通失败 THEN THE VIP_System SHALL 记录异常日志并通知管理员人工处理

### Requirement 7: 订单状态管理

**User Story:** As a 用户, I want to 查看我的VIP订单记录和状态, so that I can 了解我的购买历史和订单详情。

#### Acceptance Criteria

1. WHEN 用户访问"我的订单"页面 THEN THE Order_Service SHALL 分页展示用户的所有VIP订单
2. WHEN 订单列表加载完成 THEN THE Order_Service SHALL 展示订单号、套餐名称、金额、支付方式、订单状态、创建时间
3. WHEN 订单状态为"待支付" THEN THE Order_Service SHALL 显示"继续支付"和"取消订单"按钮
4. WHEN 用户点击"取消订单" THEN THE Order_Service SHALL 将订单状态更新为"已取消"
5. WHEN 订单创建超过15分钟未支付 THEN THE Order_Service SHALL 自动将订单状态更新为"已取消"
6. THE Order_Service SHALL 支持按订单状态筛选（全部、待支付、已支付、已取消、已退款）

### Requirement 8: 订单对账机制

**User Story:** As a 系统管理员, I want to 系统自动对账确保订单状态准确, so that I can 避免用户付款但订单状态未更新的情况。

#### Acceptance Criteria

1. THE Order_Service SHALL 每5分钟执行一次订单对账任务
2. WHEN 对账任务执行时 THEN THE Order_Service SHALL 查询所有"待支付"状态超过5分钟的订单
3. WHEN 发现待支付订单 THEN THE Order_Service SHALL 调用微信/支付宝查询接口确认实际支付状态
4. WHEN 查询结果为已支付但本地为待支付 THEN THE Order_Service SHALL 更新订单状态并开通VIP
5. WHEN 查询结果为未支付且超过15分钟 THEN THE Order_Service SHALL 关闭订单
6. IF 对账发现异常 THEN THE Order_Service SHALL 记录日志并发送告警通知管理员

### Requirement 9: VIP权限校验（资源下载）

**User Story:** As a 用户, I want to 下载资源时系统自动校验我的VIP权限, so that I can 享受VIP免费下载或使用免费下载次数。

#### Acceptance Criteria

1. WHEN 用户点击下载按钮 THEN THE Download_Service SHALL 校验用户登录状态
2. WHEN 用户已登录 THEN THE Download_Service SHALL 校验用户VIP状态和到期时间
3. WHEN 用户是有效VIP THEN THE Download_Service SHALL 允许下载并记录下载次数
4. WHEN VIP用户单日下载次数达到50次 THEN THE Download_Service SHALL 拒绝下载并提示"今日下载次数已达上限"
5. WHEN 用户是普通用户且资源为免费资源 THEN THE Download_Service SHALL 允许下载
6. WHEN 用户是普通用户且资源为VIP资源 THEN THE Download_Service SHALL 检查今日免费下载次数
7. WHEN 普通用户今日免费下载次数未用完（2次） THEN THE Download_Service SHALL 允许下载并扣减次数
8. WHEN 普通用户今日免费下载次数已用完 THEN THE Download_Service SHALL 显示"开通VIP免费下载"提示并提供跳转VIP中心入口
9. IF 下载权限校验失败 THEN THE Download_Service SHALL 返回具体原因（未登录/非VIP/次数用完）

### Requirement 10: VIP状态展示与图标管理

**User Story:** As a 用户, I want to 在各个页面看到我的VIP状态标识, so that I can 清楚知道自己的会员身份。

#### Acceptance Criteria

1. WHEN 用户是有效VIP THEN THE VIP_System SHALL 在用户头像旁显示金色VIP图标
2. WHEN 用户是终身会员 THEN THE VIP_System SHALL 在VIP图标旁显示"终身"文字标签
3. WHEN 用户VIP已到期但在7天内 THEN THE VIP_System SHALL 显示灰色VIP图标
4. WHEN 用户VIP到期超过7天未续费 THEN THE VIP_System SHALL 隐藏VIP图标
5. WHEN 用户重新开通VIP THEN THE VIP_System SHALL 立即恢复显示金色VIP图标
6. THE VIP_System SHALL 在以下位置展示VIP图标：用户头像旁、评论区、个人主页、个人中心顶部
7. WHEN 用户是VIP THEN THE Download_Service SHALL 在下载按钮旁显示"VIP免费下载"标签

### Requirement 11: VIP到期提醒

**User Story:** As a VIP用户, I want to 在VIP即将到期时收到提醒, so that I can 及时续费避免权益中断。

#### Acceptance Criteria

1. WHEN 用户VIP到期前3天 THEN THE Notification_Service SHALL 发送站内信提醒用户续费
2. WHEN 用户VIP到期前1天 THEN THE Notification_Service SHALL 再次发送站内信提醒
3. WHEN 用户VIP到期当天 THEN THE Notification_Service SHALL 发送站内信告知VIP已到期
4. WHEN 用户VIP到期后7天仍未续费 THEN THE Notification_Service SHALL 发送最后提醒告知VIP图标即将隐藏
5. THE Notification_Service SHALL 在站内信中包含"立即续费"快捷链接

### Requirement 12: VIP页面跳转与返回逻辑

**User Story:** As a 用户, I want to 从任意页面跳转到VIP中心支付后能返回原页面, so that I can 继续之前的操作。

#### Acceptance Criteria

1. WHEN 用户从资源详情页点击"开通VIP"跳转 THEN THE VIP_System SHALL 记录来源页面URL和资源ID
2. WHEN 用户支付成功 THEN THE VIP_System SHALL 显示"返回继续下载"按钮（如有来源页面）
3. WHEN 用户点击"返回继续下载" THEN THE VIP_System SHALL 跳转回原资源详情页
4. WHEN 用户从个人中心跳转 THEN THE VIP_System SHALL 支付成功后显示"返回个人中心"按钮
5. WHEN 用户直接访问VIP中心 THEN THE VIP_System SHALL 支付成功后显示"浏览更多资源"按钮
6. IF 来源页面URL无效 THEN THE VIP_System SHALL 跳转到首页

### Requirement 13: 退款申请与处理

**User Story:** As a 用户, I want to 在符合条件时申请VIP退款, so that I can 在不满意时获得退款。

#### Acceptance Criteria

1. WHEN 用户购买月度/季度/年度VIP后7天内且未下载任何资源 THEN THE Order_Service SHALL 允许申请退款
2. WHEN 用户购买终身VIP THEN THE Order_Service SHALL 不允许申请退款
3. WHEN 用户提交退款申请 THEN THE Order_Service SHALL 创建退款工单并通知管理员
4. WHEN 管理员审核通过退款 THEN THE Order_Service SHALL 调用支付平台退款接口
5. WHEN 退款成功 THEN THE VIP_System SHALL 立即取消用户VIP资格
6. IF 退款失败 THEN THE Order_Service SHALL 记录失败原因并通知管理员人工处理

### Requirement 14: 支付安全监控

**User Story:** As a 系统管理员, I want to 监控异常支付行为, so that I can 防止欺诈和恶意操作。

#### Acceptance Criteria

1. WHEN 同一账号1小时内创建超过5个未支付订单 THEN THE Security_Monitor SHALL 暂时限制该账号支付功能
2. WHEN 同一IP地址1小时内切换超过3个账号进行支付 THEN THE Security_Monitor SHALL 标记该IP为可疑并记录日志
3. WHEN 检测到异常支付行为 THEN THE Security_Monitor SHALL 发送告警通知管理员
4. THE Security_Monitor SHALL 记录每笔支付的设备信息（设备型号、浏览器版本、IP地址）
5. WHEN 管理员审核后确认无风险 THEN THE Security_Monitor SHALL 解除账号支付限制

### Requirement 15: 多设备登录控制

**User Story:** As a 系统管理员, I want to 限制VIP账号同时登录的设备数量, so that I can 防止账号共享滥用。

#### Acceptance Criteria

1. THE Device_Manager SHALL 限制同一VIP账号最多同时在3台设备登录
2. WHEN 用户在第4台设备登录 THEN THE Device_Manager SHALL 踢出最早登录的设备
3. WHEN 设备被踢出 THEN THE Device_Manager SHALL 向被踢出设备发送"您的账号已在其他设备登录"提示
4. THE Device_Manager SHALL 记录每次登录的设备信息和登录时间
5. WHEN 用户在个人中心查看 THEN THE Device_Manager SHALL 展示当前登录的设备列表

### Requirement 16: 支付渠道状态监控

**User Story:** As a 用户, I want to 在支付渠道不可用时得到提示, so that I can 切换其他支付方式完成支付。

#### Acceptance Criteria

1. THE Payment_Gateway SHALL 每分钟检测微信支付和支付宝支付的可用状态
2. WHEN 检测到某支付渠道不可用 THEN THE Payment_Gateway SHALL 更新渠道状态为"维护中"
3. WHEN 支付渠道状态为"维护中" THEN THE VIP_System SHALL 在前端将该支付方式置灰并显示"暂不可用"
4. WHEN 支付渠道恢复可用 THEN THE Payment_Gateway SHALL 自动更新状态为"正常"
5. IF 所有支付渠道都不可用 THEN THE VIP_System SHALL 显示"支付服务暂时不可用，请稍后再试"

### Requirement 17: 签名验证与数据安全

**User Story:** As a 系统管理员, I want to 确保支付数据的安全性和完整性, so that I can 防止数据篡改和伪造回调。

#### Acceptance Criteria

1. WHEN 调用微信支付接口 THEN THE Payment_Gateway SHALL 使用API V3签名方式进行请求签名
2. WHEN 收到微信支付回调 THEN THE Payment_Gateway SHALL 验证回调签名的有效性
3. WHEN 调用支付宝接口 THEN THE Payment_Gateway SHALL 使用RSA2签名方式进行请求签名
4. WHEN 收到支付宝回调 THEN THE Payment_Gateway SHALL 验证回调签名的有效性
5. IF 签名验证失败 THEN THE Payment_Gateway SHALL 拒绝处理并记录安全日志
6. THE Payment_Gateway SHALL 将支付密钥存储在环境变量中，不硬编码在代码中

### Requirement 18: 前端VIP入口展示

**User Story:** As a 用户, I want to 在多个页面看到VIP入口, so that I can 方便地开通或续费VIP。

#### Acceptance Criteria

1. THE VIP_System SHALL 在顶部导航栏显示"VIP中心"入口
2. THE VIP_System SHALL 在资源详情页下载按钮旁显示"开通VIP免费下载"入口（非VIP用户）
3. THE VIP_System SHALL 在个人中心首页显示VIP状态卡片和"开通/续费"入口
4. THE VIP_System SHALL 在下载记录页显示VIP推广入口（非VIP用户）
5. WHEN 非VIP用户下载VIP资源被拒绝 THEN THE VIP_System SHALL 弹窗显示VIP权益介绍和"立即开通"按钮

### Requirement 19: 终身会员购买确认

**User Story:** As a 用户, I want to 在购买终身会员前得到明确提示, so that I can 了解终身会员不支持退款的规则。

#### Acceptance Criteria

1. WHEN 用户选择购买终身会员 THEN THE VIP_System SHALL 弹出确认对话框
2. THE VIP_System SHALL 在确认对话框中明确显示"终身会员一经购买，概不退款"
3. WHEN 用户点击"我已了解，继续购买" THEN THE VIP_System SHALL 继续支付流程
4. WHEN 用户点击"取消" THEN THE VIP_System SHALL 关闭对话框，不进行支付
5. THE VIP_System SHALL 要求用户勾选"我已阅读并同意《VIP服务协议》"后才能继续

### Requirement 20: 商户资质申请指南

**User Story:** As a 系统管理员, I want to 获得微信支付和支付宝支付的商户申请指南, so that I can 完成支付渠道的接入准备。

#### Acceptance Criteria

1. THE Payment_Gateway SHALL 提供微信支付商户号申请流程文档
2. THE Payment_Gateway SHALL 提供支付宝开放平台商户入驻流程文档
3. THE Payment_Gateway SHALL 列出申请所需的材料清单（营业执照、法人身份证、银行账户等）
4. THE Payment_Gateway SHALL 提供沙箱环境测试账号申请方法
5. THE Payment_Gateway SHALL 提供支付接口配置参数说明（AppID、商户号、密钥等）


### Requirement 21: 账号注销与VIP权益处理

**User Story:** As a 用户, I want to 注销账号时明确VIP权益的处理规则, so that I can 了解注销后未到期VIP是否退还或失效。

#### Acceptance Criteria

1. WHEN 用户发起账号注销申请 THEN THE VIP_System SHALL 弹窗提示"注销账号后，未到期VIP权益将立即失效，且不退还任何费用/积分"
2. WHEN 用户确认注销 THEN THE VIP_System SHALL 标记VIP状态为"已注销"，立即回收下载权限
3. WHEN 账号注销完成 THEN THE Order_Service SHALL 保留订单记录（符合数据留存合规要求），但隐藏用户个人信息（脱敏处理）
4. IF 用户注销后重新注册 THEN THE VIP_System SHALL 视为新用户，不继承原VIP权益和订单记录

### Requirement 22: VIP权益变更通知

**User Story:** As a VIP用户, I want to 在平台调整VIP权益时收到通知, so that I can 了解权益变化并做出相应决策。

#### Acceptance Criteria

1. WHEN 平台调整VIP权益（新增/减少权益、变更下载限制等） THEN THE Notification_Service SHALL 在变更前7天向所有有效VIP用户发送站内信通知
2. THE Notification_Service SHALL 在通知中明确说明"原权益"、"新权益"、"变更时间"
3. WHEN 权益变更涉及核心功能（如取消无限下载） THEN THE VIP_System SHALL 允许未到期用户申请退款（按剩余时长比例退款）
4. IF 用户在权益变更后未续费 THEN THE VIP_System SHALL 在到期后按新权益规则执行

### Requirement 23: 支付成功后下载权限即时刷新

**User Story:** As a 用户, I want to 支付成功返回原资源页面后能直接下载, so that I don't need to 手动刷新页面。

#### Acceptance Criteria

1. WHEN 用户支付成功并点击"返回继续下载" THEN THE VIP_System SHALL 跳转回原资源详情页时，自动刷新用户VIP状态和下载权限
2. WHEN 跳转完成 THEN THE Download_Service SHALL 直接显示"立即下载"按钮（替代原"开通VIP"提示）
3. IF 跳转后权限未即时生效 THEN THE VIP_System SHALL 提供"刷新权限"按钮，点击后手动同步最新状态
4. WHEN VIP用户下载时 THEN THE Download_Service SHALL 实时扣减单日下载次数，避免重复下载导致超量

### Requirement 24: 积分兑换记录展示

**User Story:** As a 用户, I want to 查看积分兑换VIP的历史记录, so that I can 了解积分使用情况。

#### Acceptance Criteria

1. WHEN 用户访问"我的积分"页面 THEN THE VIP_System SHALL 展示积分兑换VIP的记录（兑换时间、兑换套餐、消耗积分、到期时间）
2. WHEN 用户访问"我的订单"页面 THEN THE Order_Service SHALL 将积分兑换订单归类到"已支付"状态，支付方式显示"积分兑换"
3. THE VIP_System SHALL 显示每月积分兑换次数剩余（如"本月可兑换1次，已使用1次"）
4. IF 积分兑换订单异常（如兑换成功但VIP未开通） THEN THE Order_Service SHALL 在记录中显示"异常"标签，提供"联系客服"入口

### Requirement 25: 订单详情页退款申请入口

**User Story:** As a 用户, I want to 在符合退款条件的订单详情页直接申请退款, so that I can 简化退款操作流程。

#### Acceptance Criteria

1. WHEN 订单符合退款条件（月度/季度/年度VIP、购买后7天内、未下载资源） THEN THE Order_Service SHALL 在订单详情页显示"申请退款"按钮
2. WHEN 用户点击"申请退款" THEN THE VIP_System SHALL 弹出退款原因选择框（可选：资源不符合预期、不需要了、其他）
3. WHEN 用户提交退款申请 THEN THE Order_Service SHALL 生成退款工单，订单状态更新为"退款处理中"
4. WHEN 退款申请提交成功 THEN THE Notification_Service SHALL 发送站内信告知用户"退款申请已受理，将在3个工作日内处理"
5. WHEN 订单不符合退款条件 THEN THE Order_Service SHALL 隐藏"申请退款"按钮，鼠标悬浮显示不可退款原因

### Requirement 26: 支付过程网络异常处理

**User Story:** As a 用户, I want to 在支付过程中网络中断后能恢复支付状态, so that I don't need to 重新下单。

#### Acceptance Criteria

1. WHEN 用户在支付页面（扫码/H5支付）网络中断 THEN THE VIP_System SHALL 在重新连接网络后显示"查询支付结果"按钮
2. WHEN 用户点击"查询支付结果" THEN THE Order_Service SHALL 调用支付平台接口查询最新订单状态
3. WHEN 查询结果为"已支付" THEN THE VIP_System SHALL 直接跳转至支付成功页面
4. WHEN 查询结果为"未支付"且未超时 THEN THE VIP_System SHALL 恢复原支付页面（重新展示二维码/支付链接）
5. WHEN 查询结果为"已取消"或超时 THEN THE VIP_System SHALL 显示"订单已取消"提示，并提供"重新下单"按钮

### Requirement 27: VIP图标样式统一性

**User Story:** As a 用户, I want to 在所有页面看到的VIP图标样式一致, so that I can 清晰识别VIP身份。

#### Acceptance Criteria

1. THE VIP_System SHALL 统一VIP图标样式：金色圆形图标（直径24px），终身会员额外添加"终身"白色文字标签（字体大小12px，背景红色）
2. THE VIP_System SHALL 统一灰色VIP图标样式：浅灰色圆形图标（直径24px），透明度50%，无文字标签
3. VIP图标在所有展示位置（头像旁、评论区、个人主页）的大小、间距、对齐方式保持一致
4. WHEN 页面适配移动端 THEN THE VIP_System SHALL 缩放图标至适配尺寸（直径20px），保持样式比例不变

### Requirement 28: 环境切换与配置隔离

**User Story:** As a 开发/测试人员, I want to 区分沙箱测试环境和生产环境, so that I can 安全测试支付功能而不影响真实用户。

#### Acceptance Criteria

1. THE Payment_Gateway SHALL 通过环境变量（NODE_ENV）区分沙箱环境和生产环境
2. WHEN 环境为沙箱测试 THEN THE Payment_Gateway SHALL 调用微信/支付宝沙箱接口，使用测试密钥和商户号
3. WHEN 环境为生产 THEN THE Payment_Gateway SHALL 调用微信/支付宝正式接口，使用生产密钥和商户号
4. THE Order_Service SHALL 在沙箱环境添加"测试订单"标识，避免与生产订单混淆
5. THE VIP_System SHALL 在沙箱环境前端显示"测试环境"水印，提醒测试人员

### Requirement 29: 账号冻结/解封与VIP权益关联

**User Story:** As a 系统管理员, I want to 冻结/解封用户账号时同步处理VIP权益, so that I can 防止违规用户滥用VIP权限。

#### Acceptance Criteria

1. WHEN 管理员冻结用户账号 THEN THE VIP_System SHALL 暂停用户VIP权益（无法下载资源，VIP图标隐藏）
2. WHEN 账号冻结期间 THEN THE VIP_System SHALL 暂停VIP到期计时（冻结时长不计入有效时长）
3. WHEN 管理员解封用户账号 THEN THE VIP_System SHALL 恢复用户VIP权益（按原到期时间继续计算）
4. WHEN 账号冻结后 THEN THE Notification_Service SHALL 发送站内信告知用户"账号已冻结，VIP权益暂停，原因：XXX"
5. IF 账号永久冻结 THEN THE VIP_System SHALL 永久取消VIP权益，未到期时长不退还

### Requirement 30: 批量下载权限与次数统计

**User Story:** As a VIP用户, I want to 批量下载资源并明确次数统计规则, so that I can 高效下载多个资源。

#### Acceptance Criteria

1. WHEN 用户是有效VIP THEN THE Download_Service SHALL 提供批量下载按钮（支持勾选多个资源）
2. WHEN 用户批量下载N个资源 THEN THE Download_Service SHALL 计入N次单日下载次数（如批量下载10个，扣减10次）
3. WHEN 批量下载时剩余次数不足 THEN THE Download_Service SHALL 提示"今日剩余下载次数XX次，无法下载全部选中资源"，并允许用户调整勾选数量
4. WHEN 批量下载过程中某资源下载失败 THEN THE Download_Service SHALL 记录失败资源，提供"重新下载失败资源"按钮，且不重复扣减次数
5. WHEN 普通用户 THEN THE Download_Service SHALL 隐藏批量下载按钮，提示"开通VIP可享受批量下载"

### Requirement 31: 支付回调幂等性处理

**User Story:** As a 系统管理员, I want to 处理支付平台重复回调通知, so that I can 避免重复开通VIP或重复记录订单。

#### Acceptance Criteria

1. WHEN Payment_Gateway收到支付回调通知 THEN THE Order_Service SHALL 先检查该支付订单号是否已处理
2. WHEN 订单已处理（状态为已支付/已退款） THEN THE Payment_Gateway SHALL 直接返回成功响应，不重复处理
3. WHEN 订单未处理 THEN THE Payment_Gateway SHALL 验证签名后处理订单状态更新
4. THE Order_Service SHALL 记录每次回调的时间、回调ID、处理结果，便于排查重复回调问题
5. IF 重复回调导致订单状态异常 THEN THE Order_Service SHALL 触发告警通知管理员人工核查

### Requirement 32: 更换手机号后二次验证适配

**User Story:** As a 用户, I want to 更换手机号后仍能正常接收支付二次验证短信, so that I can 顺利完成支付。

#### Acceptance Criteria

1. WHEN 用户更换手机号 THEN THE VIP_System SHALL 要求用户验证新手机号（短信验证码）
2. WHEN 新手机号验证通过 THEN THE Payment_Gateway SHALL 后续支付二次验证短信发送至新手机号
3. WHEN 用户在支付过程中更换手机号 THEN THE VIP_System SHALL 中断当前支付流程，要求重新选择套餐并发起支付
4. THE VIP_System SHALL 在个人中心显示当前绑定的手机号，提供"更换手机号"入口
5. IF 更换手机号后支付二次验证短信未收到 THEN THE Payment_Gateway SHALL 提供"重新发送验证码"按钮（60秒冷却）

## 补充说明

### 合规性要求

1. 需在VIP服务协议中明确"账号不得转借他人使用"，与多设备登录限制规则一致
2. 订单记录永久保存需符合《个人信息保护法》，用户注销后需对个人敏感信息（手机号、支付信息）进行脱敏处理
3. 退款流程需明确退款到账时间（如"支付宝/微信支付退款将在3-7个工作日内到账"），避免用户纠纷

### 技术细节要求

1. 单日下载次数统计以"自然日"为单位（00:00-23:59），每日0点自动重置
2. 多设备登录检测基于"设备指纹"（结合设备型号、浏览器指纹、操作系统），避免同一设备被重复计数
3. 对账任务的重试机制：支付平台接口不可用时，间隔1分钟重试，最多重试3次，仍失败则触发告警
4. 积分兑换比例：1000积分 = 1个月VIP（参考行业标准）

### 用户体验优化要求

1. VIP到期前的站内信提醒，需包含用户当前VIP等级、到期时间、续费入口链接
2. 支付成功页面的"返回继续下载"按钮，需保留原资源的下载链接参数，跳转后直接定位到下载区域
3. 订单详情页需显示"客服咨询"入口，方便用户遇到订单问题时快速联系
