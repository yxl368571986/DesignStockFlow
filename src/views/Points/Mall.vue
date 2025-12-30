<template>
  <div class="points-mall-page">
    <div class="mall-container">
      <!-- 返回按钮和标题 -->
      <div class="page-header">
        <div class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <h1 class="page-title">积分商城</h1>
      </div>

      <!-- 积分余额显示 -->
      <div class="points-balance-bar">
        <div class="balance-info">
          <el-icon class="balance-icon"><Coin /></el-icon>
          <span class="balance-label">当前积分余额</span>
          <span class="balance-value">{{ pointsBalance }}</span>
        </div>
        <el-button type="warning" size="small" @click="goToRecharge">
          <el-icon><Plus /></el-icon>
          充值积分
        </el-button>
      </div>

      <!-- 商品分类筛选 -->
      <div class="category-filter">
        <el-radio-group v-model="selectedCategory">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="虚拟商品">虚拟商品</el-radio-button>
          <el-radio-button value="实物商品">实物商品</el-radio-button>
          <el-radio-button value="优惠券">优惠券</el-radio-button>
          <el-radio-button value="会员特权">会员特权</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 商品列表 -->
      <div class="products-grid" v-loading="loading">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-card"
          :class="{ 'out-of-stock': product.stock === 0 }"
          @click="goToProductDetail(product.id)"
        >
          <div class="product-image">
            <el-image :src="product.image" fit="cover">
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-if="product.stock === 0" class="stock-badge">已售罄</div>
            <div v-else-if="product.stock > 0 && product.stock < 10" class="stock-badge warning">仅剩{{ product.stock }}件</div>
          </div>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-desc">{{ product.description }}</p>
            <div class="product-meta">
              <el-tag size="small" type="info">{{ product.category }}</el-tag>
              <span class="exchange-count">已兑换 {{ product.exchangeCount }}</span>
            </div>
            <div class="product-footer">
              <div class="product-points">
                <el-icon><Coin /></el-icon>
                <span class="points-value">{{ product.points }}</span>
                <span class="points-unit">积分</span>
              </div>
              <el-button
                type="primary"
                size="small"
                :disabled="product.stock === 0 || pointsBalance < product.points"
                @click.stop="handleExchange(product)"
              >
                {{ product.stock === 0 ? '已售罄' : (pointsBalance < product.points ? '积分不足' : '立即兑换') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!loading && filteredProducts.length === 0" description="暂无商品" />

      <!-- 我的兑换记录入口 -->
      <div class="my-exchanges-entry">
        <el-button type="text" @click="goToMyExchanges">
          <el-icon><List /></el-icon>
          查看我的兑换记录
        </el-button>
      </div>
    </div>

    <!-- 兑换确认弹窗 -->
    <el-dialog v-model="exchangeDialogVisible" title="确认兑换" width="400px" center>
      <div class="exchange-confirm" v-if="selectedProduct">
        <div class="confirm-product">
          <el-image :src="selectedProduct.image" style="width: 80px; height: 80px" fit="cover" />
          <div class="confirm-info">
            <h4>{{ selectedProduct.name }}</h4>
            <p>{{ selectedProduct.description }}</p>
          </div>
        </div>
        <div class="confirm-points">
          <span>需要积分：</span>
          <span class="points-cost">{{ selectedProduct.points }}</span>
        </div>
        <div class="confirm-balance">
          <span>当前余额：</span>
          <span>{{ pointsBalance }}</span>
          <span class="arrow">→</span>
          <span class="after-balance">{{ pointsBalance - selectedProduct.points }}</span>
        </div>
        <!-- 实物商品需要填写地址 -->
        <el-form v-if="selectedProduct.category === '实物商品'" :model="addressForm" label-width="80px" class="address-form">
          <el-form-item label="收货地址" required>
            <el-input v-model="addressForm.address" type="textarea" :rows="2" placeholder="请输入详细收货地址" />
          </el-form-item>
          <el-form-item label="联系电话" required>
            <el-input v-model="addressForm.phone" placeholder="请输入联系电话" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="exchangeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmExchange" :loading="exchanging">确认兑换</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 积分商城页面
 * 用户可以使用积分兑换商品
 */
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Coin, Plus, Picture, List } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/pinia/userStore'
import { getPointsProducts, exchangeProduct as apiExchangeProduct, type PointsProduct } from '@/api/points'
import type { PointsProductListItem } from '@/types/points'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const exchanging = ref(false)
const selectedCategory = ref('')
const exchangeDialogVisible = ref(false)
const selectedProduct = ref<PointsProductListItem | null>(null)

const addressForm = reactive({
  address: '',
  phone: ''
})

const pointsBalance = computed(() => userStore.pointsBalance)

// 商品列表
const products = ref<PointsProductListItem[]>([])

// 分类映射
const categoryMap: Record<string, string> = {
  'virtual': '虚拟商品',
  'physical': '实物商品',
  'coupon': '优惠券',
  'vip': '会员特权'
}

const filteredProducts = computed(() => {
  if (!selectedCategory.value) return products.value.filter(p => p.status === 1)
  return products.value.filter(p => p.status === 1 && p.category === selectedCategory.value)
})

/** 加载商品列表 */
async function loadProducts() {
  loading.value = true
  try {
    const res = await getPointsProducts()
    if (res.code === 200 || res.code === 0) {
      // 后端返回格式: { list: [...], total, page, pageSize }
      const productList = res.data?.list || []
      products.value = productList.map((p: PointsProduct) => ({
        id: p.productId,
        name: p.productName,
        category: categoryMap[p.productType] || p.productType,
        points: p.pointsRequired,
        stock: p.stock,
        exchangeCount: 0, // API可能没有返回这个字段
        image: p.imageUrl || '/icons/icon.svg',
        description: p.description,
        status: p.status ?? 1
      }))
    }
  } catch (error) {
    console.error('加载商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const goToRecharge = () => {
  router.push('/points/recharge')
}

const goToMyExchanges = () => {
  router.push('/points/exchanges')
}

const goToProductDetail = (productId: string) => {
  router.push(`/points/mall/${productId}`)
}

const handleExchange = (product: PointsProductListItem) => {
  if (pointsBalance.value < product.points) {
    ElMessageBox.confirm('积分不足，是否前往充值？', '提示', {
      confirmButtonText: '去充值',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      goToRecharge()
    }).catch(() => {})
    return
  }
  selectedProduct.value = product
  addressForm.address = ''
  addressForm.phone = ''
  exchangeDialogVisible.value = true
}

const confirmExchange = async () => {
  if (!selectedProduct.value) return
  
  // 实物商品需要验证地址
  if (selectedProduct.value.category === '实物商品') {
    if (!addressForm.address || !addressForm.phone) {
      ElMessage.warning('请填写完整的收货信息')
      return
    }
  }
  
  exchanging.value = true
  try {
    const deliveryAddress = selectedProduct.value.category === '实物商品' 
      ? `${addressForm.address} | ${addressForm.phone}` 
      : undefined
    
    const res = await apiExchangeProduct({
      productId: selectedProduct.value.id,
      deliveryAddress
    })
    
    if (res.code === 200 || res.code === 0) {
      // 刷新积分余额
      await userStore.refreshUserInfo()
      // 重新加载商品列表
      await loadProducts()
      
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

onMounted(() => {
  loadProducts()
})
</script>

<style scoped lang="scss">
.points-mall-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  padding-bottom: 40px;
}

.mall-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  
  .back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    background: #fff;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    
    &:hover {
      background: #f5f7fa;
      transform: translateX(-2px);
    }
  }
  
  .page-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
    background: linear-gradient(135deg, #ff7d00, #ffa940);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.points-balance-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 20px;
  color: #fff;
  
  .balance-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .balance-icon { font-size: 24px; }
    .balance-label { font-size: 14px; opacity: 0.9; }
    .balance-value { font-size: 28px; font-weight: 700; }
  }
}

.category-filter {
  margin-bottom: 24px;
  
  :deep(.el-radio-button__inner) {
    border-radius: 20px !important;
    margin-right: 8px;
  }
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  
  &.out-of-stock {
    opacity: 0.7;
  }
  
  .product-image {
    position: relative;
    height: 180px;
    
    :deep(.el-image) {
      width: 100%;
      height: 100%;
    }
    
    .image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      font-size: 48px;
      color: #c0c4cc;
    }
    
    .stock-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 4px 12px;
      background: rgba(0,0,0,0.6);
      color: #fff;
      border-radius: 12px;
      font-size: 12px;
      
      &.warning {
        background: #e6a23c;
      }
    }
  }
  
  .product-info {
    padding: 16px;
    
    .product-name {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 8px;
      color: #303133;
    }
    
    .product-desc {
      font-size: 13px;
      color: #909399;
      margin: 0 0 12px;
      line-height: 1.5;
    }
    
    .product-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .exchange-count {
        font-size: 12px;
        color: #909399;
      }
    }
    
    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .product-points {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #ff7d00;
        
        .points-value {
          font-size: 20px;
          font-weight: 700;
        }
        
        .points-unit {
          font-size: 12px;
        }
      }
    }
  }
}

.my-exchanges-entry {
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}

.exchange-confirm {
  .confirm-product {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e4e7ed;
    
    .confirm-info {
      h4 { margin: 0 0 8px; font-size: 16px; }
      p { margin: 0; font-size: 13px; color: #909399; }
    }
  }
  
  .confirm-points, .confirm-balance {
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
    
    .arrow { color: #909399; }
    .after-balance { color: #67c23a; font-weight: 600; }
  }
  
  .address-form {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e4e7ed;
  }
}
</style>
