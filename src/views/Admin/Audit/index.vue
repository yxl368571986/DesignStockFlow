<!--
  内容审核页面
  
  功能：
  - 显示待审核资源列表
  - 按提交时间倒序排列
  - 显示资源缩略图、标题、上传者、提交时间
  - 支持审核操作（通过/驳回）
  - 支持筛选和批量操作
  
  需求: 需求13.1, 需求13.2, 需求13.3, 需求13.4, 需求13.5, 需求13.6, 需求13.7, 需求13.8, 需求13.9, 需求13.10, 需求13.11, 需求13.12
-->

<template>
  <div class="audit-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">内容审核</h2>
      <div class="page-actions">
        <el-badge :value="pendingCount" :hidden="pendingCount === 0" class="badge">
          <el-button type="primary" :icon="Refresh" @click="loadResources">
            刷新列表
          </el-button>
        </el-badge>
      </div>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="分类">
          <el-select
            v-model="filterForm.categoryId"
            placeholder="全部分类"
            clearable
            style="width: 150px"
            @change="handleFilter"
          >
            <el-option
              v-for="category in categories"
              :key="category.categoryId"
              :label="category.categoryName"
              :value="category.categoryId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="上传者">
          <el-input
            v-model="filterForm.uploader"
            placeholder="输入上传者昵称"
            clearable
            style="width: 200px"
            @clear="handleFilter"
            @keyup.enter="handleFilter"
          >
            <template #append>
              <el-button :icon="Search" @click="handleFilter" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="提交时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="handleFilter"
          />
        </el-form-item>

        <el-form-item>
          <el-button @click="handleResetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作栏 -->
    <el-card v-if="selectedResources.length > 0" class="batch-actions-card" shadow="never">
      <div class="batch-actions">
        <span class="selected-count">已选择 {{ selectedResources.length }} 项</span>
        <div class="actions">
          <el-button type="success" :icon="Select" @click="handleBatchApprove">
            批量通过
          </el-button>
          <el-button type="danger" :icon="Close" @click="handleBatchReject">
            批量驳回
          </el-button>
          <el-button @click="handleClearSelection">取消选择</el-button>
        </div>
      </div>
    </el-card>

    <!-- 资源列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="resources"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="资源信息" min-width="300">
          <template #default="{ row }">
            <div class="resource-info">
              <el-image
                :src="row.cover"
                fit="cover"
                class="resource-cover"
                :preview-src-list="[row.cover]"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="resource-details">
                <div class="resource-title">{{ row.title }}</div>
                <div class="resource-meta">
                  <el-tag size="small" type="info">{{ row.category?.category_name || '未分类' }}</el-tag>
                  <span class="meta-item">
                    <el-icon><Document /></el-icon>
                    {{ row.file_format }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Files /></el-icon>
                    {{ formatFileSize(row.file_size) }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="上传者" width="150">
          <template #default="{ row }">
            <div class="uploader-info">
              <el-avatar :src="row.user?.avatar" :size="32">
                {{ row.user?.nickname?.charAt(0) }}
              </el-avatar>
              <span class="uploader-name">{{ row.user?.nickname }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="View"
              @click="handleViewDetail(row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadResources"
          @current-change="loadResources"
        />
      </div>
    </el-card>

    <!-- 资源详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="资源详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="currentResource" class="resource-detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3 class="section-title">基本信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="资源标题">
              {{ currentResource.title }}
            </el-descriptions-item>
            <el-descriptions-item label="资源分类">
              {{ currentResource.category?.category_name || '未分类' }}
            </el-descriptions-item>
            <el-descriptions-item label="文件格式">
              {{ currentResource.file_format }}
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              {{ formatFileSize(currentResource.file_size) }}
            </el-descriptions-item>
            <el-descriptions-item label="上传者">
              {{ currentResource.user?.nickname }}
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">
              {{ formatDate(currentResource.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="资源描述" :span="2">
              {{ currentResource.description || '无描述' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 预览图片 -->
        <div class="detail-section">
          <h3 class="section-title">预览图片</h3>
          <div class="preview-images">
            <el-image
              v-for="(img, index) in getPreviewImages(currentResource)"
              :key="index"
              :src="img"
              fit="cover"
              class="preview-image"
              :preview-src-list="getPreviewImages(currentResource)"
              :initial-index="index"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>
        </div>

        <!-- 审核操作 -->
        <div class="detail-section">
          <h3 class="section-title">审核操作</h3>
          <div class="audit-actions">
            <el-button
              type="success"
              size="large"
              :icon="Select"
              @click="handleApprove(currentResource)"
            >
              审核通过
            </el-button>
            <el-button
              type="danger"
              size="large"
              :icon="Close"
              @click="handleReject(currentResource)"
            >
              审核驳回
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 驳回原因对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="审核驳回"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectFormRef">
        <el-form-item label="驳回原因" prop="reason">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="5"
            placeholder="请输入驳回原因，将通知给上传者"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="handleConfirmReject">
          确认驳回
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
  Refresh,
  Search,
  Select,
  Close,
  View,
  Picture,
  Document,
  Files
} from '@element-plus/icons-vue';
import { getAuditResources, auditResource } from '@/api/audit';
import { getCategories } from '@/api/content';
import type { AuditResource, Category } from '@/types/models';

// 加载状态
const loading = ref(false);
const submitting = ref(false);

// 待审核资源列表
const resources = ref<AuditResource[]>([]);
const pendingCount = computed(() => resources.value.length);

// 分类列表
const categories = ref<Category[]>([]);

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

// 筛选表单
const filterForm = reactive({
  categoryId: '',
  uploader: '',
  dateRange: [] as string[]
});

// 选中的资源
const selectedResources = ref<AuditResource[]>([]);

// 详情对话框
const detailDialogVisible = ref(false);
const currentResource = ref<AuditResource | null>(null);

// 驳回对话框
const rejectDialogVisible = ref(false);
const rejectFormRef = ref<FormInstance>();
const rejectForm = reactive({
  reason: ''
});
const rejectRules: FormRules = {
  reason: [
    { required: true, message: '请输入驳回原因', trigger: 'blur' },
    { min: 5, message: '驳回原因至少5个字符', trigger: 'blur' }
  ]
};

// 当前操作的资源（用于单个驳回）
const currentRejectResource = ref<AuditResource | null>(null);
// 批量驳回标记
const isBatchReject = ref(false);

/**
 * 加载待审核资源列表
 */
const loadResources = async () => {
  try {
    loading.value = true;
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };

    // 添加筛选条件
    if (filterForm.categoryId) {
      params.categoryId = filterForm.categoryId;
    }
    if (filterForm.uploader) {
      params.uploader = filterForm.uploader;
    }
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startDate = filterForm.dateRange[0];
      params.endDate = filterForm.dateRange[1];
    }

    const res = await getAuditResources(params);
    resources.value = res.data?.list || [];
    pagination.total = res.data?.pagination?.total || 0;
  } catch (error: any) {
    ElMessage.error(error.message || '加载待审核资源失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 加载分类列表
 */
const loadCategories = async () => {
  try {
    const res = await getCategories();
    // res是AxiosResponse，res.data是ApiResponse，res.data.data才是实际数据
    const responseData = res.data as any;
    const categoryList = responseData.code === 200 && responseData.data 
      ? (Array.isArray(responseData.data) ? responseData.data : [])
      : [];
    // 转换CategoryInfo到Category格式
    categories.value = categoryList.map((cat: any) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      categoryCode: cat.categoryCode,
      parentId: cat.parentId,
      icon: cat.icon,
      sortOrder: cat.sort,
      isHot: cat.isHot,
      isRecommend: cat.isRecommend,
      resourceCount: cat.resourceCount
    }));
  } catch (error: any) {
    console.error('加载分类失败:', error);
    categories.value = [];
  }
};

/**
 * 处理筛选
 */
const handleFilter = () => {
  pagination.page = 1;
  loadResources();
};

/**
 * 重置筛选
 */
const handleResetFilter = () => {
  filterForm.categoryId = '';
  filterForm.uploader = '';
  filterForm.dateRange = [];
  handleFilter();
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: AuditResource[]) => {
  selectedResources.value = selection;
};

/**
 * 清除选择
 */
const handleClearSelection = () => {
  selectedResources.value = [];
};

/**
 * 查看详情
 */
const handleViewDetail = (resource: AuditResource) => {
  currentResource.value = resource;
  detailDialogVisible.value = true;
};

/**
 * 审核通过
 */
const handleApprove = async (resource: AuditResource) => {
  try {
    await ElMessageBox.confirm(
      `确认通过资源《${resource.title}》的审核吗？`,
      '审核通过',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success'
      }
    );

    submitting.value = true;
    await auditResource(resource.resource_id, {
      action: 'approve'
    });

    ElMessage.success('审核通过成功');
    detailDialogVisible.value = false;
    loadResources();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '审核通过失败');
    }
  } finally {
    submitting.value = false;
  }
};

/**
 * 审核驳回
 */
const handleReject = (resource: AuditResource) => {
  currentRejectResource.value = resource;
  isBatchReject.value = false;
  rejectForm.reason = '';
  rejectDialogVisible.value = true;
};

/**
 * 确认驳回
 */
const handleConfirmReject = async () => {
  if (!rejectFormRef.value) return;

  try {
    await rejectFormRef.value.validate();
    submitting.value = true;

    if (isBatchReject.value) {
      // 批量驳回
      await Promise.all(
        selectedResources.value.map(resource =>
          auditResource(resource.resource_id, {
            action: 'reject',
            reason: rejectForm.reason
          })
        )
      );
      ElMessage.success(`成功驳回 ${selectedResources.value.length} 个资源`);
      selectedResources.value = [];
    } else {
      // 单个驳回
      if (currentRejectResource.value) {
        await auditResource(currentRejectResource.value.resource_id, {
          action: 'reject',
          reason: rejectForm.reason
        });
        ElMessage.success('审核驳回成功');
      }
    }

    rejectDialogVisible.value = false;
    detailDialogVisible.value = false;
    loadResources();
  } catch (error: any) {
    ElMessage.error(error.message || '审核驳回失败');
  } finally {
    submitting.value = false;
  }
};

/**
 * 批量通过
 */
const handleBatchApprove = async () => {
  if (selectedResources.value.length === 0) {
    ElMessage.warning('请先选择要审核的资源');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确认通过选中的 ${selectedResources.value.length} 个资源的审核吗？`,
      '批量审核通过',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success'
      }
    );

    submitting.value = true;
    await Promise.all(
      selectedResources.value.map(resource =>
        auditResource(resource.resource_id, {
          action: 'approve'
        })
      )
    );

    ElMessage.success(`成功通过 ${selectedResources.value.length} 个资源`);
    selectedResources.value = [];
    loadResources();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量审核通过失败');
    }
  } finally {
    submitting.value = false;
  }
};

/**
 * 批量驳回
 */
const handleBatchReject = () => {
  if (selectedResources.value.length === 0) {
    ElMessage.warning('请先选择要驳回的资源');
    return;
  }

  isBatchReject.value = true;
  rejectForm.reason = '';
  rejectDialogVisible.value = true;
};

/**
 * 获取预览图片列表
 */
const getPreviewImages = (resource: AuditResource): string[] => {
  const images: string[] = [];
  
  // 添加封面图
  if (resource.cover) {
    images.push(resource.cover);
  }
  
  // 添加预览图数组
  if (resource.preview_images && Array.isArray(resource.preview_images)) {
    images.push(...resource.preview_images);
  }
  
  return images;
};

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * 格式化日期
 */
const formatDate = (date: string): string => {
  if (!date) return '-';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

// 初始化
onMounted(() => {
  loadResources();
  loadCategories();
});
</script>

<style scoped lang="scss">
.audit-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .page-actions {
      .badge {
        :deep(.el-badge__content) {
          background: #ff7d00;
        }
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;

    .filter-form {
      margin-bottom: 0;

      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }
  }

  .batch-actions-card {
    margin-bottom: 20px;
    background: #f0f9ff;
    border-color: #91d5ff;

    .batch-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .selected-count {
        font-size: 14px;
        color: #165dff;
        font-weight: 500;
      }

      .actions {
        display: flex;
        gap: 12px;
      }
    }
  }

  .table-card {
    .resource-info {
      display: flex;
      gap: 12px;

      .resource-cover {
        width: 80px;
        height: 80px;
        border-radius: 4px;
        flex-shrink: 0;
        cursor: pointer;

        .image-error {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f7fa;
          color: #c0c4cc;
          font-size: 24px;
        }
      }

      .resource-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;

        .resource-title {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }

        .resource-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #999;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }

    .uploader-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .uploader-name {
        font-size: 14px;
        color: #333;
      }
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .resource-detail {
    .detail-section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0 0 16px 0;
        padding-bottom: 8px;
        border-bottom: 2px solid #165dff;
      }

      .preview-images {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;

        .preview-image {
          width: 100%;
          height: 150px;
          border-radius: 4px;
          cursor: pointer;

          .image-error {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f7fa;
            color: #c0c4cc;
            font-size: 32px;
          }
        }
      }

      .audit-actions {
        display: flex;
        gap: 16px;
        justify-content: center;
      }
    }
  }
}

// 暗黑模式
:global(.dark) {
  .audit-page {
    .page-header {
      .page-title {
        color: #e0e0e0;
      }
    }

    .batch-actions-card {
      background: #1e3a5f;
      border-color: #2a5a8f;

      .selected-count {
        color: #4a9eff;
      }
    }

    .resource-info {
      .resource-details {
        .resource-title {
          color: #e0e0e0;
        }
      }
    }

    .uploader-info {
      .uploader-name {
        color: #e0e0e0;
      }
    }

    .resource-detail {
      .detail-section {
        .section-title {
          color: #e0e0e0;
          border-color: #4a9eff;
        }
      }
    }
  }
}
</style>
