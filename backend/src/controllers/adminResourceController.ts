/**
 * ����Ա��Դ������
 * �������Ա��Դ������ص�HTTP����
 */
import { Request, Response, NextFunction } from 'express';
import { adminResourceService } from '@/services/adminResourceService.js';
import { success, error } from '@/utils/response.js';
import { logger } from '@/utils/logger.js';

export class AdminResourceController {
  /**
   * ��ȡ��Դ�б�(����Ա)
   * GET /api/v1/admin/resources
   */
  async getResourceList(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        page_size = 20,
        search,
        category_id,
        audit_status,
        vip_level,
        status,
      } = req.query;

      // ������֤
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(page_size as string) || 20));

      // ����ɸѡ����
      const filters: any = {};
      if (search) {
        filters.search = search as string;
      }
      if (category_id) {
        filters.categoryId = category_id as string;
      }
      if (audit_status !== undefined) {
        filters.auditStatus = parseInt(audit_status as string);
      }
      if (vip_level !== undefined) {
        filters.vipLevel = parseInt(vip_level as string);
      }
      if (status !== undefined) {
        filters.status = parseInt(status as string);
      }

      // ���÷�����ȡ��Դ�б�
      const result = await adminResourceService.getResourceList(pageNum, pageSize, filters);

      success(res, result, '��ȡ��Դ�б�ɹ�');
    } catch (err: any) {
      logger.error('��ȡ��Դ�б�ʧ��:', err);
      error(res, err.message || '��ȡ��Դ�б�ʧ��', 400);
    }
  }

  /**
   * �༭��Դ(����Ա)
   * PUT /api/v1/admin/resources/:resourceId
   */
  async updateResource(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { resourceId } = req.params;
      const { title, description, category_id, tags } = req.body;

      if (!resourceId) {
        error(res, '��ԴID����Ϊ��', 400);
        return;
      }

      // ��ȡ��������Ϣ
      const operatorId = req.user?.userId;
      if (!operatorId) {
        error(res, 'δ��֤�����ȵ�¼', 401);
        return;
      }

      // ���÷���������Դ
      await adminResourceService.updateResource(resourceId, {
        title,
        description,
        categoryId: category_id,
        tags,
      }, operatorId);

      success(res, null, '��Դ���³ɹ�');
    } catch (err: any) {
      logger.error('������Դʧ��:', err);
      error(res, err.message || '������Դʧ��', 400);
    }
  }

  /**
   * �¼���Դ
   * PUT /api/v1/admin/resources/:resourceId/offline
   */
  async offlineResource(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { resourceId } = req.params;
      const { reason } = req.body;

      if (!resourceId) {
        error(res, '��ԴID����Ϊ��', 400);
        return;
      }

      // ��ȡ��������Ϣ
      const operatorId = req.user?.userId;
      if (!operatorId) {
        error(res, 'δ��֤�����ȵ�¼', 401);
        return;
      }

      // ���÷�����¼���Դ
      await adminResourceService.offlineResource(resourceId, operatorId, reason);

      success(res, null, '��Դ���¼�');
    } catch (err: any) {
      logger.error('�¼���Դʧ��:', err);
      error(res, err.message || '�¼���Դʧ��', 400);
    }
  }

  /**
   * ɾ����Դ(����Ա)
   * DELETE /api/v1/admin/resources/:resourceId
   */
  async deleteResource(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { resourceId } = req.params;

      if (!resourceId) {
        error(res, '��ԴID����Ϊ��', 400);
        return;
      }

      // ��ȡ��������Ϣ
      const operatorId = req.user?.userId;
      if (!operatorId) {
        error(res, 'δ��֤�����ȵ�¼', 401);
        return;
      }

      // ���÷����ɾ����Դ
      await adminResourceService.deleteResource(resourceId, operatorId);

      success(res, null, '��Դ������ɾ��');
    } catch (err: any) {
      logger.error('ɾ����Դʧ��:', err);
      error(res, err.message || 'ɾ����Դʧ��', 400);
    }
  }

  /**
   * �ö���Դ
   * PUT /api/v1/admin/resources/:resourceId/top
   */
  async topResource(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { resourceId } = req.params;
      const { is_top } = req.body;

      if (!resourceId) {
        error(res, '��ԴID����Ϊ��', 400);
        return;
      }

      if (is_top === undefined) {
        error(res, '�ö�״̬����Ϊ��', 400);
        return;
      }

      // ��ȡ��������Ϣ
      const operatorId = req.user?.userId;
      if (!operatorId) {
        error(res, 'δ��֤�����ȵ�¼', 401);
        return;
      }

      // ���÷�����ö���Դ
      await adminResourceService.topResource(resourceId, is_top, operatorId);

      success(res, null, is_top ? '��Դ���ö�' : '��Դ��ȡ���ö�');
    } catch (err: any) {
      logger.error('�ö���Դʧ��:', err);
      error(res, err.message || '�ö���Դʧ��', 400);
    }
  }

  /**
   * �Ƽ���Դ
   * PUT /api/v1/admin/resources/:resourceId/recommend
   */
  async recommendResource(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { resourceId } = req.params;
      const { is_recommend } = req.body;

      if (!resourceId) {
        error(res, '��ԴID����Ϊ��', 400);
        return;
      }

      if (is_recommend === undefined) {
        error(res, '�Ƽ�״̬����Ϊ��', 400);
        return;
      }

      // ��ȡ��������Ϣ
      const operatorId = req.user?.userId;
      if (!operatorId) {
        error(res, 'δ��֤�����ȵ�¼', 401);
        return;
      }

      // ���÷�����Ƽ���Դ
      await adminResourceService.recommendResource(resourceId, is_recommend, operatorId);

      success(res, null, is_recommend ? '��Դ����ӵ��Ƽ�λ' : '��Դ�Ѵ��Ƽ�λ�Ƴ�');
    } catch (err: any) {
      logger.error('�Ƽ���Դʧ��:', err);
      error(res, err.message || '�Ƽ���Դʧ��', 400);
    }
  }
}

export const adminResourceController = new AdminResourceController();
export default adminResourceController;
