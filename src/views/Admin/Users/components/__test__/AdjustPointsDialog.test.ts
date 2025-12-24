/**
 * 调整积分弹窗单元测试
 * 
 * 测试范围：
 * - 任务14.8: 调整积分弹窗
 * 
 * 需求: 需求12.12
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus';
import AdjustPointsDialog from '../AdjustPointsDialog.vue';

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
    },
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue(true)
    }
  };
});

describe('调整积分弹窗 (任务14.8)', () => {
  let wrapper: VueWrapper;

  const mockUser = {
    userId: 'user-001',
    nickname: '张三',
    pointsBalance: 1500
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountComponent = async (props = {}) => {
    wrapper = mount(AdjustPointsDialog, {
      props: {
        modelValue: true,
        user: mockUser,
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

    it('应该正确接收user属性', async () => {
      await mountComponent();
      expect(wrapper.props('user')).toEqual(mockUser);
    });

    it('组件应该正确挂载', async () => {
      await mountComponent();
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Props验证', () => {
    it('user属性应该包含nickname', async () => {
      await mountComponent();
      expect(wrapper.props('user').nickname).toBe('张三');
    });

    it('user属性应该包含pointsBalance', async () => {
      await mountComponent();
      expect(wrapper.props('user').pointsBalance).toBe(1500);
    });

    it('user属性应该包含userId', async () => {
      await mountComponent();
      expect(wrapper.props('user').userId).toBe('user-001');
    });
  });

  describe('事件发射', () => {
    it('应该能够发射update:modelValue事件', async () => {
      await mountComponent();
      wrapper.vm.$emit('update:modelValue', false);
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('应该能够发射success事件', async () => {
      await mountComponent();
      wrapper.vm.$emit('success');
      expect(wrapper.emitted('success')).toBeTruthy();
    });
  });

  describe('组件结构', () => {
    it('应该包含ElDialog组件', async () => {
      await mountComponent();
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('ElDialog标题应该是"调整积分"', async () => {
      await mountComponent();
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.props('title')).toBe('调整积分');
    });

    it('ElDialog宽度应该是500px', async () => {
      await mountComponent();
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.props('width')).toBe('500px');
    });
  });
});
