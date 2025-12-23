/**
 * 环境变量验证脚本
 * 用于验证环境变量配置是否正确
 * 
 * 使用方法：
 * node scripts/verify-env.js
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// 必需的环境变量
const REQUIRED_ENV_VARS = [
  'VITE_APP_TITLE',
  'VITE_API_BASE_URL',
  'VITE_CDN_BASE_URL'
];

// 推荐的环境变量
const RECOMMENDED_ENV_VARS = [
  'VITE_MAX_FILE_SIZE',
  'VITE_CHUNK_SIZE',
  'VITE_ALLOWED_ORIGINS'
];

// 检查文件是否存在
function checkFileExists(filePath, fileName) {
  const fullPath = resolve(rootDir, filePath);
  if (existsSync(fullPath)) {
    success(`${fileName} 存在`);
    return true;
  } else {
    error(`${fileName} 不存在`);
    return false;
  }
}

// 解析环境变量文件
function parseEnvFile(filePath) {
  try {
    const content = readFileSync(resolve(rootDir, filePath), 'utf-8');
    const env = {};
    
    content.split('\n').forEach(line => {
      // 跳过注释和空行
      if (line.trim().startsWith('#') || !line.trim()) {
        return;
      }
      
      // 解析 KEY=VALUE
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        env[key] = value;
      }
    });
    
    return env;
  } catch (err) {
    error(`读取文件失败: ${filePath}`);
    return null;
  }
}

// 验证环境变量
function validateEnvVars(env, envName) {
  log(`\n📋 验证 ${envName} 环境变量:`, 'blue');
  
  let hasError = false;
  
  // 检查必需的环境变量
  log('\n必需的环境变量:', 'cyan');
  REQUIRED_ENV_VARS.forEach(key => {
    if (env[key]) {
      success(`${key} = ${env[key]}`);
    } else {
      error(`${key} 未配置`);
      hasError = true;
    }
  });
  
  // 检查推荐的环境变量
  log('\n推荐的环境变量:', 'cyan');
  RECOMMENDED_ENV_VARS.forEach(key => {
    if (env[key]) {
      success(`${key} = ${env[key]}`);
    } else {
      warning(`${key} 未配置（推荐配置）`);
    }
  });
  
  return !hasError;
}

// 验证环境变量值
function validateEnvValues(env, envName) {
  log(`\n🔍 验证 ${envName} 环境变量值:`, 'blue');
  
  let hasWarning = false;
  
  // 验证API URL
  if (env.VITE_API_BASE_URL) {
    if (env.VITE_API_BASE_URL.startsWith('http://') || 
        env.VITE_API_BASE_URL.startsWith('https://')) {
      success('API URL 格式正确');
    } else {
      warning('API URL 应该以 http:// 或 https:// 开头');
      hasWarning = true;
    }
  }
  
  // 验证CDN URL
  if (env.VITE_CDN_BASE_URL) {
    if (env.VITE_CDN_BASE_URL.startsWith('http://') || 
        env.VITE_CDN_BASE_URL.startsWith('https://')) {
      success('CDN URL 格式正确');
    } else {
      warning('CDN URL 应该以 http:// 或 https:// 开头');
      hasWarning = true;
    }
  }
  
  // 验证文件大小
  if (env.VITE_MAX_FILE_SIZE) {
    const size = Number(env.VITE_MAX_FILE_SIZE);
    if (!isNaN(size) && size > 0) {
      success(`文件大小限制: ${(size / 1024 / 1024).toFixed(0)}MB`);
    } else {
      warning('文件大小限制格式不正确');
      hasWarning = true;
    }
  }
  
  // 验证分片大小
  if (env.VITE_CHUNK_SIZE) {
    const size = Number(env.VITE_CHUNK_SIZE);
    if (!isNaN(size) && size > 0) {
      success(`分片大小: ${(size / 1024 / 1024).toFixed(0)}MB`);
    } else {
      warning('分片大小格式不正确');
      hasWarning = true;
    }
  }
  
  return !hasWarning;
}

// 主函数
function main() {
  log('\n🔧 环境变量配置验证工具\n', 'blue');
  
  // 检查文件是否存在
  log('📁 检查环境变量文件:', 'blue');
  const hasExample = checkFileExists('.env.example', '.env.example');
  const hasDev = checkFileExists('.env.development', '.env.development');
  const hasProd = checkFileExists('.env.production', '.env.production');
  
  if (!hasExample) {
    error('\n❌ .env.example 文件不存在，请先创建模板文件');
    process.exit(1);
  }
  
  if (!hasDev && !hasProd) {
    error('\n❌ 未找到任何环境配置文件');
    info('请运行以下命令创建环境配置文件:');
    info('  cp .env.example .env.development');
    info('  cp .env.example .env.production');
    process.exit(1);
  }
  
  let allValid = true;
  
  // 验证开发环境
  if (hasDev) {
    const devEnv = parseEnvFile('.env.development');
    if (devEnv) {
      const isValid = validateEnvVars(devEnv, '开发环境');
      const hasNoWarning = validateEnvValues(devEnv, '开发环境');
      allValid = allValid && isValid && hasNoWarning;
    } else {
      allValid = false;
    }
  }
  
  // 验证生产环境
  if (hasProd) {
    const prodEnv = parseEnvFile('.env.production');
    if (prodEnv) {
      const isValid = validateEnvVars(prodEnv, '生产环境');
      const hasNoWarning = validateEnvValues(prodEnv, '生产环境');
      allValid = allValid && isValid && hasNoWarning;
    } else {
      allValid = false;
    }
  }
  
  // 输出结果
  log('\n' + '='.repeat(50), 'cyan');
  if (allValid) {
    success('\n✅ 环境变量配置验证通过！\n');
  } else {
    warning('\n⚠️  环境变量配置存在问题，请检查上述警告和错误\n');
  }
  
  // 提示信息
  info('💡 提示:');
  info('  - 查看完整文档: ENV_CONFIGURATION_GUIDE.md');
  info('  - 快速入门: .env.quickstart.md');
  info('  - 修改环境变量后需要重启开发服务器\n');
}

// 运行
main();
