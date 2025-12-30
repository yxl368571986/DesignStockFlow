<template>
  <div class="my-exchanges-page">
    <div class="exchanges-container">
      <!-- 返回按钮和标题 -->
      <div class="page-header">
        <div class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <h1 class="page-title">我的兑换记录</h1>
      </div>

      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-radio-group v-model="statusFilter" @change="filterRecords">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="pending">待发货</el-radio-button>
          <el-radio-button value="shipped">已发货</el-radio-button>
          <el-radio-button value="completed">已完成</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 兑换记录列表 -->
      <div class="exchanges-list" v-loading="loading">
        <div v-for="record in filteredRecords" :key="record.id" class="exchange-card">
          <div class="card-header">
            <span class="order-no">订单号：{{ record.orderNo }}</span>
            <el-tag :type="getStatusType(record.status)" size="small">{{ getStatusName(record.status) }}</el-tag>
          </div>
          <div class="card-body">
            <el-image :src="record.productImage" class="product-image" fit="cover">
              <template #error>
                <div class="image-placeholder"><el-icon><Picture /></el-icon></div>
              </template>
            </el-image>
            <div class="product-info">
              <h4 class="product-name">{{ record.productName }}</h4>
              <p class="product-category">{{ record.category }}</p>
              <div class="exchange-meta">
                <span class="points-cost">
                  <el-icon><Coin /></el-icon>
                  -{{ record.points }} 积分
                </span>
                <span class="quantity">x{{ record.quantity }}</span>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <span class="exchange-time">{{ record.createdAt }}</span>
            <div class="actions">
              <el-button v-if="record.status === 'shipped'" type="primary" size="small" @click="confirmReceive(record)">确认收货</el-button>
              <el-button v-if="record.status === 'pending'" type="text" size="small" @click="cancelExchange(record)">取消兑换</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!loading && filteredRecords.length === 0" description="暂无兑换记录">
        <el-button type="primary" @click="goToMall">去积分商城看看</el-button>
      </el-empty>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchRecords"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 我的兑换记录页面
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Coin, Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPointsExchangeStatusText, getPointsExchangeStatusType } from '@/utils/status'

interface ExchangeRecord {
  id: string
  orderNo: string
  productId: string
  productName: string
  productImage: string
  category: string
  points: number
  quantity: number
  status: string
  createdAt: string
}

const router = useRouter()
const loading = ref(false)
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 兑换记录（模拟数据）
const records = ref<ExchangeRecord[]>([
  { id: '1', orderNo: 'EX202412290001', productId: 'p1', productName: 'VIP月卡', productImage: 'https://picsum.photos/100/100?random=1', category: '会员特权', points: 1000, quantity: 1, status: 'completed', createdAt: '2024-12-29 10:30:00' },
  { id: '2', orderNo: 'EX202412290002', productId: 'p2', productName: '10元优惠券', productImage: 'https://picsum.photos/100/100?random=2', category: '优惠券', points: 500, quantity: 2, status: 'completed', createdAt: '2024-12-28 15:20:00' },
  { id: '3', orderNo: 'EX202412290003', productId: 'p3', productName: '精美鼠标垫', productImage: 'https://picsum.photos/100/100?random=3', category: '实物商品', points: 2000, quantity: 1, status: 'shipped', createdAt: '2024-12-27 09:15:00' },
  { id: '4', orderNo: 'EX202412290004', productId: 'p4', productName: '下载次数+10', productImage: 'https://picsum.photos/100/100?random=4', category: '虚拟商品', points: 300, quantity: 1, status: 'completed', createdAt: '2024-12-26 14:45:00' }
])

const filteredRecords = computed(() => {
  if (!statusFilter.value) return records.value
  return records.value.filter(r => r.status === statusFilter.value)
})

const getStatusType = (status: string) => {
  return getPointsExchangeStatusType(status)
}

const getStatusName = (status: string) => {
  return getPointsExchangeStatusText(status)
}

const goBack = () => router.back()
const goToMall = () => router.push('/points/mall')

const filterRecords = () => {
  currentPage.value = 1
}

const fetchRecords = () => {
  // 实际应调用API
}

const confirmReceive = async (record: ExchangeRecord) => {
  await ElMessageBox.confirm('确认已收到商品？', '确认收货')
  record.status = 'completed'
  ElMessage.success('已确认收货')
}

const cancelExchange = async (record: ExchangeRecord) => {
  await ElMessageBox.confirm('确定要取消该兑换订单吗？积分将退还到您的账户。', '取消兑换', { type: 'warning' })
  record.status = 'cancelled'
  ElMessage.success('已取消，积分已退还')
}

onMounted(() => {
  total.value = records.value.length
})
</script>

<style scoped lang="scss">
.my-exchanges-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 40px;
}

.exchanges-container {
  max-width: 800px;
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
    
    &:hover { background: #f5f7fa; }
  }
  
  .page-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }
}

.filter-bar {
  margin-bottom: 20px;
}

.exchanges-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exchange-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
    
    .order-no { font-size: 13px; color: #909399; }
  }
  
  .card-body {
    display: flex;
    gap: 16px;
    
    .product-image {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      flex-shrink: 0;
    }
    
    .image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      font-size: 24px;
      color: #c0c4cc;
    }
    
    .product-info {
      flex: 1;
      
      .product-name {
        font-size: 15px;
        font-weight: 600;
        margin: 0 0 4px;
      }
      
      .product-category {
        font-size: 12px;
        color: #909399;
        margin: 0 0 8px;
      }
      
      .exchange-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .points-cost {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #f56c6c;
          font-weight: 600;
        }
        
        .quantity { color: #909399; font-size: 13px; }
      }
    }
  }
  
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
    
    .exchange-time { font-size: 12px; color: #909399; }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
