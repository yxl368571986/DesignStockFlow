<script setup lang="ts">
/**
 * 充值套餐管理页面
 * 管理充值套餐的创建、编辑、排序和启用/禁用
 */
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Refresh, Rank, Check, Close } from '@element-plus/icons-vue';
import {
  getAllPackages,
  createPackage,
  updatePackage,
  disablePackage,
  type PackageFormData
} from '@/api/adminRecharge';
import type { RechargePackage } from '@/api/recharge';

// 套餐列表
const packages = ref<RechargePackage[]>([]);
const loading = ref(false);

// 对话框状态
const dialogVisible = ref(false);
const dialogTitle = ref('新增套餐');
const editingPackageId = ref<string | null>(null);
const formRef = ref();
const submitting = ref(false);

// 表单数据
const formData = reactive<PackageFormData>({
  packageName: '',
  packageCode: '',
  price: 10,
  basePoints: 100,
  bonusPoints: 0,
  sortOrder: 0,
  isRecommend: false,
  status: 1
});

// 表单验证规则
const formRules = {
  packageName: [
    { required: true, message: '请输入套餐名称', trigger: 'blur' },
    { min: 2, max: 20, message: '套餐名称长度为2-20个字符', trigger: 'blur' }
  ],
  packageCode: [
    { required: true, message: '请输入套餐编码', trigger: 'blur' },
    { pattern: /^[A-Z0-9_]+$/, message: '套餐编码只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  basePoints: [{ required: true, message: '请输入基础积分', trigger: 'blur' }]
};

// 计算总积分
const totalPoints = computed(() => formData.basePoints + formData.bonusPoints);

// 计算性价比
const valuePerYuan = computed(() => {
  if (formData.price <= 0) return 0;
  return Math.round(totalPoints.value / formData.price * 10) / 10;
});

/** 加载套餐列表 */
async function loadPackages(): Promise<void> {
  loading.value = true;
  try {
    const res = await getAllPackages();
    if (res.code === 200 || res.code === 0) {
      packages.value = res.data || [];
    } else {
      ElMessage.error(res.message || '加载套餐失败');
    }
  } catch (error) {
    console.error('加载套餐失败:', error);
    ElMessage.error('加载套餐失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

/** 打开新增对话框 */
function handleAdd(): void {
  editingPackageId.value = null;
  dialogTitle.value = '新增套餐';
  Object.assign(formData, {
    packageName: '', packageCode: '', price: 10, basePoints: 100,
    bonusPoints: 0, sortOrder: packages.value.length, isRecommend: false, status: 1
  });
  dialogVisible.value = true;
}

/** 打开编辑对话框 */
function handleEdit(pkg: RechargePackage): void {
  editingPackageId.value = pkg.packageId;
  dialogTitle.value = '编辑套餐';
  Object.assign(formData, {
    packageName: pkg.packageName, packageCode: pkg.packageCode, price: pkg.price,
    basePoints: pkg.basePoints, bonusPoints: pkg.bonusPoints, sortOrder: pkg.sortOrder,
    isRecommend: pkg.isRecommend, status: pkg.status
  });
  dialogVisible.value = true;
}

/** 保存套餐 */
async function handleSave(): Promise<void> {
  try {
    await formRef.value?.validate();
    submitting.value = true;
    if (editingPackageId.value) {
      const res = await updatePackage(editingPackageId.value, formData);
      if (res.code === 200 || res.code === 0) {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        await loadPackages();
      } else {
        ElMessage.error(res.message || '更新失败');
      }
    } else {
      const res = await createPackage(formData);
      if (res.code === 200 || res.code === 0) {
        ElMessage.success('创建成功');
        dialogVisible.value = false;
        await loadPackages();
      } else {
        ElMessage.error(res.message || '创建失败');
      }
    }
  } catch (error) {
    console.error('保存套餐失败:', error);
  } finally {
    submitting.value = false;
  }
}

/** 禁用套餐 */
async function handleDisable(pkg: RechargePackage): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定要禁用套餐「${pkg.packageName}」吗？`, '禁用确认', { type: 'warning' });
    const res = await disablePackage(pkg.packageId);
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('禁用成功');
      await loadPackages();
    } else {
      ElMessage.error(res.message || '禁用失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('禁用套餐失败:', error);
    }
  }
}

/** 启用套餐 */
async function handleEnable(pkg: RechargePackage): Promise<void> {
  try {
    const res = await updatePackage(pkg.packageId, { status: 1 });
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('启用成功');
      await loadPackages();
    } else {
      ElMessage.error(res.message || '启用失败');
    }
  } catch (error) {
    console.error('启用套餐失败:', error);
  }
}

onMounted(() => { loadPackages(); });
</script>

<template>
  <div class="package-management">
    <div class="page-header">
      <h2 class="page-title">充值套餐管理</h2>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="loadPackages">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增套餐</el-button>
      </div>
    </div>
    <div class="package-list" v-loading="loading">
      <el-table :data="packages" stripe border>
        <el-table-column prop="sortOrder" label="排序" width="70" align="center">
          <template #default="{ row }">
            <el-icon class="drag-handle" :size="16"><Rank /></el-icon>{{ row.sortOrder }}
          </template>
        </el-table-column>
        <el-table-column prop="packageName" label="套餐名称" width="120" />
        <el-table-column prop="packageCode" label="套餐编码" width="120" />
        <el-table-column label="价格" width="100" align="right">
          <template #default="{ row }"><span class="price">¥{{ row.price }}</span></template>
        </el-table-column>
        <el-table-column label="基础积分" width="100" align="right">
          <template #default="{ row }">{{ row.basePoints }}</template>
        </el-table-column>
        <el-table-column label="赠送积分" width="100" align="right">
          <template #default="{ row }"><span class="bonus">+{{ row.bonusPoints }}</span></template>
        </el-table-column>
        <el-table-column label="总积分" width="100" align="right">
          <template #default="{ row }"><span class="total-points">{{ row.totalPoints }}</span></template>
        </el-table-column>
        <el-table-column label="性价比" width="100" align="center">
          <template #default="{ row }"><span class="value-ratio">{{ row.valuePerYuan }} 积分/元</span></template>
        </el-table-column>
        <el-table-column label="推荐" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isRecommend" type="warning" size="small">推荐</el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 1" type="danger" link :icon="Close" @click="handleDisable(row)">禁用</el-button>
            <el-button v-else type="success" link :icon="Check" @click="handleEnable(row)">启用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="套餐名称" prop="packageName">
          <el-input v-model="formData.packageName" placeholder="如：基础套餐" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="套餐编码" prop="packageCode">
          <el-input v-model="formData.packageCode" placeholder="如：BASIC_10" :disabled="!!editingPackageId" />
          <div class="form-tip">套餐编码创建后不可修改</div>
        </el-form-item>
        <el-form-item label="价格(元)" prop="price">
          <el-input-number v-model="formData.price" :min="1" :max="9999" :precision="0" />
        </el-form-item>
        <el-form-item label="基础积分" prop="basePoints">
          <el-input-number v-model="formData.basePoints" :min="1" :max="99999" :precision="0" />
          <div class="form-tip">建议：基础积分 = 价格 × 10</div>
        </el-form-item>
        <el-form-item label="赠送积分" prop="bonusPoints">
          <el-input-number v-model="formData.bonusPoints" :min="0" :max="99999" :precision="0" />
        </el-form-item>
        <el-form-item label="总积分">
          <div class="total-display">
            <span class="total-value">{{ totalPoints }}</span>
            <span class="total-label">积分</span>
            <span class="value-display">({{ valuePerYuan }} 积分/元)</span>
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formData.sortOrder" :min="0" :max="999" />
          <div class="form-tip">数字越小越靠前</div>
        </el-form-item>
        <el-form-item label="推荐套餐"><el-switch v-model="formData.isRecommend" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="formData.status" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.package-management { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
.header-actions { display: flex; gap: 12px; }
.package-list { background: #fff; border-radius: 8px; padding: 16px; }
.drag-handle { cursor: move; color: #909399; margin-right: 8px; }
.price { font-weight: 600; color: #f56c6c; }
.bonus { color: #67c23a; }
.total-points { font-weight: 600; color: #409eff; }
.value-ratio { font-size: 12px; color: #67c23a; }
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; }
.total-display { display: flex; align-items: baseline; gap: 4px; }
.total-value { font-size: 24px; font-weight: 700; color: #409eff; }
.total-label { font-size: 14px; color: #606266; }
.value-display { font-size: 12px; color: #67c23a; margin-left: 8px; }
</style>
