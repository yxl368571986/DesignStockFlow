<!--
  公告管理页面
  
  功能：
  - 显示公告列表
  - 添加/编辑/删除公告
  - 支持富文本编辑
  - 公告类型设置
  
  需求: 需求17.6-17.8
-->

<template>
  <div class="announcements-management">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">公告管理</h2>
        <p class="page-desc">管理系统公告，支持富文本编辑和多种公告类型</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Plus" @click="handleAdd">
          添加公告
        </el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="公告类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 150px">
            <el-option label="普通公告" value="normal" />
            <el-option label="重要公告" value="important" />
            <el-option label="警告公告" value="warning" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="是否置顶">
          <el-select v-model="filterForm.isTop" placeholder="全部" clearable style="width: 120px">
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 公告列表 -->
    <el-card class="list-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="announcementList"
        stripe
        style="width: 100%"
      >
        <el-table-column label="序号" type="index" width="60" align="center" />
        
        <el-table-column label="标题" prop="title" min-width="200" show-overflow-tooltip />

        <el-table-column label="类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" effect="dark">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="内容预览" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="content-preview" v-html="getContentPreview(row.content)"></div>
          </template>
        </el-table-column>

        <el-table-column label="链接" prop="linkUrl" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link v-if="row.linkUrl" :href="row.linkUrl" target="_blank" type="primary">
              查看链接
            </el-link>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <el-table-column label="生效时间" width="180">
          <template #default="{ row }">
            <div class="time-range">
              <div>{{ formatDate(row.startTime) }}</div>
              <div>{{ formatDate(row.endTime) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="置顶" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isTop" type="danger" size="small">置顶</el-tag>
            <span v-else class="text-muted">-</span>
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

        <el-table-column label="操作" width="200" align="center" fixed="right">
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
              v-if="!row.isTop"
              type="warning"
              link
              :icon="Top"
              @click="handleTop(row)"
            >
              置顶
            </el-button>
            <el-button
              v-else
              type="info"
              link
              :icon="Bottom"
              @click="handleCancelTop(row)"
            >
              取消置顶
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

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchAnnouncementList"
          @current-change="fetchAnnouncementList"
        />
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="公告标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入公告标题"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="公告类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio label="normal">普通公告</el-radio>
            <el-radio label="important">重要公告</el-radio>
            <el-radio label="warning">警告公告</el-radio>
          </el-radio-group>
          <div class="form-tip">
            重要公告会以醒目样式展示，警告公告会以警告色展示
          </div>
        </el-form-item>

        <el-form-item label="公告内容" prop="content">
          <div class="editor-container">
            <el-input
              v-model="formData.content"
              type="textarea"
              :rows="10"
              placeholder="请输入公告内容，支持HTML格式"
              maxlength="5000"
              show-word-limit
            />
            <div class="editor-tip">
              提示：支持HTML标签，如 &lt;b&gt;粗体&lt;/b&gt;、&lt;i&gt;斜体&lt;/i&gt;、&lt;a href=""&gt;链接&lt;/a&gt; 等
            </div>
          </div>
        </el-form-item>

        <el-form-item label="链接地址" prop="linkUrl">
          <el-input
            v-model="formData.linkUrl"
            placeholder="选填，点击公告时跳转的链接地址"
            :prefix-icon="Link"
          >
            <template #append>
              <el-button :icon="View" @click="previewLink">预览</el-button>
            </template>
          </el-input>
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

        <el-form-item label="是否置顶" prop="isTop">
          <el-switch v-model="formData.isTop" />
          <span class="form-tip">置顶公告会显示在列表顶部</span>
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
import { Plus, Edit, Delete, Search, Refresh, Link, View, Top, Bottom } from '@element-plus/icons-vue';

// 类型定义
interface AnnouncementItem {
  announcementId?: string;
  title: string;
  content: string;
  type: 'normal' | 'important' | 'warning';
  linkUrl?: string;
  isTop: boolean;
  startTime: string;
  endTime: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  announcementId?: string;
  title: string;
  content: string;
  type: 'normal' | 'important' | 'warning';
  linkUrl: string;
  timeRange: [string, string] | null;
  isTop: boolean;
  status: number;
}

// 数据状态
const loading = ref(false);
const announcementList = ref<AnnouncementItem[]>([]);

// 筛选表单
const filterForm = reactive({
  type: '',
  status: undefined as number | undefined,
  isTop: undefined as boolean | undefined
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

// 对话框状态
const dialogVisible = ref(false);
const dialogTitle = computed(() => formData.announcementId ? '编辑公告' : '添加公告');
const submitting = ref(false);

// 表单引用和数据
const formRef = ref<FormInstance>();
const formData = reactive<FormData>({
  title: '',
  content: '',
  type: 'normal',
  linkUrl: '',
  timeRange: null,
  isTop: false,
  status: 1
});

// 表单验证规则
const formRules: FormRules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 2, max: 200, message: '标题长度在2-200个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 10, max: 5000, message: '内容长度在10-5000个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择公告类型', trigger: 'change' }
  ]
};

// 获取公告列表
const fetchAnnouncementList = async () => {
  loading.value = true;
  try {
    // TODO: 调用实际API
    // const response = await getAnnouncements({
    //   ...filterForm,
    //   page: pagination.page,
    //   pageSize: pagination.pageSize
    // });
    // announcementList.value = response.data.list;
    // pagination.total = response.data.total;
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500));
    announcementList.value = [
      {
        announcementId: '1',
        title: '系统维护通知',
        content: '系统将于<b>2024年1月15日 02:00-04:00</b>进行维护升级，期间可能无法访问，请提前做好准备。感谢您的理解与支持！',
        type: 'important',
        linkUrl: '',
        isTop: true,
        startTime: '2024-01-10 00:00:00',
        endTime: '2024-01-20 23:59:59',
        status: 1,
        createdAt: '2024-01-10 10:00:00'
      },
      {
        announcementId: '2',
        title: '春节活动上线',
        content: '春节特别活动已上线！上传作品即可获得<span style="color: #ff7d00;">双倍积分</span>，更有机会赢取VIP年卡！活动时间：1月20日-2月20日。',
        type: 'normal',
        linkUrl: '/activities/spring-festival',
        isTop: false,
        startTime: '2024-01-20 00:00:00',
        endTime: '2024-02-20 23:59:59',
        status: 1,
        createdAt: '2024-01-15 10:00:00'
      },
      {
        announcementId: '3',
        title: '违规内容处理公告',
        content: '近期发现部分用户上传违规内容，请各位用户遵守平台规则。违规内容将被删除，严重者将被封号处理。',
        type: 'warning',
        linkUrl: '/rules',
        isTop: false,
        startTime: '2024-01-01 00:00:00',
        endTime: '2024-12-31 23:59:59',
        status: 1,
        createdAt: '2024-01-01 10:00:00'
      }
    ];
    pagination.total = 3;
  } catch (error) {
    ElMessage.error('获取公告列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 查询
const handleSearch = () => {
  pagination.page = 1;
  fetchAnnouncementList();
};

// 重置
const handleReset = () => {
  Object.assign(filterForm, {
    type: '',
    status: undefined,
    isTop: undefined
  });
  handleSearch();
};

// 添加公告
const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
};

// 编辑公告
const handleEdit = (row: AnnouncementItem) => {
  resetForm();
  Object.assign(formData, {
    announcementId: row.announcementId,
    title: row.title,
    content: row.content,
    type: row.type,
    linkUrl: row.linkUrl || '',
    timeRange: [row.startTime, row.endTime],
    isTop: row.isTop,
    status: row.status
  });
  dialogVisible.value = true;
};

// 删除公告
const handleDelete = async (row: AnnouncementItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除公告"${row.title}"吗？删除后将无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    // TODO: 调用删除API
    // await deleteAnnouncement(row.announcementId);
    
    ElMessage.success('删除成功');
    await fetchAnnouncementList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
      console.error(error);
    }
  }
};

// 置顶
const handleTop = async (row: AnnouncementItem) => {
  try {
    // TODO: 调用置顶API
    // await topAnnouncement(row.announcementId);
    
    row.isTop = true;
    ElMessage.success('置顶成功');
  } catch (error) {
    ElMessage.error('置顶失败');
    console.error(error);
  }
};

// 取消置顶
const handleCancelTop = async (row: AnnouncementItem) => {
  try {
    // TODO: 调用取消置顶API
    // await cancelTopAnnouncement(row.announcementId);
    
    row.isTop = false;
    ElMessage.success('已取消置顶');
  } catch (error) {
    ElMessage.error('操作失败');
    console.error(error);
  }
};

// 状态切换
const handleStatusChange = async (row: AnnouncementItem) => {
  try {
    // TODO: 调用更新状态API
    // await updateAnnouncementStatus(row.announcementId, row.status);
    
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
    if (formData.announcementId) {
      // await updateAnnouncement(formData.announcementId, submitData);
      ElMessage.success('编辑成功');
    } else {
      // await createAnnouncement(submitData);
      ElMessage.success('添加成功');
    }

    dialogVisible.value = false;
    await fetchAnnouncementList();
  } catch (error) {
    if (error !== false) {
      ElMessage.error('操作失败');
      console.error(error);
    }
  } finally {
    submitting.value = false;
  }
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
    announcementId: undefined,
    title: '',
    content: '',
    type: 'normal',
    linkUrl: '',
    timeRange: null,
    isTop: false,
    status: 1
  });
};

// 获取类型标签颜色
const getTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    normal: '',
    important: 'danger',
    warning: 'warning'
  };
  return tagMap[type] || '';
};

// 获取类型文本
const getTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    normal: '普通',
    important: '重要',
    warning: '警告'
  };
  return textMap[type] || type;
};

// 获取内容预览
const getContentPreview = (content: string) => {
  // 移除HTML标签，只保留纯文本
  const text = content.replace(/<[^>]+>/g, '');
  return text.length > 50 ? text.substring(0, 50) + '...' : text;
};

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return dateStr.replace(/:\d{2}$/, ''); // 去掉秒
};

// 初始化
onMounted(() => {
  fetchAnnouncementList();
});
</script>

<style scoped lang="scss">
.announcements-management {
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

  .filter-card {
    margin-bottom: 20px;
  }

  .list-card {
    :deep(.el-card__body) {
      padding: 0;
    }

    .content-preview {
      font-size: 13px;
      color: #666;
      line-height: 1.6;
    }

    .time-range {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }

    .text-muted {
      color: #999;
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    padding: 20px;
  }

  .editor-container {
    width: 100%;

    .editor-tip {
      font-size: 12px;
      color: #999;
      margin-top: 8px;
      line-height: 1.6;
    }
  }

  .form-tip {
    font-size: 12px;
    color: #999;
    margin-left: 12px;
  }
}

// 暗黑模式
:global(.dark) {
  .announcements-management {
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

    .content-preview {
      color: #999 !important;
    }
  }
}
</style>
