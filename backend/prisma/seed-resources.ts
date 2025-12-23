/**
 * 资源数据种子脚本
 * 用于添加测试资源数据，并更新分类资源计数
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始添加测试资源数据...\n');

  // 获取所有分类
  const categories = await prisma.categories.findMany();
  console.log(`找到 ${categories.length} 个分类\n`);

  // 获取测试用户
  const testUsers = await prisma.users.findMany({
    where: {
      phone: {
        in: ['13800000001', '13800000002', '13800000004']
      }
    }
  });

  if (testUsers.length === 0) {
    console.error('❌ 未找到测试用户，请先运行 seed.ts');
    return;
  }

  console.log(`找到 ${testUsers.length} 个测试用户\n`);

  // 为每个分类创建测试资源
  const resourcesData = [
    // 党建类资源
    {
      categoryCode: 'party-building',
      resources: [
        { title: '党建宣传海报模板', description: '红色主题党建宣传海报，适用于党建活动宣传', fileFormat: 'PSD', vipLevel: 0, tags: ['党建', '海报', '红色'] },
        { title: '党员学习PPT模板', description: '党员学习教育PPT模板，内容丰富', fileFormat: 'PPTX', vipLevel: 1, tags: ['党建', 'PPT', '学习'] },
        { title: '党建文化墙设计', description: '党建文化墙设计方案，高清大图', fileFormat: 'AI', vipLevel: 0, tags: ['党建', '文化墙', '设计'] },
        { title: '红色革命主题插画', description: '红色革命主题插画素材包', fileFormat: 'SVG', vipLevel: 1, tags: ['党建', '插画', '革命'] },
        { title: '党建活动策划方案', description: '完整的党建活动策划方案文档', fileFormat: 'PDF', vipLevel: 0, tags: ['党建', '策划', '活动'] },
      ]
    },
    // 节日海报类资源
    {
      categoryCode: 'festival-poster',
      resources: [
        { title: '春节海报设计模板', description: '2024春节海报设计，喜庆氛围', fileFormat: 'PSD', vipLevel: 0, tags: ['春节', '海报', '节日'] },
        { title: '中秋节促销海报', description: '中秋节促销活动海报模板', fileFormat: 'AI', vipLevel: 0, tags: ['中秋', '促销', '海报'] },
        { title: '国庆节宣传海报', description: '国庆节主题宣传海报设计', fileFormat: 'PSD', vipLevel: 1, tags: ['国庆', '海报', '节日'] },
        { title: '元旦新年海报', description: '元旦新年主题海报模板', fileFormat: 'AI', vipLevel: 0, tags: ['元旦', '新年', '海报'] },
        { title: '端午节活动海报', description: '端午节传统节日海报设计', fileFormat: 'PSD', vipLevel: 0, tags: ['端午', '海报', '节日'] },
        { title: '七夕情人节海报', description: '七夕情人节浪漫主题海报', fileFormat: 'AI', vipLevel: 1, tags: ['七夕', '情人节', '海报'] },
      ]
    },
    // 电商类资源
    {
      categoryCode: 'ecommerce',
      resources: [
        { title: '双11促销主图模板', description: '双11电商促销主图设计模板', fileFormat: 'PSD', vipLevel: 0, tags: ['双11', '电商', '促销'] },
        { title: '618购物节Banner', description: '618购物节活动Banner设计', fileFormat: 'AI', vipLevel: 0, tags: ['618', '电商', 'Banner'] },
        { title: '电商详情页模板', description: '完整的电商产品详情页设计', fileFormat: 'PSD', vipLevel: 1, tags: ['电商', '详情页', '模板'] },
        { title: '店铺首页装修模板', description: '淘宝/京东店铺首页装修模板', fileFormat: 'PSD', vipLevel: 0, tags: ['电商', '店铺', '装修'] },
        { title: '商品主图设计套装', description: '多款商品主图设计模板套装', fileFormat: 'PSD', vipLevel: 1, tags: ['电商', '主图', '套装'] },
        { title: '电商直通车图', description: '电商直通车推广图设计', fileFormat: 'AI', vipLevel: 0, tags: ['电商', '直通车', '推广'] },
        { title: '优惠券设计模板', description: '电商优惠券设计模板合集', fileFormat: 'PSD', vipLevel: 0, tags: ['电商', '优惠券', '设计'] },
      ]
    },
    // UI设计类资源
    {
      categoryCode: 'ui-design',
      resources: [
        { title: '移动端APP界面设计', description: '完整的移动端APP UI设计稿', fileFormat: 'SKETCH', vipLevel: 1, tags: ['UI', 'APP', '移动端'] },
        { title: '后台管理系统UI', description: '后台管理系统界面设计模板', fileFormat: 'FIGMA', vipLevel: 1, tags: ['UI', '后台', '管理系统'] },
        { title: '网站首页设计', description: '企业网站首页UI设计', fileFormat: 'XD', vipLevel: 0, tags: ['UI', '网站', '首页'] },
        { title: 'UI组件库', description: '完整的UI组件库设计资源', fileFormat: 'SKETCH', vipLevel: 1, tags: ['UI', '组件库', '设计'] },
        { title: '图标icon合集', description: '1000+精美图标icon合集', fileFormat: 'SVG', vipLevel: 0, tags: ['UI', '图标', 'icon'] },
        { title: '登录注册页面', description: '登录注册页面UI设计模板', fileFormat: 'FIGMA', vipLevel: 0, tags: ['UI', '登录', '注册'] },
      ]
    },
    // 插画类资源
    {
      categoryCode: 'illustration',
      resources: [
        { title: '扁平风格插画', description: '扁平风格商业插画素材包', fileFormat: 'AI', vipLevel: 0, tags: ['插画', '扁平', '商业'] },
        { title: '手绘风格插画', description: '手绘风格人物场景插画', fileFormat: 'PSD', vipLevel: 1, tags: ['插画', '手绘', '人物'] },
        { title: '2.5D立体插画', description: '2.5D立体风格插画素材', fileFormat: 'AI', vipLevel: 1, tags: ['插画', '2.5D', '立体'] },
        { title: '节日主题插画', description: '各种节日主题插画合集', fileFormat: 'SVG', vipLevel: 0, tags: ['插画', '节日', '主题'] },
        { title: '商业场景插画', description: '商业办公场景插画素材', fileFormat: 'AI', vipLevel: 0, tags: ['插画', '商业', '场景'] },
      ]
    },
    // 摄影图类资源
    {
      categoryCode: 'photography',
      resources: [
        { title: '商业摄影图片', description: '高清商业摄影图片素材', fileFormat: 'JPG', vipLevel: 0, tags: ['摄影', '商业', '高清'] },
        { title: '自然风景照片', description: '自然风景高清摄影作品', fileFormat: 'JPG', vipLevel: 0, tags: ['摄影', '风景', '自然'] },
        { title: '美食摄影图片', description: '美食摄影高清图片素材', fileFormat: 'JPG', vipLevel: 1, tags: ['摄影', '美食', '高清'] },
        { title: '人物肖像摄影', description: '人物肖像摄影作品集', fileFormat: 'JPG', vipLevel: 1, tags: ['摄影', '人物', '肖像'] },
        { title: '建筑摄影图片', description: '建筑摄影高清图片素材', fileFormat: 'JPG', vipLevel: 0, tags: ['摄影', '建筑', '高清'] },
      ]
    },
    // 背景素材类资源
    {
      categoryCode: 'background',
      resources: [
        { title: '渐变背景素材', description: '多彩渐变背景素材包', fileFormat: 'JPG', vipLevel: 0, tags: ['背景', '渐变', '素材'] },
        { title: '纹理背景图', description: '各种纹理背景图素材', fileFormat: 'PNG', vipLevel: 0, tags: ['背景', '纹理', '素材'] },
        { title: '科技感背景', description: '科技感炫酷背景素材', fileFormat: 'JPG', vipLevel: 1, tags: ['背景', '科技', '炫酷'] },
        { title: '水彩背景素材', description: '水彩风格背景素材包', fileFormat: 'PNG', vipLevel: 0, tags: ['背景', '水彩', '素材'] },
        { title: '几何图案背景', description: '几何图案背景素材合集', fileFormat: 'SVG', vipLevel: 0, tags: ['背景', '几何', '图案'] },
      ]
    },
    // 字体类资源
    {
      categoryCode: 'font',
      resources: [
        { title: '商业字体包', description: '可商用中文字体包', fileFormat: 'TTF', vipLevel: 1, tags: ['字体', '商用', '中文'] },
        { title: '手写字体合集', description: '手写风格字体合集', fileFormat: 'OTF', vipLevel: 0, tags: ['字体', '手写', '合集'] },
        { title: '英文字体包', description: '精选英文字体包', fileFormat: 'TTF', vipLevel: 0, tags: ['字体', '英文', '精选'] },
        { title: '书法字体', description: '中国书法字体素材', fileFormat: 'TTF', vipLevel: 1, tags: ['字体', '书法', '中国'] },
        { title: '艺术字体', description: '创意艺术字体合集', fileFormat: 'OTF', vipLevel: 0, tags: ['字体', '艺术', '创意'] },
      ]
    },
    // 图标类资源
    {
      categoryCode: 'icon',
      resources: [
        { title: '线性图标合集', description: '1000+线性风格图标', fileFormat: 'SVG', vipLevel: 0, tags: ['图标', '线性', '合集'] },
        { title: '扁平图标包', description: '扁平风格图标素材包', fileFormat: 'PNG', vipLevel: 0, tags: ['图标', '扁平', '素材'] },
        { title: '3D图标素材', description: '3D立体图标素材包', fileFormat: 'PNG', vipLevel: 1, tags: ['图标', '3D', '立体'] },
        { title: '社交媒体图标', description: '社交媒体平台图标合集', fileFormat: 'SVG', vipLevel: 0, tags: ['图标', '社交', '媒体'] },
        { title: '商业图标库', description: '商业办公图标库', fileFormat: 'SVG', vipLevel: 0, tags: ['图标', '商业', '办公'] },
      ]
    },
    // 模板类资源
    {
      categoryCode: 'template',
      resources: [
        { title: 'PPT演示模板', description: '商业PPT演示模板', fileFormat: 'PPTX', vipLevel: 1, tags: ['模板', 'PPT', '演示'] },
        { title: 'Word文档模板', description: 'Word文档排版模板', fileFormat: 'DOCX', vipLevel: 0, tags: ['模板', 'Word', '文档'] },
        { title: 'Excel表格模板', description: 'Excel数据表格模板', fileFormat: 'XLSX', vipLevel: 0, tags: ['模板', 'Excel', '表格'] },
        { title: '简历模板', description: '精美个人简历模板', fileFormat: 'DOCX', vipLevel: 0, tags: ['模板', '简历', '个人'] },
        { title: '名片设计模板', description: '商业名片设计模板', fileFormat: 'AI', vipLevel: 1, tags: ['模板', '名片', '设计'] },
      ]
    },
  ];

  let totalCreated = 0;

  // 为每个分类创建资源
  for (const categoryData of resourcesData) {
    const category = categories.find(c => c.category_code === categoryData.categoryCode);
    if (!category) {
      console.log(`⚠️  未找到分类: ${categoryData.categoryCode}`);
      continue;
    }

    console.log(`\n正在为分类 "${category.category_name}" 创建资源...`);

    for (const resourceData of categoryData.resources) {
      // 随机选择一个用户作为上传者
      const uploader = testUsers[Math.floor(Math.random() * testUsers.length)];

      // 生成随机统计数据
      const downloadCount = Math.floor(Math.random() * 500) + 10;
      const viewCount = Math.floor(Math.random() * 1000) + 50;
      const likeCount = Math.floor(Math.random() * 200) + 5;
      const collectCount = Math.floor(Math.random() * 150) + 3;

      try {
        await prisma.resources.create({
          data: {
            title: resourceData.title,
            description: resourceData.description,
            cover: `/covers/${category.category_code}-${Math.floor(Math.random() * 10) + 1}.jpg`,
            file_url: `/files/${category.category_code}/${resourceData.title.replace(/\s+/g, '-')}.${resourceData.fileFormat.toLowerCase()}`,
            file_name: `${resourceData.title}.${resourceData.fileFormat.toLowerCase()}`,
            file_size: BigInt(Math.floor(Math.random() * 50000000) + 1000000), // 1MB - 50MB
            file_format: resourceData.fileFormat,
            preview_images: [
              `/previews/${category.category_code}-preview-1.jpg`,
              `/previews/${category.category_code}-preview-2.jpg`,
            ],
            category_id: category.category_id,
            tags: resourceData.tags,
            vip_level: resourceData.vipLevel,
            user_id: uploader.user_id,
            audit_status: 1, // 已审核通过
            status: 1, // 正常
            download_count: downloadCount,
            view_count: viewCount,
            like_count: likeCount,
            collect_count: collectCount,
            is_top: Math.random() > 0.9, // 10%概率置顶
            is_recommend: Math.random() > 0.8, // 20%概率推荐
          },
        });

        totalCreated++;
        process.stdout.write('.');
      } catch (error) {
        console.error(`\n❌ 创建资源失败: ${resourceData.title}`, error);
      }
    }

    console.log(`\n✓ 完成 "${category.category_name}" 分类资源创建`);
  }

  console.log(`\n\n总共创建了 ${totalCreated} 个测试资源\n`);

  // 更新所有分类的资源计数
  console.log('正在更新分类资源计数...');
  
  for (const category of categories) {
    const count = await prisma.resources.count({
      where: {
        category_id: category.category_id,
        audit_status: 1,
        status: 1,
      },
    });

    await prisma.categories.update({
      where: { category_id: category.category_id },
      data: { resource_count: count },
    });

    console.log(`✓ ${category.category_name}: ${count} 个资源`);
  }

  console.log('\n========================================');
  console.log('资源数据添加完成！');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('❌ 资源数据添加失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
