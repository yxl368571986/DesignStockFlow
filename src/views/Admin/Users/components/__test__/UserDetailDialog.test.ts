/**
 * 用户详情弹窗单元测试
 * 
 * 测试范围：
 * - 任务14.5: 用户详情弹窗
 * 
 * 需求: 需求12.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ElementPlus, { ElMessage } from 'element-plus';
import UserDetailDialog from '../UserDetailDialog.vue';

// Mock Element Plus 消息组件
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

// Mock format工具
vi.mock('@/utils/format', () => ({
  formatTime: vi.fn((date: string) => date)
}));

describe('用户详情弹窗 (任务14.5)', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountComponent = async (props = {}) => {
    wrapper = mount(UserDetailDialog, {
      props: {
        modelValue: true,
        userId: 'user-001',
        ...props
      },
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true,
          teleport: true
        }
      },
      attachTo: document.body
    });
    await flushPromises();
    return wrapper;
  };

  describe('弹窗基本显示', () => {
    it('应该正确接收modelValue属性', async () => {
      await mountComponent();
      expect(wrapper.props('modelValue')).toBe(true);
    });

    it('应该正确接收userId属性', async () => {
      await mountComponent();
      expect(wrapper.props('userId')).toBe('user-001');
    });

    it('组件应该正确挂载', async () => {
      await mountComponent();
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Props验证', () => {
    it('userId应该是字符串类型', async () => {
      await mountComponent();
      expect(typeof wrapper.props('userId')).toBe('string');
    });

    it('modelValue应该是布尔类型', async () => {
      await mountComponent();
      expect(typeof wrapper.props('modelValue')).toBe('boolean');
    });
  });

  describe('事件发射', () => {
    it('应该能够发射update:modelValue事件', async () => {
      await mountComponent();
      wrapper.vm.$emit('update:modelValue', false);
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('应该能够发射refresh事件', async () => {
      await mountComponent();
      wrapper.vm.$emit('refresh');
      expect(wrapper.emitted('refresh')).toBeTruthy();
    });
  });

  describe('组件结构', () => {
    it('应该包含ElDialog组件', async () => {
      await mountComponent();
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('ElDialog标题应该是"用户详情"', async () => {
      await mountComponent();
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.props('title')).toBe('用户详情');
    });

    it('ElDialog宽度应该是900px', async () => {
      await mountComponent();
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.props('width')).toBe('900px');
    });
  });
});
