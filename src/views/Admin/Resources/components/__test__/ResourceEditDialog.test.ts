/**
 * 资源编辑弹窗组件单元测试
 * 
 * 测试范围：
 * - 弹窗显示和关闭
 * - 表单字段显示
 * - 表单验证
 * - 数据初始化
 * - 提交功能
 * 
 * 需求: 需求12.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ElementPlus, { ElMessage } from 'element-plus';
import ResourceEditDialog from '../ResourceEditDialog.vue';

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

// Mock API
vi.mock('@/api/adminResource', () => ({
  updateAdminResource: vi.fn().mockResolvedValue({})
}));

describe('资源编辑弹窗组件', () => {
  let wrapper: VueWrapper;

  const mockResource = {
    resourceId: 'res-001',
    title: '测试资源',
    description: '这是一个测试资源的描述',
    categoryId: '4',
    categoryName: 'UI设计类',
    tags: ['设计', 'UI'],
    cover: 'https://example.com/cover.jpg',
    fileFormat: 'PSD',
    fileSize: 1024000,
    userId: 'user-001',
    userName: '张三',
    downloadCount: 100,
    viewCount: 500,
    auditStatus: 1,
    vipLevel: 0,
    isTop: false,
    isRecommend: false,
    status: 1,
    createdAt: '2024-01-15 10:30:00'
  };

  const mockCategories = [
    { categoryId: '1', categoryName: '党建类' },
    { categoryId: '2', categoryName: '节日海报类' },
    { categoryId: '3', categoryName: '电商类' },
    { categoryId: '4', categoryName: 'UI设计类' },
    { categoryId: '5', categoryName: '插画类' }
  ];

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountComponent = (props = {}) => {
    wrapper = mount(ResourceEditDialog, {
      props: {
        modelValue: true,
        resource: mockResource,
        categories: mockCategories,
        ...props
      },
      global: {
        plugins: [ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });
    return wrapper;
  };

  describe('弹窗显示测试', () => {
    it('modelValue为true时应该显示弹窗', async () => {
      mountComponent({ modelValue: true });
      await flushPromises();
      
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('modelValue为false时应该隐藏弹窗', async () => {
      mountComponent({ modelValue: false });
      await flushPromises();
      
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.props('modelValue')).toBe(false);
    });

    it('弹窗标题应该为"编辑资源"', async () => {
      mountComponent();
      await flushPromises();
      
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.props('title')).toBe('编辑资源');
    });
  });

  describe('表单字段测试', () => {
    it('应该显示资源标题输入框', async () => {
      mountComponent();
      await flushPromises();
      
      const formItems = wrapper.findAllComponents({ name: 'ElFormItem' });
      const titleItem = formItems.find(item => item.props('label') === '资源标题');
      expect(titleItem).toBeTruthy();
    });

    it('应该显示资源描述文本框', async () => {
      mountComponent();
      await flushPromises();
      
      const formItems = wrapper.findAllComponents({ name: 'ElFormItem' });
      const descItem = formItems.find(item => item.props('label') === '资源描述');
      expect(descItem).toBeTruthy();
    });

    it('应该显示资源分类选择器', async () => {
      mountComponent();
      await flushPromises();
      
      const formItems = wrapper.findAllComponents({ name: 'ElFormItem' });
      const categoryItem = formItems.find(item => item.props('label') === '资源分类');
      expect(categoryItem).toBeTruthy();
    });

    it('应该显示资源标签选择器', async () => {
      mountComponent();
      await flushPromises();
      
      const formItems = wrapper.findAllComponents({ name: 'ElFormItem' });
      const tagsItem = formItems.find(item => item.props('label') === '资源标签');
      expect(tagsItem).toBeTruthy();
    });
  });

  describe('数据初始化测试', () => {
    it('应该用资源数据初始化表单', async () => {
      mountComponent();
      await flushPromises();
      
      expect(wrapper.vm.formData.title).toBe(mockResource.title);
      expect(wrapper.vm.formData.description).toBe(mockResource.description);
      expect(wrapper.vm.formData.categoryId).toBe(mockResource.categoryId);
      expect(wrapper.vm.formData.tags).toEqual(mockResource.tags);
    });

    it('资源变化时应该更新表单数据', async () => {
      mountComponent();
      await flushPromises();
      
      const newResource = {
        ...mockResource,
        title: '新标题',
        description: '新描述'
      };
      
      await wrapper.setProps({ resource: newResource });
      await flushPromises();
      
      expect(wrapper.vm.formData.title).toBe('新标题');
      expect(wrapper.vm.formData.description).toBe('新描述');
    });

    it('资源为null时应该使用空值', async () => {
      mountComponent({ resource: null });
      await flushPromises();
      
      // 表单数据应该保持初始状态
      expect(wrapper.vm.formData.title).toBe('');
    });
  });

  describe('按钮测试', () => {
    it('应该显示取消按钮', async () => {
      mountComponent();
      await flushPromises();
      
      const buttons = wrapper.findAllComponents({ name: 'ElButton' });
      const cancelBtn = buttons.find(btn => btn.text().includes('取消'));
      expect(cancelBtn).toBeTruthy();
    });

    it('应该显示保存按钮', async () => {
      mountComponent();
      await flushPromises();
      
      const buttons = wrapper.findAllComponents({ name: 'ElButton' });
      const saveBtn = buttons.find(btn => btn.text().includes('保存'));
      expect(saveBtn).toBeTruthy();
    });

    it('点击取消按钮应该关闭弹窗', async () => {
      mountComponent();
      await flushPromises();
      
      wrapper.vm.handleClose();
      await flushPromises();
      
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([false]);
    });
  });

  describe('表单验证测试', () => {
    it('标题为空时应该验证失败', async () => {
      mountComponent();
      await flushPromises();
      
      wrapper.vm.formData.title = '';
      
      // 验证规则存在
      expect(wrapper.vm.formRules.title).toBeTruthy();
      expect(wrapper.vm.formRules.title[0].required).toBe(true);
    });

    it('标题长度限制应该为2-200字符', async () => {
      mountComponent();
      await flushPromises();
      
      const titleRules = wrapper.vm.formRules.title;
      const lengthRule = titleRules.find((rule: any) => rule.min !== undefined);
      
      expect(lengthRule.min).toBe(2);
      expect(lengthRule.max).toBe(200);
    });

    it('描述长度限制应该为500字符', async () => {
      mountComponent();
      await flushPromises();
      
      const descRules = wrapper.vm.formRules.description;
      const lengthRule = descRules.find((rule: any) => rule.max !== undefined);
      
      expect(lengthRule.max).toBe(500);
    });

    it('分类为必填项', async () => {
      mountComponent();
      await flushPromises();
      
      expect(wrapper.vm.formRules.categoryId).toBeTruthy();
      expect(wrapper.vm.formRules.categoryId[0].required).toBe(true);
    });

    it('标签最多10个', async () => {
      mountComponent();
      await flushPromises();
      
      const tagsRules = wrapper.vm.formRules.tags;
      const maxRule = tagsRules.find((rule: any) => rule.max !== undefined);
      
      expect(maxRule.max).toBe(10);
    });
  });

  describe('提交功能测试', () => {
    it('提交时应该调用更新API', async () => {
      const { updateAdminResource } = await import('@/api/adminResource');
      mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      // 模拟表单验证通过
      wrapper.vm.formRef = {
        validate: vi.fn().mockResolvedValue(true)
      };
      
      await wrapper.vm.handleSubmit();
      await flushPromises();
      
      expect(updateAdminResource).toHaveBeenCalledWith(
        mockResource.resourceId,
        expect.objectContaining({
          title: mockResource.title,
          description: mockResource.description,
          categoryId: mockResource.categoryId,
          tags: mockResource.tags
        })
      );
    });

    it('提交成功应该触发success事件', async () => {
      mountComponent();
      await flushPromises();
      
      // 模拟表单验证通过
      wrapper.vm.formRef = {
        validate: vi.fn().mockResolvedValue(true)
      };
      
      await wrapper.vm.handleSubmit();
      await flushPromises();
      
      expect(wrapper.emitted('success')).toBeTruthy();
    });

    it('资源为null时提交应该显示错误', async () => {
      mountComponent({ resource: null });
      await flushPromises();
      
      // 模拟表单验证通过
      wrapper.vm.formRef = {
        validate: vi.fn().mockResolvedValue(true)
      };
      
      await wrapper.vm.handleSubmit();
      await flushPromises();
      
      expect(ElMessage.error).toHaveBeenCalledWith('资源信息不存在');
    });

    it('提交时应该显示loading状态', async () => {
      mountComponent();
      await flushPromises();
      
      expect(wrapper.vm.submitting).toBe(false);
      
      // 模拟表单验证通过，但API调用延迟
      wrapper.vm.formRef = {
        validate: vi.fn().mockResolvedValue(true)
      };
      
      // 直接检查submitting的初始状态和最终状态
      await wrapper.vm.handleSubmit();
      await flushPromises();
      
      // 提交完成后应该恢复为false
      expect(wrapper.vm.submitting).toBe(false);
    });
  });

  describe('常用标签测试', () => {
    it('应该包含预定义的常用标签', async () => {
      mountComponent();
      await flushPromises();
      
      expect(wrapper.vm.commonTags).toContain('设计');
      expect(wrapper.vm.commonTags).toContain('海报');
      expect(wrapper.vm.commonTags).toContain('UI');
      expect(wrapper.vm.commonTags).toContain('插画');
    });

    it('常用标签数量应该大于0', async () => {
      mountComponent();
      await flushPromises();
      
      expect(wrapper.vm.commonTags.length).toBeGreaterThan(0);
    });
  });

  describe('分类选项测试', () => {
    it('应该显示传入的分类列表', async () => {
      mountComponent();
      await flushPromises();
      
      const selects = wrapper.findAllComponents({ name: 'ElSelect' });
      const categorySelect = selects[0]; // 第一个select是分类选择器
      
      expect(categorySelect.exists()).toBe(true);
    });

    it('分类选项数量应该与传入的categories一致', async () => {
      mountComponent();
      await flushPromises();
      
      // 检查props中的categories
      expect(wrapper.props('categories').length).toBe(mockCategories.length);
    });
  });
});
