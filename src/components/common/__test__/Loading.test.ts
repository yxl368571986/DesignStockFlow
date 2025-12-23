import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Loading from '../Loading.vue';

describe('Loading Component', () => {
  const globalStubs = {
    'el-skeleton': {
      template: '<div class="el-skeleton-stub"><slot name="template" /></div>',
      props: ['rows', 'animated', 'loading']
    },
    'el-skeleton-item': {
      template: '<div class="el-skeleton-item-stub"></div>',
      props: ['variant']
    }
  };

  it('renders fullscreen loading when fullscreen prop is true', () => {
    const wrapper = mount(Loading, {
      props: {
        fullscreen: true,
        text: '加载中...'
      },
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.loading-fullscreen').exists()).toBe(true);
    expect(wrapper.find('.loading-text').text()).toBe('加载中...');
  });

  it('renders skeleton loading when fullscreen prop is false', () => {
    const wrapper = mount(Loading, {
      props: {
        fullscreen: false,
        rows: 5
      },
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.loading-skeleton').exists()).toBe(true);
  });

  it('renders card skeleton when type is card', () => {
    const wrapper = mount(Loading, {
      props: {
        type: 'card'
      },
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.skeleton-card').exists()).toBe(true);
  });

  it('renders list skeleton when type is list', () => {
    const wrapper = mount(Loading, {
      props: {
        type: 'list',
        rows: 3
      },
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.skeleton-list').exists()).toBe(true);
  });

  it('renders article skeleton when type is article', () => {
    const wrapper = mount(Loading, {
      props: {
        type: 'article'
      },
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.skeleton-article').exists()).toBe(true);
  });

  it('renders default skeleton when type is default', () => {
    const wrapper = mount(Loading, {
      props: {
        type: 'default'
      },
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.skeleton-default').exists()).toBe(true);
  });

  it('displays loading text in skeleton mode when text prop is provided', () => {
    const wrapper = mount(Loading, {
      props: {
        fullscreen: false,
        text: '正在加载数据...'
      },
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.skeleton-loading-text').text()).toBe('正在加载数据...');
  });

  it('does not display loading text when text prop is empty', () => {
    const wrapper = mount(Loading, {
      props: {
        fullscreen: true,
        text: ''
      },
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.find('.loading-text').exists()).toBe(false);
  });
});
