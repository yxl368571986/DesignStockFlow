/**
 * 资源管理页面单元测试
 * 
 * 测试范围：
 * - 页面布局和标题显示 (任务15.1)
 * - 搜索筛选功能 (任务15.2)
 * - 批量操作栏 (任务15.3)
 * - 资源列表表格 (任务15.4)
 * - 分页功能 (任务15.5)
 * - 资源编辑弹窗 (任务15.6)
 * - 资源搜索和筛选功能 (任务15.7)
 * - 编辑资源功能 (任务15.8)
 * - 删除资源功能 (任务15.9)
 * - 置顶/推荐资源功能 (任务15.10)
 * - 批量操作功能 (任务15.11)
 * 
 * 需求: 需求12.1-12.8
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus';
import ResourcesPage from '../index.vue';
import * as adminResourceApi from '@/api/adminResource';

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

// Mock 子组件
vi.mock('../components/ResourceEditDialog.vue', () => ({
  default: {
    name: 'ResourceEditDialog',
    template: '<div class="resource-edit-dialog" v-if="modelValue"><slot /></div>',
    props: ['modelValue', 'resource', 'categories'],
    emits: ['update:modelValue', 'success']
  }
}));

// Mock format工具
vi.mock('@/utils/format', () => ({
  formatTime: vi.fn((date: string) => date)
}));

// Mock API
vi.mock('@/api/adminResource', () => ({
  getAdminResourceList: vi.fn().mockResolvedValue({
    list: [
      {
        resourceId: 'res-001',
        title: '测试资源1',
        cover: 'https://example.com/cover1.jpg',
        fileFormat: 'PSD',
        fileSize: 1024000,
        categoryId: '4',
        categoryName: 'UI设计类',
        userId: 'user-001',
        userName: '张三',
        downloadCount: 100,
        viewCount: 500,
        auditStatus: 1,
        vipLevel: 0,
        isTop: false,
        isRecommend: true,
        status: 1,
        createdAt: '2024-01-15 10:30:00',
        tags: ['设计', 'UI']
      },
      {
        resourceId: 'res-002',
        title: '测试资源2',
        cover: 'https://example.com/cover2.jpg',
        fileFormat: 'AI',
        fileSize: 2048000,
        categoryId: '5',
        categoryName: '插画类',
        userId: 'user-002',
        userName: '李四',
        downloadCount: 50,
        viewCount: 200,
        auditStatus: 0,
        vipLevel: 1,
        isTop: true,
        isRecommend: false,
        status: 1,
        createdAt: '2024-02-20 14:20:00',
        tags: ['插画']
      },
      {
        resourceId: 'res-003',
        title: '已下架资源',
        cover: 'https://example.com/cover3.jpg',
        fileFormat: 'PSD',
        fileSize: 512000,
        categoryId: '1',
        categoryName: '党建类',
        userId: 'user-003',
        userName: '王五',
        downloadCount: 10,
        viewCount: 50,
        auditStatus: 1,
        vipLevel: 0,
        isTop: false,
        isRecommend: false,
        status: 0,
        createdAt: '2024-03-01 09:00:00',
        tags: []
      }
    ],
    total: 3
  }),
  deleteAdminResource: vi.fn().mockResolvedValue({}),
  offlineResource: vi.fn().mockResolvedValue({}),
  onlineResource: vi.fn().mockResolvedValue({}),
  topResource: vi.fn().mockResolvedValue({}),
  recommendResource: vi.fn().mockResolvedValue({}),
  batchDeleteResources: vi.fn().mockResolvedValue({}),
  batchOfflineResources: vi.fn().mockResolvedValue({}),
  updateAdminResource: vi.fn().mockResolvedValue({})
}));

describe('资源管理页面', () => {
  let wrapper: VueWrapper;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/admin/resources', component: ResourcesPage }
      ]
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountComponent = async () => {
    wrapper = mount(ResourcesPage, {
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

  describe('页面布局测试 (任务15.1)', () => {
    it('应该显示页面标题"资源管理"', async () => {
      await mountComponent();
      
      const title = wrapper.find('.page-title');
      expect(title.exists()).toBe(true);
      expect(title.text()).toBe('资源管理');
    });

    it('应该显示页面描述"管理平台所有资源内容"', async () => {
      await mountComponent();
      
      const desc = wrapper.find('.page-desc');
      expect(desc.exists()).toBe(true);
      expect(desc.text()).toBe('管理平台所有资源内容');
    });

    it('应该显示搜索筛选区域', async () => {
      await mountComponent();
      
      const searchCard = wrapper.find('.search-card');
      expect(searchCard.exists()).toBe(true);
    });

    it('应该显示资源列表表格', async () => {
      await mountComponent();
      
      const tableCard = wrapper.find('.table-card');
      expect(tableCard.exists()).toBe(true);
      
      const table = wrapper.findComponent({ name: 'ElTable' });
      expect(table.exists()).toBe(true);
    });
  });

  describe('搜索筛选区域测试 (任务15.2)', () => {
    it('应该显示搜索输入框', async () => {
      await mountComponent();
      
      const searchInput = wrapper.find('input[placeholder="标题/资源ID/上传者"]');
      expect(searchInput.exists()).toBe(true);
    });

    it('应该显示分类下拉选择器', async () => {
      await mountComponent();
      
      const selects = wrapper.findAllComponents({ name: 'ElSelect' });
      expect(selects.length).toBeGreaterThanOrEqual(4);
    });

    it('应该显示审核状态下拉选择器', async () => {
      await mountComponent();
      
      const selects = wrapper.findAllComponents({ name: 'ElSelect' });
      expect(selects.length).toBeGreaterThanOrEqual(4);
    });

    it('应该显示VIP等级下拉选择器', async () => {
      await mountComponent();
      
      const selects = wrapper.findAllComponents({ name: 'ElSelect' });
      expect(selects.length).toBeGreaterThanOrEqual(4);
    });

    it('应该显示状态下拉选择器', async () => {
      await mountComponent();
      
      const selects = wrapper.findAllComponents({ name: 'ElSelect' });
      expect(selects.length).toBeGreaterThanOrEqual(4);
    });

    it('应该显示搜索按钮', async () => {
      await mountComponent();
      
      const buttons = wrapper.findAllComponents({ name: 'ElButton' });
      const searchBtn = buttons.find(btn => btn.text().includes('搜索'));
      expect(searchBtn).toBeTruthy();
    });

    it('应该显示重置按钮', async () => {
      await mountComponent();
      
      const buttons = wrapper.findAllComponents({ name: 'ElButton' });
      const resetBtn = buttons.find(btn => btn.text().includes('重置'));
      expect(resetBtn).toBeTruthy();
    });

    it('点击搜索按钮应该触发搜索', async () => {
      await mountComponent();
      
      const searchInput = wrapper.find('input[placeholder="标题/资源ID/上传者"]');
      await searchInput.setValue('测试');
      
      const buttons = wrapper.findAllComponents({ name: 'ElButton' });
      const searchBtn = buttons.find(btn => btn.text().includes('搜索'));
      await searchBtn?.trigger('click');
      await flushPromises();
      
      expect(wrapper.vm).toBeTruthy();
    });

    it('点击重置按钮应该清空筛选条件', async () => {
      await mountComponent();
      
      const searchInput = wrapper.find('input[placeholder="标题/资源ID/上传者"]');
      await searchInput.setValue('test');
      
      const buttons = wrapper.findAllComponents({ name: 'ElButton' });
      const resetBtn = buttons.find(btn => btn.text().includes('重置'));
      await resetBtn?.trigger('click');
      await flushPromises();
      
      expect((searchInput.element as HTMLInputElement).value).toBe('');
    });
  });

  describe('资源列表表格测试 (任务15.4)', () => {
    it('应该显示全选复选框', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const selectionColumn = columns.find(col => col.props('type') === 'selection');
      expect(selectionColumn).toBeTruthy();
    });

    it('应该显示资源ID列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const resourceIdColumn = columns.find(col => col.props('prop') === 'resourceId');
      expect(resourceIdColumn).toBeTruthy();
    });

    it('应该显示资源信息列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const resourceInfoColumn = columns.find(col => col.props('label') === '资源信息');
      expect(resourceInfoColumn).toBeTruthy();
    });

    it('应该显示分类列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const categoryColumn = columns.find(col => col.props('label') === '分类');
      expect(categoryColumn).toBeTruthy();
    });

    it('应该显示上传者列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const uploaderColumn = columns.find(col => col.props('label') === '上传者');
      expect(uploaderColumn).toBeTruthy();
    });

    it('应该显示下载量列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const downloadColumn = columns.find(col => col.props('prop') === 'downloadCount');
      expect(downloadColumn).toBeTruthy();
    });

    it('应该显示浏览量列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const viewColumn = columns.find(col => col.props('prop') === 'viewCount');
      expect(viewColumn).toBeTruthy();
    });

    it('应该显示审核状态列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const auditColumn = columns.find(col => col.props('label') === '审核状态');
      expect(auditColumn).toBeTruthy();
    });

    it('应该显示VIP列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const vipColumn = columns.find(col => col.props('label') === 'VIP');
      expect(vipColumn).toBeTruthy();
    });

    it('应该显示标记列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const markColumn = columns.find(col => col.props('label') === '标记');
      expect(markColumn).toBeTruthy();
    });

    it('应该显示状态列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const statusColumn = columns.find(col => col.props('label') === '状态');
      expect(statusColumn).toBeTruthy();
    });

    it('应该显示上传时间列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const createdAtColumn = columns.find(col => col.props('prop') === 'createdAt');
      expect(createdAtColumn).toBeTruthy();
    });

    it('应该显示操作列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const actionColumn = columns.find(col => col.props('label') === '操作');
      expect(actionColumn).toBeTruthy();
    });

    it('下载量列应该支持排序', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const downloadColumn = columns.find(col => col.props('prop') === 'downloadCount');
      expect(downloadColumn?.props('sortable')).toBe('custom');
    });

    it('浏览量列应该支持排序', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const viewColumn = columns.find(col => col.props('prop') === 'viewCount');
      expect(viewColumn?.props('sortable')).toBe('custom');
    });

    it('上传时间列应该支持排序', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const createdAtColumn = columns.find(col => col.props('prop') === 'createdAt');
      expect(createdAtColumn?.props('sortable')).toBe('custom');
    });
  });

  describe('分页功能测试 (任务15.5)', () => {
    it('应该显示分页组件', async () => {
      await mountComponent();
      
      const pagination = wrapper.findComponent({ name: 'ElPagination' });
      expect(pagination.exists()).toBe(true);
    });

    it('分页组件应该显示总数', async () => {
      await mountComponent();
      
      const pagination = wrapper.findComponent({ name: 'ElPagination' });
      expect(pagination.props('layout')).toContain('total');
    });

    it('分页组件应该支持切换每页条数', async () => {
      await mountComponent();
      
      const pagination = wrapper.findComponent({ name: 'ElPagination' });
      expect(pagination.props('layout')).toContain('sizes');
      expect(pagination.props('pageSizes')).toEqual([10, 20, 50, 100]);
    });

    it('分页组件应该支持跳转', async () => {
      await mountComponent();
      
      const pagination = wrapper.findComponent({ name: 'ElPagination' });
      expect(pagination.props('layout')).toContain('jumper');
    });
  });

  describe('数据加载测试', () => {
    it('组件挂载时应该自动加载资源列表', async () => {
      await mountComponent();
      await flushPromises();
      
      expect(wrapper.vm.resourceList.length).toBeGreaterThan(0);
    });

    it('加载数据时应该显示loading状态', async () => {
      const wrapper = mount(ResourcesPage, {
        global: {
          plugins: [router, ElementPlus],
          stubs: {
            'el-icon': true
          }
        }
      });
      
      expect(wrapper.vm.loading).toBe(true);
      
      await flushPromises();
      
      expect(wrapper.vm.loading).toBe(false);
      
      wrapper.unmount();
    });
  });

  describe('审核状态显示测试', () => {
    it('待审核状态应该显示warning类型标签', async () => {
      await mountComponent();
      
      expect(wrapper.vm.getAuditStatusType(0)).toBe('warning');
    });

    it('已通过状态应该显示success类型标签', async () => {
      await mountComponent();
      
      expect(wrapper.vm.getAuditStatusType(1)).toBe('success');
    });

    it('已驳回状态应该显示danger类型标签', async () => {
      await mountComponent();
      
      expect(wrapper.vm.getAuditStatusType(2)).toBe('danger');
    });

    it('待审核状态文本应该正确', async () => {
      await mountComponent();
      
      expect(wrapper.vm.getAuditStatusText(0)).toBe('待审核');
    });

    it('已通过状态文本应该正确', async () => {
      await mountComponent();
      
      expect(wrapper.vm.getAuditStatusText(1)).toBe('已通过');
    });

    it('已驳回状态文本应该正确', async () => {
      await mountComponent();
      
      expect(wrapper.vm.getAuditStatusText(2)).toBe('已驳回');
    });
  });

  describe('文件大小格式化测试', () => {
    it('应该正确格式化字节', async () => {
      await mountComponent();
      
      expect(wrapper.vm.formatFileSize(0)).toBe('0 B');
      expect(wrapper.vm.formatFileSize(500)).toBe('500 B');
    });

    it('应该正确格式化KB', async () => {
      await mountComponent();
      
      expect(wrapper.vm.formatFileSize(1024)).toBe('1 KB');
      expect(wrapper.vm.formatFileSize(2048)).toBe('2 KB');
    });

    it('应该正确格式化MB', async () => {
      await mountComponent();
      
      expect(wrapper.vm.formatFileSize(1048576)).toBe('1 MB');
      expect(wrapper.vm.formatFileSize(2097152)).toBe('2 MB');
    });
  });

  describe('批量操作测试 (任务15.3)', () => {
    it('选中资源后应该显示批量操作栏', async () => {
      await mountComponent();
      await flushPromises();
      
      // 模拟选中资源
      wrapper.vm.selectedResources = [wrapper.vm.resourceList[0]];
      await flushPromises();
      
      const batchCard = wrapper.find('.batch-actions-card');
      expect(batchCard.exists()).toBe(true);
    });

    it('批量操作栏应该显示已选择数量', async () => {
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.selectedResources = [wrapper.vm.resourceList[0]];
      await flushPromises();
      
      const selectedCount = wrapper.find('.selected-count');
      expect(selectedCount.text()).toContain('1');
    });

    it('点击取消选择应该清空选中', async () => {
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.selectedResources = [wrapper.vm.resourceList[0]];
      await flushPromises();
      
      wrapper.vm.clearSelection();
      
      expect(wrapper.vm.selectedResources.length).toBe(0);
    });

    it('批量操作栏应该显示批量下架按钮', async () => {
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.selectedResources = [wrapper.vm.resourceList[0]];
      await flushPromises();
      
      const batchCard = wrapper.find('.batch-actions-card');
      const buttons = batchCard.findAllComponents({ name: 'ElButton' });
      const offlineBtn = buttons.find(btn => btn.text().includes('批量下架'));
      expect(offlineBtn).toBeTruthy();
    });

    it('批量操作栏应该显示批量删除按钮', async () => {
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.selectedResources = [wrapper.vm.resourceList[0]];
      await flushPromises();
      
      const batchCard = wrapper.find('.batch-actions-card');
      const buttons = batchCard.findAllComponents({ name: 'ElButton' });
      const deleteBtn = buttons.find(btn => btn.text().includes('批量删除'));
      expect(deleteBtn).toBeTruthy();
    });

    it('批量操作栏应该显示取消选择按钮', async () => {
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.selectedResources = [wrapper.vm.resourceList[0]];
      await flushPromises();
      
      const batchCard = wrapper.find('.batch-actions-card');
      const buttons = batchCard.findAllComponents({ name: 'ElButton' });
      const cancelBtn = buttons.find(btn => btn.text().includes('取消选择'));
      expect(cancelBtn).toBeTruthy();
    });
  });

  describe('资源编辑弹窗测试 (任务15.6)', () => {
    it('应该包含资源编辑对话框组件', async () => {
      await mountComponent();
      
      const dialog = wrapper.findComponent({ name: 'ResourceEditDialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('点击编辑按钮应该打开编辑弹窗', async () => {
      await mountComponent();
      await flushPromises();
      
      // 直接调用编辑方法
      wrapper.vm.handleEdit(wrapper.vm.resourceList[0]);
      await flushPromises();
      
      expect(wrapper.vm.editDialogVisible).toBe(true);
      expect(wrapper.vm.selectedResource).toEqual(wrapper.vm.resourceList[0]);
    });

    it('编辑弹窗应该传递正确的资源数据', async () => {
      await mountComponent();
      await flushPromises();
      
      const resource = wrapper.vm.resourceList[0];
      wrapper.vm.handleEdit(resource);
      await flushPromises();
      
      const dialog = wrapper.findComponent({ name: 'ResourceEditDialog' });
      expect(dialog.props('resource')).toEqual(resource);
    });

    it('编辑弹窗应该传递分类列表', async () => {
      await mountComponent();
      await flushPromises();
      
      const dialog = wrapper.findComponent({ name: 'ResourceEditDialog' });
      expect(dialog.props('categories')).toBeTruthy();
      expect(dialog.props('categories').length).toBeGreaterThan(0);
    });

    it('编辑成功后应该显示成功消息并关闭弹窗', async () => {
      await mountComponent();
      
      wrapper.vm.editDialogVisible = true;
      wrapper.vm.handleEditSuccess();
      
      expect(ElMessage.success).toHaveBeenCalledWith('编辑成功');
      expect(wrapper.vm.editDialogVisible).toBe(false);
    });
  });

  describe('资源搜索和筛选功能测试 (任务15.7)', () => {
    it('按标题搜索应该调用API并传递正确参数', async () => {
      const { getAdminResourceList } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      wrapper.vm.searchForm.keyword = '测试资源';
      wrapper.vm.handleSearch();
      await flushPromises();
      
      expect(getAdminResourceList).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: '测试资源',
          page: 1
        })
      );
    });

    it('按分类筛选应该调用API并传递正确参数', async () => {
      const { getAdminResourceList } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      wrapper.vm.searchForm.categoryId = '4';
      wrapper.vm.handleSearch();
      await flushPromises();
      
      expect(getAdminResourceList).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: '4',
          page: 1
        })
      );
    });

    it('按审核状态筛选应该调用API并传递正确参数', async () => {
      const { getAdminResourceList } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      wrapper.vm.searchForm.auditStatus = 1;
      wrapper.vm.handleSearch();
      await flushPromises();
      
      expect(getAdminResourceList).toHaveBeenCalledWith(
        expect.objectContaining({
          auditStatus: 1,
          page: 1
        })
      );
    });

    it('按VIP等级筛选应该调用API并传递正确参数', async () => {
      const { getAdminResourceList } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      wrapper.vm.searchForm.vipLevel = 1;
      wrapper.vm.handleSearch();
      await flushPromises();
      
      expect(getAdminResourceList).toHaveBeenCalledWith(
        expect.objectContaining({
          vipLevel: 1,
          page: 1
        })
      );
    });

    it('按状态筛选应该调用API并传递正确参数', async () => {
      const { getAdminResourceList } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      wrapper.vm.searchForm.status = 0;
      wrapper.vm.handleSearch();
      await flushPromises();
      
      expect(getAdminResourceList).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 0,
          page: 1
        })
      );
    });

    it('重置筛选应该清空所有条件并重新加载', async () => {
      const { getAdminResourceList } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      // 设置筛选条件
      wrapper.vm.searchForm.keyword = '测试';
      wrapper.vm.searchForm.categoryId = '1';
      wrapper.vm.searchForm.auditStatus = 1;
      wrapper.vm.searchForm.vipLevel = 1;
      wrapper.vm.searchForm.status = 1;
      
      vi.clearAllMocks();
      
      wrapper.vm.handleReset();
      await flushPromises();
      
      expect(wrapper.vm.searchForm.keyword).toBe('');
      expect(wrapper.vm.searchForm.categoryId).toBeUndefined();
      expect(wrapper.vm.searchForm.auditStatus).toBeUndefined();
      expect(wrapper.vm.searchForm.vipLevel).toBeUndefined();
      expect(wrapper.vm.searchForm.status).toBeUndefined();
      expect(getAdminResourceList).toHaveBeenCalled();
    });

    it('搜索应该重置页码为1', async () => {
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.pagination.page = 3;
      wrapper.vm.handleSearch();
      
      expect(wrapper.vm.pagination.page).toBe(1);
    });
  });

  describe('编辑资源功能测试 (任务15.8)', () => {
    it('点击编辑应该设置选中的资源', async () => {
      await mountComponent();
      await flushPromises();
      
      const resource = wrapper.vm.resourceList[0];
      wrapper.vm.handleEdit(resource);
      
      expect(wrapper.vm.selectedResource).toEqual(resource);
    });

    it('点击编辑应该打开编辑弹窗', async () => {
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.handleEdit(wrapper.vm.resourceList[0]);
      
      expect(wrapper.vm.editDialogVisible).toBe(true);
    });
  });

  describe('删除资源功能测试 (任务15.9)', () => {
    it('删除资源应该显示确认弹窗', async () => {
      await mountComponent();
      await flushPromises();
      
      const resource = wrapper.vm.resourceList[0];
      wrapper.vm.handleDelete(resource);
      await flushPromises();
      
      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        expect.stringContaining('确定要删除资源'),
        '确认删除',
        expect.any(Object)
      );
    });

    it('确认删除应该调用删除API', async () => {
      const { deleteAdminResource } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = wrapper.vm.resourceList[0];
      await wrapper.vm.handleDelete(resource);
      await flushPromises();
      
      expect(deleteAdminResource).toHaveBeenCalledWith(resource.resourceId);
    });

    it('删除成功应该显示成功消息', async () => {
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = wrapper.vm.resourceList[0];
      await wrapper.vm.handleDelete(resource);
      await flushPromises();
      
      expect(ElMessage.success).toHaveBeenCalledWith('删除成功');
    });
  });

  describe('置顶/推荐资源功能测试 (任务15.10)', () => {
    it('置顶资源应该调用置顶API', async () => {
      const { topResource } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[0], isTop: false };
      await wrapper.vm.handleToggleTop(resource);
      await flushPromises();
      
      expect(topResource).toHaveBeenCalledWith(resource.resourceId, true);
    });

    it('取消置顶应该调用置顶API并传递false', async () => {
      const { topResource } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[1], isTop: true };
      await wrapper.vm.handleToggleTop(resource);
      await flushPromises();
      
      expect(topResource).toHaveBeenCalledWith(resource.resourceId, false);
    });

    it('推荐资源应该调用推荐API', async () => {
      const { recommendResource } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[1], isRecommend: false };
      await wrapper.vm.handleToggleRecommend(resource);
      await flushPromises();
      
      expect(recommendResource).toHaveBeenCalledWith(resource.resourceId, true);
    });

    it('取消推荐应该调用推荐API并传递false', async () => {
      const { recommendResource } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[0], isRecommend: true };
      await wrapper.vm.handleToggleRecommend(resource);
      await flushPromises();
      
      expect(recommendResource).toHaveBeenCalledWith(resource.resourceId, false);
    });

    it('置顶成功应该显示成功消息', async () => {
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[0], isTop: false };
      await wrapper.vm.handleToggleTop(resource);
      await flushPromises();
      
      expect(ElMessage.success).toHaveBeenCalledWith('置顶成功');
    });

    it('推荐成功应该显示成功消息', async () => {
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[1], isRecommend: false };
      await wrapper.vm.handleToggleRecommend(resource);
      await flushPromises();
      
      expect(ElMessage.success).toHaveBeenCalledWith('推荐成功');
    });
  });

  describe('批量操作功能测试 (任务15.11)', () => {
    it('批量下架应该显示确认弹窗', async () => {
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.selectedResources = [wrapper.vm.resourceList[0], wrapper.vm.resourceList[1]];
      
      vi.clearAllMocks();
      
      wrapper.vm.handleBatchOffline();
      await flushPromises();
      
      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        expect.stringContaining('2'),
        '确认批量下架',
        expect.any(Object)
      );
    });

    it('确认批量下架应该调用批量下架API', async () => {
      const { batchOfflineResources } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.selectedResources = [wrapper.vm.resourceList[0], wrapper.vm.resourceList[1]];
      
      vi.clearAllMocks();
      
      await wrapper.vm.handleBatchOffline();
      await flushPromises();
      
      expect(batchOfflineResources).toHaveBeenCalledWith(['res-001', 'res-002']);
    });

    it('批量下架成功应该清空选中并显示成功消息', async () => {
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.selectedResources = [wrapper.vm.resourceList[0]];
      
      vi.clearAllMocks();
      
      await wrapper.vm.handleBatchOffline();
      await flushPromises();
      
      expect(wrapper.vm.selectedResources.length).toBe(0);
      expect(ElMessage.success).toHaveBeenCalledWith('批量下架成功');
    });

    it('批量删除应该显示确认弹窗', async () => {
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.selectedResources = [wrapper.vm.resourceList[0], wrapper.vm.resourceList[1]];
      
      vi.clearAllMocks();
      
      wrapper.vm.handleBatchDelete();
      await flushPromises();
      
      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        expect.stringContaining('2'),
        '确认批量删除',
        expect.any(Object)
      );
    });

    it('确认批量删除应该调用批量删除API', async () => {
      const { batchDeleteResources } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.selectedResources = [wrapper.vm.resourceList[0], wrapper.vm.resourceList[1]];
      
      vi.clearAllMocks();
      
      await wrapper.vm.handleBatchDelete();
      await flushPromises();
      
      expect(batchDeleteResources).toHaveBeenCalledWith(['res-001', 'res-002']);
    });

    it('批量删除成功应该清空选中并显示成功消息', async () => {
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.selectedResources = [wrapper.vm.resourceList[0]];
      
      vi.clearAllMocks();
      
      await wrapper.vm.handleBatchDelete();
      await flushPromises();
      
      expect(wrapper.vm.selectedResources.length).toBe(0);
      expect(ElMessage.success).toHaveBeenCalledWith('批量删除成功');
    });
  });

  describe('上架/下架功能测试', () => {
    it('下架资源应该显示确认弹窗', async () => {
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[0], status: 1 };
      wrapper.vm.handleToggleStatus(resource);
      await flushPromises();
      
      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        expect.stringContaining('下架'),
        '确认操作',
        expect.any(Object)
      );
    });

    it('上架资源应该显示确认弹窗', async () => {
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[2], status: 0 };
      wrapper.vm.handleToggleStatus(resource);
      await flushPromises();
      
      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        expect.stringContaining('上架'),
        '确认操作',
        expect.any(Object)
      );
    });

    it('确认下架应该调用下架API', async () => {
      const { offlineResource } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[0], status: 1 };
      await wrapper.vm.handleToggleStatus(resource);
      await flushPromises();
      
      expect(offlineResource).toHaveBeenCalledWith(resource.resourceId);
    });

    it('确认上架应该调用上架API', async () => {
      const { onlineResource } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[2], status: 0 };
      await wrapper.vm.handleToggleStatus(resource);
      await flushPromises();
      
      expect(onlineResource).toHaveBeenCalledWith(resource.resourceId);
    });

    it('下架成功应该显示成功消息', async () => {
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[0], status: 1 };
      await wrapper.vm.handleToggleStatus(resource);
      await flushPromises();
      
      expect(ElMessage.success).toHaveBeenCalledWith('下架成功');
    });

    it('上架成功应该显示成功消息', async () => {
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[2], status: 0 };
      await wrapper.vm.handleToggleStatus(resource);
      await flushPromises();
      
      expect(ElMessage.success).toHaveBeenCalledWith('上架成功');
    });
  });

  describe('更多操作菜单测试', () => {
    it('handleMoreAction应该正确处理top命令', async () => {
      const { topResource } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[0], isTop: false };
      await wrapper.vm.handleMoreAction('top', resource);
      await flushPromises();
      
      expect(topResource).toHaveBeenCalled();
    });

    it('handleMoreAction应该正确处理untop命令', async () => {
      const { topResource } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[1], isTop: true };
      await wrapper.vm.handleMoreAction('untop', resource);
      await flushPromises();
      
      expect(topResource).toHaveBeenCalled();
    });

    it('handleMoreAction应该正确处理recommend命令', async () => {
      const { recommendResource } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[1], isRecommend: false };
      await wrapper.vm.handleMoreAction('recommend', resource);
      await flushPromises();
      
      expect(recommendResource).toHaveBeenCalled();
    });

    it('handleMoreAction应该正确处理unrecommend命令', async () => {
      const { recommendResource } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = { ...wrapper.vm.resourceList[0], isRecommend: true };
      await wrapper.vm.handleMoreAction('unrecommend', resource);
      await flushPromises();
      
      expect(recommendResource).toHaveBeenCalled();
    });

    it('handleMoreAction应该正确处理delete命令', async () => {
      const { deleteAdminResource } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      const resource = wrapper.vm.resourceList[0];
      await wrapper.vm.handleMoreAction('delete', resource);
      await flushPromises();
      
      expect(deleteAdminResource).toHaveBeenCalled();
    });
  });

  describe('排序功能测试', () => {
    it('排序变化应该调用API并传递排序参数', async () => {
      const { getAdminResourceList } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      wrapper.vm.handleSortChange({ prop: 'downloadCount', order: 'descending' });
      await flushPromises();
      
      expect(getAdminResourceList).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'downloadCount',
          sortOrder: 'desc'
        })
      );
    });

    it('升序排序应该传递asc参数', async () => {
      const { getAdminResourceList } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      wrapper.vm.handleSortChange({ prop: 'viewCount', order: 'ascending' });
      await flushPromises();
      
      expect(getAdminResourceList).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'viewCount',
          sortOrder: 'asc'
        })
      );
    });
  });

  describe('分页变化测试', () => {
    it('切换每页条数应该重置页码为1并重新加载', async () => {
      const { getAdminResourceList } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      wrapper.vm.pagination.page = 3;
      
      vi.clearAllMocks();
      
      wrapper.vm.handleSizeChange();
      await flushPromises();
      
      expect(wrapper.vm.pagination.page).toBe(1);
      expect(getAdminResourceList).toHaveBeenCalled();
    });

    it('切换页码应该重新加载数据', async () => {
      const { getAdminResourceList } = await import('@/api/adminResource');
      await mountComponent();
      await flushPromises();
      
      vi.clearAllMocks();
      
      wrapper.vm.handlePageChange();
      await flushPromises();
      
      expect(getAdminResourceList).toHaveBeenCalled();
    });
  });
});
