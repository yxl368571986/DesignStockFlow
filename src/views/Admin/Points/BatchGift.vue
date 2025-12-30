<script setup lang="ts">
/**
 * 批量赠送积分页面
 * 支持Excel导入用户列表或选择所有用户进行批量赠送
 */
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload, Download, Warning, Check, Close } from '@element-plus/icons-vue';
import { batchGiftPoints, type BatchGiftRequest, type BatchGiftResult } from '@/api/adminRecharge';

// 赠送模式
const giftMode = ref<'import' | 'all'>('import');

// 导入的用户列表
const importedUsers = ref<Array<{ userId: string; username?: string }>>([]);
const fileInputRef = ref<HTMLInputElement>();

// 表单数据
const formRef = ref();
const submitting = ref(false);
const formData = reactive({
  points: 100,
  reason: ''
});

// 表单验证规则
const formRules = {
  points: [
    { required: true, message: '请输入赠送积分数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 99999, message: '积分数量范围为1-99999', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请输入赠送原因', trigger: 'blur' },
    { min: 5, max: 200, message: '赠送原因长度为5-200个字符', trigger: 'blur' }
  ]
};

// 赠送结果
const giftResult = ref<BatchGiftResult | null>(null);
const showResult = ref(false);

// 是否需要二次审批
const needApproval = computed(() => {
  if (giftMode.value === 'all') return true;
  return importedUsers.value.length >= 100;
});

// 用户数量
const userCount = computed(() => {
  if (giftMode.value === 'all') return '所有用户';
  return `${importedUsers.value.length} 个用户`;
});

/** 触发文件选择 */
function handleSelectFile(): void {
  fileInputRef.value?.click();
}

/** 处理文件上传 */
function handleFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // 检查文件类型
  const validTypes = ['.xlsx', '.xls', '.csv'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!validTypes.includes(ext)) {
    ElMessage.error('请上传Excel或CSV文件');
    return;
  }

  // 读取文件
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      // 简单解析CSV（实际项目中应使用xlsx库解析Excel）
      const lines = content.split('\n').filter(line => line.trim());
      const users: Array<{ userId: string; username?: string }> = [];
      
      for (let i = 1; i < lines.length; i++) { // 跳过标题行
        const cols = lines[i].split(',');
        if (cols[0]?.trim()) {
          users.push({
            userId: cols[0].trim(),
            username: cols[1]?.trim()
          });
        }
      }
      
      if (users.length === 0) {
        ElMessage.warning('未找到有效的用户数据');
        return;
      }
      
      importedUsers.value = users;
      ElMessage.success(`成功导入 ${users.length} 个用户`);
    } catch (error) {
      console.error('解析文件失败:', error);
      ElMessage.error('文件解析失败，请检查文件格式');
    }
  };
  reader.readAsText(file);
  
  // 清空input以便重复选择同一文件
  input.value = '';
}

/** 下载模板 */
function handleDownloadTemplate(): void {
  const template = 'userId,username\nuser-001,用户1\nuser-002,用户2';
  const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '批量赠送用户模板.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** 移除用户 */
function handleRemoveUser(index: number): void {
  importedUsers.value.splice(index, 1);
}

/** 清空用户列表 */
function handleClearUsers(): void {
  importedUsers.value = [];
}

/** 提交赠送 */
async function handleSubmit(): Promise<void> {
  if (giftMode.value === 'import' && importedUsers.value.length === 0) {
    ElMessage.warning('请先导入用户列表');
    return;
  }
  
  try {
    await formRef.value?.validate();
    
    // 二次确认
    const confirmMsg = `确定要向 ${userCount.value} 赠送 ${formData.points} 积分吗？\n\n${needApproval.value ? '⚠️ 此操作需要二次审批' : ''}`;
    await ElMessageBox.confirm(confirmMsg, '确认赠送', { type: 'warning' });
    
    submitting.value = true;
    const data: BatchGiftRequest = {
      userIds: giftMode.value === 'all' ? ['ALL'] : importedUsers.value.map(u => u.userId),
      points: formData.points,
      reason: formData.reason
    };
    
    const res = await batchGiftPoints(data);
    if (res.code === 200 || res.code === 0) {
      giftResult.value = res.data;
      showResult.value = true;
      ElMessage.success('批量赠送完成');
    } else {
      ElMessage.error(res.message || '赠送失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量赠送失败:', error);
    }
  } finally {
    submitting.value = false;
  }
}

/** 关闭结果弹窗 */
function handleCloseResult(): void {
  showResult.value = false;
  giftResult.value = null;
  formData.reason = '';
  if (giftMode.value === 'import') {
    importedUsers.value = [];
  }
}
</script>

<template>
  <div class="batch-gift">
    <div class="page-header">
      <h2 class="page-title">批量赠送积分</h2>
    </div>
    <div class="content-wrapper">
      <!-- 赠送模式选择 -->
      <div class="mode-section">
        <h3 class="section-title">选择赠送方式</h3>
        <el-radio-group v-model="giftMode" size="large">
          <el-radio-button value="import">导入用户列表</el-radio-button>
          <el-radio-button value="all">所有用户</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 导入用户区域 -->
      <div v-if="giftMode === 'import'" class="import-section">
        <h3 class="section-title">导入用户</h3>
        <div class="import-actions">
          <el-button type="primary" :icon="Upload" @click="handleSelectFile">选择文件</el-button>
          <el-button :icon="Download" @click="handleDownloadTemplate">下载模板</el-button>
          <input ref="fileInputRef" type="file" accept=".xlsx,.xls,.csv" style="display: none" @change="handleFileChange">
        </div>
        <div class="import-tip">支持 Excel (.xlsx, .xls) 或 CSV 格式，第一列为用户ID</div>
        
        <!-- 已导入用户列表 -->
        <div v-if="importedUsers.length > 0" class="imported-users">
          <div class="users-header">
            <span>已导入 {{ importedUsers.length }} 个用户</span>
            <el-button type="danger" link @click="handleClearUsers">清空</el-button>
          </div>
          <div class="users-list">
            <div v-for="(user, index) in importedUsers.slice(0, 10)" :key="user.userId" class="user-tag">
              <span>{{ user.username || user.userId }}</span>
              <el-icon class="remove-icon" @click="handleRemoveUser(index)"><Close /></el-icon>
            </div>
            <div v-if="importedUsers.length > 10" class="more-users">
              +{{ importedUsers.length - 10 }} 更多...
            </div>
          </div>
        </div>
      </div>

      <!-- 所有用户提示 -->
      <div v-if="giftMode === 'all'" class="all-users-notice">
        <el-icon><Warning /></el-icon>
        <span>将向系统中所有用户赠送积分，此操作需要二次审批</span>
      </div>

      <!-- 赠送表单 -->
      <div class="gift-form-section">
        <h3 class="section-title">赠送设置</h3>
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
          <el-form-item label="赠送积分" prop="points">
            <el-input-number v-model="formData.points" :min="1" :max="99999" :precision="0" />
            <div v-if="needApproval" class="approval-tip">
              <el-icon><Warning /></el-icon> 此操作需要二次审批
            </div>
          </el-form-item>
          <el-form-item label="赠送原因" prop="reason">
            <el-input v-model="formData.reason" type="textarea" :rows="4" 
              placeholder="请输入赠送原因（5-200字）" maxlength="200" show-word-limit />
          </el-form-item>
          <el-form-item label="赠送对象">
            <div class="target-info">{{ userCount }}</div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">确认赠送</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 结果弹窗 -->
    <el-dialog v-model="showResult" title="赠送结果" width="500px" :close-on-click-modal="false">
      <div v-if="giftResult" class="result-content">
        <div class="result-summary">
          <div class="result-item success">
            <el-icon><Check /></el-icon>
            <span>成功: {{ giftResult.successCount }} 人</span>
          </div>
          <div class="result-item failed">
            <el-icon><Close /></el-icon>
            <span>失败: {{ giftResult.failedCount }} 人</span>
          </div>
        </div>
        <div v-if="giftResult.failedUsers.length > 0" class="failed-list">
          <h4>失败详情</h4>
          <div v-for="item in giftResult.failedUsers" :key="item.userId" class="failed-item">
            <span class="user-id">{{ item.userId }}</span>
            <span class="reason">{{ item.reason }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="handleCloseResult">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.batch-gift { padding: 20px; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
.content-wrapper { background: #fff; border-radius: 8px; padding: 24px; }
.section-title { font-size: 16px; font-weight: 600; color: #303133; margin: 0 0 16px 0; }
.mode-section { margin-bottom: 24px; }
.import-section { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #ebeef5; }
.import-actions { display: flex; gap: 12px; margin-bottom: 12px; }
.import-tip { font-size: 12px; color: #909399; }
.imported-users { margin-top: 16px; padding: 16px; background: #f5f7fa; border-radius: 8px; }
.users-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; color: #606266; }
.users-list { display: flex; flex-wrap: wrap; gap: 8px; }
.user-tag { display: flex; align-items: center; gap: 4px; padding: 4px 8px; background: #fff; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 12px; }
.remove-icon { cursor: pointer; color: #909399; }
.remove-icon:hover { color: #f56c6c; }
.more-users { padding: 4px 8px; color: #909399; font-size: 12px; }
.all-users-notice { display: flex; align-items: center; gap: 8px; padding: 16px; background: #fef0f0; border-radius: 8px; color: #f56c6c; margin-bottom: 24px; }
.gift-form-section { max-width: 600px; }
.approval-tip { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #e6a23c; margin-top: 8px; }
.target-info { font-size: 16px; font-weight: 600; color: #409eff; }
.result-content { padding: 20px 0; }
.result-summary { display: flex; gap: 32px; justify-content: center; margin-bottom: 24px; }
.result-item { display: flex; align-items: center; gap: 8px; font-size: 18px; }
.result-item.success { color: #67c23a; }
.result-item.failed { color: #f56c6c; }
.failed-list { border-top: 1px solid #ebeef5; padding-top: 16px; }
.failed-list h4 { font-size: 14px; color: #606266; margin: 0 0 12px 0; }
.failed-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.failed-item .user-id { color: #303133; }
.failed-item .reason { color: #f56c6c; }
</style>
