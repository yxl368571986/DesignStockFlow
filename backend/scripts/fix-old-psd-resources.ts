/**
 * 修复老数据脚本
 * 为没有封面图的PSD资源重新生成预览图
 * 同时修复乱码的文件名
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// @ts-expect-error - psd.js 没有类型定义
import PSD from 'psd';

const prisma = new PrismaClient();

// 预览图保存目录
const PREVIEW_DIR = './uploads/previews';
const UPLOADS_DIR = './uploads';

/**
 * 确保目录存在
 */
async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch (error) {
    // 目录已存在，忽略错误
  }
}

/**
 * 从PSD文件生成预览图
 */
async function generatePsdPreview(filePath: string): Promise<string | null> {
  try {
    console.log(`正在解析PSD文件: ${filePath}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在: ${filePath}`);
      return null;
    }

    // 确保预览图目录存在
    await ensureDir(PREVIEW_DIR);

    // 生成预览图文件名
    const previewId = uuidv4();
    const previewFileName = `${previewId}.png`;
    const previewPath = path.join(PREVIEW_DIR, previewFileName);

    // 使用 psd.js 解析（支持CMYK模式）
    const psd = await PSD.open(filePath);
    await psd.image.saveAsPng(previewPath);

    // 验证文件是否成功生成
    if (fs.existsSync(previewPath)) {
      const previewUrl = `/uploads/previews/${previewFileName}`;
      console.log(`预览图生成成功: ${previewUrl}`);
      return previewUrl;
    }

    console.error('预览图文件未生成');
    return null;
  } catch (error) {
    console.error(`生成预览图失败:`, error);
    return null;
  }
}

/**
 * 修复单个资源
 */
async function fixResource(resource: {
  resource_id: string;
  title: string;
  file_name: string | null;
  file_url: string | null;
  cover: string | null;
}): Promise<boolean> {
  console.log(`\n处理资源: ${resource.resource_id}`);
  console.log(`  标题: ${resource.title}`);
  console.log(`  文件名: ${resource.file_name}`);
  console.log(`  文件URL: ${resource.file_url}`);

  // 1. 确定实际的文件路径
  let actualFilePath: string | null = null;
  
  // 尝试从file_url获取文件路径
  if (resource.file_url) {
    const urlPath = decodeURIComponent(resource.file_url.replace('/uploads/', ''));
    const testPath = path.join(UPLOADS_DIR, urlPath);
    if (fs.existsSync(testPath)) {
      actualFilePath = testPath;
      console.log(`  找到文件(从URL): ${actualFilePath}`);
    }
  }

  // 如果从URL找不到，尝试从file_name
  if (!actualFilePath && resource.file_name) {
    // 尝试解码乱码的文件名
    let decodedFileName = resource.file_name;
    try {
      // 检查是否是乱码（包含特殊字符）
      if (resource.file_name.includes('å') || resource.file_name.includes('\u0080')) {
        // 这是latin1编码的UTF8字符串，需要转换
        decodedFileName = Buffer.from(resource.file_name, 'latin1').toString('utf8');
        console.log(`  解码文件名: ${decodedFileName}`);
      }
    } catch {
      // 解码失败，使用原始文件名
    }

    const testPath = path.join(UPLOADS_DIR, decodedFileName);
    if (fs.existsSync(testPath)) {
      actualFilePath = testPath;
      console.log(`  找到文件(从文件名): ${actualFilePath}`);
    }
  }

  // 如果还是找不到，列出目录中的PSD文件
  if (!actualFilePath) {
    console.log('  尝试在uploads目录中查找PSD文件...');
    const files = await fs.promises.readdir(UPLOADS_DIR);
    const psdFiles = files.filter(f => f.toLowerCase().endsWith('.psd'));
    console.log(`  找到的PSD文件: ${psdFiles.join(', ')}`);
    
    // 尝试匹配
    for (const psdFile of psdFiles) {
      const testPath = path.join(UPLOADS_DIR, psdFile);
      actualFilePath = testPath;
      console.log(`  使用文件: ${actualFilePath}`);
      break;
    }
  }

  if (!actualFilePath) {
    console.error(`  无法找到资源文件`);
    return false;
  }

  // 2. 生成预览图
  const previewUrl = await generatePsdPreview(actualFilePath);
  if (!previewUrl) {
    console.error(`  生成预览图失败`);
    return false;
  }

  // 3. 准备更新数据
  const updateData: {
    cover: string;
    preview_images: string[];
    file_name?: string;
    file_url?: string;
  } = {
    cover: previewUrl,
    preview_images: [previewUrl],
  };

  // 4. 修复乱码的文件名
  if (resource.file_name && (resource.file_name.includes('å') || resource.file_name.includes('\u0080'))) {
    try {
      const decodedFileName = Buffer.from(resource.file_name, 'latin1').toString('utf8');
      updateData.file_name = decodedFileName;
      console.log(`  修复文件名: ${resource.file_name} -> ${decodedFileName}`);
    } catch {
      // 解码失败，保持原样
    }
  }

  // 5. 更新数据库
  try {
    await prisma.resources.update({
      where: { resource_id: resource.resource_id },
      data: updateData,
    });
    console.log(`  ✓ 资源更新成功`);
    return true;
  } catch (error) {
    console.error(`  更新数据库失败:`, error);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('开始修复老数据...');
  console.log('='.repeat(60));

  try {
    // 查找需要修复的资源（没有封面的PSD文件）
    const resources = await prisma.resources.findMany({
      where: {
        file_format: 'PSD',
        OR: [
          { cover: null },
          { cover: '' },
        ],
      },
      select: {
        resource_id: true,
        title: true,
        file_name: true,
        file_url: true,
        cover: true,
      },
    });

    console.log(`找到 ${resources.length} 个需要修复的资源\n`);

    let successCount = 0;
    let failCount = 0;

    for (const resource of resources) {
      const success = await fixResource(resource);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('修复完成!');
    console.log(`  成功: ${successCount}`);
    console.log(`  失败: ${failCount}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('修复过程出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
main();
