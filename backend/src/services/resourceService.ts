/**
 * 资源服务
 * 处理资源相关的业务逻辑
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@/utils/logger.js';

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
function calculateComprehensiveScore(resource: any): number {
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

      const [resources, total] = await Promise.all([
        prisma.resources.findMany({
          where,
          skip,
          take: sortBy === 'comprehensive' ? pageSize * 3 : take,
          orderBy,
          select: {
            resource_id: true,
            title: true,
            description: true,
            cover: true,
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

      let sortedResources = resources;
      if (sortBy === 'comprehensive') {
        const resourcesWithScore = resources.map(resource => ({
          ...resource,
          score: calculateComprehensiveScore(resource),
        }));
        
        resourcesWithScore.sort((a, b) => b.score - a.score);
        sortedResources = resourcesWithScore.slice(skip, skip + take);
      }

      const list: ResourceListItem[] = await Promise.all(
        sortedResources.map(async (resource) => {
          const item: ResourceListItem = {
            resourceId: resource.resource_id,
            title: resource.title,
            description: resource.description,
            cover: resource.cover,
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
      const cover = previewImages.length > 0 ? `/uploads/${previewImages[0].filename}` : null;
      const previewImageUrls = previewImages.map(img => `/uploads/${img.filename}`);

      const resource = await prisma.resources.create({
        data: {
          title,
          description,
          cover,
          file_url: fileUrl,
          file_name: file.originalname,
          file_size: BigInt(file.size),
          file_format: file.mimetype,
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

      const detail: any = {
        resourceId: resource.resource_id,
        title: resource.title,
        description: resource.description,
        cover: resource.cover,
        fileUrl: resource.file_url,
        fileName: resource.file_name,
        fileSize: resource.file_size.toString(),
        fileFormat: resource.file_format,
        previewImages: resource.preview_images,
        categoryId: resource.category_id,
        category: resource.categories,
        tags: resource.tags,
        vipLevel: resource.vip_level,
        downloadCount: resource.download_count,
        viewCount: resource.view_count + 1,
        likeCount: resource.like_count,
        collectCount: resource.collect_count,
        isTop: resource.is_top,
        isRecommend: resource.is_recommend,
        createdAt: resource.created_at,
        updatedAt: resource.updated_at,
        user: resource.users_resources_user_idTousers,
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
}

export const resourceService = new ResourceService();
export default resourceService;
