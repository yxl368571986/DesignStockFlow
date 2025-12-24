/**
 * 后台管理 - 数据概览页面测试
 * 任务13.1 & 13.2: 数据概览和快捷操作区域测试
 * 需求: 10.1, 10.2, 10.3, 44.1
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import ElementPlus from 'element-plus';
import Dashboard from '../index.vue';

// Mock API模块
vi.mock('@/api/statistics', () => ({
  getOverview: vi.fn(),
  getUserGrowth: vi.fn(),
  getResourceGrowth: vi.fn(),
  getDownloadStats: vi.fn(),
  getHotCategories: vi.fn()
}));

// Mock chartOptions
vi.mock('@/utils/chartOptions', () => ({
  createLineChartOption: vi.fn(() => ({})),
  createPieChartOption: vi.fn(() => ({})),
  createBarChartOption: vi.fn(() => ({}))
}));

// Mock AdminChart组件
vi.mock('@/components/common/AdminChart.vue', () => ({
  default: {
    name: 'AdminChart',
    props: ['title', 'option', 'height', 'refreshable'],
    emits: ['refresh'],
    template: `
      <div class="mock-admin-chart" :data-title="title">
        <span class="chart-title">{{ title }}</span>
        <button v-if="refreshable" class="refresh-btn" @click="$emit('refresh')">刷新</button>
      </div>
    `
  }
}));

import {
  getOverview,
  getUserGrowth,
  getResourceGrowth,
  getDownloadStats,
  getHotCategories
} from '@/api/statistics';

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/admin/audit', component: { template: '<div>Audit</div>' } },
    { path: '/admin/users', component: { template: '<div>Users</div>' } },
    { path: '/admin/resources', component: { template: '<div>Resources</div>' } },
    { path: '/admin/settings', component: { template: '<div>Settings</div>' } }
  ]
});

// Mock数据
const mockOverviewData = {
  code: 200,
  msg: 'success',
  data: {
    totalUsers: 12580,
    totalResources: 8964,
    todayDownloads: 1256,
    vipUsers: 856,
    pendingAudit: 23
  }
};

const mockUserGrowthData = {
  code: 200,
  msg: 'success',
  data: [
    { date: '2025-12-01', newUsers: 120 },
    { date: '2025-12-02', newUsers: 150 },
    { date: '2025-12-03', newUsers: 180 }
  ]
};

const mockResourceGrowthData = {
  code: 200,
  msg: 'success',
  data: [
    { date: '2025-12-01', newResources: 80 },
    { date: '2025-12-02', newResources: 95 },
    { date: '2025-12-03', newResources: 110 }
  ]
};

const mockDownloadStatsData = {
  code: 200,
  msg: 'success',
  data: [
    { date: '2025-12-18', downloads: 820 },
    { date: '2025-12-19', downloads: 932 },
    { date: '2025-12-20', downloads: 901 }
  ]
};

const mockHotCategoriesData = {
  code: 200,
  msg: 'success',
  data: [
    { categoryName: 'UI设计', resourceCount: 2580 },
    { categoryName: '插画', resourceCount: 1856 },
    { categoryName: '摄影图', resourceCount: 1456 }
  ]
};

describe('Admin Dashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    // 设置默认mock返回值
    (getOverview as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverviewData);
    (getUserGrowth as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserGrowthData);
    (getResourceGrowth as ReturnType<typeof vi.fn>).mockResolvedValue(mockResourceGrowthData);
    (getDownloadStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockDownloadStatsData);
    (getHotCategories as ReturnType<typeof vi.fn>).mockResolvedValue(mockHotCategoriesData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mountDashboard = async () => {
    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router, ElementPlus, createPinia()],
        stubs: {
          'el-icon': true
        }
      }
    });
    await flushPromises();
    return wrapper;
  };

  describe('13.1 数据概览页面测试', () => {
    it('应正确渲染页面布局', async () => {
      const wrapper = await mountDashboard();
      
      expect(wrapper.find('.admin-dashboard').exists()).toBe(true);
      expect(wrapper.find('.dashboard-stats').exists()).toBe(true);
      expect(wrapper.find('.dashboard-charts').exists()).toBe(true);
      expect(wrapper.find('.dashboard-actions').exists()).toBe(true);
    });

    it('应显示用户总数统计卡片', async () => {
      const wrapper = await mountDashboard();
      
      const statCards = wrapper.findAll('.admin-stat-card');
      expect(statCards.length).toBeGreaterThanOrEqual(4);
      
      const userCard = statCards[0];
      expect(userCard.text()).toContain('用户总数');
      expect(userCard.text()).toContain('12,580');
    });

    it('应显示资源总数统计卡片', async () => {
      const wrapper = await mountDashboard();
      
      const statCards = wrapper.findAll('.admin-stat-card');
      const resourceCard = statCards[1];
      expect(resourceCard.text()).toContain('资源总数');
      expect(resourceCard.text()).toContain('8,964');
    });

    it('应显示今日下载统计卡片', async () => {
      const wrapper = await mountDashboard();
      
      const statCards = wrapper.findAll('.admin-stat-card');
      const downloadCard = statCards[2];
      expect(downloadCard.text()).toContain('今日下载');
      expect(downloadCard.text()).toContain('1,256');
    });

    it('应显示VIP用户统计卡片', async () => {
      const wrapper = await mountDashboard();
      
      const statCards = wrapper.findAll('.admin-stat-card');
      const vipCard = statCards[3];
      expect(vipCard.text()).toContain('VIP用户');
      expect(vipCard.text()).toContain('856');
    });

    it('应显示增长率趋势指示器', async () => {
      const wrapper = await mountDashboard();
      
      const trends = wrapper.findAll('.admin-stat-trend');
      expect(trends.length).toBe(4);
      
      // 检查上升趋势
      const upTrends = wrapper.findAll('.admin-stat-trend.up');
      expect(upTrends.length).toBeGreaterThanOrEqual(3);
      
      // 检查下降趋势
      const downTrends = wrapper.findAll('.admin-stat-trend.down');
      expect(downTrends.length).toBeGreaterThanOrEqual(1);
    });

    it('应显示用户增长趋势图表', async () => {
      const wrapper = await mountDashboard();
      
      const charts = wrapper.findAll('.mock-admin-chart');
      const userGrowthChart = charts.find(c => c.attributes('data-title') === '用户增长趋势');
      expect(userGrowthChart).toBeDefined();
    });

    it('应显示资源增长趋势图表', async () => {
      const wrapper = await mountDashboard();
      
      const charts = wrapper.findAll('.mock-admin-chart');
      const resourceGrowthChart = charts.find(c => c.attributes('data-title') === '资源增长趋势');
      expect(resourceGrowthChart).toBeDefined();
    });

    it('应显示热门分类分布图表', async () => {
      const wrapper = await mountDashboard();
      
      const charts = wrapper.findAll('.mock-admin-chart');
      const categoryChart = charts.find(c => c.attributes('data-title') === '热门分类分布');
      expect(categoryChart).toBeDefined();
    });

    it('应显示下载量统计图表', async () => {
      const wrapper = await mountDashboard();
      
      const charts = wrapper.findAll('.mock-admin-chart');
      const downloadChart = charts.find(c => c.attributes('data-title') === '下载量统计');
      expect(downloadChart).toBeDefined();
    });

    it('用户增长图表应有刷新按钮', async () => {
      const wrapper = await mountDashboard();
      
      const charts = wrapper.findAll('.mock-admin-chart');
      const userGrowthChart = charts.find(c => c.attributes('data-title') === '用户增长趋势');
      expect(userGrowthChart?.find('.refresh-btn').exists()).toBe(true);
    });

    it('资源增长图表应有刷新按钮', async () => {
      const wrapper = await mountDashboard();
      
      const charts = wrapper.findAll('.mock-admin-chart');
      const resourceGrowthChart = charts.find(c => c.attributes('data-title') === '资源增长趋势');
      expect(resourceGrowthChart?.find('.refresh-btn').exists()).toBe(true);
    });

    it('点击用户增长图表刷新按钮应重新加载数据', async () => {
      const wrapper = await mountDashboard();
      
      const charts = wrapper.findAll('.mock-admin-chart');
      const userGrowthChart = charts.find(c => c.attributes('data-title') === '用户增长趋势');
      
      vi.clearAllMocks();
      await userGrowthChart?.find('.refresh-btn').trigger('click');
      
      expect(getUserGrowth).toHaveBeenCalled();
    });

    it('点击资源增长图表刷新按钮应重新加载数据', async () => {
      const wrapper = await mountDashboard();
      
      const charts = wrapper.findAll('.mock-admin-chart');
      const resourceGrowthChart = charts.find(c => c.attributes('data-title') === '资源增长趋势');
      
      vi.clearAllMocks();
      await resourceGrowthChart?.find('.refresh-btn').trigger('click');
      
      expect(getResourceGrowth).toHaveBeenCalled();
    });

    it('应调用统计API获取数据', async () => {
      await mountDashboard();
      
      expect(getOverview).toHaveBeenCalled();
      expect(getUserGrowth).toHaveBeenCalled();
      expect(getResourceGrowth).toHaveBeenCalled();
      expect(getDownloadStats).toHaveBeenCalled();
      expect(getHotCategories).toHaveBeenCalled();
    });

    it('API返回错误时应使用默认数据', async () => {
      (getOverview as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));
      
      const wrapper = await mountDashboard();
      
      // 应该显示默认数据
      expect(wrapper.text()).toContain('用户总数');
      expect(wrapper.text()).toContain('资源总数');
    });
  });

  describe('13.2 快捷操作区域测试', () => {
    it('应显示快捷操作区域', async () => {
      const wrapper = await mountDashboard();
      
      expect(wrapper.find('.dashboard-actions').exists()).toBe(true);
      expect(wrapper.text()).toContain('快捷操作');
    });

    it('应显示内容审核快捷入口', async () => {
      const wrapper = await mountDashboard();
      
      const actionItems = wrapper.findAll('.action-item');
      const auditAction = actionItems.find(item => item.text().includes('内容审核'));
      
      expect(auditAction).toBeDefined();
      expect(auditAction?.find('.action-icon').exists()).toBe(true);
      expect(auditAction?.find('.action-label').text()).toBe('内容审核');
    });

    it('应显示内容审核待处理数量徽章', async () => {
      const wrapper = await mountDashboard();
      
      const actionItems = wrapper.findAll('.action-item');
      const auditAction = actionItems.find(item => item.text().includes('内容审核'));
      
      const badge = auditAction?.find('.action-badge');
      expect(badge?.exists()).toBe(true);
      expect(badge?.text()).toBe('23');
    });

    it('待审核数量为0时不应显示徽章', async () => {
      (getOverview as ReturnType<typeof vi.fn>).mockResolvedValue({
        code: 200,
        msg: 'success',
        data: {
          ...mockOverviewData.data,
          pendingAudit: 0
        }
      });
      
      const wrapper = await mountDashboard();
      
      const actionItems = wrapper.findAll('.action-item');
      const auditAction = actionItems.find(item => item.text().includes('内容审核'));
      
      expect(auditAction?.find('.action-badge').exists()).toBe(false);
    });

    it('应显示用户管理快捷入口', async () => {
      const wrapper = await mountDashboard();
      
      const actionItems = wrapper.findAll('.action-item');
      const userAction = actionItems.find(item => item.text().includes('用户管理'));
      
      expect(userAction).toBeDefined();
      expect(userAction?.find('.action-icon').exists()).toBe(true);
      expect(userAction?.find('.action-label').text()).toBe('用户管理');
    });

    it('应显示资源管理快捷入口', async () => {
      const wrapper = await mountDashboard();
      
      const actionItems = wrapper.findAll('.action-item');
      const resourceAction = actionItems.find(item => item.text().includes('资源管理'));
      
      expect(resourceAction).toBeDefined();
      expect(resourceAction?.find('.action-icon').exists()).toBe(true);
      expect(resourceAction?.find('.action-label').text()).toBe('资源管理');
    });

    it('应显示系统设置快捷入口', async () => {
      const wrapper = await mountDashboard();
      
      const actionItems = wrapper.findAll('.action-item');
      const settingsAction = actionItems.find(item => item.text().includes('系统设置'));
      
      expect(settingsAction).toBeDefined();
      expect(settingsAction?.find('.action-icon').exists()).toBe(true);
      expect(settingsAction?.find('.action-label').text()).toBe('系统设置');
    });

    it('点击内容审核应跳转到审核页面', async () => {
      const wrapper = await mountDashboard();
      const pushSpy = vi.spyOn(router, 'push');
      
      const actionItems = wrapper.findAll('.action-item');
      const auditAction = actionItems.find(item => item.text().includes('内容审核'));
      
      await auditAction?.trigger('click');
      
      expect(pushSpy).toHaveBeenCalledWith('/admin/audit');
    });

    it('点击用户管理应跳转到用户管理页面', async () => {
      const wrapper = await mountDashboard();
      const pushSpy = vi.spyOn(router, 'push');
      
      const actionItems = wrapper.findAll('.action-item');
      const userAction = actionItems.find(item => item.text().includes('用户管理'));
      
      await userAction?.trigger('click');
      
      expect(pushSpy).toHaveBeenCalledWith('/admin/users');
    });

    it('点击资源管理应跳转到资源管理页面', async () => {
      const wrapper = await mountDashboard();
      const pushSpy = vi.spyOn(router, 'push');
      
      const actionItems = wrapper.findAll('.action-item');
      const resourceAction = actionItems.find(item => item.text().includes('资源管理'));
      
      await resourceAction?.trigger('click');
      
      expect(pushSpy).toHaveBeenCalledWith('/admin/resources');
    });

    it('点击系统设置应跳转到系统设置页面', async () => {
      const wrapper = await mountDashboard();
      const pushSpy = vi.spyOn(router, 'push');
      
      const actionItems = wrapper.findAll('.action-item');
      const settingsAction = actionItems.find(item => item.text().includes('系统设置'));
      
      await settingsAction?.trigger('click');
      
      expect(pushSpy).toHaveBeenCalledWith('/admin/settings');
    });

    it('快捷操作项应有4个', async () => {
      const wrapper = await mountDashboard();
      
      const actionItems = wrapper.findAll('.action-item');
      expect(actionItems.length).toBe(4);
    });

    it('快捷操作项应有交互样式类', async () => {
      const wrapper = await mountDashboard();
      
      const actionItems = wrapper.findAll('.action-item');
      actionItems.forEach(item => {
        expect(item.classes()).toContain('admin-card-interactive');
      });
    });
  });

  describe('API接口格式验证', () => {
    it('getOverview接口应返回正确格式', async () => {
      await mountDashboard();
      
      expect(getOverview).toHaveBeenCalled();
      
      const result = await (getOverview as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('totalUsers');
      expect(result.data).toHaveProperty('totalResources');
      expect(result.data).toHaveProperty('todayDownloads');
      expect(result.data).toHaveProperty('vipUsers');
      expect(result.data).toHaveProperty('pendingAudit');
    });

    it('getUserGrowth接口应返回正确格式', async () => {
      await mountDashboard();
      
      expect(getUserGrowth).toHaveBeenCalled();
      
      const result = await (getUserGrowth as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      if (result.data.length > 0) {
        expect(result.data[0]).toHaveProperty('date');
        expect(result.data[0]).toHaveProperty('newUsers');
      }
    });

    it('getResourceGrowth接口应返回正确格式', async () => {
      await mountDashboard();
      
      expect(getResourceGrowth).toHaveBeenCalled();
      
      const result = await (getResourceGrowth as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('getDownloadStats接口应返回正确格式', async () => {
      await mountDashboard();
      
      expect(getDownloadStats).toHaveBeenCalled();
      
      const result = await (getDownloadStats as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('getHotCategories接口应返回正确格式', async () => {
      await mountDashboard();
      
      expect(getHotCategories).toHaveBeenCalled();
      
      const result = await (getHotCategories as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      if (result.data.length > 0) {
        expect(result.data[0]).toHaveProperty('categoryName');
        expect(result.data[0]).toHaveProperty('resourceCount');
      }
    });
  });

  describe('响应式布局测试', () => {
    it('统计卡片应使用网格布局', async () => {
      const wrapper = await mountDashboard();
      
      const statsGrid = wrapper.find('.dashboard-stats');
      expect(statsGrid.exists()).toBe(true);
    });

    it('图表区域应使用网格布局', async () => {
      const wrapper = await mountDashboard();
      
      const chartRows = wrapper.findAll('.chart-row');
      expect(chartRows.length).toBe(2);
    });

    it('快捷操作应使用网格布局', async () => {
      const wrapper = await mountDashboard();
      
      const actionGrid = wrapper.find('.action-grid');
      expect(actionGrid.exists()).toBe(true);
    });
  });

  describe('动画效果测试', () => {
    it('统计卡片应有淡入动画类', async () => {
      const wrapper = await mountDashboard();
      
      const statCards = wrapper.findAll('.admin-stat-card');
      statCards.forEach(card => {
        expect(card.classes()).toContain('admin-fade-in');
      });
    });

    it('统计卡片应有递增的动画延迟', async () => {
      const wrapper = await mountDashboard();
      
      const statCards = wrapper.findAll('.admin-stat-card');
      expect(statCards[0].attributes('style')).toContain('animation-delay: 0s');
      expect(statCards[1].attributes('style')).toContain('animation-delay: 0.1s');
      expect(statCards[2].attributes('style')).toContain('animation-delay: 0.2s');
      expect(statCards[3].attributes('style')).toContain('animation-delay: 0.3s');
    });
  });
});
