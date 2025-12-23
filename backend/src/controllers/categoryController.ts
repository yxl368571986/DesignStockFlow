/**
 * ������������
 * ������������ص�HTTP����
 */
import { Request, Response, NextFunction } from 'express';
import { categoryService } from '@/services/categoryService.js';
import { success, error } from '@/utils/response.js';
import { logger } from '@/utils/logger.js';

export class CategoryController {
  /**
   * ��ȡ�����б�(���νṹ)
   * GET /api/v1/admin/categories
   */
  async getCategoryTree(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const tree = await categoryService.getCategoryTree();
      success(res, tree, '��ȡ�����б�ɹ�');
    } catch (err: any) {
      logger.error('��ȡ�����б�ʧ��:', err);
      error(res, err.message || '��ȡ�����б�ʧ��', 400);
    }
  }

  /**
   * ��ӷ���
   * POST /api/v1/admin/categories
   */
  async createCategory(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { category_name, category_code, parent_id, icon, sort_order, is_hot, is_recommend } = req.body;

      // ������֤
      if (!category_name || !category_code) {
        error(res, '�������ƺͷ�����벻��Ϊ��', 400);
        return;
      }

      // ���÷���㴴������
      const category = await categoryService.createCategory({
        categoryName: category_name,
        categoryCode: category_code,
        parentId: parent_id || null,
        icon: icon || null,
        sortOrder: sort_order || 0,
        isHot: is_hot || false,
        isRecommend: is_recommend || false,
      });

      success(res, category, '��ӷ���ɹ�');
    } catch (err: any) {
      logger.error('��ӷ���ʧ��:', err);
      error(res, err.message || '��ӷ���ʧ��', 400);
    }
  }

  /**
   * ���·���
   * PUT /api/v1/admin/categories/:categoryId
   */
  async updateCategory(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      const { category_name, category_code, parent_id, icon, sort_order, is_hot, is_recommend } = req.body;

      if (!categoryId) {
        error(res, '����ID����Ϊ��', 400);
        return;
      }

      // ������������
      const updateData: any = {};
      if (category_name !== undefined) updateData.categoryName = category_name;
      if (category_code !== undefined) updateData.categoryCode = category_code;
      if (parent_id !== undefined) updateData.parentId = parent_id;
      if (icon !== undefined) updateData.icon = icon;
      if (sort_order !== undefined) updateData.sortOrder = sort_order;
      if (is_hot !== undefined) updateData.isHot = is_hot;
      if (is_recommend !== undefined) updateData.isRecommend = is_recommend;

      // ���÷������·���
      const category = await categoryService.updateCategory(categoryId, updateData);

      success(res, category, '���·���ɹ�');
    } catch (err: any) {
      logger.error('���·���ʧ��:', err);
      error(res, err.message || '���·���ʧ��', 400);
    }
  }

  /**
   * ɾ������
   * DELETE /api/v1/admin/categories/:categoryId
   */
  async deleteCategory(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;

      if (!categoryId) {
        error(res, '����ID����Ϊ��', 400);
        return;
      }

      // ���÷����ɾ������
      await categoryService.deleteCategory(categoryId);

      success(res, null, 'ɾ������ɹ�');
    } catch (err: any) {
      logger.error('ɾ������ʧ��:', err);
      error(res, err.message || 'ɾ������ʧ��', 400);
    }
  }

  /**
   * �������·�������
   * PUT /api/v1/admin/categories/sort
   */
  async updateCategoriesSort(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { sort_data } = req.body;

      // ������֤
      if (!sort_data || !Array.isArray(sort_data)) {
        error(res, '�������ݸ�ʽ����', 400);
        return;
      }

      // ת��Ϊ�������Ҫ�ĸ�ʽ
      const sortData = sort_data.map((item: any) => ({
        categoryId: item.category_id,
        sortOrder: item.sort_order,
      }));

      // ���÷�����������
      await categoryService.updateCategoriesSort(sortData);

      success(res, null, '���·�������ɹ�');
    } catch (err: any) {
      logger.error('���·�������ʧ��:', err);
      error(res, err.message || '���·�������ʧ��', 400);
    }
  }
}

export const categoryController = new CategoryController();
export default categoryController;
