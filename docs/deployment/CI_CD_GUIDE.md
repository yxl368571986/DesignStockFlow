# CI/CD 配置指南

## 概述

本项目使用 GitHub Actions 实现自动化的持续集成和持续部署（CI/CD）流程。

## 工作流程

### 触发条件

1. **推送触发**：推送到 `main` 或 `develop` 分支
2. **Pull Request**：向 `main` 分支提交 PR
3. **手动触发**：通过 GitHub Actions 界面手动触发

### 流程阶段

```
代码推送
    ↓
代码质量检查 (lint)
    ↓
单元测试 (test)
    ↓
构建测试 (build)
    ↓
安全扫描 (security-scan)
    ↓
部署 (deploy-dev / deploy-prod)
    ↓
健康检查
    ↓
通知
```

## 任务详解

### 1. 代码质量检查 (lint)

**目的**：确保代码符合规范和最佳实践

**检查项**：
- ESLint 代码规范检查
- Prettier 格式检查
- TypeScript 类型检查

**命令**：
```bash
pnpm run lint:check
pnpm run format:check
pnpm run type-check
```

### 2. 单元测试 (test)

**目的**：验证代码功能正确性

**测试内容**：
- 工具函数测试
- Composables 测试
- Store 测试
- 组件测试

**命令**：
```bash
pnpm run test
pnpm run test:coverage
```

**覆盖率要求**：
- 工具函数：90%+
- Composables：80%+
- Stores：80%+
- 组件：70%+

### 3. 构建测试 (build)

**目的**：验证项目可以成功构建

**构建环境**：
- Development（开发环境）
- Production（生产环境）

**命令**：
```bash
pnpm run build:dev
pnpm run build:prod
```

**验证项**：
- dist 目录存在
- index.html 存在
- 构建产物大小合理

### 4. 安全扫描 (security-scan)

**目的**：检测安全漏洞

**扫描内容**：
- npm audit（依赖漏洞）
- Snyk（依赖安全扫描）
- CodeQL（代码安全分析）

**命令**：
```bash
pnpm audit --audit-level=moderate
```

### 5. 部署 (deploy)

#### 开发环境部署 (deploy-dev)

**触发条件**：
- 推送到 `develop` 分支
- 手动触发并选择 development 环境

**部署目标**：
- 服务器：开发服务器
- 域名：https://dev.startide-design.com

**部署步骤**：
1. 下载构建产物
2. SSH 连接到开发服务器
3. 上传文件到部署目录
4. 重启 Nginx
5. 健康检查
6. 发送通知

#### 生产环境部署 (deploy-prod)

**触发条件**：
- 推送到 `main` 分支
- 手动触发并选择 production 环境

**部署目标**：
- 服务器：生产服务器
- 域名：https://www.startide-design.com

**部署步骤**：
1. 下载构建产物
2. 备份当前版本
3. SSH 连接到生产服务器
4. 上传文件到部署目录
5. 重启 Nginx
6. 健康检查
7. Lighthouse 性能测试
8. 发送通知
9. 创建 GitHub Release

### 6. 性能检查 (performance-check)

**目的**：确保性能指标达标

**检查项**：
- Lighthouse CI 评分
- 构建产物大小
- 主要 chunk 大小

**性能要求**：
- Lighthouse 评分：90+
- 总体积：< 200MB
- 主 chunk：< 1MB

## 环境变量配置

### GitHub Secrets 配置

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中配置以下密钥：

#### 开发环境

| 密钥名称 | 说明 | 示例 |
|---------|------|------|
| `DEV_API_BASE_URL` | 开发环境 API 地址 | `https://dev-api.startide-design.com` |
| `DEV_CDN_BASE_URL` | 开发环境 CDN 地址 | `https://dev-cdn.startide-design.com` |
| `DEV_SSH_PRIVATE_KEY` | 开发服务器 SSH 私钥 | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DEV_SERVER_HOST` | 开发服务器地址 | `dev.startide-design.com` |
| `DEV_SERVER_USER` | 开发服务器用户名 | `deploy` |
| `DEV_SERVER_PORT` | 开发服务器 SSH 端口 | `22` |
| `DEV_DEPLOY_PATH` | 开发环境部署路径 | `/var/www/startide-design-dev` |

#### 生产环境

| 密钥名称 | 说明 | 示例 |
|---------|------|------|
| `PROD_API_BASE_URL` | 生产环境 API 地址 | `https://api.startide-design.com` |
| `PROD_CDN_BASE_URL` | 生产环境 CDN 地址 | `https://cdn.startide-design.com` |
| `PROD_SSH_PRIVATE_KEY` | 生产服务器 SSH 私钥 | `-----BEGIN RSA PRIVATE KEY-----...` |
| `PROD_SERVER_HOST` | 生产服务器地址 | `www.startide-design.com` |
| `PROD_SERVER_USER` | 生产服务器用户名 | `deploy` |
| `PROD_SERVER_PORT` | 生产服务器 SSH 端口 | `22` |
| `PROD_DEPLOY_PATH` | 生产环境部署路径 | `/var/www/startide-design` |

#### 第三方服务

| 密钥名称 | 说明 | 获取方式 |
|---------|------|---------|
| `CODECOV_TOKEN` | Codecov 上传令牌 | https://codecov.io |
| `SNYK_TOKEN` | Snyk 安全扫描令牌 | https://snyk.io |
| `SLACK_WEBHOOK` | Slack 通知 Webhook | Slack App 配置 |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse CI 令牌 | GitHub App |

### 环境变量说明

#### VITE_API_BASE_URL
- **说明**：后端 API 基础地址
- **开发环境**：`https://dev-api.startide-design.com`
- **生产环境**：`https://api.startide-design.com`

#### VITE_CDN_BASE_URL
- **说明**：CDN 资源基础地址
- **开发环境**：`https://dev-cdn.startide-design.com`
- **生产环境**：`https://cdn.startide-design.com`

#### VITE_APP_TITLE
- **说明**：应用标题
- **开发环境**：`星潮设计（开发）`
- **生产环境**：`星潮设计`

#### VITE_APP_ENV
- **说明**：应用环境标识
- **开发环境**：`development`
- **生产环境**：`production`

## SSH 密钥配置

### 1. 生成 SSH 密钥对

```bash
# 生成 RSA 密钥对
ssh-keygen -t rsa -b 4096 -C "deploy@startide-design.com" -f deploy_key

# 生成两个文件：
# - deploy_key（私钥）
# - deploy_key.pub（公钥）
```

### 2. 配置服务器

```bash
# 登录到服务器
ssh user@server

# 添加公钥到 authorized_keys
cat deploy_key.pub >> ~/.ssh/authorized_keys

# 设置权限
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3. 配置 GitHub Secrets

```bash
# 复制私钥内容
cat deploy_key

# 将私钥内容添加到 GitHub Secrets
# 名称：DEV_SSH_PRIVATE_KEY 或 PROD_SSH_PRIVATE_KEY
# 值：完整的私钥内容（包括 BEGIN 和 END 行）
```

### 4. 测试连接

```bash
# 使用私钥测试连接
ssh -i deploy_key user@server

# 如果成功连接，说明配置正确
```

## 部署流程

### 开发环境部署

```bash
# 1. 推送代码到 develop 分支
git checkout develop
git add .
git commit -m "feat: 新功能"
git push origin develop

# 2. GitHub Actions 自动触发
# 3. 执行 lint → test → build → deploy-dev
# 4. 部署到开发服务器
# 5. 访问 https://dev.startide-design.com 验证
```

### 生产环境部署

```bash
# 1. 合并到 main 分支
git checkout main
git merge develop
git push origin main

# 2. GitHub Actions 自动触发
# 3. 执行 lint → test → build → deploy-prod
# 4. 备份当前版本
# 5. 部署到生产服务器
# 6. 健康检查和性能测试
# 7. 创建 GitHub Release
# 8. 访问 https://www.startide-design.com 验证
```

### 手动部署

```bash
# 1. 访问 GitHub Actions 页面
# 2. 选择 "CI/CD Pipeline" 工作流
# 3. 点击 "Run workflow"
# 4. 选择分支和环境
# 5. 点击 "Run workflow" 确认
```

## 回滚策略

### 自动备份

生产环境部署时会自动备份当前版本：

```bash
# 备份目录格式
/var/www/startide-design_backup_20240101_120000

# 保留最近 5 个备份
```

### 手动回滚

```bash
# 1. SSH 登录到生产服务器
ssh deploy@www.startide-design.com

# 2. 查看备份列表
ls -la /var/www/ | grep backup

# 3. 恢复备份
cd /var/www
rm -rf startide-design
cp -r startide-design_backup_20240101_120000 startide-design

# 4. 重启 Nginx
sudo systemctl reload nginx

# 5. 验证
curl https://www.startide-design.com
```

### GitHub Release 回滚

```bash
# 1. 访问 GitHub Releases 页面
# 2. 找到要回滚的版本
# 3. 下载构建产物
# 4. 手动部署到服务器
```

## 通知配置

### Slack 通知

配置 Slack Webhook 接收部署通知：

```bash
# 1. 创建 Slack App
# 2. 启用 Incoming Webhooks
# 3. 创建 Webhook URL
# 4. 添加到 GitHub Secrets（SLACK_WEBHOOK）
```

通知内容包括：
- 部署状态（成功/失败）
- 分支名称
- 提交 SHA
- 提交作者
- 部署环境

### 邮件通知

GitHub Actions 默认会发送邮件通知：
- 工作流失败时通知
- 可在 GitHub 设置中配置

## 监控和日志

### GitHub Actions 日志

```bash
# 查看工作流运行历史
# GitHub → Actions → CI/CD Pipeline

# 查看详细日志
# 点击具体的工作流运行 → 查看各个任务的日志
```

### 服务器日志

```bash
# Nginx 访问日志
tail -f /var/log/nginx/access.log

# Nginx 错误日志
tail -f /var/log/nginx/error.log

# 应用日志（如果有）
tail -f /var/www/startide-design/logs/app.log
```

### 性能监控

```bash
# Lighthouse CI 报告
# GitHub Actions → performance-check → Lighthouse Report

# Codecov 覆盖率报告
# https://codecov.io/gh/your-org/startide-design
```

## 故障排查

### 构建失败

**问题**：构建失败，提示依赖安装错误

**解决**：
```bash
# 1. 检查 package.json 和 pnpm-lock.yaml
# 2. 本地测试构建
pnpm install
pnpm run build

# 3. 如果本地成功，清除 GitHub Actions 缓存
# GitHub → Actions → Caches → 删除缓存
```

### 测试失败

**问题**：单元测试失败

**解决**：
```bash
# 1. 本地运行测试
pnpm run test

# 2. 查看失败的测试用例
pnpm run test:watch

# 3. 修复测试或代码
# 4. 重新提交
```

### 部署失败

**问题**：SSH 连接失败

**解决**：
```bash
# 1. 检查 SSH 密钥配置
# 2. 验证服务器地址和端口
# 3. 测试 SSH 连接
ssh -i deploy_key user@server

# 4. 检查服务器防火墙
sudo ufw status

# 5. 检查 SSH 服务状态
sudo systemctl status ssh
```

**问题**：健康检查失败

**解决**：
```bash
# 1. SSH 登录到服务器
ssh deploy@server

# 2. 检查 Nginx 状态
sudo systemctl status nginx

# 3. 检查 Nginx 配置
sudo nginx -t

# 4. 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 5. 检查部署目录
ls -la /var/www/startide-design
```

### 性能问题

**问题**：Lighthouse 评分低于 90

**解决**：
```bash
# 1. 查看 Lighthouse 报告
# 2. 优化建议：
#    - 压缩图片
#    - 启用 Gzip/Brotli
#    - 减少 JavaScript 体积
#    - 使用 CDN
#    - 启用缓存
# 3. 本地测试
pnpm run build
pnpm run preview
# 4. 使用 Chrome DevTools Lighthouse 测试
```

## 最佳实践

### 1. 分支策略

```
main（生产环境）
  ↑
develop（开发环境）
  ↑
feature/xxx（功能分支）
```

### 2. 提交规范

```bash
# 使用约定式提交
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具

# 示例
git commit -m "feat: 添加用户登录功能"
git commit -m "fix: 修复上传文件大小限制问题"
```

### 3. 版本管理

```bash
# 使用语义化版本
v1.0.0 - 主版本.次版本.修订版本

# 主版本：不兼容的 API 修改
# 次版本：向下兼容的功能性新增
# 修订版本：向下兼容的问题修正
```

### 4. 测试覆盖

```bash
# 确保测试覆盖率达标
pnpm run test:coverage

# 查看覆盖率报告
open coverage/index.html
```

### 5. 代码审查

```bash
# 提交 PR 前自检
pnpm run lint
pnpm run type-check
pnpm run test
pnpm run build

# 通过后再提交 PR
```

## 安全建议

### 1. 密钥管理

- ✅ 使用 GitHub Secrets 存储敏感信息
- ✅ 定期轮换 SSH 密钥
- ✅ 使用强密码和 2FA
- ❌ 不要在代码中硬编码密钥
- ❌ 不要提交 .env 文件到仓库

### 2. 访问控制

- ✅ 限制 SSH 访问 IP
- ✅ 使用最小权限原则
- ✅ 定期审查访问权限
- ❌ 不要使用 root 用户部署

### 3. 依赖安全

- ✅ 定期运行 `pnpm audit`
- ✅ 及时更新依赖版本
- ✅ 使用 Snyk 扫描漏洞
- ❌ 不要使用已知有漏洞的依赖

## 参考资料

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vite 构建优化](https://vitejs.dev/guide/build.html)
- [Nginx 配置指南](https://nginx.org/en/docs/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Codecov](https://docs.codecov.com/)
- [Snyk](https://docs.snyk.io/)

## 联系方式

如有问题，请联系：
- 技术负责人：tech@startide-design.com
- 运维团队：ops@startide-design.com
