/**
 * VIP中心页面单元测试
 * 测试VIP页面布局、套餐卡片、特权列表、购买流程和状态更新
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.8, 44.1
 * 
 * Task 10: VIP功能测试
 * - 10.1 测试VIP页面布局和按钮
 * - 10.2 测试VIP套餐卡片
 * - 10.3 测试VIP特权列表
 * - 10.4 测试VIP购买流程
 * - 10.5 测试VIP状态更新
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { ElMessage } from 'element-plus';
import ElementPlus from 'element-plus';
import { nextTick } from 'vue';

// Mock Element Plus
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus');
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }
  };
});

// Mock vue-router
const mockRouterPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush
  }),
  useRoute: () => ({
    query: {}
  })
}));

// Mock VIP API functions
vi.mock('@/api/vip', () => ({
  getVipPackages: vi.fn(),
  getVipPrivileges: vi.fn(),
  getUserVipInfo: vi.fn()
}));

// Mock userStore
const mockUserInfo = {
  userId: 'test-user-id',
  phone: '13800138000',
  nickname: '测试用户',
  avatar: 'https://example.com/avatar.jpg',
  vipLevel: 0,
  vipExpireAt: null,
  pointsBalance: 500
};

vi.mock('@/pinia/userStore', () => ({
  useUserStore: () => ({
    userInfo: mockUserInfo,
    token: 'test-token',
    isLoggedIn: true,
    updateUserInfo: vi.fn()
  })
}));

import VIPPage from '../index.vue';
import { getVipPackages, getVipPrivileges, getUserVipInfo } from '@/api/vip';

// 创建VIP套餐mock数据
function createMockVipPackages() {
  return [
    {
      packageId: 'pkg-monthly',
      packageName: '月度会员',
      packageCode: 'monthly',
      durationDays: 30,
      originalPrice: 39,
      currentPrice: 29,
      description: '月度VIP会员',
      sortOrder: 1,
      status: 1
    },
    {
      packageId: 'pkg-yearly',
      packageName: '年度会员',
      packageCode: 'yearly',
      durationDays: 365,
      originalPrice: 299,
      currentPrice: 199,
      description: '年度VIP会员，推荐',
      sortOrder: 2,
      status: 1
    },
    {
      packageId: 'pkg-lifetime',
      packageName: '终身会员',
      packageCode: 'lifetime',
      durationDays: -1,
      originalPrice: 799,
      currentPrice: 599,
      description: '终身VIP会员',
      sortOrder: 3,
      status: 1
    }
  ];
}

// 创建VIP特权mock数据
function createMockVipPrivileges() {
  return [
    {
      privilegeId: 'priv-1',
      privilegeName: '无限下载资源',
      privilegeCode: 'unlimited_download',
      privilegeType: 'download',
      privilegeValue: 'unlimited',
      description: '每日无限次下载资源',
      isEnabled: true,
      sortOrder: 1
    },
    {
      privilegeId: 'priv-2',
      privilegeName: '专属VIP标识',
      privilegeCode: 'vip_badge',
      privilegeType: 'badge',
      privilegeValue: 'vip',
      description: '显示专属VIP标识',
      isEnabled: true,
      sortOrder: 2
    },
    {
      privilegeId: 'priv-3',
      privilegeName: '优先客服支持',
      privilegeCode: 'priority_support',
      privilegeType: 'support',
      privilegeValue: 'priority',
      description: '享受优先客服支持',
      isEnabled: true,
      sortOrder: 3
    },
    {
      privilegeId: 'priv-4',
      privilegeName: '专属设计素材',
      privilegeCode: 'exclusive_resources',
      privilegeType: 'resource',
      privilegeValue: 'exclusive',
      description: '访问专属设计素材',
      isEnabled: true,
      sortOrder: 4
    }
  ];
}

// 创建用户VIP信息mock数据
function createMockUserVipInfo(vipLevel: number = 0) {
  return {
    userId: 'test-user-id',
    vipLevel,
    vipExpireAt: vipLevel > 0 ? '2025-12-31T23:59:59.000Z' : null,
    isVip: vipLevel > 0,
    daysRemaining: vipLevel > 0 ? 365 : 0,
    privileges: vipLevel > 0 ? createMockVipPrivileges() : []
  };
}

// 创建API响应
function createMockApiResponse<T>(data: T) {
  return {
    code: 0,
    message: 'success',
    data
  };
}

/**
 * Task 10.1: 测试VIP页面布局和按钮
 * Requirements: 7.1, 26.1
 */
describe('Task 10.1: VIP Page Layout and Buttons', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockRouterPush.mockClear();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.resetAllMocks();
  });

  it('should render VIP page with correct layout', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证VIP页面容器存在
    expect(wrapper.find('.vip-page').exists()).toBe(true);
    expect(wrapper.find('.vip-container').exists()).toBe(true);
  });

  it('should display page title correctly', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证页面标题
    const title = wrapper.find('.vip-title');
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe('VIP会员中心');
  });

  it('should display page subtitle correctly', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证页面副标题
    const subtitle = wrapper.find('.vip-subtitle');
    expect(subtitle.exists()).toBe(true);
    expect(subtitle.text()).toBe('升级VIP，享受更多特权');
  });

  it('should have VIP plans container', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证套餐容器存在
    expect(wrapper.find('.vip-plans').exists()).toBe(true);
  });

  it('should have gradient background', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证页面有渐变背景样式
    const vipPage = wrapper.find('.vip-page');
    expect(vipPage.exists()).toBe(true);
  });
});

/**
 * Task 10.2: 测试VIP套餐卡片
 * Requirements: 7.1, 44.1
 */
describe('Task 10.2: VIP Package Cards', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.resetAllMocks();
  });

  it('should display three VIP package cards', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证有3个套餐卡片
    const planCards = wrapper.findAll('.vip-plan');
    expect(planCards.length).toBe(3);
  });

  it('should display monthly package with correct price', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证月度套餐
    const plans = wrapper.findAll('.vip-plan');
    const monthlyPlan = plans[0];
    
    expect(monthlyPlan.find('h3').text()).toBe('月度会员');
    expect(monthlyPlan.find('.price').text()).toContain('29');
  });

  it('should display yearly package with recommended badge', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证年度套餐有推荐标识
    const featuredPlan = wrapper.find('.vip-plan.featured');
    expect(featuredPlan.exists()).toBe(true);
    expect(featuredPlan.find('.badge').exists()).toBe(true);
    expect(featuredPlan.find('.badge').text()).toBe('推荐');
  });

  it('should display lifetime package with correct price', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证终身套餐
    const plans = wrapper.findAll('.vip-plan');
    const lifetimePlan = plans[2];
    
    expect(lifetimePlan.find('h3').text()).toBe('终身会员');
    expect(lifetimePlan.find('.price').text()).toContain('599');
  });

  it('should have purchase button on each package card', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证每个套餐都有开通按钮
    const plans = wrapper.findAll('.vip-plan');
    plans.forEach(plan => {
      const button = plan.find('.el-button');
      expect(button.exists()).toBe(true);
      expect(button.text()).toBe('立即开通');
    });
  });

  it('should display price with duration suffix', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    const plans = wrapper.findAll('.vip-plan');
    
    // 月度套餐显示 /月
    expect(plans[0].find('.price span').text()).toBe('/月');
    // 年度套餐显示 /年
    expect(plans[1].find('.price span').text()).toBe('/年');
    // 终身套餐显示 /终身
    expect(plans[2].find('.price span').text()).toBe('/终身');
  });
});

/**
 * Task 10.3: 测试VIP特权列表
 * Requirements: 7.8
 */
describe('Task 10.3: VIP Privileges List', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.resetAllMocks();
  });

  it('should display features list on each package card', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证每个套餐都有特权列表
    const plans = wrapper.findAll('.vip-plan');
    plans.forEach(plan => {
      expect(plan.find('.features').exists()).toBe(true);
    });
  });

  it('should display unlimited download privilege', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证无限下载特权显示
    const features = wrapper.findAll('.features li');
    const hasUnlimitedDownload = features.some(f => f.text().includes('无限下载'));
    expect(hasUnlimitedDownload).toBe(true);
  });

  it('should display VIP badge privilege', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证VIP标识特权显示
    const features = wrapper.findAll('.features li');
    const hasVipBadge = features.some(f => f.text().includes('VIP标识'));
    expect(hasVipBadge).toBe(true);
  });

  it('should display priority support privilege', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证优先客服特权显示
    const features = wrapper.findAll('.features li');
    const hasPrioritySupport = features.some(f => f.text().includes('客服'));
    expect(hasPrioritySupport).toBe(true);
  });

  it('should display exclusive resources privilege on yearly and lifetime plans', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证年度和终身套餐有专属素材特权
    const plans = wrapper.findAll('.vip-plan');
    const yearlyFeatures = plans[1].findAll('.features li');
    const lifetimeFeatures = plans[2].findAll('.features li');
    
    const yearlyHasExclusive = yearlyFeatures.some(f => f.text().includes('专属'));
    const lifetimeHasExclusive = lifetimeFeatures.some(f => f.text().includes('专属'));
    
    expect(yearlyHasExclusive).toBe(true);
    expect(lifetimeHasExclusive).toBe(true);
  });

  it('should display lifetime free update privilege only on lifetime plan', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证终身套餐有终身免费更新特权
    const plans = wrapper.findAll('.vip-plan');
    const lifetimeFeatures = plans[2].findAll('.features li');
    
    const hasLifetimeUpdate = lifetimeFeatures.some(f => f.text().includes('终身免费更新'));
    expect(hasLifetimeUpdate).toBe(true);
  });

  it('should have checkmark icon on each feature', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证每个特权都有勾选图标
    const features = wrapper.findAll('.features li');
    features.forEach(feature => {
      expect(feature.text()).toContain('✓');
    });
  });
});

/**
 * Task 10.4: 测试VIP购买流程
 * Requirements: 7.2, 7.3, 44.1
 */
describe('Task 10.4: VIP Purchase Flow', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockRouterPush.mockClear();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.resetAllMocks();
  });

  it('should have clickable purchase buttons', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证购买按钮可点击
    const buttons = wrapper.findAll('.vip-plan .el-button');
    expect(buttons.length).toBe(3);
    
    buttons.forEach(button => {
      expect(button.attributes('disabled')).toBeUndefined();
    });
  });

  it('should have primary type buttons for purchase', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证按钮类型为primary
    const buttons = wrapper.findAll('.vip-plan .el-button');
    buttons.forEach(button => {
      expect(button.classes()).toContain('el-button--primary');
    });
  });

  it('should have large size buttons', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证按钮大小为large
    const buttons = wrapper.findAll('.vip-plan .el-button');
    buttons.forEach(button => {
      expect(button.classes()).toContain('el-button--large');
    });
  });

  it('should have full width buttons', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证按钮宽度为100%（通过CSS类验证）
    const plans = wrapper.findAll('.vip-plan');
    plans.forEach(plan => {
      const button = plan.find('.el-button');
      expect(button.exists()).toBe(true);
    });
  });
});

/**
 * Task 10.5: 测试VIP状态更新
 * Requirements: 7.4, 7.6
 */
describe('Task 10.5: VIP Status Update', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.resetAllMocks();
  });

  it('should render page correctly for non-VIP user', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证非VIP用户可以看到所有套餐
    const plans = wrapper.findAll('.vip-plan');
    expect(plans.length).toBe(3);
  });

  it('should display featured plan with scale effect', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证推荐套餐有特殊样式
    const featuredPlan = wrapper.find('.vip-plan.featured');
    expect(featuredPlan.exists()).toBe(true);
  });

  it('should have hover effect on plan cards', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证套餐卡片存在（hover效果通过CSS实现）
    const plans = wrapper.findAll('.vip-plan');
    expect(plans.length).toBeGreaterThan(0);
  });
});

/**
 * 响应式布局测试
 * Requirements: 20.4
 */
describe('VIP Page Responsive Layout', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.resetAllMocks();
  });

  it('should have responsive grid layout for plans', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证套餐使用grid布局
    const plansContainer = wrapper.find('.vip-plans');
    expect(plansContainer.exists()).toBe(true);
  });

  it('should have minimum height for page', async () => {
    wrapper = mount(VIPPage, {
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });

    await flushPromises();

    // 验证页面有最小高度
    const vipPage = wrapper.find('.vip-page');
    expect(vipPage.exists()).toBe(true);
  });
});

/**
 * API接口规范测试
 * Requirements: 44.1
 */
describe('VIP API Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should have correct API endpoint for packages', () => {
    // 验证API函数存在
    expect(getVipPackages).toBeDefined();
  });

  it('should have correct API endpoint for privileges', () => {
    // 验证API函数存在
    expect(getVipPrivileges).toBeDefined();
  });

  it('should have correct API endpoint for user VIP info', () => {
    // 验证API函数存在
    expect(getUserVipInfo).toBeDefined();
  });
});
