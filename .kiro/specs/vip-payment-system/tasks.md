# Tasks Document - VIP会员支付系统

## 任务概览

本文档将VIP会员支付系统的实现分解为可执行的任务列表，按照依赖关系和优先级排序。

---

## Phase 1: 基础设施与数据模型 (预计3天)

### Task 1.1: 数据库Schema扩展 ✅
- [x] 创建 `vip_orders` 表（VIP订单扩展表）
- [x] 创建 `payment_callbacks` 表（支付回调记录表）
- [x] 创建 `device_sessions` 表（设备会话表）
- [x] 创建 `security_logs` 表（安全日志表）
- [x] 创建 `refund_requests` 表（退款申请表）
- [x] 创建 `user_download_stats` 表（用户下载统计表）
- [x] 创建 `notifications` 表（站内信表）
- [x] 创建 `points_vip_exchanges` 表（积分兑换VIP记录表）
- [x] 扩展 `orders` 表字段
- [x] 扩展 `users` 表字段
- [x] 执行 `prisma db push` 同步Schema
- [x] 验证所有表和索引创建成功

**依赖**: 无
**输出**: `backend/prisma/schema.prisma` 更新，数据库迁移完成

### Task 1.2: 环境配置与证书管理 ✅
- [x] 创建 `backend/certs/` 目录结构
- [x] 更新 `.env.example` 添加支付相关配置项
- [x] 更新 `.gitignore` 排除证书文件
- [x] 创建支付配置加载模块 `backend/src/config/payment.ts`
- [x] 实现环境区分逻辑（sandbox/production）

**依赖**: 无
**输出**: 支付配置模块，环境变量模板


---

## Phase 2: 核心服务层实现 (预计5天)

### Task 2.1: 支付网关服务 - 微信支付 ✅
- [x] 安装微信支付SDK依赖 `wechatpay-node-v3`
- [x] 创建 `backend/src/services/payment/wechatPay.ts`
- [x] 实现微信Native支付（PC扫码）
- [x] 实现微信H5支付（移动端）
- [x] 实现支付状态查询接口
- [x] 实现签名验证工具函数
- [x] 实现退款接口
- [ ] 编写单元测试

**依赖**: Task 1.2
**输出**: 微信支付服务模块

### Task 2.2: 支付网关服务 - 支付宝支付 ✅
- [x] 安装支付宝SDK依赖 `alipay-sdk`
- [x] 创建 `backend/src/services/payment/alipay.ts`
- [x] 实现支付宝PC网站支付
- [x] 实现支付宝手机网站支付（WAP）
- [x] 实现支付状态查询接口
- [x] 实现RSA2签名验证
- [x] 实现退款接口
- [ ] 编写单元测试

**依赖**: Task 1.2
**输出**: 支付宝支付服务模块

### Task 2.3: 支付网关统一封装 ✅
- [x] 创建 `backend/src/services/payment/paymentGateway.ts`
- [x] 实现统一的支付接口抽象
- [x] 实现支付渠道路由逻辑
- [x] 实现支付渠道状态检测
- [x] 实现支付渠道切换建议
- [ ] 编写集成测试

**依赖**: Task 2.1, Task 2.2
**输出**: 统一支付网关服务

### Task 2.4: 订单服务增强 ✅
- [x] 扩展 `backend/src/services/order/orderService.ts`
- [x] 实现VIP订单创建（含设备信息记录）
- [x] 实现订单状态流转逻辑
- [x] 实现订单超时自动取消
- [x] 实现订单查询与分页
- [x] 实现订单取消逻辑
- [x] 实现幂等性处理（回调去重）
- [ ] 编写单元测试

**依赖**: Task 1.1
**输出**: 增强的订单服务

### Task 2.5: VIP服务增强 ✅
- [x] 扩展 `backend/src/services/vipService.ts`
- [x] 实现VIP开通逻辑（新开通/续费）
- [x] 实现终身会员判断与处理
- [x] 实现VIP状态查询（含图标状态）
- [x] 实现VIP取消逻辑（退款时调用）
- [x] 实现VIP到期时间计算
- [ ] 编写单元测试

**依赖**: Task 1.1
**输出**: 增强的VIP服务

### Task 2.6: 下载服务实现 ✅
- [x] 创建 `backend/src/services/download/downloadService.ts`
- [x] 实现下载权限校验逻辑
- [x] 实现VIP用户下载次数统计（50次/天）
- [x] 实现普通用户免费下载次数统计（2次/天）
- [x] 实现免费资源判断逻辑
- [x] 实现批量下载次数计算
- [ ] 编写单元测试

**依赖**: Task 1.1, Task 2.5
**输出**: 下载权限服务


### Task 2.7: 安全监控服务 ✅
- [x] 创建 `backend/src/services/security/securityMonitor.ts`
- [x] 实现支付安全检查（未支付订单数限制）
- [x] 实现可疑IP检测
- [x] 实现二次验证判断逻辑（金额≥200元）
- [x] 实现验证码发送与验证
- [x] 实现支付限制与解锁
- [x] 实现安全日志记录
- [ ] 编写单元测试

**依赖**: Task 1.1
**输出**: 安全监控服务

### Task 2.8: 设备管理服务 ✅
- [x] 创建 `backend/src/services/device/deviceManager.ts`
- [x] 实现设备指纹生成算法
- [x] 实现设备登录记录
- [x] 实现设备数量限制检查（最多3台）
- [x] 实现设备踢出逻辑
- [x] 实现用户设备列表查询
- [ ] 编写单元测试

**依赖**: Task 1.1
**输出**: 设备管理服务

### Task 2.9: 通知服务实现 ✅
- [x] 创建 `backend/src/services/notification/notificationService.ts`
- [x] 实现站内信发送
- [x] 实现VIP到期提醒模板
- [x] 实现支付成功通知模板
- [x] 实现退款通知模板
- [x] 实现通知查询与标记已读
- [ ] 编写单元测试

**依赖**: Task 1.1
**输出**: 通知服务

### Task 2.10: 对账服务实现 ✅
- [x] 创建 `backend/src/services/reconciliation/reconciliationService.ts`
- [x] 实现待对账订单查询
- [x] 实现单订单状态同步
- [x] 实现批量对账逻辑
- [x] 实现对账日志记录
- [x] 实现对账异常告警
- [ ] 编写单元测试

**依赖**: Task 2.3, Task 2.4
**输出**: 对账服务

---

## Phase 3: API层实现 (预计3天)

### Task 3.1: 支付回调API ✅

- [x] 创建 `backend/src/routes/payment.ts`
- [x] 实现微信支付回调接口 `POST /api/v1/payment/wechat/notify`
- [x] 实现支付宝异步回调接口 `POST /api/v1/payment/alipay/notify`
- [x] 实现支付宝同步回调接口 `GET /api/v1/payment/alipay/return`
- [x] 实现回调签名验证中间件
- [x] 实现回调幂等处理
- [ ] 编写集成测试

**依赖**: Task 2.3
**输出**: 支付回调路由

### Task 3.2: VIP订单API ✅

- [x] 扩展 `backend/src/routes/vip.ts`
- [x] 实现创建订单接口 `POST /api/v1/vip/orders`
- [x] 实现订单列表接口 `GET /api/v1/vip/orders`
- [x] 实现订单详情接口 `GET /api/v1/vip/orders/:orderNo`
- [x] 实现取消订单接口 `POST /api/v1/vip/orders/:orderNo/cancel`
- [x] 实现发起支付接口 `POST /api/v1/vip/orders/:orderNo/pay`
- [x] 实现查询支付状态接口 `GET /api/v1/vip/orders/:orderNo/status`
- [x] 实现申请退款接口 `POST /api/v1/vip/orders/:orderNo/refund`
- [ ] 编写API测试

**依赖**: Task 2.4, Task 2.5
**输出**: VIP订单API

### Task 3.3: 积分兑换API ✅

- [x] 实现获取兑换信息接口 `GET /api/v1/vip/points-exchange/info`
- [x] 实现积分兑换VIP接口 `POST /api/v1/vip/points-exchange`
- [x] 实现兑换记录查询接口 `GET /api/v1/vip/points-exchange/records`
- [ ] 编写API测试

**依赖**: Task 2.5
**输出**: 积分兑换API

### Task 3.4: 二次验证API ✅

- [x] 实现发送验证码接口 `POST /api/v1/vip/auth/send-code`
- [x] 实现验证验证码接口 `POST /api/v1/vip/auth/verify-code`
- [ ] 编写API测试

**依赖**: Task 2.7
**输出**: 二次验证API

### Task 3.5: 设备管理API ✅

- [x] 实现获取设备列表接口 `GET /api/v1/user/devices`
- [x] 实现踢出设备接口 `DELETE /api/v1/user/devices/:sessionId`
- [ ] 编写API测试

**依赖**: Task 2.8
**输出**: 设备管理API

### Task 3.6: 下载权限API增强 ✅

- [x] 扩展现有下载接口，添加权限校验
- [x] 实现下载次数查询接口
- [x] 实现批量下载接口（VIP专属）
- [ ] 编写API测试

**依赖**: Task 2.6
**输出**: 增强的下载API

### Task 3.7: 管理后台API扩展 ✅

- [x] 实现退款申请列表接口 `GET /api/v1/admin/vip/refunds`
- [x] 实现处理退款申请接口 `PUT /api/v1/admin/vip/refunds/:refundId`
- [x] 实现安全日志查询接口 `GET /api/v1/admin/security/logs`
- [x] 实现解除支付限制接口 `POST /api/v1/admin/users/:userId/unlock-payment`
- [ ] 编写API测试

**依赖**: Task 2.7
**输出**: 管理后台API扩展


---

## Phase 4: 定时任务实现 (预计1天)

### Task 4.1: 订单对账定时任务 ✅

- [x] 安装定时任务依赖 `node-cron`
- [x] 创建 `backend/src/tasks/reconciliation.ts`
- [x] 实现每5分钟对账任务
- [x] 实现重试机制（3次，间隔1分钟）
- [x] 实现对账结果日志记录
- [ ] 编写测试

**依赖**: Task 2.10
**输出**: 对账定时任务

### Task 4.2: VIP到期提醒定时任务 ✅

- [x] 创建 `backend/src/tasks/vipReminder.ts`
- [x] 实现每日9点执行的提醒任务
- [x] 实现3天/1天/当天/7天后提醒逻辑
- [ ] 编写测试

**依赖**: Task 2.9
**输出**: VIP提醒定时任务

### Task 4.3: 订单超时取消定时任务 ✅

- [x] 创建 `backend/src/tasks/orderTimeout.ts`
- [x] 实现每分钟检查超时订单
- [x] 实现15分钟超时自动取消
- [ ] 编写测试

**依赖**: Task 2.4
**输出**: 订单超时任务

### Task 4.4: 定时任务注册与启动 ✅

- [x] 创建 `backend/src/tasks/index.ts` 统一注册
- [x] 在应用启动时初始化定时任务
- [x] 添加任务执行日志

**依赖**: Task 4.1, Task 4.2, Task 4.3
**输出**: 定时任务启动模块

---

## Phase 5: 前端实现 (预计5天)

### Task 5.1: Pinia Store - VIP状态管理 ✅

- [x] 创建 `src/stores/vip.ts`
- [x] 实现用户VIP信息状态
- [x] 实现套餐列表状态
- [x] 实现订单状态
- [x] 实现支付状态轮询
- [x] 实现积分兑换状态

**依赖**: Task 3.2
**输出**: VIP状态管理Store

### Task 5.2: 前端API封装 ✅

- [x] 扩展 `src/api/vip.ts`
- [x] 添加创建订单API
- [x] 添加发起支付API
- [x] 添加查询支付状态API
- [x] 添加取消订单API
- [x] 添加申请退款API
- [x] 添加积分兑换API
- [x] 添加二次验证API

**依赖**: Task 3.2, Task 3.3, Task 3.4
**输出**: 前端API模块

### Task 5.3: VIP中心页面重构 ✅

- [x] 重构 `src/views/VIP/index.vue`
- [x] 创建 `PackageList.vue` 套餐列表组件
- [x] 创建 `PackageCard.vue` 套餐卡片组件
- [x] 实现套餐数据动态加载
- [x] 实现终身会员隐藏逻辑
- [x] 实现续费按钮显示逻辑
- [x] 适配移动端响应式

**依赖**: Task 5.1, Task 5.2
**输出**: 重构后的VIP中心页面

### Task 5.4: 支付方式选择组件 ✅

- [x] 创建 `PaymentMethodSelector.vue`
- [x] 实现微信支付/支付宝/积分兑换选项
- [x] 实现支付渠道不可用状态显示
- [x] 实现积分不足/已兑换状态显示

**依赖**: Task 5.2
**输出**: 支付方式选择组件

### Task 5.5: 支付弹窗组件 ✅

- [x] 创建 `PaymentDialog.vue`
- [x] 实现微信二维码展示（PC端）
- [x] 实现支付跳转逻辑（移动端/支付宝）
- [x] 实现倒计时显示（15分钟）
- [x] 实现支付状态轮询（每3秒）
- [x] 实现支付成功/失败/超时处理

**依赖**: Task 5.1, Task 5.2
**输出**: 支付弹窗组件

### Task 5.6: 二次验证弹窗组件 ✅

- [x] 创建 `SecondaryAuthDialog.vue`
- [x] 实现验证码输入框
- [x] 实现发送验证码按钮（60秒冷却）
- [x] 实现验证码验证逻辑

**依赖**: Task 5.2
**输出**: 二次验证弹窗组件

### Task 5.7: 积分兑换面板组件 ✅

- [x] 创建 `PointsExchangePanel.vue`
- [x] 实现积分余额显示
- [x] 实现兑换时长选择（1-3个月）
- [x] 实现本月已兑换状态显示
- [x] 实现兑换确认逻辑

**依赖**: Task 5.2
**输出**: 积分兑换面板组件

### Task 5.8: 支付成功弹窗组件 ✅

- [x] 创建 `PaymentSuccessDialog.vue`
- [x] 实现订单信息展示
- [x] 实现VIP到期时间展示
- [x] 实现"返回继续下载"按钮（来源页面跳转）
- [x] 实现"浏览更多资源"按钮

**依赖**: Task 5.1
**输出**: 支付成功弹窗组件


### Task 5.9: VIP图标组件 ✅

- [x] 创建 `src/components/business/VipIcon.vue`
- [x] 实现金色VIP图标（有效VIP）
- [x] 实现灰色VIP图标（7天宽限期）
- [x] 实现终身标签（红色背景白色文字）
- [x] 实现多尺寸支持（small/medium/large）

**依赖**: 无
**输出**: VIP图标组件

### Task 5.10: VIP徽章组件 ✅

- [x] 创建 `src/components/business/VipBadge.vue`
- [x] 实现头像旁VIP徽章
- [x] 集成VipIcon组件
- [x] 适配不同展示位置

**依赖**: Task 5.9
**输出**: VIP徽章组件

### Task 5.11: VIP状态卡片组件 ✅

- [x] 创建 `src/components/business/VipStatusCard.vue`
- [x] 实现VIP状态展示（等级、到期时间）
- [x] 实现开通/续费按钮
- [x] 实现特权列表展示

**依赖**: Task 5.9, Task 5.1
**输出**: VIP状态卡片组件

### Task 5.12: VIP下载按钮组件 ✅

- [x] 创建 `src/components/business/VipDownloadButton.vue`
- [x] 实现下载权限校验
- [x] 实现"VIP免费下载"标签（VIP用户）
- [x] 实现"开通VIP免费下载"提示（非VIP用户）
- [x] 实现下载次数提示
- [x] 实现跳转VIP中心逻辑

**依赖**: Task 5.1, Task 5.2
**输出**: VIP下载按钮组件

### Task 5.13: 订单列表页面 ✅

- [x] 创建 `src/views/VIP/OrderList.vue`
- [x] 实现订单列表展示
- [x] 实现订单状态筛选
- [x] 实现分页加载
- [x] 实现继续支付/取消订单操作
- [x] 适配移动端

**依赖**: Task 5.1, Task 5.2
**输出**: 订单列表页面

### Task 5.14: 订单详情页面 ✅

- [x] 创建 `src/views/VIP/OrderDetail.vue`
- [x] 实现订单详情展示
- [x] 实现申请退款入口（符合条件时显示）
- [x] 实现退款状态展示

**依赖**: Task 5.1, Task 5.2
**输出**: 订单详情页面

### Task 5.15: VIP入口集成 ✅

- [x] 在顶部导航添加VIP入口
- [x] 在资源详情页添加"开通VIP免费下载"入口
- [x] 在个人中心添加VIP状态卡片
- [x] 在下载记录页添加VIP推广入口
- [x] 实现非VIP用户下载拦截弹窗

**依赖**: Task 5.9, Task 5.10, Task 5.11, Task 5.12
**输出**: VIP入口集成

### Task 5.16: 设备管理页面 ✅

- [x] 创建 `src/views/User/Devices.vue`
- [x] 实现设备列表展示
- [x] 实现踢出设备功能
- [x] 在个人中心添加入口

**依赖**: Task 5.2
**输出**: 设备管理页面

---

## Phase 6: 管理后台前端 (预计2天)

### Task 6.1: 退款管理页面 ✅

- [x] 创建 `src/views/Admin/VIP/Refunds/index.vue`
- [x] 实现退款申请列表
- [x] 实现退款审核功能
- [x] 实现退款状态筛选

**依赖**: Task 3.7
**输出**: 退款管理页面

### Task 6.2: 安全日志页面 ✅

- [x] 创建 `src/views/Admin/Security/Logs/index.vue`
- [x] 实现安全日志列表
- [x] 实现日志筛选（事件类型、风险等级）
- [x] 实现解除支付限制功能

**依赖**: Task 3.7
**输出**: 安全日志页面

### Task 6.3: VIP统计页面增强 ✅
- [x] 扩展 `src/views/Admin/VIP/Statistics/index.vue`
- [x] 添加退款统计
- [x] 添加支付渠道分布图表
- [x] 添加异常订单统计

**依赖**: Task 3.7
**输出**: 增强的VIP统计页面


---

## Phase 7: 测试与优化 (预计3天)

### Task 7.1: 后端单元测试 ✅
- [x] 编写PaymentGateway单元测试
- [x] 编写OrderService单元测试
- [x] 编写VipService单元测试
- [x] 编写DownloadService单元测试
- [x] 编写SecurityMonitor单元测试
- [x] 确保测试覆盖率>80%

**依赖**: Phase 2完成
**输出**: 后端单元测试

### Task 7.2: 后端集成测试 ✅
- [x] 编写完整支付流程集成测试
- [x] 编写退款流程集成测试
- [x] 编写积分兑换流程集成测试
- [x] 编写对账流程集成测试

**依赖**: Phase 3完成
**输出**: 后端集成测试

### Task 7.3: 前端组件测试 ✅
- [x] 编写VipIcon组件测试
- [x] 编写PaymentDialog组件测试
- [x] 编写VipStatusCard组件测试
- [x] 编写VipDownloadButton组件测试

**依赖**: Phase 5完成
**输出**: 前端组件测试

### Task 7.4: E2E测试 ✅
- [x] 编写VIP购买流程E2E测试
- [x] 编写订单管理E2E测试
- [x] 编写VIP状态展示E2E测试
- [x] 编写下载权限E2E测试

**依赖**: Phase 5, Phase 6完成
**输出**: E2E测试

### Task 7.5: 沙箱环境测试 ✅
- [x] 配置微信支付沙箱环境
- [x] 配置支付宝沙箱环境
- [x] 执行完整支付流程测试
- [x] 执行退款流程测试
- [x] 记录测试结果

**依赖**: Task 7.2
**输出**: 沙箱测试报告 (`backend/docs/SANDBOX_TEST_REPORT.md`)

### Task 7.6: 性能优化 ✅
- [x] 优化订单查询性能（添加索引）
- [x] 优化VIP状态查询（添加缓存）
- [x] 优化支付状态轮询（WebSocket可选）
- [x] 优化前端组件加载（懒加载）

**依赖**: Task 7.4
**输出**: 性能优化 (`backend/docs/PERFORMANCE_OPTIMIZATION.md`)

### Task 7.7: 安全审计 ✅
- [x] 检查支付密钥存储安全
- [x] 检查日志脱敏
- [x] 检查SQL注入防护
- [x] 检查XSS防护
- [x] 检查CSRF防护

**依赖**: Phase 3完成
**输出**: 安全审计报告 (`backend/docs/SECURITY_AUDIT_REPORT.md`)

---

## Phase 8: 文档与部署 (预计1天)

### Task 8.1: API文档
- [ ] 编写支付API文档
- [ ] 编写VIP订单API文档
- [ ] 编写积分兑换API文档
- [ ] 更新Swagger/OpenAPI文档

**依赖**: Phase 3完成
**输出**: API文档

### Task 8.2: 商户申请指南
- [ ] 编写微信支付商户申请指南
- [ ] 编写支付宝商户申请指南
- [ ] 编写证书配置指南
- [ ] 编写沙箱测试指南

**依赖**: 无
**输出**: 商户申请指南文档

### Task 8.3: 部署文档
- [ ] 编写环境变量配置说明
- [ ] 编写证书部署说明
- [ ] 编写定时任务配置说明
- [ ] 编写回调URL配置说明

**依赖**: Phase 4完成
**输出**: 部署文档

### Task 8.4: 运维文档
- [ ] 编写对账异常处理流程
- [ ] 编写退款处理流程
- [ ] 编写安全事件处理流程
- [ ] 编写常见问题FAQ

**依赖**: Phase 7完成
**输出**: 运维文档

---

## 任务依赖关系图

```
Phase 1 (基础设施)
    │
    ├── Task 1.1 ──┬── Task 2.4 ──┬── Task 3.2 ──┬── Task 5.1 ──┬── Task 5.3
    │              │              │              │              │
    │              ├── Task 2.5 ──┤              ├── Task 5.2 ──┼── Task 5.4
    │              │              │              │              │
    │              ├── Task 2.6 ──┼── Task 3.6   ├── Task 5.5 ──┼── Task 5.6
    │              │              │              │              │
    │              ├── Task 2.7 ──┼── Task 3.4   └── Task 5.7 ──┴── Task 5.8
    │              │              │
    │              ├── Task 2.8 ──┼── Task 3.5
    │              │              │
    │              └── Task 2.9 ──┼── Task 3.7
    │                             │
    └── Task 1.2 ──┬── Task 2.1 ──┼── Task 2.3 ──┬── Task 3.1
                   │              │              │
                   └── Task 2.2 ──┘              └── Task 2.10 ── Task 4.1

Phase 4 (定时任务)
    │
    ├── Task 4.1 ──┐
    ├── Task 4.2 ──┼── Task 4.4
    └── Task 4.3 ──┘

Phase 5 (前端) ──── Phase 6 (管理后台) ──── Phase 7 (测试) ──── Phase 8 (文档)
```

---

## 里程碑

| 里程碑 | 预计完成时间 | 交付物 |
|--------|-------------|--------|
| M1: 基础设施完成 | 第3天 | 数据库Schema、配置模块 |
| M2: 核心服务完成 | 第8天 | 支付网关、订单服务、VIP服务 |
| M3: API层完成 | 第11天 | 所有后端API |
| M4: 定时任务完成 | 第12天 | 对账、提醒、超时任务 |
| M5: 前端完成 | 第17天 | VIP中心、支付流程、订单管理 |
| M6: 管理后台完成 | 第19天 | 退款管理、安全日志 |
| M7: 测试完成 | 第22天 | 单元测试、集成测试、E2E测试 |
| M8: 文档完成 | 第23天 | API文档、部署文档、运维文档 |

---

## 风险与缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 商户资质申请延迟 | 无法进行真实支付测试 | 先使用沙箱环境完成开发测试 |
| 支付SDK兼容性问题 | 开发进度延迟 | 提前调研SDK，准备备选方案 |
| 支付回调丢失 | 订单状态不一致 | 实现对账机制，定时同步状态 |
| 安全漏洞 | 资金损失 | 代码审查、安全测试、日志监控 |
