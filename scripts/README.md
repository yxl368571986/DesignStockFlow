# 星潮设计资源平台 - 部署脚本使用指南

本目录包含用于自动化部署星潮设计资源平台的脚本。

## 📋 脚本列表

### 1. install.sh - 环境安装脚本
自动安装所有必需的环境依赖，包括：
- Node.js 18 LTS
- PostgreSQL 14
- Nginx
- PM2
- Redis
- 防火墙配置

### 2. deploy.sh - 应用部署脚本
自动部署应用，包括：
- 拉取/复制代码
- 安装依赖
- 构建前后端
- 配置Nginx
- 启动服务
- 初始化数据库

## 🚀 快速开始

### 前置要求
- Ubuntu 20.04+ 或 Debian 10+ 系统
- Root权限
- 稳定的网络连接

### 步骤1: 安装环境

```bash
# 下载脚本到服务器
cd /root
git clone https://github.com/your-username/xingchao-design.git
cd xingchao-design

# 给脚本添加执行权限
chmod +x scripts/install.sh
chmod +x scripts/deploy.sh

# 运行环境安装脚本
sudo bash scripts/install.sh
```

**预计耗时**: 10-15分钟

**安装内容**:
- ✅ Node.js 18.x
- ✅ npm 包管理器
- ✅ PM2 进程管理器
- ✅ PostgreSQL 14 数据库
- ✅ Nginx Web服务器
- ✅ Redis 缓存服务
- ✅ 防火墙规则配置
- ✅ 数据库和用户创建

**安装完成后**，脚本会显示：
- 已安装软件的版本信息
- 数据库配置信息（保存在 `/root/.xingchao_db_config`）
- 项目目录位置

### 步骤2: 部署应用

```bash
# 运行应用部署脚本
sudo bash scripts/deploy.sh
```

**部署选项**:
1. **从Git仓库拉取代码** - 适合生产环境
2. **使用本地代码** - 适合开发测试

**预计耗时**: 5-10分钟

**部署内容**:
- ✅ 代码拉取/复制
- ✅ 环境配置文件创建
- ✅ 后端依赖安装
- ✅ 数据库迁移和初始化
- ✅ 后端代码构建
- ✅ 前端依赖安装
- ✅ 前端代码构建
- ✅ Nginx配置
- ✅ 后端服务启动

**部署完成后**，脚本会显示：
- 访问地址（前台和后台）
- 数据库连接信息
- 测试账号信息
- 服务管理命令

## 📝 使用说明

### 环境安装脚本 (install.sh)

**功能特性**:
- ✅ 自动检测操作系统
- ✅ 智能跳过已安装的软件
- ✅ 自动生成安全的数据库密码
- ✅ 配置防火墙规则（开放80、443、22端口）
- ✅ 设置服务开机自启
- ✅ 保存配置信息供后续使用

**注意事项**:
- 必须使用root权限运行
- 首次运行时间较长，请耐心等待
- 如果软件已安装，脚本会询问是否重新安装
- 数据库密码会自动生成并保存到 `/root/.xingchao_db_config`

### 应用部署脚本 (deploy.sh)

**功能特性**:
- ✅ 支持Git仓库和本地代码两种部署方式
- ✅ 自动创建环境配置文件
- ✅ 自动运行数据库迁移
- ✅ 自动构建前后端代码
- ✅ 自动配置Nginx反向代理
- ✅ 使用PM2管理后端进程
- ✅ 自动重启服务

**注意事项**:
- 必须先运行 `install.sh` 安装环境
- 部署前请确保代码已提交到Git仓库（如果选择Git部署）
- 首次部署需要手动创建测试账号
- 部署完成后需要配置支付和短信服务

## 🔧 配置说明

### 数据库配置

数据库配置保存在 `/root/.xingchao_db_config`：

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=xingchao_design
DB_USER=xingchao_user
DB_PASSWORD=<自动生成的密码>
DATABASE_URL=postgresql://xingchao_user:<密码>@localhost:5432/xingchao_design
```

### 后端环境配置

后端配置文件位于 `backend/.env`，部署脚本会自动创建。

**需要手动配置的项**:
- 微信支付配置（WECHAT_*）
- 支付宝配置（ALIPAY_*）
- 短信服务配置（SMS_*）

### 前端环境配置

前端配置文件位于 `.env.production`，部署脚本会自动创建。

**主要配置项**:
- `VITE_API_BASE_URL`: API地址
- `VITE_APP_TITLE`: 应用标题
- `VITE_UPLOAD_MAX_SIZE`: 上传文件大小限制

### Nginx配置

Nginx配置文件位于 `/etc/nginx/sites-available/xingchao-design`。

**主要功能**:
- 前端静态文件服务
- API反向代理
- 文件上传支持（最大1000MB）
- Gzip压缩
- 静态资源缓存

## 📊 服务管理

### PM2命令

```bash
# 查看所有进程
pm2 list

# 查看后端日志
pm2 logs xingchao-backend

# 查看实时日志
pm2 logs xingchao-backend --lines 100

# 重启后端服务
pm2 restart xingchao-backend

# 停止后端服务
pm2 stop xingchao-backend

# 删除进程
pm2 delete xingchao-backend

# 查看进程详情
pm2 show xingchao-backend

# 监控进程
pm2 monit
```

### Nginx命令

```bash
# 测试配置文件
nginx -t

# 重启Nginx
systemctl restart nginx

# 重新加载配置
systemctl reload nginx

# 查看状态
systemctl status nginx

# 查看访问日志
tail -f /var/log/nginx/xingchao-design-access.log

# 查看错误日志
tail -f /var/log/nginx/xingchao-design-error.log
```

### PostgreSQL命令

```bash
# 连接数据库
psql -U xingchao_user -d xingchao_design

# 查看数据库列表
psql -U postgres -c "\l"

# 备份数据库
pg_dump -U xingchao_user xingchao_design > backup.sql

# 恢复数据库
psql -U xingchao_user xingchao_design < backup.sql

# 查看数据库大小
psql -U xingchao_user -d xingchao_design -c "SELECT pg_size_pretty(pg_database_size('xingchao_design'));"
```

## 🔍 故障排查

### 后端服务无法启动

```bash
# 查看PM2日志
pm2 logs xingchao-backend --err

# 检查端口占用
netstat -tlnp | grep 3000

# 检查数据库连接
psql -U xingchao_user -d xingchao_design -c "SELECT 1;"

# 手动启动后端（调试模式）
cd /var/www/xingchao-design/backend
node dist/app.js
```

### Nginx无法访问

```bash
# 检查Nginx状态
systemctl status nginx

# 测试配置文件
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log

# 检查端口占用
netstat -tlnp | grep 80
```

### 数据库连接失败

```bash
# 检查PostgreSQL状态
systemctl status postgresql

# 检查数据库是否存在
psql -U postgres -c "\l" | grep xingchao_design

# 检查用户权限
psql -U postgres -c "\du" | grep xingchao_user

# 重启PostgreSQL
systemctl restart postgresql
```

### 前端页面404

```bash
# 检查dist目录是否存在
ls -la /var/www/xingchao-design/dist

# 重新构建前端
cd /var/www/xingchao-design
npm run build

# 检查Nginx配置
nginx -t
cat /etc/nginx/sites-available/xingchao-design
```

## 🔐 安全建议

1. **修改默认密码**: 部署完成后立即修改数据库密码和管理员密码
2. **配置SSL证书**: 使用Let's Encrypt配置HTTPS
3. **配置防火墙**: 仅开放必要的端口
4. **定期备份**: 设置定时任务备份数据库
5. **更新依赖**: 定期更新系统和应用依赖
6. **监控日志**: 定期检查系统和应用日志

## 📚 相关文档

- [部署文档](../docs/DEPLOY.md)
- [API文档](../docs/API.md)
- [数据库文档](../docs/DATABASE.md)
- [开发文档](../README.md)

## ❓ 常见问题

### Q: 脚本运行失败怎么办？
A: 查看错误信息，通常是网络问题或权限问题。可以重新运行脚本，已安装的软件会自动跳过。

### Q: 如何更新应用？
A: 重新运行 `deploy.sh` 脚本即可，脚本会自动拉取最新代码并重新部署。

### Q: 如何修改端口？
A: 修改 `deploy.sh` 中的 `BACKEND_PORT` 和 `FRONTEND_PORT` 变量，然后重新运行脚本。

### Q: 如何配置域名？
A: 修改 `/etc/nginx/sites-available/xingchao-design` 中的 `server_name`，然后重启Nginx。

### Q: 如何配置SSL证书？
A: 使用certbot工具申请Let's Encrypt证书，然后修改Nginx配置添加SSL配置。

## 📞 技术支持

如有问题，请联系技术支持团队或提交Issue。

---

**星潮设计团队** © 2024
