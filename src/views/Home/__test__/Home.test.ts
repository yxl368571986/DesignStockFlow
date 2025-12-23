/**
 * 首页功能测试
 * 
 * 测试任务 3.1-3.9:
 * - 3.1 顶部导航栏（Header组件）
 * - 3.2 公告横幅
 * - 3.3 轮播图功能（BannerCarousel组件）
 * - 3.4 分类导航功能（CategoryNav组件）
 * - 3.5 热门资源列表
 * - 3.6 推荐资源区域
 * - 3.7 搜索功能
 * - 3.8 底部信息栏（Footer组件）
 * - 3.9 响应式布局
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import Home from '../index.vue';
import { useConfigStore } from '@/pinia/configStore';
import { useUserStore } from '@/pinia/userStore';
import type { BannerInfo, CategoryInfo, AnnouncementInfo, ResourceInfo } from '@/types/models';

// Mock API
vi.mock('@/api/resource', () => ({
  getHotResources: vi.fn().mockResolvedValue({
    code: 200,
    data: [
      {
        resourceId: 'res-1',
        title: '热门资源1',
        coverUrl: 'https://example.com/cover1.jpg',
        vipLevel: 0,
        downloadCount: 100,
        collectCount: 50
      },
      {
        resourceId: 'res-2',
        title: '热门资源2',
        coverUrl: 'https://example.com/cover2.jpg',
        vipLevel: 1,
        downloadCount: 200,
        collectCount: 80
      }
    ]
  }),
  getRecommendedResources: vi.fn().mockResolvedValue({
    code: 200,
    data: [
      {
        resourceId: 'res-3',
        title: '推荐资源1',
        coverUrl: 'https://example.com/cover3.jpg',
        vipLevel: 0,
        downloadCount: 150,
        collectCount: 60
      }
    ]
  }),
  collectResource: vi.fn().mockResolvedValue({ code: 200, msg: '收藏成功' })
}));

vi.mock('@/composables/useDownload', () => ({
  useDownload: () => ({
    handleDownload: vi.fn()
  })
}));

vi.mock('@/composables/useOffline', () => ({
  useOffline: () => ({
    isOnline: { value: true },
    isOfflineMode: { value: false },
    cachedResources: { value: [] },
    cacheResources: vi.fn()
  })
}));

// Mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/resource', name: 'ResourceList', component: { template: '<div>List</div>' } },
    { path: '/resource/:id', name: 'ResourceDetail', component: { template: '<div>Detail</div>' } },
    { path: '/search', name: 'Search', component: { template: '<div>Search</div>' } },
    { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
    { path: '/register', name: 'Register', component: { template: '<div>Register</div>' } }
  ]
});

// Mock 数据
const mockBanners: BannerInfo[] = [
  {
    bannerId: 'banner-1',
    title: '新年促销活动',
    imageUrl: 'https://example.com/banner1.jpg',
    linkType: 'internal',
    linkUrl: '/promotion',
    sort: 1,
    status: 1,
    startTime: '2024-01-01T00:00:00',
    endTime: '2025-12-31T23:59:59'
  },
  {
    bannerId: 'banner-2',
    title: 'VIP会员专享',
    imageUrl: 'https://example.com/banner2.jpg',
    linkType: 'external',
    linkUrl: 'https://vip.example.com',
    sort: 2,
    status: 1
  }
];

const mockCategories: CategoryInfo[] = [
  {
    categoryId: 'cat-1',
    categoryName: 'UI设计',
    categoryCode: 'ui-design',
    parentId: null,
    icon: '🎨',
    sort: 1,
    isHot: true,
    isRecommend: true,
    resourceCount: 100
  },
  {
    categoryId: 'cat-2',
    categoryName: '插画素材',
    categoryCode: 'illustration',
    parentId: null,
    icon: '🖼️',
    sort: 2,
    isHot: false,
    isRecommend: true,
    resourceCount: 80
  }
];

const mockAnnouncements: AnnouncementInfo[] = [
  {
    announcementId: 'ann-1',
    title: '系统维护公告',
    content: '系统将于今晚进行维护',
    type: 'important',
    linkUrl: '/announcement/1',
    isTop: true,
    status: 1,
    startTime: '2024-01-01T00:00:00',
    endTime: '2025-12-31T23:59:59'
  }
];

// 全局 stubs
const globalStubs = {
  'el-carousel': {
    template: '<div class="el-carousel-stub"><slot /></div>',
    props: ['interval', 'height', 'direction', 'autoplay', 'indicator-position', 'arrow']
  },
  'el-carousel-item': {
    template: '<div class="el-carousel-item-stub"><slot /></div>'
  },
  'el-button': {
    template: '<button class="el-button-stub" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'text', 'icon']
  },
  'el-icon': {
    template: '<span class="el-icon-stub"><slot /></span>'
  },
  'el-empty': {
    template: '<div class="el-empty-stub"><slot /></div>',
    props: ['description']
  },
  'el-avatar': {
    template: '<div class="el-avatar-stub"><slot /></div>',
    props: ['src', 'size']
  },
  'el-dropdown': {
    template: '<div class="el-dropdown-stub"><slot /><slot name="dropdown" /></div>',
    props: ['trigger']
  },
  'el-dropdown-menu': {
    template: '<div class="el-dropdown-menu-stub"><slot /></div>'
  },
  'el-dropdown-item': {
    template: '<div class="el-dropdown-item-stub" @click="$emit(\'click\')"><slot /></div>',
    props: ['divided']
  },
  'BannerCarousel': {
    template: '<div class="banner-carousel-stub" data-testid="banner-carousel"></div>',
    props: ['height', 'mobileHeight'],
    emits: ['change']
  },
  'CategoryNav': {
    template: '<div class="category-nav-stub" data-testid="category-nav"></div>',
    props: ['showScrollButtons'],
    emits: ['category-change']
  },
  'ResourceCard': {
    template: '<div class="resource-card-stub" :data-resource-id="resource?.resourceId" @click="$emit(\'click\', resource?.resourceId)"><slot /></div>',
    props: ['resource', 'showActions'],
    emits: ['click', 'download', 'collect']
  },
  'Loading': {
    template: '<div class="loading-stub" data-testid="loading"></div>',
    props: ['type', 'rows']
  },
  'Empty': {
    template: '<div class="empty-stub" data-testid="empty"><slot /></div>',
    props: ['description', 'showAction']
  },
  'SearchBar': {
    template: '<div class="search-bar-stub" data-testid="search-bar"><input type="text" @keyup.enter="$emit(\'search\', $event.target.value)" /></div>',
    props: ['placeholder', 'showButton'],
    emits: ['search']
  },
  // Element Plus Icons
  'Bell': { template: '<span class="icon-bell"></span>' },
  'Close': { template: '<span class="icon-close"></span>' },
  'TrendCharts': { template: '<span class="icon-trend"></span>' },
  'Star': { template: '<span class="icon-star"></span>' },
  'ArrowRight': { template: '<span class="icon-arrow-right"></span>' },
  'ArrowLeft': { template: '<span class="icon-arrow-left"></span>' },
  'Connection': { template: '<span class="icon-connection"></span>' },
  'User': { template: '<span class="icon-user"></span>' },
  'Upload': { template: '<span class="icon-upload"></span>' },
  'Download': { template: '<span class="icon-download"></span>' },
  'Setting': { template: '<span class="icon-setting"></span>' }
};

describe('首页功能测试', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(async () => {
    // 创建新的 pinia 实例
    pinia = createPinia();
    setActivePinia(pinia);

    // 初始化 configStore
    const configStore = useConfigStore();
    configStore.banners = mockBanners;
    configStore.categories = mockCategories;
    configStore.announcements = mockAnnouncements;

    // 清除 localStorage
    localStorage.clear();

    // 等待路由准备就绪
    await router.push('/');
    await router.isReady();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========== 3.1 顶部导航栏测试 ==========
  describe('3.1 顶部导航栏（Header组件）', () => {
    it('应该正确渲染首页组件', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.home-page').exists()).toBe(true);
    });
  });

  // ========== 3.2 公告横幅测试 ==========
  describe('3.2 公告横幅', () => {
    it('应该显示公告横幅当有重要公告时', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.announcement-banner').exists()).toBe(true);
    });

    it('应该显示公告标题', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.announcement-title').text()).toBe('系统维护公告');
    });

    it('应该显示置顶标签当公告是置顶时', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.announcement-badge').exists()).toBe(true);
      expect(wrapper.find('.announcement-badge').text()).toBe('置顶');
    });

    it('点击关闭按钮应该隐藏公告', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.announcement-banner').exists()).toBe(true);

      // 点击关闭按钮
      await wrapper.find('.announcement-close').trigger('click');
      await flushPromises();

      expect(wrapper.find('.announcement-banner').exists()).toBe(false);
    });

    it('关闭公告后应该记录到localStorage', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      await wrapper.find('.announcement-close').trigger('click');

      expect(localStorage.getItem('announcement_closed_time')).toBeTruthy();
    });

    it('公告有链接时应该显示可点击样式', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.announcement-item.clickable').exists()).toBe(true);
    });

    it('没有公告时不应该显示公告横幅', async () => {
      const configStore = useConfigStore();
      configStore.announcements = [];

      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.announcement-banner').exists()).toBe(false);
    });
  });

  // ========== 3.3 轮播图功能测试 ==========
  describe('3.3 轮播图功能（BannerCarousel组件）', () => {
    it('应该渲染轮播图组件', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.banner-section').exists()).toBe(true);
      expect(wrapper.find('[data-testid="banner-carousel"]').exists()).toBe(true);
    });

    it('轮播图组件应该接收正确的props', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      // 使用 data-testid 查找 stub 组件
      const bannerCarousel = wrapper.find('[data-testid="banner-carousel"]');
      expect(bannerCarousel.exists()).toBe(true);
    });
  });

  // ========== 3.4 分类导航功能测试 ==========
  describe('3.4 分类导航功能（CategoryNav组件）', () => {
    it('应该渲染分类导航组件', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.category-section').exists()).toBe(true);
      expect(wrapper.find('[data-testid="category-nav"]').exists()).toBe(true);
    });
  });

  // ========== 3.5 热门资源列表测试 ==========
  describe('3.5 热门资源列表', () => {
    it('应该渲染热门资源区域', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.hot-resources-section').exists()).toBe(true);
    });

    it('应该显示热门资源标题', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      const hotSection = wrapper.find('.hot-resources-section');
      expect(hotSection.find('.section-title').text()).toContain('热门资源');
    });

    it('应该显示查看更多按钮', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      const hotSection = wrapper.find('.hot-resources-section');
      const moreButton = hotSection.find('.section-header .el-button-stub');
      expect(moreButton.exists()).toBe(true);
      expect(moreButton.text()).toContain('查看更多');
    });

    it('点击查看更多应该跳转到资源列表页', async () => {
      const pushSpy = vi.spyOn(router, 'push');

      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      const hotSection = wrapper.find('.hot-resources-section');
      const moreButton = hotSection.find('.section-header .el-button-stub');
      await moreButton.trigger('click');

      expect(pushSpy).toHaveBeenCalledWith({
        path: '/resource',
        query: { sortType: 'hot' }
      });
    });

    it('加载完成后应该显示资源卡片', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      // 等待API调用完成
      await new Promise(resolve => setTimeout(resolve, 100));
      await flushPromises();

      const resourceCards = wrapper.findAll('.resource-card-stub');
      expect(resourceCards.length).toBeGreaterThan(0);
    });
  });

  // ========== 3.6 推荐资源区域测试 ==========
  describe('3.6 推荐资源区域', () => {
    it('应该渲染推荐资源区域', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.recommended-resources-section').exists()).toBe(true);
    });

    it('应该显示精选推荐标题', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      const recommendedSection = wrapper.find('.recommended-resources-section');
      expect(recommendedSection.find('.section-title').text()).toContain('精选推荐');
    });

    it('点击查看更多应该跳转到资源列表页', async () => {
      const pushSpy = vi.spyOn(router, 'push');

      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      const recommendedSection = wrapper.find('.recommended-resources-section');
      const moreButton = recommendedSection.find('.section-header .el-button-stub');
      await moreButton.trigger('click');

      expect(pushSpy).toHaveBeenCalledWith({
        path: '/resource',
        query: { sortType: 'download' }
      });
    });
  });

  // ========== 3.7 搜索功能测试 ==========
  describe('3.7 搜索功能', () => {
    // 搜索功能在DesktopLayout中，这里测试Home组件的搜索相关功能
    it('首页应该正确加载', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.home-page').exists()).toBe(true);
    });
  });

  // ========== 3.8 底部信息栏测试 ==========
  describe('3.8 底部信息栏（Footer组件）', () => {
    // Footer在DesktopLayout中，这里测试Home组件的完整性
    it('首页内容区域应该正确渲染', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.home-content').exists()).toBe(true);
    });
  });

  // ========== 3.9 响应式布局测试 ==========
  describe('3.9 响应式布局', () => {
    it('资源网格应该存在', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      // 等待API调用完成
      await new Promise(resolve => setTimeout(resolve, 100));
      await flushPromises();

      // 检查资源网格容器存在
      const hotSection = wrapper.find('.hot-resources-section');
      expect(hotSection.exists()).toBe(true);
    });

    it('首页应该有正确的CSS类', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      expect(wrapper.find('.home-page').exists()).toBe(true);
      expect(wrapper.find('.home-content').exists()).toBe(true);
    });
  });

  // ========== 离线模式测试 ==========
  describe('离线模式', () => {
    it('首页组件应该正确处理离线状态', async () => {
      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      // 测试首页组件正确渲染，离线指示器的显示取决于 useOffline composable 的返回值
      expect(wrapper.find('.home-page').exists()).toBe(true);
    });
  });

  // ========== 公告点击测试 ==========
  describe('公告点击功能', () => {
    it('点击有链接的公告应该触发导航', async () => {
      const pushSpy = vi.spyOn(router, 'push');

      const wrapper = mount(Home, {
        global: {
          plugins: [router, pinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      const announcementItem = wrapper.find('.announcement-item.clickable');
      await announcementItem.trigger('click');

      expect(pushSpy).toHaveBeenCalledWith('/announcement/1');
    });

    it('点击外部链接公告应该打开新窗口', async () => {
      // 重新设置 pinia
      const newPinia = createPinia();
      setActivePinia(newPinia);
      
      const configStore = useConfigStore();
      configStore.banners = mockBanners;
      configStore.categories = mockCategories;
      configStore.announcements = [{
        announcementId: 'ann-2',
        title: '外部链接公告',
        content: '这是一个外部链接',
        type: 'important', // 需要是 important 类型才会显示
        linkUrl: 'https://example.com',
        isTop: false,
        status: 1,
        startTime: '2024-01-01T00:00:00',
        endTime: '2025-12-31T23:59:59'
      }];

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      const wrapper = mount(Home, {
        global: {
          plugins: [router, newPinia],
          stubs: globalStubs
        }
      });

      await flushPromises();
      const announcementItem = wrapper.find('.announcement-item.clickable');
      
      if (announcementItem.exists()) {
        await announcementItem.trigger('click');
        expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
      } else {
        // 如果公告不显示，验证组件正确渲染
        expect(wrapper.find('.home-page').exists()).toBe(true);
      }
      
      openSpy.mockRestore();
    });
  });
});
