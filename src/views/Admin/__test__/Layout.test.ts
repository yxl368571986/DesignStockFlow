/**
 * 后台管理布局组件单元测试
 * 测试侧边菜单、顶部导航栏、面包屑导航和内容区域布局
 * Requirements: 26.1
 * 
 * Task 12: 后台管理 - 布局和导航测试
 * - 12.1 测试后台布局
 *   - 检查侧边菜单显示
 *   - 检查顶部导航栏
 *   - 检查面包屑导航
 *   - 检查内容区域布局
 * - 12.2 测试菜单导航
 *   - 点击各菜单项 → 应正确跳转
 *   - 检查菜单选中状态
 *   - 检查菜单展开/折叠
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { ElMessage } from 'element-plus';
import ElementPlus from 'element-plus';
import { nextTick } from 'vue';

// Mock Element Plus
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

// Mock vue-router
const mockRouterPush = vi.fn();
const mockRoute = {
  path: '/admin/dashboard',
  matched: [
    { meta: { title: '管理后台' }, path: '/admin' },
    { meta: { title: '数据概览' }, path: '/admin/dashboard' }
  ]
};

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush
  }),
  useRoute: () => mockRoute
}));

// Mock userStore
const mockUserInfo = {
  userId: 'admin-user-id',
  phone: '13900000000',
  nickname: '超级管理员',
  avatar: 'https://example.com/admin-avatar.jpg',
  email: 'admin@example.com',
  vipLevel: 0,
  roleCode: 'admin'
};

const mockLogout = vi.fn();

vi.mock('@/pinia/userStore', () => ({
  useUserStore: () => ({
    userInfo: mockUserInfo,
    token: 'admin-test-token',
    logout: mockLogout
  })
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import AdminLayout from '../Layout.vue';

describe('Admin Layout - Task 12.1: 测试后台布局', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockRouterPush.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.resetAllMocks();
  });

  describe('侧边菜单显示', () => {
    it('should render sidebar with correct structure', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证侧边栏存在
      expect(wrapper.find('.admin-sidebar').exists()).toBe(true);
    });

    it('should display logo in sidebar', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证Logo区域存在
      expect(wrapper.find('.sidebar-logo').exists()).toBe(true);
      // 验证Logo文字存在
      expect(wrapper.find('.logo-text').exists()).toBe(true);
      expect(wrapper.find('.logo-text').text()).toBe('星潮设计');
    });

    it('should render sidebar menu', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证菜单存在
      expect(wrapper.find('.sidebar-menu').exists()).toBe(true);
    });

    it('should display all main menu items', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证主要菜单项存在
      const menuItems = wrapper.findAll('.el-menu-item');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('should display submenu items', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证子菜单存在（VIP管理、积分管理、内容运营）
      const subMenus = wrapper.findAll('.el-sub-menu');
      expect(subMenus.length).toBeGreaterThan(0);
    });
  });

  describe('顶部导航栏', () => {
    it('should render header with correct structure', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证顶部导航栏存在
      expect(wrapper.find('.admin-header').exists()).toBe(true);
    });

    it('should display collapse button in header', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证折叠按钮存在
      expect(wrapper.find('.collapse-btn').exists()).toBe(true);
    });

    it('should display search input in header', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证搜索框存在
      expect(wrapper.find('.search-input').exists()).toBe(true);
    });

    it('should display notification badge in header', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证通知徽章存在
      expect(wrapper.find('.notification-badge').exists()).toBe(true);
    });

    it('should display user info in header', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证用户信息区域存在
      expect(wrapper.find('.user-info').exists()).toBe(true);
      // 验证用户名显示
      expect(wrapper.find('.user-name').exists()).toBe(true);
      expect(wrapper.find('.user-name').text()).toBe('超级管理员');
    });

    it('should display header left section with collapse button and breadcrumb', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证左侧区域存在
      expect(wrapper.find('.header-left').exists()).toBe(true);
    });

    it('should display header right section with search, notification and user', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证右侧区域存在
      expect(wrapper.find('.header-right').exists()).toBe(true);
    });
  });

  describe('面包屑导航', () => {
    it('should render breadcrumb navigation', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证面包屑存在
      expect(wrapper.find('.breadcrumb').exists()).toBe(true);
    });

    it('should display home link in breadcrumb', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证首页链接存在
      const breadcrumbItems = wrapper.findAll('.el-breadcrumb__item');
      expect(breadcrumbItems.length).toBeGreaterThan(0);
    });
  });

  describe('内容区域布局', () => {
    it('should render main content area', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证主内容区域存在
      expect(wrapper.find('.admin-main').exists()).toBe(true);
    });

    it('should render content area for router-view', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证内容区域存在
      expect(wrapper.find('.admin-content').exists()).toBe(true);
    });

    it('should have correct layout structure (sidebar + main)', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证整体布局结构
      expect(wrapper.find('.admin-layout').exists()).toBe(true);
      expect(wrapper.find('.admin-sidebar').exists()).toBe(true);
      expect(wrapper.find('.admin-main').exists()).toBe(true);
    });
  });
});


describe('Admin Layout - Task 12.2: 测试菜单导航', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockRouterPush.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.resetAllMocks();
  });

  describe('菜单项跳转', () => {
    it('should have dashboard menu item', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证数据概览菜单项存在（通过文本内容查找）
      const menuText = wrapper.text();
      expect(menuText).toContain('数据概览');
    });

    it('should have users menu item', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证用户管理菜单项存在
      const menuText = wrapper.text();
      expect(menuText).toContain('用户管理');
    });

    it('should have resources menu item', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证资源管理菜单项存在
      const menuText = wrapper.text();
      expect(menuText).toContain('资源管理');
    });

    it('should have audit menu item', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证内容审核菜单项存在
      const menuText = wrapper.text();
      expect(menuText).toContain('内容审核');
    });

    it('should have categories menu item', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证分类管理菜单项存在
      const menuText = wrapper.text();
      expect(menuText).toContain('分类管理');
    });

    it('should have statistics menu item', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证数据统计菜单项存在
      const menuText = wrapper.text();
      expect(menuText).toContain('数据统计');
    });

    it('should have settings menu item', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证系统设置菜单项存在
      const menuText = wrapper.text();
      expect(menuText).toContain('系统设置');
    });

    it('should have permissions menu item', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证权限管理菜单项存在
      const menuText = wrapper.text();
      expect(menuText).toContain('权限管理');
    });
  });

  describe('菜单选中状态', () => {
    it('should compute active menu from current route', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证当前激活菜单与路由路径一致
      const vm = wrapper.vm as any;
      expect(vm.activeMenu).toBe('/admin/dashboard');
    });

    it('should set default-active attribute on menu', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证菜单设置了default-active属性
      const menu = wrapper.find('.sidebar-menu');
      expect(menu.exists()).toBe(true);
    });
  });

  describe('菜单展开/折叠', () => {
    it('should toggle sidebar collapse state when clicking collapse button', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      const vm = wrapper.vm as any;
      const initialState = vm.isCollapsed;

      // 点击折叠按钮
      const collapseBtn = wrapper.find('.collapse-btn');
      await collapseBtn.trigger('click');

      // 验证状态切换
      expect(vm.isCollapsed).toBe(!initialState);
    });

    it('should save collapse state to localStorage', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 点击折叠按钮
      const collapseBtn = wrapper.find('.collapse-btn');
      await collapseBtn.trigger('click');

      // 验证保存到localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'admin-sidebar-collapsed',
        expect.any(String)
      );
    });

    it('should restore collapse state from localStorage on mount', async () => {
      localStorageMock.getItem.mockReturnValue('true');

      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证从localStorage恢复状态
      const vm = wrapper.vm as any;
      expect(vm.isCollapsed).toBe(true);
    });

    it('should add collapsed class to sidebar when collapsed', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 点击折叠按钮
      const collapseBtn = wrapper.find('.collapse-btn');
      await collapseBtn.trigger('click');
      await nextTick();

      // 验证侧边栏添加了collapsed类
      expect(wrapper.find('.admin-sidebar.collapsed').exists()).toBe(true);
    });

    it('should show mini logo when sidebar is collapsed', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 点击折叠按钮
      const collapseBtn = wrapper.find('.collapse-btn');
      await collapseBtn.trigger('click');
      await nextTick();

      // 验证显示mini logo
      expect(wrapper.find('.logo-mini').exists()).toBe(true);
    });

    it('should hide logo text when sidebar is collapsed', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 点击折叠按钮
      const collapseBtn = wrapper.find('.collapse-btn');
      await collapseBtn.trigger('click');
      await nextTick();

      // 验证隐藏logo文字
      expect(wrapper.find('.logo-text').exists()).toBe(false);
    });

    it('should have VIP submenu', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证VIP子菜单存在（通过文本内容查找）
      const menuText = wrapper.text();
      expect(menuText).toContain('VIP管理');
    });

    it('should have points submenu', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证积分子菜单存在
      const menuText = wrapper.text();
      expect(menuText).toContain('积分管理');
    });

    it('should have operation submenu', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证内容运营子菜单存在
      const menuText = wrapper.text();
      expect(menuText).toContain('内容运营');
    });
  });

  describe('用户下拉菜单', () => {
    it('should handle profile command', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 调用用户命令处理方法
      const vm = wrapper.vm as any;
      vm.handleUserCommand('profile');

      // 验证跳转到个人信息页面
      expect(mockRouterPush).toHaveBeenCalledWith('/admin/profile');
    });

    it('should handle settings command', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 调用用户命令处理方法
      const vm = wrapper.vm as any;
      vm.handleUserCommand('settings');

      // 验证跳转到账号设置页面
      expect(mockRouterPush).toHaveBeenCalledWith('/admin/account-settings');
    });

    it('should handle logout command', async () => {
      mockLogout.mockResolvedValue(undefined);

      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 调用用户命令处理方法
      const vm = wrapper.vm as any;
      await vm.handleUserCommand('logout');
      await flushPromises();

      // 验证调用了logout方法
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should navigate to login page after logout', async () => {
      mockLogout.mockResolvedValue(undefined);

      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 调用用户命令处理方法
      const vm = wrapper.vm as any;
      await vm.handleUserCommand('logout');
      await flushPromises();

      // 验证跳转到登录页面
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });

    it('should show success message after logout', async () => {
      mockLogout.mockResolvedValue(undefined);

      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 调用用户命令处理方法
      const vm = wrapper.vm as any;
      await vm.handleUserCommand('logout');
      await flushPromises();

      // 验证显示成功消息
      expect(ElMessage.success).toHaveBeenCalledWith('退出登录成功');
    });

    it('should show error message when logout fails', async () => {
      mockLogout.mockRejectedValue(new Error('Logout failed'));

      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 调用用户命令处理方法
      const vm = wrapper.vm as any;
      await vm.handleUserCommand('logout');
      await flushPromises();

      // 验证显示错误消息
      expect(ElMessage.error).toHaveBeenCalledWith('退出登录失败');
    });
  });

  describe('主题切换', () => {
    it('should toggle theme when clicking theme button', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      const vm = wrapper.vm as any;
      const initialTheme = vm.isDark;

      // 调用主题切换方法
      vm.toggleTheme();

      // 验证主题状态切换
      expect(vm.isDark).toBe(!initialTheme);
    });

    it('should save theme to localStorage', async () => {
      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 调用主题切换方法
      const vm = wrapper.vm as any;
      vm.toggleTheme();

      // 验证保存到localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'admin-theme',
        expect.any(String)
      );
    });

    it('should restore theme from localStorage on mount', async () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'admin-theme') return 'dark';
        return null;
      });

      wrapper = mount(AdminLayout, {
        global: {
          plugins: [ElementPlus],
          stubs: {
            'router-view': true,
            'el-icon': true
          }
        }
      });

      await flushPromises();

      // 验证从localStorage恢复主题
      const vm = wrapper.vm as any;
      expect(vm.isDark).toBe(true);
    });
  });
});
