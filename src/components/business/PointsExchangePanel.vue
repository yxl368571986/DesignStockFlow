<!--
  积分兑换面板组件
  
  功能：
  - 显示可兑换权益列表
  - 兑换确认流程
  - 兑换规则说明
  
  需求: 10.1, 10.2, 10.8
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Coin, Picture, InfoFilled } from '@element-plus/icons-vue';
import { useUserStore } from '@/pinia/userStore';
import type { FormInstance, FormRules } from 'element-plus';

interface ExchangeProduct {
  productId: string;
  productName: string;
  productType: 'vip' | 'gift' | 'tool';
  pointsRequired: number;
  productValue: string;
  stock: number;
  imageUrl: string;
  description: string;
}

const emit = defineEmits<{
  exchangeSuccess: [productId: string];
}>();

const userStore = useUserStore();
const pointsBalance = computed(() => userStore.pointsBalance);

const loading = ref(false);
const products = ref<ExchangeProduct[]>([]);
const confirmDialogVisible = ref(false);
const selectedProduct = ref<ExchangeProduct | null>(null);
const exchanging = ref(false);

const addressFormRef = ref<FormInstance>();
const addressForm = ref({
  address: '',
});

const addressRules: FormRules = {
  address: [
    { required: true, message: '请输入收货地址', trigger: 'blur' },
    { min: 10, message: '地址至少10个字符', trigger: 'blur' },
  ],
};

/** 获取默认图片 */
function getDefaultImage(productType: string): string {
  const defaultImages: Record<string, string> = {
    vip: '/images/vip-card.png',
    gift: '/images/gift-box.png',
    tool: '/images/tool-icon.png',
  };
  return defaultImages[productType] || '/images/default-product.png';
}

/** 判断是否可以兑换 */
function canExchange(product: ExchangeProduct): boolean {
  return (
    pointsBalance.value >= product.pointsRequired &&
    (product.stock === -1 || product.stock > 0)
  );
}

/** 获取按钮文字 */
function getButtonText(product: ExchangeProduct): string {
  if (product.stock === 0) return '已售罄';
  if (pointsBalance.value < product.pointsRequired) return '积分不足';
  return '立即兑换';
}

/** 处理兑换点击 */
function handleExchange(product: ExchangeProduct) {
  selectedProduct.value = product;
  addressForm.value.address = '';
  confirmDialogVisible.value = true;
}

/** 刷新用户积分信息 */
async function refreshUserPoints() {
  try {
    const response = await fetch('/api/v1/user/info', {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    });
    const result = await response.json();
    if (result.code === 0 || result.code === 200) {
      userStore.updateUserInfo({
        pointsBalance: result.data?.pointsBalance || 0,
        pointsTotal: result.data?.pointsTotal || 0,
      });
    }
  } catch (error) {
    console.error('刷新用户信息失败:', error);
  }
}

/** 确认兑换 */
async function confirmExchange() {
  if (!selectedProduct.value) return;

  if (selectedProduct.value.productType === 'gift') {
    const valid = await addressFormRef.value?.validate().catch(() => false);
    if (!valid) return;
  }

  exchanging.value = true;
  try {
    const response = await fetch('/api/v1/points/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userStore.token}`,
      },
      body: JSON.stringify({
        productId: selectedProduct.value.productId,
        deliveryAddress:
          selectedProduct.value.productType === 'gift'
            ? addressForm.value.address
            : undefined,
      }),
    });

    const result = await response.json();

    if (result.code === 0 || result.code === 200) {
      ElMessage.success('兑换成功！');
      confirmDialogVisible.value = false;
      await refreshUserPoints();
      await fetchProducts();
      emit('exchangeSuccess', selectedProduct.value.productId);
    } else {
      ElMessage.error(result.message || '兑换失败');
    }
  } catch (error) {
    console.error('兑换失败:', error);
    ElMessage.error('兑换失败，请稍后重试');
  } finally {
    exchanging.value = false;
  }
}

/** 获取商品列表 */
async function fetchProducts() {
  loading.value = true;
  try {
    const response = await fetch('/api/v1/points/exchange/products', {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    });

    const result = await response.json();

    if (result.code === 0 || result.code === 200) {
      products.value = result.data?.list || [];
    }
  } catch (error) {
    console.error('获取商品列表失败:', error);
    products.value = [
      {
        productId: 'vip-month',
        productName: 'VIP月卡',
        productType: 'vip',
        pointsRequired: 500,
        productValue: '1个月VIP会员',
        stock: -1,
        imageUrl: '',
        description: '兑换后立即生效，享受VIP专属特权',
      },
      {
        productId: 'vip-quarter',
        productName: 'VIP季卡',
        productType: 'vip',
        pointsRequired: 1200,
        productValue: '3个月VIP会员',
        stock: -1,
        imageUrl: '',
        description: '超值季卡，比月卡更划算',
      },
      {
        productId: 'vip-year',
        productName: 'VIP年卡',
        productType: 'vip',
        pointsRequired: 4000,
        productValue: '12个月VIP会员',
        stock: -1,
        imageUrl: '',
        description: '年度会员，尊享全年特权',
      },
    ];
  } finally {
    loading.value = false;
  }
}

/** 关闭弹窗 */
function closeDialog() {
  confirmDialogVisible.value = false;
}

onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <div class="points-exchange-panel">
    <div class="exchange-header">
      <h3>积分兑换</h3>
      <div class="balance-info">
        <el-icon><Coin /></el-icon>
        <span class="balance-value">{{ pointsBalance }}</span>
        <span class="balance-label">可用积分</span>
      </div>
    </div>

    <div
      v-loading="loading"
      class="product-list"
    >
      <div
        v-for="product in products"
        :key="product.productId"
        class="product-card"
        :class="{ 'out-of-stock': product.stock === 0 }"
      >
        <div class="product-image">
          <el-image
            :src="product.imageUrl || getDefaultImage(product.productType)"
            fit="cover"
          >
            <template #error>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <el-tag
            v-if="product.stock === 0"
            type="info"
            class="stock-tag"
          >
            已售罄
          </el-tag>
          <el-tag
            v-else-if="product.stock > 0 && product.stock <= 10"
            type="warning"
            class="stock-tag"
          >
            仅剩{{ product.stock }}件
          </el-tag>
        </div>
        <div class="product-info">
          <h4 class="product-name">
            {{ product.productName }}
          </h4>
          <p class="product-desc">
            {{ product.description }}
          </p>
          <div class="product-footer">
            <span class="points-required">
              <el-icon><Coin /></el-icon>
              {{ product.pointsRequired }}积分
            </span>
            <el-button
              type="primary"
              size="small"
              :disabled="!canExchange(product)"
              @click="handleExchange(product)"
            >
              {{ getButtonText(product) }}
            </el-button>
          </div>
        </div>
      </div>

      <el-empty
        v-if="!loading && products.length === 0"
        description="暂无可兑换商品"
      />
    </div>

    <div class="exchange-rules">
      <h4>
        <el-icon><InfoFilled /></el-icon>
        兑换规则
      </h4>
      <ul>
        <li>积分有效期为获取后12个月，请及时使用</li>
        <li>兑换VIP会员即时生效，有效期自动叠加</li>
        <li>实物礼品需填写收货地址，7个工作日内发货</li>
        <li>兑换失败将自动退回积分</li>
        <li>如有疑问请联系客服</li>
      </ul>
    </div>

    <el-dialog
      v-model="confirmDialogVisible"
      title="确认兑换"
      width="400px"
      :close-on-click-modal="false"
    >
      <div
        v-if="selectedProduct"
        class="confirm-content"
      >
        <div class="confirm-product">
          <el-image
            :src="selectedProduct.imageUrl || getDefaultImage(selectedProduct.productType)"
            fit="cover"
            class="confirm-image"
          />
          <div class="confirm-info">
            <h4>
              {{ selectedProduct.productName }}
            </h4>
            <p class="confirm-points">
              <el-icon><Coin /></el-icon>
              {{ selectedProduct.pointsRequired }}积分
            </p>
          </div>
        </div>

        <el-form
          v-if="selectedProduct.productType === 'gift'"
          ref="addressFormRef"
          :model="addressForm"
          :rules="addressRules"
          class="address-form"
        >
          <el-form-item
            label="收货地址"
            prop="address"
          >
            <el-input
              v-model="addressForm.address"
              type="textarea"
              :rows="3"
              placeholder="请输入详细收货地址"
            />
          </el-form-item>
        </el-form>

        <div class="confirm-summary">
          <p>
            <span>当前积分</span>
            <span class="value">{{ pointsBalance }}</span>
          </p>
          <p>
            <span>消耗积分</span>
            <span class="value cost">-{{ selectedProduct.pointsRequired }}</span>
          </p>
          <p class="total">
            <span>兑换后积分</span>
            <span class="value">{{ pointsBalance - selectedProduct.pointsRequired }}</span>
          </p>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeDialog">
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

<style scoped lang="scss">
.points-exchange-panel {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
}

.exchange-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .balance-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
    border-radius: 20px;

    .el-icon {
      color: #fbbf24;
      font-size: 20px;
    }

    .balance-value {
      font-size: 20px;
      font-weight: 700;
      color: #f59e0b;
    }

    .balance-label {
      font-size: 14px;
      color: #666;
    }
  }
}

.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
  min-height: 200px;
}

.product-card {
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &.out-of-stock {
    opacity: 0.6;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  .product-image {
    position: relative;
    height: 160px;

    .el-image {
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

      .el-icon {
        font-size: 48px;
        color: #c0c4cc;
      }
    }

    .stock-tag {
      position: absolute;
      top: 8px;
      right: 8px;
    }
  }

  .product-info {
    padding: 16px;

    .product-name {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .product-desc {
      margin: 0 0 12px 0;
      font-size: 13px;
      color: #999;
      line-height: 1.5;
    }

    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .points-required {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 16px;
        font-weight: 600;
        color: #f59e0b;

        .el-icon {
          font-size: 18px;
        }
      }
    }
  }
}

.exchange-rules {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;

  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;

    .el-icon {
      color: #409eff;
    }
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      font-size: 13px;
      color: #666;
      line-height: 1.8;
    }
  }
}

.confirm-content {
  .confirm-product {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 16px;

    .confirm-image {
      width: 80px;
      height: 80px;
      border-radius: 8px;
    }

    .confirm-info {
      flex: 1;

      h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .confirm-points {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #f59e0b;
      }
    }
  }

  .address-form {
    margin-bottom: 16px;
  }

  .confirm-summary {
    padding: 16px;
    background: #fafafa;
    border-radius: 8px;

    p {
      display: flex;
      justify-content: space-between;
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #666;

      &:last-child {
        margin-bottom: 0;
      }

      .value {
        font-weight: 600;
        color: #333;

        &.cost {
          color: #f56c6c;
        }
      }

      &.total {
        padding-top: 8px;
        border-top: 1px dashed #e8e8e8;
        font-weight: 600;

        .value {
          color: #67c23a;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .exchange-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .product-list {
    grid-template-columns: 1fr;
  }
}
</style>
