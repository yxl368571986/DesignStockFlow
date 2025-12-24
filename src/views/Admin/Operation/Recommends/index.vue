<!--
  推荐位管理页面
  
  功能：
  - 显示推荐位配置
  - 支持自动推荐和手动选择切换
  - 手动选择时支持搜索和选择资源
  
  需求: 需求17.9, 需求17.10
-->

<template>
  <div class="recommends-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">推荐位管理</h2>
        <p class="page-desc">配置首页推荐位，支持自动推荐和手动选择两种模式</p>
      </div>
    </div>

    <!-- 推荐位配置列表 -->
    <el-row :gutter="20">
      <el-col
        v-for="recommend in recommendList"
        :key="recommend.recommendId"
        :xs="24"
        :sm="24"
        :md="12"
        :lg="8"
      >
        <el-card class="recommend-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon class="position-icon"><Star /></el-icon>
                <span class="position-name">{{ recommend.positionName }}</span>
              </div>
              <el-tag :type="recommend.mode === 'auto' ? 'success' : 'primary'" size="small">
                {{ recommend.mode === 'auto' ? '自动推荐' : '手动选择' }}
              </el-tag>
            </div>
          </template>

          <div class="card-content">
            <!-- 推荐模式切换 -->
            <div class="mode-switch">
              <span class="label">推荐模式：</span>
              <el-radio-group
                v-model="recommend.mode"
                size="small"
                @change="handleModeChange(recommend)"
              >
                <el-radio-button label="auto">自动推荐</el-radio-button>
                <el-radio-button label="manual">手动选择</el-radio-button>
              </el-radio-group>
            </div>

            <!-- 自动推荐配置 -->
            <div v-if="recommend.mode === 'auto'" class="auto-config">
              <el-form label-width="100px" size="small">
                <el-form-item label="推荐规则">
                  <el-select
                    v-model="recommend.autoRule"
                    placeholder="选择推荐规则"
                    style="width: 100%"
                    @change="handleAutoRuleChange(recommend)"
                  >
                    <el-option label="最多下载" value="download" />
                    <el-option label="最新发布" value="latest" />
                    <el-option label="最多收藏" value="collect" />
                    <el-option label="综合排序" value="comprehensive" />
                  </el-select>
                </el-form-item>

                <el-form-item label="推荐数量">
                  <el-input-number
                    v-model="recommend.count"
                    :min="1"
                    :max="20"
                    controls-position="right"
                    style="width: 100%"
                    @change="handleCountChange(recommend)"
                  />
                </el-form-item>

                <el-form-item label="分类筛选">
                  <el-select
                    v-model="recommend.categoryFilter"
                    placeholder="全部分类"
                    clearable
                    style="width: 100%"
                    @change="handleCategoryChange(recommend)"
                  >
                    <el-option
                      v-for="category in categoryList"
                      :key="category.categoryId"
                      :label="category.categoryName"
                      :value="category.categoryId"
                    />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>

            <!-- 手动选择配置 -->
            <div v-else class="manual-config">
              <div class="selected-resources">
                <div class="section-title">
                  <span>已选资源 ({{ recommend.selectedResources.length }}/{{ recommend.count }})</span>
                  <el-button
                    type="primary"
                    size="small"
                    :icon="Plus"
                    @click="handleSelectResources(recommend)"
                  >
                    选择资源
                  </el-button>
                </div>

                <el-empty
                  v-if="recommend.selectedResources.length === 0"
                  description="暂无选择资源"
                  :image-size="80"
                />

                <draggable
                  v-else
                  v-model="recommend.selectedResources"
                  item-key="resourceId"
                  class="resource-list"
                  @end="handleDragEnd(recommend)"
                >
                  <template #item="{ element, index }">
                    <div class="resource-item">
                      <div class="item-left">
                        <el-icon class="drag-handle"><Rank /></el-icon>
                        <span class="item-index">{{ index + 1 }}</span>
                        <el-image
                          :src="element.cover"
                          fit="cover"
                          class="item-cover"
                        >
                          <template #error>
                            <div class="image-error">
                              <el-icon><Picture /></el-icon>
                            </div>
                          </template>
                        </el-image>
                        <div class="item-info">
                          <div class="item-title">{{ element.title }}</div>
                          <div class="item-meta">
                            <el-tag size="small">{{ element.categoryName }}</el-tag>
                            <span class="download-count">
                              <el-icon><Download /></el-icon>
                              {{ element.downloadCount }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <el-button
                        type="danger"
                        size="small"
                        :icon="Delete"
                        circle
                        @click="handleRemoveResource(recommend, index)"
                      />
                    </div>
                  </template>
                </draggable>
              </div>
            </div>

            <!-- 保存按钮 -->
            <div class="card-footer">
              <el-button
                type="primary"
                :loading="recommend.saving"
                @click="handleSave(recommend)"
              >
                保存配置
              </el-button>
              <el-button @click="handlePreview(recommend)">
                预览效果
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 资源选择对话框 -->
    <el-dialog
      v-model="selectDialogVisible"
      title="选择推荐资源"
      width="1000px"
      :close-on-click-modal="false"
    >
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索资源标题"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="分类">
          <el-select
            v-model="searchForm.categoryId"
            placeholder="全部分类"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="category in categoryList"
              :key="category.categoryId"
              :label="category.categoryName"
              :value="category.categoryId"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearchResources">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleResetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 资源列表 -->
      <el-table
        ref="resourceTableRef"
        v-loading="resourceLoading"
        :data="resourceList"
        @selection-change="handleSelectionChange"
        max-height="400"
      >
        <el-table-column type="selection" width="55" :selectable="checkSelectable" />
        
        <el-table-column label="封面" width="100">
          <template #default="{ row }">
            <el-image
              :src="row.cover"
              fit="cover"
              class="table-cover"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>

        <el-table-column label="标题" prop="title" min-width="200" show-overflow-tooltip />

        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.categoryName }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="下载量" prop="downloadCount" width="100" align="center" />

        <el-table-column label="收藏数" prop="collectCount" width="100" align="center" />

        <el-table-column label="发布时间" prop="createdAt" width="180" />
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="resourcePagination.page"
          v-model:page-size="resourcePagination.pageSize"
          :total="resourcePagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchResourceList"
          @current-change="fetchResourceList"
        />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <span class="selected-tip">已选择 {{ selectedResources.length }} 个资源</span>
          <div>
            <el-button @click="selectDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleConfirmSelect">
              确定
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Plus,
  Delete,
  Search,
  Refresh,
  Star,
  Picture,
  Download,
  Rank
} from '@element-plus/icons-vue';
import draggable from 'vuedraggable';

// 类型定义
interface ResourceItem {
  resourceId: string;
  title: string;
  cover: string;
  categoryName: string;
  downloadCount: number;
  collectCount: number;
  createdAt: string;
}

interface RecommendConfig {
  recommendId: string;
  positionName: string;
  positionCode: string;
  mode: 'auto' | 'manual';
  autoRule?: string;
  count: number;
  categoryFilter?: string;
  selectedResources: ResourceItem[];
  saving: boolean;
}

interface CategoryItem {
  categoryId: string;
  categoryName: string;
}

// 数据状态
const recommendList = ref<RecommendConfig[]>([]);
const categoryList = ref<CategoryItem[]>([]);

// 资源选择对话框
const selectDialogVisible = ref(false);
const currentRecommend = ref<RecommendConfig | null>(null);
const resourceLoading = ref(false);
const resourceList = ref<ResourceItem[]>([]);
const selectedResources = ref<ResourceItem[]>([]);
const resourceTableRef = ref();

// 搜索表单
const searchForm = reactive({
  keyword: '',
  categoryId: ''
});

// 资源分页
const resourcePagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

// 获取推荐位配置列表
const fetchRecommendList = async () => {
  try {
    // TODO: 调用实际API
    // const response = await getRecommends();
    // recommendList.value = response.data;
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500));
    recommendList.value = [
      {
        recommendId: '1',
        positionName: '首页推荐位1',
        positionCode: 'home_recommend_1',
        mode: 'auto',
        autoRule: 'download',
        count: 6,
        categoryFilter: '',
        selectedResources: [],
        saving: false
      },
      {
        recommendId: '2',
        positionName: '首页推荐位2',
        positionCode: 'home_recommend_2',
        mode: 'manual',
        count: 4,
        selectedResources: [
          {
            resourceId: '1',
            title: 'UI设计规范模板',
            cover: 'https://picsum.photos/300/200?random=101',
            categoryName: 'UI设计',
            downloadCount: 1234,
            collectCount: 567,
            createdAt: '2024-01-15 10:00:00'
          }
        ],
        saving: false
      },
      {
        recommendId: '3',
        positionName: '分类页推荐',
        positionCode: 'category_recommend',
        mode: 'auto',
        autoRule: 'latest',
        count: 8,
        categoryFilter: '',
        selectedResources: [],
        saving: false
      }
    ];
  } catch (error) {
    ElMessage.error('获取推荐位配置失败');
    console.error(error);
  }
};

// 获取分类列表
const fetchCategoryList = async () => {
  try {
    // TODO: 调用实际API
    // const response = await getCategories();
    // categoryList.value = response.data;
    
    // 模拟数据
    categoryList.value = [
      { categoryId: '1', categoryName: 'UI设计' },
      { categoryId: '2', categoryName: '插画' },
      { categoryId: '3', categoryName: '摄影图' },
      { categoryId: '4', categoryName: '电商设计' }
    ];
  } catch (error) {
    console.error(error);
  }
};

// 模式切换
const handleModeChange = (recommend: RecommendConfig) => {
  ElMessage.info(`已切换为${recommend.mode === 'auto' ? '自动推荐' : '手动选择'}模式`);
};

// 自动推荐规则变更
const handleAutoRuleChange = (recommend: RecommendConfig) => {
  console.log('规则变更:', recommend.autoRule);
};

// 推荐数量变更
const handleCountChange = (recommend: RecommendConfig) => {
  console.log('数量变更:', recommend.count);
};

// 分类筛选变更
const handleCategoryChange = (recommend: RecommendConfig) => {
  console.log('分类变更:', recommend.categoryFilter);
};

// 选择资源
const handleSelectResources = (recommend: RecommendConfig) => {
  currentRecommend.value = recommend;
  selectedResources.value = [...recommend.selectedResources];
  selectDialogVisible.value = true;
  fetchResourceList();
};

// 获取资源列表
const fetchResourceList = async () => {
  resourceLoading.value = true;
  try {
    // TODO: 调用实际API
    // const response = await getResources({
    //   ...searchForm,
    //   page: resourcePagination.page,
    //   pageSize: resourcePagination.pageSize
    // });
    // resourceList.value = response.data.list;
    // resourcePagination.total = response.data.total;
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500));
    resourceList.value = [
      {
        resourceId: '1',
        title: 'UI设计规范模板',
        cover: 'https://picsum.photos/300/200?random=101',
        categoryName: 'UI设计',
        downloadCount: 1234,
        collectCount: 567,
        createdAt: '2024-01-15 10:00:00'
      },
      {
        resourceId: '2',
        title: '春节海报设计',
        cover: 'https://picsum.photos/300/200?random=102',
        categoryName: '节日海报',
        downloadCount: 2345,
        collectCount: 890,
        createdAt: '2024-01-14 10:00:00'
      },
      {
        resourceId: '3',
        title: '电商Banner模板',
        cover: 'https://picsum.photos/300/200?random=103',
        categoryName: '电商设计',
        downloadCount: 3456,
        collectCount: 1234,
        createdAt: '2024-01-13 10:00:00'
      }
    ];
    resourcePagination.total = 3;
  } catch (error) {
    ElMessage.error('获取资源列表失败');
    console.error(error);
  } finally {
    resourceLoading.value = false;
  }
};

// 搜索资源
const handleSearchResources = () => {
  resourcePagination.page = 1;
  fetchResourceList();
};

// 重置搜索
const handleResetSearch = () => {
  Object.assign(searchForm, {
    keyword: '',
    categoryId: ''
  });
  handleSearchResources();
};

// 选择变更
const handleSelectionChange = (selection: ResourceItem[]) => {
  selectedResources.value = selection;
};

// 检查是否可选
const checkSelectable = (row: ResourceItem) => {
  if (!currentRecommend.value) return true;
  
  // 检查是否已达到最大数量
  const maxCount = currentRecommend.value.count;
  const currentCount = selectedResources.value.length;
  const isSelected = selectedResources.value.some(r => r.resourceId === row.resourceId);
  
  return isSelected || currentCount < maxCount;
};

// 确认选择
const handleConfirmSelect = () => {
  if (!currentRecommend.value) return;

  if (selectedResources.value.length > currentRecommend.value.count) {
    ElMessage.warning(`最多只能选择${currentRecommend.value.count}个资源`);
    return;
  }

  currentRecommend.value.selectedResources = [...selectedResources.value];
  selectDialogVisible.value = false;
  ElMessage.success('资源选择成功');
};

// 移除资源
const handleRemoveResource = (recommend: RecommendConfig, index: number) => {
  recommend.selectedResources.splice(index, 1);
  ElMessage.success('已移除');
};

// 拖拽结束
const handleDragEnd = (recommend: RecommendConfig) => {
  console.log('排序已更新:', recommend.selectedResources);
};

// 保存配置
const handleSave = async (recommend: RecommendConfig) => {
  // 验证
  if (recommend.mode === 'manual' && recommend.selectedResources.length === 0) {
    ElMessage.warning('请至少选择一个资源');
    return;
  }

  recommend.saving = true;
  try {
    // TODO: 调用保存API
    // await saveRecommendConfig(recommend.recommendId, recommend);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    ElMessage.success('保存成功');
  } catch (error) {
    ElMessage.error('保存失败');
    console.error(error);
  } finally {
    recommend.saving = false;
  }
};

// 预览效果
const handlePreview = (_recommend: RecommendConfig) => {
  ElMessage.info('预览功能开发中...');
  // TODO: 打开预览页面
};

// 初始化
onMounted(() => {
  fetchRecommendList();
  fetchCategoryList();
});
</script>

<style scoped lang="scss">
.recommends-management {
  .page-header {
    margin-bottom: 20px;

    .header-left {
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
  }

  .recommend-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .position-icon {
          font-size: 20px;
          color: #ff7d00;
        }

        .position-name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
      }
    }

    .card-content {
      .mode-switch {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #f0f0f0;

        .label {
          font-size: 14px;
          color: #666;
          margin-right: 12px;
        }
      }

      .auto-config,
      .manual-config {
        margin-bottom: 20px;
      }

      .selected-resources {
        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .resource-list {
          .resource-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            margin-bottom: 8px;
            background: #f5f7fa;
            border-radius: 4px;
            cursor: move;
            transition: all 0.3s;

            &:hover {
              background: #e8eaf0;
            }

            .item-left {
              display: flex;
              align-items: center;
              gap: 12px;
              flex: 1;

              .drag-handle {
                font-size: 16px;
                color: #999;
                cursor: move;
              }

              .item-index {
                font-size: 14px;
                font-weight: 600;
                color: #666;
                min-width: 20px;
              }

              .item-cover {
                width: 60px;
                height: 40px;
                border-radius: 4px;
                flex-shrink: 0;
              }

              .item-info {
                flex: 1;
                min-width: 0;

                .item-title {
                  font-size: 14px;
                  color: #333;
                  margin-bottom: 4px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .item-meta {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  font-size: 12px;
                  color: #999;

                  .download-count {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                  }
                }
              }
            }
          }
        }
      }

      .card-footer {
        display: flex;
        gap: 12px;
        padding-top: 20px;
        border-top: 1px solid #f0f0f0;
      }
    }
  }

  .search-form {
    margin-bottom: 20px;
  }

  .table-cover {
    width: 80px;
    height: 60px;
    border-radius: 4px;
  }

  .image-error {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #999;

    .el-icon {
      font-size: 24px;
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .selected-tip {
      font-size: 14px;
      color: #666;
    }
  }
}

// 暗黑模式
:global(.dark) {
  .recommends-management {
    .page-header {
      .header-left {
        .page-title {
          color: #e0e0e0;
        }

        .page-desc {
          color: #999;
        }
      }
    }

    .recommend-card {
      .card-header {
        .header-left {
          .position-name {
            color: #e0e0e0;
          }
        }
      }

      .card-content {
        .mode-switch {
          border-color: #3a3a3a;

          .label {
            color: #999;
          }
        }

        .selected-resources {
          .section-title {
            color: #e0e0e0;
          }

          .resource-list {
            .resource-item {
              background: #2a2a2a;

              &:hover {
                background: #3a3a3a;
              }

              .item-left {
                .item-info {
                  .item-title {
                    color: #e0e0e0;
                  }
                }
              }
            }
          }
        }

        .card-footer {
          border-color: #3a3a3a;
        }
      }
    }

    .image-error {
      background: #2a2a2a;
    }
  }
}
</style>