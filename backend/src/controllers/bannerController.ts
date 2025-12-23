import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取轮播图列表
 * GET /api/v1/admin/banners
 */
export const getBanners = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status !== undefined) {
      where.status = parseInt(status as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [banners, total] = await Promise.all([
      prisma.banners.findMany({
        where,
        orderBy: [
          { sort_order: 'asc' },
          { created_at: 'desc' }
        ],
        skip,
        take
      }),
      prisma.banners.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取轮播图列表成功',
      data: {
        list: banners,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (error: any) {
    console.error('获取轮播图列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取轮播图列表失败',
      error: error.message
    });
  }
};

/**
 * 添加轮播图
 * POST /api/v1/admin/banners
 */
export const createBanner = async (req: Request, res: Response) => {
  try {
    const {
      title,
      image_url,
      link_url,
      link_type,
      sort_order = 0,
      start_time,
      end_time,
      status = 1
    } = req.body;

    // 验证必填字段
    if (!title || !image_url) {
      return res.status(400).json({
        code: 400,
        message: '标题和图片URL为必填项'
      });
    }

    const banner = await prisma.banners.create({
      data: {
        title,
        image_url,
        link_url,
        link_type,
        sort_order,
        start_time: start_time ? new Date(start_time) : null,
        end_time: end_time ? new Date(end_time) : null,
        status
      }
    });

    res.json({
      code: 200,
      message: '添加轮播图成功',
      data: banner
    });
  } catch (error: any) {
    console.error('添加轮播图失败:', error);
    res.status(500).json({
      code: 500,
      message: '添加轮播图失败',
      error: error.message
    });
  }
};

/**
 * 编辑轮播图
 * PUT /api/v1/admin/banners/:bannerId
 */
export const updateBanner = async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.params;
    const {
      title,
      image_url,
      link_url,
      link_type,
      sort_order,
      start_time,
      end_time,
      status
    } = req.body;

    // 检查轮播图是否存在
    const existingBanner = await prisma.banners.findUnique({
      where: { banner_id: bannerId }
    });

    if (!existingBanner) {
      return res.status(404).json({
        code: 404,
        message: '轮播图不存在'
      });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (link_url !== undefined) updateData.link_url = link_url;
    if (link_type !== undefined) updateData.link_type = link_type;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (start_time !== undefined) updateData.start_time = start_time ? new Date(start_time) : null;
    if (end_time !== undefined) updateData.end_time = end_time ? new Date(end_time) : null;
    if (status !== undefined) updateData.status = status;

    const banner = await prisma.banners.update({
      where: { banner_id: bannerId },
      data: updateData
    });

    res.json({
      code: 200,
      message: '编辑轮播图成功',
      data: banner
    });
  } catch (error: any) {
    console.error('编辑轮播图失败:', error);
    res.status(500).json({
      code: 500,
      message: '编辑轮播图失败',
      error: error.message
    });
  }
};

/**
 * 删除轮播图
 * DELETE /api/v1/admin/banners/:bannerId
 */
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.params;

    // 检查轮播图是否存在
    const existingBanner = await prisma.banners.findUnique({
      where: { banner_id: bannerId }
    });

    if (!existingBanner) {
      return res.status(404).json({
        code: 404,
        message: '轮播图不存在'
      });
    }

    await prisma.banners.delete({
      where: { banner_id: bannerId }
    });

    res.json({
      code: 200,
      message: '删除轮播图成功'
    });
  } catch (error: any) {
    console.error('删除轮播图失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除轮播图失败',
      error: error.message
    });
  }
};
