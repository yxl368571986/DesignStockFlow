<template>
  <div class="personal-center">
    <!-- 用户信息卡片 -->
    <div class="user-info-card">
      <div class="user-avatar">
        <VipBadge :status="vipStatus" position="bottom-right" size="medium">
          <el-avatar
            :size="80"
            :src="userInfo?.avatar"
          />
        </VipBadge>
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
            <VipIcon status="active" size="small" :show-lifetime-label="false" />
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
              <VipIcon status="active" size="large" />
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
                  :src="getFullImageUrl(record.resourceCover, record.resourceId)"
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
          <!-- 审核状态筛选 -->
          <div class="filter-bar">
            <el-radio-group
              v-model="uploadStatusFilter"
              size="small"
              @change="handleUploadFilterChange"
            >
              <el-radio-button value="all">
                全部
              </el-radio-button>
              <el-radio-button value="pending">
                审核中
              </el-radio-button>
              <el-radio-button value="approved">
                已通过
              </el-radio-button>
              <el-radio-button value="rejected">
                已驳回
              </el-radio-button>
            </el-radio-group>
          </div>

          <div
            v-if="filteredUploadList.length > 0"
            class="resource-grid"
          >
            <div
              v-for="record in filteredUploadList"
              :key="record.recordId"
              class="resource-item"
              :class="{ 'item-disabled': record.isAudit !== 1 }"
              @click="handleUploadItemClick(record)"
            >
              <div class="resource-cover">
                <img
                  :src="getFullImageUrl(record.resourceCover, record.resourceId) || getFormatIcon(record.resourceFormat)"
                  :alt="record.resourceTitle"
                >
                <div class="resource-format">
                  {{ record.resourceFormat }}
                </div>
                <!-- 审核状态标签：只显示审核中和已驳回 -->
                <div
                  v-if="record.isAudit !== 1"
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
                <!-- 驳回原因显示 -->
                <p
                  v-if="record.isAudit === 2 && record.auditMsg"
                  class="audit-msg clickable"
                  @click.stop="showRejectReason(record)"
                >
                  <el-icon><Warning /></el-icon>
                  点击查看驳回原因
                </p>
              </div>
              <!-- 操作按钮 -->
              <div class="resource-actions">
                <el-button
                  v-if="record.isAudit === 1"
                  size="small"
                  type="primary"
                  :icon="Download"
                  @click.stop="handleDownloadResource(record)"
                >
                  下载
                </el-button>
                <el-button
                  v-if="record.isAudit === 1"
                  size="small"
                  :icon="Share"
                  @click.stop="handleShareResource(record)"
                >
                  分享
                </el-button>
                <el-tooltip
                  v-if="record.isAudit === 0"
                  content="审核中，暂不可操作"
                  placement="top"
                >
                  <el-button
                    size="small"
                    disabled
                  >
                    等待审核
                  </el-button>
                </el-tooltip>
                <el-tooltip
                  v-if="record.isAudit === 2"
                  content="已驳回，点击查看原因"
                  placement="top"
                >
                  <el-button
                    size="small"
                    type="danger"
                    @click.stop="showRejectReason(record)"
                  >
                    查看原因
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </div>

          <el-empty
            v-else
            :description="uploadStatusFilter === 'all' ? '暂无上传记录' : '暂无该状态的资源'"
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

    <!-- 积分明细弹窗 -->
    <el-dialog
      v-model="pointsDetailVisible"
      title="积分明细"
      width="800px"
      :close-on-click-modal="false"
      @close="closePointsDetail"
    >
      <div
        v-loading="pointsRecordsLoading"
        class="points-detail-content"
      >
        <!-- 筛选栏 -->
        <div class="filter-bar">
          <el-radio-group
            v-model="pointsRecordsFilter"
            size="small"
            @change="handleFilterChange"
          >
            <el-radio-button value="">
              全部
            </el-radio-button>
            <el-radio-button value="recharge">
              充值
            </el-radio-button>
            <el-radio-button value="consume">
              消费
            </el-radio-button>
            <el-radio-button value="exchange">
              兑换
            </el-radio-button>
            <el-radio-button value="signin">
              签到
            </el-radio-button>
            <el-radio-button value="task">
              任务
            </el-radio-button>
          </el-radio-group>
        </div>

        <el-table
          :data="pointsRecordsList"
          stripe
          style="width: 100%"
        >
          <el-table-column
            prop="description"
            label="说明"
            min-width="200"
          />
          <el-table-column
            prop="changeType"
            label="类型"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-tag
                :type="row.pointsChange > 0 ? 'success' : 'warning'"
                size="small"
              >
                {{ getChangeTypeText(row.changeType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="pointsChange"
            label="积分变化"
            width="120"
            align="center"
          >
            <template #default="{ row }">
              <span :class="getChangeTypeClass(row.pointsChange)">
                {{ row.pointsChange > 0 ? '+' : '' }}{{ row.pointsChange }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            prop="pointsBalance"
            label="余额"
            width="100"
            align="center"
          />
          <el-table-column
            prop="createdAt"
            label="时间"
            width="180"
            align="center"
          >
            <template #default="{ row }">
              {{ formatTime(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-if="!pointsRecordsLoading && pointsRecordsList.length === 0"
          description="暂无积分记录"
        />

        <div
          v-if="pointsRecordsTotal > pointsRecordsPageSize"
          class="pagination-wrapper"
        >
          <el-pagination
            v-model:current-page="pointsRecordsPage"
            :page-size="pointsRecordsPageSize"
            :total="pointsRecordsTotal"
            layout="total, prev, pager, next"
            @current-change="handlePointsPageChange"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Camera, Star, Coin, List, Plus, Download, Service, Discount, Warning, Share } from '@element-plus/icons-vue';
import { useUserStore } from '@/pinia/userStore';
import { getDownloadHistory, getUploadHistory, getVIPInfo, getUserInfo } from '@/api/personal';
import { getPointsRecords, type PointsRecord } from '@/api/points';
import { usePointsSync } from '@/composables/usePointsSync';
import { formatTime, formatRelativeTime } from '@/utils/format';
import { maskPhone } from '@/utils/security';
import { getFullImageUrl } from '@/utils/url';
import VipStatusCard from '@/components/business/VipStatusCard.vue';
import VipIcon from '@/components/business/VipIcon.vue';
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
const uploadStatusFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>('all');

/** 根据筛选条件过滤上传列表 */
const filteredUploadList = computed(() => {
  if (uploadStatusFilter.value === 'all') {
    return uploadList.value;
  }
  const statusMap: Record<string, number> = {
    pending: 0,
    approved: 1,
    rejected: 2
  };
  const targetStatus = statusMap[uploadStatusFilter.value];
  return uploadList.value.filter(item => item.isAudit === targetStatus);
});

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

// VIP状态计算（用于VipBadge组件）
const vipStatus = computed(() => {
  if (vipInfo.value.vipLevel <= 0) return 'none';
  if (vipInfo.value.isLifetime) return 'lifetime';
  if (vipInfo.value.vipLevel >= 3) return 'lifetime';
  return 'active';
});

const editProfileVisible = ref(false);
const uploadAvatarVisible = ref(false);

// 积分明细弹窗相关
const pointsDetailVisible = ref(false);
const pointsRecordsLoading = ref(false);
const pointsRecordsList = ref<PointsRecord[]>([]);
const pointsRecordsTotal = ref(0);
const pointsRecordsPage = ref(1);
const pointsRecordsPageSize = ref(20);
const pointsRecordsFilter = ref<string>(''); // 筛选类型

/** 错误类型定义 */
interface ApiError {
  response?: {
    status?: number;
    data?: { code?: number };
  };
  message?: string;
}

/**
 * 判断是否为认证错误（401/403）
 * 认证错误由请求拦截器统一处理，页面不需要显示额外提示
 */
function isAuthError(error: ApiError): boolean {
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

    // 后端API使用 code: 0 表示成功
    if (res.code === 200 || res.code === 0) {
      downloadList.value = res.data.list;
      downloadTotal.value = res.data.total;
    }
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error('获取下载记录失败:', err);
    
    // 区分认证错误和其他错误
    if (!isAuthError(err)) {
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

    // 后端API使用 code: 0 表示成功
    if (res.code === 200 || res.code === 0) {
      uploadList.value = res.data.list;
      uploadTotal.value = res.data.total;
    }
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error('获取上传记录失败:', err);
    
    // 区分认证错误和其他错误
    if (!isAuthError(err)) {
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

    // 后端API使用 code: 0 表示成功
    if (res.code === 200 || res.code === 0) {
      vipInfo.value = res.data;
    }
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error('获取VIP信息失败:', err);
    
    // 区分认证错误和其他错误
    if (!isAuthError(err)) {
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
  // 打开积分明细弹窗
  pointsDetailVisible.value = true;
  fetchPointsRecords();
}

function goToPointsRecharge() {
  router.push('/points');
  // 跳转后会显示充值按钮，用户可以点击充值
}

function getAuditStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: '审核中',
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

/** 获取文件格式图标 */
function getFormatIcon(format: string): string {
  const formatIcons: Record<string, string> = {
    PSD: '/icons/psd.svg',
    AI: '/icons/ai.svg',
    CDR: '/icons/cdr.svg',
    JPG: '/icons/jpg.svg',
    PNG: '/icons/png.svg',
    ZIP: '/icons/zip.svg',
    RAR: '/icons/rar.svg'
  };
  return formatIcons[format?.toUpperCase()] || '/icons/file.svg';
}

/** 处理上传状态筛选变化 */
function handleUploadFilterChange() {
  // 筛选是前端过滤，不需要重新请求
}

/** 处理上传项点击 */
function handleUploadItemClick(record: UploadRecord) {
  if (record.isAudit === 1) {
    // 已通过的资源可以查看详情
    handleViewResource(record.resourceId);
  } else if (record.isAudit === 2) {
    // 已驳回的资源显示驳回原因
    showRejectReason(record);
  }
  // 审核中的资源不做任何操作
}

/** 显示驳回原因 */
function showRejectReason(record: UploadRecord) {
  const reason = record.auditMsg || '未提供具体原因';
  ElMessageBox.confirm(
    `<div class="reject-reason-content">
      <p><strong>资源名称：</strong>${record.resourceTitle}</p>
      <p class="reject-reason"><el-icon class="warning-icon"><Warning /></el-icon><strong>驳回原因：</strong>${reason}</p>
      <p class="tip">如有疑问，请联系客服处理。</p>
    </div>`,
    '审核驳回原因',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '重新提交',
      cancelButtonText: '我知道了',
      type: 'warning',
      distinguishCancelAndClose: true
    }
  ).then(() => {
    // 点击"重新提交"，跳转到上传页面
    router.push('/upload');
  }).catch(() => {
    // 点击"我知道了"或关闭弹窗，停留在当前页面
  });
}

/** 下载资源 */
function handleDownloadResource(record: UploadRecord) {
  if (record.isAudit !== 1) {
    ElMessage.warning('该资源尚未通过审核，暂不可下载');
    return;
  }
  // 跳转到资源详情页进行下载
  router.push(`/resource/${record.resourceId}`);
}

/** 分享资源 */
function handleShareResource(record: UploadRecord) {
  if (record.isAudit !== 1) {
    ElMessage.warning('该资源尚未通过审核，暂不可分享');
    return;
  }
  // 复制分享链接
  const shareUrl = `${window.location.origin}/resource/${record.resourceId}`;
  navigator.clipboard.writeText(shareUrl).then(() => {
    ElMessage.success('分享链接已复制到剪贴板');
  }).catch(() => {
    ElMessage.info(`分享链接：${shareUrl}`);
  });
}

/**
 * 获取积分明细记录
 */
async function fetchPointsRecords() {
  pointsRecordsLoading.value = true;
  try {
    const params: any = {
      pageNum: pointsRecordsPage.value,
      pageSize: pointsRecordsPageSize.value
    };
    
    // 如果有筛选条件，添加到参数中
    if (pointsRecordsFilter.value) {
      params.changeType = pointsRecordsFilter.value;
    }
    
    const res = await getPointsRecords(params);

    if (res.code === 200 || res.code === 0) {
      pointsRecordsList.value = res.data.list;
      pointsRecordsTotal.value = res.data.total;
    }
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error('获取积分明细失败:', err);
    
    if (!isAuthError(err)) {
      ElMessage.warning('暂时无法加载积分明细，请稍后再试');
    }
    
    pointsRecordsList.value = [];
    pointsRecordsTotal.value = 0;
  } finally {
    pointsRecordsLoading.value = false;
  }
}

/**
 * 积分类型筛选变化
 */
function handleFilterChange() {
  pointsRecordsPage.value = 1;
  fetchPointsRecords();
}

/**
 * 积分明细分页变化
 */
function handlePointsPageChange(page: number) {
  pointsRecordsPage.value = page;
  fetchPointsRecords();
}

/**
 * 获取积分变化类型文本
 */
function getChangeTypeText(changeType: string): string {
  const typeMap: Record<string, string> = {
    'earn': '获得',
    'consume': '消费',
    'exchange': '兑换',
    'recharge': '充值',
    'refund': '退款',
    'adjust': '调整',
    'signin': '签到',
    'task': '任务',
    'download': '下载',
    'upload': '上传'
  };
  return typeMap[changeType] || changeType;
}

/**
 * 获取积分变化类型样式
 */
function getChangeTypeClass(pointsChange: number): string {
  return pointsChange > 0 ? 'points-increase' : 'points-decrease';
}

/**
 * 关闭积分明细弹窗
 */
function closePointsDetail() {
  pointsDetailVisible.value = false;
  pointsRecordsPage.value = 1;
  pointsRecordsFilter.value = '';
}

/**
 * 刷新用户信息（从服务器获取最新数据）
 * 确保VIP状态等信息是最新的
 */
async function refreshUserInfo() {
  try {
    const res = await getUserInfo();
    if (res.code === 200 || res.code === 0) {
      // 更新用户Store中的信息
      userStore.setUserInfo(res.data);
    }
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error('刷新用户信息失败:', err);
    // 不显示错误消息，静默失败
  }
}

onMounted(() => {
  // 进入页面时刷新用户信息，确保VIP状态等是最新的
  refreshUserInfo();
  // 进入页面时刷新积分余额，确保与数据库一致
  refreshPoints(true);
  // 获取VIP信息，确保VIP标签正确显示
  fetchVIPInfo();
  fetchDownloadHistory();
});

// 页面被激活时（从缓存恢复）也刷新用户信息和积分
onActivated(() => {
  refreshUserInfo();
  refreshPoints(true);
  fetchVIPInfo();
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

    .vip-badge {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center;
      gap: 4px;
      padding: 4px 12px !important;
      font-size: 13px;
      font-weight: 600;
      line-height: 1 !important;
      height: auto !important;
      
      :deep(.el-tag__content) {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        line-height: 1;
      }
      
      :deep(.vip-icon-wrapper) {
        display: inline-flex;
        align-items: center;
        line-height: 1;
      }
      
      :deep(.vip-icon) {
        display: block;
        vertical-align: middle;
      }
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

.filter-bar {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
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

  &.item-disabled {
    opacity: 0.8;
    cursor: default;

    &:hover {
      transform: none;
      box-shadow: none;
    }
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

      &.clickable {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .resource-actions {
    padding: 0 12px 12px;
    display: flex;
    gap: 8px;
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

/* 积分明细弹窗样式 */
.points-detail-content {
  /* 固定高度，防止切换Tab时晃动 */
  height: 500px;
  display: flex;
  flex-direction: column;

  .filter-bar {
    flex-shrink: 0; /* 防止筛选栏被压缩 */
    margin-bottom: 16px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 8px;
  }

  /* 表格容器自适应剩余空间 */
  :deep(.el-table) {
    flex: 1;
    overflow: auto;
  }

  /* 空状态居中显示 */
  :deep(.el-empty) {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .points-increase {
    color: #67c23a;
    font-weight: 600;
  }

  .points-decrease {
    color: #f56c6c;
    font-weight: 600;
  }

  .pagination-wrapper {
    flex-shrink: 0; /* 防止分页器被压缩 */
    display: flex;
    justify-content: center;
    margin-top: 20px;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
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

  /* 移动端积分明细弹窗调整 */
  .points-detail-content {
    height: 450px; /* 移动端稍微降低高度 */

    .filter-bar {
      padding: 8px;

      :deep(.el-radio-group) {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      :deep(.el-radio-button) {
        flex: 0 0 calc(33.333% - 6px);
      }
    }
  }
}
</style>
