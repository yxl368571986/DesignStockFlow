# 实现计划: 设计资源上传审核功能

## 概述

本实现计划将设计资源上传审核功能分解为可执行的开发任务，按照环境配置 → 数据模型 → 核心服务 → API接口 → 前端组件的顺序实现。

## 任务列表

- [x] 1. 环境配置和数据模型
  - [x] 1.1 添加 AUDIT_MODE 环境配置
    - 在 `backend/.env` 和 `backend/.env.example` 中添加 `AUDIT_MODE` 配置项
    - 在 `backend/src/config/index.ts` 中读取并导出配置
    - 默认值为 "production"
    - _需求: 1.1, 1.4, 1.5_

  - [x] 1.2 创建审核配置模块
    - 创建 `backend/src/config/audit.ts`
    - 定义 AuditConfig 接口和默认配置
    - 包含允许的文件格式、非法扩展名、缩略图尺寸（200x200px）等配置
    - 文件格式校验支持大小写兼容（如 png/PNG、zip/ZIP 均视为有效格式）
    - _需求: 1.1, 6.1_

  - [x] 1.3 扩展数据库表结构
    - 创建 Prisma 迁移文件
    - 扩展 resources 表（file_hash, extracted_files, reject_reason, reject_reason_code）
    - 创建 chunk_uploads 和 chunk_parts 表
    - 创建 audit_logs 表
    - 创建 notifications 表
    - 添加必要的索引（包括 idx_resources_audit_status_created_at 复合索引用于优化待审核列表查询）
    - _需求: 3.5, 12.4_

  - [x] 1.4 更新 Prisma Schema
    - 在 `backend/prisma/schema.prisma` 中添加新模型
    - 运行 `npx prisma generate` 生成客户端
    - _需求: 3.5, 12.4_

- [x] 2. 检查点 - 确保数据库迁移成功
  - 运行迁移并验证表结构
  - 如有问题请咨询用户

- [x] 3. 文件验证服务
  - [x] 3.1 创建文件验证服务
    - 创建 `backend/src/services/fileValidationService.ts`
    - 实现 validateFile 方法（格式、大小验证）
    - 实现 calculateFileHash 方法（MD5 计算）
    - 实现 checkDuplicateFile 方法（重复检测）
    - _需求: 2.1, 2.2, 2.3, 4.1_

  - [x] 3.2 实现设计文件有效性验证
    - 实现 validateDesignFile 方法
    - PSD/AI/CDR 文件头格式校验
    - JPG/PNG 像素信息校验
    - _需求: 6.2_

  - [ ]* 3.3 编写文件验证属性测试
    - **Property 2: 文件验证拒绝无效文件**
    - **验证: 需求 2.1, 2.2, 2.3, 2.5**

  - [ ]* 3.4 编写重复文件检测属性测试
    - **Property 4: 重复文件检测**
    - **验证: 需求 4.1, 4.2**

- [x] 4. 自动审核服务
  - [x] 4.1 创建自动审核服务
    - 创建 `backend/src/services/autoAuditService.ts`
    - 实现 performAutoAudit 方法
    - 根据 AUDIT_MODE 决定审核行为
    - _需求: 1.2, 1.3, 6.1_

  - [x] 4.2 实现压缩包解压功能
    - 实现 extractArchive 方法
    - 支持 ZIP/RAR/7Z/TAR/GZIP 格式
    - 处理损坏和加密压缩包（返回错误码 AUDIT_005）
    - _需求: 6.3, 6.7_

  - [x] 4.3 实现解压内容验证
    - 实现 validateExtractedContent 方法
    - 检查有效设计文件
    - 检查非法可执行文件
    - _需求: 6.4, 6.5, 6.6_

  - [x] 4.4 实现临时文件清理
    - 实现 cleanupTempFiles 方法
    - 实现 cleanupExpiredTempFiles 定时任务（24小时过期）
    - 系统启动时自动执行临时文件清理任务，删除过期/未处理的临时解压文件
    - _需求: 6.10, 6.11, 6.12_

  - [ ]* 4.5 编写自动审核属性测试
    - **Property 1: AUDIT_MODE 配置决定审核行为**
    - **验证: 需求 1.2, 1.3**

  - [ ]* 4.6 编写自动审核结果属性测试
    - **Property 6: 自动审核结果决定 audit_status**
    - **验证: 需求 6.2, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9**

  - [ ]* 4.7 编写临时文件清理属性测试
    - **Property 7: 压缩包解压后临时文件清理**
    - **验证: 需求 6.10**

- [x] 5. 检查点 - 确保自动审核服务正常工作
  - 测试设计文件和压缩包的自动审核
  - 如有问题请咨询用户

- [x] 6. 分片上传服务
  - [x] 6.1 创建分片上传服务
    - 创建 `backend/src/services/chunkUploadService.ts`
    - 实现 initChunkUpload 方法
    - 实现 uploadChunk 方法
    - 实现 getUploadedChunks 方法（断点续传）
    - _需求: 3.1, 3.2, 3.5_

  - [x] 6.2 实现分片合并和完成上传
    - 实现 completeChunkUpload 方法
    - 实现 cancelChunkUpload 方法
    - _需求: 3.1_

  - [ ]* 6.3 编写分片上传属性测试
    - **Property 3: 分片上传支持断点续传**
    - **验证: 需求 3.2, 3.5**

- [x] 7. 人工审核服务
  - [x] 7.1 创建人工审核服务
    - 创建 `backend/src/services/manualAuditService.ts`
    - 实现 getAuditList 方法（待审核列表）
    - 支持排序和筛选
    - _需求: 7.1, 7.2, 7.3_

  - [x] 7.2 实现审核操作
    - 实现 approveResource 方法
    - 实现 rejectResource 方法（含驳回原因）
    - _需求: 7.8, 7.9, 7.10, 7.15_

  - [x] 7.3 实现批量审核
    - 实现 batchApprove 方法
    - 实现 batchReject 方法
    - 返回操作结果汇总
    - _需求: 8.1, 8.2, 8.3, 8.4_

  - [x] 7.4 实现缩略图生成
    - 实现 generateThumbnail 方法
    - 从配置读取缩略图尺寸（默认 200x200px）
    - 图片文件生成缩略图
    - 损坏图片返回默认图标
    - _需求: 7.5, 7.6_

  - [x] 7.5 实现文件详情获取
    - 实现 getFileDetails 方法
    - 返回格式、尺寸、分辨率等信息
    - _需求: 7.13_

  - [ ]* 7.6 编写人工审核属性测试
    - **Property 8: 人工审核操作更新 audit_status**
    - **验证: 需求 7.8, 7.9, 7.15**

  - [ ]* 7.7 编写批量审核属性测试
    - **Property 9: 批量审核返回操作结果汇总**
    - **验证: 需求 8.2, 8.3, 8.4**

- [x] 8. 审核日志服务
  - [x] 8.1 创建审核日志服务
    - 创建 `backend/src/services/auditLogService.ts`
    - 实现 logAuditAction 方法
    - 区分系统自动审核和人工审核
    - _需求: 12.1, 12.2, 12.3_

  - [x] 8.2 实现日志查询
    - 实现 getAuditLogs 方法
    - 支持按资源ID、操作人、时间范围筛选
    - _需求: 12.5_

  - [ ]* 8.3 编写审核日志属性测试
    - **Property 13: 审核日志完整记录变更信息**
    - **验证: 需求 12.1, 12.2, 12.3, 12.4**

- [x] 9. 通知服务
  - [x] 9.1 创建通知服务
    - 创建 `backend/src/services/notificationService.ts`
    - 实现 sendAuditNotification 方法
    - _需求: 11.1, 11.2_

  - [x] 9.2 实现通知查询
    - 实现 getUserNotifications 方法
    - 实现 markAsRead 方法
    - _需求: 11.4_

  - [ ]* 9.3 编写通知属性测试
    - **Property 12: audit_status 变更触发通知**
    - **验证: 需求 11.1, 11.2**

- [x] 10. 检查点 - 确保所有后端服务正常工作
  - 运行所有单元测试和属性测试
  - 如有问题请咨询用户

- [x] 11. 后端 API 接口
  - [x] 11.1 创建分片上传 API
    - 创建 `backend/src/controllers/chunkUploadController.ts`
    - POST /api/v1/upload/init - 初始化分片上传
    - POST /api/v1/upload/chunk - 上传分片
    - GET /api/v1/upload/:uploadId/chunks - 获取已上传分片
    - POST /api/v1/upload/:uploadId/complete - 完成上传
    - DELETE /api/v1/upload/:uploadId - 取消上传
    - _需求: 3.1, 3.2_

  - [x] 11.2 修改资源上传 API
    - 修改 `backend/src/controllers/resourceController.ts`
    - 集成自动审核服务
    - 根据 AUDIT_MODE 返回不同提示消息
    - _需求: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 11.3 创建人工审核 API
    - 创建 `backend/src/controllers/auditController.ts`
    - GET /api/v1/admin/audit/list - 待审核列表
    - POST /api/v1/admin/audit/:resourceId/approve - 审核通过
    - POST /api/v1/admin/audit/:resourceId/reject - 审核驳回
    - POST /api/v1/admin/audit/batch-approve - 批量通过
    - POST /api/v1/admin/audit/batch-reject - 批量驳回
    - _需求: 7.1, 7.8, 7.9, 8.2, 8.3_

  - [x] 11.4 创建审核日志 API
    - GET /api/v1/admin/audit/logs - 审核日志列表
    - _需求: 12.5_

  - [x] 11.5 创建通知 API
    - GET /api/v1/notifications - 用户通知列表
    - PUT /api/v1/notifications/:id/read - 标记已读
    - _需求: 11.4_

  - [x] 11.6 修改资源列表 API
    - 确保首页/分类页仅返回 audit_status=1 的资源
    - _需求: 9.1, 9.2, 9.3_

  - [ ]* 11.7 编写公开页面展示属性测试
    - **Property 10: 公开页面仅展示已审核通过的资源**
    - **验证: 需求 9.1, 9.2, 9.3**

  - [ ]* 11.8 编写上传提示消息属性测试
    - **Property 14: 上传结果返回正确的提示消息**
    - **验证: 需求 13.1, 13.2, 13.3, 13.4, 13.5**

- [x] 12. 检查点 - 确保所有 API 接口正常工作
  - 使用 Postman 或 curl 测试所有接口
  - 如有问题请咨询用户

- [x] 13. 前端上传组件改造
  - [x] 13.1 修改上传 API 模块
    - 修改 `src/api/upload.ts`
    - 添加分片上传相关 API 调用
    - 添加断点续传支持
    - _需求: 3.1, 3.2_

  - [x] 13.2 修改上传组合式函数
    - 修改 `src/composables/useUpload.ts`
    - 集成分片上传逻辑
    - 添加断点续传状态管理
    - 根据文件大小自动选择上传方式
    - _需求: 3.1, 3.2, 3.3, 3.4_

  - [x] 13.3 添加批量上传支持
    - 修改上传组件支持多文件选择
    - 显示每个文件的上传进度和状态
    - 部分失败时继续上传其他文件
    - _需求: 5.1, 5.2, 5.3, 5.4_

  - [x] 13.4 优化上传提示
    - 实现弹窗+文字提示双展示
    - 弹窗3秒后自动关闭
    - 文字提示常驻至用户关闭
    - _需求: 13.6_

  - [ ]* 13.5 编写批量上传属性测试
    - **Property 5: 批量上传部分失败不影响其他文件**
    - **验证: 需求 5.2, 5.4**

- [x] 14. 前端个人中心改造
  - [x] 14.1 添加审核状态展示
    - 修改个人中心资源卡片组件
    - 根据 audit_status 显示不同标签（审核中/已驳回）
    - 根据状态控制下载/分享按钮
    - _需求: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 14.2 添加驳回原因查看
    - 点击已驳回资源可查看驳回原因
    - _需求: 10.5_

  - [x] 14.3 添加状态筛选功能
    - 添加筛选按钮（全部/审核中/已通过/已驳回）
    - 默认显示"全部"
    - _需求: 10.7_

  - [x] 14.4 添加缩略图展示
    - 已通过资源显示缩略图
    - 设计文件显示格式图标
    - _需求: 10.6_

  - [ ]* 14.5 编写用户权限属性测试
    - **Property 11: audit_status 决定用户权限**
    - **验证: 需求 10.2, 10.3, 10.5**

- [x] 15. 前端通知功能
  - [x] 15.1 创建通知 API 模块
    - 创建 `src/api/notification.ts`
    - 实现获取通知列表、标记已读等 API
    - _需求: 11.4_

  - [x] 15.2 创建通知组件
    - 创建通知图标和下拉列表
    - 显示未读数量
    - 支持点击查看详情
    - _需求: 11.3, 11.4_

  - [x] 15.3 添加通知弹窗
    - 收到新通知时弹窗提示
    - _需求: 11.3_

- [x] 16. 管理后台人工审核页面
  - [x] 16.1 创建审核列表页面
    - 创建 `src/views/admin/AuditList.vue`
    - 展示待审核资源列表
    - 支持排序和筛选
    - _需求: 7.1, 7.2, 7.3_

  - [x] 16.2 实现资源详情展示
    - 显示上传用户、时间、文件信息
    - 压缩包显示解压后文件列表
    - 图片显示缩略图，设计文件显示图标
    - _需求: 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 16.3 实现预览功能
    - 点击缩略图/文件名快速预览
    - 图片弹窗放大
    - 设计文件显示详细信息
    - _需求: 7.12, 7.13, 7.16_

  - [x] 16.4 实现审核操作
    - 审核通过按钮
    - 驳回按钮（预设下拉选项+自定义输入）
    - 下载原文件按钮
    - _需求: 7.8, 7.9, 7.10, 7.11_

  - [x] 16.5 实现批量审核
    - 多选功能
    - 批量通过/驳回按钮
    - 显示操作结果汇总
    - _需求: 8.1, 8.2, 8.3, 8.4_

- [x] 17. 管理后台审核日志页面
  - [x] 17.1 创建审核日志页面
    - 创建 `src/views/admin/AuditLogs.vue`
    - 展示审核日志列表
    - 支持按资源ID、操作人、时间范围筛选
    - _需求: 12.5_

- [x] 18. 最终检查点 - 确保所有功能正常工作
  - 运行所有测试
  - 进行端到端测试
  - 如有问题请咨询用户

## 备注

- 标记 `*` 的任务为可选任务，可在 MVP 阶段跳过
- 每个任务都引用了对应的需求编号，便于追溯
- 检查点任务用于确保阶段性成果的正确性
- 属性测试验证核心正确性属性
