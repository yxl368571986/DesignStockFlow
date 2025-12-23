/**
 * 管理员资源服务
 * 处理管理员资源管理相关的业务逻辑
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@/utils/logger.js';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * 资源列表筛选条件
 */
export interface ResourceListFilters {
  search?: string; // 搜索关键词(标题/资源ID/上传者)
  categoryId?: string; // 分类ID
  auditStatus?: number; // 审核状态
  vipLevel?: number; // VIP等级
  status?: number; // 资源状态
}

/**
 * 资源更新数据
 */
export interface ResourceUpdateData {
  title?: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
}

class AdminResourceService {
  /**
   * 获取资源列表(管理员)
   * 支持搜索(标题/资源ID/上传者)、筛选(分类/审核状态/VIP等级/状态)
   */
  async getResourceList(pageNum: number, pageSize: number, filters: ResourceListFilters) {
    try {
      // 构建查询条件
      const where: Prisma.resourcesWhereInput = {};

      // 搜索条件：标题、资源ID、上传者昵称/手机号
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { resource_id: { contains: filters.search, mode: 'insensitive' } },
          {
            users_resources_user_idTousers: {
              OR: [
                { nickname: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search, mode: 'insensitive' } },
              ],
            },
          },
        ];
      }

      // 分类筛选
      if (filters.categoryId) {
        where.category_id = filters.categoryId;
      }

      // 审核状态筛选
      if (filters.auditStatus !== undefined) {
        where.audit_status = filters.auditStatus;
      }

      // VIP等级筛选
      if (filters.vipLevel !== undefined) {
        where.vip_level = filters.vipLevel;
      }

      // 资源状态筛选
      if (filters.status !== undefined) {
        where.status = filters.status;
      }

      // 计算分页
      const skip = (pageNum - 1) * pageSize;
      const take = pageSize;

      // 查询资源列表
      const [resources, total] = await Promise.all([
        prisma.resources.findMany({
          where,
          skip,
          take,
          orderBy: { created_at: 'desc' },
          include: {
            users_resources_user_idTousers: {
              select: {
                user_id: true,
                nickname: true,
                phone: true,
                avatar: true,
              },
            },
            categories: {
              select: {
                category_id: true,
                category_name: true,
                category_code: true,
              },
            },
          },
        }),
        prisma.resources.count({ where }),
      ]);

      // 转换为响应格式
      const list = resources.map((resource) => ({
        resourceId: resource.resource_id,
        title: resource.title,
        description: resource.description,
        cover: resource.cover,
        fileUrl: resource.file_url,
        fileName: resource.file_name,
        fileSize: resource.file_size.toString(),
        fileFormat: resource.file_format,
        categoryId: resource.category_id,
        category: resource.categories,
        tags: resource.tags,
        vipLevel: resource.vip_level,
        userId: resource.user_id,
        user: resource.users_resources_user_idTousers,
        auditStatus: resource.audit_status,
        auditMsg: resource.audit_msg,
        downloadCount: resource.download_count,
        viewCount: resource.view_count,
        likeCount: resource.like_count,
        collectCount: resource.collect_count,
        isTop: resource.is_top,
        isRecommend: resource.is_recommend,
        status: resource.status,
        createdAt: resource.created_at,
        updatedAt: resource.updated_at,
      }));

      return {
        list,
        total,
        page: pageNum,
        pageSize,
      };
    } catch (err) {
      logger.error('获取资源列表失败:', err);
      throw new Error('获取资源列表失败');
    }
  }

  /**
   * 更新资源(管理员)
   * 允许修改标题、分类、标签、描述
   */
  async updateResource(resourceId: string, data: ResourceUpdateData, operatorId: string) {
    try {
      // 查询资源是否存在
      const resource = await prisma.resources.findUnique({
        where: { resource_id: resourceId },
      });

      if (!resource) {
        throw new Error('资源不存在');
      }

      // 如果修改了分类，验证分类是否存在
      if (data.categoryId) {
        const category = await prisma.categories.findUnique({
          where: { category_id: data.categoryId },
        });

        if (!category) {
          throw new Error('分类不存在');
        }
      }

      // 更新资源
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

      logger.info(`管理员 ${operatorId} 更新资源 ${resourceId}`);

      return {
        resourceId: updated.resource_id,
        title: updated.title,
        description: updated.description,
        categoryId: updated.category_id,
        tags: updated.tags,
        updatedAt: updated.updated_at,
      };
    } catch (err) {
      logger.error('更新资源失败:', err);
      throw err;
    }
  }

  /**
   * 下架资源
   * 将资源从前台隐藏
   */
  async offlineResource(resourceId: string, operatorId: string, _reason?: string) {
    try {
      const resource = await prisma.resources.findUnique({
        where: { resource_id: resourceId },
      });

      if (!resource) {
        throw new Error('资源不存在');
      }

      await prisma.resources.update({
        where: { resource_id: resourceId },
        data: {
          status: 0,
          updated_at: new Date(),
        },
      });

      logger.info(`管理员 ${operatorId} 下架资源 ${resourceId}`);

      return {
        resourceId,
        message: '资源已下架',
      };
    } catch (err) {
      logger.error('下架资源失败:', err);
      throw err;
    }
  }

  /**
   * 删除资源(管理员)
   * 永久删除资源及相关文件
   */
  async deleteResource(resourceId: string, operatorId: string) {
    try {
      const resource = await prisma.resources.findUnique({
        where: { resource_id: resourceId },
      });

      if (!resource) {
        throw new Error('资源不存在');
      }

      // 删除资源文件
      try {
        if (resource.file_url) {
          const filePath = path.join(process.cwd(), 'uploads', path.basename(resource.file_url));
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.info(`删除资源文件: ${filePath}`);
          }
        }

        if (resource.cover) {
          const coverPath = path.join(process.cwd(), 'uploads', path.basename(resource.cover));
          if (fs.existsSync(coverPath)) {
            fs.unlinkSync(coverPath);
            logger.info(`删除封面图: ${coverPath}`);
          }
        }

        if (resource.preview_images && resource.preview_images.length > 0) {
          resource.preview_images.forEach((imgUrl: string) => {
            const imgPath = path.join(process.cwd(), 'uploads', path.basename(imgUrl));
            if (fs.existsSync(imgPath)) {
              fs.unlinkSync(imgPath);
              logger.info(`删除预览图: ${imgPath}`);
            }
          });
        }
      } catch (fileErr) {
        logger.error('删除资源文件失败:', fileErr);
      }

      await prisma.resources.delete({
        where: { resource_id: resourceId },
      });

      logger.info(`管理员 ${operatorId} 永久删除资源 ${resourceId}`);

      return {
        resourceId,
        message: '资源已永久删除',
      };
    } catch (err) {
      logger.error('删除资源失败:', err);
      throw err;
    }
  }

  /**
   * 置顶资源
   */
  async topResource(resourceId: string, isTop: boolean, operatorId: string) {
    try {
      const resource = await prisma.resources.findUnique({
        where: { resource_id: resourceId },
      });

      if (!resource) {
        throw new Error('资源不存在');
      }

      await prisma.resources.update({
        where: { resource_id: resourceId },
        data: {
          is_top: isTop,
          updated_at: new Date(),
        },
      });

      logger.info(`管理员 ${operatorId} ${isTop ? '置顶' : '取消置顶'}资源 ${resourceId}`);

      return {
        resourceId,
        isTop,
        message: isTop ? '资源已置顶' : '资源已取消置顶',
      };
    } catch (err) {
      logger.error('置顶资源失败:', err);
      throw err;
    }
  }

  /**
   * 推荐资源
   */
  async recommendResource(resourceId: string, isRecommend: boolean, operatorId: string) {
    try {
      const resource = await prisma.resources.findUnique({
        where: { resource_id: resourceId },
      });

      if (!resource) {
        throw new Error('资源不存在');
      }

      await prisma.resources.update({
        where: { resource_id: resourceId },
        data: {
          is_recommend: isRecommend,
          updated_at: new Date(),
        },
      });

      logger.info(`管理员 ${operatorId} ${isRecommend ? '推荐' : '取消推荐'}资源 ${resourceId}`);

      return {
        resourceId,
        isRecommend,
        message: isRecommend ? '资源已添加到推荐位' : '资源已从推荐位移除',
      };
    } catch (err) {
      logger.error('推荐资源失败:', err);
      throw err;
    }
  }
}

export const adminResourceService = new AdminResourceService();
export default adminResourceService;
