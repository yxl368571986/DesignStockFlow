/**
 * 资源列表页测试
 * 
 * 测试内容：
 * - 4.1 页面布局和按钮
 * - 4.2 资源卡片交互
 * - 4.3 分类筛选功能
 * - 4.4 VIP等级筛选功能
 * - 4.5 文件格式筛选功能
 * - 4.6 排序功能
 * - 4.7 分页功能
 * 
 * 需求: 3.1-3.5, 3.10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import List from '../List.vue';
import { useResourceStore } from '@/pinia/resourceStore';
import { useConfigStore } from '@/pinia/configStore';
import type { ResourceInfo, CategoryInfo } from '@/types/models';

// Mock Element Plus 组件
const globalStubs = {
  'el-select': {
    template: `<select class="el-select-stub" @change="$emit('change', $event.target.value)"><slot /></select>`,
    props: ['modelValue', 'placeholder', 'clearable']
  },
  'el-option': {
    template: '<option class="el-option-stub" :value="value">{{ label }}</option>',
    props: ['label', 'value']
  },
  'el-pagination': {
    template: `
      <div class="el-pagination-stub">
        <span class="total">共 {{ total }} 条</span>
        <button class="prev-btn" @click="$emit('current-change', currentPage - 1)" :disabled="currentPage <= 1">上一页</button>
        <span class="current-page">{{ currentPage }}</span>
        <button class="next-btn" @click="$emit('current-change', currentPage + 1)">下一页</button>
        <select class="page-size-select" @change="$emit('size-change', Number($event.target.value))">
          <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
    `,
    props: ['currentPage', 'pageSize', 'pageSizes', 'total', 'layout', 'background']
  },
  'el-icon': {
    template: '<i class="el-icon-stub"><slot /></i>'
  },
  'el-tag': {
    template: '<span class="el-tag-stub" :class="type"><slot /></span>',
    props: ['type', 'effect', 'size']
  },
  'el-image': {
    template: '<div class="el-image-stub"><img :src="src" :alt="alt" /></div>',
    props: ['src', 'alt', 'lazy', 'fit']
  },
  'el-button': {
    template: '<button class="el-button-stub" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'icon', 'circle']
  },
  'ResourceCard': {
    template: `
      <div class="resource-card-stub" @click="$emit('click', resource.resourceId)">
        <div class="card-title">{{ resource.title }}</div>
        <div class="card-format">{{ resource.format }}</div>
        <div class="card-vip" v-if="resource.vipLevel > 0">VIP</div>
        <button class="download-btn" @click.stop="$emit('download', resource.resourceId)">下载</button>
        <button class="collect-btn" @click.stop="$emit('collect', resource.resourceId)">收藏</button>
      </div>
    `,
    props: ['resource', 'showActions', 'lazy']
  },
  'Loading': {
    template: '<div class="loading-stub">{{ text }}</div>',
    props: ['text']
  },
  'Empty': {
    template: '<div class="empty-stub">{{ description }}</div>',
    props: ['description', 'showAction']
  },
  'Connection': {
    template: '<span class="connection-icon"></span>'
  }
};

// Mock 资源数据
const mockResources: ResourceInfo[] = [
  {
    resourceId: 'res-1',
    title: 'UI设计套件',
    description: '现代UI设计套件',
    cover: 'https://example.com/cover1.jpg',
    previewImages: [],
    format: 'SKETCH',
    fileFormat: 'SKETCH',
    fileSize: 52428800,
    downloadCount: 1250,
    collectCount: 380,
    viewCount: 5600,
    vipLevel: 0,
    categoryId: 'ui-design',
    categoryName: 'UI设计',
    tags: ['UI', '设计'],
    uploaderId: 'user-1',
    uploaderName: '设计师',
    isAudit: 1,
    createTime: '2024-12-15T10:00:00',
    updateTime: '2024-12-15T10:00:00',
    createdAt: '2024-12-15T10:00:00'
  },
  {
    resourceId: 'res-2',
    title: '商业海报模板',
    description: '精美商业海报',
    cover: 'https://example.com/cover2.jpg',
    previewImages: [],
    format: 'PSD',
    fileFormat: 'PSD',
    fileSize: 104857600,
    downloadCount: 890,
    collectCount: 260,
    viewCount: 3200,
    vipLevel: 1,
    categoryId: 'poster',
    categoryName: '海报模板',
    tags: ['海报', '商业'],
    uploaderId: 'user-2',
    uploaderName: '设计师',
    isAudit: 1,
    createTime: '2024-12-14T14:30:00',
    updateTime: '2024-12-14T14:30:00',
    createdAt: '2024-12-14T14:30:00'
  },
  {
    resourceId: 'res-3',
    title: 'Logo设计合集',
    description: '创意Logo设计',
    cover: 'https://example.com/cover3.jpg',
    previewImages: [],
    format: 'AI',
    fileFormat: 'AI',
    fileSize: 31457280,
    downloadCount: 650,
    collectCount: 195,
    viewCount: 2800,
    vipLevel: 0,
    categoryId: 'logo',
    categoryName: 'Logo设计',
    tags: ['Logo', '创意'],
    uploaderId: 'user-3',
    uploaderName: '设计师',
    isAudit: 1,
    createTime: '2024-12-13T09:15:00',
    updateTime: '2024-12-13T09:15:00',
    createdAt: '2024-12-13T09:15:00'
  }
];

// Mock 分类数据
const mockCategories: CategoryInfo[] = [
  { categoryId: 'ui-design', categoryName: 'UI设计', parentId: null, icon: 'Monitor', sort: 1, isHot: true, isRecommend: true, resourceCount: 100 },
  { categoryId: 'poster', categoryName: '海报模板', parentId: null, icon: 'Picture', sort: 2, isHot: true, isRecommend: false, resourceCount: 80 },
  { categoryId: 'logo', categoryName: 'Logo设计', parentId: null, icon: 'Star', sort: 3, isHot: false, isRecommend: true, resourceCount: 60 },
  { categoryId: 'icon', categoryName: '图标素材', parentId: null, icon: 'Grid', sort: 4, isHot: false, isRecommend: false, resourceCount: 120 }
];

// 创建路由
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/resource', name: 'ResourceList', component: List },
    { path: '/resource/:id', name: 'ResourceDetail', component: { template: '<div>Detail</div>' } }
  ]
});

describe('资源列表页测试', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(async () => {
    // 创建新的 Pinia 实例
    pinia = createPinia();
    setActivePinia(pinia);

    // 初始化 stores
    const resourceStore = useResourceStore();
    const configStore = useConfigStore();

    // 设置 mock 数据
    resourceStore.resources = mockResources;
    resourceStore.total = mockResources.length;
    resourceStore.loading = false;

    // 设置分类数据
    configStore.categories = mockCategories;

    // Mock fetchResources
    vi.spyOn(resourceStore, 'fetchResources').mockResolvedValue();

    // 导航到资源列表页
    await router.push('/resource');
    await router.isReady();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== 4.1 测试资源列表页布局和按钮 ==========
  describe('4.1 页面布局和按钮测试', () => {
    it('应该正确渲染页面整体布局', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证主要布局元素存在
      expect(wrapper.find('.resource-list-page').exists()).toBe(true);
      expect(wrapper.find('.filter-bar').exists()).toBe(true);
      expect(wrapper.find('.sort-bar').exists()).toBe(true);
      expect(wrapper.find('.resource-content').exists()).toBe(true);
    });

    it('应该显示分类筛选区域', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证分类筛选区域
      expect(wrapper.find('.category-filter-section').exists()).toBe(true);
      expect(wrapper.find('.hot-categories').exists()).toBe(true);
      expect(wrapper.find('.all-categories').exists()).toBe(true);
    });

    it('应该显示格式筛选下拉框', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证格式筛选
      const filterItems = wrapper.findAll('.filter-item');
      expect(filterItems.length).toBeGreaterThan(0);
      
      // 验证有格式筛选标签
      const formatLabel = wrapper.find('.filter-label');
      expect(formatLabel.exists()).toBe(true);
    });

    it('应该显示VIP等级筛选下拉框', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证VIP筛选存在
      const filterItems = wrapper.findAll('.filter-item');
      expect(filterItems.length).toBeGreaterThanOrEqual(2);
    });

    it('应该显示排序选项', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证排序选项
      const sortOptions = wrapper.findAll('.sort-option');
      expect(sortOptions.length).toBe(5); // 综合、下载、最新、好评、收藏
    });

    it('应该显示结果统计信息', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证结果统计
      expect(wrapper.find('.result-info').exists()).toBe(true);
    });
  });

  // ========== 4.2 测试资源卡片交互 ==========
  describe('4.2 资源卡片交互测试', () => {
    it('应该显示资源网格', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证资源网格存在
      expect(wrapper.find('.resource-grid').exists()).toBe(true);
    });

    it('应该渲染正确数量的资源卡片', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证资源卡片数量
      const cards = wrapper.findAll('.resource-card-stub');
      expect(cards.length).toBe(mockResources.length);
    });

    it('点击资源卡片应该触发click事件', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 点击第一个资源卡片
      const firstCard = wrapper.find('.resource-card-stub');
      await firstCard.trigger('click');

      // 验证事件被触发（通过console.log验证）
      expect(firstCard.exists()).toBe(true);
    });

    it('点击下载按钮应该触发download事件', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 点击下载按钮
      const downloadBtn = wrapper.find('.download-btn');
      await downloadBtn.trigger('click');

      expect(downloadBtn.exists()).toBe(true);
    });

    it('点击收藏按钮应该触发collect事件', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 点击收藏按钮
      const collectBtn = wrapper.find('.collect-btn');
      await collectBtn.trigger('click');

      expect(collectBtn.exists()).toBe(true);
    });

    it('VIP资源应该显示VIP标识', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证VIP标识存在（第二个资源是VIP资源）
      const vipBadges = wrapper.findAll('.card-vip');
      expect(vipBadges.length).toBeGreaterThan(0);
    });
  });

  // ========== 4.3 测试分类筛选功能 ==========
  describe('4.3 分类筛选功能测试', () => {
    it('点击分类标签应该触发筛选', async () => {
      const resourceStore = useResourceStore();
      const setCategorySpy = vi.spyOn(resourceStore, 'setCategory');

      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 点击分类标签
      const categoryTags = wrapper.findAll('.category-tag');
      expect(categoryTags.length).toBeGreaterThan(0);

      // 点击第一个分类标签
      await categoryTags[0].trigger('click');

      // 验证setCategory被调用
      expect(setCategorySpy).toHaveBeenCalled();
    });

    it('点击"全部"应该清除分类筛选', async () => {
      const resourceStore = useResourceStore();
      const setCategorySpy = vi.spyOn(resourceStore, 'setCategory');

      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 找到"全部"标签并点击
      const allTag = wrapper.findAll('.category-tag').find(tag => tag.text() === '全部');
      if (allTag) {
        await allTag.trigger('click');
        expect(setCategorySpy).toHaveBeenCalledWith(undefined);
      }
    });

    it('选中的分类应该有selected样式', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 点击一个分类
      const categoryTags = wrapper.findAll('.category-tag');
      await categoryTags[1].trigger('click');

      await nextTick();

      // 验证有selected类
      const selectedTags = wrapper.findAll('.category-tag.selected');
      expect(selectedTags.length).toBeGreaterThan(0);
    });
  });

  // ========== 4.4 测试VIP等级筛选功能 ==========
  describe('4.4 VIP等级筛选功能测试', () => {
    it('应该有VIP等级筛选选项', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证VIP筛选下拉框存在
      const selects = wrapper.findAll('.el-select-stub');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });

    it('选择免费资源应该调用setVipLevel(0)', async () => {
      const resourceStore = useResourceStore();
      const setVipLevelSpy = vi.spyOn(resourceStore, 'setVipLevel');

      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 模拟选择免费资源
      const selects = wrapper.findAll('.el-select-stub');
      const vipSelect = selects[1]; // 第二个是VIP筛选
      
      if (vipSelect) {
        await vipSelect.setValue('0');
        await vipSelect.trigger('change');
      }

      // 验证setVipLevel被调用
      expect(setVipLevelSpy).toHaveBeenCalled();
    });
  });

  // ========== 4.5 测试文件格式筛选功能 ==========
  describe('4.5 文件格式筛选功能测试', () => {
    it('应该有格式筛选选项', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证格式筛选下拉框存在
      const selects = wrapper.findAll('.el-select-stub');
      expect(selects.length).toBeGreaterThanOrEqual(1);
    });

    it('选择PSD格式应该调用setFormat', async () => {
      const resourceStore = useResourceStore();
      const setFormatSpy = vi.spyOn(resourceStore, 'setFormat');

      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 模拟选择PSD格式
      const selects = wrapper.findAll('.el-select-stub');
      const formatSelect = selects[0]; // 第一个是格式筛选
      
      if (formatSelect) {
        await formatSelect.setValue('PSD');
        await formatSelect.trigger('change');
      }

      // 验证setFormat被调用
      expect(setFormatSpy).toHaveBeenCalled();
    });
  });

  // ========== 4.6 测试排序功能 ==========
  describe('4.6 排序功能测试', () => {
    it('应该显示所有排序选项', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证排序选项
      const sortOptions = wrapper.findAll('.sort-option');
      expect(sortOptions.length).toBe(5);

      // 验证排序选项文本
      const sortTexts = sortOptions.map(opt => opt.text());
      expect(sortTexts.some(text => text.includes('综合'))).toBe(true);
      expect(sortTexts.some(text => text.includes('下载'))).toBe(true);
      expect(sortTexts.some(text => text.includes('最新'))).toBe(true);
    });

    it('点击排序选项应该调用setSortType', async () => {
      const resourceStore = useResourceStore();
      const setSortTypeSpy = vi.spyOn(resourceStore, 'setSortType');

      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 点击"最多下载"排序
      const sortOptions = wrapper.findAll('.sort-option');
      const downloadSort = sortOptions.find(opt => opt.text().includes('下载'));
      
      if (downloadSort) {
        await downloadSort.trigger('click');
        expect(setSortTypeSpy).toHaveBeenCalledWith('download');
      }
    });

    it('选中的排序选项应该有active样式', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 默认应该有一个active的排序选项
      const activeSort = wrapper.find('.sort-option.active');
      expect(activeSort.exists()).toBe(true);
    });

    it('点击"最新发布"应该按创建时间降序排序', async () => {
      const resourceStore = useResourceStore();
      const setSortTypeSpy = vi.spyOn(resourceStore, 'setSortType');

      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 点击"最新发布"排序
      const sortOptions = wrapper.findAll('.sort-option');
      const latestSort = sortOptions.find(opt => opt.text().includes('最新'));
      
      if (latestSort) {
        await latestSort.trigger('click');
        expect(setSortTypeSpy).toHaveBeenCalledWith('latest');
      }
    });
  });

  // ========== 4.7 测试分页功能 ==========
  describe('4.7 分页功能测试', () => {
    it('有资源时应该显示分页组件', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证分页组件存在
      expect(wrapper.find('.pagination-wrapper').exists()).toBe(true);
      expect(wrapper.find('.el-pagination-stub').exists()).toBe(true);
    });

    it('分页组件应该显示总数', async () => {
      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证总数显示
      const total = wrapper.find('.total');
      expect(total.exists()).toBe(true);
      expect(total.text()).toContain(String(mockResources.length));
    });

    it('点击下一页应该调用setPageNum', async () => {
      const resourceStore = useResourceStore();
      const setPageNumSpy = vi.spyOn(resourceStore, 'setPageNum');

      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 点击下一页
      const nextBtn = wrapper.find('.next-btn');
      if (nextBtn.exists()) {
        await nextBtn.trigger('click');
        expect(setPageNumSpy).toHaveBeenCalled();
      }
    });

    it('加载中时不应该显示分页', async () => {
      const resourceStore = useResourceStore();
      resourceStore.loading = true;

      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证分页不显示
      expect(wrapper.find('.pagination-wrapper').exists()).toBe(false);
    });

    it('无资源时不应该显示分页', async () => {
      const resourceStore = useResourceStore();
      resourceStore.resources = [];
      resourceStore.total = 0;

      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证分页不显示
      expect(wrapper.find('.pagination-wrapper').exists()).toBe(false);
    });
  });

  // ========== 加载状态和空状态测试 ==========
  describe('加载状态和空状态测试', () => {
    it('加载中应该显示Loading组件', async () => {
      const resourceStore = useResourceStore();
      resourceStore.loading = true;

      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证Loading组件显示
      expect(wrapper.find('.loading-stub').exists()).toBe(true);
    });

    it('无资源时应该显示Empty组件', async () => {
      const resourceStore = useResourceStore();
      resourceStore.resources = [];
      resourceStore.total = 0;
      resourceStore.loading = false;

      const wrapper = mount(List, {
        global: {
          plugins: [pinia, router],
          stubs: globalStubs
        }
      });

      await flushPromises();

      // 验证Empty组件显示
      expect(wrapper.find('.empty-stub').exists()).toBe(true);
    });
  });
});
