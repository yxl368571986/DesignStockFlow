/**
 * 数据模型类型定义
 */

// 用户信息
export interface UserInfo {
  userId: string;
  phone: string;
  nickname: string;
  avatar: string;
  email?: string;
  vipLevel: number; // 0-普通用户, 1-月度VIP, 2-季度VIP, 3-年度VIP
  vipExpireTime?: string;
  pointsBalance?: number; // 积分余额
  pointsTotal?: number; // 累计积分
  roleCode?: string; // 角色代码：super_admin/moderator/operator/user
  roleName?: string; // 角色名称
  createTime: string;
}

// 资源信息
export interface ResourceInfo {
  resourceId: string;
  title: string;
  description: string;
  cover: string; // 封面图URL
  coverUrl?: string; // 封面图URL（兼容字段）
  previewImages: string[]; // 预览图URL数组
  format: string; // 文件格式：PSD/AI/CDR等
  fileFormat?: string; // 文件格式（兼容字段）
  fileSize: number; // 文件大小（字节）
  fileUrl?: string; // 文件下载URL
  fileName?: string; // 文件名
  downloadCount: number; // 下载次数
  viewCount?: number; // 浏览次数
  likeCount?: number; // 点赞次数
  collectCount?: number; // 收藏次数
  vipLevel: number; // 0-免费, 1-VIP专属
  pricingType?: number; // 定价类型: 0-免费, 1-付费积分, 2-VIP专属
  pointsCost?: number; // 下载所需积分（登录用户可见）
  categoryId: string;
  categoryName: string;
  tags: string[];
  uploaderId: string;
  uploaderName: string;
  isAudit: number; // 0-待审核, 1-已通过, 2-已驳回
  auditMsg?: string; // 审核信息
  createdAt?: string; // 创建时间（ISO 8601格式）
  createTime: string;
  updateTime: string;
}

// 网站配置
export interface SiteConfig {
  siteName: string;
  siteDescription?: string; // 网站描述（兼容字段）
  logoUrl: string;
  faviconUrl: string;
  copyright: string;
  icp: string; // 备案号
  seoTitle: string;
  seoKeywords: string;
  seoDescription: string;
  watermarkText: string; // 水印文字
  watermarkOpacity: number; // 水印透明度
}

// 轮播图信息
export interface BannerInfo {
  bannerId: string;
  title: string;
  imageUrl: string;
  linkType: 'internal' | 'external' | 'category' | 'resource'; // 链接类型
  linkUrl: string;
  sort: number;
  status: number; // 0-禁用, 1-启用
  startTime?: string;
  endTime?: string;
}

// 分类信息
export interface CategoryInfo {
  categoryId: string;
  categoryName: string;
  categoryCode?: string; // 分类代码
  icon?: string;
  parentId?: string | null; // 父分类ID（二级分类），null表示一级分类
  sort: number;
  isHot: boolean; // 是否热门
  isRecommend: boolean; // 是否推荐
  resourceCount: number; // 资源数量
  children?: CategoryInfo[]; // 子分类列表（用于分类树结构）
}

// 上传元数据
export interface UploadMetadata {
  title: string;
  categoryId: string;
  tags: string[];
  description: string;
  vipLevel: number;
  /** 定价类型: 0-免费, 1-付费积分, 2-VIP专属 */
  pricingType?: number;
  /** 积分价格 (仅当pricingType=1时有效) */
  pointsCost?: number;
}

// 分片信息
export interface ChunkInfo {
  chunkIndex: number;
  chunkSize: number;
  totalChunks: number;
  fileHash: string;
}

// 搜索参数
export interface SearchParams {
  keyword?: string;
  categoryId?: string;
  format?: string;
  vipLevel?: number;
  pricingType?: number; // 定价类型筛选: 0-免费, 1-付费积分, 2-VIP专属
  sortType?: 'comprehensive' | 'download' | 'latest' | 'like' | 'collect'; // 排序方式
  pageNum: number;
  pageSize: number;
}

// 下载记录
export interface DownloadRecord {
  recordId: string;
  resourceId: string;
  resourceTitle: string;
  resourceCover: string;
  resourceFormat: string;
  downloadTime: string;
}

// 上传记录
export interface UploadRecord {
  recordId: string;
  resourceId: string;
  resourceTitle: string;
  resourceCover: string;
  resourceFormat: string;
  isAudit: number; // 0-待审核, 1-已通过, 2-已驳回
  auditMsg?: string;
  uploadTime: string;
}

// VIP信息
export interface VIPInfo {
  vipLevel: number; // 0-普通, 1-月度, 2-季度, 3-年度
  vipExpireTime?: string;
  isLifetime?: boolean; // 是否终身VIP
  downloadLimit: number; // 下载次数限制（-1表示无限制）
  downloadUsed: number; // 已使用下载次数
  privileges: string[]; // 特权列表
}

// 公告信息
export interface AnnouncementInfo {
  announcementId: string;
  title: string;
  content: string;
  type: 'normal' | 'warning' | 'important'; // 公告类型
  level: 'normal' | 'warning' | 'important'; // 重要程度（与type保持一致）
  isTop: boolean; // 是否置顶
  linkUrl?: string;
  status: number; // 0-禁用, 1-启用
  createTime: string;
}

// 活动信息
export interface ActivityInfo {
  activityId: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  status: 'upcoming' | 'ongoing' | 'ended'; // 活动状态
  isPopup: boolean; // 是否弹窗显示
  startTime: string;
  endTime: string;
}

// 友情链接
export interface FriendLinkInfo {
  linkId: string;
  name: string;
  url: string;
  logo?: string;
  sort: number;
  status: number; // 0-禁用, 1-启用
}

// 登录请求
export interface LoginRequest {
  phone: string;
  password: string;
  rememberMe?: boolean;
}

// 登录响应
export interface LoginResponse {
  token: string;
  userInfo: UserInfo;
  expireTime?: string; // Token过期时间（ISO 8601格式）
}

// 注册请求
export interface RegisterRequest {
  phone: string;
  verifyCode: string;
  password: string;
  confirmPassword: string;
}

// 验证码请求
export interface VerifyCodeRequest {
  phone: string;
  type: 'register' | 'login' | 'reset'; // 验证码类型
}

// 待审核资源信息（管理后台）
export interface AuditResource {
  resource_id: string;
  title: string;
  description?: string;
  cover: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_format: string;
  preview_images?: string[];
  category_id?: string;
  category?: {
    category_id: string;
    category_name: string;
  };
  tags?: string[];
  vip_level: number;
  user_id: string;
  user?: {
    user_id: string;
    nickname: string;
    phone: string;
    avatar?: string;
  };
  audit_status: number; // 0:待审核 1:已通过 2:已驳回
  audit_msg?: string;
  auditor_id?: string;
  audited_at?: string;
  download_count: number;
  view_count: number;
  like_count: number;
  collect_count: number;
  is_top: boolean;
  is_recommend: boolean;
  status: number;
  created_at: string;
  updated_at: string;
}

// 分类信息（管理后台）
export interface Category {
  categoryId: string;
  categoryName: string;
  categoryCode?: string;
  parentId?: string | null;
  icon?: string;
  sortOrder?: number;
  isHot?: boolean;
  isRecommend?: boolean;
  resourceCount?: number;
}
