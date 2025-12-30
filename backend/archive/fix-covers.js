// 修复资源封面图片脚本
// 同时更新 cover 和 previewImages，确保一致性
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCovers() {
  try {
    // 获取所有资源
    const resources = await prisma.resources.findMany({
      select: {
        resource_id: true,
        title: true,
        cover: true,
        preview_images: true
      }
    });

    console.log(`找到 ${resources.length} 个资源需要检查`);

    // 使用有效的 picsum.photos ID 列表（避免被 ORB 阻止的 ID）
    const validIds = [
      10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
      20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
      30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
      40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
      50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
      60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
      70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
      80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
      100, 101, 102, 103, 104, 106, 107, 108, 109, 110,
      111, 112, 113, 114, 115, 116, 117, 118, 119, 120,
      121, 122, 123, 124, 125, 126, 127, 128, 129, 130,
      131, 132, 133, 134, 135, 136, 137, 139, 140, 141,
      142, 143, 144, 145, 146, 147, 149, 151, 152, 153
    ];

    // 更新每个资源
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      
      // 为每个资源生成一组图片 URL
      const baseIndex = (i * 5) % validIds.length;
      const coverPicId = validIds[baseIndex];
      
      // 生成 5 张预览图（第一张与封面相同）
      const previewImages = [];
      for (let j = 0; j < 5; j++) {
        const picId = validIds[(baseIndex + j) % validIds.length];
        previewImages.push(`https://picsum.photos/id/${picId}/800/600`);
      }
      
      // 封面使用第一张预览图
      const newCover = previewImages[0];

      await prisma.resources.update({
        where: { resource_id: resource.resource_id },
        data: { 
          cover: newCover,
          preview_images: previewImages
        }
      });

      console.log(`更新: ${resource.title}`);
      console.log(`  封面: ${newCover}`);
      console.log(`  预览图: ${previewImages.length} 张`);
    }

    console.log('\n封面和预览图修复完成！');
  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCovers();
