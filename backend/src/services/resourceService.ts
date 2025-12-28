/**
 * 资源服务
 * 处理资源相关的业务逻辑
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@/utils/logger.js';
import path from 'path';
import fs from 'fs';
import { previewExtractorService } from './previewExtractorService.js';

const prisma = new PrismaClient();

/**
 * 资源列表查询参数
 */
export interface ResourceListQuery {
  pageNum?: number;
  pageSize?: number;
  categoryId?: string;
  vipLevel?: number;
  keyword?: string;
  sortBy?: 'comprehensive' | 'download' | 'latest' | 'like' | 'collect';
  format?: string;
  userId?: string;
  isVip?: boolean;
}

/**
 * 资源列表项
 */
export interface ResourceListItem {
  resourceId: string;
  title: string;
  description: string | null;
  cover: string | null;
  fileUrl: string | null;
  fileName: string | null;
  categoryId: string | null;
  tags: string[];
  vipLevel: number;
  format: string | null;
  downloadCount: number;
  viewCount: number;
  likeCount: number;
  collectCount: number;
  isTop: boolean;
  isRecommend: boolean;
  createdAt: Date;
  createTime?: string;
  pointsCost?: number;
  isFree?: boolean;
}

/**
 * 计算时间因子
 */
function calculateTimeFactor(createdAt: Date): number {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) return 100;
  if (diffDays <= 14) return 80;
  if (diffDays <= 30) return 50;
  return 10;
}

/**
 * 计算综合评分
 */
function calculateComprehensiveScore(resource: {
  download_count: number;
  view_count: number;
  collect_count: number;
  created_at: Date;
}): number {
  const downloadWeight = 0.4;
  const viewWeight = 0.2;
  const collectWeight = 0.3;
  const timeWeight = 0.1;
  
  const timeFactor = calculateTimeFactor(resource.created_at);
  
  return (
    resource.download_count * downloadWeight +
    resource.view_count * viewWeight +
    resource.collect_count * collectWeight +
    timeFactor * timeWeight
  );
}

/**
 * 获取资源积分消耗
 */
async function getResourcePointsCost(vipLevel: number): Promise<number> {
  if (vipLevel === 0) return 0;
  
  const rules = await prisma.points_rules.findMany({
    where: {
      rule_type: 'consume',
      is_enabled: true,
    },
  });
  
  const ruleMap: { [key: number]: string } = {
    1: 'download_normal',
    2: 'download_advanced',
    3: 'download_premium',
  };
  
  const ruleCode = ruleMap[vipLevel] || 'download_normal';
  const rule = rules.find(r => r.rule_code === ruleCode);
  
  return rule ? rule.points_value : 10;
}

class ResourceService {
  /**
   * 获取资源列表
   */
  async getResourceList(query: ResourceListQuery) {
    try {
      const {
        pageNum = 1,
        pageSize = 20,
        categoryId,
        vipLevel,
        keyword,
        sortBy = 'comprehensive',
        format,
        userId,
        isVip = false,
      } = query;

      const where: Prisma.resourcesWhereInput = {
        audit_status: 1,
        status: 1,
      };

      if (categoryId) {
        where.category_id = categoryId;
      }

      if (vipLevel !== undefined) {
        where.vip_level = vipLevel;
      }

      // 添加文件格式筛选
      if (format) {
        where.file_format = {
          equals: format,
          mode: 'insensitive',
        };
      }

      if (keyword) {
        where.OR = [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ];
      }

      const skip = (pageNum - 1) * pageSize;
      const take = pageSize;

      let orderBy: Prisma.resourcesOrderByWithRelationInput[] = [];
      
      switch (sortBy) {
        case 'download':
          orderBy = [{ download_count: 'desc' }];
          break;
        case 'latest':
          orderBy = [{ created_at: 'desc' }];
          break;
        case 'like':
          orderBy = [{ like_count: 'desc' }];
          break;
        case 'collect':
          orderBy = [{ collect_count: 'desc' }];
          break;
        case 'comprehensive':
        default:
          orderBy = [{ created_at: 'desc' }];
          break;
      }

      // 获取资源数据
      const [resources, total] = await Promise.all([
        prisma.resources.findMany({
          where,
          orderBy,
          select: {
            resource_id: true,
            title: true,
            description: true,
            cover: true,
            file_url: true,
            file_name: true,
            category_id: true,
            tags: true,
            vip_level: true,
            file_format: true,
            download_count: true,
            view_count: true,
            like_count: true,
            collect_count: true,
            is_top: true,
            is_recommend: true,
            created_at: true,
          },
        }),
        prisma.resources.count({ where }),
      ]);

      // 对于综合排序，需要在内存中计算评分并排序
      let sortedResources = resources;
      if (sortBy === 'comprehensive') {
        const resourcesWithScore = resources.map(resource => ({
          ...resource,
          score: calculateComprehensiveScore(resource),
        }));
        
        resourcesWithScore.sort((a, b) => b.score - a.score);
        sortedResources = resourcesWithScore;
      }
      
      // 应用分页 - 在排序后进行分页
      const paginatedResources = sortedResources.slice(skip, skip + take);

      const list: ResourceListItem[] = await Promise.all(
        paginatedResources.map(async (resource) => {
          const item: ResourceListItem = {
            resourceId: resource.resource_id,
            title: resource.title,
            description: resource.description,
            cover: resource.cover,
            fileUrl: resource.file_url,
            fileName: resource.file_name,
            categoryId: resource.category_id,
            tags: resource.tags,
            vipLevel: resource.vip_level,
            format: resource.file_format,
            downloadCount: resource.download_count,
            viewCount: resource.view_count,
            likeCount: resource.like_count,
            collectCount: resource.collect_count,
            isTop: resource.is_top,
            isRecommend: resource.is_recommend,
            createdAt: resource.created_at,
            createTime: resource.created_at.toISOString(),
          };

          if (userId) {
            if (isVip) {
              item.pointsCost = 0;
              item.isFree = true;
            } else {
              const pointsCost = await getResourcePointsCost(resource.vip_level);
              item.pointsCost = pointsCost;
              item.isFree = pointsCost === 0;
            }
          }

          return item;
        })
      );

      return {
        list,
        total,
        pageNum,
        pageSize,
      };
    } catch (err) {
      logger.error('获取资源列表失败:', err);
      throw new Error('获取资源列表失败');
    }
  }

  /**
   * 上传资源
   */
  async uploadResource(data: {
    title: string;
    description?: string;
    categoryId: string;
    tags?: string[];
    vipLevel?: number;
    userId: string;
    file: Express.Multer.File;
    previewImages?: Express.Multer.File[];
  }) {
    try {
      const {
        title,
        description,
        categoryId,
        tags = [],
        vipLevel = 0,
        userId,
        file,
        previewImages = [],
      } = data;

      const category = await prisma.categories.findUnique({
        where: { category_id: categoryId },
      });

      if (!category) {
        throw new Error('分类不存在');
      }

      const fileUrl = `/uploads/${file.filename}`;
      const filePath = `./uploads/${file.filename}`;
      
      // 确定封面和预览图
      let cover: string | null = null;
      let previewImageUrls: string[] = [];

      // 优先使用用户上传的预览图
      if (previewImages.length > 0) {
        previewImageUrls = previewExtractorService.processUploadedPreviews(previewImages);
        cover = previewImageUrls[0];
        logger.info(`使用用户上传的预览图: ${previewImageUrls.length} 张`);
      } else {
        // 自动提取预览图
        const extractResult = await previewExtractorService.extractPreview(
          filePath,
          fileUrl,
          file.originalname,
          file.mimetype
        );

        if (extractResult.success && extractResult.cover) {
          cover = extractResult.cover;
          previewImageUrls = extractResult.previewImages;
          logger.info(`自动提取预览图成功: ${file.originalname}`);
        } else if (extractResult.error) {
          logger.warn(`预览图提取提示: ${extractResult.error}`);
        }
      }

      // 获取文件格式
      const fileFormat = previewExtractorService.getFileFormat(file.originalname, file.mimetype);

      const resource = await prisma.resources.create({
        data: {
          title,
          description,
          cover,
          file_url: fileUrl,
          file_name: file.originalname,
          file_size: BigInt(file.size),
          file_format: fileFormat,
          preview_images: previewImageUrls,
          category_id: categoryId,
          tags,
          vip_level: vipLevel,
          user_id: userId,
          audit_status: 0,
          status: 1,
        },
      });

      logger.info(`用户 ${userId} 上传资源: ${resource.resource_id}`);

      return {
        resourceId: resource.resource_id,
        title: resource.title,
        auditStatus: resource.audit_status,
        createdAt: resource.created_at,
      };
    } catch (err) {
      logger.error('上传资源失败:', err);
      throw err;
    }
  }

  /**
   * 获取资源详情
   */
  async getResourceDetail(resourceId: string, userId?: string, isVip = false) {
    try {
      const resource = await prisma.resources.findUnique({
        where: { resource_id: resourceId },
        include: {
          categories: {
            select: {
              category_id: true,
              category_name: true,
              category_code: true,
            },
          },
          users_resources_user_idTousers: {
            select: {
              user_id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      });

      if (!resource) {
        throw new Error('资源不存在');
      }

      if (resource.audit_status !== 1 || resource.status !== 1) {
        throw new Error('资源不可访问');
      }

      await prisma.resources.update({
        where: { resource_id: resourceId },
        data: { view_count: { increment: 1 } },
      });

      const detail: Record<string, unknown> = {
        resourceId: resource.resource_id,
        title: resource.title,
        description: resource.description,
        cover: resource.cover,
        fileUrl: resource.file_url,
        fileName: resource.file_name,
        fileSize: resource.file_size.toString(),
        fileFormat: resource.file_format,
        format: resource.file_format, // 兼容前端字段
        previewImages: resource.preview_images,
        categoryId: resource.category_id,
        category: resource.categories,
        categoryName: resource.categories?.category_name || '', // 兼容前端字段
        tags: resource.tags,
        vipLevel: resource.vip_level,
        downloadCount: resource.download_count,
        viewCount: resource.view_count + 1,
        likeCount: resource.like_count,
        collectCount: resource.collect_count,
        isTop: resource.is_top,
        isRecommend: resource.is_recommend,
        createdAt: resource.created_at,
        createTime: resource.created_at.toISOString(), // 兼容前端字段
        updatedAt: resource.updated_at,
        updateTime: resource.updated_at.toISOString(), // 兼容前端字段
        user: resource.users_resources_user_idTousers,
        uploaderId: resource.user_id || '', // 兼容前端字段
        uploaderName: resource.users_resources_user_idTousers?.nickname || '', // 兼容前端字段
      };

      if (userId) {
        if (isVip) {
          detail.pointsCost = 0;
          detail.isFree = true;
        } else {
          const pointsCost = await getResourcePointsCost(resource.vip_level);
          detail.pointsCost = pointsCost;
          detail.isFree = pointsCost === 0;
        }
      }

      return detail;
    } catch (err) {
      logger.error('获取资源详情失败:', err);
      throw err;
    }
  }

  /**
   * 下载资源
   */
  async downloadResource(resourceId: string, userId: string, isVip: boolean) {
    try {
      const resource = await prisma.resources.findUnique({
        where: { resource_id: resourceId },
      });

      if (!resource) {
        throw new Error('资源不存在');
      }

      if (resource.audit_status !== 1) {
        throw new Error('资源未通过审核');
      }

      if (resource.status !== 1) {
        throw new Error('资源已下架');
      }

      let pointsCost = 0;
      if (!isVip && resource.vip_level > 0) {
        pointsCost = await getResourcePointsCost(resource.vip_level);
      }

      if (pointsCost > 0) {
        const user = await prisma.users.findUnique({
          where: { user_id: userId },
          select: { points_balance: true },
        });

        if (!user) {
          throw new Error('用户不存在');
        }

        if (user.points_balance < pointsCost) {
          throw new Error('积分不足，请充值或上传作品获取积分');
        }

        await prisma.users.update({
          where: { user_id: userId },
          data: {
            points_balance: { decrement: pointsCost },
          },
        });

        await prisma.points_records.create({
          data: {
            user_id: userId,
            points_change: -pointsCost,
            points_balance: user.points_balance - pointsCost,
            change_type: 'consume',
            source: 'download_resource',
            source_id: resourceId,
            description: `下载资源《${resource.title}》`,
          },
        });

        logger.info(`用户 ${userId} 消耗 ${pointsCost} 积分下载资源 ${resourceId}`);
      }

      await prisma.download_history.create({
        data: {
          user_id: userId,
          resource_id: resourceId,
          points_cost: pointsCost,
          ip_address: '',
          user_agent: '',
        },
      });

      await prisma.resources.update({
        where: { resource_id: resourceId },
        data: { download_count: { increment: 1 } },
      });

      if (resource.user_id) {
        const uploadRewardRule = await prisma.points_rules.findFirst({
          where: {
            rule_code: 'work_downloaded',
            is_enabled: true,
          },
        });

        if (uploadRewardRule) {
          const rewardPoints = uploadRewardRule.points_value;
          
          const uploader = await prisma.users.findUnique({
            where: { user_id: resource.user_id },
            select: { points_balance: true },
          });

          if (uploader) {
            await prisma.users.update({
              where: { user_id: resource.user_id },
              data: {
                points_balance: { increment: rewardPoints },
                points_total: { increment: rewardPoints },
              },
            });

            await prisma.points_records.create({
              data: {
                user_id: resource.user_id,
                points_change: rewardPoints,
                points_balance: uploader.points_balance + rewardPoints,
                change_type: 'earn',
                source: 'work_downloaded',
                source_id: resourceId,
                description: `作品《${resource.title}》被下载`,
              },
            });

            logger.info(`用户 ${resource.user_id} 获得 ${rewardPoints} 积分（作品被下载）`);
          }
        }
      }

      const downloadUrl = resource.file_url;

      return {
        downloadUrl,
        fileName: resource.file_name,
        fileSize: resource.file_size.toString(),
        pointsCost,
      };
    } catch (err) {
      logger.error('下载资源失败:', err);
      throw err;
    }
  }

  /**
   * 编辑资源
   */
  async updateResource(
    resourceId: string,
    userId: string,
    isAdmin: boolean,
    data: {
      title?: string;
      description?: string;
      categoryId?: string;
      tags?: string[];
    }
  ) {
    try {
      const resource = await prisma.resources.findUnique({
        where: { resource_id: resourceId },
      });

      if (!resource) {
        throw new Error('资源不存在');
      }

      if (resource.user_id !== userId && !isAdmin) {
        throw new Error('无权编辑此资源');
      }

      if (data.categoryId) {
        const category = await prisma.categories.findUnique({
          where: { category_id: data.categoryId },
        });

        if (!category) {
          throw new Error('分类不存在');
        }
      }

      const updated = await prisma.resources.update({
        where: { resource_id: resourceId },
        data: {
          title: data.title,
          description: data.description,
          category_id: data.categoryId,
          tags: data.tags,
          updated_at: new Date(),
        },
      });

      logger.info(`用户 ${userId} 编辑资源 ${resourceId}`);

      return {
        resourceId: updated.resource_id,
        title: updated.title,
        description: updated.description,
        categoryId: updated.category_id,
        tags: updated.tags,
        updatedAt: updated.updated_at,
      };
    } catch (err) {
      logger.error('编辑资源失败:', err);
      throw err;
    }
  }

  /**
   * 删除资源
   */
  async deleteResource(resourceId: string, userId: string, isAdmin: boolean) {
    try {
      const resource = await prisma.resources.findUnique({
        where: { resource_id: resourceId },
      });

      if (!resource) {
        throw new Error('资源不存在');
      }

      if (resource.user_id !== userId && !isAdmin) {
        throw new Error('无权删除此资源');
      }

      await prisma.resources.update({
        where: { resource_id: resourceId },
        data: {
          status: 0,
          updated_at: new Date(),
        },
      });

      logger.info(`用户 ${userId} 删除资源 ${resourceId}`);

      return {
        resourceId,
        message: '资源已删除',
      };
    } catch (err) {
      logger.error('删除资源失败:', err);
      throw err;
    }
  }

  /**
   * 从分片上传创建资源
   * 用于分片上传完成后，根据上传会话信息和元数据创建资源记录
   */
  async createResourceFromChunkUpload(data: {
    uploadId: string;
    userId: string;
    title: string;
    description?: string;
    categoryId: string;
    tags?: string[];
    vipLevel?: number;
  }) {
    try {
      const {
        uploadId,
        userId,
        title,
        description = '',
        categoryId,
        tags = [],
        vipLevel = 0,
      } = data;

      // 1. 获取分片上传会话信息
      const chunkUpload = await prisma.chunk_uploads.findUnique({
        where: { upload_id: uploadId },
      });

      if (!chunkUpload) {
        throw new Error('上传会话不存在');
      }

      if (chunkUpload.status !== 'completed') {
        throw new Error('上传尚未完成，请先完成文件上传');
      }

      // 2. 验证分类是否存在
      const category = await prisma.categories.findUnique({
        where: { category_id: categoryId },
      });

      if (!category) {
        throw new Error('分类不存在');
      }

      // 3. 构建文件URL和路径 - 查找实际保存的文件
      const resourceDir = './uploads/resources';
      const originalFileName = chunkUpload.file_name;
      const ext = path.extname(originalFileName);
      const basename = path.basename(originalFileName, ext);
      
      // 查找实际的文件（可能是原始名称或带序号的名称）
      let actualFileName = originalFileName;
      if (!fs.existsSync(path.join(resourceDir, originalFileName))) {
        // 如果原始文件名不存在，查找带序号的文件
        let counter = 1;
        while (counter < 100) { // 最多查找100个序号
          const testFileName = `${basename}(${counter})${ext}`;
          if (fs.existsSync(path.join(resourceDir, testFileName))) {
            actualFileName = testFileName;
            break;
          }
          counter++;
        }
      }
      
      const fileUrl = `/uploads/resources/${encodeURIComponent(actualFileName)}`;
      const filePath = path.join(resourceDir, actualFileName);
      
      // 4. 获取文件格式
      const fileFormat = previewExtractorService.getFileFormat(chunkUpload.file_name, '');

      // 5. 自动提取预览图
      let cover: string | null = null;
      let previewImageUrls: string[] = [];

      const extractResult = await previewExtractorService.extractPreview(
        filePath,
        fileUrl,
        chunkUpload.file_name,
        '' // 分片上传没有 MIME 类型，通过扩展名判断
      );

      if (extractResult.success && extractResult.cover) {
        cover = extractResult.cover;
        previewImageUrls = extractResult.previewImages;
        logger.info(`分片上传文件自动提取预览图成功: ${chunkUpload.file_name}`);
      } else if (extractResult.error) {
        logger.warn(`分片上传预览图提取提示: ${extractResult.error}`);
      }

      // 6. 获取用户信息
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { nickname: true },
      });

      // 7. 创建资源记录
      const resource = await prisma.resources.create({
        data: {
          title,
          description,
          cover,
          file_url: fileUrl,
          file_name: chunkUpload.file_name,
          file_size: chunkUpload.file_size,
          file_format: fileFormat,
          preview_images: previewImageUrls,
          category_id: categoryId,
          tags,
          vip_level: vipLevel,
          user_id: userId,
          audit_status: 0, // 待审核
          status: 1, // 正常状态
        },
      });

      // 8. 更新分片上传会话，关联资源ID
      await prisma.chunk_uploads.update({
        where: { upload_id: uploadId },
        data: {
          status: 'resource_created',
        },
      });

      logger.info(`用户 ${userId} 通过分片上传创建资源: ${resource.resource_id}`);

      // 9. 返回完整的资源信息（匹配前端 ResourceInfo 接口）
      return {
        resourceId: resource.resource_id,
        title: resource.title,
        description: resource.description || '',
        cover: resource.cover || '',
        coverUrl: resource.cover || '',
        previewImages: resource.preview_images || [],
        format: resource.file_format || '',
        fileFormat: resource.file_format || '',
        fileSize: Number(resource.file_size),
        fileUrl: resource.file_url,
        downloadCount: resource.download_count,
        viewCount: resource.view_count,
        likeCount: resource.like_count,
        collectCount: resource.collect_count,
        vipLevel: resource.vip_level,
        categoryId: resource.category_id || '',
        categoryName: category.category_name,
        tags: resource.tags || [],
        uploaderId: resource.user_id || '',
        uploaderName: user?.nickname || '',
        isAudit: resource.audit_status,
        auditStatus: resource.audit_status,
        createdAt: resource.created_at.toISOString(),
        createTime: resource.created_at.toISOString(),
        updateTime: resource.updated_at.toISOString(),
      };
    } catch (err) {
      logger.error('从分片上传创建资源失败:', err);
      throw err;
    }
  }
}

export const resourceService = new ResourceService();
export default resourceService;
