/**
 * VIP状态管理 Store
 * 管理VIP信息、订单状态、支付状态等
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { VipPackage, VipPrivilege, UserVipInfo, VipOrder } from '@/api/vip';
import * as vipApi from '@/api/vip';

/**
 * VIP状态枚举
 */
export enum VipStatus {
  /** 非VIP */
  NONE = 'none',
  /** 有效VIP */
  ACTIVE = 'active',
  /** 7天宽限期 */
  GRACE_PERIOD = 'grace_period',
  /** 终身VIP */
  LIFETIME = 'lifetime'
}

/**
 * 支付状态枚举
 */
export enum PaymentStatus {
  /** 待支付 */
  PENDING = 0,
  /** 已支付 */
  PAID = 1,
  /** 已取消 */
  CANCELLED = 2,
  /** 已退款 */
  REFUNDED = 3,
  /** 支付失败 */
  FAILED = 4
}

/**
 * 订单状态信息
 */
export interface OrderStatusInfo {
  orderNo: string;
  status: PaymentStatus;
  qrCodeUrl?: string;
  payUrl?: string;
  expireTime?: number;
}

export const useVipStore = defineStore('vip', () => {
  // ========== 状态 (State) ==========

  /** VIP套餐列表 */
  const packages = ref<VipPackage[]>([]);

  /** VIP特权列表 */
  const privileges = ref<VipPrivilege[]>([]);

  /** 用户VIP信息 */
  const userVipInfo = ref<UserVipInfo | null>(null);

  /** 当前订单信息 */
  const currentOrder = ref<OrderStatusInfo | null>(null);

  /** 用户订单列表 */
  const orders = ref<VipOrder[]>([]);

  /** 订单总数 */
  const orderTotal = ref(0);

  /** 加载状态 */
  const loading = ref(false);

  /** 支付轮询定时器 */
  let paymentPollingTimer: ReturnType<typeof setInterval> | null = null;

  /** 积分兑换信息 */
  const pointsExchangeInfo = ref<{
    canExchange: boolean;
    hasExchangedThisMonth: boolean;
    pointsRequired: number;
    userPoints: number;
    maxMonths: number;
  } | null>(null);

  // ========== 计算属性 (Getters) ==========

  /** VIP状态 */
  const vipStatus = computed<VipStatus>(() => {
    if (!userVipInfo.value) return VipStatus.NONE;
    
    // 终身VIP
    if (userVipInfo.value.isLifetimeVip) return VipStatus.LIFETIME;
    
    // 检查是否是VIP
    if (!userVipInfo.value.isVip) {
      // 检查是否在7天宽限期内
      if (userVipInfo.value.daysRemaining >= -7 && userVipInfo.value.daysRemaining < 0) {
        return VipStatus.GRACE_PERIOD;
      }
      return VipStatus.NONE;
    }
    
    return VipStatus.ACTIVE;
  });

  /** 是否是有效VIP（包括宽限期） */
  const isValidVip = computed(() => {
    return vipStatus.value === VipStatus.ACTIVE || 
           vipStatus.value === VipStatus.LIFETIME ||
           vipStatus.value === VipStatus.GRACE_PERIOD;
  });

  /** 是否是终身VIP */
  const isLifetimeVip = computed(() => {
    return vipStatus.value === VipStatus.LIFETIME;
  });

  /** VIP剩余天数 */
  const daysRemaining = computed(() => {
    return userVipInfo.value?.daysRemaining ?? 0;
  });

  /** VIP到期时间 */
  const expireTime = computed(() => {
    return userVipInfo.value?.vipExpireAt ?? null;
  });

  /** 可用套餐（终身VIP隐藏终身套餐） */
  const availablePackages = computed(() => {
    if (isLifetimeVip.value) {
      return []; // 终身VIP不显示任何套餐
    }
    return packages.value.filter(pkg => pkg.status === 1);
  });

  /** 是否可以购买（非终身VIP） */
  const canPurchase = computed(() => {
    return !isLifetimeVip.value;
  });

  /** 是否正在支付 */
  const isPaying = computed(() => {
    return currentOrder.value !== null && currentOrder.value.status === PaymentStatus.PENDING;
  });

  // ========== 操作 (Actions) ==========

  /**
   * 获取VIP套餐列表
   */
  async function fetchPackages(): Promise<void> {
    try {
      const res = await vipApi.getVipPackages();
      if (res.code === 200 && res.data) {
        packages.value = res.data;
      }
    } catch (error) {
      console.error('获取VIP套餐失败:', error);
    }
  }

  /**
   * 获取VIP特权列表
   */
  async function fetchPrivileges(): Promise<void> {
    try {
      const res = await vipApi.getVipPrivileges();
      if (res.code === 200 && res.data) {
        privileges.value = res.data;
      }
    } catch (error) {
      console.error('获取VIP特权失败:', error);
    }
  }

  /**
   * 获取用户VIP信息
   */
  async function fetchUserVipInfo(): Promise<void> {
    try {
      const res = await vipApi.getUserVipInfo();
      if (res.code === 200 && res.data) {
        userVipInfo.value = res.data;
      }
    } catch (error) {
      console.error('获取用户VIP信息失败:', error);
    }
  }

  /**
   * 创建VIP订单
   */
  async function createOrder(packageId: string, paymentMethod: string, sourceUrl?: string): Promise<string | null> {
    loading.value = true;
    try {
      const res = await vipApi.createVipOrder({
        packageId,
        paymentMethod,
        sourceUrl
      });
      if (res.code === 200 && res.data) {
        return res.data.orderNo;
      }
      return null;
    } catch (error) {
      console.error('创建订单失败:', error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 发起支付
   */
  async function initiatePayment(orderNo: string): Promise<OrderStatusInfo | null> {
    loading.value = true;
    try {
      const res = await vipApi.initiatePayment(orderNo);
      if (res.code === 200 && res.data) {
        currentOrder.value = {
          orderNo,
          status: PaymentStatus.PENDING,
          qrCodeUrl: res.data.qrCodeUrl,
          payUrl: res.data.payUrl,
          expireTime: res.data.expireTime
        };
        return currentOrder.value;
      }
      return null;
    } catch (error) {
      console.error('发起支付失败:', error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 查询支付状态
   */
  async function checkPaymentStatus(orderNo: string): Promise<PaymentStatus> {
    try {
      const res = await vipApi.getPaymentStatus(orderNo);
      if (res.code === 200 && res.data) {
        const status = res.data.paymentStatus as PaymentStatus;
        if (currentOrder.value && currentOrder.value.orderNo === orderNo) {
          currentOrder.value.status = status;
        }
        return status;
      }
      return PaymentStatus.PENDING;
    } catch (error) {
      console.error('查询支付状态失败:', error);
      return PaymentStatus.PENDING;
    }
  }

  /**
   * 开始支付状态轮询
   */
  function startPaymentPolling(orderNo: string, onSuccess: () => void, onFail: () => void): void {
    stopPaymentPolling();
    
    paymentPollingTimer = setInterval(async () => {
      const status = await checkPaymentStatus(orderNo);
      
      if (status === PaymentStatus.PAID) {
        stopPaymentPolling();
        await fetchUserVipInfo(); // 刷新VIP信息
        onSuccess();
      } else if (status === PaymentStatus.CANCELLED || status === PaymentStatus.FAILED) {
        stopPaymentPolling();
        onFail();
      }
    }, 3000); // 每3秒轮询一次
  }

  /**
   * 停止支付状态轮询
   */
  function stopPaymentPolling(): void {
    if (paymentPollingTimer) {
      clearInterval(paymentPollingTimer);
      paymentPollingTimer = null;
    }
  }

  /**
   * 取消订单
   */
  async function cancelOrder(orderNo: string): Promise<boolean> {
    try {
      const res = await vipApi.cancelOrder(orderNo);
      if (res.code === 200) {
        if (currentOrder.value && currentOrder.value.orderNo === orderNo) {
          currentOrder.value.status = PaymentStatus.CANCELLED;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('取消订单失败:', error);
      return false;
    }
  }

  /**
   * 获取用户订单列表
   */
  async function fetchOrders(params: { page: number; pageSize: number; status?: number }): Promise<void> {
    loading.value = true;
    try {
      const res = await vipApi.getUserOrders(params);
      if (res.code === 200 && res.data) {
        orders.value = res.data.list;
        orderTotal.value = res.data.total;
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 申请退款
   */
  async function requestRefund(orderNo: string, reason: string, reasonType: string): Promise<boolean> {
    try {
      const res = await vipApi.requestRefund(orderNo, { reason, reasonType });
      return res.code === 200;
    } catch (error) {
      console.error('申请退款失败:', error);
      return false;
    }
  }

  /**
   * 获取积分兑换信息
   */
  async function fetchPointsExchangeInfo(): Promise<void> {
    try {
      const res = await vipApi.getPointsExchangeInfo();
      if (res.code === 200 && res.data) {
        pointsExchangeInfo.value = res.data;
      }
    } catch (error) {
      console.error('获取积分兑换信息失败:', error);
    }
  }

  /**
   * 积分兑换VIP
   */
  async function exchangePointsForVip(months: number): Promise<boolean> {
    try {
      const res = await vipApi.exchangePointsForVip({ months });
      if (res.code === 200) {
        await fetchUserVipInfo(); // 刷新VIP信息
        await fetchPointsExchangeInfo(); // 刷新兑换信息
        return true;
      }
      return false;
    } catch (error) {
      console.error('积分兑换失败:', error);
      return false;
    }
  }

  /**
   * 清除当前订单
   */
  function clearCurrentOrder(): void {
    stopPaymentPolling();
    currentOrder.value = null;
  }

  /**
   * 初始化VIP数据
   */
  async function initVipData(): Promise<void> {
    await Promise.all([
      fetchPackages(),
      fetchPrivileges(),
      fetchUserVipInfo()
    ]);
  }

  /**
   * 重置状态
   */
  function reset(): void {
    stopPaymentPolling();
    packages.value = [];
    privileges.value = [];
    userVipInfo.value = null;
    currentOrder.value = null;
    orders.value = [];
    orderTotal.value = 0;
    pointsExchangeInfo.value = null;
  }

  // ========== 返回公共接口 ==========
  return {
    // 状态
    packages,
    privileges,
    userVipInfo,
    currentOrder,
    orders,
    orderTotal,
    loading,
    pointsExchangeInfo,

    // 计算属性
    vipStatus,
    isValidVip,
    isLifetimeVip,
    daysRemaining,
    expireTime,
    availablePackages,
    canPurchase,
    isPaying,

    // 操作
    fetchPackages,
    fetchPrivileges,
    fetchUserVipInfo,
    createOrder,
    initiatePayment,
    checkPaymentStatus,
    startPaymentPolling,
    stopPaymentPolling,
    cancelOrder,
    fetchOrders,
    requestRefund,
    fetchPointsExchangeInfo,
    exchangePointsForVip,
    clearCurrentOrder,
    initVipData,
    reset
  };
});
