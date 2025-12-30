/**
 * 积分相关类型定义
 */

/**
 * 积分商品（用于商城列表）
 */
export interface PointsProductListItem {
  id: string
  name: string
  category: string
  points: number
  stock: number
  exchangeCount: number
  image: string
  description: string
  status: number
}

/**
 * 积分商品详情
 */
export interface PointsProductDetail {
  productId: string
  productName: string
  productType: string
  productCode: string
  pointsRequired: number
  productValue: string
  stock: number
  imageUrl: string
  description: string
  status: number
  exchangeCount: number
}
