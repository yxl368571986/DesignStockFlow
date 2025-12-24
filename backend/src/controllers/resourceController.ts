/**
 * 资源控制器
 * 处理资源相关的HTTP请求
 */
import { Request, Response } from 'express';
import { resourceService } from '@/services/resourceService.js';
import { success, error, page } from '@/utils/response.js';
import { logger } from '@/utils/logger.js';

class ResourceController {
  /**
   * 获取资源列表
   * GET /api/v1/resources
   */
  async getResourceList(req: Request, res: Response): Promise<void> {
    try {
      const {
        pageNum,
        page_num,
        pageSize,
        page_size,
        categoryId,
        category_id,
        vipLevel,
        vip_level,
        keyword,
        sortBy,
        sort_by,
        format,
        file_format,
      } = req.query;

      // 兼容camelCase和snake_case参数
      const actualPageNum = pageNum || page_num || '1';
      const actualPageSize = pageSize || page_size || '20';
      const actualCategoryId = categoryId || category_id;
      const actualVipLevel = vipLevel || vip_level;
      const actualSortBy = sortBy || sort_by || 'comprehensive';
      const actualFormat = format || file_format;

      // 获取用户信息（如果已登录）
      const userId = req.user?.userId;
      const isVip = req.user ? (req.user as any).vipLevel > 0 : false;

      // 调用服务
      const parsedVipLevel = actualVipLevel !== undefined && actualVipLevel !== '' 
        ? parseInt(actualVipLevel as string, 10) 
        : undefined;
      
      const result = await resourceService.getResourceList({
        pageNum: parseInt(actualPageNum as string, 10),
        pageSize: parseInt(actualPageSize as string, 10),
        categoryId: actualCategoryId as string,
        vipLevel: parsedVipLevel,
        keyword: keyword as string,
        sortBy: actualSortBy as any,
        format: actualFormat as string,
        userId,
        isVip,
      });

      // 返回分页数据
      page(res, result.list, result.total, result.pageNum, result.pageSize, '获取资源列表成功');
    } catch (err: any) {
      logger.error('获取资源列表失败:', err);
      error(res, err.message || '获取资源列表失败', 500);
    }
  }

  /**
   * 上传资源
   * POST /api/v1/resources/upload
   */
  async uploadResource(req: Request, res: Response): Promise<void> {
    try {
      // 验证用户是否登录
      if (!req.user) {
        error(res, '请先登录', 401);
        return;
      }

      // 验证文件是否上传
      if (!req.file) {
        error(res, '请上传资源文件', 400);
        return;
      }

      // 获取表单数据
      const { title, description, categoryId, tags, vipLevel } = req.body;

      // 验证必填字段
      if (!title || !categoryId) {
        error(res, '标题和分类不能为空', 400);
        return;
      }

      // 解析tags（如果是字符串）
      let parsedTags: string[] = [];
      if (tags) {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      }

      // 获取预览图（如果有）
      const previewImages = (req.files as any)?.previewImages || [];

      // 调用服务
      const result = await resourceService.uploadResource({
        title,
        description,
        categoryId,
        tags: parsedTags,
        vipLevel: vipLevel ? parseInt(vipLevel, 10) : 0,
        userId: req.user.userId,
        file: req.file,
        previewImages,
      });

      success(res, result, '资源上传成功，等待审核');
    } catch (err: any) {
      logger.error('上传资源失败:', err);
      error(res, err.message || '上传资源失败', 500);
    }
  }

  /**
   * 获取资源详情
   * GET /api/v1/resources/:resourceId
   */
  async getResourceDetail(req: Request, res: Response): Promise<void> {
    try {
      const { resourceId } = req.params;

      if (!resourceId) {
        error(res, '资源ID不能为空', 400);
        return;
      }

      // 获取用户信息（如果已登录）
      const userId = req.user?.userId;
      const isVip = req.user ? (req.user as any).vipLevel > 0 : false;

      // 调用服务
      const detail = await resourceService.getResourceDetail(resourceId, userId, isVip);

      success(res, detail, '获取资源详情成功');
    } catch (err: any) {
      logger.error('获取资源详情失败:', err);
      error(res, err.message || '获取资源详情失败', 500);
    }
  }

  /**
   * 下载资源
   * POST /api/v1/resources/:resourceId/download
   */
  async downloadResource(req: Request, res: Response): Promise<void> {
    try {
      // 验证用户是否登录
      if (!req.user) {
        error(res, '请先登录', 401);
        return;
      }

      const { resourceId } = req.params;

      if (!resourceId) {
        error(res, '资源ID不能为空', 400);
        return;
      }

      // 获取用户VIP状态
      const isVip = (req.user as any).vipLevel > 0;

      // 调用服务
      const result = await resourceService.downloadResource(resourceId, req.user.userId, isVip);

      success(res, result, '下载成功');
    } catch (err: any) {
      logger.error('下载资源失败:', err);
      
      // 根据错误类型返回不同的错误码
      if (err.message.includes('积分不足')) {
        error(res, err.message, 400);
      } else if (err.message.includes('未通过审核') || err.message.includes('已下架')) {
        error(res, err.message, 403);
      } else {
        error(res, err.message || '下载失败', 500);
      }
    }
  }

  /**
   * 编辑资源
   * PUT /api/v1/resources/:resourceId
   */
  async updateResource(req: Request, res: Response): Promise<void> {
    try {
      // 验证用户是否登录
      if (!req.user) {
        error(res, '请先登录', 401);
        return;
      }

      const { resourceId } = req.params;

      if (!resourceId) {
        error(res, '资源ID不能为空', 400);
        return;
      }

      const { title, description, categoryId, tags } = req.body;

      // 检查是否为管理员
      const isAdmin = (req.user as any).roleCode === 'super_admin' || (req.user as any).roleCode === 'moderator';

      // 调用服务
      const result = await resourceService.updateResource(
        resourceId,
        req.user.userId,
        isAdmin,
        {
          title,
          description,
          categoryId,
          tags,
        }
      );

      success(res, result, '资源更新成功');
    } catch (err: any) {
      logger.error('编辑资源失败:', err);
      
      if (err.message.includes('无权编辑')) {
        error(res, err.message, 403);
      } else {
        error(res, err.message || '编辑资源失败', 500);
      }
    }
  }

  /**
   * 删除资源
   * DELETE /api/v1/resources/:resourceId
   */
  async deleteResource(req: Request, res: Response): Promise<void> {
    try {
      // 验证用户是否登录
      if (!req.user) {
        error(res, '请先登录', 401);
        return;
      }

      const { resourceId } = req.params;

      if (!resourceId) {
        error(res, '资源ID不能为空', 400);
        return;
      }

      // 检查是否为管理员
      const isAdmin = (req.user as any).roleCode === 'super_admin' || (req.user as any).roleCode === 'moderator';

      // 调用服务
      const result = await resourceService.deleteResource(resourceId, req.user.userId, isAdmin);

      success(res, result, '资源删除成功');
    } catch (err: any) {
      logger.error('删除资源失败:', err);
      
      if (err.message.includes('无权删除')) {
        error(res, err.message, 403);
      } else {
        error(res, err.message || '删除资源失败', 500);
      }
    }
  }
}

export const resourceController = new ResourceController();
export default resourceController;
