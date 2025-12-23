const fs = require('fs');
const path = require('path');

// 需要修复的文件列表
const files = [
  'src/controllers/auditController.ts',
  'src/controllers/bannerController.ts',
  'src/controllers/paymentController.ts',
  'src/controllers/pointsController.ts',
  'src/controllers/recommendController.ts'
];

// 中文字符修复映射
const fixes = {
  '失�?': '失败',
  '�?': '或',
  '存�?': '存在',
  '必填�?': '必填项',
  '原�?': '原因',
  '控制�?': '控制器',
  '�?': '为'
};

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // 替换损坏的中文字符
    Object.keys(fixes).forEach(broken => {
      const regex = new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, fixes[broken]);
    });
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ 修复: ${file}`);
  } catch (err) {
    console.error(`✗ 失败: ${file}`, err.message);
  }
});

console.log('\n修复完成！');
