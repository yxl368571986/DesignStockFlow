# Nginx部署配置指南 - 星潮设计资源平台

## 📋 目录

1. [环境要求](#环境要求)
2. [SSL证书配置](#ssl证书配置)
3. [Nginx安装](#nginx安装)
4. [配置文件部署](#配置文件部署)
5. [安全加固](#安全加固)
6. [性能优化](#性能优化)
7. [监控和日志](#监控和日志)
8. [故障排查](#故障排查)

---

## 环境要求

### 系统要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Nginx版本**: 1.18.0+ (推荐 1.24.0+)
- **内存**: 最低2GB，推荐4GB+
- **磁盘**: 最低20GB，推荐50GB+（用于日志和缓存）

### 必需模块
```bash
# 检查Nginx编译模块
nginx -V 2>&1 | grep -o with-[a-z_]*

# 必需模块：
# - http_ssl_module (HTTPS支持)
# - http_v2_module (HTTP/2支持)
# - http_gzip_static_module (Gzip压缩)
# - http_realip_module (真实IP获取)
# - http_stub_status_module (状态监控)

# 可选模块：
# - http_brotli_module (Brotli压缩，需额外安装)
# - headers_more_module (更多响应头控制，需额外安装)
```

---

## SSL证书配置

### 方式1：Let's Encrypt免费证书（推荐）

#### 安装Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### 获取证书
```bash
# 自动配置Nginx
sudo certbot --nginx -d startide-design.com -d www.startide-design.com

# 或手动获取证书
sudo certbot certonly --webroot -w /var/www/letsencrypt \
  -d startide-design.com \
  -d www.startide-design.com \
  --email admin@startide-design.com \
  --agree-tos
```

#### 自动续期
```bash
# 测试续期
sudo certbot renew --dry-run

# 添加自动续期任务（每天凌晨2点检查）
sudo crontab -e
# 添加以下行：
0 2 * * * /usr/bin/certbot renew --quiet --post-hook "nginx -s reload"
```

#### 证书路径
```
证书文件: /etc/letsencrypt/live/startide-design.com/fullchain.pem
私钥文件: /etc/letsencrypt/live/startide-design.com/privkey.pem
证书链: /etc/letsencrypt/live/startide-design.com/chain.pem
```

### 方式2：商业证书

#### 生成CSR（证书签名请求）
```bash
# 创建SSL目录
sudo mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl

# 生成私钥
sudo openssl genrsa -out startide-design.com.key 2048

# 生成CSR
sudo openssl req -new -key startide-design.com.key -out startide-design.com.csr

# 填写信息：
# Country Name: CN
# State: Beijing
# Locality: Beijing
# Organization: StarTide Design
# Common Name: startide-design.com
# Email: admin@startide-design.com
```

#### 部署证书
```bash
# 将CA颁发的证书保存为
sudo vim /etc/nginx/ssl/startide-design.com.crt

# 设置权限
sudo chmod 600 /etc/nginx/ssl/startide-design.com.key
sudo chmod 644 /etc/nginx/ssl/startide-design.com.crt
```

### 生成DH参数（增强安全性）
```bash
# 生成2048位DH参数（需要几分钟）
sudo openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048

# 或生成4096位（更安全，但需要更长时间）
sudo openssl dhparam -out /etc/nginx/ssl/dhparam.pem 4096
```

---

## Nginx安装

### Ubuntu/Debian
```bash
# 添加官方仓库
sudo add-apt-repository ppa:nginx/stable
sudo apt update

# 安装Nginx
sudo apt install nginx

# 启动Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

### CentOS/RHEL
```bash
# 添加官方仓库
sudo yum install epel-release
sudo yum install nginx

# 启动Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

### 从源码编译（可选，支持更多模块）
```bash
# 安装依赖
sudo apt install build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev libgd-dev

# 下载Nginx源码
cd /tmp
wget http://nginx.org/download/nginx-1.24.0.tar.gz
tar -xzf nginx-1.24.0.tar.gz
cd nginx-1.24.0

# 配置编译选项
./configure \
  --prefix=/etc/nginx \
  --sbin-path=/usr/sbin/nginx \
  --conf-path=/etc/nginx/nginx.conf \
  --with-http_ssl_module \
  --with-http_v2_module \
  --with-http_realip_module \
  --with-http_gzip_static_module \
  --with-http_stub_status_module

# 编译安装
make
sudo make install
```

---

## 配置文件部署

### 1. 备份默认配置
```bash
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
```

### 2. 创建项目目录
```bash
# 创建网站根目录
sudo mkdir -p /var/www/startide-design/dist

# 创建日志目录
sudo mkdir -p /var/log/nginx

# 创建缓存目录
sudo mkdir -p /var/cache/nginx/api
sudo mkdir -p /var/cache/nginx/cdn

# 创建临时文件目录
sudo mkdir -p /var/nginx/client_body_temp

# 设置权限
sudo chown -R www-data:www-data /var/www/startide-design
sudo chown -R www-data:www-data /var/cache/nginx
sudo chown -R www-data:www-data /var/nginx
```

### 3. 部署配置文件
```bash
# 复制配置文件
sudo cp nginx.conf.example /etc/nginx/sites-available/startide-design

# 修改配置文件中的域名和路径
sudo vim /etc/nginx/sites-available/startide-design

# 需要修改的内容：
# - server_name: 替换为实际域名
# - ssl_certificate: 替换为实际证书路径
# - ssl_certificate_key: 替换为实际私钥路径
# - root: 替换为实际网站根目录
# - upstream api_backend: 替换为实际后端API地址

# 创建软链接启用配置
sudo ln -s /etc/nginx/sites-available/startide-design /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default
```

### 4. 测试配置
```bash
# 测试配置文件语法
sudo nginx -t

# 如果显示以下信息则配置正确：
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. 重载配置
```bash
# 重载Nginx配置（不中断服务）
sudo nginx -s reload

# 或重启Nginx服务
sudo systemctl restart nginx
```

---

## 安全加固

### 1. 防火墙配置
```bash
# UFW (Ubuntu)
sudo ufw allow 'Nginx Full'
sudo ufw allow 22/tcp
sudo ufw enable

# Firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 限制访问
```bash
# 限制特定IP访问管理接口
location /admin/ {
    allow 192.168.1.0/24;  # 允许内网
    deny all;              # 拒绝其他
}

# 限制国家/地区访问（需要GeoIP模块）
if ($geoip_country_code != CN) {
    return 403;
}
```

### 3. 隐藏Nginx版本
```nginx
# 在http块中添加
http {
    server_tokens off;
}
```

### 4. 配置Fail2Ban（防止暴力破解）
```bash
# 安装Fail2Ban
sudo apt install fail2ban

# 创建Nginx规则
sudo vim /etc/fail2ban/filter.d/nginx-limit-req.conf

# 添加内容：
[Definition]
failregex = limiting requests, excess:.* by zone.*client: <HOST>

# 启用规则
sudo vim /etc/fail2ban/jail.local

# 添加内容：
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/*error.log
maxretry = 5
findtime = 600
bantime = 3600

# 重启Fail2Ban
sudo systemctl restart fail2ban
```

---

## 性能优化

### 1. 调整Worker进程
```nginx
# 在nginx.conf主配置中
worker_processes auto;  # 自动检测CPU核心数
worker_rlimit_nofile 65535;  # 增加文件描述符限制

events {
    worker_connections 4096;  # 每个worker的最大连接数
    use epoll;  # Linux使用epoll
    multi_accept on;  # 一次接受多个连接
}
```

### 2. 启用文件缓存
```nginx
http {
    # 打开文件缓存
    open_file_cache max=10000 inactive=30s;
    open_file_cache_valid 60s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
```

### 3. 启用Brotli压缩（可选）
```bash
# 安装Brotli模块
cd /tmp
git clone https://github.com/google/ngx_brotli.git
cd ngx_brotli
git submodule update --init

# 重新编译Nginx（添加Brotli模块）
# 在configure时添加：
--add-module=/tmp/ngx_brotli
```

```nginx
# 在server块中启用
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### 4. 系统内核优化
```bash
# 编辑系统参数
sudo vim /etc/sysctl.conf

# 添加以下内容：
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 4096

# 应用配置
sudo sysctl -p
```

---

## 监控和日志

### 1. 启用状态监控
```nginx
# 在server块中添加
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

```bash
# 查看状态
curl http://localhost/nginx_status

# 输出示例：
# Active connections: 291
# server accepts handled requests
#  16630948 16630948 31070465
# Reading: 6 Writing: 179 Waiting: 106
```

### 2. 日志格式优化
```nginx
# 自定义日志格式（包含更多信息）
log_format main_ext '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

access_log /var/log/nginx/access.log main_ext;
```

### 3. 日志轮转
```bash
# 创建日志轮转配置
sudo vim /etc/logrotate.d/nginx

# 添加内容：
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 4. 实时监控工具
```bash
# 安装GoAccess（实时日志分析）
sudo apt install goaccess

# 实时分析访问日志
sudo goaccess /var/log/nginx/access.log -c

# 生成HTML报告
sudo goaccess /var/log/nginx/access.log -o /var/www/html/report.html --log-format=COMBINED
```

---

## 故障排查

### 常见问题

#### 1. 502 Bad Gateway
```bash
# 检查后端服务是否运行
sudo systemctl status your-backend-service

# 检查后端端口是否监听
sudo netstat -tlnp | grep 8080

# 检查SELinux（CentOS）
sudo setenforce 0  # 临时关闭
sudo vim /etc/selinux/config  # 永久关闭

# 检查防火墙
sudo iptables -L -n
```

#### 2. 413 Request Entity Too Large
```nginx
# 增加上传大小限制
client_max_body_size 1000M;
```

#### 3. SSL证书错误
```bash
# 检查证书有效期
sudo openssl x509 -in /etc/nginx/ssl/startide-design.com.crt -noout -dates

# 检查证书链
sudo openssl s_client -connect startide-design.com:443 -showcerts

# 测试SSL配置
curl -vI https://startide-design.com
```

#### 4. 性能问题
```bash
# 检查Nginx进程
ps aux | grep nginx

# 检查连接数
netstat -an | grep :443 | wc -l

# 检查错误日志
sudo tail -f /var/log/nginx/error.log

# 检查系统资源
top
htop
```

### 调试模式
```nginx
# 启用调试日志（仅用于排查问题）
error_log /var/log/nginx/error.log debug;
```

### 测试工具
```bash
# 测试HTTPS配置
curl -I https://startide-design.com

# 测试HTTP/2
curl -I --http2 https://startide-design.com

# 测试Gzip压缩
curl -H "Accept-Encoding: gzip" -I https://startide-design.com

# 压力测试
ab -n 1000 -c 100 https://startide-design.com/

# SSL测试
openssl s_client -connect startide-design.com:443 -tls1_3
```

---

## 部署检查清单

### 部署前
- [ ] 域名DNS已解析到服务器IP
- [ ] SSL证书已准备好
- [ ] 后端API服务已启动
- [ ] 前端构建产物已上传到服务器
- [ ] 防火墙规则已配置

### 部署中
- [ ] Nginx配置文件已修改（域名、路径、证书）
- [ ] 配置文件语法检查通过（nginx -t）
- [ ] 目录权限已正确设置
- [ ] 日志目录已创建
- [ ] 缓存目录已创建

### 部署后
- [ ] HTTP自动跳转HTTPS正常
- [ ] HTTPS访问正常
- [ ] API代理正常
- [ ] 静态资源加载正常
- [ ] 文件上传功能正常
- [ ] SSL证书有效期正常
- [ ] 安全响应头已生效
- [ ] Gzip压缩已生效
- [ ] 日志记录正常

---

## 维护建议

### 日常维护
1. **每周检查**：日志文件大小、磁盘空间、错误日志
2. **每月检查**：SSL证书有效期、访问统计、性能指标
3. **每季度检查**：Nginx版本更新、安全补丁、配置优化

### 备份策略
```bash
# 备份配置文件
sudo tar -czf nginx-config-$(date +%Y%m%d).tar.gz /etc/nginx/

# 备份SSL证书
sudo tar -czf ssl-certs-$(date +%Y%m%d).tar.gz /etc/nginx/ssl/

# 定期备份脚本
#!/bin/bash
BACKUP_DIR="/backup/nginx"
DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/nginx-$DATE.tar.gz /etc/nginx/
find $BACKUP_DIR -name "nginx-*.tar.gz" -mtime +30 -delete
```

### 监控告警
- 使用Prometheus + Grafana监控Nginx指标
- 配置告警规则（CPU、内存、连接数、错误率）
- 集成钉钉/企业微信/邮件通知

---

## 参考资源

- [Nginx官方文档](https://nginx.org/en/docs/)
- [Mozilla SSL配置生成器](https://ssl-config.mozilla.org/)
- [SSL Labs测试](https://www.ssllabs.com/ssltest/)
- [Let's Encrypt文档](https://letsencrypt.org/docs/)
- [Nginx性能优化指南](https://www.nginx.com/blog/tuning-nginx/)

---

## 技术支持

如有问题，请联系：
- 技术支持邮箱：support@startide-design.com
- 运维团队：ops@startide-design.com
