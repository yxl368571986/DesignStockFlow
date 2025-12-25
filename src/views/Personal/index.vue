<template>
  <div class="personal-center">
    <!-- 用户信息卡片 -->
    <div class="user-info-card">
      <div class="user-avatar">
        <el-avatar
          :size="80"
          :src="userInfo?.avatar"
        />
        <el-button
          class="edit-avatar-btn"
          circle
          size="small"
          @click="handleEditAvatar"
        >
          <el-icon><Camera /></el-icon>
        </el-button>
      </div>

      <div class="user-details">
        <div class="user-name">
          <h2>{{ userInfo?.nickname || '未设置昵称' }}</h2>
          <el-tag
            v-if="vipInfo.vipLevel > 0"
            type="warning"
            effect="dark"
            class="vip-badge"
          >
            VIP {{ vipLevelText }}
          </el-tag>
        </div>

        <div class="user-meta">
          <span class="phone">{{ maskedPhone }}</span>
          <span
            v-if="userInfo?.email"
            class="email"
          >{{ userInfo.email }}</span>
        </div>

        <div
          v-if="vipInfo.vipLevel > 0"
          class="vip-expire"
        >
          VIP到期时间：{{ vipInfo.vipExpireTime ? formatTime(vipInfo.vipExpireTime) : '未知' }}
        </div>

        <!-- 积分显示 -->
        <div class="points-section">
          <div
            class="points-info"
            title="点击查看积分详情"
            @click="goToPoints"
          >
            <el-icon><Coin /></el-icon>
            <span class="points-value">{{ pointsBalance }}</span>
            <span class="points-label">积分余额</span>
          </div>
          <div class="points-actions">
            <el-button
              size="small"
              class="points-action-btn"
              @click="goToPointsDetail"
            >
              <el-icon><List /></el-icon>
              查看明细
            </el-button>
            <el-button
              size="small"
              type="warning"
              class="points-action-btn"
              @click="goToPointsRecharge"
            >
              <el-icon><Plus /></el-icon>
              积分充值
            </el-button>
          </div>
        </div>

        <el-button
          type="primary"
          size="small"
          class="edit-profile-btn"
          @click="handleEditProfile"
        >
          编辑个人信息
        </el-button>
      </div>
    </div>

    <!-- Tab切换 -->
    <el-tabs
      v-model="activeTab"
      class="personal-tabs"
      @tab-change="handleTabChange"
    >
      <!-- 下载记录 -->
      <el-tab-pane
        label="下载记录"
        name="downloads"
      >
        <div
          v-loading="downloadLoading"
          class="tab-content"
        >
          <!-- VIP推广入口（非VIP用户显示） -->
          <div
            v-if="!userStore.isVIP"
            class="vip-promotion-banner"
          >
            <div class="banner-content">
              <VipBadge :show-badge="false" />
              <div class="banner-text">
                <span class="banner-title">开通VIP，无限下载</span>
                <span class="banner-desc">VIP会员每日可下载50次，畅享海量资源</span>
              </div>
            </div>
            <el-button
              type="warning"
              size="small"
              @click="handlePurchaseVIP"
            >
              立即开通
            </el-button>
          </div>
          
          <div
            v-if="downloadList.length > 0"
            class="resource-grid"
          >
            <div
              v-for="record in downloadList"
              :key="record.recordId"
              class="resource-item"
              @click="handleViewResource(record.resourceId)"
            >
              <div class="resource-cover">
                <img
                  :src="record.resourceCover"
                  :alt="record.resourceTitle"
                >
                <div class="resource-format">
                  {{ record.resourceFormat }}
                </div>
              </div>
              <div class="resource-info">
                <h3 class="resource-title">
                  {{ record.resourceTitle }}
                </h3>
                <p class="download-time">
                  {{ formatRelativeTime(record.downloadTime) }}
                </p>
              </div>
            </div>
          </div>

          <el-empty
            v-else
            description="暂无下载记录"
          />
        </div>
      </el-tab-pane>

      <!-- 上传记录 -->
      <el-tab-pane
        label="我的上传"
        name="uploads"
      >
        <div
          v-loading="uploadLoading"
          class="tab-content"
        >
          <div
            v-if="uploadList.length > 0"
            class="resource-grid"
          >
            <div
              v-for="record in uploadList"
              :key="record.recordId"
              class="resource-item"
            >
              <div class="resource-cover">
                <img
                  :src="record.resourceCover"
                  :alt="record.resourceTitle"
                >
                <div class="resource-format">
                  {{ record.resourceFormat }}
                </div>
                <div
                  class="audit-status"
                  :class="getAuditStatusClass(record.isAudit)"
                >
                  {{ getAuditStatusText(record.isAudit) }}
                </div>
              </div>
              <div class="resource-info">
                <h3 class="resource-title">
                  {{ record.resourceTitle }}
                </h3>
                <p class="upload-time">
                  {{ formatRelativeTime(record.uploadTime) }}
                </p>
                <p
                  v-if="record.auditMsg"
                  class="audit-msg"
                >
                  {{ record.auditMsg }}
                </p>
              </div>
            </div>
          </div>

          <el-empty
            v-else
            description="暂无上传记录"
          >
            <el-button
              type="primary"
              @click="handleGoUpload"
            >
              去上传
            </el-button>
          </el-empty>
        </div>
      </el-tab-pane>

      <!-- VIP中心 -->
      <el-tab-pane
        label="VIP中心"
        name="vip"
      >
        <div
          v-loading="vipLoading"
          class="tab-content vip-center"
        >
          <!-- 使用VipStatusCard组件 -->
          <VipStatusCard
            :is-vip="vipInfo.vipLevel > 0"
            :is-lifetime-vip="vipInfo.isLifetime"
            :expire-at="vipInfo.vipExpireTime"
            :days-remaining="vipDaysRemaining"
            :privileges="vipInfo.privileges"
            :show-privileges="true"
          />
          
          <!-- VIP特权详情 -->
          <div class="vip-privileges-detail">
            <h3 class="section-title">
              VIP会员特权
            </h3>
            <div class="privileges-grid">
              <div class="privilege-card">
                <div class="privilege-icon">
                  <el-icon><Download /></el-icon>
                </div>
                <div class="privilege-info">
                  <h4>无限下载</h4>
                  <p>每日最多50次下载</p>
                </div>
              </div>
              <div class="privilege-card">
                <div class="privilege-icon">
                  <el-icon><Star /></el-icon>
                </div>
                <div class="privilege-info">
                  <h4>专属标识</h4>
                  <p>金色VIP徽章</p>
                </div>
              </div>
              <div class="privilege-card">
                <div class="privilege-icon">
                  <el-icon><Service /></el-icon>
                </div>
                <div class="privilege-info">
                  <h4>优先客服</h4>
                  <p>专属客服通道</p>
                </div>
              </div>
              <div class="privilege-card">
                <div class="privilege-icon">
                  <el-icon><Discount /></el-icon>
                </div>
                <div class="privilege-info">
                  <h4>积分兑换</h4>
                  <p>积分可兑换VIP时长</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 快捷入口 -->
          <div class="vip-quick-links">
            <el-button
              type="primary"
              @click="handlePurchaseVIP"
            >
              {{ vipInfo.vipLevel > 0 ? '续费VIP' : '开通VIP' }}
            </el-button>
            <el-button @click="goToVipOrders">
              我的订单
            </el-button>
            <el-button @click="goToDevices">
              设备管理
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Camera, Star, Coin, List, Plus, Download, Service, Discount } from '@element-plus/icons-vue';
import { useUserStore } from '@/pinia/userStore';
import { getDownloadHistory, getUploadHistory, getVIPInfo } from '@/api/personal';
import { usePointsSync } from '@/composables/usePointsSync';
import { formatTime, formatRelativeTime } from '@/utils/format';
import { maskPhone } from '@/utils/security';
import VipStatusCard from '@/components/business/VipStatusCard.vue';
import VipBadge from '@/components/business/VipBadge.vue';
import type { DownloadRecord, UploadRecord, VIPInfo } from '@/types/models';

const router = useRouter();
const userStore = useUserStore();
const { refreshPoints } = usePointsSync();

const userInfo = computed(() => userStore.userInfo);
const maskedPhone = computed(() => maskPhone(userInfo.value?.phone || ''));
const pointsBalance = computed(() => userStore.pointsBalance);

const activeTab = ref('downloads');

const downloadLoading = ref(false);
const downloadList = ref<DownloadRecord[]>([]);
const downloadTotal = ref(0);
const downloadPage = ref(1);
const downloadPageSize = ref(12);

const uploadLoading = ref(false);
const uploadList = ref<UploadRecord[]>([]);
const uploadTotal = ref(0);
const uploadPage = ref(1);
const uploadPageSize = ref(12);

const vipLoading = ref(false);
const vipInfo = ref<VIPInfo>({
  vipLevel: 0,
  downloadLimit: 10,
  downloadUsed: 0,
  privileges: []
});

const vipLevelText = computed(() => {
  const levelMap: Record<number, string> = {
    1: '月度会员',
    2: '季度会员',
    3: '年度会员'
  };
  return levelMap[vipInfo.value.vipLevel] || '';
});

/** VIP剩余天数 */
const vipDaysRemaining = computed(() => {
  if (!vipInfo.value.vipExpireTime) return 0;
  const expireDate = new Date(vipInfo.value.vipExpireTime);
  const now = new Date();
  const diffTime = expireDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const editProfileVisible = ref(false);
// TODO: 以下变量为编辑个人资料功能预留，待实现
// @ts-expect-error - Reserved for future profile editing feature
const updateLoading = ref(false);
// @ts-expect-error - Reserved for future profile editing feature
const profileForm = ref({
  nickname: '',
  email: ''
});

const uploadAvatarVisible = ref(false);
// @ts-expect-error - Reserved for future avatar upload feature
const avatarPreview = ref('');

/**
 * 判断是否为认证错误（401/403）
 * 认证错误由请求拦截器统一处理，页面不需要显示额外提示
 */
function isAuthError(error: any): boolean {
  const status = error.response?.status;
  const code = error.response?.data?.code;
  return status === 401 || status === 403 || code === 401 || code === 403;
}

/**
 * 获取下载记录
 * 区分认证错误和其他错误，认证错误由拦截器处理
 */
async function fetchDownloadHistory() {
  downloadLoading.value = true;
  try {
    const res = await getDownloadHistory({
      pageNum: downloadPage.value,
      pageSize: downloadPageSize.value
    });

    if (res.code === 200) {
      downloadList.value = res.data.list;
      downloadTotal.value = res.data.total;
    }
  } catch (error: any) {
    console.error('获取下载记录失败:', error);
    
    // 区分认证错误和其他错误
    if (!isAuthError(error)) {
      // 非认证错误，显示友好提示，不退出登录
      ElMessage.warning('暂时无法加载下载记录，请稍后再试');
    }
    // 认证错误由请求拦截器统一处理，这里不显示消息
    
    // 设置空数据，避免页面报错
    downloadList.value = [];
    downloadTotal.value = 0;
  } finally {
    downloadLoading.value = false;
  }
}

/**
 * 获取上传记录
 * 区分认证错误和其他错误，认证错误由拦截器处理
 */
async function fetchUploadHistory() {
  uploadLoading.value = true;
  try {
    const res = await getUploadHistory({
      pageNum: uploadPage.value,
      pageSize: uploadPageSize.value
    });

    if (res.code === 200) {
      uploadList.value = res.data.list;
      uploadTotal.value = res.data.total;
    }
  } catch (error: any) {
    console.error('获取上传记录失败:', error);
    
    // 区分认证错误和其他错误
    if (!isAuthError(error)) {
      // 非认证错误，显示友好提示，不退出登录
      ElMessage.warning('暂时无法加载上传记录，请稍后再试');
    }
    // 认证错误由请求拦截器统一处理，这里不显示消息
    
    // 设置空数据，避免页面报错
    uploadList.value = [];
    uploadTotal.value = 0;
  } finally {
    uploadLoading.value = false;
  }
}

/**
 * 获取VIP信息
 * 区分认证错误和其他错误，认证错误由拦截器处理
 */
async function fetchVIPInfo() {
  vipLoading.value = true;
  try {
    const res = await getVIPInfo();

    if (res.code === 200) {
      vipInfo.value = res.data;
    }
  } catch (error: any) {
    console.error('获取VIP信息失败:', error);
    
    // 区分认证错误和其他错误
    if (!isAuthError(error)) {
      // 非认证错误，显示友好提示，不退出登录
      ElMessage.warning('暂时无法加载VIP信息，请稍后再试');
    }
    // 认证错误由请求拦截器统一处理，这里不显示消息
    
    // 使用默认VIP信息，避免页面报错
    vipInfo.value = {
      vipLevel: userInfo.value?.vipLevel || 0,
      vipExpireTime: userInfo.value?.vipExpireTime,
      downloadLimit: 10,
      downloadUsed: 0,
      privileges: []
    };
  } finally {
    vipLoading.value = false;
  }
}

function handleTabChange(tabName: string) {
  if (tabName === 'downloads' && downloadList.value.length === 0) {
    fetchDownloadHistory();
  } else if (tabName === 'uploads' && uploadList.value.length === 0) {
    fetchUploadHistory();
  } else if (tabName === 'vip') {
    fetchVIPInfo();
  }
}

function handleViewResource(resourceId: string) {
  router.push(`/resource/${resourceId}`);
}

function handleGoUpload() {
  router.push('/upload');
}

function handleEditProfile() {
  editProfileVisible.value = true;
}

// TODO: 实现更新个人资料逻辑
// @ts-expect-error - Reserved for future profile update feature
function handleUpdateProfile() {
  // TODO: 实现更新逻辑
}

function handleEditAvatar() {
  uploadAvatarVisible.value = true;
}

function handlePurchaseVIP() {
  router.push('/vip');
}

function goToVipOrders() {
  router.push('/vip/orders');
}

function goToDevices() {
  router.push('/user/devices');
}

function goToPoints() {
  router.push('/points');
}

function goToPointsDetail() {
  router.push('/points');
}

function goToPointsRecharge() {
  router.push('/points');
  // 跳转后会显示充值按钮，用户可以点击充值
}

function getAuditStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: '待审核',
    1: '已通过',
    2: '已驳回'
  };
  return statusMap[status] || '未知';
}

function getAuditStatusClass(status: number): string {
  const classMap: Record<number, string> = {
    0: 'status-pending',
    1: 'status-approved',
    2: 'status-rejected'
  };
  return classMap[status] || '';
}

onMounted(() => {
  // 进入页面时刷新积分余额，确保与数据库一致
  refreshPoints(true);
  fetchDownloadHistory();
});

// 页面被激活时（从缓存恢复）也刷新积分
onActivated(() => {
  refreshPoints(true);
});
</script>

<style scoped lang="scss">
.personal-center {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.user-info-card {
  display: flex;
  gap: 24px;
  padding: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  position: relative;

  .edit-avatar-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    background: white;
    color: #667eea;
  }
}

.user-details {
  flex: 1;

  .user-name {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
  }

  .user-meta {
    display: flex;
    gap: 16px;
    margin-bottom: 8px;
    opacity: 0.9;

    .phone,
    .email {
      font-size: 14px;
    }
  }

  .vip-expire {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 16px;
  }

  .points-section {
    margin-bottom: 16px;
  }

  .points-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    margin-bottom: 12px;
    backdrop-filter: blur(4px);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .el-icon {
      font-size: 24px;
      color: #fbbf24;
    }

    .points-value {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
    }

    .points-label {
      font-size: 14px;
      opacity: 0.9;
      flex: 1;
    }
  }

  .points-actions {
    display: flex;
    gap: 12px;

    .points-action-btn {
      flex: 1;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      font-weight: 500;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
      }

      &.el-button--warning {
        background: rgba(251, 191, 36, 0.3);
        border-color: rgba(251, 191, 36, 0.5);

        &:hover {
          background: rgba(251, 191, 36, 0.5);
        }
      }

      .el-icon {
        margin-right: 4px;
      }
    }
  }
}

.personal-tabs {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tab-content {
  min-height: 400px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.resource-item {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .resource-cover {
    position: relative;
    width: 100%;
    height: 180px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .resource-format {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      font-size: 12px;
      border-radius: 4px;
    }

    .audit-status {
      position: absolute;
      bottom: 8px;
      left: 8px;
      padding: 4px 12px;
      font-size: 12px;
      border-radius: 4px;
      font-weight: 500;

      &.status-pending {
        background: #e6a23c;
        color: white;
      }

      &.status-approved {
        background: #67c23a;
        color: white;
      }

      &.status-rejected {
        background: #f56c6c;
        color: white;
      }
    }
  }

  .resource-info {
    padding: 12px;

    .resource-title {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .download-time,
    .upload-time {
      margin: 0;
      font-size: 12px;
      color: #999;
    }

    .audit-msg {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: #f56c6c;
    }
  }
}

.vip-center {
  .vip-privileges-detail {
    margin-top: 24px;
    padding: 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0 0 16px 0;
    }

    .privileges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .privilege-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        background: #e8f4ff;
        transform: translateY(-2px);
      }

      .privilege-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 10px;
        color: #fff;
        font-size: 20px;
      }

      .privilege-info {
        h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        p {
          margin: 0;
          font-size: 12px;
          color: #999;
        }
      }
    }
  }

  .vip-quick-links {
    margin-top: 24px;
    display: flex;
    gap: 12px;
    justify-content: center;
  }
}

/* VIP推广横幅 */
.vip-promotion-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border: 1px solid #ffd54f;
  border-radius: 12px;

  .banner-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .banner-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .banner-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }

  .banner-desc {
    font-size: 13px;
    color: #666;
  }
}

@media (max-width: 768px) {
  .personal-center {
    padding: 16px;
  }

  .user-info-card {
    flex-direction: column;
    padding: 24px;
    text-align: center;

    .user-avatar {
      margin: 0 auto;
    }
  }

  .resource-grid {
    grid-template-columns: 1fr;
  }
}
</style>
