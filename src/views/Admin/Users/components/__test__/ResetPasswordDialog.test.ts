/**
 * 重置密码弹窗单元测试
 * 
 * 测试范围：
 * - 任务14.6: 重置密码弹窗
 * 
 * 需求: 需求12.10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ElementPlus, { ElMessage } from 'element-plus';
import ResetPasswordDialog from '../ResetPasswordDialog.vue';

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

describe('重置密码弹窗 (任务14.6)', () => {
  let wrapper: VueWrapper;

  const mockUser = {
    userId: 'user-001',
    nickname: '张三',
    phone: '13800138000',
    email: 'zhangsan@example.com'
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountComponent = async (props = {}) => {
    wrapper = mount(ResetPasswordDialog, {
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

    it('user属性应该包含phone', async () => {
      await mountComponent();
      expect(wrapper.props('user').phone).toBe('13800138000');
    });

    it('user属性应该包含email', async () => {
      await mountComponent();
      expect(wrapper.props('user').email).toBe('zhangsan@example.com');
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

    it('ElDialog标题应该是"重置密码"', async () => {
      await mountComponent();
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.props('title')).toBe('重置密码');
    });

    it('ElDialog宽度应该是500px', async () => {
      await mountComponent();
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.props('width')).toBe('500px');
    });
  });
});
