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

// 中文字符修复映射 - 更全面的映射
const fixes = {
  '失败': '失败',
  '�?': '或',
  '存为': '存在',
  '必填为': '必填项',
  '原为': '原因',
  '控制为': '控制器',
  '�?': '为',
  '成为': '成功',
  '未登为': '未登录',
  '不能为为': '不能为空',
  '配为': '配置',
  '资为': '资源',
  '上为': '上线',
  '文�?': '文件',
  '为�?': '为空',
  '审�?': '审核',
  '下�?': '下架'
};

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // 替换损坏的中文字符
    Object.keys(fixes).forEach(broken => {
      if (content.includes(broken)) {
        const regex = new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, fixes[broken]);
        modified = true;
      }
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
