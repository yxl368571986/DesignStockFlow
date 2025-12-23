#!/usr/bin/env node

/**
 * 部署包准备脚本
 * 用于打包生产环境所需的所有文件
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const DEPLOYMENT_DIR = 'deployment-package';
const REQUIRED_FILES = [
  'nginx.conf.example',
  '.env.production',
  '.env.example',
  'package.json',
  'package-lock.json',
  'README.md',
  'PROJECT_DELIVERY.md',
  'NGINX_DEPLOYMENT_GUIDE.md',
  'BUILD_GUIDE.md',
  'ENV_CONFIGURATION_GUIDE.md',
  'MONITORING_LOGGING_GUIDE.md',
  'logrotate.conf.example'
];

console.log('🚀 开始准备部署包...\n');

// 1. 清理旧的部署包
if (fs.existsSync(DEPLOYMENT_DIR)) {
  console.log('📦 清理旧的部署包...');
  fs.rmSync(DEPLOYMENT_DIR, { recursive: true, force: true });
}

// 2. 创建部署目录
console.log('📁 创建部署目录...');
fs.mkdirSync(DEPLOYMENT_DIR, { recursive: true });

// 3. 构建生产版本
console.log('🔨 构建生产版本...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 构建完成\n');
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

// 4. 复制构建产物
console.log('📋 复制构建产物...');
if (fs.existsSync('dist')) {
  fs.cpSync('dist', path.join(DEPLOYMENT_DIR, 'dist'), { recursive: true });
  console.log('✅ 构建产物已复制\n');
} else {
  console.error('❌ 构建产物不存在');
  process.exit(1);
}

// 5. 复制必需文件
console.log('📄 复制必需文件...');
let copiedCount = 0;
let missingFiles = [];

REQUIRED_FILES.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(DEPLOYMENT_DIR, file));
    copiedCount++;
    console.log(`  ✓ ${file}`);
  } else {
    missingFiles.push(file);
    console.log(`  ⚠ ${file} (不存在)`);
  }
});

console.log(`\n✅ 已复制 ${copiedCount}/${REQUIRED_FILES.length} 个文件\n`);

if (missingFiles.length > 0) {
  console.log('⚠️  缺失的文件:');
  missingFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');
}

// 6. 创建部署说明文件
console.log('📝 创建部署说明...');
const deploymentGuide = `# 部署包说明

## 📦 包含内容

- \`dist/\` - 前端构建产物
- \`nginx.conf.example\` - Nginx配置示例
- \`.env.production\` - 生产环境变量
- \`package.json\` - 依赖清单
- \`PROJECT_DELIVERY.md\` - 项目交付文档
- \`NGINX_DEPLOYMENT_GUIDE.md\` - Nginx部署指南
- \`BUILD_GUIDE.md\` - 构建指南
- \`ENV_CONFIGURATION_GUIDE.md\` - 环境配置指南

## 🚀 快速部署

### 1. 上传文件到服务器
\`\`\`bash
scp -r deployment-package/* user@server:/path/to/deploy/
\`\`\`

### 2. 配置环境变量
\`\`\`bash
cd /path/to/deploy/
cp .env.example .env.production
nano .env.production
\`\`\`

### 3. 配置Nginx
\`\`\`bash
sudo cp nginx.conf.example /etc/nginx/sites-available/startide-design
sudo ln -s /etc/nginx/sites-available/startide-design /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

### 4. 部署前端文件
\`\`\`bash
sudo mkdir -p /var/www/startide-design
sudo cp -r dist/* /var/www/startide-design/
sudo chown -R www-data:www-data /var/www/startide-design
sudo chmod -R 755 /var/www/startide-design
\`\`\`

## 📚 详细文档

请参考以下文档获取详细部署说明：
- \`PROJECT_DELIVERY.md\` - 完整的项目交付文档
- \`NGINX_DEPLOYMENT_GUIDE.md\` - Nginx详细配置
- \`ENV_CONFIGURATION_GUIDE.md\` - 环境变量配置

## 📞 技术支持

如有问题，请联系技术支持团队。
`;

fs.writeFileSync(
  path.join(DEPLOYMENT_DIR, 'DEPLOYMENT_README.md'),
  deploymentGuide
);
console.log('✅ 部署说明已创建\n');

// 7. 生成文件清单
console.log('📋 生成文件清单...');
const manifest = {
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  files: []
};

function scanDirectory(dir, baseDir = '') {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const relativePath = path.join(baseDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      scanDirectory(filePath, relativePath);
    } else {
      manifest.files.push({
        path: relativePath.replace(/\\/g, '/'),
        size: stats.size,
        modified: stats.mtime.toISOString()
      });
    }
  });
}

scanDirectory(DEPLOYMENT_DIR);

fs.writeFileSync(
  path.join(DEPLOYMENT_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('✅ 文件清单已生成\n');

// 8. 计算包大小
console.log('📊 统计包大小...');
let totalSize = 0;
manifest.files.forEach(file => {
  totalSize += file.size;
});

const sizeInMB = (totalSize / 1024 / 1024).toFixed(2);
console.log(`总大小: ${sizeInMB} MB`);
console.log(`文件数量: ${manifest.files.length}\n`);

// 9. 完成
console.log('✅ 部署包准备完成！\n');
console.log(`📦 部署包位置: ${path.resolve(DEPLOYMENT_DIR)}`);
console.log(`📄 部署说明: ${path.join(DEPLOYMENT_DIR, 'DEPLOYMENT_README.md')}`);
console.log(`📋 文件清单: ${path.join(DEPLOYMENT_DIR, 'manifest.json')}\n`);

console.log('🎉 可以开始部署了！');
