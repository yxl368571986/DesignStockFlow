const fs = require('fs');

// 需要修复的文件列表
const files = [
  'src/controllers/auditController.ts',
  'src/controllers/bannerController.ts',
  'src/controllers/paymentController.ts',
  'src/controllers/pointsController.ts',
  'src/controllers/recommendController.ts',
  'src/controllers/resourceController.ts'
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // 修复缺少开始引号的字符串 (pattern: , '文本, 数字);)
    content = content.replace(/, '([^']+), (\d+)\);/g, (match, text, code) => {
      modified = true;
      return `, '${text}', ${code});`;
    });
    
    // 修复缺少结束引号的字符串 (pattern: message: '文本,)
    content = content.replace(/message: '([^']+),$/gm, (match, text) => {
      modified = true;
      return `message: '${text}',`;
    });
    
    // 修复缺少结束引号的字符串 (pattern: description: '文本$)
    content = content.replace(/description: '([^']+)$/gm, (match, text) => {
      modified = true;
      return `description: '${text}'`;
    });
    
    // 修复缺少结束引号的字符串 (pattern: name: '文本,)
    content = content.replace(/name: '([^']+),$/gm, (match, text) => {
      modified = true;
      return `name: '${text}',`;
    });
    
    // 修复缺少结束引号的字符串 (pattern: '文本);)
    content = content.replace(/, '([^']+)\);$/gm, (match, text) => {
      modified = true;
      return `, '${text}');`;
    });
    
    // 修复缺少结束引号的字符串 (pattern: errorResponse(res, '文本, 数字);)
    content = content.replace(/errorResponse\(res, '([^']+), (\d+)\);/g, (match, text, code) => {
      modified = true;
      return `errorResponse(res, '${text}', ${code});`;
    });
    
    // 修复缺少结束引号的字符串 (pattern: successResponse(res, ..., '文本);)
    content = content.replace(/successResponse\(([^)]+), '([^']+)\);/g, (match, args, text) => {
      modified = true;
      return `successResponse(${args}, '${text}');`;
    });
    
    // 修复缺少结束引号的字符串 (pattern: error(res, '文本, 数字);)
    content = content.replace(/error\(res, '([^']+), (\d+)\);/g, (match, text, code) => {
      modified = true;
      return `error(res, '${text}', ${code});`;
    });
    
    // 修复缺少结束引号的字符串 (pattern: success(res, ..., '文本);)
    content = content.replace(/success\(([^)]+), '([^']+)\);/g, (match, args, text) => {
      modified = true;
      return `success(${args}, '${text}');`;
    });
    
    // 修复includes中缺少结束引号 (pattern: includes('文本))
    content = content.replace(/includes\('([^']+)\)/g, (match, text) => {
      modified = true;
      return `includes('${text}')`;
    });
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✓ 修复: ${file}`);
    } else {
      console.log(`- 跳过: ${file} (无需修复)`);
    }
  } catch (err) {
    console.error(`✗ 失败: ${file}`, err.message);
  }
});

console.log('\n修复完成！');
