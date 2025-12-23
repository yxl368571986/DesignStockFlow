# 项目文档导航 / Project Documentation

本目录包含项目的所有技术文档，按功能分类组织。

This directory contains all technical documentation for the project, organized by functionality.

---

## 📁 目录结构 / Directory Structure

### 🧪 [testing/](./testing/) - 测试文档
测试相关的所有文档，包括测试修复报告、测试指南和验收测试。

- **[fixes/](./testing/fixes/)** - 测试修复报告
  - `TEST_FIXES_SUMMARY.md` - 测试修复总结（英文）
  - `测试修复报告.md` - 测试修复报告（中文）
  - `核心功能修复方案.md` - 核心功能修复方案
  - `核心功能修复完成报告.md` - 核心功能修复完成报告
  - `内存问题修复完成报告.md` - 内存问题修复完成报告
  - `测试问题完整修复报告.md` - 测试问题完整修复报告
  - `ERROR_FIX_SUMMARY.md` - 错误修复总结

- **[guides/](./testing/guides/)** - 测试指南
  - `内存优化配置说明.md` - 内存优化配置说明
  - `MOCK_DATA_GUIDE.md` - Mock数据使用指南

- **测试文件**
  - `FINAL_ACCEPTANCE_TEST.md` - 最终验收测试

### 🚀 [deployment/](./deployment/) - 部署文档
构建、部署和CI/CD相关文档。

- `BUILD_GUIDE.md` - 构建指南
- `BUILD_QUICK_REFERENCE.md` - 构建快速参考
- `NGINX_DEPLOYMENT_GUIDE.md` - Nginx部署指南
- `NGINX_QUICK_REFERENCE.md` - Nginx快速参考
- `CI_CD_GUIDE.md` - CI/CD指南
- `CI_CD_QUICK_REFERENCE.md` - CI/CD快速参考
- `ENV_CONFIGURATION_GUIDE.md` - 环境配置指南
- `MONITORING_LOGGING_GUIDE.md` - 监控和日志指南
- `GITHUB_ACTIONS_CHECKLIST.md` - GitHub Actions检查清单

### 🔒 [security/](./security/) - 安全文档
安全相关的指南和验证文档。

- `XSS_PROTECTION_GUIDE.md` - XSS防护指南
- `CSRF_PROTECTION_GUIDE.md` - CSRF防护指南
- `CSRF_VERIFICATION_CHECKLIST.md` - CSRF验证检查清单
- `TOKEN_SECURITY_GUIDE.md` - Token安全指南
- `TOKEN_SECURITY_VERIFICATION.md` - Token安全验证
- `FILE_UPLOAD_SECURITY_GUIDE.md` - 文件上传安全指南
- `FILE_UPLOAD_SECURITY_VERIFICATION.md` - 文件上传安全验证
- `BUSINESS_LOGIC_VERIFICATION.md` - 业务逻辑验证
- `INFRASTRUCTURE_VERIFICATION.md` - 基础设施验证
- `SCAFFOLDING_VERIFICATION.md` - 脚手架验证
- `SETUP_VERIFICATION.md` - 设置验证

### ⚡ [performance/](./performance/) - 性能文档
性能优化相关的指南和检查清单。

- `PERFORMANCE_CHECKLIST.md` - 性能检查清单
- `PERFORMANCE_VERIFICATION.md` - 性能验证
- `RENDERING_OPTIMIZATION_GUIDE.md` - 渲染优化指南
- `CACHE_STRATEGY.md` - 缓存策略
- `IMAGE_OPTIMIZATION_SUMMARY.md` - 图片优化总结
- `CODE_SPLITTING_GUIDE.md` - 代码分割指南
- `MANUAL_PERFORMANCE_TEST.md` - 手动性能测试

### 📋 [tasks/](./tasks/) - 任务文档
项目任务的详细文档和总结。

- 所有 `TASK_*.md` 文件 - 各个任务的详细文档

### 📦 [project/](./project/) - 项目文档
项目级别的文档和交付材料。

- `PROJECT_COMPLETION_SUMMARY.md` - 项目完成总结
- `PROJECT_DELIVERY.md` - 项目交付文档
- `PROJECT_STRUCTURE.md` - 项目结构说明
- `HANDOVER_CHECKLIST.md` - 交接检查清单
- `QUICK_REFERENCE.md` - 快速参考
- `PWA_CONFIGURATION.md` - PWA配置说明
- `PERMISSION_SYSTEM_GUIDE.md` - 权限系统指南
- `API_INTEGRATION_GUIDE.md` - API集成指南
- `前端修复与后台开发.md` - 前端修复与后台开发

### 🔧 [setup/](./setup/) - 安装配置文档
项目安装和环境配置相关文档。

- `INSTALL.md` - 安装指南
- `DATABASE_SETUP.md` - 数据库设置
- `QUICK_START.md` - 快速开始
- `QUICK_START_DATABASE.md` - 数据库快速开始
- `POSTGRESQL_*.md` - PostgreSQL相关文档
- `MOCK_SETUP_EXPLANATION.md` - Mock设置说明

### ✅ [verification/](./verification/) - 验证文档
测试验证和检查清单。

- `VERIFICATION_CHECKLIST.md` - 验证检查清单
- `快速验证指南.md` - 快速验证指南
- `最终验证清单.md` - 最终验证清单

### 🔨 [backend-tasks/](./backend-tasks/) - 后端任务文档
后端开发任务的详细文档和总结。

- 所有 `TASK*.md` 文件 - 后端各个任务的详细文档

---

## 🔍 快速查找 / Quick Find

### 开发者入门
1. 📖 [项目结构](./project/PROJECT_STRUCTURE.md)
2. 🚀 [快速参考](./project/QUICK_REFERENCE.md)
3. ⚙️ [环境配置](./deployment/ENV_CONFIGURATION_GUIDE.md)
4. 🔧 [安装指南](./setup/INSTALL.md)
5. 💾 [数据库设置](./setup/DATABASE_SETUP.md)

### 测试相关
1. 🧪 [最终验收测试](./testing/FINAL_ACCEPTANCE_TEST.md)
2. 📝 [测试问题完整修复报告](./testing/fixes/测试问题完整修复报告.md)
3. 💾 [内存优化配置](./testing/guides/内存优化配置说明.md)
4. ✅ [验证检查清单](./verification/VERIFICATION_CHECKLIST.md)
5. 📋 [后端测试报告](./testing/TEST_REPORT.md)

### 部署相关
1. 🏗️ [构建指南](./deployment/BUILD_GUIDE.md)
2. 🌐 [Nginx部署](./deployment/NGINX_DEPLOYMENT_GUIDE.md)
3. 🔄 [CI/CD配置](./deployment/CI_CD_GUIDE.md)

### 安全相关
1. 🛡️ [XSS防护](./security/XSS_PROTECTION_GUIDE.md)
2. 🔐 [CSRF防护](./security/CSRF_PROTECTION_GUIDE.md)
3. 🔑 [Token安全](./security/TOKEN_SECURITY_GUIDE.md)
4. 📤 [文件上传安全](./security/FILE_UPLOAD_SECURITY_GUIDE.md)

### 性能优化
1. ⚡ [性能检查清单](./performance/PERFORMANCE_CHECKLIST.md)
2. 🎨 [渲染优化](./performance/RENDERING_OPTIMIZATION_GUIDE.md)
3. 💾 [缓存策略](./performance/CACHE_STRATEGY.md)
4. 🖼️ [图片优化](./performance/IMAGE_OPTIMIZATION_SUMMARY.md)

---

## 📚 文档使用建议 / Documentation Usage Tips

### 新开发者
1. 先阅读 [项目结构](./project/PROJECT_STRUCTURE.md) 了解整体架构
2. 查看 [快速参考](./project/QUICK_REFERENCE.md) 获取常用命令
3. 按需查阅具体功能的详细文档

### 测试工程师
1. 查看 [最终验收测试](./testing/FINAL_ACCEPTANCE_TEST.md)
2. 了解 [测试修复报告](./testing/fixes/测试问题完整修复报告.md)
3. 参考 [内存优化配置](./testing/guides/内存优化配置说明.md)

### 运维工程师
1. 阅读 [部署指南](./deployment/NGINX_DEPLOYMENT_GUIDE.md)
2. 配置 [CI/CD流程](./deployment/CI_CD_GUIDE.md)
3. 设置 [监控和日志](./deployment/MONITORING_LOGGING_GUIDE.md)

### 安全审计
1. 检查 [安全指南](./security/)
2. 验证 [安全检查清单](./security/CSRF_VERIFICATION_CHECKLIST.md)
3. 审查各项安全验证文档

---

## 🔄 文档更新 / Documentation Updates

文档最后更新时间：2024年12月21日

### 最近更新
- 新增 `setup/` 目录 - 集中管理安装配置文档
- 新增 `verification/` 目录 - 集中管理验证检查清单
- 新增 `backend-tasks/` 目录 - 集中管理后端任务文档
- 整理临时文件和测试文件到相应目录

如需更新文档，请：
1. 在相应目录下修改或添加文档
2. 更新本README的索引
3. 提交PR并说明更新内容

---

## 📞 联系方式 / Contact

如有文档相关问题，请联系项目维护团队。

For documentation-related questions, please contact the project maintenance team.
