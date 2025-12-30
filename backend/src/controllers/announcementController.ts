import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取公告列表
 * GET /api/v1/admin/announcements
 */
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    const where: Prisma.announcementsWhereInput = {};
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

    // 转换为camelCase格式
    const formattedList = announcements.map(ann => ({
      announcementId: ann.announcement_id,
      title: ann.title,
      content: ann.content,
      type: ann.type,
      linkUrl: ann.link_url,
      isTop: ann.is_top,
      startTime: ann.start_time?.toISOString() || null,
      endTime: ann.end_time?.toISOString() || null,
      status: ann.status,
      createdAt: ann.created_at.toISOString(),
      updatedAt: ann.updated_at.toISOString()
    }));

    res.json({
      code: 200,
      message: '获取公告列表成功',
      data: {
        list: formattedList,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('获取公告列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取公告列表失败',
      error: errorMessage
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
      linkUrl,
      isTop = false,
      startTime,
      endTime,
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
        link_url: linkUrl,
        is_top: isTop,
        start_time: startTime ? new Date(startTime) : null,
        end_time: endTime ? new Date(endTime) : null,
        status
      }
    });

    // 转换为camelCase格式
    const formattedData = {
      announcementId: announcement.announcement_id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      linkUrl: announcement.link_url,
      isTop: announcement.is_top,
      startTime: announcement.start_time?.toISOString() || null,
      endTime: announcement.end_time?.toISOString() || null,
      status: announcement.status,
      createdAt: announcement.created_at.toISOString(),
      updatedAt: announcement.updated_at.toISOString()
    };

    res.json({
      code: 200,
      message: '添加公告成功',
      data: formattedData
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('添加公告失败:', error);
    res.status(500).json({
      code: 500,
      message: '添加公告失败',
      error: errorMessage
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
      linkUrl,
      isTop,
      startTime,
      endTime,
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

    const updateData: Prisma.announcementsUpdateInput = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (linkUrl !== undefined) updateData.link_url = linkUrl;
    if (isTop !== undefined) updateData.is_top = isTop;
    if (startTime !== undefined) updateData.start_time = startTime ? new Date(startTime) : null;
    if (endTime !== undefined) updateData.end_time = endTime ? new Date(endTime) : null;
    if (status !== undefined) updateData.status = status;

    const announcement = await prisma.announcements.update({
      where: { announcement_id: announcementId },
      data: updateData
    });

    // 转换为camelCase格式
    const formattedData = {
      announcementId: announcement.announcement_id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      linkUrl: announcement.link_url,
      isTop: announcement.is_top,
      startTime: announcement.start_time?.toISOString() || null,
      endTime: announcement.end_time?.toISOString() || null,
      status: announcement.status,
      createdAt: announcement.created_at.toISOString(),
      updatedAt: announcement.updated_at.toISOString()
    };

    res.json({
      code: 200,
      message: '编辑公告成功',
      data: formattedData
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('编辑公告失败:', error);
    res.status(500).json({
      code: 500,
      message: '编辑公告失败',
      error: errorMessage
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('删除公告失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除公告失败',
      error: errorMessage
    });
  }
};
