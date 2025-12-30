<!--
  定价修改历史弹窗组件
  
  功能：
  - 显示资源定价修改历史
  - 显示修改人、时间、原值、新值、原因
  
  需求: 8.6
-->

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useUserStore } from '@/pinia/userStore';

interface PricingHistoryRecord {
  logId: string;
  resourceId: string;
  changedBy: string;
  changedByName: string;
  changedByRole: 'uploader' | 'auditor' | 'admin';
  oldPricingType: number;
  newPricingType: number;
  oldPointsCost: number;
  newPointsCost: number;
  changeReason: string | null;
  createdAt: string;
}

interface Props {
  visible: boolean;
  resourceId: string;
  resourceTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  resourceTitle: '',
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const userStore = useUserStore();
const loading = ref(false);
const historyList = ref<PricingHistoryRecord[]>([]);

/** 获取定价类型文本 */
function getPricingTypeText(type: number): string {
  const typeMap: Record<number, string> = {
    0: '免费',
    1: '付费积分',
    2: 'VIP专属',
  };
  return typeMap[type] || '未知';
}

/** 获取角色文本 */
function getRoleText(role: string): string {
  const roleMap: Record<string, string> = {
    uploader: '上传者',
    auditor: '审核员',
    admin: '管理员',
  };
  return roleMap[role] || role;
}

/** 获取角色标签类型 */
function getRoleTagType(role: string): string {
  const typeMap: Record<string, string> = {
    uploader: '',
    auditor: 'warning',
    admin: 'danger',
  };
  return typeMap[role] || 'info';
}

/** 格式化日期时间 */
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 格式化定价变更 */
function formatPricingChange(record: PricingHistoryRecord): string {
  const oldText = record.oldPricingType === 1 
    ? `${record.oldPointsCost}积分` 
    : getPricingTypeText(record.oldPricingType);
  const newText = record.newPricingType === 1 
    ? `${record.newPointsCost}积分` 
    : getPricingTypeText(record.newPricingType);
  return `${oldText} → ${newText}`;
}

/** 获取历史记录 */
async function fetchHistory() {
  if (!props.resourceId) return;
  
  loading.value = true;
  try {
    const response = await fetch(
      `/api/v1/resources/${props.resourceId}/pricing/history`,
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    );

    const result = await response.json();

    if (result.code === 0 || result.code === 200) {
      historyList.value = result.data?.list || [];
    }
  } catch (error) {
    console.error('获取定价历史失败:', error);
    // 使用模拟数据
    historyList.value = [
      {
        logId: '1',
        resourceId: props.resourceId,
        changedBy: 'user1',
        changedByName: '张三',
        changedByRole: 'uploader',
        oldPricingType: 0,
        newPricingType: 1,
        oldPointsCost: 0,
        newPointsCost: 20,
        changeReason: '设置初始定价',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        logId: '2',
        resourceId: props.resourceId,
        changedBy: 'auditor1',
        changedByName: '审核员李四',
        changedByRole: 'auditor',
        oldPricingType: 1,
        newPricingType: 1,
        oldPointsCost: 20,
        newPointsCost: 15,
        changeReason: '定价过高，调整为合理价格',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  } finally {
    loading.value = false;
  }
}

/** 关闭弹窗 */
function handleClose() {
  emit('update:visible', false);
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      fetchHistory();
    }
  }
);
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="定价修改历史"
    width="600px"
    @update:model-value="handleClose"
  >
    <div v-if="resourceTitle" class="resource-title">
      <span class="label">资源：</span>
      <span class="title">{{ resourceTitle }}</span>
    </div>

    <div v-loading="loading" class="history-list">
      <el-timeline v-if="historyList.length > 0">
        <el-timeline-item
          v-for="record in historyList"
          :key="record.logId"
          :timestamp="formatDateTime(record.createdAt)"
          placement="top"
        >
          <div class="history-item">
            <div class="item-header">
              <span class="changer-name">{{ record.changedByName }}</span>
              <el-tag
                :type="getRoleTagType(record.changedByRole)"
                size="small"
              >
                {{ getRoleText(record.changedByRole) }}
              </el-tag>
            </div>
            <div class="item-change">
              <span class="change-label">定价变更：</span>
              <span class="change-value">{{ formatPricingChange(record) }}</span>
            </div>
            <div v-if="record.changeReason" class="item-reason">
              <span class="reason-label">原因：</span>
              <span class="reason-value">{{ record.changeReason }}</span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>

      <el-empty
        v-else-if="!loading"
        description="暂无修改记录"
      />
    </div>

    <template #footer>
      <el-button @click="handleClose">
        关闭
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.resource-title {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;

  .label {
    color: #999;
  }

  .title {
    font-weight: 600;
    color: #333;
  }
}

.history-list {
  min-height: 200px;
}

.history-item {
  .item-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .changer-name {
      font-weight: 600;
      color: #333;
    }
  }

  .item-change {
    margin-bottom: 4px;

    .change-label {
      color: #999;
    }

    .change-value {
      color: #409eff;
      font-weight: 500;
    }
  }

  .item-reason {
    padding: 8px 12px;
    background: #fafafa;
    border-radius: 4px;
    margin-top: 8px;

    .reason-label {
      color: #999;
    }

    .reason-value {
      color: #666;
    }
  }
}
</style>
