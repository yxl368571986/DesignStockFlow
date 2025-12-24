/**
 * 分类管理页面单元测试
 * 
 * 测试范围：
 * - 页面布局测试 (任务17.1)
 * - 排序模式测试 (任务17.2)
 * - 分类树形表格测试 (任务17.3)
 * - 添加/编辑分类弹窗测试 (任务17.4)
 * - 添加分类功能测试 (任务17.5)
 * - 编辑分类功能测试 (任务17.6)
 * - 删除分类功能测试 (任务17.7)
 * - 分类排序功能测试 (任务17.8)
 * 
 * 需求: 需求14.1-14.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus';
import CategoriesPage from '../index.vue';

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

// Mock Sortable.js
vi.mock('sortablejs', () => ({
  default: {
    create: vi.fn(() => ({
      destroy: vi.fn()
    }))
  }
}));


// Mock API - 使用函数返回mock数据避免hoisting问题
vi.mock('@/api/category', () => ({
  getCategoryTree: vi.fn().mockResolvedValue({
    data: [
      {
        categoryId: 'cat-001',
        categoryName: 'UI设计类',
        categoryCode: 'ui-design',
        parentId: null,
        icon: 'Picture',
        sortOrder: 0,
        isHot: true,
        isRecommend: false,
        resourceCount: 150,
        createdAt: '2024-01-01 10:00:00',
        updatedAt: '2024-01-01 10:00:00',
        children: [
          {
            categoryId: 'cat-001-1',
            categoryName: '网页设计',
            categoryCode: 'web-design',
            parentId: 'cat-001',
            icon: null,
            sortOrder: 0,
            isHot: false,
            isRecommend: true,
            resourceCount: 80,
            createdAt: '2024-01-02 10:00:00',
            updatedAt: '2024-01-02 10:00:00',
            children: []
          }
        ]
      },
      {
        categoryId: 'cat-002',
        categoryName: '插画类',
        categoryCode: 'illustration',
        parentId: null,
        icon: 'Brush',
        sortOrder: 1,
        isHot: false,
        isRecommend: true,
        resourceCount: 200,
        createdAt: '2024-01-05 10:00:00',
        updatedAt: '2024-01-05 10:00:00',
        children: []
      },
      {
        categoryId: 'cat-003',
        categoryName: '空分类',
        categoryCode: 'empty-category',
        parentId: null,
        icon: null,
        sortOrder: 2,
        isHot: false,
        isRecommend: false,
        resourceCount: 0,
        createdAt: '2024-01-10 10:00:00',
        updatedAt: '2024-01-10 10:00:00',
        children: []
      }
    ]
  }),
  createCategory: vi.fn().mockResolvedValue({ data: { categoryId: 'new-cat' } }),
  updateCategory: vi.fn().mockResolvedValue({ data: {} }),
  deleteCategory: vi.fn().mockResolvedValue({ data: {} }),
  updateCategoriesSort: vi.fn().mockResolvedValue({ data: {} })
}));

// 导入mock后的API
import * as categoryApi from '@/api/category';


describe('分类管理页面', () => {
  let wrapper: VueWrapper;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/admin/categories', component: CategoriesPage }
      ]
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountComponent = async () => {
    wrapper = mount(CategoriesPage, {
      global: {
        plugins: [router, ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });
    await flushPromises();
    return wrapper;
  };

  // ==================== 任务17.1 页面布局测试 ====================
  describe('页面布局测试 (任务17.1)', () => {
    it('应该显示页面标题"分类管理"', async () => {
      await mountComponent();
      
      const title = wrapper.find('.page-title');
      expect(title.exists()).toBe(true);
      expect(title.text()).toBe('分类管理');
    });

    it('应该显示页面描述', async () => {
      await mountComponent();
      
      const desc = wrapper.find('.page-desc');
      expect(desc.exists()).toBe(true);
      expect(desc.text()).toContain('管理资源分类');
    });

    it('应该显示"调整排序"按钮', async () => {
      await mountComponent();
      
      const buttons = wrapper.findAll('.el-button');
      const sortButton = buttons.find(btn => btn.text().includes('调整排序'));
      expect(sortButton).toBeDefined();
    });

    it('应该显示"添加一级分类"按钮', async () => {
      await mountComponent();
      
      const buttons = wrapper.findAll('.el-button');
      const addButton = buttons.find(btn => btn.text().includes('添加一级分类'));
      expect(addButton).toBeDefined();
    });

    it('应该显示分类树形表格', async () => {
      await mountComponent();
      
      const table = wrapper.find('.el-table');
      expect(table.exists()).toBe(true);
    });

    it('应该调用API加载分类数据', async () => {
      await mountComponent();
      
      expect(categoryApi.getCategoryTree).toHaveBeenCalled();
    });
  });


  // ==================== 任务17.2 排序模式测试 ====================
  describe('排序模式测试 (任务17.2)', () => {
    it('点击"调整排序"按钮应进入排序模式', async () => {
      await mountComponent();
      
      const sortButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('调整排序'));
      await sortButton?.trigger('click');
      await flushPromises();
      
      // 应该显示排序模式提示
      const alert = wrapper.find('.el-alert');
      expect(alert.exists()).toBe(true);
    });

    it('排序模式下应显示"保存排序"按钮', async () => {
      await mountComponent();
      
      const sortButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('调整排序'));
      await sortButton?.trigger('click');
      await flushPromises();
      
      const saveButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('保存排序'));
      expect(saveButton).toBeDefined();
    });

    it('排序模式下应显示"取消"按钮', async () => {
      await mountComponent();
      
      const sortButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('调整排序'));
      await sortButton?.trigger('click');
      await flushPromises();
      
      const cancelButton = wrapper.findAll('.el-button').find(btn => btn.text() === '取消');
      expect(cancelButton).toBeDefined();
    });

    it('排序模式下表格应添加sort-mode类', async () => {
      await mountComponent();
      
      const sortButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('调整排序'));
      await sortButton?.trigger('click');
      await flushPromises();
      
      const table = wrapper.find('.el-table');
      expect(table.classes()).toContain('sort-mode');
    });

    it('点击"取消"按钮应退出排序模式', async () => {
      await mountComponent();
      
      // 进入排序模式
      const sortButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('调整排序'));
      await sortButton?.trigger('click');
      await flushPromises();
      
      // 点击取消
      const cancelButton = wrapper.findAll('.el-button').find(btn => btn.text() === '取消');
      await cancelButton?.trigger('click');
      await flushPromises();
      
      // 应该退出排序模式
      const table = wrapper.find('.el-table');
      expect(table.classes()).not.toContain('sort-mode');
    });

    it('点击"保存排序"按钮应调用API保存排序', async () => {
      await mountComponent();
      
      // 进入排序模式
      const sortButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('调整排序'));
      await sortButton?.trigger('click');
      await flushPromises();
      
      // 点击保存排序
      const saveButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('保存排序'));
      await saveButton?.trigger('click');
      await flushPromises();
      
      expect(categoryApi.updateCategoriesSort).toHaveBeenCalled();
    });

    it('保存排序成功后应显示成功消息', async () => {
      await mountComponent();
      
      // 进入排序模式
      const sortButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('调整排序'));
      await sortButton?.trigger('click');
      await flushPromises();
      
      // 点击保存排序
      const saveButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('保存排序'));
      await saveButton?.trigger('click');
      await flushPromises();
      
      expect(ElMessage.success).toHaveBeenCalledWith('保存排序成功');
    });
  });


  // ==================== 任务17.3 分类树形表格测试 ====================
  describe('分类树形表格测试 (任务17.3)', () => {
    it('应该显示分类名称列', async () => {
      await mountComponent();
      
      const headers = wrapper.findAll('.el-table__header th');
      const nameHeader = headers.find(h => h.text().includes('分类名称'));
      expect(nameHeader).toBeDefined();
    });

    it('应该显示分类代码列', async () => {
      await mountComponent();
      
      const headers = wrapper.findAll('.el-table__header th');
      const codeHeader = headers.find(h => h.text().includes('分类代码'));
      expect(codeHeader).toBeDefined();
    });

    it('应该显示排序列', async () => {
      await mountComponent();
      
      const headers = wrapper.findAll('.el-table__header th');
      const sortHeader = headers.find(h => h.text().includes('排序'));
      expect(sortHeader).toBeDefined();
    });

    it('应该显示资源数量列', async () => {
      await mountComponent();
      
      const headers = wrapper.findAll('.el-table__header th');
      const countHeader = headers.find(h => h.text().includes('资源数量'));
      expect(countHeader).toBeDefined();
    });

    it('应该显示创建时间列', async () => {
      await mountComponent();
      
      const headers = wrapper.findAll('.el-table__header th');
      const timeHeader = headers.find(h => h.text().includes('创建时间'));
      expect(timeHeader).toBeDefined();
    });

    it('应该显示操作列', async () => {
      await mountComponent();
      
      const headers = wrapper.findAll('.el-table__header th');
      const actionHeader = headers.find(h => h.text().includes('操作'));
      expect(actionHeader).toBeDefined();
    });

    it('热门分类应显示"热门"标签', async () => {
      await mountComponent();
      
      const tags = wrapper.findAll('.el-tag');
      const hotTag = tags.find(tag => tag.text() === '热门');
      expect(hotTag).toBeDefined();
    });

    it('推荐分类应显示"推荐"标签', async () => {
      await mountComponent();
      
      const tags = wrapper.findAll('.el-tag');
      const recommendTag = tags.find(tag => tag.text() === '推荐');
      expect(recommendTag).toBeDefined();
    });

    it('一级分类应显示"添加子分类"按钮', async () => {
      await mountComponent();
      
      const buttons = wrapper.findAll('.el-button');
      const addChildButton = buttons.find(btn => btn.text().includes('添加子分类'));
      expect(addChildButton).toBeDefined();
    });

    it('应该显示"编辑"按钮', async () => {
      await mountComponent();
      
      const buttons = wrapper.findAll('.el-button');
      const editButtons = buttons.filter(btn => btn.text().includes('编辑'));
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('应该显示"删除"按钮', async () => {
      await mountComponent();
      
      const buttons = wrapper.findAll('.el-button');
      const deleteButtons = buttons.filter(btn => btn.text().includes('删除'));
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });


  // ==================== 任务17.4 添加/编辑分类弹窗测试 ====================
  describe('添加/编辑分类弹窗测试 (任务17.4)', () => {
    it('点击"添加一级分类"按钮应打开弹窗', async () => {
      await mountComponent();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const dialog = wrapper.find('.el-dialog');
      expect(dialog.exists()).toBe(true);
    });

    it('添加一级分类弹窗标题应为"添加一级分类"', async () => {
      await mountComponent();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const dialogTitle = wrapper.find('.el-dialog__title');
      expect(dialogTitle.text()).toBe('添加一级分类');
    });

    it('点击"添加子分类"按钮应打开弹窗', async () => {
      await mountComponent();
      
      const addChildButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加子分类'));
      await addChildButton?.trigger('click');
      await flushPromises();
      
      const dialog = wrapper.find('.el-dialog');
      expect(dialog.exists()).toBe(true);
    });

    it('添加子分类弹窗标题应为"添加二级分类"', async () => {
      await mountComponent();
      
      const addChildButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加子分类'));
      await addChildButton?.trigger('click');
      await flushPromises();
      
      const dialogTitle = wrapper.find('.el-dialog__title');
      expect(dialogTitle.text()).toBe('添加二级分类');
    });

    it('弹窗应包含分类名称输入框', async () => {
      await mountComponent();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const formItems = wrapper.findAll('.el-form-item');
      const nameItem = formItems.find(item => item.text().includes('分类名称'));
      expect(nameItem).toBeDefined();
    });

    it('弹窗应包含分类代码输入框', async () => {
      await mountComponent();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const formItems = wrapper.findAll('.el-form-item');
      const codeItem = formItems.find(item => item.text().includes('分类代码'));
      expect(codeItem).toBeDefined();
    });

    it('弹窗应包含图标输入框', async () => {
      await mountComponent();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const formItems = wrapper.findAll('.el-form-item');
      const iconItem = formItems.find(item => item.text().includes('图标'));
      expect(iconItem).toBeDefined();
    });

    it('弹窗应包含排序值输入框', async () => {
      await mountComponent();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const formItems = wrapper.findAll('.el-form-item');
      const sortItem = formItems.find(item => item.text().includes('排序值'));
      expect(sortItem).toBeDefined();
    });

    it('弹窗应包含热门分类开关', async () => {
      await mountComponent();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const formItems = wrapper.findAll('.el-form-item');
      const hotItem = formItems.find(item => item.text().includes('热门分类'));
      expect(hotItem).toBeDefined();
    });

    it('弹窗应包含推荐分类开关', async () => {
      await mountComponent();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const formItems = wrapper.findAll('.el-form-item');
      const recommendItem = formItems.find(item => item.text().includes('推荐分类'));
      expect(recommendItem).toBeDefined();
    });

    it('弹窗应包含取消按钮', async () => {
      await mountComponent();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const dialogButtons = wrapper.find('.el-dialog__footer').findAll('.el-button');
      const cancelButton = dialogButtons.find(btn => btn.text() === '取消');
      expect(cancelButton).toBeDefined();
    });

    it('弹窗应包含确定按钮', async () => {
      await mountComponent();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const dialogButtons = wrapper.find('.el-dialog__footer').findAll('.el-button');
      const confirmButton = dialogButtons.find(btn => btn.text() === '确定');
      expect(confirmButton).toBeDefined();
    });
  });


  // ==================== 任务17.5 添加分类功能测试 ====================
  describe('添加分类功能测试 (任务17.5)', () => {
    it('填写完整信息并提交应调用创建API', async () => {
      await mountComponent();
      
      // 打开添加弹窗
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      // 填写表单
      const inputs = wrapper.findAll('.el-input__inner');
      await inputs[0].setValue('新分类');
      await inputs[1].setValue('new-category');
      await flushPromises();
      
      // 点击确定
      const dialogButtons = wrapper.find('.el-dialog__footer').findAll('.el-button');
      const confirmButton = dialogButtons.find(btn => btn.text() === '确定');
      await confirmButton?.trigger('click');
      await flushPromises();
      
      expect(categoryApi.createCategory).toHaveBeenCalled();
    });

    it('添加成功后应显示成功消息', async () => {
      await mountComponent();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const inputs = wrapper.findAll('.el-input__inner');
      await inputs[0].setValue('新分类');
      await inputs[1].setValue('new-category');
      await flushPromises();
      
      const dialogButtons = wrapper.find('.el-dialog__footer').findAll('.el-button');
      const confirmButton = dialogButtons.find(btn => btn.text() === '确定');
      await confirmButton?.trigger('click');
      await flushPromises();
      
      expect(ElMessage.success).toHaveBeenCalledWith('添加分类成功');
    });

    it('添加成功后应重新加载分类列表', async () => {
      await mountComponent();
      vi.clearAllMocks();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const inputs = wrapper.findAll('.el-input__inner');
      await inputs[0].setValue('新分类');
      await inputs[1].setValue('new-category');
      await flushPromises();
      
      const dialogButtons = wrapper.find('.el-dialog__footer').findAll('.el-button');
      const confirmButton = dialogButtons.find(btn => btn.text() === '确定');
      await confirmButton?.trigger('click');
      await flushPromises();
      
      expect(categoryApi.getCategoryTree).toHaveBeenCalled();
    });

    it('添加失败应显示错误消息', async () => {
      vi.mocked(categoryApi.createCategory).mockRejectedValueOnce(new Error('创建失败'));
      
      await mountComponent();
      
      const addButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('添加一级分类'));
      await addButton?.trigger('click');
      await flushPromises();
      
      const inputs = wrapper.findAll('.el-input__inner');
      await inputs[0].setValue('新分类');
      await inputs[1].setValue('new-category');
      await flushPromises();
      
      const dialogButtons = wrapper.find('.el-dialog__footer').findAll('.el-button');
      const confirmButton = dialogButtons.find(btn => btn.text() === '确定');
      await confirmButton?.trigger('click');
      await flushPromises();
      
      expect(ElMessage.error).toHaveBeenCalled();
    });
  });


  // ==================== 任务17.6 编辑分类功能测试 ====================
  describe('编辑分类功能测试 (任务17.6)', () => {
    it('点击编辑按钮应打开编辑弹窗', async () => {
      await mountComponent();
      
      const editButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('编辑'));
      await editButtons[0]?.trigger('click');
      await flushPromises();
      
      const dialog = wrapper.find('.el-dialog');
      expect(dialog.exists()).toBe(true);
    });

    it('编辑弹窗标题应为"编辑分类"', async () => {
      await mountComponent();
      
      const editButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('编辑'));
      await editButtons[0]?.trigger('click');
      await flushPromises();
      
      const dialogTitle = wrapper.find('.el-dialog__title');
      expect(dialogTitle.text()).toBe('编辑分类');
    });

    it('编辑弹窗应回填当前分类数据', async () => {
      await mountComponent();
      
      const editButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('编辑'));
      await editButtons[0]?.trigger('click');
      await flushPromises();
      
      expect(wrapper.vm.formData.categoryName).toBeTruthy();
    });

    it('修改分类并提交应调用更新API', async () => {
      await mountComponent();
      
      const editButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('编辑'));
      await editButtons[0]?.trigger('click');
      await flushPromises();
      
      const dialogButtons = wrapper.find('.el-dialog__footer').findAll('.el-button');
      const confirmButton = dialogButtons.find(btn => btn.text() === '确定');
      await confirmButton?.trigger('click');
      await flushPromises();
      
      expect(categoryApi.updateCategory).toHaveBeenCalled();
    });

    it('更新成功后应显示成功消息', async () => {
      await mountComponent();
      
      const editButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('编辑'));
      await editButtons[0]?.trigger('click');
      await flushPromises();
      
      const dialogButtons = wrapper.find('.el-dialog__footer').findAll('.el-button');
      const confirmButton = dialogButtons.find(btn => btn.text() === '确定');
      await confirmButton?.trigger('click');
      await flushPromises();
      
      expect(ElMessage.success).toHaveBeenCalledWith('更新分类成功');
    });

    it('更新失败应显示错误消息', async () => {
      vi.mocked(categoryApi.updateCategory).mockRejectedValueOnce(new Error('更新失败'));
      
      await mountComponent();
      
      const editButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('编辑'));
      await editButtons[0]?.trigger('click');
      await flushPromises();
      
      const dialogButtons = wrapper.find('.el-dialog__footer').findAll('.el-button');
      const confirmButton = dialogButtons.find(btn => btn.text() === '确定');
      await confirmButton?.trigger('click');
      await flushPromises();
      
      expect(ElMessage.error).toHaveBeenCalled();
    });
  });


  // ==================== 任务17.7 删除分类功能测试 ====================
  describe('删除分类功能测试 (任务17.7)', () => {
    it('点击删除按钮应显示确认弹窗', async () => {
      await mountComponent();
      
      const deleteButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('删除'));
      await deleteButtons[deleteButtons.length - 1]?.trigger('click');
      await flushPromises();
      
      expect(ElMessageBox.confirm).toHaveBeenCalled();
    });

    it('确认删除应调用删除API', async () => {
      await mountComponent();
      
      const deleteButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('删除'));
      await deleteButtons[deleteButtons.length - 1]?.trigger('click');
      await flushPromises();
      
      expect(categoryApi.deleteCategory).toHaveBeenCalled();
    });

    it('删除成功后应显示成功消息', async () => {
      await mountComponent();
      
      const deleteButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('删除'));
      await deleteButtons[deleteButtons.length - 1]?.trigger('click');
      await flushPromises();
      
      expect(ElMessage.success).toHaveBeenCalledWith('删除分类成功');
    });

    it('删除有子分类的分类应显示警告', async () => {
      await mountComponent();
      
      const deleteButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('删除'));
      await deleteButtons[0]?.trigger('click');
      await flushPromises();
      
      expect(ElMessage.warning).toHaveBeenCalledWith('该分类下有子分类，无法删除');
    });

    it('删除有资源的分类应显示警告', async () => {
      await mountComponent();
      
      const deleteButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('删除'));
      // 第二个分类有资源但没有子分类
      await deleteButtons[1]?.trigger('click');
      await flushPromises();
      
      expect(ElMessage.warning).toHaveBeenCalled();
    });

    it('取消删除不应调用删除API', async () => {
      vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce('cancel');
      
      await mountComponent();
      vi.clearAllMocks();
      
      const deleteButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('删除'));
      await deleteButtons[deleteButtons.length - 1]?.trigger('click');
      await flushPromises();
      
      expect(categoryApi.deleteCategory).not.toHaveBeenCalled();
    });

    it('删除失败应显示错误消息', async () => {
      vi.mocked(categoryApi.deleteCategory).mockRejectedValueOnce(new Error('删除失败'));
      
      await mountComponent();
      
      const deleteButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('删除'));
      await deleteButtons[deleteButtons.length - 1]?.trigger('click');
      await flushPromises();
      
      expect(ElMessage.error).toHaveBeenCalled();
    });
  });


  // ==================== 任务17.8 分类排序功能测试 ====================
  describe('分类排序功能测试 (任务17.8)', () => {
    it('进入排序模式后表格应添加sort-mode类', async () => {
      await mountComponent();
      
      const sortButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('调整排序'));
      await sortButton?.trigger('click');
      await flushPromises();
      
      const table = wrapper.find('.category-table');
      expect(table.classes()).toContain('sort-mode');
    });

    it('排序模式下应隐藏操作列按钮', async () => {
      await mountComponent();
      
      const sortButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('调整排序'));
      await sortButton?.trigger('click');
      await flushPromises();
      
      const editButtons = wrapper.findAll('.el-button').filter(btn => btn.text().includes('编辑'));
      expect(editButtons.length).toBe(0);
    });

    it('保存排序应传递正确的排序数据', async () => {
      await mountComponent();
      
      const sortButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('调整排序'));
      await sortButton?.trigger('click');
      await flushPromises();
      
      const saveButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('保存排序'));
      await saveButton?.trigger('click');
      await flushPromises();
      
      expect(categoryApi.updateCategoriesSort).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            categoryId: expect.any(String),
            sortOrder: expect.any(Number)
          })
        ])
      );
    });

    it('保存排序成功后应退出排序模式', async () => {
      await mountComponent();
      
      const sortButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('调整排序'));
      await sortButton?.trigger('click');
      await flushPromises();
      
      const saveButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('保存排序'));
      await saveButton?.trigger('click');
      await flushPromises();
      
      const table = wrapper.find('.category-table');
      expect(table.classes()).not.toContain('sort-mode');
    });

    it('保存排序失败应显示错误消息', async () => {
      vi.mocked(categoryApi.updateCategoriesSort).mockRejectedValueOnce(new Error('保存失败'));
      
      await mountComponent();
      
      const sortButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('调整排序'));
      await sortButton?.trigger('click');
      await flushPromises();
      
      const saveButton = wrapper.findAll('.el-button').find(btn => btn.text().includes('保存排序'));
      await saveButton?.trigger('click');
      await flushPromises();
      
      expect(ElMessage.error).toHaveBeenCalled();
    });
  });

  // ==================== 加载状态测试 ====================
  describe('加载状态测试', () => {
    it('加载完成后loading状态应为false', async () => {
      await mountComponent();
      
      expect(wrapper.vm.loading).toBe(false);
    });

    it('加载失败应显示错误消息', async () => {
      vi.mocked(categoryApi.getCategoryTree).mockRejectedValueOnce(new Error('加载失败'));
      
      await mountComponent();
      
      expect(ElMessage.error).toHaveBeenCalled();
    });
  });
});
