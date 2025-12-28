# 实现计划 - 短信验证功能

## 概述

本实现计划将短信验证功能分解为可执行的开发任务，按照后端服务 → 后端集成 → 前端集成的顺序实现。

## 任务列表

- [x] 1. 创建验证码存储服务
  - [x] 1.1 创建 `backend/src/services/sms/verificationCodeStore.ts`
    - 定义 VerificationCode 接口
    - 实现内存存储（Map）作为默认存储
    - 实现 set/get/markAsUsed/delete/exists 方法
    - 支持 TTL 过期机制
    - _Requirements: 2.6, 2.7, 5.2, 5.3_
  - [x] 1.2 编写验证码存储服务属性测试

    - **Property 4: 验证码存储与读取**
    - **Validates: Requirements 2.6, 2.7**
    - _测试文件: `backend/src/__tests__/unit/services/sms/verificationCodeStore.test.ts`_
    - _测试通过: 8个属性测试，每个运行100次迭代_

- [x] 2. 创建频率限制服务
  - [x] 2.1 创建 `backend/src/services/sms/rateLimiter.ts`
    - 实现手机号60秒限制检查
    - 实现手机号每日5次限制检查
    - 实现IP 60秒3次限制检查
    - 实现IP每日20次限制检查
    - 实现请求记录方法
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_
  - [x] 2.2 编写频率限制服务属性测试

    - **Property 8: 手机号频率限制**
    - **Property 9: IP频率限制**
    - **Validates: Requirements 4.1-4.9**

- [x] 3. 创建短信发送服务
  - [x] 3.1 创建 `backend/src/services/sms/smsService.ts`
    - 定义 ISmsService 接口和 SmsSendResult 类型
    - 实现 MockSmsService（打印到控制台）
    - 实现短信服务工厂函数
    - 预留阿里云/腾讯云/Twilio接口
    - _Requirements: 2.8, 2.9, 2.10_
  - [x] 3.2 更新 `backend/src/config/index.ts`
    - 添加 SMS_PROVIDER 配置
    - 添加各服务商配置项
    - _Requirements: 2.1 (环境变量配置)_

- [x] 4. 创建验证码工具函数
  - [x] 4.1 创建 `backend/src/utils/smsUtils.ts`
    - 实现 generateVerificationCode 函数（生成6位数字）
    - 实现 validatePhone 函数（手机号格式验证）
    - 实现 validateVerifyCode 函数（验证码格式验证）
    - 实现 safeCompare 函数（常量时间比较）
    - _Requirements: 2.1, 2.5, 5.1_
  - [x] 4.2 编写工具函数属性测试

    - **Property 1: 手机号格式验证**
    - **Property 2: 验证码格式验证**
    - **Property 3: 验证码生成**
    - **Validates: Requirements 1.1, 1.8, 2.1, 2.5, 5.1**

- [x] 5. Checkpoint - 确保所有测试通过
  - 运行所有单元测试和属性测试
  - 确保所有测试通过，如有问题请询问用户

- [x] 6. 集成到认证服务
  - [x] 6.1 更新 `backend/src/services/authService.ts`
    - 修改 sendVerifyCode 方法，集成验证码存储和频率限制
    - 添加 verifyCode 方法，实现验证码验证逻辑
    - 修改 register 方法，调用 verifyCode 验证
    - _Requirements: 2.1-2.10, 3.3-3.10_
  - [x] 6.2 编写验证码验证属性测试

    - **Property 5: 验证码验证正确性**
    - **Property 6: 验证码单次使用**
    - **Property 7: 验证码过期**
    - **Validates: Requirements 3.3-3.9, 5.2, 5.3**

- [x] 7. 更新认证控制器
  - [x] 7.1 更新 `backend/src/controllers/authController.ts`
    - 修改 sendCode 方法，添加IP获取和传递
    - 添加错误码返回支持
    - 更新错误响应格式
    - _Requirements: 4.6-4.9, 6.1-6.8_

- [x] 8. 创建错误码定义
  - [x] 8.1 创建 `backend/src/utils/smsErrorCodes.ts`
    - 定义所有SMS相关错误码（SMS_001-SMS_009）
    - 实现错误码到HTTP状态码的映射
    - 实现错误码到提示消息的映射
    - _Requirements: 错误码定义_

- [x] 9. Checkpoint - 后端功能验证
  - 使用Postman或curl测试发送验证码接口
  - 验证控制台输出验证码
  - 测试频率限制功能
  - 确保所有测试通过，如有问题请询问用户

- [x] 10. 前端集成
  - [x] 10.1 更新 `src/composables/useAuth.ts`
    - 更新 sendCode 方法，处理新的错误码
    - 添加错误码到提示消息的映射
    - _Requirements: 1.4, 1.5, 1.6_
  - [x] 10.2 更新 `src/views/Auth/Register.vue`
    - 确保手机号格式验证与后端一致
    - 确保验证码格式验证（6位数字）
    - 优化错误提示显示
    - _Requirements: 1.1, 1.2, 1.7, 1.8_

- [x] 11. 更新前端验证工具
  - [x] 11.1 更新 `src/utils/validate.ts`
    - 确保 validatePhone 函数与后端一致
    - 确保 validateVerifyCode 函数验证6位数字
    - _Requirements: 1.1, 1.8_

- [x] 12. 最终验证
  - [x] 12.1 端到端测试
    - 测试完整注册流程（获取验证码 → 输入验证码 → 注册成功）
    - 测试验证码错误场景
    - 测试验证码过期场景
    - 测试频率限制场景
    - _Requirements: 全部_

- [x] 13. Checkpoint - 最终检查
  - 确保所有测试通过
  - 确保功能正常工作
  - 如有问题请询问用户

## 注意事项

- 任务标记 `*` 的为可选测试任务，可根据需要跳过
- 每个任务引用了对应的需求编号，便于追溯
- 属性测试使用 fast-check 库，需要先安装依赖
- 开发环境默认使用 mock 模式，验证码打印到控制台

## 核心测试任务（不可省略）

以下测试任务虽标记为可选，但涉及安全性和核心功能，建议不要跳过：

1. **任务 4.2** - 工具函数属性测试（验证码安全比较防止时序攻击）
2. **任务 2.2** - 频率限制服务测试（手机号+IP双维度防刷）
3. **任务 5** - Checkpoint（确保基础服务无问题再集成）
4. **任务 9** - 后端功能验证（覆盖验证码全流程）
5. **任务 12.1** - 端到端测试（确保前后端对接无问题）
