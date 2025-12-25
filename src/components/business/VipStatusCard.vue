<script setup lang="ts">
/**
 * VIP状态卡片组件
 * 显示用户VIP状态、到期时间、特权列表等
 */

import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Check } from '@element-plus/icons-vue';
import VipIcon from './VipIcon.vue';
import type { VipPrivilege } from '@/api/vip';

/** 特权项类型：可以是VipPrivilege对象或简单字符串 */
type PrivilegeItem = VipPrivilege | string;

interface Props {
  /** 是否是VIP */
  isVip?: boolean;
  /** 是否是终身VIP */
  isLifetimeVip?: boolean;
  /** VIP到期时间 */
  expireAt?: string | null;
  /** 剩余天数 */
  daysRemaining?: number;
  /** 特权列表 - 支持VipPrivilege[]或string[] */
  privileges?: PrivilegeItem[];
  /** 是否显示特权列表 */
  showPrivileges?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isVip: false,
  isLifetimeVip: false,
  expireAt: null,
  daysRemaining: 0,
  privileges: () => [],
  showPrivileges: true,
  compact: false
});

const router = useRouter();

/** VIP状态 */
const vipStatus = computed(() => {
  if (props.isLifetimeVip) return 'lifetime';
  if (props.isVip) return 'active';
  if (props.daysRemaining >= -7 && props.daysRemaining < 0) return 'grace';
  return 'none';
});

/** 状态文本 */
const statusText = computed(() => {
  switch (vipStatus.value) {
    case 'lifetime':
      return '终身VIP会员';
    case 'active':
      return 'VIP会员';
    case 'grace':
      return 'VIP已过期（宽限期）';
    default:
      return '普通用户';
  }
});

/** 到期时间文本 */
const expireText = computed(() => {
  if (props.isLifetimeVip) return '永久有效';
  if (!props.expireAt) return '';
  
  const expireDate = new Date(props.expireAt);
  const formattedDate = expireDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  if (props.daysRemaining > 0) {
    return `${formattedDate}到期，剩余${props.daysRemaining}天`;
  } else if (props.daysRemaining === 0) {
    return '今日到期';
  } else {
    return `已于${formattedDate}过期`;
  }
});

/** 按钮文本 */
const buttonText = computed(() => {
  if (props.isLifetimeVip) return '';
  if (props.isVip) return '续费VIP';
  return '开通VIP';
});

/** 格式化后的特权列表 */
const formattedPrivileges = computed(() => {
  return props.privileges.map((item, index) => {
    if (typeof item === 'string') {
      return { privilegeId: `str-${index}`, privilegeName: item };
    }
    return item;
  });
});

/** 跳转VIP中心 */
function goToVipCenter() {
  router.push('/vip');
}
</script>

<template>
  <div
    class="vip-status-card"
    :class="{ compact, 'is-vip': isVip || isLifetimeVip }"
  >
    <!-- 头部 -->
    <div class="card-header">
      <div class="status-info">
        <VipIcon
          :status="vipStatus"
          size="large"
        />
        <div class="status-text">
          <span class="status-title">{{ statusText }}</span>
          <span
            v-if="expireText"
            class="expire-text"
          >{{ expireText }}</span>
        </div>
      </div>
      
      <el-button
        v-if="buttonText"
        type="primary"
        :size="compact ? 'small' : 'default'"
        @click="goToVipCenter"
      >
        {{ buttonText }}
      </el-button>
    </div>
    
    <!-- 特权列表 -->
    <div
      v-if="showPrivileges && formattedPrivileges.length > 0 && !compact"
      class="privileges-section"
    >
      <div class="section-title">
        VIP特权
      </div>
      <div class="privileges-list">
        <div
          v-for="privilege in formattedPrivileges"
          :key="privilege.privilegeId"
          class="privilege-item"
        >
          <el-icon class="privilege-icon">
            <Check />
          </el-icon>
          <span>{{ privilege.privilegeName }}</span>
        </div>
      </div>
    </div>
    
    <!-- 非VIP提示 -->
    <div
      v-if="!isVip && !isLifetimeVip && !compact"
      class="non-vip-tips"
    >
      <p>开通VIP会员，享受以下特权：</p>
      <ul>
        <li>无限下载资源</li>
        <li>专属VIP标识</li>
        <li>优先客服支持</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.vip-status-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.vip-status-card.is-vip {
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  border: 1px solid #FFD54F;
}

.vip-status-card.compact {
  padding: 12px 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.compact .status-title {
  font-size: 14px;
}

.expire-text {
  font-size: 13px;
  color: #666;
}

.compact .expire-text {
  font-size: 12px;
}

.privileges-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.privileges-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.privilege-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.privilege-icon {
  color: #52C41A;
  font-size: 14px;
}

.non-vip-tips {
  margin-top: 16px;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 8px;
}

.non-vip-tips p {
  font-size: 13px;
  color: #666;
  margin: 0 0 8px 0;
}

.non-vip-tips ul {
  margin: 0;
  padding-left: 20px;
}

.non-vip-tips li {
  font-size: 12px;
  color: #999;
  line-height: 1.8;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .privileges-list {
    grid-template-columns: 1fr;
  }
}
</style>
