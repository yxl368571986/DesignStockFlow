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
              :preview-teleported="true"
              :hide-on-click-modal="true"
              :z-index="3000"
              fit="cover"
              class="banner-preview"
              lazy
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
              <template #placeholder>
                <div class="image-loading">
                  <el-icon class="is-loading"><Loading /></el-icon>
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
            @blur="handleLinkUrlBlur"
          >
            <template
              v-if="formData.linkType === 'external'"
              #append
            >
              <el-button
                :icon="View"
                @click="previewLink"
              >
                预览
              </el-button>
            </template>
          </el-input>
          <!-- 链接验证提示 -->
          <div
            v-if="linkValidationTip"
            class="link-validation-tip"
            :class="linkValidationTip.type"
          >
            <el-icon>
              <WarningFilled v-if="linkValidationTip.type === 'warning'" />
              <SuccessFilled v-else-if="linkValidationTip.type === 'success'" />
              <InfoFilled v-else />
            </el-icon>
            <span>{{ linkValidationTip.message }}</span>
          </div>
          <div class="form-tip">
            <template v-if="formData.linkType === 'internal'">
              例如：/resources、/vip、/about（必须以 / 开头）
            </template>
            <template v-else-if="formData.linkType === 'external'">
              例如：https://www.example.com 或 www.example.com（系统会自动补全协议）
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
import { Plus, Edit, Delete, Picture, Link, View, WarningFilled, SuccessFilled, InfoFilled, Loading } from '@element-plus/icons-vue';
import { useUserStore } from '@/pinia/userStore';
import {
  getAdminBannerList,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  updateAdminBannerStatus,
  type Banner,
  type BannerFormData
} from '@/api/adminBanner';

// 类型定义
interface BannerItem {
  bannerId?: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  linkType: 'internal' | 'external' | 'category' | 'resource';
  sortOrder: number;
  startTime: string | null;
  endTime: string | null;
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

// 链接验证提示
const linkValidationTip = ref<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);

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
  return `${import.meta.env.VITE_API_BASE_URL}/upload/image`;
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
    const result = await getAdminBannerList();
    bannerList.value = result.list.map((item: Banner) => ({
      bannerId: item.bannerId,
      title: item.title,
      imageUrl: item.imageUrl,
      linkUrl: item.linkUrl,
      linkType: item.linkType,
      sortOrder: item.sortOrder,
      startTime: item.startTime,
      endTime: item.endTime,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
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

    const success = await deleteAdminBanner(row.bannerId!);
    if (success) {
      ElMessage.success('删除成功');
      await fetchBannerList();
    } else {
      ElMessage.error('删除失败');
    }
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
    const success = await updateAdminBannerStatus(row.bannerId!, row.status);
    if (success) {
      ElMessage.success(row.status === 1 ? '已启用' : '已禁用');
    } else {
      // 恢复原状态
      row.status = row.status === 1 ? 0 : 1;
      ElMessage.error('状态更新失败');
    }
  } catch (error) {
    // 恢复原状态
    row.status = row.status === 1 ? 0 : 1;
    ElMessage.error('状态更新失败');
    console.error(error);
  }
};

/**
 * 格式化外部链接URL
 * 确保外部链接有正确的协议前缀
 */
const formatExternalUrl = (url: string): string => {
  if (!url) return '';
  
  // 如果已经有协议前缀，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 如果以 // 开头，添加 https:
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  
  // 否则添加 https:// 前缀
  return `https://${url}`;
};

/**
 * 验证链接格式是否正确
 */
const validateLinkUrl = (url: string, linkType: string): { valid: boolean; message: string; autoFixed?: string } => {
  if (!url || url.trim() === '') {
    return { valid: false, message: '链接地址不能为空' };
  }

  const trimmedUrl = url.trim();

  switch (linkType) {
    case 'internal':
      // 站内链接必须以 / 开头
      if (!trimmedUrl.startsWith('/')) {
        return { 
          valid: false, 
          message: '站内链接必须以 / 开头，例如：/vip、/resources',
          autoFixed: `/${trimmedUrl}`
        };
      }
      return { valid: true, message: '链接格式正确' };

    case 'external':
      // 外部链接验证
      // 检查是否已有协议
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        // 验证URL格式
        try {
          new URL(trimmedUrl);
          return { valid: true, message: '链接格式正确' };
        } catch {
          return { valid: false, message: '链接格式不正确，请检查URL是否完整' };
        }
      }
      
      // 检查是否是类似 www.xxx.com 或 xxx.com 的格式
      const domainPattern = /^(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+/;
      if (domainPattern.test(trimmedUrl)) {
        const fixedUrl = `https://${trimmedUrl}`;
        return { 
          valid: true, 
          message: `检测到网址格式，已自动补全为：${fixedUrl}`,
          autoFixed: fixedUrl
        };
      }
      
      // 其他情况，尝试添加协议后验证
      const testUrl = `https://${trimmedUrl}`;
      try {
        new URL(testUrl);
        return { 
          valid: true, 
          message: `已自动补全协议：${testUrl}`,
          autoFixed: testUrl
        };
      } catch {
        return { 
          valid: false, 
          message: '链接格式不正确，请输入完整的网址，例如：https://www.example.com 或 www.example.com' 
        };
      }

    case 'category':
      // 分类链接验证
      if (!trimmedUrl.startsWith('/')) {
        return { 
          valid: false, 
          message: '分类链接必须以 / 开头',
          autoFixed: `/${trimmedUrl}`
        };
      }
      return { valid: true, message: '链接格式正确' };

    case 'resource':
      // 资源链接验证
      if (!trimmedUrl.startsWith('/')) {
        return { 
          valid: false, 
          message: '资源链接必须以 / 开头',
          autoFixed: `/${trimmedUrl}`
        };
      }
      return { valid: true, message: '链接格式正确' };

    default:
      return { valid: true, message: '' };
  }
};

/**
 * 处理链接输入框失焦事件
 * 进行链接验证和自动补全
 */
const handleLinkUrlBlur = () => {
  if (!formData.linkUrl || formData.linkUrl.trim() === '') {
    linkValidationTip.value = null;
    return;
  }

  const result = validateLinkUrl(formData.linkUrl, formData.linkType);
  
  if (result.autoFixed) {
    // 自动补全链接
    formData.linkUrl = result.autoFixed;
    linkValidationTip.value = {
      type: 'success',
      message: result.message
    };
    // 3秒后清除提示
    setTimeout(() => {
      if (linkValidationTip.value?.type === 'success') {
        linkValidationTip.value = null;
      }
    }, 3000);
  } else if (result.valid) {
    linkValidationTip.value = {
      type: 'success',
      message: result.message
    };
    // 2秒后清除成功提示
    setTimeout(() => {
      if (linkValidationTip.value?.type === 'success') {
        linkValidationTip.value = null;
      }
    }, 2000);
  } else {
    linkValidationTip.value = {
      type: 'warning',
      message: result.message
    };
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

    // 处理链接URL - 如果是外部链接，确保有协议前缀
    let processedLinkUrl = formData.linkUrl;
    if (formData.linkType === 'external') {
      processedLinkUrl = formatExternalUrl(formData.linkUrl);
    }

    // 构建提交数据
    const submitData: BannerFormData = {
      title: formData.title,
      imageUrl: formData.imageUrl,
      linkUrl: processedLinkUrl,
      linkType: formData.linkType,
      sortOrder: formData.sortOrder,
      startTime: formData.timeRange[0],
      endTime: formData.timeRange[1],
      status: formData.status
    };

    if (formData.bannerId) {
      // 编辑
      const result = await updateAdminBanner(formData.bannerId, submitData);
      if (result) {
        ElMessage.success('编辑成功');
        dialogVisible.value = false;
        await fetchBannerList();
      } else {
        ElMessage.error('编辑失败');
      }
    } else {
      // 添加
      const result = await createAdminBanner(submitData);
      if (result) {
        ElMessage.success('添加成功');
        dialogVisible.value = false;
        await fetchBannerList();
      } else {
        ElMessage.error('添加失败');
      }
    }
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
    // 将相对路径转换为完整URL
    const imageUrl = response.data.url;
    // 如果是相对路径，添加后端服务器地址
    if (imageUrl.startsWith('/')) {
      formData.imageUrl = `${import.meta.env.VITE_CDN_BASE_URL}${imageUrl}`;
    } else {
      formData.imageUrl = imageUrl;
    }
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
    // 如果是外部链接，确保有协议前缀
    const url = formData.linkType === 'external' 
      ? formatExternalUrl(formData.linkUrl) 
      : formData.linkUrl;
    window.open(url, '_blank');
  } else {
    ElMessage.warning('请先输入链接地址');
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  // 清除链接验证提示
  linkValidationTip.value = null;
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
const getLinkTypeTag = (type: string): '' | 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
  const tagMap: Record<string, '' | 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
    internal: 'info',
    external: 'success',
    category: 'warning',
    resource: 'danger'
  };
  return tagMap[type] || 'info';
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

    .image-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 180px;
      height: 60px;
      background: #f5f7fa;
      border-radius: 4px;
      color: #165dff;

      .el-icon {
        font-size: 24px;
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
    width: 100%;
    
    .banner-uploader {
      width: 100%;
      
      :deep(.el-upload) {
        width: 100%;
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
        width: 100%;
        max-width: 560px;
        height: 180px;
        object-fit: cover;
        display: block;
      }

      .upload-placeholder {
        width: 100%;
        max-width: 560px;
        height: 180px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #fafafa;
        box-sizing: border-box;
        padding: 20px;

        .upload-icon {
          font-size: 40px;
          color: #999;
          margin-bottom: 10px;
        }

        .upload-text {
          font-size: 14px;
          color: #666;
          margin-bottom: 6px;
        }

        .upload-tip {
          font-size: 12px;
          color: #999;
          text-align: center;
        }
      }
    }
  }

  .form-tip {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }

  // 链接验证提示样式
  .link-validation-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 13px;
    line-height: 1.4;

    .el-icon {
      flex-shrink: 0;
      font-size: 16px;
    }

    &.success {
      background-color: #f0f9eb;
      color: #67c23a;
      border: 1px solid #e1f3d8;
    }

    &.warning {
      background-color: #fdf6ec;
      color: #e6a23c;
      border: 1px solid #faecd8;
    }

    &.info {
      background-color: #f4f4f5;
      color: #909399;
      border: 1px solid #e9e9eb;
    }
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
