# CI/CD 快速参考

## 快速开始

### 首次配置

```bash
# 1. 配置 GitHub Secrets（必需）
# Settings → Secrets and variables → Actions

# 开发环境（6个）
DEV_API_BASE_URL=https://dev-api.startide-design.com
DEV_CDN_BASE_URL=https://dev-cdn.startide-design.com
DEV_SSH_PRIVATE_KEY=<SSH私钥>
DEV_SERVER_HOST=dev.startide-design.com
DEV_SERVER_USER=deploy
DEV_SERVER_PORT=22
DEV_DEPLOY_PATH=/var/www/startide-design-dev

# 生产环境（7个）
PROD_API_BASE_URL=https://api.startide-design.com
PROD_CDN_BASE_URL=https://cdn.startide-design.com
PROD_SSH_PRIVATE_KEY=<SSH私钥>
PROD_SERVER_HOST=www.startide-design.com
PROD_SERVER_USER=deploy
PROD_SERVER_PORT=22
PROD_DEPLOY_PATH=/var/www/startide-design

# 可选服务（4个）
CODECOV_TOKEN=<Codecov令牌>
SNYK_TOKEN=<Snyk令牌>
SLACK_WEBHOOK=<Slack Webhook URL>
LHCI_GITHUB_APP_TOKEN=<Lighthouse CI令牌>

# 2. 生成 SSH 密钥
ssh-keygen -t rsa -b 4096 -C "deploy@startide-design.com" -f deploy_key

# 3. 配置服务器
ssh user@server
cat deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 4. 测试连接
ssh -i deploy_key user@server
```

## 常用命令

### 本地测试

```bash
# 代码检查
pnpm run lint:check          # ESLint检查
pnpm run format:check         # Prettier检查
pnpm run type-check           # TypeScript检查

# 运行测试
pnpm run test                 # 单元测试
pnpm run test:coverage        # 测试覆盖率

# 构建项目
pnpm run build:dev            # 开发环境构建
pnpm run build:prod           # 生产环境构建

# 预览构建
pnpm run preview              # 预览构建产物
```

### 部署命令

```bash
# 开发环境部署
git checkout develop
git add .
git commit -m "feat: 新功能"
git push origin develop
# → 自动触发部署到 dev.startide-design.com

# 生产环境部署
git checkout main
git merge develop
git push origin main
# → 自动触发部署到 www.startide-design.com

# 手动触发部署
# GitHub → Actions → CI/CD Pipeline → Run workflow
```

## 工作流状态

### 查看状态

```bash
# 1. 访问 GitHub Actions 页面
https://github.com/your-org/startide-design/actions

# 2. 查看最近的工作流运行
# 3. 点击查看详细日志
```

### 状态标识

- ✅ 成功（绿色）
- ❌ 失败（红色）
- 🟡 进行中（黄色）
- ⚪ 跳过（灰色）

## 故障排查

### 构建失败

```bash
# 检查依赖
pnpm install
pnpm run build

# 清除缓存
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### 测试失败

```bash
# 运行测试
pnpm run test

# 查看详细信息
pnpm run test:watch
```

### 部署失败

```bash
# 测试 SSH 连接
ssh -i deploy_key user@server

# 检查服务器状态
ssh user@server
sudo systemctl status nginx
sudo nginx -t
```

### 回滚版本

```bash
# SSH 登录服务器
ssh deploy@server

# 查看备份
ls -la /var/www/ | grep backup

# 恢复备份
cd /var/www
rm -rf startide-design
cp -r startide-design_backup_YYYYMMDD_HHMMSS startide-design
sudo systemctl reload nginx
```

## 环境变量

### 开发环境

```env
VITE_API_BASE_URL=https://dev-api.startide-design.com
VITE_CDN_BASE_URL=https://dev-cdn.startide-design.com
VITE_APP_TITLE=星潮设计（开发）
VITE_APP_ENV=development
```

### 生产环境

```env
VITE_API_BASE_URL=https://api.startide-design.com
VITE_CDN_BASE_URL=https://cdn.startide-design.com
VITE_APP_TITLE=星潮设计
VITE_APP_ENV=production
```

## 性能指标

### 目标值

- Lighthouse 评分：≥ 90
- 首屏加载时间：< 2s
- 白屏时间：< 1s
- 可交互时间：< 3s
- 总体积：< 200MB
- 主 chunk：< 1MB

### 检查命令

```bash
# 构建并分析
pnpm run build:analyze

# 查看产物大小
du -sh dist
find dist/js -name "*.js" -type f -exec du -h {} \; | sort -rh
```

## 安全检查

### 依赖扫描

```bash
# npm audit
pnpm audit --audit-level=moderate

# 修复漏洞
pnpm audit fix
```

### 代码扫描

```bash
# ESLint 安全规则
pnpm run lint:check

# 手动检查
# - 不要硬编码密钥
# - 不要提交 .env 文件
# - 使用 HTTPS
# - 验证用户输入
```

## 监控和通知

### Slack 通知

部署成功/失败会自动发送 Slack 通知：
- 部署状态
- 分支名称
- 提交信息
- 部署环境

### 邮件通知

GitHub Actions 失败时会发送邮件通知到：
- 提交者邮箱
- 仓库管理员邮箱

### 日志查看

```bash
# GitHub Actions 日志
GitHub → Actions → 选择工作流 → 查看日志

# 服务器日志
ssh user@server
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 最佳实践

### 提交规范

```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具

# 示例
git commit -m "feat: 添加用户登录功能"
```

### 分支策略

```
main（生产）← develop（开发）← feature/xxx（功能）
```

### 部署流程

```
1. 功能开发 → feature 分支
2. 合并到 develop → 自动部署到开发环境
3. 测试通过 → 合并到 main → 自动部署到生产环境
```

## 常见问题

### Q: 如何跳过 CI 检查？

```bash
# 在提交信息中添加 [skip ci]
git commit -m "docs: 更新文档 [skip ci]"
```

### Q: 如何只运行特定任务？

```bash
# 修改 .github/workflows/deploy.yml
# 注释掉不需要的任务
```

### Q: 如何加速构建？

```bash
# 1. 使用缓存（已配置）
# 2. 减少依赖
# 3. 使用 pnpm（已使用）
# 4. 并行执行任务（已配置）
```

### Q: 如何查看覆盖率报告？

```bash
# 本地生成
pnpm run test:coverage
open coverage/index.html

# 在线查看
https://codecov.io/gh/your-org/startide-design
```

### Q: 如何手动部署？

```bash
# 方式1：GitHub Actions 手动触发
GitHub → Actions → CI/CD Pipeline → Run workflow

# 方式2：本地构建后手动上传
pnpm run build:prod
scp -r dist/* user@server:/var/www/startide-design/
```

## 联系方式

- 技术支持：tech@startide-design.com
- 运维团队：ops@startide-design.com
- 紧急联系：+86 138-xxxx-xxxx

## 相关文档

- [完整 CI/CD 指南](./CI_CD_GUIDE.md)
- [环境配置指南](./ENV_CONFIGURATION_GUIDE.md)
- [构建配置指南](./BUILD_GUIDE.md)
- [Nginx 配置指南](./NGINX_DEPLOYMENT_GUIDE.md)
