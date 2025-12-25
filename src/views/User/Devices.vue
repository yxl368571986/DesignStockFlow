<script setup lang="ts">
/**
 * 设备管理页面
 * 显示用户登录设备列表，支持踢出设备
 */

import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserDevices, kickDevice } from '@/api/vip';
import type { DeviceInfo } from '@/api/vip';

/** 设备列表 */
const devices = ref<DeviceInfo[]>([]);

/** 加载状态 */
const loading = ref(true);

/** 踢出中的设备ID */
const kickingDeviceId = ref<string | null>(null);

/** 获取设备图标 */
function getDeviceIcon(deviceType: string): string {
  const map: Record<string, string> = {
    desktop: 'Monitor',
    mobile: 'Cellphone',
    tablet: 'Iphone'
  };
  return map[deviceType] || 'Monitor';
}

/** 格式化时间 */
function formatTime(time: string): string {
  if (!time) return '-';
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 1分钟内
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  // 1小时内
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  }
  // 24小时内
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  }
  // 超过24小时
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** 加载设备列表 */
async function loadDevices() {
  loading.value = true;
  try {
    const res = await getUserDevices();
    if (res.code === 200 && res.data) {
      devices.value = res.data;
    }
  } catch (error) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
}

/** 踢出设备 */
async function handleKickDevice(device: DeviceInfo) {
  if (device.isCurrent) {
    ElMessage.warning('不能踢出当前设备');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要将该设备（${device.browser} - ${device.os}）下线吗？`,
      '踢出设备',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    kickingDeviceId.value = device.sessionId;
    const res = await kickDevice(device.sessionId);
    
    if (res.code === 200) {
      ElMessage.success('设备已下线');
      loadDevices();
    } else {
      ElMessage.error(res.msg || '操作失败');
    }
  } catch {
    // 用户取消
  } finally {
    kickingDeviceId.value = null;
  }
}

// 初始化
onMounted(() => {
  loadDevices();
});
</script>

<template>
  <div class="devices-page">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">设备管理</h1>
        <p class="page-desc">管理您的登录设备，最多支持3台设备同时在线</p>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-wrapper">
        <el-skeleton :rows="4" animated />
      </div>
      
      <!-- 空状态 -->
      <el-empty v-else-if="devices.length === 0" description="暂无登录设备" />
      
      <!-- 设备列表 -->
      <div v-else class="device-list">
        <div
          v-for="device in devices"
          :key="device.sessionId"
          class="device-card"
          :class="{ current: device.isCurrent, inactive: !device.isActive }"
        >
          <!-- 设备图标 -->
          <div class="device-icon">
            <el-icon v-if="getDeviceIcon(device.deviceType) === 'Monitor'"><Monitor /></el-icon>
            <el-icon v-else-if="getDeviceIcon(device.deviceType) === 'Cellphone'"><Cellphone /></el-icon>
            <el-icon v-else><Iphone /></el-icon>
          </div>
          
          <!-- 设备信息 -->
          <div class="device-info">
            <div class="device-name">
              <span>{{ device.browser }}</span>
              <el-tag v-if="device.isCurrent" type="success" size="small">当前设备</el-tag>
              <el-tag v-if="!device.isActive" type="info" size="small">已离线</el-tag>
            </div>
            <div class="device-meta">
              <span>{{ device.os }}</span>
              <span class="divider">|</span>
              <span>{{ device.ipAddress }}</span>
            </div>
            <div class="device-time">
              最后活跃：{{ formatTime(device.lastActiveAt) }}
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="device-action">
            <el-button
              v-if="!device.isCurrent"
              type="danger"
              text
              :loading="kickingDeviceId === device.sessionId"
              @click="handleKickDevice(device)"
            >
              下线
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 说明 -->
      <div class="notice-section">
        <h4>设备管理说明</h4>
        <ul>
          <li>为保障账户安全，同一账号最多支持3台设备同时登录</li>
          <li>如发现异常设备登录，请及时将其下线并修改密码</li>
          <li>下线设备后，该设备需要重新登录才能使用</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Monitor, Cellphone, Iphone } from '@element-plus/icons-vue';
export default {
  components: { Monitor, Cellphone, Iphone }
};
</script>

<style scoped>
.devices-page {
  min-height: 100vh;
  background: #F5F7FA;
  padding: 24px;
}

.page-container {
  max-width: 600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.loading-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.device-card.current {
  border: 2px solid #67C23A;
}

.device-card.inactive {
  opacity: 0.6;
}

.device-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F7FA;
  border-radius: 12px;
  font-size: 24px;
  color: #409EFF;
}

.device-info {
  flex: 1;
}

.device-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.device-meta {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.device-meta .divider {
  margin: 0 8px;
  color: #E4E7ED;
}

.device-time {
  font-size: 12px;
  color: #C0C4CC;
}

.notice-section {
  margin-top: 24px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
}

.notice-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.notice-section ul {
  margin: 0;
  padding-left: 20px;
}

.notice-section li {
  font-size: 13px;
  color: #909399;
  line-height: 1.8;
}

@media (max-width: 768px) {
  .devices-page {
    padding: 16px;
  }
  
  .device-card {
    flex-wrap: wrap;
  }
  
  .device-action {
    width: 100%;
    text-align: right;
    margin-top: 8px;
  }
}
</style>
