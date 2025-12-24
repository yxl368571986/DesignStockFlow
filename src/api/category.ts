/**
 * 分类管理API接口
 */
import request from '@/utils/request';

/**
 * 分类数据类型
 */
export interface Category {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  parentId: string | null;
  icon: string | null;
  sortOrder: number;
  isHot: boolean;
  isRecommend: boolean;
  resourceCount: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建分类参数
 */
export interface CreateCategoryParams {
  categoryName: string;
  categoryCode: string;
  parentId?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isHot?: boolean;
  isRecommend?: boolean;
}

/**
 * 更新分类参数
 */
export interface UpdateCategoryParams {
  categoryName?: string;
  categoryCode?: string;
  parentId?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isHot?: boolean;
  isRecommend?: boolean;
}

/**
 * 排序数据项
 */
export interface SortDataItem {
  categoryId: string;
  sortOrder: number;
}

/**
 * 获取分类树形列表
 */
export function getCategoryTree() {
  return request<Category[]>({
    url: '/admin/categories',
    method: 'GET'
  });
}

/**
 * 创建分类
 */
export function createCategory(data: CreateCategoryParams) {
  return request<Category>({
    url: '/admin/categories',
    method: 'POST',
    data
  });
}

/**
 * 更新分类
 */
export function updateCategory(categoryId: string, data: UpdateCategoryParams) {
  return request<Category>({
    url: `/admin/categories/${categoryId}`,
    method: 'PUT',
    data
  });
}

/**
 * 删除分类
 */
export function deleteCategory(categoryId: string) {
  return request<null>({
    url: `/admin/categories/${categoryId}`,
    method: 'DELETE'
  });
}

/**
 * 批量更新分类排序
 */
export function updateCategoriesSort(sortData: SortDataItem[]) {
  return request<null>({
    url: '/admin/categories/sort',
    method: 'PUT',
    data: { sortData }
  });
}
