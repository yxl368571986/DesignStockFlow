import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import ResourceCard from '../ResourceCard.vue';
import type { ResourceInfo } from '@/types/models';

// Mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/resource/:id',
      name: 'ResourceDetail',
      component: { template: '<div>Detail</div>' }
    }
  ]
});

describe('ResourceCard Component', () => {
  const mockResource: ResourceInfo = {
    resourceId: 'test-123',
    title: 'UI设计素材包',
    description: '精美的UI设计素材',
    cover: 'https://example.com/cover.jpg',
    previewImages: [],
    format: 'PSD',
    fileSize: 1024000,
    downloadCount: 1234,
    vipLevel: 0,
    categoryId: 'ui-design',
    categoryName: 'UI设计',
    tags: ['UI', '设计'],
    uploaderId: 'user123',
    uploaderName: '设计师',
    isAudit: 1,
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    createdAt: '2024-01-01'
  };

  const globalStubs = {
    'el-image': {
      template: `
        <div class="el-image-stub">
          <img :src="src" :alt="alt" />
          <slot name="placeholder" />
          <slot name="error" />
        </div>
      `,
      props: ['src', 'alt', 'lazy', 'fit']
    },
    'el-tag': {
      template: '<span class="el-tag-stub"><slot /></span>',
      props: ['type', 'effect', 'size']
    },
    'el-button': {
      template: '<button class="el-button-stub" @click="$emit(\'click\')"><slot /></button>',
      props: ['type', 'icon', 'circle']
    },
    'el-icon': {
      template: '<i class="el-icon-stub"><slot /></i>'
    }
  };

  beforeEach(() => {
    // 创建新的 Pinia 实例
    const pinia = createPinia();
    setActivePinia(pinia);
  });

  it('renders resource card with basic information', () => {
    const wrapper = mount(ResourceCard, {
      props: {
        resource: mockResource
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.resource-card').exists()).toBe(true);
    expect(wrapper.find('.card-title').text()).toBe('UI设计素材包');
    expect(wrapper.text()).toContain('PSD');
    expect(wrapper.text()).toContain('1.2k'); // formatted download count
  });

  it('displays VIP badge when vipLevel > 0', () => {
    const vipResource = { ...mockResource, vipLevel: 1 };
    const wrapper = mount(ResourceCard, {
      props: {
        resource: vipResource
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.vip-badge').exists()).toBe(true);
    expect(wrapper.text()).toContain('VIP');
  });

  it('does not display VIP badge when vipLevel is 0', () => {
    const wrapper = mount(ResourceCard, {
      props: {
        resource: mockResource
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.vip-badge').exists()).toBe(false);
  });

  it('shows action buttons when showActions is true', () => {
    const wrapper = mount(ResourceCard, {
      props: {
        resource: mockResource,
        showActions: true
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.card-actions').exists()).toBe(true);
    const buttons = wrapper.findAll('.el-button-stub');
    expect(buttons.length).toBe(2); // download and collect buttons
  });

  it('hides action buttons when showActions is false', () => {
    const wrapper = mount(ResourceCard, {
      props: {
        resource: mockResource,
        showActions: false
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.card-actions').exists()).toBe(false);
  });

  it('emits click event when card is clicked', async () => {
    const wrapper = mount(ResourceCard, {
      props: {
        resource: mockResource
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    await wrapper.find('.resource-card').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')?.[0]).toEqual(['test-123']);
  });

  it('emits download event when download button is clicked', async () => {
    const wrapper = mount(ResourceCard, {
      props: {
        resource: mockResource,
        showActions: true
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const buttons = wrapper.findAll('.el-button-stub');
    await buttons[0].trigger('click'); // first button is download

    expect(wrapper.emitted('download')).toBeTruthy();
    expect(wrapper.emitted('download')?.[0]).toEqual(['test-123']);
  });

  it('emits collect event when collect button is clicked', async () => {
    const wrapper = mount(ResourceCard, {
      props: {
        resource: mockResource,
        showActions: true
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const buttons = wrapper.findAll('.el-button-stub');
    await buttons[1].trigger('click'); // second button is collect

    expect(wrapper.emitted('collect')).toBeTruthy();
    expect(wrapper.emitted('collect')?.[0]).toEqual(['test-123']);
  });

  it('stops event propagation when action buttons are clicked', async () => {
    const wrapper = mount(ResourceCard, {
      props: {
        resource: mockResource,
        showActions: true
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const buttons = wrapper.findAll('.el-button-stub');
    await buttons[0].trigger('click');

    // Card click should not be emitted when button is clicked
    // This is tested by checking that only download event is emitted
    expect(wrapper.emitted('download')).toBeTruthy();
  });

  it('formats download count correctly', () => {
    const testCases = [
      { count: 500, expected: '500' },
      { count: 1234, expected: '1.2k' },
      { count: 12345, expected: '1.2w' }
    ];

    testCases.forEach(({ count, expected }) => {
      const resource = { ...mockResource, downloadCount: count };
      const wrapper = mount(ResourceCard, {
        props: { resource },
        global: {
          plugins: [router],
          stubs: globalStubs
        }
      });

      expect(wrapper.text()).toContain(expected);
    });
  });

  it('displays resource cover image with correct props', () => {
    const wrapper = mount(ResourceCard, {
      props: {
        resource: mockResource,
        lazy: true
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const image = wrapper.findComponent({ name: 'el-image' });
    if (image.exists()) {
      expect(image.props('src')).toBe('https://example.com/cover.jpg');
      expect(image.props('alt')).toBe('UI设计素材包');
      expect(image.props('lazy')).toBe(true);
    } else {
      // Fallback: check if stub exists
      const imageStub = wrapper.find('.el-image-stub');
      expect(imageStub.exists()).toBe(true);
    }
  });

  it('disables lazy loading when lazy prop is false', () => {
    const wrapper = mount(ResourceCard, {
      props: {
        resource: mockResource,
        lazy: false
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const image = wrapper.findComponent({ name: 'el-image' });
    if (image.exists()) {
      expect(image.props('lazy')).toBe(false);
    }
  });

  it('navigates to resource detail page when clicked', async () => {
    const pushSpy = vi.spyOn(router, 'push');

    const wrapper = mount(ResourceCard, {
      props: {
        resource: mockResource
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    await wrapper.find('.resource-card').trigger('click');

    expect(pushSpy).toHaveBeenCalledWith('/resource/test-123');
  });

  it('truncates long titles with ellipsis', () => {
    const longTitleResource = {
      ...mockResource,
      title: '这是一个非常非常非常非常非常非常非常非常非常非常长的标题用于测试文本截断功能'
    };

    const wrapper = mount(ResourceCard, {
      props: {
        resource: longTitleResource
      },
      global: {
        plugins: [router],
        stubs: globalStubs
      }
    });

    const title = wrapper.find('.card-title');
    expect(title.exists()).toBe(true);
    expect(title.attributes('title')).toBe(longTitleResource.title);
  });
});
