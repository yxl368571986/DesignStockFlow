/**
 * Mock数据
 * 用于开发环境模拟后端数据
 */

import type {
  BannerInfo,
  CategoryInfo,
  AnnouncementInfo,
  ResourceInfo,
  SiteConfig
} from '@/types/models';

// 使用SVG Data URI作为占位图片，避免外部请求
const createPlaceholderImage = (width: number, height: number, text: string, bgColor: string = '4A90E2') => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect fill='%23${bgColor}' width='${width}' height='${height}'/%3E%3Ctext fill='%23ffffff' font-family='Arial' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
};

/**
 * 网站配置Mock数据
 */
export const mockSiteConfig: SiteConfig = {
  siteName: '星潮设计',
  siteDescription: '专业的设计资源分享平台',
  logoUrl: createPlaceholderImage(200, 60, 'StarTide Design', '165DFF'),
  faviconUrl: createPlaceholderImage(32, 32, 'ST', '165DFF'),
  copyright: '© 2024 星潮设计. All rights reserved.',
  icp: '京ICP备12345678号',
  seoTitle: '星潮设计 - 专业设计资源分享平台',
  seoKeywords: '设计资源,UI设计,平面设计,素材下载',
  seoDescription: '星潮设计提供海量优质设计资源，包括PSD、AI、CDR等格式文件，助力设计师高效创作',
  watermarkText: '星潮设计',
  watermarkOpacity: 0.6
};

/**
 * 轮播图Mock数据
 * 注意：当前配置为测试模式，所有轮播图都跳转到测试页面
 * 生产环境中，后台管理系统会配置真实的跳转URL
 */
export const mockBanners: BannerInfo[] = [
  {
    bannerId: '1',
    title: '精选UI设计资源 - 点击测试跳转',
    imageUrl: createPlaceholderImage(1200, 400, 'Click to Test Jump', '4A90E2'),
    linkType: 'internal',
    linkUrl: '/test/banner',
    sort: 1,
    status: 1,
    startTime: '2024-01-01T00:00:00',
    endTime: '2025-12-31T23:59:59'
  },
  {
    bannerId: '2',
    title: '海报模板免费下载 - 点击测试跳转',
    imageUrl: createPlaceholderImage(1200, 400, 'Click to Test Jump', 'E74C3C'),
    linkType: 'internal',
    linkUrl: '/test/banner',
    sort: 2,
    status: 1,
    startTime: '2024-01-01T00:00:00',
    endTime: '2025-12-31T23:59:59'
  },
  {
    bannerId: '3',
    title: 'Logo设计灵感 - 点击测试跳转',
    imageUrl: createPlaceholderImage(1200, 400, 'Click to Test Jump', '27AE60'),
    linkType: 'internal',
    linkUrl: '/test/banner',
    sort: 3,
    status: 1,
    startTime: '2024-01-01T00:00:00',
    endTime: '2025-12-31T23:59:59'
  }
];

/**
 * 分类Mock数据
 */
export const mockCategories: CategoryInfo[] = [
  {
    categoryId: 'ui-design',
    categoryName: 'UI设计',
    parentId: null,
    icon: 'Monitor',
    sort: 1,
    isHot: true,
    isRecommend: true,
    resourceCount: 1250
  },
  {
    categoryId: 'poster',
    categoryName: '海报模板',
    parentId: null,
    icon: 'Picture',
    sort: 2,
    isHot: true,
    isRecommend: true,
    resourceCount: 890
  },
  {
    categoryId: 'logo',
    categoryName: 'Logo设计',
    parentId: null,
    icon: 'Star',
    sort: 3,
    isHot: true,
    isRecommend: false,
    resourceCount: 650
  },
  {
    categoryId: 'icon',
    categoryName: '图标素材',
    parentId: null,
    icon: 'Grid',
    sort: 4,
    isHot: false,
    isRecommend: true,
    resourceCount: 2100
  },
  {
    categoryId: 'illustration',
    categoryName: '插画素材',
    parentId: null,
    icon: 'Brush',
    sort: 5,
    isHot: false,
    isRecommend: false,
    resourceCount: 780
  }
];

/**
 * 公告Mock数据
 */
export const mockAnnouncements: AnnouncementInfo[] = [
  {
    announcementId: '1',
    title: '欢迎来到星潮设计资源平台',
    content: '我们提供海量优质设计资源，助力您的创作之路',
    type: 'important',
    level: 'important',
    isTop: true,
    status: 1,
    linkUrl: '',
    createTime: '2024-12-20T00:00:00'
  },
  {
    announcementId: '2',
    title: '新增1000+UI设计资源',
    content: '本周新增大量UI设计资源，快来下载吧',
    type: 'normal',
    level: 'normal',
    isTop: false,
    status: 1,
    linkUrl: '/resource?category=ui-design',
    createTime: '2024-12-19T00:00:00'
  }
];

/**
 * 资源Mock数据
 */
export const mockResources: ResourceInfo[] = [
  {
    resourceId: '1',
    title: '现代简约UI设计套件',
    description: '包含100+精美UI组件，适用于移动端和Web端设计',
    cover: createPlaceholderImage(400, 300, 'UI Kit', '4A90E2'),
    coverUrl: createPlaceholderImage(400, 300, 'UI Kit', '4A90E2'),
    previewImages: [createPlaceholderImage(800, 600, 'Preview 1', '4A90E2')],
    format: 'SKETCH',
    fileFormat: 'SKETCH',
    fileSize: 52428800, // 50MB
    fileUrl: '/downloads/ui-kit-1.zip',
    downloadCount: 1250,
    collectCount: 380,
    viewCount: 5600,
    vipLevel: 0,
    categoryId: 'ui-design',
    categoryName: 'UI设计',
    tags: ['UI', '组件', '移动端', 'Web'],
    uploaderId: 'user-1',
    uploaderName: '设计师小王',
    isAudit: 1,
    createTime: '2024-12-15T10:00:00',
    updateTime: '2024-12-15T10:00:00'
  },
  {
    resourceId: '2',
    title: '商业海报设计模板',
    description: '10款精美商业海报模板，可编辑PSD源文件',
    cover: createPlaceholderImage(400, 300, 'Poster', 'E74C3C'),
    coverUrl: createPlaceholderImage(400, 300, 'Poster', 'E74C3C'),
    previewImages: [createPlaceholderImage(800, 600, 'Preview 1', 'E74C3C')],
    format: 'PSD',
    fileFormat: 'PSD',
    fileSize: 104857600, // 100MB
    fileUrl: '/downloads/poster-template-1.zip',
    downloadCount: 890,
    collectCount: 260,
    viewCount: 3200,
    vipLevel: 1,
    categoryId: 'poster',
    categoryName: '海报模板',
    tags: ['海报', '商业', '模板'],
    uploaderId: 'user-2',
    uploaderName: '设计师小李',
    isAudit: 1,
    createTime: '2024-12-14T14:30:00',
    updateTime: '2024-12-14T14:30:00'
  },
  {
    resourceId: '3',
    title: '创意Logo设计合集',
    description: '50个创意Logo设计案例，AI格式可编辑',
    cover: createPlaceholderImage(400, 300, 'Logo', '27AE60'),
    coverUrl: createPlaceholderImage(400, 300, 'Logo', '27AE60'),
    previewImages: [createPlaceholderImage(800, 600, 'Preview 1', '27AE60')],
    format: 'AI',
    fileFormat: 'AI',
    fileSize: 31457280, // 30MB
    fileUrl: '/downloads/logo-collection-1.zip',
    downloadCount: 650,
    collectCount: 195,
    viewCount: 2800,
    vipLevel: 0,
    categoryId: 'logo',
    categoryName: 'Logo设计',
    tags: ['Logo', '创意', '品牌'],
    uploaderId: 'user-3',
    uploaderName: '设计师小张',
    isAudit: 1,
    createTime: '2024-12-13T09:15:00',
    updateTime: '2024-12-13T09:15:00'
  },
  {
    resourceId: '4',
    title: '扁平化图标库',
    description: '500+扁平化图标，SVG格式，支持自定义颜色',
    cover: createPlaceholderImage(400, 300, 'Icons', '9B59B6'),
    coverUrl: createPlaceholderImage(400, 300, 'Icons', '9B59B6'),
    previewImages: [createPlaceholderImage(800, 600, 'Preview 1', '9B59B6')],
    format: 'SVG',
    fileFormat: 'SVG',
    fileSize: 10485760, // 10MB
    fileUrl: '/downloads/icon-library-1.zip',
    downloadCount: 2100,
    collectCount: 580,
    viewCount: 8900,
    vipLevel: 0,
    categoryId: 'icon',
    categoryName: '图标素材',
    tags: ['图标', '扁平化', 'SVG'],
    uploaderId: 'user-4',
    uploaderName: '设计师小赵',
    isAudit: 1,
    createTime: '2024-12-12T16:45:00',
    updateTime: '2024-12-12T16:45:00'
  },
  {
    resourceId: '5',
    title: '手绘插画素材包',
    description: '30个精美手绘插画，适用于各类设计场景',
    cover: createPlaceholderImage(400, 300, 'Illustration', 'F39C12'),
    coverUrl: createPlaceholderImage(400, 300, 'Illustration', 'F39C12'),
    previewImages: [createPlaceholderImage(800, 600, 'Preview 1', 'F39C12')],
    format: 'AI',
    fileFormat: 'AI',
    fileSize: 73400320, // 70MB
    fileUrl: '/downloads/illustration-pack-1.zip',
    downloadCount: 780,
    collectCount: 240,
    viewCount: 3500,
    vipLevel: 1,
    categoryId: 'illustration',
    categoryName: '插画素材',
    tags: ['插画', '手绘', '素材'],
    uploaderId: 'user-5',
    uploaderName: '设计师小孙',
    isAudit: 1,
    createTime: '2024-12-11T11:20:00',
    updateTime: '2024-12-11T11:20:00'
  },
  {
    resourceId: '6',
    title: '移动应用UI界面设计',
    description: '完整的移动应用UI设计方案，包含20+页面',
    cover: createPlaceholderImage(400, 300, 'Mobile UI', '1ABC9C'),
    coverUrl: createPlaceholderImage(400, 300, 'Mobile UI', '1ABC9C'),
    previewImages: [createPlaceholderImage(800, 600, 'Preview 1', '1ABC9C')],
    format: 'FIGMA',
    fileFormat: 'FIGMA',
    fileSize: 41943040, // 40MB
    fileUrl: '/downloads/mobile-ui-1.zip',
    downloadCount: 1100,
    collectCount: 320,
    viewCount: 4800,
    vipLevel: 0,
    categoryId: 'ui-design',
    categoryName: 'UI设计',
    tags: ['移动端', 'UI', 'App'],
    uploaderId: 'user-6',
    uploaderName: '设计师小周',
    isAudit: 1,
    createTime: '2024-12-10T13:00:00',
    updateTime: '2024-12-10T13:00:00'
  },
  {
    resourceId: '7',
    title: '节日促销海报模板',
    description: '适用于各类节日促销活动的海报模板',
    cover: createPlaceholderImage(400, 300, 'Festival', 'E67E22'),
    coverUrl: createPlaceholderImage(400, 300, 'Festival', 'E67E22'),
    previewImages: [createPlaceholderImage(800, 600, 'Preview 1', 'E67E22')],
    format: 'PSD',
    fileFormat: 'PSD',
    fileSize: 125829120, // 120MB
    fileUrl: '/downloads/festival-poster-1.zip',
    downloadCount: 560,
    collectCount: 170,
    viewCount: 2400,
    vipLevel: 1,
    categoryId: 'poster',
    categoryName: '海报模板',
    tags: ['海报', '节日', '促销'],
    uploaderId: 'user-7',
    uploaderName: '设计师小吴',
    isAudit: 1,
    createTime: '2024-12-09T15:30:00',
    updateTime: '2024-12-09T15:30:00'
  },
  {
    resourceId: '8',
    title: '极简Logo设计模板',
    description: '20款极简风格Logo设计模板',
    cover: createPlaceholderImage(400, 300, 'Minimal', '34495E'),
    coverUrl: createPlaceholderImage(400, 300, 'Minimal', '34495E'),
    previewImages: [createPlaceholderImage(800, 600, 'Preview 1', '34495E')],
    format: 'AI',
    fileFormat: 'AI',
    fileSize: 20971520, // 20MB
    fileUrl: '/downloads/minimal-logo-1.zip',
    downloadCount: 420,
    collectCount: 130,
    viewCount: 1900,
    vipLevel: 0,
    categoryId: 'logo',
    categoryName: 'Logo设计',
    tags: ['Logo', '极简', '模板'],
    uploaderId: 'user-8',
    uploaderName: '设计师小郑',
    isAudit: 1,
    createTime: '2024-12-08T10:45:00',
    updateTime: '2024-12-08T10:45:00'
  }
];
