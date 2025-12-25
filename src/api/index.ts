// API接口统一导出
// 注意：为避免重复导出，使用显式导出

// 认证相关
export {
  login,
  codeLogin,
  register,
  sendVerifyCode,
  getWechatLoginUrl,
  logout,
  refreshToken
} from './auth';
export { getUserInfo as getAuthUserInfo } from './auth';

// 资源相关
export {
  getResourceList,
  getResourceDetail,
  searchResources,
  getHotResources,
  getRecommendedResources,
  uploadResource,
  downloadResource,
  updateResource,
  deleteResource,
  collectResource,
  uncollectResource,
  checkFavoriteStatus,
  checkFavoritesBatch,
  getRelatedResources
} from './resource';

// 上传相关
export * from './upload';

// 内容相关
export {
  getSiteConfig,
  getBanners,
  getCategories,
  getAnnouncements,
  getActivities,
  getFriendLinks,
  getHotSearchKeywords,
  getSearchSuggestions
} from './content';
export { getCategoryTree as getContentCategoryTree } from './content';

// 个人中心相关
export {
  updateUserInfo,
  changePassword,
  getDownloadHistory,
  getUploadHistory,
  uploadAvatar,
  bindEmail,
  getCollections,
  deleteUploadedResource,
  getVIPInfo
} from './personal';
export { getUserInfo } from './personal';

// VIP相关 - 排除与statistics重复的getDownloadStats
export {
  getVipPackages,
  getVipPrivileges,
  getUserVipInfo,
  getAllVipPackages,
  createVipPackage,
  updateVipPackage,
  deleteVipPackage,
  getAllVipPrivileges,
  updateVipPrivilege,
  getVipOrders,
  getVipOrderById,
  refundVipOrder,
  getVipStatistics,
  adjustUserVip,
  createVipOrder,
  getUserOrders,
  getOrderDetail,
  cancelOrder,
  initiatePayment,
  getPaymentStatus,
  requestRefund,
  getPointsExchangeInfo,
  exchangePointsForVip,
  getPointsExchangeRecords,
  sendSecondaryAuthCode,
  verifySecondaryAuthCode,
  getUserDevices,
  kickDevice,
  checkDownloadPermission,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount
} from './vip';
export { getDownloadStats as getVipDownloadStats } from './vip';
export type {
  VipPackage,
  VipPrivilege,
  UserVipInfo,
  CreateOrderRequest,
  CreateOrderResponse,
  PaymentResponse,
  PaymentStatusResponse,
  RefundRequest,
  PointsExchangeInfo,
  PointsExchangeRequest,
  SecondaryAuthRequest,
  DeviceInfo,
  DownloadPermission,
  VipOrder,
  VipStatistics,
  Notification
} from './vip';

// 积分相关
export * from './points';

// 管理员资源相关
export * from './adminResource';

// 分类管理相关
export {
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoriesSort
} from './category';
export { getCategoryTree } from './category';
export type { Category, CreateCategoryParams, UpdateCategoryParams, SortDataItem } from './category';

// 统计相关
export * from './statistics';

// 系统设置相关
export * from './systemSettings';
