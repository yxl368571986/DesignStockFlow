/**
 * 内容审核页面单元测试
 * 
 * 测试范围：
 * - 页面布局和标题显示 (任务16.1)
 * - 审核筛选区域 (任务16.2)
 * - 批量审核操作栏 (任务16.3)
 * - 待审核列表表格 (任务16.4)
 * - 审核列表分页 (任务16.5)
 * - 审核详情弹窗 (任务16.6)
 * - 驳回原因弹窗 (任务16.7)
 * - 通过审核功能 (任务16.8)
 * - 驳回审核功能 (任务16.9)
 * - 批量审核功能 (任务16.10)
 * 
 * 需求: 需求13.1-13.10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus';
import AuditPage from '../index.vue';
import * as auditApi from '@/api/audit';
import * as contentApi from '@/api/content';

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

// Mock 审核API
vi.mock('@/api/audit', () => ({
  getAuditResources: vi.fn(),
  auditResource: vi.fn()
}));

// Mock 内容API
vi.mock('@/api/content', () => ({
  getCategories: vi.fn()
}));

// 模拟数据
const mockAuditResources = [
  {
    resource_id: 'res-001',
    title: '待审核资源1',
    description: '这是一个待审核的设计资源',
    cover: 'https://example.com/cover1.jpg',
    file_url: 'https://example.com/file1.psd',
    file_name: 'design1.psd',
    file_size: 1024000,
    file_format: 'PSD',
    preview_images: ['https://example.com/preview1.jpg', 'https://example.com/preview2.jpg'],
    category_id: 'cat-001',
    category: {
      category_id: 'cat-001',
      category_name: 'UI设计'
    },
    tags: ['设计', 'UI'],
    vip_level: 0,
    user_id: 'user-001',
    user: {
      user_id: 'user-001',
      nickname: '设计师小王',
      phone: '138****0001',
      avatar: 'https://example.com/avatar1.jpg'
    },
    audit_status: 0,
    download_count: 0,
    view_count: 0,
    like_count: 0,
    collect_count: 0,
    is_top: false,
    is_recommend: false,
    status: 1,
    created_at: '2024-12-20T10:30:00.000Z',
    updated_at: '2024-12-20T10:30:00.000Z'
  },
  {
    resource_id: 'res-002',
    title: '待审核资源2',
    description: '这是另一个待审核的插画资源',
    cover: 'https://example.com/cover2.jpg',
    file_url: 'https://example.com/file2.ai',
    file_name: 'illustration.ai',
    file_size: 2048000,
    file_format: 'AI',
    preview_images: ['https://example.com/preview3.jpg'],
    category_id: 'cat-002',
    category: {
      category_id: 'cat-002',
      category_name: '插画设计'
    },
    tags: ['插画', '艺术'],
    vip_level: 1,
    user_id: 'user-002',
    user: {
      user_id: 'user-002',
      nickname: '插画师小李',
      phone: '138****0002',
      avatar: 'https://example.com/avatar2.jpg'
    },
    audit_status: 0,
    download_count: 0,
    view_count: 0,
    like_count: 0,
    collect_count: 0,
    is_top: false,
    is_recommend: false,
    status: 1,
    created_at: '2024-12-21T14:20:00.000Z',
    updated_at: '2024-12-21T14:20:00.000Z'
  },
  {
    resource_id: 'res-003',
    title: '待审核资源3',
    description: '第三个待审核资源',
    cover: 'https://example.com/cover3.jpg',
    file_url: 'https://example.com/file3.psd',
    file_name: 'design3.psd',
    file_size: 512000,
    file_format: 'PSD',
    preview_images: [],
    category_id: 'cat-001',
    category: {
      category_id: 'cat-001',
      category_name: 'UI设计'
    },
    tags: [],
    vip_level: 0,
    user_id: 'user-003',
    user: {
      user_id: 'user-003',
      nickname: '设计师小张',
      phone: '138****0003',
      avatar: null
    },
    audit_status: 0,
    download_count: 0,
    view_count: 0,
    like_count: 0,
    collect_count: 0,
    is_top: false,
    is_recommend: false,
    status: 1,
    created_at: '2024-12-22T09:00:00.000Z',
    updated_at: '2024-12-22T09:00:00.000Z'
  }
];

const mockCategories = [
  { categoryId: 'cat-001', categoryName: 'UI设计', categoryCode: 'ui', sort: 1, isHot: true, isRecommend: true, resourceCount: 100 },
  { categoryId: 'cat-002', categoryName: '插画设计', categoryCode: 'illustration', sort: 2, isHot: false, isRecommend: true, resourceCount: 50 },
  { categoryId: 'cat-003', categoryName: '平面设计', categoryCode: 'graphic', sort: 3, isHot: true, isRecommend: false, resourceCount: 80 }
];

const mockAuditResponse = {
  data: {
    list: mockAuditResources,
    pagination: {
      page: 1,
      pageSize: 20,
      total: 3,
      totalPages: 1
    }
  }
};

const mockCategoriesResponse = {
  data: mockCategories
};

describe('内容审核页面', () => {
  let wrapper: VueWrapper;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/admin/audit', component: AuditPage }
      ]
    });

    // 设置默认mock返回值
    vi.mocked(auditApi.getAuditResources).mockResolvedValue(mockAuditResponse as any);
    vi.mocked(contentApi.getCategories).mockResolvedValue(mockCategoriesResponse as any);
    vi.mocked(auditApi.auditResource).mockResolvedValue({ data: { success: true } } as any);

    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountComponent = async () => {
    wrapper = mount(AuditPage, {
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


  // ==================== 任务16.1: 测试内容审核页面布局 ====================
  describe('页面布局测试 (任务16.1)', () => {
    it('应该显示页面标题"内容审核"', async () => {
      await mountComponent();
      
      const title = wrapper.find('.page-title');
      expect(title.exists()).toBe(true);
      expect(title.text()).toBe('内容审核');
    });

    it('应该显示待审核数量徽章', async () => {
      await mountComponent();
      
      const badge = wrapper.findComponent({ name: 'ElBadge' });
      expect(badge.exists()).toBe(true);
    });

    it('应该显示刷新列表按钮', async () => {
      await mountComponent();
      
      const refreshBtn = wrapper.find('.page-actions .el-button');
      expect(refreshBtn.exists()).toBe(true);
      expect(refreshBtn.text()).toContain('刷新列表');
    });

    it('应该显示筛选区域', async () => {
      await mountComponent();
      
      const filterCard = wrapper.find('.filter-card');
      expect(filterCard.exists()).toBe(true);
    });

    it('应该显示待审核列表表格', async () => {
      await mountComponent();
      
      const tableCard = wrapper.find('.table-card');
      expect(tableCard.exists()).toBe(true);
    });

    it('点击刷新列表按钮应该重新加载数据', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      
      const refreshBtn = wrapper.find('.page-actions .el-button');
      await refreshBtn.trigger('click');
      await flushPromises();
      
      expect(auditApi.getAuditResources).toHaveBeenCalled();
    });

    it('页面加载时应该调用API获取待审核资源', async () => {
      await mountComponent();
      
      expect(auditApi.getAuditResources).toHaveBeenCalled();
    });

    it('页面加载时应该调用API获取分类列表', async () => {
      await mountComponent();
      
      expect(contentApi.getCategories).toHaveBeenCalled();
    });
  });

  // ==================== 任务16.2: 测试审核筛选区域 ====================
  describe('审核筛选区域测试 (任务16.2)', () => {
    it('应该显示分类下拉选择器', async () => {
      await mountComponent();
      
      const categorySelect = wrapper.find('.filter-form .el-select');
      expect(categorySelect.exists()).toBe(true);
    });

    it('应该显示上传者输入框', async () => {
      await mountComponent();
      
      const uploaderInput = wrapper.find('.filter-form input[placeholder="输入上传者昵称"]');
      expect(uploaderInput.exists()).toBe(true);
    });

    it('应该显示提交时间日期范围选择器', async () => {
      await mountComponent();
      
      const datePicker = wrapper.findComponent({ name: 'ElDatePicker' });
      expect(datePicker.exists()).toBe(true);
    });

    it('应该显示重置按钮', async () => {
      await mountComponent();
      
      const resetBtn = wrapper.findAll('.filter-form .el-button').find(btn => btn.text() === '重置');
      expect(resetBtn).toBeDefined();
    });

    it('选择分类后应该触发筛选', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      
      // 模拟选择分类
      wrapper.vm.filterForm.categoryId = 'cat-001';
      wrapper.vm.handleFilter();
      await flushPromises();
      
      expect(auditApi.getAuditResources).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat-001'
        })
      );
    });

    it('输入上传者昵称后应该触发筛选', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      
      // 模拟输入上传者
      wrapper.vm.filterForm.uploader = '设计师';
      wrapper.vm.handleFilter();
      await flushPromises();
      
      expect(auditApi.getAuditResources).toHaveBeenCalledWith(
        expect.objectContaining({
          uploader: '设计师'
        })
      );
    });

    it('选择日期范围后应该触发筛选', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      
      // 模拟选择日期范围
      wrapper.vm.filterForm.dateRange = ['2024-12-01', '2024-12-31'];
      wrapper.vm.handleFilter();
      await flushPromises();
      
      expect(auditApi.getAuditResources).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2024-12-01',
          endDate: '2024-12-31'
        })
      );
    });

    it('点击重置按钮应该清空所有筛选条件', async () => {
      await mountComponent();
      
      // 设置筛选条件
      wrapper.vm.filterForm.categoryId = 'cat-001';
      wrapper.vm.filterForm.uploader = '设计师';
      wrapper.vm.filterForm.dateRange = ['2024-12-01', '2024-12-31'];
      
      // 点击重置
      wrapper.vm.handleResetFilter();
      await flushPromises();
      
      expect(wrapper.vm.filterForm.categoryId).toBe('');
      expect(wrapper.vm.filterForm.uploader).toBe('');
      expect(wrapper.vm.filterForm.dateRange).toEqual([]);
    });

    it('重置后应该重新加载数据', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      
      wrapper.vm.handleResetFilter();
      await flushPromises();
      
      expect(auditApi.getAuditResources).toHaveBeenCalled();
    });
  });


  // ==================== 任务16.3: 测试批量审核操作栏 ====================
  describe('批量审核操作栏测试 (任务16.3)', () => {
    it('未选择资源时不应该显示批量操作栏', async () => {
      await mountComponent();
      
      const batchActionsCard = wrapper.find('.batch-actions-card');
      expect(batchActionsCard.exists()).toBe(false);
    });

    it('选择资源后应该显示批量操作栏', async () => {
      await mountComponent();
      
      // 模拟选择资源
      wrapper.vm.selectedResources = [mockAuditResources[0], mockAuditResources[1]];
      await wrapper.vm.$nextTick();
      
      const batchActionsCard = wrapper.find('.batch-actions-card');
      expect(batchActionsCard.exists()).toBe(true);
    });

    it('应该显示已选择数量', async () => {
      await mountComponent();
      
      wrapper.vm.selectedResources = [mockAuditResources[0], mockAuditResources[1]];
      await wrapper.vm.$nextTick();
      
      const selectedCount = wrapper.find('.selected-count');
      expect(selectedCount.exists()).toBe(true);
      expect(selectedCount.text()).toContain('2');
    });

    it('应该显示批量通过按钮', async () => {
      await mountComponent();
      
      wrapper.vm.selectedResources = [mockAuditResources[0]];
      await wrapper.vm.$nextTick();
      
      const batchApproveBtn = wrapper.findAll('.batch-actions .el-button').find(btn => btn.text().includes('批量通过'));
      expect(batchApproveBtn).toBeDefined();
    });

    it('应该显示批量驳回按钮', async () => {
      await mountComponent();
      
      wrapper.vm.selectedResources = [mockAuditResources[0]];
      await wrapper.vm.$nextTick();
      
      const batchRejectBtn = wrapper.findAll('.batch-actions .el-button').find(btn => btn.text().includes('批量驳回'));
      expect(batchRejectBtn).toBeDefined();
    });

    it('应该显示取消选择按钮', async () => {
      await mountComponent();
      
      wrapper.vm.selectedResources = [mockAuditResources[0]];
      await wrapper.vm.$nextTick();
      
      const cancelBtn = wrapper.findAll('.batch-actions .el-button').find(btn => btn.text().includes('取消选择'));
      expect(cancelBtn).toBeDefined();
    });

    it('点击取消选择应该清空选中', async () => {
      await mountComponent();
      
      wrapper.vm.selectedResources = [mockAuditResources[0], mockAuditResources[1]];
      await wrapper.vm.$nextTick();
      
      wrapper.vm.handleClearSelection();
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.selectedResources).toEqual([]);
    });
  });

  // ==================== 任务16.4: 测试待审核列表表格 ====================
  describe('待审核列表表格测试 (任务16.4)', () => {
    it('应该显示选择列', async () => {
      await mountComponent();
      
      const selectionColumn = wrapper.findComponent({ name: 'ElTableColumn' });
      expect(selectionColumn.exists()).toBe(true);
    });

    it('应该显示资源信息列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const resourceInfoColumn = columns.find(col => col.props('label') === '资源信息');
      expect(resourceInfoColumn).toBeTruthy();
    });

    it('应该显示上传者列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const uploaderColumn = columns.find(col => col.props('label') === '上传者');
      expect(uploaderColumn).toBeTruthy();
    });

    it('应该显示提交时间列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const timeColumn = columns.find(col => col.props('label') === '提交时间');
      expect(timeColumn).toBeTruthy();
    });

    it('应该显示操作列', async () => {
      await mountComponent();
      
      const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
      const actionColumn = columns.find(col => col.props('label') === '操作');
      expect(actionColumn).toBeTruthy();
    });

    it('应该正确渲染资源列表数据', async () => {
      await mountComponent();
      
      expect(wrapper.vm.resources).toHaveLength(3);
      expect(wrapper.vm.resources[0].title).toBe('待审核资源1');
    });

    it('资源封面图应该支持预览', async () => {
      await mountComponent();
      
      const images = wrapper.findAllComponents({ name: 'ElImage' });
      expect(images.length).toBeGreaterThan(0);
    });

    it('应该显示资源分类标签', async () => {
      await mountComponent();
      
      const tags = wrapper.findAllComponents({ name: 'ElTag' });
      expect(tags.length).toBeGreaterThan(0);
    });

    it('应该显示查看详情按钮', async () => {
      await mountComponent();
      
      const viewDetailBtns = wrapper.findAll('.el-button').filter(btn => btn.text().includes('查看详情'));
      expect(viewDetailBtns.length).toBeGreaterThan(0);
    });

    it('选择变化时应该更新selectedResources', async () => {
      await mountComponent();
      
      wrapper.vm.handleSelectionChange([mockAuditResources[0]]);
      
      expect(wrapper.vm.selectedResources).toHaveLength(1);
      expect(wrapper.vm.selectedResources[0].resource_id).toBe('res-001');
    });
  });

  // ==================== 任务16.5: 测试审核列表分页 ====================
  describe('审核列表分页测试 (任务16.5)', () => {
    it('应该显示分页组件', async () => {
      await mountComponent();
      
      const pagination = wrapper.findComponent({ name: 'ElPagination' });
      expect(pagination.exists()).toBe(true);
    });

    it('应该显示总数', async () => {
      await mountComponent();
      
      const pagination = wrapper.findComponent({ name: 'ElPagination' });
      expect(pagination.props('total')).toBe(3);
    });

    it('应该支持切换每页条数', async () => {
      await mountComponent();
      
      const pagination = wrapper.findComponent({ name: 'ElPagination' });
      expect(pagination.props('pageSizes')).toEqual([10, 20, 50, 100]);
    });

    it('切换页码应该重新加载数据', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      
      wrapper.vm.pagination.page = 2;
      wrapper.vm.loadResources();
      await flushPromises();
      
      expect(auditApi.getAuditResources).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2
        })
      );
    });

    it('切换每页条数应该重新加载数据', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      
      wrapper.vm.pagination.pageSize = 50;
      wrapper.vm.loadResources();
      await flushPromises();
      
      expect(auditApi.getAuditResources).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 50
        })
      );
    });

    it('分页信息应该正确更新', async () => {
      await mountComponent();
      
      expect(wrapper.vm.pagination.total).toBe(3);
    });
  });


  // ==================== 任务16.6: 测试审核详情弹窗 ====================
  describe('审核详情弹窗测试 (任务16.6)', () => {
    it('初始状态下详情弹窗应该关闭', async () => {
      await mountComponent();
      
      expect(wrapper.vm.detailDialogVisible).toBe(false);
    });

    it('点击查看详情应该打开弹窗', async () => {
      await mountComponent();
      
      wrapper.vm.handleViewDetail(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.detailDialogVisible).toBe(true);
      expect(wrapper.vm.currentResource).toEqual(mockAuditResources[0]);
    });

    it('弹窗标题应该显示"资源详情"', async () => {
      await mountComponent();
      
      wrapper.vm.handleViewDetail(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.props('title')).toBe('资源详情');
    });

    it('应该显示基本信息区域', async () => {
      await mountComponent();
      
      wrapper.vm.handleViewDetail(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      const sectionTitles = wrapper.findAll('.section-title');
      const basicInfoSection = sectionTitles.find(el => el.text() === '基本信息');
      expect(basicInfoSection).toBeDefined();
    });

    it('应该显示预览图片区域', async () => {
      await mountComponent();
      
      wrapper.vm.handleViewDetail(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      const sectionTitles = wrapper.findAll('.section-title');
      const previewSection = sectionTitles.find(el => el.text() === '预览图片');
      expect(previewSection).toBeDefined();
    });

    it('应该显示审核操作区域', async () => {
      await mountComponent();
      
      wrapper.vm.handleViewDetail(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      const sectionTitles = wrapper.findAll('.section-title');
      const auditSection = sectionTitles.find(el => el.text() === '审核操作');
      expect(auditSection).toBeDefined();
    });

    it('应该显示审核通过按钮', async () => {
      await mountComponent();
      
      wrapper.vm.handleViewDetail(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      const approveBtn = wrapper.findAll('.audit-actions .el-button').find(btn => btn.text().includes('审核通过'));
      expect(approveBtn).toBeDefined();
    });

    it('应该显示审核驳回按钮', async () => {
      await mountComponent();
      
      wrapper.vm.handleViewDetail(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      const rejectBtn = wrapper.findAll('.audit-actions .el-button').find(btn => btn.text().includes('审核驳回'));
      expect(rejectBtn).toBeDefined();
    });

    it('getPreviewImages应该正确返回预览图列表', async () => {
      await mountComponent();
      
      const images = wrapper.vm.getPreviewImages(mockAuditResources[0]);
      
      // 应该包含封面图和预览图
      expect(images).toContain('https://example.com/cover1.jpg');
      expect(images).toContain('https://example.com/preview1.jpg');
      expect(images).toContain('https://example.com/preview2.jpg');
    });

    it('getPreviewImages应该处理空预览图的情况', async () => {
      await mountComponent();
      
      const images = wrapper.vm.getPreviewImages(mockAuditResources[2]);
      
      // 只有封面图
      expect(images).toContain('https://example.com/cover3.jpg');
      expect(images).toHaveLength(1);
    });
  });

  // ==================== 任务16.7: 测试驳回原因弹窗 ====================
  describe('驳回原因弹窗测试 (任务16.7)', () => {
    it('初始状态下驳回弹窗应该关闭', async () => {
      await mountComponent();
      
      expect(wrapper.vm.rejectDialogVisible).toBe(false);
    });

    it('点击审核驳回应该打开驳回弹窗', async () => {
      await mountComponent();
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.rejectDialogVisible).toBe(true);
    });

    it('驳回弹窗标题应该显示"审核驳回"', async () => {
      await mountComponent();
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      const dialogs = wrapper.findAllComponents({ name: 'ElDialog' });
      const rejectDialog = dialogs.find(d => d.props('title') === '审核驳回');
      expect(rejectDialog).toBeDefined();
    });

    it('应该显示驳回原因文本框', async () => {
      await mountComponent();
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      const textarea = wrapper.find('textarea');
      expect(textarea.exists()).toBe(true);
    });

    it('驳回原因应该有最小长度验证', async () => {
      await mountComponent();
      
      expect(wrapper.vm.rejectRules.reason).toBeDefined();
      const minRule = wrapper.vm.rejectRules.reason.find((r: any) => r.min);
      expect(minRule?.min).toBe(5);
    });

    it('驳回原因应该是必填项', async () => {
      await mountComponent();
      
      const requiredRule = wrapper.vm.rejectRules.reason.find((r: any) => r.required);
      expect(requiredRule?.required).toBe(true);
    });

    it('应该显示取消按钮', async () => {
      await mountComponent();
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      const cancelBtn = wrapper.findAll('.el-dialog__footer .el-button').find(btn => btn.text() === '取消');
      expect(cancelBtn).toBeDefined();
    });

    it('应该显示确认驳回按钮', async () => {
      await mountComponent();
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      const confirmBtn = wrapper.findAll('.el-dialog__footer .el-button').find(btn => btn.text().includes('确认驳回'));
      expect(confirmBtn).toBeDefined();
    });

    it('打开驳回弹窗时应该清空之前的原因', async () => {
      await mountComponent();
      
      wrapper.vm.rejectForm.reason = '之前的原因';
      wrapper.vm.handleReject(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.rejectForm.reason).toBe('');
    });
  });


  // ==================== 任务16.8: 测试通过审核功能 ====================
  describe('通过审核功能测试 (任务16.8)', () => {
    it('点击通过应该显示确认弹窗', async () => {
      await mountComponent();
      
      wrapper.vm.handleApprove(mockAuditResources[0]);
      await flushPromises();
      
      expect(ElMessageBox.confirm).toHaveBeenCalled();
    });

    it('确认通过应该调用审核API', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      vi.mocked(ElMessageBox.confirm).mockResolvedValue(true as any);
      
      await wrapper.vm.handleApprove(mockAuditResources[0]);
      await flushPromises();
      
      expect(auditApi.auditResource).toHaveBeenCalledWith(
        'res-001',
        { action: 'approve' }
      );
    });

    it('通过成功应该显示成功消息', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      vi.mocked(ElMessageBox.confirm).mockResolvedValue(true as any);
      
      await wrapper.vm.handleApprove(mockAuditResources[0]);
      await flushPromises();
      
      expect(ElMessage.success).toHaveBeenCalledWith('审核通过成功');
    });

    it('通过成功应该关闭详情弹窗', async () => {
      await mountComponent();
      
      wrapper.vm.detailDialogVisible = true;
      vi.mocked(ElMessageBox.confirm).mockResolvedValue(true as any);
      
      await wrapper.vm.handleApprove(mockAuditResources[0]);
      await flushPromises();
      
      expect(wrapper.vm.detailDialogVisible).toBe(false);
    });

    it('通过成功应该重新加载列表', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      vi.mocked(ElMessageBox.confirm).mockResolvedValue(true as any);
      
      await wrapper.vm.handleApprove(mockAuditResources[0]);
      await flushPromises();
      
      expect(auditApi.getAuditResources).toHaveBeenCalled();
    });

    it('取消确认不应该调用审核API', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      vi.mocked(ElMessageBox.confirm).mockRejectedValue('cancel');
      
      await wrapper.vm.handleApprove(mockAuditResources[0]);
      await flushPromises();
      
      expect(auditApi.auditResource).not.toHaveBeenCalled();
    });

    it('审核失败应该显示错误消息', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      vi.mocked(ElMessageBox.confirm).mockResolvedValue(true as any);
      vi.mocked(auditApi.auditResource).mockRejectedValue(new Error('审核失败'));
      
      await wrapper.vm.handleApprove(mockAuditResources[0]);
      await flushPromises();
      
      expect(ElMessage.error).toHaveBeenCalled();
    });
  });

  // ==================== 任务16.9: 测试驳回审核功能 ====================
  describe('驳回审核功能测试 (任务16.9)', () => {
    it('点击驳回应该打开驳回原因弹窗', async () => {
      await mountComponent();
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.rejectDialogVisible).toBe(true);
    });

    it('应该记录当前驳回的资源', async () => {
      await mountComponent();
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.currentRejectResource).toEqual(mockAuditResources[0]);
    });

    it('单个驳回时isBatchReject应该为false', async () => {
      await mountComponent();
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.isBatchReject).toBe(false);
    });

    it('确认驳回应该调用审核API', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      wrapper.vm.rejectForm.reason = '内容不符合规范，请修改后重新提交';
      
      // Mock表单验证通过
      wrapper.vm.rejectFormRef = {
        validate: vi.fn().mockResolvedValue(true)
      } as any;
      
      await wrapper.vm.handleConfirmReject();
      await flushPromises();
      
      expect(auditApi.auditResource).toHaveBeenCalledWith(
        'res-001',
        {
          action: 'reject',
          reason: '内容不符合规范，请修改后重新提交'
        }
      );
    });

    it('驳回成功应该显示成功消息', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      wrapper.vm.rejectForm.reason = '内容不符合规范';
      wrapper.vm.rejectFormRef = {
        validate: vi.fn().mockResolvedValue(true)
      } as any;
      
      await wrapper.vm.handleConfirmReject();
      await flushPromises();
      
      expect(ElMessage.success).toHaveBeenCalledWith('审核驳回成功');
    });

    it('驳回成功应该关闭驳回弹窗', async () => {
      await mountComponent();
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      wrapper.vm.rejectForm.reason = '内容不符合规范';
      wrapper.vm.rejectFormRef = {
        validate: vi.fn().mockResolvedValue(true)
      } as any;
      
      await wrapper.vm.handleConfirmReject();
      await flushPromises();
      
      expect(wrapper.vm.rejectDialogVisible).toBe(false);
    });

    it('驳回成功应该关闭详情弹窗', async () => {
      await mountComponent();
      
      wrapper.vm.detailDialogVisible = true;
      wrapper.vm.handleReject(mockAuditResources[0]);
      wrapper.vm.rejectForm.reason = '内容不符合规范';
      wrapper.vm.rejectFormRef = {
        validate: vi.fn().mockResolvedValue(true)
      } as any;
      
      await wrapper.vm.handleConfirmReject();
      await flushPromises();
      
      expect(wrapper.vm.detailDialogVisible).toBe(false);
    });

    it('驳回成功应该重新加载列表', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      wrapper.vm.rejectForm.reason = '内容不符合规范';
      wrapper.vm.rejectFormRef = {
        validate: vi.fn().mockResolvedValue(true)
      } as any;
      
      await wrapper.vm.handleConfirmReject();
      await flushPromises();
      
      expect(auditApi.getAuditResources).toHaveBeenCalled();
    });

    it('驳回失败应该显示错误消息', async () => {
      await mountComponent();
      
      vi.clearAllMocks();
      vi.mocked(auditApi.auditResource).mockRejectedValue(new Error('驳回失败'));
      
      wrapper.vm.handleReject(mockAuditResources[0]);
      wrapper.vm.rejectForm.reason = '内容不符合规范';
      wrapper.vm.rejectFormRef = {
        validate: vi.fn().mockResolvedValue(true)
      } as any;
      
      await wrapper.vm.handleConfirmReject();
      await flushPromises();
      
      expect(ElMessage.error).toHaveBeenCalled();
    });
  });


  // ==================== 任务16.10: 测试批量审核功能 ====================
  describe('批量审核功能测试 (任务16.10)', () => {
    describe('批量通过', () => {
      it('未选择资源时批量通过应该显示警告', async () => {
        await mountComponent();
        
        vi.clearAllMocks();
        wrapper.vm.selectedResources = [];
        
        await wrapper.vm.handleBatchApprove();
        await flushPromises();
        
        expect(ElMessage.warning).toHaveBeenCalledWith('请先选择要审核的资源');
      });

      it('选择资源后批量通过应该显示确认弹窗', async () => {
        await mountComponent();
        
        wrapper.vm.selectedResources = [mockAuditResources[0], mockAuditResources[1]];
        
        await wrapper.vm.handleBatchApprove();
        await flushPromises();
        
        expect(ElMessageBox.confirm).toHaveBeenCalled();
      });

      it('确认批量通过应该调用审核API多次', async () => {
        await mountComponent();
        
        vi.clearAllMocks();
        vi.mocked(ElMessageBox.confirm).mockResolvedValue(true as any);
        
        wrapper.vm.selectedResources = [mockAuditResources[0], mockAuditResources[1]];
        
        await wrapper.vm.handleBatchApprove();
        await flushPromises();
        
        expect(auditApi.auditResource).toHaveBeenCalledTimes(2);
        expect(auditApi.auditResource).toHaveBeenCalledWith('res-001', { action: 'approve' });
        expect(auditApi.auditResource).toHaveBeenCalledWith('res-002', { action: 'approve' });
      });

      it('批量通过成功应该显示成功消息', async () => {
        await mountComponent();
        
        vi.clearAllMocks();
        vi.mocked(ElMessageBox.confirm).mockResolvedValue(true as any);
        
        wrapper.vm.selectedResources = [mockAuditResources[0], mockAuditResources[1]];
        
        await wrapper.vm.handleBatchApprove();
        await flushPromises();
        
        expect(ElMessage.success).toHaveBeenCalledWith('成功通过 2 个资源');
      });

      it('批量通过成功应该清空选中', async () => {
        await mountComponent();
        
        vi.mocked(ElMessageBox.confirm).mockResolvedValue(true as any);
        
        wrapper.vm.selectedResources = [mockAuditResources[0], mockAuditResources[1]];
        
        await wrapper.vm.handleBatchApprove();
        await flushPromises();
        
        expect(wrapper.vm.selectedResources).toEqual([]);
      });

      it('批量通过成功应该重新加载列表', async () => {
        await mountComponent();
        
        vi.clearAllMocks();
        vi.mocked(ElMessageBox.confirm).mockResolvedValue(true as any);
        
        wrapper.vm.selectedResources = [mockAuditResources[0]];
        
        await wrapper.vm.handleBatchApprove();
        await flushPromises();
        
        expect(auditApi.getAuditResources).toHaveBeenCalled();
      });

      it('取消批量通过不应该调用API', async () => {
        await mountComponent();
        
        vi.clearAllMocks();
        vi.mocked(ElMessageBox.confirm).mockRejectedValue('cancel');
        
        wrapper.vm.selectedResources = [mockAuditResources[0]];
        
        await wrapper.vm.handleBatchApprove();
        await flushPromises();
        
        expect(auditApi.auditResource).not.toHaveBeenCalled();
      });
    });

    describe('批量驳回', () => {
      it('未选择资源时批量驳回应该显示警告', async () => {
        await mountComponent();
        
        vi.clearAllMocks();
        wrapper.vm.selectedResources = [];
        
        wrapper.vm.handleBatchReject();
        await wrapper.vm.$nextTick();
        
        expect(ElMessage.warning).toHaveBeenCalledWith('请先选择要驳回的资源');
      });

      it('选择资源后批量驳回应该打开驳回弹窗', async () => {
        await mountComponent();
        
        wrapper.vm.selectedResources = [mockAuditResources[0], mockAuditResources[1]];
        
        wrapper.vm.handleBatchReject();
        await wrapper.vm.$nextTick();
        
        expect(wrapper.vm.rejectDialogVisible).toBe(true);
      });

      it('批量驳回时isBatchReject应该为true', async () => {
        await mountComponent();
        
        wrapper.vm.selectedResources = [mockAuditResources[0], mockAuditResources[1]];
        
        wrapper.vm.handleBatchReject();
        await wrapper.vm.$nextTick();
        
        expect(wrapper.vm.isBatchReject).toBe(true);
      });

      it('确认批量驳回应该调用审核API多次', async () => {
        await mountComponent();
        
        vi.clearAllMocks();
        
        wrapper.vm.selectedResources = [mockAuditResources[0], mockAuditResources[1]];
        wrapper.vm.handleBatchReject();
        wrapper.vm.rejectForm.reason = '批量驳回原因';
        wrapper.vm.rejectFormRef = {
          validate: vi.fn().mockResolvedValue(true)
        } as any;
        
        await wrapper.vm.handleConfirmReject();
        await flushPromises();
        
        expect(auditApi.auditResource).toHaveBeenCalledTimes(2);
        expect(auditApi.auditResource).toHaveBeenCalledWith('res-001', { action: 'reject', reason: '批量驳回原因' });
        expect(auditApi.auditResource).toHaveBeenCalledWith('res-002', { action: 'reject', reason: '批量驳回原因' });
      });

      it('批量驳回成功应该显示成功消息', async () => {
        await mountComponent();
        
        vi.clearAllMocks();
        
        wrapper.vm.selectedResources = [mockAuditResources[0], mockAuditResources[1]];
        wrapper.vm.handleBatchReject();
        wrapper.vm.rejectForm.reason = '批量驳回原因';
        wrapper.vm.rejectFormRef = {
          validate: vi.fn().mockResolvedValue(true)
        } as any;
        
        await wrapper.vm.handleConfirmReject();
        await flushPromises();
        
        expect(ElMessage.success).toHaveBeenCalledWith('成功驳回 2 个资源');
      });

      it('批量驳回成功应该清空选中', async () => {
        await mountComponent();
        
        wrapper.vm.selectedResources = [mockAuditResources[0], mockAuditResources[1]];
        wrapper.vm.handleBatchReject();
        wrapper.vm.rejectForm.reason = '批量驳回原因';
        wrapper.vm.rejectFormRef = {
          validate: vi.fn().mockResolvedValue(true)
        } as any;
        
        await wrapper.vm.handleConfirmReject();
        await flushPromises();
        
        expect(wrapper.vm.selectedResources).toEqual([]);
      });

      it('批量驳回成功应该关闭驳回弹窗', async () => {
        await mountComponent();
        
        wrapper.vm.selectedResources = [mockAuditResources[0]];
        wrapper.vm.handleBatchReject();
        wrapper.vm.rejectForm.reason = '批量驳回原因';
        wrapper.vm.rejectFormRef = {
          validate: vi.fn().mockResolvedValue(true)
        } as any;
        
        await wrapper.vm.handleConfirmReject();
        await flushPromises();
        
        expect(wrapper.vm.rejectDialogVisible).toBe(false);
      });
    });
  });

  // ==================== 工具函数测试 ====================
  describe('工具函数测试', () => {
    it('formatFileSize应该正确格式化文件大小', async () => {
      await mountComponent();
      
      expect(wrapper.vm.formatFileSize(0)).toBe('0 B');
      expect(wrapper.vm.formatFileSize(1024)).toBe('1 KB');
      expect(wrapper.vm.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(wrapper.vm.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('formatDate应该正确格式化日期', async () => {
      await mountComponent();
      
      const result = wrapper.vm.formatDate('2024-12-20T10:30:00.000Z');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    });

    it('formatDate应该处理空值', async () => {
      await mountComponent();
      
      expect(wrapper.vm.formatDate('')).toBe('-');
      expect(wrapper.vm.formatDate(null)).toBe('-');
    });

    it('pendingCount应该返回待审核资源数量', async () => {
      await mountComponent();
      
      expect(wrapper.vm.pendingCount).toBe(3);
    });
  });

  // ==================== 错误处理测试 ====================
  describe('错误处理测试', () => {
    it('加载资源失败应该显示错误消息', async () => {
      vi.mocked(auditApi.getAuditResources).mockRejectedValue(new Error('加载失败'));
      
      await mountComponent();
      await flushPromises();
      
      expect(ElMessage.error).toHaveBeenCalled();
    });

    it('加载资源失败后loading状态应该恢复', async () => {
      vi.mocked(auditApi.getAuditResources).mockRejectedValue(new Error('加载失败'));
      
      await mountComponent();
      await flushPromises();
      
      expect(wrapper.vm.loading).toBe(false);
    });

    it('加载分类失败不应该影响页面显示', async () => {
      vi.mocked(contentApi.getCategories).mockRejectedValue(new Error('加载分类失败'));
      
      await mountComponent();
      await flushPromises();
      
      // 页面应该正常显示
      expect(wrapper.find('.audit-page').exists()).toBe(true);
    });
  });

  // ==================== 加载状态测试 ====================
  describe('加载状态测试', () => {
    it('加载数据时应该显示loading状态', async () => {
      // 延迟返回数据
      vi.mocked(auditApi.getAuditResources).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockAuditResponse as any), 100))
      );
      
      wrapper = mount(AuditPage, {
        global: {
          plugins: [router, ElementPlus],
          stubs: {
            'el-icon': true
          }
        }
      });
      
      expect(wrapper.vm.loading).toBe(true);
      
      await flushPromises();
    });

    it('数据加载完成后loading状态应该为false', async () => {
      await mountComponent();
      
      expect(wrapper.vm.loading).toBe(false);
    });

    it('提交审核时应该显示submitting状态', async () => {
      await mountComponent();
      
      vi.mocked(ElMessageBox.confirm).mockResolvedValue(true as any);
      vi.mocked(auditApi.auditResource).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { success: true } } as any), 100))
      );
      
      const approvePromise = wrapper.vm.handleApprove(mockAuditResources[0]);
      
      // 等待确认弹窗
      await flushPromises();
      
      expect(wrapper.vm.submitting).toBe(true);
      
      await approvePromise;
      await flushPromises();
    });
  });
});
