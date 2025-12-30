const fs = require('fs');
const path = require('path');

// 需要修复的目录
const dirs = ['src/controllers', 'src/services'];

// 替换映射
const replacements = [
  ['prisma.user.', 'prisma.users.'],
  ['prisma.resource.', 'prisma.resources.'],
  ['prisma.category.', 'prisma.categories.'],
  ['prisma.order.', 'prisma.orders.'],
  ['prisma.banner.', 'prisma.banners.'],
  ['prisma.pointsRecord.', 'prisma.points_records.'],
  ['prisma.pointsRule.', 'prisma.points_rules.'],
  ['prisma.pointsProduct.', 'prisma.points_products.'],
  ['prisma.pointsExchangeRecord.', 'prisma.points_exchange_records.'],
  ['prisma.dailyTask.', 'prisma.daily_tasks.'],
  ['prisma.userTask.', 'prisma.user_tasks.'],
  ['prisma.userFavorite.', 'prisma.user_favorites.'],
  ['tx.user.', 'tx.users.'],
  ['tx.pointsRecord.', 'tx.points_records.'],
  ['tx.pointsProduct.', 'tx.points_products.'],
  ['tx.pointsExchangeRecord.', 'tx.points_exchange_records.'],
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const [from, to] of replacements) {
      if (content.includes(from)) {
        content = content.split(from).join(to);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', filePath);
    }
  } catch (err) {
    console.error('Error processing', filePath, err.message);
  }
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDir(filePath);
    } else if (file.endsWith('.ts')) {
      processFile(filePath);
    }
  }
}

for (const dir of dirs) {
  if (fs.existsSync(dir)) {
    processDir(dir);
  }
}

console.log('Done!');
