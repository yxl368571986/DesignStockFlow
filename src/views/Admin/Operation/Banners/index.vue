<!--
  轮播图管理页面
  
  功能：
  - 显示轮播图列表
  - 添加/编辑/删除轮播图
  - 图片上传和预览
  - 排序调整
  
  需求: 需求17.1-17.5
-->

<template>
  <div class="banners-management">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">轮播图管理</h2>
        <p class="page-desc">管理首页轮播图，支持图片上传、链接设置和排序调整</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="handleAdd">
          添加轮播图
        </el-button>
      </div>
    </div>

    <!-- 轮播图列表 -->
    <el-card class="list-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="bannerList"
        stripe
        style="width: 100%"
      >
        <el-table-column label="序号" type="index" width="60" align="center" />
        
        <el-table-column label="预览图" width="200">
          <template #default="{ row }">
            <el-image
              :src="row.imageUrl"
              :preview-src-list="[row.imageUrl]"
              fit="cover"
              class="banner-preview"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>

        <el-table-column label="标题" prop="title" min-width="150" />

        <el-table-column label="链接地址" prop="linkUrl" min-width="200" show-overflow-tooltip />

        <el-table-column label="链接类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLinkTypeTag(row.linkType)">
              {{ getLinkTypeText(row.linkType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序" prop="sortOrder" width="80" align="center" />

        <el-table-column label="生效时间" width="180">
          <template #default="{ row }">
            <div class="time-range">
              <div>{{ formatDate(row.startTime) }}</div>
              <div>{{ formatDate(row.endTime) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
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
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="轮播图标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入轮播图标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="轮播图图片" prop="imageUrl" required>
          <div class="upload-container">
            <el-upload
              class="banner-uploader"
              :action="uploadAction"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :before-upload="beforeUpload"
              accept="image/*"
            >
              <img v-if="formData.imageUrl" :src="formData.imageUrl" class="banner-image" />
              <div v-else class="upload-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <div class="upload-text">点击上传图片</div>
                <div class="upload-tip">建议尺寸：1920x600px，支持JPG/PNG格式，不超过2MB</div>
              </div>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="链接类型" prop="linkType">
          <el-radio-group v-model="formData.linkType">
            <el-radio label="internal">站内链接</el-radio>
            <el-radio label="external">外部链接</el-radio>
            <el-radio label="category">分类页面</el-radio>
            <el-radio label="resource">资源详情</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="链接地址" prop="linkUrl">
          <el-input
            v-model="formData.linkUrl"
            placeholder="请输入链接地址"
            :prefix-icon="Link"
          >
            <template #append v-if="formData.linkType === 'external'">
              <el-button :icon="View" @click="previewLink">预览</el-button>
            </template>
          </el-input>
          <div class="form-tip">
            <template v-if="formData.linkType === 'internal'">
              例如：/resources、/vip、/about
            </template>
            <template v-else-if="formData.linkType === 'external'">
              例如：https://www.example.com
            </template>
            <template v-else-if="formData.linkType === 'category'">
              例如：/resources?category=ui-design
            </template>
            <template v-else-if="formData.linkType === 'resource'">
              例如：/resources/detail/资源ID
            </template>
          </div>
        </el-form-item>

        <el-form-item label="排序值" prop="sortOrder">
          <el-input-number
            v-model="formData.sortOrder"
            :min="0"
            :max="999"
            controls-position="right"
          />
          <span class="form-tip">数值越小越靠前</span>
        </el-form-item>

        <el-form-item label="生效时间" prop="timeRange">
          <el-date-picker
            v-model="formData.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Edit, Delete, Picture, Link, View } from '@element-plus/icons-vue';
import { useUserStore } from '@/pinia/userStore';

// 类型定义
interface BannerItem {
  bannerId?: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  linkType: 'internal' | 'external' | 'category' | 'resource';
  sortOrder: number;
  startTime: string;
  endTime: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  bannerId?: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  linkType: 'internal' | 'external' | 'category' | 'resource';
  sortOrder: number;
  timeRange: [string, string] | null;
  status: number;
}

const userStore = useUserStore();

// 数据状态
const loading = ref(false);
const bannerList = ref<BannerItem[]>([]);

// 对话框状态
const dialogVisible = ref(false);
const dialogTitle = computed(() => formData.bannerId ? '编辑轮播图' : '添加轮播图');
const submitting = ref(false);

// 表单引用和数据
const formRef = ref<FormInstance>();
const formData = reactive<FormData>({
  title: '',
  imageUrl: '',
  linkUrl: '',
  linkType: 'internal',
  sortOrder: 0,
  timeRange: null,
  status: 1
});

// 表单验证规则
const formRules: FormRules = {
  title: [
    { required: true, message: '请输入轮播图标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2-100个字符', trigger: 'blur' }
  ],
  imageUrl: [
    { required: true, message: '请上传轮播图图片', trigger: 'change' }
  ],
  linkType: [
    { required: true, message: '请选择链接类型', trigger: 'change' }
  ],
  linkUrl: [
    { required: true, message: '请输入链接地址', trigger: 'blur' }
  ],
  sortOrder: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
};

// 上传配置
const uploadAction = computed(() => {
  return `${import.meta.env.VITE_API_BASE_URL}/api/v1/upload/image`;
});

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${userStore.token}`
  };
});

// 获取轮播图列表
const fetchBannerList = async () => {
  loading.value = true;
  try {
    // TODO: 调用实际API
    // const response = await getBanners();
    // bannerList.value = response.data;
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500));
    bannerList.value = [
      {
        bannerId: '1',
        title: '春节活动轮播图',
        imageUrl: 'https://via.placeholder.com/1920x600/FF6B6B/FFFFFF?text=Spring+Festival',
        linkUrl: '/resources?category=festival',
        linkType: 'category',
        sortOrder: 1,
        startTime: '2024-01-01 00:00:00',
        endTime: '2024-02-29 23:59:59',
        status: 1,
        createdAt: '2024-01-01 10:00:00'
      },
      {
        bannerId: '2',
        title: 'VIP会员优惠',
        imageUrl: 'https://via.placeholder.com/1920x600/4ECDC4/FFFFFF?text=VIP+Promotion',
        linkUrl: '/vip',
        linkType: 'internal',
        sortOrder: 2,
        startTime: '2024-01-01 00:00:00',
        endTime: '2024-12-31 23:59:59',
        status: 1,
        createdAt: '2024-01-01 10:00:00'
      }
    ];
  } catch (error) {
    ElMessage.error('获取轮播图列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 添加轮播图
const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
};

// 编辑轮播图
const handleEdit = (row: BannerItem) => {
  resetForm();
  Object.assign(formData, {
    bannerId: row.bannerId,
    title: row.title,
    imageUrl: row.imageUrl,
    linkUrl: row.linkUrl,
    linkType: row.linkType,
    sortOrder: row.sortOrder,
    timeRange: [row.startTime, row.endTime],
    status: row.status
  });
  dialogVisible.value = true;
};

// 删除轮播图
const handleDelete = async (row: BannerItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除轮播图"${row.title}"吗？删除后将无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    // TODO: 调用删除API
    // await deleteBanner(row.bannerId);
    
    ElMessage.success('删除成功');
    await fetchBannerList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
      console.error(error);
    }
  }
};

// 状态切换
const handleStatusChange = async (row: BannerItem) => {
  try {
    // TODO: 调用更新状态API
    // await updateBannerStatus(row.bannerId, row.status);
    
    ElMessage.success(row.status === 1 ? '已启用' : '已禁用');
  } catch (error) {
    // 恢复原状态
    row.status = row.status === 1 ? 0 : 1;
    ElMessage.error('状态更新失败');
    console.error(error);
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // 验证时间范围
    if (!formData.timeRange || formData.timeRange.length !== 2) {
      ElMessage.warning('请选择生效时间');
      return;
    }

    submitting.value = true;

    // 构建提交数据
    const submitData = {
      ...formData,
      startTime: formData.timeRange[0],
      endTime: formData.timeRange[1]
    };
    delete (submitData as any).timeRange;

    // TODO: 调用添加/编辑API
    if (formData.bannerId) {
      // await updateBanner(formData.bannerId, submitData);
      ElMessage.success('编辑成功');
    } else {
      // await createBanner(submitData);
      ElMessage.success('添加成功');
    }

    dialogVisible.value = false;
    await fetchBannerList();
  } catch (error) {
    if (error !== false) {
      ElMessage.error('操作失败');
      console.error(error);
    }
  } finally {
    submitting.value = false;
  }
};

// 图片上传成功
const handleUploadSuccess = (response: any) => {
  if (response.code === 200) {
    formData.imageUrl = response.data.url;
    ElMessage.success('图片上传成功');
  } else {
    ElMessage.error(response.msg || '图片上传失败');
  }
};

// 图片上传失败
const handleUploadError = () => {
  ElMessage.error('图片上传失败，请重试');
};

// 上传前验证
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片文件');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB');
    return false;
  }
  return true;
};

// 预览链接
const previewLink = () => {
  if (formData.linkUrl) {
    window.open(formData.linkUrl, '_blank');
  } else {
    ElMessage.warning('请先输入链接地址');
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  Object.assign(formData, {
    bannerId: undefined,
    title: '',
    imageUrl: '',
    linkUrl: '',
    linkType: 'internal',
    sortOrder: 0,
    timeRange: null,
    status: 1
  });
};

// 获取链接类型标签颜色
const getLinkTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    internal: '',
    external: 'success',
    category: 'warning',
    resource: 'danger'
  };
  return tagMap[type] || '';
};

// 获取链接类型文本
const getLinkTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    internal: '站内',
    external: '外部',
    category: '分类',
    resource: '资源'
  };
  return textMap[type] || type;
};

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return dateStr.replace(/:\d{2}$/, ''); // 去掉秒
};

// 初始化
onMounted(() => {
  fetchBannerList();
});
</script>

<style scoped lang="scss">
.banners-management {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
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

  .list-card {
    :deep(.el-card__body) {
      padding: 0;
    }

    .banner-preview {
      width: 180px;
      height: 60px;
      border-radius: 4px;
      cursor: pointer;
      transition: transform 0.3s;

      &:hover {
        transform: scale(1.05);
      }
    }

    .image-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 180px;
      height: 60px;
      background: #f5f7fa;
      border-radius: 4px;
      color: #999;
      font-size: 12px;

      .el-icon {
        font-size: 24px;
        margin-bottom: 4px;
      }
    }

    .time-range {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }
  }

  // 上传组件样式
  .upload-container {
    .banner-uploader {
      :deep(.el-upload) {
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
        overflow: hidden;
        transition: border-color 0.3s;

        &:hover {
          border-color: #165dff;
        }
      }

      .banner-image {
        width: 600px;
        height: 200px;
        object-fit: cover;
        display: block;
      }

      .upload-placeholder {
        width: 600px;
        height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #fafafa;

        .upload-icon {
          font-size: 48px;
          color: #999;
          margin-bottom: 12px;
        }

        .upload-text {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .upload-tip {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }

  .form-tip {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
}

// 暗黑模式
:global(.dark) {
  .banners-management {
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

    .upload-placeholder {
      background: #2a2a2a !important;
    }
  }
}
</style>
