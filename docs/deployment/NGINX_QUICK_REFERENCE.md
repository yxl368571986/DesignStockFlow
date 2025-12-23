# Nginx配置快速参考 - 星潮设计资源平台

## 🚀 快速开始

### 1分钟部署
```bash
# 1. 复制配置文件
sudo cp nginx.conf.example /etc/nginx/sites-available/startide-design

# 2. 修改配置（域名、证书路径、API地址）
sudo vim /etc/nginx/sites-available/startide-design

# 3. 启用配置
sudo ln -s /etc/nginx/sites-available/startide-design /etc/nginx/sites-enabled/

# 4. 测试配置
sudo nginx -t

# 5. 重载配置
sudo nginx -s reload
```

---

## 📝 必须修改的配置项

### 1. 域名配置
```nginx
# 第24行和第38行
server_name startide-design.com www.startide-design.com;
# 改为你的实际域名
server_name yourdomain.com www.yourdomain.com;
```

### 2. SSL证书路径
```nginx
# 第58-59行
ssl_certificate /etc/nginx/ssl/startide-design.com.crt;
ssl_certificate_key /etc/nginx/ssl/startide-design.com.key;
# 改为你的实际证书路径
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

### 3. 网站根目录
```nginx
# 第48行
root /var/www/startide-design/dist;
# 改为你的实际路径
root /var/www/yourdomain/dist;
```

### 4. 后端API地址
```nginx
# 第14行
server 127.0.0.1:8080;
# 改为你的实际后端地址
server 127.0.0.1:3000;  # 或其他端口
```

---

## 🔧 常用命令

### Nginx服务管理
```bash
# 启动
sudo systemctl start nginx

# 停止
sudo systemctl stop nginx

# 重启
sudo systemctl restart nginx

# 重载配置（不中断服务）
sudo nginx -s reload

# 查看状态
sudo systemctl status nginx

# 开机自启
sudo systemctl enable nginx
```

### 配置测试
```bash
# 测试配置语法
sudo nginx -t

# 测试并显示详细信息
sudo nginx -T
```

### 日志查看
```bash
# 访问日志
sudo tail -f /var/log/nginx/startide-design-access.log

# 错误日志
sudo tail -f /var/log/nginx/startide-design-error.log

# 实时监控（所有日志）
sudo tail -f /var/log/nginx/*.log
```

---

## 🔍 快速验证

### 1. HTTPS验证
```bash
curl -I https://yourdomain.com
# 应该返回: HTTP/2 200
```

### 2. 安全响应头验证
```bash
curl -I https://yourdomain.com | grep -E "Strict-Transport-Security|X-Frame-Options|Content-Security-Policy"
# 应该看到这些响应头
```

### 3. Gzip压缩验证
```bash
curl -H "Accept-Encoding: gzip" -I https://yourdomain.com/assets/main.js | grep "Content-Encoding"
# 应该返回: Content-Encoding: gzip
```

### 4. API代理验证
```bash
curl https://yourdomain.com/api/health
# 应该返回后端API响应
```

### 5. 缓存验证
```bash
# JS文件应该长期缓存
curl -I https://yourdomain.com/assets/main.js | grep "Cache-Control"
# 应该返回: Cache-Control: public, max-age=31536000, immutable

# HTML文件不应该缓存
curl -I https://yourdomain.com/index.html | grep "Cache-Control"
# 应该返回: Cache-Control: no-cache, no-store, must-revalidate
```

---

## 🐛 常见问题

### 问题1: 502 Bad Gateway
```bash
# 检查后端服务是否运行
sudo systemctl status your-backend-service

# 检查端口是否监听
sudo netstat -tlnp | grep 8080

# 检查防火墙
sudo ufw status
```

### 问题2: 413 Request Entity Too Large
```nginx
# 增加上传大小限制（已配置1000MB）
client_max_body_size 1000M;
```

### 问题3: SSL证书错误
```bash
# 检查证书有效期
sudo openssl x509 -in /path/to/cert.crt -noout -dates

# 检查证书链
sudo openssl s_client -connect yourdomain.com:443 -showcerts
```

### 问题4: 配置不生效
```bash
# 确保配置文件已启用
ls -la /etc/nginx/sites-enabled/

# 重载配置
sudo nginx -s reload

# 如果还不行，重启Nginx
sudo systemctl restart nginx
```

---

## 📊 性能监控

### 查看Nginx状态
```bash
# 访问状态页面（需要先配置）
curl http://localhost/nginx_status

# 输出示例：
# Active connections: 291
# server accepts handled requests
#  16630948 16630948 31070465
# Reading: 6 Writing: 179 Waiting: 106
```

### 实时监控连接数
```bash
# 查看当前连接数
netstat -an | grep :443 | wc -l

# 查看各状态连接数
netstat -an | grep :443 | awk '{print $6}' | sort | uniq -c
```

### 日志分析
```bash
# 统计访问量
cat /var/log/nginx/access.log | wc -l

# 统计IP访问次数
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# 统计状态码
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# 统计访问最多的URL
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10
```

---

## 🔒 安全检查

### SSL/TLS测试
```bash
# SSL Labs在线测试
https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# 本地测试TLS 1.3
openssl s_client -connect yourdomain.com:443 -tls1_3

# 检查支持的加密套件
nmap --script ssl-enum-ciphers -p 443 yourdomain.com
```

### 安全响应头测试
```bash
# Security Headers在线测试
https://securityheaders.com/?q=yourdomain.com

# Mozilla Observatory测试
https://observatory.mozilla.org/analyze/yourdomain.com
```

---

## 📦 备份和恢复

### 备份配置
```bash
# 备份配置文件
sudo tar -czf nginx-backup-$(date +%Y%m%d).tar.gz /etc/nginx/

# 备份SSL证书
sudo tar -czf ssl-backup-$(date +%Y%m%d).tar.gz /etc/nginx/ssl/
```

### 恢复配置
```bash
# 恢复配置文件
sudo tar -xzf nginx-backup-20241220.tar.gz -C /

# 测试配置
sudo nginx -t

# 重载配置
sudo nginx -s reload
```

---

## 🎯 性能优化建议

### 1. 调整Worker进程
```nginx
# 根据CPU核心数调整
worker_processes auto;  # 自动检测
worker_connections 4096;  # 每个worker的连接数
```

### 2. 启用文件缓存
```nginx
open_file_cache max=10000 inactive=30s;
open_file_cache_valid 60s;
open_file_cache_min_uses 2;
```

### 3. 启用HTTP/2推送
```nginx
http2_push /assets/main.css;
http2_push /assets/main.js;
```

### 4. 启用Brotli压缩（需要额外模块）
```nginx
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json;
```

---

## 📞 获取帮助

### 官方文档
- Nginx官方文档: https://nginx.org/en/docs/
- Nginx配置示例: https://www.nginx.com/resources/wiki/start/

### 在线工具
- SSL测试: https://www.ssllabs.com/ssltest/
- 安全响应头测试: https://securityheaders.com/
- HTTP/2测试: https://tools.keycdn.com/http2-test

### 社区支持
- Nginx论坛: https://forum.nginx.org/
- Stack Overflow: https://stackoverflow.com/questions/tagged/nginx

---

## ✅ 部署检查清单

部署前:
- [ ] 域名已解析到服务器IP
- [ ] SSL证书已准备好
- [ ] 后端API服务已启动
- [ ] 前端构建产物已上传

部署中:
- [ ] 配置文件已修改（域名、路径、证书）
- [ ] 配置语法检查通过（nginx -t）
- [ ] 目录权限已设置
- [ ] 防火墙规则已配置

部署后:
- [ ] HTTPS访问正常
- [ ] HTTP自动跳转HTTPS
- [ ] API代理正常
- [ ] 静态资源加载正常
- [ ] 文件上传功能正常
- [ ] 安全响应头已生效
- [ ] Gzip压缩已生效

---

**提示**: 详细的部署指南请参考 `NGINX_DEPLOYMENT_GUIDE.md`
