/**
 * 分批运行测试脚本
 * 将测试文件分成多个批次运行，避免内存溢出
 */

import { spawnSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// 递归获取所有测试文件
function getTestFiles(dir, files = []) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 dist
      if (item !== 'node_modules' && item !== 'dist') {
        getTestFiles(fullPath, files);
      }
    } else if (item.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 运行单个测试文件
function runTestFile(file, memoryLimit = 3072) {
  const relativePath = relative(process.cwd(), file);
  console.log(`\n🧪 运行: ${relativePath}`);
  
  try {
    const result = spawnSync(
      'node',
      [
        `--max-old-space-size=${memoryLimit}`,
        '--expose-gc',
        './node_modules/vitest/vitest.mjs',
        '--run',
        '--no-file-parallelism',
        relativePath
      ],
      {
        stdio: 'inherit',
        env: { ...process.env },
        timeout: 120000 // 120秒超时
      }
    );
    
    if (result.status === 0) {
      console.log(`✅ 通过: ${relativePath}`);
      return true;
    } else if (result.signal === 'SIGTERM') {
      console.log(`⏱️ 超时: ${relativePath}`);
      return false;
    } else {
      console.log(`❌ 失败: ${relativePath}`);
      return false;
    }
  } catch (error) {
    console.error(`💥 错误: ${relativePath}`, error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🚀 开始分批运行测试...\n');
  console.log('=' .repeat(60));
  
  // 获取所有测试文件
  const testFiles = getTestFiles('src');
  console.log(`\n📁 找到 ${testFiles.length} 个测试文件\n`);
  
  // 按目录分组，优先运行小型测试
  const sortedFiles = testFiles.sort((a, b) => {
    // 优先运行 utils 和 pinia 测试（通常更小）
    const aIsSmall = a.includes('utils') || a.includes('pinia');
    const bIsSmall = b.includes('utils') || b.includes('pinia');
    if (aIsSmall && !bIsSmall) return -1;
    if (!aIsSmall && bIsSmall) return 1;
    return 0;
  });
  
  let passed = 0;
  let failed = 0;
  const failedFiles = [];
  
  for (let i = 0; i < sortedFiles.length; i++) {
    const file = sortedFiles[i];
    console.log(`\n[${i + 1}/${sortedFiles.length}]`);
    
    // 对于大型测试文件，使用更多内存
    const isLargeTest = file.includes('components') || file.includes('integration');
    const memoryLimit = isLargeTest ? 4096 : 3072;
    
    const success = runTestFile(file, memoryLimit);
    
    if (success) {
      passed++;
    } else {
      failed++;
      failedFiles.push(relative(process.cwd(), file));
    }
    
    // 等待一小段时间让内存释放
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 打印总结
  console.log('\n' + '=' .repeat(60));
  console.log('📊 测试总结:\n');
  console.log(`  ✅ 通过: ${passed}`);
  console.log(`  ❌ 失败: ${failed}`);
  console.log(`  📁 总计: ${sortedFiles.length}`);
  
  if (failedFiles.length > 0) {
    console.log('\n❌ 失败的测试文件:');
    failedFiles.forEach(f => console.log(`  - ${f}`));
  }
  
  console.log('\n' + '=' .repeat(60));
  
  if (failed === 0) {
    console.log('🎉 所有测试通过!');
    process.exit(0);
  } else {
    console.log('💥 部分测试失败!');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('测试运行出错:', error);
  process.exit(1);
});
