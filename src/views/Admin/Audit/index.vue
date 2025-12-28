<template>
  <div class="audit-page">
    <div class="page-header">
      <h2 class="page-title">
        内容审核
      </h2>
      <div class="page-actions">
        <el-badge
          :value="pendingCount"
          :hidden="pendingCount === 0"
          class="badge"
        >
          <el-button
            type="primary"
            :icon="Refresh"
            @click="loadResources"
          >
            刷新列表
          </el-button>
        </el-badge>
      </div>
    </div>

    <el-card
      class="filter-card"
      shadow="never"
    >
      <el-form
        :inline="true"
        :model="filterForm"
        class="filter-form"
      >
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
              <el-button
                :icon="Search"
                @click="handleFilter"
              />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleResetFilter">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card
      v-if="selectedResources.length > 0"
      class="batch-actions-card"
      shadow="never"
    >
      <div class="batch-actions">
        <span class="selected-count">已选择 {{ selectedResources.length }} 项</span>
        <div class="actions">
          <el-button
            type="success"
            :icon="Select"
            @click="handleBatchApprove"
          >
            批量通过
          </el-button>
          <el-button
            type="danger"
            :icon="Close"
            @click="handleBatchReject"
          >
            批量驳回
          </el-button>
          <el-button @click="handleClearSelection">
            取消选择
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card
      class="table-card"
      shadow="never"
    >
      <el-table
        v-loading="loading"
        :data="resources"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          type="selection"
          width="55"
        />
        <el-table-column
          label="资源信息"
          min-width="300"
        >
          <template #default="{ row }">
            <div class="resource-info">
              <el-image
                :src="getFullImageUrl(row.thumbnail, row.resourceId)"
                fit="cover"
                class="resource-cover"
                :preview-src-list="row.thumbnail ? [getFullImageUrl(row.thumbnail, row.resourceId)] : []"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon>
                      <Picture />
                    </el-icon>
                  </div>
                </template>
              </el-image>
              <div class="resource-details">
                <div class="resource-title">
                  {{ row.title }}
                </div>
                <div class="resource-meta">
                  <el-tag
                    size="small"
                    type="info"
                  >
                    {{ row.fileFormat }}
                  </el-tag>
                  <span class="meta-item">
                    <el-icon>
                      <Document />
                    </el-icon>
                    {{ row.fileName }}
                  </span>
                  <span class="meta-item">
                    <el-icon>
                      <Files />
                    </el-icon>
                    {{ formatFileSize(row.fileSize) }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="上传者"
          width="150"
        >
          <template #default="{ row }">
            <div class="uploader-info">
              <el-avatar :size="32">
                {{ row.uploaderName?.charAt(0) || '?' }}
              </el-avatar>
              <span class="uploader-name">{{ row.uploaderName || '未知用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="提交时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.uploadTime) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="200"
          fixed="right"
        >
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

    <el-dialog
      v-model="detailDialogVisible"
      title="资源详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <div
        v-if="currentResource"
        class="resource-detail"
      >
        <div class="detail-section">
          <h3 class="section-title">
            基本信息
          </h3>
          <el-descriptions
            :column="2"
            border
          >
            <el-descriptions-item label="资源标题">
              {{ currentResource.title }}
            </el-descriptions-item>
            <el-descriptions-item label="文件名">
              {{ currentResource.fileName }}
            </el-descriptions-item>
            <el-descriptions-item label="文件格式">
              {{ currentResource.fileFormat }}
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              {{ formatFileSize(currentResource.fileSize) }}
            </el-descriptions-item>
            <el-descriptions-item label="上传者">
              {{ currentResource.uploaderName }}
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">
              {{ formatDate(currentResource.uploadTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div
          v-if="currentResource.thumbnail"
          class="detail-section"
        >
          <h3 class="section-title">
            预览图片
          </h3>
          <div class="preview-images">
            <el-image
              :src="getFullImageUrl(currentResource.thumbnail, currentResource.resourceId)"
              fit="cover"
              class="preview-image"
              :preview-src-list="[getFullImageUrl(currentResource.thumbnail, currentResource.resourceId)]"
            />
          </div>
        </div>
        <div
          v-if="currentResource.extractedFiles?.length"
          class="detail-section"
        >
          <h3 class="section-title">
            解压文件列表
          </h3>
          <el-table
            :data="currentResource.extractedFiles"
            size="small"
          >
            <el-table-column
              prop="fileName"
              label="文件名"
            />
            <el-table-column
              prop="fileFormat"
              label="格式"
              width="100"
            />
            <el-table-column
              label="大小"
              width="100"
            >
              <template #default="{ row }">
                {{ formatFileSize(row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column
              label="状态"
              width="100"
            >
              <template #default="{ row }">
                <el-tag
                  v-if="row.isIllegal"
                  type="danger"
                  size="small"
                >
                  非法
                </el-tag>
                <el-tag
                  v-else-if="row.isValid"
                  type="success"
                  size="small"
                >
                  有效
                </el-tag>
                <el-tag
                  v-else
                  type="warning"
                  size="small"
                >
                  无效
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="detail-section">
          <h3 class="section-title">
            审核操作
          </h3>
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

    <el-dialog
      v-model="rejectDialogVisible"
      title="审核驳回"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="rejectFormRef"
        :model="rejectForm"
        :rules="rejectRules"
      >
        <el-form-item
          label="驳回原因"
          prop="reason"
        >
          <el-select
            v-model="rejectForm.reasonCode"
            placeholder="选择驳回原因"
            style="width: 100%; margin-bottom: 12px"
          >
            <el-option
              v-for="reason in rejectReasons"
              :key="reason.code"
              :label="reason.label"
              :value="reason.code"
            />
          </el-select>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="5"
            placeholder="请输入驳回原因详情"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="danger"
          :loading="submitting"
          @click="handleConfirmReject"
        >
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
import {
  getAuditList,
  approveResource,
  rejectResource,
  batchApprove,
  batchReject,
  getRejectReasons,
  type AuditListItem,
  type RejectReason
} from '@/api/audit';
import { getCategories } from '@/api/content';
import type { Category } from '@/types/models';
import { getFullImageUrl } from '@/utils/url';

const loading = ref(false);
const submitting = ref(false);
const resources = ref<AuditListItem[]>([]);
const categories = ref<Category[]>([]);
const rejectReasons = ref<RejectReason[]>([]);
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const filterForm = reactive({ categoryId: '', uploader: '' });
const selectedResources = ref<AuditListItem[]>([]);
const detailDialogVisible = ref(false);
const currentResource = ref<AuditListItem | null>(null);
const rejectDialogVisible = ref(false);
const rejectFormRef = ref<FormInstance>();
const rejectForm = reactive({ reasonCode: '', reason: '' });
const rejectRules: FormRules = {
  reason: [
    { required: true, message: '请输入驳回原因', trigger: 'blur' },
    { min: 5, message: '驳回原因至少5个字符', trigger: 'blur' }
  ]
};
const currentRejectResource = ref<AuditListItem | null>(null);
const isBatchReject = ref(false);
const pendingCount = computed(() => pagination.total);

const loadResources = async () => {
  try {
    loading.value = true;
    const res = await getAuditList({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      uploaderId: filterForm.uploader || undefined
    });
    // 后端API使用 code: 0 表示成功
    if ((res.code === 200 || res.code === 0) && res.data) {
      resources.value = res.data.list || [];
      pagination.total = res.data.total || 0;
    } else {
      resources.value = [];
      pagination.total = 0;
    }
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(err.message || '加载待审核资源失败');
    resources.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const res = await getCategories();
    const responseData = res.data as { code?: number; data?: Category[] };
    const categoryList =
      responseData.code === 200 && responseData.data
        ? Array.isArray(responseData.data)
          ? responseData.data
          : []
        : [];
    categories.value = categoryList.map((cat) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      categoryCode: cat.categoryCode,
      parentId: cat.parentId,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
      isHot: cat.isHot,
      isRecommend: cat.isRecommend,
      resourceCount: cat.resourceCount
    }));
  } catch {
    categories.value = [];
  }
};

const loadRejectReasons = async () => {
  try {
    const res = await getRejectReasons();
    // 后端API使用 code: 0 表示成功
    if ((res.code === 200 || res.code === 0) && res.data) {
      rejectReasons.value = res.data;
    }
  } catch {
    rejectReasons.value = [
      { code: 'INVALID_FORMAT', label: '文件格式不符合要求' },
      { code: 'LOW_QUALITY', label: '资源质量不达标' },
      { code: 'DUPLICATE', label: '重复上传' },
      { code: 'ILLEGAL_CONTENT', label: '包含违规内容' },
      { code: 'CUSTOM', label: '其他原因' }
    ];
  }
};

const handleFilter = () => {
  pagination.page = 1;
  loadResources();
};

const handleResetFilter = () => {
  filterForm.categoryId = '';
  filterForm.uploader = '';
  handleFilter();
};

const handleSelectionChange = (selection: AuditListItem[]) => {
  selectedResources.value = selection;
};

const handleClearSelection = () => {
  selectedResources.value = [];
};

const handleViewDetail = (resource: AuditListItem) => {
  currentResource.value = resource;
  detailDialogVisible.value = true;
};

const handleApprove = async (resource: AuditListItem) => {
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
    await approveResource(resource.resourceId);
    ElMessage.success('审核通过成功');
    detailDialogVisible.value = false;
    loadResources();
  } catch (error: unknown) {
    if (error !== 'cancel') {
      const err = error as Error;
      ElMessage.error(err.message || '审核通过失败');
    }
  } finally {
    submitting.value = false;
  }
};

const handleReject = (resource: AuditListItem) => {
  currentRejectResource.value = resource;
  isBatchReject.value = false;
  rejectForm.reasonCode = '';
  rejectForm.reason = '';
  rejectDialogVisible.value = true;
};

const handleConfirmReject = async () => {
  if (!rejectFormRef.value) return;
  try {
    await rejectFormRef.value.validate();
    submitting.value = true;
    const reasonCode = rejectForm.reasonCode || 'CUSTOM';
    const reasonDetail = rejectForm.reason;
    if (isBatchReject.value) {
      const resourceIds = selectedResources.value.map((r) => r.resourceId);
      const result = await batchReject(resourceIds, reasonCode, reasonDetail);
      // 后端API使用 code: 0 表示成功
      if ((result.code === 200 || result.code === 0) && result.data) {
        ElMessage.success(`成功驳回 ${result.data.successCount} 个资源`);
        if (result.data.failCount > 0) {
          ElMessage.warning(`${result.data.failCount} 个资源驳回失败`);
        }
      }
      selectedResources.value = [];
    } else if (currentRejectResource.value) {
      await rejectResource(
        currentRejectResource.value.resourceId,
        reasonCode,
        reasonDetail
      );
      ElMessage.success('审核驳回成功');
    }
    rejectDialogVisible.value = false;
    detailDialogVisible.value = false;
    loadResources();
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(err.message || '审核驳回失败');
  } finally {
    submitting.value = false;
  }
};

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
    const resourceIds = selectedResources.value.map((r) => r.resourceId);
    const result = await batchApprove(resourceIds);
    // 后端API使用 code: 0 表示成功
    if ((result.code === 200 || result.code === 0) && result.data) {
      ElMessage.success(`成功通过 ${result.data.successCount} 个资源`);
      if (result.data.failCount > 0) {
        ElMessage.warning(`${result.data.failCount} 个资源审核失败`);
      }
    }
    selectedResources.value = [];
    loadResources();
  } catch (error: unknown) {
    if (error !== 'cancel') {
      const err = error as Error;
      ElMessage.error(err.message || '批量审核通过失败');
    }
  } finally {
    submitting.value = false;
  }
};

const handleBatchReject = () => {
  if (selectedResources.value.length === 0) {
    ElMessage.warning('请先选择要驳回的资源');
    return;
  }
  isBatchReject.value = true;
  rejectForm.reasonCode = '';
  rejectForm.reason = '';
  rejectDialogVisible.value = true;
};

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (Math.round((bytes / Math.pow(k, i)) * 100) / 100) + ' ' + sizes[i];
};

const formatDate = (date: string): string => {
  if (!date) return '-';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

onMounted(() => {
  loadResources();
  loadCategories();
  loadRejectReasons();
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
</style>
