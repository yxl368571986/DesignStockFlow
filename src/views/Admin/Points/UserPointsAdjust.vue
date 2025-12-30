<script setup lang="ts">
/**
 * 用户积分调整页面
 * 支持单用户积分增加/扣除操作
 */
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Minus, Warning } from '@element-plus/icons-vue';
import { adjustUserPoints, type PointsAdjustmentRequest } from '@/api/adminRecharge';
import { searchUsers } from '@/api/adminUser';

interface UserInfo {
  userId: string;
  username?: string;
  nickname?: string;
  phone?: string;
  pointsBalance: number;
  status: number;
}

// 用户搜索
const searchKeyword = ref('');
const searchLoading = ref(false);
const searchResults = ref<UserInfo[]>([]);
const selectedUser = ref<UserInfo | null>(null);

// 调整表单
const formRef = ref();
const submitting = ref(false);
const formData = reactive({
  adjustmentType: 'add' as 'add' | 'deduct',
  pointsChange: 100,
  reason: ''
});

// 表单验证规则
const formRules = {
  pointsChange: [
    { required: true, message: '请输入积分数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 99999, message: '积分数量范围为1-99999', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请输入调整原因', trigger: 'blur' },
    { min: 5, max: 200, message: '调整原因长度为5-200个字符', trigger: 'blur' }
  ]
};

// 计算调整后余额
const afterBalance = computed(() => {
  if (!selectedUser.value) return 0;
  const change = formData.adjustmentType === 'add' ? formData.pointsChange : -formData.pointsChange;
  return Math.max(0, selectedUser.value.pointsBalance + change);
});

// 是否需要二次审批
const needApproval = computed(() => formData.pointsChange >= 1000);

/** 搜索用户 */
async function handleSearch(): Promise<void> {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词');
    return;
  }
  searchLoading.value = true;
  try {
    const res = await searchUsers({ keyword: searchKeyword.value, page: 1, pageSize: 10 });
    if (res.code === 200 || res.code === 0) {
      searchResults.value = res.data?.list || [];
      if (searchResults.value.length === 0) {
        ElMessage.info('未找到匹配的用户');
      }
    } else {
      ElMessage.error(res.message || '搜索失败');
    }
  } catch (error) {
    console.error('搜索用户失败:', error);
    ElMessage.error('搜索失败，请稍后重试');
  } finally {
    searchLoading.value = false;
  }
}

/** 选择用户 */
function handleSelectUser(user: UserInfo): void {
  selectedUser.value = user;
  searchResults.value = [];
}

/** 清除选择 */
function handleClearUser(): void {
  selectedUser.value = null;
  formData.pointsChange = 100;
  formData.reason = '';
}

/** 提交调整 */
async function handleSubmit(): Promise<void> {
  if (!selectedUser.value) {
    ElMessage.warning('请先选择用户');
    return;
  }
  try {
    await formRef.value?.validate();
    // 扣除时检查余额
    if (formData.adjustmentType === 'deduct' && formData.pointsChange > selectedUser.value.pointsBalance) {
      ElMessage.error('扣除积分不能超过用户当前余额');
      return;
    }
    // 二次确认
    const actionText = formData.adjustmentType === 'add' ? '增加' : '扣除';
    const confirmMsg = `确定要为用户「${selectedUser.value.nickname || selectedUser.value.username}」${actionText} ${formData.pointsChange} 积分吗？\n\n调整后余额：${afterBalance.value} 积分`;
    await ElMessageBox.confirm(confirmMsg, '确认调整', { type: 'warning' });
    
    submitting.value = true;
    const data: PointsAdjustmentRequest = {
      targetUserId: selectedUser.value.userId,
      adjustmentType: formData.adjustmentType,
      pointsChange: formData.pointsChange,
      reason: formData.reason
    };
    const res = await adjustUserPoints(data);
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('积分调整成功');
      // 更新用户余额显示
      selectedUser.value.pointsBalance = afterBalance.value;
      formData.reason = '';
    } else {
      ElMessage.error(res.message || '调整失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('积分调整失败:', error);
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="points-adjust">
    <div class="page-header">
      <h2 class="page-title">用户积分调整</h2>
    </div>
    <div class="content-wrapper">
      <!-- 用户搜索区域 -->
      <div class="search-section">
        <h3 class="section-title">选择用户</h3>
        <div class="search-box">
          <el-input v-model="searchKeyword" placeholder="输入用户ID、用户名或手机号搜索" clearable
            @keyup.enter="handleSearch" style="width: 300px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" :loading="searchLoading" @click="handleSearch">搜索</el-button>
        </div>
        <!-- 搜索结果 -->
        <div v-if="searchResults.length > 0" class="search-results">
          <div v-for="user in searchResults" :key="user.userId" class="user-item" @click="handleSelectUser(user)">
            <div class="user-info">
              <span class="user-name">{{ user.nickname || user.username || user.userId }}</span>
              <span class="user-phone">{{ user.phone }}</span>
            </div>
            <div class="user-points">余额: {{ user.pointsBalance }} 积分</div>
          </div>
        </div>
        <!-- 已选用户 -->
        <div v-if="selectedUser" class="selected-user">
          <div class="user-card">
            <div class="user-avatar">{{ (selectedUser.nickname || selectedUser.username || 'U').charAt(0) }}</div>
            <div class="user-detail">
              <div class="user-name">{{ selectedUser.nickname || selectedUser.username || selectedUser.userId }}</div>
              <div class="user-meta">ID: {{ selectedUser.userId }} | 手机: {{ selectedUser.phone }}</div>
              <div class="user-balance">当前余额: <span>{{ selectedUser.pointsBalance }}</span> 积分</div>
            </div>
            <el-button type="danger" link @click="handleClearUser">取消选择</el-button>
          </div>
        </div>
      </div>
      <!-- 调整表单 -->
      <div v-if="selectedUser" class="adjust-section">
        <h3 class="section-title">积分调整</h3>
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
          <el-form-item label="调整类型">
            <el-radio-group v-model="formData.adjustmentType">
              <el-radio value="add"><el-icon class="text-green-500"><Plus /></el-icon> 增加积分</el-radio>
              <el-radio value="deduct"><el-icon class="text-red-500"><Minus /></el-icon> 扣除积分</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="积分数量" prop="pointsChange">
            <el-input-number v-model="formData.pointsChange" :min="1" :max="99999" :precision="0" />
            <div v-if="needApproval" class="approval-tip">
              <el-icon><Warning /></el-icon> 单次调整≥1000积分需要二次审批
            </div>
          </el-form-item>
          <el-form-item label="调整后余额">
            <div class="balance-preview">
              <span class="before">{{ selectedUser.pointsBalance }}</span>
              <span class="arrow">→</span>
              <span class="after" :class="{ 'text-green-500': formData.adjustmentType === 'add', 'text-red-500': formData.adjustmentType === 'deduct' }">
                {{ afterBalance }}
              </span>
              <span class="unit">积分</span>
            </div>
          </el-form-item>
          <el-form-item label="调整原因" prop="reason">
            <el-input v-model="formData.reason" type="textarea" :rows="4" placeholder="请输入调整原因（5-200字）"
              maxlength="200" show-word-limit />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">确认调整</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.points-adjust { padding: 20px; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
.content-wrapper { display: flex; gap: 24px; }
.search-section, .adjust-section { background: #fff; border-radius: 8px; padding: 20px; flex: 1; }
.section-title { font-size: 16px; font-weight: 600; color: #303133; margin: 0 0 16px 0; }
.search-box { display: flex; gap: 12px; margin-bottom: 16px; }
.search-results { border: 1px solid #e4e7ed; border-radius: 8px; max-height: 300px; overflow-y: auto; }
.user-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f0f0f0; }
.user-item:hover { background: #f5f7fa; }
.user-item:last-child { border-bottom: none; }
.user-info { display: flex; flex-direction: column; gap: 4px; }
.user-name { font-weight: 500; color: #303133; }
.user-phone { font-size: 12px; color: #909399; }
.user-points { font-size: 14px; color: #409eff; }
.selected-user { margin-top: 16px; }
.user-card { display: flex; align-items: center; gap: 16px; padding: 16px; background: #f5f7fa; border-radius: 8px; }
.user-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 600; }
.user-detail { flex: 1; }
.user-detail .user-name { font-size: 16px; font-weight: 600; color: #303133; }
.user-meta { font-size: 12px; color: #909399; margin-top: 4px; }
.user-balance { font-size: 14px; color: #606266; margin-top: 8px; }
.user-balance span { font-size: 20px; font-weight: 700; color: #409eff; }
.approval-tip { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #e6a23c; margin-top: 8px; }
.balance-preview { display: flex; align-items: center; gap: 8px; font-size: 16px; }
.balance-preview .before { color: #909399; }
.balance-preview .arrow { color: #c0c4cc; }
.balance-preview .after { font-size: 24px; font-weight: 700; }
.balance-preview .unit { color: #606266; }
</style>
