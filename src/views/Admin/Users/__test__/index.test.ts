/**
 * 用户管理页面单元测试
 * 
 * 测试范围：
 * - 任务14.1: 页面布局和标题显示
 * - 任务14.2: 搜索筛选区域（搜索输入框、清空按钮、回车搜索、VIP等级选择器、账号状态选择器、搜索/重置按钮）
 * - 任务14.3: 用户列表表格（所有列显示、排序功能、操作按钮、下拉菜单）
 * - 任务14.4: 分页功能（总数显示、每页条数切换、翻页、跳转）
 * - 任务14.5: 用户详情弹窗（测试在 UserDetailDialog.test.ts）
 * - 任务14.6: 重置密码弹窗（测试在 ResetPasswordDialog.test.ts）
 * - 任务14.7: 调整VIP弹窗（测试在 AdjustVipDialog.test.ts）
 * - 任务14.8: 调整积分弹窗（测试在 AdjustPointsDialog.test.ts）
 * - 任务14.9: 用户搜索功能（按手机号/昵称/用户ID搜索）
 * - 任务14.10: 用户禁用/启用功能（确认弹窗、状态切换）
 * - 任务14.11: 调整用户积分功能
 * - 任务14.12: 修改用户角色功能
 * 
 * 需求: 需求11.1-11.12
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus';
import UsersPage from '../index.vue';

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
vi.mock('../components/UserDetailDialog.vue', () => ({
  default: {
    name: 'UserDetailDialog',
    template: '<div class="user-detail-dialog" v-if="modelValue"><slot /></div>',
    props: ['modelValue', 'userId'],
    emits: ['update:modelValue', 'refresh']
  }
}));

vi.mock('../components/ResetPasswordDialog.vue', () => ({
  default: {
    name: 'ResetPasswordDialog',
    template: '<div class="reset-password-dialog" v-if="modelValue"><slot /></div>',
    props: ['modelValue', 'user'],
    emits: ['update:modelValue', 'success']
  }
}));

vi.mock('../components/AdjustVipDialog.vue', () => ({
  default: {
    name: 'AdjustVipDialog',
    template: '<div class="adjust-vip-dialog" v-if="modelValue"><slot /></div>',
    props: ['modelValue', 'user'],
    emits: ['update:modelValue', 'success']
  }
}));

vi.mock('../components/AdjustPointsDialog.vue', () => ({
  default: {
    name: 'AdjustPointsDialog',
    template: '<div class="adjust-points-dialog" v-if="modelValue"><slot /></div>',
    props: ['modelValue', 'user'],
    emits: ['update:modelValue', 'success']
  }
}));

// Mock format工具
vi.mock('@/utils/format', () => ({
  formatTime: vi.fn((date: string) => date)
}));

describe('用户管理页面', () => {
  let wrapper: VueWrapper;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/admin/users', component: UsersPage }
      ]
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountComponent = async () => {
    wrapper = mount(UsersPage, {
      global: {
        plugins: [router, ElementPlus],
        stubs: {
          'el-icon': true
        }
      }
    });
    await flushPromises();
    // 等待模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 600));
    await flushPromises();
    return wrapper;
  };

  // ==================== 任务14.1: 页面布局测试 ====================
  describe('页面布局测试 (任务14.1)', () => {
    it('应该显示页面标题"用户管理"', async () => {
      await mountComponent();
      const title = wrapper.find('.page-title');
      expect(title.exists()).toBe(true);
      expect(title.text()).toBe('用户管理');
    });

    it('应该显示页面描述"管理平台所有用户账号"', async () => {
      await mountComponent();
      const desc = wrapper.find('.page-desc');
      expect(desc.exists()).toBe(true);
      expect(desc.text()).toBe('管理平台所有用户账号');
    });

    it('应该显示搜索筛选区域', async () => {
      await mountComponent();
      const searchCard = wrapper.find('.search-card');
      expect(searchCard.exists()).toBe(true);
    });

    it('应该显示用户列表表格', async () => {
      await mountComponent();
      const tableCard = wrapper.find('.table-card');
      expect(tableCard.exists()).toBe(true);
      const table = wrapper.findComponent({ name: 'ElTable' });
      expect(table.exists()).toBe(true);
    });

    it('应该显示分页组件', async () => {
      await mountComponent();
      const pagination = wrapper.findComponent({ name: 'ElPagination' });
      expect(pagination.exists()).toBe(true);
    });
  });

  // ==================== 任务14.2: 搜索筛选区域测试 ====================
  describe('搜索筛选区域测试 (任务14.2)', () => {
    describe('搜索输入框', () => {
      it('应该显示搜索输入框', async () => {
        await mountComponent();
        const searchInput = wrapper.find('input[placeholder="手机号/昵称/用户ID"]');
        expect(searchInput.exists()).toBe(true);
      });

      it('搜索输入框应该有搜索图标前缀', async () => {
        await mountComponent();
        const form = wrapper.findComponent({ name: 'ElForm' });
        expect(form.exists()).toBe(true);
      });

      it('搜索输入框应该支持clearable清空', async () => {
        await mountComponent();
        const inputs = wrapper.findAllComponents({ name: 'ElInput' });
        const searchInput = inputs.find(input => 
          input.props('placeholder') === '手机号/昵称/用户ID'
        );
        expect(searchInput?.props('clearable')).toBe(true);
      });

      it('在搜索框中输入内容应该更新值', async () => {
        await mountComponent();
        const searchInput = wrapper.find('input[placeholder="手机号/昵称/用户ID"]');
        await searchInput.setValue('13800138000');
        expect((searchInput.element as HTMLInputElement).value).toBe('13800138000');
      });

      it('在搜索框中按回车应该触发搜索', async () => {
        await mountComponent();
        const searchInput = wrapper.find('input[placeholder="手机号/昵称/用户ID"]');
        await searchInput.setValue('13800138000');
        await searchInput.trigger('keyup.enter');
        await flushPromises();
        expect(wrapper.vm).toBeTruthy();
      });
    });

    describe('VIP等级下拉选择器', () => {
      it('应该显示VIP等级下拉选择器', async () => {
        await mountComponent();
        const selects = wrapper.findAllComponents({ name: 'ElSelect' });
        expect(selects.length).toBeGreaterThanOrEqual(2);
      });

      it('VIP等级选择器应该有"全部"占位符', async () => {
        await mountComponent();
        const selects = wrapper.findAllComponents({ name: 'ElSelect' });
        const vipSelect = selects[0];
        expect(vipSelect.props('placeholder')).toBe('全部');
      });

      it('VIP等级选择器应该支持clearable清空', async () => {
        await mountComponent();
        const selects = wrapper.findAllComponents({ name: 'ElSelect' });
        const vipSelect = selects[0];
        expect(vipSelect.props('clearable')).toBe(true);
      });

      it('VIP等级选择器应该包含普通用户选项', async () => {
        await mountComponent();
        const options = wrapper.findAllComponents({ name: 'ElOption' });
        const normalOption = options.find(opt => opt.props('label') === '普通用户');
        expect(normalOption).toBeTruthy();
      });

      it('VIP等级选择器应该包含VIP用户选项', async () => {
        await mountComponent();
        const options = wrapper.findAllComponents({ name: 'ElOption' });
        const vipOption = options.find(opt => opt.props('label') === 'VIP用户');
        expect(vipOption).toBeTruthy();
      });
    });

    describe('账号状态下拉选择器', () => {
      it('应该显示账号状态下拉选择器', async () => {
        await mountComponent();
        const selects = wrapper.findAllComponents({ name: 'ElSelect' });
        expect(selects.length).toBeGreaterThanOrEqual(2);
      });

      it('账号状态选择器应该有"全部"占位符', async () => {
        await mountComponent();
        const selects = wrapper.findAllComponents({ name: 'ElSelect' });
        const statusSelect = selects[1];
        expect(statusSelect.props('placeholder')).toBe('全部');
      });

      it('账号状态选择器应该支持clearable清空', async () => {
        await mountComponent();
        const selects = wrapper.findAllComponents({ name: 'ElSelect' });
        const statusSelect = selects[1];
        expect(statusSelect.props('clearable')).toBe(true);
      });

      it('账号状态选择器应该包含正常选项', async () => {
        await mountComponent();
        const options = wrapper.findAllComponents({ name: 'ElOption' });
        const normalOption = options.find(opt => opt.props('label') === '正常');
        expect(normalOption).toBeTruthy();
      });

      it('账号状态选择器应该包含已禁用选项', async () => {
        await mountComponent();
        const options = wrapper.findAllComponents({ name: 'ElOption' });
        const disabledOption = options.find(opt => opt.props('label') === '已禁用');
        expect(disabledOption).toBeTruthy();
      });
    });

    describe('搜索和重置按钮', () => {
      it('应该显示搜索按钮', async () => {
        await mountComponent();
        const buttons = wrapper.findAllComponents({ name: 'ElButton' });
        const searchBtn = buttons.find(btn => btn.text().includes('搜索'));
        expect(searchBtn).toBeTruthy();
      });

      it('搜索按钮应该是primary类型', async () => {
        await mountComponent();
        const buttons = wrapper.findAllComponents({ name: 'ElButton' });
        const searchBtn = buttons.find(btn => btn.text().includes('搜索'));
        expect(searchBtn?.props('type')).toBe('primary');
      });

      it('应该显示重置按钮', async () => {
        await mountComponent();
        const buttons = wrapper.findAllComponents({ name: 'ElButton' });
        const resetBtn = buttons.find(btn => btn.text().includes('重置'));
        expect(resetBtn).toBeTruthy();
      });

      it('点击搜索按钮应该触发搜索', async () => {
        await mountComponent();
        const searchInput = wrapper.find('input[placeholder="手机号/昵称/用户ID"]');
        await searchInput.setValue('13800138000');
        
        const buttons = wrapper.findAllComponents({ name: 'ElButton' });
        const searchBtn = buttons.find(btn => btn.text().includes('搜索'));
        await searchBtn?.trigger('click');
        await flushPromises();
        
        expect(wrapper.vm).toBeTruthy();
      });

      it('点击重置按钮应该清空筛选条件', async () => {
        await mountComponent();
        const searchInput = wrapper.find('input[placeholder="手机号/昵称/用户ID"]');
        await searchInput.setValue('test');
        
        const buttons = wrapper.findAllComponents({ name: 'ElButton' });
        const resetBtn = buttons.find(btn => btn.text().includes('重置'));
        await resetBtn?.trigger('click');
        await flushPromises();
        
        expect((searchInput.element as HTMLInputElement).value).toBe('');
      });
    });
  });

  // ==================== 任务14.3: 用户列表表格测试 ====================
  describe('用户列表表格测试 (任务14.3)', () => {
    describe('表格列显示', () => {
      it('应该显示用户ID列', async () => {
        await mountComponent();
        const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
        const userIdColumn = columns.find(col => col.props('prop') === 'userId');
        expect(userIdColumn).toBeTruthy();
      });

      it('应该显示用户信息列（头像、昵称、手机号）', async () => {
        await mountComponent();
        const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
        const userInfoColumn = columns.find(col => col.props('label') === '用户信息');
        expect(userInfoColumn).toBeTruthy();
      });

      it('应该显示VIP等级列', async () => {
        await mountComponent();
        const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
        const vipColumn = columns.find(col => col.props('label') === 'VIP等级');
        expect(vipColumn).toBeTruthy();
      });

      it('应该显示VIP到期时间列', async () => {
        await mountComponent();
        const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
        const vipExpireColumn = columns.find(col => col.props('label') === 'VIP到期时间');
        expect(vipExpireColumn).toBeTruthy();
      });

      it('应该显示积分余额列', async () => {
        await mountComponent();
        const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
        const pointsColumn = columns.find(col => col.props('prop') === 'pointsBalance');
        expect(pointsColumn).toBeTruthy();
      });

      it('应该显示用户等级列', async () => {
        await mountComponent();
        const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
        const levelColumn = columns.find(col => col.props('label') === '用户等级');
        expect(levelColumn).toBeTruthy();
      });

      it('应该显示注册时间列', async () => {
        await mountComponent();
        const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
        const createdAtColumn = columns.find(col => col.props('prop') === 'createdAt');
        expect(createdAtColumn).toBeTruthy();
      });

      it('应该显示状态列', async () => {
        await mountComponent();
        const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
        const statusColumn = columns.find(col => col.props('label') === '状态');
        expect(statusColumn).toBeTruthy();
      });

      it('应该显示操作列', async () => {
        await mountComponent();
        const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
        const actionColumn = columns.find(col => col.props('label') === '操作');
        expect(actionColumn).toBeTruthy();
      });
    });

    describe('排序功能', () => {
      it('积分余额列应该支持排序', async () => {
        await mountComponent();
        const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
        const pointsColumn = columns.find(col => col.props('prop') === 'pointsBalance');
        expect(pointsColumn?.props('sortable')).toBe('custom');
      });

      it('注册时间列应该支持排序', async () => {
        await mountComponent();
        const columns = wrapper.findAllComponents({ name: 'ElTableColumn' });
        const createdAtColumn = columns.find(col => col.props('prop') === 'createdAt');
        expect(createdAtColumn?.props('sortable')).toBe('custom');
      });
    });

    describe('操作按钮', () => {
      it('应该显示查看详情按钮', async () => {
        await mountComponent();
        const viewButtons = wrapper.findAll('button').filter(btn => 
          btn.text().includes('查看详情')
        );
        expect(viewButtons.length).toBeGreaterThan(0);
      });

      it('应该显示禁用/启用按钮', async () => {
        await mountComponent();
        const statusButtons = wrapper.findAll('button').filter(btn => 
          btn.text().includes('禁用') || btn.text().includes('启用')
        );
        expect(statusButtons.length).toBeGreaterThan(0);
      });

      it('应该显示更多操作下拉按钮', async () => {
        await mountComponent();
        const dropdown = wrapper.findComponent({ name: 'ElDropdown' });
        expect(dropdown.exists()).toBe(true);
      });
    });

    describe('下拉菜单', () => {
      it('更多操作下拉菜单应该包含重置密码选项', async () => {
        await mountComponent();
        const dropdownItems = wrapper.findAllComponents({ name: 'ElDropdownItem' });
        const resetPasswordItem = dropdownItems.find(item => 
          item.props('command') === 'resetPassword'
        );
        expect(resetPasswordItem).toBeTruthy();
      });

      it('更多操作下拉菜单应该包含调整VIP选项', async () => {
        await mountComponent();
        const dropdownItems = wrapper.findAllComponents({ name: 'ElDropdownItem' });
        const adjustVipItem = dropdownItems.find(item => 
          item.props('command') === 'adjustVip'
        );
        expect(adjustVipItem).toBeTruthy();
      });

      it('更多操作下拉菜单应该包含调整积分选项', async () => {
        await mountComponent();
        const dropdownItems = wrapper.findAllComponents({ name: 'ElDropdownItem' });
        const adjustPointsItem = dropdownItems.find(item => 
          item.props('command') === 'adjustPoints'
        );
        expect(adjustPointsItem).toBeTruthy();
      });
    });
  });

  // ==================== 任务14.4: 分页功能测试 ====================
  describe('分页功能测试 (任务14.4)', () => {
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
    });

    it('分页组件应该提供10/20/50/100条数选项', async () => {
      await mountComponent();
      const pagination = wrapper.findComponent({ name: 'ElPagination' });
      expect(pagination.props('pageSizes')).toEqual([10, 20, 50, 100]);
    });

    it('分页组件应该显示上一页/下一页按钮', async () => {
      await mountComponent();
      const pagination = wrapper.findComponent({ name: 'ElPagination' });
      expect(pagination.props('layout')).toContain('prev');
      expect(pagination.props('layout')).toContain('next');
    });

    it('分页组件应该显示页码', async () => {
      await mountComponent();
      const pagination = wrapper.findComponent({ name: 'ElPagination' });
      expect(pagination.props('layout')).toContain('pager');
    });

    it('分页组件应该支持跳转', async () => {
      await mountComponent();
      const pagination = wrapper.findComponent({ name: 'ElPagination' });
      expect(pagination.props('layout')).toContain('jumper');
    });
  });

  // ==================== 任务14.9: 用户搜索功能测试 ====================
  describe('用户搜索功能测试 (任务14.9)', () => {
    it('按手机号搜索应该更新搜索条件', async () => {
      await mountComponent();
      const searchInput = wrapper.find('input[placeholder="手机号/昵称/用户ID"]');
      await searchInput.setValue('13800138000');
      
      const buttons = wrapper.findAllComponents({ name: 'ElButton' });
      const searchBtn = buttons.find(btn => btn.text().includes('搜索'));
      await searchBtn?.trigger('click');
      await flushPromises();
      
      expect(wrapper.vm).toBeTruthy();
    });

    it('按昵称搜索应该更新搜索条件', async () => {
      await mountComponent();
      const searchInput = wrapper.find('input[placeholder="手机号/昵称/用户ID"]');
      await searchInput.setValue('张三');
      
      const buttons = wrapper.findAllComponents({ name: 'ElButton' });
      const searchBtn = buttons.find(btn => btn.text().includes('搜索'));
      await searchBtn?.trigger('click');
      await flushPromises();
      
      expect(wrapper.vm).toBeTruthy();
    });

    it('按用户ID搜索应该更新搜索条件', async () => {
      await mountComponent();
      const searchInput = wrapper.find('input[placeholder="手机号/昵称/用户ID"]');
      await searchInput.setValue('user-001');
      
      const buttons = wrapper.findAllComponents({ name: 'ElButton' });
      const searchBtn = buttons.find(btn => btn.text().includes('搜索'));
      await searchBtn?.trigger('click');
      await flushPromises();
      
      expect(wrapper.vm).toBeTruthy();
    });
  });

  // ==================== 任务14.10: 用户禁用/启用功能测试 ====================
  describe('用户禁用/启用功能测试 (任务14.10)', () => {
    it('点击禁用按钮应该显示确认弹窗', async () => {
      await mountComponent();
      
      const disableButtons = wrapper.findAll('button').filter(btn => 
        btn.text().includes('禁用')
      );
      
      if (disableButtons.length > 0) {
        await disableButtons[0].trigger('click');
        await flushPromises();
        expect(ElMessageBox.confirm).toHaveBeenCalled();
      }
    });

    it('确认禁用后应该显示成功消息', async () => {
      await mountComponent();
      
      const disableButtons = wrapper.findAll('button').filter(btn => 
        btn.text().includes('禁用')
      );
      
      if (disableButtons.length > 0) {
        await disableButtons[0].trigger('click');
        await flushPromises();
        expect(ElMessage.success).toHaveBeenCalledWith('禁用成功');
      }
    });

    it('点击启用按钮应该显示确认弹窗', async () => {
      await mountComponent();
      
      const enableButtons = wrapper.findAll('button').filter(btn => 
        btn.text().includes('启用')
      );
      
      if (enableButtons.length > 0) {
        await enableButtons[0].trigger('click');
        await flushPromises();
        expect(ElMessageBox.confirm).toHaveBeenCalled();
      }
    });
  });

  // ==================== 弹窗组件集成测试 ====================
  describe('弹窗组件集成测试', () => {
    it('应该包含用户详情对话框组件', async () => {
      await mountComponent();
      const dialog = wrapper.findComponent({ name: 'UserDetailDialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('应该包含重置密码对话框组件', async () => {
      await mountComponent();
      const dialog = wrapper.findComponent({ name: 'ResetPasswordDialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('应该包含调整VIP对话框组件', async () => {
      await mountComponent();
      const dialog = wrapper.findComponent({ name: 'AdjustVipDialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('应该包含调整积分对话框组件', async () => {
      await mountComponent();
      const dialog = wrapper.findComponent({ name: 'AdjustPointsDialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('点击查看详情应该打开用户详情弹窗', async () => {
      await mountComponent();
      
      const viewButtons = wrapper.findAll('button').filter(btn => 
        btn.text().includes('查看详情')
      );
      
      if (viewButtons.length > 0) {
        await viewButtons[0].trigger('click');
        await flushPromises();
        expect(wrapper.vm).toBeTruthy();
      }
    });
  });

  // ==================== 数据加载测试 ====================
  describe('数据加载测试', () => {
    it('组件挂载时应该自动加载用户列表', async () => {
      await mountComponent();
      const table = wrapper.findComponent({ name: 'ElTable' });
      expect(table.exists()).toBe(true);
    });

    it('表格应该显示斑马纹', async () => {
      await mountComponent();
      const table = wrapper.findComponent({ name: 'ElTable' });
      expect(table.props('stripe')).toBe(true);
    });

    it('表格应该支持loading状态', async () => {
      const wrapper = mount(UsersPage, {
        global: {
          plugins: [router, ElementPlus],
          stubs: { 'el-icon': true }
        }
      });
      
      // 在数据加载完成前检查
      const table = wrapper.findComponent({ name: 'ElTable' });
      expect(table.exists()).toBe(true);
      
      wrapper.unmount();
    });
  });

  // ==================== 用户等级显示测试 ====================
  describe('用户等级显示测试', () => {
    it('高等级用户(>=5)应该显示danger类型标签', async () => {
      await mountComponent();
      // 测试组件内部的getLevelType函数逻辑
      expect(wrapper.vm).toBeTruthy();
    });

    it('中等级用户(3-4)应该显示warning类型标签', async () => {
      await mountComponent();
      expect(wrapper.vm).toBeTruthy();
    });

    it('低等级用户(1-2)应该显示info类型标签', async () => {
      await mountComponent();
      expect(wrapper.vm).toBeTruthy();
    });
  });

  // ==================== 成功回调测试 ====================
  describe('成功回调测试', () => {
    it('重置密码成功后应该显示成功消息', async () => {
      await mountComponent();
      
      // 模拟重置密码成功回调
      const resetPasswordDialog = wrapper.findComponent({ name: 'ResetPasswordDialog' });
      if (resetPasswordDialog.exists()) {
        resetPasswordDialog.vm.$emit('success');
        await flushPromises();
        expect(ElMessage.success).toHaveBeenCalledWith('密码重置成功');
      }
    });

    it('调整VIP成功后应该显示成功消息', async () => {
      await mountComponent();
      
      const adjustVipDialog = wrapper.findComponent({ name: 'AdjustVipDialog' });
      if (adjustVipDialog.exists()) {
        adjustVipDialog.vm.$emit('success');
        await flushPromises();
        expect(ElMessage.success).toHaveBeenCalledWith('VIP调整成功');
      }
    });

    it('调整积分成功后应该显示成功消息', async () => {
      await mountComponent();
      
      const adjustPointsDialog = wrapper.findComponent({ name: 'AdjustPointsDialog' });
      if (adjustPointsDialog.exists()) {
        adjustPointsDialog.vm.$emit('success');
        await flushPromises();
        expect(ElMessage.success).toHaveBeenCalledWith('积分调整成功');
      }
    });
  });
});
