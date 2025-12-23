/**
 * 审核控制器
 * 处理内容审核相关的HTTP请求
 */
import { Request, Response } from 'express';
import { success, error } from '@/utils/response.js';
import { logger } from '@/utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 审核控制器类
 */
class AuditController {
  /**
   * 获取待审核资源列表
   * GET /api/v1/admin/audit/resources
   */
  async getPendingResources(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const skip = (page - 1) * pageSize;

      const [resources, total] = await Promise.all([
        prisma.resources.findMany({
          where: {
            audit_status: 0,
          },
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
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          skip,
          take: pageSize,
        }),
        prisma.resources.count({
          where: {
            audit_status: 0,
          },
        }),
      ]);

      const list = resources.map(r => ({
        ...r,
        // 将BigInt转换为Number以支持JSON序列化
        file_size: r.file_size ? Number(r.file_size) : 0,
        user: r.users_resources_user_idTousers,
        category: r.categories,
      }));

      success(res, {
        list,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (err: any) {
      logger.error('获取待审核资源列表失败:', err);
      error(res, '获取待审核资源列表失败', 500);
    }
  }

  /**
   * 审核资源
   * POST /api/v1/admin/audit/resources/:resourceId
   */
  async auditResource(req: Request, res: Response): Promise<void> {
    try {
      const { resourceId } = req.params;
      const { action, reason } = req.body;
      const auditorId = req.user?.userId;

      if (!action || !['approve', 'reject'].includes(action)) {
        error(res, '审核操作无效，必须是 approve 或 reject', 400);
        return;
      }

      if (action === 'reject' && !reason) {
        error(res, '驳回时必须提供驳回原因', 400);
        return;
      }

      const resource = await prisma.resources.findUnique({
        where: { resource_id: resourceId },
      });

      if (!resource) {
        error(res, '资源不存在', 404);
        return;
      }

      if (resource.audit_status !== 0) {
        error(res, '该资源已审核，无法重复审核', 400);
        return;
      }

      const auditStatus = action === 'approve' ? 1 : 2;
      const now = new Date();

      await prisma.$transaction(async (tx) => {
        // 更新资源审核状态
        await tx.resources.update({
          where: { resource_id: resourceId },
          data: {
            audit_status: auditStatus,
            audit_msg: action === 'reject' ? reason : null,
            auditor_id: auditorId,
            audited_at: now,
          },
        });

        // 记录审核日志
        await tx.audit_logs.create({
          data: {
            resource_id: resourceId,
            auditor_id: auditorId,
            action,
            reason: action === 'reject' ? reason : null,
          },
        });

        // 如果审核通过，奖励上传者积分
        if (action === 'approve' && resource.user_id) {
          const user = await tx.users.findUnique({
            where: { user_id: resource.user_id },
            select: { points_balance: true, points_total: true },
          });

          if (user) {
            const pointsReward = 50;
            const newBalance = user.points_balance + pointsReward;

            await tx.users.update({
              where: { user_id: resource.user_id },
              data: {
                points_balance: newBalance,
                points_total: user.points_total + pointsReward,
              },
            });

            await tx.points_records.create({
              data: {
                user_id: resource.user_id,
                points_change: pointsReward,
                points_balance: newBalance,
                change_type: 'earn',
                source: 'upload_approved',
                source_id: resourceId,
                description: `作品《${resource.title}》审核通过，奖励${pointsReward}积分`,
              },
            });
          }
        }
      });

      success(
        res,
        null,
        action === 'approve' ? '审核通过成功' : '审核驳回成功'
      );
    } catch (err: any) {
      logger.error('审核资源失败:', err);
      error(res, '审核资源失败', 500);
    }
  }
}

export const auditController = new AuditController();
