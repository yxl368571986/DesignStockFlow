/**
 * 公共内容服务
 * 提供前端首页、搜索等公共内容数据
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取热门搜索关键词
 */
export async function getHotSearchKeywords(limit: number = 10): Promise<string[]> {
  try {
    const resources = await prisma.resources.findMany({
      where: {
        status: 1,
        audit_status: 1,
      },
      select: {
        tags: true,
      },
      orderBy: {
        download_count: 'desc',
      },
      take: 100,
    });

    const tagCount: Record<string, number> = {};
    resources.forEach((resource) => {
      resource.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    const sortedTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);

    if (sortedTags.length < limit) {
      const defaultKeywords = [
        'UI设计', 'Logo', '海报', '名片', '插画',
        '图标', '背景', '模板', '素材', '矢量'
      ];
      for (const keyword of defaultKeywords) {
        if (!sortedTags.includes(keyword) && sortedTags.length < limit) {
          sortedTags.push(keyword);
        }
      }
    }

    return sortedTags;
  } catch (error) {
    console.error('获取热门搜索关键词失败:', error);
    return ['UI设计', 'Logo', '海报', '名片', '插画', '图标', '背景', '模板', '素材', '矢量'].slice(0, limit);
  }
}

/**
 * 获取搜索联想词
 */
export async function getSearchSuggestions(keyword: string, limit: number = 10): Promise<string[]> {
  try {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    const resources = await prisma.resources.findMany({
      where: {
        status: 1,
        audit_status: 1,
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { tags: { has: keyword } },
        ],
      },
      select: {
        title: true,
        tags: true,
      },
      take: 50,
    });

    const suggestions = new Set<string>();

    resources.forEach((resource) => {
      resource.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(keyword.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('获取搜索联想词失败:', error);
    return [];
  }
}

/**
 * 获取公开的轮播图列表
 */
export async function getPublicBanners() {
  try {
    const now = new Date();
    const banners = await prisma.banners.findMany({
      where: {
        status: 1,
        OR: [
          { start_time: null, end_time: null },
          { start_time: { lte: now }, end_time: null },
          { start_time: null, end_time: { gte: now } },
          { start_time: { lte: now }, end_time: { gte: now } },
        ],
      },
      orderBy: {
        sort_order: 'asc',
      },
    });

    return banners.map((banner) => ({
      bannerId: banner.banner_id,
      title: banner.title,
      imageUrl: banner.image_url,
      linkUrl: banner.link_url,
      linkType: banner.link_type,
      sort: banner.sort_order,
      status: banner.status,
      startTime: banner.start_time,
      endTime: banner.end_time,
    }));
  } catch (error) {
    console.error('获取轮播图失败:', error);
    return [];
  }
}

/**
 * 获取公开的分类列表
 * 实时计算每个分类下已审核通过且状态正常的资源数量
 */
export async function getPublicCategories(parentId?: string) {
  try {
    const where: { parent_id: string | null } = parentId 
      ? { parent_id: parentId }
      : { parent_id: null };

    const categories = await prisma.categories.findMany({
      where,
      orderBy: {
        sort_order: 'asc',
      },
      include: {
        other_categories: {
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    });

    // 获取所有分类ID（包括子分类）
    const allCategoryIds = categories.flatMap((cat) => [
      cat.category_id,
      ...cat.other_categories.map((child) => child.category_id),
    ]);

    // 实时计算每个分类的资源数量（只统计已审核通过且状态正常的资源）
    const resourceCounts = await prisma.resources.groupBy({
      by: ['category_id'],
      where: {
        category_id: { in: allCategoryIds },
        audit_status: 1, // 已审核通过
        status: 1, // 状态正常
      },
      _count: {
        resource_id: true,
      },
    });

    // 创建分类ID到资源数量的映射
    const countMap = new Map<string, number>();
    resourceCounts.forEach((item) => {
      if (item.category_id) {
        countMap.set(item.category_id, item._count.resource_id);
      }
    });

    return categories.map((cat) => ({
      categoryId: cat.category_id,
      categoryName: cat.category_name,
      code: cat.category_code,
      parentId: cat.parent_id,
      icon: cat.icon,
      sort: cat.sort_order,
      isHot: cat.is_hot,
      isRecommend: cat.is_recommend,
      resourceCount: countMap.get(cat.category_id) || 0,
      children: cat.other_categories.map((child) => ({
        categoryId: child.category_id,
        categoryName: child.category_name,
        code: child.category_code,
        parentId: child.parent_id,
        icon: child.icon,
        sort: child.sort_order,
        isHot: child.is_hot,
        isRecommend: child.is_recommend,
        resourceCount: countMap.get(child.category_id) || 0,
      })),
    }));
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return [];
  }
}

/**
 * 获取分类树
 */
export async function getCategoryTree() {
  return getPublicCategories();
}

/**
 * 获取公开的公告列表
 */
export async function getPublicAnnouncements(level?: string) {
  try {
    const now = new Date();
    
    interface WhereCondition {
      status: number;
      type?: string;
      OR: Array<{
        start_time?: { lte?: Date } | null;
        end_time?: { gte?: Date } | null;
      }>;
    }
    
    const where: WhereCondition = {
      status: 1,
      OR: [
        { start_time: null, end_time: null },
        { start_time: { lte: now }, end_time: null },
        { start_time: null, end_time: { gte: now } },
        { start_time: { lte: now }, end_time: { gte: now } },
      ],
    };

    if (level) {
      where.type = level;
    }

    const announcements = await prisma.announcements.findMany({
      where,
      orderBy: [
        { is_top: 'desc' },
        { created_at: 'desc' },
      ],
      take: 20,
    });

    return announcements.map((ann) => ({
      announcementId: ann.announcement_id,
      title: ann.title,
      content: ann.content,
      type: ann.type as 'normal' | 'warning' | 'important',
      level: ann.type as 'normal' | 'warning' | 'important',  // 修复：level应该与type一致
      linkUrl: ann.link_url,
      isTop: ann.is_top,
      status: ann.status,
      createTime: ann.created_at.toISOString(),
    }));
  } catch (error) {
    console.error('获取公告列表失败:', error);
    return [];
  }
}

/**
 * 获取网站配置
 */
export async function getSiteConfig() {
  try {
    const configs = await prisma.system_config.findMany({
      where: {
        config_key: {
          in: ['site_name', 'site_logo', 'site_description', 'site_keywords', 'site_icp', 'site_copyright'],
        },
      },
    });

    const configMap: Record<string, string> = {};
    configs.forEach((config) => {
      configMap[config.config_key] = config.config_value;
    });

    return {
      siteName: configMap['site_name'] || '星潮设计资源平台',
      siteLogo: configMap['site_logo'] || '/logo.png',
      siteDescription: configMap['site_description'] || '专业的设计资源分享平台',
      siteKeywords: configMap['site_keywords'] || '设计资源,UI设计,素材下载',
      siteIcp: configMap['site_icp'] || '',
      siteCopyright: configMap['site_copyright'] || '© 2024 星潮设计',
    };
  } catch (error) {
    console.error('获取网站配置失败:', error);
    return {
      siteName: '星潮设计资源平台',
      siteLogo: '/logo.png',
      siteDescription: '专业的设计资源分享平台',
      siteKeywords: '设计资源,UI设计,素材下载',
      siteIcp: '',
      siteCopyright: '© 2024 星潮设计',
    };
  }
}

export const contentService = {
  getHotSearchKeywords,
  getSearchSuggestions,
  getPublicBanners,
  getPublicCategories,
  getCategoryTree,
  getPublicAnnouncements,
  getSiteConfig,
};
