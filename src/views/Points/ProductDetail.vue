<template>
  <div class="product-detail-page">
    <div class="detail-container">
      <div class="page-header">
        <div
          class="back-btn"
          @click="goBack"
        >
          <el-icon><ArrowLeft /></el-icon>
          <span>返回商城</span>
        </div>
      </div>
      <div
        v-if="loading"
        class="loading-wrapper"
      >
        <el-skeleton
          :rows="5"
          animated
        />
      </div>
      <template v-else-if="product.productId">
        <div class="product-detail-card">
          <div class="product-main">
            <div class="product-image-section">
              <el-image
                :src="product.imageUrl"
                fit="cover"
                class="main-image"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div
                v-if="product.stock === 0"
                class="stock-badge"
              >
                已售罄
              </div>
              <div
                v-else-if="product.stock > 0 && product.stock < 10"
                class="stock-badge warning"
              >
                仅剩{{ product.stock }}件
              </div>
            </div>
            <div class="product-info-section">
              <h1 class="product-name">
                {{ product.productName }}
              </h1>
              <el-tag
                size="small"
                type="info"
              >
                {{ displayProductType }}
              </el-tag>
              <div class="product-points-display">
                <el-icon class="coin-icon"><Coin /></el-icon>
                <span class="points-value">{{ product.pointsRequired }}</span>
                <span class="points-unit">积分</span>
              </div>
              <div class="product-stats">
                <div class="stat-item">
                  <span class="stat-label">库存</span>
                  <span class="stat-value">{{ product.stock === -1 ? '无限' : product.stock }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">已兑换</span>
                  <span class="stat-value">{{ product.exchangeCount || 0 }}</span>
                </div>
              </div>
              <div class="product-description">
                <h3>商品描述</h3>
                <p>{{ product.description || '暂无描述' }}</p>
              </div>
              <div class="balance-info">
                <span class="balance-label">当前积分余额：</span>
                <span class="balance-value">{{ pointsBalance }}</span>
                <span
                  v-if="pointsBalance >= product.pointsRequired"
                  class="balance-tip success"
                >
                  (兑换后剩余 {{ pointsBalance - product.pointsRequired }} 积分)
                </span>
                <span
                  v-else
                  class="balance-tip warning"
                >
                  (还差 {{ product.pointsRequired - pointsBalance }} 积分)
                </span>
              </div>
              <div class="action-buttons">
                <el-button
                  type="primary"
                  size="large"
                  :disabled="product.stock === 0 || pointsBalance < product.pointsRequired"
                  @click="handleExchange"
                >
                  <el-icon><ShoppingCart /></el-icon>
                  {{ exchangeBtnText }}
                </el-button>
                <el-button
                  v-if="pointsBalance < product.pointsRequired"
                  size="large"
                  @click="goToRecharge"
                >
                  <el-icon><Plus /></el-icon>
                  去充值
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <div class="exchange-notice">
          <h3>
            <el-icon><InfoFilled /></el-icon>
            兑换须知
          </h3>
          <ul>
            <li>兑换成功后积分将立即扣除，请确认后再兑换</li>
            <li>虚拟商品兑换后将自动发放到您的账户</li>
            <li>实物商品需要填写收货地址，请确保地址准确</li>
            <li>如有问题请联系客服处理</li>
          </ul>
        </div>
      </template>
      <el-empty
        v-else
        description="商品不存在"
      />
    </div>
    <el-dialog
      v-model="exchangeDialogVisible"
      title="确认兑换"
      width="400px"
      center
    >
      <div class="exchange-confirm">
        <div class="confirm-product">
          <el-image
            :src="product.imageUrl"
            style="width: 80px; height: 80px"
            fit="cover"
          />
          <div class="confirm-info">
            <h4>{{ product.productName }}</h4>
            <p>{{ product.description }}</p>
          </div>
        </div>
        <div class="confirm-points">
          <span>需要积分：</span>
          <span class="points-cost">{{ product.pointsRequired }}</span>
        </div>
        <div class="confirm-balance">
          <span>当前余额：</span>
          <span>{{ pointsBalance }}</span>
          <span class="arrow">→</span>
          <span class="after-balance">{{ pointsBalance - product.pointsRequired }}</span>
        </div>
        <el-form
          v-if="isPhysicalProduct"
          :model="addressForm"
          label-width="80px"
          class="address-form"
        >
          <el-form-item
            label="收货地址"
            required
          >
            <el-input
              v-model="addressForm.address"
              type="textarea"
              :rows="2"
              placeholder="请输入详细收货地址"
            />
          </el-form-item>
          <el-form-item
            label="联系电话"
            required
          >
            <el-input
              v-model="addressForm.phone"
              placeholder="请输入联系电话"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="exchangeDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="exchanging"
          @click="confirmExchange"
        >
          确认兑换
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Coin, Plus, Picture, ShoppingCart, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/pinia/userStore'
import { getPointsProductById, exchangeProduct } from '@/api/points'
import type { PointsProductDetail } from '@/types/points'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(true)
const exchanging = ref(false)
const exchangeDialogVisible = ref(false)
const addressForm = reactive({ address: '', phone: '' })

const product = ref<PointsProductDetail>({
  productId: '',
  productName: '',
  productType: '',
  productCode: '',
  pointsRequired: 0,
  productValue: '',
  stock: 0,
  imageUrl: '',
  description: '',
  status: 1,
  exchangeCount: 0
})

const pointsBalance = computed(() => userStore.pointsBalance)

const productTypeMap: Record<string, string> = {
  virtual: '虚拟商品',
  physical: '实物商品',
  coupon: '优惠券',
  vip: '会员特权'
}

const displayProductType = computed(() => {
  return productTypeMap[product.value.productType] || product.value.productType
})

const isPhysicalProduct = computed(() => {
  return product.value.productType === 'physical'
})

const exchangeBtnText = computed(() => {
  if (product.value.stock === 0) return '已售罄'
  if (pointsBalance.value < product.value.pointsRequired) return '积分不足'
  return '立即兑换'
})

const goBack = () => router.push('/points/mall')
const goToRecharge = () => router.push('/points/recharge')

const handleExchange = () => {
  if (pointsBalance.value < product.value.pointsRequired) {
    ElMessageBox.confirm('积分不足，是否前往充值？', '提示', {
      confirmButtonText: '去充值',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => goToRecharge()).catch(() => {})
    return
  }
  addressForm.address = ''
  addressForm.phone = ''
  exchangeDialogVisible.value = true
}

const confirmExchange = async () => {
  if (isPhysicalProduct.value && (!addressForm.address || !addressForm.phone)) {
    ElMessage.warning('请填写完整的收货信息')
    return
  }
  exchanging.value = true
  try {
    const deliveryAddress = isPhysicalProduct.value
      ? `${addressForm.address} | ${addressForm.phone}`
      : undefined
    const res = await exchangeProduct({
      productId: product.value.productId,
      deliveryAddress
    })
    if (res.code === 200 || res.code === 0) {
      if (product.value.stock > 0) product.value.stock--
      product.value.exchangeCount++
      await userStore.refreshUserInfo()
      ElMessage.success('兑换成功！')
      exchangeDialogVisible.value = false
    } else {
      ElMessage.error(res.msg || res.message || '兑换失败')
    }
  } catch (error) {
    console.error('兑换失败:', error)
    ElMessage.error('兑换失败，请稍后重试')
  } finally {
    exchanging.value = false
  }
}

const fetchProduct = async () => {
  loading.value = true
  const productId = route.params.id as string
  try {
    const res = await getPointsProductById(productId)
    if (res.code === 200 || res.code === 0) {
      product.value = res.data as PointsProductDetail
    } else {
      ElMessage.error(res.msg || res.message || '商品不存在')
    }
  } catch (error) {
    console.error('获取商品详情失败:', error)
    ElMessage.error('获取商品详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchProduct())
</script>

<style scoped lang="scss">
.product-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  padding-bottom: 40px;
}

.detail-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: #fff;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #f5f7fa;
    transform: translateX(-2px);
  }
}

.loading-wrapper {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
}

.product-detail-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.product-main {
  display: flex;
  gap: 32px;
  padding: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.product-image-section {
  position: relative;
  flex-shrink: 0;
  width: 320px;
  height: 320px;

  @media (max-width: 768px) {
    width: 100%;
    height: 280px;
  }

  .main-image {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    overflow: hidden;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    font-size: 64px;
    color: #c0c4cc;
  }

  .stock-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 6px 16px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    border-radius: 16px;
    font-size: 13px;

    &.warning {
      background: #e6a23c;
    }
  }
}

.product-info-section {
  flex: 1;

  .product-name {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 12px;
    color: #303133;
  }

  .product-points-display {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 16px 0 20px;
    color: #ff7d00;

    .coin-icon {
      font-size: 28px;
    }

    .points-value {
      font-size: 36px;
      font-weight: 700;
    }

    .points-unit {
      font-size: 16px;
      margin-top: 8px;
    }
  }

  .product-stats {
    display: flex;
    gap: 32px;
    margin-bottom: 20px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .stat-label {
        font-size: 13px;
        color: #909399;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .product-description {
    margin-bottom: 20px;

    h3 {
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 8px;
      color: #606266;
    }

    p {
      font-size: 14px;
      color: #909399;
      line-height: 1.8;
      margin: 0;
    }
  }

  .balance-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
    padding: 12px 16px;
    background: #fef3c7;
    border-radius: 8px;
    font-size: 14px;

    .balance-label {
      color: #92400e;
    }

    .balance-value {
      font-size: 18px;
      font-weight: 700;
      color: #b45309;
    }

    .balance-tip {
      font-size: 13px;

      &.success {
        color: #059669;
      }

      &.warning {
        color: #dc2626;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;

    .el-button {
      min-width: 140px;
    }
  }
}

.exchange-notice {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 16px;
    color: #303133;

    .el-icon {
      color: #409eff;
    }
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      font-size: 14px;
      color: #606266;
      line-height: 2;
    }
  }
}

.exchange-confirm {
  .confirm-product {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e4e7ed;

    .confirm-info {
      h4 {
        margin: 0 0 8px;
        font-size: 16px;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #909399;
      }
    }
  }

  .confirm-points,
  .confirm-balance {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;

    .points-cost {
      font-size: 20px;
      font-weight: 700;
      color: #ff7d00;
    }

    .arrow {
      color: #909399;
    }

    .after-balance {
      color: #67c23a;
      font-weight: 600;
    }
  }

  .address-form {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e4e7ed;
  }
}
</style>
