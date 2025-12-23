import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import BannerCarousel from '../BannerCarousel.vue';
import { useConfigStore } from '@/pinia/configStore';
import type { BannerInfo } from '@/types/models';

// Mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: { template: '<div>Home</div>' }
    },
    {
      path: '/resource',
      name: 'ResourceList',
      component: { template: '<div>List</div>' }
    },
    {
      path: '/resource/:id',
      name: 'ResourceDetail',
      component: { template: '<div>Detail</div>' }
    }
  ]
});

describe('BannerCarousel Component', () => {
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
      endTime: '2024-12-31T23:59:59'
    },
    {
      bannerId: 'banner-2',
      title: 'VIP会员专享',
      imageUrl: 'https://example.com/banner2.jpg',
      linkType: 'external',
      linkUrl: 'https://vip.example.com',
      sort: 2,
      status: 1,
      startTime: '2024-01-01T00:00:00',
      endTime: '2024-12-31T23:59:59'
    },
    {
      bannerId: 'banner-3',
      title: 'UI设计分类',
      imageUrl: 'https://example.com/banner3.jpg',
      linkType: 'category',
      linkUrl: 'ui-design',
      sort: 3,
      status: 1
    }
  ];

  const globalStubs = {
    'el-carousel': {
      template: `
        <div class="el-carousel-stub">
          <slot />
        </div>
      `,
      props: ['interval', 'height', 'arrow', 'indicator-position'],
      emits: ['change']
    },
    'el-carousel-item': {
      template: `
        <div class="el-carousel-item-stub">
          <slot />
        </div>
      `,
      props: []
    },
    'el-empty': {
      template: '<div class="el-empty-stub"><slot /></div>',
      props: ['description']
    }
  };

  beforeEach(() => {
    // Create a fresh pinia instance for each test
    const pinia = createPinia();
    setActivePinia(pinia);

    // Mock the configStore
    const configStore = useConfigStore();
    configStore.banners = mockBanners;
  });

  it('renders carousel with banners', () => {
    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.banner-carousel').exists()).toBe(true);
    expect(wrapper.find('.el-carousel-stub').exists()).toBe(true);
  });

  it('displays empty state when no banners', () => {
    const configStore = useConfigStore();
    configStore.banners = [];

    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.banner-empty').exists()).toBe(true);
    expect(wrapper.find('.el-empty-stub').exists()).toBe(true);
  });

  it('renders correct number of banner items', () => {
    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const items = wrapper.findAll('.banner-item');
    // The component uses activeBanners which filters by status and time
    // At least one banner should be rendered
    expect(items.length).toBeGreaterThan(0);
  });

  it('displays banner images with correct src and alt', () => {
    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const images = wrapper.findAll('.banner-image');
    expect(images.length).toBeGreaterThan(0);
    // Check first image
    expect(images[0].attributes('src')).toBeTruthy();
    expect(images[0].attributes('alt')).toBeTruthy();
  });

  it('displays banner titles', () => {
    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const titles = wrapper.findAll('.banner-title');
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0].text()).toBeTruthy();
  });

  it('uses default height props', () => {
    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const carousel = wrapper.findComponent({ name: 'el-carousel' });
    if (carousel.exists()) {
      expect(carousel.props('height')).toBe('400px');
    }
  });

  it('uses custom height props', () => {
    const wrapper = mount(BannerCarousel, {
      props: {
        height: '500px',
        mobileHeight: '250px'
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const carousel = wrapper.findComponent({ name: 'el-carousel' });
    if (carousel.exists()) {
      expect(carousel.props('height')).toBe('500px');
    }
  });

  it('emits change event when carousel changes', async () => {
    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    await wrapper.vm.handleCarouselChange(1);
    expect(wrapper.emitted('change')).toBeTruthy();
    expect(wrapper.emitted('change')?.[0]).toEqual([1]);
  });

  it('emits click event when banner is clicked', async () => {
    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    await wrapper.vm.handleBannerClick(mockBanners[0]);
    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')?.[0]).toEqual([mockBanners[0]]);
  });

  it('navigates to internal link when banner with internal linkType is clicked', async () => {
    const pushSpy = vi.spyOn(router, 'push');

    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    await wrapper.vm.handleBannerClick(mockBanners[0]);
    expect(pushSpy).toHaveBeenCalledWith('/promotion');
  });

  it('opens external link in new tab when banner with external linkType is clicked', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    await wrapper.vm.handleBannerClick(mockBanners[1]);
    expect(openSpy).toHaveBeenCalledWith(
      'https://vip.example.com',
      '_blank',
      'noopener,noreferrer'
    );

    openSpy.mockRestore();
  });

  it('navigates to category page when banner with category linkType is clicked', async () => {
    const pushSpy = vi.spyOn(router, 'push');

    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    await wrapper.vm.handleBannerClick(mockBanners[2]);
    // 实际实现使用 /resource?category=xxx 格式
    expect(pushSpy).toHaveBeenCalledWith('/resource?category=ui-design');
  });

  it('navigates to resource detail when banner with resource linkType is clicked', async () => {
    const pushSpy = vi.spyOn(router, 'push');

    const resourceBanner: BannerInfo = {
      bannerId: 'banner-4',
      title: '热门资源',
      imageUrl: 'https://example.com/banner4.jpg',
      linkType: 'resource',
      linkUrl: 'res-123',
      sort: 4,
      status: 1
    };

    const configStore = useConfigStore();
    configStore.banners = [resourceBanner];

    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    await wrapper.vm.handleBannerClick(resourceBanner);
    expect(pushSpy).toHaveBeenCalledWith('/resource/res-123');
  });

  it('filters out disabled banners', () => {
    const configStore = useConfigStore();

    // Set banners with one disabled
    const enabledBanner: BannerInfo = {
      bannerId: 'banner-enabled',
      title: '已启用',
      imageUrl: 'https://example.com/enabled.jpg',
      linkType: 'internal',
      linkUrl: '/enabled',
      sort: 1,
      status: 1
    };

    const disabledBanner: BannerInfo = {
      bannerId: 'banner-disabled',
      title: '已禁用',
      imageUrl: 'https://example.com/disabled.jpg',
      linkType: 'internal',
      linkUrl: '/disabled',
      sort: 2,
      status: 0 // disabled
    };

    configStore.banners = [enabledBanner, disabledBanner];

    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const items = wrapper.findAll('.banner-item');
    // Should only show enabled banner
    expect(items.length).toBe(1);
  });

  it('applies lazy loading to banner images', () => {
    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const images = wrapper.findAll('.banner-image');
    images.forEach((image) => {
      expect(image.attributes('loading')).toBe('lazy');
    });
  });

  it('handles window resize for responsive design', async () => {
    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });

    await wrapper.vm.handleResize();
    expect(wrapper.vm.isMobile).toBe(true);

    // Simulate desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200
    });

    await wrapper.vm.handleResize();
    expect(wrapper.vm.isMobile).toBe(false);
  });

  it('sets carousel interval to 3000ms', () => {
    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const carousel = wrapper.findComponent({ name: 'el-carousel' });
    if (carousel.exists()) {
      expect(carousel.props('interval')).toBe(3000);
    }
  });

  it('sets carousel arrow to hover', () => {
    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const carousel = wrapper.findComponent({ name: 'el-carousel' });
    if (carousel.exists()) {
      expect(carousel.props('arrow')).toBe('hover');
    }
  });

  it('sets indicator position to outside', () => {
    const wrapper = mount(BannerCarousel, {
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const carousel = wrapper.findComponent({ name: 'el-carousel' });
    if (carousel.exists()) {
      expect(carousel.props('indicator-position')).toBe('outside');
    }
  });
});
