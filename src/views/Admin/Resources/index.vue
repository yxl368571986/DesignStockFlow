<!--
  资源管理页面
  
  功能：
  - 显示资源列表表格
  - 搜索和筛选功能
  - 分页功能
  - 资源操作（编辑、下架、删除、置顶、推荐）
  
  需求: 需求14.1-14.10
-->

<template>
  <div class="resources-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">资源管理</h2>
      <p class="page-desc">管理平台所有资源内容</p>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="标题/资源ID/上传者"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="分类">
          <el-select
            v-model="searchForm.categoryId"
            placeholder="全部分类"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="category in categories"
              :key="category.categoryId"
              :label="category.categoryName"
              :value="category.categoryId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="审核状态">
          <el-select
            v-model="searchForm.auditStatus"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已驳回" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="VIP等级">
          <el-select
            v-model="searchForm.vipLevel"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="免费资源" :value="0" />
            <el-option label="VIP资源" :value="1" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="正常" :value="1" />
            <el-option label="已下架" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作栏 -->
    <el-card v-if="selectedResources.length > 0" class="batch-actions-card" shadow="never">
      <div class="batch-actions">
        <span class="selected-count">已选择 {{ selectedResources.length }} 项</span>
        <div class="actions">
          <el-button type="warning" :icon="Download" @click="handleBatchOffline">
            批量下架
          </el-button>
          <el-button type="danger" :icon="Delete" @click="handleBatchDelete">
            批量删除
          </el-button>
          <el-button @click="clearSelection">取消选择</el-button>
        </div>
      </div>
    </el-card>

    <!-- 资源列表表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="resourceList"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="resourceId" label="资源ID" width="180" />
        
        <el-table-column label="资源信息" width="300">
          <template #default="{ row }">
            <div class="resource-info-cell">
              <el-image
                :src="getFullImageUrl(row.cover, row.resourceId)"
                :preview-src-list="[getFullImageUrl(row.cover, row.resourceId)]"
                fit="cover"
                class="resource-cover"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="resource-details">
                <div class="title">{{ row.title }}</div>
                <div class="meta">
                  <el-tag size="small" type="info">{{ row.fileFormat }}</el-tag>
                  <span class="file-size">{{ formatFileSize(row.fileSize) }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.categoryName || '未分类' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="上传者" width="150">
          <template #default="{ row }">
            <div class="uploader-cell">
              <span class="uploader-name">{{ row.userName || '未知' }}</span>
              <span class="user-id">ID: {{ row.userId?.slice(0, 8) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column 
          prop="downloadCount" 
          label="下载量" 
          width="100" 
          align="center"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="count-text">{{ row.downloadCount || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column 
          prop="viewCount" 
          label="浏览量" 
          width="100" 
          align="center"
          sortable="custom"
        >
          <template #default="{ row }">
            <span class="count-text">{{ row.viewCount || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getAuditStatusType(row.auditStatus)"
            >
              {{ getAuditStatusText(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="VIP" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.vipLevel > 0" type="warning" effect="dark">
              <el-icon><Star /></el-icon>
            </el-tag>
            <el-tag v-else type="success">免费</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="标记" width="100" align="center">
          <template #default="{ row }">
            <div class="marks">
              <el-tag v-if="row.isTop" type="danger" size="small">置顶</el-tag>
              <el-tag v-if="row.isRecommend" type="warning" size="small">推荐</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '正常' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column 
          prop="createdAt" 
          label="上传时间" 
          width="180"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button 
              :type="row.status === 1 ? 'warning' : 'success'" 
              link
              :icon="row.status === 1 ? Download : Upload"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-dropdown @command="(cmd: string) => handleMoreAction(cmd, row)">
              <el-button type="primary" link>
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    :command="row.isTop ? 'untop' : 'top'" 
                    :icon="Top"
                  >
                    {{ row.isTop ? '取消置顶' : '置顶' }}
                  </el-dropdown-item>
                  <el-dropdown-item 
                    :command="row.isRecommend ? 'unrecommend' : 'recommend'" 
                    :icon="Star"
                  >
                    {{ row.isRecommend ? '取消推荐' : '推荐' }}
                  </el-dropdown-item>
                  <el-dropdown-item 
                    command="delete" 
                    :icon="Delete"
                    divided
                  >
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 资源编辑对话框 -->
    <ResourceEditDialog
      v-model="editDialogVisible"
      :resource="selectedResource"
      :categories="categories"
      @success="handleEditSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search,
  Refresh,
  Edit,
  Delete,
  Download,
  Upload,
  ArrowDown,
  Star,
  Top,
  Picture
} from '@element-plus/icons-vue';
import ResourceEditDialog from './components/ResourceEditDialog.vue';
import { formatTime, formatFileSize } from '@/utils/format';
import { getFullImageUrl } from '@/utils/url';
import {
  getAdminResourceList,
  deleteAdminResource,
  offlineResource,
  onlineResource,
  topResource,
  recommendResource,
  batchDeleteResources,
  batchOfflineResources,
  type Resource,
  type ResourceListParams
} from '@/api/adminResource';

// 格式化日期
const formatDate = (date: string) => formatTime(date, 'YYYY-MM-DD HH:mm:ss');

// 分类列表
interface Category {
  categoryId: string;
  categoryName: string;
}

const categories = ref<Category[]>([
  { categoryId: '1', categoryName: '党建类' },
  { categoryId: '2', categoryName: '节日海报类' },
  { categoryId: '3', categoryName: '电商类' },
  { categoryId: '4', categoryName: 'UI设计类' },
  { categoryId: '5', categoryName: '插画类' }
]);

// 搜索表单
const searchForm = reactive<ResourceListParams>({
  keyword: '',
  categoryId: undefined,
  auditStatus: undefined,
  vipLevel: undefined,
  status: undefined
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

// 加载状态
const loading = ref(false);

// 资源列表
const resourceList = ref<Resource[]>([]);

// 选中的资源
const selectedResources = ref<Resource[]>([]);

// 对话框状态
const editDialogVisible = ref(false);

// 选中的资源
const selectedResource = ref<Resource | null>(null);

// 获取资源列表
const fetchResourceList = async () => {
  loading.value = true;
  try {
    const response = await getAdminResourceList({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    });
    
    resourceList.value = response.list;
    pagination.total = response.total;
  } catch (error) {
    ElMessage.error('获取资源列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchResourceList();
};

// 重置
const handleReset = () => {
  searchForm.keyword = '';
  searchForm.categoryId = undefined;
  searchForm.auditStatus = undefined;
  searchForm.vipLevel = undefined;
  searchForm.status = undefined;
  pagination.page = 1;
  fetchResourceList();
};

// 排序变化
const handleSortChange = ({ prop, order }: any) => {
  searchForm.sortBy = prop;
  searchForm.sortOrder = order === 'ascending' ? 'asc' : 'desc';
  fetchResourceList();
};

// 分页大小变化
const handleSizeChange = () => {
  pagination.page = 1;
  fetchResourceList();
};

// 页码变化
const handlePageChange = () => {
  fetchResourceList();
};

// 选择变化
const handleSelectionChange = (selection: Resource[]) => {
  selectedResources.value = selection;
};

// 清除选择
const clearSelection = () => {
  selectedResources.value = [];
};

// 编辑资源
const handleEdit = (resource: Resource) => {
  selectedResource.value = resource;
  editDialogVisible.value = true;
};

// 编辑成功
const handleEditSuccess = () => {
  ElMessage.success('编辑成功');
  editDialogVisible.value = false;
  fetchResourceList();
};

// 切换资源状态(上架/下架)
const handleToggleStatus = async (resource: Resource) => {
  const action = resource.status === 1 ? '下架' : '上架';
  try {
    await ElMessageBox.confirm(
      `确定要${action}资源"${resource.title}"吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    if (resource.status === 1) {
      await offlineResource(resource.resourceId);
    } else {
      await onlineResource(resource.resourceId);
    }
    
    ElMessage.success(`${action}成功`);
    fetchResourceList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}失败`);
    }
  }
};

// 更多操作
const handleMoreAction = async (command: string, resource: Resource) => {
  switch (command) {
    case 'top':
    case 'untop':
      await handleToggleTop(resource);
      break;
    case 'recommend':
    case 'unrecommend':
      await handleToggleRecommend(resource);
      break;
    case 'delete':
      await handleDelete(resource);
      break;
  }
};

// 切换置顶
const handleToggleTop = async (resource: Resource) => {
  const action = resource.isTop ? '取消置顶' : '置顶';
  try {
    await topResource(resource.resourceId, !resource.isTop);
    ElMessage.success(`${action}成功`);
    fetchResourceList();
  } catch (error) {
    ElMessage.error(`${action}失败`);
  }
};

// 切换推荐
const handleToggleRecommend = async (resource: Resource) => {
  const action = resource.isRecommend ? '取消推荐' : '推荐';
  try {
    await recommendResource(resource.resourceId, !resource.isRecommend);
    ElMessage.success(`${action}成功`);
    fetchResourceList();
  } catch (error) {
    ElMessage.error(`${action}失败`);
  }
};

// 删除资源
const handleDelete = async (resource: Resource) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除资源"${resource.title}"吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    );

    await deleteAdminResource(resource.resourceId);
    ElMessage.success('删除成功');
    fetchResourceList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 批量下架
const handleBatchOffline = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要下架选中的 ${selectedResources.value.length} 个资源吗？`,
      '确认批量下架',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const resourceIds = selectedResources.value.map(r => r.resourceId);
    await batchOfflineResources(resourceIds);
    ElMessage.success('批量下架成功');
    clearSelection();
    fetchResourceList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量下架失败');
    }
  }
};

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedResources.value.length} 个资源吗？此操作不可恢复！`,
      '确认批量删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    );

    const resourceIds = selectedResources.value.map(r => r.resourceId);
    await batchDeleteResources(resourceIds);
    ElMessage.success('批量删除成功');
    clearSelection();
    fetchResourceList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败');
    }
  }
};

// 获取审核状态类型
const getAuditStatusType = (status: number) => {
  const types: Record<number, any> = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  };
  return types[status] || 'info';
};

// 获取审核状态文本
const getAuditStatusText = (status: number) => {
  const texts: Record<number, string> = {
    0: '待审核',
    1: '已通过',
    2: '已驳回'
  };
  return texts[status] || '未知';
};

// 初始化
onMounted(() => {
  fetchResourceList();
});
</script>

<style scoped lang="scss">
.resources-page {
  .page-header {
    margin-bottom: 20px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .page-desc {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
  }

  .search-card {
    margin-bottom: 20px;
  }

  .batch-actions-card {
    margin-bottom: 20px;

    .batch-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;

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
    .resource-info-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      .resource-cover {
        width: 60px;
        height: 60px;
        border-radius: 4px;
        flex-shrink: 0;

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
        min-width: 0;

        .title {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .meta {
          display: flex;
          align-items: center;
          gap: 8px;

          .file-size {
            font-size: 12px;
            color: #999;
          }
        }
      }
    }

    .uploader-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .uploader-name {
        font-size: 14px;
        color: #333;
      }

      .user-id {
        font-size: 12px;
        color: #999;
      }
    }

    .count-text {
      font-weight: 600;
      color: #165dff;
    }

    .marks {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

// 暗黑模式
:global(.dark) {
  .resources-page {
    .page-header {
      .page-title {
        color: #e0e0e0;
      }

      .page-desc {
        color: #999;
      }
    }

    .resource-info-cell {
      .resource-details {
        .title {
          color: #e0e0e0;
        }
      }
    }

    .uploader-cell {
      .uploader-name {
        color: #e0e0e0;
      }
    }
  }
}
</style>
