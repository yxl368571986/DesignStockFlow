import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取公告列表
 * GET /api/v1/admin/announcements
 */
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status !== undefined) {
      where.status = parseInt(status as string);
    }
    if (type) {
      where.type = type as string;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [announcements, total] = await Promise.all([
      prisma.announcements.findMany({
        where,
        orderBy: [
          { is_top: 'desc' },
          { created_at: 'desc' }
        ],
        skip,
        take
      }),
      prisma.announcements.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取公告列表成功',
      data: {
        list: announcements,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (error: any) {
    console.error('获取公告列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取公告列表失败',
      error: error.message
    });
  }
};

/**
 * 添加公告
 * POST /api/v1/admin/announcements
 */
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      type = 'normal',
      link_url,
      is_top = false,
      start_time,
      end_time,
      status = 1
    } = req.body;

    // 验证必填字段
    if (!title || !content) {
      return res.status(400).json({
        code: 400,
        message: '标题和内容为必填项'
      });
    }

    // 验证公告类型
    const validTypes = ['normal', 'important', 'warning'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        code: 400,
        message: '公告类型必须是 normal、important 或 warning'
      });
    }

    const announcement = await prisma.announcements.create({
      data: {
        title,
        content,
        type,
        link_url,
        is_top,
        start_time: start_time ? new Date(start_time) : null,
        end_time: end_time ? new Date(end_time) : null,
        status
      }
    });

    res.json({
      code: 200,
      message: '添加公告成功',
      data: announcement
    });
  } catch (error: any) {
    console.error('添加公告失败:', error);
    res.status(500).json({
      code: 500,
      message: '添加公告失败',
      error: error.message
    });
  }
};

/**
 * 编辑公告
 * PUT /api/v1/admin/announcements/:announcementId
 */
export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { announcementId } = req.params;
    const {
      title,
      content,
      type,
      link_url,
      is_top,
      start_time,
      end_time,
      status
    } = req.body;

    // 检查公告是否存在
    const existingAnnouncement = await prisma.announcements.findUnique({
      where: { announcement_id: announcementId }
    });

    if (!existingAnnouncement) {
      return res.status(404).json({
        code: 404,
        message: '公告不存在'
      });
    }

    // 验证公告类型
    if (type) {
      const validTypes = ['normal', 'important', 'warning'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          code: 400,
          message: '公告类型必须是 normal、important 或 warning'
        });
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (link_url !== undefined) updateData.link_url = link_url;
    if (is_top !== undefined) updateData.is_top = is_top;
    if (start_time !== undefined) updateData.start_time = start_time ? new Date(start_time) : null;
    if (end_time !== undefined) updateData.end_time = end_time ? new Date(end_time) : null;
    if (status !== undefined) updateData.status = status;

    const announcement = await prisma.announcements.update({
      where: { announcement_id: announcementId },
      data: updateData
    });

    res.json({
      code: 200,
      message: '编辑公告成功',
      data: announcement
    });
  } catch (error: any) {
    console.error('编辑公告失败:', error);
    res.status(500).json({
      code: 500,
      message: '编辑公告失败',
      error: error.message
    });
  }
};

/**
 * 删除公告
 * DELETE /api/v1/admin/announcements/:announcementId
 */
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { announcementId } = req.params;

    // 检查公告是否存在
    const existingAnnouncement = await prisma.announcements.findUnique({
      where: { announcement_id: announcementId }
    });

    if (!existingAnnouncement) {
      return res.status(404).json({
        code: 404,
        message: '公告不存在'
      });
    }

    await prisma.announcements.delete({
      where: { announcement_id: announcementId }
    });

    res.json({
      code: 200,
      message: '删除公告成功'
    });
  } catch (error: any) {
    console.error('删除公告失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除公告失败',
      error: error.message
    });
  }
};
