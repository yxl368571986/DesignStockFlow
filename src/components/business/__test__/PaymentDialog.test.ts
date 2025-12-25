/**
 * PaymentDialog组件单元测试
 * 测试支付弹窗的不同状态和交互
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PaymentDialog from '../PaymentDialog.vue';

// Mock QRCode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode')
  }
}));

// Mock Element Plus
vi.mock('element-plus', async () => {
  return {
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    },
    ElDialog: {
      name: 'ElDialog',
      template: `
        <div v-if="modelValue" class="el-dialog">
          <div class="el-dialog__header">{{ title }}</div>
          <div class="el-dialog__body"><slot /></div>
          <div class="el-dialog__footer"><slot name="footer" /></div>
        </div>
      `,
      props: ['modelValue', 'title', 'width', 'closeOnClickModal'],
      emits: ['update:modelValue']
    },
    ElButton: {
      name: 'ElButton',
      template: '<button :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
      props: ['type', 'size', 'loading']
    },
    ElIcon: {
      name: 'ElIcon',
      template: '<span class="el-icon"><slot /></span>'
    }
  };
});

// Mock vipStore
const mockStartPaymentPolling = vi.fn();
const mockStopPaymentPolling = vi.fn();
const mockCheckPaymentStatus = vi.fn();

vi.mock('@/pinia/vipStore', () => ({
  useVipStore: () => ({
    startPaymentPolling: mockStartPaymentPolling,
    stopPaymentPolling: mockStopPaymentPolling,
    checkPaymentStatus: mockCheckPaymentStatus
  }),
  PaymentStatus: {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  }
}));

// Mock icons
vi.mock('@element-plus/icons-vue', () => ({
  CircleCheck: { template: '<span class="icon-check">✓</span>' },
  CircleClose: { template: '<span class="icon-close">✗</span>' }
}));

describe('PaymentDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    visible: true,
    orderNo: 'VIP1703123456781234',
    paymentMethod: 'wechat',
    amount: 79.00,
    qrCodeUrl: 'weixin://wxpay/bizpayurl?pr=xxx',
    expireTime: Date.now() + 15 * 60 * 1000 // 15分钟后过期
  };

  describe('基础渲染', () => {
    it('visible为true时应该显示弹窗', async () => {
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      expect(wrapper.find('.el-dialog').exists()).toBe(true);
    });

    it('visible为false时不应该显示弹窗', () => {
      const wrapper = mount(PaymentDialog, {
        props: { ...defaultProps, visible: false }
      });

      expect(wrapper.find('.el-dialog').exists()).toBe(false);
    });

    it('应该正确显示订单号', async () => {
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      expect(wrapper.text()).toContain('VIP1703123456781234');
    });

    it('应该正确显示支付金额', async () => {
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      expect(wrapper.text()).toContain('79.00');
    });
  });

  describe('微信支付', () => {
    it('微信支付应该显示二维码', async () => {
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      
      const qrcodeSection = wrapper.find('.qrcode-section');
      expect(qrcodeSection.exists()).toBe(true);
      
      const qrcodeImage = wrapper.find('.qrcode-image');
      expect(qrcodeImage.exists()).toBe(true);
    });

    it('应该显示微信扫码提示', async () => {
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      expect(wrapper.find('.qrcode-tip').text()).toContain('微信扫码');
    });

    it('微信支付不应该显示支付宝跳转按钮', async () => {
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      expect(wrapper.find('.alipay-section').exists()).toBe(false);
    });
  });

  describe('支付宝支付', () => {
    const alipayProps = {
      ...defaultProps,
      paymentMethod: 'alipay',
      qrCodeUrl: undefined,
      payUrl: 'https://openapi.alipay.com/gateway.do?xxx'
    };

    it('支付宝支付应该显示跳转按钮', async () => {
      const wrapper = mount(PaymentDialog, {
        props: alipayProps
      });

      await flushPromises();
      
      const alipaySection = wrapper.find('.alipay-section');
      expect(alipaySection.exists()).toBe(true);
    });

    it('支付宝支付不应该显示二维码', async () => {
      const wrapper = mount(PaymentDialog, {
        props: alipayProps
      });

      await flushPromises();
      expect(wrapper.find('.qrcode-section').exists()).toBe(false);
    });

    it('点击跳转按钮应该打开支付宝链接', async () => {
      const mockOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
      
      const wrapper = mount(PaymentDialog, {
        props: alipayProps
      });

      await flushPromises();
      
      const alipayButton = wrapper.find('.alipay-section button');
      await alipayButton.trigger('click');

      expect(mockOpen).toHaveBeenCalledWith(alipayProps.payUrl, '_blank');
      
      mockOpen.mockRestore();
    });
  });

  describe('倒计时功能', () => {
    it('应该显示倒计时', async () => {
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      
      const countdownSection = wrapper.find('.countdown-section');
      expect(countdownSection.exists()).toBe(true);
      expect(countdownSection.text()).toContain('支付剩余时间');
    });

    it('倒计时应该正确格式化', async () => {
      const wrapper = mount(PaymentDialog, {
        props: {
          ...defaultProps,
          expireTime: Date.now() + 10 * 60 * 1000 // 10分钟
        }
      });

      await flushPromises();
      
      // 检查倒计时格式 (MM:SS)
      const countdownTime = wrapper.find('.countdown-time');
      expect(countdownTime.exists()).toBe(true);
      // 应该显示类似 "09:59" 或 "10:00" 的格式
      expect(countdownTime.text()).toMatch(/\d{2}:\d{2}/);
    });

    it('倒计时结束应该触发timeout事件', async () => {
      const wrapper = mount(PaymentDialog, {
        props: {
          ...defaultProps,
          expireTime: Date.now() + 1000 // 1秒后过期
        }
      });

      await flushPromises();
      
      // 快进2秒
      vi.advanceTimersByTime(2000);
      await flushPromises();

      expect(wrapper.emitted('timeout')).toBeTruthy();
    });
  });

  describe('支付状态轮询', () => {
    it('弹窗显示时应该开始轮询', async () => {
      mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();

      expect(mockStartPaymentPolling).toHaveBeenCalledWith(
        defaultProps.orderNo,
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('弹窗关闭时应该停止轮询', async () => {
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      
      // 关闭弹窗
      await wrapper.setProps({ visible: false });
      await flushPromises();

      expect(mockStopPaymentPolling).toHaveBeenCalled();
    });
  });

  describe('手动检查支付状态', () => {
    it('点击"已完成支付"按钮应该检查状态', async () => {
      mockCheckPaymentStatus.mockResolvedValue('pending');
      
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      
      const checkButton = wrapper.find('.check-section button');
      await checkButton.trigger('click');
      await flushPromises();

      expect(mockCheckPaymentStatus).toHaveBeenCalledWith(defaultProps.orderNo);
    });

    it('检查到支付成功应该触发success事件', async () => {
      mockCheckPaymentStatus.mockResolvedValue('paid');
      
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      
      const checkButton = wrapper.find('.check-section button');
      await checkButton.trigger('click');
      await flushPromises();

      expect(wrapper.emitted('success')).toBeTruthy();
    });

    it('检查到支付失败应该触发fail事件', async () => {
      mockCheckPaymentStatus.mockResolvedValue('failed');
      
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      
      const checkButton = wrapper.find('.check-section button');
      await checkButton.trigger('click');
      await flushPromises();

      expect(wrapper.emitted('fail')).toBeTruthy();
    });
  });

  describe('支付结果显示', () => {
    it('支付成功应该显示成功图标和文案', async () => {
      mockCheckPaymentStatus.mockResolvedValue('paid');
      
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      
      // 触发支付成功
      const checkButton = wrapper.find('.check-section button');
      await checkButton.trigger('click');
      await flushPromises();

      expect(wrapper.find('.result-section.success').exists()).toBe(true);
      expect(wrapper.text()).toContain('支付成功');
      expect(wrapper.text()).toContain('VIP会员已开通');
    });

    it('支付失败应该显示失败图标和文案', async () => {
      mockCheckPaymentStatus.mockResolvedValue('failed');
      
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      
      // 触发支付失败
      const checkButton = wrapper.find('.check-section button');
      await checkButton.trigger('click');
      await flushPromises();

      expect(wrapper.find('.result-section.fail').exists()).toBe(true);
      expect(wrapper.text()).toContain('支付失败');
    });
  });

  describe('关闭弹窗', () => {
    it('点击关闭按钮应该触发update:visible事件', async () => {
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      
      // 找到footer中的关闭按钮
      const closeButton = wrapper.find('.el-dialog__footer button');
      await closeButton.trigger('click');

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')![0]).toEqual([false]);
    });

    it('关闭弹窗应该停止倒计时和轮询', async () => {
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      
      // 关闭弹窗
      const closeButton = wrapper.find('.el-dialog__footer button');
      await closeButton.trigger('click');

      expect(mockStopPaymentPolling).toHaveBeenCalled();
    });
  });

  describe('组件卸载', () => {
    it('组件卸载时应该清理定时器和轮询', async () => {
      const wrapper = mount(PaymentDialog, {
        props: defaultProps
      });

      await flushPromises();
      
      // 卸载组件
      wrapper.unmount();

      expect(mockStopPaymentPolling).toHaveBeenCalled();
    });
  });
});
