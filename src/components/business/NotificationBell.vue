<template>
  <div class="notification-bell">
    <el-popover
      v-model:visible="popoverVisible"
      placement="bottom-end"
      :width="360"
      trigger="click"
      popper-class="notification-popover"
    >
      <template #reference>
        <el-badge
          :value="unreadCount"
          :hidden="unreadCount === 0"
          :max="99"
          class="notification-badge"
        >
          <el-button
            circle
            :icon="Bell"
            class="bell-button"
            @click="handleBellClick"
          />
        </el-badge>
      </template>

      <div class="notification-panel">
        <div class="panel-header">
          <span class="title">消息通知</span>
          <el-button
            v-if="unreadCount > 0"
            type="primary"
            link
            size="small"
            @click="handleMarkAllRead"
          >
            全部已读
          </el-button>
        </div>

        <div
          v-loading="loading"
          class="panel-content"
        >
          <template v-if="notifications.length > 0">
            <div
              v-for="item in notifications"
              :key="item.notificationId"
              class="notification-item"
              :class="{ unread: !item.isRead }"
              @click="handleNotificationClick(item)"
            >
              <div class="item-icon">
                <el-icon
                  :class="getIconClass(item.type)"
                >
                  <component :is="getIcon(item.type)" />
                </el-icon>
              </div>
              <div class="item-content">
                <div class="item-title">
                  {{ item.title }}
                </div>
                <div class="item-desc">
                  {{ item.content }}
                </div>
                <div class="item-time">
                  {{ formatTime(item.createdAt) }}
                </div>
              </div>
              <div
                v-if="!item.isRead"
                class="unread-dot"
              />
            </div>
          </template>
          <el-empty
            v-else
            description="暂无通知"
            :image-size="80"
          />
        </div>

        <div
          v-if="notifications.length > 0"
          class="panel-footer"
        >
          <el-button
            type="primary"
            link
            @click="handleViewAll"
          >
            查看全部通知
          </el-button>
        </div>
      </div>
    </el-popover>

    <!-- 消息详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedNotification?.title || '消息详情'"
      width="480px"
      class="notification-detail-dialog"
    >
      <div
        v-if="selectedNotification"
        class="notification-detail"
      >
        <div class="detail-header">
          <el-icon
            :class="getIconClass(selectedNotification.type)"
            class="detail-icon"
          >
            <component :is="getIcon(selectedNotification.type)" />
          </el-icon>
          <span class="detail-time">{{ formatTime(selectedNotification.createdAt) }}</span>
        </div>
        <div class="detail-content">
          {{ selectedNotification.content }}
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Bell, CircleCheck, CircleClose, InfoFilled } from '@element-plus/icons-vue';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  type Notification
} from '@/api/notification';
import { formatRelativeTime } from '@/utils/format';
import { isApiSuccess } from '@/types/api';

const router = useRouter();

const popoverVisible = ref(false);
const loading = ref(false);
const notifications = ref<Notification[]>([]);
const unreadCount = ref(0);
const detailDialogVisible = ref(false);
const selectedNotification = ref<Notification | null>(null);
let pollTimer: ReturnType<typeof setInterval> | null = null;

/** 获取通知列表 */
async function fetchNotifications() {
  loading.value = true;
  try {
    const res = await getNotifications({ pageNum: 1, pageSize: 10 });
    if (isApiSuccess(res) && res.data) {
      notifications.value = res.data.list || [];
      unreadCount.value = res.data.unreadCount || 0;
    }
  } catch (error) {
    console.error('获取通知失败:', error);
  } finally {
    loading.value = false;
  }
}

/** 获取未读数量 */
async function fetchUnreadCount() {
  try {
    const res = await getUnreadCount();
    if (isApiSuccess(res) && res.data) {
      const newCount = res.data.unreadCount || 0;
      // 如果有新通知，显示提示
      if (newCount > unreadCount.value && unreadCount.value > 0) {
        ElMessage.info('您有新的通知');
      }
      unreadCount.value = newCount;
    }
  } catch (error) {
    console.error('获取未读数量失败:', error);
  }
}

/** 点击铃铛 */
function handleBellClick() {
  // 点击铃铛时获取通知列表
  fetchNotifications();
}

/** 点击通知项 */
async function handleNotificationClick(item: Notification) {
  // 标记为已读
  if (!item.isRead) {
    try {
      await markAsRead(item.notificationId);
      item.isRead = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }

  // 关闭下拉面板，打开详情弹窗
  popoverVisible.value = false;
  selectedNotification.value = item;
  detailDialogVisible.value = true;
}

/** 全部标记已读 */
async function handleMarkAllRead() {
  try {
    await markAllAsRead();
    notifications.value.forEach(item => {
      item.isRead = true;
    });
    unreadCount.value = 0;
    ElMessage.success('已全部标记为已读');
  } catch (error) {
    console.error('标记全部已读失败:', error);
    ElMessage.error('操作失败，请重试');
  }
}

/** 查看全部通知 */
function handleViewAll() {
  popoverVisible.value = false;
  router.push('/notifications');
}

/** 获取图标 */
function getIcon(type: string) {
  const iconMap: Record<string, typeof CircleCheck> = {
    audit_approved: CircleCheck,
    audit_rejected: CircleClose,
    system: InfoFilled
  };
  return iconMap[type] || InfoFilled;
}

/** 获取图标样式类 */
function getIconClass(type: string): string {
  const classMap: Record<string, string> = {
    audit_approved: 'icon-success',
    audit_rejected: 'icon-danger',
    system: 'icon-info'
  };
  return classMap[type] || 'icon-info';
}

/** 格式化时间 */
function formatTime(time: string): string {
  return formatRelativeTime(time);
}

/** 开始轮询 */
function startPolling() {
  // 每30秒检查一次未读数量
  pollTimer = setInterval(fetchUnreadCount, 30000);
}

/** 停止轮询 */
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

onMounted(() => {
  fetchUnreadCount();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped lang="scss">
.notification-bell {
  display: inline-flex;
  align-items: center;

  .bell-button {
    font-size: 18px;
    color: #606266;
    border: none;
    background: transparent;

    &:hover {
      color: #165dff;
      background: rgba(22, 93, 255, 0.1);
    }
  }
}

.notification-panel {
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 12px;

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .panel-content {
    max-height: 400px;
    overflow-y: auto;
  }

  .notification-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    margin: 0 -12px;
    cursor: pointer;
    transition: background 0.2s;
    position: relative;

    &:hover {
      background: #f5f7fa;
    }

    &.unread {
      background: #f0f9ff;

      &:hover {
        background: #e6f4ff;
      }
    }

    .item-icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #f5f7fa;

      .el-icon {
        font-size: 18px;

        &.icon-success {
          color: #67c23a;
        }

        &.icon-danger {
          color: #f56c6c;
        }

        &.icon-info {
          color: #909399;
        }
      }
    }

    .item-content {
      flex: 1;
      min-width: 0;

      .item-title {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-desc {
        font-size: 13px;
        color: #606266;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .item-time {
        font-size: 12px;
        color: #909399;
      }
    }

    .unread-dot {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 8px;
      height: 8px;
      background: #f56c6c;
      border-radius: 50%;
    }
  }

  .panel-footer {
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
    margin-top: 12px;
    text-align: center;
  }
}
</style>

<style>
/* 全局样式，用于 popover */
.notification-popover {
  padding: 16px !important;
}

/* 消息详情弹窗样式 */
.notification-detail-dialog .el-dialog__body {
  padding: 16px 20px;
}

.notification-detail {
  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #ebeef5;
  }

  .detail-icon {
    font-size: 24px;

    &.icon-success {
      color: #67c23a;
    }

    &.icon-danger {
      color: #f56c6c;
    }

    &.icon-info {
      color: #909399;
    }
  }

  .detail-time {
    font-size: 13px;
    color: #909399;
  }

  .detail-content {
    font-size: 14px;
    line-height: 1.8;
    color: #303133;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
