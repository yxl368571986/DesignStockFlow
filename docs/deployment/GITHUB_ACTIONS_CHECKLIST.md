# GitHub Actions 配置检查清单

## 📋 配置前检查

### 1. 仓库准备

- [ ] GitHub 仓库已创建
- [ ] 代码已推送到仓库
- [ ] 分支策略已确定（main/develop）
- [ ] 团队成员权限已配置

### 2. 服务器准备

#### 开发服务器

- [ ] 服务器已购买/租用
- [ ] 域名已配置（dev.startide-design.com）
- [ ] SSL 证书已安装
- [ ] Nginx 已安装并配置
- [ ] 部署目录已创建（/var/www/startide-design-dev）
- [ ] 部署用户已创建（deploy）
- [ ] 防火墙规则已配置

#### 生产服务器

- [ ] 服务器已购买/租用
- [ ] 域名已配置（www.startide-design.com）
- [ ] SSL 证书已安装
- [ ] Nginx 已安装并配置
- [ ] 部署目录已创建（/var/www/startide-design）
- [ ] 部署用户已创建（deploy）
- [ ] 防火墙规则已配置
- [ ] 备份策略已制定

### 3. 本地环境

- [ ] Node.js 20.x 已安装
- [ ] pnpm 8.x 已安装
- [ ] Git 已配置
- [ ] SSH 密钥已生成

## 🔑 SSH 密钥配置

### 生成密钥

```bash
# 开发环境密钥
ssh-keygen -t rsa -b 4096 -C "deploy-dev@startide-design.com" -f deploy_key_dev

# 生产环境密钥
ssh-keygen -t rsa -b 4096 -C "deploy-prod@startide-design.com" -f deploy_key_prod
```

- [ ] 开发环境密钥已生成
- [ ] 生产环境密钥已生成
- [ ] 私钥已妥善保管
- [ ] 公钥已复制

### 配置服务器

#### 开发服务器

```bash
# 登录开发服务器
ssh user@dev.startide-design.com

# 创建部署用户
sudo useradd -m -s /bin/bash deploy
sudo passwd deploy

# 配置 SSH
sudo su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat >> ~/.ssh/authorized_keys << EOF
<粘贴 deploy_key_dev.pub 内容>
EOF
chmod 600 ~/.ssh/authorized_keys
exit

# 配置 sudo 权限（用于重启 Nginx）
sudo visudo
# 添加：deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
```

- [ ] 部署用户已创建
- [ ] SSH 公钥已添加
- [ ] 权限已正确设置
- [ ] sudo 权限已配置
- [ ] SSH 连接已测试

#### 生产服务器

```bash
# 登录生产服务器
ssh user@www.startide-design.com

# 创建部署用户
sudo useradd -m -s /bin/bash deploy
sudo passwd deploy

# 配置 SSH
sudo su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat >> ~/.ssh/authorized_keys << EOF
<粘贴 deploy_key_prod.pub 内容>
EOF
chmod 600 ~/.ssh/authorized_keys
exit

# 配置 sudo 权限
sudo visudo
# 添加：deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
```

- [ ] 部署用户已创建
- [ ] SSH 公钥已添加
- [ ] 权限已正确设置
- [ ] sudo 权限已配置
- [ ] SSH 连接已测试

### 测试连接

```bash
# 测试开发服务器连接
ssh -i deploy_key_dev deploy@dev.startide-design.com

# 测试生产服务器连接
ssh -i deploy_key_prod deploy@www.startide-design.com
```

- [ ] 开发服务器连接成功
- [ ] 生产服务器连接成功

## 🔐 GitHub Secrets 配置

### 必需的 Secrets

访问：`GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret`

#### 开发环境（7个）

- [ ] `DEV_API_BASE_URL`
  - 值：`https://dev-api.startide-design.com`
  
- [ ] `DEV_CDN_BASE_URL`
  - 值：`https://dev-cdn.startide-design.com`
  
- [ ] `DEV_SSH_PRIVATE_KEY`
  - 值：`deploy_key_dev` 文件的完整内容
  - 包括 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`
  
- [ ] `DEV_SERVER_HOST`
  - 值：`dev.startide-design.com`
  
- [ ] `DEV_SERVER_USER`
  - 值：`deploy`
  
- [ ] `DEV_SERVER_PORT`
  - 值：`22`
  
- [ ] `DEV_DEPLOY_PATH`
  - 值：`/var/www/startide-design-dev`

#### 生产环境（7个）

- [ ] `PROD_API_BASE_URL`
  - 值：`https://api.startide-design.com`
  
- [ ] `PROD_CDN_BASE_URL`
  - 值：`https://cdn.startide-design.com`
  
- [ ] `PROD_SSH_PRIVATE_KEY`
  - 值：`deploy_key_prod` 文件的完整内容
  - 包括 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`
  
- [ ] `PROD_SERVER_HOST`
  - 值：`www.startide-design.com`
  
- [ ] `PROD_SERVER_USER`
  - 值：`deploy`
  
- [ ] `PROD_SERVER_PORT`
  - 值：`22`
  
- [ ] `PROD_DEPLOY_PATH`
  - 值：`/var/www/startide-design`

### 可选的 Secrets（第三方服务）

#### Codecov（测试覆盖率）

- [ ] 注册 Codecov 账号：https://codecov.io
- [ ] 添加仓库到 Codecov
- [ ] 获取 Upload Token
- [ ] `CODECOV_TOKEN`
  - 值：从 Codecov 获取的 Token

#### Snyk（安全扫描）

- [ ] 注册 Snyk 账号：https://snyk.io
- [ ] 获取 API Token
- [ ] `SNYK_TOKEN`
  - 值：从 Snyk 获取的 Token

#### Slack（通知）

- [ ] 创建 Slack Workspace
- [ ] 创建 Slack App
- [ ] 启用 Incoming Webhooks
- [ ] 创建 Webhook URL
- [ ] `SLACK_WEBHOOK`
  - 值：Webhook URL

#### Lighthouse CI（性能测试）

- [ ] 安装 Lighthouse CI GitHub App
- [ ] 获取 App Token
- [ ] `LHCI_GITHUB_APP_TOKEN`
  - 值：从 Lighthouse CI 获取的 Token

## 📁 工作流文件

### 检查文件

- [ ] `.github/workflows/deploy.yml` 已创建
- [ ] 工作流配置正确
- [ ] 触发条件正确
- [ ] 环境变量正确
- [ ] 任务依赖关系正确

### 验证配置

```bash
# 检查 YAML 语法
# 使用在线工具：https://www.yamllint.com/
# 或使用 VS Code YAML 插件
```

- [ ] YAML 语法正确
- [ ] 缩进正确
- [ ] 引号使用正确

## 🧪 测试配置

### 本地测试

```bash
# 1. 代码检查
pnpm run lint:check
pnpm run format:check
pnpm run type-check

# 2. 运行测试
pnpm run test
pnpm run test:coverage

# 3. 构建测试
pnpm run build:dev
pnpm run build:prod

# 4. 预览构建
pnpm run preview
```

- [ ] 代码检查通过
- [ ] 测试通过
- [ ] 构建成功
- [ ] 预览正常

### 推送测试

```bash
# 1. 创建测试分支
git checkout -b test/ci-cd

# 2. 提交更改
git add .
git commit -m "test: CI/CD 配置测试"

# 3. 推送到远程
git push origin test/ci-cd

# 4. 查看 GitHub Actions
# GitHub → Actions → 查看工作流运行
```

- [ ] 工作流已触发
- [ ] lint 任务通过
- [ ] test 任务通过
- [ ] build 任务通过
- [ ] 构建产物已上传

## 🚀 部署测试

### 开发环境部署

```bash
# 1. 推送到 develop 分支
git checkout develop
git merge test/ci-cd
git push origin develop

# 2. 查看 GitHub Actions
# 等待部署完成

# 3. 验证部署
curl https://dev.startide-design.com
# 或在浏览器访问

# 4. 检查服务器
ssh deploy@dev.startide-design.com
ls -la /var/www/startide-design-dev
```

- [ ] 工作流已触发
- [ ] 所有任务通过
- [ ] 部署成功
- [ ] 健康检查通过
- [ ] 网站可访问
- [ ] 功能正常

### 生产环境部署

```bash
# 1. 推送到 main 分支
git checkout main
git merge develop
git push origin main

# 2. 查看 GitHub Actions
# 等待部署完成

# 3. 验证部署
curl https://www.startide-design.com
# 或在浏览器访问

# 4. 检查服务器
ssh deploy@www.startide-design.com
ls -la /var/www/startide-design
ls -la /var/www/ | grep backup

# 5. 检查 GitHub Release
# GitHub → Releases → 查看最新 Release
```

- [ ] 工作流已触发
- [ ] 所有任务通过
- [ ] 备份已创建
- [ ] 部署成功
- [ ] 健康检查通过
- [ ] 性能测试通过
- [ ] 网站可访问
- [ ] 功能正常
- [ ] Release 已创建

## 📊 监控配置

### GitHub Actions

- [ ] 工作流运行历史可查看
- [ ] 日志详细且清晰
- [ ] 失败时有明确错误信息

### Codecov

- [ ] 覆盖率报告可查看
- [ ] 覆盖率徽章已添加到 README
- [ ] 覆盖率趋势正常

### Slack

- [ ] 部署成功通知已收到
- [ ] 部署失败通知已收到
- [ ] 通知内容完整

### 服务器监控

```bash
# 设置监控脚本
ssh deploy@server

# 创建监控脚本
cat > ~/monitor.sh << 'EOF'
#!/bin/bash
while true; do
  if ! curl -f https://www.startide-design.com > /dev/null 2>&1; then
    echo "网站无法访问！" | mail -s "网站告警" admin@startide-design.com
  fi
  sleep 300
done
EOF

chmod +x ~/monitor.sh

# 使用 systemd 运行监控
sudo nano /etc/systemd/system/website-monitor.service
# 配置服务...
```

- [ ] 服务器监控已配置
- [ ] 告警通知已配置
- [ ] 日志轮转已配置

## 🔄 回滚测试

### 测试回滚流程

```bash
# 1. SSH 登录服务器
ssh deploy@www.startide-design.com

# 2. 查看备份
ls -la /var/www/ | grep backup

# 3. 模拟回滚
cd /var/www
sudo mv startide-design startide-design_temp
sudo cp -r startide-design_backup_YYYYMMDD_HHMMSS startide-design
sudo systemctl reload nginx

# 4. 验证
curl https://www.startide-design.com

# 5. 恢复
sudo rm -rf startide-design
sudo mv startide-design_temp startide-design
sudo systemctl reload nginx
```

- [ ] 备份存在
- [ ] 回滚成功
- [ ] 网站恢复正常
- [ ] 回滚流程文档化

## 📝 文档检查

### 必需文档

- [ ] `CI_CD_GUIDE.md` - 完整指南
- [ ] `CI_CD_QUICK_REFERENCE.md` - 快速参考
- [ ] `GITHUB_ACTIONS_CHECKLIST.md` - 配置检查清单
- [ ] `README.md` - 包含 CI/CD 说明

### 文档内容

- [ ] 配置步骤清晰
- [ ] 命令示例完整
- [ ] 故障排查指南完善
- [ ] 联系方式正确

## ✅ 最终检查

### 功能验证

- [ ] 代码推送触发工作流
- [ ] PR 触发工作流
- [ ] 手动触发工作流
- [ ] 开发环境自动部署
- [ ] 生产环境自动部署
- [ ] 健康检查正常
- [ ] 通知发送正常

### 性能验证

- [ ] 构建时间合理（< 10分钟）
- [ ] 部署时间合理（< 5分钟）
- [ ] 网站性能达标（Lighthouse > 90）
- [ ] 构建产物大小合理（< 200MB）

### 安全验证

- [ ] SSH 密钥安全存储
- [ ] Secrets 正确配置
- [ ] 服务器访问受限
- [ ] 依赖无高危漏洞
- [ ] HTTPS 强制启用

### 团队准备

- [ ] 团队成员已培训
- [ ] 部署流程已文档化
- [ ] 应急预案已制定
- [ ] 联系方式已更新

## 🎉 上线准备

### 上线前确认

- [ ] 所有检查项已完成
- [ ] 测试环境验证通过
- [ ] 生产环境验证通过
- [ ] 团队成员已知晓
- [ ] 备份策略已执行

### 上线步骤

1. [ ] 通知团队上线时间
2. [ ] 备份当前生产环境
3. [ ] 合并代码到 main 分支
4. [ ] 监控部署过程
5. [ ] 验证部署结果
6. [ ] 通知团队上线完成

### 上线后监控

- [ ] 监控服务器状态（1小时）
- [ ] 监控错误日志（1小时）
- [ ] 监控用户反馈（24小时）
- [ ] 准备回滚方案

## 📞 支持联系

- **技术支持**：tech@startide-design.com
- **运维团队**：ops@startide-design.com
- **紧急联系**：+86 138-xxxx-xxxx

## 📚 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [CI/CD 完整指南](./CI_CD_GUIDE.md)
- [CI/CD 快速参考](./CI_CD_QUICK_REFERENCE.md)
- [环境配置指南](./ENV_CONFIGURATION_GUIDE.md)
- [构建配置指南](./BUILD_GUIDE.md)
- [Nginx 部署指南](./NGINX_DEPLOYMENT_GUIDE.md)

---

**配置完成日期**：__________

**配置人员**：__________

**审核人员**：__________
