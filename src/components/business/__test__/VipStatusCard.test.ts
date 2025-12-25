/**
 * VipStatusCard组件单元测试
 * 测试VIP状态卡片的不同状态显示
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import VipStatusCard from '../VipStatusCard.vue';
import VipIcon from '../VipIcon.vue';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

// Mock Element Plus
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus');
  return {
    ...actual,
    ElButton: {
      name: 'ElButton',
      template: '<button><slot /></button>',
      props: ['type', 'size']
    },
    ElIcon: {
      name: 'ElIcon',
      template: '<span><slot /></span>'
    }
  };
});

describe('VipStatusCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('VIP状态显示', () => {
    it('普通用户应该显示"普通用户"状态', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: false,
          isLifetimeVip: false
        },
        global: {
          components: { VipIcon }
        }
      });

      expect(wrapper.find('.status-title').text()).toBe('普通用户');
      expect(wrapper.find('.vip-status-card').classes()).not.toContain('is-vip');
    });

    it('VIP用户应该显示"VIP会员"状态', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: false,
          expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 30
        },
        global: {
          components: { VipIcon }
        }
      });

      expect(wrapper.find('.status-title').text()).toBe('VIP会员');
      expect(wrapper.find('.vip-status-card').classes()).toContain('is-vip');
    });

    it('终身VIP应该显示"终身VIP会员"状态', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: true
        },
        global: {
          components: { VipIcon }
        }
      });

      expect(wrapper.find('.status-title').text()).toBe('终身VIP会员');
      expect(wrapper.find('.vip-status-card').classes()).toContain('is-vip');
    });

    it('宽限期用户应该显示"VIP已过期（宽限期）"状态', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: false,
          isLifetimeVip: false,
          daysRemaining: -3 // 过期3天，在7天宽限期内
        },
        global: {
          components: { VipIcon }
        }
      });

      expect(wrapper.find('.status-title').text()).toBe('VIP已过期（宽限期）');
    });
  });

  describe('到期时间显示', () => {
    it('终身VIP应该显示"永久有效"', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: true
        },
        global: {
          components: { VipIcon }
        }
      });

      expect(wrapper.find('.expire-text').text()).toBe('永久有效');
    });

    it('VIP用户应该显示到期时间和剩余天数', () => {
      const expireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: false,
          expireAt: expireDate.toISOString(),
          daysRemaining: 30
        },
        global: {
          components: { VipIcon }
        }
      });

      const expireText = wrapper.find('.expire-text').text();
      expect(expireText).toContain('到期');
      expect(expireText).toContain('剩余30天');
    });

    it('今日到期应该显示"今日到期"', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: false,
          expireAt: new Date().toISOString(),
          daysRemaining: 0
        },
        global: {
          components: { VipIcon }
        }
      });

      expect(wrapper.find('.expire-text').text()).toBe('今日到期');
    });

    it('已过期应该显示过期日期', () => {
      const expireDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: false,
          isLifetimeVip: false,
          expireAt: expireDate.toISOString(),
          daysRemaining: -3
        },
        global: {
          components: { VipIcon }
        }
      });

      const expireText = wrapper.find('.expire-text').text();
      expect(expireText).toContain('已于');
      expect(expireText).toContain('过期');
    });
  });

  describe('按钮显示', () => {
    it('普通用户应该显示"开通VIP"按钮', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: false,
          isLifetimeVip: false
        },
        global: {
          components: { VipIcon }
        }
      });

      const button = wrapper.find('button');
      expect(button.exists()).toBe(true);
      expect(button.text()).toBe('开通VIP');
    });

    it('VIP用户应该显示"续费VIP"按钮', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: false,
          expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 30
        },
        global: {
          components: { VipIcon }
        }
      });

      const button = wrapper.find('button');
      expect(button.exists()).toBe(true);
      expect(button.text()).toBe('续费VIP');
    });

    it('终身VIP不应该显示按钮', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: true
        },
        global: {
          components: { VipIcon }
        }
      });

      const button = wrapper.find('button');
      expect(button.exists()).toBe(false);
    });
  });

  describe('特权列表显示', () => {
    it('应该正确显示特权列表', () => {
      const privileges = [
        { privilegeId: '1', privilegeName: '无限下载' },
        { privilegeId: '2', privilegeName: '专属标识' }
      ];

      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: false,
          privileges,
          showPrivileges: true
        },
        global: {
          components: { VipIcon }
        }
      });

      const privilegeItems = wrapper.findAll('.privilege-item');
      expect(privilegeItems.length).toBe(2);
      expect(privilegeItems[0].text()).toContain('无限下载');
      expect(privilegeItems[1].text()).toContain('专属标识');
    });

    it('showPrivileges为false时不应该显示特权列表', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: false,
          privileges: [{ privilegeId: '1', privilegeName: '无限下载' }],
          showPrivileges: false
        },
        global: {
          components: { VipIcon }
        }
      });

      expect(wrapper.find('.privileges-section').exists()).toBe(false);
    });

    it('应该支持字符串数组形式的特权列表', () => {
      const privileges = ['无限下载', '专属标识'];

      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: false,
          privileges,
          showPrivileges: true
        },
        global: {
          components: { VipIcon }
        }
      });

      const privilegeItems = wrapper.findAll('.privilege-item');
      expect(privilegeItems.length).toBe(2);
    });
  });

  describe('紧凑模式', () => {
    it('compact为true时应该应用紧凑样式', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: false,
          compact: true
        },
        global: {
          components: { VipIcon }
        }
      });

      expect(wrapper.find('.vip-status-card').classes()).toContain('compact');
    });

    it('紧凑模式下不应该显示特权列表', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: false,
          compact: true,
          privileges: [{ privilegeId: '1', privilegeName: '无限下载' }],
          showPrivileges: true
        },
        global: {
          components: { VipIcon }
        }
      });

      expect(wrapper.find('.privileges-section').exists()).toBe(false);
    });
  });

  describe('非VIP提示', () => {
    it('非VIP用户应该显示开通提示', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: false,
          isLifetimeVip: false,
          compact: false
        },
        global: {
          components: { VipIcon }
        }
      });

      expect(wrapper.find('.non-vip-tips').exists()).toBe(true);
      expect(wrapper.find('.non-vip-tips').text()).toContain('开通VIP会员');
    });

    it('VIP用户不应该显示开通提示', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: true,
          isLifetimeVip: false
        },
        global: {
          components: { VipIcon }
        }
      });

      expect(wrapper.find('.non-vip-tips').exists()).toBe(false);
    });

    it('紧凑模式下不应该显示开通提示', () => {
      const wrapper = mount(VipStatusCard, {
        props: {
          isVip: false,
          isLifetimeVip: false,
          compact: true
        },
        global: {
          components: { VipIcon }
        }
      });

      expect(wrapper.find('.non-vip-tips').exists()).toBe(false);
    });
  });
});
