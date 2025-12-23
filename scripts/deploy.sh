#!/bin/bash

###############################################################################
# 星潮设计资源平台 - 应用部署脚本
# 功能: 自动拉取代码、安装依赖、构建前端、配置Nginx、启动后端服务
# 适用系统: Ubuntu 20.04+ / Debian 10+
# 作者: 星潮设计团队
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_DIR="/var/www/xingchao-design"
REPO_URL="https://github.com/your-username/xingchao-design.git"  # 请修改为实际的仓库地址
BRANCH="main"
BACKEND_PORT=3000
FRONTEND_PORT=80

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "请使用root权限运行此脚本"
        log_info "使用命令: sudo bash deploy.sh"
        exit 1
    fi
}

# 检查环境依赖
check_dependencies() {
    log_info "检查环境依赖..."
    
    local missing_deps=()
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    # 检查PM2
    if ! command -v pm2 &> /dev/null; then
        missing_deps+=("PM2")
    fi
    
    # 检查PostgreSQL
    if ! command -v psql &> /dev/null; then
        missing_deps+=("PostgreSQL")
    fi
    
    # 检查Nginx
    if ! command -v nginx &> /dev/null; then
        missing_deps+=("Nginx")
    fi
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        missing_deps+=("Git")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "缺少以下依赖: ${missing_deps[*]}"
        log_info "请先运行环境安装脚本: bash scripts/install.sh"
        exit 1
    fi
    
    log_success "环境依赖检查通过"
}

# 加载数据库配置
load_db_config() {
    log_info "加载数据库配置..."
    
    DB_CONFIG_FILE="/root/.xingchao_db_config"
    
    if [ -f "$DB_CONFIG_FILE" ]; then
        source $DB_CONFIG_FILE
        log_success "数据库配置加载成功"
    else
        log_error "数据库配置文件不存在: $DB_CONFIG_FILE"
        log_info "请先运行环境安装脚本: bash scripts/install.sh"
        exit 1
    fi
}

# 拉取代码
pull_code() {
    log_info "拉取项目代码..."
    
    if [ -d "$PROJECT_DIR/.git" ]; then
        log_info "项目目录已存在,更新代码..."
        cd $PROJECT_DIR
        git fetch origin
        git reset --hard origin/$BRANCH
        git pull origin $BRANCH
        log_success "代码更新完成"
    else
        log_info "克隆项目代码..."
        
        # 如果目录存在但不是git仓库,先备份
        if [ -d "$PROJECT_DIR" ]; then
            BACKUP_DIR="${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
            log_warning "备份现有目录到: $BACKUP_DIR"
            mv $PROJECT_DIR $BACKUP_DIR
        fi
        
        # 克隆代码
        git clone -b $BRANCH $REPO_URL $PROJECT_DIR
        cd $PROJECT_DIR
        log_success "代码克隆完成"
    fi
}

# 如果没有远程仓库,使用本地代码
use_local_code() {
    log_info "使用本地代码部署..."
    
    # 获取当前脚本所在目录的父目录(项目根目录)
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    LOCAL_PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
    
    log_info "本地项目目录: $LOCAL_PROJECT_DIR"
    
    # 如果部署目录与本地目录不同,复制代码
    if [ "$LOCAL_PROJECT_DIR" != "$PROJECT_DIR" ]; then
        log_info "复制代码到部署目录..."
        
        # 创建部署目录
        mkdir -p $PROJECT_DIR
        
        # 复制代码(排除node_modules和.git)
        rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' \
              $LOCAL_PROJECT_DIR/ $PROJECT_DIR/
        
        log_success "代码复制完成"
    else
        log_info "已在部署目录,跳过复制"
    fi
    
    cd $PROJECT_DIR
}

# 创建环境配置文件
create_env_files() {
    log_info "创建环境配置文件..."
    
    # 后端环境配置
    log_info "创建后端.env文件..."
    cat > $PROJECT_DIR/backend/.env <<EOF
# 数据库配置
DATABASE_URL=$DATABASE_URL
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# 服务器配置
PORT=$BACKEND_PORT
NODE_ENV=production

# JWT配置
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=1000

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# 微信支付配置(请填写实际配置)
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_MCH_ID=your_wechat_mch_id
WECHAT_API_KEY=your_wechat_api_key

# 支付宝配置(请填写实际配置)
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_alipay_private_key
ALIPAY_PUBLIC_KEY=your_alipay_public_key

# 短信服务配置(请填写实际配置)
SMS_ACCESS_KEY=your_sms_access_key
SMS_SECRET_KEY=your_sms_secret_key
EOF
    
    log_success "后端.env文件创建完成"
    
    # 前端环境配置
    log_info "创建前端.env.production文件..."
    cat > $PROJECT_DIR/.env.production <<EOF
# API地址
VITE_API_BASE_URL=http://localhost:$BACKEND_PORT/api/v1
VITE_API_TIMEOUT=30000

# 应用配置
VITE_APP_TITLE=星潮设计资源平台
VITE_APP_VERSION=1.0.0

# 上传配置
VITE_UPLOAD_MAX_SIZE=1000
EOF
    
    log_success "前端.env.production文件创建完成"
}

# 安装后端依赖
install_backend_deps() {
    log_info "安装后端依赖..."
    
    cd $PROJECT_DIR/backend
    
    # 清理旧的node_modules
    if [ -d "node_modules" ]; then
        log_info "清理旧的node_modules..."
        rm -rf node_modules
    fi
    
    # 安装依赖
    npm install --production
    
    log_success "后端依赖安装完成"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    cd $PROJECT_DIR/backend
    
    # 运行Prisma迁移
    log_info "运行数据库迁移..."
    npx prisma migrate deploy
    
    # 生成Prisma Client
    log_info "生成Prisma Client..."
    npx prisma generate
    
    # 运行数据库种子(如果存在)
    if [ -f "prisma/seed.ts" ]; then
        log_info "运行数据库种子..."
        npx ts-node prisma/seed.ts || log_warning "数据库种子运行失败(可能已初始化)"
    fi
    
    log_success "数据库初始化完成"
}

# 构建后端
build_backend() {
    log_info "构建后端代码..."
    
    cd $PROJECT_DIR/backend
    
    # 编译TypeScript
    npm run build
    
    log_success "后端构建完成"
}

# 安装前端依赖
install_frontend_deps() {
    log_info "安装前端依赖..."
    
    cd $PROJECT_DIR
    
    # 清理旧的node_modules
    if [ -d "node_modules" ]; then
        log_info "清理旧的node_modules..."
        rm -rf node_modules
    fi
    
    # 安装依赖
    npm install
    
    log_success "前端依赖安装完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端代码..."
    
    cd $PROJECT_DIR
    
    # 清理旧的dist目录
    if [ -d "dist" ]; then
        log_info "清理旧的dist目录..."
        rm -rf dist
    fi
    
    # 构建前端
    npm run build
    
    log_success "前端构建完成"
}

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."
    
    # 获取服务器IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    # 创建Nginx配置文件
    NGINX_CONFIG="/etc/nginx/sites-available/xingchao-design"
    
    cat > $NGINX_CONFIG <<EOF
# 星潮设计资源平台 - Nginx配置

# 后端API代理
upstream backend_api {
    server localhost:$BACKEND_PORT;
    keepalive 64;
}

server {
    listen 80;
    server_name $SERVER_IP localhost;
    
    # 日志配置
    access_log /var/log/nginx/xingchao-design-access.log;
    error_log /var/log/nginx/xingchao-design-error.log;
    
    # 前端静态文件
    location / {
        root $PROJECT_DIR/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # 缓存配置
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理
    location /api/ {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        
        # 代理头设置
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 缓冲设置
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # 文件上传
    location /uploads/ {
        alias $PROJECT_DIR/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root $PROJECT_DIR/dist;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;
    
    # 文件上传大小限制
    client_max_body_size 1000M;
    client_body_buffer_size 128k;
}
EOF
    
    # 启用站点配置
    if [ ! -L "/etc/nginx/sites-enabled/xingchao-design" ]; then
        ln -s $NGINX_CONFIG /etc/nginx/sites-enabled/xingchao-design
        log_success "Nginx站点配置已启用"
    else
        log_info "Nginx站点配置已存在"
    fi
    
    # 删除默认站点配置
    if [ -L "/etc/nginx/sites-enabled/default" ]; then
        rm /etc/nginx/sites-enabled/default
        log_info "已删除Nginx默认站点配置"
    fi
    
    # 测试Nginx配置
    log_info "测试Nginx配置..."
    nginx -t
    
    # 重启Nginx
    log_info "重启Nginx服务..."
    systemctl restart nginx
    
    log_success "Nginx配置完成"
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    
    cd $PROJECT_DIR/backend
    
    # 停止旧的PM2进程
    pm2 delete xingchao-backend 2>/dev/null || log_info "没有运行中的后端进程"
    
    # 启动后端服务
    pm2 start dist/app.js --name xingchao-backend \
        --max-memory-restart 500M \
        --error-log /var/log/pm2/xingchao-backend-error.log \
        --out-log /var/log/pm2/xingchao-backend-out.log
    
    # 保存PM2进程列表
    pm2 save
    
    # 等待服务启动
    sleep 3
    
    # 检查服务状态
    if pm2 list | grep -q "xingchao-backend.*online"; then
        log_success "后端服务启动成功"
    else
        log_error "后端服务启动失败"
        pm2 logs xingchao-backend --lines 20
        exit 1
    fi
}

# 创建测试账号
create_test_accounts() {
    log_info "创建测试账号..."
    
    # 这里可以通过API或直接操作数据库创建测试账号
    # 由于需要调用后端API,这里仅提示
    log_warning "请手动创建测试账号或通过注册页面创建"
    log_info "建议创建以下测试账号:"
    echo "  - 普通用户: test_user / 123456"
    echo "  - VIP用户: test_vip / 123456"
    echo "  - 管理员: admin / admin123"
}

# 显示部署总结
show_summary() {
    # 获取服务器IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo "=========================================="
    log_success "应用部署完成!"
    echo "=========================================="
    echo ""
    log_info "部署信息:"
    echo "  - 项目目录: $PROJECT_DIR"
    echo "  - 后端端口: $BACKEND_PORT"
    echo "  - 前端端口: $FRONTEND_PORT"
    echo ""
    log_info "访问地址:"
    echo "  - 前台页面: http://$SERVER_IP"
    echo "  - 后台管理: http://$SERVER_IP/admin"
    echo "  - API文档: http://$SERVER_IP/api/docs (如果已配置)"
    echo ""
    log_info "数据库信息:"
    echo "  - 数据库名: $DB_NAME"
    echo "  - 数据库用户: $DB_USER"
    echo "  - 连接地址: $DATABASE_URL"
    echo ""
    log_info "测试账号(需手动创建):"
    echo "  - 普通用户: test_user / 123456"
    echo "  - VIP用户: test_vip / 123456"
    echo "  - 管理员: admin / admin123"
    echo ""
    log_info "服务管理命令:"
    echo "  - 查看后端日志: pm2 logs xingchao-backend"
    echo "  - 重启后端: pm2 restart xingchao-backend"
    echo "  - 停止后端: pm2 stop xingchao-backend"
    echo "  - 查看Nginx日志: tail -f /var/log/nginx/xingchao-design-access.log"
    echo "  - 重启Nginx: systemctl restart nginx"
    echo ""
    log_warning "重要提示:"
    echo "  1. 请修改 backend/.env 中的支付配置(微信/支付宝)"
    echo "  2. 请修改 backend/.env 中的短信服务配置"
    echo "  3. 建议配置SSL证书启用HTTPS"
    echo "  4. 建议配置域名并修改Nginx配置中的server_name"
    echo "  5. 定期备份数据库: bash scripts/backup.sh"
    echo ""
    echo "=========================================="
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    echo "  星潮设计资源平台 - 应用部署脚本"
    echo "=========================================="
    echo ""
    
    # 检查root权限
    check_root
    
    # 检查环境依赖
    check_dependencies
    
    # 加载数据库配置
    load_db_config
    
    # 询问部署方式
    echo ""
    log_info "请选择部署方式:"
    echo "  1. 从Git仓库拉取代码"
    echo "  2. 使用本地代码"
    read -p "请输入选项 (1/2): " -n 1 -r
    echo ""
    
    if [[ $REPLY == "1" ]]; then
        # 询问仓库地址
        read -p "请输入Git仓库地址 (默认: $REPO_URL): " input_repo
        if [ ! -z "$input_repo" ]; then
            REPO_URL=$input_repo
        fi
        
        # 拉取代码
        pull_code
    else
        # 使用本地代码
        use_local_code
    fi
    
    # 创建环境配置文件
    create_env_files
    
    # 安装后端依赖
    install_backend_deps
    
    # 初始化数据库
    init_database
    
    # 构建后端
    build_backend
    
    # 安装前端依赖
    install_frontend_deps
    
    # 构建前端
    build_frontend
    
    # 配置Nginx
    configure_nginx
    
    # 启动后端服务
    start_backend
    
    # 创建测试账号提示
    create_test_accounts
    
    # 显示部署总结
    show_summary
}

# 执行主函数
main
