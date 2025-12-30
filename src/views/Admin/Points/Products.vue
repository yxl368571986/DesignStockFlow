<template>
  <div class="points-products-page">
    <div class="page-header">
      <h2>商城商品管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增商品</el-button>
    </div>

    <!-- 商品列表 -->
    <el-card class="products-card">
      <el-table :data="productsList" v-loading="loading" stripe>
        <el-table-column prop="imageUrl" label="商品图片" width="100">
          <template #default="{ row }">
            <el-image :src="row.imageUrl || 'https://picsum.photos/100/100'" style="width: 60px; height: 60px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" min-width="150" />
        <el-table-column prop="productType" label="商品分类" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.productType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pointsRequired" label="所需积分" width="100" align="center">
          <template #default="{ row }">
            <span class="points-text">{{ row.pointsRequired }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" align="center">
          <template #default="{ row }">
            {{ row.stock === -1 ? '无限' : row.stock }}
          </template>
        </el-table-column>
        <el-table-column prop="exchangeCount" label="已兑换" width="80" align="center">
          <template #default="{ row }">
            {{ row.exchangeCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商品' : '新增商品'" width="600px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="商品名称" prop="productName">
          <el-input v-model="formData.productName" placeholder="请输入商品名称，如：VIP月卡、10元优惠券" />
        </el-form-item>
        <el-form-item label="商品代码" prop="productCode">
          <el-input 
            v-model="formData.productCode" 
            placeholder="请输入唯一标识，如：vip_month、coupon_10" 
            :disabled="isEdit"
          />
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            商品代码是系统内部唯一标识，建议使用英文+下划线，如：vip_month、download_10、coupon_50
          </div>
        </el-form-item>
        <el-form-item label="商品分类" prop="productType">
          <el-select v-model="formData.productType" placeholder="请选择商品分类" style="width: 100%">
            <el-option label="虚拟商品" value="virtual" />
            <el-option label="实物商品" value="physical" />
            <el-option label="优惠券" value="coupon" />
            <el-option label="会员特权" value="vip" />
          </el-select>
        </el-form-item>
        <el-form-item label="所需积分" prop="pointsRequired">
          <el-input-number v-model="formData.pointsRequired" :min="1" :max="100000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="商品价值" prop="productValue">
          <el-input v-model="formData.productValue" placeholder="如：10元、VIP月卡等" />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input-number v-model="formData.stock" :min="-1" :max="999999" style="width: 100%" />
          <div class="form-tip">-1 表示无限库存</div>
        </el-form-item>
        <el-form-item label="商品图片" prop="imageUrl">
          <div class="upload-container">
            <el-upload
              class="product-uploader"
              :action="uploadAction"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :before-upload="beforeUpload"
              accept="image/*"
            >
              <img v-if="formData.imageUrl" :src="formData.imageUrl" class="product-image" />
              <div v-else class="upload-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <div class="upload-text">点击上传图片</div>
                <div class="upload-tip">建议尺寸：280x180px，支持JPG/PNG格式</div>
              </div>
            </el-upload>
            <el-input 
              v-model="formData.imageUrl" 
              placeholder="或直接输入图片URL" 
              style="margin-top: 8px"
            />
          </div>
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入商品描述" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" :max="9999" style="width: 100%" />
          <div class="form-tip">数值越小排序越靠前</div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
          <span class="status-text">{{ formData.status === 1 ? '上架中' : '已下架' }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 商城商品管理页面
 * 管理积分商城中的可兑换商品
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/pinia/userStore'
import { 
  getAdminPointsProducts, 
  createPointsProduct, 
  updatePointsProduct, 
  deletePointsProduct,
  type PointsProduct 
} from '@/api/points'

const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const productsList = ref<PointsProduct[]>([])

const formData = reactive({
  productId: '',
  productName: '',
  productCode: '',
  productType: '',
  pointsRequired: 100,
  productValue: '',
  stock: 100,
  imageUrl: '',
  description: '',
  sortOrder: 0,
  status: 1
})

// 上传配置
const uploadAction = computed(() => {
  return `${import.meta.env.VITE_API_BASE_URL}/api/v1/upload/image`
})

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${userStore.token}`
  }
})

// 商品代码验证规则
const validateProductCode = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入商品代码'))
    return
  }
  // 只允许英文、数字、下划线
  const pattern = /^[a-zA-Z][a-zA-Z0-9_]*$/
  if (!pattern.test(value)) {
    callback(new Error('商品代码只能包含英文字母、数字和下划线，且必须以字母开头'))
    return
  }
  callback()
}

const formRules: FormRules = {
  productName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  productCode: [
    { required: true, message: '请输入商品代码', trigger: 'blur' },
    { validator: validateProductCode, trigger: 'blur' }
  ],
  productType: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  pointsRequired: [{ required: true, message: '请输入所需积分', trigger: 'blur' }]
}

/** 加载商品列表 */
async function loadProducts() {
  loading.value = true
  try {
    const res = await getAdminPointsProducts()
    if (res.code === 200 || res.code === 0) {
      productsList.value = res.data || []
    } else {
      ElMessage.error(res.msg || res.message || '加载商品列表失败')
    }
  } catch (error) {
    console.error('加载商品列表失败:', error)
    ElMessage.error('加载商品列表失败')
  } finally {
    loading.value = false
  }
}

// 图片上传成功
const handleUploadSuccess = (response: { code: number; data?: { url: string }; msg?: string }) => {
  if (response.code === 200 && response.data?.url) {
    formData.imageUrl = response.data.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.msg || '图片上传失败')
  }
}

// 图片上传失败
const handleUploadError = () => {
  ElMessage.error('图片上传失败，请重试')
}

// 上传前验证
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB')
    return false
  }
  return true
}

// 生成商品代码建议
const generateProductCode = (name: string, type: string): string => {
  const typePrefix: Record<string, string> = {
    virtual: 'virtual',
    physical: 'physical',
    coupon: 'coupon',
    vip: 'vip'
  }
  const prefix = typePrefix[type] || 'product'
  const timestamp = Date.now().toString(36)
  return `${prefix}_${timestamp}`
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(formData, { 
    productId: '', 
    productName: '', 
    productCode: '', 
    productType: '', 
    pointsRequired: 100, 
    productValue: '', 
    stock: 100, 
    imageUrl: '', 
    description: '', 
    sortOrder: 0, 
    status: 1 
  })
  dialogVisible.value = true
}

const handleEdit = (row: PointsProduct) => {
  isEdit.value = true
  Object.assign(formData, {
    productId: row.productId,
    productName: row.productName,
    productCode: row.productCode,
    productType: row.productType,
    pointsRequired: row.pointsRequired,
    productValue: row.productValue,
    stock: row.stock,
    imageUrl: row.imageUrl,
    description: row.description,
    sortOrder: row.sortOrder,
    status: row.status
  })
  dialogVisible.value = true
}

const handleDelete = async (row: PointsProduct) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？删除后不可恢复。', '提示', { type: 'warning' })
    const res = await deletePointsProduct(row.productId)
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('删除成功')
      await loadProducts()
    } else {
      ElMessage.error(res.msg || res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleStatusChange = async (row: PointsProduct) => {
  try {
    const res = await updatePointsProduct(row.productId, { status: row.status })
    if (res.code === 200 || res.code === 0) {
      ElMessage.success(`商品已${row.status === 1 ? '上架' : '下架'}`)
    } else {
      // 恢复原状态
      row.status = row.status === 1 ? 0 : 1
      ElMessage.error(res.msg || res.message || '操作失败')
    }
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1
    console.error('状态更新失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  
  // 如果没有填写商品代码，自动生成一个
  if (!formData.productCode && !isEdit.value) {
    formData.productCode = generateProductCode(formData.productName, formData.productType)
  }
  
  submitting.value = true
  try {
    const data = {
      productName: formData.productName,
      productCode: formData.productCode,
      productType: formData.productType,
      pointsRequired: formData.pointsRequired,
      productValue: formData.productValue || undefined,
      stock: formData.stock,
      imageUrl: formData.imageUrl || 'https://picsum.photos/280/180',
      description: formData.description || undefined,
      sortOrder: formData.sortOrder,
      status: formData.status
    }
    
    let res
    if (isEdit.value) {
      res = await updatePointsProduct(formData.productId, data)
    } else {
      res = await createPointsProduct(data)
    }
    
    if (res.code === 200 || res.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      await loadProducts()
    } else {
      ElMessage.error(res.msg || res.message || '操作失败')
    }
  } catch (error: unknown) {
    console.error('提交失败:', error)
    const errorMessage = error instanceof Error ? error.message : '操作失败'
    ElMessage.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped lang="scss">
.points-products-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    h2 { margin: 0; font-size: 20px; }
  }
  .products-card { margin-bottom: 20px; }
  .points-text { color: #ff7d00; font-weight: 600; }
  .form-tip { 
    font-size: 12px; 
    color: #909399; 
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .status-text {
    margin-left: 8px;
    font-size: 13px;
    color: #606266;
  }
  
  .upload-container {
    width: 100%;
  }
  
  .product-uploader {
    :deep(.el-upload) {
      width: 280px;
      height: 180px;
      border: 1px dashed #d9d9d9;
      border-radius: 8px;
      cursor: pointer;
      overflow: hidden;
      transition: border-color 0.3s;
      
      &:hover {
        border-color: #409eff;
      }
    }
  }
  
  .product-image {
    width: 280px;
    height: 180px;
    object-fit: cover;
  }
  
  .upload-placeholder {
    width: 280px;
    height: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    
    .upload-icon {
      font-size: 32px;
      color: #c0c4cc;
      margin-bottom: 8px;
    }
    
    .upload-text {
      font-size: 14px;
      color: #606266;
      margin-bottom: 4px;
    }
    
    .upload-tip {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
