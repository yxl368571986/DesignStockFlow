/**
 * 积分页面测试
 * 测试积分余额显示、积分记录、充值功能等
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import ElementPlus from 'element-plus';
import PointsPage from '../index.vue';
import { useUserStore } from '@/pinia/userStore';
import * as pointsAPI from '@/api/points';

// Mock vue-router
const mockRouter = {
  push: vi.fn(),
  back: vi.fn()
};

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => ({
    path: '/points',
    params: {},
    query: {}
  })
}));

// Mock API
vi.mock('@/api/points', () => ({
  getMyPointsInfo: vi.fn(),
  getPointsRecords: vi.fn(),
  getRechargePackages: vi.fn(),
  createRecharge: vi.fn()
}));

// Mock usePointsSync
vi.mock('@/composables/usePointsSync', () => ({
  usePointsSync: () => ({
    refreshPoints: vi.fn().mockResolvedValue({ success: true, pointsBalance: 500 }),
    refreshing: { value: false }
  })
}));

// Mock formatTime
vi.mock('@/utils/format', () => ({
  formatTime: (time: string) => time ? new Date(time).toLocaleDateString() : ''
}));

// Mock user info
const mockUserInfo = {
  userId: 'user-test-001',
  phone: '13800000001',
  nickname: '测试用户',
  avatar: 'https://example.com/avatar.jpg',
  vipLevel: 0,
  vipExpireTime: null,
  pointsBalance: 500,
  pointsTotal: 1000,
  createTime: '2024-01-01'
};

// Mock points records
const mockPointsRecords = [
  {
    recordId: 'record-001',
    userId: 'user-test-001',
    pointsChange: -50,
    pointsBalance: 450,
    changeType: 'consume',
    source: 'download_resource',
    sourceId: 'res-001',
    description: '下载资源消费',
    createdAt: '2024-12-20T10:00:00Z'
  },
  {
    recordId: 'record-002',
    userId: 'user-test-001',
    pointsChange: 100,
    pointsBalance: 500,
    changeType: 'recharge',
    source: 'purchase',
    sourceId: 'order-001',
    description: '积分充值',
    createdAt: '2024-12-19T10:00:00Z'
  },
  {
    recordId: 'record-003',
    userId: 'user-test-001',
    pointsChange: 50,
    pointsBalance: 400,
    changeType: 'reward',
    source: 'upload_approved',
    sourceId: 'res-002',
    description: '上传资源奖励',
    createdAt: '2024-12-18T10:00:00Z'
  }
];

describe('积分页面测试', () => {
  let wrapper: VueWrapper<any>;
  let userStore: ReturnType<typeof useUserStore>;
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    // 创建新的 Pinia 实例并保存引用
    pinia = createPinia();
    setActivePinia(pinia);
    
    // 初始化 userStore
    userStore = useUserStore();
    userStore.setUserInfo(mockUserInfo);
    userStore.setToken('test-token');

    // 重置 mock
    vi.clearAllMocks();
    mockRouter.push.mockClear();
    mockRouter.back.mockClear();

    // 设置默认 API 响应
    vi.mocked(pointsAPI.getMyPointsInfo).mockResolvedValue({
      code: 200,
      msg: 'success',
      data: {
        userId: mockUserInfo.userId,
        pointsBalance: mockUserInfo.pointsBalance,
        pointsTotal: mockUserInfo.pointsTotal,
        userLevel: 1,
        levelName: '初级会员',
        nextLevelPoints: 2000,
        privileges: []
      },
      timestamp: Date.now()
    } as any);

    vi.mocked(pointsAPI.getPointsRecords).mockResolvedValue({
      code: 200,
      msg: 'success',
      data: {
        list: mockPointsRecords,
        total: mockPointsRecords.length,
        page: 1,
        pageSize: 10,
        totalPages: 1
      },
      timestamp: Date.now()
    } as any);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  function createWrapper() {
    // 使用同一个 pinia 实例，确保响应式更新能正确传递
    return mount(PointsPage, {
      global: {
        plugins: [pinia, ElementPlus],
        stubs: {
          'el-icon': true,
          'el-pagination': true
        }
      }
    });
  }

  describe('11.1 积分余额显示测试', () => {
    it('应该正确显示积分余额', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();

      // 查找积分余额显示元素
      const balanceValue = wrapper.find('.balance-value');
      expect(balanceValue.exists()).toBe(true);
      expect(balanceValue.text()).toContain('500');
    });

    it('应该显示"我的积分"标题', async () => {
      wrapper = createWrapper();
      await nextTick();

      const balanceTitle = wrapper.find('.balance-title');
      expect(balanceTitle.exists()).toBe(true);
      expect(balanceTitle.text()).toBe('我的积分');
    });

    it('应该显示积分用途提示', async () => {
      wrapper = createWrapper();
      await nextTick();

      const balanceTip = wrapper.find('.balance-tip');
      expect(balanceTip.exists()).toBe(true);
      expect(balanceTip.text()).toContain('积分可用于下载付费资源');
    });

    it('应该显示刷新按钮', async () => {
      wrapper = createWrapper();
      await nextTick();

      const refreshBtn = wrapper.find('.refresh-btn');
      expect(refreshBtn.exists()).toBe(true);
      expect(refreshBtn.text()).toContain('刷新');
    });

    it('应该显示充值按钮', async () => {
      wrapper = createWrapper();
      await nextTick();

      const rechargeBtn = wrapper.find('.recharge-btn');
      expect(rechargeBtn.exists()).toBe(true);
      expect(rechargeBtn.text()).toContain('积分充值');
    });

    it('应该显示返回按钮', async () => {
      wrapper = createWrapper();
      await nextTick();

      const backBtn = wrapper.find('.card-back-btn');
      expect(backBtn.exists()).toBe(true);
      expect(backBtn.text()).toContain('返回');
    });

    it('点击返回按钮应该调用router.back', async () => {
      // Mock window.history.length > 1 to trigger router.back
      Object.defineProperty(window, 'history', {
        value: { length: 2 },
        writable: true
      });
      
      wrapper = createWrapper();
      await nextTick();

      const backBtn = wrapper.find('.card-back-btn');
      await backBtn.trigger('click');

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('积分余额应该与userStore中的值一致', async () => {
      wrapper = createWrapper();
      await nextTick();

      const balanceValue = wrapper.find('.balance-value');
      expect(balanceValue.text()).toContain(String(userStore.pointsBalance));
    });
  });

  describe('11.2 积分记录显示测试', () => {
    it('应该显示积分明细标题', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();

      const recordsHeader = wrapper.find('.records-header h3');
      expect(recordsHeader.exists()).toBe(true);
      expect(recordsHeader.text()).toBe('积分明细');
    });

    it('应该显示类型筛选下拉框', async () => {
      wrapper = createWrapper();
      await nextTick();

      // 查找el-select组件
      const select = wrapper.findComponent({ name: 'ElSelect' });
      expect(select.exists()).toBe(true);
    });

    it('应该调用getPointsRecords API获取记录', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();

      expect(pointsAPI.getPointsRecords).toHaveBeenCalled();
    });

    it('应该正确显示积分记录列表', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();
      await nextTick();

      const recordItems = wrapper.findAll('.record-item');
      expect(recordItems.length).toBe(mockPointsRecords.length);
    });

    it('消费记录应该显示负数金额', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();
      await nextTick();

      const recordAmounts = wrapper.findAll('.record-amount');
      // 第一条记录是消费记录，金额为-50
      const consumeAmount = recordAmounts[0];
      expect(consumeAmount.text()).toContain('-50');
      expect(consumeAmount.classes()).toContain('negative');
    });

    it('充值记录应该显示正数金额', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();
      await nextTick();

      const recordAmounts = wrapper.findAll('.record-amount');
      // 第二条记录是充值记录，金额为+100
      const rechargeAmount = recordAmounts[1];
      expect(rechargeAmount.text()).toContain('+100');
      expect(rechargeAmount.classes()).toContain('positive');
    });

    it('奖励记录应该显示正数金额', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();
      await nextTick();

      const recordAmounts = wrapper.findAll('.record-amount');
      // 第三条记录是奖励记录，金额为+50
      const rewardAmount = recordAmounts[2];
      expect(rewardAmount.text()).toContain('+50');
      expect(rewardAmount.classes()).toContain('positive');
    });

    it('应该显示记录描述', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();
      await nextTick();

      const recordTitles = wrapper.findAll('.record-title');
      expect(recordTitles[0].text()).toBe('下载资源消费');
      expect(recordTitles[1].text()).toBe('积分充值');
      expect(recordTitles[2].text()).toBe('上传资源奖励');
    });

    it('应该显示记录时间', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();
      await nextTick();

      const recordTimes = wrapper.findAll('.record-time');
      expect(recordTimes.length).toBe(mockPointsRecords.length);
    });

    it('消费记录应该显示正确的图标样式', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();
      await nextTick();

      const recordIcons = wrapper.findAll('.record-icon');
      expect(recordIcons[0].classes()).toContain('type-consume');
    });

    it('充值记录应该显示正确的图标样式', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();
      await nextTick();

      const recordIcons = wrapper.findAll('.record-icon');
      expect(recordIcons[1].classes()).toContain('type-recharge');
    });

    it('奖励记录应该显示正确的图标样式', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();
      await nextTick();

      const recordIcons = wrapper.findAll('.record-icon');
      expect(recordIcons[2].classes()).toContain('type-reward');
    });

    it('无记录时应该显示空状态', async () => {
      vi.mocked(pointsAPI.getPointsRecords).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: {
          list: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 0
        },
        timestamp: Date.now()
      } as any);

      wrapper = createWrapper();
      await nextTick();
      await nextTick();
      await nextTick();

      // 查找el-empty组件
      const empty = wrapper.findComponent({ name: 'ElEmpty' });
      expect(empty.exists()).toBe(true);
    });
  });

  describe('11.3 积分充值测试', () => {
    it('应该显示积分充值区域', async () => {
      wrapper = createWrapper();
      await nextTick();

      const rechargeSection = wrapper.find('.points-recharge-section');
      expect(rechargeSection.exists()).toBe(true);
    });

    it('应该显示充值套餐列表', async () => {
      wrapper = createWrapper();
      await nextTick();

      const packages = wrapper.findAll('.package-card');
      expect(packages.length).toBeGreaterThan(0);
    });

    it('应该显示套餐积分数量', async () => {
      wrapper = createWrapper();
      await nextTick();

      const pointsValues = wrapper.findAll('.package-points .points-value');
      expect(pointsValues.length).toBeGreaterThan(0);
      expect(pointsValues[0].text()).toBe('100');
    });

    it('应该显示套餐价格', async () => {
      wrapper = createWrapper();
      await nextTick();

      const priceValues = wrapper.findAll('.package-price .price-value');
      expect(priceValues.length).toBeGreaterThan(0);
      expect(priceValues[0].text()).toBe('10');
    });

    it('应该显示推荐套餐标识', async () => {
      wrapper = createWrapper();
      await nextTick();

      const recommendBadge = wrapper.find('.recommend-badge');
      expect(recommendBadge.exists()).toBe(true);
      expect(recommendBadge.text()).toBe('推荐');
    });

    it('点击套餐应该选中该套餐', async () => {
      wrapper = createWrapper();
      await nextTick();

      const packages = wrapper.findAll('.package-card');
      await packages[0].trigger('click');
      await nextTick();

      expect(packages[0].classes()).toContain('selected');
    });

    it('应该显示立即充值按钮', async () => {
      wrapper = createWrapper();
      await nextTick();

      // 查找充值按钮
      const rechargeActions = wrapper.find('.recharge-actions');
      expect(rechargeActions.exists()).toBe(true);
      
      const rechargeBtn = rechargeActions.findComponent({ name: 'ElButton' });
      expect(rechargeBtn.exists()).toBe(true);
    });

    it('未选择套餐时充值按钮应该禁用', async () => {
      wrapper = createWrapper();
      await nextTick();

      const rechargeActions = wrapper.find('.recharge-actions');
      const rechargeBtn = rechargeActions.findComponent({ name: 'ElButton' });
      expect(rechargeBtn.props('disabled')).toBe(true);
    });

    it('选择套餐后充值按钮应该启用', async () => {
      wrapper = createWrapper();
      await nextTick();

      const packages = wrapper.findAll('.package-card');
      await packages[0].trigger('click');
      await nextTick();

      const rechargeActions = wrapper.find('.recharge-actions');
      const rechargeBtn = rechargeActions.findComponent({ name: 'ElButton' });
      expect(rechargeBtn.props('disabled')).toBe(false);
    });

    it('应该显示折扣信息', async () => {
      wrapper = createWrapper();
      await nextTick();

      const discounts = wrapper.findAll('.package-discount');
      expect(discounts.length).toBeGreaterThan(0);
    });

    it('应该显示套餐描述', async () => {
      wrapper = createWrapper();
      await nextTick();

      const descriptions = wrapper.findAll('.package-desc');
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  describe('11.4 积分规则显示测试', () => {
    it('应该显示积分规则区域', async () => {
      wrapper = createWrapper();
      await nextTick();

      const rulesSection = wrapper.find('.points-rules');
      expect(rulesSection.exists()).toBe(true);
    });

    it('应该显示积分规则标题', async () => {
      wrapper = createWrapper();
      await nextTick();

      const rulesTitle = wrapper.find('.points-rules h3');
      expect(rulesTitle.exists()).toBe(true);
      expect(rulesTitle.text()).toBe('积分规则');
    });

    it('应该显示下载消费规则', async () => {
      wrapper = createWrapper();
      await nextTick();

      const ruleItems = wrapper.findAll('.rule-item');
      const downloadRule = ruleItems.find(item => item.text().includes('下载消费'));
      expect(downloadRule).toBeDefined();
    });

    it('应该显示上传奖励规则', async () => {
      wrapper = createWrapper();
      await nextTick();

      const ruleItems = wrapper.findAll('.rule-item');
      const uploadRule = ruleItems.find(item => item.text().includes('上传奖励'));
      expect(uploadRule).toBeDefined();
    });

    it('应该显示VIP特权规则', async () => {
      wrapper = createWrapper();
      await nextTick();

      const ruleItems = wrapper.findAll('.rule-item');
      const vipRule = ruleItems.find(item => item.text().includes('VIP特权'));
      expect(vipRule).toBeDefined();
    });

    it('应该显示积分充值规则', async () => {
      wrapper = createWrapper();
      await nextTick();

      const ruleItems = wrapper.findAll('.rule-item');
      const rechargeRule = ruleItems.find(item => item.text().includes('积分充值'));
      expect(rechargeRule).toBeDefined();
    });
  });

  describe('API接口规范检查', () => {
    it('getPointsRecords应该使用正确的参数格式', async () => {
      wrapper = createWrapper();
      await nextTick();
      await nextTick();

      expect(pointsAPI.getPointsRecords).toHaveBeenCalledWith(
        expect.objectContaining({
          pageNum: expect.any(Number),
          pageSize: expect.any(Number)
        })
      );
    });

    it('API响应应该包含code、msg、data字段', async () => {
      const response = await pointsAPI.getPointsRecords({ pageNum: 1, pageSize: 10 });
      
      expect(response).toHaveProperty('code');
      expect(response).toHaveProperty('msg');
      expect(response).toHaveProperty('data');
    });

    it('分页响应应该包含list、total、page、pageSize字段', async () => {
      const response = await pointsAPI.getPointsRecords({ pageNum: 1, pageSize: 10 });
      
      expect(response.data).toHaveProperty('list');
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('page');
      expect(response.data).toHaveProperty('pageSize');
    });

    it('积分记录应该包含必要字段', async () => {
      const response = await pointsAPI.getPointsRecords({ pageNum: 1, pageSize: 10 });
      const record = response.data.list[0];
      
      expect(record).toHaveProperty('recordId');
      expect(record).toHaveProperty('pointsChange');
      expect(record).toHaveProperty('changeType');
      expect(record).toHaveProperty('description');
      expect(record).toHaveProperty('createdAt');
    });
  });

  describe('数据一致性测试', () => {
    it('页面显示的积分余额应该与userStore一致', async () => {
      wrapper = createWrapper();
      await nextTick();

      const balanceValue = wrapper.find('.balance-value');
      expect(balanceValue.text()).toContain(String(userStore.pointsBalance));
    });

    it('更新userStore后页面应该同步更新', async () => {
      wrapper = createWrapper();
      await nextTick();

      // 更新userStore中的积分
      userStore.updateUserInfo({ pointsBalance: 1000 });
      await nextTick();

      const balanceValue = wrapper.find('.balance-value');
      expect(balanceValue.text()).toContain('1000');
    });
  });
});
