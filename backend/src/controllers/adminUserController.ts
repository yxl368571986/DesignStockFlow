/**
 * ����Ա�û�������
 */
import { Request, Response, NextFunction } from 'express';
import { adminUserService } from '@/services/adminUserService.js';
import { success, error } from '@/utils/response.js';
import { logger } from '@/utils/logger.js';

export class AdminUserController {
  /**
   * ��ȡ�û��б�
   * GET /api/v1/admin/users
   */
  async getUserList(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        page_size = 20,
        search,
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
      if (vip_level !== undefined) {
        filters.vipLevel = parseInt(vip_level as string);
      }
      if (status !== undefined) {
        filters.status = parseInt(status as string);
      }

      // ���÷�����ȡ�û��б�
      const result = await adminUserService.getUserList(pageNum, pageSize, filters);

      success(res, result, '��ȡ�û��б�ɹ�');
    } catch (err: any) {
      logger.error('��ȡ�û��б�ʧ��:', err);
      error(res, err.message || '��ȡ�û��б�ʧ��', 400);
    }
  }

  /**
   * ��ȡ�û�����
   * GET /api/v1/admin/users/:userId
   */
  async getUserDetail(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        error(res, '�û�ID����Ϊ��', 400);
        return;
      }

      // ���÷�����ȡ�û�����
      const userDetail = await adminUserService.getUserDetail(userId);

      success(res, userDetail, '��ȡ�û�����ɹ�');
    } catch (err: any) {
      logger.error('��ȡ�û�����ʧ��:', err);
      error(res, err.message || '��ȡ�û�����ʧ��', 400);
    }
  }

  /**
   * ����/�����û�
   * PUT /api/v1/admin/users/:userId/status
   */
  async updateUserStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { status, reason } = req.body;

      if (!userId) {
        error(res, '�û�ID����Ϊ��', 400);
        return;
      }

      if (status === undefined) {
        error(res, '״̬����Ϊ��', 400);
        return;
      }

      // ��ȡ��������Ϣ
      const operatorId = req.user?.userId;
      if (!operatorId) {
        error(res, 'δ��֤�����ȵ�¼', 401);
        return;
      }

      // ���÷��������û�״̬
      await adminUserService.updateUserStatus(userId, status, operatorId, reason);

      success(res, null, status === 1 ? '�û�������' : '�û��ѽ���');
    } catch (err: any) {
      logger.error('�����û�״̬ʧ��:', err);
      error(res, err.message || '�����û�״̬ʧ��', 400);
    }
  }

  /**
   * �����û�����
   * POST /api/v1/admin/users/:userId/reset-password
   */
  async resetPassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        error(res, '�û�ID����Ϊ��', 400);
        return;
      }

      // ��ȡ��������Ϣ
      const operatorId = req.user?.userId;
      if (!operatorId) {
        error(res, 'δ��֤�����ȵ�¼', 401);
        return;
      }

      // ���÷������������
      const tempPassword = await adminUserService.resetPassword(userId, operatorId);

      success(res, { tempPassword }, '�������óɹ�����ʱ����������');
    } catch (err: any) {
      logger.error('��������ʧ��:', err);
      error(res, err.message || '��������ʧ��', 400);
    }
  }

  /**
   * �����û�VIP
   * PUT /api/v1/admin/users/:userId/vip
   */
  async adjustVip(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { vip_level, vip_expire_at, reason } = req.body;

      if (!userId) {
        error(res, '�û�ID����Ϊ��', 400);
        return;
      }

      if (vip_level === undefined) {
        error(res, 'VIP�ȼ�����Ϊ��', 400);
        return;
      }

      // ��ȡ��������Ϣ
      const operatorId = req.user?.userId;
      if (!operatorId) {
        error(res, 'δ��֤�����ȵ�¼', 401);
        return;
      }

      // ���÷�������VIP
      await adminUserService.adjustVip(
        userId,
        vip_level,
        vip_expire_at ? new Date(vip_expire_at) : null,
        operatorId,
        reason
      );

      success(res, null, 'VIP�����ɹ�');
    } catch (err: any) {
      logger.error('����VIPʧ��:', err);
      error(res, err.message || '����VIPʧ��', 400);
    }
  }

  /**
   * �����û�����
   * POST /api/v1/admin/users/:userId/points/adjust
   */
  async adjustPoints(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { points_change, reason } = req.body;

      if (!userId) {
        error(res, '�û�ID����Ϊ��', 400);
        return;
      }

      if (points_change === undefined || points_change === 0) {
        error(res, '���ֱ䶯ֵ����Ϊ�ջ�Ϊ0', 400);
        return;
      }

      if (!reason || reason.trim() === '') {
        error(res, '����ԭ����Ϊ��', 400);
        return;
      }

      // ��ȡ��������Ϣ
      const operatorId = req.user?.userId;
      if (!operatorId) {
        error(res, 'δ��֤�����ȵ�¼', 401);
        return;
      }

      // ���÷�����������
      await adminUserService.adjustPoints(userId, points_change, reason, operatorId);

      success(res, null, '���ֵ����ɹ�');
    } catch (err: any) {
      logger.error('��������ʧ��:', err);
      error(res, err.message || '��������ʧ��', 400);
    }
  }
}

export const adminUserController = new AdminUserController();
export default adminUserController;
