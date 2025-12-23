/**
 * 分类管理服务
 * 处理分类管理相关的业务逻辑
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger.js';

const prisma = new PrismaClient();

/**
 * 分类数据接口
 */
export interface CategoryData {
  categoryName: string;
  categoryCode: string;
  parentId?: string | null;
  icon?: string;
  sortOrder?: number;
  isHot?: boolean;
  isRecommend?: boolean;
}

/**
 * 分类树节点接口
 */
export interface CategoryTreeNode {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  parentId: string | null;
  icon: string | null;
  sortOrder: number;
  isHot: boolean;
  isRecommend: boolean;
  resourceCount: number;
  createdAt: Date;
  updatedAt: Date;
  children?: CategoryTreeNode[];
}

class CategoryService {
  /**
   * 获取分类列表(树形结构)
   * 返回一级和二级分类
   */
  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    try {
      const categories = await prisma.categories.findMany({
        orderBy: { sort_order: 'asc' },
      });

      const categoryList: CategoryTreeNode[] = categories.map((cat) => ({
        categoryId: cat.category_id,
        categoryName: cat.category_name,
        categoryCode: cat.category_code,
        parentId: cat.parent_id,
        icon: cat.icon,
        sortOrder: cat.sort_order,
        isHot: cat.is_hot,
        isRecommend: cat.is_recommend,
        resourceCount: cat.resource_count,
        createdAt: cat.created_at,
        updatedAt: cat.updated_at,
      }));

      const tree: CategoryTreeNode[] = [];
      const categoryMap = new Map<string, CategoryTreeNode>();

      categoryList.forEach((cat) => {
        categoryMap.set(cat.categoryId, { ...cat, children: [] });
      });

      categoryList.forEach((cat) => {
        const node = categoryMap.get(cat.categoryId)!;
        if (cat.parentId) {
          const parent = categoryMap.get(cat.parentId);
          if (parent) {
            parent.children!.push(node);
          }
        } else {
          tree.push(node);
        }
      });

      return tree;
    } catch (err) {
      logger.error('获取分类列表失败:', err);
      throw new Error('获取分类列表失败');
    }
  }

  /**
   * 添加分类
   * 支持添加一级分类和二级分类
   */
  async createCategory(data: CategoryData): Promise<CategoryTreeNode> {
    try {
      const existingCategory = await prisma.categories.findUnique({
        where: { category_code: data.categoryCode },
      });

      if (existingCategory) {
        throw new Error('分类代码已存在');
      }

      if (data.parentId) {
        const parentCategory = await prisma.categories.findUnique({
          where: { category_id: data.parentId },
        });

        if (!parentCategory) {
          throw new Error('父分类不存在');
        }

        if (parentCategory.parent_id) {
          throw new Error('不支持三级分类');
        }
      }

      const category = await prisma.categories.create({
        data: {
          category_name: data.categoryName,
          category_code: data.categoryCode,
          parent_id: data.parentId || null,
          icon: data.icon || null,
          sort_order: data.sortOrder || 0,
          is_hot: data.isHot || false,
          is_recommend: data.isRecommend || false,
          resource_count: 0,
        },
      });

      logger.info(`创建分类成功: ${category.category_id}`);

      return {
        categoryId: category.category_id,
        categoryName: category.category_name,
        categoryCode: category.category_code,
        parentId: category.parent_id,
        icon: category.icon,
        sortOrder: category.sort_order,
        isHot: category.is_hot,
        isRecommend: category.is_recommend,
        resourceCount: category.resource_count,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      };
    } catch (err) {
      logger.error('创建分类失败:', err);
      throw err;
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(categoryId: string, data: Partial<CategoryData>): Promise<CategoryTreeNode> {
    try {
      const category = await prisma.categories.findUnique({
        where: { category_id: categoryId },
      });

      if (!category) {
        throw new Error('分类不存在');
      }

      if (data.categoryCode && data.categoryCode !== category.category_code) {
        const existingCategory = await prisma.categories.findUnique({
          where: { category_code: data.categoryCode },
        });

        if (existingCategory) {
          throw new Error('分类代码已存在');
        }
      }

      if (data.parentId !== undefined) {
        if (data.parentId) {
          const parentCategory = await prisma.categories.findUnique({
            where: { category_id: data.parentId },
          });

          if (!parentCategory) {
            throw new Error('父分类不存在');
          }

          if (parentCategory.parent_id) {
            throw new Error('不支持三级分类');
          }

          if (data.parentId === categoryId) {
            throw new Error('不能将分类设置为自己的子分类');
          }
        }
      }

      const updated = await prisma.categories.update({
        where: { category_id: categoryId },
        data: {
          category_name: data.categoryName,
          category_code: data.categoryCode,
          parent_id: data.parentId !== undefined ? data.parentId : undefined,
          icon: data.icon !== undefined ? data.icon : undefined,
          sort_order: data.sortOrder,
          is_hot: data.isHot,
          is_recommend: data.isRecommend,
          updated_at: new Date(),
        },
      });

      logger.info(`更新分类成功: ${categoryId}`);

      return {
        categoryId: updated.category_id,
        categoryName: updated.category_name,
        categoryCode: updated.category_code,
        parentId: updated.parent_id,
        icon: updated.icon,
        sortOrder: updated.sort_order,
        isHot: updated.is_hot,
        isRecommend: updated.is_recommend,
        resourceCount: updated.resource_count,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      };
    } catch (err) {
      logger.error('更新分类失败:', err);
      throw err;
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const category = await prisma.categories.findUnique({
        where: { category_id: categoryId },
      });

      if (!category) {
        throw new Error('分类不存在');
      }

      if (category.resource_count > 0) {
        throw new Error('该分类下有资源，无法删除');
      }

      const childCategories = await prisma.categories.findMany({
        where: { parent_id: categoryId },
      });

      if (childCategories.length > 0) {
        throw new Error('该分类下有子分类，无法删除');
      }

      await prisma.categories.delete({
        where: { category_id: categoryId },
      });

      logger.info(`删除分类成功: ${categoryId}`);
    } catch (err) {
      logger.error('删除分类失败:', err);
      throw err;
    }
  }

  /**
   * 批量更新分类排序
   */
  async updateCategoriesSort(sortData: Array<{ categoryId: string; sortOrder: number }>): Promise<void> {
    try {
      await prisma.$transaction(
        sortData.map((item) =>
          prisma.categories.update({
            where: { category_id: item.categoryId },
            data: { sort_order: item.sortOrder, updated_at: new Date() },
          })
        )
      );

      logger.info(`批量更新分类排序成功，共 ${sortData.length} 个分类`);
    } catch (err) {
      logger.error('批量更新分类排序失败:', err);
      throw new Error('批量更新分类排序失败');
    }
  }
}

export const categoryService = new CategoryService();
export default categoryService;
