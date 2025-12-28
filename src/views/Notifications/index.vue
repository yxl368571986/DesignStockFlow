<template>
  <div class="notifications-page">
    <div class="page-header">
      <h1 class="page-title">
        消息通知
      </h1>
      <div class="page-actions">
        <el-button
          v-if="unreadCount > 0"
          type="primary"
          @click="handleMarkAllRead"
        >
          全部标记已读
        </el-button>
      </div>
    </div>

    <el-card
      v-loading="loading"
      class="notifications-card"
      shadow="never"
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
            <el-icon :class="getIconClass(item.type)">
              <component :is="getIcon(item.type)" />
            </el-icon>
          </div>
          <div class="item-content">
            <div class="item-header">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-time">{{ formatTime(item.createdAt) }}</span>
            </div>
            <div class="item-desc">
              {{ item.content }}
            </div>
          </div>
          <div class="item-actions">
            <el-button
              v-if="!item.isRead"
              type="primary"
              link
              size="small"
              @click.stop="handleMarkRead(item)"
            >
              标记已读
            </el-button>
            <el-button
              v-if="item.resourceId"
              type="primary"
              link
              size="small"
              @click.stop="handleViewResource(item)"
            >
              查看资源
            </el-button>
          </div>
        </div>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchNotifications"
            @current-change="fetchNotifications"
          />
        </div>
      </template>

      <el-empty
        v-else
        description="暂无通知消息"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { CircleCheck, CircleClose, InfoFilled } from '@element-plus/icons-vue';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type Notification
} from '@/api/notification';
import { formatRelativeTime } from '@/utils/format';

const router = useRouter();

const loading = ref(false);
const notifications = ref<Notification[]>([]);
const unreadCount = ref(0);
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

/** 获取通知列表 */
async function fetchNotifications() {
  loading.value = true;
  try {
    const res = await getNotifications({
      pageNum: pagination.page,
      pageSize: pagination.pageSize
    });
    if (res.code === 200 && res.data) {
      notifications.value = res.data.list || [];
      pagination.total = res.data.total || 0;
      unreadCount.value = res.data.unreadCount || 0;
    }
  } catch (error) {
    console.error('获取通知失败:', error);
    ElMessage.error('获取通知失败');
  } finally {
    loading.value = false;
  }
}

/** 点击通知项 */
async function handleNotificationClick(item: Notification) {
  // 标记为已读
  if (!item.isRead) {
    await handleMarkRead(item);
  }

  // 跳转到相关页面
  if (item.resourceId) {
    router.push(`/resource/${item.resourceId}`);
  } else if (item.linkUrl) {
    router.push(item.linkUrl);
  }
}

/** 标记单条已读 */
async function handleMarkRead(item: Notification) {
  try {
    await markAsRead(item.notificationId);
    item.isRead = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  } catch (error) {
    console.error('标记已读失败:', error);
  }
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

/** 查看资源 */
function handleViewResource(item: Notification) {
  if (item.resourceId) {
    router.push(`/resource/${item.resourceId}`);
  }
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

onMounted(() => {
  fetchNotifications();
});
</script>

<style scoped lang="scss">
.notifications-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }

  .notifications-card {
    .notification-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      margin: 0 -20px;
      cursor: pointer;
      transition: background 0.2s;
      border-bottom: 1px solid #ebeef5;

      &:last-child {
        border-bottom: none;
      }

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
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #f5f7fa;

        .el-icon {
          font-size: 22px;

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

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .item-title {
            font-size: 15px;
            font-weight: 500;
            color: #303133;
          }

          .item-time {
            font-size: 13px;
            color: #909399;
          }
        }

        .item-desc {
          font-size: 14px;
          color: #606266;
          line-height: 1.6;
        }
      }

      .item-actions {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;
      }
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }
}

@media (max-width: 768px) {
  .notifications-page {
    padding: 16px;

    .notification-item {
      flex-direction: column;
      gap: 12px;

      .item-actions {
        flex-direction: row;
        justify-content: flex-end;
      }
    }
  }
}
</style>
