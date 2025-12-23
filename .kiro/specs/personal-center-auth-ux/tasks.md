# Implementation Plan: Personal Center Auth UX Fix

## Overview

本实现计划旨在修复个人中心自动退出登录的问题。通过改进Token管理、错误处理和状态同步机制，确保用户在访问个人中心时不会被错误地退出登录。

## Tasks

- [x] 1. 改进Token管理工具函数
  - 修改 `src/utils/security.ts` 中的Token过期检查逻辑
  - 添加Token状态验证函数
  - 确保过期检查的容错性
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 1.1 编写Token管理函数的单元测试
  - 测试 `isTokenExpired()` 的各种场景
  - 测试 `isTokenExpiringSoon()` 的各种场景
  - 测试 `validateTokenState()` 函数
  - _Requirements: 2.1, 2.2_

- [x] 1.2 编写Token状态一致性属性测试
  - **Property 1: Token状态一致性**
  - **Validates: Requirements 2.1, 2.3, 2.5**

- [x] 1.3 编写过期检查容错性属性测试
  - **Property 2: 过期检查容错性**
  - **Validates: Requirements 1.2, 2.1**

- [x] 2. 改进请求拦截器
  - 修改 `src/utils/request.ts` 中的请求拦截器
  - 添加Token存在性检查
  - 添加Token状态一致性验证
  - 改进Token过期检查逻辑
  - 优化Token刷新流程
  - _Requirements: 1.1, 1.2, 1.3, 2.4_

- [x] 2.1 编写请求拦截器单元测试
  - 测试Token不存在的情况
  - 测试Token过期的情况
  - 测试Token即将过期的情况
  - 测试Token状态不一致的修复
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. 改进响应拦截器和401错误处理(保持中文回复)
  - 修改 `src/utils/request.ts` 中的响应拦截器
  - 添加 `handleUnauthorizedError()` 函数
  - 实现401错误的智能处理逻辑
  - 添加并发401去重机制
  - _Requirements: 1.4, 1.5, 3.1, 3.2, 3.3, 3.5_

- [x] 3.1 编写401错误处理单元测试
  - 测试Token过期时的401处理
  - 测试Token未过期时的401处理
  - 测试并发401请求的去重
  - _Requirements: 1.5, 3.1, 3.2_

- [x] 3.2 编写401错误处理幂等性属性测试
  - **Property 3: 401错误处理幂等性**
  - **Validates: Requirements 1.5, 3.2**
  - **Status: PASSED** - 50次迭代全部通过

- [x] 3.3 编写Token验证优先级属性测试
  - **Property 4: Token验证优先级**
  - **Validates: Requirements 3.1, 3.5**
  - **Status: PASSED** - 所有子测试通过

- [x] 4. 改进用户Store的Token管理
  - 修改 `src/pinia/userStore.ts` 中的 `initToken()` 函数
  - 修改 `setToken()` 函数，确保同时设置Token和过期时间
  - 添加Token状态修复逻辑
  - _Requirements: 2.3, 2.5, 5.1, 5.2, 5.3, 5.5_

- [x] 4.1 编写用户Store单元测试
  - 测试 `initToken()` 的各种场景
  - 测试 `setToken()` 的同步设置
  - 测试Token状态修复逻辑
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 4.2 编写Token初始化修复属性测试
  - **Property 6: Token初始化修复**
  - **Validates: Requirements 2.1, 5.1, 5.3**

- [x] 4.3 编写Store和Cookie同步属性测试
  - **Property 7: Store和Cookie同步**
  - **Validates: Requirements 5.2, 5.5**

- [x] 5. 改进个人中心页面的错误处理
  - 修改 `src/views/Personal/index.vue` 中的数据加载函数
  - 改进 `fetchDownloadHistory()` 的错误处理
  - 改进 `fetchUploadHistory()` 的错误处理
  - 改进 `fetchVIPInfo()` 的错误处理
  - 区分认证错误和其他错误
  - _Requirements: 4.1, 4.2, 4.4, 5.4_

- [x] 5.1 编写个人中心数据加载单元测试
  - 测试成功加载数据
  - 测试401错误处理
  - 测试网络错误处理
  - 测试空数据显示
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 5.2 编写数据加载失败容错属性测试
  - **Property 5: 数据加载失败容错**
  - **Validates: Requirements 4.2, 4.4**

- [x] 6. Checkpoint - 确保所有测试通过
  - 运行所有单元测试 ✅ (176 tests passed)
  - 运行所有属性测试 ✅
  - 验证Token管理逻辑正确 ✅
  - 验证401错误处理正确 ✅
  - 验证个人中心不会自动退出登录 ✅
  - 如有问题，询问用户 ✅ (已修复request测试)

- [x] 7. 集成测试和端到端验证
  - 测试完整登录流程
  - 测试访问个人中心流程
  - 测试Token刷新流程
  - 测试401错误恢复流程
  - 验证多次访问个人中心不会退出登录
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4_

- [x] 7.1 编写集成测试
  - 测试完整登录 → 访问个人中心流程
  - 测试Token刷新流程
  - 测试401错误恢复流程
  - 测试个人中心Tab切换流程
  - _Requirements: 1.1, 4.1, 4.3_

- [x] 8. 最终验证和文档更新
  - 手动测试所有修复的场景
  - 验证问题已完全解决
  - 更新相关文档
  - 记录修复的根本原因和解决方案

## Notes

- 所有测试任务都是必需的，确保从一开始就有完整的测试覆盖
- 每个任务都引用了具体的需求，确保可追溯性
- Checkpoint任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
- 集成测试验证端到端流程
