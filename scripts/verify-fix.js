/**
 * 验证修复脚本
 * 检查所有修改是否正确应用
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 开始验证修复...\n');

let allPassed = true;

// 检查1: main.ts 是否包含同步Mock初始化
console.log('📝 检查1: main.ts Mock初始化');
const mainTsPath = path.join(rootDir, 'src', 'main.ts');
const mainTsContent = fs.readFileSync(mainTsPath, 'utf-8');

if (mainTsContent.includes('await import(\'@/mock\')')) {
  console.log('✅ main.ts 使用 top-level await 初始化Mock');
} else {
  console.log('❌ main.ts 未使用 top-level await');
  allPassed = false;
}

if (mainTsContent.includes('import request from \'./utils/request\'')) {
  console.log('✅ main.ts 导入 request 实例');
} else {
  console.log('❌ main.ts 未导入 request 实例');
  allPassed = false;
}

console.log('');

// 检查2: request.ts 是否移除了重复的Mock初始化
console.log('📝 检查2: request.ts Mock初始化');
const requestTsPath = path.join(rootDir, 'src', 'utils', 'request.ts');
const requestTsContent = fs.readFileSync(requestTsPath, 'utf-8');

if (!requestTsContent.includes('import(\'@/mock\')')) {
  console.log('✅ request.ts 已移除重复的Mock初始化');
} else {
  console.log('❌ request.ts 仍包含Mock初始化代码');
  allPassed = false;
}

console.log('');

// 检查3: vite.config.ts 是否条件性禁用代理
console.log('📝 检查3: vite.config.ts 代理配置');
const viteConfigPath = path.join(rootDir, 'vite.config.ts');
const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');

if (viteConfigContent.includes('enableMock')) {
  console.log('✅ vite.config.ts 检查 enableMock 变量');
} else {
  console.log('❌ vite.config.ts 未检查 enableMock');
  allPassed = false;
}

if (viteConfigContent.includes('proxy: enableMock ? undefined')) {
  console.log('✅ vite.config.ts 条件性禁用代理');
} else {
  console.log('❌ vite.config.ts 未条件性禁用代理');
  allPassed = false;
}

console.log('');

// 检查4: 环境变量配置
console.log('📝 检查4: 环境变量配置');
const envDevPath = path.join(rootDir, '.env.development');
const envDevContent = fs.readFileSync(envDevPath, 'utf-8');

if (envDevContent.includes('VITE_ENABLE_MOCK=true')) {
  console.log('✅ .env.development 启用Mock');
} else {
  console.log('⚠️  .env.development 未启用Mock（可能是故意的）');
}

console.log('');

// 检查5: 测试文件是否存在
console.log('📝 检查5: 测试文件');
const testMockHtmlPath = path.join(rootDir, 'public', 'test-mock.html');
if (fs.existsSync(testMockHtmlPath)) {
  console.log('✅ test-mock.html 测试页面已创建');
} else {
  console.log('❌ test-mock.html 测试页面不存在');
  allPassed = false;
}

console.log('');

// 检查6: 文档文件是否存在
console.log('📝 检查6: 文档文件');
const docs = [
  'MOCK_SETUP_EXPLANATION.md',
  '修复报告.md',
  '快速验证指南.md'
];

docs.forEach(doc => {
  const docPath = path.join(rootDir, doc);
  if (fs.existsSync(docPath)) {
    console.log(`✅ ${doc} 已创建`);
  } else {
    console.log(`❌ ${doc} 不存在`);
    allPassed = false;
  }
});

console.log('');

// 总结
console.log('='.repeat(50));
if (allPassed) {
  console.log('🎉 所有检查通过！修复已正确应用。');
  console.log('');
  console.log('📋 下一步:');
  console.log('1. 确保开发服务器正在运行: npm run dev');
  console.log('2. 访问测试页面: http://localhost:3000/test-mock.html');
  console.log('3. 访问主应用: http://localhost:3000');
  console.log('4. 查看浏览器控制台确认Mock已启用');
  process.exit(0);
} else {
  console.log('⚠️  部分检查未通过，请检查上述错误。');
  process.exit(1);
}
