#!/bin/bash

###############################################################################
# 星潮设计资源平台 - 环境安装脚本
# 功能: 自动安装Node.js、PostgreSQL、Nginx、PM2等环境依赖
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
        log_info "使用命令: sudo bash install.sh"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    log_info "检测操作系统..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
        log_success "检测到操作系统: $PRETTY_NAME"
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    
    # 检查是否为支持的系统
    if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
        log_warning "此脚本主要针对Ubuntu/Debian系统优化"
        log_warning "其他系统可能需要手动调整"
    fi
}

# 更新系统包
update_system() {
    log_info "更新系统包列表..."
    apt-get update -y
    log_success "系统包列表更新完成"
}

# 安装基础工具
install_basic_tools() {
    log_info "安装基础工具..."
    apt-get install -y curl wget git build-essential software-properties-common
    log_success "基础工具安装完成"
}

# 安装Node.js
install_nodejs() {
    log_info "检查Node.js安装状态..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_warning "Node.js已安装: $NODE_VERSION"
        read -p "是否重新安装? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "跳过Node.js安装"
            return
        fi
    fi
    
    log_info "安装Node.js 18 LTS..."
    
    # 添加NodeSource仓库
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    
    # 安装Node.js
    apt-get install -y nodejs
    
    # 验证安装
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        NPM_VERSION=$(npm -v)
        log_success "Node.js安装成功: $NODE_VERSION"
        log_success "npm版本: $NPM_VERSION"
    else
        log_error "Node.js安装失败"
        exit 1
    fi
    
    # 配置npm镜像源(可选,提高下载速度)
    log_info "配置npm淘宝镜像源..."
    npm config set registry https://registry.npmmirror.com
    log_success "npm镜像源配置完成"
}

# 安装PM2
install_pm2() {
    log_info "检查PM2安装状态..."
    
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 -v)
        log_warning "PM2已安装: $PM2_VERSION"
        log_info "跳过PM2安装"
        return
    fi
    
    log_info "安装PM2进程管理器..."
    npm install -g pm2
    
    # 验证安装
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 -v)
        log_success "PM2安装成功: $PM2_VERSION"
        
        # 配置PM2开机自启
        log_info "配置PM2开机自启..."
        pm2 startup systemd -u root --hp /root
        log_success "PM2开机自启配置完成"
    else
        log_error "PM2安装失败"
        exit 1
    fi
}

# 安装PostgreSQL
install_postgresql() {
    log_info "检查PostgreSQL安装状态..."
    
    if command -v psql &> /dev/null; then
        PG_VERSION=$(psql --version | awk '{print $3}')
        log_warning "PostgreSQL已安装: $PG_VERSION"
        read -p "是否重新安装? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "跳过PostgreSQL安装"
            return
        fi
    fi
    
    log_info "安装PostgreSQL 14..."
    
    # 添加PostgreSQL官方仓库
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    
    # 更新包列表
    apt-get update -y
    
    # 安装PostgreSQL
    apt-get install -y postgresql-14 postgresql-contrib-14
    
    # 启动PostgreSQL服务
    systemctl start postgresql
    systemctl enable postgresql
    
    # 验证安装
    if systemctl is-active --quiet postgresql; then
        PG_VERSION=$(psql --version | awk '{print $3}')
        log_success "PostgreSQL安装成功: $PG_VERSION"
        log_success "PostgreSQL服务已启动并设置为开机自启"
    else
        log_error "PostgreSQL安装失败或服务未启动"
        exit 1
    fi
}

# 配置PostgreSQL数据库
configure_postgresql() {
    log_info "配置PostgreSQL数据库..."
    
    # 数据库配置
    DB_NAME="xingchao_design"
    DB_USER="xingchao_user"
    DB_PASSWORD=$(openssl rand -base64 16)
    
    # 创建数据库和用户
    log_info "创建数据库: $DB_NAME"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || log_warning "数据库可能已存在"
    
    log_info "创建数据库用户: $DB_USER"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || log_warning "用户可能已存在"
    
    log_info "授予数据库权限..."
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
    
    # 保存数据库配置到文件
    DB_CONFIG_FILE="/root/.xingchao_db_config"
    cat > $DB_CONFIG_FILE <<EOF
# 星潮设计数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
EOF
    
    chmod 600 $DB_CONFIG_FILE
    
    log_success "PostgreSQL配置完成"
    log_success "数据库配置已保存到: $DB_CONFIG_FILE"
    log_info "数据库名称: $DB_NAME"
    log_info "数据库用户: $DB_USER"
    log_warning "数据库密码: $DB_PASSWORD (请妥善保管)"
}

# 安装Nginx
install_nginx() {
    log_info "检查Nginx安装状态..."
    
    if command -v nginx &> /dev/null; then
        NGINX_VERSION=$(nginx -v 2>&1 | awk -F'/' '{print $2}')
        log_warning "Nginx已安装: $NGINX_VERSION"
        log_info "跳过Nginx安装"
        return
    fi
    
    log_info "安装Nginx..."
    apt-get install -y nginx
    
    # 启动Nginx服务
    systemctl start nginx
    systemctl enable nginx
    
    # 验证安装
    if systemctl is-active --quiet nginx; then
        NGINX_VERSION=$(nginx -v 2>&1 | awk -F'/' '{print $2}')
        log_success "Nginx安装成功: $NGINX_VERSION"
        log_success "Nginx服务已启动并设置为开机自启"
    else
        log_error "Nginx安装失败或服务未启动"
        exit 1
    fi
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙规则..."
    
    # 检查ufw是否安装
    if ! command -v ufw &> /dev/null; then
        log_info "安装ufw防火墙..."
        apt-get install -y ufw
    fi
    
    # 配置防火墙规则
    log_info "开放SSH端口(22)..."
    ufw allow 22/tcp
    
    log_info "开放HTTP端口(80)..."
    ufw allow 80/tcp
    
    log_info "开放HTTPS端口(443)..."
    ufw allow 443/tcp
    
    # 启用防火墙
    log_info "启用防火墙..."
    echo "y" | ufw enable
    
    # 显示防火墙状态
    ufw status
    
    log_success "防火墙配置完成"
}

# 安装Redis
install_redis() {
    log_info "检查Redis安装状态..."
    
    if command -v redis-server &> /dev/null; then
        REDIS_VERSION=$(redis-server --version | awk '{print $3}')
        log_warning "Redis已安装: $REDIS_VERSION"
        log_info "跳过Redis安装"
        return
    fi
    
    log_info "安装Redis..."
    apt-get install -y redis-server
    
    # 配置Redis
    log_info "配置Redis..."
    sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
    
    # 启动Redis服务
    systemctl restart redis-server
    systemctl enable redis-server
    
    # 验证安装
    if systemctl is-active --quiet redis-server; then
        REDIS_VERSION=$(redis-server --version | awk '{print $3}')
        log_success "Redis安装成功: $REDIS_VERSION"
        log_success "Redis服务已启动并设置为开机自启"
    else
        log_error "Redis安装失败或服务未启动"
        exit 1
    fi
}

# 创建项目目录
create_project_directory() {
    log_info "创建项目目录..."
    
    PROJECT_DIR="/var/www/xingchao-design"
    
    if [ -d "$PROJECT_DIR" ]; then
        log_warning "项目目录已存在: $PROJECT_DIR"
    else
        mkdir -p $PROJECT_DIR
        log_success "项目目录创建成功: $PROJECT_DIR"
    fi
    
    # 设置目录权限
    chown -R root:root $PROJECT_DIR
    chmod -R 755 $PROJECT_DIR
}

# 显示安装总结
show_summary() {
    echo ""
    echo "=========================================="
    log_success "环境安装完成!"
    echo "=========================================="
    echo ""
    log_info "已安装的软件:"
    echo "  - Node.js: $(node -v)"
    echo "  - npm: $(npm -v)"
    echo "  - PM2: $(pm2 -v)"
    echo "  - PostgreSQL: $(psql --version | awk '{print $3}')"
    echo "  - Nginx: $(nginx -v 2>&1 | awk -F'/' '{print $2}')"
    echo "  - Redis: $(redis-server --version | awk '{print $3}')"
    echo ""
    log_info "数据库配置:"
    if [ -f "/root/.xingchao_db_config" ]; then
        cat /root/.xingchao_db_config
    fi
    echo ""
    log_info "项目目录: /var/www/xingchao-design"
    echo ""
    log_warning "下一步:"
    echo "  1. 运行部署脚本: bash scripts/deploy.sh"
    echo "  2. 或手动部署应用到 /var/www/xingchao-design"
    echo ""
    echo "=========================================="
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    echo "  星潮设计资源平台 - 环境安装脚本"
    echo "=========================================="
    echo ""
    
    # 检查root权限
    check_root
    
    # 检测操作系统
    detect_os
    
    # 更新系统
    update_system
    
    # 安装基础工具
    install_basic_tools
    
    # 安装Node.js
    install_nodejs
    
    # 安装PM2
    install_pm2
    
    # 安装PostgreSQL
    install_postgresql
    
    # 配置PostgreSQL
    configure_postgresql
    
    # 安装Nginx
    install_nginx
    
    # 安装Redis
    install_redis
    
    # 配置防火墙
    configure_firewall
    
    # 创建项目目录
    create_project_directory
    
    # 显示安装总结
    show_summary
}

# 执行主函数
main
